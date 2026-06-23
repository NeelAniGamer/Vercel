const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('PAGE ERROR: ' + err.toString());
  });
  page.on('console', msg => {
    console.log('CONSOLE: ' + msg.type() + ': ' + msg.text());
  });
  await page.goto('file:///c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/Academy.html', {waitUntil: 'networkidle0'});
  const t = await page.evaluate(() => typeof window.ui);
  console.log('typeof window.ui is: ' + t);
  await browser.close();
})();
