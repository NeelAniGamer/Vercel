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

    // Distortion curve for throaty supercar growl
    this._distortionCurve = this._makeDistortionCurve(18);
  }

  get isEngineRunning() {
    return this._engineRunning;
  }

  isEngineRunningFn() {
    return this._engineRunning;
  }

  _makeDistortionCurve(amount = 20) {
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
      this.masterGain.gain.value = 0.90;

      // Master compressor for clean, punchy audio without clipping
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-14, this.ctx.currentTime);
      comp.knee.setValueAtTime(8, this.ctx.currentTime);
      comp.ratio.setValueAtTime(6, this.ctx.currentTime);
      comp.attack.setValueAtTime(0.003, this.ctx.currentTime);
      comp.release.setValueAtTime(0.12, this.ctx.currentTime);

      this.masterGain.connect(comp);
      comp.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  _ensureUnlocked() {
    this._initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ── 1. SUPERCAR V8 / V10 ACOUSTIC ENGINE SYNTHESIZER ──
  startEngine(initialRpm = 0.20) {
    this._ensureUnlocked();
    if (!this.ctx || this._engineRunning) return;

    try {
      const now = this.ctx.currentTime;
      this._engineRunning = true;
      this._currentGear = 1;
      this._gearRpm = initialRpm;
      this._lastShiftTime = now;

      // Master engine volume gain
      const engineGain = this.ctx.createGain();
      engineGain.gain.setValueAtTime(0.001, now);
      engineGain.gain.exponentialRampToValueAtTime(0.48, now + 0.35);

      // ── Layer A: Sub-bass engine pulse (30Hz - 65Hz) ──
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(36, now);
      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.45;
      subOsc.connect(subGain);

      // ── Layer B: Dual throaty cylinder combustion (Sawtooth + WaveShaper) ──
      const saw1 = this.ctx.createOscillator();
      saw1.type = 'sawtooth';
      saw1.frequency.setValueAtTime(72, now);

      const saw2 = this.ctx.createOscillator();
      saw2.type = 'sawtooth';
      saw2.frequency.setValueAtTime(108, now); // 3rd harmonic growl

      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this._distortionCurve;
      shaper.oversample = '2x';

      const sawMix = this.ctx.createGain();
      sawMix.gain.value = 0.32;
      saw1.connect(sawMix);
      saw2.connect(sawMix);
      sawMix.connect(shaper);

      // Engine intake resonance filter
      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(450, now);
      engineFilter.Q.value = 2.8;

      shaper.connect(engineFilter);
      subGain.connect(engineFilter);

      // ── Layer C: Turbocharger Spool Whine ──
      const turboOsc = this.ctx.createOscillator();
      turboOsc.type = 'sine';
      turboOsc.frequency.setValueAtTime(1200, now);

      const turboFilter = this.ctx.createBiquadFilter();
      turboFilter.type = 'bandpass';
      turboFilter.frequency.setValueAtTime(1800, now);
      turboFilter.Q.value = 3.5;

      const turboGain = this.ctx.createGain();
      turboGain.gain.value = 0.001; // Silent at idle

      turboOsc.connect(turboFilter);
      turboFilter.connect(turboGain);

      // Connect all engine layers
      engineFilter.connect(engineGain);
      turboGain.connect(engineGain);
      engineGain.connect(this.masterGain);

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
        baseFreq: 36
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
        this._playExhaustPop(0.35);
      }

      // Calculate RPM within current gear
      const prevGearThreshold = targetGear > 1 ? gearRatios[targetGear - 2] : 0;
      const nextGearThreshold = gearRatios[targetGear - 1] || 200;
      const gearProgress = Math.max(0, Math.min(1.0, (speedKmh - prevGearThreshold) / Math.max(10, nextGearThreshold - prevGearThreshold)));

      let targetRpm = 0.18 + gearProgress * 0.72;
      if (isThrottle) targetRpm = Math.min(1.0, targetRpm + (isBoosting ? 0.25 : 0.12));
      else targetRpm = Math.max(0.18, targetRpm * 0.85);

      // Smooth RPM interpolation
      this._gearRpm += (targetRpm - this._gearRpm) * 0.18;
      const rpm = this._gearRpm;

      // Frequencies for V8 combustion pulses
      const baseFreq = 34 + rpm * 110 + (isBoosting ? 22 : 0);
      this.engineNode.subOsc.frequency.setTargetAtTime(baseFreq, now, 0.03);
      this.engineNode.saw1.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.03);
      this.engineNode.saw2.frequency.setTargetAtTime(baseFreq * 3.0, now, 0.03);

      // Filter cutoff sweeps upward with RPM & throttle for throaty rasp
      const filterCutoff = 350 + rpm * 2600 + (isThrottle ? 1400 : 0) + (isBoosting ? 800 : 0);
      this.engineNode.filter.frequency.setTargetAtTime(filterCutoff, now, 0.04);

      // Turbo spool whistle
      const turboWhine = 1400 + rpm * 2800 + (isBoosting ? 1200 : 0);
      this.engineNode.turboOsc.frequency.setTargetAtTime(turboWhine, now, 0.05);
      const turboVol = isThrottle ? (0.04 + rpm * 0.14 + (isBoosting ? 0.10 : 0)) : 0.001;
      this.engineNode.turboGain.gain.setTargetAtTime(turboVol, now, 0.06);

      // Engine master volume
      const targetGain = 0.32 + (isThrottle ? 0.25 : 0.05) + rpm * 0.22 + (isBoosting ? 0.15 : 0);
      this.engineNode.gain.gain.setTargetAtTime(targetGain, now, 0.04);

      // Detect throttle release from high RPM -> Turbo Blow-off valve ('pshh-t-t-t')
      if (this._prevThrottle && !isThrottle && rpm > 0.55) {
        this.playBlowoffValve(rpm);
        if (Math.random() < 0.65) this._playExhaustPop(0.45);
      }
      this._prevThrottle = isThrottle;

      // High RPM overrun pops
      if (!isThrottle && rpm > 0.60 && now - this._lastPopTime > 0.30) {
        if (Math.random() < 0.35) {
          this._playExhaustPop(0.30);
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
      g.connect(this.masterGain);

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
      popGain.connect(this.masterGain);
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
      nG.connect(this.masterGain);
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
        panner.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
        nGain.connect(this.masterGain);
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
      latchG.connect(this.masterGain);
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
      bodyG.connect(this.masterGain);
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
      latchG.connect(this.masterGain);
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
      g1.connect(this.masterGain);
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
      g2.connect(this.masterGain);
      osc2.start(now + 0.025);
      osc2.stop(now + 0.08);
    } catch (e) {}
  }

  // ── 5. AUTHENTIC MUMBAI DUAL-TONE BRASS HORN ──
  playHorn(duration = 0.42) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.48, now + 0.02);
      g.gain.setValueAtTime(0.48, now + duration - 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Classic Mumbai electric dual trumpets (A4 + C#5)
      const o1 = this.ctx.createOscillator();
      o1.type = 'sawtooth';
      o1.frequency.setValueAtTime(435, now);

      const o2 = this.ctx.createOscillator();
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(548, now);

      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1600;
      f.Q.value = 1.4;

      o1.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.masterGain);

      o1.start(now);
      o2.start(now);
      o1.stop(now + duration + 0.02);
      o2.stop(now + duration + 0.02);
    } catch (e) {}
  }

  // ── 6. DYNAMIC TIRE SCREECH & ASPHALT DRIFT ──
  playScreech(intensity = 0.5) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.28 + intensity * 0.32;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.85;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(1500, now);
      f.frequency.linearRampToValueAtTime(2100, now + duration);
      f.Q.value = 4.8;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.20 * intensity, now);
      g.gain.linearRampToValueAtTime(0.001, now + duration);

      noise.connect(f);
      f.connect(g);
      g.connect(this.masterGain);

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
      g.connect(this.masterGain);

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
        g.connect(this.masterGain);
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
      subG.connect(this.masterGain);
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
      nGain.connect(this.masterGain);

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
      g.connect(this.masterGain);
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
        g.connect(this.masterGain);
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

