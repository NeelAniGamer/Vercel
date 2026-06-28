const fs = require('fs');
const path = require('path');

const themes = [
  {
    ids: [1, 5, 14, 19],
    icon: '🚥',
    name: 'Pedestrian Courtesy',
    modes: ['pedestrian', 'car'],
    col: '#e74c3c',
    ds: 'You are stuck at a red light. NPC cars honk aggressively. Yield to pedestrians crossing safely. Do not follow the weaving bikes.',
    hps: [
      'Stop behind the solid white line at signals.',
      'Yield to pedestrians crossing.',
      'Do not follow traffic violators onto footpaths.'
    ],
    law: { sec: 'MV Act Section 119', fine: '₹500 - ₹2000', off: 'Signal/Footpath Violations' },
    theory: `<h2>Pedestrian Courtesy & Peer Pressure</h2>
      <p>In this scenario, impatient NPC drivers will try to pressure you into running a red light or taking illegal shortcuts like weaving onto the footpath.</p>
      <h3>🚥 The Test</h3>
      <ul>
        <li>You must wait patiently at the red light.</li>
        <li>Let all pedestrians cross safely.</li>
        <li>If you yield to the peer pressure and run the light, or if you drive on the footpath, you will receive a Challan.</li>
      </ul>`,
    pract: 'Wait at the red light despite the honking, and let the pedestrians cross safely.',
    mode: 'practical',
    themeType: 'pedestrian_courtesy'
  },
  {
    ids: [2, 6, 10, 15],
    icon: '🅿️',
    name: 'Respectful Parking',
    modes: ['pedestrian', 'car'],
    col: '#3498db',
    ds: 'The street is crowded. Avoid double-parking like the NPCs. Find a legal spot and walk to your destination.',
    hps: [
      'Do not double park on the road.',
      'Do not park on the footpath.',
      'Walk the remaining distance if legal parking is far.'
    ],
    law: { sec: 'MV Act Section 122', fine: '₹500 - ₹1000', off: 'Illegal Parking' },
    theory: `<h2>Respectful Parking</h2>
      <p>Your objective is a shop, but the street is crowded with illegally parked NPC vehicles.</p>
      <h3>🅿️ The Test</h3>
      <ul>
        <li>Do not dump your car on the footpath or double park.</li>
        <li>Find a designated parking zone, press F to exit, and walk.</li>
      </ul>`,
    pract: 'Park in a designated spot and walk to the objective.',
    mode: 'practical',
    themeType: 'respectful_parking'
  },
  {
    ids: [3, 8, 12, 17],
    icon: '🚑',
    name: 'Ambulance Priority',
    modes: ['car'],
    col: '#e67e22',
    ds: 'An ambulance with sirens blaring approaches from behind. Pull over safely to let it pass.',
    hps: [
      'Pull over to the left to let emergency vehicles pass.',
      'Do not tailgate the ambulance.',
      'Do not block the ambulance.'
    ],
    law: { sec: 'MV Act Section 194E', fine: '₹10000', off: 'Blocking Emergency Vehicle' },
    theory: `<h2>Ambulance Priority</h2>
      <p>An ambulance is trying to navigate through heavy traffic. Some selfish NPCs will block it.</p>
      <h3>🚑 The Test</h3>
      <ul>
        <li>Safely pull over to the shoulder to let the ambulance pass.</li>
        <li>Do not hit pedestrians while pulling over.</li>
        <li>Do not try to tailgate the ambulance to skip traffic.</li>
      </ul>`,
    pract: 'Pull over and let the ambulance pass safely.',
    mode: 'practical',
    themeType: 'ambulance_priority'
  },
  {
    ids: [4, 9, 13, 18],
    icon: '🌧️',
    name: 'Puddle Etiquette',
    modes: ['pedestrian', 'car'],
    col: '#9b59b6',
    ds: 'Large puddles have formed near the footpath. Slow down so you do not splash the pedestrians.',
    hps: [
      'Reduce speed significantly when passing puddles.',
      'Do not splash pedestrians.',
      'Maintain control on slippery roads.'
    ],
    law: { sec: 'Civic Sense', fine: 'Civic Penalty', off: 'Splashing Pedestrians' },
    theory: `<h2>Puddle Etiquette</h2>
      <p>It is raining and large puddles have formed next to the footpaths where pedestrians are walking.</p>
      <h3>🌧️ The Test</h3>
      <ul>
        <li>You must slow down your vehicle significantly when passing these puddles.</li>
        <li>If you speed through and splash a pedestrian, you fail the civic sense test.</li>
      </ul>`,
    pract: 'Drive through the rain. Slow down near puddles to avoid splashing pedestrians.',
    mode: 'practical',
    themeType: 'puddle_etiquette'
  },
  {
    ids: [7, 11, 16, 20],
    icon: '🔕',
    name: 'No Honking Zone',
    modes: ['car', 'auto'],
    col: '#f1c40f',
    ds: 'You are driving past a Hospital or School. Traffic is blocked. Do not honk!',
    hps: [
      'Do not honk in Silence Zones.',
      'Navigate around obstacles safely.',
      'Maintain patience in traffic jams.'
    ],
    law: { sec: 'MV Act Section 190(2)', fine: '₹1000', off: 'Honking in Silence Zone' },
    theory: `<h2>No Honking Zone</h2>
      <p>You are in a silent zone near a hospital. The traffic is blocked and other NPCs are honking aggressively.</p>
      <h3>🔕 The Test</h3>
      <ul>
        <li>Navigate around the obstacle without using your horn.</li>
        <li>If you give in to frustration and honk, you fail.</li>
      </ul>`,
    pract: 'Pass the hospital zone without honking once.',
    mode: 'practical',
    themeType: 'no_honking'
  }
];

const levels = [];
themes.forEach(theme => {
  theme.ids.forEach(id => {
    levels.push({
      id: id,
      icon: theme.icon,
      name: 'Lesson ' + id + ' - ' + theme.name,
      modes: theme.modes,
      col: theme.col,
      ds: theme.ds,
      hps: theme.hps,
      law: theme.law,
      theory: theme.theory,
      pract: theme.pract,
      mode: theme.mode,
      themeType: theme.themeType,
      startOutside: true
    });
  });
});

levels.sort((a, b) => a.id - b.id);

levels.forEach(lv => {
  const content = 'window.LVS = window.LVS || [];\nwindow.LVS.push(' + JSON.stringify(lv, null, 2) + ');';
  fs.writeFileSync(path.join(__dirname, 'levels', `level${lv.id}.js`), content);
});
console.log('Successfully generated 20 rich level files.');
