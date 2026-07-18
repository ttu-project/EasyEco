import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions,
  Image,
  useWindowDimensions,
  PixelRatio,
  Platform
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FontAwesome } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient'; 

// ==================== ANDROID RESPONSIVE HELPERS ====================
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PIXEL_RATIO = PixelRatio.get();
const BASE_WIDTH = 360;
const SCALE = SCREEN_W / BASE_WIDTH;

const normalize = (size) => {
  const scaledSize = size * SCALE;
  if (Platform.OS === 'android') {
    return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
  }
  return Math.round(scaledSize);
};

const normalizeFont = (size) => {
  const scaledSize = size * SCALE;
  if (Platform.OS === 'android') {
    return parseFloat(scaledSize.toFixed(1));
  }
  return Math.round(scaledSize);
};

const IS_SMALL_ANDROID = SCREEN_W < 340;
const IS_NORMAL_ANDROID = SCREEN_W >= 340 && SCREEN_W < 400;
const IS_LARGE_ANDROID = SCREEN_W >= 400 && SCREEN_W < 450;
const IS_XLARGE_ANDROID = SCREEN_W >= 450;

const getResponsive = (small, normal, large, xlarge) => {
  if (IS_SMALL_ANDROID) return small;
  if (IS_NORMAL_ANDROID) return normal;
  if (IS_LARGE_ANDROID) return large;
  return xlarge;
};

export default function Index() {
  const { width, height } = useWindowDimensions();
  const [liveUnits, setLiveUnits] = useState(0.09);
  const [thisMonthUnits, setThisMonthUnits] = useState(1.35);

  const UNIT_PRICE = 50; 
  const MONTHLY_BUDGET_GOAL = 100; 

  const currentScale = width / BASE_WIDTH;
  const n = (size) => Math.round(PixelRatio.roundToNearestPixel(size * currentScale));
  const nf = (size) => parseFloat((size * currentScale).toFixed(1));

  const isSmall = width < 340;
  const isNormal = width >= 340 && width < 400;
  const isLarge = width >= 400 && width < 450;
  const isXLarge = width >= 450;

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUnits((prev) => {
        const randomIncrement = Math.random() * 0.003 + 0.001;
        const newLive = parseFloat((prev + randomIncrement).toFixed(2));
        setThisMonthUnits((prevMonth) => parseFloat((prevMonth + randomIncrement).toFixed(2)));
        return newLive;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const dailyCostMMK = parseFloat((liveUnits * UNIT_PRICE).toFixed(1)); 
  const estimatedBillMMK = parseFloat((thisMonthUnits * UNIT_PRICE).toFixed(1)); 

  const circleSizeRatio = getResponsive(0.58, 0.52, 0.46, 0.40);
  const circleSize = width * circleSizeRatio;
  const strokeWidth = n(14);
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - 0.675 * circumference;

  const statusBarHeight = StatusBar.currentHeight || 0;

  return (
    <View style={styles.mainWrapper}>
      <StatusBar 
        barStyle="light-content" 
        translucent={true} 
        backgroundColor="transparent" 
      />

      <LinearGradient 
        colors={['#3975D3', '#aac3ea', '#AFC4E8']} 
        style={styles.gradientBg}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContainer,
              { paddingTop: statusBarHeight + n(10) }
            ]} 
            bounces={false} 
            showsVerticalScrollIndicator={false}
          >

            {/* ==================== HEADER ==================== */}
            <View style={[
              styles.header, 
              { 
                paddingHorizontal: n(20),
                marginVertical: n(8),
                height: n(56)
              }
            ]}>
              <View style={[
                styles.logoBadge,
                { 
                  width: n(48), 
                  height: n(48),
                  borderRadius: n(24)
                }
              ]}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} />
              </View>

              <TouchableOpacity 
                onPress={() => router.push({ pathname: '../Usage/Notification' })}
                style={{ padding: n(4) }}
              >
                <Image 
                  source={require('../../assets/Notifications.png')} 
                  style={{
                    width: n(28),
                    height: n(28),
                    resizeMode: 'contain'
                  }} 
                />
              </TouchableOpacity>
            </View>

            {/* ==================== TITLE ==================== */}
            <View style={[
              styles.titleArea, 
              { 
                paddingHorizontal: n(22),
                marginTop: n(2),
                marginBottom: n(8)
              }
            ]}>
              <Text style={[
                styles.mainTitleText,
                { fontSize: nf(11) }
              ]}>
                DAILY BUDGET PROGRESS
              </Text>
            </View>

            {/* ==================== CIRCULAR PROGRESS ==================== */}
            <View style={[
              styles.circleZone,
              { 
                marginVertical: n(8), 
                marginBottom: n(28)
              }
            ]}>
              <View style={styles.circleOuterShadow}>
                <Svg width={circleSize} height={circleSize}>
                  <Circle
                    stroke="rgba(255, 255, 255, 0.9)"
                    fill="none"
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                  />
                  <Circle
                    stroke="#15EA3E" 
                    fill="none"
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
                  />
                </Svg>
                <View style={styles.insideTextContainer}>
                  <Text style={[
                    styles.insideMmk,
                    { 
                      fontSize: nf(isSmall ? 17 : isNormal ? 19 : isLarge ? 21 : 23)
                    }
                  ]}>
                    {dailyCostMMK} MMK
                  </Text>
                  <Text style={[
                    styles.insideSub,
                    { fontSize: nf(10) }
                  ]}>
                    67.5% of daily Budget
                  </Text>
                </View>
              </View>
            </View>

            {/* ==================== CARDS CONTENT ==================== */}
            <View style={[
              styles.contentContainer,
              { 
                borderTopLeftRadius: n(16),
                borderTopRightRadius: n(16),
                paddingHorizontal: n(18),
                paddingTop: n(28),
                marginTop: n(30),
                paddingBottom: n(36),
                minHeight: SCREEN_H * 0.45
              }
            ]}>

              
              <View style={[
                styles.liveCard,
                {
                  borderRadius: n(12),
                  paddingVertical: n(6),
                  paddingHorizontal: n(14),
                  marginTop: n(-55),
                  marginBottom: n(16),
                  elevation: getResponsive(2, 3, 4, 5),
                }
              ]}>
                {/* Row 1: Title LEFT, Connected RIGHT (flex-end) */}
                <View style={styles.liveCardTopRow}>
                  <Text style={[
                    styles.liveCardTitle,
                    { fontSize: nf(9) }
                  ]}>
                    LIVE POWER USAGE
                  </Text>

                  <View style={styles.greenStatus}>
                    <View style={[
                      styles.greenDot,
                      { 
                        width: n(6), 
                        height: n(6),
                        borderRadius: n(3),
                        marginRight: n(4)
                      }
                    ]} />
                    <Text style={[
                      styles.greenStatusText,
                      { fontSize: nf(10) }
                    ]}>
                      Connected
                    </Text>
                  </View>
                </View>

                {/* Row 2: Units CENTERED */}
                <View style={styles.liveCardUnitsRow}>
                  <Text style={[
                    styles.liveCardUnits,
                    { 
                      fontSize: nf(isSmall ? 15 : isNormal ? 17 : 19)
                    }
                  ]}>
                    {liveUnits} Units
                  </Text>
                </View>

                {/* Row 3: Date */}
                <Text style={[
                  styles.liveCardDate,
                  { fontSize: nf(9) }
                ]}>
                  July 15, 2026
                </Text>
              </View>

              {/* ====== Card 2: Monthly Estimation ====== */}
              <View style={[
                styles.monthlyEstimationCard,
                {
                  borderRadius: n(16),
                  paddingVertical: n(14),
                  paddingHorizontal: n(14),
                  marginTop: n(12),
                  paddingBottom: n(14),
                  marginBottom: n(18),
                  elevation: getResponsive(3, 4, 5, 6),
                }
              ]}>
                <View style={[
                  styles.cardTopRow,
                  { 
                    marginBottom: n(4), 
                    paddingTop: n(4)
                  }
                ]}>
                  <Text style={[
                    styles.cardHeaderTitle,
                    { fontSize: nf(10) }
                  ]}>
                    MONTHLY ESTIMATION
                  </Text>

                  <TouchableOpacity style={[
                    styles.styledSetBudgetBtn,
                    {
                      paddingHorizontal: n(10),
                      paddingVertical: n(5),
                      borderRadius: n(12)
                    }
                  ]}>
                    <FontAwesome 
                      name="pencil" 
                      size={nf(11)} 
                      color="#2B6CB0" 
                      style={{ marginRight: n(4) }}
                    />
                    <Text style={[
                      styles.styledSetBudgetBtnText,
                      { fontSize: nf(10) }
                    ]}>
                      SET BUDGET
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: n(6) }}>
                  <View style={[
                    styles.gridDataRow,
                    { marginVertical: n(6), paddingVertical: n(2) }
                  ]}>
                    <Text style={[
                      styles.gridLabelText,
                      { fontSize: nf(11) }
                    ]}>
                      This Month So Far
                    </Text>
                    <Text style={[
                      styles.gridValueText,
                      { fontSize: nf(11) }
                    ]}>
                      : {thisMonthUnits} units
                    </Text>
                  </View>

                  <View style={[
                    styles.gridDataRow,
                    { marginVertical: n(6), paddingVertical: n(2) }
                  ]}>
                    <Text style={[
                      styles.gridLabelText,
                      { fontSize: nf(11) }
                    ]}>
                      Estimated Bill
                    </Text>
                    <Text style={[
                      styles.gridValueText,
                      { fontSize: nf(11) }
                    ]}>
                      : {estimatedBillMMK} MMK
                    </Text>
                  </View>

                  <View style={[
                    styles.gridDataRow,
                    { marginVertical: n(6), paddingVertical: n(2) }
                  ]}>
                    <Text style={[
                      styles.gridLabelText,
                      { fontSize: nf(11) }
                    ]}>
                      Monthly Budget Goal
                    </Text>
                    <Text style={[
                      styles.gridValueText,
                      { fontSize: nf(11) }
                    ]}>
                      : {MONTHLY_BUDGET_GOAL}MMK
                    </Text>
                  </View>
                </View>
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#143FA3',
  },
  gradientBg: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  logoBadge: {
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 2,
  },
  logo: { 
    width: '100%', 
    height: '100%',
    resizeMode: 'contain',
  },
  titleArea: {
    alignItems: 'flex-start',
  },
  mainTitleText: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  circleZone: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOuterShadow: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  insideTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insideMmk: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  insideSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },

  // ====== LIVE CARD - FIXED LAYOUT ======
  liveCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  // Row 1: Title + Connected (flex-end)
  liveCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',   // Title left, Connected right
    alignItems: 'center',
    width: '100%',
  },
  liveCardTitle: {
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 0.4,
  },
  greenStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    backgroundColor: '#15EA3E',
  },
  greenStatusText: {
    color: '#15EA3E',
    fontWeight: '600',
  },
  // Row 2: Units CENTERED
  liveCardUnitsRow: {
    width: '100%',
    alignItems: 'center',     // <-- This centers the Units horizontally
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  liveCardUnits: {
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  // Row 3: Date
  liveCardDate: {
    color: '#A0AEC0',
    textAlign: 'left',
  },

  // ====== MONTHLY CARD ======
  monthlyEstimationCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardHeaderTitle: {
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 0.4,
  },
  styledSetBudgetBtn: {
    backgroundColor: '#D6E4FF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  styledSetBudgetBtnText: {
    fontWeight: '700',
    color: '#2B6CB0',
  },
  gridDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabelText: {
    fontWeight: '700',
    color: '#2D3748',
    width: '52%',
  },
  gridValueText: {
    fontWeight: '700',
    color: '#2D3748',
    width: '48%',
  },
});