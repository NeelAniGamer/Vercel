# Traffic Driving Simulator: Test Infrastructure & Verification Architecture

> Authoritative specification for test runners, mathematical invariant verifiers, and browser-in-the-loop simulation harnesses for the Mumbai Traffic & Pedestrian AI Upgrade.

---

## 1. Overview & Architecture

The testing infrastructure for the Traffic Driving Simulator operates on a dual-layer strategy:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             TRAFFIC SIMULATOR TEST SUITE                                 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  Layer 1: Headless Node Math & Invariant Verification Runner (`test_ai_math.js`)        │
│  ───────────────────────────────────────────────────────────────────────────────         │
│  • Executes pure mathematical calculus for IDM, MOBIL, Pure Pursuit, and TTC             │
│  • Validates derivatives, boundary limits, continuity, and vehicle parameter matrices   │
│  • Zero browser overhead; execution time < 1.0s; 100% deterministic                      │
│                                                                                          │
│  Layer 2: Browser-in-the-Loop Simulation Harness (`test_simulation_ai.js`)               │
│  ───────────────────────────────────────────────────────────────────────────────         │
│  • Hosts static repository via lightweight HTTP server on port 3848 (bypasses CORS)      │
│  • Launches headless Chromium via Playwright                                             │
│  • Validates multi-vehicle queues, MOBIL lane changes, 4-way deadlock arbitration,       │
│    pedestrian TTC crossing/fleeing, bus stop boarding cycles, and 60 FPS performance     │
│                                                                                          │
│  Layer 3: TypeScript Typecheck & Compilation (`npm run typecheck` / `build:web`)         │
│  ───────────────────────────────────────────────────────────────────────────────         │
│  • Validates interface parity across TypeScript ports in `Traffic/src/systems/`         │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 4-Tier Testing Methodology

The test suite is partitioned into four distinct tiers covering micro-mathematics up to macro multi-agent dynamics:

### Tier 1: Feature Coverage (Mathematical & Physics Invariants)
- **IDM Equations**:
  - Dynamic desired gap:
    $$s^*(v, \Delta v) = s_0 + v T + \frac{v \Delta v}{2\sqrt{a_{\max} b}}$$
  - Continuous longitudinal acceleration:
    $$a(v, s, \Delta v) = a_{\max} \left[ 1 - \left(\frac{v}{v_0}\right)^\delta - \left(\frac{s^*(v, \Delta v)}{s}\right)^2 \right]$$
  - Invariants: $a(0, \infty, 0) = a_{\max}$, $a(v_0, \infty, 0) = 0$, $a(v, s^*(v,0), 0) = 0$.
- **MOBIL Game-Theoretic Lane Changing**:
  - Safety Criterion (Hard constraint):
    $$\tilde{a}_n \ge -b_{\text{safe}}$$
  - Incentive Criterion:
    $$(\tilde{a}_c - a_c) + p \cdot \left[ (\tilde{a}_n - a_n) + (\tilde{a}_o - a_o) \right] > \Delta a_{\text{th}} \pm \Delta a_{\text{bias}}$$
  - Politeness factor $p \in [0, 1]$ modulates collective altruism vs ego selfishness.
- **Adaptive Pure Pursuit Steering**:
  - Dynamic look-ahead:
    $$L_d(v) = \text{clamp}(k_{\text{look}} \cdot v, L_{\min}, L_{\max})$$
  - Curvature & front wheel steer angle:
    $$\alpha = \arctan2(x_L, z_L), \quad \kappa = \frac{2\sin\alpha}{L_d}, \quad \delta = \arctan(\kappa \cdot L_{\text{wheelbase}})$$
  - Yaw rate:
    $$\dot{\psi} = \frac{v \cdot \tan\delta}{L_{\text{wheelbase}}}$$
- **Pedestrian Time-To-Collision (TTC)**:
  - Oncoming vehicle calculation:
    $$t_{\text{TTC}} = \frac{d_{\text{long}}}{\max(0.5, v_{\text{approach}})}$$
  - Gap acceptance threshold:
    $$\min(\text{TTC}) \ge \text{TTC}_{\text{safe}} = \frac{w_{\text{road}}}{v_{\text{walk}}} + t_{\text{margin}}$$
  - Reactive fleeing threshold: $\text{TTC} < 2.2\text{s}$ & $d_{\text{long}} < 10.0\text{m} \implies v_{\text{flee}} = 1.8 \cdot v_{\text{walk}}$.

---

### Tier 2: Boundary & Corner Conditions
- **Zero & Negative Velocities**: $v = 0$, $v_{\text{lead}} > v$ ($\Delta v < 0$).
- **Zero & Near-Zero Headway**: $s \to 0^+$ clamps deceleration smoothly to $-b_{\max}$ without NaN or runaway values.
- **Extreme Politeness**: $p = 0.0$ (pure egoist), $p = 1.0$ (pure altruist), $p < 0$ (malicious blocker rejection).
- **Extreme Look-Ahead Clamping**: $v = 0 \implies L_d = L_{\min} = 3.5\text{m}$; $v = 40\text{m/s} \implies L_d = L_{\max} = 20.0\text{m}$.
- **Monsoon Low Friction**: Wet asphalt ($\mu = 0.55$) increases deceleration distance and limits safe cornering speed.
- **Single Lane Edge Guard**: Attempting MOBIL evaluation on single-lane roads ($N_{\text{lanes}} = 1$) safely returns `false`.

---

### Tier 3: Combinatorial & Multi-Agent Interactions
- **Multi-Vehicle Platoon String Stability**: 10 vehicles following an oscillating leader damp velocity ripples downstream ($\text{Amp}(v_{10}) \le \text{Amp}(v_1)$).
- **Signal Queue Compression**: Multi-vehicle queue stopping behind a red light compresses into equidistant standing spacing $s \in [s_0, s_0 + 0.5\text{m}]$ without overlapping bounding boxes.
- **4-Way Intersection Simultaneous Arrival**: 4 vehicles arriving at the same instant trigger Phase 1 token arbitration and resolve deadlock within 3.5 seconds.
- **Bus Stop Transit Loop**: Trailing vehicles execute MOBIL lane change around a docked bus while pedestrian passenger queue boards smoothly.
- **Cascading Horn Reaction**: Honk by blocked lead vehicle propagates spatially with probabilistic delay to surrounding aggressive NPCs.

---

### Tier 4: Real-World Mumbai Scenario Data Tables
- **Marine Drive Arterial Flow**: High-speed, high-density multi-lane corridor (36 vehicles, 60 FPS).
- **Dadar Market Congestion**: Mixed traffic (cars, auto-rickshaws, bikes, jaywalking pedestrians) resolving without deadlocks.
- **BEST Bus Route**: Timed route traversal across multiple designated stops with passenger exchange cycles.

---

## 3. Vehicle Parameter Calibration Matrix (Mumbai Archetypes)

| Vehicle Class | $v_0$ (Free Speed) | $T$ (Headway) | $s_0$ (Jam Gap) | $a_{\max}$ (Accel) | $b$ (Comfort Decel) | $b_{\text{safe}}$ (Max Decel) | Politeness ($p$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Car / Taxi** | $13.9\text{ m/s } (50\text{ km/h})$ | $1.4\text{ s}$ | $2.5\text{ m}$ | $2.0\text{ m/s}^2$ | $2.0\text{ m/s}^2$ | $4.0\text{ m/s}^2$ | $0.50$ |
| **Auto-Rickshaw** | $11.1\text{ m/s } (40\text{ km/h})$ | $1.0\text{ s}$ | $1.8\text{ m}$ | $1.8\text{ m/s}^2$ | $2.2\text{ m/s}^2$ | $4.5\text{ m/s}^2$ | $0.25$ |
| **Motorbike / Scooter** | $16.7\text{ m/s } (60\text{ km/h})$ | $0.8\text{ s}$ | $1.2\text{ m}$ | $2.8\text{ m/s}^2$ | $2.5\text{ m/s}^2$ | $5.5\text{ m/s}^2$ | $0.10$ |
| **BEST Bus** | $10.0\text{ m/s } (36\text{ km/h})$ | $2.0\text{ s}$ | $4.0\text{ m}$ | $1.2\text{ m/s}^2$ | $1.5\text{ m/s}^2$ | $3.5\text{ m/s}^2$ | $0.75$ |
| **Heavy Truck** | $8.3\text{ m/s } (30\text{ km/h})$ | $2.2\text{ s}$ | $4.5\text{ m}$ | $1.0\text{ m/s}^2$ | $1.4\text{ m/s}^2$ | $3.0\text{ m/s}^2$ | $0.60$ |

---

## 4. Test Runners & Commands

### Running Mathematical Unit Tests
```bash
# In c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic
node test_ai_math.js
```

### Running Browser-in-the-Loop Simulation Tests
```bash
# Run all simulation scenarios
node test_simulation_ai.js

# Run specific scenarios
node test_simulation_ai.js --scenario=queue
node test_simulation_ai.js --scenario=mobil
node test_simulation_ai.js --scenario=intersection
node test_simulation_ai.js --scenario=pedestrian
node test_simulation_ai.js --scenario=performance
```

---

## 5. Pass/Fail Threshold Matrix

| Test Identifier | Category | Key Metric | Success Criteria | Failure Condition |
| :--- | :--- | :--- | :--- | :--- |
| **T1.1–T1.8** | IDM Math | Acceleration & Gap Invariants | Monotonic deceleration, $a(v_0)=0$, zero NaNs | Non-monotonicity, divide-by-zero, $a > a_{\max}$ |
| **T1.9–T1.16** | MOBIL Math | Safe Lane Decision | Follower decel $\ge -b_{\text{safe}}$, politeness evaluated | Follower decel $< -b_{\text{safe}}$, lane switch on loss |
| **T1.17–T1.20** | Pure Pursuit | Steering Curvature & Lookahead | $L_d \in [3.5, 20.0]\text{m}$, $\kappa = 2\sin\alpha/L_d$ | Steer angle NaN, lookahead out of bounds |
| **T1.21–T1.24** | Pedestrian AI | TTC & Gap Acceptance | Step only if $\text{TTC} \ge \text{TTC}_{\text{safe}}$, flee if $< 2.2\text{s}$ | Crossing into oncoming traffic with $\text{TTC} < \text{TTC}_{\text{safe}}$ |
| **T2.1–T2.10** | Boundary | Edge Cases & Low Friction | Safe deceleration clamped, zero crashes | Unhandled negative speed, NaN coordinates |
| **T3.1–T3.6** | Multi-Agent | String Stability & Deadlocks | 4-way deadlock resolves $\le 3.5\text{s}$, queue spacing $\ge s_0$ | Permanent deadlock $> 3.5\text{s}$, vehicle overlapping |
| **T4.1–T4.5** | Real-World & FPS | 60 FPS Performance | Sustained FPS $\ge 58\text{ FPS}$ with 24–36 active vehicles | FPS $< 45\text{ FPS}$ for $> 2.0\text{s}$ |
