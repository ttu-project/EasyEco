import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '5000';
const API_PATH = '/api';

const CLOUD_SERVER_HOST = '118.27.151.8';

// Decide which backend host to use
const getDefaultHost = () => {
  return CLOUD_SERVER_HOST;
};

// Allow environment variable to override the default host
const API_HOST =
  process.env.EXPO_PUBLIC_API_HOST || getDefaultHost();

// Complete API URL
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  `http://${API_HOST}:${API_PORT}${API_PATH}`;

console.log('API_BASE_URL:', API_BASE_URL);