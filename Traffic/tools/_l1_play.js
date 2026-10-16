// Scratch: playable-map probe of Level 1. Usage: node Traffic/tools/_l1_play.js <prefix> [shotsJSON]
// shots = [{n:'name', cam:[x,y,z], look:[x,y,z], fov:60, wait:0.5}]
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mjs': 'text/javascript' };
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('nf'); }
  res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
(async () => {
  const prefix = process.argv[2] || 'p';
  const shots = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : [];
  const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/404|GSI|FedCM|Provider/.test(t)) errs.push('console: ' + t.slice(0, 220)); if (/^\[(L1|DBG)/.test(t)) console.log(t.slice(0, 300)); });
  page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 300)));
  await page.goto(`http://localhost:${srv.address().port}/Traffic/Driving.html?level=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.Cutscene && window.Cutscene.isActive && window.Cutscene.isActive(), null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.evaluate(() => { try { window.Cutscene.skip(); } catch (e) {} });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { try { window.dismissGtaMissionIntro(); } catch (e) {} });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const g = window.game;
    return {
      cps: (g.cps || []).map(c => [Math.round(c.position.x), Math.round(c.position.z), !!c.userData.isFinish]),
      player: g.player ? [+g.player.position.x.toFixed(1), +g.player.position.z.toFixed(1)] : null,
      npcs: (g.npcs || []).length, peds: (g.peds || []).length, ais: (g.pedestrianAIs || []).length,
      plots: (g.mapCfg && g.mapCfg.plots || []).length
    };
  });
  console.log(JSON.stringify(info));
  await page.screenshot({ path: path.join(__dirname, '_shots', prefix + '_spawn.png') });
  for (const s of shots) {
    await page.evaluate((s) => {
      const g = window.game; g._camOverride = true; g.pause = false; if (s.tp && g.player) { g.player.position.set(s.tp[0], g.player.position.y, s.tp[1]); }
      g.camera.fov = s.fov || 60; g.camera.updateProjectionMatrix();
      g.camera.position.set(...s.cam); g.camera.lookAt(...s.look);
      g.camera.up.set(0, 1, 0); if (s.up) g.camera.up.set(...s.up); g.camera.lookAt(...s.look);
    }, s);
    await page.waitForTimeout((s.wait || 0.6) * 1000);
    await page.evaluate((s) => { const g = window.game; g.camera.position.set(...s.cam); g.camera.lookAt(...s.look); }, s);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(__dirname, '_shots', prefix + '_' + s.n + '.png') });
  }
  console.log('ERRORS', errs.length); errs.slice(0, 12).forEach(e => console.log(e));
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });

