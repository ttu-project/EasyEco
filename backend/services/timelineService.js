'use strict';

/**
 * timelineService.js
 *
 * Core algorithm for EasyEco's usage tracking system.
 *
 * Principle: Only user-submitted records are stored in the database.
 * Missing days are filled dynamically at query time using the last known
 * appliance configuration. Nothing is written to the DB during calculation.
 *
 * Myanmar tiered billing rates (MMK per kWh) — must stay in sync with
 * the frontend billing.js RATES array:
 *   0–50 kWh   → 50 MMK/kWh
 *   51–100     → 100 MMK/kWh
 *   101–200    → 150 MMK/kWh
 *   200+       → 300 MMK/kWh
 */

const UsageRecord = require('../models/UsageRecord');

// ─── Billing Tiers (mirrors frontend billing.js) ─────────────────────────────
const BILLING_TIERS = [
  { limit: 50, rate: 50 },
  { limit: 50, rate: 100 },
  { limit: 100, rate: 150 },
  { limit: Infinity, rate: 300 },
];

// ─── Watt / Time Parsers (mirrors frontend billing.js) ───────────────────────
/**
 * Parses a wattage string like "1500W" or "75" into a number.
 * Returns 0 on failure — never throws.
 */
function parseWatt(wattStr) {
  const match = String(wattStr || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parses a time string like "8 hr", "30 min", or "8 hr 30 min" into hours.
 * Returns 0 on failure — never throws.
 */
function parseTimeToHours(timeStr) {
  const s = String(timeStr || '');
  const hrMatch = s.match(/(\d+)\s*hr/);
  const minMatch = s.match(/(\d+)\s*min/);
  const hours = hrMatch ? parseInt(hrMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  return hours + minutes / 60;
}

/**
 * Computes kWh for one appliance per day.
 * Formula: (watts / 1000) × hours
 */
function computeDailyKwh(watt, time) {
  return (parseWatt(watt) / 1000) * parseTimeToHours(time);
}

// ─── Myanmar Tiered Bill Calculation ─────────────────────────────────────────
/**
 * Calculates electricity cost in MMK for a given number of kWh units.
 * Uses the same tiered structure as billing.js calculateMeterBill().
 *
 * @param {number} totalKwh
 * @returns {number} cost in MMK (integer)
 */
function calculateMeterBill(totalKwh) {
  const units = Math.max(Number(totalKwh) || 0, 0);
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

// ─── Date Utilities ───────────────────────────────────────────────────────────
/**
 * Returns the number of days in a given month.
 * month is 1-indexed (1 = January).
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // new Date(year, month, 0) = last day of prev month+1
}

/**
 * Pads a number to 2 digits: 7 → "07"
 */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Formats a year/month/day into "YYYY-MM-DD".
 */
function formatDate(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// ─── Deduplication ───────────────────────────────────────────────────────────
/**
 * Given an array of UsageRecord documents that may have multiple entries for
 * the same effectiveDate, returns one record per date — the one with the
 * latest createdAt (i.e. the last save the user made on that date).
 *
 * Result is sorted by effectiveDate ASC.
 *
 * @param {Array} records - Raw UsageRecord documents from MongoDB
 * @returns {Array} Deduplicated, sorted array
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
 * Builds a complete day-by-day timeline for the given month.
 *
 * Algorithm:
 *  1. Fetch all submitted records within the month.
 *  2. Fetch the most recent record from before the month (for carry-forward).
 *  3. Deduplicate: if the user saved multiple records on the same date, the
 *     latest createdAt wins.
 *  4. Walk from coverageStart to monthEnd day-by-day:
 *     - If a submitted record exists for this date → use it (source: "submitted")
 *     - Otherwise → carry forward the last known record (source: "carried_forward")
 *  5. Dates before the user's first-ever record are OMITTED (no data).
 *
 * Nothing is written to the database during this computation.
 *
 * @param {string} userKey - The usageUserKey (userId string)
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {Promise<Object>} Timeline result
 */
async function generateMonthlyTimeline(userKey, year, month) {
  const monthStart = formatDate(year, month, 1);
  const daysInMonth = getDaysInMonth(year, month);
  const monthEnd = formatDate(year, month, daysInMonth);

  // ── Fetch records within the month ──────────────────────────────────────────
  const rawMonthRecords = await UsageRecord.find({
    $or: [{ user: userKey }, { userId: userKey }],
    effectiveDate: { $gte: monthStart, $lte: monthEnd },
  })
    .sort({ effectiveDate: 1, createdAt: 1 })
    .lean();

  // ── Fetch the most recent record before this month ───────────────────────────
  // This enables carry-forward across month boundaries.
  const priorRecord = await UsageRecord.findOne({
    $or: [{ user: userKey }, { userId: userKey }],
    effectiveDate: { $lt: monthStart },
  })
    .sort({ effectiveDate: -1, createdAt: -1 })
    .lean();

  // ── Deduplicate month records (latest createdAt per effectiveDate wins) ──────
  const monthRecords = deduplicate(rawMonthRecords);

  if (!priorRecord && monthRecords.length === 0) {
    return {
      timeline: [],
      coverageStart: null,
      monthStart,
      monthEnd,
      daysInMonth,
      hasData: false,
    };
  }

  // ── Determine baseline record for Day 1 ──────────────────────────────────────
  // If priorRecord exists, use it as baseline for day 1.
  // Else if monthRecords exist, use monthRecords[0] as baseline for earlier days (mid-month backfill).
  const baselineRecord = priorRecord || monthRecords[0];
  const firstRecordDate = priorRecord ? monthStart : monthRecords[0].effectiveDate;

  // ── Walk day-by-day from 1 to daysInMonth (Full Month Coverage) ─────────────
  const timeline = [];
  let recordIndex = 0;
  let currentRecord = baselineRecord;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);

    // Advance to any submitted record(s) on or before this date
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
      date: dateStr,
      source,
      recordId: currentRecord._id,
      appliances: currentRecord.appliances,
      dailyKwh: currentRecord.totalDailyKwh,
    });
  }

  return {
    timeline,
    coverageStart: monthStart,
    firstRecordDate,
    monthStart,
    monthEnd,
    daysInMonth,
    hasData: true,
  };
}

// ─── Core: Calculate Monthly Estimate ────────────────────────────────────────
/**
 * Calculates the monthly electricity bill estimate for the given month.
 *
 * Steps:
 *  1. Generate the full daily timeline.
 *  2. Compress consecutive same-record days into "periods" for display.
 *  3. Sum totalKwh across all periods.
 *  4. Apply Myanmar tiered billing to get MMK cost.
 *
 * @param {string} userKey
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {Promise<Object>} Estimate result
 */
async function calculateMonthlyEstimate(userKey, year, month) {
  const result = await generateMonthlyTimeline(userKey, year, month);

  if (!result.hasData) {
    return {
      hasData: false,
      month: `${year}-${pad2(month)}`,
      totalKwh: 0,
      estimatedBill: 0,
      currency: 'MMK',
      periods: [],
      coveredDays: 0,
      totalMonthDays: result.daysInMonth || getDaysInMonth(year, month),
      isPartialMonth: true,
    };
  }

  const { timeline, coverageStart, monthEnd, daysInMonth } = result;

  // ── Compress timeline into display periods ────────────────────────────────
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

  // ── Sum total kWh ──────────────────────────────────────────────────────────
  const totalKwh = parseFloat(
    periods.reduce((sum, p) => sum + p.periodKwh, 0).toFixed(4)
  );

  // ── Apply tiered billing ───────────────────────────────────────────────────
  const estimatedBill = calculateMeterBill(totalKwh);

  return {
    hasData: true,
    month: `${year}-${pad2(month)}`,
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

// ─── Save New Usage Record ────────────────────────────────────────────────────
/**
 * Creates a new immutable usage record (snapshot).
 *
 * Business rules enforced here:
 *  - effectiveDate cannot be more than 1 day in the future (clock drift allowed)
 *  - dailyKwh is computed server-side from each appliance's watt × time
 *  - totalDailyKwh is the sum of all appliance dailyKwh values
 *  - Always INSERT — never update or overwrite existing records
 *
 * @param {string} userKey
 * @param {string} effectiveDate - "YYYY-MM-DD"
 * @param {Array}  appliances    - Array of { id, category, name, watt, time }
 * @param {string} notes
 * @returns {Promise<Object>} The saved UsageRecord document
 */
async function saveUsageRecord(userKey, effectiveDate, appliances = [], notes = '') {
  // ── Validate effectiveDate format ──────────────────────────────────────────
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
    throw new Error('effectiveDate must be in YYYY-MM-DD format');
  }

  // ── Guard against far-future dates (allow 1 day for timezone flexibility) ──
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(
    tomorrow.getFullYear(),
    tomorrow.getMonth() + 1,
    tomorrow.getDate()
  );
  if (effectiveDate > tomorrowStr) {
    throw new Error('effectiveDate cannot be more than 1 day in the future');
  }

  // ── Compute dailyKwh per appliance server-side ─────────────────────────────
  const enrichedAppliances = (appliances || []).map((a, idx) => {
    const dailyKwh = computeDailyKwh(a.watt, a.time);
    return {
      id:       String(a.id || a._id || `app-${idx}-${Date.now()}`),
      category: String(a.category || ''),
      name:     String(a.name || ''),
      watt:     String(a.watt || '0W'),
      time:     String(a.time || '0 hr'),
      dailyKwh: parseFloat(dailyKwh.toFixed(6)),
    };
  });

  const totalDailyKwh = parseFloat(
    enrichedAppliances.reduce((sum, a) => sum + a.dailyKwh, 0).toFixed(6)
  );

  // ── Always INSERT (never update) ───────────────────────────────────────────
  const record = await UsageRecord.create({
    user:          userKey,
    userId:        userKey,
    effectiveDate,
    appliances:    enrichedAppliances,
    totalDailyKwh,
    notes:         String(notes || '').trim(),
  });

  return record;
}

// ─── Get Latest Record ────────────────────────────────────────────────────────
/**
 * Returns the most recently effective usage record for a user.
 * "Most recently effective" = highest effectiveDate, then latest createdAt.
 *
 * @param {string} userKey
 * @returns {Promise<Object|null>}
 */
async function getLatestRecord(userKey) {
  return UsageRecord.findOne({
    $or: [{ user: userKey }, { userId: userKey }],
  })
    .sort({ effectiveDate: -1, createdAt: -1 })
    .lean();
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  saveUsageRecord,
  generateMonthlyTimeline,
  calculateMonthlyEstimate,
  getLatestRecord,
  // Exported for unit testing
  _internal: {
    parseWatt,
    parseTimeToHours,
    computeDailyKwh,
    calculateMeterBill,
    deduplicate,
    getDaysInMonth,
    formatDate,
  },
};
