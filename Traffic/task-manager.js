/**
 * TaskManager & Telemetry Flag Engine
 * Inspired by TryHackMe & Codecademy pedagogy.
 * Breaks 3D levels into real-time micro-tasks, evaluates driving telemetry,
 * awards Cyber-Flags, and renders real-time violation correction cards.
 */

;(function () {
  'use strict'

  // ─── INDIAN MOTOR VEHICLES ACT LAW & CORRECTION DATABASE ───
  const VIOLATION_DATABASE = {
    RED_LIGHT_VIOLATION: {
      title: 'Red Light Violation',
      icon: '🚦',
      section: 'MVA Section 184 (Dangerous Driving)',
      fine: '₹1,000 – ₹5,000',
      penaltyPoints: 2,
      tip: 'Start decelerating 20m before the stop line as soon as the signal turns amber. Never accelerate to beat a changing light.'
    },
    NO_HONKING: {
      title: 'Silence Zone Honking',
      icon: '🔇',
      section: 'MVA Section 194E (Silence Zone Violation)',
      fine: '₹1,000',
      penaltyPoints: 1,
      tip: 'Honking is strictly prohibited near hospitals, schools, courts, and designated residential silence zones. Use gentle headlights if needed.'
    },
    MOBILE_USE: {
      title: 'Mobile Phone Distraction',
      icon: '📱',
      section: 'MVA Section 184(c) (Handheld Device Use)',
      fine: '₹1,500 – ₹5,000',
      penaltyPoints: 3,
      tip: 'Using a phone slows braking reaction times by over 40%. Pull over to a legal parking spot before taking urgent calls.'
    },
    SAFETY_VIOLATION: {
      title: 'Safety Gear Omission',
      icon: '🪖',
      section: 'MVA Section 129 / 194D (Helmet & Seatbelt Rules)',
      fine: '₹1,000 + 3-month license suspension',
      penaltyPoints: 2,
      tip: 'Always fasten your seatbelt and wear ISI-marked helmets before starting the vehicle ignition.'
    },
    NO_INDICATOR: {
      title: 'Failure to Signal',
      icon: '💡',
      section: 'MVA Section 177 (General Traffic Rules)',
      fine: '₹500',
      penaltyPoints: 1,
      tip: 'Signal at least 30m prior to turning or merging lanes to give surrounding motorists adequate time to react.'
    },
    SPEED_VIOLATION: {
      title: 'Overspeeding',
      icon: '⚡',
      section: 'MVA Section 183 (Speed Violation)',
      fine: '₹1,000 – ₹2,000',
      penaltyPoints: 2,
      tip: 'Observe posted city speed limits (usually 40–50 km/h in urban Mumbai). Stopping distance increases with the square of speed.'
    },
    LITTER_HIT: {
      title: 'Road Hazard Collision',
      icon: '🚯',
      section: 'MVA Section 184 / Municipal Solid Waste Rules',
      fine: '₹500',
      penaltyPoints: 1,
      tip: 'Driving over road debris damages tire sidewalls and can cause sudden loss of steering traction. Scan ahead 50m.'
    },
    CHECKPOINT_EVASION: {
      title: 'Evading Police Checkpoint',
      icon: '👮',
      section: 'MVA Section 179 (Disobedience of Lawful Orders)',
      fine: '₹2,000 + Possible Arrest',
      penaltyPoints: 4,
      tip: 'Always slow down, bring vehicle to a complete halt, and comply respectfully with traffic police officers at barricades.'
    },
    WRONG_SIDE: {
      title: 'Wrong-Way Driving',
      icon: '⛔',
      section: 'MVA Section 184 (Endangering Public Safety)',
      fine: '₹5,000',
      penaltyPoints: 3,
      tip: 'Never enter a one-way street against the flow of traffic. Drive around the block to find the legal entrance.'
    },
    PEDESTRIAN_HAZARD: {
      title: 'Pedestrian Near-Miss',
      icon: '🚶',
      section: 'MVA Section 177 / Zebra Crossing Priority',
      fine: '₹1,000',
      penaltyPoints: 2,
      tip: 'Pedestrians have absolute right of way on zebra crossings. Come to a complete stop when pedestrians are crossing.'
    }
  }

  // ─── TASK GENERATOR: 3–5 MICRO-TASKS PER LEVEL ───
  class TaskManager {
    constructor(game) {
      this.game = game
      this.tasks = []
      this.currentTaskIndex = 0
      this.flagsUnlocked = []
      this.unlockedHints = 0
      this.taskStartTime = Date.now()
      this.lastDepartureCheck = false
      this.laneComplianceFrames = 0
      this.speedComplianceFrames = 0
      const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 950 || window.innerHeight <= 500 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0))
      this.drawerOpen = !isMobile
      this.containerEl = null
      this._initialized = false
    }

    init(levelConfig) {
      this.levelConfig = levelConfig || {}
      this.tasks = this._buildTasksForLevel(this.levelConfig)
      this.currentTaskIndex = 0
      this.flagsUnlocked = []
      this.unlockedHints = 0
      this.taskStartTime = Date.now()
      this.laneComplianceFrames = 0
      this.speedComplianceFrames = 0
      this.lastDepartureCheck = false
      const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 950 || window.innerHeight <= 500 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0))
      this.drawerOpen = !isMobile
      this._injectStyles()
      this._renderHUDDrawer()
      this._initialized = true
    }

    _buildTasksForLevel(cfg) {
      const lvId = cfg.id || 1
      const theme = cfg.themeType || 'traffic_safety'
      const tasks = []

      // Task 1: Garage Departure & Pre-Drive Check
      tasks.push({
        id: 'departure',
        title: 'Safe Workshop Departure',
        desc: 'Exit the auto garage onto the road without colliding with side walls.',
        flag: `FLAG{DEPARTURE_L${lvId}_CLEAN}`,
        xp: 25,
        completed: false,
        verify: (g) => {
          if (!g.car) return false
          const p = g.car.position
          // Left the garage spawn box and reached road surface
          const distFromStart = Math.hypot(p.x - (g._startX || 0), p.z - (g._startZ || 0))
          return distFromStart > 12 && (typeof g.isOnRoad === 'function' ? g.isOnRoad() : true)
        }
      })

      // Task 2: Core Lesson Skill based on theme
      if (theme.includes('signal')) {
        tasks.push({
          id: 'signal_wait',
          title: 'Signal Discipline Check',
          desc: 'Stop completely before the intersection stop line when the signal is red.',
          flag: 'FLAG{PERFECT_SIGNAL_STOP}',
          xp: 50,
          completed: false,
          verify: (g) => {
            return (g.spd || 0) < 0.5 && !g.violationsLog?.includes('RED_LIGHT_VIOLATION')
          }
        })
      } else if (theme.includes('ambulance') || theme.includes('emergency')) {
        tasks.push({
          id: 'yield_emergency',
          title: 'Emergency Vehicle Yield',
          desc: 'Move to the side lane and yield immediate right-of-way to sirens.',
          flag: 'FLAG{AMBULANCE_HERO_5S}',
          xp: 50,
          completed: false,
          verify: (g) => {
            return g.ambulanceYielded === true || ((g.curSpeed || 0) < 15 && Math.abs(g.car?.position.x || 0) > 4)
          }
        })
      } else if (theme.includes('silence') || theme.includes('hospital')) {
        tasks.push({
          id: 'silence_zone',
          title: 'Zero-Honk Silence Zone',
          desc: 'Navigate the sensitive hospital perimeter without sounding your horn once.',
          flag: 'FLAG{SILENCE_ZONE_CHAMPION}',
          xp: 50,
          completed: false,
          verify: (g) => {
            return !g.violationsLog?.includes('NO_HONKING') && (g.progressDist || 0) > 30
          }
        })
      } else if (theme.includes('parking')) {
        tasks.push({
          id: 'parallel_park',
          title: 'Legal Bay Alignment',
          desc: 'Align your vehicle parallel within designated curb boundaries.',
          flag: 'FLAG{PARKING_MASTERY_BAY}',
          xp: 50,
          completed: false,
          verify: (g) => {
            return g.parkedCorrectly === true || ((g.spd || 0) < 0.2 && Math.abs(g.car?.position.x || 0) > 5)
          }
        })
      } else {
        tasks.push({
          id: 'lane_discipline',
          title: 'Lane Centering Compliance',
          desc: 'Maintain continuous lane alignment for at least 3 seconds without swerving.',
          flag: 'FLAG{LANE_DISCIPLINE_MASTER}',
          xp: 50,
          completed: false,
          verify: (g) => {
            if ((g.spd || 0) > 2) {
              this.laneComplianceFrames++
              return this.laneComplianceFrames > 90
            }
            return false
          }
        })
      }

      // Task 3: Speed & Hazard Control
      tasks.push({
        id: 'speed_control',
        title: 'Speed Limit Adherence',
        desc: 'Keep vehicle speed under 50 km/h and avoid harsh sudden deceleration.',
        flag: 'FLAG{SMOOTH_CRUISER_SAFE}',
        xp: 35,
        completed: false,
        verify: (g) => {
          const spdKmh = (g.spd || 0) * 3.6
          if (spdKmh > 5 && spdKmh <= 55) {
            this.speedComplianceFrames++
            return this.speedComplianceFrames > 90
          }
          return false
        }
      })

      // Task 4: Clean Sector Telemetry Flag
      tasks.push({
        id: 'clean_finish',
        title: 'Zero Violation Capstone',
        desc: 'Reach the checkpoint destination with zero traffic violation penalties.',
        flag: `FLAG{L${lvId}_FLAWLESS_EXECUTION}`,
        xp: 75,
        completed: false,
        verify: (g) => {
          return g.reachedGoal === true && (g.vio === 0 || (!g.violationsLog || g.violationsLog.length === 0))
        }
      })

      return tasks
    }

    update(dt) {
      if (!this._initialized || !this.game || !this.game.playing) return

      for (let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i]
        if (!task.completed) {
          try {
            if (task.verify(this.game)) {
              this._completeTask(i)
            }
          } catch (e) {}
        }
      }
    }

    _completeTask(index) {
      const task = this.tasks[index]
      if (!task || task.completed) return

      task.completed = true
      this.flagsUnlocked.push(task.flag)

      if (typeof S !== 'undefined') {
        S.total = (S.total || 0) + (task.xp || 25)
        if (typeof save === 'function') save()
      }

      if (window.sfx && typeof window.sfx.play === 'function') {
        window.sfx.play('ok')
      }

      this._showFlagToast(task)
      this._updateHUDDrawer()
    }

    _showFlagToast(task) {
      const toast = document.createElement('div')
      toast.className = 'cyber-flag-toast'
      toast.innerHTML = `
        <div class="cft-icon">🚩</div>
        <div class="cft-body">
          <div class="cft-tag">TELEMETRY FLAG CAPTURED (+${task.xp} XP)</div>
          <div class="cft-flag">${task.flag}</div>
          <div class="cft-desc">${task.title} Complete</div>
        </div>
      `
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.classList.add('cft-out')
        setTimeout(() => {
          if (toast && typeof toast.remove === 'function') toast.remove()
          else if (toast && toast.parentNode) toast.parentNode.removeChild(toast)
        }, 400)
      }, 3500)
    }

    showViolationCard(violationType) {
      const info = VIOLATION_DATABASE[violationType] || {
        title: 'Traffic Rule Violation',
        icon: '⚠️',
        section: 'Motor Vehicles Act (General Traffic Rules)',
        fine: '₹500 – ₹1,000',
        penaltyPoints: 1,
        tip: 'Always observe standard road markings, maintain safe following distance, and scan mirrors frequently.'
      }

      const oldCard = document.getElementById('sz-violation-card')
      if (oldCard) oldCard.remove()

      const card = document.createElement('div')
      card.id = 'sz-violation-card'
      card.className = 'violation-feedback-card'
      card.innerHTML = `
        <div class="vfc-header">
          <div class="vfc-icon">${info.icon}</div>
          <div class="vfc-title-wrap">
            <div class="vfc-type">TRAFFIC VIOLATION DETECTED</div>
            <div class="vfc-title">${info.title}</div>
          </div>
          <button class="vfc-close" onclick="this.closest('#sz-violation-card').remove()">✕</button>
        </div>
        <div class="vfc-details">
          <div class="vfc-row">
            <span class="vfc-lbl">Law Reference:</span>
            <span class="vfc-val">${info.section}</span>
          </div>
          <div class="vfc-row">
            <span class="vfc-lbl">Statutory Fine:</span>
            <span class="vfc-val vfc-fine">${info.fine}</span>
          </div>
          <div class="vfc-tip-box">
            <span class="vfc-tip-icon">💡</span>
            <span class="vfc-tip-txt">${info.tip}</span>
          </div>
        </div>
        <div class="vfc-footer">
          <button class="vfc-ack-btn" onclick="this.closest('#sz-violation-card').remove()">Got It ✓</button>
        </div>
      `
      document.body.appendChild(card)

      setTimeout(() => {
        if (card.parentNode) {
          card.classList.add('vfc-fade-out')
          setTimeout(() => {
            if (card && typeof card.remove === 'function') card.remove()
            else if (card && card.parentNode) card.parentNode.removeChild(card)
          }, 400)
        }
      }, 6000)
    }

    _renderHUDDrawer() {
      let drawer = document.getElementById('sz-task-drawer')
      if (!drawer) {
        drawer = document.createElement('div')
        drawer.id = 'sz-task-drawer'
        drawer.className = 'task-hud-drawer'
        const trStack = document.getElementById('top-right-hud-stack')
        const csb = document.getElementById('challan-summary-box')
        if (trStack) {
          if (csb && csb.parentNode === trStack) trStack.insertBefore(drawer, csb)
          else trStack.appendChild(drawer)
        } else {
          document.body.appendChild(drawer)
        }
      }
      this.containerEl = drawer

      // Hide legacy overlay and redundant objective card to prevent overlapping
      const objOverlay = document.getElementById('objective-overlay')
      if (objOverlay) {
        objOverlay.style.setProperty('display', 'none', 'important')
        objOverlay.classList.remove('on')
      }
      const legacyTracker = document.getElementById('task-tracker')
      if (legacyTracker) {
        legacyTracker.style.setProperty('display', 'none', 'important')
        legacyTracker.classList.remove('on')
      }

      this._updateHUDDrawer()
    }

    _updateHUDDrawer() {
      if (!this.containerEl) return

      const completedCount = this.tasks.filter((t) => t.completed).length
      const totalCount = this.tasks.length
      const pct = Math.round((completedCount / Math.max(1, totalCount)) * 100)

      let tasksHtml = this.tasks
        .map((t, idx) => {
          const isDone = t.completed
          const isCurrent = !isDone && (idx === 0 || this.tasks[idx - 1].completed)
          const stateClass = isDone ? 'task-done' : isCurrent ? 'task-current' : 'task-pending'
          const stateIcon = isDone ? '✅' : isCurrent ? '▶️' : '🔒'

          return `
          <div class="task-row ${stateClass}">
            <span class="task-icon">${stateIcon}</span>
            <div class="task-info">
              <div class="task-name">${t.title}</div>
              <div class="task-desc">${t.desc}</div>
            </div>
            <span class="task-xp">+${t.xp} XP</span>
          </div>
        `
        })
        .join('')

      this.containerEl.innerHTML = `
        <div class="task-drawer-header" onclick="window.game?.taskManager?.toggleDrawer()">
          <div class="tdh-left">
            <span class="tdh-icon">📋</span>
            <span class="tdh-title">OBJECTIVES (${completedCount}/${totalCount})</span>
          </div>
          <div class="tdh-right">
            <span class="tdh-pct">${pct}%</span>
            <span class="tdh-chevron">${this.drawerOpen ? '▼' : '▲'}</span>
          </div>
        </div>
        <div class="task-drawer-body ${this.drawerOpen ? 'open' : 'closed'}">
          ${tasksHtml}
        </div>
      `
    }

    toggleDrawer() {
      this.drawerOpen = !this.drawerOpen
      this._updateHUDDrawer()
    }

    _injectStyles() {
      if (document.getElementById('task-manager-styles')) return

      const style = document.createElement('style')
      style.id = 'task-manager-styles'
      style.textContent = `
        /* ── Task HUD Drawer ── */
        .task-hud-drawer {
          position: relative;
          top: auto;
          right: auto;
          width: 100%;
          max-width: 100%;
          background: #0d131f;
          border: 1.5px solid #26354a;
          border-radius: 12px;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          z-index: 45;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
          font-family: var(--sans, 'Inter'), sans-serif;
          overflow: hidden;
          box-sizing: border-box;
          pointer-events: auto;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .task-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          user-select: none;
        }
        .tdh-left { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.05em; color: var(--text, #e8e3d8); }
        .tdh-right { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #5ed4f5; }
        .task-drawer-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px;
          max-height: 280px;
          overflow-y: auto;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        .task-drawer-body.closed {
          max-height: 0;
          padding-top: 0;
          padding-bottom: 0;
          opacity: 0;
          pointer-events: none;
        }
        .task-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.2s ease;
        }
        .task-row.task-done {
          background: rgba(52, 211, 153, 0.08);
          border-color: rgba(52, 211, 153, 0.25);
        }
        .task-row.task-current {
          background: rgba(94, 212, 245, 0.08);
          border-color: rgba(94, 212, 245, 0.3);
          box-shadow: 0 0 12px rgba(94, 212, 245, 0.15);
        }
        .task-row.task-pending {
          opacity: 0.5;
        }
        .task-icon { font-size: 1rem; flex-shrink: 0; }
        .task-info { flex: 1; min-width: 0; }
        .task-name { font-size: 0.78rem; font-weight: 700; color: var(--text, #e8e3d8); }
        .task-row.task-done .task-name { text-decoration: line-through; opacity: 0.75; }
        .task-desc { font-size: 0.68rem; color: var(--muted, #8891aa); margin-top: 2px; line-height: 1.3; }
        .task-xp { font-size: 0.68rem; font-weight: 800; color: #ffd54a; flex-shrink: 0; }

        /* ── Cyber Flag Toast ── */
        .cyber-flag-toast {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(0);
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(7, 10, 20, 0.95));
          border: 2px solid #00f0cc;
          border-radius: 16px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          z-index: 10002;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(0, 240, 204, 0.35);
          animation: flagPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          font-family: var(--sans, 'Inter'), sans-serif;
        }
        .cyber-flag-toast.cft-out {
          animation: flagPopOut 0.3s ease-in forwards;
        }
        @keyframes flagPopIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes flagPopOut {
          to { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.9); }
        }
        .cft-icon { font-size: 2rem; }
        .cft-tag { font-size: 0.68rem; font-weight: 800; color: #00f0cc; letter-spacing: 0.08em; text-transform: uppercase; }
        .cft-flag { font-family: 'Space Mono', monospace; font-size: 0.88rem; font-weight: 700; color: #ffd54a; margin: 2px 0; }
        .cft-desc { font-size: 0.72rem; color: var(--muted, #8891aa); }

        /* ── Violation Feedback Card ── */
        .violation-feedback-card {
          position: fixed;
          bottom: 24px;
          right: 24px;
          max-width: 360px;
          width: calc(100vw - 48px);
          background: rgba(17, 24, 39, 0.95);
          border: 1.5px solid rgba(239, 68, 68, 0.5);
          border-radius: 18px;
          padding: 16px 18px;
          z-index: 10001;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(239, 68, 68, 0.2);
          animation: vfcSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
          font-family: var(--sans, 'Inter'), sans-serif;
        }
        .violation-feedback-card.vfc-fade-out {
          animation: vfcSlideOut 0.3s ease-in forwards;
        }
        @keyframes vfcSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes vfcSlideOut {
          to { opacity: 0; transform: translateX(40px); }
        }
        .vfc-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .vfc-icon { font-size: 1.6rem; }
        .vfc-title-wrap { flex: 1; min-width: 0; }
        .vfc-type { font-size: 0.65rem; font-weight: 800; color: #ef4444; letter-spacing: 0.08em; text-transform: uppercase; }
        .vfc-title { font-size: 0.95rem; font-weight: 700; color: #fff; margin-top: 1px; }
        .vfc-close { background: none; border: none; color: #8891aa; font-size: 1.1rem; cursor: pointer; padding: 4px; }
        .vfc-details { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; }
        .vfc-row { display: flex; justify-content: space-between; gap: 8px; }
        .vfc-lbl { color: #8891aa; }
        .vfc-val { color: #e8e3d8; font-weight: 600; text-align: right; }
        .vfc-fine { color: #ffd54a; font-weight: 700; }
        .vfc-tip-box {
          display: flex;
          gap: 8px;
          background: rgba(94, 212, 245, 0.08);
          border: 1px solid rgba(94, 212, 245, 0.2);
          border-radius: 10px;
          padding: 8px 10px;
          margin-top: 6px;
        }
        .vfc-tip-icon { font-size: 1rem; flex-shrink: 0; }
        .vfc-tip-txt { font-size: 0.72rem; color: #e8e3d8; line-height: 1.4; }
        .vfc-footer { margin-top: 12px; display: flex; justify-content: flex-end; }
        .vfc-ack-btn {
          background: #ef4444;
          color: #fff;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 6px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .vfc-ack-btn:hover { background: #dc2626; }

        @media (max-width: 768px) {
          .task-hud-drawer {
            top: calc(env(safe-area-inset-top, 0px) + 54px);
            right: 8px;
            width: 240px;
            max-width: calc(100vw - 16px);
            border-radius: 12px;
          }
          .task-drawer-header {
            padding: 6px 10px;
          }
          .tdh-left { font-size: 0.68rem; gap: 6px; }
          .tdh-right { font-size: 0.68rem; gap: 6px; }
          .task-drawer-body {
            padding: 6px 8px;
            gap: 4px;
            max-height: 200px;
          }
          .task-row {
            padding: 5px 6px;
            border-radius: 8px;
            gap: 6px;
          }
          .task-name { font-size: 0.72rem; }
          .task-desc { font-size: 0.62rem; }
          .task-xp { font-size: 0.62rem; padding: 2px 5px; }
          .violation-feedback-card { bottom: 16px; right: 16px; left: 16px; width: auto; }
        }
      `
      document.head.appendChild(style)
    }
  }

  window.TaskManager = TaskManager
  window.VIOLATION_DATABASE = VIOLATION_DATABASE
})()
