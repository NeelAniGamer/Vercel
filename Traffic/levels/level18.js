window.LVS = window.LVS || [];
window.LVS.push({
  "id": 18,
  "icon": "🎒",
  "name": "Lesson 18 - School Zone Puddles",
  "modes": ["pedestrian", "car"],
  "col": "#9b59b6",
  "ds": "School children in uniforms are walking through puddles on their way home. They are in groups, chatting, and not paying attention to traffic. Slow down to a crawl.",
  "hps": [
    "School children are easily distracted — they may change direction suddenly.",
    "A splash on a school child is worse than on an adult — they are more vulnerable.",
    "School zones have speed limits even in rain — 20 km/h maximum."
  ],
  "law": {
    "sec": "MV Act Section 196 & Civic Sense",
    "fine": "₹1000 - ₹5000",
    "off": "Splashing Children in School Zone"
  },
  "theory": "<h2>School Zone Puddles</h2><p>School chhutti ho gayi hai aur baarish ho rahi hai. Bachche uniform mein puddles ke beech se ghar ja rahe hain — sab group mein hain, baatein kar rahe hain, traffic ka dhyan nahi de rahe!</p><p>Ek bachcha abhi deep puddle mein kadam rakhne wala hai — tumhari saamne! Agar tum tez jaoge toh sab bheeg jaayenge. Bachche bade vulnerable hain — unhe bheegna ya darr lagna bilkul galat hai.</p><h3>🎒 Kya karna hai?</h3><ul><li>Bachche groups mein hain, baatein kar rahe hain — traffic ka dhyan nahi de rahe!</li><li>Ek bachcha deep puddle mein kadam rakhne wala hai — ruk jao!</li><li>20 km/h se zyada mat chalao — school zone hai!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>School zone mein bachon ko bheegna MV Act Section 196 aur civic sense laws ke under ₹1000 se ₹5000 tak ka fine!</p>",
  "pract": "Crawl through the school zone. Wait for children to clear your path. Do not splash them.",
  "mode": "practical",
  "themeType": "puddle_etiquette",
  "startOutside": true,
  "tasks": [
    { "id": "crawl_zone", "text": "Crawl through school zone", "type": "avoid", "target": "speed_zone", "done": false },
    { "id": "wait_children", "text": "Wait for children to clear", "type": "stop", "target": "stationary", "done": false },
    { "id": "no_splash_kids", "text": "Do not splash school children", "type": "avoid", "target": "pedestrian", "done": false }
  ]
});
