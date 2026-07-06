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
  score: number;
  fine: number;
}

export const CORRECTIVE_QUIZ: Record<string, { q: string, o: string[], a: number }> = {
  'NO_HONKING': { q: 'Corrective Check: What is the rule for honking in silence zones?', o: ['It is strictly prohibited and carries a fine.', 'Honking is allowed once', 'Only honk if traffic is slow', 'Honk to warn pedestrians'], a: 0 },
  'MOBILE_USE': { q: 'Corrective Check: Why is phone use prohibited while driving?', o: ['It causes distraction and significantly increases accident risk.', 'It is only banned on highways', 'It is allowed if using a speaker', 'It only affects the vehicle speed'], a: 0 },
  'SAFETY_VIOLATION': { q: 'Corrective Check: What is the primary purpose of safety gear like helmets/seatbelts?', o: ['To reduce fatalities and injuries during accidents', 'To avoid police fines', 'To make the driver look professional', 'To improve vehicle aerodynamics'], a: 0 },
  'NO_INDICATOR': { q: 'Corrective Check: When is it mandatory to use a turn indicator?', o: ['Every time you intend to change direction or merge', 'Only at red lights', 'Only on highways', 'Only when other cars are present'], a: 0 },
  'LITTER_HIT': { q: 'Corrective Check: How does road litter affect vehicle control?', o: ['It can cause skidding or damage tires', 'It has no effect on control', 'It improves grip on wet roads', 'It only affects the paint'], a: 0 },
  'CHECKPOINT_EVASION': { q: 'Corrective Check: What is the legal consequence of fleeing a police checkpoint?', o: ['It is a serious offense often leading to immediate arrest', 'A simple warning', 'A small fine payable online', 'No consequence if you have a license'], a: 0 },
  'RED_LIGHT_VIOLATION': { q: 'Corrective Check: What is the mandatory action when a signal turns red?', o: ['Stop completely before the stop line', 'Slow down and proceed cautiously', 'Stop only if cars are coming', 'Flash headlights and pass quickly'], a: 0 }
};
