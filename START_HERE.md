# 🚀 BAŞLANGIÇ REHBERİ

## Hoş Geldin! 👋

Bu proje, Berlin Anmeldung randevu sistemini otomatik olarak tarayan ve yeni randevuları tespit eden bir API sistemidir.

---

## 📋 Ne Yapmalısın? (3 Adımda)

### 1️⃣ Paketleri Yükle

```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder"
npm install
```

### 2️⃣ Çalıştır

**Seçenek A: API Server (Mobil app için - ÖNERİLEN)**
```bash
npm start
```

Bu şekilde çalıştırırsan:
- ✅ `http://localhost:3000` adresinde API çalışır
- ✅ Her 20 saniyede otomatik scraping yapar
- ✅ Mobil uygulamandan istek atabilirsin

**Seçenek B: Sadece Scraper (Konsola log)**
```bash
node scraper-puppeteer.js
```

Bu şekilde çalıştırırsan:
- ✅ Sadece terminalde log basar
- ✅ API yok

### 3️⃣ Test Et

Başka bir terminal aç:

```bash
# Randevuları kontrol et
curl http://localhost:3000/api/appointments

# Veya browser'da aç:
open http://localhost:3000
```

---

## 🌐 Render'a Deploy (Mobil App için)

1. **GitHub'a push et:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

2. **Render.com'a git** ve GitHub repo'nu bağla

3. **Ayarlar:**
   - Start Command: `node server.js`
   - Environment: `NODE_ENV=production`

4. **UptimeRobot ekle** (uyumayı önlemek için):
   - https://uptimerobot.com
   - URL: `https://your-app.onrender.com/health`
   - Interval: 5 dakika

**Detaylı rehber:** [RENDER_DEPLOY.md](RENDER_DEPLOY.md)

---

## 📱 Mobil Uygulamada Kullanım

Deploy sonrası şu endpoint'leri kullan:

```
GET  https://your-app.onrender.com/api/appointments      - Tüm randevular
GET  https://your-app.onrender.com/api/appointments/new  - Sadece yeni randevular
GET  https://your-app.onrender.com/api/appointments/refresh  - Manuel refresh
```

**Kod örnekleri:** [API_EXAMPLES.md](API_EXAMPLES.md)

---

## 📚 Dokümantasyon

- **[QUICK_START.md](QUICK_START.md)** - Local kullanım rehberi
- **[RENDER_DEPLOY.md](RENDER_DEPLOY.md)** - Render deployment
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Mobil app entegrasyonu
- **[README.md](README.md)** - Detaylı teknik döküman

---

## 🎯 Hızlı Test

```bash
# Terminal 1: Server'ı başlat
npm start

# Terminal 2: Test et
curl http://localhost:3000/api/appointments

# Veya test script'ini çalıştır
./test-api.sh
```

---

## 📊 Ne Göreceksin?

Server başladığında:

```
==================================================
🚀 ANMELDUNG FINDER API - ÇALIŞIYOR!
==================================================
🌐 Port: 3000
📍 URL: http://localhost:3000
⏱️  Check Interval: 20s
==================================================

📋 API Endpoints:
   GET  /                          - Status & Info
   GET  /api/appointments          - Tüm randevular
   GET  /api/appointments/new      - Sadece yeni randevular
   GET  /api/appointments/refresh  - Manuel refresh
   GET  /api/stats                 - İstatistikler
   GET  /health                    - Health check

🚀 Arka plan scraping başlatılıyor...
⏱️  Her 20 saniyede bir kontrol edilecek...

[2025-11-18T22:24:47.218Z] 🔍 Randevular kontrol ediliyor...
📊 32 randevu bulundu.
📝 İlk çalıştırma - başlangıç durumu kaydedildi.
```

Yeni randevu bulunca:

```
🎉 2 YENİ RANDEVU BULUNDU!
   📅 November 26 - Next Wednesday
   📅 November 27 - Thursday in 2 weeks
```

---

## ❓ Sorun mu Var?

### "command not found: npm"
Node.js kur: https://nodejs.org

### Port 3000 meşgul
```bash
# Farklı port kullan
PORT=4000 npm start
```

### Puppeteer hatası
```bash
npm install puppeteer --force
```

---

## 💡 İpuçları

- ✅ Server'ı arka planda çalıştırmak için: `nohup npm start &`
- ✅ Logları dosyaya kaydet: `npm start > logs.txt 2>&1`
- ✅ Kontrol sıklığını değiştir: `server.js` dosyasında `CHECK_INTERVAL`

---

## 🎉 Hepsi Bu!

Artık hazırsın! Sorular için:
- GitHub Issues
- Dokümantasyonlar
- Kod içindeki yorumlar

**Başarılar! 🍀**

