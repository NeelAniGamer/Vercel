window.LVS = window.LVS || []
window.LVS.push({
  id: 2,
  icon: '🅿️',
  name: 'Lesson 2 - Street Parking',
  modes: ['pedestrian', 'car'],
  col: '#e74c3c',
  ds: 'In busy Mumbai streets, finding legal parking is a challenge. NPCs routinely double-park and block footpaths.',
  hps: [
    'School zones have a 20 km/h speed limit — reduce speed well before entering.',
    'Children may dart out from between parked cars without looking.',
    'Activate your hazard lights to warn NPCs behind you.'
  ],
  law: {
    sec: 'MV Act Section 122',
    fine: '₹500 - ₹1000',
    off: 'Parking in No Parking Zone',
    secHi: 'मोटर वाहन अधिनियम धारा 122',
    fineHi: '₹500 - ₹1000',
    offHi: 'प्रतिबंधित क्षेत्र में पार्किंग'
  },
  theory:
    '<h2>Street Parking</h2><p>Mumbai ki busy streets pe parking dhoondna mushkil hai — sab jagah gaadiyan khadi hain! Lekin ek legal parking spot 50 meter aage left side pe hai. Wahan lagao aur walk karke destination pe jao!</p><p>Footpath ya no-parking zone mein parking karna MV Act Section 122 ke under illegal hai — ₹500 se ₹1000 tak ka fine. NPC gaadiyan galat jagah khadi hain — unki mat suno!</p><p>Socho — agar tum galat jagah lagao toh challan tumhe milega, unhe nahi!</p>',
  pract: 'Find the legal parking spot 50 meters ahead. Park there and walk to the shop objective.',
  mode: 'practical',
  themeType: 'street_parking',
  startOutside: true,
  tasks: [
    { id: 'find_spot', text: 'Find legal parking spot', type: 'reach', target: 'parking_spot', done: false },
    { id: 'park_legal', text: 'Park in designated zone', type: 'stop', target: 'parking_zone', done: false },
    { id: 'walk_dest', text: 'Walk to destination', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
