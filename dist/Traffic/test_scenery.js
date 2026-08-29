const fs = require('fs');

// Mock THREE.js
class MockFloat32BufferAttribute {
  constructor(arr, itemSize) { this.array = arr; this.itemSize = itemSize; this.count = arr.length / itemSize; }
  needsUpdate = false;
}
class MockBufferAttribute {
  constructor(arr, itemSize) { this.array = arr; this.itemSize = itemSize; }
}
class MockInstancedMesh {
  constructor(geo, mat, count) {
    this.geometry = geo; this.material = mat;
    this.instanceMatrix = { count, needsUpdate: false, array: new Float32Array(count * 16) };
    this.count = 0;
  }
  setMatrixAt(i, mat) { this.count = Math.max(this.count, i + 1); }
}
class MockGeometry {
  constructor() { this.attributes = {} }
  setAttribute(n, a) { this.attributes[n] = a; }
  computeVertexNormals() {}
  dispose() {}
  translate(x, y, z) { return this; }
}
class MockMaterial {
  constructor(opts = {}) { Object.assign(this, opts); }
  dispose() {}
}
class MockMesh {
  constructor(geo, mat) { this.geometry = geo; this.material = mat; this.position = { set: () => {}, copy: () => {} }; this.rotation = { set: () => {} }; this.scale = { set: () => {} }; }
  updateMatrix() {}
}
class MockObject3D {
  constructor() { this.position = { set: () => {} }; this.rotation = { set: () => {} }; this.scale = { set: () => {} }; this.matrix = {}; }
  updateMatrix() {}
}
class MockColor {
  constructor() { this.r = 0; this.g = 0; this.b = 0; }
  setHex(hex) { this.r = ((hex >> 16) & 0xff) / 255; this.g = ((hex >> 8) & 0xff) / 255; this.b = (hex & 0xff) / 255; }
  multiplyScalar(s) { this.r *= s; this.g *= s; this.b *= s; }
}

global.THREE = {
  Float32BufferAttribute: MockFloat32BufferAttribute,
  BufferAttribute: MockBufferAttribute,
  InstancedMesh: MockInstancedMesh,
  PlaneGeometry: class extends MockGeometry {
    constructor(s, s2, res) {
      super();
      const c = (res + 1) * (res + 1);
      this.attributes.position = {
        count: c,
        getX: () => 0, getY: () => 0, getZ: () => 0,
        setY: () => {}, needsUpdate: false,
      };
    }
    rotateX() { return this; }
  },
  ConeGeometry: class extends MockGeometry {},
  CylinderGeometry: class extends MockGeometry {},
  BoxGeometry: class extends MockGeometry {},
  DodecahedronGeometry: class extends MockGeometry {},
  MeshLambertMaterial: class extends MockMaterial {},
  Mesh: MockMesh,
  Object3D: MockObject3D,
  Color: MockColor,
};

let tc = fs.readFileSync('proc_terrain.js', 'utf8').split('// Make available globally')[0];
tc += '\nmodule.exports = { ProcTerrain, RoadGenerator, RoadMeshGenerator, RoadManager, SpatialHash, TerrainChunkManager, TerrainMeshGenerator, SeededPerlin, mulberry32 };';
const tm = { exports: {} };
new Function('module', 'exports', tc)(tm, tm.exports);

let sc = fs.readFileSync('proc_scenery.js', 'utf8').split('// Make available globally')[0];
sc += '\nmodule.exports = { SceneryManager, BuildingPlacer };';
const sm = { exports: {} };
new Function('module', 'exports', sc)(sm, sm.exports);

const { ProcTerrain, RoadGenerator } = tm.exports;
const { SceneryManager, BuildingPlacer } = sm.exports;

let pass = 0, fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log(`  PASS: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name}`); }
}

const mockScene = { add: () => {}, remove: () => {} };

console.log('--- SceneryManager Tests ---');
const terrain = new ProcTerrain({ seed: 42 });
const mgr = new SceneryManager(mockScene, terrain, { density: 1.0, viewDistance: 100 });

mgr.update(0, 0);
const s1 = mgr.getStats();
assert('Trees placed', s1.totalInstances > 0);
assert('Cells activated', s1.activeCells > 0);

// Move and update
mgr.update(50, 50);
const s2 = mgr.getStats();
assert('More scenery after move', s2.totalInstances >= s1.totalInstances);

// Throttle: update at same position should not add much
mgr.update(51, 51);
const s3 = mgr.getStats();
assert('Throttle works', s3.activeCells <= s2.activeCells + 5);

// Clear
mgr.clear();
const s4 = mgr.getStats();
assert('Clear removes all', s4.totalInstances === 0 && s4.activeCells === 0);

console.log('--- BuildingPlacer Tests ---');
const gen = new RoadGenerator(terrain);
const road = gen.generate(3000);
const placer = new BuildingPlacer(mockScene, terrain, road, { density: 0.8 });

placer.generate();
const pb = placer.getStats();
assert('Buildings placed', pb.buildingCount > 0);

// All buildings should be near the road
assert('Building count reasonable', pb.buildingCount < road.fine.length);

placer.clear();
assert('Clear removes buildings', placer.getStats().buildingCount === 0);

console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);

process.exit(fail > 0 ? 1 : 0);
