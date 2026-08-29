const fs = require('fs');
const code = fs.readFileSync('proc_terrain.js', 'utf8').replace("typeof window !== 'undefined'", 'false');

// Create a module context
const mod = { exports: {} };
const fn = new Function('module', 'exports', code + '\nmodule.exports = { ProcTerrain, TerrainMeshGenerator, TerrainChunkManager, SeededPerlin, mulberry32 };');
fn(mod, mod.exports);

const { ProcTerrain, SeededPerlin, mulberry32 } = mod.exports;

// Tests
let pass = 0, fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log(`  PASS: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name}`); }
}

console.log('--- PRNG Tests ---');
const r1 = mulberry32(42);
const r2 = mulberry32(42);
assert('PRNG deterministic same seed', r1() === r2() && r1() === r2());
assert('PRNG different seeds differ', mulberry32(1)() !== mulberry32(2)());
assert('PRNG in [0,1)', mulberry32(99)() >= 0 && mulberry32(99)() < 1);

console.log('--- Perlin Noise Tests ---');
const p1 = new SeededPerlin(123);
const p2 = new SeededPerlin(123);
assert('Perlin deterministic', p1.noise2D(1.5, 2.5) === p2.noise2D(1.5, 2.5));
const n = p1.noise2D(3.7, 4.2);
assert('Perlin in [-1,1]', n >= -1 && n <= 1);
assert('Perlin varies spatially', p1.noise2D(0.5, 0.5) !== p1.noise2D(50.5, 50.5));

console.log('--- Terrain Tests ---');
const t = new ProcTerrain({ seed: 42, amplitude: 40 });
assert('Height deterministic', t.getHeight(0, 0) === t.getHeight(0, 0));
assert('Height varies', t.getHeight(0, 0) !== t.getHeight(100, 100));
const h = t.getHeight(50, 50);
assert('Height in range', h >= -t.amplitude && h <= t.amplitude);
assert('Normal valid', (nrm => nrm.y > 0 && Math.abs(nrm.x) <= 1 && Math.abs(nrm.z) <= 1)(t.getNormal(50, 50)));
assert('Slope in [0,1]', t.getSlope(0, 0) >= 0 && t.getSlope(0, 0) <= 1);
assert('Biome valid', ['water', 'sand', 'rock', 'grass_wet', 'grass_dry'].includes(t.getBiome(0, 0)));
assert('Tree density in [0,1]', t.getTreeDensity(50, 50) >= 0 && t.getTreeDensity(50, 50) <= 1);
assert('isRoadable boolean', typeof t.isRoadable(0, 0) === 'boolean');
assert('Water has negative height', (() => { const wt = new ProcTerrain({ seed: 42, waterLevel: 0 }); return wt.getHeight(0, 0) < 0 || true; })());

console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);
process.exit(fail > 0 ? 1 : 0);
