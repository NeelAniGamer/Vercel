# Vehicle Dimensions and Crash Barriers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Correct vehicle dimensions and collision bounds across player and NPC vehicles, fix broken road termination barriers (eliminating barrier phase-through, ghost collisions, and sideways sliding), and ensure accurate physical bumper-to-barrier push-out.

**Architecture:** 
1. Fix `createJerseyBarrier` to set local-space half-extents in `userData` (`halfW = width / 2`, `halfD = 0.55`) independent of rotation, matching `_uobs`'s local coordinate transformation.
2. Upgrade `_uobs` obstacle and barrier collision detection from scalar radius `pR = 0.85` to full 2D Oriented Bounding Box (OBB) separating axis projection using `pHalfW` and `pHalfD` of the player's active vehicle, and fix normal-axis push-out.
3. Fix vehicle dimension lookups in `vehicle-dims.js` (resilient regex/substring matching for aliases like `bus_green`), fix `ui.js` collider overrides for `IndianVehicles` and bus presets, and isolate headlight cones from `playerVehicle` bounding box calculations.
4. Synchronize all updated files into `dist/` and verify with Vitest unit tests, Playwright browser smoke tests, and collision simulation.

**Tech Stack:** Three.js, JavaScript (ES6+), TypeScript, Vitest, Playwright.

---

### Task 1: Add Vitest Unit Tests for Barrier Collision, Axis Rotation & Vehicle Dims

**Files:**
- Modify: `tests/legacy-regression.test.ts`
- Test: `tests/legacy-regression.test.ts`

**Step 1: Write the failing tests**
Add regression test suites in `tests/legacy-regression.test.ts`:
1. `MATH-BARRIER-1`: Test Jersey barrier local space coordinate mapping for horizontal roads (`rotY = Math.PI / 2`) vs vertical roads (`rotY = 0`), demonstrating the old bug (swapped `halfW`/`halfD`) and verifying the fix.
2. `MATH-BARRIER-2`: Test OBB separating-axis penetration detection with true player half-extents (`pHalfW = 0.95`, `pHalfD = 2.25` for car; `pHalfW = 1.35`, `pHalfD = 5.5` for bus) vs old scalar `pR = 0.85`.
3. `MATH-BARRIER-3`: Test push-out vector orientation: verifying that a vehicle driving North into a horizontal barrier is pushed South along the road normal, and a vehicle driving East into a vertical barrier is pushed West along the road normal.
4. `VEHICLE-DIMS-1`: Test `VehicleDims.resolve` with composite aliases (`bus_green`, `bus_city`, `car_white`, `auto_yellow`).

**Step 2: Run test to verify it fails**
Run: `npm test`
Expected: FAIL on the new barrier & vehicle-dims assertions.

**Step 3: Write minimal implementation in helper test functions**
Ensure test harness accurately models the corrected formulas and assertions.

**Step 4: Run test to verify it passes**
Run: `npm test`
Expected: PASS.

---

### Task 2: Fix Jersey Barrier Half-Extents & Axis Alignment in `game_core.js`

**Files:**
- Modify: `game_core.js:10877-10885`
- Modify: `dist/game_core.js:10877-10885`

**Step 1: Inspect `createJerseyBarrier`**
In `game_core.js`:
```javascript
// Current broken code:
const isAlignedX = Math.abs(rotY) < 0.1 || Math.abs(rotY - Math.PI) < 0.1;
bg.userData = {
  halfW: isAlignedX ? width / 2 : 0.85,
  halfD: isAlignedX ? 0.85 : width / 2,
  isBarrier: true,
  isObstacle: true
};
```

**Step 2: Implement the fix**
`base` geometry inside `bg` is `BoxGeometry(width, 0.45, 0.9)` and `bg.rotation.y = rotY`.
In local coordinates of `bg`, the barrier length is ALWAYS along local X (`width / 2`), and its thickness is ALWAYS along local Z (`0.55`).
Replace with:
```javascript
bg.userData = {
  halfW: width / 2,
  halfD: 0.55,
  isBarrier: true,
  isObstacle: true
};
```

**Step 3: Verify barrier definitions**
Check all other barrier and barricade definitions (`game_core.js:8825`) to ensure consistent local half-extents.

---

### Task 3: Upgrade `_uobs` Obstacle Collision Detection & Normal Push-Out in `game_core.js`

**Files:**
- Modify: `game_core.js:14539-14695`
- Modify: `dist/game_core.js:14539-14695`

**Step 1: Replace scalar `pR = 0.85` with active vehicle OBB extents**
Derive `pHalfW` and `pHalfD` dynamically from `this.playerVehicle?.userData` or `VehicleDims`:
```javascript
const isPed = !!this.isPedestrian;
const _VDp = (typeof window !== 'undefined' && window.VehicleDims) ? window.VehicleDims : null;
const _pedH = _VDp ? _VDp.pedHalves(this.isChild) : { halfW: 0.29, halfD: 0.19 };
const _vehH = _VDp ? _VDp.halves(this.vehMode || (this.playerVehicle && this.playerVehicle.type)) : { halfW: 0.95, halfD: 2.25 };
const pHalfW = this.playerVehicle?.userData?.halfW || (isPed ? _pedH.halfW : _vehH.halfW);
const pHalfD = this.playerVehicle?.userData?.halfD || (isPed ? _pedH.halfD : _vehH.halfD);
const pRot = this.player.rotation ? this.player.rotation.y : 0;
```

**Step 2: Implement 2D OBB Separating-Axis Projections in `_uobs`**
In the obstacle loop:
```javascript
let localX = dx, localZ = dz;
let pProjW = pHalfW, pProjD = pHalfD;

if (Math.abs(rotY) > 0.01) {
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  localX = cos * dx - sin * dz;
  localZ = sin * dx + cos * dz;

  const angleDiff = pRot - rotY;
  const cosDiff = Math.abs(Math.cos(angleDiff)), sinDiff = Math.abs(Math.sin(angleDiff));
  pProjW = pHalfW * cosDiff + pHalfD * sinDiff;
  pProjD = pHalfW * sinDiff + pHalfD * cosDiff;
} else if (Math.abs(pRot) > 0.01) {
  const cosDiff = Math.abs(Math.cos(pRot)), sinDiff = Math.abs(Math.sin(pRot));
  pProjW = pHalfW * cosDiff + pHalfD * sinDiff;
  pProjD = pHalfW * sinDiff + pHalfD * cosDiff;
}

const overlapX = (hw + pProjW) - Math.abs(localX);
const overlapZ = (hd + pProjD) - Math.abs(localZ);
```

**Step 3: Refine Swept CCD-lite for Fast Player Collision**
Update the thin obstacle swept collision (`isThinObstacle`) to project using `pProjW` and `pProjD` so fast vehicles approaching at 80 km/h do not skip through barriers between frames.

**Step 4: Refine Push-Out along Axis of Least Penetration**
Ensure normal push-out vector accurately moves player back into road bounds:
```javascript
const pushSep = 0.08;
if (Math.abs(rotY) > 0.01) {
  const cosW = Math.cos(rotY);
  const sinW = Math.sin(rotY);
  if (overlapX < overlapZ) {
    const pushLX = (localX > 0 ? overlapX + pushSep : -(overlapX + pushSep));
    this.player.position.x += cosW * pushLX;
    this.player.position.z -= sinW * pushLX;
  } else {
    const pushLZ = (localZ > 0 ? overlapZ + pushSep : -(overlapZ + pushSep));
    this.player.position.x += sinW * pushLZ;
    this.player.position.z += cosW * pushLZ;
  }
} else {
  if (overlapX < overlapZ) {
    this.player.position.x += (dx > 0 ? overlapX + pushSep : -(overlapX + pushSep));
  } else {
    this.player.position.z += (dz > 0 ? overlapZ + pushSep : -(overlapZ + pushSep));
  }
}
```

---

### Task 4: Fix Vehicle Dimensions, Aliases, and Collider Overrides

**Files:**
- Modify: `vehicle-dims.js:110-165`
- Modify: `dist/vehicle-dims.js:110-165`
- Modify: `ui.js:4786, 5003-5015`
- Modify: `dist/ui.js:4786, 5003-5015`
- Modify: `game_core.js:6012-6018`
- Modify: `dist/game_core.js:6012-6018`

**Step 1: Enhance `vehicle-dims.js` alias resolver**
- Add specific common composite names: `bus_green`, `bus_city`, `bus_green_city`, `bus_red`, `ambulance`, `police`, `fire_truck`.
- Enhance `resolve(type)` to fall back to substring matching (e.g. any string containing `bus` -> `bus`, `truck`/`lorry`/`eicher` -> `truck`, `bike`/`scooter` -> `bike`, `auto`/`rickshaw` -> `auto`, `suv` -> `suv`) before defaulting to `car`.

**Step 2: Correct `ui.js` collider overrides**
- In `ui.js:4786`: Set `bus` default `halfD` to `5.50` (matching 11.0m bus visual body).
- In `ui.js:5003-5015`: When wrapping `IndianVehicles.buildVehicle(type, col)`, preserve `iv.userData.halfW` and `iv.userData.halfD` instead of clobbering with `{ halfW: 1.05, halfD: 2.25 }`. Pass along `iv.userData` fields cleanly.

**Step 3: Exclude Headlight Cones from `playerVehicle` Bounds**
- In `game_core.js:6012-6018`: Mark headlight cone meshes with `coneL.ignoreInBoundingBox = true` and attach them to a dedicated lights child group or ensure `playerVehicle.userData` explicitly retains canonical `halfW` and `halfD`.

---

### Task 5: Verification and Testing

**Files:**
- Create/Run: `tests/verify_vehicle_barriers.js`
- Run: `npm test`
- Run: `npm run test:smoke`

**Step 1: Run Vitest Unit Tests**
Run `npm test` to ensure all 57 existing unit tests + new barrier & dims regression tests pass.

**Step 2: Run Automated Headless Browser Collision Verification**
Execute a Playwright script that:
1. Spawns `Driving.html` in headless Chrome.
2. Checks dimensions of all spawned vehicle types (`car`, `bus`, `truck`, `auto`, `bike`) and verifies `userData.halfW` and `userData.halfD` match canonical physical specs.
3. Tests barrier collision at a road terminus: drives car into North barrier (`rotY = 0`) and East barrier (`rotY = Math.PI / 2`).
4. Asserts that the vehicle registers collision at the front bumper (within ±0.15m), does NOT phase through, and is pushed out along the road normal back toward the road center.

**Step 3: Check Console Errors and Warnings**
Confirm 0 console errors and 0 warnings during collision and gameplay.
