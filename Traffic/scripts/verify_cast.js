// verify_cast.js — proves the film's ACTORS are on screen, rigged, animated, and
// only in the shots they belong in.
//
// WHAT IS BEING CLAIMED
//   1. Arjun and Mrs. Iyer are built (the campaign declares them; before this they
//      did not exist in the film at all).
//   2. Both are RIGGED — a live AnimationMixer — not the static mini-characters,
//      and not a random model re-rolled per load.
//   3. Both are HIDDEN in the pre-shooting shots and VISIBLE in the aftermath.
//      Claim 3 is the one that actually matters: two characters standing in the
//      junction during shots 1-7 would tell the audience the case was already open,
//      which destroys the meaning of the aftermath the entire film is built toward.
//   4. Neither is standing in a traffic lane. Linking Road is x=0 width 20, so the
//      carriageway is -10..+10; an actor inside that band is in live traffic.
//
// WHAT IS NOT CLAIMED
//   That they look right, or that the pacing survived. Adding two speaking
//   characters changes the film's words-per-minute and silence map, and that has
//   to be re-measured with scripts/analyze_film.py — not eyeballed, and not
//   assumed to be unchanged because the shots themselves were not edited.
//
// Usage: node scripts/verify_cast.js [port]

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '5335';
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
    '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg',
  };
  return new Promise(r => {
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
    srv.listen(PORT, '127.0.0.1', () => r(srv));
  });
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));

  await page.goto(`http://127.0.0.1:${PORT}/Driving.html?level=1&mode=car`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.Cutscene && window.game && window.Story,
    null, { timeout: 60000 }).catch(() => {});

  // ── 1. The campaign DECLARES the actors. Cheap, and it is the claim that was
  //       false until this change.
  const declared = await page.evaluate(() => {
    const S = (window.STORY && window.STORY[1]) || null;
    if (!S || !S.cast) return null;
    return S.cast.map(c => ({
      id: c.id, kind: c.kind || 'vehicle',
      x: c.x, z: c.z, aftermath: !!c.aftermath,
    }));
  });
  check(!!declared, 'the campaign declares a cast', declared ? `${declared.length} entries` : '');
  const humanIds = (declared || []).filter(c => c.kind !== 'vehicle').map(c => c.id);
  check(humanIds.includes('arjun'), 'arjun is declared', humanIds.join(', '));
  check(humanIds.includes('iyer'), 'iyer is declared', humanIds.join(', '));
  check((declared || []).filter(c => c.aftermath).length === 2,
    'both are flagged aftermath-only');

  // ── 2. Placement: nobody inside the carriageway.
  //    Linking Road: x=0, width 20 → live traffic is -10..+10.
  for (const id of ['arjun', 'iyer']) {
    const c = (declared || []).find(x => x.id === id);
    if (!c) continue;
    check(Math.abs(c.x) > 10,
      `${id} is off the carriageway (|x| > 10)`,
      `x=${c.x}`);
  }

  // ── 3. They BUILT, are RIGGED, and are gated by shot.
  //
  // Sampled MID-FILM by an in-page interval. Waiting only on
  // `!Cutscene.isActive()` returns instantly at load — the film has not begun —
  // and then reports an empty world, which is a true observation of the wrong
  // moment. The film has a beginning and an end and most predicates fire at the
  // wrong one.
  const t0 = Date.now();
  let began = false;
  while (Date.now() - t0 < 200000) {
    if (await page.evaluate(() => !!(window.Cutscene && window.Cutscene.isActive()))) { began = true; break; }
    await page.waitForTimeout(300);
  }
  check(began, 'the film started');

  const s = await page.evaluate(async () => {
    const out = {
      shots: 0, preShots: 0, postShots: 0,
      seen: {}, visibleWhenItShouldBe: {}, rigged: {}, mixers: {}, actions: {},
      anyVisiblePre: false, anyVisiblePost: false,
      shotIdx: {},
    };
    const want = ['arjun', 'iyer'];
    return await new Promise((resolve) => {
      const iv = setInterval(() => {
        if (!(window.Cutscene && window.Cutscene.isActive())) return;
        // Ask the film which shot it is on. Reading a private field off the
        // module was the previous approach and it silently produced
        // `undefined` for both the script and the index, so every sample was
        // classified as neither pre- nor post-aftermath and both actor checks
        // passed vacuously — the sampler was watching the film and learning
        // nothing from it.
        const st = window.Cutscene.state ? window.Cutscene.state() : null;
        if (!st) return;
        out.shots++;
        out.shotIdx[st.idx + (st.aftermath ? ':after' : ':pre')] = true;
        const isAfter = st.aftermath;
        if (isAfter) out.postShots++; else out.preShots++;
        window.game.scene.traverse(n => {
          const ud = n.userData || {};
          if (!ud.isCast || !ud.aftermathOnly) return;
          if (want.indexOf(ud.castId) < 0) return;
          out.seen[ud.castId] = true;
          if (n.visible) {
            if (isAfter) out.anyVisiblePost = true;
            else out.anyVisiblePre = true;
            out.visibleWhenItShouldBe[ud.castId] = (out.visibleWhenItShouldBe[ud.castId] || 0) + 1;
            // Is it rigged? Walk down to the rig group, which carries the mixer.
            let rig = null;
            n.traverse(c => { if (!rig && c.userData && c.userData.isKayKit) rig = c; });
            if (!rig) n.traverse(c => { if (!rig && c.userData && c.userData.mixer) rig = c; });
            if (rig) {
              out.rigged[ud.castId] = true;
              if (rig.userData.mixer) {
                out.mixers[ud.castId] = true;
                const a = rig.userData.idleAction || rig.userData._idleAction;
                if (a && a._clip) {
                  out.actions[ud.castId] = a._clip.name;
                  // Drive the mixer once and confirm the clip is actually moving.
                  const before = a.time;
                  rig.userData.mixer.update(0.4);
                  out.actions[ud.castId + '_advances'] = (a.time !== before);
                }
              }
            }
          }
        });
      }, 250);
      window.__castDone = () => { clearInterval(iv); resolve(out); };
      // Stop when the film ends.
      const poll = setInterval(() => {
        if (!(window.Cutscene && window.Cutscene.isActive())) {
          clearInterval(poll);
          clearTimeout(window.__castTimer);
          window.__castDone();
        }
      }, 250);
      window.__castTimer = setTimeout(() => {
        clearInterval(poll); window.__castDone();
      }, 200000);
    });
  });

  check(s.shots > 0, 'the sampler observed the film', `${s.shots} mid-film samples`);
  check(s.preShots > 0, 'observed at least one PRE-aftermath shot',
    `${s.preShots} samples — saw ${Object.keys(s.shotIdx).join(' ')}`);
  check(s.postShots > 0, 'observed at least one AFTERMATH shot',
    `${s.postShots} samples — saw ${Object.keys(s.shotIdx).join(' ')}`);
  check(!!s.seen.arjun, 'arjun was in the scene');
  check(!!s.seen.iyer, 'iyer was in the scene');
  check(s.anyVisiblePre === false,
    'NEITHER actor is visible before the shooting',
    s.anyVisiblePre ? 'LEAKED into a pre-aftermath shot' : '');
  check(s.anyVisiblePost === true, 'they ARE visible in the aftermath');
  check(!!s.rigged.arjun && !!s.rigged.iyer, 'both are rigged characters',
    `arjun=${!!s.rigged.arjun} iyer=${!!s.rigged.iyer}`);
  check(!!s.mixers.arjun && !!s.mixers.iyer, 'both have a live AnimationMixer',
    `arjun=${!!s.mixers.arjun} iyer=${!!s.mixers.iyer}`);
  check(!!s.actions.arjun && !!s.actions.iyer,
    'both are bound to a named idle clip',
    `arjun=${s.actions.arjun || '-'} iyer=${s.actions.iyer || '-'}`);
  check(s.actions.arjun_advances === true && s.actions.iyer_advances === true,
    'their animation time advances');

  check(errs.length === 0, 'no uncaught page errors', errs.slice(0, 3).join(' | '));

  console.log('\n' + (fails ? `${fails} FAILURE(S)` : 'film actors verified: built, rigged, animated, correctly gated'));
  console.log('  NOTE: pacing has NOT been re-measured. Run scripts/analyze_film.py —');
  console.log('        two speaking characters change wpm and the silence map.');
  await browser.close();
  server.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });