// @ts-nocheck
/**
 * RuleBreakerProfiles — migrated from rule-breaker-profiles.js
 * Defines rule-breaking NPC behavior profiles for Chaos mode
 */

export interface BreakerBehaviors {
  signalCompliance: number;
  patience: number;
  aggression: number;
  laneDiscipline: number;
  speedVariance: number;
  overtakeThreshold: number;
  sidewalkProbability: number;
  parkingSkill: number;
}

export interface BreakerType {
  name: string;
  weight: number;
  description: string;
  behaviors: BreakerBehaviors;
  triggers: string[];
  mumbaiStat: string;
  fine: number;
  points: number;
}

export const RULE_BREAKER_TYPES: Record<string, BreakerType> = {
  signal_jumper: {
    name: 'Signal Jumper', weight: 30,
    description: 'Runs red lights when impatient',
    behaviors: { signalCompliance: 0.15, patience: 0.2, aggression: 0.7, laneDiscipline: 0.6, speedVariance: 0.3, overtakeThreshold: 0.25, sidewalkProbability: 0.05, parkingSkill: 0.4 },
    triggers: ['red_signal_wait > 15s', 'no_traffic_ahead', 'following_another_jumper'],
    mumbaiStat: '12,847 signal jump challans issued in 2024 (MTP data)',
    fine: 1000, points: 5
  },
  sidewalk_rider: {
    name: 'Sidewalk Rider', weight: 25,
    description: 'Two-wheelers using footpaths to bypass traffic',
    behaviors: { signalCompliance: 0.4, patience: 0.15, aggression: 0.6, laneDiscipline: 0.1, speedVariance: 0.45, overtakeThreshold: 0.1, sidewalkProbability: 0.85, parkingSkill: 0.2 },
    triggers: ['traffic_jam > 30s', 'wide_footpath_available', 'peak_hours'],
    mumbaiStat: '45% of pedestrian injuries from bikes on footpaths (2025 MTP report)',
    fine: 500, points: 3
  },
  wrong_sider: {
    name: 'Wrong Side Driver', weight: 20,
    description: 'Drives against traffic flow to save time',
    behaviors: { signalCompliance: 0.3, patience: 0.25, aggression: 0.85, laneDiscipline: 0.05, speedVariance: 0.4, overtakeThreshold: 0.15, sidewalkProbability: 0.1, parkingSkill: 0.3 },
    triggers: ['one_way_detour > 500m', 'empty_opposite_lane', 'shortcut_known'],
    mumbaiStat: '3,214 wrong-side driving cases in 2024 (up 23% from 2023)',
    fine: 1500, points: 6
  },
  lane_weaver: {
    name: 'Lane Weaver', weight: 15,
    description: 'Constantly switches lanes without signaling',
    behaviors: { signalCompliance: 0.5, patience: 0.3, aggression: 0.65, laneDiscipline: 0.15, speedVariance: 0.35, overtakeThreshold: 0.2, sidewalkProbability: 0.0, parkingSkill: 0.5 },
    triggers: ['slow_vehicle_ahead', 'gap_in_adjacent_lane', 'approaching_intersection'],
    mumbaiStat: 'Lane cutting causes 31% of non-fatal crashes on arterial roads',
    fine: 500, points: 2
  },
  horn_abuser: {
    name: 'Horn Abuser', weight: 10,
    description: 'Excessive honking in silent zones and traffic',
    behaviors: { signalCompliance: 0.7, patience: 0.1, aggression: 0.5, laneDiscipline: 0.7, speedVariance: 0.2, overtakeThreshold: 0.4, sidewalkProbability: 0.0, parkingSkill: 0.6 },
    triggers: ['vehicle_ahead_not_moving', 'signal_just_turned_green', 'silent_zone'],
    mumbaiStat: 'Mumbai noise avg 78dB - WHO limit 55dB; honking major contributor',
    fine: 1000, points: 1
  },
  parking_offender: {
    name: 'Parking Offender', weight: 8,
    description: 'Parks in no-parking zones, blocks traffic',
    behaviors: { signalCompliance: 0.8, patience: 0.4, aggression: 0.3, laneDiscipline: 0.5, speedVariance: 0.15, overtakeThreshold: 0.6, sidewalkProbability: 0.0, parkingSkill: 0.1 },
    triggers: ['no_parking_available', 'short_stop_mentality', 'hazard_lights_on'],
    mumbaiStat: '8,932 towing cases in 2024; avg fine ₹2,500 + towing charges',
    fine: 2500, points: 3
  },
  zebra_blocker: {
    name: 'Zebra Crossing Blocker', weight: 7,
    description: 'Stops on pedestrian crossing at signals',
    behaviors: { signalCompliance: 0.6, patience: 0.35, aggression: 0.4, laneDiscipline: 0.4, speedVariance: 0.2, overtakeThreshold: 0.5, sidewalkProbability: 0.0, parkingSkill: 0.5 },
    triggers: ['signal_red', 'crossing_empty', 'in_hurry'],
    mumbaiStat: '28% of pedestrian near-misses at blocked zebra crossings (2025)',
    fine: 500, points: 2
  },
  high_beam_abuser: {
    name: 'High Beam Abuser', weight: 5,
    description: 'Uses high beam in city traffic blinding others',
    behaviors: { signalCompliance: 0.75, patience: 0.5, aggression: 0.3, laneDiscipline: 0.6, speedVariance: 0.15, overtakeThreshold: 0.5, sidewalkProbability: 0.0, parkingSkill: 0.7 },
    triggers: ['night_driving', 'well_lit_roads', 'oncoming_traffic'],
    mumbaiStat: 'High beam glare causes 12% night-time reaction delays',
    fine: 500, points: 1
  }
};

const RULE_BREAKER_KEYS = Object.keys(RULE_BREAKER_TYPES);
const RULE_BREAKER_WEIGHTS = RULE_BREAKER_KEYS.map(k => RULE_BREAKER_TYPES[k].weight);
const TOTAL_RULE_BREAKER_WEIGHT = RULE_BREAKER_WEIGHTS.reduce((a, b) => a + b, 0);
const RULE_BREAKER_SPAWN_RATE = 0.20;
const MAX_RULE_BREAKERS_PER_EDGE = 3;

export function pickRuleBreakerType(): string {
  let r = Math.random() * TOTAL_RULE_BREAKER_WEIGHT;
  for (let i = 0; i < RULE_BREAKER_KEYS.length; i++) {
    r -= RULE_BREAKER_WEIGHTS[i];
    if (r <= 0) return RULE_BREAKER_KEYS[i];
  }
  return 'signal_jumper';
}

export function shouldSpawnRuleBreaker(currentRatio: number): boolean {
  return Math.random() < RULE_BREAKER_SPAWN_RATE * (1 - currentRatio / RULE_BREAKER_SPAWN_RATE);
}

export class RuleBreakerProfile {
  typeKey: string;
  data: BreakerType;
  behaviors: BreakerBehaviors;
  violationCount: number = 0;
  lastViolation: number = 0;
  violationCooldown: number = 5;

  constructor(typeKey: string) {
    this.typeKey = typeKey;
    this.data = RULE_BREAKER_TYPES[typeKey] || RULE_BREAKER_TYPES.signal_jumper;
    this.behaviors = { ...this.data.behaviors };
    this.violationCooldown = 5;
  }

  applyToNPC(npcAI: any): void {
    Object.assign(npcAI.profile, this.behaviors);
    npcAI.isRuleBreaker = true;
    npcAI.ruleBreakerType = this.typeKey;
    npcAI.violationCooldown = this.violationCooldown;
  }

  checkTrigger(npcAI: any, context: any): boolean {
    const now = Date.now() / 1000;
    if (now - this.lastViolation < this.violationCooldown) return false;

    switch (this.typeKey) {
      case 'signal_jumper':
        return context.signalState === 'red' && context.waitTime > 15 && Math.random() < 0.3;
      case 'sidewalk_rider':
        return context.trafficJam > 30 && context.vehicleType === 'bike' && Math.random() < 0.4;
      case 'wrong_sider':
        return context.oneWayDetour > 500 && context.oppositeLaneEmpty && Math.random() < 0.25;
      case 'lane_weaver':
        return context.slowVehicleAhead && context.adjacentLaneGap && Math.random() < 0.35;
      case 'horn_abuser':
        return (context.vehicleAheadStopped || context.signalJustGreen) && Math.random() < 0.4;
      case 'parking_offender':
        return context.noParkingAvailable && context.shortStop && Math.random() < 0.3;
      case 'zebra_blocker':
        return context.signalRed && context.crossingEmpty && Math.random() < 0.2;
      case 'high_beam_abuser':
        return context.night && context.wellLit && context.oncomingTraffic && Math.random() < 0.15;
    }
    return false;
  }

  recordViolation(npcAI: any): void {
    this.violationCount++;
    this.lastViolation = Date.now() / 1000;
    npcAI.signalViolation = true;
  }

  getFine(): number { return this.data.fine; }
  getPoints(): number { return this.data.points; }
  getMumbaiStat(): string { return this.data.mumbaiStat; }
  getDescription(): string { return this.data.description; }
}

export interface MumbaiTrafficStat {
  year: number;
  count?: number;
  percentage?: number;
  description?: string;
  source: string;
  trend: string;
  fine?: number;
  points?: number;
  avgFine?: number;
  avgDb?: number;
  whoLimit?: number;
  cases?: number;
  fatalities?: number;
}

export const MUMBAI_TRAFFIC_STATS_2024_2026: Record<string, MumbaiTrafficStat> = {
  signalJump: { year: 2024, count: 12847, fine: 1000, points: 5, source: 'Mumbai Traffic Police Annual Report 2024', trend: '+18% from 2023' },
  sidewalkBikes: { year: 2025, percentage: 45, description: 'Pedestrian injuries from bikes on footpaths', source: 'MTP Pedestrian Safety Report 2025', trend: 'Stable' },
  wrongSide: { year: 2024, count: 3214, fine: 1500, points: 6, source: 'MTP Enforcement Data 2024', trend: '+23% from 2023' },
  laneCutting: { year: 2025, percentage: 31, description: 'Non-fatal crashes caused by lane cutting on arterial roads', source: 'MTP Accident Analysis 2025', trend: '+5% from 2024' },
  noisePollution: { year: 2024, avgDb: 78, whoLimit: 55, source: 'CPCB Noise Monitoring 2024', trend: 'Exceeds limit by 42%' },
  towing: { year: 2024, count: 8932, avgFine: 2500, source: 'MTP Towing Records 2024', trend: '+12% from 2023' },
  zebraBlocking: { year: 2025, percentage: 28, description: 'Pedestrian near-misses at blocked zebra crossings', source: 'MTP Pedestrian Safety Audit 2025', trend: 'New metric' },
  highBeam: { year: 2025, percentage: 12, description: 'Night-time reaction delays from high beam glare', source: 'IIT Bombay Night Driving Study 2025', trend: 'New metric' },
  helmetCompliance: { year: 2024, percentage: 67, description: 'Two-wheeler rider helmet compliance rate', source: 'MTP Helmet Enforcement 2024', trend: '+8% from 2023' },
  seatbeltCompliance: { year: 2024, percentage: 72, description: 'Four-wheeler seatbelt compliance (rear: 31%)', source: 'MTP Seatbelt Survey 2024', trend: 'Rear compliance critical gap' },
  drunkDriving: { year: 2024, cases: 2847, fatalities: 89, source: 'MTP Drunk Driving Data 2024', trend: '-15% from 2023 (stricter enforcement)' },
  pedestrianFatalities: { year: 2024, count: 412, percentage: 52, description: 'Pedestrians as % of total road fatalities', source: 'MTP Fatality Report 2024', trend: 'Highest in metro cities' }
};

export function getMumbaiStat(key: string): MumbaiTrafficStat | null {
  return MUMBAI_TRAFFIC_STATS_2024_2026[key] || null;
}

export function getAllMumbaiStats(): Record<string, MumbaiTrafficStat> {
  return MUMBAI_TRAFFIC_STATS_2024_2026;
}

export function getConsequenceModalData(violationType: string): MumbaiTrafficStat | null {
  const statMap: Record<string, string> = {
    'signal_jump': 'signalJump', 'sidewalk_ride': 'sidewalkBikes', 'wrong_side': 'wrongSide',
    'lane_cut': 'laneCutting', 'honking': 'noisePollution', 'illegal_park': 'towing',
    'zebra_block': 'zebraBlocking', 'high_beam': 'highBeam'
  };
  const key = statMap[violationType];
  return key ? getMumbaiStat(key) : null;
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).RULE_BREAKER_TYPES = RULE_BREAKER_TYPES;
  (window as any).RULE_BREAKER_SPAWN_RATE = RULE_BREAKER_SPAWN_RATE;
  (window as any).MAX_RULE_BREAKERS_PER_EDGE = MAX_RULE_BREAKERS_PER_EDGE;
  (window as any).RuleBreakerProfile = RuleBreakerProfile;
  (window as any).pickRuleBreakerType = pickRuleBreakerType;
  (window as any).shouldSpawnRuleBreaker = shouldSpawnRuleBreaker;
  (window as any).MUMBAI_TRAFFIC_STATS_2024_2026 = MUMBAI_TRAFFIC_STATS_2024_2026;
  (window as any).getMumbaiStat = getMumbaiStat;
  (window as any).getAllMumbaiStats = getAllMumbaiStats;
  (window as any).getConsequenceModalData = getConsequenceModalData;
}
