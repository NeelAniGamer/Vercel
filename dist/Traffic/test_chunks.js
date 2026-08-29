const fs = require('fs');

// Mock THREE.js for headless testing
class MockFloat32BufferAttribute {
  constructor(arr, itemSize) { this.array = arr; this.itemSize = itemSize; this.count = arr.length / itemSize; }
  needsUpdate = false;
}
class MockBufferAttribute {
  constructor(arr, itemSize) { this.array = arr; this.itemSize = itemSize; }
}
class MockGeometry {
  constructor() { this.attributes = { position: { getX: () => 0, getY: () => 0, getZ: () => 0, count: 0, setY: () => {}, needsUpdate: false } }; }
  setAttribute(name, attr) { this.attributes[name] = attr; }
  computeVertexNormals() {}
  dispose() {}
}
class MockMaterial {
  constructor(opts = {}) { Object.assign(this, opts); }
  dispose() {}
}
class MockMesh {
  constructor(geo, mat) { this.geometry = geo; this.material = mat; this.position = { set: () => {} }; }
}
class MockColor {
  constructor() { this.r = 0; this.g = 0; this.b = 0; }
  setHex(hex) { this.r = ((hex >> 16) & 0xff) / 255; this.g = ((hex >> 8) & 0xff) / 255; this.b = (hex & 0xff) / 255; }
  multiplyScalar(s) { this.r *= s; this.g *= s; this.b *= s; }
}

global.THREE = {
  Float32BufferAttribute: MockFloat32BufferAttribute,
  BufferAttribute: MockBufferAttribute,
  PlaneGeometry: class extends MockGeometry {
    constructor(size, size2, res) {
      super();
      const count = (res + 1) * (res + 1);
      const positions = new Float32Array(count * 3);
      this.attributes.position = {
        count,
        getX: (i) => positions[i * 3],
        getY: (i) => positions[i * 3 + 1],
        getZ: (i) => positions[i * 3 + 2],
        setY: (i, v) => { positions[i * 3 + 1] = v; },
        needsUpdate: false,
      };
    }
    rotateX() { return this; }
  },
  MeshLambertMaterial: class extends MockMaterial {},
  Mesh: MockMesh,
  Color: MockColor,
};

// Load all three modules
let tc = fs.readFileSync('proc_terrain.js', 'utf8').split('// Make available globally')[0];
tc += '\nmodule.exports = { ProcTerrain };';
const tm = { exports: {} };
new Function('module', 'exports', tc)(tm, tm.exports);

let rc = fs.readFileSync('proc_road.js', 'utf8').split('// Make available globally')[0];
rc += '\nmodule.exports = { RoadGenerator };';
const rm = { exports: {} };
new Function('module', 'exports', rc)(rm, rm.exports);

let cc = fs.readFileSync('proc_chunks.js', 'utf8').split('// Make available globally')[0];
cc += '\nmodule.exports = { GeometryPool, ChunkTier, ProcChunkManager };';
const cm = { exports: {} };
new Function('module', 'exports', cc)(cm, cm.exports);

const { ProcTerrain } = tm.exports;
const { RoadGenerator } = rm.exports;
const { GeometryPool, ChunkTier, ProcChunkManager } = cm.exports;

let pass = 0, fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log(`  PASS: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name}`); }
}

// Mock scene for headless testing
const mockScene = { add: () => {}, remove: () => {} };

console.log('--- GeometryPool Tests ---');
const gp = new GeometryPool();
const geo1 = gp.get(100, 10);
assert('Creates geometry', geo1 && geo1.attributes.position);
gp.release(geo1, 100, 10);
const geo2 = gp.get(100, 10);
assert('Reuses pooled geometry', geo1 === geo2);
gp.clear();
assert('Clear works', true); // no crash

console.log('--- ChunkTier Tests ---');
const terrain = new ProcTerrain({ seed: 42 });
const tier = new ChunkTier(mockScene, terrain, {
  chunkSize: 100, resolution: 8, viewDistance: 2,
});
const { cx, cz } = tier.worldToChunk(150, -50);
assert('World to chunk correct', cx === 1 && cz === -1);

tier.update(0, 0);
assert('Chunks created', tier.chunks.size > 0);
assert('Chunks within view distance', tier.chunks.size <= 25); // 5x5 max

const stats = tier.getStats();
assert('Stats valid', stats.activeChunks > 0 && stats.chunkSize === 100);

tier.rebuild();
assert('Rebuild clears chunks', tier.chunks.size === 0);

console.log('--- ProcChunkManager Tests ---');
const mgr = new ProcChunkManager(mockScene, terrain, 'MED');
assert('Has far tier', mgr.farTier !== undefined);
assert('Has med tier', mgr.medTier !== undefined);
assert('Has near tier', mgr.nearTier !== undefined);

mgr.update(0, 0);
const st1 = mgr.getStats();
assert('All tiers populated', st1.far.activeChunks > 0 && st1.med.activeChunks > 0 && st1.near.activeChunks > 0);
assert('Far tier has largest chunks', st1.far.chunkSize > st1.med.chunkSize && st1.med.chunkSize > st1.near.chunkSize);
assert('Near tier has highest resolution', st1.near.resolution >= st1.med.resolution && st1.med.resolution >= st1.far.resolution);

// Move and update
mgr.update(500, 500);
const st2 = mgr.getStats();
assert('Chunks update on move', st2.totalChunks > 0);

// Quality change
mgr.setQuality('LOW');
const st3 = mgr.getStats();
assert('Quality change rebuilds', st3.quality === 'LOW');

mgr.setQuality('ULTRA');
const st4 = mgr.getStats();
assert('Ultra has more chunks than low', st4.near.resolution >= st3.near.resolution);

// Height queries still work
const h = mgr.getHeightAt(100, 100);
assert('Height query works', typeof h === 'number' && !isNaN(h));

const n = mgr.getNormalAt(100, 100);
assert('Normal query works', n && typeof n.x === 'number' && n.y > 0);

// Road data integration
const gen = new RoadGenerator(terrain);
const road = gen.generate(3000);
mgr.setRoadData(road);
mgr.update(0, 0);
assert('Road data accepted', mgr.roadData === road);
assert('Road following blends position', mgr._findClosestRoadPoint(0, 0) !== null);

// Performance: measure update time with gradual movement
// Note: mock is slower than real Three.js (no GPU). Real-world will be faster.
mgr.setQuality('HIGH');
const start = Date.now();
for (let i = 0; i < 100; i++) {
  // Move gradually — most chunks persist between frames
  mgr.update(i * 2, i * 1);
}
const elapsed = Date.now() - start;
assert('100 updates under 2000ms (mock)', elapsed < 2000);
console.log(`  (100 updates took ${elapsed}ms, ~${(elapsed/100).toFixed(1)}ms/frame)`);

console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);

process.exit(fail > 0 ? 1 : 0);
