## 2026-08-26T16:07:11Z
<USER_REQUEST>
You are the Project Orchestrator for the Traffic Driving Simulator NPC Traffic and Pedestrian AI Upgrade.

Authoritative User Request File:
c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\ORIGINAL_REQUEST.md

Your Working Directory:
c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic\.agents\orchestrator_1

Project Workspace:
c:\Users\neelg\OneDrive\Desktop\Vercel\Traffic

Task Scope:
Implement a comprehensive, world-class upgrade to the NPC Traffic and Pedestrian AI across BOTH stacks:
1. Vanilla JS stack: `npc-ai.js`, `traffic-manager.js`, `game_core.js`, `road-graph.js`, `Driving.html`, `Academy.html`
2. TypeScript + Vite stack: `src/systems/NPCAI.ts`, `src/systems/TrafficManager.ts`, `src/systems/RoadGraph.ts`, `src/engine/GameEngine.ts`, etc.

Requirements to implement & verify:
- R1: Intelligent Driver Model (IDM) longitudinal physics ($s^*$, continuous acceleration/deceleration, smooth braking curves, queued vehicle stopping, red signals, crosswalk stops).
- R2: MOBIL game-theoretic lateral lane changing ($b_{safe}$, politeness $p$, multi-lane overtaking, safe queue merging, return-to-lane).
- R3: Adaptive Pure Pursuit & smooth path tracking ($L_d = \max(L_{\min}, k_{\text{look}} \cdot v)$, smooth spline following, no wobble/snap in 90-deg turns).
- R4: Pedestrian Dynamics & TTC Jaywalking (Time-To-Collision gap acceptance, reactive fleeing/evasion, animated passenger boarding/alighting cycles for bus stops).
- R5: Mumbai micro-behaviors & anti-deadlock resilience (auto-rickshaw gap probing, bike lane filtering, cascading horn reactions, 2-phase anti-deadlock watchdog, Three.js r128 / pools / HUD compatibility).

Follow standard orchestrator protocols: maintain BRIEFING.md and progress.md in your working directory, decompose tasks, dispatch specialist subagents, execute with high technical rigor, verify with typecheck/builds/tests/simulations, and report full handoff and victory when all acceptance criteria are met.
</USER_REQUEST>
