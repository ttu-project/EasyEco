import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useUsage } from '../Usage/UsageContext';

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

const CATEGORY_ICON_MAP = {
  refrigerator: 'fridge', ac: 'ac', washing: 'washing', bulb: 'bulb',
  fan: 'fan', tv: 'tv', iron: 'iron', microwave: 'microwave',
  rice: 'rice', pot: 'pot', kettle: 'kettle', vacuum: 'vacuum',
};

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function MyDevices() {
  const router = useRouter();
  const { getAllDevices, deleteDevice } = useUsage();
  const rawDevices = getAllDevices();

  const devices = rawDevices.map((d) => ({
    ...d,
    iconType: CATEGORY_ICON_MAP[d.categoryId] || 'bulb',
  }));

  const handleEdit = (item) => {
    router.push({
      pathname: '../Devices/EditDevice',
      params: {
        deviceId: item.id,
        categoryId: item.categoryId,
        title: item.name,
        iconType: item.iconType,
        mode: 'edit',
      },
    });
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Device', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDevice(item.id) },
    ]);
  };

  const renderIcon = (type) => {
    const src = ICON_MAP[type];
    if (src) return <Image source={src} style={styles.deviceIcon} />;
    return (
      <View style={styles.fallbackIcon}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path d="M12 3V21M3 12H21" stroke="#6B7280" strokeWidth="2" />
        </Svg>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My devices</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {devices.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No devices added yet.</Text>
            <Text style={styles.emptySub}>Tap + to add your first device.</Text>
          </View>
        )}

        {devices.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardLeft}>
              {renderIcon(item.iconType)}
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.watt} | {item.time}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)} hitSlop={8}>
                <EditIcon />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)} hitSlop={8}>
                <TrashIcon />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deviceIcon: { width: 40, height: 40, resizeMode: 'contain', marginRight: 12 },
  fallbackIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardText: { justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: '#6B7280' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { padding: 4 },
});