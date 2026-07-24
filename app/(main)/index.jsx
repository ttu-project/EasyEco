import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useUsage } from '../Usage/UsageContext';
import { summarizeUsageBill } from '../utils/billing';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive constants
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.21;

const ICON_MAP = {
  fridge: require('../../assets/Refigerator.png'),
  ac: require('../../assets/Air_conditioner.png'),
  washing: require('../../assets/Washing_machine.png'),
  bulb: require('../../assets/Electric_bulb.png'),
  fan: require('../../assets/Electric_fan.png'),
  tv: require('../../assets/Television.png'),
  iron: require('../../assets/Electric_iron.png'),
  microwave: require('../../assets/Microwave_oven.png'),
  rice: require('../../assets/Rice_cooker.png'),
  pot: require('../../assets/Cooking_pot.png'),
  kettle: require('../../assets/Electric_kettle.png'),
  vacuum: require('../../assets/Vacuum_cleaner.png'),
};

const PAGES_DATA = [
  [
    { id: 1, title: 'Refrigerator', iconType: 'fridge', categoryId: 'refrigerator' },
    { id: 2, title: 'Air Conditioner', iconType: 'ac', categoryId: 'ac' },
    { id: 3, title: 'Washing Machine', iconType: 'washing', categoryId: 'washing' },
    { id: 4, title: 'Electric bulb', iconType: 'bulb', categoryId: 'bulb' },
  ],
  [
    { id: 5, title: 'Electric Fan', iconType: 'fan', categoryId: 'fan' },
    { id: 6, title: 'Television', iconType: 'tv', categoryId: 'tv' },
    { id: 7, title: 'Electric Iron', iconType: 'iron', categoryId: 'iron' },
    { id: 8, title: 'Microwave Oven', iconType: 'microwave', categoryId: 'microwave' },
  ],
  [
    { id: 9, title: 'Rice Cooker', iconType: 'rice', categoryId: 'rice' },
    { id: 10, title: 'Cooking Pot', iconType: 'pot', categoryId: 'pot' },
    { id: 11, title: 'Electric Kettle', iconType: 'kettle', categoryId: 'kettle' },
    { id: 12, title: 'Vacuum Cleaner', iconType: 'vacuum', categoryId: 'vacuum' },
  ]
];

export default function Calculate() {
  const router = useRouter();
  const { getUsage, usageData, fetchUsage } = useUsage();
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState(0);
  const scrollViewRef = useRef(null);

  const [currentUnits, setCurrentUnits] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [estimatedUnits, setEstimatedUnits] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Automatically calculate bills whenever usage changes
  const calculateBill = useCallback(() => {
    const summary = summarizeUsageBill(getUsage);
    setCurrentUnits(summary.totalDailyUnits);
    setCurrentCost(summary.totalDailyCost);
    setEstimatedUnits(summary.totalMonthlyUnits);
    setEstimatedCost(summary.totalMonthlyCost);
  }, [getUsage]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    calculateBill();
  }, [calculateBill, usageData]);

  const handleDotPress = (pageIndex) => {
    setActivePage(pageIndex);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: pageIndex * (SCREEN_WIDTH - 40),
        animated: true,
      });
    }
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / (SCREEN_WIDTH - 40));
    if (currentIndex !== activePage && currentIndex >= 0 && currentIndex < PAGES_DATA.length) {
      setActivePage(currentIndex);
    }
  };

  const renderFigmaIcon = (type) => {
    const iconSource = ICON_MAP[type];
    if (iconSource) {
      return <Image source={iconSource} style={{ width: 24, height: 24 }} />;
    }
    return (
      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path d="M12 3V21M3 12H21" stroke="#1958CE" strokeWidth="2" />
      </Svg>
    );
  };

  const handleCardPress = (item) => {
    router.push({
      pathname: '../Usage/[category]',
      params: { 
        category: item.categoryId,
        title: item.title 
      }
    });
  };

  const renderCardContent = (item) => {
    const specs = getUsage(item.categoryId); 
    
    if (!specs || specs.length === 0) {
      return (
        <Text style={styles.addActionText}>{t('addUsageDetails')}</Text>
      );
    }

    return (
      <View style={styles.specsContainer}>
        {specs.slice(0, 2).map((spec, i) => (
          <View key={i} style={styles.specRow}>
            <Text style={styles.specText}>{spec.watt}</Text>
            <Text style={styles.specText}>{spec.time}</Text>
          </View>
        ))}
        {specs.length > 2 && (
          <Text style={styles.moreText}>...</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={require('../../assets/Logoact2.png')} style={styles.logo} />
          <TouchableOpacity onPress={() => router.push({ pathname: '../Usage/Notification' })}>
            <Image source={require('../../assets/Notifications.png')} style={styles.notiIcon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.mainTitle}>{t('estimatedMonthlyBill')}</Text>

        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push({ pathname: '../UsageDetail', params: { type: 'current' } })}>
          <View style={styles.billCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}></Text>
              <Text style={styles.tableHeaderText}>{t('energyUsage')}</Text>
              <Text style={styles.tableHeaderText}>{t('electricityBill')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.rowLabel, { flex: 1.2 }]}>{t('currentUsage')}</Text>
              <Text style={styles.rowValue}>{currentUnits} {t('units')}</Text>
              <Text style={styles.rowValue}>{currentCost.toLocaleString()} MMK</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.rowLabel, { flex: 1.2 }]}>{t('estimatedTotal')}</Text>
              <Text style={styles.rowValue}>{estimatedUnits} {t('units')}</Text>
              <Text style={styles.rowValue}>{estimatedCost.toLocaleString()} MMK</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('trackDurationWattage')}</Text>

        <View style={styles.swiperWrapper}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {PAGES_DATA.map((pageItems, pageIndex) => (
              <View key={pageIndex} style={styles.pageContainer}>
                <View style={styles.gridContainer}>
                  {pageItems.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.applianceCard} onPress={() => handleCardPress(item)}>
                      <View>
                        <View style={styles.iconCircle}>{renderFigmaIcon(item.iconType)}</View>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.underline} />
                      </View>
                      {renderCardContent(item)}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.paginationContainer}>
          {PAGES_DATA.map((_, index) => (
            <View key={index} style={[styles.dot, activePage === index ? styles.activeDot : styles.inactiveDot]} />
          ))}
        </View>

        <TouchableOpacity style={styles.calculateButton} onPress={calculateBill}>
          <Text style={styles.buttonText}>{t('calculateBill')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  notiIcon: { width: 30, height: 30, resizeMode: 'contain' },
  mainTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D2A4A', marginBottom: 9 },
  billCard: { backgroundColor: '#2167E1', borderRadius: 12, padding: 10, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', marginBottom: 4 },
  tableHeaderText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 9, textAlign: 'right' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)', paddingBottom: 4, marginBottom: 4 },
  rowLabel: { color: '#FFF', fontSize: 13 },
  rowValue: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '700', textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0D2A4A', marginBottom: 10 },
  swiperWrapper: { width: '100%' }, 
  pageContainer: { width: SCREEN_WIDTH - 40 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  applianceCard: { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: '#3B7AEE', borderRadius: 16, padding: 12, marginBottom: 15 },
  iconCircle: { width: 36, height: 36, backgroundColor: '#FFF', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  underline: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  dot: { height: 4, borderRadius: 3, marginHorizontal: 4 },
  activeDot: { width: 24, backgroundColor: '#A2B9E3' },
  inactiveDot: { width: 10, backgroundColor: '#D4E0F7' },
  calculateButton: { backgroundColor: '#1958CE', borderRadius: 14, paddingVertical: 12, alignItems: 'center', alignSelf: 'center', width: '55%' },
  specsContainer: { width: '100%', marginTop: 5 },
  specRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 2, gap: 8 },
  specText: { fontSize: 11, color: '#FFF', fontWeight: '400' },
  moreText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontWeight: 'bold' },
  addActionText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingVertical: 4 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});