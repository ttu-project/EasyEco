import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from './authStorage';

const NOTIFICATION_HISTORY_KEY_PREFIX = 'easyeco_notification_history';
const MAX_NOTIFICATIONS = 200;

const getNotificationHistoryKey = async () => {
  const user = await getUser();
  const userId = user?._id || user?.id || user?.email || user?.phoneNumber;

  return userId ? `${NOTIFICATION_HISTORY_KEY_PREFIX}_${userId}` : null;
};

export async function getNotificationHistory() {
  try {
    const historyKey = await getNotificationHistoryKey();
    if (!historyKey) return [];

    const value = await AsyncStorage.getItem(historyKey);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.log('Notification history read error:', error);
    return [];
  }
}

export async function saveNotification({ title, body, type = 'general' }) {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    type,
    createdAt: new Date().toISOString(),
    read: false,
  };

  try {
    const historyKey = await getNotificationHistoryKey();
    if (!historyKey) return notification;

    const existing = await getNotificationHistory();
    const next = [notification, ...existing].slice(0, MAX_NOTIFICATIONS);
    await AsyncStorage.setItem(historyKey, JSON.stringify(next));
  } catch (error) {
    console.log('Notification history save error:', error);
  }

  return notification;
}

export async function markNotificationRead(id) {
  const historyKey = await getNotificationHistoryKey();
  if (!historyKey) return [];

  const existing = await getNotificationHistory();
  const next = existing.map((item) => (item.id === id ? { ...item, read: true } : item));
  await AsyncStorage.setItem(historyKey, JSON.stringify(next));
  return next;
}

export async function deleteStoredNotification(id) {
  const historyKey = await getNotificationHistoryKey();
  if (!historyKey) return [];

  const existing = await getNotificationHistory();
  const next = existing.filter((item) => item.id !== id);
  await AsyncStorage.setItem(historyKey, JSON.stringify(next));
  return next;
}
