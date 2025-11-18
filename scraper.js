const axios = require("axios");
const cheerio = require("cheerio");

// Scrape edilecek URL'i buraya gir
const TARGET_URL = "https://allaboutberlin.com/tools/appointment-finder"; // Örnek: https://example.com/appointments

// Önceki randevuları saklamak için
let previousAppointments = new Set();
let isFirstRun = true;

/**
 * Randevuları scrape eden fonksiyon
 */
async function scrapeAppointments() {
  try {
    console.log(`[${new Date().toISOString()}] Randevular kontrol ediliyor...`);

    // Sayfayı indir
    const response = await axios.get(TARGET_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 10000
    });

    // HTML'i parse et
    const $ = cheerio.load(response.data);

    // Randevu elementlerini bul
    const appointments = [];
    
    $('a[href="/out/appointment-anmeldung"]').each((index, element) => {
      const $el = $(element);
      
      // Randevu bilgilerini çıkar
      const date = $el.find("strong").text().trim();
      const time = $el.find("time").text().trim();
      const href = $el.attr("href");
      
      const appointment = {
        date: date,
        time: time,
        href: href,
        fullText: `${date} - ${time}`,
        scrapedAt: new Date().toISOString()
      };
      
      appointments.push(appointment);
    });

    console.log(`${appointments.length} randevu bulundu.`);

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

      if (newAppointments.length > 0) {
        console.log("\n🎉 YENİ RANDEVU(LAR) BULUNDU! 🎉");
        console.log("================================");
        newAppointments.forEach(app => {
          console.log(`📅 ${app.date} - ${app.time}`);
        });
        console.log("================================\n");

        // Burada mobil uygulamaya bildirim gönderebilirsin
        await notifyMobileApp(newAppointments);
      } else {
        console.log("Yeni randevu yok.");
      }
    } else {
      console.log("İlk çalıştırma - başlangıç durumu kaydedildi.");
      isFirstRun = false;
    }

    // Mevcut randevuları kaydet
    previousAppointments = currentAppointmentKeys;

    // Tüm randevuları göster
    if (appointments.length > 0) {
      console.log("\nMevcut Randevular:");
      appointments.forEach((app, idx) => {
        console.log(`  ${idx + 1}. ${app.fullText}`);
      });
    }

    return appointments;

  } catch (error) {
    console.error("❌ Hata oluştu:", error.message);
    
    if (error.response) {
      console.error("Status Code:", error.response.status);
    }
    
    return [];
  }
}

/**
 * Mobil uygulamaya yeni randevuları bildiren fonksiyon
 */
async function notifyMobileApp(newAppointments) {
  // Buraya kendi API endpoint'ini ekleyeceksin
  const API_ENDPOINT = "YOUR_MOBILE_APP_API_ENDPOINT";
  
  try {
    // API'ye POST isteği gönder
    const response = await axios.post(API_ENDPOINT, {
      appointments: newAppointments,
      timestamp: new Date().toISOString()
    });
    
    console.log("✅ Mobil uygulamaya bildirim gönderildi.");
    
  } catch (error) {
    console.error("⚠️  Mobil uygulamaya bildirim gönderilemedi:", error.message);
  }
}

/**
 * 20 saniyede bir kontrol eden fonksiyon
 */
function startMonitoring() {
  console.log("🚀 Anmeldung Finder başlatıldı!");
  console.log(`📍 Hedef URL: ${TARGET_URL}`);
  console.log("⏱️  Her 20 saniyede bir kontrol edilecek...\n");

  // İlk kontrolü hemen yap
  scrapeAppointments();

  // 20 saniyede bir tekrarla
  setInterval(() => {
    scrapeAppointments();
  }, 20000); // 20000 ms = 20 saniye
}

// Programı başlat
startMonitoring();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Program kapatılıyor...");
  process.exit(0);
});

