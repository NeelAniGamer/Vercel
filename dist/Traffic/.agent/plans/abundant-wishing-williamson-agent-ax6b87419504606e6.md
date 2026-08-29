# Plan: Full AAA NPC AI — Traffic Driving Simulator

**Project:** `C:\Users\neelg\OneDrive\Desktop\Vercel\Traffic` (Three.js r128, static HTML, Vercel)
**Branch:** `abundant-wishing-williamson` | **Date:** 2026-08-26 | **Mode:** READ-ONLY plan
**Goal:** Upgrade NPC vehicle + pedestrian AI from good FSM to Full AAA (GTA V / Cities:Skylines II / Forza / Hitman-grade) — believable, teaches rules, 60fps on mobile, no build step.

---

## 1) Context & Research Summary

### What exists today (verified `file:line`)

* `game_core.js:937` arrays `npcs/sigs/cps/peds` + `_loop():8383` dt capped 0.033, order `_usigs -> _unpcs -> _upeds -> _ucps -> _uobs`.
* `npc-ai.js:1` 15-state FSM (`FOLLOW_LANE/OVERTAKE/WAIT_SIGNAL/PULL_OVER/EMERGENCY_BRAKE/BUS_STOP/YIELD` etc.) + `NPC_PROFILES:18` 9 archetypes (normal 55 -> tourist 4) weighted `pickRandomProfile:133`. Physics via `desiredSpeed/currentSpeed` + `_steerTowardsTarget:640` lookAhead 0.12 + `_maintainLane:672` exp blend. Stuck recovery `3.5s nudge / 8.0s respawn:438`.
* `traffic-manager.js:72` `TrafficManager` owns `BASE 36 / MAX 80 / MOBILE 24`, `RULE_BREAKER 20%`, `PLATOON gap 8`, spawn torus `radius 180 gap 12-45`, despawn `250m`, density `+0.08/4s`. 6 random A* attempts `323` + single-neighbor fallback. `signalAccumulation:58` telemetry only.
* `road-graph.js:156` `RoadGraph.fromLevelConfig:167` builds nodes from `v×h` crossings, `subdivide 40m`, spatial grid `100`, A* `findPath:344` (Set scan O(n²), euclidean heuristic, `oneWay` check). `BuildingSlot` getWorldPosition `setback roadHalf+21+depth*0.15`.
* `vehicles.js:200` `IndianVehicles.buildVehicle` -> Group, no LOD, bounds set by caller `traffic-manager.js:485` `heavy 1.5/4.5, bike 0.6/1.1, car 1.15/2.2`.
* `pools.js:136` `vehicle:80` pool matches NPC cap; `render_core.js:4` `LOW 0.5 LOD / MED 0.75 / HIGH 1.0 / ULTRA 1.25` + DRS `_checkFrameBudget:325`.
* `rule-breaker-profiles.js:3` 8 typed breakers (`signal_jumper, sidewalk_rider...`) with `spawnRate 0.20, TOTAL 120` — **dead code**, never used beyond flat 20% random.
* `mindset-ai.js:14` survey archetypes never read by game_core.
* Tests: `test_gameplay.js:144` only checks `activeCount>=20`, `test-roadgraph.js:1` checks connectivity, no behavior asserts.

### What AAA does (10 research clusters)

* **GTA V:** lane-level node graph (not road-level), intersection phase `junctions.xml`, fix mods targeted `stop-start jitter, queue blindness, spacing` [gtamods wiki PATH, Nexus Real Traffic AI].
* **Cities:Skylines II:** cost = `Time+Comfort+Money+Behavior`, re-routes on incident, lane overtaking when adjacent less used, **lane mathematics** `lanes_in=lanes_out` [paradox dev diary 2, TMPE Dynamic Lane Selection].
* **Forza Multi-Line:** don't give one spline — 2-3 lateral offsets/edge, blend quintic, limited collisions [forza.net Update 20].
* **BeamNG:** 60 personalities via `risk/followDist/honk` params + FPS-aware tick [nexus beamng 285].
* **Hitman 2012:** 1200 agents on PS3 @30fps `AI 2ms, framework 1ms`, cell grid 8m + async anim + impostor pooling [GDC Crowds in Hitman].
* **Architecture verdict:** FSM+micro-Utility at 10Hz staggered beats BT/GOAP for 24-80 browser agents (GOAP 250MB/search explosion, BT traversal per frame heavy) [johal.in PyTree benchmarks].
* **Peds:** sidewalk graph + lite separation-only Social Force (max 2 neighbors/cell) beats full SFM (overlap, jitter) [Helbing 1995, Tum PedSim].
* **Cheap tells:** rubber-banding, in-view teleport, ghosting, gridlock, uniform speed [avclub, gtaforums].

### Constraints to honor

* Three r128 pinned, no bundler, `defer` load order `pools->road-graph->render_core->safezone-ui->game_core` (`AGENTS.md:36`).
* Static HTML Vercel, mobile Safari memory, canvas `1920x1080` cap `game_core.js:1378`, shadow `512 LOW / 2048 ULTRA`, particles `500-5000`.
* `config.json` / `cert_assets.js 18MB` / `env.js` untouched without approval.

---

## 2) Architecture Decision — FSM + Micro-Utility Hybrid

```
┌──────────────────────────────────────────────────────────┐
│           Global Traffic Director (1/frame)              │
│  signal phases, spawn torus, density, DRS listener       │
├──────────────────────────────────────────────────────────┤
│  Perception (10Hz, staggered)  ->  Utility Scorer (10Hz)  │
│  8m cell grid, 3x3 query,       scores: wait/overtake/   │
│  predicted circles 1.5s,        yield/busStop            │
│  ray gap 30m, oncoming 40m  --->  max wins -> FSM         │
├──────────────────────────────────────────────────────────┤
│  FSM (6 core states): CRUISE, FOLLOW, YIELD, OVERTAKE,   │
│  WAIT_SIGNAL, AVOID_PLAYER (+ BUS_STOP, PULL_OVER opt)  │
├──────────────────────────────────────────────────────────┤
│  Steering: lane center quintic + separation push         │
│  Graph: lane-level RoadGraph 2.0 (per-lane nodes)       │
│  LOD: 10Hz near (<60m) / 5Hz mid (60-120m) / frozen far │
└──────────────────────────────────────────────────────────┘
```

*Why not full BT/GOAP:* 0.05ms/agent budget, main-thread shared with render/physics, must be inspectable without visual debugger. Micro-utility (3 inputs, 5 actions) gives believable variance at `18k ticks/s` vs BT `45k+traversal`.

---

## 3) System Design — 6 Subsystems

### 3.1 Lane-Level RoadGraph 2.0 (`road-graph.js`)

* **New:** `Lane` concept. Each `RoadEdge` -> `laneCount = lanes*2` directed lanes (or `lanes` if oneWay). Each lane gets `LaneNode` chain at `edge.getLaneCenter(laneIdx,t)`. Intersection node stores `incidentLanes[]`, `phaseId`, `isCrosswalk`.
* **New types:** `RoadLane`, `SidewalkEdge` (offset `roadHalf+ 4m`), `CrosswalkEdge` (at `node.type != dead_end`).
* **Costed A*:** `findPath(start,end, costs={traffic, signals, comfort})` -> edge cost `length/speedLimit * (1+ density*0.6 + signalPressure*0.4 + laneChanges*0.2)`. Binary heap open set, turn penalty `+3m`, U-turn `+25m`.
* **Perf:** replace `getNearestEdge` linear `311` with `_edgeGrid` 50m bucket; binary heap; `getLaneForPoint` helper.
* **API keep compat:** `fromLevelConfig` still parses `roads[] {v/h}`, but emits lanes. Old `edge.lanes` readers get `Math.max(1, Math.floor(lanes*2 / dirs))`.

### 3.2 Vehicle Brain 2.0 (`npc-ai.js` refactor)

* **States trimmed 15->6 core:** `CRUISE` (was FOLLOW_LANE), `FOLLOW` (car ahead within 28m), `YIELD` (signal/queue/ped), `OVERTAKE` (3-phase via utility), `WAIT_SIGNAL` (hysteresis), `AVOID_PLAYER` (predicted). Extras `BUS_STOP, PULL_OVER, CRASH` gated.
* **Utility scorer (called before state):** `scoreWait(v)= gapClear?0.2:0.9`, `scoreOvertake` (needs `lanes>=2 && gapAhead<8 && oncoming>30 && playerDist>8`), `scoreYield` from predicted `playerTimeToIntersection <2.5s ->0.95`. Curves are simple `lerp/clamp`.
* **Steering:** keep `lookAhead 0.12` but **multi-line** — each edge stores 3 offsets `[-0.7 lane, center, +0.7 lane]`, blend `quintic` on lane change `t:0->1 0.8s`. Add `lateralJitter ±0.35m` seed `hash(id)`.
* **Personalities:** expand `NPC_PROFILES` via `RuleBreakerProfile` types: map `signal_jumper->signalCompliance 0.15`, etc. Store `seedJitter, followDist = 7 + hash%10, maxSpdScale 0.88-1.15`.
* **Hysteresis:** `if speed<5km/h >0.5s -> hold stop 0.8s debounce` prevents GTAV oscillation.

### 3.3 Perception & Prediction (new `perception.js`)

* **Cell Grid:** `CELL 8m`, `Map<"gx,gz", vehicle[]>`, `query3x3(pos, radiusCells=1)` -> max 6 neighbors, not N². Rebuild `TrafficManager._updateEdgeIndex` -> also fill grid `O(n)`.
* **Sensors per tick (10Hz):** `rayGap 30m forwardDot>0.6 lateral<1.4`, `oncomingCheck 40m opposite lane`, `signal Ahead 35m forwardDot>0.5`, `pedGap 12m`, `playerPrediction: pos+vel*1.5s radius 2.5m`.
* **Staggered tick:** `GROUP = Math.ceil(activeCount/20)` max 4, `if(frame % GROUP !== idHash % GROUP) return`. Near `dtEffective=dt*GROUP`.

### 3.4 Sidewalk Graph + Ped Crowd Lite (`npc-ai.js` PedestrianAI + `road-graph.js` sidewalk)

* **Generate:** `RoadGraph.buildSidewalkGraph()` after `buildBuildingSlots` — for each `segment`, create `leftWalk/rightWalk` polylines offset `roadHalf+4.0` (or `isPedestrian?5.5`), connect at intersections via `crosswalkEdges` (length ~12m, flagged `isCrosswalk`).
* **Ped states:** `WalkSidewalk -> WaitAtCurb -> Cross -> WalkSidewalk` + `Flee`. Gap acceptance `no vehicle within 30m @ >30km/h`. Group centroid attraction only if `PED_PROFILES.child group 0.7`.
* **Avoidance:** separation only `if dist<1.2 to nearest 2 in cell -> push * (1.2-dist)*0.3`. 5Hz tick, staggered same groups. `InstancedMesh` for >30 peds (one draw call, per-instance color).
* **Routes:** reuse `A*` on sidewalk nodes; random walk only if no target.

### 3.5 Global Traffic Director (`traffic-manager.js` upgrade)

* **Signal Controller:** extract from `game_core.js:9261` `9.5s rem%`. Replace per-signal `d.t` with **global `phaseClock` + intersection `phaseId`** (`NS 4s, Y 1.5s, EW 4s, Y 1.5s`). `shouldStopAtSignal(node, eta)` = `phase predicts red on arrival?` + queue length `stoppedWithin 25m count/6 -> speedCap lerp(30,5)`.
* **Spawn Controller:** torus `inner 40m` (never spawn active zone) + `outer 80-180` preferred, frustum cull `dot(camFwd,toNPC)<-0.4 behind cam`, garage clearance `32m` keep. Spawn rate tied to `getLODMultiplier()`: `LOW 8 / MED 18 / HIGH 36 / ULTRA 56 active` adaptive.
* **DRS listener:** hook `RenderCore._autoQualityEnabled` downgrade -> immediately despawn platoons farthest `>120m` before frame budget exceeded.
* **Signal pressure now applied:** `desiredSpeed *= 1 - signalPressure*0.25` capped, `accumulation` ages via `TrafficManager.getSignalPressure()`.
* **Rule breaker wiring:** replace flat `0.20` with `MumbaiTimeProfile` (peak 08-11/17-20 -> 0.35, night 0.12) + edge `sidewalk_rider` boost if `wideFootpath = width>18`.

### 3.6 Telemetry & Debug (`traffic-debug.js` new)

* `window.TrafficDebug` overlay (dev only, `?debug=traffic`): `active/pooled/platoons/signalPressure/density`, `npc.selected.npcAI.getDebugInfo()` -> state, scores, gap, oncoming. Log `signalViolation, overtake abort, stuckTimer`.

---

## 4) Phased Plan (Dependencies, Files, Estimates)

### Phase 0 — Scaffolding & Guardrails (no gameplay change)

* **P0-1** `tests/` add `test_traffic_brain.js` (node harness stubbing `THREE` + `eval road-graph.js/npc-ai.js`) assert `findPath laneLevel`, `utility scorer`, `halfW`. Extend `test_gameplay.js:144` to assert `ruleBreakerRatio, state WAIT_SIGNAL`.
* **P0-2** `perception.js` skeleton + `RoadGraph._edgeGrid` + binary heap (`heap.js` 60 lines, zero deps) — unit tested `O(log n)` A*.
* Files: `Traffic/perception.js` (new), `Traffic/heap.js` (new), `Traffic/tests/*`.
* Risk: Three r128 global `THREE` in eval — stub as in `test-roadgraph.js`.

### Phase 1 — RoadGraph 2.0 (blocks all else)

* **P1-1** `road-graph.js` refactor: add `RoadLane`, `SidewalkEdge`, `CrosswalkEdge`, per-lane nodes, intersection phaseId, edge cost fields, `_edgeGrid`, `buildSidewalkGraph`, costed `findPath` heap. Keep legacy `RoadNode/RoadEdge` as shims.
* **P1-2** migrate `_buildRoadsFromGraph:5977` + `_buildBuildingsFromGraph:7387` to emit per-lane collision planes.
* Files: `road-graph.js` (~419-> ~750 lines), `game_core.js:5977`, `proc_chunks` not touched.
* Verify: `test-roadgraph.js` passes `nodes 30-> ~90 laneNodes`, `findPath` far start->end via cost, `getNearestEdge` <0.3ms @200 edges.

### Phase 2 — Vehicle Brain 2.0 (core FSM+Utility)

* **P2-1** `npc-ai.js` rewrite core: 6 states, utility scorer `scoreOvertake/scoreWait/scoreYield`, `TickScheduler` 10Hz stagger, quintic lane blend, histogram `hornFrequency`.
* **P2-2** wire `RuleBreakerProfile:185 applyToNPC` into `TrafficManager._spawnSingleVehicle:291` (replace `_pickProfileKey` random). Feed `MumbaiTimeProfile`.
* **P2-3** anti-pattern fixes: no rubber-banding (`cap = speedLimit*scale` only), no in-view teleport, hysteresis debounce, torus spawn.
* Files: `npc-ai.js` (~1481->~1100 lines disciplined), `traffic-manager.js:238,323`, `rule-breaker-profiles.js` consumed.
* Verify: `spawn 56` @60fps desktop `AI 1.5ms`, `overtake` respects oncoming 30m, `signalCompliance` varies per profile.

### Phase 3 — Perception Grid + Prediction

* **P3-1** `perception.js` cell grid 8m, `query3x3`, predicted circles, `rayGap/oncoming/signal/ped`.
* **P3-2** integrate into `npc-ai._getVehicleAhead:251` -> use grid not `vehicles[] scan`, `limit 6`. Replace legacy `game_core.js:9433 _npcGrid 25` with shared grid.
* Files: `perception.js`, `npc-ai.js:251,317,1048`, `traffic-manager.js:196`.
* Verify: `AI update 80 agents` drops from `~4ms` to `~1.4ms`.

### Phase 4 — Signals & Director

* **P4-1** global `SignalController` (new `signal-controller.js` 120 lines) with `phaseClock, phase(NSS 4 / Y1.5 / EW 4 / Y1.5)`, `etaCheck + queueCap`. Move `game_core.js:9261 _usigs` logic there.
* **P4-2** `TrafficManager` DRS hook `render_core.js:325 _checkFrameBudget` -> subscribe, adaptive `MAX` by LOD, torus spawn, time-of-day `RULE_BREAKER` weight.
* Files: `signal-controller.js` (new), `traffic-manager.js:138,156,546`, `game_core.js:9261,9389`.
* Verify: approaching red at 40km/h stops before `stopDist RW/2+3:6115`, not inside zebra; queue of 6 caps at `5km/h`.

### Phase 5 — Pedestrian Crowd Lite

* **P5-1** `road-graph.js buildSidewalkGraph` + `PedestrianAI:1244` 5Hz + separation only + sidewalk A* (reuse `perception` cells 4m subgrid).
* **P5-2** `game_core.js:10152 _upeds` stagger, `InstancedMesh` batch for >30 peds (1 draw call) via `ThreePools.getInstancedMesh` extension.
* Files: `npc-ai.js` ped section `1220-1472`, `game_core.js:10152,5280`, `road-graph.js:239`.
* Verify: `Academy` 45 peds `PO` at `5Hz` <0.6ms, no ped jitter overlap, cross only when gap clear.

### Phase 6 — Polish, Audio, Telemetry, Tests

* **P6-1** Audio bus: `npcAI.emit('horn', {pos, intensity=aggression}) -> TrafficAudio.playHornSpatial` via `traffic-manager.setAudio` (currently never called). `playScreech` via lateral slip gate `game_core.js:2775`.
* **P6-2** `traffic-debug.js` overlay `?debug=traffic`. Perf budget log `frame: AI/Physics/Render`.
* **P6-3** Playwright `pw_test.js:1` extended to assert `ruleBreakerRatio ~0.2±0.07`, `BUS_STOP dwell 5-9s`, `emergency give-way`.
* Files: `traffic-audio.js:291`, `traffic-manager.js:79`, `pools.js:136` audioSource fix (single ctx).
* Verify: no regression on `Performance` skill `~2000 particles ULTRA`.

---

## 5) File & Script Map

| File | Create / Edit | Phase | Notes |
|------|---------------|-------|-------|
| `road-graph.js` | **Edit heavy** | P1 | Lane graph + sidewalk + heap. Keep `window.RoadNode/Edge/Segment/Graph` globals. |
| `npc-ai.js` | **Edit heavy** | P2,P5 | FSM trim + utility + tickScheduler. Keep `window.NPCAI/PedestrianAI/profile` globals. |
| `perception.js` | **Create** | P0,P3 | CellGrid + predicted circles + ray helpers. No `THREE` beyond `Vector3`. |
| `heap.js` | **Create** | P0 | Binary heap for A* (60 lines). |
| `signal-controller.js` | **Create** | P4 | Global phaseClock, queue caps. |
| `traffic-manager.js` | **Edit** | P2,P4 | Spawn torus, density LOD, DRS hook, RuleBreakerProfile wiring. |
| `game_core.js` | **Edit light** | P1,P4,P5 | `_buildScene,_buildRoadsFromGraph,_usigs,_unpcs,_upeds` only. |
| `traffic-debug.js` | **Create** | P6 | Dev overlay gated param. |
| `traffic-audio.js` | **Edit light** | P6 | `playHornSpatial` additive, ctx fix. |
| `vehicles.js` | **No edit** | — | Caller sets `halfW/halfD`. Add LOD note only. |
| `pools.js` | **Edit tiny** | P6 | Add `getInstancedMesh/resetInstancedMesh` + fix `audioSource` single ctx. |
| `render_core.js` | **No edit** | — | Hook via `getLODMultiplier/getMaxParticles/setQuality` only. |
| `rule-breaker-profiles.js` | **No edit** | — | Now consumed, not edited. |
| `course.js` | **No edit** | — | Add `speedLimit/roadType` on roads only via ADR if needed. |
| `Driving.html/Academy.html` | **Edit once** | P1 | Add `<script defer src="heap.js">`, `perception.js`, `signal-controller.js` *before* `road-graph.js` per `AGENTS.md:36` order. |
| `config.json, cert_assets.js, env.js` | **Never** | — | Per Critical list. |

Load order final:
```html
<script defer src="pools.js"></script>
<script defer src="heap.js"></script>
<script defer src="perception.js"></script>
<script defer src="signal-controller.js"></script>
<script defer src="road-graph.js"></script>
<script defer src="render_core.js"></script>
<script defer src="safezone-ui.js"></script>
<script defer src="traffic-audio.js"></script>
<script defer src="rule-breaker-profiles.js"></script>
<script defer src="npc-ai.js"></script>
<script defer src="traffic-manager.js"></script>
<script defer src="game_core.js"></script>
```

---

## 6) Data Shapes (unchanged API first)

```js
// RoadGraph.fromLevelConfig(cfg) cfg.roads[] stays {type:'v'|'h', x/z, x1/x2/z1/z2, lanes, width, speedLimit, roadType}
// New optional: roads[].speedLimit, oneWay (honored), sidewalkWidth
// New graph fields: graph.lanes: Map<laneId, Lane>, graph.sidewalkGraph: RoadGraph, graph.phaseByNode: Map<nodeId, phaseId>
// Vehicle (traffic-manager._createVehicle)
vehicle.mesh.userData = { npcType, halfW, halfD, isTrafficManagerVehicle, materials }
vehicle.npcAI = new NPCAI(vehicle, roadGraph, trafficManager)
vehicle.profileKey = ruleBreakerTypeKey | npcProfileKey
```

GC: reuse caller `ThreePools.getVec3` in `getWorldPosition, steer, grid` — never `new Vector3` in hot loop.

---

## 7) Performance Budget (16.6ms/frame)

| Slice | Budget | How |
|-------|--------|-----|
| Render | 8-9ms | `RenderCore` `resScale/shadow` already quality-gated |
| Physics | 2ms | Pacejka MF 5.2 capped dt 0.033 |
| AI vehicles | 1.2ms | 10Hz stagger (20/group), grid query 3x3 |
| AI peds | 0.5ms | 5Hz stagger, 4m cells, 2-neighbor separation |
| Audio/VFX | 0.3ms | Spatial horn throttled `aggression*0.5` |

Worst `80 agents ULTRA`: `80/4=20` ticked/frame x `0.05ms` = `1.0ms` + `0.5` peds = pass. Mobile `24` x10Hz = `6`/frame = `0.3ms`.

---

## 8) Verification Plan

* **Unit:** `heap correctness 1000 pushes`, `findPath costed vs vanilla`, `grid query <=6`, `utility overtake lanes>=2 && oncoming>30`.
* **Integration (node):** spawn 40 lane-level nodes `fromLevelConfig` with `v×h` -> `path length > nodes length/2`, `sidewalk offset = roadHalf+4`, `signal phase green predicts arrival`.
* **Browser:** extend `test_gameplay.js:129` — assert `active>=24`, `types>=4`, `ruleBreakerRatio 0.13-0.27`, `bus STOP dwell 5-9s`, `red -> WAIT_SIGNAL within 1s`, `no in-view despawn (dist>60||!frustum)`.
* **Perf:** `chrome devtools Performance -> AI slice 2ms max`, `ThreePools.getStats()` hitRate>80%, `renderCore.getPreset()` not thrashing DRS.
* **Regression:** `game_core.js:4670` legacy fallback when `RoadGraph` throw -> still `Kenney` GLB roads; `isPedestrian` disables vehicle AI.

---

## 9) Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `road-graph.js` O(n²) A* + per-lane expansion -> longer paths | Frame hitch at spawn (6 attempts) | Binary heap + lane cache + `_assignRoute` early exit on neighbor fallback |
| Three r128 `Vector3` GC | Jank | Use `ThreePools.getVec3/release`, pre-allocated `_v1/_v2` |
| Load order break (`AGENTS.md:36`) | Engine null | Add 3 scripts before `road-graph`, test `defer` order via network idle |
| Mobile WebGL memory (18MB cert_assets) | Crash | Gate `MAX` to `getMaxParticles`, disable `castShadow` when `lodMult<0.75` |
| Signal phase global breaks existing `9.5s rem%` | Flaky waits | Keep per-signal `d.t` for legacy `sigs` rendered, but Brain reads global `SignalController` |
| RuleBreaker typing breaks themed `npcs[]` scripted routes | Wrong colors/types | Keep explicit `levelNpcs` priority `traffic-manager.js:242` before weighted pick |

---

## 10) Non-Goals

* No ML/GOAP/transformer, no physics rerun, no navmesh bake, no worker offload v1, no GLB re-export, no Vercel rewrite, no `config.json` change.

---

## 11) Open Questions for You (confirm before build)

1. **Full AAA scope lock?** Confirm 6 phases vs cut to 4 if deadline <2 weeks (skip P5 instanced peds + P6 audio bus first).
2. **Ped priority:** `Academy.html` is school? Should sidewalk graph be `Academy`-only or both modes?
3. **Signal realism:** Mumbai uses `4-phase` (with left arrow) — want `3-phase simple` or `4-phase with protected left`?
4. **Audio:** ok to make `TrafficAudio` spatial (StereoPanner) requiring `AudioContext resume` gesture?
5. **Debug toggle:** `?debug=traffic` url gated or `localStorage` + console?

---

## 12) Execution Checklist (when approved -> build mode)

* [ ] P0 guards + heap + perception stub + tests green
* [ ] P1 RoadGraph lane graph + sidewalk graph + heap A* + game_core road builder
* [ ] P2 Vehicle Brain FSM+utility + RuleBreaker wiring + anti-pattern fixes
* [ ] P3 Perception grid + stagger + replace linear scans
* [ ] P4 SignalController global + TrafficManager DRS/torus/timeProfile
* [ ] P5 Ped Crowd Lite 5Hz + sidewalk A* + instanced peds
* [ ] P6 Audio spatial + debug overlay + Playwright asserts + polish
* [ ] Final typecheck, `pw_test.js` green, manual playtest both htmls.

