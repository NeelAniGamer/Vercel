// scripts/mix-audio.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '../output');

// FFmpeg complex filter mixing voice, bgm, and sfx with exact adelay timestamps in milliseconds
const v1Delay = 500;
const v2Delay = 11000;
const v3Delay = 19000;
const v4Delay = 27500;
const v5Delay = 36800;
const v6Delay = 47200;
const laserDelay = 29000;
const chimeDelay = 32500;

const cmd = [
  'ffmpeg -y',
  `-i "${path.join(outDir, 'bgm_cyber_ambient.wav')}"`,      // [0]
  `-i "${path.join(outDir, 'voice_scene1.wav')}"`,          // [1]
  `-i "${path.join(outDir, 'voice_scene2.wav')}"`,          // [2]
  `-i "${path.join(outDir, 'voice_scene3.wav')}"`,          // [3]
  `-i "${path.join(outDir, 'voice_scene4.wav')}"`,          // [4]
  `-i "${path.join(outDir, 'voice_scene5.wav')}"`,          // [5]
  `-i "${path.join(outDir, 'voice_scene6.wav')}"`,          // [6]
  `-i "${path.join(outDir, 'sfx_scan_laser.wav')}"`,        // [7]
  `-i "${path.join(outDir, 'sfx_decode_success.wav')}"`,    // [8]
  '-filter_complex "',
  `[0]volume=0.35[bgm];`,
  `[1]adelay=${v1Delay}|${v1Delay},volume=1.4[v1];`,
  `[2]adelay=${v2Delay}|${v2Delay},volume=1.4[v2];`,
  `[3]adelay=${v3Delay}|${v3Delay},volume=1.4[v3];`,
  `[4]adelay=${v4Delay}|${v4Delay},volume=1.4[v4];`,
  `[5]adelay=${v5Delay}|${v5Delay},volume=1.4[v5];`,
  `[6]adelay=${v6Delay}|${v6Delay},volume=1.4[v6];`,
  `[7]adelay=${laserDelay}|${laserDelay},volume=0.6[sfx1];`,
  `[8]adelay=${chimeDelay}|${chimeDelay},volume=0.85[sfx2];`,
  '[bgm][v1][v2][v3][v4][v5][v6][sfx1][sfx2]amix=inputs=9:duration=longest:dropout_transition=2[aout]',
  '"',
  `-map "[aout]" -c:a pcm_s16le "${path.join(outDir, 'master_soundtrack.wav')}"`
].join(' ');

console.log('Mixing audio with FFmpeg...');
execSync(cmd, { stdio: 'inherit' });
console.log('Master soundtrack created successfully!');
