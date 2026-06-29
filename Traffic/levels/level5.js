window.LVS = window.LVS || []
window.LVS.push({
  id: 5,
  icon: '🏫',
  name: 'Lesson 5 - School Zone Crossing',
  modes: ['pedestrian', 'car'],
  col: '#e74c3c',
  ds: 'You are approaching a school zone during dismissal time. Children in uniforms are crossing randomly between parked cars. Slow down and give them priority.',
  hps: [
    'School zones have a 20 km/h speed limit — reduce speed well before entering.',
    'Children may dart out from between parked cars without looking.',
    'Activate your hazard lights to warn NPCs behind you.'
  ],
  law: {
    sec: 'MV Act Section 196',
    fine: '₹1000 - ₹5000',
    off: 'Speeding in School Zone',
    secHi: 'मोटर वाहन अधिनियम धारा 196',
    fineHi: '₹1000 - ₹5000',
    offHi: 'स्कूल क्षेत्र में तेज़ गति'
  },
  theory:
    '<h2>School Zone Crossing</h2><p>School ke paas bachche hain — bahut saare! Yeh sabse khatarnak jagah hai jab school ki chhuti hoti hai.</p><p>Bachche kabhi bhi sadak pe bhaag sakte hain — ball ke peeche, dost ke saath, ya bas bina dekhe bhi. Tumhein 20 km/h se zyada nahi chalna hai, bilkul slow!</p><h3>🏫 Kya karna hai?</h3><ul><li>Bachche parked gaadiyon ke beech se nikal rahe hain — ruk jao!</li><li>School guard traffic sambhal raha hai — uski baat maano.</li><li>Peeche waali gaadiyan overtake karna chahti hain — unki mat suno.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>School zone mein speed karna MV Act Section 196 ke under hai — ₹1000 se ₹5000 tak ka fine aur 3 number katenge license se!</p>',
  pract: 'Drive slowly through the school zone. Stop if children are crossing. Do not honk near the school.',
  mode: 'practical',
  themeType: 'pedestrian_courtesy',
  startOutside: true,
  tasks: [
    { id: 'slow_zone', text: 'Slow to 20 km/h in school zone', type: 'avoid', target: 'speed_zone', done: false },
    { id: 'watch_kids', text: 'Watch for crossing children', type: 'avoid', target: 'pedestrian', done: false },
    { id: 'follow_guard', text: 'Follow school guard signals', type: 'reach', target: 'guard_signal', done: false }
  ]
})
