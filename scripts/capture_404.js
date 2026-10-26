const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function main() {
  const distDir = path.join(__dirname, '..', 'dist');
  const shotsDir = path.join(__dirname, '..', 'screenshots');

  const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p === '/' || p === '/404' || p.includes('not-found') || p.includes('demo')) p = '/404.html';
    const fp = path.join(distDir, p.replace(/^\/+/, ''));
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      res.writeHead(200);
      fs.createReadStream(fp).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise(r => server.listen(8768, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });

  try {
    // 1. 404 Dark Mode with suggestion
    await page.goto('http://localhost:8768/demo');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(shotsDir, '404_page_dark.png'), fullPage: false });
    console.log('Saved 404_page_dark.png');

    // 2. 404 Light Mode
    await page.evaluate(() => window.applyTheme(true));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shotsDir, '404_page_light.png'), fullPage: false });
    console.log('Saved 404_page_light.png');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(console.error);
