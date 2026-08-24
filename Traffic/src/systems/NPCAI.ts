// @ts-nocheck
/**
 * NPCAI — migrated from npc-ai.js
 * Per-agent state machines and driver personalities + PedestrianAI
 */

import * as THREE from 'three';
import { RoadGraph, RoadNode, RoadEdge } from './RoadGraph';

export const NPC_STATE = {
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

export interface NPCProfile {
  name: string;
  weight: number;
  aggression: number;
  patience: number;
  signalCompliance: number;
  laneDiscipline: number;
  speedVariance: number;
  overtakeThreshold: number;
  sidewalkProbability: number;
  parkingSkill: number;
}

export const NPC_PROFILES: Record<string, NPCProfile> = {
  normal: { name: 'Normal Driver', weight: 55, aggression: 0.3, patience: 0.7, signalCompliance: 0.95, laneDiscipline: 0.9, speedVariance: 0.15, overtakeThreshold: 0.6, sidewalkProbability: 0.0, parkingSkill: 0.8 },
  aggressive: { name: 'Aggressive Driver', weight: 15, aggression: 0.8, patience: 0.3, signalCompliance: 0.6, laneDiscipline: 0.5, speedVariance: 0.35, overtakeThreshold: 0.3, sidewalkProbability: 0.1, parkingSkill: 0.5 },
  reckless_bike: { name: 'Reckless Biker', weight: 10, aggression: 0.9, patience: 0.1, signalCompliance: 0.3, laneDiscipline: 0.2, speedVariance: 0.5, overtakeThreshold: 0.15, sidewalkProbability: 0.35, parkingSkill: 0.2 },
  rulebreaker: { name: 'Rule Breaker', weight: 12, aggression: 0.6, patience: 0.4, signalCompliance: 0.25, laneDiscipline: 0.3, speedVariance: 0.4, overtakeThreshold: 0.25, sidewalkProbability: 0.25, parkingSkill: 0.35 },
  cautious: { name: 'Cautious Driver', weight: 8, aggression: 0.1, patience: 0.9, signalCompliance: 0.99, laneDiscipline: 0.98, speedVariance: 0.08, overtakeThreshold: 0.85, sidewalkProbability: 0.0, parkingSkill: 0.95 },
  teen: { name: 'Teen Driver', weight: 6, aggression: 0.7, patience: 0.2, signalCompliance: 0.4, laneDiscipline: 0.35, speedVariance: 0.45, overtakeThreshold: 0.2, sidewalkProbability: 0.15, parkingSkill: 0.3 },
  elderly: { name: 'Elderly Driver', weight: 5, aggression: 0.05, patience: 0.95, signalCompliance: 0.98, laneDiscipline: 0.85, speedVariance: 0.1, overtakeThreshold: 0.95, sidewalkProbability: 0.0, parkingSkill: 0.7 },
  delivery: { name: 'Delivery Driver', weight: 6, aggression: 0.75, patience: 0.15, signalCompliance: 0.35, laneDiscipline: 0.3, speedVariance: 0.3, overtakeThreshold: 0.15, sidewalkProbability: 0.2, parkingSkill: 0.4 },
  tourist: { name: 'Tourist Driver', weight: 4, aggression: 0.2, patience: 0.6, signalCompliance: 0.85, laneDiscipline: 0.5, speedVariance: 0.2, overtakeThreshold: 0.7, sidewalkProbability: 0.0, parkingSkill: 0.3 }
};

const PROFILE_KEYS = Object.keys(NPC_PROFILES);
const PROFILE_WEIGHTS = PROFILE_KEYS.map(k => NPC_PROFILES[k].weight);
const TOTAL_WEIGHT = PROFILE_WEIGHTS.reduce((a, b) => a + b, 0);

export function pickRandomProfile(): string {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < PROFILE_KEYS.length; i++) {
    r -= PROFILE_WEIGHTS[i];
    if (r <= 0) return PROFILE_KEYS[i];
  }
  return 'normal';
}

export class NPCAI {
  vehicle: any;
  roadGraph: RoadGraph;
  trafficManager: any;
  profileKey: string;
  profile: NPCProfile;
  state: string;
  targetNode: RoadNode | null = null;
  currentEdge: RoadEdge | null = null;
  currentLane: number = 0;
  route: RoadNode[] = [];
  routeIndex: number = 0;
  waitTimer: number = 0;
  overtakeTimer: number = 0;
  overtakeTarget: any = null;
  overtakePhase: number = 0;
  sidewalkTimer: number = 0;
  parkingSpot: any = null;
  parkingPhase: number = 0;
  crashTimer: number = 0;
  lastSignalCheck: number = 0;
  signalViolation: boolean = false;
  laneChangeCooldown: number = 0;
  desiredSpeed: number = 0;
  currentSpeed: number = 0;
  followDistance: number;
  reactionDelay: number;
  reactionTimer: number = 0;
  isRuleBreaker: boolean;
  behaviorModifiers: any;
  distractTimer: number = 0;
  distractChance: number;
  rageTimer: number = 0;
  rageLevel: number = 0;

  constructor(vehicle: any, roadGraph: RoadGraph, trafficManager: any) {
    this.vehicle = vehicle;
    this.roadGraph = roadGraph;
    this.trafficManager = trafficManager;
    this.profileKey = (vehicle.profileKey && NPC_PROFILES[vehicle.profileKey]) ? vehicle.profileKey : pickRandomProfile();
    this.profile = NPC_PROFILES[this.profileKey] || NPC_PROFILES.normal;
    this.state = NPC_STATE.IDLE;
    this.followDistance = 15 + Math.random() * 10;
    this.reactionDelay = 0.1 + Math.random() * 0.3;
    this.isRuleBreaker = ['reckless_bike', 'rulebreaker', 'aggressive'].includes(this.profileKey);
    const p = this.profile || NPC_PROFILES.normal;
    this.behaviorModifiers = {
      hornFrequency: p.aggression * 0.5,
      lightFlashFrequency: p.aggression * 0.3,
      tailgateDistance: (1 - p.patience) * 10 + 5
    };
    this.distractChance = this.profileKey === 'normal' ? 0.0003 : this.profileKey === 'cautious' ? 0.0001 : this.profileKey === 'aggressive' ? 0.0008 : 0.0005;
  }

  init(): void {}

  setRoute(route: RoadNode[]): void {
    this.route = route || [];
    this.routeIndex = 0;
    this.state = NPC_STATE.FOLLOW_LANE;
    this._pickNextTarget();
  }

  _pickNextTarget(): void {
    if (this.route && this.route.length > 0 && this.routeIndex < this.route.length) {
      this.targetNode = this.route[this.routeIndex];
      const edge = this.roadGraph.getEdgeTo(this.vehicle.currentNode, this.targetNode);
      if (edge) {
        this.currentEdge = edge;
        this.currentLane = this._pickInitialLane(edge);
        return;
      }
    }
    if (this.trafficManager) {
      this.targetNode = this.trafficManager._getNextRouteNode(this.vehicle.currentNode);
      if (this.targetNode) {
        const edge = this.roadGraph.getEdgeTo(this.vehicle.currentNode, this.targetNode);
        if (edge) {
          this.currentEdge = edge;
          this.currentLane = this._pickInitialLane(edge);
          this.vehicle.currentNode = this.targetNode;
          return;
        }
      }
    }
    this.state = NPC_STATE.COMPLETE;
  }

  _pickInitialLane(edge: RoadEdge): number {
    const lanes = edge.lanes;
    if (lanes <= 1) return 0;
    if (this.profile.laneDiscipline > 0.8) return 0;
    return Math.floor(Math.random() * lanes);
  }

  update(dt: number, playerVehicle: any, signals: any[]): void {
    this.reactionTimer -= dt;
    this.laneChangeCooldown = Math.max(0, this.laneChangeCooldown - dt);

    switch (this.state) {
      case NPC_STATE.IDLE: this._updateIdle(dt); break;
      case NPC_STATE.FOLLOW_LANE: this._updateFollowLane(dt, playerVehicle, signals); break;
      case NPC_STATE.OVERTAKE: this._updateOvertake(dt, playerVehicle); break;
      case NPC_STATE.WAIT_SIGNAL: this._updateWaitSignal(dt, signals); break;
      case NPC_STATE.SIDEWALK_DETOUR: this._updateSidewalkDetour(dt); break;
      case NPC_STATE.PARK: this._updatePark(dt); break;
      case NPC_STATE.COMPLETE: this._updateComplete(dt); break;
      case NPC_STATE.CRASH: this._updateCrash(dt); break;
      case NPC_STATE.PULL_OVER: this._updatePullOver(dt); break;
      case NPC_STATE.EMERGENCY_BRAKE: this._updateEmergencyBrake(dt); break;
      case NPC_STATE.DISTRACTED: this._updateDistracted(dt); break;
      case NPC_STATE.ROAD_RAGE: this._updateRoadRage(dt); break;
    }

    this._applyPhysics(dt);
    this._checkTransitions(playerVehicle, signals);
    this._checkEmergencyAvoidance(playerVehicle);
  }

  _updateIdle(dt: number): void {
    if (this.route.length > 0) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this._pickNextTarget();
    }
  }

  _updateFollowLane(dt: number, playerVehicle: any, signals: any[]): void {
    if (!this.currentEdge || !this.targetNode) { this._advanceRoute(); return; }

    const aheadVehicle = this._getVehicleAhead();
    const signalAhead = this._getSignalAhead(signals);

    if (signalAhead && signalAhead.state === 'red') {
      const distToSignal = this._distanceToSignal(signalAhead);
      if (distToSignal < 15) {
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

  _updateOvertake(dt: number, playerVehicle: any): void {
    this.overtakeTimer += dt;
    if (this.overtakePhase === 0) {
      this._initiateOvertake();
      this.overtakePhase = 1;
    } else if (this.overtakePhase === 1) {
      this._executeOvertake(dt);
      if (this._overtakeComplete()) this.overtakePhase = 2;
    } else if (this.overtakePhase === 2) {
      this._returnToLane(dt);
      if (this._laneReturnComplete()) {
        this.state = NPC_STATE.FOLLOW_LANE;
        this.overtakeTimer = 0; this.overtakeTarget = null; this.overtakePhase = 0;
        this.laneChangeCooldown = 3 + Math.random() * 5;
      }
    }
    if (this.overtakeTimer > 10) this._abortOvertake();
  }

  _updateWaitSignal(dt: number, signals: any[]): void {
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

  _updateSidewalkDetour(dt: number): void {
    this.sidewalkTimer += dt;
    this.desiredSpeed = this._getTargetSpeed() * 0.4;
    this._steerTowardsTarget(dt);
    if (this.sidewalkTimer > 5 + Math.random() * 10) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.sidewalkTimer = 0;
    }
  }

  _updatePark(dt: number): void {
    if (!this.parkingSpot) { this._findParkingSpot(); return; }
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

  _updateComplete(dt: number): void {
    this.desiredSpeed = 0;
    this.vehicle.velocity.lerp(new THREE.Vector3(0, 0, 0), 0.1);
  }

  _updateCrash(dt: number): void {
    this.crashTimer += dt;
    this.vehicle.velocity.multiplyScalar(0.95);
    if (this.crashTimer > 5) this._respawn();
  }

  _checkTransitions(playerVehicle: any, signals: any[]): void {
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
      if (dist < 15 && this.state !== NPC_STATE.WAIT_SIGNAL) {
        if (this.profile.signalCompliance >= Math.random()) this.state = NPC_STATE.WAIT_SIGNAL;
      }
    }

    if (this.isRuleBreaker && this.profile.sidewalkProbability > Math.random()) {
      if (this.state === NPC_STATE.FOLLOW_LANE && Math.random() < 0.001 * dt) {
        this.state = NPC_STATE.SIDEWALK_DETOUR;
        this.sidewalkTimer = 0;
      }
    }

    this._ambCheckTimer = (this._ambCheckTimer || 0) + dt;
    if (this.state === NPC_STATE.FOLLOW_LANE && this._ambCheckTimer > 0.5) {
      this._ambCheckTimer = 0;
      if (this._isAmbulanceNearby()) {
        this.state = NPC_STATE.PULL_OVER;
        this.pullOverTimer = 0;
        return;
      }
    }

    if (playerVehicle && this._isNearPlayer(playerVehicle)) this._reactToPlayer(playerVehicle);

    if (this.state === NPC_STATE.FOLLOW_LANE && Math.random() < this.distractChance) {
      this.state = NPC_STATE.DISTRACTED;
      this.distractTimer = 0;
    }

    if (this.state === NPC_STATE.FOLLOW_LANE && this.profile.aggression > 0.5) {
      const ahead = this._getVehicleAhead();
      if (ahead) {
        const dist = this.vehicle.position.distanceTo(ahead.position);
        if (dist < this.followDistance * 0.6 && this.currentSpeed < this.desiredSpeed * 0.5) {
          this.rageLevel = Math.min(100, this.rageLevel + dt * 35);
          if (this.rageLevel >= 100) {
            this.state = NPC_STATE.ROAD_RAGE;
            this.rageTimer = 0;
          }
        } else {
          this.rageLevel = Math.max(0, this.rageLevel - dt * 10);
        }
      }
    }
  }

  _advanceRoute(): void {
    this.routeIndex++;
    this._pickNextTarget();
  }

  _getVehicleAhead(): any {
    if (!this.currentEdge) return null;
    const vehicles = this.trafficManager.getVehiclesOnEdge(this.currentEdge.id);
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode);
    let closest = null, minDist = Infinity;
    vehicles.forEach(v => {
      if (v === this.vehicle) return;
      const toV = new THREE.Vector3().subVectors(v.position, this.vehicle.position);
      const proj = toV.dot(forward);
      if (proj > 0 && proj < minDist) { minDist = proj; closest = v; }
    });
    return closest;
  }

  _getSignalAhead(signals: any[]): any {
    if (!this.currentEdge || !signals) return null;
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode);
    let closest = null, minDist = Infinity;
    signals.forEach(s => {
      const toS = new THREE.Vector3().subVectors(s.position, this.vehicle.position);
      const proj = toS.dot(forward);
      if (proj > 0 && proj < 100 && proj < minDist) { minDist = proj; closest = s; }
    });
    return closest;
  }

  _distanceToSignal(signal: any): number {
    return this.vehicle.position.distanceTo(signal.position);
  }

  _steerTowardsTarget(dt: number): void {
    if (!this.targetNode) return;
    const targetPos = this.targetNode.position.clone();
    targetPos.y = this.vehicle.position.y;
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.vehicle.position);
    const dist = toTarget.length();
    if (dist < 5) { this._advanceRoute(); return; }
    const desiredDir = toTarget.normalize();
    const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
    const maxTurn = this.vehicle.stats.turn * dt * 60;
    const clampedAngle = THREE.MathUtils.clamp(angle, -maxTurn, maxTurn);
    this.vehicle.rotation.y += clampedAngle;
  }

  _maintainLane(dt: number): void {
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

  _attemptOvertake(vehicle: any): void {
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

  _isLaneClear(lane: number, ignoreVehicle: any): boolean {
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

  _initiateOvertake(): void {
    this.currentLane = this.currentLane === 0 ? 1 : 0;
  }

  _executeOvertake(dt: number): void {
    this.desiredSpeed = this._getTargetSpeed() * 1.3;
    this._maintainLane(dt);
  }

  _overtakeComplete(): boolean {
    if (!this.overtakeTarget) return true;
    const toTarget = new THREE.Vector3().subVectors(this.overtakeTarget.position, this.vehicle.position);
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    return toTarget.dot(forward) < -5;
  }

  _returnToLane(dt: number): void {
    this.desiredSpeed = this._getTargetSpeed();
    this._maintainLane(dt);
  }

  _laneReturnComplete(): boolean {
    if (!this.currentEdge) return true;
    const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, this.vehicle.routeProgress);
    return this.vehicle.position.distanceTo(laneCenter) < 1;
  }

  _abortOvertake(): void {
    this.currentLane = this.currentLane === 0 ? 1 : 0;
    this.state = NPC_STATE.FOLLOW_LANE;
    this.overtakeTimer = 0; this.overtakeTarget = null; this.overtakePhase = 0;
    this.laneChangeCooldown = 5;
  }

  _findParkingSpot(): void {
    const spots = this.trafficManager.getAvailableParkingSpots(this.vehicle.position, 50);
    if (spots.length > 0) this.parkingSpot = spots[0];
    else this.state = NPC_STATE.COMPLETE;
  }

  _steerTowardsSpot(dt: number): void {
    if (!this.parkingSpot) return;
    const toSpot = new THREE.Vector3().subVectors(this.parkingSpot.position, this.vehicle.position);
    toSpot.y = 0;
    const desiredDir = toSpot.normalize();
    const currentDir = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const angle = Math.atan2(desiredDir.x, desiredDir.z) - Math.atan2(currentDir.x, currentDir.z);
    const maxTurn = this.vehicle.stats.turn * dt * 60 * 0.5;
    this.vehicle.rotation.y += THREE.MathUtils.clamp(angle, -maxTurn, maxTurn);
  }

  _alignForParking(dt: number): void {
    if (!this.parkingSpot) return;
    const targetRot = this.parkingSpot.rotation;
    const diff = targetRot - this.vehicle.rotation.y;
    const maxTurn = this.vehicle.stats.turn * dt * 60 * 0.3;
    this.vehicle.rotation.y += THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);
  }

  _isNearPlayer(player: any): boolean {
    return this.vehicle.position.distanceTo(player.position) < 30;
  }

  _honk(): void {
    if (this.trafficManager.audio && this.vehicle.hornSound) {
      this.trafficManager.audio.playHorn(this.vehicle.hornSound, this.vehicle.position);
    }
  }

  _flashLights(): void {
    this.vehicle.flashHighBeams = true;
    setTimeout(() => { this.vehicle.flashHighBeams = false; }, 200);
  }

  _updatePullOver(dt: number): void {
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

  _updateDistracted(dt: number): void {
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

  _updateRoadRage(dt: number): void {
    this.rageTimer += dt;
    this.desiredSpeed = this._getTargetSpeed() * 1.2;
    if (this.rageTimer % 1.5 < dt) this._honk();
    if (this.rageTimer % 2 < dt) this._flashLights();
    this.followDistance = 5;
    if (this.rageTimer > 6) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.rageTimer = 0; this.rageLevel = 0;
      this.followDistance = 15 + Math.random() * 10;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }

  _isAmbulanceNearby(): boolean {
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

  _updateEmergencyBrake(dt: number): void {
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

  _checkEmergencyAvoidance(playerVehicle: any): void {
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

  _reactToPlayer(player: any): void {
    const dist = this.vehicle.position.distanceTo(player.position);
    const aggression = this.profile.aggression;

    if (aggression > 0.5 && dist < 15 && Math.random() < 0.02) this._honk();

    if (dist < 12 && this.currentSpeed > 2) {
      const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
      const toPlayer = new THREE.Vector3().subVectors(player.position, this.vehicle.position);
      const proj = toPlayer.dot(forward);
      if (proj > 0 && proj < 10) this.desiredSpeed = Math.min(this.desiredSpeed, this.currentSpeed * 0.5);
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

    if (aggression < 0.2 && dist < 25 && Math.random() < 0.01) this.desiredSpeed *= 0.8;

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
      if (Math.random() < 0.002) this.vehicle.rotation.y += (Math.random() - 0.5) * 0.08;
    }
  }

  _getTargetSpeed(): number {
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

  _applyPhysics(dt: number): void {
    const accel = this.vehicle.stats.accel * dt * 60;
    const fric = this.vehicle.stats.fric;
    const maxSpd = this.desiredSpeed;
    if (this.currentSpeed < maxSpd) {
      this.currentSpeed = Math.min(maxSpd, this.currentSpeed + accel);
    } else {
      this.currentSpeed = Math.max(maxSpd, this.currentSpeed * fric);
    }
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    this.vehicle.velocity.copy(forward).multiplyScalar(this.currentSpeed);
    this.vehicle.position.addScaledVector(this.vehicle.velocity, dt);
    this.vehicle.routeProgress += this.currentSpeed * dt / (this.currentEdge?.length || 100);
  }

  _respawn(): void {
    this.vehicle.health = 100;
    this.vehicle.position.set(0, 0.5, 0);
    this.vehicle.velocity.set(0, 0, 0);
    this.currentSpeed = 0;
    this.state = NPC_STATE.IDLE;
    this.routeIndex = 0;
    this.crashTimer = 0;
  }

  getDebugInfo(): any {
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

// ===== Pedestrian AI =====

export const PED_STATE = {
  WAITING: 'WAITING',
  CROSSING: 'CROSSING',
  WALKING: 'WALKING',
  JAYWALKING: 'JAYWALKING',
  FLEEING: 'FLEEING',
  FROZEN: 'FROZEN'
};

export interface PedProfile {
  speed: number;
  jaywalkChance: number;
  waitPatience: number;
  groupBehavior: number;
}

export const PED_PROFILES: Record<string, PedProfile> = {
  normal: { speed: 2.5, jaywalkChance: 0.15, waitPatience: 0.8, groupBehavior: 0.3 },
  rusher: { speed: 4.0, jaywalkChance: 0.5, waitPatience: 0.2, groupBehavior: 0.1 },
  cautious: { speed: 1.8, jaywalkChance: 0.02, waitPatience: 0.95, groupBehavior: 0.5 },
  child: { speed: 2.0, jaywalkChance: 0.3, waitPatience: 0.4, groupBehavior: 0.7 },
  elderly_ped: { speed: 1.2, jaywalkChance: 0.05, waitPatience: 0.9, groupBehavior: 0.4 },
  phone_user: { speed: 1.5, jaywalkChance: 0.35, waitPatience: 0.3, groupBehavior: 0.1 }
};

const PED_PROFILE_KEYS = Object.keys(PED_PROFILES);

export function pickRandomPedProfile(): string {
  return PED_PROFILE_KEYS[Math.floor(Math.random() * PED_PROFILE_KEYS.length)];
}

export class PedestrianAI {
  ped: THREE.Object3D;
  tm: any;
  profileKey: string;
  profile: PedProfile;
  state: string;
  target: THREE.Vector3 | null = null;
  waitTimer: number = 0;
  crossingTimer: number = 0;
  fleeTimer: number = 0;
  stuckTimer: number = 0;
  facing: number;
  lookTimer: number = 0;
  onCrosswalk: boolean = false;

  constructor(pedMesh: THREE.Object3D, trafficManager: any) {
    this.ped = pedMesh;
    this.tm = trafficManager;
    this.profileKey = (pedMesh as any).profileKey || pickRandomPedProfile();
    this.profile = PED_PROFILES[this.profileKey];
    this.state = PED_STATE.WALKING;
    this.facing = Math.random() * Math.PI * 2;
  }

  update(dt: number, npcs: any[], playerVehicle: any): void {
    this.lookTimer += dt;
    switch (this.state) {
      case PED_STATE.WALKING: this._updateWalking(dt); break;
      case PED_STATE.WAITING: this._updateWaiting(dt, npcs); break;
      case PED_STATE.CROSSING: this._updateCrossing(dt, npcs, playerVehicle); break;
      case PED_STATE.JAYWALKING: this._updateJaywalking(dt, npcs, playerVehicle); break;
      case PED_STATE.FLEEING: this._updateFleeing(dt); break;
      case PED_STATE.FROZEN: break;
    }
    this._checkVehicleProximity(playerVehicle, npcs);
    this._keepOnGround();
  }

  _updateWalking(dt: number): void {
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
        this.ped.position.x + Math.sin(angle) * dist, 0,
        this.ped.position.z + Math.cos(angle) * dist
      );
    }
  }

  _updateWaiting(dt: number, npcs: any[]): void {
    this.waitTimer += dt;
    if (this.lookTimer > 1.5) {
      this.lookTimer = 0;
      this.facing += (Math.random() - 0.5) * 1.5;
      this.ped.rotation.y = this.facing;
    }
    if (!(this as any)._waitThreshold) (this as any)._waitThreshold = 2 + Math.random() * 4;
    if (this.waitTimer > (this as any)._waitThreshold) {
      if (this.profile.jaywalkChance > Math.random()) {
        this.state = PED_STATE.JAYWALKING;
        this.crossingTimer = 0;
        (this as any)._waitThreshold = null;
        this._pickCrossingTarget();
      } else {
        if (this._isRoadClear(npcs)) {
          this.state = PED_STATE.CROSSING;
          this.crossingTimer = 0;
          (this as any)._waitThreshold = null;
          this._pickCrossingTarget();
        }
      }
    }
  }

  _updateCrossing(dt: number, npcs: any[], playerVehicle: any): void {
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

  _updateJaywalking(dt: number, npcs: any[], playerVehicle: any): void {
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

  _updateFleeing(dt: number): void {
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

  _checkVehicleProximity(playerVehicle: any, npcs: any[]): void {
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

  _isRoadClear(npcs: any[]): boolean {
    if (!npcs) return true;
    const myPos = this.ped.position;
    for (const npc of npcs) {
      if (!npc.position) continue;
      const dist = myPos.distanceTo(npc.position);
      if (dist < 10) return false;
    }
    return true;
  }

  _pickCrossingTarget(): void {
    const crossAngle = this.facing + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const crossDist = 12 + Math.random() * 8;
    this.target = new THREE.Vector3(
      this.ped.position.x + Math.sin(crossAngle) * crossDist, 0,
      this.ped.position.z + Math.cos(crossAngle) * crossDist
    );
  }

  _keepOnGround(): void {
    if (!(this as any)._groundY) (this as any)._groundY = this.ped.position.y > 0.1 ? 0.5 : 0;
    this.ped.position.y = (this as any)._groundY;
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).NPC_STATE = NPC_STATE;
  (window as any).NPC_PROFILES = NPC_PROFILES;
  (window as any).NPCAI = NPCAI;
  (window as any).pickRandomProfile = pickRandomProfile;
  (window as any).PED_STATE = PED_STATE;
  (window as any).PED_PROFILES = PED_PROFILES;
  (window as any).PedestrianAI = PedestrianAI;
  (window as any).pickRandomPedProfile = pickRandomPedProfile;
}