let _tt = null
function toast(msg, col = '#ffd54a') {
  const t = document.getElementById('toast'),
    ti = document.getElementById('ti')
  ti.textContent = msg
  ti.style.background = col
  t.classList.add('on')
  clearTimeout(_tt)
  _tt = setTimeout(() => t.classList.remove('on'), 2500)
}
const mob = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

// 🚦 SOUND FX 🚦 (Phase 7.5: audio categories)
window.sfx = Object.assign(window.sfx || {}, {
  _c: null,
  vol: { sfx: 1, ui: 1, env: 1 }, // volume multipliers: car sounds, UI sounds, environmental
  _cat: { horn: 'sfx', brake: 'sfx', challan: 'ui', ok: 'ui', error: 'ui', thunder: 'env' },
  init() {
    if (this._c) return
    try {
      this._c = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {}
  },
  setVol(cat, v) { if (this.vol[cat] !== undefined) this.vol[cat] = Math.max(0, Math.min(1, v)); },
  play(t) {
    if (!this._c) return
    const p = {
      horn: { f: 440, ty: 'square', d: 0.18, v: 0.12 },
      brake: { f: 160, ty: 'sawtooth', d: 0.15, v: 0.08 },
      challan: { f: 880, ty: 'triangle', d: 0.32, v: 0.11 },
      ok: { f: 660, ty: 'sine', d: 0.22, v: 0.09 },
      error: { f: 110, ty: 'square', d: 0.28, v: 0.1 },
      thunder: { f: 55, ty: 'sawtooth', d: 0.6, v: 0.15 },
      door: { f: 220, ty: 'triangle', d: 0.25, v: 0.10 },
      step: { f: 80, ty: 'sine', d: 0.06, v: 0.04 }
    }
    const pp = p[t] || p.horn
    const cat = this._cat[t] || 'sfx'
    const catVol = this.vol[cat] !== undefined ? this.vol[cat] : 1
    try {
      const o = this._c.createOscillator(),
        g = this._c.createGain()
      o.connect(g)
      g.connect(this._c.destination)
      o.type = pp.ty
      o.frequency.setValueAtTime(pp.f, this._c.currentTime)
      g.gain.setValueAtTime(pp.v * catVol, this._c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, this._c.currentTime + pp.d)
      o.start()
      o.stop(this._c.currentTime + pp.d)
    } catch (e) {}
  }
});

// 🚦 UI INTERACTION LOGIC LAYER 🚦
const CORRECTIVE_QUIZ = {
  'NO_HONKING': { q: 'Corrective Check: What is the rule for honking in silence zones?', o: ['It is strictly prohibited and carries a fine.', 'Honking is allowed once', 'Only honk if traffic is slow', 'Honk to warn pedestrians'], a: 0 },
  'MOBILE_USE': { q: 'Corrective Check: Why is phone use prohibited while driving?', o: ['It causes distraction and significantly increases accident risk.', 'It is only banned on highways', 'It is allowed if using a speaker', 'It only affects the vehicle speed'], a: 0 },
  'SAFETY_VIOLATION': { q: 'Corrective Check: What is the primary purpose of safety gear like helmets/seatbelts?', o: ['To reduce fatalities and injuries during accidents', 'To avoid police fines', 'To make the driver look professional', 'To improve vehicle aerodynamics'], a: 0 },
  'NO_INDICATOR': { q: 'Corrective Check: When is it mandatory to use a turn indicator?', o: ['Every time you intend to change direction or merge', 'Only at red lights', 'Only on highways', 'Only when other cars are present'], a: 0 },
  'LITTER_HIT': { q: 'Corrective Check: How does road litter affect vehicle control?', o: ['It can cause skidding or damage tires', 'It has no effect on control', 'It improves grip on wet roads', 'It only affects the paint'], a: 0 },
  'CHECKPOINT_EVASION': { q: 'Corrective Check: What is the legal consequence of fleeing a police checkpoint?', o: ['It is a serious offense often leading to immediate arrest', 'A simple warning', 'A small fine payable online', 'No consequence if you have a license'], a: 0 },
  'RED_LIGHT_VIOLATION': { q: 'Corrective Check: What is the mandatory action when a signal turns red?', o: ['Stop completely before the stop line', 'Slow down and proceed cautiously', 'Stop only if cars are coming', 'Flash headlights and pass quickly'], a: 0 }
};

window.ui = Object.assign(window.ui || {}, {
  cur: null,
  _sylLv: null,
  cq: [],
  cbusy: false,
  qst: null,
  _ccb: null,
  _miInited: false,
  adminUnlock() {

    LVS.forEach((l) => {
      if (!S.comp[l.id]) S.comp[l.id] = { score: 500, time: Date.now() }
    })
    BADGES.forEach((b) => {
      if (!S.badges.includes(b.id)) S.badges.push(b.id)
    })
    S.total += 7500
    save()
    toast('🔓 Developer Unlock Triggered!', '#00c851')
    this.showLevels()
  },
  async hardReset() {
    if (confirm('Reset all progress?')) {
      S = { comp: {}, badges: [], total: 0, name: null, wallet: 50000 }
      try {
        localStorage.removeItem('mth4')
      } catch (e) {}
      if (window.supabaseClient && window.colUser) {
        try {
          await window.supabaseClient.auth.updateUser({ data: { progress: null } })
        } catch (e) {}
      }
      toast('⚠️ Progress Reset!', '#ff3b30')
      if (window.location.pathname.toLowerCase().includes('driving')) {
        window.location.href = 'Academy.html'
        return
      }
      if (this.showStart) this.showStart()
      else {
        this.show('ss', { instant: true })
      }
    }
  },
  init() {
    // Ensure S is always initialized before any other code runs.
    // Pages that declare `let S` inline (Driving.html) already have it; pages that do
    // not (Academy.html declares its S inside a function) land here — build the state
    // locally and publish it on window so bare `S` resolves everywhere below.
    // Reading bare `S` inside this branch would throw ReferenceError, which used to
    // abort ui.init() entirely and leave the hub screens unbuilt.
    if (typeof S === 'undefined') {
      let s = null
      try {
        const raw = localStorage.getItem('mth4')
        if (raw) s = JSON.parse(raw)
      } catch (e) {}
      if (!s || typeof s !== 'object') s = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000, studentId: null }
      if (!s.comp) s.comp = {}
      if (!s.badges) s.badges = []
      if (!s.studentId) {
        s.studentId = window.colUser?.uid || 'STU-' + Math.floor(100000 + Math.random() * 900000)
      }
      window.S = s
      try { localStorage.setItem('mth4', JSON.stringify(s)) } catch (e) {}
    }
    // Fallback save if course.js hasn't loaded
    if (typeof save === 'undefined') {
      window.save = async () => {
        try { localStorage.setItem('mth4', JSON.stringify(S)) } catch (e) {}
      }
    }
    try {
      if (localStorage.getItem('theme') === 'light') document.body.classList.add('lm')
    } catch (e) {}
    const urlParams = new URLSearchParams(window.location.search)
    const screenParam = urlParams.get('screen')
    const lvParam = urlParams.get('lv')
    if (screenParam === 'levels') {
      this.showLevels()
    } else if (window.location.pathname.toLowerCase().includes('driving') && lvParam) {
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'))
    } else {
      this.show('ss', { instant: true })
    }

    window.addEventListener('col-auth-changed', (e) => {
      if (e.detail && e.detail.user) {
        if (localStorage.getItem('trafficSetupComplete') !== 'true') {
          window.location.href = 'TrafficSetup.html'
        }
      }
    })

    this._buildSylList()

    const cnameEl = document.getElementById('cname')
    if (cnameEl) {
      cnameEl.innerText = S.name || 'TRAFFIC HERO'
    }
    const hwalletEl = document.getElementById('hwallet')
    if (hwalletEl) {
      hwalletEl.textContent = '₹' + (S.wallet || 50000).toLocaleString('en-IN')
    }
    this._applyAgeTier()
    
    // Initialize micro-interactions (ripples, magnetic hover, tactile press)
    this.initMicroInteractions();
    
    // Listen for reduced-motion changes while page is open
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', (e) => { this._prefersReducedMotion = e.matches })
    }
  },
  // ── Smooth Screen Transition System ──
  _transitioning: false,
  _transitionTimer: null,
  _lastScreen: null,
  
  // Screen depth map: deeper screens slide up from below, shallower slide up
  _screenDepth: { 'ss': 0, 'screen-levels': 1, 'screen-briefing': 2, 'screen-quiz': 3, 'screen-badges': 2, 'screen-certificate': 2, 'screen-2d': 4 },
  
  // Screen navigation history for back detection
  _screenHistory: [],
  // Pending target queue: if user clicks during transition, queue it
  _pendingTarget: null,
  // Detect prefers-reduced-motion for instant transitions
  _prefersReducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
  // Micro-interaction observer for dynamically added elements
  _miObserver: null,

  // ════════════════════════════════════════════════════════════════
  // 🎛️ CENTRALIZED MICRO-INTERACTION SYSTEM
  // Ripple clicks, magnetic hovers, tactile press, card tilt
  // ════════════════════════════════════════════════════════════════

  /** Initialize all micro-interactions. Called once from init(). */
  initMicroInteractions() {
    if (this._miInited) return;
    this._miInited = true;
    const isMobile = mob();

    // Skip all animations under reduced-motion
    const reducedMotion = this._prefersReducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    // ── Inject ripple keyframe if not already in stylesheet ──
    if (!document.getElementById('mi-keyframes')) {
      const style = document.createElement('style');
      style.id = 'mi-keyframes';
      style.textContent = `
        @keyframes miRipple {
          from { transform: scale(0); opacity: 0.6; }
          to   { transform: scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // ── 1. Ripple Click Effect ──
    const rippleSelector = '.btn, .back-btn, .syl-item, .lcard:not(.lk), .mode-tab';
    document.addEventListener('pointerdown', (e) => {
      const target = e.target.closest(rippleSelector);
      if (!target || target.disabled) return;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.cssText = `
        position:absolute;border-radius:50%;pointer-events:none;
        width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
        background:radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%);
        transform:scale(0);opacity:1;
        animation:miRipple 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        z-index:10;
      `;
      if (getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
      }
      target.style.overflow = 'hidden';
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 550);
    }, { passive: true });

    // ── 2. Tactile Press Feedback (desktop only) ──
    if (!isMobile) {
      document.addEventListener('pointerdown', (e) => {
        const el = e.target.closest('.btn, .back-btn');
        if (!el || el.disabled) return;
        el.style.transition = 'transform 0.08s ease';
        el.style.transform = 'scale(0.95) translateY(1px)';
      }, { passive: true });
      document.addEventListener('pointerup', (e) => {
        const el = e.target.closest('.btn, .back-btn');
        if (!el) return;
        el.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 300);
      }, { passive: true });
    }

    // ── 3. Card Tilt on Hover (desktop only, event delegation) ──
    if (!isMobile) {
      let _tiltCard = null;
      const tiltSelector = '.lcard:not(.lk), .wh-card, .lp-card';
      document.addEventListener('pointermove', (e) => {
        const card = e.target.closest(tiltSelector);
        if (card !== _tiltCard) {
          // Leaving previous card
          if (_tiltCard) {
            _tiltCard.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            _tiltCard.style.transform = '';
            setTimeout(() => { if (_tiltCard) _tiltCard.style.transition = ''; }, 400);
          }
          _tiltCard = card;
        }
        if (!card || card.classList.contains('lk')) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transition = 'transform 0.12s ease-out';
        card.style.transform = `perspective(800px) rotateX(${y * -6}deg) rotateY(${x * 6}deg) translateY(-4px) scale(1.02)`;
      }, { passive: true });
      document.addEventListener('pointerleave', () => {
        if (_tiltCard) {
          _tiltCard.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
          _tiltCard.style.transform = '';
          setTimeout(() => { if (_tiltCard) _tiltCard.style.transition = ''; }, 400);
          _tiltCard = null;
        }
      }, { passive: true });
    }

    // ── 4. Syllabus Item Active Glow ──
    document.addEventListener('pointerdown', (e) => {
      const item = e.target.closest('.syl-item');
      if (!item) return;
      item.style.transition = 'box-shadow 0.15s ease';
      item.style.boxShadow = '0 0 20px rgba(242,184,75,0.15), inset 0 0 0 1px rgba(242,184,75,0.2)';
    }, { passive: true });
    document.addEventListener('pointerup', (e) => {
      const item = e.target.closest('.syl-item');
      if (!item) return;
      setTimeout(() => {
        item.style.transition = 'box-shadow 0.4s ease';
        item.style.boxShadow = '';
        setTimeout(() => { item.style.transition = ''; }, 400);
      }, 100);
    }, { passive: true });

    // ── 5. Tab Switch Bounce ──
    document.addEventListener('pointerdown', (e) => {
      const tab = e.target.closest('.mode-tab');
      if (!tab) return;
      tab.style.transition = 'transform 0.1s ease';
      tab.style.transform = 'scale(0.92)';
    }, { passive: true });
    document.addEventListener('pointerup', (e) => {
      const tab = e.target.closest('.mode-tab');
      if (!tab) return;
      tab.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      tab.style.transform = '';
      setTimeout(() => { tab.style.transition = ''; }, 350);
    }, { passive: true });
  },

  /**
   * Smooth screen transition with crossfade.
   * @param {string} id - Target screen element id
   * @param {object} opts - { instant: bool, direction: 'forward'|'back'|'up'|'scale' }
   */
  show(id, opts = {}) {
    if (this._transitioning && !opts.instant) {
      this._pendingTarget = { id, opts };
      return;
    }
    
    const target = id ? document.getElementById(id) : null;
    const currentActive = document.querySelector('.screen.active:not(.screen-exiting)');
    
    // Same screen? No-op
    if (currentActive && currentActive.id === id && !opts.instant) return;
    
    // If reduced motion is preferred, force instant
    if (this._prefersReducedMotion && !opts.instant) opts.instant = true;
    
    if (id && id !== null && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    if (id !== 'screen-briefing') {
      this._disposeBriefingScene()
    }
    
    // Determine transition direction
    let direction = opts.direction;
    if (!direction && currentActive && id) {
      const fromDepth = this._screenDepth[currentActive.id] ?? 1;
      const toDepth = this._screenDepth[id] ?? 1;
      direction = toDepth > fromDepth ? 'forward' : toDepth < fromDepth ? 'back' : 'up';
    }
    direction = direction || 'fade';
    
    // Instant transition: skip animation entirely
    if (opts.instant) {
      document.querySelectorAll('.screen').forEach((s) => {
        s.classList.remove('active', 'screen-exiting', 'screen-entering',
          'screen-entering-forward', 'screen-entering-back', 'screen-entering-up',
          'screen-entering-scale', 'screen-exiting-up', 'screen-exiting-backward');
        s.style.opacity = '';
        s.style.transform = '';
        s.style.pointerEvents = '';
      });
      if (target) {
        target.classList.add('active');
        target.style.opacity = '';
        target.style.transform = '';
      }
      return;
    }
    
    // Track history for back detection
    this._screenHistory.push(currentActive?.id || null);
    if (this._screenHistory.length > 10) this._screenHistory.shift();
    
    // Set transitioning state
    this._transitioning = true;
    clearTimeout(this._transitionTimer);
    
    // If there's a current screen, animate it out
    if (currentActive && currentActive.id !== id) {
      const exitClass = 'screen-exiting';
      const exitVariant = {
        'forward': 'screen-exiting-up',
        'back': 'screen-exiting-backward',
        'up': 'screen-exiting-up',
        'scale': 'screen-exiting-scale',
        'fade': ''
      }[direction] || '';
      
      // Apply exit animation
      currentActive.classList.add(exitClass);
      if (exitVariant) currentActive.classList.add(exitVariant);
      
      // After exit animation completes, clean up and show new screen
      const exitDuration = 250; // matches CSS 0.25s
      setTimeout(() => {
        currentActive.classList.remove('active', exitClass, exitVariant);
        currentActive.style.opacity = '';
        currentActive.style.transform = '';
        currentActive.style.pointerEvents = '';
        
        // Now show the new screen
        if (target) {
          const enterClass = {
            'forward': 'screen-entering-forward',
            'back': 'screen-entering-back',
            'up': 'screen-entering-up',
            'scale': 'screen-entering-scale',
            'fade': 'screen-entering'
          }[direction] || 'screen-entering';
          
          target.classList.add('active', enterClass);
          
          // Clean up entering class after animation completes
          const enterDuration = 400; // matches CSS 0.4s
          this._transitionTimer = setTimeout(() => {
            target.classList.remove(enterClass);
            this._transitioning = false;
            // Process pending target if any
            if (this._pendingTarget) {
              const pending = this._pendingTarget;
              this._pendingTarget = null;
              this.show(pending.id, pending.opts);
            }
          }, enterDuration);
        } else {
          this._transitioning = false;
        }
      }, exitDuration);
    } else {
      // No current screen - just enter
      if (target) {
        const enterClass = {
          'forward': 'screen-entering-forward',
          'back': 'screen-entering-back',
          'up': 'screen-entering-up',
          'scale': 'screen-entering-scale',
          'fade': 'screen-entering'
        }[direction] || 'screen-entering';
        
        target.classList.add('active', enterClass);
        this._transitionTimer = setTimeout(() => {
          target.classList.remove(enterClass);
          this._transitioning = false;
          // Process pending target if any
          if (this._pendingTarget) {
            const pending = this._pendingTarget;
            this._pendingTarget = null;
            this.show(pending.id, pending.opts);
          }
        }, 400);
      } else {
        this._transitioning = false;
      }
    }
  },
  
  /** Show screen going backward (back button) */
  showBack(id) {
    this._screenHistory.pop(); // remove current from history
    this.show(id, { direction: 'back' });
  },
  _buildSylList() {
    // S should already be initialized from init(), but ensure it exists
    if (typeof S === 'undefined') {
      try {
        const raw = localStorage.getItem('mth4')
        if (raw) S = JSON.parse(raw)
      } catch (e) {}
      if (!S) S = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000 }
      if (!S.comp) S.comp = {}
      if (!S.badges) S.badges = []
    }
    if (!S.comp) S.comp = {}
    const wrap = document.getElementById('lvbody')
    if (!wrap) return
    wrap.innerHTML = ''

    const catMap = {
      free_roam: 'free_roam',
      pedestrian_courtesy: 'courtesy', pedestrian_priority: 'courtesy',
      respectful_parking: 'parking', street_parking: 'parking', parking_rules: 'parking',
      ambulance_priority: 'emergency',
      puddle_etiquette: 'weather', rain_driving: 'weather', night_monsoon: 'weather', zero_visibility: 'weather',
      no_honking: 'silence', hospital_quiet: 'silence',
      signal_jump: 'signals', signs: 'signals', one_way: 'signals',
      road_rage: 'discipline', narrow_street: 'discipline', wrong_side: 'discipline', highway_merge: 'discipline', lane_discipline: 'discipline',
      animals: 'nature', cyclist: 'nature',
      auto_dance: 'vehicles', toll: 'vehicles', bus_stop: 'vehicles',
      blind_corner: 'challenges', hill_driving: 'challenges', construction: 'challenges', mountain: 'challenges', rural: 'challenges',
      festival: 'special',
      grand_test: 'grand', multi_modal: 'grand'
    }
    const cats = {
      free_roam:   { title: '🌍 Free Roam', levels: [] },
      courtesy:    { title: '🚶 Pedestrian Courtesy', levels: [] },
      parking:     { title: '🅿️ Parking Rules', levels: [] },
      emergency:   { title: '🚑 Emergency Priority', levels: [] },
      weather:     { title: '🌧️ Weather Driving', levels: [] },
      silence:     { title: '🔇 Silence Zones', levels: [] },
      signals:     { title: '🚦 Signals & Signs', levels: [] },
      discipline:  { title: '😡 Road Discipline', levels: [] },
      nature:      { title: '🐄 Animals & Cyclists', levels: [] },
      vehicles:    { title: '🛺 Vehicle Etiquette', levels: [] },
      challenges:  { title: '⛰️ Driving Challenges', levels: [] },
      special:     { title: '🎪 Special Events', levels: [] },
      grand:       { title: '🏆 Grand Tests', levels: [] },
      general:     { title: '📚 General', levels: [] }
    }

    LVS.forEach((lv) => {
      const catKey = catMap[lv.themeType] || 'general'
      cats[catKey].levels.push(lv)
    })

    const pchip = document.getElementById('pchip')
    if (pchip) {
      const done = Object.keys(S.comp).length
      pchip.textContent = done + '/' + LVS.length + ' ✅'
    }

    const BATCH = 6
    const queue = []
    Object.values(cats).forEach((cat) => {
      if (cat.levels.length === 0) return

      const hdr = document.createElement('div')
      hdr.className = 'category-header'
      hdr.textContent = cat.title
      const grid = document.createElement('div')
      grid.className = 'category-grid'

      cat.levels.forEach((lv, idx) => {
        queue.push({ lv, idx, grid })
      })

      wrap.appendChild(hdr)
      wrap.appendChild(grid)
    })

    let i = 0
    function flush() {
      const end = Math.min(i + BATCH, queue.length)
      let frag = document.createDocumentFragment()
      let curGrid = null
      for (; i < end; i++) {
        const { lv, idx, grid } = queue[i]
        if (grid !== curGrid) {
          if (curGrid) curGrid.appendChild(frag)
          frag = document.createDocumentFragment()
          curGrid = grid
        }
        const done = S.comp[lv.id] && (S.comp[lv.id].score > 0 || S.comp[lv.id].finalQuiz || S.comp[lv.id].completed || S.comp[lv.id] === true)
        const started = !done && ((S.started && S.started[lv.id]) || (S.sylViewed && S.sylViewed[lv.id] && S.sylViewed[lv.id].length > 0))
        const statusClass = done ? ' syl-done' : started ? ' syl-started' : ''
        const div = document.createElement('div')
        div.className = 'syl-item' + statusClass
        const badgeText = done ? '✓ Completed' : started ? '● Started' : '○ Not Started'
        const badgeColor = done ? '#00f0cc' : started ? '#5ed4f5' : 'rgba(184,155,255,0.5)'
        const cleanName = lv.name.replace(/^Lesson\s+\d+\s*[-–]\s*/i, '')
        div.innerHTML = `<div class="syl-ck"></div><div class="syl-top"><span class="syl-icon">${lv.icon}</span><span class="syl-num">Lesson ${lv.id}</span></div><div class="syl-info"><div class="syl-lbl">${cleanName}</div><div class="syl-sub">${lv.ds}</div><div class="syl-badge" style="background:${badgeColor}18;color:${badgeColor};border:1px solid ${badgeColor}30">${badgeText}</div></div>`
        div.style.animationDelay = `${idx * 0.08}s`
        div.onclick = () => ui.showBriefing(lv.id)
        frag.appendChild(div)
      }
      if (curGrid) curGrid.appendChild(frag)
      if (i < queue.length) requestAnimationFrame(flush)
    }
    if (queue.length) requestAnimationFrame(flush)
  },
  showLevels() {
    if (window.location.pathname.toLowerCase().includes('driving')) {
      window.location.href = 'Academy.html?screen=levels'
      return
    }
    const currentActive = document.querySelector('.screen.active:not(.screen-exiting)')
    if (currentActive && currentActive.id === 'screen-levels') {
      requestAnimationFrame(() => this._buildSylList())
      return
    }
    const direction = (currentActive?.id === 'ss') ? 'forward' : 'fade'
    this.show('screen-levels', { direction })
    requestAnimationFrame(() => this._buildSylList())
  },
  showNamePrompt() {
    const dlg = document.getElementById('name-prompt-dlg')
    if (dlg) {
      document.getElementById('prompt-name').value = S.name && S.name !== 'Traffic Hero' ? S.name : ''
      dlg.style.display = 'flex'
    }
  },
  saveNamePrompt() {
    const n = document.getElementById('prompt-name').value.trim()
    if (n.length > 0 && n.length < 3) {
      toast('Please enter a valid name', 'darkred')
      return
    }
    S.name = n || 'Traffic Hero'
    save()
    document.getElementById('name-prompt-dlg').style.display = 'none'
    toast('Welcome, ' + S.name + '!', '#3b8c66')
    const cnameEl = document.getElementById('cname')
    if (cnameEl) {
      cnameEl.innerText = S.name.toUpperCase()
    }
  },
  showProfile() {
    if (!window.colUser) {
      if (window.openGlobalLogin) window.openGlobalLogin()
      else if (window.openLogin) window.openLogin()
      return
    }
    window.location.href = 'TrafficDashboard.html'
  },
  saveProfile() {
    const n = document.getElementById('prof-name').value.trim()
    const v = document.getElementById('prof-veh').value
    const ageEl = document.getElementById('prof-age')
    const gradeEl = document.getElementById('prof-grade')
    const langEl = document.getElementById('prof-lang')
    if (n.length > 0 && n.length < 3) {
      toast('Please enter a valid name', 'darkred')
      return
    }
    S.name = n
    S.vehicle = v
    if (ageEl) S.age = parseInt(ageEl.value) || 18
    if (gradeEl) S.grade = parseInt(gradeEl.value) || 5
    if (langEl) S.language = langEl.value
    save()
    
    // Also persist vehicle preference to localStorage for Execution tab default
    const localUser = JSON.parse(localStorage.getItem('traffic_local_user') || '{}')
    localUser.vehicle = v
    localStorage.setItem('traffic_local_user', JSON.stringify(localUser))
    
    // Sync to Supabase if logged in
    if (window.supabaseClient && window.colUser) {
      window.supabaseClient.from('user_profiles').upsert({
        user_id: window.colUser.id,
        preferred_vehicle: v,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).catch(() => {})
    }
    
    this._applyAgeTier()
    document.getElementById('profile-dlg').style.display = 'none'
    toast('Profile Saved!', '#3b8c66')

    const cnameEl = document.getElementById('cname')
    if (cnameEl) {
      cnameEl.innerText = S.name || 'DRIVER'
    }
  },
  getAgeBracket() {
    const age = S.age || 18
    if (age <= 12) return 'child'
    if (age <= 17) return 'teen'
    if (age <= 25) return 'young'
    if (age <= 50) return 'adult'
    return 'senior'
  },
  getGradeTier() {
    // Map standard (grade) to tier - Std 1-10
    const grade = S.grade || 5
    if (grade <= 3) return 'grade-low'      // Std 1-3: Very childish
    if (grade <= 6) return 'grade-mid'       // Std 4-6: Childish but more text
    if (grade <= 9) return 'grade-high'      // Std 7-9: Teen - normal
    return 'grade-max'                         // Std 10: Young adult
  },
  getGradeConfig() {
    const tier = this.getGradeTier()
    const configs = {
      'grade-low': { buttonSize: 'large', hints: 'max', theme: 'bright', fontSize: 'large' },
      'grade-mid': { buttonSize: 'medium', hints: 'frequent', theme: 'warm', fontSize: 'medium' },
      'grade-high': { buttonSize: 'normal', hints: 'some', theme: 'neutral', fontSize: 'normal' },
      'grade-max': { buttonSize: 'normal', hints: 'minimal', theme: 'professional', fontSize: 'small' }
    }
    return configs[tier] || configs['grade-high']
  },
  getAgeScale() {
    const b = this.getAgeBracket()
    const scale = { child: 0.7, teen: 0.85, young: 1.0, adult: 1.0, senior: 0.9 }
    return scale[b] || 1.0
  },
  _applyAgeTier() {
    const tier = this.getAgeBracket()
    const gradeTier = this.getGradeTier()
    document.body.dataset.ageTier = tier
    document.body.dataset.gradeTier = gradeTier

    // Default grade if not set
    if (!S.grade) S.grade = 5

    this._applyGradeUI()
  },
  _applyGradeUI() {
    const cfg = this.getGradeConfig()
    const root = document.documentElement

    // Apply button size
    if (cfg.buttonSize === 'large') {
      root.style.setProperty('--btn-scale', '1.3')
      root.style.setProperty('--btn-padding', '20px 30px')
    } else if (cfg.buttonSize === 'medium') {
      root.style.setProperty('--btn-scale', '1.15')
      root.style.setProperty('--btn-padding', '14px 22px')
    } else {
      root.style.setProperty('--btn-scale', '1')
      root.style.setProperty('--btn-padding', '10px 16px')
    }

    // Apply font size
    if (cfg.fontSize === 'large') {
      root.style.setProperty('--ui-font-size', '1.2rem')
    } else if (cfg.fontSize === 'medium') {
      root.style.setProperty('--ui-font-size', '1rem')
    } else if (cfg.fontSize === 'small') {
      root.style.setProperty('--ui-font-size', '0.85rem')
    } else {
      root.style.setProperty('--ui-font-size', '0.95rem')
    }
  },
  showCert(badgeId = null) {
    this.show('screen-certificate', { direction: 'forward' })

    const cname = document.getElementById('cname')
    if (cname) cname.innerText = (S.name || 'DRIVER').toUpperCase()

    const certNum = document.getElementById('cert-num')
    if (certNum) {
      if (!S.certId) {
        S.certId = 'CERT-' + (window.colUser?.uid || Math.floor(Math.random() * 1000000))
        save()
      }
    }

    const cTitle = document.getElementById('cert-title')
    const cIcon = document.getElementById('cert-icon')
    const cStat = document.getElementById('cstat')
    const cScoreLbl = document.getElementById('cscore')
    const cdownloadBtn = document.getElementById('cdownload')

    // Check if user is logged in (via local or Supabase)
    const localData = localStorage.getItem('traffic_local_user')
    const isLoggedIn = localData || (window.colUser && window.colUser.user)

    if (badgeId && typeof BADGES !== 'undefined') {
      const b = BADGES.find((x) => x.id === badgeId)
      if (b) {
        const hasBadge = S.badges && S.badges.includes(badgeId)
        if (cTitle) cTitle.innerText = b.name
        if (cIcon) {
          cIcon.innerText = b.icon
          cIcon.style.display = 'block'
        }
        if (cStat) cStat.innerText = hasBadge ? `ACHIEVEMENT UNLOCKED: ${b.desc}` : `LOCKED: Complete requirements to unlock`
        if (certNum)
          certNum.innerText = hasBadge ? `BDG-${badgeId
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .substring(0, 5)}-${Math.floor(Math.random() * 10000)}` : '---'
        if (cScoreLbl) cScoreLbl.innerText = hasBadge ? 'Mastered' : 'Locked'
        if (cdownloadBtn) cdownloadBtn.style.display = hasBadge ? 'flex' : 'none'
        return
      }
    }

    // Default behavior - Main certificate
    if (cTitle) cTitle.innerText = 'Traffic Hero Certification'
    if (cIcon) cIcon.style.display = 'none'

    const completedLevels = Object.keys(S.comp || {}).length
    const totalLevels = 52

    let totalScore = 0,
      count = 0
    if (S.scores) {
      for (let k in S.scores) {
        totalScore += S.scores[k]
        count++
      }
    }
    let avgScore = count > 0 ? totalScore / count : 0

    // Show progress toward certificate
    if (completedLevels >= totalLevels) {
      if (cStat) cStat.innerText = `COMPLETED WITH ${Math.round(avgScore)}% PROFICIENCY`
      if (cScoreLbl) cScoreLbl.innerText = `${Math.round(avgScore)}%`
      if (cdownloadBtn) cdownloadBtn.style.display = 'flex'
    } else {
      if (cStat) cStat.innerText = `IN PROGRESS: ${completedLevels}/${totalLevels} levels completed`
      if (cScoreLbl) cScoreLbl.innerText = `${Math.round(avgScore)}%`
      // Enable download for logged-in users even if not complete
      if (cdownloadBtn) cdownloadBtn.style.display = isLoggedIn ? 'flex' : 'none'
    }
    if (certNum) certNum.innerText = completedLevels >= totalLevels ? S.certId : '---'
  },
  showBadges() {
    this.show('screen-badges', { direction: 'forward' })

    const statsBody = document.getElementById('stats-body')
    if (statsBody) {
      const startedCount = S.started ? Object.keys(S.started).length : 0
      statsBody.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:var(--muted, #475569);font-size:0.9rem;font-weight:600;">COMPLETED LEVELS</div>
                    <div style="font-weight:700;color:var(--accent);">${Object.keys(S.comp).length}/52</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:var(--muted, #475569);font-size:0.9rem;font-weight:600;">STARTED LEVELS</div>
                    <div style="font-weight:700;color:#0284c7;">${startedCount}/52</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:var(--muted, #475569);font-size:0.9rem;font-weight:600;">TOTAL WALLET</div>
                    <div style="font-weight:700;color:#059669;">₹${S.wallet || 0}</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <div style="color:var(--muted, #475569);font-size:0.9rem;font-weight:600;">TOTAL BADGES</div>
                    <div style="font-weight:700;color:#7c3aed;">${S.badges ? S.badges.length : 0}</div>
                </div>
            `
    }

    const bgrid = document.getElementById('bgrid')
    if (bgrid && typeof BADGES !== 'undefined') {
      let bHtml = ''
      BADGES.forEach((b) => {
        const has = S.badges && S.badges.includes(b.id)
        bHtml += `
                    <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid ${has ? 'var(--accent, #d97706)' : 'var(--line, #eee)'};text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.05);filter:${has ? 'none' : 'grayscale(1)'};opacity:${has ? '1' : '0.5'};${has ? 'cursor:pointer;' : ''}" ${has ? `onclick="ui.showCert('${b.id}')"` : ''}>
                        <div style="font-size:3rem;margin-bottom:10px;">${b.icon}</div>
                        <div style="font-weight:700;margin-bottom:6px;color:#2c3e50;">${b.name}</div>
                        <div style="font-size:0.85rem;color:var(--muted, #475569);">${b.desc}</div>
                        ${has ? `<div style="margin-top:12px; font-size:0.75rem; color:#b45309; font-weight:bold; text-transform:uppercase;">Click to view Certificate</div>` : ''}
                    </div>
                `
      })
      bgrid.innerHTML = bHtml
    }
  },
  dlCert() {
    if (typeof html2pdf !== 'undefined') {
      const wrapper = document.getElementById('cert-wrapper')
      const crt = document.getElementById('cert')
      if (!crt || !crt.parentNode) {
        toast('Certificate not ready. Please wait a moment.', '#ff9500')
        return
      }
      // Temporarily remove CSS transform so html2pdf captures at true size (avoids blank second page)
      const prevWrapperOverflow = wrapper.style.overflow
      const prevWrapperJustify = wrapper.style.justifyContent
      const prevWrapperMargin = wrapper.style.margin
      const prevCrtTransform = crt.style.transform
      const prevCrtTransformOrigin = crt.style.transformOrigin
      const prevCrtWidth = crt.style.width
      const prevCrtPageBreak = crt.style.pageBreakInside
      const prevCrtBreakInside = crt.style.breakInside
      // Helper to restore all overridden styles
      const restoreStyles = () => {
        wrapper.style.overflow = prevWrapperOverflow
        wrapper.style.justifyContent = prevWrapperJustify
        wrapper.style.margin = prevWrapperMargin
        crt.style.transform = prevCrtTransform
        crt.style.transformOrigin = prevCrtTransformOrigin
        crt.style.width = prevCrtWidth
        crt.style.pageBreakInside = prevCrtPageBreak
        crt.style.breakInside = prevCrtBreakInside
      }
      wrapper.style.overflow = 'visible'
      wrapper.style.justifyContent = 'center'
      wrapper.style.margin = '0'
      crt.style.transform = 'none'
      crt.style.transformOrigin = 'top center'
      crt.style.width = '1056px'
      crt.style.pageBreakInside = 'avoid'
      crt.style.breakInside = 'avoid'
      html2pdf()
        .set({
          margin: [0, 0, 0, 0],
          filename: 'Traffic_Hero_Certificate.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            width: 1056,
            windowWidth: 1100,
            allowTaint: true
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'landscape',
            hotfixes: ['px_scaling']
          },
          pagebreak: { mode: ['avoid-all'] }
        })
        .from(crt)
        .save()
        .then(restoreStyles)
        .catch(restoreStyles)
    } else {
      alert('PDF library not loaded. Please ensure you have internet access.')
    }
  },

  showStart() {
    if (window.location.pathname.toLowerCase().includes('driving')) {
      window.location.href = 'Academy.html'
      return
    }
    this.show('ss', { direction: 'back' })
    this._rain()
    
    // Update Get Started button if user has already made progress
    let hasStarted = false;
    if (S.completed && S.completed.length > 0) hasStarted = true;
    if (S.started && Object.keys(S.started).length > 0) hasStarted = true;
    
    const enterBtn = document.getElementById('enter-academy-btn');
    if (enterBtn) {
      if (hasStarted) {
        enterBtn.textContent = 'Continue Learning';
        enterBtn.onclick = () => ui.showLevels();
      } else {
        enterBtn.textContent = 'Get Started';
        enterBtn.onclick = () => {
          if (typeof showOnboardingFromStart === 'function') {
            showOnboardingFromStart();
          } else {
            ui.showLevels();
          }
        };
      }
    }

    if (!S.name || S.name === 'Traffic Hero') {
      setTimeout(() => this.showNamePrompt(), 1000)
    }
  },
  showNameDlg() {
    document.getElementById('name-dlg').classList.add('on')
    setTimeout(() => {
      const i = document.getElementById('name-input')
      if (i) i.focus()
    }, 200)
  },
  _rain() {
    const r = document.getElementById('rl')
    if (r && !r._b) {
      r._b = 1
      for (let i = 0; i < 30; i++) {
        const d = document.createElement('div')
        d.className = 'rd'
        d.style.left = Math.random() * 100 + '%'
        d.style.height = 50 + Math.random() * 50 + 'px'
        d.style.animationDuration = '.6' + Math.random() * 0.5 + 's'
        r.appendChild(d)
      }
    }
  },
  showLevels_old() {
    this.show('screen-levels', { direction: 'forward' })
    this._bldLvs()
  },
  _bldLvs() {
    const body = document.getElementById('lvbody')
    body.innerHTML = ''
    const done = Object.keys(S.comp).length
    document.getElementById('pchip').textContent = done + '/' + LVS.length + ' ✅'
    const total = LVS.length
    const chunk = Math.ceil(total / 5)
    const secs = [
      { t: '🔰 Fundamentals (Levels 1–' + Math.min(chunk, total) + ')', ids: LVS.slice(0, chunk).map(l => l.id) },
      { t: '🚦 Signals & Discipline (Levels ' + (chunk + 1) + '–' + Math.min(chunk * 2, total) + ')', ids: LVS.slice(chunk, chunk * 2).map(l => l.id) },
      { t: '🌧️ Weather & Animals (Levels ' + (chunk * 2 + 1) + '–' + Math.min(chunk * 3, total) + ')', ids: LVS.slice(chunk * 2, chunk * 3).map(l => l.id) },
      { t: '⛰️ Challenges (Levels ' + (chunk * 3 + 1) + '–' + Math.min(chunk * 4, total) + ')', ids: LVS.slice(chunk * 3, chunk * 4).map(l => l.id) },
      { t: '🏆 Grand Tests (Levels ' + (chunk * 4 + 1) + '–' + total + ')', ids: LVS.slice(chunk * 4).map(l => l.id) }
    ]
    secs.forEach((sec) => {
      const sh = document.createElement('div')
      sh.className = 'sec-hdr'
      sh.textContent = sec.t
      body.appendChild(sh)
      const tr = document.createElement('div')
      tr.className = 'lv-track'
      sec.ids.forEach((id) => {
        const lv = LVS.find((l) => l.id === id),
          idx = LVS.indexOf(lv)
        const isDone = (lvlId) => S.comp[lvlId]?.finalQuiz || (S.comp[lvlId] && S.comp[lvlId].score !== undefined && Object.keys(S.comp[lvlId]).length > 1)
        const un = idx === 0 || isDone(LVS[idx - 1].id)
        const cm = !!isDone(lv.id)
        const ip = !cm && un
        
        // Calculate progress for this level (0, 50, 100)
        let levelProgress = 0
        if (cm) levelProgress = 100
        else if (ip && S.comp[lv.id]) {
          // In progress - check which sub-modules are done
          const subModules = ['intro', ...lv.hps.map((_, i) => 'rule' + i), 'law', 'theory', 'practical']
          let doneSubs = 0
          subModules.forEach(sm => {
            if (S.comp[lv.id] && S.comp[lv.id][sm]) doneSubs++
          })
          levelProgress = Math.round((doneSubs / subModules.length) * 100)
        }
        
        const c = document.createElement('div')
        c.className = 'lcard' + (cm ? ' done' : '') + (un ? '' : ' lk')
        c.style.setProperty('--level-progress', levelProgress + '%')
        c.innerHTML = `
          <div class="lbar" style="background: ${levelProgress >= 100 ? 'linear-gradient(90deg, var(--green), var(--teal))' : (levelProgress > 0 ? 'linear-gradient(90deg, var(--signal), var(--green))' : 'var(--border)')}; width: ${levelProgress}%"></div>
          <div class="lct">
            <div class="lico" style="background: ${levelProgress >= 100 ? 'var(--green)' : (levelProgress > 0 ? 'var(--signal)' : 'var(--muted)')}">
              ${lv.icon || '📚'}
            </div>
            <div class="lst" style="background: ${levelProgress >= 100 ? 'rgba(52, 211, 153, 0.15)' : (levelProgress > 0 ? 'rgba(242, 184, 75, 0.15)' : 'var(--hover)')}; color: ${levelProgress >= 100 ? 'var(--green)' : (levelProgress > 0 ? 'var(--signal)' : 'var(--muted)')}">
              ${levelProgress >= 100 ? '✓' : (levelProgress > 0 ? '▶' : '🔒')}
            </div>
          </div>
          <div class="lcard-body">
            <div class="lcard-header">
              <div class="lnum">Level ${lv.id}</div>
              <div class="lnm">${lv.name}</div>
            </div>
            <div class="ltg">${lv.ds || ''}</div>
            <div class="lcard-progress">
              <canvas class="level-progress-ring" width="64" height="64" data-progress="${levelProgress}"></canvas>
              <div class="lcard-status">
                <div class="lcard-status-label">${levelProgress >= 100 ? 'Completed' : (levelProgress > 0 ? levelProgress + '% Complete' : 'Locked')}</div>
                <div class="lcard-status-action">${un ? (cm ? '✔ Completed' : '▶ Start Module') : '🔒 Complete Previous'}</div>
              </div>
            </div>
          </div>
        `
        if (un) {
          c.onclick = async () => {
            // Show premium level preview before briefing
            if (window.game && window.game._showLevelPreview) {
              const proceed = await window.game._showLevelPreview(lv);
              if (proceed) this.showBriefing(lv.id);
            } else {
              this.showBriefing(lv.id);
            }
          }
        }
        tr.appendChild(c)
      })
      body.appendChild(tr)
    })
    
    // Initialize progress rings after DOM insertion
    setTimeout(() => {
      if (window.TrafficCharts) {
        document.querySelectorAll('.level-progress-ring').forEach(canvas => {
          const progress = parseFloat(canvas.dataset.progress) || 0
          window.TrafficCharts.createRadialProgress(canvas, progress, {
            strokeWidth: 4,
            fontSize: 14,
            subtitle: ''
          })
        })
      }
    }, 50)
  },
  showBriefing(lid) {
    const lv = LVS.find((l) => l.id === lid)
    this.cur = lv
    const availModes = lv.modes || ['car']
    const preferred = S.vehicle === 'Bike' && availModes.includes('bike') ? 'bike'
      : S.vehicle === 'Car' && availModes.includes('car') ? 'car'
      : availModes[0]
    this.curMode = preferred
    if (history.replaceState) {
      history.replaceState(null, '', `?screen=levels&lv=${lv.id}`)
    }
    document.getElementById('blt').textContent = 'Level ' + lv.id
    document.getElementById('bvh').textContent = lv.v
    
    // Initialize streak if not present
    if (!S.streak) S.streak = { current: 0, best: 0, lastDate: null }
    
    // Update streak display with loss aversion framing
    const streakEl = document.getElementById('br-streak')
    if (streakEl) {
      const isActive = S.streak.current > 0
      streakEl.innerHTML = isActive 
        ? `🔥 ${S.streak.current} Day Streak ${S.streak.current >= 3 ? '— Don\'t break it!' : ''}`
        : '🔥 No active streak — Start today!'
      streakEl.style.background = isActive 
        ? 'linear-gradient(90deg, var(--signal), var(--accent))'
        : 'linear-gradient(90deg, var(--muted), var(--muted2))'
    }
    
    // Build mode tabs
    this._initModeTabs(lv)
    
    // Build module progress checklist (Zeigarnik effect)
    this._renderModuleChecklist(lv)
    
    // Render pledge card into right panel
    this._renderPledgeCard(lv)
    
    const items = [
      { id: 'intro', icon: '📖', label: 'Overview', sub: 'Mission Briefing' },
      ...lv.hps.map((hp, i) => ({ id: 'rule' + i, icon: '⚖️', label: 'Guideline ' + (i + 1), sub: hp.split(':')[0].substring(0, 24) })),
      { id: 'law', icon: '🏛️', label: 'Legal Penalty', sub: 'Statutory Consequences' },
      { id: 'theory', icon: '📊', label: 'Science', sub: 'Traffic Theory' },
      { id: 'practical', icon: '🎯', label: 'Execution', sub: 'Driving Test' }
    ]
    this._sylItems = items
    this._sylViewed = new Set()
    this._sylLv = lv
    this._lawLang = S.language === 'hi' ? 'hi' : 'en'
    const list = document.getElementById('br-syllabus')
    list.innerHTML = ''
    items.forEach((it) => {
      const el = document.createElement('div')
      el.className = 'syl-item'
      el.id = 'syl-' + it.id
      el.innerHTML = `<div class="syl-ck" id="sylck-${it.id}"></div><div class="syl-info"><div class="syl-lbl">${it.icon} ${it.label}</div><div class="syl-sub">${it.sub}</div></div>`
      el.onclick = () => this._selSyl(it.id)
      list.appendChild(el)
    })
    this._selSyl('intro')
    this.show('screen-briefing', { direction: 'forward' })
  },
  _initModeTabs(lv) {
    const tabs = document.querySelectorAll('#br-mode-tabs .mode-tab')
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => { t.classList.remove('active'); t.style.color = 'var(--muted)'; t.style.background = 'transparent' })
        tab.classList.add('active')
        tab.style.color = 'var(--text)'
        tab.style.background = 'var(--panel)'
        this._currentModeTab = tab.dataset.mode
        this._updateBriefingForMode(lv, tab.dataset.mode)
      }
      // Set initial active state
      if (tab.dataset.mode === 'learn') {
        tab.classList.add('active')
        tab.style.color = 'var(--text)'
        tab.style.background = 'var(--panel)'
      }
    })
    this._currentModeTab = 'learn'
  },
  _updateBriefingForMode(lv, mode) {
    const config = window.COURSE?.getModeConfig?.(lv.id, mode.toUpperCase()) || {}
    const contentEl = document.getElementById('br-content')
    if (!contentEl) return
    
    // Update syllabus based on mode
    const syllabusEl = document.getElementById('br-syllabus')
    const items = this._getSyllabusForMode(lv, mode)
    this._sylItems = items
    
    // Initialize from saved progress if available
    this._sylViewed = new Set((S.sylViewed && S.sylViewed[lv.id]) ? S.sylViewed[lv.id] : [])
    this._sylLv = lv
    syllabusEl.innerHTML = ''
    items.forEach((it) => {
      const el = document.createElement('div')
      el.className = 'syl-item'
      el.id = 'syl-' + it.id
      el.innerHTML = `<div class="syl-ck" id="sylck-${it.id}"></div><div class="syl-info"><div class="syl-lbl">${it.icon} ${it.label}</div><div class="syl-sub">${it.sub}</div></div>`
      if (this._sylViewed.has(it.id)) {
        el.classList.add('syl-done')
      }
      el.onclick = () => this._selSyl(it.id)
      syllabusEl.appendChild(el)
    })
    
    // Auto-select the first item that hasn't been viewed, or the first item if all viewed
    let firstUnviewed = items.find(it => !this._sylViewed.has(it.id))
    this._selSyl(firstUnviewed ? firstUnviewed.id : (items[0]?.id || 'intro'))
    
    // Update rewards preview
    this._renderRewardsPreview(lv, mode, config)
  },
  _getSyllabusForMode(lv, mode) {
    const base = [
      { id: 'intro', icon: '📖', label: 'Overview', sub: 'Mission Briefing' },
      ...lv.hps.map((hp, i) => ({ id: 'rule' + i, icon: '⚖️', label: 'Guideline ' + (i + 1), sub: hp.split(':')[0].substring(0, 24) })),
    ]
    if (mode === 'learn') {
      return [...base, { id: 'law', icon: '🏛️', label: 'Legal Penalty', sub: 'Statutory Consequences' }, { id: 'theory', icon: '📊', label: 'Science', sub: 'Traffic Theory' }]
    } else if (mode === 'practice') {
      return [...base, { id: 'practical', icon: '🎯', label: 'Execution', sub: 'Driving Test' }]
    } else if (mode === 'exam') {
      return [...base, { id: 'exam', icon: '📝', label: 'Assessment', sub: `${window.COURSE?.MODE_CONFIG?.EXAM?.mcqCount || 5} MCQ Questions` }]
    } else if (mode === 'chaos') {
      return [...base, { id: 'chaos', icon: '🌪️', label: 'Chaos Run', sub: 'Adaptive Stress Test' }]
    }
    return base
  },
  _renderModuleChecklist(lv) {
    const moduleId = lv.module?.id || 1
    const progress = window.COURSE?.getModuleProgress?.(S) || []
    const mod = progress.find(p => p.module.id === moduleId)
    const container = document.getElementById('br-module-checklist')
    if (!container || !mod) return
    
    const modes = Object.keys(window.COURSE?.MODES || {})
    
    let html = '<div style="font-size:0.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">MODULE ' + moduleId + ' PROGRESS</div>'
    
    html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">'
    mod.module.levels.forEach(l => {
      modes.forEach((mode, mi) => {
        const done = S.comp?.[l.id]?.modes?.[mode.toLowerCase()] || false
        const modeConfig = window.COURSE?.MODES?.[mode.toUpperCase()]
        const color = modeConfig?.color || '--signal'
        html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:6px 4px;text-align:center;opacity:${done ? 1 : 0.4};transition:all 0.2s;" title="${modeConfig?.label || mode}: ${done ? 'Complete' : 'Incomplete'}">
          <div style="font-size:0.6rem;color:${done ? 'var(--green)' : 'var(--muted)'};font-weight:700;">${done ? '✓' : (mi+1)}</div>
          <div style="font-size:0.55rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.02em;">${modeConfig?.icon || ''}</div>
        </div>`
      })
    })
    html += '</div>'
    container.innerHTML = html
  },
  _renderRewardsPreview(lv, mode, config) {
    const contentEl = document.getElementById('br-content')
    if (!contentEl) return
    
    const xp = config.xpBase || 0
    const streakBonus = config.streakBonus || 0
    const badge = config.badge
    const mysteryChance = 0.15 // 15% variable reinforcement
    
    // Check if this is practical mode - inject rewards panel
    const existingCard = contentEl.querySelector('.bc-card')
    if (existingCard && mode === 'practice') {
      const rewardsHtml = `
        <div style="margin-top:20px;padding:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;">
          <div style="font-size:0.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;display:flex;align-items:center;gap:8px;">🎁 REWARDS PREVIEW</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <div style="flex:1;min-width:120px;padding:12px;background:rgba(94,212,245,0.1);border:1px solid rgba(94,212,245,0.3);border-radius:8px;text-align:center;">
              <div style="font-size:1.5rem;font-weight:800;color:var(--signal);font-family:'Lora',serif;">+${xp} XP</div>
              <div style="font-size:0.7rem;color:var(--muted);text-transform:uppercase;">Base Experience</div>
            </div>
            <div style="flex:1;min-width:120px;padding:12px;background:rgba(242,184,75,0.1);border:1px solid rgba(242,184,75,0.3);border-radius:8px;text-align:center;">
              <div style="font-size:1.5rem;font-weight:800;color:var(--accent);font-family:'Lora',serif;">+${streakBonus}</div>
              <div style="font-size:0.7rem;color:var(--muted);text-transform:uppercase;">Streak Bonus</div>
            </div>
            ${badge ? `<div style="flex:1;min-width:120px;padding:12px;background:rgba(204,155,255,0.1);border:1px solid rgba(204,155,255,0.3);border-radius:8px;text-align:center;">
              <div style="font-size:1.5rem;font-weight:800;color:var(--plasma);font-family:'Lora',serif;">🏅</div>
              <div style="font-size:0.7rem;color:var(--muted);text-transform:uppercase;">Badge: ${badge}</div>
            </div>` : ''}
          </div>
          <div style="margin-top:12px;padding:10px;background:rgba(0,240,204,0.1);border:1px dashed rgba(0,240,204,0.3);border-radius:8px;font-size:0.7rem;color:var(--teal);text-align:center;">
            🎲 Mystery Reward Chance: ${Math.round(mysteryChance * 100)}% — Complete perfectly for a surprise!
          </div>
        </div>
      `
      existingCard.insertAdjacentHTML('beforeend', rewardsHtml)
    }
  },
  showCommitmentPledge(levelId) {
    const lv = LVS.find(l => l.id === levelId)
    if (!lv) return
    
    const modal = document.createElement('div')
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;'
    modal.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;max-width:400px;width:100%;">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:2.5rem;margin-bottom:8px;">🤝</div>
          <h2 style="font-family:'Instrument Serif',serif;font-size:1.5rem;margin:0;">Commitment Pledge</h2>
          <p style="color:var(--muted);font-size:0.9rem;margin-top:8px;">Implementation intention: Plan your if-then strategy</p>
        </div>
        <div style="background:var(--void);border-radius:12px;padding:16px;margin-bottom:16px;">
          <div style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">If I encounter a red signal...</div>
          <input type="text" id="pledge-if" value="I will stop completely and wait for green" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-size:0.9rem;margin-bottom:12px;">
          <div style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Then I will...</div>
          <input type="text" id="pledge-then" value="Not creep forward or rush through" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-size:0.9rem;">
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn" style="flex:1;background:var(--signal);color:#000;font-weight:700;" onclick="ui.savePledge(${levelId}, document.getElementById('pledge-if').value, document.getElementById('pledge-then').value); this.closest('.modal').remove()">Save Pledge</button>
          <button class="btn btn-s" style="flex:1;" onclick="this.closest('.modal').remove()">Cancel</button>
        </div>
      </div>
    `
    modal.className = 'modal'
    document.body.appendChild(modal)
  },
  savePledge(levelId, ifStatement, thenStatement) {
    if (!S.pledges) S.pledges = {}
    S.pledges[levelId] = { if: ifStatement, then: thenStatement, created: Date.now() }
    save()
    toast('🤝 Pledge saved! Your if-then plan is set.', '#5ED4F5')
    // Refresh the pledge card to show completed state
    const lv = LVS.find(l => l.id === levelId)
    if (lv) this._renderPledgeCard(lv)
  },
  _renderPledgeCard(lv) {
    const container = document.getElementById('br-pledge')
    if (!container) return
    const hasPledge = S.pledges && S.pledges[lv.id]
    container.style.display = 'block'
    if (hasPledge) {
      const pledge = S.pledges[lv.id]
      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:12px;">
          <div style="font-size:1.5rem;">🤝</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.8rem;font-weight:700;color:var(--green);">Pledge Active</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-top:2px;">If ${pledge.if || 'red signal'} → Then ${pledge.then || 'stop'}</div>
          </div>
          <button class="btn btn-s" style="padding:6px 14px;font-size:0.7rem;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:8px;cursor:pointer;flex-shrink:0;" onclick="ui.showCommitmentPledge('${lv.id}')">Edit</button>
        </div>`
    } else {
      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:linear-gradient(135deg,rgba(94,212,245,0.08),rgba(242,184,75,0.08));border:1px solid rgba(242,184,75,0.2);border-radius:12px;">
          <div style="font-size:1.5rem;">🤝</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.85rem;font-weight:700;color:var(--text);">Commitment Pledge</div>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:2px;">Set an if-then plan to drive smarter</div>
          </div>
          <button class="btn pulse-btn" style="padding:8px 18px;font-size:0.75rem;background:linear-gradient(90deg,var(--signal),var(--accent));color:#000;font-weight:700;border:none;border-radius:8px;cursor:pointer;flex-shrink:0;white-space:nowrap;box-shadow:0 4px 15px rgba(242,184,75,0.3);" onclick="ui.showCommitmentPledge('${lv.id}')">+ Make Pledge</button>
        </div>`
    }
  },
  _selSyl(id) {
    const lv = this._sylLv,
      items = this._sylItems
    if (!lv) return
    this._disposeBriefingScene()
    ui.curMode = ui.curMode || (lv.modes ? lv.modes[0] : 'car')
    document.querySelectorAll('.syl-item').forEach((el) => el.classList.remove('syl-active'))
    const el = document.getElementById('syl-' + id)
    if (el) el.classList.add('syl-active')
    if (!this._sylViewed.has(id)) {
      this._sylViewed.add(id)
      
      // Persist syllabus progress to S
      if (!S.sylViewed) S.sylViewed = {}
      if (!S.sylViewed[lv.id]) S.sylViewed[lv.id] = []
      if (!S.sylViewed[lv.id].includes(id)) {
        S.sylViewed[lv.id].push(id)
      }
      
      if (!S.started) S.started = {}
      S.started[lv.id] = true

      // Check if all items in syllabus have been viewed, or if user is on practical/exam tab
      const allViewed = items.every(it => S.sylViewed[lv.id].includes(it.id))
      if (allViewed || id === 'practical' || id === 'exam') {
        if (!S.comp) S.comp = {}
        if (!S.comp[lv.id]) {
          S.comp[lv.id] = { score: 100, time: Date.now(), finalQuiz: true, modes: { learn: true } }
        } else {
          S.comp[lv.id].score = Math.max(S.comp[lv.id].score || 0, 100)
          S.comp[lv.id].finalQuiz = true
          if (!S.comp[lv.id].modes) S.comp[lv.id].modes = {}
          S.comp[lv.id].modes.learn = true
        }
      }

      if (typeof save === 'function') save()

      const sylEl = document.getElementById('syl-' + id)
      if (sylEl) sylEl.classList.add('syl-done')
    }
    
    // Always update progress bar
    const pct = Math.round((this._sylViewed.size / items.length) * 100)
    const progFill = document.getElementById('br-prog-fill')
    const progLabel = document.getElementById('br-prog-label')
    if (progFill) progFill.style.width = pct + '%'
    if (progLabel) progLabel.textContent = pct + '%'
    const rContainer = document.querySelector('.br-r')
    if (rContainer) {
      if (id === 'practical') {
        rContainer.style.marginTop = '45px'
      } else {
        rContainer.style.marginTop = '118px'
      }
    }
    const c = document.getElementById('br-content')
    c.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'bc-card'
    if (id === 'intro') {
      card.innerHTML = `<div class="bc-ttl">📖 Module Overview</div>
     <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(1.6rem, 4vw, 2.5rem);color:var(--yellow);margin-bottom:8px">${lv.name}</div>
     <div style="font-size:clamp(0.95rem, 2vw, 1.35rem);color:var(--muted2);line-height:1.5;margin-bottom:16px">${lv.ds}</div>
     <div class="stat-row">
       <div class="stat-box"><div class="stat-val">${lv.hps.length}</div><div class="stat-lbl">Mandates</div></div>
       <div class="stat-box"><div class="stat-val">${lv.law.fine}</div><div class="stat-lbl">Penalty</div></div>
     </div>`
    } else if (id.startsWith('rule')) {
      const idx = parseInt(id.replace('rule', ''))
      const hp = lv.hps[idx]
      let hpTitle = hp,
        hpDesc = ''
      if (hp.includes(':')) {
        const parts = hp.split(':')
        hpTitle = parts[0]
        hpDesc = parts.slice(1).join(':').trim()
      }
      card.innerHTML = `<div class="bc-ttl" style="text-align:center;">⚖️ Regulatory Requirement</div>
          <div class="bc-rule-pill" style="display:block; text-align:center; margin:12px auto 20px; padding:6px 16px; background:rgba(242,184,75,0.15); color:var(--signal); border-radius:12px; font-weight:800; font-size:0.9rem; letter-spacing:1.5px; text-transform:uppercase;">Clause ${idx + 1}</div>
          <div class="bc-rule-txt" style="text-align:center; font-family:'Lora', serif; font-size:clamp(1.6rem, 4vw, 2.4rem); color:var(--ink); line-height:1.3; font-weight:700; max-width:600px; margin:0 auto;">${hpTitle}</div>
          ${hpDesc ? `<div style="margin-top:20px; text-align:center; font-family:'Inter', sans-serif; font-size:clamp(1rem, 2vw, 1.2rem); color:var(--dim); line-height:1.7; max-width:540px; margin:20px auto 0;">${hpDesc}</div>` : ''}
          <div class="bc-next-btn" style="display:flex;justify-content:space-between; margin-top:32px; padding-top:20px; border-top:1px solid var(--line);"><button class="btn btn-s" style="background:transparent; border:1px solid var(--line); color:var(--ink);" onclick="ui._selSyl('${idx > 0 ? 'rule' + (idx - 1) : 'intro'}')">${'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>'} Previous</button>${idx < lv.hps.length - 1 ? `<button class="btn" style="background:var(--ink); color:var(--void);" onclick="ui._selSyl('rule${idx + 1}')">Next Clause &rarr;</button>` : `<button class="btn" style="background:var(--signal); color:#000;" onclick="ui._selSyl('law')">Legal Framework &rarr;</button>`}</div>`
    } else if (id === 'law') {
      const lawEn = lv.law
      const lawHi = { sec: lv.law.secHi || lv.law.sec, fine: lv.law.fineHi || lv.law.fine, off: lv.law.offHi || lv.law.off }
      this._lawLang = this._lawLang || (S.language === 'hi' ? 'hi' : 'en')
      const d = this._lawLang === 'hi' ? lawHi : lawEn
      const langLabel = this._lawLang === 'hi' ? 'English' : 'हिन्दी'
      card.innerHTML = `<div class="bc-ttl" style="text-align:center;">🏛️ Statutory Provisions / कानूनी प्रावधान</div>
          <div style="text-align:center; margin:12px auto;"><button class="btn btn-s" style="background:rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.1); color:var(--ink); font-size:0.85rem; padding:6px 16px; border-radius:8px;" onclick="ui._lawLang=ui._lawLang==='hi'?'en':'hi'; ui._selSyl('law')">${langLabel}</button></div>
          <div class="lb" style="text-align:center; margin:16px auto; max-width:500px;"><div class="ls" style="font-size:1.3rem; font-weight:800;">${d.sec}</div><div class="lt" style="font-size:1.1rem; margin-top:8px;">${d.off}</div></div>
          <div class="fr" style="text-align:center; max-width:400px; margin:20px auto;"><div class="fl" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">Fine / जुर्माना</div><div class="fa" style="font-size:2.4rem; font-weight:800;">${d.fine}</div></div>
     <div class="bc-next-btn" style="display:flex;justify-content:space-between;"><button class="btn btn-s" onclick="ui._selSyl('rule'+(lv.hps.length-1))"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Previous</button><button onclick="ui._selSyl('theory')">Concepts &rarr;</button></div>`
    } else if (id === 'theory') {
      const bracket = this.getAgeBracket()
      const isYoung = bracket === 'child' || bracket === 'teen'
      this._theoryLang = this._theoryLang || (S.language === 'hi' ? 'hi' : 'en')
      const theoryLabel = isYoung ? '📊 Simple Explanation' : '📊 Analytical Model'
      const theoryHint = isYoung ? '<div style="text-align:center; font-size:0.85rem; color:var(--signal); margin-bottom:8px; font-weight:600;">Easy version for young drivers</div>' : ''
      const langLabel = this._theoryLang === 'hi' ? 'English' : 'हिन्दी'

      // Get theory content based on language
      let theoryContent = lv.theory || ''
      if (this._theoryLang === 'hi' && lv.theoryHi) {
        theoryContent = lv.theoryHi
      }

      card.innerHTML = `<div class="bc-ttl" style="text-align:center;">${theoryLabel}</div>${theoryHint}
          <div style="text-align:center; margin:12px auto;"><button class="btn btn-s" style="background:rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.1); color:var(--ink); font-size:0.85rem; padding:6px 16px; border-radius:8px;" onclick="ui._theoryLang=ui._theoryLang==='hi'?'en':'hi'; ui._selSyl('theory')">${langLabel}</button></div>
          <div class="dw">${this._diag(lv.id)}</div><div style="text-align:center; font-size:clamp(1rem, 2.2vw, 1.3rem);line-height:1.7;color:var(--muted2);margin:16px auto; max-width:580px; font-family:'Lora', serif;">${theoryContent}</div>
     <div class="bc-next-btn" style="display:flex;justify-content:space-between;"><button class="btn btn-s" onclick="ui._selSyl('law')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Previous</button><button onclick="ui._selSyl('practical')">Execution &rarr;</button></div>`
    } else if (id === 'practical') {
      const preferredMode = this.curMode
      const btnsHTML = (lv.modes || ['car'])
        .map((m) => {
          const icons = { car: '🚗', bike: '🏍️', auto: '🛺', truck: '🚛', bus: '🚌', pedestrian: '🚶' }
          const isPreferred = m === preferredMode
          return `<button class="btn" data-mode="${m}" style="flex:1; min-width:80px; text-transform:capitalize; background:${isPreferred ? 'var(--accent, #D97706)' : 'var(--panel, rgba(0,0,0,0.04))'}; border:1px solid ${isPreferred ? 'var(--accent, #D97706)' : 'var(--line, rgba(0,0,0,0.08))'}; color:${isPreferred ? '#fff' : 'var(--ink, #111827)'}; font-weight:700; padding:10px 8px; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:4px; transition:0.2s;" onmouseover="this.style.background='${isPreferred ? 'var(--accent, #D97706)' : 'var(--line)'}'" onmouseout="this.style.background='${isPreferred ? 'var(--accent, #D97706)' : 'var(--panel)'}'" onclick="ui.selectMode('${m}')"><span style="font-size:1.3rem;">${icons[m] || '🚗'}</span><span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">${m}${isPreferred ? ' ✓' : ''}</span></button>`
        })
        .join('')
      const finalBtn = `<button class="btn" style="background:var(--accent, #D97706); color:#fff; font-weight:bold; padding:12px 24px; border-radius:12px; box-shadow:0 4px 16px rgba(217,119,6,0.3); font-size:0.9rem;" onclick="ui.dispatchStart()">START MODULE &rarr;</button>`
      card.innerHTML = `<div class="bc-ttl">🎯 Practical Execution</div>
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom: 20px;">
        
        <!-- Objective Banner -->
        <div class="pract-banner" style="background:var(--panel, rgba(255,255,255,0.05)); padding:16px; border-radius:16px; border:1px solid var(--line, rgba(255,255,255,0.1)); display:flex; align-items:center; gap:16px;">
          <div class="pract-icon-big" style="font-size:3rem;line-height:1;">${lv.icon}</div>
          <div style="flex:1;">
            <div style="font-size:1.4rem;font-family:var(--serif,'Instrument Serif'),serif;font-style:italic;font-weight:700; color:var(--accent, #D97706);">${lv.name}</div>
            <div style="font-size:0.95rem;color:var(--ink, #111827);line-height:1.4;margin-top:4px;">${lv.pract}</div>
          </div>
        </div>

        <!-- Visual Tutorial -->
        <div style="position:relative; width:100%; border-radius:16px; overflow:hidden; border:1px solid var(--line, rgba(255,255,255,0.1)); background:var(--void2, rgba(0,0,0,0.2));">
          ${this._simAnim(lv)}
        </div>
        
        <!-- Controls & Penalty Row -->
        <div style="display:flex; flex-wrap:wrap; gap:16px;">
          
          <!-- Controls -->
          <div style="flex:1; min-width:240px; background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px;">
            <div style="color:var(--dim, #6B7280); font-size:0.8rem; font-weight:700; text-transform:uppercase; margin-bottom:12px;">🕹️ Controls</div>
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
               <div style="display:flex; gap:4px;">
                 <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.1)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">W</kbd>
                 <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.1)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">A</kbd>
                 <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.1)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">S</kbd>
                 <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.1)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">D</kbd>
               </div>
               <span style="font-size:0.85rem; color:var(--dim);">Drive</span>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.1)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">SPACE</kbd>
               <span style="font-size:0.85rem; color:var(--dim);">Brake</span>
            </div>
          </div>
          
          <!-- Penalty -->
          <div style="flex:1; min-width:240px; background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.75rem; color:var(--dim, #9CA3AF); text-transform:uppercase; font-weight:700; margin-bottom:4px;">Penalty Risk</div>
              <div style="font-size:0.95rem; color:var(--ink, #111827); font-weight:600;">${lv.law.off}</div>
            </div>
            <div style="text-align:right; border-left:1px solid var(--line, rgba(255,255,255,0.1)); padding-left:16px;">
              <div style="font-size:0.75rem; color:var(--dim, #9CA3AF); text-transform:uppercase; font-weight:700; margin-bottom:4px;">Fine</div>
              <div style="font-size:1.3rem; color:var(--red, #EF4444); font-weight:800; line-height:1;">${lv.law.fine}</div>
            </div>
          </div>
        </div>
        
        <!-- Vehicle Selection -->
        <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px;">
           <div style="font-size:0.8rem; color:var(--dim, #9CA3AF); text-transform:uppercase; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:8px;">🚗 Vehicle</div>
           <div id="br-vehicle-list" style="display:flex; gap:8px; flex-wrap:wrap;">
             ${(window.COURSE?.VEHICLES || []).map(v => {
               const sel = v.id === (S.vehicle?.toLowerCase() || '')
               const rec = window.COURSE?.getRecommendedVehicle?.(lv.id) === v.id
               return `<div style="flex:1;min-width:100px;padding:12px;background:${sel ? 'rgba(242,184,75,0.15)' : 'var(--card)'};border:2px solid ${sel ? 'var(--accent)' : (rec ? 'var(--signal)' : 'var(--border)')};border-radius:12px;text-align:center;cursor:pointer;transition:all 0.2s;"
                    onmouseover="this.style.background='var(--hover)'" onmouseout="this.style.background='${sel ? 'rgba(242,184,75,0.15)' : 'var(--card)'}'"
                    onclick="ui._selectVehicle('${v.id}')">
                 <div style="font-size:1.6rem;line-height:1;">${v.icon || '🚗'}</div>
                 <div style="font-size:0.8rem;font-weight:700;color:var(--text);margin-top:4px;">${v.name || v.id}</div>
                 ${rec ? '<div style="font-size:0.6rem;color:var(--signal);font-weight:700;margin-top:2px;">✓ Recommended</div>' : ''}
                 ${sel ? '<div style="font-size:0.6rem;color:var(--accent);font-weight:700;margin-top:2px;">Selected</div>' : ''}
               </div>`
             }).join('')}
           </div>
        </div>
        
        <!-- Practice Modes -->
        <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px;">
           <div style="font-size:0.8rem; color:var(--dim, #9CA3AF); text-transform:uppercase; font-weight:700; margin-bottom:12px;">📝 Practice Run (2D Simulation)</div>
           <div style="display:flex; gap:10px; flex-wrap:wrap;">${btnsHTML}</div>
        </div>
        
        <div style="font-size:0.8rem;color:var(--accent, #D97706); background:rgba(217,119,6,0.1); padding:10px 16px; border-radius:8px; border-left:3px solid var(--accent, #D97706);">Note: A PERFECT drive (no violations/damage) is required to avoid penalty on retry.</div>
      </div>
      
      <!-- Launch -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line, rgba(0,0,0,0.1)); padding-top:16px;">
        <button class="btn btn-s" onclick="ui._selSyl('theory')" style="padding:8px 16px; background:var(--panel); border:1px solid var(--line); color:var(--ink); border-radius:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Prev</button>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div style="font-size:0.75rem; color:var(--dim, #6B7280);">Ready for the real test?</div>
          ${finalBtn}
        </div>
      </div>`
    }
    c.appendChild(card)
    if (id === 'practical') {
      // Use 2D CSS Art instead of 3D Scene
      requestAnimationFrame(() => this._initBriefingArt(lv))
    }
  },
  _diag(id) {
    const lv = LVS.find((l) => l.id === id)
    if (!lv) return ''
    return `<div style="background:${lv.gr};border-radius:14px;padding:clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 30px);margin-bottom:16px;display:flex;align-items:center;gap:clamp(12px, 3vw, 24px)">
     <div style="font-size:clamp(2.5rem, 5vw, 4.5rem)">${lv.icon}</div>
     <div>
       <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(1.2rem, 2.5vw, 2rem);color:#fff;letter-spacing:.05em">${lv.name}</div>
       <div style="font-size:clamp(0.8rem, 1.5vw, 1.1rem);color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.08em">${lv.v} · Fine: ${lv.law.fine}</div>
     </div></div>`
  },
  _simAnim(lv) {
    return `<div id="briefing-canvas-wrap" style="position:relative; width:100%; height:clamp(200px, 32vw, 280px); border-radius:20px; overflow:hidden; border:1px solid rgba(0,0,0,0.06); background:#1a1f2e;">
          <div style="position:absolute; top:12px; left:12px; color:var(--muted2, #6B7280); font-size:0.7rem; font-weight:800; opacity:0.9; z-index:10; background:rgba(255,255,255,0.75); padding:6px 14px; border-radius:8px; letter-spacing:1.2px; backdrop-filter:blur(8px); border:1px solid rgba(0,0,0,0.06); font-family:'Space Mono',monospace;">🎬 SCENARIO DEMO</div>
        </div>`
  },
  _initBriefingArt(lv) {
    const wrap = document.getElementById('briefing-canvas-wrap');
    if (!wrap) return;
    const theme = lv.themeType || 'default';

    // ── Shared CSS building blocks ──
    const road = (w, l, b) => `position:absolute; bottom:${b||40}px; left:${l||0}; width:${w||'100%'}; height:60px; background:#3d3f45; border-top:4px solid #fff; border-bottom:4px solid #fff;`;
    const zebra = `position:absolute; top:0; left:50%; transform:translateX(-50%); width:60px; height:60px; background:repeating-linear-gradient(90deg,#fff 0,#fff 10px,transparent 10px,transparent 20px);`;
    const sidewalk = `position:absolute; bottom:100px; left:0; width:100%; height:18px; background:#6b7280;`;
    const nightBg = `background:rgba(0,0,30,0.35);`;
    const badge = `<div style="position:absolute;top:12px;left:12px;color:var(--muted2,#6B7280);font-size:.7rem;font-weight:800;opacity:.9;z-index:10;background:rgba(255,255,255,.75);padding:6px 14px;border-radius:8px;letter-spacing:1.2px;backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,.06);font-family:'Space Mono',monospace;">🎬 SCENARIO DEMO</div>`;

    // ── Keyframes (collected, injected once) ──
    const K = `
      @keyframes ba{from{left:-15%}to{left:115%}}
      @keyframes ab{from{left:115%}to{left:-15%}}
      @keyframes ped{0%{left:15%}100%{left:70%}}
      @keyframes ped2{0%{left:70%}100%{left:15%}}
      @keyframes carStop{0%{left:85%}40%{left:62%}100%{left:62%}}
      @keyframes carStopR{0%{right:85%}40%{right:62%}100%{right:62%}}
      @keyframes pullOver{0%{transform:translateY(0)}40%{transform:translateY(-8px)}100%{transform:translateY(-8px)}}
      @keyframes slow{from{left:-20%}to{left:120%}}
      @keyframes weave{0%{left:30%;transform:translateY(0)}25%{left:50%;transform:translateY(-6px)}50%{left:35%;transform:translateY(4px)}75%{left:55%;transform:translateY(-4px)}100%{left:30%;transform:translateY(0)}}
      @keyframes rain{0%{top:-20px;opacity:1}100%{top:220px;opacity:.3}}
      @keyframes splash{0%{transform:scaleX(1)}50%{transform:scaleX(1.6)}100%{transform:scaleX(1)}}
      @keyframes flash{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes siren{0%,100%{color:#f44}50%{color:#48f}}
      @keyframes fogPulse{0%{opacity:.5}100%{opacity:.85}}
      @keyframes wiper{0%{transform:rotate(-30deg)}50%{transform:rotate(30deg)}100%{transform:rotate(-30deg)}}
      @keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
      @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      @keyframes drift{0%{transform:translateX(0)}50%{transform:translateX(6px)}100%{transform:translateX(0)}}
      @keyframes honk{0%,80%,100%{opacity:0}85%{opacity:1}95%{opacity:1}}
      @keyframes merge{0%{left:20%}50%{left:42%}100%{left:20%}}
    `;

    // ── Theme art map ──
    const A = {};

    // 1. PEDESTRIAN COURTESY — school zone, zebra crossing, traffic light, walking peds, car braking
    A.pedestrian_courtesy = () => `
      <div style="${road()}">${`<div style="${zebra}"></div>`}</div>
      <div style="position:absolute;top:30%;left:10%;width:28px;height:64px;background:#222;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:4px 0;">
        <div style="width:16px;height:16px;border-radius:50%;background:#f33;box-shadow:0 0 6px #f33;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#555;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#555;"></div>
      </div>
      <div style="position:absolute;top:20px;right:40px;font-size:4rem;">🏫</div>
      <div style="position:absolute;bottom:55px;left:20%;font-size:1.8rem;animation:ped 3.5s infinite alternate;">🚶</div>
      <div style="position:absolute;bottom:58px;left:26%;font-size:1.4rem;animation:ped 2.8s infinite alternate;">🚶‍♀️</div>
      <div style="position:absolute;bottom:50px;font-size:2.4rem;animation:carStop 4s infinite ease-out;">🚗</div>`;

    // 2. AMBULANCE PRIORITY — ambulance rushing, cars pulling over
    A.ambulance_priority = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:48px;font-size:2.6rem;animation:ab 3.5s infinite linear;">🚑<span style="position:absolute;top:-18px;left:8px;font-size:.9rem;animation:flash .4s infinite;">🚨</span></div>
      <div style="position:absolute;bottom:48px;left:35%;font-size:2rem;animation:pullOver 4s infinite ease-out;">🚗</div>
      <div style="position:absolute;bottom:48px;left:58%;font-size:2rem;animation:pullOver 4s infinite ease-out .6s;">🚕</div>`;

    // 3. MARKET STREET — market tents, auto, pedestrians
    A.market_street = () => `
      <div style="${road()}"></div>
      <div style="${sidewalk}"></div>
      <div style="position:absolute;top:30px;left:8%;font-size:2.8rem;">🎪</div>
      <div style="position:absolute;top:30px;left:30%;font-size:2.8rem;">🏪</div>
      <div style="position:absolute;top:30px;left:52%;font-size:2.8rem;">🛒</div>
      <div style="position:absolute;bottom:48px;font-size:2rem;animation:slow 6s infinite linear;">🛺</div>
      <div style="position:absolute;bottom:48px;left:45%;font-size:1.8rem;animation:slow 7s infinite linear -2s;">🚗</div>
      <div style="position:absolute;bottom:105px;left:18%;font-size:1.3rem;animation:ped 3s infinite alternate;">🚶</div>
      <div style="position:absolute;bottom:105px;left:62%;font-size:1.3rem;animation:ped2 3.2s infinite alternate;">🚶‍♀️</div>`;

    // 4. STREET PARKING — cars parked, one pulling into spot
    A.street_parking = () => `
      <div style="${road()}"></div>
      <div style="${sidewalk}"></div>
      <div style="position:absolute;bottom:42px;left:12%;width:45px;height:18px;background:#2a2d35;border:2px dashed #888;border-radius:4px;"></div>
      <div style="position:absolute;bottom:42px;left:30%;width:45px;height:18px;background:#2a2d35;border:2px dashed #888;border-radius:4px;"></div>
      <div style="position:absolute;bottom:44px;left:13%;font-size:1.6rem;">🚙</div>
      <div style="position:absolute;bottom:44px;left:31%;font-size:1.6rem;">🚗</div>
      <div style="position:absolute;bottom:104px;left:50%;font-size:2.2rem;animation:carStop 5s infinite ease-out;">🚗</div>
      <div style="position:absolute;top:30px;right:30px;font-size:2.4rem;">🅿️</div>`;

    // 5. PUDDLE ETIQUETTE — rain, puddle, car driving carefully around
    A.puddle_etiquette = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:48px;left:42%;width:70px;height:20px;background:rgba(80,140,255,.45);border-radius:50%;animation:splash 2s infinite;"></div>
      ${[15,30,50,65,80].map(x=>`<div style="position:absolute;left:${x}%;width:2px;height:14px;background:rgba(120,180,255,.5);border-radius:0 0 2px 2px;animation:rain .8s infinite linear ${x*.02}s;"></div>`).join('')}
      <div style="position:absolute;bottom:48px;left:15%;font-size:2.2rem;animation:slow 5s infinite linear;">🚗</div>
      <div style="position:absolute;top:25px;right:40px;font-size:2rem;">🌧️</div>`;

    // 6. RESPECTFUL PARKING — hospital nearby, car parked neatly, green check
    A.respectful_parking = () => `
      <div style="${road()}"></div>
      <div style="${sidewalk}"></div>
      <div style="position:absolute;top:20px;right:30px;font-size:3.5rem;">🏥</div>
      <div style="position:absolute;bottom:42px;left:20%;width:50px;height:18px;background:#2a2d35;border:2px solid #4a4; border-radius:4px;"></div>
      <div style="position:absolute;bottom:44px;left:21%;font-size:1.5rem;">🚗</div>
      <div style="position:absolute;bottom:58px;left:28%;font-size:1.2rem;color:#4a4;">✓</div>
      <div style="position:absolute;bottom:48px;left:55%;font-size:2rem;animation:slow 5s infinite linear;">🚑</div>`;

    // 7. SILENT ZONE — hospital, mute symbol, car creeping
    A.silent_zone = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;top:15px;left:30%;font-size:3.5rem;">🏥</div>
      <div style="position:absolute;top:20px;left:58%;font-size:2.5rem;">🔇</div>
      <div style="position:absolute;bottom:48px;left:45%;font-size:2rem;animation:slow 7s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:104px;left:32%;font-size:1.5rem;opacity:.4;">📢</div>
      <div style="position:absolute;bottom:110px;left:38%;font-size:1rem;color:#f66;">✕</div>`;

    // 8. NO HONKING — muted speaker, library/temple, no-honk sign
    A.no_honking = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;top:15px;left:20%;font-size:3rem;">📚</div>
      <div style="position:absolute;top:15px;right:25%;font-size:3rem;">🛕</div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;border:4px solid #f44;display:flex;align-items:center;justify-content:center;font-size:1.4rem;background:rgba(255,0,0,.08);">🔇</div>
      <div style="position:absolute;bottom:48px;left:30%;font-size:2rem;animation:slow 6s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:65px;left:38%;font-size:1rem;animation:honk 3s infinite;">💬HONK</div>`;

    // 9. FESTIVAL — bunting, decorations, crowd, slow traffic
    A.festival = () => `
      <div style="${road()}"></div>
      <div style="${sidewalk}"></div>
      <div style="position:absolute;top:25px;left:10%;font-size:2.5rem;">🎪</div>
      <div style="position:absolute;top:25px;right:20%;font-size:2.5rem;">🪔</div>
      <div style="position:absolute;top:20px;left:40%;font-size:1.8rem;">🎉</div>
      <div style="position:absolute;top:30px;left:55%;font-size:1.5rem;animation:bounce 1.5s infinite;">🎊</div>
      <div style="position:absolute;bottom:105px;left:15%;font-size:1.2rem;animation:drift 2s infinite;">🚶</div>
      <div style="position:absolute;bottom:105px;left:35%;font-size:1.2rem;animation:drift 2.5s infinite .3s;">🚶‍♀️</div>
      <div style="position:absolute;bottom:105px;left:55%;font-size:1.2rem;animation:drift 1.8s infinite .6s;">🚶</div>
      <div style="position:absolute;bottom:105px;left:72%;font-size:1.2rem;animation:drift 2.2s infinite .9s;">🚶‍♂️</div>
      <div style="position:absolute;bottom:48px;font-size:2rem;animation:slow 8s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:48px;left:35%;font-size:1.8rem;animation:slow 9s infinite linear -3s;">🛺</div>`;

    // 10. SIGNAL JUMP — traffic light red, car zooming past
    A.signal_jump = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;top:30%;left:42%;width:36px;height:80px;background:#222;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:6px 0;">
        <div style="width:20px;height:20px;border-radius:50%;background:#f33;box-shadow:0 0 8px #f33;"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:#555;"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:#555;"></div>
      </div>
      <div style="position:absolute;bottom:48px;font-size:2.4rem;animation:ba 2.5s infinite linear;">🚗<span style="position:absolute;top:-12px;right:-5px;font-size:1rem;">⚡</span></div>
      <div style="position:absolute;bottom:110px;left:48%;font-size:1.5rem;animation:flash .6s infinite;">❗</div>`;

    // 11. ROAD RAGE — two cars close, angry emoji, swerving
    A.road_rage = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:48px;left:30%;font-size:2.2rem;animation:ba 3s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:48px;left:22%;font-size:2rem;animation:ba 2.8s infinite linear .2s;">🚕</div>
      <div style="position:absolute;bottom:80px;left:28%;font-size:1.8rem;animation:bounce .5s infinite;">😡</div>
      <div style="position:absolute;bottom:85px;left:36%;font-size:1.2rem;color:#f44;">❗❗</div>`;

    // 12. RAIN DRIVING — heavy rain, headlights, wiper
    A.rain_driving = () => `
      <div style="${road()};background:#2d2f35;"></div>
      ${[10,18,26,34,42,50,58,66,74,82].map(x=>`<div style="position:absolute;left:${x}%;width:2px;height:18px;background:rgba(100,160,255,.5);border-radius:0 0 2px 2px;animation:rain .6s infinite linear ${x*.015}s;"></div>`).join('')}
      <div style="position:absolute;bottom:48px;left:35%;font-size:2.4rem;">🚗</div>
      <div style="position:absolute;bottom:54px;left:37%;width:12px;height:6px;background:rgba(255,255,150,.7);border-radius:2px;"></div>
      <div style="position:absolute;bottom:54px;left:52%;width:12px;height:6px;background:rgba(255,255,150,.7);border-radius:2px;"></div>
      <div style="position:absolute;bottom:60px;left:42%;width:2px;height:16px;background:#fff;transform-origin:bottom;animation:wiper 1.5s infinite;"></div>
      <div style="position:absolute;top:20px;right:30px;font-size:2rem;">⛈️</div>`;

    // 13. PEDESTRIAN PRIORITY — zebra crossing, ped walking, car stopped, green signal
    A.pedestrian_priority = () => `
      <div style="${road()}">${`<div style="${zebra}"></div>`}</div>
      <div style="position:absolute;top:25%;left:42%;width:30px;height:60px;background:#222;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:4px 0;">
        <div style="width:16px;height:16px;border-radius:50%;background:#555;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#555;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#4f4;box-shadow:0 0 6px #4f4;"></div>
      </div>
      <div style="position:absolute;bottom:55px;left:45%;font-size:2rem;animation:ped 4s infinite alternate;">🚶</div>
      <div style="position:absolute;bottom:48px;font-size:2.2rem;animation:carStop 5s infinite ease-out;">🚗</div>`;

    // 14. SIGNS — road with multiple traffic signs
    A.signs = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:100px;left:15%;width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-bottom:32px solid #fc0;transform:rotate(0deg);"></div>
      <div style="position:absolute;bottom:108px;left:19%;font-size:.7rem;font-weight:900;color:#000;">40</div>
      <div style="position:absolute;bottom:100px;left:45%;width:34px;height:34px;background:#f44;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:.65rem;color:#fff;font-weight:900;">STOP</div>
      <div style="position:absolute;bottom:100px;right:18%;width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:28px solid #fc0;transform:rotate(90deg);"></div>
      <div style="position:absolute;bottom:108px;right:20%;font-size:.6rem;">⚠️</div>
      <div style="position:absolute;bottom:48px;font-size:2rem;animation:ba 5s infinite linear;">🚗</div>`;

    // 15. ANIMALS — cow on road, car stopped
    A.animals = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:48px;left:45%;font-size:2.8rem;">🐄</div>
      <div style="position:absolute;bottom:55px;left:55%;font-size:1rem;">🪰</div>
      <div style="position:absolute;bottom:48px;font-size:2.2rem;animation:carStop 4s infinite ease-out;">🚗</div>
      <div style="position:absolute;top:25px;left:25%;font-size:2rem;">🌾</div>
      <div style="position:absolute;top:25px;right:25%;font-size:2rem;">🌾</div>`;

    // 16. NARROW STREET — buildings close, car squeezing through
    A.narrow_street = () => `
      <div style="${road('45%',null,null)}"></div>
      <div style="position:absolute;bottom:40px;left:55%;width:45%;height:60px;background:#3d3f45;border-top:4px solid #fff;border-bottom:4px solid #fff;"></div>
      <div style="position:absolute;bottom:100px;left:2%;font-size:2.5rem;">🏠</div>
      <div style="position:absolute;bottom:100px;left:18%;font-size:2.5rem;">🏘️</div>
      <div style="position:absolute;bottom:100px;right:5%;font-size:2.5rem;">🏠</div>
      <div style="position:absolute;bottom:100px;right:20%;font-size:2.5rem;">🏘️</div>
      <div style="position:absolute;bottom:48px;left:42%;font-size:1.8rem;animation:ba 6s infinite linear;">🚗</div>`;

    // 17. PARKING RULES — marked bays, one correct, one wrong
    A.parking_rules = () => `
      <div style="${road()}"></div>
      <div style="${sidewalk}"></div>
      <div style="position:absolute;bottom:42px;left:12%;width:48px;height:18px;background:#2a2d35;border:2px solid #4a4;border-radius:4px;"></div>
      <div style="position:absolute;bottom:44px;left:13%;font-size:1.4rem;">🚗</div>
      <div style="position:absolute;bottom:56px;left:18%;font-size:.9rem;color:#4a4;">✓</div>
      <div style="position:absolute;bottom:42px;left:35%;width:48px;height:18px;background:#2a2d35;border:2px dashed #f44;border-radius:4px;"></div>
      <div style="position:absolute;bottom:44px;left:36%;font-size:1.4rem;transform:rotate(8deg);">🚙</div>
      <div style="position:absolute;bottom:56px;left:41%;font-size:.9rem;color:#f44;">✗</div>
      <div style="position:absolute;top:25px;right:30px;font-size:2.5rem;">🅿️</div>
      <div style="position:absolute;bottom:48px;left:55%;font-size:2rem;animation:slow 6s infinite linear;">🚗</div>`;

    // 18. AUTO DANCE — auto-rickshaw weaving between cars
    A.auto_dance = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:48px;left:25%;font-size:2rem;">🚗</div>
      <div style="position:absolute;bottom:48px;left:60%;font-size:2rem;">🚕</div>
      <div style="position:absolute;bottom:48px;font-size:2.2rem;animation:weave 4s infinite ease-in-out;">🛺</div>`;

    // 19. TOLL — toll booth, car stopped, queue
    A.toll = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:40px;left:48%;width:50px;height:65px;background:#555;border-radius:4px 4px 0 0;display:flex;align-items:center;justify-content:center;">
        <div style="width:20px;height:24px;background:#333;border-radius:3px;"></div>
      </div>
      <div style="position:absolute;bottom:70px;left:51%;font-size:1.3rem;">💳</div>
      <div style="position:absolute;bottom:48px;left:25%;font-size:2rem;animation:carStop 5s infinite ease-out;">🚗</div>
      <div style="position:absolute;bottom:48px;left:5%;font-size:1.8rem;animation:slow 8s infinite linear -3s;">🚙</div>
      <div style="position:absolute;bottom:48px;left:-10%;font-size:1.8rem;animation:slow 9s infinite linear -5s;">🚕</div>`;

    // 20. BLIND CORNER — curved road, warning sign, car approaching
    A.blind_corner = () => `
      <div style="position:absolute;bottom:40px;left:0;width:55%;height:60px;background:#3d3f45;border-top:4px solid #fff;border-bottom:4px solid #fff;border-radius:0 30px 30px 0;"></div>
      <div style="position:absolute;bottom:40px;right:0;width:50%;height:60px;background:#3d3f45;border-top:4px solid #fff;border-bottom:4px solid #fff;border-radius:30px 0 0 30px;transform:rotate(-15deg);transform-origin:left center;"></div>
      <div style="position:absolute;bottom:110px;left:42%;font-size:2rem;">⚠️</div>
      <div style="position:absolute;bottom:48px;left:15%;font-size:2rem;animation:ba 4s infinite linear;">🚗</div>
      <div style="position:absolute;top:25px;right:30px;font-size:1.5rem;">👁️‍🗨️</div>`;

    // 21. HILL DRIVING — inclined road, mountain backdrop, car climbing
    A.hill_driving = () => `
      <div style="position:absolute;bottom:30px;left:0;width:110%;height:60px;background:#3d3f45;border-top:4px solid #fff;border-bottom:4px solid #fff;transform:rotate(-8deg);transform-origin:left bottom;"></div>
      <div style="position:absolute;top:10px;right:20%;font-size:4rem;">⛰️</div>
      <div style="position:absolute;top:25px;left:15%;font-size:3rem;">🏔️</div>
      <div style="position:absolute;bottom:68px;left:20%;font-size:2rem;animation:ba 5s infinite linear;">🚗</div>`;

    // 22. BUS STOP — bus shelter, bus stopped, passengers waiting
    A.bus_stop = () => `
      <div style="${road()}"></div>
      <div style="${sidewalk}"></div>
      <div style="position:absolute;bottom:100px;left:20%;width:70px;height:30px;background:#555;border-radius:4px 4px 0 0;border-bottom:3px solid #888;"></div>
      <div style="position:absolute;bottom:105px;left:22%;font-size:1rem;">🪑</div>
      <div style="position:absolute;bottom:100px;left:33%;font-size:1rem;animation:drift 2s infinite;">🚶</div>
      <div style="position:absolute;bottom:100px;left:38%;font-size:1rem;animation:drift 2.5s infinite .4s;">🚶‍♀️</div>
      <div style="position:absolute;bottom:48px;left:18%;font-size:2.4rem;animation:slow 6s infinite linear;">🚌</div>
      <div style="position:absolute;bottom:48px;left:60%;font-size:2rem;animation:ba 4s infinite linear;">🚗</div>`;

    // 23. CONSTRUCTION — barricades, worker, car detouring
    A.construction = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:52px;left:35%;width:30px;height:10px;background:repeating-linear-gradient(90deg,#f90 0,#f90 6px,#fff 6px,#fff 12px);border-radius:2px;"></div>
      <div style="position:absolute;bottom:52px;left:50%;width:30px;height:10px;background:repeating-linear-gradient(90deg,#f90 0,#f90 6px,#fff 6px,#fff 12px);border-radius:2px;"></div>
      <div style="position:absolute;bottom:58px;left:40%;font-size:1.8rem;">🚧</div>
      <div style="position:absolute;bottom:100px;left:45%;font-size:1.8rem;">👷</div>
      <div style="position:absolute;bottom:48px;left:15%;font-size:2rem;animation:ba 5s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:108px;left:55%;font-size:1.2rem;">➡️</div>`;

    // 24. ONE WAY — road with big arrow, wrong-way car
    A.one_way = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:55px;left:40%;font-size:3rem;opacity:.3;">➡️</div>
      <div style="position:absolute;bottom:48px;font-size:2.2rem;animation:ba 4s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:48px;left:60%;font-size:2rem;animation:ab 3.5s infinite linear;">🚙</div>
      <div style="position:absolute;bottom:80px;left:62%;font-size:1.2rem;color:#f44;">⚠️</div>
      <div style="position:absolute;top:25px;left:30%;font-size:1.5rem;">➡️</div>
      <div style="position:absolute;top:25px;left:50%;font-size:1.5rem;">ONE WAY</div>`;

    // 25. HOSPITAL QUIET — hospital zone, silence markings
    A.hospital_quiet = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:100px;left:0;width:100%;height:18px;border:2px dashed rgba(100,150,255,.4);background:rgba(100,150,255,.05);"></div>
      <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);font-size:3.5rem;">🏥</div>
      <div style="position:absolute;top:15px;right:20%;font-size:2rem;">🤫</div>
      <div style="position:absolute;bottom:48px;left:40%;font-size:2rem;animation:slow 7s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:70px;left:50%;font-size:1rem;opacity:.5;">🔇 SILENCE ZONE</div>`;

    // 26. CYCLIST — bike lane, cyclist, car maintaining distance
    A.cyclist = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:100px;left:0;width:100%;height:4px;background:repeating-linear-gradient(90deg,#4a4 0,#4a4 12px,transparent 12px,transparent 18px);"></div>
      <div style="position:absolute;bottom:105px;left:40%;font-size:1.8rem;animation:ba 6s infinite linear;">🚲</div>
      <div style="position:absolute;bottom:48px;left:55%;font-size:2rem;animation:ba 5s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:108px;left:60%;font-size:.9rem;color:#4a4;">BIKE LANE</div>`;

    // 27. GRAND TEST — trophy, multiple vehicles, complex
    A.grand_test = () => `
      <div style="${road()}"></div>
      <div style="${road('50%','50%',100)};transform:rotate(90deg);transform-origin:left bottom;height:50px;"></div>
      <div style="position:absolute;top:15px;left:50%;transform:translateX(-50%);font-size:3.5rem;">🏆</div>
      <div style="position:absolute;bottom:48px;font-size:2rem;animation:ba 4s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:48px;left:30%;font-size:1.8rem;animation:ba 5s infinite linear -1s;">🚌</div>
      <div style="position:absolute;bottom:140px;left:52%;font-size:1.5rem;animation:ab 6s infinite linear;">🛺</div>
      <div style="position:absolute;top:20px;right:25%;font-size:1.5rem;">🥇</div>`;

    // 28. NIGHT MONSOON — night overlay, heavy rain, lightning, puddle
    A.night_monsoon = () => `
      <div style="${road()};background:#2a2d35;"></div>
      <div style="position:absolute;inset:0;background:rgba(0,0,30,.4);pointer-events:none;"></div>
      <div style="position:absolute;bottom:48px;left:42%;width:80px;height:22px;background:rgba(60,120,255,.5);border-radius:50%;animation:splash 1.5s infinite;"></div>
      ${[12,24,36,48,60,72,84].map(x=>`<div style="position:absolute;left:${x}%;width:2px;height:20px;background:rgba(100,160,255,.6);border-radius:0 0 2px 2px;animation:rain .5s infinite linear ${x*.01}s;"></div>`).join('')}
      <div style="position:absolute;bottom:46px;left:18%;font-size:1.6rem;line-height:1;">🚗</div>
      <div style="position:absolute;bottom:54px;left:22%;width:14px;height:7px;background:rgba(255,255,150,.8);border-radius:2px;"></div>
      <div style="position:absolute;bottom:54px;left:36%;width:14px;height:7px;background:rgba(255,255,150,.8);border-radius:2px;"></div>
      <div style="position:absolute;top:15px;right:30px;font-size:2rem;">🌙</div>
      <div style="position:absolute;top:30px;left:40%;font-size:2rem;animation:flash 2s infinite;">⚡</div>`;

    // 29. WRONG SIDE — car on wrong lane, head-on, danger
    A.wrong_side = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:68px;left:0;width:100%;height:2px;background:repeating-linear-gradient(90deg,#fc0 0,#fc0 12px,transparent 12px,transparent 20px);"></div>
      <div style="position:absolute;bottom:48px;font-size:2.2rem;animation:ba 4s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:72px;left:60%;font-size:2rem;animation:ab 3.5s infinite linear;">🚙</div>
      <div style="position:absolute;bottom:85px;left:48%;font-size:1.5rem;color:#f44;animation:flash .5s infinite;">⚠️</div>`;

    // 30. HIGHWAY MERGE — two lanes merging, car merging
    A.highway_merge = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:98px;left:0;width:22%;height:18px;background:#3d3f45;border-top:2px solid #fff;border-bottom:2px solid #fff;border-radius:0 0 10px 0;"></div>
      <div style="position:absolute;bottom:100px;left:20%;font-size:.85rem;opacity:.7;">↘️</div>
      <div style="position:absolute;bottom:48px;left:15%;font-size:2rem;animation:merge 4s infinite ease-in-out;">🚗</div>
      <div style="position:absolute;bottom:48px;left:60%;font-size:2rem;animation:ba 4s infinite linear;">🚕</div>`;

    // 31. ZERO VISIBILITY — fog, barely visible car
    A.zero_visibility = () => `
      <div style="${road()};background:#4a4d55;"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(200,200,210,.8) 0%,rgba(200,200,210,.3) 40%,transparent 70%);animation:fogPulse 4s infinite alternate;pointer-events:none;"></div>
      <div style="position:absolute;bottom:48px;left:40%;font-size:2rem;opacity:.35;">🚗</div>
      <div style="position:absolute;bottom:54px;left:42%;width:10px;height:5px;background:rgba(255,255,150,.5);border-radius:2px;opacity:.4;"></div>
      <div style="position:absolute;bottom:54px;left:54%;width:10px;height:5px;background:rgba(255,255,150,.5);border-radius:2px;opacity:.4;"></div>
      <div style="position:absolute;top:20px;right:30px;font-size:2rem;opacity:.4;">👻</div>`;

    // 32. MOUNTAIN — winding road, hairpin, car navigating
    A.mountain = () => `
      <div style="position:absolute;bottom:40px;left:0;width:45%;height:50px;background:#3d3f45;border-top:4px solid #fff;border-bottom:4px solid #fff;border-radius:0 20px 20px 0;"></div>
      <div style="position:absolute;bottom:55px;left:40%;width:50px;height:40px;background:#3d3f45;border:4px solid #fff;border-radius:50%;border-left-color:transparent;border-bottom-color:transparent;transform:rotate(-45deg);"></div>
      <div style="position:absolute;bottom:80px;left:55%;width:45%;height:50px;background:#3d3f45;border-top:4px solid #fff;border-bottom:4px solid #fff;border-radius:20px 0 0 20px;transform:rotate(8deg);"></div>
      <div style="position:absolute;top:5px;right:15%;font-size:3.5rem;">🏔️</div>
      <div style="position:absolute;top:10px;left:10%;font-size:3rem;">⛰️</div>
      <div style="position:absolute;bottom:48px;left:10%;font-size:1.8rem;animation:ba 5s infinite linear;">🚗</div>`;

    // 33. RURAL — dirt road, wheat fields, cow
    A.rural = () => `
      <div style="position:absolute;bottom:40px;left:0;width:100%;height:60px;background:repeating-linear-gradient(90deg,#8B7355 0,#8B7355 4px,#9B8365 4px,#9B8365 8px);border-top:3px solid #6B5335;border-bottom:3px solid #6B5335;"></div>
      <div style="position:absolute;bottom:100px;left:0;width:100%;height:30px;background:#5a7a3a;"></div>
      <div style="position:absolute;bottom:105px;left:10%;font-size:1.5rem;">🌾</div>
      <div style="position:absolute;bottom:105px;left:30%;font-size:1.5rem;">🌾</div>
      <div style="position:absolute;bottom:105px;right:20%;font-size:1.5rem;">🌾</div>
      <div style="position:absolute;bottom:48px;left:50%;font-size:2.2rem;">🐄</div>
      <div style="position:absolute;bottom:48px;left:15%;font-size:2rem;animation:ba 6s infinite linear;">🚗</div>`;

    // 34. MULTI MODAL — mixed traffic: car, auto, cyclist, ped, bus
    A.multi_modal = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:48px;left:10%;font-size:2rem;animation:ba 4s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:48px;left:30%;font-size:1.8rem;animation:ba 5s infinite linear -1s;">🛺</div>
      <div style="position:absolute;bottom:48px;left:55%;font-size:1.6rem;animation:ba 4.5s infinite linear -.5s;">🚲</div>
      <div style="position:absolute;bottom:104px;left:40%;font-size:1.4rem;animation:ped 3s infinite alternate;">🚶</div>
      <div style="position:absolute;bottom:48px;left:70%;font-size:2.2rem;animation:ba 5.5s infinite linear -2s;">🚌</div>
      <div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:1.5rem;">🌪️</div>`;

    // 35. LANE DISCIPLINE — dashed center, one car correct, one straddling
    A.lane_discipline = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:68px;left:0;width:100%;height:3px;background:repeating-linear-gradient(90deg,#fff 0,#fff 14px,transparent 14px,transparent 22px);"></div>
      <div style="position:absolute;bottom:48px;left:20%;font-size:2rem;animation:ba 5s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:56px;left:22%;font-size:.9rem;color:#4a4;">✓</div>
      <div style="position:absolute;bottom:60px;left:55%;font-size:2rem;animation:ba 4.5s infinite linear -.5s;transform:translateY(-3px);">🚙</div>
      <div style="position:absolute;bottom:72px;left:58%;font-size:.9rem;color:#f44;">✗</div>`;

    // 36. DRIVING SCHOOL — L plate, instructor car, cones, classroom
    A.driving_school = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;top:15px;left:20%;font-size:3rem;">🏫</div>
      <div style="position:absolute;bottom:48px;left:35%;font-size:2rem;animation:slow 5s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:66px;left:38%;width:18px;height:18px;background:#fff;border:2px solid #f00;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:900;color:#f00;">L</div>
      <div style="position:absolute;bottom:42px;left:55%;font-size:1.2rem;">🚧</div>
      <div style="position:absolute;bottom:42px;left:65%;font-size:1.2rem;">🚧</div>
      <div style="position:absolute;bottom:42px;left:75%;font-size:1.2rem;">🚧</div>
      <div style="position:absolute;top:20px;right:25%;font-size:2rem;">🎓</div>`;

    // 37. INTERSECTION / SIGNALS — crossroad, traffic light, car through
    A.intersection = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:40px;left:45%;width:60px;height:100%;background:#3d3f45;border-left:4px solid #fff;border-right:4px solid #fff;"></div>
      <div style="position:absolute;top:30%;left:42%;width:36px;height:80px;background:#222;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:6px 0;z-index:2;">
        <div style="width:18px;height:18px;border-radius:50%;background:#555;"></div>
        <div style="width:18px;height:18px;border-radius:50%;background:#fc0;box-shadow:0 0 6px #fc0;"></div>
        <div style="width:18px;height:18px;border-radius:50%;background:#555;"></div>
      </div>
      <div style="position:absolute;bottom:48px;font-size:2rem;animation:ba 5s infinite linear;">🚗</div>
      <div style="position:absolute;bottom:48px;left:30%;font-size:1.8rem;animation:ba 6s infinite linear -2s;">🚕</div>`;
    A.signals = A.intersection;
    A.raving = A.festival;
    A.market = A.market_street;
    A.school = A.driving_school;
    A.hospital = A.hospital_quiet;
    A.emergency = A.ambulance_priority;

    // DEFAULT — generic car driving across
    A._default = () => `
      <div style="${road()}"></div>
      <div style="position:absolute;bottom:48px;font-size:2.4rem;animation:ba 4s infinite linear;">🚗</div>`;

    // ── Resolve and render ──
    const artFn = A[theme] || A._default;
    const artHTML = artFn();

    wrap.innerHTML = badge + artHTML + `<style>${K}</style>`;
  },
  _disposeBriefingScene() {
    if (this._bScene) {
      if (this._bAnimId) {
        cancelAnimationFrame(this._bAnimId)
        this._bAnimId = null
      }
      if (this._bRenderer) {
        this._bRenderer.dispose()
        this._bRenderer = null
      }
      if (this._bScene) {
        this._bScene.traverse((c) => {
          if (c.geometry) c.geometry.dispose()
          if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose())
            else c.material.dispose()
          }
        })
        this._bScene = null
      }
      this._bCamera = null
    }
  },
  _initBriefingScene(lv) {
    if (typeof THREE === 'undefined') return
    const wrap = document.getElementById('briefing-canvas-wrap')
    if (!wrap) return
    this._disposeBriefingScene()
    const W = wrap.clientWidth || 600,
      H = wrap.clientHeight || 280
    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 200)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x1a1f2e, 1)
    const oldCanvas = wrap.querySelector('canvas')
    if (oldCanvas) oldCanvas.remove()
    wrap.appendChild(renderer.domElement)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dl = new THREE.DirectionalLight(0xffffff, 0.8)
    dl.position.set(5, 10, 7)
    scene.add(dl)
    const theme = lv.themeType || 'default'
    const t = new THREE.Group()
    scene.add(t)
    const isPed = (lv.modes || []).includes('pedestrian')
    const isNight = lv.themeType === 'night' || lv.themeType === 'night_blind_spot' || lv.themeType === 'speed_night'
    if (isNight) {
      scene.fog = new THREE.Fog(0x0a0a12, 40, 100)
      renderer.setClearColor(0x0a0a12, 1)
    }
    const groundG = new THREE.PlaneGeometry(80, 80)
    const groundM = new THREE.MeshToonMaterial({ color: isNight ? 0x222233 : 0x888888 })
    const ground = new THREE.Mesh(groundG, groundM)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.1
    t.add(ground)
    const roadG = new THREE.PlaneGeometry(80, 10)
    const roadM = new THREE.MeshToonMaterial({ color: 0x3d3f45 })
    const road = new THREE.Mesh(roadG, roadM)
    road.rotation.x = -Math.PI / 2
    road.position.y = 0.01
    t.add(road)
    const dashG = new THREE.PlaneGeometry(2, 0.15)
    const dashM = new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.5 })
    for (let dx = -36; dx < 36; dx += 5) {
      const d = new THREE.Mesh(dashG, dashM)
      d.rotation.x = -Math.PI / 2
      d.position.set(dx, 0.02, 0)
      t.add(d)
    }
    const edgeG = new THREE.PlaneGeometry(80, 0.08)
    const edgeM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
    ;[-5, 5].forEach((z) => {
      const e = new THREE.Mesh(edgeG, edgeM)
      e.rotation.x = -Math.PI / 2
      e.position.set(0, 0.02, z)
      t.add(e)
    })
    const swG = new THREE.PlaneGeometry(80, 4)
    const swM = new THREE.MeshToonMaterial({ color: 0xb5543a })
    ;[-7, 7].forEach((z) => {
      const sw = new THREE.Mesh(swG, swM)
      sw.rotation.x = -Math.PI / 2
      sw.position.set(0, 0.005, z)
      t.add(sw)
    })
    const carG = new THREE.BoxGeometry(1.4, 0.8, 2.8)
    const carM = new THREE.MeshToonMaterial({ color: isNight ? 0x4488cc : 0x3388ee })
    const car = new THREE.Mesh(carG, carM)
    car.position.set(0, 0.5, 0)
    t.add(car)
    const cabinG = new THREE.BoxGeometry(1.2, 0.5, 1.4)
    const cabinM = new THREE.MeshToonMaterial({ color: 0x222222 })
    const cabin = new THREE.Mesh(cabinG, cabinM)
    cabin.position.set(0, 0.5, -0.3)
    car.add(cabin)
    if (isNight) {
      const hlpG = new THREE.SphereGeometry(0.08, 6, 6)
      const hlpM = new THREE.MeshBasicMaterial({ color: 0xffffaa })
      ;[
        [-0.5, 0.4, 1.45],
        [0.5, 0.4, 1.45]
      ].forEach((p) => {
        const hl = new THREE.Mesh(hlpG, hlpM)
        hl.position.set(...p)
        car.add(hl)
      })
      const spotG = new THREE.ConeGeometry(1.2, 6, 8, 1, true)
      const spotM = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
      const spot = new THREE.Mesh(spotG, spotM)
      spot.rotation.x = Math.PI / 2
      spot.position.set(0, 0.4, 5)
      car.add(spot)
    }
    const tlG = new THREE.BoxGeometry(0.5, 2, 0.5)
    const tlM = new THREE.MeshToonMaterial({ color: 0x444444 })
    const pole = new THREE.Mesh(tlG, tlM)
    pole.position.set(12, 1, 6)
    t.add(pole)
    const signalColors = [
      { color: 0xff0000, y: 0.7 },
      { color: 0xffaa00, y: 0 },
      { color: 0x00cc00, y: -0.7 }
    ]
    const signalMeshes = signalColors.map((sc) => {
      const sg = new THREE.SphereGeometry(0.18, 8, 8)
      const sm = new THREE.MeshBasicMaterial({ color: sc.color, transparent: true, opacity: 0.25 })
      const s = new THREE.Mesh(sg, sm)
      s.position.set(0, sc.y, 0)
      pole.add(s)
      return s
    })
    let trafficPhase = 0
    const carColors = [0x22aa55, 0xcc4444, 0xddaa22, 0x8844cc]
    const npcs = []
    for (let i = 0; i < 3; i++) {
      const nc = carColors[i % carColors.length]
      const ncG = new THREE.BoxGeometry(1.3, 0.7, 2.6)
      const ncM = new THREE.MeshToonMaterial({ color: nc })
      const npc = new THREE.Mesh(ncG, ncM)
      npc.position.set(-10 - i * 8, 0.45, i % 2 === 0 ? -2 : 2)
      npc.userData = { speed: 2.5 + Math.random() * 1.5, startX: npc.position.x }
      t.add(npc)
      npcs.push(npc)
    }
    if (theme === 'pedestrian_courtesy' || isPed) {
      const pBodyG = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 6)
      const pBodyM = new THREE.MeshToonMaterial({ color: 0xffcc88 })
      const ped = new THREE.Mesh(pBodyG, pBodyM)
      ped.position.set(8, 0.55, 7)
      t.add(ped)
      const headG = new THREE.SphereGeometry(0.18, 8, 8)
      const headM = new THREE.MeshToonMaterial({ color: 0xffcc88 })
      const head = new THREE.Mesh(headG, headM)
      head.position.y = 0.55
      ped.add(head)
      ped.userData.isPed = true
    }
    if (theme.includes('school') || theme.includes('children')) {
      for (let i = 0; i < 3; i++) {
        const chBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 6), new THREE.MeshToonMaterial({ color: [0xff6666, 0x66ccff, 0xffcc00][i] }))
        chBody.position.set(6 + i * 2, 0.45, 6.5)
        const chHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), new THREE.MeshToonMaterial({ color: 0xffcc88 }))
        chHead.position.y = 0.4
        chBody.add(chHead)
        t.add(chBody)
      }
    }
    if (theme.includes('market')) {
      const stallG = new THREE.BoxGeometry(2, 1.2, 1.5)
      const stallM = new THREE.MeshToonMaterial({ color: 0xcc6633 })
      const stall = new THREE.Mesh(stallG, stallM)
      stall.position.set(-10, 0.6, 7)
      t.add(stall)
      const awningG = new THREE.PlaneGeometry(2.4, 1.6)
      const awningM = new THREE.MeshToonMaterial({ color: 0xdd4444, side: THREE.DoubleSide })
      const awning = new THREE.Mesh(awningG, awningM)
      awning.rotation.x = -0.3
      awning.position.set(0, 0.7, 1)
      stall.add(awning)
    }
    if (theme.includes('temple') || theme.includes('festival')) {
      const tmG = new THREE.BoxGeometry(3, 2, 2)
      const tmM = new THREE.MeshToonMaterial({ color: 0xcc8844 })
      const temple = new THREE.Mesh(tmG, tmM)
      temple.position.set(-10, 1, -7)
      t.add(temple)
      const domeG = new THREE.SphereGeometry(0.8, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      const domeM = new THREE.MeshToonMaterial({ color: 0xddaa44 })
      const dome = new THREE.Mesh(domeG, domeM)
      dome.position.y = 1
      temple.add(dome)
    }
    cam.position.set(8, 14, 22)
    cam.lookAt(0, 0, 0)
    const start = performance.now()
    const animate = () => {
      const animId = requestAnimationFrame(animate)
      this._bAnimId = animId
      const elapsed = (performance.now() - start) / 1000
      car.position.x = Math.sin(elapsed * 1.8) * 16
      car.position.z = Math.sin(elapsed * 1.8) * 0.3
      car.rotation.y = Math.sin(elapsed * 1.8) * 0.06
      trafficPhase = (elapsed % 6) / 6
      signalMeshes.forEach((s, i) => {
        const activePhase = i
        s.material.opacity = Math.floor(trafficPhase * 3) === activePhase ? 1.0 : 0.2
      })
      npcs.forEach((npc) => {
        npc.position.x += npc.userData.speed * 0.016
        if (npc.position.x > 30) npc.position.x = -30
      })
      t.children.forEach((c) => {
        if (c.userData && c.userData.isPed) {
          c.position.z = 7 + Math.sin(elapsed * 0.8) * 1.5
        }
      })
      cam.position.x = 8 + Math.sin(elapsed * 0.15) * 3
      cam.lookAt(0, 0, 0)
      renderer.render(scene, cam)
    }
    animate()
    this._bScene = scene
    this._bCamera = cam
    this._bRenderer = renderer
  },
  _selectVehicle(vehicleId) {
    S.vehicle = vehicleId.charAt(0).toUpperCase() + vehicleId.slice(1)
    save()
    toast(`✅ Vehicle set to ${vehicleId}`, '#34d399')
    // Re-render the practical section to show updated selection
    const lv = this.cur
    if (lv) this._selSyl('practical')
  },
  selectMode(mode) {
    // Just select the mode — don't open quiz yet
    this.curMode = mode
    // Update the mode buttons visual state using data-mode attribute
    const practBtns = document.querySelectorAll('#br-content .btn[data-mode]')
    practBtns.forEach(btn => {
      const btnMode = btn.dataset.mode
      if (btnMode === mode) {
        btn.style.background = 'var(--accent, #D97706)'
        btn.style.color = '#fff'
        btn.style.borderColor = 'var(--accent, #D97706)'
      } else {
        btn.style.background = 'var(--panel, rgba(0,0,0,0.04))'
        btn.style.color = 'var(--ink, #111827)'
        btn.style.borderColor = 'var(--line, rgba(0,0,0,0.08))'
      }
    })
  },
  dispatchStart(mode) {
    // Use preferred vehicle from setup if mode not explicitly passed
    if (!mode) {
      const lv = this.cur
      const availModes = lv.modes || ['car']
      mode = (S.vehicle === 'Bike' && availModes.includes('bike')) ? 'bike'
        : (S.vehicle === 'Car' && availModes.includes('car')) ? 'car'
        : this.curMode || availModes[0]
    }
    const lv = this.cur
    localStorage.setItem('traffic_lv', lv.id)
    localStorage.setItem('traffic_mode', mode)
    window.location.href = `Driving.html?lv=${lv.id}&mode=${mode}`
  },
  showQuiz(mode, perf = null) {
    mode = mode || ui.curMode || 'car'
    let qs = this.cur.quiz && this.cur.quiz[mode] ? this.cur.quiz[mode] : this.cur.quiz ? this.cur.quiz.car : null

    // Adaptive Logic: Inject corrective question if violations occurred
    if (perf && perf.violations && perf.violations.length > 0) {
      const tag = perf.violations[0]; // Use the first recorded violation
      const correction = CORRECTIVE_QUIZ[tag];
      if (correction) {
        if (!qs) qs = [];
        qs = [...qs, correction];
      }
    }

    if (!qs || qs.length === 0) {
      qs = [
        { q: `What is the primary rule for this scenario: ${this.cur.name}?`, o: [this.cur.law.sec, 'Speed up', 'Ignore signals', 'Honk loudly'], a: 0 },
        { q: `What is the penalty for ${this.cur.law.off}?`, o: [this.cur.law.fine, '₹100', 'No fine', 'Warning'], a: 0 },
        { q: `If you fail to follow ${this.cur.themeType.replace('_', ' ')} rules, what happens?`, o: ['Accidents and fines', 'Nothing', 'You get a reward', 'Traffic speeds up'], a: 0 }
      ]
    }

    // Shuffle options for all questions
    qs.forEach((q) => {
      const c = q.o[q.a]
      const rIdx = Math.floor(Math.random() * 4)
      q.o[q.a] = q.o[rIdx]
      q.o[rIdx] = c
      q.a = rIdx
    })

    this.qst = { qs: qs, cur: 0, pass: 0, mode: mode }
    if (qs.length === 0) {
      this._fq()
      return
    }
    this._rq()
    this.show('screen-quiz', { direction: 'forward' })
  },
  _rq() {
    const s = this.qst,
      q = s.qs[s.cur]
    document.getElementById('qd').innerHTML = s.qs.map((_, i) => `<div class="qdt ${i < s.cur ? 'dn' : i === s.cur ? 'cu' : ''}"></div>`).join('')
    document.getElementById('qa').innerHTML =
      `<div class="qcard"><div class="qq"><span>Q${s.cur + 1}</span>${q.q}</div><div class="qopts">${q.o.map((o, i) => `<button class="qo" onclick="ui._aq(${i})">${o}</button>`).join('')}</div><div class="qfb" id="qfb"></div></div>`
    document.getElementById('qnxt').style.display = 'none'
  },
  _aq(idx) {
    const s = this.qst,
      q = s.qs[s.cur]
    document.querySelectorAll('.qo').forEach((o) => (o.disabled = true))
    document.querySelectorAll('.qo')[idx].classList.add(idx === q.a ? 'ok' : 'no')
    if (idx !== q.a) document.querySelectorAll('.qo')[q.a].classList.add('rv')
    const fb = document.getElementById('qfb')
    if (idx === q.a) {
      fb.textContent = '✅ Correct!'
      fb.className = 'qfb ok'
      s.pass++
      sfx.play('ok')
    } else {
      fb.textContent = `❌ Incorrect. Correct: "${q.o[q.a]}"`
      fb.className = 'qfb no'
      sfx.play('error')
    }
    const nb = document.getElementById('qnxt')
    nb.style.display = 'inline-block'
    nb.textContent = s.cur < s.qs.length - 1 ? 'Next  ' : 'See Results  '
  },
  nextQ() {
    const s = this.qst
    s.cur++
    if (s.cur < s.qs.length) this._rq()
    else this._fq()
  },
  _fq() {
    const s = this.qst
    if (s.pass < s.qs.length) {
      toast(`❌ ${s.pass}/${s.qs.length} correct 🔄 retry!`, '#ff3b30')
      setTimeout(() => this.showQuiz(s.mode), 900)
      return
    }
    if (s.mode === 'final') {
      this.showResults(game?.fs || 100, game?.fst || { vio: 0 })
    } else {
      const lv = this.cur
      if (!S.comp[lv.id]) S.comp[lv.id] = {}
      if (!S.comp[lv.id].modes) S.comp[lv.id].modes = {}
      S.comp[lv.id].modes[s.mode] = true
      // A level only used to count as "complete" (isDone() / certificate progress) if a
      // mode called 'final' had run its quiz — but nothing in the game ever set mode to
      // 'final', so no level could ever be marked complete. Fix: once every mode this
      // level requires has had its quiz passed, mark the level itself complete right here.
      const requiredModes = lv.modes || [s.mode]
      const allModesDone = requiredModes.every((m) => S.comp[lv.id].modes[m])
      if (allModesDone && !S.comp[lv.id].finalQuiz) {
        const finalScore = game?.fs || 100
        const prevScore = S.comp[lv.id].score || 0
        S.comp[lv.id].score = Math.max(finalScore, prevScore)
        S.comp[lv.id].time = Date.now()
        S.comp[lv.id].finalQuiz = true
        S.total += finalScore
        if (lv.badge && !S.badges.includes(lv.badge.id)) S.badges.push(lv.badge.id)
        const completedCount = Object.keys(S.comp).length
        if (completedCount >= 10 && !S.badges.includes('level_10')) S.badges.push('level_10')
        if (completedCount >= 20 && !S.badges.includes('level_20')) S.badges.push('level_20')
        if (completedCount >= 30 && !S.badges.includes('level_30')) S.badges.push('level_30')
        if (completedCount >= 40 && !S.badges.includes('level_40')) S.badges.push('level_40')
        if (completedCount >= 52 && !S.badges.includes('level_52')) S.badges.push('level_52')
        if (completedCount >= 52 && !S.badges.includes('traffic_hero')) S.badges.push('traffic_hero')

        // Civic score — a persistent reputation number separate from per-level score,
        // rewarding clean driving over time rather than just "did you pass." Doesn't
        // penalize mistakes (this is a learning tool for kids, not a punishment system) —
        // clean runs just earn more than rough ones.
        const vioCount = game?.fst?.vio || 0
        const civicGain = vioCount === 0 ? 25 : vioCount <= 2 ? 10 : vioCount <= 4 ? 3 : 0
        S.civicScore = (S.civicScore || 0) + civicGain
        // Track which specific violation types occur, across levels, so a parent/teacher can
        // see a real pattern ("keeps forgetting to signal") instead of just a raw count —
        // this was previously discarded every level, nothing kept a history of it at all.
        if (!S.violationHistory) S.violationHistory = {}
        ;(game?.violationsLog || []).forEach((v) => {
          S.violationHistory[v] = (S.violationHistory[v] || 0) + 1
        })
        const tiers = [
          { at: 500, id: 'civic_platinum', label: 'Platinum Citizen' },
          { at: 250, id: 'civic_gold', label: 'Gold Citizen' },
          { at: 100, id: 'civic_silver', label: 'Silver Citizen' },
          { at: 25, id: 'civic_bronze', label: 'Bronze Citizen' }
        ]
        tiers.forEach((t) => {
          if (S.civicScore >= t.at && !S.badges.includes(t.id)) {
            S.badges.push(t.id)
            toast(`🏅 ${t.label} unlocked!`, '#a855f7')
          }
        })
      }
      save()
      toast(`✅ ${s.mode.charAt(0).toUpperCase() + s.mode.slice(1)} quiz passed!`, '#00c851')
      if (window.location.pathname.toLowerCase().includes('driving')) {
        window.location.href = 'Academy.html'
      } else {
        if (typeof SCENARIOS !== 'undefined') {
          const sc = SCENARIOS.find(x => x.levelRef === lv.id)
          if (sc) {
            this.show2D(sc.id)
            return
          } else {
            this.show2D(1)
            return
          }
        }
        window.location.href = `Driving.html?lv=${lv.id}&mode=${s.mode}`
      }
    }
  },
  showResults(score, stats) {
    const lv = this.cur,
      prev = S.comp[lv.id]?.score || 0
    S.comp[lv.id] = { ...S.comp[lv.id], score: Math.max(score, prev), time: Date.now(), finalQuiz: true }
    S.total += score
    const vioCount = stats?.vio || 0
    const civicGain = vioCount === 0 ? 25 : vioCount <= 2 ? 10 : vioCount <= 4 ? 3 : 0
    S.civicScore = (S.civicScore || 0) + civicGain
    if (!S.violationHistory) S.violationHistory = {}
    ;(stats?.violations || game?.violationsLog || []).forEach((v) => {
      S.violationHistory[v] = (S.violationHistory[v] || 0) + 1
    })
    ;[
      { at: 500, id: 'civic_platinum', label: 'Platinum Citizen' },
      { at: 250, id: 'civic_gold', label: 'Gold Citizen' },
      { at: 100, id: 'civic_silver', label: 'Silver Citizen' },
      { at: 25, id: 'civic_bronze', label: 'Bronze Citizen' }
    ].forEach((t) => {
      if (S.civicScore >= t.at && !S.badges.includes(t.id)) {
        S.badges.push(t.id)
        toast(`🏅 ${t.label} unlocked!`, '#a855f7')
      }
    })
    save()
    save()
    let be = null
    if (lv.badge && !S.badges.includes(lv.badge.id)) {
      S.badges.push(lv.badge.id)
      be = lv.badge
    }
    if (!S.badges.includes('signal_master') && Object.keys(S.comp).length >= 5 && !stats.vio) S.badges.push('signal_master')
    if (S.badges.includes('traffic_hero') && !S.badges.includes('smart_citizen')) S.badges.push('smart_citizen')

    // Check for level group badges
    const completedCount = Object.keys(S.comp).length
    if (completedCount >= 10 && !S.badges.includes('level_10')) S.badges.push('level_10')
    if (completedCount >= 20 && !S.badges.includes('level_20')) S.badges.push('level_20')
    if (completedCount >= 30 && !S.badges.includes('level_30')) S.badges.push('level_30')
    if (completedCount >= 40 && !S.badges.includes('level_40')) S.badges.push('level_40')
    if (completedCount >= 52 && !S.badges.includes('level_52')) S.badges.push('level_52')
    if (completedCount >= 52 && !S.badges.includes('traffic_hero')) S.badges.push('traffic_hero')

    // Check for category badges based on level themeType
    const themeTypes = {
      pedestrian_expert: ['pedestrian_courtesy', 'pedestrian_priority', 'pedestrian', 'crosswalk'],
      night_driver: ['night', 'night_driving', 'night_monsoon', 'blind_corner', 'zero_visibility'],
      weather_pro: ['rain', 'rain_driving', 'puddle_etiquette', 'weather', 'monsoon', 'flood'],
      emergency_hero: ['ambulance', 'emergency', 'ambulance_priority', 'hospital'],
      parking_master: ['parking', 'street_parking', 'respectful_parking', 'parking_rules']
    }

    // Check if all levels of a category are completed
    for (const [badgeId, themes] of Object.entries(themeTypes)) {
      if (S.badges.includes(badgeId)) continue
      const categoryLevels = LVS.filter(l => themes.some(t => (l.themeType || '').includes(t)))
      const completedCategoryLevels = categoryLevels.filter(l => S.comp[l.id])
      if (completedCategoryLevels.length >= categoryLevels.length && categoryLevels.length > 0) {
        S.badges.push(badgeId)
      }
    }

    save()
    document.getElementById('rico').textContent = score > 200 ? '🌟' : '⭐'
    document.getElementById('rtit').textContent = 'Level Complete!'
    document.getElementById('rsub').textContent = lv.name + ' 🔄 Well done!'
    document.getElementById('rcard').innerHTML =
      `<div class="rr"><span class="rl">Score</span><span class="rv">⭐ ${Math.round(score)}</span></div><div class="rr"><span class="rl">Quiz</span><span class="rv">✅ Passed</span></div>${stats.fin ? `<div class="rr"><span class="rl">Fines issued</span><span class="rv" style="color:var(--red)">${stats.fin}</span></div>` : ''}<div class="rr"><span class="rl">Violations</span><span class="rv" style="color:${stats.vio ? 'var(--red)' : 'var(--green)'}">${stats.vio || 'None ✅'}</span></div><div class="rr"><span class="rl">Level</span><span class="rv">${lv.id} / 52</span></div>
${stats.reward ? `<div class="rr"><span class="rl" style="color:var(--green, #059669)">Level Reward</span><span class="rv" style="color:var(--green, #059669)">+₹${stats.reward.toLocaleString('en-IN')}</span></div>` : ''}
${stats.fineAmt ? `<div class="rr"><span class="rl" style="color:#ff3b30">Fines Deducted</span><span class="rv" style="color:#ff3b30">-₹${stats.fineAmt.toLocaleString('en-IN')}</span></div>` : ''}
<div class="rr" style="margin-top:10px; border-top:1px solid var(--line, rgba(0,0,0,0.15)); padding-top:10px;"><span class="rl">Career Wallet</span><span class="rv" style="color:var(--accent, #b45309); font-weight:700;">₹${S.wallet.toLocaleString('en-IN')}</span></div>`
    document.getElementById('ro').classList.add('on')
    sfx.play('win')
  },
  issueChallan(off, sec, amt, loc, cb) {
    this.cq.push({ off, sec, amt, loc, cb })
    if (!this.cbusy) this._nc()
  },
  _nc() {
    if (!this.cq.length) {
      this.cbusy = false
      return
    }
    this.cbusy = true
    const c = this.cq.shift()
    const vf = document.getElementById('vflash')
    if (vf) {
      vf.classList.remove('flash')
      void vf.offsetWidth
      vf.classList.add('flash')
    }
    document.getElementById('cnum').textContent = 'MTP/2026/' + (Math.floor(Math.random() * 90000) + 10000)
    document.getElementById('coff').textContent = c.off
    document.getElementById('claw').textContent = c.sec
    document.getElementById('camt').textContent = c.amt
    const locEl = document.getElementById('cloc')
    if (locEl) locEl.textContent = c.loc || '📍 Mumbai'
    document.getElementById('cov').classList.add('on')
    this._ccb = c.cb || null
    if (game.playing) game.pause = true
    sfx.play('challan')
  },
  dismissChallan() {
    const cov = document.getElementById('cov')
    const cvc = document.getElementById('cvc-main')

    // Create clone for animation
    const rect = cvc.getBoundingClientRect()
    const clone = cvc.cloneNode(true)
    clone.id = ''
    clone.style.position = 'fixed'
    clone.style.top = rect.top + 'px'
    clone.style.left = rect.left + 'px'
    clone.style.width = rect.width + 'px'
    clone.style.height = rect.height + 'px'
    clone.style.margin = '0'
    clone.style.zIndex = getComputedStyle(document.documentElement).getPropertyValue('--z-modal').trim() || '100001'
    clone.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    document.body.appendChild(clone)

    // Hide original immediately
    cov.classList.remove('on')

    // Trigger animation
    setTimeout(() => {
      clone.style.transform = 'scale(0.2)'
      clone.style.top = window.innerHeight - 150 + 'px'
      clone.style.left = window.innerWidth - 150 + 'px'
      clone.style.opacity = '0'
    }, 20)

    // Create corner card
    setTimeout(() => {
      const stack = document.getElementById('challan-stack')
      stack.classList.add('on')
      const offText = document.getElementById('coff').textContent
      const amtText = document.getElementById('camt').textContent
      ui._addChallanCard(offText, amtText)
    }, 300)

    // Cleanup and continue
    setTimeout(() => {
      clone.remove()
      if (this._ccb) {
        this._ccb()
        this._ccb = null
      }
      if (game.playing) game.pause = false
      setTimeout(() => this._nc(), 80)
    }, 500)
  },
  show2D(scenarioId) {
    const sc = (typeof SCENARIOS !== 'undefined') ? SCENARIOS.find(s => s.id === scenarioId) : null
    if (!sc) return
    this._cur2D = sc
    document.getElementById('s2d-title').textContent = sc.icon + ' ' + sc.name
    this.show('screen-2d')
    setTimeout(() => {
      if (typeof initScenario2D === 'function') {
        initScenario2D('scenario2d-container', scenarioId)
      }
    }, 100)
  },
  exit2D() {
    if (typeof destroyScenario2D === 'function') destroyScenario2D()
    this._cur2D = null
    this.showLevels()
  },
  restart2D() {
    if (!this._cur2D) return
    const id = this._cur2D.id
    if (typeof destroyScenario2D === 'function') destroyScenario2D()
    setTimeout(() => {
      if (typeof initScenario2D === 'function') {
        initScenario2D('scenario2d-container', id)
      }
    }, 100)
  }
});

// 🚦 PROCEDURAL ENGINE AND SCENARIO ARRAYS 🚦
// Texture Generator
const _genTex = (type) => {
  if (type === 'asphalt') {
    const tex = new THREE.TextureLoader().load('textures/road.png')
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 4)
    return tex
  }
  if (type === 'building') {
    const tex = new THREE.TextureLoader().load('textures/building.png')
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
    return tex
  }
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  if (type === 'pave') {
    ctx.fillStyle = '#666666'
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = '#555555'
    ctx.lineWidth = 2
    for (let y = 0; y < 256; y += 32) {
      for (let x = 0; x < 256; x += 32) {
        ctx.strokeRect(x, y, 32, 32)
      }
    }
  } else if (type === 'police') {
    ctx.fillStyle = '#2980b9'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#34495e'
    for (let y = 0; y < 256; y += 32) {
      ctx.fillRect(0, y, 256, 2)
    }
    for (let x = 0; x < 256; x += 64) {
      for (let y = 0; y < 256; y += 32) {
        ctx.fillRect(x + (y % 64 === 0 ? 32 : 0), y, 2, 32)
      }
    }
  } else if (type === 'hospital') {
    ctx.fillStyle = '#ecf0f1'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#bdc3c7'
    for (let y = 0; y < 256; y += 32) {
      for (let x = 0; x < 256; x += 32) {
        ctx.strokeRect(x, y, 32, 32)
      }
    }
  } else if (type === 'bank') {
    ctx.fillStyle = '#7f8c8d'
    ctx.fillRect(0, 0, 256, 256)
    const grd = ctx.createLinearGradient(0, 0, 0, 256)
    grd.addColorStop(0, '#95a5a6')
    grd.addColorStop(1, '#7f8c8d')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#2c3e50'
    for (let x = 0; x < 256; x += 40) {
      ctx.fillRect(x, 0, 8, 256)
    }
  } else if (type === 'temple') {
    ctx.fillStyle = '#d35400'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#e67e22'
    for (let y = 0; y < 256; y += 16) {
      ctx.fillRect(0, y, 256, 2)
    }
    for (let x = 0; x < 256; x += 32) {
      for (let y = 0; y < 256; y += 16) {
        ctx.fillRect(x + (y % 32 === 0 ? 16 : 0), y, 2, 16)
      }
    }
  } else if (type === 'shop') {
    ctx.fillStyle = '#f1c40f'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#d35400'
    for (let y = 0; y < 256; y += 128) {
      ctx.fillRect(0, y, 256, 16)
    }
  } else if (type === 'car') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#000000'
    ctx.fillRect(32, 32, 192, 64) // windshield
    ctx.fillRect(32, 160, 192, 64) // rear window
    ctx.fillStyle = '#c0392b'
    ctx.fillRect(16, 220, 64, 36)
    ctx.fillRect(176, 220, 64, 36) // taillights
    ctx.fillStyle = '#f1c40f'
    ctx.fillRect(16, 0, 64, 32)
    ctx.fillRect(176, 0, 64, 32) // headlights
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  if (type === 'pave' || type === 'asphalt') tex.repeat.set(4, 4)
  else if (type === 'building' || type === 'bank' || type === 'temple' || type === 'police' || type === 'hospital') tex.repeat.set(2, 2)
  return tex
}

let gTex = null
const initGTex = () => {
  if (gTex) return
  gTex = {
    asphalt: _genTex('asphalt'),
    pave: _genTex('pave'),
    building: _genTex('building'),
    police: _genTex('police'),
    hospital: _genTex('hospital'),
    bank: _genTex('bank'),
    temple: _genTex('temple'),
    shop: _genTex('shop'),
    car: _genTex('car')
  }
}

const _buildVehicle = (type, col) => {
  let baseModel = null
  let s = 1.0
  let rotY = 0

  if (window.PRELOADED_MODELS) {
    // For 'car' type, sometimes use LowPoly Cars FBX instead of GLB variants
    if (type === 'car' && window.PRELOADED_MODELS['lowpoly_cars'] && Math.random() < 0.4) {
      const lpRoot = window.PRELOADED_MODELS['lowpoly_cars']
      // FBX multi-mesh: pick a random child car body
      const cars = []
      lpRoot.traverse(c => { if (c.isGroup && c.children.length > 0) cars.push(c) })
      if (cars.length > 0) {
        baseModel = cars[Math.floor(Math.random() * cars.length)].clone()
        s = 2.0
        // Apply color to body meshes
        baseModel.traverse((child) => {
          if (child.isMesh && child.material) {
            const n = child.name.toLowerCase()
            if (n.includes('body') || n.includes('paint') || n.includes('chassis') || (!n.includes('wheel') && !n.includes('glass') && !n.includes('window'))) {
              child.material = child.material.clone()
              child.material.color.setHex(col)
            }
          }
        })
      }
    }

    // Default: GLB variant pool
    if (!baseModel) {
      let modelKey = type
      const keysForType = Object.keys(window.PRELOADED_MODELS).filter((k) => k === type || k.startsWith(type + '_'))
      if (keysForType.length > 0) {
        modelKey = keysForType[Math.floor(Math.random() * keysForType.length)]
      }

      if (window.PRELOADED_MODELS[modelKey]) {
        baseModel = window.PRELOADED_MODELS[modelKey].clone()
        if (type === 'bus' || type === 'truck') s = 2.5
        else if (type === 'auto' || type === 'bike') s = 1.5
        else s = 2.0

        baseModel.traverse((child) => {
          if (child.isMesh && child.material) {
            // Kenney models usually use materials like "paint", "body", "color"
            if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('paint') || (child.material.name && child.material.name.toLowerCase().includes('paint'))) {
              child.material = child.material.clone()
              child.material.color.setHex(col)
            }
          }
        })
      }
    }
  }

  if (!baseModel && type === 'bike' && window.PRELOADED_MODELS && window.PRELOADED_MODELS['auto']) {
    baseModel = window.PRELOADED_MODELS['auto'].clone()
    s = 1.0
  }

  if (baseModel) {
    const g = new THREE.Group()
    baseModel.scale.set(s, s, s)
    baseModel.rotation.y = rotY
    baseModel.position.y = 0

    // Add an invisible hitbox for collisions
    const hw = type === 'bus' || type === 'truck' ? 1.8 : 1.2
    const hl = type === 'bus' || type === 'truck' ? 5.5 : 2.8
    const hbGeo = new THREE.BoxGeometry(hw, 2, hl)
    const hbMat = new THREE.MeshBasicMaterial({ visible: false })
    const hb = new THREE.Mesh(hbGeo, hbMat)
    hb.position.y = 1

    g.add(baseModel)
    g.add(hb)

    // ── GTA-style door pivots (GLB cars) ──
    const doorGeoGLB = new THREE.BoxGeometry(0.06, 0.5, 1.0)
    // Find body color from model materials for door overlay
    let bodyColGLB = col || 0x888888
    baseModel.traverse((child) => {
      if (child.isMesh && child.material && child.material.color) {
        const n = child.name.toLowerCase()
        if (n.includes('body') || n.includes('paint') || n.includes('chassis'))
          bodyColGLB = child.material.color.getHex()
      }
    })
    const doorMatGLB = new THREE.MeshToonMaterial({ color: bodyColGLB })
    const doorWGLB = hw * 0.95
    // Left door — hinge at front edge
    const dpLGLB = new THREE.Group()
    dpLGLB.position.set(doorWGLB, 1.0, 0.5)
    const dmLGLB = new THREE.Mesh(doorGeoGLB, doorMatGLB.clone())
    dmLGLB.position.set(0, 0, -0.5)
    dpLGLB.add(dmLGLB)
    g.add(dpLGLB)
    // Right door — hinge at front edge
    const dpRGLB = new THREE.Group()
    dpRGLB.position.set(-doorWGLB, 1.0, 0.5)
    const dmRGLB = new THREE.Mesh(doorGeoGLB, doorMatGLB.clone())
    dmRGLB.position.set(0, 0, -0.5)
    dpRGLB.add(dmRGLB)
    g.add(dpRGLB)
    g.userData.doorPivotL = dpLGLB
    g.userData.doorPivotR = dpRGLB

    g.type = type
    return g
  }

  const g = new THREE.Group()
  switch (type) {
    case 'car':
    case 'taxi': {
      const isT = type === 'taxi'
      const bodyM = new THREE.MeshToonMaterial({ color: isT ? 0xffd54a : col })
      const glassM = new THREE.MeshToonMaterial({ color: 0x1a2e4a, transparent: true, opacity: 0.75 })
      const wheelM = new THREE.MeshToonMaterial({ color: 0x111111 })
      const rimM = new THREE.MeshToonMaterial({ color: 0xcccccc })
      const hlM = new THREE.MeshBasicMaterial({ color: 0xffffcc })
      const tlM = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      // Chassis
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 3.8), bodyM)
      body.position.y = 0.42
      g.add(body)
      // Cabin
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.44, 1.9), bodyM)
      cab.position.set(0, 0.84, 0.08)
      g.add(cab)
      // Windshield
      const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), glassM)
      ws.position.set(0, 0.84, 1.02)
      ws.rotation.x = Math.PI / 5
      g.add(ws)
      const rs = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), glassM)
      rs.position.set(0, 0.84, -0.85)
      rs.rotation.x = -Math.PI / 5
      g.add(rs)
      // 4 Wheels
      ;[
        [0.85, 0, 1.25],
        [-0.85, 0, 1.25],
        [0.85, 0, -1.25],
        [-0.85, 0, -1.25]
      ].forEach(([x, , z]) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), wheelM)
        wh.rotation.z = Math.PI / 2
        wh.position.set(x, 0.3, z)
        g.add(wh)
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.22, 6), rimM)
        rim.rotation.z = Math.PI / 2
        rim.position.set(x, 0.3, z)
        g.add(rim)
      })
      // Headlights & taillights
      ;[
        [0.55, 0.45, 1.92, hlM],
        [-0.55, 0.45, 1.92, hlM],
        [0.55, 0.45, -1.92, tlM],
        [-0.55, 0.45, -1.92, tlM]
      ].forEach(([x, y, z, m]) => {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), m)
        l.position.set(x, y, z)
        g.add(l)
      })
      // ── GTA-style door pivots (procedural car) ──
      const doorGeoPC = new THREE.BoxGeometry(0.04, 0.38, 0.85)
      const doorMatPC = bodyM.clone()
      // Left door — hinge at front edge (B-pillar)
      const dpLPC = new THREE.Group()
      dpLPC.position.set(0.82, 0.65, 0.4)
      const dmLPC = new THREE.Mesh(doorGeoPC, doorMatPC.clone())
      dmLPC.position.set(0, 0, -0.425)
      dpLPC.add(dmLPC)
      g.add(dpLPC)
      // Right door — hinge at front edge
      const dpRPC = new THREE.Group()
      dpRPC.position.set(-0.82, 0.65, 0.4)
      const dmRPC = new THREE.Mesh(doorGeoPC, doorMatPC.clone())
      dmRPC.position.set(0, 0, -0.425)
      dpRPC.add(dmRPC)
      g.add(dpRPC)
      g.userData.doorPivotL = dpLPC
      g.userData.doorPivotR = dpRPC
      break
    }
    case 'bus': {
      const bM = new THREE.MeshToonMaterial({ color: col || 0xe74c3c }) // BEST bus red
      const gM = new THREE.MeshToonMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.6 })
      const wM = new THREE.MeshToonMaterial({ color: 0x111111 })
      const bdy = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 8.0), bM)
      bdy.position.y = 1.18
      g.add(bdy)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 7.6), bM)
      roof.position.y = 2.37
      g.add(roof)
      for (let i = 0; i < 4; i++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.78), gM)
        win.position.set(1.16, 1.4, 2.2 - i * 1.8)
        win.rotation.y = Math.PI / 2
        g.add(win)
      }
      const wsB = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.95), gM)
      wsB.position.set(0, 1.5, 4.02)
      g.add(wsB)
      ;[
        [-1.2, 0, 2.8],
        [1.2, 0, 2.8],
        [-1.2, 0, 0],
        [1.2, 0, 0],
        [-1.2, 0, -2.8],
        [1.2, 0, -2.8]
      ].forEach(([x, , z]) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.24, 8), wM)
        wh.rotation.z = Math.PI / 2
        wh.position.set(x, 0.4, z)
        g.add(wh)
      })
      break
    }
    case 'auto': {
      const aM = new THREE.MeshToonMaterial({ color: 0xffd54a })
      const sM = new THREE.MeshToonMaterial({ color: 0x111111 })
      const wM = new THREE.MeshToonMaterial({ color: 0x111111 })
      const abody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 2.1), aM)
      abody.position.y = 0.52
      g.add(abody)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.14, 2.1), sM)
      stripe.position.y = 0.68
      g.add(stripe)
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 1.4), aM)
      hood.position.set(0, 0.85, -0.1)
      g.add(hood)
      // 3 wheels: 2 rear + 1 front
      ;[
        [-0.58, 0, 0.72],
        [0.58, 0, 0.72]
      ].forEach(([x, , z]) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 7), wM)
        wh.rotation.z = Math.PI / 2
        wh.position.set(x, 0.22, z)
        g.add(wh)
      })
      const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 7), wM)
      fw.rotation.z = Math.PI / 2
      fw.position.set(0, 0.22, -0.85)
      g.add(fw)
      break
    }
    case 'truck': {
      const cM = new THREE.MeshToonMaterial({ color: col || 0x1565c0 })
      const contM = new THREE.MeshToonMaterial({ color: 0xeeeeee })
      const gM2 = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 })
      const wM2 = new THREE.MeshToonMaterial({ color: 0x111111 })
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, 2.6), cM)
      cab.position.set(0, 1.05, 2.5)
      g.add(cab)
      const spoi = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.3), cM)
      spoi.position.set(0, 2.38, 2.5)
      g.add(spoi)
      const wsT = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.95), gM2)
      wsT.position.set(0, 1.28, 3.81)
      g.add(wsT)
      const cont = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.3, 5.8), contM)
      cont.position.set(0, 1.22, -1.5)
      g.add(cont)
      ;[
        [-1.12, 0, 2.7],
        [1.12, 0, 2.7],
        [-1.12, 0, 0.8],
        [1.12, 0, 0.8],
        [-1.12, 0, -1],
        [1.12, 0, -1],
        [-1.12, 0, -3],
        [1.12, 0, -3]
      ].forEach(([x, , z]) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.24, 8), wM2)
        wh.rotation.z = Math.PI / 2
        wh.position.set(x, 0.42, z)
        g.add(wh)
      })
      break
    }
    case 'bike': {
      const bkM = new THREE.MeshToonMaterial({ color: col })
      const wkM = new THREE.MeshToonMaterial({ color: 0x111111 })
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 1.9), bkM)
      frame.position.y = 0.62
      g.add(frame)
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.75), bkM)
      tank.position.set(0, 0.88, 0.3)
      g.add(tank)
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.85), new THREE.MeshToonMaterial({ color: 0x1a1a1a }))
      seat.position.set(0, 0.88, -0.18)
      g.add(seat)
      const hbar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.12), new THREE.MeshToonMaterial({ color: 0xaaaaaa }))
      hbar.position.set(0, 1.02, 0.88)
      g.add(hbar)
      const wf = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 8), wkM)
      wf.rotation.z = Math.PI / 2
      wf.position.set(0, 0.28, 0.88)
      g.add(wf)
      const wr = wf.clone()
      wr.position.z = -0.88
      g.add(wr)
      break
    }
    case 'suv': {
      const suvM = new THREE.MeshToonMaterial({ color: col })
      const gS = new THREE.MeshToonMaterial({ color: 0x1a3a5a, transparent: true, opacity: 0.7 })
      const wS = new THREE.MeshToonMaterial({ color: 0x111111 })
      const sbody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.58, 4.3), suvM)
      sbody.position.y = 0.44
      g.add(sbody)
      const scab = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.78, 2.6), suvM)
      scab.position.set(0, 0.98, -0.05)
      g.add(scab)
      const sws = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7), gS)
      sws.position.set(0, 0.98, 1.3)
      sws.rotation.x = Math.PI / 6
      g.add(sws)
      ;[
        [-0.95, 0, 1.45],
        [0.95, 0, 1.45],
        [-0.95, 0, -1.45],
        [0.95, 0, -1.45]
      ].forEach(([x, , z]) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 8), wS)
        wh.rotation.z = Math.PI / 2
        wh.position.set(x, 0.36, z)
        g.add(wh)
      })
      break
    }
    case 'cycle': {
      const cycM = new THREE.MeshToonMaterial({ color: col })
      const wCy = new THREE.MeshToonMaterial({ color: 0x333333 })
      const cyframe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 1.3), cycM)
      cyframe.position.y = 0.5
      g.add(cyframe)
      const han = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.1), new THREE.MeshToonMaterial({ color: 0xaaaaaa }))
      han.position.set(0, 0.85, 0.6)
      g.add(han)
      ;[0.6, -0.6].forEach((z) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8), wCy)
        wh.rotation.z = Math.PI / 2
        wh.position.set(0, 0.25, z)
        g.add(wh)
      })
      break
    }
    default: {
      // Fallback: simple colored box
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.5), new THREE.MeshToonMaterial({ color: col })))
    }
  }
  return g
}

const _buildHuman = (isPlayer = false, appearance) => {
  const g = new THREE.Group()
  const sk = isPlayer ? 1.0 : 0.92

  // ═══ NPC VARIATION ═══
  // Random skin tones, shirt colors, and hair for NPCs to make them look distinct
  const npcSkins = [0xd4a574, 0xc68642, 0x8d5524, 0xf1c27d, 0xffdbac, 0xe0ac69]
  const npcShirts = [0x3498db, 0x2ecc71, 0x9b59b6, 0xe67e22, 0x1abc9c, 0xe74c3c, 0x34495e]
  const npcPants = [0x555555, 0x2c3e50, 0x444444, 0x3d3d3d, 0x2d2d2d]
  const npcHairs = [0x1a1a1a, 0x3d2b1f, 0x654321, 0x8B4513, 0x2c1810, 0xb5651d]

  // Load saved player appearance or use defaults
  let savedAppear = null
  if (isPlayer) {
    try { savedAppear = JSON.parse(localStorage.getItem('traffic_appearance')) } catch (e) {}
  }
  const app = (isPlayer && savedAppear) || appearance || {}

  // Pick random variation for NPCs, use saved/customized for player
  const skinColor = isPlayer ? (app.skin || 0xd4a574) : npcSkins[Math.floor(Math.random() * npcSkins.length)]
  const shirtColor = isPlayer ? (app.shirt || 0xe74c3c) : npcShirts[Math.floor(Math.random() * npcShirts.length)]
  const shirtDk = new THREE.Color(shirtColor).multiplyScalar(0.8).getHex()
  const pantsColor = isPlayer ? (app.pants || 0x2c3e50) : npcPants[Math.floor(Math.random() * npcPants.length)]
  const pantsDk = new THREE.Color(pantsColor).multiplyScalar(0.8).getHex()
  const hairColor = isPlayer ? (app.hair || 0x1a1a1a) : npcHairs[Math.floor(Math.random() * npcHairs.length)]

  // ── Materials ──
  const SKIN = new THREE.MeshToonMaterial({ color: skinColor })
  const SKIN2 = new THREE.MeshToonMaterial({ color: new THREE.Color(skinColor).multiplyScalar(0.92).getHex() })
  const HAIR = new THREE.MeshToonMaterial({ color: hairColor })
  const SHIRT = new THREE.MeshToonMaterial({ color: shirtColor })
  const SHIRT_DK = new THREE.MeshToonMaterial({ color: shirtDk })
  const PANTS = new THREE.MeshToonMaterial({ color: pantsColor })
  const PANTS_DK = new THREE.MeshToonMaterial({ color: pantsDk })
  const SHOES = new THREE.MeshToonMaterial({ color: isPlayer ? (app.shoes || 0x1a1a1a) : 0x222222 })
  const SHOE_SOLE = new THREE.MeshToonMaterial({ color: 0x333333 })
  const EYE_W = new THREE.MeshToonMaterial({ color: 0xffffff })
  const EYE_P = new THREE.MeshToonMaterial({ color: 0x2c1810 })
  const EYE_IRIS = new THREE.MeshToonMaterial({ color: isPlayer ? (app.eyeColor || 0x4a90d9) : 0x3d2b1f })
  const MOUTH = new THREE.MeshToonMaterial({ color: 0x8b4513 })
  const NOSE_M = new THREE.MeshToonMaterial({ color: new THREE.Color(skinColor).multiplyScalar(0.95).getHex() })
  const EAR_INNER = new THREE.MeshToonMaterial({ color: 0xc4956a })
  const BELT = new THREE.MeshToonMaterial({ color: 0x3d2b1f })
  const BELT_BUCKLE = new THREE.MeshToonMaterial({ color: 0xc0c0c0, emissive: 0xc0c0c0, emissiveIntensity: 0.1 })
  const BAG = new THREE.MeshToonMaterial({ color: isPlayer ? 0xf39c12 : 0x8e44ad, emissive: isPlayer ? 0xf39c12 : 0x8e44ad, emissiveIntensity: 0.05 })
  const BAG_DK = new THREE.MeshToonMaterial({ color: isPlayer ? 0xe67e22 : 0x7d3c98 })
  const BAG_STRAP = new THREE.MeshToonMaterial({ color: 0x555555 })
  const JOINT = new THREE.MeshToonMaterial({ color: new THREE.Color(skinColor).multiplyScalar(0.88).getHex() })
  const WRIST = new THREE.MeshToonMaterial({ color: 0xdddddd })
  const LIP_COLOR = new THREE.MeshToonMaterial({ color: 0xb5651d })
  const CAP = new THREE.MeshToonMaterial({ color: isPlayer ? 0xe74c3c : shirtColor })
  const CAP_BRIM = new THREE.MeshToonMaterial({ color: isPlayer ? 0xc0392b : shirtDk })

  function limb(rT, rB, h, mat, segs) {
    return new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, segs || 10, 1), mat)
  }

  function jointSphere(r, mat) {
    return new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat)
  }

  // ═══ HEAD ═══
  const headGroup = new THREE.Group()
  headGroup.position.y = 1.72 * sk

  // Skull — slightly ovoid
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28 * sk, 16, 12), SKIN)
  skull.scale.set(1, 1.05, 0.95)
  headGroup.add(skull)

  // Jaw / chin
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.20 * sk, 12, 8), SKIN2)
  jaw.position.set(0, -0.18 * sk, 0.10 * sk)
  jaw.scale.set(0.85, 0.55, 0.75)
  headGroup.add(jaw)

  // Chin bump
  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.04 * sk, 8, 6), SKIN)
  chin.position.set(0, -0.24 * sk, 0.16 * sk)
  headGroup.add(chin)

  // ── Hair (styled — shape varies by app.hairStyle, not just color) ──
  const hairStyle = isPlayer ? (app.hairStyle || 'classic') : 'classic'
  if (hairStyle !== 'bald') {
    if (hairStyle === 'short') {
      // Short/buzz cut — tight cap hugging the skull, no back volume
      const buzz = new THREE.Mesh(new THREE.SphereGeometry(0.285 * sk, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), HAIR)
      buzz.position.set(0, 0.09 * sk, -0.01 * sk)
      buzz.scale.set(1, 0.55, 1)
      headGroup.add(buzz)
    } else if (hairStyle === 'long') {
      // Long flowing hair — extends down past the neck on the sides and back
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.29 * sk, 12, 10), HAIR)
      crown.position.set(0, 0.10 * sk, -0.02 * sk)
      crown.scale.set(1, 0.62, 0.98)
      headGroup.add(crown)
      ;[-1, 1].forEach(s => {
        const flow = limb(0.075 * sk, 0.04 * sk, 0.32 * sk, HAIR, 8)
        flow.position.set(s * 0.20 * sk, -0.18 * sk, -0.05 * sk)
        flow.rotation.z = s * 0.08
        headGroup.add(flow)
        const flowTip = new THREE.Mesh(new THREE.SphereGeometry(0.04 * sk, 6, 5), HAIR)
        flowTip.position.set(s * 0.205 * sk, -0.34 * sk, -0.05 * sk)
        headGroup.add(flowTip)
      })
      const back = limb(0.15 * sk, 0.10 * sk, 0.30 * sk, HAIR, 10)
      back.position.set(0, -0.14 * sk, -0.14 * sk)
      headGroup.add(back)
    } else if (hairStyle === 'ponytail') {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.28 * sk, 12, 10), HAIR)
      crown.position.set(0, 0.10 * sk, -0.01 * sk)
      crown.scale.set(0.98, 0.55, 0.98)
      headGroup.add(crown)
      const tail = limb(0.055 * sk, 0.03 * sk, 0.30 * sk, HAIR, 8)
      tail.position.set(0, -0.10 * sk, -0.26 * sk)
      tail.rotation.x = 0.55
      headGroup.add(tail)
      const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.03 * sk, 6, 5), HAIR)
      tailTip.position.set(0, -0.24 * sk, -0.37 * sk)
      headGroup.add(tailTip)
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.045 * sk, 0.012 * sk, 6, 10), SHIRT_DK)
      tie.position.set(0, 0.03 * sk, -0.20 * sk)
      tie.rotation.x = 1.2
      headGroup.add(tie)
    } else {
      // 'classic' — the original layered volume look
      const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.30 * sk, 12, 10), HAIR)
      hairBack.position.set(0, 0.05 * sk, -0.04 * sk)
      hairBack.scale.set(0.98, 0.55, 0.98)
      headGroup.add(hairBack)
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.26 * sk, 10, 8), HAIR)
      hairTop.position.set(0, 0.14 * sk, -0.01 * sk)
      hairTop.scale.set(0.88, 0.38, 0.92)
      headGroup.add(hairTop)
      ;[-1, 1].forEach(s => {
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.08 * sk, 8, 6), HAIR)
        tuft.position.set(s * 0.22 * sk, 0.0 * sk, -0.06 * sk)
        tuft.scale.set(0.5, 0.7, 0.6)
        headGroup.add(tuft)
      })
    }
  }

  // ── Eyes (white + iris + pupil + eyelids) ──
  const _eyeLids = []
  ;[-1, 1].forEach(s => {
    // Eye white
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.048 * sk, 10, 8), EYE_W)
    ew.position.set(s * 0.105 * sk, 0.04 * sk, 0.23 * sk)
    ew.scale.set(1, 0.85, 0.6)
    headGroup.add(ew)
    // Iris
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.028 * sk, 8, 6), EYE_IRIS)
    iris.position.set(s * 0.105 * sk, 0.035 * sk, 0.255 * sk)
    headGroup.add(iris)
    // Pupil
    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.015 * sk, 6, 4), EYE_P)
    ep.position.set(s * 0.105 * sk, 0.035 * sk, 0.268 * sk)
    headGroup.add(ep)
    // Eye highlight (tiny white dot for liveliness)
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.006 * sk, 4, 3), EYE_W)
    hl.position.set(s * 0.095 * sk, 0.045 * sk, 0.27 * sk)
    headGroup.add(hl)
    // Upper eyelid
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.052 * sk, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.4), SKIN)
    lid.position.set(s * 0.105 * sk, 0.065 * sk, 0.235 * sk)
    lid.scale.set(1, 0.7, 0.7)
    lid.rotation.x = -0.2
    headGroup.add(lid)
    _eyeLids.push(lid)
  })

  // ── Eyebrows ──
  ;[-1, 1].forEach(s => {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.11 * sk, 0.018 * sk, 0.025 * sk), HAIR)
    brow.position.set(s * 0.105 * sk, 0.11 * sk, 0.23 * sk)
    brow.rotation.z = s * 0.1
    headGroup.add(brow)
  })

  // ── Nose ──
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * sk, 0.025 * sk, 0.08 * sk, 8), NOSE_M)
  nose.position.set(0, -0.03 * sk, 0.26 * sk)
  nose.rotation.x = Math.PI / 2 + 0.15
  headGroup.add(nose)
  // Nose tip
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.022 * sk, 8, 6), NOSE_M)
  noseTip.position.set(0, -0.06 * sk, 0.275 * sk)
  headGroup.add(noseTip)

  // ── Mouth ──
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07 * sk, 0.012 * sk, 0.018 * sk), MOUTH)
  mouth.position.set(0, -0.11 * sk, 0.25 * sk)
  headGroup.add(mouth)
  // Lower lip (slight fullness)
  const lip = new THREE.Mesh(new THREE.SphereGeometry(0.025 * sk, 8, 4), LIP_COLOR)
  lip.position.set(0, -0.125 * sk, 0.245 * sk)
  lip.scale.set(1.2, 0.4, 0.5)
  headGroup.add(lip)

  // ── Ears ──
  ;[-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04 * sk, 8, 6), SKIN2)
    ear.position.set(s * 0.27 * sk, 0.02 * sk, 0.0)
    ear.scale.set(0.6, 0.8, 0.4)
    headGroup.add(ear)
    // Inner ear
    const earIn = new THREE.Mesh(new THREE.SphereGeometry(0.02 * sk, 6, 4), EAR_INNER)
    earIn.position.set(s * 0.275 * sk, 0.02 * sk, 0.005 * sk)
    earIn.scale.set(0.5, 0.7, 0.3)
    headGroup.add(earIn)
  })

  // ── Player cap (togglable) ──
  if (isPlayer && app.accessories?.cap !== false && !app.accessories?.beanie && !app.accessories?.helmet) {
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.29 * sk, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), CAP)
    capTop.position.set(0, 0.12 * sk, -0.01 * sk)
    capTop.scale.set(1.02, 0.5, 1.02)
    headGroup.add(capTop)
    // Brim — curved arc for baseball-cap shape
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * sk, 0.30 * sk, 0.02 * sk, 12), CAP_BRIM)
    brim.position.set(0, 0.10 * sk, 0.12 * sk)
    brim.scale.set(1, 1, 0.6)
    headGroup.add(brim)
    // Button on top
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.025 * sk, 6, 4), CAP_BRIM)
    btn.position.set(0, 0.22 * sk, -0.01 * sk)
    headGroup.add(btn)
  }

  // ── Beanie (knit winter hat) ──
  if (isPlayer && app.accessories?.beanie) {
    const BEANIE = new THREE.MeshToonMaterial({ color: app.beanieColor || 0x3498db })
    const BEANIE_RIBBON = new THREE.MeshToonMaterial({ color: app.beanieColor ? new THREE.Color(app.beanieColor).multiplyScalar(0.7).getHex() : 0x2980b9 })
    // Main dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.31 * sk, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), BEANIE)
    dome.position.set(0, 0.10 * sk, -0.02 * sk)
    dome.scale.set(1.02, 0.55, 1.02)
    headGroup.add(dome)
    // Folded brim/ribbon
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.28 * sk, 0.035 * sk, 8, 14), BEANIE_RIBBON)
    ribbon.position.set(0, 0.04 * sk, -0.01 * sk)
    ribbon.rotation.x = Math.PI / 2 + 0.15
    ribbon.scale.set(1, 1, 0.7)
    headGroup.add(ribbon)
    // Pom-pom on top
    const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.055 * sk, 8, 6), BEANIE_RIBBON)
    pompom.position.set(0.01 * sk, 0.23 * sk, -0.02 * sk)
    headGroup.add(pompom)
  }

  // ── Helmet (bike/safety helmet) ──
  if (isPlayer && app.accessories?.helmet) {
    const HELMET_OUTER = new THREE.MeshToonMaterial({ color: 0xf5f5f5 })
    const HELMET_STRIPE = new THREE.MeshToonMaterial({ color: 0x2980b9 })
    const HELMET_PAD = new THREE.MeshToonMaterial({ color: 0x555555 })
    const HELMET_VISOR = new THREE.MeshToonMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.5 })
    // Main dome
    const hDome = new THREE.Mesh(new THREE.SphereGeometry(0.33 * sk, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), HELMET_OUTER)
    hDome.position.set(0, 0.10 * sk, -0.02 * sk)
    hDome.scale.set(1.04, 0.6, 1.06)
    headGroup.add(hDome)
    // Center stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.015 * sk, 0.12 * sk, 0.25 * sk), HELMET_STRIPE)
    stripe.position.set(0, 0.13 * sk, -0.02 * sk)
    stripe.rotation.x = 0.15
    headGroup.add(stripe)
    // Visor
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.27 * sk, 8, 6, 0, Math.PI * 1.2, 0, Math.PI * 0.4), HELMET_VISOR)
    visor.position.set(0, 0.07 * sk, 0.05 * sk)
    visor.scale.set(1.1, 0.5, 0.9)
    headGroup.add(visor)
    // Padding rim
    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.30 * sk, 0.025 * sk, 6, 14), HELMET_PAD)
    pad.position.set(0, 0.03 * sk, -0.01 * sk)
    pad.rotation.x = Math.PI / 2 + 0.15
    pad.scale.set(1, 0.9, 0.7)
    headGroup.add(pad)
  }

  // ── Sunglasses (togglable) ──
  if (isPlayer && app.accessories?.glasses) {
    const GLASS_FRAME = new THREE.MeshToonMaterial({ color: app.glassesFrame || 0x1a1a1a })
    const GLASS_LENS = new THREE.MeshToonMaterial({
      color: app.glassesTint || 0x1a1a2e,
      transparent: true,
      opacity: 0.45
    })
    const GLASS_HIGHLIGHT = new THREE.MeshToonMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
    ;[-1, 1].forEach(s => {
      // Larger lens with slight aviator curve
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.075 * sk, 10, 8), GLASS_LENS)
      lens.position.set(s * 0.13 * sk, 0.01 * sk, 0.24 * sk)
      lens.scale.set(1, 0.75, 0.25)
      headGroup.add(lens)
      // Thicker frame ring
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.072 * sk, 0.015 * sk, 8, 14), GLASS_FRAME)
      frame.position.set(s * 0.13 * sk, 0.01 * sk, 0.24 * sk)
      frame.scale.set(1, 0.85, 0.3)
      headGroup.add(frame)
      // Subtle lens highlight (reflection)
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.035 * sk, 6, 4), GLASS_HIGHLIGHT)
      hl.position.set(s * 0.10 * sk, 0.035 * sk, 0.265 * sk)
      headGroup.add(hl)
    })
    // Bridge (wider, more prominent)
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.02 * sk, 0.02 * sk), GLASS_FRAME)
    bridge.position.set(0, 0.01 * sk, 0.24 * sk)
    headGroup.add(bridge)
    // Temples (arms)
    ;[-1, 1].forEach(s => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14 * sk, 0.012 * sk, 0.012 * sk), GLASS_FRAME)
      arm.position.set(s * 0.19 * sk, 0.01 * sk, 0.12 * sk)
      headGroup.add(arm)
      // Temple tip (curved end)
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012 * sk, 4, 3), GLASS_FRAME)
      tip.position.set(s * 0.26 * sk, 0.01 * sk, 0.12 * sk)
      headGroup.add(tip)
    })
  }

  // ── Cheek blush (subtle, player only) ──
  if (isPlayer) {
    const BLUSH = new THREE.MeshToonMaterial({ color: 0xff9999, transparent: true, opacity: 0.12 })
    ;[-1, 1].forEach(s => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.045 * sk, 6, 4), BLUSH)
      cheek.position.set(s * 0.12 * sk, -0.04 * sk, 0.20 * sk)
      cheek.scale.set(1, 0.5, 0.6)
      headGroup.add(cheek)
    })
  }

  // ═══ NECK ═══
  const neck = limb(0.08 * sk, 0.10 * sk, 0.14 * sk, SKIN, 8)
  const neckGroup = new THREE.Group()
  neckGroup.position.y = 1.56 * sk
  neck.position.y = 0
  neckGroup.add(neck)
  g.add(neckGroup)

  g.add(headGroup)

  // ═══ TORSO ═══
  const tH = 0.65 * sk
  const torsoGroup = new THREE.Group()
  torsoGroup.position.y = 1.23 * sk

  // Chest (upper torso)
  const chest = limb(0.34 * sk, 0.30 * sk, tH * 0.52, SHIRT, 10)
  chest.position.y = tH * 0.15
  torsoGroup.add(chest)

  // Shirt pocket (left chest)
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.07 * sk, 0.015 * sk), SHIRT_DK)
  pocket.position.set(-0.12 * sk, tH * 0.2, 0.28 * sk)
  torsoGroup.add(pocket)
  // Pocket flap
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.085 * sk, 0.015 * sk, 0.02 * sk), SHIRT_DK)
  flap.position.set(-0.12 * sk, tH * 0.24, 0.29 * sk)
  torsoGroup.add(flap)

  // Shirt buttons
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.008 * sk, 6, 4), EYE_W)
    btn.position.set(0, tH * 0.15 - i * 0.08 * sk, 0.31 * sk)
    torsoGroup.add(btn)
  }

  // Waist (lower torso)
  const waist = limb(0.30 * sk, 0.26 * sk, tH * 0.48, SHIRT_DK, 10)
  waist.position.y = -tH * 0.18
  torsoGroup.add(waist)

  // Belt
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.28 * sk, 0.025 * sk, 6, 16), BELT)
  belt.position.y = -tH * 0.40
  belt.rotation.x = Math.PI / 2
  torsoGroup.add(belt)
  // Belt buckle
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.04 * sk, 0.02 * sk), BELT_BUCKLE)
  buckle.position.set(0, -tH * 0.40, 0.28 * sk)
  torsoGroup.add(buckle)

  g.add(torsoGroup)

  // ═══ SHOULDERS (joint spheres) ═══
  const lShoulder = jointSphere(0.08 * sk, SHIRT)
  lShoulder.position.set(-0.37 * sk, 1.42 * sk, 0)
  g.add(lShoulder)
  const rShoulder = jointSphere(0.08 * sk, SHIRT)
  rShoulder.position.set(0.37 * sk, 1.42 * sk, 0)
  g.add(rShoulder)

  // ═══ ARMS (articulated groups) ═══
  const lArmP = new THREE.Group()
  lArmP.position.set(-0.38 * sk, 1.38 * sk, 0)
  // Upper arm
  const lUA = limb(0.085 * sk, 0.075 * sk, 0.32 * sk, SHIRT, 10)
  lUA.position.y = -0.16 * sk
  lArmP.add(lUA)
  // Elbow joint
  const lElbow = jointSphere(0.055 * sk, JOINT)
  lElbow.position.set(0, -0.33 * sk, 0)
  lArmP.add(lElbow)
  // Forearm
  const lFore = limb(0.07 * sk, 0.055 * sk, 0.28 * sk, SKIN, 10)
  lFore.position.set(0, -0.48 * sk, 0)
  lArmP.add(lFore)
  // Wrist
  const lWrist = jointSphere(0.038 * sk, WRIST)
  lWrist.position.set(0, -0.63 * sk, 0)
  lArmP.add(lWrist)
  // Hand
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.048 * sk, 8, 6), SKIN2)
  lHand.position.set(0, -0.68 * sk, 0)
  lHand.scale.set(0.9, 1, 0.7)
  lArmP.add(lHand)
  // Fingers (simplified — 3 bumps)
  ;[-0.015, 0, 0.015].forEach((fx, fi) => {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * sk, 0.006 * sk, 0.06 * sk, 4), SKIN2)
    finger.position.set(fx * sk, -0.74 * sk, 0)
    lArmP.add(finger)
  })
  g.add(lArmP)

  const rArmP = new THREE.Group()
  rArmP.position.set(0.38 * sk, 1.38 * sk, 0)
  const rUA = limb(0.085 * sk, 0.075 * sk, 0.32 * sk, SHIRT, 10)
  rUA.position.y = -0.16 * sk
  rArmP.add(rUA)
  const rElbow = jointSphere(0.055 * sk, JOINT)
  rElbow.position.set(0, -0.33 * sk, 0)
  rArmP.add(rElbow)
  const rFore = limb(0.07 * sk, 0.055 * sk, 0.28 * sk, SKIN, 10)
  rFore.position.set(0, -0.48 * sk, 0)
  rArmP.add(rFore)
  const rWrist = jointSphere(0.038 * sk, WRIST)
  rWrist.position.set(0, -0.63 * sk, 0)
  rArmP.add(rWrist)
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.048 * sk, 8, 6), SKIN2)
  rHand.position.set(0, -0.68 * sk, 0)
  rHand.scale.set(0.9, 1, 0.7)
  rArmP.add(rHand)
  ;[-0.015, 0, 0.015].forEach((fx) => {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * sk, 0.006 * sk, 0.06 * sk, 4), SKIN2)
    finger.position.set(fx * sk, -0.74 * sk, 0)
    rArmP.add(finger)
  })
  g.add(rArmP)

  // ═══ LEGS (articulated groups) ═══
  const lLegP = new THREE.Group()
  lLegP.position.set(-0.14 * sk, 0.82 * sk, 0)
  // Upper leg (thigh)
  const lUL = limb(0.11 * sk, 0.095 * sk, 0.42 * sk, PANTS, 10)
  lUL.position.y = -0.21 * sk
  lLegP.add(lUL)
  // Knee joint
  const lKnee = jointSphere(0.065 * sk, PANTS_DK)
  lKnee.position.set(0, -0.43 * sk, 0)
  lLegP.add(lKnee)
  // Lower leg (shin)
  const lLL = limb(0.09 * sk, 0.075 * sk, 0.38 * sk, PANTS_DK, 10)
  lLL.position.set(0, -0.62 * sk, 0)
  lLegP.add(lLL)
  // Ankle
  const lAnkle = jointSphere(0.04 * sk, SHOES)
  lAnkle.position.set(0, -0.82 * sk, 0)
  lLegP.add(lAnkle)
  // Shoe (with sole detail)
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11 * sk, 0.07 * sk, 0.20 * sk), SHOES)
  lShoe.position.set(0.01 * sk, -0.87 * sk, 0.04 * sk)
  lLegP.add(lShoe)
  const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.115 * sk, 0.02 * sk, 0.21 * sk), SHOE_SOLE)
  lSole.position.set(0.01 * sk, -0.91 * sk, 0.04 * sk)
  lLegP.add(lSole)
  // Shoe tongue
  const lTongue = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.04 * sk, 0.015 * sk), SHIRT_DK)
  lTongue.position.set(0.01 * sk, -0.83 * sk, 0.14 * sk)
  lTongue.rotation.x = -0.3
  lLegP.add(lTongue)
  g.add(lLegP)

  const rLegP = new THREE.Group()
  rLegP.position.set(0.14 * sk, 0.82 * sk, 0)
  const rUL = limb(0.11 * sk, 0.095 * sk, 0.42 * sk, PANTS, 10)
  rUL.position.y = -0.21 * sk
  rLegP.add(rUL)
  const rKnee = jointSphere(0.065 * sk, PANTS_DK)
  rKnee.position.set(0, -0.43 * sk, 0)
  rLegP.add(rKnee)
  const rLL = limb(0.09 * sk, 0.075 * sk, 0.38 * sk, PANTS_DK, 10)
  rLL.position.set(0, -0.62 * sk, 0)
  rLegP.add(rLL)
  const rAnkle = jointSphere(0.04 * sk, SHOES)
  rAnkle.position.set(0, -0.82 * sk, 0)
  rLegP.add(rAnkle)
  const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11 * sk, 0.07 * sk, 0.20 * sk), SHOES)
  rShoe.position.set(-0.01 * sk, -0.87 * sk, 0.04 * sk)
  rLegP.add(rShoe)
  const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.115 * sk, 0.02 * sk, 0.21 * sk), SHOE_SOLE)
  rSole.position.set(-0.01 * sk, -0.91 * sk, 0.04 * sk)
  rLegP.add(rSole)
  const rTongue = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.04 * sk, 0.015 * sk), SHIRT_DK)
  rTongue.position.set(-0.01 * sk, -0.83 * sk, 0.14 * sk)
  rTongue.rotation.x = -0.3
  rLegP.add(rTongue)
  g.add(rLegP)

  // ═══ GROUND SHADOW (soft blob) ═══
  const shadowGeo = new THREE.CircleGeometry(0.3 * sk, 16)
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false })
  const shadowBlob = new THREE.Mesh(shadowGeo, shadowMat)
  shadowBlob.rotation.x = -Math.PI / 2
  shadowBlob.position.y = 0.01
  g.add(shadowBlob)

  // ═══ PLAYER-SPECIFIC ACCESSORIES ═══
  let ring = null, nametag = null, nametagGlow = null, nametagGlowOuter = null
  if (isPlayer) {
    // ── Backpack (detailed with straps and pocket) ──
    if (app.accessories?.backpack !== false) {
      const bagMain = new THREE.Mesh(new THREE.BoxGeometry(0.30 * sk, 0.40 * sk, 0.16 * sk), BAG)
      bagMain.position.set(0, 1.28 * sk, -0.24 * sk)
      g.add(bagMain)
      // Bag front pocket
      const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.24 * sk, 0.12 * sk, 0.04 * sk), BAG_DK)
      bagPocket.position.set(0, 1.20 * sk, -0.33 * sk)
      g.add(bagPocket)
      // Bag zipper
      const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sk, 0.008 * sk, 0.005 * sk), BELT_BUCKLE)
      zipper.position.set(0, 1.27 * sk, -0.325 * sk)
      g.add(zipper)
      // Bag flap
      const bagFlap = new THREE.Mesh(new THREE.BoxGeometry(0.28 * sk, 0.06 * sk, 0.03 * sk), BAG_DK)
      bagFlap.position.set(0, 1.48 * sk, -0.30 * sk)
      g.add(bagFlap)
      // Shoulder straps
      ;[-1, 1].forEach(s => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04 * sk, 0.5 * sk, 0.02 * sk), BAG_STRAP)
        strap.position.set(s * 0.12 * sk, 1.35 * sk, -0.12 * sk)
        strap.rotation.x = 0.15
        g.add(strap)
      })
    }

    // ── Scarf (3D draped geometry) ──
    if (app.accessories?.scarf) {
      const SCARF = new THREE.MeshToonMaterial({ color: 0xe74c3c })
      const SCARF_STRIPE = new THREE.MeshToonMaterial({ color: 0xd4a017 })
      // Main wrap around neck
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.16 * sk, 0.03 * sk, 8, 16), SCARF)
      wrap.position.set(0, 1.54 * sk, -0.02 * sk)
      wrap.rotation.x = Math.PI / 2 + 0.2
      wrap.scale.set(1.2, 1, 0.8)
      g.add(wrap)
      // Draped front left segment
      const segL = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.28 * sk, 0.03 * sk), SCARF)
      segL.position.set(-0.10 * sk, 1.38 * sk, 0.07 * sk)
      segL.rotation.x = 0.2
      segL.rotation.z = 0.1
      g.add(segL)
      // Draped front right segment
      const segR = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.28 * sk, 0.03 * sk), SCARF)
      segR.position.set(0.10 * sk, 1.38 * sk, 0.07 * sk)
      segR.rotation.x = 0.2
      segR.rotation.z = -0.1
      g.add(segR)
      // Stripe on left segment
      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.02 * sk, 0.035 * sk), SCARF_STRIPE)
      stripeL.position.set(-0.10 * sk, 1.34 * sk, 0.075 * sk)
      g.add(stripeL)
      // Stripe on right segment
      const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.02 * sk, 0.035 * sk), SCARF_STRIPE)
      stripeR.position.set(0.10 * sk, 1.34 * sk, 0.075 * sk)
      g.add(stripeR)
      // Draped back 
      const segBack = new THREE.Mesh(new THREE.BoxGeometry(0.20 * sk, 0.16 * sk, 0.025 * sk), SCARF)
      segBack.position.set(0, 1.38 * sk, -0.14 * sk)
      segBack.rotation.x = -0.15
      g.add(segBack)
    }

    // ── Glow ring ──
    ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.32 * sk, 0.018, 10, 24),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 })
    )
    ring.position.set(0, 0.01, 0)
    ring.rotation.x = Math.PI / 2
    g.add(ring)
    // Outer ring glow
    const ringOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.36 * sk, 0.008, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.2 })
    )
    ringOuter.position.set(0, 0.01, 0)
    ringOuter.rotation.x = Math.PI / 2
    g.add(ringOuter)

    // ── Direction arrows (3D chevrons) ──
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.35 })
    ;[-1, 1].forEach(s => {
      const ar = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 4), arrowMat)
      ar.position.set(s * 0.52 * sk, 0.1 * sk, 0)
      ar.rotation.z = s * Math.PI / 2
      g.add(ar)
    })
    // Forward arrow
    const fwdAr = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), arrowMat)
    fwdAr.position.set(0, 0.08 * sk, 0.5 * sk)
    fwdAr.rotation.x = Math.PI / 2
    g.add(fwdAr)

    // ── Nametag sprite (enhanced: rank icon, name, rank title, XP bar, animated glow) ──
    const nameTxt = (typeof S !== 'undefined' && S?.name) || 'Player'
    const _nametagRankTiers = [
      { min: 0, name: 'Rookie', icon: '🔰', color: '#94a3b8' },
      { min: 5000, name: 'Bronze', icon: '🥉', color: '#cd7f32' },
      { min: 15000, name: 'Silver', icon: '🥈', color: '#c0c0c0' },
      { min: 30000, name: 'Gold', icon: '🥇', color: '#ffd54a' },
      { min: 50000, name: 'Platinum', icon: '💎', color: '#b89bff' },
      { min: 100000, name: 'Hero', icon: '🏆', color: '#34d399' }
    ]
    const _getNametagRank = (score) => {
      let rank = _nametagRankTiers[0]
      for (const r of _nametagRankTiers) { if (score >= r.min) rank = r }
      return rank
    }
    const _playerScore = (typeof S !== 'undefined' && S?.total) || 0
    const _rank = _getNametagRank(_playerScore)
    const _nextRank = _nametagRankTiers.find(r => r.min > _playerScore)
    const _xpPct = _nextRank ? Math.min(1, (_playerScore - _rank.min) / (_nextRank.min - _rank.min)) : 1
    // Canvas: wider for rank info + progress bar
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 140
    const ctx = canvas.getContext('2d')
    // Rounded background with rank-colored border
    ctx.fillStyle = 'rgba(0, 15, 10, 0.75)'
    if (ctx.roundRect) { ctx.roundRect(4, 4, 504, 132, 14); ctx.fill() } else { ctx.fillRect(4, 4, 504, 132) }
    // Rank-colored accent border
    ctx.strokeStyle = _rank.color + '88'
    ctx.lineWidth = 2.5
    if (ctx.roundRect) { ctx.roundRect(4, 4, 504, 132, 14); ctx.stroke() }
    // Rank icon (emoji)
    ctx.font = '28px serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(_rank.icon, 20, 38)
    // Rank name + title
    ctx.fillStyle = _rank.color
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(_rank.name.toUpperCase(), 52, 28)
    // Player name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 30px Inter, sans-serif'
    ctx.fillText(nameTxt, 52, 55)
    // XP progress bar
    const barX = 20, barY = 78, barW = 472, barH = 10
    // Bar background
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    if (ctx.roundRect) { ctx.roundRect(barX, barY, barW, barH, 5); ctx.fill() } else { ctx.fillRect(barX, barY, barW, barH) }
    // Bar fill with rank color gradient
    if (_xpPct > 0) {
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW * _xpPct, 0)
      barGrad.addColorStop(0, _rank.color)
      barGrad.addColorStop(1, _nextRank ? _nextRank.color : _rank.color)
      ctx.fillStyle = barGrad
      if (ctx.roundRect) { ctx.roundRect(barX, barY, Math.max(4, barW * _xpPct), barH, 5); ctx.fill() } else { ctx.fillRect(barX, barY, Math.max(4, barW * _xpPct), barH) }
    }
    // XP label
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(_playerScore.toLocaleString() + ' XP', barX, barY + 24)
    ctx.textAlign = 'right'
    ctx.fillText(_nextRank ? (_nextRank.min - _playerScore).toLocaleString() + ' to ' + _nextRank.name : 'MAX RANK', barX + barW, barY + 24)
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    nametag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
    nametag.position.set(0, 2.45 * sk, 0)
    nametag.scale.set(1.4, 0.38, 1)
    g.add(nametag)
    // ── Animated glow ring under nametag (pulses with rank color) ──
    const _rankColorObj = new THREE.Color(_rank.color)
    nametagGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.25 * sk, 0.30 * sk, 24),
      new THREE.MeshBasicMaterial({ color: _rankColorObj, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthTest: false })
    )
    nametagGlow.position.set(0, 2.45 * sk, -0.01)
    nametagGlow.rotation.x = -Math.PI / 2
    g.add(nametagGlow)
    // Outer glow ring
    nametagGlowOuter = new THREE.Mesh(
      new THREE.RingGeometry(0.32 * sk, 0.35 * sk, 24),
      new THREE.MeshBasicMaterial({ color: _rankColorObj, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthTest: false })
    )
    nametagGlowOuter.position.set(0, 2.45 * sk, -0.015)
    nametagGlowOuter.rotation.x = -Math.PI / 2
    g.add(nametagGlowOuter)

    // ── Outline glow mesh (adds depth) ──
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.04, side: THREE.BackSide })
    const glowBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * sk, 0.32 * sk, 1.6 * sk, 12), glowMat)
    glowBody.position.y = 0.9 * sk
    g.add(glowBody)
  }

  // ═══ NPC BACKPACK (simpler) ═══
  if (!isPlayer) {
    const npcBag = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sk, 0.30 * sk, 0.12 * sk), BAG)
    npcBag.position.set(0, 1.28 * sk, -0.22 * sk)
    g.add(npcBag)
    // NPC bag strap
    ;[-0.08, 0.08].forEach(x => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.025 * sk, 0.35 * sk, 0.015 * sk), BAG_STRAP)
      s.position.set(x * sk, 1.32 * sk, -0.10 * sk)
      g.add(s)
    })
  }

  // ═══ SHADOWS ═══
  g.traverse(c => {
    if (c.isMesh) {
      c.castShadow = !isPlayer
      c.receiveShadow = true
      c.frustumCulled = false
    }
  })

  // ═══ HITBOX ═══
  const hb = new THREE.Mesh(
    new THREE.BoxGeometry(0.6 * sk, 1.8 * sk, 0.6 * sk),
    new THREE.MeshBasicMaterial({ visible: false })
  )
  hb.position.y = 0.9 * sk
  g.add(hb)

  // ═══ USERDATA (animation refs + NPC behavior) ═══
  g.userData = {
    lLeg: lLegP,
    rLeg: rLegP,
    lArm: lArmP,
    rArm: rArmP,
    headGroup,
    torsoGroup,
    eyeLids: _eyeLids,
    ring,
    nametag,
    nametagGlow,
    nametagGlowOuter,
    shadowBlob,
    isPlayer,
    _sk: sk,
    t: Math.random() * 10,
    spd: 1.5 + Math.random() * 1.5,
    dir: Math.random() > 0.5 ? 1 : -1,
    startZ: 0,
    // For idle animation variation
    idlePhase: Math.random() * Math.PI * 2,
    blinkTimer: Math.random() * 4 + Math.random() * 3
  }
  return g
}

function updateTrafficAuthUI() {
  // Check both local storage and Supabase (colUser) for logged in status
  const localData = localStorage.getItem('traffic_local_user')
  let user = localData ? JSON.parse(localData) : null

  // If not found locally, check for Supabase user (colUser)
  if (!user && window.colUser) {
    const uObj = window.colUser.user || window.colUser
    const meta = uObj.user_metadata || {}
    user = {
      name: meta.full_name || meta.name || 'Driver',
      email: uObj.email,
      avatar: meta.avatar_url || meta.picture || meta.avatar
    }
  }

  const profileDiv = document.getElementById('trafficUserProfile')
  const pfp = document.getElementById('trafficUserPfp')
  const initials = document.getElementById('trafficUserInitials')
  const userName = document.getElementById('trafficUserName')

  document.querySelectorAll('.dynamic-auth-btn').forEach((b) => {
    b.innerHTML = user ? '📊 Dashboard' : 'Sign In'
    b.onclick = () => (window.location.href = user ? 'TrafficDashboard.html' : 'TrafficSetup.html')
  })

  // Update Get Started button to Start Academy if logged in
  const getStartedBtn = document.getElementById('enter-academy-btn')
  if (getStartedBtn) {
    getStartedBtn.innerHTML = user ? 'Start Academy' : 'Get Started'
  }

  const navBtn = document.getElementById('academy-sign-in-btn')
  if (navBtn) navBtn.style.display = user ? 'none' : 'block'

  if (user) {
    if (profileDiv) {
      profileDiv.style.display = 'flex'
      profileDiv.onclick = () => (window.location.href = 'TrafficDashboard.html')
    }

    if (userName) userName.textContent = user.name || 'Driver'
    
    // Avatar vs Anagram logic: show ONLY profile picture if available, hide initials completely
    if (user.avatar && pfp) {
      pfp.src = user.avatar
      pfp.style.setProperty('display', 'block', 'important')
      if (initials) initials.style.setProperty('display', 'none', 'important')
    } else if (initials && user.name) {
      initials.textContent = user.name.charAt(0).toUpperCase()
      initials.style.setProperty('display', 'flex', 'important')
      if (pfp) pfp.style.setProperty('display', 'none', 'important')
    }
  } else {
    if (profileDiv) profileDiv.style.display = 'none'
  }
}

// Also listen for col-auth-changed event to update UI when Supabase auth changes
if (typeof window !== 'undefined') {
  window.addEventListener('col-auth-changed', function() {
    setTimeout(updateTrafficAuthUI, 500)
  })
}

// Run immediately
updateTrafficAuthUI()
// And on load
window.addEventListener('DOMContentLoaded', updateTrafficAuthUI)

// Garage panel functions
// Legacy fallback — used by old onclick handlers
function selectVehicle(vehicleId) {
  if (ui && typeof ui._selectVehicle === 'function') {
    ui._selectVehicle(vehicleId)
  } else {
    S.vehicle = vehicleId.charAt(0).toUpperCase() + vehicleId.slice(1)
    save()
    toast(`✅ Vehicle set to ${vehicleId}`, '#34d399')
  }
}

// Mystery reward system (variable reinforcement)
const MYSTERY_REWARDS = [
  { type: 'xp', amount: 500, label: '💎 Bonus XP', desc: '+500 XP injected!' },
  { type: 'wallet', amount: 5000, label: '💰 Cash Bonus', desc: '₹5,000 added to wallet!' },
  { type: 'streak', amount: 1, label: '🔥 Streak Shield', desc: 'Next miss won\'t break streak!' },
  { type: 'badge', badgeId: 'lucky_driver', label: '🍀 Lucky Driver', desc: 'Rare badge unlocked!' },
  { type: 'xp', amount: 1000, label: '⚡ Double XP', desc: 'Next level gives 2x XP!' }
]

function grantMysteryReward() {
  const reward = MYSTERY_REWARDS[Math.floor(Math.random() * MYSTERY_REWARDS.length)]
  if (reward.type === 'xp') {
    S.total = (S.total || 0) + reward.amount
  } else if (reward.type === 'wallet') {
    S.wallet = (S.wallet || 50000) + reward.amount
  } else if (reward.type === 'streak') {
    S.streakShield = (S.streakShield || 0) + reward.amount
  } else if (reward.type === 'badge') {
    if (!S.badges) S.badges = []
    if (!S.badges.includes(reward.badgeId)) S.badges.push(reward.badgeId)
  }
  save()
  showMysteryRewardModal(reward)
}

function showMysteryRewardModal(reward) {
  const modal = document.createElement('div')
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;'
  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,var(--card),var(--void));border:2px solid var(--signal);border-radius:20px;padding:32px;max-width:360px;width:100%;text-align:center;position:relative;overflow:hidden;">
      <div style="font-size:3rem;margin-bottom:16px;animation:bounce 0.6s ease;">🎁</div>
      <h2 style="font-family:'Instrument Serif',serif;font-size:1.8rem;margin:0 0 8px;">MYSTERY REWARD!</h2>
      <div style="font-size:1.5rem;font-weight:800;color:var(--signal);margin-bottom:8px;">${reward.label}</div>
      <p style="color:var(--muted);margin-bottom:24px;">${reward.desc}</p>
      <button class="btn" onclick="this.closest('.modal').remove()" style="background:var(--signal);color:#000;font-weight:700;padding:12px 32px;border-radius:10px;">Claim</button>
    </div>
  `
  modal.className = 'modal'
  document.body.appendChild(modal)
  
  // Add bounce animation
  if (!document.getElementById('mystery-anim')) {
    const style = document.createElement('style')
    style.id = 'mystery-anim'
    style.textContent = '@keyframes bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }'
    document.head.appendChild(style)
  }
}

// Mumbai consequence modal with real stats
function showConsequenceModal(violationType, severity = 'normal') {
  const stat = window.COURSE?.getMumbaiStat?.(violationType) || { stat: '—', unit: 'data unavailable', year: 2024, source: 'MTP' }
  const violationNames = {
    signal_jump: 'Signal Jump',
    sidewalk_bike: 'Sidewalk Riding',
    wrong_side: 'Wrong Side Driving',
    no_helmet: 'No Helmet',
    phone_driving: 'Phone While Driving',
    drunk_driving: 'Drunk Driving',
    zebra_violation: 'Zebra Crossing Violation',
    high_beam: 'High Beam Misuse',
    ambulance_block: 'Ambulance Blocking',
    school_zone: 'School Zone Speeding'
  }
  const name = violationNames[violationType] || violationType
  const fines = {
    signal_jump: '₹1,000–5,000',
    sidewalk_bike: '₹500–2,000',
    wrong_side: '₹500–5,000',
    no_helmet: '₹1,000 + license suspension',
    phone_driving: '₹5,000',
    drunk_driving: '₹10,000 + 6mo jail',
    zebra_violation: '₹500–2,000',
    high_beam: '₹500–2,000',
    ambulance_block: '₹10,000',
    school_zone: '₹2,000–10,000'
  }
  const fine = fines[violationType] || '₹500–10,000'
  const isMobile = window.innerWidth <= 768
  
  const modal = document.createElement('div')
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;'
  modal.innerHTML = `
    <div class="modal" style="background:linear-gradient(135deg,var(--card),var(--void));border:2px solid ${severity === 'critical' ? 'var(--red)' : 'var(--signal)'};border-radius:16px;padding:${isMobile ? '20px' : '28px'};max-width:${isMobile ? '95%' : '480px'};width:100%;position:relative;animation:modalIn 0.3s ease;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="font-size:${isMobile ? '2rem' : '2.5rem'};flex-shrink:0;">${severity === 'critical' ? '🚨' : '⚠️'}</div>
        <div style="flex:1;">
          <h2 style="font-family:'Instrument Serif',serif;font-size:${isMobile ? '1.3rem' : '1.5rem'};margin:0 0 4px;">${name} Violation</h2>
          <p style="color:var(--signal);font-weight:700;font-size:0.85rem;margin:0 0 12px;">Fine: ${fine}</p>
        </div>
      </div>
      <div style="margin:16px 0;padding:12px;background:rgba(94,212,245,0.1);border:1px solid rgba(94,212,245,0.3);border-radius:8px;">
        <div style="font-size:0.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Mumbai Traffic Police Data (${stat.year})</div>
        <div style="font-size:${isMobile ? '1.1rem' : '1.3rem'};font-weight:800;color:var(--signal);font-family:'Lora',serif;">${stat.stat}</div>
        <div style="font-size:0.8rem;color:var(--muted);">${stat.unit}</div>
        <div style="font-size:0.65rem;color:var(--muted);margin-top:4px;">Source: ${stat.source}</div>
      </div>
      ${severity === 'critical' ? `
        <div style="padding:10px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:8px;margin-bottom:16px;">
          <div style="font-size:0.75rem;color:var(--red);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">⚠️ Critical Risk</div>
          <div style="font-size:0.8rem;color:var(--text);margin-top:4px;">This violation causes ${stat.unit.includes('fatal') ? 'fatalities' : 'serious injuries'} in Mumbai every year.</div>
        </div>
      ` : ''}
      <div style="display:flex;gap:8px;">
        <button class="btn" onclick="this.closest('.modal').remove()" style="flex:1;background:var(--signal);color:#000;font-weight:700;padding:12px;border-radius:10px;">Understood</button>
        <button class="btn btn-s" onclick="this.closest('.modal').remove(); if(typeof ui!=='undefined') ui.showQuiz('car')" style="flex:1;padding:12px;border-radius:10px;">Practice Safe</button>
      </div>
    </div>
  `
  modal.className = 'modal'
  document.body.appendChild(modal)
  
  // Add modal animation
  if (!document.getElementById('modal-anim')) {
    const style = document.createElement('style')
    style.id = 'modal-anim'
    style.textContent = '@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }'
    document.head.appendChild(style)
  }
}

// ═══ CHARACTER CUSTOMIZATION SYSTEM ═══
(function() {
  const SKINS = [
    { hex: 0xfce4c7, name: 'Light' }, { hex: 0xf1c27d, name: 'Fair' },
    { hex: 0xd4a574, name: 'Medium' }, { hex: 0xc68642, name: 'Tan' },
    { hex: 0x8d5524, name: 'Brown' }, { hex: 0x5c3317, name: 'Dark' }
  ]
  const HAIRS = [
    { hex: 0x0a0a0a, name: 'Black' }, { hex: 0x3d2b1f, name: 'Dark Brown' },
    { hex: 0x654321, name: 'Brown' }, { hex: 0x8B4513, name: 'Chestnut' },
    { hex: 0xb5651d, name: 'Auburn' }, { hex: 0xd4a017, name: 'Dark Blonde' },
    { hex: 0xe8c872, name: 'Blonde' }, { hex: 0xc0c0c0, name: 'Silver' },
    { hex: 0xd32f2f, name: 'Red' }, { hex: 0x7b1fa2, name: 'Purple' }
  ]
  const SHIRTS = [
    { hex: 0xe74c3c, name: 'Red' }, { hex: 0x3498db, name: 'Blue' },
    { hex: 0x2ecc71, name: 'Green' }, { hex: 0xf39c12, name: 'Orange' },
    { hex: 0x9b59b6, name: 'Purple' }, { hex: 0x1abc9c, name: 'Teal' },
    { hex: 0xe67e22, name: 'Amber' }, { hex: 0x34495e, name: 'Navy' },
    { hex: 0xecf0f1, name: 'White' }, { hex: 0x2c3e50, name: 'Dark' },
    { hex: 0xff69b4, name: 'Pink' }, { hex: 0x00bcd4, name: 'Cyan' }
  ]
  const PANTS = [
    { hex: 0x2c3e50, name: 'Dark' }, { hex: 0x555555, name: 'Gray' },
    { hex: 0x1a237e, name: 'Navy' }, { hex: 0x333333, name: 'Charcoal' },
    { hex: 0x5d4037, name: 'Brown' }, { hex: 0x006064, name: 'Teal' }
  ]
  const EYES = [
    { hex: 0x4a90d9, name: 'Blue' }, { hex: 0x3d2b1f, name: 'Brown' },
    { hex: 0x2e7d32, name: 'Green' }, { hex: 0x616161, name: 'Gray' },
    { hex: 0x6d4c41, name: 'Hazel' }, { hex: 0x00acc1, name: 'Teal' }
  ]
  const SHOE_COLORS = [
    { hex: 0x1a1a1a, name: 'Black' }, { hex: 0xffffff, name: 'White' },
    { hex: 0xe74c3c, name: 'Red' }, { hex: 0x3498db, name: 'Blue' },
    { hex: 0xf39c12, name: 'Orange' }, { hex: 0x555555, name: 'Gray' }
  ]
  const HAIRSTYLES = [
    { id: 'classic', name: 'Classic' }, { id: 'short', name: 'Short' },
    { id: 'long', name: 'Long' }, { id: 'ponytail', name: 'Ponytail' },
    { id: 'bald', name: 'Bald' }
  ]
  const ACCESSORIES = [
    { id: 'cap', name: '🧢 Cap', on: true },
    { id: 'beanie', name: '🧶 Beanie', on: false },
    { id: 'helmet', name: '⛑️ Helmet', on: false },
    { id: 'backpack', name: '🎒 Backpack', on: true },
    { id: 'glasses', name: '🕶️ Glasses', on: false },
    { id: 'scarf', name: '🧣 Scarf', on: false }
  ]

  let _current = { skin: 0xd4a574, hair: 0x1a1a1a, hairStyle: 'classic', eyeColor: 0x4a90d9, shoes: 0x1a1a1a, shirt: 0xe74c3c, pants: 0x2c3e50, accessories: { cap: true, beanie: false, helmet: false, backpack: true, glasses: false, scarf: false } }
  let _previewScene, _previewCamera, _previewRenderer, _previewChar, _previewRAF

  function _loadSaved() {
    try {
      const s = JSON.parse(localStorage.getItem('traffic_appearance'))
      if (s) {
        _current.skin = s.skin || _current.skin
        _current.hair = s.hair || _current.hair
        _current.hairStyle = s.hairStyle || _current.hairStyle
        _current.eyeColor = s.eyeColor || _current.eyeColor
        _current.shoes = s.shoes || _current.shoes
        _current.shirt = s.shirt || _current.shirt
        _current.pants = s.pants || _current.pants
        if (s.accessories) _current.accessories = s.accessories
      }
    } catch (e) {}
  }

  // ── Sync appearance from Supabase to localStorage (fire-and-forget) ──
  async function _syncAppearanceFromCloud() {
    if (!window.supabaseClient || !window.colUser?.id) return
    try {
      const { data, error } = await window.supabaseClient
        .from('user_profiles')
        .select('appearance, appearance_updated_at')
        .eq('user_id', window.colUser.id)
        .maybeSingle()
      if (error || !data || !data.appearance) return
      // Only overwrite local if cloud version is newer or local doesn't exist
      const localRaw = localStorage.getItem('traffic_appearance')
      if (localRaw) {
        try {
          const local = JSON.parse(localRaw)
          const cloudTime = data.appearance_updated_at ? new Date(data.appearance_updated_at).getTime() : 0
          const localTime = local._updated || 0
          if (cloudTime <= localTime) return // local is newer or equal
        } catch (e) {}
      }
      localStorage.setItem('traffic_appearance', JSON.stringify(data.appearance))
      // Reload into _current and refresh preview if modal is open
      _loadSaved()
      _refreshSwatches()
      _updatePreviewModel()
    } catch (e) {
      console.warn('[customize] Cloud sync error:', e)
    }
  }

  // ── Sync appearance from localStorage to Supabase (fire-and-forget) ──
  async function _syncAppearanceToCloud() {
    if (!window.supabaseClient || !window.colUser?.id) return
    try {
      await window.supabaseClient
        .from('user_profiles')
        .upsert({
          user_id: window.colUser.id,
          appearance: { ..._current, _updated: Date.now() },
          appearance_updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
    } catch (e) {
      console.warn('[customize] Cloud save error:', e)
    }
  }

  function _swatchHTML(items, selected, group) {
    return items.map(it => {
      const sel = it.hex === selected ? 'border:2px solid #fff; transform:scale(1.2);' : 'border:2px solid transparent;'
      const css = new THREE.Color(it.hex).getStyle()
      return `<div title="${it.name}" onclick="window._pickSwatch('${group}',${it.hex})" style="width:36px; height:36px; border-radius:10px; background:${css}; cursor:pointer; transition:all 0.15s; ${sel}"></div>`
    }).join('')
  }

  function _hairstyleHTML() {
    return HAIRSTYLES.map(h => {
      const on = _current.hairStyle === h.id
      return `<button onclick="window._pickHairstyle('${h.id}')" style="padding:8px 14px; border-radius:10px; border:1px solid ${on ? 'var(--teal)' : 'var(--border)'}; background:${on ? 'rgba(0,240,204,0.1)' : 'var(--hover)'}; color:${on ? 'var(--teal)' : 'var(--muted)'}; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.15s;">${h.name}</button>`
    }).join('')
  }

  function _accessoryHTML() {
    return ACCESSORIES.map(a => {
      const on = _current.accessories[a.id]
      return `<button onclick="window._toggleAccessory('${a.id}')" style="padding:8px 14px; border-radius:10px; border:1px solid ${on ? 'var(--teal)' : 'var(--border)'}; background:${on ? 'rgba(0,240,204,0.1)' : 'var(--hover)'}; color:${on ? 'var(--teal)' : 'var(--muted)'}; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.15s;">${a.name}</button>`
    }).join('')
  }

  function _refreshSwatches() {
    const ss = document.getElementById('skin-swatches')
    const hs = document.getElementById('hair-swatches')
    const hys = document.getElementById('hairstyle-options')
    const es = document.getElementById('eye-swatches')
    const shs = document.getElementById('shirt-swatches')
    const ps = document.getElementById('pants-swatches')
    const shoes = document.getElementById('shoe-swatches')
    const ao = document.getElementById('accessory-options')
    if (ss) ss.innerHTML = _swatchHTML(SKINS, _current.skin, 'skin')
    if (hs) hs.innerHTML = _swatchHTML(HAIRS, _current.hair, 'hair')
    if (hys) hys.innerHTML = _hairstyleHTML()
    if (es) es.innerHTML = _swatchHTML(EYES, _current.eyeColor, 'eyeColor')
    if (shs) shs.innerHTML = _swatchHTML(SHIRTS, _current.shirt, 'shirt')
    if (ps) ps.innerHTML = _swatchHTML(PANTS, _current.pants, 'pants')
    if (shoes) shoes.innerHTML = _swatchHTML(SHOE_COLORS, _current.shoes, 'shoes')
    if (ao) ao.innerHTML = _accessoryHTML()
  }

  function _initPreview() {
    const canvas = document.getElementById('customize-preview')
    if (!canvas || !window.THREE) return
    if (_previewRenderer) { cancelAnimationFrame(_previewRAF); _previewRenderer.dispose() }
    _previewScene = new THREE.Scene()
    _previewScene.background = new THREE.Color(0x0a0e1a)
    _previewCamera = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 100)
    _previewCamera.position.set(0, 1.8, 5)
    _previewCamera.lookAt(0, 1.2, 0)
    _previewRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    _previewRenderer.setSize(canvas.width, canvas.height)
    _previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    _previewRenderer.toneMapping = THREE.ACESFilmicToneMapping
    _previewRenderer.toneMappingExposure = 1.0
    // ── Cinematic 3-point lighting ──
    const amb = new THREE.AmbientLight(0x8888ff, 0.25)
    _previewScene.add(amb)
    // Key light (warm, from front-right)
    const key = new THREE.DirectionalLight(0xffeedd, 1.1)
    key.position.set(3, 4, 4)
    _previewScene.add(key)
    // Fill light (cool, from front-left, softer)
    const fill = new THREE.DirectionalLight(0x8899ff, 0.35)
    fill.position.set(-2.5, 1.5, 3)
    _previewScene.add(fill)
    // Rim/Hair light from behind
    const rim = new THREE.DirectionalLight(0x88ddff, 0.5)
    rim.position.set(-1, 3, -5)
    _previewScene.add(rim)
    // Soft bottom bounce
    const bounce = new THREE.DirectionalLight(0x4466aa, 0.2)
    bounce.position.set(0, -3, 2)
    _previewScene.add(bounce)
    // ── Subtle ground reflection ──
    const groundGeo = new THREE.CircleGeometry(2.5, 24)
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x111622,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.02
    _previewScene.add(ground)
    // Gradient ring accent
    const ringAcc = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.65, 48),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })
    )
    ringAcc.rotation.x = -Math.PI / 2
    ringAcc.position.y = -0.01
    _previewScene.add(ringAcc)
    _updatePreviewModel()
  }

  function _updatePreviewModel() {
    if (!_previewScene) return
    if (_previewChar) _previewScene.remove(_previewChar)
    _previewChar = _buildHuman(true, _current)
    _previewChar.position.set(0, 0, 0)
    _previewScene.add(_previewChar)
  }

  function _animatePreview() {
    if (!_previewRenderer) return
    _previewRAF = requestAnimationFrame(_animatePreview)
    if (_previewChar) {
      _previewChar.rotation.y += 0.006
      // Subtle idle breathing — torso rises slightly
      if (_previewChar.userData) {
        const t = Date.now() * 0.002
        const breathe = Math.sin(t) * 0.004
        if (_previewChar.userData.torsoGroup) {
          _previewChar.userData.torsoGroup.position.y = 1.23 + breathe * 0.5
        }
        // Slight head sway
        if (_previewChar.userData.headGroup) {
          _previewChar.userData.headGroup.rotation.z = Math.sin(t * 0.7) * 0.004
        }
        // Blink timer
        if (_previewChar.userData.eyeLids) {
          const blinkPhase = Math.sin(t * 0.5) * 0.5 + 0.5
          _previewChar.userData.eyeLids.forEach(lid => {
            lid.scale.y = blinkPhase > 0.98 ? 0.2 : 0.7
          })
        }
      }
    }
    _previewRenderer.render(_previewScene, _previewCamera)
  }

  window._pickSwatch = function(group, hex) {
    _current[group] = hex
    _refreshSwatches()
    _updatePreviewModel()
  }

  window._pickHairstyle = function(id) {
    _current.hairStyle = id
    _refreshSwatches()
    _updatePreviewModel()
  }

  window._toggleAccessory = function(id) {
    _current.accessories[id] = !_current.accessories[id]
    // Mutual exclusion for headwear — only one at a time
    if (id === 'cap' && _current.accessories.cap) {
      _current.accessories.beanie = false
      _current.accessories.helmet = false
    } else if (id === 'beanie' && _current.accessories.beanie) {
      _current.accessories.cap = false
      _current.accessories.helmet = false
    } else if (id === 'helmet' && _current.accessories.helmet) {
      _current.accessories.cap = false
      _current.accessories.beanie = false
    }
    _refreshSwatches()
  }

  window._randomizeCustomize = function() {
    _current.skin = SKINS[Math.floor(Math.random() * SKINS.length)].hex
    _current.hair = HAIRS[Math.floor(Math.random() * HAIRS.length)].hex
    _current.hairStyle = HAIRSTYLES[Math.floor(Math.random() * HAIRSTYLES.length)].id
    _current.eyeColor = EYES[Math.floor(Math.random() * EYES.length)].hex
    _current.shoes = SHOE_COLORS[Math.floor(Math.random() * SHOE_COLORS.length)].hex
    _current.shirt = SHIRTS[Math.floor(Math.random() * SHIRTS.length)].hex
    _current.pants = PANTS[Math.floor(Math.random() * PANTS.length)].hex
    // Randomize headwear first (mutually exclusive)
    _current.accessories.beanie = Math.random() > 0.8
    _current.accessories.helmet = !_current.accessories.beanie && Math.random() > 0.85
    // Cap if neither beanie nor helmet active
    _current.accessories.cap = !_current.accessories.beanie && !_current.accessories.helmet && Math.random() > 0.3
    _current.accessories.backpack = Math.random() > 0.3
    _current.accessories.glasses = Math.random() > 0.7
    _current.accessories.scarf = Math.random() > 0.8
    _refreshSwatches()
    _updatePreviewModel()
  }

  window._saveCustomize = function() {
    _current._updated = Date.now()
    localStorage.setItem('traffic_appearance', JSON.stringify(_current))
    // Sync to Supabase in background
    _syncAppearanceToCloud()
    const modal = document.getElementById('customize-modal')
    if (modal) modal.style.display = 'none'
    if (_previewRenderer) { cancelAnimationFrame(_previewRAF); _previewRenderer.dispose(); _previewRenderer = null }
    // If in-game, respawn player with new appearance
    if (window.game && window.game.player && window.game.playerCharacter) {
      const pos = window.game.playerCharacter.position.clone()
      const rot = window.game.playerCharacter.rotation.y
      window.game.scene.remove(window.game.playerCharacter)
      window.game.playerCharacter = _buildHuman(true)
      window.game.playerCharacter.position.copy(pos)
      window.game.playerCharacter.rotation.y = rot
      window.game.scene.add(window.game.playerCharacter)
      window.game.player = window.game.playerCharacter
      toast('✨ Character updated!', '#34d399')
    } else {
      toast('✨ Appearance saved!', '#34d399')
    }
  }

  window.openCustomize = function() {
    _loadSaved()
    // Try loading cloud appearance (fires in background — local is immediate)
    _syncAppearanceFromCloud()
    const modal = document.getElementById('customize-modal')
    if (modal) {
      modal.style.display = 'flex'
      _refreshSwatches()
      _initPreview()
      _animatePreview()
    }
  }

  // ── Sync appearance on auth change (login/logout) ──
  window.addEventListener('col-auth-changed', () => {
    _syncAppearanceFromCloud()
  })

  window._buildHuman = _buildHuman
  window._buildVehicle = _buildVehicle
})()
