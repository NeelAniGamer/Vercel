window.LVS = window.LVS || []
window.LVS.push({
  id: 14,
  icon: '🌙',
  name: 'Lesson 14 - Night Crossing',
  modes: ['car', 'bike', 'pedestrian'],
  col: '#e74c3c',
  ds: 'It is late at night. Visibility is poor. An elderly citizen with a walking stick is slowly crossing at an unmarked crossing point ahead. Pedestrians in dark and reflective clothes are crossing along the route. Drive with headlights on, dip for oncoming traffic (press H), and yield to all crossing pedestrians.',
  hps: [
    'Turn on headlights and dip them (press H) for oncoming traffic to avoid blinding other drivers.',
    'Pedestrians have right of way at both marked zebra crossings and unmarked crossing points.',
    'Reduce speed at night (stay below 40 km/h) — stopping distances double in the dark.'
  ],
  law: {
    sec: 'MV Act Section 128 & 177',
    fine: '₹1000 - ₹3000',
    off: 'Failing to Yield to Pedestrians / High Beam Abuse at Night',
    secHi: 'मोटर वाहन अधिनियम धारा 128 व 177',
    fineHi: '₹1000 - ₹3000',
    offHi: 'रात में पैदल यात्री को रास्ता न देना / हाई बीम का दुरुपयोग'
  },
  theory:
    '<h2>Night Crossing & Headlight Etiquette</h2><p>Raat ko India mein driving karna sabse bada challenge hai. Roads pe lighting kam hoti hai, log dark kapdon mein crossing karte hain, aur tez gaadiyan high beam se aankhein chaundhiye kar deti hain.</p><p>Is lesson mein tumhein:</p><ul><li><b>Headlights On</b> rakhna hai aur oncoming traffic ke aate hi <b>H daba kar Low Beam (Dip)</b> karna hai.</li><li>Aage <b>Z = -50m</b> pe ek buzurg stick le kar cross kar rahe hain — gaadi rok kar unhe poora cross karne do!</li><li>Zebra crossings pe crossing pedestrians ko rasta do.</li><li>Speed 40 km/h se kam rakho.</li></ul>',
  pract: 'Drive carefully through the night streets, manage headlights (press H to dip), and yield to all crossing pedestrians.',
  mode: 'practical',
  themeType: 'pedestrian_courtesy',
  scenarioType: 'mixed',
  npcDensity: 'moderate',
  isNight: true,
  sky: 0x060814,
  fog: 400,
  amb: 0.15,
  ground: 0x142014,
  startOutside: true,
  hasNightCrossing: true,
  hasElderlyCrossing: true,
  elderlyCrossX: 0,
  elderlyCrossZ: -50,
  tasks: [
    { id: 'dip_headlights', text: 'Dip headlights for oncoming traffic (Press H)', type: 'toggle', target: 'headlights', done: false },
    { id: 'yield_elderly', text: 'Stop and yield to elderly citizen crossing at -50m', type: 'stop', target: 'stationary', done: false },
    { id: 'yield_pedestrians', text: 'Yield to pedestrians at zebra crossings', type: 'avoid', target: 'pedestrian_yield', done: false },
    { id: 'no_speed', text: 'Do not exceed 40 km/h speed limit at night', type: 'avoid', target: 'speed_night', done: false }
  ],
  assets: ['suburban', 'industrial']
})

