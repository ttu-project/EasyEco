import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { format, addDays } from 'date-fns';

const { width, height } = Dimensions.get('window');

// ============================================================
// API CONFIGURATION
// ============================================================
const API_BASE_URL = 'https://your-api-endpoint.com/api';

const API_ENDPOINTS = {
  hourlyUsage: (date) => `${API_BASE_URL}/usage/hourly?date=${date}`,
  monthlyHistory: `${API_BASE_URL}/history/monthly`,
};

// ============================================================
// DEMO DATA - Used when API fails (no alerts)
// ============================================================
const DEMO_HOURLY = [
  { hour: '12 AM', value: 0.01 }, { hour: '1 AM', value: 0.005 },
  { hour: '2 AM', value: 0.002 }, { hour: '3 AM', value: 0.001 },
  { hour: '4 AM', value: 0.001 }, { hour: '5 AM', value: 0.003 },
  { hour: '6 AM', value: 0.02 }, { hour: '7 AM', value: 0.015 },
  { hour: '8 AM', value: 0.01 }, { hour: '9 AM', value: 0.008 },
  { hour: '10 AM', value: 0.012 }, { hour: '11 AM', value: 0.025 },
  { hour: '12 PM', value: 0.045 }, { hour: '1 PM', value: 0.038 },
  { hour: '2 PM', value: 0.03 }, { hour: '3 PM', value: 0.022 },
  { hour: '4 PM', value: 0.018 }, { hour: '5 PM', value: 0.015 },
  { hour: '6 PM', value: 0.035 }, { hour: '7 PM', value: 0.028 },
  { hour: '8 PM', value: 0.02 }, { hour: '9 PM', value: 0.015 },
  { hour: '10 PM', value: 0.01 }, { hour: '11 PM', value: 0.005 },
];

const DEMO_HISTORY = [
  { id: '1', month: 'June 2026', units: 2.7, price: 135 },
  { id: '2', month: 'May 2026', units: 3, price: 150 },
  { id: '3', month: 'April 2026', units: 3.5, price: 175 },
  { id: '4', month: 'March 2026', units: 2.5, price: 125 },
  { id: '5', month: 'February 2026', units: 3.2, price: 160 },
  { id: '6', month: 'January 2026', units: 2.8, price: 140 },
];

// ============================================================
// API FUNCTIONS
// ============================================================
const fetchHourlyData = async (dateString) => {
  try {
    const response = await fetch(API_ENDPOINTS.hourlyUsage(dateString), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.hourly || data;
  } catch (error) {
    console.log('API failed, using demo data');
    return null; // Return null to trigger demo
  }
};

const fetchMonthlyHistory = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.monthlyHistory, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.history || data;
  } catch (error) {
    console.log('API failed, using demo data');
    return null;
  }
};


const HourlyChart = ({ data }) => {
  const chartWidth = width - 64;
  const chartHeight = 160; 

  
  const padding = { top: 15, bottom: 25, left: 60, right: 10 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value)) * 1.2 || 0.1;
  const barWidth = innerWidth / data.length * 0.6;
  const barSpacing = (innerWidth - barWidth * data.length) / (data.length + 1);
  const getBarHeight = (value) => (value / maxValue) * innerHeight;

  
  const yAxisValues = [maxValue, maxValue * 0.5, 0];

  return (
    <Svg width={chartWidth} height={chartHeight}>
      
      {yAxisValues.map((value, i) => {
        const y = chartHeight - padding.bottom - getBarHeight(value);
        const labelText = value === 0 ? '0' : `${value.toFixed(3)} unit`;

        return (
          <React.Fragment key={i}>
            <SvgText 
              x={padding.left - 8} 
              y={y + 4} 
              fontSize="9" 
              fill="#888" 
              textAnchor="end"
            >
              {labelText}
            </SvgText>
            <Line
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#e0e0e0"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          </React.Fragment>
        );
      })}

    
      {data.map((item, index) => {
        const barHeight = getBarHeight(item.value);
        const x = padding.left + barSpacing + index * (barWidth + barSpacing);
        const y = chartHeight - padding.bottom - barHeight;
        const showLabel = ['12 AM', '6 AM', '12 PM', '6 PM'].includes(item.hour);

        return (
          <React.Fragment key={index}>
            <Rect 
              x={x} 
              y={y} 
              width={barWidth} 
              height={barHeight} 
              fill="#3368C4" 
              rx={2} 
            />
            {showLabel && (
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - padding.bottom + 14}
                fontSize="9" 
                fill="#666" 
                textAnchor="middle"
              >
                {item.hour}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
};


const ElectricityScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  
  const [offset, setOffset] = useState(0);
  const currentDate = addDays(new Date(), offset);
  const dateString = format(currentDate, 'yyyy-MM-dd');

  const getDisplayLabel = () => {
    if (offset === 0) return 'Today';
    if (offset === -1) return 'Yesterday';
    return format(currentDate, 'MMMM d');
  };

  
  const [hourlyData, setHourlyData] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [monthlyHistory, setMonthlyHistory] = useState([]);

  
  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const hourlyResult = await fetchHourlyData(dateString);

      if (hourlyResult && hourlyResult.length > 0) {
        setHourlyData(hourlyResult);
        const total = hourlyResult.reduce((sum, item) => sum + (item.value || 0), 0);
        setTotalUnits(total);
      } else {
        const variation = 1 + (Math.abs(offset) * 0.15);
        const adjusted = DEMO_HOURLY.map(h => ({
          ...h,
          value: Math.max(0.001, h.value * variation)
        }));
        setHourlyData(adjusted);
        const total = adjusted.reduce((sum, item) => sum + item.value, 0);
        setTotalUnits(total);
      }

      // Fetch monthly history (only if empty or refresh)
      if (monthlyHistory.length === 0 || isRefresh) {
        const historyResult = await fetchMonthlyHistory();
        if (historyResult && historyResult.length > 0) {
          setMonthlyHistory(historyResult);
        } else {
          setMonthlyHistory(DEMO_HISTORY);
        }
      }

    } catch (err) {
      console.error('Error:', err);
      // Use demo data on any error
      setHourlyData(DEMO_HOURLY);
      setTotalUnits(DEMO_HOURLY.reduce((sum, item) => sum + item.value, 0));
      setMonthlyHistory(DEMO_HISTORY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [offset]);

  const goPrev = () => setOffset(prev => prev - 1);
  const goNext = () => {
    if (offset < 0) setOffset(prev => prev + 1);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Render
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyCardLeft}>
        <Text style={styles.historyCardMonth}>{item.month}</Text>
        <Text style={styles.historyCardUnits}>{item.units} units</Text>
      </View>
      <Text style={styles.historyCardPrice}>{item.price} MMK</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3368C4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/Logoact2.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* ========== COMPACT DAILY CARD ========== */}
        <View style={styles.dailyCard}>
          <Text style={styles.dailyCardTitle}>Daily Energy Usage Analytics</Text>

          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={goPrev} style={styles.navArrowBtn}>
              <Text style={styles.navArrow}>{"<"}</Text>
            </TouchableOpacity>

            <Text style={styles.navDateText}>{getDisplayLabel()}</Text>

            <TouchableOpacity 
              onPress={goNext}
              disabled={offset === 0}
              style={styles.navArrowBtn}
            >
              <Text style={[styles.navArrow, offset === 0 && styles.navArrowDisabled]}>
                {">"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Compact Chart */}
          <View style={styles.chartWrapper}>
            <HourlyChart data={hourlyData} />
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.usageLabel}>
              <View style={styles.greenDot} />
              <Text style={styles.usageText}>Usage</Text>
            </View>
            <Text style={styles.totalUnits}>{totalUnits.toFixed(2)} units</Text>
          </View>
        </View>

        {/* ========== USAGE HISTORY ========== */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Usage History</Text>
          <FlatList
            data={monthlyHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.navBarSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 80 },

  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },

  // Logo
  logoContainer: { alignItems: 'flex-start', marginBottom: 12 },
  logoCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden' 
  },
  logoImage: { width: 42, height: 42 },

  // ========== COMPACT DAILY CARD ==========
  dailyCard: {
    backgroundColor: '#F4F7FC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dailyCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  navArrowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 36,
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  navArrowDisabled: {
    color: '#ccc',
  },
  navDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Chart - COMPACT
  chartWrapper: {
    marginBottom: 4,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 2,
  },
  usageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15EA3E',
    marginRight: 6,
  },
  usageText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  totalUnits: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },

  // ========== HISTORY ==========
  historySection: {
    marginTop: 4,
    marginBottom: 5,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  historyCard: {
    backgroundColor: '#CDDFFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardLeft: {
    flex: 1,
  },
  historyCardMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  historyCardUnits: {
    fontSize: 12,
    color: '#666',
  },
  historyCardPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  navBarSpacer: { height: 20 },
});

export default ElectricityScreen;