# Design Spec: Ultimate Performance, Urban, and Input Overhaul
Date: 2026-07-20
Status: Approved
Version: 1.0

## 1. Overview
This document defines the architecture for transforming the Traffic Driving Simulator from a prototype into a professional-grade educational platform. The overhaul focuses on four key pillars: a tiered performance engine, a road-aware procedural city generator, an adaptive responsive UI, and a pro-level input system.

## 2. Pillar 1: Omni-Performance Engine
Goal: Maximum FPS on all devices, from low-end Androids to high-end PCs.

### 2.1 RenderCore Architecture
- **Decoupling:** Move all rendering logic from `Game` into a new `RenderCore` class.
- **Dynamic Resolution Scaling (DRS):** Implement a `WebGLRenderTarget` for the main scene.
  - **Low Preset:** Render at 0.7x native resolution, then upscale.
  - **Ultra Preset:** Render at 1.0x or 1.2x (supersampling).
- **Hardware Profiler:** Startup check of `GL_RENDERER` and `deviceMemory` to auto-select the initial quality preset.

### 2.2 Quality Tier System
| Feature | Low | Medium | High | Ultra |
| :--- | :--- | :--- | :--- | :--- |
| **Res Scale** | 0.7x | 0.85x | 1.0x | 1.2x |
| **Shadows** | Off/Basic (512) | PCFSoft (1024) | PCFSoft (2048) | High-Res (409 la) |
| **Bloom** | Off | Low | Med | High |
| **LOD Dist** | Short | Med | Long | Very Long |
| **Texture Filt**| Linear | Bilinear | Trilinear | Anisotropic 16x |
| **FPS Target** | 30 (Lock) | 30/60 Adaptive | 60 | Uncapped |

### 2.3 Zero-Allocation Pipeline
- Implement **Object Pooling** for `Vector3`, `Matrix4`, and `BBox` to eliminate Garbage Collection (GC) stutters during the main loop.

---

## 3. Pillar 2: Living City Generator
Goal: Move from hardcoded coordinate tables to an organic, logical urban layout.

### 3.1 District-Node Framework
- **Anchor Nodes:** Key locations (e.g., Hospitals, Police Stations) that define the "center" of a district and influence nearby building types.
- **Zoning Logic:** Divide the world into zones (`Residential`, `Commercial`, `Industrial`, `Slums`). The generator pulls assets based on the zone.

### 3.2 Road-Aware Placement
- **Parcel Logic:** Generate rectangles (parcels) along road segments.
- **Best-Fit Algorithm:** Select the largest asset from the library that fits the parcel boundaries.
- **Frontage Alignment:** Use `Math.atan2(road.direction)` to ensure building "fronts" always face the street.

### 3.3 Tiered Loading (LOD)
- **Active Tile:** High-poly meshes in immediate proximity.
- **Buffer Tile:** Simplified proxies/low-poly versions.
- **Distant Tile:** A single merged mesh (background) updated infrequently.

---

## 4. Pillar 3: Adaptive Responsive UI
Goal: Zero overlaps on all screen sizes, from mobile to 4K monitors.

### 4.1 Safe-Zone Grid
- **Quadrant Anchors:** Divide screen into Top-Left, Top-Right, Bottom-Left, Bottom-Right, and Center zones.
- **Stacking Logic:** Elements in a zone are treated as a stack. If an `Objective Overlay` appears, the `Task Tracker` is pushed down by the objective's height.

### 4.2 Profile-Based UI
- **Kid Mode:** Massive buttons, emoji-based objectives, high-contrast colors, simplified HUD.
- **Pro Mode:** Data-rich HUD, sleek dark-mode aesthetics, precision gauges.

### 4.3 Viewport Guards
- Use `clamp()`, `svh`, and `svw` units for sizing.
- Implement `env(safe-area-inset-*)` to protect UI from device notches/cutouts.

---

## 5. Pillar 4: Pro-Control & Input Engine
Goal: Fluid "Open World" feel with professional-grade camera and hardware integration.

### 5.1 Sling-Look Camera
- **Delta-Drag System:** implement a dedicated "Look Zone" on screen.
- **Input Smoothing:** Use Lerping for camera rotation to prevent jitter.
- **Sensitivity Profiles:** Distinct settings for Mouse vs. Touch.

### 5.2 Hardware & Orientation
- **Gyroscope Flow:** `Unlock Button` $\rightarrow$ `requestPermission()` $\rightarrow$ `Calibration` $\rightarrow$ `Active`.
- **Orientation Overlay:** High-priority screen that forces the user to rotate to Landscape mode before playing.
- **Viewport Lock:** Use `screen.orientation.lock('landscape')`.

### 5.3 Kid-First Assistance
- **Magnetic Lane Assist:** Gently pulls cars back into the lane.
- **Auto-Brake:** Automatic slowing when a collision is imminent.
- **Breadcrumb Path:** A glowing path on the road for navigation instead of a complex map.

---

## 6. The Grand Finale (Certification)
- **The Mega-Map:** A final level incorporating all scenarios (Weather, Night, Police, Pedestrians) in one seamless open world.
- **The Certification Trigger:** Pass the Mega-Map with a "Perfect Safety Score" to unlock the final high-res certificate.

## 7. Onboarding Flow Fix
- **Direct-to-Drive:** `Get Started` $\rightarrow$ `SupaBase Check` $\rightarrow$ `Academy.html` (Last Unlocked Level).
- **Quick Start:** Optional theory side-panels instead of mandatory info-screens.
