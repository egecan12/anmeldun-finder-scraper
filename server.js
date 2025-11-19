const puppeteer = require("puppeteer");
const express = require("express");
const axios = require("axios");
const { Expo } = require("expo-server-sdk");

// ============ AYARLAR ============
const TARGET_URL = "https://allaboutberlin.com/tools/appointment-finder";
const CHECK_INTERVAL = 20000; // 20 saniye
const STALE_DATA_THRESHOLD = 45000; // 45 saniye - Eğer veri bundan eskiyse, zorla scrape yap!
const PORT = process.env.PORT || 3000;

// Expo Push Notifications
const expo = new Expo();

// ============ GLOBAL STATE ============
let currentAppointments = []; // Mevcut randevular
let previousAppointmentKeys = new Set(); // Önceki randevu key'leri
let newAppointments = []; // Yeni bulunan randevular
let lastScrapedAt = null;
let isFirstRun = true;
let browser = null;
let isScraping = false;

// Expo Push Tokens (gerçek projede database kullan!)
let expoPushTokens = new Set();

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
      const links = document.querySelectorAll('a[href="/out/appointment-anmeldung"]');

      links.forEach((link) => {
        const hasCalendarIcon = link.querySelector('i.icon.calendar');

        if (hasCalendarIcon) {
          const strongElement = link.querySelector("strong");
          const timeElement = link.querySelector("time");

          const date = strongElement ? strongElement.textContent.trim() : "";
          const time = timeElement ? timeElement.textContent.trim() : "";

          if (date && time && !date.includes("{{") && !time.includes("{{")) {
            results.push({
              date: date,
              time: time,
              fullText: `${date} - ${time}`,
              href: link.getAttribute("href")
            });
          }
        }
      });

      return results;
    });

    await page.close();

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
    return res.status(400).json({
      success: false,
      error: "Token required"
    });
  }
  
  // Expo push token mu kontrol et
  if (!Expo.isExpoPushToken(token)) {
    return res.status(400).json({
      success: false,
      error: "Invalid Expo push token"
    });
  }
  
  // Token'ı kaydet
  expoPushTokens.add(token);
  console.log(`📱 Yeni device kaydedildi: ${userId || 'anonymous'} (${platform || 'unknown'})`);
  console.log(`   Toplam kayıtlı device: ${expoPushTokens.size}`);
  
  res.json({
    success: true,
    message: "Device registered successfully",
    totalDevices: expoPushTokens.size
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
    const now = new Date().getTime();
    const lastScrapeTime = lastScrapedAt ? new Date(lastScrapedAt).getTime() : 0;
    const timeDiff = now - lastScrapeTime;

    if ((currentAppointments.length === 0 && !isScraping) || (timeDiff > STALE_DATA_THRESHOLD && !isScraping)) {
      console.log(`⚠️  Veri bayat (${Math.floor(timeDiff / 1000)}s), manuel refresh yapılıyor...`);
      await scrapeAppointments();
    }

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
  if (expoPushTokens.size === 0) {
    console.log("⚠️  Kayıtlı device yok, notification gönderilmedi");
    return;
  }

  console.log(`📤 ${expoPushTokens.size} device'a notification gönderiliyor...`);

  // Mesajları hazırla
  const messages = [];
  
  for (let pushToken of expoPushTokens) {
    // Token geçerli mi kontrol et
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`⚠️  Geçersiz token: ${pushToken}`);
      expoPushTokens.delete(pushToken);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title: '🎉 Yeni Randevu Bulundu!',
      body: `${appointments.length} yeni randevu mevcut. Hemen kontrol et!`,
      data: { 
        appointments: appointments,
        count: appointments.length,
        type: 'new_appointments'
      },
      badge: appointments.length,
      priority: 'high',
    });
  }

  // Mesajları chunk'lara böl (Expo max 100 per request)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  // Her chunk'ı gönder
  for (let chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('❌ Push notification gönderme hatası:', error);
    }
  }

  // Sonuçları kontrol et
  let successCount = 0;
  let errorCount = 0;

  for (let ticket of tickets) {
    if (ticket.status === 'ok') {
      successCount++;
    } else if (ticket.status === 'error') {
      errorCount++;
      console.error(`❌ Notification hatası: ${ticket.message}`);
      
      // Geçersiz token'ları temizle
      if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
        // Token'ı sil (gerçek projede database'den sil)
        console.log('🗑️  Geçersiz token temizlendi');
      }
    }
  }

  console.log(`✅ Notification gönderildi: ${successCount} başarılı, ${errorCount} hata`);
}

// ============ ARKA PLAN SCRAPING ============

/**
 * Otomatik scraping başlat
 */
async function startBackgroundScraping() {
  console.log("🚀 Arka plan scraping başlatılıyor...");
  console.log(`⏱️  Her ${CHECK_INTERVAL / 1000} saniyede bir kontrol edilecek...\n`);

  // İlk scrape'i hemen yap
  await scrapeAppointments();

  // Belirlenen aralıkta tekrarla
  setInterval(async () => {
    await scrapeAppointments();
  }, CHECK_INTERVAL);
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

