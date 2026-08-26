window.LVS = window.LVS || []
window.LVS.push({
  id: 14,
  icon: '🌙',
  name: 'Lesson 14 - Night Crossing',
  modes: ['pedestrian', 'car', 'bike'],
  col: '#e74c3c',
  ds: 'It is late at night. Visibility is poor. An elderly person with a walking stick is slowly crossing at an unmarked crossing point. NPCs are speeding past — do not follow them.',
  hps: [
    'Use your headlights properly — dip them for oncoming traffic.',
    'At unmarked crossings, pedestrians still have the right of way.',
    'Reduce speed at night — reaction times are halved in low visibility.'
  ],
  law: {
    sec: 'MV Act Section 128',
    fine: '₹1000 - ₹3000',
    off: 'Failing to Yield at Night',
    secHi: 'मोटर वाहन अधिनियम धारा 128',
    fineHi: '₹1000 - ₹3000',
    offHi: 'रात में रास्ता न देना'
  },
  theory:
    '<h2>Night Crossing</h2><p>Raat ko India mein driving karna bahut mushkil hai. Roads andheri hain, gaadiyan tez chal rahi hain, aur log dark kapdon mein sadak cross kar rahe hain — yeh recipe hai disaster ki!</p><p>Ek buzurg stick leke slowly cross kar raha hai — unhe tumhari gaadi dikh bhi nahi sakti, sun bhi nahi sakti. NPC tez ja rahe hain — ek unhe touch kar sakta hai!</p><h3>🌙 Kya karna hai?</h3><ul><li>Buzurg slowly cross kar raha hai — ruk jao, poori tarah cross hone do!</li><li>NPC tez ja rahe hain — unki mat suno.</li><li>Headlights dikh rahe hain, lekin shadows mein khatna chhupa hai — dheere jao.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>MV Act Section 128 kehta hai — raat mein extreme caution zaroori hai. Pedestrian ko kisi bhi crossing pe (marked ya unmarked) rukna padega — ₹1000 se ₹3000 fine!</p>',
  pract: 'Slow down, use headlights responsibly, and wait for the elderly person to cross completely.',
  mode: 'practical',
  themeType: 'pedestrian_courtesy',
  scenarioType: 'mixed',
  npcDensity: 'moderate',
  isNight: true,
  isBridge: false,
  ground: 0x33691e,
  startOutside: true,
  hasElderlyCrossing: true,
  tasks: [
    { id: 'dip_headlights', text: 'Dip headlights for oncoming traffic', type: 'toggle', target: 'headlights', done: false },
    { id: 'yield_elderly', text: 'Wait for elderly to cross', type: 'stop', target: 'stationary', done: false },
    { id: 'no_speed', text: 'Do not speed at night', type: 'avoid', target: 'speed_night', done: false }
  ],
  assets: ['suburban', 'industrial']
})
