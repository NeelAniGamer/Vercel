const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '../dist-web');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

async function startServer() {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/' || rel === '') rel = '/traffic-messenger.html';
    const file = path.join(DIST, path.normalize(rel).replace(/^([/\\])+/, ''));
    if (!file.startsWith(DIST)) { res.writeHead(403).end('forbidden'); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404).end('not found: ' + rel); return; }
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(buf);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function run() {
  const { server, port } = await startServer();
  const url = `http://127.0.0.1:${port}/traffic-messenger.html`;
  console.log('Serving from:', url);

  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const evalState = await page.evaluate(() => {
    return {
      hasCanvas: !!document.querySelector('#canvas-container canvas'),
      hasApp: !!window.mumbaiMessenger,
      hudTitle: document.getElementById('hud-quest-title')?.textContent,
      distMeter: document.getElementById('hud-dist-meter')?.textContent
    };
  });

  console.log('Evaluated In-Game State:', evalState);

  await browser.close();
  server.close();

  if (errors.length > 0) {
    console.error('Console errors:', errors);
    process.exit(1);
  } else {
    console.log('✅ ZERO errors detected in production bundle!');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
