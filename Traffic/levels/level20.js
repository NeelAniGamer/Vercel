window.LVS = window.LVS || []
window.LVS.push({
  id: 20,
  icon: '🧘',
  name: 'Lesson 20 - Temple & Prayer Zone',
  modes: ['car'],
  col: '#2ecc71',
  ds: 'You are driving past a temple during evening aarti. Devotees are gathered outside. A cow is sitting in the road. This is the ultimate test of your patience — no honking, no rushing.',
  hps: ['Temples are declared quiet zones during prayer hours.', 'Cows have the right of way in India — literally and legally.', 'Honking near a place of worship is deeply disrespectful.'],
  law: {
    sec: 'MV Act Section 118 & Religious Place Rules',
    fine: '₹2000 - ₹5000',
    off: 'Honking Near Place of Worship',
    secHi: 'मोटर वाहन अधिनियम धारा 118 एवं धार्मिक स्थल नियम',
    fineHi: '₹2000 - ₹5000',
    offHi: 'धार्मिक स्थल के पास हॉर्न बजाना'
  },
  theory:
    '<h2>Temple & Prayer Zone</h2><p>Aarti ho rahi hai aur temple ke saamne log jama ho gaye hain. Ek gaay seedha road ke beech mein baith gayi hai — peaceful hai, kuch nahi kar rahi. Aur peeche waali gaadiyan honk kar rahi hain — bilkul galat!</p><p>Temple ke paas prayer ke waqt honk karna sirf illegal nahi hai — yeh bahut disrespectful hai. Log prayer kar rahe hain, unki awaaz todo mat!</p><h3>🧘 Kya karna hai?</h3><ul><li>Gaay road pe baithi hai — patience rakho, hil jaayegi!</li><li>Peeche waali gaadiyan honk kar rahi hain — tum mat karo!</li><li>Temple ke paas se slowly aur silently guzar jao.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Temple ke paas honk karna MV Act Section 118 aur Religious Place Rules ke under illegal hai — ₹2000 se ₹5000 tak ka fine!</p>',
  pract: 'Wait for the cow to move. Drive past the temple slowly and silently. Do not honk under any circumstances.',
  mode: 'practical',
  themeType: 'no_honking',
  startOutside: true,
  tasks: [
    { id: 'wait_cow', text: 'Wait for cow to move', type: 'stop', target: 'stationary', done: false },
    { id: 'no_honk_temple', text: 'Do not honk near temple', type: 'avoid', target: 'honk', done: false },
    { id: 'drive_slow', text: 'Drive past slowly and silently', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
