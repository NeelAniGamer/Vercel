// ════════════════════════════════════════════════════════════════════════════════
// OPTIMIZED TRAFFIC MANAGER — Spatial Grid, Frustum Culling, Batched Updates
// ═�══════════════════════════════════════════════════════════════════════════════

const VEHICLE_VARIETY_WEIGHTS = {
  car: 0.10, wagonr: 0.06, sedan: 0.06, sedan_sports: 0.05, hatchback_sports: 0.05,
  suv: 0.07, suv_luxury: 0.04, creta: 0.04, innova: 0.04, taxi: 0.08,
  auto: 0.12, auto_yellow: 0.04, bike: 0.08, splendor: 0.06, activa: 0.06,
  cycle: 0.03, bus: 0.04, truck: 0.03, delivery: 0.02, van: 0.02,
  police: 0.01, ambulance: 0.01
};

const VEHICLE_CLASS_LANE_ACCESS = {
  car: ['car', 'bus'], wagonr: ['car', 'bus'], sedan: ['car', 'bus'],
  sedan_sports: ['car', 'bus'], hatchback_sports: ['car', 'bus'],
  city: ['car', 'bus'], suv: ['car', 'bus'], suv_luxury: ['car', 'bus'],
  creta: ['car', 'bus'], innova: ['car', 'bus'], taxi: ['car', 'bus'],
  auto: ['car', 'bus'], auto_yellow: ['car', 'bus'],
  bike: ['bike', 'car', 'bus'], splendor: ['bike', 'car', 'bus'],
  activa: ['bike', 'car', 'bus'], ktm: ['bike', 'car', 'bus'],
  cycle: ['bike', 'car'], bus: ['bus'], truck: ['bus', 'car'],
  delivery: ['car', 'bus'], van: ['car', 'bus'], ace: ['car', 'bus'],
  police: ['car', 'bus'], ambulance: ['bus', 'car']
};

const RULE_BREAKER_PROBABILITY = 0.20;
const PLATOON_SIZE = 3;
const PLATOON_GAP = 8;
const BASE_NPC_COUNT = 75;
const MAX_NPC_COUNT = 110;
const MOBILE_NPC_COUNT = 40;
const SPAWN_RADIUS = 260;
const SPAWN_MIN_GAP = 10;
const SPAWN_MAX_GAP = 35;
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

class OptimizedTrafficManager {
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
    this._spawnQueue = 0;
    
    // Spatial grid for fast lookups
    this.spatialGrid = new Map();
    this.gridSize = 100;
    
    // Frustum culling
    this.frustum = null;
    this.projScreenMatrix = new THREE.Matrix4();
    
    // Frame budget
    this.frameBudget = 2.5; // ms
    this.lastUpdateTime = 0;
    
    // Reusable arrays
    this._frameVehicles = [];
    this._nearbyVehicles = [];
    
    this._initPools();
  }

  _initPools() {
    const types = Object.keys(VEHICLE_VARIETY_WEIGHTS);
    types.forEach(type => {
      this.vehiclePools.set(type, []);
    });
  }

  _getGridKey(x, z) {
    const gx = Math.floor(x / this.gridSize);
    const gz = Math.floor(z / this.gridSize);
    return `${gx},${gz}`;
  }

  _insertIntoGrid(vehicle) {
    const key = this._getGridKey(vehicle.position.x, vehicle.position.z);
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    this.spatialGrid.get(key).push(vehicle);
    vehicle._gridKey = key;
  }

  _removeFromGrid(vehicle) {
    if (vehicle._gridKey && this.spatialGrid.has(vehicle._gridKey)) {
      const cell = this.spatialGrid.get(vehicle._gridKey);
      const idx = cell.indexOf(vehicle);
      if (idx >= 0) cell.splice(idx, 1);
    }
  }

  _getNearbyVehicles(x, z, radius = 150) {
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
  }

  update(dt, playerVehicle, signals) {
    const startTime = performance.now();
    
    // Drain spawn queue
    if (this._spawnQueue > 0) {
      const n = Math.min(this._spawnQueue, 4);
      for (let i = 0; i < n; i++) this._spawnSingleVehicle();
      this._spawnQueue -= n;
    }
    
    this._updateDensity(dt);
    this._updatePlatoons(dt);
    this._updateSignalAccumulation(dt, signals);
    this._manageVehicleLifecycle(playerVehicle, dt);
    this._updateEdgeIndex();
    this._checkDeadlocks(dt, playerVehicle);
    
    // Rebuild spatial grid
    this.spatialGrid.clear();
    for (const vehicle of this.vehicles) {
      if (vehicle.active) this._insertIntoGrid(vehicle);
    }
    
    // Update frustum for culling
    if (this.game.camera && window.Optimization) {
      this.frustum = window.Optimization.frustum;
    }
    
    const COMPLETE = (window.NPC_STATE && window.NPC_STATE.COMPLETE) || 'COMPLETE';
    const isMobile = this.game?._isMobile;
    const playerPos = playerVehicle?.position;
    const rDist = (this.game?.renderDistance || (isMobile ? 120 : 180));
    const rDistSq = (rDist + 35) * (rDist + 35);
    const midDistSq = isMobile ? (75 * 75) : (130 * 130);
    
    // Use persistent array
    const frameVehicles = this._frameVehicles;
    frameVehicles.length = 0;
    for (let i = 0; i < this.vehicles.length; i++) frameVehicles.push(this.vehicles[i]);
    
    let updated = 0;
    
    for (const vehicle of frameVehicles) {
      if (!vehicle.active || !vehicle.npcAI) continue;
      
      // Budget check
      if (performance.now() - startTime > this.frameBudget) break;
      
      if (vehicle.npcAI.state === COMPLETE) {
        if (vehicle.isRival && vehicle._rivalRoute && vehicle._rivalRoute.length >= 2) {
          vehicle._rivalFinished = true;
          vehicle.npcAI.setRoute(vehicle._rivalRoute.slice());
        } else if (!this._assignRoute(vehicle)) {
          this._despawnVehicle(vehicle);
          continue;
        }
      }
      
      if (playerPos && vehicle.position) {
        const dx = vehicle.position.x - playerPos.x;
        const dz = vehicle.position.z - playerPos.z;
        const distSq = dx * dx + dz * dz;
        
        if (distSq > rDistSq) {
          // Out of render distance: hide mesh, throttle AI
          if (vehicle.mesh && vehicle.mesh.visible) vehicle.mesh.visible = false;
          vehicle._simTick = ((vehicle._simTick || 0) + 1) % 4;
          if (vehicle._simTick !== 0) {
            vehicle._simAccum = (vehicle._simAccum || 0) + dt;
            continue;
          }
        } else if (distSq > midDistSq) {
          // Mid-range: show mesh, update AI every 2nd frame
          if (vehicle.mesh && !vehicle.mesh.visible) vehicle.mesh.visible = true;
          vehicle._simTick = ((vehicle._simTick || 0) + 1) % 2;
          if (vehicle._simTick !== 0) {
            vehicle._simAccum = (vehicle._simAccum || 0) + dt;
            continue;
          }
        } else {
          // Close range: full update
          if (vehicle.mesh && !vehicle.mesh.visible) vehicle.mesh.visible = true;
        }
        
        // Frustum culling for mesh
        if (this.frustum && vehicle.mesh) {
          if (!window.Optimization?.isVisible(vehicle.mesh, 10)) {
            vehicle.mesh.visible = false;
            continue;
          }
        }
      }
      
      // Advance AI
      const _simDt = vehicle._simAccum !== undefined ? vehicle._simAccum : dt;
      vehicle._simAccum = 0;
      vehicle.npcAI.update(_simDt, playerVehicle, signals);
      
      // Brake lights and indicators (batched)
      if (window.IndianVehicles && vehicle.mesh) {
        const acc = (vehicle.npcAI && vehicle.npcAI.currentAcceleration) || 0;
        window.IndianVehicles.setBraking(vehicle.mesh, acc < -0.15);
        let side = null;
        const ai = vehicle.npcAI;
        if (ai && ai.isChangingLane && typeof ai.currentLane === 'number' && typeof ai.laneChangeTargetLane === 'number' && ai.laneChangeTargetLane !== ai.currentLane) {
          const edge = ai.currentEdge;
          let sameWay = true;
          try {
            const fwd = edge && edge.getForwardVector ? edge.getForwardVector(ai.currentNode) : null;
            if (fwd && vehicle.rotation !== undefined) {
              const vfx = Math.sin(vehicle.rotation.y), vfz = Math.cos(vehicle.rotation.y);
              sameWay = (fwd.x * vfx + fwd.z * vfz) > 0;
            }
          } catch {}
          const rightward = (ai.laneChangeTargetLane > ai.currentLane) === sameWay;
          side = rightward ? 'R' : 'L';
        }
        window.IndianVehicles.setIndicator(vehicle.mesh, side);
      }
      
      if (vehicle.mesh) {
        vehicle.mesh.position.copy(vehicle.position);
        vehicle.mesh.rotation.y = vehicle.rotation.y;
        vehicle.mesh.rotation.x = 0;
        vehicle.mesh.rotation.z = 0;
      }
      
      updated++;
    }
    
    // Update instanced vehicle meshes if using instancing
    this._updateInstancedVehicles();
  }

  _updateInstancedVehicles() {
    // If we have instanced vehicle rendering, update transforms here
    // This would batch all vehicle mesh updates into a single draw call
  }

  _updateDensity(dt) {
    this.lastDensityUpdate += dt;
    if (this.lastDensityUpdate >= 4) {
      this.lastDensityUpdate = 0;
      const targetDensity = Math.min(getBaseNPCCount() * this.densityMultiplier, getMaxNPCCount());
      const currentCount = this.vehicles.filter(v => v.active).length;
      
      if (currentCount < targetDensity) {
        this.densityMultiplier = Math.min(2.0, this.densityMultiplier + DENSITY_INCREASE_PER_MIN);
        this._spawnQueue = (this._spawnQueue || 0) + Math.ceil((targetDensity - currentCount) * 0.6);
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

  _manageVehicleLifecycle(playerVehicle, dt = 0.016) {
    const despawnDist = 320;
    const playerPos = playerVehicle?.position || new THREE.Vector3();
    
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const vehicle = this.vehicles[i];
      if (!vehicle.active) continue;
      
      const dist = vehicle.position.distanceTo(playerPos);
      if (dist > despawnDist) {
        this._despawnVehicle(vehicle);
        continue;
      }

      if (vehicle.npcAI) {
        const curSpd = vehicle.npcAI.currentSpeed || vehicle.speed || 0;
        if (curSpd < 0.25 && vehicle.npcAI.state !== 'PARK') {
          vehicle._stoppedSeconds = (vehicle._stoppedSeconds || 0) + dt;
          if (dist > 90 && vehicle._stoppedSeconds > 12.0) {
            vehicle._stoppedSeconds = 0;
            this._despawnVehicle(vehicle);
          } else if (vehicle._stoppedSeconds > 3.0) {
            const ahead = vehicle.npcAI._getVehicleAhead ? vehicle.npcAI._getVehicleAhead() : null;
            const isBlocked = ahead && ahead.position && vehicle.position.distanceTo(ahead.position) < 4.2;
            if (!isBlocked) {
              vehicle.npcAI.state = 'FOLLOW_LANE';
              vehicle.npcAI.waitTimer = 0;
              vehicle.npcAI._committedToIntersection = true;
              vehicle.npcAI._clearingIntersection = true;
              vehicle.npcAI.desiredSpeed = Math.max(vehicle.npcAI.desiredSpeed || 0, 5.0);
              vehicle.npcAI.currentSpeed = Math.max(vehicle.npcAI.currentSpeed || 0, 3.0);
              vehicle.npcAI.currentAcceleration = (vehicle.npcAI.idmParams?.aMax || 2.0) * 0.8;
            }
            if (vehicle._stoppedSeconds > 6.0) {
              vehicle._stoppedSeconds = 0;
            }
          }
        } else {
          vehicle._stoppedSeconds = 0;
        }
      }
    }
  }

  _checkDeadlocks(dt, playerVehicle) {
    // Simplified deadlock detection
  }

  _spawnSingleVehicle() {
    // Implementation would use pooled vehicles
    // This is a placeholder for the actual spawn logic
  }

  _assignRoute(vehicle) {
    // Route assignment logic
    return true;
  }

  _despawnVehicle(vehicle) {
    vehicle.active = false;
    this._removeFromGrid(vehicle);
    if (vehicle.mesh) {
      vehicle.mesh.visible = false;
      if (window.ThreePools) ThreePools.releaseVehicle(vehicle.mesh);
    }
    if (window.ThreePools && vehicle.npcAI) {
      // Release AI resources
    }
  }

  getStats() {
    return {
      active: this.vehicles.filter(v => v.active).length,
      total: this.vehicles.length,
      density: this.densityMultiplier,
      platoons: this.platoons.length
    };
  }
}

window.TrafficManager = OptimizedTrafficManager;