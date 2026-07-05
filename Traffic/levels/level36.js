window.LVS = window.LVS || []
window.LVS.push({
  id: 36,
  icon: '🔶',
  name: 'Lesson 36 - Sign Recognition!',
  modes: ['car'],
  col: '#f39c12',
  ds: 'A complex intersection presents three sign types simultaneously. Identify mandatory (blue), cautionary (red), and informational (green) signs and respond to each correctly.',
  hps: ['Blue = Mandatory — you MUST follow the instruction.', 'Red = Cautionary — slow down and be alert.', 'Green = Informational — helps with navigation.'],
  law: {
    sec: 'MV Act Section 116',
    fine: '₹500 - ₹2000',
    off: 'Ignoring Road Signs',
    secHi: 'मोटर वाहन अधिनियम धारा 116',
    fineHi: '₹500 - ₹2000',
    offHi: 'सड़क संकेतों की अनदेखी'
  },
  theory:
    '<h2>Sign Recognition!</h2><p>Complex intersection pe teeno tarah ke signs ek saath dikh rahe hain — blue, red, aur green. Har ek ka alag jawab chahiye!</p><p>Blue sign = Mandatory — karo jo woh keh raha hai. Red sign = Cautionary — khatra hai, slow down. Green sign = Informational — raasta bata raha hai. Sab sign ko identify karo aur respond karo!</p><h3>🔶 Kya karna hai?</h3><ul><li>Blue mandatory sign ka instruction follow karo!</li><li>Red cautionary sign ke liye slow down!</li><li>Green informational sign se raasta jaano.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Road signs ignore karna MV Act Section 116 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Identify and obey the mandatory sign. Slow down for the cautionary sign. Use the informational sign for navigation.',
  mode: 'practical',
  themeType: 'signs',
  scenarioType: 'cars_only',
  npcDensity: 'light',
  startOutside: true,
  tasks: [
    { id: 'mandatory', text: 'Obey mandatory sign', type: 'reach', target: 'blue_sign', done: false },
    { id: 'cautionary', text: 'Slow for cautionary sign', type: 'avoid', target: 'speed', done: false },
    { id: 'informational', text: 'Follow informational sign', type: 'reach', target: 'green_sign', done: false }
  ],
  assets: ['suburban', 'industrial']
})
