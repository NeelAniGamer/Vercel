window.LVS = window.LVS || [];
window.LVS.push({
  "id": 15,
  "icon": "🏘️",
  "name": "Lesson 15 - Residential Parking",
  "modes": ["pedestrian", "car"],
  "col": "#3498db",
  "ds": "You are in a residential colony. A resident is blocking your path, pointing at your bumper — you are parked in front of their gate. Move your car to a visitor parking spot.",
  "hps": [
    "Never park in front of someone's gate — it blocks their entry/exit.",
    "Residential colonies often have designated visitor parking spots.",
    "Apologize and move immediately if a resident complains."
  ],
  "law": {
    "sec": "MV Act Section 122 & Society Rules",
    "fine": "₹500 - ₹1000",
    "off": "Blocking Residential Gate",
    "secHi": "मोटर वाहन अधिनियम धारा 122 एवं सोसायटी नियम",
    "fineHi": "₹500 - ₹1000",
    "offHi": "आवासीय गेट को रोकना"
  },
  "theory": "<h2>Residential Parking</h2><p>Residential colony mein parking karna easy nahi hai. Tumne kisi ke gate ke saamne gaadi lagayi hai — woh resident gussa ho raha hai! Socho, unhe emergency mein gaadi nikalni ho toh kya hoga?</p><p>Kisi ka gate block karna matlab unka raasta rokna. Yeh bilkul galat hai! Visitor parking 30 meter aage hai — wahan lagao.</p><h3>🏘️ Kya karna hai?</h3><ul><li>Tumne gate ke saamne gaadi lagayi hai — resident gussa hai — turant hato!</li><li>Visitor parking 30 meter aage hai — wahan lagao.</li><li>NPC residents tumhari gaadi society office mein report kar sakte hain!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Residential gate block karna MV Act Section 122 aur society rules ke under illegal hai — ₹500 se ₹1000 tak ka fine!</p>",
  "pract": "Move your car immediately. Park in the visitor parking zone. Walk to the objective.",
  "mode": "practical",
  "themeType": "respectful_parking",
  "startOutside": true,
  "tasks": [
    { "id": "move_gate", "text": "Move from resident's gate", "type": "reach", "target": "away_gate", "done": false },
    { "id": "find_visitor", "text": "Find visitor parking spot", "type": "reach", "target": "visitor_parking", "done": false },
    { "id": "walk_dest", "text": "Walk to destination", "type": "reach", "target": "destination", "done": false }
  ]
});
