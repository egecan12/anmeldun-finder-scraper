import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  AppState
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppointmentCard from '../components/AppointmentCard';
import NotificationBadge from '../components/NotificationBadge';
import { fetchAppointments, fetchNewAppointments } from '../services/api';
import { COLORS, REFRESH_INTERVAL } from '../utils/constants';
import { setBadgeCount } from '../services/notifications';

export default function HomeScreen() {
  const [appointments, setAppointments] = useState([]);
  const [newAppointmentIds, setNewAppointmentIds] = useState(new Set());
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef();
  const responseListener = useRef();

  // İlk yükleme
  useEffect(() => {
    loadAppointments();
    setupNotifications();
    startAutoRefresh();

    // App state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopAutoRefresh();
      subscription.remove();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Notification setup
  const setupNotifications = () => {
    try {
      // Notification geldiğinde
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        // Yeni randevuları kontrol et
        checkNewAppointments();
      });

      // Notification'a tıklandığında
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response);
        // Randevuları yenile
        loadAppointments();
      });
    } catch (error) {
      console.log('Notification setup skipped (Expo Go)');
    }
  };

  // App state değişikliği
  const handleAppStateChange = (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App foreground'a geldi, yenile
      console.log('App came to foreground, refreshing...');
      loadAppointments();
      checkNewAppointments();
    }
    appState.current = nextAppState;
  };

  // Randevuları yükle
  const loadAppointments = async () => {
    try {
      const response = await fetchAppointments();
      
      if (response.success) {
        setAppointments(response.appointments);
        setLastUpdated(new Date());
        
        // Önceki yeni randevuları kontrol et
        await loadStoredNewAppointments(response.appointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Hata', 'Randevular yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Yeni randevuları kontrol et
  const checkNewAppointments = async () => {
    try {
      const response = await fetchNewAppointments();
      
      if (response.success && response.count > 0) {
        const newIds = new Set(response.appointments.map(app => 
          `${app.date}-${app.time}`
        ));
        
        setNewAppointmentIds(newIds);
        setNewCount(response.count);
        
        // Badge güncelle
        await setBadgeCount(response.count);
        
        // Local storage'a kaydet
        await AsyncStorage.setItem('newAppointmentIds', JSON.stringify([...newIds]));
        
        // Randevuları yenile
        await loadAppointments();
      }
    } catch (error) {
      console.error('Error checking new appointments:', error);
    }
  };

  // Kaydedilmiş yeni randevuları yükle
  const loadStoredNewAppointments = async (currentAppointments) => {
    try {
      const stored = await AsyncStorage.getItem('newAppointmentIds');
      if (stored) {
        const storedIds = new Set(JSON.parse(stored));
        
        // Mevcut randevularla karşılaştır
        const validIds = new Set();
        currentAppointments.forEach(app => {
          const id = `${app.date}-${app.time}`;
          if (storedIds.has(id)) {
            validIds.add(id);
          }
        });
        
        setNewAppointmentIds(validIds);
        setNewCount(validIds.size);
        await setBadgeCount(validIds.size);
      }
    } catch (error) {
      console.error('Error loading stored new appointments:', error);
    }
  };

  // Otomatik yenileme başlat
  const startAutoRefresh = () => {
    intervalRef.current = setInterval(() => {
      console.log('Auto-refreshing appointments...');
      checkNewAppointments();
    }, REFRESH_INTERVAL);
  };

  // Otomatik yenilemeyi durdur
  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
    checkNewAppointments();
  };

  // Randevu yeni mi kontrol et
  const isNewAppointment = (appointment) => {
    const id = `${appointment.date}-${appointment.time}`;
    return newAppointmentIds.has(id);
  };

  // Render item
  const renderAppointment = ({ item }) => (
    <AppointmentCard 
      appointment={item} 
      isNew={isNewAppointment(item)}
    />
  );

  // Header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>📅 Anmeldung Finder</Text>
      {lastUpdated && (
        <Text style={styles.subtitle}>
          Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
        </Text>
      )}
      <NotificationBadge count={newCount} />
    </View>
  );

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyText}>Şu anda randevu yok</Text>
      <Text style={styles.emptySubtext}>
        Yeni randevular bulunduğunda hemen bildirim alacaksınız!
      </Text>
      <Text style={styles.emptyInfo}>
        ✓ Arka planda otomatik kontrol ediliyor
      </Text>
      <Text style={styles.emptyInfo}>
        ✓ Her 30 saniyede bir güncelleniyor
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Randevular yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item, index) => `${item.date}-${item.time}-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyInfo: {
    fontSize: 14,
    color: COLORS.success,
    textAlign: 'center',
    marginTop: 8,
  },
});

