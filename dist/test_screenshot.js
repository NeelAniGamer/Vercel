const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/Traffic/Driving.html');
  await page.waitForTimeout(2000);
  
  // Try to click to skip the intro
  try {
    await page.mouse.click(500, 500);
  } catch(e) {}
  
  await page.waitForTimeout(6000);
  
  // Click again just in case
  try {
    await page.mouse.click(500, 500);
  } catch(e) {}
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
