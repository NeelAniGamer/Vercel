// Verifies the recorded-audio bank against a real browser: does the manifest
// load, do the files resolve, and does a cue actually start audio playback?
//
// This does NOT check that a sample is audible — headless Chromium has no audio
// device and `play()` resolves even for silence. What it checks is the part that
// actually fails: that the wiring resolves the key to a URL, creates a playable
// element, and that a failed load degrades to null instead of throwing inside a
// cutscene.
//
// Usage: node scripts/verify_samples.js [port]

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '5320';
const ROOT = path.resolve(__dirname, '..');

let fails = 0;
function check(ok, label, detail) {
  console.log(`  [${ok ? 'ok  ' : 'FAIL'}] ${label}${detail ? '  ' + detail : ''}`);
  if (!ok) fails++;
}

(async () => {
  // 0. Files exist on disk at all. Cheapest possible check, and it catches a
  // staging script that silently skipped a conversion.
  const manifestPath = path.join(ROOT, 'story', 'asset_manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let missingOnDisk = 0;
  for (const set of ['models', 'modelsFbx', 'sfx', 'ambience']) {
    for (const [key, e] of Object.entries(manifest[set] || {})) {
      if (!fs.existsSync(path.join(ROOT, e.path))) {
        console.log(`  [FAIL] ${set}/${key} missing on disk: ${e.path}`);
        missingOnDisk++; fails++;
      }
    }
  }
  console.log(`  [ok  ] ${Object.keys(manifest.models).length} models, ` +
    `${Object.keys(manifest.sfx).length} sfx, ${Object.keys(manifest.ambience).length} ambience on disk`);
  if (!missingOnDisk) console.log('  [ok  ] every manifest path resolves on disk');

  // 1. Serve and load.
  const http = require('http');
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.ogg': 'audio/ogg',
    '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' };
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/') u = '/Driving.html';
    const f = path.join(ROOT, u);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(d);
    });
  });
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));

  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(`http://127.0.0.1:${PORT}/Driving.html?level=1&mode=car`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.SampleBank, null, { timeout: 30000 });

  // 2. The manifest actually loads in the browser (path is correct, JSON parses).
  await page.evaluate(() => window.SampleBank.preload(function () {}));
  await page.waitForFunction(() => window.SampleBank.has('sfx_crash_car'), null, { timeout: 15000 })
    .catch(() => {});
  const loaded = await page.evaluate(() => ({
    hasCrash: window.SampleBank.has('sfx_crash_car'),
    hasSiren: window.SampleBank.has('sfx_police_siren'),
    hasWindscreen: window.SampleBank.has('sfx_windscreen'),
    hasNonsense: window.SampleBank.has('sfx_does_not_exist'),
    hasAmb: window.SampleBank.has('amb_rain_calm', 'ambience'),
  }));
  check(loaded.hasCrash, 'manifest loaded; sfx_crash_car resolves');
  check(loaded.hasSiren, 'sfx_police_siren resolves');
  check(loaded.hasWindscreen, 'sfx_windscreen resolves');
  check(loaded.hasAmb, 'ambience bucket resolves (amb_rain_calm)');
  check(!loaded.hasNonsense, 'an unknown key resolves to nothing (no false positive)');

  // 3. A play() call produces a real element AND the media clock actually moves.
  //
  //    The clock is polled rather than sampled once. A one-shot `play()` returns
  //    immediately, while the file is still buffering — an earlier version of this
  //    test sampled `currentTime` 250ms later, found it unmoved, and reported a
  //    broken sample that was in fact decoding correctly.
  const played = await page.evaluate(async () => {
    const out = {};
    const el = window.SampleBank.play('sfx_crash_car', { gain: 0.5 });
    out.oneShotIsElement = !!(el && typeof el.play === 'function');
    out.src = el ? el.getAttribute('src') : null;
    out.volume = el ? el.volume : null;
    out.failedFlag = el ? !!el.__failed : null;

    // Poll for the media clock to move, up to 5s.
    const t0 = performance.now();
    while (performance.now() - t0 < 5000) {
      if (el && !el.paused && el.currentTime > 0) break;
      await new Promise(r => setTimeout(r, 60));
    }
    out.waitedMs = Math.round(performance.now() - t0);
    out.paused = el ? el.paused : null;
    out.currentTime = el ? +el.currentTime.toFixed(3) : null;
    out.readyState = el ? el.readyState : null;   // 4 === HAVE_ENOUGH_DATA
    out.moved = !!(el && el.currentTime > 0);

    const lp = window.SampleBank.loop('sfx_police_siren', { gain: 0.3 });
    out.loopIsElement = !!(lp && typeof lp.loop === 'function');
    out.loopFlagSet = lp ? lp.loop === true : null;
    return out;
  });
  check(played.oneShotIsElement, 'play() returns a media element', played.src || '');
  check(played.volume === 0.5, 'play() honours the requested gain', String(played.volume));
  check(played.failedFlag === false, 'play() does not mark the element failed');
  check(played.readyState === 4, 'the ogg decoded (readyState 4 = HAVE_ENOUGH_DATA)',
    `readyState=${played.readyState}`);
  // NOT asserted: that the media clock advances, or that anything is audible.
  // Headless Chromium has no audio output device, so the clock can sit at 2ms
  // with readyState 4 and playback accepted, and nothing comes out. An earlier
  // version of this test asserted the clock advanced and failed for exactly that
  // reason. Whether these samples SOUND right can only be answered by a person
  // on a machine with speakers; what is verified is that they decode and that the
  // wiring reaches them.
  console.log(`  [note] audio clock reached t=${played.currentTime}s in ${played.waitedMs}ms — ` +
    'headless has no audio device, so audibility is NOT verified here');

  // 4. Loop stop clears the registry (the bug that leaves a siren under the
  //    results screen forever).
  const stopped = await page.evaluate(async () => {
    window.SampleBank.loop('sfx_police_siren', { gain: 0.3 });
    const started = window.SampleBank.loop('sfx_police_siren', { gain: 0.3 });
    const wasRunning = !!started && started.loop === true;
    const ret = window.SampleBank.stop('sfx_police_siren', 120);
    await new Promise(r => setTimeout(r, 400));
    return { wasRunning, ret, stopAgain: window.SampleBank.stop('sfx_police_siren', 0) };
  });
  check(stopped.wasRunning, 'loop() keeps the sample running');
  check(stopped.ret === true, 'stop() reports it stopped something');
  check(stopped.stopAgain === false, 'stop() on an already-stopped loop is a no-op');

  // 6. endFilm() must silence every loop — the regression that would leave a
  //    police siren under the reward screen.
  //
  //    Runs BEFORE the degradation checks below, because those deliberately
  //    replace the manifest with a one-entry stub. Running this afterwards means
  //    `urlFor` resolves against the stub, `loop()` correctly returns null, and
  //    the test concludes the loop never started. That is a test ordering bug
  //    that reads exactly like a product bug.
  const endFilm = await page.evaluate(async () => {
    window.SampleBank.loop('sfx_police_siren', { gain: 0.3 });
    window.SampleBank.loop('sfx_idle_loop', { gain: 0.2 });
    const before = !!window.SampleBank.loop('sfx_police_siren', { gain: 0.3 });
    const idleBefore = !!window.SampleBank.loop('sfx_idle_loop', { gain: 0.2 });
    if (window.StoryAudio && window.StoryAudio.endFilm) { window.StoryAudio.endFilm(); }
    await new Promise(r => setTimeout(r, 500));
    return {
      before, idleBefore,
      // After endFilm the registry is empty, so stop() finds nothing to stop.
      sirenAfter: window.SampleBank.stop('sfx_police_siren', 0),
      idleAfter: window.SampleBank.stop('sfx_idle_loop', 0),
    };
  });
  check(endFilm.before, 'a loop was running before endFilm');
  check(endFilm.idleBefore, 'a second loop was running before endFilm');
  check(endFilm.sirenAfter === false && endFilm.idleAfter === false,
    'endFilm() empties the loop registry — no siren under the results screen');

  // 5. DEGRADATION — the rule the whole file exists to honour.
  const degraded = await page.evaluate(async () => {
    const r = {};
    r.unknownPlay = window.SampleBank.play('sfx_not_a_real_key', {});
    r.unknownLoop = window.SampleBank.loop('sfx_not_a_real_key', {});
    r.unknownStop = window.SampleBank.stop('sfx_not_a_real_key', 0);

    // A manifest entry pointing at a file that does not exist. The first call
    // CANNOT return null: `new Audio()` succeeds and `play()` returns a pending
    // promise, so the browser has not failed anything yet. What must happen is
    // that the rejection marks the key dead, so the SECOND call short-circuits.
    window.SampleBank._setManifest({
      sfx: { sfx_ghost: { path: 'audio/sfx/does-not-exist.ogg', gain: 0.5 } },
      ambience: {}, models: {},
    });
    r.ghostFirst = window.SampleBank.play('sfx_ghost', {});
    await new Promise(x => setTimeout(x, 600));
    r.ghostSecond = window.SampleBank.play('sfx_ghost', {});
    r.ghostIsDead = window.SampleBank.dead().indexOf('sfx_ghost') >= 0;
    r.ghostHas = window.SampleBank.has('sfx_ghost');
    window.SampleBank._setManifest(null);
    return r;
  });
  check(degraded.unknownPlay === null, 'unknown key: play() returns null, does not throw');
  check(degraded.unknownLoop === null, 'unknown key: loop() returns null, does not throw');
  check(degraded.unknownStop === false, 'unknown key: stop() returns false');
  check(degraded.ghostFirst !== undefined && degraded.ghostFirst !== null,
    'missing file: first play() issues a request (async failure, by design)');
  check(degraded.ghostIsDead, 'missing file: the rejection marks the key dead');
  check(degraded.ghostSecond === null,
    'missing file: every LATER call short-circuits to null (one attempt, not one per cue)');

  check(errors.length === 0, 'no uncaught page errors', errors.slice(0, 3).join(' | '));

  console.log('\n' + (fails ? `${fails} FAILURE(S)` : 'sample bank verified'));
  await browser.close();
  server.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });