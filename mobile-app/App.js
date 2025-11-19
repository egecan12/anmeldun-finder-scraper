import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import { registerForPushNotificationsAsync } from './services/notifications';

export default function App() {
  useEffect(() => {
    // Push notification setup
    setupPushNotifications();
  }, []);

  const setupPushNotifications = async () => {
    try {
      // SDK 53'te Expo Go push notification desteklemiyor
      // Development build veya production build gerekli
      console.log('ℹ️  Push notifications Expo Go\'da çalışmaz (SDK 53+)');
      console.log('ℹ️  Production build\'de çalışacak');
      
      // Development build kontrolü
      const isExpoGo = __DEV__ && !require('expo-constants').default.appOwnership;
      
      if (isExpoGo) {
        console.log('⚠️  Expo Go kullanılıyor - Push notifications atlandı');
        return;
      }
      
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log('✅ Push notifications registered!');
        console.log('Token:', token);
      } else {
        console.log('⚠️  Push notifications not available');
      }
    } catch (error) {
      console.error('Push notification error:', error.message);
      // Hata gösterme, sadece log
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

