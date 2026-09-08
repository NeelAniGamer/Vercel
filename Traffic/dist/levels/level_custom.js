window.LVS = window.LVS || []
window.LVS.push({
  id: 'custom',
  icon: '🏡',
  name: 'Free Roam - Suburban Avenue & Villas',
  modes: ['car', 'bike', 'supercar_white', 'sports_cyan', 'bus_green', 'auto', 'pedestrian'],
  col: '#2ecc71',
  ds: 'Explore the newly added low-poly suburban neighborhood with mansions, cottages, driveways, garden hedges, and parked cars. No time limit.',
  hps: [
    'Enjoy the peaceful suburban atmosphere.',
    'Test different vehicles on the residential avenue.',
    'Cruise along the driveways and sidewalks.'
  ],
  law: {
    sec: 'Residential Zone',
    fine: '₹0',
    off: 'Free Roam Mode',
    secHi: 'आवासीय क्षेत्र',
    fineHi: '₹0',
    offHi: 'फ्री रोम मोड'
  },
  theory: '<h2>Suburban Free Roam</h2><p>Welcome to Suburban Avenue! Explore the residential houses, manicured lawns, hedges, mailboxes, and driveways freely.</p>',
  pract: 'Drive around freely and enjoy the suburban scenery.',
  mode: 'practical',
  themeType: 'suburban_neighborhood',
  isSuburbanNeighborhood: true,
  startOutside: true,
  roadLength: 360,
  roads: [
    { type: 'v', x: 0, z1: -180, z2: 180, lanes: 2, width: 14, speedLimit: 30, roadType: 'local' }
  ],
  route: [
    { x: 3.5, z: -150, desc: 'Suburban Avenue North' },
    { x: 3.5, z: 0, desc: 'Central Gardens' },
    { x: 3.5, z: 150, desc: 'Suburban Avenue South' }
  ],
  tasks: [{ type: 'free_roam', text: 'Explore Suburban Avenue freely' }],
  assets: ['house_lowpoly_isometric', 'house_mansion_lowpoly', 'suburban', 'street_props', 'cars']
})

