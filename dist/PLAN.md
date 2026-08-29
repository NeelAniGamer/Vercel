# PLAN: Traffic Simulator — Research & Implementation Roadmap

> Research sources: slowroads.io (procedural driving), redcoats.io (character class system + multiplayer), PGDrive paper
> Target: Traffic Simulator (Three.js r128, Mumbai-themed driving game)

---

## 1. Executive Summary

### slowroads.io — Infinite Procedural Driving
- Procedurally generated terrain (Perlin noise heightmap)
- Self-avoiding road that winds through terrain forever
- 3-level LOD system (far grid, near grid, ultra-fine)
- Per-wheel vehicle physics
- Top-down lighting (no dynamic shadows)
- Object pooling for performance
- No fail states — pure "active meditation"

### redcoats.io — Character Class System + Massive Multiplayer
- **4 distinct character classes** with fundamentally different mechanics (not just skins)
- Mount/dismount system (F key) — cavalry mounts horses, sailors board ships
- Class-specific combat loops (aim→fire→reload→repeat)
- Team interdependence (combined arms > solo play)
- Up to 1,000 concurrent players (interest management, LOD on remote players)
- Objective-based gameplay (fort capture, territory control)
- Stiff/weighty movement (deliberate, not twitchy)
- Class switching on respawn for strategic adaptation

### Your Traffic Simulator Currently Has
- Fixed road network (grid-based) with A* pathfinding
- Pacejka MF 5.2 tire physics (more advanced than slowroads)
- Three.js r128, object pooling, quality presets, DRS
- Mumbai-themed assets and buildings
- Vehicle types: bike, car, bus, truck, auto, lambo
- Pedestrian mode (Academy.html)

### Goal
1. Add **infinite procedural mode** (slowroads.io style)
2. Add **character class system** with mount/dismount (redcoats.io style)
3. Add **multiplayer architecture** (redcoats.io scale)

---

## 2. Research Findings

### 2.1 slowroads.io Technical Architecture

| Component | Implementation |
|-----------|---------------|
| **Terrain Gen** | Modified Perlin noise, infinitely tiled, Alea PRNG |
| **Road Routing** | Gradient-following algorithm, 10m steps, self-avoiding, Bezier smoothing |
| **LOD System** | Far grid (5x5, 1km, 10m res) + Near grid (5x5, 10m tiles) + Ultra-fine (3x3, 10m) |
| **Road Mesh** | Rectangular strips, 3 high-detail + 9 low-detail chunks × 100m, cycled |
| **Lighting** | Top-down only, no shadow maps, baked tree shadows |
| **Foliage** | Sprites + instanced geometry, density map from noise |
| **Physics** | Per-wheel kinematic (gravity, friction, ground normal) |
| **Optimization** | Geometry merging, object pooling, pre-generation ahead of view |

### 2.2 redcoats.io Character Class System

**Core Pattern: Classes Are Not Skins — They're Completely Different Gameplay Loops**

| Class | Mount/Dismount | Primary Loop | Vulnerability | Team Role |
|-------|---------------|--------------|---------------|-----------|
| **Musketeer** | None (foot infantry) | AIM → FIRE → RELOAD (long) → repeat | Reload window = dead | Hold the line, group DPS |
| **Cavalryman** | Mount horse (F key) | GALLOP → SLASH → DISENGAGE → repeat | Horse HP, obstacles | Flanking, scouting, pursuit |
| **Cannoneer** | Operates cannon (fixed) | AIM → FIRE → RELOAD (very long) → if rushed → HAMMER | Melee, long reload | Structure damage, troop clearing |
| **Sailor** | Boards ship (F key) | SAIL → NAVAL GUN → RELOAD → BOARDING | Boarding action | Sea control, bombardment |

**Character State Machine (FSP):**
```
States: IDLE → WALKING → AIMING → FIRING → RELOADING → MELEE
Mount-specific: MOUNTING → MOUNTED → DISMOUNTING
Vehicle-specific: BOARDING → SAILING → FIRING_CANNON → DISEMBARKING
```

**Key Technical Insights:**
1. **Mount = separate entity** with own HP, hitbox, speed
2. **F key = universal interact** (context-sensitive: mount horse, board ship, enter vehicle)
3. **Stiff movement** — no bunny hopping, deliberate positioning over reflexes
4. **Long reload windows** — creates tension, requires cover/teamwork
5. **Class switch on respawn** — no commitment, try all roles

**How This Maps to Traffic Simulator Character System:**

| redcoats.io Class | Traffic Simulator Equivalent | Mount/Vehicle | Unique Ability |
|-------------------|-----------------------------|---------------|----------------|
| Musketeer | **Pedestrian / Traffic Cop** | None (on foot) | Direct traffic, issue fines, walk anywhere |
| Cavalryman | **Bike Rider** | Bike (fast, 2-wheel) | Lane splitting, quick escape, chase |
| Cavalryman (alt) | **Auto Driver** | Auto-rickshaw | Navigate tight streets, quick stops |
| Cannoneer | **Bus Driver** | Bus (large vehicle) | Carry passengers, route following, high capacity |
| Sailor | **Truck Driver** | Truck (heavy vehicle) | Cargo delivery, towing, slow but powerful |

**Character Functioning to Implement:**
1. **Character Class Selection Screen** — pick class before spawning/respawn
2. **Mount/Dismount (F key)** — get in/out of vehicles, enter/exit buildings
3. **Class-Specific Stats** — speed, HP, vehicle access, special abilities
4. **Character State Machine** — idle, walking, driving, working, fined, arrested
5. **Class Switching** — on respawn, change class based on team needs
6. **Team Interdependence** — cops need buses to catch, buses need cops to clear traffic

### 2.3 PGDrive Procedural Generation (Academic Reference)

- 7 road block types: Straight, Curve, Ramp, Intersection, Roundabout, Tollgate, Bottleneck
- Blocks assembled via procedural algorithm into infinite maps
- Traffic via IDM (Intelligent Driving Model)
- Showed training on more diverse procedurally-generated maps = better generalization
- **Relevance**: Could inspire block-based road assembly system

### 2.3 Key Algorithms to Implement

#### A. Terrain Heightmap (Perlin/Simplex Noise)
```
1. Use Alea or similar seeded PRNG
2. Layer multiple octaves of Perlin/Simplex noise
3. Modulate amplitude per octave (persistence)
4. Tile infinitely by using modulo on sample coordinates
5. Apply domain warping for more natural hills
```

#### B. Road Routing (Gradient Descent)
```
1. Start at a point where slope < threshold and height > water level
2. Each step: sample heightmap in 8+ directions
3. Choose direction that minimizes gradient (gentlest slope)
4. Move 10m in that direction
5. Add turnback logic when stuck (peninsula problem)
6. Store as doubly-linked list with metadata (width, curvature)
7. Smooth heights with 9-point moving average
8. Bezier interpolate from 10m → 1m resolution
9. MUST avoid self-intersection (spatial hash check)
```

#### C. LOD / Chunk Management
```
Far Grid:    5×5 chunks × 1km  × 10m resolution  (distant hills)
Near Grid:   5×5 chunks × 10m  × 1m resolution   (road corridor)
Ultra-fine:  3×3 chunks × 10m  × 0.5m resolution (immediate area)
Road:        12 chunks × 100m  (cycled/recycled)
```

---

## 4. Implementation Plan

### Phase 1: Procedural Terrain Generator ✅ COMPLETE

**File: `Traffic/proc_terrain.js`** — 15 unit tests pass

- [x] Mulberry32 seeded PRNG (deterministic from seed)
- [x] SeededPerlin — 2D Perlin noise with shuffled permutation table
- [x] ProcTerrain class: `getHeight()`, `getNormal()`, `getSlope()`, `getBiome()`, `getTreeDensity()`, `isRoadable()`
- [x] TerrainMeshGenerator — creates Three.js chunks with vertex-colored biomes
- [x] TerrainChunkManager — LOD streaming with quality-aware view distance
- [x] Test page: `terrain_test.html`

### Phase 2: Infinite Road Generator ✅ COMPLETE

**File: `Traffic/proc_road.js`** — 16 unit tests pass

- [x] SpatialHash for O(1) self-intersection checks
- [x] RoadGenerator — gradient-following with 16-direction sampling
- [x] Self-avoidance with spatial hash (no 180° turns, no nearby revisit)
- [x] Turnback mechanism when stuck (remove last N points, retry)
- [x] Height smoothing (9-point moving average)
- [x] Catmull-Rom spline interpolation (10m → 1m resolution)
- [x] RoadMeshGenerator — ribbon mesh from fine points
- [x] RoadManager — streaming + queries (`getPointAtDistance`, `getDirectionAt`)
- [x] Combined test page: `terrain_road_test.html`
- [x] Road generates 4000-5000m+ consistently across seeds

### Phase 3: Chunk Management & LOD ✅ COMPLETE

**File: `Traffic/proc_chunks.js`** — 22 unit tests pass

- [x] `GeometryPool` — reusable BufferGeometry pool to minimize GC
- [x] `ChunkTier` — single LOD tier with circular/square view distance
- [x] `ProcChunkManager` — orchestrates 3 tiers:
  - Far: 500m chunks, 4-12 res, 2-5 view distance
  - Med: 100m chunks, 6-24 res, 2-5 view distance
  - Near: 10m chunks, 8-32 res, 2-5 view distance (road corridor)
- [x] Frame-skip optimization: far updates every 3rd frame, med every 2nd
- [x] Road-following near tier (blends player + road position)
- [x] Vertex hiding regions (lower tiers sink vertices under higher tiers)
- [x] Quality presets (LOW/MED/HIGH/ULTRA) control all tier params
- [x] Test page: `lod_test.html` with per-tier stats
- [x] ~8.7ms/frame update time in mock (real GPU will be faster)

### Phase 4: Procedural Foliage & Scenery

**New file: `Traffic/proc_scenery.js`**

- [ ] Tree/vegetation placement:
  - Sample density map (derived from terrain heightmap with different seed)
  - Place trees where density > threshold AND slope < maxSlope
  - Use InstancedMesh for performance
  - Multiple tree variants in single texture atlas
- [ ] Building placement (optional, Mumbai-themed):
  - Place buildings near road (setback distance)
  - Use existing building assets from `cert_assets.js`
  - Zone-based selection (residential/commercial/industrial)
- [ ] Procedural elements:
  - Road signs (placed at intervals)
  - Lamp posts (along road edges)
  - Guard rails (on elevated sections)

### Phase 5: Physics Integration

**Extend `game_core.js` or new `Traffic/proc_physics.js`**

- [ ] Terrain following:
  - Sample terrain height at each wheel position
  - Compute ground normal for friction direction
  - Apply to existing Pacejka tire model
- [ ] Surface type detection:
  - Road surface (high friction)
  - Grass/dirt (lower friction, off-road penalty)
  - Steep slopes (gravity effects)
- [ ] Keep existing Pacejka MF 5.2 model — it's better than slowroads' simple physics

### Phase 6: UI & Game Mode Integration

**Modify `Driving.html` or create `Endless.html`**

- [ ] Add "Endless Drive" mode to level select
- [ ] New UI controls:
  - Seed input (for sharing specific worlds)
  - Terrain preset (Hills, Flat, Mountains, Mars)
  - Time of day / weather (reuse existing if available)
  - Autopilot toggle (like slowroads)
- [ ] Minimal HUD option (press U to hide UI)
- [ ] Music integration (optional, background ambient)

### Phase 7: Character Class System (redcoats.io Style)

**New file: `Traffic/character_system.js`**

- [ ] Character class definitions:
  - `Pedestrian` (Traffic Cop) — on foot, can direct traffic, issue fines
  - `BikeRider` — fast 2-wheel, lane splitting, chase ability
  - `AutoDriver` — auto-rickshaw, tight navigation
  - `BusDriver` — large vehicle, passenger capacity, route following
  - `TruckDriver` — heavy vehicle, cargo, towing
- [ ] Mount/Dismount system:
  - F key = universal interact (context-sensitive)
  - Mount animation + state transition
  - Vehicle inherits character class stats
- [ ] Character state machine:
  - `IDLE → WALKING → RUNNING → MOUNTED → DRIVING → DISMOUNTING`
  - `WORKING` state (cop directing, passenger boarding)
  - `FINED` / `ARRESTED` state (traffic violations)
- [ ] Class selection UI:
  - Spawn screen with class cards
  - Class stats display (speed, HP, vehicle, abilities)
  - Team balance indicator
- [ ] Class-specific abilities:
  - Cop: whistle, ticket book, radio for backup
  - Bus: passenger pickup, route HUD, emergency brake
  - Truck: cargo attach/detach, tow cable
  - Bike: lane split, wheelie (speed boost)
- [ ] Team interdependence:
  - Cops need vehicles to chase
  - Bus drivers need cops to clear intersections
  - Score system rewards teamwork

**Integration with existing systems:**
- `game_core.js` — add character state machine alongside vehicle physics
- `course.js` — add class spawn points per level
- `safezone-ui.js` — add class selection HUD
- `Driving.html` — add "Character Mode" toggle

### Phase 8: Optimization & Polish

- [ ] Profile chunk generation — must not block render loop
- [ ] Implement web worker for terrain/road generation (optional, advanced)
- [ ] Add fog to hide chunk pop-in (slowroads uses this effectively)
- [ ] Dynamic resolution scaling integration (already have DRS)
- [ ] Mobile touch controls for endless mode
- [ ] Save/load seed from localStorage

### Phase 9: Multiplayer Architecture (redcoats.io Scale)

**New file: `Traffic/netcode.js` (or integrate into game_core.js)**

- [ ] Server-authoritative architecture:
  - WebSocket server (Node.js + `ws` or Socket.io)
  - Client prediction for local player
  - Server reconciliation for position correction
- [ ] Interest management:
  - Only sync entities within radius of player
  - LOD for remote players (billboard → low-poly → full)
  - Priority queuing (closer = more frequent updates)
- [ ] Entity streaming:
  - Players spawn/despawn based on proximity
  - Vehicle sync (position, rotation, velocity)
  - Character class sync (class, state, mount status)
- [ ] Team system:
  - Red vs Blue (or Mumbai roles: Drivers vs Cops)
  - Team chat, team objectives
  - Shared scoring
- [ ] Scale targets:
  - Phase 9a: 2-4 players (proof of concept)
  - Phase 9b: 16-32 players (small battles)
  - Phase 9c: 100+ players (massive, with aggressive LOD)
  - Phase 9d: 1000 players (redcoats.io level — requires dedicated server)

**Reference for netcode:**
- redcoats.io likely uses: WebSocket + delta compression + spatial partitioning
- Client-side: interpolate remote players, predict local
- Server-side: validate positions, detect speed hacks, manage teams

---

## 5. Architecture Decisions

### A. Additive, Not Replacement
- Proc mode is a NEW game mode alongside existing Mumbai city
- Character classes are NEW alongside existing vehicle types
- Multiplayer is NEW — doesn't replace single-player
- Don't modify `course.js` or existing level configs without care

### B. Leverage Existing Systems
| Existing System | How to Reuse |
|----------------|-------------|
| `ThreePools` | Pool all proc-generated meshes/vectors/groups + remote player models |
| `RenderCore` | Use quality presets for LOD decisions |
| `SafeZoneUI` | HUD for endless mode + character class UI |
| `Pacejka physics` | Just add terrain height sampling + character on-foot physics |
| `DRS` | Auto-adjust quality for stable FPS |
| `A* pathfinding` | NPCs in multiplayer, traffic simulation |
| `Vehicle stats` | Each character class maps to existing vehicle stats |

### C. File Structure
```
Traffic/
  proc_terrain.js    — heightmap, noise, biome sampling
  proc_road.js       — road routing algorithm
  proc_chunks.js     — LOD chunk management
  proc_scenery.js    — foliage, buildings, props
  proc_mode.js       — game mode controller (or integrate into game_core.js)
  character_system.js — class definitions, state machine, mount/dismount
  netcode.js         — client/server communication (multiplayer)
  Endless.html       — new entry point (optional)
```

### D. Seed System
- URL hash: `#seed=abc123` loads specific world
- Random seed button for new worlds
- Seed determines: terrain shape, road path, tree placement, building locations
- All from single seed via Alea PRNG → deterministic worlds

---

## 6. Technical Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Self-avoiding road | Spatial hash + turnback logic + max retry limit |
| Chunk pop-in | Fog + async generation ahead of player + quality presets |
| Mobile perf | LOW preset: disable foliage, reduce view distance, simpler terrain |
| Memory growth | Aggressive object pooling, unload chunks behind player |
| Seam visible between LODs | Height interpolation at boundaries + vertex sinking |
| Road-terrain z-fighting | Offset road slightly above terrain (0.1m) at generation time |
| Steep terrain driving | Surface type detection → reduce friction, add slip |
| Three.js r128 limitations | All techniques work in r128 (no WebGL2-only features needed) |

---

## 6. Reference Resources

### Direct Research
- **slowroads.io** — play and observe: the zen feel comes from gentle curves, no sharp turns
- **Anslo's technical blog** — https://anslo.medium.com/slow-roads-tl-dr-a664ac6bce40
- **PGDrive paper** — https://arxiv.org/pdf/2012.13681 (block-based road assembly)
- **Three.js terrain examples** — https://threejs.org/examples/#webgl_geometry_terrain

### Algorithms
- **Perlin/Simplex noise** — use `simplex-noise` npm package or implement from scratch
- **Alea PRNG** — `npm i alea` for deterministic generation
- **Bezier curves** — Three.js `QuadraticBezierCurve3` for road smoothing
- **Spatial hashing** — simple grid Map for self-avoidance checks
- **A* pathfinding** — already in `road-graph.js`, can reuse for NPC routing on proc roads

### Code Patterns from slowroads
```javascript
// Key pattern: terrain height query
function getHeight(x, z) {
  // Multi-octave noise with persistence
  let height = 0;
  let amplitude = 1;
  let frequency = 0.01;
  for (let i = 0; i < octaves; i++) {
    height += noise(x * frequency, z * frequency) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return height;
}

// Key pattern: gradient-based road routing
function sampleGradient(x, z, dx, dz) {
  const h = getHeight(x, z);
  const hx = getHeight(x + dx, z);
  const hz = getHeight(x, z + dz);
  return { x: (hx - h) / dx, z: (hz - h) / dz };
}
```

---

## 7. Success Criteria

### Single-Player (Phases 1-6 + 8)
- [ ] Infinite road that never ends (drive 30+ min without repeating)
- [ ] No self-intersections in generated road
- [ ] Stable 60fps on HIGH preset (30fps LOW for mobile)
- [ ] Seed-based reproducibility
- [ ] Seamless chunk transitions
- [ ] Existing Mumbai city mode still works
- [ ] Mobile touch controls
- [ ] World sharing via URL seed

### Character System (Phase 7)
- [ ] 4+ distinct classes with different gameplay loops
- [ ] Mount/dismount (F key) works smoothly
- [ ] Class selection on spawn/respawn
- [ ] Class-specific abilities functional
- [ ] Team interdependence (score rewards teamwork)
- [ ] Character state machine handles all transitions

### Multiplayer (Phase 9)
- [ ] 2-4 players in same world (9a)
- [ ] Smooth remote player interpolation
- [ ] Interest management
- [ ] Team objectives work
- [ ] Scale to 16-32 players (9b)

---

## 8. Estimated Effort

| Phase | Effort | Complexity |
|-------|--------|------------|
| Phase 1: Terrain | Medium | Medium |
| Phase 2: Road | **High** | **High** — self-avoidance |
| Phase 3: Chunks | Medium | Medium |
| Phase 4: Scenery | Low | Medium |
| Phase 5: Physics | Low | Low |
| Phase 6: UI | Low | Low |
| Phase 7: Character System | **High** | **High** |
| Phase 8: Polish | Medium | Medium |
| Phase 9: Multiplayer | **Very High** | **Very High** |
| **Total (1-6 + 8)** | **~3-4 weeks** | **Single-player complete** |
| **Total (all)** | **~8-12 weeks** | **Full vision** |

---

_Last updated: August 10, 2026_
_Research: slowroads.io, redcoats.io, PGDrive, procedural generation_
