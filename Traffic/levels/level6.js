window.LVS = window.LVS || []
window.LVS.push({
  id: 6,
  icon: '🏥',
  name: 'Lesson 6 - Hospital Zone Parking',
  modes: ['pedestrian', 'car', 'bike'],
  col: '#3498db',
  ds: 'You are near a hospital entrance. NPC ambulances need clear access. Do not park within 100 meters of the hospital gate — find a spot further away.',
  hps: [
    'Hospitals have a strict no-parking zone within 100 meters of the entrance.',
    'Ambulances need turning space — do not block driveways.',
    'Patient drop-off zones are for temporary stops only — do not linger.'
  ],
  law: {
    sec: 'MV Act Section 122 & Hospital Bye-laws',
    fine: '₹1000 - ₹3000',
    off: 'Parking Near Hospital',
    secHi: 'मोटर वाहन अधिनियम धारा 122 एवं अस्पताल उप-नियम',
    fineHi: '₹1000 - ₹3000',
    offHi: 'अस्पताल के पास पार्किंग'
  },
  theory:
    "<h2>Hospital Zone Parking</h2><p>Hospital ke paas parking karna bahut galat hai. Socho — kisi ka relative emergency mein aa raha hai aur tumhari gaadi raasta rok rahi hai? Bahut bura hoga!</p><p>Hospital ke gate ke 100 meter andar parking bilkul mana hai. Wahan ambulance ko ghumna padta hai — agar tumhari gaadi khadi hai toh wo nahi ja paayegi.</p><h3>🏥 Kya karna hai?</h3><ul><li>Hospital ke paas ek 'No Parking' board dikhega — uski izzat karo!</li><li>Legal parking 100 meter aage mil jaayegi — wahan lagao.</li><li>Ambulance ko raasta do — yeh kisi ki jaan bacha rahi hai!</li></ul><h3>⚖️ Kanoon kya kehta hai?</h3><p>Hospital ke 100 meter andar parking MV Act Section 122 ke under illegal hai — ₹1000 se ₹3000 tak ka fine!</p>",
  pract: 'Drive past the hospital. Park in a legal spot at least 100 meters away. Walk back.',
  mode: 'practical',
  themeType: 'respectful_parking',
  hasSilentZone: true,
  hasHospital: true,
  silentZ1: 30,
  silentZ2: 80,
  scenarioType: 'cars_only',
  startOutside: true,
  tasks: [
    { id: 'avoid_hospital', text: 'Do not park within 100m of hospital', type: 'avoid', target: 'hospital_zone', done: false },
    { id: 'find_legal', text: 'Find parking 100m+ away', type: 'reach', target: 'parking_spot', done: false },
    { id: 'walk_back', text: 'Walk back to hospital', type: 'reach', target: 'destination', done: false }
  ],
  assets: ['suburban', 'industrial', 'trains']
})
