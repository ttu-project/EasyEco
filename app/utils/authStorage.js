import * as SecureStore from 'expo-secure-store';
import messaging from '@react-native-firebase/messaging';

const TOKEN_KEY = 'easyeco_auth_token';
const USER_KEY = 'easyeco_auth_user';

export const saveSession = async (userData) => {
  if (userData?.token) {
    await SecureStore.setItemAsync(TOKEN_KEY, userData.token);
  }

  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
};

export const getToken = async () => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const getUser = async () => {
  const userJson = await SecureStore.getItemAsync(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const clearSession = async () => {
  try {
    await messaging().unsubscribeFromTopic('daily_energy_tips');
  } catch (error) {
    console.log('Daily tips unsubscribe error:', error);
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};
