window.LVS = window.LVS || []
window.LVS.push({
  id: 53,
  icon: '🏙️',
  name: 'Bonus: Free Roam City',
  modes: ['car', 'bike', 'bus', 'truck', 'auto'],
  col: '#f1c40f',
  ds: 'Explore the low poly city freely. No tasks, no time limit. Just drive around and explore.',
  hps: [
    'Explore the city at your own pace.'
  ],
  law: {
    sec: 'Free Roam',
    fine: '₹0',
    off: 'No penalties in free roam',
    secHi: 'मुक्त घूमना',
    fineHi: '₹0',
    offHi: 'फ्री रोम में कोई जुर्माना नहीं'
  },
  theory:
    '<h2>Free Roam City Sandbox</h2><p>Experience the low poly city models in an open sandbox. Drive anywhere, test the vehicles, and enjoy the scenery.</p>',
  pract: 'Drive around the city and explore.',
  mode: 'practical',
  themeType: 'free_roam',
  startOutside: true,
  useLowPolyCity: true,
  tasks: [{ type: 'free_roam', text: 'Drive around and explore' }],
  npcs: [],
  assets: ['lowpoly_city']
})
