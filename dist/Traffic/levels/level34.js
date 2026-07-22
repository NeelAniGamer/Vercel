window.LVS = window.LVS || []
window.LVS.push({
  id: 34,
  icon: '🚧',
  name: 'Lesson 34 - Construction Zone!',
  modes: ['car', 'bike'],
  col: '#e67e22',
  ds: 'A construction zone blocks part of the road. Follow the detour signs, obey the flagman, and slow down through the zone.',
  hps: ['Construction zones have strict speed limits — usually 20 km/h.', 'Temporary signs and flagmen override normal traffic rules.', 'Fines in construction zones are often doubled.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹5000',
    off: 'Construction Zone Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹5000',
    offHi: 'निर्माण क्षेत्र का उल्लंघन'
  },
  theory:
    '<h2>Construction Zone!</h2><p>Road pe construction ho rahi hai — half road band hai! Detour signs hain, flagman haath dikha raha hai — strict rules follow karo!</p><p>Construction zones mein normal rules nahi chalte — temporary signs aur flagman ka word final hai. Speed bahut slow karo (20 km/h). Fine bhi double lagta hai!</p><h3>🚧 Kya karna hai?</h3><ul><li>Speed 20 km/h se zyada mat honi!</li><li>Detour sign follow karo.</li><li>Flagman ka haath follow karo — woh tumhe dikha raha hai kahan jaana hai.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Construction zone violation MV Act Section 117 ke under hai — ₹5000 ka fine!</p>',
  pract: 'Slow down to 20 km/h. Follow the detour signs. Obey the flagman. Exit the construction zone carefully.',
  mode: 'practical',
  themeType: 'construction',
  hasConstruction: true,
  hasFlagman: true,
  scenarioType: 'cars_only',
  startOutside: true,
  tasks: [
    { id: 'slow_zone', text: 'Slow down in zone', type: 'avoid', target: 'speed', done: false },
    { id: 'follow_detour', text: 'Follow detour signs', type: 'reach', target: 'detour', done: false },
    { id: 'obey_flagman', text: 'Obey flagman signals', type: 'reach', target: 'flagman', done: false }
  ],
  assets: ['suburban', 'industrial']
})
