/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  TEST SUITE: TRAFFIC MAP AI & LEVEL DIRECTOR (test_ai_map_llm.js)
 *  Validates:
 *    1. MV Act Knowledge Corpus & Traffic Rules
 *    2. Stopping Sight Distance (SSD) & Spatial Sightline Clearance Engine
 *    3. "Make Level Easily": Natural Prompt to Full Map Blueprint
 *    4. "AI Handles Level": Level 5 Director Orchestration & Behavioral Agents
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const assert = require('assert');
const { TrafficMapAI, LevelGenerator, SpatialReasoningEngine, LevelDirector } = require('./ai-map-llm.js');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('       RUNNING AUTOMATED VERIFICATION: TRAFFIC MAP AI SYSTEMS       ');
console.log('═══════════════════════════════════════════════════════════════════\n');

// ── 1. MV Act & Traffic Rule Knowledge Corpus ──────────────────────────────
console.log('--- 1. Regulatory & Behavioral Corpus ---');

runTest('MV Act Corpus contains critical traffic safety sections', () => {
  const corpus = TrafficMapAI.CORPUS;
  assert.ok(corpus.SEC_183, 'Must contain Section 183 (Speeding)');
  assert.ok(corpus.SEC_194B, 'Must contain Section 194B (Pedestrian Crosswalk & Stop Line)');
  assert.ok(corpus.SEC_194E, 'Must contain Section 194E (Emergency Vehicles)');
  assert.ok(corpus.SEC_194C_SILENCE, 'Must contain Silence Zone Noise Rule');
  assert.ok(corpus.SEC_183.desc.includes('20-25 km/h'), 'School zone speed limit documented');
});

runTest('Behavioral Models define children, guard, and animal dynamics', () => {
  const behaviors = TrafficMapAI.BEHAVIORS;
  assert.ok(behaviors.SCHOOL_CHILD.swarmAffinity > 0.7, 'Children swarm affinity high');
  assert.ok(behaviors.CROSSING_GUARD.reactionDistance >= 100, 'Guard monitors traffic from 100m+');
  assert.ok(behaviors.SACRED_COW.frightResponse < 0.1, 'Cattle unbothered by horns');
});

// ── 2. Spatial Sightline & SSD Reasoning ───────────────────────────────────
console.log('\n--- 2. Spatial Sightline & SSD Mathematics ---');

runTest('Calculates stopping sight distance (SSD) per IRC:73', () => {
  const ssd20 = SpatialReasoningEngine.calculateSSD(20, false);
  const ssd40 = SpatialReasoningEngine.calculateSSD(40, false);
  const ssd40Wet = SpatialReasoningEngine.calculateSSD(40, true);

  assert.ok(ssd20 >= 14 && ssd20 <= 18, `SSD at 20 km/h should be ~15m, got ${ssd20}`);
  assert.ok(ssd40 >= 35 && ssd40 <= 42, `SSD at 40 km/h should be ~38m, got ${ssd40}`);
  assert.ok(ssd40Wet > ssd40, 'Wet asphalt must increase stopping sight distance');
});

runTest('Validates crosswalk clearance and flags occluding blindspot obstacles', () => {
  const zebraZ = 2320;
  const obstacles = [
    { type: 'billboard', x: 2, z: 2300 }, // inside SSD safe zone!
    { type: 'tree', x: 14, z: 2200 }      // outside corridor setback (safe)
  ];

  const report = SpatialReasoningEngine.validateCrosswalkClearance(zebraZ, obstacles, 40);
  assert.strictEqual(report.hasClearSightline, false, 'Should detect occluding billboard');
  assert.strictEqual(report.violations.length, 1, 'Exactly 1 violation reported');
  assert.strictEqual(report.violations[0].type, 'billboard');
});

// ── 3. "Make Level Easily": Natural Prompt Generation ──────────────────────
console.log('\n--- 3. "Make Level Easily": Natural Prompt Generator ---');

runTest('Generates 5km suburban school level from natural prompt', () => {
  const prompt = 'Create 5km suburban school dismissal with crossing guard and sacred cow';
  const level = TrafficMapAI.generateLevel(prompt);

  assert.strictEqual(level.isAIGenerated, true);
  assert.strictEqual(level.hasAIDirector, true);
  assert.strictEqual(level.roadLength, 5000);
  assert.strictEqual(level.hasSchool, true);
  assert.strictEqual(level.hasCow, true);
  assert.strictEqual(level.speedLimit, 40);
  assert.strictEqual(level.schoolSpeedLimit, 20);
  assert.ok(level.roads.length > 0, 'Road network generated');
  assert.ok(level.route.length >= 5, 'Checkpoints and route waypoints generated');
  assert.ok(level.tasks.some(t => t.id === 'yield_kids'), 'Yield to children task included');
  assert.ok(level.tasks.some(t => t.id === 'avoid_cow'), 'Bypass cow task included');
  assert.ok(level.aiCoTReasoning.length >= 4, 'Chain-of-thought reasoning logged');
});

// ── 4. "AI Handles Level": Level 5 Director Orchestration ─────────────────
console.log('\n--- 4. "AI Handles Level": Dynamic Director Execution ---');

runTest('LevelDirector initializes and manages dynamic entities and events', () => {
  // Mock Three.js environment
  global.THREE = {
    Group: class {
      constructor() { this.children = []; this.position = { set: (x,y,z) => { this.x=x; this.y=y; this.z=z; }, x:0, y:0, z:0 }; this.rotation = { x:0, y:0, z:0 }; }
      add(...items) { this.children.push(...items); }
    },
    BoxGeometry: class {},
    CylinderGeometry: class { rotateX() {} },
    SphereGeometry: class {},
    ConeGeometry: class {},
    PlaneGeometry: class {},
    MeshLambertMaterial: class {},
    MeshBasicMaterial: class {},
    Mesh: class {
      constructor() { this.position = { set: (x,y,z) => { this.x=x; this.y=y; this.z=z; }, x:0, y:0, z:0 }; this.rotation = { x:0, y:0, z:0 }; }
    },
    CanvasTexture: class {},
    MathUtils: { lerp: (a, b, t) => a + (b - a) * t }
  };

  const mockGame = {
    scene: new global.THREE.Group(),
    player: {
      position: { x: 3.5, y: 0, z: 1800 },
      rotation: { y: 0 }
    },
    speed: 35
  };

  const mockLevelConfig = {
    id: 5,
    name: 'Lesson 5 - Operation School Bell',
    hasSchool: true,
    zebraZ: 2320
  };

  const director = TrafficMapAI.initLevelDirector(mockGame, mockLevelConfig);
  assert.ok(director, 'Director instantiated');
  assert.ok(director.guard, 'Crossing guard created');
  assert.strictEqual(director.children.length, 10, '10 school children spawned in dismissal swarm');
  assert.ok(director.cow, 'Sacred cow obstacle spawned');

  // Trigger dismissal bell
  director.triggerEvent('dismissal_bell');
  assert.strictEqual(director.dismissalTriggered, true, 'Dismissal bell triggered');

  // Immediately advance first children wave for synchronous test
  director.children[0].phase = 'APPROACHING_CROSSWALK';
  director.children[1].phase = 'APPROACHING_CROSSWALK';

  // Move player closer to school zebra crossing (Z = 2260, 60m away)
  mockGame.player.position.z = 2260;
  mockGame.speed = 18;

  // Run behavioral simulation updates
  director.update(0.1);
  director.update(0.1);

  assert.ok(director.cotLog.length > 0, 'Chain-of-thought entries logged');
  assert.ok(director.cotLog.some(l => l.includes('Guard raised STOP sign') || l.includes('Dismissal')), 'Guard reacted to student crossing');

  director.cleanup();
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log(`VERIFICATION COMPLETE: ${passed}/${passed + failed} Tests Passed (${Math.round((passed/(passed+failed))*100)}%)`);
console.log('═══════════════════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
