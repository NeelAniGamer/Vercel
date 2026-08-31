const http = require('http');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

function startServer(port = 3048) {
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
      console.log(`✓ Local server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await startServer(3048);
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--enable-unsafe-webgpu']
  });

  const publicDir = path.join(__dirname, 'my-video', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  console.log('Testing Traffic/Driving.html capture...');
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1.5
  });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[PAGE ERROR]:', msg.text());
  });

  await page.goto('http://localhost:3048/Traffic/Driving.html?lv=1&mode=car', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait for game to initialize
  await page.waitForTimeout(6000);

  // Evaluate dismissal of GTA intro and start game
  await page.evaluate(() => {
    if (typeof window.dismissGtaMissionIntro === 'function') {
      window.dismissGtaMissionIntro();
    }
    const gtaBtn = document.getElementById('gta-btn-start');
    if (gtaBtn) gtaBtn.click();

    const loadScreen = document.getElementById('loading-screen');
    if (loadScreen) loadScreen.style.display = 'none';

    const enterBtn = document.querySelector('.btn-p');
    if (enterBtn && enterBtn.textContent && enterBtn.textContent.includes('Enter')) enterBtn.click();
  });

  // Let 3D render loop run for 4 seconds
  await page.waitForTimeout(4000);

  const testDrivingPath = path.join(publicDir, 'test_driving_gameplay.png');
  await page.screenshot({ path: testDrivingPath });
  console.log('Saved test driving screenshot:', testDrivingPath, 'Size:', fs.statSync(testDrivingPath).size);

  // Testing Academy Certificate capture
  console.log('Testing Academy Certificate capture...');
  await page.goto('http://localhost:3048/Traffic/Academy.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  await page.evaluate(() => {
    localStorage.setItem('traffic_academy_tutorial_seen', 'true');
    const tut = document.getElementById('academy-tutorial-overlay');
    if (tut) tut.classList.remove('on');
    const load = document.getElementById('loading-screen');
    if (load) load.style.display = 'none';

    // Show certificate screen
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    const certScreen = document.getElementById('screen-certificate');
    if (certScreen) {
      certScreen.classList.add('active');
      certScreen.style.display = 'block';
    }

    // Populate Certificate details
    const cname = document.getElementById('cname');
    if (cname) cname.textContent = 'NEEL ANIGAMER';
    const cdate = document.getElementById('cdate');
    if (cdate) cdate.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const cscore = document.getElementById('cscore');
    if (cscore) cscore.textContent = '100% (Grade A+)';
    const certNum = document.getElementById('cert-num');
    if (certNum) certNum.textContent = 'MTP-2026-HERO-0941';
  });

  await page.waitForTimeout(1000);
  const testCertPath = path.join(publicDir, 'test_certificate.png');
  
  // Take screenshot of certificate element or full screen
  const certEl = await page.$('#cert');
  if (certEl) {
    await certEl.screenshot({ path: testCertPath });
  } else {
    await page.screenshot({ path: testCertPath });
  }
  console.log('Saved test certificate screenshot:', testCertPath, 'Size:', fs.statSync(testCertPath).size);

  await browser.close();
  server.close();
}

run().catch(console.error);
