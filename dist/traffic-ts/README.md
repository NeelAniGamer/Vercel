# Traffic-TS — Modern Modular TypeScript & React TSX Traffic Engine

A complete, high-performance, modular TypeScript & React TSX driving simulation engine with Pacejka MF 5.2 tire physics, 6-speed automatic transmission, distance-based LOD fading, dynamic radar minimap, real-time e-Challan police violations, vehicle studio customizer, and 4-perspective camera system.

---

## 🚀 Quick Start in React / Next.js / Vite

```tsx
import React, { useState } from 'react';
import { TrafficGame, VehicleCustomization, QualityPresetName } from './traffic-ts';

export const TrafficPage = () => {
  const [score, setScore] = useState(100);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <TrafficGame
        vehicle="sports_gt"          // 'sports_gt' | 'supercar' | 'taxi' | 'auto' | 'bike' | 'bus' | 'truck'
        mode="free_roam"             // 'free_roam' | 'driving' | 'pedestrian' | 'academy' | 'rain'
        initialQuality="HIGH"        // 'LOW' | 'MED' | 'HIGH' | 'ULTRA'
        initialRenderDistance={500}  // 250m - 1200m
        initialCustomization={{
          bodyColor: 0xdc2626,       // Apex Red
          rimColor: 0x475569,        // Gunmetal Grey
          caliperColor: 0xfacc15,    // Racing Gold
          hasSplitter: true,
          hasWing: true
        }}
        onScoreChange={(newScore) => setScore(newScore)}
        onViolation={(violation) => console.log('Challan issued:', violation)}
      />
    </div>
  );
};
```

---

## 🕹️ Keyboard & Mouse Controls

| Input | Action |
|---|---|
| **W / Up Arrow** | Throttle (Accelerate) |
| **S / Down Arrow** | Foot Brake / Reverse in 'R' gear |
| **A / D / Left / Right** | Steer Left / Right |
| **Spacebar** | Emergency Handbrake (Drift Initiation) |
| **Shift** | Nitrous Boost (Depletes reservoir, recharges over time) |
| **R** | Toggle Drive ('D') / Reverse ('R') gear |
| **C** | Cycle Camera View (`3rd Person Close` ➔ `Tactical Far` ➔ `Hood` ➔ `Bumper`) |
| **F11 / ⛶ Button** | Fullscreen Mode (Enables pointer lock for unlimited horizontal look) |
| **🎨 Custom Button** | Open In-Game Vehicle Studio Customizer |
| **⚙️ Settings Button** | Open Graphics Quality Preset & Render Distance Settings |

---

## 🧱 Architecture & Modules

```
traffic-ts/
├── types.ts                     # Strict TypeScript interfaces (HUDState, Customization, RoadGraph, etc.)
├── index.ts                     # Clean top-level exports
├── TrafficGame.tsx              # React wrapper linking 3D engine with declarative TSX HUD
│
├── engine/
│   ├── TrafficEngine.ts         # Master 60 FPS animation loop, Three.js scene, camera & physics coordinator
│   ├── RenderCore.ts            # WebGL2 renderer with DRS (Dynamic Resolution Scaling) and LOD multipliers
│   ├── CameraController.ts      # Multi-view camera controller with smooth lag & speed FOV dilation
│   ├── LODSystem.ts             # 3-tier distance-based geometry decimation & opacity fading
│   └── InputManager.ts          # Desktop keyboard, mouse delta, and pointer lock manager
│
├── physics/
│   ├── VehiclePhysics.ts        # 6-speed transmission, engine RPM curve, lateral G-force, dynamic weight transfer
│   └── PacejkaTireModel.ts      # Pacejka Magic Formula 5.2 tire friction curves
│
├── world/
│   ├── RoadGraph.ts             # Spatial road network graph with A* pathfinding
│   ├── SuburbanBuilder.ts       # Low-poly aesthetic suburban buildings, curbs, lamp posts, foliage
│   └── Environment.ts           # Dynamic sky dome, directional sunlight, and distance fog
│
├── entities/
│   ├── VehicleFactory.ts        # Procedural & GLB car generator with paint, rim & carbon aero support
│   ├── TrafficManager.ts        # Autonomous NPC traffic vehicles navigating the road network
│   └── PedestrianManager.ts     # Walking NPC pedestrians with sidewalk avoidance
│
├── hud/
│   ├── GameHUD.tsx              # Master responsive HUD container
│   ├── Speedometer.tsx          # High-DPI SVG circular dial (RPM, Gear, Speed km/h, Nitro, Lateral G)
│   ├── MiniMap.tsx              # Dynamic 2D radar minimap with rotating player heading and NPC dots
│   ├── ChallanAlert.tsx         # Animated e-Challan traffic violation notification toast
│   ├── SettingsModal.tsx        # In-game graphics quality & render distance modal
│   └── VehicleStudioModal.tsx   # In-game car customizer (paint colors, wheels, carbon wings)
│
└── utils/
    └── ObjectPool.ts            # Zero-allocation Object Pool (Vectors, Meshes, Matrices) for 60 FPS
```

---

## ⚡ Key Technical Highlights

1. **Zero Garbage Collection Allocation**:
   - Math calculations in `VehiclePhysics` and `CameraController` reuse preallocated `THREE.Vector3` and `THREE.Quaternion` pools via `ObjectPool.ts`.
2. **Realistic Drivetrain Physics**:
   - 6-speed automatic transmission with realistic gear ratios:
     - 1st: $3.80:1$, 2nd: $2.40:1$, 3rd: $1.65:1$, 4th: $1.20:1$, 5th: $0.90:1$, 6th: $0.72:1$ (Final drive: $3.90:1$).
   - Dynamically calculated lateral acceleration:
     $$a_y = v \cdot \dot{\psi}$$
3. **Throttled React HUD Updates**:
   - Engine simulation runs at full 60 FPS / 144 FPS while HUD state updates are throttled to 30 Hz for optimal React rendering efficiency.
4. **Distance Decimation & Fog**:
   - Distant suburban structures are dynamically clipped and faded using `THREE.Fog` matching the stylized reference art style.
