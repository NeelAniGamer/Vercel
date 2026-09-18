const http = require('http');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

function startServer(port = 3059) {
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

async function testRoadDrive() {
  const server = await startServer(3059);
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--enable-unsafe-webgpu']
  });

  const testOut = path.join(__dirname, 'test_screens');
  if (!fs.existsSync(testOut)) fs.mkdirSync(testOut);

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  
  await page.goto('http://localhost:3059/Traffic/Driving.html?lv=5&mode=car', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.game !== 'undefined', { timeout: 20000 });
  
  // Click play overlay
  await page.evaluate(() => {
    const play = document.getElementById('play-overlay');
    if (play) play.click();
    if (typeof window.dismissGtaMissionIntro === 'function') window.dismissGtaMissionIntro();
    document.querySelectorAll('#gta-mission-intro, #play-overlay, #loading-screen, .modal, .dialog, #daily-bonus-modal, #welcome-back, #academy-tutorial-overlay').forEach(el => el.remove());
  });
  await page.waitForTimeout(1000);

  // Switch to vehicle driving on the road
  await page.evaluate(() => {
    const g = window.game;
    if (g && g.playerVehicle) {
      g.isPedestrian = false;
      g.player = g.playerVehicle;
      g.setGear('D');
      g._enterState = 'IDLE';
      g._camSnapped = true;
      g._camOverride = false;
      if (g.playerCharacter) g.playerCharacter.visible = false;
      g.playerVehicle.visible = true;

      // Position car on the road facing forward
      g.playerVehicle.position.set(0, 0.2, -35);
      g.playerVehicle.rotation.set(0, 0, 0);
      g.speed = 0.35;
      g.currentSpeed = 38;
      
      const spgauge = document.getElementById('spgauge');
      if (spgauge) spgauge.style.display = 'block';
      const gp = document.getElementById('gp');
      if (gp) gp.style.display = 'flex';
      
      g.keys['arrowup'] = true;
    }
  });

  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(testOut, 'test_driving_road_perfect.png') });

  await page.close();
  await browser.close();
  server.close();
  console.log('Done test driving road perfect!');
}

testRoadDrive().catch(console.error);
