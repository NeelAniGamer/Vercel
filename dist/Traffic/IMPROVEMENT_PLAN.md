# Traffic Academy - Improvement Plan

**Created:** 2026-07-02  
**Target:** Make the game smoother and more child-friendly

---

## Executive Summary

This document outlines the problematic areas in the codebase and provides recommendations to make the game smoother, more visually appealing for children (4-5 years old), and better performing.

---

## ✅ Completed Work (Verified)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Critical bugs fixed (currentRoad, levelCfg→mapCfg, barricade offset) | ✅ Done |
| Phase 1 | Building AABB collision with push-out | ✅ Done |
| Phase 2 | UI simplification, z-index fixes | ✅ Done |
| Phase 3 | Tutorial system with kid_tutorial_done | ✅ Done |
| Phase 4 | NPC AI: 3s stuck timer, lane clamp | ✅ Done |
| Phase 6 | Multi-point routes, rain/night mode | ✅ Done |
| Phase 7 | Object pooling, NPC template cache, audio categories | ✅ Done |

---

## ⚠️ Problematic Areas (Remaining Work)

### 1. MeshToonMaterial - ✅ COMPLETE

**Current State:**
- `game_core.js` - ✅ DONE: Uses MeshToonMaterial for roads, grass, sidewalks, buildings (lines 1102-1200)
- `ui.js` - ✅ DONE: Now uses MeshToonMaterial for vehicles, characters, and briefing scene

**Implementation:** Replaced all MeshPhongMaterial and MeshLambertMaterial with MeshToonMaterial in ui.js (2026-07-02)

**Impact:** Game now has cartoon/child-friendly visual style

---

### 2. No Camera Shake on Collision ❌

**Current State:** Static camera, no impact feedback  
**Required:** Camera shake effect when hitting obstacles  
**Impact:** Players don't feel the collision

**Implementation:**
```javascript
// Add to Game class constructor:
this._shakeT = 0;

// Add to _ucam() method:
if (this._shakeT > 0) {
  const shake = this._shakeT * 0.1;
  this.camera.position.x += (Math.random() - 0.5) * shake;
  this.camera.position.y += (Math.random() - 0.5) * shake;
  this._shakeT *= 0.9;
}

// On collision detected, set:
this._shakeT = 0.3;
```

---

### 3. No Particle Effects ❌

**Missing:**
- Dust particles when braking
- Splash particles in rain
- Confetti on level completion

---

### 4. Monolithic Asset Loader (Performance)

**Current:** 100+ GLBs load at startup regardless of level  
**Required:** Per-level asset loading  
**Files:** `start.js`

---

### 5. Non-GLB Model Support Missing

**Issue:** `uploads_files_*` are `.rar`, `.zip`, `.fbx`, `.3ds`, `.obj`  
**Current:** Only GLB loading supported  
**Required:** FBXLoader, OBJLoader, JSZip for archives

---

## 🎯 Implementation Priorities

### Priority 1: High Impact (Do First)

1. **MeshToonMaterial Switch**
   - Replace all `MeshPhongMaterial` and `MeshLambertMaterial` with `MeshToonMaterial`
   - Creates cartoon aesthetic for kids
   - Files: `ui.js`, `game_core.js`

2. **Camera Shake**
   - Add impact feedback on collision
   - Increases game "feel"
   - File: `game_core.js`

---

### Priority 2: Medium Impact

3. **Particle Effects**
   - Dust on brake
   - Rain splashes
   - Confetti on win
   - File: `game_core.js`

4. **Smooth Camera Transitions**
   - Lerp between camera positions
   - Less jarring experience
   - File: `game_core.js`

---

### Priority 3: Long-term Improvements

5. **Per-level Asset Loading**
   - Load only needed models per level
   - Faster startup
   - File: `start.js`

6. **Additional Model Formats**
   - Support FBX, OBJ, 3DS
   - More content variety

---

## 📝 Specific Code Changes

### Change 1: Add Camera Shake

**File:** `game_core.js`

**In constructor (around line 22-40):**
```javascript
this._shakeT = 0;
```

**In _ucam() method (around line ~2800):**
```javascript
// Camera shake decay
if (this._shakeT > 0) {
  const shakeIntensity = this._shakeT * 0.15;
  this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
  this.camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.5;
  this._shakeT *= 0.88;
  if (this._shakeT < 0.01) this._shakeT = 0;
}
```

**Trigger on collision (in _uobs method):**
```javascript
this._shakeT = 0.35;
```

---

### Change 2: MeshToonMaterial

**File:** `ui.js`

**In _buildVehicle() function:**

Change from:
```javascript
const bodyM = new THREE.MeshPhongMaterial({ color: col })
const glassM = new THREE.MeshPhongMaterial({ color: 0x1a2e4a, transparent: true, opacity: 0.75 })
```

To:
```javascript
const bodyM = new THREE.MeshToonMaterial({ color: col })
const glassM = new THREE.MeshToonMaterial({ color: 0x1a2e4a, transparent: true, opacity: 0.75 })
```

**Also change MeshLambertMaterial to MeshToonMaterial throughout.**

---

### Change 3: Confetti on Level Complete

**File:** `game_core.js`

Add confetti particle system that triggers when level completes:

```javascript
_confetti() {
  if (!this._confettiParticles) {
    this._confettiParticles = [];
    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];
    for (let i = 0; i < 100; i++) {
      const geo = new THREE.BoxGeometry(0.15, 0.15, 0.02);
      const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(
        this.player.position.x + (Math.random() - 0.5) * 10,
        this.player.position.y + 5 + Math.random() * 10,
        this.player.position.z + (Math.random() - 0.5) * 10
      );
      p.userData = {
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.1 - Math.random() * 0.1,
        vz: (Math.random() - 0.5) * 0.2,
        rt: Math.random() * 0.2
      };
      this.scene.add(p);
      this._confettiParticles.push(p);
    }
  }
  // Animate
  this._confettiParticles.forEach(p => {
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;
    p.rotation.x += p.userData.rt;
    p.rotation.y += p.userData.rt;
    p.userData.vy -= 0.005; // gravity
  });
}
```

---

## 🎮 Additional Gameplay Improvements

### Better Mobile Controls
- Add tilt-to-steer using gyroscope (already partially implemented)
- Swipe gestures for lane changes
- Larger touch targets (48px minimum)

### Vehicle Handling
- Increase grip slightly for smoother handling
- Add automatic brake on high-speed collision
- Better suspension feel

### Audio Improvements
- Engine sound synthesis (Web Audio API)
- Collision impact sounds
- Level complete jingle
- Ambient city sounds

---

## Performance Targets

| Platform | FPS | Triangles | Draw Calls |
|----------|-----|-----------|------------|
| Desktop | 60 | 500K | 200 |
| Mobile High | 60 | 200K | 100 |
| Mobile Mid | 30 | 100K | 50 |
| Mobile Low | 30 | 50K | 30 |

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `game_core.js` | Camera shake, toon materials, particles, confetti | High |
| `ui.js` | Switch to MeshToonMaterial | High |
| `start.js` | Per-level loading (future) | Medium |
| `Driving.html` | Touch target sizing | Medium |

---

## Quick Wins Summary

1. ✅ Add camera shake on collision (2-3 hours)
2. ✅ Switch to MeshToonMaterial (4-6 hours)
3. ✅ Add particle effects (3-4 hours)
4. ✅ Confetti celebration (2 hours)

**Total Estimated Effort:** 11-15 hours

---

## Next Steps

1. Implement camera shake in `game_core.js`
2. Switch materials to MeshToonMaterial in `ui.js` and `game_core.js`
3. Add particle system for dust/rain
4. Add confetti on level completion

---

*Document generated: 2026-07-02*
*Based on code analysis of Traffic game codebase*