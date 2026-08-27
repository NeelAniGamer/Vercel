# TypeScript Stack Survey & Architectural Analysis: NPC Traffic and Pedestrian AI Upgrade

**Author**: TypeScript Stack Explorer  
**Date**: 2026-08-26  
**Target Repository**: `Traffic/` (Vite + TypeScript + Electron stack: `src/`)  
**Parent Mission**: NPC Traffic and Pedestrian AI Upgrade (R1–R5)  

---

## Executive Summary

This document presents the complete architectural mapping, comparative analysis (TS vs. Vanilla JS), requirement gap analysis, and implementation blueprint for the TypeScript stack in the Traffic Driving Simulator.

The TS stack is built upon **Vite 5.3.0**, **TypeScript 5.5.0**, **Three.js 0.170.0**, **Zustand 4.5.4**, and **Rapier 3D compat** (`@dimforge/rapier3d-compat`). It builds cleanly (`npm run build:web`, `npm run typecheck`), but currently contains an older snapshot of the AI system (`src/systems/NPCAI.ts`, `src/systems/TrafficManager.ts`) marked with `// @ts-nocheck` and utilizing simplistic heuristic physics (linear acceleration steps, step speed cuts, crude proximity bounding boxes, no TTC calculation, and no game-theoretic lane changes).

Upgrading the TS stack requires introducing:
1. **Intelligent Driver Model (IDM)** continuous longitudinal physics for all NPC vehicles and virtual obstacles.
2. **MOBIL (Minimizing Overall Braking Induced by Lane changes)** game-theoretic multi-lane decision making with safety and politeness criteria.
3. **Adaptive Pure Pursuit** trajectory tracking with speed-scaled look-ahead distance ($L_d$) and curvature steering.
4. **Time-To-Collision (TTC) Pedestrian Dynamics** with crosswalk gap acceptance, jaywalking risk evaluation, reactive evasion, and bus stop boarding/alighting animations.
5. **Mumbai Micro-Behaviors & 2-Phase Anti-Deadlock Watchdog** (auto gap probing, bike lane filtering, cascading horn reactions, and $<3.5\text{s}$ deadlock resolution).

---

## 1. Existing TypeScript Architecture

### 1.1 Technology Stack & Build Tooling
- **Directory Layout**:
  - `Traffic/src/` — Main source tree
  - `Traffic/src/engine/` — Core game engine, input, physics, renderer
  - `Traffic/src/systems/` — Subsystems: NPCAI, TrafficManager, RoadGraph, Pools, RenderCore, SafeZoneUI, MissionManager, GameplayRecorder, WorldStreamer
  - `Traffic/src/game/` — Level and course configurations, rule-breaker profiles, 2D scenario bridge
  - `Traffic/src/state/` — Zustand persistent store (`store.ts`)
  - `Traffic/src/materials/` & `Traffic/src/shaders/` — Custom GLSL shaders and Three.js ShaderMaterials
  - `Traffic/src/assets/` — GLTF/DRACO/KTX2 asset loaders
  - `Traffic/src/platform/` — Web vs. Electron platform abstraction
- **Build Scripts** (defined in `package.json`):
  - `npm run typecheck` $\rightarrow$ `tsc --noEmit` (clean exit code 0)
  - `npm run build:web` $\rightarrow$ `tsc --noEmit && vite build --mode web` (outputs to `dist-web/`)
  - `npm run build:electron` $\rightarrow$ `tsc --noEmit && vite build --mode electron && node build-electron.js && electron-builder`
- **Compiler Configuration (`tsconfig.json`)**:
  - Target: `ES2020`, Module: `ESNext`, Resolution: `bundler`, `strict: false`, `skipLibCheck: true`, `noEmit: true`, `allowJs: true`.
  - Path Aliases: `@/*`, `@engine/*`, `@systems/*`, `@game/*`, `@ui/*`, `@state/*`.

### 1.2 Class Hierarchy & Module Roles

```
                     ┌───────────────────────┐
                     │     Game (Engine)     │
                     └───────────┬───────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Renderer   │         │ InputManager │         │  ThreePools  │
└───────┬──────┘         └──────────────┘         └──────────────┘
        │
        ▼
┌──────────────┐
│  RenderCore  │
└──────────────┘

                     ┌───────────────────────┐
                     │    TrafficManager     │
                     └───────────┬───────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  RoadGraph   │◄───────┤    NPCAI     │         │ PedestrianAI │
│ (Nodes/Edges)│         │ (Vehicle AI) │         │ (Pedestrians)│
└──────────────┘         └──────────────┘         └──────────────┘
```

#### Detailed Class Specifications:

| Class | Source File | Key Responsibilities | Current Limitations |
|---|---|---|---|
| `NPCAI` | `src/systems/NPCAI.ts:63` | Per-vehicle state machine (`IDLE`, `FOLLOW_LANE`, `OVERTAKE`, `WAIT_SIGNAL`, etc.), speed selection, steering, physics application. | Step acceleration physics, binary braking, crude distance-only overtake, per-frame speed jitter, lacks 3+ lane support. |
| `PedestrianAI` | `src/systems/NPCAI.ts:790` | Pedestrian state machine (`WALKING`, `WAITING`, `CROSSING`, `JAYWALKING`, `FLEEING`, `FROZEN`). | Static 10m proximity check, no TTC math, no speed awareness of oncoming cars, lacks bus passenger lifecycle. |
| `TrafficManager` | `src/systems/TrafficManager.ts:76` | NPC lifecycle management, pooling (`vehiclePools`), dynamic density scaling, signal pressure accumulation, platoons, spatial edge vehicle map. | Needs spatial caching for faster neighbor queries, needs deadlock coordination hooks. |
| `RoadGraph` | `src/systems/RoadGraph.ts:206` | Road network representation (`RoadNode`, `RoadEdge`, `RoadSegment`, `BuildingSlot`), A* pathfinding (`findPath`), lane offset calculation. | Edge lane centers are straight linear interpolations; needs curvature look-ahead support. |
| `ThreePools` | `src/systems/Pools.ts:142` | Pre-warmed object pools for `Vector3`, `Matrix4`, `Box3`, `Mesh`, `Group`, `Vehicle`, `Pedestrian`. | Highly performant, ready for zero-GC AI updates. |
| `PacejkaModel` / `VEHICLE_STATS` | `src/engine/Physics.ts:30` | Pacejka MF 5.2 tire parameters (mass, power, brake force, steer angle, tire B/C/D/E). | Calibrated vehicle parameters provide physical constraints for IDM $a_{\max}, b$. |

---

## 2. Comparative Analysis: TypeScript Stack vs. Vanilla JS Stack

| Subsystem / Feature | Vanilla JS Stack (`npc-ai.js`, `game_core.js`) | TypeScript Stack (`src/systems/NPCAI.ts`, `src/...`) | Parity Assessment & Action Needed |
|---|---|---|---|
| **Three.js Engine** | `r128` from CDN (`outputEncoding`) | `0.170.0` from npm (`outputColorSpace`) | Minor API differences (`SRGBColorSpace` vs `sRGBEncoding`). TS has full modern typing. |
| **Module System** | Classic `<script>` tags, globals on `window` | ES Modules with path aliases + legacy `window` exports | Maintain dual exports so TS modules can be tested standalone or integrated. |
| **Bus Stop State & Passengers** | `NPC_STATE.BUS_STOP` exists; spawns animated passenger groups at bus stops | Missing `BUS_STOP` in `NPC_STATE`; no passenger animations | Port bus stop detection, dwell timing, and passenger boarding/alighting cycles to TS. |
| **Anti-Deadlock Watchdog** | 2-phase stuck detection ($3.5\text{s}$ phase 1 nudge, $8.0\text{s}$ phase 2 unfreeze/recycle) | Missing or incomplete in TS | Implement robust 2-phase deadlock watchdog in TS. |
| **Speed Variance Stability** | `_speedVarianceOffset` cached on init to prevent per-frame jitter | Evaluates `Math.random()` on every frame in `_getTargetSpeed()` | Fix jitter by caching driver variance offset at construction. |
| **Yielding & Traffic Rules** | Has `NPC_STATE.YIELD`, narrow lateral filtering ($1.4\text{m}$), committed signal flag | Wide bounding box checks cause false braking across parallel lanes | Unify narrow lateral filtering and intersection commitment flags. |

---

## 3. Gap Analysis & Algorithmic Upgrade Specifications

### R1. Intelligent Driver Model (IDM) Longitudinal Physics

#### Existing Defect
In `src/systems/NPCAI.ts:719-733` (`_applyPhysics`), speed is adjusted via:
```typescript
const accel = this.vehicle.stats.accel * dt * 60;
const fric = this.vehicle.stats.fric;
if (this.currentSpeed < maxSpd) {
  this.currentSpeed = Math.min(maxSpd, this.currentSpeed + accel);
} else {
  this.currentSpeed = Math.max(maxSpd, this.currentSpeed * fric);
}
```
When an obstacle or red light is detected, `desiredSpeed` snaps immediately to 0, producing jarring velocity cuts.

#### Mathematical Upgrade Specification
Each vehicle updates its longitudinal acceleration $a_{\text{IDM}}$ via:
$$s^*(v, \Delta v) = s_0 + v T + \frac{v \cdot \Delta v}{2\sqrt{a_{\max} b}}$$
$$a = a_{\max} \left[ 1 - \left(\frac{v}{v_0}\right)^\delta - \left(\frac{s^*(v, \Delta v)}{s}\right)^2 \right]$$

Where:
- $v$: current vehicle speed ($\text{m/s}$).
- $v_0$: free-flow desired speed ($\text{m/s}$) from road speed limit and profile variance.
- $s$: net clearance to lead obstacle $= d_{\text{center}} - L_{\text{vehicle\_half}} - L_{\text{lead\_half}}$.
- $\Delta v = v - v_{\text{lead}}$: relative approach velocity.
- $s_0$: minimum jam distance ($2.0\text{m}$ for cars, $1.0\text{m}$ for bikes/autos, $3.5\text{m}$ for buses/trucks).
- $T$: safe time headway ($1.2\text{s} - 1.8\text{s}$ based on driver patience).
- $a_{\max}$: maximum comfortable acceleration ($1.8 - 2.8\text{ m/s}^2$).
- $b$: comfortable braking deceleration ($2.0 - 3.0\text{ m/s}^2$).
- $\delta$: acceleration exponent ($4$).

**Virtual Obstacle Mapping**:
- Red signals at distance $d_{\text{sig}}$: treated as stationary virtual leader with $v_{\text{lead}} = 0, s = d_{\text{sig}} - d_{\text{stop\_line}}$.
- Pedestrians crossing path ahead: treated as virtual obstacle with $v_{\text{lead}} = 0, s = d_{\text{ped}}$.

---

### R2. MOBIL Game-Theoretic Lateral Lane Changing

#### Existing Defect
In `src/systems/NPCAI.ts:443-466` (`_attemptOvertake` / `_isLaneClear`), lane changing only swaps binary lanes ($0 \leftrightarrow 1$) based on a static distance check with no acceleration calculation or follower safety validation.

#### Mathematical Upgrade Specification
For a vehicle considering a lane change from lane $c$ to target lane $t \in \{c - 1, c + 1\}$:

1. **Safety Criterion**:
   The new follower in target lane $\tilde{n}$ must not suffer deceleration worse than $-b_{\text{safe}}$:
   $$\tilde{a}_n \ge -b_{\text{safe}}$$
   where $b_{\text{safe}} = 3.5\text{ m/s}^2$.

2. **Incentive Criterion**:
   $$(\tilde{a}_c - a_c) + p \cdot \left[ (\tilde{a}_n - a_n) + (\tilde{a}_o - a_o) \right] > \Delta a_{\text{th}} + a_{\text{bias}}$$
   where:
   - $\tilde{a}_c - a_c$: own acceleration advantage in target lane.
   - $\tilde{a}_n - a_n$: impact on new follower in target lane.
   - $\tilde{a}_o - a_o$: relief on old follower in current lane.
   - $p$: driver politeness factor ($0.0 \le p \le 1.0$, e.g., $0.1$ for aggressive, $0.5$ for normal, $0.9$ for cautious).
   - $\Delta a_{\text{th}}$: hysteresis threshold ($0.2\text{ m/s}^2$) preventing rapid oscillation.
   - $a_{\text{bias}}$: lane-discipline bias (keeping left in Indian road standard, or overtaking on right).

---

### R3. Adaptive Pure Pursuit & Smooth Path Tracking

#### Existing Defect
`NPCAI.ts:412-441` steers towards the road node directly and uses an instantaneous yaw clamp `this.vehicle.rotation.y += clampedAngle`. This creates sharp pivoting at intersection corners and clipping over curbs.

#### Mathematical Upgrade Specification
1. **Dynamic Look-Ahead Distance**:
   $$L_d = \text{clamp}(k_{\text{look}} \cdot v, L_{\min}, L_{\max})$$
   - $k_{\text{look}} = 0.8\text{ s}$, $L_{\min} = 4.0\text{ m}$, $L_{\max} = 25.0\text{ m}$.

2. **Look-Ahead Point on Lane Spline**:
   Sample point $\mathbf{P}_{\text{look}} = (x_L, z_L)$ at distance $L_d$ along the active edge lane centerline.

3. **Curvature & Steering Angle**:
   Angle $\alpha$ between vehicle heading $\psi$ and look-ahead vector:
   $$\kappa = \frac{2 \sin \alpha}{L_d}, \quad \delta_{\text{steer}} = \arctan(\kappa \cdot L_{\text{wheelbase}})$$
   $$\frac{d\psi}{dt} = \frac{v}{L_{\text{wheelbase}}} \tan(\delta_{\text{steer}})$$

4. **Smooth Cross-Track Convergence**:
   Lateral offset $e_{\text{lat}}$ to lane centerline smoothly blends into steering command without discontinuous position snapping.

---

### R4. Pedestrian Dynamics & TTC Jaywalking

#### Existing Defect
`src/systems/NPCAI.ts:854-877` (`_updateWaiting`) checks `_isRoadClear` with a static 10m radius. Faster vehicles run over pedestrians before they can cross. Bus passenger cycles are absent.

#### Mathematical Upgrade Specification
1. **Time-To-Collision (TTC)**:
   For each approaching vehicle with longitudinal distance $d_{\text{long}} > 0$ and velocity $v_{\text{approach}} > 0.5\text{ m/s}$:
   $$t_{\text{TTC}} = \frac{d_{\text{long}}}{v_{\text{approach}}}$$
   Required crossing time:
   $$t_{\text{cross}} = \frac{W_{\text{road}}}{v_{\text{ped\_speed}}}$$

2. **Gap Acceptance**:
   Pedestrian initiates crossing if and only if for all approaching vehicles:
   $$t_{\text{TTC}} > t_{\text{cross}} + t_{\text{safety\_margin}}$$
   - Normal/Cautious pedestrians: $t_{\text{safety\_margin}} = 3.0 - 4.5\text{s}$.
   - Aggressive/Rusher/Jaywalker pedestrians: $t_{\text{safety\_margin}} = 1.5 - 2.5\text{s}$.

3. **Reactive Evasion / Fleeing**:
   If an oncoming vehicle or player accelerates or enters path with $t_{\text{TTC}} < 2.0\text{s}$ while pedestrian is on the road, pedestrian switches to `FLEEING` state (sprinting at $1.8 \times$ speed orthogonally to vehicle heading or retreating to curb).

4. **Bus Stop Passenger Lifecycle**:
   - When a bus enters `BUS_STOP` state, spawn alighting (1–3) and boarding (2–4) passenger meshes.
   - Animate passengers moving between bus door and sidewalk curb with bobbing.
   - Despawn passengers before bus resumes driving.

---

### R5. Mumbai Micro-Behaviors & Anti-Deadlock Resilience

1. **Auto-Rickshaw Gap Probing**:
   - Auto-rickshaws have smaller effective width ($1.4\text{m}$ vs $2.0\text{m}$ for cars) and higher lateral maneuverability.
   - When queue speed $< 4\text{ m/s}$, autos evaluate narrow lateral gaps between stopped vehicles and filter forward.

2. **Bike Lane Filtering**:
   - Two-wheelers (`bike`, `reckless_bike`) utilize curb space and lane dividers when traffic speed $< 3\text{ m/s}$, advancing to the front of signal queues.

3. **Cascading Horn Reactions**:
   - When an aggressive driver or player honks within $25\text{m}$, low-patience NPCs (`aggressive`, `rulebreaker`, `delivery`) trigger a delayed ($0.2 - 0.5\text{s}$) cascading horn and high-beam flash.

4. **2-Phase Anti-Deadlock Watchdog**:
   - **Phase 1 ($3.5\text{s}$ stagnation)**: Detect intersection right-of-way deadlock. The vehicle with higher route progress or smaller ID is awarded yield priority; the conflicting vehicle enters `YIELD` state for $1.5\text{s}$; lateral micro-nudge applied.
   - **Phase 2 ($8.0\text{s}$ persistent stall)**: If off-screen ($> 90\text{m}$ from player), quietly recycle to pool; if near player, commit through intersection at crawl speed ($4\text{ m/s}$) to guarantee zero permanent freeze.

---

## 4. TypeScript Typing & Interface Architecture Blueprint

To ensure compile-time type safety across the upgraded AI systems, the following TypeScript interfaces and data structures should be established in `src/systems/NPCAI.ts` and related files:

```typescript
// IDM Configuration and Runtime State
export interface IDMParameters {
  desiredSpeed: number;       // v0 (m/s)
  freeAccExponent: number;    // delta (typically 4)
  desiredTimeHeadway: number; // T (seconds, e.g. 1.2s)
  minDistance: number;        // s0 (meters, e.g. 2.0m)
  maxAcceleration: number;    // a (m/s^2, e.g. 2.0m/s^2)
  comfortableBraking: number; // b (m/s^2, e.g. 2.5m/s^2)
}

// MOBIL Configuration
export interface MOBILParameters {
  politeness: number;         // p (0.0 to 1.0)
  safeDeceleration: number;   // b_safe (e.g. 3.5 m/s^2)
  thresholdAccel: number;     // delta_a_th (e.g. 0.2 m/s^2)
  biasRight: number;          // lane discipline bias
}

// Pure Pursuit Configuration
export interface PurePursuitController {
  minLookAhead: number;       // L_min (meters, e.g. 4.0m)
  maxLookAhead: number;       // L_max (meters, e.g. 25.0m)
  lookAheadGain: number;      // k_look (seconds, e.g. 0.8s)
  wheelBase: number;          // L (meters, e.g. 2.7m)
}

// Pedestrian TTC Assessment
export interface TTCEvaluation {
  minTTC: number;             // Minimum time to collision in seconds
  criticalVehicle: any | null;// Threat vehicle reference
  isSafeToCross: boolean;     // Whether gap exceeds crossing threshold
  evasionRequired: boolean;   // Whether immediate flee action is needed
}

// Bus Stop Passenger Group
export interface BusPassenger {
  mesh: THREE.Group;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  progress: number;
  duration: number;
  isBoarding: boolean;
}
```

---

## 5. Verification & Testing Strategy

1. **Static Analysis & Type Checking**:
   - `npm run typecheck` (`tsc --noEmit`) must succeed with zero errors.
2. **Web Bundle Build**:
   - `npm run build:web` must complete bundle compilation and minify assets into `dist-web/` without Rollup or Vite errors.
3. **Simulated Stress Testing**:
   - Test active load of 24–36 vehicles and 30 pedestrians in high-density levels (e.g., Level 5 "Rush Hour Gauntlet", Level 53 "City Sandbox").
   - Verify 60 FPS performance, zero memory leaks (ThreePools recycling), zero intersection deadlocks ($<3.5\text{s}$ resolution), and smooth IDM deceleration curves behind traffic lights and pedestrian crossings.

---
*End of TypeScript Architectural Survey & Analysis Report.*
