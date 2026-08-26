window.LVS = window.LVS || []
window.LVS.push({
  id: 45,
  icon: '👻',
  name: 'Lesson 45 - Zero Visibility!',
  modes: ['car', 'bike'],
  col: '#2c3e50',
  ds: 'Dense fog at night with rain. You can barely see 10 meters ahead. Use fog lights, crawl at minimum speed, and trust your instincts.',
  hps: ['Fog lights are mandatory — use them, not headlights.', 'Reduce speed to minimum — you cannot see what is ahead.', 'Listen for other vehicles — sound travels further than sight in fog.'],
  law: {
    sec: 'MV Act Section 184',
    fine: '₹2000 - ₹10000',
    off: 'Driving in Zero Visibility',
    secHi: 'मोटर वाहन अधिनियम धारा 184',
    fineHi: '₹2000 - ₹10000',
    offHi: 'शून्य दृश्यता में ड्राइविंग'
  },
  theory:
    '<h2>Zero Visibility!</h2><p>Fog itna gehra hai ki haath bhi nahi dikhta! Baarish bhi ho rahi hai — sab kuch black hai!</p><p>Zero visibility mein fog lights sabse zaroori hain. Headlights ka koi fayda nahi — fog mein reflect hota hai. Fog lights neeche rakhti hain aur kam distance cover karti hain. Speed bilkul minimum — 5-10 km/h. Horn se alert karo — doosre vehicles ko awaaz se pata chalega!</p><h3>👻 Kya karna hai?</h3><ul><li>Fog lights ON — headlights mat lagao.</li><li>Speed 5-10 km/h — bilkul dheere chalo.</li><li>Horn bajao — doosron ko awaaz se pata chale.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Zero visibility mein driving MV Act Section 184 ke under ₹2000 se ₹10000 tak ka fine!</p>',
  pract: 'Turn on fog lights. Crawl at minimum speed. Use horn to alert others. Navigate by sound and road markings.',
  mode: 'practical',
  themeType: 'zero_visibility',
  startOutside: true,
  isNight: true,
  hasFog: true,
  hasRain: true,
  tasks: [
    { id: 'fog_lights', text: 'Use fog lights', type: 'avoid', target: 'wrong_lights', done: false },
    { id: 'crawl', text: 'Crawl at minimum speed', type: 'avoid', target: 'speed', done: false },
    { id: 'navigate', text: 'Reach destination', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
