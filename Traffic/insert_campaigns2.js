const fs = require('fs');
let content = fs.readFileSync('course.js', 'utf8');

// Find the closing ]; of CAMPAIGNS and insert before it
const insertBefore = '];\r\n\r\nfunction getCampaign(campaignId) {';
const campaignsToAdd = `  {
    id: 'bandra_discipline',
    moduleId: 3,
    name: 'Bandra Discipline',
    description: 'Lane discipline and overtaking etiquette on backroads',
    icon: '🛣️',
    color: '--signal',
    prerequisite: 'dadar_courtesy',
    missions: [
      { levelId: 11, missionType: 'CHECKPOINT', title: 'Single Lane Flow', briefing: 'Narrow roads demand discipline. Stay in lane, signal early.' },
      { levelId: 12, missionType: 'CHASE', title: 'Overtaking Rules', briefing: 'A reckless driver forces passes. Stop them before they cause a crash.' },
      { levelId: 13, missionType: 'ESCORT', title: 'Bus Lane Honor', briefing: 'Escort a BEST bus through its dedicated lane. Protect public transport.' },
      { levelId: 14, missionType: 'SIDEWALK_PATROL', title: 'Cycle Track', briefing: 'Cyclists have their lane. Ensure cars respect the boundary.' },
      { levelId: 15, missionType: 'EVASION', title: 'Gully Escape', briefing: 'Navigate the maze while avoiding aggressive local traffic.' }
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
    missions: [
      { levelId: 16, missionType: 'TIME_TRIAL', title: 'Coastal 40', briefing: 'Maintain exactly 40 km/h. Ghost car shows perfect pace.' },
      { levelId: 17, missionType: 'PARKING', title: 'Beach Parallel', briefing: 'Parallel park between two cars. Tourists watch — no pressure.' },
      { levelId: 18, missionType: 'CARGO', title: 'Sunset Fragile', briefing: 'Transport wedding cake to Juhu. Zero sudden movements.' },
      { levelId: 19, missionType: 'SCHOOL_PATROL', title: 'Jogger Watch', briefing: 'Morning joggers share the road. Enforce 30 km/h zone.' },
      { levelId: 20, missionType: 'EVASION', title: 'Windy Bridge', briefing: 'Cross the bridge in high winds. Gusts push you — compensate.' }
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
      { levelId: 22, missionType: 'CROSSING_GUARD', title: 'Assembly Rush', briefing: 'Hundreds of students dismiss. Guide them, don\\'t rush them.' },
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
      { levelId: 31, missionType: 'CHECKPOINT', title: 'High Beam Protocol', briefing: 'Dip beams for oncoming traffic. Flash = warning, not aggression.' },
      { levelId: 32, missionType: 'CHASE', title: 'Drunk Driver Hunt', briefing: 'Spot the weaving car. PIT maneuver at safe speed. Call it in.' },
      { levelId: 33, missionType: 'EVASION', title: 'Mist Escape', briefing: 'Sea mist reduces visibility to 10m. Follow GPS, avoid phantom obstacles.' },
      { levelId: 34, missionType: 'PARKING', title: 'Couple Seats Park', briefing: 'Park between romantic couples\\' cars. Discretion required.' },
      { levelId: 35, missionType: 'CHASE', title: 'Racer Intercept', briefing: 'Street racers on the Queen\\'s Necklace. Stop them before dawn.' }
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
      { levelId: 46, missionType: 'TIME_TRIAL', title: 'Lane Discipline 80', briefing: 'Maintain lane at 80 km/h. No weaving. Ghost car enforces.' },
      { levelId: 47, missionType: 'CHECKPOINT', title: 'Exit Merge', briefing: 'Merge smoothly. Zipper merge. No brake lights.' },
      { levelId: 48, missionType: 'TIME_TRIAL', title: 'Toll Flow', briefing: 'FASTag lane. Maintain 20 km/h through plaza. No stopping.' },
      { levelId: 49, missionType: 'PARKING', title: 'Breakdown Shoulder', briefing: 'Park on shoulder safely. Hazard lights. Warning triangle.' },
      { levelId: 50, missionType: 'ESCORT', title: 'VIP Convoy', briefing: 'Escort convoy at 60 km/h. Block overtakers. Protocol drive.' }
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
      { levelId: 52, missionType: 'ESCORT', title: 'Protocol Drive', briefing: 'VIP motorcade. Zero gaps. Zero mistakes. 2.5km perfection.' }
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
      { levelId: 53, missionType: 'CHECKPOINT', title: 'City Sandbox', briefing: 'No objectives. Explore 50km Mumbai. Create your own missions.' }
    ],
    rewards: { wallet: 50000, xp: 25000 }
  }`;

content = content.replace(insertBefore, campaignsToAdd + '\r\n];\r\n\r\nfunction getCampaign(campaignId) {');
fs.writeFileSync('course.js', content);
console.log('Done');