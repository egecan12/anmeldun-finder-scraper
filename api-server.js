const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Scrape edilecek URL
const TARGET_URL = "YOUR_TARGET_URL_HERE";

// Son bilinen randevular
let latestAppointments = [];
let lastUpdated = null;

/**
 * Randevuları scrape eden fonksiyon (API için)
 */
async function scrapeAppointmentsAPI() {
  try {
    const response = await axios.get(TARGET_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const appointments = [];
    
    $('a[href="/out/appointment-anmeldung"]').each((index, element) => {
      const $el = $(element);
      
      const date = $el.find("strong").text().trim();
      const time = $el.find("time").text().trim();
      const href = $el.attr("href");
      
      appointments.push({
        id: `${date}-${time}`.replace(/\s+/g, "-"),
        date: date,
        time: time,
        href: href,
        fullText: `${date} - ${time}`,
        scrapedAt: new Date().toISOString()
      });
    });

    latestAppointments = appointments;
    lastUpdated = new Date().toISOString();

    return appointments;

  } catch (error) {
    console.error("Scraping error:", error.message);
    throw error;
  }
}

// Arka planda otomatik güncelleme (her 20 saniye)
setInterval(() => {
  scrapeAppointmentsAPI()
    .then(appointments => {
      console.log(`[${new Date().toISOString()}] ${appointments.length} randevu güncellendi.`);
    })
    .catch(err => {
      console.error("Background update failed:", err.message);
    });
}, 20000);

// API Endpoints

/**
 * GET /api/appointments
 * Tüm randevuları döner
 */
app.get("/api/appointments", async (req, res) => {
  try {
    // Cache'den dön veya yeni scrape yap
    if (latestAppointments.length === 0) {
      await scrapeAppointmentsAPI();
    }

    res.json({
      success: true,
      count: latestAppointments.length,
      lastUpdated: lastUpdated,
      appointments: latestAppointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/appointments/refresh
 * Anında yeni scrape yapar
 */
app.get("/api/appointments/refresh", async (req, res) => {
  try {
    const appointments = await scrapeAppointmentsAPI();
    
    res.json({
      success: true,
      count: appointments.length,
      lastUpdated: lastUpdated,
      appointments: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/status
 * API durumunu kontrol eder
 */
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    status: "running",
    lastUpdated: lastUpdated,
    appointmentCount: latestAppointments.length,
    uptime: process.uptime()
  });
});

/**
 * POST /api/webhook
 * Push notification için webhook endpoint
 */
app.post("/api/webhook", (req, res) => {
  const { deviceToken, userId } = req.body;
  
  // Buraya push notification logic'ini ekleyebilirsin
  console.log("Webhook registered:", { deviceToken, userId });
  
  res.json({
    success: true,
    message: "Webhook registered successfully"
  });
});

// İlk başlangıçta bir kere scrape yap
scrapeAppointmentsAPI()
  .then(() => {
    console.log("İlk scraping tamamlandı.");
  })
  .catch(err => {
    console.error("İlk scraping başarısız:", err.message);
  });

// Server'ı başlat
app.listen(PORT, () => {
  console.log(`🚀 API Server çalışıyor: http://localhost:${PORT}`);
  console.log(`📱 Mobil app için endpoint: http://localhost:${PORT}/api/appointments`);
  console.log(`🔄 Her 20 saniyede otomatik güncelleniyor...`);
});

