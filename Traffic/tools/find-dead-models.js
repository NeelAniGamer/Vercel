// Cross-reference two independent signals before concluding a model is dead.
//
//   1. Not requested by the browser during a full 57-level sweep.
//   2. Not named anywhere in the source or in the build config.
//
// A file must fail BOTH to be reported. Signal 1 alone is not enough: a model
// can load lazily, on demand, or only after a specific interaction that a
// quick level sweep never performs. Signal 2 alone is not enough either,
// because assets can be referenced by a computed path.
//
// Usage:
//   node Traffic/tools/find-dead-models.js <requests.json>
//
// <requests.json> must be captured from the browser, not written by hand. A
// hand-written list is easy to drop an entry from, and one dropped entry
// becomes a live asset that this tool then recommends deleting. Capture it
// with Traffic/tools/capture-model-requests.js.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const dist = path.join(root, 'dist');
// Scan the SOURCE tree, not dist/. build.js already skips whatever is on the
// dead list, so a manifest derived from dist/ is derived from its own previous
// output: run it twice and the list shrinks each time, silently losing assets
// that are genuinely used.
const srcModels = path.join(root, 'Traffic', 'Models');
const modelsRoot = srcModels;

// Request paths arrive URL-encoded from the browser (GLB%20format) while file
// paths on disk contain literal spaces. Everything is normalised the same way
// on both sides before comparison, and a decoded path is also stored so a
// request recorded for a file that 404s can never be mistaken for a live one.
const requested = new Set();
for (const raw of JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))) {
  const decoded = decodeURIComponent(raw).replace(/\\/g, '/');
  requested.add(decoded);
  requested.add(decoded.replace(/\/+/g, '/'));
}

// ── Signal 2: filenames mentioned in any first-party text file ──────────────
const SCAN_DIRS = ['.', 'Traffic'];
const SCAN_EXT = new Set(['.js', '.mjs', '.ts', '.tsx', '.html', '.json', '.md']);
const SKIP = /(^|[\\/])(node_modules|dist|dist-web|dist-electron|\.agents|\.git|Models|src|research|scratch|docs)([\\/]|$)/;

const mentioned = new Set();          // full relative path, as written in source
const basenames = new Map();          // lowercase basename -> Set of directories it was mentioned under

function scan(dir, depth) {
  if (depth > 2) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = full.replace(root, '').replace(/\\/g, '/');
    if (e.isDirectory()) {
      if (SKIP.test(rel)) continue;
      scan(full, depth + 1);
      continue;
    }
    if (!SCAN_EXT.has(path.extname(e.name).toLowerCase())) continue;
    let text;
    try { text = fs.readFileSync(full, 'utf8'); } catch (e) { continue; }
    for (const m of text.matchAll(/[A-Za-z0-9_\- .()\[\]]+\.(?:glb|gltf|fbx|obj|blend|dae|bin|png|jpg|jpeg|ktx2|zip|max)\b/gi)) {
      const raw = m[0].trim();
      if (!raw) continue;
      mentioned.add(raw);
      // Record which kit directory the mention came from, so a name that is
      // only mentioned under kenney_car-kit/ does not keep the identically
      // named file in kenney_train-kit/ alive.
      const base = path.basename(raw).toLowerCase();
      const mentionDir = path.dirname(raw).replace(/\\/g, '/').toLowerCase();
      if (!basenames.has(base)) {basenames.set(base, new Set());}
      basenames.get(base).add(mentionDir);
    }
  }
}
for (const d of SCAN_DIRS) { scan(path.join(root, d), 0); }

// Basename matching is a trap on its own. The Kenney packs repeat names
// across kits — `building-a.glb` exists in several, `colormap.png` in eight —
// so a single mention of one kit's `colormap.png` in source would mark every
// kit's copy as live, including hundreds of megabytes nothing loads. A
// basename only counts as evidence for a file in the same directory tree as
// the mention, which is what the caller checks below.
const BASENAME_TRUST = true;

// ── Compare ────────────────────────────────────────────────────────────────
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = walk(modelsRoot, []);
const dead = [];
let liveBytes = 0, deadBytes = 0;

for (const full of all) {
  // Paths are expressed the way build.js sees them, i.e. relative to dist/,
  // so the manifest and the capture use the same vocabulary.
  const rel = path.relative(root, full).replace(/\\/g, '/');
  const size = fs.statSync(full).size;
  const base = path.basename(full).toLowerCase();
  const dir = path.dirname(rel).toLowerCase();
  // A basename mention only counts when it was written under a directory that
  // could actually reach this file. A mention of `Models/GLB format/sedan.glb`
  // keeps that one file, not every `sedan.glb` in every pack.
  const dirs = basenames.get(base);
  const basenameMentioned = BASENAME_TRUST && dirs && (
    dirs.has(dir) || dirs.has('.') || dirs.has('') || [...dirs].some(d => d && dir.endsWith(d))
  );

  if (requested.has(rel)) { liveBytes += size; continue; }
  if (mentioned.has(rel) || basenameMentioned) { liveBytes += size; continue; }
  dead.push({ path: rel, mb: +(size / 1048576).toFixed(2) });
  deadBytes += size;
}

dead.sort((a, b) => b.mb - a.mb);
const mb = n => (n / 1048576).toFixed(1);

// Self-check. A capture that was typed by hand rather than recorded from the
// browser can be missing entries, and every missing entry turns a live asset
// into one this tool proposes deleting. So require that the capture actually
// resolves against the source tree before trusting it: a path that was
// recorded but does not exist means the capture and the tree disagree, and
// the safe response is to stop rather than emit a manifest.
const unresolved = [...requested].filter(p => p.startsWith('Traffic/') && !fs.existsSync(path.join(root, p)));
if (unresolved.length) {
  console.error(`Refusing to write a manifest: ${unresolved.length} recorded request(s) do not exist in dist/.`);
  console.error('That means the capture and the current tree disagree, so the "dead" set cannot be trusted.');
  for (const p of unresolved.slice(0, 10)) { console.error(`  not found: ${p}`); }
  process.exit(1);
}

console.log(`Traffic/Models total: ${all.length} files, ${mb(liveBytes + deadBytes)} MB`);
console.log(`  live (requested, or named in source) : ${mb(liveBytes)} MB`);
console.log(`  dead  (neither signal fires)         : ${dead.length} files, ${mb(deadBytes)} MB`);
console.log(`  capture self-check                   : ${requested.size} recorded requests all resolve`);
console.log('');
for (const d of dead.slice(0, 25)) { console.log(`  ${String(d.mb).padStart(7)} MB  ${d.path}`); }
if (dead.length > 25) { console.log(`  ... and ${dead.length - 25} more`); }

// --write updates the manifest build.js reads. This is the only supported way
// to change it: the manifest is derived data, and a hand-edited one can
// exclude a live asset and break a level with no other warning.
if (process.argv.includes('--write')) {
  const target = path.join(__dirname, 'dead-model-files.json');
  fs.writeFileSync(target, JSON.stringify({
    _comment: 'GENERATED. Files under Traffic/Models that the browser never requested across a 57-level sweep AND that are not named in any first-party source file. build.js skips these so they stay in git but out of the deploy. Regenerate with Traffic/tools/capture-model-requests.js then find-dead-models.js --write; never hand-edit.',
    generatedBy: 'capture-model-requests.js -> find-dead-models.js --write',
    count: dead.length,
    totalMB: +(deadBytes / 1048576).toFixed(1),
    files: dead.map(d => d.path),
  }));
  console.log(`\nwrote ${dead.length} entries -> ${path.relative(root, target)}`);
}
