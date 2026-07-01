# Traffic Driving Simulator — Agent Rules

> Read this file before making any changes to the `Traffic/` folder.

---

## Project Overview

**Traffic** is a 3D browser-based driving/pedestrian simulator built with Three.js. Players navigate Indian city environments (Mumbai-themed), complete driving courses, earn certificates, and explore open-world maps with traffic, NPCs, and pedestrians.

### Tech Stack

- **3D Engine:** Three.js (r128, CDN-loaded)
- **Models:** Kenney asset packs (GLB/GLTF) — cars, buildings, roads, characters
- **Auth:** Supabase (separate from root `col-auth.js`)
- **Levels:** 20+ procedural levels defined in `levels/level*.js`
- **Hosting:** Vercel (static site, served from `Traffic/` subdirectory)

---

## Architecture

### File Structure

```
Traffic/
├── Driving.html          # Main game entry point
├── Academy.html          # Course/lesson system
├── TrafficSetup.html     # Vehicle selection & setup
├── TrafficDashboard.html # User dashboard & stats
├── config.json           # Supabase auth credentials (DO NOT TOUCH)
├── game_core.js          # Core game engine (renderer, physics, AI, HUD)
├── ui.js                 # UI overlay, menus, HUD, traffic lights
├── start.js              # Asset loader, model preloading, scene init
├── env.js                # Environment textures & scene setup
├── vehicles.js           # Vehicle building system
├── auto.js / bus.js / lambo.js  # Specific vehicle models
├── course.js             # Course/lesson logic
├── cert_assets.js        # Certificate rendering
├── levels/               # 20 level data files (level1.js - level20.js)
├── Models/               # Kenney GLB model packs
│   ├── kenney_car-kit/
│   ├── kenney_city-kit-industrial_1.0/
│   ├── kenney_city-kit-roads/
│   ├── kenney_city-kit-suburban_20/
│   ├── kenney_mini-characters/
│   └── ... (10 packs total)
└── Cyberpunk/            # Historical archive — DO NOT MODIFY
```

### Script Loading Order

`Driving.html` loads scripts in this order:

1. Three.js (CDN)
2. `start.js` — preloads all GLB models, builds loading screen
3. `env.js` — environment textures
4. `vehicles.js` — vehicle factory functions
5. `auto.js`, `bus.js`, `lambo.js` — specific vehicle builders
6. `game_core.js` — main game class (`TrafficGame`)
7. `ui.js` — UI/HUD overlay class (`TrafficUI`)
8. Level data (`levels/level1.js` through `levels/level20.js`)

---

## Core Systems

### Game Engine (`game_core.js`)

- **Renderer:** WebGL with ACES filmic tone mapping, PCF soft shadows
- **Post-processing:** UnrealBloomPass (subtle glow)
- **Physics:** Simple AABB collision detection against `this.world[]` and `this.obstacles[]`
- **AI:** NPC vehicles follow waypoints, pedestrians walk sidewalks, obey traffic lights
- **Camera:** First-person (pointer lock) or third-person chase cam

### Key Classes

- `TrafficGame` — main game loop, physics, rendering, input
- `TrafficUI` — HUD, menus, auth, traffic light display
- `_buildHuman(isPlayer)` — builds character model from preloaded GLB or procedural fallback
- `_buildVehicle(type, color)` — builds vehicle from preloaded GLB or procedural geometry

### Model System (`start.js`)

- All Kenney GLB models are preloaded at startup into `window.PRELOADED_MODELS`
- Models stored at **4.5x scale** (base game-world proportion)
- Instanced buildings clone models from `PRELOADED_MODELS` and set their own scale
- Character models (`char_m_a`, `char_f_a`, etc.) are cloned and scaled to 1.5x for players

---

## Known Gotchas

1. **Two config.json files** — Root `config.json` and `Traffic/config.json` both contain Supabase credentials. They are separate. Do not mix them up.
2. **Academy.html patches fetch()** — It redirects `config.json` requests to `../config.json` because it lives one directory deeper.
3. **Cyberpunk/ is an archive** — Old build files. Never modify anything inside.
4. **Model scale chain** — GLB loaded → stored at 4.5x → instanced buildings reset to 1x then apply their own `s` value. Character models replace scale directly.
5. **Road tiles are GLTF** — Road geometry comes from `road_straight` model, not procedural. Tiles are positioned at y=0.08 to sit above ground.
6. **Pedestrian mode** — When `vehMode === 'pedestrian'`, `isPedestrian = true` and the player controls a human character. In vehicle mode, the player starts as a pedestrian who can enter/exit a vehicle with F key.
7. **Building rotation** — Buildings rotate to face the road. Vertical road: ±PI/2. Horizontal road: PI or 0. Do NOT add extra rotation offsets.
8. **Shared scripts NOT loaded** — Traffic pages do NOT load `col-router.js`, `col-ui.js`, `col-auth.js`, or `col-3d.js`. They have their own auth/UI system.

---

## ⛔ DO NOT TOUCH

| File                  | Reason                                           |
| --------------------- | ------------------------------------------------ |
| `Traffic/config.json` | Supabase auth credentials — changes break login  |
| `Cyberpunk/*`         | Historical archive — no modifications            |
| `Models/*.glb`        | Binary assets — only replace via proper workflow |

---

## Files You CAN Modify Freely

| File                                         | What it controls                    |
| -------------------------------------------- | ----------------------------------- |
| `game_core.js`                               | Game engine, physics, AI, rendering |
| `ui.js`                                      | HUD, menus, traffic lights, auth UI |
| `start.js`                                   | Asset loading, model preload list   |
| `env.js`                                     | Environment textures                |
| `vehicles.js`                                | Vehicle building                    |
| `auto.js`, `bus.js`, `lambo.js`              | Specific vehicle models             |
| `course.js`, `cert_assets.js`                | Course/certificate system           |
| `levels/level*.js`                           | Level data and configuration        |
| `Academy.html`, `Driving.html`               | Page HTML                           |
| `TrafficSetup.html`, `TrafficDashboard.html` | Setup/dashboard pages               |

---

## Level Data Format

Each `levels/level*.js` exports a config object:

```js
const LEVEL_CONFIG = {
  name: "Level Name",
  type: "driving" | "pedestrian",
  roads: [{ type: 'v'|'h', x, z, x1, x2, z1, z2 }],
  route: [[x, z], ...],       // waypoints for NPC traffic
  spawn: { x, z, rot },       // player start position
  npcs: [{ type, color, route }],
  trafficLights: [{ pos, dir }],
  timeLimit: 120,
  isNight: false,
  hasRain: false,
  fog: 150,
  ground: 0x3a3a3a
};
```

---

## Design Tokens (Traffic-specific)

| Token         | Value      | Usage                          |
| ------------- | ---------- | ------------------------------ |
| Road color    | `0x3d3f45` | Asphalt road surface           |
| Sidewalk      | `0x8a8a8a` | Pavement/sidewalk              |
| Ground        | `0x4a4a4f` | Default urban ground           |
| Night fog     | `0x0a0a12` | Night mode background          |
| Player accent | `0x00ff00` | Player character emissive glow |
| NPC accent    | `0x0088ff` | NPC character emissive glow    |

---

## 🔴 Skill-First Rule (MANDATORY)

**Before making ANY code change to this project, ALWAYS:**

1. **Find a relevant skill** from the available skill library (loaded skills list)
2. **If no skill exists** → search the internet for best practices/patterns for the task, download or reference the knowledge, then proceed
3. **Apply the skill's guidance** when planning and implementing changes
4. **Plan before coding** — never jump into edits without understanding the domain

This prevents reinventing wheels, ensures industry-standard patterns, and avoids known pitfalls.

---

## Execution Progress

### Completed (June 28–29, 2026)
- [x] Mobile camera look (camYaw/camPitch) — touch-to-look with decay
- [x] Road-relative building spawn — `_buildRoadZones()`, `_isOnRoad()`, `_isInBuildZone()`
- [x] Driving.html canvas `touch-action:none` + swipe hint
- [x] 20-level audit — all levels follow theory+practical format
- [x] Full codebase re-read — verified all critical code paths
- [x] Browser traffic game research — Poki/Drive Mad/Rush 3D benchmarks
- [x] 35+ skills loaded and cross-referenced
- [x] OVERHAUL_PLAN.md created — comprehensive 11-phase plan with 50 levels
- [x] Physics audit — camera shake, rain, puddles, fog, night mode verified

### In Progress
- [x] AGENTS.md update (skill-first rule, progress, physics findings)
- [x] Phase 0: Critical bug fixes (currentRoad, this.levelCfg, puddles, barricades, cleanup)
- [x] Phase 1: Building + obstacle AABB collision (halfW/halfD on all obstacles, AABB overlap test, push-out on contact)

### Upcoming Phases
- [ ] Phase 2: UI simplification for 4-5 year olds

### Physics Audit Results
| System | Status | Details |
|--------|--------|---------|
| Camera shake | ✅ Working | `_camShakeAmt`: NPC=0.40, barricade=0.35, breaker=0.15. Exponential decay. |
| Rain physics | ✅ Working | turn×0.65, grip×0.3, fric+0.025 when `hasRain` |
| Fog | ✅ Working | Rain: 0.3×near, 0.5×far. Normal: full fog. |
| Puddles (level 5) | ✅ Working | 10 puddles, collision at dist<2.5, speed>0.15 = fine |
| Puddles (hasRain levels) | ✅ Fixed | Created AND pushed to `this.puddles[]` — collision now fires |
| Night mode | ⚠️ Incomplete | Sky darkens, moonlight, but no headlights/streetlights/NPC behavior |
| `speed_puddle` task | ❌ BROKEN | Depends on `this.puddles[]` which is incomplete for hasRain |
| `speed_night` task | ⚠️ Partial | Task type exists but no visual night mode beyond sky color |

### Critical Bugs Found (Phase 0)
| Bug | Location | Status |
|-----|----------|--------|
| `currentRoad` undefined | game_core.js:2304 | ✅ Fixed — defined via roadSegments loop |
| `this.levelCfg` wrong ref | game_core.js:2267 | ✅ Fixed — changed to `this.mapCfg` |
| `window.LVL_REWARD_CALLED` | game_core.js:~525 | ⏭️ N/A — variable doesn't exist, guard already in place |
| Puddles not in array | game_core.js:1514-1525 | ✅ Fixed — `this.puddles.push(p)` added to rain loop |
| Barricade spawn on road | game_core.js:1912-1928 | ✅ Fixed — offset changed from ±5 to ±10 |
| Buildings removed by cleanup | game_core.js:1930-1937 | ✅ Fixed — `isBuilding` check added |
| Procedural buildings no tag | game_core.js:1172 | ✅ Fixed — `userData.isBuilding = true` added |

### Upcoming Phases
- **Phase 2**: UI simplification for 4-5 year olds
- **Phase 3**: Tutorial system (progressive unlock, visual-only for kids)
- **Phase 4**: NPC AI fixes (stuck detection, traffic light obedience)
- **Phase 5**: Visual polish (MeshToonMaterial, day/night, weather)
- **Phase 6**: Level routes + physics completeness
- **Phase 7**: Performance & polish (object pooling, draw calls, 30fps mobile)
- **Phase 8**: 2D Phaser 4 scenario demo
- **Phase 9**: 50 level definitions (Indian traffic theory)
- **Phase 10**: Seerle Traffic Academy Android app (React Native/Expo)

---

_Last updated: June 29, 2026_
