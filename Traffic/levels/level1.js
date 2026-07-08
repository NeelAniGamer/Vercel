window.LVS = window.LVS || []
window.LVS.push({
  id: 1,
  icon: '🚥',
  name: 'Lesson 1 - Red Light Patience',
  modes: ['pedestrian', 'car'],
  col: '#e74c3c',
  ds: 'You are stuck at a busy junction. NPC cars honk aggressively behind you. A family of four is crossing the road — wait for them to reach the other side before you move.',
  hps: [
    'Stop behind the solid white stop line at signals.',
    'Wait for all pedestrians to fully cross before accelerating.',
    'Ignore impatient honking from NPCs — they will not get a challan, you will.'
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
    '<h2>Red Light Patience</h2><p>Zebra crossing pe ek family cross kar rahi hai — bachche, parents, sab. Peeche teen gaadiyan hain jo horn baja rahe hain. Ek gaadi overtake karke red light kaatne wali hai — tum mat karo!</p><p>Solid white line ke peechhe ruk jao jab tak light green na ho aur crossing bilkul clear na ho. Red signal kaatna MV Act Section 119 ke under ₹500 se ₹2000 tak ka fine hai aur license bhi kat sakta hai!</p><p>Yaad rakho — NPC gaadiyon ki awaaz sunkar ghabrao mat. Tumhe challan milega, unhe nahi!</p>',
  pract: 'Wait at the red light. Let all pedestrians cross. Do not move until the light turns green.',
  mode: 'practical',
  themeType: 'signal_jump',
  startOutside: true,
  tasks: [
    { id: 'wait_red', text: 'Wait at the red light', type: 'stop', target: 'red_light', done: false },
    { id: 'let_cross', text: 'Let all pedestrians cross', type: 'avoid', target: 'pedestrian', done: false },
    { id: 'move_green', text: 'Move only when light turns green', type: 'reach', target: 'green_light', done: false }
  ],
  assets: ['suburban', 'industrial']
})
