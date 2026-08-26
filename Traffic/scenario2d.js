/**
 * Scenario2D — Cinematic 2D intro for Traffic Simulator
 * Cartoon style, bold colors, matches low-poly 3D aesthetic
 * Shows player what to expect in the level
 */

;(function () {
  const Ease = {
    linear: (t) => t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeOutBack: (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) },
    easeOutElastic: (t) => { const c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1 },
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    bounce: (t) => { const n1 = 7.5625; const d1 = 2.75; if (t < 1 / d1) return n1 * t * t; else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; else return n1 * (t -= 2.625 / d1) * t + 0.984375; }
  }

  const hexToRgb = (hex) => {
    const h = hex.replace('#', '')
    return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) }
  }
  const rgbStr = (r, g, b, a = 1) => `rgba(${r},${g},${b},${a})`
  const lerpColor = (c1, c2, t) => {
    const a = hexToRgb(c1), b = hexToRgb(c2)
    return rgbStr(Math.round(a.r + (b.r - a.r) * t), Math.round(a.g + (b.g - a.g) * t), Math.round(a.b + (b.b - a.b) * t))
  }
  const rand = (min, max) => Math.random() * (max - min) + min
  const randInt = (min, max) => Math.floor(rand(min, max + 1))
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const lerp = (a, b, t) => a + (b - a) * t
  const darkenColor = (hex, factor) => { const c = hexToRgb(hex); return rgbStr(Math.round(c.r * factor), Math.round(c.g * factor), Math.round(c.b * factor)) }

  function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2
    ctx.beginPath()
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
  }

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO DEFINITIONS — What player will do in each level
  // ═══════════════════════════════════════════════════════════════

  const SCENARIOS = {
    signal_jump: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'], count: 10, minH: 100, maxH: 220 },
      vehicles: [
        { x: 0.15, y: 0.68, w: 55, h: 28, color: '#3498db', type: 'car', dir: 1, speed: 0 },
        { x: 0.75, y: 0.68, w: 50, h: 26, color: '#e74c3c', type: 'car', dir: -1, speed: 0 }
      ],
      trafficLight: { x: 0.5, y: 0.52, states: ['red', 'red', 'green'] },
      pedestrians: { count: 5, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD'], walkSpeed: 0.4 },
      focus: { x: 0.5, y: 0.65, zoom: 1.1 },
      headline: 'RED LIGHT PATIENCE',
      subline: 'Wait for the signal. Let them cross.',
      objectives: ['Stop at red light', 'Let pedestrians cross', 'Move on green only'],
      hazard: 'red_light',
      duration: 4000,
      sound: 'urban'
    },
    street_parking: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'], count: 12, minH: 80, maxH: 180 },
      parkedCars: [
        { x: 0.12, y: 0.7, w: 45, h: 22, color: '#95a5a6' },
        { x: 0.35, y: 0.7, w: 42, h: 21, color: '#7f8c8d' },
        { x: 0.65, y: 0.7, w: 44, h: 22, color: '#bdc3c7' }
      ],
      vehicles: [{ x: 0.45, y: 0.68, w: 52, h: 25, color: '#2ecc71', type: 'car', dir: 1, speed: 0.2 }],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'STREET PARKING',
      subline: 'Find legal parking. Mind the rules.',
      objectives: ['Find a parking spot', 'Check for no-parking signs', 'Park within lines'],
      hazard: 'parking',
      duration: 4000,
      sound: 'urban'
    },
    ambulance_priority: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'], count: 8, minH: 100, maxH: 240 },
      vehicles: [
        { x: 0.1, y: 0.68, w: 50, h: 25, color: '#34495e', type: 'car', dir: 1, speed: 0.3 },
        { x: 0.7, y: 0.68, w: 60, h: 28, color: '#fff', type: 'ambulance', dir: -1, speed: 1.0, siren: true }
      ],
      focus: { x: 0.65, y: 0.64, zoom: 1.1 },
      headline: 'AMBULANCE PRIORITY',
      subline: 'Pull over. Clear the way. Save lives.',
      objectives: ['Notice approaching ambulance', 'Pull to the side', 'Let it pass safely'],
      hazard: 'ambulance',
      duration: 5000,
      sound: 'siren'
    },
    puddle_etiquette: {
      sky: ['#7f8c8d', '#95a5a6'],
      ground: '#5d6d7e',
      road: { y: 0.72, lanes: 2, color: '#444', lineColor: '#aaa', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'], count: 8, minH: 80, maxH: 200 },
      puddles: [
        { x: 0.2, y: 0.74, w: 80, h: 14 },
        { x: 0.55, y: 0.75, w: 60, h: 12 },
        { x: 0.82, y: 0.73, w: 50, h: 10 }
      ],
      pedestrians: { count: 4, colors: ['#FF6B6B', '#4ECDC4', '#FFEAA7', '#DDA0DD'], walkSpeed: 0.5 },
      vehicles: [{ x: 0.3, y: 0.68, w: 50, h: 25, color: '#2980b9', type: 'car', dir: 1, speed: 0.2 }],
      focus: { x: 0.35, y: 0.68, zoom: 1.05 },
      headline: 'PUDDLE ETIQUETTE',
      subline: 'Slow down. Don\'t splash pedestrians.',
      objectives: ['Spot puddles ahead', 'Reduce speed near pedestrians', 'Avoid splashing'],
      hazard: 'puddle',
      duration: 5000,
      sound: 'rain'
    },
    pedestrian_courtesy: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'], count: 8, minH: 60, maxH: 160 },
      school: true,
      crosswalk: true,
      pedestrians: { count: 8, colors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'], walkSpeed: 0.4 },
      vehicles: [{ x: 0.2, y: 0.68, w: 50, h: 25, color: '#27ae60', type: 'car', dir: 1, speed: 0 }],
      focus: { x: 0.5, y: 0.62, zoom: 1.0 },
      headline: 'SCHOOL ZONE',
      subline: 'Children crossing. Stop and wait.',
      objectives: ['Slow down in school zone', 'Stop at crosswalk', 'Wait for all children'],
      hazard: 'children',
      duration: 5000,
      sound: 'school'
    },
    respectful_parking: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'], count: 8, minH: 80, maxH: 180 },
      hospital: true,
      vehicles: [{ x: 0.35, y: 0.68, w: 52, h: 25, color: '#c0392b', type: 'car', dir: 1, speed: 0.2 }],
      focus: { x: 0.4, y: 0.65, zoom: 1.0 },
      headline: 'HOSPITAL ZONE',
      subline: 'No honking. No parking. Be respectful.',
      objectives: ['Honk prohibited sign', 'Find legal parking', 'Keep engine quiet'],
      hazard: 'hospital',
      duration: 4000,
      sound: 'urban'
    },
    festival: {
      sky: ['#f39c12', '#e67e22'],
      ground: '#d4a574',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 20, dashGap: 15 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'], count: 10, minH: 80, maxH: 200 },
      decorations: true,
      pedestrians: { count: 12, colors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'], walkSpeed: 0.3 },
      vehicles: [{ x: 0.2, y: 0.68, w: 48, h: 24, color: '#8e44ad', type: 'car', dir: 1, speed: 0.15 }],
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'FESTIVAL CROWD',
      subline: 'Navigate slowly through the crowd.',
      objectives: ['Watch for pedestrians', 'Drive slowly', 'Honk only when needed'],
      hazard: 'crowd',
      duration: 6000,
      sound: 'festival'
    },
    night_driving: {
      sky: ['#1a1a2e', '#16213e'],
      ground: '#2c3e50',
      road: { y: 0.72, lanes: 3, color: '#333', lineColor: '#aaa', dashLen: 30, dashGap: 20 },
      buildings: { colors: ['#2c3e50', '#34495e', '#3d566e', '#4a6a8a'], count: 10, minH: 100, maxH: 240 },
      streetLights: true,
      vehicles: [
        { x: 0.15, y: 0.68, w: 50, h: 25, color: '#2980b9', type: 'car', dir: 1, speed: 0.4, headlights: true },
        { x: 0.75, y: 0.68, w: 48, h: 24, color: '#c0392b', type: 'car', dir: -1, speed: 0.3, headlights: true }
      ],
      focus: { x: 0.5, y: 0.65, zoom: 1.05 },
      headline: 'NIGHT DRIVING',
      subline: 'Use headlights. Stay alert.',
      objectives: ['Turn on headlights', 'Watch for pedestrians', 'Maintain safe distance'],
      hazard: 'dark',
      duration: 5000,
      sound: 'night'
    },
    rain_driving: {
      sky: ['#5d6d7e', '#85929e'],
      ground: '#5d6d7e',
      road: { y: 0.72, lanes: 3, color: '#444', lineColor: '#888', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'], count: 8, minH: 80, maxH: 200 },
      vehicles: [{ x: 0.25, y: 0.68, w: 52, h: 26, color: '#2c3e50', type: 'car', dir: 1, speed: 0.3, headlights: true }],
      focus: { x: 0.4, y: 0.66, zoom: 1.0 },
      headline: 'RAIN DRIVING',
      subline: 'Reduce speed. Increase distance.',
      objectives: ['Slow down in rain', 'Increase following distance', 'Watch for hydroplaning'],
      hazard: 'rain',
      duration: 5000,
      sound: 'rain'
    },
    highway_merge: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 4, color: '#555', lineColor: '#fff', dashLen: 35, dashGap: 25 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'], count: 4, minH: 60, maxH: 120 },
      highway: true,
      vehicles: [
        { x: 0.1, y: 0.66, w: 55, h: 26, color: '#2c3e50', type: 'car', dir: 1, speed: 0.6 },
        { x: 0.3, y: 0.7, w: 70, h: 30, color: '#7f8c8d', type: 'truck', dir: 1, speed: 0.4 },
        { x: 0.6, y: 0.66, w: 50, h: 24, color: '#c0392b', type: 'car', dir: 1, speed: 0.5 },
        { x: 0.85, y: 0.7, w: 65, h: 28, color: '#27ae60', type: 'truck', dir: 1, speed: 0.35 }
      ],
      focus: { x: 0.4, y: 0.64, zoom: 0.95 },
      headline: 'HIGHWAY MERGE',
      subline: 'Signal. Check blind spot. Merge safely.',
      objectives: ['Use turn signal', 'Check mirrors', 'Match speed and merge'],
      hazard: 'merge',
      duration: 6000,
      sound: 'highway'
    },
    silent_zone: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#4ECDC4', '#45B7D1', '#96CEB4'], count: 8, minH: 100, maxH: 220 },
      vehicles: [{ x: 0.35, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.3 }],
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'SILENT ZONE',
      subline: 'No honking near hospitals and schools.',
      objectives: ['Do not use horn', 'Maintain steady speed', 'Respect silence'],
      hazard: 'silent',
      duration: 4000,
      sound: 'urban'
    },
    road_rage: {
      sky: ['#e74c3c', '#c0392b'],
      ground: '#34495e',
      road: { y: 0.72, lanes: 3, color: '#444', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      buildings: { colors: ['#2c3e50', '#34495e', '#7f8c8d'], count: 8, minH: 100, maxH: 200 },
      vehicles: [
        { x: 0.4, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.4 },
        { x: 0.15, y: 0.68, w: 52, h: 26, color: '#e74c3c', type: 'car', dir: 1, speed: 0.6 }
      ],
      focus: { x: 0.35, y: 0.65, zoom: 1.0 },
      headline: 'ROAD RAGE CONTROL',
      subline: 'Stay calm. De-escalate. Let tailgaters pass.',
      objectives: ['Do not react to aggression', 'Signal and change lanes', 'Maintain safe distance'],
      hazard: 'rage',
      duration: 5000,
      sound: 'highway'
    },
    signs: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#4ECDC4', '#45B7D1', '#FFEAA7'], count: 8, minH: 80, maxH: 180 },
      vehicles: [{ x: 0.3, y: 0.68, w: 50, h: 25, color: '#2ecc71', type: 'car', dir: 1, speed: 0.35 }],
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'ROAD SIGNS RECOGNITION',
      subline: 'Identify and obey regulatory traffic signs.',
      objectives: ['Spot speed limit signs', 'Obey No U-Turn & Stop signs', 'Drive within limits'],
      hazard: 'signs',
      duration: 4500,
      sound: 'urban'
    },
    animals: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#96CEB4', '#FFEAA7', '#DDA0DD'], count: 6, minH: 60, maxH: 140 },
      vehicles: [{ x: 0.2, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.2 }],
      focus: { x: 0.5, y: 0.65, zoom: 1.05 },
      headline: 'ANIMALS ON ROAD',
      subline: 'Slow down. Steer gently. Never honk.',
      objectives: ['Spot cattle ahead', 'Decelerate smoothly', 'Bypass with wide clearance'],
      hazard: 'animal',
      duration: 5000,
      sound: 'urban'
    },
    narrow_street: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 1, color: '#555', lineColor: '#fff', dashLen: 20, dashGap: 15 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'], count: 12, minH: 120, maxH: 220 },
      vehicles: [
        { x: 0.25, y: 0.68, w: 48, h: 24, color: '#3498db', type: 'car', dir: 1, speed: 0.2 },
        { x: 0.75, y: 0.68, w: 42, h: 22, color: '#f39c12', type: 'auto', dir: -1, speed: 0.2 }
      ],
      focus: { x: 0.5, y: 0.65, zoom: 1.1 },
      headline: 'NARROW STREET PASSING',
      subline: 'Yield in passing bays. Allow oncoming traffic.',
      objectives: ['Identify passing bays', 'Yield to oncoming vehicles', 'Navigate bottleneck'],
      hazard: 'narrow',
      duration: 5000,
      sound: 'urban'
    },
    auto_dance: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'], count: 10, minH: 80, maxH: 200 },
      vehicles: [
        { x: 0.2, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.35 },
        { x: 0.5, y: 0.68, w: 45, h: 24, color: '#f39c12', type: 'auto', dir: 1, speed: 0.4 }
      ],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'AUTO-RICKSHAW DANCE',
      subline: 'Anticipate sudden lane cuts. Keep buffer.',
      objectives: ['Maintain 3-second buffer', 'Expect sudden turns', 'Brake smoothly'],
      hazard: 'auto',
      duration: 4500,
      sound: 'urban'
    },
    toll: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 4, color: '#555', lineColor: '#fff', dashLen: 35, dashGap: 20 },
      buildings: { colors: ['#45B7D1', '#96CEB4'], count: 4, minH: 60, maxH: 120 },
      vehicles: [{ x: 0.25, y: 0.68, w: 52, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.25 }],
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'FASTag TOLL PLAZA',
      subline: 'Approach at 20 km/h. Wait for green barrier.',
      objectives: ['Slow to 20 km/h in toll lane', 'Allow RFID scanner to read tag', 'Pass on green light'],
      hazard: 'toll',
      duration: 5000,
      sound: 'highway'
    },
    blind_corner: {
      sky: ['#0284c7', '#bae6fd'],
      ground: '#334155',
      road: { y: 0.72, lanes: 2, color: '#444', lineColor: '#f59e0b', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#475569', '#334155'], count: 6, minH: 100, maxH: 260 },
      vehicles: [
        { x: 0.25, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.25 },
        { x: 0.8, y: 0.68, w: 65, h: 28, color: '#e74c3c', type: 'truck', dir: -1, speed: 0.25 }
      ],
      focus: { x: 0.5, y: 0.65, zoom: 1.05 },
      headline: 'BLIND CORNER SAFETY',
      subline: 'Sound short horn tap. Check convex mirror.',
      objectives: ['Reduce speed before bend', 'Sound polite horn warning', 'Hug outer road edge'],
      hazard: 'blind',
      duration: 5000,
      sound: 'highway'
    },
    hill_driving: {
      sky: ['#0284c7', '#bae6fd'],
      ground: '#334155',
      road: { y: 0.72, lanes: 2, color: '#444', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#475569', '#334155'], count: 4, minH: 80, maxH: 220 },
      vehicles: [{ x: 0.35, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.2 }],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'HILL START & CONTROL',
      subline: 'Prevent rollback. Use handbrake technique.',
      objectives: ['Hold handbrake on incline', 'Coordinate clutch and accelerator', 'Maintain forward momentum'],
      hazard: 'hill',
      duration: 4500,
      sound: 'highway'
    },
    bus_stop: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'], count: 8, minH: 80, maxH: 180 },
      vehicles: [
        { x: 0.2, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.2 },
        { x: 0.6, y: 0.66, w: 75, h: 32, color: '#dc2626', type: 'bus', dir: 1, speed: 0 }
      ],
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'BUS STOP YIELD',
      subline: 'Queue safely behind halted buses.',
      objectives: ['Spot stopped bus ahead', 'Do not overtake blindly', 'Wait for passengers to board'],
      hazard: 'bus',
      duration: 5000,
      sound: 'urban'
    },
    construction: {
      sky: ['#f59e0b', '#fbbf24'],
      ground: '#78350f',
      road: { y: 0.72, lanes: 2, color: '#444', lineColor: '#f59e0b', dashLen: 20, dashGap: 15 },
      buildings: { colors: ['#78350f', '#92400e'], count: 6, minH: 80, maxH: 180 },
      vehicles: [{ x: 0.25, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.2 }],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'CONSTRUCTION ZONE',
      subline: 'Follow detour arrows. Reduce speed to 20 km/h.',
      objectives: ['Obey detour signs', 'Slow down near workers', 'Merge into single lane'],
      hazard: 'construction',
      duration: 5000,
      sound: 'urban'
    },
    one_way: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'], count: 8, minH: 80, maxH: 180 },
      vehicles: [{ x: 0.35, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.35 }],
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'ONE-WAY REGULATION',
      subline: 'Strict directional flow. Watch for wrong-way traffic.',
      objectives: ['Obey No Entry signs', 'Stay in designated flow', 'Avoid wrong-side hazards'],
      hazard: 'one_way',
      duration: 4500,
      sound: 'urban'
    },
    cyclist: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#4ECDC4', '#45B7D1', '#96CEB4'], count: 8, minH: 80, maxH: 180 },
      vehicles: [{ x: 0.2, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.3 }],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'CYCLIST SAFETY BUFFER',
      subline: 'Provide 1.5 meters clearance when overtaking.',
      objectives: ['Spot cyclists on left shoulder', 'Signal right to overtake', 'Provide 1.5m buffer clearance'],
      hazard: 'cyclist',
      duration: 4500,
      sound: 'urban'
    },
    zero_visibility: {
      sky: ['#0f172a', '#1e293b'],
      ground: '#1e293b',
      road: { y: 0.72, lanes: 3, color: '#181e29', lineColor: '#f59e0b', dashLen: 25, dashGap: 18 },
      buildings: { colors: ['#0f172a', '#1e293b'], count: 8, minH: 100, maxH: 220 },
      vehicles: [{ x: 0.35, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.2, headlights: true }],
      focus: { x: 0.45, y: 0.65, zoom: 1.05 },
      headline: 'ZERO VISIBILITY MONSOON',
      subline: 'Use low-beam fog lights. Follow road reflectors.',
      objectives: ['Activate low beams & hazards', 'Reduce speed to 25 km/h', 'Never tailgate in fog'],
      hazard: 'fog',
      duration: 5000,
      sound: 'rain'
    },
    grand_test: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'], count: 12, minH: 80, maxH: 240 },
      vehicles: [{ x: 0.25, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.35 }],
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'ROAD MASTERY EXAM',
      subline: 'Complete all practical driving safety challenges.',
      objectives: ['Obey all signals & signs', 'Yield to pedestrians', 'Demonstrate master vehicle control'],
      hazard: 'exam',
      duration: 6000,
      sound: 'urban'
    },
    free_roam: {
      sky: ['#5ed4f5', '#87ceeb'],
      ground: '#4a7c59',
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      buildings: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'], count: 14, minH: 80, maxH: 240 },
      vehicles: [
        { x: 0.2, y: 0.68, w: 50, h: 25, color: '#3498db', type: 'car', dir: 1, speed: 0.3 },
        { x: 0.6, y: 0.68, w: 45, h: 23, color: '#e74c3c', type: 'car', dir: -1, speed: 0.25 },
        { x: 0.8, y: 0.7, w: 55, h: 27, color: '#f39c12', type: 'auto', dir: -1, speed: 0.2 }
      ],
      pedestrians: { count: 6, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#96CEB4'], walkSpeed: 0.4 },
      focus: { x: 0.5, y: 0.65, zoom: 0.9 },
      headline: 'FREE ROAM',
      subline: 'Explore the city. Find collectibles.',
      objectives: ['Explore freely', 'Find hidden gems', 'Enjoy the ride'],
      hazard: null,
      duration: 4000,
      sound: 'urban'
    }
  }

  // Default fallback
  SCENARIOS.default = SCENARIOS.signal_jump

  // ═══════════════════════════════════════════════════════════════
  // PARTICLE SYSTEM
  // ═══════════════════════════════════════════════════════════════

  class ParticleSystem {
    constructor(type, w, h) {
      this.type = type; this.w = w; this.h = h; this.particles = []
      this.init()
    }
    init() {
      const count = this.type === 'rain' ? 150 : this.type === 'confetti' ? 40 : this.type === 'dust' ? 30 : 60
      for (let i = 0; i < count; i++) this.particles.push(this.createParticle(true))
    }
    createParticle(randomY = false) {
      const w = this.w, h = this.h
      if (this.type === 'rain') return { x: rand(0, w), y: randomY ? rand(-h, h) : rand(-20, 0), speed: rand(10, 18), len: rand(10, 25), opacity: rand(0.2, 0.5), wind: rand(-2, 2) }
      if (this.type === 'confetti') return { x: rand(0, w), y: randomY ? rand(-h, h * 0.3) : rand(-30, 0), speed: rand(1, 4), size: rand(4, 10), color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#F39C12'][randInt(0, 5)], rotation: rand(0, Math.PI * 2), rotSpeed: rand(-0.15, 0.15), wobble: rand(0, Math.PI * 2), wobbleSpeed: rand(0.02, 0.08) }
      if (this.type === 'dust') return { x: rand(0, w), y: randomY ? rand(0, h) : rand(h * 0.6, h), speed: rand(0.3, 1.5), size: rand(1, 4), opacity: rand(0.1, 0.3), drift: rand(-0.5, 0.5) }
      return { x: rand(0, w), y: randomY ? rand(0, h) : 0, speed: rand(0.2, 1), size: rand(1, 3), opacity: rand(0.05, 0.2) }
    }
    update(dt, wind = 0) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i]
        if (this.type === 'rain') { p.y += p.speed * dt * 60; p.x += (p.wind + wind) * dt * 60; if (p.y > this.h + 20) { this.particles[i] = this.createParticle(false); this.particles[i].x = rand(0, this.w) } }
        else if (this.type === 'confetti') { p.y += p.speed * dt * 60; p.wobble += p.wobbleSpeed; p.x += Math.sin(p.wobble) * 1.2; p.rotation += p.rotSpeed; if (p.y > this.h + 20) this.particles[i] = this.createParticle(false) }
        else if (this.type === 'dust') { p.x += (p.drift + wind * 0.3) * dt * 60; p.y -= p.speed * dt * 60; p.opacity -= 0.002 * dt * 60; if (p.y < -10 || p.opacity <= 0) this.particles[i] = this.createParticle(false) }
      }
    }
    draw(ctx) {
      for (const p of this.particles) {
        if (this.type === 'rain') { ctx.strokeStyle = `rgba(180,210,240,${p.opacity})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.wind * 0.8, p.y + p.len); ctx.stroke() }
        else if (this.type === 'confetti') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillStyle = p.color; ctx.globalAlpha = 0.85; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore() }
        else if (this.type === 'dust') { ctx.fillStyle = `rgba(180,160,120,${p.opacity})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill() }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DRAWING FUNCTIONS — Cartoon style
  // ═══════════════════════════════════════════════════════════════

  function drawSky(ctx, w, h, colors, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.75)
    grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[1])
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
  }

  function drawSun(ctx, w, h, t) {
    const x = w * 0.82 + Math.sin(t * 0.08) * 15
    const y = h * 0.12 + Math.cos(t * 0.06) * 8
    // Glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 80)
    glow.addColorStop(0, 'rgba(255,240,150,0.6)'); glow.addColorStop(0.5, 'rgba(255,220,100,0.2)'); glow.addColorStop(1, 'rgba(255,200,50,0)')
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.fill()
    // Sun body
    ctx.fillStyle = '#FFD93D'; ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill()
    // Face
    ctx.fillStyle = '#333'
    ctx.beginPath(); ctx.arc(x - 8, y - 5, 4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 8, y - 5, 4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x, y + 5, 8, 0, Math.PI); ctx.stroke()
    // Rays
    ctx.strokeStyle = '#FFD93D'; ctx.lineWidth = 3
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + t * 0.3
      const r1 = 38, r2 = 50
      ctx.beginPath(); ctx.moveTo(x + Math.cos(angle) * r1, y + Math.sin(angle) * r1)
      ctx.lineTo(x + Math.cos(angle) * r2, y + Math.sin(angle) * r2); ctx.stroke()
    }
  }

  function drawMoon(ctx, w, h, t) {
    const x = w * 0.8, y = h * 0.1
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 60)
    glow.addColorStop(0, 'rgba(255,255,240,0.4)'); glow.addColorStop(1, 'rgba(255,255,240,0)')
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#F5F5DC'; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = colors[0] || '#1a1a2e'; ctx.beginPath(); ctx.arc(x + 8, y - 3, 20, 0, Math.PI * 2); ctx.fill()
  }

  function drawStars(ctx, w, h, t, count = 40) {
    for (let i = 0; i < count; i++) {
      const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w
      const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * h * 0.5
      const brightness = 0.3 + Math.sin(t * 2 + i) * 0.3
      ctx.fillStyle = `rgba(255,255,255,${brightness})`
      ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill()
    }
  }

  function drawCloud(ctx, x, y, scale, alpha) {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.beginPath(); ctx.arc(x, y, 25 * scale, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 20 * scale, y - 10 * scale, 20 * scale, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 40 * scale, y, 22 * scale, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 15 * scale, y + 5 * scale, 18 * scale, 0, Math.PI * 2); ctx.fill()
  }

  function drawBuildings(ctx, w, h, config, t, parallax) {
    if (!config) return
    const { colors, count, minH, maxH } = config
    const roadY = h * 0.72
    for (let i = 0; i < count; i++) {
      const seed = i * 1234.5678
      const bx = (Math.sin(seed) * 0.5 + 0.5) * w * 1.2 - w * 0.1 + parallax * 0.3
      const bh = minH + (Math.sin(seed * 2.3) * 0.5 + 0.5) * (maxH - minH)
      const bw = 40 + (Math.sin(seed * 3.7) * 0.5 + 0.5) * 30
      const color = colors[i % colors.length]
      // Building body
      ctx.fillStyle = color
      roundRect(ctx, bx, roadY - bh, bw, bh, 4); ctx.fill()
      // Roof
      ctx.fillStyle = darkenColor(color, 0.7)
      ctx.fillRect(bx - 2, roadY - bh - 5, bw + 4, 8)
      // Windows
      ctx.fillStyle = 'rgba(255,255,200,0.6)'
      const windowRows = Math.floor(bh / 25)
      const windowCols = Math.floor(bw / 18)
      for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
          const wx = bx + 6 + c * 16
          const wy = roadY - bh + 10 + r * 22
          if (wy < roadY - 10) {
            ctx.fillStyle = Math.random() > 0.3 ? 'rgba(255,255,200,0.7)' : 'rgba(100,120,150,0.5)'
            ctx.fillRect(wx, wy, 10, 14)
          }
        }
      }
      // Door
      ctx.fillStyle = darkenColor(color, 0.5)
      roundRect(ctx, bx + bw / 2 - 6, roadY - 20, 12, 20, 2); ctx.fill()
    }
  }

  function drawTree(ctx, x, y, scale) {
    // Trunk
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(x - 4 * scale, y - 20 * scale, 8 * scale, 20 * scale)
    // Foliage
    ctx.fillStyle = '#27ae60'
    ctx.beginPath(); ctx.arc(x, y - 30 * scale, 18 * scale, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x - 10 * scale, y - 22 * scale, 12 * scale, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 10 * scale, y - 22 * scale, 12 * scale, 0, Math.PI * 2); ctx.fill()
  }

  function drawRoad(ctx, w, h, config, t, parallax) {
    if (!config) return
    const { y: roadY, lanes, color, lineColor, dashLen, dashGap } = config
    const ry = roadY * h
    const roadH = h - ry
    // Road surface
    ctx.fillStyle = color; ctx.fillRect(0, ry, w, roadH)
    // Sidewalk
    ctx.fillStyle = '#95a5a6'; ctx.fillRect(0, ry - 8, w, 8)
    // Lane markings
    ctx.strokeStyle = lineColor; ctx.lineWidth = 2; ctx.setLineDash([dashLen, dashGap])
    for (let l = 1; l < lanes; l++) {
      const lx = (l / lanes) * w
      ctx.beginPath(); ctx.moveTo(lx, ry + 5); ctx.lineTo(lx, ry + roadH * 0.4); ctx.stroke()
    }
    ctx.setLineDash([])
    // Road edge lines
    ctx.strokeStyle = lineColor; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(0, ry + 2); ctx.lineTo(w, ry + 2); ctx.stroke()
  }

  function drawCrosswalk(ctx, w, h, t) {
    const roadY = h * 0.72
    const cx = w * 0.5
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(cx - 40 + i * 15, roadY + 5, 10, h * 0.08)
    }
  }

  function drawVehicle(ctx, v, w, h, t) {
    const vx = v.x * w, vy = v.y * h, vw = v.w, vh = v.h
    ctx.save()
    // Headlights
    if (v.headlights) {
      const grad = ctx.createRadialGradient(vx + (v.dir > 0 ? vw : 0), vy + vh / 2, 0, vx + (v.dir > 0 ? vw : 0), vy + vh / 2, 100)
      grad.addColorStop(0, 'rgba(255,240,180,0.5)'); grad.addColorStop(1, 'rgba(255,240,180,0)')
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(vx + (v.dir > 0 ? vw : 0), vy + vh / 2, 100, 0, Math.PI * 2); ctx.fill()
    }
    // Siren
    if (v.siren) {
      const flash = Math.sin(t * 10) > 0
      ctx.fillStyle = flash ? 'rgba(255,0,0,0.9)' : 'rgba(0,80,255,0.9)'
      ctx.beginPath(); ctx.arc(vx + vw * 0.5, vy - 8, 7, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = flash ? 'rgba(255,0,0,0.25)' : 'rgba(0,80,255,0.25)'
      ctx.beginPath(); ctx.arc(vx + vw * 0.5, vy - 8, 25, 0, Math.PI * 2); ctx.fill()
    }
    // Body
    ctx.fillStyle = v.color
    if (v.type === 'auto') {
      roundRect(ctx, vx, vy, vw, vh, 5); ctx.fill()
      ctx.fillStyle = '#222'; ctx.fillRect(vx + vw * 0.1, vy - 6, vw * 0.5, 7)
    } else if (v.type === 'bike') {
      roundRect(ctx, vx + vw * 0.2, vy, vw * 0.6, vh * 0.7, 4); ctx.fill()
    } else if (v.type === 'bus') {
      roundRect(ctx, vx, vy, vw, vh, 5); ctx.fill()
      ctx.fillStyle = 'rgba(180,220,255,0.5)'
      for (let wx = vx + 8; wx < vx + vw - 10; wx += 14) ctx.fillRect(wx, vy + 4, 10, vh * 0.35)
    } else if (v.type === 'truck') {
      roundRect(ctx, vx, vy, vw * 0.35, vh, 3); ctx.fill()
      ctx.fillStyle = darkenColor(v.color, 0.7); roundRect(ctx, vx + vw * 0.35, vy + 2, vw * 0.65, vh - 4, 2); ctx.fill()
    } else if (v.type === 'ambulance') {
      roundRect(ctx, vx, vy, vw, vh, 5); ctx.fill()
      ctx.fillStyle = '#e74c3c'; ctx.fillRect(vx + vw * 0.35, vy + 2, vw * 0.3, vh * 0.5)
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center'; ctx.fillText('+', vx + vw * 0.5, vy + vh * 0.45)
    } else {
      roundRect(ctx, vx, vy, vw, vh, 8); ctx.fill()
      // Windshield
      ctx.fillStyle = 'rgba(150,210,255,0.5)'
      const wsX = v.dir > 0 ? vx + vw * 0.55 : vx + vw * 0.1
      roundRect(ctx, wsX, vy + 3, vw * 0.3, vh * 0.5, 4); ctx.fill()
      // Headlights
      ctx.fillStyle = '#FFD93D'
      const hlX = v.dir > 0 ? vx + vw - 4 : vx + 4
      ctx.fillRect(hlX - 2, vy + 4, 5, 5); ctx.fillRect(hlX - 2, vy + vh - 9, 5, 5)
      // Taillights
      ctx.fillStyle = '#ef4444'
      const tlX = v.dir > 0 ? vx + 4 : vx + vw - 4
      ctx.fillRect(tlX - 2, vy + 4, 5, 5); ctx.fillRect(tlX - 2, vy + vh - 9, 5, 5)
    }
    // Wheels
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath(); ctx.arc(vx + vw * 0.2, vy + vh + 3, 6, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(vx + vw * 0.8, vy + vh + 3, 6, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  function drawPedestrian(ctx, p, w, h, t) {
    const px = p.x * w, py = p.y * h
    const dir = p.dir || 1
    const walkCycle = Math.sin(t * 5 + (p.seed || 0))
    ctx.save()
    ctx.translate(px, py)
    ctx.scale(dir, 1)
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0, 8, 8, 3, 0, 0, Math.PI * 2); ctx.fill()
    // Legs
    ctx.strokeStyle = p.pants || '#2c3e50'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-2 + walkCycle * 3, 10); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(2 - walkCycle * 3, 10); ctx.stroke()
    // Body
    ctx.fillStyle = p.color || '#e74c3c'
    roundRect(ctx, -5, -12, 10, 14, 3); ctx.fill()
    // Head
    ctx.fillStyle = p.skin || '#f5cba7'
    ctx.beginPath(); ctx.arc(0, -18, 6, 0, Math.PI * 2); ctx.fill()
    // Hair
    ctx.fillStyle = p.hair || '#2c3e50'
    ctx.beginPath(); ctx.arc(0, -20, 6, Math.PI, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  function drawTrafficLight(ctx, config, w, h, t) {
    if (!config) return
    const lx = config.x * w, ly = config.y * h
    const stateIdx = Math.floor(t * 0.8) % config.states.length
    const state = config.states[stateIdx]
    // Pole
    ctx.fillStyle = '#333'; ctx.fillRect(lx - 3, ly, 6, 50)
    // Box
    ctx.fillStyle = '#222'; roundRect(ctx, lx - 15, ly - 40, 30, 45, 5); ctx.fill()
    // Lights
    const colors = { red: '#ef4444', yellow: '#f1c40f', green: '#2ecc71' }
    const states = ['red', 'yellow', 'green']
    states.forEach((s, i) => {
      ctx.fillStyle = s === state ? colors[s] : 'rgba(50,50,50,0.5)'
      ctx.beginPath(); ctx.arc(lx, ly - 30 + i * 14, 6, 0, Math.PI * 2); ctx.fill()
      if (s === state) {
        ctx.fillStyle = colors[s]; ctx.globalAlpha = 0.3
        ctx.beginPath(); ctx.arc(lx, ly - 30 + i * 14, 12, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      }
    })
  }

  function drawPuddle(ctx, p, w, h, t) {
    const px = p.x * w, py = p.y * h
    ctx.fillStyle = 'rgba(100,150,200,0.4)'
    ctx.beginPath(); ctx.ellipse(px, py, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill()
    // Ripple
    ctx.strokeStyle = 'rgba(150,200,255,0.3)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.ellipse(px, py, p.w / 2 + Math.sin(t * 3) * 5, p.h / 2 + Math.sin(t * 3) * 2, 0, 0, Math.PI * 2); ctx.stroke()
  }

  function drawStreetLight(ctx, x, y, h, t) {
    ctx.fillStyle = '#555'; ctx.fillRect(x - 2, y - 40, 4, 40)
    ctx.fillStyle = '#FFD93D'
    ctx.beginPath(); ctx.arc(x, y - 42, 6, 0, Math.PI * 2); ctx.fill()
    // Glow
    const glow = ctx.createRadialGradient(x, y - 42, 0, x, y - 42, 30)
    glow.addColorStop(0, 'rgba(255,217,61,0.3)'); glow.addColorStop(1, 'rgba(255,217,61,0)')
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y - 42, 30, 0, Math.PI * 2); ctx.fill()
  }

  function drawHazardIndicator(ctx, hazard, w, h, t) {
    if (!hazard) return
    const icons = {
      red_light: '🚦', ambulance: '🚑', puddle: '💧', children: '🧒',
      crowd: '👥', dark: '🌙', rain: '🌧️', merge: '🔀', parking: '🅿️', hospital: '🏥'
    }
    const icon = icons[hazard] || '⚠️'
    const pulse = 1 + Math.sin(t * 3) * 0.1
    ctx.save()
    ctx.translate(w * 0.5, h * 0.35)
    ctx.scale(pulse, pulse)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    roundRect(ctx - ctx.measureText ? 0 : 0, -25, 80, 50, 12) // fallback
    ctx.font = '40px serif'
    ctx.textAlign = 'center'
    ctx.fillText(icon, 0, 15)
    ctx.restore()
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN SCENARIO CLASS
  // ═══════════════════════════════════════════════════════════════

  class Scenario2D {
    constructor() {
      this.canvas = null; this.ctx = null; this.running = false
      this.particles = null; this.animFrame = null
      this.startTime = 0; this.duration = 5000
      this.onComplete = null; this.headlineAlpha = 0; this.sublineAlpha = 0
      this.textTyped = ''; this.textTimer = 0
      this.camX = 0; this.camY = 0; this.camZoom = 1
      this.targetCamX = 0; this.targetCamY = 0; this.targetCamZoom = 1
      this.skipRequested = false; this.touchStartX = 0; this.touchStartY = 0
      this.isDragging = false; this.exploredElements = []; this.lv = null
    }

    play(levelId, onComplete) {
      this.lv = window.LVS ? window.LVS.find(l => l.id === levelId) : null
      const lv = this.lv
      const themeType = lv ? (lv.themeType || 'signal_jump') : 'signal_jump'
      const scenario = SCENARIOS[themeType] || SCENARIOS.default
      this.duration = scenario.duration || 5000

      this.onComplete = onComplete; this.skipRequested = false; this.exploredElements = []
      this.canvas = document.createElement('canvas')
      this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10000;cursor:pointer;touch-action:none;'
      this.canvas.width = window.innerWidth * (window.devicePixelRatio || 1)
      this.canvas.height = window.innerHeight * (window.devicePixelRatio || 1)
      this.ctx = this.canvas.getContext('2d')
      document.body.appendChild(this.canvas)

      // Event listeners
      const skipHandler = (e) => { e.preventDefault(); this.skip() }
      this.canvas.addEventListener('click', skipHandler)
      this.canvas.addEventListener('touchstart', (e) => {
        this.touchStartX = e.touches[0].clientX; this.touchStartY = e.touches[0].clientY
        this.isDragging = false
      }, { passive: true })
      this.canvas.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - this.touchStartX
        const dy = e.touches[0].clientY - this.touchStartY
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          this.isDragging = true
          this.camX += dx * 0.5; this.camY += dy * 0.3
          this.touchStartX = e.touches[0].clientX; this.touchStartY = e.touches[0].clientY
        }
      }, { passive: true })
      this.canvas.addEventListener('touchend', (e) => {
        if (!this.isDragging) skipHandler(e)
      })
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.skip() })

      // Particles
      if (scenario.rain) this.particles = new ParticleSystem('rain', this.canvas.width, this.canvas.height)
      else if (scenario.particles === 'confetti') this.particles = new ParticleSystem('confetti', this.canvas.width, this.canvas.height)
      else if (scenario.particles === 'dust') this.particles = new ParticleSystem('dust', this.canvas.width, this.canvas.height)

      // Ambient sound
      if (scenario.sound && window.sfx) {
        if (!window.sfx._c) window.sfx.init()
        if (window.sfx._c && window.sfx._c.state === 'suspended') window.sfx._c.resume()
        window.sfx.startAmbient(scenario.sound)
      }

      // Pedestrians
      if (scenario.pedestrians) {
        scenario._pedInstances = []
        for (let i = 0; i < scenario.pedestrians.count; i++) {
          scenario._pedInstances.push({
            x: rand(0.15, 0.85), y: 0.73, dir: Math.random() > 0.5 ? 1 : -1,
            speed: scenario.pedestrians.walkSpeed * rand(0.7, 1.3),
            seed: rand(0, Math.PI * 2),
            color: scenario.pedestrians.colors[i % scenario.pedestrians.colors.length],
            pants: ['#2c3e50', '#34495e', '#1a1a2e', '#4a235a'][randInt(0, 3)],
            skin: ['#f5cba7', '#e0ac69', '#c68642', '#8d5524'][randInt(0, 3)],
            hair: ['#2c3e50', '#1a1a2e', '#4a235a', '#8b4513'][randInt(0, 3)]
          })
        }
      }

      // Camera
      const focus = scenario.focus || { x: 0.5, y: 0.65, zoom: 1 }
      this.targetCamX = (focus.x - 0.5) * 30
      this.targetCamY = (focus.y - 0.5) * 20
      this.targetCamZoom = focus.zoom
      this.camX = 0; this.camY = -20; this.camZoom = 1.3

      this.startTime = performance.now(); this.running = true
      this._animate(scenario)
    }

    _animate(scenario) {
      if (!this.running) return
      const ctx = this.ctx; if (!ctx) return
      const now = performance.now(); const elapsed = now - this.startTime
      const t = elapsed / 1000; const dt = 1 / 60
      const progress = clamp(elapsed / this.duration, 0, 1)
      const w = this.canvas.width; const h = this.canvas.height

      // Camera
      const camProgress = Ease.easeInOutCubic(clamp(elapsed / 2500, 0, 1))
      this.camX = lerp(this.camX, this.targetCamX, 0.02)
      this.camY = lerp(this.camY, this.targetCamY, 0.02)
      this.camZoom = lerp(this.camZoom, this.targetCamZoom, 0.02)
      const bobX = Math.sin(t * 1.2) * 3 * (1 - progress)
      const bobY = Math.cos(t * 0.8) * 2 * (1 - progress)

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2); ctx.scale(this.camZoom, this.camZoom)
      ctx.translate(-w / 2 + this.camX + bobX, -h / 2 + this.camY + bobY)

      // Draw scene
      drawSky(ctx, w, h, scenario.sky, t)
      if (scenario.night) { drawStars(ctx, w, h, t); drawMoon(ctx, w, h, t) }
      else drawSun(ctx, w, h, t)

      // Clouds
      ctx.globalAlpha = 0.6
      drawCloud(ctx, w * 0.2 + Math.sin(t * 0.05) * 30, h * 0.15, 1.2, 0.7)
      drawCloud(ctx, w * 0.6 + Math.sin(t * 0.03 + 1) * 20, h * 0.1, 0.8, 0.5)
      ctx.globalAlpha = 1

      // Buildings
      if (scenario.buildings) drawBuildings(ctx, w, h, scenario.buildings, t, this.camX)

      // Trees
      for (let i = 0; i < 5; i++) drawTree(ctx, w * 0.1 + i * w * 0.2, h * 0.72, 0.8 + Math.random() * 0.4)

      // Street lights
      if (scenario.streetLights) {
        for (let i = 0; i < 6; i++) drawStreetLight(ctx, w * 0.1 + i * w * 0.16, h * 0.72, h, t)
      }

      // Road
      drawRoad(ctx, w, h, scenario.road, t, this.camX)

      // Crosswalk
      if (scenario.crosswalk) drawCrosswalk(ctx, w, h, t)

      // Puddles
      if (scenario.puddles) for (const p of scenario.puddles) drawPuddle(ctx, p, w, h, t)

      // Parked cars
      if (scenario.parkedCars) for (const pc of scenario.parkedCars) drawVehicle(ctx, { ...pc, dir: 1, type: 'car' }, w, h, t)

      // Traffic light
      if (scenario.trafficLight) drawTrafficLight(ctx, scenario.trafficLight, w, h, t)

      // Vehicles
      if (scenario.vehicles) {
        for (const v of scenario.vehicles) {
          const vv = { ...v }
          if (v.speed > 0) { vv.x = (v.x + (v.dir || 1) * v.speed * t * 0.03) % 1.2; if (vv.x < -0.1) vv.x = 1.1 }
          drawVehicle(ctx, vv, w, h, t)
        }
      }

      // Pedestrians
      if (scenario._pedInstances) {
        for (const p of scenario._pedInstances) {
          const pp = { ...p }
          pp.x = (p.x + p.dir * p.speed * t * 0.02) % 1.1
          if (pp.x < -0.05) pp.x = 1.05; if (pp.x > 1.05) pp.x = -0.05
          drawPedestrian(ctx, pp, w, h, t)
        }
      }

      // Particles
      if (this.particles) { this.particles.update(dt, scenario.wind || 0); this.particles.draw(ctx) }

      ctx.restore()

      // Vignette
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7)
      vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.4)')
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h)

      // ═══ UI OVERLAY ═══

      // Level badge
      const badgeAlpha = Ease.easeOutBack(clamp((elapsed - 300) / 500, 0, 1))
      if (badgeAlpha > 0) {
        ctx.globalAlpha = badgeAlpha
        const bx = w / 2, by = h * 0.22
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, bx - 120, by - 18, 240, 36, 18); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(16 * (w / 800))}px Inter, sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        const levelNum = this.lv ? this.lv.id : 1; const levelIcon = this.lv ? this.lv.icon : '🚦'
        ctx.fillText(`${levelIcon}  Level ${levelNum}  ${levelIcon}`, bx, by)
        ctx.globalAlpha = 1
      }

      // Headline
      const headlineAlpha = Ease.easeOutCubic(clamp((elapsed - 600) / 400, 0, 1))
      if (headlineAlpha > 0) {
        ctx.globalAlpha = headlineAlpha
        const hx = w / 2, hy = h * 0.35
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; const hw = Math.min(w * 0.85, 500)
        roundRect(ctx, hx - hw / 2, hy - 28, hw, 56, 12); ctx.fill()
        // Accent bar
        const accentGrad = ctx.createLinearGradient(hx - hw / 2, 0, hx + hw / 2, 0)
        accentGrad.addColorStop(0, '#FF6B6B'); accentGrad.addColorStop(0.5, '#4ECDC4'); accentGrad.addColorStop(1, '#45B7D1')
        ctx.fillStyle = accentGrad; roundRect(ctx, hx - hw / 2, hy - 28, hw, 4, 2); ctx.fill()
        // Text
        const headline = scenario.headline || 'SCENARIO'
        const charIdx = Math.floor(clamp((elapsed - 600) / 25, 0, headline.length))
        const displayHeadline = headline.substring(0, charIdx)
        ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(26 * (w / 800))}px 'Inter', sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(displayHeadline, hx, hy)
        // Cursor blink
        if (charIdx < headline.length && Math.floor(t * 4) % 2 === 0) {
          const metrics = ctx.measureText(displayHeadline)
          ctx.fillStyle = '#4ECDC4'; ctx.fillRect(hx + metrics.width / 2 + 3, hy - 12, 3, 24)
        }
        ctx.globalAlpha = 1
      }

      // Subline
      const sublineDelay = 600 + (scenario.headline || '').length * 25 + 400
      const sublineAlpha = Ease.easeOutCubic(clamp((elapsed - sublineDelay) / 350, 0, 1))
      if (sublineAlpha > 0) {
        ctx.globalAlpha = sublineAlpha
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = `500 ${Math.round(14 * (w / 800))}px Inter, sans-serif`
        ctx.textAlign = 'center'; ctx.fillText(scenario.subline || '', w / 2, h * 0.44)
        ctx.globalAlpha = 1
      }

      // Objectives
      if (scenario.objectives && elapsed > 1200) {
        const objAlpha = Ease.easeOutCubic(clamp((elapsed - 1200) / 400, 0, 1))
        if (objAlpha > 0) {
          ctx.globalAlpha = objAlpha
          const oy = h * 0.85
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, w / 2 - 120, oy - 15, 240, 30, 8); ctx.fill()
          ctx.fillStyle = '#4ECDC4'; ctx.font = `600 ${Math.round(11 * (w / 800))}px Inter, sans-serif`
          ctx.textAlign = 'center'; ctx.fillText('🎯 ' + (scenario.objectives[0] || ''), w / 2, oy)
          ctx.globalAlpha = 1
        }
      }

      // Law badge
      if (this.lv && this.lv.law && elapsed > 1800) {
        const lawAlpha = Ease.easeOutCubic(clamp((elapsed - 1800) / 400, 0, 0.7))
        ctx.globalAlpha = lawAlpha
        const lawY = h * 0.92
        ctx.fillStyle = 'rgba(231,76,60,0.15)'; roundRect(ctx, w / 2 - 160, lawY - 10, 320, 20, 5); ctx.fill()
        ctx.fillStyle = 'rgba(255,180,180,0.8)'; ctx.font = `500 ${Math.round(10 * (w / 800))}px Inter, sans-serif`
        ctx.textAlign = 'center'; ctx.fillText(`⚖️ ${this.lv.law.off} — Fine: ${this.lv.law.fine}`, w / 2, lawY)
        ctx.globalAlpha = 1
      }

      // Skip hint
      if (elapsed > 2000) {
        const skipAlpha = Ease.easeOutCubic(clamp((elapsed - 2000) / 300, 0, 0.5))
        ctx.globalAlpha = skipAlpha * (0.4 + Math.sin(t * 2) * 0.1)
        ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(11 * (w / 800))}px Inter, sans-serif`
        ctx.textAlign = 'center'; ctx.fillText('Tap to skip • Esc to skip • Swipe to pan', w / 2, h * 0.96)
        ctx.globalAlpha = 1
      }

      // Progress bar
      const barW = 100, barH = 3, barX = w / 2 - barW / 2, barY = h * 0.03
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, barX, barY, barW, barH, 1.5); ctx.fill()
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0)
      barGrad.addColorStop(0, '#FF6B6B'); barGrad.addColorStop(1, '#4ECDC4')
      ctx.fillStyle = barGrad; roundRect(ctx, barX, barY, barW * progress, barH, 1.5); ctx.fill()

      // Done
      if (elapsed >= this.duration) { this.destroy(); return }
      this.animFrame = requestAnimationFrame(() => this._animate(scenario))
    }

    skip() {
      if (!this.running) return
      this.skipRequested = true
      const fadeStart = performance.now()
      const fadeOut = () => {
        const elapsed = performance.now() - fadeStart
        const alpha = clamp(elapsed / 300, 0, 1)
        if (this.canvas) { this.ctx.fillStyle = `rgba(0,0,0,${alpha})`; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height) }
        if (alpha < 1) requestAnimationFrame(fadeOut)
        else this.destroy()
      }
      requestAnimationFrame(fadeOut)
    }

    destroy() {
      this.running = false
      if (this.animFrame) cancelAnimationFrame(this.animFrame)
      // Stop ambient sound
      if (window.sfx && typeof window.sfx.stopAmbient === 'function') window.sfx.stopAmbient()
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.style.transition = 'opacity 0.3s ease'; this.canvas.style.opacity = '0'
        setTimeout(() => { if (this.canvas && this.canvas.parentNode) this.canvas.remove(); this.canvas = null; this.ctx = null; if (this.onComplete) this.onComplete() }, 300)
      } else { if (this.onComplete) this.onComplete() }
    }
  }

  window.Scenario2D = new Scenario2D()
  window.Scenario2DData = SCENARIOS
  console.log('[Scenario2D] Cartoon engine loaded — ' + Object.keys(SCENARIOS).length + ' themes')
})()
