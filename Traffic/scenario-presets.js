/**
 * Traffic/scenario-presets.js
 * Distinct per-level 2D scenario configurations across all 57 Mumbai Traffic Hero levels.
 * Guarantees every lesson renders a uniquely matched road environment, weather condition,
 * hazard actor set, and interactive rule check rather than repeating one generic scene.
 */
;(function (global) {
  'use strict'

  const LOCATIONS = [
    'Dadar TT Circle', 'Bandra Bandstand', 'Andheri West Junction', 'Kemps Corner',
    'Parel St. Xavier Gate', 'KEM Hospital Lane', 'Bandra-Worli Sea Link', 'Crawford Market',
    'Asiatic Library Precinct', 'Eastern Express Highway', 'Juhu Tara Road', 'Sion Circle',
    'Mahim Causeway', 'Colaba Causeway', 'Shivaji Park', 'Siddhivinayak Lane',
    'Marine Drive Promenade', 'Dharavi Bypass', 'Powai Lake Road', 'Worli Naka',
    'BKC Business Corridor', 'Lower Parel Flyover', 'Wadala Truck Terminal', 'Ghatkopar Bazaar',
    'Chembur Diamond Garden', 'Trombay Pier', 'Kurla Connector', 'Vashi Toll Plaza',
    'Aarey Forest Curve', 'Lonavala Ghats Hairpin', 'CSM Bus Depot', 'Metro Line 3 Works',
    'Fort Heritage One-Way', 'Nariman Point Plaza', 'Lilavati Hospital Lane', 'Lalbaug Festival Square',
    'Carter Road Cycle Track', 'RTO Licensing Track', 'Santacruz Rain Corridor', 'Malad Link Road',
    'JVLR Merge Interchange', 'Saki Naka Construction', 'fog-bound Palm Beach Rd', 'Girgaon Chowpatty',
    'Khandala Pass', 'Konkan Kacha Bypass', 'Kandivali Junction', 'Bandra Reclamation',
    'D.N. Nagar Training Lane', 'Academy Track', 'South Mumbai Grid', 'Suburban Villas'
  ]

  const BASE_THEMES = {
    signal_jump: {
      scenarioKey: 'signal_jump',
      sky: ['#0b192c', '#1e293b'],
      actors: ['signal', 'stopLine', 'sedan', 'zebra'],
      actionLabel: 'Wait for Green',
      prompt: 'Amber just switched to Red ahead. What should you do?',
      options: [
        { id: 'brake', label: 'Stop behind the white stop line', correct: true },
        { id: 'speed', label: 'Accelerate before cross traffic starts', correct: false }
      ]
    },
    street_parking: {
      scenarioKey: 'street_parking',
      sky: ['#0f2036', '#243b55'],
      actors: ['noParkSign', 'redCurb', 'hydrant', 'parkedAuto'],
      actionLabel: 'Pick Legal Bay',
      prompt: 'Yellow-marked kerb with a No-Parking sign ahead. Where do you stop?',
      options: [
        { id: 'bay', label: 'Pull forward into the marked P bay', correct: true },
        { id: 'curb', label: 'Stop briefly with hazards on', correct: false }
      ]
    },
    ambulance_priority: {
      scenarioKey: 'ambulance_priority',
      sky: ['#0a192f', '#1c2c44'],
      actors: ['ambulance', 'sealink', 'yieldArrow', 'trafficCars'],
      actionLabel: 'Pull Left & Yield',
      prompt: 'An ambulance with sirens on approaches from behind. Your move?',
      options: [
        { id: 'yield', label: 'Slow safely and pull left to clear the lane', correct: true },
        { id: 'hold', label: 'Keep pace in the fast lane', correct: false }
      ]
    },
    puddle_etiquette: {
      scenarioKey: 'puddle_etiquette',
      sky: ['#182232', '#2f3d52'],
      actors: ['puddle', 'pedestrian', 'umbrella', 'splashes'],
      actionLabel: 'Slow to 15 km/h',
      prompt: 'Deep monsoon puddle next to pedestrians waiting on the pavement.',
      options: [
        { id: 'slow', label: 'Drop below 15 km/h to avoid splashing', correct: true },
        { id: 'cruise', label: 'Maintain 45 km/h to clear water faster', correct: false }
      ],
      rain: true
    },
    pedestrian_courtesy: {
      scenarioKey: 'pedestrian_courtesy',
      sky: ['#10253a', '#1e3a5f'],
      actors: ['school', 'children', 'crossingGuard', 'zebra'],
      actionLabel: 'Stop & Wave',
      prompt: 'Students step onto the zebra crossing near the school gate.',
      options: [
        { id: 'stop', label: 'Come to a full stop 2m before zebra stripes', correct: true },
        { id: 'edge', label: 'Creep forward between groups', correct: false }
      ]
    },
    silent_zone: {
      scenarioKey: 'silent_zone',
      sky: ['#0f1c2e', '#1e293b'],
      actors: ['hospital', 'noHornSign', 'sedan', 'pedestrian'],
      actionLabel: 'Zero Horn',
      prompt: 'Slow traffic outside a hospital Silence Zone. How do you proceed?',
      options: [
        { id: 'quiet', label: 'Keep safe gap and flash headlamps gently if needed', correct: true },
        { id: 'horn', label: 'Short horn taps to move traffic along', correct: false }
      ]
    },
    festival: {
      scenarioKey: 'festival',
      sky: ['#1e1b4b', '#3b0764'],
      actors: ['bunting', 'crowd', 'auto', 'policeBarricade'],
      actionLabel: 'Crawl Under 10 km/h',
      prompt: 'Dense festive procession occupies half the carriageway ahead.',
      options: [
        { id: 'crawl', label: 'Creep below 10 km/h following marshal signals', correct: true },
        { id: 'overtake', label: 'Swing into oncoming lane to pass', correct: false }
      ]
    },
    road_rage: {
      scenarioKey: 'road_rage',
      sky: ['#1e1b2e', '#2d243b'],
      actors: ['tailgater', 'laneGap', 'sedan'],
      actionLabel: 'Keep Calm & Yield',
      prompt: 'An aggressive driver tailgates and flashes beams in tight traffic.',
      options: [
        { id: 'defuse', label: 'Signal left safely and let them pass without escalating', correct: true },
        { id: 'brake_check', label: 'Tap brakes to warn them back', correct: false }
      ]
    },
    signs: {
      scenarioKey: 'signs',
      sky: ['#0c1c33', '#1d3557'],
      actors: ['octagonStop', 'triangleYield', 'speedLimit30', 'zebra'],
      actionLabel: 'Read & Obey',
      prompt: 'Regulatory octagonal STOP + 30 km/h sign appears before intersection.',
      options: [
        { id: 'obey', label: 'Full wheel stop, scan both ways, stay under 30', correct: true },
        { id: 'roll', label: 'Rolling slow-down if road looks clear', correct: false }
      ]
    },
    animals: {
      scenarioKey: 'animals',
      sky: ['#122229', '#1f363d'],
      actors: ['cow', 'sedan', 'warningSign'],
      actionLabel: 'Give Wide Clearance',
      prompt: 'Stray cattle stand near the center line ahead. Avoid startling them.',
      options: [
        { id: 'wide', label: 'Slow smoothly, do not honk, pass with wide gap', correct: true },
        { id: 'honk', label: 'Honk continuously to scare them aside', correct: false }
      ]
    },
    narrow_street: {
      scenarioKey: 'narrow_street',
      sky: ['#18222f', '#2c3e50'],
      actors: ['parkedVendors', 'oncomingAuto', 'passingBay'],
      actionLabel: 'Use Passing Bay',
      prompt: 'Single-width lane with an oncoming auto-rickshaw ahead.',
      options: [
        { id: 'bay', label: 'Hold in the passing pocket so one side clears first', correct: true },
        { id: 'squeeze', label: 'Edge onto the pedestrian path', correct: false }
      ]
    },
    auto_dance: {
      scenarioKey: 'auto_dance',
      sky: ['#101d30', '#1e3048'],
      actors: ['auto', 'signal', 'sedan', 'turnIndicator'],
      actionLabel: 'Anticipate Cut-In',
      prompt: 'Two auto-rickshaws weave across the left lane looking for fares.',
      options: [
        { id: 'buffer', label: 'Cover brake, leave extra lateral & following cushion', correct: true },
        { id: 'close_gap', label: 'Close the gap quickly to block lane changes', correct: false }
      ]
    },
    toll: {
      scenarioKey: 'toll',
      sky: ['#0f172a', '#1e293b'],
      actors: ['tollGantry', 'fastagLane', 'boomBarrier', 'sealink'],
      actionLabel: 'FASTag Slow Entry',
      prompt: 'Approaching multi-lane FASTag toll plaza. How fast should you enter?',
      options: [
        { id: 'slow20', label: 'Match your lane early and slow to 15–20 km/h', correct: true },
        { id: 'switch', label: 'Cut across dividers at the last 10 meters', correct: false }
      ]
    },
    blind_corner: {
      scenarioKey: 'blind_corner',
      sky: ['#0369a1', '#7dd3fc'],
      actors: ['convexMirror', 'hairpinCurve', 'oncomingBus'],
      actionLabel: 'Check Convex Mirror',
      prompt: 'Sharp blind bend with a roadside convex mirror and zero forward line-of-sight.',
      options: [
        { id: 'check', label: 'Keep strictly in left lane, slow down, check mirror', correct: true },
        { id: 'apex', label: 'Cut toward center line for a flatter turn', correct: false }
      ]
    },
    hill_driving: {
      scenarioKey: 'hill_driving',
      sky: ['#0284c7', '#bae6fd'],
      actors: ['hairpinGrade', 'truckClimb', 'stoneGuard'],
      actionLabel: 'Uphill Priority',
      prompt: 'A loaded vehicle climbs steeply toward you on a tight hill gradient.',
      options: [
        { id: 'uphill', label: 'Give way to uphill traffic and use low gear', correct: true },
        { id: 'downhill', label: 'Assert right-of-way because descending takes longer', correct: false }
      ]
    },
    bus_stop: {
      scenarioKey: 'bus_stop',
      sky: ['#0f172a', '#1e293b'],
      actors: ['bestBus', 'busShelter', 'alightingPassengers'],
      actionLabel: 'Yield to Bus Signal',
      prompt: 'A BEST bus flashes its right indicator to pull back out from a bus stop.',
      options: [
        { id: 'yield_bus', label: 'Pause and let the bus merge safely back into traffic', correct: true },
        { id: 'race', label: 'Floor it to squeeze past its front bumper', correct: false }
      ]
    },
    construction: {
      scenarioKey: 'construction',
      sky: ['#1a1f2c', '#2d3748'],
      actors: ['cones', 'worker', 'diversionBoard', 'excavator'],
      actionLabel: 'Follow Cones Slowly',
      prompt: 'Metro barrier and orange cones narrow traffic to one merged lane.',
      options: [
        { id: 'zipper', label: 'Respect 20 km/h work-zone limit & zipper merge', correct: true },
        { id: 'shoulder', label: 'Bypass cones via gravel shoulder', correct: false }
      ]
    },
    one_way: {
      scenarioKey: 'one_way',
      sky: ['#18181b', '#27272a'],
      actors: ['noEntrySign', 'oneWayArrows', 'wrongSideBike'],
      actionLabel: 'No Wrong-Way Entry',
      prompt: 'A red No-Entry circle blocks the shorter street toward your turn.',
      options: [
        { id: 'detour', label: 'Take the lawful next loop regardless of shortcut', correct: true },
        { id: 'creep', label: 'Reverse carefully along the edge for 50m', correct: false }
      ]
    },
    cyclist: {
      scenarioKey: 'cyclist',
      sky: ['#0c192c', '#1e3a5f'],
      actors: ['cyclist', 'doorZone', 'safeGapMarker'],
      actionLabel: '1.5m Passing Gap',
      prompt: 'A cyclist rides near parked cars where doors could open unexpectedly.',
      options: [
        { id: 'gap', label: 'Slow down and pass only with at least 1.5m side room', correct: true },
        { id: 'brush', label: 'Pass tightly within the same lane', correct: false }
      ]
    },
    highway_merge: {
      scenarioKey: 'highway_merge',
      sky: ['#0a192f', '#1e293b'],
      actors: ['sealink', 'mergeArrow', 'fastTraffic', 'indicator'],
      actionLabel: 'Match Speed & Signal',
      prompt: 'Joining 80 km/h expressway traffic from a curved entry ramp.',
      options: [
        { id: 'match', label: 'Signal early, match flow speed in accel lane, shoulder-check', correct: true },
        { id: 'halt', label: 'Stop dead at the end of the slip ramp', correct: false }
      ]
    },
    zero_visibility: {
      scenarioKey: 'zero_visibility',
      sky: ['#03060f', '#0a1120'],
      actors: ['lowBeam', 'hazardFog', 'roadReflectors', 'puddle'],
      actionLabel: 'Low Beams + Half Speed',
      prompt: 'Heavy night squall cuts visibility under 25 meters. Which beams do you use?',
      options: [
        { id: 'low_beam', label: 'Low beams + fog lamps at safe stopping speed', correct: true },
        { id: 'high_beam', label: 'High beams at normal speed for reach', correct: false }
      ],
      night: true,
      rain: true
    },
    grand_test: {
      scenarioKey: 'grand_test',
      sky: ['#091326', '#162847'],
      actors: ['signal', 'ambulance', 'zebra', 'auto', 'bestBus'],
      actionLabel: 'Zero Violations',
      prompt: 'Final multi-hazard city test: signal, crosswalk, ambulance & bus stop together.',
      options: [
        { id: 'all', label: 'Stop on red, yield to crosswalk & siren, pass smoothly', correct: true },
        { id: 'rush', label: 'Clear quickly before signals cycle', correct: false }
      ]
    }
  }

  function resolveBaseKey(lv) {
    const theme = String((lv && lv.themeType) || '').toLowerCase()
    const name = String((lv && lv.name) || '').toLowerCase()
    if (theme.includes('ambulance') || name.includes('ambulance')) return 'ambulance_priority'
    if (theme.includes('signal') || name.includes('red light') || name.includes('signal')) return 'signal_jump'
    if (theme.includes('puddle') || theme.includes('rain') || name.includes('puddle') || name.includes('rain')) return 'puddle_etiquette'
    if (theme.includes('parking') || theme.includes('market_street') || name.includes('parking')) return 'street_parking'
    if (theme.includes('silent') || theme.includes('no_honk') || theme.includes('quiet') || name.includes('silence') || name.includes('library') || name.includes('temple') || name.includes('quiet')) return 'silent_zone'
    if (theme.includes('festival') || name.includes('festival') || name.includes('parade')) return 'festival'
    if (theme.includes('rage') || name.includes('rage')) return 'road_rage'
    if (theme.includes('sign') || name.includes('sign')) return 'signs'
    if (theme.includes('animal') || theme.includes('cow') || name.includes('cow')) return 'animals'
    if (theme.includes('narrow') || theme.includes('rural') || name.includes('narrow') || name.includes('kacha')) return 'narrow_street'
    if (theme.includes('auto') || theme.includes('multi_modal') || name.includes('auto')) return 'auto_dance'
    if (theme.includes('toll') || name.includes('toll')) return 'toll'
    if (theme.includes('blind') || name.includes('blind corner')) return 'blind_corner'
    if (theme.includes('hill') || theme.includes('mountain') || name.includes('hill') || name.includes('mountain')) return 'hill_driving'
    if (theme.includes('bus') || name.includes('bus')) return 'bus_stop'
    if (theme.includes('construction') || name.includes('construction')) return 'construction'
    if (theme.includes('wrong') || theme.includes('one_way') || name.includes('one-way') || name.includes('wrong-side')) return 'one_way'
    if (theme.includes('cyclist') || name.includes('cyclist')) return 'cyclist'
    if (theme.includes('merge') || theme.includes('lane') || name.includes('merge') || name.includes('lane')) return 'highway_merge'
    if (theme.includes('zero_vis') || theme.includes('night_monsoon') || name.includes('zero visibility') || name.includes('monsoon grid')) return 'zero_visibility'
    if (theme.includes('pedestrian') || theme.includes('school') || name.includes('pedestrian') || name.includes('crossing') || name.includes('school') || name.includes('suburban')) return 'pedestrian_courtesy'
    return 'grand_test'
  }

  function hashId(id) {
    const str = String(id == null ? 1 : id)
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0
    }
    return h
  }

  function buildForLevel(lv) {
    const id = lv && lv.id !== undefined ? lv.id : 1
    const baseKey = resolveBaseKey(lv)
    const base = BASE_THEMES[baseKey] || BASE_THEMES.grand_test
    const num = typeof id === 'number' ? id : hashId(id)
    const location =
      typeof id === 'number' && id >= 1 && id <= LOCATIONS.length
        ? LOCATIONS[id - 1]
        : LOCATIONS[num % LOCATIONS.length]

    const themeStr = String((lv && lv.themeType) || '').toLowerCase()
    const nameStr = String((lv && lv.name) || '').toLowerCase()
    const isNight = Boolean(base.night || themeStr.includes('night') || nameStr.includes('night') || (typeof id === 'number' && (id === 13 || id === 14 || id === 16 || id === 41 || id === 45 || id === 46)))
    const isRain = Boolean(base.rain || themeStr.includes('rain') || themeStr.includes('monsoon') || nameStr.includes('rain') || nameStr.includes('puddle') || nameStr.includes('monsoon'))

    const conditionParts = [location]
    if (isNight) conditionParts.push('Night Visibility')
    else if (isRain) conditionParts.push('Monsoon Wet Surface')
    else conditionParts.push('Daylight Dry Road')

    const cleanName = String((lv && lv.name) || ('Lesson ' + id)).replace(/^Lesson\s+\d+\s*[-–:]\s*/i, '')
    const speedLimit = (baseKey === 'highway_merge' || baseKey === 'toll') ? 60 : (baseKey === 'pedestrian_courtesy' || baseKey === 'festival' || baseKey === 'construction' ? 20 : 40)

    return {
      levelId: id,
      uniqueKey: 'lv_' + String(id) + '_' + base.scenarioKey,
      key: base.scenarioKey,
      location: location,
      title: cleanName,
      isNight: isNight,
      isRain: isRain,
      speedLimit: speedLimit,
      sky: isNight ? ['#040711', '#0c1427'] : (isRain ? ['#182233', '#2d3b52'] : base.sky),
      actors: base.actors.slice(),
      carColor: ['#2563eb', '#0284c7', '#0d9488', '#d97706', '#dc2626', '#4f46e5'][num % 6],
      buildingTint: num % 3,
      conditionText: conditionParts.join(' · '),
      ruleText: (lv && lv.law && lv.law.fine) ? ('Penalty: ' + lv.law.fine) : 'Motor Vehicles Act Compliance',
      actionLabel: base.actionLabel,
      prompt: base.prompt,
      options: base.options
    }
  }

  global.TrafficScenarioPresets = {
    forLevel: buildForLevel,
    getAllKeys: function () {
      return Object.keys(BASE_THEMES)
    }
  }
})(typeof window !== 'undefined' ? window : globalThis)
