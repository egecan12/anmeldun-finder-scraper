# 🚀 Mobil App Kurulum Rehberi

## Adım Adım Kurulum

### 1️⃣ Node.js Kontrol

```bash
node --version  # v18+ olmalı
npm --version
```

Yoksa: https://nodejs.org

---

### 2️⃣ Expo CLI Kur (Global)

```bash
npm install -g expo-cli
```

Veya npx kullan (kurulum gerektirmez):
```bash
npx expo --version
```

---

### 3️⃣ Proje Klasörüne Git

```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder/mobile-app"
```

---

### 4️⃣ Bağımlılıkları Yükle

```bash
npm install
```

Bu 2-3 dakika sürebilir ☕

---

### 5️⃣ Backend URL'ini Ayarla

**ÖNEMLİ:** Backend'i Render'a deploy ettikten sonra!

`utils/constants.js` dosyasını aç:

```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'
  : 'https://anmeldung-finder-xyz.onrender.com';  // ← BUNU DEĞİŞTİR!
```

---

### 6️⃣ Backend'i Başlat (Local Test İçin)

Başka bir terminal aç:

```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder"
npm start
```

Backend `http://localhost:3000` adresinde çalışmalı.

---

### 7️⃣ Mobil App'i Başlat

```bash
npm start
```

Terminal'de QR kod göreceksin:

```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

---

### 8️⃣ Uygulamayı Aç

#### Fiziksel Cihazda (ÖNERİLEN):

**iOS:**
1. App Store'dan **Expo Go** indir
2. Kamera uygulamasını aç
3. QR kodu tara
4. "Open in Expo Go" tıkla

**Android:**
1. Play Store'dan **Expo Go** indir
2. Expo Go'yu aç
3. "Scan QR Code" tıkla
4. QR kodu tara

#### Simulator'de:

**iOS Simulator (Mac gerekli):**
```bash
# Terminal'de 'i' tuşuna bas
# veya
npm run ios
```

**Android Emulator:**
```bash
# Terminal'de 'a' tuşuna bas
# veya
npm run android
```

---

## ✅ İlk Çalıştırma

App açıldığında:

1. **Push notification izni** iste → **Allow** tıkla
2. **Randevular yükleniyor** göreceksin
3. **Randevu listesi** görünecek
4. **Aşağı çekerek** yenile

---

## 🔔 Push Notification Test

### Backend'den Test:

Backend'de yeni randevu bulunca otomatik notification gelecek.

### Manuel Test:

`services/notifications.js`'de test fonksiyonu var:

```javascript
import { schedulePushNotification } from './services/notifications';

// Test notification
await schedulePushNotification(
  '🎉 Test Notification',
  'Bu bir test bildirimidir!',
  { test: true }
);
```

---

## 🐛 Sorun Giderme

### "Network request failed"

**Sebep:** Backend'e erişemiyor

**Çözüm:**
1. Backend çalışıyor mu kontrol et:
```bash
curl http://localhost:3000/health
```

2. Aynı WiFi ağında mısın?
3. Firewall kapalı mı?

### "Push notifications not working"

**Sebep:** Simulator'de çalışmaz

**Çözüm:**
- Fiziksel cihazda test et
- İzin verildi mi kontrol et (Settings > Expo Go > Notifications)

### "Expo Go'da açılmıyor"

**Çözüm:**
```bash
# Tunnel mode dene
expo start --tunnel

# veya
npx expo start --tunnel
```

### "Module not found"

**Çözüm:**
```bash
# node_modules'u temizle
rm -rf node_modules
npm install

# Cache temizle
expo start -c
```

---

## 💡 Geliştirme İpuçları

### Hot Reload

Kod değiştirdiğinde otomatik yenilenir! 🔥

### Debug Menu

Cihazda **shake** yap veya:
- iOS: Cmd + D
- Android: Cmd + M

### Console Logs

Terminal'de göreceksin:
```bash
console.log('Test'); // Terminal'de görünür
```

### Network Requests

Chrome DevTools kullan:
```bash
# Terminal'de 'd' tuşuna bas
# Chrome açılır
```

---

## 📱 Production Build

### Android APK:

```bash
# EAS CLI kur
npm install -g eas-cli

# EAS'a login
eas login

# Build
eas build --platform android --profile preview
```

### iOS IPA:

```bash
# Apple Developer hesabı gerekli
eas build --platform ios --profile preview
```

---

## 🎯 Checklist

Kurulum tamamlandı mı kontrol et:

- [ ] Node.js kurulu (v18+)
- [ ] `npm install` başarılı
- [ ] Backend çalışıyor (`http://localhost:3000`)
- [ ] `utils/constants.js` URL'i doğru
- [ ] Expo Go yüklü (fiziksel cihazda)
- [ ] App başarıyla açıldı
- [ ] Push notification izni verildi
- [ ] Randevular görünüyor

---

## 🎉 Tamamlandı!

Artık mobil uygulamayı kullanabilirsin!

**Sırada ne var?**
1. Backend'i Render'a deploy et
2. Production URL'ini `constants.js`'e ekle
3. Test et!
4. Production build yap (opsiyonel)

**Sorular?** README.md'ye bak veya kod içindeki yorumları oku.

