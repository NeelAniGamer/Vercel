# PLAN: Infinite Procedural Driving — Research & Implementation Roadmap

> Research sources: slowroads.io, PGDrive paper, procedural generation techniques
> Target: Traffic Simulator (Three.js r128, Mumbai-themed driving game)

---

## Note on "readcoats.io"

**readcoats.io** does not exist as a driving game. The user likely meant **redcoats.io**, which is a 3D multiplayer FPS (musket-era battle game) — NOT relevant to driving simulation. All research below focuses on slowroads.io and procedural driving generation techniques.

---

## 1. Executive Summary

**slowroads.io** is a zen infinite driving game with:
- Procedurally generated terrain (Perlin noise heightmap)
- Self-avoiding road that winds through terrain forever
- 3-level LOD system (far grid, near grid, ultra-fine)
- Per-wheel vehicle physics
- Top-down lighting (no dynamic shadows)
- Object pooling for performance
- No fail states — pure "active meditation"

**Your Traffic simulator** already has:
- Fixed road network (grid-based) with A* pathfinding
- Pacejka MF 5.2 tire physics (more advanced than slowroads)
- Three.js r128, object pooling, quality presets, DRS
- Mumbai-themed assets and buildings

**Goal**: Add an **infinite procedural mode** inspired by slowroads.io while keeping your existing Mumbai city mode intact.

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

### 2.2 PGDrive Procedural Generation (Academic Reference)

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

## 3. Implementation Plan

### Phase 1: Procedural Terrain Generator

**New file: `Traffic/proc_terrain.js`**

- [ ] Implement Alea-based seeded PRNG
- [ ] Implement multi-octave Perlin/Simplex noise function
- [ ] Create `ProcTerrain` class:
  - `getHeight(x, z)` — returns terrain height at world coords
  - `getNormal(x, z)` — returns surface normal
  - `getBiome(x, z)` — returns biome type (for ground texture blending)
- [ ] Integrate with existing `RenderCore` quality settings (lower res for LOW preset)
- [ ] Add debug visualization (wireframe toggle for terrain grid)

**Key decisions:**
- Resolution: 10m per sample for far grid, 1m for near grid
- Seeded generation for reproducible worlds (seed in URL hash)
- Use `PlaneGeometry` with vertex displacement (existing Three.js pattern)
- World-coordinate UVs for texture tiling (like slowroads)

### Phase 2: Infinite Road Generator

**New file: `Traffic/proc_road.js`**

- [ ] Implement `RoadGenerator` class:
  - `generate(startX, startZ, seed)` — creates initial road
  - `extendTo(distance)` — generates road ahead to given distance
  - `getSegmentsNear(pos, radius)` — returns road segments for rendering
- [ ] Core routing algorithm:
  - Sample gradient in 16 directions
  - Score each by: slope penalty + direction continuity bonus + turnback avoidance
  - Choose best valid direction
  - Store midpoint list with metadata
- [ ] Self-avoidance:
  - Spatial hash of visited cells (5m grid)
  - Trigger turnback when collision detected
  - maxRetries before accepting slight overlap
- [ ] Smoothing:
  - 9-point window average on heights
  - Quadratic Bezier for 1m resolution midline
- [ ] Road mesh generation:
  - Generate ribbon mesh from midline points
  - Width variation metadata
  - Cycling chunk system (create ahead, recycle behind)

**Integration with existing RoadGraph:**
- Optional: expose proc road as a `RoadGraph`-compatible interface
- Or: proc road mode skips `RoadGraph` entirely (new code path)

### Phase 3: Chunk Management & LOD

**Extend or new file: `Traffic/proc_chunks.js`**

- [ ] Implement chunk manager:
  - Track player position
  - Maintain active chunk set (radius-based)
  - Load/unload chunks asynchronously
  - Pool chunk geometries (reuse ThreePools)
- [ ] 3-tier LOD:
  - Far: low-poly terrain only
  - Medium: medium terrain + basic roads
  - Near: high-detail terrain + road + foliage
- [ ] Seam hiding:
  - Sink far-grid vertices below near-grid edges
  - Interpolate heights at boundaries
- [ ] Performance targets:
  - < 16ms frame time for chunk updates
  - Max 50 chunks active at once
  - Object pooling for all meshes/vectors

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

### Phase 7: Optimization & Polish

- [ ] Profile chunk generation — must not block render loop
- [ ] Implement web worker for terrain/road generation (optional, advanced)
- [ ] Add fog to hide chunk pop-in (slowroads uses this effectively)
- [ ] Dynamic resolution scaling integration (already have DRS)
- [ ] Mobile touch controls for endless mode
- [ ] Save/load seed from localStorage

---

## 4. Architecture Decisions

### A. Additive, Not Replacement
- Proc mode is a NEW game mode alongside existing Mumbai city
- Don't modify `course.js` or existing level configs
- New `Endless.html` entry point (or mode toggle in Driving.html)

### B. Leverage Existing Systems
| Existing System | How to Reuse |
|----------------|-------------|
| `ThreePools` | Pool all proc-generated meshes/vectors/groups |
| `RenderCore` | Use quality presets for LOD decisions |
| `SafeZoneUI` | HUD for endless mode |
| `Pacejka physics` | Just add terrain height sampling |
| `DRS` | Auto-adjust quality for stable FPS |

### C. File Structure
```
Traffic/
  proc_terrain.js    — heightmap, noise, biome sampling
  proc_road.js       — road routing algorithm
  proc_chunks.js     — LOD chunk management
  proc_scenery.js    — foliage, buildings, props
  proc_mode.js       — game mode controller (or integrate into game_core.js)
  Endless.html       — new entry point (optional)
```

### D. Seed System
- URL hash: `#seed=abc123` loads specific world
- Random seed button for new worlds
- Seed determines: terrain shape, road path, tree placement, building locations
- All from single seed via Alea PRNG → deterministic worlds

---

## 5. Technical Challenges & Solutions

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

- [ ] Infinite road that never ends (can drive for 30+ minutes without repeating)
- [ ] No self-intersections in generated road
- [ ] Stable 60fps on HIGH preset (30fps on LOW for mobile)
- [ ] Seed-based reproducibility (same seed = same world)
- [ ] Seamless chunk transitions (no visible pop-in)
- [ ] Existing Mumbai city mode still works unchanged
- [ ] Mobile touch controls functional
- [ ] World sharing via URL seed

---

## 8. Estimated Effort

| Phase | Effort | Complexity |
|-------|--------|------------|
| Phase 1: Terrain | Medium | Medium — noise algorithms, mesh generation |
| Phase 2: Road | **High** | **High** — self-avoidance is tricky |
| Phase 3: Chunks | Medium | Medium — pattern similar to existing systems |
| Phase 4: Scenery | Low | Medium — instanced meshes, placement rules |
| Phase 5: Physics | Low | Low — extend existing Pacejka model |
| Phase 6: UI | Low | Low — mode toggle, minimal HUD |
| Phase 7: Polish | Medium | Medium — profiling, mobile, edge cases |
| **Total** | **~3-4 weeks** | **Solo dev estimate** |

---

_Last updated: August 10, 2026_
_Research based on: slowroads.io, PGDrive, procedural generation literature_
