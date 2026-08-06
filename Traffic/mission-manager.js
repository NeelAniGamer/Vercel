

const MISSION_TYPES = {
  CHECKPOINT: {
    id: 'checkpoint',
    icon: '🏁',
    label: 'Checkpoints',
    description: 'Drive through all checkpoints',
  },
  COLLECT: {
    id: 'collect',
    icon: '⭐',
    label: 'Collectibles',
    description: 'Collect all stars',
  },
  TIME_TRIAL: {
    id: 'time_trial',
    icon: '⏱️',
    label: 'Time Trial',
    description: 'Reach the destination before time runs out',
  },
  DELIVERY: {
    id: 'delivery',
    icon: '📦',
    label: 'Delivery',
    description: 'Pick up and deliver the package',
  },
  FOLLOW: {
    id: 'follow',
    icon: '🗺️',
    label: 'Follow Route',
    description: 'Follow the GPS route',
  },
};

const COLLECTIBLE_TYPES = {
  COIN: {
    value: 100,
    color: 0xffd700,
    emissive: 0xffa500,
    geometry: 'cylinder',
    scale: 1.0,
  },
  STAR: {
    value: 500,
    color: 0xffeb3b,
    emissive: 0xffc107,
    geometry: 'octahedron',
    scale: 1.5,
  },
  GEM: {
    value: 1000,
    color: 0x00ffff,
    emissive: 0x00bcd4,
    geometry: 'octahedron',
    scale: 1.2,
  },
};

class Collectible {
  constructor(type, x, z, options = {}) {
    this.type = type;
    this.position = { x, z };
    this.collected = false;
    this.config = COLLECTIBLE_TYPES[type] || COLLECTIBLE_TYPES.COIN;
    this.mesh = this._createMesh();
    this.mesh.position.set(x, 2.5, z);
    this.mesh.userData.isCollectible = true;
    this.mesh.userData.collectibleRef = this;
    this.rotationSpeed = 1.5 + Math.random();
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobSpeed = 2 + Math.random();
    this.baseY = 2.5;
  }

  _createMesh() {
    const cfg = this.config;
    let geo;
    switch (cfg.geometry) {
      case 'octahedron':
        geo = new THREE.OctahedronGeometry(1.5 * cfg.scale, 0);
        break;
      case 'cylinder':
      default:
        geo = new THREE.CylinderGeometry(1.2 * cfg.scale, 1.2 * cfg.scale, 0.3 * cfg.scale, 16);
        break;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.emissive,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.frustumCulled = true;
    return mesh;
  }

  update(dt, time) {
    if (this.collected) return;

    this.mesh.rotation.y += this.rotationSpeed * dt;

    this.mesh.position.y = this.baseY + Math.sin(time * this.bobSpeed + this.bobPhase) * 0.5;
  }

  collect() {
    if (this.collected) return 0;
    this.collected = true;
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);

    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    return this.config.value;
  }

  dispose() {
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

class Mission {
  constructor(type, config = {}) {
    this.type = type;
    this.config = { ...MISSION_TYPES[type], ...config };
    this.status = 'active';
    this.progress = 0;
    this.target = config.target || 1;
    this.data = config.data || {};
    this.reward = config.reward || 1000;
    this.onComplete = config.onComplete || null;
    this.onFail = config.onFail || null;
  }

  updateProgress(value) {
    this.progress = Math.min(value, this.target);
    if (this.progress >= this.target) {
      this.status = 'completed';
      if (this.onComplete) this.onComplete(this);
    }
  }

  incrementProgress() {
    this.updateProgress(this.progress + 1);
  }

  fail() {
    this.status = 'failed';
    if (this.onFail) this.onFail(this);
  }

  getProgressPercent() {
    return (this.progress / this.target) * 100;
  }
}

class MissionManager {
  constructor(game) {
    this.game = game;
    this.missions = [];
    this.collectibles = [];
    this.totalCollected = 0;
    this.totalReward = 0;
    this.active = false;
    this._collectibleGroup = new THREE.Group();
    this._collectibleGroup.name = 'collectibles';
  }

  init() {
    if (this.game.scene) {
      this.game.scene.add(this._collectibleGroup);
    }
  }


  generateMissions(levelConfig) {
    this.clear();
    this.active = true;
    this.init();

    if (!levelConfig) return [];


    this.spawnCollectibles(levelConfig, 8 + Math.floor(Math.random() * 7));


    if (levelConfig.roads && levelConfig.roads.length > 0) {
      const cpMission = this.createCheckpointMission(levelConfig);
      if (cpMission) this.missions.push(cpMission);
    }


    if (levelConfig.route && levelConfig.route.length > 2) {
      const followMission = this.createFollowMission(levelConfig);
      if (followMission) this.missions.push(followMission);
    }


    if (levelConfig.useLowPolyCity) {
      const exploreMission = this.createExplorationMission(levelConfig);
      if (exploreMission) this.missions.push(exploreMission);
    }

    return this.missions;
  }

  createCheckpointMission(levelConfig) {
    const checkpoints = [];
    const roads = levelConfig.roads;
    const numCheckpoints = Math.min(5, Math.max(3, Math.floor(roads.length / 3)));

    for (let i = 0; i < numCheckpoints; i++) {
      const road = roads[Math.floor(Math.random() * roads.length)];
      let x, z;
      if (road.type === 'v') {
        x = road.x;
        z = road.z1 + (Math.random() * (road.z2 - road.z1));
      } else {
        z = road.z;
        x = road.x1 + (Math.random() * (road.x2 - road.x1));
      }
      checkpoints.push({ x, z, reached: false });
    }

    return new Mission('CHECKPOINT', {
      target: numCheckpoints,
      reward: numCheckpoints * 500,
      data: { checkpoints },
    });
  }

  createFollowMission(levelConfig) {
    return new Mission('FOLLOW', {
      target: 1,
      reward: 2000,
      data: { routeLength: levelConfig.route.length },
    });
  }

  createExplorationMission(levelConfig) {
    return new Mission('COLLECT', {
      target: 5,
      reward: 3000,
      data: { type: 'exploration' },
    });
  }

  spawnCollectibles(levelConfig, count) {
    const positions = this._generateCollectiblePositions(levelConfig, count);
    for (const pos of positions) {
      const type = Math.random() > 0.85 ? 'STAR' : (Math.random() > 0.95 ? 'GEM' : 'COIN');
      const collectible = new Collectible(type, pos.x, pos.z);
      this.collectibles.push(collectible);
      this._collectibleGroup.add(collectible.mesh);
    }
  }

  _generateCollectiblePositions(levelConfig, count) {
    const positions = [];
    const roads = levelConfig.roads || [];

    if (roads.length > 0) {

      for (let i = 0; i < count; i++) {
        const road = roads[Math.floor(Math.random() * roads.length)];
        let x, z;
        if (road.type === 'v') {
          x = road.x + (Math.random() - 0.5) * 20;
          z = road.z1 + Math.random() * (road.z2 - road.z1);
        } else {
          z = road.z + (Math.random() - 0.5) * 20;
          x = road.x1 + Math.random() * (road.x2 - road.x1);
        }
        positions.push({ x, z });
      }
    } else {

      const spread = levelConfig.useLowPolyCity ? 1000 : 500;
      for (let i = 0; i < count; i++) {
        positions.push({
          x: (Math.random() - 0.5) * spread * 2,
          z: (Math.random() - 0.5) * spread * 2,
        });
      }
    }

    return positions;
  }

  update(playerPos, dt, time) {
    if (!this.active) return;


    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.update(dt, time);


      const dx = playerPos.x - c.position.x;
      const dz = playerPos.z - c.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5) {
        const value = c.collect();
        if (value > 0) {
          this.totalCollected++;
          this.totalReward += value;
          this._onCollectibleCollected(c, value);
        }
      }
    }


    for (const mission of this.missions) {
      if (mission.status !== 'active') continue;

      if (mission.type === 'CHECKPOINT') {
        const checkpoints = mission.data.checkpoints;
        let reached = 0;
        for (const cp of checkpoints) {
          if (cp.reached) {
            reached++;
            continue;
          }
          const dx = playerPos.x - cp.x;
          const dz = playerPos.z - cp.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 15) {
            cp.reached = true;
            reached++;
            this._onCheckpointReached(cp);
          }
        }
        mission.updateProgress(reached);
      }
    }
  }

  _onCollectibleCollected(collectible, value) {

    if (this.game.playerScore !== undefined) {
      this.game.playerScore += value;
    }
    if (this.game.rupees !== undefined) {
      this.game.rupees += value;
    }

    if (typeof toast === 'function') {
      toast(`+₹${value} ${collectible.type === 'STAR' ? '⭐' : collectible.type === 'GEM' ? '💎' : '🪙'}`, '#f2b84b');
    }

    if (typeof sfx !== 'undefined' && sfx.play) {
      sfx.play('ok');
    }


    for (const mission of this.missions) {
      if (mission.type === 'COLLECT' && mission.status === 'active') {
        mission.incrementProgress();
      }
    }
  }

  _onCheckpointReached(checkpoint) {
    if (typeof toast === 'function') {
      toast('🏁 Checkpoint!', '#34d399');
    }
    if (typeof sfx !== 'undefined' && sfx.play) {
      sfx.play('ok');
    }
  }

  getMissions() {
    return this.missions;
  }

  getCollectibleCount() {
    return {
      total: this.collectibles.length,
      collected: this.totalCollected,
    };
  }

  clear() {

    for (const c of this.collectibles) {
      c.dispose();
    }
    this.collectibles = [];
    this.missions = [];
    this.totalCollected = 0;
    this.totalReward = 0;
    this.active = false;


    if (this._collectibleGroup.parent) {
      this._collectibleGroup.parent.remove(this._collectibleGroup);
    }
  }

  getStats() {
    return {
      missions: this.missions.length,
      missionsCompleted: this.missions.filter(m => m.status === 'completed').length,
      collectibles: this.collectibles.length,
      collectiblesCollected: this.totalCollected,
      totalReward: this.totalReward,
    };
  }
}


window.MissionManager = MissionManager;
window.Collectible = Collectible;
window.MISSION_TYPES = MISSION_TYPES;
window.COLLECTIBLE_TYPES = COLLECTIBLE_TYPES;
