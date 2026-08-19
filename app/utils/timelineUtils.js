/**
 * timelineUtils.js
 *
 * Pure frontend timeline generation — mirrors the backend timelineService.js algorithm.
 *
 * Used for:
 *  1. Optimistic UI updates on the Home screen immediately after the user presses Save
 *     (before the server response arrives).
 *  2. Offline/cached display when the server is unreachable.
 *
 * This function NEVER writes to any storage or makes network requests.
 * It is a deterministic, pure computation over an array of usage records.
 */

// ─── Watt / Time Parsers (mirrors backend timelineService.js) ─────────────────
/**
 * Extracts the numeric wattage from a string like "1500W" or "75".
 */
export function parseWatt(wattStr) {
  const match = String(wattStr || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Extracts total hours from a string like "8 hr", "30 min", or "8 hr 30 min".
 */
export function parseTimeToHours(timeStr) {
  const s = String(timeStr || '');
  const hrMatch = s.match(/(\d+)\s*hr/);
  const minMatch = s.match(/(\d+)\s*min/);
  return (hrMatch ? parseInt(hrMatch[1], 10) : 0) +
         (minMatch ? parseInt(minMatch[1], 10) / 60 : 0);
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────
/**
 * Returns "YYYY-MM-DD" for a JS Date in LOCAL time (not UTC).
 * Using local time is critical so the date shown matches the user's calendar.
 */
export function toLocalDateString(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's local date as "YYYY-MM-DD".
 */
export function todayLocalString() {
  return toLocalDateString(new Date());
}

/**
 * Returns the number of days in a month.
 * @param {number} year
 * @param {number} month - 1-indexed
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// ─── Core: Deduplicate ────────────────────────────────────────────────────────
/**
 * Given an array of usage records that may have multiple entries for the same
 * effectiveDate, returns one record per date — the one with the latest createdAt.
 *
 * @param {Array} records
 * @returns {Array} Deduplicated, sorted by effectiveDate ASC
 */
function deduplicate(records) {
  const map = {};
  for (const r of records) {
    const key = r.effectiveDate;
    if (!map[key] || new Date(r.createdAt) > new Date(map[key].createdAt)) {
      map[key] = r;
    }
  }
  return Object.values(map).sort((a, b) =>
    a.effectiveDate.localeCompare(b.effectiveDate)
  );
}

// ─── Core: Generate Monthly Timeline ─────────────────────────────────────────
/**
 * Generates a complete day-by-day timeline for a given month from an array of
 * usage records. Mirrors the backend generateMonthlyTimeline() exactly.
 *
 * Records from ALL months should be passed in — the function will:
 *  - Filter to the relevant month
 *  - Find the most recent prior-month record for carry-forward
 *  - Walk day-by-day from coverage start to month end
 *
 * @param {Array}  allRecords - All usage records for the user (any month)
 * @param {number} year
 * @param {number} month - 1-indexed (1 = January)
 * @returns {{
 *   timeline: Array,
 *   coverageStart: string|null,
 *   hasData: boolean,
 *   daysInMonth: number,
 * }}
 */
export function generateFrontendTimeline(allRecords, year, month) {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(year, month);
  const monthStart = `${monthStr}-01`;
  const monthEnd = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  if (!allRecords || allRecords.length === 0) {
    return { timeline: [], coverageStart: null, hasData: false, daysInMonth };
  }

  // ── Split into: within-month records and prior records ────────────────────
  const rawMonthRecords = allRecords.filter(
    (r) => r.effectiveDate >= monthStart && r.effectiveDate <= monthEnd
  );

  const priorRecords = allRecords.filter((r) => r.effectiveDate < monthStart);
  const priorRecord = priorRecords.sort((a, b) => {
    // Sort descending by effectiveDate, then by createdAt
    if (b.effectiveDate !== a.effectiveDate)
      return b.effectiveDate.localeCompare(a.effectiveDate);
    return new Date(b.createdAt) - new Date(a.createdAt);
  })[0] || null;

  // ── Deduplicate month records ──────────────────────────────────────────────
  const monthRecords = deduplicate(rawMonthRecords);

  if (!priorRecord && monthRecords.length === 0) {
    return { timeline: [], coverageStart: null, hasData: false, daysInMonth };
  }

  // ── Determine baseline record for Day 1 ────────────────────────────────────
  const baselineRecord = priorRecord || monthRecords[0];
  const firstRecordDate = priorRecord ? monthStart : monthRecords[0].effectiveDate;

  // ── Walk day-by-day 1 to daysInMonth (Full Month Coverage) ─────────────────
  const timeline = [];
  let recordIndex = 0;
  let currentRecord = baselineRecord;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;

    // Advance to submitted record(s) on or before this date
    while (
      recordIndex < monthRecords.length &&
      monthRecords[recordIndex].effectiveDate <= dateStr
    ) {
      currentRecord = monthRecords[recordIndex];
      recordIndex++;
    }

    let source = 'carried_forward';
    if (monthRecords.some((r) => r.effectiveDate === dateStr)) {
      source = 'submitted';
    } else if (dateStr < firstRecordDate) {
      source = 'backfilled';
    }

    timeline.push({
      date:       dateStr,
      source,
      recordId:   currentRecord._id,
      appliances: currentRecord.appliances,
      dailyKwh:   currentRecord.totalDailyKwh,
    });
  }

  return { timeline, coverageStart: monthStart, firstRecordDate, hasData: true, daysInMonth };
}

// ─── Core: Calculate Monthly Estimate (Frontend) ──────────────────────────────
/**
 * Calculates the monthly bill estimate from a set of usage records.
 * Uses the same Myanmar tiered rates as billing.js calculateMeterBill().
 *
 * @param {Array}  allRecords
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {Object} estimate
 */
export function calculateFrontendEstimate(allRecords, year, month) {
  const { timeline, coverageStart, hasData, daysInMonth } = generateFrontendTimeline(
    allRecords, year, month
  );

  if (!hasData) {
    return {
      hasData: false,
      month: `${year}-${String(month).padStart(2, '0')}`,
      totalKwh: 0,
      estimatedBill: 0,
      currency: 'MMK',
      periods: [],
      coveredDays: 0,
      totalMonthDays: daysInMonth,
      isPartialMonth: true,
    };
  }

  // ── Compress into periods ──────────────────────────────────────────────────
  const periods = [];
  let currentPeriod = null;

  for (const entry of timeline) {
    const recordIdStr = String(entry.recordId);
    if (!currentPeriod || recordIdStr !== currentPeriod.recordId) {
      if (currentPeriod) periods.push(currentPeriod);
      currentPeriod = {
        from: entry.date,
        to: entry.date,
        days: 1,
        dailyKwh: entry.dailyKwh,
        periodKwh: entry.dailyKwh,
        recordId: recordIdStr,
      };
    } else {
      currentPeriod.to = entry.date;
      currentPeriod.days += 1;
      currentPeriod.periodKwh = parseFloat(
        (currentPeriod.periodKwh + entry.dailyKwh).toFixed(6)
      );
    }
  }
  if (currentPeriod) periods.push(currentPeriod);

  // ── Sum kWh ────────────────────────────────────────────────────────────────
  const totalKwh = parseFloat(
    periods.reduce((sum, p) => sum + p.periodKwh, 0).toFixed(4)
  );

  // ── Myanmar tiered billing (mirrors billing.js calculateMeterBill) ──────────
  const estimatedBill = calculateMeterBillFrontend(totalKwh);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthEnd = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  return {
    hasData: true,
    month: monthStr,
    coverageFrom: coverageStart,
    coverageTo: monthEnd,
    coveredDays: timeline.length,
    totalMonthDays: daysInMonth,
    isPartialMonth: timeline.length < daysInMonth,
    totalKwh,
    estimatedBill,
    currency: 'MMK',
    periods,
  };
}

// ─── Myanmar Tiered Billing (Frontend mirror of billing.js) ──────────────────
const BILLING_TIERS = [
  { limit: 50, rate: 50 },
  { limit: 50, rate: 100 },
  { limit: 100, rate: 150 },
  { limit: Infinity, rate: 300 },
];

function calculateMeterBillFrontend(totalKwh) {
  const units = Number(totalKwh) || 0;
  if (units <= 0) return 0;

  let remaining = units;
  let totalCost = 0;
  for (const tier of BILLING_TIERS) {
    if (remaining <= 0) break;
    const unitsInTier = Math.min(remaining, tier.limit);
    totalCost += unitsInTier * tier.rate;
    remaining -= unitsInTier;
  }
  const serviceFee = units <= 15 ? 40 : 120;
  return Math.round(totalCost + serviceFee);
}

// ─── Build Snapshot from Current Usage Data ───────────────────────────────────
/**
 * Converts the current usageData (from UsageContext) into the appliances array
 * format expected by POST /api/records.
 *
 * @param {Object} usageData - { category: [{id, name, watt, time}, ...] }
 * @returns {Array} appliances
 */
export function buildAppliancesSnapshot(usageData) {
  const BILLING_CATEGORIES = [
    'refrigerator', 'ac', 'washing', 'bulb',
    'fan', 'tv', 'iron', 'microwave',
    'rice', 'pot', 'kettle', 'vacuum',
  ];

  const appliances = [];
  BILLING_CATEGORIES.forEach((category) => {
    const items = usageData[category] || [];
    items.forEach((item) => {
      appliances.push({
        id:       String(item.id || ''),
        category,
        name:     item.name,
        watt:     item.watt,
        time:     item.time,
      });
    });
  });
  return appliances;
}
