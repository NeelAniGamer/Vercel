# Handoff Report — Explorer Survey: Vanilla JS Traffic & Pedestrian AI

**Agent:** Vanilla JS Codebase Explorer  
**Recipient:** Parent Orchestrator (`a3101288-370f-4f2f-a0e7-6feb118eebda`)  
**Working Directory:** `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\explorer_survey_vanilla`  
**Date:** 2026-08-26  
**Artifacts Generated:** `analysis.md`, `handoff.md`, `progress.md`, `BRIEFING.md`, `DISPATCH.md`  

---

## 1. Observation

Direct code observations from the Vanilla JS stack in `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic`:

1. **Script Load Order in `Driving.html` (lines 8440–8459)**:
   ```html
   <script src="pools.js?v=20260825_5"></script>
   <script src="road-graph.js?v=20260825_5"></script>
   <script src="render_core.js?v=20260825_5"></script>
   <script src="safezone-ui.js?v=20260825_5"></script>
   ...
   <script src="game_core.js?v=20260825_5"></script>
   <script src="npc-ai.js?v=20260825_5"></script>
   <script src="traffic-manager.js?v=20260825_5"></script>
   <script src="rule-breaker-profiles.js?v=20260825_5"></script>
   ```

2. **NPC Longitudinal Physics in `npc-ai.js` (lines 1172–1193)**:
   ```javascript
   _applyPhysics(dt) {
     const stats = this.vehicle.stats || (window.VEHICLE_STATS && (window.VEHICLE_STATS[this.vehicle.type] || window.VEHICLE_STATS.car)) || { accel: 0.045, fric: 0.945 };
     const accel = (stats.accel || 0.045) * dt * 60;
     const fric = Math.pow(stats.fric || 0.945, dt * 60);
     const maxSpd = this.desiredSpeed;

     if (this.currentSpeed < maxSpd) {
       this.currentSpeed = Math.min(maxSpd, this.currentSpeed + accel);
     } else {
       this.currentSpeed = Math.max(maxSpd, this.currentSpeed * fric);
     }
     ...
   }
   ```
   *Speed control is a step-addition and friction decay without continuous differential IDM acceleration.*

3. **Follower & Stopping Heuristics in `npc-ai.js` (lines 524–533, 501–507)**:
   ```javascript
   if (dist < stopBuffer && leadSpd < 0.2) {
     this.desiredSpeed = 0;
     this.currentSpeed *= 0.7; // Instantaneous speed snap
   } else if (dist < this.followDistance) {
     const targetFollowSpeed = leadSpd > 0.5 ? Math.max(2.5, leadSpd) : (dist > stopBuffer ? 2.0 : 0);
     const distRatio = Math.max(0.1, (dist - stopBuffer) / Math.max(1, this.followDistance - stopBuffer));
     this.desiredSpeed = Math.min(this._getTargetSpeed(), targetFollowSpeed * distRatio);
   }
   ```
   ```javascript
   this.desiredSpeed = 0;
   if (distToSignal < 9) {
     this._committedToIntersection = false;
     this.state = NPC_STATE.WAIT_SIGNAL;
     this.waitTimer = 0;
     this.currentSpeed *= 0.75; // Instantaneous braking snap
   }
   ```

4. **Lane Changing & Overtaking in `npc-ai.js` (lines 689–711)**:
   ```javascript
   _attemptOvertake(vehicle) {
     if (!this.currentEdge || this.currentEdge.lanes < 2) return;
     const currentLane = this.currentLane;
     const targetLane = currentLane === 0 ? 1 : 0;
     if (this._isLaneClear(targetLane, vehicle)) {
       this.state = NPC_STATE.OVERTAKE;
       ...
     }
   }
   ```
   *Overtaking is limited to binary 2-lane swap with spatial box check `toV.dot(forward) > -8 && toV.dot(forward) < 32` without MOBIL braking safety criteria.*

5. **Path Tracking Steering in `npc-ai.js` (lines 652–687)**:
   ```javascript
   const progress = Math.min(1.0, (this.vehicle.routeProgress || 0) + 0.12);
   const lanePoint = this.currentEdge.getLaneCenter(this.currentLane, progress);
   ...
   const blend = 1 - Math.exp(-dt * 4.5);
   this.vehicle.position.x += toCenter.x * blend;
   this.vehicle.position.z += toCenter.z * blend;
   ```
   *Fixed progress offset (+0.12) and lateral exponential displacement without velocity-scaled lookahead pure pursuit.*

6. **Pedestrian Proximity & Crossing in `npc-ai.js` (lines 1444–1454) & `game_core.js` (lines 10167–10173, 10420–10600)**:
   ```javascript
   _isRoadClear(npcs) {
     if (!npcs) return true;
     const myPos = this.ped.position;
     for (const npc of npcs) {
       if (!npc.position) continue;
       const dist = myPos.distanceTo(npc.position);
       if (dist < 10) return false;
     }
     return true;
   }
   ```
   *Static 10m check without Time-To-Collision (TTC) approach velocity calculation.*

7. **TrafficManager Vehicle Lifecycle & Pools in `traffic-manager.js` (lines 402–432, 512–544)**:
   - `vehiclePools` map indexed by vehicle type (`car`, `auto`, `bike`, `bus`, `truck`, etc.).
   - `_createVehicle` reuses pooled vehicle or constructs mesh via `_createVehicleMesh(type, color)`.
   - `_despawnVehicle` cleans up scene references and pushes back to `vehiclePools`.

---

## 2. Logic Chain

1. **Longitudinal Physics (R1)**:
   - Observation 2 & 3 show that NPC speed adjustments currently rely on linear acceleration additions and discrete multipliers (`currentSpeed *= 0.75` / `currentSpeed *= 0.7`).
   - This creates visual speed snapping, unnatural vehicle queue expansion, and abrupt signal stops.
   - Implementing continuous IDM differential equations ($s^*(v, \Delta v) = s_0 + v T + \frac{v \Delta v}{2\sqrt{a_{\max} b}}$ and $a = a_{\max}[1 - (v/v_0)^\delta - (s^*/s)^2]$) with virtual obstacles for red signals and stop lines will provide completely smooth, physically realistic deceleration and queue compression.

2. **Lateral Decisions (R2)**:
   - Observation 4 demonstrates that lane changes are hardcoded to binary 0 ↔ 1 toggling with a crude bounding box check.
   - This prevents multi-lane overtaking on 3+ lane roadways and fails to protect target lane followers from excessive emergency braking.
   - Replacing this with the MOBIL game-theoretic model ($\tilde{a}_{\tilde{n}} \ge -b_{\text{safe}}$ and $(\tilde{a}_c - a_c) + p[(\tilde{a}_n - a_n) + (\tilde{a}_o - a_o)] > \Delta a_{\text{th}} + a_{\text{bias}}$) factoring in driver politeness ($p$) will ensure safe, realistic multi-lane passing and merging.

3. **Trajectory Tracking (R3)**:
   - Observation 5 shows fixed progress lookahead (+0.12) coupled with direct lateral position displacement.
   - At high speeds this causes corner clipping on sharp 90° turns; at low speeds it causes steering jitter.
   - Implementing Adaptive Pure Pursuit ($L_d = \text{clamp}(k_{\text{look}} \cdot v, L_{\min}, L_{\max})$, curvature $\kappa = \frac{2 \sin\alpha}{L_d}$, steering yaw rate $\dot{\theta} = v \cdot \kappa$) along road edge lane splines will produce smooth cornering and eliminate artificial position nudging.

4. **Pedestrian TTC Gap Acceptance (R4)**:
   - Observation 6 proves that pedestrians step into traffic based only on a static distance ($< 10\text{m}$) without measuring vehicle speed or calculating closing time.
   - Implementing dynamic $TTC = \frac{d_{\text{long}}}{\max(0.5, v_{\text{approach}})}$ will allow pedestrians to safely cross in front of slow traffic while properly waiting for fast vehicles, and trigger evasion/fleeing when threatened.

5. **Mumbai Micro-Behaviors & Anti-Deadlock (R5)**:
   - The existing 2-phase watchdog in `NPCAI` (3.5s nudge / 8.0s recycle) provides a solid base. Adding auto-rickshaw gap probing, two-wheeler sub-lane filtering, and an intersection reservation matrix will resolve all 4-way intersection arrivals within 3.5s with zero deadlock.

---

## 3. Caveats

1. **Dual Pedestrian Loop**: `game_core.js` contains a legacy `_upeds` implementation that historically updated pedestrian positions directly. When upgrading `PedestrianAI`, `_upeds` must be streamlined so it delegates motion exclusively to `PedestrianAI` without conflicting position updates.
2. **Asset Bundle Immutability**: `cert_assets.js`, `env.js`, `auto.js`, `bus.js`, and `lambo.js` are pre-compiled binary export files and must NOT be edited. All upgrades must interface with existing mesh hierarchies.
3. **Pinnned Three.js r128**: All math and vector calculations must remain fully compatible with Three.js r128.

---

## 4. Conclusion

The Vanilla JS stack in `Traffic/` is well-architected for modular replacement of NPC and pedestrian behaviors. The entry points and data flows are completely identified:
- Modify `npc-ai.js` to implement IDM longitudinal physics (R1), MOBIL lateral decision model (R2), Adaptive Pure Pursuit trajectory tracking (R3), and Mumbai micro-behaviors/anti-deadlock (R5).
- Modify `npc-ai.js` (`PedestrianAI`) and `game_core.js` (`_upeds`) to implement TTC gap acceptance, reactive fleeing, and bus stop passenger boarding (R4).
- Ensure `traffic-manager.js` and `ThreePools` cleanly manage vehicle/pedestrian lifecycles without memory leaks.

Detailed technical analysis and complete parameter specifications are recorded in `analysis.md`.

---

## 5. Verification Method

1. **File Inspection**:
   - Inspect `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\explorer_survey_vanilla\analysis.md` for complete parameter tables and equations.
   - Inspect `npc-ai.js`, `traffic-manager.js`, `game_core.js`, `road-graph.js`, `pools.js` in `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic`.
2. **Execution & Smoke Tests**:
   - Run Playwright smoke test: `cd c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic && node pw_test.js`
   - Launch local static server and test `Driving.html` and `Academy.html` in browser.
3. **Invalidation Conditions**:
   - Any modification to `Traffic/config.json` or asset bundles (`cert_assets.js`, etc.).
   - Reordering script load tags in `Driving.html` or `Academy.html`.
