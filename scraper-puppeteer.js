const puppeteer = require("puppeteer");

// ============ AYARLAR ============
const TARGET_URL = "https://allaboutberlin.com/tools/appointment-finder";
const CHECK_INTERVAL = 20000; // Kontrol sıklığı (milisaniye cinsinden)
                               // 20000 = 20 saniye
                               // 30000 = 30 saniye
                               // 60000 = 1 dakika

// Önceki randevuları saklamak için
let previousAppointments = new Set();
let isFirstRun = true;

// Browser instance'ı global olarak tut (performans için)
let browser = null;

/**
 * Browser'ı başlat
 */
async function initBrowser() {
  if (!browser) {
    console.log("🌐 Browser başlatılıyor...");
    browser = await puppeteer.launch({
      headless: "new", // Yeni headless mode
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
 * Randevuları scrape eden fonksiyon (Puppeteer ile)
 */
async function scrapeAppointments() {
  let page = null;
  
  try {
    console.log(`[${new Date().toISOString()}] Randevular kontrol ediliyor...`);

    // Browser'ı hazırla
    const browserInstance = await initBrowser();
    page = await browserInstance.newPage();

    // User agent ayarla
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Viewport ayarla
    await page.setViewport({ width: 1920, height: 1080 });

    // Sayfaya git ve JavaScript'in yüklenmesini bekle
    await page.goto(TARGET_URL, {
      waitUntil: "networkidle2", // Tüm network istekleri bitene kadar bekle
      timeout: 30000
    });

    // Biraz daha bekle (JavaScript render için)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Randevu elementlerini scrape et
    const appointments = await page.evaluate(() => {
      const results = [];
      
      // Tüm appointment linklerini bul
      const links = document.querySelectorAll('a[href="/out/appointment-anmeldung"]');
      
      links.forEach((link) => {
        // Calendar icon'u olanları al (gerçek randevular)
        const hasCalendarIcon = link.querySelector('i.icon.calendar');
        
        if (hasCalendarIcon) {
          const strongElement = link.querySelector("strong");
          const timeElement = link.querySelector("time");
          
          const date = strongElement ? strongElement.textContent.trim() : "";
          const time = timeElement ? timeElement.textContent.trim() : "";
          
          // Boş veya template değişkeni içerenleri atlat
          if (date && time && !date.includes("{{") && !time.includes("{{")) {
            results.push({
              date: date,
              time: time,
              fullText: `${date} - ${time}`,
              href: link.getAttribute("href"),
              scrapedAt: new Date().toISOString()
            });
          }
        }
      });
      
      return results;
    });

    console.log(`📊 ${appointments.length} randevu bulundu.`);

    // Yeni randevuları tespit et
    const currentAppointmentKeys = new Set(
      appointments.map(app => `${app.date}-${app.time}`)
    );

    if (!isFirstRun) {
      // Yeni randevuları bul
      const newAppointments = appointments.filter(app => {
        const key = `${app.date}-${app.time}`;
        return !previousAppointments.has(key);
      });

      // Silinen randevuları bul
      const removedKeys = [...previousAppointments].filter(
        key => !currentAppointmentKeys.has(key)
      );

      if (newAppointments.length > 0) {
        console.log("\n🎉 YENİ RANDEVU(LAR) BULUNDU! 🎉");
        console.log("================================");
        newAppointments.forEach(app => {
          console.log(`📅 ${app.date} - ${app.time}`);
        });
        console.log("================================\n");

        // Burada mobil uygulamaya bildirim gönderebilirsin
        await notifyMobileApp(newAppointments);
      }

      if (removedKeys.length > 0) {
        console.log("\n❌ Alınan/Silinen Randevular:");
        removedKeys.forEach(key => {
          console.log(`   ${key}`);
        });
        console.log("");
      }

      if (newAppointments.length === 0 && removedKeys.length === 0) {
        console.log("✓ Yeni randevu yok, değişiklik yok.");
      }
    } else {
      console.log("📝 İlk çalıştırma - başlangıç durumu kaydedildi.");
      isFirstRun = false;
    }

    // Mevcut randevuları kaydet
    previousAppointments = currentAppointmentKeys;

    // Tüm randevuları göster
    if (appointments.length > 0) {
      console.log("\n📋 Mevcut Randevular:");
      appointments.forEach((app, idx) => {
        console.log(`   ${idx + 1}. ${app.fullText}`);
      });
      console.log("");
    } else {
      console.log("⚠️  Hiç randevu bulunamadı!\n");
    }

    // Sayfayı kapat
    await page.close();

    return appointments;

  } catch (error) {
    console.error("❌ Hata oluştu:", error.message);
    
    // Sayfayı kapat (hata durumunda)
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore
      }
    }
    
    return [];
  }
}

/**
 * Mobil uygulamaya yeni randevuları bildiren fonksiyon
 */
async function notifyMobileApp(newAppointments) {
  // Buraya kendi API endpoint'ini ekleyeceksin
  const API_ENDPOINT = process.env.MOBILE_APP_API_ENDPOINT || "";
  
  if (!API_ENDPOINT) {
    console.log("ℹ️  Mobil app endpoint tanımlanmamış (MOBILE_APP_API_ENDPOINT)");
    return;
  }

  try {
    const axios = require("axios");
    
    // API'ye POST isteği gönder
    await axios.post(API_ENDPOINT, {
      appointments: newAppointments,
      timestamp: new Date().toISOString(),
      source: "anmeldung-finder"
    });
    
    console.log("✅ Mobil uygulamaya bildirim gönderildi.");
    
  } catch (error) {
    console.error("⚠️  Mobil uygulamaya bildirim gönderilemedi:", error.message);
  }
}

/**
 * 20 saniyede bir kontrol eden fonksiyon
 */
async function startMonitoring() {
  const intervalSeconds = CHECK_INTERVAL / 1000;
  
  console.log("🚀 Anmeldung Finder (Puppeteer) başlatıldı!");
  console.log(`📍 Hedef URL: ${TARGET_URL}`);
  console.log(`⏱️  Her ${intervalSeconds} saniyede bir kontrol edilecek...`);
  console.log("💡 Not: İlk çalıştırma biraz zaman alabilir (Chromium indiriliyor)\n");

  // İlk kontrolü hemen yap
  await scrapeAppointments();

  // Belirlenen aralıkta tekrarla
  setInterval(async () => {
    await scrapeAppointments();
  }, CHECK_INTERVAL);
}

/**
 * Graceful shutdown
 */
async function cleanup() {
  console.log("\n\n👋 Program kapatılıyor...");
  
  if (browser) {
    console.log("🔒 Browser kapatılıyor...");
    await browser.close();
  }
  
  console.log("✅ Temizlik tamamlandı.");
  process.exit(0);
}

// Shutdown sinyallerini dinle
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Programı başlat
startMonitoring().catch(async (error) => {
  console.error("💥 Fatal error:", error);
  await cleanup();
});

