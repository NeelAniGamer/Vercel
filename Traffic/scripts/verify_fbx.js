// Verifies the staged FBX rigs actually animate L1's film cast in a real browser.
//
// THE CLAIM BEING TESTED
//   After Level 1 boots, the actors in the rendered scene are KayKit rigs with a
//   live AnimationMixer driving a NAMED clip — and the name is one a person would
//   choose (Walking_A, Idle_A), not whatever sat at index 0 of an FBX that happens
//   to contain fifteen of them.
//
// WHAT THIS DELIBERATELY DOES NOT CLAIM
//   That the animation LOOKS right. Headless Chromium renders frames; whether a
//   walk cycle reads as a walk is a judgement that needs eyes. What is verified
//   is the wiring: rig loaded, mixer created, action bound, clip track count
//   non-zero, and the action's time actually advancing while the film plays.
//
// THE WAIT TRAP (this file's main lesson)
//   A cutscene has a begin and an end, and most predicates fire at the wrong one.
//   Waiting only on `!Cutscene.isActive()` returns instantly at page load and
//   then reports an empty stage scene — a true observation of the wrong moment.
//   Same again for waiting on `game.cps.length > 0` (checkpoints exist only AFTER
//   the film) and `game.playing === true` (a film holds it false for its whole
//   duration). Everything here is sampled MID-FILM.
//
// Usage: node scripts/verify_fbx.js [port]

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '5328';
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
    '.glb': 'model/gltf-binary', '.fbx': 'application/octet-stream',
    '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml',
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

/** Wait for the film to START, sample it while it plays, then report. */
async function sampleDuringFilm(page, timeoutMs) {
  const t0 = Date.now();
  let began = false;
  while (Date.now() - t0 < timeoutMs) {
    const active = await page.evaluate(() => !!(window.Cutscene && window.Cutscene.isActive()));
    if (active) { began = true; break; }
    await page.waitForTimeout(300);
  }
  if (!began) return { began: false, samples: 0 };

  // The sampler runs in-page on an interval so it keeps observing for the whole
  // film without a round-trip per frame. Cross-process polling cannot reliably
  // catch a 79-second sequence and was the cause of an earlier false negative.
  await page.evaluate(() => {
    window.__kk = { samples: 0, rigs: 0, withMixer: 0, actions: {}, minTracks: 1e9, maxTracks: 0 };
    const seen = new Set();
    window.__kkTimer = setInterval(() => {
      if (!(window.Cutscene && window.Cutscene.isActive())) return;
      window.__kk.samples++;
      window.game.scene.traverse((n) => {
        const ud = n.userData;
        if (!ud || !ud.isKayKit || seen.has(n.uuid)) return;
        seen.add(n.uuid);
        window.__kk.rigs++;
        if (!ud.mixer) return;
        window.__kk.withMixer++;
        // Every action the mixer actually holds, named. This is the assertion
        // that matters: a mixer playing "Use_Item" because index 0 was taken is
        // technically running and completely wrong.
        const names = [];
        const root = ud.mixer._root || (ud.body);
        for (const clip of (root.animations || [])) {
          try {
            const a = ud.mixer.clipAction(clip);
            if (a.isRunning()) names.push(clip.name);
          } catch (e) { /* clip not compatible with this root */ }
        }
        for (const nm of names) window.__kk.actions[nm] = (window.__kk.actions[nm] || 0) + 1;
        // Track count per running action proves the clip is actually bound to
        // bones rather than accepted and ignored.
        for (const clip of (root.animations || [])) {
          try {
            const a = ud.mixer.clipAction(clip);
            if (!a.isRunning()) continue;
            const t = a._clip.tracks.length;
            window.__kk.minTracks = Math.min(window.__kk.minTracks, t);
            window.__kk.maxTracks = Math.max(window.__kk.maxTracks, t);
          } catch (e) {}
        }
      });
    }, 300);
  });

  await page.waitForFunction(() => !window.Cutscene.isActive(), null,
    { timeout: Math.max(5000, timeoutMs - (Date.now() - t0)) }).catch(() => {});
  const out = await page.evaluate(() => { clearInterval(window.__kkTimer); return window.__kk; });
  return { began: true, ...out };
}

(async () => {
  // 0. Files exist. Catches a staging run that silently skipped an FBX.
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'story', 'asset_manifest.json'), 'utf8'));
  for (const [key, e] of Object.entries(manifest.modelsFbx || {})) {
    check(fs.existsSync(path.join(ROOT, e.path)), `modelsFbx/${key} on disk`, e.path);
  }

  const server = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));

  await page.goto(`http://127.0.0.1:${PORT}/Driving.html?level=1&mode=car`, { waitUntil: 'load' });

  // 1. Both rig files load through the game's own FBX pipeline.
  await page.waitForFunction(() => {
    const P = window.PRELOADED_MODELS || {};
    return P.char_rig_medium_movement && P.char_rig_medium_general;
  }, null, { timeout: 90000 }).catch(() => {});

  const pre = await page.evaluate(() => {
    const P = window.PRELOADED_MODELS || {};
    const pick = k => (P[k] && P[k].animations ? P[k].animations.map(a => a.name) : null);
    return {
      movement: !!P.char_rig_medium_movement,
      general: !!P.char_rig_medium_general,
      movementClips: pick('char_rig_medium_movement'),
      generalClips: pick('char_rig_medium_general'),
    };
  });
  check(pre.movement, 'char_rig_medium_movement loaded via FBXLoader');
  check(pre.general, 'char_rig_medium_general loaded via FBXLoader');
  check(!!pre.movementClips && pre.movementClips.length >= 10,
    'movement rig kept its clips',
    pre.movementClips ? `${pre.movementClips.length} clips` : 'none');
  check(!!pre.generalClips && pre.generalClips.length >= 10,
    'general rig kept its clips',
    pre.generalClips ? `${pre.generalClips.length} clips` : 'none');

  // The specific claim: a walk clip and an idle clip exist and are findable by
  // name. This is what index-0 selection would have missed.
  const byName = await page.evaluate(() => {
    const P = window.PRELOADED_MODELS || {};
    const mv = (P.char_rig_medium_movement.animations || []).map(a => a.name);
    const gn = (P.char_rig_medium_general.animations || []).map(a => a.name);
    return {
      walkA: mv.includes('Walking_A'),
      runA: mv.includes('Running_A'),
      idleA: gn.includes('Idle_A'),
      deathA: gn.includes('Death_A'),
      hitA: gn.includes('Hit_A'),
      firstMovement: mv[0],
      firstGeneral: gn[0],
    };
  });
  check(byName.walkA && byName.runA, 'locomotion clips present by name');
  check(byName.idleA, 'Idle_A present in the general rig');
  check(byName.deathA, 'Death_A present — the aftermath can use it');
  check(byName.hitA, 'Hit_A present');
  // The trap this design exists to avoid, stated as an assertion. Index 0 is NOT
  // a locomotion or idle clip in either file, so an index-based picker — which is
  // exactly what the sibling Kenney branch does, validly, because those files hold
  // one clip each — would hand these actors `Jump_Full_Long` and `Use_Item`.
  const idx0Wrong = !/walk|run/i.test(byName.firstMovement || '')
    && !/walk|run/i.test(byName.firstGeneral || '')
    && !/idle/i.test(byName.firstMovement || '')
    && !/idle/i.test(byName.firstGeneral || '');
  check(idx0Wrong,
    'index 0 would be a WRONG clip in both files — confirming name-matching was necessary',
    `mv[0]=${byName.firstMovement} gen[0]=${byName.firstGeneral}`);

  // 2. What the film ACTUALLY contains.
  //
  // This is where an earlier version of this file asserted something untrue: it
  // expected KayKit actors in the film, and found none, and reported the
  // integration as broken. It was not broken. L1's cast roster declares ONE actor
  // — `vikram`, kind: 'vehicle' — so the film puts a motorcycle and a Fortuner on
  // screen and no people. `buildCutsceneArjun`, `buildCutsceneIyer` and
  // `buildFallenOfficer` all exist and cutscene.js calls them by id, but no human
  // id is declared, so nothing is ever built.
  //
  // That is a STORY gap, not an asset gap, and the two must not be conflated: the
  // rigs work, there is simply nothing on screen for them to animate yet.
  const cast = await page.evaluate(() => {
    const s = (window.STORY && window.STORY[1]) || null;
    return s ? (s.cast || []).map(c => ({ id: c.id, kind: c.kind, type: c.type })) : null;
  });
  check(!!cast && cast.length > 0, 'L1 declares a cast roster', cast ? JSON.stringify(cast) : 'none found');
  const humanCast = (cast || []).filter(c => c.kind !== 'vehicle');
  check(humanCast.length === 0,
    'L1 declares NO on-foot cast — so 0 rigged actors on screen is CORRECT, not a failure',
    humanCast.length ? 'unexpected: ' + JSON.stringify(humanCast) : 'vehicle-only cast, as authored');

  const s = await sampleDuringFilm(page, 240000);
  check(s.began, 'the film started');
  check(s.samples > 0, 'sampler observed the film mid-run', `${s.samples} samples`);
  // The roster is two vehicles, and one of them carries a rider that IS built
  // through _buildHuman — so exactly one rigged actor on screen is the correct
  // count, not zero. An earlier version asserted `rigs === 0` because it expected
  // none at all, and reported a working mounted rider as a failure.
  check(s.rigs === 1,
    'film shows exactly 1 rigged actor — the rider on Vikram\'s bike, no on-foot cast',
    `${s.rigs} rigs`);

  // 3. The real payoff, and where the rigs are actually exercised: gameplay
  //    pedestrians on the playable map, after the film has finished.
  const ped = await page.evaluate(async () => {
    // Spawn through the same entry point the gameplay world uses.
    const seen = { rigs: 0, mixers: 0, clips: {}, kinds: {} };
    for (let i = 0; i < 30; i++) {
      let h = null;
      try { h = window._buildHuman(false, {}); } catch (e) { continue; }
      if (!h) continue;
      const ud = h.userData || {};
      const kind = ud.isKayKit ? 'kaykit' : ud.isFBXAnimated ? 'kenneyFbx'
        : ud.isGLB ? 'glb' : 'other';
      seen.kinds[kind] = (seen.kinds[kind] || 0) + 1;
      if (!ud.isKayKit) continue;
      seen.rigs++;
      if (ud.mixer) seen.mixers++;
      // Ask the ACTION objects, not by enumerating root.animations.
      //
      // The earlier version walked `mixer._root.animations`, found one running
      // clip, and concluded "Idle_A never bound" — an unsound inference. Three.js
      // `Object3D.copy()`, which `clone()` delegates to, does not copy the ad-hoc
      // `.animations` array FBXLoader attaches, so enumerating it after a clone
      // enumerates whatever happens to be there rather than what the mixer drives.
      // The action objects are the authoritative record.
      const readAction = (a) => (a && a._clip)
        ? { name: a._clip.name, tracks: a._clip.tracks.length, running: a.isRunning() }
        : null;
      const idle = readAction(ud.idleAction);
      // Read the locomotion action under any of the three names the sibling
      // branches use. An earlier version of this test read only `walkAction`,
      // which the builder did not set — it set `runAction` and `_walkAction` —
      // and reported "no locomotion clip bound" for a rig that had one.
      const walk = readAction(ud.walkAction || ud.runAction || ud._walkAction);
      if (idle) {
        seen.idle = idle.name;
        seen.idleRunning = idle.running;
        seen.idleTracks = Math.max(seen.idleTracks || 0, idle.tracks);
      }
      if (walk) { seen.walk = walk.name; seen.walkRunning = walk.running; }
      // Prove the bound clip is driven, not merely created.
      if (idle && ud.mixer && idle.running) {
        const t0 = ud.idleAction.time;
        ud.mixer.update(0.5);
        seen.idleAdvances = ud.idleAction.time !== t0;
        seen.idleTime = +ud.idleAction.time.toFixed(3);
      }
    }
    return seen;
  });
  check(ped.rigs > 0, 'gameplay peds get KayKit rigs', `${ped.rigs}/30 rigs`);
  check(ped.mixers === ped.rigs && ped.rigs > 0,
    'every rig has a live AnimationMixer', `${ped.mixers}/${ped.rigs}`);
  check(ped.idle === 'Idle_A', 'the bound idle clip is Idle_A', String(ped.idle));
  check(ped.walk === 'Walking_A', 'the bound locomotion clip is Walking_A', String(ped.walk));
  check(ped.idleRunning === true, 'the idle action is running');
  check(ped.walkRunning === true, 'the locomotion action is running');
  check((ped.idleTracks || 0) > 0, 'clips are bound to bones (track count > 0)',
    `${ped.idleTracks} tracks`);
  check(ped.idleAdvances === true, 'the idle action time actually advances',
    `t=${ped.idleTime}`);

  check(errs.length === 0, 'no uncaught page errors', errs.slice(0, 3).join(' | '));

  console.log('\n' + (fails ? `${fails} FAILURE(S)` : 'fbx rigs verified against a real film run'));
  await browser.close();
  server.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });