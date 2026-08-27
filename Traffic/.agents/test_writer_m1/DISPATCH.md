## 2026-08-26T16:13:37Z
You are the Test Writer & E2E Testing Architect for Milestone 1 of the Traffic Driving Simulator NPC Traffic and Pedestrian AI Upgrade.

Your Working Directory:
c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\test_writer_m1

Authoritative User Request File (MANDATORY: Read this first):
c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\ORIGINAL_REQUEST.md

Project Architecture & Scope File:
c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\PROJECT.md

Explorer Survey Reference:
c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\explorer_survey_tests\analysis.md

Rules & Constraints:
- Read c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\AGENTS.md.
- You are responsible for creating the comprehensive test infrastructure, test cases, and runner scripts.
- Do NOT modify production source code in `npc-ai.js`, `traffic-manager.js`, or `Traffic/src/` (implementation workers will do that).
- Use Node.js and Playwright Chromium. All Playwright tests must host the local directory via http.createServer on port 3848 (or dynamic available port) to avoid file:// CORS issues.

Your Deliverables:
1. `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\TEST_INFRA.md`: Full test infrastructure index, 4-tier methodology, equations, pass/fail thresholds.
2. `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\test_ai_math.js`: Pure Node unit test suite covering 4 Tiers of mathematical & physics tests:
   - Tier 1: IDM acceleration & $s^*$, MOBIL safety & incentive inequalities, Pure Pursuit lookahead $L_d(v)$ & curvature $\kappa$, Pedestrian TTC calculation.
   - Tier 2: Boundary/corner cases (zero velocity, negative closing speed, zero distance, max lookahead clamping, extreme politeness $p=0$ and $p=1$, emergency evasion).
   - Tier 3: Combinatorial interactions (multi-vehicle queue braking, multi-lane overtaking decisions, pedestrian crossing with approaching platoon).
   - Tier 4: Real-world Mumbai scenario data tables & parameter validation.
3. `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\test_simulation_ai.js`: Browser-in-the-loop Playwright E2E simulation harness that tests:
   - Vehicle queue stability and smooth deceleration behind signals without speed snaps.
   - MOBIL safe lane changing execution.
   - Intersection 4-way conflict resolution within 3.5 seconds.
   - Pedestrian TTC crossing, evasive fleeing, and bus stop passenger sequence execution.
   - 60 FPS performance benchmark with 24-36 active vehicles.
4. Run `node test_ai_math.js` to ensure the math test runner works cleanly.
5. `c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\TEST_READY.md`: Signal file documenting test runner commands, tier coverage counts, and feature matrix.
6. Write a comprehensive `handoff.md` in your working directory and notify the parent orchestrator with `send_message`.
