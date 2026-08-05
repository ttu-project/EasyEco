import { getForecast, summarizeUsageBill } from './billing';

export function generateDetailedRecommendations(getUsage, dailyRecords, monthlyBudget) {
  const forecast = getForecast(getUsage, dailyRecords, monthlyBudget);

  if (!forecast.isOverBudget) {
    return { isOverBudget: false, recommendations: [], targetSavings: 0 };
  }

  const targetSavings = forecast.overBudgetAmount;
  const { allItems } = summarizeUsageBill(getUsage);

  const avgCostPerUnit =
    forecast.estimatedUnits > 0
      ? forecast.estimatedCost / forecast.estimatedUnits
      : 0;

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

    if (accumulated + savedCost > targetSavings * 1.5 && out.length >= 1) {
      savedCost = Math.max(0, Math.round(targetSavings - accumulated));
      if (savedCost <= 0) break;
    }

    if (savedCost > 0) {
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
  }

  return { isOverBudget: true, targetSavings, recommendations: out };
}