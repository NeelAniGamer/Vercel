# Handoff Report: TypeScript Stack Explorer (NPC Traffic & Pedestrian AI Upgrade)

**Author**: TypeScript Stack Explorer  
**Date**: 2026-08-26  
**Working Directory**: `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\explorer_survey_ts`  
**Target Subsystem**: Vite + TypeScript + Electron stack (`Traffic/src/`)  

---

## 1. Observation

1. **Build Tooling & TypeScript Configuration**:
   - `Traffic/package.json:8-20`:
     ```json
     "scripts": {
       "dev": "vite",
       "build:web": "tsc --noEmit && vite build --mode web",
       "build:electron": "tsc --noEmit && vite build --mode electron && node build-electron.js && electron-builder",
       "typecheck": "tsc --noEmit",
       "test:smoke": "node pw_test.js"
     }
     ```
   - Running `npm run typecheck` completes with code 0 (`tsc --noEmit`).
   - Running `npm run build:web` succeeds in 3.12s, generating `dist-web/index.html` and `dist-web/assets/main-CUdo3d_I.js` (514.63 kB).
   - `Traffic/tsconfig.json:1-31` specifies path aliases: `@/*` $\rightarrow$ `src/*`, `@engine/*` $\rightarrow$ `src/engine/*`, `@systems/*` $\rightarrow$ `src/systems/*`, `@game/*` $\rightarrow$ `src/game/*`, `@ui/*` $\rightarrow$ `src/ui/*`, `@state/*` $\rightarrow$ `src/state/*`.

2. **Existing Physics & Longitudinal Update Loop**:
   - `src/systems/NPCAI.ts:719-733` (`_applyPhysics`):
     ```typescript
     const accel = this.vehicle.stats.accel * dt * 60;
     const fric = this.vehicle.stats.fric;
     const maxSpd = this.desiredSpeed;
     if (this.currentSpeed < maxSpd) {
       this.currentSpeed = Math.min(maxSpd, this.currentSpeed + accel);
     } else {
       this.currentSpeed = Math.max(maxSpd, this.currentSpeed * fric);
     }
     const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
     this.vehicle.velocity.copy(forward).multiplyScalar(this.currentSpeed);
     this.vehicle.position.addScaledVector(this.vehicle.velocity, dt);
     this.vehicle.routeProgress += this.currentSpeed * dt / (this.currentEdge?.length || 100);
     ```
   - `src/systems/NPCAI.ts:210-216` (`_updateFollowLane`):
     ```typescript
     if (aheadVehicle) {
       const dist = this.vehicle.position.distanceTo(aheadVehicle.position);
       if (dist < this.followDistance) {
         this.desiredSpeed = Math.min(this.desiredSpeed, aheadVehicle.speed * 0.9);
         if (dist < this.followDistance * 0.5 && this.profile.overtakeThreshold > Math.random() && this.laneChangeCooldown <= 0) {
           this._attemptOvertake(aheadVehicle);
           return;
         }
       }
     }
     ```
   - Desired speed drops abruptly and braking snaps to linear/frictional multipliers rather than continuous IDM deceleration curves.

3. **Lateral Lane Changing & Overtaking**:
   - `src/systems/NPCAI.ts:443-466`:
     ```typescript
     _attemptOvertake(vehicle: any): void {
       if (!this.currentEdge || this.currentEdge.lanes < 2) return;
       const currentLane = this.currentLane;
       const targetLane = currentLane === 0 ? 1 : 0;
       if (this._isLaneClear(targetLane, vehicle)) {
         this.state = NPC_STATE.OVERTAKE;
         this.overtakeTarget = vehicle;
         this.overtakeTimer = 0;
         this.overtakePhase = 0;
       }
     }
     ```
   - Only toggles between lane 0 and lane 1; clearance check is a static bounding box (`toV.dot(forward) > -5 && toV.dot(forward) < 30`) with no calculation of follower deceleration or politeness.

4. **Steering & Lane Tracking**:
   - `src/systems/NPCAI.ts:412-441` (`_steerTowardsTarget` and `_maintainLane`):
     ```typescript
     const desiredDir = toTarget.normalize();
     const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
     const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
     const maxTurn = this.vehicle.stats.turn * dt * 60;
     const clampedAngle = THREE.MathUtils.clamp(angle, -maxTurn, maxTurn);
     this.vehicle.rotation.y += clampedAngle;
     ```
   - Direct angular clamping to node target with no dynamic look-ahead or curvature steering causes sharp intersection cuts and corner oscillations.

5. **Pedestrian AI & Gap Acceptance**:
   - `src/systems/NPCAI.ts:854-876` (`_updateWaiting`) & `967-976` (`_isRoadClear`):
     ```typescript
     _isRoadClear(npcs: any[]): boolean {
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
   - Static 10m check does not calculate vehicle velocity or Time-To-Collision (TTC).
   - Bus stop state and passenger boarding/alighting cycles are missing in `NPCAI.ts`.

---

## 2. Logic Chain

1. **From Observation 1**: The TypeScript stack has functional build scripts, path aliases, and zero existing typecheck errors. New additions must maintain clean compilation with `tsc --noEmit` and Vite bundling.
2. **From Observation 2**: Current longitudinal acceleration is step-based with discontinuous speed assignments. Replacing this with IDM math ($s^*(v, \Delta v) = s_0 + vT + \frac{v\Delta v}{2\sqrt{ab}}$, $a = a_{\max}[1 - (v/v_0)^\delta - (s^*/s)^2]$) will guarantee smooth, continuous acceleration/deceleration curves behind vehicles, traffic signals, and crossings without speed snaps.
3. **From Observation 3**: Current lane change decisions ignore target lane follower impact and multi-lane setups. Implementing MOBIL safety ($\tilde{a}_n \ge -b_{\text{safe}}$) and incentive criteria with politeness factor ($p$) will enable safe, cooperative multi-lane overtaking.
4. **From Observation 4**: Current steering aims directly at the next junction node and clamps yaw. Implementing dynamic look-ahead pure pursuit ($L_d = \max(L_{\min}, k_{\text{look}} \cdot v)$) and curvature steering ($\kappa = \frac{2\sin\alpha}{L_d}$) along road lane splines will eliminate corner wobble and sidewalk clipping.
5. **From Observation 5**: Pedestrians currently cross based on a static distance threshold without approach velocity awareness. Implementing TTC evaluation ($t_{\text{TTC}} = \frac{d_{\text{long}}}{v_{\text{approach}}}$), reactive fleeing, and animated bus stop passenger lifecycles will fulfill R4 requirements.

---

## 3. Caveats

- **Three.js Version Difference**: `Traffic/package.json` uses Three.js `0.170.0` (with `SRGBColorSpace`), while the legacy static stack uses Three.js `r128` (with `sRGBEncoding`). The implementer must ensure property names match the respective Three.js version in each stack.
- **Legacy Script Globals**: In `Traffic/src/main.ts` and `Traffic/src/systems/`, several modules assign to `window.*` for migration compatibility. All new TS classes and interfaces must retain standard ES module exports while optionally maintaining legacy window assignments.
- No other unexplored areas or caveats.

---

## 4. Conclusion

The TypeScript stack is fully mapped and in an ideal state for the R1–R5 AI upgrade. All necessary classes, interfaces, vectors, math models, and lifecycle methods have been identified. Implementation in the TS stack should focus on:
1. `src/systems/NPCAI.ts`: Refactor `NPCAI` and `PedestrianAI` with IDM, MOBIL, Adaptive Pure Pursuit, TTC gap acceptance, bus stop passenger sequences, Mumbai micro-behaviors, and 2-phase anti-deadlock watchdog.
2. `src/systems/TrafficManager.ts`: Integrate multi-lane spatial queries, platoon coordination, and deadlock watchdog tracking.
3. `src/systems/RoadGraph.ts`: Verify lane spline evaluation and forward vector look-ahead queries.

---

## 5. Verification Method

To verify the TypeScript implementation:
1. **Type Checking**:
   ```bash
   cd c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic
   npm run typecheck
   ```
   *Expected outcome*: Exits with code 0 and zero compilation errors.
2. **Web Production Build**:
   ```bash
   cd c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic
   npm run build:web
   ```
   *Expected outcome*: Exits with code 0 and builds `dist-web/` successfully.
3. **Smoke Test Execution**:
   ```bash
   cd c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic
   npm run test:smoke
   ```
   *Expected outcome*: Headless browser smoke tests pass.
4. **Code Inspection**:
   Inspect `src/systems/NPCAI.ts` and verify IDM formulas, MOBIL criteria, pure pursuit curvature steering, TTC evaluation, and anti-deadlock watchdog logic.

---
*End of Handoff Report.*
