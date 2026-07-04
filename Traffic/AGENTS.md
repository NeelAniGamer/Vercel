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

### Completed — verified 2026-07-01 (code audit on game_core.js / start.js / Driving.html)
- [x] **Phase 0 bug fixes** — `currentRoad` declared at `game_core.js:2359`; `this.mapCfg` only (no `this.levelCfg`); barricade offset `±10` at `game_core.js:1987-2007`; obstacle cleanup skips buildings at `game_core.js:2014`; `this.puddles` declared before rain-puddle creation at `game_core.js:1583`; procedural buildings have `userData.isBuilding: true` at `game_core.js:1209, 1371, 1975`.
- [x] **Phase 0.6 — non-issue:** `_buildHuman` is defined as a global `const` at `ui.js:1471` and called from `game_core.js` as a bare global. Works because both scripts share global scope. No context fix needed.
- [x] **Phase 1 — building collision:** AABB test with `halfW`/`halfD` + axis-of-least-penetration push-out at `game_core.js:2935-2960`. The OVERHAUL_PLAN claim that collision is "point-distance < 1.6" is stale.
- [x] **Phase 2 — UI simplification:** z-index vars, task bar redesign, emoji progress stars, progressive HUD (done in earlier sessions).
- [x] **Phase 3 — Tutorial system:** `kid-tutorial` overlay in `Driving.html`, gated on `localStorage('kid_tutorial_done')`, first-play level 1 only. The OVERHAUL_PLAN reference to `localStorage('tutorial_complete')` is stale — actual key is `kid_tutorial_done`.
- [x] **Phase 4 — NPC AI:** 3s stuck timer + teleport at `game_core.js:2501-2521`; lane clamp at the same site; traffic-light detection range tightened to 15m at `game_core.js:2567-2592`.
- [x] **Phase 5 — partial:** night mode is implemented and used at 10+ sites in `game_core.js` (line 609, 962, 1027-1031, 1190, 1319, 1521, 1537, 1572). **`MeshToonMaterial` is NOT used** (only `MeshPhongMaterial` / `MeshLambertMaterial`) — this is a real remaining gap.
- [x] **Phase 6 — Level Route Completeness:** Multi-point routes in `_unpcs` NPCs follow `cfg.route` waypoints with `laneOffset` and automatic wrapping. Rain system: 1200 particles, speed cap at 80%, fog halved, puddle shimmer + splash particles + thunder SFX via Web Audio oscillator. Night: headlight SpotLights + visible ConeGeometry cones (`this._headlightCones`), toggle sync, taillight brake glow. Level-specific layouts complete in `_getMapConfig()` M table (L1-L20 each unique with `roads[]`, `route[]`, `trafficLight[]`, `pedSpawn[]`, `speedBreakers[]`, `buildings[]`).

- [x] **Phase 7 — Performance & polish:** NPC template cache (`_getNpcTemplate()`) with `_npcFree[]`/`_pedFree[]` reuse, smooth camera transition on pointer-lock toggle (0.4s lerp), audio category system (`sfx.vol: {sfx, ui, env}`) with `sfx.setVol()`. Frustum culling, shadow autoUpdate, and InstancedMesh already present for GLB buildings. Phase 7.2 (task bar redesign), 7.3 (InstancedMesh), 7.5 (audio UI) deprioritized — code-level infrastructure in place, UI polish deferred.

### Architecture ground truth (verified)
- **Class is `Game`, not `TrafficGame`.** `AGENTS.md` previously said "TrafficGame" — that was a doc error. Defined at `game_core.js:9`.
- **Levels are lesson data only.** All 20 `levels/levelN.js` files push to `window.LVS[]` with `{id, icon, name, modes, theory, tasks, law, ...}`. There is no separate per-level `LEVEL_CONFIG` — the 3D world for every level comes from the hard-coded `M` table inside `_getMapConfig(lvId)` at `game_core.js:875`. L15 is a special 50km open-world override built procedurally inside the same function.
- **Preloader is monolithic.** `start.js:25-77+` preloads ~100+ GLBs at startup. No per-level loading. Many models in `Models/` are unreferenced (`kenney_animated-characters-*`, `kenney_cube-pets`, `kenney_platformer-pack-remastered`, `road__avenue__street`, the `uploads_files_*` archive).
- **uploads_files_* archive format gap.** The "new model packs" in `New Ideas.txt` are `.rar` / `.zip` / `.fbx` / `.3ds` / `.obj` / `.mtl`. The current loader is GLB-only. Plan: use JSZip in-browser for `.zip` (already loaded), add `FBXLoader` / `OBJLoader` for the other formats, and park `.rar` as future work (JSZip cannot read RAR — needs `node-unrar-js` or a pre-extracted vendor copy).

### Remaining work (per OVERHAUL_PLAN §2026-07-01 plan, ordered)
1. **Per-level asset loading** (Step 1) — split `start.js` into `CORE_ASSETS` + `LEVEL_ASSETS`, extend `_getMapConfig`'s `M[lvId]` with `assets: [...]`.
2. **MeshToonMaterial pass** (Step 2) — switch procedural buildings + NPC factories to toon shading; add a shared `THREE.GradientMap`.
3. **GTA-style open world foundation** (Step 3) — pedestrian-first start, F-to-enter/exit hint button, `road__avenue__street` integration, Kenney building verification.
4. **Ethical-driving mechanics** (Step 4) — 13 sub-systems: scenario scripts per theme, seatbelts/animals/littering, indicators, phone temptation, zebra crossings, signage, wrong-side/overtaking, road-rage NPCs, police checkpoints + e-challan log.
5. **Tier 1-2 level authoring** (Step 5) — extend existing 1-20 with `assets:` and `scenario:`; defer 21-50.
6. **New Ideas #1, #3, #4, #6** (Step 6) — footpath arrow, smart ring path, driving-instructor level, age-adaptive visuals.
7. **2D scenario demo** (Step 7) — Phaser 4 on `Academy.html`.
8. **Performance & polish** (Step 8) — object pooling, frustum-cull-aware shadow autoUpdate, InstancedMesh, camera lerp, mobile 30fps target.

### Post-audit fixes — verified 2026-07-04
- [x] **Fix 1 — confetti z-index:** `start.js:223` changed from `9998` → `20` (sits between canvas and HUD layers).
- [x] **Fix 2 — task-tracker overflow:** `#task-tracker` in `Driving.html` now has `max-width: min(280px, 85vw)`.
- [x] **Fix 3 — 400–768px breakpoint:** New CSS media query in `Driving.html` scales `#task-tracker`, `#objective-overlay`, `#phone-gps`, kid elements, steering wheel, and gauge SVGs.
- [x] **Fix 4 — pause menu:** Escape key handler in `game_core.js:540`; `togglePause()` method; HTML overlay `#pause-overlay` with Resume/Restart/Quit buttons; CSS `#pause-overlay.on { display: flex }`.
- [x] **Fix 5 — steering wheel narrow screens:** `#steer-wheel-container` sized down in 400–768px breakpoint (80px vs 100px).
- [x] **Fix 6 — frustum culling on NPC/ped meshes:** Added `nv.frustumCulled = true` at NPC spawn (lines ~2105, 2145) and `ped.frustumCulled = true` at ped spawn (line ~3655).
- [x] **Fix 7 — dynamic shadow quality:** `_usun()` now monitors FPS every 60 frames; downgrades shadow map to 512 when FPS < 25, upgrades back to 2048 when FPS > 50.
- [x] **Fix 8 — ui.js clone z-index:** `dismissChallan()` clone z-index changed from hardcoded `'999999'` → reads `--z-modal` CSS variable (fallback `'100001'`).
- [x] **Fix 9 — CSP meta tag:** Added `Content-Security-Policy` meta tag to `Driving.html` `<head>`.

### Out of scope (deferred)
- **Seerle Traffic Academy Android app** (was OVERHAUL_PLAN Phase 10) — separate product, separate plan.
- **RAR archive extraction** — JSZip cannot read RAR. Pre-extract on disk or accept a build-time `node-unrar-js` step.
- **Audio system overhaul** — blocked on asset sourcing.
- **road__avenue__street GLTF integration** — Step 3.3 deferred; current road system works.

---

_Last updated: 2026-07-04_
