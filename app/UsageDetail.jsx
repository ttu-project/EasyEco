import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useUsage } from './Usage/UsageContext';

// ===== HELPERS =====

const parseWatt = (wattStr) => {
  const match = wattStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

const parseTimeToHours = (timeStr) => {
  const hrMatch = timeStr.match(/(\d+)\s*hr/);
  const minMatch = timeStr.match(/(\d+)\s*min/);
  const hours = hrMatch ? parseInt(hrMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  return hours + (minutes / 60);
};

const calculateMeterBill = (totalUnits) => {
  let remaining = totalUnits;
  let totalCost = 0;
  const rates = [
    { limit: 50, rate: 50 },
    { limit: 50, rate: 100 },
    { limit: 100, rate: 150 },
    { limit: Infinity, rate: 300 },
  ];
  for (const tier of rates) {
    if (remaining <= 0) break;
    const unitsInTier = Math.min(remaining, tier.limit);
    totalCost += unitsInTier * tier.rate;
    remaining -= unitsInTier;
  }
  return totalCost;
};

// ===== COMPONENT =====

export default function UsageDetail() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { getUsage } = useUsage();

  const allItems = [];
  const categories = [
    'refrigerator', 'ac', 'washing', 'bulb',
    'fan', 'tv', 'iron', 'microwave',
    'rice', 'pot', 'kettle', 'vacuum'
  ];

  categories.forEach((cat) => {
    const specs = getUsage(cat);
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
          dailyUnits: dailyUnits,
          monthlyUnits: monthlyUnits,
          dailyCost: calculateMeterBill(Math.round(dailyUnits)),
          monthlyCost: calculateMeterBill(Math.round(monthlyUnits)),
        });
      });
    }
  });

  const totalDailyUnits = allItems.reduce((sum, item) => sum + item.dailyUnits, 0);
  const totalMonthlyUnits = allItems.reduce((sum, item) => sum + item.monthlyUnits, 0);
  const totalDailyCost = allItems.reduce((sum, item) => sum + item.dailyCost, 0);
  const totalMonthlyCost = allItems.reduce((sum, item) => sum + item.monthlyCost, 0);

  const isCurrent = type === 'current';
  const displayItems = allItems.map(item => ({
    ...item,
    units: isCurrent ? item.dailyUnits : item.monthlyUnits,
    cost: isCurrent ? item.dailyCost : item.monthlyCost,
  }));

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={() => router.back()}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <AntDesign name="close" size={20} color="#333" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Average Total Consumption</Text>

          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Devices</Text>
            <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Units</Text>
            <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Cost</Text>
          </View>

          <View style={styles.divider} />

          {/* Scrollable List */}
          <ScrollView style={styles.scrollArea}>
            {displayItems.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.deviceCell, { flex: 1.5 }]}>{item.name}({item.watt})</Text>
                <Text style={[styles.unitCell, { flex: 1 }]}>{item.units.toFixed(0)} units</Text>
                <Text style={[styles.costCell, { flex: 1 }]}>{item.cost.toLocaleString()} MMK</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.divider} />

          {/* Summary */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Usage :</Text>
            <Text style={styles.summaryUnits}>{totalDailyUnits.toFixed(0)} units</Text>
            <Text style={styles.summaryCost}>{totalDailyCost.toLocaleString()} MMK</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Total :</Text>
            <Text style={styles.summaryUnits}>{totalMonthlyUnits.toFixed(0)} units</Text>
            <Text style={styles.summaryCost}>{totalMonthlyCost.toLocaleString()} MMK</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
   
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
     borderColor:'#1658C3',
    borderWidth:3
    
  },
  closeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#f0f0f0',
    padding: 6,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  deviceCell: {
    fontSize: 14,
    color: '#333',
  },
  unitCell: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  costCell: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  scrollArea: {
    maxHeight: 300,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1.5,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryUnits: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
  summaryCost: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
    color: '#333',
    fontWeight: '600',
  },
});