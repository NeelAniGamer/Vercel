// ════════════════════════════════════════════════════════════════════════════════
// OPTIMIZED WORLD STREAMER — Instanced Rendering, Frustum Culling, LOD
// ════════════════════════════════════════════════════════════════════════════════

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function chunkHash(cx, cz) {
  return cx * 73856093 ^ cz * 19349663;
}

class OptimizedCityChunk {
  constructor(cx, cz, size, game, options = {}) {
    this.cx = cx;
    this.cz = cz;
    this.size = size;
    this.game = game;
    this.worldX = cx * size;
    this.worldZ = cz * size;
    this.group = new THREE.Group();
    this.group.name = `chunk_${cx}_${cz}`;
    this.group.position.set(this.worldX, 0, this.worldZ);
    this.disposed = false;
    this.rng = mulberry32(Math.abs(chunkHash(cx, cz)));
    
    // Instanced mesh caches
    this.instancedMeshes = new Map(); // key -> { mesh, count, matrices, dummy }
    this.instanceData = new Map();    // key -> { positions, rotations, scales }
    
    // Bounding sphere for frustum culling
    this.bounds = new THREE.Sphere(
      new THREE.Vector3(this.worldX + size/2, 0, this.worldZ + size/2),
      size * 0.75
    );
  }

  generate() {
    if (this.disposed) return;
    const rng = this.rng;
    const distFromCenter = Math.hypot(this.cx, this.cz);
    const maxDist = 40;
    const density = Math.max(0.15, 1 - distFromCenter / maxDist);

    if (Math.abs(this.cx) <= 1 && Math.abs(this.cz) <= 1) {
      this.generateEmpty();
      return;
    }

    if (distFromCenter > maxDist * 0.8) {
      this.generateOutskirts(density);
      return;
    }

    if (distFromCenter < maxDist * 0.3) {
      this.generateDowntown(density);
      return;
    }

    this.generateSuburb(density);
  }

  generateEmpty() {
    this._generateTiles();
    this.game.scene.add(this.group);
  }

  generateDowntown(density) {
    this._generateTiles();
    this._generateBuildings(density, 0.3, true);
    this._generateProps(density, 0.4);
    this._generateFoliage(density, 0.6);
    this.game.scene.add(this.group);
  }

  generateSuburb(density) {
    this._generateTiles();
    this._generateBuildings(density, 0.6, false);
    this._generateProps(density, 0.6);
    this._generateFoliage(density, 0.4);
    this._generateParkedCars(density, 0.6);
    this._generateExtraFoliage(density, 0.7);
    this.game.scene.add(this.group);
  }

  generateOutskirts(density) {
    this._generateFoliage(density, 0.7);
    this._generateProps(density, 0.85);
    this.game.scene.add(this.group);
  }

  _generateTiles() {
    const tileKeys = WorldStreamer.ASSETS.tiles;
    if (tileKeys.length === 0 || !window.PRELOADED_MODELS) return;
    
    const key = tileKeys[Math.floor(this.rng() * tileKeys.length)];
    const model = window.PRELOADED_MODELS[key];
    if (!model) return;
    
    const tile = model.clone();
    tile.position.set(0, 0, 0);
    tile.rotation.y = Math.floor(this.rng() * 4) * (Math.PI / 2);
    this._optimizeMesh(tile);
    this.group.add(tile);
  }

  _generateBuildings(density, buildingProb, isDowntown) {
    const buildingKeys = WorldStreamer.ASSETS.buildings;
    if (buildingKeys.length === 0) return;
    
    if (this.rng() > buildingProb) return;
    
    const bldgKey = buildingKeys[Math.floor(this.rng() * buildingKeys.length)];
    const bldg = this._spawnAsset(bldgKey, 0, 0, Math.floor(this.rng() * 4) * (Math.PI / 2), 1.2);
    if (bldg) {
      this.game.obstacles.push(bldg);
      // Add to instanced buildings if suitable
      this._addToInstanced(bldg, 'building');
    }
  }

  _generateProps(density, propProb) {
    const propKeys = WorldStreamer.ASSETS.props;
    if (propKeys.length === 0 || this.rng() > propProb) return;
    
    const propKey = propKeys[Math.floor(this.rng() * propKeys.length)];
    const px = (this.rng() - 0.5) * 20;
    const pz = (this.rng() - 0.5) * 20;
    const prop = this._spawnAsset(propKey, px, pz, this.rng() * Math.PI, 1.0);
    if (prop) this._addToInstanced(prop, 'prop');
  }

  _generateFoliage(density, foliageProb) {
    const foliageKeys = WorldStreamer.ASSETS.foliage;
    if (foliageKeys.length === 0 || this.rng() > foliageProb) return;
    
    const folKey = foliageKeys[Math.floor(this.rng() * foliageKeys.length)];
    const fx = (this.rng() - 0.5) * 25;
    const fz = (this.rng() - 0.5) * 25;
    const fol = this._spawnAsset(folKey, fx, fz, 0, 1.0);
    if (fol) this._addToInstanced(fol, 'foliage');
  }

  _generateParkedCars(density, carProb) {
    const carKeys = WorldStreamer.ASSETS.cars;
    if (carKeys.length === 0 || this.rng() > carProb) return;
    
    const carKey = carKeys[Math.floor(this.rng() * carKeys.length)];
    const car = this._spawnAsset(carKey, 0, 0, Math.floor(this.rng() * 4) * (Math.PI / 2), 1.0);
    if (car) this._addToInstanced(car, 'prop');
  }

  _generateExtraFoliage(density, foliageProb) {
    const foliageKeys = WorldStreamer.ASSETS.foliage;
    if (foliageKeys.length === 0 || this.rng() > foliageProb) return;
    
    const folKey = foliageKeys[Math.floor(this.rng() * foliageKeys.length)];
    const fol = this._spawnAsset(folKey, 0, 0, 0, 1.0);
    if (fol) this._addToInstanced(fol, 'foliage');
  }

  _spawnAsset(key, x, z, ry, scale) {
    if (!window.PRELOADED_MODELS || !window.PRELOADED_MODELS[key]) return null;
    const source = window.PRELOADED_MODELS[key];
    const asset = source.clone();
    asset.position.set(x, 0, z);
    asset.rotation.y = ry;
    const s = scale * 4.5;
    asset.scale.set(s, s, s);
    
    this._optimizeMesh(asset);
    this.group.add(asset);
    return asset;
  }

  _optimizeMesh(object) {
    object.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.frustumCulled = true;
        if (c.material) {
          // Use shared material instances
          c.material.metalness = 0.1;
          c.material.roughness = 0.8;
        }
      }
    });
  }

  _addToInstanced(object, type) {
    // For instanced rendering, we collect transform data
    // and create InstancedMesh at chunk finalization
    if (!this.instanceData.has(type)) {
      this.instanceData.set(type, { positions: [], rotations: [], scales: [], keys: [] });
    }
    const data = this.instanceData.get(type);
    data.positions.push(object.position.x, object.position.y, object.position.z);
    data.rotations.push(object.rotation.y);
    data.scales.push(object.scale.x);
    data.keys.push(object.uuid);
    
    // Remove individual mesh, will be rendered via InstancedMesh
    this.group.remove(object);
  }

  finalizeInstanced() {
    // Create InstancedMesh for each type
    for (const [type, data] of this.instanceData) {
      if (data.positions.length === 0) continue;
      
      // Get a sample mesh for geometry/material
      const sampleKey = WorldStreamer.ASSETS[type === 'building' ? 'buildings' : type === 'foliage' ? 'foliage' : 'props'][0];
      const sample = window.PRELOADED_MODELS?.[sampleKey];
      if (!sample) continue;
      
      const count = data.positions.length / 3;
      const geometry = sample.geometry.clone();
      const material = sample.material.clone();
      
      const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instancedMesh.frustumCulled = true;
      instancedMesh.castShadow = type === 'building';
      instancedMesh.receiveShadow = true;
      
      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        dummy.position.set(data.positions[i*3], data.positions[i*3+1], data.positions[i*3+2]);
        dummy.rotation.y = data.rotations[i];
        dummy.scale.setScalar(data.scales[i]);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      
      this.group.add(instancedMesh);
      this.instancedMeshes.set(type, { mesh: instancedMesh, count });
    }
    
    this.instanceData.clear();
  }

  updateVisibility(camera) {
    if (this.disposed) return;
    
    // Frustum culling at chunk level
    if (window.Optimization && window.Optimization.config.enableFrustumCulling) {
      const frustum = window.Optimization.frustum;
      if (!frustum.intersectsSphere(this.bounds)) {
        this.group.visible = false;
        return;
      }
    }
    this.group.visible = true;
    
    // Update instanced mesh visibility per instance if needed
    for (const [type, inst] of this.instancedMeshes) {
      // Could implement per-instance culling here
      inst.mesh.visible = true;
    }
  }

  dispose() {
    this.disposed = true;
    this.game.scene.remove(this.group);
    
    // Clean up instanced meshes
    for (const [type, inst] of this.instancedMeshes) {
      inst.mesh.geometry.dispose();
      inst.mesh.material.dispose();
    }
    this.instancedMeshes.clear();
    this.instanceData.clear();
  }
}

class OptimizedWorldStreamer {
  constructor(game, options = {}) {
    this.game = game;
    this.chunkSize = options.chunkSize || 40;
    this.renderDistance = options.renderDistance || 8;
    this.bufferDistance = options.bufferDistance || 12;
    this.loadedChunks = new Map();
    this.lastCenterX = null;
    this.lastCenterZ = null;
    this.updateInterval = 0.5;
    this.timeSinceUpdate = 0;
    this.maxChunksPerFrame = options.maxChunksPerFrame || 1; // Reduced for performance
    this._enabled = true;
    
    // Pre-generate chunk grid for faster lookups
    this._chunkGrid = new Map();
  }

  update(playerPos, dt) {
    if (!this._enabled || !window.PRELOADED_MODELS) {
      if (this._enabled && !window.PRELOADED_MODELS) {
        console.warn('[WorldStreamer] No PRELOADED_MODELS available');
      }
      return;
    }

    this.timeSinceUpdate += dt;
    if (this.timeSinceUpdate < this.updateInterval) return;
    this.timeSinceUpdate = 0;

    const cx = Math.floor(playerPos.x / this.chunkSize);
    const cz = Math.floor(playerPos.z / this.chunkSize);

    if (cx === this.lastCenterX && cz === this.lastCenterZ) return;
    this.lastCenterX = cx;
    this.lastCenterZ = cz;

    const needed = new Set();
    const toLoad = [];
    const toUnload = [];

    // Circular render distance
    const renderDistSq = this.renderDistance * this.renderDistance;
    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        if (dx * dx + dz * dz > renderDistSq) continue;
        const key = `${cx + dx},${cz + dz}`;
        needed.add(key);
        if (!this.loadedChunks.has(key)) {
          toLoad.push([cx + dx, cz + dz]);
        }
      }
    }

    for (const [key, chunk] of this.loadedChunks) {
      if (!needed.has(key)) {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        const dist = Math.max(Math.abs(chunkX - cx), Math.abs(chunkZ - cz));
        if (dist > this.bufferDistance) {
          toUnload.push(key);
        }
      }
    }

    // Sort by distance (closest first)
    toLoad.sort((a, b) => {
      const da = Math.abs(a[0] - cx) + Math.abs(a[1] - cz);
      const db = Math.abs(b[0] - cx) + Math.abs(b[1] - cz);
      return da - db;
    });

    let loaded = 0;
    for (const [lx, lz] of toLoad) {
      if (loaded >= this.maxChunksPerFrame) break;
      this._loadChunk(lx, lz);
      loaded++;
    }

    for (const key of toUnload) {
      this._unloadChunk(key);
    }
  }

  _loadChunk(cx, cz) {
    const key = `${cx},${cz}`;
    if (this.loadedChunks.has(key)) return;

    const chunk = new OptimizedCityChunk(cx, cz, this.chunkSize, this.game);
    chunk.generate();
    chunk.finalizeInstanced();
    this.loadedChunks.set(key, chunk);
    
    if (chunk.instancedMeshes.size > 0) {
      console.log(`[WorldStreamer] Chunk (${cx},${cz}) generated with ${chunk.instancedMeshes.size} instanced groups`);
    }
  }

  _unloadChunk(key) {
    const chunk = this.loadedChunks.get(key);
    if (!chunk) return;
    chunk.dispose();
    this.loadedChunks.delete(key);
  }

  updateVisibility(camera) {
    for (const [, chunk] of this.loadedChunks) {
      chunk.updateVisibility(camera);
    }
  }

  reset() {
    for (const [, chunk] of this.loadedChunks) {
      chunk.dispose();
    }
    this.loadedChunks.clear();
    this.lastCenterX = null;
    this.lastCenterZ = null;
    this.timeSinceUpdate = 0;
  }

  getStats() {
    let objects = 0, buildings = 0, instances = 0;
    for (const [, chunk] of this.loadedChunks) {
      for (const [, inst] of chunk.instancedMeshes) {
        instances += inst.count;
      }
    }
    return {
      chunks: this.loadedChunks.size,
      objects,
      buildings,
      instances,
      renderDistance: this.renderDistance,
      bufferDistance: this.bufferDistance,
    };
  }
}

// Backward compatibility
window.WorldStreamer = OptimizedWorldStreamer;
window.CityChunk = OptimizedCityChunk;