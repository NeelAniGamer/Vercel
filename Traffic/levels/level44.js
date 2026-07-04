window.LVS = window.LVS || []
window.LVS.push({
  id: 44,
  icon: '🚧',
  name: 'Lesson 44 - Construction Maze!',
  modes: ['car'],
  col: '#f39c12',
  ds: 'Road construction blocks your lane. Follow diversion signs through narrow temporary paths while avoiding workers and equipment.',
  hps: ['Construction zones have 20 km/h speed limits.', 'Workers may step onto the road unexpectedly.', 'Follow diversion signs — they lead to alternate routes.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹1000 - ₹5000',
    off: 'Construction Zone Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹1000 - ₹5000',
    offHi: 'निर्माण क्षेत्र उल्लंघन'
  },
  theory:
    '<h2>Construction Maze!</h2><p>Sadak ban rahi hai — road blocked hai! Diversion signs hain lekin raasta bahut narrow hai. Workers aur equipment bhi hain!</p><p>Construction zones mein bahut dheere chalo — 20 km/h se zyada nahi. Workers kabhi bhi road pe aa sakte hain. Equipment ke saath collision mat karo. Diversion signs follow karo — woh safe route dikhate hain!</p><h3>🚧 Kya karna hai?</h3><ul><li>Speed 20 km/h se zyada mat rakho.</li><li>Workers ke liye rasta do — woh kaam kar rahe hain.</li><li>Diversion signs follow karo.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Construction zone ka violation MV Act Section 117 ke under ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Slow to 20 km/h. Follow diversion signs. Avoid workers and equipment. Complete the construction zone.',
  mode: 'practical',
  themeType: 'construction',
  startOutside: true,
  tasks: [
    { id: 'slow_zone', text: 'Slow to 20 km/h', type: 'avoid', target: 'speed', done: false },
    { id: 'avoid_workers', text: 'Avoid workers', type: 'avoid', target: 'worker_hit', done: false },
    { id: 'follow_diversion', text: 'Follow diversion', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
