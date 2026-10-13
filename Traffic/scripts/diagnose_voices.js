// diagnose_voices.js — WHY is there no Sarvam voice, asked of the actual runtime.
//
// WHY THIS EXISTS AND WHY THE EARLIER CHECKS MISSED IT
//
//   verify_voices.js proves the MANIFEST is reachable, the files decode, and every
//   spoken line has a recording. All three passed while the film was still mute.
//   Every one of those checks is about data. None of them is about the CALL: the
//   thing that has to happen is `say()` → `playRenderedVoice()` → an mp3 actually
//   starting, for the specific (speaker, line) pairs the film really speaks.
//
//   Two failures look identical from the outside and have nothing in common:
//     · the shot never calls say() at all        (no subtitle block on the shot)
//     · say() calls it and the lookup misses     (key mismatch, silent fallthrough)
//
//   So this instruments the real call site and records which of the two happened,
//   per line, with the speaker and the exact key. It does not infer from the
//   manifest and it does not re-implement the lookup.
//
// WHAT IT DOES NOT CLAIM
//   That anything is audible. Headless has no audio device. What is recorded is
//   whether an HTMLAudioElement for the right file was created and its play()
//   accepted — which is the last thing that can be checked without ears.
//
// Usage: node scripts/diagnose_voices.js [port]

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '5336';
const ROOT = path.resolve(__dirname, '..');

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
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const consoleLines = [];
  page.on('console', m => consoleLines.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => consoleLines.push('PAGEERROR: ' + String(e.message || e)));

  await page.goto(`http://127.0.0.1:${PORT}/Driving.html?level=1&mode=car`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.StoryAudio && window.StoryAudio.hasRenderedVoices,
    null, { timeout: 60000 }).catch(() => {});
  await page.evaluate(() => window.StoryAudio.preloadVoices(() => {}));

  // Observe the NETWORK, not a wrapper.
  //
  // The first version of this wrapped `StoryAudio.say` and recorded zero calls —
  // and reported "the film never calls say()". That conclusion was wrong, and the
  // reason is worth recording: `applyShot` calls the MODULE-PRIVATE `say()`, not
  // the copy exported on the StoryAudio object. Wrapping the export replaces a
  // function nothing in the film uses, so the wrapper is never entered and reports
  // silence for a film that is speaking.
  //
  // A network observer has no such blind spot: it cannot be bypassed by call graph
  // or by closure scope. If an mp3 is fetched, it was fetched.
  await page.evaluate(() => {
    window.__diag = { mp3Seen: [], shots: [], manifest: null };
    fetch('story/voices/manifest.json').then(r => r.json()).then(j => { window.__diag.manifest = j; });

    // Record every mp3 the browser requests, for the whole film.
    try {
      const po = PerformanceObserver;
      if (po && po.supportedEntryTypes && po.supportedEntryTypes.indexOf('resource') >= 0) {
        new po(list => {
          list.getEntries().forEach(e => {
            if (/\.mp3($|\?)/.test(e.name)) {
              window.__diag.mp3Seen.push(e.name.split('/').slice(-2).join('/'));
            }
          });
        }).observe({ entryTypes: ['resource'] });
      }
    } catch (e) {}

    // Sample which shot is on screen and whether it CARRIES a subtitle. This is
    // the half of the question that a network observer cannot answer: a film can
    // fetch no mp3 either because nothing spoke, or because every lookup missed.
    const iv = setInterval(() => {
      if (!(window.Cutscene && window.Cutscene.isActive())) return;
      const st = window.Cutscene.state ? window.Cutscene.state() : null;
      if (!st) return;
      const script = window.Cutscene.script || [];
      const shot = script[st.idx];
      if (!shot) return;
      window.__diag.shots.push({
        idx: st.idx,
        aftermath: st.aftermath,
        hasSub: !!(shot && shot.sub),
        speaker: (shot && shot.sub && shot.sub.speaker) || null,
        line: String((shot && shot.sub && shot.sub.line) || '').slice(0, 60),
        audioSaysFalse: !!(shot && shot.audio && shot.audio.say === false),
      });
    }, 250);
    window.__diagStop = () => clearInterval(iv);
  });

  // Wait for START, then run to END.
  const t0 = Date.now();
  let began = false;
  while (Date.now() - t0 < 200000) {
    if (await page.evaluate(() => !!(window.Cutscene && window.Cutscene.isActive()))) { began = true; break; }
    await page.waitForTimeout(300);
  }
  if (began) {
    await page.waitForFunction(() => !window.Cutscene.isActive(), null, { timeout: 220000 }).catch(() => {});
  }

  const d = await page.evaluate(() => { try { window.__diagStop(); } catch (e) {} return window.__diag; });
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'story', 'voices', 'manifest.json'), 'utf8'));

  // De-duplicate the per-shot samples: 4 samples a second of a 13-second shot is
  // 52 rows saying the same thing, and the summary below is what matters.
  const uniqShots = [];
  const seenShot = new Set();
  d.shots.forEach(s => {
    const k = s.idx + '|' + s.speaker + '|' + s.line;
    if (seenShot.has(k)) return;
    seenShot.add(k);
    uniqShots.push(s);
  });

  const withSub = uniqShots.filter(s => s.hasSub && s.speaker);
  const resolvable = withSub.filter(s => {
    const strip = t => String(t).replace(/^\s*["“”']+/, '').replace(/["“”']+\s*$/, '').trim();
    const key = s.speaker + '||' + strip(s.line);
    return !!manifest[key];
  });

  console.log('\n=== FILM STARTED: ' + began + ' ===');
  console.log('manifest entries on disk                  : ' + Object.keys(manifest).length);
  console.log('distinct shots sampled                    : ' + uniqShots.length);
  console.log('shots that CARRY a subtitle               : ' + withSub.length + ' / ' + uniqShots.length);
  console.log('  of those, key resolves in the manifest  : ' + resolvable.length + ' / ' + withSub.length);
  console.log('mp3 files the browser ACTUALLY fetched    : ' + d.mp3Seen.length);

  console.log('\n--- per-shot subtitle audit ---');
  if (!uniqShots.length) console.log('  (no shots observed)');
  uniqShots.forEach(s => {
    if (!s.hasSub) { console.log(`  shot ${s.idx}: NO SUBTITLE BLOCK`); return; }
    if (!s.speaker) { console.log(`  shot ${s.idx}: sub present but no speaker`); return; }
    const strip = t => String(t).replace(/^\s*["“”']+/, '').replace(/["“”']+\s*$/, '').trim();
    const key = s.speaker + '||' + strip(s.line);
    const ok = !!manifest[key];
    console.log(`  shot ${s.idx} [${ok ? 'HIT ' : 'MISS'}] ${s.speaker} :: ${strip(s.line).slice(0, 56)}`);
    if (!ok) console.log(`         looked up: ${key.slice(0, 100)}`);
  });

  if (d.mp3Seen.length) {
    console.log('\n--- mp3 files the browser requested ---');
    Array.from(new Set(d.mp3Seen)).forEach(n => console.log('  ' + n));
  }

  console.log('\n=== VERDICT ===');
  if (!withSub.length) {
    console.log('  NO SHOT CARRIES A SUBTITLE BLOCK.');
    console.log('  applyShot() only calls say() when shot.sub && shot.sub.line exist.');
    console.log('  The film is silent because the script has nothing to speak — not');
    console.log('  because the voices are missing. The mp3s are fine and unused.');
  } else if (!resolvable.length) {
    console.log('  Subtitles EXIST but every key misses the manifest.');
    console.log('  A speaker name or a line differs from what was rendered.');
  } else if (!d.mp3Seen.length) {
    console.log('  Keys HIT the manifest, yet no mp3 was ever requested.');
    console.log('  playRenderedVoice() is returning before it builds the Audio element.');
  } else {
    console.log(`  ${resolvable.length}/${withSub.length} subtitles resolve to a recording and`);
    console.log(`  the browser fetched ${new Set(d.mp3Seen).size} distinct mp3 file(s).`);
  }

  if (consoleLines.length) {
    console.log('\n--- browser console (last 12) ---');
    consoleLines.slice(-12).forEach(l => console.log('  ' + l));
  }

  await browser.close();
  server.close();
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });