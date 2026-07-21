export interface VehicleStats {
  maxSpd: number;
  accel: number;
  fric: number;
  turn: number;
  grip: number;
}

export const VEHICLE_STATS: Record<string, VehicleStats> = {
  bike:      { maxSpd: 1.35, accel: 0.058, fric: 0.935, turn: 0.082, grip: 0.48 },
  car:       { maxSpd: 1.10, accel: 0.045, fric: 0.945, turn: 0.065, grip: 0.62 },
  bus:       { maxSpd: 0.80, accel: 0.028, fric: 0.965, turn: 0.036, grip: 0.44 },
  truck:     { maxSpd: 0.90, accel: 0.033, fric: 0.960, turn: 0.042, grip: 0.50 },
  auto:      { maxSpd: 1.00, accel: 0.048, fric: 0.942, turn: 0.072, grip: 0.40 },
};

export interface RoadSegment {
  type: 'v' | 'h';
  x?: number;
  z1?: number;
  z2?: number;
  z?: number;
  x1?: number;
  x2?: number;
}

export interface NPC {
  obj: any; // THREE.Group
  headMat: any;
  tailMat: any;
  route: Array<{ x: number, z: number }>;
  routeIdx: number;
  speed: number;
  stuckTimer: number;
  axis: 'x' | 'z';
  lane: number;
  dir: number;
}

export interface CollisionBox {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
  obj: any;
}

export interface LevelConfig {
  id: number;
  name: string;
  modes: string[];
  col: string;
  ds: string;
  hps: string[];
  law: {
    sec: string;
    fine: string;
    off: string;
    secHi: string;
    fineHi: string;
    offHi: string;
  };
  theory: string;
  pract: string;
  mode: string;
  themeType: string;
  hasSchool?: boolean;
  npcDensity: string;
  scenarioType: string;
  startOutside: boolean;
  tasks: Array<{
    id: string;
    text: string;
    type: 'reach' | 'stop' | 'avoid';
    target: string;
    done: boolean;
  }>;
  assets: string[];
}

export interface GameState {
  speed: number;
  gear: 'D' | 'R' | 'N' | 'P';
  timeOfDay: number;
  violations: string[];
  violationsLog: string[];
  score: number;
  fine: number;
}
