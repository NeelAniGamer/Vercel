window.LVS = window.LVS || []
window.LVS.push({
  id: 28,
  icon: '🅿️',
  name: 'Lesson 28 - Parking Rules!',
  modes: ['pedestrian', 'car'],
  col: '#3498db',
  ds: 'You need to park near a shopping area. A fire hydrant is visible, a no-parking zone is marked, and a legal parking spot is further away. Choose wisely.',
  hps: ['Never park within 5 meters of a fire hydrant.', 'Blue "P" signs mark legal parking zones.', 'Illegal parking near hydrants can result in heavy fines.'],
  law: {
    sec: 'MV Act Section 122',
    fine: '₹500 - ₹2000',
    off: 'Illegal Parking',
    secHi: 'मोटर वाहन अधिनियम धारा 122',
    fineHi: '₹500 - ₹2000',
    offHi: 'अवैध पार्किंग'
  },
  theory:
    '<h2>Parking Rules!</h2><p>Shopping area ke paas park karna hai — lekin paas mein fire hydrant hai aur no-parking zone hai. Legal parking thoda door hai!</p><p>Fire hydrant ke paas kabhi mat park karo — emergency mein fire brigade ko access chahiye! No-parking zone mein park karna ₹500-₹2000 ka fine hai. Blue "P" sign wala zone mein park karo — bilkul safe!</p><h3>🅿️ Kya karna hai?</h3><ul><li>Fire hydrant ke paas MAT park karo!</li><li>No-parking zone MAT use karo!</li><li>Blue "P" parking zone mein park karo.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Illegal parking MV Act Section 122 ke under hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Drive past the hydrant and no-parking zone. Park in the designated parking zone. Walk to your destination.',
  mode: 'practical',
  themeType: 'parking_rules',
  hasFireHydrant: true,
  scenarioType: 'cars_only',
  startOutside: true,
  tasks: [
    { id: 'avoid_hydrant', text: 'Avoid hydrant area', type: 'avoid', target: 'hydrant_zone', done: false },
    { id: 'find_parking', text: 'Find parking zone', type: 'reach', target: 'parking_zone', done: false },
    { id: 'walk_dest', text: 'Walk to destination', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
