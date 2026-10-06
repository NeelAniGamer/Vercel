/**
 * story/stage.js — the cinematic map for each level.
 *
 * WHY A SEPARATE MAP EXISTS
 * -------------------------
 * A level's playable map has to carry everything the ENGINE needs: a route with
 * checkpoint pads, spawn discs, traffic lanes, potholes that damage you, an
 * ambulance, pedestrians who jaywalk and score you. None of that belongs on
 * screen while a film is playing. Shots that show a green checkpoint ring under
 * a dead man's motorcycle, or an NPC walking through a two-hander, do not read
 * as a bad camera angle — they read as a broken game.
 *
 * So a level loads TWICE:
 *
 *   1. STAGE build  — this file's config. Geometry only. No route, no pads,
 *      no traffic, no scoring props. Just the street the words describe.
 *   2. PLAY build   — the level file's own config, built after the film ends.
 *
 * The swap is a plain config swap into the existing `_buildScene()`, which
 * already re-seeds world/npcs/sigs/cps/obstacles and wipes the scene, so the
 * second build is genuinely clean. Cost is roughly one extra level-load.
 *
 * WHAT A STAGE DECLARES
 *   map       — merged over the level config for the stage build. Anything the
 *              level already gets right (roads, plots) can simply be restated
 *              here if the film needs it changed.
 *   dressing  — film-only props built by cinematics.js after the map: street
 *              furniture, wet-road treatment, parked cars, anything that must
 *              exist for a shot and must NOT exist for gameplay.
 *   acts      — light and weather per act, applied while a shot holds.
 *
 * LEFT-HAND TRAFFIC — READ THIS BEFORE MOVING ANY COORDINATE
 *   Mumbai drives on the LEFT. For a vehicle travelling +z, the carriageway is
 *   the +x half of the road; travelling -z it is the -x half. Signals stand on
 *   the far kerb and their mast arms reach back over that same half. Getting
 *   this backwards does not produce an obvious bug — it produces a film where
 *   the signal governs the oncoming lane and the antagonist appears to be
 *   driving the wrong way down a one-way road. Verify every vehicle and every
 *   signal against this rule before trusting a shot.
 */
(function () {
  'use strict';

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Shallow-per-key copy.
   *
   * Levels carry THREE meshes (renderer refs), DOM refs and function refs in
   * their config, so a structured clone would throw. Stage configs are
   * declarative data, so a per-key copy is all that is needed — and it guarantees
   * the stage cannot alias a level array by accident.
   */
  function cfg(over) {
    var base = {};
    if (over) {
      Object.keys(over).forEach(function (k) { base[k] = over[k]; });
    }
    return base;
  }

  /** Linking Road, north-south, wide enough to frame from the far kerb. */
  function linkingRoad() {
    return { type: 'v', x: 0, z1: -170, z2: 170, lanes: 4, width: 20, speedLimit: 40, roadType: 'arterial', name: 'Linking Road' };
  }

  /** West Commercial Avenue (X = -60) creating full city blocks to the west */
  function westAvenue() {
    return { type: 'v', x: -60, z1: -170, z2: 170, lanes: 2, width: 14, speedLimit: 30, roadType: 'arterial', name: 'West Commercial Avenue' };
  }

  /** East Promenade Avenue (X = 60) creating full city blocks to the east */
  function eastAvenue() {
    return { type: 'v', x: 60, z1: -170, z2: 170, lanes: 2, width: 14, speedLimit: 30, roadType: 'arterial', name: 'East Promenade Avenue' };
  }

  /** The cross street Vikram is on when he is shot. */
  function junctionRoad() {
    return { type: 'h', z: 0, x1: -130, x2: 130, lanes: 2, width: 14, speedLimit: 40, roadType: 'arterial', name: 'Signal Junction Road' };
  }

  /** The street north of the junction: the establishing crane and the idling lane. */
  function colonyCrossLane() {
    return { type: 'h', z: -46, x1: -130, x2: 130, lanes: 2, width: 12, speedLimit: 30, roadType: 'local', name: 'NCP Colony Cross Lane' };
  }

  /** Far north cross avenue */
  function northBoulevard() {
    return { type: 'h', z: -100, x1: -130, x2: 130, lanes: 2, width: 12, speedLimit: 30, roadType: 'local', name: 'North Boulevard' };
  }

  /** South cross street bordering bazaar and sports park */
  function southBazaarRoad() {
    return { type: 'h', z: 70, x1: -130, x2: 130, lanes: 2, width: 14, speedLimit: 30, roadType: 'collector', name: 'South Bazaar Road' };
  }

  // ── Level 1 — "The White Line" ────────────────────────────────────────────
  //
  // THE FILM
  //   Vikram Sawant — SI, Traffic Division, 22 years — stopped his motorcycle
  //   behind the solid white line at Linking Road at 3:14am in the rain. A black
  //   Fortuner drew up beside him in the same lane, window down, and the argument
  //   was too quiet for the rain to cover. One shot. The Fortuner took the red.
  //   Vikram fell forward across the line and his blood crossed it.
  //
  //   Then: 6:02am, same junction, dry. Inspector Arjun Kadam parks the jeep he
  //   was suspended out of and opens Vikram's notebook to page one.
  //
  // CARRIAGEWAY (the whole film happens inside this, so it is fixed here)
  //   Linking Road runs north-south at x=0, 20m wide → carriageway x -10..+10.
  //   +z is south. LHT ⇒ the southbound lane is x 0..+10, the northbound lane is
  //   x -10..0.
  //
  //   Vikram    ( 4.0, -12.5 )  stopped at the line, in the southbound lane
  //   Fortuner  ( 6.4, -12.5 )  alongside him, the same lane, slightly outboard
  //   Signal     (11.4, -16.5 )  east kerb, mast arm reaching WEST to x≈6.8
  //   Stop line            z=-12.5, painted x 0..+10 (the +x half only)
  //
  // WHY THE SIGNAL IS ON THE EAST KERB: a southbound vehicle keeps right of the
  // road's centreline in left-hand traffic, so the signal that governs it must
  // stand beyond the far (east) kerb with its arm reaching back west. On the
  // west kerb it would govern northbound traffic and the film's entire geography
  // would invert.
  window.STAGE = window.STAGE || {};

  window.STAGE['1'] = {
    title: 'The White Line',

    map: cfg({
      id: 1,
      mode: 'night',
      sky: 0x223854,
      ground: 0x3d5c38,
      isNight: true,
      hasRain: true,
      hasPuddles: true,
      roads: [linkingRoad(), westAvenue(), eastAvenue(), junctionRoad(), colonyCrossLane(), northBoulevard(), southBazaarRoad()],

      // THE load-bearing line. An empty route means _buildRouteCheckpoints is
      // never reached on a stage build, so no checkpoint pads and no finish gate.
      // The validator enforces this exact value.
      route: [],

      plots: [
        // North-west corner: apartment tower
        { kind: 'apartment', x: -34, z: -24, rotY: 0, w: 20, d: 16, h: 26, color: 0x8f9aa8 },
        // North-east: mirrored apartment tower
        { kind: 'apartment', x: 34, z: -24, rotY: 0, w: 20, d: 16, h: 28, color: 0x7d8896 },
        // South-east city block: complete Basketball Sports Complex (Reference Image 1)
        { kind: 'court', x: 34, z: 36, rotY: 0, w: 26, d: 18 },
        // South-west city block: organized Parking Lot with stalls & parked cars (Reference Images 1 & 2)
        { kind: 'parking', x: -34, z: 36, rotY: 0, w: 26, d: 18 },
        // Mid-block shops facing avenues
        { kind: 'shop', x: -34, z: -72, rotY: 0, w: 18, d: 12, h: 6, color: 0xf5e6d3, text: 'Sharma Stores', sub: 'General Merchant' },
        { kind: 'shop', x: 34, z: -72, rotY: 0, w: 18, d: 12, h: 7, color: 0xe0f2fe, text: 'City Clinic', sub: 'Emergency Care' }
      ],

      // Dense frontage is set dressing for the film: nothing here can damage,
      // score or block the player, because the player never drives this map.
      fillDensity: 1.4,

      // Deliberately absent: npcs, pedestrians, roadProblems, signals. The
      // signal head is part of `dressing` so it can be held RED for the cold
      // open without the engine's signal cycle overriding it four seconds in.
      signals: []
    }),

    // ── Film-only dressing ────────────────────────────────────────────────
    dressing: cfg({
      signalHead: { x: 11.4, z: -16.5, rotY: Math.PI / 2, state: 'red', ground: { x: 5, z: -12.5, halfW: 5, halfD: 0.3 } },

      // Wet road: specular plane with puddle patches.
      wetRoad: true,

      // Sodium street lighting.
      streetLamps: [
        { x: -11.5, z: -60, rotY: -Math.PI / 2 },
        { x: 11.5, z: -60, rotY: Math.PI / 2 },
        { x: -11.5, z: -24, rotY: -Math.PI / 2 },
        { x: 11.5, z: -24, rotY: Math.PI / 2 },
        { x: -11.5, z: 24, rotY: -Math.PI / 2 },
        { x: 11.5, z: 24, rotY: Math.PI / 2 },
        { x: -11.5, z: 60, rotY: -Math.PI / 2 },
        { x: 11.5, z: 60, rotY: Math.PI / 2 }
      ],

      // Parked cars along the kerbs.
      parkedCars: [
        { x: -10.6, z: -74, rotY: Math.PI / 2, color: 0x2b2f36, type: 'car' },
        { x: 10.6, z: -70, rotY: -Math.PI / 2, color: 0x3a4048, type: 'car' },
        { x: -10.6, z: 62, rotY: Math.PI / 2, color: 0x1f242b, type: 'car' },
        { x: 10.6, z: 66, rotY: -Math.PI / 2, color: 0x4a4038, type: 'car' }
      ],

      // Rain particles: soft, atmospheric monsoon droplets, not a white static blizzard
      rain: { count: 1200, size: 0.04, opacity: 0.22 },

      // Fortuner is now a full cast actor with driver and motion animation
      heroVehicles: []
    }),

    // ── Light + weather per act ────────────────────────────────────────────
    // A shot declares `act`, and cinematics.js applies the matching entry while
    // that shot holds. This is how one stage film crosses from 3am rain to 6am
    // dry light without building two maps.
    acts: cfg({
      night: {
        sky: 0x223854,
        ambient: 0.90,
        hemiSky: 0x8eb4e4,
        hemiGround: 0x486444,
        sun: 0.85,
        sunPos: [30, 65, 20],
        fogNear: 350,
        fogFar: 1600,
        rain: true,
        wet: true
      },
      day: {
        sky: 0x9dc4e0,
        ambient: 0.46,
        hemiSky: 0xa8cbe8,
        hemiGround: 0x5a5340,
        sun: 0.72,
        sunPos: [34, 62, 18],
        fogNear: 90,
        fogFar: 520,
        rain: false,
        wet: false
      }
    })
  };

  // ── Continuity scaffold ──────────────────────────────────────────────────
  // Only Lesson 1 has an authored map today (of 53 lessons). A stage entry is
  // added here as each map lands; a lesson with no stage falls straight through
  // to its playable build and plays without a film, exactly as before.
  //
  // Shape each entry must follow:
  //
  //   window.STAGE['<levelId>'] = {
  //     title: '<the film\'s name>',
  //     map:  cfg({ ... }),            // merged over the level config
  //     dressing: cfg({ ... }),        // film-only, inert
  //     acts: cfg({ actName: { ... } })
  //   }
  //
  // Non-negotiable in every stage:
  //   - `route: []`. Pads and finish gates must never appear on a film map. The
  //     validator treats anything else as an error.
  //   - No `npcs`, no pedestrians, no `roadProblems`. Cast belongs to
  //     story/campaign.js.
  //   - Every shot's `act` must exist in this `acts` table.
  //   - Coordinates must clear the roads by at least the road half-width plus a
  //     camera's width. cinematics.js keeps the camera's own path clear
  //     automatically; it cannot keep your BUILDINGS off your SHOTS.
})();