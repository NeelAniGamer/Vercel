

const VEHICLE_VARIETY_WEIGHTS = {
  car: 0.14,
  wagonr: 0.08,
  sedan: 0.08,
  suv: 0.08,
  creta: 0.06,
  innova: 0.05,
  taxi: 0.07,
  auto: 0.12,
  auto_yellow: 0.04,
  bike: 0.08,
  splendor: 0.06,
  activa: 0.06,
  ktm: 0.02,
  bus: 0.04,
  truck: 0.03,
  ace: 0.03,
  police: 0.01,
  ambulance: 0.01
};

const VEHICLE_CLASS_LANE_ACCESS = {
  car: ['car', 'bus'],
  wagonr: ['car', 'bus'],
  sedan: ['car', 'bus'],
  city: ['car', 'bus'],
  suv: ['car', 'bus'],
  creta: ['car', 'bus'],
  innova: ['car', 'bus'],
  taxi: ['car', 'bus'],
  auto: ['car', 'bus'],
  auto_yellow: ['car', 'bus'],
  bike: ['bike', 'car', 'bus'],
  splendor: ['bike', 'car', 'bus'],
  activa: ['bike', 'car', 'bus'],
  ktm: ['bike', 'car', 'bus'],
  cycle: ['bike', 'car'],
  bus: ['bus'],
  truck: ['bus', 'car'],
  ace: ['car', 'bus'],
  police: ['car', 'bus'],
  ambulance: ['bus', 'car']
};

const RULE_BREAKER_PROBABILITY = 0.20;
const PLATOON_SIZE = 3;
const PLATOON_GAP = 8;
const BASE_NPC_COUNT = 36;
const MAX_NPC_COUNT = 80;
const MOBILE_NPC_COUNT = 24;
const SPAWN_RADIUS = 180;
const SPAWN_MIN_GAP = 12;
const SPAWN_MAX_GAP = 45;
const DENSITY_INCREASE_PER_MIN = 0.08;
const SIGNAL_ACCUMULATION_RATE = 5;
const MAX_SIGNAL_ACCUMULATION = 12;

function isMobile() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

function getMaxNPCCount() {
  return isMobile() ? MOBILE_NPC_COUNT : MAX_NPC_COUNT;
}

function getBaseNPCCount() {
  return isMobile() ? MOBILE_NPC_COUNT : BASE_NPC_COUNT;
}

class TrafficManager {
  constructor(game) {
    this.game = game;
    this.vehicles = [];
    this.vehiclePools = new Map();
    this.edgeVehicles = new Map();
    this.parkingSpots = [];
    this.densityMultiplier = 1.0;
    this.timeAtSignal = 0;
    this.signalAccumulation = 0;
    this.lastDensityUpdate = 0;
    this.platoons = [];
    this.ruleBreakerCount = 0;
    this.totalSpawned = 0;
    this.audio = null;
    this._initPools();
  }

  _initPools() {
    const types = Object.keys(VEHICLE_VARIETY_WEIGHTS);
    types.forEach(type => {
      this.vehiclePools.set(type, []);
    });
  }

  update(dt, playerVehicle, signals) {
    this._updateDensity(dt);
    this._updatePlatoons(dt);
    this._updateSignalAccumulation(dt, signals);
    this._manageVehicleLifecycle(playerVehicle);
    this._updateEdgeIndex();
    

    const COMPLETE = (window.NPC_STATE && window.NPC_STATE.COMPLETE) || 'COMPLETE';
    this.vehicles.slice().forEach(vehicle => {
      if (!vehicle.active || !vehicle.npcAI) return;



      if (vehicle.npcAI.state === COMPLETE && !this._assignRoute(vehicle)) {
        this._despawnVehicle(vehicle);
        return;
      }

      vehicle.npcAI.update(dt, playerVehicle, signals);
      vehicle.mesh.position.copy(vehicle.position);
      vehicle.mesh.rotation.y = vehicle.rotation.y;
    });
  }

  _updateDensity(dt) {
    this.lastDensityUpdate += dt;
    if (this.lastDensityUpdate >= 4) {
      this.lastDensityUpdate = 0;
      const targetDensity = Math.min(getBaseNPCCount() * (1 + this.densityMultiplier * 1.5), getMaxNPCCount());
      const currentCount = this.vehicles.filter(v => v.active).length;
      
      if (currentCount < targetDensity) {
        this.densityMultiplier = Math.min(2.0, this.densityMultiplier + DENSITY_INCREASE_PER_MIN);
        this._spawnBatch(Math.ceil((targetDensity - currentCount) * 0.6));
      } else if (currentCount > targetDensity * 1.2) {
        this.densityMultiplier = Math.max(0.5, this.densityMultiplier - DENSITY_INCREASE_PER_MIN);
      }
    }
  }

  _updateSignalAccumulation(dt, signals) {
    const redSignals = signals ? signals.filter(s => s.state === 'red').length : 0;
    if (redSignals > 0) {
      this.timeAtSignal += dt;
      this.signalAccumulation = Math.min(MAX_SIGNAL_ACCUMULATION, this.signalAccumulation + SIGNAL_ACCUMULATION_RATE * dt / 60);
    } else {
      this.timeAtSignal = 0;
      this.signalAccumulation = Math.max(0, this.signalAccumulation - dt / 10);
    }
  }

  _updatePlatoons(dt) {
    this.platoons.forEach(platoon => {
      platoon.update(dt, this);
    });
    this.platoons = this.platoons.filter(p => p.active && p.followers && p.followers.length > 0);
  }

  _manageVehicleLifecycle(playerVehicle) {
    const despawnDist = 250;
    const playerPos = playerVehicle?.position || new THREE.Vector3();
    
    this.vehicles.forEach((vehicle, index) => {
      if (!vehicle.active) return;
      
      const dist = vehicle.position.distanceTo(playerPos);
      if (dist > despawnDist) {
        this._despawnVehicle(vehicle);
        return;
      }

      // Anti-gridlock watchdog: track prolonged stops and smoothly un-jam without visible despawning
      if (vehicle.npcAI) {
        const curSpd = vehicle.npcAI.currentSpeed || vehicle.speed || 0;
        if (curSpd < 0.25 && vehicle.npcAI.state !== 'PARK') {
          vehicle._stoppedSeconds = (vehicle._stoppedSeconds || 0) + 0.05;
          // If far away from player (>90m) and stuck for >15s, quietly recycle
          if (dist > 90 && vehicle._stoppedSeconds > 15.0) {
            vehicle._stoppedSeconds = 0;
            this._despawnVehicle(vehicle);
          } else if (vehicle._stoppedSeconds > 4.0) {
            // Near player: smoothly un-stick by nudging lane and restoring flow
            vehicle.npcAI.state = 'FOLLOW_LANE';
            vehicle.npcAI.waitTimer = 0;
            vehicle.npcAI._committedToIntersection = true;
            vehicle.npcAI.desiredSpeed = Math.max(vehicle.npcAI.desiredSpeed || 0, 5.0);
            vehicle.npcAI.currentSpeed = Math.max(vehicle.npcAI.currentSpeed || 0, 3.0);
            if (vehicle._stoppedSeconds > 8.0) {
              vehicle._stoppedSeconds = 0;
            }
          }
        } else {
          vehicle._stoppedSeconds = 0;
        }
      }
    });
  }

  _updateEdgeIndex() {
    this.edgeVehicles.clear();
    this.vehicles.forEach(v => {
      if (!v.active || !v.currentEdge) return;
      if (!this.edgeVehicles.has(v.currentEdge.id)) {
        this.edgeVehicles.set(v.currentEdge.id, []);
      }
      this.edgeVehicles.get(v.currentEdge.id).push(v);
    });
  }

  spawnInitialTraffic(roadGraph, route, count = BASE_NPC_COUNT, levelConfig = {}) {
    this.roadGraph = roadGraph;
    this.mainRoute = this._resolveRouteNodes(route);
    this.levelConfig = levelConfig;
    this.levelNpcTypes = levelConfig.npcTypes || [];
    this.levelNpcs = levelConfig.npcs || [];
    this.levelNpcIndex = 0;
    this._spawnBatch(count);
  }



  _resolveRouteNodes(route) {
    if (!Array.isArray(route) || !this.roadGraph || typeof this.roadGraph.getNearestNode !== 'function') return [];
    const out = [];
    route.forEach(p => {
      if (!p) return;
      if (p.edges && p.position) { if (out[out.length - 1] !== p) out.push(p); return; }
      if (typeof p.x !== 'number' || typeof p.z !== 'number') return;
      const node = this.roadGraph.getNearestNode(p.x, p.z);
      if (node && out[out.length - 1] !== node) out.push(node);
    });
    return out;
  }

  _spawnBatch(count) {
    for (let i = 0; i < count; i++) {
      this._spawnSingleVehicle();
    }
  }

  _spawnSingleVehicle() {

    let type, isRuleBreaker, profileKey, color, route;

    if (this.levelNpcs.length > 0 && this.levelNpcIndex < this.levelNpcs.length) {

      const npcConfig = this.levelNpcs[this.levelNpcIndex];
      type = npcConfig.type;
      route = npcConfig.route;
      color = npcConfig.color;

      isRuleBreaker = ['reckless_bike', 'rulebreaker', 'aggressive'].includes(type) || Math.random() < RULE_BREAKER_PROBABILITY;
      profileKey = isRuleBreaker
        ? this._pickProfileKey('reckless_bike', 'rulebreaker', 'aggressive')
        : this._pickProfileKey('normal', 'cautious', 'delivery', 'elderly');
      this.levelNpcIndex++;
    } else {

      if (this.levelNpcTypes && this.levelNpcTypes.length > 0 && Math.random() < 0.5) {
        type = this.levelNpcTypes[Math.floor(Math.random() * this.levelNpcTypes.length)];
      } else {
        type = this._pickVehicleType();
      }
      isRuleBreaker = Math.random() < RULE_BREAKER_PROBABILITY && this.ruleBreakerCount / Math.max(1, this.totalSpawned) < RULE_BREAKER_PROBABILITY;
      profileKey = isRuleBreaker
        ? this._pickProfileKey('reckless_bike', 'rulebreaker', 'aggressive')
        : this._pickProfileKey('normal', 'cautious', 'delivery', 'elderly');
      color = this._pickColorForType(type);
    }

    const vehicle = this._createVehicle(type, color, profileKey, isRuleBreaker);

    if (!vehicle) return null;

    const spawnPoint = this._findSpawnPoint();
    if (!spawnPoint) {
      this._returnToPool(vehicle);
      return null;
    }

    vehicle.position.copy(spawnPoint.position);
    vehicle.rotation.y = spawnPoint.rotation;
    vehicle.currentNode = spawnPoint.node;
    vehicle.currentEdge = spawnPoint.edge;
    vehicle.currentLane = spawnPoint.lane;
    vehicle.routeProgress = 0;
    vehicle.targetNode = spawnPoint.edge ? spawnPoint.edge.getOther(spawnPoint.node) : this._getNextRouteNode(vehicle.currentNode);
    vehicle.active = true;
    vehicle.health = 100;
    vehicle.mesh.position.copy(vehicle.position);
    vehicle.mesh.rotation.y = vehicle.rotation.y;
    vehicle.mesh.visible = true;

    vehicle.npcAI = new window.NPCAI(vehicle, this.roadGraph, this);
    vehicle.npcAI.trafficManager = this;
    vehicle.profile = vehicle.npcAI.profile;
    vehicle.isRuleBreaker = isRuleBreaker;

    if (route) {
      const resolvedRoute = this._resolveRouteNodes(route);
      if (resolvedRoute.length >= 2) {
        vehicle.npcAI.setRoute(resolvedRoute.slice(1));
      } else {
        this._assignRoute(vehicle);
      }
    } else {
      this._assignRoute(vehicle);
    }

    if (isRuleBreaker) this.ruleBreakerCount++;
    this.totalSpawned++;

    this.vehicles.push(vehicle);
    this.game.scene.add(vehicle.mesh);
    if (this.game.npcs) this.game.npcs.push(vehicle.mesh);
    if (this.game.obstacles && !this.game.obstacles.includes(vehicle.mesh)) {
      this.game.obstacles.push(vehicle.mesh);
    }

    this._maybeFormPlatoon(vehicle);

    return vehicle;
  }


  _assignRoute(vehicle) {
    if (!this.roadGraph || !vehicle.npcAI || !vehicle.currentNode) return false;
    // Try several random destinations until A* finds a valid path
    for (let attempt = 0; attempt < 6; attempt++) {
      const dest = this._pickDestinationNode(vehicle.currentNode);
      if (!dest) break;
      const path = this.roadGraph.findPath(vehicle.currentNode, dest);
      if (path && path.length >= 2) {
        vehicle.npcAI.setRoute(path.slice(1));
        return true;
      }
    }
    // Fallback: drive to any direct neighbor so vehicle always has a valid route
    const neighbors = vehicle.currentNode.neighbors || [];
    if (!neighbors.length) return false;
    const nb = neighbors[Math.floor(Math.random() * neighbors.length)];
    vehicle.npcAI.setRoute([nb]);
    return true;
  }

  _pickDestinationNode(fromNode) {
    if (!this.roadGraph || !this.roadGraph.nodes) return null;
    const nodes = Array.from(this.roadGraph.nodes.values());
    if (nodes.length < 2) return null;
    let best = null, bestDist = -1;

    for (let i = 0; i < 6; i++) {
      const n = nodes[Math.floor(Math.random() * nodes.length)];
      if (n === fromNode) continue;
      const d = n.position.distanceTo(fromNode.position);
      if (d > bestDist) { bestDist = d; best = n; }
    }
    return best;
  }

  _pickProfileKey(...allowedKeys) {
    const profiles = window.NPC_PROFILES || {};
    const keys = (allowedKeys.length ? allowedKeys : Object.keys(profiles)).filter(k => profiles[k]);
    if (!keys.length) return 'normal';
    return keys[Math.floor(Math.random() * keys.length)];
  }

  _pickVehicleType() {
    const rand = Math.random();
    let cumulative = 0;
    for (const [type, weight] of Object.entries(VEHICLE_VARIETY_WEIGHTS)) {
      cumulative += weight;
      if (rand < cumulative) return type;
    }
    return 'car';
  }

  _pickColorForType(type) {
    const colors = {
      car: [0x224488, 0x882222, 0x228833, 0x888888, 0x443366, 0x995522, 0x226688, 0x882266],
      wagonr: [0x3a6073, 0x8e9eab, 0x5d4157, 0xa8c0ff, 0x3f2b96, 0xe0eafc],
      sedan: [0x1e3c72, 0x2a5298, 0x2c3e50, 0x4ca1af, 0xb20a2c, 0x525252],
      city: [0x1e3c72, 0x2a5298, 0x2c3e50, 0x4ca1af, 0xb20a2c],
      suv: [0x1f4037, 0x990000, 0x232526, 0x414345, 0x3a6073, 0x141e30],
      creta: [0x990000, 0x232526, 0x414345, 0x1f4037, 0x3a6073],
      innova: [0xd4d3dd, 0x525252, 0x24243e, 0x3f2b96, 0x4b6cb7],
      bike: [0x111111, 0xcc0000, 0x0000cc, 0xcc8800, 0x222222, 0xcccccc],
      splendor: [0x111111, 0x8b0000, 0x00008b, 0x222222],
      activa: [0xcc2222, 0xeeeeee, 0x333333, 0x224488, 0x888888, 0x995522],
      ktm: [0xff6600, 0x111111, 0xeeeeee],
      cycle: [0x00aa00, 0xcc0000, 0x0088cc, 0xffaa00],
      auto: [0x2e8b57, 0x228b22, 0x3cb371, 0x20b2aa, 0x1b4d3e],
      auto_yellow: [0xffd700, 0xffaa00, 0x222222],
      bus: [0xcc2222, 0x0044aa, 0xcc8800, 0x0066cc, 0x2e7d32],
      truck: [0x884400, 0x556633, 0x333333, 0x664422, 0xbf360c],
      ace: [0xeeeeee, 0x2980b9, 0xd35400, 0x27ae60],
      taxi: [0xffcc00, 0xffaa00, 0xffff00],
      police: [0x1a237e, 0xffffff],
      ambulance: [0xffffff]
    };
    const palette = colors[type] || colors.car;
    return palette[Math.floor(Math.random() * palette.length)];
  }

  _createVehicle(type, color, profileKey, isRuleBreaker) {

    let vehicle = null;
    if (this.vehiclePools.has(type)) {
      const pool = this.vehiclePools.get(type);
      if (pool.length > 0) {
        vehicle = pool.pop();
        this._resetVehicle(vehicle, color, profileKey);
        return vehicle;
      }
    }

    const mesh = this._createVehicleMesh(type, color);
    if (!mesh) return null;


    vehicle = {
      id: `npc_${type}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      active: false,
      position: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      speed: 0,
      mesh: mesh,
      stats: (window.VEHICLE_STATS && (window.VEHICLE_STATS[type] || window.VEHICLE_STATS.car)) || { accel: 0.045, fric: 0.945, maxSpd: 1.1 },
      profileKey: profileKey
    };

    return vehicle;
  }

  _createVehicleMesh(type, color) {
    let mesh = null;
    const colHex = (typeof color === 'number') ? color : 0x3498db;
    try {
      if (typeof window._buildVehicle === 'function') {
        mesh = window._buildVehicle(type, colHex);
      }
      if (!mesh && typeof window.IndianVehicles !== 'undefined' && typeof window.IndianVehicles.buildVehicle === 'function') {
        mesh = window.IndianVehicles.buildVehicle(type, colHex);
      }
      if (!mesh && this.game && typeof this.game._makeNPC === 'function') {
        mesh = this.game._makeNPC(type, colHex);
      }
      if (!mesh && typeof window.IndianVehicles !== 'undefined' && typeof window.IndianVehicles.buildVehicle === 'function') {
        mesh = window.IndianVehicles.buildVehicle('car', colHex);
      }
    } catch (e) {
      console.warn('[TrafficManager] vehicle mesh factory failed for "' + type + '"', e);
    }

    if (!mesh) {
      mesh = new THREE.Group();
      const bMat = new THREE.MeshToonMaterial({ color: colHex });
      const gMat = new THREE.MeshToonMaterial({ color: 0x1e293b, transparent: true, opacity: 0.8 });
      const wMat = new THREE.MeshToonMaterial({ color: 0x111111 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 3.6), bMat);
      body.position.y = 0.45;
      mesh.add(body);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.48, 1.8), gMat);
      cabin.position.set(0, 0.88, -0.1);
      mesh.add(cabin);

      ;[-0.82, 0.82].forEach(x => {
        ;[-1.1, 1.1].forEach(z => {
          const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), wMat);
          wh.rotation.z = Math.PI / 2;
          wh.position.set(x, 0.32, z);
          mesh.add(wh);
        });
      });
    }

    const isHeavy = type === 'bus' || type === 'truck';
    const isTwoWheeler = type === 'bike' || type === 'activa' || type === 'splendor' || type === 'ktm' || type === 'cycle';
    mesh.userData = mesh.userData || {};
    mesh.userData.npcType = type;
    mesh.userData.isTrafficManagerVehicle = true;
    mesh.userData.isObstacle = true;
    mesh.userData.isVehicle = true;
    mesh.userData.halfW = isHeavy ? 1.5 : (isTwoWheeler ? 0.6 : 1.15);
    mesh.userData.halfD = isHeavy ? 4.5 : (isTwoWheeler ? 1.1 : 2.2);

    if (!mesh.userData.materials) {
      let body = null;
      mesh.traverse(c => { if (!body && c.isMesh && c.material && c.material.color) body = c.material; });
      mesh.userData.materials = { body: body };
    }

    return mesh;
  }

  _resetVehicle(vehicle, color, profileKey) {
    vehicle.active = false;
    vehicle.speed = 0;
    vehicle.velocity.set(0, 0, 0);
    vehicle.profileKey = profileKey;
    vehicle.health = 100;
    vehicle.npcAI = null;


    if (vehicle.mesh && vehicle.mesh.userData.materials) {
      const mats = vehicle.mesh.userData.materials;
      if (mats.body) mats.body.color.setHex(color);
    }
  }

  _returnToPool(vehicle) {
    vehicle.active = false;
    this.game.scene.remove(vehicle.mesh);
    if (this.game.npcs) {
      this.game.npcs = this.game.npcs.filter(n => n !== vehicle.mesh);
    }
    if (this.game.obstacles) {
      this.game.obstacles = this.game.obstacles.filter(o => o !== vehicle.mesh);
    }
    
    if (this.vehiclePools.has(vehicle.type)) {
      this.vehiclePools.get(vehicle.type).push(vehicle);
    }
    
    this.vehicles = this.vehicles.filter(v => v !== vehicle);
  }

  _despawnVehicle(vehicle) {
    if (!vehicle.active) return;
    vehicle.active = false;
    this.game.scene.remove(vehicle.mesh);
    if (this.game.npcs) {
      const idx = this.game.npcs.indexOf(vehicle.mesh);
      if (idx > -1) this.game.npcs.splice(idx, 1);
    }
    if (this.game.obstacles) {
      const oIdx = this.game.obstacles.indexOf(vehicle.mesh);
      if (oIdx > -1) this.game.obstacles.splice(oIdx, 1);
    }
    if (vehicle.isRuleBreaker) this.ruleBreakerCount--;
    this._returnToPool(vehicle);
    this.vehicles = this.vehicles.filter(v => v !== vehicle);
  }

  _findSpawnPoint() {
    if (!this.roadGraph) return null;

    let edge = null;
    let startNode = null;
    const player = this.game && this.game.player && this.game.player.position;

    const candidates = this._spawnCandidateEdges();
    if (candidates.length > 0) {
      // Select edges within 30m - 180m of the player so traffic is lively, but leaving garage driveway clear
      const nearPlayerEdges = player
        ? candidates.filter(e => {
            const d = this._distanceToEdge(e, player);
            const gx = this.game ? this.game._garageX : undefined;
            const gz = this.game ? this.game._garageZ : undefined;
            const dGarage = (gx !== undefined && gz !== undefined)
              ? Math.hypot(e.nodes[0].position.x - gx, e.nodes[0].position.z - gz)
              : Infinity;
            return d >= 28 && d <= SPAWN_RADIUS && dGarage >= 32;
          })
        : candidates;

      const pool = nearPlayerEdges.length ? nearPlayerEdges : candidates;
      edge = pool[Math.floor(Math.random() * pool.length)];
      startNode = Math.random() < 0.5 ? edge.startNode : edge.endNode;
    }

    if (!edge || !startNode) return null;



    const pos = edge.getPointAt(this._spawnTOnEdge(edge));
    const forward = edge.getForwardVector(startNode);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Vehicles always drive IN LANES on the road (even in pedestrian levels —
    // road traffic is exactly what pedestrians must be taught to navigate around)
    const offsets = edge.getLaneOffsets();
    const laneCount = Math.max(1, edge.lanes || 1);
    const lane = Math.floor(Math.random() * laneCount);
    const dirBase = startNode === edge.startNode ? 0 : laneCount;
    const offset = offsets[dirBase + lane] !== undefined ? offsets[dirBase + lane] : 0;

    pos.addScaledVector(right, offset);
    pos.y = 0.5;

    return {
      position: pos,
      rotation: Math.atan2(forward.x, forward.z),
      node: startNode,
      edge: edge,
      lane: lane
    };
  }





  _spawnCandidateEdges() {
    const all = typeof this.roadGraph.getEdgeList === 'function'
      ? this.roadGraph.getEdgeList()
      : Array.from(this.roadGraph.edges.values ? this.roadGraph.edges.values() : []);
    const player = this.game && this.game.player && this.game.player.position;
    if (!player || all.length === 0) return all;

    const near = all.filter(e => this._distanceToEdge(e, player) < SPAWN_RADIUS);
    return near.length ? near : all;
  }


  _distanceToEdge(edge, p) {
    const a = edge.nodes[0].position, b = edge.nodes[1].position;
    const abx = b.x - a.x, abz = b.z - a.z;
    const len2 = abx * abx + abz * abz;
    let t = len2 ? ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(a.x + abx * t - p.x, a.z + abz * t - p.z);
  }




  _spawnTOnEdge(edge) {
    const player = this.game && this.game.player && this.game.player.position;
    if (!player || !edge.length) return 0.1 + Math.random() * 0.8;
    const a = edge.nodes[0].position, b = edge.nodes[1].position;
    const abx = b.x - a.x, abz = b.z - a.z;
    const len2 = abx * abx + abz * abz;
    if (!len2) return 0.5;
    let t = ((player.x - a.x) * abx + (player.z - a.z) * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const span = (SPAWN_MIN_GAP + Math.random() * (SPAWN_MAX_GAP - SPAWN_MIN_GAP)) / edge.length;
    t += Math.random() < 0.5 ? -span : span;
    return Math.max(0.02, Math.min(0.98, t));
  }

  _getNextRouteNode(currentNode) {
    if (this.mainRoute && Array.isArray(this.mainRoute) && this.mainRoute.length >= 2) {
      const idx = this.mainRoute.indexOf(currentNode);
      if (idx >= 0 && idx < this.mainRoute.length - 1) {
        return this.mainRoute[idx + 1];
      }
      return this.mainRoute[0];
    }
    

    if (currentNode && currentNode.edges && currentNode.edges.length > 0) {
        const randomEdge = currentNode.edges[Math.floor(Math.random() * currentNode.edges.length)];
        return randomEdge.endNode === currentNode ? randomEdge.startNode : randomEdge.endNode;
    }
    return null;
  }

  _maybeFormPlatoon(vehicle) {
    if (this.platoons.length > 5) return;
    if (Math.random() > 0.3) return;

    const sameTypeVehicles = this.vehicles.filter(v => 
      v.active && v.type === vehicle.type && v !== vehicle && v.currentEdge === vehicle.currentEdge
    );

    if (sameTypeVehicles.length >= PLATOON_SIZE - 1) {
      const platoon = new Platoon(vehicle, sameTypeVehicles.slice(0, PLATOON_SIZE - 1));
      this.platoons.push(platoon);
    }
  }

  getVehiclesOnEdge(edgeId) {
    return this.edgeVehicles.get(edgeId) || [];
  }

  getAvailableParkingSpots(position, radius) {
    return this.parkingSpots
      .filter(s => !s.occupied && s.position.distanceTo(position) < radius)
      .sort((a, b) => a.position.distanceTo(position) - b.position.distanceTo(position));
  }

  registerParkingSpot(spot) {
    this.parkingSpots.push(spot);
  }

  getActiveVehicleCount() {
    return this.vehicles.filter(v => v.active).length;
  }

  getRuleBreakerRatio() {
    const total = this.getActiveVehicleCount();
    return total > 0 ? this.ruleBreakerCount / total : 0;
  }

  getDensityMultiplier() {
    return this.densityMultiplier;
  }

  getSignalPressure() {
    return this.signalAccumulation / MAX_SIGNAL_ACCUMULATION;
  }

  setAudio(audio) {
    this.audio = audio;
  }

  getDebugInfo() {
    return {
      activeVehicles: this.getActiveVehicleCount(),
      ruleBreakers: this.ruleBreakerCount,
      ruleBreakerRatio: (this.getRuleBreakerRatio() * 100).toFixed(1) + '%',
      densityMultiplier: this.densityMultiplier.toFixed(2),
      signalPressure: (this.getSignalPressure() * 100).toFixed(1) + '%',
      platoons: this.platoons.length,
      pooledVehicles: Array.from(this.vehiclePools.values()).reduce((a, p) => a + p.length, 0)
    };
  }
}

class Platoon {
  constructor(leader, followers) {
    this.leader = leader;
    this.followers = followers;
    this.gap = PLATOON_GAP;
    this.active = true;
    this.formation = 'line';
    this.targetSpeed = 0;
  }

  update(dt, trafficManager) {
    if (!this.leader || !this.leader.active) {
      this.active = false;
      return;
    }

    this.targetSpeed = this.leader.npcAI?.desiredSpeed || 10;
    this.followers = this.followers.filter(f => f.active);
    
    if (this.followers.length === 0) {
      this.active = false;
      return;
    }

    this.followers.forEach((follower, idx) => {
      if (!follower.npcAI) return;
      
      const targetPos = this._getFollowerPosition(idx);
      const toTarget = new THREE.Vector3().subVectors(targetPos, follower.position);
      const dist = toTarget.length();
      
      if (dist > this.gap * 1.5) {
        follower.npcAI.desiredSpeed = this.targetSpeed * 1.2;
      } else if (dist < this.gap * 0.5) {
        follower.npcAI.desiredSpeed = this.targetSpeed * 0.5;
      } else {
        follower.npcAI.desiredSpeed = this.targetSpeed;
      }
    });
  }

  _getFollowerPosition(index) {
    const leaderPos = this.leader.position.clone();
    const leaderRot = this.leader.rotation.y;
    const forward = new THREE.Vector3(
      Math.sin(leaderRot), 0, Math.cos(leaderRot)
    );
    
    const offset = (index + 1) * this.gap;
    return leaderPos.addScaledVector(forward, -offset);
  }

  addFollower(vehicle) {
    if (this.followers.length < PLATOON_SIZE) {
      this.followers.push(vehicle);
    }
  }
}




window.TrafficManager = TrafficManager;
window.Platoon = Platoon;
window.VEHICLE_VARIETY_WEIGHTS = VEHICLE_VARIETY_WEIGHTS;
window.RULE_BREAKER_PROBABILITY = RULE_BREAKER_PROBABILITY;
window.BASE_NPC_COUNT = BASE_NPC_COUNT;
window.MAX_NPC_COUNT = MAX_NPC_COUNT;
window.DENSITY_INCREASE_PER_MIN = DENSITY_INCREASE_PER_MIN;