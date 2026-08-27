# BRIEFING — 2026-08-26T16:55:08Z

## Mission
Implement Milestone 5: Pedestrian AI, TTC Jaywalking & Bus Stops in both Vanilla JS (`npc-ai.js`, `game_core.js`) and TypeScript (`src/systems/NPCAI.ts`, `src/systems/TrafficManager.ts`).

## 🔒 My Identity
- Archetype: specialist, qa
- Roles: specialist, qa
- Working directory: c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\sub_orch_m5
- Original parent: a3101288-370f-4f2f-a0e7-6feb118eebda
- Milestone: Milestone 5 (Pedestrian AI, TTC Jaywalking & Bus Stops)

## 🔒 Key Constraints
- Test code and implementation must be genuine, no hardcoding, no dummy/facade implementations.
- Write/modify code only within assigned scope (`npc-ai.js`, `game_core.js`, `NPCAI.ts`, `TrafficManager.ts`, and test files if needed).
- Must achieve 32/32 passing tests on `test_ai_math.js`.
- Must pass `npm run typecheck` (0 errors).
- Must verify browser simulation with `node test_simulation_ai.js --scenario=pedestrian`.
- Full parity between Vanilla JS and TypeScript stacks.

## Current Parent
- Conversation ID: a3101288-370f-4f2f-a0e7-6feb118eebda
- Updated: 2026-08-26T16:55:08Z

## Task Summary
- **What to build**: PedestrianAI upgrade: TTC calculation, safe gap acceptance for crosswalks & jaywalking, reactive fleeing from danger zones, bus stop passenger lifecycle state machine (WAITING -> QUEUING -> BOARDING -> ALIGHTING), and clean delegation in `game_core.js` `_upeds`.
- **Success criteria**:
  1. `calcPedestrianTTC(pedPos, vehPos, vehVel)` / `evaluateTTC(oncomingVehicles)` accurately computes longitudinal distance and approach velocity along heading.
  2. Crossing gap acceptance respects personality thresholds (cautious ~5.5s, normal ~4.0s, aggressive ~3.0s).
  3. Fleeing triggers if vehicle is within 6.0m and TTC < 2.0s with 1.8x sprint speed toward safe zone.
  4. Bus stop state machine smoothly handles passenger flow.
  5. 32/32 tests pass in `node test_ai_math.js`.
  6. `npm run typecheck` 0 errors.
  7. Scenario passes in `node test_simulation_ai.js --scenario=pedestrian`.
- **Interface contracts**: `PROJECT.md` § Interface Contracts (PedestrianAI)
- **Code layout**: `PROJECT.md` § Code Layout

## Loaded Skills
- None explicitly assigned.

## Quality Status
- **Build/test result**: 32/32 tests passed (100%) in `test_ai_math.js`. `npm run typecheck` passed (0 errors). `npm run build:web` passed. `test_simulation_ai.js --scenario=pedestrian` passed.
- **Lint/Type status**: 0 errors.
- **Tests added/modified**: Verified all Tier 1-4 tests covering pedestrian TTC, gap acceptance, reactive fleeing, and bus stop lifecycle state machines.

## Key Decisions Made
- Implemented `calcPedestrianTTC`, `evaluatePedestrianGapAcceptance`, `evaluatePedestrianFleeing` supporting both positional and object options signatures.
- Upgraded `PedestrianAI` with `evaluateTTC`, `triggerFlee`, and `handleBusStopLifecycle` in both Vanilla JS and TypeScript.
- Added `TrafficManager.getVehiclesInRadius(pos, radius)` to `traffic-manager.js` and `src/systems/TrafficManager.ts`.
- In `game_core.js`, ensured `_upeds(dt)` creates and updates `PedestrianAI` for all active pedestrians and guarded the legacy manual loop with `if (p._pedAI) return;` to avoid conflicting state/position overwrites.

## Artifact Index
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\npc-ai.js` — Pedestrian AI math & state machine
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\game_core.js` — Pedestrian AI update delegation
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\traffic-manager.js` — `getVehiclesInRadius` implementation
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\src\systems\NPCAI.ts` — TypeScript PedestrianAI parity
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\src\systems\TrafficManager.ts` — TypeScript `getVehiclesInRadius` parity
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\test_simulation_ai.js` — Playwright E2E simulation harness
