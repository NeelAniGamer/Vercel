# Project: Traffic Driving Simulator NPC Traffic & Pedestrian AI Upgrade

## Architecture
The Traffic Driving Simulator operates across two parallel codebases:
1. **Vanilla JS Stack (Browser / Static HTML)**:
   - `npc-ai.js`: `NPCAI` class (longitudinal, lateral, trajectory tracking, micro-behaviors) and `PedestrianAI` class (TTC crosswalk/jaywalking, fleeing, bus stop boarding).
   - `traffic-manager.js`: `TrafficManager` class (platoon lifecycle, spatial hashing/grid lookups, vehicle pooling via `ThreePools`, deadlock watchdog coordination).
   - `road-graph.js`: `RoadGraph`, `RoadNode`, `RoadEdge` (lane splines, junction connectivity, pathfinding).
   - `game_core.js`: Game loop, physics integration, Three.js r128 scene, HUD violation tracking, audio horn triggers, and legacy pedestrian delegator (`_upeds`).
   - `pools.js`: `ThreePools` object recycling for zero-GC gameplay.
2. **TypeScript + Vite Stack (`Traffic/src/`)**:
   - `src/systems/NPCAI.ts`: TypeScript implementations of `NPCAI` and `PedestrianAI` with strict typing and ES modules.
   - `src/systems/TrafficManager.ts`: TypeScript `TrafficManager` managing active vehicles and pedestrians.
   - `src/systems/RoadGraph.ts`: TypeScript graph model with lane splines and path search.
   - `src/engine/GameEngine.ts`: Game loop and physics update integration.
3. **E2E & Math Verification Suite**:
   - `test_ai_math.js`: Fast headless Node unit test harness verifying mathematical invariants for IDM, MOBIL, Pure Pursuit, and TTC calculus.
   - `test_simulation_ai.js`: Playwright browser-in-the-loop simulation test harness running headless Chromium against local HTTP server on port 3848, verifying multi-agent interactions, deadlock resolution, queue compression, and 60 FPS performance.

---

## Feature Inventory

Every feature from user requirements and the survey phase is cataloged and assigned to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | IDM Dynamic Desired Headway ($s^*$) | Calculate $s^*(v, \Delta v) = s_0 + v T + \frac{v \Delta v}{2\sqrt{a_{\max} b}}$ dynamically | M2 | ORIGINAL_REQUEST §R1 |
| 2 | IDM Continuous Acceleration ($a$) | Implement $a = a_{\max} [1 - (v/v_0)^\delta - (s^*/s)^2]$ with bounded jerk and no speed snaps | M2 | ORIGINAL_REQUEST §R1 |
| 3 | Virtual Obstacle Deceleration | Smooth braking curves behind red signals, crosswalk yield lines, and stop lines | M2 | ORIGINAL_REQUEST §R1 |
| 4 | Queue Compression & Expansion | Stable stationary queue headway ($s \ge s_0$) without vehicle overlap | M2 | ORIGINAL_REQUEST §R1 |
| 5 | MOBIL Safety Criterion ($\tilde{a}_n$) | Enforce follower deceleration threshold $\tilde{a}_n \ge -b_{\text{safe}}$ before lane changes | M3 | ORIGINAL_REQUEST §R2 |
| 6 | MOBIL Incentive Criterion & Politeness ($p$) | Evaluate $(\tilde{a}_c - a_c) + p[(\tilde{a}_n - a_n) + (\tilde{a}_o - a_o)] > \Delta a_{\text{th}} + a_{\text{bias}}$ | M3 | ORIGINAL_REQUEST §R2 |
| 7 | Multi-Lane Overtaking & Return | Enable passing on 3+ lane roadways with cooperative merging and return-to-lane | M3 | ORIGINAL_REQUEST §R2 |
| 8 | Adaptive Pure Pursuit ($L_d$) | Dynamically scale look-ahead distance $L_d = \text{clamp}(k_{\text{look}} \cdot v, L_{\min}, L_{\max})$ | M4 | ORIGINAL_REQUEST §R3 |
| 9 | Curvature Steering & Smooth Yaw Rate | Steering curvature $\kappa = \frac{2\sin\alpha}{L_d}$, smooth yaw rate $\dot{\theta} = v \cdot \kappa$, no 90° corner clipping | M4 | ORIGINAL_REQUEST §R3 |
| 10 | Exponential Lane Centering | Smooth lateral convergence without steering wobble or trajectory oscillation | M4 | ORIGINAL_REQUEST §R3 |
| 11 | Pedestrian TTC Gap Acceptance | Compute $t_{\text{TTC}} = d_{\text{long}} / \max(0.5, v_{\text{approach}})$ for crosswalks & jaywalking | M5 | ORIGINAL_REQUEST §R4 |
| 12 | Reactive Pedestrian Evasion & Fleeing | Trigger evasive fleeing at $1.8\times v_{\text{walk}}$ when vehicle enters danger zone | M5 | ORIGINAL_REQUEST §R4 |
| 13 | Bus Stop Passenger Boarding Cycles | Animated spawn, waiting queue, boarding, and alighting sequences for transit | M5 | ORIGINAL_REQUEST §R4 |
| 14 | Auto-Rickshaw Gap Probing | Aggressive lateral exploratory probing into forward traffic gaps | M6 | ORIGINAL_REQUEST §R5 |
| 15 | Two-Wheeler / Bike Lane Filtering | Sub-lane shoulder and seam filtering through stopped or slow traffic | M6 | ORIGINAL_REQUEST §R5 |
| 16 | Cascading Horn Reactions | Spatial horn propagation triggering mild deceleration and defensive lane clearing | M6 | ORIGINAL_REQUEST §R5 |
| 17 | 2-Phase Anti-Deadlock Watchdog | 3.5s nudge / 8.0s recycle resolving all 4-way intersection gridlocks $\le 3.5\text{s}$ | M6 | ORIGINAL_REQUEST §R5 |
| 18 | Three.js r128 / ThreePools / HUD Compatibility | Full integration with existing object pools, safezone HUD, and 60 FPS performance | M6 | ORIGINAL_REQUEST §R5 |
| 19 | Dual-Stack TypeScript Parity | Complete parity across `Traffic/src/systems/NPCAI.ts`, `TrafficManager.ts`, `RoadGraph.ts` with passing typecheck & web build | M2, M3, M4, M5, M6 | ORIGINAL_REQUEST |
| 20 | Comprehensive 4-Tier & 5-Tier Verification | 100% pass across Tiers 1-4 tests followed by Tier 5 adversarial coverage hardening | M1, M7 | ORIGINAL_REQUEST §Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | E2E Testing Suite & Math Verification Harness | Create `TEST_INFRA.md`, headless Node unit test harness `test_ai_math.js`, Playwright simulation harness `test_simulation_ai.js`, publish `TEST_READY.md` | none | DONE |
| M2 | IDM Longitudinal Physics & Virtual Obstacles | Implement continuous IDM math ($s^*, a$), virtual obstacles for red lights & crosswalks, queue compression in both Vanilla JS and TS stacks | M1 | DONE |
| M3 | MOBIL Lateral Lane Changing & Politeness | Implement MOBIL safety criterion, incentive equation, politeness $p$, multi-lane overtaking & return in both stacks | M2 | DONE |
| M4 | Adaptive Pure Pursuit & Spline Trajectory Tracking | Implement velocity-scaled lookahead $L_d(v)$, curvature steering $\kappa$, 90° turn smoothing, lane centering in both stacks | M2 | DONE |
| M5 | Pedestrian AI, TTC Jaywalking & Bus Stops | Implement TTC gap acceptance, reactive fleeing/evasion, bus stop passenger boarding cycles in both stacks | M2 | DONE |
| M6 | Mumbai Micro-Behaviors & Anti-Deadlock Resilience | Implement auto-rickshaw gap probing, bike filtering, cascading horns, 2-phase deadlock watchdog, ThreePools/HUD integration in both stacks | M3, M4, M5 | IN_PROGRESS |
| M7 | Final E2E Test Suite Pass (100%) & Adversarial Hardening | Verify 100% pass on Tiers 1-4, execute Tier 5 adversarial coverage audit and fix any uncovered edge cases | M6 | PLANNED |

---

## Interface Contracts

### 1. NPCAI (Vanilla JS & TypeScript)
- `NPCAI.update(dt: number, npcs: NPCVehicle[], playerVehicle?: Vehicle, trafficManager?: TrafficManager): void`
- `NPCAI.calculateIDMAcceleration(leadVehicle: NPCVehicle | null, distToLead: number, vLead: number, virtualObstacleDist?: number): number`
  - Returns: acceleration $a \in [-b_{\max}, a_{\max}]$ in $\text{m/s}^2$
- `NPCAI.evaluateMOBIL(candidateLanes: number[], trafficManager: TrafficManager): { shouldChange: boolean, targetLane: number }`
  - Returns: decision boolean and target lane index
- `NPCAI.computePurePursuitSteering(dt: number, lookaheadDist: number): { targetYaw: number, yawRate: number }`
- `NPCAI.triggerHorn(reason: string): void`
- `NPCAI.checkDeadlockWatchdog(dt: number): boolean`

### 2. PedestrianAI (Vanilla JS & TypeScript)
- `PedestrianAI.update(dt: number, npcs: NPCVehicle[], playerVehicle?: Vehicle): void`
- `PedestrianAI.evaluateTTC(oncomingVehicles: NPCVehicle[]): { safeToCross: boolean, minTTC: number }`
  - Returns: safeToCross boolean ($TTC \ge TTC_{\text{threshold}}$)
- `PedestrianAI.triggerFlee(threatPosition: THREE.Vector3): void`
- `PedestrianAI.handleBusStopLifecycle(busStop: BusStop, dt: number): void`

### 3. TrafficManager (Vanilla JS & TypeScript)
- `TrafficManager.update(dt: number): void`
- `TrafficManager.getVehiclesInRadius(pos: THREE.Vector3, radius: number): NPCVehicle[]`
- `TrafficManager.getVehiclesOnEdge(edgeId: string, lane?: number): NPCVehicle[]`
- `TrafficManager.handleDeadlockResolution(stalledVehicle: NPCVehicle): void`

---

## Code Layout

- **Vanilla JS Stack**:
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\npc-ai.js`: Core vehicle and pedestrian AI logic
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\traffic-manager.js`: Platoon management, spatial index, pooling
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\road-graph.js`: Road graph network and lane geometry
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\game_core.js`: Three.js scene, render loop, HUD integration
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\pools.js`: ThreePools object pooling
- **TypeScript Stack**:
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\src\systems\NPCAI.ts`: TypeScript `NPCAI` and `PedestrianAI`
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\src\systems\TrafficManager.ts`: TypeScript `TrafficManager`
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\src\systems\RoadGraph.ts`: TypeScript `RoadGraph`
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\src\engine\GameEngine.ts`: TypeScript `GameEngine`
- **Testing Infrastructure**:
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\TEST_INFRA.md`: Test suite architecture and methodology
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\TEST_READY.md`: Test suite readiness signal and catalog
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\test_ai_math.js`: Headless Node unit tests for IDM, MOBIL, Pure Pursuit, TTC
  - `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\test_simulation_ai.js`: Playwright browser-in-the-loop multi-agent E2E test harness
