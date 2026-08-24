// @ts-nocheck
/**
 * TrafficManager — migrated from traffic-manager.js
 * NPC traffic management: spawning, density control, signal accumulation, platoons
 */

import * as THREE from 'three';
import { RoadGraph, RoadNode, RoadEdge } from './RoadGraph';
import { RuleBreakerProfile, pickRuleBreakerType } from '@game/RuleBreakerProfiles';

const VEHICLE_VARIETY_WEIGHTS: Record<string, number> = {
  car: 0.35, bike: 0.25, auto: 0.15, bus: 0.10,
  truck: 0.08, taxi: 0.05, ambulance: 0.02
};

const VEHICLE_CLASS_LANE_ACCESS: Record<string, string[]> = {
  car: ['car', 'bus'], bike: ['bike', 'car', 'bus'], auto: ['car', 'bus'],
  bus: ['bus'], truck: ['bus', 'car'], taxi: ['car', 'bus'],
  ambulance: ['bus', 'car']
};

const RULE_BREAKER_PROBABILITY = 0.20;
const PLATOON_SIZE = 3;
const PLATOON_GAP = 8;
const BASE_NPC_COUNT = 16;
const MAX_NPC_COUNT = 48;
const MOBILE_NPC_COUNT = 16;
const SPAWN_RADIUS = 400;
const SPAWN_MIN_GAP = 20;
const SPAWN_MAX_GAP = 60;
const DENSITY_INCREASE_PER_MIN = 0.05;
const SIGNAL_ACCUMULATION_RATE = 5;
const MAX_SIGNAL_ACCUMULATION = 12;

function isMobile(): boolean {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

function getMaxNPCCount(): number {
  return isMobile() ? MOBILE_NPC_COUNT : MAX_NPC_COUNT;
}

function getBaseNPCCount(): number {
  return isMobile() ? MOBILE_NPC_COUNT : BASE_NPC_COUNT;
}

export interface VehicleInstance {
  id: string;
  type: string;
  active: boolean;
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  velocity: THREE.Vector3;
  speed: number;
  mesh: THREE.Object3D;
  stats: any;
  profileKey: string;
  npcAI: any;
  currentNode: RoadNode | null;
  currentEdge: RoadEdge | null;
  currentLane: number;
  routeProgress: number;
  targetNode: RoadNode | null;
  health: number;
  isRuleBreaker: boolean;
}

export interface SpawnPoint {
  position: THREE.Vector3;
  rotation: number;
  node: RoadNode;
  edge: RoadEdge;
  lane: number;
}

export class TrafficManager {
  game: any;
  vehicles: VehicleInstance[] = [];
  vehiclePools: Map<string, VehicleInstance[]> = new Map();
  edgeVehicles: Map<string, VehicleInstance[]> = new Map();
  parkingSpots: any[] = [];
  densityMultiplier: number = 1.0;
  timeAtSignal: number = 0;
  signalAccumulation: number = 0;
  lastDensityUpdate: number = 0;
  platoons: Platoon[] = [];
  ruleBreakerCount: number = 0;
  totalSpawned: number = 0;
  audio: any = null;
  roadGraph: RoadGraph | null = null;
  mainRoute: RoadNode[] = [];
  levelConfig: any = {};
  levelNpcTypes: string[] = [];
  levelNpcs: any[] = [];
  levelNpcIndex: number = 0;

  constructor(game: any) {
    this.game = game;
    this._initPools();
  }

  _initPools(): void {
    Object.keys(VEHICLE_VARIETY_WEIGHTS).forEach(type => {
      this.vehiclePools.set(type, []);
    });
  }

  update(dt: number, playerVehicle: any, signals: any[]): void {
    this._updateDensity(dt);
    this._updatePlatoons(dt);
    this._updateSignalAccumulation(dt, signals);
    this._manageVehicleLifecycle(playerVehicle);
    this._updateEdgeIndex();

    const COMPLETE = (window as any).NPC_STATE?.COMPLETE || 'COMPLETE';
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

  _updateDensity(dt: number): void {
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

  _updateSignalAccumulation(dt: number, signals: any[]): void {
    const redSignals = signals ? signals.filter(s => s.state === 'red').length : 0;
    if (redSignals > 0) {
      this.timeAtSignal += dt;
      this.signalAccumulation = Math.min(MAX_SIGNAL_ACCUMULATION, this.signalAccumulation + SIGNAL_ACCUMULATION_RATE * dt / 60);
    } else {
      this.timeAtSignal = 0;
      this.signalAccumulation = Math.max(0, this.signalAccumulation - dt / 10);
    }
  }

  _updatePlatoons(dt: number): void {
    this.platoons.forEach(platoon => platoon.update(dt, this));
    this.platoons = this.platoons.filter(p => p.active && p.followers && p.followers.length > 0);
  }

  _manageVehicleLifecycle(playerVehicle: any): void {
    const despawnDist = 400;
    const playerPos = playerVehicle?.position || new THREE.Vector3();
    this.vehicles.forEach(vehicle => {
      if (!vehicle.active) return;
      const dist = vehicle.position.distanceTo(playerPos);
      if (dist > despawnDist) this._despawnVehicle(vehicle);
    });
  }

  _updateEdgeIndex(): void {
    this.edgeVehicles.clear();
    this.vehicles.forEach(v => {
      if (!v.active || !v.currentEdge) return;
      if (!this.edgeVehicles.has(v.currentEdge.id)) this.edgeVehicles.set(v.currentEdge.id, []);
      this.edgeVehicles.get(v.currentEdge.id)!.push(v);
    });
  }

  spawnInitialTraffic(roadGraph: RoadGraph, route: any[], count = BASE_NPC_COUNT, levelConfig: any = {}): void {
    this.roadGraph = roadGraph;
    this.mainRoute = this._resolveRouteNodes(route);
    this.levelConfig = levelConfig;
    this.levelNpcTypes = levelConfig.npcTypes || [];
    this.levelNpcs = levelConfig.npcs || [];
    this.levelNpcIndex = 0;
    this._spawnBatch(count);
  }

  _resolveRouteNodes(route: any[]): RoadNode[] {
    if (!Array.isArray(route) || !this.roadGraph || typeof this.roadGraph.getNearestNode !== 'function') return [];
    const out: RoadNode[] = [];
    route.forEach(p => {
      if (!p) return;
      if (p.edges && p.position) { if (out[out.length - 1] !== p) out.push(p); return; }
      if (typeof p.x !== 'number' || typeof p.z !== 'number') return;
      const node = this.roadGraph.getNearestNode(p.x, p.z);
      if (node && out[out.length - 1] !== node) out.push(node);
    });
    return out;
  }

  _spawnBatch(count: number): void {
    for (let i = 0; i < count; i++) this._spawnSingleVehicle();
  }

  _spawnSingleVehicle(): VehicleInstance | null {
    let type: string, isRuleBreaker: boolean, profileKey: string, color: number, route: any[] | null = null;

    if (this.levelNpcs.length > 0 && this.levelNpcIndex < this.levelNpcs.length) {
      const npcConfig = this.levelNpcs[this.levelNpcIndex];
      type = npcConfig.type; route = npcConfig.route; color = npcConfig.color;
      isRuleBreaker = ['reckless_bike', 'rulebreaker', 'aggressive'].includes(type) || Math.random() < RULE_BREAKER_PROBABILITY;
      profileKey = isRuleBreaker
        ? this._pickProfileKey('reckless_bike', 'rulebreaker', 'aggressive')
        : this._pickProfileKey('normal', 'cautious', 'delivery', 'elderly');
      this.levelNpcIndex++;
    } else {
      type = this._pickVehicleType();
      isRuleBreaker = Math.random() < RULE_BREAKER_PROBABILITY && this.ruleBreakerCount / Math.max(1, this.totalSpawned) < RULE_BREAKER_PROBABILITY;
      profileKey = isRuleBreaker
        ? this._pickProfileKey('reckless_bike', 'rulebreaker', 'aggressive')
        : this._pickProfileKey('normal', 'cautious', 'delivery', 'elderly');
      color = this._pickColorForType(type);
    }

    const vehicle = this._createVehicle(type, color, profileKey, isRuleBreaker);
    if (!vehicle) return null;

    const spawnPoint = this._findSpawnPoint();
    if (!spawnPoint) { this._returnToPool(vehicle); return null; }

    vehicle.position.copy(spawnPoint.position);
    vehicle.rotation.y = spawnPoint.rotation;
    vehicle.currentNode = spawnPoint.node;
    vehicle.currentEdge = spawnPoint.edge;
    vehicle.currentLane = spawnPoint.lane;
    vehicle.routeProgress = 0;
    vehicle.targetNode = this._getNextRouteNode(vehicle.currentNode);
    vehicle.active = true;
    vehicle.health = 100;
    vehicle.mesh.position.copy(vehicle.position);
    vehicle.mesh.rotation.y = vehicle.rotation.y;
    vehicle.mesh.visible = true;

    vehicle.npcAI = new (window as any).NPCAI(vehicle, this.roadGraph, this);
    vehicle.npcAI.trafficManager = this;
    vehicle.profile = vehicle.npcAI.profile;
    vehicle.isRuleBreaker = isRuleBreaker;

    if (route) {
      const resolvedRoute = this._resolveRouteNodes(route);
      if (resolvedRoute.length >= 2) vehicle.npcAI.setRoute(resolvedRoute.slice(1));
      else this._assignRoute(vehicle);
    } else {
      this._assignRoute(vehicle);
    }

    if (isRuleBreaker) this.ruleBreakerCount++;
    this.totalSpawned++;
    this.vehicles.push(vehicle);
    this.game.scene.add(vehicle.mesh);
    if (this.game.npcs) this.game.npcs.push(vehicle.mesh);
    this._maybeFormPlatoon(vehicle);
    return vehicle;
  }

  _assignRoute(vehicle: VehicleInstance): boolean {
    if (!this.roadGraph || !vehicle.npcAI || !vehicle.currentNode) return false;
    const dest = this._pickDestinationNode(vehicle.currentNode);
    if (!dest) return false;
    const path = this.roadGraph!.findPath(vehicle.currentNode, dest);
    if (!path || path.length < 2) return false;
    vehicle.npcAI.setRoute(path.slice(1));
    return true;
  }

  _pickDestinationNode(fromNode: RoadNode): RoadNode | null {
    if (!this.roadGraph || !this.roadGraph.nodes) return null;
    const nodes = Array.from(this.roadGraph.nodes.values());
    if (nodes.length < 2) return null;
    let best: RoadNode | null = null, bestDist = -1;
    for (let i = 0; i < 6; i++) {
      const n = nodes[Math.floor(Math.random() * nodes.length)];
      if (n === fromNode) continue;
      const d = n.position.distanceTo(fromNode.position);
      if (d > bestDist) { bestDist = d; best = n; }
    }
    return best;
  }

  _pickProfileKey(...allowedKeys: string[]): string {
    const profiles = (window as any).NPC_PROFILES || {};
    const keys = (allowedKeys.length ? allowedKeys : Object.keys(profiles)).filter(k => profiles[k]);
    return keys.length ? keys[Math.floor(Math.random() * keys.length)] : 'normal';
  }

  _pickVehicleType(): string {
    let rand = Math.random(), cumulative = 0;
    for (const [type, weight] of Object.entries(VEHICLE_VARIETY_WEIGHTS)) {
      cumulative += weight;
      if (rand < cumulative) return type;
    }
    return 'car';
  }

  _pickColorForType(type: string): number {
    const colors: Record<string, number[]> = {
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

  _createVehicle(type: string, color: number, profileKey: string, isRuleBreaker: boolean): VehicleInstance | null {
    let vehicle: VehicleInstance | null = null;
    if (this.vehiclePools.has(type)) {
      const pool = this.vehiclePools.get(type)!;
      if (pool.length > 0) {
        vehicle = pool.pop()!;
        this._resetVehicle(vehicle, color, profileKey);
        return vehicle;
      }
    }

    const mesh = this._createVehicleMesh(type, color);
    if (!mesh) return null;

    vehicle = {
      id: `npc_${type}_${Math.random().toString(36).substr(2, 9)}`,
      type, active: false,
      position: new THREE.Vector3(), rotation: new THREE.Vector3(),
      velocity: new THREE.Vector3(), speed: 0,
      mesh, stats: (window as any).VEHICLE_STATS?.[type] || (window as any).VEHICLE_STATS?.car || { accel: 0.045, fric: 0.945, maxSpd: 1.1 },
      profileKey
    };
    return vehicle;
  }

  _createVehicleMesh(type: string, color: number): THREE.Object3D | null {
    let mesh: THREE.Object3D | null = null;
    try {
      if (this.game && typeof this.game._makeNPC === 'function') mesh = this.game._makeNPC(type, color);
      else if (typeof (window as any)._buildVehicle === 'function') mesh = (window as any)._buildVehicle(type, color);
    } catch (e) { console.warn('[TrafficManager] vehicle mesh factory failed for "' + type + '"', e); }
    if (!mesh) {
      mesh = new THREE.Group();
      mesh.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.5), new THREE.MeshToonMaterial({ color })));
    }
    mesh.userData = mesh.userData || {};
    mesh.userData.npcType = type;
    mesh.userData.isTrafficManagerVehicle = true;
    if (!mesh.userData.materials) {
      let body: THREE.Material | null = null;
      mesh.traverse(c => { if (!body && (c as THREE.Mesh).isMesh && (c as THREE.Mesh).material && (c as THREE.Mesh).material.color) body = (c as THREE.Mesh).material; });
      mesh.userData.materials = { body };
    }
    return mesh;
  }

  _resetVehicle(vehicle: VehicleInstance, color: number, profileKey: string): void {
    vehicle.active = false; vehicle.speed = 0; vehicle.velocity.set(0, 0, 0);
    vehicle.profileKey = profileKey; vehicle.health = 100; vehicle.npcAI = null;
    if (vehicle.mesh && vehicle.mesh.userData.materials) {
      const mats = vehicle.mesh.userData.materials;
      if (mats.body) mats.body.color.setHex(color);
    }
  }

  _returnToPool(vehicle: VehicleInstance): void {
    vehicle.active = false;
    this.game.scene.remove(vehicle.mesh);
    if (this.game.npcs) this.game.npcs = this.game.npcs.filter((n: THREE.Object3D) => n !== vehicle.mesh);
    if (this.vehiclePools.has(vehicle.type)) this.vehiclePools.get(vehicle.type)!.push(vehicle);
    this.vehicles = this.vehicles.filter(v => v !== vehicle);
  }

  _despawnVehicle(vehicle: VehicleInstance): void {
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

  _findSpawnPoint(): SpawnPoint | null {
    if (!this.roadGraph) return null;
    let edge: RoadEdge | null = null, startNode: RoadNode | null = null;

    if (Array.isArray(this.mainRoute) && this.mainRoute.length >= 2) {
      const startIdx = Math.floor(Math.random() * (this.mainRoute.length - 1));
      const a = this.mainRoute[startIdx], b = this.mainRoute[startIdx + 1];
      if (a && typeof a.getEdgeTo === 'function') {
        edge = a.getEdgeTo(b);
        if (edge) startNode = a;
      }
    }
    if (!edge) {
      const candidates = this._spawnCandidateEdges();
      if (!candidates.length) return null;
      edge = candidates[Math.floor(Math.random() * candidates.length)];
      startNode = Math.random() < 0.5 ? edge.startNode : edge.endNode;
    }
    if (!edge || !startNode) return null;

    const pos = edge.getPointAt(this._spawnTOnEdge(edge));
    const forward = edge.getForwardVector(startNode);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const isPedMode = this.levelConfig && this.levelConfig.isPedestrian;
    let offset: number;

    if (isPedMode) {
      const roadHalfWidth = edge.width / 2;
      const sidewalkWidth = this.levelConfig.sidewalkWidth || 3;
      const side = Math.random() > 0.5 ? 1 : -1;
      offset = side * (roadHalfWidth + sidewalkWidth + 1.5);
    } else {
      const offsets = edge.getLaneOffsets();
      const laneCount = Math.max(1, edge.lanes || 1);
      const lane = Math.floor(Math.random() * laneCount);
      const dirBase = startNode === edge.startNode ? laneCount : 0;
      offset = offsets[dirBase + lane] !== undefined ? offsets[dirBase + lane] : 0;
    }
    pos.addScaledVector(right, offset); pos.y = 0.5;

    return { position: pos, rotation: Math.atan2(forward.x, forward.z), node: startNode!, edge, lane: 0 };
  }

  _spawnCandidateEdges(): RoadEdge[] {
    const all = typeof this.roadGraph!.getEdgeList === 'function' ? this.roadGraph!.getEdgeList() : Array.from(this.roadGraph!.edges.values());
    const player = this.game && this.game.player && this.game.player.position;
    if (!player || all.length === 0) return all;
    const near = all.filter(e => this._distanceToEdge(e, player) < SPAWN_RADIUS);
    return near.length ? near : all;
  }

  _distanceToEdge(edge: RoadEdge, p: THREE.Vector3): number {
    const a = edge.nodes[0].position, b = edge.nodes[1].position;
    const abx = b.x - a.x, abz = b.z - a.z;
    const len2 = abx * abx + abz * abz;
    let t = len2 ? ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(a.x + abx * t - p.x, a.z + abz * t - p.z);
  }

  _spawnTOnEdge(edge: RoadEdge): number {
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

  _getNextRouteNode(currentNode: RoadNode | null): RoadNode | null {
    if (this.mainRoute && Array.isArray(this.mainRoute) && this.mainRoute.length >= 2) {
      const idx = this.mainRoute.indexOf(currentNode!);
      if (idx >= 0 && idx < this.mainRoute.length - 1) return this.mainRoute[idx + 1];
      return this.mainRoute[0];
    }
    if (currentNode && currentNode.edges && currentNode.edges.length > 0) {
      const randomEdge = currentNode.edges[Math.floor(Math.random() * currentNode.edges.length)];
      return randomEdge.endNode === currentNode ? randomEdge.startNode : randomEdge.endNode;
    }
    return null;
  }

  _maybeFormPlatoon(vehicle: VehicleInstance): void {
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

  getVehiclesOnEdge(edgeId: string): VehicleInstance[] { return this.edgeVehicles.get(edgeId) || []; }
  getAvailableParkingSpots(position: THREE.Vector3, radius: number): any[] {
    return this.parkingSpots.filter(s => !s.occupied && s.position.distanceTo(position) < radius)
      .sort((a, b) => a.position.distanceTo(position) - b.position.distanceTo(position));
  }
  registerParkingSpot(spot: any): void { this.parkingSpots.push(spot); }
  getActiveVehicleCount(): number { return this.vehicles.filter(v => v.active).length; }
  getRuleBreakerRatio(): number { const total = this.getActiveVehicleCount(); return total > 0 ? this.ruleBreakerCount / total : 0; }
  getDensityMultiplier(): number { return this.densityMultiplier; }
  getSignalPressure(): number { return this.signalAccumulation / MAX_SIGNAL_ACCUMULATION; }
  setAudio(audio: any): void { this.audio = audio; }
  getDebugInfo(): any {
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

export class Platoon {
  leader: VehicleInstance;
  followers: VehicleInstance[];
  gap: number;
  active: boolean = true;
  formation: string = 'line';
  targetSpeed: number = 0;

  constructor(leader: VehicleInstance, followers: VehicleInstance[]) {
    this.leader = leader; this.followers = followers;
    this.gap = PLATOON_GAP; this.active = true; this.formation = 'line'; this.targetSpeed = 0;
  }

  update(dt: number, trafficManager: TrafficManager): void {
    if (!this.leader || !this.leader.active) { this.active = false; return; }
    this.targetSpeed = this.leader.npcAI?.desiredSpeed || 10;
    this.followers = this.followers.filter(f => f.active);
    if (this.followers.length === 0) { this.active = false; return; }

    this.followers.forEach((follower, idx) => {
      if (!follower.npcAI) return;
      const targetPos = this._getFollowerPosition(idx);
      const toTarget = new THREE.Vector3().subVectors(targetPos, follower.position);
      const dist = toTarget.length();
      if (dist > this.gap * 1.5) follower.npcAI.desiredSpeed = this.targetSpeed * 1.2;
      else if (dist < this.gap * 0.5) follower.npcAI.desiredSpeed = this.targetSpeed * 0.5;
      else follower.npcAI.desiredSpeed = this.targetSpeed;
    });
  }

  _getFollowerPosition(index: number): THREE.Vector3 {
    const leaderPos = this.leader.position.clone();
    const leaderRot = this.leader.rotation.y;
    const forward = new THREE.Vector3(Math.sin(leaderRot), 0, Math.cos(leaderRot));
    const offset = (index + 1) * this.gap;
    return leaderPos.addScaledVector(forward, -offset);
  }

  addFollower(vehicle: VehicleInstance): void {
    if (this.followers.length < PLATOON_SIZE) this.followers.push(vehicle);
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).TrafficManager = TrafficManager;
  (window as any).Platoon = Platoon;
  (window as any).VEHICLE_VARIETY_WEIGHTS = VEHICLE_VARIETY_WEIGHTS;
  (window as any).RULE_BREAKER_PROBABILITY = RULE_BREAKER_PROBABILITY;
  (window as any).BASE_NPC_COUNT = BASE_NPC_COUNT;
  (window as any).MAX_NPC_COUNT = MAX_NPC_COUNT;
  (window as any).DENSITY_INCREASE_PER_MIN = DENSITY_INCREASE_PER_MIN;
}