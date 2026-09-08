window.LVS = window.LVS || []
window.LVS.push({
  id: 25,
  icon: '🔶',
  name: 'Lesson 25 - Know Your Signs!',
  modes: ['car', 'bike'],
  col: '#f39c12',
  ds: 'You encounter three types of road signs: blue mandatory signs, red cautionary signs, and green informational signs. Each requires a different response.',
  hps: ['Blue signs tell you what you MUST do.', 'Red signs warn you of dangers ahead.', 'Green signs provide information about distances and locations.'],
  law: {
    sec: 'MV Act Section 116',
    fine: '₹500 - ₹2000',
    off: 'Ignoring Road Signs',
    secHi: 'मोटर वाहन अधिनियम धारा 116',
    fineHi: '₹500 - ₹2000',
    offHi: 'सड़क संकेतों की अनदेखी'
  },
  theory:
    '<h2>Know Your Signs!</h2><p>Teen tarah ke road signs hain — blue, red, aur green. Har ek ka alag matlab hai!</p><p>Blue = Mandatory (karna hi hai). Red = Cautionary (khatra hai, dhyan do). Green = Informational (raasta dikha raha hai). Har sign ko samajhna zaroori hai!</p><h3>🔶 Kya karna hai?</h3><ul><li>Blue sign (mandatory) dekho — uska instruction follow karo!</li><li>Red sign (cautionary) dekho — slow down karo!</li><li>Green sign (informational) dekho — distance/location jaano.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Road signs ignore karna MV Act Section 116 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Obey the blue mandatory sign. Slow down for the red cautionary sign. Read the green informational sign.',
  mode: 'practical',
  themeType: 'signs',
  scenarioType: 'cars_only',
  npcDensity: 'light',
  startOutside: true,
  tasks: [
    { id: 'blue_sign', text: 'Obey mandatory sign', type: 'reach', target: 'blue_sign', done: false },
    { id: 'red_sign', text: 'Slow for cautionary sign', type: 'avoid', target: 'speed', done: false },
    { id: 'green_sign', text: 'Read informational sign', type: 'reach', target: 'green_sign', done: false }
  ],
  assets: ['suburban', 'industrial']
})
