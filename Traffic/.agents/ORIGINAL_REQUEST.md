# Original User Request

## 2026-08-26T16:06:28Z

Implement a comprehensive, world-class upgrade to the NPC Traffic and Pedestrian AI across both vanilla JS (`npc-ai.js`, `traffic-manager.js`) and TypeScript (`src/systems/NPCAI.ts`, `src/systems/TrafficManager.ts`) stacks in the Traffic Driving Simulator.

Working directory: c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic
Integrity mode: development

## Requirements

### R1. Intelligent Driver Model (IDM) Longitudinal Physics
Replace abrupt binary braking and instantaneous speed snaps with continuous IDM acceleration and deceleration math:
- Implement dynamic desired headway calculation: $s^*(v, \Delta v) = s_0 + v T + \frac{v \Delta v}{2\sqrt{a_{\max} b}}$
- Implement acceleration equation: $a = a_{\max} [1 - (v/v_0)^\delta - (s^*/s)^2]$
- Ensure smooth deceleration curves behind queued vehicles, red signals, and pedestrian crossings.

### R2. MOBIL Game-Theoretic Lateral Lane Changing
Replace randomized lane change decisions with the MOBIL (Minimizing Overall Braking Induced by Lane changes) algorithm:
- Evaluate safety criteria (preventing target lane followers from exceeding max safe braking threshold $b_{\text{safe}}$).
- Evaluate incentive criteria factoring in driver profile politeness factors ($p$).
- Support multi-lane overtaking, safe queue merging, and return-to-lane behavior.

### R3. Adaptive Pure Pursuit & Smooth Path Tracking
Implement speed-dependent look-ahead pure pursuit trajectory following along road graph lane splines:
- Dynamically scale look-ahead distance ($L_d = \max(L_{\min}, k_{\text{look}} \cdot v)$) to eliminate corner wobble and snap turns.
- Provide smooth exponential lane-centering convergence.

### R4. Pedestrian Dynamics & TTC Jaywalking
Upgrade `PedestrianAI` with Time-To-Collision (TTC) gap acceptance:
- Evaluate oncoming vehicle approach speeds before stepping onto crosswalks or jaywalking.
- Implement reactive fleeing/evasion when vehicles or player cut within danger zones.
- Preserve animated passenger boarding/alighting cycles for bus stops.

### R5. Mumbai Micro-Behaviors & Anti-Deadlock Resilience
- Implement auto-rickshaw gap probing, bike lane filtering, and cascading horn reactions.
- Preserve and strengthen the 2-phase anti-deadlock watchdog to ensure zero permanent intersection stalls.
- Keep full compatibility with Three.js r128 rendering loop, object pools, and HUD violation tracking.

## Acceptance Criteria

### Longitudinal Stability & Realism
- [ ] Vehicles never experience instantaneous speed cuts; all deceleration follows smooth IDM braking curves.
- [ ] Traffic queues at red signals naturally compress and expand without vehicle overlap.

### Lateral Discipline & Safety
- [ ] Vehicles only initiate lane changes when the target lane follower's deceleration remains within safe limits.
- [ ] Vehicles track lane splines through 90-degree turns without clipping sidewalks or oscillating.

### Pedestrian & Public Transit Interaction
- [ ] Pedestrians cross only when safe gaps exist based on TTC or traffic signal state, and flee when threatened.
- [ ] Bus stop passenger spawn and boarding animation sequences execute seamlessly.

### Deadlock Resolution & Performance
- [ ] Intersections with simultaneous arrivals resolve within 3.5 seconds with zero permanent freeze.
- [ ] Simulation runs smoothly at 60 FPS under active traffic load (24-36 vehicles).
