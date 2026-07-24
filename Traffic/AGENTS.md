# Traffic Driving Simulator — Agent Rules

> 3D browser-based driving/pedestrian simulator built with Three.js r128. Static HTML deployed to Vercel (no build step). Read before editing.

---

## Project Overview

**Traffic Simulator** — A Mumbai-themed 3D driving and pedestrian safety game. Two modes:
- **Driving.html** — Vehicle simulation with traffic, NPCs, missions
- **Academy.html** — Pedestrian safety training with syllabus, certificates
- **TrafficDashboard.html** / **TrafficSetup.html** — Admin/analytics views

Architecture: Modular engine in `game_core.js` (~7k lines) with four optional subsystems loaded via script tags:
| Module | File | Purpose |
|--------|------|---------|
| **ThreePools** | `pools.js` | Object pooling (meshes, vectors, groups) for zero-GC gameplay |
| **RoadGraph** | `road-graph.js` | Spatial road network: nodes/edges, A* pathfinding, building slots |
| **RenderCore** | `render_core.js` | WebGL2 renderer, quality presets (Low/Med/High/Ultra), DRS, LOD, bloom |
| **SafeZoneUI** | `safezone-ui.js` | Responsive HUD layout with safe-area insets, mobile detection |

---

## Critical Files (DO NOT TOUCH Without Approval)

| File | Why |
|------|-----|
| `config.json` | Supabase auth credentials + page status routing. Shared with parent CoL site. |
| `game_core.js` | Main engine (7000+ lines). Changes cascade to all modes. |
| `cert_assets.js` (18MB) | Preloaded GLB models. Do not edit — regenerated from Blender exports. |
| `env.js` / `auto.js` / `bus.js` / `lambo.js` | Asset bundles. Same rule as above. |
| `course.js` | Level definitions (roads, anchors, missions). Edit carefully. |

---

## Script Load Order (MANDATORY)

Both `Driving.html` and `Academy.html` load modules in this exact order:

```html
<script defer src="pools.js"></script>
<script defer src="road-graph.js"></script>
<script defer src="render_core.js"></script>
<script defer src="safezone-ui.js"></script>
<script defer src="game_core.js"></script>
```

**Never reorder.** `ThreePools` must initialize first (constructor calls `ThreePools.init(this)`). `RoadGraph` must be ready before `_buildScene()`. `RenderCore` must exist before render loop. `SafeZoneUI` registers HUD elements in `_initHUD()`.

---

## Entry Points & Flow

1. **HTML loads** → Three.js r128 from CDN + module scripts
2. **`game_core.js` constructor** runs:
   - `ThreePools.init(this)` — sets up global pools
   - `_initR()` — renderer, camera, scene, post-processing
   - `_initIn()` — input (keyboard, touch, virtual joystick)
   - `_initG()` — game state, vehicle, HUD
   - `_initVirtualJoystick()` — mobile controls
   - `_loop()` — main animation loop starts
3. **`_buildScene(mode)`** called on play:
   - Creates `RoadGraph.fromLevelConfig(cfg)` if available
   - `_buildRoadsFromGraph()` / `_buildBuildingsFromGraph()` (graph-based)
   - Falls back to legacy `_buildRoadZones()` if modules missing
   - Spawns NPCs with graph-based A* routing
4. **Render loop** (`_loop`):
   - Physics (Pacejka MF 5.2 tire model)
   - NPC update (graph path following)
   - `RenderCore.render(scene, camera)` with quality preset
   - Pool stats logging (dev)

---

## Level Configuration (`course.js`)

Levels define roads + anchor nodes for zoning:

```javascript
// In level config object:
roads: [
  { type:'v', x:0, z1:-480, z2:480, lanes:2, width:24, speedLimit:60, roadType:'arterial' },
  { type:'h', z:0, x1:-360, x2:360, lanes:1, width:12, speedLimit:40, roadType:'collector' }
],
anchorNodes: [
  { x:0, z:0, zone:'Commercial' },
  { x:-400, z:-400, zone:'Residential' },
  { x:400, z:400, zone:'Industrial' }
]
```

- `type: 'v'` = vertical road (constant x), `'h'` = horizontal (constant z)
- Zones drive building type selection in `_buildBuildingsFromGraph()`

---

## Physics: Pacejka MF 5.2 Tire Model

Full implementation in `game_core.js` (lines ~10-500). Surface types:
- `dry_asphalt` (default)
- `wet_asphalt`
- `gravel`

Vehicle stats in `VEHICLE_STATS` (bike, car, bus, truck, auto). **Do not tune coefficients without test data** — they're calibrated.

---

## Quality Presets & DRS

`RenderCore` manages four presets (`LOW`/`MED`/`HIGH`/`ULTRA`) with:
- Resolution scale (`resScale`: 0.5 → 1.5)
- Shadow maps (512 → 4096, cascades 1 → 4)
- Bloom, anisotropy, LOD multiplier, particle limits
- Target FPS (30 → 144)

**Dynamic Resolution Scaling (DRS):** Enable with `renderCore._autoQualityEnabled = true`. Checks frame budget every 60 frames, adjusts preset up/down.

User preference persisted in `localStorage('traffic_quality')`.

---

## Object Pooling (ThreePools)

Pools created in `ThreePools.init(game)`:
- `Mesh`, `Group`, `Vector3`, `Quaternion`, `Matrix4`, `Box3`, `Sphere`
- Custom: `InstancedMesh` batches for buildings/roads

**Usage pattern:**
```javascript
const mesh = ThreePools.getMesh(geometry, material);
// ... use ...
ThreePools.releaseMesh(mesh);
```

Release all on `stopPlay()`: `ThreePools.releaseAll()`.

---

## NPC Routing (A* on RoadGraph)

```javascript
// In _spawnNPC():
if (this.roadGraph && config.route?.length >= 2) {
  const start = this.roadGraph.getNearestNode(route[0].x, route[0].z);
  const end = this.roadGraph.getNearestNode(route[route.length-1].x, route[route.length-1].z);
  const path = this.roadGraph.findPath(start, end);
  if (path) npc.path = path.map(n => ({x: n.position.x, z: n.position.z}));
}

// In _updateNPC(): follow waypoints, lerp rotation
```

Graph built from `roads[]` + `anchorNodes[]` in level config.

---

## Asset Pipeline

**GLB models** loaded via `GLTFLoader` in `game_core.js` `_initR()` → `PRELOADED_MODELS` global.

Key model keys (from `cert_assets.js`):
- Roads: `road_straight`, `road_avenue`
- Buildings: `suburban_*`, `industrial_*`, `mbuilding_*`, `chawl_*`
- Vehicles: `bike`, `car`, `bus`, `truck`, `auto`, `lambo`

**To add models:** Drop `.glb` in repo, add to `cert_assets.js` array, rebuild asset bundle (manual process — no script).

---

## Debug Commands (Browser Console)

```javascript
// Pool stats
console.table(ThreePools.getStats());

// Road graph
game.roadGraph.edges.forEach(e => console.log(e.id, e.length, e.lanes));
game.roadGraph.nodes.forEach(n => console.log(n.id, n.type, n.edges.length));

// RenderCore quality
game.renderCore.setQuality('Ultra'); // 'Low' | 'Medium' | 'High' | 'Ultra'
game.renderCore.getPreset();

// SafeZone layout
SafeZoneGrid.debug();
```

---

## Common Tasks

### Add a New Level
1. Add config to `course.js` (roads, anchorNodes, missions)
2. Add entry to level select UI in `Driving.html` / `Academy.html`
3. Test with `game._buildScene({...levelConfig})` in console

### Tune Vehicle Handling
Edit `VEHICLE_STATS` in `game_core.js` (top of file). Test in Driving mode.

### Adjust Quality Presets
Modify `QUALITY_PRESETS` in `render_core.js`. Preserve keys — UI expects them.

### Add HUD Element
1. Create DOM element in `_initHUD()` or HTML
2. Register in SafeZoneGrid: `SZ.register('key', element, 'TL'|'TR'|'BL'|'BR'|'TC', {order, priority})`
3. Position handled automatically with safe-area insets.

---

## Deployment

- **Vercel:** Push to `main` → auto-deploys (static HTML)
- **No build step** — all scripts loaded from CDN or local files
- **`vercel.json`** only sets security headers (no rewrites for this sub-app)
- **Cache:** Service worker not used here (parent CoL site has one)

---

## Known Gotchas

| Issue | Workaround |
|-------|------------|
| `config.json` fetch from Traffic pages | `Driving.html`/`Academy.html` patch `fetch()` to redirect to `../config.json` |
| Three.js r128 pinned | Upgrading breaks `BufferGeometryUtils`, post-processing, GLTFLoader |
| Mobile Safari WebGL memory | Use `LOW` preset; `ThreePools` critical for 60fps |
| Asset bundle size (cert_assets.js 18MB) | Loads async; shows progress bar. Do not inline. |
| NPCs stuck at intersections | Check `RoadGraph` edge connectivity; A* needs valid path |

---

## File Cleanup Rules

Before deleting any file:
1. `grep -r "filename" *.html` — check all HTML references
2. Check `course.js` for level config references
3. Check `game_core.js` for dynamic imports (`PRELOADED_MODELS[key]`)

Historical archives: `Traffic - Major UI Change/`, `Traffic - Major Updates/` (not in git).

---

_Last updated: July 24, 2026_