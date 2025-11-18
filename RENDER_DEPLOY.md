# 🚀 Render'a Deploy Rehberi

## 📋 Adım Adım Render Deployment

### 1️⃣ GitHub'a Push Et

```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder"

# Git init (eğer henüz yapmadıysan)
git init
git add .
git commit -m "Initial commit: Anmeldung Finder API"

# GitHub repo oluştur ve push et
git remote add origin https://github.com/YOUR_USERNAME/anmeldung-finder.git
git branch -M main
git push -u origin main
```

### 2️⃣ Render'a Kayıt Ol

- **https://render.com** adresine git
- GitHub hesabınla giriş yap (ücretsiz)

### 3️⃣ Yeni Web Service Oluştur

1. **Dashboard > New > Web Service** tıkla
2. **Connect GitHub** repository'ni seç: `anmeldung-finder`
3. **Configure** sayfasında:

#### Temel Ayarlar:
```
Name: anmeldung-finder
Region: Frankfurt (Almanya'ya en yakın)
Branch: main
Runtime: Node
```

#### Build & Start:
```
Build Command: npm install
Start Command: node server.js
```

#### Plan:
```
Instance Type: Free
```

### 4️⃣ Environment Variables Ekle

**Environment** sekmesine şunları ekle:

```env
NODE_ENV=production
CHECK_INTERVAL=20000
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

### 5️⃣ Deploy Et!

**Create Web Service** butonuna bas. 

Deploy süreci 3-5 dakika sürer (Chromium indirme dahil).

### 6️⃣ URL'ini Al

Deploy tamamlanınca şöyle bir URL alacaksın:

```
https://anmeldung-finder-xyz.onrender.com
```

---

## 🔔 Keep-Alive Kurulumu (Uyumayı Önle)

### UptimeRobot ile (ÖNERİLEN):

1. **https://uptimerobot.com** - Ücretsiz kayıt ol
2. **Add New Monitor:**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Anmeldung Finder`
   - URL: `https://anmeldung-finder-xyz.onrender.com/health`
   - Monitoring Interval: `5 minutes`
3. **Create Monitor**

✅ Artık her 5 dakikada ping atılacak ve server uyumayacak!

---

## 📱 API Kullanımı

Deploy tamamlandıktan sonra şu endpoint'leri kullanabilirsin:

### 🌐 Base URL:
```
https://anmeldung-finder-xyz.onrender.com
```

### 📋 Endpoints:

#### 1. Tüm Mevcut Randevuları Al
```bash
GET https://anmeldung-finder-xyz.onrender.com/api/appointments
```

**Response:**
```json
{
  "success": true,
  "count": 31,
  "lastScrapedAt": "2025-11-18T10:30:00.000Z",
  "appointments": [
    {
      "date": "November 19",
      "time": "Tomorrow",
      "fullText": "November 19 - Tomorrow",
      "href": "/out/appointment-anmeldung"
    }
  ],
  "message": "Mevcut tüm randevular"
}
```

#### 2. Sadece Yeni Randevuları Al
```bash
GET https://anmeldung-finder-xyz.onrender.com/api/appointments/new
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "lastScrapedAt": "2025-11-18T10:30:00.000Z",
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

#### 3. Manuel Refresh (Anında Scrape)
```bash
GET https://anmeldung-finder-xyz.onrender.com/api/appointments/refresh
```

#### 4. İstatistikler
```bash
GET https://anmeldung-finder-xyz.onrender.com/api/stats
```

#### 5. Health Check
```bash
GET https://anmeldung-finder-xyz.onrender.com/health
```

---

## 📱 Mobil Uygulamada Kullanım

### React Native Örneği:

```javascript
const API_URL = "https://anmeldung-finder-xyz.onrender.com";

// Tüm randevuları çek
const fetchAppointments = async () => {
  try {
    const response = await fetch(`${API_URL}/api/appointments`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`${data.count} randevu bulundu`);
      setAppointments(data.appointments);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Sadece yeni randevuları kontrol et
const checkNewAppointments = async () => {
  try {
    const response = await fetch(`${API_URL}/api/appointments/new`);
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      // Yeni randevu var! Notification gönder
      sendPushNotification({
        title: "🎉 Yeni Randevu!",
        body: `${data.count} yeni randevu bulundu!`,
        data: data.appointments
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Her 30 saniyede bir kontrol et
useEffect(() => {
  checkNewAppointments();
  const interval = setInterval(checkNewAppointments, 30000);
  return () => clearInterval(interval);
}, []);
```

### Flutter Örneği:

```dart
import 'dart:async';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AnmeldungService {
  static const String baseUrl = "https://anmeldung-finder-xyz.onrender.com";
  
  // Tüm randevuları çek
  Future<List<Appointment>> fetchAppointments() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/appointments'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success']) {
        return (data['appointments'] as List)
            .map((json) => Appointment.fromJson(json))
            .toList();
      }
    }
    throw Exception('Failed to load appointments');
  }
  
  // Yeni randevuları kontrol et
  Future<List<Appointment>> checkNewAppointments() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/appointments/new'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] && data['count'] > 0) {
        // Notification gönder
        _sendNotification(data['count']);
        
        return (data['appointments'] as List)
            .map((json) => Appointment.fromJson(json))
            .toList();
      }
    }
    return [];
  }
  
  void _sendNotification(int count) {
    // Push notification logic
  }
}

// Timer ile otomatik kontrol
Timer.periodic(Duration(seconds: 30), (timer) {
  AnmeldungService().checkNewAppointments();
});
```

---

## 🐛 Sorun Giderme

### Deploy başarısız oluyor?

**Build logs**'u kontrol et. Puppeteer hatası varsa:

1. Render Dashboard > Settings > Environment
2. Ekle: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false`
3. **Manual Deploy** ile tekrar dene

### Server çok yavaş?

Free tier ilk istekte cold start yapar (15-30 saniye). Çözüm:

- UptimeRobot ekle (yukarıda anlattım)
- Veya Render Paid plan ($7/ay)

### "Too Many Requests" hatası?

Render free tier'ın limitleri:
- 500 saat/ay
- CPU/RAM kısıtlı

Çözüm: Paid plan veya farklı platform (Railway.app)

---

## 💡 İpuçları

### ✅ Logları İzle

Render Dashboard'da:
```
Logs > Show logs
```

Canlı log stream'i göreceksin.

### ✅ Manuel Restart

Sorun olursa:
```
Manual Deploy > Deploy latest commit
```

### ✅ Custom Domain (Opsiyonel)

Kendi domain'ini bağlayabilirsin:
```
Settings > Custom Domain > Add
```

---

## 📊 Beklenen Performans

- **İlk istek:** 15-30 saniye (cold start)
- **Sonraki istekler:** 1-3 saniye
- **Scraping süresi:** 3-5 saniye
- **RAM kullanımı:** 300-500 MB
- **Uptime:** %99+ (UptimeRobot ile)

---

## ✅ Checklist

Deploy öncesi kontrol et:

- [ ] GitHub'a push edildi
- [ ] `package.json`'da `start` script'i var
- [ ] Render'a kaydoldum
- [ ] Web Service oluşturdum
- [ ] Environment variables ayarlandı
- [ ] Deploy başarılı
- [ ] URL çalışıyor
- [ ] UptimeRobot monitor eklendi

---

## 🎉 Tamamlandı!

Artık API'n 7/24 çalışıyor ve her 20 saniyede randevuları kontrol ediyor!

**Sorular?**
- Render Docs: https://render.com/docs
- GitHub Issues'da sor

