# Traffic Simulator

> A 3D browser-based driving and pedestrian simulation game built with Three.js. Players learn Indian traffic rules in Mumbai-themed city environments through hands-on gameplay.

---

## Key Entry Pages

| Page | Path | Purpose |
|---|---|---|
| **Free Roam** | `Traffic/Driving.html` | Open-world sandbox with traffic, day/night cycle, and pedestrian mode |
| **Academy** | `Traffic/Academy.html` | Structured 56-level syllabus, task validation, quizzes, and certificates |
| **Dashboard** | `Traffic/TrafficDashboard.html` | Player stats, earned badges, wallet rewards, and leaderboards |
| **Setup** | `Traffic/TrafficSetup.html` | Pre-game vehicle customizer and graphic quality presets |

---

## Engine Architecture

| File | Size | Role |
|---|---|---|
| `game_core.js` | ~810 KB | Three.js renderer, AABB collision physics, game loop, camera systems |
| `ui.js` | ~360 KB | HUD overlays, speedometers, minimap, challans, quiz dialogs |
| `start.js` | ~50 KB | Asset preloader (`window.PRELOADED_MODELS`), scene bootstrapping |
| `npc-ai.js` | ~113 KB | Autonomous vehicle routing, rule compliance heuristics, pedestrian paths |
| `course.js` | ~18 MB | Academy syllabus logic, interactive quizzes, certificate generation |
| `cert_assets.js` | ~18 MB | Certificate graphical assets and canvas rendering pipeline |
| `env.js` | ~30 KB | Procedural sky, dynamic sun lighting, rain particles, day/night cycles |

---

## Vehicle Roster

- **Auto Rickshaw** (`auto.js`): Iconic Indian three-wheeler vehicle.
- **City Bus** (`bus.js`): Heavy commercial vehicle with extended collision box.
- **Sports Car** (`lambo.js`): High-performance vehicle with responsive steering.
- **Pedestrian Mode**: Switchable via `F` key or level configuration to walk on sidewalks.

---

## Level Format (`Traffic/levels/`)

Levels register into `window.LVS` and define road geometry, NPC behavior, traffic lights, and objectives:

```javascript
const LEVEL_CONFIG = {
  name: "Level Name",
  type: "driving",          // "driving" or "pedestrian"
  roads: [{ type: 'v', x: 0, z1: -200, z2: 200 }],
  route: [[0, -100], [0, 100]],
  spawn: { x: 0, z: -150, rot: 0 },
  npcs: [{ type: 'car', color: 0xff0000, route: [...] }],
  trafficLights: [{ pos: { x: 0, z: 0 }, dir: 'v' }],
  timeLimit: 120,
  isNight: false,
  hasRain: false
};
```

Supported task triggers: `enter_vehicle`, `stop`, `reach`, `avoid`, `toggle`.
