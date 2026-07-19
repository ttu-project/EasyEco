import { StyleSheet, Text, View } from 'react-native'

import React, { useEffect, useState } from 'react';
import {
 TouchableOpacity, ScrollView,
  TextInput, SafeAreaView, Alert 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUsage } from './UsageContext';

const createDurationDate = (hours = 0, minutes = 0) => {
  const nextDate = new Date();
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
};

const parseDurationTime = (time = '') => {
  const hrMatch = time.match(/(\d+)\s*hr/);
  const minMatch = time.match(/(\d+)\s*min/);
  return {
    hours: hrMatch ? parseInt(hrMatch[1], 10) : 0,
    minutes: minMatch ? parseInt(minMatch[1], 10) : 0,
  };
};

const UsageTrackerComponent = ({ category, data }) => {
  const router = useRouter();
    // const { category } = useLocalSearchParams();
  // const { addUsage, removeUsage, getUsage } = useUsage();
  const usageContext = useUsage(); 
      // const categoryData = APPLIANCE_DATA[category];
   if (!data) {
    return <Text>Data မရှိပါ</Text>;
  }

  const { addUsage, removeUsage, getUsage, usageData } = usageContext || {};
 
    
      
      if (!data) {
        return (
          <SafeAreaView style={styles.container}>
            <Text>Category not found: {category}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text>Go Back</Text>
            </TouchableOpacity>
          </SafeAreaView>
        );
      }
    
      const [showPicker, setShowPicker] = useState(false);
      
      const [activeItemName, setActiveItemName] = useState('');
      const [date, setDate] = useState(() => createDurationDate());
      const [selectedTimes, setSelectedTimes] = useState({}); 
      const [customWatt, setCustomWatt] = useState('');
    
      const handleOpenPicker = (name) => {
        const selectedTime = parseDurationTime(selectedTimes[name]);
        setActiveItemName(name);
        setDate(createDurationDate(selectedTime.hours, selectedTime.minutes));
        setShowPicker(true);
      };
      const [currentUsage, setCurrentUsage] = useState(() => getUsage(category));
      useEffect(() => {
        setCurrentUsage(getUsage(category));
      }, [category, usageData]);

      const submitToUsage = async (item) => {
        if (!selectedTimes[item.name]) {
          Alert.alert("Please select time");
          return;
        }
        
        const timeDisplay = selectedTimes[item.name];
        const finalWatt = item.name === 'Custom' ? `${customWatt || 0}W` : item.watt;
        
        const newItem = {
          id: Date.now().toString(),
          name: item.name,
          watt: finalWatt,
          time: timeDisplay,
        };
    
        await addUsage(category, newItem);
        
        if (item.name === 'Custom') setCustomWatt('');
      };
    
      const handleDelete = (itemId) => {
        removeUsage(category, itemId);
      };
    
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.headerContainer}>
            {/* DYNAMIC TITLE */}
            <Text style={styles.sectionTitle}>{data.title} - Add Usage Details</Text>
            
            {/* ===== DYNAMIC CARDS - SAME DESIGN FOR ALL ===== */}
            {data.items.map((item, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>{item.watt} ({item.name})</Text>
                <TouchableOpacity style={styles.timePicker} onPress={() => handleOpenPicker(item.name)}>
                  <Text style={styles.timeText}>{selectedTimes[item.name] || "0 hr 00 min"} ▾</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => submitToUsage(item)}>
                  <Text style={styles.plus}>+</Text>
                </TouchableOpacity>
              </View>
            ))}
    
            {/* CUSTOM WATT CARD - SAME DESIGN */}
            {/* ===== CUSTOM WATT CARD - FIXED ===== */}
    <View style={[styles.card, { alignItems: 'flex-start' }]}>
      <View style={{ flex: 1, marginRight: 10, justifyContent: 'center' }}>
        <Text style={[styles.cardTitle, { marginBottom: 5, fontSize: 11,flex:0 }]}>
          Custom Watt
        </Text>
        <TextInput 
          placeholder="Enter Watt" 
          placeholderTextColor="#888" 
          style={styles.inputBox} 
          value={customWatt}
          onChangeText={(text) => setCustomWatt(text.replace(/[^0-9]/g, ''))} 
          keyboardType="numeric"
        />
      </View>
      
      {/* Time picker and + button aligned to right */}
      <View style={{ flexDirection: 'row',marginTop:11.5 ,alignItems: 'center',justifyContent:'space-between' }}>
        <TouchableOpacity style={styles.timePicker} onPress={() => handleOpenPicker('Custom')}>
          <Text style={styles.timeText}>{selectedTimes['Custom'] || "0 hr 00 min"} ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => submitToUsage({ name: 'Custom' })}>
          <Text style={styles.plus}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
            
            <Text style={styles.sectionTitle}>Current Usage</Text>
          </View>
    
          <View style={styles.usageGrid}>
            {currentUsage.map((item) => (
              <View key={item.id} style={styles.usageCard}>
                <View style={styles.usageTopRow}>
                  <Text style={styles.usageTextBold}>{item.watt}   {item.time}</Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.usageTextLight}>{item.name}</Text>
              </View>
            ))}
          </View>
    
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner"
              is24Hour={true}
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (event.type === 'set' && selectedDate) {
                  const hours = selectedDate.getHours();
                  const minutes = selectedDate.getMinutes();
                  setDate(createDurationDate(hours, minutes));
                  setSelectedTimes(prev => ({
                    ...prev,
                    [activeItemName]: `${hours} hr ${minutes.toString().padStart(2, '0')} min`
                  }));
                }
              }}
            />
          )}
          </ScrollView>
        </SafeAreaView>
      );
    }
    

export default UsageTrackerComponent

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30, paddingHorizontal:3,backgroundColor: '#f0f4f8' },
  scrollContent: { paddingBottom: 32 },
  backButton: { marginBottom: 10 },
  headerContainer: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15, color: '#333' },
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#4263eb', padding: 12, borderRadius: 12, marginBottom: 10 },
  cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 14, flex: 1}, 
  inputBox: { backgroundColor: 'white',width: '100%', height: 35, borderRadius: 6, paddingHorizontal: 8, fontSize: 13 },
  timePicker: { backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  timeText: { fontSize: 12, color: '#333' },
  plus: { color: 'white', fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
  usageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  usageCard: { backgroundColor: '#5c7cfa', padding: 12, borderRadius: 10, marginBottom: 10, width: '47%' },
  usageTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  usageTextBold: { color: 'white', fontWeight: 'bold', FontSize: 11 },
  usageTextLight: { color: '#e0e0e0', fontSize: 11 },
  closeBtn: { color: '#fff', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 40, padding: 20, borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 16 },
  confirmBtn: { backgroundColor: '#4263eb', padding: 12, borderRadius: 6, width: '100%', alignItems: 'center', marginTop: 20 },
  confirmText: { color: 'white', fontWeight: 'bold' },
})
