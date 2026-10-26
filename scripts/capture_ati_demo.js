const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

async function captureScreenshots() {
  const distDir = path.join(__dirname, '..', 'dist');
  const shotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/ati-demo') reqPath = '/ati-demo.html';
    const filePath = path.join(distDir, reqPath.replace(/^\/+/, ''));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200);
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise((resolve) => server.listen(8766, resolve));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto('http://localhost:8766/ati-demo.html');
    await page.waitForTimeout(500);

    // 1. Studio default view (Dark mode)
    await page.screenshot({ path: path.join(shotsDir, 'ati_demo_studio_dark.png'), fullPage: false });
    console.log('Saved ati_demo_studio_dark.png');

    // 2. Mid-simulation with Ghost Pacer enabled
    await page.selectOption('#ghostSelect', '80');
    await page.click('#btnAutoSim');
    await page.waitForTimeout(3000); // 3 seconds of typing
    await page.screenshot({ path: path.join(shotsDir, 'ati_demo_active_typing.png'), fullPage: false });
    console.log('Saved ati_demo_active_typing.png');

    // Stop simulation and force test completion to show results overlay
    await page.click('#btnAutoSim');
    await page.evaluate(() => endTest());
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(shotsDir, 'ati_demo_results_overlay.png'), fullPage: false });
    console.log('Saved ati_demo_results_overlay.png');

    // 3. Light mode
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.applyTheme(true));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shotsDir, 'ati_demo_light_mode.png'), fullPage: false });
    console.log('Saved ati_demo_light_mode.png');

  } finally {
    await browser.close();
    server.close();
  }
}

captureScreenshots().catch(console.error);
