/**
 * Traffic Driving Simulator - Procedural Web Audio Engine
 * High-fidelity, low-latency synthesized sound effects for engines, tire screeches,
 * footsteps, car doors, seatbelts, sirens, horns, and crashes.
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
  }

  _initContext() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);
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

  // ── 1. REALISTIC ADDITIVE ENGINE SYNTHESIZER ──
  startEngine(initialRpm = 0.15) {
    this._ensureUnlocked();
    if (!this.ctx || this._engineRunning) return;

    try {
      const now = this.ctx.currentTime;
      this._engineRunning = true;

      const engineGain = this.ctx.createGain();
      engineGain.gain.setValueAtTime(0.001, now);
      engineGain.gain.exponentialRampToValueAtTime(0.4, now + 0.35);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.value = 2.5;

      const osc1 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(38, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(76, now);
      const g2 = this.ctx.createGain();
      g2.gain.value = 0.35;
      osc2.connect(g2);
      g2.connect(filter);

      const osc3 = this.ctx.createOscillator();
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(19, now);
      const g3 = this.ctx.createGain();
      g3.gain.value = 0.18;
      osc3.connect(g3);
      g3.connect(filter);

      osc1.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      this.engineNode = {
        gain: engineGain,
        filter: filter,
        osc1: osc1,
        osc2: osc2,
        osc3: osc3,
        baseFreq: 38
      };
    } catch (e) {}
  }

  updateEngine(rpmRatio = 0.1, throttle = 0, speedRatio = 0) {
    if (!this._engineRunning || !this.engineNode || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const clampedRpm = Math.max(0.1, Math.min(1.0, rpmRatio));
      const clampedThrottle = Math.max(0, Math.min(1.0, throttle));

      const targetFreq = 38 + clampedRpm * 140 + clampedThrottle * 30;
      this.engineNode.osc1.frequency.setTargetAtTime(targetFreq, now, 0.04);
      this.engineNode.osc2.frequency.setTargetAtTime(targetFreq * 2.0, now, 0.04);
      this.engineNode.osc3.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.04);

      const targetFilter = 280 + clampedRpm * 1600 + clampedThrottle * 1200;
      this.engineNode.filter.frequency.setTargetAtTime(targetFilter, now, 0.05);

      const targetGain = 0.25 + clampedThrottle * 0.28 + clampedRpm * 0.18;
      this.engineNode.gain.gain.setTargetAtTime(targetGain, now, 0.05);
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
          en.osc1.stop();
          en.osc2.stop();
          en.osc3.stop();
          en.gain.disconnect();
        } catch (e) {}
      }, 300);
      this._engineRunning = false;
      this.engineNode = null;
    } catch (e) {}
  }

  isEngineRunning() {
    return this._engineRunning;
  }

  // ── 2. DYNAMIC FOOTSTEPS ──
  playFootstep(surface = 'asphalt', speed = 1.0) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this._lastStepTime < 0.16 / speed) return;
    this._lastStepTime = now;

    try {
      this._stepAlt = !this._stepAlt;
      const pan = this._stepAlt ? 0.15 : -0.15;
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) panner.pan.value = pan;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const f = 110 + (Math.random() * 20 - 10);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      const bufferSize = this.ctx.sampleRate * 0.04;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.value = 1600;
      nFilter.Q.value = 2.0;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.12, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

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
      osc.stop(now + 0.08);
      noise.stop(now + 0.05);
    } catch (e) {}
  }

  // ── 3. CAR DOOR SLAM & LATCH ──
  playDoorClose() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Latch click
      const latch = this.ctx.createOscillator();
      const latchG = this.ctx.createGain();
      latch.type = 'sine';
      latch.frequency.setValueAtTime(1400, now);
      latch.frequency.exponentialRampToValueAtTime(200, now + 0.035);
      latchG.gain.setValueAtTime(0.35, now);
      latchG.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      latch.connect(latchG);
      latchG.connect(this.masterGain);
      latch.start(now);
      latch.stop(now + 0.04);

      // Deep bass body slam
      const body = this.ctx.createOscillator();
      const bodyG = this.ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(95, now + 0.02);
      body.frequency.exponentialRampToValueAtTime(32, now + 0.22);
      bodyG.gain.setValueAtTime(0.65, now + 0.02);
      bodyG.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      body.connect(bodyG);
      bodyG.connect(this.masterGain);
      body.start(now + 0.02);
      body.stop(now + 0.25);
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
      latch.frequency.setValueAtTime(480, now);
      latch.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
      latchG.gain.setValueAtTime(0.3, now);
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
      // Spring click 1
      const osc1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2800, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.025);
      g1.gain.setValueAtTime(0.4, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc1.connect(g1);
      g1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 0.03);

      // Lock latch click 2
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(4200, now + 0.03);
      osc2.frequency.exponentialRampToValueAtTime(800, now + 0.07);
      g2.gain.setValueAtTime(0.5, now + 0.03);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc2.connect(g2);
      g2.connect(this.masterGain);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.08);
    } catch (e) {}
  }

  // ── 5. MUMBAI DUAL-TONE HORN ──
  playHorn() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.4, now);
      g.gain.setTargetAtTime(0.001, now + 0.35, 0.05);

      const o1 = this.ctx.createOscillator();
      o1.type = 'sawtooth';
      o1.frequency.setValueAtTime(440, now); // A4

      const o2 = this.ctx.createOscillator();
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(554.37, now); // C#5 (Mumbai brass interval)

      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2400;

      o1.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.masterGain);

      o1.start(now);
      o2.start(now);
      o1.stop(now + 0.45);
      o2.stop(now + 0.45);
    } catch (e) {}
  }

  // ── 6. DYNAMIC TIRE SCREECH ──
  playScreech(intensity = 0.5) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.3 + intensity * 0.3;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.8;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(1400, now);
      f.frequency.linearRampToValueAtTime(1800, now + duration);
      f.Q.value = 4.0;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.15 * intensity, now);
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
      g.gain.setValueAtTime(0.3, now);
      g.gain.linearRampToValueAtTime(0.001, now + 1.2);

      // Pitch sweep
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(1250, now + 0.6);
      osc.frequency.linearRampToValueAtTime(650, now + 1.2);

      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2800;

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

  // ── 8. CHECKPOINT CHIME ──
  playCheckpoint() {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        g.gain.setValueAtTime(0.25, now + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.35);
      });
    } catch (e) {}
  }

  // ── 9. HEAVY CRASH IMPACT & METAL DEFORMATION ──
  playCrash(intensity = 1.0) {
    this._ensureUnlocked();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const sub = this.ctx.createOscillator();
      const subG = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(95, now);
      sub.frequency.exponentialRampToValueAtTime(20, now + 0.4);
      subG.gain.setValueAtTime(0.8 * intensity, now);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      sub.connect(subG);
      subG.connect(this.masterGain);
      sub.start(now);
      sub.stop(now + 0.45);

      const bufferSize = this.ctx.sampleRate * 0.45;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.45);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.7 * intensity, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.45);
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
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);
      g.gain.setValueAtTime(0.2, now);
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
        { f: 523.25, d: 0.15, t: 0.0 }, // C5
        { f: 659.25, d: 0.15, t: 0.14 }, // E5
        { f: 783.99, d: 0.15, t: 0.28 }, // G5
        { f: 1046.5, d: 0.65, t: 0.42 } // C6
      ];
      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        g.gain.setValueAtTime(0.35, now + n.t);
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
['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (window.TrafficAudio) window.TrafficAudio._ensureUnlocked();
  }, { once: true, passive: true });
});
