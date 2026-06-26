const fs = require('fs');
const path = require('path');

const levels = [
  {
    id: 1,
    icon: '🚥',
    name: 'City Traffic & Junctions',
    modes: ['pedestrian', 'bike', 'car'],
    col: '#e74c3c',
    ds: 'Navigate busy city intersections. Stop at red lights, do not honk unnecessarily, and avoid the temptation of driving on footpaths.',
    hps: [
      'Stop behind the solid white line at signals.',
      'Honking in silence zones or unnecessarily carries a fine.',
      'Footpaths are strictly for pedestrians. Taking a shortcut is illegal.'
    ],
    law: { sec: 'MV Act Section 119 & 190(2)', fine: '₹500 - ₹2000', off: 'Signal/Honking/Footpath Violations' },
    theory: `<h2>Rule The Road: Urban Driving</h2>
      <p>Driving in a busy city requires patience and strict adherence to rules. Urban environments are full of unpredictable elements, from pedestrians crossing suddenly to vehicles stopping without warning.</p>
      
      <h3>🚦 Traffic Signals & Stop Lines</h3>
      <ul>
        <li><b>Red Light:</b> Complete stop <i>before</i> the stop line.</li>
        <li><b>Yellow Light:</b> Slow down and prepare to stop. Do not speed up to 'beat the light'.</li>
        <li><b>Green Light:</b> Proceed with caution, ensuring the intersection is clear.</li>
      </ul>

      <h3>🔕 Honking Rules</h3>
      <p>Honking should only be used to warn others of danger. Unnecessary honking causes noise pollution and stress.</p>
      <ul>
        <li>Do not honk in Silence Zones (near hospitals, schools, courts).</li>
        <li>Avoid continuous or aggressive honking in traffic jams.</li>
      </ul>

      <h3>🚶 Temptation & Shortcuts</h3>
      <p>In heavy traffic, there is often a temptation to take shortcuts like driving on the footpath or shoulder.</p>
      <ul>
        <li><b>Driving on Footpaths:</b> This is extremely dangerous and strictly illegal. Footpaths are for pedestrians only.</li>
        <li><b>Wrong Side Driving:</b> Never drive against the flow of traffic to save time.</li>
      </ul>`,
    pract: 'Complete the route through the city. Obey all red lights, do not honk unnecessarily, and stay on the road.',
    mode: 'practical'
  },
  {
    id: 2,
    icon: '🛣️',
    name: 'Highways & Fast Lanes',
    modes: ['pedestrian', 'bike', 'car'],
    col: '#3498db',
    ds: 'Master high-speed driving. Maintain lane discipline, use indicators for lane changes, and respect speed limits.',
    hps: [
      'The rightmost lane is only for overtaking.',
      'Always use indicators before changing lanes.',
      'Maintain a safe braking distance from the vehicle ahead.'
    ],
    law: { sec: 'MV Act Section 112 & 184', fine: '₹1000 - ₹2000', off: 'Speeding/Dangerous Driving' },
    theory: `<h2>Mastering The Highway</h2>
      <p>Highways and expressways require a different set of skills compared to city driving. Higher speeds mean less reaction time, making discipline critical.</p>

      <h3>🛣️ Lane Discipline</h3>
      <ul>
        <li><b>Left Lane:</b> For slow-moving traffic and heavy vehicles.</li>
        <li><b>Middle Lane(s):</b> For cruising at the speed limit.</li>
        <li><b>Right Lane:</b> The fast lane, strictly for overtaking. Return to the middle lane after overtaking.</li>
      </ul>

      <h3>📏 Following Distance (The 3-Second Rule)</h3>
      <p>Always maintain at least a 3-second gap between your vehicle and the one in front of you. In wet or slippery conditions, increase this to 5 seconds.</p>

      <h3>🏎️ Speed Limits & Overtaking</h3>
      <ul>
        <li>Never exceed the posted speed limit, even in the fast lane.</li>
        <li>Always overtake from the right side.</li>
        <li>Use your turn indicators at least 50 meters before changing lanes.</li>
      </ul>`,
    pract: 'Drive on the highway while staying within the speed limit. Practice safe lane changes using your indicators.',
    mode: 'practical'
  },
  {
    id: 3,
    icon: '🌧️',
    name: 'Weather & Night Conditions',
    modes: ['pedestrian', 'bike', 'car'],
    col: '#9b59b6',
    ds: 'Handle challenging visibility and road conditions. Turn on headlights, reduce speed, and avoid skidding.',
    hps: [
      'Turn on headlights at night or in heavy rain.',
      'Reduce speed by at least 30% on wet roads.',
      'Avoid sudden braking to prevent skidding.'
    ],
    law: { sec: 'MV Act Section 105', fine: '₹500', off: 'Driving without Lights' },
    theory: `<h2>Driving in Difficult Conditions</h2>
      <p>Rain, fog, and nighttime driving drastically reduce visibility and road grip. Adjusting your driving style is essential for safety.</p>

      <h3>🌧️ Wet Weather & Hydroplaning</h3>
      <ul>
        <li><b>Reduced Grip:</b> Tires lose traction on wet roads. Reduce your speed and avoid sharp turns.</li>
        <li><b>Hydroplaning:</b> If you drive too fast through standing water, your tires can lose contact with the road. If this happens, ease off the accelerator and steer straight. Do not brake hard.</li>
      </ul>

      <h3>🌙 Night Driving & Headlights</h3>
      <ul>
        <li>Always use headlights between sunset and sunrise, or during heavy rain.</li>
        <li><b>High Beam vs Low Beam:</b> Use low beams in city limits and when following or approaching another vehicle. High beams blind other drivers.</li>
        <li>Keep your windshield clean to reduce glare from oncoming lights.</li>
      </ul>`,
    pract: 'Complete the night-time rainy route. Keep headlights on and drive slowly to avoid skidding.',
    mode: 'practical'
  },
  {
    id: 4,
    icon: '🅿️',
    name: 'Parking & Reversing',
    modes: ['pedestrian', 'bike', 'car'],
    col: '#f1c40f',
    ds: 'Learn the rules of parking. Avoid No Parking zones, do not block intersections, and reverse safely.',
    hps: [
      'Never park near an intersection or bus stop.',
      'Check all mirrors and blind spots before reversing.',
      'Do not park on zebra crossings or footpaths.'
    ],
    law: { sec: 'MV Act Section 122', fine: '₹500 - ₹1000', off: 'Illegal Parking' },
    theory: `<h2>Parking Etiquette & Safety</h2>
      <p>Improper parking causes traffic congestion and endangers pedestrians. Knowing where and how to park is as important as knowing how to drive.</p>

      <h3>🚫 No Parking Zones</h3>
      <p>Never park your vehicle in the following locations:</p>
      <ul>
        <li>On a zebra crossing or footpath.</li>
        <li>Within 15 meters of an intersection or traffic signal.</li>
        <li>In front of a hospital, school, or fire station entrance.</li>
        <li>Alongside another parked car (Double Parking).</li>
      </ul>

      <h3>🔙 Reversing Safely</h3>
      <ul>
        <li>Always check your rearview mirrors and physically look behind you to check blind spots.</li>
        <li>Reverse slowly and be prepared to stop instantly.</li>
        <li>If visibility is poor, ask someone to guide you.</li>
      </ul>`,
    pract: 'Navigate through the tight streets and successfully park your vehicle in the designated spot without hitting obstacles.',
    mode: 'practical'
  },
  {
    id: 5,
    icon: '🚑',
    name: 'Emergency & Right of Way',
    modes: ['pedestrian', 'bike', 'car'],
    col: '#e67e22',
    ds: 'Understand who has the right of way. Give way to ambulances, fire engines, and pedestrians.',
    hps: [
      'Pull over to the left to let emergency vehicles pass.',
      'Pedestrians always have the right of way at uncontrolled crossings.',
      'Do not tailgate emergency vehicles.'
    ],
    law: { sec: 'MV Act Section 194E', fine: '₹10000', off: 'Blocking Emergency Vehicle' },
    theory: `<h2>Right of Way & Emergency Protocols</h2>
      <p>Right of way rules dictate who gets to go first in situations where paths cross. This prevents confusion and collisions.</p>

      <h3>🚑 Emergency Vehicles</h3>
      <p>Ambulances, fire engines, and police vehicles with flashing lights and sirens have the absolute right of way.</p>
      <ul>
        <li><b>What to do:</b> Immediately pull over to the left side of the road and stop until the vehicle passes.</li>
        <li><b>Penalty:</b> Blocking an emergency vehicle carries a massive fine (up to ₹10,000) and can cost lives.</li>
      </ul>

      <h3>🚶 Pedestrian Priority</h3>
      <ul>
        <li>Pedestrians have the right of way at all zebra crossings.</li>
        <li>In shared spaces or uncontrolled intersections, always yield to pedestrians and cyclists.</li>
      </ul>`,
    pract: 'Drive through the scenario. Yield to pedestrians and make way for any emergency vehicles that appear.',
    mode: 'practical'
  },
  {
    id: 6,
    icon: '🛑',
    name: 'Advanced Hazard Perception',
    modes: ['pedestrian', 'bike', 'car'],
    col: '#c0392b',
    ds: 'React to sudden hazards on the road. Avoid obstacles, stray animals, and unpredictable drivers.',
    hps: [
      'Scan the road ahead constantly.',
      'Expect the unexpected from other road users.',
      'Maintain control during sudden evasive maneuvers.'
    ],
    law: { sec: 'MV Act Section 279', fine: '₹1000 - ₹2000', off: 'Rash Driving' },
    theory: `<h2>Hazard Perception & Defensive Driving</h2>
      <p>Defensive driving means anticipating dangerous situations before they happen, despite the mistakes of others.</p>

      <h3>👀 Scanning & Anticipation</h3>
      <ul>
        <li>Don't just look at the car immediately in front of you. Scan 10-15 seconds ahead down the road.</li>
        <li>Watch out for parked cars with occupants—someone might open a door into your path.</li>
      </ul>

      <h3>🐕 Unpredictable Hazards</h3>
      <ul>
        <li>Stray animals or pedestrians may cross suddenly from blind spots.</li>
        <li>Other drivers may change lanes without indicating or brake abruptly.</li>
        <li><b>Action:</b> Always maintain a safe speed that allows you to stop or steer away from a hazard without losing control.</li>
      </ul>`,
    pract: 'Navigate a challenging route filled with sudden obstacles. Avoid collisions and maintain control.',
    mode: 'practical'
  }
];

levels.forEach(lv => {
  const content = 'window.LVS = window.LVS || [];\nwindow.LVS.push(' + JSON.stringify(lv, null, 2) + ');';
  fs.writeFileSync(path.join(__dirname, 'levels', `level${lv.id}.js`), content);
});
console.log('Successfully generated rich level files.');
