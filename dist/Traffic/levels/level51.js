window.LVS = window.LVS || []
window.LVS.push({
  id: 51,
  icon: '🛣️',
  name: 'Lesson 51 - Lane Discipline',
  modes: ['car', 'bike'],
  col: '#2980b9',
  ds: 'A multi-lane highway with heavy truck and bus traffic. You must stay in your lane, overtake only from the right side (India drives left), and use indicators before changing lanes. Weaving between lanes is dangerous!',
  hps: ['India drives on the LEFT — overtake from the RIGHT.', 'Stay in your lane unless overtaking.', 'Use indicators before every lane change.', 'Never weave between lanes — pick one and stick to it.'],
  law: {
    sec: 'MV Act Section 119 / 184',
    fine: '₹500 - ₹2000',
    off: 'Lane Discipline Violation / Dangerous Driving',
    secHi: 'मोटर वाहन अधिनियम धारा 119 / 184',
    fineHi: '₹500 - ₹2000',
    offHi: 'लेन अनुशासन का उल्लंघन / खतरनाक ड्राइविंग'
  },
  theory:
    '<h2>Lane Discipline</h2><p>Bhai, highway pe lane discipline bahut zaroori hai! India mein left side drive hota hai — overtaking sirf right side se karo!</p><p>Bohot log lane change karte waqt indicator nahi lagate aur beech-beech mein ghumte rehte hain — yeh bahut khatarnak hai. Accident ka sabse bada kaaran lane discipline ki kami hai!</p><h3>🛣️ Kya karna hai?</h3><ul><li>Apni lane mein raho — left lane for slow traffic, right lane for overtaking.</li><li>Overtake sirf RIGHT side se — India mein left side drive hota hai.</li><li>Lane change karne se pehle indicator lagao — pehle left, phir right.</li><li>Ek lane pakad ke chalo — beech mein mat ghumo!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Lane discipline MV Act Section 119 aur 184 ke under hai — ₹500 se ₹2000 tak ka fine aur license bhi cancel ho sakta hai!</p>',
  pract: 'Stay in your lane on a multi-lane highway. Overtake slower vehicles from the right. Use indicators before changing lanes. Do not weave between lanes.',
  mode: 'practical',
  themeType: 'lane_discipline',
  startOutside: true,
  tasks: [
    { id: 'reach_end', text: 'Drive to the end of the highway', type: 'reach', target: 'destination', done: false },
    { id: 'avoid_npc', text: 'Avoid NPC collisions', type: 'avoid', target: 'collision', done: false }
  ],
  assets: ['suburban', 'industrial']
})
