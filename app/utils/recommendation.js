import { getForecast } from './billing';

function parseWatt(wattStr) {
  if (!wattStr) return 0;
  const m = String(wattStr).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseHours(timeStr) {
  if (!timeStr) return 0;
  const hr = String(timeStr).match(/(\d+)\s*hr/);
  const mn = String(timeStr).match(/(\d+)\s*min/);
  return (hr ? parseInt(hr[1], 10) : 0) + (mn ? parseInt(mn[1], 10) / 60 : 0);
}

export function generateDetailedRecommendations(devices, dailyRecords, monthlyBudget) {
  const forecast = getForecast(devices, dailyRecords, monthlyBudget);
  if (!forecast.isOverBudget) {
    return { isOverBudget: false, recommendations: [], targetSavings: 0 };
  }

  const targetSavings = forecast.overBudgetAmount;

  // Derive the REAL average cost per unit from your existing forecast
  // so the math always matches your bill card.
  const avgCostPerUnit =
    forecast.estimatedUnits > 0
      ? forecast.estimatedCost / forecast.estimatedUnits
      : 0;

  let accumulated = 0;
  const out = [];

  const ranked = devices
    .map((d) => {
      const w = parseWatt(d.watt);
      const h = parseHours(d.time);
      const monthlyUnits = (w * h * 30) / 1000;
      const monthlyCost = monthlyUnits * avgCostPerUnit;
      return { ...d, wattNum: w, hoursNum: h, monthlyUnits, monthlyCost };
    })
    .sort((a, b) => b.monthlyCost - a.monthlyCost);

  for (const d of ranked) {
    if (accumulated >= targetSavings) break;
    if (d.monthlyCost <= 0 || d.hoursNum <= 0) continue;

    // Suggest reducing ~20% of daily usage (rounded to nearest 0.5 hr)
    let savedHrs = Math.round(d.hoursNum * 0.20 * 2) / 2;
    if (savedHrs < 0.5) savedHrs = Math.min(0.5, d.hoursNum);

    // Proportional savings based on the SAME rate as your bill card
    const ratio = savedHrs / d.hoursNum;
    let savedCost = Math.round(d.monthlyCost * ratio);

    // Safety cap: don't suggest saving more than 1.5× the over-budget total
    if (accumulated + savedCost > targetSavings * 1.5 && out.length >= 1) {
      savedCost = Math.max(0, Math.round(targetSavings - accumulated));
      if (savedCost <= 0) break;
    }

    if (savedCost > 0) {
      out.push({
        id: d.id,
        categoryId: d.categoryId,
        name: d.name,
        iconType: d.iconType || d.categoryId,
        recommendation: `Reduce ${d.name} usage by ${savedHrs} hrs/day.`,
        savings: savedCost,
      });
      accumulated += savedCost;
    }
  }

  return { isOverBudget: true, targetSavings, recommendations: out };
}