const NPC_STATE = {
  IDLE: 'IDLE',
  FOLLOW_LANE: 'FOLLOW_LANE',
  OVERTAKE: 'OVERTAKE',
  WAIT_SIGNAL: 'WAIT_SIGNAL',
  SIDEWALK_DETOUR: 'SIDEWALK_DETOUR',
  PARK: 'PARK',
  COMPLETE: 'COMPLETE',
  CRASH: 'CRASH'
};

const NPC_PROFILES = {
  normal: {
    name: 'Normal Driver',
    weight: 55,
    aggression: 0.3,
    patience: 0.7,
    signalCompliance: 0.95,
    laneDiscipline: 0.9,
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
    laneDiscipline: 0.5,
    speedVariance: 0.35,
    overtakeThreshold: 0.3,
    sidewalkProbability: 0.1,
    parkingSkill: 0.5
  },
  reckless_bike: {
    name: 'Reckless Biker',
    weight: 10,
    aggression: 0.9,
    patience: 0.1,
    signalCompliance: 0.3,
    laneDiscipline: 0.2,
    speedVariance: 0.5,
    overtakeThreshold: 0.15,
    sidewalkProbability: 0.35,
    parkingSkill: 0.2
  },
  rulebreaker: {
    name: 'Rule Breaker',
    weight: 12,
    aggression: 0.6,
    patience: 0.4,
    signalCompliance: 0.25,
    laneDiscipline: 0.3,
    speedVariance: 0.4,
    overtakeThreshold: 0.25,
    sidewalkProbability: 0.25,
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
    this.profileKey = vehicle.profileKey || pickRandomProfile();
    this.profile = NPC_PROFILES[this.profileKey];
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
    this.behaviorModifiers = {
      hornFrequency: this.profile.aggression * 0.5,
      lightFlashFrequency: this.profile.aggression * 0.3,
      tailgateDistance: (1 - this.profile.patience) * 10 + 5
    };
  }

  setRoute(route) {
    this.route = route || [];
    this.routeIndex = 0;
    this.state = NPC_STATE.FOLLOW_LANE;
    this._pickNextTarget();
  }

  _pickNextTarget() {
    if (this.routeIndex < this.route.length) {
      this.targetNode = this.route[this.routeIndex];
      const edge = this.roadGraph.getEdgeTo(this.vehicle.currentNode, this.targetNode);
      if (edge) {
        this.currentEdge = edge;
        this.currentLane = this._pickInitialLane(edge);
      }
    } else {
      this.state = NPC_STATE.COMPLETE;
    }
  }

  _pickInitialLane(edge) {
    const lanes = edge.lanes;
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
    }

    this._applyPhysics(dt);
    this._checkTransitions(playerVehicle, signals);
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

    if (signalAhead && signalAhead.state === 'red') {
      const distToSignal = this._distanceToSignal(signalAhead);
      if (distToSignal < 25) {
        if (this.profile.signalCompliance < Math.random()) {
          this.signalViolation = true;
          this.state = NPC_STATE.FOLLOW_LANE;
        } else {
          this.state = NPC_STATE.WAIT_SIGNAL;
          this.waitTimer = 0;
        }
        return;
      }
    }

    if (aheadVehicle) {
      const dist = this.vehicle.position.distanceTo(aheadVehicle.position);
      if (dist < this.followDistance) {
        this.desiredSpeed = Math.min(this.desiredSpeed, aheadVehicle.speed * 0.9);
        if (dist < this.followDistance * 0.5 && this.profile.overtakeThreshold > Math.random() && this.laneChangeCooldown <= 0) {
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
        this.laneChangeCooldown = 3 + Math.random() * 5;
      }
    }

    if (this.overtakeTimer > 10) {
      this._abortOvertake();
    }
  }

  _updateWaitSignal(dt, signals) {
    this.waitTimer += dt;
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
    this.sidewalkTimer += dt;
    this.desiredSpeed = this._getTargetSpeed() * 0.4;
    this._steerTowardsTarget(dt);

    if (this.sidewalkTimer > 5 + Math.random() * 10) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.sidewalkTimer = 0;
    }
  }

  _updatePark(dt) {
    if (!this.parkingSpot) {
      this._findParkingSpot();
      return;
    }

    const dist = this.vehicle.position.distanceTo(this.parkingSpot.position);

    switch (this.parkingPhase) {
      case 0:
        this.desiredSpeed = this._getTargetSpeed() * 0.5;
        this._steerTowardsSpot(dt);
        if (dist < 8) this.parkingPhase = 1;
        break;
      case 1:
        this.desiredSpeed = this._getTargetSpeed() * 0.2;
        this._alignForParking(dt);
        if (dist < 3) this.parkingPhase = 2;
        break;
      case 2:
        this.desiredSpeed = 0;
        this.vehicle.velocity.set(0, 0, 0);
        this.parkingPhase = 3;
        break;
      case 3:
        this.state = NPC_STATE.COMPLETE;
        break;
    }
  }

  _updateComplete(dt) {
    this.desiredSpeed = 0;
    this.vehicle.velocity.lerp(new THREE.Vector3(0, 0, 0), 0.1);
  }

  _updateCrash(dt) {
    this.crashTimer += dt;
    this.vehicle.velocity.multiplyScalar(0.95);
    if (this.crashTimer > 5) {
      this._respawn();
    }
  }

  _checkTransitions(playerVehicle, signals) {
    if (this.state === NPC_STATE.CRASH || this.state === NPC_STATE.COMPLETE) return;

    if (this.vehicle.health <= 0) {
      this.state = NPC_STATE.CRASH;
      this.crashTimer = 0;
      return;
    }

    if (this.routeIndex >= this.route.length) {
      if (this.profile.parkingSkill > 0.7 && Math.random() < 0.1) {
        this.state = NPC_STATE.PARK;
        this.parkingPhase = 0;
      } else {
        this.state = NPC_STATE.COMPLETE;
      }
      return;
    }

    const signal = this._getSignalAhead(signals);
    if (signal && signal.state === 'red') {
      const dist = this._distanceToSignal(signal);
      if (dist < 30 && this.state !== NPC_STATE.WAIT_SIGNAL) {
        if (this.profile.signalCompliance >= Math.random()) {
          this.state = NPC_STATE.WAIT_SIGNAL;
        }
      }
    }

    if (this.isRuleBreaker && this.profile.sidewalkProbability > Math.random()) {
      if (this.state === NPC_STATE.FOLLOW_LANE && Math.random() < 0.001 * dt) {
        this.state = NPC_STATE.SIDEWALK_DETOUR;
        this.sidewalkTimer = 0;
      }
    }

    if (playerVehicle && this._isNearPlayer(playerVehicle)) {
      this._reactToPlayer(playerVehicle);
    }
  }

  _advanceRoute() {
    this.routeIndex++;
    this._pickNextTarget();
  }

  _getVehicleAhead() {
    if (!this.currentEdge) return null;
    const vehicles = this.trafficManager.getVehiclesOnEdge(this.currentEdge.id);
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode);
    let closest = null, minDist = Infinity;
    vehicles.forEach(v => {
      if (v === this.vehicle) return;
      const toV = new THREE.Vector3().subVectors(v.position, this.vehicle.position);
      const proj = toV.dot(forward);
      if (proj > 0 && proj < minDist) {
        minDist = proj;
        closest = v;
      }
    });
    return closest;
  }

  _getSignalAhead(signals) {
    if (!this.currentEdge) return null;
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode);
    let closest = null, minDist = Infinity;
    signals.forEach(s => {
      const toS = new THREE.Vector3().subVectors(s.position, this.vehicle.position);
      const proj = toS.dot(forward);
      if (proj > 0 && proj < 100 && proj < minDist) {
        minDist = proj;
        closest = s;
      }
    });
    return closest;
  }

  _distanceToSignal(signal) {
    return this.vehicle.position.distanceTo(signal.position);
  }

  _getTargetSpeed() {
    const baseSpeed = this.currentEdge ? this.currentEdge.speedLimit / 3.6 : 10;
    const variance = (Math.random() - 0.5) * 2 * this.profile.speedVariance * baseSpeed;
    return Math.max(2, baseSpeed + variance);
  }

  _steerTowardsTarget(dt) {
    if (!this.targetNode) return;
    const targetPos = this.targetNode.position.clone();
    targetPos.y = this.vehicle.position.y;
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.vehicle.position);
    const dist = toTarget.length();
    if (dist < 5) {
      this._advanceRoute();
      return;
    }
    const desiredDir = toTarget.normalize();
    const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
    const maxTurn = this.vehicle.stats.turn * dt * 60;
    const clampedAngle = THREE.MathUtils.clamp(angle, -maxTurn, maxTurn);
    this.vehicle.rotation.y += clampedAngle;
  }

  _maintainLane(dt) {
    if (!this.currentEdge) return;
    const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, this.vehicle.routeProgress);
    const toCenter = new THREE.Vector3().subVectors(laneCenter, this.vehicle.position);
    toCenter.y = 0;
    const offset = toCenter.length();
    if (offset > 1.5) {
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y))
      );
      const correction = right.dot(toCenter.normalize()) * dt * 2;
      this.vehicle.rotation.y += correction;
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
      return toV.dot(forward) > -5 && toV.dot(forward) < 30;
    });
  }

  _initiateOvertake() {
    this.currentLane = this.currentLane === 0 ? 1 : 0;
  }

  _executeOvertake(dt) {
    this.desiredSpeed = this._getTargetSpeed() * 1.3;
    this._maintainLane(dt);
  }

  _overtakeComplete() {
    if (!this.overtakeTarget) return true;
    const toTarget = new THREE.Vector3().subVectors(this.overtakeTarget.position, this.vehicle.position);
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    return toTarget.dot(forward) < -5;
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

  _reactToPlayer(player) {
    if (this.profile.aggression > 0.7 && Math.random() < 0.01) {
      this._honk();
    }
    if (this.profile.aggression > 0.5 && Math.random() < 0.005) {
      this._flashLights();
    }
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
    this.vehicle.position.set(0, 0.5, 0);
    this.vehicle.velocity.set(0, 0, 0);
    this.currentSpeed = 0;
    this.state = NPC_STATE.IDLE;
    this.routeIndex = 0;
    this.crashTimer = 0;
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

window.NPC_STATE = NPC_STATE;
window.NPC_PROFILES = NPC_PROFILES;
window.NPCAI = NPCAI;
window.pickRandomProfile = pickRandomProfile;