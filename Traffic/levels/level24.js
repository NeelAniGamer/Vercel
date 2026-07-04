window.LVS = window.LVS || []
window.LVS.push({
  id: 24,
  icon: '🚶',
  name: 'Lesson 24 - Pedestrian Priority',
  modes: ['car'],
  col: '#2ecc71',
  ds: 'An elderly person is trying to cross the road at a zebra crossing. Traffic is flowing but you must stop and let them cross safely.',
  hps: ['Pedestrians always have right of way at zebra crossings.', 'Elderly and disabled pedestrians need extra patience.', 'Stopping for pedestrians saves lives — never rush them.'],
  law: {
    sec: 'MV Act Section 126',
    fine: '₹500 - ₹2000',
    off: 'Not Yielding to Pedestrian',
    secHi: 'मोटर वाहन अधिनियम धारा 126',
    fineHi: '₹500 - ₹2000',
    offHi: 'पैदल चलने वाले को रास्ता न देना'
  },
  theory:
    '<h2>Pedestrian Priority</h2><p>Zebra crossing pe ek buzurg cross kar rahe hain — traffic chal raha hai lekin tumhe rukna hai!</p><p>Pedestrians ka hamesha right of way hota hai, especially zebra crossing pe. Buzurg ya disabled pedestrians ko extra time do — jaldi mat karo!</p><h3>🚶 Kya karna hai?</h3><ul><li>Zebra crossing pe poori tarah se ruko!</li><li>Buzurg ko crossing karo — unhe time do.</li><li>Peeche waali gaadiyan honk kar rahi hain — tum mat karo!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Pedestrian ko yield na karna MV Act Section 126 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Stop at the zebra crossing. Wait patiently for the elderly person to cross completely. Do not honk.',
  mode: 'practical',
  themeType: 'pedestrian_priority',
  startOutside: true,
  tasks: [
    { id: 'stop_zebra', text: 'Stop at zebra crossing', type: 'stop', target: 'zebra', done: false },
    { id: 'wait_cross', text: 'Wait for pedestrian to cross', type: 'stop', target: 'pedestrian_crossed', done: false },
    { id: 'proceed', text: 'Proceed after crossing', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
