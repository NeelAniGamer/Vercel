const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE: ' + msg.text()));
  await page.goto('file:///c:/Users/neelg/OneDrive/Desktop/Vercel/temp_pup/test_proxy.html');
  await page.evaluate(() => {
    // Before const ui is parsed (simulate)
    // Wait, the const ui is already parsed here.
    // Let's just click it to ensure const ui overrides proxy.
  });
  await page.click('#btn');
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
