// app/(tabs)/index.tsx
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useUsage } from '../Usage/UsageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ===== USAGE DATA (this would come from your storage/context in real app) =====
// For demo, showing how data looks when user has added usage
const USAGE_DATA = {
  // 'fan': [  // Example: Electric Fan has usage data
  //   { watt: '300 Watt', time: '2 hr 00 min' },
  //   { watt: '500 Watt', time: '2 hr 00 min' },
  //   { watt: '75 Watt', time: '5 hr 00 min' },  // This will show as "..."
  // ],
  // 'tv': [
  //   { watt: '150 Watt', time: '4 hr 00 min' },
  // ],
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

const RATES = [
  { limit: 50,   rate: 50 },   // 1-50 units @ 50 MMK
  { limit: 50,   rate: 100 },  // 51-100 units @ 100 MMK
  { limit: 100,  rate: 150 },  // 101-200 units @ 150 MMK
  { limit: Infinity, rate: 300 }, // 201+ units @ 300 MMK
];

const calculateMeterBill = (totalUnits) => {
  let remaining = totalUnits;
  let totalCost = 0;

  for (const tier of RATES) {
    if (remaining <= 0) break;
    const unitsInTier = Math.min(remaining, tier.limit);
    totalCost += unitsInTier * tier.rate;
    remaining -= unitsInTier;
  }

  return { units: totalUnits, cost: totalCost };
};

export default function Index() {
  const router = useRouter();
  const { getUsage } = useUsage();
  const [activePage, setActivePage] = useState(0);
  const scrollViewRef = useRef(null);
  const [currentUnits, setCurrentUnits] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [estimatedUnits, setEstimatedUnits] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  // ===== IN REAL APP: Get usage data from context/storage =====
  // const { usageData } = useUsageContext(); 
  // const usageData = USAGE_DATA; // Replace with real data source

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

  // ===== HELPERS FOR BILL CALCULATION =====

// Extract number from "75W" or "75 Watt"
const parseWatt = (wattStr) => {
  const match = wattStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

// Convert "2 hr 30 min" → hours (2.5)
const parseTimeToHours = (timeStr) => {
  const hrMatch = timeStr.match(/(\d+)\s*hr/);
  const minMatch = timeStr.match(/(\d+)\s*min/);
  const hours = hrMatch ? parseInt(hrMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  return hours + (minutes / 60);
};

// Myanmar Tiered Rates




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

  // ===== RENDER CARD CONTENT BASED ON USAGE DATA =====
  const renderCardContent = (item) => {
    const specs = getUsage(item.categoryId); // Get usage for this category
    
    // NO USAGE YET → Show "Add Usage Details"
    if (!specs || specs.length === 0) {
      return (
        <Text style={styles.addActionText}>Add Usage Details</Text>
      );
    }

    // HAS USAGE → Show up to 2 entries, then "..."
    return (
      <View style={styles.specsContainer}>
        {/* Show max 2 items */}
        {specs.slice(0, 2).map((spec, i) => (
          <View key={i} style={styles.specRow}>
            <Text style={styles.specText}>{spec.watt}</Text>
            <Text style={styles.specText}>{spec.time}</Text>
          </View>
        ))}
        
        {/* Show "..." if more than 2 items */}
        {specs.length > 2 && (
          <Text style={styles.moreText}>...</Text>
        )}
      </View>
    );
  };

  const calculateBill = () => {
    let dailyUnits = 0;      // Current Usage (no ×30)
    let monthlyUnits = 0;    // Estimated Total (×30)

    PAGES_DATA.forEach((page) => {
      page.forEach((item) => {
        const specs = getUsage(item.categoryId);
        
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
    });

    const current = Math.round(dailyUnits);
    const estimated = Math.round(monthlyUnits);
    
    const { cost: currentCost } = calculateMeterBill(current);
    const { cost: estimatedCost } = calculateMeterBill(estimated);

    setCurrentUnits(current);
    setCurrentCost(currentCost);
    setEstimatedUnits(estimated);
    setEstimatedCost(estimatedCost);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/Logoact2.png')} 
              style={{ width: 60, height: 60, resizeMode: 'contain' }} 
            />
          </View>
          <View style={styles.notiCircle}>
            <Image 
              source={require('../../assets/Notifications.png')} 
              style={{ width: 30, height: 30, resizeMode: 'contain' }} 
            />
          </View>
        </View>

        <Text style={styles.mainTitle}>Estimated Monthly Bill</Text>

       <TouchableOpacity
       activeOpacity={0.9}
  onPress={() => router.push({
    pathname: '../UsageDetail',
    params: { type: 'current' }
  })}>
         <View style={styles.billCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}></Text>
            <Text style={styles.tableHeaderText}>Energy Usage</Text>
            <Text style={styles.tableHeaderText}>Electricity Bill</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.rowLabel, { flex: 1.2 }]}>Current Usage :</Text>
            <Text style={styles.rowValue}>{currentUnits}  units</Text>
            <Text style={styles.rowValue}>{currentCost.toLocaleString()}MMK</Text>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
            <Text style={[styles.rowLabel, { flex: 1.2 }]}>Estimated Total :</Text>
            <Text style={styles.rowValue}>{estimatedUnits} units</Text>
            <Text style={styles.rowValue}>{estimatedCost.toLocaleString()} MMK</Text>
          </View>
        </View>

       </TouchableOpacity>
        <Text style={styles.sectionTitle}>Track Duration and Wattage</Text>

        <View style={styles.swiperWrapper}>
          <ScrollView
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
                    <TouchableOpacity 
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => handleCardPress(item)}
                      style={styles.applianceCard}
                    >
                      <View style={styles.cardTop}>
                        <View style={styles.iconCircle}>
                          {renderFigmaIcon(item.iconType)}
                        </View>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.underline} />
                      </View>

                      {/* ===== DYNAMIC CONTENT ===== */}
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
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => handleDotPress(index)}
              style={[styles.dot, activePage === index ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity activeOpacity={0.8} style={styles.calculateButton}  onPress={calculateBill}>
            <Text style={styles.buttonText}>Calculate Bill</Text>
            {/* {renderCardContent(item)} */}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomBarPlaceholder} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 35 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  logoContainer: {  width:60,height:60,borderRadius: 3, borderWidth: 2, borderColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  notiCircle: {  backgroundColor: '#FFFFFF', borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff' },
  mainTitle: { fontSize: 25, fontWeight: 'bold', color: '#0D2A4A', marginBottom: 15},
  billCard: { backgroundColor: '#2167E1', borderRadius: 18, padding: 16, marginBottom: 15 },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tableHeaderText: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'right' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.25)', paddingBottom: 10, marginBottom: 10 },
  rowLabel: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  rowValue: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600', textAlign: 'right' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0D2A4A', marginBottom: 14 },
  swiperWrapper: { height: 330, width: SCREEN_WIDTH - 40 },
  pageContainer: { width: SCREEN_WIDTH - 40 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  applianceCard: { width: '48%', height: 150, backgroundColor: '#3B7AEE', borderRadius: 16, padding: 12, marginBottom: 16, justifyContent: 'space-between' },
  cardTop: { width: '100%' },
  iconCircle: { width: 40, height: 40, backgroundColor: '#FFFFFF', borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  underline: { height: 1, backgroundColor: 'rgba(255,255,255,0.35)', width: '100%', marginBottom: 8 },
  
  // ===== STYLES FOR USAGE DISPLAY =====
  specsContainer: { width: '100%' },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  specText: { fontSize: 11, color: '#FFF' },
  moreText: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center',
    marginTop: 2,
    fontWeight: 'bold'
  },
  
  // ===== STYLE FOR "ADD USAGE DETAILS" =====
  addActionText: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.8)', 
    textAlign: 'center', 
    paddingVertical: 4 
  },
  
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 15 },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 4 },
  activeDot: { width: 26, backgroundColor: '#A2B9E3' },
  inactiveDot: { width: 10, backgroundColor: '#D4E0F7' },
  buttonWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  calculateButton: { backgroundColor: '#1958CE', borderRadius: 14, paddingVertical: 12, alignItems: 'center', width: '56%', marginBottom: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  bottomBarPlaceholder: { height: 80, backgroundColor: '#FFF' },
});