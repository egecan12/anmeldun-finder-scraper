import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Tüm randevuları getir
 */
export const fetchAppointments = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.APPOINTMENTS);
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

/**
 * Sadece yeni randevuları getir
 */
export const fetchNewAppointments = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.NEW_APPOINTMENTS);
    return response.data;
  } catch (error) {
    console.error('Error fetching new appointments:', error);
    throw error;
  }
};

/**
 * Manuel refresh (anında scrape)
 */
export const refreshAppointments = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.REFRESH);
    return response.data;
  } catch (error) {
    console.error('Error refreshing appointments:', error);
    throw error;
  }
};

/**
 * İstatistikleri getir
 */
export const fetchStats = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATS);
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

/**
 * Device'ı push notification için kaydet
 */
export const registerDevice = async (expoPushToken, userId = null) => {
  try {
    const response = await api.post(API_ENDPOINTS.REGISTER_DEVICE, {
      token: expoPushToken,
      userId: userId,
      platform: 'expo'
    });
    return response.data;
  } catch (error) {
    console.error('Error registering device:', error);
    throw error;
  }
};

export default api;

