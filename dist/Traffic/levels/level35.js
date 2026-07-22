window.LVS = window.LVS || []
window.LVS.push({
  id: 35,
  icon: '➡️',
  name: 'Lesson 35 - One-Way Wonder!',
  modes: ['car', 'bike'],
  col: '#27ae60',
  ds: 'You approach a one-way street. Enter from the correct end, follow the flow of traffic, and exit at the intersection. Never go against traffic.',
  hps: ['One-way streets have a single direction of travel.', 'Entering from the wrong end is extremely dangerous.', 'Look for one-way signs (blue rectangular signs with arrow).'],
  law: {
    sec: 'MV Act Section 119',
    fine: '₹500 - ₹2000',
    off: 'One-Way Rules Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 119',
    fineHi: '₹500 - ₹2000',
    offHi: 'एक तरफ रास्ते का नियम तोड़ना'
  },
  theory:
    '<h2>One-Way Wonder!</h2><p>One-way street aa rahi hai — sahi end se ghuste ho aur traffic ke flow mein chalte ho!</p><p>One-way mein galat side se ghusna sabse khatarnak galti hai. Blue rectangular sign dekho — arrow dikha raha hai kis direction mein jaana hai. Flow follow karo!</p><h3>➡️ Kya karna hai?</h3><ul><li>Sahi end se one-way mein ghuste ho.</li><li>Traffic ke flow mein chalo — opposite mat jaao.</li><li>Intersection pe exit karo.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>One-way rules todna MV Act Section 119 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Enter the one-way from the correct end. Follow the traffic flow. Exit at the designated intersection.',
  mode: 'practical',
  themeType: 'one_way',
  scenarioType: 'cars_only',
  npcDensity: 'moderate',
  startOutside: true,
  tasks: [
    { id: 'correct_entry', text: 'Enter from correct end', type: 'reach', target: 'one_way_entry', done: false },
    { id: 'follow_flow', text: 'Follow traffic flow', type: 'reach', target: 'one_way_flow', done: false },
    { id: 'exit_intersection', text: 'Exit at intersection', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
