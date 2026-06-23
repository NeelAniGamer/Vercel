const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE: ' + msg.text()));
  await page.goto('file:///c:/Users/neelg/OneDrive/Desktop/Vercel/temp_pup/test_shadow.html');
  await page.click('#btn');
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
