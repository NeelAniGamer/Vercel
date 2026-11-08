/**
 * Cozy Mumbai Traffic & Dabbawala Web Audio Synthesizer
 * 100% procedurally generated audio, zero external file dependencies.
 */
export class MessengerAudio {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;

  constructor() {
    // AudioContext is initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Footstep sound with varying material timbre
   */
  public playFootstep(surface: 'tarmac' | 'sand' | 'stone' = 'tarmac') {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const t = this.ctx.currentTime;
    const freq = surface === 'stone' ? 190 : surface === 'sand' ? 85 : 130;

    osc.type = surface === 'stone' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.07);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(surface === 'stone' ? 800 : 400, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Dabbawala Bicycle Bell: Crisp "Trin-Trin!"
   */
  public playBicycleBell() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const ring = (delay: number, pitch: number) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + delay;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, t);
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(pitch * 2.76, t);
      gain2.gain.setValueAtTime(0.12, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.4);
      osc2.start(t);
      osc2.stop(t + 0.25);
    };

    ring(0.0, 2093); // High C7
    ring(0.1, 2637); // High E7
  }

  /**
   * Mumbai Kaali-Peeli Auto-Rickshaw Horn: Classic "Peep-Peep!"
   */
  public playAutoHorn() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const honk = (delay: number) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + delay;

      // Dual harmonic electric horn
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(420, t); // F#4
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(530, t); // C5

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, t);
      filter.Q.setValueAtTime(3.0, t);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.18);
      osc2.stop(t + 0.18);
    };

    honk(0.0);
    honk(0.16);
  }

  /**
   * Jump whoosh
   */
  public playJump() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Dabba / Parcel Pickup Chime
   */
  public playPickup() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (Bright Indian Yaman arpeggio)
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.34);
    });
  }

  /**
   * Delivery Success / 6-Sigma Dabba Delivered Fanfare
   */
  public playDeliverySuccess() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    // Celebratory Indian Raag Yaman fanfare: Sa Ga Pa Ni Sa'
    const melody = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
    const t = this.ctx.currentTime;

    melody.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.085;
      const dur = idx === melody.length - 1 ? 0.9 : 0.28;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.32, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + dur + 0.05);
    });
  }

  /**
   * Cheerful Emote / Reaction Pop
   */
  public playEmotePop() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Start Cozy Mumbai Lo-fi Acoustic Chords
   * Harmonic sitar-kalimba arpeggiation in Yaman / Pentatonic
   */
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.resume();
    this.isMusicPlaying = true;

    // Cozy D major / B minor Indian pentatonic progression:
    // Dmaj7 -> Bm7 -> Gmaj7 -> A7sus4
    const chords = [
      [293.66, 369.99, 440.00, 554.37], // D F# A C#
      [246.94, 293.66, 369.99, 440.00], // B D F# A
      [196.00, 246.94, 293.66, 369.99], // G B D F#
      [220.00, 293.66, 329.63, 440.00]  // A D E A
    ];

    let chordIndex = 0;
    let step = 0;

    const tick = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
      if (this.ctx.state === 'running' && !this.isMuted) {
        const chord = chords[chordIndex];
        const t = this.ctx.currentTime;

        const noteFreq = chord[step % chord.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, t);

        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 1.2);

        step++;
        if (step >= 4) {
          step = 0;
          chordIndex = (chordIndex + 1) % chords.length;
        }
      }

      this.musicTimer = window.setTimeout(tick, 580);
    };

    tick();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundManager = new MessengerAudio();
