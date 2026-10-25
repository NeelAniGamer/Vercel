// ════════════════════════════════════════════════════════════════════════════════
// HEAVY OPTIMIZATION MODULE — Mumbai Traffic Hero Academy
// Targets: 60fps desktop, 30fps mobile, <16ms frame budget
// Inspired by: GTA V (occlusion), Forza (LOD), Assassin's Creed (streaming)
// ════════════════════════════════════════════════════════════════════════════════

const Optimization = {
  // ─── Configuration ───
  config: {
    // Frustum culling
    enableFrustumCulling: true,
    frustumPadding: 20,
    
    // Instanced rendering
    enableInstancing: true,
    maxInstancesPerBatch: 1000,
    
    // LOD system
    enableLOD: true,
    lodDistances: [50, 150, 300, 600], // Near, Mid, Far, Culled
    lodDetailLevels: [1.0, 0.5, 0.25, 0.0],
    
    // NPC optimization
    npcUpdateBudget: 2.5, // ms per frame
    npcSpatialGridSize: 100,
    npcFarUpdateRate: 0.25, // 4Hz for distant NPCs
    
    // World streaming
    streamingMaxChunksPerFrame: 1,
    streamingPreloadRadius: 3,
    
    // Physics
    physicsFixedTimestep: 1/60,
    physicsMaxSubSteps: 3,
    enablePhysicsCaching: true,
    
    // Shadows
    enableCSM: true,
    csmCascades: 3,
    shadowUpdateRate: 30, // Hz
    
    // Particles
    maxParticles: 5000,
    particlePoolSize: 8000,
    
    // Memory
    gcBudget: 5, // ms
    poolSizes: {
      vector3: 500,
      matrix4: 100,
      quaternion: 100,
      mesh: 500,
      group: 200
    }
  },
  
  // ─── Frustum Culling System ───
  frustum: new THREE.Frustum(),
  projScreenMatrix: new THREE.Matrix4(),
  
  updateFrustum(camera) {
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  },
  
  isVisible(object, padding = 20) {
    if (!object.geometry || !object.geometry.boundingSphere) {
      object.geometry.computeBoundingSphere();
    }
    const sphere = object.geometry.boundingSphere.clone();
    sphere.applyMatrix4(object.matrixWorld);
    sphere.radius += padding;
    return this.frustum.intersectsSphere(sphere);
  },
  
  // ─── Spatial Grid for NPCs ───
  spatialGrid: new Map(),
  gridSize: 100,
  
  getGridKey(x, z) {
    const gx = Math.floor(x / this.gridSize);
    const gz = Math.floor(z / this.gridSize);
    return `${gx},${gz}`;
  },
  
  insertNPC(npc) {
    const key = this.getGridKey(npc.position.x, npc.position.z);
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    this.spatialGrid.get(key).push(npc);
    npc._gridKey = key;
  },
  
  removeNPC(npc) {
    if (npc._gridKey && this.spatialGrid.has(npc._gridKey)) {
      const cell = this.spatialGrid.get(npc._gridKey);
      const idx = cell.indexOf(npc);
      if (idx >= 0) cell.splice(idx, 1);
    }
  },
  
  getNearbyNPCs(x, z, radius = 150) {
    const result = [];
    const cellRadius = Math.ceil(radius / this.gridSize);
    const cx = Math.floor(x / this.gridSize);
    const cz = Math.floor(z / this.gridSize);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        const cell = this.spatialGrid.get(key);
        if (cell) result.push(...cell);
      }
    }
    return result;
  },
  
  clearGrid() {
    this.spatialGrid.clear();
  },
  
  // ─── Instanced Mesh Manager ───
  instanceMeshes: new Map(),
  
  createInstancedMesh(geometry, material, count, name) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    this.instanceMeshes.set(name, {
      mesh,
      count: 0,
      maxCount: count,
      matrices: new Float32Array(count * 16),
      dummy: new THREE.Object3D()
    });
    return mesh;
  },
  
  setInstanceTransform(name, index, position, rotation, scale) {
    const inst = this.instanceMeshes.get(name);
    if (!inst || index >= inst.maxCount) return false;
    
    inst.dummy.position.copy(position);
    inst.dummy.rotation.copy(rotation);
    inst.dummy.scale.copy(scale);
    inst.dummy.updateMatrix();
    inst.dummy.matrix.toArray(inst.matrices, index * 16);
    inst.count = Math.max(inst.count, index + 1);
    return true;
  },
  
  commitInstances(name) {
    const inst = this.instanceMeshes.get(name);
    if (!inst) return;
    inst.mesh.instanceMatrix.needsUpdate = true;
    inst.mesh.count = inst.count;
    inst.count = 0; // Reset for next frame
  },
  
  // ─── LOD System ───
  lodRegistry: [],
  
  registerLOD(object, lodLevels) {
    this.lodRegistry.push({ object, lodLevels, currentLOD: 0 });
  },
  
  updateLOD(cameraPosition) {
    for (const entry of this.lodRegistry) {
      const dist = entry.object.position.distanceTo(cameraPosition);
      let newLOD = 0;
      for (let i = 0; i < this.config.lodDistances.length; i++) {
        if (dist > this.config.lodDistances[i]) newLOD = i + 1;
        else break;
      }
      if (newLOD !== entry.currentLOD) {
        entry.currentLOD = newLOD;
        if (newLOD >= entry.lodLevels.length) {
          entry.object.visible = false;
        } else {
          entry.object.visible = true;
          // Switch geometry/material based on LOD
          if (entry.lodLevels[newLOD]) {
            entry.object.geometry = entry.lodLevels[newLOD].geometry;
            entry.object.material = entry.lodLevels[newLOD].material;
          }
        }
      }
    }
  },
  
  // ─── Physics Cache ───
  physicsCache: new Map(),
  
  getCachedPhysics(key, factory) {
    if (this.config.enablePhysicsCaching && this.physicsCache.has(key)) {
      return this.physicsCache.get(key);
    }
    const result = factory();
    if (this.config.enablePhysicsCaching) {
      this.physicsCache.set(key, result);
    }
    return result;
  },
  
  // ─── Performance Monitor ───
  stats: {
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    npcCount: 0,
    visibleNPCs: 0,
    instancedDrawCalls: 0,
    shadowUpdates: 0,
    gcTime: 0
  },
  
  measureFrame(renderer, dt) {
    this.stats.frameTime = dt * 1000;
    if (renderer.info) {
      this.stats.drawCalls = renderer.info.render.calls;
      this.stats.triangles = renderer.info.render.triangles;
    }
  },
  
  // ─── Auto Quality Adjustment ───
  qualityLevel: 2, // 0=Low, 1=Med, 2=High, 3=Ultra
  frameHistory: [],
  
  checkFrameBudget(targetFPS = 60) {
    this.frameHistory.push(this.stats.frameTime);
    if (this.frameHistory.length > 120) this.frameHistory.shift();
    
    if (this.frameHistory.length === 120) {
      const avg = this.frameHistory.reduce((a, b) => a + b, 0) / 120;
      const budget = 1000 / targetFPS;
      
      if (avg > budget * 1.2 && this.qualityLevel > 0) {
        this.qualityLevel--;
        this.applyQuality(this.qualityLevel);
        console.log(`[Optimization] Downgraded to quality level ${this.qualityLevel}`);
      } else if (avg < budget * 0.6 && this.qualityLevel < 3) {
        this.qualityLevel++;
        this.applyQuality(this.qualityLevel);
        console.log(`[Optimization] Upgraded to quality level ${this.qualityLevel}`);
      }
    }
  },
  
  applyQuality(level) {
    const presets = {
      0: { // Low
        shadowRes: 256, maxParticles: 500, lodBias: 0.5,
        npcCount: 30, updateRate: 0.15, bloom: false
      },
      1: { // Medium
        shadowRes: 512, maxParticles: 1500, lodBias: 0.75,
        npcCount: 50, updateRate: 0.25, bloom: false
      },
      2: { // High
        shadowRes: 1024, maxParticles: 3000, lodBias: 1.0,
        npcCount: 75, updateRate: 0.5, bloom: false
      },
      3: { // Ultra
        shadowRes: 2048, maxParticles: 5000, lodBias: 1.5,
        npcCount: 100, updateRate: 1.0, bloom: true
      }
    };
    return presets[level] || presets[1];
  },
  
  // ─── Initialization ───
  init(game) {
    this.game = game;
    this.clearGrid();
    
    // Pre-warm pools
    if (window.ThreePools) {
      const p = this.config.poolSizes;
      ThreePools.vec3 = new (ThreePools.vec3.constructor)(ThreePools.vec3.factory, ThreePools.vec3.resetFn, p.vector3);
      ThreePools.mat4 = new (ThreePools.mat4.constructor)(ThreePools.mat4.factory, ThreePools.mat4.resetFn, p.matrix4);
      ThreePools.quat = new (ThreePools.quat.constructor)(ThreePools.quat.factory, ThreePools.quat.resetFn, p.quaternion);
      ThreePools.mesh = new (ThreePools.mesh.constructor)(ThreePools.mesh.factory, ThreePools.mesh.resetFn, p.mesh);
      ThreePools.group = new (ThreePools.group.constructor)(ThreePools.group.factory, ThreePools.group.resetFn, p.group);
    }
    
    console.log('[Optimization] Initialized - Heavy optimization mode active');
  },
  
  // ─── Per-Frame Update ───
  update(dt, camera, renderer) {
    // Update frustum for culling
    if (this.config.enableFrustumCulling) {
      this.updateFrustum(camera);
    }
    
    // Update LOD
    if (this.config.enableLOD && camera) {
      this.updateLOD(camera.position);
    }
    
    // Commit instanced meshes
    if (this.config.enableInstancing) {
      for (const name of this.instanceMeshes.keys()) {
        this.commitInstances(name);
      }
    }
    
    // Measure performance
    this.measureFrame(renderer, dt);
    this.checkFrameBudget();
    
    // Clear spatial grid for rebuild
    this.clearGrid();
  },
  
  // ─── Instanced Vegetation Builder ───
  buildInstancedVegetation(game, assetKeys, positions, scales, rotations) {
    if (!assetKeys.length) return null;
    
    // Use first asset as template
    const template = window.PRELOADED_MODELS?.[assetKeys[0]];
    if (!template) return null;
    
    const geometry = template.geometry?.clone() || new THREE.BoxGeometry(1, 1, 1);
    const material = template.material?.clone() || new THREE.MeshStandardMaterial({ color: 0x228822 });
    
    // Enable instancing
    geometry.instanceCount = positions.length / 3;
    
    const mesh = new THREE.InstancedMesh(geometry, material, geometry.instanceCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    
    for (let i = 0; i < geometry.instanceCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const s = scales[i] || 1;
      const ry = rotations[i] || 0;
      
      dummy.position.set(x, y, z);
      dummy.rotation.y = ry;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      matrix.copy(dummy.matrix);
      mesh.setMatrixAt(i, matrix);
    }
    
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  },
  
  // ─── Optimized NPC Batch Update ───
  updateNPCsBatch(npcs, playerPos, dt, camera) {
    const budget = this.config.npcUpdateBudget;
    const startTime = performance.now();
    let updated = 0;
    
    // Sort by distance to player (closest first)
    npcs.sort((a, b) => {
      const da = a.position.distanceToSquared(playerPos);
      const db = b.position.distanceToSquared(playerPos);
      return da - db;
    });
    
    for (const npc of npcs) {
      if (!npc.active) continue;
      
      const dist = npc.position.distanceTo(playerPos);
      const updateRate = dist > 200 ? this.config.npcFarUpdateRate : 1.0;
      
      // Skip frames for distant NPCs
      if (updateRate < 1.0) {
        npc._updateAccum = (npc._updateAccum || 0) + dt;
        if (npc._updateAccum < 1 / (60 * updateRate)) continue;
        dt = npc._updateAccum;
        npc._updateAccum = 0;
      }
      
      // Frustum culling
      if (this.config.enableFrustumCulling && npc.mesh) {
        if (!this.isVisible(npc.mesh)) {
          if (npc.mesh.visible) npc.mesh.visible = false;
          continue;
        } else {
          if (!npc.mesh.visible) npc.mesh.visible = true;
        }
      }
      
      // Update NPC AI
      if (npc.npcAI && typeof npc.npcAI.update === 'function') {
        npc.npcAI.update(dt, { position: playerPos }, []);
      }
      
      updated++;
      
      // Budget check
      if (performance.now() - startTime > budget) break;
    }
    
    this.stats.npcCount = npcs.length;
    this.stats.visibleNPCs = updated;
    
    return updated;
  },
  
  // ─── Debug Stats Display ───
  createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'optimization-debug';
    panel.style.cssText = `
      position: fixed; top: 10px; right: 10px; z-index: 10000;
      background: rgba(0,0,0,0.8); color: #0f0; padding: 10px;
      font-family: monospace; font-size: 11px; border-radius: 4px;
      pointer-events: none; min-width: 200px;
    `;
    document.body.appendChild(panel);
    this.debugPanel = panel;
  },
  
  updateDebugPanel() {
    if (!this.debugPanel) return;
    const s = this.stats;
    this.debugPanel.innerHTML = `
      <b>OPTIMIZATION STATS</b><br>
      Frame: ${s.frameTime.toFixed(1)}ms<br>
      Draw Calls: ${s.drawCalls}<br>
      Triangles: ${(s.triangles/1000).toFixed(1)}k<br>
      NPCs: ${s.visibleNPCs}/${s.npcCount}<br>
      Instanced: ${s.instancedDrawCalls}<br>
      Quality: ${['Low','Med','High','Ultra'][this.qualityLevel]}<br>
      LOD Entries: ${this.lodRegistry.length}
    `;
  }
};

// Export for global access
window.Optimization = Optimization;

// ─── Auto-Init Hook ───
document.addEventListener('DOMContentLoaded', () => {
  // Wait for game to initialize
  const checkGame = setInterval(() => {
    if (window.game && window.game.renderCore) {
      clearInterval(checkGame);
      Optimization.init(window.game);
      if (window._trafficDebug) {
        Optimization.createDebugPanel();
      }
    }
  }, 100);
});

if (typeof module !== 'undefined' && module.exports) { module.exports = Optimization; }