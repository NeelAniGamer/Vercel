window.LVS = window.LVS || []
window.LVS.push({
  id: 54,
  icon: '🏡',
  name: 'Lesson 54 - Suburban Avenue & Residential Safety',
  modes: ['car', 'bike', 'supercar_white', 'sports_cyan', 'bus_green', 'auto', 'pedestrian'],
  col: '#2ecc71',
  ds: 'Navigate through a vibrant low-poly suburban neighborhood with beautiful homes, driveways, garden hedges, parked cars, and pedestrians crossing.',
  hps: [
    'Residential Speed Limit is strictly 30 km/h.',
    'Watch out for vehicles backing out from residential driveways.',
    'Pedestrians, pets, and children have right of way on sidewalks and street crossings.',
    'Do not block driveways, fire hydrants, or mailboxes.'
  ],
  law: {
    sec: 'MV Act Section 112 & 183',
    fine: '₹1,000 - ₹2,000',
    off: 'Speeding in Residential / School Zone',
    secHi: 'मोटर वाहन अधिनियम धारा 112 और 183',
    fineHi: '₹1,000 - ₹2,000',
    offHi: 'आवासीय क्षेत्र में तेज़ गति से गाड़ी चलाना'
  },
  theory:
    '<h2>Suburban Residential Safety</h2><p>Suburban neighborhoods require defensive driving vigilance. Streets have children playing, pets crossing, and cars reversing from driveways with limited rear visibility.</p><p>Always maintain 30 km/h or below, yield right of way to pedestrians, and never park within 5 meters of fire hydrants or driveway curb cuts.</p>',
  pract: 'Drive down Suburban Avenue, obey the 30 km/h residential speed limit, and reach the finish destination safely.',
  mode: 'practical',
  themeType: 'suburban_neighborhood',
  isSuburbanNeighborhood: true,
  startOutside: true,
  speedLimit: 30,
  timeLimit: 120,
  roadLength: 320,
  roads: [
    { type: 'v', x: 0, z1: -160, z2: 160, lanes: 2, width: 14, speedLimit: 30, roadType: 'local' }
  ],
  route: [
    { x: 3.5, z: -140, desc: 'Start at Suburban Avenue Entrance' },
    { x: 3.5, z: -60, desc: 'Residential Checkpoint 1 (Near Maple Cottage)' },
    { x: 3.5, z: 20, desc: 'Residential Checkpoint 2 (Near Villa Gardens)' },
    { x: 3.5, z: 120, desc: 'Grand Finish Destination' }
  ],
  tasks: [
    { id: 'drive_suburban', text: 'Cruise down Suburban Avenue under 30 km/h', type: 'speed_limit', limit: 30, done: false },
    { id: 'reach_cp1', text: 'Reach Maple Cottage Checkpoint', type: 'reach', target: 'checkpoint_1', done: false },
    { id: 'reach_finish', text: 'Reach the Suburban Avenue Finish Gate', type: 'reach', target: 'finish', done: false }
  ],
  assets: ['house_lowpoly_isometric', 'house_mansion_lowpoly', 'suburban', 'street_props', 'cars']
})
