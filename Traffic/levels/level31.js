window.LVS = window.LVS || []
window.LVS.push({
  id: 31,
  icon: '👁️',
  name: 'Lesson 31 - Blind Corner!',
  modes: ['car'],
  col: '#e74c3c',
  ds: 'You approach a blind corner where you cannot see oncoming traffic. Honk once to warn others, then crawl around the corner.',
  hps: ['Blind corners are one of the most dangerous road situations.', 'One short honk warns oncoming traffic of your presence.', 'Crawl around blind corners — never drive at full speed.'],
  law: {
    sec: 'MV Act Section 117-118',
    fine: '₹1000 - ₹5000',
    off: 'Blind Corner Warning',
    secHi: 'मोटर वाहन अधिनियम धारा 117-118',
    fineHi: '₹1000 - ₹5000',
    offHi: 'अंधे कोने पर चेतावनी'
  },
  theory:
    '<h2>Blind Corner!</h2><p>Andha kona aa raha hai — saamne kya hai dikh nahi raha! Yeh sabse khatarnak situations mein se ek hai!</p><p>Blind corner pe ek baar horn bajao — taaki saamne waale ko pata chale tum aa rahe ho. Phir crawling speed pe corner round karo. Full speed pe mat jaao — collision ho sakti hai!</p><h3>👁️ Kya karna hai?</h3><ul><li>Corner se pehle ek baar HONK bajao!</li><li>Crawling speed pe corner round karo.</li><li>Saamne waali gaadi dikhe toh side do.</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Blind corner pe bina warning ke jaana MV Act Section 117-118 ke under illegal hai — ₹1000 se ₹5000 tak ka fine!</p>',
  pract: 'Honk once before the corner. Crawl around the corner at walking speed. Yield to any oncoming vehicle.',
  mode: 'practical',
  themeType: 'blind_corner',
  startOutside: true,
  tasks: [
    { id: 'honk_warn', text: 'Honk once to warn', type: 'toggle', target: 'honk', done: false },
    { id: 'crawl_corner', text: 'Crawl around corner', type: 'avoid', target: 'speed', done: false },
    { id: 'exit_safe', text: 'Exit corner safely', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial']
})
