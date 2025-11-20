const puppeteer = require('puppeteer');

(async () => {
  console.log("🕵️‍♂️ Tarih Kontrolü Başlatılıyor...");
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  console.log("🌐 Siteye gidiliyor...");
  await page.goto('https://allaboutberlin.com/tools/appointment-finder', { waitUntil: 'networkidle2', timeout: 60000 });

  console.log("⏳ 5 saniye bekleniyor...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  const data = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/out/appointment-anmeldung"]');
    const results = [];

    links.forEach((link) => {
      const strong = link.querySelector('strong');
      const time = link.querySelector('time');
      results.push({
        date: strong ? strong.innerText.trim() : "YOK",
        time: time ? time.innerText.trim() : "YOK"
      });
    });
    return results;
  });

  console.log(`\n📊 ${data.length} randevu bulundu.\n`);
  data.forEach((item, i) => {
    console.log(`${i+1}. Tarih: [${item.date}] - Saat: [${item.time}]`);
  });

  await browser.close();
})();
