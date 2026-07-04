window.LVS = window.LVS || []
window.LVS.push({
  id: 37,
  icon: '🏥',
  name: 'Lesson 37 - Hospital Quiet Zone!',
  modes: ['car'],
  col: '#3498db',
  ds: 'You\'re driving past a hospital. Absolutely no honking. Slow down, watch for ambulances entering/exiting, and leave the zone quietly.',
  hps: ['Hospital zones have zero tolerance for honking.', 'Ambulances may enter or exit at any moment.', 'Fines in hospital zones are among the highest.'],
  law: {
    sec: 'MV Act Section 118',
    fine: '₹2000 - ₹5000',
    off: 'Hospital Zone Silence',
    secHi: 'मोटर वाहन अधिनियम धारा 118',
    fineHi: '₹2000 - ₹5000',
    offHi: 'अस्पताल क्षेत्र में शोर'
  },
  theory:
    '<h2>Hospital Quiet Zone!</h2><p>Hospital ke paas se guzar rahe ho — BILKUL HONK MAT KARO! Yeh sabse strict zone hai — ₹2000-₹5000 fine!</p><p>Hospital zone mein patients ko rest chahiye. Honk karna matlab unki health ka risk. Ambulance kabhi bhi aa sakti hai — hamesha alert raho!</p><h3>🏥 Kya karna hai?</h3><ul><li>HONK BILKUL MAT BAJAO!</li><li>Slow speed se guzar jao.</li><li>Ambulance ke liye hamesha ready raho.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Hospital zone mein honk karna MV Act Section 118 ke under illegal hai — ₹2000 se ₹5000 tak ka fine!</p>',
  pract: 'Drive through the hospital zone silently. No honking under any circumstances. Watch for ambulances and yield immediately.',
  mode: 'practical',
  themeType: 'hospital_quiet',
  startOutside: true,
  tasks: [
    { id: 'no_honk', text: 'No honking in zone', type: 'avoid', target: 'honk', done: false },
    { id: 'slow_zone', text: 'Drive slowly', type: 'avoid', target: 'speed', done: false },
    { id: 'exit_quiet', text: 'Exit zone quietly', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
