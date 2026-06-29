window.LVS = window.LVS || [];
window.LVS.push({
  "id": 9,
  "icon": "⛈️",
  "name": "Lesson 9 - Puddle at a Bus Stop",
  "modes": ["pedestrian", "car"],
  "col": "#9b59b6",
  "ds": "A bus stop is flooded. Commuters are huddled under the shelter, but some are wading through ankle-deep water to reach the road. You must not splash them.",
  "hps": [
    "Bus stops concentrate pedestrians — be extra cautious.",
    "Ankle-deep water means a large splash at even low speeds.",
    "Wait for commuters to clear the road before passing."
  ],
  "law": {
    "sec": "Civic Sense Act & Municipal Bye-laws",
    "fine": "Civic Penalty",
    "off": "Splashing Commuters at Bus Stop",
    "secHi": "नागरिक अनुशासन अधिनियम एवं नगर निगम उप-नियम",
    "fineHi": "नागरिक जुर्माना",
    "offHi": "बस स्टॉप पर यात्रियों पर पानी छींकना"
  },
  "theory": "<h2>Puddle at a Bus Stop</h2><p>Bus stop pe barish mein paani jam gaya hai! Log paani mein chal ke bus pakad rahe hain. Tumhari gaadi agar tez jaayegi toh sab bheeg jaayenge!</p><p>Paanch log paani mein khade hain bus stop pe. Ek bus abhi aayi hai — aur zyada log bhaag ke road cross kar rahe hain. Road dono taraf doobi hui hai — tumhe guzarna hai lekin bina kisi ko bheegaye!</p><h3>⛈️ Kya karna hai?</h3><ul><li>Paanch log paani mein hain — ruk jao, unhe clear hone do!</li><li>Bus aayi hai, aur log bhaag rahe hain — patience rakho.</li><li>Road flooded hai — slowly guzro, splash mat karo.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Bus stop ke logon ko bheegna civic offense hai — municipal bye-laws ke under fine lag sakta hai!</p>",
  "pract": "Wait for commuters to board the bus or clear the road. Pass slowly when the way is clear.",
  "mode": "practical",
  "themeType": "puddle_etiquette",
  "startOutside": true,
  "tasks": [
    { "id": "wait_clear", "text": "Wait for commuters to clear", "type": "stop", "target": "stationary", "done": false },
    { "id": "slow_pass", "text": "Pass slowly when clear", "type": "avoid", "target": "speed_puddle", "done": false },
    { "id": "no_splash", "text": "Do not splash commuters", "type": "avoid", "target": "pedestrian", "done": false }
  ]
});
