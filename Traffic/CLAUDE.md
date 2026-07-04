# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`Traffic/` is a self-contained subdirectory of the Vercel-hosted site. It contains a 3D browser-based driving/pedestrian simulator (Mumbai-themed traffic school) built on Three.js r128. It runs as static files served by Vercel from this subpath. The site root (`../`) is a different product (the COL pages) and shares nothing at runtime — see "Isolation" below.

For the project's hard rules (do-not-touch files, design tokens, level schema, script load order, scale chain, model gotchas) read `AGENTS.md` in this directory first. This file is the workflow + architecture companion to that one.

## Running / developing

There is no build step. The project is plain HTML + ES5-style JS loaded via `<script>` tags. To develop:

- **Local server (required for fetch + GLB loading):**
  - `python -m http.server 8080` from `C:\Users\neelg\OneDrive\Desktop\Vercel` (the parent), then open `http://127.0.0.1:8080/Traffic/Academy.html`
  - `npx serve` works too. Do **not** open HTML via `file://` — GLB models and `config.json` won't load.
- **Entry points:** `Academy.html` (lesson picker) → `TrafficSetup.html` (vehicle select) → `Driving.html` (the game) → `TrafficDashboard.html` (stats).
- **Browser test harness:** `tests/main.go` (Playwright + Go). It opens `http://127.0.0.1:8080/Traffic/Academy.html` and verifies the HUD. Run with `go run tests/main.go` from the parent. Requires Playwright browsers (`playwright.Install()` runs on first invocation).
- **No package.json here.** The parent's `package.json` / `node_modules` / `vercel.json` are for the COL site, not for this game.
- **No tests, no linter, no type checker.** Verification is the browser. After changes, load `Driving.html`, walk through a level, and check the console.

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

`Academy.html` patches `window.fetch` to redirect `config.json` → `../config.json` because it sits one directory deeper relative to the Vercel root.

## Architecture (the 30-second version)

Two large classes do almost all the work:

- **`Game` in `game_core.js`** — the engine. Owns the renderer, scene, camera, physics (simple AABB against `this.world[]` and `this.obstacles[]`), NPC AI (waypoint following + lane clamp [-6,6] + stuck-detection timer), pedestrian logic, traffic lights, input, and the main loop. Per-vehicle handling lives in the `VEHICLE_STATS` table at the top of the file (bike/car/bus/truck/auto). Renderer: WebGL, ACES filmic tone mapping, `UnrealBloomPass`, DPR clamped to 1920×1080.
- **`TrafficUI` in `ui.js`** — the overlay. HUD, speedometer, gear indicator, GPS arrow, minimap, traffic-light panel, auth modal, admin unlock (Ctrl+Shift+D), toasts. Touches the DOM, never the scene.

Supporting modules:

- `start.js` — GLB preloader. After all models are loaded, it instantiates `Game` and `TrafficUI`.
- `env.js` — skybox / ground / ambient textures.
- `vehicles.js` + `auto.js` / `bus.js` / `lambo.js` — vehicle factories. They either return a cloned preloaded GLB or fall back to procedural geometry.
- `course.js` + `cert_assets.js` — course/lesson metadata and certificate rendering.
- `levels/levelN.js` — data only. Each pushes a `LEVEL_CONFIG` to `window.LVS`. Schema is in `AGENTS.md` ("Level Data Format").

### Model scale chain (memorize this)

GLB loaded → `start.js` stores it in `PRELOADED_MODELS` at **4.5×** → instanced buildings reset to 1× and apply their own `s` value → character models (`char_m_a`, `char_f_a`, etc.) replace scale directly. Road tiles (`road_straight`, etc.) sit at `y=0.08`. Building rotation is determined by road orientation: vertical road → `±PI/2`, horizontal → `0` or `PI`. **Do not add extra rotation offsets** — the existing math assumes these specific values.

### Coordinate system / units

Game-world units are not meters. The road tile width and the `[-6, 6]` lane clamp together define the playable corridor; treat these as the unit system. All level config is in these units.

## Isolation from the parent site

The Vercel root (`../`) has its own auth (`col-auth.js`), router (`col-router.js`), UI shell (`col-ui.js`, `col-ui.css`), and 3D helper (`col-3d.js`). **Traffic pages do not load any of these.** They bring their own Supabase client (configured via the local `config.json` — see `AGENTS.md` gotcha #1) and their own auth UI. Do not "share" code by importing from `../` — the two products are deliberately decoupled.

## Common change patterns

- **New vehicle type:** add an entry to `VEHICLE_STATS` in `game_core.js`, add a GLB preloader entry in `start.js` (`filesToLoad`), and a builder in `vehicles.js`. Mirror in `TrafficSetup.html` if user-selectable.
- **New level:** copy `levels/levelN.js` to `levels/levelN+1.js`, edit the data object, and add a `<script src="levels/levelN+1.js">` tag in `Driving.html` after the last level.
- **New HUD element:** add the DOM id to the `ids` array in `_initR()` of `game_core.js` (the `this.dom[id]` cache) so per-frame lookups stay O(1), and to the HTML in `Driving.html`. Then read/write through `this.dom[…]`.
- **Touch / mobile:** `Driving.html` has `touch-action:none` on the canvas. Mobile camera look uses `camYaw` / `camPitch` with decay — see `_initIn()` in `game_core.js`.

## When stuck

- Loading hangs on a white screen → `start.js` did not finish. Check the console; a failed GLB fetch (path typo, missing file) will block `preloadModels`'s callback.
- "Custom UV sets in KHR_texture_transform" warnings → suppressed in `Driving.html`. If you see them, you're in a page that doesn't suppress them.
- A vehicle falls through the floor or clips buildings → AABB `halfW` / `halfD` is missing on a new obstacle type. Phase 1 of the overhaul plan added these universally; new obstacle types must follow.
- NPC vehicles stop permanently at one spot → stuck detection (3s timer + teleport) should kick in. If it doesn't, the route waypoints are unreachable — check `route: [[x,z], …]`.
