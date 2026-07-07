# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`Traffic/` is a self-contained subdirectory of the Vercel-hosted site. It contains a 3D browser-based driving/pedestrian simulator (Mumbai-themed traffic school) built on Three.js r128. It runs as static files served by Vercel from this subpath. The site root (`../`) is a different product (the COL pages) and shares nothing at runtime.

For the project's hard rules (do-not-touch files, design tokens, level schema, script load order, scale chain, model gotchas) read `AGENTS.md` in this directory first.

## Running / developing

There is no build step. The project is plain HTML + ES5-style JS loaded via `<script>` tags.

- **Local server (required for fetch + GLB loading):**
  - `python -m http.server 8080` from `C:\Users\neelg\OneDrive\Desktop\Vercel` (the parent), then open `http://127.0.0.1:8080/Traffic/Academy.html`
  - `npx serve` works too. Do **not** open HTML via `file://` — GLB models and `config.json` won't load.
- **Entry points:** `Academy.html` (lesson picker) → `TrafficSetup.html` (vehicle select) → `Driving.html` (the game) → `TrafficDashboard.html` (stats).
- **Browser test harness:** `tests/main.go` (Playwright + Go). It opens `http://127.0.0.1:8080/Traffic/Academy.html` and verifies the HUD renders. Run with `go run tests/main.go` from the parent.
- **No package.json here.** The parent's `package.json` / `node_modules` / `vercel.json` are for the COL site, not for this game.
- **Verification:** After changes, load `Driving.html`, walk through a level, and check the console.

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

## Architecture

Two large classes handle the core logic:

- **`Game` in `game_core.js`** — the engine. Owns the renderer, scene, camera, physics (simple AABB against `this.world[]` and `this.obstacles[]`), NPC AI (waypoint following + lane clamp [-6,6] + stuck-detection timer), pedestrian logic, traffic lights, input, and the main loop.
- **`TrafficUI` in `ui.js`** — the overlay. HUD, speedometer, gear indicator, GPS arrow, minimap, traffic-light panel, auth modal, admin unlock (Ctrl+Shift+D), toasts. Touches the DOM, never the scene.

### Level System & Map Data
- **Lesson Data:** `levels/levelN.js` files contain high-level course metadata (tasks, theory, icons) and push to `window.LVS[]`.
- **3D World Data:** The actual map geometry and NPC routes are hard-coded in the `M` table inside `_getMapConfig(lvId)` at `game_core.js`.
- **Special Levels:** L15 is a 50km open-world override. L16+ uses `_getThemeRoads(themeType)` templates.

### Model System
- `start.js` preloads ~100 GLBs into `window.PRELOADED_MODELS`.
- **Model scale chain:** GLB loaded → stored at **4.5×** → instanced buildings reset to 1× and apply their own `s` value → character models replace scale directly.
- Road tiles (`road_straight`, etc.) sit at `y=0.08`.

### Coordinate system / units
Game-world units are not meters. The road tile width and the `[-6, 6]` lane clamp together define the playable corridor.

## Isolation from the parent site

The Vercel root (`../`) has its own auth, router, and UI. **Traffic pages do not load any of these.** They bring their own Supabase client (configured via `Traffic/config.json`) and their own auth UI. Do not "share" code by importing from `../`.

## ⛔ Do Not Touch

- `Traffic/config.json`: Supabase auth credentials — changes break login.
- `Cyberpunk/*`: Historical archive — no modifications.
- `Models/*.glb`: Binary assets — only replace via proper workflow.

## Design Tokens

| Token         | Value      | Usage                          |
| ------------- | ---------- | ------------------------------ |
| Road color    | `0x3d3f45` | Asphalt road surface           |
| Sidewalk      | `0x8a8a8a` | Pavement/sidewalk              |
| Ground        | `0x4a4a4f` | Default urban ground           |
| Night fog     | `0x0a0a12` | Night mode background           |
| Player accent | `0x00ff00` | Player character emissive glow |
| NPC accent    | `0x0088ff` | NPC character emissive glow    |

## Common change patterns

- **New vehicle type:** add an entry to `VEHICLE_STATS` in `game_core.js`, add a GLB preloader entry in `start.js` (`filesToLoad`), and a builder in `vehicles.js`. Mirror in `TrafficSetup.html` if user-selectable.
- **New level:** copy `levels/levelN.js` to `levels/levelN+1.js`, edit the data object, and add a `<script src="levels/levelN+1.js">` tag in `Driving.html` after the last level.
- **New HUD element:** add the DOM id to the `ids` array in `_initR()` of `game_core.js` (the `this.dom[id]` cache) so per-frame lookups stay O(1), and to the HTML in `Driving.html`. Then read/write through `this.dom[…]`.
- **Touch / mobile:** `Driving.html` has `touch-action:none` on the canvas. Mobile camera look uses `camYaw` / `camPitch` with decay — see `_initIn()` in `game_core.js`.

## 🔴 Skill-First Rule (MANDATORY)

Before making ANY code change to this project, ALWAYS:
1. **Find a relevant skill** from the available skill library.
2. **If no skill exists** → search for best practices, then proceed.
3. **Apply the skill's guidance** when planning and implementing.
4. **Plan before coding** — never jump into edits without understanding the domain.

## When stuck

- Loading hangs on a white screen → `start.js` did not finish. Check the console for failed GLB fetches.
- "Custom UV sets in KHR_texture_transform" warnings → suppressed in `Driving.html`.
- A vehicle falls through the floor or clips buildings → AABB `halfW` / `halfD` is missing on a new obstacle type.
- NPC vehicles stop permanently at one spot → stuck detection (3s timer + teleport) should kick in. If it doesn't, check `route: [[x,z], …]`.
