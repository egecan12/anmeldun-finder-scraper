// API Configuration
// Production URL: https://anmeldun-finder-api.onrender.com

// Local IP'ni bul: Terminal'de `ipconfig getifaddr en0` (Mac) veya `ipconfig` (Windows)
// Senin IP'n: 192.168.178.99
const LOCAL_IP = '192.168.178.99';

// Her zaman production URL kullan (Render'da deploy edilmiş backend)
export const API_BASE_URL = 'https://anmeldun-finder-api.onrender.com';

// Local test için (gerekirse yorumu kaldır):
// export const API_BASE_URL = __DEV__ 
//   ? `http://${LOCAL_IP}:3000`
//   : 'https://anmeldun-finder-api.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  APPOINTMENTS: '/api/appointments',
  NEW_APPOINTMENTS: '/api/appointments/new',
  REFRESH: '/api/appointments/refresh',
  STATS: '/api/stats',
  REGISTER_DEVICE: '/api/register-device'
};

// Refresh Intervals
export const REFRESH_INTERVAL = 30000; // 30 seconds

// Colors
export const COLORS = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  accent: '#FF9800',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  newBadge: '#FF5722'
};

