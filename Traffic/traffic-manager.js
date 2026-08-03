/**
 * TrafficManager - Central traffic orchestration for Mumbai driving simulator
 * Handles density accumulation, platooning, vehicle variety, and rule-breaker spawning
 */

const VEHICLE_VARIETY_WEIGHTS = {
  car: 0.35,
  bike: 0.25,
  auto: 0.15,
  bus: 0.10,
  truck: 0.08,
  taxi: 0.05,
  ambulance: 0.02
};

const VEHICLE_CLASS_LANE_ACCESS = {
  car: ['car', 'bus'],
  bike: ['bike', 'car', 'bus'],
  auto: ['car', 'bus'],
  bus: ['bus'],
  truck: ['bus', 'car'],
  taxi: ['car', 'bus'],
  ambulance: ['bus', 'car']
};

const RULE_BREAKER_PROBABILITY = 0.20;
const PLATOON_SIZE = 3;
const PLATOON_GAP = 8;
const BASE_NPC_COUNT = 16;
const MAX_NPC_COUNT = 48;
const MOBILE_NPC_COUNT = 16; // Reduced for mobile performance
const DENSITY_INCREASE_PER_MIN = 0.05;
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
    
    // Update individual vehicle AI
    this.vehicles.forEach(vehicle => {
      if (vehicle.active && vehicle.npcAI) {
        vehicle.npcAI.update(dt, playerVehicle, signals);
        vehicle.mesh.position.copy(vehicle.position);
        vehicle.mesh.rotation.y = vehicle.rotation.y;
      }
    });
  }

  _updateDensity(dt) {
    this.lastDensityUpdate += dt;
    if (this.lastDensityUpdate >= 10) {
      this.lastDensityUpdate = 0;
      const targetDensity = Math.min(getBaseNPCCount() * (1 + this.densityMultiplier * 2), getMaxNPCCount());
      const currentCount = this.vehicles.filter(v => v.active).length;
      
      if (currentCount < targetDensity * 0.8) {
        this.densityMultiplier = Math.min(2.0, this.densityMultiplier + DENSITY_INCREASE_PER_MIN);
        this._spawnBatch(Math.ceil((targetDensity - currentCount) * 0.3));
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
    this.platoons = this.platoons.filter(p => p.active && p.vehicles.length > 1);
  }

  _manageVehicleLifecycle(playerVehicle) {
    const despawnDist = 400;
    const playerPos = playerVehicle?.position || new THREE.Vector3();
    
    this.vehicles.forEach((vehicle, index) => {
      if (!vehicle.active) return;
      
      const dist = vehicle.position.distanceTo(playerPos);
      if (dist > despawnDist) {
        this._despawnVehicle(vehicle);
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

  spawnInitialTraffic(roadGraph, route, count = BASE_NPC_COUNT) {
    this.roadGraph = roadGraph;
    this.mainRoute = route;
    this._spawnBatch(count);
  }

  _spawnBatch(count) {
    for (let i = 0; i < count; i++) {
      this._spawnSingleVehicle();
    }
  }

  _spawnSingleVehicle() {
    const type = this._pickVehicleType();
    const isRuleBreaker = Math.random() < RULE_BREAKER_PROBABILITY && this.ruleBreakerCount / Math.max(1, this.totalSpawned) < RULE_BREAKER_PROBABILITY;
    
    const profile = isRuleBreaker 
      ? window.pickRandomProfile('reckless_bike', 'rulebreaker', 'aggressive')
      : window.pickRandomProfile('normal', 'cautious');
    
    const color = this._pickColorForType(type);
    const vehicle = this._createVehicle(type, color, profile, isRuleBreaker);
    
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
    vehicle.currentLane = Math.floor(Math.random() * (spawnPoint.edge.lanes || 1));
    vehicle.routeProgress = 0;
    vehicle.targetNode = this._getNextRouteNode(vehicle.currentNode);
    vehicle.active = true;
    vehicle.health = 100;
    // Fix: pass roadGraph as second argument to NPCAI
    vehicle.npcAI = new window.NPCAI(vehicle, this.roadGraph, this);
    vehicle.npcAI.trafficManager = this;
    vehicle.profile = profile;
    vehicle.isRuleBreaker = isRuleBreaker;

    if (isRuleBreaker) this.ruleBreakerCount++;
    this.totalSpawned++;

    this.vehicles.push(vehicle);
    this.game.scene.add(vehicle.mesh);
    if (this.game.npcs) this.game.npcs.push(vehicle.mesh);
    
    this._maybeFormPlatoon(vehicle);
    
    return vehicle;
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
      bike: [0x111111, 0xcc0000, 0x0000cc, 0xcc8800, 0x222222, 0xcccccc],
      auto: [0x2e8b57, 0x228b22, 0x3cb371, 0x20b2aa],
      bus: [0xcc2222, 0x0044aa, 0xcc8800, 0x0066cc],
      truck: [0x884400, 0x556633, 0x333333, 0x664422],
      taxi: [0xffcc00, 0xffaa00, 0xffff00],
      ambulance: [0xffffff]
    };
    const palette = colors[type] || colors.car;
    return palette[Math.floor(Math.random() * palette.length)];
  }

  _createVehicle(type, color, profile, isRuleBreaker) {
    // Try to get from pool first
    let vehicle = null;
    if (this.vehiclePools.has(type)) {
      const pool = this.vehiclePools.get(type);
      if (pool.length > 0) {
        vehicle = pool.pop();
        this._resetVehicle(vehicle, color, profile);
        return vehicle;
      }
    }

    // Create new if pool is empty
    vehicle = {
      id: `npc_${type}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      active: false,
      position: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      speed: 0,
      mesh: this._createVehicleMesh(type, color),
      stats: VEHICLE_STATS[type] || VEHICLE_STATS.car,
      profileKey: profile
    };
    
    return vehicle;
  }

  _resetVehicle(vehicle, color, profile) {
    vehicle.active = false;
    vehicle.speed = 0;
    vehicle.velocity.set(0, 0, 0);
    vehicle.profileKey = profile;
    
    // Update color
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
    if (vehicle.isRuleBreaker) this.ruleBreakerCount--;
    this._returnToPool(vehicle);
    this.vehicles = this.vehicles.filter(v => v !== vehicle);
  }

  _findSpawnPoint() {
    if (!this.roadGraph) return null;
    
    let edge = null;
    let startNode = null;
    let endNode = null;
    
    if (this.mainRoute && Array.isArray(this.mainRoute) && this.mainRoute.length >= 2) {
      const startIdx = Math.floor(Math.random() * (this.mainRoute.length - 1));
      startNode = this.mainRoute[startIdx];
      endNode = this.mainRoute[startIdx + 1];
      if (startNode && startNode.getEdgeTo) {
        edge = startNode.getEdgeTo(endNode);
      }
    }
    
    // Fallback if mainRoute is a string or invalid
    if (!edge && this.roadGraph.edges && this.roadGraph.edges.length > 0) {
      edge = this.roadGraph.edges[Math.floor(Math.random() * this.roadGraph.edges.length)];
      startNode = edge.startNode;
      endNode = edge.endNode;
    }
    
    if (!edge) return null;

    const laneCount = edge.lanes || 1;
    const lane = Math.floor(Math.random() * laneCount);
    const offset = edge.getLaneOffsets()[lane] || 0;
    
    const pos = edge.getPointAt(Math.random() * 0.9);
    const forward = edge.getForwardVector(startNode);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    
    pos.add(right.multiplyScalar(offset));
    pos.y = 0.5;

    return {
      position: pos,
      rotation: Math.atan2(forward.x, forward.z),
      node: startNode,
      edge: edge,
      lane: lane
    };
  }

  _getNextRouteNode(currentNode) {
    if (this.mainRoute && Array.isArray(this.mainRoute) && this.mainRoute.length >= 2) {
      const idx = this.mainRoute.indexOf(currentNode);
      if (idx >= 0 && idx < this.mainRoute.length - 1) {
        return this.mainRoute[idx + 1];
      }
      return this.mainRoute[0];
    }
    
    // Fallback if no specific route array: just pick a random connected node
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

function pickRandomProfile(...allowedKeys) {
  const keys = allowedKeys.length > 0 ? allowedKeys : Object.keys(window.NPC_PROFILES || {});
  const key = keys[Math.floor(Math.random() * keys.length)];
  return window.NPC_PROFILES[key] || window.NPC_PROFILES.normal;
}

window.TrafficManager = TrafficManager;
window.Platoon = Platoon;
window.VEHICLE_VARIETY_WEIGHTS = VEHICLE_VARIETY_WEIGHTS;
window.RULE_BREAKER_PROBABILITY = RULE_BREAKER_PROBABILITY;
window.BASE_NPC_COUNT = BASE_NPC_COUNT;
window.MAX_NPC_COUNT = MAX_NPC_COUNT;
window.DENSITY_INCREASE_PER_MIN = DENSITY_INCREASE_PER_MIN;
window.pickRandomProfile = pickRandomProfile;