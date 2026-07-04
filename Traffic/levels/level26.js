window.LVS = window.LVS || []
window.LVS.push({
  id: 26,
  icon: '🐄',
  name: 'Lesson 26 - Cows on the Road!',
  modes: ['car'],
  col: '#f39c12',
  ds: 'A cow is sitting right in the middle of the road. Cars behind you are honking. But cows are sacred in India — never honk at them, just wait patiently.',
  hps: ['Cows have right of way in India — legally and culturally.', 'Never honk at a cow — it may panic and cause an accident.', 'Wait patiently; cows usually move on their own within a minute.'],
  law: {
    sec: 'MV Act Section 117 & Animal Protection',
    fine: '₹2000 - ₹5000',
    off: 'Disturbing Sacred Animal',
    secHi: 'मोटर वाहन अधिनियम धारा 117 एवं पशु संरक्षण',
    fineHi: '₹2000 - ₹5000',
    offHi: 'पवित्र पशु को परेशान करना'
  },
  theory:
    '<h2>Cows on the Road!</h2><p>Road ke beech mein ek gaay baithi hai! Peeche waali gaadiyan honk kar rahi hain — lekin gaay ko disturb karna bilkul galat hai!</p><p>India mein gaayon ka special status hai. Kanooni aur samajik dono nazariyon se, gaay road pe ho toh patience rakho. Honk mat karo, hilao mat — apne aap uth jayegi!</p><h3>🐄 Kya karna hai?</h3><ul><li>Doorch se ruko — gaay ko disturb mat karo!</li><li>HONK MAT BAJAO — gaay darti hai!</li><li>Patient wait karo — gaay uth ke chali jayegi.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Gaay ko disturb karna MV Act Section 117 aur Animal Protection ke under illegal hai — ₹2000 se ₹5000 tak ka fine!</p>',
  pract: 'Stop and wait patiently. Do not honk. Give the cow space. Pass only when it moves clear.',
  mode: 'practical',
  themeType: 'animals',
  startOutside: true,
  tasks: [
    { id: 'stop_cow', text: 'Stop for cow', type: 'stop', target: 'cow', done: false },
    { id: 'no_honk', text: 'Do not honk at cow', type: 'avoid', target: 'honk', done: false },
    { id: 'wait_move', text: 'Wait for cow to move', type: 'stop', target: 'cow_moved', done: false }
  ],
  assets: ['suburban', 'industrial']
})
