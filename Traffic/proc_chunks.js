// ============================================
// 3-Tier LOD Chunk System for Traffic Simulator
// Inspired by slowroads.io's multi-grid architecture
//
// Tier 1 (Far):    1km x 1km chunks, very low poly — distant landscape
// Tier 2 (Medium): 100m x 100m chunks, medium poly — surrounding area
// Tier 3 (Near):   10m x 10m chunks, high poly — road corridor + player
// ============================================

// ============================================
// GeometryPool - reuses Three.js geometries to reduce GC
// ============================================
class GeometryPool {
  constructor() {
    this.pools = new Map(); // key: "size_res" -> Array<BufferGeometry>
  }

  _key(size, res) {
    return `${size}_${res}`;
  }

  get(size, res) {
    const key = this._key(size, res);
    const pool = this.pools.get(key);
    if (pool && pool.length > 0) {
      return pool.pop();
    }
    // Create new
    const geo = new THREE.PlaneGeometry(size, size, res, res);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  release(geo, size, res) {
    const key = this._key(size, res);
    if (!this.pools.has(key)) this.pools.set(key, []);
    const pool = this.pools.get(key);
    if (pool.length < 20) { // limit pool size
      pool.push(geo);
    } else {
      geo.dispose();
    }
  }

  clear() {
    for (const [key, pool] of this.pools) {
      for (const geo of pool) geo.dispose();
    }
    this.pools.clear();
  }
}

// ============================================
// ChunkTier - manages one LOD tier
// ============================================
class ChunkTier {
  constructor(scene, terrain, opts) {
    this.scene = scene;
    this.terrain = terrain;
    this.chunkSize = opts.chunkSize;     // world units per chunk
    this.resolution = opts.resolution;   // vertices per chunk side
    this.viewDistance = opts.viewDistance; // in chunks
    this.chunks = new Map();  // key -> mesh
    this.geoPool = opts.geoPool || null;
  }

  _key(cx, cz) {
    return `${cx},${cz}`;
  }

  worldToChunk(x, z) {
    return {
      cx: Math.floor(x / this.chunkSize),
      cz: Math.floor(z / this.chunkSize),
    };
  }

  // Generate a chunk mesh at grid position
  generateChunk(cx, cz) {
    const size = this.chunkSize;
    const res = this.resolution;
    const worldX = cx * size;
    const worldZ = cz * size;

    // Get or create geometry
    let geo;
    if (this.geoPool) {
      geo = this.geoPool.get(size, res);
      // Re-dispose old positions if reusing
      geo.dispose();
      geo = new THREE.PlaneGeometry(size, size, res, res);
      geo.rotateX(-Math.PI / 2);
    } else {
      geo = new THREE.PlaneGeometry(size, size, res, res);
      geo.rotateX(-Math.PI / 2);
    }

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < positions.count; i++) {
      const lx = positions.getX(i);
      const lz = positions.getZ(i);
      const wx = worldX + lx;
      const wz = worldZ + lz;

      const h = this.terrain.getHeight(wx, wz);
      positions.setY(i, h);

      // Vertex coloring by biome
      const biome = this.terrain.getBiome(wx, wz);
      switch (biome) {
        case 'water': color.setHex(0x2266aa); break;
        case 'sand': color.setHex(0xc2b280); break;
        case 'rock': color.setHex(0x888888); break;
        case 'grass_wet': color.setHex(0x337733); break;
        case 'grass_dry': color.setHex(0x66aa44); break;
        default: color.setHex(0x448844);
      }
      const heightFactor = (h + this.terrain.amplitude) / (2 * this.terrain.amplitude);
      color.multiplyScalar(0.7 + heightFactor * 0.3);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(worldX + size / 2, 0, worldZ + size / 2);
    mesh.chunkX = cx;
    mesh.chunkZ = cz;

    return mesh;
  }

  // Update visible chunks based on center position
  update(centerX, centerZ, hideVerts = null) {
    const { cx: pcx, cz: pcz } = this.worldToChunk(centerX, centerZ);

    const needed = new Set();

    // Create needed chunks
    for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
      for (let dz = -this.viewDistance; dz <= this.viewDistance; dz++) {
        // Circular falloff for far tiers
        if (this.viewDistance > 3) {
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > this.viewDistance) continue;
        }
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = this._key(cx, cz);
        needed.add(key);

        if (!this.chunks.has(key)) {
          const mesh = this.generateChunk(cx, cz);
          this.chunks.set(key, mesh);
          this.scene.add(mesh);
        }
      }
    }

    // Remove unneeded chunks
    for (const [key, mesh] of this.chunks) {
      if (!needed.has(key)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.chunks.delete(key);
      }
    }

    // Hide vertices that overlap with higher-detail tiers
    if (hideVerts) {
      this._applyVertexHiding(hideVerts);
    }
  }

  // Sink vertices that are covered by higher-detail tiers
  _applyVertexHiding(hideRegions) {
    for (const [key, mesh] of this.chunks) {
      const positions = mesh.geometry.attributes.position;
      if (!positions) continue;
      const worldX = mesh.chunkX * this.chunkSize;
      const worldZ = mesh.chunkZ * this.chunkSize;

      for (let i = 0; i < positions.count; i++) {
        const lx = positions.getX(i);
        const lz = positions.getZ(i);
        const wx = worldX + lx;
        const wz = worldZ + lz;

        for (const region of hideRegions) {
          if (region.contains(wx, wz)) {
            // Sink this vertex below the detailed mesh
            positions.setY(i, positions.getY(i) - 2.0);
          }
        }
      }
      positions.needsUpdate = true;
    }
  }

  // Get hide regions from this tier (for lower tiers to hide under)
  getHideRegions() {
    const regions = [];
    for (const [key, mesh] of this.chunks) {
      const halfSize = this.chunkSize / 2;
      const cx = mesh.chunkX * this.chunkSize + halfSize;
      const cz = mesh.chunkZ * this.chunkSize + halfSize;
      regions.push({
        x: cx, z: cz,
        halfSize: halfSize,
        contains: (x, z) =>
          Math.abs(x - cx) < halfSize && Math.abs(z - cz) < halfSize,
      });
    }
    return regions;
  }

  rebuild() {
    for (const [key, mesh] of this.chunks) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.chunks.clear();
  }

  getStats() {
    return {
      activeChunks: this.chunks.size,
      chunkSize: this.chunkSize,
      resolution: this.resolution,
    };
  }
}

// ============================================
// ProcChunkManager - orchestrates all 3 tiers
// ============================================
class ProcChunkManager {
  constructor(scene, terrain, qualityPreset = 'MED') {
    this.scene = scene;
    this.terrain = terrain;
    this.quality = qualityPreset;
    this.geoPool = new GeometryPool();

    // Configure tiers based on quality
    const config = this._getQualityConfig(qualityPreset);

    // Tier 1: Far grid — large landscape chunks
    this.farTier = new ChunkTier(scene, terrain, {
      chunkSize: config.far.chunkSize,
      resolution: config.far.resolution,
      viewDistance: config.far.viewDistance,
      geoPool: this.geoPool,
    });

    // Tier 2: Medium grid — surrounding area
    this.medTier = new ChunkTier(scene, terrain, {
      chunkSize: config.med.chunkSize,
      resolution: config.med.resolution,
      viewDistance: config.med.viewDistance,
      geoPool: this.geoPool,
    });

    // Tier 3: Near grid — road corridor (highest detail)
    this.nearTier = new ChunkTier(scene, terrain, {
      chunkSize: config.near.chunkSize,
      resolution: config.near.resolution,
      viewDistance: config.near.viewDistance,
      geoPool: this.geoPool,
    });

    // Road data (optional — near tier follows road if available)
    this.roadData = null;
    this._frameCounter = 0;
  }

  _getQualityConfig(preset) {
    const configs = {
      LOW: {
        far: { chunkSize: 500, resolution: 4, viewDistance: 2 },
        med: { chunkSize: 100, resolution: 6, viewDistance: 2 },
        near: { chunkSize: 10, resolution: 8, viewDistance: 2 },
      },
      MED: {
        far: { chunkSize: 500, resolution: 6, viewDistance: 3 },
        med: { chunkSize: 100, resolution: 10, viewDistance: 3 },
        near: { chunkSize: 10, resolution: 16, viewDistance: 3 },
      },
      HIGH: {
        far: { chunkSize: 500, resolution: 8, viewDistance: 4 },
        med: { chunkSize: 100, resolution: 16, viewDistance: 4 },
        near: { chunkSize: 10, resolution: 24, viewDistance: 4 },
      },
      ULTRA: {
        far: { chunkSize: 500, resolution: 12, viewDistance: 5 },
        med: { chunkSize: 100, resolution: 24, viewDistance: 5 },
        near: { chunkSize: 10, resolution: 32, viewDistance: 5 },
      },
    };
    return configs[preset] || configs.MED;
  }

  setQuality(preset) {
    this.quality = preset;
    this.rebuild();
  }

  // Set road data for near-tier to follow
  setRoadData(roadData) {
    this.roadData = roadData;
  }

  // Update all tiers based on player position
  update(playerX, playerZ) {
    // Update far tier (every 3rd frame for performance)
    if (this._frameCounter % 3 === 0) {
      this.farTier.update(playerX, playerZ);
    }

    // Update medium tier (every 2nd frame)
    if (this._frameCounter % 2 === 0) {
      const farRegions = this.farTier.getHideRegions();
      this.medTier.update(playerX, playerZ, farRegions);
    }

    // Update near tier (every frame — most important)
    // If road data exists, center near tier on closest road point
    let nearX = playerX, nearZ = playerZ;
    if (this.roadData && this.roadData.fine.length > 0) {
      const closest = this._findClosestRoadPoint(playerX, playerZ);
      if (closest) {
        // Blend between player and road — follow road but allow some freedom
        nearX = playerX * 0.3 + closest.x * 0.7;
        nearZ = playerZ * 0.3 + closest.z * 0.7;
      }
    }

    const medRegions = this.medTier.getHideRegions();
    this.nearTier.update(nearX, nearZ, medRegions);

    this._frameCounter++;
  }

  _findClosestRoadPoint(x, z) {
    if (!this.roadData) return null;
    const fine = this.roadData.fine;
    let bestDist = Infinity;
    let bestPoint = null;
    // Sample every 20th point for speed
    for (let i = 0; i < fine.length; i += 20) {
      const p = fine[i];
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestPoint = p;
      }
    }
    return bestPoint;
  }

  // Get height at world position (for physics)
  getHeightAt(x, z) {
    return this.terrain.getHeight(x, z);
  }

  // Get normal at world position (for physics)
  getNormalAt(x, z) {
    return this.terrain.getNormal(x, z);
  }

  // Get slope at world position
  getSlopeAt(x, z) {
    return this.terrain.getSlope(x, z);
  }

  rebuild() {
    this.farTier.rebuild();
    this.medTier.rebuild();
    this.nearTier.rebuild();
  }

  getStats() {
    return {
      quality: this.quality,
      far: this.farTier.getStats(),
      med: this.medTier.getStats(),
      near: this.nearTier.getStats(),
      totalChunks: this.farTier.chunks.size + this.medTier.chunks.size + this.nearTier.chunks.size,
    };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.GeometryPool = GeometryPool;
  window.ChunkTier = ChunkTier;
  window.ProcChunkManager = ProcChunkManager;
}
