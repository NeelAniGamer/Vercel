window.LVS = window.LVS || []
window.LVS.push({
  id: 33,
  icon: '🚌',
  name: 'Lesson 33 - Bus Stop Yield!',
  modes: ['car', 'bike'],
  col: '#3498db',
  ds: 'A bus is stopped at a bus stop picking up passengers. You must wait behind the bus and never overtake near a bus stop — passengers may cross unexpectedly.',
  hps: ['Passengers may cross the road immediately after getting off a bus.', 'Never overtake a bus at or near a bus stop.', 'Wait until the bus moves and the road is clear.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹1000 - ₹5000',
    off: 'Dangerous Driving Near Bus Stop',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹1000 - ₹5000',
    offHi: 'बस स्टॉप के पास खतरनाक ड्राइविंग'
  },
  theory:
    '<h2>Bus Stop Yield!</h2><p>Bus stop pe ek bus ruki hai — passengers utar rahe hain. Tumhare saamne tempting hai overtake karne ka — lekin BILKUL MAT KARO!</p><p>Bus stop pe passengers utarte hi seedha road cross karte hain. Agar tum overtake kar rahe ho toh seedha unse takra sakte ho!</p><h3>🚌 Kya karna hai?</h3><ul><li>Bus ke peeche ruko — overtake mat karo!</li><li>Passengers cross kar rahe hain — wait karo!</li><li>Bus chale jaaye aur road clear ho — tab aage badho.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Bus stop ke paas overtake karna MV Act Section 117 ke under illegal hai — ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Stop behind the bus. Wait for passengers to cross. Do not overtake until the bus moves away.',
  mode: 'practical',
  themeType: 'bus_stop',
  hasBusStop: true,
  npcDensity: 'moderate',
  scenarioType: 'cars_only',
  startOutside: true,
  tasks: [
    { id: 'wait_bus', text: 'Wait behind bus', type: 'stop', target: 'bus_stop', done: false },
    { id: 'no_overtake', text: 'Do not overtake', type: 'avoid', target: 'overtake', done: false },
    { id: 'proceed', text: 'Proceed after bus moves', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
