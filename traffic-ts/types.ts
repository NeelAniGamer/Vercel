import type * as THREE from 'three';

export type VehicleType = 
  | 'sports_gt'
  | 'supercar'
  | 'car'
  | 'taxi'
  | 'suv'
  | 'sedan_sports'
  | 'auto'
  | 'bus'
  | 'truck'
  | 'bike'
  | 'pedestrian';

export type GameMode = 'free_roam' | 'driving' | 'pedestrian' | 'academy' | 'rain';

export type QualityPresetName = 'LOW' | 'MED' | 'HIGH' | 'ULTRA';

export type CameraMode = 'chase_close' | 'chase_far' | 'hood' | 'bumper';

export interface VehicleStats {
  maxSpd: number;
  accel: number;
  turn: number;
  fric: number;
  mass: number;
  wheelbase: number;
  halfW: number;
  halfD: number;
  halfH: number;
  cgHeight: number;
}

export interface CameraProfile {
  dist: number;
  height: number;
  lookAhead: number;
  targetY: number;
  speedPullback: number;
  reverseLift: number;
  fov: number;
}

export interface InputState {
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  boost: boolean;
  reverse: boolean;
  gear: 'P' | 'R' | 'N' | 'D';
  headlights: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
  isPointerLocked: boolean;
}

export interface RoadDef {
  type: 'v' | 'h';
  x?: number;
  z?: number;
  x1?: number;
  x2?: number;
  z1?: number;
  z2?: number;
  width?: number;
  lanes?: number;
  speedLimit?: number;
}

export interface RouteWaypoint {
  x: number;
  z: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  mode: GameMode;
  vehMode?: VehicleType;
  roads: RoadDef[];
  route?: RouteWaypoint[];
  skyColor?: number;
  fogNear?: number;
  fogFar?: number;
  renderDistance?: number;
  isNight?: boolean;
  hasRain?: boolean;
}

export interface QualityPreset {
  name: QualityPresetName;
  resScale: number;
  shadows: boolean;
  shadowMapSize: number;
  shadowCascades: number;
  bloom: boolean;
  drs: boolean;
  targetFps: number;
  maxVehicles: number;
  maxPedestrians: number;
}

export interface VehicleCustomization {
  bodyColor: number;
  rimColor: number;
  caliperColor: number;
  hasSplitter: boolean;
  hasWing: boolean;
}

export interface ChallanViolation {
  id: string;
  title: string;
  fine: number;
  timestamp: number;
  icon: string;
}

export interface TrafficRadarDot {
  x: number;
  z: number;
  heading: number;
  isPlayer?: boolean;
}

export interface HUDState {
  speedKmh: number;
  gear: 'P' | 'R' | 'N' | 'D';
  gearNumber: number;
  rpm: number;
  maxRpm: number;
  lateralG: number;
  slipAngle: number;
  speedLimit: number;
  cameraMode: CameraMode;
  headlightsOn: boolean;
  nitroRemaining: number; // 0 to 100
  score: number;
  hp: number;
  totalFine: number;
  recentViolation?: ChallanViolation;
  radarDots: TrafficRadarDot[];
  playerX: number;
  playerZ: number;
  playerHeading: number;
}
