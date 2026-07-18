/* ═══════════════════════════════════════════════════════════════════
   scenario2d.js — 2D Traffic Scenario Engine (Phaser 4)
   15 Indian traffic scenarios with top-down view, tap controls
   ═══════════════════════════════════════════════════════════════════ */

// ─── SCENARIO CONFIGURATIONS ───
const SCENARIOS = [
  // ── Tier 1: Basic Rules ──
  {
    id: 1, levelRef: 1, icon: '🚦', name: 'Red Light Patience',
    desc: 'Stop at signals, let pedestrians cross, move only on green.',
    tier: 1, timeLimit: 45,
    road: { type: 'straight', lanes: 3, length: 1200 },
    obstacles: [
      { type: 'traffic_light', x: 240, y: 200, phases: ['red', 'green'], cycle: [5000, 3000] },
      { type: 'zebra', x: 240, y: 220 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 1, speed: 0.4, y: 200, crosses: true },
      { type: 'pedestrian', lane: 2, speed: 0.35, y: 210, crosses: true, delay: 800 }
    ],
    tasks: [
      { id: 'wait_red', text: 'Stop at red light', type: 'stop', check: 'redLight' },
      { id: 'let_cross', text: 'Let pedestrians cross', type: 'avoid', check: 'pedestriansSafe' },
      { id: 'move_green', text: 'Go on green only', type: 'reach', check: 'crossedIntersection' }
    ],
    law: 'MV Act §119 — Jumping Red Signal — ₹500–₹2000'
  },
  {
    id: 2, levelRef: 2, icon: '🅿️', name: 'Street Parking',
    desc: 'Find a legal parking spot and park correctly.',
    tier: 1, timeLimit: 40,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'no_parking_zone', x: 200, y: 300, w: 60, h: 120 },
      { type: 'parking_spot', x: 360, y: 450, w: 55, h: 100 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 1.2, direction: -1 },
      { type: 'car', lane: 1, speed: 1.0, direction: -1, delay: 1500 }
    ],
    tasks: [
      { id: 'find_spot', text: 'Find legal parking', type: 'reach', check: 'nearParking' },
      { id: 'park_legal', text: 'Park in designated zone', type: 'stop', check: 'parkedLegal' },
      { id: 'walk_dest', text: 'Walk to destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §122 — Obstructing Traffic — ₹100–₹500'
  },
  {
    id: 3, levelRef: 3, icon: '🚑', name: 'Ambulance Priority',
    desc: 'Pull over and let the ambulance pass safely.',
    tier: 1, timeLimit: 35,
    road: { type: 'straight', lanes: 2, length: 800 },
    obstacles: [],
    npcs: [
      { type: 'ambulance', lane: 0.5, speed: 2.5, y: -100, yEnd: 900 }
    ],
    tasks: [
      { id: 'pull_over', text: 'Pull over left', type: 'reach', check: 'pulledOver' },
      { id: 'stop_complete', text: 'Stop completely', type: 'stop', check: 'isStopped' },
      { id: 'wait_pass', text: 'Wait for ambulance', type: 'avoid', check: 'ambulancePassed' }
    ],
    law: 'MV Act §119(2) — Not yielding to emergency vehicles — ₹1000–₹5000'
  },
  {
    id: 4, levelRef: 4, icon: '🌧️', name: 'Puddle Etiquette',
    desc: 'Slow down for puddles — don\'t splash pedestrians!',
    tier: 1, timeLimit: 40,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'puddle', x: 220, y: 350, w: 80, h: 40 },
      { type: 'puddle', x: 300, y: 550, w: 60, h: 35 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 0.3, speed: 0, y: 360, stationary: true },
      { type: 'pedestrian', lane: 1.5, speed: 0, y: 555, stationary: true }
    ],
    tasks: [
      { id: 'slow_puddle', text: 'Slow down for puddle', type: 'avoid', check: 'slowSpeed' },
      { id: 'no_splash', text: 'Don\'t splash pedestrians', type: 'avoid', check: 'noSplash' },
      { id: 'crawl_past', text: 'Crawl past slowly', type: 'stop', check: 'crawledPast' }
    ],
    law: 'MV Act §184 — Dangerous Driving — ₹1000–₹5000'
  },
  {
    id: 5, levelRef: 5, icon: '🏫', name: 'School Zone',
    desc: 'Slow to 20 km/h, watch for children crossing.',
    tier: 1, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'school_zone', x: 240, y: 300, w: 200, h: 200 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 0.5, speed: 0.3, y: 380, crosses: true },
      { type: 'pedestrian', lane: 1.5, speed: 0.25, y: 400, crosses: true, delay: 600 }
    ],
    tasks: [
      { id: 'slow_zone', text: 'Slow to 20 km/h', type: 'avoid', check: 'schoolSpeed' },
      { id: 'watch_kids', text: 'Watch for children', type: 'avoid', check: 'noChildHit' },
      { id: 'follow_guard', text: 'Follow guard signals', type: 'reach', check: 'passedSchool' }
    ],
    law: 'MV Act §196 — School Zone Violation — ₹2000–₹5000'
  },
  // ── Tier 2: Intermediate Rules ──
  {
    id: 6, levelRef: 6, icon: '🏥', name: 'Hospital Zone Parking',
    desc: 'Don\'t park near hospitals — find a spot 100m+ away.',
    tier: 2, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'hospital_zone', x: 240, y: 300, w: 200, h: 150 },
      { type: 'parking_spot', x: 360, y: 600, w: 55, h: 100 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 1.0, direction: -1 }
    ],
    tasks: [
      { id: 'avoid_hospital', text: 'Don\'t park near hospital', type: 'avoid', check: 'notInHospitalZone' },
      { id: 'find_legal', text: 'Find parking 100m+ away', type: 'reach', check: 'nearParking' },
      { id: 'walk_back', text: 'Walk to hospital', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §122 — Hospital Zone Parking — ₹2000–₹5000'
  },
  {
    id: 7, levelRef: 7, icon: '🤫', name: 'No Honking Zone',
    desc: 'Hospital silence zone — drive quietly, no horns!',
    tier: 2, timeLimit: 40,
    road: { type: 'straight', lanes: 2, length: 800 },
    obstacles: [
      { type: 'silence_zone', x: 240, y: 250, w: 200, h: 200 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.8, direction: -1 },
      { type: 'car', lane: 1, speed: 0.6, direction: -1, delay: 2000 }
    ],
    tasks: [
      { id: 'no_honk', text: 'No honking!', type: 'avoid', check: 'noHonk' },
      { id: 'slow_down', text: 'Slow down near hospital', type: 'avoid', check: 'slowSpeed' },
      { id: 'maintain_dist', text: 'Keep safe distance', type: 'avoid', check: 'safeDistance' }
    ],
    law: 'MV Act §190 — Noise Pollution — ₹1000–₹5000'
  },
  {
    id: 8, levelRef: 8, icon: '🚑', name: 'Narrow Street Ambulance',
    desc: 'Navigate parked cars, signal, and let ambulance through.',
    tier: 2, timeLimit: 40,
    road: { type: 'straight', lanes: 1, length: 800 },
    obstacles: [
      { type: 'parked_car', x: 180, y: 300, w: 40, h: 70 },
      { type: 'parked_car', x: 300, y: 450, w: 40, h: 70 }
    ],
    npcs: [
      { type: 'ambulance', lane: 0, speed: 2.0, y: -100, yEnd: 900 }
    ],
    tasks: [
      { id: 'find_gap', text: 'Find gap between cars', type: 'reach', check: 'foundGap' },
      { id: 'signal', text: 'Use indicator', type: 'toggle', check: 'usedIndicator' },
      { id: 'let_pass', text: 'Let ambulance pass', type: 'avoid', check: 'ambulancePassed' }
    ],
    law: 'MV Act §119(2) — Emergency vehicle priority — ₹1000–₹5000'
  },
  {
    id: 9, levelRef: 9, icon: '⛈️', name: 'Night Rain Puddles',
    desc: 'Use headlights, crawl through dark puddles carefully.',
    tier: 2, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900, night: true },
    obstacles: [
      { type: 'puddle', x: 200, y: 300, w: 70, h: 35 },
      { type: 'puddle', x: 320, y: 500, w: 80, h: 40 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 0.3, speed: 0, y: 310, stationary: true },
      { type: 'pedestrian', lane: 1.7, speed: 0, y: 510, stationary: true }
    ],
    tasks: [
      { id: 'use_headlights', text: 'Turn on headlights', type: 'toggle', check: 'headlightsOn' },
      { id: 'slow_night', text: 'Drive slowly in dark', type: 'avoid', check: 'slowSpeed' },
      { id: 'wide_berth', text: 'Give wide berth', type: 'avoid', check: 'noSplash' }
    ],
    law: 'MV Act §194B — Driving without lights at night — ₹500–₹2000'
  },
  {
    id: 10, levelRef: 10, icon: '🛒', name: 'Market Navigation',
    desc: 'Navigate through crowded market, find parking.',
    tier: 2, timeLimit: 50,
    road: { type: 'straight', lanes: 2, length: 1000 },
    obstacles: [
      { type: 'market_zone', x: 240, y: 300, w: 200, h: 180 },
      { type: 'parking_spot', x: 360, y: 580, w: 55, h: 100 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 0.3, speed: 0.2, y: 350, crosses: true },
      { type: 'pedestrian', lane: 1.7, speed: 0.15, y: 400, crosses: true, delay: 400 },
      { type: 'car', lane: 0, speed: 0.5, direction: -1 }
    ],
    tasks: [
      { id: 'navigate_market', text: 'Navigate through market', type: 'reach', check: 'passedMarket' },
      { id: 'find_zone', text: 'Find parking zone', type: 'reach', check: 'nearParking' },
      { id: 'park_spot', text: 'Park in spot', type: 'stop', check: 'parkedLegal' }
    ],
    law: 'MV Act §122 — Obstructing free movement — ₹100–₹500'
  },
  {
    id: 11, levelRef: 11, icon: '📚', name: 'Library Silence',
    desc: 'No honking near the library — pass quietly!',
    tier: 2, timeLimit: 35,
    road: { type: 'straight', lanes: 2, length: 700 },
    obstacles: [
      { type: 'silence_zone', x: 240, y: 250, w: 180, h: 160 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.6, direction: -1 }
    ],
    tasks: [
      { id: 'no_honk', text: 'No honking!', type: 'avoid', check: 'noHonk' },
      { id: 'wait_npc', text: 'Wait for NPC car', type: 'stop', check: 'waitedForNPC' },
      { id: 'pass_quiet', text: 'Pass quietly', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §190 — Noise in silence zone — ₹1000–₹5000'
  },
  // ── Tier 3: Advanced Rules ──
  {
    id: 12, levelRef: 12, icon: '🛣️', name: 'Highway Ambulance',
    desc: 'Indicate, merge left, maintain speed — let ambulance through.',
    tier: 3, timeLimit: 35,
    road: { type: 'straight', lanes: 3, length: 800 },
    obstacles: [],
    npcs: [
      { type: 'car', lane: 1.5, speed: 2.0, direction: -1 },
      { type: 'car', lane: 2.5, speed: 1.8, direction: -1, delay: 1000 },
      { type: 'ambulance', lane: 1, speed: 3.0, y: -100, yEnd: 900 }
    ],
    tasks: [
      { id: 'indicate_left', text: 'Indicate left', type: 'toggle', check: 'usedIndicator' },
      { id: 'merge_left', text: 'Merge to left lane', type: 'reach', check: 'mergedLeft' },
      { id: 'maintain_speed', text: 'Maintain speed', type: 'avoid', check: 'maintainedSpeed' }
    ],
    law: 'MV Act §119(2) — Emergency priority on highway — ₹2000–₹5000'
  },
  {
    id: 13, levelRef: 13, icon: '🌙', name: 'Night Crossing',
    desc: 'Dip headlights, yield to elderly, no speeding at night.',
    tier: 3, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900, night: true },
    obstacles: [
      { type: 'zebra', x: 240, y: 350 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 0.5, speed: 0.2, y: 350, crosses: true },
      { type: 'car', lane: 0, speed: 1.2, direction: -1 }
    ],
    tasks: [
      { id: 'dip_headlights', text: 'Dip headlights', type: 'toggle', check: 'headlightsDipped' },
      { id: 'yield_elderly', text: 'Yield to elderly', type: 'stop', check: 'isStopped' },
      { id: 'no_speed', text: 'Don\'t speed at night', type: 'avoid', check: 'nightSpeedLimit' }
    ],
    law: 'MV Act §194A — Dangerous night driving — ₹1000–₹5000'
  },
  {
    id: 14, levelRef: 14, icon: '🏘️', name: 'Residential Parking',
    desc: 'Find visitor parking, don\'t block residents.',
    tier: 3, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'gate', x: 200, y: 350, w: 40, h: 30 },
      { type: 'parking_spot', x: 360, y: 500, w: 55, h: 100 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.8, direction: -1 }
    ],
    tasks: [
      { id: 'move_gate', text: 'Move from gate', type: 'reach', check: 'awayFromGate' },
      { id: 'find_visitor', text: 'Find visitor parking', type: 'reach', check: 'nearParking' },
      { id: 'walk_dest', text: 'Walk to destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §122 — Blocking residential access — ₹500–₹2000'
  },
  // ── Tier 4: Expert Rules ──
  {
    id: 15, levelRef: 17, icon: '🚨', name: 'Traffic Jam Ambulance',
    desc: 'Hazards on, inch forward, pull left — make room!',
    tier: 4, timeLimit: 40,
    road: { type: 'straight', lanes: 2, length: 800 },
    obstacles: [
      { type: 'traffic_jam', x: 240, y: 350, w: 160, h: 120 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0, y: 380, stationary: true },
      { type: 'car', lane: 1, speed: 0, y: 360, stationary: true },
      { type: 'ambulance', lane: 0.5, speed: 1.5, y: -100, yEnd: 900 }
    ],
    tasks: [
      { id: 'hazards_on', text: 'Turn on hazards', type: 'toggle', check: 'hazardsOn' },
      { id: 'inch_forward', text: 'Inch forward', type: 'reach', check: 'inchedForward' },
      { id: 'pull_left', text: 'Pull far left', type: 'reach', check: 'pulledOver' }
    ],
    law: 'MV Act §119(2) — Blocking emergency access — ₹2000–₹10000'
  },
  // ── Tier 4: Signal & Discipline ──
  {
    id: 16, levelRef: 21, icon: '🚦', name: 'Signal Discipline',
    desc: 'Stay at red even when others jump. Discipline over herd mentality.',
    tier: 4, timeLimit: 45,
    road: { type: 'intersection', lanes: 3, length: 900 },
    obstacles: [
      { type: 'traffic_light', x: 240, y: 200, phases: ['red', 'green'], cycle: [5000, 4000] },
      { type: 'zebra', x: 240, y: 230 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 1.8, direction: -1, jumpsRed: true },
      { type: 'pedestrian', lane: 1, speed: 0.3, y: 210, crosses: true }
    ],
    tasks: [
      { id: 'stay_red', text: 'Wait at red light', type: 'stop', check: 'stayedAtRed' },
      { id: 'ignore_jumper', text: 'Don\'t follow the signal jumper', type: 'avoid', check: 'ignoredJumper' },
      { id: 'go_green', text: 'Proceed on green', type: 'reach', check: 'crossedIntersection' }
    ],
    law: 'MV Act §119 — Jumping Red Signal — ₹500–₹2000'
  },
  {
    id: 17, levelRef: 22, icon: '😡', name: 'Road Rage Control',
    desc: 'Another driver cuts you off. Don\'t react aggressively.',
    tier: 4, timeLimit: 40,
    road: { type: 'straight', lanes: 3, length: 1000 },
    obstacles: [
      { type: 'signal', x: 400, y: 300, phases: ['green', 'yellow', 'red'], cycle: [4000, 1500, 3000] }
    ],
    npcs: [
      { type: 'car', lane: 1, speed: 2.0, direction: -1, cutsOff: true, cutAt: 350 }
    ],
    tasks: [
      { id: 'no_honk_rage', text: 'Don\'t honk aggressively', type: 'avoid', check: 'noHonk' },
      { id: 'no_swerve', text: 'Don\'t swerve', type: 'avoid', check: 'noSwerve' },
      { id: 'stay_calm', text: 'Reach destination calmly', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Dangerous driving — ₹1000–₹5000'
  },
  {
    id: 18, levelRef: 23, icon: '🌧️', name: 'Rain Driving',
    desc: 'Monsoon rain reduces visibility. Slow down, maintain distance.',
    tier: 4, timeLimit: 50,
    road: { type: 'straight', lanes: 2, length: 1000 },
    obstacles: [
      { type: 'puddle', x: 240, y: 300, w: 80, h: 40 },
      { type: 'puddle', x: 260, y: 550, w: 70, h: 35 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.6, direction: -1 },
      { type: 'car', lane: 1, speed: 0.5, direction: -1, delay: 2000 }
    ],
    tasks: [
      { id: 'slow_rain', text: 'Reduce speed in rain', type: 'avoid', check: 'underSpeed' },
      { id: 'avoid_puddle', text: 'Avoid puddles', type: 'avoid', check: 'noPuddleHit' },
      { id: 'reach_dest', text: 'Reach destination safely', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Dangerous driving in rain — ₹1000–₹5000'
  },
  {
    id: 19, levelRef: 24, icon: '🚶', name: 'Pedestrian Priority',
    desc: 'Pedestrians have right of way at crossings. Always yield.',
    tier: 4, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 800 },
    obstacles: [
      { type: 'zebra', x: 240, y: 300 },
      { type: 'zebra', x: 240, y: 550 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 0, speed: 0.3, y: 280, crosses: true },
      { type: 'pedestrian', lane: 1, speed: 0.25, y: 530, crosses: true, delay: 1000 },
      { type: 'car', lane: 0, speed: 1.0, direction: -1 }
    ],
    tasks: [
      { id: 'yield_ped1', text: 'Yield to first pedestrian', type: 'stop', check: 'yieldedPed' },
      { id: 'yield_ped2', text: 'Yield to second pedestrian', type: 'stop', check: 'yieldedPed2' },
      { id: 'cross_safe', text: 'Cross safely after', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §134 — Duty to accident victims — ₹500–₹1000'
  },
  {
    id: 20, levelRef: 25, icon: '🪧', name: 'Sign Recognition',
    desc: 'Follow all mandatory, cautionary, and informational signs.',
    tier: 4, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'sign', x: 200, y: 200, kind: 'speed_limit_40' },
      { type: 'sign', x: 280, y: 400, kind: 'no_horn' },
      { type: 'sign', x: 200, y: 600, kind: 'speed_breaker' }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.8, direction: -1 }
    ],
    tasks: [
      { id: 'obey_speed', text: 'Follow speed limit', type: 'avoid', check: 'underSpeed' },
      { id: 'no_honk_sign', text: 'No honking zone', type: 'avoid', check: 'noHonk' },
      { id: 'cross_speed', text: 'Cross speed breaker', type: 'reach', check: 'crossedBreaker' }
    ],
    law: 'MV Act §118 — Obeying traffic signs — ₹200–₹1000'
  },
  // ── Tier 5: Animals & Narrow ──
  {
    id: 21, levelRef: 26, icon: '🐄', name: 'Animal Crossing',
    desc: 'Cattle on the road! Slow down and pass carefully.',
    tier: 5, timeLimit: 50,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'animal', x: 240, y: 350, kind: 'cow', w: 60, h: 40 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.5, direction: -1 }
    ],
    tasks: [
      { id: 'slow_animal', text: 'Slow down for animal', type: 'avoid', check: 'underSpeed' },
      { id: 'pass_safe', text: 'Pass without hitting', type: 'avoid', check: 'noCollision' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §186 — Obstructing public way — ₹100–₹500'
  },
  {
    id: 22, levelRef: 27, icon: '🏗️', name: 'Narrow Street',
    desc: 'Tight lane — yield to oncoming traffic, use horn sparingly.',
    tier: 5, timeLimit: 45,
    road: { type: 'straight', lanes: 1, length: 800 },
    obstacles: [
      { type: 'construction', x: 240, y: 350, w: 40, h: 120 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.6, direction: 1 }
    ],
    tasks: [
      { id: 'yield_narrow', text: 'Yield to oncoming car', type: 'stop', check: 'yieldedOncoming' },
      { id: 'pass_construction', text: 'Pass construction', type: 'reach', check: 'passedConstruction' },
      { id: 'reach_end', text: 'Reach end of street', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Dangerous driving in narrow lane — ₹1000–₹5000'
  },
  {
    id: 23, levelRef: 28, icon: '🅿️', name: 'Parking Rules',
    desc: 'Park only in designated zones. No blocking fire hydrants.',
    tier: 5, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'no_parking_zone', x: 200, y: 250, w: 50, h: 100 },
      { type: 'fire_hydrant', x: 280, y: 400 },
      { type: 'parking_spot', x: 240, y: 550, w: 55, h: 100 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.8, direction: -1 }
    ],
    tasks: [
      { id: 'find_legal', text: 'Find legal parking', type: 'reach', check: 'nearParking' },
      { id: 'no_hydrant', text: 'Don\'t block hydrant', type: 'avoid', check: 'noHydrantBlock' },
      { id: 'park_ok', text: 'Park correctly', type: 'stop', check: 'parkedLegal' }
    ],
    law: 'MV Act §122 — Obstructing traffic — ₹100–₹500'
  },
  {
    id: 24, levelRef: 29, icon: '🛺', name: 'Auto Dance',
    desc: 'Autos everywhere! Navigate through chaotic auto-rickshaw traffic.',
    tier: 5, timeLimit: 50,
    road: { type: 'intersection', lanes: 3, length: 1000 },
    obstacles: [
      { type: 'traffic_light', x: 240, y: 200, phases: ['red', 'green'], cycle: [4000, 3000] }
    ],
    npcs: [
      { type: 'auto', lane: 0, speed: 1.0, direction: -1 },
      { type: 'auto', lane: 1, speed: 1.2, direction: -1, delay: 800 },
      { type: 'auto', lane: 2, speed: 0.9, direction: -1, delay: 1500 },
      { type: 'car', lane: 1, speed: 0.7, direction: -1, delay: 2000 }
    ],
    tasks: [
      { id: 'avoid_auto1', text: 'Don\'t hit autos', type: 'avoid', check: 'noCollision' },
      { id: 'obey_signal', text: 'Obey traffic signals', type: 'stop', check: 'stayedAtRed' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Driving without care — ₹1000–₹5000'
  },
  {
    id: 25, levelRef: 30, icon: '💸', name: 'Highway Toll',
    desc: 'Stop at toll plaza, pay exact fare, exit smoothly.',
    tier: 5, timeLimit: 40,
    road: { type: 'highway', lanes: 3, length: 1200 },
    obstacles: [
      { type: 'toll_plaza', x: 240, y: 400, lanes: 3 }
    ],
    npcs: [
      { type: 'truck', lane: 0, speed: 0.4, direction: -1 },
      { type: 'bus', lane: 2, speed: 0.5, direction: -1, delay: 1000 }
    ],
    tasks: [
      { id: 'slow_toll', text: 'Slow for toll', type: 'avoid', check: 'underSpeed' },
      { id: 'pay_toll', text: 'Stop at toll booth', type: 'stop', check: 'paidToll' },
      { id: 'exit_smooth', text: 'Exit smoothly', type: 'reach', check: 'reachedDest' }
    ],
    law: 'NHAI Act — Toll evasion — ₹500 penalty'
  },
  // ── Tier 6: Complex Scenarios ──
  {
    id: 26, levelRef: 31, icon: '↪️', name: 'Blind Corner',
    desc: 'Low visibility at a sharp turn. Use horn, stay left.',
    tier: 6, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 800 },
    obstacles: [
      { type: 'blind_turn', x: 240, y: 350 }
    ],
    npcs: [
      { type: 'truck', lane: 0, speed: 0.8, direction: 1 }
    ],
    tasks: [
      { id: 'use_horn', text: 'Sound horn before turn', type: 'toggle', check: 'usedHorn' },
      { id: 'stay_left', text: 'Stay left', type: 'avoid', check: 'stayedLeft' },
      { id: 'cross_corner', text: 'Cross safely', type: 'reach', check: 'passedCorner' }
    ],
    law: 'MV Act §112 — Speed at turns — ₹200–₹1000'
  },
  {
    id: 27, levelRef: 32, icon: '⛰️', name: 'Hill Driving',
    desc: 'Steep gradient — use gears, never coast, use handbrake on slopes.',
    tier: 6, timeLimit: 55,
    road: { type: 'straight', lanes: 2, length: 1000 },
    obstacles: [
      { type: 'slope', x: 240, y: 300, gradient: 15 }
    ],
    npcs: [
      { type: 'truck', lane: 0, speed: 0.3, direction: -1 },
      { type: 'car', lane: 1, speed: 0.5, direction: 1, delay: 1500 }
    ],
    tasks: [
      { id: 'use_gear', text: 'Use low gear uphill', type: 'toggle', check: 'lowGear' },
      { id: 'no_coast', text: 'Don\'t coast downhill', type: 'avoid', check: 'noCoasting' },
      { id: 'reach_top', text: 'Reach the top', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Dangerous driving on hills — ₹1000–₹5000'
  },
  {
    id: 28, levelRef: 33, icon: '🚌', name: 'Bus Stop Etiquette',
    desc: 'Yield to buses at stops, don\'t overtake near bus stops.',
    tier: 6, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [
      { type: 'bus_stop', x: 200, y: 350 }
    ],
    npcs: [
      { type: 'bus', lane: 0, speed: 0, y: 350, stationary: true },
      { type: 'pedestrian', lane: 0, speed: 0.3, y: 340, crosses: true, delay: 500 }
    ],
    tasks: [
      { id: 'yield_bus', text: 'Yield to bus', type: 'stop', check: 'yieldedBus' },
      { id: 'no_overtake', text: 'Don\'t overtake bus', type: 'avoid', check: 'noOvertake' },
      { id: 'pass_bus', text: 'Pass safely after bus moves', type: 'reach', check: 'passedBus' }
    ],
    law: 'MV Act §118(2) — Overtaking near bus stop — ₹500–₹2000'
  },
  {
    id: 29, levelRef: 34, icon: '🚧', name: 'Construction Zone',
    desc: 'Road work ahead! Follow detour signs, reduce speed.',
    tier: 6, timeLimit: 50,
    road: { type: 'straight', lanes: 3, length: 1100 },
    obstacles: [
      { type: 'construction_zone', x: 240, y: 350, w: 200, h: 150 },
      { type: 'detour_sign', x: 300, y: 280 }
    ],
    npcs: [
      { type: 'truck', lane: 0, speed: 0.4, direction: -1 },
      { type: 'worker', lane: 1, speed: 0, y: 380, stationary: true }
    ],
    tasks: [
      { id: 'slow_construction', text: 'Reduce speed', type: 'avoid', check: 'underSpeed' },
      { id: 'follow_detour', text: 'Follow detour', type: 'reach', check: 'followedDetour' },
      { id: 'pass_construction', text: 'Pass construction zone', type: 'reach', check: 'passedConstruction' }
    ],
    law: 'MV Act §184 — Speeding in construction zone — ₹2000–₹5000'
  },
  {
    id: 30, levelRef: 35, icon: '↔️', name: 'One-Way Street',
    desc: 'Enter one-way from correct direction. Wrong way = instant fail.',
    tier: 6, timeLimit: 40,
    road: { type: 'straight', lanes: 2, length: 800 },
    obstacles: [
      { type: 'one_way_sign', x: 240, y: 250, direction: 'up' },
      { type: 'wrong_way_car', x: 260, y: 400, direction: -1 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 1.2, direction: -1 }
    ],
    tasks: [
      { id: 'correct_dir', text: 'Enter from correct side', type: 'avoid', check: 'correctDirection' },
      { id: 'obey_one_way', text: 'Follow one-way', type: 'avoid', check: 'obeyedOneWay' },
      { id: 'reach_end', text: 'Reach end', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §119 — Driving against one-way — ₹500–₹2000'
  },
  // ── Tier 7: Emergency & Signs ──
  {
    id: 31, levelRef: 36, icon: '🪧', name: 'Sign Mastery',
    desc: 'All sign types — mandatory, cautionary, informational. Know them all.',
    tier: 7, timeLimit: 50,
    road: { type: 'straight', lanes: 2, length: 1000 },
    obstacles: [
      { type: 'sign', x: 200, y: 200, kind: 'mandatory_left' },
      { type: 'sign', x: 280, y: 350, kind: 'cautionary_zone' },
      { type: 'sign', x: 200, y: 500, kind: 'info_hospital_2km' },
      { type: 'sign', x: 280, y: 650, kind: 'mandatory_stop' }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.8, direction: -1 }
    ],
    tasks: [
      { id: 'obey_mandatory', text: 'Follow mandatory signs', type: 'avoid', check: 'obeyedMandatory' },
      { id: 'caution_sign', text: 'Slow at caution sign', type: 'avoid', check: 'underSpeed' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §118 — Disobeying mandatory sign — ₹200–₹1000'
  },
  {
    id: 32, levelRef: 37, icon: '🏥', name: 'Hospital Quiet Zone',
    desc: 'No honking near hospital. Reduce speed, be patient.',
    tier: 7, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 800 },
    obstacles: [
      { type: 'hospital_zone', x: 240, y: 350, w: 200, h: 200 }
    ],
    npcs: [
      { type: 'ambulance', lane: 0.5, speed: 1.5, y: -100, yEnd: 900 }
    ],
    tasks: [
      { id: 'no_honk_hosp', text: 'No honking', type: 'avoid', check: 'noHonk' },
      { id: 'slow_hosp', text: 'Slow in hospital zone', type: 'avoid', check: 'underSpeed' },
      { id: 'yield_ambulance', text: 'Yield to ambulance', type: 'stop', check: 'yieldedAmbulance' }
    ],
    law: 'MV Act §190 — Noise in hospital zone — ₹2000–₹5000'
  },
  {
    id: 33, levelRef: 38, icon: '🎪', name: 'Festival Traffic',
    desc: 'Festival crowds! Extra pedestrians, decorations blocking lanes.',
    tier: 7, timeLimit: 55,
    road: { type: 'straight', lanes: 2, length: 1000 },
    obstacles: [
      { type: 'festival_crowd', x: 240, y: 350, w: 200, h: 100 },
      { type: 'decoration', x: 200, y: 500 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 0, speed: 0.2, y: 300, crosses: true },
      { type: 'pedestrian', lane: 1, speed: 0.15, y: 320, crosses: true, delay: 500 },
      { type: 'pedestrian', lane: 0, speed: 0.25, y: 500, crosses: true, delay: 1000 },
      { type: 'car', lane: 1, speed: 0.4, direction: -1, delay: 2000 }
    ],
    tasks: [
      { id: 'patience', text: 'Be patient in crowd', type: 'avoid', check: 'noHonk' },
      { id: 'avoid_ped', text: 'Don\'t hit pedestrians', type: 'avoid', check: 'noCollision' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Dangerous driving near festival — ₹1000–₹5000'
  },
  {
    id: 34, levelRef: 39, icon: '🚴', name: 'Cyclist Safety',
    desc: 'Cyclists share the road. Give 1m space, never overtake on left.',
    tier: 7, timeLimit: 45,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [],
    npcs: [
      { type: 'cyclist', lane: 0, speed: 0.5, direction: -1 },
      { type: 'cyclist', lane: 0, speed: 0.4, direction: -1, delay: 1500 }
    ],
    tasks: [
      { id: 'give_space', text: 'Give 1m space', type: 'avoid', check: 'gaveSpace' },
      { id: 'no_left_pass', text: 'Don\'t pass on left', type: 'avoid', check: 'noLeftPass' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Unsafe overtaking — ₹1000–₹5000'
  },
  {
    id: 35, levelRef: 40, icon: '🏆', name: 'Grand Test',
    desc: 'Final test! Signals, pedestrians, speed, lanes, emergency — all at once.',
    tier: 7, timeLimit: 90,
    road: { type: 'intersection', lanes: 3, length: 1200 },
    obstacles: [
      { type: 'traffic_light', x: 240, y: 200, phases: ['red', 'green'], cycle: [4000, 3000] },
      { type: 'zebra', x: 240, y: 230 },
      { type: 'sign', x: 200, y: 400, kind: 'speed_limit_40' },
      { type: 'puddle', x: 260, y: 550, w: 60, h: 30 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 1.5, direction: -1, jumpsRed: true },
      { type: 'pedestrian', lane: 1, speed: 0.3, y: 220, crosses: true },
      { type: 'ambulance', lane: 0.5, speed: 1.5, y: -100, yEnd: 900, delay: 5000 }
    ],
    tasks: [
      { id: 'obey_signal', text: 'Obey signals', type: 'stop', check: 'stayedAtRed' },
      { id: 'yield_ped', text: 'Yield to pedestrians', type: 'stop', check: 'yieldedPed' },
      { id: 'speed_check', text: 'Maintain speed limit', type: 'avoid', check: 'underSpeed' },
      { id: 'yield_amb', text: 'Yield to ambulance', type: 'stop', check: 'yieldedAmbulance' },
      { id: 'finish', text: 'Complete the route', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act — All sections — ₹500–₹10000'
  },
  // ── Tier 8: Advanced Night & Weather ──
  {
    id: 36, levelRef: 41, icon: '🌙', name: 'Night Monsoon',
    desc: 'Night + rain + low visibility. Headlights on, hazards if stopped.',
    tier: 8, timeLimit: 60,
    road: { type: 'straight', lanes: 2, length: 1000 },
    obstacles: [
      { type: 'puddle', x: 240, y: 300, w: 80, h: 40 },
      { type: 'puddle', x: 260, y: 600, w: 70, h: 35 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.5, direction: -1 },
      { type: 'car', lane: 1, speed: 0.4, direction: -1, delay: 2000 }
    ],
    tasks: [
      { id: 'headlights', text: 'Turn on headlights', type: 'toggle', check: 'headlightsOn' },
      { id: 'slow_night', text: 'Reduce speed', type: 'avoid', check: 'underSpeed' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Driving without lights at night — ₹2000–₹5000'
  },
  {
    id: 37, levelRef: 42, icon: '⚠️', name: 'Wrong Side Escape',
    desc: 'A car is coming on the wrong side! React quickly.',
    tier: 8, timeLimit: 40,
    road: { type: 'straight', lanes: 2, length: 900 },
    obstacles: [],
    npcs: [
      { type: 'car', lane: 0, speed: 2.0, direction: 1, wrongSide: true }
    ],
    tasks: [
      { id: 'dodge_wrong', text: 'Dodge wrong-side car', type: 'avoid', check: 'noCollision' },
      { id: 'slow_down', text: 'Slow down', type: 'avoid', check: 'underSpeed' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §119 — Driving on wrong side — ₹500–₹2000'
  },
  {
    id: 38, levelRef: 43, icon: '🛣️', name: 'Highway Merge',
    desc: 'Merge onto highway from on-ramp. Match speed, indicate, merge.',
    tier: 8, timeLimit: 50,
    road: { type: 'highway', lanes: 3, length: 1200 },
    obstacles: [],
    npcs: [
      { type: 'car', lane: 0, speed: 1.5, direction: -1 },
      { type: 'truck', lane: 1, speed: 1.0, direction: -1, delay: 1000 },
      { type: 'car', lane: 2, speed: 1.8, direction: -1, delay: 2000 }
    ],
    tasks: [
      { id: 'match_speed', text: 'Match highway speed', type: 'avoid', check: 'speedMatched' },
      { id: 'indicate', text: 'Use indicator', type: 'toggle', check: 'indicatorOn' },
      { id: 'merge_safe', text: 'Merge safely', type: 'reach', check: 'merged' }
    ],
    law: 'MV Act §184 — Unsafe merging — ₹1000–₹5000'
  },
  {
    id: 39, levelRef: 44, icon: '🚧', name: 'Night Construction',
    desc: 'Road work at night. Dim lights, follow detour carefully.',
    tier: 8, timeLimit: 55,
    road: { type: 'straight', lanes: 2, length: 1000 },
    obstacles: [
      { type: 'construction_zone', x: 240, y: 350, w: 160, h: 120 },
      { type: 'detour_sign', x: 300, y: 280 }
    ],
    npcs: [
      { type: 'truck', lane: 0, speed: 0.3, direction: -1 },
      { type: 'worker', lane: 1, speed: 0, y: 380, stationary: true }
    ],
    tasks: [
      { id: 'dim_lights', text: 'Dim headlights', type: 'toggle', check: 'dimmedLights' },
      { id: 'follow_detour', text: 'Follow detour', type: 'reach', check: 'followedDetour' },
      { id: 'pass_safe', text: 'Pass construction', type: 'reach', check: 'passedConstruction' }
    ],
    law: 'MV Act §184 — Speeding in construction zone — ₹2000–₹5000'
  },
  {
    id: 40, levelRef: 45, icon: '🌫️', name: 'Zero Visibility',
    desc: 'Dense fog. Horn at intervals, hazard lights on, crawl forward.',
    tier: 8, timeLimit: 60,
    road: { type: 'straight', lanes: 2, length: 800 },
    obstacles: [
      { type: 'fog', x: 240, y: 350, w: 200, h: 200 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 0.3, direction: -1 }
    ],
    tasks: [
      { id: 'hazard_on', text: 'Turn on hazards', type: 'toggle', check: 'hazardsOn' },
      { id: 'horn_int', text: 'Honk at intervals', type: 'toggle', check: 'usedHorn' },
      { id: 'crawl_dest', text: 'Crawl to destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Driving without visibility — ₹1000–₹5000'
  },
  // ── Tier 9: Grand Challenge ──
  {
    id: 41, levelRef: 46, icon: '🎪', name: 'Night Festival',
    desc: 'Festival at night — crowds, lights, noise, zero patience.',
    tier: 9, timeLimit: 60,
    road: { type: 'straight', lanes: 2, length: 1000 },
    obstacles: [
      { type: 'festival_crowd', x: 240, y: 350, w: 180, h: 80 },
      { type: 'decoration', x: 200, y: 500 }
    ],
    npcs: [
      { type: 'pedestrian', lane: 0, speed: 0.2, y: 300, crosses: true },
      { type: 'pedestrian', lane: 1, speed: 0.15, y: 320, crosses: true, delay: 500 },
      { type: 'car', lane: 1, speed: 0.4, direction: -1, delay: 2000 }
    ],
    tasks: [
      { id: 'lights_on', text: 'Headlights on', type: 'toggle', check: 'headlightsOn' },
      { id: 'no_honk_fest', text: 'No honking', type: 'avoid', check: 'noHonk' },
      { id: 'patience', text: 'Be patient', type: 'avoid', check: 'noCollision' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184/190 — Dangerous driving + noise — ₹1000–₹10000'
  },
  {
    id: 42, levelRef: 47, icon: '🏔️', name: 'Mountain Night',
    desc: 'Hill driving at night — no street lights, tight turns, steep drops.',
    tier: 9, timeLimit: 60,
    road: { type: 'straight', lanes: 1, length: 1000 },
    obstacles: [
      { type: 'blind_turn', x: 240, y: 300 },
      { type: 'slope', x: 240, y: 550, gradient: 15 }
    ],
    npcs: [
      { type: 'truck', lane: 0, speed: 0.4, direction: 1 }
    ],
    tasks: [
      { id: 'high_beam', text: 'Use high beam', type: 'toggle', check: 'highBeam' },
      { id: 'low_beam_turn', text: 'Low beam at turn', type: 'toggle', check: 'lowBeamAtTurn' },
      { id: 'use_gear', text: 'Use low gear', type: 'toggle', check: 'lowGear' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Dangerous mountain driving — ₹2000–₹5000'
  },
  {
    id: 43, levelRef: 48, icon: '🌾', name: 'Rural Gauntlet',
    desc: 'Rural road — tractors, animals, unpaved sections, no markings.',
    tier: 9, timeLimit: 55,
    road: { type: 'straight', lanes: 1, length: 1000 },
    obstacles: [
      { type: 'animal', x: 240, y: 400, kind: 'cow', w: 60, h: 40 },
      { type: 'unpaved', x: 240, y: 600, w: 100, h: 80 }
    ],
    npcs: [
      { type: 'truck', lane: 0, speed: 0.4, direction: -1 }
    ],
    tasks: [
      { id: 'avoid_cow', text: 'Avoid cow', type: 'avoid', check: 'noCollision' },
      { id: 'slow_unpaved', text: 'Slow on unpaved', type: 'avoid', check: 'underSpeed' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act §184 — Careless driving — ₹1000–₹5000'
  },
  {
    id: 44, levelRef: 49, icon: '🚌', name: 'Multi-Modal Chaos',
    desc: 'Bus, auto, bike, pedestrian, cyclist — all in one road!',
    tier: 9, timeLimit: 60,
    road: { type: 'intersection', lanes: 3, length: 1100 },
    obstacles: [
      { type: 'traffic_light', x: 240, y: 200, phases: ['red', 'green'], cycle: [4000, 3000] },
      { type: 'zebra', x: 240, y: 230 }
    ],
    npcs: [
      { type: 'bus', lane: 0, speed: 0.6, direction: -1 },
      { type: 'auto', lane: 1, speed: 0.9, direction: -1, delay: 500 },
      { type: 'cyclist', lane: 2, speed: 0.4, direction: -1, delay: 1000 },
      { type: 'pedestrian', lane: 1, speed: 0.25, y: 220, crosses: true, delay: 1500 },
      { type: 'car', lane: 0, speed: 1.0, direction: -1, delay: 2000 }
    ],
    tasks: [
      { id: 'obey_signal', text: 'Obey signal', type: 'stop', check: 'stayedAtRed' },
      { id: 'yield_ped', text: 'Yield to pedestrians', type: 'stop', check: 'yieldedPed' },
      { id: 'no_collision', text: 'No collision', type: 'avoid', check: 'noCollision' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act — All sections — ₹500–₹10000'
  },
  {
    id: 45, levelRef: 50, icon: '🏆', name: 'Ultimate Grand Test',
    desc: 'Night + rain + hill + festival + animals. Everything at once. Good luck.',
    tier: 9, timeLimit: 120,
    road: { type: 'intersection', lanes: 3, length: 1400 },
    obstacles: [
      { type: 'traffic_light', x: 240, y: 200, phases: ['red', 'green'], cycle: [3500, 3000] },
      { type: 'zebra', x: 240, y: 230 },
      { type: 'puddle', x: 260, y: 400, w: 70, h: 35 },
      { type: 'animal', x: 240, y: 550, kind: 'cow', w: 60, h: 40 },
      { type: 'sign', x: 200, y: 700, kind: 'speed_limit_40' },
      { type: 'festival_crowd', x: 240, y: 850, w: 160, h: 60 }
    ],
    npcs: [
      { type: 'car', lane: 0, speed: 1.5, direction: -1, jumpsRed: true },
      { type: 'pedestrian', lane: 1, speed: 0.3, y: 220, crosses: true },
      { type: 'ambulance', lane: 0.5, speed: 1.5, y: -100, yEnd: 1200, delay: 5000 },
      { type: 'cyclist', lane: 2, speed: 0.4, direction: -1, delay: 3000 },
      { type: 'auto', lane: 1, speed: 0.8, direction: -1, delay: 4000 }
    ],
    tasks: [
      { id: 'headlights', text: 'Headlights on', type: 'toggle', check: 'headlightsOn' },
      { id: 'obey_signal', text: 'Obey signals', type: 'stop', check: 'stayedAtRed' },
      { id: 'yield_ped', text: 'Yield to pedestrians', type: 'stop', check: 'yieldedPed' },
      { id: 'avoid_puddle', text: 'Avoid puddles', type: 'avoid', check: 'noPuddleHit' },
      { id: 'avoid_cow', text: 'Avoid animal', type: 'avoid', check: 'noCollision' },
      { id: 'yield_amb', text: 'Yield to ambulance', type: 'stop', check: 'yieldedAmbulance' },
      { id: 'reach_dest', text: 'Reach destination', type: 'reach', check: 'reachedDest' }
    ],
    law: 'MV Act — All sections — ₹500–₹10000'
  }
]

// ─── GAME CONSTANTS ───
const W = 480, H = 800
const ROAD_LW = 60          // lane width
const ROAD_LEFT = (W - ROAD_LW * 3) / 2   // left edge of road
const PLAYER_W = 34, PLAYER_H = 60
const CAR_W = 34, CAR_H = 60
const PED_SIZE = 14
const COLORS = {
  bg: 0x4a7c59,           // grass green
  road: 0x555555,         // asphalt
  roadLine: 0xffffff,     // lane markings
  roadEdge: 0xffd700,     // yellow edge lines
  player: 0x2196F3,       // blue
  npcCar: 0xe74c3c,       // red
  npcCar2: 0xf39c12,      // orange
  ambulance: 0xffffff,    // white
  ambulanceFlash: 0xff0000,
  pedestrian: 0x8B4513,   // brown skin
  pedestrianClothes: 0x3498db,
  puddle: 0x3498db,
  zebra: 0xffffff,
  schoolZone: 0xf1c40f,
  hospitalZone: 0xe74c3c,
  silenceZone: 0x9b59b6,
  parkingSpot: 0x2ecc71,
  noParking: 0xe74c3c,
  marketZone: 0xe67e22,
  gate: 0x8B4513,
  trafficJam: 0x7f8c8d,
  lightRed: 0xff0000,
  lightGreen: 0x00ff00,
  lightYellow: 0xffff00,
  nightBg: 0x1a1a2e,
  nightRoad: 0x333333
}

// ─── HELPER: lane center X ───
function laneX(lane, lanes) {
  const totalW = lanes * ROAD_LW
  const startX = (W - totalW) / 2
  return startX + lane * ROAD_LW + ROAD_LW / 2
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 1: Boot — create procedural textures
// ═══════════════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super('Boot') }

  create() {
    // Car texture (simple rectangle with windows)
    const carG = this.make.graphics({ x: 0, y: 0, add: false })
    carG.fillStyle(COLORS.player, 1)
    carG.fillRoundedRect(0, 0, PLAYER_W, PLAYER_H, 6)
    carG.fillStyle(0x87CEEB, 0.7) // window
    carG.fillRect(4, 4, PLAYER_W - 8, 14)
    carG.fillRect(4, PLAYER_H - 18, PLAYER_W - 8, 10)
    carG.fillStyle(0xff4444, 1) // tail lights
    carG.fillRect(2, PLAYER_H - 4, 6, 4)
    carG.fillRect(PLAYER_W - 8, PLAYER_H - 4, 6, 4)
    carG.fillStyle(0xffff88, 1) // headlights
    carG.fillRect(2, 0, 6, 4)
    carG.fillRect(PLAYER_W - 8, 0, 6, 4)
    carG.generateTexture('player', PLAYER_W, PLAYER_H)
    carG.destroy()

    // NPC car
    const npcG = this.make.graphics({ x: 0, y: 0, add: false })
    npcG.fillStyle(COLORS.npcCar, 1)
    npcG.fillRoundedRect(0, 0, CAR_W, CAR_H, 6)
    npcG.fillStyle(0x87CEEB, 0.6)
    npcG.fillRect(4, 4, CAR_W - 8, 12)
    npcG.fillRect(4, CAR_H - 16, CAR_W - 8, 8)
    npcG.fillStyle(0xffff88, 1)
    npcG.fillRect(2, 0, 6, 4)
    npcG.fillRect(CAR_W - 8, 0, 6, 4)
    npcG.generateTexture('npc_car', CAR_W, CAR_H)
    npcG.destroy()

    // Orange NPC car
    const npc2G = this.make.graphics({ x: 0, y: 0, add: false })
    npc2G.fillStyle(COLORS.npcCar2, 1)
    npc2G.fillRoundedRect(0, 0, CAR_W, CAR_H, 6)
    npc2G.fillStyle(0x87CEEB, 0.6)
    npc2G.fillRect(4, 4, CAR_W - 8, 12)
    npc2G.fillRect(4, CAR_H - 16, CAR_W - 8, 8)
    npc2G.fillStyle(0xffff88, 1)
    npc2G.fillRect(2, 0, 6, 4)
    npc2G.fillRect(CAR_W - 8, 0, 6, 4)
    npc2G.generateTexture('npc_car2', CAR_W, CAR_H)
    npc2G.destroy()

    // Ambulance
    const ambG = this.make.graphics({ x: 0, y: 0, add: false })
    ambG.fillStyle(COLORS.ambulance, 1)
    ambG.fillRoundedRect(0, 0, 38, 70, 6)
    ambG.fillStyle(0xff0000, 1)
    ambG.fillRect(10, 2, 18, 6) // red cross bar
    ambG.fillRect(16, 0, 6, 10)
    ambG.fillStyle(0x87CEEB, 0.6)
    ambG.fillRect(4, 12, 30, 12)
    ambG.fillStyle(0x0066ff, 1)
    ambG.fillRect(4, 2, 6, 6)   // blue light left
    ambG.fillRect(28, 2, 6, 6)  // blue light right
    ambG.generateTexture('ambulance', 38, 70)
    ambG.destroy()

    // Pedestrian (small circle body)
    const pedG = this.make.graphics({ x: 0, y: 0, add: false })
    pedG.fillStyle(COLORS.pedestrian, 1)
    pedG.fillCircle(PED_SIZE / 2, PED_SIZE / 2, PED_SIZE / 2)
    pedG.fillStyle(COLORS.pedestrianClothes, 1)
    pedG.fillRect(3, PED_SIZE / 2, PED_SIZE - 6, PED_SIZE / 2)
    pedG.generateTexture('pedestrian', PED_SIZE, PED_SIZE)
    pedG.destroy()

    // Puddle
    const pudG = this.make.graphics({ x: 0, y: 0, add: false })
    pudG.fillStyle(COLORS.puddle, 0.6)
    pudG.fillEllipse(40, 20, 80, 40)
    pudG.generateTexture('puddle', 80, 40)
    pudG.destroy()

    // Parking spot marker
    const parkG = this.make.graphics({ x: 0, y: 0, add: false })
    parkG.lineStyle(3, COLORS.parkingSpot, 1)
    parkG.strokeRect(0, 0, 55, 100)
    parkG.fillStyle(COLORS.parkingSpot, 0.15)
    parkG.fillRect(0, 0, 55, 100)
    // P letter
    parkG.fillStyle(COLORS.parkingSpot, 1)
    parkG.fillRect(18, 20, 4, 40)
    parkG.fillCircle(32, 24, 12)
    parkG.fillStyle(0x4a7c59, 1)
    parkG.fillCircle(32, 24, 8)
    parkG.generateTexture('parking_spot', 55, 100)
    parkG.destroy()

    this.scene.start('Menu')
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 2: Menu — scenario selection grid
// ═══════════════════════════════════════════════════════════════════
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu') }

  create() {
    const isNight = false

    // If a specific scenario was requested (from Academy), skip menu and go directly to game
    if (window._s2d_pendingId) {
      const pid = window._s2d_pendingId
      window._s2d_pendingId = null
      this.scene.start('Game', { scenarioId: pid })
      return
    }

    this.cameras.main.setBackgroundColor(isNight ? COLORS.nightBg : COLORS.bg)

    // Title
    this.add.text(W / 2, 40, '🚦 Traffic Scenarios', {
      fontFamily: 'Inter, sans-serif', fontSize: '22px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)

    // Tier labels and cards
    const progress = this._loadProgress()
    let yPos = 80

    const tiers = [
      { label: '⭐ Tier 1 — Basic Rules', ids: [1,2,3,4,5] },
      { label: '⭐⭐ Tier 2 — Intermediate', ids: [6,7,8,9,10,11] },
      { label: '⭐⭐⭐ Tier 3 — Advanced', ids: [12,13,14] },
      { label: '⭐⭐⭐⭐ Tier 4 — Expert', ids: [15] }
    ]

    tiers.forEach(tier => {
      // Tier header
      this.add.text(20, yPos, tier.label, {
        fontFamily: 'Inter, sans-serif', fontSize: '14px', fontStyle: 'bold',
        color: '#ffd54a'
      })
      yPos += 28

      // Scenario cards in a row
      tier.ids.forEach((sid, i) => {
        const sc = SCENARIOS.find(s => s.id === sid)
        if (!sc) return
        const col = i % 5
        const row = Math.floor(i / 5)
        const cx = 24 + col * 92
        const cy = yPos + row * 100
        const unlocked = sid === 1 || progress[`s${sid - 1}_done`]

        this._drawCard(cx, cy, sc, unlocked, progress)
      })
      yPos += Math.ceil(tier.ids.length / 5) * 100 + 12
    })

    // Scrollable content if needed
    this.cameras.main.setBounds(0, 0, W, Math.max(yPos + 40, H))
    this._scrollY = 0
    this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
      this._scrollY = Phaser.Math.Clamp(this._scrollY + dy * 0.5, 0, Math.max(yPos + 40 - H, 0))
      this.cameras.main.scrollY = this._scrollY
    })

    // Touch drag scroll
    let dragStartY = 0, scrollStartY = 0
    this.input.on('pointerdown', (p) => { dragStartY = p.y; scrollStartY = this._scrollY })
    this.input.on('pointermove', (p) => {
      if (p.isDown) {
        const dy = dragStartY - p.y
        this._scrollY = Phaser.Math.Clamp(scrollStartY + dy, 0, Math.max(yPos + 40 - H, 0))
        this.cameras.main.scrollY = this._scrollY
      }
    })
  }

  _drawCard(x, y, sc, unlocked, progress) {
    const w = 84, h = 90
    const g = this.add.graphics()
    g.fillStyle(unlocked ? 0x1a1a2e : 0x333333, 0.85)
    g.fillRoundedRect(x, y, w, h, 8)
    g.lineStyle(2, unlocked ? 0xffd54a : 0x555555, 0.6)
    g.strokeRoundedRect(x, y, w, h, 8)

    // Icon
    this.add.text(x + w/2, y + 22, sc.icon, {
      fontFamily: 'sans-serif', fontSize: '26px'
    }).setOrigin(0.5)

    // Name (truncated)
    const shortName = sc.name.length > 12 ? sc.name.substring(0, 11) + '…' : sc.name
    this.add.text(x + w/2, y + 50, shortName, {
      fontFamily: 'Inter, sans-serif', fontSize: '10px',
      color: unlocked ? '#ffffff' : '#888888', align: 'center',
      wordWrap: { width: w - 8 }
    }).setOrigin(0.5)

    // Stars
    const stars = progress[`s${sc.id}_done`] ? (progress[`s${sc.id}_stars`] || 1) : 0
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars)
    this.add.text(x + w/2, y + 72, starStr, {
      fontFamily: 'sans-serif', fontSize: '12px'
    }).setOrigin(0.5)

    // Click zone
    if (unlocked) {
      const hitArea = this.add.rectangle(x + w/2, y + h/2, w, h, 0xffffff, 0)
      hitArea.setInteractive({ useHandCursor: true })
      hitArea.on('pointerdown', () => {
        this.scene.start('Game', { scenarioId: sc.id })
      })
      hitArea.on('pointerover', () => {
        g.clear()
        g.fillStyle(0x2a2a4e, 0.95)
        g.fillRoundedRect(x, y, w, h, 8)
        g.lineStyle(2, 0xffd54a, 1)
        g.strokeRoundedRect(x, y, w, h, 8)
      })
      hitArea.on('pointerout', () => {
        g.clear()
        g.fillStyle(0x1a1a2e, 0.85)
        g.fillRoundedRect(x, y, w, h, 8)
        g.lineStyle(2, 0xffd54a, 0.6)
        g.strokeRoundedRect(x, y, w, h, 8)
      })
    }
  }

  _loadProgress() {
    try {
      const s = JSON.parse(localStorage.getItem('mth4') || '{}')
      return s.scenario2d || {}
    } catch { return {} }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 3: Game — main gameplay
// ═══════════════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene {
  constructor() { super('Game') }

  init(data) {
    this.scenarioId = data.scenarioId || 1
    this.cfg = SCENARIOS.find(s => s.id === this.scenarioId) || SCENARIOS[0]
  }

  create() {
    const c = this.cfg
    const isNight = c.road && c.road.night

    // ── Background ──
    this.cameras.main.setBackgroundColor(isNight ? COLORS.nightBg : COLORS.bg)

    // ── Road ──
    const roadLanes = c.road.lanes
    const roadW = roadLanes * ROAD_LW
    const roadX = (W - roadW) / 2
    this.roadG = this.add.graphics()
    this.roadG.fillStyle(isNight ? COLORS.nightRoad : COLORS.road, 1)
    this.roadG.fillRect(roadX, 0, roadW, c.road.length)

    // Lane markings
    for (let i = 1; i < roadLanes; i++) {
      const lx = roadX + i * ROAD_LW
      this.roadG.lineStyle(2, COLORS.roadLine, 0.5)
      for (let y = 0; y < c.road.length; y += 30) {
        this.roadG.lineBetween(lx, y, lx, y + 15)
      }
    }
    // Edge lines (solid yellow)
    this.roadG.lineStyle(3, COLORS.roadEdge, 0.8)
    this.roadG.lineBetween(roadX, 0, roadX, c.road.length)
    this.roadG.lineBetween(roadX + roadW, 0, roadX + roadW, c.road.length)

    // ── Obstacles ──
    this.obstacleSprites = []
    this.trafficLight = null
    this.lightPhase = 'red'
    this.lightTimer = 0
    this.lightCycleIdx = 0

    if (c.obstacles) {
      c.obstacles.forEach(ob => {
        if (ob.type === 'traffic_light') {
          this._createTrafficLight(ob)
        } else if (ob.type === 'puddle') {
          const p = this.add.image(ob.x, ob.y, 'puddle')
          p.setDisplaySize(ob.w || 80, ob.h || 40)
          p.type = 'puddle'
          this.obstacleSprites.push(p)
        } else if (ob.type === 'zebra') {
          this._createZebra(ob.x, ob.y)
        } else if (ob.type === 'parking_spot') {
          const ps = this.add.image(ob.x, ob.y, 'parking_spot')
          ps.type = 'parking_spot'
          ps.obData = ob
          this.obstacleSprites.push(ps)
        } else if (ob.type === 'school_zone') {
          this._createZone(ob.x, ob.y, ob.w, ob.h, COLORS.schoolZone, '🏫 School Zone')
        } else if (ob.type === 'hospital_zone') {
          this._createZone(ob.x, ob.y, ob.w, ob.h, COLORS.hospitalZone, '🏥 Hospital')
        } else if (ob.type === 'silence_zone') {
          this._createZone(ob.x, ob.y, ob.w, ob.h, COLORS.silenceZone, '🤫 Silence Zone')
        } else if (ob.type === 'market_zone') {
          this._createZone(ob.x, ob.y, ob.w, ob.h, COLORS.marketZone, '🛒 Market')
        } else if (ob.type === 'no_parking_zone') {
          this._createZone(ob.x, ob.y, ob.w, ob.h, COLORS.noParking, '🚫 No Parking')
        } else if (ob.type === 'parked_car') {
          const pc = this.add.image(ob.x, ob.y, 'npc_car')
          pc.setDisplaySize(ob.w || 40, ob.h || 70)
          pc.type = 'parked_car'
          this.obstacleSprites.push(pc)
        } else if (ob.type === 'gate') {
          const gt = this.add.graphics()
          gt.fillStyle(COLORS.gate, 1)
          gt.fillRect(ob.x - ob.w/2, ob.y - ob.h/2, ob.w, ob.h)
          gt.type = 'gate'
          gt.obData = ob
          this.obstacleSprites.push(gt)
        } else if (ob.type === 'traffic_jam') {
          this._createZone(ob.x, ob.y, ob.w, ob.h, COLORS.trafficJam, '🚗 Jam')
        }
      })
    }

    // ── NPCs ──
    this.npcSprites = []
    if (c.npcs) {
      c.npcs.forEach(n => {
        const nx = laneX(n.lane, roadLanes)
        const ny = n.y !== undefined ? n.y : -50
        let spr
        if (n.type === 'ambulance') {
          spr = this.add.image(nx, ny, 'ambulance')
          spr.setDisplaySize(38, 70)
          spr.type = 'ambulance'
          // Flash effect
          this.tweens.add({
            targets: spr, alpha: { from: 1, to: 0.4 },
            duration: 300, yoyo: true, repeat: -1
          })
        } else if (n.type === 'pedestrian') {
          spr = this.add.image(nx, ny, 'pedestrian')
          spr.type = 'pedestrian'
        } else {
          const tex = Math.random() > 0.5 ? 'npc_car' : 'npc_car2'
          spr = this.add.image(nx, ny, tex)
          spr.setDisplaySize(CAR_W, CAR_H)
          spr.type = 'car'
          if (n.direction === -1) spr.setAngle(180)
        }
        spr.npcData = { ...n, baseX: nx, startX: ny }
        this.npcSprites.push(spr)
      })
    }

    // ── Player ──
    const playerX = laneX(roadLanes > 1 ? 1 : 0, roadLanes)
    const playerY = c.road.length - 100
    this.player = this.add.image(playerX, playerY, 'player')
    this.player.setDisplaySize(PLAYER_W, PLAYER_H)

    // Camera follow (scroll up the road)
    this.cameras.main.setBounds(0, 0, W, c.road.length)
    this.cameras.main.startFollow(this.player, true, 1, 0.1)
    this.cameras.main.setFollowOffset(-W/2, H/2 - 100)

    // ── Player state ──
    this.playerSpeed = 0
    this.playerMaxSpeed = 2.5
    this.playerAccel = 0.08
    this.playerBrake = 0.15
    this.playerFriction = 0.02
    this.isMoving = false
    this.isStopped = false
    this.honked = false
    this.headlightsOn = false
    this.headlightsDipped = false
    this.hazardsOn = false
    this.indicatorOn = false

    // ── Task state ──
    this.taskState = {}
    c.tasks.forEach(t => { this.taskState[t.id] = false })

    // ── Timer ──
    this.timeLeft = c.timeLimit
    this.gameOver = false
    this.violations = 0

    // ── Controls ──
    this.cursors = this.input.keyboard.createCursorKeys()
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H)
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I)

    // Touch controls
    this.touchAccel = false
    this.input.on('pointerdown', () => { this.touchAccel = true })
    this.input.on('pointerup', () => { this.touchAccel = false })

    // ── HUD ──
    this._createHUD()

    // ── Timer event ──
    this.time.addEvent({
      delay: 1000, repeat: c.timeLimit - 1,
      callback: () => {
        this.timeLeft--
        if (this.hudTimer) this.hudTimer.setText('⏱ ' + this.timeLeft + 's')
        if (this.timeLeft <= 0 && !this.gameOver) {
          this._endGame(false, 'Time\'s up!')
        }
      }
    })
  }

  update(time, delta) {
    if (this.gameOver) return
    const c = this.cfg
    const roadLanes = c.road.lanes
    const dt = delta / 16.67 // normalize to ~60fps

    // ── Player movement ──
    const accel = this.cursors.up.isDown || this.spaceKey.isDown || this.touchAccel
    const brake = this.cursors.down.isDown

    if (accel) {
      this.playerSpeed = Math.min(this.playerSpeed + this.playerAccel * dt, this.playerMaxSpeed)
      this.isMoving = true
    } else if (brake) {
      this.playerSpeed = Math.max(this.playerSpeed - this.playerBrake * dt, 0)
      this.isMoving = false
    } else {
      this.playerSpeed = Math.max(this.playerSpeed - this.playerFriction * dt, 0)
      if (this.playerSpeed < 0.05) { this.playerSpeed = 0; this.isMoving = false }
    }

    this.isStopped = this.playerSpeed < 0.05
    this.player.y -= this.playerSpeed * dt

    // Keep player on road
    const roadX = (W - roadLanes * ROAD_LW) / 2
    this.player.x = Phaser.Math.Clamp(this.player.x, roadX + PLAYER_W/2, roadX + roadLanes * ROAD_LW - PLAYER_W/2)

    // ── Honk (H key or double-tap) ──
    if (Phaser.Input.Keyboard.JustDown(this.hKey)) {
      this.honked = true
      if (typeof sfx !== 'undefined') sfx.play('horn')
    }

    // ── Indicator toggle (I key) ──
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.indicatorOn = !this.indicatorOn
    }

    // ── Headlights toggle (auto for night scenarios) ──
    if (c.road && c.road.night) {
      this.headlightsOn = true
      this.headlightsDipped = true
    }

    // ── Traffic light update ──
    if (this.trafficLight) {
      this.lightTimer += delta
      const phases = this.cfg.obstacles.find(o => o.type === 'traffic_light').phases
      const cycle = this.cfg.obstacles.find(o => o.type === 'traffic_light').cycle
      if (this.lightTimer >= cycle[this.lightCycleIdx]) {
        this.lightTimer = 0
        this.lightCycleIdx = (this.lightCycleIdx + 1) % phases.length
        this.lightPhase = phases[this.lightCycleIdx]
        this._updateTrafficLight()
      }
    }

    // ── NPC movement ──
    this.npcSprites.forEach(spr => {
      const nd = spr.npcData
      if (nd.crosses && !nd.crossed) {
        // Pedestrian crossing
        if (!nd._startTimer) nd._startTimer = 0
        nd._startTimer += delta
        const delay = nd.delay || 0
        if (nd._startTimer > delay) {
          const roadX2 = (W - roadLanes * ROAD_LW) / 2
          const targetX = nd.lane < roadLanes / 2
            ? roadX2 + roadLanes * ROAD_LW + 30
            : roadX2 - 30
          spr.x += (targetX < spr.x ? -1 : 1) * nd.speed * dt
          if (Math.abs(spr.x - targetX) < 5) nd.crossed = true
        }
      } else if (nd.stationary) {
        // Don't move
      } else if (nd.speed) {
        spr.y += nd.speed * (nd.direction || 1) * dt
        // Ambulance going off-screen
        if (spr.type === 'ambulance' && spr.y > (nd.yEnd || 900)) {
          nd.passed = true
          spr.setAlpha(0.3)
        }
      }
    })

    // ── Collision checks ──
    this._checkCollisions()

    // ── Task checks ──
    this._checkTasks()

    // ── Update task HUD ──
    this._updateTaskHUD()

    // ── Check win condition ──
    const allDone = c.tasks.every(t => this.taskState[t.id])
    if (allDone && !this.gameOver) {
      this._endGame(true, 'All tasks complete!')
    }
  }

  // ── COLLISION DETECTION ──
  _checkCollisions() {
    const px = this.player.x, py = this.player.y
    const pw = PLAYER_W / 2, ph = PLAYER_H / 2

    this.obstacleSprites.forEach(ob => {
      if (!ob.active) return
      let ox, oy, ow, oh

      if (ob.type === 'puddle') {
        ox = ob.x; oy = ob.y
        ow = (ob.displayWidth || 80) / 2
        oh = (ob.displayHeight || 40) / 2
        if (Math.abs(px - ox) < pw + ow && Math.abs(py - oy) < ph + oh) {
          if (this.playerSpeed > 0.5) {
            this.taskState['noSplash'] = false
            this.violations++
          }
        }
      } else if (ob.type === 'parking_spot') {
        ox = ob.x; oy = ob.y
        ow = 28; oh = 50
        if (Math.abs(px - ox) < pw + ow && Math.abs(py - oy) < ph + oh) {
          this.taskState['nearParking'] = true
          if (this.isStopped) this.taskState['parkedLegal'] = true
        }
      } else if (ob.type === 'parked_car') {
        ox = ob.x; oy = ob.y
        ow = 20; oh = 35
        if (Math.abs(px - ox) < pw + ow && Math.abs(py - oy) < ph + oh) {
          this._endGame(false, 'Hit a parked car!')
        }
      }
    })

    this.npcSprites.forEach(spr => {
      if (!spr.active) return
      const dist = Phaser.Math.Distance.Between(px, py, spr.x, spr.y)
      if (spr.type === 'pedestrian' && dist < 20) {
        this._endGame(false, 'Hit a pedestrian!')
      } else if (spr.type === 'car' && dist < 30) {
        this._endGame(false, 'Collided with another car!')
      } else if (spr.type === 'ambulance' && dist < 25) {
        this._endGame(false, 'Hit the ambulance!')
      }
    })
  }

  // ── TASK CHECKS ──
  _checkTasks() {
    const py = this.player.y
    const px = this.player.x
    const c = this.cfg

    c.tasks.forEach(task => {
      if (this.taskState[task.id]) return // already done

      switch (task.check) {
        case 'redLight':
          this.taskState[task.id] = this.lightPhase === 'red' && this.isStopped
          break
        case 'pedestriansSafe':
          this.taskState[task.id] = this.npcSprites
            .filter(s => s.type === 'pedestrian' && s.npcData.crosses)
            .every(s => s.npcData.crossed)
          break
        case 'crossedIntersection':
          this.taskState[task.id] = this.lightPhase === 'green' && py < 180
          break
        case 'nearParking':
          // handled in collision
          break
        case 'parkedLegal':
          // handled in collision
          break
        case 'reachedDest':
          this.taskState[task.id] = py < 120
          break
        case 'pulledOver':
          this.taskState[task.id] = this.player.x < (W / 2 - ROAD_LW)
          break
        case 'isStopped':
          this.taskState[task.id] = this.isStopped
          break
        case 'ambulancePassed':
          this.taskState[task.id] = this.npcSprites
            .filter(s => s.type === 'ambulance')
            .every(s => s.npcData.passed)
          break
        case 'slowSpeed':
          this.taskState[task.id] = this.playerSpeed < 0.8
          break
        case 'noSplash':
          this.taskState[task.id] = this.violations === 0
          break
        case 'crawledPast':
          this.taskState[task.id] = py < 300 && this.playerSpeed < 0.5
          break
        case 'schoolSpeed':
          this.taskState[task.id] = this.playerSpeed < 0.5
          break
        case 'noChildHit':
          this.taskState[task.id] = this.violations === 0
          break
        case 'passedSchool':
          this.taskState[task.id] = py < 200
          break
        case 'notInHospitalZone':
          this.taskState[task.id] = true // always true unless in zone
          break
        case 'noHonk':
          this.taskState[task.id] = !this.honked
          break
        case 'safeDistance':
          this.taskState[task.id] = this.npcSprites
            .filter(s => s.type === 'car')
            .every(s => Phaser.Math.Distance.Between(px, py, s.x, s.y) > 60)
          break
        case 'foundGap':
          this.taskState[task.id] = py < 400
          break
        case 'usedIndicator':
          this.taskState[task.id] = this.indicatorOn
          break
        case 'headlightsOn':
          this.taskState[task.id] = this.headlightsOn
          break
        case 'headlightsDipped':
          this.taskState[task.id] = this.headlightsDipped
          break
        case 'nightSpeedLimit':
          this.taskState[task.id] = this.playerSpeed < 1.0
          break
        case 'passedMarket':
          this.taskState[task.id] = py < 300
          break
        case 'waitedForNPC':
          this.taskState[task.id] = this.isStopped && py < 400
          break
        case 'mergedLeft':
          this.taskState[task.id] = this.player.x < laneX(0, 3)
          break
        case 'maintainedSpeed':
          this.taskState[task.id] = this.playerSpeed > 1.0
          break
        case 'awayFromGate':
          this.taskState[task.id] = py < 300
          break
        case 'hazardsOn':
          this.taskState[task.id] = this.hazardsOn
          break
        case 'inchedForward':
          this.taskState[task.id] = py < 350
          break
      }
    })

    // Auto-toggle hazards with H key for scenario 15
    if (this.cfg.id === 15 && Phaser.Input.Keyboard.JustDown(this.hKey)) {
      this.hazardsOn = true
    }
  }

  // ── CREATE OBJECTS ──
  _createTrafficLight(ob) {
    const g = this.add.graphics()
    // Post
    g.fillStyle(0x333333, 1)
    g.fillRect(ob.x - 4, ob.y - 50, 8, 50)
    // Housing
    g.fillStyle(0x222222, 1)
    g.fillRoundedRect(ob.x - 12, ob.y - 55, 24, 55, 4)
    // Lights
    this.lightRed = this.add.circle(ob.x, ob.y - 42, 8, COLORS.lightRed, 0.3)
    this.lightYellow = this.add.circle(ob.x, ob.y - 28, 8, COLORS.lightYellow, 0.3)
    this.lightGreen = this.add.circle(ob.x, ob.y - 14, 8, COLORS.lightGreen, 0.3)
    this.trafficLight = true
    this._updateTrafficLight()
  }

  _updateTrafficLight() {
    if (!this.lightRed) return
    this.lightRed.setFillStyle(COLORS.lightRed, this.lightPhase === 'red' ? 1 : 0.2)
    this.lightYellow.setFillStyle(COLORS.lightYellow, this.lightPhase === 'yellow' ? 1 : 0.2)
    this.lightGreen.setFillStyle(COLORS.lightGreen, this.lightPhase === 'green' ? 1 : 0.2)
  }

  _createZebra(x, y) {
    const g = this.add.graphics()
    g.fillStyle(COLORS.zebra, 0.8)
    for (let i = -3; i <= 3; i++) {
      g.fillRect(x - 45, y + i * 8 - 2, 90, 5)
    }
  }

  _createZone(x, y, w, h, color, label) {
    const g = this.add.graphics()
    g.fillStyle(color, 0.2)
    g.fillRect(x - w/2, y - h/2, w, h)
    g.lineStyle(2, color, 0.6)
    g.strokeRect(x - w/2, y - h/2, w, h)
    this.add.text(x, y - h/2 - 12, label, {
      fontFamily: 'Inter, sans-serif', fontSize: '12px', fontStyle: 'bold',
      color: '#' + color.toString(16).padStart(6, '0')
    }).setOrigin(0.5)
  }

  // ── HUD ──
  _createHUD() {
    const hudBg = this.add.rectangle(W/2, 22, W - 16, 36, 0x000000, 0.6)
    hudBg.setScrollFactor(0).setDepth(100)

    this.hudTimer = this.add.text(W/2, 22, '⏱ ' + this.timeLeft + 's', {
      fontFamily: 'Inter, sans-serif', fontSize: '16px', fontStyle: 'bold',
      color: '#ffd54a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

    this.hudIcon = this.add.text(16, 22, this.cfg.icon, {
      fontSize: '18px'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101)

    // Task list on right side
    this.taskTexts = []
    const startY = 70
    this.cfg.tasks.forEach((task, i) => {
      const t = this.add.text(W - 16, startY + i * 22, '○ ' + task.text, {
        fontFamily: 'Inter, sans-serif', fontSize: '11px',
        color: '#aaaaaa', align: 'right',
        wordWrap: { width: 180 }
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(101)
      this.taskTexts.push({ text: t, task })
    })

    // Controls hint
    this.add.text(W/2, H - 20, '↑/SPACE = Accelerate  ↓ = Brake  H = Honk  I = Indicator', {
      fontFamily: 'Inter, sans-serif', fontSize: '10px',
      color: '#888888'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
  }

  _updateTaskHUD() {
    this.taskTexts.forEach(({ text, task }) => {
      const done = this.taskState[task.id]
      text.setText((done ? '✅ ' : '○ ') + task.text)
      text.setColor(done ? '#34d399' : '#aaaaaa')
    })
  }

  // ── END GAME ──
  _endGame(won, msg) {
    if (this.gameOver) return
    this.gameOver = true

    const stars = won ? (this.violations === 0 ? 3 : this.timeLeft > this.cfg.timeLimit * 0.3 ? 2 : 1) : 0

    // Save progress
    this._saveProgress(stars)

    // Transition to results
    this.time.delayedCall(500, () => {
      this.scene.start('Result', {
        scenarioId: this.cfg.id,
        won, msg, stars,
        violations: this.violations,
        timeUsed: this.cfg.timeLimit - this.timeLeft,
        tasks: this.cfg.tasks.map(t => ({ ...t, done: this.taskState[t.id] }))
      })
    })
  }

  _saveProgress(stars) {
    try {
      const s = JSON.parse(localStorage.getItem('mth4') || '{}')
      if (!s.scenario2d) s.scenario2d = {}
      const key = `s${this.cfg.id}`
      const prev = s.scenario2d[`${key}_done`]
      s.scenario2d[`${key}_done`] = true
      s.scenario2d[`${key}_stars`] = Math.max(stars, s.scenario2d[`${key}_stars`] || 0)
      if (!prev) s.scenario2d.total = (s.scenario2d.total || 0) + 1
      localStorage.setItem('mth4', JSON.stringify(s))
      if (typeof S !== 'undefined') {
        if (!S.scenario2d) S.scenario2d = {}
        S.scenario2d[`${key}_done`] = true
        S.scenario2d[`${key}_stars`] = s.scenario2d[`${key}_stars`]
        S.scenario2d.total = s.scenario2d.total
        if (typeof save === 'function') save()
      } else if (window.supabaseClient && window.colUser) {
        window.supabaseClient.auth.updateUser({ data: { progress: s } }).catch(() => {})
      }
    } catch (e) {}
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 4: Result — score screen
// ═══════════════════════════════════════════════════════════════════
class ResultScene extends Phaser.Scene {
  constructor() { super('Result') }

  init(data) {
    this.scenarioId = data.scenarioId
    this.won = data.won
    this.msg = data.msg
    this.stars = data.stars
    this.violations = data.violations
    this.timeUsed = data.timeUsed
    this.tasks = data.tasks
    this.cfg = SCENARIOS.find(s => s.id === this.scenarioId) || SCENARIOS[0]
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a1a)

    const cx = W / 2

    // Result header
    const emoji = this.won ? '🎉' : '💥'
    this.add.text(cx, 80, emoji, { fontSize: '48px' }).setOrigin(0.5)
    this.add.text(cx, 130, this.won ? 'Scenario Complete!' : 'Failed!', {
      fontFamily: 'Inter, sans-serif', fontSize: '26px', fontStyle: 'bold',
      color: this.won ? '#34d399' : '#ef4444'
    }).setOrigin(0.5)

    this.add.text(cx, 165, this.msg, {
      fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#888888'
    }).setOrigin(0.5)

    // Stars
    const starY = 210
    for (let i = 0; i < 3; i++) {
      const filled = i < this.stars
      this.add.text(cx - 40 + i * 40, starY, filled ? '⭐' : '☆', {
        fontSize: '32px'
      }).setOrigin(0.5)
      if (filled) {
        this.tweens.add({
          targets: this.children.list[this.children.list.length - 1],
          scale: { from: 0, to: 1 }, duration: 300,
          delay: i * 200, ease: 'Back.easeOut'
        })
      }
    }

    // Stats
    const statsY = 270
    this.add.text(cx, statsY, `${this.cfg.icon} ${this.cfg.name}`, {
      fontFamily: 'Inter, sans-serif', fontSize: '18px', fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(cx, statsY + 30, `Time: ${this.timeUsed}s / ${this.cfg.timeLimit}s`, {
      fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#aaaacc'
    }).setOrigin(0.5)

    this.add.text(cx, statsY + 52, `Violations: ${this.violations}`, {
      fontFamily: 'Inter, sans-serif', fontSize: '14px',
      color: this.violations > 0 ? '#ef4444' : '#34d399'
    }).setOrigin(0.5)

    // Task breakdown
    const taskY = statsY + 90
    this.add.text(cx, taskY, '— Tasks —', {
      fontFamily: 'Inter, sans-serif', fontSize: '13px', fontStyle: 'bold',
      color: '#ffd54a'
    }).setOrigin(0.5)

    this.tasks.forEach((task, i) => {
      const icon = task.done ? '✅' : '❌'
      this.add.text(cx, taskY + 24 + i * 22, `${icon} ${task.text}`, {
        fontFamily: 'Inter, sans-serif', fontSize: '12px',
        color: task.done ? '#34d399' : '#ef4444'
      }).setOrigin(0.5)
    })

    // Law reference
    const lawY = taskY + 24 + this.tasks.length * 22 + 16
    this.add.text(cx, lawY, '⚖️ ' + this.cfg.law, {
      fontFamily: 'Inter, sans-serif', fontSize: '11px',
      color: '#ffd54a', wordWrap: { width: W - 40 }, align: 'center'
    }).setOrigin(0.5)

    // Buttons
    const btnY = H - 100

    // Retry button
    const retryBg = this.add.rectangle(cx - 80, btnY, 130, 44, 0x1a1a2e, 0.9)
    retryBg.setStrokeStyle(2, 0xffd54a)
    retryBg.setInteractive({ useHandCursor: true })
    this.add.text(cx - 80, btnY, '🔄 Retry', {
      fontFamily: 'Inter, sans-serif', fontSize: '15px', fontStyle: 'bold',
      color: '#ffd54a'
    }).setOrigin(0.5)
    retryBg.on('pointerdown', () => {
      this.scene.start('Game', { scenarioId: this.scenarioId })
    })

    // Menu button
    const menuBg = this.add.rectangle(cx + 80, btnY, 130, 44, 0x1a1a2e, 0.9)
    menuBg.setStrokeStyle(2, 0x5ed4f5)
    menuBg.setInteractive({ useHandCursor: true })
    this.add.text(cx + 80, btnY, '📋 Menu', {
      fontFamily: 'Inter, sans-serif', fontSize: '15px', fontStyle: 'bold',
      color: '#5ed4f5'
    }).setOrigin(0.5)
    menuBg.on('pointerdown', () => {
      if (window.ui && window.ui._cur2D) {
        window.ui.exit2D()
      } else {
        this.scene.start('Menu')
      }
    })

    // Next scenario button (only if won and not last)
    if (this.won && this.scenarioId < SCENARIOS.length) {
      const nextBg = this.add.rectangle(cx, btnY + 54, 180, 44, 0x2ecc71, 0.9)
      nextBg.setStrokeStyle(2, 0x2ecc71)
      nextBg.setInteractive({ useHandCursor: true })
      this.add.text(cx, btnY + 54, '➡️ Next Scenario', {
        fontFamily: 'Inter, sans-serif', fontSize: '15px', fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5)
      nextBg.on('pointerdown', () => {
        this.scene.start('Game', { scenarioId: this.scenarioId + 1 })
      })
    }

    // Continue into the real 3D driving test for this level, when this practice run was
    // reached via a specific level's quiz (not generic scenario browsing) and was won.
    // Previously the 2D practice and the actual 3D level were two completely disconnected
    // experiences — passing practice just returned to the level list with no path into the
    // real drive from here.
    if (this.won && window.ui && window.ui.cur && window.ui._cur2D) {
      const driveBg = this.add.rectangle(cx, btnY + (this.scenarioId < SCENARIOS.length ? 108 : 54), 220, 44, 0xd97706, 0.95)
      driveBg.setStrokeStyle(2, 0xd97706)
      driveBg.setInteractive({ useHandCursor: true })
      this.add.text(cx, btnY + (this.scenarioId < SCENARIOS.length ? 108 : 54), '🚗 Start Driving Test', {
        fontFamily: 'Inter, sans-serif', fontSize: '15px', fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5)
      driveBg.on('pointerdown', () => {
        const lv = window.ui.cur
        const mode = window.ui.curMode || (lv.modes ? lv.modes[0] : 'car')
        localStorage.setItem('traffic_lv', lv.id)
        localStorage.setItem('traffic_mode', mode)
        window.location.href = `Driving.html?lv=${lv.id}&mode=${mode}`
      })
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 2D DEMO MODE - Shows correct behavior before playing
// ═══════════════════════════════════════════════════════════════════

// Show a demo of the level - auto-plays with perfect behavior
function showScenario2DDemo(scenarioId, onComplete) {
  const cfg = SCENARIOS.find(s => s.id === scenarioId);
  if (!cfg) { if (onComplete) onComplete(); return; }

  const container = document.getElementById('scenario2d-container');
  if (!container) { if (onComplete) onComplete(); return; }

  // Create demo overlay
  const overlay = document.createElement('div');
  overlay.id = 's2d-demo-overlay';
  overlay.innerHTML = `
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:100;color:white;font-family:Inter,sans-serif;">
      <div style="font-size:48px;margin-bottom:16px;">${cfg.icon}</div>
      <div style="font-size:24px;font-weight:bold;margin-bottom:8px;">${cfg.name}</div>
      <div style="font-size:14px;color:#aaa;margin-bottom:24px;max-width:300px;text-align:center;">${cfg.desc}</div>
      <div style="font-size:18px;color:#ffd54a;margin-bottom:24px;">🎬 Watching Demo...</div>
      <div id="demo-status" style="font-size:13px;color:#888;">Preparing demonstration...</div>
    </div>
  `;
  container.appendChild(overlay);

  // Start a simpler Phaser game for demo
  const demo = new Phaser.Game({
    type: Phaser.AUTO,
    width: W,
    height: H,
    parent: container,
    backgroundColor: '#4a7c59',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: false },
    scene: [DemoScene]
  });

  // Store for cleanup
  window._demoGame = demo;
  window._demoOverlay = overlay;
  window._demoOnComplete = onComplete;
}

// Demo scene that auto-plays the scenario
class DemoScene extends Phaser.Scene {
  constructor() { super('Demo'); }

  init() {
    this.scenarioId = window._s2d_pendingId || 1;
    this.cfg = SCENARIOS.find(s => s.id === this.scenarioId) || SCENARIOS[0];
    this.stepIndex = 0;
    this.stepTimer = 0;
    this.demoComplete = false;
  }

  create() {
    const c = this.cfg;
    const isNight = c.road && c.road.night;
    this.cameras.main.setBackgroundColor(isNight ? COLORS.nightBg : COLORS.bg);

    // Draw road
    const roadLanes = c.road.lanes;
    const roadW = roadLanes * ROAD_LW;
    const roadX = (W - roadW) / 2;
    const roadG = this.add.graphics();
    roadG.fillStyle(isNight ? COLORS.nightRoad : COLORS.road, 1);
    roadG.fillRect(roadX, 0, roadW, c.road.length);

    // Lane markings
    for (let i = 1; i < roadLanes; i++) {
      const lx = roadX + i * ROAD_LW;
      roadG.lineStyle(2, COLORS.roadLine, 0.5);
      for (let y = 0; y < c.road.length; y += 30) {
        roadG.lineBetween(lx, y, lx, y + 15);
      }
    }
    roadG.lineStyle(3, COLORS.roadEdge, 0.8);
    roadG.lineBetween(roadX, 0, roadX, c.road.length);
    roadG.lineBetween(roadX + roadW, 0, roadX + roadW, c.road.length);

    // Create player car
    const playerX = laneX(roadLanes > 1 ? 1 : 0, roadLanes);
    const playerY = c.road.length - 100;
    this.player = this.add.image(playerX, playerY, 'player');
    this.player.setDisplaySize(PLAYER_W, PLAYER_H);

    // Camera
    this.cameras.main.setBounds(0, 0, W, c.road.length);
    this.cameras.main.startFollow(this.player, true, 1, 0.1);
    this.cameras.main.setFollowOffset(-W/2, H/2 - 100);

    // Update status
    this.updateStatus('Starting demonstration...');

    // Demo steps - simulate correct behavior
    this.demoSteps = [
      { text: 'Waiting for signal...', delay: 2000, action: 'wait' },
      { text: 'Green light! Moving carefully...', delay: 1500, action: 'go' },
      { text: 'Checking for pedestrians...', delay: 1000, action: 'check' },
      { text: 'All clear - proceeding!', delay: 1500, action: 'proceed' },
      { text: 'Approaching destination...', delay: 2000, action: 'finish' },
    ];
  }

  update(time, delta) {
    if (this.demoComplete) return;

    this.stepTimer += delta;

    const step = this.demoSteps[this.stepIndex];
    if (!step) {
      this.completeDemo();
      return;
    }

    if (this.stepTimer >= step.delay) {
      // Execute step action
      if (step.action === 'go') {
        this.player.y -= 0.5;
      } else if (step.action === 'proceed') {
        this.player.y -= 1;
      } else if (step.action === 'finish') {
        this.player.y -= 0.8;
      }

      this.updateStatus(step.text);
      this.stepTimer = 0;
      this.stepIndex++;

      if (this.stepIndex >= this.demoSteps.length) {
        this.completeDemo();
      }
    }
  }

  updateStatus(text) {
    const el = document.getElementById('demo-status');
    if (el) el.textContent = text;
  }

  completeDemo() {
    if (this.demoComplete) return;
    this.demoComplete = true;

    // Show "Your Turn" button
    const overlay = document.getElementById('s2d-demo-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:100;">
          <div style="font-size:48px;margin-bottom:16px;">🎉</div>
          <div style="font-size:20px;color:#34d399;margin-bottom:16px;">Demo Complete!</div>
          <div style="font-size:14px;color:#888;margin-bottom:24px;">Now you try it!</div>
          <button id="try-s2d-btn" style="padding:16px 32px;font-size:18px;background:#ffd54a;border:none;border-radius:8px;cursor:pointer;font-weight:bold;color:#000;">
            ▶️ Play Now
          </button>
        </div>
      `;
      document.getElementById('try-s2d-btn').onclick = () => {
        this.startRealGame();
      };
    }
  }

  startRealGame() {
    // Clean up demo and start real game
    if (window._demoGame) {
      window._demoGame.destroy(true);
      window._demoGame = null;
    }
    const overlay = document.getElementById('s2d-demo-overlay');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);

    // Initialize the actual 2D game
    initScenario2D('scenario2d-container', this.scenarioId);

    // Callback
    if (window._demoOnComplete) window._demoOnComplete();
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHASER GAME INSTANCE
// ═══════════════════════════════════════════════════════════════════
window._scenario2dGame = null
window._s2d_pendingId = null

function initScenario2D(containerId, startId) {
  if (window._scenario2dGame) {
    window._scenario2dGame.destroy(true)
    window._scenario2dGame = null
  }
  // If a specific scenario is requested, skip the menu
  window._s2d_pendingId = startId || null

  const container = document.getElementById(containerId)
  if (!container) return

  window._scenario2dGame = new Phaser.Game({
    type: Phaser.AUTO,
    width: W,
    height: H,
    parent: containerId,
    backgroundColor: '#4a7c59',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: { default: false },
    scene: [BootScene, MenuScene, GameScene, ResultScene]
  })
}

function destroyScenario2D() {
  if (window._scenario2dGame) {
    window._scenario2dGame.destroy(true)
    window._scenario2dGame = null
  }
}
