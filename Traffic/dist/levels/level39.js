window.LVS = window.LVS || []
window.LVS.push({
  id: 39,
  icon: '🚲',
  name: 'Lesson 39 - Cyclist Safety!',
  modes: ['car', 'bike'],
  col: '#2ecc71',
  ds: 'A cyclist is riding on the left side of the road. You need to pass safely with at least 1 meter of space. Never overtake near an intersection.',
  hps: ['Give cyclists at least 1 meter of space when passing.', 'Never overtake a cyclist near an intersection or turning.', 'Cyclists may swerve to avoid potholes — expect the unexpected.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹500 - ₹2000',
    off: 'Cyclist Safety Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹500 - ₹2000',
    offHi: 'साइकिल चालक सुरक्षा उल्लंघन'
  },
  theory:
    '<h2>Cyclist Safety!</h2><p>Sadak pe ek cyclist chal raha hai — tumhe usko pass karna hai. Lekin 1 meter ki doori rakhni hai!</p><p>Cyclists bahut vulnerable hote hain — unhe 1 meter ki jagah do. Intersection ke paas overtake mat karo — cyclist suddenly mud sakta hai. Pothole dikhe toh cyclist suddenly side pe aa sakta hai!</p><h3>🚲 Kya karna hai?</h3><ul><li>1 meter ki doori rakho cyclist se!</li><li>Intersection ke paas overtake mat karo.</li><li>Cyclist ke sudden movements ke liye ready raho.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Cyclist safety ka violation MV Act Section 117 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Maintain 1 meter space when passing. Do not overtake near intersections. Wait for a clear, safe opportunity.',
  mode: 'practical',
  themeType: 'cyclist',
  hasCyclist: true,
  npcDensity: 'moderate',
  scenarioType: 'mixed',
  startOutside: true,
  tasks: [
    { id: 'keep_space', text: 'Keep 1m space from cyclist', type: 'avoid', target: 'safe_distance', done: false },
    { id: 'no_overtake', text: 'No overtake near intersection', type: 'avoid', target: 'overtake', done: false },
    { id: 'pass_safe', text: 'Pass safely when clear', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
