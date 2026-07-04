window.LVS = window.LVS || []
window.LVS.push({
  id: 38,
  icon: '🎉',
  name: 'Lesson 38 - Festival Traffic!',
  modes: ['car'],
  col: '#e74c3c',
  ds: 'A festival procession blocks part of the road. Diversion signs are placed. Expect unexpected crowds, music vehicles, and pedestrians everywhere.',
  hps: ['Festival traffic creates unusual road patterns.', 'Follow diversion signs — they lead to alternate routes.', 'Yield to festival processions — they have priority.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹1000 - ₹5000',
    off: 'Festival Traffic Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹1000 - ₹5000',
    offHi: 'त्योहारी यातायात उल्लंघन'
  },
  theory:
    '<h2>Festival Traffic!</h2><p>Tyohaar ka julus road pe aa raha hai — road blocked hai! Diversion signs hain lekin log idhar udhar bhaag rahe hain!</p><p>Festival traffic mein bahut patience chahiye. Procession ko priority do. Diversion follow karo. Log suddenly road pe aa sakte hain — hamesha ready raho!</p><h3>🎉 Kya karna hai?</h3><ul><li>Procession ko priority do — unka raasta chhodo!</li><li>Diversion sign follow karo.</li><li>Crowd ke beech extremely slow chalao.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Festival traffic ka violation MV Act Section 117 ke under illegal hai — ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Yield to the procession. Follow the diversion route. Drive extremely slowly through the crowd. Reach your destination.',
  mode: 'practical',
  themeType: 'festival',
  startOutside: true,
  tasks: [
    { id: 'yield_procession', text: 'Yield to procession', type: 'stop', target: 'procession', done: false },
    { id: 'follow_diversion', text: 'Follow diversion signs', type: 'reach', target: 'diversion', done: false },
    { id: 'reach_dest', text: 'Reach destination', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
