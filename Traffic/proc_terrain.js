// Procedural Terrain Generator for Traffic Simulator
// Seeded Perlin noise heightmap with infinite tiling
// Compatible with Three.js r128, integrates with ThreePools and RenderCore

// ============================================
// Seeded PRNG (Mulberry32) - deterministic from seed
// ============================================
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================
// 2D Perlin Noise (seeded)
// ============================================
class SeededPerlin {
  constructor(seed) {
    const rng = mulberry32(seed);
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates shuffle with seeded PRNG
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  _lerp(a, b, t) {
    return a + t * (b - a);
  }

  _grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : -x;
    const v = h === 0 || h === 3 ? y : -y;
    return u + v;
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this._fade(xf);
    const v = this._fade(yf);
    const p = this.perm;
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];
    const x1 = this._lerp(this._grad(aa, xf, yf), this._grad(ba, xf - 1, yf), u);
    const x2 = this._lerp(this._grad(ab, xf, yf - 1), this._grad(bb, xf - 1, yf - 1), u);
    return this._lerp(x1, x2, v); // range: [-1, 1]
  }
}

// ============================================
// ProcTerrain - Main terrain class
// ============================================
class ProcTerrain {
  constructor(opts = {}) {
    this.seed = opts.seed || 12345;
    this.scale = opts.scale || 0.005;       // base frequency
    this.amplitude = opts.amplitude || 40;  // max height
    this.octaves = opts.octaves || 5;
    this.persistence = opts.persistence || 0.5;
    this.lacunarity = opts.lacunarity || 2.0;
    this.waterLevel = opts.waterLevel ?? -5;
    this.noise = new SeededPerlin(this.seed);
    this.biomeNoise = new SeededPerlin(this.seed + 1000);
    this.treeNoise = new SeededPerlin(this.seed + 2000);
  }

  // Get terrain height at world coordinates
  getHeight(x, z) {
    let h = 0;
    let amp = 1;
    let freq = this.scale;
    let maxAmp = 0;
    for (let i = 0; i < this.octaves; i++) {
      h += this.noise.noise2D(x * freq, z * freq) * amp;
      maxAmp += amp;
      amp *= this.persistence;
      freq *= this.lacunarity;
    }
    // Normalize to [-1, 1] then scale
    h = h / maxAmp;
    // Domain warping for more natural look
    const warp = this.noise.noise2D(x * this.scale * 0.3 + 100, z * this.scale * 0.3 + 100) * 0.3;
    h = h * (1 - Math.abs(warp)) + warp * 0.5;
    return h * this.amplitude;
  }

  // Get surface normal at world coordinates (for physics)
  getNormal(x, z, epsilon = 0.5) {
    const hL = this.getHeight(x - epsilon, z);
    const hR = this.getHeight(x + epsilon, z);
    const hD = this.getHeight(x, z - epsilon);
    const hU = this.getHeight(x, z + epsilon);
    // Normal from cross product of tangent vectors
    const nx = hL - hR;
    const nz = hD - hU;
    const ny = 2 * epsilon;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return { x: nx / len, y: ny / len, z: nz / len };
  }

  // Get slope angle (0 = flat, 1 = vertical)
  getSlope(x, z, epsilon = 0.5) {
    const n = this.getNormal(x, z, epsilon);
    return 1 - n.y; // 0 when normal points up, approaches 1 when steep
  }

  // Biome type for ground texture blending
  getBiome(x, z) {
    const h = this.getHeight(x, z);
    const moisture = this.biomeNoise.noise2D(x * 0.002, z * 0.002);
    if (h < this.waterLevel) return 'water';
    if (h < this.waterLevel + 2) return 'sand';
    if (h > this.amplitude * 0.6) return 'rock';
    if (moisture > 0.2) return 'grass_wet';
    return 'grass_dry';
  }

  // Tree density [0-1] for scenery placement
  getTreeDensity(x, z) {
    const h = this.getHeight(x, z);
    if (h < this.waterLevel + 1) return 0;     // no trees in water
    if (h > this.amplitude * 0.7) return 0;    // no trees on peaks
    const slope = this.getSlope(x, z);
    if (slope > 0.4) return 0;                // no trees on cliffs
    const density = this.treeNoise.noise2D(x * 0.02, z * 0.02);
    return Math.max(0, density * 1.5 - 0.2);  // threshold and scale
  }

  // Check if suitable for road start (not too steep, not underwater)
  isRoadable(x, z) {
    const h = this.getHeight(x, z);
    const slope = this.getSlope(x, z);
    return h > this.waterLevel && slope < 0.15;
  }
}

// ============================================
// TerrainMeshGenerator - creates Three.js meshes
// ============================================
class TerrainMeshGenerator {
  constructor(terrain) {
    this.terrain = terrain;
    this.chunkSize = 100;  // world units per chunk
    this.resolution = 10;  // vertices per chunk (low for far, high for near)
  }

  // Generate a single chunk mesh
  generateChunk(chunkX, chunkZ, detail) {
    const size = this.chunkSize;
    const res = detail === 'high' ? 20 : detail === 'medium' ? 10 : 5;
    const geo = new THREE.PlaneGeometry(size, size, res, res);
    geo.rotateX(-Math.PI / 2); // lay flat

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const color = new THREE.Color();

    const worldX = chunkX * size;
    const worldZ = chunkZ * size;

    for (let i = 0; i < positions.count; i++) {
      const lx = positions.getX(i);
      const lz = positions.getZ(i);
      const wx = worldX + lx;
      const wz = worldZ + lz;

      const h = this.terrain.getHeight(wx, wz);
      positions.setY(i, h);

      // Vertex coloring by biome/height
      const biome = this.terrain.getBiome(wx, wz);
      switch (biome) {
        case 'water': color.setHex(0x2266aa); break;
        case 'sand': color.setHex(0xc2b280); break;
        case 'rock': color.setHex(0x888888); break;
        case 'grass_wet': color.setHex(0x337733); break;
        case 'grass_dry': color.setHex(0x66aa44); break;
        default: color.setHex(0x448844);
      }
      // Height-based darkening
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
    mesh.chunkX = chunkX;
    mesh.chunkZ = chunkZ;
    mesh.detail = detail;

    return mesh;
  }
}

// ============================================
// Chunk Manager - LOD-based terrain streaming
// ============================================
class TerrainChunkManager {
  constructor(scene, terrain, qualityPreset = 'MED') {
    this.scene = scene;
    this.terrain = terrain;
    this.meshGen = new TerrainMeshGenerator(terrain);
    this.chunks = new Map(); // key: "cx,cz" -> mesh
    this.quality = qualityPreset;
    this.viewDistance = this._getViewDist(qualityPreset);
  }

  _getViewDist(preset) {
    switch (preset) {
      case 'LOW': return 2;
      case 'MED': return 3;
      case 'HIGH': return 4;
      case 'ULTRA': return 5;
      default: return 3;
    }
  }

  setQuality(preset) {
    this.quality = preset;
    this.viewDistance = this._getViewDist(preset);
    this.rebuild();
  }

  _chunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  // Update which chunks are visible based on player position
  update(playerX, playerZ) {
    const pcx = Math.floor(playerX / this.meshGen.chunkSize);
    const pcz = Math.floor(playerZ / this.meshGen.chunkSize);

    // Determine which chunks should exist
    const needed = new Set();
    for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
      for (let dz = -this.viewDistance; dz <= this.viewDistance; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const dist = Math.max(Math.abs(dx), Math.abs(dz));
        needed.add(this._chunkKey(cx, cz));
        if (!this.chunks.has(this._chunkKey(cx, cz))) {
          const detail = dist <= 1 ? 'high' : dist <= 2 ? 'medium' : 'low';
          const mesh = this.meshGen.generateChunk(cx, cz, detail);
          this.chunks.set(this._chunkKey(cx, cz), mesh);
          this.scene.add(mesh);
        }
      }
    }

    // Remove chunks that are too far
    for (const [key, mesh] of this.chunks) {
      if (!needed.has(key)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.chunks.delete(key);
      }
    }
  }

  // Get height at world position (for physics)
  getHeightAt(x, z) {
    return this.terrain.getHeight(x, z);
  }

  // Get normal at world position (for physics)
  getNormalAt(x, z) {
    return this.terrain.getNormal(x, z);
  }

  // Rebuild all chunks (e.g., after quality change)
  rebuild() {
    for (const [key, mesh] of this.chunks) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.chunks.clear();
  }

  // Stats for debugging
  getStats() {
    return {
      activeChunks: this.chunks.size,
      viewDistance: this.viewDistance,
      quality: this.quality,
    };
  }
}

// Make available globally (for Traffic simulator integration)
if (typeof window !== 'undefined') {
  window.ProcTerrain = ProcTerrain;
  window.TerrainMeshGenerator = TerrainMeshGenerator;
  window.TerrainChunkManager = TerrainChunkManager;
  window.SeededPerlin = SeededPerlin;
}
