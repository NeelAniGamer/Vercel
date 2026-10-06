window.LVS = window.LVS || []
window.LVS.push({
  id: 1,
  icon: '🚥',
  name: 'Lesson 1 - Red Light Patience',
  modes: ['car', 'bike', 'pedestrian'],
  veh: 'car',
  isPedestrian: false,
  startOutside: true,
  hasGarageSpawn: true,
  // Home garage (detailed open-front structure) + porch start
  garageSpawn: { x: -69.5, z: -128, rotY: Math.PI / 2 },
  playerSpawn: { x: -74, z: -124, rotY: Math.PI / 2 },
  col: '#e74c3c',
  speedLimit: 40,
  timeLimit: 300,
  roadLength: 700,
  pillars: ['law', 'mumbai', 'thirty_second_fun', 'respect_time'],
  npcTypes: ['car', 'sedan', 'taxi', 'bike', 'splendor', 'activa', 'auto', 'cycle'],
  npcDensity: 'moderate',
  npcMix: { normal: 45, cautious: 20, impatient_taxi: 15, aggressive: 8, teen: 6, delivery: 6 },
  pedMix: { normal: 35, child: 25, kid_dasher: 12, rusher: 10, cautious: 10, elderly_ped: 8 },
  npcs: [
    // Ansh the taxi driver — queues right behind you at the signal and honks nonstop. Ignore him.
    { type: 'taxi', color: 0xffcc00, profileKey: 'impatient_taxi', route: [{ x: -4, z: -140 }, { x: -4, z: -60 }, { x: -4, z: 40 }] },
    // Negative example: a reckless biker who WILL jump the red light in front of you. Do NOT follow him.
    // F2 RIVAL: "Aarush" runs your whole corridor — jump-free clean driving can still catch him. +500 if you finish first.
    { type: 'bike', color: 0xcc0000, profileKey: 'reckless_bike', rival: true, name: 'Aarush', route: [{ x: -56, z: -140 }, { x: -52, z: -100 }, { x: -4, z: -60 }, { x: -4, z: 20 }, { x: -4, z: 60 }, { x: 30, z: 100 }] }
  ],
  anchorNodes: [
    { x: -80, z: -130, zone: 'Residential' },
    { x: 60, z: -130, zone: 'Residential' },
    { x: -80, z: 0, zone: 'Commercial' },
    { x: 60, z: 0, zone: 'Commercial' },
    { x: -80, z: 100, zone: 'Market' },
    { x: 60, z: 100, zone: 'Market' }
  ],
  roads: [
    // Shanti Galli (home colony road, X = -60)
    { type: 'v', x: -60, z1: -160, z2: 160, lanes: 2, width: 12, speedLimit: 30, roadType: 'local', name: 'Shanti Galli' },
    // Linking Road (4-lane arterial with the big signal, X = 0)
    { type: 'v', x: 0, z1: -160, z2: 160, lanes: 4, width: 20, speedLimit: 40, roadType: 'arterial', name: 'Linking Road' },
    // Market Galli (X = 60)
    { type: 'v', x: 60, z1: -160, z2: 160, lanes: 2, width: 12, speedLimit: 30, roadType: 'local', name: 'Market Galli' },
    // Cross streets
    { type: 'h', z: -100, x1: -100, x2: 100, lanes: 2, width: 12, speedLimit: 30, roadType: 'local', name: 'Colony Cross Lane' },
    { type: 'h', z: 0, x1: -100, x2: 100, lanes: 4, width: 18, speedLimit: 40, roadType: 'arterial', name: 'Signal Junction Road' },
    { type: 'h', z: 100, x1: -100, x2: 100, lanes: 2, width: 12, speedLimit: 30, roadType: 'collector', name: 'Bazaar Road' }
  ],
  route: [
    { x: -58, z: -128, desc: 'Back out of your home garage onto Shanti Galli' },
    { x: -52, z: -100, desc: 'Turn right out of the colony toward Linking Road' },
    { x: -20, z: -96.5, desc: 'Join the queue at the big signal — it is RED' },
    { x: -4, z: -60, desc: 'Wait behind the white stop line — family crossing ahead' },
    { x: -4, z: -8, desc: 'Hold! Ansh the taxi is honking — do NOT jump the signal' },
    { x: -4, z: 20, desc: 'GREEN! Cross the junction cleanly' },
    { x: -4, z: 60, desc: 'Bazaar stretch — potholes + double-parked tempo, stay left' },
    { x: 20, z: 96.5, desc: 'Turn right into Bazaar Road' },
    { x: 40, z: 100, desc: '🏁 Park at Sharma General Stores — deliver Papa\u2019s dabba before 1 PM' }
  ],
  plots: [
    // Sharma Niwas — home (route starts at its gate)
    { kind: 'house', x: -83, z: -128, rotY: Math.PI / 2, w: 14, d: 12, color: 0xf5e6d3 },
    // Home garage — you spawn on foot at the porch, car parked inside
    { kind: 'garage', x: -69.5, z: -128, rotY: 0, w: 6.5, d: 8, color: 0xe2e8f0 },
    // Bazaar market row (north side, facing the road)
    { kind: 'shop', x: -20, z: 112, rotY: Math.PI, w: 12, d: 9, color: 0xe8b4a0, awning: 0x166534, text: 'Veg Market', sub: 'Fresh Daily' },
    { kind: 'shop', x: 0, z: 112, rotY: Math.PI, w: 12, d: 9, color: 0xf0d878, awning: 0x9a3412, text: 'Ganesh Bakery', sub: 'Since 1987' },
    { kind: 'shop', x: 20, z: 112, rotY: Math.PI, w: 12, d: 9, color: 0xb8c8d8, awning: 0x1e40af, text: 'Sai Medical', sub: 'Open 24 Hours' },
    // Sharma General Stores — the dabba destination
    { kind: 'shop', x: 72, z: 100, rotY: -Math.PI / 2, w: 14, d: 10, color: 0xf5e6d3, awning: 0x166534, text: 'Sharma General Stores', sub: 'Dabba Delivery Point' },
    // Junction corner apartments
    { kind: 'apartment', x: -26, z: -26, rotY: 0, w: 16, d: 14, h: 20, color: 0xe8d5b7 },
    { kind: 'apartment', x: 26, z: 26, rotY: 0, w: 16, d: 14, h: 24, color: 0xc9a87a },
    // Colony houses along Shanti Galli + Market Galli
    { kind: 'house', x: -78, z: -60, rotY: Math.PI / 2, w: 12, d: 10, color: 0xe8d5b7 },
    { kind: 'house', x: -78, z: 20, rotY: Math.PI / 2, w: 12, d: 10, color: 0xd4b896 },
    { kind: 'house', x: 78, z: -40, rotY: -Math.PI / 2, w: 12, d: 10, color: 0xf0d878 },
    { kind: 'house', x: 78, z: 40, rotY: -Math.PI / 2, w: 12, d: 10, color: 0xa8c8a8 }
  ],
  roadProblems: [
    { kind: 'potholes', x: -4, z: 62, count: 7, spread: 10 },
    { kind: 'barricade', x: -32, z: -100, rotY: 0 },
    { kind: 'parked_truck', x: 6, z: 58, rotY: 0 },
    { kind: 'puddle', x: -58, z: -112, r: 4 },
    // Map dressing: junction zebra, home + shop boards, lamp posts
    { kind: 'zebra', x: 0, z: -8, w: 14, rotY: 0 },
    { kind: 'signboard', x: -72, z: -118, rotY: Math.PI / 2, text: 'Shanti Galli', sub: 'Sharma Niwas • Lane 2' },
    { kind: 'signboard', x: 52, z: 100, rotY: 0, text: 'Sharma General Stores', sub: 'Dabba Delivery Point' },
    { kind: 'streetlight', x: -8, z: -40, rotY: 0 },
    { kind: 'streetlight', x: 8, z: 20, rotY: Math.PI },
    { kind: 'streetlight', x: -8, z: 80, rotY: 0 }
  ],
  story: {
    title: 'Red Light Patience: The Dabba Run',
    briefing: '12:40 PM. Papa just called from Sharma General Stores in the bazaar — he forgot his lunch dabba and the shop has a rush of customers. You have 20 minutes to drive from Sharma Niwas, survive the big Linking Road signal at lunch hour, and deliver the dabba. A family of four is crossing at the signal, Ansh the taxi driver is honking like crazy behind you, and some biker is about to do something very stupid at the red light.',
    storyBeat: 'Ghar se phone aaya: "Beta, Papa ka dabba reh gaya! Sharma General Stores, bazaar road — 1 baje se pehle pohocha de, dukaan par bheed hai!" Tum Shanti Galli se niklo, Linking Road ke bade signal par ruko, Ansh taxi wale ke horn ko ignore karo, aur uss red-light-kaatne-wale biker jaisa bilkul mat bano!',
    dialogue: [
      { triggerZ: -128, speaker: 'Mummy (Balcony)', line: '"Beta dabba seat par rakh diya hai! Sharma General Stores — bazaar road! 1 baje se pehle! Aur signal mat kaatna!"' },
      { triggerZ: -100, speaker: 'Neighbour Uncle', line: '"Arre Linking Road wala signal lunch time par bahut lamba hota hai. Line mein lag jao, jaldi mat karo!"' },
      { triggerZ: -60, speaker: 'Havaldar Desai (Radio)', line: '"All units: Linking Road junction RED. Zebra par family cross kar rahi hai — chaar log. White line ke peeche ruko!"' },
      { triggerZ: -30, speaker: 'Ansh Taxi', line: '"HORN HORN! Arey bhai chalo na! Mera meter down hai! (Ignore him — tumhe challan milega, use nahin!)"' },
      { triggerZ: -8, speaker: 'Havaldar Desai (Radio)', line: '"Dekho woh Aarush — signal kaatne wala hai! Uska challan pakka. Tum GREEN ka wait karo!"' },
      { triggerZ: -8, speaker: 'Aarush', line: '"Heh! Tum signal pe so raho, main race jeet raha hoon! Pakad ke dikhao!"' },
      { triggerZ: 20, speaker: 'Havaldar Desai (Radio)', line: '"GREEN! Ab niklo — dheere, lane mein. Bazaar stretch mein tempo double-parked hai, left se niklo."' },
      { triggerZ: 20, speaker: 'Aarush', line: '"Arre wah, green mil gaya? Ab dekho kaun pehle bazaar pohochta hai!"' },
      { triggerZ: 60, speaker: 'Shamika (Kirana Store)', line: '"Arre sambhal ke! Yahan roz tempo khada rehta hai aur gadde (potholes) bhi hain. Left lane pakdo!"' },
      { triggerZ: 100, speaker: 'Papa (Shop)', line: '"Shabaash beta! Dabba time par! Aur signal bhi nahi kaata — sacha Traffic Hero!"' }
    ]
  },
  ds: 'Step out of Sharma Niwas, hop in your parked car with [F], and deliver Papa\u2019s lunch dabba to Sharma General Stores before 1 PM. Wait out the red light at Linking Road junction while a family crosses, ignore Ansh the honking taxi, don\u2019t copy the signal-jumping biker, dodge bazaar potholes and the double-parked tempo, and park at the shop.',
  hps: [
    'Step out of the building and press [F] near your parked car to get in.',
    'Stop behind the solid white stop line at signals.',
    'Wait for all pedestrians to fully cross before accelerating.',
    'Ignore impatient honking from NPCs — they will not get a challan, you will.',
    'Never copy a signal-jumping biker — watch his challan, not his speed.',
    'Slow for potholes and give double-parked vehicles a full lane of space.'
  ],
  law: {
    sec: 'MV Act Section 119',
    fine: '₹500 - ₹2000',
    off: 'Jumping a Red Signal',
    secHi: 'मोटर वाहन अधिनियम धारा 119',
    fineHi: '₹500 - ₹2000',
    offHi: 'लाल बत्ती काटना'
  },
  theory:
    '<h2>Red Light Patience</h2><p>12:40 ki dhoop mein Papa ka dabba lekar tum Shanti Galli se nikle ho. Linking Road ke bade signal par lunch-hour jam hai — zebra crossing pe ek family cross kar rahi hai: bachche, parents, sab. Peeche Ansh taxi horn pe horn bajaa raha hai, aur bagal mein ek red-shirt biker red light kaatne ki taiyaari mein hai.</p><p>Solid white line ke peechhe ruk jao jab tak light green na ho aur crossing bilkul clear na ho. Red signal kaatna MV Act Section 119 ke under ₹500 se ₹2000 tak ka fine hai aur license bhi kat sakta hai!</p><p>Yaad rakho — Ansh ki awaaz sunkar ghabrao mat (tumhe challan milega, use nahi!), aur uss biker jaisa bilkul mat bano — uska challan Havaldar Desai pehle hi likh chuke hain!</p>',
  pract: 'Exit home, enter your car, wait at the red light. Let all pedestrians cross. Ignore the honking taxi. Do not copy the signal-jumping biker. Dodge potholes, pass the parked tempo, deliver the dabba.',
  mode: 'practical',
  themeType: 'signal_jump',
  tasks: [
    { id: 'exit_home', text: 'Step out & enter your parked car [F]', type: 'enter_vehicle', done: false },
    { id: 'reach_signal', text: 'Join the queue at Linking Road signal', type: 'reach', target: 'checkpoint_1', done: false },
    { id: 'wait_red', text: 'Wait at the red light behind white line', type: 'stop', target: 'red_signal', done: false },
    { id: 'let_cross', text: 'Let the whole family cross fully', type: 'avoid', target: 'pedestrian', done: false },
    { id: 'ignore_honk', text: 'Do NOT honk back at Ansh (silence = strength)', type: 'avoid', target: 'honk', done: false },
    { id: 'move_green', text: 'Cross only on green', type: 'reach', target: 'green_light', done: false },
    { id: 'dodge_market', text: 'Clear potholes + parked tempo in bazaar', type: 'reach', target: 'checkpoint_2', done: false },
    { id: 'deliver_dabba', text: 'Park at Sharma General Stores & deliver', type: 'reach', target: 'finish', done: false }
  ],
  assets: ['suburban', 'street_props', 'cars']
})
