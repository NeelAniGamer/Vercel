# Dense Downtown & Residential Scene Map Guide

This directory provides the complete setup to create, customize, and play the **Dense Downtown & Mixed Residential** scene map in both **Blender** and the **Traffic Simulator**.

---

## 1. What's Included

| Component | File | Description |
|-----------|------|-------------|
| **Blender Generator** | `Traffic/tools/generate_downtown_scene.py` | Procedural 3D scene generator in Blender with skyscrapers, mid-rise blocks, detailed residential houses, traffic lights, and street props. |
| **Playable Simulator Level** | `Traffic/levels/level_custom.js` | Full simulator level configuration with 4-lane avenues, residential house streets, traffic AI, signals, and zebra crossings. |
| **Model Library** | `Traffic/Models/kenney_city-pack/` | Ready-to-use 3D models of buildings, houses, pizza parlors, traffic lights, bus stops, and props. |

---

## 2. Using the Blender 3D Scene Generator

### Option A: Command Line / Headless (Automated)
Run Blender in background mode to generate the scene, save the `.blend` file, and export the `.glb` model automatically:

```powershell
blender --background --python Traffic/tools/generate_downtown_scene.py
```

Output files will be generated in `Traffic/assets/`:
- `Traffic/assets/downtown_scene_map.blend` — Editable Blender scene.
- `Traffic/assets/downtown_scene_map.glb` — Optimized 3D model for Three.js / WebGL.

### Option B: Inside Blender GUI (Interactive)
1. Open Blender.
2. Switch to the **Scripting** workspace (top header tab).
3. Click **Open** and select `Traffic/tools/generate_downtown_scene.py`.
4. Click the **Run Script** button (or press `Alt + P`).
5. Switch the viewport shading to **Material Preview** or **Rendered** (`Z` -> `Material Preview`) to see the illuminated skyscrapers, houses, and glowing traffic lights.

---

## 3. Slotting in Your Own 3D Models

The generator script has built-in support for importing and placing your own external 3D models (`.glb`, `.gltf`, `.fbx`, `.obj`):

1. **Model Directory**: By default, the script points to:
   ```python
   CUSTOM_MODELS_DIR = os.path.join(PROJECT_ROOT, 'Models', 'kenney_city-pack')
   ```
   You can change this variable in `generate_downtown_scene.py` to point to any directory on your computer containing your 3D models.

2. **Custom Model Mapping**:
   In `generate_downtown_scene.py`, lines ~430-470, you can specify your own filenames:
   ```python
   # Example: Slot in your custom house or building
   try_import_custom_model('MyCustomHouse.glb', loc, rot_z_deg=0, target_scale=(1.0, 1.0, 1.0), collection=col_custom)
   ```
   If a custom model file is found, it is automatically imported, scaled, and placed in the city lot. If not found, the procedural generator automatically creates the detailed house or skyscraper in that slot.

---

## 4. Playing the Scene Map in Traffic Simulator

The simulator level is already registered and wired into the game engine via `Traffic/levels/level_custom.js`.

### How to Launch:
1. Open your browser to the local server or Vercel deployment:
   ```
   http://localhost:5173/Traffic/Driving.html?lv=custom&mode=car
   ```
   *(or open `Traffic/Driving.html?lv=custom` in any standard web server).*
2. Choose your vehicle (`car`, `bike`, `auto`, `bus`, `truck`).
3. Press **Space** / throttle to drive.

### Features in the Simulator:
- **Commercial Core (X=0, Z=0)**: High-rise towers, multi-phase traffic signals, and heavy traffic flow.
- **Residential House Lanes (Z=120 and Z=-120)**: 2-lane neighborhood streets lined with houses, lower speed limits, and pedestrian crossings.
- **Navigation Route & Checkpoints**: Drive from the residential sector through the downtown intersection and reach the Financial Tower destination gate.
