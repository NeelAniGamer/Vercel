


window.GameplayRecorder = {
  _events: [],
  _startTime: 0,
  _levelId: null,
  _levelName: '',


  _eventMeta: {

    'NO_HONKING':        { label: 'Honked in silence zone', icon: '📢', category: 'Noise', severity: 'warning', tip: 'Silence zones near schools/hospitals require zero honking. Use hand signals instead.' },
    'MOBILE_USE':        { label: 'Used phone while driving', icon: '📱', category: 'Distraction', severity: 'critical', tip: 'Phone use causes 3,412 accidents/year in Mumbai. Pull over if you must use your phone.' },
    'SAFETY_VIOLATION':  { label: 'No seatbelt/helmet', icon: '⛑️', category: 'Safety', severity: 'critical', tip: '67% of fatalities involve unhelmeted riders. Always buckle up!' },
    'NO_INDICATOR':      { label: 'Turned without indicator', icon: '🔄', category: 'Communication', severity: 'warning', tip: 'Use indicators 30m before turning. Prevents 40% of lane-change accidents.' },
    'RED_LIGHT_VIOLATION': { label: 'Jumped red signal', icon: '🚦', category: 'Signals', severity: 'critical', tip: '12,847 signal-jump challans issued in Mumbai in 2024. Stop completely before the line.' },
    'SPEED_VIOLATION':   { label: 'Exceeded speed limit', icon: '⚡', category: 'Speed', severity: 'warning', tip: 'Over-speeding is the #1 cause of road accidents in India.' },
    'LITTER_HIT':        { label: 'Hit road litter', icon: '🗑️', category: 'Awareness', severity: 'info', tip: 'Road litter can cause skidding or tire damage. Stay alert!' },
    'CHECKPOINT_EVASION': { label: 'Fled police checkpoint', icon: '🚨', category: 'Compliance', severity: 'critical', tip: 'Fleeing a checkpoint is a serious offense. Always stop and cooperate.' },
    'WRONG_SIDE':        { label: 'Driving on wrong side', icon: '↩️', category: 'Lane', severity: 'danger', tip: 'Wrong-side driving causes head-on collisions. Stay in your lane.' },
    'SPLASH':            { label: 'Splashed pedestrian', icon: '💦', category: 'Courtesy', severity: 'warning', tip: 'Slow down near puddles. Splashing pedestrians is fined ₹500.' },
    'ANIMAL_HONK':       { label: 'Honked at animals', icon: '🐄', category: 'Courtesy', severity: 'info', tip: 'Honking scares animals. Slow down and wait for them to cross.' },
    'PEDESTRIAN_HIT':    { label: 'Hit pedestrian', icon: '🚶', category: 'Safety', severity: 'critical', tip: 'Pedestrians have right of way. Always yield at crosswalks.' },

    'COLLISION':         { label: 'Vehicle collision', icon: '💥', category: 'Safety', severity: 'danger', tip: 'Maintain safe following distance. Use brake early.' },
    'BARRICADE_HIT':     { label: 'Hit barricade', icon: '🚧', category: 'Awareness', severity: 'warning', tip: 'Slow down in construction zones. Watch for barriers.' },

    'OFF_ROAD':          { label: 'Went off-road', icon: '🌿', category: 'Control', severity: 'danger', tip: 'Stay on marked roads. Off-road driving damages vehicles and terrain.' },
    'HARD_BRAKE':        { label: 'Emergency braking', icon: '🛑', category: 'Control', severity: 'info', tip: 'Anticipate stops. Smooth braking is safer and saves fuel.' },
    'NEAR_MISS':         { label: 'Near miss with NPC', icon: '⚠️', category: 'Awareness', severity: 'warning', tip: 'Keep safe distance from other vehicles. Watch blind spots.' },

    'SEATBELT_ON':       { label: 'Put on seatbelt', icon: '✅', category: 'Safety', severity: 'info', tip: 'Great! Seatbelts reduce fatality risk by 45%.' },
    'SIGNAL_USED':       { label: 'Used turn signal', icon: '✅', category: 'Communication', severity: 'info', tip: 'Excellent! Using indicators makes you a predictable, safe driver.' },
    'CHECKPOINT_STOP':   { label: 'Stopped at checkpoint', icon: '✅', category: 'Compliance', severity: 'info', tip: 'Perfect! Always stop at police checkpoints.' },
    'YIELDED_PED':       { label: 'Yielded to pedestrian', icon: '✅', category: 'Courtesy', severity: 'info', tip: 'Well done! Yielding to pedestrians saves lives.' },
    'TASK_COMPLETE':     { label: 'Task completed', icon: '🎯', category: 'Mission', severity: 'info', tip: '' },
    'TUTORIAL_SHOWN':    { label: 'Viewed tutorial', icon: '📖', category: 'Learning', severity: 'info', tip: '' },
  },


  categories: {
    'Safety': { icon: '🛡️', color: '#ef4444' },
    'Speed': { icon: '⚡', color: '#f59e0b' },
    'Signals': { icon: '🚦', color: '#3b82f6' },
    'Communication': { icon: '🔄', color: '#8b5cf6' },
    'Distraction': { icon: '📱', color: '#ef4444' },
    'Compliance': { icon: '🚨', color: '#dc2626' },
    'Courtesy': { icon: '🤝', color: '#06b6d4' },
    'Awareness': { icon: '👁️', color: '#f59e0b' },
    'Control': { icon: '🎮', color: '#10b981' },
    'Lane': { icon: '🛤️', color: '#6366f1' },
    'Noise': { icon: '🔊', color: '#84cc16' },
    'Mission': { icon: '🎯', color: '#22c55e' },
    'Learning': { icon: '📖', color: '#a78bfa' },
  },

  start(levelId, levelName) {
    this._events = [];
    this._startTime = performance.now();
    this._levelId = levelId;
    this._levelName = levelName || '';
  },

  record(type, data = {}) {
    const meta = this._eventMeta[type] || { label: type, icon: '📌', category: 'Other', severity: 'info', tip: '' };
    const event = {
      type,
      time: Math.round((performance.now() - this._startTime) / 1000 * 10) / 10,
      label: meta.label,
      icon: meta.icon,
      category: meta.category,
      severity: meta.severity,
      tip: meta.tip,
      data: {
        speed: data.speed || null,
        position: data.position ? { x: Math.round(data.position.x), z: Math.round(data.position.z) } : null,
        score: data.score || null,
        fine: data.fine || null,
        ...data,
      },
    };
    this._events.push(event);
  },

  getEvents() { return this._events; },

  getSummary() {
    const events = this._events;
    const byCategory = {};
    const bySeverity = { info: 0, warning: 0, danger: 0, critical: 0 };
    const mistakes = [];

    events.forEach(ev => {

      if (!byCategory[ev.category]) byCategory[ev.category] = [];
      byCategory[ev.category].push(ev);


      bySeverity[ev.severity] = (bySeverity[ev.severity] || 0) + 1;


      if (ev.severity !== 'info' || ev.type.includes('HIT') || ev.type.includes('VIOLATION') || ev.type.includes('OFF_ROAD') || ev.type === 'COLLISION' || ev.type === 'BARRICADE_HIT' || ev.type === 'NEAR_MISS') {
        mistakes.push(ev);
      }
    });


    const criticalCount = bySeverity.critical || 0;
    const dangerCount = bySeverity.danger || 0;
    const warningCount = bySeverity.warning || 0;
    let grade = 'A+';
    if (criticalCount > 2) grade = 'D';
    else if (criticalCount > 0) grade = 'C';
    else if (dangerCount > 2) grade = 'C+';
    else if (dangerCount > 0 || warningCount > 3) grade = 'B';
    else if (warningCount > 0) grade = 'B+';

    return {
      totalEvents: events.length,
      mistakes: mistakes.length,
      byCategory,
      bySeverity,
      grade,
      levelId: this._levelId,
      levelName: this._levelName,
      duration: events.length > 0 ? events[events.length - 1].time : 0,
    };
  },

  getTimeline() {

    return this._events.map(ev => ({
      time: ev.time,
      timeFormatted: this._formatTime(ev.time),
      icon: ev.icon,
      label: ev.label,
      severity: ev.severity,
      color: ev.severity === 'critical' ? '#ef4444' : ev.severity === 'danger' ? '#f97316' : ev.severity === 'warning' ? '#f59e0b' : ev.type.startsWith('TASK') ? '#22c55e' : '#64748b',
    }));
  },

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  },


  showReview(onContinue) {
    const summary = this.getSummary();
    const timeline = this.getTimeline();
    const mistakes = this._events.filter(ev =>
      ev.severity === 'critical' || ev.severity === 'danger' || ev.severity === 'warning'
    );


    const gradeColors = { 'A+': '#22c55e', 'A': '#22c55e', 'B+': '#06b6d4', 'B': '#3b82f6', 'C+': '#f59e0b', 'C': '#f97316', 'D': '#ef4444' };
    const gradeColor = gradeColors[summary.grade] || '#64748b';


    const tipMap = new Map();
    mistakes.forEach(ev => {
      if (ev.tip && !tipMap.has(ev.type)) tipMap.set(ev.type, { icon: ev.icon, label: ev.label, tip: ev.tip, category: ev.category });
    });


    const timelineHtml = timeline.length > 0 ? `
      <div class="dr-timeline-wrap">
        <div class="dr-timeline-track">
          ${timeline.map(ev => `
            <div class="dr-timeline-dot" style="background:${ev.color};" title="${ev.label} (${ev.timeFormatted})"></div>
          `).join('')}
        </div>
        <div class="dr-timeline-labels">
          <span>0:00</span>
          <span>${timeline[timeline.length - 1]?.timeFormatted || '0:00'}</span>
        </div>
      </div>
    ` : '';


    const mistakesHtml = mistakes.length > 0 ? `
      <div class="dr-section">
        <div class="dr-section-title">⚠️ Mistakes (${mistakes.length})</div>
        <div class="dr-mistake-list">
          ${mistakes.map(ev => `
            <div class="dr-mistake-row" style="border-left:3px solid ${ev.severity === 'critical' ? '#ef4444' : ev.severity === 'danger' ? '#f97316' : '#f5900b'};">
              <span class="dr-mistake-icon">${ev.icon}</span>
              <span class="dr-mistake-label">${ev.label}</span>
              <span class="dr-mistake-time">${ev.timeFormatted}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '<div class="dr-section"><div class="dr-section-title">✅ No mistakes! Perfect driving!</div></div>';


    const tipsHtml = tipMap.size > 0 ? `
      <div class="dr-section">
        <div class="dr-section-title">💡 Tips for Next Time</div>
        <div class="dr-tips">
          ${[...tipMap.values()].map(t => `
            <div class="dr-tip">
              <span class="dr-tip-icon">${t.icon}</span>
              <div><strong>${t.label}:</strong> ${t.tip}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';


    const statsHtml = `
      <div class="dr-stats">
        <div class="dr-stat">
          <div class="dr-stat-val" style="color:${gradeColor}">${summary.grade}</div>
          <div class="dr-stat-label">Grade</div>
        </div>
        <div class="dr-stat">
          <div class="dr-stat-val">${summary.totalEvents}</div>
          <div class="dr-stat-label">Events</div>
        </div>
        <div class="dr-stat">
          <div class="dr-stat-val" style="color:${summary.mistakes > 0 ? '#ef4444' : '#22c55e'}">${summary.mistakes}</div>
          <div class="dr-stat-label">Mistakes</div>
        </div>
        <div class="dr-stat">
          <div class="dr-stat-val">${summary.duration > 0 ? this._formatTime(summary.duration) : '-'}</div>
          <div class="dr-stat-label">Duration</div>
        </div>
      </div>
    `;


    const catEntries = Object.entries(summary.byCategory).filter(([k]) => k !== 'Mission' && k !== 'Learning');
    const catBreakdownHtml = catEntries.length > 0 ? `
      <div class="dr-section">
        <div class="dr-section-title">📊 Category Breakdown</div>
        <div class="dr-cat-grid">
          ${catEntries.map(([cat, events]) => {
            const catMeta = this.categories[cat] || { icon: '📌', color: '#64748b' };
            const warnings = events.filter(e => e.severity === 'warning' || e.severity === 'danger' || e.severity === 'critical').length;
            return `
              <div class="dr-cat-item">
                <span class="dr-cat-icon">${catMeta.icon}</span>
                <span class="dr-cat-name">${cat}</span>
                <span class="dr-cat-count" style="color:${warnings > 0 ? '#f59e0b' : '#22c55e'}">${events.length} event${events.length > 1 ? 's' : ''}${warnings > 0 ? ` (${warnings} warn)` : ''}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';


    const overlay = document.createElement('div');
    overlay.className = 'dr-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Driving Review');
    overlay.innerHTML = `
      <div class="dr-backdrop"></div>
      <div class="dr-card">
        <div class="dr-header">
          <div class="dr-header-top">
            <span class="dr-header-title">📋 Driving Review</span>
            <button class="dr-close" aria-label="Close">&times;</button>
          </div>
          <div class="dr-header-sub">${summary.levelName ? 'Level ' + summary.levelId + ': ' + summary.levelName : 'Level Review'}</div>
        </div>
        <div class="dr-body">
          ${statsHtml}
          ${timelineHtml}
          ${mistakesHtml}
          ${tipsHtml}
          ${catBreakdownHtml}
        </div>
        <div class="dr-footer">
          <button class="dr-btn-primary" id="dr-continue">Continue to Quiz →</button>
        </div>
      </div>
    `;


    if (!document.getElementById('dr-styles')) {
      const style = document.createElement('style');
      style.id = 'dr-styles';
      style.textContent = `
        .dr-overlay {
          position: fixed; inset: 0; z-index: 10001;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; opacity: 0; transition: opacity 0.3s ease;
        }
        .dr-overlay.show { opacity: 1; }
        .dr-backdrop {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.75); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .dr-card {
          position: relative; z-index: 1;
          background: #0f172a; border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px; width: min(520px, 95vw); max-height: 85vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          transform: translateY(20px) scale(0.97);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-family: 'Inter', sans-serif;
        }
        .dr-overlay.show .dr-card { transform: translateY(0) scale(1); }
        .dr-header {
          padding: 24px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }
        .dr-header-top { display: flex; align-items: center; justify-content: space-between; }
        .dr-header-title { font-size: 1.2rem; font-weight: 800; color: #f8fafc; }
        .dr-header-sub { font-size: 0.8rem; color: #94a3b8; margin-top: 4px; }
        .dr-close {
          width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 1.2rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .dr-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .dr-body {
          padding: 20px 24px; overflow-y: auto; flex: 1;
          scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent;
        }
        .dr-body::-webkit-scrollbar { width: 6px; }
        .dr-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .dr-footer {
          padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;
        }
        .dr-btn-primary {
          width: 100%; padding: 14px; border: none; border-radius: 12px;
          background: linear-gradient(135deg, #f59e0b, #d97706); color: #000;
          font-weight: 800; font-size: 1rem; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
        }
        .dr-btn-primary:hover { transform: scale(1.02); box-shadow: 0 8px 24px rgba(245,158,11,0.3); }

        /* Stats */
        .dr-stats { display: flex; gap: 12px; margin-bottom: 20px; }
        .dr-stat {
          flex: 1; text-align: center; padding: 14px 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
        }
        .dr-stat-val { font-size: 1.6rem; font-weight: 800; color: #f8fafc; line-height: 1; }
        .dr-stat-label { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }

        /* Timeline */
        .dr-timeline-wrap { margin-bottom: 20px; }
        .dr-timeline-track {
          display: flex; gap: 4px; align-items: center; padding: 12px 8px;
          background: rgba(255,255,255,0.03); border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06); overflow-x: auto;
          scrollbar-width: none;
        }
        .dr-timeline-track::-webkit-scrollbar { display: none; }
        .dr-timeline-dot {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
          transition: transform 0.2s; cursor: pointer;
        }
        .dr-timeline-dot:hover { transform: scale(1.6); }
        .dr-timeline-labels {
          display: flex; justify-content: space-between; padding: 4px 8px 0;
          font-size: 0.6rem; color: #64748b;
        }

        /* Sections */
        .dr-section { margin-bottom: 20px; }
        .dr-section-title {
          font-size: 0.75rem; font-weight: 800; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;
        }

        /* Mistakes */
        .dr-mistake-list { display: flex; flex-direction: column; gap: 6px; }
        .dr-mistake-row {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: rgba(255,255,255,0.03); border-radius: 8px;
          font-size: 0.85rem;
        }
        .dr-mistake-icon { font-size: 1.1rem; flex-shrink: 0; }
        .dr-mistake-label { flex: 1; color: #e2e8f0; font-weight: 500; }
        .dr-mistake-time { font-size: 0.7rem; color: #64748b; font-family: 'Space Mono', monospace; }

        /* Tips */
        .dr-tips { display: flex; flex-direction: column; gap: 8px; }
        .dr-tip {
          display: flex; gap: 10px; padding: 10px 12px;
          background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15);
          border-radius: 8px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;
        }
        .dr-tip strong { color: #22c55e; }
        .dr-tip-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }

        /* Category breakdown */
        .dr-cat-grid { display: flex; flex-direction: column; gap: 6px; }
        .dr-cat-item {
          display: flex; align-items: center; gap: 8px; padding: 8px 12px;
          background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.8rem;
        }
        .dr-cat-icon { font-size: 0.9rem; }
        .dr-cat-name { flex: 1; color: #cbd5e1; font-weight: 500; }
        .dr-cat-count { font-size: 0.7rem; color: #94a3b8; }

        /* Light mode */
        body.lm .dr-card { background: #ffffff; border-color: rgba(0,0,0,0.08); }
        body.lm .dr-header { border-bottom-color: rgba(0,0,0,0.06); }
        body.lm .dr-header-title { color: #1e293b; }
        body.lm .dr-header-sub { color: #64748b; }
        body.lm .dr-close { border-color: rgba(0,0,0,0.08); background: rgba(0,0,0,0.03); color: #64748b; }
        body.lm .dr-stat { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
        body.lm .dr-stat-val { color: #1e293b; }
        body.lm .dr-mistake-row { background: rgba(0,0,0,0.02); }
        body.lm .dr-mistake-label { color: #334155; }
        body.lm .dr-tip { background: rgba(34,197,94,0.04); border-color: rgba(34,197,94,0.12); color: #475569; }
        body.lm .dr-cat-item { background: rgba(0,0,0,0.02); }
        body.lm .dr-cat-name { color: #334155; }
        body.lm .dr-timeline-track { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }

        @media (max-width: 480px) {
          .dr-card { border-radius: 16px; max-height: 90vh; }
          .dr-stats { gap: 6px; }
          .dr-stat { padding: 10px 4px; }
          .dr-stat-val { font-size: 1.3rem; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));


    let continued = false;
    const doClose = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
      if (!continued) {
        continued = true;
        if (onContinue) onContinue();
      }
    };
    overlay.querySelector('.dr-backdrop').onclick = doClose;
    overlay.querySelector('.dr-close').onclick = doClose;
    overlay.querySelector('#dr-continue').onclick = () => doClose();
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { doClose(); document.removeEventListener('keydown', onKey); }
    });
  },
};
