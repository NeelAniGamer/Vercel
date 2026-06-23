const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('PAGE ERROR: ' + err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR: ' + msg.text());
  });
  await page.goto('file:///c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/Academy.html', {waitUntil: 'networkidle0'});
  await browser.close();
})();
