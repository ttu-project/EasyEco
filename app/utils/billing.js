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

  // Step 1: Accumulate total daily and monthly units across all categories and specs
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

  // Step 2: Round total units to match app-wide logic
  const current = Math.round(dailyUnits);
  const estimated = current * 30;

  // Step 3: Compute aggregate meter bill using tier thresholds
  const totalDailyCost = calculateMeterBill(current);
  const totalMonthlyCost = calculateMeterBill(estimated);

  // Step 4: Map individual items with prorated costs based on total units ratio
  BILLING_CATEGORIES.forEach((category) => {
    const specs = getUsage(category);
    if (specs && specs.length > 0) {
      specs.forEach((spec) => {
        const watt = parseWatt(spec.watt);
        const hoursPerDay = parseTimeToHours(spec.time);
        
        const daily = (watt * hoursPerDay) / 1000;
        const monthly = daily * 30;

        const itemDailyCost = dailyUnits > 0 
          ? (daily / dailyUnits) * totalDailyCost 
          : 0;
        const itemMonthlyCost = monthlyUnits > 0 
          ? (monthly / monthlyUnits) * totalMonthlyCost 
          : 0;

        allItems.push({
          id: spec.id,
          name: spec.name,
          watt: spec.watt,
          dailyUnits: Math.round(daily),
          monthlyUnits: Math.round(monthly),
          dailyCost: Math.round(itemDailyCost),
          monthlyCost: Math.round(itemMonthlyCost),
        });
      });
    }
  });

  return {
    allItems,
    totalDailyUnits: current,
    totalMonthlyUnits: estimated,
    totalDailyCost,
    totalMonthlyCost,
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