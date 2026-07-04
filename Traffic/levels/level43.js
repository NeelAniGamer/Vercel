window.LVS = window.LVS || []
window.LVS.push({
  id: 43,
  icon: '🛣️',
  name: 'Lesson 43 - Highway Merge Chaos!',
  modes: ['car'],
  col: '#3498db',
  ds: 'Merge onto a busy highway with heavy truck and bus traffic. Match speed, find gaps, and merge smoothly without causing accidents.',
  hps: ['Match highway speed before merging — never merge slow.', 'Check mirrors AND blind spot before changing lanes.', 'Trucks have large blind spots — never linger beside them.'],
  law: {
    sec: 'MV Act Section 126',
    fine: '₹1000 - ₹5000',
    off: 'Improper Lane Merging',
    secHi: 'मोटर वाहन अधिनियम धारा 126',
    fineHi: '₹1000 - ₹5000',
    offHi: 'गलत तरीके से लेन बदलना'
  },
  theory:
    '<h2>Highway Merge Chaos!</h2><p>Highway pe merge karna hai lekin trucks aur buses se bhara hai! Speed match karna hai, gap dhundna hai, aur smoothly merge karna hai!</p><p>Highway merging sabse dangerous hota hai agar speed match nahi kiya. Acceleration pe poori speed pakdo. Side mirror aur blind spot dono check karo. Trucks ke paas mat ruko — unko tum dikhte nahi!</p><h3>🛣️ Kya karna hai?</h3><ul><li>Speed match karo highway ki — slow merge mat karo!</li><li>Blind spot check karo — mirror ke alawa bhi dekho.</li><li>Trucks ke side se turant niklo — unke blind zone mein mat raho.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Improper lane merging MV Act Section 126 ke under ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Match speed on the ramp. Check blind spot. Find a gap and merge. Do not linger beside trucks.',
  mode: 'practical',
  themeType: 'highway_merge',
  startOutside: true,
  tasks: [
    { id: 'match_speed', text: 'Match highway speed', type: 'avoid', target: 'slow_merge', done: false },
    { id: 'blind_spot', text: 'Check blind spot', type: 'avoid', target: 'blind_spot_miss', done: false },
    { id: 'merge_safely', text: 'Merge into traffic', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
