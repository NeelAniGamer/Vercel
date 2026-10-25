// ═══════════════════════════════════════════════════════════════════════════════
// vehicle-dims.js — SINGLE SOURCE OF TRUTH for vehicle dimensions & road geometry
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS
// Before this, the same vehicle had FIVE different collider sizes spread across
// vehicles.js, ui.js (x3), traffic-manager.js and game_core.js, and every one of
// them disagreed with the mesh it was supposed to wrap:
//
//   sedan mesh 1.60 x 3.80 m  ->  collider 2.30 x 4.40 m   (+0.70 / +0.60 too big)
//   innova mesh 1.75 x 4.60 m  ->  collider 2.30 x 4.40 m   (collider SHORTER)
//   bicycle mesh 0.06 x 1.40 m ->  collider 1.20 x 2.20 m   (20x too wide)
//
// So `VEHICLE_DIMS` below is the one place a vehicle's size is defined. Mesh
// builders AND colliders both derive from it. If a dimension is wrong, it is
// wrong in exactly one place and everything downstream follows.
//
// UNITS
// Everything is in METRES. That is the codebase's world unit, established by
// `level-catalog`/level road configs (width 14 with lanes 2 => 3.5 m lane,
// the Indian NRCH standard) and by the metric IDM parameters in npc-ai.js
// (s0, T, wheelbase). This is NOT related to `game.speed`, which is a separate
// per-frame quantity -- see MATH-3-3 in MATH-AUDIT.md.
//
// AXIS CONVENTION
//   halfW = lateral  half-width  (X / right axis)
//   halfD = longitudinal half-length (Z / forward axis)
//   forward is +Z, yaw = atan2(x, z). Confirmed by the collision pairing at
//   game_core.js where `overlapX` (a lateral offset) pairs with `halfW`.
//
// LOADS BEFORE: vehicles.js, ui.js, npc-ai.js, traffic-manager.js, game_core.js
// ═══════════════════════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── Canonical dimensions ───────────────────────────────────────────────────
  // W  = overall body width   L  = overall length   H  = overall height
  // wb = wheelbase (front axle to rear axle)
  // tr = track width (left wheel centre to right wheel centre)
  // wr = tyre radius, ww = tyre width
  //
  // Sources: standard Indian vehicle classes (Parivahan/NRCH envelope limits,
  // typical manufacturer spec sheets for Maruti WagonR, Padmini, Innova, BEST
  // buses, Ashok Leyland trucks, Hero Splendor, Bajaj RE).
  const D = {
    // ── Two-wheelers ──────────────────────────────────────────────────────
    bike: {
      W: 0.72, L: 2.05, H: 1.12, wb: 1.38, tr: 0.62, wr: 0.31, ww: 0.09,
      seatY: 0.78, class: 'two_wheeler'
    },
    bicycle: {
      W: 0.58, L: 1.78, H: 1.06, wb: 1.05, tr: 0.50, wr: 0.34, ww: 0.04,
      seatY: 0.90, class: 'two_wheeler'
    },

    // ── Three-wheelers ────────────────────────────────────────────────────
    auto: {
      W: 1.40, L: 2.70, H: 1.78, wb: 1.60, tr: 1.18, wr: 0.26, ww: 0.12,
      seatY: 0.55, class: 'auto'
    },

    // ── Four-wheelers ─────────────────────────────────────────────────────
    car: {
      W: 1.75, L: 4.15, H: 1.48, wb: 2.45, tr: 1.45, wr: 0.31, ww: 0.20,
      seatY: 0.52, class: 'car'
    },
    taxi: {
      W: 1.70, L: 3.90, H: 1.45, wb: 2.25, tr: 1.42, wr: 0.30, ww: 0.19,
      seatY: 0.50, class: 'car'
    },
    suv: {
      W: 1.80, L: 4.55, H: 1.72, wb: 2.75, tr: 1.52, wr: 0.34, ww: 0.23,
      seatY: 0.55, class: 'suv'
    },
    supercar: {
      W: 1.94, L: 4.55, H: 1.22, wb: 2.65, tr: 1.66, wr: 0.34, ww: 0.28,
      seatY: 0.40, class: 'sports'
    },
    sports: {
      W: 1.90, L: 4.45, H: 1.28, wb: 2.60, tr: 1.62, wr: 0.33, ww: 0.26,
      seatY: 0.42, class: 'sports'
    },

    // ── Heavy ─────────────────────────────────────────────────────────────
    bus: {
      W: 2.55, L: 11.00, H: 3.20, wb: 5.60, tr: 2.10, wr: 0.50, ww: 0.28,
      seatY: 0.60, class: 'heavy'
    },
    truck: {
      W: 2.50, L: 8.50, H: 3.30, wb: 4.60, tr: 2.04, wr: 0.50, ww: 0.26,
      seatY: 0.60, class: 'heavy'
    },

    // ── Pedestrians ───────────────────────────────────────────────────────
    // Two separate boxes: the collision box (torso+shoulders) and the visual
    // standing height. A single 0.70 x 0.70 box was 2.5x too deep, so the
    // player "hit" pedestrians they had already walked past.
    ped: {
      W: 0.50, L: 0.30, H: 1.70, wb: 0, tr: 0, wr: 0, ww: 0,
      seatY: 0, class: 'ped'
    },
    pedChild: {
      W: 0.40, L: 0.26, H: 1.18, wb: 0, tr: 0, wr: 0, ww: 0,
      seatY: 0, class: 'ped'
    }
  };

  // ── Type alias -> canonical key ───────────────────────────────────────────
  // Every alias that appears anywhere in the codebase. Order matters: the
  // first matching alias wins, so put specific names before generic ones.
  const ALIAS = {
    // two-wheelers
    bike: 'bike', splendor: 'bike', activa: 'bike', scooter: 'bike',
    twowheeler: 'bike', hero: 'bike', ktm: 'bike', passion: 'bike',
    cycle: 'bicycle', bicycle: 'bicycle', cycle_track: 'bicycle',

    // three-wheelers
    auto: 'auto', rickshaw: 'auto', auto_yellow: 'auto', bajaj: 'auto',
    auto_black_yellow: 'auto',

    // cars
    car: 'car', sedan: 'car', wagonr: 'car', cab: 'car', city: 'car',
    car_highway: 'car', hatchback: 'car', sedan_car: 'car',
    taxi: 'taxi', kaali_peeli: 'taxi', padmini: 'taxi',

    // SUVs / MUVs
    suv: 'suv', creta: 'suv', innova: 'suv', suv_7seater: 'suv',
    suv7: 'suv', bmw: 'suv', fortuner: 'suv', xuv: 'suv',

    // sports
    supercar: 'supercar', supercar_white: 'supercar', car_supercar_white: 'supercar',
    white_supercar: 'supercar', lambo: 'supercar', lamborghini: 'supercar',
    sports: 'sports', sports_cyan: 'sports', car_sports_cyan: 'sports',
    cyan_sports: 'sports', sports_gt: 'sports', cyberpunk_bike: 'sports',

    // heavy
    bus: 'bus', best_bus: 'bus', school_bus: 'bus', double_decker: 'bus',
    green_bus: 'bus', bus_green: 'bus', bus_city: 'bus', bus_green_city: 'bus',
    bus_red: 'bus', red_bus: 'bus', city_bus: 'bus', msrtc: 'bus',
    truck: 'truck', eicher: 'truck', lorry: 'truck', container: 'truck',
    fire_truck: 'truck', truck_heavy: 'truck',
    ambulance: 'suv', police: 'suv',

    // pedestrians
    ped: 'ped', pedestrian: 'ped', ped_walk: 'ped', npc_ped: 'ped',
    child: 'pedChild', kid: 'pedChild', schoolchild: 'pedChild'
  };

  // ── Collider padding ──────────────────────────────────────────────────────
  // The collision box contains the visual body by a few centimetres. This
  // stops a bumper or wheel arch grazing without registering, without making
  // the hit feel late (the old boxes were 0.3-0.7 m oversized in every axis).
  const PAD = 0.04;

  function norm(type) {
    return String(type == null ? 'car' : type).toLowerCase().trim();
  }

  function key(type) {
    const k = norm(type);
    if (ALIAS[k]) return ALIAS[k];
    if (k.includes('bus')) return 'bus';
    if (k.includes('truck') || k.includes('lorry') || k.includes('eicher') || k.includes('container') || k.includes('trailer')) return 'truck';
    if (k.includes('ambulance') || k.includes('police') || k.includes('suv') || k.includes('creta') || k.includes('innova') || k.includes('fortuner')) return 'suv';
    if (k.includes('bike') || k.includes('splendor') || k.includes('activa') || k.includes('scooter') || k.includes('twowheeler') || k.includes('motorcycle')) return 'bike';
    if (k.includes('cycle') || k.includes('bicycle')) return 'bicycle';
    if (k.includes('auto') || k.includes('rickshaw') || k.includes('bajaj')) return 'auto';
    if (k.includes('taxi') || k.includes('cab') || k.includes('padmini')) return 'taxi';
    if (k.includes('supercar') || k.includes('lambo')) return 'supercar';
    if (k.includes('sports')) return 'sports';
    if (k.includes('child') || k.includes('kid')) return 'pedChild';
    if (k.includes('ped')) return 'ped';
    return 'car';
  }

  function resolve(type) {
    const k = key(type);
    return D[k] || D.car;
  }

  /** Lateral / longitudinal half-extents for a type, from the shared table. */
  function halves(type) {
    const d = resolve(type);
    return { halfW: d.W / 2 + PAD, halfD: d.L / 2 + PAD };
  }

  function halfW(type) { return resolve(type).W / 2 + PAD; }
  function halfD(type) { return resolve(type).L / 2 + PAD; }

  /**
   * Apply the canonical collider to a mesh, and return the extents used.
   * Safe to call repeatedly; it never clobbers a collider that was measured
   * from an imported model's real bounds.
   */
  function apply(mesh, type, extra) {
    if (!mesh) return null;
    const h = halves(type);
    mesh.userData = mesh.userData || {};
    if (!mesh.userData.halfW) mesh.userData.halfW = h.halfW;
    if (!mesh.userData.halfD) mesh.userData.halfD = h.halfD;
    mesh.userData.isVehicle = true;
    mesh.userData.dimKey = key(type);
    if (extra) Object.assign(mesh.userData, extra);
    return mesh.userData;
  }

  /**
   * Derive a collider from a mesh's MEASURED bounding box, then snap it to the
   * canonical envelope so a mis-scaled GLB cannot produce a nonsense collider.
   *
   * This is the fix for ui.js:4804-4827, which measured the imported model
   * twice (`Box3.setFromObject`) and then discarded both measurements in
   * favour of a hardcoded 1.05 x 2.25 guess.
   *
   * @param {THREE.Object3D} root  the assembled vehicle group
   * @param {THREE.Box3}   box   the already-measured, already-grounded box
   * @param {string}       type  vehicle type, for the canonical clamp
   */
  function colliderFromBox(box, type) {
    const d = resolve(type);
    const size = {
      x: box.max.x - box.min.x,
      y: box.max.y - box.min.y,
      z: box.max.z - box.min.z
    };
    const h = halves(type);
    // Clamp to the canonical envelope +/- 25%. A model that measures far
    // outside its class is mis-scaled; trusting it blindly would put a
    // passenger jet in the traffic stream.
    const clamp = (measured, canonical) => {
      const lo = canonical * 0.75, hi = canonical * 1.25;
      return Math.min(hi, Math.max(lo, measured));
    };
    return {
      halfW: clamp(size.x / 2, h.halfW),
      halfD: clamp(size.z / 2, h.halfD),
      measured: { W: size.x, H: size.y, L: size.z },
      canonical: { W: d.W, H: d.H, L: d.L }
    };
  }

  /**
   * Scale an imported GLB so its LENGTH matches the canonical envelope, then
   * return the box needed for grounding. Replaces the magic `s = 1.20` /
   * `s = 4.4` guesses, which produced cars anywhere from 2.9 m to 5.3 m long.
   *
   * The model is scaled UNIFORMLY (no anisotropic squash) so nothing distorts.
   */
  function fitImportedModel(baseModel, Box3, Vector3, type, opts) {
    opts = opts || {};
    const d = resolve(type);
    const targetL = opts.targetLength || d.L;

    baseModel.updateMatrixWorld(true);
    const rawBox = new Box3().setFromObject(baseModel);
    const rawSize = rawBox.getSize(new Vector3());

    let s = opts.scale;
    if (s == null) {
      const curScale = (baseModel.scale && typeof baseModel.scale.x === 'number') ? Math.abs(baseModel.scale.x) : 1;
      const rawL = Math.max(rawSize.z, rawSize.x);
      const unscaledL = (curScale > 1e-4) ? (rawL / curScale) : rawL;
      s = (unscaledL > 0.05) ? (targetL / unscaledL) : targetL;
    }
    // Safety clamp: prevent degenerate / zero scales while allowing unit-scale models to fit
    if (!isFinite(s) || s <= 0) s = 1;
    s = Math.min(25, Math.max(0.02, s));

    baseModel.scale.set(s, s, s);
    baseModel.updateMatrixWorld(true);
    const box = new Box3().setFromObject(baseModel);
    // Sit the tyres on y = 0.
    baseModel.position.y = -box.min.y;

    return { scale: s, box, rawSize, rawBox };
  }

  // ── Road geometry ─────────────────────────────────────────────────────────
  // laneWidth = width / (lanes * 2) -- see road-graph.js:68, where `lanes` is
  // per-direction. Several shipped level configs produced lanes far below the
  // 3.0 m NRCH minimum, and below the point where a 1.75 m car plus MOBIL
  // overtaking can coexist at all.
  const ROAD = {
    MIN_LANE: 3.0,        // NRCH absolute minimum
    TARGET_LANE: 3.25,    // comfortable urban lane
    WIDE_LANE: 3.5,       // 2-lane-per-direction local street
    SIDEWALK: 2.0,
    KERB: 0.15
  };

  function laneWidth(width, lanes) {
    return width / (Math.max(1, lanes) * 2);
  }

  /** Width needed for `lanes` per direction at the target lane width. */
  function widthForLanes(lanes) {
    return Math.ceil(Math.max(1, lanes) * 2 * ROAD.TARGET_LANE);
  }

  /**
   * Widen a road config so its lanes are physically drivable, preserving the
   * lane count (and therefore the topology, scenery offsets and route lengths).
   * Returns a shallow copy; the input is never mutated.
   */
  function normaliseRoad(road) {
    if (!road) return road;
    const lanes = road.lanes || 1;
    const need = widthForLanes(lanes);
    if ((road.width || 0) >= need) return road;
    const out = Object.assign({}, road);
    out.width = need;
    out._widthWidenedFrom = road.width;
    return out;
  }

  function normaliseRoads(list) {
    if (!Array.isArray(list)) return list;
    return list.map(normaliseRoad);
  }

  // ── Pedestrian helpers ────────────────────────────────────────────────────
  function pedHalves(isChild) {
    const d = isChild ? D.pedChild : D.ped;
    return { halfW: d.W / 2 + PAD, halfD: d.L / 2 + PAD };
  }

  // ── Detail material palette ───────────────────────────────────────────────
  // Shared so every vehicle class draws from the same set and we do not create
  // a new material per NPC (110 NPCs x 5 materials = 550 draw-state changes).
  const PALETTE = {
    paint:   0xffffff,   // tinted per instance
    glass:   0x1e293b,
    chrome:  0xdcdde1,
    rubber:  0x111111,
    rim:     0xb8bec7,
    lightGlass: 0xfff4d6,
    tailGlass: 0xff2b2b,
    indicator: 0xffa500,
    interior: 0x1a1f2b,
    seat:     0x2b3345,
    plate:   0xf5f5f0,
    chromeDark: 0x6b7280
  };

  global.VEHICLE_DIMS = D;
  global.VehicleDims = {
    DIM: D, ROAD, PAD, PALETTE, ALIAS,
    resolve, key, halves, halfW, halfD, apply,
    colliderFromBox, fitImportedModel,
    laneWidth, widthForLanes, normaliseRoad, normaliseRoads,
    pedHalves
  };
})(typeof window !== 'undefined' ? window : this);
