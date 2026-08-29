const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  const url = 'file:///' + path.resolve('Driving.html').replace(/\\/g, '/');
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // wait 2 seconds
  await page.waitForTimeout(2000);

  await browser.close();
})();
