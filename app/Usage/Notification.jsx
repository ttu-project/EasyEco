import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AntDesign } from '@expo/vector-icons';

// ============================================================
// 🔧 CONFIGURATION
// ============================================================

const USE_BACKEND = false;
const API_BASE_URL = 'https://your-backend-url.com/api';

// ============================================================
// 📦 DEMO DATA
// ============================================================

const DEMO_NOTIFICATIONS = [
  {
    id: '1',
    icon: require('../../assets/dollar.png'),
    title: 'Your estimated bill has been updated',
    time: '1m ago',
    date: 'Today',
  },
  {
    id: '2',
    icon: require('../../assets/bulb.png'),
    title: 'Try reducing your air conditioner usage to lower your bill',
    time: '2h ago',
    date: 'Today',
  },
  {
    id: '3',
    icon: require('../../assets/Bell.png'),
    title: 'Track your electricity usage to save energy',
    time: '3h ago',
    date: 'Today',
  },
  {
    id: '4',
    icon: require('../../assets/alert.png'),
    title: 'Your electricity usage increased this month',
    subtitle: 'Review your appliances to save energy',
    time: '12h ago',
    date: 'Today',
  },
  {
    id: '5',
    icon: require('../../assets/barchart.png'),
    title: "Compare this month's usage with last month",
    time: '2d ago',
    date: 'Yesterday',
  },
  {
    id: '6',
    icon: require('../../assets/dollar.png'),
    title: 'Your estimated bill has been updated',
    time: '2d ago',
    date: 'This month',
  },
  {
    id: '7',
    icon: require('../../assets/bulb.png'),
    title: 'Try reducing your air conditioner usage to lower your bill',
    time: '7d ago',
    date: 'This month',
  },
  {
    id: '8',
    icon: require('../../assets/Bell.png'),
    title: 'Track your electricity usage to save energy',
    time: '2w ago',
    date: 'This month',
  },
];

// ============================================================
// 🏠 COMPONENT
// ============================================================

export default function NotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchFromBackend = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      setNotifications(data.notifications || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    }
  };

  const loadDemoData = () => {
    setNotifications(DEMO_NOTIFICATIONS);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    if (USE_BACKEND) await fetchFromBackend();
    else loadDemoData();
    setLoading(false);
    setRefreshing(false);
  };

  const markAsRead = async (id) => {
    if (USE_BACKEND) {
      try {
        await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) { console.error('Error marking as read:', error); }
    }
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const deleteNotification = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (USE_BACKEND) {
              try {
                await fetch(`${API_BASE_URL}/notifications/${id}`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                });
              } catch (error) { console.error('Error deleting:', error); }
            }
            setNotifications((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  const groupNotificationsByDate = () => {
    const groups = {};
    notifications.forEach((item) => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return groups;
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };
  const goBackToHome = () => { router.back(); };

  const handleHelp = () => {
    Alert.alert('Help', 'Here you can see all your notifications. Tap to mark as read, long press to delete.');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2167E1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error && USE_BACKEND) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity onPress={goBackToHome} style={styles.headerButton}>
            <AntDesign name="arrowleft" size={24} color="#0D2A4A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleHelp} style={styles.headerButton}>
            <Text style={styles.helpText}>?</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>You're all caught up! Check back later.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedData = groupNotificationsByDate();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
       <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)')}>
                 <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                   <Path d="M15 19L8 12L15 5" stroke="#0D2A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 </Svg>
               </TouchableOpacity>


        <Text style={styles.headerTitle}>Notifications</Text>
        
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {Object.entries(groupedData).map(([date, items]) => (
          <View key={date} style={styles.section}>
            <Text style={styles.sectionHeader}>{date}</Text>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.notificationCard}
                activeOpacity={0.7}
                onPress={() => markAsRead(item.id)}
                onLongPress={() => deleteNotification(item.id)}
              >
                {/* Icon - no circle background */}
                <View style={styles.iconWrapper}>
                  <Image source={item.icon} style={styles.iconImage} />
                </View>

                {/* Content */}
                <View style={styles.contentWrapper}>
                  {/* Title + Time row */}
                  <View style={styles.titleRow}>
                    <Text style={styles.titleText} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>

                  {/* Subtitle if exists */}
                  {item.subtitle && (
                    <Text style={styles.subtitleText}>{item.subtitle}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  // Header
  header: {
   paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 12,
   alignItems: 'flex-start', 
  
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginTop: 15,
    alignItems: 'flex-start',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,        // Bigger
  fontWeight: '700',
  color: '#2167E1',    // Blue like screenshot
  marginTop: 4,
  },
  helpText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0D2A4A',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D2A4A',
    marginBottom: 8,
    paddingVertical: 4,
  },
  // ✅ Card - light gray background, no border
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8EDF3',  // ✅ Light gray like screenshot
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  // ✅ Icon - no circle background, just the image
  iconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  iconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: '#0D2A4A',  // ✅ Dark icon color
  },
  // ✅ Content layout
  contentWrapper: {
    flex: 1,
  },
  // ✅ Title row with time at top right
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0D2A4A',
    lineHeight: 20,
    flex: 1,
    paddingRight: 8,
  },
  // ✅ Time at top right
  timeText: {
    fontSize: 12,
    color: '#8E9DB0',
    flexShrink: 0,
  },
  // ✅ Subtitle below title in lighter blue
  subtitleText: {
    fontSize: 13,
    color: '#6B8FC7',  // ✅ Lighter blue color
    lineHeight: 18,
    marginTop: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7A8F',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0D2A4A',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7A8F',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2167E1',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0D2A4A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E9DB0',
    textAlign: 'center',
  },
});