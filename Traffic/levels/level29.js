window.LVS = window.LVS || []
window.LVS.push({
  id: 29,
  icon: '🛺',
  name: 'Lesson 29 - Auto-Rickshaw Dance!',
  modes: ['car'],
  col: '#f39c12',
  ds: 'You\'re driving behind an auto-rickshaw. It keeps stopping suddenly, swerving to pick up passengers, and making unpredictable moves. Stay alert and maintain safe distance.',
  hps: ['Auto-rickshaws stop frequently and unpredictably.', 'Maintain at least 3 car lengths distance behind autos.', 'Never overtake an auto near a bus stop or crossing.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹500 - ₹2000',
    off: 'Failing to Maintain Safe Distance',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹500 - ₹2000',
    offHi: 'सुरक्षित दूरी बनाए न रखना'
  },
  theory:
    '<h2>Auto-Rickshaw Dance!</h2><p>Auto-rickshaw ke peeche drive kar rahe ho — ruk rahi hai, mud rahi hai, passengers utha rahi hai! Auto-rickshaws sabse unpredictable vehicles hain!</p><p>Auto ke peeche 3 car lengths ki doori rakho. Kabhi overtake mat karo jab auto slow ho rahi hai — woh kisi bhi side mud sakti hai!</p><h3>🛺 Kya karna hai?</h3><ul><li>Auto ke peeche doori rakho — 3 car lengths!</li><li>Auto ruke toh tum bhi ruko — suddenly mud sakti hai!</li><li>Overtake mat karo jab tak clear na ho.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Safe distance na rakhna MV Act Section 117 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Maintain 3 car lengths behind the auto. Stop when it stops. Do not overtake until the road is completely clear.',
  mode: 'practical',
  themeType: 'auto_dance',
  scenarioType: 'cars_only',
  npcDensity: 'moderate',
  startOutside: true,
  tasks: [
    { id: 'keep_distance', text: 'Keep safe distance', type: 'avoid', target: 'safe_distance', done: false },
    { id: 'react_stop', text: 'React to auto stopping', type: 'stop', target: 'auto_stop', done: false },
    { id: 'reach_dest', text: 'Reach destination', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
