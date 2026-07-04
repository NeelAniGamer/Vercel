window.LVS = window.LVS || []
window.LVS.push({
  id: 23,
  icon: '🌧️',
  name: 'Lesson 23 - Heavy Rain Driving',
  modes: ['car'],
  col: '#3498db',
  ds: 'Heavy rain is falling. Visibility is poor, roads are flooded, and pedestrians are running for cover. Slow down and use your headlights.',
  hps: ['Use low beam headlights in rain — high beam reflects off water.', 'Increase following distance by 2x in wet conditions.', 'Puddles can hide deep potholes — never drive through fast.'],
  law: {
    sec: 'MV Act Section 184',
    fine: '₹1000 - ₹5000',
    off: 'Dangerous Driving in Rain',
    secHi: 'मोटर वाहन अधिनियम धारा 184',
    fineHi: '₹1000 - ₹5000',
    offHi: 'बारिश में खतरनाक ड्राइविंग'
  },
  theory:
    '<h2>Heavy Rain Driving</h2><p>Tez baarish ho rahi hai — visibility almost zero hai! Road pe paani bhara hai, pedestrians bhaag rahe hain. Tumhe slow down karna hai aur headlights on karni hain!</p><p>Rain mein driving sabse mushkil hoti hai — brakes kaam nahi karte, tyres slip karte hain, aur puddles potholes chhupa sakte hain!</p><h3>🌧️ Kya karna hai?</h3><ul><li>Low beam headlights on karo!</li><li>Speed aadhi kar do.</li><li>Puddles se door raho — andar deep potholes ho sakte hain!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Rain mein dangerous driving MV Act Section 184 ke under illegal hai — ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Turn on low beam headlights. Slow down to half speed. Avoid all puddles. Use hazard lights if visibility is very low.',
  mode: 'practical',
  themeType: 'rain_driving',
  startOutside: true,
  tasks: [
    { id: 'headlights', text: 'Turn on headlights', type: 'toggle', target: 'headlights', done: false },
    { id: 'slow_rain', text: 'Drive slowly in rain', type: 'avoid', target: 'speed', done: false },
    { id: 'reach_dest', text: 'Reach destination safely', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
