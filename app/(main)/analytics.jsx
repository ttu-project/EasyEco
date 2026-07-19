import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { API_BASE_URL } from '../../config/api';
import { getToken, getUser } from '../utils/authStorage';
import { calculateMeterBill, parseTimeToHours, parseWatt } from '../utils/billing';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getUsageHeaders = async () => {
  const [token, user] = await Promise.all([getToken(), getUser()]);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(user?._id ? { 'X-User-Id': String(user._id) } : {}),
  };
};

const fetchUsageRecords = async () => {
  const response = await fetch(`${API_BASE_URL}/usage`, {
    method: 'GET',
    headers: await getUsageHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  return response.json();
};

const getMonthlyData = (records) => {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    return { month: monthNames[date.getMonth()], year: date.getFullYear(), value: 0 };
  });

  records.forEach((record) => {
    const createdAt = new Date(record.createdAt);
    const month = months.find(
      (item) => item.year === createdAt.getFullYear() && monthNames.indexOf(item.month) === createdAt.getMonth()
    );
    if (!month) return;

    const dailyUnits = (parseWatt(record.watt) * parseTimeToHours(record.time)) / 1000;
    month.value += calculateMeterBill(dailyUnits * 30);
  });

  return months.map(({ month, value }) => ({ month, value: Math.round(value) }));
};

const getUsageHistory = (records) => records.map((record) => {
  const dailyUnits = (parseWatt(record.watt) * parseTimeToHours(record.time)) / 1000;
  const monthlyUnits = dailyUnits * 30;
  return {
    id: record._id,
    units: Number(monthlyUnits.toFixed(2)),
    price: calculateMeterBill(monthlyUnits),
    date: new Date(record.createdAt).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
  };
});

// ---------- Main Component ----------
const ElectricityScreen = () => {
  const { width } = useWindowDimensions();
  // ---- State Variables ----
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [allMonthlyData, setAllMonthlyData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [maxValue, setMaxValue] = useState(100000);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);

  // ---- Load All Data ----
  const loadAllData = async () => {
    try {
      setError(null);

      const records = await fetchUsageRecords();
      const monthlyData = getMonthlyData(records);
      const firstSix = monthlyData.slice(0, 6);
      setAllMonthlyData(monthlyData);
      setDisplayData(firstSix);
      const max = Math.max(...firstSix.map((item) => item.value));
      setMaxValue(max > 0 ? max * 1.2 : 100000);
      setUsageHistory(getUsageHistory(records).slice(0, 5));
    } catch (err) {
      console.error('Load Data Error:', err);
      setError(err.message);
      const emptyMonthlyData = getMonthlyData([]);
      setAllMonthlyData(emptyMonthlyData);
      const firstSix = emptyMonthlyData.slice(0, 6);
      setDisplayData(firstSix);
      setMaxValue(100000);
      setUsageHistory([]);

      Alert.alert(
        'Error',
        'Failed to load your usage data. Please check that the backend is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ---- Component Mount ----
  useEffect(() => {
    loadAllData();
  }, []);

  // ---- Page Change ----
  const changePage = (page) => {
    setCurrentPage(page);

    if (page === 0) {
      const firstSix = allMonthlyData.slice(0, 6);
      setDisplayData(firstSix);
      const max = Math.max(...firstSix.map((item) => item.value));
      setMaxValue(max > 0 ? max * 1.2 : 100000);
    } else {
      const lastSix = allMonthlyData.slice(6, 12);
      setDisplayData(lastSix);
      const max = Math.max(...lastSix.map((item) => item.value));
      setMaxValue(max > 0 ? max * 1.2 : 100000);
    }
    setSelectedMonth(null);
    setSelectedValue(null);
  };

  // ---- Month Select ----
  const handleMonthSelect = (month, value) => {
    setSelectedMonth(month);
    setSelectedValue(value);
    console.log(`Selected: ${month} = ${value} MMK`);
  };

  // ---- Pull to Refresh ----
  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // ---- Format Currency ----
  const formatCurrency = (value) => {
    if (value >= 100000) {
      return `${(value / 1000).toFixed(0)}k`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  // ---- Get Current Month ----
  const getCurrentMonth = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    return monthNames[currentMonthIndex];
  };

  // ---- Loading State ----
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading electricity data...</Text>
      </View>
    );
  }

  // ---- Chart Settings ----
  const chartWidth = width - 40;
  const chartHeight = 220;
  const padding = { top: 30, bottom: 30, left: 35, right: 15 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const chartMaxValue = maxValue > 0 ? maxValue : 100000;

  const barWidth = innerWidth / displayData.length * 0.6;
  const barSpacing = (innerWidth - barWidth * displayData.length) / (displayData.length + 1);

  const getBarHeight = (value) => (value / chartMaxValue) * innerHeight;

  const currentMonth = getCurrentMonth();

  // ---- Render Usage History Item ----
  const renderHistoryItem = ({ item, index }) => {
    return (
      <View style={styles.historyItemWrapper}>
        <View style={styles.historyItem}>
          <Text style={styles.historyDate}>{item.date || 'Unknown date'}</Text>
          <View style={styles.historyRow}>
            <Text style={styles.historyUnits}>{item.units || 0} units</Text>
            <Text style={styles.historyPrice}>
              {(item.price || 0).toLocaleString()} MMK
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ---- Render Empty State ----
  const renderEmptyHistory = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No Usage History</Text>
      <Text style={styles.emptyText}>No electricity usage records found.</Text>
    </View>
  );

  return (
    <SafeAreaView 
    edges={['top']}  
    style={styles.safeArea}>
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

        {/* Selected Month Info */}
        {selectedMonth && (
          <View style={styles.selectedInfoContainer}>
            <Text style={styles.selectedInfoText}>
              {selectedMonth}: {selectedValue?.toLocaleString()} MMK
            </Text>
          </View>
        )}

        {/* Bar Chart with Title inside - Left aligned */}
        <View style={styles.chartBorderContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Monthly Electricity Expenses</Text>
          </View>
          <View style={styles.chartContainer}>
            <Svg width={chartWidth} height={chartHeight}>
              {/* Y-axis Labels */}
              {[chartMaxValue, chartMaxValue * 0.5, 0].map((value) => {
                const y = chartHeight - padding.bottom - getBarHeight(value);
                return (
                  <React.Fragment key={value}>
                    <SvgText x={padding.left - 8} y={y + 3} fontSize="10" fill="#666" textAnchor="end">
                      {formatCurrency(value)}
                    </SvgText>
                    <Line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#f0f0f0"
                      strokeWidth="1"
                      strokeDasharray="3"
                    />
                  </React.Fragment>
                );
              })}

              {/* Bars and X-axis Labels */}
              {displayData.map((item, index) => {
                const barHeight = getBarHeight(item.value);
                const x = padding.left + barSpacing + index * (barWidth + barSpacing);
                const y = chartHeight - padding.bottom - barHeight;
                const isSelected = selectedMonth === item.month;
                const isCurrentMonth = item.month === currentMonth;

                // Color: Current month = #3368C4, Other months = #C5D2E5
                const barColor = isCurrentMonth ? '#3368C4' : '#C5D2E5';

                return (
                  <React.Fragment key={item.month || index}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={isSelected ? '#FF6B6B' : barColor}
                      rx={4}
                      onPress={() => handleMonthSelect(item.month, item.value)}
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y={y - 5}
                      fontSize="9"
                      fill="#333"
                      textAnchor="middle"
                    >
                      {formatCurrency(item.value)}
                    </SvgText>
                    <SvgText
                      x={x + barWidth / 2}
                      y={chartHeight - padding.bottom + 18}
                      fontSize="10"
                      fill={isSelected ? '#FF6B6B' : '#666'}
                      textAnchor="middle"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      onPress={() => handleMonthSelect(item.month, item.value)}
                    >
                      {item.month || `M${index + 1}`}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </View>

        {/* Page Toggle Buttons - Replaces CustomSeekBar */}
        <View style={styles.pageToggleContainer}>
          <Pressable 
            style={[styles.pageToggleButton, currentPage === 0 && styles.pageToggleButtonActive]}
            onPress={() => changePage(0)}
          >
            <Text style={[styles.pageToggleText, currentPage === 0 && styles.pageToggleTextActive]}>
              Jan - Jun
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.pageToggleButton, currentPage === 1 && styles.pageToggleButtonActive]}
            onPress={() => changePage(1)}
          >
            <Text style={[styles.pageToggleText, currentPage === 1 && styles.pageToggleTextActive]}>
              Jul - Dec
            </Text>
          </Pressable>
        </View>

        {/* Usage History */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Usage History</Text>

          {usageHistory && usageHistory.length > 0 ? (
            <FlatList
              data={usageHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) => item.id || item._id || `history-${index}`}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            renderEmptyHistory()
          )}
        </View>

        {/* Navigation Bar Spacer */}
        <View style={styles.navBarSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // Logo
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 65,
    height: 65,
  },

  // Selected Info
  selectedInfoContainer: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcc80',
  },
  selectedInfoText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '600',
  },

  // Chart Border Container with Title - Left aligned
  chartBorderContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  chartHeader: {
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    alignItems: 'center',
    padding: 2,
  },

  // Page Toggle Buttons (Replaces CustomSeekBar)
  pageToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 10,
  },
  pageToggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#E3EFFF',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  pageToggleButtonActive: {
    backgroundColor: '#3368C4',
    borderColor: '#3368C4',
  },
  pageToggleText: {
    fontSize: 14,
    color: '#3368C4',
    fontWeight: '500',
  },
  pageToggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // History
  historyContainer: {
    marginTop: 5,
    marginBottom: 5,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  historyItemWrapper: {
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: '#CDDFFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  historyDate: {
    fontFamily: 'Roboto-Bold',
    fontWeight: '700',
    fontSize: 20,
    color: '#333',
    marginBottom: 6,
  },

  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyUnits: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#333',
  },

  historyPrice: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#333',
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },

  // Navigation Bar Spacer
  navBarSpacer: {
    height: 20,
  },
});

export default ElectricityScreen;
