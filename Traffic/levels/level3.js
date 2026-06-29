window.LVS = window.LVS || [];
window.LVS.push({
  "id": 3,
  "icon": "🚑",
  "name": "Lesson 3 - Ambulance on a Busy Road",
  "modes": ["pedestrian", "car"],
  "col": "#e74c3c",
  "ds": "Emergency vehicles need a clear path. On a busy road, your quick reaction can save a life.",
  "hps": [
    "Pull over left immediately when you hear sirens — don't wait for the ambulance to be right behind you.",
    "Stop completely, not just slow down. The ambulance needs a clear lane.",
    "NPCs ahead may panic and swerve — stay predictable."
  ],
  "law": {
    "sec": "MV Act Section 194E",
    "fine": "₹10000",
    "off": "Blocking Emergency Vehicle"
  },
  "theory": "<h2>Ambulance on a Busy Road</h2><p>Yaar, ambulance aa rahi hai — sirens baj rahi hain! Traffic aage panic mein hai — gaadiyaN idhar udhar ghoom rahi hain. Tumhein left side pe hatt ke poora rukna hai!</p><p>Ambulance ko clear path chahiye — agar tum ruke nahi toh kisi ki jaan ja sakti hai. Turant left pe jao aur poora ruk jao jab tak ambulance na guzar jaaye!</p><p>Emergency vehicle ko rasta na dena MV Act Section 194E ke under ₹10,000 ka fine hai — traffic code mein sabse zyada!</p><h3>🚑 Yaad rakho:</h3><ul><li>Ambulance ki sirens sunte hi left pe hatt jao!</li><li>Poora ruk jao — sirf slow karna kaafi nahi hai.</li><li>Peeche waali gaadiyaN swerve kar rahi hain — tum predictable raho!</li></ul>",
  "pract": "Pull over left and stop when you hear the ambulance siren. Do not move until it passes.",
  "mode": "practical",
  "themeType": "ambulance_priority",
  "startOutside": true,
  "tasks": [
    { "id": "pull_over", "text": "Pull over left immediately", "type": "reach", "target": "left_side", "done": false },
    { "id": "stop_complete", "text": "Stop completely", "type": "stop", "target": "stationary", "done": false },
    { "id": "wait_pass", "text": "Wait for ambulance to pass", "type": "avoid", "target": "ambulance", "done": false }
  ]
});