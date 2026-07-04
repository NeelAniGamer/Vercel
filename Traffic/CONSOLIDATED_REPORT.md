# Traffic Academy — Consolidated Report

> **Generated:** 2026-07-03
> **Purpose:** All reports, plans, and idea files in one place.

---

# Table of Contents

1. [Project Overview (AGENTS.md)](#1-project-overview)
2. [Architecture Guide (CLAUDE.md)](#2-architecture-guide)
3. [Ideas & Feature Requests](#3-ideas--feature-requests)
4. [Comprehensive Overhaul Plan](#4-comprehensive-overhaul-plan)
5. [Improvement Plan](#5-improvement-plan)
6. [GTA-Style Open World Upgrade Plan](#6-gta-style-open-world-upgrade-plan)
7. [Performance Analysis](#7-performance-analysis)
8. [Security Plan](#8-security-plan)
9. [Security Setup Guide](#9-security-setup-guide)

---

# 1. Project Overview

**Source:** `AGENTS.md`

## Project Overview

**Traffic** is a 3D browser-based driving/pedestrian simulator built with Three.js. Players navigate Indian city environments (Mumbai-themed), complete driving courses, earn certificates, and explore open-world maps with traffic, NPCs, and pedestrians.

### Tech Stack

- **3D Engine:** Three.js (r128, CDN-loaded)
- **Models:** Kenney asset packs (GLB/GLTF) — cars, buildings, roads, characters
- **Auth:** Supabase (separate from root `col-auth.js`)
- **Levels:** 20+ procedural levels defined in `levels/level*.js`
- **Hosting:** Vercel (static site, served from `Traffic/` subdirectory)

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
6. `game_core.js` — main game class (`Game`)
7. `ui.js` — UI/HUD overlay class (`TrafficUI`)
8. Level data (`levels/level1.js` through `levels/level20.js`)

## Core Systems

### Game Engine (`game_core.js`)

- **Renderer:** WebGL with ACES filmic tone mapping, PCF soft shadows
- **Post-processing:** UnrealBloomPass (subtle glow)
- **Physics:** Simple AABB collision detection against `this.world[]` and `this.obstacles[]`
- **AI:** NPC vehicles follow waypoints, pedestrians walk sidewalks, obey traffic lights
- **Camera:** First-person (pointer lock) or third-person chase cam

### Key Classes

- `Game` — main game loop, physics, rendering, input
- `TrafficUI` — HUD, menus, auth, traffic light display
- `_buildHuman(isPlayer)` — builds character model from preloaded GLB or procedural fallback
- `_buildVehicle(type, color)` — builds vehicle from preloaded GLB or procedural geometry

### Model System (`start.js`)

- All Kenney GLB models are preloaded at startup into `window.PRELOADED_MODELS`
- Models stored at **4.5x scale** (base game-world proportion)
- Instanced buildings clone models from `PRELOADED_MODELS` and set their own scale
- Character models (`char_m_a`, `char_f_a`, etc.) are cloned and scaled to 1.5x for players

## Known Gotchas

1. **Two config.json files** — Root `config.json` and `Traffic/config.json` both contain Supabase credentials. They are separate. Do not mix them up.
2. **Academy.html patches fetch()** — It redirects `config.json` requests to `../config.json` because it lives one directory deeper.
3. **Cyberpunk/ is an archive** — Old build files. Never modify anything inside.
4. **Model scale chain** — GLB loaded → stored at 4.5x → instanced buildings reset to 1x then apply their own `s` value. Character models replace scale directly.
5. **Road tiles are GLTF** — Road geometry comes from `road_straight` model, not procedural. Tiles are positioned at y=0.08 to sit above ground.
6. **Pedestrian mode** — When `vehMode === 'pedestrian'`, `isPedestrian = true` and the player controls a human character. In vehicle mode, the player starts as a pedestrian who can enter/exit a vehicle with F key.
7. **Building rotation** — Buildings rotate to face the road. Vertical road: ±PI/2. Horizontal road: PI or 0. Do NOT add extra rotation offsets.
8. **Shared scripts NOT loaded** — Traffic pages do NOT load `col-router.js`, `col-ui.js`, `col-auth.js`, or `col-3d.js`. They have their own auth/UI system.

## DO NOT TOUCH

| File                  | Reason                                           |
| --------------------- | ------------------------------------------------ |
| `Traffic/config.json` | Supabase auth credentials — changes break login  |
| `Cyberpunk/*`         | Historical archive — no modifications            |
| `Models/*.glb`        | Binary assets — only replace via proper workflow |

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

## Design Tokens (Traffic-specific)

| Token         | Value      | Usage                          |
| ------------- | ---------- | ------------------------------ |
| Road color    | `0x3d3f45` | Asphalt road surface           |
| Sidewalk      | `0x8a8a8a` | Pavement/sidewalk              |
| Ground        | `0x4a4a4f` | Default urban ground           |
| Night fog     | `0x0a0a12` | Night mode background          |
| Player accent | `0x00ff00` | Player character emissive glow |
| NPC accent    | `0x0088ff` | NPC character emissive glow    |

## Execution Progress

### Completed — verified 2026-07-01

- [x] **Phase 0 bug fixes** — `currentRoad` declared at `game_core.js:2359`; `this.mapCfg` only (no `this.levelCfg`); barricade offset `±10` at `game_core.js:1987-2007`; obstacle cleanup skips buildings at `game_core.js:2014`; `this.puddles` declared before rain-puddle creation at `game_core.js:1583`; procedural buildings have `userData.isBuilding: true` at `game_core.js:1209, 1371, 1975`.
- [x] **Phase 0.6 — non-issue:** `_buildHuman` is defined as a global `const` at `ui.js:1471` and called from `game_core.js` as a bare global. Works because both scripts share global scope.
- [x] **Phase 1 — building collision:** AABB test with `halfW`/`halfD` + axis-of-least-penetration push-out at `game_core.js:2935-2960`.
- [x] **Phase 2 — UI simplification:** z-index vars, task bar redesign, emoji progress stars, progressive HUD.
- [x] **Phase 3 — Tutorial system:** `kid-tutorial` overlay in `Driving.html`, gated on `localStorage('kid_tutorial_done')`, first-play level 1 only.
- [x] **Phase 4 — NPC AI:** 3s stuck timer + teleport at `game_core.js:2501-2521`; lane clamp at the same site; traffic-light detection range tightened to 15m at `game_core.js:2567-2592`.
- [x] **Phase 5 — partial:** night mode implemented. **`MeshToonMaterial` is NOT used** — only `MeshPhongMaterial` / `MeshLambertMaterial`.
- [x] **Phase 6 — Level Route Completeness:** Multi-point routes, rain system, night headlights, level-specific layouts in `_getMapConfig()` M table (L1-L20).
- [x] **Phase 7 — Performance & polish:** NPC template cache, smooth camera transition, audio category system, frustum culling.

### Architecture ground truth (verified)

- **Class is `Game`, not `TrafficGame`.** Defined at `game_core.js:9`.
- **Levels are lesson data only.** All 20 `levels/levelN.js` files push to `window.LVS[]`. The 3D world comes from the hard-coded `M` table inside `_getMapConfig(lvId)` at `game_core.js:875`.
- **Preloader is monolithic.** `start.js` preloads ~100+ GLBs at startup.
- **uploads_files_* archive format gap.** Models are `.rar`/`.zip`/`.fbx`/`.3ds`/`.obj`/`.mtl`. Current loader is GLB-only.

### Remaining work (ordered)

1. **Per-level asset loading** — split `start.js` into `CORE_ASSETS` + `LEVEL_ASSETS`
2. **MeshToonMaterial pass** — switch procedural buildings + NPC factories to toon shading
3. **GTA-style open world foundation** — pedestrian-first start, F-to-enter/exit, `road__avenue__street` integration
4. **Ethical-driving mechanics** — 13 sub-systems: scenario scripts, seatbelts/animals/littering, indicators, phone temptation, zebra crossings, signage, wrong-side/overtaking, road-rage NPCs, police checkpoints + e-challan log
5. **Tier 1-2 level authoring** — extend existing 1-20 with `assets:` and `scenario:`; defer 21-50
6. **New Ideas #1, #3, #4, #6** — footpath arrow, smart ring path, driving-instructor level, age-adaptive visuals
7. **2D scenario demo** — Phaser 4 on `Academy.html`
8. **Performance & polish** — object pooling, frustum-cull-aware shadow autoUpdate, InstancedMesh, camera lerp, mobile 30fps target

---

# 2. Architecture Guide

**Source:** `CLAUDE.md`

## What this is

`Traffic/` is a self-contained subdirectory of the Vercel-hosted site. It contains a 3D browser-based driving/pedestrian simulator (Mumbai-themed traffic school) built on Three.js r128. It runs as static files served by Vercel from this subpath. The site root (`../`) is a different product (the COL pages) and shares nothing at runtime.

## Running / developing

There is no build step. The project is plain HTML + ES5-style JS loaded via `<script>` tags. To develop:

- **Local server (required for fetch + GLB loading):**
  - `python -m http.server 8080` from the parent directory, then open `http://127.0.0.1:8080/Traffic/Academy.html`
  - `npx serve` works too. Do **not** open HTML via `file://` — GLB models and `config.json` won't load.
- **Entry points:** `Academy.html` (lesson picker) → `TrafficSetup.html` (vehicle select) → `Driving.html` (the game) → `TrafficDashboard.html` (stats).
- **Browser test harness:** `tests/main.go` (Playwright + Go). Run with `go run tests/main.go` from the parent.
- **No package.json here.** The parent's `package.json` / `node_modules` / `vercel.json` are for the COL site, not for this game.
- **No tests, no linter, no type checker.** Verification is the browser.

## Script load order (critical)

`Driving.html` `<script>` order is the contract. Do not reorder:

1. Three.js r128 CDN
2. JSZip CDN
3. html2pdf CDN
4. `start.js` — model preloader → fills `window.PRELOADED_MODELS` at 4.5× scale, then calls `init()`
5. `env.js` — environment textures
6. `vehicles.js` — vehicle factories
7. `auto.js`, `bus.js`, `lambo.js` — specific vehicle builders
8. `game_core.js` — `class Game` (the main engine)
9. `ui.js` — `TrafficUI` (HUD, menus, auth UI, traffic lights)
10. `levels/level1.js` … `levels/level20.js` — push to `window.LVS`

`Academy.html` patches `window.fetch` to redirect `config.json` → `../config.json`.

## Architecture (the 30-second version)

Two large classes do almost all the work:

- **`Game` in `game_core.js`** — the engine. Owns the renderer, scene, camera, physics (simple AABB), NPC AI (waypoint following + lane clamp [-6,6] + stuck-detection timer), pedestrian logic, traffic lights, input, and the main loop.
- **`TrafficUI` in `ui.js`** — the overlay. HUD, speedometer, gear indicator, GPS arrow, minimap, traffic-light panel, auth modal, admin unlock (Ctrl+Shift+D), toasts.

Supporting modules:

- `start.js` — GLB preloader. After all models are loaded, it instantiates `Game` and `TrafficUI`.
- `env.js` — skybox / ground / ambient textures.
- `vehicles.js` + `auto.js` / `bus.js` / `lambo.js` — vehicle factories.
- `course.js` + `cert_assets.js` — course/lesson metadata and certificate rendering.
- `levels/levelN.js` — data only.

### Model scale chain (memorize this)

GLB loaded → `start.js` stores it in `PRELOADED_MODELS` at **4.5×** → instanced buildings reset to 1× and apply their own `s` value → character models replace scale directly. Road tiles sit at `y=0.08`. Building rotation is determined by road orientation.

### Coordinate system / units

Game-world units are not meters. The road tile width and the `[-6, 6]` lane clamp together define the playable corridor.

## Isolation from the parent site

The Vercel root (`../`) has its own auth (`col-auth.js`), router (`col-router.js`), UI shell (`col-ui.js`, `col-ui.css`), and 3D helper (`col-3d.js`). **Traffic pages do not load any of these.** They bring their own Supabase client and auth UI.

## Common change patterns

- **New vehicle type:** add an entry to `VEHICLE_STATS` in `game_core.js`, add a GLB preloader entry in `start.js`, and a builder in `vehicles.js`.
- **New level:** copy `levels/levelN.js` to `levels/levelN+1.js`, edit the data object, and add a `<script>` tag in `Driving.html`.
- **New HUD element:** add the DOM id to the `ids` array in `_initR()` of `game_core.js`, and to the HTML in `Driving.html`.
- **Touch / mobile:** `Driving.html` has `touch-action:none` on the canvas. Mobile camera look uses `camYaw` / `camPitch` with decay.

## When stuck

- Loading hangs on a white screen → `start.js` did not finish. Check the console.
- "Custom UV sets in KHR_texture_transform" warnings → suppressed in `Driving.html`.
- A vehicle falls through the floor → AABB `halfW` / `halfD` is missing on a new obstacle type.
- NPC vehicles stop permanently → stuck detection (3s timer + teleport) should kick in.

---

# 3. Ideas & Feature Requests

**Source:** `New Ideas.txt`

1. **Footpath Arrow Navigation** — On the road, add an arrow thing. If it's in position mode, then on the footpath add an arrow where it will show the direction where to go.

2. **More Models** — Many more models of houses, traffic cones, and roads have been added to the models folder.

3. **Smart Ring Path** — The rings which are there now for node verification — if it is on the pedestrian option, now make it go on the path. If they are going on the footpath or sidewalk, then it will be on the sidewalk. If they have to cross, then it will be in the middle.

4. **Driving Instructor Level** — Add a lanes option, like how to drive, a proper driving instructor type. Not only traffic rules — how to go in lanes, how to overtake someone, and all examples.

5. **Per-Level Asset Loading** — In that level, only the used models will load, others won't load — they will only load in the levels they are used in.

6. **Age-Adaptive Visuals** — When first signup, add name and age option. Then according to the age, give the visuals — not only for kids but for higher education kids too. Add "enter your real age for best experience."

---

# 4. Comprehensive Overhaul Plan

**Source:** `OVERHAUL_PLAN.md`
**Created:** 2026-06-30
**Target Audience:** 4-5 year old children
**Goal:** Fix all bugs, simplify UI for kids, add tutorials, polish visuals, expand to 50 levels with full Indian traffic theory coverage, and create separate Android app

> **Audit notice (2026-07-01):** Many of the ✅ markers below predate the 2026-07-01 code audit and are stale. For ground truth see `AGENTS.md` "Execution Progress" section.

## Phase 0: Critical Bug Fixes (MUST DO FIRST)

| # | Bug | Fix |
|---|-----|-----|
| 0.1 | `currentRoad` undefined (line 2304) | ✅ FIXED — defined via roadSegments loop |
| 0.2 | `this.levelCfg` → `this.mapCfg` (line 2267) | ✅ FIXED |
| 0.3 | `window.LVL_REWARD_CALLED` | Does not exist — no fix needed |
| 0.4 | `_buildHuman()` context bug | Non-issue — global function, works fine |
| 0.5 | Barricade spawn on road (lines 1912-1928) | ✅ FIXED — offset changed from ±5 to ±10 |
| 0.6 | Player spawns inside barricade | ✅ FIXED |
| 0.7 | Obstacle cleanup near spawn (lines 1930-1937) | ✅ FIXED — `isBuilding` check added |
| 0.8 | Rain puddles not in collision array | ✅ FIXED |
| 0.9 | Procedural buildings missing userData | ✅ FIXED |

## Phase 1: Building + Obstacle Collision

- AABB test with `halfW`/`halfD` + axis-of-least-penetration push-out
- Store bounding boxes in `_buildings[]`
- Barricade AABR collision for rotated rectangles

## Phase 2: UI Simplification for Children

- Fix z-index overlap (47 declarations → consolidate to 10 semantic layers)
- Large visual objective cards (emoji + 3 words max)
- Progressive HUD: Level 1-5 speed+objective only; Level 6-15 add minimap; Level 16+ full HUD
- Simplified controls: default steering+accelerator+brake; advanced controls unlock gradually
- Touch-friendly layout with minimum 48px touch targets

## Phase 3: Tutorial System

- First-level overlay with step-by-step animated hand indicator
- Progressive unlock: Level 1-3 steering+gas only; Level 4-6 add brake; Level 7-9 add horn; Level 10+ add signals/lights/seatbelt
- Reminder tooltips after 30 seconds of inaction
- Visual demonstrations: 5-second animation showing what to do each level

## Phase 4: NPC AI Fixes ✅ COMPLETE

| Task | Detail |
|------|--------|
| Increase stuck detection timer | ✅ 3s timer + teleport-back-to-base in `_unpcs()` |
| Smooth route wrapping | ✅ Lerp over 1.2s with `_wrapT` |
| Better lane filtering | ✅ Lane target clamped to [-6, 6] |
| Traffic light obedience | ✅ Detection range tightened to 15m |

## Phase 5: Visual Polish (Child-Friendly)

- MeshToonMaterial swap (NOT YET DONE — only MeshPhongMaterial/MeshLambertMaterial)
- Color-coded surfaces: Road #3d3f45, Sidewalk #8a8a8a, Grass #4a7c3f
- Reduce vehicle sizes 30%
- Better lighting with HemisphereLight + soft DirectionalLight
- Character completion in pedestrian mode
- Camera shake on collision/brake

## Phase 6: Level Route Completeness

- Multi-point routes (3-5 waypoints per level)
- Level-specific layouts (Level 1 straight road → Level 20 complex city grid)
- Rain/puddle visual effects with splash particles
- Night mode headlights with visible cone geometry

## Phase 7: Performance & Polish

- Object pooling for NPCs (pre-create 20 vehicles, 50 pedestrians)
- Frustum culling (Three.js default + distance-based visibility)
- Draw call batching with InstancedMesh for repeated objects
- Smooth camera transitions (lerp position, slerp rotation)
- Audio category system (music, SFX, voice with independent volume)

## Phase 8: 2D Scenario Demo (Phaser 4)

**Purpose:** Quick visual demo of traffic scenarios without full 3D engine

- 2D top-down or side-view traffic scenarios
- Tap to interact (stop at light, avoid obstacle)
- Score tracking
- Visual style: colorful, cartoon, large sprites

## Phase 9: 50-Level System Expansion

### Tier Structure

| Tier | Levels | Theme | Difficulty |
|------|--------|-------|------------|
| 1 | 1-10 | Basic Rules | ⭐ |
| 2 | 11-20 | Intermediate Rules | ⭐⭐ |
| 3 | 21-30 | Advanced Rules | ⭐⭐⭐ |
| 4 | 31-40 | Expert Rules | ⭐⭐⭐⭐ |
| 5 | 41-50 | Bonus/Special | ⭐⭐⭐⭐⭐ |

### Car Unlock Progression (every 5 levels)

1. Level 1: Car (basic) → Level 5: Auto-rickshaw → Level 10: School bus → Level 15: Taxi → Level 20: Truck → Level 25: Ambulance → Level 30: Bike → Level 35: SUV → Level 40: Police car → Level 45: Sports car

### TIER 1: BASIC RULES (Levels 1-10)

| Level | Name | Theme | Law Reference |
|-------|------|-------|---------------|
| 1 | Red Light, Green Light! | Traffic lights | MV Act Section 119 |
| 2 | Crosswalk Hero! | Zebra crossings | MV Act Section 123 |
| 3 | Speed Limit City! | Speed limits | MV Act Section 183 |
| 4 | Stop Sign Sam! | Stop signs | MV Act Section 118 |
| 5 | Turn Signal Twist! | Turn signals | MV Act Section 114 |
| 6 | Horn Rule! | Horn usage | MV Act Section 118 |
| 7 | Seat Belt Buddy! | Seatbelts | MV Act Section 138 |
| 8 | Helmet Hero! | Helmets | MV Act Section 129 |
| 9 | Right of Way! | Priority rules | MV Act Section 117 |
| 10 | Mirror Check! | Mirror usage | MV Act Section 117 |

### TIER 2: INTERMEDIATE RULES (Levels 11-20)

| Level | Name | Theme | Law Reference |
|-------|------|-------|---------------|
| 11 | Roundabout Rondo! | Roundabouts | MV Act Section 120 |
| 12 | Overtaking Ouch! | Overtaking | MV Act Section 115 |
| 13 | Emergency Lane! | Emergency vehicles | MV Act Section 119A |
| 14 | School Zone! | School zones | MV Act Section 183 |
| 15 | Railway Gate! | Railway crossings | MV Act Section 119 |
| 16 | Highway Merge! | Highway merging | MV Act Section 117 |
| 17 | Night Drive! | Night driving | MV Act Section 112 |
| 18 | Rainy Day! | Weather driving | MV Act Section 117 |
| 19 | Parking Problems! | Parking | MV Act Section 122 |
| 20 | Fuel Efficiency! | Efficient driving | MV Act Section 117 |

### TIER 3: ADVANCED RULES (Levels 21-30)

| Level | Name | Theme | Law Reference |
|-------|------|-------|---------------|
| 21 | U-Turn U-Turn! | U-turns | MV Act Section 120 |
| 22 | Unmarked Crosswalk! | Pedestrian priority | MV Act Section 123 |
| 23 | Bus Stop Patrol! | Bus stop safety | MV Act Section 117 |
| 24 | Construction Zone! | Construction zones | MV Act Section 117 |
| 25 | Know Your Signs! | Road signs | MV Act Section 116 |
| 26 | Cows on the Road! | Animal protection | MV Act Section 117 |
| 27 | Narrow Street! | Narrow streets | MV Act Section 117 |
| 28 | Parking Rules! | Parking zones | MV Act Section 122 |
| 29 | Auto-Rickshaw Dance! | Auto-rickshaw awareness | MV Act Section 117 |
| 30 | Toll Plaza! | Toll plazas | NHAI Rules |

### TIER 4: EXPERT RULES (Levels 31-40)

| Level | Name | Theme | Law Reference |
|-------|------|-------|---------------|
| 31 | Blind Corner! | Blind corners | MV Act Section 117-118 |
| 32 | Hill Driving! | Hill driving | MV Act Section 117 |
| 33 | Bus Stop Yield! | Bus stop yielding | MV Act Section 117 |
| 34 | Construction Zone! | Construction zones | MV Act Section 117 |
| 35 | One-Way Wonder! | One-way streets | MV Act Section 119 |
| 36 | Sign Recognition! | Sign identification | MV Act Section 116 |
| 37 | Hospital Quiet Zone! | Hospital zones | MV Act Section 118 |
| 38 | Festival Traffic! | Festival traffic | MV Act Section 117 |
| 39 | Cyclist Safety! | Cyclist safety | MV Act Section 117 |
| 40 | Grand Test! | Comprehensive review | All MV Act sections |

### TIER 5: BONUS/SPECIAL (Levels 41-50)

| Level | Name | Theme | Law Reference |
|-------|------|-------|---------------|
| 41 | First Aid Scene! | Accident response | MV Act Section 134 |
| 42 | Road Rage! | Aggressive driving | MV Act Section 117 |
| 43 | Pollution Check! | PUC certificate | MV Act Section 190 |
| 44 | Child Safety! | Child seats | MV Act Section 129 |
| 45 | Passenger Safety! | Passenger seatbelts | MV Act Section 138 |
| 46 | Weather Emergency! | Extreme weather | MV Act Section 117 |
| 47 | Night Parking! | Night parking | MV Act Section 122 |
| 48 | Trip Preparation! | Trip prep | MV Act Section 117 |
| 49 | City Navigation! | Complex city driving | All MV Act sections |
| 50 | Comprehensive Final Exam! | Final test | All MV Act sections |

## Phase 10: Android App — Seerle Traffic Academy

**Tech Stack:** React Native + Expo (best balance of performance + code reuse)

### Features:
- Port all 50 levels from web version
- Touch-optimized controls
- Offline gameplay
- Progress saved locally
- Parental controls (time limits)
- Achievement system

### Tech Stack:
- React Native + Expo SDK
- Three.js for 3D (via expo-three)
- AsyncStorage for progress
- React Navigation for screens

## Browser Game UX Benchmarks

### Poki.com Guidelines
- **First 3 seconds:** Gameplay must start instantly
- **Visual-only tutorials:** No text blocks, show don't tell
- **Dopamine loops:** Score → star → unlock → next level
- **10 seconds per level** for kids
- **3-5 second tutorial overlay** with animated hand
- **48px minimum touch targets**

### Drive Mad Pattern
- 100 hand-crafted levels
- Instant restart on failure
- Simple one-finger controls

### MR RACER Pattern
- Near-miss scoring: +5/10/50 for distance thresholds
- Speed boosts for clean driving

### Traffic Rush Pattern
- Swipe to switch lanes
- Collect coins for points

## Performance Targets

| Platform | FPS | Triangles | Draw Calls |
|----------|-----|-----------|------------|
| Desktop | 60 | 500K | 200 |
| Mobile (High) | 60 | 200K | 100 |
| Mobile (Mid) | 30 | 100K | 50 |
| Mobile (Low) | 30 | 50K | 30 |

## Files to Modify

| File | Changes |
|------|---------|
| `game_core.js` | Bug fixes, collision, NPC AI, camera shake, performance |
| `ui.js` | Character completion, HUD simplification |
| `Driving.html` | Z-index fixes, touch layout, controls |
| `course.js` | Level definitions |
| `levels/*.js` | Add 3D world configs for levels 21-50 |
| `Academy.html` | Phaser 4 scenario demo |
| `start.js` | Asset loading optimization, tutorial triggers |

## Key Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 2D Demo Framework | Phaser 4 | Full 2D game features, WebGL rendering, built-in physics |
| Android Stack | React Native/Expo | Code reuse from web, single codebase for iOS too |
| Collision System | AABB with THREE.Box3 | Simple, performant, Three.js native |
| Tutorial Style | Animated hand icons + modal | Best for 4-5 year olds who can't read |
| UI Reveal | Progressive unlock | Prevents overwhelming young children |
| Vehicle Scale | 30-40% reduction | Current vehicles too large for map scale |
| NPC Stuck Timer | 3 seconds | Current 1.5s too aggressive |
| Audio | Web Audio API | No external dependencies, works on mobile |

---

# 5. Improvement Plan

**Source:** `IMPROVEMENT_PLAN.md`
**Created:** 2026-07-02

## Executive Summary

This document outlines the problematic areas in the codebase and provides recommendations to make the game smoother, more visually appealing for children (4-5 years old), and better performing.

## Completed Work (Verified)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Critical bugs fixed (currentRoad, levelCfg→mapCfg, barricade offset) | ✅ Done |
| Phase 1 | Building AABB collision with push-out | ✅ Done |
| Phase 2 | UI simplification, z-index fixes | ✅ Done |
| Phase 3 | Tutorial system with kid_tutorial_done | ✅ Done |
| Phase 4 | NPC AI: 3s stuck timer, lane clamp | ✅ Done |
| Phase 6 | Multi-point routes, rain/night mode | ✅ Done |
| Phase 7 | Object pooling, NPC template cache, audio categories | ✅ Done |

## Problematic Areas (Remaining Work)

### 1. MeshToonMaterial — ✅ COMPLETE (per improvement plan, but AGENTS.md says NOT done)

- `game_core.js` — Uses MeshToonMaterial for roads, grass, sidewalks, buildings (lines 1102-1200)
- `ui.js` — Now uses MeshToonMaterial for vehicles, characters, and briefing scene

### 2. No Camera Shake on Collision ❌

- **Current State:** Static camera, no impact feedback
- **Required:** Camera shake effect when hitting obstacles

### 3. No Particle Effects ❌

Missing:
- Dust particles when braking
- Splash particles in rain
- Confetti on level completion

### 4. Monolithic Asset Loader (Performance)

- **Current:** 100+ GLBs load at startup regardless of level
- **Required:** Per-level asset loading
- **Files:** `start.js`

### 5. Non-GLB Model Support Missing

- `uploads_files_*` are `.rar`, `.zip`, `.fbx`, `.3ds`, `.obj`
- Current: Only GLB loading supported
- Required: FBXLoader, OBJLoader, JSZip for archives

## Implementation Priorities

### Priority 1: High Impact

1. **MeshToonMaterial Switch** — Replace all MeshPhongMaterial/MeshLambertMaterial with MeshToonMaterial
2. **Camera Shake** — Add impact feedback on collision

### Priority 2: Medium Impact

3. **Particle Effects** — Dust on brake, rain splashes, confetti on win
4. **Smooth Camera Transitions** — Lerp between camera positions

### Priority 3: Long-term

5. **Per-level Asset Loading** — Load only needed models per level
6. **Additional Model Formats** — Support FBX, OBJ, 3DS

## Quick Wins Summary

1. Add camera shake on collision (2-3 hours)
2. Switch to MeshToonMaterial (4-6 hours)
3. Add particle effects (3-4 hours)
4. Confetti celebration (2 hours)

**Total Estimated Effort:** 11-15 hours

## Additional Gameplay Improvements

### Better Mobile Controls
- Add tilt-to-steer using gyroscope
- Swipe gestures for lane changes
- Larger touch targets (48px minimum)

### Vehicle Handling
- Increase grip slightly for smoother handling
- Add automatic brake on high-speed collision
- Better suspension feel

### Audio Improvements
- Engine sound synthesis (Web Audio API)
- Collision impact sounds
- Level complete jingle
- Ambient city sounds

---

# 6. GTA-Style Open World Upgrade Plan

**Source:** `GTA_Style_Open_World_Upgrade_Plan.md`

## 1. Fix the "Reset to Home Page" Bug & Asset Loading

**The Problem:** Currently, start.js downloads the 3D models in the background after the game starts. When it finishes downloading, it triggers a callback that accidentally resets the game and forces you back to the home screen.

**The Solution:**
- Create a dedicated Loading Screen when you first open the website
- Stream all the Kenney assets, cars, and road textures before letting you enter the home page
- Guarantee buildings and roads will be fully 3D from the very first second

## 2. GTA-Style Walking & Driving for ALL Levels

**The Problem:** Currently, only specific levels let you walk around as a pedestrian.

**The Solution:**
- Update game_core.js so that every single level drops you into the world as a pedestrian by default (GTA style)
- Freely walk around the open world, explore the 3D Kenney buildings, and press F to enter your assigned vehicle
- Hook up Kenney Animated Characters for improved walking experience

## 3. High-Quality Road & Avenue Textures

**The Solution:**
- Integrate the road__avenue__street/scene.gltf model and its high-resolution textures
- Ensure intersections align perfectly with the avenue textures

## 4. Integrate Kenney Building Models

**The Solution:**
- Ensure all 21 Suburban buildings and 20 Industrial buildings are loaded correctly
- Procedural city builder will populate the open world with diverse 3D buildings

## 5. Dynamic Scenarios & Ethical AI Behaviors

Five core themes with specific GTA-style scenarios:

- **Pedestrian Courtesy (Levels 1, 5, 14, 19):** Wait patiently and let pedestrians cross safely despite NPC honking.
- **Respectful Parking (Levels 2, 6, 10, 15):** Find legal parking and walk to the shop instead of illegally parking.
- **Ambulance Priority (Levels 3, 8, 12, 17):** Safely pull over to the shoulder to let ambulances pass.
- **Puddle Etiquette (Levels 4, 9, 13, 18):** Slow down around large puddles near footpaths to avoid splashing pedestrians.
- **No Honking Zone (Levels 7, 11, 16, 20):** Navigate obstacles safely without using the horn near Hospitals or Schools.

## 6. Advanced Civic Sense Mechanics

- Seatbelts & Passengers
- Animals on the Road
- Two-Wheeler Discipline
- Littering & Environment

## 7. Night Driving, Headlights & Signaling

- Day/Night Cycle
- High Beam vs. Low Beam
- Indicator & Hand Signals
- Hazard Lights

## 8. Distracted & Drunk Driving

- Phone Temptation (press a key to check phone causes control loss + challan)
- Impaired Vision scenarios

## 9. Speed Breakers, Zebra Crossings & School Zones

- Speed Breakers damage vehicles at high speeds
- Zebra Crossings strict stopping rules
- School Zones strict 30 km/h limits and no honking

## 10. Environmental Physics & Weather

- Rain & Slippery Roads
- Fog & Reduced Visibility

## 11. Dynamic Road Signage

- Procedural placement of official traffic signs based on level zones

## 12. Road Rage, Overtaking & Lane Discipline

- Wrong-Side Driving Detection
- Overtaking Rules (right side only)
- Road Rage NPCs

## 13. Documents & E-Challan System

- Random Police Checkpoints
- E-Challan Log for tracking all fines and violations

## 14. Auto-Rickshaw & Shared Vehicle Sense

- Auto-Rickshaw Mode (no overloading, correct routes)
- Shared Auto Chaos (NPC autos stopping abruptly)

## 15. Public Transit & Specialized Driving

- Specialized zones: Train/Metro Hubs, Bus/BRTS, Construction Zones, Bazaars, Gully Driving, Flyovers

## 16. Coastal Areas, Boats, and Famous Monuments

- Sea Boats & Coastline
- Famous Monuments (Gateway of India)

## 17. Custom "Sneh Asha" Landmark

- Create a special 3D building mapped with the "Sneh Asha" storefront texture as a key objective/destination

---

# 7. Performance Analysis

**Source:** `PERFORMANCE_ANALYSIS.md`
**Last Updated:** 2026-07-03

## Executive Summary

The game is consuming high resources due to multiple factors across rendering, physics, memory, and event handling.

## 1. RENDERING ISSUES

### 1.1 Post-Processing Always Enabled (CRITICAL)

**Location:** `game_core.js:68-77`

- Bloom post-processing is GPU-intensive, applied unconditionally
- **Impact:** ~30-50% GPU usage increase on mobile devices
- **Fix:** Disable bloom on mobile/low-end devices

### 1.2 Shadow Map Quality Not Adaptive

**Location:** `game_core.js:57-64`

- 1024x1024 shadow map on mobile is still large
- No detection of low-end devices (just mobile regex)
- **Fix:** Lower shadow map to 512x512 on mobile, consider disabling entirely on very low-end

### 1.3 No Frustum Culling

- Objects outside camera view still rendered
- Distance-based visibility toggle only (line 2658-2664)
- **Fix:** Implement proper frustum culling

### 1.4 Too Many Meshes in Scene

- No Level of Detail (LOD) system
- **Fix:** Add LOD for buildings and vehicles

### 1.5 Ground Plane Too Large

**Location:** `game_core.js:1110`

- 100,000 x 100,000 unit plane = 10 billion units² of geometry!
- **Fix:** Use smaller ground plane with repeated texture, or chunked system

### 1.6 High Pixel Ratio Not Capped

**Location:** `game_core.js:46-48`

- Mobile DPR can go up to 3x or 4x on modern phones
- 1.5x on mobile means 2.25x more pixels
- **Fix:** Cap mobile DPR at 1.0 or 1.25

## 2. PHYSICS & COLLISION ISSUES

### 2.1 O(n²) Collision Detection (CRITICAL)

**Location:** `game_core.js:743-755`

- With 50 NPCs: 1,225 checks per frame
- With 100 NPCs: 4,950 checks per frame
- No spatial partitioning (quadtree/octree)
- **Fix:** Implement spatial partitioning or reduce max NPCs on mobile

### 2.2 Player-NPC Distance Checks Every Frame

**Location:** `game_core.js:734-741`

- `distanceTo()` involves square root — expensive in loops
- **Fix:** Use `distanceToSquared()` and compare against squared distances

### 2.3 No Object Pooling for Physics

- NPC pool exists but isn't fully utilized
- **Fix:** Ensure consistent use of pooling

## 3. MEMORY ISSUES

### 3.1 No Cleanup on Level Change

**Location:** `game_core.js:1034-1039`

- Removing all children from scene is brute-force
- Some geometries/materials may not be disposed properly
- **Fix:** Properly dispose geometries and materials before removal

### 3.2 Template Cache Unbounded

**Location:** `game_core.js:12-20`

- Cache size limit of 80 is arbitrary
- **Fix:** Add LRU eviction or fixed-size cache

### 3.3 Multiple Arrays Being Updated

**Location:** `game_core.js:28`

- 9+ arrays updated every frame
- **Fix:** Consider single entity component system

## 4. EVENT LISTENER ISSUES

### 4.1 Many Event Listeners Added Dynamically

- Keyboard, Mouse, Touch, Pointer lock, Window events
- **Fix:** Use event delegation, remove when not needed, throttle mouse/touch

### 4.2 No Event Throttling

- `mousemove`, `touchmove` fire at display refresh rate
- **Fix:** Add throttling (every 16ms = 60fps cap)

## 5. GAME LOOP ISSUES

### 5.1 Too Many Updates Per Frame

**Location:** `game_core.js:2251`

- 14+ update functions called every frame
- **Fix:** Skip pedestrian update when in vehicle, skip minimap when not visible

### 5.2 No Frame Rate Targeting

- Game runs at monitor refresh rate (60/120/144fps)
- **Fix:** Cap at 60fps, use fixed timestep for physics

## 6. UI ISSUES

### 6.1 DOM Queries in Loop

- DOM elements are cached (good!) but some updates may be expensive

### 6.2 No CSS Containment

- **Fix:** Use `contain: layout style paint` CSS property

## Summary Table

| Issue | Severity | Location | Fix Complexity |
|-------|----------|----------|----------------|
| Bloom always on | 🔴 Critical | :68-77 | Easy |
| O(n²) collision | 🔴 Critical | :743-55 | Medium |
| No frustum culling | 🟠 High | General | Medium |
| Large ground plane | 🟠 High | :1110 | Easy |
| High pixel ratio | 🟠 High | :46-48 | Easy |
| Too many updates | 🟠 High | :2251 | Easy |
| No frame cap | 🟡 Medium | :2247 | Easy |
| Event throttling | 🟡 Medium | Multiple | Medium |
| Memory cleanup | 🟡 Medium | :1034 | Medium |
| LOD system | 🔴 Critical | N/A | Hard |

## Implementation Priority

### Phase 1 — Quick Wins (5-10 min each)
1. Disable bloom on mobile
2. Cap pixel ratio at 1.0 for mobile
3. Lower shadow map to 512x512
4. Use distanceToSquared instead of distanceTo
5. Cap frame rate at 60fps

### Phase 2 — Medium Effort (30 min each)
6. Implement frustum culling
7. Reduce max NPCs on mobile
8. Throttle event listeners
9. Proper memory disposal

### Phase 3 — Advanced (hours)
10. Add LOD system
11. Spatial partitioning for collision
12. Entity component system

---

# 8. Security Plan

**Source:** `SECURITY_PLAN.md`
**Last Updated:** 2026-07-03

## Maximum Security Plan for Free (Vercel + Supabase + GitHub + ClouDNS)

### 1. Vercel Security

**Free Tier Features:**
- WAF (Web Application Firewall)
- DDoS Mitigation (automatic)
- Automatic HTTPS/SSL
- HSTS (auto-enabled on .vercel.app)
- Rate Limiting (Beta)
- Custom Firewall Rules (IP, JA4, geolocation filtering)
- Vercel Authentication (preview deployments)

**Critical: Environment Variables**

| Prefix | Exposed to Browser? | Use For |
|--------|---------------------|---------|
| `NEXT_PUBLIC_` | ✅ Yes | Public API URLs, feature flags |
| No prefix | ❌ No (server-only) | API keys, secrets, credentials |

**Action Items:**
- Review ALL environment variables — remove `NEXT_PUBLIC_` from secret keys
- Store all secrets without the prefix

**Security Headers (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

**Protect Preview Deployments:** Enable Vercel Authentication in Project Settings → Deployment Protection

### 2. Supabase Security

**Row Level Security (RLS) — THE MOST IMPORTANT**

If RLS is not enabled, your entire database is PUBLIC.

```sql
-- Enable RLS on a table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Create policies (always use these patterns)
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

**Note:** Always use `(SELECT auth.uid())` instead of `auth.uid()` for performance (171ms → <0.1ms)

**API Key Management:**

| Key | Usage | Safety |
|-----|-------|--------|
| `anon` key | Frontend/client-side | ✅ Safe (subject to RLS) |
| `service_role` key | Server-side admin | ❌ **NEVER expose in frontend** |

**Authentication Best Practices:**
- Enable email confirmation
- Set minimum password to 12+ characters
- Set JWT expiry to 1 hour (3600 seconds)

### 3. GitHub Security

**Free Security Features:**

| Feature | Public Repos | Private Repos |
|---------|--------------|---------------|
| Dependabot Alerts | ✅ | ✅ |
| Secret Scanning Alerts | ✅ | ✅ (with push protection) |
| Push Protection | ✅ | ❌ (paid) |
| Code Scanning | ✅ | ❌ (paid) |
| Dependency Review | ✅ | ❌ (paid) |

**Critical Settings:**
- Branch protection rules (require PR reviews)
- Enable Dependabot with `dependabot.yml`
- Create `SECURITY.md`
- Enable Secret Scanning (for public repos)
- Require 2FA for all members

### 4. ClouDNS Security

**Free Tier:**
- Hidden Master DNS
- Disable recursion
- Add SPF/DMARC records for email
- Monitor query logs regularly

**Recommended Upgrade:** Premium DNS ($2.95/mo) for DNSSEC, rate limiting, Anycast DDoS protection

---

# 9. Security Setup Guide

**Source:** `SECURITY_SETUP_GUIDE.md`
**Last Updated:** 2026-07-03

## Already Done
- vercel.json (security headers)
- .github/dependabot.yml
- .github/SECURITY.md
- Checked code for secrets (SAFE)

## Step-by-Step Setup

### 🔴 CRITICAL: Step 1 — Vercel Environment Variables (2 minutes)

1. Go to Vercel Dashboard
2. Click your Project → Settings → Environment Variables
3. Look at EACH variable — remove `NEXT_PUBLIC_` from secrets
4. Save changes

### 🔴 CRITICAL: Step 2 — Vercel Deployment Protection (1 minute)

1. Project Settings → Deployment Protection
2. Toggle Vercel Authentication to ON

### 🟠 HIGH: Step 3 — GitHub Branch Protection (2 minutes)

1. Repository Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Check: Require pull request reviews (1 reviewer), Require status checks, Include administrators
4. Save

### 🟠 HIGH: Step 4 — GitHub 2FA (3 minutes)

1. GitHub Settings → Security → Enable two-factor authentication
2. Set up using authenticator app
3. Scan QR code with Authy or Google Authenticator
4. **SAVE THE RECOVERY CODES**

### 🟠 HIGH: Step 5 — Supabase Security Settings (3 minutes)

1. Supabase Dashboard → Project → Authentication → Providers → Email
2. Confirm email: ON
3. Password minimum length: 12
4. Authentication → URL Configuration → JWT Expiry: 3600

### 🟡 MEDIUM: Step 6 — ClouDNS Security (3 minutes)

1. ClouDNS Dashboard → your domain → Master DNS settings
2. Enable Hidden Master
3. Disable Recursion
4. Add SPF record: `v=spf1 include:_spf.google.com ~all`

## Complete Checklist

| Step | What to Do | Status |
|------|------------|--------|
| 1 | Vercel env vars - remove NEXT_PUBLIC_ from secrets | [ ] |
| 2 | Vercel Authentication - enable | [ ] |
| 3 | GitHub branch protection - enable | [ ] |
| 4 | GitHub 2FA - enable | [ ] |
| 5 | Supabase email confirm + password 12+ | [ ] |
| 6 | ClouDNS hidden master + SPF | [ ] |

## If You Add Tables to Supabase Later

```sql
-- Enable RLS on your new table
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;
ALTER TABLE your_table_name FORCE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users read own" ON your_table_name
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own" ON your_table_name
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own" ON your_table_name
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

## Summary: What You Get For Free

| Layer | Free Protection |
|-------|-----------------|
| **Deploy (Vercel)** | WAF, DDoS mitigation, SSL, security headers, rate limiting, preview auth |
| **Database (Supabase)** | Row Level Security, RLS policies, anon key restrictions |
| **Code (GitHub)** | Dependabot alerts, secret scanning, branch protection, 2FA |
| **DNS (ClouDNS)** | Basic DNS, hidden master, manual monitoring |

---

# Document Sources

| File | Purpose |
|------|---------|
| `AGENTS.md` | Agent rules, architecture, execution progress |
| `CLAUDE.md` | Development guide, architecture, common patterns |
| `New Ideas.txt` | Feature requests and ideas |
| `OVERHAUL_PLAN.md` | Comprehensive 10-phase overhaul plan with 50 levels |
| `IMPROVEMENT_PLAN.md` | Specific code improvements and priorities |
| `GTA_Style_Open_World_Upgrade_Plan.md` | GTA-style features and ethical driving mechanics |
| `PERFORMANCE_ANALYSIS.md` | Resource usage analysis and optimization |
| `SECURITY_PLAN.md` | Free security measures across Vercel/Supabase/GitHub/ClouDNS |
| `SECURITY_SETUP_GUIDE.md` | Step-by-step security setup walkthrough |

---

*Consolidated report generated: 2026-07-03*
