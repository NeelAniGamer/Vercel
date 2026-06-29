window.LVS = window.LVS || [];
window.LVS.push({
  "id": 16,
  "icon": "🌙",
  "name": "Lesson 16 - Residential Night",
  "modes": ["car"],
  "col": "#2ecc71",
  "ds": "It is late at night in a residential colony. Your GPS is leading you through narrow lanes. A sleeping dog is lying in the middle of the road. Do not honk to wake it — slowly go around.",
  "hps": [
    "Night honking in residential areas violates noise regulations.",
    "A sleeping dog may wake startled and run under your wheels.",
    "Use your horn only if there is an immediate safety threat."
  ],
  "law": {
    "sec": "Noise Pollution Rules & MV Act Section 118",
    "fine": "₹1000 - ₹5000",
    "off": "Night Honking in Residential Area"
  },
  "theory": "<h2>Residential Night</h2><p>Raat ko residential colony mein honk karna galat hai aur illegal bhi! Log so rahe hain, aur sadak pe kutte soye hain — horn ki awaaz se sab kharab ho jaayega.</p><p>Tight gali hai, ek kutta road ke beech mein so raha hai. Peeche waali gaadi honk karna chahti hai — tum mat karo! Dheere dheere kutte ke paas se guzar jao.</p><h3>🌙 Kya karna hai?</h3><ul><li>Kutta road pe so raha hai — horn mat bajao, nind se utha dega!</li><li>Peeche waali gaadi honk kar rahi hai — unki mat suno.</li><li>Dheere se kutte ke paas se guzar jao — woh so jaaye!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Raat ko residential area mein honk karna Noise Pollution Rules aur MV Act Section 118 ke under illegal hai — ₹1000 se ₹5000 tak ka fine!</p>",
  "pract": "Drive slowly around the sleeping dog. Do not honk. Reach the main road quietly.",
  "mode": "practical",
  "themeType": "no_honking",
  "startOutside": true,
  "tasks": [
    { "id": "no_honk_night", "text": "Do not honk in residential night", "type": "avoid", "target": "honk", "done": false },
    { "id": "avoid_dog", "text": "Drive around sleeping dog", "type": "reach", "target": "past_dog", "done": false },
    { "id": "reach_main", "text": "Reach main road quietly", "type": "reach", "target": "main_road", "done": false }
  ]
});
