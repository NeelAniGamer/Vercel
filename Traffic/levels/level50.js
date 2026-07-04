window.LVS = window.LVS || []
window.LVS.push({
  id: 50,
  icon: '🏆',
  name: 'Lesson 50 - Grand Mastery!',
  modes: ['car'],
  col: '#f1c40f',
  ds: 'THE ULTIMATE TEST. All weather conditions, all vehicle types, all road types, all traffic situations. Only a master driver can pass this.',
  hps: ['This test combines every skill from 49 levels.', 'Stay calm — panic is the real enemy.', 'Patience and observation beat speed every time.'],
  law: {
    sec: 'All MV Act Sections',
    fine: '₹500 - ₹10000',
    off: 'Multiple Violations',
    secHi: 'सभी मोटर वाहन अधिनियम धाराएँ',
    fineHi: '₹500 - ₹10000',
    offHi: 'अनेक उल्लंघन'
  },
  theory:
    '<h2>Grand Mastery!</h2><p>Grand Mastery ka waqt! 49 levels ka sab kuch tumhare saamne hai — rain, night, fog, highway, mountain, village, construction — sab ek saath!</p><p>Yeh test tumhe poora master driver banayega. Har cheez apply karo — rules, patience, observation, skill. Agar yeh pass kar liya toh tum real Indian road ke liye ready ho!</p><h3>🏆 Kya karna hai?</h3><ul><li>Sab weather conditions handle karo.</li><li>Har vehicle type ka respect karo.</li><li>Har road type pe safe driving karo.</li><li>Sab rules follow karo — ek bhi mat chhodo!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Sab MV Act sections applicable — violations pe ₹500 se ₹10000 tak ka fine!</p>',
  pract: 'Complete the ultimate test. Apply every skill from all previous levels. Stay calm, stay safe, stay respectful.',
  mode: 'practical',
  themeType: 'grand_test',
  startOutside: true,
  tasks: [
    { id: 'weather', text: 'Handle all weather', type: 'avoid', target: 'weather_fail', done: false },
    { id: 'vehicles', text: 'Respect all vehicles', type: 'avoid', target: 'collision', done: false },
    { id: 'rules', text: 'Follow all rules', type: 'avoid', target: 'violation', done: false },
    { id: 'mastery', text: 'Complete the test', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
