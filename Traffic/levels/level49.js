window.LVS = window.LVS || []
window.LVS.push({
  id: 49,
  icon: '🌪️',
  name: 'Lesson 49 - Multi-Modal Chaos!',
  modes: ['car'],
  col: '#e67e22',
  ds: 'Every type of vehicle on the road at once — buses, trucks, autos, bikes, cycles, and pedestrians. The ultimate chaos management test.',
  hps: ['Each vehicle type has different blind spots and turning patterns.', 'Buses stop suddenly — keep distance.', 'Autos and bikes weave unpredictably — expect sudden lane changes.'],
  law: {
    sec: 'MV Act Section 119',
    fine: '₹500 - ₹5000',
    off: 'Multi-Modal Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 119',
    fineHi: '₹500 - ₹5000',
    offHi: 'मल्टी-मोडल उल्लंघन'
  },
  theory:
    '<h2>Multi-Modal Chaos!</h2><p>Sab kuch road pe hai — bus ruk rahi hai, truck mud raha hai, auto beech mein ghus raha hai, bike side se ja rahi hai!</p><p>Multi-modal traffic mein har vehicle ka different behavior hai. Bus achanak rukegi — distance rakho. Truck slow turn lega — usko space do. Auto randomly lane change karega — expect karo. Bike choti hai — blind spot mein aa sakti hai!</p><h3>🌪️ Kya karna hai?</h3><li>Buses se distance rakho — achanak ruk sakti hain.</li><li>Trucks ko turning space do.</li><li>Autos aur bikes ke liye hamesha ready raho.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Multi-modal chaos mein violation MV Act Section 119 ke under ₹500 se ₹5000 tak ka fine!</p>',
  pract: 'Maintain safe distance from all vehicle types. Predict auto and bike movements. Navigate through the chaos.',
  mode: 'practical',
  themeType: 'multi_modal',
  startOutside: true,
  tasks: [
    { id: 'bus_dist', text: 'Keep distance from buses', type: 'avoid', target: 'bus_collision', done: false },
    { id: 'truck_space', text: 'Give trucks turning space', type: 'avoid', target: 'truck_collision', done: false },
    { id: 'complete', text: 'Navigate through chaos', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
