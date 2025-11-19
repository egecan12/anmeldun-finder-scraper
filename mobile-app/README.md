# 📱 Anmeldung Finder - Mobil App

Expo ile yapılmış React Native mobil uygulama.

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
cd mobile-app
npm install
```

### 2. Backend URL'ini Ayarla

`utils/constants.js` dosyasını aç ve production URL'ini değiştir:

```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Local
  : 'https://YOUR-APP.onrender.com';  // ← BUNU DEĞİŞTİR!
```

### 3. Uygulamayı Başlat

```bash
npm start
```

Bu komut Expo Dev Server'ı başlatır.

### 4. Uygulamayı Aç

**Fiziksel Cihazda (Önerilen):**
1. App Store/Play Store'dan **Expo Go** uygulamasını indir
2. QR kodu tara
3. Uygulama açılır!

**Simulator'de:**
- iOS: `i` tuşuna bas
- Android: `a` tuşuna bas

---

## 📋 Özellikler

### ✅ Yapılanlar

- ✅ Ana sayfa ile randevu listesi
- ✅ Yeni randevular için badge
- ✅ Pull-to-refresh
- ✅ Otomatik güncelleme (30 saniyede bir)
- ✅ Expo Push Notifications
- ✅ Loading & error states
- ✅ Modern UI/UX

### 🎯 Kullanım

1. **İlk Açılış:**
   - Push notification izni iste
   - Device token'ı backend'e kaydet
   - Randevuları yükle

2. **Ana Sayfa:**
   - Tüm randevuları göster
   - Yeni randevular yeşil badge ile işaretli
   - Aşağı çekerek yenile

3. **Notification:**
   - Yeni randevu bulunca otomatik bildirim
   - Bildirime tıklayınca app açılır
   - Badge sayısı gösterir

---

## 🔧 Geliştirme

### Dosya Yapısı

```
mobile-app/
├── App.js                    # Ana uygulama
├── app.json                  # Expo config
├── package.json              # Dependencies
├── screens/
│   └── HomeScreen.js         # Ana sayfa
├── components/
│   ├── AppointmentCard.js    # Randevu kartı
│   └── NotificationBadge.js  # Yeni randevu badge
├── services/
│   ├── api.js                # Backend API
│   └── notifications.js      # Push notification
└── utils/
    └── constants.js          # Sabitler
```

### API Endpoints

App şu endpoint'leri kullanır:

```
GET  /api/appointments          - Tüm randevular
GET  /api/appointments/new      - Yeni randevular
POST /api/register-device       - Device kayıt
```

---

## 📱 Build & Deploy

### Android APK

```bash
# EAS Build (önerilen)
npm install -g eas-cli
eas build --platform android
```

### iOS IPA

```bash
# EAS Build (Apple Developer hesabı gerekli)
eas build --platform ios
```

### Expo Go ile Test

Development build gerekmiyor, Expo Go ile test edebilirsin!

---

## 🐛 Sorun Giderme

### "Network request failed"

Backend çalışıyor mu kontrol et:
```bash
curl http://localhost:3000/health
```

### "Push notifications not working"

1. Fiziksel cihazda test et (simulator'de çalışmaz)
2. İzin verildi mi kontrol et
3. Backend'de device kayıtlı mı kontrol et

### "Expo Go'da açılmıyor"

1. Expo Go güncel mi kontrol et
2. Aynı WiFi ağında mı kontrol et
3. `expo start --tunnel` dene

---

## 💡 İpuçları

### Local Development

Backend'i local'de çalıştırırken:

1. Backend'i başlat:
```bash
cd ..
npm start
```

2. Mobil app'i başlat:
```bash
cd mobile-app
npm start
```

3. Aynı WiFi ağında olduğundan emin ol

### Production Test

Render'a deploy ettikten sonra:

1. `utils/constants.js`'de URL'i değiştir
2. App'i yeniden başlat
3. Test et!

---

## 📚 Daha Fazla Bilgi

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)

---

## 🎉 Hazır!

Artık mobil uygulamayı kullanabilirsin!

**Sorular?** Backend README'sine bak veya kod içindeki yorumları oku.

