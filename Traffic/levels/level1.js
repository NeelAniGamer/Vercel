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
  // Spawn in the front driveway facing the garage, with the player's car in full view.
  // The old (-76.5, -128) sat behind the garage back wall (x=-72.75) facing a blank wall.
  // (-64.0, -128) sits in the open driveway 5.5m from the car, facing west directly into the garage.
  playerSpawn: { x: -64.0, z: -128, rotY: -Math.PI / 2 },
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
    { type: 'taxi', color: 0xffcc00, profileKey: 'impatient_taxi', route: [{ x: 4, z: -140 }, { x: 4, z: -70 }, { x: 4, z: 40 }] },
    // Negative example: a reckless biker who WILL jump the red light in front of you. Do NOT follow him.
    // F2 RIVAL: "Aarush" runs your whole corridor — jump-free clean driving can still catch him. +500 if you finish first.
    { type: 'bike', color: 0xcc0000, profileKey: 'reckless_bike', rival: true, name: 'Aarush', route: [{ x: -56, z: -140 }, { x: -52, z: -100 }, { x: -4, z: -60 }, { x: -4, z: 20 }, { x: -4, z: 60 }, { x: 30, z: 100 }] }
  ],
  // ── Story Mode cast ──────────────────────────────────────────────────────
  // NONE. The film for this lesson (MUMBAI 4000, "The White Line") is staged on
  // its own map in story/stage.js, and its cast lives in story/campaign.js —
  // blocking is direction, which is narrative, not syllabus.
  //
  // Nothing in this file's `cast` was ever read by the playable build: cutscene.js
  // prefers story/campaign.js and only falls back to the level for older entries
  // that predate the split. So keeping a copy here would be a second, silently
  // divergent list of the same actors.
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
  // Lesson junction only: the Linking Road x Signal Junction signal is what
  // this lesson teaches. The Colony Cross Lane and Bazaar Road crossings stay
  // unsignalized so traffic flows and NPCs queue only where the player must.
  signalizedJunctions: [[0, 0]],
  route: [
    { x: -58, z: -128, desc: 'Back out of the Sharma Niwas garage onto Shanti Galli' },
    { x: -52, z: -100, desc: 'Follow Shanti Galli to Colony Cross Lane' },
    { x: 4, z: -96.5, desc: 'Turn left onto Linking Road and keep to the left lane' },

    // ── FROM HERE THE ROUTE IS THE FILM'S GEOGRAPHY ──────────────────────
    // The next legs were previously at x=-20 and x=-4 — the NORTHBOUND carriageway.
    // That is the wrong side of this level's own signal.
    //
    // The signal head stands at (11.4, -16.5): the EAST kerb, mast arm reaching west
    // over the +x half. Under left-hand traffic, heading +z, your left is +x — so +x
    // IS southbound, and the -x lanes are served by the far kerb's signal, not this
    // one. Routing the player at x=-4 meant they queued at a junction under a signal
    // that was not governing them, which is why "wait at the red light" could never be
    // satisfied honestly.
    //
    // x=+4 is also exactly where the film already is: SI Vikram at (4.0, -12.5), the
    // Fortuner at (6.4, -12.5), the escape running z=-12.5 to +95, and the zebra at
    // z=-8. The player now drives through the spot the film puts the shooting, on the
    // carriageway it happens on, past the same crossing.
    { x: 4, z: -30, desc: 'Close on the stop line — a constable is already standing on it' },
    { x: 4, z: -14, desc: 'Stop behind the white line — Ansh is honking, do NOT jump the red signal' },
    { x: 4, z: 20, desc: 'GREEN! Cross the junction cleanly past the zebra' },
    { x: 4, z: 60, desc: 'Bazaar stretch — potholes + double-parked tempo, stay left' },
    { x: 20, z: 96.5, desc: 'Turn left into Bazaar Road' },
    { x: 40, z: 100, desc: '🏁 Park outside Sharma General Stores — deliver Papa\u2019s dabba to Mrs. Iyer before 1 PM' }
  ],

  plots: [
    // Sharma Niwas — home. Moved west from x=-83 to open a 7.5m front yard:
    // at -83 the house's east face (x=-75.5) left only a 2.5m slot against the
    // garage back wall (x=-73.0) — narrower than the 3m a 1.5m-radius player
    // needs, so no valid spawn existed anywhere in that gap.
    { kind: 'house', id: 'home', x: -88, z: -128, rotY: Math.PI / 2, w: 14, d: 12, color: 0xf5e6d3,
      // Detailed story set: verandah + first-floor balcony (so "Mummy (Balcony)"
      // is an actual place), compound wall + gate, front garden, and a furnished
      // interior. Built by cinematics.js — see Cinematics.buildHouse().
      houseSet: { verandah: true, balcony: true, compound: true, garden: true, interior: true } },
    // Home garage — you spawn on foot at the porch, car parked inside
    { kind: 'garage', x: -69.5, z: -128, rotY: 0, w: 6.5, d: 8, color: 0xe2e8f0 },
    // Bazaar market row (north side, facing the road)
    { kind: 'shop', x: -20, z: 112, rotY: Math.PI, w: 12, d: 9, color: 0xe8b4a0, awning: 0x166534, text: 'Veg Market', sub: 'Fresh Daily' },
    { kind: 'shop', x: 0, z: 112, rotY: Math.PI, w: 12, d: 9, color: 0xf0d878, awning: 0x9a3412, text: 'Ganesh Bakery', sub: 'Since 1987' },
    { kind: 'shop', x: 20, z: 112, rotY: Math.PI, w: 12, d: 9, color: 0xb8c8d8, awning: 0x1e40af, text: 'Sai Medical', sub: 'Open 24 Hours' },
    // Sharma General Stores — the dabba destination. Faces Bazaar Road from the
    // north row like the rest of the market (was ON the road at z=100).
    { kind: 'shop', x: 64, z: 114, rotY: Math.PI, w: 14, d: 10, color: 0xf5e6d3, awning: 0x166534, text: 'Sharma General Stores', sub: 'Dabba Delivery Point' },
    // Linking Road Junction Corner Plots & Blocks (synchronized with prologue stage)
    // North-west corner: apartment tower
    { kind: 'apartment', x: -34, z: -24, rotY: 0, w: 20, d: 16, h: 26, color: 0x8f9aa8 },
    // North-east: mirrored apartment tower
    { kind: 'apartment', x: 34, z: -24, rotY: 0, w: 20, d: 16, h: 28, color: 0x7d8896 },
    // South-east city block: complete Basketball Sports Complex
    { kind: 'court', x: 42, z: 36, rotY: 0, w: 20, d: 18 },
    // South-west city block: organized Parking Lot with stalls & parked cars
    { kind: 'parking', x: -42, z: 36, rotY: 0, w: 20, d: 18 },
    // Mid-block shops facing avenues
    { kind: 'shop', x: -34, z: -72, rotY: 0, w: 18, d: 12, h: 6, color: 0xf5e6d3, text: 'Sharma Stores', sub: 'General Merchant' },
    { kind: 'shop', x: 34, z: -72, rotY: 0, w: 18, d: 12, h: 7, color: 0xe0f2fe, text: 'City Clinic', sub: 'Emergency Care' },
    // Bazaar corridor infill: the z=40..100 frontage was empty grass. Shops face
    // Linking Road; clear of the court (x 21..47, z 27..45) and parking plots.
    { kind: 'shop', x: 30, z: 64, rotY: -Math.PI / 2, w: 12, d: 9, color: 0xfde68a, awning: 0x9a3412, text: 'Gupta Sweets', sub: 'Pure Ghee' },
    { kind: 'shop', x: -30, z: 64, rotY: Math.PI / 2, w: 12, d: 9, color: 0xbbf7d0, awning: 0x166534, text: 'Fresh Vegetable Mart', sub: 'Farm Daily' },
    // Colony houses along Shanti Galli + Market Galli (infill fills the gaps)
    { kind: 'house', x: -78, z: -60, rotY: Math.PI / 2, w: 12, d: 10, color: 0xe8d5b7 },
    { kind: 'house', x: -78, z: 20, rotY: Math.PI / 2, w: 12, d: 10, color: 0xd4b896 },
    { kind: 'house', x: 78, z: -40, rotY: -Math.PI / 2, w: 12, d: 10, color: 0xf0d878 },
    { kind: 'house', x: 78, z: 40, rotY: -Math.PI / 2, w: 12, d: 10, color: 0xa8c8a8 },
    { kind: 'house', x: -78, z: 64, rotY: Math.PI / 2, w: 12, d: 10, color: 0xf5e6d3 },
    { kind: 'house', x: 78, z: 72, rotY: -Math.PI / 2, w: 12, d: 10, color: 0xe0f2fe }
  ],
  roadProblems: [
    { kind: 'potholes', x: -4, z: 62, count: 7, spread: 10 },
    { kind: 'barricade', x: -32, z: -100, rotY: 0 },
    { kind: 'parked_truck', x: 6, z: 58, rotY: 0 },
    { kind: 'puddle', x: -58, z: -112, r: 4 },
    // Map dressing: junction zebra, home + shop boards, lamp posts
    // Junction zebra spans the full 20 m arterial it crosses (was 14 m).
    { kind: 'zebra', x: 0, z: -8, w: 20, rotY: 0 },
    // Shanti Galli board. Moved north to z=-102: at z=-118 it sat directly on
    // the sight-line of the prologue's house-front shot and covered the lower
    // third of frame with the back of its own canvas.
    { kind: 'signboard', x: -72, z: -102, rotY: Math.PI / 2, text: 'Shanti Galli', sub: 'Sharma Niwas • Lane 2' },
    // Off the carriageway (was ON Bazaar Road at z=100).
    { kind: 'signboard', x: 52, z: 110, rotY: 0, text: 'Sharma General Stores', sub: 'Dabba Delivery Point' },
    { kind: 'signboard', x: 12, z: 32, rotY: 0, text: 'Linking Road', sub: 'Andheri West' },
    { kind: 'streetlight', x: -8, z: -40, rotY: 0 },
    { kind: 'streetlight', x: 8, z: 20, rotY: Math.PI },
    { kind: 'streetlight', x: -8, z: 80, rotY: 0 },
    // Corridor lighting: the bazaar stretch was dark between z=40..100.
    { kind: 'streetlight', x: 12, z: 40, rotY: 0 },
    { kind: 'streetlight', x: -12, z: 70, rotY: Math.PI },
    { kind: 'streetlight', x: 12, z: 96, rotY: 0 }
  ],
  story: {
    title: 'The White Line',
    // The film lives in story/campaign.js and is staged on its own map in
    // story/stage.js. This is the playable half: same junction, same syllabus,
    // six hours later, with a different reason to obey the light.
    briefing: 'Six hours after Vikram Sawant was shot at this signal, his partner Insp. Arjun Kadam parks the jeep he is not supposed to be driving and opens the notebook Vikram kept. Entry one: Mrs. Iyer, Shanti Galli, ten-fifteen, temple. She sees everything. Your mission today is simpler and stricter: carry Papa\u2019s dabba from Shanti Galli to Sharma General Stores before 1 PM, and obey every light on the way — because the last man who did not is lying under the junction.',
    storyBeat: 'Vikram ka notebook. Pehla entry: Mrs. Iyer, Shanti Galli, 10:15, mandir. Usne likha tha — "Sab kuch dekhti hai." Tum uss signal par khel rahe ho jahaan Vikram mar gaya. Sab rules abhi bhi wahi hain. Bas wajah badal gayi hai.',
    dialogue: [
      // ── FILM DIALOGUE (Prologue) ─────────────────────────────────────────
      // Subtitles reused verbatim in story/campaign.js for L1 prologue shots.
      // These are film-only lines that depict the 3:14 AM incident at Linking Road.
      { filmOnly: true, speaker: 'SI Vikram Sawant', line: '"Control Room, SI Sawant. Linking Road junction check. 03:14 hours. Monsoon visibility low. Holding the white line."' },
      { filmOnly: true, speaker: 'Fortuner Escort Driver', line: '"Aye Hawaldar. VIP movement hai. Side hatt, signal todne de."' },
      { filmOnly: true, speaker: 'SI Vikram Sawant', line: '"Sir, CM ka kaafila bhi ho toh red light red hoti hai. Gaadi white line ke peeche lijiye."' },
      { filmOnly: true, speaker: 'Fortuner Escort Driver', line: '"Tujhe nahi pata andar kaun baitha hai. Yeh aakhri warning hai."' },
      { filmOnly: true, speaker: 'Shadowed VIP Passenger', line: '"Isko hatao yahan se."' },
      { filmOnly: true, speaker: 'Mumbai Police Radio', line: '"All units, 10-33 on Linking Road! Officer down! Black Fortuner fled south towards Shanti Galli!"' },
      { filmOnly: true, speaker: 'Mummy (Balcony)', line: '"Kabir! Papa forgot his lunch dabba on the counter! Take the car and deliver it to Mrs. Iyer at Linking Road!"' },

      // ── BEAT (mid-level, present tense) ─────────────────────────────────
      { triggerZ: -8, speaker: 'Insp. Arjun Kadam', line: '"Entry one. Mrs. Iyer. She sees everything."' },
      { triggerZ: 20, speaker: 'Insp. Arjun Kadam', line: '"Red light karna, sir. Yahi toh sikhaya tha unhone."' },
      // The hook, second half. Arjun reads the next entry and finds his own front
      // door on it, which is the last line of the film and the reason Lesson 2
      // is not just a parking lesson. Plays only inside the cliffhanger cutscene.
      // Spread across the final approach so the radio speaks each line in turn.
      { triggerZ: 94, speaker: 'Insp. Arjun Kadam', line: '"Shanti Galli. Mere ghar ke saamne."' },

      // ── IN-PLAY RADIO ───────────────────────────────────────────────────
      // Havildar Desai keeps the lesson running while the player drives: the
      // film's thesis restated as guidance, never as exposition.
      // Radio dispatch and colony guidance as the player begins their route from Shanti Galli
      { triggerZ: -128, speaker: 'Havildar Desai (Radio)', line: '"All units on colony patrol: Linking Road signal junction is monitored. Observe the white line."' },
      { triggerZ: -100, speaker: 'Havildar Desai (Radio)', line: '"Approaching Colony Cross Lane: stay in your lane, signal your turn left onto Linking Road."' },
      // Desai RED fires BEFORE Ansh honks: the setup ("the line is the law")
      // must land before the temptation (the horn).
      { triggerZ: -34, speaker: 'Havildar Desai (Radio)', line: '"All units: Linking Road junction RED. White line ke peeche ruko — ek line hai, koi shortcut nahi."' },
      { triggerZ: -30, speaker: 'Ansh Taxi', line: '"HORN HORN! Arey bhai chalo na! Mera meter down hai! (Ignore him — tumhe challan milega, use nahin!)"' },
      { triggerZ: -4, speaker: 'Aarush', line: '"Heh! Tum signal pe so raho, main race jeet raha hoon! Pakad ke dikhao!"' },
      { triggerZ: 24, speaker: 'Havildar Desai (Radio)', line: '"GREEN! Ab niklo — dheere, lane mein. Bazaar stretch mein tempo double-parked hai, left se niklo."' },
      { triggerZ: 60, speaker: 'Shamika (Kirana Store)', line: '"Arre sambhal ke! Yahan roz tempo khada rehta hai aur gadde (potholes) bhi hain. Left lane pakdo!"' },
      { triggerZ: 96, speaker: 'Mrs. Iyer', line: '"Vikram bhai har roz isi signal par rukta tha. Har roz. Tum bhi ruko."' },
      { triggerZ: 98, speaker: 'Mrs. Iyer', line: '"Maine Fortuner dekha, Arjun. Aur piche baithe aadmi ko bhi."' },
      { triggerZ: 100, speaker: 'Insp. Arjun Kadam', line: '"Kaun tha woh, Mrs. Iyer?!"' },
      { triggerZ: 102, speaker: 'Mrs. Iyer', line: '"Police uniform thi uski. Aur agla entry tumhare notebook mein... Shanti Galli ka hai."' }
    ]
  },
  ds: 'Hop in your parked car with [F] and drive the first entry in Vikram Sawant\u2019s notebook: Mrs. Iyer, Shanti Galli, temple. Hold the white line at Linking Road junction, ignore Ansh the honking taxi, don\u2019t copy the signal-jumping biker, clear the bazaar potholes and the double-parked tempo, and deliver Papa\u2019s dabba to the Sharma General Stores counter before 1 PM.',
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
    '<h2>Red Light Patience</h2><p>12:40 ki dhoop mein Papa ka dabba lekar tum Shanti Galli se nikle ho. Linking Road ke bade signal par lunch-hour jam hai — zebra crossing pe ek family cross kar rahi hai: bachche, parents, sab. Peeche Ansh taxi horn pe horn bajaa raha hai, aur bagal mein ek red-shirt biker red light kaatne ki taiyaari mein hai.</p><p>Solid white line ke peechhe ruk jao jab tak light green na ho aur crossing bilkul clear na ho. Red signal kaatna MV Act Section 119 ke under ₹500 se ₹2000 tak ka fine hai aur license bhi kat sakta hai!</p><p>Yaad rakho — Ansh ki awaaz sunkar ghabrao mat (tumhe challan milega, use nahi!), aur uss biker jaisa bilkul mat bano — woh light kaatega toh Havaldar Desai uska challan tumhare saamne likhenge!</p>',
  pract: 'Exit home, enter your car, wait at the red light. Let all pedestrians cross. Ignore the honking taxi. Do not copy the signal-jumping biker. Dodge potholes, pass the parked tempo, deliver the dabba.',
  mode: 'practical',
  themeType: 'signal_jump',
  tasks: [
    { id: 'exit_home', text: 'Step Out & Enter Your Parked Car [F]', type: 'enter_vehicle', done: false },
    { id: 'reach_signal', text: 'Join The Queue At Linking Road Signal', type: 'reach', target: 'checkpoint_3', done: false },
    { id: 'wait_red', text: 'Wait At The Red Light Behind White Line', type: 'stop', target: 'red_signal', done: false },
    { id: 'let_cross', text: 'Let The Pedestrians Cross Fully', type: 'avoid', target: 'pedestrian', done: false },
    { id: 'ignore_honk', text: 'Do Not Honk Back (Patience)', type: 'avoid', target: 'honk', done: false },
    { id: 'move_green', text: 'Cross The Junction Only On Green', type: 'reach', target: 'green_light', done: false },
    { id: 'dodge_market', text: 'Clear Potholes & Parked Tempo In Bazaar', type: 'reach', target: 'checkpoint_6', done: false },
    { id: 'deliver_dabba', text: 'Park Outside Sharma General Stores', type: 'reach', target: 'finish', done: false }
  ],
  // The `stage_*` and `city_*` groups are the "free city pack" props staged by
  // scripts/stage_assets.py. They are requested HERE rather than in story/stage.js
  // because the asset list is read from the level config: a film can only use a
  // prop that the lesson asked for. That indirection is deliberate — it means
  // Lesson 2 does not pay to download the cones L1's crime scene needs.
  //
  // Each group is optional at runtime. A prop that fails to resolve falls back to
  // the procedural builder in cinematics.js, so this list can grow without the
  // film depending on it being complete.
  assets: ['suburban', 'street_props', 'cars',
    'stage_signals',   // mast signal head, street lighting
    'stage_crime',     // cones, for the aftermath
    'city_street',     // bins, bags, benches, trees, planters
    'parking_detail',  // hydrant + STOP plate
    // Rigged actors for the film cast. cinematics.js builds Vikram, Arjun and
    // Iyer through window._buildHuman, so this one line gives the film's three
    // performers a skeleton and real clips — Walking for the man on the
    // footpath, Idle for the constable at the crossing — instead of the static
    // mini-characters they fell back to before. It also reaches every gameplay
    // pedestrian in the playable map, because _buildHuman is shared.
    //
    // The full group, not char_kaykit_walk: this film needs the aftermath to
    // play a death clip, and that clip only exists in the `general` file.
    'char_kaykit']
})
