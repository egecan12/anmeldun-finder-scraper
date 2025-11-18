# 🚀 Hızlı Başlangıç Rehberi

## 📋 Adım Adım Kurulum ve Çalıştırma

### 1️⃣ Terminal'i Aç

macOS'ta:
- **Spotlight** ile (Cmd + Space) "Terminal" yaz ve aç
- Veya **Applications > Utilities > Terminal**

### 2️⃣ Proje Klasörüne Git

```bash
cd "/Users/egecankahyaoglu/Desktop/repos/anmeldung finder"
```

### 3️⃣ Paketleri Yükle (İlk Seferde)

```bash
npm install
```

Bu komut:
- ✅ Node.js paketlerini indirir
- ✅ Puppeteer'ı ve Chromium'u kurar
- ⏱️ 1-2 dakika sürebilir (internet hızına bağlı)

### 4️⃣ Scraper'ı Başlat

**Yöntem 1: Kolay yol**
```bash
./start.sh
```

**Yöntem 2: Manuel**
```bash
node scraper-puppeteer.js
```

### 5️⃣ Çalışıyor! 🎉

Şöyle bir ekran göreceksin:

```
🚀 Anmeldung Finder (Puppeteer) başlatıldı!
📍 Hedef URL: https://allaboutberlin.com/tools/appointment-finder
⏱️  Her 20 saniyede bir kontrol edilecek...

[2025-11-18T10:30:00.000Z] Randevular kontrol ediliyor...
📊 31 randevu bulundu.
📝 İlk çalıştırma - başlangıç durumu kaydedildi.

📋 Mevcut Randevular:
   1. November 19 - Tomorrow
   2. November 20 - This Thursday
   ...
```

### 6️⃣ Durdurmak İçin

Terminalde **CTRL + C** tuşlarına bas.

---

## ⚙️ Ayarları Değiştirme

### Kontrol Sıklığını Değiştir

`scraper-puppeteer.js` dosyasını aç ve **5. satırı** değiştir:

```javascript
const CHECK_INTERVAL = 20000; // 20 saniye
```

**Örnek değerler:**
- `10000` = 10 saniye (çok sık, site banlamasın!)
- `20000` = 20 saniye (varsayılan, önerilen)
- `30000` = 30 saniye
- `60000` = 1 dakika

---

## 🔔 Yeni Randevu Bulunca Ne Olur?

Scraper yeni bir randevu bulduğunda şöyle bir mesaj görürsün:

```
🎉 YENİ RANDEVU(LAR) BULUNDU! 🎉
================================
📅 November 26 - Next Wednesday
================================
```

Bu mesajı gördüğünde:
1. Hemen siteye git: https://allaboutberlin.com/tools/appointment-finder
2. Randevuyu rezerve et!

---

## 💡 İpuçları

### ✅ Uzun Süre Çalışması İçin

Terminal penceresini **açık bırak**. Pencereyi kapatırsan program durur.

### ✅ Arka Planda Çalıştırmak İçin

```bash
nohup node scraper-puppeteer.js > logs.txt 2>&1 &
```

Durdurmak için:
```bash
pkill -f scraper-puppeteer
```

### ✅ Otomatik Başlangıç (macOS)

Her açılışta otomatik başlatmak için:

1. **System Preferences > Users & Groups > Login Items**
2. `start.sh` dosyasını ekle

veya `launchd` kullan (gelişmiş)

---

## 🐛 Sorun Giderme

### "command not found: node"

Node.js yüklü değil. Yükle:
```bash
brew install node
```

Brew yoksa: https://nodejs.org adresinden indir

### "ECONNREFUSED" veya "socket hang up"

İnternet bağlantını kontrol et. VPN açıksa kapat/değiştir.

### "Permission denied: ./start.sh"

Çalıştırma izni ver:
```bash
chmod +x start.sh
```

### Çok Fazla RAM Kullanıyor

Chromium RAM yer. Çözüm:
1. İntervali artır (örn. 60000 = 1 dakika)
2. Veya `--disable-dev-shm-usage` argümanını ekle (zaten var)

---

## 📱 Mobil App İçin

### API Server Başlat

```bash
node api-server.js
```

Sonra mobil uygulamandan:
```
GET http://localhost:3000/api/appointments
```

---

## ❓ Sorular?

- GitHub Issues'da sor
- Veya kod içindeki yorumları oku

**İyi şanslar! 🍀**

