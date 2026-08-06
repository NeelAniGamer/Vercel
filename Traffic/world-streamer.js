


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

class CityChunk {
  constructor(cx, cz, size, game, options = {}) {
    this.cx = cx;
    this.cz = cz;
    this.size = size;
    this.game = game;
    this.worldX = cx * size;
    this.worldZ = cz * size;
    this.objects = [];
    this.buildings = [];
    this.props = [];
    this.foliage = [];
    this.tiles = [];
    this.group = new THREE.Group();
    this.group.name = `chunk_${cx}_${cz}`;
    this.group.position.set(this.worldX, 0, this.worldZ);
    this.disposed = false;
    this.rng = mulberry32(Math.abs(chunkHash(cx, cz)));
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

    const tileKeys = WorldStreamer.ASSETS.tiles;
    if (tileKeys.length > 0 && window.PRELOADED_MODELS) {
      const key = tileKeys[Math.floor(this.rng() * tileKeys.length)];
      const model = window.PRELOADED_MODELS[key];
      if (model) {
        const tile = model.clone();
        tile.position.set(0, 0, 0);
        tile.rotation.y = Math.floor(this.rng() * 4) * (Math.PI / 2);
        tile.traverse(c => {
          if (c.isMesh) {
            c.castShadow = false;
            c.receiveShadow = true;
            c.frustumCulled = true;
            if (c.material) {
              c.material.metalness = 0.1;
              c.material.roughness = 0.8;
            }
          }
        });
        this.group.add(tile);
        this.tiles.push(tile);
      }
    }
    this.game.scene.add(this.group);
  }

  generateDowntown(density) {
    const rng = this.rng;
    const buildingKeys = WorldStreamer.ASSETS.buildings;
    const propKeys = WorldStreamer.ASSETS.props;
    const foliageKeys = WorldStreamer.ASSETS.foliage;
    const tileKeys = WorldStreamer.ASSETS.tiles;


    if (rng() > 0.3 && tileKeys.length > 0 && window.PRELOADED_MODELS) {
      const key = tileKeys[Math.floor(rng() * tileKeys.length)];
      const model = window.PRELOADED_MODELS[key];
      if (model) {
        const tile = model.clone();
        tile.position.set(0, 0, 0);
        tile.rotation.y = Math.floor(rng() * 4) * (Math.PI / 2);
        tile.traverse(c => {
          if (c.isMesh) {
            c.castShadow = false;
            c.receiveShadow = true;
            c.frustumCulled = true;
            if (c.material) { c.material.metalness = 0.1; c.material.roughness = 0.8; }
          }
        });
        this.group.add(tile);
        this.tiles.push(tile);
      }
    }


    if (rng() > 0.3 && buildingKeys.length > 0) {
      const bldgKey = buildingKeys[Math.floor(rng() * buildingKeys.length)];
      const bldg = this._spawnAsset(bldgKey, 0, 0, Math.floor(rng() * 4) * (Math.PI / 2), 1.2);
      if (bldg) {
        this.buildings.push(bldg);

        this.game.obstacles.push(bldg);
      }


      if (rng() > 0.4 && propKeys.length > 0) {
        const propKey = propKeys[Math.floor(rng() * propKeys.length)];
        const px = (rng() - 0.5) * 20;
        const pz = (rng() - 0.5) * 20;
        const prop = this._spawnAsset(propKey, px, pz, rng() * Math.PI, 1.0);
        if (prop) this.props.push(prop);
      }


      if (rng() > 0.6 && foliageKeys.length > 0) {
        const folKey = foliageKeys[Math.floor(rng() * foliageKeys.length)];
        const fx = (rng() - 0.5) * 25;
        const fz = (rng() - 0.5) * 25;
        const fol = this._spawnAsset(folKey, fx, fz, 0, 1.0);
        if (fol) this.foliage.push(fol);
      }
    } else if (rng() > 0.5 && propKeys.length > 0) {

      const propKey = propKeys[Math.floor(rng() * propKeys.length)];
      const prop = this._spawnAsset(propKey, 0, 0, rng() * Math.PI, 1.0);
      if (prop) this.props.push(prop);
    }

    this.game.scene.add(this.group);
  }

  generateSuburb(density) {
    const rng = this.rng;
    const buildingKeys = WorldStreamer.ASSETS.buildings;
    const propKeys = WorldStreamer.ASSETS.props;
    const foliageKeys = WorldStreamer.ASSETS.foliage;
    const carKeys = WorldStreamer.ASSETS.cars;
    const tileKeys = WorldStreamer.ASSETS.tiles;


    if (rng() > 0.6 && tileKeys.length > 0 && window.PRELOADED_MODELS) {
      const key = tileKeys[Math.floor(rng() * tileKeys.length)];
      const model = window.PRELOADED_MODELS[key];
      if (model) {
        const tile = model.clone();
        tile.position.set(0, 0, 0);
        tile.rotation.y = Math.floor(rng() * 4) * (Math.PI / 2);
        tile.traverse(c => {
          if (c.isMesh) {
            c.castShadow = false;
            c.receiveShadow = true;
            c.frustumCulled = true;
            if (c.material) { c.material.metalness = 0.1; c.material.roughness = 0.8; }
          }
        });
        this.group.add(tile);
        this.tiles.push(tile);
      }
    }


    if (rng() > 0.6 && buildingKeys.length > 0) {
      const bldgKey = buildingKeys[Math.floor(rng() * buildingKeys.length)];
      const bldg = this._spawnAsset(bldgKey, 0, 0, Math.floor(rng() * 4) * (Math.PI / 2), 1.2);
      if (bldg) {
        this.buildings.push(bldg);
        this.game.obstacles.push(bldg);
      }


      if (rng() > 0.6 && propKeys.length > 0) {
        const propKey = propKeys[Math.floor(rng() * propKeys.length)];
        const px = (rng() - 0.5) * 20;
        const pz = (rng() - 0.5) * 20;
        const prop = this._spawnAsset(propKey, px, pz, rng() * Math.PI, 1.0);
        if (prop) this.props.push(prop);
      }


      if (rng() > 0.4 && foliageKeys.length > 0) {
        const folKey = foliageKeys[Math.floor(rng() * foliageKeys.length)];
        const fx = (rng() - 0.5) * 25;
        const fz = (rng() - 0.5) * 25;
        const fol = this._spawnAsset(folKey, fx, fz, 0, 1.0);
        if (fol) this.foliage.push(fol);
      }
    } else if (rng() > 0.6 && carKeys.length > 0) {

      const carKey = carKeys[Math.floor(rng() * carKeys.length)];
      const car = this._spawnAsset(carKey, 0, 0, Math.floor(rng() * 4) * (Math.PI / 2), 1.0);
      if (car) this.props.push(car);
    } else if (rng() > 0.7 && foliageKeys.length > 0) {

      const folKey = foliageKeys[Math.floor(rng() * foliageKeys.length)];
      const fol = this._spawnAsset(folKey, 0, 0, 0, 1.0);
      if (fol) this.foliage.push(fol);
    }

    this.game.scene.add(this.group);
  }

  generateOutskirts(density) {
    const rng = this.rng;
    const foliageKeys = WorldStreamer.ASSETS.foliage;
    const propKeys = WorldStreamer.ASSETS.props;


    if (rng() > 0.7 && foliageKeys.length > 0) {
      const folKey = foliageKeys[Math.floor(rng() * foliageKeys.length)];
      const fx = (rng() - 0.5) * 30;
      const fz = (rng() - 0.5) * 30;
      const fol = this._spawnAsset(folKey, fx, fz, 0, 1.0);
      if (fol) this.foliage.push(fol);
    }
    if (rng() > 0.85 && propKeys.length > 0) {
      const propKey = propKeys[Math.floor(rng() * propKeys.length)];
      const px = (rng() - 0.5) * 30;
      const pz = (rng() - 0.5) * 30;
      const prop = this._spawnAsset(propKey, px, pz, rng() * Math.PI, 1.0);
      if (prop) this.props.push(prop);
    }

    this.game.scene.add(this.group);
  }

  _spawnAsset(key, x, z, ry, scale) {
    if (!window.PRELOADED_MODELS || !window.PRELOADED_MODELS[key]) return null;
    const asset = window.PRELOADED_MODELS[key].clone();
    asset.position.set(x, 0, z);
    asset.rotation.y = ry;
    asset.scale.set(scale, scale, scale);
    asset.traverse(c => {
      if (c.isMesh) {
        c.castShadow = scale > 0.5;
        c.receiveShadow = true;
        c.frustumCulled = true;
        if (c.material) {
          c.material.metalness = 0.1;
          c.material.roughness = 0.8;
          c.material.needsUpdate = true;
        }
      }
    });
    this.group.add(asset);
    this.objects.push(asset);
    return asset;
  }

  dispose() {
    this.disposed = true;
    this.game.scene.remove(this.group);


    for (const b of this.buildings) {
      const idx = this.game.obstacles.indexOf(b);
      if (idx >= 0) this.game.obstacles.splice(idx, 1);
    }


    this.group.traverse(c => {
      if (c.isMesh) {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      }
    });

    this.objects = [];
    this.buildings = [];
    this.props = [];
    this.foliage = [];
    this.tiles = [];
  }
}

class WorldStreamer {
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
    this.maxChunksPerFrame = 2;
    this._enabled = true;
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

    // Skip if player hasn't moved to a new chunk
    if (cx === this.lastCenterX && cz === this.lastCenterZ) return;
    this.lastCenterX = cx;
    this.lastCenterZ = cz;
    console.log(`[WorldStreamer] Loading chunks around (${cx}, ${cz}), loaded: ${this.loadedChunks.size}`);


    const toLoad = [];
    const toUnload = [];


    const needed = new Set();
    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {

        if (dx * dx + dz * dz > this.renderDistance * this.renderDistance) continue;
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


    let loaded = 0;

    toLoad.sort((a, b) => {
      const da = Math.abs(a[0] - cx) + Math.abs(a[1] - cz);
      const db = Math.abs(b[0] - cx) + Math.abs(b[1] - cz);
      return da - db;
    });

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

    const chunk = new CityChunk(cx, cz, this.chunkSize, this.game);
    chunk.generate();
    this.loadedChunks.set(key, chunk);
    if (chunk.objects.length > 0) {
      console.log(`[WorldStreamer] Chunk (${cx},${cz}) generated with ${chunk.objects.length} objects`);
    }
  }

  _unloadChunk(key) {
    const chunk = this.loadedChunks.get(key);
    if (!chunk) return;
    chunk.dispose();
    this.loadedChunks.delete(key);
  }

  reset() {
    for (const [key, chunk] of this.loadedChunks) {
      chunk.dispose();
    }
    this.loadedChunks.clear();
    this.lastCenterX = null;
    this.lastCenterZ = null;
    this.timeSinceUpdate = 0;
  }

  getLoadedCount() {
    return this.loadedChunks.size;
  }

  getStats() {
    let objects = 0;
    let buildings = 0;
    for (const [, chunk] of this.loadedChunks) {
      objects += chunk.objects.length;
      buildings += chunk.buildings.length;
    }
    return {
      chunks: this.loadedChunks.size,
      objects,
      buildings,
      renderDistance: this.renderDistance,
      bufferDistance: this.bufferDistance,
    };
  }
}


WorldStreamer.ASSETS = {
  buildings: [
    'lowpoly_eco_building_grid', 'lowpoly_eco_building_slope', 'lowpoly_eco_building_terrace',
    'lowpoly_regular_building_twistedtower_large'
  ],
  cars: [
    'lowpoly_car_06', 'lowpoly_car_13', 'lowpoly_car_16', 'lowpoly_car_19',
    'lowpoly_futuristic_car_1', 'lowpoly_van'
  ],
  foliage: ['lowpoly_bush_06', 'lowpoly_bush_07', 'lowpoly_bush_10', 'lowpoly_palm_03'],
  props: [
    'lowpoly_bus_stop_02', 'lowpoly_fountain_03', 'lowpoly_billboard_2x1_03', 'lowpoly_billboard_2x1_05',
    'lowpoly_billboard_4x1_03', 'lowpoly_billboard_4x1_04', 'lowpoly_signboard_01',
    'lowpoly_spotlight_01', 'lowpoly_spotlight_02', 'lowpoly_traffic_light_001',
    'lowpoly_traffic_light_002', 'lowpoly_traffic_light_003',
    'lowpoly_trash_02', 'lowpoly_trash_03', 'lowpoly_trash_04', 'lowpoly_trash_05', 'lowpoly_trash_06',
    'lowpoly_trash_can_04', 'lowpoly_trash_can_05', 'lowpoly_trash_can_06', 'lowpoly_trash_can_07', 'lowpoly_trash_can_08',
    'lowpoly_graffiti_03'
  ],
  tiles: [
    'lowpoly_set_b_tiles_01', 'lowpoly_set_b_tiles_04', 'lowpoly_set_b_tiles_05',
    'lowpoly_set_b_tiles_06', 'lowpoly_set_b_tiles_09'
  ]
};


window.WorldStreamer = WorldStreamer;
window.CityChunk = CityChunk;
