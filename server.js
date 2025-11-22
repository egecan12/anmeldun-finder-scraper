const puppeteer = require("puppeteer");
const express = require("express");
const axios = require("axios");
const { Expo } = require("expo-server-sdk");
const admin = require("firebase-admin"); // Firebase Admin SDK

// ============ AYARLAR ============
const TARGET_URL = "https://allaboutberlin.com/tools/appointment-finder";
const CHECK_INTERVAL = 20000; // 20 saniye
const STALE_DATA_THRESHOLD = 45000; // 45 saniye
const PORT = process.env.PORT || 3001;

// Expo Push Notifications
const expo = new Expo();

// Firebase Admin SDK Setup
try {
  // Render'da ENV variable'dan oku, local'de dosyadan oku
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local development için (eğer dosya varsa)
    try {
      serviceAccount = require("./firebase-service-account.json");
    } catch (e) {
      console.log("⚠️  firebase-service-account.json bulunamadı, FCM devre dışı.");
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin SDK başlatıldı!");
  }
} catch (error) {
  console.error("❌ Firebase başlatma hatası:", error.message);
}

// ============ GLOBAL STATE ============
let currentAppointments = []; 
let previousAppointmentKeys = new Set(); 
let newAppointments = []; 
let lastScrapedAt = null;
let isFirstRun = true;
let browser = null;
let isScraping = false;

// Push Tokens (Platform bazlı sakla)
let pushTokens = {
  expo: new Set(),
  fcm: new Set()
};

// Express App
const app = express();
app.use(express.json());

// ============ SCRAPING FONKSİYONLARI ============

/**
 * Browser'ı başlat (scraper-puppeteer.js'den kopyalandı - ÇALIŞAN VERSİYON)
 */
async function initBrowser() {
  if (!browser) {
    console.log("🌐 Browser başlatılıyor...");
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu"
      ]
    });
    console.log("✅ Browser hazır!\n");
  }
  return browser;
}

/**
 * Randevuları scrape et
 */
async function scrapeAppointments() {
  if (isScraping) {
    console.log("⏳ Zaten scraping yapılıyor, atlanıyor...");
    return currentAppointments;
  }

  isScraping = true;
  let page = null;

  try {
    console.log(`[${new Date().toISOString()}] 🔍 Randevular kontrol ediliyor...`);

    const browserInstance = await initBrowser();
    page = await browserInstance.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1920, height: 1080 });

    // Sayfaya git ve JavaScript'in yüklenmesini bekle
    await page.goto(TARGET_URL, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    // Biraz daha bekle (JavaScript render için)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Randevuları scrape et
    const appointments = await page.evaluate(() => {
      const results = [];
      // Selector'ı genişlet: tam eşleşme yerine 'içeren' kullan
      const links = document.querySelectorAll('a[href*="/out/appointment-anmeldung"]');
      const now = new Date();
      
      // Berlin saatiyle "Bugün"ü bulmaya çalışalım (yaklaşık olarak)
      // Basitlik adına server saati + offset veya direkt server tarihini kullanıyoruz.
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      function formatDate(date) {
        return `${monthNames[date.getMonth()]} ${date.getDate()}`;
      }

      links.forEach((link) => {
        // İkon kontrolünü kaldırdık, çünkü bazen ikon olmayabilir
        // Link metni ve yapısına güvenelim
        const strongElement = link.querySelector("strong");
        const timeElement = link.querySelector("time");

        let dateStr = strongElement ? strongElement.textContent.trim() : "";
        let timeStr = timeElement ? timeElement.textContent.trim() : "";

        // Eğer tarih veya saat "Today" / "Tomorrow" ise düzelt
        let appointmentDate = null;

        // 1. Tarih kısmında "Today" / "Tomorrow" var mı?
        if (dateStr.toLowerCase().includes("today")) {
          dateStr = formatDate(today);
          appointmentDate = today;
        } else if (dateStr.toLowerCase().includes("tomorrow")) {
          dateStr = formatDate(tomorrow);
          appointmentDate = tomorrow;
        }

        // 2. Saat kısmında "Today" / "Tomorrow" var mı? (Bazen buraya yazıyorlar)
        if (timeStr.toLowerCase().includes("tomorrow")) {
           // Eğer tarih belirtilmişse (örn: "November 19") ama saat "Tomorrow" ise
           // Bu durumda randevu tarihi aslında yarındır diyebiliriz, 
           // AMA genelde "Tomorrow" yazısı date kısmında olur.
           // Yine de timeStr "Tomorrow" ise ve dateStr geçmişse, belki de bu yarındır?
           // Şimdilik timeStr'yi saat olarak bırakalım, ama dateStr parse edilince bakarız.
        }

        if (dateStr && !dateStr.includes("{{")) {
            
          // Tarih Filtresi ve Parsing
          if (!appointmentDate) {
             try {
                const currentYear = new Date().getFullYear();
                // "November 19" -> Date object
                appointmentDate = new Date(`${dateStr}, ${currentYear}`);
                
                // Yıl atlama kontrolü 📅
                // Eğer randevu ayı şu anki aydan küçükse (Örn: Biz Kasım'dayız, Randevu Ocak'ta)
                // Bu randevu önümüzdeki yıla aittir.
                if (appointmentDate.getMonth() < now.getMonth()) {
                    appointmentDate.setFullYear(currentYear + 1);
                }
             } catch (e) {
                // Parse edilemedi, null bırak
             }
          }

          // Geçmiş randevuları ele
          if (appointmentDate) {
             // Sadece bugünden ÖNCEKİ (dün ve öncesi) randevuları ele
             // Bugünün randevuları kalsın.
             if (appointmentDate < today) {
               return; 
             }
          }

          results.push({
            date: dateStr,
            time: timeStr,
            fullText: `${dateStr} - ${timeStr}`,
            // Hatalı link yerine doğrudan çalışan Anmeldung takvim linkini veriyoruz
            href: "https://service.berlin.de/terminvereinbarung/termin/tag.php?termin=1&dienstleister=122210&anliegen[]=120686&herkunft=1"
          });
        }
      });

      return results;
    });

    await page.close();
    if (browser) await browser.close(); // Browser'ı kapat! 🔒
    browser = null; // Referansı temizle

    console.log(`📊 ${appointments.length} randevu bulundu.`);

    // Yeni randevuları tespit et
    const currentKeys = new Set(
      appointments.map(app => `${app.date}-${app.time}`)
    );

    if (!isFirstRun) {
      // Yeni randevuları bul
      const newOnes = appointments.filter(app => {
        const key = `${app.date}-${app.time}`;
        return !previousAppointmentKeys.has(key);
      });

      if (newOnes.length > 0) {
        console.log(`\n🎉 ${newOnes.length} YENİ RANDEVU BULUNDU!`);
        newOnes.forEach(app => console.log(`   📅 ${app.fullText}`));
        newAppointments = newOnes; // Global state'e kaydet
        
        // 🔔 PUSH NOTIFICATION GÖNDER
        await sendPushNotifications(newOnes);
      } else {
        newAppointments = []; // Yeni randevu yoksa temizle
      }
    } else {
      console.log("📝 İlk çalıştırma - başlangıç durumu kaydedildi.");
      isFirstRun = false;
      newAppointments = [];
    }

    // State'i güncelle
    currentAppointments = appointments;
    previousAppointmentKeys = currentKeys;
    lastScrapedAt = new Date().toISOString();

    isScraping = false;
    return appointments;

  } catch (error) {
    console.error("❌ Scraping hatası:", error.message);
    isScraping = false;

    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore
      }
    }

    return currentAppointments; // Mevcut cache'i dön
  }
}

// ============ API ENDPOINTS ============

/**
 * GET / - Ana sayfa (status)
 */
app.get("/", (req, res) => {
  res.json({
    status: "✅ Running",
    service: "Anmeldung Finder API",
    uptime: Math.floor(process.uptime()),
    endpoints: {
      appointments: "/api/appointments",
      new: "/api/appointments/new",
      refresh: "/api/appointments/refresh",
      health: "/health"
    },
    stats: {
      totalAppointments: currentAppointments.length,
      newAppointments: newAppointments.length,
      lastScrapedAt: lastScrapedAt
    }
  });
});

/**
 * GET /health - Health check (UptimeRobot için)
 */
app.get("/health", (req, res) => {
  res.sendStatus(200);
});

/**
 * POST /api/register-device - Device token kaydet
 */
app.post("/api/register-device", (req, res) => {
  const { token, userId, platform } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, error: "Token required" });
  }

  // Platforma göre kaydet
  if (platform === 'android-native') {
    pushTokens.fcm.add(token);
    console.log(`🤖 Yeni Android Native cihaz: ${userId || 'anon'}`);
  } else {
    // Varsayılan olarak Expo kabul et
    if (!Expo.isExpoPushToken(token)) {
      // Eğer Expo token değilse ve platform belirtilmemişse, belki FCM'dir diye dene
      // Ama şimdilik katı kural: Expo ise Expo, değilse hata
      if (!platform) {
         return res.status(400).json({ success: false, error: "Invalid Expo push token" });
      }
    }
    pushTokens.expo.add(token);
    console.log(`📱 Yeni Expo cihaz: ${userId || 'anon'}`);
  }
  
  const totalDevices = pushTokens.expo.size + pushTokens.fcm.size;
  console.log(`   Toplam cihaz: ${totalDevices} (Expo: ${pushTokens.expo.size}, FCM: ${pushTokens.fcm.size})`);
  
  res.json({
    success: true,
    message: "Device registered successfully",
    totalDevices: totalDevices
  });
});

/**
 * GET /api/appointments - Tüm mevcut randevuları dön
 */
app.get("/api/appointments", async (req, res) => {
  try {
    // Akıllı Güncelleme (Smart Refresh) 🧠
    // Eğer son scrape üzerinden 45 saniyeden fazla geçtiyse, veri bayat demektir.
    // Bu durumda arka planın çalışmasını bekleme, hemen kendin scrape yap!
    
    // İSTEK ÜZERİNE DEVRE DIŞI BIRAKILDI: Sadece manual /refresh ile güncelleme yapılacak.
    /*
    const now = new Date().getTime();
    const lastScrapeTime = lastScrapedAt ? new Date(lastScrapedAt).getTime() : 0;
    const timeDiff = now - lastScrapeTime;

    if ((currentAppointments.length === 0 && !isScraping) || (timeDiff > STALE_DATA_THRESHOLD && !isScraping)) {
      console.log(`⚠️  Veri bayat (${Math.floor(timeDiff / 1000)}s), manuel refresh yapılıyor...`);
      await scrapeAppointments();
    }
    */

    res.json({
      success: true,
      count: currentAppointments.length,
      lastScrapedAt: lastScrapedAt,
      appointments: currentAppointments,
      message: "Mevcut tüm randevular"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/appointments/new - Sadece yeni randevuları dön
 */
app.get("/api/appointments/new", (req, res) => {
  res.json({
    success: true,
    count: newAppointments.length,
    lastScrapedAt: lastScrapedAt,
    appointments: newAppointments,
    message: newAppointments.length > 0 
      ? "Yeni randevular bulundu!" 
      : "Şu anda yeni randevu yok"
  });
});

/**
 * GET /api/appointments/refresh - Anında yeni scrape yap
 */
app.get("/api/appointments/refresh", async (req, res) => {
  try {
    console.log("🔄 Manuel refresh isteği alındı");
    const appointments = await scrapeAppointments();

    res.json({
      success: true,
      count: appointments.length,
      newCount: newAppointments.length,
      lastScrapedAt: lastScrapedAt,
      appointments: appointments,
      newAppointments: newAppointments,
      message: "Veriler yenilendi"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats - İstatistikler
 */
app.get("/api/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      totalAppointments: currentAppointments.length,
      newAppointments: newAppointments.length,
      lastScrapedAt: lastScrapedAt,
      uptime: process.uptime(),
      checkInterval: CHECK_INTERVAL / 1000 + " saniye",
      isCurrentlyScraping: isScraping
    }
  });
});

// ============ PUSH NOTIFICATION ============

/**
 * Expo Push Notifications gönder
 */
async function sendPushNotifications(appointments) {
  const messageBody = `${appointments.length} new appointments available. Check now!`;
  const messageTitle = '🎉 New Appointments Found!';

  // 1. EXPO BİLDİRİMLERİ
  if (pushTokens.expo.size > 0) {
    console.log(`📤 Expo: ${pushTokens.expo.size} cihaza gönderiliyor...`);
    const messages = [];
    for (let pushToken of pushTokens.expo) {
      if (!Expo.isExpoPushToken(pushToken)) continue;
      messages.push({
        to: pushToken,
        sound: 'default',
        title: messageTitle,
        body: messageBody,
        data: { appointments, count: appointments.length },
        badge: appointments.length,
      });
    }
    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('❌ Expo Error:', error);
      }
    }
  }

  // 2. FIREBASE (FCM) BİLDİRİMLERİ
  if (pushTokens.fcm.size > 0 && admin.apps.length > 0) {
    console.log(`🔥 FCM: ${pushTokens.fcm.size} cihaza gönderiliyor...`);
    
    // Multicast message (toplu gönderim)
    const message = {
      notification: {
        title: messageTitle,
        body: messageBody
      },
      data: {
        type: 'new_appointments',
        count: appointments.length.toString()
      },
      tokens: Array.from(pushTokens.fcm)
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ FCM Sonuç: ${response.successCount} başarılı, ${response.failureCount} hata`);
      
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(message.tokens[idx]);
          }
        });
        console.log('🗑️  Hatalı FCM tokenları temizleniyor:', failedTokens.length);
        failedTokens.forEach(t => pushTokens.fcm.delete(t));
      }
    } catch (error) {
      console.error('❌ FCM Gönderim Hatası:', error);
    }
  }
}

// ============ ARKA PLAN SCRAPING ============

/**
 * Otomatik scraping başlat
 */
async function startBackgroundScraping() {
  console.log("🚀 Başlangıç scraping işlemi yapılıyor...");
  // İlk scrape'i hemen yap ki hafıza boş kalmasın
  await scrapeAppointments();

  // Otomatik arkaplan taraması İPTAL EDİLDİ.
  // Artık sadece /api/appointments/refresh endpoint'i çağrıldığında tarama yapılacak.
  
  /*
  console.log(`⏱️  Her ${CHECK_INTERVAL / 1000} saniyede bir kontrol edilecek...\n`);
  setInterval(async () => {
    await scrapeAppointments();
  }, CHECK_INTERVAL);
  */
}

// ============ RENDER KEEP-ALIVE ============

/**
 * Render'ın sleep'ini önle
 */
function setupKeepAlive() {
  const renderUrl = process.env.RENDER_EXTERNAL_URL;

  if (!renderUrl) {
    console.log("ℹ️  RENDER_EXTERNAL_URL yok, keep-alive atlandı");
    return;
  }

  console.log(`💓 Keep-alive aktif: ${renderUrl}`);

  // Her 14 dakikada bir kendine ping at
  setInterval(async () => {
    try {
      await axios.get(`${renderUrl}/health`, { timeout: 5000 });
      console.log(`💓 Keep-alive ping OK - ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.log(`⚠️  Keep-alive ping failed: ${error.message}`);
    }
  }, 14 * 60 * 1000); // 14 dakika
}

// ============ GRACEFUL SHUTDOWN ============

async function cleanup() {
  console.log("\n\n👋 Server kapatılıyor...");

  if (browser) {
    console.log("🔒 Browser kapatılıyor...");
    await browser.close();
  }

  console.log("✅ Temizlik tamamlandı.");
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// ============ SERVER BAŞLAT ============

async function startServer() {
  // Express server'ı başlat
  app.listen(PORT, () => {
    console.log("\n" + "=".repeat(50));
    console.log("🚀 ANMELDUNG FINDER API - ÇALIŞIYOR!");
    console.log("=".repeat(50));
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`⏱️  Check Interval: ${CHECK_INTERVAL / 1000}s`);
    console.log("=".repeat(50) + "\n");

    console.log("📋 API Endpoints:");
    console.log(`   GET  /                          - Status & Info`);
    console.log(`   GET  /api/appointments          - Tüm randevular`);
    console.log(`   GET  /api/appointments/new      - Sadece yeni randevular`);
    console.log(`   GET  /api/appointments/refresh  - Manuel refresh`);
    console.log(`   GET  /api/stats                 - İstatistikler`);
    console.log(`   GET  /health                    - Health check\n`);
  });

  // Keep-alive kurulumu
  setupKeepAlive();

  // Arka plan scraping başlat
  await startBackgroundScraping();
}

// Ana fonksiyonu çalıştır
startServer().catch(async (error) => {
  console.error("💥 Fatal error:", error);
  await cleanup();
});

