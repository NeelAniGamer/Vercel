---
name: 3d-game-dev
description: 3D game development principles. Rendering pipeline optimization, shader development, physics implementation, camera systems, and lighting strategies for efficient and visually compelling game systems across various hardware platforms.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# 3D Game Development

> Core principles and implementation patterns for 3D rendering, shaders, physics, and camera systems.

---

## 1. Rendering Pipeline

### Stages

```
1. Vertex Processing → Transform geometry
2. Rasterization → Convert to pixels
3. Fragment Processing → Color pixels
4. Output → To screen
```

### Optimization Principles

| Technique | Purpose |
|-----------|---------|
| **Frustum culling** | Don't render off-screen objects |
| **Occlusion culling** | Don't render hidden objects |
| **LOD (Level of Detail)** | Less detail at distance |
| **Batching** | Combine draw calls |
| **Instancing** | Reuse geometry with transforms |
| **Object pooling** | Reuse objects instead of creating/destroying |

### Performance Targets

| Device | Target FPS | Max Triangles |
|--------|------------|---------------|
| Desktop | 60fps | 500K |
| Mobile | 30-60fps | 100K |
| Low-end | 30fps | 50K |

---

## 2. Shader Principles

### Shader Types

| Type | Purpose |
|------|---------|
| **Vertex** | Position, normals, UV transformation |
| **Fragment/Pixel** | Color, lighting, texture sampling |
| **Compute** | General GPU computation (particles, physics) |

### When to Write Custom Shaders

- Special effects (water, fire, portals, shields)
- Stylized rendering (toon, sketch, pixel art)
- Performance optimization (GPU-side calculations)
- Unique visual identity (dissolve, hologram, time manipulation)

### Common Shader Patterns

```glsl
// Simple toon shading
float intensity = dot(normal, lightDir);
float toon = floor(intensity * 4.0) / 4.0;

// Dissolve effect
float dissolve = texture(dissolveMap, uv).r;
clip(dissolve - threshold);

// Hologram
float scanline = sin(position.y * 50.0 + time) * 0.5 + 0.5;
```

---

## 3. 3D Physics

### Collision Shapes

| Shape | Use Case | Performance |
|-------|----------|-------------|
| **Box** | Buildings, crates, walls | Fast |
| **Sphere** | Balls, quick proximity checks | Fastest |
| **Capsule** | Characters, NPCs | Fast |
| **Cylinder** | Pillars, trees | Medium |
| **Mesh** | Terrain, complex geometry | Expensive |

### Principles

- **Simple colliders, complex visuals**: Use primitive shapes for physics, detailed meshes for rendering
- **Layer-based filtering**: Physics layers to ignore irrelevant collisions
- **Raycasting for line-of-sight**: Cheap visibility checks
- **Trigger volumes**: For zones, pickups, entrances

### Physics Implementation

```javascript
// Simple AABB collision
function checkAABB(a, b) {
  return a.min.x <= b.max.x && a.max.x >= b.min.x &&
         a.min.y <= b.max.y && a.max.y >= b.min.y &&
         a.min.z <= b.max.z && a.max.z >= b.min.z;
}

// Sphere collision (distance-based)
function checkSphere(a, b, radiusA, radiusB) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
  return dist < radiusA + radiusB;
}
```

---

## 4. Camera Systems

### Camera Types

| Type | Use | Controls |
|------|-----|----------|
| **First-person** | Immersive, FPS | PointerLock + WASD |
| **Third-person** | Action, adventure | Orbit + WASD (camera-relative) |
| **Isometric** | Strategy, RPG | Fixed angle + click/keyboard |
| **Orbital** | Inspection, editors | Mouse drag orbit |
| **Chase cam** | Racing | Follow behind vehicle |
| **Fixed** | Puzzles, cutscenes | Scripted positions |

### Camera Feel

- **Smooth following**: Use lerp/slerp for natural movement
- **Collision avoidance**: Raycast from target to camera, pull closer if obstructed
- **Look-ahead**: Offset camera in movement direction
- **FOV changes**: Increase FOV at high speed for sense of velocity
- **Screen shake**: Add trauma/intensity for impacts

### Third-Person Camera Implementation

```javascript
// Camera-relative movement (CRITICAL for third-person games)
const cameraDirection = new THREE.Vector3();
camera.getWorldDirection(cameraDirection);
cameraDirection.y = 0;
cameraDirection.normalize();

const moveDirection = new THREE.Vector3();
if (keys.w) moveDirection.add(cameraDirection);
if (keys.s) moveDirection.sub(cameraDirection);
if (keys.a) moveDirection.cross(new THREE.Vector3(0, 1, 0));
if (keys.d) moveDirection.cross(new THREE.Vector3(0, 1, 0)).negate();
moveDirection.normalize();
```

---

## 5. Lighting

### Light Types

| Type | Use | Performance |
|------|-----|-------------|
| **Directional** | Sun, moon | Medium (shadows expensive) |
| **Point** | Lamps, torches, explosions | Medium |
| **Spot** | Flashlight, stage lights | Medium |
| **Ambient** | Base illumination | Cheap |
| **Hemisphere** | Sky/ground color blending | Cheap |

### Performance Considerations

- **Real-time shadows are expensive**: Bake when possible
- **Shadow cascades**: For large worlds, use different shadow maps per distance
- **Blob shadows**: Simple projected circles for mobile/cheap shadows
- **Light limits**: Max 4-8 dynamic lights per scene on mobile

### Lighting Rig (Minimum)

```
Key Light:    DirectionalLight (warm, intensity 2.0-3.0, casts shadow)
Fill Light:   DirectionalLight (cool, opposite side, 0.5-1.0, no shadow)
Hemisphere:   sky + ground colors, intensity 0.4-0.6
Ambient:      intensity 0.5-0.8 (safety net for dark scenes)
```

---

## 6. Level of Detail (LOD)

### LOD Strategy

| Distance | Model | Use Case |
|----------|-------|----------|
| Near | Full detail | Player-adjacent objects |
| Medium | 50% triangles | Mid-range objects |
| Far | 25% or billboard | Distant objects |

### Implementation

```javascript
// Three.js LOD
const lod = new THREE.LOD();
lod.addLevel(highDetailModel, 0);    // 0-20 units
lod.addLevel(medDetailModel, 20);    // 20-50 units
lod.addLevel(lowDetailModel, 50);    // 50+ units
scene.add(lod);

// Update in render loop
lod.update(camera);
```

---

## 7. Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Mesh colliders everywhere | Simple primitive shapes |
| Real-time shadows on mobile | Baked or blob shadows |
| One LOD for all distances | Distance-based LOD tiers |
| Unoptimized shaders | Profile and simplify |
| Creating/destroying objects | Object pooling |
| Per-frame allocations | Reuse vectors/colors |
| Default MeshBasicMaterial | PBR materials (Standard/Physical) |

---

## 8. Common Game Patterns

### Entity Component System (ECS)

```javascript
// Components are plain data
const health = { current: 100, max: 100 };
const position = { x: 0, y: 0, z: 0 };
const velocity = { x: 0, y: 0, z: 0 };

// Systems process components
function movementSystem(entities) {
  entities.forEach(e => {
    if (e.position && e.velocity) {
      e.position.x += e.velocity.x * delta;
      e.position.y += e.velocity.y * delta;
      e.position.z += e.velocity.z * delta;
    }
  });
}
```

### Object Pooling

```javascript
class ObjectPool {
  constructor(createFn, initialSize = 20) {
    this.pool = [];
    this.createFn = createFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }
  get() {
    return this.pool.length > 0 ? this.pool.pop() : this.createFn();
  }
  release(obj) {
    this.pool.push(obj);
  }
}
```

### State Machine (AI)

```javascript
class StateMachine {
  constructor(entity) {
    this.entity = entity;
    this.states = {};
    this.currentState = null;
  }
  addState(name, state) { this.states[name] = state; }
  setState(name) {
    if (this.currentState) this.currentState.exit(this.entity);
    this.currentState = this.states[name];
    this.currentState.enter(this.entity);
  }
  update(delta) {
    if (this.currentState) this.currentState.update(this.entity, delta);
  }
}
```

---

## When to Use

- Building or optimizing 3D game rendering
- Implementing physics and collision systems
- Designing camera systems for games
- Writing custom shaders for visual effects
- Optimizing performance for mobile/low-end devices
- Debugging rendering or physics issues

## Limitations

- Use this skill only when the task clearly matches the scope described above
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing
