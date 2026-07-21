// ────────────────────────────────────────────────────────
//  AudioSystem.ts — typed Web Audio oscillator sfx
//  Replaces the `sfx` object from ui.js lines 14-50
// ────────────────────────────────────────────────────────

/** Sound effect identifiers */
export type SoundId = 'horn' | 'brake' | 'challan' | 'ok' | 'error' | 'thunder';

/** Audio categories for volume control */
export type AudioCategory = 'sfx' | 'ui' | 'env';

/** Oscillator parameters for a single sound */
interface SoundParams {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
}

/** Sound definition table */
const SOUND_MAP: Record<SoundId, SoundParams> = {
  horn:    { frequency: 440, type: 'square',   duration: 0.18, volume: 0.12 },
  brake:   { frequency: 160, type: 'sawtooth', duration: 0.15, volume: 0.08 },
  challan: { frequency: 880, type: 'triangle', duration: 0.32, volume: 0.11 },
  ok:      { frequency: 660, type: 'sine',     duration: 0.22, volume: 0.09 },
  error:   { frequency: 110, type: 'square',   duration: 0.28, volume: 0.10 },
  thunder: { frequency: 55,  type: 'sawtooth', duration: 0.60, volume: 0.15 },
};

/** Category mapping (which category each sound belongs to) */
const CATEGORY_MAP: Record<SoundId, AudioCategory> = {
  horn: 'sfx',
  brake: 'sfx',
  challan: 'ui',
  ok: 'ui',
  error: 'ui',
  thunder: 'env',
};

class AudioSystem {
  private ctx: AudioContext | null = null;
  private volumes: Record<AudioCategory, number> = { sfx: 1, ui: 1, env: 1 };
  private initialized = false;

  /** Lazily create AudioContext (must happen after user gesture) */
  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch {
      // Web Audio not supported → silent fallback
    }
  }

  /** Set volume multiplier for a category (0–1) */
  setVolume(category: AudioCategory, value: number): void {
    this.volumes[category] = Math.max(0, Math.min(1, value));
  }

  /** Get current volume for a category */
  getVolume(category: AudioCategory): number {
    return this.volumes[category];
  }

  /** Play a sound effect by ID */
  play(soundId: SoundId): void {
    if (!this.ctx) return;

    const params = SOUND_MAP[soundId] ?? SOUND_MAP.horn;
    const category = CATEGORY_MAP[soundId] ?? 'sfx';
    const catVol = this.volumes[category] ?? 1;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = params.type;
      osc.frequency.setValueAtTime(params.frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(params.volume * catVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + params.duration,
      );

      osc.start();
      osc.stop(this.ctx.currentTime + params.duration);
    } catch {
      // Oscillator creation failed → silent
    }
  }
}

// Singleton export
export const audio = new AudioSystem();
