import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import React, { useMemo } from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import { useUsage } from '../Usage/UsageContext';
import { getForecast, summarizeUsageBill } from '../utils/billing';

export default function Dashboard() {
  const { getUsage, dailyRecords, monthlyBudget, isReady } = useUsage();

  /* ── budget numbers (same source of truth as Home card) ── */
  const forecast = getForecast(getUsage, dailyRecords, monthlyBudget);
  const estimatedCost = forecast.estimatedCost;
  
  // Raw percentage for over-budget checks, capped percentage for display
  const rawPercentage = monthlyBudget > 0 ? Math.round((estimatedCost / monthlyBudget) * 100) : 0;
  const displayPercentage = Math.min(rawPercentage, 100);
  const isOverBudget = rawPercentage > 100;
  const remaining = Math.max(monthlyBudget - estimatedCost, 0);

  /* ── consumption breakdown (same source of truth as UsageDetail) ── */
  const breakdown = useMemo(() => {
    const { allItems } = summarizeUsageBill(getUsage);
    const items = allItems
      .filter((d) => d.monthlyUnits > 0)
      .map((d) => ({
        id: d.id,
        name: d.name,
        monthlyUnits: d.monthlyUnits,
      }));

    const total = items.reduce((s, d) => s + d.monthlyUnits, 0);
    return items
      .map((d) => ({
        ...d,
        percentage: total > 0 ? Math.round((d.monthlyUnits / total) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [getUsage]);

  /* ── circular progress ── */
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * displayPercentage) / 100;
  const ringColor = isOverBudget ? '#EF4444' : '#22C55E';

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Top Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Budget Progress</Text>

          <View style={styles.circleWrap}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <G rotation="-90" originX={size / 2} originY={size / 2}>
                <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
                <Circle
                  cx={size / 2} cy={size / 2} r={r}
                  stroke={ringColor} strokeWidth={stroke} fill="none"
                  strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                />
              </G>
            </Svg>
            <View style={styles.circleText}>
              <Text style={styles.percentText}>{displayPercentage}%</Text>
              <Text style={styles.percentSub}>of budget used</Text>
            </View>
          </View>

          <Text style={[styles.status, { color: isOverBudget ? '#DC2626' : '#059669' }]}>
            {isOverBudget ? 'You have exceeded your budget.' : "Great job! You're within your budget."}
          </Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Estimated Bill</Text>
              <Text style={styles.rowSub}>This month</Text>
            </View>
            <Text style={styles.rowValue}>{estimatedCost.toLocaleString()} MMK</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Budget</Text>
              <Text style={styles.rowSub}>Monthly budget</Text>
            </View>
            <Text style={styles.rowValue}>{monthlyBudget.toLocaleString()} MMK</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Remaining</Text>
              <Text style={styles.rowSub}>Left to spend</Text>
            </View>
            <Text style={[styles.rowValue, { color: remaining <= 0 ? '#DC2626' : '#111827' }]}>
              {remaining.toLocaleString()} MMK
            </Text>
          </View>
        </View>

        {/* ── Bottom Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estimated Monthly Consumption</Text>

          {breakdown.length === 0 && (
            <Text style={styles.empty}>No usage data yet. Add devices to see breakdown.</Text>
          )}

          {breakdown.map((item) => (
            <View key={item.id} style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownName}>{item.name}</Text>
                <Text style={styles.breakdownPercent}>{item.percentage}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(item.percentage, 100)}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },

  circleWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  circleText: { position: 'absolute', alignItems: 'center' },
  percentText: { fontSize: 28, fontWeight: '800', color: '#111827' },
  percentSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  status: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginBottom: 16 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  rowValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

  empty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginVertical: 12 },

  breakdownItem: { marginBottom: 14 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  breakdownName: { fontSize: 13, color: '#374151', fontWeight: '500' },
  breakdownPercent: { fontSize: 13, color: '#111827', fontWeight: '700' },
  track: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#2167E1', borderRadius: 4 },
});