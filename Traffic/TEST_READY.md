# Traffic Driving Simulator: Test Suite Readiness Signal (TEST_READY)

> Milestone 1 Verification Suite & Test Infrastructure Index

---

## 1. Test Suite Status & Readiness Signal

- **Status**: **READY FOR IMPLEMENTATION MILESTONES (M2–M7)**
- **Author**: Test Writer & E2E Testing Architect (M1)
- **Date**: 2026-08-26
- **Integrity**: Dual-Stack Headless Math Verification + Browser-in-the-Loop Playwright E2E

---

## 2. Test Execution Commands

| Target | Command | Duration | Purpose |
| :--- | :--- | :--- | :--- |
| **Math & Physics Invariants (Tiers 1–4)** | `node test_ai_math.js` | < 1.0s | Pure mathematical calculus, IDM equations, MOBIL decisions, Pure Pursuit, Pedestrian TTC |
| **Playwright E2E Simulation (All Scenarios)** | `node test_simulation_ai.js` | ~15s | Browser-in-the-loop multi-agent queues, lane changes, intersections, pedestrians, 60 FPS |
| **Playwright Quick Smoke Test** | `node test_simulation_ai.js --quick` | ~6s | Fast CI/CD smoke test with reduced sample duration |
| **Scenario: Queue Stability** | `node test_simulation_ai.js --scenario=queue` | ~5s | Platoon queue stability and smooth deceleration curves |
| **Scenario: MOBIL Lane Changes** | `node test_simulation_ai.js --scenario=mobil` | ~6s | Safe follower braking and lateral lane change execution |
| **Scenario: 4-Way Intersection** | `node test_simulation_ai.js --scenario=intersection` | ~4s | Deadlock arbitration watchdog resolution $\le 3.5\text{s}$ |
| **Scenario: Pedestrian & Bus Stop** | `node test_simulation_ai.js --scenario=pedestrian` | ~4s | TTC gap acceptance, fleeing, and bus stop state cycle |
| **Scenario: 60 FPS Benchmark** | `node test_simulation_ai.js --scenario=performance` | ~8s | High-density frame time profiling (24–36 active vehicles) |
| **TypeScript Typecheck** | `npm run typecheck` | ~1.5s | Validates strict typing across `Traffic/src/systems/` |

---

## 3. Tier Coverage & Feature Test Matrix

| Tier | Category | Test Cases | Target Milestone | Coverage Summary |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | Feature Coverage | `T1.1` – `T1.12` (12 tests) | M2, M3, M4, M5 | Exact formula verification for IDM $s^*, a$, MOBIL safety & incentive inequalities, Pure Pursuit lookahead $L_d(v)$ and curvature $\kappa$, Pedestrian TTC oncoming vs receding, gap acceptance, and reactive fleeing. |
| **Tier 2** | Boundary & Corner Conditions | `T2.1` – `T2.10` (10 tests) | M2, M3, M4, M5, M6 | Zero/negative closing speeds, jam gap $s_0$ standstill, lookahead clamping at bounds [3.5m, 20.0m], single-lane road rejection, wet monsoon road $\mu = 0.55$, and 2-phase watchdog phase triggers. |
| **Tier 3** | Combinatorial Dynamics | `T3.1` – `T3.5` (5 tests) | M2, M3, M6 | 10-vehicle platoon string stability & oscillation damping, 8-vehicle red signal queue compression, 4-way intersection simultaneous arrival deadlock resolution, bus docking overtake stream, cascading horn propagation wave. |
| **Tier 4** | Real-World Mumbai Scenarios | `T4.1` – `T4.5` (5 tests) | M2, M5, M6, M7 | Mumbai vehicle archetype calibration matrix (Car, Auto, Bike, Bus, Truck), Marine Drive arterial flow, Dadar congestion bike filtering, BEST Bus transit state cycle, and 60 FPS / $\le 2.50\text{ms}$ AI CPU budget verification. |

**Total Pure Math & Unit Invariant Tests:** 32 Tests (100% Pass Rate).

---

## 4. Verification & Handover Instructions for Implementation Agents

1. **For M2 (IDM Longitudinal Physics)**:
   - Run `node test_ai_math.js` to ensure IDM mathematical properties match expected derivatives and acceleration boundaries.
   - Run `node test_simulation_ai.js --scenario=queue` to test in-game queue stability and smooth deceleration behind red lights.
2. **For M3 (MOBIL Lateral Lane Changing)**:
   - Run `node test_ai_math.js` (Tiers 1 & 2 MOBIL tests) to verify safety gates and politeness parameters.
   - Run `node test_simulation_ai.js --scenario=mobil` to test multi-lane overtaking and return-to-lane behavior.
3. **For M4 (Adaptive Pure Pursuit)**:
   - Run `node test_ai_math.js` (T1.8, T1.9, T2.5, T2.7) for lookahead scaling and curvature steering.
4. **For M5 (Pedestrian AI, TTC & Bus Stops)**:
   - Run `node test_ai_math.js` (T1.10, T1.11, T1.12, T4.4) for TTC calculation, gap acceptance, and bus stop state machine.
   - Run `node test_simulation_ai.js --scenario=pedestrian` to test live pedestrian crowd behavior.
5. **For M6 (Mumbai Micro-Behaviors & Anti-Deadlock)**:
   - Run `node test_ai_math.js` (T2.9, T2.10, T3.3, T3.5, T4.3) for deadlock arbitration tokens, gap probing, and cascading horns.
   - Run `node test_simulation_ai.js --scenario=intersection` to test in-game 4-way deadlock resolution $\le 3.5\text{s}$.
6. **For M7 (Final Verification)**:
   - Run `node test_ai_math.js` and `node test_simulation_ai.js` (full suite) followed by `npm run typecheck`.
