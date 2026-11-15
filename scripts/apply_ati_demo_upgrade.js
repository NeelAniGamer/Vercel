const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ati-demo.html');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Ensure Meta Description
content = content.replace(
  'Python and JavaScript code, and timed runs. Live speed scores, keyboard hints',
  'Python and JavaScript code, free-type sandbox tests, and timed runs. Live speed scores, key heatmap, switch sounds'
);

// 2. Add New Styles if not already present
if (!content.includes('/* Live Heatmap Styling */')) {
  const styleInsert = '      /* Breadcrumbs */';
  const newStyles = `      /* Live Heatmap Styling */
      .heatmap-on .key.heat-good {
        background: rgba(56, 189, 248, 0.22) !important;
        border-color: rgba(56, 189, 248, 0.6) !important;
        color: #38bdf8 !important;
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.25) !important;
      }
      .heatmap-on .key.heat-warn {
        background: rgba(242, 184, 75, 0.22) !important;
        border-color: rgba(242, 184, 75, 0.6) !important;
        color: #f2b84b !important;
        box-shadow: 0 0 10px rgba(242, 184, 75, 0.25) !important;
      }
      .heatmap-on .key.heat-bad {
        background: rgba(244, 63, 94, 0.28) !important;
        border-color: rgba(244, 63, 94, 0.75) !important;
        color: #f43f5e !important;
        box-shadow: 0 0 12px rgba(244, 63, 94, 0.35) !important;
      }

      /* Challenge Modifiers */
      .sub-opt-btn.mod-active {
        background: var(--signal) !important;
        color: #070a14 !important;
        border-color: var(--signal) !important;
        font-weight: 700 !important;
      }
      .sub-opt-btn.mod-warn.mod-active {
        background: var(--rose) !important;
        color: #ffffff !important;
        border-color: var(--rose) !important;
      }
      .sub-opt-btn.mod-teal.mod-active {
        background: var(--ion) !important;
        color: #070a14 !important;
        border-color: var(--ion) !important;
      }

      /* Blind Mode Visual Silence */
      .blind-active .char.correct,
      .blind-active .char.wrong {
        color: var(--dim) !important;
        background: transparent !important;
        text-shadow: none !important;
      }

      /* Free-Type Sandbox */
      .sandbox-stage {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--r);
        padding: 20px;
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: var(--ati-shadow);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .sandbox-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .sandbox-pad {
        width: 100%;
        min-height: 200px;
        background: var(--void2);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 16px;
        color: var(--ink);
        font-family: var(--mono);
        font-size: 1.05rem;
        line-height: 1.7;
        resize: vertical;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s ease;
      }
      .sandbox-pad:focus {
        border-color: var(--ion);
      }
      .sandbox-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 12px;
      }
      .sandbox-metric-item {
        background: var(--void2);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .sandbox-metric-val {
        font-family: var(--mono);
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--signal);
      }
      .sandbox-metric-lbl {
        font-size: 0.72rem;
        color: var(--dim);
        text-transform: uppercase;
        margin-top: 2px;
      }

      /* Local Rank Badge */
      .rank-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        background: rgba(242, 184, 75, 0.12);
        border: 1px solid rgba(242, 184, 75, 0.35);
        color: var(--signal);
        font-family: var(--mono);
        font-size: 0.75rem;
        font-weight: 700;
      }
      .rank-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--signal);
        box-shadow: 0 0 6px var(--signal);
      }

      /* Keystroke Replay & Bigrams */
      .replay-box {
        margin-top: 16px;
        padding: 14px;
        background: var(--void2);
        border: 1px solid var(--line);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .replay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        font-family: var(--mono);
        color: var(--dim);
      }
      .replay-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .replay-scrubber {
        flex: 1;
        accent-color: var(--ion);
        cursor: pointer;
      }
      .replay-screen {
        min-height: 50px;
        max-height: 110px;
        overflow-y: auto;
        padding: 10px;
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        font-family: var(--mono);
        font-size: 0.9rem;
        color: var(--ink);
        white-space: pre-wrap;
        word-break: break-all;
      }
      .bigrams-box {
        margin-top: 12px;
        padding: 12px 14px;
        background: var(--void2);
        border: 1px solid var(--line);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .bigram-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .bigram-pill {
        padding: 4px 8px;
        border-radius: 6px;
        background: rgba(244, 63, 94, 0.12);
        border: 1px solid rgba(244, 63, 94, 0.35);
        color: var(--rose);
        font-family: var(--mono);
        font-size: 0.75rem;
        font-weight: 700;
      }
`;
  content = content.replace(styleInsert, newStyles + '\n' + styleInsert);
}

// 3. Add Rank Badge in Breadcrumbs
const crumbTarget = '<span class="crumb-current">Velocity Studio</span>';
const crumbReplacement = `<span class="crumb-current">Velocity Studio</span>
          <span class="rank-badge" id="studioRankBadge"><span class="rank-dot"></span> <span id="studioRankText">Novice Typist · Lvl 1</span></span>`;
if (!content.includes('id="studioRankBadge"') && content.includes(crumbTarget)) {
  content = content.replace(crumbTarget, crumbReplacement);
}

// 4. Add Sandbox Mode Button to Mode Pills
const modeTarget = `<button class="mode-pill" data-mode="custom" onclick="openCustomTextModal()" role="tab" aria-selected="false">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Custom
            </button>`;
const modeReplacement = `${modeTarget}
            <button class="mode-pill" data-mode="sandbox" onclick="setStudioMode('sandbox')" role="tab" aria-selected="false">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              Sandbox
            </button>`;
if (!content.includes('data-mode="sandbox"') && content.includes(modeTarget)) {
  content = content.replace(modeTarget, modeReplacement);
}

// 5. Add Challenge Modifiers & Heatmap Button in Sub-Options Bar
const audioBtnTarget = `<button class="sub-opt-btn" id="audioSwitchBtn" onclick="cycleAudioProfile()">`;
const modifiersHtml = `<div style="display: flex; align-items: center; gap: 6px; margin-right: 6px;">
              <span class="sub-opt-label">Modifiers:</span>
              <button class="sub-opt-btn mod-warn" id="modSuddenDeath" onclick="toggleSuddenDeath()" title="One typing error immediately ends the run">Sudden Death</button>
              <button class="sub-opt-btn" id="modBlind" onclick="toggleBlindMode()" title="Hides green/red letter feedback until completion">Blind Mode</button>
              <button class="sub-opt-btn mod-teal" id="modMetronome" onclick="toggleMetronome()" title="Audio metronome click paced to target WPM">Metronome</button>
              <button class="sub-opt-btn" id="modHeatmap" onclick="toggleHeatmap()" title="Real-time keyboard error and latency heatmap">Heatmap</button>
            </div>
            ${audioBtnTarget}`;
if (!content.includes('id="modSuddenDeath"') && content.includes(audioBtnTarget)) {
  content = content.replace(audioBtnTarget, modifiersHtml);
}

// 6. Add Sandbox Stage Markup right before Terminal
const terminalTarget = `<section class="terminal" id="terminal" aria-label="Typing arena" tabindex="-1">`;
const sandboxHtml = `<!-- Free-Type Sandbox Stage -->
      <section class="sandbox-stage" id="sandboxStage" style="display: none;" aria-label="Free-Type Sandbox">
        <div class="sandbox-toolbar">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="sub-opt-label">Test Lab Preset:</span>
            <button class="sub-opt-btn active" id="sbPresetBlank" onclick="setSandboxPreset('blank')">Blank Sheet</button>
            <button class="sub-opt-btn" id="sbPresetCode" onclick="setSandboxPreset('code')">Code Syntax</button>
            <button class="sub-opt-btn" id="sbPresetProse" onclick="setSandboxPreset('prose')">Velocity Prose</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="sub-opt-btn" onclick="clearSandbox()">Clear Sheet</button>
          </div>
        </div>
        <textarea class="sandbox-pad" id="sandboxPad" placeholder="Free-Type Sandbox: Practice switch acoustics, finger rolling cadence, or stream-of-consciousness typing without error locks..." spellcheck="false"></textarea>
        <div class="sandbox-metrics">
          <div class="sandbox-metric-item">
            <span class="sandbox-metric-val" id="sbBurstWpm">0</span>
            <span class="sandbox-metric-lbl">Burst WPM (3s)</span>
          </div>
          <div class="sandbox-metric-item">
            <span class="sandbox-metric-val" id="sbLatency">0ms</span>
            <span class="sandbox-metric-lbl">Avg Key Latency</span>
          </div>
          <div class="sandbox-metric-item">
            <span class="sandbox-metric-val" id="sbKeystrokes">0</span>
            <span class="sandbox-metric-lbl">Total Keystrokes</span>
          </div>
          <div class="sandbox-metric-item">
            <span class="sandbox-metric-val" id="sbWords">0</span>
            <span class="sandbox-metric-lbl">Words Typed</span>
          </div>
        </div>
      </section>

      ${terminalTarget}`;
if (!content.includes('id="sandboxStage"') && content.includes(terminalTarget)) {
  content = content.replace(terminalTarget, sandboxHtml);
}

// 7. Add Replay Player & Slowest Bigrams Box into Results Modal
const weakBoxTarget = `<div class="weak-keys-box" id="weakKeysBox" style="display: none;">`;
const replayBigramsHtml = `<div class="bigrams-box" id="bigramsBox" style="display: none;">
          <div style="font-family: var(--mono); font-size: 0.76rem; color: var(--dim); text-transform: uppercase;">Slowest Keystroke Transitions (Bigrams):</div>
          <div class="bigram-tags" id="bigramTags"></div>
        </div>

        <div class="replay-box" id="replayBox">
          <div class="replay-header">
            <span>Keystroke Replay</span>
            <span id="replayStatus">Paused · 0.0s</span>
          </div>
          <div class="replay-screen" id="replayScreen"></div>
          <div class="replay-controls">
            <button class="sub-opt-btn" id="btnReplayPlay" onclick="toggleReplay()">▶ Play</button>
            <input type="range" class="replay-scrubber" id="replayScrubber" min="0" max="100" value="0" oninput="seekReplay(this.value)">
            <select class="deck-select" id="replaySpeed" onchange="setReplaySpeed(this.value)" aria-label="Replay speed">
              <option value="1">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>
        </div>

        ${weakBoxTarget}`;
if (!content.includes('id="replayBox"') && content.includes(weakBoxTarget)) {
  content = content.replace(weakBoxTarget, replayBigramsHtml);
}

// 8. Update Audio Profiles Array to include Buckling Spring and Vintage Typewriter
content = content.replace(
  `const audioProfiles = ['Blue (Clicky)', 'Brown (Thocky)', 'Red (Linear)', 'Holy Panda', 'Muted'];`,
  `const audioProfiles = ['Blue (Clicky)', 'Brown (Thocky)', 'Red (Linear)', 'Holy Panda', 'Buckling Spring', 'Vintage Typewriter', 'Muted'];`
);

// 9. Update Switch Sound logic and Audio Profile switching
const audioSwitchTarget = `function cycleAudioProfile() {`;
const newSwitchSoundCode = `// Buckling Spring & Typewriter audio synthesis helper
      function playBucklingSpring(now) {
        if (!audioCtx) return;
        const ping = audioCtx.createOscillator();
        const pingGain = audioCtx.createGain();
        ping.type = 'triangle';
        ping.frequency.setValueAtTime(2850 + Math.random() * 200, now);
        pingGain.gain.setValueAtTime(0.12, now);
        pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        ping.connect(pingGain);
        pingGain.connect(audioCtx.destination);
        ping.start(now);
        ping.stop(now + 0.04);

        const spring = audioCtx.createOscillator();
        const springGain = audioCtx.createGain();
        spring.type = 'sine';
        spring.frequency.setValueAtTime(1450 + Math.random() * 80, now + 0.006);
        springGain.gain.setValueAtTime(0.08, now + 0.006);
        springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        spring.connect(springGain);
        springGain.connect(audioCtx.destination);
        spring.start(now + 0.006);
        spring.stop(now + 0.07);
      }

      function playVintageTypewriter(now, isSpecial) {
        if (!audioCtx) return;
        // Heavy mechanical hammer strike
        const strike = audioCtx.createOscillator();
        const strikeGain = audioCtx.createGain();
        strike.type = 'square';
        strike.frequency.setValueAtTime(190 + Math.random() * 30, now);
        strikeGain.gain.setValueAtTime(0.16, now);
        strikeGain.gain.exponentialRampToValueAtTime(0.002, now + 0.045);
        strike.connect(strikeGain);
        strikeGain.connect(audioCtx.destination);
        strike.start(now);
        strike.stop(now + 0.045);

        // Typewriter Carriage Bell on space / special keys
        if (isSpecial) {
          const bell = audioCtx.createOscillator();
          const bellGain = audioCtx.createGain();
          bell.type = 'sine';
          bell.frequency.setValueAtTime(1760, now + 0.02);
          bellGain.gain.setValueAtTime(0.12, now + 0.02);
          bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
          bell.connect(bellGain);
          bellGain.connect(audioCtx.destination);
          bell.start(now + 0.02);
          bell.stop(now + 0.45);
        }
      }

      function cycleAudioProfile() {`;

if (!content.includes('function playBucklingSpring') && content.includes(audioSwitchTarget)) {
  content = content.replace(audioSwitchTarget, newSwitchSoundCode);
}

// 10. In playKeySound, add support for profiles 4 (Buckling Spring) and 5 (Vintage Typewriter)
const pandaEndTarget = `thockGain.connect(audioCtx.destination);
          thockGain.gain.setValueAtTime(0.18, now);
          thockGain.gain.exponentialRampToValueAtTime(0.002, now + 0.04);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
        }`;

// Replace muted check from profile 4 to profile 6
content = content.replace(
  `if (audioProfileIndex === 4) return; // Muted`,
  `if (audioProfileIndex === 6) return; // Muted`
);

const soundBranchesTarget = `} else if (audioProfileIndex === 3) { // Holy Panda: heavy crisp pop`;
const newSoundBranches = `} else if (audioProfileIndex === 3) { // Holy Panda: heavy crisp pop
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(840 + Math.random() * 80, now);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.002, now + 0.04);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
        } else if (audioProfileIndex === 4) { // Buckling Spring
          playBucklingSpring(now);
        } else if (audioProfileIndex === 5) { // Vintage Typewriter
          playVintageTypewriter(now, false);
        }`;

if (!content.includes('audioProfileIndex === 4) { // Buckling Spring') && content.includes(soundBranchesTarget)) {
  // Replace the Holy Panda block with the extended branches
  const hpBlock = `} else if (audioProfileIndex === 3) { // Holy Panda: heavy crisp pop
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(840 + Math.random() * 80, now);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.002, now + 0.04);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
        }`;
  content = content.replace(hpBlock, newSoundBranches);
}

// 11. Inject New Engine State & Helper Functions
const helperInsertTarget = `      // AI Simulation`;
const newEngineHelpers = `      // Challenge Modifiers State
      let isSuddenDeath = false;
      let isBlindMode = false;
      let isMetronome = false;
      let metronomeInterval = null;
      let isHeatmapOn = false;

      // Key & Bigram Performance Tracking
      const keyStats = {};
      const bigramTimes = {};
      let lastCharTypedTime = 0;
      let lastCharTyped = '';
      let replayLog = [];
      let replayTimer = null;
      let replayIndex = 0;
      let replaySpeedMultiplier = 1;

      // Local XP System
      function getLocalXP() {
        return parseInt(localStorage.getItem('ati_local_xp') || '0', 10);
      }
      function addLocalXP(amount) {
        const next = getLocalXP() + Math.max(0, amount);
        localStorage.setItem('ati_local_xp', String(next));
        updateRankBadge();
        return next;
      }
      function getRankInfo(xp) {
        if (xp >= 5000) return { title: 'Apex Tachyon', level: 6 };
        if (xp >= 3000) return { title: 'Mechanical Grandmaster', level: 5 };
        if (xp >= 1500) return { title: 'Velocity Artisan', level: 4 };
        if (xp >= 750)  return { title: 'Tactile Sprinter', level: 3 };
        if (xp >= 250)  return { title: 'Cadence Apprentice', level: 2 };
        return { title: 'Novice Typist', level: 1 };
      }
      function updateRankBadge() {
        const info = getRankInfo(getLocalXP());
        const el = document.getElementById('studioRankText');
        if (el) el.textContent = \`\${info.title} · Lvl \${info.level}\`;
      }

      function toggleSuddenDeath() {
        isSuddenDeath = !isSuddenDeath;
        const btn = document.getElementById('modSuddenDeath');
        if (btn) btn.classList.toggle('mod-active', isSuddenDeath);
      }

      function toggleBlindMode() {
        isBlindMode = !isBlindMode;
        const btn = document.getElementById('modBlind');
        if (btn) btn.classList.toggle('mod-active', isBlindMode);
        const stage = document.getElementById('typingStage');
        if (stage) stage.classList.toggle('blind-active', isBlindMode && isPlaying);
      }

      function toggleMetronome() {
        isMetronome = !isMetronome;
        const btn = document.getElementById('modMetronome');
        if (btn) btn.classList.toggle('mod-active', isMetronome);
        if (!isMetronome && metronomeInterval) {
          clearInterval(metronomeInterval);
          metronomeInterval = null;
        } else if (isMetronome && isPlaying) {
          startMetronome();
        }
      }

      function startMetronome() {
        if (metronomeInterval) clearInterval(metronomeInterval);
        const targetWpm = ghostPacerWpm || 60;
        const intervalMs = Math.round(60000 / (targetWpm * 5)); // tick per character
        metronomeInterval = setInterval(() => {
          if (!isPlaying || !isMetronome) {
            clearInterval(metronomeInterval);
            metronomeInterval = null;
            return;
          }
          if (audioCtx && audioProfileIndex !== 6) {
            try {
              const now = audioCtx.currentTime;
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1100, now);
              gain.gain.setValueAtTime(0.04, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start(now);
              osc.stop(now + 0.02);
            } catch(e){}
          }
        }, intervalMs);
      }

      function toggleHeatmap() {
        isHeatmapOn = !isHeatmapOn;
        const btn = document.getElementById('modHeatmap');
        if (btn) btn.classList.toggle('mod-active', isHeatmapOn);
        const kb = document.getElementById('virtualKeyboard');
        if (kb) kb.classList.toggle('heatmap-on', isHeatmapOn);
        if (isHeatmapOn) renderHeatmapStyles();
      }

      function recordKeyLatency(char, isError) {
        const now = performance.now();
        const ch = (char || '').toLowerCase();
        if (ch) {
          if (!keyStats[ch]) keyStats[ch] = { hits: 0, errors: 0, totalMs: 0 };
          keyStats[ch].hits++;
          if (isError) keyStats[ch].errors++;
          if (lastCharTypedTime > 0) {
            const delta = Math.min(1000, now - lastCharTypedTime);
            keyStats[ch].totalMs += delta;
            if (lastCharTyped && /^[a-z0-9]$/i.test(lastCharTyped) && /^[a-z0-9]$/i.test(ch)) {
              const bg = (lastCharTyped + ch).toLowerCase();
              if (!bigramTimes[bg]) bigramTimes[bg] = [];
              bigramTimes[bg].push(delta);
            }
          }
        }
        lastCharTypedTime = now;
        lastCharTyped = ch;

        // Record for replay
        if (isPlaying) {
          replayLog.push({
            time: Math.round(now - (startTime || now)),
            char: char,
            isError: isError
          });
        }
        if (isHeatmapOn) renderHeatmapStyles();
      }

      function renderHeatmapStyles() {
        document.querySelectorAll('#virtualKeyboard .key').forEach(k => {
          const ch = (k.dataset.key || k.textContent || '').trim().toLowerCase();
          k.classList.remove('heat-good', 'heat-warn', 'heat-bad');
          const st = keyStats[ch];
          if (!st || st.hits < 2) return;
          const errRate = st.errors / st.hits;
          const avgMs = st.totalMs / st.hits;
          if (errRate > 0.15) {
            k.classList.add('heat-bad');
          } else if (avgMs > 240) {
            k.classList.add('heat-warn');
          } else {
            k.classList.add('heat-good');
          }
        });
      }

      // Free-Type Sandbox Logic
      let sbBurstTimes = [];
      let sbLastKeyTime = 0;
      function initSandbox() {
        const pad = document.getElementById('sandboxPad');
        if (!pad) return;
        pad.addEventListener('keydown', (e) => {
          const now = performance.now();
          initAudioContext();
          playKeySound(false);

          sbBurstTimes.push(now);
          const cutoff = now - 3000;
          sbBurstTimes = sbBurstTimes.filter(t => t >= cutoff);
          const burstWpm = Math.round((sbBurstTimes.length / 5) * 20); // 3s normalized to 60s
          
          let latency = 0;
          if (sbLastKeyTime > 0) {
            latency = Math.round(now - sbLastKeyTime);
          }
          sbLastKeyTime = now;

          const text = pad.value;
          const words = text.trim() ? text.trim().split(/\\s+/).length : 0;

          const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
          setVal('sbBurstWpm', burstWpm);
          if (latency > 0) setVal('sbLatency', latency + 'ms');
          setVal('sbKeystrokes', text.length);
          setVal('sbWords', words);

          // Reactive streak border glow on sandbox
          const sbStage = document.getElementById('sandboxStage');
          if (sbStage) {
            if (burstWpm >= 100) {
              sbStage.style.borderColor = 'rgba(244, 63, 94, 0.6)';
              sbStage.style.boxShadow = '0 0 25px rgba(244, 63, 94, 0.3)';
            } else if (burstWpm >= 70) {
              sbStage.style.borderColor = 'rgba(242, 184, 75, 0.6)';
              sbStage.style.boxShadow = '0 0 20px rgba(242, 184, 75, 0.25)';
            } else if (burstWpm >= 40) {
              sbStage.style.borderColor = 'rgba(56, 189, 248, 0.6)';
              sbStage.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.2)';
            } else {
              sbStage.style.borderColor = '';
              sbStage.style.boxShadow = '';
            }
          }
        });
      }

      function clearSandbox() {
        const pad = document.getElementById('sandboxPad');
        if (pad) {
          pad.value = '';
          pad.focus();
        }
        document.getElementById('sbBurstWpm').textContent = '0';
        document.getElementById('sbLatency').textContent = '0ms';
        document.getElementById('sbKeystrokes').textContent = '0';
        document.getElementById('sbWords').textContent = '0';
      }

      function setSandboxPreset(kind) {
        const pad = document.getElementById('sandboxPad');
        if (!pad) return;
        document.querySelectorAll('.sandbox-toolbar .sub-opt-btn').forEach(b => b.classList.remove('active'));
        if (kind === 'blank') {
          pad.value = '';
          const b = document.getElementById('sbPresetBlank'); if (b) b.classList.add('active');
        } else if (kind === 'code') {
          pad.value = 'function calculateVelocity(distance, time) {\\n  if (time <= 0) return 0;\\n  const speed = distance / time;\\n  return Math.round(speed * 100) / 100;\\n}';
          const b = document.getElementById('sbPresetCode'); if (b) b.classList.add('active');
        } else if (kind === 'prose') {
          pad.value = 'The mechanical click of a buckling spring echoes through the late hours. Keystroke rhythm finds steady cadence as muscle memory coordinates tactile feedback.';
          const b = document.getElementById('sbPresetProse'); if (b) b.classList.add('active');
        }
        pad.focus();
      }

      // Replay Controller
      function toggleReplay() {
        const btn = document.getElementById('btnReplayPlay');
        if (replayTimer) {
          clearInterval(replayTimer);
          replayTimer = null;
          if (btn) btn.textContent = '▶ Play';
          return;
        }
        if (replayIndex >= replayLog.length) {
          replayIndex = 0;
          const sc = document.getElementById('replayScreen');
          if (sc) sc.textContent = '';
        }
        if (btn) btn.textContent = '⏸ Pause';
        const interval = Math.max(16, 45 / replaySpeedMultiplier);
        replayTimer = setInterval(() => {
          if (replayIndex >= replayLog.length) {
            clearInterval(replayTimer);
            replayTimer = null;
            if (btn) btn.textContent = '▶ Replay';
            return;
          }
          const item = replayLog[replayIndex];
          const sc = document.getElementById('replayScreen');
          if (sc) {
            if (item.char === 'Backspace') {
              sc.textContent = sc.textContent.slice(0, -1);
            } else {
              sc.textContent += item.char;
            }
            sc.scrollTop = sc.scrollHeight;
          }
          const scrubber = document.getElementById('replayScrubber');
          if (scrubber && replayLog.length > 0) {
            scrubber.value = Math.round((replayIndex / replayLog.length) * 100);
          }
          const status = document.getElementById('replayStatus');
          if (status) {
            status.textContent = \`Playing · \${(item.time / 1000).toFixed(1)}s\`;
          }
          replayIndex++;
        }, interval);
      }

      function seekReplay(val) {
        if (replayTimer) { clearInterval(replayTimer); replayTimer = null; }
        const btn = document.getElementById('btnReplayPlay');
        if (btn) btn.textContent = '▶ Play';
        const targetIdx = Math.round((val / 100) * (replayLog.length - 1));
        replayIndex = Math.max(0, targetIdx);
        const sc = document.getElementById('replayScreen');
        if (sc) {
          let text = '';
          for (let i = 0; i < replayIndex; i++) {
            if (replayLog[i].char === 'Backspace') text = text.slice(0, -1);
            else text += replayLog[i].char;
          }
          sc.textContent = text;
        }
      }

      function setReplaySpeed(val) {
        replaySpeedMultiplier = parseFloat(val) || 1;
        if (replayTimer) {
          toggleReplay();
          toggleReplay();
        }
      }
`;

if (!content.includes('function toggleSuddenDeath') && content.includes(helperInsertTarget)) {
  content = content.replace(helperInsertTarget, newEngineHelpers + '\n' + helperInsertTarget);
}

// 12. Hook Sandbox into setStudioMode()
const setModeTarget = `function setStudioMode(mode, preserveMissed = false) {`;
const setModeInjection = `function setStudioMode(mode, preserveMissed = false) {
        const terminalSec = document.getElementById('terminal');
        const sandboxSec = document.getElementById('sandboxStage');
        const ghostTrack = document.getElementById('ghostTrackContainer');
        if (mode === 'sandbox') {
          if (terminalSec) terminalSec.style.display = 'none';
          if (ghostTrack) ghostTrack.style.display = 'none';
          if (sandboxSec) {
            sandboxSec.style.display = 'flex';
            const pad = document.getElementById('sandboxPad');
            if (pad) pad.focus();
          }
          document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
          const sbPill = document.querySelector('.mode-pill[data-mode="sandbox"]');
          if (sbPill) sbPill.classList.add('active');
          return;
        } else {
          if (terminalSec) terminalSec.style.display = 'block';
          if (ghostTrack) ghostTrack.style.display = 'flex';
          if (sandboxSec) sandboxSec.style.display = 'none';
        }`;

if (!content.includes('if (mode === \'sandbox\') {') && content.includes(setModeTarget)) {
  content = content.replace(setModeTarget, setModeInjection);
}

// 13. Hook Sudden Death, Blind Mode, and Key Latency into handleInputCharacter()
const handleInputTarget = `function handleInputCharacter(char) {`;
const suddenDeathCheck = `function handleInputCharacter(char) {
        recordKeyLatency(char, false);`;
if (!content.includes('recordKeyLatency(char, false);') && content.includes(handleInputTarget)) {
  content = content.replace(handleInputTarget, suddenDeathCheck);
}

// Check error condition inside handleInputCharacter for Sudden Death
const errorSoundTarget = `playKeySound(true);`;
const suddenDeathErrorHook = `playKeySound(true);
          recordKeyLatency(char, true);
          if (isSuddenDeath && isPlaying) {
            endTest();
            const termMeta = $('termMetaTitle');
            if (termMeta) termMeta.textContent = 'SUDDEN DEATH: Run Terminated on Mistake';
            return;
          }`;
if (!content.includes('if (isSuddenDeath && isPlaying)') && content.includes(errorSoundTarget)) {
  content = content.replace(errorSoundTarget, suddenDeathErrorHook);
}

// 14. Start metronome when test starts
const startTestTarget = `function startTest() {`;
const startTestWithMetronome = `function startTest() {
        replayLog = [];
        replayIndex = 0;
        if (isMetronome) startMetronome();
        if (isBlindMode) {
          const stage = document.getElementById('typingStage');
          if (stage) stage.classList.add('blind-active');
        }`;
if (!content.includes('replayLog = [];') && content.includes(startTestTarget)) {
  content = content.replace(startTestTarget, startTestWithMetronome);
}

// 15. In endTest(), reveal blind mode, clear metronome, grant XP, calculate slowest bigrams
const endTestTarget = `function endTest() {`;
const endTestEnhancement = `function endTest() {
        if (metronomeInterval) { clearInterval(metronomeInterval); metronomeInterval = null; }
        const stage = document.getElementById('typingStage');
        if (stage) stage.classList.remove('blind-active');`;
if (!content.includes('stage.classList.remove(\'blind-active\');') && content.includes(endTestTarget)) {
  content = content.replace(endTestTarget, endTestEnhancement);
}

// In endTest() results section, award XP and populate Bigrams
const populateResultsTarget = `// Weak keys callout (letters only)`;
const xpAndBigramsCode = `// Award Local XP
        const xpGained = Math.round(finalNetWPM * (finalAcc / 100) * (elapsedTotalSec / 15) * 8);
        addLocalXP(xpGained);

        // Populate Slowest Bigrams
        const bigramEntries = Object.entries(bigramTimes)
          .map(([bg, times]) => ({ bg, avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length) }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5);
        const bigramsBox = document.getElementById('bigramsBox');
        const bigramTags = document.getElementById('bigramTags');
        if (bigramsBox && bigramTags) {
          if (bigramEntries.length > 0) {
            bigramTags.innerHTML = bigramEntries.map(e => \`<span class="bigram-pill">\${e.bg.toUpperCase()} · \${e.avg}ms</span>\`).join('');
            bigramsBox.style.display = 'flex';
          } else {
            bigramsBox.style.display = 'none';
          }
        }

        // Initialize Replay screen
        const replayScr = document.getElementById('replayScreen');
        if (replayScr) replayScr.textContent = '';
        const replayScrub = document.getElementById('replayScrubber');
        if (replayScrub) replayScrub.value = 0;
        const replayStat = document.getElementById('replayStatus');
        if (replayStat) replayStat.textContent = \`Ready · \${replayLog.length} events\`;

        // Weak keys callout (letters only)`;

if (!content.includes('// Award Local XP') && content.includes(populateResultsTarget)) {
  content = content.replace(populateResultsTarget, xpAndBigramsCode);
}

// 16. Initialize rank badge & sandbox on DOM ready
const initCallTarget = `buildVirtualKeyboard();`;
const initCallWithRank = `buildVirtualKeyboard();
      updateRankBadge();
      initSandbox();`;
if (!content.includes('updateRankBadge();') && content.includes(initCallTarget)) {
  content = content.replace(initCallTarget, initCallWithRank);
}

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully upgraded ati-demo.html!');
