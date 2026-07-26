/* ══════════════════════════════════════════════════════════════════════════
   scenario2d.js — 2D Scenario Intro Engine for Traffic Driving Simulator
   ══════════════════════════════════════════════════════════════════════════
   Renders animated Canvas-based cinematic intros before each level starts.
   Each themeType gets a unique 2D scene with parallax layers, particles,
   character sprites, weather effects, view bobbing, and smooth transitions.
   ══════════════════════════════════════════════════════════════════════════ */

;(function () {
  'use strict'

  /* ── EASING FUNCTIONS ── */
  const Ease = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeOutCubic: (t) => --t * t * t + 1,
    easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
    easeOutBack: (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) },
    easeOutElastic: (t) => { if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1 },
    easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10))
  }

  /* ── COLOR UTILITIES ── */
  const hexToRgb = (hex) => {
    const h = hex.replace('#', '')
    return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) }
  }
  const rgbStr = (r, g, b, a = 1) => `rgba(${r},${g},${b},${a})`
  const lerpColor = (c1, c2, t) => {
    const a = hexToRgb(c1), b = hexToRgb(c2)
    return rgbStr(Math.round(a.r + (b.r - a.r) * t), Math.round(a.g + (b.g - a.g) * t), Math.round(a.b + (b.b - a.b) * t))
  }

  /* ── MATH UTILITIES ── */
  const rand = (min, max) => Math.random() * (max - min) + min
  const randInt = (min, max) => Math.floor(rand(min, max + 1))
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const lerp = (a, b, t) => a + (b - a) * t

  /* ════════════════════════════════════════════════════════════════════════
     SCENARIO DATA — Detailed scene descriptors for all 52 levels
     ════════════════════════════════════════════════════════════════════════ */
  const SCENARIOS = {
    signal_jump: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A', '#6B7B8B'], count: 12, minH: 80, maxH: 200 },
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      pedestrians: { count: 4, colors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'], walkSpeed: 0.6 },
      vehicles: [
        { x: 0.15, y: 0.68, w: 60, h: 28, color: '#3498db', type: 'car', dir: 1, speed: 0 },
        { x: 0.8, y: 0.68, w: 55, h: 26, color: '#e74c3c', type: 'car', dir: -1, speed: 0 },
        { x: 0.4, y: 0.74, w: 50, h: 24, color: '#f39c12', type: 'auto', dir: 1, speed: 0 }
      ],
      trafficLight: { x: 0.5, y: 0.55, states: ['red', 'red', 'green'] },
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'RED LIGHT PATIENCE',
      subline: 'Wait for the signal. Let them cross.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    street_parking: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A', '#6B7B8B'], count: 14, minH: 60, maxH: 160 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      parkedCars: [
        { x: 0.1, y: 0.7, w: 50, h: 24, color: '#888' },
        { x: 0.3, y: 0.7, w: 45, h: 22, color: '#666' },
        { x: 0.6, y: 0.7, w: 48, h: 23, color: '#999' }
      ],
      vehicles: [
        { x: 0.45, y: 0.68, w: 58, h: 27, color: '#2980b9', type: 'car', dir: 1, speed: 0.3 }
      ],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'STREET PARKING',
      subline: 'Find legal parking. Don\'t double-park.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    ambulance_priority: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A'], count: 10, minH: 90, maxH: 220 },
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      vehicles: [
        { x: 0.1, y: 0.68, w: 55, h: 26, color: '#555', type: 'car', dir: 1, speed: 0.4 },
        { x: 0.7, y: 0.68, w: 65, h: 30, color: '#fff', type: 'ambulance', dir: -1, speed: 1.2, siren: true }
      ],
      ambulance: { active: true, flashTimer: 0 },
      focus: { x: 0.6, y: 0.65, zoom: 1.05 },
      headline: 'AMBULANCE PRIORITY',
      subline: 'Pull over. Clear the way. Save lives.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    puddle_etiquette: {
      sky: ['#4a5568', '#2d3748'],
      buildings: { colors: ['#5a6577', '#6b7b8d', '#4a5a6a', '#7a8a9a'], count: 10, minH: 70, maxH: 180 },
      road: { y: 0.72, lanes: 2, color: '#444', lineColor: '#888', dashLen: 25, dashGap: 18 },
      puddles: [
        { x: 0.2, y: 0.74, w: 70, h: 12 },
        { x: 0.6, y: 0.75, w: 55, h: 10 },
        { x: 0.85, y: 0.73, w: 45, h: 9 }
      ],
      vehicles: [
        { x: 0.3, y: 0.68, w: 55, h: 26, color: '#3366cc', type: 'car', dir: 1, speed: 0.3 }
      ],
      focus: { x: 0.35, y: 0.68, zoom: 1.0 },
      headline: 'PUDDLE ETIQUETTE',
      subline: 'Slow down. Don\'t splash pedestrians.',
      particles: null,
      rain: true,
      night: false,
      wind: 0.3
    },
    pedestrian_courtesy: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#A0926B', '#8B7355', '#9B8B7A', '#7A8B6E'], count: 8, minH: 60, maxH: 140 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      school: true,
      pedestrians: { count: 6, colors: ['#fff', '#fff', '#fff', '#2980b9', '#2980b9', '#2980b9'], walkSpeed: 0.5 },
      vehicles: [
        { x: 0.15, y: 0.68, w: 55, h: 26, color: '#27ae60', type: 'car', dir: 1, speed: 0 }
      ],
      focus: { x: 0.5, y: 0.62, zoom: 1.0 },
      headline: 'SCHOOL ZONE',
      subline: 'Children crossing. Slow down.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    respectful_parking: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#A0926B', '#8B7355', '#9B8B7A', '#7A8B6E', '#B0A080'], count: 8, minH: 80, maxH: 150 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      vehicles: [
        { x: 0.35, y: 0.68, w: 58, h: 27, color: '#c0392b', type: 'car', dir: 1, speed: 0 }
      ],
      focus: { x: 0.4, y: 0.65, zoom: 1.0 },
      headline: 'RESPECTFUL PARKING',
      subline: 'Don\'t block gates. Move to visitor parking.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    silent_zone: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#E8E0D0', '#D0C8B8'], count: 8, minH: 90, maxH: 180 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      noHonk: true,
      vehicles: [
        { x: 0.3, y: 0.68, w: 55, h: 26, color: '#2c3e50', type: 'car', dir: 1, speed: 0.2 }
      ],
      focus: { x: 0.4, y: 0.65, zoom: 1.0 },
      headline: 'SILENT ZONE',
      subline: 'No honking. Hospital nearby.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    market_street: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A', '#6B7B8B', '#C0A882'], count: 14, minH: 50, maxH: 140 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      vendors: [
        { x: 0.15, color: '#e74c3c' },
        { x: 0.35, color: '#f39c12' },
        { x: 0.65, color: '#2ecc71' }
      ],
      vehicles: [
        { x: 0.4, y: 0.68, w: 45, h: 22, color: '#ff8800', type: 'auto', dir: 1, speed: 0.2 }
      ],
      pedestrians: { count: 6, colors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22'], walkSpeed: 0.5 },
      focus: { x: 0.45, y: 0.6, zoom: 1.05 },
      headline: 'MARKET AREA',
      subline: 'Navigate carefully. Park in designated zone.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    no_honking: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#E8E0D0', '#D0C8B8', '#C8C0B0', '#F0E8D8'], count: 6, minH: 100, maxH: 200 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      noHonk: true,
      temple: true,
      vehicles: [
        { x: 0.4, y: 0.68, w: 55, h: 26, color: '#555', type: 'car', dir: 1, speed: 0.15 }
      ],
      focus: { x: 0.45, y: 0.6, zoom: 1.0 },
      headline: 'NO HONKING',
      subline: 'Temple zone. Maintain silence.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    road_rage: {
      sky: ['#9ec5d9', '#6a9ab5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A'], count: 10, minH: 80, maxH: 200 },
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      vehicles: [
        { x: 0.1, y: 0.68, w: 60, h: 28, color: '#c0392b', type: 'car', dir: 1, speed: 0.7, aggressive: true },
        { x: 0.6, y: 0.68, w: 55, h: 26, color: '#2c3e50', type: 'car', dir: 1, speed: 0.4 }
      ],
      focus: { x: 0.35, y: 0.65, zoom: 1.0 },
      headline: 'ROAD RAGE CONTROL',
      subline: 'Stay calm. Don\'t react to aggression.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    rain_driving: {
      sky: ['#2d3748', '#1a202c'],
      buildings: { colors: ['#4a5568', '#5a6577', '#3d4a5c', '#6b7b8d'], count: 10, minH: 70, maxH: 180 },
      road: { y: 0.72, lanes: 2, color: '#3a3a3a', lineColor: '#666', dashLen: 25, dashGap: 18 },
      vehicles: [
        { x: 0.3, y: 0.68, w: 55, h: 26, color: '#3366cc', type: 'car', dir: 1, speed: 0.3, headlights: true }
      ],
      focus: { x: 0.35, y: 0.65, zoom: 1.0 },
      headline: 'HEAVY RAIN',
      subline: 'Reduce speed. Increase following distance.',
      particles: null,
      rain: true,
      night: false,
      wind: 0.5
    },
    signs: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E'], count: 6, minH: 60, maxH: 120 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      roadSigns: [
        { x: 0.25, type: 'mandatory', color: '#0066cc', symbol: '→' },
        { x: 0.5, type: 'cautionary', color: '#cc0000', symbol: '!' },
        { x: 0.75, type: 'informational', color: '#00aa44', symbol: 'i' }
      ],
      vehicles: [
        { x: 0.4, y: 0.68, w: 55, h: 26, color: '#2980b9', type: 'car', dir: 1, speed: 0.4 }
      ],
      focus: { x: 0.5, y: 0.55, zoom: 1.1 },
      headline: 'KNOW YOUR SIGNS',
      subline: 'Blue = Mandatory. Red = Caution. Green = Info.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    animals: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B'], count: 4, minH: 50, maxH: 100 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      animals: [
        { x: 0.45, y: 0.7, type: 'cow', color: '#8B4513' }
      ],
      vehicles: [
        { x: 0.15, y: 0.68, w: 55, h: 26, color: '#2980b9', type: 'car', dir: 1, speed: 0 }
      ],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'COWS ON THE ROAD!',
      subline: 'Stop and wait. Animals have right of way.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    narrow_street: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A', '#6B7B8B', '#C0A882'], count: 16, minH: 80, maxH: 220 },
      road: { y: 0.72, lanes: 1, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      vehicles: [
        { x: 0.4, y: 0.68, w: 45, h: 22, color: '#ff8800', type: 'auto', dir: 1, speed: 0.3 },
        { x: 0.6, y: 0.68, w: 40, h: 20, color: '#00cc44', type: 'bike', dir: -1, speed: 0.4 }
      ],
      focus: { x: 0.5, y: 0.65, zoom: 1.15 },
      headline: 'NARROW STREET',
      subline: 'Tight space. Watch for oncoming traffic.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    parking_rules: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B'], count: 4, minH: 50, maxH: 100 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      parkingZones: [
        { x: 0.2, w: 80, color: '#0066cc', label: 'P' },
        { x: 0.5, w: 60, color: '#cc0000', label: 'X' },
        { x: 0.75, w: 70, color: '#0066cc', label: 'P' }
      ],
      vehicles: [
        { x: 0.35, y: 0.68, w: 55, h: 26, color: '#2266cc', type: 'car', dir: 1, speed: 0 }
      ],
      focus: { x: 0.5, y: 0.6, zoom: 1.0 },
      headline: 'PARKING RULES',
      subline: 'Blue = Park. Red = No parking. Follow signs.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    auto_dance: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A'], count: 10, minH: 60, maxH: 150 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      vehicles: [
        { x: 0.15, y: 0.68, w: 45, h: 22, color: '#ff6600', type: 'auto', dir: 1, speed: 0.5, weaving: true },
        { x: 0.4, y: 0.7, w: 45, h: 22, color: '#ff8800', type: 'auto', dir: -1, speed: 0.6, weaving: true },
        { x: 0.65, y: 0.68, w: 45, h: 22, color: '#ffaa00', type: 'auto', dir: 1, speed: 0.4, weaving: true }
      ],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'AUTO-RICKSHAW DANCE',
      subline: 'Unpredictable autos everywhere. Stay alert.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    toll: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B'], count: 2, minH: 40, maxH: 80 },
      road: { y: 0.72, lanes: 4, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      tollPlaza: true,
      vehicles: [
        { x: 0.1, y: 0.68, w: 65, h: 30, color: '#884400', type: 'truck', dir: 1, speed: 0.2 },
        { x: 0.5, y: 0.7, w: 60, h: 28, color: '#0044aa', type: 'bus', dir: 1, speed: 0.15 },
        { x: 0.8, y: 0.68, w: 55, h: 26, color: '#555', type: 'car', dir: 1, speed: 0.25 }
      ],
      focus: { x: 0.5, y: 0.55, zoom: 1.0 },
      headline: 'TOLL PLAZA',
      subline: 'Slow down. Pay toll. Follow lane markers.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    blind_corner: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A'], count: 10, minH: 70, maxH: 160 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18, curve: true },
      vehicles: [
        { x: 0.3, y: 0.68, w: 55, h: 26, color: '#2980b9', type: 'car', dir: 1, speed: 0.3 }
      ],
      focus: { x: 0.5, y: 0.65, zoom: 1.05 },
      headline: 'BLIND CORNER',
      subline: 'Slow down. Honk at blind turns.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    hill_driving: {
      sky: ['#7ab8e0', '#4a9cc5'],
      mountains: true,
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18, slope: true },
      vehicles: [
        { x: 0.3, y: 0.68, w: 55, h: 26, color: '#2980b9', type: 'car', dir: 1, speed: 0.25 },
        { x: 0.65, y: 0.68, w: 65, h: 30, color: '#0044aa', type: 'bus', dir: -1, speed: 0.2 }
      ],
      focus: { x: 0.45, y: 0.5, zoom: 0.95 },
      headline: 'HILL DRIVING',
      subline: 'Use low gear. Watch for steep gradients.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    bus_stop: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E'], count: 8, minH: 70, maxH: 160 },
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      vehicles: [
        { x: 0.3, y: 0.68, w: 75, h: 32, color: '#0066cc', type: 'bus', dir: 1, speed: 0, atStop: true },
        { x: 0.1, y: 0.68, w: 55, h: 26, color: '#888', type: 'car', dir: 1, speed: 0 }
      ],
      pedestrians: { count: 3, colors: ['#e74c3c', '#3498db', '#2ecc71'], walkSpeed: 0.4 },
      focus: { x: 0.35, y: 0.6, zoom: 1.0 },
      headline: 'BUS STOP YIELD',
      subline: 'Let passengers board. Don\'t overtake at stops.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    construction: {
      sky: ['#9aa8b8', '#7a8898'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E'], count: 6, minH: 60, maxH: 140 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      construction: { barriers: true, cones: true },
      vehicles: [
        { x: 0.3, y: 0.68, w: 55, h: 26, color: '#4477aa', type: 'car', dir: 1, speed: 0.2 },
        { x: 0.6, y: 0.68, w: 65, h: 30, color: '#885533', type: 'truck', dir: -1, speed: 0.15 }
      ],
      focus: { x: 0.5, y: 0.65, zoom: 1.0 },
      headline: 'CONSTRUCTION ZONE',
      subline: 'Follow diversion signs. Reduce speed.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    one_way: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A'], count: 10, minH: 70, maxH: 180 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      oneWay: true,
      vehicles: [
        { x: 0.15, y: 0.68, w: 50, h: 24, color: '#ffcc00', type: 'taxi', dir: 1, speed: 0.5 },
        { x: 0.5, y: 0.7, w: 50, h: 24, color: '#ffcc00', type: 'taxi', dir: 1, speed: 0.5 },
        { x: 0.8, y: 0.68, w: 55, h: 26, color: '#445566', type: 'car', dir: 1, speed: 0.4 }
      ],
      focus: { x: 0.5, y: 0.6, zoom: 1.0 },
      headline: 'ONE-WAY STREETS',
      subline: 'Follow the arrows. Never go against traffic.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    hospital_quiet: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#E8E0D0', '#F0E8D8', '#FFFFFF', '#D0C8B8'], count: 6, minH: 100, maxH: 200 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      noHonk: true,
      vehicles: [
        { x: 0.35, y: 0.68, w: 55, h: 26, color: '#445566', type: 'car', dir: 1, speed: 0.15 }
      ],
      focus: { x: 0.45, y: 0.5, zoom: 1.0 },
      headline: 'HOSPITAL QUIET ZONE',
      subline: 'No honking. Reduced speed. Lives at stake.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    festival: {
      sky: ['#f5a623', '#e8941a'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A'], count: 10, minH: 60, maxH: 150 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      decorations: true,
      pedestrians: { count: 8, colors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c'], walkSpeed: 0.4 },
      vehicles: [
        { x: 0.3, y: 0.68, w: 45, h: 22, color: '#ff6600', type: 'auto', dir: 1, speed: 0.2 }
      ],
      focus: { x: 0.5, y: 0.6, zoom: 1.0 },
      headline: 'FESTIVAL TRAFFIC',
      subline: 'Crowds, decorations, chaos. Drive extra careful.',
      particles: 'confetti',
      rain: false,
      night: false,
      wind: 0
    },
    cyclist: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E'], count: 6, minH: 60, maxH: 130 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18, cycleLane: true },
      vehicles: [
        { x: 0.3, y: 0.68, w: 40, h: 20, color: '#00cc66', type: 'bike', dir: 1, speed: 0.4 },
        { x: 0.5, y: 0.68, w: 55, h: 26, color: '#667788', type: 'car', dir: 1, speed: 0.3 }
      ],
      focus: { x: 0.4, y: 0.65, zoom: 1.0 },
      headline: 'CYCLIST SAFETY',
      subline: 'Respect cycle lanes. Give cyclists space.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    grand_test: {
      sky: ['#0a0a12', '#050508'],
      buildings: { colors: ['#1a1a2a', '#222233', '#1a2030', '#2a2a3a'], count: 14, minH: 80, maxH: 240 },
      road: { y: 0.72, lanes: 3, color: '#333', lineColor: '#666', dashLen: 30, dashGap: 20 },
      vehicles: [
        { x: 0.1, y: 0.68, w: 55, h: 26, color: '#ffcc00', type: 'taxi', dir: 1, speed: 0.5, headlights: true },
        { x: 0.4, y: 0.68, w: 55, h: 26, color: '#445566', type: 'car', dir: 1, speed: 0.4, headlights: true },
        { x: 0.7, y: 0.68, w: 65, h: 30, color: '#0044aa', type: 'bus', dir: -1, speed: 0.3, headlights: true }
      ],
      focus: { x: 0.5, y: 0.6, zoom: 1.0 },
      headline: 'THE GRAND TEST',
      subline: 'Night. Rain. All hazards. Show what you\'ve learned.',
      particles: null,
      rain: true,
      night: true,
      wind: 0.6
    },
    night_monsoon: {
      sky: ['#0a0a12', '#050508'],
      buildings: { colors: ['#1a1a2a', '#222233', '#1a2030'], count: 8, minH: 70, maxH: 180 },
      road: { y: 0.72, lanes: 2, color: '#2a2a2a', lineColor: '#555', dashLen: 25, dashGap: 18 },
      vehicles: [
        { x: 0.3, y: 0.68, w: 55, h: 26, color: '#223355', type: 'car', dir: 1, speed: 0.3, headlights: true }
      ],
      focus: { x: 0.4, y: 0.65, zoom: 1.0 },
      headline: 'NIGHT MONSOON',
      subline: 'Rain at night. Maximum caution required.',
      particles: null,
      rain: true,
      night: true,
      wind: 0.5
    },
    wrong_side: {
      sky: ['#9ec5d9', '#6a9ab5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A'], count: 10, minH: 80, maxH: 200 },
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      vehicles: [
        { x: 0.2, y: 0.68, w: 55, h: 26, color: '#334455', type: 'car', dir: 1, speed: 0.5 },
        { x: 0.6, y: 0.7, w: 65, h: 30, color: '#0044aa', type: 'bus', dir: -1, speed: 0.4 }
      ],
      wrongSideNPC: true,
      focus: { x: 0.4, y: 0.65, zoom: 1.0 },
      headline: 'WRONG-SIDE DANGER',
      subline: 'NPCs drive against traffic. Stay in your lane.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    highway_merge: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: null,
      road: { y: 0.72, lanes: 4, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20, highway: true },
      vehicles: [
        { x: 0.1, y: 0.68, w: 55, h: 26, color: '#445566', type: 'car', dir: 1, speed: 0.8 },
        { x: 0.5, y: 0.68, w: 65, h: 30, color: '#884400', type: 'truck', dir: 1, speed: 0.6 },
        { x: 0.3, y: 0.74, w: 55, h: 26, color: '#336699', type: 'car', dir: 1, speed: 0.4, merging: true }
      ],
      focus: { x: 0.35, y: 0.65, zoom: 0.95 },
      headline: 'HIGHWAY MERGE',
      subline: 'Check mirrors. Signal. Merge at speed.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    zero_visibility: {
      sky: ['#0a0a0a', '#050505'],
      buildings: { colors: ['#111', '#1a1a1a', '#0a0a0a'], count: 6, minH: 60, maxH: 140 },
      road: { y: 0.72, lanes: 2, color: '#222', lineColor: '#444', dashLen: 25, dashGap: 18 },
      fog: true,
      vehicles: [
        { x: 0.35, y: 0.68, w: 55, h: 26, color: '#223355', type: 'car', dir: 1, speed: 0.15, headlights: true }
      ],
      focus: { x: 0.4, y: 0.65, zoom: 1.0 },
      headline: 'ZERO VISIBILITY',
      subline: 'Dense fog. Fog lights on. Crawl forward.',
      particles: null,
      rain: false,
      night: true,
      wind: 0
    },
    mountain: {
      sky: ['#7ab8e0', '#4a9cc5'],
      mountains: true,
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18, slope: true, curves: true },
      vehicles: [
        { x: 0.3, y: 0.68, w: 65, h: 30, color: '#556633', type: 'truck', dir: 1, speed: 0.2 },
        { x: 0.7, y: 0.68, w: 55, h: 26, color: '#4477aa', type: 'car', dir: -1, speed: 0.25 }
      ],
      focus: { x: 0.5, y: 0.45, zoom: 0.9 },
      headline: 'MOUNTAIN PASS',
      subline: 'Hairpin turns. Steep drops. Use low gear.',
      particles: null,
      rain: false,
      night: false,
      wind: 0.2
    },
    rural: {
      sky: ['#a8d4e8', '#7ab8d0'],
      rural: true,
      road: { y: 0.72, lanes: 1, color: '#8B7355', lineColor: '#A0926B', dashLen: 20, dashGap: 15, kacha: true },
      vehicles: [
        { x: 0.3, y: 0.68, w: 55, h: 26, color: '#336699', type: 'car', dir: 1, speed: 0.3 },
        { x: 0.6, y: 0.68, w: 65, h: 30, color: '#884400', type: 'truck', dir: -1, speed: 0.2 }
      ],
      animals: [
        { x: 0.5, y: 0.7, type: 'chicken', color: '#cc8833' }
      ],
      focus: { x: 0.45, y: 0.65, zoom: 1.0 },
      headline: 'RURAL KACHA ROAD',
      subline: 'Unpaved. Narrow. Watch for animals.',
      particles: 'dust',
      rain: false,
      night: false,
      wind: 0.1
    },
    multi_modal: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A', '#6B7B8B'], count: 12, minH: 70, maxH: 180 },
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      vehicles: [
        { x: 0.1, y: 0.68, w: 55, h: 26, color: '#2288ff', type: 'car', dir: 1, speed: 0.4 },
        { x: 0.3, y: 0.7, w: 75, h: 32, color: '#0066cc', type: 'bus', dir: 1, speed: 0.3 },
        { x: 0.55, y: 0.68, w: 40, h: 20, color: '#00cc66', type: 'bike', dir: -1, speed: 0.5 },
        { x: 0.75, y: 0.68, w: 45, h: 22, color: '#ff8800', type: 'auto', dir: 1, speed: 0.35, weaving: true }
      ],
      pedestrians: { count: 4, colors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'], walkSpeed: 0.5 },
      focus: { x: 0.45, y: 0.6, zoom: 1.0 },
      headline: 'MULTI-MODAL CHAOS',
      subline: 'Cars, buses, bikes, autos, pedestrians. All at once.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    lane_discipline: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E'], count: 6, minH: 60, maxH: 120 },
      road: { y: 0.72, lanes: 3, color: '#555', lineColor: '#fff', dashLen: 30, dashGap: 20 },
      vehicles: [
        { x: 0.2, y: 0.68, w: 55, h: 26, color: '#2980b9', type: 'car', dir: 1, speed: 0.5 },
        { x: 0.5, y: 0.68, w: 55, h: 26, color: '#27ae60', type: 'car', dir: 1, speed: 0.4 },
        { x: 0.8, y: 0.68, w: 55, h: 26, color: '#8e44ad', type: 'car', dir: 1, speed: 0.6 }
      ],
      focus: { x: 0.5, y: 0.6, zoom: 0.95 },
      headline: 'LANE DISCIPLINE',
      subline: 'Stay in your lane. Signal before lane change.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    },
    driving_school: {
      sky: ['#87b6d8', '#5a9cc5'],
      buildings: { colors: ['#8B7355', '#A0926B', '#7A8B6E', '#9B8B7A'], count: 8, minH: 70, maxH: 160 },
      road: { y: 0.72, lanes: 2, color: '#555', lineColor: '#fff', dashLen: 25, dashGap: 18 },
      vehicles: [
        { x: 0.35, y: 0.68, w: 55, h: 26, color: '#f1c40f', type: 'car', dir: 1, speed: 0.3, learner: true }
      ],
      focus: { x: 0.4, y: 0.65, zoom: 1.0 },
      headline: 'DRIVING INSTRUCTOR',
      subline: 'Lane changes with indicators. Follow instructions.',
      particles: null,
      rain: false,
      night: false,
      wind: 0
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PARTICLE SYSTEMS
     ════════════════════════════════════════════════════════════════════════ */
  class ParticleSystem {
    constructor (type, w, h) {
      this.type = type
      this.w = w
      this.h = h
      this.particles = []
      this.init()
    }

    init () {
      const count = this.type === 'rain' ? 200 : this.type === 'confetti' ? 60 : this.type === 'dust' ? 40 : 80
      for (let i = 0; i < count; i++) {
        this.particles.push(this.createParticle(true))
      }
    }

    createParticle (randomY = false) {
      const w = this.w, h = this.h
      if (this.type === 'rain') {
        return { x: rand(0, w), y: randomY ? rand(-h, h) : rand(-20, 0), speed: rand(8, 16), len: rand(8, 20), opacity: rand(0.15, 0.4), wind: 0 }
      } else if (this.type === 'confetti') {
        return { x: rand(0, w), y: randomY ? rand(-h, h * 0.3) : rand(-30, 0), speed: rand(1, 3), size: rand(4, 10), color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22'][randInt(0, 5)], rotation: rand(0, Math.PI * 2), rotSpeed: rand(-0.1, 0.1), wobble: rand(0, Math.PI * 2), wobbleSpeed: rand(0.02, 0.06) }
      } else if (this.type === 'dust') {
        return { x: rand(0, w), y: randomY ? rand(0, h) : rand(h * 0.6, h), speed: rand(0.3, 1.2), size: rand(1, 4), opacity: rand(0.1, 0.3), drift: rand(-0.5, 0.5) }
      } else {
        return { x: rand(0, w), y: randomY ? rand(0, h) : 0, speed: rand(0.2, 0.8), size: rand(1, 3), opacity: rand(0.05, 0.15) }
      }
    }

    update (dt, wind = 0) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i]
        if (this.type === 'rain') {
          p.y += p.speed * dt * 60
          p.x += wind * dt * 60
          if (p.y > this.h + 20) { this.particles[i] = this.createParticle(false); this.particles[i].x = rand(0, this.w) }
        } else if (this.type === 'confetti') {
          p.y += p.speed * dt * 60
          p.wobble += p.wobbleSpeed
          p.x += Math.sin(p.wobble) * 0.8
          p.rotation += p.rotSpeed
          if (p.y > this.h + 20) { this.particles[i] = this.createParticle(false) }
        } else if (this.type === 'dust') {
          p.x += (p.drift + wind * 0.3) * dt * 60
          p.y -= p.speed * dt * 60
          p.opacity -= 0.001 * dt * 60
          if (p.y < -10 || p.opacity <= 0) { this.particles[i] = this.createParticle(false) }
        }
      }
    }

    draw (ctx) {
      for (const p of this.particles) {
        if (this.type === 'rain') {
          ctx.strokeStyle = `rgba(180,200,220,${p.opacity})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.wind * 0.5, p.y + p.len)
          ctx.stroke()
        } else if (this.type === 'confetti') {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.fillStyle = p.color
          ctx.globalAlpha = 0.8
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          ctx.restore()
        } else if (this.type === 'dust') {
          ctx.fillStyle = `rgba(180,160,120,${p.opacity})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DRAWING PRIMITIVES
     ════════════════════════════════════════════════════════════════════════ */

  function drawSky (ctx, w, h, colors, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.7)
    grad.addColorStop(0, colors[0])
    grad.addColorStop(1, colors[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  function drawSun (ctx, w, h, t) {
    const x = w * 0.8 + Math.sin(t * 0.1) * 20
    const y = h * 0.15 + Math.cos(t * 0.08) * 10
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 50)
    grad.addColorStop(0, 'rgba(255,240,180,0.9)')
    grad.addColorStop(0.3, 'rgba(255,220,100,0.4)')
    grad.addColorStop(1, 'rgba(255,200,50,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, 50, 0, Math.PI * 2)
    ctx.fill()
    // Core
    ctx.fillStyle = 'rgba(255,250,220,0.95)'
    ctx.beginPath()
    ctx.arc(x, y, 15, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawMoon (ctx, w, h, t) {
    const x = w * 0.75 + Math.sin(t * 0.05) * 15
    const y = h * 0.12
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 40)
    grad.addColorStop(0, 'rgba(220,230,255,0.9)')
    grad.addColorStop(0.4, 'rgba(180,200,240,0.3)')
    grad.addColorStop(1, 'rgba(100,120,180,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(220,230,255,0.95)'
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, Math.PI * 2)
    ctx.fill()
    // Crescent shadow
    ctx.fillStyle = 'rgba(10,10,20,0.6)'
    ctx.beginPath()
    ctx.arc(x + 5, y - 2, 10, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawStars (ctx, w, h, t, count = 50) {
    for (let i = 0; i < count; i++) {
      const seed = i * 7919
      const x = (seed * 13) % w
      const y = (seed * 17) % (h * 0.4)
      const twinkle = Math.sin(t * 2 + seed) * 0.3 + 0.7
      ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.8})`
      ctx.beginPath()
      ctx.arc(x, y, 1 + (i % 3 === 0 ? 0.5 : 0), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function drawMountains (ctx, w, h, t) {
    const roadY = h * 0.65
    // Far mountains
    ctx.fillStyle = '#4a6a5a'
    ctx.beginPath()
    ctx.moveTo(0, roadY)
    for (let x = 0; x <= w; x += 4) {
      const y = roadY - 60 - Math.sin(x * 0.008 + 1) * 40 - Math.sin(x * 0.003) * 60
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, roadY)
    ctx.closePath()
    ctx.fill()
    // Near mountains
    ctx.fillStyle = '#3a5a3a'
    ctx.beginPath()
    ctx.moveTo(0, roadY)
    for (let x = 0; x <= w; x += 4) {
      const y = roadY - 30 - Math.sin(x * 0.012 + 2) * 25 - Math.sin(x * 0.005 + 1) * 35
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, roadY)
    ctx.closePath()
    ctx.fill()
  }

  function drawBuildings (ctx, w, h, config, t, parallax) {
    if (!config) return
    const roadY = h * 0.65
    const px = parallax || 0
    for (let i = 0; i < config.count; i++) {
      const bw = w / config.count
      const bx = i * bw + px * (0.2 + i * 0.02)
      const bh = config.minH + (Math.sin(i * 2.7) * 0.5 + 0.5) * (config.maxH - config.minH)
      const by = roadY - bh
      const color = config.colors[i % config.colors.length]
      // Building body
      ctx.fillStyle = color
      ctx.fillRect(bx + 2, by, bw - 4, bh)
      // Windows
      ctx.fillStyle = 'rgba(255,255,200,0.3)'
      for (let wy = by + 10; wy < roadY - 15; wy += 18) {
        for (let wx = bx + 8; wx < bx + bw - 12; wx += 14) {
          const lit = Math.sin(wx * 0.1 + wy * 0.2 + t * 0.5) > 0.3
          ctx.fillStyle = lit ? 'rgba(255,240,150,0.7)' : 'rgba(100,120,150,0.3)'
          ctx.fillRect(wx, wy, 6, 8)
        }
      }
    }
  }

  function drawRoad (ctx, w, h, config, t, parallax) {
    if (!config) return
    const roadY = h * config.y
    const roadH = 80
    // Road surface
    ctx.fillStyle = config.color
    ctx.fillRect(0, roadY, w, roadH)
    // Lane markings
    if (config.lanes > 1) {
      ctx.strokeStyle = config.lineColor
      ctx.lineWidth = 2
      ctx.setLineDash([config.dashLen, config.dashGap])
      for (let lane = 1; lane < config.lanes; lane++) {
        const ly = roadY + (roadH / config.lanes) * lane
        ctx.beginPath()
        const offset = (parallax || 0) * 20 % (config.dashLen + config.dashGap)
        ctx.moveTo(-offset, ly)
        ctx.lineTo(w + config.dashLen, ly)
        ctx.stroke()
      }
      ctx.setLineDash([])
    }
    // Road edges
    ctx.strokeStyle = config.lineColor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, roadY)
    ctx.lineTo(w, roadY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, roadY + roadH)
    ctx.lineTo(w, roadY + roadH)
    ctx.stroke()
    // Cycle lane
    if (config.cycleLane) {
      ctx.strokeStyle = '#00cc66'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 5])
      ctx.beginPath()
      ctx.moveTo(0, roadY + roadH + 5)
      ctx.lineTo(w, roadY + roadH + 5)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  function drawVehicle (ctx, v, w, h, t) {
    const roadY = h * 0.65
    const vx = v.x * w
    const vy = v.y * h
    const vw = v.w
    const vh = v.h

    ctx.save()

    // Headlights glow for night
    if (v.headlights) {
      const grad = ctx.createRadialGradient(vx + (v.dir > 0 ? vw : 0), vy + vh / 2, 0, vx + (v.dir > 0 ? vw : 0), vy + vh / 2, 80)
      grad.addColorStop(0, 'rgba(255,240,180,0.4)')
      grad.addColorStop(1, 'rgba(255,240,180,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(vx + (v.dir > 0 ? vw : 0), vy + vh / 2, 80, 0, Math.PI * 2)
      ctx.fill()
    }

    if (v.type === 'auto') {
      // Auto-rickshaw body
      ctx.fillStyle = v.color
      ctx.beginPath()
      ctx.moveTo(vx, vy)
      ctx.lineTo(vx + vw, vy)
      ctx.lineTo(vx + vw, vy + vh * 0.5)
      ctx.lineTo(vx + vw * 0.6, vy + vh)
      ctx.lineTo(vx, vy + vh)
      ctx.closePath()
      ctx.fill()
      // Roof
      ctx.fillStyle = '#222'
      ctx.fillRect(vx + vw * 0.1, vy - 5, vw * 0.5, 6)
      // Wheels
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(vx + vw * 0.2, vy + vh + 2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(vx + vw * 0.8, vy + vh + 2, 5, 0, Math.PI * 2)
      ctx.fill()
    } else if (v.type === 'bike') {
      // Bike body
      ctx.fillStyle = v.color
      ctx.fillRect(vx + vw * 0.3, vy + 2, vw * 0.4, vh * 0.6)
      // Handlebar
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(vx + vw * 0.1, vy)
      ctx.lineTo(vx + vw * 0.3, vy + vh * 0.3)
      ctx.stroke()
      // Wheels
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(vx + vw * 0.15, vy + vh + 2, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(vx + vw * 0.85, vy + vh + 2, 6, 0, Math.PI * 2)
      ctx.fill()
    } else if (v.type === 'bus') {
      // Bus body
      ctx.fillStyle = v.color
      roundRect(ctx, vx, vy, vw, vh, 4)
      ctx.fill()
      // Windows
      ctx.fillStyle = 'rgba(180,220,255,0.5)'
      for (let wx = vx + 8; wx < vx + vw - 10; wx += 14) {
        ctx.fillRect(wx, vy + 4, 10, vh * 0.35)
      }
      // Wheels
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(vx + 12, vy + vh + 2, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(vx + vw - 12, vy + vh + 2, 6, 0, Math.PI * 2)
      ctx.fill()
    } else if (v.type === 'truck') {
      // Truck cab
      ctx.fillStyle = v.color
      roundRect(ctx, vx, vy, vw * 0.35, vh, 3)
      ctx.fill()
      // Truck bed
      ctx.fillStyle = darkenColor(v.color, 0.7)
      roundRect(ctx, vx + vw * 0.35, vy + 2, vw * 0.65, vh - 4, 2)
      ctx.fill()
      // Wheels
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(vx + 10, vy + vh + 2, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(vx + vw - 10, vy + vh + 2, 7, 0, Math.PI * 2)
      ctx.fill()
    } else if (v.type === 'ambulance') {
      // Ambulance body
      ctx.fillStyle = '#fff'
      roundRect(ctx, vx, vy, vw, vh, 4)
      ctx.fill()
      // Red cross
      ctx.fillStyle = '#e74c3c'
      ctx.fillRect(vx + vw * 0.4, vy + 2, vw * 0.2, vh * 0.6)
      ctx.fillRect(vx + vw * 0.35, vy + vh * 0.15, vw * 0.3, vh * 0.3)
      // Siren flash
      if (v.siren) {
        const flash = Math.sin(t * 8) > 0
        ctx.fillStyle = flash ? 'rgba(255,0,0,0.8)' : 'rgba(0,100,255,0.8)'
        ctx.beginPath()
        ctx.arc(vx + vw * 0.5, vy - 5, 6, 0, Math.PI * 2)
        ctx.fill()
        // Glow
        ctx.fillStyle = flash ? 'rgba(255,0,0,0.2)' : 'rgba(0,100,255,0.2)'
        ctx.beginPath()
        ctx.arc(vx + vw * 0.5, vy - 5, 20, 0, Math.PI * 2)
        ctx.fill()
      }
      // Wheels
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(vx + 12, vy + vh + 2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(vx + vw - 12, vy + vh + 2, 5, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Default car
      ctx.fillStyle = v.color
      roundRect(ctx, vx, vy, vw, vh, 6)
      ctx.fill()
      // Windshield
      ctx.fillStyle = 'rgba(150,200,255,0.4)'
      const wsX = v.dir > 0 ? vx + vw * 0.6 : vx + vw * 0.1
      roundRect(ctx, wsX, vy + 3, vw * 0.25, vh * 0.5, 3)
      ctx.fill()
      // Headlights
      ctx.fillStyle = 'rgba(255,255,200,0.9)'
      const hlX = v.dir > 0 ? vx + vw - 3 : vx + 3
      ctx.fillRect(hlX - 2, vy + 4, 4, 4)
      ctx.fillRect(hlX - 2, vy + vh - 8, 4, 4)
      // Taillights
      ctx.fillStyle = 'rgba(255,30,30,0.8)'
      const tlX = v.dir > 0 ? vx + 3 : vx + vw - 3
      ctx.fillRect(tlX - 2, vy + 4, 4, 4)
      ctx.fillRect(tlX - 2, vy + vh - 8, 4, 4)
      // Wheels
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(vx + vw * 0.2, vy + vh + 2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(vx + vw * 0.8, vy + vh + 2, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  function drawPedestrian (ctx, p, w, h, t) {
    const px = p.x * w
    const py = p.y * h
    const bobY = Math.sin(t * 3 + p.seed) * 2
    const legSwing = Math.sin(t * 4 + p.seed) * 0.3

    ctx.save()
    ctx.translate(px, py + bobY)

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.ellipse(0, 18, 6, 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Legs
    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-2, 6)
    ctx.lineTo(-2 + Math.sin(legSwing) * 4, 16)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(2, 6)
    ctx.lineTo(2 - Math.sin(legSwing) * 4, 16)
    ctx.stroke()

    // Body
    ctx.fillStyle = p.color
    ctx.fillRect(-4, -4, 8, 12)

    // Head
    ctx.fillStyle = '#f1c27d'
    ctx.beginPath()
    ctx.arc(0, -8, 5, 0, Math.PI * 2)
    ctx.fill()

    // Hair
    ctx.fillStyle = '#2c1810'
    ctx.beginPath()
    ctx.arc(0, -10, 5, Math.PI, 0)
    ctx.fill()

    ctx.restore()
  }

  function drawAnimal (ctx, a, w, h, t) {
    const ax = a.x * w
    const ay = a.y * h
    ctx.save()
    ctx.translate(ax, ay)

    if (a.type === 'cow') {
      // Cow body
      ctx.fillStyle = a.color || '#8B4513'
      ctx.beginPath()
      ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2)
      ctx.fill()
      // Head
      ctx.fillStyle = a.color || '#8B4513'
      ctx.beginPath()
      ctx.ellipse(28, -5, 10, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      // Horns
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(30, -12)
      ctx.lineTo(35, -18)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(26, -12)
      ctx.lineTo(21, -18)
      ctx.stroke()
      // Eye
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(32, -6, 2, 0, Math.PI * 2)
      ctx.fill()
      // Legs
      ctx.strokeStyle = a.color || '#6B3410'
      ctx.lineWidth = 3
      for (const lx of [-15, -5, 8, 18]) {
        ctx.beginPath()
        ctx.moveTo(lx, 10)
        ctx.lineTo(lx, 18)
        ctx.stroke()
      }
      // Tail
      ctx.strokeStyle = a.color || '#6B3410'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-25, -2)
      ctx.quadraticCurveTo(-35, -8 + Math.sin(t * 2) * 5, -38, -4)
      ctx.stroke()
    } else {
      // Chicken
      ctx.fillStyle = a.color || '#cc8833'
      ctx.beginPath()
      ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#cc3333'
      ctx.beginPath()
      ctx.arc(2, -7, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#cc8833'
      ctx.beginPath()
      ctx.arc(7, -5, 3, 0, Math.PI * 2)
      ctx.fill()
      // Beak
      ctx.fillStyle = '#ff9900'
      ctx.beginPath()
      ctx.moveTo(8, -6)
      ctx.lineTo(12, -5)
      ctx.lineTo(8, -4)
      ctx.closePath()
      ctx.fill()
      // Legs
      ctx.strokeStyle = '#cc8833'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-2, 5)
      ctx.lineTo(-2, 10)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(2, 5)
      ctx.lineTo(2, 10)
      ctx.stroke()
    }
    ctx.restore()
  }

  function drawTrafficLight (ctx, config, w, h, t) {
    if (!config) return
    const x = config.x * w
    const y = config.y * h
    const stateIdx = Math.floor(t * 0.5) % config.states.length
    const state = config.states[stateIdx]

    ctx.save()
    // Pole
    ctx.fillStyle = '#333'
    ctx.fillRect(x - 2, y, 4, h * 0.3)
    // Housing
    ctx.fillStyle = '#222'
    roundRect(ctx, x - 12, y - 50, 24, 55, 5)
    ctx.fill()
    // Lights
    const lights = [
      { color: '#ff0000', on: state === 'red', yOff: -42 },
      { color: '#ffaa00', on: state === 'yellow', yOff: -25 },
      { color: '#00cc00', on: state === 'green', yOff: -8 }
    ]
    for (const l of lights) {
      ctx.fillStyle = l.on ? l.color : 'rgba(50,50,50,0.5)'
      ctx.beginPath()
      ctx.arc(x, y + l.yOff, 7, 0, Math.PI * 2)
      ctx.fill()
      if (l.on) {
        ctx.fillStyle = l.color.replace(')', ',0.3)').replace('rgb', 'rgba')
        const glow = ctx.createRadialGradient(x, y + l.yOff, 0, x, y + l.yOff, 20)
        glow.addColorStop(0, l.color + '66')
        glow.addColorStop(1, l.color + '00')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y + l.yOff, 20, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  function drawRoadSign (ctx, sign, w, h, t) {
    const x = sign.x * w
    const y = h * 0.5
    ctx.save()
    // Pole
    ctx.fillStyle = '#888'
    ctx.fillRect(x - 1.5, y, 3, h * 0.2)
    // Sign shape
    if (sign.type === 'mandatory') {
      ctx.fillStyle = sign.color
      ctx.beginPath()
      ctx.arc(x, y - 10, 18, 0, Math.PI * 2)
      ctx.fill()
    } else if (sign.type === 'cautionary') {
      ctx.fillStyle = sign.color
      ctx.beginPath()
      ctx.moveTo(x, y - 35)
      ctx.lineTo(x + 20, y)
      ctx.lineTo(x - 20, y)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.fillStyle = sign.color
      roundRect(ctx, x - 18, y - 25, 36, 25, 3)
      ctx.fill()
    }
    // Symbol
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(sign.symbol, x, y - 12)
    ctx.restore()
  }

  function drawPuddle (ctx, p, w, h, t) {
    const px = p.x * w
    const py = p.y * h
    const shimmer = Math.sin(t * 2 + p.x * 5) * 0.1 + 0.2
    ctx.fillStyle = `rgba(100,150,200,${shimmer})`
    ctx.beginPath()
    ctx.ellipse(px, py, p.w / 2, p.h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    // Reflection highlight
    ctx.fillStyle = `rgba(200,230,255,${shimmer * 0.5})`
    ctx.beginPath()
    ctx.ellipse(px - p.w * 0.15, py - 2, p.w * 0.2, p.h * 0.2, -0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawFog (ctx, w, h, t, intensity) {
    for (let i = 0; i < 5; i++) {
      const fogY = h * (0.3 + i * 0.1)
      const fogH = h * 0.15
      const grad = ctx.createLinearGradient(0, fogY, 0, fogY + fogH)
      const alpha = (intensity || 0.15) * (1 - Math.sin(t * 0.3 + i) * 0.2)
      grad.addColorStop(0, `rgba(180,190,200,0)`)
      grad.addColorStop(0.5, `rgba(180,190,200,${alpha})`)
      grad.addColorStop(1, `rgba(180,190,200,0)`)
      ctx.fillStyle = grad
      ctx.fillRect(0, fogY, w, fogH)
    }
  }

  function drawDecorations (ctx, w, h, t) {
    // Bunting / festive lights across the road
    const roadY = h * 0.65
    const startY = roadY - 40
    ctx.strokeStyle = '#f39c12'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, startY + Math.sin(t * 0.5) * 3)
    for (let x = 0; x <= w; x += 5) {
      ctx.lineTo(x, startY + Math.sin(x * 0.02 + t * 0.5) * 8)
    }
    ctx.stroke()
    // Light bulbs
    for (let x = 20; x < w; x += 40) {
      const by = startY + Math.sin(x * 0.02 + t * 0.5) * 8 + 5
      const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6']
      ctx.fillStyle = colors[Math.floor(x / 40) % colors.length]
      ctx.beginPath()
      ctx.arc(x, by, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function drawConstruction (ctx, w, h, t) {
    const roadY = h * 0.65
    // Barriers
    for (let i = 0; i < 5; i++) {
      const bx = w * 0.3 + i * 30
      ctx.fillStyle = '#ff6600'
      ctx.fillRect(bx, roadY - 15, 8, 15)
      ctx.fillStyle = '#fff'
      ctx.fillRect(bx + 1, roadY - 13, 6, 3)
      ctx.fillRect(bx + 1, roadY - 8, 6, 3)
    }
    // Cones
    for (let i = 0; i < 3; i++) {
      const cx = w * 0.6 + i * 25
      ctx.fillStyle = '#ff6600'
      ctx.beginPath()
      ctx.moveTo(cx, roadY - 20)
      ctx.lineTo(cx + 8, roadY)
      ctx.lineTo(cx - 8, roadY)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(cx - 5, roadY - 14, 10, 3)
    }
  }

  function drawTollPlaza (ctx, w, h, t) {
    const roadY = h * 0.65
    const plazaY = roadY - 60
    // Structure
    ctx.fillStyle = '#8B7355'
    ctx.fillRect(w * 0.3, plazaY, w * 0.4, 70)
    ctx.fillStyle = '#A0926B'
    ctx.fillRect(w * 0.28, plazaY - 8, w * 0.44, 12)
    // Booths
    for (let i = 0; i < 4; i++) {
      const bx = w * 0.33 + i * (w * 0.09)
      ctx.fillStyle = '#555'
      ctx.fillRect(bx, plazaY + 15, 20, 45)
      // Barrier arm
      const armUp = i === 2
      ctx.strokeStyle = '#e74c3c'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(bx + 20, plazaY + 30)
      const armAngle = armUp ? -0.5 : 0
      ctx.lineTo(bx + 20 + Math.cos(armAngle) * 30, plazaY + 30 + Math.sin(armAngle) * 30)
      ctx.stroke()
    }
  }

  function drawSchool (ctx, w, h, t) {
    // School sign
    const sx = w * 0.15
    const sy = h * 0.55
    ctx.fillStyle = '#f1c40f'
    roundRect(ctx, sx - 30, sy - 20, 60, 25, 5)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.font = 'bold 10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SCHOOL', sx, sy - 8)
    // Zebra crossing
    const roadY = h * 0.65
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(w * 0.35 + i * 12, roadY + 10, 6, 55)
    }
  }

  function drawTemple (ctx, w, h, t) {
    const tx = w * 0.8
    const ty = h * 0.45
    // Temple dome
    ctx.fillStyle = '#c0a060'
    ctx.beginPath()
    ctx.arc(tx, ty, 25, Math.PI, 0)
    ctx.fill()
    // Spire
    ctx.fillStyle = '#d4af37'
    ctx.beginPath()
    ctx.moveTo(tx, ty - 40)
    ctx.lineTo(tx + 8, ty - 20)
    ctx.lineTo(tx - 8, ty - 20)
    ctx.closePath()
    ctx.fill()
    // Base
    ctx.fillStyle = '#c0a060'
    ctx.fillRect(tx - 30, ty, 60, 40)
    // Entrance
    ctx.fillStyle = '#8B4513'
    ctx.beginPath()
    ctx.arc(tx, ty + 20, 12, Math.PI, 0)
    ctx.fill()
    ctx.fillRect(tx - 12, ty + 20, 24, 20)
    // Flag
    ctx.strokeStyle = '#ff6600'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(tx, ty - 40)
    ctx.lineTo(tx, ty - 55)
    ctx.stroke()
    ctx.fillStyle = '#ff6600'
    ctx.beginPath()
    ctx.moveTo(tx, ty - 55)
    ctx.lineTo(tx + 12 + Math.sin(t * 3) * 2, ty - 50)
    ctx.lineTo(tx, ty - 45)
    ctx.closePath()
    ctx.fill()
  }

  function drawNoHonkSign (ctx, w, h, t) {
    const nx = w * 0.85
    const ny = h * 0.5
    // Circle
    ctx.strokeStyle = '#cc0000'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(nx, ny, 20, 0, Math.PI * 2)
    ctx.stroke()
    // Horn icon
    ctx.fillStyle = '#cc0000'
    ctx.font = '16px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📯', nx, ny - 2)
    // Slash
    ctx.strokeStyle = '#cc0000'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(nx - 15, ny + 15)
    ctx.lineTo(nx + 15, ny - 15)
    ctx.stroke()
  }

  /* ── UTILITY DRAWING ── */
  function roundRect (ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function darkenColor (hex, factor) {
    const r = hexToRgb(hex)
    return rgbStr(Math.round(r.r * factor), Math.round(r.g * factor), Math.round(r.b * factor))
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN SCENARIO ENGINE
     ════════════════════════════════════════════════════════════════════════ */
  class Scenario2D {
    constructor () {
      this.canvas = null
      this.ctx = null
      this.running = false
      this.particles = null
      this.animFrame = null
      this.startTime = 0
      this.duration = 5000 // 5 second intro
      this.onComplete = null
      this.headlineAlpha = 0
      this.sublineAlpha = 0
      this.textTyped = ''
      this.textTimer = 0
      this.camX = 0
      this.camY = 0
      this.camZoom = 1
      this.targetCamX = 0
      this.targetCamY = 0
      this.targetCamZoom = 1
      this.skipRequested = false
    }

    /**
     * Play a 2D scenario intro for a given level.
     * @param {number} levelId - The level ID (1-52)
     * @param {Function} onComplete - Called when intro finishes or is skipped
     */
    play (levelId, onComplete) {
      // Find the scenario data
      const lv = window.LVS ? window.LVS.find(l => l.id === levelId) : null
      const themeType = lv ? (lv.themeType || 'signal_jump') : 'signal_jump'
      const scenario = SCENARIOS[themeType] || SCENARIOS.signal_jump

      this.onComplete = onComplete
      this.skipRequested = false

      // Create canvas
      this.canvas = document.createElement('canvas')
      this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10000;cursor:pointer;'
      this.canvas.width = window.innerWidth * (window.devicePixelRatio || 1)
      this.canvas.height = window.innerHeight * (window.devicePixelRatio || 1)
      this.ctx = this.canvas.getContext('2d')
      document.body.appendChild(this.canvas)

      // Handle skip
      const skipHandler = (e) => {
        e.preventDefault()
        this.skip()
        this.canvas.removeEventListener('click', skipHandler)
        this.canvas.removeEventListener('touchstart', skipHandler)
        this.canvas.removeEventListener('keydown', skipHandler)
      }
      this.canvas.addEventListener('click', skipHandler)
      this.canvas.addEventListener('touchstart', skipHandler, { passive: false })
      this.canvas.addEventListener('keydown', skipHandler)

      // Init particles
      if (scenario.rain) {
        this.particles = new ParticleSystem('rain', this.canvas.width, this.canvas.height)
      } else if (scenario.particles === 'confetti') {
        this.particles = new ParticleSystem('confetti', this.canvas.width, this.canvas.height)
      } else if (scenario.particles === 'dust') {
        this.particles = new ParticleSystem('dust', this.canvas.width, this.canvas.height)
      }

      // Init pedestrian positions
      if (scenario.pedestrians) {
        scenario._pedInstances = []
        for (let i = 0; i < scenario.pedestrians.count; i++) {
          scenario._pedInstances.push({
            x: rand(0.15, 0.85),
            y: scenario.road.y + 0.01,
            color: scenario.pedestrians.colors[i % scenario.pedestrians.colors.length],
            seed: rand(0, Math.PI * 2),
            dir: Math.random() > 0.5 ? 1 : -1,
            speed: scenario.pedestrians.walkSpeed * rand(0.7, 1.3)
          })
        }
      }

      // Camera setup
      const focus = scenario.focus || { x: 0.5, y: 0.65, zoom: 1 }
      this.targetCamX = (focus.x - 0.5) * 30
      this.targetCamY = (focus.y - 0.5) * 20
      this.targetCamZoom = focus.zoom
      this.camX = 0
      this.camY = -20
      this.camZoom = 1.3

      this.startTime = performance.now()
      this.running = true
      this.headlineAlpha = 0
      this.sublineAlpha = 0
      this.textTyped = ''
      this.textTimer = 0

      this._animate(scenario)
    }

    _animate (scenario) {
      if (!this.running) return

      const now = performance.now()
      const elapsed = now - this.startTime
      const t = elapsed / 1000
      const dt = 1 / 60
      const progress = clamp(elapsed / this.duration, 0, 1)

      const w = this.canvas.width
      const h = this.canvas.height

      // Skip fade
      if (this.skipRequested) {
        const skipProgress = clamp((elapsed - (this.duration - 500)) / 500, 0, 1)
        if (skipProgress >= 1) {
          this.destroy()
          return
        }
      }

      // Camera animation — smooth zoom in from wide to focus
      const camProgress = Ease.easeInOutCubic(clamp(elapsed / 2500, 0, 1))
      this.camX = lerp(0, this.targetCamX, camProgress)
      this.camY = lerp(-20, this.targetCamY, camProgress)
      this.camZoom = lerp(1.3, this.targetCamZoom, camProgress)

      // View bobbing
      const bobX = Math.sin(t * 1.2) * 2 * (1 - progress)
      const bobY = Math.cos(t * 0.8) * 1.5 * (1 - progress)

      // Clear
      ctx.clearRect(0, 0, w, h)

      // Apply camera transform
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(this.camZoom, this.camZoom)
      ctx.translate(-w / 2 + this.camX + bobX, -h / 2 + this.camY + bobY)

      // Draw scene layers (back to front)
      drawSky(ctx, w, h, scenario.sky, t)

      if (scenario.night) {
        drawStars(ctx, w, h, t)
        drawMoon(ctx, w, h, t)
      } else {
        drawSun(ctx, w, h, t)
      }

      if (scenario.mountains) {
        drawMountains(ctx, w, h, t)
      }

      if (scenario.buildings) {
        drawBuildings(ctx, w, h, scenario.buildings, t, this.camX)
      }

      // Scene-specific elements
      if (scenario.school) drawSchool(ctx, w, h, t)
      if (scenario.temple) drawTemple(ctx, w, h, t)
      if (scenario.noHonk) drawNoHonkSign(ctx, w, h, t)
      if (scenario.construction) drawConstruction(ctx, w, h, t)
      if (scenario.tollPlaza) drawTollPlaza(ctx, w, h, t)
      if (scenario.decorations) drawDecorations(ctx, w, h, t)

      // Road signs
      if (scenario.roadSigns) {
        for (const sign of scenario.roadSigns) drawRoadSign(ctx, sign, w, h, t)
      }

      // Traffic light
      if (scenario.trafficLight) drawTrafficLight(ctx, scenario.trafficLight, w, h, t)

      // Road
      drawRoad(ctx, w, h, scenario.road, t, this.camX)

      // Puddles
      if (scenario.puddles) {
        for (const p of scenario.puddles) drawPuddle(ctx, p, w, h, t)
      }

      // Parked cars
      if (scenario.parkedCars) {
        for (const pc of scenario.parkedCars) drawVehicle(ctx, { ...pc, dir: 1, type: 'car' }, w, h, t)
      }

      // Animals
      if (scenario.animals) {
        for (const a of scenario.animals) drawAnimal(ctx, a, w, h, t)
      }

      // Vehicles — animate movement
      if (scenario.vehicles) {
        for (const v of scenario.vehicles) {
          const vv = { ...v }
          if (v.speed > 0) {
            vv.x = (v.x + (v.dir || 1) * v.speed * t * 0.03) % 1.2
            if (vv.x < -0.1) vv.x = 1.1
          }
          if (v.weaving) {
            vv.y = v.y + Math.sin(t * 3 + v.x * 10) * 0.008
          }
          drawVehicle(ctx, vv, w, h, t)
        }
      }

      // Pedestrians
      if (scenario._pedInstances) {
        for (const p of scenario._pedInstances) {
          const pp = { ...p }
          pp.x = (p.x + p.dir * p.speed * t * 0.02) % 1.1
          if (pp.x < -0.05) pp.x = 1.05
          if (pp.x > 1.05) pp.x = -0.05
          drawPedestrian(ctx, pp, w, h, t)
        }
      }

      // Fog
      if (scenario.fog) {
        drawFog(ctx, w, h, t, 0.25)
      } else if (scenario.night) {
        drawFog(ctx, w, h, t, 0.08)
      }

      // Particles
      if (this.particles) {
        this.particles.update(dt, scenario.wind || 0)
        this.particles.draw(ctx)
      }

      ctx.restore()

      // ── UI OVERLAY ──
      // Dark vignette
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.5)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      // Level badge
      const badgeAlpha = Ease.easeOutBack(clamp((elapsed - 300) / 600, 0, 1))
      if (badgeAlpha > 0) {
        ctx.globalAlpha = badgeAlpha
        const bx = w / 2
        const by = h * 0.32
        // Badge background
        ctx.fillStyle = 'rgba(0,0,0,0.4)'
        roundRect(ctx, bx - 140, by - 18, 280, 36, 18)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.round(14 * (w / 800))}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const levelNum = lv ? lv.id : 1
        const levelIcon = lv ? lv.icon : '🚦'
        ctx.fillText(`${levelIcon}  Level ${levelNum}  ${levelIcon}`, bx, by)
        ctx.globalAlpha = 1
      }

      // Headline — typewriter effect
      const headlineDelay = 800
      const headlineAlpha = Ease.easeOutCubic(clamp((elapsed - headlineDelay) / 500, 0, 1))
      if (headlineAlpha > 0) {
        ctx.globalAlpha = headlineAlpha
        const hx = w / 2
        const hy = h * 0.48
        // Background bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        const hw = Math.min(w * 0.85, 600)
        roundRect(ctx, hx - hw / 2, hy - 28, hw, 56, 12)
        ctx.fill()
        // Accent line
        const accentGrad = ctx.createLinearGradient(hx - hw / 2, 0, hx + hw / 2, 0)
        accentGrad.addColorStop(0, '#00ff88')
        accentGrad.addColorStop(0.5, '#5ed4f5')
        accentGrad.addColorStop(1, '#b89bff')
        ctx.fillStyle = accentGrad
        roundRect(ctx, hx - hw / 2, hy - 28, hw, 3, 1.5)
        ctx.fill()
        // Text
        const headline = scenario.headline || 'SCENARIO'
        const charIdx = Math.floor(clamp((elapsed - headlineDelay) / 30, 0, headline.length))
        const displayHeadline = headline.substring(0, charIdx)
        ctx.fillStyle = '#fff'
        ctx.font = `800 ${Math.round(28 * (w / 800))}px 'Bebas Neue', 'Inter', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(displayHeadline, hx, hy)
        // Cursor blink
        if (charIdx < headline.length && Math.floor(t * 3) % 2 === 0) {
          const metrics = ctx.measureText(displayHeadline)
          ctx.fillStyle = '#00ff88'
          ctx.fillRect(hx + metrics.width / 2 + 3, hy - 12, 2, 24)
        }
        ctx.globalAlpha = 1
      }

      // Subline — fade in after headline types out
      const sublineDelay = headlineDelay + 500 + (scenario.headline || '').length * 30
      const sublineAlpha = Ease.easeOutCubic(clamp((elapsed - sublineDelay) / 400, 0, 1))
      if (sublineAlpha > 0) {
        ctx.globalAlpha = sublineAlpha
        const sx = w / 2
        const sy = h * 0.56
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = `500 ${Math.round(15 * (w / 800))}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(scenario.subline || '', sx, sy)
        ctx.globalAlpha = 1
      }

      // "Tap to skip" hint
      if (elapsed > 1500) {
        const skipAlpha = Ease.easeOutCubic(clamp((elapsed - 1500) / 300, 0, 0.4))
        ctx.globalAlpha = skipAlpha * (0.3 + Math.sin(t * 2) * 0.1)
        ctx.fillStyle = '#fff'
        ctx.font = `400 ${Math.round(11 * (w / 800))}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Tap anywhere to skip', w / 2, h * 0.88)
        ctx.globalAlpha = 1
      }

      // Law hint (bottom)
      if (lv && lv.law && elapsed > 2000) {
        const lawAlpha = Ease.easeOutCubic(clamp((elapsed - 2000) / 500, 0, 0.6))
        ctx.globalAlpha = lawAlpha
        const lawY = h * 0.92
        ctx.fillStyle = 'rgba(255,100,100,0.15)'
        roundRect(ctx, w / 2 - 180, lawY - 12, 360, 24, 6)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,180,180,0.7)'
        ctx.font = `500 ${Math.round(10 * (w / 800))}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(`⚖️ ${lv.law.off} — Fine: ${lv.law.fine}`, w / 2, lawY)
        ctx.globalAlpha = 1
      }

      // Progress bar
      const barW = 120
      const barH = 3
      const barX = w / 2 - barW / 2
      const barY = h * 0.95
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      roundRect(ctx, barX, barY, barW, barH, 1.5)
      ctx.fill()
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0)
      barGrad.addColorStop(0, '#00ff88')
      barGrad.addColorStop(1, '#5ed4f5')
      ctx.fillStyle = barGrad
      roundRect(ctx, barX, barY, barW * progress, barH, 1.5)
      ctx.fill()

      // Auto-complete at duration
      if (elapsed >= this.duration) {
        this.destroy()
        return
      }

      this.animFrame = requestAnimationFrame(() => this._animate(scenario))
    }

    skip () {
      if (!this.running) return
      this.skipRequested = true
      // Quick fade out
      const fadeStart = performance.now()
      const fadeOut = () => {
        const elapsed = performance.now() - fadeStart
        const alpha = clamp(elapsed / 400, 0, 1)
        if (this.canvas) {
          this.ctx.fillStyle = `rgba(0,0,0,${alpha})`
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
        if (alpha < 1) {
          requestAnimationFrame(fadeOut)
        } else {
          this.destroy()
        }
      }
      requestAnimationFrame(fadeOut)
    }

    destroy () {
      this.running = false
      if (this.animFrame) cancelAnimationFrame(this.animFrame)
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.style.transition = 'opacity 0.3s ease'
        this.canvas.style.opacity = '0'
        setTimeout(() => {
          if (this.canvas && this.canvas.parentNode) this.canvas.remove()
          this.canvas = null
          this.ctx = null
          if (this.onComplete) this.onComplete()
        }, 300)
      } else {
        if (this.onComplete) this.onComplete()
      }
    }
  }

  /* ── Expose globally ── */
  window.Scenario2D = new Scenario2D()
  window.Scenario2DData = SCENARIOS

  console.log('[Scenario2D] Engine loaded — 35 theme scenarios, parallax, particles, typewriter text, view bobbing')
})()
