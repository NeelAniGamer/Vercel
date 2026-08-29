window.LVS = window.LVS || []
window.LVS.push({
  id: 48,
  icon: '🌾',
  name: 'Lesson 48 - Rural Kacha Road!',
  modes: ['car', 'bike'],
  col: '#8B7355',
  ds: 'A narrow unpaved village road with potholes, stray animals, and oncoming tractors. Patience and spatial awareness are everything.',
  hps: ['Kacha roads have hidden potholes — crawl at all times.', 'Cows and dogs may be sleeping on the road.', 'Tractors need wide turns — give them space.'],
  law: {
    sec: 'MV Act Section 184',
    fine: '₹500 - ₹2000',
    off: 'Rural Road Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 184',
    fineHi: '₹500 - ₹2000',
    offHi: 'ग्रामीण सड़क उल्लंघन'
  },
  theory:
    '<h2>Rural Kacha Road!</h2><p>Gaon ka kacha road — koi signal nahi, koi lane marking nahi, aur sadak pe gaay so rahi hai!</p><p>Kacha roads pe gaadi chalana sabse mushkil hota hai. Potholes chhupi hoti hain, janwar sadak pe sote hain, tractors bade hote hain. Speed bilkul slow — 10-15 km/h. Horn se janwaro ko hatao. Tractor ko space do — unko mudna mushkil hota hai!</p><h3>🌾 Kya karna hai?</h3><ul><li>Speed 10-15 km/h — potholes chhupi hoti hain.</li><li>Horn se janwaro ko hatao.</li><li>Tractors ko space do — unka turning radius bada hai.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Rural road violations MV Act Section 184 ke under ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Crawl on the unpaved road. Honk to move animals. Give tractors space. Reach the village safely.',
  mode: 'practical',
  themeType: 'rural',
  startOutside: true,
  isRural: true,
  hasCow: true,
  hasDog: true,
  ground: 0x8b7355,
  tasks: [
    { id: 'crawl', text: 'Crawl through potholes', type: 'avoid', target: 'speed', done: false },
    { id: 'move_animals', text: 'Move stray animals', type: 'avoid', target: 'animal_hit', done: false },
    { id: 'reach_village', text: 'Reach the village', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
