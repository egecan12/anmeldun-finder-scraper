const puppeteer = require('puppeteer');

(async () => {
  console.log("🕵️‍♂️ Dedektif göreve başladı...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  console.log("🌐 Siteye gidiliyor...");
  await page.goto('https://allaboutberlin.com/tools/appointment-finder', { waitUntil: 'networkidle2' });

  console.log("🔍 Elementler inceleniyor...");
  
  // Tüm potansiyel randevu linklerini bul ve detaylarını yazdır
  const debugInfo = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href="/out/appointment-anmeldung"]');
    return Array.from(links).map(link => {
      return {
        html: link.outerHTML,
        text: link.innerText,
        parentClass: link.parentElement.className,
        grandParentClass: link.parentElement.parentElement.className,
        isVisible: link.offsetParent !== null // Görünür mü?
      };
    });
  });

  console.log(`\nToplam ${debugInfo.length} aday element bulundu.\n`);

  debugInfo.forEach((info, index) => {
    console.log(`--- ADAY #${index + 1} ---`);
    console.log(`Görünür mü?: ${info.isVisible ? 'EVET ✅' : 'HAYIR ❌'}`);
    console.log(`Text: ${info.text.replace(/\n/g, ' ')}`);
    console.log(`HTML: ${info.html.substring(0, 100)}...`);
    console.log(`Parent Class: ${info.parentClass}`);
    console.log(`------------------------\n`);
  });

  await browser.close();
})();

