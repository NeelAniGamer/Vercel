/**
 * ============================================================================
 * IN-CAR AI DRIVING CO-PILOT & SYLLABUS EVALUATOR (traffic-ai-copilot.js)
 * ============================================================================
 * 
 * Real-time intelligent driving companion and hazard detection assistant:
 * - Telemetry scanner: Time-To-Collision (TTC), speed governor compliance,
 *   traffic signal states, zebra crossing pedestrian tracking, emergency vehicles.
 * - Syllabus Demands Evaluator: Dynamically marks level curriculum tasks done
 *   as player satisfies real-world road safety behaviors.
 * - Audio & Voice Alerts: Uses Web Speech Synthesis API with polite, clear
 *   voice guidance and HUD subtitle balloons.
 * - Dynamic Driver Safety Index (0-100%): Continuous score computation.
 * - Post-Drive AI Coaching Review card.
 * ============================================================================
 */

(function(window) {
  'use strict';

  class TrafficAICoPilot {
    constructor(game) {
      this.game = game;
      this.active = true;
      this.voiceEnabled = true;
      this.safetyScore = 100;
      this.lastSpokenTime = 0;
      this.speechCooldown = 4000; // ms between voice messages
      this.lastAlertText = '';
      this.hazardStatus = 'clear'; // 'clear' | 'caution' | 'warning' | 'danger'
      this.hazardMessage = 'Scanning roadway...';

      // Telemetry tracking
      this.overspeedTimer = 0;
      this.stoppedAtRedLight = false;
      this.yieldedToPedestrians = false;
      this.yieldedToAmbulance = false;
      this.puddleSplashCount = 0;
      this.honkedInQuietZone = false;

      this.hudElement = null;
      this._initHUD();
    }

    _initHUD() {
      if (typeof document === 'undefined') {return;}
      // Check if existing HUD element exists
      let hud = document.getElementById('ai-copilot-card');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'ai-copilot-card';
        hud.innerHTML = `
          <div class="copilot-header">
            <div class="copilot-avatar">
              <div class="copilot-pulse"></div>
              <span>🤖</span>
            </div>
            <div class="copilot-title-wrap">
              <div class="copilot-name">AI Co-Pilot</div>
              <div class="copilot-sub" id="copilot-sub">SYSTEM ACTIVE</div>
            </div>
            <div class="copilot-score-badge" id="copilot-score">100%</div>
            <button class="copilot-voice-toggle" id="copilot-voice-btn" title="Toggle Voice Guidance">🔊</button>
          </div>
          <div class="copilot-body">
            <div class="copilot-hazard-chip" id="copilot-hazard-chip">
              <span class="hazard-dot" id="copilot-hazard-dot"></span>
              <span class="hazard-text" id="copilot-hazard-text">Roadway Clear</span>
            </div>
            <div class="copilot-speech-bubble" id="copilot-bubble" style="display:none;">
              <span id="copilot-bubble-text">Drive safely and obey traffic rules.</span>
            </div>
          </div>
        `;

        // Inject CSS Styles
        const style = document.createElement('style');
        style.textContent = `
          #ai-copilot-card {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 320px;
            background: rgba(15, 23, 42, 0.82);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1.5px solid rgba(0, 240, 204, 0.35);
            border-radius: 16px;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), inset 0 0 16px rgba(0, 240, 204, 0.08);
            color: #f8fafc;
            font-family: 'Inter', -apple-system, sans-serif;
            z-index: 10001;
            padding: 12px 14px;
            pointer-events: auto;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none;
          }
          #ai-copilot-card.danger {
            border-color: rgba(239, 68, 68, 0.7);
            box-shadow: 0 12px 36px rgba(239, 68, 68, 0.3), inset 0 0 16px rgba(239, 68, 68, 0.15);
          }
          #ai-copilot-card.caution {
            border-color: rgba(245, 158, 11, 0.7);
            box-shadow: 0 12px 36px rgba(245, 158, 11, 0.3);
          }
          .copilot-header {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .copilot-avatar {
            position: relative;
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #00f0cc, #3b82f6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.15rem;
            flex-shrink: 0;
          }
          .copilot-pulse {
            position: absolute;
            inset: -3px;
            border-radius: 50%;
            border: 2px solid #00f0cc;
            opacity: 0.6;
            animation: copilot-pulse 2s infinite;
          }
          @keyframes copilot-pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.18); opacity: 0.2; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
          .copilot-title-wrap {
            flex: 1;
            min-width: 0;
          }
          .copilot-name {
            font-size: 0.88rem;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.3px;
          }
          .copilot-sub {
            font-size: 0.68rem;
            color: #38bdf8;
            font-weight: 600;
            letter-spacing: 0.6px;
          }
          .copilot-score-badge {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.4);
            border-radius: 20px;
            font-size: 0.76rem;
            font-weight: 700;
            padding: 3px 8px;
          }
          .copilot-voice-toggle {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            border-radius: 8px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
          }
          .copilot-voice-toggle:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          .copilot-body {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .copilot-hazard-chip {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 0, 0, 0.35);
            padding: 5px 10px;
            border-radius: 8px;
            font-size: 0.76rem;
            font-weight: 600;
          }
          .hazard-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 6px #10b981;
            flex-shrink: 0;
          }
          .hazard-dot.danger { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
          .hazard-dot.caution { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
          .copilot-speech-bubble {
            background: rgba(2, 132, 199, 0.2);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 0.74rem;
            color: #e0f2fe;
            line-height: 1.35;
          }
          @media (max-width: 768px) {
            #ai-copilot-card {
              bottom: 120px;
              right: 12px;
              width: 280px;
              padding: 10px 12px;
            }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(hud);

        // Voice toggle handler
        const btn = document.getElementById('copilot-voice-btn');
        if (btn) {
          btn.onclick = () => {
            this.voiceEnabled = !this.voiceEnabled;
            btn.textContent = this.voiceEnabled ? '🔊' : '🔇';
            btn.style.opacity = this.voiceEnabled ? '1.0' : '0.5';
            this.speak(this.voiceEnabled ? 'Voice co-pilot enabled.' : 'Voice muted.');
          };
        }
      }
      this.hudElement = hud;
    }

    /**
     * Speak audio alert through Web Speech Synthesis API
     */
    speak(text, priority = false) {
      if (!this.voiceEnabled) {return;}
      const now = Date.now();
      if (!priority && (now - this.lastSpokenTime < this.speechCooldown)) {return;}
      if (text === this.lastAlertText && (now - this.lastSpokenTime < 10000)) {return;}

      this.lastSpokenTime = now;
      this.lastAlertText = text;

      // Update HUD Speech Bubble
      if (typeof document === 'undefined') {return;}
      const bubble = document.getElementById('copilot-bubble');
      const bubbleText = document.getElementById('copilot-bubble-text');
      if (bubble && bubbleText) {
        bubbleText.textContent = text;
        bubble.style.display = 'block';
        clearTimeout(this._bubbleTimer);
        this._bubbleTimer = setTimeout(() => {
          bubble.style.display = 'none';
        }, 5000);
      }

      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel(); // cancel overlapping speech
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          utterance.pitch = 1.0;
          utterance.volume = 0.9;
          window.speechSynthesis.speak(utterance);
        } catch(e) {
          console.warn('[AICoPilot] Speech synthesis error:', e);
        }
      }
    }

    /**
     * Main Per-Frame Telemetry Update & Syllabus Evaluation
     */
    update(dt) {
      if (!this.active || !this.game || !this.game.player) {return;}

      const player = this.game.player;
      const pPos = player.position;
      const currentSpeedKmh = Math.abs(this.game.currentSpeed || 0) * 3.6;
      const cfg = this.game.mapCfg || {};
      const speedLimit = cfg.speedLimit || (cfg.hasSchool ? 25 : 50);

      let currentHazard = 'clear';
      let message = 'Speed & Road Conditions Normal';

      // ────────────────────────────────────────────────────────────────────────
      // 1. SPEED LIMIT EVALUATION
      // ────────────────────────────────────────────────────────────────────────
      if (currentSpeedKmh > (speedLimit + 5)) {
        this.overspeedTimer += dt;
        currentHazard = 'caution';
        message = `⚠️ Overspeeding (${Math.round(currentSpeedKmh)} km/h)! Limit is ${speedLimit} km/h`;
        if (this.overspeedTimer > 2.0) {
          this.safetyScore = Math.max(20, this.safetyScore - 0.2);
          this.speak(`Reduce speed. Speed limit is ${speedLimit} kilometers per hour.`);
        }
      } else {
        this.overspeedTimer = Math.max(0, this.overspeedTimer - dt);
      }

      // ────────────────────────────────────────────────────────────────────────
      // 2. TRAFFIC SIGNALS & RED LIGHT EVALUATION
      // ────────────────────────────────────────────────────────────────────────
      if (this.game.sigs && this.game.sigs.length > 0) {
        for (const sig of this.game.sigs) {
          const sigDist = Math.hypot(sig.position.x - pPos.x, sig.position.z - pPos.z);
          if (sigDist < 45.0) {
            const isRed = (sig.userData && sig.userData.state === 'red');
            const isAmb = (sig.userData && sig.userData.state === 'amber');
            
            if (isRed) {
              if (sigDist < 25.0) {
                currentHazard = 'danger';
                message = `🛑 RED LIGHT AHEAD (${Math.round(sigDist)}m)! Halt behind stop line.`;
                if (currentSpeedKmh > 15) {
                  this.speak('Stop immediately. Red signal ahead.', true);
                } else if (currentSpeedKmh < 2) {
                  this.stoppedAtRedLight = true;
                  this._markSyllabusTaskDone('wait_red');
                }
              } else {
                currentHazard = 'caution';
                message = `🚦 Red signal ahead in ${Math.round(sigDist)}m. Prepare to stop.`;
              }
            } else if (isAmb) {
              currentHazard = 'caution';
              message = `🟡 Amber signal. Prepare to stop before white line.`;
            } else if (sig.userData && sig.userData.state === 'green') {
              if (this.stoppedAtRedLight) {
                this._markSyllabusTaskDone('move_green');
              }
            }
          }
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // 3. PEDESTRIAN ZEBRA CROSSING EVALUATION
      // ────────────────────────────────────────────────────────────────────────
      if (this.game.peds && this.game.peds.length > 0) {
        for (const ped of this.game.peds) {
          if (!ped.visible) {continue;}
          const pedDist = Math.hypot(ped.position.x - pPos.x, ped.position.z - pPos.z);
          if (pedDist < 16.0) {
            currentHazard = 'danger';
            message = `🚶 Pedestrian crossing ahead (${Math.round(pedDist)}m)! Yield right-of-way.`;
            if (currentSpeedKmh > 12) {
              this.speak('Pedestrians crossing. Yield right of way!', true);
              this.safetyScore = Math.max(10, this.safetyScore - 0.4);
            } else if (currentSpeedKmh < 3) {
              this.yieldedToPedestrians = true;
              this._markSyllabusTaskDone('let_cross');
            }
          }
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // 4. EMERGENCY VEHICLES EVALUATION
      // ────────────────────────────────────────────────────────────────────────
      if (this.game.scene) {
        const amb = this.game.scene.children.find(c => c.userData?.isEmergency);
        if (amb) {
          const ambDist = Math.hypot(amb.position.x - pPos.x, amb.position.z - pPos.z);
          if (ambDist < 50.0 && amb.position.z > pPos.z) { // behind player
            currentHazard = 'danger';
            message = `🚑 EMERGENCY AMBULANCE BEHIND (${Math.round(ambDist)}m)! Yield to the left!`;
            this.speak('Emergency ambulance approaching behind. Shift to the left lane immediately.', true);
            // Check if player moved to the left lane
            if (pPos.x > 3.0) {
              this.yieldedToAmbulance = true;
              this._markSyllabusTaskDone('yield_ambulance');
            }
          }
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // 5. UPDATE CO-PILOT HUD
      // ────────────────────────────────────────────────────────────────────────
      this.hazardStatus = currentHazard;
      this.hazardMessage = message;
      this._renderHUD();
    }

    _markSyllabusTaskDone(taskId) {
      const taskLists = [
        this.game.tasks,
        this.game.mapCfg && this.game.mapCfg.tasks
      ];

      for (const list of taskLists) {
        if (!list || !Array.isArray(list)) {continue;}
        const task = list.find(t => t.id === taskId || (t.desc && t.desc.toLowerCase().includes(taskId)));
        if (task && !task.done) {
          task.done = true;
          const msg = task.text || task.desc || taskId;
          if (window.toast) {toast(`✅ Syllabus Task Completed: ${msg}`, '#10b981', 4000);}
          this.speak(`Task completed: ${msg}`);
        }
      }
    }

    _renderHUD() {
      const card = this.hudElement;
      if (!card) {return;}

      card.className = (this.hazardStatus === 'danger' ? 'danger' :
                        this.hazardStatus === 'caution' ? 'caution' : '');

      const dot = document.getElementById('copilot-hazard-dot');
      const text = document.getElementById('copilot-hazard-text');
      const score = document.getElementById('copilot-score');

      if (dot) {dot.className = `hazard-dot ${this.hazardStatus}`;}
      if (text) {text.textContent = this.hazardMessage;}
      if (score) {
        score.textContent = `${Math.round(this.safetyScore)}%`;
        score.style.color = (this.safetyScore > 80 ? '#10b981' : this.safetyScore > 50 ? '#f59e0b' : '#ef4444');
      }
    }

    /**
     * Generate Comprehensive Post-Drive AI Coaching Review
     */
    generatePostDriveReport() {
      return {
        score: Math.round(this.safetyScore),
        grade: (this.safetyScore >= 90 ? 'A+ Master Driver' :
                this.safetyScore >= 75 ? 'B Competent Citizen' :
                this.safetyScore >= 55 ? 'C Learner Needed' : 'F Rule Breaker'),
        feedback: (this.safetyScore >= 85
          ? 'Outstanding driving discipline. You respected zebra crossings, maintained legal speeds, and yielded properly.'
          : 'Careful! Pay closer attention to speed governors, zebra crossings, and upcoming traffic signals.'),
        violationsDetected: this.game.violationsLog || []
      };
    }
  }

  // Export globally
  window.TrafficAICoPilot = TrafficAICoPilot;

})(typeof window !== 'undefined' ? window : this);
