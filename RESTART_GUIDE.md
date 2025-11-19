# 🔄 Temiz Başlangıç Rehberi

## ✅ Tüm Portlar Temizlendi!

Şimdi her şeyi temiz başlatabilirsin.

---

## 🚀 Adım Adım Başlatma

### 1️⃣ Backend'i Başlat (Terminal 1)

```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder"
npm start
```

**Beklenen çıktı:**
```
==================================================
🚀 ANMELDUNG FINDER API - ÇALIŞIYOR!
==================================================
🌐 Port: 3000
📍 URL: http://localhost:3000
⏱️  Check Interval: 20s
==================================================
```

**Test et:**
```bash
curl http://localhost:3000/health
# 200 OK dönmeli
```

---

### 2️⃣ Mobil App'i Başlat (Terminal 2 - YENİ TERMINAL)

```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder/mobile-app"
npx expo start --clear
```

**Beklenen çıktı:**
```
Starting project at ...
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go
```

---

### 3️⃣ QR Kodu Tara

**iOS:**
- Kamera uygulamasını aç
- QR kodu tara
- "Open in Expo Go" tıkla

**Android:**
- Expo Go'yu aç
- "Scan QR Code" tıkla
- QR kodu tara

---

## 🐛 Hala Sorun Varsa

### Port Meşgul Hatası:

```bash
# Tüm portları temizle
lsof -ti:3000,8081,8082,8083 | xargs kill -9

# Veya tüm Node process'lerini durdur
pkill -f node
```

### RTC Fatal Error:

```bash
# Mobil app klasöründe
cd mobile-app
rm -rf node_modules .expo
npm install
npx expo start --clear
```

### Metro Bundler Hatası:

```bash
# Cache temizle
cd mobile-app
npx expo start --clear --reset-cache
```

### Expo Go Uyumsuzluk:

```bash
# Expo Go'yu güncelle
# App Store/Play Store → Expo Go → Update
```

---

## 📋 Kontrol Listesi

Başlatmadan önce kontrol et:

- [ ] Tüm portlar boş (yukarıdaki komutla temizlendi ✅)
- [ ] Backend klasöründe `node_modules` var
- [ ] Mobil app klasöründe `node_modules` var
- [ ] İnternet bağlantısı var
- [ ] Aynı WiFi ağındasın (local test için)

---

## 🎯 Başarılı Başlangıç Göstergeleri

### Backend:
```
✅ Port 3000'de çalışıyor
✅ curl http://localhost:3000/health → 200 OK
✅ Scraping başladı
```

### Mobil App:
```
✅ QR kod gösteriliyor
✅ Metro bundler çalışıyor
✅ "Bundling complete" mesajı geldi
```

### Telefonda:
```
✅ App açıldı
✅ "Anmeldung Finder" başlığı görünüyor
✅ Push notification izni istedi
```

---

## 💡 Hızlı Komutlar

**Tüm portları temizle:**
```bash
lsof -ti:3000,8081,8082,8083,19000,19001,19002 | xargs kill -9
```

**Tüm Node process'lerini durdur:**
```bash
pkill -f node
```

**Backend'i başlat:**
```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder" && npm start
```

**Mobil app'i başlat:**
```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder/mobile-app" && npx expo start --clear
```

---

## 🎉 Başarılar!

Her şey temizlendi ve hazır. Şimdi yukarıdaki adımları takip et!

