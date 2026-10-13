// verify_runtime.js — catches the class of failure that hides.
//
// WHAT IT IS FOR
//   A JavaScript parse error in ONE runtime file is close to invisible. The HTML
//   loads, the game boots, the film plays, the world renders — and the file that
//   failed to parse simply never ran. `if (window.TaskManager) { ... }` is then
//   false, the task system never constructs, and every objective in the game is
//   silently absent. No exception is thrown at the call site, because the guard is
//   doing exactly what it was written to do.
//
//   That is not hypothetical: task-manager.js had a backtick inside a `//` comment,
//   which is a syntax error in JavaScript. The file 404'd nothing and logged
//   nothing. Every task in the game was gone, and the only symptom was a flag toast
//   that had fired once before the parse error landed.
//
//   `node --check` catches it, but only for files you remember to run it on, and
//   only at the moment you run it. This runs it over every file the page loads,
//   and then confirms in a real browser that each subsystem actually defined itself.
//
// THREE LAYERS, DELIBERATE
//   1. Syntax: `node --check` over every script the HTML references. Catches a bad
//      edit immediately, before a browser is involved.
//   2. Load: no page errors during boot. Catches a runtime throw in top-level code.
//   3. Registration: each subsystem's global actually exists. Catches a file that
//      parses but exports nothing, and a load-order mistake — both of which look
//      identical to "the feature was never implemented".
//
// Usage: node scripts/verify_runtime.js [port]

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PORT = process.argv[2] || '5347';
const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'Driving.html');

let fails = 0;
function check(ok, label, detail) {
  console.log(`  [${ok ? 'ok  ' : 'FAIL'}] ${label}${detail ? '  ' + detail : ''}`);
  if (!ok) fails++;
}

// ── 1. Syntax over every script the page loads ───────────────────────────────
console.log('\n── 1. SYNTAX ────────────────────────────────────────────');
const html = fs.readFileSync(HTML, 'utf8');
const srcs = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m => m[1])
  .map(s => s.split('?')[0])
  .filter(s => s && !/^(https?:)?\/\//.test(s));

let checked = 0, badSyntax = [];
for (const s of new Set(srcs)) {
  const f = path.join(ROOT, s);
  if (!fs.existsSync(f)) continue;          // served by a sibling dir, or optional
  checked++;
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    const msg = String(e.stderr || e.stdout || e).split('\n').filter(l => /SyntaxError|^\s*\^/.test(l)).slice(0, 2).join(' ').trim();
    badSyntax.push(s + (msg ? '  → ' + msg : ''));
  }
}
check(badSyntax.length === 0,
  `node --check passes on all ${checked} loadable scripts`,
  badSyntax.length ? badSyntax.slice(0, 4).join(' | ') : '');

// ── Serve + boot ─────────────────────────────────────────────────────────────
function serve() {
  const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.glb': 'model/gltf-binary', '.fbx': 'application/octet-stream',
    '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml',
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
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message || e)));

  await page.goto(`http://127.0.0.1:${PORT}/Driving.html?level=1&mode=car`, { waitUntil: 'load' });

  // ── 2. No load-time exceptions ─────────────────────────────────────────────
  console.log('\n── 2. BOOT ─────────────────────────────────────────────');
  await page.waitForTimeout(1500);
  check(pageErrors.length === 0,
    'no uncaught exceptions while the page loads',
    pageErrors.slice(0, 3).join(' | '));

  // ── 3. Every subsystem registered itself ───────────────────────────────────
  //
  // Each of these is a `if (window.X)` guard somewhere in the game. If the file
  // that defines X failed to parse, X is undefined, the guard is false, and the
  // feature is simply absent — with no error anywhere to point at the cause.
  console.log('\n── 3. SUBSYSTEM REGISTRATION ───────────────────────────');
  const globals = await page.evaluate(() => {
    const names = [
      'TaskManager', 'STORY', 'STAGE', 'Shots', 'StoryAudio', 'SampleBank',
      'ASSET_MANIFEST', 'ASSET_GROUPS', 'PRELOADED_MODELS', 'LVS',
      'TrafficAudio', 'Cinematics', 'Cutscene', 'Cinematics', 'ui', 'game',
    ];
    const out = {};
    names.forEach(n => { out[n] = typeof window[n]; });
    return out;
  });
  const expected = [
    ['TaskManager', 'object|function'], ['STORY', 'object'], ['STAGE', 'object'],
    ['Shots', 'object'], ['StoryAudio', 'object'], ['SampleBank', 'object'],
    ['ASSET_MANIFEST', 'object'], ['ASSET_GROUPS', 'object'],
    ['TrafficAudio', 'object'], ['Cinematics', 'object'], ['Cutscene', 'object'],
    ['game', 'object'], ['LVS', 'object'],
  ];
  expected.forEach(([n, want]) => {
    check(new RegExp(want).test(globals[n]), `window.${n} exists`, globals[n]);
  });

  // ── 4. The task system is actually INSTANTIATED, not merely defined ────────
  //
  // `window.TaskManager` existing proves the file parsed. It says nothing about
  // whether the game built one, which is the half that was actually broken.
  console.log('\n── 4. TASK SYSTEM LIVE ──────────────────────────────────');
  await page.waitForFunction(() => window.Cutscene && window.game, null, { timeout: 60000 }).catch(() => {});
  await page.waitForFunction(() => window.game.taskManager, null, { timeout: 60000 })
    .catch(() => {});
  const tm = await page.evaluate(() => {
    const g = window.game;
    const t = g.taskManager;
    if (!t) { return { present: false }; }
    return {
      present: true,
      initialized: !!t._initialized,
      count: t.tasks ? t.tasks.length : 0,
      ids: t.tasks ? t.tasks.map(x => x.id) : [],
      // The bug this gate exists for: a task awarding itself on frame one.
      autoCompleted: t.tasks ? t.tasks.filter(x => x.completed).map(x => x.id) : [],
    };
  });
  check(tm.present, 'game.taskManager was constructed', tm.present ? '' : 'guard was false — the file did not run');
  check(tm.initialized === true, 'task manager is initialized');
  check(tm.count > 0, 'tasks were built', tm.count + ' tasks: ' + (tm.ids || []).join(', '));
  // At spawn the player has done nothing, so NOTHING may be complete. The old
  // departure test completed itself here, because it measured from `g._startX`,
  // a field that does not exist and defaulted to the origin 145 m away.
  check(tm.autoCompleted && tm.autoCompleted.length === 0,
    'NO task is complete before the player has done anything',
    tm.autoCompleted && tm.autoCompleted.length ? 'auto-completed: ' + tm.autoCompleted.join(', ') : '');

  // ── 5. Overlay layering: nothing floats over the mission briefing ─────────
  console.log('\n── 5. OVERLAY LAYERING ──────────────────────────────────');
  const layers = await page.evaluate(() => {
    const brief = document.getElementById('gta-mission-intro');
    const bz = brief ? parseInt(getComputedStyle(brief).zIndex, 10) || 0 : null;
    const offenders = [];
    document.querySelectorAll('body *').forEach(n => {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const z = parseInt(cs.zIndex, 10);
      if (!z || z <= bz) return;
      const rc = n.getBoundingClientRect();
      if (rc.width * rc.height < 3000) return;   // ignore small badges
      if (!n.id && !String(n.className || '')) return;
      offenders.push((n.id || String(n.className).slice(0, 30)) + '@' + z);
    });
    return { bz, offenders };
  });
  check(layers.bz !== null, 'the mission briefing overlay exists', 'z=' + layers.bz);
  // A full-screen modal must be the top layer. Anything covering it competes for
  // the player's attention with the thing asking for it.
  check(!layers.offenders.includes('cyber-flag-toast'),
    'flag toast no longer outranks the briefing', layers.offenders.join(', '));
  check(!layers.offenders.some(o => /warn|press-f|hint/i.test(o)),
    'no gameplay hint strip floats over the briefing', layers.offenders.join(', '));

  await browser.close();
  server.close();

  console.log('\n' + (fails ? `${fails} FAILURE(S)` : 'runtime verified: syntax, load, registration, live systems, layering'));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });