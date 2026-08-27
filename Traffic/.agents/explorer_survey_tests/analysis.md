# Traffic Driving Simulator NPC Traffic & Pedestrian AI Upgrade
## Test & Verification Architecture & Strategy Analysis Report

**Date:** 2026-08-26  
**Explorer Archetype:** Test & Verification Explorer  
**Target Repository:** `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic`  
**Referenced Authoritative Documents:** `ORIGINAL_REQUEST.md`, `Traffic/AGENTS.md`, `Vercel/AGENTS.md`

---

## 1. Executive Summary & Problem Scope

The Mumbai Traffic Driving Simulator is undergoing an architectural upgrade to its NPC Traffic and Pedestrian AI systems across both of its stacks:
1. **Vanilla JS Stack:** `Driving.html`, `Academy.html`, `game_core.js`, `npc-ai.js`, `traffic-manager.js`, `road-graph.js`, `rule-breaker-profiles.js`.
2. **TypeScript / Vite / Electron Stack:** `src/systems/NPCAI.ts`, `src/systems/TrafficManager.ts`, `src/systems/RoadGraph.ts`, `src/game/RuleBreakerProfiles.ts`.

### Current State vs. Required Upgraded State
| Subsystem | Current Baseline Architecture | Target AI Upgrade Requirements | Verification Requirement |
| :--- | :--- | :--- | :--- |
| **Longitudinal Physics** | Stepwise heuristic speed clamping (`currentSpeed *= 0.7`, `desiredSpeed = min(...)`), linear friction, sudden speed drops. | Continuous Intelligent Driver Model (IDM) with dynamic desired headway $s^*(v, \Delta v)$ and continuous acceleration $a(v, s, \Delta v)$. | Zero instantaneous velocity snaps; bounded jerk ($|da/dt| \le 10 m/s^3$); natural queue compression ($s \ge s_0 > 0$). |
| **Lateral Lane Changes** | Hardcoded target lane flip (`lane === 0 ? 1 : 0`), fixed distance raycasts (`toV.dot(forward) > -8 && < 32`), randomized triggers. | MOBIL (Minimizing Overall Braking Induced by Lane changes) algorithm evaluating target follower deceleration and driver politeness factor $p$. | Safety criterion ($\tilde{a}_n \ge -b_{\text{safe}}$) 100% enforced; politeness sensitivity ($p \in [0, 1]$); keep-left bias. |
| **Trajectory Tracking** | Linear waypoint interpolation with discrete rotation snapping (`clamp(diff, -maxTurn, maxTurn)`) causing corner wobble in 90° turns. | Adaptive Pure Pursuit with dynamic look-ahead ($L_d = \max(L_{\min}, k_{\text{look}} \cdot v)$) and continuous spline steering. | Lateral tracking error $< 0.4m$ through 90° intersection turns; zero curb/sidewalk clipping; smooth heading rate. |
| **Pedestrians & Transit** | Simple distance threshold checks (`dist < 10m`), random angle generation, basic fleeing without velocity projection. | Time-To-Collision (TTC) gap acceptance across road width; reactive fleeing perpendicular to vehicle approach corridor; bus boarding sequences. | Safe crossing initiation only when $\min(\text{TTC}) > \text{TTC}_{\text{safe}}$; fleeing triggers when $\text{TTC} < 2.2s$; complete bus passenger state cycle. |
| **Gridlock & Deadlocks** | Heuristic timer-based position checks (`_stuckTimer >= 3.5s`, `moved < 0.8m`). | 2-phase deterministic arbitration watchdog with priority resolution under 3.5 seconds and zero permanent stalls. | 4-way simultaneous intersection arrival resolves in $\le 3.5s$; zero permanent freezes across 10-minute runs. |
| **Performance** | Basic object pooling via `ThreePools`. | High-density traffic (24–36 active vehicles + 15–25 pedestrians) sustaining 60 FPS. | Frame time $\le 16.67 ms$; AI update execution time $\le 2.5 ms$; 0 per-frame heap allocations in update loop. |

---

## 2. Test Infrastructure & Dual-Stack Execution Feasibility

Our investigation revealed three complementary testing execution layers available in the existing environment:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 AUTOMATED TEST HARNESS                                   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  Layer 1: Headless Node Math & Unit Test Suite (< 2 sec)                                 │
│  - Executes pure IDM, MOBIL, Pure Pursuit, TTC math directly in Node.js v26              │
│  - Zero browser overhead; mathematical invariant proofs; 100% deterministic              │
│                                                                                          │
│  Layer 2: Browser-in-the-Loop Simulation Harness (Playwright + Local HTTP Server)       │
│  - Spins up lightweight Node HTTP server on localhost:3848 (bypasses CORS for GLB/CDN)   │
│  - Launches headless Chromium via Playwright, loads Driving.html / Academy.html          │
│  - Injects test scenarios, captures frame-by-frame telemetry, asserts physics invariants │
│                                                                                          │
│  Layer 3: TypeScript Type Checking & Compilation Pipeline                                │
│  - `npm run typecheck` (`tsc --noEmit`) validates all TS types and system interfaces    │
│  - `npm run build:web` validates bundle production integrity                             │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: Headless Node Math & Unit Test Suite
- **Feasibility:** Verified. Node.js v26.3.0 is active. Existing tests (`test_road.js`, `test-roadgraph.js`) execute in **< 1.5 seconds** with zero external dependencies.
- **Pattern:** Using minimal math wrappers (or direct Three.js math classes), equations can be evaluated over thousands of parameter combinations in milliseconds.
- **Application:** Exact mathematical verification of IDM acceleration derivatives, MOBIL matrix evaluations, Pure Pursuit curvature calculations, and Pedestrian TTC tables.

### Layer 2: Browser-in-the-Loop Simulation Harness (Playwright)
- **Feasibility:** Verified. Existing `test_gameplay.js` demonstrates spinning up an internal HTTP server on port 3848 and controlling `Driving.html` via Playwright headless Chromium.
- **Critical Finding on CORS:** Direct `file:///` URLs (as seen in `pw_test.js`) trigger Chromium CORS errors (`origin 'null' has been blocked by CORS policy`) for GLB models and assets. Serving through the internal Node HTTP server completely resolves this.
- **Application:** Empirical multi-agent traffic testing, 4-way intersection gridlock resolution, FPS benchmarking with 38 active vehicles, bus stop passenger spawn/boarding cycles, and live violation tracking.

### Layer 3: TypeScript Pipeline
- **Feasibility:** Verified. `tsc --noEmit` runs cleanly with 0 errors (`The command exited with code 0`).
- **Application:** Type contract verification across `NPCAI.ts`, `TrafficManager.ts`, `RoadGraph.ts`, and `RuleBreakerProfiles.ts`.

---

## 3. Mathematical & Empirical Verification Framework

### R1. Intelligent Driver Model (IDM) Longitudinal Physics

#### Mathematical Formulation
The continuous longitudinal acceleration $a$ of an NPC vehicle is governed by:
$$a(v, s, \Delta v) = a_{\max} \left[ 1 - \left(\frac{v}{v_0}\right)^\delta - \left(\frac{s^*(v, \Delta v)}{s}\right)^2 \right]$$
where the dynamic desired gap $s^*$ is:
$$s^*(v, \Delta v) = s_0 + v T + \frac{v \Delta v}{2\sqrt{a_{\max} b}}$$

#### Parameter Calibration Matrix by Mumbai Vehicle Class
| Parameter | Description | Car / Taxi | Auto-Rickshaw | Motorbike / Scooter | Bus / Heavy Truck |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $v_0$ | Desired free speed | $13.9\text{ m/s } (50\text{ km/h})$ | $11.1\text{ m/s } (40\text{ km/h})$ | $16.7\text{ m/s } (60\text{ km/h})$ | $10.0\text{ m/s } (36\text{ km/h})$ |
| $T$ | Safe time headway | $1.4\text{ s}$ | $1.0\text{ s}$ | $0.8\text{ s}$ | $2.0\text{ s}$ |
| $s_0$ | Jam distance (min gap) | $2.5\text{ m}$ | $1.8\text{ m}$ | $1.2\text{ m}$ | $4.0\text{ m}$ |
| $a_{\max}$ | Max comfortable accel | $2.0\text{ m/s}^2$ | $1.8\text{ m/s}^2$ | $2.8\text{ m/s}^2$ | $1.2\text{ m/s}^2$ |
| $b$ | Comfortable decel | $2.0\text{ m/s}^2$ | $2.2\text{ m/s}^2$ | $2.5\text{ m/s}^2$ | $1.5\text{ m/s}^2$ |
| $\delta$ | Acceleration exponent | $4$ | $4$ | $4$ | $4$ |

#### Verification Proofs & Invariants
1. **Free Road Acceleration Limit:** For $s \to \infty$ and $v = 0$, $a = a_{\max}$. As $v \to v_0$, $a \to 0$. Acceleration monotonically decreases with speed: $\frac{\partial a}{\partial v} = -\frac{\delta a_{\max}}{v_0} \left(\frac{v}{v_0}\right)^{\delta - 1} < 0$.
2. **Equilibrium Car-Following:** When $v = v_{\text{lead}}$ ($\Delta v = 0$), $s = s^*(v, 0) = s_0 + v T \implies a = 0$.
3. **Emergency Deceleration Bound:** For sudden stationary obstacle ($\Delta v = v$, $s \to 0$), $a \to -\infty$ mathematically, but must be clamped in implementation to vehicle maximum friction limit $a_{\text{clamp}} \ge -g \cdot \mu_{\text{surface}}$ (e.g. $-8.0\text{ m/s}^2$ on dry asphalt).
4. **Jerk Continuity Invariant:** For all $\Delta t$, $|\frac{\Delta a}{\Delta t}| \le J_{\max} = 12\text{ m/s}^3$. Instantaneous discrete speed overwrites (`v = v * 0.7`) are strictly forbidden.
5. **Platoon Queue Compression Invariant:** A 5-vehicle platoon stopping at a red signal must settle such that for all adjacent pairs $i, i+1$:
   $$s_i(t_{\text{stop}}) \ge s_0 \quad \text{and} \quad s_i(t_{\text{stop}}) \le s_0 + 0.5\text{m}$$
   with zero vehicle bounding-box overlap.

---

### R2. MOBIL Game-Theoretic Lateral Lane Changing

#### Mathematical Formulation
Vehicle $c$ in lane $i$ evaluates a change to adjacent lane $j$.
- Let $a_c$, $\tilde{a}_c$ be ego vehicle acceleration before and after lane change.
- Let $a_n$, $\tilde{a}_n$ be the acceleration of the new follower in target lane $j$.
- Let $a_o$, $\tilde{a}_o$ be the acceleration of the old follower in current lane $i$.
- Let $p \in [0, 1]$ be the driver politeness factor.
- Let $b_{\text{safe}}$ be the maximum safe braking threshold (default $b_{\text{safe}} = 4.0\text{ m/s}^2$).
- Let $\Delta a_{\text{th}}$ be the switching threshold (hysteresis against lane ping-pong).
- Let $\Delta a_{\text{bias}}$ be the keep-left directional bias for Indian driving rules.

#### Decision Rules
1. **Safety Criterion (Hard Gate):**
   $$\tilde{a}_n \ge -b_{\text{safe}}$$
   If the proposed lane change would force the target lane follower to brake harder than $b_{\text{safe}}$, the change is immediately rejected.
2. **Incentive Criterion:**
   $$(\tilde{a}_c - a_c) + p \cdot \left[ (\tilde{a}_n - a_n) + (\tilde{a}_o - a_o) \right] > \Delta a_{\text{th}} \pm \Delta a_{\text{bias}}$$
   where $+\Delta a_{\text{bias}}$ applies when moving right (overtaking lane) and $-\Delta a_{\text{bias}}$ applies when returning to the left cruising lane.

#### Driver Profile Politeness & Threshold Matrix
| Profile Key | Archetype | Politeness ($p$) | $\Delta a_{\text{th}}$ | Keep-Left Bias ($\Delta a_{\text{bias}}$) | Safe Braking ($b_{\text{safe}}$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cautious` / `elderly` | Defensive | $1.0$ | $0.35\text{ m/s}^2$ | $0.20\text{ m/s}^2$ | $2.5\text{ m/s}^2$ |
| `normal` | Standard | $0.5$ | $0.20\text{ m/s}^2$ | $0.10\text{ m/s}^2$ | $4.0\text{ m/s}^2$ |
| `aggressive` / `teen` | Assertive | $0.15$ | $0.10\text{ m/s}^2$ | $0.05\text{ m/s}^2$ | $5.5\text{ m/s}^2$ |
| `reckless_bike` / `delivery` | Opportunistic | $0.0$ | $0.05\text{ m/s}^2$ | $0.00\text{ m/s}^2$ | $6.5\text{ m/s}^2$ |

#### Verification Invariants
- **Follower Protection:** In 10,000 randomized Monte Carlo gap insertion tests, target lane follower acceleration $\tilde{a}_n$ never drops below $-b_{\text{safe}}$.
- **No Ping-Pong Oscillations:** Lane change cooldown ($\ge 3.0\text{s}$) plus hysteresis $\Delta a_{\text{th}}$ guarantees zero double-lane switches within any 3-second window.

---

### R3. Adaptive Pure Pursuit & Smooth Path Tracking

#### Mathematical Formulation
The adaptive look-ahead distance $L_d$ scales continuously with velocity $v$:
$$L_d(v) = \max\left(L_{\min}, \min\left(L_{\max}, k_{\text{look}} \cdot v\right)\right)$$
where $L_{\min} = 3.5\text{ m}$, $L_{\max} = 20.0\text{ m}$, $k_{\text{look}} = 0.85\text{ s}$.

Given look-ahead point $(x_L, z_L)$ on the road graph lane spline in vehicle local coordinates, the steering curvature $\kappa$ and front wheel steer angle $\delta$ are:
$$\alpha = \arctan2(x_L, z_L) \implies \kappa = \frac{2 \sin\alpha}{L_d}$$
$$\delta = \arctan(\kappa \cdot L_{\text{wheelbase}})$$
Heading rate of change:
$$\dot{\psi} = \frac{v \cdot \tan\delta}{L_{\text{wheelbase}}}$$

#### Intersection Spline Smoothing
Sharp discrete 90° junction turns are replaced with cubic Bézier or Catmull-Rom lane transition splines with continuous second derivatives ($C^2$ continuity).

#### Verification Invariants
- **Sidewalk Clearance:** Vehicle bounding box minimum distance to curb $d_{\text{curb}} \ge 0.5\text{ m}$ throughout full 90° turn at rated speed ($v = 6.0\text{ m/s}$).
- **Lateral Tracking Accuracy:** Maximum cross-track error $e_{\text{lateral}} = |d_{\text{vehicle}} - d_{\text{lane\_center}}| \le 0.35\text{ m}$ on straight sections and $\le 0.60\text{ m}$ during junction transitions.
- **Zero Angular Oscillation:** Yaw rate derivative $|\ddot{\psi}| \le 2.5\text{ rad/s}^2$; damping ratio $\zeta \ge 0.707$ (critically damped or over-damped steering response).

---

### R4. Pedestrian Dynamics & TTC Jaywalking

#### Mathematical Formulation
For each approaching vehicle $v_i$ with position $\mathbf{p}_i$, forward unit vector $\mathbf{u}_i$, and speed $s_i$:
$$\mathbf{d}_i = \mathbf{p}_{\text{ped}} - \mathbf{p}_i$$
$$d_{\text{long}} = \mathbf{d}_i \cdot \mathbf{u}_i, \quad d_{\text{lat}} = |\mathbf{d}_i \times \mathbf{u}_i|$$
Time-To-Collision (TTC) is defined for oncoming vehicles ($d_{\text{long}} > 0$ and $d_{\text{lat}} \le \frac{w_{\text{lane}}}{2} + 1.5\text{m}$):
$$\text{TTC}_i = \frac{d_{\text{long}}}{s_i}$$

#### Gap Acceptance & Fleeing Criteria
1. **Crosswalk / Jaywalk Initiation:**
   $$\min_{i}(\text{TTC}_i) > \text{TTC}_{\text{safe}} \quad \text{where } \text{TTC}_{\text{safe}} = \frac{w_{\text{road}}}{v_{\text{walk}}} + t_{\text{margin}}$$
   where $t_{\text{margin}} = 2.5\text{ s}$ for cautious pedestrians, $1.2\text{ s}$ for rushers/jaywalkers.
2. **Reactive Fleeing:** If during crossing, $\text{TTC}_i < 2.2\text{ s}$ and $d_{\text{long}} < 10.0\text{ m}$, pedestrian transitions to `FLEEING` state:
   - Speed boosted to $v_{\text{flee}} = 1.8 \cdot v_{\text{walk}}$ (up to $5.5\text{ m/s}$).
   - Escape vector directed perpendicular to vehicle heading towards nearest sidewalk curb.
3. **Bus Stop Transit Loop:**
   $$\text{WAITING\_FOR\_BUS} \xrightarrow{\text{Bus docked \& doors open}} \text{BOARDING (step queue)} \xrightarrow{\text{Bus departs}} \text{IN\_TRANSIT}$$
   $$\text{IN\_TRANSIT} \xrightarrow{\text{Arrive target stop}} \text{ALIGHTING} \xrightarrow{\text{Clear platform}} \text{WALKING\_SIDEWALK}$$

#### Verification Invariants
- **Zero Collision at Safe Gap:** No pedestrian crossing initiated under $\text{TTC} > \text{TTC}_{\text{safe}}$ results in vehicle emergency braking ($a < -2.5\text{ m/s}^2$).
- **Fleeing Reaction Latency:** Transition from `CROSSING` to `FLEEING` occurs within 1 simulation tick ($dt \le 0.033\text{ s}$) upon condition breach.

---

### R5. Mumbai Micro-Behaviors & Anti-Deadlock Resilience

#### Micro-Behavior Math
1. **Auto-Rickshaw & Bike Gap Probing (Lane Filtering):**
   When vehicle queue speed $< 1.5\text{ m/s}$, auto-rickshaws and bikes assess half-lane lateral offsets:
   $$\text{Offset} = \pm \frac{w_{\text{lane}}}{4}$$
   If forward corridor of width $1.4\text{ m}$ is clear for $\ge 8.0\text{ m}$, vehicle filters forward at crawl speed ($v \approx 2.5\text{ m/s}$).
2. **Cascading Horn Reactions:**
   When lead vehicle honks ($E_{\text{horn}}$), adjacent NPCs within radius $R = 15\text{ m}$ evaluate reaction probability:
   $$P_{\text{cascade}} = \text{profile.aggression} \times 0.65$$
   with delayed trigger $\Delta t_{\text{horn}} \in [0.25\text{ s}, 0.60\text{ s}]$.

#### 2-Phase Anti-Deadlock Watchdog Specification
- **Phase 1: Soft Dynamic Arbitration ($t_{\text{stuck}} \ge 3.5\text{ s}$):**
  When 2 or more vehicles are stopped at an uncontrolled intersection:
  1. Determine highest-priority vehicle using deterministic token:
     $$\text{PriorityScore} = (\text{ArrivalTime}) + (\text{VehicleMassWeight}) + (\text{AggressionBias})$$
  2. Winner receives temporary right-of-way reservation (`_priorityOverride = true`).
  3. Yielding vehicles set IDM virtual stop line 2m back.
  4. Winner proceeds through junction.
- **Phase 2: Hard Recycling ($t_{\text{stuck}} \ge 8.0\text{ s}$):**
  If player distance $d_{\text{player}} > 80\text{ m}$, despawn to `ThreePools`. If $d_{\text{player}} \le 80\text{ m}$, smoothly re-route onto perpendicular egress edge without visual pop.

#### Verification Invariant
- **3.5-Second Intersection Clearance:** In 100 trials of 4-way simultaneous arrival gridlock, all intersections resolve motion for at least one vehicle within $3.50\text{ s}$, with complete junction clearance in $\le 6.0\text{ s}$.

---

### R6. Performance Benchmarks & Frame Budget

#### Invariant Budgets
| Metric | Threshold Limit | Measurement Method |
| :--- | :--- | :--- |
| **FPS (Active Load: 24–36 Vehicles + 15–25 Peds)** | $\ge 58\text{ FPS}$ sustained (Target 60 FPS) | Playwright `requestAnimationFrame` timing over 1,000 frames |
| **AI Update CPU Time** | $\le 2.50\text{ ms}$ per frame total | `performance.now()` delta across `trafficManager.update()` |
| **Garbage Collection / Memory Allocation** | $0\text{ byte}$ per-frame dynamic allocations | `ThreePools` allocation tracker; Playwright heap snapshot delta |
| **Watchdog CPU Overhead** | $\le 0.15\text{ ms}$ per frame | Spatial hashing bucket query overhead benchmark |

---

## 4. 4-Tier Test Case Suite Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               4-TIER TEST CASE SUITE STRUCTURE                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  TIER 1: FEATURE COVERAGE (Unit Math & Equation Invariants)                                      │
│  - T1.1 to T1.8: IDM Longitudinal Equation & Headway Calculus                                   │
│  - T1.9 to T1.16: MOBIL Safety & Incentive Calculations Across Politeness Matrix                  │
│  - T1.17 to T1.20: Adaptive Pure Pursuit Curvature & Look-Ahead Scaling                          │
│  - T1.21 to T1.24: Pedestrian TTC & Bus Transit State Machine Transitions                        │
│                                                                                                  │
│  TIER 2: BOUNDARY & CORNER CONDITIONS (Extreme Inputs & Edge Cases)                              │
│  - T2.1 to T2.6: Zero-Gap Cut-Ins, Sudden Obstacle Halts, Negative Delta-V                       │
│  - T2.7 to T2.12: Sharp 90° Turn Max Velocity, Single-Lane Overtake Rejections                   │
│  - T2.13 to T2.18: Low Friction (Monsoon Wet Asphalt), High-Speed Pedestrian Jaywalk Encounters  │
│                                                                                                  │
│  TIER 3: COMBINATORIAL & MULTI-AGENT SCENARIOS (Interaction Dynamics)                            │
│  - T3.1 to T3.4: 10-Vehicle Platoon String Stability & Deceleration Waves                        │
│  - T3.5 to T3.8: Multi-Lane Merge & Weaving (Mixed Autos, Cars, Buses)                           │
│  - T3.9 to T3.11: 4-Way Symmetric Gridlock & Watchdog Arbitration                                │
│  - T3.12 to T3.14: Bus Docking with Following MOBIL Overtake Stream & Pedestrian Crossings       │
│                                                                                                  │
│  TIER 4: REAL-WORLD MUMBAI SCENARIOS (Full E2E Browser-in-the-Loop Simulation)                   │
│  - T4.1: Marine Drive Arterial High-Density Corridor (36 vehicles, 60 FPS)                        │
│  - T4.2: Dadar / Chawl Dense Market Gridlock with Jaywalkers & Bike Filtering                    │
│  - T4.3: BEST Bus Route 53 with 4 Timed Bus Stops & Passenger Exchanges                          │
│  - T4.4: Monsoon Downpour Handling (Friction $\mu = 0.55$, Adjusted IDM Headway)                 │
│  - T4.5: 10-Minute Endurance & Memory Leak Free Run (0 Deadlocks, 0 Leaks)                       │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Test Specifications

#### Tier 1: Feature Coverage
- **TC-1.1 (IDM Free Road):** Verify $a(0, \infty, 0) = a_{\max}$ and $a(v_0, \infty, 0) = 0$.
- **TC-1.2 (IDM Equilibrium):** Verify $a(v, s_0 + v T, 0) = 0$ for $v \in [2, 18]\text{ m/s}$.
- **TC-1.3 (IDM Dynamic Headway):** Verify $s^*(v, \Delta v)$ increases monotonically with approaching speed $\Delta v > 0$.
- **TC-1.4 (IDM Deceleration Derivative):** Verify jerk $\frac{da}{dt}$ is strictly continuous during braking behind stationary obstacle.
- **TC-1.5 (MOBIL Safety Gate):** Assert lane change is rejected when proposed $\tilde{a}_n < -b_{\text{safe}}$.
- **TC-1.6 (MOBIL Politeness Range):** Verify selfish driver ($p=0$) changes lanes solely on ego benefit $(\tilde{a}_c - a_c) > \Delta a_{\text{th}}$, while altruistic driver ($p=1$) requires collective network benefit.
- **TC-1.7 (MOBIL Keep-Left Bias):** Assert vehicle returns to left lane when left and right lane speeds are identical.
- **TC-1.8 (Pure Pursuit Look-Ahead):** Verify $L_d(v)$ scales linearly from $L_{\min}$ to $L_{\max}$ and clamps at bounds.
- **TC-1.9 (Pure Pursuit Curvature):** Verify steer angle $\delta \to 0$ as lateral offset $x_L \to 0$.
- **TC-1.10 (Pedestrian TTC Calc):** Verify $\text{TTC} = d_{\text{long}} / v_{\text{approach}}$ correctly handles oncoming vs receding vehicles.
- **TC-1.11 (Pedestrian Gap Acceptance):** Verify pedestrian waits on curb when approaching car has $\text{TTC} < \text{TTC}_{\text{safe}}$.
- **TC-1.12 (Bus Transit FSM):** Verify passenger entities step through `IDLE` $\to$ `WAITING` $\to$ `BOARDING` $\to$ `ON_BOARD` $\to$ `ALIGHTING`.

#### Tier 2: Boundary & Corner Conditions
- **TC-2.1 (Instant Cut-in with $s < s_0$):** Vehicle cuts into lane directly ahead ($s = 1.0\text{m} < s_0$). IDM must apply max safe braking smoothly without negative velocity or NaN explosion.
- **TC-2.2 (Emergency Stop of Lead Vehicle):** Lead vehicle decelerates at $-6.0\text{ m/s}^2$. Following vehicle must brake and stop at $s \ge s_0$, avoiding collision.
- **TC-2.3 (Negative Delta-V / Pull Away):** Lead vehicle accelerates away ($\Delta v < 0$). IDM acceleration must approach free road acceleration without stutter.
- **TC-2.4 (Single Lane Overtake Rejection):** MOBIL query on edge with `lanes === 1` returns `false` immediately.
- **TC-2.5 (High Speed 90° Turn):** Vehicle entering 90° junction at $12\text{ m/s}$ smoothly decelerates to safe turn speed ($6\text{ m/s}$) via IDM curvature slowdown without overshooting road bounds.
- **TC-2.6 (Zero-Visibility Pedestrian):** Pedestrian steps out from behind parked bus. Vehicle IDM triggers emergency deceleration and honk.

#### Tier 3: Combinatorial & Multi-Agent Scenarios
- **TC-3.1 (10-Vehicle Platoon String Stability):** A platoon of 10 vehicles follows a lead vehicle that undergoes sinusoidal velocity oscillations ($v(t) = 10 + 2\sin(0.2 t)$). Verify that downstream oscillation amplitudes attenuate ($\text{Amp}(v_{10}) \le \text{Amp}(v_1)$), proving string stability.
- **TC-3.2 (Multi-Vehicle Red Light Queue & Release):** 8 vehicles approach a red signal, compress into an orderly queue with spacing $s_i \in [s_0, s_0 + 0.5\text{m}]$, and smoothly disperse upon green signal without accordion crashes.
- **TC-3.3 (4-Way Intersection Simultaneous Arrival):** 4 vehicles arrive at an uncontrolled intersection at the exact same millisecond. Verify Phase 1 watchdog arbitrates within $3.5\text{s}$, one vehicle proceeds, and the remaining vehicles follow in turn.
- **TC-3.4 (Bus Docking & Highway Overtake):** A bus pulls into a bus stop dock. Trailing vehicles seamlessly execute MOBIL overtakes into the right lane without stopping behind the bus.
- **TC-3.5 (Cascading Horn Wave):** First vehicle in stalled queue honks. Verify realistic cascading horn sounds propagate backward through aggressive NPCs with random delays.

#### Tier 4: Real-World Mumbai Scenarios (Full E2E)
- **TC-4.1 (Marine Drive Arterial Flow):** 36 active vehicles on a 4-lane arterial road for 120 seconds. Measure average traffic speed, lane change frequency, and ensure FPS remains $\ge 58\text{ FPS}$.
- **TC-4.2 (Dadar Market Congestion):** Dense 2-lane road with 24 vehicles, 20 pedestrians (heavy jaywalking), and auto-rickshaws filtering. Verify 0 deadlocks and 0 pedestrian collisions.
- **TC-4.3 (BEST Bus Route Simulation):** Bus operates on Level 1/2 route, stopping at 3 distinct bus stops, boarding and dropping off pedestrians, maintaining schedule without blocking traffic indefinitely.
- **TC-4.4 (Monsoon Wet Road Conditions):** Enable rain/puddle map configuration ($\mu = 0.55$). Verify IDM braking distances automatically lengthen and vehicle speeds reduce by 25–35%.
- **TC-4.5 (10-Minute Stability & Memory Soak):** Run full simulation continuously for 10 minutes (36,000 frames). Assert: 0 unhandled JS exceptions, 0 deadlocks ($t_{\text{stuck}} > 8\text{s}$), and 0 net heap memory leak.

---

## 5. Automated Test Harness Implementation Blueprint

### Directory Layout
```
Traffic/
├── test/
│   ├── unit/
│   │   ├── idm_math.test.js           # IDM equations, headway calculus, jerk continuity
│   │   ├── mobil_math.test.js         # MOBIL safety gates, politeness factors, bias
│   │   ├── pure_pursuit.test.js       # Curvature tracking, look-ahead scaling, 90° turns
│   │   ├── pedestrian_ttc.test.js     # TTC calculations, gap acceptance, fleeing vectors
│   │   ├── watchdog_deadlock.test.js  # 2-phase watchdog state machine arbitration
│   │   └── run_all_unit.js            # Node CLI test runner (outputs JUnit/TAP/Console)
│   ├── simulation/
│   │   ├── sim_harness.js             # Playwright test server & browser orchestrator
│   │   ├── test_platoon_stability.js  # 10-vehicle platoon string stability test
│   │   ├── test_intersection_4way.js  # 4-way deadlock resolution under 3.5s
│   │   ├── test_bus_stop_transit.js   # Passenger boarding/alighting cycle
│   │   ├── test_mumbai_density_fps.js # 36-vehicle 60 FPS performance benchmark
│   │   └── run_all_sim.js             # Master simulation test runner
│   └── fixtures/
│       ├── test_level_grid.js         # Standard 4-way cross junction level config
│       └── test_level_arterial.js     # 4-lane straight high-speed corridor config
```

### Execution Commands
```json
{
  "scripts": {
    "test:unit": "node test/unit/run_all_unit.js",
    "test:sim": "node test/simulation/run_all_sim.js",
    "test:all": "npm run typecheck && npm run test:unit && npm run test:sim",
    "test:smoke": "node test_gameplay.js"
  }
}
```

---

## 6. Verification Criteria & Pass/Fail Threshold Matrix

| Test Suite Tier | Target Metric | Strict Pass Criteria | Fail Criteria |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Math Unit)** | IDM & MOBIL Math Invariants | 100% tests pass; all math formulas adhere to continuous derivatives | Any speed snap, negative gap, or unhandled NaN |
| **Tier 2 (Corner Cases)** | Extreme Input Resilience | 100% pass; safe deceleration clamped to surface $\mu$; no crashes | Any vehicle bounding box intersection or out-of-bounds escape |
| **Tier 3 (Multi-Agent)** | Deadlock Resolution Time | All intersection stalls resolved in $\le 3.50\text{ seconds}$ | Any intersection stall $> 3.50\text{ s}$ without motion |
| **Tier 4 (Real-World E2E)** | Simulation FPS | Average FPS $\ge 58.0\text{ FPS}$ under 36 active vehicles | FPS drops below 45 FPS for $> 2.0\text{ s}$ |
| **Tier 4 (Real-World E2E)** | Pedestrian TTC Safety | 0 pedestrian collisions during standard crosswalk crossings | Any pedestrian run over by vehicle with $\text{TTC} > 3.0\text{s}$ |
| **Endurance** | 10-Minute Stability | 0 unhandled exceptions; 0 memory leaks ($< 5\text{MB}$ delta) | Crashes, frozen threads, or monotonic heap growth |

---

## 7. Conclusion & Implementation Readiness

The test infrastructure in `Traffic/` is fully primed to support this verification plan. The combination of **fast Node.js unit math runners** (providing immediate sub-second feedback for algorithm developers) and **Playwright-driven browser simulations** (verifying empirical 60 FPS gameplay, visual smoothness, and multi-agent emergent behavior) provides an ironclad testing harness.
