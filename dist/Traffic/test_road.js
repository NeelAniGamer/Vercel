const fs = require('fs');

// Load proc_terrain.js
let terrainCode = fs.readFileSync('proc_terrain.js', 'utf8')
  .split('// Make available globally')[0];
terrainCode += '\nmodule.exports = { ProcTerrain, SeededPerlin, mulberry32 };';

const tm = { exports: {} };
new Function('module', 'exports', terrainCode)(tm, tm.exports);

// Load proc_road.js
let roadCode = fs.readFileSync('proc_road.js', 'utf8')
  .split('// Make available globally')[0];
roadCode += '\nmodule.exports = { SpatialHash, RoadGenerator };';

const rm = { exports: {} };
new Function('module', 'exports', roadCode)(rm, rm.exports);

const { ProcTerrain } = tm.exports;
const { SpatialHash, RoadGenerator } = rm.exports;

let pass = 0, fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log(`  PASS: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name}`); }
}

console.log('--- SpatialHash Tests ---');
const sh = new SpatialHash(10);
sh.insert(5, 5, { id: 1 });
sh.insert(15, 15, { id: 2 });
sh.insert(100, 100, { id: 3 });
assert('Has nearby within radius', sh.hasNearby(6, 6, 5));
assert('No nearby outside radius', !sh.hasNearby(50, 50, 5));
assert('Query returns nearby points', sh.queryNearby(5, 5, 10).length >= 1);
assert('Clear works', (sh.clear(), sh.size === 0));

console.log('--- RoadGenerator Tests ---');

// Test 1: Basic road generation
const terrain = new ProcTerrain({ seed: 42 });
const gen = new RoadGenerator(terrain);
const road = gen.generate(5000);

assert('Road has coarse points', road.coarse.length > 50);
assert('Road has fine points', road.fine.length > road.coarse.length * 5);
assert('Road length > 1000m', road.length > 1000);
assert('Road bounds valid', road.bounds.maxX > road.bounds.minX);
assert('Fine points have width', road.fine[0].width > 0);

// Test 2: Determinism
const gen2 = new RoadGenerator(new ProcTerrain({ seed: 42 }));
const road2 = gen2.generate(5000);
assert('Road deterministic (coarse)', road.coarse.length === road2.coarse.length);
assert('Road deterministic (fine len)', road.fine.length === road2.fine.length);
assert('Road deterministic (first point)',
  Math.abs(road.coarse[10].x - road2.coarse[10].x) < 0.001);

// Test 3: No self-intersection (self-avoiding)
function hasSelfIntersection(points, minDist) {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 5; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dz = points[i].z - points[j].z;
      if (Math.sqrt(dx * dx + dz * dz) < minDist) {
        return true;
      }
    }
  }
  return false;
}
// Sample every 5th point for speed
const sampled = road.coarse.filter((_, i) => i % 5 === 0);
assert('No self-intersection (sampled)', !hasSelfIntersection(sampled, 8));

// Test 4: Slope compliance
let maxSlopeFound = 0;
for (let i = 1; i < road.coarse.length; i++) {
  const dx = road.coarse[i].x - road.coarse[i - 1].x;
  const dz = road.coarse[i].z - road.coarse[i - 1].z;
  const dh = Math.abs(road.coarse[i].h - road.coarse[i - 1].h);
  const dist = Math.sqrt(dx * dx + dz * dz);
  const slope = dist > 0 ? dh / dist : 0;
  if (slope > maxSlopeFound) maxSlopeFound = slope;
}
assert('Slope mostly compliant', maxSlopeFound < 0.25);

// Test 5: Start point is roadable
assert('Start point roadable', terrain.isRoadable(road.coarse[0].x, road.coarse[0].z));

// Test 6: Bezier interpolation smooth
let maxBend = 0;
for (let i = 2; i < Math.min(road.fine.length - 2, 200); i++) {
  const p0 = road.fine[i - 2], p1 = road.fine[i], p2 = road.fine[i + 2];
  const ax = p1.x - p0.x, az = p1.z - p0.z;
  const bx = p2.x - p1.x, bz = p2.z - p1.z;
  const cross = Math.abs(ax * bz - az * bx);
  if (cross > maxBend) maxBend = cross;
}
assert('Bezier smooth (no sharp kinks)', maxBend < 50);

console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);
console.log(`Road: ${road.coarse.length} coarse points, ${road.fine.length} fine points, ${road.length.toFixed(0)}m long`);

process.exit(fail > 0 ? 1 : 0);
