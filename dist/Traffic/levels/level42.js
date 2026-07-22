window.LVS = window.LVS || []
window.LVS.push({
  id: 42,
  icon: '⚠️',
  name: 'Lesson 42 - Wrong-Side Danger!',
  modes: ['car', 'bike'],
  col: '#e74c3c',
  ds: 'Other vehicles are driving on the wrong side! Navigate carefully, predict their movements, and reach the destination without collision.',
  hps: ['Wrong-side drivers are unpredictable — expect anything.', 'Stay in your lane and signal intentions clearly.', 'Use horn sparingly to alert wrong-side drivers.'],
  law: {
    sec: 'MV Act Section 119',
    fine: '₹500 - ₹5000',
    off: 'Wrong-Side Driving',
    secHi: 'मोटर वाहन अधिनियम धारा 119',
    fineHi: '₹500 - ₹5000',
    offHi: 'गलत दिशा में वाहन चलाना'
  },
  theory:
    '<h2>Wrong-Side Danger!</h2><p>Sadak pe kuch gaadiyan galat side se aa rahi hain! Yeh bahut khatarnak hai — unka koi pattern nahi hai!</p><p>Wrong-side driving India mein ek badi samasya hai. Tum sahi side pe chal raho ho lekin saamne se galat side pe aa rahi hain. Horn se alert karo, speed kam karo, aur lane se mat hato!</p><h3>⚠️ Kya karna hai?</h3><ul><li>Apni lane mein raho — galat side pe mat jao.</li><li>Horn se alert karo lekin zyada mat bajao.</li><li>Speed kam karo — reaction time chahiye.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Wrong-side driving MV Act Section 119 ke under illegal hai — ₹500 se ₹5000 tak ka fine!</p>',
  pract: 'Stay in your lane. Predict wrong-side vehicle movements. Use horn to alert. Reach destination without collision.',
  mode: 'practical',
  themeType: 'wrong_side',
  scenarioType: 'cars_only',
  npcDensity: 'moderate',
  startOutside: true,
  tasks: [
    { id: 'stay_lane', text: 'Stay in correct lane', type: 'avoid', target: 'wrong_lane', done: false },
    { id: 'avoid_wrong', text: 'Avoid wrong-side vehicles', type: 'avoid', target: 'collision', done: false },
    { id: 'complete', text: 'Reach destination safely', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
