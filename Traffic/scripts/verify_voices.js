// verify_voices.js — proves the pre-rendered Sarvam audio actually reaches the game.
//
// THE THREE THINGS THAT CAN BE WRONG, IN ORDER OF HOW EXPENSIVE THEY ARE TO FIND
//
//   1. The manifest is missing or unparseable. Cheap to check, and the symptom is
//      silent: StoryAudio falls back to speechSynthesis and the film plays, so
//      nothing looks broken. This is the failure that hides.
//
//   2. The manifest loads but a path does not resolve. `voiceKey()` is a composite
//      of `speaker || line`, so editing one character of a subtitle orphans its
//      mp3 and that ONE line silently reverts to the browser voice mid-film.
//
//   3. The file resolves but does not decode. A zero-byte or truncated render is
//      indistinguishable from silence at the call site.
//
// WHAT IS DELIBERATELY NOT CLAIMED
//   That the voices sound right, or match the characters. Headless Chromium has
//   no audio device, so this verifies plumbing and decoding — not audibility.
//   `readyState >= 3` means a browser would play it. Whether the actor sounds like
//   a police constable is a judgement only a person can make.
//
// Usage: node scripts/verify_voices.js [port]

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '5334';
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
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));

  // ── 0. On disk, before a browser is even involved ─────────────────────────
  const manifestPath = path.join(ROOT, 'story', 'voices', 'manifest.json');
  check(fs.existsSync(manifestPath), 'story/voices/manifest.json exists on disk');
  if (!fs.existsSync(manifestPath)) {
    console.log('\n  run: python scripts/precompute_voices.py');
    await browser.close(); server.close(); process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const keys = Object.keys(manifest);
  check(keys.length > 0, 'manifest is non-empty', `${keys.length} entries`);

  let missingOnDisk = 0;
  keys.forEach(k => {
    if (!fs.existsSync(path.join(ROOT, 'story', 'voices', manifest[k].path))) missingOnDisk++;
  });
  check(missingOnDisk === 0, 'every manifest entry exists on disk',
    missingOnDisk ? `${missingOnDisk} missing` : '');

  await page.goto(`http://127.0.0.1:${PORT}/Driving.html?level=1&mode=car`, { waitUntil: 'load' });

  // ── 1. The RUNTIME loads it. hasRenderedVoices() is the real question, not
  //       whether the file exists — this is the silent-fallback check.
  const loaded = await page.evaluate(async () => {
    if (!window.StoryAudio) return { present: false };
    await new Promise(res => window.StoryAudio.preloadVoices(res));
    return { present: true, has: window.StoryAudio.hasRenderedVoices() };
  });
  check(loaded.present, 'StoryAudio is present');
  check(loaded.has, 'the RUNTIME loaded the manifest (not falling back to browser TTS)');

  // ── 2 & 3. Every entry fetches, and every file is structurally a real MP3.
  //
  // Two changes from an earlier version of this check, both because it produced
  // confident nonsense:
  //
  // (a) The `story/voices/` prefix is load-bearing. Omitting it produced 29
  //     confident 404s for files that were sitting on disk. It matches
  //     MANIFEST_URL and the Audio() call in playRenderedVoice.
  //
  // (b) Bulk `readyState` checking is NOT reliable here. Decoding 29 media
  //     elements in one pass, headless, with no audio device, left some at
  //     readyState 0 — including files that ffprobe reports as valid 128 kbps
  //     MP3s with a real duration. So bulk validity is checked by parsing the
  //     frame header, which needs no decoder and no device, and only a small
  //     sample is decoded for real.
  const deep = await page.evaluate(async () => {
    const m = await fetch('story/voices/manifest.json').then(r => r.json());
    const keys = Object.keys(m);
    const out = { total: keys.length, fetched: 0, fetchFail: [], tiny: [], notMp3: [], headerAt: [] };

    // An MP3 frame header is 11 sync bits set, then a version/layer/bitrate
    // block. Byte 0 is 0xFF and byte 1 has its top three bits set. This is the
    // same check a browser's demuxer makes before it will play anything.
    const looksLikeMp3 = (arrayBuffer) => {
      // Wrap in a typed array. Indexing a raw ArrayBuffer yields undefined for
      // every index, so this comparison can never be true — which is why an
      // earlier version reported files with a clean `FF F3` sync word at byte 0
      // as having no frame header. The truncated error list made it look like
      // three bad files when in fact every one of the 52 had failed.
      const buf = new Uint8Array(arrayBuffer);
      for (let i = 0; i < buf.length - 1; i++) {
        if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) return i;
      }
      return -1;
    };

    const bytes = [];
    for (const k of keys) {
      const url = 'story/voices/' + m[k].path;
      let res;
      try { res = await fetch(url, { cache: 'no-store' }); }
      catch (e) { out.fetchFail.push(k + ' -> ' + e.message); continue; }
      if (!res.ok) { out.fetchFail.push(k + ' -> HTTP ' + res.status); continue; }
      out.fetched++;
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 2000) { out.tiny.push(k + ' (' + buf.byteLength + 'B)'); continue; }
      const at = looksLikeMp3(buf);
      if (at < 0) out.notMp3.push(k);
      else out.headerAt.push(at);
      bytes.push(url);
    }

    // Decode a small sample for real, one at a time, reusing a single element.
    const a = new Audio();
    a.preload = 'auto';
    let decoded = 0;
    const decodeFail = [];
    for (const url of bytes.slice(0, 4)) {
      a.src = url;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r2 => {
        a.addEventListener('canplaythrough', r2, { once: true });
        a.addEventListener('error', r2, { once: true });
        setTimeout(r2, 6000);
      });
      if (a.readyState >= 3) decoded++; else decodeFail.push(url.split('/').pop() + ' readyState=' + a.readyState);
    }
    return { ...out, decoded, decodeFail };
  });
  check(deep.fetched === deep.total, 'every manifest entry fetches',
    deep.fetchFail.length ? deep.fetchFail.slice(0, 3).join(' | ') : `${deep.fetched}/${deep.total}`);
  check(deep.tiny.length === 0, 'no truncated renders', deep.tiny.slice(0, 3).join(', '));
  check(deep.notMp3.length === 0, 'every file has a valid MP3 frame header',
    deep.notMp3.length ? deep.notMp3.slice(0, 3).join(', ') : `${deep.headerAt.length}/${deep.total} files`);
  check(deep.decodeFail.length === 0, 'a sample of 4 decodes in the browser',
    deep.decodeFail.length ? deep.decodeFail.join(' | ') : `${deep.decoded}/4 decoded`);

  // ── 4. Key coverage: does every line the film SPOKEN have audio?
  //    This is the orphan check, and it is the one that catches a silent
  //    regression: `voiceKey()` is `speaker || line`, so editing one character of
  //    a subtitle orphans its mp3 and that single line reverts to the browser
  //    voice with nothing logged.
  //
  //    It must walk BOTH channels. `story.dialogue[]` in levels/*.js speaks
  //    in-world at a triggerZ; `sub: {speaker, line}` in story/campaign.js is the
  //    cutscene. Checking only the in-world channel reported "0 lines found" and
  //    passed vacuously while half the film had no recording at all.
  const cov = await page.evaluate(async () => {
    const m = await fetch('story/voices/manifest.json').then(r => r.json());
    const have = new Set(Object.keys(m));
    const strip = s => String(s == null ? '' : s)
      .replace(/^\s*["“”']+/, '').replace(/["“”']+\s*$/, '').trim();

    const wanted = [];
    // In-world: story.dialogue[] entries on the loaded level.
    const S = (window.STORY && window.STORY[1]) || null;
    (function walk(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walk); return; }
      if (typeof n.speaker === 'string' && typeof n.line === 'string') {
        wanted.push(n.speaker + '||' + strip(n.line));
      }
      for (const k in n) walk(n[k]);
    })(S);

    // Film: the active cutscene script's sub blocks.
    const script = (window.Cutscene && window.Cutscene.script) || null;
    (function walk2(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walk2); return; }
      if (n.sub && typeof n.sub.speaker === 'string' && typeof n.sub.line === 'string') {
        wanted.push(n.sub.speaker + '||' + strip(n.sub.line));
      }
      if (n.sayThen && typeof n.sayThen.speaker === 'string' && typeof n.sayThen.line === 'string') {
        wanted.push(n.sayThen.speaker + '||' + strip(n.sayThen.line));
      }
      for (const k in n) walk2(n[k]);
    })(script);

    const uniq = [...new Set(wanted)];
    return {
      lines: uniq.length,
      missing: uniq.filter(k => !have.has(k)),
      manifestOnly: [...have].filter(k => !uniq.includes(k)).length,
    };
  });
  check(cov.lines > 0, 'found spoken lines in the loaded level + film', `${cov.lines} lines`);
  check(cov.missing.length === 0,
    'every spoken line has a rendered voice',
    cov.missing.length ? cov.missing.slice(0, 3).map(s => s.slice(0, 52)).join(' | ') : '');

  // ── 5. The film itself, with voices live ─────────────────────────────────
  //    The wait is for START-then-END. Waiting only on `!isActive()` returns
  //    instantly at page load, because the film has not begun, and then reports
  //    an empty world — a true observation of the wrong moment.
  const t0 = Date.now();
  let began = false;
  while (Date.now() - t0 < 200000) {
    if (await page.evaluate(() => !!(window.Cutscene && window.Cutscene.isActive()))) { began = true; break; }
    await page.waitForTimeout(300);
  }
  check(began, 'the film started');
  if (began) {
    await page.waitForFunction(() => !window.Cutscene.isActive(), null, { timeout: 200000 }).catch(() => {});
    console.log('  [note] audibility is NOT verified — headless has no audio device');
  }
  check(errs.length === 0, 'no uncaught page errors', errs.slice(0, 3).join(' | '));

  console.log('\n' + (fails ? `${fails} FAILURE(S)` : 'pre-rendered voices verified end to end'));
  await browser.close();
  server.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });