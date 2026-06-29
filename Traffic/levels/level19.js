window.LVS = window.LVS || [];
window.LVS.push({
  "id": 19,
  "icon": "🎉",
  "name": "Lesson 19 - Festival Crowd",
  "modes": ["pedestrian", "car"],
  "col": "#e74c3c",
  "ds": "A festival procession has spilled onto the road. There are no traffic signals working — a police volunteer is directing traffic manually. Follow their signals exactly.",
  "hps": [
    "Follow the traffic volunteer's hand signals — they override broken signals.",
    "Festival crowds are unpredictable — maintain a crawling speed.",
    "Do not honk — it will only agitate the crowd and create panic."
  ],
  "law": {
    "sec": "MV Act Section 119(3)",
    "fine": "₹2000 - ₹5000",
    "off": "Ignoring Traffic Authority"
  },
  "theory": "<h2>Festival Crowd</h2><p>Ganesh Chaturthi ya Navratri ka juloos nikal raha hai! Log sadak pe aa gaye hain — dhol baj rahe hain, rang birangi gaadiyan hain. Traffic signals kaam nahi kar rahe — ek police volunteer traffic sambhal raha hai!</p><p>Bheed unpredictable hai — dhol ki awaaz se sab bhaag sakte hain! Police volunteer tumhe rukne ka signal de raha hai — NPC uski nahi sun rahe, lekin tum suno!</p><h3>🎉 Kya karna hai?</h3><ul><li>Bheed dense hai, dhol baj raha hai — log bhaag sakte hain!</li><li>Police volunteer rukne ka signal de raha hai — NPC uski nahi sun rahe, lekin tum suno!</li><li>Honk mat karo — bheed gussa ho jaayegi!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>MV Act Section 119(3) kehta hai — traffic volunteer ki baat nahi maani toh ₹2000 se ₹5000 tak ka fine!</p>",
  "pract": "Follow the traffic volunteer's signals. Crawl through the crowd. Do not honk.",
  "mode": "practical",
  "themeType": "pedestrian_courtesy",
  "startOutside": true,
  "tasks": [
    { "id": "follow_volunteer", "text": "Follow traffic volunteer signals", "type": "reach", "target": "volunteer_signal", "done": false },
    { "id": "crawl_crowd", "text": "Crawl through festival crowd", "type": "avoid", "target": "speed_festival", "done": false },
    { "id": "no_honk_fest", "text": "Do not honk at festival", "type": "avoid", "target": "honk", "done": false }
  ]
});
