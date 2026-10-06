#!/usr/bin/env node
/**
 * Measure how large the certificate logos ACTUALLY render, in a real browser.
 *
 * cert-assets/cert_logo_1.png is a 2282x1856 PNG (4.33 MB) whose BUILD_NOTES.md
 * entry was deferred "pending a visual decision" about downscaling. Rather than
 * guess from inline CSS, this boots each page and reports the real rendered box
 * plus the natural size of the decoded image.
 *
 *   node tools/measure-cert-logos.js
 *
 * Prints one row per element and exits non-zero if any image fails to decode.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const APP = '/Traffic';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
};

const PAGES = ['/Traffic/Driving.html', '/Traffic/Academy.html'];

function serve(root) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(root, url);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, 'index.html');
      }
      if (!fs.existsSync(file)) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

(async () => {
  const { chromium } = require('playwright');
  const { server, port } = await serve(ROOT);
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  let failures = 0;

  console.log('\nRendered size of every cert-logo element (real browser, 1280x720, DPR 1)\n');
  console.log('  page       element        rendered (css px)   source px      ratio   natural KB');
  console.log('  ' + '-'.repeat(88));

  for (const pagePath of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(base + pagePath, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);

    const rows = await page.evaluate(() => {
      const out = [];
      for (const img of document.querySelectorAll('[id^="cert-logo-"]')) {
        const r = img.getBoundingClientRect();
        out.push({
          id: img.id,
          cssW: Math.round(r.width),
          cssH: Math.round(r.height),
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
          src: (img.currentSrc || img.src || '').split('/').pop(),
          failed: img.complete && img.naturalWidth === 0,
        });
      }
      return out;
    });

    const short = pagePath.replace('/Traffic/', '').replace('.html', '');
    for (const r of rows) {
      if (r.failed) {
        failures++;
        console.log(`  ${short.padEnd(10)} ${r.id.padEnd(14)} DECODE FAILED  (${r.src})`);
        continue;
      }
      const ratio = r.naturalH ? (r.naturalH / Math.max(r.cssH, 1)).toFixed(1) : '-';
      let kb = 0;
      try {
        const rel = r.src.includes(APP) ? r.src.split(APP + '/')[1] : null;
        if (rel && fs.existsSync(path.join(ROOT, APP, rel))) kb = fs.statSync(path.join(ROOT, APP, rel)).size / 1024;
      } catch {}
      console.log(
        `  ${short.padEnd(10)} ${r.id.padEnd(14)} ${String(r.cssW + 'x' + r.cssH).padEnd(18)} ` +
          `${String(r.naturalW + 'x' + r.naturalH).padEnd(14)} ${String(ratio).padEnd(7)} ${kb.toFixed(1)}  ${r.src}`
      );
    }
    await page.close();
  }

  await browser.close();
  server.close();

  console.log('\n  ratio = source pixels per rendered CSS pixel. 1.0-3.0 is plenty;');
  console.log('  much above 3.0 means the file is oversized for how it is displayed.\n');

  if (failures) {
    console.error(`FAILED: ${failures} logo(s) failed to decode.`);
    process.exit(1);
  }
})().catch((e) => {
  console.error('FATAL:', e && e.stack ? e.stack : e);
  process.exit(1);
});
