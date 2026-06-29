window.LVS = window.LVS || []
window.LVS.push({
  id: 7,
  icon: '🤫',
  name: 'Lesson 7 - Hospital Zone Silence',
  modes: ['car'],
  col: '#2ecc71',
  ds: "You are driving past a hospital. A 'Silence Zone' sign is visible. An NPC ahead is braking suddenly. Do not honk — slow down and maintain distance.",
  hps: [
    'Hospitals are legally declared Silence Zones — honking is banned.',
    'Maintain extra following distance to avoid sudden braking.',
    'Patients recovering need quiet — your horn disrupts their recovery.'
  ],
  law: {
    sec: 'MV Act Section 118 & Noise Pollution Rules',
    fine: '₹1000 - ₹5000',
    off: 'Honking in Silence Zone',
    secHi: 'मोटर वाहन अधिनियम धारा 118 एवं ध्वनि प्रदूषण नियम',
    fineHi: '₹1000 - ₹5000',
    offHi: 'शांति क्षेत्र में हॉर्न बजाना'
  },
  theory:
    "<h2>Hospital Zone Silence</h2><p>Hospital ke paas honk karna mana hai — yeh 'Silence Zone' hai! Socho, koi patient recovery kar raha hai aur tumhari horn ki awaaz se uski neend udd jaayegi.</p><p>Aage wali gaadi suddenly brake maar rahi hai — tumhara mann karega horn dabao! Lekin nahi, nahi karna. Slow jao, distance banao, bas!</p><h3>🤫 Kya karna hai?</h3><ul><li>Hospital ke paas gaadi achanak brake maar rahi hai — darr mat, slow ho jao!</li><li>Horn mat dabao chahe kitna bhi mann kare.</li><li>Safe distance banao — ekdum peeche raho.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Silence Zone mein honk karna MV Act Section 118 aur Noise Pollution Rules ke under hai — ₹1000 se ₹5000 tak ka fine!</p>",
  pract: 'Do not honk. Slow down, maintain distance, and drive silently past the hospital.',
  mode: 'practical',
  themeType: 'no_honking',
  startOutside: true,
  tasks: [
    { id: 'no_honk', text: 'Do not honk in silence zone', type: 'avoid', target: 'honk', done: false },
    { id: 'slow_down', text: 'Slow down near hospital', type: 'avoid', target: 'speed_hospital', done: false },
    { id: 'maintain_dist', text: 'Maintain safe following distance', type: 'avoid', target: 'collision', done: false }
  ]
})
