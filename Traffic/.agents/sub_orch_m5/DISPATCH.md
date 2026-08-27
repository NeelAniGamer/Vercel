# DISPATCH — Milestone 5: Pedestrian AI, TTC Jaywalking & Bus Stops
Original Request: file:///c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/.agents/ORIGINAL_REQUEST.md
Project Scope: file:///c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/PROJECT.md
Working Directory: c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/.agents/sub_orch_m5

## 2026-08-26T16:55:08Z
You are the Implementation Engineer for Milestone 5: Pedestrian AI, TTC Jaywalking & Bus Stops.

Scope & Tasks:
1. In `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\npc-ai.js` and `game_core.js`:
   - Upgrade `PedestrianAI` class:
     - Implement `calcPedestrianTTC(pedPos, vehPos, vehVel)` / `evaluateTTC(oncomingVehicles)`:
       - Compute longitudinal distance $d_{\text{long}}$ along oncoming vehicle forward heading.
       - Compute closing approach speed $v_{\text{approach}}$. If receding or moving away, $TTC = \infty$.
       - Calculate Time-To-Collision: $t_{\text{TTC}} = \frac{d_{\text{long}}}{\max(0.5, v_{\text{approach}})}$.
     - Safe Gap Acceptance:
       - Pedestrian starts crossing crosswalk or jaywalking only if all oncoming vehicles have $t_{\text{TTC}} \ge t_{\text{threshold}}$ ($t_{\text{threshold}} \approx 4.0\text{s}$, modified by personality cautious $\approx 5.5\text{s}$, aggressive $\approx 3.0\text{s}$).
     - Reactive Fleeing / Threat Evasion:
       - If any vehicle (player or NPC) approaches within danger zone ($d < 6.0\text{m}$ and closing $t_{\text{TTC}} < 2.0\text{s}$), immediately transition to `PED_STATE.FLEEING`.
       - Sprint speed $1.8\times v_{\text{walk}}$ directly away/perpendicular from vehicle path toward nearest sidewalk safe zone.
     - Bus Stop Passenger Lifecycles:
       - Implement passenger state machine: WAITING at shelter $\to$ QUEUING at curb $\to$ BOARDING entering bus door when bus stops at stop $\to$ ALIGHTING departing bus.
     - In `game_core.js`: Ensure `_upeds` cleanly delegates motion and state updates to `PedestrianAI` without conflicting position overwrites.
2. In `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\src\systems\NPCAI.ts` and `src/systems/TrafficManager.ts`:
   - Implement the identical `PedestrianAI` TTC evaluation, gap acceptance, reactive fleeing, and bus stop passenger sequence in TypeScript with full type safety.
3. Verification:
   - Run `node test_ai_math.js` (32/32 tests pass).
   - Run `npm run typecheck` in `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic` (0 errors).
   - Run `node test_simulation_ai.js --scenario=pedestrian` to verify pedestrian & bus stop scenario in browser.
4. Write a comprehensive `handoff.md` and report back using `send_message`.
