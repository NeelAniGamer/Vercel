# Traffic Academy — Comprehensive Overhaul Plan

**Created:** 2026-06-30
**Target Audience:** 4-5 year old children
**Goal:** Fix all bugs, simplify UI for kids, add tutorials, polish visuals, expand to 50 levels with full Indian traffic theory coverage, and create separate Android app

> **⚠️ Audit notice (2026-07-01):** Many of the ✅ markers below predate the 2026-07-01 code audit and are stale. The audit verified which fixes are actually applied and which are not. For ground truth on what is genuinely done vs. remaining, see `AGENTS.md` "Execution Progress" section. The active implementation plan (with user decisions) is in `C:\Users\neelg\.claude\plans\overhaul-plan-read-this-file-kind-hedgehog.md`.
>
> Key audit findings:
> - Phase 0/1/2/3/4 fixes are largely genuine (the ✅ markers are correct in spirit, though some line numbers have shifted).
> - **Phase 5 "MeshToonMaterial" is NOT applied** — only `MeshPhongMaterial` / `MeshLambertMaterial` are used. Toon shading is a real remaining gap.
> - **`LEVEL_CONFIG` per-level does not exist** — levels push to `window.LVS[]` with lesson data only. The 3D world for every level comes from the hard-coded `M` table inside `_getMapConfig(lvId)` (`game_core.js:875`). Re-spec any "per-level config" work to extend the `M` table.
> - **Preloader is monolithic** — `start.js` preloads ~100+ GLBs at startup. Per-level loading is a real gap (this is the new Step 1 in the active plan).
> - **The "uploads_files_*" models are non-GLB** (`.rar`/`.zip`/`.fbx`/`.3ds`/`.obj`/`.mtl`). They need a conversion pipeline before they can be loaded.

---

## Table of Contents

1. [Execution Phases](#execution-phases)
2. [Critical Bug Fixes](#critical-bug-fixes)
3. [Building Collision](#building-collision)
4. [UI Simplification](#ui-simplification)
5. [Tutorial System](#tutorial-system)
6. [NPC AI Fixes](#npc-ai-fixes)
7. [Visual Polish](#visual-polish)
8. [Level Route Completeness](#level-route-completeness)
9. [Performance & Polish](#performance-and-polish)
10. [2D Scenario Demo (Phaser 4)](#2d-scenario-demo)
11. [Expanded 50-Level System](#expanded-50-level-system)
12. [Android App: Seerle Traffic Academy](#android-app)
13. [Browser Game UX Benchmarks](#browser-game-ux-benchmarks)
14. [Missing Features from Skill Cross-Reference](#missing-features)
15. [Performance Targets](#performance-targets)
16. [Files to Modify](#files-to-modify)

---

## Execution Phases

### Phase 0: Critical Bug Fixes (MUST DO FIRST)
### Phase 1: Building + Obstacle Collision
### Phase 2: UI Simplification for Children
### Phase 3: Tutorial System
### Phase 4: NPC AI Fixes
### Phase 5: Visual Polish
### Phase 6: Level Route Completeness
### Phase 7: Performance & Polish
### Phase 8: 2D Scenario Demo
### Phase 9: 50-Level System Expansion
### Phase 10: Android App

---

## Critical Bug Fixes

### 0.1 — `currentRoad` undefined (line 2304 in `_input()`) ✅ FIXED
- **Problem:** `currentRoad` variable used but never defined in `_input()` scope
- **Fix applied:** Define `let currentRoad = null` and loop `this.roadSegments` to find current road before use

### 0.2 — `this.levelCfg` → `this.mapCfg` (line 2267) ✅ FIXED
- **Problem:** Property name mismatch — `this.levelCfg` doesn't exist, should be `this.mapCfg`
- **Fix applied:** Changed `this.levelCfg` to `this.mapCfg` at line 2267

### 0.3 — `window.LVL_REWARD_CALLED` — DOES NOT EXIST
- **Status:** Variable not found in codebase. `completeLevel()` already has `if (!this.playing) return;` guard. No fix needed.

### 0.4 — `_buildHuman()` context bug (line 2687 in `_upeds()`)
- **Problem:** `_buildHuman()` is defined in `ui.js` but called standalone in `game_core.js` — missing `this` context
- **Fix:** Either: (a) move `_buildHuman()` into `TrafficGame` class, or (b) import via `window.TRAFFIC_UI._buildHuman()`, or (c) make it a standalone function

### 0.5 — Barricade spawn on road (lines 1912-1928) ✅ FIXED
- **Problem:** Barricades placed at `road center ± 5` — still ON the road
- **Fix applied:** Changed offset from ±5 to ±10 to place barricades on sidewalk

### 0.6 — Spawn inside barricade
- **Problem:** Player can spawn inside a barricade if random offset overlaps
- **Fix:** After spawning player, check distance to all obstacles. If too close, reposition player to next safe spawn point

### 0.7 — Obstacle cleanup near spawn (lines 1930-1937) ✅ FIXED
- **Problem:** Cleanup filter removed ALL obstacles near spawn, including buildings
- **Fix applied:** Added `!ob.userData.isBuilding` check — only removes barricades/parked vehicles, keeps buildings

### 0.8 — Rain puddles not in collision array (lines 1514-1525) ✅ FIXED
- **Problem:** Rain-level puddles created and added to scene but never pushed to `this.puddles[]` — collision check at line 2780 never fires for rain levels
- **Fix applied:** Moved `this.puddles = []` before rain puddle creation; added `this.puddles.push(p)` to rain puddle loop

### 0.9 — Procedural buildings missing userData
- **Problem:** Buildings in `this.obstacles[]` had no way to distinguish from barricades/vehicles
- **Fix applied:** Added `g.userData = { isBuilding: true }` to procedural building creation

---

## Building Collision

### 1.1 — Add `intersectRect()` helper
```javascript
function intersectRect(a, b) {
  return a.min.x <= b.max.x && a.max.x >= b.min.x &&
         a.min.z <= b.max.z && a.max.z >= b.min.z;
}
```

### 1.2 — Store bounding boxes in `_buildings[]`
- When creating buildings in `_buildCity()` (lines 1182-1227), store `THREE.Box3` per building
- Push to `this._bbs[]` array alongside `_buildings[]`

### 1.3 — AABB collision in `_uobs()` (lines 2764-2810)
- Current: point-distance check `< 1.6`
- New: AABB check for buildings, AABR (rotated rectangle) for barricades
- Push player out of collision on contact

### 1.4 — Barricade AABR collision
- Barricades are rotated rectangles — need axis-aligned rotated rectangle intersection test
- Use `intersectRect()` after rotating barricade bounding box to align with world axes

---

## UI Simplification

### 2.1 — Fix z-index overlap
- 47 z-index declarations in Driving.html
- Mobile CSS overrides create left-column pileup
- Consolidate to max 10 z-index levels

### 2.2 — Large visual objective cards
- Replace text-heavy task list with big visual cards (emoji + 3 words max)
- Minimum 48px touch targets (Apple HIG)
- Color-coded by task type: green=go, red=stop, yellow=caution

### 2.3 — Progressive HUD
- Level 1-5: Show only speed + objective
- Level 6-15: Add minimap
- Level 16+: Show full HUD

### 2.4 — Simplified controls
- Default: just steering + accelerator + brake
- Advanced controls (signals, horn, lights) unlock gradually
- Visual indicators show which buttons are active

### 2.5 — Touch-friendly layout
- Steering: large left/right arrows or tilt-to-steer
- Speed: single gas pedal button (no manual acceleration)
- Actions: context-sensitive action button (appears only when needed)

---

## Tutorial System

### 3.1 — First-level overlay
- When player starts Level 1 for first time, show step-by-step overlay
- Animated hand indicator pointing to controls
- "Tap here to steer" → "Tap here to go" → "Tap here for actions"

### 3.2 — Progressive unlock
- Level 1-3: Steering + gas only
- Level 4-6: Add brake
- Level 7-9: Add horn
- Level 10+: Add signals/lights/seatbelt

### 3.3 — Reminder tooltips
- If player hasn't used a control in 30 seconds, show gentle reminder
- "Don't forget to check your mirrors!" (visual, not text)

### 3.4 — Visual demonstrations
- Each level starts with a 5-second animation showing what to do
- Emoji-based instructions: 🚗 → 🛑 → ✅

---

## NPC AI Fixes

### 4.1 — Stuck timer too aggressive
- Current: 1.5 seconds → resets position to origin
- Fix: Increase to 3 seconds, add "try other direction" before reset

### 4.2 — Smooth route wrapping
- NPCs jump when reaching end of route
- Fix: Smoothly loop back to start with easing

### 4.3 — Better lane filtering
- NPCs sometimes drive on sidewalk or wrong lane
- Fix: Add lane boundary check before selecting lateral target

### 4.4 — Traffic light obedience
- NPCs should slow down at yellow, stop at red
- Current: only some NPCs obey lights
- Fix: All NPCs check `trafficLights[]` state before proceeding

---

## Visual Polish

### 5.1 — MeshToonMaterial
- Switch from MeshStandardMaterial to MeshToonMaterial for cartoon look
- Apply to buildings, vehicles, characters

### 5.2 — Color-coded surfaces
- Road: dark gray (`#3d3f45`)
- Sidewalk: light gray (`#8a8a8a`)
- Grass: green (`#4a7c3f`)
- Building bases: brown (`#8b6f47`)

### 5.3 — Reduce vehicle sizes 30%
- Cars too big relative to buildings
- Scale down `VEHICLE_STATS[].scale` by 0.7

### 5.4 — Better lighting
- Ambient light: warm daylight
- Directional light: soft shadows
- Point lights: street lamps at night

### 5.5 — Character completion
- `_buildHuman()` in ui.js:1471 — add body, arms, legs, head
- Use existing GLB models when available, procedural fallback

### 5.6 — Camera shake on collision/brake
- Add `_shakeT` accumulator to `TrafficGame`
- On collision: `_shakeT = 0.3`
- On hard brake: `_shakeT = 0.1`
- In `_ucam()`: apply offset to `camera.position` with decay

---

## Level Route Completeness

### 6.1 — Multi-point routes
- Each level needs at least 3-5 waypoints
- Routes should form interesting paths (curves, intersections)

### 6.2 — Level-specific layouts
- Level 1: Simple straight road
- Level 5: Intersection with traffic light
- Level 10: Highway with overpass
- Level 20: Complex city grid

### 6.3 — Rain/puddle effects
- When `weather.rain = true`:
  - Add puddle meshes at low points
  - Slow player speed by 20%
  - Add splash particle effect

### 6.4 — Night mode headlights
- When `weather.night = true`:
  - Dim ambient light
  - Enable vehicle headlights (spotlights)
- Limited visibility radius

---

## Performance & Polish

### 7.1 — Object pooling
- Pre-create 20 NPC vehicles, 50 pedestrians
- Reuse instead of creating/destroying each frame

### 7.2 — Frustum culling
- Only render objects inside camera frustum
- Three.js does this automatically for meshes

### 7.3 — Draw call batching
- Merge static geometry (buildings, roads)
- Use `InstancedMesh` for repeated objects

### 7.4 — Camera transitions
- Smooth camera movement between views
- Use lerp for position, slerp for rotation

### 7.5 — Audio categories
- Music: background loop
- SFX: horn, crash, engine
- Voice: tutorial narration (optional)

---

## 2D Scenario Demo

### Phaser 4 Integration in academy.html

**Purpose:** Quick visual demo of traffic scenarios without full 3D engine
**Target:** Mobile browsers, lightweight

#### Features:
- 2D top-down or side-view traffic scenarios
- Tap to interact (stop at light, avoid obstacle)
- Score tracking
- Progress saved to localStorage

#### Implementation:
1. Add Phaser 4 via CDN
2. Create `Phaser.Game` instance in academy.html
3. Scenes: Menu, Scenario, Results
4. Each scenario: 10-30 seconds gameplay
5. Visual style: colorful, cartoon, large sprites

---

## Expanded 50-Level System

### Tier Structure

| Tier | Levels | Theme | Difficulty |
|------|--------|-------|------------|
| 1 | 1-10 | Basic Rules | ⭐ |
| 2 | 11-20 | Intermediate Rules | ⭐⭐ |
| 3 | 21-30 | Advanced Rules | ⭐⭐⭐ |
| 4 | 31-40 | Expert Rules | ⭐⭐⭐⭐ |
| 5 | 41-50 | Bonus/Special | ⭐⭐⭐⭐⭐ |

### Task Types
- `stop` — Stop at location/for object
- `avoid` — Don't hit/go too fast
- `reach` — Get to destination
- `toggle` — Activate something (indicators, headlights, seatbelt, helmet)

### Car Unlock Progression
Every 5 levels unlock new vehicle:
1. Level 1: Car (basic)
2. Level 5: Auto-rickshaw
3. Level 10: School bus
4. Level 15: Taxi
5. Level 20: Truck
6. Level 25: Ambulance
7. Level 30: Bike
8. Level 35: SUV
9. Level 40: Police car
10. Level 45: Sports car

### Star Rating
- ⭐ = Complete level
- ⭐⭐ = Complete under time limit
- ⭐⭐⭐ = Complete under time + no collisions

---

### TIER 1: BASIC RULES (Levels 1-10)

#### Level 1: "Red Light, Green Light!"
- **Icon:** 🚦
- **Tasks:** stop at red, go at green, avoid speeding
- **Theory:** Traffic lights — red=stop, yellow=wait, green=go
- **Law:** MV Act Section 119 — Disobeying Traffic Signal (₹1000-₹5000)

#### Level 2: "Crosswalk Hero!"
- **Icon:** 🚶
- **Tasks:** stop at zebra crossing, let pedestrian cross, proceed when clear
- **Theory:** Zebra crossings — pedestrians have right of way
- **Law:** MV Act Section 123 — Pedestrian Right of Way

#### Level 3: "Speed Limit City!"
- **Icon:** 🏎️
- **Tasks:** stay under speed limit, slow down in school zone, stop at sign
- **Theory:** Speed limits vary by zone — school=20, residential=30, city=50
- **Law:** MV Act Section 183 — Speeding (₹500-₹2000)

#### Level 4: "Stop Sign Sam!"
- **Icon:** 🛑
- **Tasks:** full stop at stop sign, check both ways, proceed when safe
- **Theory:** Stop signs — come to complete stop, not just slow down
- **Law:** MV Act Section 118 — Disobeying Stop Sign

#### Level 5: "Turn Signal Twist!"
- **Icon:** ↔️
- **Tasks:** activate turn signal before turning, cancel after turn, follow lane
- **Theory:** Signals mandatory before turning/changing lanes
- **Law:** MV Act Section 114 — Signals by Driver

#### Level 6: "Horn Rule!"
- **Icon:** 🔊
- **Tasks:** honk at blind corner only, avoid honking near hospital, pass quietly
- **Theory:** Horn use — allowed at blind corners, prohibited near hospitals/schools
- **Law:** MV Act Section 118 — Sound Horn Restrictions

#### Level 7: "Seat Belt Buddy!"
- **Icon:** 🪢
- **Tasks:** toggle seatbelt on, keep it on throughout drive, reach destination
- **Theory:** Seatbelts mandatory for driver and front passenger
- **Law:** MV Act Section 138 — Seat Belt Rule (₹1000 fine)

#### Level 8: "Helmet Hero!"
- **Icon:** ⛑️
- **Tasks:** toggle helmet on before riding, keep it on, reach destination
- **Theory:** Helmets mandatory for two-wheeler riders
- **Law:** MV Act Section 129 — Helmet Rule (₹1000 fine)

#### Level 9: "Right of Way!"
- **Icon:** ↔️
- **Tasks:** yield to vehicle on main road, check mirrors, merge safely
- **Theory:** Right of way — main road has priority, merge carefully
- **Law:** MV Act Section 117 — Driving Without Due Care

#### Level 10: "Mirror Check!"
- **Icon:** 🪞
- **Tasks:** check rearview before starting, check side mirrors before lane change, reach destination
- **Theory:** Mirror usage — check before every maneuver
- **Law:** MV Act Section 117 — Negligent Driving

---

### TIER 2: INTERMEDIATE RULES (Levels 11-20)

#### Level 11: "Roundabout Rondo!"
- **Icon:** 🔵
- **Tasks:** yield to traffic inside roundabout, exit at correct lane, reach destination
- **Theory:** Roundabouts — enter from left, yield to inside traffic
- **Law:** MV Act Section 120 — Roundabout Rules

#### Level 12: "Overtaking Ouch!"
- **Icon:** ⬅️
- **Tasks:** check mirrors before overtaking, signal left, pass safely, return to lane
- **Theory:** Overtaking — only from right in India, signal before returning
- **Law:** MV Act Section 115 — Overtaking Rules

#### Level 13: "Emergency Lane!"
- **Icon:** 🚑
- **Tasks:** hear ambulance, pull over left, wait for it to pass, resume drive
- **Theory:** Emergency vehicles have absolute priority
- **Law:** MV Act Section 119A — Yielding to Emergency Vehicles (₹10000 fine)

#### Level 14: "School Zone!"
- **Icon:** 🏫
- **Tasks:** slow to 20km/h, watch for children, stop if child crosses
- **Theory:** School zones have lowest speed limits, children unpredictable
- **Law:** MV Act Section 183 — School Zone Speed (₹2000 fine)

#### Level 15: "Railway Gate!"
- **Icon:** 🚂
- **Tasks:** stop at red flashing, wait for barrier to rise, proceed when clear
- **Theory:** Railway crossings — never jump the barrier
- **Law:** MV Act Section 119 — Railway Crossing (₹5000-₹10000 fine)

#### Level 16: "Highway Merge!"
- **Icon:** 🛣️
- **Tasks:** signal before merging, match highway speed, check blind spot, merge
- **Theory:** Highway merging — accelerate to match, don't stop at on-ramp
- **Law:** MV Act Section 117 — Unsafe Lane Change

#### Level 17: "Night Drive!"
- **Icon:** 🌙
- **Tasks:** toggle headlights on, use low beam, avoid blinding oncoming, reach destination
- **Theory:** Night driving — low beam in city, high beam on empty highways
- **Law:** MV Act Section 112 — Headlight Usage

#### Level 18: "Rainy Day!"
- **Icon:** 🌧️
- **Tasks:** slow down, avoid puddles near pedestrians, increase following distance
- **Theory:** Rain reduces grip, increase following distance, avoid splashing
- **Law:** MV Act Section 117 — Driving in Adverse Weather

#### Level 19: "Parking Problems!"
- **Icon:** 🅿️
- **Tasks:** find legal parking zone, avoid fire hydrant area, park in designated spot
- **Theory:** Legal parking — blue 'P' sign only, no hydrants/bus stops
- **Law:** MV Act Section 122 — Illegal Parking (₹500-₹2000)

#### Level 20: "Fuel Efficiency!"
- **Icon:** ⛽
- **Tasks:** smooth acceleration, avoid hard braking, maintain steady speed
- **Theory:** Fuel efficiency — smooth driving saves fuel
- **Law:** MV Act Section 117 — Efficient Driving

---

### TIER 3: ADVANCED RULES (Levels 21-30)

#### Level 21: "U-Turn U-Turn!"
- **Icon:** 🔄
- **Tasks:** find U-turn spot, signal before turning, yield to oncoming, complete turn
- **Theory:** U-turns only at designated spots, signal and yield
- **Law:** MV Act Section 120 — U-Turn Rules

#### Level 22: "Unmarked Crosswalk!"
- **Icon:** 🚶
- **Tasks:** stop at intersection for pedestrian, even without zebra lines, proceed
- **Theory:** Pedestrians have right of way at all intersections
- **Law:** MV Act Section 123 — Pedestrian Priority

#### Level 23: "Bus Stop Patrol!"
- **Icon:** 🚌
- **Tasks:** wait behind stopped bus, don't overtake at bus stop, proceed after bus moves
- **Theory:** Don't overtake at bus stops — passengers may cross
- **Law:** MV Act Section 117 — Bus Stop Overtaking

#### Level 24: "Construction Zone!"
- **Icon:** 🚧
- **Tasks:** slow down, follow detour signs, obey flagman, exit zone safely
- **Theory:** Construction zones have strict speed limits, follow temporary signs
- **Law:** MV Act Section 117 — Construction Zone (₹5000 fine)

#### Level 25: "Know Your Signs!"
- **Icon:** 🔶
- **Tasks:** obey blue mandatory sign, react to red cautionary sign, read green info sign
- **Theory:** Three sign types — blue (mandatory), red (caution), green (info)
- **Law:** MV Act Section 116 — Ignoring Road Signs (₹500-₹2000)

#### Level 26: "Cows on the Road!"
- **Icon:** 🐄
- **Tasks:** stop for cow, don't honk, wait patiently, pass when clear
- **Theory:** Cows protected in India — don't honk, wait
- **Law:** MV Act Section 117 & Animal Protection

#### Level 27: "Narrow Street!"
- **Icon:** 🏘️
- **Tasks:** crawl at walking pace, find gap for oncoming auto, let auto pass, exit
- **Theory:** Narrow streets — crawling speed, yield to oncoming
- **Law:** MV Act Section 117 — Driving Without Due Care

#### Level 28: "Parking Rules!"
- **Icon:** 🅿️
- **Tasks:** avoid hydrant area, find parking zone, park correctly, walk to destination
- **Theory:** Parking zones marked with blue 'P', never park near hydrants
- **Law:** MV Act Section 122 — Illegal Parking

#### Level 29: "Auto-Rickshaw Dance!"
- **Icon:** 🛺
- **Tasks:** keep safe distance, react to auto stopping, reach destination
- **Theory:** Auto-rickshaws unpredictable — maintain distance
- **Law:** MV Act Section 117 — Failing to Maintain Safe Distance

#### Level 30: "Toll Plaza!"
- **Icon:** 💳
- **Tasks:** slow down, choose correct lane, stop at booth, pay and go
- **Theory:** Toll plazas — FASTag or cash lanes, stop at booth
- **Law:** National Highway Authority Rules — Toll Evasion (₹500-₹5000)

---

### TIER 4: EXPERT RULES (Levels 31-40)

#### Level 31: "Blind Corner!"
- **Icon:** 👁️
- **Tasks:** honk once to warn, crawl around corner, yield to oncoming, exit safely
- **Theory:** Blind corners — honk once (rare correct use), crawl
- **Law:** MV Act Section 117-118 — Blind Corner Warning

#### Level 32: "Hill Driving!"
- **Icon:** ⛰️
- **Tasks:** use low gear uphill, honk at hairpin bend, engine brake downhill, reach top
- **Theory:** Hill driving — low gear up, engine brake down, honk at bends
- **Law:** MV Act Section 117 — Dangerous Hill Driving (₹1000-₹5000)

#### Level 33: "Bus Stop Yield!"
- **Icon:** 🚌
- **Tasks:** wait behind bus, don't overtake, proceed after bus moves
- **Theory:** Bus stops — passengers may cross, don't overtake
- **Law:** MV Act Section 117 — Dangerous Driving Near Bus Stop

#### Level 34: "Construction Zone!"
- **Icon:** 🚧
- **Tasks:** slow down, follow detour, obey flagman, exit zone
- **Theory:** Construction zones — strict limits, temporary signs
- **Law:** MV Act Section 117 — Construction Zone (₹5000)

#### Level 35: "One-Way Wonder!"
- **Icon:** ➡️
- **Tasks:** enter one-way from correct end, follow flow, exit at intersection
- **Theory:** One-way streets — never go against traffic
- **Law:** MV Act Section 119 — One-Way Rules

#### Level 36: "Sign Recognition!"
- **Icon:** 🔶
- **Tasks:** identify mandatory, cautionary, and informational signs; obey each
- **Theory:** Sign colors — blue (mandatory), red (caution), green (info)
- **Law:** MV Act Section 116 — Ignoring Road Signs

#### Level 37: "Hospital Quiet Zone!"
- **Icon:** 🏥
- **Tasks:** no honking, slow down, watch for ambulance, exit quietly
- **Theory:** Hospital zones — absolutely no honking
- **Law:** MV Act Section 118 — Hospital Zone Silence

#### Level 38: "Festival Traffic!"
- **Icon:** 🎉
- **Tasks:** expect crowds, follow diversion, yield to procession, reach destination
- **Theory:** Festivals create unusual traffic patterns
- **Law:** MV Act Section 117 — Festival Traffic

#### Level 39: "Cyclist Safety!"
- **Icon:** 🚲
- **Tasks:** give 1m space when passing, don't overtake near intersection, wait for clear
- **Theory:** Cyclists need space — 1m minimum passing distance
- **Law:** MV Act Section 117 — Cyclist Safety

#### Level 40: "Grand Test!"
- **Icon:** 🏆
- **Tasks:** apply all skills from previous 39 levels, complete complex route
- **Theory:** Comprehensive review of all traffic rules
- **Law:** All MV Act sections

---

### TIER 5: BONUS/SPECIAL (Levels 41-50)

#### Level 41: "First Aid Scene!"
- **Icon:** 🩹
- **Tasks:** stop at accident scene, call for help, wait for ambulance, don't crowd
- **Theory:** First response — stop, help, don't crowd accident
- **Law:** MV Act Section 134 — Duty in Case of Accident

#### Level 42: "Road Rage!"
- **Icon:** 😡
- **Tasks:** ignore provocation, stay calm, don't engage, reach destination safely
- **Theory:** Road rage — stay calm, don't retaliate
- **Law:** MV Act Section 117 — Aggressive Driving

#### Level 43: "Pollution Check!"
- **Icon:** 💨
- **Tasks:** get PUC certificate, show at checkpoint, maintain emissions
- **Theory:** Pollution Under Control certificate mandatory
- **Law:** MV Act Section 190 — PUC Certificate (₹10000 fine)

#### Level 44: "Child Safety!"
- **Icon:** 👶
- **Tasks:** install child seat, buckle child, drive safely, reach destination
- **Theory:** Children under 12 must use child seat, never front seat
- **Law:** MV Act Section 129 — Child Safety

#### Level 45: "Passenger Safety!"
- **Icon:** 🪢
- **Tasks:** ensure all passengers seatbelted, check before moving, drive carefully
- **Theory:** Driver responsible for passenger safety
- **Law:** MV Act Section 138 — Seat Belt Rule

#### Level 46: "Weather Emergency!"
- **Icon:** ⛈️
- **Tasks:** heavy rain/fog, pull over safely, wait for conditions, resume
- **Theory:** Extreme weather — pull over, don't risk it
- **Law:** MV Act Section 117 — Adverse Weather

#### Level 47: "Night Parking!"
- **Icon:** 🌙
- **Tasks:** park in well-lit area, use parking lights, lock vehicle, walk safely
- **Theory:** Night parking — well-lit areas only
- **Law:** MV Act Section 122 — Parking Rules

#### Level 48: "Trip Preparation!"
- **Icon:** 🗺️
- **Tasks:** check vehicle condition, plan route, carry emergency kit, start journey
- **Theory:** Trip prep — vehicle check, route planning, emergency kit
- **Law:** MV Act Section 117 — Vehicle Fitness

#### Level 49: "City Navigation!"
- **Icon:** 🏙️
- **Tasks:** follow route through complex city, obey all signals, avoid obstacles
- **Theory:** City driving — constant awareness, multiple rules simultaneously
- **Law:** All MV Act sections

#### Level 50: "Comprehensive Final Exam!"
- **Icon:** 🎓
- **Tasks:** complete 10-question theory test, drive complex route, demonstrate all skills
- **Theory:** Final comprehensive test of all 50 levels
- **Law:** All MV Act sections — Grand Review

---

## Android App

### Seerle Traffic Academy — React Native/Expo

**Why React Native/Expo:**
- Best performance-to-development-speed ratio
- Code reuse from web version (game logic, level data)
- Mature ecosystem, easy Play Store deployment
- Expo simplifies builds and OTA updates

### Features:
- Port all 50 levels from web version
- Touch-optimized controls (steering, gas, brake)
- Offline gameplay (no internet required)
- Progress saved locally
- Parental controls (time limits)
- Achievement system

### Tech Stack:
- React Native + Expo SDK
- Three.js for 3D (via expo-three)
- AsyncStorage for progress
- React Navigation for screens

---

## Browser Game UX Benchmarks

### Poki.com Guidelines
- **First 3 seconds:** Gameplay must start instantly
- **Visual-only tutorials:** No text blocks, show don't tell
- **Dopamine loops:** Score → star → unlock → next level
- **10 seconds per level** for kids (our levels: 30-120 seconds)
- **3-5 second tutorial overlay** with animated hand
- **48px minimum touch targets**

### Drive Mad Pattern
- 100 hand-crafted levels
- Instant restart on failure
- "One more try" addictiveness
- Simple one-finger controls

### MR RACER Pattern
- Near-miss scoring: +5/10/50 for distance thresholds
- Speed boosts for clean driving
- Traffic weaving rewards

### Traffic Rush Pattern
- Swipe to switch lanes
- Collect coins for points
- Avoid crashes at all costs

---

## Missing Features from Skill Cross-Reference

### 1. Obstacle AABR Collision
- **Current:** Point-distance `< 1.6` (line 2770-2804)
- **Needed:** AABB for buildings, rotated rectangle (AABR) for barricades
- **Helper:** `intersectRect()` function

### 2. Camera Shake on Collision/Brake
- **Current:** No shake effect
- **Needed:** `_shakeT` accumulator with decay
- **Implementation:** Apply offset to `camera.position` in `_ucam()`

### 3. Level 3D World Definitions
- **Current:** Existing 20 levels use `window.LVS[]` format only
- **Needed:** `LEVEL_CONFIG` format with `roads`, `route`, `spawn`, `npcs`, `trafficLights`
- **Scope:** Levels 1-20 need upgrade, levels 21-50 need full definitions

---

## Performance Targets

| Platform | FPS | Triangles | Draw Calls |
|----------|-----|-----------|------------|
| Desktop | 60 | 500K | 200 |
| Mobile (High) | 60 | 200K | 100 |
| Mobile (Mid) | 30 | 100K | 50 |
| Mobile (Low) | 30 | 50K | 30 |

---

## Files to Modify

| File | Changes |
|------|---------|
| `game_core.js` | Bug fixes (0.1-0.7), collision (1.1-1.4), NPC AI (4.1-4.4), camera shake (5.6), performance (7.1-7.5) |
| `ui.js` | Character completion (5.5), HUD simplification (2.1-2.5) |
| `Driving.html` | Z-index fixes (2.1), touch layout (2.5), controls (2.4) |
| `course.js` | Level definitions (6.1-6.4) |
| `levels/*.js` | Add 3D world configs for levels 21-50 |
| `academy.html` | Phaser 4 scenario demo (Phase 8) |
| `start.js` | Asset loading optimization, tutorial triggers |

---


Execution Plan — Traffic Academy Overhaul
Phase 0: Critical Bug Fixes (Must-Do First)
These crash the game or cause incorrect behavior every frame:
#	Bug	Location	Fix
0.1	currentRoad undefined — used at line 2304 but never declared	_input() near line 2304	Compute from this.roadSegments using player position: find nearest road segment
0.2	this.levelCfg should be this.mapCfg	line 2267	Replace this.levelCfg → this.mapCfg
0.3	Barricades spawn ON the road	lines 1912-1928	Offset barricades to sidewalk edges (±5 → ±9-12 from road center)
0.4	Player spawns 20 units ahead of route start, but obstacle cleanup checks route start	lines 1930-1937	Fix filter to use actual spawn position
0.5	window.LVL_REWARD_CALLED referenced but never declared as class property	line ~525	Add to _actualStart() initialization
0.6	_buildHuman() called as standalone function in _upeds() (line 2687) but defined in ui.js	_upeds()	Verify _buildHuman is global or use ui._buildHuman()
Phase 1: Building Collision
#	Task	Detail
1.1	Store building bounding boxes	When drawBldg() creates procedural buildings, compute and store Box3 in userData
1.2	Store instanced building bounding boxes	For InstancedMesh buildings, extract per-instance AABB from matrix transforms
1.3	AABB push-out in _uobs()	Replace point-distance check with proper AABB containment test — push player out of overlapping buildings
1.4	Prop collision sizing	Benches, trees, bus stops, stalls already in this.obstacles — verify their positions aren't on-road
Phase 2: UI Simplification for 4-5 Year Olds
#	Task	Detail
2.1	Fix z-index layering	Consolidate: #hud:10, #hudbar:11, #task-tracker:12, #objective-overlay:15, #pause-overlay:50
2.2	Large visual objective cards	Replace text-heavy objectives with icon+color cards (big green checkmark, red X, yellow warning)
2.3	Progressive HUD	Start with minimal HUD (just timer + objective), reveal buttons/features as level progresses
2.4	Mobile touch targets	Minimum 48px for all interactive elements, remove overlapping left-column buttons
2.5	Simplified gear/controls	Show gear selector only for driving levels, hide unused buttons
Phase 3: Tutorial System
#	Task	Detail
3.1	First-level tutorial overlay	Step-by-step modal: "Tap the green pedal to move!" → "Turn with arrows!" → "Stop at red light!"
3.2	Animated hand indicator	Show a pulsing hand icon pointing at the control being taught
3.3	Progressive unlock	Level 1: gas + brake only. Level 2: add turning. Level 3: add signals. Etc.
3.4	Reminder tooltips	If player hasn't used a control after 10 seconds, show a gentle hint
Phase 4: NPC AI Fixes ✅ COMPLETE
#	Task	Detail
4.1	Increase stuck detection timer	✅ Added 3s timer + teleport-back-to-base in _unpcs()
4.2	Smooth route wrapping	✅ Already implemented (lerp over 1.2s with _wrapT)
4.3	Better lane filtering	✅ Lane target clamped to [-6, 6] to prevent road drift
4.4	Traffic light obedience for all NPCs	✅ Detection range tightened from 30m → 15m on all 4 directional checks
Phase 5: Visual Polish (Child-Friendly)
#	Task	Detail
5.1	MeshToonMaterial swap	Replace MeshLambertMaterial/MeshPhongMaterial with MeshToonMaterial for cartoon look
5.2	Color-coded surfaces	Road: dark grey #3d3f45, Sidewalk: light grey #8a8a8a, Grass: green #3a9a3a
5.3	Reduce vehicle sizes	Scale _makeNPC geometries down ~30%
5.4	Better lighting	Add HemisphereLight (sky/ground) + soft DirectionalLight with shadows
5.5	Character completion	Ensure player human model shows full body (head, torso, arms, legs) in pedestrian mode
Phase 6: Level Route Completeness
#	Task	Detail
6.1	Add multi-point routes to _getMapConfig()	Each level should have 4+ route waypoints, not single-point degenerate routes
6.2	Level-specific road layouts	Each level gets unique road grid from course.js task definitions
6.3	Rain/puddle visual effects	Actual water splash particles, not just penalty zones
6.4	Night mode headlights	Player vehicle emits a cone light at night
Phase 7: Performance & Polish
#	Task	Detail
7.1	Object pooling for NPCs	Pre-allocate and reuse NPC meshes instead of create/destroy
7.2	Frustum culling	Already partially done (mobile LOD at line 1332) — extend to desktop
7.3	Draw call batching	Merge static props into InstancedMeshes
7.4	Camera transitions	Smooth lerp when entering/exiting vehicles
7.5	Audio category system	Group sounds (engine, ambient, UI, SFX) with independent volume

Final Execution Plan
Phase 1: Critical Bug Fixes (Start Here)
1. Fix currentRoad undefined at game_core.js:2304 — add fallback or define properly
2. Fix this.levelCfg → this.mapCfg at game_core.js:2267
3. Fix window.LVL_REWARD_CALLED — declare at top of _showReward() or use local var
4. Fix barricade spawn — change ±5 to ±10 at lines 1912-1928 so they land on sidewalks
5. Fix obstacle cleanup filter — check distance to actual obstacle position, not route start
6. Fix spawn-inside-barricade — check player spawn point against barricade positions
Phase 2: Building Collision
- Add AABB collision in _uobs() using THREE.Box3
- Store building meshes in this.buildings[] array
- Check collision before allowing player movement through buildings
Phase 3: UI Simplification (4-5 Year Olds)
- Fix z-index layering pileup (47 declarations → consolidate)
- Large visual objective cards (icons, not text)
- Progressive HUD reveal (show basic controls first)
- 44px+ touch targets
- Color-code road (dark grey) vs sidewalk (light green/grey)
Phase 4: Tutorial System
- First-time modal popups with animated hand icons
- Step-by-step control guide
- Progressive level unlock
Phase 5: NPC & Vehicle Fixes ✅ COMPLETE
- Increase stuck timer 1.5s → 3s ✅
- Smoother route following ✅ (already implemented)
- Reduce vehicle sizes ~30-40%
- Fix character rendering in pedestrian mode (ui.js:1471)
Phase 6: 2D Scenario Demo
- Canvas 2D API implementation in academy.html
- Simple traffic scenario visualization
- Lightweight, no Three.js dependency
Phase 7: Level Route Completeness
- Fix degenerate single-point routes in levels
- Ensure all levels have proper waypoints
Phase 8: Android App — Seerle Traffic Academy
- React Native/Expo setup (best balance of performance + code reuse)
- Port core game logic from web
- Android-specific optimizations
- App store assets

TRAFFIC ACADEMY OVERHAUL — COMPLETE PLAN
Overview
Overhaul the Traffic driving simulator for 4-5 year old children, plus create a separate Android app "Seerle Traffic Academy".
Two deliverables:
1. Web game overhaul in existing codebase
2. Standalone Android app (React Native/Expo)
Phase 1: Critical Bug Fixes
#	Bug	File:Line	Fix
1	currentRoad undefined	game_core.js:2304	Define currentRoad via this._findRoadAtPlayer() or add null guard
2	this.levelCfg should be this.mapCfg	game_core.js:2267	Replace all this.levelCfg refs with this.mapCfg
3	window.LVL_REWARD_CALLED undeclared	game_core.js:~525	Declare as let at top of reward function or use local variable
4	Barricades spawn ON road	game_core.js:1912-1928	Change offset from ±5 to ±10 so they land on sidewalks
5	Obstacle cleanup checks wrong position	game_core.js:1930-1937	Check distance to obstacle's actual position, not route start
6	Player spawns inside barricades	game_core.js	Validate spawn point against barricade positions before placing
7	this._makeNPC undefined in some code paths	game_core.js	Ensure _makeNPC() is always called on this context
Verification: After fixes, run game through levels 1-5 without errors in console.
Phase 2: Building Collision System
- Add AABB collision detection in _uobs() using THREE.Box3
- Store building meshes in this.buildings[] array during spawn
- Compute bounding box per building at spawn time
- Check player movement against all building AABBs before allowing
- Push player out of collision on overlap
- Also check NPC vehicles against buildings
Target: Player cannot drive through buildings; NPCs cannot drive through buildings.
Phase 3: UI Simplification (4-5 Year Olds)
3A: Fix Z-Index Layering
- Audit all 47 z-index declarations in Driving.html
- Consolidate into layers: game canvas (0), minimap (10), HUD (20), menus (30), modals (40)
- Remove redundant overrides
3B: Large Visual Objective Cards
- Replace text objectives with large icon cards (car icon, pedestrian icon, traffic light icon)
- Minimum 80px icon size
- Show one objective at a time (not all at once)
3C: Progressive HUD Reveal
- Level 1: Show only steering + accelerator
- Level 2: Add brake
- Level 3: Add traffic light indicator
- Level 5+: Show full HUD
- Store unlock state in localStorage
3D: Touch Target Sizing
- All interactive buttons: minimum 44x44px (WCAG AAA for children)
- Add 8px padding around all touch targets
- Test with child-sized finger touch simulation
3E: Color-Coded Road vs Sidewalk
- Road surface: MeshStandardMaterial({ color: 0x3d3f45, roughness: 0.8 })
- Sidewalk: MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.6 })
- Grass/verge: MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.9 })
- Update in game_core.js where road/sidewalk meshes are created
Phase 4: Tutorial System
4A: First-Time Modal Popups
- On first play: show step-by-step animated tutorial
- Hand icon pointing to controls
- "Tap here to go" pointing to accelerator
- "Swipe to steer" with animation
- Store completion in localStorage('tutorial_complete')
4B: Progressive Level Guidance
- Each level starts with 3-second objective card
- Animated arrow pointing to first action
- Pause game until player acknowledges tutorial
4C: In-Game Hints
- If player idle >5 seconds: show hint ("Tap the green button to go!")
- If player going wrong way: show arrow back to route
- If player stuck >10 seconds: offer restart option
Phase 5: NPC & Vehicle Fixes
5A: NPC AI Improvements
- Increase stuck timer from 1.5s → 3s (game_core.js:~2500)
- Add smooth steering interpolation (lerp lateral position)
- Add traffic light obedience to _unnpcs() state machine
- Fix NPC spawning inside barricades
5B: Vehicle Size Reduction
- Reduce all _makeNPC() geometries by 30-40%
- Scale: cars from 1.0 → 0.6, buses from 1.0 → 0.5
- Keep visual proportions correct
5C: Character Rendering Fix
- _buildHuman() at ui.js:1471 — ensure full model loads
- Check for missing GLB parts
- Add fallback procedural body if GLB incomplete
- Show walking animation in pedestrian mode
Phase 6: 2D Scenario Demo (Phaser 4)
6A: Setup
- Add Phaser 4 via CDN: https://cdn.jsdelivr.net/npm/phaser@4/dist/phaser.min.js
- Create new file: scenario2d.js — Phaser game config
- Replace broken 3D scenario in academy.html with 2D canvas
6B: 2D Scenario Features
- Top-down 2D view of intersection
- Animated car sprites (simple colored rectangles → sprites)
- Traffic light state visualization (red/yellow/green circles)
- Pedestrian crossing animation
- Touch/click to control flow
- Score: "How many cars passed safely?"
6C: Integration
- Load scenario2d.js in academy.html
- Replace Three.js 3D scenario container with Phaser canvas
- Keep same lesson data structure from course.js
- Export same completion callbacks
6D: Performance
- Canvas 2D fallback for low-end devices
- 60fps target on mobile
- Sprite batching for multiple cars
- Simple AABB collision for 2D
Phase 7: Level Route Completeness
- Audit all 20 levels for degenerate single-point routes
- Add minimum 5 waypoints per level
- Ensure routes form logical paths through the map
- Fix levels where spawn point is inside a building
- Verify traffic light positions match intersections
Phase 8: Visual Polish
8A: Camera Transitions
- Smooth lerp between camera positions on level start
- No jarring cuts
- Add slight camera shake on collision
8B: Particle Effects
- Dust particles when braking
- Spark on collision
- Confetti on level completion
8C: Lighting
- Consistent directional light
- Add ambient occlusion feel with hemisphere light
- Night mode: blue-tinted lighting + headlight cones
8D: Audio (Basic)
- Engine sound loop (Web Audio API)
- Collision impact sound
- Level complete jingle
- Traffic light change beep
Phase 9: Performance Optimization
9A: Object Pooling
- Pre-allocate NPC vehicle pool (max 10)
- Reuse meshes instead of creating/destroying
- Pool obstacle instances
9B: Rendering Optimization
- Frustum culling (Three.js default, verify enabled)
- Merge static geometry (buildings, roads)
- Use InstancedMesh for repeated objects (trees, benches)
- Target: Desktop 60fps/500K triangles, Mobile 30fps/100K triangles
9C: Memory Management
- Dispose unused geometries/materials
- Limit texture sizes to 1024px max on mobile
- Use LOD for distant objects
Phase 10: Seerle Traffic Academy Android App
10A: Tech Stack Decision
- React Native + Expo (best balance of performance + code reuse)
- Expo managed workflow for simplicity
- EAS Build for APK generation
10B: Project Setup
- npx create-expo-app SeerleTrafficAcademy
- Configure app.json (name: "Seerle Traffic Academy", package: com.seerle.trafficacademy)
- Set up navigation (React Navigation)
- Set up state management (Zustand or Context)
10C: Port Core Game Logic
- Port game_core.js physics/collision to TypeScript
- Port VEHICLE_STATS and vehicle system
- Port level data from levels/level*.js
- Port tutorial system from Phase 4
- Port UI/HUD adapted for mobile (React Native components)
10D: Android-Specific Features
- Haptic feedback on collision/completion
- Native share intent (share score)
- App shortcuts (quick play level 1)
- Adaptive icons
- Splash screen
10E: 2D Scenario Demo (Mobile)
- Use react-native-canvas or Expo's GLView
- Or: wrap Phaser game in WebView for simplicity
- Keep same gameplay as web 2D demo
10F: Build & Release
- eas build --platform android --profile preview for APK
- eas build --platform android --profile production for Play Store
- Configure Play Store listing (screenshots, description, age rating: 4+)
- Privacy policy for children's app (COPPA compliance)
10G: App Store Assets
- App icon (1024x1024)
- Feature graphic (1024x500)
- Screenshots (phone + tablet)
- Description, keywords, category (Educational)
Execution Order
Order	Phase	Est. Effort
1	Phase 1: Bug Fixes	Small
2	Phase 2: Building Collision	Medium
3	Phase 3: UI Simplification	Medium
4	Phase 4: Tutorials	Medium
5	Phase 5: NPC & Vehicles	Medium
6	Phase 6: 2D Phaser Demo	Large
7	Phase 7: Level Routes	Small
8	Phase 8: Visual Polish	Medium
9	Phase 9: Performance	Medium
10	Phase 10: Android App	Large
Files Modified/Created
Modified
- game_core.js — Bug fixes, collision, NPC AI, performance
- ui.js — Character fix, HUD simplification
- Driving.html — Z-index cleanup, tutorial UI, touch targets
- academy.html — Replace 3D scenario with Phaser 2D
- start.js — Level selection UI simplification
- course.js — Level data fixes
Created
- scenario2d.js — Phaser 4 2D scenario game
- OVERHAUL_PLAN.md — This file
- SeerleTrafficAcademy/ — React Native Expo project (entire directory)
- SeerleTrafficAcademy/app.json — Expo config
- SeerleTrafficAcademy/src/ — Game logic ported to TypeScript
Key Decisions Log
Decision	Choice	Rationale
2D Demo Framework	Phaser 4	Full 2D game features, WebGL rendering, built-in physics
Android Stack	React Native/Expo	Code reuse from web, single codebase for iOS too
Collision System	AABB with THREE.Box3	Simple, performant, Three.js native
Tutorial Style	Animated hand icons + modal	Best for 4-5 year olds who can't read
UI Reveal	Progressive unlock	Prevents overwhelming young children
Vehicle Scale	30-40% reduction	Current vehicles too large for map scale
NPC Stuck Timer	3 seconds	Current 1.5s too aggressive, causes flickering
Audio	Web Audio API	No external dependencies, works on mobile

---

*This plan consolidates all research, audits, and design decisions. Every phase has specific file locations and line numbers for precise implementation.*
