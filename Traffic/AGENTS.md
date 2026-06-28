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

| File | Reason |
|------|--------|
| `Traffic/config.json` | Supabase auth credentials — changes break login |
| `Cyberpunk/*` | Historical archive — no modifications |
| `Models/*.glb` | Binary assets — only replace via proper workflow |

---

## Files You CAN Modify Freely

| File | What it controls |
|------|-----------------|
| `game_core.js` | Game engine, physics, AI, rendering |
| `ui.js` | HUD, menus, traffic lights, auth UI |
| `start.js` | Asset loading, model preload list |
| `env.js` | Environment textures |
| `vehicles.js` | Vehicle building |
| `auto.js`, `bus.js`, `lambo.js` | Specific vehicle models |
| `course.js`, `cert_assets.js` | Course/certificate system |
| `levels/level*.js` | Level data and configuration |
| `Academy.html`, `Driving.html` | Page HTML |
| `TrafficSetup.html`, `TrafficDashboard.html` | Setup/dashboard pages |

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

| Token | Value | Usage |
|-------|-------|-------|
| Road color | `0x3d3f45` | Asphalt road surface |
| Sidewalk | `0x8a8a8a` | Pavement/sidewalk |
| Ground | `0x4a4a4f` | Default urban ground |
| Night fog | `0x0a0a12` | Night mode background |
| Player accent | `0x00ff00` | Player character emissive glow |
| NPC accent | `0x0088ff` | NPC character emissive glow |

---

*Last updated: June 28, 2026*
