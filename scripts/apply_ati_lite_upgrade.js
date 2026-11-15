const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ati-lite.html');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update Description / Metadata if needed
content = content.replace(
  'A multi-engine typing simulator combining TypeRacer ghost tracking, Monkeytype minimalist flow, and ZType arcade laser defense with synthesized mechanical switches.',
  'A multi-engine cyber typing simulator featuring 4-Lane Cyber Grand Prix racing, ZType arcade laser defense with boss waves and power-ups, Zen Flow, and synthesized mechanical switches.'
);

// 2. Add Styles for 4-Lane Racer, Nitro Meter, Boss, Power-ups, Heatmap, Tab-Armed hint
const styleTarget = '      /* Cyber Racer Track (TypeRacer Canvas) */';
const newStyles = `      /* 4-Lane Grand Prix & Nitro UI */
      .nitro-dock {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 10px;
        padding: 8px 14px;
        background: rgba(12, 18, 36, 0.7);
        border: 1px solid var(--line);
        border-radius: 10px;
        font-family: var(--mono);
      }
      .nitro-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--amber);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .nitro-track-wrap {
        flex: 1;
        height: 10px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 5px;
        overflow: hidden;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }
      .nitro-track-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #f59e0b, #ef4444);
        box-shadow: 0 0 12px #f59e0b;
        transition: width 0.15s ease;
      }
      .nitro-btn {
        padding: 6px 14px;
        border-radius: 8px;
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid var(--amber);
        color: var(--amber);
        font-family: var(--mono);
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .nitro-btn.ready {
        background: var(--amber);
        color: #070a14;
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.5);
      }
      .nitro-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* Tab Armed Reset Hint */
      .restart-hint.tab-armed {
        color: var(--rose) !important;
        animation: pulseArmed 0.4s ease infinite alternate;
      }
      @keyframes pulseArmed {
        from { opacity: 0.7; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1.02); }
      }

      /* Live Heatmap for Lite Keyboard */
      .heatmap-active .key.heat-fast {
        background: rgba(6, 182, 212, 0.25) !important;
        border-color: #06b6d4 !important;
        color: #06b6d4 !important;
      }
      .heatmap-active .key.heat-mid {
        background: rgba(245, 158, 11, 0.25) !important;
        border-color: #f59e0b !important;
        color: #f59e0b !important;
      }
      .heatmap-active .key.heat-error {
        background: rgba(244, 63, 94, 0.3) !important;
        border-color: #f43f5e !important;
        color: #f43f5e !important;
      }
`;

if (!content.includes('/* 4-Lane Grand Prix & Nitro UI */') && content.includes(styleTarget)) {
  content = content.replace(styleTarget, newStyles + '\n' + styleTarget);
}

// 3. Update Racer Canvas height in HTML
content = content.replace(
  '<canvas id="racerCanvas" width="1120" height="120"></canvas>',
  '<canvas id="racerCanvas" width="1120" height="200"></canvas>'
);

// In CSS: update #racerCanvas height to 200px
content = content.replace(
  '#racerCanvas {\n        width: 100%;\n        height: 120px;\n        display: block;\n        border-radius: 10px;\n      }',
  '#racerCanvas {\n        width: 100%;\n        height: 200px;\n        display: block;\n        border-radius: 10px;\n      }'
);

// 4. Add Nitro Dock right below #racerTrackContainer's lead bar
const racerLeadTarget = `<div class="racer-telemetry-lead">
            <div><span style="color: var(--cyan);">&#9658;</span> Player Speeder: <strong id="playerLeadText">0% Completed</strong></div>
            <div id="ghostLeadBadge" class="lead-badge">Equal Pace</div>
            <div><span style="color: var(--amber);">&#9658;</span> Ghost AI: <strong id="ghostLeadText">0%</strong></div>
          </div>
        </div>`;

const racerLeadReplacement = `<div class="racer-telemetry-lead">
            <div><span style="color: var(--cyan);">&#9658;</span> Player Speeder: <strong id="playerLeadText">0% Completed</strong></div>
            <div id="ghostLeadBadge" class="lead-badge">Equal Pace</div>
            <div><span style="color: var(--amber);">&#9658;</span> 3 AI Rivals Active</div>
          </div>
          <!-- Nitro Overdrive Dock -->
          <div class="nitro-dock">
            <div class="nitro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>NITRO OVERDRIVE</span>
            </div>
            <div class="nitro-track-wrap">
              <div class="nitro-track-fill" id="nitroFill"></div>
            </div>
            <span style="font-size: 0.75rem; color: var(--dim);" id="nitroPctText">0%</span>
            <button class="nitro-btn" id="nitroBtn" onclick="triggerNitro()" title="Ignite Nitro Overdrive (Shift Key)">IGNITE (SHIFT)</button>
          </div>
        </div>`;

if (!content.includes('id="nitroFill"') && content.includes(racerLeadTarget)) {
  content = content.replace(racerLeadTarget, racerLeadReplacement);
}

// 5. Add Heatmap Toggle in the Toolbar
const switchSoundTarget = `<button class="tool-btn" id="switchSoundBtn" onclick="cycleSwitchSound()">`;
const heatmapBtnHtml = `<button class="tool-btn" id="liteHeatmapBtn" onclick="toggleLiteHeatmap()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            <span id="liteHeatmapText">Heatmap: OFF</span>
          </button>
          ${switchSoundTarget}`;

if (!content.includes('id="liteHeatmapBtn"') && content.includes(switchSoundTarget)) {
  content = content.replace(switchSoundTarget, heatmapBtnHtml);
}

// 6. Update Restart Hint Label
content = content.replace(
  '<span class="key-cap">Tab</span> + <span class="key-cap">Enter</span> or <span class="key-cap">Esc</span> to quick restart',
  '<span class="key-cap">Tab + Enter</span> or <span class="key-cap">Esc</span> to quick restart'
);

// 7. Inject 4-Lane Racer, Nitro, Boss Waves, Power-ups, and Control Fixes into logic script
const stateInsertTarget = `      let playerProgress = 0; // 0 to 1`;
const newStateVars = `      let playerProgress = 0; // 0 to 1

      // 4-Lane Cyber Grand Prix State
      const GHOST_RIVALS = [
        { name: 'AeroByte', wpm: 55, color: '#f59e0b', progress: 0 },
        { name: 'VortexPhantom', wpm: 75, color: '#a855f7', progress: 0 },
        { name: 'ApexTitan', wpm: 95, color: '#ef4444', progress: 0 }
      ];
      let nitroGauge = 0; // 0 to 100
      let isNitroActive = false;
      let nitroTimer = null;
      let trackScrollOffset = 0;

      // ZType Arcade Defense Enhancements State
      let screenShake = 0;
      let activeLaserBolts = [];
      let freezeTimer = 0;
      let bossEnemy = null;
      const POWER_UP_WORDS = ['EMP', 'SHIELD', 'FREEZE'];

      // Heatmap & Input Control State
      let isLiteHeatmapOn = false;
      const liteKeyHits = {};
      const liteKeyErrors = {};
      let tabArmedTime = 0;
`;

if (!content.includes('GHOST_RIVALS = [') && content.includes(stateInsertTarget)) {
  content = content.replace(stateInsertTarget, newStateVars);
}

// 8. Replace drawRacerTrack() with 4-Lane Cyber Grand Prix + Parallax + Nitro Trails
const oldRacerFunction = `      function drawRacerTrack() {
        const w = racerCanvas.width;
        const h = racerCanvas.height;
        racerCtx.clearRect(0, 0, w, h);

        // Cyber Grid Lines
        racerCtx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        racerCtx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
          racerCtx.beginPath();
          racerCtx.moveTo(x, 0);
          racerCtx.lineTo(x, h);
          racerCtx.stroke();
        }

        // Two Lanes
        const laneH = h / 2;
        racerCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        racerCtx.lineWidth = 2;
        racerCtx.setLineDash([8, 8]);
        racerCtx.beginPath();
        racerCtx.moveTo(0, laneH);
        racerCtx.lineTo(w, laneH);
        racerCtx.stroke();
        racerCtx.setLineDash([]);

        // Finish Line Checkered Bar
        const finishX = w - 40;
        for (let y = 0; y < h; y += 12) {
          racerCtx.fillStyle = (Math.floor(y / 12) % 2 === 0) ? '#ffffff' : '#070a14';
          racerCtx.fillRect(finishX, y, 8, 12);
        }

        // 1. Draw Player Speeder (Lane 1)
        const playerX = 30 + playerProgress * (finishX - 60);
        const playerY = laneH * 0.5;

        // Player Thruster particles/glow
        if (isPlaying && streak >= 15) {
          racerCtx.shadowColor = '#06b6d4';
          racerCtx.shadowBlur = 18;
          racerCtx.fillStyle = '#06b6d4';
          racerCtx.beginPath();
          racerCtx.arc(playerX - 18, playerY, 7 + Math.random() * 4, 0, Math.PI * 2);
          racerCtx.fill();
        }

        // Speeder Body
        racerCtx.shadowColor = '#38bdf8';
        racerCtx.shadowBlur = 10;
        racerCtx.fillStyle = '#38bdf8';
        racerCtx.beginPath();
        racerCtx.moveTo(playerX + 18, playerY);
        racerCtx.lineTo(playerX - 14, playerY - 9);
        racerCtx.lineTo(playerX - 8, playerY);
        racerCtx.lineTo(playerX - 14, playerY + 9);
        racerCtx.closePath();
        racerCtx.fill();
        racerCtx.shadowBlur = 0;

        // Player Label
        racerCtx.font = '10px "Space Mono", monospace';
        racerCtx.fillStyle = '#38bdf8';
        racerCtx.fillText('YOU (' + (document.getElementById('telWPM').textContent || 0) + ' WPM)', Math.max(10, playerX - 30), playerY - 14);

        // 2. Draw Ghost AI Speeder (Lane 2)
        const ghostX = 30 + ghostProgress * (finishX - 60);
        const ghostY = laneH * 1.5;

        racerCtx.shadowColor = '#f59e0b';
        racerCtx.shadowBlur = 8;
        racerCtx.fillStyle = '#f59e0b';
        racerCtx.beginPath();
        racerCtx.moveTo(ghostX + 16, ghostY);
        racerCtx.lineTo(ghostX - 12, ghostY - 8);
        racerCtx.lineTo(ghostX - 6, ghostY);
        racerCtx.lineTo(ghostX - 12, ghostY + 8);
        racerCtx.closePath();
        racerCtx.fill();
        racerCtx.shadowBlur = 0;

        racerCtx.fillStyle = '#f59e0b';
        racerCtx.fillText('GHOST (' + ghostWpm + ' WPM)', Math.max(10, ghostX - 35), ghostY - 13);
      }`;

const newRacerFunction = `      function drawRacerTrack() {
        const w = racerCanvas.width;
        const h = racerCanvas.height;
        racerCtx.clearRect(0, 0, w, h);

        if (isPlaying) {
          trackScrollOffset = (trackScrollOffset + (isNitroActive ? 8 : 4)) % 40;
        }

        // 1. Distant Cyber Skyline Parallax
        racerCtx.fillStyle = 'rgba(7, 10, 20, 0.9)';
        racerCtx.fillRect(0, 0, w, h);

        racerCtx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        racerCtx.lineWidth = 1;
        for (let x = -trackScrollOffset; x < w; x += 40) {
          racerCtx.beginPath();
          racerCtx.moveTo(x, 0);
          racerCtx.lineTo(x, h);
          racerCtx.stroke();
        }

        // 2. 4 Road Lanes
        const numLanes = 4;
        const laneH = h / numLanes;
        racerCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        racerCtx.lineWidth = 1.5;
        racerCtx.setLineDash([10, 10]);
        for (let i = 1; i < numLanes; i++) {
          const y = i * laneH;
          racerCtx.beginPath();
          racerCtx.moveTo(0, y);
          racerCtx.lineTo(w, y);
          racerCtx.stroke();
        }
        racerCtx.setLineDash([]);

        // Finish Line Checkered Bar across all 4 lanes
        const finishX = w - 45;
        for (let y = 0; y < h; y += 12) {
          racerCtx.fillStyle = (Math.floor(y / 12) % 2 === 0) ? '#ffffff' : '#070a14';
          racerCtx.fillRect(finishX, y, 10, 12);
        }

        // 3. Draw Player Speeder (Lane 0)
        const playerX = 35 + playerProgress * (finishX - 70);
        const playerY = laneH * 0.5;

        // Flame / Nitro Exhaust Trails
        if (isPlaying) {
          const flameSize = isNitroActive ? 22 : (streak >= 15 ? 12 : 6);
          racerCtx.shadowColor = isNitroActive ? '#f59e0b' : '#06b6d4';
          racerCtx.shadowBlur = isNitroActive ? 25 : 15;
          racerCtx.fillStyle = isNitroActive ? '#ef4444' : '#06b6d4';
          racerCtx.beginPath();
          racerCtx.arc(playerX - 20, playerY, flameSize + Math.random() * 4, 0, Math.PI * 2);
          racerCtx.fill();

          if (isNitroActive) {
            // Additional inner flame core
            racerCtx.fillStyle = '#fef08a';
            racerCtx.beginPath();
            racerCtx.arc(playerX - 16, playerY, flameSize * 0.5, 0, Math.PI * 2);
            racerCtx.fill();
          }
        }

        // Player Speeder Chassis
        racerCtx.shadowColor = isNitroActive ? '#f59e0b' : '#38bdf8';
        racerCtx.shadowBlur = isNitroActive ? 18 : 10;
        racerCtx.fillStyle = isNitroActive ? '#f59e0b' : '#38bdf8';
        racerCtx.beginPath();
        racerCtx.moveTo(playerX + 20, playerY);
        racerCtx.lineTo(playerX - 16, playerY - 10);
        racerCtx.lineTo(playerX - 8, playerY);
        racerCtx.lineTo(playerX - 16, playerY + 10);
        racerCtx.closePath();
        racerCtx.fill();
        racerCtx.shadowBlur = 0;

        racerCtx.font = '10px "Space Mono", monospace';
        racerCtx.fillStyle = isNitroActive ? '#f59e0b' : '#38bdf8';
        racerCtx.fillText('YOU (' + (document.getElementById('telWPM').textContent || 0) + ' WPM)' + (isNitroActive ? ' [NITRO!]' : ''), Math.max(10, playerX - 35), playerY - 14);

        // 4. Draw 3 Ghost AI Speeder Rivals (Lanes 1, 2, 3)
        GHOST_RIVALS.forEach((rival, idx) => {
          const ry = (idx + 1) * laneH + (laneH * 0.5);
          const rx = 35 + rival.progress * (finishX - 70);

          racerCtx.shadowColor = rival.color;
          racerCtx.shadowBlur = 8;
          racerCtx.fillStyle = rival.color;
          racerCtx.beginPath();
          racerCtx.moveTo(rx + 16, ry);
          racerCtx.lineTo(rx - 12, ry - 8);
          racerCtx.lineTo(rx - 6, ry);
          racerCtx.lineTo(rx - 12, ry + 8);
          racerCtx.closePath();
          racerCtx.fill();
          racerCtx.shadowBlur = 0;

          racerCtx.fillStyle = rival.color;
          racerCtx.fillText(rival.name + ' (' + rival.wpm + ' WPM)', Math.max(10, rx - 35), ry - 12);
        });
      }`;

if (content.includes(oldRacerFunction)) {
  content = content.replace(oldRacerFunction, newRacerFunction);
}

// 9. Replace updateDefenseLoop() with Rotating Turret, Laser Bolts, Screen Shake, Power-Ups, and Boss Cruisers
const oldDefenseFunction = `      function updateDefenseLoop() {
        if (activeEngine !== 'defense') return;
        defCtx.clearRect(0, 0, defenseCanvas.width, defenseCanvas.height);

        // Turret base at bottom center
        const tx = defenseCanvas.width / 2;
        const ty = defenseCanvas.height - 20;
        defCtx.fillStyle = '#f43f5e';
        defCtx.beginPath();
        defCtx.arc(tx, ty, 16, Math.PI, 0);
        defCtx.fill();

        // Spawn periodically
        if (Math.random() < 0.02 && defenseEnemies.length < 5) {
          spawnDefenseEnemy();
        }

        // Draw and update enemies
        for (let i = defenseEnemies.length - 1; i >= 0; i--) {
          const e = defenseEnemies[i];
          e.y += e.speed;

          // Check if reached core
          if (e.y >= ty - 10) {
            defenseShield = Math.max(0, defenseShield - 25);
            document.getElementById('defenseShieldPercent').textContent = defenseShield + '%';
            document.getElementById('shieldBar').style.width = defenseShield + '%';
            playMechanicalSound(true);
            defenseEnemies.splice(i, 1);
            if (defenseTarget === e) defenseTarget = null;
            if (defenseShield <= 0) {
              endGameSession();
              return;
            }
            continue;
          }

          // Draw Enemy Word Node
          defCtx.font = '14px "Space Mono", monospace';
          const isTarget = (defenseTarget === e);
          defCtx.fillStyle = isTarget ? '#f43f5e' : 'rgba(255, 255, 255, 0.7)';
          
          // Draw typed portion highlighted
          const typedPart = e.text.slice(0, e.typed);
          const remainPart = e.text.slice(e.typed);

          defCtx.fillStyle = '#10b981';
          defCtx.fillText(typedPart, e.x, e.y);
          const typedWidth = defCtx.measureText(typedPart).width;
          defCtx.fillStyle = isTarget ? '#f43f5e' : 'rgba(255, 255, 255, 0.7)';
          defCtx.fillText(remainPart, e.x + typedWidth, e.y);

          // If locked target, draw laser beam from turret
          if (isTarget) {
            defCtx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
            defCtx.lineWidth = 2;
            defCtx.beginPath();
            defCtx.moveTo(tx, ty);
            defCtx.lineTo(e.x + typedWidth, e.y);
            defCtx.stroke();
          }
        }

        defAnimFrame = requestAnimationFrame(updateDefenseLoop);
      }`;

const newDefenseFunction = `      function spawnDefenseEnemy() {
        const isPowerUp = Math.random() < 0.22;
        const text = isPowerUp 
          ? POWER_UP_WORDS[Math.floor(Math.random() * POWER_UP_WORDS.length)]
          : DEFENSE_WORDS[Math.floor(Math.random() * DEFENSE_WORDS.length)];
        const x = 80 + Math.random() * (defenseCanvas.width - 160);
        defenseEnemies.push({
          text: text,
          typed: 0,
          x: x,
          y: 30,
          isPowerUp: isPowerUp,
          speed: isPowerUp ? 0.35 : (0.4 + defenseWave * 0.12)
        });
      }

      function spawnBossCruiser() {
        bossEnemy = {
          phrases: ['NEURAL', 'OVERRIDE', 'PROTOCOL'],
          phraseIdx: 0,
          typed: 0,
          x: defenseCanvas.width / 2,
          y: 45,
          hp: 3,
          maxHp: 3,
          speed: 0.12
        };
      }

      function updateDefenseLoop() {
        if (activeEngine !== 'defense') return;
        defCtx.save();
        defCtx.clearRect(0, 0, defenseCanvas.width, defenseCanvas.height);

        // Screen Shake
        if (screenShake > 0) {
          const sx = (Math.random() - 0.5) * screenShake;
          const sy = (Math.random() - 0.5) * screenShake;
          defCtx.translate(sx, sy);
          screenShake = Math.max(0, screenShake - 0.8);
        }

        const tx = defenseCanvas.width / 2;
        const ty = defenseCanvas.height - 25;

        // Determine aim target
        const activeAim = bossEnemy ? { x: bossEnemy.x, y: bossEnemy.y } : (defenseTarget ? { x: defenseTarget.x, y: defenseTarget.y } : null);
        const aimAngle = activeAim ? Math.atan2(activeAim.y - ty, activeAim.x - tx) : -Math.PI / 2;

        // Turret Base & Energy Core
        defCtx.fillStyle = '#0f172a';
        defCtx.beginPath();
        defCtx.arc(tx, ty, 24, Math.PI, 0);
        defCtx.fill();
        defCtx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
        defCtx.lineWidth = 2;
        defCtx.stroke();

        // Rotating Dual Barrel Cannons
        defCtx.save();
        defCtx.translate(tx, ty);
        defCtx.rotate(aimAngle + Math.PI / 2);
        defCtx.fillStyle = '#f43f5e';
        defCtx.fillRect(-8, -26, 4, 22);
        defCtx.fillRect(4, -26, 4, 22);
        defCtx.restore();

        // Check for Boss Wave spawn
        if (defenseWave % 3 === 0 && !bossEnemy && defenseEnemies.length === 0) {
          spawnBossCruiser();
        }

        // Spawn normal enemies if boss not present
        if (!bossEnemy && Math.random() < 0.02 && defenseEnemies.length < 5) {
          spawnDefenseEnemy();
        }

        // Draw and update Boss Cruiser if active
        if (bossEnemy) {
          bossEnemy.y += bossEnemy.speed;

          // Boss Hull
          defCtx.shadowColor = '#f43f5e';
          defCtx.shadowBlur = 20;
          defCtx.fillStyle = '#1e1b4b';
          defCtx.beginPath();
          defCtx.moveTo(bossEnemy.x, bossEnemy.y + 24);
          defCtx.lineTo(bossEnemy.x - 70, bossEnemy.y - 15);
          defCtx.lineTo(bossEnemy.x + 70, bossEnemy.y - 15);
          defCtx.closePath();
          defCtx.fill();
          defCtx.strokeStyle = '#f43f5e';
          defCtx.lineWidth = 2;
          defCtx.stroke();
          defCtx.shadowBlur = 0;

          // Boss Health Bar
          const barW = 120;
          defCtx.fillStyle = 'rgba(255,255,255,0.1)';
          defCtx.fillRect(bossEnemy.x - barW/2, bossEnemy.y - 28, barW, 6);
          defCtx.fillStyle = '#f43f5e';
          defCtx.fillRect(bossEnemy.x - barW/2, bossEnemy.y - 28, barW * (bossEnemy.hp / bossEnemy.maxHp), 6);

          // Current Phrase to Type
          const curPhrase = bossEnemy.phrases[bossEnemy.phraseIdx];
          defCtx.font = 'bold 15px "Space Mono", monospace';
          const typedPart = curPhrase.slice(0, bossEnemy.typed);
          const remainPart = curPhrase.slice(bossEnemy.typed);

          const totalW = defCtx.measureText(curPhrase).width;
          const startX = bossEnemy.x - totalW / 2;

          defCtx.fillStyle = '#10b981';
          defCtx.fillText(typedPart, startX, bossEnemy.y + 4);
          const typedW = defCtx.measureText(typedPart).width;
          defCtx.fillStyle = '#fbbf24';
          defCtx.fillText(remainPart, startX + typedW, bossEnemy.y + 4);

          if (bossEnemy.y >= ty - 30) {
            defenseShield = 0;
            endGameSession();
            defCtx.restore();
            return;
          }
        }

        // Freeze Slow-Mo update
        const speedMult = freezeTimer > 0 ? 0.25 : 1;
        if (freezeTimer > 0) freezeTimer--;

        // Draw and update enemies
        for (let i = defenseEnemies.length - 1; i >= 0; i--) {
          const e = defenseEnemies[i];
          e.y += e.speed * speedMult;

          if (e.y >= ty - 10) {
            defenseShield = Math.max(0, defenseShield - 25);
            document.getElementById('defenseShieldPercent').textContent = defenseShield + '%';
            document.getElementById('shieldBar').style.width = defenseShield + '%';
            playMechanicalSound(true);
            screenShake = 12;
            defenseEnemies.splice(i, 1);
            if (defenseTarget === e) defenseTarget = null;
            if (defenseShield <= 0) {
              endGameSession();
              defCtx.restore();
              return;
            }
            continue;
          }

          defCtx.font = '14px "Space Mono", monospace';
          const isTarget = (defenseTarget === e);

          // Enemy Glow Node
          if (e.isPowerUp) {
            defCtx.shadowColor = e.text === 'EMP' ? '#38bdf8' : (e.text === 'SHIELD' ? '#10b981' : '#60a5fa');
            defCtx.shadowBlur = 12;
          }

          const typedPart = e.text.slice(0, e.typed);
          const remainPart = e.text.slice(e.typed);

          defCtx.fillStyle = '#10b981';
          defCtx.fillText(typedPart, e.x, e.y);
          const typedWidth = defCtx.measureText(typedPart).width;
          defCtx.fillStyle = isTarget ? '#f43f5e' : (e.isPowerUp ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)');
          defCtx.fillText(remainPart, e.x + typedWidth, e.y);
          defCtx.shadowBlur = 0;
        }

        // Draw Laser Bolts
        for (let b = activeLaserBolts.length - 1; b >= 0; b--) {
          const bolt = activeLaserBolts[b];
          bolt.progress += 0.2;
          const curX = bolt.x + (bolt.targetX - bolt.x) * bolt.progress;
          const curY = bolt.y + (bolt.targetY - bolt.y) * bolt.progress;

          defCtx.strokeStyle = '#38bdf8';
          defCtx.lineWidth = 3;
          defCtx.shadowColor = '#38bdf8';
          defCtx.shadowBlur = 10;
          defCtx.beginPath();
          defCtx.moveTo(curX, curY);
          defCtx.lineTo(curX - (bolt.targetX - bolt.x)*0.1, curY - (bolt.targetY - bolt.y)*0.1);
          defCtx.stroke();
          defCtx.shadowBlur = 0;

          if (bolt.progress >= 1) {
            activeLaserBolts.splice(b, 1);
          }
        }

        defCtx.restore();
        defAnimFrame = requestAnimationFrame(updateDefenseLoop);
      }`;

if (content.includes(oldDefenseFunction)) {
  content = content.replace(oldDefenseFunction, newDefenseFunction);
}

// 10. Update key input in ZType Defense for Power-ups, Bosses, and Laser spawning
const oldDefenseKeyHandling = `        if (defenseTarget) {
          const nextExpected = defenseTarget.text[defenseTarget.typed];
          if (ch === nextExpected) {
            defenseTarget.typed++;
            playMechanicalSound(false);
            if (defenseTarget.typed >= defenseTarget.text.length) {
              // Destroyed enemy
              defenseScore += 100 * defenseWave;
              document.getElementById('defenseScore').textContent = defenseScore;
              spawnSparks(defenseTarget.x, defenseTarget.y, true);
              const idx = defenseEnemies.indexOf(defenseTarget);
              if (idx !== -1) defenseEnemies.splice(idx, 1);
              defenseTarget = null;

              if (defenseEnemies.length === 0) {
                defenseWave++;
                document.getElementById('defenseWave').textContent = defenseWave;
              }
            }
          } else {
            playMechanicalSound(true);
          }
          return;
        }`;

const newDefenseKeyHandling = `        // If Boss Cruiser is active
        if (bossEnemy) {
          const phrase = bossEnemy.phrases[bossEnemy.phraseIdx];
          if (ch === phrase[bossEnemy.typed]) {
            bossEnemy.typed++;
            playMechanicalSound(false);
            activeLaserBolts.push({ x: defenseCanvas.width / 2, y: defenseCanvas.height - 25, targetX: bossEnemy.x, targetY: bossEnemy.y, progress: 0 });
            if (bossEnemy.typed >= phrase.length) {
              bossEnemy.hp--;
              bossEnemy.phraseIdx++;
              bossEnemy.typed = 0;
              screenShake = 10;
              spawnSparks(bossEnemy.x, bossEnemy.y, true);
              if (bossEnemy.hp <= 0) {
                defenseScore += 500 * defenseWave;
                document.getElementById('defenseScore').textContent = defenseScore;
                screenShake = 18;
                spawnSparks(bossEnemy.x, bossEnemy.y, true);
                spawnSparks(bossEnemy.x - 30, bossEnemy.y, true);
                spawnSparks(bossEnemy.x + 30, bossEnemy.y, true);
                bossEnemy = null;
                defenseWave++;
                document.getElementById('defenseWave').textContent = defenseWave;
              }
            }
          } else {
            playMechanicalSound(true);
          }
          return;
        }

        if (defenseTarget) {
          const nextExpected = defenseTarget.text[defenseTarget.typed];
          if (ch === nextExpected) {
            defenseTarget.typed++;
            playMechanicalSound(false);
            activeLaserBolts.push({ x: defenseCanvas.width / 2, y: defenseCanvas.height - 25, targetX: defenseTarget.x, targetY: defenseTarget.y, progress: 0 });
            if (defenseTarget.typed >= defenseTarget.text.length) {
              // Destroyed enemy / Check Power-Up
              if (defenseTarget.isPowerUp) {
                if (defenseTarget.text === 'EMP') {
                  defenseEnemies = [];
                  screenShake = 14;
                  spawnSparks(defenseCanvas.width / 2, defenseCanvas.height / 2, true);
                } else if (defenseTarget.text === 'SHIELD') {
                  defenseShield = Math.min(100, defenseShield + 35);
                  document.getElementById('defenseShieldPercent').textContent = defenseShield + '%';
                  document.getElementById('shieldBar').style.width = defenseShield + '%';
                } else if (defenseTarget.text === 'FREEZE') {
                  freezeTimer = 360;
                }
              }
              defenseScore += 100 * defenseWave;
              document.getElementById('defenseScore').textContent = defenseScore;
              screenShake = 6;
              spawnSparks(defenseTarget.x, defenseTarget.y, true);
              const idx = defenseEnemies.indexOf(defenseTarget);
              if (idx !== -1) defenseEnemies.splice(idx, 1);
              defenseTarget = null;

              if (defenseEnemies.length === 0) {
                defenseWave++;
                document.getElementById('defenseWave').textContent = defenseWave;
              }
            }
          } else {
            playMechanicalSound(true);
          }
          return;
        }`;

if (content.includes(oldDefenseKeyHandling)) {
  content = content.replace(oldDefenseKeyHandling, newDefenseKeyHandling);
}

// 11. Add Nitro charging in handleTypingChar
const streakTarget = `streak++;
        if (streak > peakStreak) peakStreak = streak;`;
const streakWithNitro = `streak++;
        if (streak > peakStreak) peakStreak = streak;
        // Nitro charging
        if (streak % 3 === 0 && nitroGauge < 100) {
          nitroGauge = Math.min(100, nitroGauge + 5);
          updateNitroUI();
        }`;
if (!content.includes('// Nitro charging') && content.includes(streakTarget)) {
  content = content.replace(streakTarget, streakWithNitro);
}

// 12. Add Nitro Overdrive function & UI updates
const nitroCode = `      function updateNitroUI() {
        const fill = document.getElementById('nitroFill');
        const text = document.getElementById('nitroPctText');
        const btn = document.getElementById('nitroBtn');
        if (fill) fill.style.width = nitroGauge + '%';
        if (text) text.textContent = nitroGauge + '%';
        if (btn) {
          if (nitroGauge >= 25) {
            btn.removeAttribute('disabled');
            btn.classList.add('ready');
          } else {
            btn.setAttribute('disabled', 'true');
            btn.classList.remove('ready');
          }
        }
      }

      function triggerNitro() {
        if (nitroGauge < 25 || isNitroActive) return;
        isNitroActive = true;
        nitroGauge = Math.max(0, nitroGauge - 40);
        updateNitroUI();
        if (audioCtx) {
          try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
          } catch(e){}
        }
        setTimeout(() => {
          isNitroActive = false;
        }, 3500);
      }

      function toggleLiteHeatmap() {
        isLiteHeatmapOn = !isLiteHeatmapOn;
        const btn = document.getElementById('liteHeatmapText');
        if (btn) btn.textContent = 'Heatmap: ' + (isLiteHeatmapOn ? 'ON' : 'OFF');
        const kb = document.getElementById('virtualKeyboard');
        if (kb) kb.classList.toggle('heatmap-active', isLiteHeatmapOn);
        if (isLiteHeatmapOn) renderLiteHeatmap();
      }

      function recordLiteKey(ch, isErr) {
        if (!ch) return;
        const c = ch.toLowerCase();
        liteKeyHits[c] = (liteKeyHits[c] || 0) + 1;
        if (isErr) liteKeyErrors[c] = (liteKeyErrors[c] || 0) + 1;
        if (isLiteHeatmapOn) renderLiteHeatmap();
      }

      function renderLiteHeatmap() {
        document.querySelectorAll('#virtualKeyboard .key').forEach(k => {
          const ch = (k.dataset.key || '').toLowerCase();
          k.classList.remove('heat-fast', 'heat-mid', 'heat-error');
          if (!ch || !liteKeyHits[ch]) return;
          const errs = liteKeyErrors[ch] || 0;
          if (errs / liteKeyHits[ch] > 0.15) {
            k.classList.add('heat-error');
          } else if (liteKeyHits[ch] > 4) {
            k.classList.add('heat-fast');
          } else {
            k.classList.add('heat-mid');
          }
        });
      }

      function handleWordBackspace() {
        if (charIndex <= 0 || activeEngine === 'defense') return;
        let idx = charIndex - 1;
        while (idx > 0 && targetText[idx] === ' ') idx--;
        while (idx > 0 && targetText[idx] !== ' ') idx--;
        charIndex = idx;
        renderTextTrack();
        updateCaret();
      }
`;

const insertNitroTarget = `      // Virtual Radar Keyboard`;
if (!content.includes('function triggerNitro') && content.includes(insertNitroTarget)) {
  content = content.replace(insertNitroTarget, nitroCode + '\n' + insertNitroTarget);
}

// 13. Fix Input & Control Listeners: Tab + Enter reset, Ctrl + Backspace, Shift for Nitro
const oldKeydownListener = `      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          resetEngine();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          resetEngine();
          return;
        }
        const t = e.target;
        if (t && t.id !== 'hiddenInput' && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
          return;
        }

        if (e.key === 'Backspace') {
          e.preventDefault();
          handleBackKey();
          return;
        }`;

const newKeydownListener = `      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          resetEngine();
          return;
        }
        // Tab + Enter restart guard (prevents single-tab accidental restarts)
        if (e.key === 'Tab') {
          e.preventDefault();
          tabArmedTime = Date.now() + 1600;
          const hint = document.querySelector('.restart-hint');
          if (hint) {
            hint.classList.add('tab-armed');
            setTimeout(() => { if (Date.now() >= tabArmedTime) hint.classList.remove('tab-armed'); }, 1600);
          }
          return;
        }
        if (e.key === 'Enter' && Date.now() < tabArmedTime) {
          e.preventDefault();
          tabArmedTime = 0;
          resetEngine();
          return;
        }

        // Shift trigger for Nitro
        if (e.key === 'Shift') {
          triggerNitro();
        }

        const t = e.target;
        if (t && t.id !== 'hiddenInput' && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
          return;
        }

        // Ctrl + Backspace whole-word deletion
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            handleWordBackspace();
          } else {
            handleBackKey();
          }
          return;
        }`;

if (content.includes(oldKeydownListener)) {
  content = content.replace(oldKeydownListener, newKeydownListener);
}

// 14. In handleTypingChar and timer loop: advance ghost rivals and scale player with Nitro
const timerLoopTarget = `ghostProgress = Math.min(1, elapsedMin / (totalTargetWords / ghostWpm));`;
const newGhostLoop = `ghostProgress = Math.min(1, elapsedMin / (totalTargetWords / ghostWpm));
          GHOST_RIVALS.forEach(r => {
            r.progress = Math.min(1, elapsedMin / (totalTargetWords / r.wpm));
          });`;
if (!content.includes('GHOST_RIVALS.forEach') && content.includes(timerLoopTarget)) {
  content = content.replace(timerLoopTarget, newGhostLoop);
}

// 15. Player progress with nitro boost
const playerProgTarget = `playerProgress = charIndex / targetText.length;`;
const playerProgWithNitro = `playerProgress = Math.min(1, (charIndex / targetText.length) * (isNitroActive ? 1.25 : 1));`;
if (!content.includes('(isNitroActive ? 1.25 : 1)') && content.includes(playerProgTarget)) {
  content = content.replace(playerProgTarget, playerProgWithNitro);
}

// 16. Record key for heatmap
const recordKeyTarget = `totalKeys++;`;
const recordKeyWithHeatmap = `totalKeys++;
        recordLiteKey(char, false);`;
if (!content.includes('recordLiteKey(char, false);') && content.includes(recordKeyTarget)) {
  content = content.replace(recordKeyTarget, recordKeyWithHeatmap);
}

// 17. High-DPI canvas initialization
const canvasInitTarget = `drawRacerTrack();`;
const canvasInitWithResize = `// High-DPI Canvas Scaling
      function scaleCanvasesDPR() {
        const dpr = window.devicePixelRatio || 1;
        [racerCanvas, defenseCanvas].forEach(cv => {
          if (!cv) return;
          const rect = cv.getBoundingClientRect();
          if (rect.width > 0) {
            cv.width = rect.width * dpr;
            cv.height = (cv.id === 'racerCanvas' ? 200 : 380) * dpr;
            const ctx = cv.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);
          }
        });
      }
      window.addEventListener('resize', scaleCanvasesDPR);
      scaleCanvasesDPR();
      drawRacerTrack();`;
if (!content.includes('scaleCanvasesDPR();') && content.includes(canvasInitTarget)) {
  content = content.replace(canvasInitTarget, canvasInitWithResize);
}

// Write to file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully upgraded ati-lite.html!');
