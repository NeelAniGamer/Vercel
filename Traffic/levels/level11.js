window.LVS = window.LVS || []
window.LVS.push({
  id: 11,
  icon: '📚',
  name: 'Lesson 11 - Library Zone',
  modes: ['car', 'bike'],
  col: '#2ecc71',
  ds: 'You are passing a public library. Students are studying near open windows. An NPC is blocking the road ahead. Resist the urge to honk — wait patiently.',
  hps: [
    'Libraries are quiet zones — honking disrupts students and readers.',
    'The NPC blocking the road will eventually move — do not pressure them.',
    'Use your horn only in genuine emergencies, not for convenience.'
  ],
  law: {
    sec: 'MV Act Section 118 & Noise Pollution Rules',
    fine: '₹1000 - ₹5000',
    off: 'Honking Near Educational Institution',
    secHi: 'मोटर वाहन अधिनियम धारा 118 एवं ध्वनि प्रदूषण नियम',
    fineHi: '₹1000 - ₹5000',
    offHi: 'शैक्षणिक संस्था के पास हॉर्न बजाना'
  },
  theory:
    '<h2>Library Zone</h2><p>Library ke paas padhaai ho rahi hai — students khuli khidkiyon mein padh rahe hain. Tumhari horn ki awaaz seedha unke kaanon mein jaayegi!</p><p>Ek NPC gaadi galat tarike se khadi hai, road ka hissa block kar rahi hai. Students library ki khidkiyon mein dikh rahe hain — padh rahe hain. Tumhein bina honk ke wait karna hai jab tak woh hatt na jaaye!</p><h3>📚 Kya karna hai?</h3><ul><li>NPC gaadi galat jagah khadi hai — wait karo, horn mat bajao.</li><li>Students padh rahe hain — unki concentration mat todo.</li><li>NPC hatt jaaye toh quietly guzar jao.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Educational institution ke paas honk karna MV Act Section 118 aur Noise Pollution Rules ke under hai — ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Wait patiently for the NPC to move. Do not honk near the library.',
  mode: 'practical',
  themeType: 'no_honking',
  hasSilentZone: true,
  hasLibrary: true,
  silentZ1: -40,
  silentZ2: 20,
  scenarioType: 'cars_only',
  startOutside: true,
  tasks: [
    { id: 'no_honk', text: 'Do not honk near library', type: 'avoid', target: 'honk', done: false },
    { id: 'wait_npc', text: 'Wait for NPC to move', type: 'stop', target: 'stationary', done: false },
    { id: 'pass_quiet', text: 'Pass quietly', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
