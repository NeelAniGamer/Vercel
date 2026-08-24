const NPC_STATE = {
  IDLE: 'IDLE',
  FOLLOW_LANE: 'FOLLOW_LANE',
  OVERTAKE: 'OVERTAKE',
  WAIT_SIGNAL: 'WAIT_SIGNAL',
  SIDEWALK_DETOUR: 'SIDEWALK_DETOUR',
  PARK: 'PARK',
  COMPLETE: 'COMPLETE',
  CRASH: 'CRASH',
  PULL_OVER: 'PULL_OVER',
  EMERGENCY_BRAKE: 'EMERGENCY_BRAKE',
  DISTRACTED: 'DISTRACTED',
  ROAD_RAGE: 'ROAD_RAGE'
};

const NPC_PROFILES = {
  normal: {
    name: 'Normal Driver',
    weight: 55,
    aggression: 0.3,
    patience: 0.7,
    signalCompliance: 0.95,
    laneDiscipline: 0.95,
    speedVariance: 0.15,
    overtakeThreshold: 0.6,
    sidewalkProbability: 0.0,
    parkingSkill: 0.8
  },
  aggressive: {
    name: 'Aggressive Driver',
    weight: 15,
    aggression: 0.8,
    patience: 0.3,
    signalCompliance: 0.6,
    laneDiscipline: 0.7,
    speedVariance: 0.35,
    overtakeThreshold: 0.3,
    sidewalkProbability: 0.0,
    parkingSkill: 0.5
  },
  reckless_bike: {
    name: 'Reckless Biker',
    weight: 10,
    aggression: 0.9,
    patience: 0.1,
    signalCompliance: 0.3,
    laneDiscipline: 0.6,
    speedVariance: 0.5,
    overtakeThreshold: 0.15,
    sidewalkProbability: 0.0,
    parkingSkill: 0.2
  },
  rulebreaker: {
    name: 'Rule Breaker',
    weight: 12,
    aggression: 0.6,
    patience: 0.4,
    signalCompliance: 0.25,
    laneDiscipline: 0.65,
    speedVariance: 0.4,
    overtakeThreshold: 0.25,
    sidewalkProbability: 0.0,
    parkingSkill: 0.35
  },
  cautious: {
    name: 'Cautious Driver',
    weight: 8,
    aggression: 0.1,
    patience: 0.9,
    signalCompliance: 0.99,
    laneDiscipline: 0.98,
    speedVariance: 0.08,
    overtakeThreshold: 0.85,
    sidewalkProbability: 0.0,
    parkingSkill: 0.95
  },
  teen: {
    name: 'Teen Driver',
    weight: 6,
    aggression: 0.7,
    patience: 0.2,
    signalCompliance: 0.4,
    laneDiscipline: 0.7,
    speedVariance: 0.45,
    overtakeThreshold: 0.2,
    sidewalkProbability: 0.0,
    parkingSkill: 0.3
  },
  elderly: {
    name: 'Elderly Driver',
    weight: 5,
    aggression: 0.05,
    patience: 0.95,
    signalCompliance: 0.98,
    laneDiscipline: 0.92,
    speedVariance: 0.1,
    overtakeThreshold: 0.95,
    sidewalkProbability: 0.0,
    parkingSkill: 0.7
  },
  delivery: {
    name: 'Delivery Driver',
    weight: 6,
    aggression: 0.75,
    patience: 0.15,
    signalCompliance: 0.35,
    laneDiscipline: 0.7,
    speedVariance: 0.3,
    overtakeThreshold: 0.15,
    sidewalkProbability: 0.0,
    parkingSkill: 0.4
  },
  tourist: {
    name: 'Tourist Driver',
    weight: 4,
    aggression: 0.2,
    patience: 0.6,
    signalCompliance: 0.85,
    laneDiscipline: 0.8,
    speedVariance: 0.2,
    overtakeThreshold: 0.7,
    sidewalkProbability: 0.0,
    parkingSkill: 0.3
  }
};

const PROFILE_KEYS = Object.keys(NPC_PROFILES);
const PROFILE_WEIGHTS = PROFILE_KEYS.map(k => NPC_PROFILES[k].weight);
const TOTAL_WEIGHT = PROFILE_WEIGHTS.reduce((a, b) => a + b, 0);

function pickRandomProfile() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < PROFILE_KEYS.length; i++) {
    r -= PROFILE_WEIGHTS[i];
    if (r <= 0) return PROFILE_KEYS[i];
  }
  return 'normal';
}

class NPCAI {
  constructor(vehicle, roadGraph, trafficManager) {
    this.vehicle = vehicle;
    this.roadGraph = roadGraph;
    this.trafficManager = trafficManager;
    this.profileKey = (vehicle.profileKey && NPC_PROFILES[vehicle.profileKey]) ? vehicle.profileKey : pickRandomProfile();
    this.profile = NPC_PROFILES[this.profileKey] || NPC_PROFILES.normal;
    this.state = NPC_STATE.IDLE;
    this.targetNode = null;
    this.currentEdge = null;
    this.currentLane = 0;
    this.route = [];
    this.routeIndex = 0;
    this.waitTimer = 0;
    this.overtakeTimer = 0;
    this.overtakeTarget = null;
    this.overtakePhase = 0;
    this.sidewalkTimer = 0;
    this.parkingSpot = null;
    this.parkingPhase = 0;
    this.crashTimer = 0;
    this.lastSignalCheck = 0;
    this.signalViolation = false;
    this.laneChangeCooldown = 0;
    this.desiredSpeed = 0;
    this.currentSpeed = 0;
    this.followDistance = 15 + Math.random() * 10;
    this.reactionDelay = 0.1 + Math.random() * 0.3;
    this.reactionTimer = 0;
    this.isRuleBreaker = ['reckless_bike', 'rulebreaker', 'aggressive'].includes(this.profileKey);
    const p = this.profile || NPC_PROFILES.normal;
    this.behaviorModifiers = {
      hornFrequency: p.aggression * 0.5,
      lightFlashFrequency: p.aggression * 0.3,
      tailgateDistance: (1 - p.patience) * 10 + 5
    };

    this.distractTimer = 0;
    this.distractChance = this.profileKey === 'normal' ? 0.0003 : this.profileKey === 'cautious' ? 0.0001 : this.profileKey === 'aggressive' ? 0.0008 : 0.0005;

    this.rageTimer = 0;
    this.rageLevel = 0;
  }

  init() {}

  setRoute(route) {
    this.route = route || [];
    this.routeIndex = 0;
    this.state = NPC_STATE.FOLLOW_LANE;
    this._pickNextTarget();
  }

  _pickNextTarget() {
    if (this.route && this.route.length > 0 && this.routeIndex < this.route.length) {
      this.targetNode = this.route[this.routeIndex];
      let edge = null;
      if (this.vehicle.currentNode && this.roadGraph) {
        edge = this.roadGraph.getEdgeTo(this.vehicle.currentNode, this.targetNode);
      }
      if (edge) {
        this.currentEdge = edge;
        this.currentLane = this._pickInitialLane(edge);
        this.vehicle.routeProgress = 0;
        return;
      }
    }

    // Connect to adjacent node if available
    if (this.vehicle.currentNode && this.vehicle.currentNode.neighbors && this.vehicle.currentNode.neighbors.length > 0) {
      const neighbors = this.vehicle.currentNode.neighbors;
      const nb = neighbors[Math.floor(Math.random() * neighbors.length)];
      const edge = this.roadGraph ? this.roadGraph.getEdgeTo(this.vehicle.currentNode, nb) : null;
      if (edge) {
        this.targetNode = nb;
        this.currentEdge = edge;
        this.currentLane = this._pickInitialLane(edge);
        this.vehicle.routeProgress = 0;
        this.state = NPC_STATE.FOLLOW_LANE;
        return;
      }
    }

    if (this.trafficManager && this.trafficManager._assignRoute) {
      if (this.trafficManager._assignRoute(this.vehicle)) {
        return;
      }
    }

    this.state = NPC_STATE.COMPLETE;
  }

  _advanceRoute() {
    this.routeIndex++;
    if (this.targetNode) {
      this.vehicle.currentNode = this.targetNode;
    }
    this._pickNextTarget();
  }

  _getVehicleAhead() {
    if (!this.trafficManager || !this.vehicle) return null;
    const myPos = this.vehicle.position;
    if (!myPos) return null;
    const myForward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const right = new THREE.Vector3(Math.cos(this.vehicle.rotation.y), 0, -Math.sin(this.vehicle.rotation.y));
    let closestVeh = null;
    let closestDist = Infinity;
    const maxCheckDist = 40;

    // Check other NPC vehicles
    const vehicles = this.trafficManager.vehicles || [];
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (!v || v === this.vehicle || !v.position) continue;
      const dx = v.position.x - myPos.x;
      const dz = v.position.z - myPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > maxCheckDist || dist >= closestDist) continue;

      const forwardDot = (dx * myForward.x + dz * myForward.z) / (dist || 1);
      if (forwardDot > 0.65) {
        const lateral = Math.abs(dx * right.x + dz * right.z);
        if (lateral < 3.2) {
          closestDist = dist;
          closestVeh = v;
        }
      }
    }

    // Check player vehicle
    const p = this.trafficManager.game?.playerVehicle || this.trafficManager.game?.player;
    if (p && p.position && p !== this.vehicle) {
      const dx = p.position.x - myPos.x;
      const dz = p.position.z - myPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= maxCheckDist && dist < closestDist) {
        const forwardDot = (dx * myForward.x + dz * myForward.z) / (dist || 1);
        if (forwardDot > 0.65) {
          const lateral = Math.abs(dx * right.x + dz * right.z);
          if (lateral < 3.2) {
            closestDist = dist;
            closestVeh = p;
          }
        }
      }
    }

    return closestVeh;
  }

  _getSignalAhead(signals) {
    if (!signals || !signals.length || !this.vehicle || !this.vehicle.position) return null;
    const myPos = this.vehicle.position;
    const myForward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    let nearestSignal = null;
    let nearestDist = Infinity;

    for (let i = 0; i < signals.length; i++) {
      const sig = signals[i];
      const pos = sig.pos || sig.position || sig.mesh?.position;
      if (!pos) continue;
      const dx = pos.x - myPos.x;
      const dz = pos.z - myPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 35 || dist >= nearestDist) continue;
      const forwardDot = (dx * myForward.x + dz * myForward.z) / (dist || 1);
      if (forwardDot > 0.5) {
        nearestDist = dist;
        nearestSignal = sig;
      }
    }
    return nearestSignal;
  }

  _distanceToSignal(signal) {
    if (!signal || !this.vehicle || !this.vehicle.position) return Infinity;
    const pos = signal.pos || signal.position || signal.mesh?.position;
    if (!pos) return Infinity;
    const dx = pos.x - this.vehicle.position.x;
    const dz = pos.z - this.vehicle.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  _pickInitialLane(edge) {
    const lanes = edge.lanes || 1;
    if (lanes <= 1) return 0;
    if (this.profile.laneDiscipline > 0.8) return 0;
    return Math.floor(Math.random() * lanes);
  }

  update(dt, playerVehicle, signals) {
    this.reactionTimer -= dt;
    this.laneChangeCooldown = Math.max(0, this.laneChangeCooldown - dt);

    switch (this.state) {
      case NPC_STATE.IDLE:
        this._updateIdle(dt);
        break;
      case NPC_STATE.FOLLOW_LANE:
        this._updateFollowLane(dt, playerVehicle, signals);
        break;
      case NPC_STATE.OVERTAKE:
        this._updateOvertake(dt, playerVehicle);
        break;
      case NPC_STATE.WAIT_SIGNAL:
        this._updateWaitSignal(dt, signals);
        break;
      case NPC_STATE.SIDEWALK_DETOUR:
        this._updateSidewalkDetour(dt);
        break;
      case NPC_STATE.PARK:
        this._updatePark(dt);
        break;
      case NPC_STATE.COMPLETE:
        this._updateComplete(dt);
        break;
      case NPC_STATE.CRASH:
        this._updateCrash(dt);
        break;
      case NPC_STATE.PULL_OVER:
        this._updatePullOver(dt);
        break;
      case NPC_STATE.EMERGENCY_BRAKE:
        this._updateEmergencyBrake(dt);
        break;
      case NPC_STATE.DISTRACTED:
        this._updateDistracted(dt);
        break;
      case NPC_STATE.ROAD_RAGE:
        this._updateRoadRage(dt);
        break;
    }

    this._applyPhysics(dt);
    this._checkTransitions(playerVehicle, signals, dt);
    this._checkEmergencyAvoidance(playerVehicle);
  }

  _updateIdle(dt) {
    if (this.route.length > 0) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this._pickNextTarget();
    }
  }

  _updateFollowLane(dt, playerVehicle, signals) {
    if (!this.currentEdge || !this.targetNode) {
      this._advanceRoute();
      return;
    }

    const aheadVehicle = this._getVehicleAhead();
    const signalAhead = this._getSignalAhead(signals);

    // 1. Red Signal Detection & Braking
    if (signalAhead && signalAhead.state === 'red') {
      const distToSignal = this._distanceToSignal(signalAhead);
      if (distToSignal < 24) {
        if (this.profile.signalCompliance < Math.random() && this.isRuleBreaker) {
          this.signalViolation = true;
          this.state = NPC_STATE.FOLLOW_LANE;
        } else {
          this.desiredSpeed = 0;
          if (distToSignal < 9) {
            this.state = NPC_STATE.WAIT_SIGNAL;
            this.waitTimer = 0;
            this.currentSpeed *= 0.75;
          }
          return;
        }
      }
    }

    // 2. Lead Vehicle Detection, Follow Distance & Safe Queueing
    if (aheadVehicle) {
      const dist = this.vehicle.position.distanceTo(aheadVehicle.position);
      const stopBuffer = 5.5;
      if (dist < stopBuffer) {
        // Complete stop behind the vehicle ahead
        this.desiredSpeed = 0;
        this.currentSpeed *= 0.75;
      } else if (dist < this.followDistance) {
        // Match lead vehicle speed with safe deceleration gradient
        const leadSpd = aheadVehicle.currentSpeed || aheadVehicle.speed || 0;
        const distRatio = Math.max(0, (dist - stopBuffer) / (this.followDistance - stopBuffer));
        this.desiredSpeed = Math.min(this._getTargetSpeed(), leadSpd * distRatio);

        // If stopped or crawling and road has multiple lanes, evaluate on-road overtake
        if (dist < this.followDistance * 0.65 && this.laneChangeCooldown <= 0 && this.profile.overtakeThreshold > 0.15) {
          this._attemptOvertake(aheadVehicle);
          return;
        }
      } else {
        this.desiredSpeed = this._getTargetSpeed();
      }
    } else {
      this.desiredSpeed = this._getTargetSpeed();
    }

    this._steerTowardsTarget(dt);
    this._maintainLane(dt);
  }

  _updateOvertake(dt, playerVehicle) {
    this.overtakeTimer += dt;

    if (this.overtakePhase === 0) {
      this._initiateOvertake();
      this.overtakePhase = 1;
    } else if (this.overtakePhase === 1) {
      this._executeOvertake(dt);
      if (this._overtakeComplete()) {
        this.overtakePhase = 2;
      }
    } else if (this.overtakePhase === 2) {
      this._returnToLane(dt);
      if (this._laneReturnComplete()) {
        this.state = NPC_STATE.FOLLOW_LANE;
        this.overtakeTimer = 0;
        this.overtakeTarget = null;
        this.overtakePhase = 0;
        this.laneChangeCooldown = 4 + Math.random() * 4;
      }
    }

    if (this.overtakeTimer > 10) {
      this._abortOvertake();
    }
  }

  _updateWaitSignal(dt, signals) {
    this.waitTimer += dt;
    this.desiredSpeed = 0;
    const signal = this._getSignalAhead(signals);
    if (signal && signal.state === 'green') {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.waitTimer = 0;
      this.signalViolation = false;
    } else if (this.waitTimer > 30 && this.profile.patience < 0.3) {
      if (Math.random() < 0.02 * dt) {
        this.signalViolation = true;
        this.state = NPC_STATE.FOLLOW_LANE;
      }
    }
  }

  _updateSidewalkDetour(dt) {
    // Sidewalk detours disabled - return to road lane immediately
    this.state = NPC_STATE.FOLLOW_LANE;
    this.sidewalkTimer = 0;
  }

  _updatePark(dt) {
    this.desiredSpeed = 0;
    this.currentSpeed *= 0.8;
  }

  _updateComplete(dt) {
    this.desiredSpeed = 0;
    this._respawn();
  }

  _updateCrash(dt) {
    this.desiredSpeed = 0;
    this.currentSpeed = 0;
    if (!this.crashTimer) this.crashTimer = 0;
    this.crashTimer += dt;
    if (this.crashTimer > 6) {
      this.crashTimer = 0;
      this._respawn();
    }
  }

  _checkTransitions(playerVehicle, signals, dt) {
    if (playerVehicle) {
      this._reactToPlayer(playerVehicle);
    }
    if (this.state === NPC_STATE.FOLLOW_LANE && this._isAmbulanceNearby()) {
      this.state = NPC_STATE.PULL_OVER;
    }
  }

  _steerTowardsTarget(dt) {
    if (!this.targetNode) return;
    const targetPos = this.targetNode.position.clone();
    targetPos.y = this.vehicle.position.y;
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.vehicle.position);
    toTarget.y = 0;
    const dist = toTarget.length();
    if (dist < 5.0) {
      this._advanceRoute();
      return;
    }

    // Look ahead along active lane spline for smooth arc turning
    let lookTarget = targetPos;
    if (this.currentEdge) {
      const progress = Math.min(1.0, (this.vehicle.routeProgress || 0) + 0.12);
      const lanePoint = this.currentEdge.getLaneCenter(this.currentLane, progress);
      if (lanePoint) lookTarget = lanePoint;
    }

    const toWaypoint = new THREE.Vector3().subVectors(lookTarget, this.vehicle.position);
    toWaypoint.y = 0;
    const desiredHeading = Math.atan2(toWaypoint.x, toWaypoint.z);
    let diff = desiredHeading - this.vehicle.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const maxTurn = (this.vehicle.stats?.turn || 0.05) * dt * 60 * 1.5;
    const clampedAngle = THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);
    this.vehicle.rotation.y += clampedAngle;
  }

  _maintainLane(dt) {
    if (!this.currentEdge) return;
    const progress = Math.max(0, Math.min(1, this.vehicle.routeProgress || 0));
    const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, progress);
    if (!laneCenter) return;

    // Smooth PID lateral convergence towards lane center
    const toCenter = new THREE.Vector3().subVectors(laneCenter, this.vehicle.position);
    toCenter.y = 0;
    const lateralOffset = toCenter.length();
    if (lateralOffset > 0.04) {
      const correctiveSpeed = Math.min(lateralOffset * 4.0, 3.5);
      const dirNudge = toCenter.normalize();
      this.vehicle.position.x += dirNudge.x * correctiveSpeed * dt;
      this.vehicle.position.z += dirNudge.z * correctiveSpeed * dt;
    }

    // Strict Road Surface Clamping: Vehicle never exceeds asphalt road width
    const roadWidth = this.currentEdge.width || 14;
    const roadHalfW = roadWidth / 2 - 1.2;
    if (this.currentEdge.type === 'v' || Math.abs(this.currentEdge.direction?.z || 0) > 0.7) {
      const centerX = (this.currentEdge.startNode.position.x + this.currentEdge.endNode.position.x) / 2;
      this.vehicle.position.x = THREE.MathUtils.clamp(this.vehicle.position.x, centerX - roadHalfW, centerX + roadHalfW);
    } else {
      const centerZ = (this.currentEdge.startNode.position.z + this.currentEdge.endNode.position.z) / 2;
      this.vehicle.position.z = THREE.MathUtils.clamp(this.vehicle.position.z, centerZ - roadHalfW, centerZ + roadHalfW);
    }
  }

  _attemptOvertake(vehicle) {
    if (!this.currentEdge || this.currentEdge.lanes < 2) return;
    const currentLane = this.currentLane;
    const targetLane = currentLane === 0 ? 1 : 0;
    if (this._isLaneClear(targetLane, vehicle)) {
      this.state = NPC_STATE.OVERTAKE;
      this.overtakeTarget = vehicle;
      this.overtakeTimer = 0;
      this.overtakePhase = 0;
    }
  }

  _isLaneClear(lane, ignoreVehicle) {
    if (!this.currentEdge) return false;
    const vehicles = this.trafficManager.getVehiclesOnEdge(this.currentEdge.id);
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode);
    return !vehicles.some(v => {
      if (v === this.vehicle || v === ignoreVehicle) return false;
      if (v.currentLane !== lane) return false;
      const toV = new THREE.Vector3().subVectors(v.position, this.vehicle.position);
      return toV.dot(forward) > -8 && toV.dot(forward) < 32;
    });
  }

  _initiateOvertake() {
    this.currentLane = this.currentLane === 0 ? 1 : 0;
  }

  _executeOvertake(dt) {
    this.desiredSpeed = this._getTargetSpeed() * 1.25;
    this._maintainLane(dt);
  }

  _overtakeComplete() {
    if (!this.overtakeTarget) return true;
    const toTarget = new THREE.Vector3().subVectors(this.overtakeTarget.position, this.vehicle.position);
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    return toTarget.dot(forward) < -6;
  }

  _returnToLane(dt) {
    this.desiredSpeed = this._getTargetSpeed();
    this._maintainLane(dt);
  }

  _laneReturnComplete() {
    if (!this.currentEdge) return true;
    const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, this.vehicle.routeProgress);
    return this.vehicle.position.distanceTo(laneCenter) < 1;
  }

  _abortOvertake() {
    this.currentLane = this.currentLane === 0 ? 1 : 0;
    this.state = NPC_STATE.FOLLOW_LANE;
    this.overtakeTimer = 0;
    this.overtakeTarget = null;
    this.overtakePhase = 0;
    this.laneChangeCooldown = 5;
  }

  _findParkingSpot() {
    const spots = this.trafficManager.getAvailableParkingSpots(this.vehicle.position, 50);
    if (spots.length > 0) {
      this.parkingSpot = spots[0];
    } else {
      this.state = NPC_STATE.COMPLETE;
    }
  }

  _steerTowardsSpot(dt) {
    if (!this.parkingSpot) return;
    const toSpot = new THREE.Vector3().subVectors(this.parkingSpot.position, this.vehicle.position);
    toSpot.y = 0;
    const desiredDir = toSpot.normalize();
    const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
    const maxTurn = this.vehicle.stats.turn * dt * 60 * 0.5;
    this.vehicle.rotation.y += THREE.MathUtils.clamp(angle, -maxTurn, maxTurn);
  }

  _alignForParking(dt) {
    if (!this.parkingSpot) return;
    const targetRot = this.parkingSpot.rotation;
    const diff = targetRot - this.vehicle.rotation.y;
    const maxTurn = this.vehicle.stats.turn * dt * 60 * 0.3;
    this.vehicle.rotation.y += THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);
  }

  _isNearPlayer(player) {
    return this.vehicle.position.distanceTo(player.position) < 30;
  }

  _honk() {
    if (this.trafficManager.audio && this.vehicle.hornSound) {
      this.trafficManager.audio.playHorn(this.vehicle.hornSound, this.vehicle.position);
    }
  }

  _flashLights() {
    this.vehicle.flashHighBeams = true;
    setTimeout(() => { this.vehicle.flashHighBeams = false; }, 200);
  }


  _updatePullOver(dt) {
    this.pullOverTimer = (this.pullOverTimer || 0) + dt;

    if (this.currentEdge) {
      const curbPos = this.currentEdge.getLaneCenter(0, this.vehicle.routeProgress);
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y))
      );
      const targetPos = curbPos.clone().addScaledVector(right, -3);
      const toTarget = new THREE.Vector3().subVectors(targetPos, this.vehicle.position);
      toTarget.y = 0;
      if (toTarget.length() > 0.5) {
        const desiredDir = toTarget.normalize();
        const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
        const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
        this.vehicle.rotation.y += THREE.MathUtils.clamp(angle, -this.vehicle.stats.turn * dt * 60 * 0.5, this.vehicle.stats.turn * dt * 60 * 0.5);
      }
    }
    this.desiredSpeed = 0;
    this.currentSpeed *= 0.92;

    if (this.pullOverTimer > 8 || !this._isAmbulanceNearby()) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.pullOverTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }


  _updateDistracted(dt) {
    this.distractTimer += dt;

    this.vehicle.rotation.y += (Math.random() - 0.5) * 0.003;

    this.desiredSpeed *= 0.5;
    this.currentSpeed *= 0.97;

    if (this.distractTimer > 2 + Math.random() * 3) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.distractTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }


  _updateRoadRage(dt) {
    this.rageTimer += dt;

    this.desiredSpeed = this._getTargetSpeed() * 1.2;

    if (this.rageTimer % 1.5 < dt) this._honk();

    if (this.rageTimer % 2 < dt) this._flashLights();

    this.followDistance = 5;

    if (this.rageTimer > 6) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.rageTimer = 0;
      this.rageLevel = 0;
      this.followDistance = 15 + Math.random() * 10;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }

  _isAmbulanceNearby() {
    if (!this.trafficManager || !this.trafficManager.vehicles) return false;
    const myPos = this.vehicle.position;
    for (const v of this.trafficManager.vehicles) {
      if (v === this.vehicle) continue;
      if (v.userData && v.userData.isAmb && v.position.distanceTo(myPos) < 80) {

        const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
        const toAmb = new THREE.Vector3().subVectors(v.position, myPos);
        if (toAmb.dot(forward) < 0) return true;
      }
    }
    return false;
  }


  _updateEmergencyBrake(dt) {
    this.emergencyBrakeTimer = (this.emergencyBrakeTimer || 0) + dt;
    this.currentSpeed *= 0.85;
    this.desiredSpeed = 0;
    if (this.vehicle.brakeLights) this.vehicle.brakeLights.intensity = 3;

    if (this.currentSpeed < 0.5 || this.emergencyBrakeTimer > 3) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.emergencyBrakeTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }


  _checkEmergencyAvoidance(playerVehicle) {
    if (this.state === NPC_STATE.CRASH || this.state === NPC_STATE.EMERGENCY_BRAKE) return;
    if (this.currentSpeed < 3) return;
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const myPos = this.vehicle.position;
    const checkRadius = 12;
    if (playerVehicle) {
      const toPlayer = new THREE.Vector3().subVectors(playerVehicle.position, myPos);
      const dist = toPlayer.length();
      if (dist < checkRadius) {
        const proj = toPlayer.dot(forward);
        const lateralOffset = Math.abs(toPlayer.x * forward.z - toPlayer.z * forward.x);
        if (proj > 0 && proj < 10 && dist < 8 && lateralOffset < 2.5) {
          this.state = NPC_STATE.EMERGENCY_BRAKE;
          this.emergencyBrakeTimer = 0;
          return;
        }
      }
    }

    if (this.trafficManager && this.trafficManager.vehicles) {
      for (const v of this.trafficManager.vehicles) {
        if (v === this.vehicle) continue;
        const toV = new THREE.Vector3().subVectors(v.position, myPos);
        const dist = toV.length();
        if (dist > checkRadius) continue;
        const proj = toV.dot(forward);
        if (proj > 0 && proj < 8 && dist < 6 && Math.abs(toV.x * forward.z - toV.z * forward.x) < 2) {
          this.state = NPC_STATE.EMERGENCY_BRAKE;
          this.emergencyBrakeTimer = 0;
          this._honk();
          return;
        }
      }
    }
  }


  _reactToPlayer(player) {
    const dist = this.vehicle.position.distanceTo(player.position);
    const aggression = this.profile.aggression;


    if (aggression > 0.5 && dist < 15 && Math.random() < 0.02) {
      this._honk();
    }


    if (dist < 12 && this.currentSpeed > 2) {
      const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
      const toPlayer = new THREE.Vector3().subVectors(player.position, this.vehicle.position);
      const proj = toPlayer.dot(forward);
      if (proj > 0 && proj < 10) {
        this.desiredSpeed = Math.min(this.desiredSpeed, this.currentSpeed * 0.5);
      }
    }


    if (aggression > 0.6 && dist < 20 && this.currentSpeed > 3) {
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y))
      );
      const toPlayer = new THREE.Vector3().subVectors(player.position, this.vehicle.position);
      const lateral = right.dot(toPlayer);
      if (Math.abs(lateral) < 3 && Math.random() < 0.005) {
        this.vehicle.rotation.y += (lateral > 0 ? -1 : 1) * 0.02;
      }
    }


    if (aggression < 0.2 && dist < 25 && Math.random() < 0.01) {
      this.desiredSpeed *= 0.8;
    }



    if (this.profileKey === 'teen' && this.state === NPC_STATE.FOLLOW_LANE) {
      if (Math.random() < this.distractChance * 2) {
        this.state = NPC_STATE.DISTRACTED;
        this.distractTimer = 0;
      }
    }

    if (this.profileKey === 'elderly' && this.reactionTimer <= 0) {
      this.reactionTimer = 0.3 + Math.random() * 0.6;
    }

    if (this.profileKey === 'delivery' && this.routeIndex >= this.route.length - 1) {
      if (this.state === NPC_STATE.FOLLOW_LANE && Math.random() < 0.005) {
        this.desiredSpeed = 0;
        this.currentSpeed *= 0.9;
        this._honk();
      }
    }

    if (this.profileKey === 'tourist' && this.state === NPC_STATE.FOLLOW_LANE) {
      if (Math.random() < 0.002) {
        this.vehicle.rotation.y += (Math.random() - 0.5) * 0.08;
      }
    }
  }


  _getTargetSpeed() {
    const baseSpeed = this.currentEdge ? this.currentEdge.speedLimit / 3.6 : 10;
    const variance = (Math.random() - 0.5) * 2 * this.profile.speedVariance * baseSpeed;
    let speed = Math.max(2, baseSpeed + variance);

    const tm = this.trafficManager;
    if (tm && tm.game) {
      const cfg = tm.game.mapCfg;
      if (cfg) {
        if (cfg.hasRain || cfg.hasPuddles) speed *= (0.65 + Math.random() * 0.15);
        if (cfg.isNight) speed *= 0.85;
      }
    }
    return speed;
  }

  _applyPhysics(dt) {
    const accel = this.vehicle.stats.accel * dt * 60;
    const fric = this.vehicle.stats.fric;
    const maxSpd = this.desiredSpeed;

    if (this.currentSpeed < maxSpd) {
      this.currentSpeed = Math.min(maxSpd, this.currentSpeed + accel);
    } else {
      this.currentSpeed = Math.max(maxSpd, this.currentSpeed * fric);
    }

    const forward = new THREE.Vector3(
      Math.sin(this.vehicle.rotation.y),
      0,
      Math.cos(this.vehicle.rotation.y)
    );
    this.vehicle.velocity.copy(forward).multiplyScalar(this.currentSpeed);
    this.vehicle.position.addScaledVector(this.vehicle.velocity, dt);
    this.vehicle.routeProgress += this.currentSpeed * dt / (this.currentEdge?.length || 100);
  }

  _respawn() {
    this.vehicle.health = 100;
    this.vehicle.velocity.set(0, 0, 0);
    this.currentSpeed = 0;
    this.state = NPC_STATE.IDLE;
    this.routeIndex = 0;
    this.crashTimer = 0;
    if (this.trafficManager && this.trafficManager._despawnVehicle) {
      this.trafficManager._despawnVehicle(this.vehicle);
    }
  }

  getDebugInfo() {
    return {
      state: this.state,
      profile: this.profileKey,
      speed: this.currentSpeed.toFixed(1),
      targetSpeed: this.desiredSpeed.toFixed(1),
      lane: this.currentLane,
      routeProgress: this.routeIndex + '/' + this.route.length,
      violations: this.signalViolation ? 'Signal Jump' : 'None'
    };
  }
}


const PED_STATE = {
  WAITING: 'WAITING',
  CROSSING: 'CROSSING',
  WALKING: 'WALKING',
  JAYWALKING: 'JAYWALKING',
  FLEEING: 'FLEEING',
  FROZEN: 'FROZEN'
};

const PED_PROFILES = {
  normal: { speed: 2.5, jaywalkChance: 0.15, waitPatience: 0.8, groupBehavior: 0.3 },
  rusher: { speed: 4.0, jaywalkChance: 0.5, waitPatience: 0.2, groupBehavior: 0.1 },
  cautious: { speed: 1.8, jaywalkChance: 0.02, waitPatience: 0.95, groupBehavior: 0.5 },
  child: { speed: 2.0, jaywalkChance: 0.3, waitPatience: 0.4, groupBehavior: 0.7 },
  elderly_ped: { speed: 1.2, jaywalkChance: 0.05, waitPatience: 0.9, groupBehavior: 0.4 },
  phone_user: { speed: 1.5, jaywalkChance: 0.35, waitPatience: 0.3, groupBehavior: 0.1 }
};

const PED_PROFILE_KEYS = Object.keys(PED_PROFILES);

function pickRandomPedProfile() {
  return PED_PROFILE_KEYS[Math.floor(Math.random() * PED_PROFILE_KEYS.length)];
}

class PedestrianAI {
  constructor(pedMesh, trafficManager) {
    this.ped = pedMesh;
    this.tm = trafficManager;
    this.profileKey = pedMesh.profileKey || pickRandomPedProfile();
    this.profile = PED_PROFILES[this.profileKey];
    this.state = PED_STATE.WALKING;
    this.target = null;
    this.waitTimer = 0;
    this.crossingTimer = 0;
    this.fleeTimer = 0;
    this.stuckTimer = 0;
    this.facing = Math.random() * Math.PI * 2;
    this.lookTimer = 0;
    this.onCrosswalk = false;
  }

  update(dt, npcs, playerVehicle) {
    this.lookTimer += dt;

    switch (this.state) {
      case PED_STATE.WALKING:
        this._updateWalking(dt);
        break;
      case PED_STATE.WAITING:
        this._updateWaiting(dt, npcs);
        break;
      case PED_STATE.CROSSING:
        this._updateCrossing(dt, npcs, playerVehicle);
        break;
      case PED_STATE.JAYWALKING:
        this._updateJaywalking(dt, npcs, playerVehicle);
        break;
      case PED_STATE.FLEEING:
        this._updateFleeing(dt);
        break;
      case PED_STATE.FROZEN:
        break;
    }

    this._checkVehicleProximity(playerVehicle, npcs);
    this._keepOnGround();
  }

  _updateWalking(dt) {
    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5) {
        this.state = PED_STATE.WAITING;
        this.waitTimer = 0;
        this.target = null;
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * this.profile.speed * dt;
      this.ped.position.z += dir.z * this.profile.speed * dt;
      this.facing = Math.atan2(dir.x, dir.z);
      this.ped.rotation.y = this.facing;
    } else {

      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 15;
      this.target = new THREE.Vector3(
        this.ped.position.x + Math.sin(angle) * dist,
        0,
        this.ped.position.z + Math.cos(angle) * dist
      );
    }
  }

  _updateWaiting(dt, npcs) {
    this.waitTimer += dt;

    if (this.lookTimer > 1.5) {
      this.lookTimer = 0;
      this.facing += (Math.random() - 0.5) * 1.5;
      this.ped.rotation.y = this.facing;
    }

    if (!this._waitThreshold) this._waitThreshold = 2 + Math.random() * 4;
    if (this.waitTimer > this._waitThreshold) {
      if (this.profile.jaywalkChance > Math.random()) {
        this.state = PED_STATE.JAYWALKING;
        this.crossingTimer = 0;
        this._waitThreshold = null;
        this._pickCrossingTarget();
      } else {

        if (this._isRoadClear(npcs)) {
          this.state = PED_STATE.CROSSING;
          this.crossingTimer = 0;
          this._waitThreshold = null;
          this._pickCrossingTarget();
        }
      }
    }
  }

  _updateCrossing(dt, npcs, playerVehicle) {
    this.crossingTimer += dt;

    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.crossingTimer > 10) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * this.profile.speed * dt;
      this.ped.position.z += dir.z * this.profile.speed * dt;
      this.facing = Math.atan2(dir.x, dir.z);
      this.ped.rotation.y = this.facing;
    }
  }

  _updateJaywalking(dt, npcs, playerVehicle) {
    this.crossingTimer += dt;

    const jaywalkSpeed = this.profile.speed * 1.3;
    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.crossingTimer > 8) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * jaywalkSpeed * dt;
      this.ped.position.z += dir.z * jaywalkSpeed * dt;
      this.facing = Math.atan2(dir.x, dir.z);
      this.ped.rotation.y = this.facing;
    }
  }

  _updateFleeing(dt) {
    this.fleeTimer += dt;

    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.fleeTimer > 3) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * 5 * dt;
      this.ped.position.z += dir.z * 5 * dt;
      this.facing = Math.atan2(dir.x, dir.z);
      this.ped.rotation.y = this.facing;
    }
  }

  _checkVehicleProximity(playerVehicle, npcs) {
    if (this.state === PED_STATE.FLEEING || this.state === PED_STATE.FROZEN) return;
    const myPos = this.ped.position;

    if (playerVehicle) {
      const dist = myPos.distanceTo(playerVehicle.position);
      if (dist < 8) {
        this.state = PED_STATE.FLEEING;
        this.fleeTimer = 0;

        const away = new THREE.Vector3().subVectors(myPos, playerVehicle.position).normalize();
        away.y = 0;
        this.target = myPos.clone().addScaledVector(away, 10);
        return;
      }
    }

    if (npcs) {
      for (const npc of npcs) {
        if (!npc.position) continue;
        const dist = myPos.distanceTo(npc.position);
        if (dist < 6) {
          this.state = PED_STATE.FLEEING;
          this.fleeTimer = 0;
          const away = new THREE.Vector3().subVectors(myPos, npc.position).normalize();
          away.y = 0;
          this.target = myPos.clone().addScaledVector(away, 8);
          return;
        }
      }
    }
  }

  _isRoadClear(npcs) {

    if (!npcs) return true;
    const myPos = this.ped.position;
    for (const npc of npcs) {
      if (!npc.position) continue;
      const dist = myPos.distanceTo(npc.position);
      if (dist < 10) return false;
    }
    return true;
  }

  _pickCrossingTarget() {

    const crossAngle = this.facing + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const crossDist = 12 + Math.random() * 8;
    this.target = new THREE.Vector3(
      this.ped.position.x + Math.sin(crossAngle) * crossDist,
      0,
      this.ped.position.z + Math.cos(crossAngle) * crossDist
    );
  }

  _keepOnGround() {

    if (!this._groundY) this._groundY = this.ped.position.y > 0.1 ? 0.5 : 0;
    this.ped.position.y = this._groundY;
  }
}

window.NPC_STATE = NPC_STATE;
window.NPC_PROFILES = NPC_PROFILES;
window.NPCAI = NPCAI;
window.pickRandomProfile = pickRandomProfile;
window.PED_STATE = PED_STATE;
window.PED_PROFILES = PED_PROFILES;
window.PedestrianAI = PedestrianAI;
window.pickRandomPedProfile = pickRandomPedProfile;