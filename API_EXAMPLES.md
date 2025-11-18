# 📱 API Kullanım Örnekleri

## 🌐 Base URL

**Local:**
```
http://localhost:3000
```

**Render (Production):**
```
https://your-app-name.onrender.com
```

---

## 📋 API Endpoints

### 1. Ana Sayfa / Status

```bash
GET /
```

**Response:**
```json
{
  "status": "✅ Running",
  "service": "Anmeldung Finder API",
  "uptime": 3600,
  "endpoints": {
    "appointments": "/api/appointments",
    "new": "/api/appointments/new",
    "refresh": "/api/appointments/refresh",
    "health": "/health"
  },
  "stats": {
    "totalAppointments": 32,
    "newAppointments": 2,
    "lastScrapedAt": "2025-11-18T22:24:47.218Z"
  }
}
```

---

### 2. Tüm Mevcut Randevuları Al

```bash
GET /api/appointments
```

**Response:**
```json
{
  "success": true,
  "count": 32,
  "lastScrapedAt": "2025-11-18T22:24:47.218Z",
  "appointments": [
    {
      "date": "November 19",
      "time": "Tomorrow",
      "fullText": "November 19 - Tomorrow",
      "href": "/out/appointment-anmeldung"
    },
    {
      "date": "November 20",
      "time": "This Thursday",
      "fullText": "November 20 - This Thursday",
      "href": "/out/appointment-anmeldung"
    }
  ],
  "message": "Mevcut tüm randevular"
}
```

---

### 3. Sadece Yeni Randevuları Al

```bash
GET /api/appointments/new
```

**Response (Yeni randevu varsa):**
```json
{
  "success": true,
  "count": 2,
  "lastScrapedAt": "2025-11-18T22:24:47.218Z",
  "appointments": [
    {
      "date": "November 26",
      "time": "Next Wednesday",
      "fullText": "November 26 - Next Wednesday",
      "href": "/out/appointment-anmeldung"
    }
  ],
  "message": "Yeni randevular bulundu!"
}
```

**Response (Yeni randevu yoksa):**
```json
{
  "success": true,
  "count": 0,
  "lastScrapedAt": "2025-11-18T22:24:47.218Z",
  "appointments": [],
  "message": "Şu anda yeni randevu yok"
}
```

---

### 4. Manuel Refresh (Anında Scrape)

```bash
GET /api/appointments/refresh
```

**Response:**
```json
{
  "success": true,
  "count": 32,
  "newCount": 0,
  "lastScrapedAt": "2025-11-18T22:30:00.000Z",
  "appointments": [...],
  "newAppointments": [],
  "message": "Veriler yenilendi"
}
```

---

### 5. İstatistikler

```bash
GET /api/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalAppointments": 32,
    "newAppointments": 0,
    "lastScrapedAt": "2025-11-18T22:24:47.218Z",
    "uptime": 3600,
    "checkInterval": "20 saniye",
    "isCurrentlyScraping": false
  }
}
```

---

### 6. Health Check

```bash
GET /health
```

**Response:**
```
200 OK
```

---

## 💻 Kod Örnekleri

### JavaScript / Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'https://your-app.onrender.com';

// Tüm randevuları al
async function getAllAppointments() {
  try {
    const response = await axios.get(`${BASE_URL}/api/appointments`);
    const { success, count, appointments } = response.data;
    
    if (success) {
      console.log(`${count} randevu bulundu:`);
      appointments.forEach(apt => {
        console.log(`  - ${apt.fullText}`);
      });
    }
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

// Yeni randevuları kontrol et
async function checkNewAppointments() {
  try {
    const response = await axios.get(`${BASE_URL}/api/appointments/new`);
    const { success, count, appointments } = response.data;
    
    if (success && count > 0) {
      console.log(`🎉 ${count} yeni randevu bulundu!`);
      appointments.forEach(apt => {
        console.log(`  📅 ${apt.fullText}`);
      });
      return appointments;
    } else {
      console.log('Yeni randevu yok.');
      return [];
    }
  } catch (error) {
    console.error('Hata:', error.message);
    return [];
  }
}

// Otomatik kontrol (her 30 saniye)
setInterval(async () => {
  const newAppointments = await checkNewAppointments();
  
  if (newAppointments.length > 0) {
    // Notification gönder, email at, vs.
    sendNotification(newAppointments);
  }
}, 30000);
```

---

### React Native

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';

const BASE_URL = 'https://your-app.onrender.com';

export default function AppointmentScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCount, setNewCount] = useState(0);

  // Randevuları çek
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/appointments`);
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Yeni randevuları kontrol et
  const checkNewAppointments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/appointments/new`);
      const data = await response.json();
      
      if (data.success && data.count > 0) {
        setNewCount(data.count);
        
        // Push notification gönder
        sendPushNotification({
          title: '🎉 Yeni Randevu!',
          body: `${data.count} yeni randevu bulundu!`,
          data: { appointments: data.appointments }
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Component mount olduğunda ve her 30 saniyede bir
  useEffect(() => {
    fetchAppointments();
    checkNewAppointments();
    
    const interval = setInterval(checkNewAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {newCount > 0 && (
        <View style={{ backgroundColor: '#4caf50', padding: 10 }}>
          <Text style={{ color: 'white' }}>
            🎉 {newCount} yeni randevu bulundu!
          </Text>
        </View>
      )}
      
      <FlatList
        data={appointments}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text style={{ fontSize: 16 }}>📅 {item.fullText}</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchAppointments}
          />
        }
      />
    </View>
  );
}
```

---

### Flutter / Dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';

class AnmeldungService {
  static const String baseUrl = "https://your-app.onrender.com";
  
  // Appointment model
  static Future<AppointmentResponse> fetchAppointments() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/appointments'),
    );
    
    if (response.statusCode == 200) {
      return AppointmentResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load appointments');
    }
  }
  
  // Yeni randevuları kontrol et
  static Future<List<Appointment>> checkNewAppointments() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/appointments/new'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] && data['count'] > 0) {
        // Notification göster
        _showNotification(data['count']);
        
        return (data['appointments'] as List)
            .map((json) => Appointment.fromJson(json))
            .toList();
      }
    }
    return [];
  }
  
  static void _showNotification(int count) {
    // Push notification logic
    print('🎉 $count yeni randevu bulundu!');
  }
}

// Otomatik kontrol
Timer.periodic(Duration(seconds: 30), (timer) async {
  try {
    final newAppointments = await AnmeldungService.checkNewAppointments();
    if (newAppointments.isNotEmpty) {
      // UI güncelle
    }
  } catch (e) {
    print('Error: $e');
  }
});

// Model classes
class AppointmentResponse {
  final bool success;
  final int count;
  final String lastScrapedAt;
  final List<Appointment> appointments;
  
  AppointmentResponse({
    required this.success,
    required this.count,
    required this.lastScrapedAt,
    required this.appointments,
  });
  
  factory AppointmentResponse.fromJson(Map<String, dynamic> json) {
    return AppointmentResponse(
      success: json['success'],
      count: json['count'],
      lastScrapedAt: json['lastScrapedAt'],
      appointments: (json['appointments'] as List)
          .map((item) => Appointment.fromJson(item))
          .toList(),
    );
  }
}

class Appointment {
  final String date;
  final String time;
  final String fullText;
  final String href;
  
  Appointment({
    required this.date,
    required this.time,
    required this.fullText,
    required this.href,
  });
  
  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      date: json['date'],
      time: json['time'],
      fullText: json['fullText'],
      href: json['href'],
    );
  }
}
```

---

### Python

```python
import requests
import time

BASE_URL = "https://your-app.onrender.com"

def get_all_appointments():
    """Tüm randevuları al"""
    try:
        response = requests.get(f"{BASE_URL}/api/appointments")
        data = response.json()
        
        if data['success']:
            print(f"{data['count']} randevu bulundu:")
            for apt in data['appointments']:
                print(f"  - {apt['fullText']}")
            return data['appointments']
    except Exception as e:
        print(f"Hata: {e}")
        return []

def check_new_appointments():
    """Yeni randevuları kontrol et"""
    try:
        response = requests.get(f"{BASE_URL}/api/appointments/new")
        data = response.json()
        
        if data['success'] and data['count'] > 0:
            print(f"🎉 {data['count']} yeni randevu bulundu!")
            for apt in data['appointments']:
                print(f"  📅 {apt['fullText']}")
            return data['appointments']
        else:
            print("Yeni randevu yok.")
            return []
    except Exception as e:
        print(f"Hata: {e}")
        return []

# Otomatik kontrol (her 30 saniye)
while True:
    new_appointments = check_new_appointments()
    
    if new_appointments:
        # Email gönder, notification at, vs.
        send_notification(new_appointments)
    
    time.sleep(30)
```

---

### cURL

```bash
# Tüm randevuları al
curl https://your-app.onrender.com/api/appointments

# Sadece yeni randevuları al
curl https://your-app.onrender.com/api/appointments/new

# Manuel refresh
curl https://your-app.onrender.com/api/appointments/refresh

# İstatistikler
curl https://your-app.onrender.com/api/stats

# Health check
curl https://your-app.onrender.com/health

# Pretty print (jq ile)
curl -s https://your-app.onrender.com/api/appointments | jq '.appointments[] | .fullText'
```

---

## 🔔 Push Notification Entegrasyonu

### Firebase Cloud Messaging (FCM) - React Native

```javascript
import messaging from '@react-native-firebase/messaging';

// FCM token al
async function getFCMToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
}

// Backend'e token gönder (isteğe bağlı)
async function registerDevice(token) {
  await fetch(`${BASE_URL}/api/register-device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, userId: 'user123' })
  });
}

// Notification handler
messaging().onMessage(async remoteMessage => {
  console.log('Notification received:', remoteMessage);
  
  // Local notification göster
  await notifee.displayNotification({
    title: remoteMessage.notification.title,
    body: remoteMessage.notification.body,
  });
});
```

---

## 📊 Rate Limiting Önerileri

- ✅ Her 30-60 saniyede bir kontrol yeterli
- ❌ Çok sık istek atma (server'ı yorar)
- ✅ Yeni randevular için endpoint kullan: `/api/appointments/new`
- ✅ Tüm randevular gerekince: `/api/appointments`

---

## 🐛 Error Handling

```javascript
async function safeApiCall(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('API returned success: false');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    
    // Fallback veya retry logic
    return null;
  }
}
```

---

## 💡 Best Practices

1. **Cache kullan** - Her seferinde API'ye istek atma
2. **Polling interval** - 30-60 saniye ideal
3. **Error handling** - Network hataları için retry logic ekle
4. **Rate limiting** - Server'ı aşırı yükleme
5. **Battery optimization** - Mobil'de background fetch dikkatli kullan

---

**🎉 Başarılar!**

