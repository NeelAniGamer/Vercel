// ============================================
// Procedural Scenery for Traffic Simulator
// Trees, buildings, props — placed using noise density maps
// Uses InstancedMesh for zero-overhead rendering
// ============================================

// ============================================
// SceneryManager — places trees, buildings, props
// ============================================
class SceneryManager {
  constructor(scene, terrain, opts = {}) {
    this.scene = scene;
    this.terrain = terrain;
    this.density = opts.density || 0.5;
    this.viewDistance = opts.viewDistance || 150;
    this.gridSize = opts.gridSize || 5; // placement grid cell size
    this.seed = terrain.seed;
    this.rng = this._makeRng(this.seed + 999);
    this.sceneryGroups = new Map(); // type -> InstancedMesh
    this.activeCells = new Set();
    this._lastPlayerX = null;
    this._lastPlayerZ = null;
  }

  _makeRng(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Generate scenery for a cell (grid-based streaming)
  _generateCell(cellX, cellZ) {
    const key = `${cellX},${cellZ}`;
    if (this.activeCells.has(key)) return;
    this.activeCells.add(key);

    const worldX = cellX * this.gridSize;
    const worldZ = cellZ * this.gridSize;
    const treeDensity = this.terrain.getTreeDensity(worldX, worldZ);

    if (treeDensity <= 0.1) return;

    // Number of trees in this cell
    const numTrees = Math.floor(treeDensity * this.density * this.gridSize * this.gridSize / 50);

    for (let i = 0; i < numTrees; i++) {
      const lx = this.rng() * this.gridSize;
      const lz = this.rng() * this.gridSize;
      const wx = worldX + lx;
      const wz = worldZ + lz;

      // Re-check density at exact position
      const d = this.terrain.getTreeDensity(wx, wz);
      if (d < 0.2) continue;
      if (this.terrain.getSlope(wx, wz) > 0.35) continue;

      const h = this.terrain.getHeight(wx, wz);
      if (h < this.terrain.waterLevel + 0.5) continue;

      this._addTree(wx, h, wz, d);
    }

    // Occasional rocks
    if (this.rng() < 0.3) {
      const lx = this.rng() * this.gridSize;
      const lz = this.rng() * this.gridSize;
      const wx = worldX + lx;
      const wz = worldZ + lz;
      if (this.terrain.getSlope(wx, wz) > 0.2) {
        this._addRock(wx, this.terrain.getHeight(wx, wz), wz);
      }
    }
  }

  // Add a tree (simple billboard-style geometry)
  _addTree(x, y, z, density) {
    const type = density > 0.5 ? 'tree_dense' : 'tree_sparse';
    let mesh = this.sceneryGroups.get(type);

    if (!mesh) {
      // Create instanced mesh
      const geo = this._createTreeGeometry(type);
      const mat = new THREE.MeshLambertMaterial({
        color: type === 'tree_dense' ? 0x2d5a27 : 0x4a7a3a,
      });
      mesh = new THREE.InstancedMesh(geo, mat, 500);
      mesh.count = 0;
      mesh.type = type;
      this.sceneryGroups.set(type, mesh);
      this.scene.add(mesh);
    }

    if (mesh.count >= mesh.instanceMatrix.count) return; // max instances

    const dummy = new THREE.Object3D();
    const scale = 0.8 + this.rng() * 0.6;
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, this.rng() * Math.PI * 2, 0);
    dummy.scale.set(scale, scale * (0.8 + this.rng() * 0.4), scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(mesh.count, dummy.matrix);
    mesh.count++;
  }

  // Add a rock
  _addRock(x, y, z) {
    let mesh = this.sceneryGroups.get('rock');
    if (!mesh) {
      const geo = new THREE.DodecahedronGeometry(1, 0);
      const mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      mesh = new THREE.InstancedMesh(geo, mat, 200);
      mesh.count = 0;
      this.sceneryGroups.set('rock', mesh);
      this.scene.add(mesh);
    }
    if (mesh.count >= mesh.instanceMatrix.count) return;

    const dummy = new THREE.Object3D();
    const scale = 0.3 + this.rng() * 0.7;
    dummy.position.set(x, y + scale * 0.3, z);
    dummy.rotation.set(this.rng(), this.rng(), this.rng());
    dummy.scale.set(scale, scale * 0.6, scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(mesh.count, dummy.matrix);
    mesh.count++;
  }

  // Simple tree geometry (trunk + foliage cone)
  _createTreeGeometry(type) {
    // Use a simple cone for foliage + thin cylinder for trunk
    const foliage = new THREE.ConeGeometry(2, 6, 6);
    foliage.translate(0, 4, 0);
    // Merge trunk
    const trunk = new THREE.CylinderGeometry(0.3, 0.4, 3, 4);
    trunk.translate(0, 1.5, 0);
    // Simple merge (just use foliage for instancing - trunk adds too much complexity)
    return foliage;
  }

  // Update scenery based on player position
  update(playerX, playerZ) {
    // Throttle updates
    if (this._lastPlayerX !== null) {
      const dist = Math.sqrt(
        (playerX - this._lastPlayerX) ** 2 +
        (playerZ - this._lastPlayerZ) ** 2
      );
      if (dist < this.gridSize * 0.5) return; // too close, skip
    }

    this._lastPlayerX = playerX;
    this._lastPlayerZ = playerZ;

    const cellX = Math.floor(playerX / this.gridSize);
    const cellZ = Math.floor(playerZ / this.gridSize);
    const cells = Math.ceil(this.viewDistance / this.gridSize);

    // Generate new cells around player
    for (let dx = -cells; dx <= cells; dx++) {
      for (let dz = -cells; dz <= cells; dz++) {
        if (dx * dx + dz * dz <= cells * cells) {
          this._generateCell(cellX + dx, cellZ + dz);
        }
      }
    }

    // Update instance buffers
    for (const [type, mesh] of this.sceneryGroups) {
      if (mesh.count > 0) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  // Clear all scenery
  clear() {
    for (const [type, mesh] of this.sceneryGroups) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.sceneryGroups.clear();
    this.activeCells.clear();
    this._lastPlayerX = null;
    this._lastPlayerZ = null;
  }

  // Get stats
  getStats() {
    let totalInstances = 0;
    for (const [type, mesh] of this.sceneryGroups) {
      totalInstances += mesh.count;
    }
    return {
      totalInstances,
      activeCells: this.activeCells.size,
      groups: this.sceneryGroups.size,
    };
  }
}

// ============================================
// BuildingPlacer — places buildings near roads
// ============================================
class BuildingPlacer {
  constructor(scene, terrain, roadData, opts = {}) {
    this.scene = scene;
    this.terrain = terrain;
    this.roadData = roadData;
    this.spacing = opts.spacing || 25;  // min distance between buildings
    this.setback = opts.setback || 8;   // distance from road center
    this.density = opts.density || 0.4; // probability of placing at each slot
    this.rng = this._makeRng(terrain.seed + 555);
    this.buildings = [];
  }

  _makeRng(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Place buildings along the road
  generate() {
    if (!this.roadData || !this.roadData.fine) return;

    const fine = this.roadData.fine;
    const interval = Math.floor(this.spacing); // every N meters

    for (let i = 0; i < fine.length; i += interval) {
      if (this.rng() > this.density) continue;

      const p = fine[i];
      // Direction at this point
      const next = fine[Math.min(i + 1, fine.length - 1)];
      const dx = next.x - p.x;
      const dz = next.z - p.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      // Perpendicular for setback
      const px = -dz / len * this.setback;
      const pz = dx / len * this.setback;

      // Place on left or right
      const side = this.rng() > 0.5 ? 1 : -1;
      const bx = p.x + px * side;
      const bz = p.z + pz * side;
      const h = this.terrain.getHeight(bx, bz);

      if (h < this.terrain.waterLevel + 1) continue;
      if (this.terrain.getSlope(bx, bz) > 0.15) continue;

      this._addBuilding(bx, h, bz);
    }
  }

  _addBuilding(x, y, z) {
    const width = 4 + this.rng() * 6;
    const depth = 4 + this.rng() * 6;
    const height = 3 + this.rng() * 12;

    const geo = new THREE.BoxGeometry(width, height, depth);
    geo.translate(0, height / 2, 0);

    // Random building color
    const colors = [0xccbbbb, 0xbbbbcc, 0xddccbb, 0xccddbb, 0xdddddd, 0xbbaaaa];
    const color = colors[Math.floor(this.rng() * colors.length)];
    const mat = new THREE.MeshLambertMaterial({ color });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = this.rng() * Math.PI * 0.5; // slight random rotation
    this.scene.add(mesh);
    this.buildings.push(mesh);
  }

  clear() {
    for (const mesh of this.buildings) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.buildings = [];
  }

  getStats() {
    return {
      buildingCount: this.buildings.length,
    };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SceneryManager = SceneryManager;
  window.BuildingPlacer = BuildingPlacer;
}
