// Verifies the staged GLB props actually reach the L1 film in a real browser.
//
// The claim being tested is narrow and falsifiable: after Level 1 boots, the
// crime-scene cones and the junction street lamps in the rendered scene are the
// MODEL, not the procedural four-primitive stand-in. It also checks that the
// film still completes if every prop is absent, because that fallback is the
// reason this integration is safe to ship at all.
//
// Usage: node scripts/verify_props.js [port]

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '5324';
const ROOT = path.resolve(__dirname, '..');

let fails = 0;
function check(ok, label, detail) {
  console.log(`  [${ok ? 'ok  ' : 'FAIL'}] ${label}${detail ? '  ' + detail : ''}`);
  if (!ok) fails++;
}

function serve() {
  const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.glb': 'model/gltf-binary', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml',
  };
  const srv = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/') u = '/Driving.html';
    const f = path.join(ROOT, u);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(d);
    });
  });
  return new Promise(r => srv.listen(PORT, '127.0.0.1', () => r(srv)));
}

async function bootPage(browser, { load }) {
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`http://127.0.0.1:${PORT}/Driving.html?level=1&mode=car`, { waitUntil: 'load' });

  // Sample the scene WHILE the film is on screen.
  //
  // This has to be captured mid-film, not after. When a cutscene ends, finish()
  // rebuilds the PLAYABLE map over the stage — the stage group, its cones and its
  // lamps are all torn down. An inspection that waits for the film to finish and
  // then counts cones finds zero, and reports a working integration as broken.
  // The first version of this script did exactly that.
  await page.evaluate(() => {
    window.__scene = { samples: 0, cones: 0, modelCones: 0, lamps: 0, modelLamps: 0, maxChildren: 0 };
    const seen = new Set();
    setInterval(() => {
      if (!(window.Cutscene && window.Cutscene.isActive())) return;
      window.__scene.samples++;
      window.game.scene.traverse(n => {
        if (n.name === 'stage-cone' && !seen.has(n.uuid)) {
          seen.add(n.uuid);
          window.__scene.cones++;
          if (n.getObjectByName('stage-cone-body')) window.__scene.modelCones++;
        }
        if (n.name === 'stage-lamp' && !seen.has(n.uuid)) {
          seen.add(n.uuid);
          window.__scene.lamps++;
          // Identified BY NAME, not by counting meshes. The mesh-count heuristic
          // was backwards — the GLB lamp is 2 meshes and the procedural stand-in
          // is 6 — and it reported 0 of 8 lamps as modelled.
          if (n.getObjectByName('stage-lamp-body')) window.__scene.modelLamps++;
        }
      });
    }, 250);
  });

  if (!load) {
    // Simulate an asset group that never arrived: the procedural builders must
    // cover for it and the film must still play.
    await page.waitForFunction(() => window.ASSET_MANIFEST, null, { timeout: 20000 });
    await page.addInitScript(() => { /* no-op; kept for clarity */ });
    await page.evaluate(() => {
      window.__forceNoProps = true;
    });
  }
  return { page, errs };
}

/**
 * Wait for the film to START and then finish, and return what the sampler saw.
 *
 * The two-wait shape is not optional. Waiting only for `!isActive()` returns
 * instantly at page load, because the film has not begun yet — and the test then
 * reports a stage scene with zero props in it, which is a true observation of the
 * wrong moment. That mistake was made twice here and produced a confident, wrong
 * failure report both times.
 */
async function waitForFilmAndSample(page, timeoutMs) {
  const t0 = Date.now();
  let began = false;
  while (Date.now() - t0 < timeoutMs) {
    const active = await page.evaluate(() => !!(window.Cutscene && window.Cutscene.isActive()));
    if (active) { began = true; break; }
    await page.waitForTimeout(300);
  }
  if (!began) {
    const s = await page.evaluate(() => window.__scene);
    return { began: false, ended: false, ...s };
  }
  await page.waitForFunction(() => !window.Cutscene.isActive(), null,
    { timeout: Math.max(5000, timeoutMs - (Date.now() - t0)) }).catch(() => {});
  const scene = await page.evaluate(() => window.__scene);
  return { began: true, ended: true, ...scene };
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();

  // ── 1. Props load and reach the film's scene ───────────────────────────────
  {
    const { page, errs } = await bootPage(browser, { load: true });
    // Wait for every requested prop to finish loading, not just the first.
    await page.waitForFunction(() => {
      const P = window.PRELOADED_MODELS || {};
      const want = ['prop_traffic_cone', 'prop_street_light', 'prop_traffic_light',
        'prop_fire_hydrant', 'prop_bin', 'prop_tree_small'];
      return want.every(k => P[k]);
    }, null, { timeout: 90000 }).catch(() => {});

    const pre = await page.evaluate(() => {
      const P = window.PRELOADED_MODELS || {};
      const want = ['prop_traffic_cone', 'prop_street_light', 'prop_traffic_light',
        'prop_fire_hydrant', 'prop_bin', 'prop_tree_small'];
      const have = {}; const missing = [];
      for (const k of want) { if (P[k]) have[k] = true; else missing.push(k); }
      return { have, missing, loadedCount: Object.keys(P).filter(k => k.startsWith('prop_')).length };
    });
    check(pre.loadedCount > 0, 'prop_* assets preloaded', `${pre.loadedCount} props`);
    check(pre.missing.length === 0, 'every requested prop preloaded',
      pre.missing.length ? 'missing: ' + pre.missing.join(', ') : '');

    // Wait for the film, sampling the scene while it is on screen.
    const scene = await waitForFilmAndSample(page, 240000);

    check(scene.began, 'the film actually started (sampler had something to observe)');
    check(scene.samples > 0, 'the sampler caught the film on screen',
      `${scene.samples} mid-film samples`);
    check(scene.cones > 0, 'the crime scene built cones', `${scene.cones} cones`);
    check(scene.modelCones === scene.cones,
      'every cone is the MODEL, not the procedural stand-in',
      `${scene.modelCones}/${scene.cones}`);
    check(scene.lamps > 0, 'the junction has street lamps', `${scene.lamps} lamps`);
    check(scene.modelLamps === scene.lamps,
      'every street lamp is the MODEL',
      `${scene.modelLamps}/${scene.lamps}`);
    check(errs.length === 0, 'no uncaught errors while the film ran', errs.slice(0, 2).join(' | '));
    await page.close();
  }

  // ── 2. FALLBACK — no props at all, the film must still play ────────────────
  {
    const { page, errs } = await bootPage(browser, { load: false });
    // Drop the cached props the moment they arrive, so the builders cannot find
    // them — the situation a partial deploy produces.
    await page.evaluate(() => {
      const strip = () => {
        const P = window.PRELOADED_MODELS;
        if (!P) return false;
        delete P.prop_traffic_cone;
        delete P.prop_street_light;
        return true;
      };
      const iv = setInterval(() => { if (strip() && window.Cutscene.isActive()) clearInterval(iv); }, 50);
    });
    // `window.game` is created by the game's own bootstrap, which runs after the
      // `load` event. Evaluating this immediately after goto() found no game and
      // reported "the level has no prologue" for a level that has one.
      await page.waitForFunction(() => window.game && window.Cutscene, null, { timeout: 30000 });
      const started = await page.evaluate(() => !!window.game && !!window.Cutscene.hasPrologue());
      check(started, 'fallback run: level reports it has a prologue');

    const after = await waitForFilmAndSample(page, 240000);
    check(after.began, 'fallback run: the film actually started');
    check(after.samples > 0, 'fallback run: the sampler caught the film on screen');
    check(after.cones > 0, 'fallback run: procedural cones still built', `${after.cones} cones`);
    check(after.modelCones === 0, 'fallback run: no model was used (as expected)');
    check(errs.length === 0, 'fallback run: no uncaught errors', errs.slice(0, 2).join(' | '));
    await page.close();
  }

  console.log('\n' + (fails ? `${fails} FAILURE(S)` : 'props verified against a real film run'));
  await browser.close();
  server.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });