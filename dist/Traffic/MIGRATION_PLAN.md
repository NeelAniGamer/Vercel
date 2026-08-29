# Traffic Desktop App — Migration Plan & Architecture

> **Purpose:** Convert the Traffic Driving Simulator from a static HTML web app into a dual-output project: web (Vercel) + desktop (Electron installer). Both share 100% of the game code.
>
> **Status:** Phases 1-6 Complete — dual-output pipeline verified (web + desktop)
> **Last updated:** August 21, 2026

---

## 1. Project Background

### What is Traffic?

A 3D browser-based Mumbai-themed driving and pedestrian safety game with two modes:
- **Driving mode** (`Driving.html`) — Vehicle simulation with traffic, NPCs, missions
- **Academy mode** (`Academy.html`) — Pedestrian safety training with syllabus, quizzes, certificates
- Plus: `TrafficDashboard.html`, `TrafficSetup.html`, `student.html`, `teacher.html`, `parent.html`

### Original Architecture (static HTML)

| Aspect | Detail |
|--------|--------|
| **Engine** | `game_core.js` — 548KB, ~7,000-8,600 lines, single file |
| **Tech stack** | Three.js r128 (pinned), vanilla JS, zero build step |
| **Modules** | ~15 script files loaded via `<script defer>` tags, all communicating through `window` globals |
| **Deployment** | Static HTML → Vercel (auto-deploy on push to main) |
| **Persistence** | `localStorage` (key: `mth4`) + Supabase cloud sync via `../col-auth.js` |
| **Assets** | 18MB base64 GLB bundles (`cert_assets.js`) + Kenney model packs in `Models/` |
| **Levels** | 52 levels + custom, defined in `levels/level1..52.js` + `level_custom.js` |

### Original File Structure

```
Traffic/
├── game_core.js              # 548KB main engine (physics, render loop, scene management)
├── three.js                  # Three.js r128 library (pinned)
├── start.js                  # Boot: preloadModels → ui.init → game.startLevel
├── ui.js                     # 4,460 lines — every screen/menu/modal + procedural meshes
├── pools.js                  # ThreePools — object pooling (Mesh, Group, Vector3, etc.)
├── road-graph.js             # RoadGraph — A* pathfinding, building slots
├── render_core.js            # RenderCore — quality presets, DRS, bloom
├── safezone-ui.js            # SafeZoneGrid — HUD with safe-area insets
├── traffic-manager.js        # NPC spawning, density, platoons
├── npc-ai.js                 # NPCAI — 12-state FSM, driver personalities
├── course.js                 # MODES, MODULES, BADGES, MODE_CONFIG (52 levels)
├── scenario2d.js             # 2D scenario game (canvas-based)
├── world-streamer.js         # Procedural city streaming (chunk-based)
├── mission-manager.js        # CHECKPOINT, COLLECT, TIME_TRIAL, DELIVERY, FOLLOW
├── rule-breaker-profiles.js  # Chaos mode violator profiles
├── gameplay-recorder.js      # Records violations for post-level review
├── traffic-charts.js         # Chart.js wrappers for dashboard
├── wallet-history.js         # In-game wallet transaction history
├── brace_tracker.js          # Player position tracking
├── welcome-back.js           # Returning player modal
├── check.js                  # Debug script (one-off)
├── pw_test.js                # Headless Chromium smoke test
├── Driving.html              # 7,504 lines — driving mode entry point
├── Academy.html              # 6,686 lines — academy mode entry point
├── TrafficDashboard.html     # Admin analytics view
├── TrafficSetup.html         # Settings/configuration
├── student.html              # Student portal
├── teacher.html              # Teacher dashboard
├── parent.html               # Parent progress view
├── GamePage.html             # React bundle landing page
├── cert_assets.js            # ~18MB — base64 GLB models (NEVER EDIT)
├── env.js                    # Environment/skybox asset bundle
├── auto.js                   # Auto-rickshaw model bundle
├── bus.js                    # Bus model bundle
├── lambo.js                  # Lamborghini model bundle
├── lambo_105ba.js            # Alternate Lamborghini
├── orig_lambo.js             # Original Lamborghini backup
├── animations.css            # Keyframe animations
├── traffic-charts.css        # Chart styles
├── welcome-back.css          # Welcome-back modal styles
├── config.json               # Supabase creds (DO NOT EDIT)
├── vercel.json               # Security headers only
├── levels/                   # level1.js … level52.js, level_custom.js
├── Models/                   # Kenney 3D asset packs (GLB/FBX/OBJ)
├── textures/                 # Texture files
├── images/                   # UI images
└── docs/                     # Documentation
```

### Original Script Load Order (MANDATORY — never reorder in HTML)

```
CDN Three.js r128 + examples → cert_assets.js, env.js, auto.js, bus.js, lambo.js
→ levels/level1..52.js + level_custom.js → start.js → pools.js → road-graph.js
→ render_core.js → safezone-ui.js → gameplay-recorder.js → scenario2d.js
→ game_core.js → npc-ai.js → traffic-manager.js → rule-breaker-profiles.js
→ course.js → ui.js
```

### Original Boot Flow

1. `start.js` declares `game` global + asset tables
2. `preloadModels()` loads core assets with progress bar
3. `ui.init()` sets up menus/modals
4. `game = new Game()` runs:
   - `ThreePools.init(this)` — sets up global pools
   - `_initR()` — renderer, camera, scene, post-processing
   - `_initIn()` — input (keyboard, touch, virtual joystick)
   - `_initG()` — game state, vehicle, HUD
5. Reads `?lv=` / `?mode=` from URL or `localStorage`
6. `game.startLevel()` → `_actualStart()` → `_buildScene(mode)`
7. Watchdog redirects to Academy if canvas not active in 30s

### Original Module Dependency Map

| File | Global | Depends On |
|------|--------|------------|
| `game_core.js` | `Game`, `game`, `VEHICLE_STATS`, `PACEJKA` | All subsystems (null-guarded) |
| `start.js` | `ASSET_MANIFEST`, `PRELOADED_MODELS`, `loadLevelAssets` | None (defines boot) |
| `ui.js` | `ui`, `toast`, `sfx` | `game`, Supabase |
| `pools.js` | `ThreePools` | None (standalone) |
| `road-graph.js` | `RoadGraph`, `RoadNode`, `RoadEdge` | Three.js |
| `render_core.js` | `RenderCore`, `QUALITY_PRESETS` | Three.js |
| `safezone-ui.js` | `SafeZoneGrid` | None (standalone) |
| `traffic-manager.js` | `TrafficManager` | `RoadGraph`, `NPCAI` |
| `npc-ai.js` | `NPCAI`, `PedestrianAI`, `NPC_PROFILES` | `RoadGraph` |
| `course.js` | `MODES`, `MODULES`, `BADGES`, `MODE_CONFIG` | None (data only) |
| `scenario2d.js` | `Scenario2D`, `Scenario2DData` | Canvas 2D API |
| `world-streamer.js` | — | Three.js, seeded RNG |
| `mission-manager.js` | — | `game` |
| `rule-breaker-profiles.js` | `RULE_BREAKER_TYPES` | None (data only) |
| `gameplay-recorder.js` | `GameplayRecorder` | `game` |

### Level Config Format

```javascript
// In level N.js — pushes to window.LVS
{
  id: 1,
  name: 'Signal Basics',
  modes: ['LEARN', 'PRACTICE', 'EXAM', 'CHAOS'],
  themeType: 'intersection_mastery',
  route: 'simple_cross',
  timeLimit: 90,
  npcTypes: ['car', 'bike', 'bus', 'truck', 'auto'],
  tasks: [...],
  law: { section: '...', fine: '...', offense: '...' },
  theory: { en: '...', hi: '...' },
  assets: ['suburban', 'cars']  // resolved by window._expandAssets
}
```

### Mode Config

```javascript
MODE_CONFIG = {
  LEARN:    { timeLimitMult: 1.5, npcDensityMult: 0.3, passThreshold: 0.6, xpBase: 50 },
  PRACTICE: { timeLimitMult: 1.0, npcDensityMult: 0.7, passThreshold: 0.75, xpBase: 100 },
  EXAM:     { timeLimitMult: 0.8, npcDensityMult: 1.0, passThreshold: 0.85, xpBase: 200, mcqCount: 5 },
  CHAOS:    { timeLimitMult: 0.7, npcDensityMult: 1.5, passThreshold: 0.7, xpBase: 300, adaptive: true }
}
```

### Physics: Pacejka MF 5.2 Tire Model

Full implementation in `game_core.js` (~top 500 lines). Surface types: `dry_asphalt`, `wet_asphalt`, `gravel`. Vehicle stats in `VEHICLE_STATS` (bike, car, bus, truck, auto, lambo). **Do not tune without test data.**

### NPC AI State Machine

```
IDLE → FOLLOW_LANE → OVERTAKE/WAIT_SIGNAL → COMPLETE
              ↓
        EMERGENCY_BRAKE / CRASH / PULL_OVER
              ↓
        DISTRACTED / ROAD_RAGE (Chaos mode)
```

12 total states. Driver personalities: `normal`, `aggressive`, `reckless_bike`, `slow_trucker`, etc.

### Object Pooling Pattern

```javascript
const mesh = ThreePools.getMesh(geometry, material);
// ... use ...
ThreePools.releaseMesh(mesh);
// On level exit: ThreePools.releaseAll();
```

### Quality Presets & DRS

| Preset | resScale | Shadows | Bloom | Target FPS |
|--------|----------|---------|-------|------------|
| LOW | 0.5 | 512, 1 cascade | off | 30 |
| MED | 0.75 | 1024, 1 cascade | off | 60 |
| HIGH | 1.0 | 2048, 2 cascades | on | 60 |
| ULTRA | 1.5 | 4096, 4 cascades | on | 144 |

DRS: `renderCore._autoQualityEnabled = true` → checks every 60 frames, adjusts preset.

### Auth & State

- **Local:** `S` global + `localStorage.mth4` (declared inline in each HTML)
- **Other localStorage keys:** `traffic_lv`, `traffic_mode`, `traffic_profile`, `traffic_appearance`, `trafficSetupComplete`, `traffic_quality`
- **Cloud:** `window.supabaseClient` + `window.colUser` from `../col-auth.js`
- **State shape:**
  ```javascript
  S = {
    comp: { [levelId]: { score, time, modes } },
    badges: [],
    total: number,
    name: 'Traffic Hero',
    wallet: 50000
  }
  ```

### Gotchas & Constraints

1. **Three.js r128 was pinned** — upgrading breaks `BufferGeometryUtils`, post-processing, GLTFLoader (all use `examples/js` global-script builds). With Vite, we can now upgrade to r170+ using `three/examples/jsm/` ES modules.
2. `Driving.html` patches `window.fetch` to redirect `config.json` → `../config.json`
3. `Driving.html` wraps `atob` and filters GLTFLoader `KHR_texture_transform` warnings
4. Optional subsystems are null-guarded — missing script degrades silently, doesn't throw
5. Mobile paths branched throughout (`isMobile()`, DPR clamps, portrait overlay, virtual joystick)
6. NPCs stuck at intersections = check RoadGraph edge connectivity
7. `cert_assets.js` is 18MB — loads async with progress bar, do NOT inline or edit
8. Each new level = new file + `<script>` tag in BOTH `Driving.html` AND `Academy.html`

---

## 2. Migration Strategy

### Target Architecture

```
Traffic/
├── src/
│   ├── engine/
│   │   ├── Game.ts              # orchestrator, level management, game loop
│   │   ├── Physics.ts           # Pacejka tire model, vehicle dynamics
│   │   ├── Input.ts             # keyboard, gamepad, touch
│   │   ├── Renderer.ts          # Three.js r170+ WebGL2 setup + post FX
│   │   ├── SceneBuilder.ts      # _buildScene, roads, buildings, NPCs
│   │   └── workers/
│   │       └── pathfinding.worker.ts  # A* off main thread
│   ├── shaders/
│   │   ├── sky.vert.glsl        # atmospheric scattering sky
│   │   ├── sky.frag.glsl
│   │   ├── road.vert.glsl       # wet road reflections
│   │   ├── road.frag.glsl
│   │   ├── building.vert.glsl   # animated windows
│   │   ├── building.frag.glsl
│   │   ├── vehicle.vert.glsl    # car paint, glass, chrome
│   │   ├── vehicle.frag.glsl
│   │   └── post/
│   │       ├── fullscreen.vert.glsl
│   │       ├── bloom_extract.frag.glsl
│   │       ├── ssao.frag.glsl
│   │       └── composite.frag.glsl
│   ├── materials/
│   │   ├── SkyDome.ts           # atmospheric sky dome
│   │   ├── RoadMaterial.ts      # wet/dry road shader
│   │   ├── BuildingMaterial.ts  # animated window shader
│   │   └── VehicleMaterial.ts   # car paint shader
│   ├── systems/
│   │   ├── Pools.ts             # ThreePools (migrated)
│   │   ├── RoadGraph.ts         # A* pathfinding (migrated)
│   │   ├── RenderCore.ts        # quality presets (migrated)
│   │   ├── SafeZoneUI.ts        # HUD layout (migrated)
│   │   ├── TrafficManager.ts    # NPC spawning (stub)
│   │   ├── NPCAI.ts             # state machine (stub)
│   │   ├── MissionManager.ts    # mission types (stub)
│   │   ├── WorldStreamer.ts     # procedural streaming (stub)
│   │   └── GameplayRecorder.ts  # violation recording (stub)
│   ├── entities/
│   │   ├── Vehicle.ts           # vehicle types, stats, procedural meshes
│   │   ├── NPC.ts               # NPC agent
│   │   └── Pedestrian.ts        # pedestrian agent
│   ├── game/
│   │   ├── Course.ts            # levels, modules, modes config
│   │   ├── Modes.ts             # LEARN/PRACTICE/EXAM/CHAOS
│   │   ├── Violations.ts        # violation types + detection
│   │   ├── Scoring.ts           # XP, badges, thresholds
│   │   └── RuleBreakerProfiles.ts
│   ├── ui/
│   │   ├── Menus.ts             # level select, main menu
│   │   ├── Briefing.ts          # level briefing screen
│   │   ├── Quiz.ts              # MCQ assessment
│   │   ├── Results.ts           # score, badges, certificate
│   │   ├── HUD.ts               # in-game overlay
│   │   ├── Charts.ts            # dashboard charts
│   │   └── Settings.ts          # quality, vehicle, profile
│   ├── state/
│   │   ├── store.ts             # Zustand store (migrated)
│   │   ├── persistence.ts       # localStorage + file (Electron)
│   │   └── sync.ts              # Supabase cloud sync
│   ├── assets/
│   │   ├── loader.ts            # GLTF + Draco + KTX2 (migrated)
│   │   └── manifest.ts          # ASSET_MANIFEST
│   ├── platform/
│   │   ├── electron.ts          # Electron-specific APIs
│   │   └── web.ts               # Web-specific APIs
│   ├── main.ts                  # entry point (detects platform)
│   └── vite-env.d.ts
├── electron/
│   ├── main.ts                  # BrowserWindow, IPC, auto-updater
│   ├── preload.ts               # contextBridge (expose electronAPI)
│   └── icons/                   # app icons (.ico, .icns, .png)
├── levels/                      # migrated level configs (JSON or TS)
├── Models/                      # 3D asset files (keep as-is)
├── textures/                    # textures (keep as-is)
├── public/
│   ├── manifest.webmanifest     # PWA manifest
│   └── sw.js                    # service worker (offline)
├── index.html                   # new Vite entry point
├── vite.config.ts               # Vite config (dual output)
├── tsconfig.json
└── package.json
```

### Build Outputs

| Output | Command | Destination | Tech |
|--------|---------|-------------|------|
| **Web (static)** | `npm run build:web` | Vercel | Vite → `dist-web/` |
| **Desktop (dev)** | `npm run electron:dev` | Local | Electron + Vite dev server |
| **Desktop (installer)** | `npm run electron:build` | GitHub Releases | electron-builder → .exe/.dmg/.AppImage |
| **Desktop (portable)** | `npm run electron:portable` | Direct download | electron-builder → portable .exe |

Both outputs share 100% of game code. Platform detection at runtime:
```ts
if (window.electron) {
  // Native menus, auto-updater, file system
} else {
  // PWA install prompt, online sync
}
```

---

## 3. Phased Execution Plan

### Phase 1: Foundation (CURRENT — DONE)
**Goal:** Set up Vite + TypeScript + Three.js r170 + Electron with working builds.

**Completed:**
- [x] `package.json` with all deps (three, electron, vite, typescript, zustand, rapier, howler)
- [x] `tsconfig.json` with path aliases
- [x] `vite.config.ts` with dual output (web + electron)
- [x] `src/vite-env.d.ts` with type declarations
- [x] `src/shaders/` — sky, road, building, vehicle, post-processing GLSL shaders
- [x] `src/materials/` — SkyDome, RoadMaterial, BuildingMaterial, VehicleMaterial
- [x] `src/systems/Pools.ts` — migrated ThreePools with TypeScript generics
- [x] `src/systems/RoadGraph.ts` — migrated RoadGraph with A* pathfinding
- [x] `src/engine/Renderer.ts` — Three.js r170 WebGL2 renderer with quality presets
- [x] `src/engine/Input.ts` — keyboard, gamepad, touch input
- [x] `src/engine/Physics.ts` — Pacejka MF 5.2 tire model (migrated)
- [x] `src/engine/Game.ts` — game loop and orchestrator
- [x] `src/state/store.ts` — Zustand store with persistence
- [x] `src/platform/index.ts` — platform abstraction (electron vs web)
- [x] `src/assets/loader.ts` — GLTF + Draco + KTX2 asset loading
- [x] `electron/main.ts` — BrowserWindow, native menus, IPC
- [x] `electron/preload.ts` — contextBridge
- [x] `src/main.ts` — entry point
- [x] `index.html` — new Vite entry
- [x] Both `vite build --mode web` and `vite build --mode electron` succeed

### Phase 2 Complete (System Migrations)
- [x] `src/systems/RenderCore.ts` — quality presets, DRS, bloom, auto-detect
- [x] `src/systems/SafeZoneUI.ts` — HUD zones, breakpoints, safe-area insets
- [x] `src/game/Course.ts` — 13 modules, 53 levels, 4 modes, badges, Mumbai stats
- [x] `src/game/RuleBreakerProfiles.ts` — 8 violator types with weighted spawning

### Phase 3 Complete (Core Engine Systems)
- [x] `src/systems/TrafficManager.ts` — NPC spawning, density, platoons, signal pressure
- [x] `src/systems/NPCAI.ts` — 12-state FSM, 9 driver profiles + PedestrianAI (6 profiles)
- [x] `src/systems/MissionManager.ts` — 14 mission types, collectibles, CampaignManager
- [x] `src/systems/GameplayRecorder.ts` — event recording, grading, review modal
- [x] `src/systems/WorldStreamer.ts` — chunk-based procedural city streaming

### Phase 4 Complete (Bootstrap + UI/Scenario Bridge)
- [x] `src/bootstrap.ts` — full ASSET_MANIFEST (~150 assets), ASSET_GROUPS, CORE_ASSETS,
      expandAssets, loadLevelAssets (GLB/GLTF/FBX/OBJ+MTL), preloadModels, confetti
- [x] `src/game/Scenario2D.ts` — typed bridge over legacy canvas scenario engine
- [x] `src/ui/index.ts` — typed facade over ui.js (all screens: levels, briefing,
      quiz, results, certificates, profile, badges) with UIAPI interface

**Bridge pattern note:** scenario2d.js (867 lines of stable canvas drawing) and
ui.js (4,460 lines of screen code) are imported as side-effect modules and exposed
through typed APIs. Full line-by-line conversion is deferred to Phase 4b — the
typed facades give new code a clean import surface today while the proven legacy
implementations keep working unchanged.

### Phase 5 Complete (Desktop Features)
- [x] `electron/icons/icon.ico` + `icon.png` — generated from root Icon.png
- [x] `electron/main.ts` — window state persistence (position/size/maximized, off-screen guard)
- [x] Auto-updater (electron-updater 6.x → GitHub Releases, hourly checks, auto-install on quit)
- [x] Save export/import — File menu dialogs, collects `mth4`/`traffic_*`/`col_*` localStorage keys
- [x] Native menus — File (New Game/Restart/Export/Import), View (Fullscreen/DevTools/Zoom), Help (About/Updates/Bug)
- [x] Crash log — uncaught exceptions append to userData/crash.log
- [x] Navigation guard — external links open in system browser
- [x] `build-electron.js` — esbuild compiles main.ts/preload.ts → CJS for Electron runtime
- [x] **Packaging verified:** `electron-builder --dir` produces `dist-electron/win-unpacked/Mumbai Traffic Hero.exe`

### Phase 6 Complete (Web Output + PWA)
- [x] `public/manifest.webmanifest` — fullscreen landscape, theme color, maskable icons
- [x] `public/sw.js` — cache-first assets, network-first navigation with offline fallback
- [x] `public/icon-192.png` + `icon-512.png` — generated from root Icon.png
- [x] SW registration in index.html (skipped in Electron automatically)
- [x] `npm run build:web` → `dist-web/` ready for Vercel deploy

**Next:** Deploy `dist-web/` to Vercel; create GitHub Releases feed for the desktop auto-updater;
optional Phase 4b (line-by-line ui.js/scenario2d.js conversion).

---

### Phase 2: System Migration (TODO)
**Goal:** Migrate remaining systems from old JS to new TypeScript.

**Order:**
1. `render_core.js` → `systems/RenderCore.ts`
2. `safezone-ui.js` → `systems/SafeZoneUI.ts`
3. `course.js` → `game/Course.ts`
4. `rule-breaker-profiles.js` → `game/RuleBreakerProfiles.ts`
5. `traffic-manager.js` → `systems/TrafficManager.ts`
6. `npc-ai.js` → `systems/NPCAI.ts`
7. `mission-manager.js` → `systems/MissionManager.ts`
8. `world-streamer.js` → `systems/WorldStreamer.ts`
9. `gameplay-recorder.js` → `systems/GameplayRecorder.ts`

---

### Phase 3: Core Engine Split (TODO)
**Goal:** Break `game_core.js` (548KB) into modules.

**Split into:**
- `engine/SceneBuilder.ts` — _buildScene, _buildRoadsFromGraph, _buildBuildingsFromGraph
- `engine/HUD.ts` — _initG, _initHUD, speedometer, minimap, notifications
- Expand `engine/Game.ts` — integrate all pieces

---

### Phase 4: State + UI Migration (TODO)
**Goal:** Migrate `ui.js` (4,460 lines) into modular UI code.

**Modules:**
- `ui/Menus.ts` — level select, main menu, pause
- `ui/Briefing.ts` — level briefing with syllabus
- `ui/Quiz.ts` — MCQ assessment
- `ui/Results.ts` — score, badges, certificate
- `ui/HUD.ts` — in-game overlay
- `ui/Settings.ts` — quality, vehicle, profile

---

### Phase 5: Desktop Features (TODO)
**Goal:** Native desktop experience.

- Window management (remember size/position, fullscreen)
- Native menus (File, View, Help)
- Keyboard shortcuts (ESC, F11, Ctrl+R, Ctrl+Shift+I)
- Auto-updater (electron-updater → GitHub Releases)
- Crash handler + Sentry
- Save export/import
- Installer packaging (NSIS, DMG, AppImage)

---

### Phase 6: Web Output + PWA (TODO)
**Goal:** Deploy web version from same source.

- `dist-web/` → Vercel
- PWA manifest + service worker
- Offline mode
- Both web and desktop from one codebase

---

## 4. Technology Stack

| Concern | Choice | Version | Why |
|---------|--------|---------|-----|
| Build tool | Vite | 5.x | Fast HMR, dual output, Electron plugin |
| Language | TypeScript | 5.x | Type safety, IDE support |
| 3D Engine | Three.js | r170+ | WebGL2, tree-shakeable, modern post-processing |
| Desktop shell | Electron | 31+ | Perfect WebGL, auto-updater, game distribution |
| State | Zustand | 4.x | Minimal, no boilerplate, vanilla-friendly |
| Physics (collisions) | Rapier | 0.14 (WASM) | Rust-based, 60fps with hundreds of bodies |
| Audio | Howler.js | 2.x | Spatial sound, low latency |
| Compression | Draco + KTX2 | — | Tiny asset sizes |
| Shaders | Raw GLSL | — | Full control, no abstraction tax |

---

## 5. Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build:web": "tsc --noEmit && vite build --mode web",
    "build:electron": "tsc --noEmit && vite build --mode electron && electron-builder",
    "electron:dev": "vite --mode electron && electron .",
    "electron:build": "vite build --mode electron && electron-builder",
    "electron:portable": "vite build --mode electron && electron-builder --portable",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test:smoke": "node pw_test.js"
  }
}
```

---

## 6. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Three.js r128 breaks | Game doesn't render | Keep r128 in old files until migration complete. New code uses r170. |
| Migration breaks live game | Users can't play | Old HTML files stay untouched until Phase 6. Both versions coexist. |
| 548KB file too risky to split | Development stalls | Phase 3 is longest. Extract tiny pieces, test each. |
| Electron bundle size too large | Slow downloads | Expected ~150MB. Acceptable for a game. Could lazy-load assets. |
| Supabase auth breaks in Electron | Login fails | Test auth flow early. May need CORS adjustments. |
| Level loading fails in new system | Content missing | Keep level JSON format identical. Auto-discover from `levels/`. |

---

## 7. What You Get at the End

| | Web (Current) | Web (New) | Desktop |
|---|---|---|---|
| **Deploy** | Vercel | Vercel (same domain) | GitHub Releases |
| **Install** | Bookmark | "Add to Home Screen" | .exe / .dmg / .AppImage |
| **Works offline** | ❌ | ✅ (service worker) | ✅ (bundled) |
| **Auto-updates** | N/A | ✅ (SW) | ✅ (electron-updater) |
| **Performance** | Good | Better (code split) | Best (no network) |
| **Native features** | ❌ | ❌ | ✅ (menus, shortcuts, FS) |
| **Maintainability** | Hard | Easy | Easy |
| **Codebase** | Static HTML | ←── shared TypeScript ──→ | |

---

## 8. Notes for Future AI Sessions

- The **source of truth** is `src/` — all new code goes here
- The **old code** in root-level `.js` files is still used during migration — don't delete until fully replaced
- **Always run `pw_test.js`** after any change to verify boot
- **Never modify `cert_assets.js`** — it's generated from Blender, 18MB
- **Never modify `config.json`** — contains live Supabase credentials
- **Three.js r170** is used in new code; old code still uses r128 until migration
- The **web version on Vercel** (`Traffic/`) stays live until Phase 6 deploys the replacement
- `levels/` can be migrated from `.js` (pushing to `window.LVS`) to `.json` (imported directly) during Phase 2
- **Supabase sync** is handled in `state/sync.ts` — keep the existing API surface
- For any question about existing behavior, check `CODEBASE.md` and `CLAUDE.md` in this directory
- Shaders use `?raw` imports (Vite native) — no GLSL plugin needed
- `@ts-nocheck` is used on files with Three.js type mismatches — fix incrementally

---

*This plan is the contract. If scope changes, update this document before changing code.*
