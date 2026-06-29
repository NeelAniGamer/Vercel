window.LVS = window.LVS || [];
window.LVS.push({
  "id": 4,
  "icon": "🌧️",
  "name": "Lesson 4 - Puddle on the Main Road",
  "modes": ["pedestrian", "car"],
  "col": "#e74c3c",
  "ds": "After heavy rain, puddles form along footpath edges where pedestrians walk. Your speed determines the splash radius.",
  "hps": [
    "Slow down well before you reach a puddle — braking in it sends water everywhere.",
    "If pedestrians are near the edge, crawl past at walking pace.",
    "NPCs will speed through and splash everyone. Don't be them."
  ],
  "law": {
    "sec": "Municipal Bye-laws",
    "fine": "Varies by city",
    "off": "Splashing Pedestrians"
  },
  "theory": "<h2>Puddle on the Main Road</h2><p>Barish ke baad road ke edge pe bada puddle ban gaya hai. Pedestrians footpath ke edge pe chal rahe hain — aur saari gaadiyan tez se ja rahi hain, sabko bheega rahi hain!</p><p>Tumhari speed se splash ka size hota hai — agar slow jaoge toh paani udega nahi. Pedestrians ke paas se crawl karke guzar jao — walking pace!</p><p>Pedestrians ko bheegna municipal bye-laws ke under offense hai — repeat offenders ko community service bhi ho sakti hai!</p><h3>🌧️ Yaad rakho:</h3><ul><li>Puddles aage hai — pehle hi slow ho jao!</li><li>Pedestrians ke paas se walking pace pe guzar jao.</li><li>NPC gaadiyan speed se ja rahi hain, sab bheega rahi hain — tum mat bheego!</li></ul>",
  "pract": "Slow down before the puddle. Pass pedestrians at walking pace without splashing them.",
  "mode": "practical",
  "themeType": "puddle_etiquette",
  "startOutside": true,
  "tasks": [
    { "id": "slow_puddle", "text": "Slow down before puddle", "type": "avoid", "target": "speed_puddle", "done": false },
    { "id": "no_splash", "text": "Pass without splashing pedestrians", "type": "avoid", "target": "pedestrian", "done": false },
    { "id": "crawl_past", "text": "Crawl past at walking pace", "type": "stop", "target": "walking_speed", "done": false }
  ]
});