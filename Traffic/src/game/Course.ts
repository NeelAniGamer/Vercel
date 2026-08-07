/**
 * Course — migrated from course.js
 * Level definitions, modes, vehicles, badges, Mumbai stats
 */

export interface ModeConfig {
  timeLimitMult: number;
  npcDensityMult: number;
  passThreshold: number;
  xpBase: number;
  badge: string | null;
  streakBonus: number;
  allowHints: boolean;
  showGhostCar: boolean;
  theorySlides: boolean;
  mcqCount?: number;
  adaptive?: boolean;
  ruleBreakerRate?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  route: string;
  timeLimit: number;
  npcTypes: string[];
  assets?: string[];
}

export interface ModuleConfig {
  id: number;
  name: string;
  theme: string;
  levels: LevelConfig[];
}

export interface VehicleConfig {
  id: string;
  name: string;
  icon: string;
  recommended: number[];
}

export interface BadgeConfig {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export interface MumbaiStat {
  stat: string;
  unit: string;
  year: number;
  source: string;
}

export const MODES = {
  LEARN:   { id: 'learn', label: 'LEARN', icon: '📖', color: '--ion', desc: 'Theory & rules' },
  PRACTICE: { id: 'practice', label: 'PRACTICE', icon: '🚗', color: '--signal', desc: 'Hands-on driving' },
  EXAM:    { id: 'exam', label: 'EXAM', icon: '📝', color: '--plasma', desc: 'MCQ assessment' },
  CHAOS:   { id: 'chaos', label: 'CHAOS', icon: '🌪️', color: '--em', desc: 'Adaptive stress test' }
};

export const VEHICLES: VehicleConfig[] = [
  { id: 'car', name: 'Sedan', icon: '🚗', recommended: [1,2,3,4,5,7,9,10,11,13,14,15] },
  { id: 'bike', name: 'Motorcycle', icon: '🏍️', recommended: [3,4,6,8,12] },
  { id: 'auto', name: 'Auto-rickshaw', icon: '🛺', recommended: [2,5,6,12] },
  { id: 'bus', name: 'BEST Bus', icon: '🚌', recommended: [1,4,7,10] },
  { id: 'truck', name: 'Truck', icon: '🚚', recommended: [1,9,11] },
  { id: 'taxi', name: 'Kaali-Peeli', icon: '🚕', recommended: [1,3,7,13] },
  { id: 'cycle', name: 'Bicycle', icon: '🚲', recommended: [3,6] },
  { id: 'ambulance', name: 'Ambulance', icon: '🚑', recommended: [8] },
  { id: 'police', name: 'Police Jeep', icon: '🚓', recommended: [8,14] }
];

export const MUMBAI_STATS: Record<string, MumbaiStat> = {
  signal_jump: { stat: '12,847', unit: 'challans', year: 2024, source: 'Mumbai Traffic Police' },
  sidewalk_bike: { stat: '45%', unit: 'pedestrian injuries', year: 2024, source: 'MTP Annual Report' },
  wrong_side: { stat: '8,231', unit: 'cases', year: 2025, source: 'MTP' },
  no_helmet: { stat: '67%', unit: 'fatalities', year: 2024, source: 'MoRTH' },
  phone_driving: { stat: '3,412', unit: 'accidents', year: 2025, source: 'MTP' },
  drunk_driving: { stat: '1,892', unit: 'arrests', year: 2024, source: 'MTP' },
  zebra_violation: { stat: '23,456', unit: 'challans', year: 2024, source: 'MTP' },
  high_beam: { stat: '34%', unit: 'night glare complaints', year: 2025, source: 'MTP' },
  ambulance_block: { stat: '12 min', unit: 'avg delay', year: 2024, source: '108 Ambulance' },
  school_zone: { stat: '78%', unit: 'speed violations', year: 2025, source: 'MTP School Zone Audit' }
};

export const BADGES: BadgeConfig[] = [
  { id: 'safe_walker', name: 'Safe Walker', icon: '🚶', desc: 'Crossed all roads safely as a pedestrian' },
  { id: 'law_abider', name: 'Law Abider', icon: '🏛️', desc: 'Passed all checkpoint inspections cleanly' },
  { id: 'speed_king', name: 'Speed King', icon: '🏎️', desc: 'Completed Sea Link with zero speed violations' },
  { id: 'traffic_hero', name: 'Traffic Hero', icon: '🌟', desc: 'Completed all 52 levels of the Academy' },
  { id: 'smart_citizen', name: 'Mumbai Smart Citizen', icon: '🏙️', desc: 'Earned the Traffic Hero badge — A true road hero' },
  { id: 'signal_master', name: 'Signal Master', icon: '🚦', desc: 'Completed 5+ levels without a single red-light violation' },
  { id: 'level_10', name: 'Novice Driver', icon: '🎓', desc: 'Completed first 10 levels' },
  { id: 'level_20', name: 'Learner Driver', icon: '📋', desc: 'Completed first 20 levels' },
  { id: 'level_30', name: 'Competent Driver', icon: '🎖️', desc: 'Completed first 30 levels' },
  { id: 'level_40', name: 'Skilled Driver', icon: '🏅', desc: 'Completed first 40 levels' },
  { id: 'level_52', name: 'Master Driver', icon: '💎', desc: 'Completed all 52 levels' },
  { id: 'pedestrian_expert', name: 'Pedestrian Expert', icon: '🚶‍♂️', desc: 'Completed all pedestrian mode levels' },
  { id: 'night_driver', name: 'Night Driver', icon: '🌙', desc: 'Completed all night driving levels' },
  { id: 'weather_pro', name: 'Weather Expert', icon: '⛈️', desc: 'Completed all weather-related levels' },
  { id: 'emergency_hero', name: 'Emergency Hero', icon: '🚑', desc: 'Completed all emergency vehicle levels' },
  { id: 'parking_master', name: 'Parking Master', icon: '🅿️', desc: 'Completed all parking scenarios' },
  { id: 'streak_7', name: 'Week Warrior', icon: '🔥', desc: 'Maintained a 7-day learning streak' },
  { id: 'streak_30', name: 'Monthly Master', icon: '📅', desc: 'Maintained a 30-day learning streak' },
  { id: 'perfect_run', name: 'Perfect Run', icon: '💯', desc: 'Completed a level with zero violations' },
  { id: 'chaos_survivor', name: 'Chaos Survivor', icon: '🌪️', desc: 'Survived Chaos mode at max difficulty' }
];

export const MODULES: ModuleConfig[] = [
  {
    id: 1, name: 'Andheri Junction', theme: 'intersection_mastery',
    levels: [
      { id: 1, name: 'Signal Basics', route: 'simple_cross', timeLimit: 90, npcTypes: ['car','car','bike','auto','bus','truck'] },
      { id: 2, name: 'Protected Left Turn', route: 'protected_left', timeLimit: 100, npcTypes: ['car','auto','bike','car','auto','taxi'] },
      { id: 3, name: 'Pedestrian Phase', route: 'zebra_heavy', timeLimit: 110, npcTypes: ['car','bus','auto','car','bike','truck'] },
      { id: 4, name: 'Ambulance Priority', route: 'emergency_cross', timeLimit: 80, npcTypes: ['car','truck','bus','car','car','auto'] },
      { id: 5, name: 'Rush Hour Gauntlet', route: 'dense_cross', timeLimit: 120, npcTypes: ['car','car','bike','auto','ambulance','car','bus','truck'] }
    ]
  },
  {
    id: 2, name: 'Dadar Junction', theme: 'pedestrian_courtesy',
    levels: [
      { id: 6, name: 'Zebra Yield', route: 'zebra_basic', timeLimit: 90, npcTypes: ['car','bus','auto','car','bike','truck'] },
      { id: 7, name: 'School Children', route: 'school_zone', timeLimit: 100, npcTypes: ['car','auto','cycle','bike','auto','car'] },
      { id: 8, name: 'Senior Citizen Cross', route: 'slow_cross', timeLimit: 110, npcTypes: ['car','taxi','car','auto','bike','car'] },
      { id: 9, name: 'Hawker Zone', route: 'sidewalk_vendors', timeLimit: 120, npcTypes: ['car','auto','car','bike','truck','car'] },
      { id: 10, name: 'Monsoon Puddles', route: 'puddle_etiquette', timeLimit: 100, npcTypes: ['car','bus','bike','auto','car','car'] }
    ]
  },
  {
    id: 3, name: 'Bandra Backroads', theme: 'lane_discipline',
    levels: [
      { id: 11, name: 'Single Lane Flow', route: 'narrow_one_way', timeLimit: 90, npcTypes: ['car','auto','bike','cycle','auto','car'] },
      { id: 12, name: 'Overtaking Rules', route: 'overtake_zone', timeLimit: 100, npcTypes: ['car','taxi','bike','auto','car','bike'] },
      { id: 13, name: 'Bus Lane Respect', route: 'bus_lane', timeLimit: 110, npcTypes: ['car','auto','taxi','bike','auto','car'] },
      { id: 14, name: 'Cycle Track', route: 'cycle_track', timeLimit: 100, npcTypes: ['car','bike','auto','car','cycle','car'] },
      { id: 15, name: 'Gully Navigation', route: 'gully_maze', timeLimit: 120, npcTypes: ['auto','bike','cycle','auto','car','auto'] }
    ]
  },
  {
    id: 4, name: 'Juhu Boulevard', theme: 'speed_management',
    levels: [
      { id: 16, name: 'Coastal 40 km/h', route: 'coastal_straight', timeLimit: 90, npcTypes: ['car','car','auto','bike','car','bus'] },
      { id: 17, name: 'Beach Parking', route: 'beach_parking', timeLimit: 100, npcTypes: ['taxi','car','auto','bike','car','car'] },
      { id: 18, name: 'Sunset Cruise', route: 'scenic_curve', timeLimit: 110, npcTypes: ['car','bus','taxi','car','auto','bike'] },
      { id: 19, name: 'Jogger Avoidance', route: 'jogger_path', timeLimit: 100, npcTypes: ['car','auto','car','bike','bus','auto'] },
      { id: 20, name: 'High Wind Gusts', route: 'windy_bridge', timeLimit: 120, npcTypes: ['car','car','bus','auto','car','truck'] }
    ]
  },
  {
    id: 5, name: 'Parel School Zone', theme: 'silence_zone',
    levels: [
      { id: 21, name: 'No Honking', route: 'silence_basic', timeLimit: 90, npcTypes: ['car','auto','cycle','bike','auto','car'] },
      { id: 22, name: 'Assembly Dismissal', route: 'school_rush', timeLimit: 100, npcTypes: ['taxi','car','auto','bike','car','cycle'] },
      { id: 23, name: 'Ambulance Silencer', route: 'hospital_approach', timeLimit: 80, npcTypes: ['car','auto','taxi','car','auto','car'] },
      { id: 24, name: 'Library Zone', route: 'library_quiet', timeLimit: 110, npcTypes: ['car','cycle','auto','car','bus','auto'] },
      { id: 25, name: 'Exam Season', route: 'exam_stress', timeLimit: 120, npcTypes: ['car','bus','car','auto','car','taxi'] }
    ]
  },
  {
    id: 6, name: 'Matunga Rail Corridor', theme: 'rail_safety',
    levels: [
      { id: 26, name: 'Level Crossing', route: 'rail_crossing', timeLimit: 100, npcTypes: ['car','auto','car','bike','car','auto'] },
      { id: 27, name: 'Gate Timing', route: 'gate_timing', timeLimit: 90, npcTypes: ['taxi','car','auto','bike','car','truck'] },
      { id: 28, name: 'Metro Pillar Nav', route: 'metro_pillars', timeLimit: 110, npcTypes: ['car','auto','taxi','car','auto','bike'] },
      { id: 29, name: 'Train Horn Reaction', route: 'horn_reaction', timeLimit: 100, npcTypes: ['car','truck','auto','car','car','bike'] },
      { id: 30, name: 'Peak Hour Commute', route: 'commuter_crush', timeLimit: 120, npcTypes: ['car','auto','car','bike','truck','auto'] }
    ]
  },
  {
    id: 7, name: 'Marine Drive', theme: 'night_driving',
    levels: [
      { id: 31, name: 'High Beam Etiquette', route: 'high_beam_bay', timeLimit: 100, npcTypes: ['car','car','auto','bike','car','bus'] },
      { id: 32, name: 'Drunk Driver Spot', route: 'drunk_pattern', timeLimit: 110, npcTypes: ['taxi','car','auto','bike','car','car'] },
      { id: 33, name: 'Sea Mist Visibility', route: 'mist_drive', timeLimit: 120, npcTypes: ['car','bus','taxi','car','auto','bike'] },
      { id: 34, name: 'Couple Seats', route: 'parked_cars', timeLimit: 100, npcTypes: ['car','auto','car','bike','car','car'] },
      { id: 35, name: 'Racer Deterrence', route: 'street_race', timeLimit: 90, npcTypes: ['car','car','bus','auto','taxi','car'] }
    ]
  },
  {
    id: 8, name: 'Byculla', theme: 'emergency_access',
    levels: [
      { id: 36, name: 'Narrow Lane Ambulance', route: 'narrow_ambulance', timeLimit: 80, npcTypes: ['car','auto','car','bike','auto','car'] },
      { id: 37, name: 'Fire Engine Clear', route: 'fire_engine', timeLimit: 90, npcTypes: ['truck','car','taxi','auto','bike','car'] },
      { id: 38, name: 'Police Chase Assist', route: 'police_chase', timeLimit: 100, npcTypes: ['car','truck','car','taxi','auto','car'] },
      { id: 39, name: '108 Bike Paramedic', route: 'bike_paramedic', timeLimit: 90, npcTypes: ['car','auto','bike','car','auto','car'] },
      { id: 40, name: 'Disaster Evacuation', route: 'evacuation', timeLimit: 120, npcTypes: ['car','car','bus','truck','auto','car'] }
    ]
  },
  {
    id: 9, name: 'Hindmata', theme: 'monsoon_survival',
    levels: [
      { id: 41, name: 'Waterlogged Roads', route: 'flooded_street', timeLimit: 110, npcTypes: ['car','auto','bike','car','auto','taxi'] },
      { id: 42, name: 'Pothole Slalom', route: 'pothole_field', timeLimit: 100, npcTypes: ['car','auto','taxi','car','auto','car'] },
      { id: 43, name: 'Open Manhole', route: 'manhole_dodge', timeLimit: 100, npcTypes: ['car','bus','auto','bike','car','auto'] },
      { id: 44, name: 'Zero Visibility', route: 'blind_rain', timeLimit: 120, npcTypes: ['car','auto','car','bike','bus','auto'] },
      { id: 45, name: 'Stranded Vehicle', route: 'stall_rescue', timeLimit: 110, npcTypes: ['car','cycle','auto','car','bus','auto'] }
    ]
  },
  {
    id: 10, name: 'Eastern Express Hwy', theme: 'highway_discipline',
    levels: [
      { id: 46, name: 'Lane Discipline 80', route: 'highway_lanes', timeLimit: 90, npcTypes: ['car','truck','bus','car','auto','bike'] },
      { id: 47, name: 'Exit Merge', route: 'merge_exit', timeLimit: 100, npcTypes: ['car','truck','bus','car','taxi','auto'] },
      { id: 48, name: 'Toll Plaza Flow', route: 'toll_plaza', timeLimit: 80, npcTypes: ['car','bike','car','truck','bus','car'] },
      { id: 49, name: 'Breakdown Shoulder', route: 'shoulder_assist', timeLimit: 110, npcTypes: ['car','auto','bike','car','truck','bus'] },
      { id: 50, name: 'Convoy Escort', route: 'vip_convoy', timeLimit: 120, npcTypes: ['car','car','bus','truck','car','auto'] }
    ]
  },
  {
    id: 11, name: 'Bonus: Night Monsoon', theme: 'bonus_night_monsoon',
    levels: [
      { id: 51, name: 'Monsoon Nightmare', route: 'night_flood', timeLimit: 180, npcTypes: ['car','truck','bus','car','auto','bike','car','ambulance'] }
    ]
  },
  {
    id: 12, name: 'Bonus: VIP Convoy', theme: 'bonus_vip_convoy',
    levels: [
      { id: 52, name: 'Protocol Drive', route: 'protocol_route', timeLimit: 150, npcTypes: ['police','car','car','ambulance','car','truck','bus','car'] }
    ]
  },
  {
    id: 13, name: 'Bonus: Free Roam', theme: 'bonus_free_roam',
    levels: [
      { id: 53, name: 'City Sandbox', route: 'free_roam', timeLimit: 999, npcTypes: ['car','bus','auto','bike','truck'], assets: ['lowpoly_city'] }
    ]
  }
];

export const MODE_CONFIG: Record<string, ModeConfig> = {
  LEARN: {
    timeLimitMult: 1.5, npcDensityMult: 0.3, passThreshold: 0.6, xpBase: 50,
    badge: null, streakBonus: 0, allowHints: true, showGhostCar: true, theorySlides: true
  },
  PRACTICE: {
    timeLimitMult: 1.0, npcDensityMult: 0.7, passThreshold: 0.75, xpBase: 100,
    badge: 'practice', streakBonus: 10, allowHints: true, showGhostCar: false, theorySlides: false
  },
  EXAM: {
    timeLimitMult: 0.8, npcDensityMult: 1.0, passThreshold: 0.85, xpBase: 200,
    badge: 'exam', streakBonus: 25, allowHints: false, showGhostCar: false, theorySlides: false, mcqCount: 5
  },
  CHAOS: {
    timeLimitMult: 0.7, npcDensityMult: 1.5, passThreshold: 0.7, xpBase: 300,
    badge: 'chaos', streakBonus: 50, allowHints: false, showGhostCar: false, theorySlides: false,
    adaptive: true, ruleBreakerRate: 0.35
  }
};

// Helper functions
export function getLevel(levelId: number): (LevelConfig & { module: ModuleConfig }) | null {
  for (const m of MODULES) {
    const lvl = m.levels.find(l => l.id === levelId);
    if (lvl) return { ...lvl, module: m };
  }
  return null;
}

export function getModule(moduleId: number): ModuleConfig | undefined {
  return MODULES.find(m => m.id === moduleId);
}

export function getModeConfig(levelId: number, modeId: string): ModeConfig & {
  timeLimit: number; npcTypes: string[]; route: string; moduleName: string; levelName: string;
} {
  const level = getLevel(levelId);
  const base = { ...MODE_CONFIG[modeId] } as any;
  if (level) {
    base.timeLimit = Math.round(level.timeLimit * base.timeLimitMult);
    base.npcTypes = level.npcTypes;
    base.route = level.route;
    base.moduleName = level.module.name;
    base.levelName = level.name;
  }
  return base;
}

export function getModuleProgress(userData: any) {
  const completed = userData?.completedLevels || [];
  return MODULES.map(m => {
    const levels = m.levels;
    const modes = Object.keys(MODES);
    let done = 0, total = 0;
    levels.forEach(l => {
      modes.forEach(mode => {
        total++;
        if (completed.includes(`${l.id}-${mode}`)) done++;
      });
    });
    return { module: m, done, total, percent: total ? Math.round(done/total*100) : 0 };
  });
}

export function checkCertificateEligibility(userData: any, moduleId: number): boolean {
  const mod = getModule(moduleId);
  if (!mod) return false;
  const completed = userData?.completedLevels || [];
  return mod.levels.every(l =>
    Object.keys(MODES).every(mode => completed.includes(`${l.id}-${mode}`))
  );
}

export function getRecommendedVehicle(levelId: number): VehicleConfig {
  const level = getLevel(levelId);
  if (!level) return VEHICLES[0];
  const themeVehicles: Record<string, string[]> = {
    intersection_mastery: ['car','bus','taxi'],
    pedestrian_courtesy: ['car','bike','cycle'],
    lane_discipline: ['bike','auto','cycle'],
    speed_management: ['car','bike'],
    silence_zone: ['cycle','bike','car'],
    rail_safety: ['car','truck','bus'],
    night_driving: ['car','taxi'],
    emergency_access: ['ambulance','police','car'],
    monsoon_survival: ['car','truck','bus'],
    highway_discipline: ['car','truck','bus'],
    bonus_night_monsoon: ['car','ambulance','truck'],
    bonus_vip_convoy: ['police','car','ambulance']
  };
  const recIds = themeVehicles[level.module.theme] || ['car'];
  return VEHICLES.find(v => recIds.includes(v.id)) || VEHICLES[0];
}

export function getMumbaiStat(violationType: string): MumbaiStat {
  return MUMBAI_STATS[violationType] || { stat: '—', unit: 'data unavailable', year: 2024, source: 'MTP' };
}

export function getAllLevelsFlat(): LevelConfig[] {
  return MODULES.flatMap(m => m.levels);
}

export function getTotalLevels(): number {
  return getAllLevelsFlat().length;
}

export function getTotalModes(): number {
  return Object.keys(MODES).length;
}

export function getTotalPossibleCompletions(): number {
  return getTotalLevels() * getTotalModes();
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).COURSE = {
    MODULES, MODES, VEHICLES, MODE_CONFIG, MUMBAI_STATS,
    getLevel, getModule, getModeConfig, getModuleProgress, checkCertificateEligibility,
    getRecommendedVehicle, getMumbaiStat, getAllLevelsFlat, getTotalLevels, getTotalModes,
    getTotalPossibleCompletions
  };
}
