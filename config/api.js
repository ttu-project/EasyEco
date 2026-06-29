import { Platform } from 'react-native';

export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://192.168.100.241:5000/api'
    : 'http://192.168.100.241:5000/api';
