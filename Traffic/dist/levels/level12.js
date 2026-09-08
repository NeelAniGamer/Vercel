window.LVS = window.LVS || []
window.LVS.push({
  id: 12,
  icon: '🚑',
  name: 'Lesson 12 - Highway Ambulance',
  modes: ['car', 'bike'],
  col: '#e67e22',
  ds: 'You are on a multi-lane highway. An ambulance approaches at high speed from behind. Move to the leftmost lane and maintain speed — do not stop suddenly.',
  hps: ['On highways, do not stop suddenly — move to the left lane and maintain speed.', 'Use your indicator before changing lanes.', 'Stay in the left lane until the ambulance has fully passed.'],
  law: {
    sec: 'MV Act Section 194E & Highway Rules',
    fine: '₹10000',
    off: 'Blocking Emergency Vehicle on Highway',
    secHi: 'मोटर वाहन अधिनियम धारा 194E एवं हाईवे नियम',
    fineHi: '₹10000',
    offHi: 'हाईवे पर आपातकालीन वाहन को रोकना'
  },
  theory:
    '<h2>Highway Ambulance</h2><p>Highway pe sab fast chal raha hai — 80 km/h! Aur abhi peeche se ambulance aa rahi hai, sirens baj rahi hain. Emergency hai!</p><p>Highway pe sudden brake maarna bahut khatarnak hai — peeche waali gaadi tumse takra sakti hai. Lekin ambulance ko raasta bhi dena padega. Kya karenge?</p><h3>🚑 Kya karna hai?</h3><ul><li>80 km/h pe traffic chal raha hai — ambulance fast aa rahi hai.</li><li>NPC apni lane mein hain — tumhe move karna hoga!</li><li>Sudden braking highway pe city se zyada khatarnak hai — dheere dheere slow ho jao.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Highway pe emergency vehicle ko raasta MV Act Section 194E ke under zaroori hai — ₹10,000 fine aur 6 mahine license suspend!</p>',
  pract: 'Indicate left, merge to the left lane, maintain your speed, and let the ambulance pass.',
  mode: 'practical',
  themeType: 'ambulance_priority',
  scenarioType: 'emergency',
  npcDensity: 'heavy',
  startOutside: true,
  hasAmbulanceBehind: true,
  isHighway: true,
  highwaySpeed: 80,
  tasks: [
    { id: 'indicate_left', text: 'Indicate left before merging', type: 'toggle', target: 'indicator', done: false },
    { id: 'merge_left', text: 'Merge to left lane', type: 'reach', target: 'left_lane', done: false },
    { id: 'maintain_speed', text: 'Maintain speed, do not stop', type: 'avoid', target: 'stop_sudden', done: false }
  ],
  assets: ['suburban', 'industrial']
})
