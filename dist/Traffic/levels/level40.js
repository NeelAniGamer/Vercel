window.LVS = window.LVS || []
window.LVS.push({
  id: 40,
  icon: '🏆',
  name: 'Lesson 40 - Grand Test!',
  modes: ['car', 'bike'],
  col: '#f1c40f',
  ds: 'The ultimate test! Apply everything you\'ve learned from 39 levels. Navigate a complex route with signals, pedestrians, speed limits, lane discipline, and emergency vehicles.',
  hps: ['Apply all traffic rules you\'ve learned so far.', 'Stay calm under pressure — multiple challenges at once.', 'This test covers all Tier 1-3 skills.'],
  law: {
    sec: 'All MV Act Sections',
    fine: '₹500 - ₹5000',
    off: 'Multiple Violations',
    secHi: 'सभी मोटर वाहन अधिनियम धाराएँ',
    fineHi: '₹500 - ₹5000',
    offHi: 'अनेक उल्लंघन'
  },
  theory:
    '<h2>Grand Test!</h2><p>Grand Test ka waqt aa gaya! 39 levels ka sab kuch tumhare saamne hai — signals, pedestrians, speed limits, lane discipline, emergency vehicles — sab ek saath!</p><p>Yeh test tumhari poori driving skill test karega. Sab rules yaad karo — ek ek karke apply karo. Patience aur presence of mind sabse zaroori hai!</p><h3>🏆 Kya karna hai?</h3><ul><li>Sab rules follow karo — red light, speed limit, lane discipline.</li><li>Emergency vehicles ko priority do.</li><li>Pedestrians ko jagah do.</li><li>Signs obey karo — mandatory, cautionary, informational.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Sab MV Act sections applicable hain — violations pe ₹500 se ₹5000 tak ka fine!</p>',
  pract: 'Complete the complex route following all traffic rules. Apply everything from the previous 39 levels. Stay calm and focused.',
  mode: 'practical',
  themeType: 'grand_test',
  scenarioType: 'mixed',
  npcDensity: 'heavy',
  startOutside: true,
  hasSchool: true,
  hasHospital: true,
  hasSilentZone: true,
  isHighway: true,
  hasRain: true,
  isNight: false,
  hasCow: true,
  hasConstruction: true,
  hasFlagman: true,
  crowdFestival: true,
  hasPoliceVolunteer: true,
  hasFestivalLights: true,
  hasBusStop: true,
  hasFireHydrant: true,
  hasElderlyCrossing: true,
  isParkingChallenge: true,
  tasks: [
    { id: 'signals', text: 'Obey all signals', type: 'avoid', target: 'signal_jump', done: false },
    { id: 'speed', text: 'Maintain speed limits', type: 'avoid', target: 'speed', done: false },
    { id: 'lanes', text: 'Stay in lane', type: 'avoid', target: 'lane_violation', done: false },
    { id: 'reach', text: 'Complete the route', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
