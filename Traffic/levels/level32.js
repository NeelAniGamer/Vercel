window.LVS = window.LVS || []
window.LVS.push({
  id: 32,
  icon: '⛰️',
  name: 'Lesson 32 - Hill Driving!',
  modes: ['car'],
  col: '#8e44ad',
  ds: 'You\'re driving up a steep hill with hairpin bends. Use low gear uphill, honk at blind hairpin bends, and engine brake downhill.',
  hps: ['Low gear uphill gives more power and control.', 'Engine braking downhill prevents brake overheating.', 'Always honk at hairpin bends — you cannot see around them.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹1000 - ₹5000',
    off: 'Dangerous Hill Driving',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹1000 - ₹5000',
    offHi: 'खतरनाक पहाड़ी ड्राइविंग'
  },
  theory:
    '<h2>Hill Driving!</h2><p>Pahadi road pe drive kar rahe ho — steep climb hai aur hairpin bends aa rahe hain! Yeh advanced driving skill hai!</p><p>Uphill: Low gear mein chalao — power chahiye. Downhill: Engine braking karo — brakes overheat ho sakte hain. Hairpin bend pe HONK karo — andar kya hai dikh nahi raha!</p><h3>⛰️ Kya karna hai?</h3><ul><li>Uphill: Low gear select karo.</li><li>Downhill: Engine brake use karo — brake pedal mat dabao.</li><li>Har hairpin bend pe HONK bajao!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Pahadi road pe dangerous driving MV Act Section 117 ke under illegal hai — ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Use low gear uphill. Honk at every hairpin bend. Engine brake downhill. Reach the top safely.',
  mode: 'practical',
  themeType: 'hill_driving',
  startOutside: true,
  tasks: [
    { id: 'low_gear', text: 'Use low gear uphill', type: 'toggle', target: 'gear', done: false },
    { id: 'honk_bend', text: 'Honk at hairpin bend', type: 'toggle', target: 'honk', done: false },
    { id: 'reach_top', text: 'Reach hilltop', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
