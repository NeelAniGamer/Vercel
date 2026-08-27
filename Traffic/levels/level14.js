window.LVS = window.LVS || []
window.LVS.push({
  id: 14,
  icon: '🚲',
  name: 'Lesson 14 - Cycle Track',
  modes: ['pedestrian', 'car', 'bike'],
  col: '#27ae60',
  ds: 'It is evening on Carter Road. A 2-metre green cycle track runs alongside the road. Delivery cyclists, fitness riders and kids use it daily. Cars are parking over bollards — clear them and keep the track safe.',
  hps: [
    'Cycle tracks are for cyclists only — never park or drive on them.',
    'Give cyclists at least 1 metre of space when passing.',
    'Issue challans to any vehicle parked on the cycle track.'
  ],
  law: {
    sec: 'MV Act Section 177',
    fine: '₹1000',
    off: 'Obstruction of Cycle Track',
    secHi: 'मोटर वाहन अधिनियम धारा 177',
    fineHi: '₹1000',
    offHi: 'साइकिल ट्रैक में बाधा'
  },
  theory:
    '<h2>Cycle Track Respect</h2><p>Carter Road pe ek 2-metre green cycle track hai — bollards se road se alag. Delivery boys, fitness riders, aur bachche sab use karte hain. Lekin cars "bas 5 minute ke liye" park kar deti hain — aur cyclists sadak pe aa jaate hain!</p><p>Aaj tumhara kaam hai track clear karna, challans dena, aur kids ke cycling group ko safely guide karna.</p><h3>🚲 Kya karna hai?</h3><ul><li>Track pe khadi gaadi ko hatao — challan kato!</li><li>Cyclists ko main road pe aane se rok do.</li><li>Kids ke group ke saath chalo jaab tak woh safe hain.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>MV Act Section 177 — cycle track pe parking: ₹1,000 fine. Repeat offenders: towing + 2x fine.</p>',
  pract: 'Patrol the cycle track, clear parked vehicles, and escort the kids cycling group safely to the end.',
  mode: 'practical',
  themeType: 'cycle_track',
  scenarioType: 'patrol',
  npcDensity: 'moderate',
  isNight: false,
  sky: 0x87ceeb,
  fog: 600,
  amb: 0.88,
  isBridge: false,
  ground: 0x3a6b30,
  startOutside: false,
  hasCycleTrack: true,
  maxCrossingPeds: 3,
  pedCrossingInterval: 9.0,
  tasks: [
    { id: 'clear_parked_car_1', text: 'Clear parked car blocking cycle track (1/4)', type: 'interact', target: 'parked_car', done: false },
    { id: 'clear_parked_car_2', text: 'Clear parked car blocking cycle track (2/4)', type: 'interact', target: 'parked_car', done: false },
    { id: 'clear_parked_car_3', text: 'Clear parked car blocking cycle track (3/4)', type: 'interact', target: 'parked_car', done: false },
    { id: 'clear_parked_car_4', text: 'Issue 4th challan for track parking (4/4)', type: 'interact', target: 'parked_car', done: false },
    { id: 'escort_cyclists', text: 'Guide kids cycling group safely (6 cyclists)', type: 'escort', target: 'cyclists', done: false },
    { id: 'zero_road_cyclists', text: 'Keep all cyclists on track — none on main road', type: 'avoid', target: 'cyclist_road', done: false }
  ],
  assets: ['suburban', 'industrial']
})

