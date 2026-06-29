window.LVS = window.LVS || []
window.LVS.push({
  id: 10,
  icon: '🛒',
  name: 'Lesson 10 - Market Area Parking',
  modes: ['pedestrian', 'car'],
  col: '#3498db',
  ds: 'A crowded market area with vendors spilling onto the road. NPC auto-rickshaws are parked haphazardly. Navigate through carefully and find a designated parking zone.',
  hps: [
    'Market vendors have the right to their stall space — do not push them aside.',
    'Auto-rickshaws may pull out without warning — keep a safe distance.',
    'Designated parking zones are marked with blue signs.'
  ],
  law: {
    sec: 'Municipal Corp Bye-laws & MV Act Section 122',
    fine: '₹500 - ₹2000',
    off: 'Parking in Market Zone',
    secHi: 'नगर निगम उप-नियम एवं मोटर वाहन अधिनियम धारा 122',
    fineHi: '₹500 - ₹2000',
    offHi: 'बाज़ार क्षेत्र में पार्किंग'
  },
  theory:
    '<h2>Market Area Parking</h2><p>Market mein sab kuch ek saath hai — vendors, log, gaadiyan, sab! Jagah bahut kam hai aur sab jagah jaana chahte hain.</p><p>Tight gali hai, dono taraf vendors hain. Auto-rickshaw waale beech mein khade hain. Lekin market ke entrance pe ek paid parking zone hai — wahan lagao!</p><h3>🛒 Kya karna hai?</h3><ul><li>Gali tight hai, vendors dono taraf hain — slowly jao.</li><li>Auto-rickshaw waale road pe khade hain — darr mat, space banao.</li><li>Market entrance pe parking zone hai — wahan ruko!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Market zone mein bina permission parking karna municipal bye-laws aur MV Act Section 122 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Navigate through the market carefully. Park in the designated paid zone. Walk to your destination.',
  mode: 'practical',
  themeType: 'respectful_parking',
  startOutside: true,
  tasks: [
    { id: 'navigate_market', text: 'Navigate through market', type: 'reach', target: 'market_zone', done: false },
    { id: 'find_zone', text: 'Find parking zone', type: 'reach', target: 'parking_zone', done: false },
    { id: 'park_spot', text: 'Park in designated spot', type: 'stop', target: 'parking_spot', done: false }
  ]
})
