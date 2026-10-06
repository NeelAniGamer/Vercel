const fs = require('fs');
const path = require('path');

const rep = JSON.parse(fs.readFileSync(path.join(process.env.LOCALAPPDATA || '.', 'dupe-report.json'), 'utf8'));
const all = [...rep.safe, ...rep.risky, ...rep.unreferenced];

// Classify each duplicate group by the shape of its paths.
const buckets = {};
for (const e of all) {
  const dirs = [...new Set(e.paths.map((p) => path.dirname(p)))];
  const hasSample = e.paths.some((p) => /sample \(\d+\)/i.test(p));
  const dirSpread = dirs.length;
  let kind;
  if (dirSpread === 2) kind = 'duplicate-pack-dir';
  else if (hasSample) kind = 'sample-N-vs-named';
  else kind = 'same-dir';
  (buckets[kind] = buckets[kind] || []).push(e);
}

console.log('=== duplicate groups by cause ===');
Object.entries(buckets).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => {
  const mb = v.reduce((n, e) => n + e.mb * (e.copies - 1), 0);
  console.log(`  ${k.padEnd(22)} ${String(v.length).padStart(3)} groups   ${mb.toFixed(1).padStart(6)} MB`);
});
console.log('');

console.log('=== dir pairs involved in duplicate-pack-dir ===');
const pairs = {};
for (const e of buckets['duplicate-pack-dir'] || []) {
  const dirs = [...new Set(e.paths.map((p) => path.dirname(p)))].sort();
  const key = dirs.join('  ==  ');
  pairs[key] = pairs[key] || { n: 0, mb: 0 };
  pairs[key].n++;
  pairs[key].mb += e.mb * (e.copies - 1);
}
Object.entries(pairs).sort((a, b) => b[1].mb - a[1].mb).forEach(([k, v]) => {
  console.log(`  ${String(v.n).padStart(3)} groups  ${v.mb.toFixed(1).padStart(6)} MB`);
  console.log(`        ${k}`);
});
console.log('');

console.log('=== same-dir duplicates (easiest, no path prefix change) ===');
(buckets['same-dir'] || []).forEach((e) => {
  console.log(`  ${e.mb.toFixed(2).padStart(6)} MB  ${e.paths.join('   ')}`);
});
console.log('');

console.log('=== sample(N) vs named (biggest single wins) ===');
(buckets['sample-N-vs-named'] || []).sort((a, b) => b.mb - a.mb).forEach((e) => {
  console.log(`  ${e.mb.toFixed(2).padStart(6)} MB  ${e.paths.join('   ')}`);
});

// Where are these referenced from?
console.log('\n=== manifest files that build model paths dynamically ===');
for (const f of fs.readdirSync(process.cwd())) {
  if (!/\.(js|json)$/i.test(f)) continue;
  if (f.startsWith('_')) continue;
  let txt;
  try { txt = fs.readFileSync(f, 'utf8'); } catch (err) { continue; }
  if (/basePath|base_path|MODEL_DIR|modelDir|MODELS_DIR/i.test(txt) && txt.length < 4 * 1048576) {
    const lines = txt.split('\n').filter((l) => /basePath|base_path|MODEL_DIR|modelDir|MODELS_DIR/i.test(l));
    if (lines.length) {
      console.log(`  ${f}:`);
      lines.slice(0, 3).forEach((l) => console.log(`      ${l.trim().slice(0, 110)}`));
    }
  }
}