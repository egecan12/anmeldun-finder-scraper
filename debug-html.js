const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  await page.goto('https://allaboutberlin.com/tools/appointment-finder', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Randevu listesinin olduğu bölümü bulmaya çalışalım
  const htmlContent = await page.evaluate(() => {
    // Genellikle randevular bir liste veya grid içindedir.
    // Tüm sayfayı alıp analiz edelim.
    return document.body.innerHTML;
  });

  fs.writeFileSync('page_dump.html', htmlContent);
  console.log("HTML kaydedildi: page_dump.html");
  
  // İçinde 'appointment-anmeldung' geçen kısımları bul
  const matches = htmlContent.match(/<a[^>]*href="\/out\/appointment-anmeldung"[^>]*>[\s\S]*?<\/a>/g);
  
  if (matches) {
      console.log(`\nBulunan Eşleşmeler (${matches.length}):\n`);
      matches.slice(0, 3).forEach((m, i) => console.log(`${i+1}. ${m}\n`));
  } else {
      console.log("HİÇ EŞLEŞME BULUNAMADI!");
  }

  await browser.close();
})();

