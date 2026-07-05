window.LVS = window.LVS || []
window.LVS.push({
  id: 22,
  icon: '😡',
  name: 'Lesson 22 - Road Rage Control',
  modes: ['car'],
  col: '#e74c3c',
  ds: 'A taxi driver cut you off aggressively. You feel angry. But road rage never helps — stay calm, give space, and drive safely.',
  hps: ['Road rage leads to accidents and legal trouble.', 'Give aggressive drivers extra space to avoid confrontation.', 'Horn abuse and tailgating escalate situations.'],
  law: {
    sec: 'MV Act Section 117',
    fine: '₹1000 - ₹5000',
    off: 'Aggressive Driving',
    secHi: 'मोटर वाहन अधिनियम धारा 117',
    fineHi: '₹1000 - ₹5000',
    offHi: 'आक्रामक ड्राइविंग'
  },
  theory:
    '<h2>Road Rage Control</h2><p>Taxi waale ne tumhe kaat liya — bilkul aggressive! Tumhe gussa aa raha hai, lekin road rage se kuch nahi hoga — sirf accident ya fight!</p><p>India mein road rage bahut common hai. Gussa chhodo, space do, aur safely drive karo. Koi tumhare upar chadh raha hai toh side ho jao!</p><h3>😡 Kya karna hai?</h3><ul><li>Gussa control karo — breathing slow karo!</li><li>Taxi ko space do — door raho.</li><li>Horn mat bajao baar baar — situation worse hogi!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Aggressive driving MV Act Section 117 ke under illegal hai — ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Stay calm. Give the taxi extra space. Do not honk back or tailgate. Drive safely to destination.',
  mode: 'practical',
  themeType: 'road_rage',
  scenarioType: 'cars_only',
  npcDensity: 'moderate',
  startOutside: true,
  tasks: [
    { id: 'stay_calm', text: 'Stay calm and patient', type: 'avoid', target: 'honk', done: false },
    { id: 'give_space', text: 'Give aggressive driver space', type: 'reach', target: 'safe_distance', done: false },
    { id: 'reach_dest', text: 'Reach destination safely', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
