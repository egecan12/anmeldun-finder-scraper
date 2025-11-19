import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDevice } from './api';

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Push notification izni al ve token'ı kaydet
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Push notification izni gerekli!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
    
    // Token'ı local storage'a kaydet
    await AsyncStorage.setItem('expoPushToken', token);
    
    // Backend'e kaydet
    try {
      await registerDevice(token);
      console.log('Device registered successfully!');
    } catch (error) {
      console.error('Failed to register device:', error);
    }
    
  } else {
    alert('Push notifications sadece fiziksel cihazlarda çalışır!');
  }

  return token;
}

/**
 * Kayıtlı token'ı al
 */
export async function getStoredPushToken() {
  try {
    const token = await AsyncStorage.getItem('expoPushToken');
    return token;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
}

/**
 * Local notification göster (test için)
 */
export async function schedulePushNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: data,
      sound: true,
    },
    trigger: { seconds: 1 },
  });
}

/**
 * Badge sayısını ayarla
 */
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Badge'i temizle
 */
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

