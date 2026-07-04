window.LVS = window.LVS || []
window.LVS.push({
  id: 21,
  icon: '🚦',
  name: 'Lesson 21 - Signal Discipline',
  modes: ['car'],
  col: '#e74c3c',
  ds: 'You approach a busy intersection with multiple signals. A delivery truck jumps the red light ahead of you. Stay disciplined — follow the rules even when others don\'t.',
  hps: ['Never follow a vehicle that jumps a red light.', 'Always check all directions before proceeding on green.', 'Yellow means slow down and prepare to stop, not speed up.'],
  law: {
    sec: 'MV Act Section 119',
    fine: '₹500 - ₹2000',
    off: 'Jumping Red Signal',
    secHi: 'मोटर वाहन अधिनियम धारा 119',
    fineHi: '₹500 - ₹2000',
    offHi: 'लाल बत्ती पार करना'
  },
  theory:
    '<h2>Signal Discipline</h2><p>Busy intersection hai aur delivery truck ne signal jump kar diya! Tumhare saamne aur gaadiyan bhi uske peeche ja rahi hain — bilkul galat!</p><p>Red light jump karna sabse khatarnak violations mein se ek hai. Koi bhi tumhare peeche aaye, tum follow mat karo!</p><h3>🚦 Kya karna hai?</h3><ul><li>Truck ne signal jump kiya — tum mat karo!</li><li>Red pe poori tarah se ruko.</li><li>Green pe sab taraf dekh kar proceed karo.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Signal jump karna MV Act Section 119 ke under illegal hai — ₹500 se ₹2000 tak ka fine!</p>',
  pract: 'Wait for the signal to turn green. Check all directions before proceeding. Do not follow the truck.',
  mode: 'practical',
  themeType: 'signal_jump',
  startOutside: true,
  tasks: [
    { id: 'stop_signal', text: 'Stop at red light', type: 'stop', target: 'red_light', done: false },
    { id: 'check_dirs', text: 'Check all directions', type: 'stop', target: 'look_around', done: false },
    { id: 'proceed_green', text: 'Proceed on green only', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
