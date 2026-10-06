const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const MODELS = path.join(ROOT, 'Models');

// ---- 1. every model/texture file, hashed by content -----------------------
const EXTS = /\.(glb|gltf|fbx|obj|png|jpe?g)$/i;
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (EXTS.test(e.name)) files.push(p);
  }
})(MODELS);

const byHash = new Map();
for (const f of files) {
  const buf = fs.readFileSync(f);
  const h = crypto.createHash('sha256').update(buf).digest('hex');
  if (!byHash.has(h)) byHash.set(h, { bytes: buf.length, paths: [] });
  byHash.get(h).paths.push(f);
}
const dupeGroups = [...byHash.entries()].filter(([, v]) => v.paths.length > 1);
let reclaimable = 0;
for (const [, v] of dupeGroups) reclaimable += v.bytes * (v.paths.length - 1);

console.log(`model/texture files      : ${files.length}`);
console.log(`unique contents          : ${byHash.size}`);
console.log(`duplicate groups         : ${dupeGroups.length}`);
console.log(`reclaimable if deduped   : ${(reclaimable / 1048576).toFixed(1)} MB\n`);

// ---- 2. every model path referenced anywhere in source --------------------
// Match on basename, because code references models as 'Models/kenney/x.glb'
// or bare 'x.glb' depending on the call site.
const SRC_EXT = /\.(js|html|json|md)$/i;
const skipDir = new Set(['node_modules', 'dist', 'dist-web', 'dist-electron', '.git', 'Models']);
const refs = new Map(); // basename lowercased -> Set(referencing files)
(function walkSrc(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (skipDir.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walkSrc(p); continue; }
    if (!SRC_EXT.test(e.name)) continue;
    if (e.size > 8 * 1048576) continue; // skip the giant legacy blobs
    let txt;
    try { txt = fs.readFileSync(p, 'utf8'); } catch (err) { continue; }
    for (const m of txt.matchAll(/[A-Za-z0-9 _.\-()']+\.(?:glb|gltf|fbx|obj|png|jpe?g)/gi)) {
      const base = path.basename(m[0].replace(/['"]/g, '').trim()).toLowerCase();
      if (!base || base.length < 5) continue;
      if (!refs.has(base)) refs.set(base, new Set());
      refs.get(base).add(path.relative(ROOT, p).replace(/\\/g, '/'));
    }
  }
})(ROOT);

console.log(`distinct asset basenames referenced in source: ${refs.size}\n`);

// ---- 3. classify each duplicate group --------------------------------------
const safe = [], risky = [], unreferenced = [];
for (const [h, v] of dupeGroups) {
  const rel = v.paths.map((p) => path.relative(ROOT, p).replace(/\\/g, '/'));
  const withRefs = rel.filter((r) => refs.has(path.basename(r).toLowerCase()));
  const entry = { hash: h.slice(0, 12), mb: v.bytes / 1048576, copies: rel.length, paths: rel, referenced: withRefs };
  if (withRefs.length === 0) unreferenced.push(entry);        // nobody mentions any copy
  else if (withRefs.length < rel.length) risky.push(entry);   // some copies referenced, some not
  else safe.push({ ...entry, allReferenced: true });           // all copies referenced
}

const sum = (a) => a.reduce((n, e) => n + e.mb * (e.copies - 1), 0);
console.log(`groups where ALL copies are referenced : ${safe.length}   (${sum(safe).toFixed(1)} MB)  -> needs path rewriting`);
console.log(`groups where only SOME are referenced : ${risky.length}   (${sum(risky).toFixed(1)} MB)  -> can delete unreferenced copies`);
console.log(`groups with NO references at all      : ${unreferenced.length}   (${sum(unreferenced).toFixed(1)} MB)  -> safe to drop a copy\n`);

fs.writeFileSync(path.join(process.env.LOCALAPPDATA || '.', 'dupe-report.json'),
  JSON.stringify({ safe, risky, unreferenced }, null, 2));

console.log('--- sample: SOME-referenced groups (deletable copies) ---');
risky.slice(0, 12).forEach((e) => {
  console.log(`  ${e.mb.toFixed(2)} MB x${e.copies}  referenced: ${e.referenced.join(', ')}`);
  e.paths.filter((p) => !e.referenced.includes(p)).slice(0, 3).forEach((p) => console.log(`        delete -> ${p}`));
});
console.log('\n--- sample: unreferenced groups ---');
unreferenced.slice(0, 10).forEach((e) => console.log(`  ${e.mb.toFixed(2)} MB x${e.copies}  ${e.paths.slice(0, 3).join('  ')}`));
console.log('\n--- sample: all-referenced groups ---');
safe.slice(0, 10).forEach((e) => console.log(`  ${e.mb.toFixed(2)} MB x${e.copies}  ${e.paths.slice(0, 3).join('  ')}`));