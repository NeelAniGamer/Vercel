import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PERCEPTUS_DIR = 'C:/Users/neelg/OneDrive/Desktop/CoL Project/Current Projects/Current Working Apps/Perceptus';
const VERCEL_DIR = 'C:/Users/neelg/OneDrive/Desktop/Vercel';
const SCREENSHOT_DIR = 'C:/Users/neelg/OneDrive/Desktop/Vercel/screenshots/audit_perceptus';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.task': 'application/octet-stream'
};

function createStaticServer(rootDir, port) {
  const server = http.createServer((req, res) => {
    let decoded = decodeURI(req.url.split('?')[0]);
    if (decoded === '/' || decoded === '') decoded = '/index.html';
    let fullPath = path.join(rootDir, decoded);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      fullPath = path.join(fullPath, 'index.html');
    }
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      // try .html
      if (fs.existsSync(fullPath + '.html')) fullPath = fullPath + '.html';
      else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found: ' + req.url);
        return;
      }
    }
    const ext = path.extname(fullPath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(fullPath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const serverPerceptus = await createStaticServer(PERCEPTUS_DIR, 18766);
  const serverVercel = await createStaticServer(VERCEL_DIR, 18767);
  console.log('Static servers up on 18766 (Perceptus) and 18767 (Vercel)');

  const browser = await chromium.launch({ headless: true });
  const results = {
    perceptus_desktop_normal: { errors: [], overflow: 0 },
    perceptus_desktop_hud: { errors: [], overflow: 0 },
    perceptus_desktop_phone: { errors: [], overflow: 0 },
    gesture_web_normal: { errors: [], overflow: 0 },
    gesture_web_phone: { errors: [], overflow: 0 }
  };

  try {
    // 1. PERCEPTUS DESKTOP APP (Normal Desktop UI: 1280x820)
    console.log('Testing Perceptus desktop_app.html in Normal Desktop Mode (1280x820)...');
    const pPage = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    pPage.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('pagead')) {
        results.perceptus_desktop_normal.errors.push(msg.text());
      }
    });

    await pPage.goto('http://localhost:18766/desktop_app.html', { waitUntil: 'domcontentloaded' });
    await pPage.waitForTimeout(1000);
    await pPage.screenshot({ path: path.join(SCREENSHOT_DIR, '01_perceptus_desktop_normal.png') });

    // 2. PERCEPTUS DESKTOP APP (HUD Mode: 380x620)
    console.log('Testing Perceptus desktop_app.html in Mini Co-Pilot HUD Mode (380x620)...');
    await pPage.click('#btnModeHUD');
    await pPage.setViewportSize({ width: 380, height: 620 });
    await pPage.waitForTimeout(500);
    await pPage.screenshot({ path: path.join(SCREENSHOT_DIR, '02_perceptus_desktop_hud.png') });

    // 3. PERCEPTUS DESKTOP APP (Phone UI 360x740)
    console.log('Testing Perceptus desktop_app.html in Phone UI (360x740)...');
    await pPage.click('#btnModeStudio');
    await pPage.setViewportSize({ width: 360, height: 740 });
    await pPage.waitForTimeout(500);
    const wideEls = await pPage.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => el.getBoundingClientRect().width > 360)
        .map(el => ({ tag: el.tagName, id: el.id, class: typeof el.className === 'string' ? el.className : '', w: Math.round(el.getBoundingClientRect().width) }));
    });
    console.log('Wide elements on 360px:', wideEls);
    const pOverflow = await pPage.evaluate(() => document.documentElement.scrollWidth);
    results.perceptus_desktop_phone.overflow = pOverflow;
    await pPage.screenshot({ path: path.join(SCREENSHOT_DIR, '03_perceptus_desktop_phone.png') });
    await pPage.close();

    // 4. GESTURE.HTML WEB EDITION (Normal Desktop UI: 1280x800)
    console.log('Testing gesture.html in Normal Desktop Mode (1280x800)...');
    const gPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    gPage.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('pagead') && !msg.text().includes('googlesyndication')) {
        results.gesture_web_normal.errors.push(msg.text());
      }
    });

    await gPage.goto('http://localhost:18767/gesture.html', { waitUntil: 'domcontentloaded' });
    await gPage.waitForSelector('#loader.gone', { timeout: 8000 }).catch(() => {});
    await gPage.waitForTimeout(1000);
    await gPage.screenshot({ path: path.join(SCREENSHOT_DIR, '04_gesture_web_normal.png') });

    // 5. GESTURE.HTML WEB EDITION (Phone UI: 360x740)
    console.log('Testing gesture.html in Phone UI (360x740)...');
    await gPage.setViewportSize({ width: 360, height: 740 });
    await gPage.waitForTimeout(500);
    const gOverflow = await gPage.evaluate(() => document.documentElement.scrollWidth);
    results.gesture_web_phone.overflow = gOverflow;
    await gPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05_gesture_web_phone.png') });
    await gPage.close();

  } catch (err) {
    console.error('Audit run error:', err);
  } finally {
    await browser.close();
    serverPerceptus.close();
    serverVercel.close();
    console.log('\n=== PERCEPTUS AUDIT RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
  }
}

run();
