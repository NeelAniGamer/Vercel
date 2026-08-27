# BRIEFING — 2026-08-26T17:09:30Z

## Mission
Implement Mumbai Micro-Behaviors & Anti-Deadlock Resilience (Milestone 6) across both Vanilla JS and TypeScript stacks.

## 🔒 My Identity
- Archetype: test_writer (operating as implementation engineer for M6)
- Roles: specialist, qa
- Working directory: c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\sub_orch_m6
- Original parent: a3101288-370f-4f2f-a0e7-6feb118eebda
- Milestone: M6 (Mumbai Micro-Behaviors & Anti-Deadlock Resilience)

## 🔒 Key Constraints
- Dual-Stack parity: Vanilla JS (`npc-ai.js`, `traffic-manager.js`, `game_core.js`) and TypeScript (`src/systems/NPCAI.ts`, `src/systems/TrafficManager.ts`).
- Auto-Rickshaw Gap Probing: lateral sinusoidal probing offset ($\pm 0.8\text{m}$) when $s < 12\text{m}$.
- Bike Lane Filtering: sub-lane filtering ($\pm 1.2\text{m}$) when $v_{\text{lead}} < 3.0\text{m/s}$.
- Cascading Horn Reactions: 15m radius alert wave, $\Delta a \approx -0.5\text{ m/s}^2$ for 1.5s, lateral yielding.
- 2-Phase Anti-Deadlock Watchdog: Phase 1 ($t_{\text{stall}} \ge 3.5\text{s}$) intersection priority token arbitration, Phase 2 ($t_{\text{stall}} \ge 8.0\text{s}$) emergency despawn/recycle.
- Maintain ThreePools object recycling, safezone HUD hooks, and 60 FPS performance.
- 100% tests pass in `test_ai_math.js`, `npm run typecheck` passes with 0 errors, and Playwright intersection/performance simulation tests pass.

## Current Parent
- Conversation ID: a3101288-370f-4f2f-a0e7-6feb118eebda
- Updated: not yet

## Task Summary
- **What to build**: Mumbai micro-behaviors (auto probing, bike filtering, cascading horns) and 2-phase deadlock watchdog in both Vanilla JS and TypeScript.
- **Success criteria**: 32/32 tests pass in `test_ai_math.js`, 0 type errors in `npm run typecheck`, simulation tests pass.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Inspect existing implementations from M2-M5 in `npc-ai.js`, `traffic-manager.js`, `game_core.js`, `NPCAI.ts`, and `TrafficManager.ts`.
- Ensure exact alignment with test fixtures in `test_ai_math.js` and `test_simulation_ai.js`.

## Artifact Index
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\sub_orch_m6\BRIEFING.md` — persistent situational memory
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\sub_orch_m6\progress.md` — liveness heartbeat and subtask tracking
- `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\sub_orch_m6\handoff.md` — 5-component handoff report
