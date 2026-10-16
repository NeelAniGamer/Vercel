// Scratch: headless probe of Level 1. Usage: node Traffic/tools/_l1_probe.js [outPrefix] [waitSec]
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mjs': 'text/javascript' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('nf'); }
  res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
(async () => {
  const prefix = process.argv[2] || 'l1';
  const waitSec = +(process.argv[3] || 20);
  const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 300)));
  await page.goto(`http://localhost:${port}/Traffic/Driving.html?level=1`, { waitUntil: 'load' });
  await page.waitForTimeout(waitSec * 1000);
  const info = await page.evaluate(() => {
    const g = window.game; if (!g) return { noGame: true };
    return {
      cps: (g.cps || []).map(c => [Math.round(c.position.x), Math.round(c.position.z), !!c.userData.isFinish]),
      player: g.player ? [g.player.position.x, g.player.position.z] : null,
      tasks: (g.tasks || []).map(t => t.id + ':' + t.done),
      cutscene: window.Cutscene && window.Cutscene.isActive ? window.Cutscene.isActive() : null
    };
  });
  console.log(JSON.stringify(info));
  await page.screenshot({ path: path.join(__dirname, '_shots', prefix + '.png') });
  console.log('ERRORS', errs.length); errs.slice(0, 15).forEach(e => console.log(e));
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
