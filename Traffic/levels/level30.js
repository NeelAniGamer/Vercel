window.LVS = window.LVS || []
window.LVS.push({
  id: 30,
  icon: '💳',
  name: 'Lesson 30 - Toll Plaza!',
  modes: ['car'],
  col: '#2ecc71',
  ds: 'You approach a highway toll plaza. Choose the correct lane (FASTag or cash), slow down, stop at the booth, and pay the toll.',
  hps: ['FASTag lanes are marked with blue signs — most vehicles use these.', 'Cash lanes are for vehicles without FASTag.', 'Always slow down when approaching a toll plaza.'],
  law: {
    sec: 'National Highway Authority Rules',
    fine: '₹500 - ₹5000',
    off: 'Toll Evasion',
    secHi: 'राष्ट्रीय राजमार्ग प्राधिकरण नियम',
    fineHi: '₹500 - ₹5000',
    offHi: 'टोल चोरी'
  },
  theory:
    '<h2>Toll Plaza!</h2><p>Highway pe toll plaza aa raha hai! FASTag lane hai aur cash lane hai — sahi lane choose karo!</p><p>Toll plaza pe slow down karo. FASTag wali gaadiyan FASTag lane mein jao. Cash lane mein ruko aur toll pay karo. Toll evade karna bhaari fine ka hai!</p><h3>💳 Kya karna hai?</h3><ul><li>Toll plaza dekhte hi slow down karo!</li><li>Sahi lane choose karo — FASTag ya cash.</li><li>Booth pe ruko, toll pay karo, aur aage badho.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Toll evade karna National Highway Authority Rules ke under illegal hai — ₹500 se ₹5000 tak ka fine!</p>',
  pract: 'Slow down on approach. Choose the correct lane. Stop at the booth and pay. Proceed on the highway.',
  mode: 'practical',
  themeType: 'toll',
  startOutside: true,
  tasks: [
    { id: 'slow_toll', text: 'Slow down at toll plaza', type: 'avoid', target: 'speed', done: false },
    { id: 'choose_lane', text: 'Choose correct lane', type: 'reach', target: 'toll_lane', done: false },
    { id: 'pay_toll', text: 'Pay toll at booth', type: 'stop', target: 'toll_booth', done: false }
  ],
  assets: ['suburban', 'industrial']
})
