# Milestone 4 Handoff Report: Adaptive Pure Pursuit & Spline Trajectory Tracking

## 1. Observation
- **Authoritative Requirements**: Implement Adaptive Pure Pursuit trajectory tracking across dual stacks (`npc-ai.js` and `src/systems/NPCAI.ts`).
- **Mathematical Specification**:
  - Dynamic lookahead distance: $L_d(v) = \text{clamp}(k_{\text{look}} \cdot v, L_{\min}, L_{\max})$ where $k_{\text{look}} = 0.85$, $L_{\min} = 3.5\text{m}$, $L_{\max} = 20.0\text{m}$.
  - Spline query: Lookahead point queried along active route / lane spline at route progress $+ L_d / \text{edgeLength}$, with smooth multi-edge transition across junctions.
  - Heading angle error: $\alpha = \text{atan2}(dx, dz) - \text{rotation.y}$ wrapped to $[-\pi, \pi]$ (or $\text{atan2}(localX, localZ)$).
  - Curvature: $\kappa = \frac{2 \sin\alpha}{\max(0.1, L_d)}$.
  - Steer angle: $\delta = \text{atan}(\kappa \cdot \text{wheelbase})$.
  - Yaw rate: $\dot{\theta} = v \cdot \kappa$, clamped to maximum vehicle turn rate $|\dot{\theta}| \le \omega_{\max}$ ($1.8\text{ rad/s}$ for cars, $2.2$ for bikes/autos, $1.2$ for buses/trucks).
  - Exponential lateral error centering: $e_{\text{lat}} \to e_{\text{lat}} \cdot e^{-\lambda dt}$ with decay rate $\lambda = 4.5\text{ s}^{-1}$.
- **Verification Results**:
  - `node test_ai_math.js`: 32/32 tests passed (100%).
  - `npm run typecheck`: 0 errors (`tsc --noEmit` clean).
  - `node test_simulation_ai.js --quick`: Browser-in-the-loop Playwright simulation passed across all scenarios.

## 2. Logic Chain
1. Added mathematical utilities `calcAdaptiveLookahead` and `calcPurePursuit` in both `npc-ai.js` and `src/systems/NPCAI.ts` conforming strictly to the kinematic bicycle model and unit test requirements (T1.8, T1.9, T2.5, T2.7).
2. Added `calculateLookaheadDistance(speed)` and `computePurePursuitSteering(dt, lookaheadDist)` on `NPCAI` class.
3. Implemented multi-edge lookahead projection: when the lookahead distance $L_d$ exceeds the remaining length of the current edge ($u_{\text{look}} > 1.0$), `NPCAI` computes the lookahead target point on the succeeding junction edge from the vehicle's assigned route, preventing corner wobble, snapping, and sidewalk clipping on 90-degree turns.
4. Refactored `_steerTowardsTarget(dt)` to update vehicle yaw using clamped pure pursuit curvature steering $\dot{\theta} \cdot dt$.
5. Refactored `_maintainLane(dt)` to utilize exponential error convergence without jitter or frame-rate dependence.

## 3. Caveats
- No caveats. Both JavaScript and TypeScript stacks have identical mathematical behavior and have been verified against unit, typecheck, and E2E simulation tests.

## 4. Conclusion
Milestone 4 (Adaptive Pure Pursuit & Spline Trajectory Tracking) is completely implemented and verified across both `npc-ai.js` and `src/systems/NPCAI.ts`.

## 5. Verification Method
1. Run math verification suite:
   ```bash
   node test_ai_math.js
   ```
   (Expected: 32/32 tests pass).
2. Run TypeScript strict typecheck:
   ```bash
   npm run typecheck
   ```
   (Expected: 0 errors).
3. Run quick browser simulation test:
   ```bash
   node test_simulation_ai.js --quick
   ```
   (Expected: All scenarios complete with exit code 0).
