# Traffic Driving Simulator — Codebase Reference

> 3D browser-based driving/pedestrian simulator built with Three.js r128. Static HTML deployed to Vercel (no build step).

---

## Architecture Overview

The game is a single-page application with two main modes:
- **Driving mode** (`Driving.html`) — 3D vehicle simulation with traffic, NPCs, and missions
- **Academy mode** (`Academy.html`) — Pedestrian safety training with syllabus, quizzes, and certificates

Both modes share the same engine (`game_core.js`) and optional subsystems loaded via `<script defer>` tags.

---

## File Inventory

### Core Engine (DO NOT MODIFY)

| File | Size | Purpose |
|------|------|---------|
| `game_core.js` | ~7,000 lines | Main engine: physics (Pacejka MF 5.2), vehicle control, scene management, NPC spawning, render loop |
| `three.js` | ~2,100 comments | Three.js r128 library (pinned — upgrading breaks post-processing/GLTFLoader) |
| `cert_assets.js` | ~18MB | Preloaded GLB models (buildings, vehicles, roads). Regenerated from Blender. |

### Engine Subsystems

| File | Lines | Purpose |
|------|-------|---------|
| `pools.js` | 207 | Object pooling system (`ThreePools`). Pools for Mesh, Group, Vector3, Quaternion, Matrix4, Box3, Sphere. Zero-GC design. |
| `road-graph.js` | 398 | Spatial road network. `RoadNode` and `RoadEdge` classes. A* pathfinding for NPC routing. Built from level config `roads[]` + `anchorNodes[]`. |
| `render_core.js` | 443 | WebGL2 renderer wrapper. Quality presets (LOW/MED/HIGH/ULTRA), Dynamic Resolution Scaling (DRS), LOD, bloom post-processing. |
| `safezone-ui.js` | 404 | Responsive HUD layout. Safe-area insets, mobile detection, element registration (`SZ.register()`). |

### Game Logic Modules

| File | Lines | Purpose |
|------|-------|---------|
| `course.js` | 400 | Level definitions. 13 modules, 53 levels, 4 modes (LEARN/PRACTICE/EXAM/CHAOS). Exposes `window.COURSE`. |
| `traffic-manager.js` | 673 | NPC traffic management. Vehicle spawning, density control, signal accumulation, lane access rules, platoon behavior. |
| `npc-ai.js` | 1,195 | NPC behavior state machine. 12 states (IDLE, FOLLOW_LANE, OVERTAKE, WAIT_SIGNAL, etc.). Driver profiles (normal, aggressive, reckless_bike, etc.). |
| `mission-manager.js` | 419 | Mission system. Types: CHECKPOINT, COLLECT, TIME_TRIAL, DELIVERY, FOLLOW. Collectible items with values. |
| `scenario2d.js` | 1,865 | 2D scenario game (canvas-based). Easing functions, color utilities, scenario definitions for violations (signal_jump, wrong_side, etc.). |
| `world-streamer.js` | 461 | Procedural city streaming. Chunk-based loading with seeded RNG (mulberry32). Buildings, props, foliage generation. |
| `rule-breaker-profiles.js` | 374 | Defines rule-breaking NPC behavior profiles for Chaos mode. |

### UI & Presentation

| File | Lines | Purpose |
|------|-------|---------|
| `ui.js` | 4,460 | Main UI controller. Level selection, briefing screen, quiz flow, pledge system, progress tracking, streak display, rewards. |
| `traffic-charts.js` | 517 | Chart rendering for dashboard. Color tokens (dark/light themes), radial progress, bar charts. |
| `wallet-history.js` | 122 | Transaction history display for in-game wallet/currency system. |
| `gameplay-recorder.js` | 451 | Records gameplay sessions for replay/analysis. |
| `brace_tracker.js` | 34 | Tracks player brace/position data (likely for AR/VR features). |
| `start.js` | 676 | Initialization and bootstrap. Auth checks, progress loading, screen routing. |
| `welcome-back.js` | ~60 | Welcome-back modal for returning players. |

### HTML Entry Points

| File | Lines | Purpose |
|------|-------|---------|
| `Driving.html` | 7,504 | Driving mode. Loads game_core.js + subsystems. Patches fetch() for config.json. |
| `Academy.html` | 6,686 | Academy mode. Syllabus, briefing, quiz, results screens. Same script loading pattern. |
| `TrafficDashboard.html` | 2,889 | Admin analytics view. Charts, progress visualization. |
| `TrafficSetup.html` | 2,028 | Settings/configuration page. Vehicle selection, quality settings. |
| `student.html` | 622 | Student portal view. |
| `teacher.html` | 1,189 | Teacher dashboard. Class management. |
| `parent.html` | 861 | Parent view. Child progress monitoring. |

### Styling

| File | Purpose |
|------|---------|
| `animations.css` | Keyframe animations, transitions, pulse effects |
| `traffic-charts.css` | Chart-specific styles |
| `welcome-back.css` | Welcome-back modal styles |

### Asset Bundles (DO NOT MODIFY)

| File | Purpose |
|------|---------|
| `env.js` | Environment/skybox assets |
| `auto.js` | Auto-rickshaw model bundle |
| `bus.js` | Bus model bundle |
| `lambo.js` | Lamborghini model bundle |
| `lambo_105ba.js` | Alternate Lamborghini model |
| `orig_lambo.js` | Original Lamborghini backup |

### Configuration (DO NOT MODIFY)

| File | Purpose |
|------|---------|
| `config.json` | Supabase auth credentials + page status routing |
| `vercel.json` | Vercel deployment config (clean URLs, redirects) |

---

## Script Load Order (MANDATORY)

Both `Driving.html` and `Academy.html` load modules in this exact order:

```
1. pools.js         → ThreePools.init(this)
2. road-graph.js    → RoadGraph.fromLevelConfig()
3. render_core.js   → RenderCore quality presets
4. safezone-ui.js   → SZ.register() for HUD
5. game_core.js     → Main engine constructor
```

---

## Key Systems

### Level Configuration (`course.js`)

```javascript
// Module structure:
MODULES = [{
  id: 1, name: 'Andheri Junction', theme: 'intersection_mastery',
  levels: [
    { id: 1, name: 'Signal Basics', route: 'simple_cross', timeLimit: 90, npcTypes: ['car','bike',...] },
    // ...
  ]
}]

// Mode configuration:
MODE_CONFIG = {
  LEARN:    { timeLimitMult: 1.5, npcDensityMult: 0.3, passThreshold: 0.6, xpBase: 50 },
  PRACTICE: { timeLimitMult: 1.0, npcDensityMult: 0.7, passThreshold: 0.75, xpBase: 100 },
  EXAM:     { timeLimitMult: 0.8, npcDensityMult: 1.0, passThreshold: 0.85, xpBase: 200, mcqCount: 5 },
  CHAOS:    { timeLimitMult: 0.7, npcDensityMult: 1.5, passThreshold: 0.7, xpBase: 300, adaptive: true }
}
```

### NPC AI States (`npc-ai.js`)

```
IDLE → FOLLOW_LANE → OVERTAKE/WAIT_SIGNAL → COMPLETE
              ↓
        EMERGENCY_BRAKE / CRASH / PULL_OVER
              ↓
        DISTRACTED / ROAD_RAGE (Chaos mode)
```

### Object Pooling Pattern (`pools.js`)

```javascript
const mesh = ThreePools.getMesh(geometry, material);
// ... use mesh ...
ThreePools.releaseMesh(mesh);
// On level exit: ThreePools.releaseAll();
```

### Road Graph Pathfinding (`road-graph.js`)

```javascript
const start = roadGraph.getNearestNode(x1, z1);
const end = roadGraph.getNearestNode(x2, z2);
const path = roadGraph.findPath(start, end);  // A* algorithm
```

---

## Data Persistence

Game state is stored in `localStorage` under key `trafficSimState` (variable `S` in code):

```javascript
S = {
  pl: { name, avatar, vehicle },     // Player profile
  comp: { [levelId]: { score, time, modes } },  // Completed levels
  streak: { current, best, lastDate },  // Daily streak
  pledges: { [levelId]: { if, then, created } },  // Commitment pledges
  sylViewed: { [levelId]: [itemIds] },  // Syllabus progress
  badges: [badgeIds],  // Earned badges
  language: 'en' | 'hi',  // UI language
  quality: 'Low' | 'Medium' | 'High' | 'Ultra'  // Render quality
}
```

---

## Academy Mode Flow

1. **Level Select** → `ui.showLevels()` renders level grid
2. **Briefing** → `ui.showBriefing(lid)` shows:
   - Left panel: Level info, streak, progress bar, syllabus list
   - Right panel: Content cards (Overview, Guidelines, Legal, Science, Execution, Pledge)
3. **Pledge** → Clicking "🤝 Pledge" opens `ui.showCommitmentPledge()` modal
4. **Quiz** → `ui.startQuiz()` runs MCQ assessment
5. **Results** → Score, badge award, certificate eligibility check

### Syllabus Items (Learn Mode)

| ID | Icon | Label | Content |
|----|------|-------|---------|
| `intro` | 📖 | Overview | Level name, description, stats |
| `rule0..N` | ⚖️ | Guideline N | Traffic rules from `level.hps[]` |
| `law` | 🏛️ | Legal Penalty | Section, fine, offense (bilingual EN/HI) |
| `theory` | 📊 | Science | Age-adapted explanations |
| `practical` | 🎯 | Execution | Driving test instructions |
| `pledge` | 🤝 | Pledge | Commitment if-then plan modal |

---

## Driving Mode Flow

1. **Vehicle Select** → Choose from 9 vehicle types
2. **Level Load** → `_buildScene()` creates RoadGraph, spawns NPCs
3. **Gameplay Loop**:
   - Physics update (Pacejka tire model)
   - NPC update (state machine + A* path following)
   - Render (RenderCore with quality preset)
   - Collision detection
   - Violation checking
4. **Mission Complete** → Score, XP, badge check

---

## Debug Commands (Browser Console)

```javascript
// Pool stats
ThreePools.getStats()

// Road graph inspection
game.roadGraph.edges.forEach(e => console.log(e.id, e.length, e.lanes))

// Quality control
game.renderCore.setQuality('Ultra')
game.renderCore.getPreset()

// Level building
game._buildScene({...levelConfig})
```

---

## Known Constraints

- Three.js r128 is pinned — upgrading breaks BufferGeometryUtils, post-processing, GLTFLoader
- `cert_assets.js` is 18MB — loads async with progress bar
- Mobile Safari requires LOW preset + ThreePools for 60fps
- Traffic HTML pages patch `fetch()` to redirect `config.json` to `../config.json`
- NPCs may get stuck at intersections if RoadGraph edges aren't connected

---

## Deployment

- Push to `main` → Vercel auto-deploys (static HTML, no build step)
- `vercel.json` sets security headers only
- No service worker in Traffic/ (parent CoL site has one)

---

_Last updated: August 6, 2026_
