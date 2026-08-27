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
  ROAD_RAGE: 'ROAD_RAGE',
  BUS_STOP: 'BUS_STOP',
  YIELD: 'YIELD'
};

export interface VehicleClassProfile {
  v0: number;
  T: number;
  s0: number;
  aMax: number;
  b: number;
  bSafe: number;
  p: number;
  delta: number;
  wheelbase: number;
  length: number;
  bMax: number;
}

export const VehicleClassProfiles: Record<string, VehicleClassProfile> = {
  car: { v0: 13.89, T: 1.4, s0: 2.5, aMax: 2.0, b: 2.0, bSafe: 4.0, p: 0.50, delta: 4, wheelbase: 2.7, length: 4.5, bMax: 8.0 },
  auto: { v0: 11.11, T: 1.0, s0: 1.8, aMax: 1.8, b: 2.2, bSafe: 4.5, p: 0.25, delta: 4, wheelbase: 2.0, length: 3.2, bMax: 8.0 },
  bike: { v0: 16.67, T: 0.8, s0: 1.2, aMax: 2.8, b: 2.5, bSafe: 5.5, p: 0.10, delta: 4, wheelbase: 1.4, length: 2.0, bMax: 8.0 },
  bus: { v0: 10.00, T: 2.0, s0: 4.0, aMax: 1.2, b: 1.5, bSafe: 3.5, p: 0.75, delta: 4, wheelbase: 6.0, length: 9.0, bMax: 6.0 },
  truck: { v0: 8.33, T: 2.2, s0: 4.5, aMax: 1.0, b: 1.4, bSafe: 3.0, p: 0.60, delta: 4, wheelbase: 7.5, length: 8.5, bMax: 6.0 }
};

/**
 * Computes IDM dynamic desired headway s*(v, Delta v)
 */
export function calcIDMDesiredGap(v: number, dv: number, s0: number, T: number, aMax: number, b: number): number {
  const dynamicTerm = (v * dv) / (2 * Math.sqrt(Math.max(0.01, aMax * b)));
  return s0 + Math.max(0, v * T + dynamicTerm);
}

/**
 * Computes IDM continuous longitudinal acceleration
 */
export function calcIDMAcceleration(
  v: number,
  v0: number,
  s: number,
  dv: number,
  s0: number,
  T: number,
  aMax: number,
  b: number,
  delta: number = 4,
  maxBraking: number = 8.0
): number {
  const sStar = calcIDMDesiredGap(v, dv, s0, T, aMax, b);
  const freeTerm = Math.pow(Math.max(0, v) / Math.max(0.1, v0), delta);
  const interactionTerm = Math.pow(sStar / Math.max(0.1, s), 2);
  const rawAccel = aMax * (1 - freeTerm - interactionTerm);
  return Math.max(-maxBraking, Math.min(aMax, rawAccel));
}

export interface MOBILParams {
  a_c: number;
  a_c_tilde: number;
  a_n?: number;
  a_n_tilde?: number;
  a_o?: number;
  a_o_tilde?: number;
  p?: number;
  bSafe?: number;
  aTh?: number;
  aBias?: number;
  isRightLaneChange?: boolean;
  lanesOnRoad?: number;
}

export interface MOBILResult {
  shouldChange: boolean;
  reason?: string;
  totalIncentive?: number;
  threshold?: number;
  egoAdvantage?: number;
  otherAdvantage?: number;
  targetFollowerDecel?: number;
}

/**
 * Evaluates MOBIL lane change criteria
 * Safety Criterion: a_n_tilde >= -bSafe
 * Incentive Criterion: (a_c_tilde - a_c) + p * [ (a_n_tilde - a_n) + (a_o_tilde - a_o) ] > a_th +/- a_bias
 */
export function evaluateMOBILDecision({
  a_c,
  a_c_tilde,
  a_n = 0,
  a_n_tilde = 0,
  a_o = 0,
  a_o_tilde = 0,
  p = 0.5,
  bSafe = 4.0,
  aTh = 0.2,
  aBias = 0.1,
  isRightLaneChange = false,
  lanesOnRoad = 2
}: MOBILParams): MOBILResult {
  if (lanesOnRoad <= 1) {
    return { shouldChange: false, reason: 'SINGLE_LANE_ROAD' };
  }

  // Safety Criterion (Hard Gate)
  if (a_n_tilde < -bSafe) {
    return { shouldChange: false, reason: 'SAFETY_VIOLATION_FOLLOWER_BRAKING', targetFollowerDecel: a_n_tilde };
  }

  // Incentive Criterion
  const egoAdvantage = a_c_tilde - a_c;
  const otherAdvantage = (a_n_tilde - a_n) + (a_o_tilde - a_o);
  const totalIncentive = egoAdvantage + p * otherAdvantage;
  const threshold = aTh + (isRightLaneChange ? aBias : -aBias);

  if (totalIncentive > threshold) {
    return { shouldChange: true, totalIncentive, threshold, egoAdvantage, otherAdvantage };
  }

  return { shouldChange: false, reason: 'INSUFFICIENT_INCENTIVE', totalIncentive, threshold };
}

export interface PurePursuitParams {
  localX: number;
  localZ: number;
  Ld: number;
  wheelbase?: number;
  speed?: number;
}

export interface PurePursuitResult {
  alpha: number;
  kappa: number;
  steerAngle: number;
  yawRate: number;
}

/**
 * Adaptive Pure Pursuit Lookahead
 * Ld(v) = clamp(kLook * v, Lmin, Lmax)
 */
export function calcAdaptiveLookahead(
  v: number,
  kLook: number = 0.85,
  Lmin: number = 3.5,
  Lmax: number = 20.0
): number {
  return Math.max(Lmin, Math.min(Lmax, kLook * Math.max(0, v)));
}

/**
 * Pure Pursuit Steering Curvature & Yaw Rate
 */
export function calcPurePursuit({
  localX,
  localZ,
  Ld,
  wheelbase = 2.7,
  speed = 10.0
}: PurePursuitParams): PurePursuitResult {
  const alpha = Math.atan2(localX, localZ);
  const kappa = (2 * Math.sin(alpha)) / Math.max(0.1, Ld);
  const steerAngle = Math.atan(kappa * wheelbase);
  const yawRate = (speed * Math.tan(steerAngle)) / wheelbase;
  return { alpha, kappa, steerAngle, yawRate };
}

export interface PedestrianTTCParams {
  pedX?: number;
  pedZ?: number;
  vehX?: number;
  vehZ?: number;
  vehHeading?: number;
  vehSpeed?: number;
  laneWidth?: number;
}

export interface PedestrianTTCResult {
  oncoming: boolean;
  ttc: number;
  dLong: number;
  dLat: number;
}

export function calcPedestrianTTC(
  arg1: PedestrianTTCParams | THREE.Vector3 | { x: number; z: number },
  arg2?: THREE.Vector3 | { x: number; z: number },
  arg3?: THREE.Vector3 | { x: number; z: number } | number,
  arg4?: number
): PedestrianTTCResult {
  let pedX = 0, pedZ = 0, vehX = 0, vehZ = 0, vehHeading = 0, vehSpeed = 0, laneWidth = 3.5;
  if (arg1 && typeof arg1 === 'object' && ('pedX' in arg1 || 'pedZ' in arg1)) {
    const p = arg1 as PedestrianTTCParams;
    pedX = p.pedX || 0;
    pedZ = p.pedZ || 0;
    vehX = p.vehX || 0;
    vehZ = p.vehZ || 0;
    vehHeading = p.vehHeading || 0;
    vehSpeed = p.vehSpeed !== undefined ? p.vehSpeed : 0;
    if (p.laneWidth !== undefined) laneWidth = p.laneWidth;
  } else if (arg1 && arg2) {
    const pPos = arg1 as { x: number; z: number };
    const vPos = arg2 as { x: number; z: number };
    pedX = pPos.x || 0;
    pedZ = pPos.z || 0;
    vehX = vPos.x || 0;
    vehZ = vPos.z || 0;
    if (arg3 && typeof arg3 === 'object') {
      const vVel = arg3 as { x: number; z: number };
      const vx = vVel.x || 0;
      const vz = vVel.z || 0;
      vehSpeed = Math.hypot(vx, vz);
      vehHeading = Math.atan2(vx, vz);
    } else if (typeof arg3 === 'number') {
      vehSpeed = arg3;
      vehHeading = typeof arg4 === 'number' ? arg4 : 0;
    }
    if (typeof arg4 === 'number' && typeof arg3 === 'object') {
      laneWidth = arg4;
    }
  } else {
    return { oncoming: false, ttc: Infinity, dLong: 0, dLat: 0 };
  }

  const dx = pedX - vehX;
  const dz = pedZ - vehZ;
  const forwardX = Math.sin(vehHeading);
  const forwardZ = Math.cos(vehHeading);
  const rightX = Math.cos(vehHeading);
  const rightZ = -Math.sin(vehHeading);

  const dLong = dx * forwardX + dz * forwardZ;
  const dLat = Math.abs(dx * rightX + dz * rightZ);

  if (dLong <= 0 || dLat > (laneWidth / 2 + 1.5)) {
    return { oncoming: false, ttc: Infinity, dLong, dLat };
  }

  const effectiveSpeed = Math.max(0.5, vehSpeed);
  const ttc = dLong / effectiveSpeed;
  return { oncoming: true, ttc, dLong, dLat };
}

export interface PedestrianGapParams {
  minTTC: number;
  roadWidth?: number;
  walkSpeed?: number;
  tMargin?: number;
}

export interface PedestrianGapResult {
  safeToCross: boolean;
  minTTC: number;
  tSafe: number;
}

export function evaluatePedestrianGapAcceptance(options: PedestrianGapParams | number, roadWidthArg = 12.0, walkSpeedArg = 1.3, tMarginArg = 2.0): PedestrianGapResult {
  let minTTC = Infinity, roadWidth = 12.0, walkSpeed = 1.3, tMargin = 2.0;
  if (typeof options === 'number') {
    minTTC = options;
    roadWidth = roadWidthArg;
    walkSpeed = walkSpeedArg;
    tMargin = tMarginArg;
  } else if (options && typeof options === 'object') {
    minTTC = options.minTTC !== undefined ? options.minTTC : Infinity;
    if (options.roadWidth !== undefined) roadWidth = options.roadWidth;
    if (options.walkSpeed !== undefined) walkSpeed = options.walkSpeed;
    if (options.tMargin !== undefined) tMargin = options.tMargin;
  }
  const tSafe = (roadWidth / Math.max(0.5, walkSpeed)) + tMargin;
  return { safeToCross: minTTC >= tSafe, minTTC, tSafe };
}

export interface PedestrianFleeParams {
  minTTC?: number;
  dLong?: number;
  currentSpeed?: number;
  walkSpeed?: number;
}

export interface PedestrianFleeResult {
  shouldFlee: boolean;
  fleeSpeed: number;
}

export function evaluatePedestrianFleeing(options: PedestrianFleeParams): PedestrianFleeResult {
  let minTTC = Infinity, dLong = 100, currentSpeed = 1.3, walkSpeed = 1.3;
  if (options && typeof options === 'object') {
    if (options.minTTC !== undefined) minTTC = options.minTTC;
    if (options.dLong !== undefined) dLong = options.dLong;
    if (options.currentSpeed !== undefined) currentSpeed = options.currentSpeed;
    if (options.walkSpeed !== undefined) walkSpeed = options.walkSpeed;
  }
  const shouldFlee = (minTTC < 2.2 && dLong < 10.0) || (minTTC < 2.0 && dLong < 6.0);
  const fleeSpeed = shouldFlee ? walkSpeed * 1.8 : walkSpeed;
  return { shouldFlee, fleeSpeed };
}

export interface DeadlockVehicle {
  id: string;
  type: string;
  aggression?: number;
  arrivalTimeMs?: number;
  vehicleRef?: any;
}

export interface DeadlockArbitrationResult {
  resolved: boolean;
  phase: number;
  reason?: string;
  action?: string;
  grantedVehicleId?: string | null;
  priorityOverrides?: { id: string; priority: number }[];
}

/**
 * 2-Phase Anti-Deadlock Arbitration
 */
export function arbitrateDeadlock(stalledVehicles: DeadlockVehicle[], stuckDurationSec: number): DeadlockArbitrationResult {
  if (stuckDurationSec < 3.5) {
    return { resolved: false, phase: 0, reason: 'BELOW_WATCHDOG_THRESHOLD' };
  }

  if (stuckDurationSec >= 3.5 && stuckDurationSec < 8.0) {
    // Phase 1: Soft Token Arbitration
    const scored = (stalledVehicles || []).map(v => {
      const typeWeight = v.type === 'bus' ? 30 : (v.type === 'truck' ? 25 : (v.type === 'car' ? 20 : 15));
      const aggressionBias = (v.aggression || 0.5) * 10;
      const score = (v.arrivalTimeMs || 0) * 0.001 + typeWeight + aggressionBias;
      return { vehicle: v, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return {
      resolved: true,
      phase: 1,
      grantedVehicleId: scored.length > 0 ? scored[0].vehicle.id : null,
      priorityOverrides: scored.map(s => ({ id: s.vehicle.id, priority: s.score }))
    };
  }

  // Phase 2: Hard Recycling
  return { resolved: true, phase: 2, action: 'RECYCLE_OR_REROUTE' };
}

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
  isChangingLane: boolean = false;
  laneChangeStartLane: number = 0;
  laneChangeTargetLane: number = 0;
  laneChangeProgress: number = 0;
  laneChangeDuration: number = 1.8;
  desiredSpeed: number = 0;
  currentSpeed: number = 0;
  currentAcceleration: number = 0;
  followDistance: number;
  reactionDelay: number;
  reactionTimer: number = 0;
  isRuleBreaker: boolean;
  behaviorModifiers: any;
  distractTimer: number = 0;
  distractChance: number;
  rageTimer: number = 0;
  rageLevel: number = 0;
  idmParams!: VehicleClassProfile;
  _speedVarianceOffset: number = 0;
  _committedToIntersection: boolean = false;
  _probePhase: number = 0;
  _autoProbeOffset: number = 0;
  _filterOffset: number = 0;
  _isFiltering: boolean = false;
  _hornAlertTimer: number = 0;
  _hornAlertDecel: number = 0;
  _hornYieldOffset: number = 0;
  _hornCascadeCooldown: number = 0;
  _queuedHornTimer: number = 0;
  _stuckCheckTimer: number = 0;
  _stuckTimer: number = 0;
  _stuckLastX: number = 0;
  _stuckLastZ: number = 0;
  _stallStartTime: number | null = null;

  constructor(vehicle: any, roadGraph: RoadGraph, trafficManager: any) {
    this.vehicle = vehicle;
    this.roadGraph = roadGraph;
    this.trafficManager = trafficManager;
    this.profileKey = (vehicle.profileKey && NPC_PROFILES[vehicle.profileKey]) ? vehicle.profileKey : pickRandomProfile();
    this.profile = NPC_PROFILES[this.profileKey] || NPC_PROFILES.normal;
    this.state = NPC_STATE.IDLE;
    this.reactionDelay = 0.1 + Math.random() * 0.3;
    this.laneChangeCooldown = 1.0 + Math.random() * 2.0;
    this.isRuleBreaker = ['reckless_bike', 'rulebreaker', 'aggressive'].includes(this.profileKey);
    const p = this.profile || NPC_PROFILES.normal;
    this.behaviorModifiers = {
      hornFrequency: p.aggression * 0.5,
      lightFlashFrequency: p.aggression * 0.3,
      tailgateDistance: (1 - p.patience) * 10 + 5
    };
    this.distractChance = this.profileKey === 'normal' ? 0.0003 : this.profileKey === 'cautious' ? 0.0001 : this.profileKey === 'aggressive' ? 0.0008 : 0.0005;

    this._initIDMParameters();
    this.followDistance = this.idmParams.s0 + this.idmParams.v0 * this.idmParams.T;
    this._speedVarianceOffset = (Math.random() - 0.5) * 2 * (this.profile?.speedVariance || 0.15);

    // Mumbai Micro-Behaviors & Horn Reaction State Variables
    this._probePhase = Math.random() * Math.PI * 2;
    this._autoProbeOffset = 0;
    this._filterOffset = 0;
    this._isFiltering = false;
    this._hornAlertTimer = 0;
    this._hornAlertDecel = 0;
    this._hornYieldOffset = 0;
    this._hornCascadeCooldown = 0;
    this._queuedHornTimer = 0;
    this._stuckCheckTimer = 0;
    this._stuckTimer = 0;
    this._stuckLastX = 0;
    this._stuckLastZ = 0;
    this._stallStartTime = null;
  }

  _initIDMParameters(): void {
    const vType = (this.vehicle?.type || this.vehicle?.userData?.npcType || 'car').toLowerCase();
    let baseKey = 'car';
    if (['bike', 'splendor', 'activa', 'ktm', 'cycle'].includes(vType)) baseKey = 'bike';
    else if (['auto', 'auto_yellow'].includes(vType)) baseKey = 'auto';
    else if (['bus'].includes(vType)) baseKey = 'bus';
    else if (['truck', 'ace'].includes(vType)) baseKey = 'truck';

    const base = VehicleClassProfiles[baseKey] || VehicleClassProfiles.car;

    let aMod = 1.0;
    let TMod = 1.0;
    let s0Mod = 1.0;
    let pMod = 1.0;
    if (this.profileKey === 'aggressive') { aMod = 1.2; TMod = 0.8; s0Mod = 0.85; pMod = 0.3; }
    else if (this.profileKey === 'cautious') { aMod = 0.85; TMod = 1.25; s0Mod = 1.2; pMod = 1.4; }
    else if (this.profileKey === 'reckless_bike') { aMod = 1.3; TMod = 0.7; s0Mod = 0.75; pMod = 0.1; }
    else if (this.profileKey === 'elderly') { aMod = 0.8; TMod = 1.3; s0Mod = 1.25; pMod = 1.3; }
    else if (this.profileKey === 'teen') { aMod = 1.15; TMod = 0.85; s0Mod = 0.9; pMod = 0.4; }

    const effectiveP = Math.max(0.0, Math.min(1.0, base.p * pMod));

    this.idmParams = {
      v0: base.v0,
      T: Math.max(0.5, base.T * TMod),
      s0: Math.max(0.8, base.s0 * s0Mod),
      aMax: base.aMax * aMod,
      b: base.b,
      bSafe: base.bSafe,
      p: effectiveP,
      delta: base.delta || 4,
      bMax: base.bMax || 8.0,
      wheelbase: base.wheelbase,
      length: base.length
    };
  }

  /**
   * Calculates continuous IDM acceleration
   */
  calculateIDMAcceleration(leadVehicle: any = null, distToLead: number = Infinity, vLead: number = 0, virtualObstacleDist: number = Infinity): number {
    const v = Math.max(0, this.currentSpeed);
    const targetV0 = this.desiredSpeed > 0 ? this.desiredSpeed : (this._getTargetSpeed ? this._getTargetSpeed() : this.idmParams.v0);
    const v0 = Math.max(0.5, targetV0);
    const { s0, T, aMax, b, delta, bMax } = this.idmParams;

    let aLead: number;
    if (leadVehicle && isFinite(distToLead) && distToLead > 0) {
      const dv = v - vLead;
      aLead = calcIDMAcceleration(v, v0, distToLead, dv, s0, T, aMax, b, delta, bMax);
    } else {
      const freeTerm = Math.pow(v / v0, delta);
      aLead = aMax * (1 - freeTerm);
      aLead = Math.max(-bMax, Math.min(aMax, aLead));
    }

    let aVirtual = aLead;
    if (isFinite(virtualObstacleDist) && virtualObstacleDist > 0) {
      const dvObs = v - 0;
      aVirtual = calcIDMAcceleration(v, v0, virtualObstacleDist, dvObs, s0, T, aMax, b, delta, bMax);
    }

    return Math.max(-bMax, Math.min(aLead, aVirtual));
  }

  /**
   * Evaluates candidate lanes using MOBIL game-theoretic algorithm
   */
  evaluateMOBIL(
    candidateLanes: number[] | null = null,
    trafficManager: any = null
  ): { shouldChange: boolean; targetLane: number; totalIncentive?: number; reason?: string; details?: any } {
    if (!this.currentEdge || !this.vehicle || !this.vehicle.position) {
      return { shouldChange: false, targetLane: this.currentLane, reason: 'NO_EDGE_OR_VEHICLE' };
    }

    const totalLanes = Math.max(1, this.currentEdge.lanes || 1);
    if (totalLanes <= 1) {
      return { shouldChange: false, targetLane: this.currentLane, reason: 'SINGLE_LANE_ROAD' };
    }

    let candidates = candidateLanes;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      candidates = [];
      if (this.currentLane > 0) candidates.push(this.currentLane - 1);
      if (this.currentLane < totalLanes - 1) candidates.push(this.currentLane + 1);
    }
    candidates = candidates.filter(l => typeof l === 'number' && l >= 0 && l < totalLanes && l !== this.currentLane);
    if (candidates.length === 0) {
      return { shouldChange: false, targetLane: this.currentLane, reason: 'NO_CANDIDATE_LANES' };
    }

    const tm = trafficManager || this.trafficManager;
    const myPos = this.vehicle.position;
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode || this.targetNode);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

    let edgeVehicles: any[] = [];
    if (tm && typeof tm.getVehiclesOnEdge === 'function') {
      edgeVehicles = tm.getVehiclesOnEdge(this.currentEdge.id) || [];
    }
    if (!edgeVehicles.length && tm && tm.vehicles) {
      edgeVehicles = tm.vehicles.filter((v: any) => v && v.active && (v.currentEdge === this.currentEdge || (v.npcAI && v.npcAI.currentEdge === this.currentEdge)));
    }

    const player = tm?.game?.playerVehicle || tm?.game?.player;
    const allVehicles = [...edgeVehicles];
    if (player && player.position && !allVehicles.includes(player) && player !== this.vehicle) {
      allVehicles.push(player);
    }

    const myLane = this.currentLane;
    const egoHalfD = (this.vehicle?.mesh?.userData?.halfD) || (this.idmParams.length / 2) || 2.2;
    const vEgo = Math.max(0, this.currentSpeed);
    const targetV0 = this.desiredSpeed > 0 ? this.desiredSpeed : (this._getTargetSpeed ? this._getTargetSpeed() : this.idmParams.v0);
    const v0Ego = Math.max(0.5, targetV0);
    const { s0: s0Ego, T: TEgo, aMax: aMaxEgo, b: bEgo, delta: deltaEgo, bMax: bMaxEgo, bSafe: bSafeEgo, p: pEgo } = this.idmParams;
    const politeness = (pEgo !== undefined) ? pEgo : 0.5;
    const bSafe = (bSafeEgo !== undefined) ? bSafeEgo : 4.0;

    const getVehicleLane = (v: any): number => {
      if (typeof v.currentLane === 'number') return v.currentLane;
      if (v.npcAI && typeof v.npcAI.currentLane === 'number') return v.npcAI.currentLane;
      const toV = new THREE.Vector3().subVectors(v.position, myPos);
      const lat = toV.x * right.x + toV.z * right.z;
      const offsets = this.currentEdge!.getLaneOffsets();
      let bestL = 0, bestDist = Infinity;
      for (let i = 0; i < totalLanes; i++) {
        const off = (offsets[i] !== undefined ? offsets[i] : 0) - (offsets[myLane] !== undefined ? offsets[myLane] : 0);
        const d = Math.abs(lat - off);
        if (d < bestDist) { bestDist = d; bestL = i; }
      }
      return bestL;
    };

    const laneVehicles: Record<number, any[]> = {};
    for (let i = 0; i < totalLanes; i++) laneVehicles[i] = [];

    for (let i = 0; i < allVehicles.length; i++) {
      const v = allVehicles[i];
      if (!v || v === this.vehicle || !v.position) continue;
      const dx = v.position.x - myPos.x;
      const dz = v.position.z - myPos.z;
      const dLong = dx * forward.x + dz * forward.z;
      if (Math.abs(dLong) > 80) continue;

      const vLane = getVehicleLane(v);
      if (laneVehicles[vLane]) {
        const vSpeed = Math.max(0, v.npcAI?.currentSpeed || v.speed || 0);
        const vHalfD = v.mesh?.userData?.halfD || v.userData?.halfD || 2.2;
        const vParams = v.npcAI?.idmParams || this.idmParams;
        laneVehicles[vLane].push({ vehicle: v, dLong, speed: vSpeed, halfD: vHalfD, params: vParams });
      }
    }

    const findLeadAndFollower = (laneIdx: number) => {
      const list = laneVehicles[laneIdx] || [];
      let lead: any = null, leadDist = Infinity;
      let fol: any = null, folDist = -Infinity;
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.dLong > 0.5 && item.dLong < leadDist) {
          leadDist = item.dLong;
          lead = item;
        } else if (item.dLong < -0.5 && item.dLong > folDist) {
          folDist = item.dLong;
          fol = item;
        }
      }
      return { lead, fol };
    };

    const { lead: lead_o, fol: fol_o } = findLeadAndFollower(myLane);

    let a_c: number;
    if (lead_o) {
      const gap_c = Math.max(0.1, lead_o.dLong - (egoHalfD + lead_o.halfD));
      const dv_c = vEgo - lead_o.speed;
      a_c = calcIDMAcceleration(vEgo, v0Ego, gap_c, dv_c, s0Ego, TEgo, aMaxEgo, bEgo, deltaEgo, bMaxEgo);
    } else {
      a_c = aMaxEgo * (1 - Math.pow(vEgo / v0Ego, deltaEgo));
      a_c = Math.max(-bMaxEgo, Math.min(aMaxEgo, a_c));
    }

    let a_o = 0, a_o_tilde = 0;
    if (fol_o) {
      const pO = fol_o.params || this.idmParams;
      const vFolO = fol_o.speed;
      const v0FolO = pO.v0 || v0Ego;
      const gap_o = Math.max(0.1, -fol_o.dLong - (fol_o.halfD + egoHalfD));
      const dv_o = vFolO - vEgo;
      a_o = calcIDMAcceleration(vFolO, v0FolO, gap_o, dv_o, pO.s0, pO.T, pO.aMax, pO.b, pO.delta || 4, pO.bMax || 8.0);

      if (lead_o) {
        const gap_tilde_o = Math.max(0.1, (lead_o.dLong - fol_o.dLong) - (fol_o.halfD + lead_o.halfD));
        const dv_tilde_o = vFolO - lead_o.speed;
        a_o_tilde = calcIDMAcceleration(vFolO, v0FolO, gap_tilde_o, dv_tilde_o, pO.s0, pO.T, pO.aMax, pO.b, pO.delta || 4, pO.bMax || 8.0);
      } else {
        a_o_tilde = pO.aMax * (1 - Math.pow(vFolO / v0FolO, pO.delta || 4));
        a_o_tilde = Math.max(-pO.bMax, Math.min(pO.aMax, a_o_tilde));
      }
    }

    let bestDecision: MOBILResult | null = null;
    let bestIncentive = -Infinity;
    let bestTargetLane: number | null = null;

    for (let c = 0; c < candidates.length; c++) {
      const targetLane = candidates[c];
      const { lead: lead_n, fol: fol_n } = findLeadAndFollower(targetLane);

      let a_c_tilde: number;
      if (lead_n) {
        const gap_tilde_c = Math.max(0.1, lead_n.dLong - (egoHalfD + lead_n.halfD));
        if (gap_tilde_c < s0Ego * 0.75) continue;
        const dv_tilde_c = vEgo - lead_n.speed;
        a_c_tilde = calcIDMAcceleration(vEgo, v0Ego, gap_tilde_c, dv_tilde_c, s0Ego, TEgo, aMaxEgo, bEgo, deltaEgo || 4, bMaxEgo || 8.0);
      } else {
        a_c_tilde = aMaxEgo * (1 - Math.pow(vEgo / v0Ego, deltaEgo || 4));
        a_c_tilde = Math.max(-bMaxEgo, Math.min(aMaxEgo, a_c_tilde));
      }

      let a_n = 0, a_n_tilde = 0;
      if (fol_n) {
        const pN = fol_n.params || this.idmParams;
        const vFolN = fol_n.speed;
        const v0FolN = pN.v0 || v0Ego;
        const gap_tilde_n = Math.max(0.1, -fol_n.dLong - (fol_n.halfD + egoHalfD));
        if (gap_tilde_n < pN.s0 * 0.75) continue;

        const dv_tilde_n = vFolN - vEgo;
        a_n_tilde = calcIDMAcceleration(vFolN, v0FolN, gap_tilde_n, dv_tilde_n, pN.s0, pN.T, pN.aMax, pN.b, pN.delta || 4, pN.bMax || 8.0);

        if (lead_n) {
          const gap_n = Math.max(0.1, (lead_n.dLong - fol_n.dLong) - (fol_n.halfD + lead_n.halfD));
          const dv_n = vFolN - lead_n.speed;
          a_n = calcIDMAcceleration(vFolN, v0FolN, gap_n, dv_n, pN.s0, pN.T, pN.aMax, pN.b, pN.delta || 4, pN.bMax || 8.0);
        } else {
          a_n = pN.aMax * (1 - Math.pow(vFolN / v0FolN, pN.delta || 4));
          a_n = Math.max(-pN.bMax, Math.min(pN.aMax, a_n));
        }
      }

      const isRightLaneChange = targetLane > myLane;
      const decision = evaluateMOBILDecision({
        a_c,
        a_c_tilde,
        a_n,
        a_n_tilde,
        a_o,
        a_o_tilde,
        p: politeness,
        bSafe,
        aTh: 0.2,
        aBias: 0.25,
        isRightLaneChange,
        lanesOnRoad: totalLanes
      });

      if (decision.shouldChange && (decision.totalIncentive || 0) > bestIncentive) {
        bestIncentive = decision.totalIncentive || 0;
        bestTargetLane = targetLane;
        bestDecision = decision;
      }
    }

    if (bestTargetLane !== null && bestDecision && bestDecision.shouldChange) {
      return {
        shouldChange: true,
        targetLane: bestTargetLane,
        totalIncentive: bestIncentive,
        details: bestDecision
      };
    }

    return {
      shouldChange: false,
      targetLane: this.currentLane,
      reason: bestDecision ? bestDecision.reason : 'INSUFFICIENT_INCENTIVE'
    };
  }

  _startLaneChange(targetLane: number): void {
    if (this.isChangingLane || targetLane === this.currentLane || !this.currentEdge) return;
    this.isChangingLane = true;
    this.laneChangeStartLane = this.currentLane;
    this.laneChangeTargetLane = targetLane;
    this.laneChangeProgress = 0.0;
    this.laneChangeDuration = 1.6 + Math.random() * 0.4;
    this.laneChangeCooldown = 3.0 + Math.random() * 1.0;
    if (this.vehicle) {
      this.vehicle.targetLane = targetLane;
    }
  }


  _getPedestrianObstacleAhead(): number {
    const peds = this.trafficManager?.game?.peds || [];
    if (!peds.length || !this.vehicle || !this.vehicle.position) return Infinity;
    const myPos = this.vehicle.position;
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const right = new THREE.Vector3(Math.cos(this.vehicle.rotation.y), 0, -Math.sin(this.vehicle.rotation.y));
    let minPedDist = Infinity;

    for (let i = 0; i < peds.length; i++) {
      const p = peds[i];
      const pPos = p.position || p.ped?.position;
      if (!pPos) continue;
      const dx = pPos.x - myPos.x;
      const dz = pPos.z - myPos.z;
      const dLong = dx * forward.x + dz * forward.z;
      const dLat = Math.abs(dx * right.x + dz * right.z);

      if (dLong > 0.5 && dLong < 25.0 && dLat < 2.2) {
        const pState = p.state || (p.pedAI && p.pedAI.state);
        if (pState === 'CROSSING' || pState === 'JAYWALKING' || dLat < 1.4) {
          if (dLong < minPedDist) {
            minPedDist = dLong;
          }
        }
      }
    }
    return minPedDist < Infinity ? Math.max(0.1, minPedDist - 2.0) : Infinity;
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

    // Cascading horn reactions & cascade cooldown timers
    if (this._hornAlertTimer > 0) this._hornAlertTimer = Math.max(0, this._hornAlertTimer - dt);
    if (this._hornCascadeCooldown > 0) this._hornCascadeCooldown = Math.max(0, this._hornCascadeCooldown - dt);
    if (this._queuedHornTimer > 0) {
      this._queuedHornTimer -= dt;
      if (this._queuedHornTimer <= 0) {
        this.triggerHorn('CASCADE_REACTION');
      }
    }

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
      case (NPC_STATE as any).BUS_STOP: (this as any)._updateBusStop?.(dt); break;
      case (NPC_STATE as any).YIELD: (this as any)._updateYield?.(dt, playerVehicle); break;
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

    this.desiredSpeed = this._getTargetSpeed();
    const aheadVehicle = this._getVehicleAhead();
    const signalAhead = this._getSignalAhead(signals);

    let virtualObstacleDist = Infinity;

    // 1. Red Signal Detection & Virtual Obstacle (stop-line aware)
    if (signalAhead && signalAhead.state === 'red') {
      const distToSignal = this._distanceToSignal(signalAhead);
      const egoHalfD = (this.vehicle?.mesh?.userData?.halfD) || 2.2;
      const distToStopLine = Math.max(0.1, (distToSignal - 6.0) - egoHalfD);

      if (this._committedToIntersection) {
        if (distToSignal > 12) this._committedToIntersection = false;
      } else if (distToSignal < 6.0) {
        this._committedToIntersection = true;
      } else if (distToSignal < 45.0) {
        if (this.profile.signalCompliance < Math.random() && this.isRuleBreaker) {
          this.signalViolation = true;
        } else {
          virtualObstacleDist = distToStopLine;
          if (distToSignal < 7.5 && this.currentSpeed < 0.3) {
            this._committedToIntersection = false;
            this.state = NPC_STATE.WAIT_SIGNAL;
            this.waitTimer = 0;
          }
        }
      }
    } else {
      if (this._committedToIntersection) this._committedToIntersection = false;
    }

    // 2. Pedestrian Crosswalk & Jaywalking Obstacle Detection
    const pedDist = this._getPedestrianObstacleAhead();
    if (pedDist < Infinity) {
      virtualObstacleDist = Math.min(virtualObstacleDist, pedDist);
    }

    // 3. Lead Vehicle Bumper-to-Bumper Distance and Speed
    let distToLead = Infinity;
    let vLead = 0;
    const vType = (this.vehicle?.type || this.vehicle?.userData?.npcType || 'car').toLowerCase();
    const isAuto = ['auto', 'auto_yellow'].includes(vType);
    const isBike = ['bike', 'splendor', 'activa', 'ktm', 'cycle'].includes(vType);

    if (aheadVehicle && aheadVehicle.position) {
      const centerDist = this.vehicle.position.distanceTo(aheadVehicle.position);
      const egoHalfD = (this.vehicle?.mesh?.userData?.halfD) || (this.idmParams.length / 2);
      const leadHalfD = (aheadVehicle.mesh?.userData?.halfD || aheadVehicle.userData?.halfD) || 2.2;
      distToLead = Math.max(0.1, centerDist - (egoHalfD + leadHalfD));
      vLead = aheadVehicle.npcAI?.currentSpeed || aheadVehicle.speed || 0;

      // ── Mumbai Micro-Behavior 1: Auto-Rickshaw Gap Probing ──
      if (isAuto && distToLead < 12.0) {
        this._probePhase = (this._probePhase || Math.random() * Math.PI * 2) + dt * 2.0;
        this._autoProbeOffset = Math.sin(this._probePhase) * 0.8;
      } else {
        this._autoProbeOffset = (this._autoProbeOffset || 0) * Math.exp(-dt * 3.0);
      }

      // ── Mumbai Micro-Behavior 2: Two-Wheeler / Bike Lane Filtering ──
      if (isBike && (vLead < 3.0 || distToLead < 12.0)) {
        if (!this._isFiltering) {
          this._isFiltering = true;
          this._filterOffset = (this.currentLane === 0 ? -1.2 : 1.2);
        }
        this.desiredSpeed = Math.max(3.5, Math.min(5.0, this.desiredSpeed));
        distToLead = Math.max(distToLead, 8.0);
      } else if (isBike) {
        this._isFiltering = false;
        this._filterOffset = (this._filterOffset || 0) * Math.exp(-dt * 3.5);
      }

      // If queued/crawling behind slow lead vehicle and road has multiple lanes, evaluate overtake
      if (distToLead < this.followDistance * 0.75 && this.laneChangeCooldown <= 0 && !this.isChangingLane && this.profile.overtakeThreshold > 0.15) {
        this._attemptOvertake(aheadVehicle);
      }
    } else {
      this._autoProbeOffset = (this._autoProbeOffset || 0) * Math.exp(-dt * 3.0);
      this._filterOffset = (this._filterOffset || 0) * Math.exp(-dt * 3.5);
      this._isFiltering = false;

      // Keep-left return evaluation on multi-lane road when cruising in right lane with no lead
      if (this.currentLane > 0 && this.laneChangeCooldown <= 0 && !this.isChangingLane && this.currentEdge && (this.currentEdge.lanes || 1) > 1) {
        const returnMobil = this.evaluateMOBIL([this.currentLane - 1], this.trafficManager);
        if (returnMobil && returnMobil.shouldChange) {
          this._startLaneChange(returnMobil.targetLane);
        }
      }
    }

    // 4. Calculate continuous IDM acceleration
    let rawAccel = this.calculateIDMAcceleration(aheadVehicle, distToLead, vLead, virtualObstacleDist);
    if (this._hornAlertTimer > 0) {
      rawAccel += (this._hornAlertDecel || -0.5) * (this._hornAlertTimer / 1.5);
    }
    this.currentAcceleration = Math.max(-(this.idmParams.bMax || 8.0), Math.min(this.idmParams.aMax, rawAccel));

    this._steerTowardsTarget(dt);
    this._maintainLane(dt);
  }

  _updateOvertake(dt: number, playerVehicle: any): void {
    this.overtakeTimer += dt;
    if (this.overtakePhase === 0) {
      if (!this.isChangingLane) {
        this.overtakePhase = 1;
      }
      this._maintainLane(dt);
    } else if (this.overtakePhase === 1) {
      this.desiredSpeed = this._getTargetSpeed() * 1.25;
      this._maintainLane(dt);
      if (this._overtakeComplete() && !this.isChangingLane && this.laneChangeCooldown <= 0) {
        this.overtakePhase = 2;
      }
    } else if (this.overtakePhase === 2) {
      const returnLane = Math.max(0, this.currentLane - 1);
      if (returnLane !== this.currentLane && !this.isChangingLane) {
        const mobil = this.evaluateMOBIL([returnLane], this.trafficManager);
        if (mobil && mobil.shouldChange) {
          this._startLaneChange(returnLane);
        } else if (this.overtakeTimer > 6.0) {
          if (this._isLaneClear(returnLane, this.overtakeTarget)) {
            this._startLaneChange(returnLane);
          }
        }
      }
      this.desiredSpeed = this._getTargetSpeed();
      this._maintainLane(dt);
      if (!this.isChangingLane && this._laneReturnComplete()) {
        this.state = NPC_STATE.FOLLOW_LANE;
        this.overtakeTimer = 0;
        this.overtakeTarget = null;
        this.overtakePhase = 0;
        this.laneChangeCooldown = 3.0 + Math.random() * 2.0;
      }
    }
    if (this.overtakeTimer > 12) this._abortOvertake();
  }

  _updateWaitSignal(dt: number, signals: any[]): void {
    this.waitTimer += dt;
    this.desiredSpeed = 0;
    const signal = this._getSignalAhead(signals);
    const stopDist = signal ? Math.max(0.1, this._distanceToSignal(signal) - 6.0) : 0.1;
    this.currentAcceleration = this.calculateIDMAcceleration(null, Infinity, 0, stopDist);

    if (!signal || signal.state === 'green' || this.waitTimer > 4.5) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.waitTimer = 0;
      this.signalViolation = false;
    } else if (this.waitTimer > 3.0 && this.profile.patience < 0.4) {
      this.signalViolation = true;
      this.state = NPC_STATE.FOLLOW_LANE;
    }
  }

  _updateSidewalkDetour(dt: number): void {
    this.state = NPC_STATE.FOLLOW_LANE;
    this.sidewalkTimer = 0;
  }

  _updatePark(dt: number): void {
    this.desiredSpeed = 0;
    this.currentAcceleration = -(this.idmParams?.b || 2.0);
  }

  _updateComplete(dt: number): void {
    this.desiredSpeed = 0;
    this.currentAcceleration = -(this.idmParams?.b || 2.0);
    this._respawn();
  }

  _updateCrash(dt: number): void {
    this.desiredSpeed = 0;
    this.currentAcceleration = -(this.idmParams?.bMax || 8.0);
    if (!this.crashTimer) this.crashTimer = 0;
    this.crashTimer += dt;
    if (this.crashTimer > 6) {
      this.crashTimer = 0;
      this._respawn();
    }
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

  /**
   * Calculates dynamic speed-dependent lookahead distance
   */
  calculateLookaheadDistance(speed: number | null = null): number {
    const v = Math.max(0, speed !== null ? speed : this.currentSpeed);
    const kLook = 0.85;
    const Lmin = 3.5;
    const Lmax = 20.0;
    return calcAdaptiveLookahead(v, kLook, Lmin, Lmax);
  }

  /**
   * Computes Adaptive Pure Pursuit trajectory steering towards lookahead point on road spline
   */
  computePurePursuitSteering(
    dt: number,
    lookaheadDist: number | null = null
  ): { alpha: number; kappa: number; steerAngle: number; yawRate: number; lookPoint: any; lookaheadDist: number } {
    if (!this.targetNode || !this.vehicle || !this.vehicle.position) {
      return { alpha: 0, kappa: 0, steerAngle: 0, yawRate: 0, lookPoint: null, lookaheadDist: 0 };
    }

    const v = Math.max(0, this.currentSpeed);
    const Ld = lookaheadDist !== null ? lookaheadDist : this.calculateLookaheadDistance(v);
    const wheelbase = this.idmParams?.wheelbase || 2.7;

    let lookPoint: any = null;

    if (this.currentEdge) {
      const edgeLen = Math.max(1.0, this.currentEdge.length || 100.0);
      const progress = Math.max(0, Math.min(1.0, this.vehicle.routeProgress || 0));
      const lookProgress = progress + (Ld / edgeLen);

      if (lookProgress <= 1.0) {
        lookPoint = this.currentEdge.getLaneCenter(this.currentLane, lookProgress);
      } else {
        let nextEdge: RoadEdge | null = null;
        if (this.route && this.route.length > 0 && this.routeIndex + 1 < this.route.length) {
          const nextNode = this.route[this.routeIndex + 1];
          if (this.roadGraph) {
            nextEdge = this.roadGraph.getEdgeTo(this.targetNode, nextNode);
          }
        }

        if (nextEdge) {
          const excessDist = (lookProgress - 1.0) * edgeLen;
          const nextEdgeLen = Math.max(1.0, nextEdge.length || 100.0);
          const nextProgress = Math.min(1.0, excessDist / nextEdgeLen);
          const nextLane = Math.min(this.currentLane, (nextEdge.lanes || 1) - 1);
          lookPoint = nextEdge.getLaneCenter(nextLane, nextProgress);
        } else {
          lookPoint = this.targetNode.position ? this.targetNode.position.clone() : null;
        }
      }
    }

    if (!lookPoint) {
      lookPoint = this.targetNode.position ? this.targetNode.position.clone() : this.vehicle.position.clone();
    }
    lookPoint.y = this.vehicle.position.y;

    const dx = lookPoint.x - this.vehicle.position.x;
    const dz = lookPoint.z - this.vehicle.position.z;
    const distToLook = Math.hypot(dx, dz);

    if (distToLook < 0.05) {
      return { alpha: 0, kappa: 0, steerAngle: 0, yawRate: 0, lookPoint, lookaheadDist: Ld };
    }

    const cosR = Math.cos(this.vehicle.rotation.y);
    const sinR = Math.sin(this.vehicle.rotation.y);
    const localX = dx * cosR - dz * sinR;
    const localZ = dx * sinR + dz * cosR;

    const effectiveSpeed = Math.max(v, 1.5);
    const pp = calcPurePursuit({ localX, localZ, Ld, wheelbase, speed: effectiveSpeed });

    const vType = (this.vehicle?.type || this.vehicle?.userData?.npcType || 'car').toLowerCase();
    let maxOmega = 1.8;
    if (['bike', 'splendor', 'activa', 'ktm', 'cycle', 'auto', 'auto_yellow'].includes(vType)) {
      maxOmega = 2.2;
    } else if (['bus', 'truck', 'ace'].includes(vType)) {
      maxOmega = 1.2;
    }

    const clampedYawRate = THREE.MathUtils.clamp(pp.yawRate, -maxOmega, maxOmega);

    return {
      alpha: pp.alpha,
      kappa: pp.kappa,
      steerAngle: pp.steerAngle,
      yawRate: clampedYawRate,
      lookPoint,
      lookaheadDist: Ld
    };
  }

  _steerTowardsTarget(dt: number): void {
    if (!this.targetNode) return;
    const toTarget = new THREE.Vector3().subVectors(this.targetNode.position, this.vehicle.position);
    toTarget.y = 0;
    const dist = toTarget.length();
    if (dist < 4.0 || ((this.vehicle.routeProgress || 0) >= 0.98 && dist < 8.0)) {
      this._advanceRoute();
      return;
    }

    const steering = this.computePurePursuitSteering(dt);
    this.vehicle.rotation.y += steering.yawRate * dt;
    while (this.vehicle.rotation.y > Math.PI) this.vehicle.rotation.y -= Math.PI * 2;
    while (this.vehicle.rotation.y < -Math.PI) this.vehicle.rotation.y += Math.PI * 2;
  }

  _maintainLane(dt: number): void {
    if (!this.currentEdge) return;
    const progress = Math.max(0, Math.min(1, this.vehicle.routeProgress || 0));

    // Dynamic lateral offset combining auto probing, bike filtering, and defensive yielding
    let subLaneOffset = (this._autoProbeOffset || 0) + (this._filterOffset || 0);
    if (this._hornAlertTimer > 0 && this._hornYieldOffset) {
      subLaneOffset += this._hornYieldOffset * (this._hornAlertTimer / 1.5);
    }

    const forward = this.currentEdge.getForwardVector ? this.currentEdge.getForwardVector(this.vehicle.currentNode || this.targetNode) : new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

    if (this.isChangingLane) {
      this.laneChangeProgress += dt / Math.max(0.1, this.laneChangeDuration);
      const u = Math.max(0, Math.min(1, this.laneChangeProgress));
      // Smooth sinusoidal transition curve: 0.5 * (1 - cos(pi * u))
      const blend = 0.5 * (1 - Math.cos(Math.PI * u));

      const startCenter = this.currentEdge.getLaneCenter(this.laneChangeStartLane, progress);
      const targetCenter = this.currentEdge.getLaneCenter(this.laneChangeTargetLane, progress);
      if (startCenter && targetCenter) {
        const laneCenter = new THREE.Vector3().lerpVectors(startCenter, targetCenter, blend);
        if (Math.abs(subLaneOffset) > 0.01) {
          laneCenter.addScaledVector(right, subLaneOffset);
        }
        const toCenter = new THREE.Vector3().subVectors(laneCenter, this.vehicle.position);
        toCenter.y = 0;
        const lateralOffset = toCenter.length();
        if (lateralOffset > 0.01) {
          const convergence = 1.0 - Math.exp(-dt * 5.0);
          this.vehicle.position.x += toCenter.x * convergence;
          this.vehicle.position.z += toCenter.z * convergence;
        }
      }

      if (this.laneChangeProgress >= 1.0) {
        this.currentLane = this.laneChangeTargetLane;
        if (this.vehicle) {
          this.vehicle.currentLane = this.currentLane;
          this.vehicle.targetLane = this.currentLane;
        }
        this.isChangingLane = false;
        this.laneChangeProgress = 0;
      }
    } else {
      const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, progress);
      if (!laneCenter) return;

      if (Math.abs(subLaneOffset) > 0.01) {
        laneCenter.addScaledVector(right, subLaneOffset);
      }

      // Smooth exponential convergence towards lane center (zero-jitter, framerate independent)
      const toCenter = new THREE.Vector3().subVectors(laneCenter, this.vehicle.position);
      toCenter.y = 0;
      const lateralOffset = toCenter.length();
      if (lateralOffset > 0.01) {
        const blend = 1.0 - Math.exp(-dt * 4.5);
        this.vehicle.position.x += toCenter.x * blend;
        this.vehicle.position.z += toCenter.z * blend;
      }
    }
  }

  _attemptOvertake(vehicle: any): void {
    if (!this.currentEdge || this.currentEdge.lanes < 2 || this.isChangingLane || this.laneChangeCooldown > 0) return;
    const mobil = this.evaluateMOBIL(null, this.trafficManager);
    if (mobil && mobil.shouldChange && mobil.targetLane !== this.currentLane) {
      this.state = NPC_STATE.OVERTAKE;
      this.overtakeTarget = vehicle;
      this.overtakeTimer = 0;
      this.overtakePhase = 0;
      this._startLaneChange(mobil.targetLane);
    }
  }

  _isLaneClear(lane: number, ignoreVehicle: any): boolean {
    if (!this.currentEdge) return false;
    const forward = this.currentEdge.getForwardVector(this.vehicle.currentNode || this.targetNode);
    let vehicles: any[] = [];
    if (this.trafficManager && typeof this.trafficManager.getVehiclesOnEdge === 'function') {
      vehicles = this.trafficManager.getVehiclesOnEdge(this.currentEdge.id) || [];
    }
    if (!vehicles.length && this.trafficManager && this.trafficManager.vehicles) {
      vehicles = this.trafficManager.vehicles.filter((v: any) => v && v.active && v.currentEdge === this.currentEdge);
    }
    return !vehicles.some((v: any) => {
      if (v === this.vehicle || v === ignoreVehicle || !v.position) return false;
      const vLane = typeof v.currentLane === 'number' ? v.currentLane : (v.npcAI?.currentLane || 0);
      if (vLane !== lane) return false;
      const toV = new THREE.Vector3().subVectors(v.position, this.vehicle.position);
      const dLong = toV.dot(forward);
      return dLong > -8 && dLong < 25;
    });
  }

  _initiateOvertake(): void {
    if (!this.isChangingLane && this.currentEdge) {
      const target = this.currentLane < (this.currentEdge.lanes || 1) - 1 ? this.currentLane + 1 : (this.currentLane > 0 ? this.currentLane - 1 : 0);
      this._startLaneChange(target);
    }
  }

  _executeOvertake(dt: number): void {
    this.desiredSpeed = this._getTargetSpeed() * 1.25;
    this._maintainLane(dt);
  }

  _overtakeComplete(): boolean {
    if (!this.overtakeTarget || !this.overtakeTarget.position) return true;
    const toTarget = new THREE.Vector3().subVectors(this.overtakeTarget.position, this.vehicle.position);
    const forward = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, Math.cos(this.vehicle.rotation.y));
    return toTarget.dot(forward) < -6;
  }

  _returnToLane(dt: number): void {
    this.desiredSpeed = this._getTargetSpeed();
    this._maintainLane(dt);
  }

  _laneReturnComplete(): boolean {
    if (!this.currentEdge) return true;
    const laneCenter = this.currentEdge.getLaneCenter(this.currentLane, this.vehicle.routeProgress || 0);
    if (!laneCenter) return true;
    return this.vehicle.position.distanceTo(laneCenter) < 1.0;
  }

  _abortOvertake(): void {
    this.state = NPC_STATE.FOLLOW_LANE;
    this.overtakeTimer = 0;
    this.overtakeTarget = null;
    this.overtakePhase = 0;
    this.laneChangeCooldown = 4.0;
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

  triggerHorn(reason: string = 'HORN_ALERT'): void {
    if (this.trafficManager?.audio && this.vehicle?.hornSound) {
      this.trafficManager.audio.playHorn(this.vehicle.hornSound, this.vehicle.position);
    } else if (typeof window !== 'undefined' && (window as any).sfx && (window as any).sfx.play) {
      (window as any).sfx.play('horn');
    }
    if (this.trafficManager && typeof this.trafficManager.propagateHornReaction === 'function' && this.vehicle && this.vehicle.position) {
      this.trafficManager.propagateHornReaction(this.vehicle.position, this.vehicle, 15.0);
    }
  }

  _honk(): void {
    this.triggerHorn('HONK');
  }

  receiveHornAlert(sourcePos: THREE.Vector3, sourceVehicle: any): void {
    this._hornAlertTimer = 1.5;
    this._hornAlertDecel = -0.5;
    this._hornYieldOffset = (Math.random() > 0.5 ? 0.3 : -0.3);

    if (!this._hornCascadeCooldown || this._hornCascadeCooldown <= 0) {
      this._hornCascadeCooldown = 5.0;
      const agg = this.profile?.aggression || 0.5;
      const cascadeProb = agg * 0.65;
      if (Math.random() < cascadeProb) {
        this._queuedHornTimer = 0.3 + Math.random() * 0.3;
      }
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
    this.currentAcceleration = -(this.idmParams?.b || 2.0) * 0.8;
    if (this.pullOverTimer > 8 || !this._isAmbulanceNearby()) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.pullOverTimer = 0;
      this.desiredSpeed = this._getTargetSpeed();
    }
  }

  _updateDistracted(dt: number): void {
    this.distractTimer += dt;
    this.vehicle.rotation.y += (Math.random() - 0.5) * 0.003;
    this.desiredSpeed = this._getTargetSpeed() * 0.5;
    this.currentAcceleration = this.calculateIDMAcceleration(null, Infinity, 0, Infinity);
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
    this.currentAcceleration = this.calculateIDMAcceleration(null, Infinity, 0, Infinity);
    if (this.rageTimer > 6) {
      this.state = NPC_STATE.FOLLOW_LANE;
      this.rageTimer = 0; this.rageLevel = 0;
      this.followDistance = this.idmParams.s0 + this.idmParams.v0 * this.idmParams.T;
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
    this.desiredSpeed = 0;
    this.currentAcceleration = -(this.idmParams?.bMax || 8.0);
    if (this.vehicle.brakeLights) this.vehicle.brakeLights.intensity = 3;
    if (this.currentSpeed < 0.1 || this.emergencyBrakeTimer > 3) {
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
        this.currentAcceleration = -(this.idmParams?.b || 2.0);
        this._honk();
      }
    }
    if (this.profileKey === 'tourist' && this.state === NPC_STATE.FOLLOW_LANE) {
      if (Math.random() < 0.002) this.vehicle.rotation.y += (Math.random() - 0.5) * 0.08;
    }
  }

  _getTargetSpeed(): number {
    const baseSpeed = this.currentEdge ? this.currentEdge.speedLimit / 3.6 : 10;
    const offset = this._speedVarianceOffset !== undefined ? this._speedVarianceOffset : 0;
    let speed = Math.max(2, baseSpeed * (1 + offset));
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
    const a = this.currentAcceleration !== undefined ? this.currentAcceleration : 0;
    this.currentSpeed = Math.max(0, this.currentSpeed + a * dt);
    if (this.currentSpeed < 0.01 && a <= 0) {
      this.currentSpeed = 0;
    }
    this.vehicle.speed = this.currentSpeed;

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
  IDLE: 'IDLE',
  WALKING: 'WALKING',
  WAITING: 'WAITING',
  CROSSING: 'CROSSING',
  JAYWALKING: 'JAYWALKING',
  FLEEING: 'FLEEING',
  FROZEN: 'FROZEN',
  WAITING_FOR_BUS: 'WAITING_FOR_BUS',
  QUEUING: 'QUEUING',
  BOARDING: 'BOARDING',
  IN_TRANSIT: 'IN_TRANSIT',
  ALIGHTING: 'ALIGHTING',
  WALKING_SIDEWALK: 'WALKING_SIDEWALK'
};

export interface PedProfile {
  speed: number;
  jaywalkChance: number;
  waitPatience: number;
  groupBehavior: number;
  ttcThreshold: number;
}

export const PED_PROFILES: Record<string, PedProfile> = {
  normal: { speed: 2.5, jaywalkChance: 0.15, waitPatience: 0.8, groupBehavior: 0.3, ttcThreshold: 4.0 },
  rusher: { speed: 4.0, jaywalkChance: 0.50, waitPatience: 0.2, groupBehavior: 0.1, ttcThreshold: 3.0 },
  aggressive: { speed: 3.5, jaywalkChance: 0.45, waitPatience: 0.25, groupBehavior: 0.1, ttcThreshold: 3.0 },
  cautious: { speed: 1.8, jaywalkChance: 0.02, waitPatience: 0.95, groupBehavior: 0.5, ttcThreshold: 5.5 },
  child: { speed: 2.0, jaywalkChance: 0.30, waitPatience: 0.4, groupBehavior: 0.7, ttcThreshold: 4.5 },
  elderly_ped: { speed: 1.2, jaywalkChance: 0.05, waitPatience: 0.9, groupBehavior: 0.4, ttcThreshold: 5.5 },
  phone_user: { speed: 1.5, jaywalkChance: 0.35, waitPatience: 0.3, groupBehavior: 0.1, ttcThreshold: 3.5 }
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
  currentBusStop: any = null;
  assignedBus: any = null;
  transitTimer: number = 0;
  private _groundY: number = 0;
  private _animT: number = 0;
  private _waitThreshold: number | null = null;

  constructor(pedMesh: THREE.Object3D, trafficManager: any) {
    this.ped = pedMesh;
    this.tm = trafficManager;
    this.profileKey = (pedMesh as any)?.profileKey || (pedMesh as any)?.userData?.profileKey || pickRandomPedProfile();
    this.profile = PED_PROFILES[this.profileKey] || PED_PROFILES.normal;
    this.state = PED_STATE.WALKING;
    this.facing = Math.random() * Math.PI * 2;
    this._syncMeshState();
  }

  _syncMeshState(): void {
    if (!this.ped) return;
    (this.ped as any).state = this.state;
    if (!this.ped.userData) this.ped.userData = {};
    this.ped.userData.aiState = this.state.toLowerCase();
    this.ped.userData.state = this.state.toLowerCase();
  }

  evaluateTTC(oncomingVehicles: any[]): { safeToCross: boolean; minTTC: number; minDLong: number; oncomingCount: number } {
    if (!this.ped || !this.ped.position) return { safeToCross: true, minTTC: Infinity, minDLong: Infinity, oncomingCount: 0 };
    const pedPos = this.ped.position;
    let minTTC = Infinity;
    let minDLong = Infinity;
    let oncomingCount = 0;

    const vehicles = Array.isArray(oncomingVehicles) ? oncomingVehicles : [];
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (!v) continue;
      const vPos = v.position || (v.mesh && v.mesh.position);
      if (!vPos) continue;

      let vSpeed = 0;
      let vHeading = 0;

      if (v.velocity && (v.velocity.x !== undefined || v.velocity.z !== undefined)) {
        vSpeed = Math.hypot(v.velocity.x || 0, v.velocity.z || 0);
        vHeading = Math.atan2(v.velocity.x || 0, v.velocity.z || 0);
      } else {
        vSpeed = Math.abs(v.speed !== undefined ? v.speed : (v.userData?.spd ? v.userData.spd * 20 : 0));
        const rotY = v.rotation ? (typeof v.rotation.y === 'number' ? v.rotation.y : v.rotation) : (v.mesh?.rotation?.y || 0);
        vHeading = rotY;
      }

      const ttcRes = calcPedestrianTTC({
        pedX: pedPos.x,
        pedZ: pedPos.z,
        vehX: vPos.x,
        vehZ: vPos.z,
        vehHeading: vHeading,
        vehSpeed: vSpeed,
        laneWidth: 3.5
      });

      if (ttcRes.oncoming) {
        oncomingCount++;
        if (ttcRes.ttc < minTTC) {
          minTTC = ttcRes.ttc;
          minDLong = ttcRes.dLong;
        }
      }
    }

    const threshold = this.profile.ttcThreshold || 4.0;
    const safeToCross = minTTC >= threshold;
    return { safeToCross, minTTC, minDLong, oncomingCount };
  }

  triggerFlee(threatPosition?: THREE.Vector3, threatDir?: THREE.Vector3): void {
    if (!this.ped || !this.ped.position) return;
    this.state = PED_STATE.FLEEING;
    this.fleeTimer = 0;
    this._syncMeshState();

    const myPos = this.ped.position;
    let away: THREE.Vector3;
    if (threatPosition) {
      away = new THREE.Vector3().subVectors(myPos, threatPosition);
      away.y = 0;
      if (away.lengthSq() < 0.01) away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      away.normalize();
    } else if (threatDir) {
      away = threatDir.clone().normalize();
      away.y = 0;
    } else {
      away = new THREE.Vector3(Math.sin(this.facing + Math.PI), 0, Math.cos(this.facing + Math.PI));
    }

    const roadC = this.ped.userData?.roadC || 0;
    const isV = this.ped.userData?.isV !== false;
    const lateralDir = isV ? (myPos.x >= roadC ? 1 : -1) : (myPos.z >= roadC ? 1 : -1);
    if (isV) {
      away.x += lateralDir * 0.8;
    } else {
      away.z += lateralDir * 0.8;
    }
    away.normalize();

    this.target = myPos.clone().addScaledVector(away, 12);
    this.facing = Math.atan2(away.x, away.z);
    this.ped.rotation.y = this.facing;
  }

  handleBusStopLifecycle(busStop: any, dt: number): void {
    if (!busStop || !this.ped || !this.ped.position) return;
    this.currentBusStop = busStop;
    this.transitTimer = (this.transitTimer || 0) + dt;

    const myPos = this.ped.position;
    const stopX = busStop.x || 0;
    const stopZ = busStop.z || 0;

    switch (this.state) {
      case PED_STATE.WAITING_FOR_BUS:
      case PED_STATE.WAITING: {
        const shelterX = stopX + (this.ped.userData?.shelterOffset?.x || 0);
        const shelterZ = stopZ + (this.ped.userData?.shelterOffset?.z || 0);
        const distToShelter = Math.hypot(myPos.x - shelterX, myPos.z - shelterZ);
        if (distToShelter > 1.0) {
          const dirX = (shelterX - myPos.x) / distToShelter;
          const dirZ = (shelterZ - myPos.z) / distToShelter;
          myPos.x += dirX * this.profile.speed * dt;
          myPos.z += dirZ * this.profile.speed * dt;
          this._smoothFacing({ x: dirX, z: dirZ }, dt);
        }

        const npcs = this.tm?.vehicles || this.tm?.game?.npcs || [];
        for (let i = 0; i < npcs.length; i++) {
          const npc = npcs[i];
          const nPos = npc.position || npc.mesh?.position;
          if (!nPos) continue;
          const isBus = npc.type === 'bus' || npc.userData?.npcType === 'bus' || npc.userData?.type === 'bus';
          const distToBus = Math.hypot(nPos.x - stopX, nPos.z - stopZ);
          if (isBus && distToBus < 15.0) {
            this.state = PED_STATE.QUEUING;
            this.assignedBus = npc;
            this.transitTimer = 0;
            this._syncMeshState();
            break;
          }
        }
        break;
      }

      case PED_STATE.QUEUING: {
        const curbX = stopX + (this.ped.userData?.curbOffset?.x || 2.5);
        const curbZ = stopZ + (this.ped.userData?.curbOffset?.z || 0);
        const distToCurb = Math.hypot(myPos.x - curbX, myPos.z - curbZ);
        if (distToCurb > 0.5) {
          const dirX = (curbX - myPos.x) / distToCurb;
          const dirZ = (curbZ - myPos.z) / distToCurb;
          myPos.x += dirX * this.profile.speed * dt;
          myPos.z += dirZ * this.profile.speed * dt;
          this._smoothFacing({ x: dirX, z: dirZ }, dt);
        }

        const bus = this.assignedBus;
        const busSpeed = bus ? (bus.speed !== undefined ? bus.speed : (bus.userData?.spd || 0)) : 1;
        const busState = bus?.npcAI?.state;
        if (bus && (Math.abs(busSpeed) < 0.2 || busState === 'BUS_STOP') && this.transitTimer > 0.5) {
          this.state = PED_STATE.BOARDING;
          this.transitTimer = 0;
          this._syncMeshState();
        }
        break;
      }

      case PED_STATE.BOARDING: {
        const bus = this.assignedBus;
        const busPos = bus ? (bus.position || bus.mesh?.position) : null;
        if (busPos) {
          const doorX = busPos.x;
          const doorZ = busPos.z;
          const distToDoor = Math.hypot(myPos.x - doorX, myPos.z - doorZ);
          if (distToDoor > 0.8) {
            const dirX = (doorX - myPos.x) / distToDoor;
            const dirZ = (doorZ - myPos.z) / distToDoor;
            myPos.x += dirX * this.profile.speed * 0.9 * dt;
            myPos.z += dirZ * this.profile.speed * 0.9 * dt;
            this._smoothFacing({ x: dirX, z: dirZ }, dt);
          } else {
            this.state = PED_STATE.IN_TRANSIT;
            this.ped.visible = false;
            this._syncMeshState();
          }
        } else {
          this.state = PED_STATE.WALKING;
          this._syncMeshState();
        }
        break;
      }

      case PED_STATE.ALIGHTING: {
        const sidewalkX = stopX + (this.ped.userData?.side > 0 ? 5.0 : -5.0);
        const sidewalkZ = stopZ;
        const distToSidewalk = Math.hypot(myPos.x - sidewalkX, myPos.z - sidewalkZ);
        if (distToSidewalk > 1.0) {
          const dirX = (sidewalkX - myPos.x) / distToSidewalk;
          const dirZ = (sidewalkZ - myPos.z) / distToSidewalk;
          myPos.x += dirX * this.profile.speed * dt;
          myPos.z += dirZ * this.profile.speed * dt;
          this._smoothFacing({ x: dirX, z: dirZ }, dt);
        } else {
          this.state = PED_STATE.WALKING;
          this._syncMeshState();
        }
        break;
      }
    }
  }

  update(dt: number, npcs: any[], playerVehicle: any): void {
    if (!this.ped || !this.ped.position) return;
    this.lookTimer += dt;

    const allVehicles: any[] = [];
    if (playerVehicle && playerVehicle.position) {
      allVehicles.push(playerVehicle);
    }
    if (npcs && Array.isArray(npcs)) {
      for (let i = 0; i < npcs.length; i++) {
        if (npcs[i]) allVehicles.push(npcs[i]);
      }
    }

    if (this.state !== PED_STATE.FLEEING && this.state !== PED_STATE.IN_TRANSIT && this.state !== PED_STATE.FROZEN) {
      this._checkVehicleProximity(playerVehicle, npcs);
    }

    if (this.currentBusStop && (this.state === PED_STATE.WAITING_FOR_BUS || this.state === PED_STATE.QUEUING || this.state === PED_STATE.BOARDING || this.state === PED_STATE.ALIGHTING)) {
      this.handleBusStopLifecycle(this.currentBusStop, dt);
    } else {
      switch (this.state) {
        case PED_STATE.WALKING:
        case PED_STATE.WALKING_SIDEWALK:
          this._updateWalking(dt, allVehicles);
          break;
        case PED_STATE.WAITING:
          this._updateWaiting(dt, allVehicles);
          break;
        case PED_STATE.CROSSING:
          this._updateCrossing(dt, allVehicles);
          break;
        case PED_STATE.JAYWALKING:
          this._updateJaywalking(dt, allVehicles);
          break;
        case PED_STATE.FLEEING:
          this._updateFleeing(dt);
          break;
        case PED_STATE.FROZEN:
          break;
        default:
          this._updateWalking(dt, allVehicles);
          break;
      }
    }

    this._updateLegAnimation(dt);
    this._keepOnGround();
    this._syncMeshState();
  }

  _smoothFacing(dir: { x: number; z: number }, dt: number): void {
    if (!dir || (dir.x === 0 && dir.z === 0)) return;
    const targetFacing = Math.atan2(dir.x, dir.z);
    let diff = targetFacing - (this.facing || 0);
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facing = (this.facing || 0) + diff * Math.min(1, dt * 10);
    this.ped.rotation.y = this.facing;
  }

  _updateWalking(dt: number, _allVehicles: any[]): void {
    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5) {
        this.state = PED_STATE.WAITING;
        this.waitTimer = 0;
        this.target = null;
        this._syncMeshState();
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * this.profile.speed * dt;
      this.ped.position.z += dir.z * this.profile.speed * dt;
      this._smoothFacing(dir, dt);
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

  _updateWaiting(dt: number, allVehicles: any[]): void {
    this.waitTimer += dt;

    if (this.lookTimer > 1.5) {
      this.lookTimer = 0;
      this.facing += (Math.random() - 0.5) * 1.5;
      this.ped.rotation.y = this.facing;
    }

    if (!this._waitThreshold) {
      this._waitThreshold = 1.5 + (1.0 - this.profile.waitPatience) * 4.0;
    }

    if (this.waitTimer >= this._waitThreshold) {
      const ttcEval = this.evaluateTTC(allVehicles);
      const isJaywalk = Math.random() < this.profile.jaywalkChance;

      if (ttcEval.safeToCross) {
        if (isJaywalk) {
          this.state = PED_STATE.JAYWALKING;
        } else {
          this.state = PED_STATE.CROSSING;
        }
        this.crossingTimer = 0;
        this._waitThreshold = null;
        this._pickCrossingTarget();
        this._syncMeshState();
      }
    }
  }

  _updateCrossing(dt: number, _allVehicles: any[]): void {
    this.crossingTimer += dt;

    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.crossingTimer > 12) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        if (this.ped.userData) {
          this.ped.userData.side = -(this.ped.userData.side || 1);
          this.ped.userData.distTraveled = 0;
          this.ped.userData.destDist = 15 + Math.random() * 25;
        }
        this._syncMeshState();
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * this.profile.speed * dt;
      this.ped.position.z += dir.z * this.profile.speed * dt;
      this._smoothFacing(dir, dt);
    }
  }

  _updateJaywalking(dt: number, _allVehicles: any[]): void {
    this.crossingTimer += dt;
    const jaywalkSpeed = this.profile.speed * 1.3;

    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.crossingTimer > 10) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        if (this.ped.userData) {
          this.ped.userData.side = -(this.ped.userData.side || 1);
          this.ped.userData.distTraveled = 0;
          this.ped.userData.destDist = 15 + Math.random() * 25;
        }
        this._syncMeshState();
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * jaywalkSpeed * dt;
      this.ped.position.z += dir.z * jaywalkSpeed * dt;
      this._smoothFacing(dir, dt);
    }
  }

  _updateFleeing(dt: number): void {
    this.fleeTimer += dt;
    const sprintSpeed = this.profile.speed * 1.8;

    if (this.target) {
      const toTarget = new THREE.Vector3().subVectors(this.target, this.ped.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 1.5 || this.fleeTimer > 3.0) {
        this.state = PED_STATE.WALKING;
        this.target = null;
        this._syncMeshState();
        return;
      }
      const dir = toTarget.normalize();
      this.ped.position.x += dir.x * sprintSpeed * dt;
      this.ped.position.z += dir.z * sprintSpeed * dt;
      this._smoothFacing(dir, dt);
    } else {
      if (this.fleeTimer > 2.5) {
        this.state = PED_STATE.WALKING;
        this._syncMeshState();
      }
    }
  }

  _checkVehicleProximity(playerVehicle: any, npcs: any[]): void {
    if (this.state === PED_STATE.FLEEING || this.state === PED_STATE.FROZEN) return;
    const myPos = this.ped.position;

    if (playerVehicle && playerVehicle.position) {
      const dist = myPos.distanceTo(playerVehicle.position);
      if (dist < 15.0) {
        let pSpeed = Math.abs(playerVehicle.speed || 0);
        let pHeading = playerVehicle.rotation?.y || 0;
        if (playerVehicle.velocity) {
          pSpeed = Math.hypot(playerVehicle.velocity.x || 0, playerVehicle.velocity.z || 0);
          pHeading = Math.atan2(playerVehicle.velocity.x || 0, playerVehicle.velocity.z || 0);
        }
        const ttcRes = calcPedestrianTTC({
          pedX: myPos.x,
          pedZ: myPos.z,
          vehX: playerVehicle.position.x,
          vehZ: playerVehicle.position.z,
          vehHeading: pHeading,
          vehSpeed: pSpeed,
          laneWidth: 3.5
        });
        const fleeCheck = evaluatePedestrianFleeing({
          minTTC: ttcRes.ttc,
          dLong: ttcRes.dLong,
          currentSpeed: this.profile.speed,
          walkSpeed: this.profile.speed
        });
        if (fleeCheck.shouldFlee || (dist < 6.0 && ttcRes.oncoming && ttcRes.ttc < 2.0) || dist < 4.0) {
          this.triggerFlee(playerVehicle.position);
          return;
        }
      }
    }

    if (npcs && Array.isArray(npcs)) {
      for (let i = 0; i < npcs.length; i++) {
        const npc = npcs[i];
        if (!npc) continue;
        const nPos = npc.position || npc.mesh?.position;
        if (!nPos) continue;
        const dist = myPos.distanceTo(nPos);
        if (dist < 15.0) {
          let nSpeed = Math.abs(npc.speed !== undefined ? npc.speed : (npc.userData?.spd ? npc.userData.spd * 20 : 0));
          let nHeading = npc.rotation ? (typeof npc.rotation.y === 'number' ? npc.rotation.y : npc.rotation) : (npc.mesh?.rotation?.y || 0);
          if (npc.velocity) {
            nSpeed = Math.hypot(npc.velocity.x || 0, npc.velocity.z || 0);
            nHeading = Math.atan2(npc.velocity.x || 0, npc.velocity.z || 0);
          }
          const ttcRes = calcPedestrianTTC({
            pedX: myPos.x,
            pedZ: myPos.z,
            vehX: nPos.x,
            vehZ: nPos.z,
            vehHeading: nHeading,
            vehSpeed: nSpeed,
            laneWidth: 3.5
          });
          const fleeCheck = evaluatePedestrianFleeing({
            minTTC: ttcRes.ttc,
            dLong: ttcRes.dLong,
            currentSpeed: this.profile.speed,
            walkSpeed: this.profile.speed
          });
          if (fleeCheck.shouldFlee || (dist < 6.0 && ttcRes.oncoming && ttcRes.ttc < 2.0) || dist < 4.0) {
            this.triggerFlee(nPos);
            return;
          }
        }
      }
    }
  }

  _pickCrossingTarget(): void {
    const isV = this.ped.userData?.isV;
    const roadC = this.ped.userData?.roadC || 0;
    const curSide = this.ped.userData?.side || 1;
    const otherSide = -curSide;
    const targetDist = this.ped.userData?.targetDist || (18 / 2 + 1.25);
    const crossOffset = otherSide * targetDist;

    if (isV !== undefined) {
      this.target = new THREE.Vector3(
        isV ? roadC + crossOffset : this.ped.position.x,
        0,
        isV ? this.ped.position.z : roadC + crossOffset
      );
    } else {
      const crossAngle = this.facing + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const crossDist = 12 + Math.random() * 8;
      this.target = new THREE.Vector3(
        this.ped.position.x + Math.sin(crossAngle) * crossDist,
        0,
        this.ped.position.z + Math.cos(crossAngle) * crossDist
      );
    }
  }

  _updateLegAnimation(dt: number): void {
    if (!this.ped) return;
    const isFleeing = this.state === PED_STATE.FLEEING;
    const isMoving = this.state === PED_STATE.WALKING || this.state === PED_STATE.CROSSING || this.state === PED_STATE.JAYWALKING || isFleeing || this.state === PED_STATE.BOARDING || this.state === PED_STATE.ALIGHTING;

    this._animT = (this._animT || 0) + dt * (isFleeing ? 20.0 : (isMoving ? 10.0 : 0.5));

    const lLeg = this.ped.children && this.ped.children.find(c => c.name === 'lLeg');
    const rLeg = this.ped.children && this.ped.children.find(c => c.name === 'rLeg');
    if (lLeg && rLeg) {
      if (isMoving) {
        const amp = isFleeing ? 0.75 : 0.45;
        (lLeg as any).rotation.x = Math.sin(this._animT) * amp;
        (rLeg as any).rotation.x = -Math.sin(this._animT) * amp;
      } else {
        (lLeg as any).rotation.x = 0;
        (rLeg as any).rotation.x = 0;
      }
    }

    if (this.ped.userData && this.ped.userData.isFBXAnimated && this.ped.userData.mixer) {
      const targetIdle = isMoving ? 0 : 1;
      const targetRun = isMoving ? 1 : 0;
      if (this.ped.userData.idleAction && this.ped.userData.runAction) {
        const curIdle = this.ped.userData.idleAction.getEffectiveWeight();
        const curRun = this.ped.userData.runAction.getEffectiveWeight();
        this.ped.userData.idleAction.setEffectiveWeight(curIdle + (targetIdle - curIdle) * 0.1);
        this.ped.userData.runAction.setEffectiveWeight(curRun + (targetRun - curRun) * 0.1);
      }
      this.ped.userData.mixer.update(dt);
    }
  }

  _keepOnGround(): void {
    if (!this._groundY) this._groundY = this.ped.position.y > 0.1 ? 0.5 : 0;
    this.ped.position.y = this._groundY;
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).NPC_STATE = NPC_STATE;
  (window as any).NPC_PROFILES = NPC_PROFILES;
  (window as any).VehicleClassProfiles = VehicleClassProfiles;
  (window as any).calcIDMDesiredGap = calcIDMDesiredGap;
  (window as any).calcIDMAcceleration = calcIDMAcceleration;
  (window as any).evaluateMOBILDecision = evaluateMOBILDecision;
  (window as any).calcAdaptiveLookahead = calcAdaptiveLookahead;
  (window as any).calcPurePursuit = calcPurePursuit;
  (window as any).calcPedestrianTTC = calcPedestrianTTC;
  (window as any).evaluatePedestrianGapAcceptance = evaluatePedestrianGapAcceptance;
  (window as any).evaluatePedestrianFleeing = evaluatePedestrianFleeing;
  (window as any).arbitrateDeadlock = arbitrateDeadlock;
  (window as any).NPCAI = NPCAI;
  (window as any).pickRandomProfile = pickRandomProfile;
  (window as any).PED_STATE = PED_STATE;
  (window as any).PED_PROFILES = PED_PROFILES;
  (window as any).PedestrianAI = PedestrianAI;
  (window as any).pickRandomPedProfile = pickRandomPedProfile;
}