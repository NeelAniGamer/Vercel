window.LVS = window.LVS || []
window.LVS.push({
  id: 41,
  icon: '⛈️',
  name: 'Lesson 41 - Night Monsoon Grid!',
  modes: ['car', 'bike'],
  col: '#1a1a3e',
  ds: 'Drive through heavy monsoon rain at night. Zero visibility, flooded roads, and complex intersections. Use headlights and extreme caution.',
  hps: ['Night rain reduces visibility to near zero — use headlights.', 'Flooded roads may hide deep potholes — crawl through.', 'Intersection navigation requires memorizing road layout ahead of time.'],
  law: {
    sec: 'MV Act Section 184',
    fine: '₹2000 - ₹10000',
    off: 'Dangerous Night Driving',
    secHi: 'मोटर वाहन अधिनियम धारा 184',
    fineHi: '₹2000 - ₹10000',
    offHi: 'रात्रि में खतरनाक ड्राइविंग'
  },
  theory:
    '<h2>Night Monsoon Grid!</h2><p>Raat ka monsoon — baarish itni tez hai ki saamne kuch dikhta nahi! Road flooded hai, signals barely visible hain!</p><p>Night monsoon driving sabse mushkil hoti hai. Headlights low beam pe rakho — high beam se reflection aata hai. Puddles se bachho — andar kitna gehra hai pata nahi. Intersections pe extremely slow jao!</p><h3>⛈️ Kya karna hai?</h3><ul><li>Headlights low beam pe — high beam mat lagao.</li><li>Puddles se bachho — flooded road pe crawl karo.</li><li>Intersections pe 10 km/h se zyada mat jao.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Night monsoon mein dangerous driving MV Act Section 184 ke under ₹2000 se ₹10000 tak ka fine!</p>',
  pract: 'Navigate the flooded night grid. Use headlights wisely. Crawl through puddles. Complete all intersections without stalling.',
  mode: 'practical',
  themeType: 'night_monsoon',
  npcDensity: 'heavy',
  hasPuddles: true,
  isNight: true,
  scenarioType: 'emergency',
  startOutside: true,
  hasRain: true,
  tasks: [
    { id: 'use_headlights', text: 'Use headlights properly', type: 'avoid', target: 'no_lights', done: false },
    { id: 'crawl_puddles', text: 'Crawl through flooded roads', type: 'avoid', target: 'splash', done: false },
    { id: 'complete_route', text: 'Complete the grid route', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
