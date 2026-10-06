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

// Task targets that actually complete in the inline `_checkTasks` switch.
const INLINE_TASK_TARGETS = {
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

// Objectives needing more than a one-line test are implemented in
// task-evaluators.js, dispatched by a `type/target` key. They are read from
// that file rather than duplicated here, so this linter cannot drift from the
// engine and start reporting working objectives as dead tasks again.
const EVALUATOR_TARGETS = (() => {
  const p = path.join(__dirname, '..', 'task-evaluators.js');
  const out = new Set();
  if (!fs.existsSync(p)) return out;
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/^\s*'([a-z_]+)\/([a-z_0-9]+)':\s*function/gm)) {
    out.add(m[1] + '/' + m[2]);
  }
  return out;
})();

function hasTaskBranch(type, target) {
  if (EVALUATOR_TARGETS.has(type + '/' + target)) return true;
  const set = INLINE_TASK_TARGETS[type];
  if (set === null) return true;              // enter_vehicle
  return !!set && set.has(target);
}

const NPC_PROFILES = new Set(['normal', 'aggressive', 'reckless_bike', 'rulebreaker',
  'cautious', 'teen', 'elderly', 'delivery', 'tourist',
  'impatient_taxi', 'school_parent', 'school_bus']);
const PED_PROFILES = new Set(['normal', 'rusher', 'aggressive', 'cautious', 'child',
  'elderly_ped', 'phone_user', 'kid_dasher']);
// Cast roster + role patterns (AGENTS.md house rules)
//
// Extended for MUMBAI 4000. The noir cast is police and witnesses rather than
// shopkeepers, and a roster that cannot name an Inspector Kadam would push every
// film line out of the film and back into the level briefing — exactly backwards.
const SPEAKER_OK = /shamika|aarush|ansh|avani|sanjana|neel|desai|shinde|mummy|papa|principal|family|shop|guard|radio|system|narrator|uncle|taxi|biker|voice|officer|teacher|student|doctor|server|chef|manager|kadam|sawant|pawar|vyas|iyer|khan|deshpande|constable|inspector|driver|passenger|book|notebook|journalist/i;

// Story Mode concept tiers.
//
// A lesson's film may only invoke a concept at or below its own tier. This is
// what stops the campaign front-loading its own plot: Level 1 cannot mention a
// signal OVERRIDE, because at Level 1 the player does not yet know overrides
// exist, and a film that references one teaches the wrong lesson first.
//
// Tier boundaries follow the syllabus order in README/PROJECTS, not arbitrary
// grouping: each tier unlocks the concept the syllabus itself unlocks there.
const CONCEPT_TIER = {
  signal: 1, whiteline: 1, zebra: 1, pedestrian: 2, ambulance: 2, rain: 2,
  puddle: 2, parking: 2, honking: 3, market: 3, festival: 3, narrow: 3,
  rage: 4, monsoon: 4, signs: 4, animals: 4, auto: 4, toll: 4,
  blind_corner: 5, hill: 5, busstop: 5, oneway: 5, hospital: 5,
  night: 6, wrongside: 6, merge: 6, construction: 6, visibility: 6,
  lanes: 7, school: 7, grid: 7
};

// Level → the highest concept tier that lesson's film may use. Mirrors the
// syllabus's own escalation; 53 is the final evaluation and opens everything.
function tierForLevel(id) {
  if (id <= 4) {return 1;}
  if (id <= 9) {return 2;}
  if (id <= 20) {return 3;}
  if (id <= 30) {return 4;}
  if (id <= 39) {return 5;}
  if (id <= 50) {return 6;}
  return 7;
}

// Words that betray a concept being used in a film's prose. Matched against shot
// subtitles and titles only — never against camera coordinates, which are all
// numbers and would false-positive constantly.
const CONCEPT_WORDS = [
  ['merge', /merge|lane change|overtak|joining/i],
  ['wrongside', /wrong side|wrong way|one-way|one way/i],
  ['visibility', /fog|zero visibility|smoke|blind/i],
  ['construction', /construction|barricade|diversion/i],
  ['oneway', /one-way|one way/i],
  ['hill', /hill|gradient|ghats|ghat/i],
  ['blind_corner', /blind corner/i],
  ['busstop', /bus stop/i],
  ['hospital', /hospital/i],
  ['festival', /festival|ganpati|diwali/i],
  ['toll', /toll/i],
  ['auto', /auto[- ]?rickshaw/i],
  ['animals', /cow|cattle|buffalo|stray dog/i],
  ['signs', /sign board|signboard|traffic sign/i],
  ['rage', /road rage|abuse/i],
  ['monsoon', /monsoon/i],
  ['market', /market|bazaar/i],
  ['honking', /horn|honk/i],
  ['ambulance', /ambulance/i],
  ['puddle', /puddle|waterlog|splash/i],
  ['night', /\bnight\b|raat|3am|3:14|2am|midnight/i],
  ['parking', /park|parking/i],
  ['pedestrian', /pedestrian|zebra|crosswalk/i]
];

/** The highest concept tier a piece of film prose is allowed to name. */
function maxConceptTier(text) {
  if (!text) {return 0;}
  let max = 0;
  for (const [name, re] of CONCEPT_WORDS) {
    if (!re.test(text)) {continue;}
    const tier = CONCEPT_TIER[name] || 7;
    if (tier > max) {max = tier;}
  }
  return max;
}

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
    if (!INLINE_TASK_TARGETS.hasOwnProperty(t.type)) {
      E(id, `task '${t.id}' has unknown type '${t.type}' (never completes)`);
      continue;
    }
    if (t.type === 'reach' && REACH_CHECKPOINT.test(t.target || '')) {continue;}
    if (!hasTaskBranch(t.type, t.target)) {
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
    if (p.kind === 'garage') {
      // Garages collide as three individual walls, not one box (so the opening
      // stays drivable). Mirrors game_core.js `_buildPlotBuildings` mkWall():
      //   world pos = (x + lx*cos + lz*sin, z - lx*sin + lz*cos)
      //   back wall west at lx=-w/2, sides at lz=±d/2; opening faces +x local.
      // Modelling these is what caught the Lesson 1 spawn overlap: the old
      // check skipped garages entirely and reported a clean spawn that the
      // engine then resolved by shoving the player on frame one.
      const gwid = p.w || 6.5, gdep = p.d || 8;
      const ca = Math.cos(p.rotY || 0), sa = Math.sin(p.rotY || 0);
      const wall = (bw, bd, lx, lz, what) => solids.push({
        x: p.x + lx * ca + lz * sa,
        z: p.z - lx * sa + lz * ca,
        hw: bw / 2 + 0.1, hd: bd / 2 + 0.1,
        what: `garage ${what}`
      });
      wall(0.3, gdep, -gwid / 2, 0, 'back wall');
      wall(gwid, 0.3, 0, -gdep / 2, 'left wall');
      wall(gwid, 0.3, 0, gdep / 2, 'right wall');
      continue;
    }
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
  // The engine resolves collisions with the player as a CIRCLE of radius pR
  // (game_core.js _uobs: overlap = pR + halfExtent - |delta|). So a spawn that
  // is not strictly inside a box can still overlap once the body radius is
  // included — which is exactly how Lesson 1 spawned inside a garage wall.
  const PLAYER_R = 1.5;
  for (const s of spawns) {
    for (const b of solids) {
      if (Math.abs(s.x - b.x) < b.hw && Math.abs(s.z - b.z) < b.hd) {
        E(id, `${s.what} (${s.x},${s.z}) sits inside ${b.what} at (${b.x},${b.z})`);
      } else if (Math.abs(s.x - b.x) < b.hw + PLAYER_R && Math.abs(s.z - b.z) < b.hd + PLAYER_R) {
        // Inside the player's body radius: the engine will push on frame one.
        const gapX = b.hw + PLAYER_R - Math.abs(s.x - b.x);
        const gapZ = b.hd + PLAYER_R - Math.abs(s.z - b.z);
        E(id, `${s.what} (${s.x},${s.z}) is within the ${PLAYER_R}m player radius of ` +
          `${b.what} at (${b.x},${b.z}) — overlap ${Math.min(gapX, gapZ).toFixed(2)}m ` +
          `(spawns in collision)`);
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
    if (needsCoords && lv.schoolZ !== undefined && (!lv.route || !lv.route.length)) {
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

// ── Story Mode coverage report ─────────────────────────────────────────────
// Run: node Traffic/tools/validate-levels.js --story-report
//
// Reports, per lesson, whether it is actually filmable: an authored map, a
// spawn that clears obstacles, cast for the characters, story beats, and a
// campaign prologue. Also cross-checks the campaign overlay against the levels:
// cutscene cast must sit on a road, borrowed profileKeys must exist, and every
// subtitle must be reused verbatim from that level's story.dialogue[].
if (process.argv.includes('--story-report')) {
  const campaignPath = path.join(__dirname, '..', 'story', 'campaign.js');
  const stagePath = path.join(__dirname, '..', 'story', 'stage.js');
  let campaign = {};
  let stage = {};
  try {
    const w = { STORY: {}, STAGE: {} };
    new Function('window', fs.readFileSync(campaignPath, 'utf8'))(w);
    campaign = w.STORY || {};
  } catch (e) {
    console.log(`\n[STORY] could not load story/campaign.js: ${e.message}`);
  }
  try {
    const w = { STAGE: {} };
    new Function('window', fs.readFileSync(stagePath, 'utf8'))(w);
    stage = w.STAGE || {};
  } catch (e) {
    console.log(`\n[STORY] could not load story/stage.js: ${e.message}`);
  }

  // The shot floor. Mirrors story/shots.js MIN_SHOT; duplicated deliberately so a
  // violation is caught statically rather than only at runtime, where a 1s shot
  // looks identical to an intentional one.
  const MIN_SHOT = 4;

  // Shared shot-shape checks, applied identically to prologues and to every beat
  // shot. A beat that is 1.5s long is exactly as broken as a 1.5s prologue shot.
  function checkShots(shots, lvId, castIds, solids, label, dialogueKeys) {
    (shots || []).forEach((shot, i) => {
      const where = `${label} shot ${i + 1}`;
      if (!Array.isArray(shot.from) || shot.from.length !== 3) {
        err(lvId, `${where} needs a 3-number 'from' camera position`);
      }
      if (!Array.isArray(shot.look) || shot.look.length !== 3) {
        err(lvId, `${where} needs a 3-number 'look' target`);
      }
      if (!(shot.dur > 0)) {
        err(lvId, `${where} needs a positive 'dur'`);
      } else if (shot.dur < MIN_SHOT) {
        // The rule that made the first pass read as a slideshow. Hard error, not
        // a warning: story/shots.js would silently clamp it, which hides the
        // authoring mistake from the person who made it.
        err(lvId, `${where} is ${shot.dur}s — below the ${MIN_SHOT}s shot floor (cutting away sooner reads as a slideshow, not a scene)`);
      }
      if (shot.sub) {
        const key = `${(shot.sub.speaker || '').trim()}|${(shot.sub.line || '').trim()}`;
        if (dialogueKeys && dialogueKeys.size && !dialogueKeys.has(key)) {
          err(lvId, `${where} subtitle is not reused verbatim from story.dialogue`);
        }
        if (shot.sub.speaker && !SPEAKER_OK.test(shot.sub.speaker)) {
          warn(lvId, `${where} speaker '${shot.sub.speaker}' is outside the cast roster`);
        }
      }
      // Tier gate: a lesson's film may only name concepts its syllabus has taught.
      //
      // `prior: true` exempts a shot. That flag means "this depicts what happened
      // BEFORE the lesson, not what the lesson teaches" — a cold open set at 3am
      // is allowed to be at 3am even in Lesson 1, because the player is being
      // shown the crime, not being taught night driving. It is an explicit,
      // greppable exemption rather than a loosened rule, and the budget check
      // below stops a film marking everything prior to bypass the gate entirely.
      const tier = tierForLevel(lvId);
      const prose = [shot.sub && shot.sub.line, shot.title].filter(Boolean).join(' ');
      const used = maxConceptTier(prose);
      if (used > tier && shot.prior !== true) {
        err(lvId, `${where} references a tier-${used} concept but L${lvId} only teaches up to tier ${tier} (mark the shot prior: true if it depicts what happened BEFORE the lesson)`);
      }
      for (const m of (shot.motion || [])) {
        if (!castIds.some((c) => c === m.id)) {
          err(lvId, `${where} animates unknown cast id '${m.id}'`);
        }
      }
      // Camera-in-solid check: a camera parked inside a house renders as a blank
      // wall across most of the frame — silent, no error, easy to ship. Anchored
      // shots are exempt; their anchors only exist once cinematics.js has built
      // the set, so they cannot be checked statically here.
      if (shot.anchor) {return;}
      for (const key of ['from', 'to', 'look']) {
        const v = shot[key];
        if (!Array.isArray(v) || v.length !== 3) {continue;}
        for (const s of solids) {
          if (v[0] > s.x1 && v[0] < s.x2 && v[2] > s.z1 && v[2] < s.z2) {
            err(lvId, `${where} '${key}' is inside ${s.tag} at (${v[0]}, ${v[2]}) — that shot renders as a blank wall`);
          }
        }
      }
    });
  }

  /** Solids a camera must never be inside. Built from a stage or a level. */
  function solidsFrom(cfgLike) {
    const solids = [];
    for (const p of ((cfgLike && cfgLike.plots) || [])) {
      if (!p) {continue;}
      const d = p.d || 12, w = p.w || 14;
      solids.push({
        tag: `${p.kind || 'plot'} '${p.id || '?'}'`,
        x1: p.x - d / 2, x2: p.x + d / 2, z1: p.z - w / 2, z2: p.z + w / 2
      });
    }
    return solids;
  }

  // Only real numbered lessons. Free-roam / custom entries have no syllabus to
  // dramatise, so they are excluded from the filmability figures.
  const numbered = levels
    .filter(({ lv }) => typeof lv.id === 'number' && lv.id < 99 &&
      !/^\s*(Free Roam|Bonus)/i.test(String(lv.name || '')))
    .sort((a, b) => a.lv.id - b.lv.id);

  const rows = [];
  let withMap = 0, withCast = 0, withBeats = 0, withPrologue = 0, withStage = 0, filmable = 0;

  for (const { lv } of numbered) {
    const story = campaign[String(lv.id)] || null;
    const stg = stage[String(lv.id)] || null;
    const roads = lv.roads || [];
    const hasMap = roads.length > 0;
    const hasSpawn = !!(lv.garageSpawn || lv.playerSpawn || lv.playerStart);
    // Cast now lives in campaign.js (blocking is direction, which is narrative).
    // The level's own `cast` remains the fallback for pre-split entries.
    const cast = (story && story.cast && story.cast.length) ? story.cast : (lv.cast || []);
    const beats = (lv.story && lv.story.dialogue) || [];
    const hasPrologue = !!(story && story.prologue && story.prologue.length);
    const hasStageMap = !!(stg && stg.map);

    if (hasMap) withMap++;
    if (cast.length) withCast++;
    if (beats.length) withBeats++;
    if (hasPrologue) withPrologue++;
    if (hasStageMap) withStage++;
    // Filmable now means: a film exists AND it has somewhere to be filmed.
    // Before the stage split, a lesson with a prologue but no purpose-built map
    // was counted filmable while in fact its shots pointed at gameplay
    // geometry — checkpoint pads, spawn discs and live traffic in frame.
    if (hasStageMap && cast.length && beats.length && hasPrologue) filmable++;

    // Beat count, for the coverage table.
    const beatShots = ((story && story.beats) || []).reduce((n, b) => n + ((b && b.shots) ? b.shots.length : 0), 0);

    rows.push({
      id: lv.id,
      name: lv.name,
      map: hasMap ? (hasSpawn ? 'Y' : 'no-spawn') : '-',
      stage: hasStageMap ? 'Y' : '-',
      cast: cast.length,
      beats: beatShots,
      pro: hasPrologue ? 'Y' : '-',
      carry: story && story.carry ? 'Y' : '-'
    });

    // ── Stage map: the one rule that makes a film map a film map ──
    if (stg && stg.map) {
      if (!(stg.map.route && stg.map.route.length === 0)) {
        // Without this, _buildRouteCheckpoints falls back to a hardcoded
        // five-point demo route and the film gets five glowing green pads.
        E(lv.id, `stage map must declare route: [] — got ${JSON.stringify((stg.map.route || []).length)} entries (checkpoint pads would appear in the film)`);
      }
      for (const bad of ['npcs', 'peds', 'pedestrians']) {
        if (Array.isArray(stg.map[bad]) && stg.map[bad].length) {
          E(lv.id, `stage map must not declare '${bad}' — a film wants named actors, not live traffic`);
        }
      }
      if (Array.isArray(stg.map.roadProblems) && stg.map.roadProblems.length) {
        E(lv.id, `stage map must not declare roadProblems — they damage and score, and a film is not a level`);
      }
      // Every shot's `act` must exist in the stage's acts table, or the lighting
      // silently never changes and the film plays the whole night in daylight.
      const acts = stg.acts || {};
      const actNames = Object.keys(acts);
      const allShots = []
        .concat((story && story.prologue) || [])
        .concat(((story && story.beats) || []).flatMap((b) => (b && b.shots) || []));
      for (const s of allShots) {
        if (!s || !s.act) {continue;}
        if (actNames.length && actNames.indexOf(s.act) < 0) {
          E(lv.id, `shot declares act '${s.act}' but the stage only defines [${actNames.join(', ')}]`);
        }
      }
      if (actNames.length && allShots.length) {
        const unacted = allShots.filter((s) => s && !s.act).length;
        if (unacted > 0) {
          W(lv.id, `${unacted}/${allShots.length} shots declare no 'act' — they inherit whatever light the previous shot left`);
        }
      }
      // A film may mark shots `prior: true` to depict events before the lesson. A
      // prologue that is ENTIRELY prior is legitimate — that is what a cold open
      // is — but the film as a whole must arrive somewhere. The present tense is
      // where the lesson lives, and in this campaign it lives in the beats: a
      // cold open alone is a trailer, not a story.
      const shotsAll = []
        .concat((story && story.prologue) || [])
        .concat(((story && story.beats) || []).flatMap((b) => (b && b.shots) || []));
      const presentCount = shotsAll.filter((s) => s && s.prior !== true).length;
      const beatCount = ((story && story.beats) || []).length;
      if (shotsAll.length && presentCount === 0) {
        W_(
          lv.id,
          'every shot is marked prior: true — the film never reaches the lesson. Add a beat (present tense, on the playable map) or un-mark a prologue shot.'
        );
      }
      if (beatCount && !((story && story.beats) || []).some((b) => b && (b.shots || []).some((s) => s && s.prior !== true))) {
        W_(
          lv.id,
          'all beats are marked prior: true — a beat is by definition the present tense, so this one interrupts the lesson with backstory'
        );
      }
    }
    if (story && story.prologue && !stg) {
      // Not fatal — the film will play on the playable map, which is exactly the
      // bug the stage split exists to remove. Warn so it is a tracked backlog.
      W(lv.id, 'campaign has a prologue but no stage map in story/stage.js — shots will frame gameplay geometry (pads, traffic)');
    }

    // ── Cross-checks: campaign overlay vs level data ──
    if (!story) continue;

    for (const c of cast) {
      if (!hasMap) {
        warn(lv.id, `cast '${c.id}' placed but level declares no roads (generated map — position unverifiable)`);
        continue;
      }
      // Pedestrians legitimately stand off-road (porch, balcony, shopfront), so
      // this is a sanity ceiling, not a hard road test.
      const d = Math.min(...roads.map(r => distToRoad(c.x, c.z, r)));
      if (d > 60) {
        warn(lv.id, `cast '${c.id}' at (${c.x},${c.z}) is >60m from any road — likely a stale coordinate`);
      }
    }

    for (const b of (story.borrow || [])) {
      if (b.profileKey && !NPC_PROFILES.has(b.profileKey)) {
        E(lv.id, `campaign borrow references unknown profileKey '${b.profileKey}'`);
      }
    }

    // A tag may target a level `cast` entry OR a borrowed gameplay NPC (by its
    // `as` alias), since borrowed actors are not part of the cast array.
    const borrowAliases = new Set((story.borrow || []).map(b => b && b.as).filter(Boolean));
    for (const t of (story.tags || [])) {
      if (!cast.some(c => c.id === t.id) && !borrowAliases.has(t.id)) {
        warn(lv.id, `campaign tag '${t.id}' matches neither a cast entry nor a borrow alias`);
      }
    }

    // Subtitles must be reused verbatim from the level's own dialogue, so a film
    // can never invent content that is not in the syllabus.
    const beatKeys = new Set(beats.map(d => `${(d.speaker || '').trim()}|${(d.line || '').trim()}`));
    const castIds = cast.map((c) => c.id);
    // Solids come from the STAGE when one exists (that is where the prologue is
    // filmed) and from the level otherwise (beats film on the playable map).
    const solids = solidsFrom((stg && stg.map) || lv);

    checkShots(story.prologue, lv.id, castIds, solids, 'prologue', beatKeys);

    // ── Mid-level beats ──
    // A beat is hung off an objective, so the objective must exist AND be able to
    // complete. A beat hung off a task that never fires is a film nobody sees,
    // which is the worst possible failure: silent, and the content looks done.
    const taskIds = new Set((lv.tasks || []).map((t) => t && t.id));
    (story.beats || []).forEach((b, bi) => {
      const where = `beat ${bi + 1}`;
      if (!b || !b.after) {
        E(lv.id, `${where} has no 'after' objective to hang off`);
        return;
      }
      if (taskIds.size && !taskIds.has(b.after)) {
        E(lv.id, `${where} hangs off objective '${b.after}' which does not exist in this level's tasks[]`);
      }
      if (!b.shots || !b.shots.length) {
        E(lv.id, `${where} has no shots`);
        return;
      }
      checkShots(b.shots, lv.id, castIds, solidsFrom(lv), where, beatKeys);
    });

    // Two beats must not hang off the same objective, or only the first can ever
    // play and the second is unreachable.
    const seenAfter = new Map();
    (story.beats || []).forEach((b, bi) => {
      if (!b || !b.after) {return;}
      if (seenAfter.has(b.after)) {
        E(lv.id, `beats ${seenAfter.get(b.after) + 1} and ${bi + 1} both hang off objective '${b.after}' — only the first can fire`);
      } else {
        seenAfter.set(b.after, bi);
      }
    });
  }

  // Continuity: a lesson with a `carry` must be picked up by the next lesson's
  // prologue. This is what stops the campaign from developing holes.
  for (const { lv } of numbered) {
    const story = campaign[String(lv.id)];
    if (!story || !story.carry) continue;
    const next = numbered.find(x => x.lv.id === lv.id + 1);
    if (!next) continue;
    const nextStory = campaign[String(next.lv.id)];
    if (!nextStory || !nextStory.prologue) {
      console.log(`[STORY] L${lv.id} sets up a carry but L${next.lv.id} has no prologue to receive it`);
    }
  }

  console.log('\n─── Story Mode Coverage ───');
  console.log('L    Map   Stage  Cast  Shots  Pro  Carry  Lesson');
  console.log('─'.repeat(80));
  for (const r of rows) {
    const nm = String(r.name || '').replace(/^Lesson\s+/, '');
    console.log(
      String(r.id).padEnd(5) +
      String(r.map).padEnd(6) +
      String(r.stage).padEnd(7) +
      String(r.cast).padEnd(6) +
      String(r.beats).padEnd(7) +
      String(r.pro).padEnd(5) +
      String(r.carry).padEnd(7) +
      nm
    );
  }
  console.log(`\nTotal lessons: ${numbered.length}`);
  console.log(`  authored map:    ${withMap}/${numbered.length}`);
  console.log(`  cinematic stage: ${withStage}/${numbered.length}   (story/stage.js — the film map)`);
  console.log(`  cutscene cast:   ${withCast}/${numbered.length}`);
  console.log(`  story dialogue:  ${withBeats}/${numbered.length}`);
  console.log(`  campaign intro:  ${withPrologue}/${numbered.length}`);
  console.log(`  fully filmable:  ${filmable}/${numbered.length}`);
  console.log('\nNote: custom/free-roam entries are excluded (no syllabus to dramatise).');
  console.log('A level is filmable when it has a STAGE map, cast, dialogue and a prologue.');
  console.log('Without a stage map its shots frame the playable map — pads, traffic and all.');
}

// Report and exit last, so story cross-check failures are counted and printed
// alongside the ordinary level errors rather than silently dropped.
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
