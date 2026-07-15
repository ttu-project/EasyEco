import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUsage } from './UsageContext';

const UsageTrackerComponent = ({ category, data }) => {
  const router = useRouter();
  const usageContext = useUsage();
  const scrollViewRef = useRef(null);

  if (!data) {
    return <Text>Data မရှိပါ</Text>;
  }

  const { addUsage, removeUsage, getUsage } = usageContext || {};
  console.log("🚀 Context ထဲက Functions များ:", { addUsage, removeUsage, getUsage });

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
  const [date, setDate] = useState(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
});
  const [selectedTimes, setSelectedTimes] = useState({ hr: 0, min: 0 });
  const [customWatt, setCustomWatt] = useState('');
  const [currentUsage, setCurrentUsage] = useState(() => getUsage(category));

  const handleOpenPicker = (name) => {
    setActiveItemName(name);
    setShowPicker(true);
  };

  const submitToUsage = (item) => {
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

    addUsage(category, newItem);
    setCurrentUsage(prev => [...prev, newItem]);

    setSelectedTimes(prev => ({
    ...prev,
    [item.name]: null 
  }));

    if (item.name === 'Custom') setCustomWatt('');
  };

  const handleDelete = (itemId) => {
    removeUsage(category, itemId);
    setCurrentUsage(prev => prev.filter(i => i.id !== itemId));
  };

  // ✅ Scroll to bottom when Custom input is focused
  const handleCustomFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ KeyboardAvoidingView wraps everything */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
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
            <Text style={styles.sectionTitle}>{data.title} - Add Usage Details</Text>

            {/* Dynamic Cards */}
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

            {/* Custom Watt Card */}
            <View style={[styles.card, { alignItems: 'flex-start' }]}>
              <View style={{ flex: 1, marginRight: 10, justifyContent: 'center' }}>
                <Text style={[styles.cardTitle, { marginBottom: 5, fontSize: 11, flex: 0 }]}>
                  Custom Watt
                </Text>
                <TextInput
                  placeholder="Enter Watt"
                  placeholderTextColor="#888"
                  style={styles.inputBox}
                  value={customWatt}
                  onChangeText={(text) => setCustomWatt(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  onFocus={handleCustomFocus}  // ✅ Scroll when focused
                />
              </View>

              <View style={{ flexDirection: 'row', marginTop: 11.5, alignItems: 'center', justifyContent: 'space-between' }}>
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

          <FlatList
            data={currentUsage}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.usageCard}>
                <View style={styles.usageTopRow}>
                  <Text style={styles.usageTextBold}>{item.watt}   {item.time}</Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.usageTextLight}>{item.name}</Text>
              </View>
            )}
            scrollEnabled={false}  // ✅ Let ScrollView handle scrolling
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          is24Hour={true}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (event.type === 'set' && selectedDate) {
              setDate(selectedDate);
              const hours = selectedDate.getHours();
              const minutes = selectedDate.getMinutes();
              setSelectedTimes(prev => ({
                ...prev,
                [activeItemName]: `${hours} hr ${minutes.toString().padStart(2, '0')} min`
              }));
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default UsageTrackerComponent;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 30, 
    paddingHorizontal: 3, 
    backgroundColor: '#f0f4f8' 
  },
  backButton: { 
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  headerContainer: { 
    paddingHorizontal: 20 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginVertical: 15, 
    color: '#333' 
  },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#4263eb', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10 
  },
  cardTitle: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 14, 
    flex: 1 
  },
  inputBox: { 
    backgroundColor: 'white', 
    width: '100%', 
    height: 35, 
    borderRadius: 6, 
    paddingHorizontal: 8, 
    fontSize: 13 
  },
  timePicker: { 
    backgroundColor: 'white', 
    paddingHorizontal: 8, 
    paddingVertical: 6, 
    borderRadius: 6 
  },
  timeText: { 
    fontSize: 12, 
    color: '#333' 
  },
  plus: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginLeft: 10 
  },
  columnWrapper: { 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  usageCard: { 
    backgroundColor: '#5c7cfa', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 10, 
    width: '47%' 
  },
  usageTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 5 ,
     width: '100%', 

  },
  usageTextBold: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 9 ,
     marginRight: 6, 
     numberOfLines: 1, 
  },
  usageTextLight: { 
    color: '#e0e0e0', 
    fontSize: 11 
  },
  closeBtn: { 
    color: '#fff', 
    fontSize: 16 ,
    width: 26,            
    height: 26,           
  textAlign: 'center',  
  lineHeight: 24, 
  },
});