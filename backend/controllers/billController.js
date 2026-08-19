'use strict';

const Usage = require('../models/Usage');
const UsageRecord = require('../models/UsageRecord');
const {
  calculateMonthlyEstimate,
  generateMonthlyTimeline,
  getLatestRecord,
  _internal: {
    parseWatt,
    parseTimeToHours,
    computeDailyKwh,
    calculateMeterBill,
    deduplicate,
    getDaysInMonth,
    formatDate,
  },
} = require('../services/timelineService');

/**
 * Calculates current consumption, estimated monthly total, and tiered bill.
 * Supports POST /api/bill/calculate and GET /api/usage/estimated-total
 */
async function calculateBill(req, res) {
  try {
    const userKey = req.usageUserKey || req.userId;
    if (!userKey) {
      return res.status(401).json({ message: 'Login required' });
    }

    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const today = now.getDate();
    const daysInMonth = getDaysInMonth(year, month);
    const daysRemaining = Math.max(0, daysInMonth - today);

    // 1. Fetch user's active appliances from Usage collection
    const activeUsage = await Usage.find({ user: userKey }).lean();
    let liveDailyUnits = 0;
    const itemizedAppliances = [];

    activeUsage.forEach((item) => {
      const dailyKwh = computeDailyKwh(item.watt, item.time);
      liveDailyUnits += dailyKwh;
      itemizedAppliances.push({
        id: item._id,
        category: item.category,
        name: item.name,
        watt: item.watt,
        time: item.time,
        dailyUnits: parseFloat(dailyKwh.toFixed(4)),
        monthlyUnits: parseFloat((dailyKwh * daysInMonth).toFixed(4)),
      });
    });

    liveDailyUnits = parseFloat(liveDailyUnits.toFixed(4));
    const liveDailyCost = calculateMeterBill(liveDailyUnits);

    // 2. Fetch timeline and historical records
    const monthStart = formatDate(year, month, 1);
    const monthEnd = formatDate(year, month, daysInMonth);
    const todayStr = formatDate(year, month, today);

    const rawMonthRecords = await UsageRecord.find({
      $or: [{ user: userKey }, { userId: userKey }],
      effectiveDate: { $gte: monthStart, $lte: monthEnd },
    })
      .sort({ effectiveDate: 1, createdAt: 1 })
      .lean();

    const priorRecord = await UsageRecord.findOne({
      $or: [{ user: userKey }, { userId: userKey }],
      effectiveDate: { $lt: monthStart },
    })
      .sort({ effectiveDate: -1, createdAt: -1 })
      .lean();

    const monthRecords = deduplicate(rawMonthRecords);

    // If no active appliances and no records, return 0
    if (itemizedAppliances.length === 0 && monthRecords.length === 0 && !priorRecord) {
      return res.json({
        hasData: false,
        month: `${year}-${String(month).padStart(2, '0')}`,
        currentDailyUnits: 0,
        currentDailyCost: 0,
        currentUnits: 0,
        currentCost: 0,
        estimatedUnits: 0,
        estimatedCost: 0,
        daysRemaining,
        daysInMonth,
        today,
        appliances: [],
        recommendations: [],
      });
    }

    // 3. Full-Month Simulation (Days 1 to daysInMonth)
    // Rule 4 (Mid-Month User): Backfill earlier days using the first submitted record.
    // Rule 3 (Missing-Day Logic): Carry forward latest submitted value until a new update.
    let baselineDailyKwh = liveDailyUnits > 0 ? liveDailyUnits : 0;
    if (priorRecord) {
      baselineDailyKwh = priorRecord.totalDailyKwh;
    } else if (monthRecords.length > 0) {
      baselineDailyKwh = monthRecords[0].totalDailyKwh;
    }

    let currentCarryingKwh = baselineDailyKwh;
    let recordIdx = 0;
    let totalMonthKwh = 0;
    let todayKwh = liveDailyUnits > 0 ? liveDailyUnits : baselineDailyKwh;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);

      while (
        recordIdx < monthRecords.length &&
        monthRecords[recordIdx].effectiveDate <= dateStr
      ) {
        currentCarryingKwh = monthRecords[recordIdx].totalDailyKwh;
        recordIdx++;
      }

      let dayKwh = currentCarryingKwh;
      if (dateStr === todayStr && liveDailyUnits > 0) {
        currentCarryingKwh = liveDailyUnits;
        dayKwh = liveDailyUnits;
      }

      totalMonthKwh += dayKwh;

      if (dateStr === todayStr) {
        todayKwh = dayKwh;
      }
    }

    // Rule 1: Current Usage = actual electricity usage for today only
    const currentUnits = parseFloat(todayKwh.toFixed(2));
    const currentCost = calculateMeterBill(currentUnits);

    // Rule 2, 4, 5: Estimated Total = entire current month
    const estimatedUnits = parseFloat(totalMonthKwh.toFixed(2));
    const estimatedCost = calculateMeterBill(estimatedUnits);

    // 5. Itemize costs
    const enrichedAppliances = itemizedAppliances.map((item) => {
      const ratio = liveDailyUnits > 0 ? item.dailyUnits / liveDailyUnits : 0;
      return {
        ...item,
        dailyCost: Math.round(ratio * liveDailyCost),
        monthlyCost: Math.round(ratio * estimatedCost),
      };
    });

    // 6. Generate energy recommendations
    let topAppliance = null;
    let maxDailyKwh = 0;
    for (const app of enrichedAppliances) {
      if (app.dailyUnits > maxDailyKwh) {
        maxDailyKwh = app.dailyUnits;
        topAppliance = app;
      }
    }

    let recommendation = 'Add device usage to get personalized recommendations.';
    if (topAppliance) {
      const hours = parseTimeToHours(topAppliance.time);
      let reduceHours = 0.5;
      if (hours >= 8) reduceHours = 3;
      else if (hours >= 5) reduceHours = 2;
      else if (hours >= 2) reduceHours = 1;

      const reduceText = Number.isInteger(reduceHours)
        ? `${reduceHours} hr${reduceHours > 1 ? 's' : ''}`
        : `${reduceHours} hr`;
      const potentialSavings = Math.round((topAppliance.dailyUnits / (hours || 1)) * reduceHours * 30 * 50);
      recommendation = `Reduce ${topAppliance.name} usage by ${reduceText}/day to save ~${potentialSavings.toLocaleString()} MMK/mo`;
    }

    return res.json({
      hasData: true,
      month: `${year}-${String(month).padStart(2, '0')}`,
      currentDailyUnits: liveDailyUnits,
      currentDailyCost: liveDailyCost,
      currentUnits,
      currentCost,
      estimatedUnits,
      estimatedCost,
      daysRemaining,
      daysInMonth,
      today,
      recommendation,
      appliances: enrichedAppliances,
    });
  } catch (error) {
    console.error('[billController.calculateBill]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Returns complete dashboard state in a single call for fast initialization.
 * GET /api/dashboard
 */
async function getDashboardData(req, res) {
  try {
    const userKey = req.usageUserKey || req.userId;
    if (!userKey) {
      return res.status(401).json({ message: 'Login required' });
    }

    return calculateBill(req, res);
  } catch (error) {
    console.error('[billController.getDashboardData]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  calculateBill,
  getDashboardData,
};
