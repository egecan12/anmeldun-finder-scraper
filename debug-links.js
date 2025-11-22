const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("🕵️‍♂️ Link Analizi Başlatılıyor...");
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  console.log("🌐 Ana sayfaya gidiliyor...");
  await page.goto('https://allaboutberlin.com/tools/appointment-finder', { waitUntil: 'networkidle2' });

  // Linkleri topla
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/out/appointment-anmeldung"]'))
      .map(a => a.getAttribute('href'));
  });

  console.log(`\n🔗 Toplam ${links.length} link bulundu.`);
  
  if (links.length > 0) {
    const firstLink = links[0];
    const fullUrl = `https://allaboutberlin.com${firstLink}`;
    console.log(`\n1. Link inceleniyor: ${fullUrl}`);

    // Redirect zincirini takip et
    try {
        console.log("🚀 Redirect takibi yapılıyor...");
        // Puppeteer ile tıkla ve navigasyonu bekle
        // Yeni sekme açılmasını yönet
        const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
        
        // Sayfadaki ilk linke tıkla (target=_blank olduğu için yeni sekme açar)
        await page.evaluate(() => {
            document.querySelector('a[href*="/out/appointment-anmeldung"]').click();
        });

        const newPage = await newPagePromise;
        if (!newPage) {
            console.log("❌ Yeni sekme yakalanamadı.");
        } else {
            await newPage.waitForNavigation({ waitUntil: 'domcontentloaded' });
            const finalUrl = newPage.url();
            console.log(`🏁 Varış Noktası: ${finalUrl}`);
            
            const content = await newPage.content();
            if (content.includes("Session invalid") || content.includes("Session abgelaufen") || content.includes("Error")) {
                console.log("⚠️  Sayfada hata mesajı tespit edildi!");
            }
        }
    } catch (error) {
        console.error("❌ Hata:", error.message);
    }
  }

  await browser.close();
})();

