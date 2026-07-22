window.LVS = window.LVS || []
window.LVS.push({
  id: 47,
  icon: '🏔️',
  name: 'Lesson 47 - Mountain Pass!',
  modes: ['car', 'bike'],
  col: '#27ae60',
  ds: 'Navigate a treacherous mountain road with hairpin turns, steep gradients, and falling rocks. Brake management and patience are key.',
  hps: ['Use lower gears on steep descents — brakes can overheat.', 'Honk at blind curves to warn oncoming traffic.', 'Stay away from the edge — landslides can happen without warning.'],
  law: {
    sec: 'MV Act Section 184',
    fine: '₹2000 - ₹10000',
    off: 'Mountain Driving Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 184',
    fineHi: '₹2000 - ₹10000',
    offHi: 'पहाड़ी क्षेत्र ड्राइविंग उल्लंघन'
  },
  theory:
    '<h2>Mountain Pass!</h2><p>Pahadi raasta hai — hairpin turns, steep slope, aur patthar gir rahe hain! Brakes aur gears dono chahiye!</p><p>Mountain driving mein lower gears sabse zaroori hain. Downhill pe brake mat lagao continuously — overheat hoga. Gear 1 ya 2 pe rakho. Blind curve pe horn bajao — saamne se gaadi aa sakti hai. Edge se door raho — landslide kabhi bhi ho sakta hai!</p><h3>🏔️ Kya karna hai?</h3><ul><li>Downhill pe lower gear — brake continuous mat lagao.</li><li>Blind curves pe horn bajao.</li><li>Edge se door raho — patthar gir sakte hain.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Mountain driving ka violation MV Act Section 184 ke under ₹2000 se ₹10000 tak ka fine!</p>',
  pract: 'Use lower gears on descents. Horn at blind curves. Avoid road edge. Complete the mountain pass.',
  mode: 'practical',
  themeType: 'mountain',
  startOutside: true,
  tasks: [
    { id: 'lower_gear', text: 'Use lower gear downhill', type: 'avoid', target: 'brake_overheat', done: false },
    { id: 'horn_curves', text: 'Honk at blind curves', type: 'avoid', target: 'curve_collision', done: false },
    { id: 'complete', text: 'Complete the pass', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
