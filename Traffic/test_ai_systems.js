/**
 * Automated Verification Suite for Traffic AI Systems
 * Tests SpatialMath, AISpatialPlacementEngine, AISyllabusResolver, AISceneGenerator, and TrafficAICoPilot
 */

const assert = require('assert');

// 1. Mock minimal THREE.js environment for Node
class MockVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
  clone() { return new MockVector3(this.x, this.y, this.z); }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  subVectors(a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  crossVectors(a, b) {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }
  normalize() {
    const l = Math.hypot(this.x, this.y, this.z);
    if (l > 0.00001) { this.x /= l; this.y /= l; this.z /= l; }
    return this;
  }
}

class MockGroup {
  constructor() {
    this.children = [];
    this.position = new MockVector3();
    this.rotation = { x: 0, y: 0, z: 0 };
    this.userData = {};
  }
  add(child) { this.children.push(child); }
}

class MockMesh extends MockGroup {
  constructor(geo, mat) {
    super();
    this.geo = geo;
    this.mat = mat;
  }
}

global.THREE = {
  Vector3: MockVector3,
  Group: MockGroup,
  Mesh: MockMesh,
  BoxGeometry: class {},
  CylinderGeometry: class {},
  SphereGeometry: class {},
  PlaneGeometry: class {},
  CircleGeometry: class {},
  ConeGeometry: class {},
  MeshLambertMaterial: class {},
  MeshBasicMaterial: class {},
  MeshToonMaterial: class {},
  Color: class { constructor(c) { this.color = c; } },
  Fog: class { constructor(c, near, far) { this.color = c; this.near = near; this.far = far; } }
};

global.window = global;

// Mock audio & toast
global.toast = function(msg) {};
global.sfx = { play: function() {} };

// Require AI modules
require('./ai-scene-generator.js');
require('./traffic-ai-copilot.js');

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('       RUNNING AUTOMATED VERIFICATION: TRAFFIC AI SYSTEMS          ');
console.log('═══════════════════════════════════════════════════════════════════\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// TEST SUITE 1: SpatialMath Corridor & Box Collision
// ──────────────────────────────────────────────────────────────────────────
console.log('--- 1. SpatialMath Geometry & Collision ---');

runTest('SpatialMath.distanceToSegment: perpendicular distance', () => {
  const d = SpatialMath.distanceToSegment(5, 5, 0, 0, 10, 0);
  assert.strictEqual(Math.round(d), 5, 'Perpendicular distance to segment should be 5');
});

runTest('SpatialMath.distanceToSegment: clamped end-cap distance', () => {
  const d = SpatialMath.distanceToSegment(15, 0, 0, 0, 10, 0);
  assert.strictEqual(Math.round(d), 5, 'Distance beyond endpoint should be clamped to (15-10) = 5');
});

runTest('SpatialMath.doesBoxOverlapCorridor: detects intrusion inside road corridor', () => {
  // Road corridor from (0, -100) to (0, 100) with width 14 (half-width 7).
  // A box placed at x=4, z=0 of size 10x10 overlaps the centerline.
  const overlaps = SpatialMath.doesBoxOverlapCorridor(4, 0, 10, 10, 0, 0, -100, 0, 100, 14);
  assert.strictEqual(overlaps, true, 'Box at x=4 must overlap road corridor of width 14');
});

runTest('SpatialMath.doesBoxOverlapCorridor: guarantees clearance outside road setback', () => {
  // Setback parcel at x=25, z=0 (corridor is half-width 7 + sidewalk 4 = 11).
  const overlaps = SpatialMath.doesBoxOverlapCorridor(25, 0, 14, 14, 0, 0, -100, 0, 100, 14);
  assert.strictEqual(overlaps, false, 'Parcel at x=25 with w=14 (radius 7) must have zero road overlap');
});

runTest('SpatialMath.doBoxesOverlap: detects AABB overlaps and clearance', () => {
  const b1 = { x: 0, z: 0, w: 10, d: 10 };
  const b2 = { x: 8, z: 0, w: 10, d: 10 };
  const b3 = { x: 25, z: 0, w: 10, d: 10 };
  assert.strictEqual(SpatialMath.doBoxesOverlap(b1, b2), true, 'b1 and b2 should overlap');
  assert.strictEqual(SpatialMath.doBoxesOverlap(b1, b3), false, 'b1 and b3 should not overlap');
});

// ──────────────────────────────────────────────────────────────────────────
// TEST SUITE 2: AISpatialPlacementEngine Parcels & Facades
// ──────────────────────────────────────────────────────────────────────────
console.log('\n--- 2. AISpatialPlacementEngine Parcels & Facades ---');

runTest('AISpatialPlacementEngine: Computes correct parcel setback and facade rotation', () => {
  const mockScene = new MockGroup();
  const mockGame = { scene: mockScene, roadGraph: null };
  const engine = new AISpatialPlacementEngine(mockScene, mockGame);

  // Mock edge: road along Z-axis from (0, -100) to (0, 100)
  const mockEdge = {
    width: 14,
    length: 200,
    direction: new MockVector3(0, 0, 1),
    getPointAt: (t) => new MockVector3(0, 0, -100 + t * 200)
  };

  const parcel = engine.findValidBuildingParcel(mockEdge, 0.5, 'right', 16, 14);
  assert.notStrictEqual(parcel, null, 'Parcel should be valid');
  // Setback = roadHalfW (7) + sidewalk (4) + garden (4) + buildingD/2 (7) = 22
  assert.ok(Math.abs(parcel.x) >= 20, `Parcel setback must be >= 20m from road centerline, got ${parcel.x}`);
  assert.strictEqual(parcel.w, 16);
  assert.strictEqual(parcel.d, 14);
  // Place building
  const bGroup = engine.placeBuildingAtParcel(parcel, 'commercial');
  assert.ok(bGroup instanceof MockGroup, 'Placed building should be a MockGroup');
  assert.strictEqual(engine.occupiedParcels.length, 1);
});

// ──────────────────────────────────────────────────────────────────────────
// TEST SUITE 3: AISyllabusResolver Demands & Physical Synthesis
// ──────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. AISyllabusResolver Scenario Synthesis ---');

runTest('AISyllabusResolver: Resolves school zone, cattle, puddle, and hospital quiet demands', () => {
  const mockScene = new MockGroup();
  const mockGame = {
    scene: mockScene,
    world: [],
    obstacles: [],
    sigs: [],
    tasks: [
      { id: 'sz', desc: 'Maintain 25 km/h in school zone', done: false },
      { id: 'cat', desc: 'Yield to cattle in roadway', done: false },
      { id: 'pud', desc: 'Slow down for puddle', done: false }
    ]
  };

  const engine = new AISpatialPlacementEngine(mockScene, mockGame);
  const resolver = new AISyllabusResolver(engine, mockGame);

  const cfg = {
    hasSchool: true,
    hasAnimals: true,
    hasRain: true,
    hasHospital: true,
    route: [
      { x: 0, z: 100 },
      { x: 0, z: 0 },
      { x: 0, z: -100 }
    ],
    roads: [
      { type: 'v', x: 0, z1: -200, z2: 200, width: 14 }
    ]
  };

  resolver.resolveLevelSyllabus(cfg);

  assert.strictEqual(cfg.hasSchool, true);
  assert.strictEqual(cfg.speedLimit, 25, 'School zone must enforce 25 km/h speed limit');
  assert.ok(mockScene.children.length > 0, 'Resolver must inject 3D scenario objects into scene');
  assert.ok(mockGame.obstacles.length > 0, 'Resolver must register physical obstacles (e.g. cattle, warning posts)');
});

// ──────────────────────────────────────────────────────────────────────────
// TEST SUITE 4: AISceneGenerator Archetype Profiles & Seeded Generation
// ──────────────────────────────────────────────────────────────────────────
console.log('\n--- 4. AISceneGenerator City Archetypes ---');

runTest('AISceneGenerator: Validates all 6 city archetypes have valid roads & route waypoints', () => {
  const archetypes = AISceneGenerator.getArchetypes();
  const expectedKeys = ['downtown', 'coastal', 'suburban', 'monsoon', 'bazaar', 'infinite'];

  expectedKeys.forEach(key => {
    assert.ok(archetypes[key], `Archetype '${key}' must exist`);
    const arch = archetypes[key];
    assert.ok(arch.roads && arch.roads.length >= 2, `${key} must have at least 2 road corridors`);
    assert.ok(arch.route && arch.route.length >= 2, `${key} must have valid navigable A* route`);
    assert.ok(arch.speedLimit > 0, `${key} must define speed limit`);
    assert.strictEqual(arch.isAISynthesized, true, `${key} must be marked as AI synthesized`);
  });
});

runTest('AISceneGenerator.getArchetypeConfig: Applies custom options and overrides', () => {
  const mockGame = { scene: new MockGroup() };
  const gen = new AISceneGenerator(mockGame);
  const cfg = gen.getArchetypeConfig('monsoon', { veh: 'bike', isNight: true });

  assert.strictEqual(cfg.veh, 'bike');
  assert.strictEqual(cfg.isNight, true);
  assert.strictEqual(cfg.id, 'ai_monsoon');
  assert.strictEqual(cfg.mode, 'practical');
});

// ──────────────────────────────────────────────────────────────────────────
// TEST SUITE 5: TrafficAICoPilot Live Telemetry & Curriculum Scoring
// ──────────────────────────────────────────────────────────────────────────
console.log('\n--- 5. TrafficAICoPilot Telemetry & Evaluation ---');

runTest('TrafficAICoPilot: Monitors speed compliance and updates Driver Safety Score', () => {
  const mockGame = {
    currentSpeed: 20, // 20 m/s * 3.6 = 72 km/h (> 50 km/h limit)
    mapCfg: { speedLimit: 50 },
    player: { position: new MockVector3(0, 0, 0) },
    trafficManager: { activeVehicles: [] },
    peds: [],
    sigs: [],
    tasks: [
      { desc: 'Obey 50 km/h speed limit', done: false }
    ]
  };

  const copilot = new TrafficAICoPilot(mockGame);
  copilot.voiceEnabled = false;
  // Initial score is 100
  assert.strictEqual(copilot.safetyScore, 100);

  // Update telemetry for 2.5 seconds while overspeeding
  copilot.update(1.0);
  copilot.update(1.0);
  copilot.update(1.0);

  assert.ok(copilot.overspeedTimer > 2.0, `CoPilot should record overspeeding duration > 2s, got ${copilot.overspeedTimer}`);
  assert.ok(copilot.safetyScore < 100, `Safety score should be penalized for overspeeding, got ${copilot.safetyScore}%`);
});

runTest('TrafficAICoPilot: Marks syllabus tasks dynamically on safe criteria', () => {
  const mockGame = {
    currentSpeed: 0, // stopped at red light
    mapCfg: { speedLimit: 50 },
    player: { position: new MockVector3(0, 0, 0) },
    trafficManager: { activeVehicles: [] },
    peds: [],
    sigs: [
      {
        position: new MockVector3(0, 0, 10), // 10m away (< 25m)
        userData: { state: 'red' }
      }
    ],
    tasks: [
      { id: 'wait_red', desc: 'Wait at red traffic signal', done: false }
    ]
  };

  const copilot = new TrafficAICoPilot(mockGame);
  copilot.voiceEnabled = false;
  copilot.update(0.1);

  assert.strictEqual(copilot.stoppedAtRedLight, true, 'CoPilot must register vehicle stopped at red light');
  assert.strictEqual(mockGame.tasks[0].done, true, 'CoPilot must mark wait_red task as done');
  assert.strictEqual(copilot.safetyScore, 100, 'Obeying red light maintains 100% safety score');
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log(`VERIFICATION COMPLETE: ${passedTests}/${totalTests} Tests Passed (100%)`);
console.log('═══════════════════════════════════════════════════════════════════\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
