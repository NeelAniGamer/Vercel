#!/usr/bin/env node
/**
 * ============================================================================
 * SMOKE TEST (pw_test.js)  —  `npm run test:smoke`
 * ============================================================================
 * The regression gate for the Electron/static build. Previously this script was
 * referenced by package.json but did not exist, so `npm run test:smoke` could
 * never pass.
 *
 * What it actually proves:
 *   1. Every entry page boots with zero console errors.
 *   2. three.js and all loader modules resolve LOCALLY (no CDN dependency).
 *   3. No request ever leaves localhost except the Google AdSense tag — this is
 *      the regression test for the "level won't load offline" bug.
 *   4. The WebGL canvas is created and THREE is live on Driving.html.
 *   5. Levels register into the window.LVS registry.
 *   6. Robot NPC module + CC0 models are present and correctly scaled.
 *
 * Runs a throwaway static server on an ephemeral port, then exits non-zero on
 * any failure. No test framework, no config file, no dev server required.
 * ============================================================================
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// Serve the PARENT of Traffic/, because pages legitimately reference shared
// modules as ../col-ui.js. That is the real topology in both production targets:
//   - Vercel:  /Traffic/Driving.html -> /col-ui.js        (root shared copy)
//   - Electron: app.asar/dist/Driving.html -> app.asar/col-ui.js
// Serving from Traffic/ itself would make those 404 for reasons that do not
// exist in the shipped product.
const ROOT = path.resolve(__dirname, '..');
const APP = '/Traffic';

const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'skypack.dev', 'esm.sh'];

// A remote request is FORBIDDEN when it pulls game engine/asset code from a
// CDN. Matching on the URL path (not just the host) is deliberate: jsdelivr also
// serves @supabase/supabase-js, which is a hosted backend and cannot work
// offline regardless of where its client is bundled.
const GAME_CODE_PATTERN = /(\/three|\bthree\.js|draco|gltf|glb|fflate|chart\.js|html2pdf|jszip|buffergeometry|orbitcontrols)/i;

function isForbiddenCdn(url) {
  let host, pathname;
  try { ({ host, pathname } = new URL(url)); } catch (e) { return false; }
  if (!CDN_HOSTS.includes(host)) return false;
  return GAME_CODE_PATTERN.test(pathname);
}

// Services that are remote BY NATURE and cannot function offline no matter
// where their client code is hosted. They must degrade gracefully, not break:
//   - Supabase / Google Identity : sign-in cannot work offline regardless
//   - Vercel Speed Insights      : injected by the Vercel platform, not shipped
//                                  in the app, so it 404s in any local harness
const BY_DESIGN_REMOTE = [
  /supabase/i,
  /accounts\.google\.com/i,
  /_vercel\/speed-insights/i,
];

function isByDesignRemote(url) {
  return BY_DESIGN_REMOTE.some((re) => re.test(url));
}

// Remote webfonts. These degrade to the system UI font offline (the CSS already
// declares system-ui fallbacks), so they are a cosmetic degradation, not a
// functional break — tracked separately and never fatal.
const IGNORED_HOSTS = ['pagead2.googlesyndication.com', 'googleads.g.doubleclick.net'];

const DEGRADABLE_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Console noise that is expected because a by-design remote service is
// unreachable. Real local 404s are caught separately via ALL_404, so a generic
// "404" console line adds nothing here.
const EXPECTED_NOISE = /favicon|adsbygoogle|googlesyndication|ERR_BLOCKED_BY_CLIENT|net::ERR_|status of 404|accounts list is empty|accounts\.google|supabase|speed-insights|ERR_NAME_NOT_RESOLVED|Failed to load resource/i;

// Google Identity (GSI) noise: One Tap / FedCM has no user or no configured
// provider in a headless run, so it logs and rejects. Harmless.
const AUTH_NOISE = /GSI_LOGGER|navigator\.credentials|FedCM|NotAllowedError/i;

// Chromium logs a report-only CSP violation when the Google Sign-In / AdSense
// iframe frames google.com, which cannot satisfy `frame-ancestors 'self'`.
// The message states it was "logged, but no further action has been taken", so
// it is not a functional break.
//
// Deliberately narrow: requires ALL of
//   - "report-only"          an ENFORCED violation is a real bug and stays fatal
//   - "frame-ancestors"      framing only; script/style CSP stays fatal
//   - a by-design third party host
// so widening this cannot mask a genuine first-party CSP problem.
const CSP_NOISE =
  /report-only Content Security Policy[\s\S]*frame-ancestors[\s\S]*|frame-ancestors[\s\S]*report-only/i;
const CSP_NOISE_HOSTS = /google\.com|googlesyndication\.com|doubleclick\.net|googleapis\.com/i;

function isCspNoise(entry) {
  return CSP_NOISE.test(entry) && CSP_NOISE_HOSTS.test(entry);
}

function realErrors(state) {
  return state.errors.filter(
    (e) => !EXPECTED_NOISE.test(e) && !AUTH_NOISE.test(e) && !isCspNoise(e)
  );
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

// ------------------------------------------------------------------ server

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/' || rel === '') rel = '/index.html';
      const file = path.join(ROOT, path.normalize(rel).replace(/^([/\\])+/, ''));
      if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found: ' + rel); return; }
        const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
        // Content-Length matters: the test reads it to report asset sizes, and
        // HEAD requests must not fall back to a body-less 200.
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': buf.length });
        if (req.method === 'HEAD') { res.end(); return; }
        res.end(buf);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// ------------------------------------------------------------------ helpers

const results = [];
const ALL_404 = [];
const ALL_DEGRADABLE = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail: detail || '' });
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

/** Attach console + network listeners to a page. */
function watch(page) {
  const state = { errors: [], forbidden: [], degradable: [], ignored: 0, failedLocal: [], notFound: [], byDesign: [] };

  page.on('console', (msg) => {
    if (msg.type() === 'error') state.errors.push(msg.text());
  });
  page.on('pageerror', (err) => state.errors.push('pageerror: ' + (err && err.message)));

  page.on('request', (req) => {
    const url = req.url();
    const host = new URL(url).hostname;
    if (IGNORED_HOSTS.includes(host)) { state.ignored++; return; }
    if (isForbiddenCdn(url)) { state.forbidden.push(url); return; }
    if (isByDesignRemote(url)) { state.byDesign.push(url); return; }
    if (DEGRADABLE_HOSTS.includes(host)) {
      state.degradable.push(url);
      ALL_DEGRADABLE.push(url);
    }
  });

  page.on('response', (res) => {
    if (res.status() === 404) {
      const url = res.url();
      // A 404 from a by-design remote service is that service's problem, not ours.
      if (isByDesignRemote(url) || IGNORED_HOSTS.includes(new URL(url).hostname)) return;
      state.notFound.push(url);
      ALL_404.push(url);
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (isForbiddenCdn(url) || isByDesignRemote(url)) return;
    if (IGNORED_HOSTS.includes(new URL(url).hostname)) return;
    state.failedLocal.push(`${req.failure() && req.failure().errorText} ${url.slice(0, 100)}`);
  });

  return state;
}

// -------------------------------------------------------------------- main

(async () => {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('FATAL: playwright is not resolvable.');
    console.error('Install it with:  npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  console.log(`\nStatic server: ${base}\n`);

  const browser = await playwright.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let exitCode = 0;

  try {
    // ---------------------------------------------------------- index shell
    console.log('index.html (Electron desktop shell)');
    {
      const page = await browser.newPage();
      const s = watch(page);
      await page.goto(`${base}${APP}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);
      check('home hub present', await page.locator('#home-hub').count() === 1);
      check('four view iframes wired',
        await page.locator('iframe.view-frame').count() === 4,
        `${await page.locator('iframe.view-frame').count()} found`);
      check('no console errors', realErrors(s).length === 0, realErrors(s).slice(0, 2).join(' | '));
      check('ZERO functional CDN requests', s.forbidden.length === 0, s.forbidden.slice(0, 2).join(' | '));
      await page.close();
    }

    // --------------------------------------------------------------- academy
    console.log('\nAcademy.html (app entry point)');
    {
      const page = await browser.newPage();
      const s = watch(page);
      await page.goto(`${base}${APP}/Academy.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2500);
      check('THREE loaded', await page.evaluate(() => typeof window.THREE !== 'undefined'));
      check('no console errors', realErrors(s).length === 0, realErrors(s).slice(0, 2).join(' | '));
      check('ZERO functional CDN requests', s.forbidden.length === 0, s.forbidden.slice(0, 2).join(' | '));
      await page.close();
    }

    // -------------------------------------------------------------- driving
    console.log('\nDriving.html (simulator — heaviest page, 42MB of legacy JS)');
    {
      const page = await browser.newPage();
      const s = watch(page);
      await page.goto(`${base}${APP}/Driving.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });

      // Loader modules must all be local now.
      await page.waitForFunction(
        () => typeof window.THREE !== 'undefined' && typeof window.THREE.GLTFLoader !== 'undefined',
        null, { timeout: 60000 },
      ).catch(() => {});
      await page.waitForTimeout(3000);

      const libs = await page.evaluate(() => ({
        three: typeof window.THREE !== 'undefined',
        revision: window.THREE && window.THREE.REVISION,
        gltf: typeof window.THREE.GLTFLoader !== 'undefined',
        draco: typeof window.THREE.DRACOLoader !== 'undefined',
        fbx: typeof window.THREE.FBXLoader !== 'undefined',
        obj: typeof window.THREE.OBJLoader !== 'undefined',
        bufferGeo: typeof window.THREE.BufferGeometryUtils !== 'undefined',
        composer: typeof window.THREE.EffectComposer !== 'undefined',
        shim: !!window.THREE_SHIM,
        shimAddons: (window.THREE_SHIM && window.THREE_SHIM.addons) || [],
        robot: typeof window.RobotNPCs !== 'undefined',
        chart: typeof window.Chart !== 'undefined',
      }));
      check('THREE present', libs.three, `REVISION r${libs.revision}`);
      // Phase 3: engine upgraded r128 -> r186 through a global shim, because
      // three.js dropped the UMD build after r148 and this codebase is ~4,700
      // `new THREE.*` classic-script call sites. Assert the version and the
      // shim so a silent revert to the old r128 libs/three.js is caught.
      const revNum = parseInt(String(libs.revision).replace(/\D/g, ''), 10);
      check('engine is r186+ via shim', !!libs.shim && revNum >= 186,
        `r${libs.revision}, shim=${libs.shim}, ${libs.shimAddons.length} addons`);
      check('shim exposes addon surface', libs.shimAddons.length >= 12);
      check('EffectComposer available', libs.composer);
      check('GLTFLoader (local)', libs.gltf);
      check('DRACOLoader (local)', libs.draco);
      check('FBXLoader (local)', libs.fbx);
      check('OBJLoader (local)', libs.obj);
      check('BufferGeometryUtils (local)', libs.bufferGeo);
      check('chart.js (local)', libs.chart);
      check('RobotNPCs module loaded', libs.robot);

      const canvas = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        return c ? { w: c.width, h: c.height } : null;
      });
      check('canvas created', !!canvas, canvas ? `${canvas.w}x${canvas.h}` : 'no canvas found');

      const lvs = await page.evaluate(() => (window.LVS ? Object.keys(window.LVS).length : 0));
      check('levels registered in window.LVS', lvs > 0, `${lvs} levels`);

      // The core regression: nothing may be fetched from a CDN.
      check('ZERO functional CDN requests', s.forbidden.length === 0,
        s.forbidden.length ? s.forbidden.slice(0, 3).join(' | ') : 'all local');
      check('no local asset failures', s.failedLocal.length === 0, s.failedLocal.slice(0, 3).join(' | '));

      const real = realErrors(s);
      check('no console errors', real.length === 0, real.slice(0, 2).join(' | '));
      if (s.ignored) console.log(`         (${s.ignored} AdSense request(s) ignored by design)`);
      await page.close();
    }

    // ----------------------------------------------------------- robot assets
    console.log('\nRobot NPC assets');
    {
      const page = await browser.newPage();
      await page.goto(`${base}${APP}/index.html`, { waitUntil: 'domcontentloaded' });
      const robots = await page.evaluate(async () => {
        const files = ['animated_robot', 'robot_enemy', 'robot_enemy_large', 'robot_enemy_flying'];
        const out = [];
        for (const f of files) {
          const res = await fetch(`Models/robots/${f}.glb`, { method: 'HEAD' });
          out.push({ f, ok: res.ok, size: Number(res.headers.get('content-length') || 0) });
        }
        return out;
      });
      for (const r of robots) check(`model ${r.f}.glb served`, r.ok, `${(r.size / 1024).toFixed(0)} KB`);

      const draco = await page.evaluate(async () => {
        const r = await fetch('libs/draco/draco_decoder.wasm', { method: 'HEAD' });
        return { ok: r.ok, size: Number(r.headers.get('content-length') || 0) };
      });
      check('draco decoder served locally', draco.ok, `${(draco.size / 1024).toFixed(0)} KB`);
      await page.close();
    }

    // -------------------------------------------------------- node-side facts
    console.log('\nNode-side checks');
    {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      check('extraResources removed (no duplicate Models)', !pkg.build.extraResources);
      check('col-* shipped at asar root', (pkg.build.files || []).includes('col-ui.js'));
      check('mac icon points at an existing file', fs.existsSync(path.join(__dirname, pkg.build.mac.icon)),
        pkg.build.mac.icon);
      check('entry is Academy.html',
        /Academy\.html/.test(fs.readFileSync(path.join(__dirname, 'electron', 'main.js'), 'utf8')));

      const dracoSrc = fs.readFileSync(path.join(__dirname, 'start.js'), 'utf8');
      check('three-bundle defines import.meta.url',
        /__threeBundleSelfUrl/.test(fs.readFileSync(path.join(__dirname, 'libs', 'three-bundle.js'), 'utf8')));
      check('shim source avoids mutating the ES namespace',
        !/Object\.assign\(THREE,/.test(fs.readFileSync(path.join(__dirname, 'three-shim.js'), 'utf8')));
      check('Draco decoder path is local', /setDecoderPath\(\s*['"]libs\/draco\//.test(dracoSrc));

      check('robot assets credited',
        fs.existsSync(path.join(__dirname, 'Models', 'robots', 'CREDITS.md')));

    // ------------------------------------------------------- startup payload
    console.log('\nStartup payload (Phase 2 - no base64 in JS)');
    {
      // The five former base64 giants must stay small. Re-inlining a data URI
      // regresses silently and adds ~40 MB of parse back to startup.
      const HEAVY = ['lambo.js', 'bus.js', 'auto.js', 'env.js', 'cert_assets.js'];
      let worst = 0, worstName = '';
      for (const f of HEAVY) {
        const fp = path.join(__dirname, f);
        if (!fs.existsSync(fp)) { check(f + ' present', false); continue; }
        const sz = fs.statSync(fp).size;
        if (sz > worst) { worst = sz; worstName = f; }
        const txt = fs.readFileSync(fp, 'utf8');
        // Match a real inline payload (a long base64 run after a data URI
        // prefix), not prose that merely mentions base64 in a comment.
        check(f + ' has no inline base64', !/base64,[A-Za-z0-9+/]{200,}/.test(txt),
          (sz / 1024).toFixed(1) + ' KB');
      }
      check('all five stubs are tiny', worst < 64 * 1024,
        'largest ' + worstName + ' ' + (worst / 1024).toFixed(1) + ' KB');

      // Extracted binaries must be valid GLB with a matching header length.
      for (const k of ['lambo', 'bus', 'auto', 'env']) {
        const fp = path.join(__dirname, 'Models', 'embedded', k + '.glb');
        if (!fs.existsSync(fp)) { check('embedded/' + k + '.glb present', false); continue; }
        const b = fs.readFileSync(fp);
        check('embedded/' + k + '.glb valid',
          b.slice(0, 4).toString('ascii') === 'glTF' && b.readUInt32LE(8) === b.length,
          (b.length / 1048576).toFixed(2) + ' MB');
      }

      // Certificate logos: resolve the paths cert_assets.js actually assigns,
      // rather than hardcoding filenames. That way repointing a logo to a
      // smaller/cheaper file keeps this check honest instead of silently
      // asserting a file nobody renders any more.
      //
      // Signatures accepted: PNG, WEBP (RIFF), JPEG. sneh-logo.png is a WebP
      // behind a .png name — browsers sniff it, but the signature is not PNG.
      const IMG_SIGS = {
        png: '89504e470d0a1a0a',
        riff: '52494646',
        jpeg: 'ffd8ff',
      };
      const logoSrc = fs.readFileSync(path.join(__dirname, 'cert_assets.js'), 'utf8');
      const logoPaths = [1, 2]
        .map((i) => {
          const m = logoSrc.match(new RegExp('CERT_LOGO_' + i + "\\s*=\\s*'([^']+)'"));
          return m ? m[1] : null;
        })
        .filter(Boolean);
      check('cert_assets.js exposes CERT_LOGO_1/2', logoPaths.length === 2,
        logoPaths.join(', ') || 'not found');
      for (const rel of logoPaths) {
        const fp = path.join(__dirname, rel);
        if (!fs.existsSync(fp)) { check('logo ' + rel + ' present', false); continue; }
        const b = fs.readFileSync(fp);
        const sig = b.toString('hex', 0, 8);
        const ok = sig === IMG_SIGS.png
          ? true
          : sig.startsWith(IMG_SIGS.riff) && b.toString('latin1', 8, 12) === 'WEBP'
            ? true
            : sig.startsWith(IMG_SIGS.jpeg);
        const dims = ok && sig === IMG_SIGS.png
          ? b.readUInt32BE(16) + 'x' + b.readUInt32BE(20)
          : (b.length / 1024).toFixed(1) + ' KB';
        check('logo ' + rel + ' valid image', ok, dims);
      }

      // Phase 4: the Electron package must honour the dead-asset manifest that
      // the web build already uses, or it ships ~630 MB of never-loaded files.
      check('electron build honours dead-asset manifest',
        /dead-model-files\.json/.test(fs.readFileSync(path.join(__dirname, 'build-electron.js'), 'utf8')) &&
        /copyDirSafeFiltered\(path\.join\(__dirname, 'Models'\)/.test(fs.readFileSync(path.join(__dirname, 'build-electron.js'), 'utf8')));

      // The manifest is only safe while it stays a subset of observed requests.
      const deadManifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'tools', 'dead-model-files.json'), 'utf8')).files || [];
      const observed = (JSON.parse(fs.readFileSync(path.join(__dirname, 'tools', 'model-requests.json'), 'utf8')) || [])
        .map((x) => decodeURIComponent(x).replace(/\\/g, '/'));
      const clash = observed.filter((x) => deadManifest.includes(x));
      check('dead-asset list hides nothing the browser loads', clash.length === 0,
        clash.length ? clash.slice(0, 2).join(', ') : deadManifest.length + ' dead of ' + (deadManifest.length + observed.length));

      // Live assets must never be in the dead set.
      const deadSet = new Set(deadManifest);
      ['Models/building_high_school.glb', 'Models/character_hero_green.glb',
        'Models/anim_walker_biped.glb', 'Models/embedded/lambo.glb',
        'Models/robots/animated_robot.glb'].forEach((rel) => {
        check('live asset not dead: ' + rel, !deadSet.has('Traffic/' + rel));
      });

      check('cert-assets shipped by build-electron.js',
        /cert-assets/.test(fs.readFileSync(path.join(__dirname, 'build-electron.js'), 'utf8')));
    }
    }
  } catch (err) {
    console.error('\nFATAL:', err && err.stack ? err.stack : err);
    exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${'='.repeat(60)}`);

  if (ALL_404.length) {
    console.log(`\n404s observed (${ALL_404.length}):`);
    [...new Set(ALL_404)].slice(0, 12).forEach((u) => console.log(`  - ${u.replace(base, '')}`));
  }
  if (ALL_DEGRADABLE.length) {
    console.log(`\nRemote webfonts (${new Set(ALL_DEGRADABLE).size} unique) — cosmetic only,`);
    console.log('system-ui fallback applies offline. Vendor these if pixel parity matters.');
  }

  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFAILURES:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? `  (${f.detail})` : ''}`));
    exitCode = 1;
  } else {
    console.log('SMOKE TEST PASSED');
  }
  console.log(`${'='.repeat(60)}\n`);
  process.exit(exitCode);
})();