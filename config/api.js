// config/api.js
import { Platform } from 'react-native';

const HOST = '192.168.100.241'; // <- your computer LAN IP
const PORT = '5000';

export const API_BASE_URL = `http://${HOST}:${PORT}/api`;