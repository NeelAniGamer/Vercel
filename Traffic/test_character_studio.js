const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 8095;
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp'
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/Traffic/Driving.html';
    const filePath = path.join(ROOT, reqPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Directory listing forbidden');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function runTest() {
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`📡 Static HTTP Server listening at http://localhost:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('Navigating to http://localhost:8095/Traffic/Driving.html...');
  await page.goto(`http://localhost:${PORT}/Traffic/Driving.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Dismiss start overlay if present
  await page.evaluate(() => {
    const gate = document.getElementById('gate-overlay');
    if (gate) gate.remove();
  });

  const outDir = path.resolve('C:/Users/neelg/.gemini/antigravity/brain/8b0971e3-b57e-4064-8032-b92b57e43684');

  // 1. Open Character Customizer Studio (Stylized 3D Mode)
  console.log('Opening Character Studio (Stylized 3D Hero Mode)...');
  await page.evaluate(() => {
    window.openCustomize();
    window._setCharMode('stylized');
    window._pickOutfitPreset('mumbai_street');
    window._setStudioPose('idle');
  });
  await page.waitForTimeout(1500);

  const shotStylized = path.join(outDir, 'character_studio_stylized.png');
  await page.screenshot({ path: shotStylized });
  console.log('📸 Saved Stylized Studio screenshot:', shotStylized);

  // 2. Switch to Minecraft Mode (Mumbai Taxi Driver)
  console.log('Switching to Minecraft Character Mode (Mumbai Driver Skin)...');
  await page.evaluate(() => {
    window._setCharMode('minecraft');
    window._pickMCPreset('mumbai_driver');
    window._setStudioPose('idle');
  });
  await page.waitForTimeout(1500);

  const shotMC = path.join(outDir, 'character_studio_minecraft.png');
  await page.screenshot({ path: shotMC });
  console.log('📸 Saved Minecraft Mode screenshot:', shotMC);

  // 3. Test Steve Skin
  console.log('Testing Classic Steve skin preset...');
  await page.evaluate(() => {
    window._pickMCPreset('steve');
    window._setMCArm(false);
    window._setStudioPose('walk');
  });
  await page.waitForTimeout(1200);

  const shotSteve = path.join(outDir, 'character_studio_minecraft_steve.png');
  await page.screenshot({ path: shotSteve });
  console.log('📸 Saved Minecraft Steve screenshot:', shotSteve);

  // 4. Test Police Minecraft Skin
  console.log('Testing Police Minecraft skin preset...');
  await page.evaluate(() => {
    window._pickMCPreset('police');
    window._setStudioPose('thumbs_up');
  });
  await page.waitForTimeout(1200);

  const shotPoliceMC = path.join(outDir, 'character_studio_minecraft_police.png');
  await page.screenshot({ path: shotPoliceMC });
  console.log('📸 Saved Minecraft Police Mode screenshot:', shotPoliceMC);

  // 5. Test Saving & Equipping in Active Game
  console.log('Saving & Equipping character...');
  await page.evaluate(() => {
    window._saveCustomize();
  });
  await page.waitForTimeout(500);

  const savedData = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('traffic_appearance') || '{}');
  });
  console.log('Saved traffic_appearance in localStorage:', savedData);

  await browser.close();
  server.close();
  console.log('🎉 All tests and screenshots completed successfully!');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
