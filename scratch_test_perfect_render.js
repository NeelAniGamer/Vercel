const http = require('http');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

function startServer(port = 3049) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.webp': 'image/webp'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/home.html';
    
    let safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(__dirname, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqUrl);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Server listening on ${port}`);
      resolve(server);
    });
  });
}

async function testCaptures() {
  const server = await startServer(3049);
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--enable-unsafe-webgpu']
  });

  const testOut = path.join(__dirname, 'test_screens');
  if (!fs.existsSync(testOut)) fs.mkdirSync(testOut);

  // 1. Driving Simulator Gameplay
  console.log('Testing Driving Simulator...');
  const page1 = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page1.goto('http://localhost:3049/Traffic/Driving.html?lv=1&mode=car', { waitUntil: 'domcontentloaded' });
  await page1.waitForTimeout(6000);
  await page1.evaluate(() => {
    document.getElementById('play-overlay')?.remove();
    document.getElementById('loading-screen')?.remove();
    document.getElementById('gta-mission-intro')?.remove();
    document.querySelectorAll('.modal, .dialog, #daily-bonus-modal, #welcome-back').forEach(e => e.remove());
    if (typeof window.dismissGtaMissionIntro === 'function') window.dismissGtaMissionIntro();
  });
  await page1.waitForTimeout(3000);
  await page1.screenshot({ path: path.join(testOut, 'test_driving.png') });
  await page1.close();

  // 2. Solar Engine 3D
  console.log('Testing Solar Engine...');
  const page2 = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page2.goto('http://localhost:3049/engine.html', { waitUntil: 'domcontentloaded' });
  await page2.waitForTimeout(3000);
  await page2.evaluate(() => {
    if (typeof window.enterApp === 'function') window.enterApp();
    const btn = document.querySelector('.btn-enter, #enter-btn, button');
    if (btn) btn.click();
    document.getElementById('loader')?.remove();
  });
  await page2.waitForTimeout(3500);
  await page2.screenshot({ path: path.join(testOut, 'test_solar.png') });
  await page2.close();

  // 3. ATI Typing Instructor
  console.log('Testing ATI Demo...');
  const page3 = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page3.goto('http://localhost:3049/ati-demo.html', { waitUntil: 'domcontentloaded' });
  await page3.waitForTimeout(3000);
  await page3.evaluate(() => {
    document.getElementById('loader')?.remove();
    // Select JS mode if available or start interactive typing test
    const jsBtn = Array.from(document.querySelectorAll('button, .mode-btn')).find(b => b.textContent.includes('JS') || b.textContent.includes('JavaScript'));
    if (jsBtn) jsBtn.click();
  });
  await page3.waitForTimeout(2000);
  await page3.screenshot({ path: path.join(testOut, 'test_ati.png') });
  await page3.close();

  // 4. QR Editor
  console.log('Testing QR Editor...');
  const page4 = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page4.goto('http://localhost:3049/qr-editor.html', { waitUntil: 'domcontentloaded' });
  await page4.waitForTimeout(3000);
  await page4.evaluate(() => {
    document.getElementById('loader')?.remove();
  });
  await page4.waitForTimeout(1500);
  await page4.screenshot({ path: path.join(testOut, 'test_qr.png') });
  await page4.close();

  // 5. Certificate
  console.log('Testing Certificate...');
  const page5 = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page5.goto('http://localhost:3049/Traffic/Academy.html', { waitUntil: 'domcontentloaded' });
  await page5.waitForTimeout(3000);
  await page5.evaluate(() => {
    document.querySelectorAll('.tb, #daily-bonus-modal, #welcome-back, .modal-backdrop, .overlay, #academy-tutorial-overlay, #loading-screen').forEach(e => e.remove());
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const certScreen = document.getElementById('screen-certificate');
    if (certScreen) {
      certScreen.classList.add('active');
      certScreen.style.display = 'block';
      certScreen.style.paddingTop = '0';
      certScreen.style.marginTop = '0';
    }
    const cname = document.getElementById('cname');
    if (cname) cname.textContent = 'NEEL ANIGAMER';
    const cdate = document.getElementById('cdate');
    if (cdate) cdate.textContent = 'August 29, 2026';
    const cscore = document.getElementById('cscore');
    if (cscore) cscore.textContent = '100% (Grade A+)';
    const certNum = document.getElementById('cert-num');
    if (certNum) certNum.textContent = 'MTP-2026-HERO-0941';

    const certWrapper = document.getElementById('cert-wrapper');
    if (certWrapper) {
      certWrapper.style.filter = 'none';
      certWrapper.style.backdropFilter = 'none';
      certWrapper.style.padding = '0';
      certWrapper.style.margin = '0 auto';
    }
    const cert = document.getElementById('cert');
    if (cert) {
      cert.style.boxShadow = 'none';
      cert.style.margin = '0 auto';
    }
  });
  await page5.waitForTimeout(1500);
  const certEl = await page5.$('#cert');
  if (certEl) {
    await certEl.screenshot({ path: path.join(testOut, 'test_cert.png') });
  }
  await page5.close();

  await browser.close();
  server.close();
  console.log('Done testing captures!');
}

testCaptures().catch(console.error);
