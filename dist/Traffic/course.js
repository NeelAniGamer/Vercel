



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

// ─── CAMPAIGN / MISSION CHAINS ───
const CAMPAIGNS = [
  {
    id: 'andheri_initiation',
    moduleId: 1,
    name: 'Andheri Initiation',
    description: 'Master the basics of Mumbai intersection navigation',
    icon: '🚦',
    color: '--ion',
    storyIntro: 'Welcome to Andheri Junction - Mumbai\'s beating heart where every second counts. Your instructor, Constable Patil, has seen it all: "Beta, Mumbai mein signal sirf light nahi, zindagi ka sawaal hai."',
    missions: [
      {
        levelId: 1,
        missionType: 'CHECKPOINT',
        title: 'Signal Basics',
        briefing: 'Learn the rhythm of Mumbai signals. Green means go, but always check cross-traffic.',
        storyBeat: '06:47 AM. Andheri Station Road. A family of four crosses - father, mother, two kids with backpacks. Behind you, three autorickshaws honk in chorus. Patil: "Solid white line ke peechhe ruk jao. Pedestrians pehle, tum baad mein."',
        objectives: {
          primary: 'Wait at red light behind stop line. Let all pedestrians cross fully.',
          secondary: ['Ignore honking pressure (0 violations)', 'Move only on solid green', 'Complete within 90 seconds'],
          bonus: 'Zero honking from NPCs behind you'
        },
        characterDialogue: [
          { speaker: 'Constable Patil', line: '"Beta, Mumbai mein signal sirf light nahi - zindagi ka sawaal hai."', context: 'Briefing' },
          { speaker: 'NPC Auto Driver', line: '"Arre bhai, chalo na! Green hai na?"', context: 'Horn pressure' },
          { speaker: 'Mother crossing', line: '"Bachchon ka haath pakad ke chalo, gaadi rukne de."', context: 'Pedestrian voice' }
        ],
        consequences: {
          success: 'Patil nods. "Theek hai. Pehle subah, pehle signal - seekh liya." +500Rs',
          failure: 'Challan issued. Patil sighs. "Dubara mat karna." -1000Rs, retry required',
          perfect: 'Zero violations + no honking = "Perfect Run" bonus + Mission Token'
        },
        mumbaiContext: 'Andheri Station sees 600,000+ daily commuters. Peak hour: 8-10 AM, 6-8 PM. Average wait: 47 seconds.'
      },
      {
        levelId: 2,
        missionType: 'ESCORT',
        title: 'Protected Left Turn',
        briefing: 'Escort a senior officer through the protected left turn. Keep distance, match speed.',
        storyBeat: '07:15 AM. VIP movement. A white Ambassador with red beacon needs escort through the protected left turn lane. Stay 15m behind, match speed exactly. Officer\'s aide: "Sir ko Bandra Court mein 8 baje pohochna hai."',
        objectives: {
          primary: 'Escort VIP vehicle through 3 protected left turns without gap >25m or <10m',
          secondary: ['Maintain 20-30 km/h steady', 'Clear each intersection before VIP arrives', 'Zero red-light violations'],
          bonus: 'VIP arrives exactly on time'
        },
        characterDialogue: [
          { speaker: "Officer's Aide", line: '"Driver sahab, Sir ko time pe pohochana hai. Signal kaatna toh door, horn bhi mat bajana."', context: 'Briefing' },
          { speaker: 'Constable Patil (radio)', line: '"Unit 1, intersection clear. Unit 2, hold traffic at SV Road."', context: 'Radio' },
          { speaker: 'VIP (muffled)', line: '"Acche driver ho. Mumbai police ko aise hi log chahiye."', context: 'On success' }
        ],
        consequences: {
          success: 'VIP arrives early. Aide hands you a card: "Mumbai Traffic Police - Honorary Escort." +2000Rs',
          failure: 'Gap too large/small = VIP delayed. "Agla baar koi aur le lenge." -500Rs, retry',
          perfect: 'Zero gap violations + on-time = "Protocol Driver" title + Mission Token'
        },
        mumbaiContext: 'VIP movements at Andheri: 200+/year. Average escort convoy: 8 vehicles. Protected turns reduce accidents by 61%.'
      },
      {
        levelId: 3,
        missionType: 'CROSSING_GUARD',
        title: 'Pedestrian Phase',
        briefing: 'Guide school children across the zebra. Your stop sign is their safety.',
        storyBeat: '07:45 AM. School dismissal. St. Xavier High School gates open. 200+ children in navy uniforms flood the zebra. You are the crossing guard today - fluorescent vest, handheld stop sign. Patil: "Aaj tum guard ho. Ek bhi bachcha galat side se nikla toh zimmedari tumhari."',
        objectives: {
          primary: 'Guide 5 groups of children across safely',
          secondary: ['Stop traffic before each group enters', 'Zero children crossing outside zebra', 'Assist elderly guard Dada'],
          bonus: 'Zero honking at your stop sign'
        },
        characterDialogue: [
          { speaker: 'Crossing Guard Dada', line: '"Beta, 20 saal se khada hoon yahan. Signal toh light hai, par bachchon ki zindagi hai."', context: 'Mentorship' },
          { speaker: 'Class 3 Student', line: '"Didi, hum line mein hain na? Teacher ne bola line tootni nahi chahiye."', context: 'Child holding rope' },
          { speaker: 'Impatient Biker', line: '"Arre uncle, kitna time lagega? Late ho raha hoon!"', context: 'Horn pressure' }
        ],
        consequences: {
          success: 'All 5 groups cross safely. Dada pats your shoulder. "Achha kaam kiya beta." +1500Rs',
          failure: 'Child strays outside zebra = instant fail. "Bachcha galat jagah se nikla! Challan." -2000Rs',
          perfect: 'Zero outside-zebra + assisted Dada = "Guardian of the Zebra" badge + Mission Token'
        },
        mumbaiContext: 'Andheri has 47 schools within 2km. Peak crossing: 7:30-8:00 AM. 3,400+ children daily. 23 crossing guards deployed.'
      },
      {
        levelId: 4,
        missionType: 'ESCORT',
        title: 'Ambulance Run',
        briefing: 'Clear the path for an emergency ambulance. Every second counts.',
        storyBeat: '08:30 AM. Code Red. 108 Ambulance - cardiac arrest, 54-year-old male, Andheri East. Golden hour: 8 minutes to Cooper Hospital. You are lead escort. Radio: "Unit 1, clear SV Road junction. Ambulance ETA 3 minutes." Rain starts.',
        objectives: {
          primary: 'Clear 4 intersections ahead of ambulance. Ambulance must not stop.',
          secondary: ['Zero pedestrians in ambulance path', 'Push double-parked autos off lane', 'Maintain 30 km/h minimum'],
          bonus: 'Ambulance reaches hospital in under 6 minutes'
        },
        characterDialogue: [
          { speaker: 'Ambulance Driver (radio)', line: '"108 Control, patient critical. BP dropping. Need green corridor NOW."', context: 'Emergency' },
          { speaker: 'Constable Patil (radio)', line: '"Sab units - ambulance priority. Jo bhi raaste mein hai, hatao. Life pehle."', context: 'Command' },
          { speaker: 'Bystander', line: '"Bhaiya, mera auto yahan khada tha... main hatata hoon!"', context: 'Cooperative civilian' }
        ],
        consequences: {
          success: 'Patient stabilized at Cooper. Doctor: "5 minute bach gaye." Ambulance driver salutes. +3000Rs',
          failure: 'Ambulance stops >10 sec = critical delay. "Patient lost pulse." -5000Rs, mandatory retry',
          perfect: 'Sub-6 min + zero obstacles = "Golden Hour Guardian" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Mumbai 108 handles 1,200+ calls/day. Green corridors cut response from 18 min to 8 min. Section 194E fine: Rs10,000.'
      },
      {
        levelId: 5,
        missionType: 'CHASE',
        title: 'Rush Hour Gauntlet',
        briefing: 'A violator flees into dense traffic. Apprehend without causing pile-ups.',
        storyBeat: '09:15 AM. Peak rush. A black SUV jumps the red at Andheri junction, nearly hits a cyclist. You pursue. Radio: "Suspect vehicle MH-02-XY-4488. Reckless driving, hit-and-run cyclist. Apprehend. Do NOT ram - civilian traffic heavy."',
        objectives: {
          primary: 'Close to under 8m distance and perform PIT maneuver below 25 km/h',
          secondary: ['Zero civilian collisions', 'Zero property damage', 'Maintain visual contact throughout'],
          bonus: 'Apprehend within 90 seconds'
        },
        characterDialogue: [
          { speaker: 'Constable Patil (radio)', line: '"Driver, usko pakadna hai - lekin kisi ko chot na lage. PIT sirf jab speed 25 ke neeche ho."', context: 'Orders' },
          { speaker: 'Suspect (muffled)', line: '"Nahi pakdega mujhe! Mumbai police... hah!"', context: 'Taunting' },
          { speaker: 'Cyclist Victim', line: '"Thank you, officer. Woh mujhe udaake nikal gaya. Haath toot ta bach gaya."', context: 'At apprehension' }
        ],
        consequences: {
          success: 'SUV stopped. Driver arrested - 3 prior challans, no license. Cyclist gives thumbs up. +4000Rs',
          failure: 'Civilian collision / suspect escapes = "Suspect at large. Review pursuit policy." -2000Rs, debrief',
          perfect: 'Sub-90s + zero damage + PIT below 20 km/h = "Precision Pursuit" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Andheri peak: 9,000 vehicles/hour. Chase success rate: 34%. PIT authorized only for trained officers. Section 184 fine: Rs5,000.'
      }
    ],
    rewards: { wallet: 15000, xp: 5000, badge: 'signal_master', unlock: 'module_2' }
  },
  {
    id: 'dadar_courtesy',
    moduleId: 2,
    name: 'Dadar Courtesy',
    description: 'Pedestrian-first driving in Mumbai\'s busiest junction',
    icon: '🚶',
    color: '--em',
    prerequisite: 'andheri_initiation',
    storyIntro: 'Dadar Station - 7 lakh commuters daily. Your mentor, Traffic Havaldar Desai, has guarded these crossings for 25 years. His whistle cuts through chaos: "Dadar mein paidal chalne wala bhagwan hai. Gaadi wala uska sevak."',
    missions: [
      {
        levelId: 6,
        missionType: 'CHECKPOINT',
        title: 'Zebra Yield',
        briefing: 'Every zebra crossing is a promise. Stop, look, then proceed.',
        storyBeat: '07:30 AM. Dadar East. The station disgorges a human tide. You approach the main zebra at Kabutar Khana. Desai: "Zebra crossing promise hai - todna nahi." A grandmother with a walker steps onto the crossing. Behind you, a BEST bus hisses impatiently.',
        objectives: {
          primary: 'Stop fully at 3 zebra crossings. Let ALL pedestrians clear before moving.',
          secondary: ['Zero forward creep at red', 'Wait for slowest pedestrian (grandmother)', 'No honking at crossings'],
          bonus: 'Zero violations + assisted grandmother across'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai', line: '"Zebra pe pair rakhna - paap hai. Pair hatana - farz hai. Samjha?"', context: 'Teaching' },
          { speaker: 'Grandmother (Dadi)', line: '"Beta, ghutne dard karte hain. Thoda time de do na."', context: 'Crossing slowly' },
          { speaker: 'BEST Bus Conductor', line: '"Driver sahab, chalo na! Schedule tight hai!"', context: 'Pressure from behind' }
        ],
        consequences: {
          success: 'Desai nods. "Theek hai. Aaj pehli baar kisi ne dadi ko intezaar karwaya." +800Rs',
          failure: 'Creep forward / honk = "Zebra tod diya! Challan kaat." -1500Rs, retry',
          perfect: 'Zero creep + assisted Dadi = "Zebra Guardian" badge + Mission Token'
        },
        mumbaiContext: 'Dadar has 47 zebra crossings within 1km. 2.1 lakh pedestrians/hour peak. 34% violations occur at zebras.'
      },
      {
        levelId: 7,
        missionType: 'CROSSING_GUARD',
        title: 'School Children',
        briefing: 'Morning rush at Dadar station. Hundreds of children cross here daily.',
        storyBeat: '07:45 AM. Don Bosco High School dismissal - 400+ boys in white shirts surge onto the zebra like a wave. You are the crossing guard. Desai hands you the stop sign: "Aaj tum commander ho. Ek bhi bachcha galat side gaya, zimmedari tumhari."',
        objectives: {
          primary: 'Guide 6 groups (12-15 boys each) across the main zebra safely',
          secondary: ['Stop traffic BEFORE each group enters', 'Zero boys crossing outside zebra', 'Manage the late-running group separately'],
          bonus: 'Zero honking during crossing'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai', line: '"Ye 400 bachche hain. Unke maa-baap ka bharosa tum pe hai. Ek bhi mistake maafi nahi."', context: 'Responsibility' },
          { speaker: 'Class 8 Boy (Rohan)', line: '"Sir, mujhe tuition ke late ho raha hai! Jaldi karo na!"', context: 'Running late group' },
          { speaker: 'Impatient Biker', line: '"Arre uncle, kitna time lagega? Office ke late ho raha!"', context: 'Horn pressure' }
        ],
        consequences: {
          success: 'All 6 groups cross. Desai: "Achha kiya beta. Kal bhi aana." +1200Rs',
          failure: 'Boy outside zebra = "Bachcha galat jagah! Challan." -2500Rs, mandatory retry',
          perfect: 'Zero outside + managed late group = "School Captain" title + Mission Token'
        },
        mumbaiContext: 'Dadar has 23 schools within 500m. 12,000+ children cross daily. Peak: 7:15-7:45 AM and 1:30-2:00 PM.'
      },
      {
        levelId: 8,
        missionType: 'SIDEWALK_PATROL',
        title: 'Senior Citizens',
        briefing: 'Elders move slowly. Give them time. Report bikes on sidewalks.',
        storyBeat: '10:00 AM. Shivaji Park walkers - 70+ seniors in tracksuits, some with canes, one in wheelchair. They cross at the slow zebra near the park gate. Desai on radio: "Sidewalk patrol duty. Bike pe pair rakhne wala challan. Senior ko intezaar karwao."',
        objectives: {
          primary: 'Assist 4 seniors across. Report 3 bikes-on-sidewalk violations.',
          secondary: ["Walk at senior's pace (zero rushing)", 'Guide wheelchair user via ramp', 'Stop bikers verbally'],
          bonus: 'Zero senior complaints'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai (radio)', line: '"Unit 4, sidewalk pe bike dekho toh challan. Senior ko haath deke cross karwao."', context: 'Orders' },
          { speaker: 'Senior (Mr. Iyer, 78)', line: '"Beta, pehle pair nahi uthte the. Ab wheelchair hai. Tum jaise log chahiye."', context: 'Gratitude' },
          { speaker: 'Biker on Footpath', line: '"Arre sir, shortcut hi toh hai! Challan mat karo!"', context: 'Violation' }
        ],
        consequences: {
          success: 'All 4 seniors cross. Mr. Iyer blesses: "Khush raho beta." +1000Rs',
          failure: 'Rushed senior / missed bike = "Senior girta toh? Bike bhaagta toh?" -2000Rs',
          perfect: 'Zero rushing + 3 bikes caught = "Footpath Rakshak" badge + Mission Token'
        },
        mumbaiContext: 'Dadar seniors: 45,000+ (12% population). Bike-on-footpath challans: 1,200/month. 14 senior-friendly crossings.'
      },
      {
        levelId: 9,
        missionType: 'EVASION',
        title: 'Hawker Maze',
        briefing: 'Navigate the vendor zone without hitting stalls. Patience over speed.',
        storyBeat: '06:30 PM. Dadar Phool Market - monsoon evening. Flower vendors, fruit sellers, vada pav stalls spill onto the road. The lane is 3 meters wide. Desai: "Yahan speed matlab maut. Dheere jao, horn mat bajao, stall mat todo."',
        objectives: {
          primary: 'Traverse 300m vendor lane in under 3 mins. Zero stall contact. Zero honking.',
          secondary: ['Speed below 8 km/h throughout', 'Yield to 5+ pushing carts', 'Stop for 2 elderly vendors'],
          bonus: 'Vendor offers free vada pav'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai', line: '"Phool wale, phal wale, vada pav wale - sab ka haq hai road pe. Tum mehmaan ho."', context: 'Philosophy' },
          { speaker: 'Flower Vendor (Phoolwali)', line: '"Saheb, genda phool le lo na! Aaj mangalwar hai, bikri achhi hogi."', context: 'Sales pitch mid-lane' },
          { speaker: 'Vada Pav Wala', line: '"Arre driver babu, ek vada pav kha lo! Thande mein maza aayega."', context: 'Free offer on perfect run' }
        ],
        consequences: {
          success: 'Exited clean. Vendor waves: "Aaj ke baad aana, discount dunga." +900Rs',
          failure: 'Stall hit / honk = "Stall toot gaya! Nuksan kaun bharega?" -1500Rs, retry',
          perfect: 'Zero contact + zero honk + bought vada pav = "Market Mitra" title + Mission Token'
        },
        mumbaiContext: 'Dadar Phool Market: 300+ stalls, 15,000 daily visitors. Lane width: 2.5-3.5m. Peak: 6-9 PM.'
      },
      {
        levelId: 10,
        missionType: 'CARGO',
        title: 'Monsoon Delivery',
        briefing: 'Deliver medical supplies through flooded streets. Keep cargo dry.',
        storyBeat: '08:00 PM. July 26th anniversary. Dadar TT Circle flooded - 2 feet water. KEM Hospital needs blood bags, saline, medicines. You drive a tempo. Desai: "26 July yaad hai na? 2005. Dadar doob gaya tha. Aaj cargo bacha ke jaana hai."',
        objectives: {
          primary: 'Deliver 100% medical cargo to KEM Hospital. Cargo integrity above 95%.',
          secondary: ['Water depth under 1.5 ft (avoid deeper)', 'Zero sudden braking (blood bags rupture)', 'Time under 15 mins'],
          bonus: 'Doctor meets you personally'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai', line: '"26 July yaad hai na? 2005. Dadar doob gaya tha. Aaj tum usi raaste se jaa rahe ho - lekin cargo bacha ke."', context: 'Historical weight' },
          { speaker: 'KEM Doctor (Dr. Patil)', line: '"Driver sahab, blood units bach gaye toh 3 surgeries ho payengi. Shukriya."', context: 'On delivery' },
          { speaker: 'Tempo Helper', line: '"Bhaiya, paani engine tak aa gaya! Dheere chala!"', context: 'Water rising' }
        ],
        consequences: {
          success: 'All cargo delivered. Dr. Patil: "Aaj 3 jaan bach gayi." +2000Rs',
          failure: 'Cargo under 95% / stalled = "Dawai kharab ho gayi. Operation cancel." -5000Rs, mandatory retry',
          perfect: '100% integrity + under 12 mins = "Monsoon Lifeline" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Dadar floods: 2005 (944mm/24h), 2017, 2019. KEM handles 1.8M patients/yr. Blood demand: 500 units/day.'
      }
    ],
    rewards: { wallet: 20000, xp: 7500, badge: 'crossing_guard', unlock: 'module_3' }
  },
  {
    id: 'bandra_discipline',
    moduleId: 3,
    name: 'Bandra Discipline',
    description: 'Lane discipline and overtaking etiquette on backroads',
    icon: '🛣️',
    color: '--signal',
    prerequisite: 'dadar_courtesy',
    storyIntro: 'Bandra Backroads - where the city forgets its rules. Your mentor, Senior Inspector Khan, has patrolled these gullies for 18 years. His mantra: "Lane mein chalo, signal do, overtake karo - warna challan pakka."',
    missions: [
      {
        levelId: 11,
        missionType: 'CHECKPOINT',
        title: 'Single Lane Flow',
        briefing: 'Narrow roads demand discipline. Stay in lane, signal early.',
        storyBeat: '06:15 AM. Hill Road - 3.5m wide, two-way, parked cars both sides. Auto-rickshaws, bikes, cycles, handcarts all in one lane. Khan: "Yahan lane nahi hai, line hai. Us line pe chalo. Signal do, phir badlo." A parked car door opens suddenly.',
        objectives: {
          primary: 'Traverse 800m Hill Road maintaining single-file discipline. Zero lane departures.',
          secondary: ['Signal 3+ seconds before every move', 'Yield to oncoming vehicles in passing bays', 'Stop for pedestrians at informal crossing'],
          bonus: 'Zero honking from oncoming traffic'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan', line: '"Yahan do gaadi ek saath nahi chal sakti. Pehle tum, phir woh. Signal do, phir badlo."', context: 'Rule' },
          { speaker: 'Auto Driver (Raju)', line: '"Saheb, main side mein khada hoon. Aap nikal jao!"', context: 'Yielding' },
          { speaker: 'Cyclist (Meera)', line: '"Uncle, main left mein hoon. Aap right se nikal jao."', context: 'Sharing narrow lane' }
        ],
        consequences: {
          success: 'Khan nods. "Theek hai. Line pe chalna seekh gaya." +1000Rs',
          failure: 'Lane departure / no signal = "Lane tod diya! Challan." -1500Rs, retry',
          perfect: 'Zero departures + all signals = "Single Lane Master" badge + Mission Token'
        },
        mumbaiContext: 'Hill Road: 1.2km, 3.5m wide, 2,400 vehicles/hr peak. 47% violations are lane departures. 12 passing bays.'
      },
      {
        levelId: 12,
        missionType: 'CHASE',
        title: 'Overtaking Rules',
        briefing: 'A reckless driver forces passes. Stop them before they cause a crash.',
        storyBeat: '07:30 AM. Linking Road. A white SUV forces overtakes on blind curves, crosses solid yellow line, nearly hits a scooter. Khan on radio: "Unit 3, intercept white SUV. Forced overtakes, near-miss scooter. Apprehend. No ramming - civilian density high."',
        objectives: {
          primary: 'Close to under 10m. Perform PIT below 30 km/h on straight stretch. Zero civilian contact.',
          secondary: ['Maintain visual on SUV through 3 curves', 'Call out violations on radio', 'Clear intersection ahead of SUV'],
          bonus: 'Apprehend before Waterfield Road junction'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan (radio)', line: '"Driver, usko pakadna hai - lekin scooter wale ko kuch na ho. Straight pe PIT. Curve pe nahi."', context: 'Tactics' },
          { speaker: 'SUV Driver (muffled)', line: '"Kaun pakdega? Main Bandra ka raja hoon!"', context: 'Arrogant taunt' },
          { speaker: 'Scooter Rider (Anjali)', line: '"Thank you, officer! Woh mujhe udaake nikal gaya. Haath toot ta bach gaya."', context: 'At apprehension' }
        ],
        consequences: {
          success: 'SUV stopped. Driver: 5 prior challans, suspended license. Anjali gives thumbs up. +3000Rs',
          failure: 'Civilian contact / escape = "Suspect at large. Review intercept policy." -2000Rs, debrief',
          perfect: 'Under 2 min + zero damage + called violations = "Precision Interceptor" title + Mission Token'
        },
        mumbaiContext: 'Linking Road: 2.8km. Overtaking violations: 1,800/month. 67% happen on curves/solid lines.'
      },
      {
        levelId: 13,
        missionType: 'ESCORT',
        title: 'Bus Lane Honor',
        briefing: 'Escort a BEST bus through its dedicated lane. Protect public transport.',
        storyBeat: '08:00 AM. SV Road dedicated bus lane (red painted). BEST Route 213 - 42 passengers, running late. Khan: "Bus lane public transport ka haq hai. Car wale ghus ke baith jaate hain. Tum bus ke saath chalo, lane clear karo."',
        objectives: {
          primary: 'Escort Bus 213 through 2.5km bus lane. Zero vehicles in lane ahead of bus.',
          secondary: ['Push violators out of lane', 'Maintain 5m gap behind bus', 'Clear intersections before bus arrives'],
          bonus: 'Bus arrives on schedule'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan', line: '"Bus lane sirf bus ke liye. Car wala ghus gaya toh usko nikaalo. Public transport pehle."', context: 'Priority' },
          { speaker: 'Bus Driver (Santosh)', line: '"Officer sahab, aaj lane clear hai! Pehli baar time pe pohochenge."', context: 'Gratitude' },
          { speaker: 'Taxi Driver (cutting in)', line: '"Arre sir, passenger late hai! Ek minute hi toh chahiye!"', context: 'Violation' }
        ],
        consequences: {
          success: 'Bus arrives 3 min early. Santosh: "Officer sahab, aaj dil khush kar diya." +2500Rs',
          failure: 'Taxi not cleared / bus delayed = "Bus late hui. Commuter pareshaan." -2000Rs, retry',
          perfect: 'Zero lane violators + on-time = "BEST Friend" title + 2 Mission Tokens'
        },
        mumbaiContext: 'SV Road bus lane: 4.2km, camera enforced. 350 BEST buses/day. Violators: 400/day. Fine: Rs500 + points.'
      },
      {
        levelId: 14,
        missionType: 'SIDEWALK_PATROL',
        title: 'Cycle Track',
        briefing: 'Cyclists have their lane. Ensure cars respect the boundary.',
        storyBeat: '06:30 PM. Carter Road promenade - 2m green cycle track separated by bollards. Cyclists: delivery boys, fitness riders, kids. Cars park over bollards. Khan: "Cycle track cycle ke liye. Car wala ghus gaya toh challan."',
        objectives: {
          primary: 'Patrol 1.5km cycle track. Clear 4 parked cars. Guide 6 cyclists past obstructions.',
          secondary: ['Issue 4 challans for track parking', "Escort kids' cycling group", 'Zero cyclist forced onto main road'],
          bonus: 'Cyclist group waves thanks'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan', line: '"Cycle track - green paint, bollard, sign. Sab dikhta hai. Phir bhi car wala ghus jaata hai. Tum hatao."', context: 'Frustration' },
          { speaker: 'Delivery Cyclist (Arjun)', line: '"Sir, main Zomato ke liye kaam karta hoon. Track clear hota hai toh time bachta hai!"', context: 'Livelihood angle' },
          { speaker: 'Car Owner (parked)', line: '"Arre sir, bas 5 minute ke liye tha! Challan mat karo!"', context: 'Violation excuse' }
        ],
        consequences: {
          success: 'Track clear. Arjun: "Sir, aaj track saaf hai. Delivery fast hui!" +1800Rs',
          failure: 'Car not moved / cyclist forced out = "Cycle wala sadak pe aaya! Challan." -2000Rs, retry',
          perfect: '4 challans + kids escorted = "Green Lane Guardian" badge + Mission Token'
        },
        mumbaiContext: 'Carter Road cycle track: 2.2km. 1,200 cyclists/day. Parking violations: 180/day. Fine: Rs1,000.'
      },
      {
        levelId: 15,
        missionType: 'EVASION',
        title: 'Gully Escape',
        briefing: 'Navigate the maze while avoiding aggressive local traffic.',
        storyBeat: '10:00 PM. Bandra gullies - 2m wide, dead ends, sharp turns, resident cars parked both sides. Local riders in modified autos box you in. Khan (radio): "Unit 7, gully mein phans gaye? Reverse mat karo. Niklo jahan se aaye the. Local log aggressive hain - unse ulo mat."',
        objectives: {
          primary: 'Escape 500m gully network in under 4 mins. Zero collisions with locals.',
          secondary: ['Reverse only in designated spots', 'Yield to oncoming locals', 'Exit via Pali Hill junction'],
          bonus: 'Zero horn use (stealth escape)'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan (radio)', line: '"Driver, gully mein speed nahi, dimag chalao. Local log apna area jaante hain. Niklo, ulo mat."', context: 'Advice' },
          { speaker: 'Local Auto Leader (Bablu)', line: '"Ae, kahan ja raha? Yahan hamara raj chalta hai. Wapas ja!"', context: 'Intimidation' },
          { speaker: 'Resident (Auntie)', line: '"Beta, seedha jao, left pe nikal jao. Wahan police chowki hai."', context: 'Helpful local' }
        ],
        consequences: {
          success: 'Exited to Pali Hill. Chowki havaldar: "Aaya beta? Bablu waale aaj phir the." +2000Rs',
          failure: 'Collision / cornered = "Local log pakad lenge. Challan kaat." -3000Rs, mandatory retry',
          perfect: 'Under 3 min + zero horn + zero contact = "Ghost of Gullies" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Bandra gullies: 15km network, avg 2.2m width. 40% non-resident vehicles enter daily. Police response: 8 min avg.'
      }
    ],
    rewards: { wallet: 25000, xp: 10000, badge: 'chase_master', unlock: 'module_4' }
  },
  {
    id: 'juhu_speed',
    moduleId: 4,
    name: 'Juhu Speed Control',
    description: 'Coastal cruising with strict speed management',
    icon: '🌊',
    color: '--plasma',
    prerequisite: 'bandra_discipline',
    storyIntro: 'Juhu Beach - where Mumbai comes to breathe. The coastal road stretches 5km and every driver thinks it is a race track. Your mentor, Coastal PSI Meera Deshmukh: "Saheb, yeh beach road hai, runway nahi. 40 km/h - ek km bhi zyada nahi."',
    missions: [
      {
        levelId: 16,
        missionType: 'TIME_TRIAL',
        title: 'Coastal 40',
        briefing: 'Maintain exactly 40 km/h. Ghost car shows perfect pace.',
        storyBeat: '05:45 AM. Juhu Tara Road - empty, misty, the Arabian Sea glimmering left. A ghost car (translucent blue) appears ahead holding exactly 40 km/h. PSI Deshmukh on radio: "Unit 12, match the ghost. 40.0 - nahi 40.5, nahi 39.8. 40.0."',
        objectives: {
          primary: 'Complete 3km maintaining 40.0 +/- 0.5 km/h. Zero speed violations.',
          secondary: ['Follow ghost car within 20m', 'Brake for jogger at 800m mark', 'Zero honking'],
          bonus: 'Perfect ghost match entire route'
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"40 km/h - yeh suggestion nahi, kanoon hai. Ghost car tumhara guru hai. Uske saath chalo."', context: 'Briefing' },
          { speaker: 'Morning Jogger (Rohit)', line: '"Madam, main yahan 10 saal se daud raha hoon. Gaadi wale 60 pe nikal jaate hain. Shukriya!"', context: 'At 800m mark' },
          { speaker: 'Ghost Car (AI)', line: '"Speed: 40.0 km/h. Variance: 0.0%. Keep it steady."', context: 'HUD display' }
        ],
        consequences: {
          success: 'Deshmukh: "Theek hai. Ghost car se seekha - speed control haath mein hai." +1200Rs',
          failure: 'Over 40.5 / under 39.5 = "Speed limit tod diya! Challan." -1500Rs, retry',
          perfect: '+/-0.2 km/h entire route = "Coastal Cruise Control" title + Mission Token'
        },
        mumbaiContext: 'Juhu Tara Road: 5km, 40 km/h limit. Speed violations: 42% (highest in Mumbai). Ghost car system: 97% compliance rate.'
      },
      {
        levelId: 17,
        missionType: 'PARKING',
        title: 'Beach Parallel',
        briefing: 'Parallel park between two cars. Tourists watch - no pressure.',
        storyBeat: '11:00 AM. Juhu Beach main stretch - tourists, families, ice cream vendors. You parallel park between a white Innova (tourist family) and a black Mercedes (local politician). Deshmukh: "Saheb, yeh parallel parking hai - Mumbai ka sabse bada test. Tourists dekh rahe hain."',
        objectives: {
          primary: 'Parallel park in 1 attempt. Centered within 15cm. Angle under 2 degrees.',
          secondary: ['Complete in under 90 seconds', 'Zero contact with other cars', 'Hazard lights on during maneuver'],
          bonus: 'Tourist family claps'
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"Parallel parking - mirror, signal, reverse, straighten. Ek baar mein. Public dekh rahi hai."', context: 'Instruction' },
          { speaker: 'Tourist Kid (Aryan, 8)', line: '"Mummy, woh uncle kitna acha park kar raha hai! Maine kabhi aisa nahi dekha!"', context: 'Watching' },
          { speaker: 'Mercedes Owner (Mr. Shah)', line: '"Officer, meri gaadi scratch mat karna! Yeh imported paint hai."', context: 'Anxious owner' }
        ],
        consequences: {
          success: 'Perfect center. Tourist family claps. Aryan: "Wah! Uncle ko medal do!" +1500Rs',
          failure: 'Touch other car / multiple attempts = "Scratch lag gayi! Challan + repair bill." -3000Rs, retry',
          perfect: 'Under 60s + centered + claps = "Parallel Perfectionist" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Juhu Beach parking: 1,200 spots, 94% occupancy weekends. Parallel parking pass rate: 34%.'
      },
      {
        levelId: 18,
        missionType: 'CARGO',
        title: 'Sunset Fragile',
        briefing: 'Transport wedding cake to Juhu. Zero sudden movements.',
        storyBeat: '05:30 PM. Golden hour. Juhu Chowpatty - crowds, hawkers, sunset photographers. You drive a tempo carrying a 3-tier wedding cake (fondant, delicate flowers). Deshmukh: "Saheb, yeh cake 45,000 ka hai. Ek bhi jhatka laga toh fondant fat jayega. Slow jao, brake maaro mat."',
        objectives: {
          primary: 'Deliver cake 100% intact (cargo integrity above 98%). Zero hard braking.',
          secondary: ['Max lateral G under 0.3', 'Max longitudinal G under 0.4', 'Navigate 3 crowded chowk sections below 15 km/h'],
          bonus: "Bride's mother meets you"
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"Cake 45,000 ka. Shaadi 7 baje. Fondant 45 pe pighalta hai. Tumhara brake pedal - feather touch!"', context: 'Loading' },
          { speaker: 'Bakery Owner (Patel)', line: '"Saheb, 3-tier hai - vanilla, chocolate, strawberry. Flowers sugar ke hain. Hilne pe gir jaayenge."', context: 'Instructions' },
          { speaker: "Bride's Mother (Mrs. Iyer)", line: '"Beta, tumne hamari beti ki shaadi bacha li. Bhagwan tumhe khush rakhe."', context: 'Perfect delivery' }
        ],
        consequences: {
          success: 'Cake perfect. Mrs. Iyer blesses. Patel: "Officer sahab, aapne business bacha liya." +2500Rs',
          failure: 'Cake under 98% / hard brake = "Fondant fat gaya! Shaadi kharab!" -5000Rs, mandatory retry',
          perfect: 'Above 99.5% + zero hard inputs = "Gentle Giant" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Juhu wedding deliveries: 150+/weekend. Cake damage rate: 12%. Fondant melt point: 45C. Mumbai avg temp: 32C.'
      },
      {
        levelId: 19,
        missionType: 'SCHOOL_PATROL',
        title: 'Jogger Watch',
        briefing: 'Morning joggers share the road. Enforce 30 km/h zone.',
        storyBeat: '06:00 AM. Juhu Beach promenade - 400+ joggers, walkers, yoga groups. A speeding biker weaves through. Deshmukh: "Saheb, yeh 30 km/h zone hai. Jogger wala track paas mein hai. Lekin biker sadak pe kyun? Uske challan tum karo."',
        objectives: {
          primary: 'Catch 3 speeders in 30 km/h zone. Issue challans. Zero jogger incidents.',
          secondary: ['Maintain 30 km/h exactly while patrolling', 'Guide 2 elderly walkers across', "Escort kids' running group"],
          bonus: "Joggers' group chants thanks"
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"Jogger track bana hai, lekin log road pe chalete hain. 30 km/h - yeh limit hai, target nahi."', context: 'Zone rules' },
          { speaker: 'Morning Jogger (Priya)', line: '"Madam, kal ek biker 60 pe nikal gaya mere paas se. Dil dhakdhakane laga. Aaj safe lag raha hai."', context: 'Gratitude' },
          { speaker: 'Speeding Biker (Rahul)', line: '"Madam, main late tha gym ke liye! Challan mat karo, membership fees jaati hai!"', context: 'Violation excuse' }
        ],
        consequences: {
          success: '3 challans issued. Joggers wave. Priya: "Madam, aap ho toh hum safe hain." +1800Rs',
          failure: 'Missed speeder / jogger hit = "Jogger gir gaya! Challan + FIR." -4000Rs, retry',
          perfect: '3 challans + escorted kids = "Dawn Patrol" badge + Mission Token'
        },
        mumbaiContext: 'Juhu Beach joggers: 5,000+ daily (5-8 AM). 30 km/h zone: 3.5km. Biker violations: 200/day.'
      },
      {
        levelId: 20,
        missionType: 'EVASION',
        title: 'Windy Bridge',
        briefing: 'Cross the bridge in high winds. Gusts push you - compensate.',
        storyBeat: '07:00 PM. Monsoon evening. Juhu-Versova Bridge - 300m over creek, wind 45 km/h crosswind. Trucks sway. Deshmukh: "Saheb, bridge pe hawa alag hi chalti hai. Truck hilega, tum bhi hiloge. Gust aaye toh counter-steer - darr ke nahi, dimaag se."',
        objectives: {
          primary: 'Cross 300m bridge in under 60s. Zero lane departures. Max sway under 0.5m.',
          secondary: ['Counter-steer for gusts', 'Maintain 35-40 km/h steady', 'Give truck 3m+ lateral gap'],
          bonus: 'Truck driver flashes thanks'
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"Hawa se daro mat. Steering pakdo, counter-steer karo. Truck se door raho."', context: 'Bridge technique' },
          { speaker: 'Truck Driver (Harish)', line: '"Madam, main 20 saal se chal raha hoon. Pehli baar koi car waala itna gap diya. Shukriya!"', context: 'Bridge end' },
          { speaker: 'Wind Gust (Audio)', line: '*WHOOOOSH* - 52 km/h crosswind hits!', context: 'Environmental cue' }
        ],
        consequences: {
          success: 'Crossed steady. Harish flashes high beams. +2000Rs',
          failure: 'Lane departure / big sway = "Bridge pe control kho diya! Challan." -3000Rs, retry',
          perfect: 'Zero sway + truck thanks = "Bridge Master" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Juhu-Versova Bridge: 300m creek crossing. Monsoon crosswind: 40-60 km/h. Truck sway: 1.2m avg.'
      }
    ],
    rewards: { wallet: 30000, xp: 12500, badge: 'parking_pro', unlock: 'module_5' }
  },
  {
    id: 'parel_silence',
    moduleId: 5,
    name: 'Parel Silence Zone',
    description: 'Zero-honking discipline near schools and hospitals',
    icon: '🔇',
    color: '--teal',
    prerequisite: 'juhu_speed',
    missions: [
      { levelId: 21, missionType: 'CHECKPOINT', title: 'Silent Approach', briefing: 'Enter the silence zone. Horn = instant failure.' },
      { levelId: 22, missionType: 'CROSSING_GUARD', title: 'Assembly Rush', briefing: 'Hundreds of students dismiss. Guide them, do not rush them.' },
      { levelId: 23, missionType: 'EMERGENCY_CLEAR', title: 'Ambulance Silencer', briefing: 'Ambulance approaches hospital. Clear path without a sound.' },
      { levelId: 24, missionType: 'SCHOOL_PATROL', title: 'Library Zone', briefing: 'Students studying. Catch speeders silently.' },
      { levelId: 25, missionType: 'EVASION', title: 'Exam Stress Escape', briefing: 'Parents double-parked everywhere. Extract without collisions.' }
    ],
    rewards: { wallet: 35000, xp: 15000, badge: 'cargo_careful', unlock: 'module_6' }
  },
  {
    id: 'matunga_rail',
    moduleId: 6,
    name: 'Matunga Rail Safety',
    description: 'Level crossings, metro pillars, and commuter crush',
    icon: '🚂',
    color: '--ion',
    prerequisite: 'parel_silence',
    missions: [
      { levelId: 26, missionType: 'CHECKPOINT', title: 'Level Crossing', briefing: 'Train coming. Gates down. Wait. No exceptions.' },
      { levelId: 27, missionType: 'TIME_TRIAL', title: 'Gate Timing', briefing: 'Cross between trains. 30-second window. Precision.' },
      { levelId: 28, missionType: 'PARKING', title: 'Metro Pillar Park', briefing: 'Park between metro pillars. Tight spaces, no scratches.' },
      { levelId: 29, missionType: 'CHASE', title: 'Horn Reaction', briefing: 'Train blasts horn. Driver panics. Stabilize the situation.' },
      { levelId: 30, missionType: 'CARGO', title: 'Commuter Cargo', briefing: 'Deliver relief supplies to platform. Navigate the crush.' }
    ],
    rewards: { wallet: 40000, xp: 17500, badge: 'mission_token_holder', unlock: 'module_7' }
  },
  {
    id: 'marine_night',
    moduleId: 7,
    name: 'Marine Drive Nights',
    description: 'High-beam etiquette, drunk detection, and street racing',
    icon: '🌙',
    color: '--plasma',
    prerequisite: 'matunga_rail',
    missions: [
      { levelId: 31, missionType: 'CHECKPOINT', title: 'High Beam Protocol', briefing: 'Dip beams for oncoming traffic.' },
      { levelId: 32, missionType: 'CHASE', title: 'Drunk Driver Hunt', briefing: 'Spot the weaving car. PIT at safe speed.' },
      { levelId: 33, missionType: 'EVASION', title: 'Mist Escape', briefing: 'Sea mist cuts visibility. Follow GPS, avoid phantom obstacles.' },
      { levelId: 34, missionType: 'PARKING', title: 'Couple Seats Park', briefing: 'Park between couples cars. Discretion required.' },
      { levelId: 35, missionType: 'CHASE', title: 'Racer Intercept', briefing: 'Street racers on the Queens Necklace. Stop them before dawn.' }
    ],
    rewards: { wallet: 45000, xp: 20000, badge: 'night_driver', unlock: 'module_8' }
  },
  {
    id: 'byculla_emergency',
    moduleId: 8,
    name: 'Byculla Emergency Access',
    description: 'Narrow lanes, fire engines, and disaster response',
    icon: '🚑',
    color: '--signal',
    prerequisite: 'marine_night',
    missions: [
      { levelId: 36, missionType: 'ESCORT', title: 'Ambulance Lane', briefing: 'Narrow lane, double-parked cars. Make way for the 108.' },
      { levelId: 37, missionType: 'ESCORT', title: 'Fire Engine Clear', briefing: 'Fire engine needs 4m width. Move everything.' },
      { levelId: 38, missionType: 'CHASE', title: 'Police Assist', briefing: 'Suspect vehicle flees. Police lead, you block exits.' },
      { levelId: 39, missionType: 'CROSSING_GUARD', title: 'Bike Paramedic', briefing: '108 bike paramedic needs clear path through crowds.' },
      { levelId: 40, missionType: 'EVASION', title: 'Evacuation Route', briefing: 'Disaster declared. Guide convoy out. Debris everywhere.' }
    ],
    rewards: { wallet: 50000, xp: 22500, badge: 'emergency_hero', unlock: 'module_9' }
  },
  {
    id: 'hindmata_monsoon',
    moduleId: 9,
    name: 'Hindmata Monsoon Survival',
    description: 'Flooded roads, potholes, and zero visibility',
    icon: '🌧️',
    color: '--teal',
    prerequisite: 'byculla_emergency',
    missions: [
      { levelId: 41, missionType: 'CARGO', title: 'Flooded Delivery', briefing: 'Water up to doors. Keep engine running, cargo dry.' },
      { levelId: 42, missionType: 'EVASION', title: 'Pothole Slalom', briefing: 'Hidden potholes in brown water. Memorize safe line.' },
      { levelId: 43, missionType: 'TIME_TRIAL', title: 'Manhole Dodge', briefing: 'Open manholes swallow wheels. GPS marks known ones.' },
      { levelId: 44, missionType: 'CHECKPOINT', title: 'Blind Rain', briefing: 'Visibility near zero. Follow taillights, trust wipers.' },
      { levelId: 45, missionType: 'EMERGENCY_CLEAR', title: 'Stall Rescue', briefing: 'Stranded family in rising water. Extract before float.' }
    ],
    rewards: { wallet: 55000, xp: 25000, badge: 'weather_pro', unlock: 'module_10' }
  },
  {
    id: 'eastern_highway',
    moduleId: 10,
    name: 'Eastern Express Highway',
    description: 'High-speed discipline, merges, and convoy escort',
    icon: '🛣️',
    color: '--plasma',
    prerequisite: 'hindmata_monsoon',
    missions: [
      { levelId: 46, missionType: 'TIME_TRIAL', title: 'Lane Discipline 80', briefing: 'Maintain lane at 80 km/h. No weaving.' },
      { levelId: 47, missionType: 'CHECKPOINT', title: 'Exit Merge', briefing: 'Merge smoothly. Zipper merge. No brake lights.' },
      { levelId: 48, missionType: 'TIME_TRIAL', title: 'Toll Flow', briefing: 'FASTag lane. Maintain 20 km/h through plaza.' },
      { levelId: 49, missionType: 'PARKING', title: 'Breakdown Shoulder', briefing: 'Park on shoulder safely. Hazards on.' },
      { levelId: 50, missionType: 'ESCORT', title: 'VIP Convoy', briefing: 'Escort convoy at 60 km/h. Block overtakers.' }
    ],
    rewards: { wallet: 60000, xp: 27500, badge: 'speed_king', unlock: 'bonus_modules' }
  },
  {
    id: 'bonus_nightmare',
    moduleId: 11,
    name: 'Bonus: Night Monsoon',
    description: 'Ultimate test: night + flood + traffic',
    icon: '🌪️',
    color: '--em',
    prerequisite: 'eastern_highway',
    missions: [
      { levelId: 51, missionType: 'EVASION', title: 'Monsoon Nightmare', briefing: 'Flooded highway, night, heavy traffic. Survive 3km.' }
    ],
    rewards: { wallet: 75000, xp: 35000, badge: 'chaos_survivor' }
  },
  {
    id: 'bonus_vip',
    moduleId: 12,
    name: 'Bonus: VIP Convoy',
    description: 'Protocol drive with full escort',
    icon: '💎',
    color: '--ion',
    prerequisite: 'eastern_highway',
    missions: [
      { levelId: 52, missionType: 'ESCORT', title: 'Protocol Drive', briefing: 'VIP motorcade. Zero gaps. Zero mistakes.' }
    ],
    rewards: { wallet: 100000, xp: 50000, badge: 'traffic_hero' }
  },
  {
    id: 'bonus_freeroam',
    moduleId: 13,
    name: 'Bonus: Free Roam',
    description: 'Open world sandbox',
    icon: '🌍',
    color: '--signal',
    missions: [
      { levelId: 53, missionType: 'CHECKPOINT', title: 'City Sandbox', briefing: 'Explore 50km Mumbai. Create your own missions.' }
    ],
    rewards: { wallet: 50000, xp: 25000 }
  }
];

function getCampaign(campaignId) {
  return CAMPAIGNS.find(c => c.id === campaignId);
}

function getCampaignsForModule(moduleId) {
  return CAMPAIGNS.filter(c => c.moduleId === moduleId);
}

function getMissionForLevel(levelId) {
  const numId = Number(levelId);
  for (const c of CAMPAIGNS) {
    if (c.missions) {
      const m = c.missions.find(m => m.levelId === numId);
      if (m) return { campaign: c, mission: m };
    }
  }
  if (typeof MODULES !== 'undefined') {
    for (const mod of MODULES) {
      if (mod.levels) {
        const lv = mod.levels.find(l => l.id === numId);
        if (lv) {
          return {
            campaign: { name: mod.name, icon: '🚦' },
            mission: {
              levelId: numId,
              title: lv.name,
              briefing: `Complete the ${lv.name} challenge according to Mumbai road regulations.`,
              storyBeat: `Mumbai Traffic Patrol — ${lv.name}. Drive with discipline and reach all destinations.`,
              objectives: { primary: `Navigate the route and clear all checkpoints cleanly.` },
              characterDialogue: [{ speaker: 'Constable Patil', line: '"Dhyan se chalao, Mumbai ki sadkein hain!"' }],
              rewards: { wallet: 1000, xp: 500 }
            }
          };
        }
      }
    }
  }
  return null;
}

function getCampaignProgress(userData, campaignId) {
  const campaign = getCampaign(campaignId);
  if (!campaign) return null;

  const progress = userData?.campaignProgress?.[campaignId] || {};
  const completed = progress.completedMissions || [];
  const currentIdx = progress.currentMissionIndex || 0;
  const unlocked = !campaign.prerequisite || (userData?.campaignProgress?.[campaign.prerequisite]?.completed === true);

  return {
    campaign,
    completedCount: completed.length,
    totalMissions: campaign.missions.length,
    currentMission: campaign.missions[currentIdx],
    nextMission: campaign.missions[currentIdx + 1],
    completed: completed.length >= campaign.missions.length,
    unlocked,
    progressPercent: (completed.length / campaign.missions.length) * 100
  };
}

function checkCampaignPrerequisites(userData, campaignId) {
  const campaign = getCampaign(campaignId);
  if (!campaign || !campaign.prerequisite) return true;
  return userData?.campaignProgress?.[campaign.prerequisite]?.completed === true;
}

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
    getRecommendedVehicle, getMumbaiStat, getAllLevelsFlat, getTotalLevels, getTotalModes, getTotalPossibleCompletions,
    CAMPAIGNS, getCampaign, getCampaignsForModule, getCampaignProgress, checkCampaignPrerequisites };
}

if (typeof window !== 'undefined') {
  window.COURSE = { MODULES, MODES, VEHICLES, MODE_CONFIG, MUMBAI_STATS,
    getLevel, getModule, getModeConfig, getModuleProgress, checkCertificateEligibility,
    getRecommendedVehicle, getMumbaiStat, getAllLevelsFlat, getTotalLevels, getTotalModes, getTotalPossibleCompletions,
    CAMPAIGNS, getCampaign, getCampaignsForModule, getCampaignProgress, checkCampaignPrerequisites };
}