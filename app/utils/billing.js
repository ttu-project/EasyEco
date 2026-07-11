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

export const buildUsageBillItems = (getUsage) => {
  const allItems = [];

  BILLING_CATEGORIES.forEach((category) => {
    const specs = getUsage(category);

    if (specs && specs.length > 0) {
      specs.forEach((spec) => {
        const watt = parseWatt(spec.watt);
        const hours = parseTimeToHours(spec.time);
        const dailyUnits = (watt * hours) / 1000;
        const monthlyUnits = dailyUnits * 30;

        allItems.push({
          id: spec.id,
          name: spec.name,
          watt: spec.watt,
          dailyUnits,
          monthlyUnits,
          dailyCost: calculateMeterBill(dailyUnits),
          monthlyCost: calculateMeterBill(monthlyUnits),
        });
      });
    }
  });

  return allItems;
};

export const summarizeUsageBill = (getUsage) => {
  const allItems = buildUsageBillItems(getUsage);
  const totalDailyUnitsRaw = allItems.reduce((sum, item) => sum + item.dailyUnits, 0);
  const totalMonthlyUnitsRaw = allItems.reduce((sum, item) => sum + item.monthlyUnits, 0);
  const totalDailyUnits = Math.round(totalDailyUnitsRaw);
  const totalMonthlyUnits = Math.round(totalMonthlyUnitsRaw);

  return {
    allItems,
    totalDailyUnits,
    totalMonthlyUnits,
    totalDailyCost: calculateMeterBill(totalDailyUnits),
    totalMonthlyCost: calculateMeterBill(totalMonthlyUnits),
  };
};

export const formatUnits = (units) => {
  const value = Number(units) || 0;
  if (value > 0 && value < 1) {
    return value.toFixed(2);
  }
  return Math.round(value).toString();
};

export const formatCost = (cost) => Math.round(Number(cost) || 0).toLocaleString();
