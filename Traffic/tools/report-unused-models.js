// Report which shipped files the browser never requests.
//
// The 620 MB deploy is mostly Traffic/Models, but only a small fraction of it
// is actually loaded. Rather than guessing from a grep, this takes the observed
// request set (captured from a real page load) and reports the size of the
// files that were never asked for.
//
// Usage:
//   node Traffic/tools/report-unused-models.js <requests.json>
//
// where requests.json is a JSON array of site-relative paths, e.g.
//   ["Traffic/Models/kenney_car-kit/Models/GLB format/taxi.glb", ...]
//
// It prints a summary and, with --json, machine-readable totals. It never
// deletes anything; removal is a separate, reviewed step.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const dist = path.join(root, 'dist');
const modelsRoot = path.join(dist, 'Traffic', 'Models');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node Traffic/tools/report-unused-models.js <requests.json>');
  process.exit(1);
}

const requested = new Set(
  JSON.parse(fs.readFileSync(input, 'utf8')).map(p => decodeURIComponent(p).replace(/\\/g, '/')),
);

if (!fs.existsSync(modelsRoot)) {
  console.error('dist/Traffic/Models not found. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = walk(modelsRoot, []);
let usedCount = 0;
let usedBytes = 0;
let unusedCount = 0;
let unusedBytes = 0;
const unused = [];

for (const full of all) {
  const rel = path.relative(dist, full).replace(/\\/g, '/');
  const size = fs.statSync(full).size;
  if (requested.has(rel)) {
    usedCount++;
    usedBytes += size;
  } else {
    unusedCount++;
    unusedBytes += size;
    unused.push({ path: rel, mb: +(size / 1048576).toFixed(2) });
  }
}

unused.sort((a, b) => b.mb - a.mb);

const pct = total => (total === 0 ? '0.0' : ((total / (usedBytes + unusedBytes)) * 100).toFixed(1));
const mb = n => (n / 1048576).toFixed(1);

console.log(`Traffic/Models: ${all.length} files, ${mb(usedBytes + unusedBytes)} MB`);
console.log(`  requested by the browser : ${usedCount} files, ${mb(usedBytes)} MB (${pct(usedBytes)}%)`);
console.log(`  never requested          : ${unusedCount} files, ${mb(unusedBytes)} MB (${pct(unusedBytes)}%)`);
console.log('');
console.log('Largest never-requested files:');
for (const u of unused.slice(0, 30)) {
  console.log(`  ${String(u.mb).padStart(7)} MB  ${u.path}`);
}
if (unused.length > 30) {console.log(`  ... and ${unused.length - 30} more`);}

if (process.argv.includes('--json')) {
  console.log('');
  console.log(JSON.stringify({
    totalFiles: all.length,
    totalBytes: usedBytes + unusedBytes,
    usedFiles: usedCount, usedBytes,
    unusedFiles: unusedCount, unusedBytes,
    largestUnused: unused.slice(0, 100),
  }, null, 2));
}
