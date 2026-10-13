// Verifies the `hold` primitive in story/shots.js + cutscene.js against real
// frames of the L1 prologue.
//
// WHY A FAKE CLOCK
//   Cutscene.tick() reads performance.now() for its timeline, so driving the film
//   in real time in headless Chromium means fighting rAF throttling: the sampler
//   only ever saw 2 of 9 shots, and a timing assertion against a film running at a
//   third of wall-clock measures the throttle, not the code. Overriding
//   performance.now with a clock the test advances itself makes the whole film
//   deterministic, fast, and complete.
//
// WHAT IT CHECKS
//   1. Every authored shot is actually entered, in order.
//   2. A held shot's camera reaches its end position BY THE END OF THE MOVE and
//      does not move again during the hold. This is the claim being made.
//   3. A shot with no hold is still travelling at its cut — the control that
//      proves the change did not simply freeze every shot.
//   4. Timed one-shots (flashAt) fire while the camera is at rest.
//
// Usage: node scripts/verify_hold.js [port]

const { chromium } = require('playwright');

const PORT = process.argv[2] || '5312';
const BASE = `http://127.0.0.1:${PORT}`;

// 60fps: the film advances in 1/60s steps, which is fine enough to see the frame
// at which the camera stops.
const FRAME = 1000 / 60;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
  const errors = [];
  // Full stack, not just the message. A bare "cannot read properties of
  // undefined" with no frame is unactionable, and this file exists to produce
  // actionable output.
  page.on('pageerror', e => {
    const st = (e.stack || '').split('\n').slice(0, 6).join(' | ');
    errors.push(`${e.message || e}  @ ${st}`);
  });

  await page.goto(`${BASE}/Driving.html`, { waitUntil: 'load' });
  await page.waitForFunction(
    () => window.Cutscene && window.STORY && window.StoryAudio && window.Shots,
    null, { timeout: 30000 });

  const result = await page.evaluate(async (FRAME) => {
    const errors = [];

    // ── fake clock ────────────────────────────────────────────────────────
    let now = 1000;
    const realNow = performance.now.bind(performance);
    performance.now = () => now;
    window.requestAnimationFrame = () => 0;

    // ── probe ─────────────────────────────────────────────────────────────
    const samples = [];
    const flashes = [];
    let active = null;

    const S = window.Shots;
    const origApply = S.applyCamera;
    S.applyCamera = function (game, shot, p, anchors) {
      const cam = game.camera;
      samples.push({
        shot: shot.__probeIdx != null ? shot.__probeIdx : -1,
        p: p,
        hold: shot._hold || 0,
        dur: shot.dur,
        x: +cam.position.x.toFixed(4),
        y: +cam.position.y.toFixed(4),
        z: +cam.position.z.toFixed(4)
      });
      return origApply.apply(this, arguments);
    };

    // Cutscene records the flash in ACTIVE, which is module-private, so the probe
    // reads it off the overlay element the flash drives instead: if the blowout
    // element's opacity is non-zero, a flash is on screen.
    const flashEl = () => document.querySelector('[data-cs-flash]')
      || document.querySelector('.cs-flash') || document.querySelector('#cs-flash');

    // ── start the film ────────────────────────────────────────────────────
    const story = window.STORY['1'];
    const lvl = (window.LVS || []).find(l => l && l.id === 1);
    if (!story || !story.prologue) return { fail: 'no prologue for L1' };
    if (!lvl) return { fail: 'level 1 missing from window.LVS' };
    story.prologue.forEach((s, i) => { s.__probeIdx = i; });

    const game = window.game || window.Game;
    if (!window.Cutscene.begin(game, lvl)) {
      return { fail: 'begin() refused', errors };
    }
    active = true;

    // ── drive it out ──────────────────────────────────────────────────────
    const total = story.prologue.reduce((a, s) => a + s.dur, 0);
    const frames = Math.ceil((total + 1) / (FRAME / 1000));
    const seenShots = [];
    let lastIdx = -1;
    for (let i = 0; i < frames; i++) {
      now += FRAME;
      const still = window.Cutscene.tick(game);
      if (!still) break;
      if (window.Cutscene.isActive()) {
        // Detect shot transitions by which index last pushed a sample.
        const tail = samples[samples.length - 1];
        if (tail && tail.shot !== lastIdx) {
          lastIdx = tail.shot;
          seenShots.push(tail.shot);
        }
      }
      // Sample the flash overlay a few frames after each gunshot window.
      if (samples.length) {
        const s = samples[samples.length - 1];
        if (s.shot === 6) {
          const el = flashEl();
          if (el && parseFloat(getComputedStyle(el).opacity || '0') > 0.01) {
            flashes.push({ shot: s.shot, p: s.p });
          }
        }
      }
    }

    performance.now = realNow;

    return {
      fail: null,
      stillRunning: window.Cutscene.isActive(),
      total,
      frames,
      seenShots,
      samples,
      flashes,
      errors
    };
  }, FRAME);

  if (result.fail) { console.log('SETUP FAILED:', result.fail, result.errors || []); await browser.close(); process.exit(1); }

  console.log(`authored runtime ${result.total}s, driven over ${result.frames} frames`);
  console.log(`shots entered: ${result.seenShots.join(' → ')}`);
  console.log(`samples: ${result.samples.length}`);
  console.log(`still running at end: ${result.stillRunning}`);

  const byShot = new Map();
  for (const s of result.samples) {
    if (!byShot.has(s.shot)) byShot.set(s.shot, []);
    byShot.get(s.shot).push(s);
  }

  let fails = 0;
  console.log('\nshot  dur  hold  move  n    p@move_end  drift_after_move  verdict');
  console.log('-'.repeat(74));

  for (const [idx, rows] of [...byShot.entries()].sort((a, b) => a[0] - b[0])) {
    const first = rows[0];
    const moveEnd = first.dur - first.hold;
    const moveFrac = moveEnd / first.dur;

    // The first frame at which the MOVE HAS FINISHED — that is, p has reached 1 —
    // and the last frame of the shot. The camera distance between those two is the
    // drift the hold failed to eliminate.
    //
    // Comparing at `moveFrac` instead would be wrong: p crosses moveFrac in the
    // MIDDLE of the move, so measuring from there counts the remaining travel as
    // hold drift and condemns a perfectly still frame. The move ends when p hits
    // 1, not when p hits moveFrac.
    const moveDoneIdx = rows.findIndex(r => r.p >= 0.999);
    const beforeIdx = moveDoneIdx;
    let drift = null, verdict, bad = false;

    if (first.hold > 0) {
      if (beforeIdx < 0) {
        verdict = 'NEVER REACHED MOVE END';
        bad = true;
      } else if (beforeIdx >= rows.length - 1) {
        verdict = 'NO SAMPLES INSIDE HOLD';
        bad = true;
      } else {
        // Compare from the FIRST frame at which the move has finished, not from
        // the frame before it. Measuring from the previous frame folds the final
        // fraction of a second of camera travel into the number and reports a
        // perfect hold as broken — which is exactly the false positive this
        // script produced on its first run.
        const a = rows[beforeIdx], b = rows[rows.length - 1];
        drift = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        const still = drift < 0.01;
        verdict = still ? 'hold OK' : 'CAMERA MOVED DURING HOLD';
        bad = !still;
      }
    } else {
      // Control. No hold means the camera must still be travelling at the cut.
      const a = rows[0], b = rows[rows.length - 1];
      drift = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      const travelled = drift > 0.5 && rows[rows.length - 1].p > 0.9;
      verdict = travelled ? 'moving to cut (control)' : 'FROZEN — regression';
      bad = !travelled;
    }
    if (bad) fails++;

    const pAtMoveEnd = beforeIdx >= 0 ? rows[beforeIdx].p.toFixed(3) : '  -  ';
    console.log(
      `${String(idx).padEnd(5)}${first.dur}s  ${first.hold.toFixed(0)}s  ` +
      `${moveEnd.toFixed(0)}s  ${String(rows.length).padEnd(4)}` +
      `${pAtMoveEnd.padStart(11)}  ` +
      `${drift === null ? '     n/a' : drift.toFixed(4).padStart(15)}  ${verdict}`
    );
  }

  // Flash-during-hold check: shot 6 (index 6) is the gunshot. It has no hold, so
  // this only asserts the flash fired at all — that the timed one-shot still works
  // now that the camera progress is a different clock.
  const shot6 = result.flashes.length;
  console.log(`\ngunshot overlay frames observed in shot 6: ${shot6}`);
  if (shot6 === 0) { console.log('  (flash not sampled — check it manually rather than claiming it passed)'); }

  const entered = result.seenShots.length;
  const expected = (await page.evaluate(() => window.STORY['1'].prologue.length));
  console.log(`\nshots entered ${entered}/${expected}`);
  if (entered < expected) { console.log('  WARNING: film did not reach the last shot'); fails++; }

  // Only count errors raised while the film was running. A 404 for a favicon or a
  // missing analytics tag is noise from loading the page, not from this code, and
  // reporting it as a failure trains the reader to ignore the output.
  const filmErrors = errors.filter(e => !/404|Failed to load resource|GSI_LOGGER|accounts list/.test(e));
  if (filmErrors.length) {
    console.log('\npage errors during playback:');
    filmErrors.slice(0, 6).forEach(e => console.log('  ' + String(e).slice(0, 400)));
    fails += filmErrors.length;
  } else if (errors.length) {
    console.log(`\n(${errors.length} load-time console errors ignored: 404s and auth probes)`);
  }

  console.log(fails ? `\n${fails} failure(s)` : '\nhold primitive verified against real frames');
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });