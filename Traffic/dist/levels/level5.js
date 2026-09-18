window.LVS = window.LVS || []
window.LVS.push({
  id: 5,
  icon: '🏫',
  name: 'Lesson 5 - Operation School Bell: The St. Xavier Dismissal (Parel to School Zone)',
  modes: ['car', 'bike', 'pedestrian'],
  veh: 'car',
  isPedestrian: false,
  startOutside: true,
  hasGarageSpawn: true,
  isSuburbanNeighborhood: true,
  col: '#e74c3c',
  speedLimit: 40,
  schoolSpeedLimit: 20,
  hasSchool: true,
  hasAIDirector: true,
  usesMapLLM: true,
  aiPrompt: 'Suburban corridor ending at St. Xavier High School campus with AI-directed student dismissal swarm, dynamic crossing guard Mr. Shinde with animated STOP signal, silence zone enforcement, and dense households.',
  zebraZ: 540,
  flasherZ: 380,
  busBayZ: 460,
  schoolZ: 600,
  isSilenceZone: true,
  timeLimit: 360,
  roadLength: 1400,
  npcTypes: ['car', 'sedan', 'innova', 'suv', 'taxi', 'bike', 'splendor', 'activa', 'cycle', 'bus', 'truck', 'auto'],
  anchorNodes: [
    { x: -75, z: -230, zone: 'Residential' },
    { x: 110, z: -230, zone: 'Residential' },
    { x: 110, z: -30, zone: 'Commercial' },
    { x: 110, z: 165, zone: 'Park' },
    { x: 330, z: -30, zone: 'Downtown' },
    { x: 330, z: 165, zone: 'Commercial' },
    { x: 330, z: 450, zone: 'School' },
    { x: 520, z: 165, zone: 'Industrial' }
  ],
  roads: [
    // ── Primary Mission Route Corridors (Legs 1 - 5) ──
    // Leg 1: Shanti Niketan Society Colony Road (Z: -340 to -120, X: 0, 220m)
    { type: 'v', x: 0, z1: -340, z2: -120, lanes: 2, width: 14, speedLimit: 40, roadType: 'local', name: 'Shanti Niketan Colony Road' },
    // Leg 2: Tilak Bazar Market Road (Z: -120, X: 0 to 220, 220m)
    { type: 'h', z: -120, x1: 0, x2: 220, lanes: 2, width: 14, speedLimit: 40, roadType: 'collector', name: 'Tilak Bazar Market Road' },
    // Leg 3: Swami Vivekananda Arterial Avenue (X: 220, Z: -120 to 260, 380m)
    { type: 'v', x: 220, z1: -120, z2: 260, lanes: 4, width: 20, speedLimit: 50, roadType: 'arterial', name: 'Swami Vivekananda Arterial Avenue' },
    // Leg 4: Gokhale School Link Road (Z: 260, X: 220 to 440, 220m)
    { type: 'h', z: 260, x1: 220, x2: 440, lanes: 2, width: 14, speedLimit: 30, roadType: 'collector', name: 'Gokhale School Link Road' },
    // Leg 5: St. Xavier School Boulevard & Safety Precinct (X: 440, Z: 260 to 640, 380m)
    { type: 'v', x: 440, z1: 260, z2: 640, lanes: 2, width: 16, speedLimit: 20, roadType: 'school_zone', name: 'St. Xavier School Boulevard' },

    // ── Orthogonal City Grid Extensions (West & East Avenues & Cross Streets) ──
    // Parel West Marg (X = -150, Z: -340 to 640)
    { type: 'v', x: -150, z1: -340, z2: 640, lanes: 2, width: 14, speedLimit: 40, roadType: 'collector', name: 'Parel West Marg' },
    // Shanti Niketan North Marg (X = 0, Z: -120 to 640)
    { type: 'v', x: 0, z1: -120, z2: 640, lanes: 2, width: 14, speedLimit: 40, roadType: 'local', name: 'Parel Central Marg' },
    // SV Avenue South Extension (X = 220, Z: -340 to -120)
    { type: 'v', x: 220, z1: -340, z2: -120, lanes: 4, width: 20, speedLimit: 50, roadType: 'arterial', name: 'SV Avenue South Extension' },
    // SV Avenue North Extension (X = 220, Z: 260 to 640)
    { type: 'v', x: 220, z1: 260, z2: 640, lanes: 4, width: 20, speedLimit: 50, roadType: 'arterial', name: 'SV Avenue North Extension' },
    // Metro Boulevard South Corridor (X = 440, Z: -340 to 260)
    { type: 'v', x: 440, z1: -340, z2: 260, lanes: 2, width: 16, speedLimit: 40, roadType: 'arterial', name: 'Metro Boulevard South' },
    // Eastern Rail Corridor Road (X = 600, Z: -340 to 640)
    { type: 'v', x: 600, z1: -340, z2: 640, lanes: 2, width: 14, speedLimit: 50, roadType: 'collector', name: 'Western Rail Corridor Road' },

    // Cross Streets along Z:
    // South Colony Perimeter Street (Z = -340, X: -150 to 600)
    { type: 'h', z: -340, x1: -150, x2: 600, lanes: 2, width: 14, speedLimit: 40, roadType: 'local', name: 'South Colony Perimeter Street' },
    // Tilak Bazar West Extension (Z = -120, X: -150 to 0)
    { type: 'h', z: -120, x1: -150, x2: 0, lanes: 2, width: 14, speedLimit: 40, roadType: 'collector', name: 'Tilak Bazar West' },
    // Tilak Bazar East Extension (Z = -120, X: 220 to 600)
    { type: 'h', z: -120, x1: 220, x2: 600, lanes: 2, width: 14, speedLimit: 40, roadType: 'collector', name: 'Tilak Bazar East' },
    // Shivaji Midtown Central Link (Z = 70, X: -150 to 600)
    { type: 'h', z: 70, x1: -150, x2: 600, lanes: 2, width: 14, speedLimit: 40, roadType: 'collector', name: 'Shivaji Midtown Link' },
    // Gokhale Link West Extension (Z = 260, X: -150 to 220)
    { type: 'h', z: 260, x1: -150, x2: 220, lanes: 2, width: 14, speedLimit: 30, roadType: 'collector', name: 'Gokhale West Marg' },
    // Gokhale Link East Extension (Z = 260, X: 440 to 600)
    { type: 'h', z: 260, x1: 440, x2: 600, lanes: 2, width: 14, speedLimit: 30, roadType: 'collector', name: 'Gokhale East Marg' },
    // St. Xavier North Perimeter Street (Z = 640, X: -150 to 600)
    { type: 'h', z: 640, x1: -150, x2: 600, lanes: 2, width: 14, speedLimit: 30, roadType: 'collector', name: 'St. Xavier North Road' }
  ],
  ints: [
    [0, -340], [220, -340], [440, -340], [-150, -340], [600, -340],
    [0, -120], [220, -120], [440, -120], [-150, -120], [600, -120],
    [0, 70], [220, 70], [440, 70], [-150, 70], [600, 70],
    [0, 260], [220, 260], [440, 260], [-150, 260], [600, 260],
    [0, 640], [220, 640], [440, 640], [-150, 640], [600, 640]
  ],
  route: [
    { x: 18, z: -300, desc: 'Exit Home Driveway & Garage onto Colony Road' },
    { x: -3.5, z: -250, desc: 'Pass Shanti Niketan Society Gate & Boom Barrier (Left Lane)' },
    { x: -3.5, z: -150, desc: 'Shanti Niketan North End — Prepare for Right Turn into Tilak Bazar' },
    { x: 20, z: -116.5, desc: 'Turn 1: Turn Right onto Tilak Bazar Street (Left Lane)' },
    { x: 80, z: -116.5, desc: 'Pass Mahalaxmi Kirana Stores & Corner Chai Tapri' },
    { x: 160, z: -116.5, desc: 'Pass Red BEST Bus Stop & Auto-Rickshaw Stand' },
    { x: 210, z: -116.5, desc: 'Prepare for Left Turn onto Swami Vivekananda Avenue' },
    { x: 215.0, z: -80, desc: 'Turn 2: Turn Left onto SV 4-Lane Arterial Avenue (Left Lane)' },
    { x: 215.0, z: 60, desc: 'SV Avenue Midtown — Cruise past Highrise CHS Towers' },
    { x: 215.0, z: 220, desc: 'SV Avenue South — Prepare for Right Turn toward School Link' },
    { x: 250, z: 263.5, desc: 'Turn 3: Turn Right onto Gokhale School Link Road (Left Lane)' },
    { x: 380, z: 263.5, desc: 'Gokhale Link — Prepare for Left Turn into School Zone' },
    { x: 436.0, z: 300, desc: 'Turn 4: Turn Left onto St. Xavier School Boulevard (Silence Zone)' },
    { x: 436.0, z: 380, desc: 'Flashing Amber School Beacon — Reduce to 20 km/h Immediately' },
    { x: 436.0, z: 460, desc: 'St. Xavier School Bus Bay — Parked School Buses' },
    { x: 436.0, z: 540, desc: 'St. Xavier Tabletop Zebra Crossing — Yield to Children & Guard' },
    { x: 436.0, z: 610, desc: '🏁 St. Xavier High School Campus Dismissal Gate' }
  ],
  story: {
    title: 'Operation School Bell: The St. Xavier Dismissal',
    briefing: '01:10 PM. St. Xavier High School dismissal is in 20 minutes. Pre-monsoon clouds loom over Mumbai, and hundreds of students will pour onto the street. Start at your residential home, get in your car, drive across Shanti Niketan Colony, navigate the Tilak Bazar corner turn, cruise down Swami Vivekananda Avenue, turn onto Gokhale School Link, enter the designated St. Xavier School Silence Zone, obey Crossing Guard Shinde, and pick up Aryan safely at the campus gates.',
    storyBeat: 'A quiet afternoon turns urgent. Your family radio crackles: "Beta, Aryan ka dismissal 1:30 baje hai! Shanti Niketan society gate se nikal kar Tilak Bazar aur SV Avenue se St. Xavier School jao. Gate pe buses aur bachchon ki bheed hone wali hai. Gaadi nikalo aur safely pohocho!" On the police frequency, Traffic Havaldar Desai alerts: "Suburban corridor alert: Strict 20 km/h and zero honking near St. Xavier campus!"',
    dialogue: [
      { triggerZ: -300, speaker: 'Family Voice', line: '"Aryan ka dismissal time ho gaya hai! Shanti Niketan society gate se nikal kar Tilak Bazar aur SV Avenue se St. Xavier School jao. Gaadi nikalo aur safely chalana!"' },
      { triggerZ: -160, speaker: 'Havaldar Desai (Radio)', line: '"All units: Tilak Bazar corner turn ahead. High pedestrian density near Mahalaxmi Kirana store. Slow down for the right turn!"' },
      { triggerZ: -120, speaker: 'Havaldar Desai (Radio)', line: '"Now in Tilak Bazar Market. Watch for pedestrians and auto-rickshaws near the BEST bus stop."' },
      { triggerZ: -80, speaker: 'Family Voice', line: '"Turn left onto Swami Vivekananda 4-lane Avenue! Maintain lane discipline and watch for oncoming traffic."' },
      { triggerZ: 60, speaker: 'Havaldar Desai (Radio)', line: '"Midtown SV Avenue. Maintain steady 40-50 km/h cruising speed past high-rise societies."' },
      { triggerZ: 220, speaker: 'Havaldar Desai (Radio)', line: '"Attention driver: Right turn ahead into Gokhale School Link Road. Silence Zone begins — ZERO HONKING!"' },
      { triggerZ: 300, speaker: 'Havaldar Desai (Radio)', line: '"Turn left onto St. Xavier School Boulevard! Approaching school dismissal zone — strictly no horn!"' },
      { triggerZ: 380, speaker: 'Havaldar Desai (Radio)', line: '"ATTENTION: St. Xavier High School Zone ahead! Amber flasher is active! Slow down to 20 km/h IMMEDIATELY!"' },
      { triggerZ: 540, speaker: 'Crossing Guard Shinde', line: '"STOP! Gaadi roko! St. Xavier ke bachche tabletop crosswalk cross kar rahe hain! Wait behind the white line!"' },
      { triggerZ: 600, speaker: 'Aryan & Principal', line: '"Bhaiya aap aa gaye! Perfect timing! Thank you for waiting at the crossing!"' },
      { triggerZ: 610, speaker: 'Havaldar Desai', line: '"Shaabash! Multi-district route completed with zero violations. A true Mumbai Traffic Hero!"' }
    ]
  },
  ds: 'Spawn on foot at your residential home, walk to your garage, enter your vehicle with [F], and navigate through Shanti Niketan Colony, the Tilak Bazar corner, Swami Vivekananda Avenue, Gokhale Link, and the St. Xavier School Precinct. Obey residential 40 km/h and arterial 50 km/h limits, decelerate to under 20 km/h at the school warning flasher, yield to crossing school children, and park at the school gate.',
  hps: [
    'Walk across your front yard to the garage and press [F] to enter your vehicle.',
    'Drive past Shanti Niketan CHS gate and boom barrier onto the colony road.',
    'Make a safe 90° right turn at Tilak Bazar corner past Mahalaxmi Kirana store and Chai Tapri.',
    'Turn left onto Swami Vivekananda 4-lane Avenue and maintain lane discipline.',
    'Turn right at Gokhale Link Road and enter the designated School Silence Zone.',
    'When you spot the flashing amber school beacon, reduce speed immediately to under 20 km/h.',
    'Stop completely behind the white stop line when Crossing Guard Shinde raises the STOP sign.',
    'Never honk in a school silence zone (MV Act Sec 194F).'
  ],
  law: {
    sec: 'MV Act Section 183 & 194B',
    fine: '₹1000 - ₹5000',
    off: 'Speeding in School Zone / Failure to Yield to Pedestrians',
    secHi: 'मोटर वाहन अधिनियम धारा 183 व 194B',
    fineHi: '₹1000 - ₹5000',
    offHi: 'स्कूल क्षेत्र में तेज़ गति व पैदल यात्रियों को रास्ता न देना'
  },
  theory:
    '<h2>Operation School Bell: Mumbai Multi-District Navigation</h2><p>Mumbai ki vibhinn sadko (Residential Colony, Bazar Chawls, Arterial Avenues aur School Precincts) par driving conditions dramatic tareeqe se badalti hain. Har zone ki apni speed limit, turning geometry aur pedestrian hazards hote hain.</p><p>St. Xavier High School campus ke paas ek saath 800+ bachche, school buses aur parents jama hote hain. MV Act Section 183 ke mutabiq amber warning beacon dekhte hi 20 km/h se neeche aana zaroori hai, aur Section 194B ke mutabiq zebra crossing par pedestrians ko priority dena mandatory hai.</p><h3>🏫 Mission Objectives & Rules:</h3><ul><li><strong>Driveway & Society Departure:</strong> Board vehicle [F], pass Shanti Niketan CHS gate and boom barrier.</li><li><strong>Tilak Bazar Turn:</strong> Slow down for the 90° right turn at the chawl corner near Mahalaxmi Kirana and Chai Tapri.</li><li><strong>SV Avenue Cruise:</strong> Maintain steady lane discipline on the 4-lane arterial road (max 50 km/h).</li><li><strong>School Zone Deceleration:</strong> Decelerate to 20 km/h at the flashing amber school beacon.</li><li><strong>Tabletop Crosswalk Yield:</strong> Complete stop behind the white line when Crossing Guard Shinde holds up the STOP sign!</li><li><strong>Silence Zone Enforcement:</strong> Horn strictly prohibited within 100 meters of educational institutions.</li></ul>',
  pract: 'Walk to garage, drive through Mumbai neighborhoods to St. Xavier High School, slow to 20 km/h at the school flasher, stop for crossing students at the zebra crossing, and park at the school gate.',
  mode: 'practical',
  themeType: 'pedestrian_courtesy',
  npcDensity: 'moderate',
  tasks: [
    { id: 'enter_veh', text: 'Walk to garage & enter vehicle [F]', type: 'enter_vehicle', done: false },
    { id: 'cruise_5km', text: 'Navigate multi-district Mumbai route', type: 'reach', target: 'checkpoint_1', done: false },
    { id: 'slow_school', text: 'Reduce to 20 km/h at school zone flasher', type: 'avoid', target: 'speed_zone', done: false },
    { id: 'yield_kids', text: 'Yield to crossing school children at zebra', type: 'avoid', target: 'pedestrian', done: false },
    { id: 'reach_school', text: 'Park at St. Xavier High School dismissal gate', type: 'reach', target: 'finish', done: false }
  ],
  assets: ['building_high_school', 'house_lowpoly_isometric', 'house_mansion_lowpoly', 'suburban', 'street_props', 'cars']
})
