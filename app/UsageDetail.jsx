import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal
} from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useUsage } from './Usage/UsageContext';
import { formatCost, formatUnits, summarizeUsageBill } from './utils/billing';
import { useLanguage } from './context/LanguageContext';

export default function UsageDetail({
  visible,
  onClose,
  type = "current",
  currentUnits,
  currentCost,
  estimatedUnits,
  estimatedCost,
}) {
  const { getUsage, saveUsageRecord, recordsLoading, recordSaveError } = useUsage();
  const { t } = useLanguage();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isCurrent = type === 'current';

  // Itemized list from single source of truth
  const { allItems } = summarizeUsageBill(getUsage);

  const displayItems = allItems.map(item => ({
    ...item,
    units: isCurrent ? item.dailyUnits : item.monthlyUnits,
    cost: isCurrent ? item.dailyCost : item.monthlyCost,
  }));

  const handleSaveHistory = async () => {
    setSaveSuccess(false);
    try {
      await saveUsageRecord();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Save history error:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <AntDesign name="close" size={20} color="#333" />
          </TouchableOpacity>

          <Text style={styles.title}>{t('averageTotalConsumption')}</Text>

          <View style={styles.tableRow}>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>{t('devices')}</Text>
            <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>{t('units')}</Text>
            <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>{t('cost')}</Text>
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.scrollArea}>
            {displayItems.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.deviceCell, { flex: 1.5 }]}>{item.name}({item.watt})</Text>
                <Text style={[styles.unitCell, { flex: 1 }]}>{formatUnits(item.units)} {t('units')}</Text>
                <Text style={[styles.costCell, { flex: 1 }]}>{formatCost(item.cost)} MMK</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.divider} />

          {/* Summary uses props from parent — guaranteed identical to Home card */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('currentUsage')}</Text>
            <Text style={styles.summaryUnits}>{formatUnits(currentUnits)} {t('units')}</Text>
            <Text style={styles.summaryCost}>{formatCost(currentCost)} MMK</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('estimatedTotal')}</Text>
            <Text style={styles.summaryUnits}>{formatUnits(estimatedUnits)} {t('units')}</Text>
            <Text style={styles.summaryCost}>{formatCost(estimatedCost)} MMK</Text>
          </View>

          {/* ── Save to History Action Button ── */}
          <TouchableOpacity
            style={[
              styles.saveHistoryButton,
              recordsLoading && { opacity: 0.7 },
              saveSuccess && styles.saveHistoryButtonSuccess,
            ]}
            onPress={handleSaveHistory}
            disabled={recordsLoading}
            activeOpacity={0.85}
          >
            <Ionicons
              name={saveSuccess ? 'checkmark-circle' : 'cloud-upload-outline'}
              size={18}
              color={saveSuccess ? '#059669' : '#FFF'}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.saveHistoryButtonText,
                saveSuccess && styles.saveHistoryButtonTextSuccess,
              ]}
            >
              {recordsLoading
                ? 'Saving to History...'
                : saveSuccess
                ? 'Saved to History!'
                : t('saveToHistory')}
            </Text>
          </TouchableOpacity>

          {recordSaveError ? (
            <Text style={styles.errorText}>{recordSaveError}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

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
    maxHeight: '88%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    borderColor: '#1658C3',
    borderWidth: 3,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#f0f0f0',
    padding: 6,
    borderRadius: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
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
    maxHeight: 260,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1.5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryUnits: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
  },
  summaryCost: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    color: '#333',
    fontWeight: '600',
  },
  saveHistoryButton: {
    backgroundColor: '#1658C3',
    borderRadius: 14,
    height: 44,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#1658C3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  saveHistoryButtonSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
  },
  saveHistoryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  saveHistoryButtonTextSuccess: {
    color: '#059669',
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});