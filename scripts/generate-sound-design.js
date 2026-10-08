// scripts/generate-sound-design.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sampleRate = 44100;

function createWavHeader(numSamples, numChannels = 1, sampleRate = 44100, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function writeWav(filename, samples) {
  const header = createWavHeader(samples.length);
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.floor(s * 32767), i * 2);
  }
  const full = Buffer.concat([header, data]);
  fs.writeFileSync(filename, full);
  console.log(`Saved ${filename} (${full.length} bytes)`);
}

// 1. Click SFX (clean modern UI click pop)
function generateClickSfx() {
  const duration = 0.08;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 60);
    const freq = 1200 - t * 4000;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.45;
  }
  writeWav(path.join(__dirname, '../output/sfx_click.wav'), samples);
}

// 2. Typing tick SFX (soft mechanical key tap)
function generateTypeSfx() {
  const duration = 0.05;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 90);
    const noise = (Math.random() * 2 - 1) * 0.4;
    const tone = Math.sin(2 * Math.PI * 800 * t) * 0.6;
    samples[i] = (noise + tone) * env * 0.35;
  }
  writeWav(path.join(__dirname, '../output/sfx_type.wav'), samples);
}

// 3. Scanner laser sweep SFX (cyber hum sweep)
function generateScannerLaserSfx() {
  const duration = 3.2;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.sin((t / duration) * Math.PI);
    const lfo = Math.sin(2 * Math.PI * 3.5 * t);
    const freq = 480 + lfo * 140;
    const tone = Math.sin(2 * Math.PI * freq * t);
    const sub = Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.5;
    const shimmer = (Math.random() * 2 - 1) * 0.05;
    samples[i] = (tone + sub + shimmer) * env * 0.28;
  }
  writeWav(path.join(__dirname, '../output/sfx_scan_laser.wav'), samples);
}

// 4. Scanner success chime (crystal clear two-tone major chime)
function generateDecodeSuccessSfx() {
  const duration = 1.6;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = 0;
    // Note 1: E6 (1318.5 Hz) at t = 0
    if (t < 1.2) {
      const env1 = Math.exp(-t * 4);
      s += Math.sin(2 * Math.PI * 1318.5 * t) * env1 * 0.4;
      s += Math.sin(2 * Math.PI * 2637 * t) * env1 * 0.15;
    }
    // Note 2: B6 (1975.5 Hz) at t = 0.12
    if (t >= 0.12) {
      const t2 = t - 0.12;
      const env2 = Math.exp(-t2 * 3.5);
      s += Math.sin(2 * Math.PI * 1975.5 * t2) * env2 * 0.45;
      s += Math.sin(2 * Math.PI * 3951 * t2) * env2 * 0.18;
    }
    samples[i] = s * 0.5;
  }
  writeWav(path.join(__dirname, '../output/sfx_decode_success.wav'), samples);
}

// 5. Atmospheric Cyber Ambient BGM (55 seconds)
function generateAmbientBgm() {
  const duration = 55.0;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  // Chords: Dm9 -> Bbmaj7 -> Gm9 -> A7sus4
  const chords = [
    [146.83, 220.00, 261.63, 329.63, 440.00], // D3, A3, C4, E4, A4
    [116.54, 174.61, 233.08, 293.66, 349.23], // Bb2, F3, Bb3, D4, F4
    [98.00,  146.83, 196.00, 261.63, 329.63], // G2, D3, G3, C4, E4
    [110.00, 164.81, 220.00, 293.66, 440.00]  // A2, E3, A3, D4, A4
  ];

  const chordDuration = duration / chords.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordDuration));
    const chord = chords[chordIndex];
    const ct = t % chordDuration;
    const chordEnv = Math.sin((ct / chordDuration) * Math.PI);

    let val = 0;
    // Ambient pad layers
    for (let f = 0; f < chord.length; f++) {
      const freq = chord[f];
      const detune = Math.sin(2 * Math.PI * 0.2 * t + f) * 0.8;
      val += Math.sin(2 * Math.PI * (freq + detune) * t) * 0.18;
      val += Math.sin(2 * Math.PI * (freq * 2.01) * t) * 0.06;
    }

    // Gentle rhythmic pulse
    const pulse = Math.pow(Math.sin(2 * Math.PI * 1.5 * t), 4) * 0.12;
    val += Math.sin(2 * Math.PI * 146.83 * t) * pulse;

    // Fade in and out
    let masterEnv = 1;
    if (t < 3.0) masterEnv = t / 3.0;
    if (t > duration - 3.0) masterEnv = (duration - t) / 3.0;

    samples[i] = val * chordEnv * masterEnv * 0.18; // Soft background level
  }

  writeWav(path.join(__dirname, '../output/bgm_cyber_ambient.wav'), samples);
}

generateClickSfx();
generateTypeSfx();
generateScannerLaserSfx();
generateDecodeSuccessSfx();
generateAmbientBgm();

console.log('All SFX and BGM generated successfully!');
