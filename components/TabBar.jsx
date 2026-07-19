import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Bot from '../assets/Bot.svg';
import Graph from '../assets/Graph.svg';
import Home from '../assets/Home.svg';
import Point from '../assets/Point.svg';
import User from '../assets/User.svg';
import Svg, { Path, Circle, Line, Polyline, Polygon } from 'react-native-svg';

const FLOATING_PADDING = 20;

// ==========================================================
// SVG Icons နှင့် Background
// ==========================================================
const TabBgSvg = ({ width, height, colors }) => {
  const center = width / 2;
  const notchRadius =30;
  const curveDepth =30;
 const d = `M 0 0 
    L ${center - notchRadius} 0 
    C ${center - notchRadius+10} 0 ${center - notchRadius + 10} ${curveDepth} ,${center} ${curveDepth} 
    C ${center + notchRadius - 10} ${curveDepth} ${center + notchRadius-10} 0 ,${center + notchRadius} 0 
    L ${width} 0 
    L ${width} ${height} 
    L 0 ${height} Z
  `;

  return (
    <Svg width={width} height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={{ position: 'absolute', top: 0, left: 0 ,}}>
      <Path d={d} fill={colors.card} />
    </Svg>
  );
};

export const RobotIcon = ({ size, color }) => <Bot width={size} height={size} stroke={color}/>;
export const HomeIcon = ({ color, size }) => <Home width={size} height={size} stroke={color}/>;
export const ChartIcon = ({ color, size }) => <Graph width={size} height={size} stroke={color}/>;
export const DollarIcon = ({ color, size }) => <Point width={size} height={size} stroke={color}/>;
export const UserIcon = ({ color, size }) => <User width={size} height={size} stroke={color}/>;

// ==========================================================
// TabBar Component
// ==========================================================
export function TabBar({ state, descriptors, navigation }) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const barWidth = Math.max(0, screenWidth - (FLOATING_PADDING * 2));
  const colors = { primary: '#1d4ed8', inactive: '#1d4ed8', card: '#ededed', accent: '#1e40af' };
  const routes = state?.routes || [{ key: 'index', name: 'index' }, { key: 'analytics', name: 'analytics' }, { key: 'robot', name: 'robot' }, { key: 'finance', name: 'finance' }, { key: 'profile', name: 'profile' }];
  const activeIndex = state?.index ?? 0;
  const barHeight = Platform.OS === 'ios' ? 70 : 60;
  const robotIndex = routes.findIndex(r => r.name.toLowerCase() === 'robot');

  return (
    <View style={[styles.outerContainer, { bottom: Math.max(FLOATING_PADDING, insets.bottom + 8) }]}>
      <View style={[styles.innerBarContainer, { height: barHeight }]}>
        <TabBgSvg width={barWidth} height={barHeight} colors={colors} />
        <View style={[styles.itemsContainer, { height: barHeight }]}>
          {routes.map((route, index) => {
            if (index === robotIndex) return <View key="spacer" style={styles.spacerItem} />;
            const isFocused = activeIndex === index;
            const renderIcon = () => {
              const name = route.name.toLowerCase();
              if (name === 'index') return <HomeIcon color={colors.inactive} size={28} />;
              if (name === 'analytics') return <ChartIcon color={colors.inactive} size={28} />;
              if (name === 'finance') return <DollarIcon color={colors.inactive} size={28} />;
              return <UserIcon color={colors.inactive} size={28} />;
            };
            return (
              <TouchableOpacity key={route.key} onPress={() => navigation?.navigate(route.name)} style={styles.tabItem}>
                <View style={styles.iconContainer}>{renderIcon()}</View>
                {isFocused && <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={[styles.centerButtonContainer, { left: barWidth / 2 - 35 }]}>
        <TouchableOpacity style={[styles.centerButton, { backgroundColor: colors.accent }]} onPress={() => navigation?.navigate('robot')}>
          <RobotIcon size={36} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { position: 'absolute', left: FLOATING_PADDING, right: FLOATING_PADDING, backgroundColor: 'transparent', overflow: 'visible', elevation: 8 },
  innerBarContainer: { position: 'relative', borderRadius: 35, overflow: 'hidden', backgroundColor: 'transparent',width: '100%' },
  itemsContainer: { flexDirection: 'row', width: '100%' },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  spacerItem: { flex: 1 },
  iconContainer: { height: 32, width: 32, justifyContent: 'center', alignItems: 'center' },
  centerButtonContainer: { position: 'absolute', width: 70, height: 70, zIndex: 10, justifyContent: 'center', alignItems: 'center'},
  centerButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#ffffff',marginTop:-25},
  activeIndicator: { width: 18, height: 3, borderRadius: 1.5, marginTop: 4 }
});
