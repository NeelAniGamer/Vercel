window.LVS = window.LVS || []
window.LVS.push({
  id: 8,
  icon: '🚑',
  name: 'Lesson 8 - Narrow Street Ambulance',
  modes: ['car'],
  col: '#e67e22',
  ds: 'An ambulance is stuck behind you on a narrow single-lane street. There is no room to pull over. Find a gap between parked cars or a driveway to squeeze into.',
  hps: [
    'On narrow streets, you may need to mount the curb slightly to create space.',
    'Look for driveways, alleys, or gaps between parked cars.',
    'Signal your intention before maneuvering — honk once to alert pedestrians.'
  ],
  law: {
    sec: 'MV Act Section 194E',
    fine: '₹10000',
    off: 'Blocking Emergency Vehicle',
    secHi: 'मोटर वाहन अधिनियम धारा 194E',
    fineHi: '₹10000',
    offHi: 'आपातकालीन वाहन को रोकना'
  },
  theory:
    '<h2>Narrow Street Ambulance</h2><p>Mumbai ki gali bahut tight hai — ek gaadi mushkil se jaati hai. Aur abhi peeche ambulance hai! Sirens baj rahi hain — kya karenge?</p><p>Gali dono taraf se gaadiyon se bhari hai — koi shoulder nahi hai. Lekin ek chhota sa gap hai left side pe parked gaadiyon ke beech. Wahi hamara mauka hai!</p><h3>🚑 Kya karna hai?</h3><ul><li>Gali barely ek gaadi ki hai — patience rakho.</li><li>Dono taraf parked gaadiyan hain — koi jagah nahi hai seedha.</li><li>Left side pe chhota gap hai — wahan ghus jao!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>MV Act Section 194E kehta hai — road kitni bhi chhoti ho, emergency vehicle ko raasta dena padega. ₹10,000 ka fine hai!</p>',
  pract: 'Find a gap between parked cars. Signal, maneuver into it, and let the ambulance pass.',
  mode: 'practical',
  themeType: 'ambulance_priority',
  startOutside: true,
  tasks: [
    { id: 'find_gap', text: 'Find gap between parked cars', type: 'reach', target: 'gap_spot', done: false },
    { id: 'signal', text: 'Signal intention before maneuvering', type: 'toggle', target: 'indicator', done: false },
    { id: 'let_pass', text: 'Let ambulance pass', type: 'avoid', target: 'ambulance', done: false }
  ],
  assets: ['suburban', 'industrial', 'emergency']
})
