// scripts/autoplay_level.js — drive a level the way a player would, and report
// what breaks.
//
// WHY THIS IS NOT A TELEPORTER
//   Most "autoplay" scripts cheat: they set `game.player.position` and skip the
//   interesting part. That cannot find the bugs worth finding, because the bugs
//   live in the INPUT path and the COLLISION response — not in the state you can
//   assign. So this dispatches real KeyboardEvents at window, which is the exact
//   path a human's fingers take (game_core.js binds keydown/keyup and writes
//   `this.keys`). Every behaviour it exercises — throttle curve, steering rate,
//   signal discipline, obstacle response, the enter-vehicle state machine, the
//   key-gating that stops input leaking into a cutscene — is the production one.
//
// WHAT IT DOES
//   · boots the level and LETS THE CUTSCENE PLAY (no skip; a film that only works
//     when skipped is a broken film)
//   · walks to the car, presses F, waits out the door animation
//   · drives a pure-pursuit autopilot along the level's own checkpoints, with
//     realistic behaviour: cornering speed limits, red-light stops, pedestrian
//     yielding, obstacle slow-down
//   · screenshots every N seconds
//   · records a JSONL trace of everything it did
//   · classifies problems and prints a report
//
// USAGE
//   node scripts/autoplay_level.js                     # level 1, default settings
//   node scripts/autoplay_level.js --level 1 --shots 2.5 --timeout 300
//   node scripts/autoplay_level.js --out scratch/autoplay/l1
//
// Exit code 1 if any ERROR-class problem was found.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const i = argv.indexOf('--' + name);
  if (i < 0) return dflt;
  const v = argv[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
}
const LEVEL_ID = +arg('level', 1);
const SHOT_EVERY = +arg('shots', 3);          // seconds between screenshots
const TIMEOUT = +arg('timeout', 320);          // seconds of driving before giving up
const HEADLESS = arg('headful', false) ? false : true;
const PORT = +arg('port', 5313);
const OUT = path.resolve(ROOT, arg('out', `scratch/autoplay/l${LEVEL_ID}`));

fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

// Screenshot counter, declared up here because the cutscene wait takes its first
// shot before the driving poll loop below is declared.
let shotIdx = 1;

// ── static server ────────────────────────────────────────────────────────────
//
// The harness serves the app itself. Pointing it at an already-running server
// sounds tidier but makes every run depend on someone having remembered to start
// one — and the failure mode is `ERR_CONNECTION_REFUSED` with nothing to do with
// the thing under test. `npm run dev` cannot be used instead: Vite fails to parse
// an inline <style> in Driving.html, so the page never loads.
let server = null;
async function ensureServer(port) {
  const alive = await new Promise(res => {
    const req = require('http').get({ host: '127.0.0.1', port, path: '/Driving.html', timeout: 800 }, r => {
      r.resume(); res(r.statusCode === 200);
    });
    req.on('error', () => res(false));
    req.on('timeout', () => { req.destroy(); res(false); });
  });
  if (alive) { console.log(`reusing server already on :${port}`); return; }

  const http = require('http');
  const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  };
  server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/') u = '/Driving.html';
    const f = path.join(ROOT, u);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end('no'); }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404); return res.end('404 ' + u); }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(d);
    });
  });
  await new Promise(res => server.listen(port, '127.0.0.1', res));
  console.log(`started static server on :${port}`);
}

// ── trace ────────────────────────────────────────────────────────────────────
const trace = fs.createWriteStream(path.join(OUT, 'trace.jsonl'), { flags: 'w' });
let traceN = 0;
function log(kind, data) {
  trace.write(JSON.stringify({ i: traceN++, t: Date.now(), kind, ...data }) + '\n');
}
function note(msg, data) { console.log(msg); log('note', { msg, ...data }); }

// ── problems ─────────────────────────────────────────────────────────────────
const problems = [];
function problem(severity, code, msg, data) {
  problems.push({ severity, code, msg, ...(data || {}) });
  const tag = severity === 'error' ? 'ERROR' : severity === 'warn' ? 'WARN ' : 'INFO ';
  console.log(`  ${tag} [${code}] ${msg}`);
  log('problem', { severity, code, msg, ...(data || {}) });
}

// ═════════════════════════════════════════════════════════════════════════════
(async () => {
  await ensureServer(PORT);
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
      '--disable-background-timer-throttling', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });

  const pageErrors = [];
  page.on('pageerror', e => {
    const msg = String(e.message || e);
    pageErrors.push({ msg, stack: (e.stack || '').split('\n').slice(0, 5).join(' | ') });
    log('pageerror', { msg, stack: pageErrors[pageErrors.length - 1].stack });
  });
  page.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      if (!/404|Failed to load resource|GSI_LOGGER|accounts list/i.test(t)) {
        pageErrors.push({ msg: t, stack: '(console)' });
        log('console_error', { msg: t });
      }
    }
  });

  note(`booting → http://127.0.0.1:${PORT}/Driving.html?level=${LEVEL_ID}`);
  // The `?level=` parameter is the REAL entry path: start.js reads it, selects the
  // level, and calls game.startLevel() itself. Calling startLevel() from here as
  // well launches the level TWICE — which is how the first version of this script
  // reported "the film never ran": the second launch's Cutscene.begin() correctly
  // refuses while the first film is playing and returned false, so the run looked
  // like a level with no cutscene. Nothing was wrong with the game.
  await page.goto(`http://127.0.0.1:${PORT}/Driving.html?level=${LEVEL_ID}&mode=car`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.game && window.LVS && window.ui, null, { timeout: 45000 });
  note('boot ok');

  // ── inject the keyboard driver INSIDE the page ────────────────────────────
  //
  // The autopilot has to run on the page's own clock, not across the CDP
  // boundary: a decision loop that round-trips to Node每 frame would run at
  // whatever rate the IPC allows, and the physics would be tested against a
  // driving style no player could produce. So the whole controller lives in the
  // page and Node only observes.
  await page.evaluate(() => {
    const held = new Set();

    window.__ap = {
      held,
      stats: { frames: 0, maxSpeed: 0 },
      run: [],                       // event log, read back by Node at the end
      shotRequests: 0,
      key(code, down) {
        if (down) {
          if (held.has(code)) return;
          held.add(code);
        } else {
          if (!held.has(code)) return;
          held.delete(code);
        }
        const ev = new KeyboardEvent(down ? 'keydown' : 'keyup', {
          key: code === 'ShiftLeft' ? 'Shift' : code.replace('Key', '').toLowerCase(),
          code, bubbles: true, cancelable: true
        });
        window.dispatchEvent(ev);
      },
      tap(code, ms) {
        this.key(code, true);
        setTimeout(() => this.key(code, false), ms);
      },
      releaseAll() { [...held].forEach(c => this.key(c, false)); },
      ev(o) { o.t = +o.t.toFixed(2); this.run.push(o); },
    };

    // ── FILM RECORDER (in-page, event-driven) ───────────────────────────────
    //
    // Polling `isActive()` from Node is unreliable here and produced a run that
    // reported the prologue never played while it was on screen. The reasons are
    // all timing: the film starts and stops between polls, and Playwright's
    // default rAF-based polling competes with the page's own render loop.
    //
    // So record it where it happens. `begin()` and `finish()`-equivalent state
    // changes are observed by polling on a `setInterval` INSIDE the page (which
    // the render loop cannot starve the way it starves a cross-process poll), and
    // the whole transition list is read back once at the end.
    window.__film = { transitions: [], started: false, beganAt: null, endedAt: null };
    (function recordFilm() {
      let last = null;
      setInterval(() => {
        const active = !!(window.Cutscene && window.Cutscene.isActive());
        if (active === last) return;
        last = active;
        const rec = window.__film;
        rec.transitions.push({
          at: +(performance.now() / 1000).toFixed(2),
          active,
          announced: !!window.game._introStarted,
          playing: !!window.game.playing,
        });
        if (active && !rec.started) { rec.started = true; rec.beganAt = rec.transitions[rec.transitions.length - 1].at; }
        if (!active && rec.started && rec.endedAt == null) { rec.endedAt = rec.transitions[rec.transitions.length - 1].at; }
      }, 50);
    })();
  });

  // ── wait for the level to build ───────────────────────────────────────────
  //
  // The level is started by the page, not by us. So the first thing to confirm is
  // that OUR requested level is the one that got selected — otherwise the run
  // silently tests L1 while claiming to test something else.
  const selected = await page.evaluate(() => (window.ui && window.ui.cur) ? window.ui.cur.id : null);
  if (String(selected) !== String(LEVEL_ID)) {
    problem('error', 'WRONG_LEVEL', `asked for L${LEVEL_ID} but the page selected L${selected}`);
  }

  await page.waitForFunction(
    () => window.game.playing === true && window.game._introStarted !== undefined,
    null, { timeout: 120000 });
  // Wait for the player to exist — NOT for checkpoints, and NOT for `playing`.
  //
  // `game.cps.length > 0` looks like a safe "is the level ready" signal and is
  // exactly wrong here. A film is staged on its own map, and a stage map declares
  // `route: []`; `_buildRouteCheckpoints` early-returns for a stage build. So
  // checkpoints only appear AFTER the film ends and the playable map is swapped
  // back — waiting on them blocks for the whole 81-second prologue and then
  // reports that the prologue never ran.
  //
  // `game.playing` is worse, because it fails in the opposite direction: a film
  // sets `playing = false` for its entire duration (cutscene.js start()), so
  // `playing === true` is only true AGAIN when the film ends. "Wait until playing,
  // then ask whether the film ran" waits out the film and then answers no.
  //
  // Between them these two predicates produced three consecutive false reports of
  // "the prologue never ran" for a film that plays for 81 seconds. Wait only for
  // the player, and observe the film from before it starts.
  await page.waitForFunction(() => window.game.player, null, { timeout: 60000 });
  note(`level built — L${selected}, player present`);

  // ── let the cutscene play out. No skip. ───────────────────────────────────
  const filmState = await page.evaluate(() => ({
    started: !!window.game._introStarted,
    hasPrologue: !!(window.Cutscene && window.Cutscene.hasPrologue && window.Cutscene.hasPrologue()),
  }));
  note(`prologue expected: hasPrologue=${filmState.hasPrologue}`);

  if (filmState.hasPrologue) {
    // Wait for the film to start and then finish, judged by the in-page recorder
    // rather than by cross-process polling.
    note('prologue expected — waiting for it to run');
    const deadline = Date.now() + 260000;
    let cutShot = false;
    while (Date.now() < deadline) {
      const f = await page.evaluate(() => window.__film);
      if (f.started && !cutShot) {
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(OUT, 'shots', '000-cutscene.png') });
        cutShot = true;
      }
      if (f.endedAt != null) break;
      if (!f.started && f.transitions.length && Date.now() > deadline - 230000) break;
      await page.waitForTimeout(500);
    }
    const film = await page.evaluate(() => window.__film);
    console.log('  film transitions:', JSON.stringify(film.transitions));

    if (film.started) {
      note(`cutscene ran ${(film.endedAt - film.beganAt).toFixed(1)}s (from t=${film.beganAt}s)`);
      await page.screenshot({ path: path.join(OUT, 'shots', '001-after-cutscene.png') });
      shotIdx = 2;
    } else {
      problem('error', 'PROLOGUE_NOT_SHOWN',
        'this level has a prologue but no film was ever on screen — ' +
        'begin() is reached and the film does not run',
        { film });
    }
  } else {
    note('this level has no prologue');
    problem('warn', 'NO_CUTSCENE', 'L' + LEVEL_ID + ' played without a cutscene — the film never ran',
      { filmState });
  }

  // Checkpoints only exist once the playable map is standing (see above).
  await page.waitForFunction(
    () => window.game.cps && window.game.cps.length > 0, null, { timeout: 60000 })
      .catch(() => {});
  note(`playable map standing — ${await page.evaluate(() => (window.game.cps || []).length)} checkpoints`);

  // ── hand control to the in-page autopilot ─────────────────────────────────
  //
  // It returns only when driving is over (level complete, crash screen, or the
  // caller's deadline). Everything it decided is left in window.__ap.log for the
  // report step to read back.
  note(`driving (autopilot) — budget ${TIMEOUT}s`);

  // The autopilot runs INSIDE the page on the page's own clock. Node cannot sit
  // in a `while` loop calling `page.evaluate` per tick without the decision rate
  // collapsing to whatever the IPC allows — which would test the physics against
  // a driving style no player could produce. So the controller is started here
  // WITHOUT awaiting it, and Node polls alongside it for screenshots.
  await page.evaluate(({ budget, shotEvery }) => {
    const ap = window.__ap;
    const g = window.game;
    const start = performance.now();
    let lastProgress = start;
    let lastX = g.player.position.x, lastZ = g.player.position.z;
    let lastFAttempt = -1;
    let lastShot = -1e9;
    let blockedSince = 0;
    let extracted = false;
    let extractFor = 0;

    const pos = () => g.player.position;
    const heading = () => g.player.rotation.y;
    const normalizeAngle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
    const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function walkToward(dx, dz) {
      const e = normalizeAngle(Math.atan2(dx, dz) - heading());
      ap.key('KeyW', true);
      ap.key('KeyA', e < -0.15);
      ap.key('KeyD', e > 0.15);
    }

    function redLightAhead(lookahead) {
      const fx = Math.sin(heading()), fz = Math.cos(heading());
      for (const sg of (g.sigs || [])) {
        if (!sg.state) continue;
        const dx = sg.position.x - pos().x, dz = sg.position.z - pos().z;
        const d = Math.hypot(dx, dz);
        if (d > lookahead || d < 0.01) continue;
        if ((dx * fx + dz * fz) / d < 0.5) continue;
        return { sg, d };
      }
      return null;
    }

    function obstacleAhead(lookahead) {
      const fx = Math.sin(heading()), fz = Math.cos(heading());
      let best = null;
      for (const o of (g.obstacles || [])) {
        if (!o.position) continue;
        const dx = o.position.x - pos().x, dz = o.position.z - pos().z;
        const d = Math.hypot(dx, dz);
        if (d > lookahead || d < 0.01) continue;
        if ((dx * fx + dz * fz) / d < 0.6) continue;
        if (!best || d < best.d) best = { o, d, name: o.name || (o.userData || {}).kind || 'obstacle' };
      }
      return best;
    }

    function nearestPed(lookahead) {
      let best = null;
      for (const p of (g.peds || [])) {
        if (!p.position) continue;
        const d = Math.hypot(p.position.x - pos().x, p.position.z - pos().z);
        if (d < lookahead && (!best || d < best.d)) best = { p, d };
      }
      return best;
    }

    (async () => {
      while (true) {
        const t = (performance.now() - start) / 1000;
        if (t > budget) { ap.ev({ t, e: 'BUDGET_EXHAUSTED' }); break; }

        if (g._completing || g.levelCompleted) { ap.ev({ t, e: 'LEVEL_FINISHED' }); break; }

        const cs = document.getElementById('crash-screen');
        if (cs && cs.style.display === 'flex') { ap.ev({ t, e: 'CRASH_SCREEN' }); break; }

        // A film interrupting the drive is NORMAL, not an error — release the
        // keys and wait it out, exactly as a player must.
        if (window.Cutscene && window.Cutscene.isActive()) {
          ap.releaseAll();
          ap.ev({ t, e: 'CUTSCENE_ENTERED' });
          let guard = 0;
          while (window.Cutscene.isActive() && guard++ < 2000) await sleep(16);
          ap.ev({ t: (performance.now() - start) / 1000, e: 'CUTSCENE_LEFT' });
          continue;
        }

        ap.stats.frames++;

        // ── ON FOOT: walk to the car, press F ──────────────────────────
        //
        // Press F ONLY while the enter/exit state machine is idle. Hammering it
        // every second — which an earlier version of this loop did — re-enters
        // the sequence before it can finish, so the player is put in the car and
        // straight back out again. That is not a simulation of a player; it is a
        // strobe on the animation, and it buries whatever the real bug is under a
        // flood of noise.
        if (g.isPedestrian) {
          const veh = g.playerVehicle;
          if (veh && veh.position) {
            const dx = veh.position.x - pos().x, dz = veh.position.z - pos().z;
            const d = Math.hypot(dx, dz);
            if (d < 7.5) {
              ap.releaseAll();
              if (g._enterState === 'IDLE' && t - lastFAttempt > 3) {
                lastFAttempt = t;
                ap.tap('KeyF', 110);
                ap.ev({ t, e: 'PRESS_F', d: +d.toFixed(2) });
              }
            } else {
              walkToward(dx, dz);
            }
          }
          if ((t - lastShot) >= shotEvery) { lastShot = t; ap.shotRequests++; }
          await sleep(120);
          continue;
        } else if (g._enterState !== 'IDLE') {
          // Boarding in progress — hands off, exactly as a player would.
          ap.releaseAll();
          await sleep(120);
          continue;
        }

        // ── DRIVING ────────────────────────────────────────────────────────
        const cp = (g.cps || []).find(c => !(c.userData && c.userData.hit));
        if (!cp) { ap.ev({ t, e: 'ALL_CHECKPOINTS_HIT' }); break; }

        const tx = cp.position.x - pos().x, tz = cp.position.z - pos().z;
        const dist = Math.hypot(tx, tz);
        if (dist < 3.5) {
          // Sitting on the pad but it has not registered — nudge forward.
          ap.key('KeyW', true);
          await sleep(200);
          continue;
        }

        const aim = Math.max(5, Math.min(20, dist));
        const ax = pos().x + (tx / dist) * aim, az = pos().z + (tz / dist) * aim;
        const err = normalizeAngle(Math.atan2(ax - pos().x, az - pos().z) - heading());

        let targetSpeed = clamp(14 - Math.abs(err) * 9, 2.2, 14);

        // ── EXTRACT FROM THE GARAGE ───────────────────────────────────────
        //
        // L1 spawns the car inside its garage, whose three registered walls are
        // crash-fatal. The first checkpoint sits north-east, so a controller that
        // steers toward it immediately turns into the garage's own side wall and
        // never moves. A player drives straight out of the opening first. So does
        // this — and it is worth knowing that the level's FIRST checkpoint is
        // unreachable without doing so.
        const spawn = (g.mapCfg && (g.mapCfg.playerSpawn || g.mapCfg.garageSpawn)) || null;
        if (spawn && !extracted) {
          const fromSpawn = Math.hypot(pos().x - spawn.x, pos().z - spawn.z);
          if (fromSpawn < 14 && extractFor < 9) {
            extractFor += 0.033;
            if (extractFor < 0.05) ap.ev({ t, e: 'EXTRACTING', from: +fromSpawn.toFixed(1) });
            ap.key('KeyW', true);
            ap.key('KeyS', false);
            ap.key('KeyA', false); ap.key('KeyD', false);   // straight out, no steering
            await sleep(33);
            continue;
          }
          extracted = true;
          ap.ev({ t, e: 'EXTRACTED', after: +fromSpawn.toFixed(1) });
        } else if (spawn) {
          extracted = true;
        }

        const red = redLightAhead(26);
        if (red && red.sg.state === 'red' && red.d < 20) {
          targetSpeed = Math.min(targetSpeed, Math.max(0, (red.d - 10) * 0.75));
          ap.ev({ t, e: 'RED_LIGHT', d: +red.d.toFixed(1), target: +targetSpeed.toFixed(1) });
        }

        const ped = nearestPed(12);
        if (ped) {
          targetSpeed = Math.min(targetSpeed, clamp(ped.d * 0.7, 0, 9));
          ap.ev({ t, e: 'YIELD_PED', d: +ped.d.toFixed(1) });
        }

        const ob = obstacleAhead(20);
        if (ob) {
          targetSpeed = Math.min(targetSpeed, clamp((ob.d - 5.5) * 0.55, 0, 10));
          ap.ev({ t, e: 'OBSTACLE_AHEAD', d: +ob.d.toFixed(1), name: String(ob.name) });
        }

        const spd = Math.abs(g.speed);
        ap.stats.maxSpeed = Math.max(ap.stats.maxSpeed, spd);

        // ── BOXED IN: reverse out, the way a player does ──────────────────
        //
        // L1 spawns the car INSIDE its garage, boxed in by two walls that are
        // crash-fatal obstacles. The first checkpoint is a diagonal that points
        // through one of them, so a forward-only controller immediately steers
        // into a wall and sits there at speed 0 forever. A player reverses out;
        // so does this.
        if (spd < 0.4) { blockedSince = blockedSince || performance.now(); }
        else { blockedSince = 0; }
        const blockedFor = blockedSince ? (performance.now() - blockedSince) / 1000 : 0;

        if (blockedFor > 1.5) {
          if (blockedFor < 4.5) {
            ap.key('KeyW', false);
            ap.key('KeyS', true);
            // Reverse with the steering error INVERTED: the tail goes where the
            // nose would have gone, so the same controller geometry works both ways.
            ap.key('KeyA', err > 0.06);
            ap.key('KeyD', err < -0.06);
            if (blockedFor < 1.7) {
              ap.ev({ t, e: 'REVERSING_OUT', err: +err.toFixed(2), x: +pos().x.toFixed(1), z: +pos().z.toFixed(1) });
            }
            await sleep(33);
            continue;
          }
          blockedSince = 0;
        }

        ap.key('KeyW', spd < targetSpeed - 0.35);
        ap.key('KeyS', spd > targetSpeed + 0.5);
        const steer = clamp(err * 1.7, -1, 1);
        ap.key('KeyA', steer < -0.06);
        ap.key('KeyD', steer > 0.06);

        // Stuck detector — a real player would notice, and a stuck autopilot is a
        // level bug worth reporting rather than silently retrying.
        if (Math.hypot(pos().x - lastX, pos().z - lastZ) > 0.5) {
          lastX = pos().x; lastZ = pos().z; lastProgress = performance.now();
        }
        const stuckFor = (performance.now() - lastProgress) / 1000;
        if (stuckFor > 15) {
          ap.ev({ t, e: 'STUCK', stuckFor: +stuckFor.toFixed(1), x: +pos().x.toFixed(1), z: +pos().z.toFixed(1) });
          lastProgress = performance.now();
        }

        if ((t - lastShot) >= shotEvery) { lastShot = t; ap.shotRequests++; }

        await sleep(33);
      }
      ap.releaseAll();
      ap.ev({ t: (performance.now() - start) / 1000, e: 'LOOP_END' });
    })().catch(e => { ap.ev({ t: -1, e: 'AUTOPILOT_THREW', msg: String(e && e.message), stack: String(e && e.stack || '').slice(0, 500) }); });
  }, { budget: TIMEOUT, shotEvery: SHOT_EVERY });

  // Poll alongside the controller, screenshotting when it asks for one.
  // `shotIdx` continues from the cutscene shots rather than restarting — the
  // declaration lives at the top of this file so the cutscene block can use it.
  const shotStart = Date.now();
  let shotCount = await page.evaluate(() => window.__ap.shotRequests);
  while (Date.now() - shotStart < (TIMEOUT + 30) * 1000) {
    const done = await page.evaluate(() => !!(window.game && (window.game._completing || window.game.levelCompleted)));
    const want = await page.evaluate(() => window.__ap.shotRequests);
    while (want > shotCount) {
      const name = `drive-${String(shotIdx++).padStart(3, '0')}.png`;
      try { await page.screenshot({ path: path.join(OUT, 'shots', name) }); } catch (e) { /* frame mid-teardown */ }
      shotCount++;
    }
    if (done) break;
    await page.waitForTimeout(250);
  }

  // ── collect the run's telemetry ───────────────────────────────────────────
  const run = await page.evaluate(() => {
    const g = window.game;
    return {
      apEvents: (window.__ap && window.__ap.run) || [],
      stats: window.__ap ? window.__ap.stats : null,
      shotRequests: window.__ap ? window.__ap.shotRequests : 0,
      final: g ? {
        x: +g.player.position.x.toFixed(2),
        z: +g.player.position.z.toFixed(2),
        rotY: +g.player.rotation.y.toFixed(3),
        speed: +g.speed.toFixed(3),
        hp: g.hp,
        score: g.score,
        fine: g.fine,
        vio: g.vio,
        hits: g.hits,
        cps: (g.cps || []).map(c => ({ x: +c.position.x.toFixed(1), z: +c.position.z.toFixed(1), hit: !!(c.userData && c.userData.hit) })),
        tasks: (g.tasks || []).map(t => ({ id: t.id, done: !!t.done, text: t.text })),
        obstacles: (g.obstacles || []).length,
        npcs: (g.npcs || []).length,
        peds: (g.peds || []).length,
        onRoad: typeof g._onRoad === 'boolean' ? g._onRoad : null,
      } : null,
    };
  });

  await page.screenshot({ path: path.join(OUT, 'shots', '999-final.png') });

  // ── report ────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(72));
  console.log(`RUN REPORT — L${LEVEL_ID}`);
  console.log('='.repeat(72));
  console.log(`trace:  ${path.join(OUT, 'trace.jsonl')}`);
  console.log(`shots:  ${path.join(OUT, 'shots')}  (${run.shotRequests} captured)`);

  // ── autopilot event summary ───────────────────────────────────────────────
  const evs = run.apEvents || [];
  const tally = {};
  for (const e of evs) tally[e.e] = (tally[e.e] || 0) + 1;
  console.log('\nautopilot events:');
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(5)}  ${k}`);
  }
  // Non-repeating events are the narrative of the run — print them in full.
  const story = evs.filter(e => !/^(RED_LIGHT|YIELD_PED|OBSTACLE_AHEAD|PRESS_F)$/.test(e.e));
  if (story.length) {
    console.log('\nrun timeline:');
    for (const e of story.slice(0, 40)) {
      const extra = Object.entries(e).filter(([k]) => k !== 't' && k !== 'e')
        .map(([k, v]) => `${k}=${v}`).join(' ');
      console.log(`  ${String(e.t).padStart(7)}s  ${e.e}${extra ? '  ' + extra : ''}`);
    }
  }

  // ── the two things the user asked us to look for ──────────────────────────
  //
  // 1. "Random barriers appear at various locations"
  // 2. "When a car crashes, the character moves erratically"
  //
  // Both are checked against the engine's own lists rather than against what the
  // autopilot happened to hit, so a run that got lucky does not hide them.

  const diag = await page.evaluate(() => {
    const g = window.game;
    // Where did the player actually go, and how fast did it move between
    // checkpoints? A crash that teleports the player produces a single huge
    // jump between samples.
    return {
      lastCpPos: g._lastCpPos ? { x: +g._lastCpPos.x.toFixed(2), z: +g._lastCpPos.z.toFixed(2) } : null,
      enterState: g._enterState,
      camOverride: !!g._camOverride,
      isPedestrian: !!g.isPedestrian,
      hp: g.hp,
      retries: g.retries,
      hitEvents: g.hits,
      // Everything crash-fatal, with the footprint the engine actually uses.
      fatalObstacles: (g.obstacles || []).filter(o => o.userData && o.userData.isObstacle)
        .map(o => ({
          x: +o.position.x.toFixed(1), z: +o.position.z.toFixed(1),
          halfW: o.userData.halfW, halfD: o.userData.halfD,
          isVehicle: !!o.userData.isVehicle, parked: !!o.userData.parked,
          name: o.name || '',
        })),
    };
  });

  // Erratic-movement heuristic: if the engine left the camera override on, or the
  // enter state machine is mid-transition long after the run, the character is
  // still being animated by a sequence that never completed. That is what
  // "moves erratically" looks like from the outside.
  if (diag.camOverride) {
    problem('error', 'CAM_OVERRIDE_STUCK',
      'camera override is still active after the run — the enter/exit animation never completed, which is what makes a character wander after a crash',
      { enterState: diag.enterState });
  }
  if (diag.enterState && diag.enterState !== 'IDLE') {
    problem('warn', 'ENTER_STATE_STRANDED',
      `enter/exit state machine stranded in '${diag.enterState}' rather than returning to IDLE`,
      { enterState: diag.enterState });
  }

  // Every crash-fatal obstacle, listed, so "random barriers" can be eyeballed
  // against the route rather than discovered one crash at a time.
  console.log(`\ncrash-fatal obstacles on the map: ${diag.fatalObstacles.length}`);
  for (const o of diag.fatalObstacles) {
    console.log(`  (${o.x}, ${o.z})  halfW=${o.halfW} halfD=${o.halfD}${o.parked ? '  [parked]' : ''}`);
  }

  const f = run.final || {};
  console.log(`\nfinal position (${f.x}, ${f.z})  rotY ${f.rotY}  speed ${f.speed}`);
  console.log(`checkpoints ${f.hits}/${(f.cps || []).length}   hp ${f.hp}  score ${f.score}  fine ₹${f.fine}  violations ${f.vio}`);
  console.log(`world: ${f.obstacles} obstacles, ${f.npcs} npcs, ${f.peds} pedestrians`);

  if ((f.tasks || []).length) {
    console.log('\ntasks:');
    for (const t of f.tasks) console.log(`  ${t.done ? '[x]' : '[ ]'} ${t.id} — ${t.text}`);
    const undone = f.tasks.filter(t => !t.done);
    if (undone.length) {
      problem('error', 'TASKS_INCOMPLETE',
        `${undone.length} objective(s) never completed: ${undone.map(t => t.id).join(', ')}`);
    }
  }

  if ((f.cps || []).some(c => !c.hit)) {
    problem('error', 'CP_MISSED',
      'checkpoints not reached: ' + f.cps.filter(c => !c.hit).map(c => `(${c.x},${c.z})`).join(' '));
  }

// Static check: does any crash-fatal obstacle sit ON the driving line?
  // This is the "random barriers appear at various locations" class of bug, and it
  // is cheaper to find here than to discover it as a crash three minutes in.
  //
  // BUILDINGS ARE EXCLUDED, and that exclusion is the whole reason the first
  // version of this check was useless. A 20m arterial has buildings within 5m of
  // its centreline by construction - they ARE the street. Flagging them reported
  // a shop on Linking Road sitting "8.51m off" the route: correct, and useless.
  // What matters is street FURNITURE - barricades, parked vehicles, planters -
  // things small enough that the road could have been routed around them and
  // was not.
  const SMALL_OBSTACLE_MAX = 6;   // metres; anything larger is a building

  const onRoute = await page.evaluate((maxSmall) => {
    const g = window.game;
    const cps = (g.cps || []).map(c => ({ x: c.position.x, z: c.position.z }));
    if (cps.length < 2) return { furniture: [], buildings: 0 };
    const seg = (ax, az, bx, bz, px, pz) => {
      const vx = bx - ax, vz = bz - az;
      const wx = px - ax, wz = pz - az;
      const L2 = vx * vx + vz * vz;
      const t = L2 > 0 ? (wx * vx + wz * vz) / L2 : 0;
      const cx = ax + vx * Math.max(0, Math.min(1, t)), cz = az + vz * Math.max(0, Math.min(1, t));
      return Math.hypot(px - cx, pz - cz);
    };
    const furniture = [];
    let buildings = 0;
    for (const o of (g.obstacles || [])) {
      const ud = o.userData || {};
      if (!o.position || ud.isObstacle !== true) continue;
      const radius = Math.max(ud.halfW || 1, ud.halfD || 1);
      if (radius > maxSmall) { buildings++; continue; }
      for (let i = 0; i < cps.length - 1; i++) {
        const d = seg(cps[i].x, cps[i].z, cps[i + 1].x, cps[i + 1].z, o.position.x, o.position.z);
        if (d < radius + 1.2) {
          furniture.push({
            x: +o.position.x.toFixed(1), z: +o.position.z.toFixed(1),
            distToRoute: +d.toFixed(2), radius: +radius.toFixed(2),
            seg: i + '->' + (i + 1),
            name: o.name || ud.kind || (ud.parked ? 'parked vehicle' : 'obstacle'),
          });
          break;
        }
      }
    }
    return { furniture, buildings };
  }, SMALL_OBSTACLE_MAX);

  if (onRoute.furniture.length) {
    problem('error', 'OBSTACLE_ON_ROUTE',
      onRoute.furniture.length + ' crash-fatal street-furniture item(s) sit on the driving line: ' +
      onRoute.furniture.map(o => o.name + '@(' + o.x + ',' + o.z + ') ' + o.distToRoute + 'm off seg ' + o.seg).join('; '),
      { furniture: onRoute.furniture });
  } else {
    console.log('\nno crash-fatal street furniture on the checkpoint path (' +
      onRoute.buildings + ' buildings excluded as legitimate frontage)');
  }

  if (pageErrors.length) {
    problem('error', 'JS_ERROR', `${pageErrors.length} uncaught JS error(s) during the run`,
      { errors: pageErrors.slice(0, 5) });
  }

  const errs = problems.filter(p => p.severity === 'error');
  const warns = problems.filter(p => p.severity === 'warn');
  console.log(`\n${errs.length} error(s), ${warns.length} warning(s)`);
  if (!errs.length) console.log('run completed with no error-class problems');

  trace.end();
  await browser.close();
  if (server) { server.close(); }
  process.exit(errs.length ? 1 : 0);
})().catch(e => {
  console.error('HARNESS ERROR:', e);
  if (server) { try { server.close(); } catch (e2) {} }
  process.exit(2);
});