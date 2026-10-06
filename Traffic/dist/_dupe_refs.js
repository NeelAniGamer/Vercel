const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

const SKIP = new Set(['node_modules', 'dist', 'dist-web', 'dist-electron', '.git', 'Models']);

// Which source files mention each candidate path?
function refsFor(needle) {
  const hits = new Set();
  const lower = needle.toLowerCase();
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|html|json|md|mts|ts)$/i.test(e.name)) continue;
      let st;
      try { st = fs.statSync(p); } catch (err) { continue; }
      if (st.size > 8 * 1048576) continue;
      let txt;
      try { txt = fs.readFileSync(p, 'utf8'); } catch (err) { continue; }
      if (txt.toLowerCase().includes(lower)) hits.add(path.relative(ROOT, p).replace(/\\/g, '/'));
    }
  })(ROOT);
  return [...hits];
}

const CANDIDATES = [
  ['Models/sample (2).glb', 'Models/supercar_white.glb'],
  ['Models/sample (3).glb', 'Models/character_rpg_hero.glb'],
  ['Models/sample (4).glb', 'Models/sports_car_cyan.glb'],
  ['Models/sample (5).glb', 'Models/character_hero_green.glb'],
  ['Models/sample (1).glb', 'Models/bus_green_city.glb'],
  ['Models/uploads_files_3354643_LowPoly_Cars_01_fbx (1).FBX', 'Models/uploads_files_3354643_LowPoly_Cars_01_fbx.FBX'],
  ['Models/high_school.glb', 'Models/building_high_school.glb'],
  ['Models/low_poly_mansion__house.glb', 'Models/house_mansion_lowpoly.glb'],
  ['Models/free__house_low-poly_isometric.glb', 'Models/house_lowpoly_isometric.glb'],
  ['Models/Meshy_AI_sample_biped_Animation_Running_withSkin.glb', 'Models/anim_runner_biped.glb'],
  ['Models/Meshy_AI_sample_biped_Animation_Walking_withSkin.glb', 'Models/anim_walker_biped.glb'],
  ['Models/city_pack', 'Models/kenney_city-pack'],
];

console.log('path'.padEnd(56) + 'exists  referenced-by');
console.log('-'.repeat(110));
for (const [dup, keep] of CANDIDATES) {
  const ex = fs.existsSync(path.join(ROOT, dup));
  const refs = refsFor(dup);
  console.log(
    dup.slice(0, 54).padEnd(56) +
    String(ex).padEnd(8) +
    (refs.length ? refs.slice(0, 3).join(', ') + (refs.length > 3 ? ` +${refs.length - 3}` : '') : '(NONE)')
  );
}

console.log('\n--- does anything reference the city_pack directory prefix at all? ---');
const cpRefs = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(js|html|json|md)$/i.test(e.name)) continue;
    let st; try { st = fs.statSync(p); } catch (err) { continue; }
    if (st.size > 8 * 1048576) continue;
    let txt; try { txt = fs.readFileSync(p, 'utf8'); } catch (err) { continue; }
    const m = txt.match(/Models\/city_pack\/[A-Za-z0-9 _.\-()&']+\.(?:glb|gltf|png|jpe?g)/gi);
    if (m) cpRefs.push({ f: path.relative(ROOT, p).replace(/\\/g, '/'), n: m.length, sample: m.slice(0, 2) });
  }
})(ROOT);
if (cpRefs.length) { cpRefs.forEach((r) => console.log(`  ${r.f}: ${r.n} refs  e.g. ${r.sample.join(', ')}`)); }
else console.log('  NONE — Models/city_pack/ is not referenced by any source file');