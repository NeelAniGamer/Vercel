/**
 * Traffic Driving Simulator - Next-Gen Procedural Web Audio Engine
 * High-fidelity, low-latency synthesized sound effects for supercars, V8 engines,
 * turbo spool, blow-off valves, exhaust crackles, tire screeches, footsteps,
 * car doors, seatbelts, sirens, horns, and dynamic crashes.
 */
class TrafficAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.engineNode = null;
    this.initialized = false;
    this._engineRunning = false;
    this._stepAlt = false;
    this._lastStepTime = 0;
    this._sirenPlaying = false;
    this._prevThrottle = false;
    this._currentGear = 1;
    this._gearRpm = 0.2;
    this._lastShiftTime = 0;
    this._lastPopTime = 0;

    // Distortion curve for warm, smooth acoustic engine growl
    this._distortionCurve = this._makeDistortionCurve(4);
  }

  get isEngineRunning() {
    return this._engineRunning;
  }

  isEngineRunningFn() {
    return this._engineRunning;
  }

  _makeDistortionCurve(amount = 4) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  _initContext() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();

      const savedVol = typeof localStorage !== 'undefined' ? localStorage.getItem('traffic_volume') : null;
      const initVol = (savedVol !== null && !isNaN(parseInt(savedVol))) ? Math.max(0, Math.min(1, parseInt(savedVol) / 100)) : 0.70;
      this.masterGain.gain.value = initVol;

      // Master compressor for clean, punchy audio without clipping
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-14, this.ctx.currentTime);
      comp.knee.setValueAtTime(8, this.ctx.currentTime);
      comp.ratio.setValueAtTime(6, this.ctx.currentTime);
      comp.attack.setValueAtTime(0.003, this.ctx.currentTime);
      comp.release.setValueAtTime(0.12, this.ctx.currentTime);

      this.masterGain.connect(comp);
      comp.connect(this.ctx.destination);
      // Sub-mix buses: voice (horns/sirens/dialogue stingers), world
      // (engine/wind/crash), ui (clicks). Each persists its own volume.
      const mkBus = (key, def) => {
        const g = this.ctx.createGain();
        let v = def;
        try {
          const s = localStorage.getItem('traffic_bus_' + key);
          if (s !== null && !isNaN(parseFloat(s))) v = Math.max(0, Math.min(1, parseFloat(s)));
        } catch (e) {}
        g.gain.value = v;
        g.connect(this.masterGain);
        return g;
      };
      this.voiceGain = mkBus('voice', 1);
      this.worldGain = mkBus('world', 1);
      this.uiGain = mkBus('ui', 1);
      this.initialized = true;
    } catch (e) {
      // AudioContext creation silently deferred until user gesture
    }
  }

  setMasterVolume(volume) {
    this._ensureUnlocked();
    const v = Math.max(0, Math.min(1, typeof volume === 'number' ? volume : parseFloat(volume)));
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(v, this.ctx.currentTime);
      } catch (e) {}
      this.masterGain.gain.value = v;
    }
  }

  // Per-bus volume (voice/world/ui), persisted. Ducking never touches these.
  setBusVolume(bus, volume) {
    const v = Math.max(0, Math.min(1, typeof volume === 'number' ? volume : parseFloat(volume)));
    const g = bus === 'voice' ? this.voiceGain : bus === 'world' ? this.worldGain : bus === 'ui' ? this.uiGain : null;
    if (g) {
      try { g.gain.setTargetAtTime(v * (this._duckFactor || 1), this.ctx.currentTime, 0.05); }
      catch (e) { try { g.gain.value = v; } catch (e2) {} }
      try { localStorage.setItem('traffic_bus_' + bus, String(v)); } catch (e) {}
    }
  }

  // Duck the world bus under dialogue/voice moments, then restore.
  // factor 0.5 ≈ −6dB. Re-calling extends the hold; volumes stay intact.
  duckWorld(factor = 0.5, holdMs = 4000) {
    if (!this.ctx || !this.worldGain) return;
    try {
      this._duckFactor = Math.max(0.05, Math.min(1, factor));
      this.worldGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.worldGain.gain.setTargetAtTime(this._duckBase() * this._duckFactor, this.ctx.currentTime, 0.15);
      clearTimeout(this._duckTimer);
      this._duckTimer = setTimeout(() => {
        try {
          this._duckFactor = 1;
          this.worldGain.gain.setTargetAtTime(this._duckBase(), this.ctx.currentTime, 0.4);
        } catch (e) {}
      }, holdMs);
    } catch (e) {}
  }

  _duckBase() {
    try {
      const s = localStorage.getItem('traffic_bus_world');
      if (s !== null && !isNaN(parseFloat(s))) return Math.max(0, Math.min(1, parseFloat(s)));
    } catch (e) {}
    return 1;
  }

  _ensureUnlocked() {
    this._initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ── 1. SUPERCAR V8 / V10 ACOUSTIC ENGINE SYNTHESIZER ──
  // Per-vehicle engine character: real cars don't all sound like one sedan.
  // freqMul shifts the whole engine up/down, filterMul opens/closes the intake,
  // gainMul balances loudness (a truck is felt more than heard vs a bike).
  static ENGINE_PRESETS = {
    default:  { freqMul: 1.0,  filterMul: 1.0,  gainMul: 1.0 },
    car:      { freqMul: 1.0,  filterMul: 1.0,  gainMul: 1.0 },
    taxi:     { freqMul: 1.1,  filterMul: 1.05, gainMul: 1.0 },
    // High-revving performance cars: scream higher, brighter intake
    supercar_white: { freqMul: 1.4, filterMul: 1.5, gainMul: 1.1 },
    sports_cyan:    { freqMul: 1.4, filterMul: 1.5, gainMul: 1.1 },
    bmw_m4:         { freqMul: 1.3, filterMul: 1.35, gainMul: 1.1 },
    nilu_27:        { freqMul: 1.5, filterMul: 1.6, gainMul: 1.15 },
    // Singles & two-strokes: buzzy, thin, quieter
    bike:           { freqMul: 1.9, filterMul: 1.2, gainMul: 0.7 },
    splendor:       { freqMul: 1.9, filterMul: 1.2, gainMul: 0.7 },
    activa:         { freqMul: 2.0, filterMul: 1.15, gainMul: 0.65 },
    ktm:            { freqMul: 1.7, filterMul: 1.3, gainMul: 0.8 },
    cyberpunk_bike: { freqMul: 2.2, filterMul: 1.4, gainMul: 0.6 },
    cycle:          { freqMul: 1.0, filterMul: 0.4, gainMul: 0.0 },
    auto:           { freqMul: 2.3, filterMul: 0.9, gainMul: 0.85 },
    auto_yellow:    { freqMul: 2.3, filterMul: 0.9, gainMul: 0.85 },
    // Diesels: low growl, darker intake, heavier body
    bus:            { freqMul: 0.55, filterMul: 0.7, gainMul: 1.15 },
    bus_green:      { freqMul: 0.55, filterMul: 0.7, gainMul: 1.15 },
    truck:          { freqMul: 0.5,  filterMul: 0.65, gainMul: 1.2 },
    ambulance:      { freqMul: 0.9,  filterMul: 1.0, gainMul: 1.05 },
    police:         { freqMul: 1.05, filterMul: 1.1, gainMul: 1.05 }
  };

  // Horn voices: air horns (truck/bus) sit much lower than a taxi's dual trumpet
  static HORN_PITCH = {
    taxi: 1.0, car: 1.0, bike: 1.25, auto: 1.15,
    bus: 0.62, truck: 0.55, ambulance: 0.8, police: 0.9
  };

  startEngine(initialRpm = 0.20, vehicleType = 'car') {
    this._ensureUnlocked();
    if (!this.ctx || this._engineRunning) return;

    try {
      const now = this.ctx.currentTime;
      this._engineRunning = true;
      this._currentGear = 1;
      this._gearRpm = initialRpm;
      this._lastShiftTime = now;
      const preset = TrafficAudioEngine.ENGINE_PRESETS[vehicleType] || TrafficAudioEngine.ENGINE_PRESETS.default;
      this._vehPreset = preset;

      // ── Starter motor crank (3 churns) before the engine catches ──
      try {
        const crankOsc = this.ctx.createOscillator();
        crankOsc.type = 'square';
        crankOsc.frequency.setValueAtTime(75, now);
        const crankGain = this.ctx.createGain();
        crankGain.gain.setValueAtTime(0.001, now);
        for (let c = 0; c < 3; c++) {
          crankGain.gain.linearRampToValueAtTime(0.10, now + c * 0.11 + 0.02);
          crankGain.gain.linearRampToValueAtTime(0.001, now + c * 0.11 + 0.10);
        }
        crankOsc.connect(crankGain);
        crankGain.connect(this.worldGain);
        crankOsc.start(now);
        crankOsc.stop(now + 0.36);
      } catch (e) {}

      // Master engine volume gain
      const engineGain = this.ctx.createGain();
      engineGain.gain.setValueAtTime(0.001, now);
      engineGain.gain.exponentialRampToValueAtTime(0.28, now + 0.35);

      // ── Layer A: Sub-bass engine pulse (28Hz - 55Hz) ──
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(32, now);
      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.48;
      subOsc.connect(subGain);

      // ── Layer B: Dual smooth cylinder combustion (Sawtooth + Triangle + Soft Saturation) ──
      const saw1 = this.ctx.createOscillator();
      saw1.type = 'sawtooth';
      saw1.frequency.setValueAtTime(64, now);

      const saw2 = this.ctx.createOscillator();
      saw2.type = 'triangle'; // Warm harmonic rather than harsh buzzy saw
      saw2.frequency.setValueAtTime(96, now);

      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this._distortionCurve;
      shaper.oversample = '2x';

      const sawMix = this.ctx.createGain();
      sawMix.gain.value = 0.22;
      saw1.connect(sawMix);
      saw2.connect(sawMix);
      sawMix.connect(shaper);

      // Engine intake resonance filter - gentle warm Q without piercing peaks
      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(380, now);
      engineFilter.Q.value = 0.85;

      shaper.connect(engineFilter);
      subGain.connect(engineFilter);

      // ── Layer C: Subtle Turbocharger Spool Airflow (Subtle background detail, not a whistle) ──
      const turboOsc = this.ctx.createOscillator();
      turboOsc.type = 'sine';
      turboOsc.frequency.setValueAtTime(800, now);

      const turboFilter = this.ctx.createBiquadFilter();
      turboFilter.type = 'lowpass';
      turboFilter.frequency.setValueAtTime(1200, now);
      turboFilter.Q.value = 0.7;

      const turboGain = this.ctx.createGain();
      turboGain.gain.value = 0.0001; // Silent at idle

      turboOsc.connect(turboFilter);
      turboFilter.connect(turboGain);

      // ── Layer D: Wind + road noise (looped noise, gain follows speed) ──
      const windLen = this.ctx.sampleRate * 2;
      const windBuf = this.ctx.createBuffer(1, windLen, this.ctx.sampleRate);
      const windData = windBuf.getChannelData(0);
      for (let i = 0; i < windLen; i++) windData[i] = Math.random() * 2 - 1;
      const windSrc = this.ctx.createBufferSource();
      windSrc.buffer = windBuf;
      windSrc.loop = true;
      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(400, now);
      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.0001, now);
      windSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.worldGain);
      windSrc.start(now);

      // Connect all engine layers
      engineFilter.connect(engineGain);
      turboGain.connect(engineGain);
      engineGain.connect(this.worldGain);

      subOsc.start(now);
      saw1.start(now);
      saw2.start(now);
      turboOsc.start(now);

      this.engineNode = {
        gain: engineGain,
        filter: engineFilter,
        subOsc,
        saw1,
        saw2,
        turboOsc,
        turboGain,
        windSrc,
        windFilter,
        windGain,
        baseFreq: 32
      };
    } catch (e) {}
  }

  updateEngine(speedRatio = 0, isThrottle = false, isBoosting = false) {
    if (!this._engineRunning || !this.engineNode || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const absSpeed = Math.abs(speedRatio || 0);
      const speedKmh = absSpeed * 100;

      // Realistic 6-speed gearbox simulation
      const gearRatios = [18, 38, 62, 92, 130, 185];
      let targetGear = 1;
      for (let g = 0; g < gearRatios.length; g++) {
        if (speedKmh > gearRatios[g]) targetGear = g + 2;
      }
      targetGear = Math.min(6, targetGear);

      // Detect gear shift event
      if (targetGear !== this._currentGear && now - this._lastShiftTime > 0.4) {
        this._currentGear = targetGear;
        this._lastShiftTime = now;
        this._gearRpm = 0.35; // RPM drop on upshift
        // Trigger subtle shift pop
        this._playExhaustPop(0.25);
      }

      // Calculate RPM within current gear
      const prevGearThreshold = targetGear > 1 ? gearRatios[targetGear - 2] : 0;
      const nextGearThreshold = gearRatios[targetGear - 1] || 200;
      const gearProgress = Math.max(0, Math.min(1.0, (speedKmh - prevGearThreshold) / Math.max(10, nextGearThreshold - prevGearThreshold)));

      let targetRpm = 0.18 + gearProgress * 0.72;
      if (isThrottle) targetRpm = Math.min(1.0, targetRpm + (isBoosting ? 0.20 : 0.10));
      else targetRpm = Math.max(0.18, targetRpm * 0.85);

      // Smooth RPM interpolation
      this._gearRpm += (targetRpm - this._gearRpm) * 0.18;
      const rpm = this._gearRpm;

      // Frequencies for smooth combustion pulses (warm rumble), voiced per vehicle
      const preset = this._vehPreset || TrafficAudioEngine.ENGINE_PRESETS.default;
      const baseFreq = (30 + rpm * 75 + (isBoosting ? 18 : 0)) * preset.freqMul;
      this.engineNode.subOsc.frequency.setTargetAtTime(baseFreq, now, 0.03);
      this.engineNode.saw1.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.03);
      this.engineNode.saw2.frequency.setTargetAtTime(baseFreq * 3.0, now, 0.03);

      // Filter cutoff sweeps upward with RPM & throttle - capped comfortably at ~1800Hz
      const filterCutoff = (280 + rpm * 950 + (isThrottle ? 500 : 0) + (isBoosting ? 300 : 0)) * preset.filterMul;
      this.engineNode.filter.frequency.setTargetAtTime(filterCutoff, now, 0.04);

      // Subtle turbo spool airflow (soft and gentle background)
      const turboWhine = 600 + rpm * 1100 + (isBoosting ? 400 : 0);
      this.engineNode.turboOsc.frequency.setTargetAtTime(turboWhine, now, 0.05);
      const turboVol = isThrottle ? (0.004 + rpm * 0.012 + (isBoosting ? 0.010 : 0)) : 0.0001;
      this.engineNode.turboGain.gain.setTargetAtTime(turboVol, now, 0.06);

      // Engine master volume - balanced and comfortable
      const targetGain = (0.22 + (isThrottle ? 0.12 : 0.02) + rpm * 0.14 + (isBoosting ? 0.08 : 0)) * preset.gainMul;
      this.engineNode.gain.gain.setTargetAtTime(targetGain, now, 0.04);

      // Wind + rolling noise follows road speed (bicycles get almost none via gainMul)
      if (this.engineNode.windGain) {
        const windVol = Math.min(0.11, absSpeed * 0.004) * (0.4 + 0.6 * preset.gainMul);
        this.engineNode.windGain.gain.setTargetAtTime(windVol, now, 0.15);
        this.engineNode.windFilter.frequency.setTargetAtTime(350 + absSpeed * 28, now, 0.2);
      }

      // Detect throttle release from high RPM -> Turbo Blow-off valve ('pshh-t-t-t')
      if (this._prevThrottle && !isThrottle && rpm > 0.55) {
        this.playBlowoffValve(rpm);
        if (Math.random() < 0.40) this._playExhaustPop(0.30);
      }
      this._prevThrottle = isThrottle;

      // High RPM overrun pops
      if (!isThrottle && rpm > 0.60 && now - this._lastPopTime > 0.35) {
        if (Math.random() < 0.25) {
          this._playExhaustPop(0.22);
          this._lastPopTime = now;
        }
      }
    } catch (e) {}
  }

  // Turbo Blow-off Valve Pressure Release
  playBlowoffValve(intensity = 0.7) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const dur = 0.28;
      const bufferSize = this.ctx.sampleRate * dur;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Flutter effect
        const flutter = Math.sin((i / this.ctx.sampleRate) * 45) * 0.35 + 0.65;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09)) * flutter;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(3200, now);
      f.frequency.exponentialRampToValueAtTime(1400, now + dur);
      f.Q.value = 2.2;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.24 * intensity, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(f);
      f.connect(g);
      g.connect(this.worldGain);

      noise.start(now);
      noise.stop(now + dur);
    } catch (e) {}
  }

  // Exhaust backfire crackles & pops
  _playExhaustPop(volume = 0.4) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(160 + Math.random() * 80, now);
      popOsc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

      popGain.gain.setValueAtTime(volume * 0.6, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      popOsc.connect(popGain);
      popGain.connect(this.worldGain);
      popOsc.start(now);
      popOsc.stop(now + 0.06);

      // Noise crackle burst
      const bSize = this.ctx.sampleRate * 0.04;
      const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = buf;
      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'highpass';
      nFilter.frequency.value = 1800;
      const nG = this.ctx.createGain();
      nG.gain.setValueAtTime(volume * 0.4, now);
      nG.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      nSrc.connect(nFilter);
      nFilter.connect(nG);
      nG.connect(this.worldGain);
      nSrc.start(now);
      nSrc.stop(now + 0.05);
    } catch (e) {}
  }

  stopEngine() {
    if (!this._engineRunning || !this.engineNode || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.engineNode.gain.gain.setTargetAtTime(0.001, now, 0.15);
      const en = this.engineNode;
      setTimeout(() => {
        try {
          en.subOsc.stop();
          en.saw1.stop();
          en.saw2.stop();
          en.turboOsc.stop();
          if (en.windSrc) { try { en.windGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05); en.windSrc.stop(); } catch (e) {} }
          en.gain.disconnect();
        } catch (e) {}
      }, 300);
      this._engineRunning = false;
      this.engineNode = null;
    } catch (e) {}
  }

  // ── 2. DYNAMIC FOOTSTEPS ──
  playFootstep(surface = 'asphalt', speed = 1.0) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this._lastStepTime < 0.15 / speed) return;
    this._lastStepTime = now;

    try {
      this._stepAlt = !this._stepAlt;
      const pan = this._stepAlt ? 0.18 : -0.18;
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) panner.pan.value = pan;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const f = 120 + (Math.random() * 24 - 12);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.06);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      const bufferSize = this.ctx.sampleRate * 0.035;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.value = 1800;
      nFilter.Q.value = 2.4;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.14, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      noise.connect(nFilter);
      nFilter.connect(nGain);

      if (panner) {
        osc.connect(gain);
        gain.connect(panner);
        nGain.connect(panner);
        panner.connect(this.worldGain);
      } else {
        osc.connect(gain);
        gain.connect(this.worldGain);
        nGain.connect(this.worldGain);
      }

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.07);
      noise.stop(now + 0.04);
    } catch (e) {}
  }

  // ── 3. SOLID CAR DOOR SLAM & LATCH ──
  playDoorClose() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High-precision mechanical latch click
      const latch = this.ctx.createOscillator();
      const latchG = this.ctx.createGain();
      latch.type = 'sine';
      latch.frequency.setValueAtTime(1600, now);
      latch.frequency.exponentialRampToValueAtTime(280, now + 0.03);
      latchG.gain.setValueAtTime(0.40, now);
      latchG.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      latch.connect(latchG);
      latchG.connect(this.worldGain);
      latch.start(now);
      latch.stop(now + 0.035);

      // Deep acoustic cabin door thump
      const body = this.ctx.createOscillator();
      const bodyG = this.ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(110, now + 0.015);
      body.frequency.exponentialRampToValueAtTime(28, now + 0.24);
      bodyG.gain.setValueAtTime(0.85, now + 0.015);
      bodyG.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      body.connect(bodyG);
      bodyG.connect(this.worldGain);
      body.start(now + 0.015);
      body.stop(now + 0.26);
    } catch (e) {}
  }

  playDoorOpen() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const latch = this.ctx.createOscillator();
      const latchG = this.ctx.createGain();
      latch.type = 'triangle';
      latch.frequency.setValueAtTime(450, now);
      latch.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
      latchG.gain.setValueAtTime(0.35, now);
      latchG.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      latch.connect(latchG);
      latchG.connect(this.worldGain);
      latch.start(now);
      latch.stop(now + 0.09);
    } catch (e) {}
  }

  // ── 4. SEATBELT BUCKLE CLICK ──
  playSeatbelt() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(3200, now);
      osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.025);
      g1.gain.setValueAtTime(0.45, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc1.connect(g1);
      g1.connect(this.worldGain);
      osc1.start(now);
      osc1.stop(now + 0.03);

      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(4800, now + 0.025);
      osc2.frequency.exponentialRampToValueAtTime(600, now + 0.07);
      g2.gain.setValueAtTime(0.55, now + 0.025);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc2.connect(g2);
      g2.connect(this.worldGain);
      osc2.start(now + 0.025);
      osc2.stop(now + 0.08);
    } catch (e) {}
  }

  // ── 5. AUTHENTIC MUMBAI DUAL-TONE BRASS HORN ──
  playHorn(duration = 0.38, pitch = 1) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    // NPC horns arrive as a horn-voice name (e.g. 'taxi', 'truck') — map to pitch.
    // (Previously a string here poisoned the envelope math and horns went silent.)
    if (typeof duration === 'string') {
      pitch = TrafficAudioEngine.HORN_PITCH[duration] || 1;
      duration = 0.38;
    }
    if (typeof pitch !== 'number' || !(pitch > 0)) pitch = 1;
    try {
      const now = this.ctx.currentTime;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.28, now + 0.03);
      g.gain.setValueAtTime(0.28, now + duration - 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Warm acoustic Mumbai electric dual trumpets (A4 435Hz + C#5 548Hz), voiced by pitch
      const o1 = this.ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(435 * pitch, now);

      const o2 = this.ctx.createOscillator();
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(548 * pitch, now);

      // Lowpass filter to eliminate harsh buzzy bite (opens up for shrill bike horns)
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1100 * Math.min(1.6, pitch);
      f.Q.value = 0.8;

      o1.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.voiceGain);

      o1.start(now);
      o2.start(now);
      o1.stop(now + duration + 0.02);
      o2.stop(now + duration + 0.02);
    } catch (e) {}
  }

  playHonk(duration = 0.38) {
    return this.playHorn(duration);
  }

  // ── F1 Juice: near-miss air whoosh (short filtered noise sweep) ──
  playWhoosh() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - (this._lastWhooshTime || 0) < 0.5) return;
    this._lastWhooshTime = now;
    try {
      const dur = 0.28;
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.7;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(500, now);
      f.frequency.exponentialRampToValueAtTime(3800, now + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.worldGain);
      src.start(now);
    } catch (e) {}
  }

  // ── 6. DYNAMIC TIRE SCREECH & ASPHALT DRIFT ──
  playScreech(intensity = 0.5) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Throttle to prevent screech cacophony during high-frequency frame loops
    if (now - (this._lastScreechTime || 0) < 0.35) return;
    this._lastScreechTime = now;

    try {
      const duration = 0.22 + intensity * 0.20;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.65;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Gentle bandpass filter without piercing resonant peaks
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(900, now);
      f.frequency.linearRampToValueAtTime(1400, now + duration);
      f.Q.value = 1.2;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.08 * intensity, now);
      g.gain.linearRampToValueAtTime(0.001, now + duration);

      noise.connect(f);
      f.connect(g);
      g.connect(this.worldGain);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {}
  }

  // ── 7. TWO-TONE POLICE SIREN ──
  playSiren() {
    this._ensureUnlocked();
    if (!this.ctx || this._sirenPlaying) return;
    this._sirenPlaying = true;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      g.gain.setValueAtTime(0.35, now);
      g.gain.linearRampToValueAtTime(0.001, now + 1.2);

      osc.frequency.setValueAtTime(680, now);
      osc.frequency.linearRampToValueAtTime(1320, now + 0.6);
      osc.frequency.linearRampToValueAtTime(680, now + 1.2);

      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 3000;

      osc.connect(f);
      f.connect(g);
      g.connect(this.voiceGain);

      osc.start(now);
      osc.stop(now + 1.25);
      setTimeout(() => { this._sirenPlaying = false; }, 1300);
    } catch (e) {
      this._sirenPlaying = false;
    }
  }

  // ── 8. SPARKLING CHECKPOINT PASS CHIME ──
  playCheckpoint() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.055);
        g.gain.setValueAtTime(0.28, now + i * 0.055);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.32);
        osc.connect(g);
        g.connect(this.voiceGain);
        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.35);
      });
    } catch (e) {}
  }

  // ── 9. IMPACT CRASH & DEFORMATION ──
  playCrash(intensity = 1.0) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Sub-bass heavy thump
      const sub = this.ctx.createOscillator();
      const subG = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(105, now);
      sub.frequency.exponentialRampToValueAtTime(22, now + 0.38);
      subG.gain.setValueAtTime(0.90 * intensity, now);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      sub.connect(subG);
      subG.connect(this.worldGain);
      sub.start(now);
      sub.stop(now + 0.42);

      // Metal crumple noise burst
      const bufferSize = this.ctx.sampleRate * 0.42;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.11));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3600, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.42);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.80 * intensity, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.worldGain);

      noise.start(now);
      noise.stop(now + 0.42);
    } catch (e) {}
  }

  // ── 10. TACTILE UI CLICK ──
  playClick() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.02);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(g);
      g.connect(this.uiGain);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch (e) {}
  }

  // ── 11. VICTORY FANFARE ──
  playVictory() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [
        { f: 523.25, d: 0.14, t: 0.0 },
        { f: 659.25, d: 0.14, t: 0.13 },
        { f: 783.99, d: 0.14, t: 0.26 },
        { f: 1046.5, d: 0.65, t: 0.39 }
      ];
      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        g.gain.setValueAtTime(0.38, now + n.t);
        g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        osc.connect(g);
        g.connect(this.voiceGain);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d + 0.05);
      });
    } catch (e) {}
  }
}

// Global Singleton Instance
window.TrafficAudio = new TrafficAudioEngine();

// Auto-unlock on first user gesture
['pointerdown', 'keydown', 'touchstart', 'click'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (window.TrafficAudio) window.TrafficAudio._ensureUnlocked();
  }, { once: true, passive: true });
});

