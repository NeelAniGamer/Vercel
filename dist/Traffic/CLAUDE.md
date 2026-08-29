# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: the `Traffic/` sub-app (3D Mumbai driving/pedestrian simulator). The parent site's rules live in `../CLAUDE.md` and `../AGENTS.md`; `AGENTS.md` in this folder is an older, partly stale copy of the notes below.

## Commands

Run from the repo root (`..`) — there is no `package.json` inside `Traffic/`:

- `npm run build` — wipes `dist/`, copies the whole site (including `Traffic/`) into it, then esbuild-bundles `react-src/GamePage.tsx` → `dist/Traffic/simulator-bundle.js`. `dist/` is committed. The simulator itself needs **no build**: the `.html`/`.js` files here are served as-is.
- `node -c Traffic/game_core.js` — syntax-check before a browser run; `game_core.js` is one 8.6k-line file and a broken brace is the most common breakage. `Traffic/brace_tracker.js` locates the unbalanced brace when `node -c` isn't specific enough (edit the line range at the top).
- `node pw_test.js` (from `Traffic/`) — headless Chromium smoke test: loads `Driving.html` over `file://`, echoes every console message and page error. This is the fastest "did I break boot" check.
- `npx prettier --write <file>` — config at `../.prettierrc` (no semicolons, single quotes, printWidth 200). `game_core.js` predates it and uses semicolons + 6-space class-body indentation; match the file you're in, don't reformat wholesale.
- `test.spec.ts` requires `@playwright/test`, which is **not** installed (only `playwright` is). Use `pw_test.js` unless you install it.
- `check.js`, `test_*.js`, `temp_*.js` are one-off debugging scripts for the base64 GLB bundles, not part of the app.

Deploy = commit to `main` (Vercel static). `Traffic/vercel.json` only sets security headers.

## Architecture

No modules, no bundler, no imports. Every file is a classic `<script>` that hangs its exports on `window`, and cross-module access is feature-detected (`if (window.TrafficManager)`). Keep those guards when adding code.

### Load order (`Driving.html`, ~line 6176 — never reorder)

CDN Three.js **r128** + `examples/js` loaders/postprocessing → base64 asset bundles (`cert_assets.js`, `env.js`, `auto.js`, `bus.js`, `lambo.js`) → `levels/level1..52.js` + `level_custom.js` → then:

```
start.js → pools.js → road-graph.js → render_core.js → safezone-ui.js
→ gameplay-recorder.js → scenario2d.js → game_core.js
→ npc-ai.js → traffic-manager.js → rule-breaker-profiles.js → course.js → ui.js
```

`Academy.html` loads a similar set plus `../col-router.js`, `../col-ui.js`, `../col-auth.js`. Script `src`s carry manual cache-busters (`game_core.js?v=13`) — bump them when shipping a change that must not be served stale.

### Boot flow

`start.js` declares the `game` global and the asset tables, then `preloadModels()` → `ui.init()` → `game = new Game()` → reads `?lv=` / `?mode=` (falling back to `localStorage.traffic_lv` / `traffic_mode`) → `game.startLevel()`. A watchdog redirects to `Academy.html?screen=levels` if canvas `#gc` hasn't gone active within 30s — a silent boot failure shows up as that redirect, not as an error.

### Module map

| File | Global | Role |
|------|--------|------|
| `game_core.js` | `Game` (`window.game`), `VEHICLE_STATS`, `PACEJKA` | Renderer/camera/input init (`_initR`/`_initIn`/`_initG`), `startLevel` → `_actualStart` → `_buildScene`, main `_loop` (~line 5072), Pacejka MF 5.2 tire physics (top of file), day/night, HUD updates |
| `start.js` | `ASSET_MANIFEST`, `ASSET_GROUPS`, `CORE_ASSETS`, `PRELOADED_MODELS`, `loadLevelAssets` | Boot + per-level lazy model loading |
| `ui.js` | `window.ui` (merged via `Object.assign` onto the stub in `start.js`), `toast`, `sfx` | Every screen/menu/modal, procedural vehicle & character meshes (`_buildVehicle`, `_buildHuman`), Supabase progress sync |
| `traffic-manager.js` | `TrafficManager` | NPC spawning, density curves, platoons, lane-class access; attaches `vehicle.npcAI = new NPCAI(vehicle, roadGraph, this)` |
| `npc-ai.js` | `NPCAI`, `PedestrianAI`, `NPC_PROFILES`, `PED_PROFILES` | Per-agent state machines and driver personalities |
| `rule-breaker-profiles.js` | `RULE_BREAKER_TYPES`, `RuleBreakerProfile` | Deliberate-violator NPCs + Mumbai 2024–26 stats used in consequence modals |
| `road-graph.js` | `RoadGraph`, `RoadNode`, `RoadEdge`, `BuildingSlot` | Node/edge network, A* pathing, building slots; drives `_buildRoadsFromGraph` / `_buildBuildingsFromGraph` |
| `render_core.js` | `RenderCore`, `QUALITY_PRESETS` | WebGL renderer, LOW/MED/HIGH/ULTRA presets, dynamic resolution, bloom |
| `pools.js` | `ThreePools` | Object pools; `ThreePools.init(game)` must run before scene building |
| `safezone-ui.js` | `SafeZoneGrid` | HUD placement with safe-area insets |
| `scenario2d.js` | `Scenario2D`, `Scenario2DData` | 2D scenario played before the 3D level (`game_core.js:2273`) |
| `course.js` | `MODES`, `MODULES`, `BADGES`, `MODE_CONFIG` | Academy syllabus, badges, certificate eligibility |
| `gameplay-recorder.js` | `GameplayRecorder` | Records violations for the post-level review |

### Levels

Each `levels/levelN.js` pushes one object onto `window.LVS`: `id`, `modes`, `themeType`, `tasks[]`, bilingual `law`/`theory` copy, and `assets[]` (group names like `suburban`, `cars` resolved by `window._expandAssets`). Adding a level means a new file **plus** a `<script>` tag in both `Driving.html` and `Academy.html`.

### Assets — two separate systems

1. **Base64 GLB bundles** (`cert_assets.js` 18MB, `env.js`, `auto.js`, `bus.js`, `lambo.js`) assign data URLs to `window.MODELS`. Generated, multi-megabyte — never hand-edit.
2. **`ASSET_MANIFEST`** in `start.js` maps keys → paths under `Models/` (Kenney kits, GLB/FBX/OBJ). `CORE_ASSETS` (~25 keys) load at boot; everything else loads on demand via `loadLevelAssets(keys, cb)` into `PRELOADED_MODELS`. A new model = a manifest entry (+ an `ASSET_GROUPS` entry if levels should request it by group).

### State & auth

- Local: `S` global + `localStorage.mth4`, declared inline in each HTML with its own `save()`. Other keys: `traffic_lv`, `traffic_mode`, `traffic_profile`, `traffic_appearance`, `trafficSetupComplete`.
- Cloud: `window.supabaseClient` + `window.colUser` come from the parent site's `../col-auth.js`; `ui.js` upserts into `user_profiles`.
- `Traffic/config.json` holds Supabase credentials — do not edit (see `../CLAUDE.md` critical files).

## Gotchas

- **Three.js r128 is pinned.** The `examples/js` global-script builds (GLTFLoader, EffectComposer, UnrealBloomPass, SSAO) only exist at that version; upgrading breaks all of them at once.
- `Driving.html` patches `window.fetch` to rewrite `config.json` → `../config.json`. Under `file://` that fetch fails — expected noise in `pw_test.js` output.
- `Driving.html` also wraps `atob` and filters GLTFLoader `KHR_texture_transform` warnings; console output is intentionally pre-filtered.
- Optional subsystems are all null-guarded, so a missing/misordered script degrades silently instead of throwing — check the load order first when a feature "does nothing".
- Mobile paths are branched throughout (`isMobile()` NPC caps in `traffic-manager.js`, DPR clamps in `_rsz`, portrait overlay, virtual joystick). Test both.
