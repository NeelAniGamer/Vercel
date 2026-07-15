window.LVS = window.LVS || []
window.LVS.push({
  id: 13,
  icon: '🌙',
  name: 'Lesson 13 - Night Rain Puddles',
  modes: ['pedestrian', 'car', 'bike'],
  col: '#9b59b6',
  ds: 'It is raining at night. Puddles are hard to see in the dark. A pedestrian with a broken umbrella is walking on the road edge. You may not see the puddle until it is too late.',
  hps: [
    'At night, puddles are nearly invisible — assume they are everywhere near footpaths.',
    'Use your headlights to scan for water reflections.',
    'If you see a pedestrian on the road, slow down regardless of puddles.'
  ],
  law: {
    sec: 'MV Act Section 128 & Civic Sense',
    fine: '₹1000 - ₹3000',
    off: 'Dangerous Driving in Rain',
    secHi: 'मोटर वाहन अधिनियम धारा 128 एवं नागरिक अनुशासन',
    fineHi: '₹1000 - ₹3000',
    offHi: 'बारिश में खतरनाक ड्राइविंग'
  },
  theory:
    '<h2>Night Rain Puddles</h2><p>Raat ko baarish ho rahi hai — sab kuch andhera hai. Puddles dikh nahi rahe, aur ek pedestrian toota hua umbrella leke sadak pe chal raha hai. Yeh double khatarnak hai!</p><p>Andhere mein puddles bilkul nahi dikhte — jab tak headlights unhe catch na kare. Pedestrians footpath se bhag ke road pe aa gaye hain kyunki footpath doobi hui hai.</p><h3>🌙 Kya karna hai?</h3><ul><li>Andhera hai, puddles invisible hain — headlights se paani ki reflection dhoondho.</li><li>Ek pedestrian road pe chal raha hai — usse door se guzro!</li><li>NPC tez ja rahe hain, ek ne pedestrian ko bheega diya — tum mat bheego!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>MV Act Section 128 kehta hai — kharab mausam mein extra careful hona padega. Raat mein pedestrian ko bheegna ₹1000 se ₹3000 tak ka fine!</p>',
  pract: 'Drive slowly, scan for water reflections, and give pedestrians a wide berth in the dark.',
  mode: 'practical',
  themeType: 'puddle_etiquette',
  scenarioType: 'mixed',
  npcDensity: 'moderate',
  hasRain: true,
  isNight: true,
  startOutside: true,
  tasks: [
    { id: 'use_headlights', text: 'Use headlights to scan puddles', type: 'toggle', target: 'headlights', done: false },
    { id: 'slow_night', text: 'Drive slowly in dark rain', type: 'avoid', target: 'speed_night', done: false },
    { id: 'wide_berth', text: 'Give pedestrians wide berth', type: 'avoid', target: 'pedestrian', done: false }
  ],
  assets: ['suburban', 'industrial', 'construction']
})
