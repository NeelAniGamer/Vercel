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
      }
    });
  }

  _updateDensity(dt) {
    this.lastDensityUpdate += dt;
    if (this.lastDensityUpdate >= 60) {
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
    vehicle.npcAI = new window.NPCAI(vehicle, profile, this);
    vehicle.npcAI.trafficManager = this;
    vehicle.profile = profile;
    vehicle.isRuleBreaker = isRuleBreaker;

    if (isRuleBreaker) this.ruleBreakerCount++;
    this.totalSpawned++;

    this.vehicles.push(vehicle);
    this.game.scene.add(vehicle.mesh);
    
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
    const list = colors[type] || colors.car;
    return list[Math.floor(Math.random() * list.length)];
  }

  _createVehicle(type, color, profile, isRuleBreaker) {
    const pool = this.vehiclePools.get(type);
    let vehicle;
    
    if (pool && pool.length > 0) {
      vehicle = pool.pop();
      vehicle.mesh.traverse(m => {
        if (m.material) {
          if (Array.isArray(m.material)) {
            m.material.forEach(mat => { if (mat.color) mat.color.setHex(color); });
          } else if (m.material.color) {
            m.material.color.setHex(color);
          }
        }
      });
    } else {
      const mesh = window.IndianVehicles.buildVehicle(type, color);
      vehicle = {
        mesh,
        type,
        profile,
        isRuleBreaker,
        velocity: new THREE.Vector3(),
        position: new THREE.Vector3(),
        rotation: new THREE.Vector3(),
        stats: window.VEHICLE_STATS[type] || window.VEHICLE_STATS.car,
        vehicleClass: type
      };
    }
    
    vehicle.mesh.visible = true;
    vehicle.profile = profile;
    vehicle.isRuleBreaker = isRuleBreaker;
    return vehicle;
  }

  _returnToPool(vehicle) {
    if (!vehicle) return;
    vehicle.mesh.visible = false;
    vehicle.active = false;
    vehicle.npcAI = null;
    vehicle.currentEdge = null;
    vehicle.currentNode = null;
    vehicle.targetNode = null;
    vehicle.routeProgress = 0;
    vehicle.health = 100;
    
    const pool = this.vehiclePools.get(vehicle.type);
    if (pool && pool.length < 20) {
      pool.push(vehicle);
    } else {
      this.game.scene.remove(vehicle.mesh);
    }
  }

  _despawnVehicle(vehicle) {
    if (vehicle.isRuleBreaker) this.ruleBreakerCount--;
    this._returnToPool(vehicle);
    this.vehicles = this.vehicles.filter(v => v !== vehicle);
  }

  _findSpawnPoint() {
    if (!this.roadGraph || !this.mainRoute || this.mainRoute.length < 2) return null;
    
    const startIdx = Math.floor(Math.random() * (this.mainRoute.length - 1));
    const startNode = this.mainRoute[startIdx];
    const endNode = this.mainRoute[startIdx + 1];
    const edge = startNode.getEdgeTo(endNode);
    
    if (!edge) return null;

    const laneCount = edge.lanes || 1;
    const lane = Math.floor(Math.random() * laneCount);
    const offset = edge.getLaneOffsets()[lane] || 0;
    
    const pos = edge.getPointAt(0.02);
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
    if (!this.mainRoute || this.mainRoute.length < 2) return null;
    const idx = this.mainRoute.indexOf(currentNode);
    if (idx >= 0 && idx < this.mainRoute.length - 1) {
      return this.mainRoute[idx + 1];
    }
    return this.mainRoute[0];
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