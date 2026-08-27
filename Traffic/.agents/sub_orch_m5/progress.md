# Progress — Milestone 5: Pedestrian AI, TTC Jaywalking & Bus Stops

Last visited: 2026-08-26T22:34:30Z

## Status: COMPLETE (Ready for Handoff)

### 1. Investigation & Audit
- [x] Audited `test_ai_math.js` requirements for TTC (T1.10), Gap Acceptance (T1.11), Fleeing (T1.12), Bus Stop Lifecycle (T4.4).
- [x] Audited `game_core.js` pedestrian loop in `_upeds(dt)`.
- [x] Audited TypeScript parity in `src/systems/NPCAI.ts` and `src/systems/TrafficManager.ts`.

### 2. Vanilla JS Implementation (`npc-ai.js`, `game_core.js`, `traffic-manager.js`)
- [x] Implemented `calcPedestrianTTC(pedPos, vehPos, vehVel, laneWidth)` supporting both positional and object options signatures.
- [x] Implemented `evaluatePedestrianGapAcceptance({ minTTC, roadWidth, walkSpeed, tMargin })`.
- [x] Implemented `evaluatePedestrianFleeing({ minTTC, dLong, currentSpeed, walkSpeed })`.
- [x] Updated `PED_STATE` enum with full state machine (`WAITING_FOR_BUS`, `QUEUING`, `BOARDING`, `IN_TRANSIT`, `ALIGHTING`, `WALKING_SIDEWALK`, etc.).
- [x] Added `ttcThreshold` calibration to all profiles in `PED_PROFILES`.
- [x] Implemented `PedestrianAI.evaluateTTC(oncomingVehicles)`, `PedestrianAI.triggerFlee(threatPos, threatDir)`, and `PedestrianAI.handleBusStopLifecycle(busStop, dt)`.
- [x] Cleaned up `game_core.js` `_upeds(dt)`: automatically instantiated and attached `PedestrianAI` to all pedestrians, updated them cleanly, and added `if (p._pedAI) return;` guard to legacy manual loop to prevent conflicting position overwrites.
- [x] Added `TrafficManager.getVehiclesInRadius(pos, radius)` to `traffic-manager.js`.

### 3. TypeScript Port (`src/systems/NPCAI.ts`, `src/systems/TrafficManager.ts`)
- [x] Added `calcPedestrianTTC`, `evaluatePedestrianGapAcceptance`, `evaluatePedestrianFleeing` and their interfaces.
- [x] Upgraded `PedestrianAI`, `PED_STATE`, `PED_PROFILES` with full type safety.
- [x] Added `TrafficManager.getVehiclesInRadius(pos, radius)` to `src/systems/TrafficManager.ts`.
- [x] Attached all functions to `window` for browser parity.

### 4. Verification & Validation
- [x] `node test_ai_math.js`: 32/32 tests pass (100%).
- [x] `npm run typecheck`: 0 errors.
- [x] `npm run build:web`: Built cleanly (Vite web bundle).
- [x] `node test_simulation_ai.js --scenario=pedestrian`: Browser E2E passed.
