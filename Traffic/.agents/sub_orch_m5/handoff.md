# Handoff Report: Milestone 5 — Pedestrian AI, TTC Jaywalking & Bus Stops

## 1. Observation
- **Vanilla JS Implementation**:
  - `npc-ai.js`: Added `calcPedestrianTTC`, `evaluatePedestrianGapAcceptance`, and `evaluatePedestrianFleeing` supporting both standard parameter object and positional arguments.
  - `npc-ai.js`: Upgraded `PedestrianAI` class with `evaluateTTC(oncomingVehicles)`, `triggerFlee(threatPosition, threatDir)`, and `handleBusStopLifecycle(busStop, dt)` state machine (`WAITING_FOR_BUS` -> `QUEUING` -> `BOARDING` -> `IN_TRANSIT` -> `ALIGHTING` -> `WALKING`).
  - `npc-ai.js`: Updated `PED_STATE` and calibrated `PED_PROFILES` with profile-specific `ttcThreshold` (cautious 5.5s, normal 4.0s, aggressive/rusher 3.0s, child 4.5s).
  - `traffic-manager.js`: Implemented `getVehiclesInRadius(pos, radius)` method.
  - `game_core.js`: In `_upeds(dt)`, automatically attached and updated `PedestrianAI` instances, and inserted `if (p._pedAI) return;` at the start of the manual pedestrian loop to prevent conflicting position/state overwrites.
- **TypeScript Implementation**:
  - `src/systems/NPCAI.ts`: Exported `calcPedestrianTTC`, `evaluatePedestrianGapAcceptance`, `evaluatePedestrianFleeing`, `PED_STATE`, `PED_PROFILES`, and `PedestrianAI` with strict types and runtime parity.
  - `src/systems/TrafficManager.ts`: Added `getVehiclesInRadius(pos: THREE.Vector3, radius: number): VehicleInstance[]`.
- **Testing & Verification**:
  - `node test_ai_math.js`: 32/32 tests passed (100%), specifically verifying T1.10 (TTC calculation), T1.11 (Gap acceptance), T1.12 (Reactive fleeing), and T4.4 (Bus passenger transit lifecycle).
  - `npm run typecheck`: Exited with code 0 (0 errors).
  - `npm run build:web`: Built cleanly (`dist-web/`).
  - `node test_simulation_ai.js --scenario=pedestrian`: Browser-in-the-loop Playwright verification passed.

## 2. Logic Chain
- **TTC Calculation**:
  - Evaluates vehicle forward heading $\mathbf{u}_{\text{veh}} = (\sin\theta_{\text{veh}}, \cos\theta_{\text{veh}})$ and lateral normal $\mathbf{n}_{\text{veh}} = (\cos\theta_{\text{veh}}, -\sin\theta_{\text{veh}})$.
  - Calculates longitudinal offset $d_{\text{long}} = \Delta \mathbf{r} \cdot \mathbf{u}_{\text{veh}}$ and lateral offset $d_{\text{lat}} = |\Delta \mathbf{r} \cdot \mathbf{n}_{\text{veh}}|$.
  - If $d_{\text{long}} \le 0$ (receding/behind vehicle) or $d_{\text{lat}} > (\text{laneWidth}/2 + 1.5\text{m})$, $TTC = \infty$. Otherwise $TTC = d_{\text{long}} / \max(0.5, v_{\text{veh}})$.
- **Gap Acceptance & Jaywalking**:
  - Minimum safe gap $t_{\text{safe}} = (\text{roadWidth} / v_{\text{walk}}) + t_{\text{margin}}$. Pedestrians cross crosswalks or initiate jaywalk maneuvers when all oncoming vehicles have $TTC \ge t_{\text{threshold}}$.
- **Reactive Fleeing**:
  - When a threat vehicle approaches within $d < 6.0\text{m}$ and closing $TTC < 2.0\text{s}$ (or $d < 4.0\text{m}$), pedestrian enters `PED_STATE.FLEEING`, accelerates to $1.8\times v_{\text{walk}}$, and moves perpendicularly away toward the nearest sidewalk boundary.
- **Bus Stop Passenger Flow**:
  - Pedestrians at bus stops transition from `WAITING_FOR_BUS` (near shelter) $\to$ `QUEUING` (at curb when bus arrives within 15m) $\to$ `BOARDING` (entering bus door when stopped) $\to$ `IN_TRANSIT` $\to$ `ALIGHTING` (exiting bus back to sidewalk).

## 3. Caveats
- `game_core.js` legacy fallback loop remains intact for any custom or standalone meshes not managed by `PedestrianAI`, preserving backwards compatibility with legacy custom levels.

## 4. Conclusion
Milestone 5 implementation is complete, mathematically verified, typecheck clean, and validated against the automated headless test suite and Playwright browser E2E test harness.

## 5. Verification Method
To independently verify the implementation:
1. Run mathematical verification suite:
   ```pwsh
   node test_ai_math.js
   ```
   *Expected result: 32/32 tests PASS (100%).*
2. Run TypeScript compiler typecheck:
   ```pwsh
   npm run typecheck
   ```
   *Expected result: 0 errors.*
3. Run Web build:
   ```pwsh
   npm run build:web
   ```
   *Expected result: Vite build succeeds with 0 errors.*
4. Run browser simulation test:
   ```pwsh
   node test_simulation_ai.js --scenario=pedestrian
   ```
   *Expected result: Browser tests execute and PASS.*
