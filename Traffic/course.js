



const MODES = {
  LEARN:   { id: 'learn',   label: 'LEARN',   icon: '📖', color: '--ion',    desc: 'Theory & rules' },
  PRACTICE:{ id: 'practice',label: 'PRACTICE',icon: '🚗', color: '--signal', desc: 'Hands-on driving' },
  EXAM:    { id: 'exam',    label: 'EXAM',    icon: '📝', color: '--plasma', desc: 'MCQ assessment' },
  CHAOS:   { id: 'chaos',   label: 'CHAOS',   icon: '🌪️', color: '--em',     desc: 'Adaptive stress test' }
};

const VEHICLES = [
  { id: 'car',       name: 'Sedan',       icon: '🚗', recommended: [1,2,3,4,5,7,9,10,11,13,14,15] },
  { id: 'bike',      name: 'Motorcycle',  icon: '🏍️', recommended: [3,4,6,8,12] },
  { id: 'auto',      name: 'Auto-rickshaw',icon: '🛺', recommended: [2,5,6,12] },
  { id: 'bus',       name: 'BEST Bus',    icon: '🚌', recommended: [1,4,7,10] },
  { id: 'truck',     name: 'Truck',       icon: '🚚', recommended: [1,9,11] },
  { id: 'taxi',      name: 'Kaali-Peeli', icon: '🚕', recommended: [1,3,7,13] },
  { id: 'cycle',     name: 'Bicycle',     icon: '🚲', recommended: [3,6] },
  { id: 'ambulance', name: 'Ambulance',   icon: '🚑', recommended: [8] },
  { id: 'police',    name: 'Police Jeep', icon: '🚓', recommended: [8,14] }
];

const MUMBAI_STATS = {
  signal_jump:      { stat: '12,847', unit: 'challans', year: 2024, source: 'Mumbai Traffic Police' },
  sidewalk_bike:    { stat: '45%', unit: 'pedestrian injuries', year: 2024, source: 'MTP Annual Report' },
  wrong_side:       { stat: '8,231', unit: 'cases', year: 2025, source: 'MTP' },
  no_helmet:        { stat: '67%', unit: 'fatalities', year: 2024, source: 'MoRTH' },
  phone_driving:    { stat: '3,412', unit: 'accidents', year: 2025, source: 'MTP' },
  drunk_driving:    { stat: '1,892', unit: 'arrests', year: 2024, source: 'MTP' },
  zebra_violation:  { stat: '23,456', unit: 'challans', year: 2024, source: 'MTP' },
  high_beam:        { stat: '34%', unit: 'night glare complaints', year: 2025, source: 'MTP' },
  ambulance_block:  { stat: '12 min', unit: 'avg delay', year: 2024, source: '108 Ambulance' },
  school_zone:      { stat: '78%', unit: 'speed violations', year: 2025, source: 'MTP School Zone Audit' }
};

const BADGES = [
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

const VIOLATION_MODALS = {
  signal_jump: { title: '🚦 Signal Jump', violation: 'Sec 184 MV Act', fine: '₹1,000–5,000', statKey: 'signal_jump', message: 'Jumping a red signal endangers everyone at the intersection.' },
  sidewalk_bike: { title: '🛣️ Bike on Sidewalk', violation: 'Sec 190(2) MV Act', fine: '₹2,000', statKey: 'sidewalk_bike', message: 'Sidewalks are for pedestrians, not two-wheelers.' },
  wrong_side: { title: '↩️ Wrong Side Driving', violation: 'Sec 184 MV Act', fine: '₹5,000', statKey: 'wrong_side', message: 'Driving against traffic flow causes head-on collisions.' },
  no_helmet: { title: '⛑️ No Helmet', violation: 'Sec 194D MV Act', fine: '₹1,000 + 3-month license suspension', statKey: 'no_helmet', message: 'Helmets save lives — 67% of fatalities were unhelmeted.' },
  phone_driving: { title: '📱 Phone While Driving', violation: 'Sec 184(c) MV Act', fine: '₹5,000', statKey: 'phone_driving', message: 'A text can wait. A life cannot.' },
  drunk_driving: { title: '🍺 Drunk Driving', violation: 'Sec 185 MV Act', fine: '₹10,000 + 6-month imprisonment', statKey: 'drunk_driving', message: 'Even one drink impairs judgment. Don\'t risk it.' },
  zebra_violation: { title: '🦓 Zebra Crossing Violation', violation: 'Sec 138 MV Act', fine: '₹2,000', statKey: 'zebra_violation', message: 'Pedestrians have right of way at crossings.' },
  high_beam: { title: '🔦 High Beam Misuse', violation: 'Sec 177 MV Act', fine: '₹500', statKey: 'high_beam', message: 'High beams blind oncoming drivers. Dip them in traffic.' },
  ambulance_block: { title: '🚑 Ambulance Blocked', violation: 'Sec 194E MV Act', fine: '₹10,000', statKey: 'ambulance_block', message: 'Every minute of delay reduces survival chance by 10%.' },
  school_zone: { title: '🏫 School Zone Speeding', violation: 'Sec 183 MV Act', fine: '₹2,000+', statKey: 'school_zone', message: 'Children are unpredictable. Slow down near schools.' }
};

function showConsequenceModal(violationType) {
  const data = VIOLATION_MODALS[violationType] || { title: 'Violation', fine: '—', message: 'You broke a traffic rule.' };
  const stat = getMumbaiStat(data.statKey || violationType);
  const isMobile = window.innerWidth <= 768;
  
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML = `
    <div style="background:var(--card,#111827);border:1px solid var(--border);border-radius:16px;padding:${isMobile ? '20px' : '28px'};max-width:${isMobile ? '95%' : '420px'};width:100%;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="font-size:${isMobile ? '2.5rem' : '3rem'};">${data.title.split(' ')[0]}</div>
        <div>
          <div style="font-family:'Instrument Serif',serif;font-size:${isMobile ? '1.2rem' : '1.4rem'};font-weight:700;color:var(--red,#ef4444);">${data.title}</div>
          <div style="font-size:${isMobile ? '0.75rem' : '0.8rem'};color:var(--muted);">${data.violation}</div>
        </div>
      </div>
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:12px;margin-bottom:16px;text-align:center;">
        <div style="font-size:${isMobile ? '1.5rem' : '2rem'};font-weight:800;color:var(--red);font-family:'Lora',serif;">${data.fine}</div>
        <div style="font-size:${isMobile ? '0.7rem' : '0.75rem'};color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Fine / Penalty</div>
      </div>
      <div style="font-size:${isMobile ? '0.85rem' : '0.9rem'};color:var(--ink);line-height:1.6;margin-bottom:16px;">${data.message}</div>
      <div style="background:rgba(94,212,245,0.1);border:1px solid rgba(94,212,245,0.3);border-radius:8px;padding:12px;margin-bottom:16px;font-size:${isMobile ? '0.75rem' : '0.8rem'};color:var(--signal);">
        <strong>📊 Mumbai ${stat.year} Data:</strong> ${stat.stat} ${stat.unit} (${stat.source})
      </div>
      <button onclick="this.closest('.modal').remove()" style="width:100%;background:var(--red);color:#fff;border:none;padding:12px;border-radius:10px;font-weight:700;font-size:${isMobile ? '0.9rem' : '1rem'};cursor:pointer;">Understood — Drive Safely</button>
    </div>
  `;
  modal.className = 'modal';
  document.body.appendChild(modal);
}

function getAdaptiveChaosDifficulty(playerSkill) {
  const base = 0.3;
  const skillFactor = Math.max(0, Math.min(1, playerSkill));
  return Math.round((base + skillFactor * 0.7) * 100) / 100;
}

function checkAndAwardBadges(userData) {
  const newBadges = [];
  const badges = userData?.badges || [];
  
  if (userData.streak?.current >= 7 && !badges.includes('streak_7')) newBadges.push('streak_7');
  if (userData.streak?.current >= 30 && !badges.includes('streak_30')) newBadges.push('streak_30');
  if (userData.perfectRuns >= 1 && !badges.includes('perfect_run')) newBadges.push('perfect_run');
  
  const completedCount = Object.keys(userData.comp || {}).length;
  if (completedCount >= 10 && !badges.includes('level_10')) newBadges.push('level_10');
  if (completedCount >= 20 && !badges.includes('level_20')) newBadges.push('level_20');
  if (completedCount >= 30 && !badges.includes('level_30')) newBadges.push('level_30');
  if (completedCount >= 40 && !badges.includes('level_40')) newBadges.push('level_40');
  if (completedCount >= 52 && !badges.includes('level_52')) newBadges.push('level_52');
  
  return newBadges;
}

const MODULES = [
  {
    id: 1, name: 'Andheri Junction', theme: 'intersection_mastery',
    levels: [
      { id: 1, name: 'Signal Basics',           route: 'simple_cross',    timeLimit: 90,  npcTypes: ['car','car','bike','auto','bus','truck'] },
      { id: 2, name: 'Protected Left Turn',     route: 'protected_left',  timeLimit: 100, npcTypes: ['car','auto','bike','car','auto','taxi'] },
      { id: 3, name: 'Pedestrian Phase',        route: 'zebra_heavy',     timeLimit: 110, npcTypes: ['car','bus','auto','car','bike','truck'] },
      { id: 4, name: 'Ambulance Priority',      route: 'emergency_cross', timeLimit: 80,  npcTypes: ['car','truck','bus','car','car','auto'] },
      { id: 5, name: 'Rush Hour Gauntlet',      route: 'dense_cross',     timeLimit: 120, npcTypes: ['car','car','bike','auto','ambulance','car','bus','truck'] }
    ]
  },
  {
    id: 2, name: 'Dadar Junction', theme: 'pedestrian_courtesy',
    levels: [
      { id: 6, name: 'Zebra Yield',           route: 'zebra_basic',      timeLimit: 90,  npcTypes: ['car','bus','auto','car','bike','truck'] },
      { id: 7, name: 'School Children',       route: 'school_zone',      timeLimit: 100, npcTypes: ['car','auto','cycle','bike','auto','car'] },
      { id: 8, name: 'Senior Citizen Cross',  route: 'slow_cross',       timeLimit: 110, npcTypes: ['car','taxi','car','auto','bike','car'] },
      { id: 9, name: 'Hawker Zone',           route: 'sidewalk_vendors', timeLimit: 120, npcTypes: ['car','auto','car','bike','truck','car'] },
      { id: 10, name: 'Monsoon Puddles',      route: 'puddle_etiquette', timeLimit: 100, npcTypes: ['car','bus','bike','auto','car','car'] }
    ]
  },
  {
    id: 3, name: 'Bandra Backroads', theme: 'lane_discipline',
    levels: [
      { id: 11, name: 'Single Lane Flow',    route: 'narrow_one_way',  timeLimit: 90,  npcTypes: ['car','auto','bike','cycle','auto','car'] },
      { id: 12, name: 'Overtaking Rules',    route: 'overtake_zone',   timeLimit: 100, npcTypes: ['car','taxi','bike','auto','car','bike'] },
      { id: 13, name: 'Bus Lane Respect',    route: 'bus_lane',        timeLimit: 110, npcTypes: ['car','auto','taxi','bike','auto','car'] },
      { id: 14, name: 'Cycle Track',         route: 'cycle_track',     timeLimit: 100, npcTypes: ['car','bike','auto','car','cycle','car'] },
      { id: 15, name: 'Gully Navigation',    route: 'gully_maze',      timeLimit: 120, npcTypes: ['auto','bike','cycle','auto','car','auto'] }
    ]
  },
  {
    id: 4, name: 'Juhu Boulevard', theme: 'speed_management',
    levels: [
      { id: 16, name: 'Coastal 40 km/h',     route: 'coastal_straight', timeLimit: 90,  npcTypes: ['car','car','auto','bike','car','bus'] },
      { id: 17, name: 'Beach Parking',       route: 'beach_parking',    timeLimit: 100, npcTypes: ['taxi','car','auto','bike','car','car'] },
      { id: 18, name: 'Sunset Cruise',       route: 'scenic_curve',     timeLimit: 110, npcTypes: ['car','bus','taxi','car','auto','bike'] },
      { id: 19, name: 'Jogger Avoidance',    route: 'jogger_path',      timeLimit: 100, npcTypes: ['car','auto','car','bike','bus','auto'] },
      { id: 20, name: 'High Wind Gusts',     route: 'windy_bridge',     timeLimit: 120, npcTypes: ['car','car','bus','auto','car','truck'] }
    ]
  },
  {
    id: 5, name: 'Parel School Zone', theme: 'silence_zone',
    levels: [
      { id: 21, name: 'No Honking',          route: 'silence_basic',   timeLimit: 90,  npcTypes: ['car','auto','cycle','bike','auto','car'] },
      { id: 22, name: 'Assembly Dismissal',  route: 'school_rush',     timeLimit: 100, npcTypes: ['taxi','car','auto','bike','car','cycle'] },
      { id: 23, name: 'Ambulance Silencer',  route: 'hospital_approach',timeLimit: 80,  npcTypes: ['car','auto','taxi','car','auto','car'] },
      { id: 24, name: 'Library Zone',        route: 'library_quiet',   timeLimit: 110, npcTypes: ['car','cycle','auto','car','bus','auto'] },
      { id: 25, name: 'Exam Season',         route: 'exam_stress',     timeLimit: 120, npcTypes: ['car','bus','car','auto','car','taxi'] }
    ]
  },
  {
    id: 6, name: 'Matunga Rail Corridor', theme: 'rail_safety',
    levels: [
      { id: 26, name: 'Level Crossing',      route: 'rail_crossing',   timeLimit: 100, npcTypes: ['car','auto','car','bike','car','auto'] },
      { id: 27, name: 'Gate Timing',         route: 'gate_timing',     timeLimit: 90,  npcTypes: ['taxi','car','auto','bike','car','truck'] },
      { id: 28, name: 'Metro Pillar Nav',    route: 'metro_pillars',   timeLimit: 110, npcTypes: ['car','auto','taxi','car','auto','bike'] },
      { id: 29, name: 'Train Horn Reaction', route: 'horn_reaction',   timeLimit: 100, npcTypes: ['car','truck','auto','car','car','bike'] },
      { id: 30, name: 'Peak Hour Commute',   route: 'commuter_crush',  timeLimit: 120, npcTypes: ['car','auto','car','bike','truck','auto'] }
    ]
  },
  {
    id: 7, name: 'Marine Drive', theme: 'night_driving',
    levels: [
      { id: 31, name: 'High Beam Etiquette', route: 'high_beam_bay',   timeLimit: 100, npcTypes: ['car','car','auto','bike','car','bus'] },
      { id: 32, name: 'Drunk Driver Spot',   route: 'drunk_pattern',   timeLimit: 110, npcTypes: ['taxi','car','auto','bike','car','car'] },
      { id: 33, name: 'Sea Mist Visibility', route: 'mist_drive',      timeLimit: 120, npcTypes: ['car','bus','taxi','car','auto','bike'] },
      { id: 34, name: 'Couple Seats',        route: 'parked_cars',     timeLimit: 100, npcTypes: ['car','auto','car','bike','car','car'] },
      { id: 35, name: 'Racer Deterrence',    route: 'street_race',     timeLimit: 90,  npcTypes: ['car','car','bus','auto','taxi','car'] }
    ]
  },
  {
    id: 8, name: 'Byculla', theme: 'emergency_access',
    levels: [
      { id: 36, name: 'Narrow Lane Ambulance', route: 'narrow_ambulance',timeLimit: 80,  npcTypes: ['car','auto','car','bike','auto','car'] },
      { id: 37, name: 'Fire Engine Clear',     route: 'fire_engine',      timeLimit: 90,  npcTypes: ['truck','car','taxi','auto','bike','car'] },
      { id: 38, name: 'Police Chase Assist',   route: 'police_chase',     timeLimit: 100, npcTypes: ['car','truck','car','taxi','auto','car'] },
      { id: 39, name: '108 Bike Paramedic',    route: 'bike_paramedic',   timeLimit: 90,  npcTypes: ['car','auto','bike','car','auto','car'] },
      { id: 40, name: 'Disaster Evacuation',   route: 'evacuation',       timeLimit: 120, npcTypes: ['car','car','bus','truck','auto','car'] }
    ]
  },
  {
    id: 9, name: 'Hindmata', theme: 'monsoon_survival',
    levels: [
      { id: 41, name: 'Waterlogged Roads',   route: 'flooded_street', timeLimit: 110, npcTypes: ['car','auto','bike','car','auto','taxi'] },
      { id: 42, name: 'Pothole Slalom',      route: 'pothole_field',  timeLimit: 100, npcTypes: ['car','auto','taxi','car','auto','car'] },
      { id: 43, name: 'Open Manhole',        route: 'manhole_dodge',  timeLimit: 100, npcTypes: ['car','bus','auto','bike','car','auto'] },
      { id: 44, name: 'Zero Visibility',     route: 'blind_rain',     timeLimit: 120, npcTypes: ['car','auto','car','bike','bus','auto'] },
      { id: 45, name: 'Stranded Vehicle',    route: 'stall_rescue',   timeLimit: 110, npcTypes: ['car','cycle','auto','car','bus','auto'] }
    ]
  },
  {
    id: 10, name: 'Eastern Express Hwy', theme: 'highway_discipline',
    levels: [
      { id: 46, name: 'Lane Discipline 80',  route: 'highway_lanes',   timeLimit: 90,  npcTypes: ['car','truck','bus','car','auto','bike'] },
      { id: 47, name: 'Exit Merge',          route: 'merge_exit',      timeLimit: 100, npcTypes: ['car','truck','bus','car','taxi','auto'] },
      { id: 48, name: 'Toll Plaza Flow',     route: 'toll_plaza',      timeLimit: 80,  npcTypes: ['car','bike','car','truck','bus','car'] },
      { id: 49, name: 'Breakdown Shoulder',  route: 'shoulder_assist', timeLimit: 110, npcTypes: ['car','auto','bike','car','truck','bus'] },
      { id: 50, name: 'Convoy Escort',       route: 'vip_convoy',      timeLimit: 120, npcTypes: ['car','car','bus','truck','car','auto'] }
    ]
  },
  {
    id: 11, name: 'Bonus: Night Monsoon', theme: 'bonus_night_monsoon',
    levels: [
      { id: 51, name: 'Monsoon Nightmare',   route: 'night_flood',     timeLimit: 180, npcTypes: ['car','truck','bus','car','auto','bike','car','ambulance'] }
    ]
  },
  {
    id: 12, name: 'Bonus: VIP Convoy', theme: 'bonus_vip_convoy',
    levels: [
      { id: 52, name: 'Protocol Drive',      route: 'protocol_route',  timeLimit: 150, npcTypes: ['police','car','car','ambulance','car','truck','bus','car'] }
    ]
  },
  {
    id: 13, name: 'Bonus: Free Roam', theme: 'bonus_free_roam',
    levels: [
      { id: 53, name: 'City Sandbox',      route: 'free_roam',  timeLimit: 999, npcTypes: ['car','bus','auto','bike','truck'], assets: ['lowpoly_city'] }
    ]
  }
];

const MODE_CONFIG = {
  LEARN: {
    timeLimitMult: 1.5,
    npcDensityMult: 0.3,
    passThreshold: 0.6,
    xpBase: 50,
    badge: null,
    streakBonus: 0,
    allowHints: true,
    showGhostCar: true,
    theorySlides: true
  },
  PRACTICE: {
    timeLimitMult: 1.0,
    npcDensityMult: 0.7,
    passThreshold: 0.75,
    xpBase: 100,
    badge: 'practice',
    streakBonus: 10,
    allowHints: true,
    showGhostCar: false,
    theorySlides: false
  },
  EXAM: {
    timeLimitMult: 0.8,
    npcDensityMult: 1.0,
    passThreshold: 0.85,
    xpBase: 200,
    badge: 'exam',
    streakBonus: 25,
    allowHints: false,
    showGhostCar: false,
    theorySlides: false,
    mcqCount: 5
  },
  CHAOS: {
    timeLimitMult: 0.7,
    npcDensityMult: 1.5,
    passThreshold: 0.7,
    xpBase: 300,
    badge: 'chaos',
    streakBonus: 50,
    allowHints: false,
    showGhostCar: false,
    theorySlides: false,
    adaptive: true,
    ruleBreakerRate: 0.35
  }
};

function getLevel(levelId) {
  for (const m of MODULES) {
    const lvl = m.levels.find(l => l.id === levelId);
    if (lvl) return { ...lvl, module: m };
  }
  return null;
}

function getModule(moduleId) {
  return MODULES.find(m => m.id === moduleId);
}

function getModeConfig(levelId, modeId) {
  const level = getLevel(levelId);
  if (!level) return MODE_CONFIG[modeId];
  const base = { ...MODE_CONFIG[modeId] };
  base.timeLimit = Math.round(level.timeLimit * base.timeLimitMult);
  base.npcTypes = level.npcTypes;
  base.route = level.route;
  base.moduleName = level.module.name;
  base.levelName = level.name;
  return base;
}

function getModuleProgress(userData) {
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

function checkCertificateEligibility(userData, moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return false;
  const completed = userData?.completedLevels || [];
  return mod.levels.every(l => 
    Object.keys(MODES).every(mode => completed.includes(`${l.id}-${mode}`))
  );
}

function getRecommendedVehicle(levelId) {
  const level = getLevel(levelId);
  if (!level) return VEHICLES[0];
  const theme = level.module.theme;
  const themeVehicles = {
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
  const recIds = themeVehicles[theme] || ['car'];
  return VEHICLES.find(v => recIds.includes(v.id)) || VEHICLES[0];
}

function getMumbaiStat(violationType) {
  return MUMBAI_STATS[violationType] || { stat: '—', unit: 'data unavailable', year: 2024, source: 'MTP' };
}

function getAllLevelsFlat() {
  return MODULES.flatMap(m => m.levels);
}

function getTotalLevels() {
  return getAllLevelsFlat().length;
}

function getTotalModes() {
  return Object.keys(MODES).length;
}

function getTotalPossibleCompletions() {
  return getTotalLevels() * getTotalModes();
}

if (typeof module !== 'undefined') {
  module.exports = { MODULES, MODES, VEHICLES, MODE_CONFIG, MUMBAI_STATS,
    getLevel, getModule, getModeConfig, getModuleProgress, checkCertificateEligibility,
    getRecommendedVehicle, getMumbaiStat, getAllLevelsFlat, getTotalLevels, getTotalModes, getTotalPossibleCompletions };
}

if (typeof window !== 'undefined') {
  window.COURSE = { MODULES, MODES, VEHICLES, MODE_CONFIG, MUMBAI_STATS,
    getLevel, getModule, getModeConfig, getModuleProgress, checkCertificateEligibility,
    getRecommendedVehicle, getMumbaiStat, getAllLevelsFlat, getTotalLevels, getTotalModes, getTotalPossibleCompletions };
}