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
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const dist = path.join(root, 'dist');
const modelsRoot = path.join(dist, 'Traffic', 'Models');

const requested = new Set(
  JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
    .map(p => decodeURIComponent(p).replace(/\\/g, '/')),
);

// ── Signal 2: filenames mentioned in any first-party text file ──────────────
const SCAN_DIRS = ['.', 'Traffic'];
const SCAN_EXT = new Set(['.js', '.mjs', '.ts', '.tsx', '.html', '.json', '.md']);
const SKIP = /(^|[\\/])(node_modules|dist|dist-web|dist-electron|\.agents|\.git|Models|src|research|scratch|docs)([\\/]|$)/;

const mentioned = new Set();
const basenames = new Map(); // lowercase basename -> count of mentions

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
      const base = path.basename(raw).toLowerCase();
      basenames.set(base, (basenames.get(base) || 0) + 1);
    }
  }
}
for (const d of SCAN_DIRS) { scan(path.join(root, d), 0); }

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
  const rel = path.relative(dist, full).replace(/\\/g, '/');
  const size = fs.statSync(full).size;
  const base = path.basename(full).toLowerCase();
  const referencedInCode = mentioned.has(rel) || (basenames.get(base) || 0) > 0;

  if (requested.has(rel)) { liveBytes += size; continue; }
  if (referencedInCode) { liveBytes += size; continue; } // named in source: assume live
  dead.push({ path: rel, mb: +(size / 1048576).toFixed(2) });
  deadBytes += size;
}

dead.sort((a, b) => b.mb - a.mb);
const mb = n => (n / 1048576).toFixed(1);

console.log(`Traffic/Models total: ${all.length} files, ${mb(liveBytes + deadBytes)} MB`);
console.log(`  live (requested, or named in source) : ${mb(liveBytes)} MB`);
console.log(`  dead  (neither signal fires)         : ${dead.length} files, ${mb(deadBytes)} MB`);
console.log('');
for (const d of dead.slice(0, 25)) { console.log(`  ${String(d.mb).padStart(7)} MB  ${d.path}`); }
if (dead.length > 25) { console.log(`  ... and ${dead.length - 25} more`); }

if (process.argv.includes('--json')) {
  console.log('');
  console.log(JSON.stringify({ deadBytes, deadCount: dead.length, files: dead.map(d => d.path) }, null, 2));
}
