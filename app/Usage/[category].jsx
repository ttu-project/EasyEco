import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, 
  TextInput, SafeAreaView, Alert 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UsageProvider, useUsage } from './UsageContext';
import UsageTrackerComponent from './UsageTrackerComponent';

// ===== CENTRAL DATA FOR ALL CATEGORIES =====
const APPLIANCE_DATA = {
  refrigerator: {
    title: 'Refrigerator',
    items: [
      { name: 'Mini Fridge', watt: '100W' },
      { name: 'Single Door', watt: '150W' },
      { name: 'Medium Double Door', watt: '200W' },
      { name: 'Large Double Door', watt: '300W' },
      { name: 'Side-by-Side', watt: '500W' },
    ]
  },
  fan: {
    title: 'Electric Fan',
    items: [
      { name: 'Ceiling Fan', watt: '75W' },
      { name: 'Table Fan', watt: '50W' },
      { name: 'Stand Fan', watt: '60W' },
      { name: 'Wall Fan', watt: '55W' },
      { name: 'Exhaust Fan', watt: '40W' },
    ]
  },
  ac: {
    title: 'Air Conditioner',
    items: [
      { name: '1 HP', watt: '900W' },
      { name: '1.5 HP', watt: '1300W' },
      { name: '2 HP', watt: '1800W' },
      { name: '2.5 HP', watt: '2300W' },
      { name: '3 HP', watt: '2800W' },
    ]
  },
  washing: {
    title: 'Washing Machine',
    items: [
      { name: 'Top Load', watt: '500W' },
      { name: 'Front Load', watt: '700W' },
      { name: 'Twin Tub', watt: '300W' },

    ]
  },
  bulb: {
    title: 'Electric Bulb',
    items: [
      { name: 'LED 5W', watt: '5W' },
      { name: 'LED 9W', watt: '9W' },
      { name: 'LED 12W', watt: '12W' },
      { name: 'CFL 15W', watt: '15W' },
      { name: 'Incandescent 60W', watt: '60W' },
    ]
  },
  tv: {
    title: 'Television',
    items: [
      { name: '24 Inch LED', watt: '40W' },
      { name: '32 Inch LED', watt: '60W' },
      { name: '43 Inch LED', watt: '80W' },
      { name: '55 Inch LED', watt: '120W' },
    ]
  },
  iron: {
    title: 'Electric Iron',
    items: [
      { name: 'Dry Iron', watt: '1000W' },
      { name: 'Steam Iron', watt: '1500W' },
    ]
  },
  microwave: {
    title: 'Microwave Oven',
    items: [
      { name: 'Small 20L', watt: '700W' },
      { name: 'Medium 25L', watt: '900W' },
      { name: 'Large 30L', watt: '1200W' },
    ]
  },
  rice: {
    title: 'Rice Cooker',
    items: [
      { name: 'Small 0.6L', watt: '300W' },
      { name: 'Medium 1L', watt: '500W' },
      { name: 'Large 1.8L', watt: '700W' },
    ]
  },
  pot: {
    title: 'Cooking Pot',
    items: [
      { name: 'Electric Pot Small', watt: '600W' },
      { name: 'Electric Pot Large', watt: '1000W' },
    ]
  },
  kettle: {
    title: 'Electric Kettle',
    items: [
      { name: 'Small 1L', watt: '1000W' },
      { name: 'Medium 1.5L', watt: '1500W' },
      { name: 'Large 2L', watt: '1800W' },
    ]
  },
  vacuum: {
    title: 'Vacuum Cleaner',
    items: [
      { name: 'Handheld', watt: '400W' },
      { name: 'Upright', watt: '800W' },
      { name: 'Robot', watt: '60W' },
    ]
  },
};

export default function UsageTracker() {
 
  const { category } = useLocalSearchParams();
  
  const categoryData = APPLIANCE_DATA[category];

  if(!categoryData){
    return <Text>There is no data{category}</Text>
  }
  
 return(
  
    <UsageTrackerComponent category={category} data={categoryData}/>
 
 );

}
