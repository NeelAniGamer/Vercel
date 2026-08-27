# Milestone 3 Handoff: MOBIL Lateral Lane Changing & Politeness Implementation

## 1. Observation
- **Authoritative Scope (ORIGINAL_REQUEST.md & PROJECT.md)**:
  Milestone 3 requires implementing the MOBIL (Minimizing Overall Braking Induced by Lane changes) algorithm across both the vanilla JS engine (Traffic/npc-ai.js) and the TypeScript stack (Traffic/src/systems/NPCAI.ts).
- **Mathematical Invariants Verified**:
  - Safety Criterion (Hard Gate): Target lane follower prospective acceleration must satisfy a_n_tilde >= -bSafe. Any candidate lane causing harsh follower deceleration exceeding -bSafe (default 4.0 m/s^2) is strictly rejected (SAFETY_VIOLATION_FOLLOWER_BRAKING).
  - Incentive Criterion: Collective acceleration advantage must satisfy (a_c_tilde - a_c) + p * [(a_n_tilde - a_n) + (a_o_tilde - a_o)] > aTh +/- aBias.
  - Keep-Left Bias (aBias = 0.25 m/s^2, aTh = 0.2 m/s^2):
    - Moving right into overtaking lane requires total incentive > 0.45 m/s^2.
    - Returning left into default cruising lane requires total incentive > -0.05 m/s^2, encouraging disciplined return to lane after overtaking without unnecessary right-lane lingering.
  - Driver Politeness (p) Modulation:
    - Aggressive / Reckless: p in [0.0, 0.15] (disregards follower inconvenience).
    - Normal: p = 0.50 (balanced cooperation).
    - Cautious / Bus / Elderly: p in [0.75, 1.0] (high altruism).
  - Smooth Lateral Transitions:
    - Duration T_change in [1.6s, 2.0s].
    - Interpolation function: u = 0.5 * (1 - cos(pi * t)), blending start and target lane centerlines without discrete position snapping.
    - Cooldown timer T_cooldown in [3.0s, 4.0s] prevents rapid lane hunting and oscillation.

## 2. Logic Chain
1. **MOBIL Decision Engine (evaluateMOBILDecision)**:
   - Implemented as a standalone, zero-dependency pure function exported in both stacks.
   - Computes ego advantage (a_c_tilde - a_c), follower impact (a_n_tilde - a_n), and old follower relief (a_o_tilde - a_o).
   - Evaluates safety hard gate first before calculating collective incentive.
2. **Multi-Lane Spatial Horizon Lookups (NPCAI.prototype.evaluateMOBIL)**:
   - Analyzes candidate adjacent lanes ([currentLane - 1, currentLane + 1]).
   - Calculates forward and normalized right lateral vectors using proper 3D coordinate cross products (THREE.Vector3.crossVectors((0, 1, 0), forward)).
   - Identifies lead and trailing follower vehicles within an 80m horizon for current and prospective target lanes.
   - Evaluates physical bumper-to-bumper headways and closing velocities using continuous IDM calculations (calcIDMAcceleration).
3. **Execution State Machine & Return-to-Lane**:
   - When trailing a slow lead vehicle (s < s_follow * 0.75), ego tests MOBIL criteria to initiate overtaking via _startLaneChange(targetLane).
   - Once overtake passes lead vehicle longitudinal threshold (dLong < -6m), phase transitions to return-to-lane, returning left to lane 0 via MOBIL keep-left evaluation.
   - Exponential convergence and sinusoidal blend prevent jitter across variable framerates.

## 3. Caveats
- No caveats. Both JavaScript runtime (npc-ai.js) and TypeScript source (NPCAI.ts) maintain complete architectural parity and 100% test pass rates.

## 4. Conclusion
- Milestone 3 is fully implemented, mathematically validated, and benchmarked:
  - npc-ai.js: Full MOBIL decision oracle, state machine integration, smooth sinusoidal lane transitions, and keep-left return behavior implemented and exported.
  - src/systems/NPCAI.ts: Complete TypeScript interfaces (MOBILParams, MOBILResult), MOBIL decision logic, and class methods implemented.
  - Test Suite: 32/32 tests pass in node test_ai_math.js.
  - Typecheck: 0 errors in npm run typecheck.
  - Vite Web Build: npm run build:web succeeds in 3.82s.
  - Simulation Benchmark: node test_simulation_ai.js --scenario=mobil passes with live multi-lane traffic flow in Chromium.

## 5. Verification Method
To independently reproduce verification:
`powershell
# 1. Run mathematical unit test suite & physics invariant verification (32/32 PASS)
node test_ai_math.js

# 2. Run TypeScript typechecking (0 errors)
npm run typecheck

# 3. Build web bundle
npm run build:web

# 4. Run browser-in-the-loop E2E Playwright simulation test harness
node test_simulation_ai.js --scenario=mobil
`