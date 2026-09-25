/**
 * Level linter — static validation for Traffic Academy levels.
 * Run: node Traffic/tools/validate-levels.js [--strict]
 * Exit code: number of ERRORS (warnings never fail).
 * Checks mirror game_core.js _checkTasks + map builders, so violations here
 * are dead tasks, off-map spawns, or softlocks in-game.
 */
const fs = require('fs');
const path = require('path');

const LEVELS_DIR = path.join(__dirname, '..', 'levels');

// Task targets that actually complete (must mirror _checkTasks in game_core.js)
const TASK_TARGETS = {
  stop: new Set(['stationary', 'walking_speed', 'parking_zone', 'parking_spot',
    'red_light', 'red_signal', 'cow', 'cow_moved']),
  reach: new Set(['destination', 'green_light', 'parking_spot', 'market_zone',
    'left_side', 'left_lane', 'left_lane_changed', 'overtake_bus', 'merged_back',
    'forward_space', 'away_gate', 'visitor_parking', 'main_road', 'guard_signal',
    'volunteer_signal', 'gap_spot', 'finish']),
  avoid: new Set(['honk', 'speed_zone', 'speed_night', 'speed_puddle',
    'speed_hospital', 'pedestrian', 'collision', 'ambulance', 'stop_sudden',
    'hospital_zone']),
  toggle: new Set(['seatbelt', 'hazards', 'indicator', 'indicator_right', 'headlights']),
  enter_vehicle: null, // any target (or none) completes via the enter latch
};
const REACH_CHECKPOINT = /^checkpoint_(\d+)$/;

const NPC_PROFILES = new Set(['normal', 'aggressive', 'reckless_bike', 'rulebreaker',
  'cautious', 'teen', 'elderly', 'delivery', 'tourist',
  'impatient_taxi', 'school_parent', 'school_bus']);
const PED_PROFILES = new Set(['normal', 'rusher', 'aggressive', 'cautious', 'child',
  'elderly_ped', 'phone_user', 'kid_dasher']);
// Cast roster + role patterns (AGENTS.md house rules)
const SPEAKER_OK = /shamika|aarush|ansh|avani|sanjana|neel|desai|shinde|mummy|papa|principal|family|shop|guard|radio|system|narrator|uncle|taxi|biker|voice|officer|teacher|student|doctor|server|chef|manager/i;

const errors = [];   // { file, msg }
const warnings = []; // { file, msg }
const err = (lv, msg, file) => errors.push({ file: file || '', msg: `[ERROR] L${lv}: ${msg}` });
const warn = (lv, msg, file) => warnings.push({ file: file || '', msg: `[WARN] L${lv}: ${msg}` });

function loadLevels() {
  const files = fs.readdirSync(LEVELS_DIR).filter(f => f.endsWith('.js'));
  const levels = [];
  for (const f of files) {
    const g = { LVS: [] };
    try {
      // Level files are browser scripts: window.LVS = window.LVS || []; window.LVS.push({...})
      new Function('window', fs.readFileSync(path.join(LEVELS_DIR, f), 'utf8'))(g);
    } catch (e) {
      errors.push({ file: f, msg: `[ERROR] ${f}: parse/exec failed: ${e.message}` });
      continue;
    }
    for (const lv of g.LVS) {levels.push({ file: f, lv });}
  }
  return levels;
}

function distToRoad(px, pz, r) {
  if (r.type === 'v' && typeof r.x === 'number') {
    const z1 = Math.min(r.z1, r.z2), z2 = Math.max(r.z1, r.z2);
    if (pz < z1 || pz > z2) {return Infinity;}
    return Math.abs(px - r.x);
  }
  if (r.type === 'h' && typeof r.z === 'number') {
    const x1 = Math.min(r.x1, r.x2), x2 = Math.max(r.x1, r.x2);
    if (px < x1 || px > x2) {return Infinity;}
    return Math.abs(pz - r.z);
  }
  return Infinity;
}

function checkLevel(file, lv) {
  const id = lv.id !== undefined ? lv.id : file;
  const E = (i, m) => err(i, m, file);
  const W = (i, m) => warn(i, m, file);
  const roads = lv.roads || [];

  // 1. Tasks reference completable targets
  for (const t of lv.tasks || []) {
    if (!TASK_TARGETS.hasOwnProperty(t.type)) {
      E(id, `task '${t.id}' has unknown type '${t.type}' (never completes)`);
      continue;
    }
    const allowed = TASK_TARGETS[t.type];
    if (allowed === null) {continue;}
    if (t.type === 'reach' && REACH_CHECKPOINT.test(t.target || '')) {continue;}
    if (!allowed.has(t.target)) {
      E(id, `task '${t.id}' target '${t.target}' has no engine branch (never completes)`);
    }
  }

  // 2. Route points sit on declared roads (route[0] gets driveway tolerance:
  //    suburban levels spawn at the house, off the asphalt by design)
  if (roads.length && lv.route) {
    lv.route.forEach((pt, i) => {
      if (typeof pt.x !== 'number' || typeof pt.z !== 'number') {
        E(id, `route[${i}] missing numeric x/z`);
        return;
      }
      let best = Infinity, bestW = 14;
      for (const r of roads) {
        const d = distToRoad(pt.x, pt.z, r);
        if (d < best) { best = d; bestW = r.width || 14; }
      }
      const tol = (i === 0 ? bestW / 2 + 20 : bestW / 2 + 8);
      if (best === Infinity || best > tol) {
        E(id, `route[${i}] (${pt.x},${pt.z}) is off every road (nearest edge ${best === Infinity ? 'none' : best.toFixed(1) + 'm'})`);
      }
    });
  }

  // 3. Spawn clearance: garage/player/route[0] vs plot boxes + colliding problems
  const solids = [];
  for (const p of lv.plots || []) {
    if (!p || typeof p.x !== 'number') {continue;}
    if (p.kind === 'garage') {continue;} // open structure, walls collide individually
    const q = Math.abs(((p.rotY || 0) % Math.PI));
    const swap = Math.abs(q - Math.PI / 2) < 0.1;
    const hw = ((swap ? p.d : p.w) || 12) / 2, hd = ((swap ? p.w : p.d) || 10) / 2;
    solids.push({ x: p.x, z: p.z, hw: hw + 1, hd: hd + 1, what: `plot ${p.kind}` });
  }
  for (const p of lv.roadProblems || []) {
    if (p.kind === 'barricade') {solids.push({ x: p.x, z: p.z, hw: 3, hd: 3, what: 'barricade' });}
    if (p.kind === 'parked_truck') {solids.push({ x: p.x, z: p.z, hw: 6, hd: 6, what: 'parked_truck' });}
  }
  const spawns = [];
  if (lv.garageSpawn) {spawns.push({ ...lv.garageSpawn, what: 'garageSpawn' });}
  if (lv.playerSpawn) {spawns.push({ ...lv.playerSpawn, what: 'playerSpawn' });}
  if (lv.route && lv.route[0]) {spawns.push({ ...lv.route[0], what: 'route[0]' });}
  for (const s of spawns) {
    for (const b of solids) {
      if (Math.abs(s.x - b.x) < b.hw && Math.abs(s.z - b.z) < b.hd) {
        E(id, `${s.what} (${s.x},${s.z}) sits inside ${b.what} at (${b.x},${b.z})`);
      }
    }
  }

  // 4. School coordinate consistency (suburban path NEEDS schoolZ; the
  //    legacy generic builder falls back to hardcoded coords, so warn there)
  if (lv.hasSchool) {
    const needsCoords = !!(lv.isSuburbanNeighborhood || (lv.themeType === 'suburban_neighborhood'));
    if (lv.schoolZ === undefined) {
      (needsCoords ? err : warn)(id, 'hasSchool but no schoolZ (zones fall back to legacy coords)');
    }
    if (lv.zebraZ !== undefined && lv.schoolZ !== undefined && Math.abs(lv.zebraZ - lv.schoolZ) > 80) {
      W(id, `zebraZ (${lv.zebraZ}) is >80m from schoolZ (${lv.schoolZ})`);
    }
    if (lv.flasherZ !== undefined && lv.schoolZ !== undefined && lv.flasherZ === lv.schoolZ) {
      W(id, 'flasherZ equals schoolZ (no deceleration room)');
    }
    if (lv.schoolZ !== undefined && (!lv.route || !lv.route.length)) {
      W(id, 'hasSchool but no route to drive there');
    }
  }

  // 5. NPC/ped profile keys exist
  const checkMix = (mix, known, what) => {
    if (!mix) {return;}
    for (const k of Object.keys(mix)) {
      if (!known.has(k)) {E(id, `${what} references unknown profile '${k}'`);}
    }
  };
  checkMix(lv.npcMix, NPC_PROFILES, 'npcMix');
  checkMix(lv.pedMix, PED_PROFILES, 'pedMix');
  for (const n of lv.npcs || []) {
    if (n.profileKey && !NPC_PROFILES.has(n.profileKey)) {
      E(id, `scripted npc '${n.type}' has unknown profileKey '${n.profileKey}'`);
    }
    if (n.rival && !n.name) {W(id, 'rival npc without a name (toast/nametag fall back to generic)');}
  }

  // 6. Dialogue speakers come from the cast roster (Title-Case house rule aside)
  const story = lv.story || {};
  for (const d of story.dialogue || []) {
    if (d.speaker && !SPEAKER_OK.test(d.speaker)) {
      W(id, `dialogue speaker '${d.speaker}' is outside the cast roster`);
    }
  }
  // Rival should speak at least once (otherwise the +500 has no fiction)
  for (const n of lv.npcs || []) {
    if (n.rival) {
      const speaks = (story.dialogue || []).some(d => d.speaker && n.name &&
        d.speaker.toLowerCase().includes(n.name.toLowerCase().split(' ')[0]));
      if (!speaks) {W(id, `rival '${n.name}' never speaks in story.dialogue`);}
    }
  }

  // 7. Required fields + known mode + spawn schema sanity
  for (const f of ['id', 'name', 'tasks']) {
    if (lv[f] === undefined) {E(id, `missing required field '${f}'`);}
  }
  const MODES = new Set(['practical', 'quiz', 'theory', 'free_roam']);
  if (lv.mode !== undefined && !MODES.has(lv.mode)) {
    E(id, `unknown mode '${lv.mode}' (expected practical/quiz/theory/free_roam)`);
  }
  if (lv.playerStart && (typeof lv.playerStart.x !== 'number' || typeof lv.playerStart.z !== 'number')) {
    E(id, 'playerStart needs numeric x/z');
  }
}

const levels = loadLevels();
// Duplicate level ids across files (second definition silently wins in buildLevelMap)
{
  const seen = {};
  for (const { file, lv } of levels) {
    const k = String(lv.id);
    if (seen[k]) {err(lv.id, `duplicate id (also in ${seen[k]})`, file);}
    else {seen[k] = file;}
  }
}
for (const { file, lv } of levels) {
  try { checkLevel(file, lv); }
  catch (e) { err(lv.id || file, `linter crashed: ${e.message}`); }
}

// --scope=file1,file2 (default: all): exit code counts errors in scope only,
// so the build stays green while the backlog of legacy levels is worked down.
// Full report always prints.
const scopeArg = process.argv.find(a => a.startsWith('--scope='));
const scope = scopeArg
  ? scopeArg.slice('--scope='.length).split(',').map(s => s.trim().replace(/\.js$/, ''))
  : null;
const inScope = (file) => !scope || scope.includes(file.replace(/\.js$/, ''));

for (const w of warnings) {console.log(w.msg);}
for (const e of errors) {console.log(e.msg);}
let failCount = 0;
if (scope) {
  failCount = errors.filter(e => scope.includes((e.file || '').replace(/\.js$/, ''))).length;
} else {
  failCount = errors.length;
}
console.log(`\n${levels.length} levels checked: ${errors.length} error(s), ${warnings.length} warning(s)` + (scope ? ` [scope: ${scope.join(',')}, scoped errors: ${failCount}]` : ''));
process.exit(failCount ? 1 : 0);
