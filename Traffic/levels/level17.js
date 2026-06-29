window.LVS = window.LVS || [];
window.LVS.push({
  "id": 17,
  "icon": "🚑",
  "name": "Lesson 17 - Traffic Jam Ambulance",
  "modes": ["car"],
  "col": "#e67e22",
  "ds": "Complete gridlock. An ambulance is trapped in the jam behind you. NPC drivers are not moving. You must create a path by inching forward and pulling as far left as possible.",
  "hps": [
    "Even in a jam, inch forward to create space ahead.",
    "Pull as far left as possible — even onto the curb if safe.",
    "Hazard lights on to warn traffic behind you."
  ],
  "law": {
    "sec": "MV Act Section 194E",
    "fine": "₹10000",
    "off": "Blocking Emergency Vehicle in Gridlock",
    "secHi": "मोटर वाहन अधिनियम धारा 194E",
    "fineHi": "₹10000",
    "offHi": "जाम में आपातकालीन वाहन को रोकना"
  },
  "theory": "<h2>Traffic Jam Ambulance</h2><p>Poori traffic jam hai — koi hil nahi raha! Aur abhi ek ambulance phasi hui hai 3 gaadiyon peechhe. Sirens baj rahi hain, kisi ki jaan bach rahi hai — lekin sab baith ke phone dekh rahe hain!</p><p>Jam mein bhi ambulance ko raasta dena padega. Tumhe thoda aage badhna hai aur left side pe hattana hai — chahe thoda curb pe chadhna bhi pade!</p><h3>🚑 Kya karna hai?</h3><ul><li>Traffic ekdum ruki hui hai — ambulance 3 gaadi peeche hai.</li><li>NPC baith ke phone dekh rahe hain — koi space nahi de raha.</li><li>Tumhe inch-by-inch aage badhna hai aur left pe hattana hai!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>MV Act Section 194E jam mein bhi lagu hai. Supreme Court ne bhi bola hai — sab drivers ko emergency vehicle ke liye raasta banana padega!</p>",
  "pract": "Turn on hazard lights. Inch forward. Pull left. Keep creating space until the ambulance passes.",
  "mode": "practical",
  "themeType": "ambulance_priority",
  "startOutside": true,
  "tasks": [
    { "id": "hazards_on", "text": "Turn on hazard lights", "type": "toggle", "target": "hazards", "done": false },
    { "id": "inch_forward", "text": "Inch forward to create space", "type": "reach", "target": "forward_space", "done": false },
    { "id": "pull_left", "text": "Pull as far left as possible", "type": "reach", "target": "left_side", "done": false }
  ]
});
