const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error));
  await page.goto('http://localhost:8080/Traffic/Driving.html');
  await page.waitForTimeout(5000);
  await browser.close();
})();
