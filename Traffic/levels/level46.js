window.LVS = window.LVS || []
window.LVS.push({
  id: 46,
  icon: '🪔',
  name: 'Lesson 46 - Festival Night Parade!',
  modes: ['pedestrian', 'car'],
  col: '#9b59b6',
  ds: 'Night-time festival procession with lights, music, and crowds spilling onto the road. Navigate through Diwali celebrations safely.',
  hps: ['Festival night = distracted pedestrians everywhere.', 'Procession has priority — find an alternate route if needed.', 'Decorative lights can be distracting — focus on the road.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹1000 - ₹5000',
    off: 'Festival Night Violation',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹1000 - ₹5000',
    offHi: 'त्योहारी रात्रि उल्लंघन'
  },
  theory:
    '<h2>Festival Night Parade!</h2><p>Diwali ki raat hai — road pe julus nikal raha hai! Diya, lights, music, aur log sab road pe hain!</p><p>Festival nights mein log itne busy hote hain ki gaadiyan nahi dekhte. Procession ko priority do — alternate route dhundho. Decorative lights se distract mat ho — road pe focus karo. Speed bahut slow rakho!</p><h3>🪔 Kya karna hai?</h3><ul><li>Procession ko priority do — unka raasta chhodo!</li><li>Lights se distract mat ho — road pe focus karo.</li><li>Speed bahut slow rakho — log suddenly road pe aa sakte hain.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Festival night ka violation MV Act Section 117 ke under ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Yield to the procession. Find an alternate route. Avoid distracted pedestrians. Complete safely.',
  mode: 'practical',
  themeType: 'festival',
  npcDensity: 'heavy',
  crowdFestival: true,
  hasMusicVehicle: true,
  hasFestivalLights: true,
  hasPoliceVolunteer: true,
  isNight: true,
  startOutside: true,
  tasks: [
    { id: 'yield', text: 'Yield to procession', type: 'stop', target: 'procession', done: false },
    { id: 'no_distraction', text: 'Ignore decorative lights', type: 'avoid', target: 'distraction', done: false },
    { id: 'reach_dest', text: 'Reach destination', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
