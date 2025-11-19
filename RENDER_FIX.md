# 🔧 Render Deployment Fix

## Problem
`Error: Cannot find module 'puppeteer'`

## Çözüm

### 1. Render Dashboard'da Build Command'i Değiştir:

**Şu anki (yanlış):**
```
npm install
```

**Yeni (doğru):**
```
./render-build.sh
```

**Veya:**
```
npm install && npx puppeteer browsers install chrome
```

---

### 2. Environment Variables Ekle:

Render Dashboard → Environment → Add:

```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome
NODE_ENV=production
```

---

### 3. Start Command Kontrol Et:

```
node server.js
```

---

## Alternatif: render.yaml Kullan

`render.yaml` dosyası zaten var, Render otomatik tanır:

```yaml
services:
  - type: web
    name: anmeldung-finder
    env: node
    buildCommand: ./render-build.sh
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
        value: false
```

---

## Manuel Deploy Steps:

1. **GitHub'a push et:**
```bash
git add .
git commit -m "Fix Render deployment - add Puppeteer dependencies"
git push
```

2. **Render'da:**
   - Settings → Build Command: `./render-build.sh`
   - Manual Deploy → Clear build cache & deploy

3. **Logs'u takip et:**
   - Deploy logs'ta "Build complete!" göreceksin
   - Chromium indirildiğini göreceksin

---

## ✅ Başarılı Deploy Sonrası:

```
✅ Build complete!
✅ Chromium installed
✅ Server starting...
🚀 ANMELDUNG FINDER API - ÇALIŞIYOR!
```

---

## 🐛 Hala Sorun Varsa:

### Sorun 1: Chromium bulunamıyor

**Çözüm:**
```bash
# server.js'de executablePath ekle
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

### Sorun 2: Out of memory

**Çözüm:**
- Render'da daha büyük instance kullan
- Veya scraping interval'ı artır (20s → 60s)

---

## 📊 Test Et:

Deploy tamamlandıktan sonra:

```bash
# Health check
curl https://your-app.onrender.com/health

# Appointments
curl https://your-app.onrender.com/api/appointments

# Stats
curl https://your-app.onrender.com/api/stats
```

---

## 🎯 Mobil App'te Production URL Ekle:

`mobile-app/utils/constants.js`:

```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.178.99:3000'
  : 'https://your-app.onrender.com'; // ← Render URL'ini gir
```

---

## ✅ Checklist:

- [ ] `render-build.sh` oluşturuldu
- [ ] Execute permission verildi (`chmod +x`)
- [ ] GitHub'a push edildi
- [ ] Render Build Command güncellendi
- [ ] Environment variables eklendi
- [ ] Deploy başlatıldı
- [ ] Logs takip edildi
- [ ] Health check başarılı
- [ ] Mobile app production URL güncellendi

---

**Başarılar! 🚀**

