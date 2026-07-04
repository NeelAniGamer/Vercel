window.LVS = window.LVS || []
window.LVS.push({
  id: 27,
  icon: '🏘️',
  name: 'Lesson 27 - Narrow Street!',
  modes: ['car'],
  col: '#9b59b6',
  ds: 'You enter a narrow residential street. An auto-rickshaw is coming from the opposite direction. There\'s barely room for both — crawl at walking pace and find a gap.',
  hps: ['Narrow streets require crawling speed — walking pace or slower.', 'Look for wider spots where you can yield.', 'Horn use is acceptable on blind narrow streets to warn oncoming traffic.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹500 - ₹2000',
    off: 'Driving Without Due Care',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹500 - ₹2000',
    offHi: 'बिना सावधानी के ड्राइविंग'
  },
  theory:
    '<h2>Narrow Street!</h2><p>Tight residential street mein ghuste hi saamne se auto-rickshaw aa rahi hai! Jagah itni kam hai ki dono gaadi mushkil se guzar sakti hain!</p><p>Narrow streets mein crawling speed se chalao. Koi wider spot dhoondho jahan tum side ho sako. Horn ek baar baja sakte ho — taaki saamne waala pata lagaye ki tum aa rahi ho!</p><h3>🏘️ Kya karna hai?</h3><ul><li>Crawling speed (walking pace) pe chalao!</li><li>Wider spot dhoondo — auto ko pehle jaane do.</li><li>Ek baar horn bajao — warning ke liye.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Narrow street mein bina care ke driving MV Act Section 117 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Crawl at walking pace. Signal the auto to let them know you\'re there. Find a wider spot and let the auto pass first.',
  mode: 'practical',
  themeType: 'narrow_street',
  startOutside: true,
  tasks: [
    { id: 'crawl_slow', text: 'Crawl at walking pace', type: 'avoid', target: 'speed', done: false },
    { id: 'find_gap', text: 'Find gap for oncoming auto', type: 'reach', target: 'wider_spot', done: false },
    { id: 'exit_street', text: 'Exit narrow street', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
