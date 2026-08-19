'use strict';

/**
 * recordController.js
 *
 * Thin HTTP handlers for the /api/records endpoints.
 * All business logic lives in timelineService.js.
 */

const {
  saveUsageRecord,
  generateMonthlyTimeline,
  calculateMonthlyEstimate,
  getLatestRecord,
} = require('../services/timelineService');

// ─── POST /api/records ────────────────────────────────────────────────────────
/**
 * Save a new usage record (snapshot of the user's current appliance config).
 *
 * Body: { effectiveDate, appliances, notes? }
 * Auth: req.usageUserKey (set by usageAuth middleware)
 */
async function saveRecord(req, res) {
  try {
    const { effectiveDate, appliances, notes } = req.body;

    // ── Validate required fields ─────────────────────────────────────────────
    if (!effectiveDate) {
      return res.status(400).json({ message: 'effectiveDate is required' });
    }

    if (!Array.isArray(appliances)) {
      return res.status(400).json({ message: 'appliances must be an array' });
    }

    // ── Delegate to service ──────────────────────────────────────────────────
    const record = await saveUsageRecord(
      req.usageUserKey,
      effectiveDate,
      appliances,
      notes || ''
    );

    return res.status(201).json({ success: true, record });
  } catch (err) {
    // Surface validation errors as 400, unexpected errors as 500
    if (
      err.message.includes('YYYY-MM-DD') ||
      err.message.includes('future')
    ) {
      return res.status(400).json({ message: err.message });
    }
    console.error('[recordController.saveRecord]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── GET /api/records/timeline ────────────────────────────────────────────────
/**
 * Get the full daily timeline for a given month.
 *
 * Query: ?month=YYYY-MM   (defaults to current month if omitted)
 */
async function getTimeline(req, res) {
  try {
    const { month } = req.query;

    // ── Parse month param ────────────────────────────────────────────────────
    const { year, monthNum } = parseMonthParam(month);
    if (!year) {
      return res.status(400).json({ message: 'Invalid month. Use YYYY-MM format.' });
    }

    const result = await generateMonthlyTimeline(req.usageUserKey, year, monthNum);

    return res.json({
      month:             `${year}-${String(monthNum).padStart(2, '0')}`,
      hasData:           result.hasData,
      coverageStartDate: result.coverageStart,
      totalMonthDays:    result.daysInMonth,
      coveredDays:       result.timeline.length,
      uncoveredDays:     result.daysInMonth - result.timeline.length,
      timeline:          result.timeline,
    });
  } catch (err) {
    console.error('[recordController.getTimeline]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── GET /api/records/estimate ────────────────────────────────────────────────
/**
 * Get the monthly bill estimate for a given month.
 *
 * Query: ?month=YYYY-MM   (defaults to current month if omitted)
 */
async function getEstimate(req, res) {
  try {
    const { month } = req.query;

    const { year, monthNum } = parseMonthParam(month);
    if (!year) {
      return res.status(400).json({ message: 'Invalid month. Use YYYY-MM format.' });
    }

    const estimate = await calculateMonthlyEstimate(req.usageUserKey, year, monthNum);
    return res.json(estimate);
  } catch (err) {
    console.error('[recordController.getEstimate]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── GET /api/records/latest ──────────────────────────────────────────────────
/**
 * Returns the most recently effective usage record for the authenticated user.
 * Used by the Home screen to display the current appliance configuration.
 */
async function getLatest(req, res) {
  try {
    const record = await getLatestRecord(req.usageUserKey);
    if (!record) {
      return res.json({ hasData: false, record: null });
    }
    return res.json({ hasData: true, record });
  } catch (err) {
    console.error('[recordController.getLatest]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Parses a "YYYY-MM" string into { year, monthNum }.
 * Falls back to the current month if the param is missing or invalid.
 *
 * @param {string|undefined} monthParam
 * @returns {{ year: number, monthNum: number } | { year: null, monthNum: null }}
 */
function parseMonthParam(monthParam) {
  if (!monthParam) {
    // Default to current month
    const now = new Date();
    return { year: now.getFullYear(), monthNum: now.getMonth() + 1 };
  }

  const match = String(monthParam).match(/^(\d{4})-(\d{2})$/);
  if (!match) return { year: null, monthNum: null };

  const year = parseInt(match[1], 10);
  const monthNum = parseInt(match[2], 10);

  if (monthNum < 1 || monthNum > 12) return { year: null, monthNum: null };

  return { year, monthNum };
}

module.exports = { saveRecord, getTimeline, getEstimate, getLatest };
