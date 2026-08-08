export const BILLING_CATEGORIES = [
  'refrigerator', 'ac', 'washing', 'bulb',
  'fan', 'tv', 'iron', 'microwave',
  'rice', 'pot', 'kettle', 'vacuum',
];

export const RATES = [
  { limit: 50, rate: 50 },
  { limit: 50, rate: 100 },
  { limit: 100, rate: 150 },
  { limit: Infinity, rate: 300 },
];

export const parseWatt = (wattStr = '') => {
  const match = String(wattStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export const parseTimeToHours = (timeStr = '') => {
  const hrMatch = String(timeStr).match(/(\d+)\s*hr/);
  const minMatch = String(timeStr).match(/(\d+)\s*min/);
  const hours = hrMatch ? parseInt(hrMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  return hours + minutes / 60;
};

export const calculateMeterBill = (totalUnits) => {
  let remaining = Math.max(Number(totalUnits) || 0, 0);
  let totalCost = 0;

  for (const tier of RATES) {
    if (remaining <= 0) break;
    const unitsInTier = Math.min(remaining, tier.limit);
    totalCost += unitsInTier * tier.rate;
    remaining -= unitsInTier;
  }

  return totalCost;
};

export const summarizeUsageBill = (getUsage) => {
  let dailyUnits = 0;
  let monthlyUnits = 0;
  const allItems = [];

  BILLING_CATEGORIES.forEach((category) => {
    const specs = getUsage(category);
    if (specs && specs.length > 0) {
      specs.forEach((spec) => {
        const watt = parseWatt(spec.watt);
        const hoursPerDay = parseTimeToHours(spec.time);
        const daily = (watt * hoursPerDay) / 1000;
        const monthly = daily * 30;
        dailyUnits += daily;
        monthlyUnits += monthly;
      });
    }
  });

  const totalDailyCost = calculateMeterBill(dailyUnits);
  const totalMonthlyCost = calculateMeterBill(monthlyUnits);

  BILLING_CATEGORIES.forEach((category) => {
    const specs = getUsage(category);
    if (specs && specs.length > 0) {
      specs.forEach((spec) => {
        const watt = parseWatt(spec.watt);
        const hoursPerDay = parseTimeToHours(spec.time);
        const daily = (watt * hoursPerDay) / 1000;
        const monthly = daily * 30;
        const itemDailyCost = dailyUnits > 0 ? (daily / dailyUnits) * totalDailyCost : 0;
        const itemMonthlyCost = monthlyUnits > 0 ? (monthly / monthlyUnits) * totalMonthlyCost : 0;

        allItems.push({
          id: spec.id,
          name: spec.name,
          watt: spec.watt,
          time: spec.time,
          category: category,
          hoursPerDay,
          dailyUnits: daily,
          monthlyUnits: monthly,
          dailyCost: itemDailyCost,
          monthlyCost: itemMonthlyCost,
        });
      });
    }
  });

  return {
    allItems,
    totalDailyUnits: dailyUnits,
    totalMonthlyUnits: monthlyUnits,
    totalDailyCost,
    totalMonthlyCost,
  };
};

export const formatUnits = (units) => {
  const value = Number(units) || 0;
  if (value === 0) return '0';
  if (value < 1) {
    return parseFloat(value.toFixed(2)).toString();
  }
  return parseFloat(value.toFixed(1)).toString();
};

export const formatCost = (cost) => {
  return Math.round(Number(cost) || 0).toLocaleString();
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

export const getForecast = (getUsage, dailyRecords, monthlyBudget) => {
  const now = new Date();
  const today = now.getDate();
  const totalDays = getDaysInMonth(now.getFullYear(), now.getMonth() + 1);
  const daysRemaining = totalDays - today;

  const bill = summarizeUsageBill(getUsage);
  const currentDailyUnits = bill.totalDailyUnits;
  const currentDailyCost = bill.totalDailyCost;

  let actualUnits = 0;
  let actualCost = 0;
  dailyRecords.forEach((r) => {
    actualUnits += r.units || 0;
    actualCost += r.cost || 0;
  });

  const projectedUnits = currentDailyUnits * daysRemaining;
  const projectedCost = currentDailyCost * daysRemaining;

  const estimatedUnits = actualUnits + projectedUnits;
  const estimatedCost = actualCost + projectedCost;
  const overBudget = estimatedCost - monthlyBudget;

  return {
    currentDailyUnits,
    currentDailyCost,
    actualUnits,
    actualCost,
    projectedUnits,
    projectedCost,
    estimatedUnits,
    estimatedCost,
    daysRemaining,
    totalDays,
    today,
    isOverBudget: overBudget > 0,
    overBudgetAmount: Math.max(0, overBudget),
    daysWithData: dailyRecords.length,
  };
};

export const generateRecommendation = (devices) => {
  if (!devices || devices.length === 0) {
    return 'Add device usage to get personalized recommendations.';
  }

  let top = null;
  let maxKwh = 0;

  devices.forEach((d) => {
    const w = parseWatt(d.watt);
    const h = parseTimeToHours(d.time);
    const kwh = (w * h) / 1000;
    if (kwh > maxKwh) {
      maxKwh = kwh;
      top = d;
    }
  });

  if (!top) return 'Add device usage to get personalized recommendations.';

  const hours = parseTimeToHours(top.time);
  let reduce = 0.5;
  if (hours >= 8) reduce = 3;
  else if (hours >= 5) reduce = 2;
  else if (hours >= 2) reduce = 1;

  const reduceText = Number.isInteger(reduce)
    ? `${reduce} hr${reduce > 1 ? 's' : ''}`
    : `${reduce} hr`;

  const potentialSavings = Math.round(maxKwh * 30 * 50);
  return `Reduce ${top.name} usage by ${reduceText}/day to save ~${potentialSavings.toLocaleString()} MMK/mo`;
};

export const getBudgetStatus = (estimatedCost, monthlyBudget) => {
  const diff = estimatedCost - monthlyBudget;
  if (diff > 0) {
    return {
      isOverBudget: true,
      overBudgetAmount: diff,
      alertMessage: `You are ${diff.toLocaleString()} MMK over your budget.`,
      alertType: 'warning',
    };
  }
  return {
    isOverBudget: false,
    overBudgetAmount: 0,
    alertMessage: 'You are within the budget.',
    alertType: 'success',
  };
};

// ============================================================
// Detailed Recommendations
// ============================================================
export function generateDetailedRecommendations(getUsage, dailyRecords, monthlyBudget) {
  const forecast = getForecast(getUsage, dailyRecords, monthlyBudget);

  if (!forecast.isOverBudget) {
    return { isOverBudget: false, recommendations: [], targetSavings: 0 };
  }

  const targetSavings = forecast.overBudgetAmount;
  const { allItems } = summarizeUsageBill(getUsage);

  let accumulated = 0;
  const out = [];

  const ranked = [...allItems]
    .filter((d) => d.monthlyCost > 0 && d.hoursPerDay > 0)
    .sort((a, b) => b.monthlyCost - a.monthlyCost);

  for (const d of ranked) {
    if (accumulated >= targetSavings) break;

    let savedHrs = Math.round(d.hoursPerDay * 0.20 * 2) / 2;
    if (savedHrs < 0.5) savedHrs = Math.min(0.5, d.hoursPerDay);

    const ratio = savedHrs / d.hoursPerDay;
    let savedCost = Math.round(d.monthlyCost * ratio);

    
    const remainingNeeded = targetSavings - accumulated;
    if (savedCost > remainingNeeded) {
      savedCost = Math.max(0, remainingNeeded);
    }

    if (savedCost <= 0) break;

    out.push({
      id: d.id,
      categoryId: d.category,
      name: d.name,
      iconType: d.category,
      recommendation: `Reduce ${d.name} usage by ${savedHrs} hrs/day.`,
      savings: savedCost,
    });
    accumulated += savedCost;
  }

  return { isOverBudget: true, targetSavings, recommendations: out };
}