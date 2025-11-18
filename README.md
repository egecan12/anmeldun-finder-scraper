# Anmeldung Finder

Anmeldung randevu sistemini otomatik olarak tarayan ve yeni randevuları tespit eden bir scraper + REST API.

> 🚀 **Render'a deploy için:** [RENDER_DEPLOY.md](RENDER_DEPLOY.md) dosyasına bak!  
> 📖 **Local kullanım için:** [QUICK_START.md](QUICK_START.md) dosyasına bak!

## ✨ Özellikler

- ✅ **REST API** - Mobil app'ler için hazır endpoint'ler
- ✅ **Otomatik Scraping** - Arka planda 7/24 çalışır
- ✅ **Yeni Randevu Tespiti** - Gerçek zamanlı bildirim sistemi
- ✅ **Render Ready** - Tek tıkla deploy
- ✅ **Keep-Alive** - Ücretsiz plan'da bile uyumaz
- ✅ **Docker Support** - Container'da çalışır

## 🚀 Kurulum

```bash
npm install
```

## 📝 Kullanım

### 🚀 Seçenek 1: API Server (Mobil App İçin - ÖNERİLEN)

```bash
npm start
# veya
node server.js
```

Bu şekilde çalıştırırsan:
- ✅ REST API endpoints aktif olur
- ✅ Arka planda otomatik scraping çalışır (her 20 saniye)
- ✅ HTTP istekleriyle randevuları alabilirsin
- ✅ Render'a deploy edilebilir

**API Endpoints:**
```
GET  /api/appointments          - Tüm mevcut randevular
GET  /api/appointments/new      - Sadece yeni randevular
GET  /api/appointments/refresh  - Manuel refresh
GET  /api/stats                 - İstatistikler
GET  /health                    - Health check
```

### 🖥️ Seçenek 2: Sadece Scraper (Konsol)

```bash
node scraper-puppeteer.js
```

Bu şekilde çalıştırırsan:
- ✅ Sadece konsola log basar
- ✅ API yok
- ✅ Local kullanım için ideal

### 📋 Seçenek 3: Legacy Scraper (Static HTML)

`api-server.js` dosyasındaki `TARGET_URL` değişkenini değiştir ve çalıştır:

```bash
node api-server.js
```

## 🔌 API Endpoints

### GET /api/appointments
Tüm mevcut randevuları döner.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "lastUpdated": "2025-11-18T10:30:00.000Z",
  "appointments": [
    {
      "id": "November-19-Tomorrow",
      "date": "November 19",
      "time": "Tomorrow",
      "href": "/out/appointment-anmeldung",
      "fullText": "November 19 - Tomorrow",
      "scrapedAt": "2025-11-18T10:30:00.000Z"
    }
  ]
}
```

### GET /api/appointments/refresh
Anında yeni scraping yapar ve sonuçları döner.

### GET /api/status
Server durumunu kontrol eder.

**Response:**
```json
{
  "success": true,
  "status": "running",
  "lastUpdated": "2025-11-18T10:30:00.000Z",
  "appointmentCount": 5,
  "uptime": 3600
}
```

### POST /api/webhook
Push notification için webhook kaydı.

**Request Body:**
```json
{
  "deviceToken": "your-device-token",
  "userId": "user123"
}
```

## ⚙️ Özelleştirme

### Kontrol Sıklığını Değiştirme

`scraper.js` veya `api-server.js` içindeki interval değerini değiştir:

```javascript
setInterval(() => {
  scrapeAppointments();
}, 20000); // 20000 ms = 20 saniye
```

### HTML Selector'ı Değiştirme

Eğer HTML yapısı farklıysa, selector'ı değiştirebilirsin:

```javascript
$('a[href="/out/appointment-anmeldung"]').each((index, element) => {
  // Scraping logic
});
```

## 📱 Mobil App Entegrasyonu

### React Native Örneği:

```javascript
// Randevuları çek
const fetchAppointments = async () => {
  try {
    const response = await fetch('http://your-server:3000/api/appointments');
    const data = await response.json();
    
    if (data.success) {
      setAppointments(data.appointments);
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
  }
};

// Her 30 saniyede bir güncelle
useEffect(() => {
  fetchAppointments();
  const interval = setInterval(fetchAppointments, 30000);
  return () => clearInterval(interval);
}, []);
```

### Flutter Örneği:

```dart
// Randevuları çek
Future<List<Appointment>> fetchAppointments() async {
  final response = await http.get(
    Uri.parse('http://your-server:3000/api/appointments'),
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

// Timer ile güncelle
Timer.periodic(Duration(seconds: 30), (timer) {
  fetchAppointments();
});
```

## 🔔 Push Notification

Push notification için Firebase Cloud Messaging (FCM) veya benzeri bir servis kullanabilirsin:

1. Device token'ı `/api/webhook` endpoint'ine gönder
2. Yeni randevu bulunduğunda FCM ile notification gönder

## ⚠️ Dikkat Edilmesi Gerekenler

- Web sitesinin robots.txt dosyasını kontrol et
- Rate limiting'e dikkat et (çok sık istek atma)
- User-Agent header'ını kullan
- Yasal kurallara uy

## 📄 Lisans

ISC

