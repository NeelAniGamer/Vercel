# Comprehensive Technical Analysis: Vanilla JS NPC Traffic & Pedestrian AI Stack

**Date:** August 26, 2026  
**Investigator:** Vanilla JS Codebase Explorer  
**Subject:** Deep Architecture Map & Gap Analysis for R1–R5 Upgrade  
**Working Directory:** `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\explorer_survey_vanilla`  

---

## 1. Executive Summary

This investigation maps the complete Vanilla JS codebase of the Mumbai Traffic Hero driving and pedestrian simulator. The stack consists of:
- **Engine Core:** `game_core.js` (~12.5k lines, Three.js r128 render loop, physics, HUD, legacy NPC fallback).
- **Traffic Subsystems:** `traffic-manager.js` (~790 lines), `npc-ai.js` (~1.48k lines), `road-graph.js` (~420 lines), `pools.js` (~207 lines), `rule-breaker-profiles.js` (~374 lines), `render_core.js` (~443 lines), `safezone-ui.js` (~403 lines), `course.js` (~1.12k lines).
- **HTML Entry Points:** `Driving.html` (driving simulation & challenges), `Academy.html` (pedestrian training, theory & exams).

The existing architecture provides a modular foundation (RoadGraph spatial network, TrafficManager pooling & spawning, NPCAI state machine, ThreePools memory management). However, the NPC longitudinal physics, lateral lane-changing, steering tracking, and pedestrian safety checks currently rely on heuristic approximations, linear speed clamping, and static distance thresholds. 

This report provides the full architectural mapping, identifies all technical gaps against requirements **R1** (IDM physics), **R2** (MOBIL lane changes), **R3** (Adaptive Pure Pursuit), **R4** (Pedestrian TTC & jaywalking), and **R5** (Mumbai micro-behaviors & anti-deadlock watchdog), and specifies exact data structures, function signatures, and integration interfaces for implementation.

---

## 2. Complete Architecture & Execution Flow

### 2.1 Script Dependency Hierarchy
In both `Driving.html` and `Academy.html`, Vanilla JS scripts are loaded in a strict sequential order:
```html
<script src="pools.js"></script>              <!-- Object pooling (ThreePools, Pool) -->
<script src="road-graph.js"></script>         <!-- RoadNode, RoadEdge, RoadSegment, RoadGraph -->
<script src="render_core.js"></script>        <!-- RenderCore, QUALITY_PRESETS, DRS -->
<script src="safezone-ui.js"></script>        <!-- SafeZoneGrid layout engine -->
<script src="world-streamer.js"></script>     <!-- Chunk streaming -->
<script src="mission-manager.js"></script>    <!-- Mission objectives -->
<script src="scenery-kit.js"></script>        <!-- Procedural scenery -->
<script src="collectible-system.js"></script> <!-- Collectibles & coins -->
<script src="checkpoint-system.js"></script>  <!-- Route checkpoints -->
<script src="gameplay-recorder.js"></script>  <!-- Telemetry recorder -->
<script src="task-manager.js"></script>       <!-- Task evaluation -->
<script src="scenario2d.js"></script>         <!-- 2D top-down mini-scenarios -->
<script src="course.js"></script>             <!-- Levels, badges, violations -->
<script src="traffic-audio.js"></script>      <!-- WebAudio synth engine -->
<script src="game_core.js"></script>          <!-- Main 3D simulation engine -->
<script src="npc-ai.js"></script>             <!-- NPCAI, PedestrianAI -->
<script src="traffic-manager.js"></script>    <!-- TrafficManager, Platoon -->
<script src="rule-breaker-profiles.js"></script> <!-- RuleBreakerProfile, MTP stats -->
<script src="ui.js"></script>                 <!-- UI controller -->
<script src="start.js"></script>              <!-- Bootstrap -->
```

### 2.2 Lifecycle & Runtime Call Chain
1. **Initialization (`game_core.js: constructor`)**:
   - `ThreePools.init(this)` prewarms vector, matrix, mesh, group, vehicle, and pedestrian pools.
   - `_initR()` instantiates WebGLRenderer and RenderCore.
   - `_initG()` initializes game state and HUD.
2. **Scene Setup (`game_core.js: _buildScene`)**:
   - `RoadGraph.fromLevelConfig(cfg)` creates nodes and directional edges from `cfg.roads` and computes intersection crossing stations.
   - `TrafficManager` is instantiated: `this.trafficManager = new window.TrafficManager(this)`.
   - Initial traffic spawned: `this.trafficManager.spawnInitialTraffic(this.roadGraph, cfg.route, count, cfg)`.
   - Visual road geometry generated: `_buildRoadsFromGraph(roadWidth)`.
   - Buildings placed at `roadGraph.buildingSlots` via `_buildBuildingsFromGraph()`.
   - Traffic signals instantiated via `_buildTrafficSignals(cfg, RW)`.
3. **Simulation Tick (`game_core.js: _loop`)**:
   - `_usigs(dt)`: cycles traffic signals (`red` 4.0s, `yellow` 1.5s, `green` 4.0s) and synchronizes `sg.state`.
   - `_unpcs(dt)`: delegates to `this.trafficManager.update(dt, this.player, this.sigs)`.
     - `TrafficManager.update`: updates density, platoons, vehicle lifecycle, edge indices, and calls `vehicle.npcAI.update(dt, playerVehicle, signals)`.
     - Physical bounding-box collisions between player and active NPC vehicles are resolved.
   - `_upeds(dt)`: iterates `this.pedestrianAIs` and calls `ai.update(dt, this.npcs, this.playerVehicle || this.player)`.

---

## 3. Subsystem Deep Dive & Gap Analysis

### 3.1 Longitudinal Control & Follower Logic (Gap vs R1)

#### Current Implementation (`npc-ai.js: _applyPhysics`, `_updateFollowLane`)
- **Acceleration**: Fixed scalar addition `accel = stats.accel * dt * 60` where `currentSpeed = Math.min(desiredSpeed, currentSpeed + accel)`.
- **Deceleration**: Geometric friction multiplier `fric = Math.pow(stats.fric, dt * 60)` where `currentSpeed = Math.max(desiredSpeed, currentSpeed * fric)`.
- **Queueing & Braking**: When a lead vehicle is detected:
  - If `dist < stopBuffer` (3.0m) and `leadSpeed < 0.2 m/s`: `desiredSpeed = 0`, `currentSpeed *= 0.7`.
  - If `dist < followDistance`: linear scaling `desiredSpeed = min(targetSpeed, targetFollowSpeed * distRatio)`.
  - Signal red light: `distToSignal < 24m` sets `desiredSpeed = 0`, `distToSignal < 9m` sets `currentSpeed *= 0.75`.

#### Technical Gaps & Upgrade Requirements (R1)
1. **Continuous IDM Acceleration Equation**:
   $$a = a_{\max} \left[ 1 - \left(\frac{v}{v_0}\right)^\delta - \left(\frac{s^*(v, \Delta v)}{s}\right)^2 \right]$$
   where:
   - $v$: current vehicle speed (m/s).
   - $v_0$: desired free-flow speed (m/s) based on edge speed limit and driver profile.
   - $\delta$: acceleration exponent (typically 4).
   - $a_{\max}$: maximum comfortable acceleration ($\text{m/s}^2$).
   - $s$: net distance gap to the vehicle/obstacle ahead ($s = d - l_{\text{lead}}$).
2. **Dynamic Desired Minimum Headway**:
   $$s^*(v, \Delta v) = s_0 + v \cdot T + \frac{v \cdot \Delta v}{2\sqrt{a_{\max} \cdot b}}$$
   where:
   - $s_0$: minimum jam distance ($1.2\text{m} - 3.0\text{m}$ depending on vehicle type).
   - $T$: safe time headway ($0.8\text{s} - 1.8\text{s}$).
   - $\Delta v = v - v_{\text{lead}}$: approach velocity difference.
   - $b$: comfortable deceleration threshold ($1.5 - 2.5\,\text{m/s}^2$).
3. **Virtual Obstacle Representation**:
   - Red signals and crosswalk stop lines must act as stationary virtual lead vehicles ($v_{\text{lead}} = 0, \Delta v = v, s = \text{distance to stop line}$).
   - This eliminates all discrete `currentSpeed *= 0.75` cuts and creates smooth, realistic stopping curves.

---

### 3.2 Lateral Control & Lane Changing (Gap vs R2)

#### Current Implementation (`npc-ai.js: _attemptOvertake`, `_isLaneClear`, `_maintainLane`)
- Overtaking is triggered if distance to leader is $< 0.65 \times \text{followDistance}$.
- Target lane is hardcoded to binary toggle `targetLane = currentLane === 0 ? 1 : 0`.
- Safety check is a simple spatial box: `toV.dot(forward) > -8 && toV.dot(forward) < 32` for all vehicles on edge.
- Lateral positioning uses an exponential lerp to lane center: `toCenter * (1 - Math.exp(-dt * 4.5))`.

#### Technical Gaps & Upgrade Requirements (R2)
1. **MOBIL (Minimizing Overall Braking Induced by Lane Changes)**:
   - **Safety Criterion**: A lane change to candidate lane $c$ is permitted only if the deceleration imposed on the new follower $\tilde{n}$ does not exceed the safe braking limit:
     $$\tilde{a}_{\tilde{n}} \ge -b_{\text{safe}}$$
   - **Incentive Criterion (Game-Theoretic)**: The driver changes lanes if the self-advantage plus politeness-weighted advantage to neighbors exceeds a threshold $\Delta a_{\text{th}}$:
     $$(\tilde{a}_c - a_c) + p \cdot \left[ (\tilde{a}_n - a_n) + (\tilde{a}_o - a_o) \right] > \Delta a_{\text{th}} + a_{\text{bias}}$$
     where:
     - $a_c, \tilde{a}_c$: current vehicle's acceleration in current vs candidate lane.
     - $a_n, \tilde{a}_n$: new follower's acceleration before vs after the change.
     - $a_o, \tilde{a}_o$: old follower's acceleration before vs after the change.
     - $p \in [0, 1]$: politeness factor from driver profile.
     - $a_{\text{bias}}$: lane bias (e.g. keeping left on multi-lane Indian roads).
2. **Multi-Lane Topologies**:
   - Support arbitrary lane counts ($N \ge 2$), enabling multi-lane overtaking, highway lane drops, and return-to-lane discipline.

---

### 3.3 Path Tracking & Steering (Gap vs R3)

#### Current Implementation (`npc-ai.js: _steerTowardsTarget`)
- Looks ahead along edge by adding fixed progress `routeProgress + 0.12`.
- Computes heading diff: `diff = Math.atan2(toWaypoint.x, toWaypoint.z) - rotation.y`.
- Clamps rotation by `maxTurn = stats.turn * dt * 60 * 1.5`.
- Directly displaces `position.x` and `position.z` in `_maintainLane`.

#### Technical Gaps & Upgrade Requirements (R3)
1. **Speed-Adaptive Lookahead Pure Pursuit**:
   - Look-ahead distance:
     $$L_d = \text{clamp}(k_{\text{look}} \cdot v, L_{\min}, L_{\max})$$
     (e.g., $k_{\text{look}} = 0.8\,\text{s}$, $L_{\min} = 4.0\,\text{m}$, $L_{\max} = 25.0\,\text{m}$).
2. **Curvature & Steering Geometry**:
   - Goal point $(g_x, g_z)$ sampled at distance $L_d$ along the edge spline.
   - Angle to goal point relative to vehicle heading: $\alpha = \text{atan2}(g_x - x, g_z - z) - \theta$.
   - Path curvature:
     $$\kappa = \frac{2 \sin\alpha}{L_d}$$
   - Yaw rate: $\dot{\theta} = v \cdot \kappa$.
   - Eliminates corner oscillation at high speed and corner cutting at 90-degree urban junctions.

---

### 3.4 Pedestrian AI, TTC Gap Acceptance & Bus Stops (Gap vs R4)

#### Current Implementation (`npc-ai.js: PedestrianAI`, `game_core.js: _upeds`)
- `PedestrianAI` checks vehicles with static threshold `dist < 10m` in `_isRoadClear()`.
- If a vehicle approaches $< 8\text{m}$, pedestrian enters `FLEEING` and picks an escape point `myPos + away * 10`.
- In `game_core.js: _upeds`, a separate loop independently animates and displaces `this.peds`, causing conflicting positions with `PedestrianAI`.
- Bus stops dock for 5–9s and spawn visual passenger meshes with basic linear walking.

#### Technical Gaps & Upgrade Requirements (R4)
1. **Time-To-Collision (TTC) Gap Acceptance**:
   - For an oncoming vehicle approaching crosswalk station with velocity $v_{\text{veh}}$ and longitudinal distance $d_{\text{long}}$:
     $$TTC = \frac{d_{\text{long}}}{\max(0.5, v_{\text{veh}})}$$
   - Pedestrian will only step into roadway if:
     $$TTC > TTC_{\text{safe}}$$
     ($TTC_{\text{safe}} = 3.5\text{s}$ for `rusher`, $5.0\text{s}$ for `normal`, $7.0\text{s}$ for `cautious`/`child`/`elderly`).
2. **Reactive Evasion & Fleeing**:
   - When vehicle approaches within critical threat zone ($TTC < 1.8\text{s}$ or distance $< 6\text{m}$), pedestrian accelerates at flee speed ($4.5\,\text{m/s}$) along a vector perpendicular to the vehicle's forward trajectory towards the nearest sidewalk curb.
3. **Unified Execution**:
   - Consolidate all pedestrian displacement inside `PedestrianAI.prototype.update`, while `_upeds(dt)` in `game_core.js` manages spawning and calls `ai.update(dt)`.

---

### 3.5 Mumbai Micro-Behaviors & Anti-Deadlock Resilience (Gap vs R5)

#### Current Implementation (`npc-ai.js`, `traffic-manager.js`)
- 2-Phase Watchdog:
  - Phase 1 (3.5s stall): sets `state = FOLLOW_LANE`, `_committedToIntersection = true`, nudges desired speed to 7 m/s.
  - Phase 2 (8.0s stall): if distance to player $>90\text{m}$, calls `_respawn()`; else forces lane nudge and continues.
- Rule Breakers:
  - `rule-breaker-profiles.js` contains 8 MTP-backed profiles (signal jumper, sidewalk rider, wrong sider, lane weaver, etc.).

#### Technical Gaps & Upgrade Requirements (R5)
1. **Micro-Lane Filtering & Gap Probing**:
   - Auto-rickshaws and two-wheelers (`bike`, `splendor`, `activa`, `ktm`) can utilize sub-lane lateral offsets ($\pm 0.8\text{m}$ from lane centerline) when lead vehicle is stopped or moving $< 3\,\text{m/s}$.
   - Two-wheelers filter between lanes to reach the front of the queue at red signals.
2. **Cascading Horn Audio Reactions**:
   - When a lead vehicle or player stops at a green light or blocks an intersection for $> 2.0\text{s}$, queued trailing vehicles trigger directional spatial honks with cascading delays ($0.3\text{s} - 0.7\text{s}$).
3. **Intersection Reservation Matrix**:
   - Junction nodes dynamically track vehicle arrival times. The first vehicle to reach within 12m of the node gains right-of-way; conflicting turns yield with IDM deceleration until intersection box is clear.
   - Guaranteed stall resolution within 3.5 seconds with zero teleportation artifacts.

---

## 4. Specific Function Signatures & Data Contracts

### 4.1 IDM & MOBIL Vehicle Parameters (`npc-ai.js`)

```javascript
// Complete vehicle physical and IDM configuration table
const VEHICLE_IDM_PARAMS = {
  car:        { v0: 13.89, T: 1.4, s0: 2.5, aMax: 2.2, b: 2.0, delta: 4, length: 4.2, width: 1.8,  bSafe: 3.0, p: 0.5 },
  wagonr:     { v0: 12.50, T: 1.5, s0: 2.2, aMax: 2.0, b: 2.0, delta: 4, length: 3.6, width: 1.6,  bSafe: 2.8, p: 0.4 },
  sedan:      { v0: 15.00, T: 1.3, s0: 2.5, aMax: 2.4, b: 2.2, delta: 4, length: 4.5, width: 1.8,  bSafe: 3.2, p: 0.5 },
  suv:        { v0: 14.00, T: 1.6, s0: 3.0, aMax: 2.0, b: 2.2, delta: 4, length: 4.8, width: 1.9,  bSafe: 3.0, p: 0.3 },
  creta:      { v0: 14.50, T: 1.4, s0: 2.8, aMax: 2.2, b: 2.2, delta: 4, length: 4.6, width: 1.85, bSafe: 3.2, p: 0.4 },
  innova:     { v0: 13.00, T: 1.8, s0: 3.2, aMax: 1.8, b: 2.0, delta: 4, length: 4.9, width: 1.9,  bSafe: 2.8, p: 0.4 },
  taxi:       { v0: 13.00, T: 1.1, s0: 1.8, aMax: 2.4, b: 2.4, delta: 4, length: 3.8, width: 1.65, bSafe: 3.8, p: 0.2 },
  auto:       { v0: 10.00, T: 1.0, s0: 1.5, aMax: 2.5, b: 2.5, delta: 4, length: 2.8, width: 1.3,  bSafe: 4.0, p: 0.15 },
  auto_yellow:{ v0: 10.00, T: 0.9, s0: 1.4, aMax: 2.6, b: 2.6, delta: 4, length: 2.8, width: 1.3,  bSafe: 4.2, p: 0.1 },
  bike:       { v0: 16.67, T: 0.8, s0: 1.2, aMax: 3.5, b: 3.0, delta: 4, length: 2.1, width: 0.8,  bSafe: 4.8, p: 0.1 },
  splendor:   { v0: 12.50, T: 0.9, s0: 1.2, aMax: 3.0, b: 2.8, delta: 4, length: 2.0, width: 0.8,  bSafe: 4.5, p: 0.15 },
  activa:     { v0: 11.11, T: 0.9, s0: 1.2, aMax: 2.8, b: 2.8, delta: 4, length: 1.9, width: 0.75, bSafe: 4.2, p: 0.2 },
  ktm:        { v0: 19.44, T: 0.7, s0: 1.0, aMax: 4.0, b: 3.5, delta: 4, length: 2.1, width: 0.8,  bSafe: 5.5, p: 0.05 },
  cycle:      { v0: 5.55,  T: 1.2, s0: 1.0, aMax: 1.5, b: 2.0, delta: 4, length: 1.8, width: 0.6,  bSafe: 2.5, p: 0.6 },
  bus:        { v0: 11.11, T: 2.0, s0: 4.5, aMax: 1.2, b: 1.5, delta: 4, length: 10.5,width: 2.6,  bSafe: 2.0, p: 0.4 },
  truck:      { v0: 10.00, T: 2.2, s0: 5.0, aMax: 1.0, b: 1.4, delta: 4, length: 9.0, width: 2.5,  bSafe: 1.8, p: 0.3 },
  ace:        { v0: 11.11, T: 1.5, s0: 2.5, aMax: 1.8, b: 1.8, delta: 4, length: 4.0, width: 1.6,  bSafe: 2.5, p: 0.35 },
  police:     { v0: 18.00, T: 1.0, s0: 2.0, aMax: 3.0, b: 2.8, delta: 4, length: 4.6, width: 1.9,  bSafe: 4.0, p: 0.2 },
  ambulance:  { v0: 20.00, T: 0.9, s0: 2.0, aMax: 3.2, b: 3.0, delta: 4, length: 5.2, width: 2.0,  bSafe: 4.5, p: 0.0 }
};
```

### 4.2 NPCAI Core Methods & Signatures

```javascript
class NPCAI {
  constructor(vehicle, roadGraph, trafficManager);

  // Main tick
  update(dt, playerVehicle, signals, pedestrians);

  // R1: IDM calculation
  computeIDM(v, v0, s, deltaV, params); // returns acceleration (m/s^2)
  getLeaderContext();                   // returns { leader, netDistance, deltaV }
  getVirtualObstacleContext(signals, crosswalks); // returns { obstacle, netDistance, deltaV }

  // R2: MOBIL decision
  evaluateMOBIL(dt);                    // returns { shouldChange: boolean, targetLane: number }
  getLaneFollower(edge, lane);          // returns { follower: Vehicle, distance: number }
  getLaneLeader(edge, lane);            // returns { leader: Vehicle, distance: number }

  // R3: Pure Pursuit tracking
  updatePurePursuitSteering(dt);        // updates vehicle.rotation.y and smooth lateral offset
  getLookaheadPoint(lookaheadDist);     // returns THREE.Vector3 on lane spline

  // R5: Mumbai micro-behaviors & watchdog
  updateFilteringAndProbing(dt);
  checkWatchdogStall(dt);
}
```

### 4.3 PedestrianAI Core Methods & Signatures

```javascript
class PedestrianAI {
  constructor(pedMesh, trafficManager);

  // Main tick
  update(dt, npcs, playerVehicle, signals);

  // R4: TTC evaluation
  evaluateTTC(approachingVehicles);     // returns { minTTC: number, threatVehicle: Vehicle, isSafe: boolean }
  computeFleeVector(threatVehicle);     // returns THREE.Vector3 pointing to safe curb
  updateCrossing(dt, isCrosswalk);
  updateJaywalking(dt);
  
  // Transit interaction
  dockAtBusStop(busStop);
  executeBoarding(busVehicle);
}
```

---

## 5. ThreePools Lifecycle Integration

All vector operations in inner loops (`computeIDM`, `evaluateMOBIL`, `updatePurePursuitSteering`, `evaluateTTC`) must utilize object pools from `ThreePools` (`ThreePools.getVec3()`, `ThreePools.releaseVec3(v)`) or pre-allocated scratch vectors (`this._v1`, `this._v2`, `this._forward`, `this._right`) to guarantee **zero garbage collection pressure** at 60 FPS across active 36-vehicle fleets.

When a vehicle is despawned via `TrafficManager._despawnVehicle(vehicle)`:
- `vehicle.npcAI` state is reset.
- `vehicle.speed = 0`, `vehicle.velocity.set(0, 0, 0)`.
- `_stuckTimer = 0`, `_stoppedSeconds = 0`, `_committedToIntersection = false`.
- Returned to `this.vehiclePools.get(type)` ready for clean reuse without state leakage.

---

## 6. Conclusion & Implementation Readiness

The Vanilla JS stack in `Traffic/` has clear isolation, clean entry points, and high compatibility with the proposed R1–R5 mathematical models. The existing codebase is fully mapped and ready for systematic implementation.
