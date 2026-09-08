window.LVS = window.LVS || []
window.LVS.push({
  id: 52,
  icon: '🎓',
  name: 'Lesson 52 - Driving Instructor',
  modes: ['car'],
  col: '#2980b9',
  ds: 'A structured driving lesson: change lanes to overtake a slow bus, then signal and merge back. Practice controlled lane changes with proper indicators.',
  hps: [
    'Always indicate before changing lanes.',
    'Check mirrors and blind spots before merging.',
    'Overtake on the right side (India drives on the left).',
    'Merge back smoothly after passing the vehicle.'
  ],
  law: {
    sec: 'MV Act Section 136 - Overtaking Rules',
    fine: '₹5000',
    off: 'Improper Overtaking / Lane Change Without Signal',
    secHi: 'मोटर वाहन अधिनियम धारा 136 - ओवरटेकिंग नियम',
    fineHi: '₹5000',
    offHi: 'बिना सिग्नल के लेन बदलना / गलत ओवरटेकिंग'
  },
  theory:
    '<h2>Driving Instructor - Lane Change Lesson</h2><p>Driving school mein aaj lane change seekh rahe ho. Highway pe ek slow bus hai — usko overtake karna hai, phir wapas apni lane mein aana hai.</p><p>Har step ka order fixed hai: pehle indicator, phir mirror check, phir lane change. Galat order = challan!</p><h3>🚗 Kya karna hai?</h3><ol><li>Right indicator on karo — batana hai ki right side jaana hai.</li><li>Left lane mein jao — bus ko right se overtake karo.</li><li>Bus pass ho jaaye toh left indicator on karo.</li><li>Wapas right lane mein merge karo — smoothly!</li></ol><h3>⚖️ Kanoon kya kehta hai?</h3><p>MV Act Section 136 ke under bina signal ke lane change karna = ₹5,000 fine. Overtake sirf right side se karo (India left-hand drive).</p>',
  pract: 'Signal right, merge left to overtake the bus, then signal left and merge back to the right lane.',
  mode: 'practical',
  themeType: 'driving_school',
  startOutside: true,
  tasks: [
    { id: 'signal_right', text: 'Turn on right indicator', type: 'toggle', target: 'indicator_right', done: false },
    { id: 'change_left', text: 'Change to left lane', type: 'reach', target: 'left_lane_changed', done: false },
    { id: 'overtake_bus', text: 'Overtake the bus', type: 'reach', target: 'overtake_bus', done: false },
    { id: 'signal_left', text: 'Turn on left indicator to merge back', type: 'toggle', target: 'indicator', done: false },
    { id: 'merge_back', text: 'Merge back to right lane', type: 'reach', target: 'merged_back', done: false }
  ],
  npcs: [
    { type: 'bus', color: 0x2ecc71, route: [[-4, -30], [-4, 60]], speed: 0.06 }
  ],
  assets: ['suburban', 'industrial']
})
