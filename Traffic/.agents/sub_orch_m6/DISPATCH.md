# DISPATCH — Milestone 6: Mumbai Micro-Behaviors & Anti-Deadlock Resilience
Original Request: file:///c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/.agents/ORIGINAL_REQUEST.md
Project Scope: file:///c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/PROJECT.md
Working Directory: c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/.agents/sub_orch_m6

## 2026-08-26T17:08:37Z
You are the Implementation Engineer for Milestone 6: Mumbai Micro-Behaviors & Anti-Deadlock Resilience.

Scope & Tasks:
1. In `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\npc-ai.js`, `traffic-manager.js`, `game_core.js`:
   - Implement Auto-Rickshaw Gap Probing:
     - When vehicle type is `auto` following slow lead ($s < 12\text{m}$), add subtle lateral sinusoidal probing offset ($\pm 0.8\text{m}$) into forward visual gaps.
   - Implement Two-Wheeler / Bike Lane Filtering:
     - When vehicle type is `bike` behind slow/stopped traffic ($v_{\text{lead}} < 3.0\text{m/s}$), allow sub-lane lane filtering ($\pm 1.2\text{m}$ lateral offset to pass between stopped queues).
   - Implement Cascading Horn Reactions:
     - When vehicle triggers horn (`triggerHorn(reason)` or audio dispatch), propagate spatial alert wave to neighboring vehicles within 15m radius, causing mild defensive deceleration ($\Delta a \approx -0.5\text{ m/s}^2$ for 1.5s) and lateral yielding.
   - Implement 2-Phase Anti-Deadlock Watchdog:
     - Phase 1 ($t_{\text{stall}} \ge 3.5\text{s}$): Check if vehicle is at an intersection; assign priority arbitration token to oldest waiting vehicle while forcing conflicting vehicles to yield, resolving 4-way simultaneous arrival deadlocks in $\le 3.5\text{s}$.
     - Phase 2 ($t_{\text{stall}} \ge 8.0\text{s}$): Emergency recycle / despawn behind horizon and respawn on clear edge.
   - Maintain ThreePools object recycling, safezone HUD violation hooks, and 60 FPS budget.
2. In `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\src\systems\NPCAI.ts`, `src/systems/TrafficManager.ts`:
   - Implement the identical Mumbai micro-behaviors, cascading horn reactions, and 2-phase anti-deadlock watchdog in TypeScript with full type safety.
3. Verification:
   - Run `node test_ai_math.js` (32/32 tests pass).
   - Run `npm run typecheck` in `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic` (0 errors).
   - Run `node test_simulation_ai.js --scenario=intersection` (verify deadlock resolution $\le 3.5\text{s}$) and `node test_simulation_ai.js --scenario=performance` (verify 60 FPS with 24-36 vehicles).
4. Write a comprehensive `handoff.md` and report back using `send_message`.
