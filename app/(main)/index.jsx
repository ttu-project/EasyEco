import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useUsage } from '../Usage/UsageContext';



const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive constants
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2; // 60 = 20 padding on sides + 20 gap between cards
const CARD_HEIGHT = SCREEN_HEIGHT * 0.21;

const scale = SCREEN_HEIGHT / 800;
const s = (size) => size * scale;


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


const USAGE_DATA = {};

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
  { limit: 50,   rate: 50 },   
  { limit: 50,   rate: 100 },  
  { limit: 100,  rate: 150 },  
  { limit: Infinity, rate: 300 }, 
];

const calculateMeterBill = (totalUnits) => {
  let remaining = totalUnits;
  let totalCost = 0;
  const breakdown = [];

  for (const tier of RATES) {
    if (remaining <= 0) break;
    const unitsInTier = Math.min(remaining, tier.limit);
    const tierCost = unitsInTier * tier.rate;
    totalCost += tierCost;
    remaining -= unitsInTier;
     breakdown.push({
      units: unitsInTier,
      rate: tier.rate,
      cost: tierCost,
    });
  }

  return { 
    totalUnits,
    totalCost,
    breakdown,
   };
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

  
  const renderCardContent = (item) => {
    const specs = getUsage(item.categoryId); 
    
   
    if (!specs || specs.length === 0) {
      return (
        <Text style={styles.addActionText}>Add Usage Details</Text>
      );
    }

    
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
    let dailyUnits = 0;      
    let monthlyUnits = 0;    

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
  const estimated =  current * 30; 
  const currentResult = calculateMeterBill(current);
  const estimatedResult = calculateMeterBill(estimated);

   const { totalCost: currentCostValue } = calculateMeterBill(current);
  const { totalCost: estimatedCostValue } = calculateMeterBill(estimated);

    
    setCurrentUnits(current);
    setCurrentCost(currentCostValue);
    setEstimatedUnits(estimated);
    setEstimatedCost(estimatedCostValue);
  };


  
  // ... [Keep your state variables and calculateBill logic] ...

  return (
    <SafeAreaView 
     edges={['top', 'bottom', 'left', 'right']}
    style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={require('../../assets/Logoact2.png')} style={styles.logo} />
          <TouchableOpacity onPress={() => router.push({ pathname: '../Usage/Notification'} )}>
          <Image source={require('../../assets/Notifications.png')} style={styles.notiIcon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.mainTitle}>Estimated Monthly Bill</Text>

        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push({ pathname: '../UsageDetail', params: { type: 'current' } })}>
          <View style={styles.billCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}></Text>
              <Text style={styles.tableHeaderText}>Energy Usage</Text>
              <Text style={styles.tableHeaderText}>Electricity Bill</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.rowLabel, { flex: 1.2 }]}>Current Usage :</Text>
              <Text style={styles.rowValue}>{currentUnits} units</Text>
              <Text style={styles.rowValue}>{currentCost.toLocaleString()} MMK</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.rowLabel, { flex: 1.2 }]}>Estimated Total :</Text>
              <Text style={styles.rowValue}>{estimatedUnits} units</Text>
              <Text style={styles.rowValue}>{estimatedCost.toLocaleString()} MMK</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Track Duration and Wattage</Text>

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
          <Text style={styles.buttonText}>Calculate Bill</Text>
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
  swiperWrapper: { width: '100%'}, 
  pageContainer: { width: SCREEN_WIDTH - 40 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  applianceCard: { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: '#3B7AEE', borderRadius: 16, padding: 12, marginBottom: 15 },
  iconCircle: { width: 36, height: 36, backgroundColor: '#FFF', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  underline: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  dot: { height: 4, borderRadius: 3, marginHorizontal: 4 },
  activeDot: { width: 24, backgroundColor: '#A2B9E3' },
  inactiveDot: { width: 10, backgroundColor: '#D4E0F7' },
  calculateButton: { backgroundColor: '#1958CE', borderRadius: 14, paddingVertical: 12, alignItems: 'center', alignSelf: 'center', width: '55%' },
  specsContainer: { 
    width: '100%',
    marginTop: 5,
  },
  specRow: { 
    flexDirection: 'row',      // Change this to row
    justifyContent: 'flex-start',
    marginBottom: 2, 
    gap: 8                 // Adds space between Watt and Time
  },
  specText: { 
    fontSize: 11, 
    color: '#FFF',
    fontWeight: '400'
  },
   moreText: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center',
    fontWeight: 'bold'
  },
   addActionText: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.8)', 
    textAlign: 'center', 
    paddingVertical: 4 
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});