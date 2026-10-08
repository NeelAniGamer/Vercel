// scripts/test-vertical.js
const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/' || p === '') p = '/home.html';
  if (!p.includes('.')) p += '.html';
  const fp = path.join(__dirname, '..', p);
  if (fs.existsSync(fp)) {
    const ext = path.extname(fp).toLowerCase();
    const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/html' });
    fs.createReadStream(fp).pipe(res);
  } else { res.writeHead(404); res.end(); }
}).listen(8097, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  
  // Test Home Page
  await page.goto('http://localhost:8097/home.html');
  await page.waitForTimeout(1600);
  await page.evaluate(() => {
    const l = document.querySelector('.loader');
    if (l) l.classList.add('gone');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(__dirname, '../output/v_scene1_home.png') });

  // Test QR Editor with Vertical Style
  await page.goto('http://localhost:8097/qr-editor.html');
  await page.waitForTimeout(1200);
  
  await page.addStyleTag({
    content: `
      .qr-app {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        padding: 40px 30px !important;
        gap: 24px !important;
        height: auto !important;
        max-width: 960px !important;
        margin: 0 auto !important;
      }
      .prev-p {
        order: 1 !important;
        width: 100% !important;
        max-width: 620px !important;
        border-radius: 24px !important;
        padding: 24px !important;
        background: rgba(17, 24, 39, 0.85) !important;
        border: 1px solid rgba(16, 185, 129, 0.3) !important;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.15) !important;
      }
      .prev-cw {
        width: 320px !important;
        height: 320px !important;
        margin: 0 auto !important;
      }
      .qr-main {
        order: 2 !important;
        width: 100% !important;
        max-width: 800px !important;
        overflow: visible !important;
      }
      .app-sb { display: none !important; }
    `
  });

  await page.screenshot({ path: path.join(__dirname, '../output/v_scene2_qr_layout.png') });
  await browser.close();
  server.close();
  console.log('Vertical tests captured successfully!');
});
