# Performance Analysis - Driving.html
## Detailed Analysis of Resource Usage Issues

---

## Executive Summary

The game is consuming high resources due to multiple factors across rendering, physics, memory, and event handling. This document details each issue and proposed fixes.

---

## 1. RENDERING ISSUES

### 1.1 Post-Processing Always Enabled (CRITICAL)
**Location:** `game_core.js:68-77`

```javascript
if (THREE.EffectComposer) {
  this.composer = new THREE.EffectComposer(this.renderer);
  this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
  const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.6, 0.85);
  // ...
}
```

**Issue:** Bloom post-processing is GPU-intensive. It's applied unconditionally.
**Impact:** ~30-50% GPU usage increase on mobile devices.
**Fix:** Disable bloom on mobile/low-end devices.

---

### 1.2 Shadow Map Quality Not Adaptive
**Location:** `game_core.js:57-64`

```javascript
this.renderer.shadowMap.enabled = true;
if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
  this.renderer.shadowMap.type = THREE.BasicShadowMap;
  this.renderer.shadowMap.mapSize.width = 1024;
  this.renderer.shadowMap.mapSize.height = 1024;
} else {
  this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}
```

**Issue:** 
- 1024x1024 shadow map on mobile is still large
- BasicShadowMap is better but could go lower
- No detection of low-end devices (just mobile regex)

**Fix:** 
- Lower shadow map to 512x512 on mobile
- Consider disabling shadows entirely on very low-end devices

---

### 1.3 No Frustum Culling
**Issue:** Objects outside the camera view still get rendered.
**Evidence:** Line 2658-2664 shows visibility toggle only:
```javascript
if (distToPlayer > 62500) {
  n.visible = false;
  // ...
}
```
This is distance-based, not proper frustum culling.
**Fix:** Implement frustum culling or use Three.js built-in frustum culling.

---

### 1.4 Too Many Meshes in Scene
**Evidence:** The game spawns many NPCs, pedestrians, obstacles, buildings.

**Issue:** No Level of Detail (LOD) system - all objects render at full detail.
**Fix:** Add LOD for buildings and vehicles.

---

### 1.5 Ground Plane Too Large
**Location:** `game_core.js:1110`

```javascript
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(cfg.is50km ? 100000 : 2000, cfg.is50km ? 100000 : 2000),
  // ...
);
```

**Issue:** 100,000 x 100,000 unit plane = 10 billion units² of geometry!
Even with simple plane, this causes issues.
**Fix:** Use smaller ground plane with repeated texture, or chunked system.

---

### 1.6 High Pixel Ratio Not Capped
**Location:** `game_core.js:46-48`

```javascript
let dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
if (w * dpr > maxW) dpr = maxW / w;
if (h * dpr > maxH) dpr = maxH / h;
```

**Issue:** 
- Mobile DPR can go up to 3x or 4x on modern phones
- Even 1.5x on mobile means 1.5x × 1.5x = 2.25x more pixels
- Render resolution is `w * dpr` × `h * dpr`

**Fix:** Cap mobile DPR at 1.0 or 1.25.

---

## 2. PHYSICS & COLLISION ISSUES

### 2.1 O(n²) Collision Detection (CRITICAL)
**Location:** `game_core.js:743-755`

```javascript
for (let i = 0; i < this.npcs.length; i++) {
  for (let j = i + 1; j < this.npcs.length; j++) {
    const a = this.npcs[i], b = this.npcs[j];
    // Collision check...
  }
}
```

**Issue:** 
- With 50 NPCs: 50 × 49 / 2 = 1,225 checks per frame
- With 100 NPCs: 4,950 checks per frame
- No spatial partitioning (quadtree/octree)

**Impact:** Significant CPU usage on mobile.
**Fix:** Implement spatial partitioning or reduce max NPCs on mobile.

---

### 2.2 Player-NPC Distance Checks Every Frame
**Location:** `game_core.js:734-741`

```javascript
for (const n of this.npcs) {
  const d = this.player ? this.player.position.distanceTo(n.position) : 999;
  // ...
}
```

**Issue:** `distanceTo()` involves square root - expensive in loops.
**Fix:** Use `distanceToSquared()` and compare against squared distances.

---

### 2.3 No Object Pooling for Physics
**Issue:** Creating and destroying physics objects causes garbage collection.
**Note:** There's already an NPC pool (`this.npcPool`), but it's not fully utilized.
**Fix:** Ensure consistent use of pooling.

---

## 3. MEMORY ISSUES

### 3.1 No Cleanup on Level Change
**Location:** `game_core.js:1034-1039`

```javascript
while (this.scene && this.scene.children.length) 
  this.scene.remove(this.scene.children[0]);
this.world = []; this.npcs = []; // ...
if (this.npcs) this.npcs.forEach(n => { n.visible = false; n.children.length = 0; 
  this._npcFree.push(n); });
```

**Issue:** 
- Removing all children from scene is brute-force
- Some geometries/materials may not be disposed properly
- Memory leaks possible

**Fix:** Properly dispose geometries and materials before removal.

---

### 3.2 Template Cache Unbounded
**Location:** `game_core.js:12-20`

```javascript
const _npcTplCache = new Map();
function _getNpcTemplate(type, col) {
  // ...
  if (_npcTplCache.size < 80) _npcTplCache.set(k, m);
  return m;
}
```

**Issue:** Cache size limit of 80 is arbitrary. Could grow indefinitely.
**Fix:** Add LRU eviction or fixed-size cache.

---

### 3.3 Multiple Arrays Being Updated
**Location:** `game_core.js:28`

```javascript
this.world = []; this.npcs = []; this.sigs = []; this.cps = []; 
this.spc = []; this.obstacles = []; this.roadSegments = []; 
this.driveRoute = []; this.peds = []; // ...
```

**Issue:** 9+ arrays updated every frame - could be consolidated.
**Fix:** Consider single entity component system.

---

## 4. EVENT LISTENER ISSUES

### 4.1 Many Event Listeners Added Dynamically
**Location:** Multiple places in `game_core.js`

**Issue:** 
- Keyboard: `keydown`, `keyup` - 2 listeners
- Mouse: `click`, `mousemove`, `mousedown`, `mouseup` - 4 listeners
- Touch: Many touch event listeners per control
- Pointer lock: `pointerlockchange`, `mousemove`
- Window: `resize`, `fullscreenchange`, `deviceorientation`

**Fix:** 
- Use event delegation
- Remove listeners when not needed
- Throttle mouse/touch events

---

### 4.2 No Event Throttling
**Issue:** `mousemove`, `touchmove` fire at display refresh rate.
**Fix:** Add throttling (e.g., every 16ms = 60fps cap).

---

## 5. GAME LOOP ISSUES

### 5.1 Too Many Updates Per Frame
**Location:** `game_core.js:2251`

```javascript
this._input(dt); this._usigs(dt); this._unpcs(dt); this._upeds(dt); 
this._ucps(); this._ugps(); this._uobs(dt); this._umode(dt); 
this._decayCameraLook(dt); this._ucam(dt); this._uhud(); 
this._ummap(); this._utransit(); this._computeTaskFlags(); 
this._checkTasks();
```

**Issue:** 14+ update functions called every frame.
**Fix:** 
- Skip pedestrian update when in vehicle
- Skip minimap update when not visible
- Throttle some updates

---

### 5.2 No Frame Rate Targeting
**Issue:** Game runs at monitor refresh rate (60/120/144fps).
- Higher fps = more CPU/GPU per second
- No delta time clamping could cause physics issues

**Fix:** 
- Cap at 60fps
- Use fixed timestep for physics

---

## 6. UI ISSUES

### 6.1 DOM Queries in Loop
**Location:** `game_core.js:80-81`

```javascript
const ids = ['3c', 'gspd', 'garc', /* ... */];
ids.forEach(id => { this.dom[id] = document.getElementById(id); });
```

**Issue:** DOM elements are cached - this is good!
But some DOM updates in `_uhud()` may be expensive.

---

### 6.2 No CSS Containment
**Issue:** UI elements may cause unnecessary reflows.
**Fix:** Use `contain: layout style paint` CSS property.

---

## 7. SUMMARY TABLE

| Issue | Severity | Location | Fix Complexity |
|-------|----------|----------|----------------|
| Bloom always on | 🔴 Critical | :68-77 | Easy |
| O(n²) collision | 🔴 Critical | :743-755 | Medium |
| No frustum culling | 🟠 High | General | Medium |
| Large ground plane | 🟠 High | :1110 | Easy |
| High pixel ratio | 🟠 High | :46-48 | Easy |
| Too many updates | 🟠 High | :2251 | Easy |
| No frame cap | 🟡 Medium | :2247 | Easy |
| Event throttling | 🟡 Medium | Multiple | Medium |
| Memory cleanup | 🟡 Medium | :1034 | Medium |
| LOD system | 🔴 Critical | N/A | Hard |

---

## IMPLEMENTATION PRIORITY

### Phase 1 - Quick Wins (5-10 min each)
1. Disable bloom on mobile
2. Cap pixel ratio at 1.0 for mobile
3. Lower shadow map to 512x512
4. Use distanceToSquared instead of distanceTo
5. Cap frame rate at 60fps

### Phase 2 - Medium Effort (30 min each)
6. Implement frustum culling
7. Reduce max NPCs on mobile
8. Throttle event listeners
9. Proper memory disposal

### Phase 3 - Advanced (hours)
10. Add LOD system
11. Spatial partitioning for collision
12. Entity component system

---

*Last Updated: 2026-07-03*