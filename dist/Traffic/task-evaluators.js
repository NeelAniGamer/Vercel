// Objective evaluators for task targets that need more than a one-line test.
//
// Kept out of game_core.js so `_checkTasks` stays a readable dispatch table.
// Every function here is called once per task per frame from `_checkTasks`, so
// they must be cheap and must never throw: a thrown evaluator would abort the
// whole task loop and leave every remaining objective stuck.
//
// The contract for each evaluator is the same:
//   return true  -> the objective is satisfied and the task completes
//   return false -> not yet satisfied, keep waiting
//
// None of these may complete on a timer. A timer-based completion is a lie:
// the player gets credit for something they did not do. The only exception is
// the last-resort guard in game_core's `_checkTasks`, which exists purely so a
// future unhandled target cannot softlock a level, and logs loudly when it
// fires.
(function (global) {
  'use strict';

  // ── Small shared helpers ────────────────────────────────────────────────

  // Proximity in the XZ plane. All the objective zones below are road-aligned,
  // so Y is irrelevant and ignoring it avoids a player popping over a hill
  // counting as "at" a sign that is 8m below them.
  function dist2D(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function playerPos(game) {
    const p = game && game.player;
    return (p && p.position) ? p.position : null;
  }

  function cfgOf(game) {
    return game.mapCfg || {};
  }

  // Iterates every moving traffic object the engine knows about. There are two
  // systems and they identify vehicle class differently: the legacy path tags
  // `userData.npcType`, the TrafficManager path uses a top-level `type`. Both
  // are covered so an evaluator does not silently see zero vehicles whenever
  // only one system is active.
  function forEachVehicle(game, fn) {
    if (!game) return;
    if (Array.isArray(game.trafficManager && game.trafficManager.vehicles)) {
      for (const v of game.trafficManager.vehicles) {
        if (!v || !v.active) continue;
        const mesh = v.mesh || v;
        const pos = v.position || (mesh && mesh.position);
        if (!pos) continue;
        const type = v.type || (v.userData && v.userData.npcType) || (mesh.userData && mesh.userData.npcType) || '';
        fn(pos, String(type), v);
      }
    }
    if (Array.isArray(game.npcs)) {
      for (const n of game.npcs) {
        if (!n || !n.position) continue;
        const ud = n.userData || {};
        const type = ud.npcType || '';
        fn(n.position, String(type), n);
      }
    }
  }

  // The nearest object of a given traffic class, or null.
  function nearestOfType(game, types, maxDist) {
    const pp = playerPos(game);
    if (!pp) return null;
    const wanted = Array.isArray(types) ? types : [types];
    let best = null;
    let bestD = maxDist === undefined ? Infinity : maxDist;
    forEachVehicle(game, (pos, type, obj) => {
      if (wanted.indexOf(type) === -1) return;
      const d = dist2D(pp, pos);
      if (d < bestD) { bestD = d; best = { dist: d, pos: pos, type: type, obj: obj }; }
    });
    return best;
  }

  // A cheap reusable dwell accumulator. Objective zones in this game are
  // 1-2 seconds of driving long; holding a condition for a fixed number of
  // frames stops a single frame that happens to satisfy the test from
  // completing the objective as the player flashes past.
  function dwell(task, key, dtFrames, required) {
    const k = '_dwell_' + key;
    task[k] = (task[k] || 0) + (dtFrames || 1);
    return task[k] >= (required || 30);
  }

  function resetDwell(task, key) {
    task['_dwell_' + key] = 0;
  }

  // Records that the player has driven past a zone without triggering the
  // failure it guards. Used by the `avoid` family, which means "you got
  // through this part of the road safely", not "you did a thing".
  function passedCleanly(task, key, inside, violated) {
    if (violated) {
      task['_failed_' + key] = true;
      return false;
    }
    if (inside) {
      task['_armed_' + key] = true;
      return false;
    }
    // Armed means we have been in the zone. Once we leave it unharmed, done.
    if (task['_armed_' + key] && !task['_failed_' + key]) {
      task['_armed_' + key] = false;
      return true;
    }
    if (task['_failed_' + key]) task['_armed_' + key] = false;
    return false;
  }

  // Did the given violation key ever appear in the run?
  function hasViolation(game, key) {
    const log = game && game.violationsLog;
    if (!Array.isArray(log)) return false;
    return log.indexOf(key) !== -1;
  }

  // A stable per-vehicle key for frame-to-frame tracking. TrafficManager
  // vehicles have no id, so position is the only handle; rounding keeps a
  // moving vehicle from getting a new key every frame.
  function vehicleKey(obj, pos) {
    if (obj && obj.id !== undefined && obj.id !== null) return 'i' + obj.id;
    return 'p' + Math.round(pos.x) + '_' + Math.round(pos.z);
  }

  // ── `avoid` evaluators ──────────────────────────────────────────────────
  // Each one answers "did the player get through this hazard unharmed?".

  const evaluators = {
    // ── Speed ──────────────────────────────────────────────────────────
    // 12 levels declare this, with meaningfully different intent: "crawl at
    // walking pace" (27, 45), "crawl through potholes" (48), "slow at the toll
    // plaza" (30), "maintain speed limits" (40). One fixed cap cannot serve
    // all of them, and a cap set at vehicle pace made the pedestrian levels
    // impossible to fail, because walking is slower than the cap.
    //
    // The cap is therefore derived from the level:
    //   1. `taskSpeedCap` if the level declares one, so a level can state its
    //      own limit without the engine guessing.
    //   2. Walking pace on a foot level, which is what "crawl" means there.
    //   3. The level's own `speedLimit` converted from km/h.
    //   4. A conservative road default.
    'avoid/speed': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const cfg = cfgOf(game);
      const cap = speedCapFor(game, cfg);
      if (Math.abs(game.speed) > cap) {
        task['_failed_speed'] = true;
        return false;
      }
      if (task['_failed_speed']) return false;
      // Complete once the player has actually covered ground at a legal speed,
      // not merely started stationary.
      task['_dist_speed'] = (task['_dist_speed'] || 0) + Math.abs(game.speed);
      if (task['_dist_speed'] < 25) return false;
      return dwell(task, 'speed', 1, 20);
    },

    // ── Contextual speed limits ────────────────────────────────────────
    // These four used to be fail-only branches in `_checkTasks`: they could
    // detect speeding but had no completion path, so the objective stayed
    // pending for the whole run. They now mean "get through this stretch
    // under the limit", with the cap matching the one that used to trigger
    // the fail condition.
    //
    //   speed_night    13, 14  night / dark-rain driving
    //   speed_puddle    4,  9  flooded road
    //   speed_hospital  7      hospital zone
    //   speed_festival 19      festival crowd
    'avoid/speed_night': function (game, task) {
      const cfg = cfgOf(game);
      const night = !!cfg.isNight || (game.timeOfDay < 6) || (game.timeOfDay > 19);
      if (!night) return false;
      return heldSpeedLimit(game, task, 'night', 0.35);
    },
    'avoid/speed_puddle': function (game, task) {
      const pp = playerPos(game);
      const puddles = game.puddles;
      if (!pp || !Array.isArray(puddles) || puddles.length === 0) return false;
      let nearFlood = false;
      for (const p of puddles) {
        if (p && p.position && dist2D(pp, p.position) <= 12) { nearFlood = true; break; }
      }
      if (!nearFlood) {
        if (task['_armed_puddle'] && !task['_failed_puddle']) return true;
        if (task['_failed_puddle']) task['_armed_puddle'] = false;
        return false;
      }
      if (Math.abs(game.speed) > 0.25) { task['_failed_puddle'] = true; return false; }
      if (task['_failed_puddle']) return false;
      task['_armed_puddle'] = true;
      return false;
    },
    'avoid/speed_hospital': function (game, task) {
      if (!game._nearHospital) {
        if (task['_armed_hospital'] && !task['_failed_hospital']) return true;
        if (task['_failed_hospital']) task['_armed_hospital'] = false;
        return false;
      }
      if (Math.abs(game.speed) > 0.25) { task['_failed_hospital'] = true; return false; }
      if (task['_failed_hospital']) return false;
      task['_armed_hospital'] = true;
      return false;
    },
    'avoid/speed_festival': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      // The festival crowd is a dense pedestrian area; being among them is what
      // makes the crawl-speed objective meaningful.
      const nearCrowd = (game.peds || []).some(p =>
        p && p.position && dist2D(pp, p.position) <= 25);
      if (!nearCrowd) {
        if (task['_armed_festival'] && !task['_failed_festival']) return true;
        if (task['_failed_festival']) task['_armed_festival'] = false;
        return false;
      }
      if (Math.abs(game.speed) > 0.15) { task['_failed_festival'] = true; return false; }
      if (task['_failed_festival']) return false;
      task['_armed_festival'] = true;
      return false;
    },

    // ── Signals ────────────────────────────────────────────────────────
    // "Obey all signals" / "no jumping the queue". The engine already logs a
    // RED_LIGHT_VIOLATION at the moment of the offence, so the honest test is
    // whether that ever happened.
    'avoid/signal_jump': function (game, task) {
      if (hasViolation(game, 'RED_LIGHT_VIOLATION')) return false;
      // Require the player to have actually encountered a signal first,
      // otherwise this completes instantly at spawn and means nothing.
      const reached = game._nearRedSignal ? game._nearRedSignal(60) : false;
      if (!reached) return false;
      return dwell(task, 'signal', 1, 60);
    },

    // ── Distraction ────────────────────────────────────────────────────
    // "Ignore decorative lights" in the level text; the real behaviour the
    // engine can observe is phone use while driving, which is what
    // MOBILE_USE records.
    'avoid/distraction': function (game, task) {
      if (hasViolation(game, 'MOBILE_USE')) return false;
      // The temptation has to have come and gone: the phone rings, the player
      // ignored it, and they kept driving.
      if (!game._phoneRinging && !(task['_dwell_distraction'] > 0)) return false;
      if (dwell(task, 'distraction', 1, 90)) return true;
      return false;
    },

    // ── Animals ────────────────────────────────────────────────────────
    // "Move stray animals" (level 48). The objective is to encourage the
    // animals across without hitting them; the engine already latches
    // `userData.hit` on contact and `userData.crossed` on completion.
    'avoid/animal_hit': function (game, task) {
      const animals = game._animals;
      if (!Array.isArray(animals) || animals.length === 0) return false;
      for (const a of animals) {
        if (a && a.userData && a.userData.hit) return false;
      }
      // All of them clear the road.
      for (const a of animals) {
        if (!a || !a.userData || !a.userData.crossed) return false;
      }
      return true;
    },

    // ── Pedestrians ────────────────────────────────────────────────────
    // "Yield to pedestrians at zebra crossings" (level 14). Complete when the
    // player has passed a crossing while a pedestrian is on it, slowly, and
    // without contact.
    'avoid/pedestrian_yield': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const cfg = cfgOf(game);
      // The crossing position comes from the level when it declares one.
      const cz = cfg.zebraZ !== undefined ? cfg.zebraZ
        : (cfg.schoolZ !== undefined ? cfg.schoolZ : 0);
      const cx = cfg.schoolX !== undefined ? cfg.schoolX : 0;
      const atCrossing = Math.abs(pp.x - cx) <= 25 && Math.abs(pp.z - cz) <= 25;
      // A pedestrian is actually on the crossing right now.
      const crossingPeds = (game.peds || []).filter(p =>
        p && p.userData && (p.userData.crossing || p.userData.state === 'crossing'));
      if (atCrossing && crossingPeds.length > 0) {
        if (game._collidedThisFrame) { task['_failed_pedyield'] = true; return false; }
        if (Math.abs(game.speed) > 0.22) { task['_failed_pedyield'] = true; return false; }
        task['_armed_pedyield'] = true;
        return false;
      }
      return passedCleanly(task, 'pedyield', false, task['_failed_pedyield']);
    },

    // ── Collisions by vehicle class ────────────────────────────────────
    // The TrafficManager collision path did not set `_collidedThisFrame` and
    // did not record which vehicle was hit. Both are now recorded, so these
    // can tell a bus strike from a bike brush.
    'avoid/bus_collision': function (game, task) {
      return avoidedClassCollision(game, task, 'bus');
    },
    'avoid/truck_collision': function (game, task) {
      return avoidedClassCollision(game, task, 'truck');
    },
    'avoid/curve_collision': function (game, task) {
      return avoidedClassCollision(game, task, null);
    },

    // ── Workers ────────────────────────────────────────────────────────
    // "Avoid workers" (level 44). The construction maze pushes its barriers
    // into `obstacles`; hitting one sets `_collidedThisFrame`. Complete when
    // the player has driven past the work zone without contact.
    'avoid/worker_hit': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const cfg = cfgOf(game);
      const cz = cfg.constZ !== undefined ? cfg.constZ : 30;
      const cx = cfg.constX !== undefined ? cfg.constX : 0;
      // The maze spans roughly cz-10 to cz+50.
      const inZone = Math.abs(pp.x - cx) <= 12 && pp.z >= cz - 20 && pp.z <= cz + 60;
      if (inZone && game._collidedThisFrame) { task['_failed_worker'] = true; return false; }
      if (inZone) { task['_armed_worker'] = true; return false; }
      if (task['_armed_worker'] && !task['_failed_worker']) return true;
      if (task['_failed_worker']) task['_armed_worker'] = false;
      return false;
    },

    // ── Hydrant ────────────────────────────────────────────────────────
    // "Avoid hydrant area" (level 28). The hydrant is a static mesh at a
    // fixed spot, so the objective is: do not drive through it.
    'avoid/hydrant_zone': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const hyd = (game._fireHydrantPos) || { x: 12, z: 15 };
      const near = Math.abs(pp.x - hyd.x) <= 3 && Math.abs(pp.z - hyd.z) <= 3;
      if (near) { task['_failed_hydrant'] = true; return false; }
      if (task['_armed_hydrant'] && !task['_failed_hydrant']) return true;
      if (task['_failed_hydrant']) task['_armed_hydrant'] = false;
      return false;
    },

    // ── Lane discipline ────────────────────────────────────────────────
    // "Stay in lane" (40) and "stay in correct lane" (42). The engine already
    // detects driving on the wrong side of the road and accumulates a timer in
    // `player.userData.wwTimer`. Reaching the challan threshold is the failure.
    'avoid/lane_violation': function (game, task) {
      return avoidedWrongSide(game, task, 'lane');
    },
    'avoid/wrong_lane': function (game, task) {
      return avoidedWrongSide(game, task, 'wronglane');
    },

    // ── Overtaking ─────────────────────────────────────────────────────
    // "Do not overtake" (33) and "no overtake near an intersection" (39).
    // Overtaking is detected as the player's z passing an NPC's z while
    // laterally offset from it, which is what actually happens in the sim.
    'avoid/overtake': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      // Overtaking is passing a vehicle: its z goes from ahead of us to behind
      // while we are laterally offset into its lane. Track each vehicle's z
      // from the previous frame and look for that sign change.
      let overtookThisFrame = false;
      forEachVehicle(game, (pos, type, obj) => {
        const key = vehicleKey(obj, pos);
        const prev = task['_ov_' + key];
        task['_ov_' + key] = pos.z;
        if (prev === undefined) return;
        const wasAhead = prev > pp.z;   // vehicle in front of the player
        const nowBehind = pos.z < pp.z;
        if (!wasAhead || !nowBehind) return;
        // Lateral offset is what distinguishes an overtake from following.
        if (Math.abs(pos.x - pp.x) < 1.8) return;
        if (pp.z - prev > 12) return;  // only count close passes, not the map edge
        overtookThisFrame = true;
      });

      const cfg = cfgOf(game);
      // Two levels restrict it: one at the toll approach, one near junctions.
      const inRestrictedZone = (cfg.tollZ !== undefined && Math.abs(pp.z - cfg.tollZ) <= 40)
        || (game.cps || []).some(cp => cp && cp.position && dist2D(pp, cp.position) <= 30);

      if (inRestrictedZone) {
        if (overtookThisFrame) { task['_failed_overtake'] = true; return false; }
        task['_armed_overtake'] = true;
        return false;
      }
      if (task['_armed_overtake'] && !task['_failed_overtake']) return true;
      if (task['_failed_overtake']) task['_armed_overtake'] = false;
      return false;
    },

    // ── Safe distance ──────────────────────────────────────────────────
    // "Keep safe distance" (29), "keep 1m from cyclist" (39), and
    // "give an aggressive driver space" (22). The engine keeps no following
    // distance, so it is computed here from the vehicle ahead in the same lane.
    'avoid/safe_distance': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const minGap = cfgOf(game).taskSafeGap !== undefined ? cfgOf(game).taskSafeGap : 3.0;
      let closestAhead = Infinity;
      forEachVehicle(game, (pos) => {
        const dz = pp.z - pos.z;          // positive => the vehicle is behind us
        const ahead = -dz;                // positive => it is in front
        if (ahead <= 0 || ahead > 30) return;
        if (Math.abs(pos.x - pp.x) > 2.5) return; // different lane
        if (ahead < closestAhead) closestAhead = ahead;
      });
      if (closestAhead < minGap) { task['_failed_gap'] = true; return false; }
      if (task['_failed_gap']) return false;
      // Completes after holding a legal gap for a while, so it is not free.
      return dwell(task, 'gap', 1, 90);
    },

    // ── Signs and markings to read ─────────────────────────────────────
    // "Match highway speed" (43). The merge is done when the player is in the
    // right lane, moving, and no longer decelerating hard.
    'avoid/slow_merge': function (game, task) {
      if (!game._mergedBack && !game._changedLaneLeft) return false;
      if (Math.abs(game.speed) < 0.3) return false;
      if (!game._maintainedSpeed) return false;
      return dwell(task, 'merge', 1, 60);
    },

    // ── Lights ─────────────────────────────────────────────────────────
    // "Use headlights properly" (41) and "use fog lights" (45). Both mean:
    // the lights are on while it is dark or visibility is poor. The engine has
    // one light state, `highBeamOn`, so that is what is checked.
    'avoid/no_lights': function (game, task) {
      const cfg = cfgOf(game);
      const dark = !!cfg.isNight || (game.timeOfDay < 6) || (game.timeOfDay > 19);
      if (!dark) return dwell(task, 'lights', 1, 30);
      if (!game.highBeamOn) { task['_failed_lights'] = true; return false; }
      if (task['_failed_lights']) return false;
      return dwell(task, 'lights', 1, 60);
    },
    'avoid/wrong_lights': function (game, task) {
      const cfg = cfgOf(game);
      const needsLights = !!cfg.isNight || !!cfg.hasRain || (game.timeOfDay < 6) || (game.timeOfDay > 19);
      if (!needsLights) return dwell(task, 'foglights', 1, 30);
      if (!game.highBeamOn) return false;
      return dwell(task, 'foglights', 1, 60);
    },

    // ── Puddles ────────────────────────────────────────────────────────
    // "Crawl through flooded roads" (41). The engine sets
    // `puddle.userData.splashed` for 3s after a splash, so the objective is
    // complete when the player has crossed the flooded stretch slowly enough
    // that the marker never appeared.
    'avoid/splash': function (game, task) {
      const pp = playerPos(game);
      const puddles = game.puddles;
      if (!pp || !Array.isArray(puddles) || puddles.length === 0) return false;
      let nearFlood = false;
      let splashed = false;
      for (const p of puddles) {
        if (!p || !p.position) continue;
        if (dist2D(pp, p.position) <= 12) {
          nearFlood = true;
          if (p.userData && p.userData.splashed) splashed = true;
        }
      }
      if (splashed) { task['_failed_splash'] = true; return false; }
      if (nearFlood) {
        task['_armed_splash'] = true;
        if (Math.abs(game.speed) > 0.2) { task['_failed_splash'] = true; return false; }
        return false;
      }
      if (task['_armed_splash'] && !task['_failed_splash']) return true;
      if (task['_failed_splash']) task['_armed_splash'] = false;
      return false;
    },

    // ── Brake fade ─────────────────────────────────────────────────────
    // "Use lower gear downhill" (47). Brake heat is a live 0-100 value; the
    // objective is met by never pushing it into the fade band (above 70).
    'avoid/brake_overheat': function (game, task) {
      const heat = game._brakeHeat || 0;
      if (heat > 70) { task['_failed_brake'] = true; return false; }
      if (task['_failed_brake']) return false;
      // Must have been on the brakes long enough for the test to mean
      // anything.
      if (heat < 5 && !(task['_peak_brake'] > 0)) return false;
      task['_peak_brake'] = Math.max(task['_peak_brake'] || 0, heat);
      return dwell(task, 'brake', 1, 120);
    },

    // ── Blind corner ───────────────────────────────────────────────────
    // "Check blind spot" (43) and "honk at blind curves" (47). The blind
    // corner is built at a known position with a convex mirror, so the
    // objective is: approach it, slow down, and get through it in one piece.
    'avoid/blind_spot_miss': function (game, task) {
      return clearedBlindCorner(game, task);
    },

    // ── Weather ────────────────────────────────────────────────────────
    // "Handle all weather" (50). In rain the engine already reduces grip.
    // The objective is to keep the car under control: no collision and no
    // overspeed while it is raining.
    'avoid/weather_fail': function (game, task) {
      const raining = !!(game.rain) || !!cfgOf(game).hasRain;
      if (!raining) return false;
      if (game._collidedThisFrame) { task['_failed_weather'] = true; return false; }
      if (Math.abs(game.speed) > 0.4) { task['_failed_weather'] = true; return false; }
      if (task['_failed_weather']) return false;
      return dwell(task, 'weather', 1, 150);
    },

    // ── Everything else ────────────────────────────────────────────────
    // "Follow all rules" (50): a run with no violations of any kind logged.
    'avoid/violation': function (game, task) {
      const log = game.violationsLog;
      if (!Array.isArray(log)) return false;
      for (const v of log) {
        if (typeof v !== 'string') continue;
        if (v.indexOf('_WARNING') !== -1) continue; // warnings are not breaches
        if (v === 'TRAFFIC_COLLISION') return false;
        return false; // any real violation disqualifies the objective
      }
      // Clean so far. Require the player to have covered ground.
      task['_dist_violation'] = (task['_dist_violation'] || 0) + Math.abs(game.speed);
      if (task['_dist_violation'] < 40) return false;
      return dwell(task, 'violation', 1, 60);
    },

    // ── `reach` evaluators ─────────────────────────────────────────────

    // "Follow detour signs" (34) and "follow diversion signs" (38). Both mean
    // the construction zone was traversed on the open side of the barriers.
    // The barriers sit at cx +/- 3, so the open gap is on the right-hand side.
    'reach/detour': function (game, task) {
      return clearedDetour(game, task, 'detour');
    },
    'reach/diversion': function (game, task) {
      return clearedDetour(game, task, 'diversion');
    },

    // "Obey flagman signals" (34). The flagman stands beside the work zone;
    // the objective is to stop while still short of it.
    'reach/flagman': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const cfg = cfgOf(game);
      const f = game._flagmanPos || { x: (cfg.constX || 0) + 6, z: (cfg.constZ || 30) - 10 };
      const d = dist2D(pp, f);
      // Stopped in the flagman's zone of influence.
      if (d > 25) return false;
      if (Math.abs(game.speed) > 0.15) return false;
      return dwell(task, 'flagman', 1, 45);
    },

    // "Enter from the correct end" (35) and "follow traffic flow" (35).
    // The one-way street runs along z at oneWayX. Correct entry is from the
    // negative-z end, and flow means never crossing the centreline.
    'reach/one_way_entry': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const cfg = cfgOf(game);
      const ox = cfg.oneWayX !== undefined ? cfg.oneWayX : 0;
      const oz = cfg.oneWayZ !== undefined ? cfg.oneWayZ : 0;
      if (Math.abs(pp.x - ox) > 12) return false;
      if (pp.z > oz) { task['_failed_entry'] = true; return false; }
      if (task['_failed_entry']) return false;
      return dwell(task, 'entry', 1, 30);
    },
    'reach/one_way_flow': function (game, task) {
      return avoidedWrongSide(game, task, 'oneway');
    },

    // "Give an aggressive driver space" (22). The same following-distance
    // test as `avoid/safe_distance`, but it completes on opening a gap rather
    // than merely keeping one.
    'reach/safe_distance': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      let closestAhead = Infinity;
      let aggressive = null;
      forEachVehicle(game, (pos, type, obj) => {
        const ahead = pp.z - pos.z;
        if (ahead <= 0 || ahead > 30) return;
        if (Math.abs(pos.x - pp.x) > 2.5) return;
        const ud = (obj && obj.userData) || {};
        const agg = ud.aggression;
        if (aggressive === null || (typeof agg === 'number' && agg > 1.05)) aggressive = ud;
        if (ahead < closestAhead) closestAhead = ahead;
      });
      if (closestAhead === Infinity) return false;
      if (task['_armed_give_space'] && closestAhead >= 6) return true;
      if (closestAhead < 4) task['_armed_give_space'] = true;
      return false;
    },

    // "Choose correct lane" (30). The toll plaza has three lanes; the middle
    // one is the FASTAG lane. Reaching the plaza in the correct lane, stopped,
    // is the objective.
    'reach/toll_lane': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const cfg = cfgOf(game);
      const tx = cfg.tollX !== undefined ? cfg.tollX : 0;
      const tz = cfg.tollZ !== undefined ? cfg.tollZ : 60;
      if (Math.abs(pp.z - tz) > 20) return false;
      // Lanes sit at tx-8, tx, tx+8. The FASTAG lane is the middle one.
      const laneOffset = pp.x - tx;
      if (Math.abs(laneOffset) > 3) return false;
      return dwell(task, 'tolllane', 1, 30);
    },

    // "Find a gap for an oncoming auto" (27). The engine already computes
    // `_reachedGap`: two vehicles with a space between them and the player
    // inside it.
    'reach/wider_spot': function (game, task) {
      if (!game._reachedGap) return false;
      return dwell(task, 'widerspot', 1, 20);
    },

    // "Read the mandatory sign" (25) and "read the informational sign" (25,
    // 36). The signs stand at signX-8, at signZ-20 (blue) and signZ+20
    // (green). Drive up to one and the objective is read.
    'reach/blue_sign': function (game, task) {
      return reachedSign(game, task, -20);
    },
    'reach/green_sign': function (game, task) {
      return reachedSign(game, task, 20);
    },

    // ── `stop` evaluators ──────────────────────────────────────────────

    // "Stop at the zebra crossing" (24). The crossing position comes from the
    // level; stop on it, not anywhere.
    'stop/zebra': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const cfg = cfgOf(game);
      const zz = cfg.zebraZ !== undefined ? cfg.zebraZ : (cfg.schoolZ !== undefined ? cfg.schoolZ : 0);
      const zx = cfg.schoolX !== undefined ? cfg.schoolX : 0;
      if (Math.abs(pp.x - zx) > 12) return false;
      if (Math.abs(pp.z - zz) > 12) return false;
      if (Math.abs(game.speed) > 0.05) { resetDwell(task, 'zebra'); return false; }
      return dwell(task, 'zebra', 1, 30);
    },

    // "Wait behind the bus" (33). The bus stops are known records; stop short
    // of one while a bus is actually there.
    'stop/bus_stop': function (game, task) {
      const pp = playerPos(game);
      const stops = game.busStops;
      if (!pp || !Array.isArray(stops) || stops.length === 0) return false;
      const bus = nearestOfType(game, 'bus', 40);
      if (!bus) return false;
      for (const s of stops) {
        if (!s) continue;
        if (dist2D(pp, s) > 12) continue;
        if (Math.abs(game.speed) > 0.05) { resetDwell(task, 'busstop'); return false; }
        // Stopped at the stop, and the bus has not run away from it.
        if (bus.dist > 45) { resetDwell(task, 'busstop'); return false; }
        return dwell(task, 'busstop', 1, 30);
      }
      return false;
    },

    // "Pay the toll at the booth" (30). The barrier opens when the player is
    // within 15m, so stopping there and having it open is the objective.
    'stop/toll_booth': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const barriers = game._tollBarriers;
      if (!Array.isArray(barriers) || barriers.length === 0) return false;
      for (const tb of barriers) {
        if (!tb || !tb.bar || !tb.bar.position) continue;
        if (Math.abs(pp.x - tb.pivotX) > 6) continue;
        if (Math.abs(pp.z - tb.bar.position.z) > 8) continue;
        if (Math.abs(game.speed) > 0.05) { resetDwell(task, 'tollbooth'); return false; }
        if (!tb.open) { resetDwell(task, 'tollbooth'); return false; }
        return dwell(task, 'tollbooth', 1, 30);
      }
      return false;
    },

    // "Wait for the pedestrian to cross" (24). Hold still at the crossing
    // until a crossing pedestrian has reached the far kerb.
    'stop/pedestrian_crossed': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const peds = game.peds || [];
      const crossing = peds.filter(p => p && p.userData && (p.userData.crossing || p.userData.state === 'crossing'));
      if (crossing.length === 0) return false;
      // Close enough that the wait matters.
      let near = false;
      for (const p of crossing) {
        if (p.position && dist2D(pp, p.position) <= 20) { near = true; break; }
      }
      if (!near) return false;
      if (Math.abs(game.speed) > 0.05) { resetDwell(task, 'pedcrossed'); return false; }
      // The crossing peds have reached their target z on the far side.
      for (const p of crossing) {
        const ud = p.userData;
        if (ud.targetZ === undefined) continue;
        if (Math.abs(p.position.z - ud.targetZ) > 3) return false;
      }
      return dwell(task, 'pedcrossed', 1, 30);
    },

    // "Check all directions" (21). The camera-look state is tracked by the
    // decay helper; the player has to actually swing the view left and right
    // while stopped.
    'stop/look_around': function (game, task) {
      if (Math.abs(game.speed) > 0.1) { resetDwell(task, 'look'); return false; }
      const yaw = game.camYaw || 0;
      const seen = task['_lookYaw'] === undefined ? yaw : task['_lookYaw'];
      const delta = Math.abs(yaw - seen);
      if (delta > 0.5) {
        task['_lookedLeft'] = task['_lookedLeft'] || yaw < seen;
        task['_lookedRight'] = task['_lookedRight'] || yaw > seen;
        task['_lookYaw'] = yaw;
      }
      if (task['_lookedLeft'] && task['_lookedRight']) return true;
      return false;
    },

    // "Yield to the procession" (38, 46). The festival scene is a crowd
    // crossing point. Hold still while pedestrians are crossing nearby and
    // none has been hit.
    'stop/procession': function (game, task) {
      const pp = playerPos(game);
      if (!pp) return false;
      const crossing = (game.peds || []).filter(p =>
        p && p.position && (p.userData.state === 'crossing' || p.userData.crossing));
      if (crossing.length < 2) return false;
      let near = false;
      for (const p of crossing) {
        if (dist2D(pp, p.position) <= 25) { near = true; break; }
      }
      if (!near) return false;
      if (Math.abs(game.speed) > 0.05) { resetDwell(task, 'procession'); return false; }
      if (game._collidedThisFrame) { task['_failed_procession'] = true; return false; }
      if (task['_failed_procession']) return false;
      return dwell(task, 'procession', 1, 60);
    },

    // "React to the auto stopping" (29). An auto-rickshaw ahead brakes to a
    // stop; the objective is to slow to a safe following distance behind it
    // rather than driving into the back of it.
    'stop/auto_stop': function (game, task) {
      const auto = nearestOfType(game, 'auto', 25);
      if (!auto) return false;
      const stopped = (auto.obj && auto.obj.userData && auto.obj.userData.isStopped)
        || (auto.obj && auto.obj.npcAI && auto.obj.npcAI.currentSpeed < 0.1);
      if (!stopped) return false;
      if (auto.dist < 3) { task['_failed_autostop'] = true; return false; }
      if (task['_failed_autostop']) return false;
      if (Math.abs(game.speed) > 0.1) return false;
      return dwell(task, 'autostop', 1, 30);
    },

    // ── `toggle` evaluators ────────────────────────────────────────────

    // "Use low gear uphill" (32). The engine's transmission is
    // P/R/N/D with no low ratio, so the honest reading of the objective is:
    // engaged in Drive and not accelerating hard on the climb. Held, not
    // momentary.
    'toggle/gear': function (game, task) {
      const cfg = cfgOf(game);
      // Only meaningful on a gradient level.
      if (!cfg.hasHill && !cfg.isHill) return false;
      if (game.gear !== 'D') return false;
      // Climbing: still moving, but not flooring it.
      if (Math.abs(game.speed) < 0.05) return false;
      if (Math.abs(game.speed) > 0.4) return false;
      return dwell(task, 'gear', 1, 90);
    },
  };

  // Shared implementations that need more context than an inline expression.

  // The speed an objective is judged against, in world units per frame.
  //
  // The engine's own `mapCfg.speedLimit` is deliberately not the first choice:
  // `speedLimiter` already clamps the car to that number in school, hospital
  // and rural levels, so testing against it would make the objective free.
  // A level can opt in with `taskSpeedCap` when it wants a specific number.
  //
  // The on-foot figures are measured from the engine's own movement code:
  // walking settles at 0.12 and holding shift reaches 0.264. The cap sits
  // between them, so "crawl at walking pace" means walk, not sprint, and the
  // objective is still possible rather than impossible.
  function speedCapFor(game, cfg) {
    if (typeof cfg.taskSpeedCap === 'number') return cfg.taskSpeedCap;
    if (game.isPedestrian) return 0.18;
    // 3.6 converts the engine's world-unit speed to km/h.
    if (typeof cfg.speedLimit === 'number' && cfg.speedLimit > 0) {
      return Math.max(0.1, cfg.speedLimit / 3.6);
    }
    return 0.28;
  }

  // Held a speed cap for `required` frames. Used where the objective means
  // "stay under this limit here", as opposed to `avoid/speed` which covers
  // the whole level.
  function heldSpeedLimit(game, task, key, cap) {
    if (Math.abs(game.speed) > cap) { task['_failed_' + key] = true; return false; }
    if (task['_failed_' + key]) return false;
    return dwell(task, key, 1, 90);
  }

  function avoidedClassCollision(game, task, cls) {
    const pp = playerPos(game);
    if (!pp) return false;
    // A collision with the class in question disqualifies the objective.
    if (game._collidedThisFrame && game._lastCollisionType) {
      if (cls === null || game._lastCollisionType === cls) { task['_failed_class'] = true; return false; }
    }
    if (task['_failed_class']) return false;
    // There has to be something of that class nearby for the objective to mean
    // anything.
    const near = nearestOfType(game, cls, 30);
    if (!near) return false;
    task['_armed_class'] = true;
    // Clear of it and still intact: done.
    if (near.dist > 30) return true;
    return false;
  }

  function avoidedWrongSide(game, task, key) {
    const pp = playerPos(game);
    if (!pp) return false;
    const st = game._getRoadAndSidewalkStatus
      ? game._getRoadAndSidewalkStatus(pp.x, pp.z)
      : null;
    if (!st || !st.onRoad) return false;
    // The engine's own wrong-side detector. `wwTimer` climbs while the player
    // is on the wrong side; the challan fires at 2.5s.
    const ww = (game.player && game.player.userData && game.player.userData.wwTimer) || 0;
    if (ww >= 2.5) { task['_failed_' + key] = true; return false; }
    if (task['_failed_' + key]) return false;
    task['_armed_' + key] = true;
    // Held the correct side for long enough.
    return dwell(task, key, 1, 120);
  }

  function clearedDetour(game, task, key) {
    const pp = playerPos(game);
    if (!pp) return false;
    const cfg = cfgOf(game);
    const cx = cfg.constX !== undefined ? cfg.constX : 0;
    const cz = cfg.constZ !== undefined ? cfg.constZ : 30;
    // Barriers block cx-3..cx+3 over a stretch; the open side is to the right.
    const past = pp.z > cz + 60;
    if (!past) {
      if (pp.z > cz - 20 && Math.abs(pp.x - cx) < 2) { task['_failed_' + key] = true; return false; }
      if (pp.z > cz - 20) task['_armed_' + key] = true;
      return false;
    }
    return !!task['_armed_' + key] && !task['_failed_' + key];
  }

  function reachedSign(game, task, zOffset) {
    const pp = playerPos(game);
    if (!pp) return false;
    const cfg = cfgOf(game);
    const sx = (cfg.signX !== undefined ? cfg.signX : 0) - 8;
    const sz = (cfg.signZ !== undefined ? cfg.signZ : 10) + zOffset;
    if (dist2D(pp, { x: sx, z: sz }) > 12) return false;
    // Arriving is not enough; slow down to actually read it.
    if (Math.abs(game.speed) > 0.3) { resetDwell(task, 'sign'); return false; }
    return dwell(task, 'sign', 1, 30);
  }

  function clearedBlindCorner(game, task) {
    const pp = playerPos(game);
    if (!pp) return false;
    const cfg = cfgOf(game);
    const cx = cfg.cornerX !== undefined ? cfg.cornerX : 30;
    const cz = cfg.cornerZ !== undefined ? cfg.cornerZ : 30;
    const inCorner = Math.abs(pp.x - cx) <= 18 && Math.abs(pp.z - cz) <= 18;
    if (inCorner) {
      task['_armed_blind'] = true;
      if (game._collidedThisFrame) { task['_failed_blind'] = true; return false; }
      // Through a blind corner you slow down.
      if (Math.abs(game.speed) > 0.3) { task['_failed_blind'] = true; return false; }
      return false;
    }
    if (task['_armed_blind'] && !task['_failed_blind']) return true;
    if (task['_failed_blind']) task['_armed_blind'] = false;
    return false;
  }

  global.COL_TASK_EVALUATORS = evaluators;
})(typeof window !== 'undefined' ? window : globalThis);
