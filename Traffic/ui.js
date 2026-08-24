let _tt = null
function toast(msg, col = '#ffd54a', duration = 3000) {
  const t = document.getElementById('toast'),
    ti = document.getElementById('ti')
  if (!t || !ti) return
  ti.textContent = msg
  t.style.borderColor = col
  t.style.boxShadow = `0 12px 36px rgba(0, 0, 0, 0.85), 0 0 24px ${col}55`
  t.classList.add('on')
  clearTimeout(_tt)
  _tt = setTimeout(() => t.classList.remove('on'), duration)
}
const mob = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

function save() {
  try {
    const sObj = window.S || (typeof S !== 'undefined' ? S : null)
    if (sObj) {
      localStorage.setItem('mth4', JSON.stringify(sObj))
      localStorage.setItem('traffic_save', JSON.stringify(sObj))
      if (window.supabaseClient && window.colUser) {
        window.supabaseClient.auth.updateUser({ data: { progress: sObj } }).catch(() => {})
      }
    }
  } catch (e) {}
}
window.save = save


window.sfx = Object.assign(window.sfx || {}, {
  _c: null,
  vol: { sfx: 1, ui: 1, env: 1 },
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
   },
   // Ambient sound generators (procedural)
   _ambNodes: null,
   startAmbient(type) {
     this.stopAmbient()
     if (!this._c || this.vol.env <= 0) return
     try {
       const ctx = this._c
       this._ambNodes = {}
       const masterGain = ctx.createGain()
       masterGain.gain.value = 0.06 * this.vol.env
       masterGain.connect(ctx.destination)
       this._ambNodes.master = masterGain
       if (type === 'rain' || type === 'urban' || type === 'highway' || type === 'siren' || type === 'school') {
         const bufferSize = ctx.sampleRate * 2
         const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
         const data = buffer.getChannelData(0)
         for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3
         const noise = ctx.createBufferSource()
         noise.buffer = buffer; noise.loop = true
         const filter = ctx.createBiquadFilter()
         filter.type = 'lowpass'; filter.frequency.value = type === 'rain' ? 3000 : 1500
         noise.connect(filter); filter.connect(masterGain)
         noise.start()
         this._ambNodes.noise = noise; this._ambNodes.filter = filter
       }
       if (type === 'night') {
         const osc = ctx.createOscillator()
         osc.type = 'sine'; osc.frequency.value = 4200
         const gain = ctx.createGain(); gain.gain.value = 0.015
         const lfo = ctx.createOscillator(); lfo.frequency.value = 8
         const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.01
         lfo.connect(lfoGain); lfoGain.connect(gain.gain)
         osc.connect(gain); gain.connect(masterGain)
         osc.start(); lfo.start()
         this._ambNodes.osc = osc; this._ambNodes.lfo = lfo
       }
       if (type === 'festival') {
         const osc = ctx.createOscillator()
         osc.type = 'sine'; osc.frequency.value = 80
         const gain = ctx.createGain(); gain.gain.value = 0.025
         const lfo = ctx.createOscillator(); lfo.frequency.value = 2
         const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.02
         lfo.connect(lfoGain); lfoGain.connect(gain.gain)
         osc.connect(gain); gain.connect(masterGain)
         osc.start(); lfo.start()
         this._ambNodes.osc = osc; this._ambNodes.lfo = lfo
       }
     } catch (e) {}
   },
   stopAmbient() {
     if (!this._ambNodes) return
     try {
       Object.values(this._ambNodes).forEach(n => { if (n.stop) n.stop(); if (n.disconnect) n.disconnect() })
     } catch (e) {}
     this._ambNodes = null
   }
});


const CORRECTIVE_QUIZ = {
  'NO_HONKING': { q: 'Corrective Check: What is the rule for honking in silence zones?', o: ['It is strictly prohibited and carries a fine.', 'Honking is allowed once', 'Only honk if traffic is slow', 'Honk to warn pedestrians'], a: 0 },
  'MOBILE_USE': { q: 'Corrective Check: Why is phone use prohibited while driving?', o: ['It causes distraction and significantly increases accident risk.', 'It is only banned on highways', 'It is allowed if using a speaker', 'It only affects the vehicle speed'], a: 0 },
  'SAFETY_VIOLATION': { q: 'Corrective Check: What is the primary purpose of safety gear like helmets/seatbelts?', o: ['To reduce fatalities and injuries during accidents', 'To avoid police fines', 'To make the driver look professional', 'To improve vehicle aerodynamics'], a: 0 },
  'NO_INDICATOR': { q: 'Corrective Check: When is it mandatory to use a turn indicator?', o: ['Every time you intend to change direction or merge', 'Only at red lights', 'Only on highways', 'Only when other cars are present'], a: 0 },
  'LITTER_HIT': { q: 'Corrective Check: How does road litter affect vehicle control?', o: ['It can cause skidding or damage tires', 'It has no effect on control', 'It improves grip on wet roads', 'It only affects the paint'], a: 0 },
  'CHECKPOINT_EVASION': { q: 'Corrective Check: What is the legal consequence of fleeing a police checkpoint?', o: ['It is a serious offense often leading to immediate arrest', 'A simple warning', 'A small fine payable online', 'No consequence if you have a license'], a: 0 },
  'RED_LIGHT_VIOLATION': { q: 'Corrective Check: What is the mandatory action when a signal turns red?', o: ['Stop completely before the stop line', 'Slow down and proceed cautiously', 'Stop only if cars are coming', 'Flash headlights and pass quickly'], a: 0 }
};

var ui = window.ui = Object.assign(window.ui || {}, {
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
      S = { comp: {}, badges: [], total: 0, name: null, wallet: 50000, civicScore: 0 }
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






    if (typeof S === 'undefined') {
      let s = null
      try {
        const raw = localStorage.getItem('mth4')
        if (raw) s = JSON.parse(raw)
      } catch (e) {}
      if (!s || typeof s !== 'object') s = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000, studentId: null, civicScore: 0 }
      if (!s.comp) s.comp = {}
      if (!s.badges) s.badges = []
      if (!s.civicScore) s.civicScore = 0
      if (!s.studentId) {
        s.studentId = window.colUser?.uid || 'STU-' + Math.floor(100000 + Math.random() * 900000)
      }
      window.S = s
      try { localStorage.setItem('mth4', JSON.stringify(s)) } catch (e) {}
    }

    var save = window.save = async () => {
      try {
        const sObj = window.S || (typeof S !== 'undefined' ? S : null)
        if (sObj) {
          localStorage.setItem('mth4', JSON.stringify(sObj))
          localStorage.setItem('traffic_save', JSON.stringify(sObj))
          if (window.supabaseClient && window.colUser) {
            window.supabaseClient.auth.updateUser({ data: { progress: sObj } }).catch(() => {})
          }
        }
      } catch (e) {}
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
    this.updateDailyStreak()

    const cnameEl = document.getElementById('cname')
    if (cnameEl) {
      cnameEl.innerText = S.name || 'TRAFFIC HERO'
    }
    const hwalletEl = document.getElementById('hwallet')
    if (hwalletEl) {
      hwalletEl.textContent = '₹' + (S.wallet || 50000).toLocaleString('en-IN')
    }
    this._applyAgeTier()
    

    this.initMicroInteractions();
    

    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', (e) => { this._prefersReducedMotion = e.matches })
    }
  },

  _transitioning: false,
  _transitionTimer: null,
  _lastScreen: null,
  

  _screenDepth: { 'ss': 0, 'screen-levels': 1, 'screen-briefing': 2, 'screen-quiz': 3, 'screen-badges': 2, 'screen-certificate': 2, 'screen-2d': 4 },
  

  _screenHistory: [],

  _pendingTarget: null,

  _prefersReducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,

  _miObserver: null,






  
  initMicroInteractions() {
    if (this._miInited) return;
    this._miInited = true;
    const isMobile = mob();


    const reducedMotion = this._prefersReducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;


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


    if (!isMobile) {
      let _tiltCard = null;
      const tiltSelector = '.lcard:not(.lk), .wh-card, .lp-card';
      document.addEventListener('pointermove', (e) => {
        const card = e.target.closest(tiltSelector);
        if (card !== _tiltCard) {

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

  
  show(id, opts = {}) {
    if (this._transitioning && !opts.instant) {
      this._pendingTarget = { id, opts };
      return;
    }
    
    const target = id ? document.getElementById(id) : null;
    const currentActive = document.querySelector('.screen.active:not(.screen-exiting)');
    

    if (currentActive && currentActive.id === id && !opts.instant) return;
    

    if (this._prefersReducedMotion && !opts.instant) opts.instant = true;
    
    if (id && id !== null && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    if (id !== 'screen-briefing') {
      this._disposeBriefingScene()
    }
    

    let direction = opts.direction;
    if (!direction && currentActive && id) {
      const fromDepth = this._screenDepth[currentActive.id] ?? 1;
      const toDepth = this._screenDepth[id] ?? 1;
      direction = toDepth > fromDepth ? 'forward' : toDepth < fromDepth ? 'back' : 'up';
    }
    direction = direction || 'fade';
    

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
    

    this._screenHistory.push(currentActive?.id || null);
    if (this._screenHistory.length > 10) this._screenHistory.shift();
    

    this._transitioning = true;
    clearTimeout(this._transitionTimer);
    

    if (currentActive && currentActive.id !== id) {
      const exitClass = 'screen-exiting';
      const exitVariant = {
        'forward': 'screen-exiting-up',
        'back': 'screen-exiting-backward',
        'up': 'screen-exiting-up',
        'scale': 'screen-exiting-scale',
        'fade': ''
      }[direction] || '';
      

      currentActive.classList.add(exitClass);
      if (exitVariant) currentActive.classList.add(exitVariant);
      

      const exitDuration = 250;
      setTimeout(() => {
        currentActive.classList.remove('active', 'screen-animate-in', exitClass);
        if (exitVariant) currentActive.classList.remove(exitVariant);
        currentActive.style.opacity = '';
        currentActive.style.transform = '';
        currentActive.style.pointerEvents = '';
        

        if (target) {
          const enterClass = {
            'forward': 'screen-entering-forward',
            'back': 'screen-entering-back',
            'up': 'screen-entering-up',
            'scale': 'screen-entering-scale',
            'fade': 'screen-entering'
          }[direction] || 'screen-entering';
          

          target.classList.add('active', 'screen-animate-in', enterClass);
          

          const enterDuration = 520;
          this._transitionTimer = setTimeout(() => {
            target.classList.remove('screen-animate-in', enterClass);
            this._transitioning = false;

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

      if (target) {
        const enterClass = {
          'forward': 'screen-entering-forward',
          'back': 'screen-entering-back',
          'up': 'screen-entering-up',
          'scale': 'screen-entering-scale',
          'fade': 'screen-entering'
        }[direction] || 'screen-entering';
        

        target.classList.add('active', 'screen-animate-in', enterClass);
        this._transitionTimer = setTimeout(() => {
          target.classList.remove('screen-animate-in', enterClass);
          this._transitioning = false;

          if (this._pendingTarget) {
            const pending = this._pendingTarget;
            this._pendingTarget = null;
            this.show(pending.id, pending.opts);
          }
        }, 520);
      } else {
        this._transitioning = false;
      }
    }
  },
  
  
  showBack(id) {
    this._screenHistory.pop();
    this.show(id, { direction: 'back' });
  },
  _buildSylList() {

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
        const comp = S.comp && S.comp[lv.id]
        const done = comp && (comp.score > 0 || comp.finalQuiz || comp.completed || comp === true || (comp.modes && Object.keys(comp.modes).length > 0))
        const started = !done && ((S.started && S.started[lv.id]) || (S.sylViewed && S.sylViewed[lv.id] && S.sylViewed[lv.id].length > 0) || (S.comp && S.comp[lv.id]))
        const statusClass = done ? ' syl-done' : started ? ' syl-started' : ''

        let masteryPill = ''
        if (done) {
          const vio = comp.vio !== undefined ? comp.vio : 0
          const score = comp.score || 0
          if (vio === 0 && score >= 90) {
            masteryPill = '<span class="syl-mastery-pill plat" style="background:rgba(184,155,255,0.15);color:#b89bff;border:1px solid rgba(184,155,255,0.3);font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:6px;" title="Platinum Mastery">💎 Platinum</span>'
          } else if (vio === 0) {
            masteryPill = '<span class="syl-mastery-pill gold" style="background:rgba(255,213,74,0.15);color:#ffd54a;border:1px solid rgba(255,213,74,0.3);font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:6px;" title="Gold Mastery">🥇 Gold</span>'
          } else if (vio <= 1) {
            masteryPill = '<span class="syl-mastery-pill silver" style="background:rgba(192,192,192,0.15);color:#e2e8f0;border:1px solid rgba(192,192,192,0.3);font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:6px;" title="Silver Mastery">🥈 Silver</span>'
          } else {
            masteryPill = '<span class="syl-mastery-pill bronze" style="background:rgba(205,127,50,0.15);color:#cd7f32;border:1px solid rgba(205,127,50,0.3);font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:6px;" title="Bronze Mastery">🥉 Bronze</span>'
          }
        }

        const badgeText = done ? '✓ Completed' : started ? '● Started' : '○ Not Started'
        const cleanName = lv.name.replace(/^Lesson\s+\d+\s*[-–]\s*/i, '')
        const statusType = done ? 'done' : (started ? 'started' : 'locked')

        const div = document.createElement('div')
        div.className = 'level-grid-card' + statusClass
        div.innerHTML = `
          <div class="lgc-top">
            <div class="lgc-pill-wrap">
              <span class="lgc-icon">${lv.icon || '🚦'}</span>
              <span class="lgc-lesson-num">Lesson ${lv.id}</span>
            </div>
            <div class="lgc-status-indicator ${statusType}">
              ${done ? '✓' : (started ? '●' : '○')}
            </div>
          </div>
          <div class="lgc-body">
            <div class="lgc-title">${cleanName}</div>
            <div class="lgc-desc">${lv.ds || ''}</div>
          </div>
          <div class="lgc-footer">
            <div class="lgc-badges">
              <span class="lgc-status-badge ${statusType}">${badgeText}</span>
              ${masteryPill}
            </div>
            <div class="lgc-action-btn">${done ? 'Review ↻' : 'Start →'}</div>
          </div>
        `
        div.onclick = () => (window.ui || this).showBriefing(lv.id)
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


    const fromStart = currentActive?.id === 'ss'
    const levelsEl = document.getElementById('screen-levels')
    if (fromStart) {
      this.show('screen-levels', { instant: true })

      if (levelsEl) {
        requestAnimationFrame(() => {
          levelsEl.classList.add('screen-animate-in')
          setTimeout(() => levelsEl.classList.remove('screen-animate-in'), 520)
        })
      }
    } else {
      this.show('screen-levels', { direction: 'fade' })
    }

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
    

    const localUser = JSON.parse(localStorage.getItem('traffic_local_user') || '{}')
    localUser.vehicle = v
    localStorage.setItem('traffic_local_user', JSON.stringify(localUser))
    

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

    const grade = S.grade || 5
    if (grade <= 3) return 'grade-low'
    if (grade <= 6) return 'grade-mid'
    if (grade <= 9) return 'grade-high'
    return 'grade-max'
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


    if (!S.grade) S.grade = 5

    this._applyGradeUI()
  },

  // ─── PUBLIC: Apply config-driven age tier ───
  async applyAgeTier(tier) {
    // Fetch age config if not cached
    if (!window.AGE_CONFIG) {
      try {
        const resp = await fetch('age-config.json');
        window.AGE_CONFIG = await resp.json();
      } catch (e) {
        console.warn('Could not load age-config.json, using defaults');
        window.AGE_CONFIG = {
          ui: { child: { buttonScale: 1.5, fontSize: 1.3, sounds: true, animations: 'bounce' },
               teen: { buttonScale: 1.15, fontSize: 1.1, sounds: true, animations: 'smooth' },
               adult: { buttonScale: 1.0, fontSize: 1.0, sounds: false, animations: 'minimal' } },
          gameplay: { child: { timeLimitMult: 2.0, npcDensityMult: 0.3, autoBrake: true, ghostCar: true },
                      teen: { timeLimitMult: 1.2, npcDensityMult: 0.7, autoBrake: false, ghostCar: true },
                      adult: { timeLimitMult: 1.0, npcDensityMult: 1.0, autoBrake: false, ghostCar: false } }
        };
      }
    }

    const cfg = window.AGE_CONFIG;
    const uiCfg = cfg.ui[tier] || cfg.ui.adult;
    const gameCfg = cfg.gameplay[tier] || cfg.gameplay.adult;
    const root = document.documentElement;

    // Apply UI config
    root.style.setProperty('--btn-scale', uiCfg.buttonScale || 1);
    root.style.setProperty('--ui-font-size', uiCfg.fontSize + 'rem' || '1rem');
    
    // Store tier on body for CSS
    document.body.dataset.ageTier = tier;
    
    // Apply sound settings
    if (window.sfx) {
      window.sfx.vol.sfx = uiCfg.sounds ? 1 : 0;
      window.sfx.vol.ui = uiCfg.sounds ? 1 : 0;
    }
    
    // Apply gameplay config globally
    window.GAME_CONFIG = { ...window.GAME_CONFIG, ...gameCfg };
    
    // Apply CSS class for tier-specific styling
    document.body.classList.remove('age-child', 'age-teen', 'age-adult');
    document.body.classList.add('age-' + tier);
    
    toast(`🎯 Age tier applied: ${tier}`, '#5ed4f5');
  },
  _applyGradeUI() {
    const cfg = this.getGradeConfig()
    const root = document.documentElement


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


    if (completedLevels >= totalLevels) {
      if (cStat) cStat.innerText = `COMPLETED WITH ${Math.round(avgScore)}% PROFICIENCY`
      if (cScoreLbl) cScoreLbl.innerText = `${Math.round(avgScore)}%`
      if (cdownloadBtn) cdownloadBtn.style.display = 'flex'
    } else {
      if (cStat) cStat.innerText = `IN PROGRESS: ${completedLevels}/${totalLevels} levels completed`
      if (cScoreLbl) cScoreLbl.innerText = `${Math.round(avgScore)}%`

      if (cdownloadBtn) cdownloadBtn.style.display = isLoggedIn ? 'flex' : 'none'
    }
    if (certNum) certNum.innerText = completedLevels >= totalLevels ? S.certId : '---'
  },
  getDriverRank(score) {
    const totalScore = score !== undefined ? score : (S.total || 0)
    const RANKS = [
      { min: 0, id: 'learner', name: 'Learner', icon: '🔰', color: '#94a3b8', max: 499 },
      { min: 500, id: 'cadet', name: 'Cadet', icon: '🚗', color: '#5ed4f5', max: 1999 },
      { min: 2000, id: 'junior', name: 'Junior Driver', icon: '🏎️', color: '#34d399', max: 4999 },
      { min: 5000, id: 'captain', name: 'Road Captain', icon: '🛡️', color: '#ffd54a', max: 9999 },
      { min: 10000, id: 'expert', name: 'Traffic Expert', icon: '⭐', color: '#a855f7', max: 19999 },
      { min: 20000, id: 'master', name: 'Master Instructor', icon: '👑', color: '#f43f5e', max: Infinity }
    ]
    let current = RANKS[0]
    let next = RANKS[1]
    for (let i = 0; i < RANKS.length; i++) {
      if (totalScore >= RANKS[i].min) {
        current = RANKS[i]
        next = RANKS[i + 1] || null
      }
    }
    const progress = next
      ? Math.min(100, Math.round(((totalScore - current.min) / (next.min - current.min)) * 100))
      : 100
    const ptsToNext = next ? next.min - totalScore : 0
    return { current, next, progress, ptsToNext, totalScore }
  },

  updateDailyStreak() {
    if (!S.streak) S.streak = { current: 0, best: 0, lastDate: null, freezes: 1 }
    const today = new Date().toISOString().slice(0, 10)
    const last = S.streak.lastDate

    if (!last) {
      S.streak.current = 1
      S.streak.best = Math.max(1, S.streak.best || 1)
      S.streak.lastDate = today
      save()
    } else if (last !== today) {
      const lastDate = new Date(last)
      const curDate = new Date(today)
      const diffDays = Math.round((curDate - lastDate) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        S.streak.current = (S.streak.current || 0) + 1
        S.streak.best = Math.max(S.streak.current, S.streak.best || 0)
        S.streak.lastDate = today
        if (S.streak.current % 7 === 0) {
          S.streak.freezes = (S.streak.freezes || 0) + 1
          toast('🛡️ 7-Day Milestone! +1 Streak Freeze Token Earned!', '#ffd54a')
        }
        save()
      } else if (diffDays === 2 && (S.streak.freezes > 0 || S.streakShield > 0)) {
        if (S.streak.freezes > 0) S.streak.freezes--
        else if (S.streakShield > 0) S.streakShield--
        S.streak.lastDate = today
        toast(`🛡️ Streak Freeze saved your ${S.streak.current}-day streak!`, '#5ed4f5')
        save()
      } else if (diffDays > 1) {
        S.streak.current = 1
        S.streak.lastDate = today
        save()
      }
    }
    this.renderStreakCounters()
  },

  renderStreakCounters() {
    const streakCount = S.streak?.current || 0
    const freezes = S.streak?.freezes || 0
    const streakEls = document.querySelectorAll('.nav-streak-counter, #br-streak, #nav-streak')
    streakEls.forEach((el) => {
      el.innerHTML = `🔥 ${streakCount} <span style="font-size:0.75rem;opacity:0.8;">(${freezes} 🛡️)</span>`
      el.title = `Daily Streak: ${streakCount} Days Active | ${freezes} Streak Freeze Tokens Available`
    })
  },

  showBadges() {
    this.show('screen-badges', { direction: 'forward' })

    const statsBody = document.getElementById('stats-body')
    if (statsBody) {
      const rankInfo = this.getDriverRank()
      const streak = S.streak || { current: 0, best: 0, freezes: 1 }
      const doneCount = S.comp ? Object.keys(S.comp).length : 0
      const totalLevels = typeof LVS !== 'undefined' ? LVS.length : 55
      const startedCount = S.started ? Object.keys(S.started).length : 0

      // Calculate mastery stats
      let platinumCount = 0,
        goldCount = 0,
        silverCount = 0,
        bronzeCount = 0
      if (S.comp) {
        Object.values(S.comp).forEach((c) => {
          if (c && (c.score > 0 || c.completed || c.finalQuiz)) {
            const vio = c.vio !== undefined ? c.vio : 0
            const score = c.score || 0
            if (vio === 0 && score >= 90) platinumCount++
            else if (vio === 0) goldCount++
            else if (vio <= 1) silverCount++
            else bronzeCount++
          }
        })
      }

      statsBody.innerHTML = `
        <!-- Driver Rank Hero Card -->
        <div style="background: linear-gradient(135deg, rgba(17,24,39,0.95), rgba(7,10,20,0.95)); border: 2px solid ${rankInfo.current.color}; border-radius: 18px; padding: 20px; margin-bottom: 20px; box-shadow: 0 12px 32px rgba(0,0,0,0.4);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 2.5rem;">${rankInfo.current.icon}</span>
              <div>
                <div style="font-size: 0.7rem; font-weight: 800; color: ${rankInfo.current.color}; text-transform: uppercase; letter-spacing: 0.1em;">Official Driver Rank</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #fff; font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em;">${rankInfo.current.name}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.2rem; font-weight: 800; color: #ffd54a;">${rankInfo.totalScore.toLocaleString()} XP</div>
              <div style="font-size: 0.72rem; color: #8891aa;">${rankInfo.next ? rankInfo.ptsToNext.toLocaleString() + ' XP to ' + rankInfo.next.name : 'Max Tier Reached!'}</div>
            </div>
          </div>
          <!-- Rank Progress Bar -->
          <div style="height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; position: relative;">
            <div style="height: 100%; width: ${rankInfo.progress}%; background: linear-gradient(90deg, ${rankInfo.current.color}, #00f0cc); border-radius: 4px; transition: width 0.6s ease;"></div>
          </div>
        </div>

        <!-- Mastery Tiers Summary -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 20px;">
          <div style="background: rgba(184,155,255,0.08); border: 1px solid rgba(184,155,255,0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 1.4rem;">💎</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #b89bff; margin-top: 4px;">${platinumCount}</div>
            <div style="font-size: 0.65rem; color: #8891aa; text-transform: uppercase; font-weight: 700;">Platinum</div>
          </div>
          <div style="background: rgba(255,213,74,0.08); border: 1px solid rgba(255,213,74,0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 1.4rem;">🥇</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #ffd54a; margin-top: 4px;">${goldCount}</div>
            <div style="font-size: 0.65rem; color: #8891aa; text-transform: uppercase; font-weight: 700;">Gold</div>
          </div>
          <div style="background: rgba(192,192,192,0.08); border: 1px solid rgba(192,192,192,0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 1.4rem;">🥈</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #e2e8f0; margin-top: 4px;">${silverCount}</div>
            <div style="font-size: 0.65rem; color: #8891aa; text-transform: uppercase; font-weight: 700;">Silver</div>
          </div>
          <div style="background: rgba(205,127,50,0.08); border: 1px solid rgba(205,127,50,0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 1.4rem;">🥉</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #cd7f32; margin-top: 4px;">${bronzeCount}</div>
            <div style="font-size: 0.65rem; color: #8891aa; text-transform: uppercase; font-weight: 700;">Bronze</div>
          </div>
        </div>

        <!-- Key Driver Metrics -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px;">
            <div style="color: #8891aa; font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">Daily Streak</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: #ffd54a; margin-top: 4px;">🔥 ${streak.current} Days <span style="font-size:0.75rem; color:#5ed4f5; font-weight:600;">(${streak.freezes} 🛡️)</span></div>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px;">
            <div style="color: #8891aa; font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">Wallet Balance</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: #34d399; margin-top: 4px;">₹${(S.wallet || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      `
    }

    const pledgeBox = document.getElementById('profile-pledge-box')
    if (pledgeBox) {
      const hasPledge = S.pledges && S.pledges['general']
      const pledge = S.pledges ? S.pledges['general'] : null
      pledgeBox.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(94,212,245,0.08), rgba(242,184,75,0.08)); border: 1px solid rgba(242,184,75,0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="font-size: 2.2rem;">🤝</div>
              <div>
                <div style="font-weight: 700; font-size: 1.1rem; color: var(--text, #e8e3d8);">Civic Driver's Safety Pledge</div>
                <div style="font-size: 0.82rem; color: var(--muted, #8891aa); margin-top: 2px;">
                  ${hasPledge ? `Active Oath: "If ${pledge.if} → Then ${pledge.then}"` : 'Sign your official implementation commitment to practice safe driving.'}
                </div>
              </div>
            </div>
            <button class="btn btn-p" onclick="ui.showCommitmentPledge('general')" style="padding: 8px 20px; font-size: 0.85rem; font-weight: 700;">
              ${hasPledge ? '✏️ Update Pledge' : '✍️ Sign Driver Pledge'}
            </button>
          </div>
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

      const prevWrapperOverflow = wrapper.style.overflow
      const prevWrapperJustify = wrapper.style.justifyContent
      const prevWrapperMargin = wrapper.style.margin
      const prevCrtTransform = crt.style.transform
      const prevCrtTransformOrigin = crt.style.transformOrigin
      const prevCrtWidth = crt.style.width
      const prevCrtPageBreak = crt.style.pageBreakInside
      const prevCrtBreakInside = crt.style.breakInside

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
        

        let levelProgress = 0
        if (cm) levelProgress = 100
        else if (ip && S.comp[lv.id]) {

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
          c.onclick = () => {
            ui.showSyllabus(lv.id);
          }
        }
        tr.appendChild(c)
      })
      body.appendChild(tr)
    })
    

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
    

    if (!S.streak) S.streak = { current: 0, best: 0, lastDate: null }
    

    const streakEl = document.getElementById('br-streak')
    if (streakEl) {
      const isActive = S.streak && S.streak.current > 0
      streakEl.innerHTML = isActive 
        ? `🔥 ${S.streak.current} Day Streak` 
        : '🔥 0 Day Streak'
      streakEl.style.background = isActive 
        ? 'linear-gradient(90deg, var(--signal), var(--accent))'
        : 'linear-gradient(90deg, var(--muted), var(--muted2))'
    }
    

    this._initModeTabs(lv)
    
    const isCompleted = S.comp && S.comp[lv.id] && (S.comp[lv.id].score > 0 || S.comp[lv.id].finalQuiz || S.comp[lv.id].completed || S.comp[lv.id] === true || (S.comp[lv.id].modes && Object.keys(S.comp[lv.id].modes).length > 0))

    const progFill = document.getElementById('br-prog-fill')
    const progLabel = document.getElementById('br-prog-label')
    if (progFill && progLabel) {
      if (isCompleted) {
        progFill.style.width = '100%'
        progLabel.textContent = '100% Complete (Mastered)'
      } else {
        const viewedCount = (S.sylViewed && S.sylViewed[lv.id]) ? S.sylViewed[lv.id].length : 0
        const pct = Math.min(90, Math.round((viewedCount / 4) * 100))
        progFill.style.width = pct + '%'
        progLabel.textContent = pct > 0 ? `${pct}% Complete` : '0% Complete'
      }
    }

    const items = this._getSyllabusForMode(lv, 'learn')
    this._sylItems = items
    this._sylViewed = new Set((S.sylViewed && S.sylViewed[lv.id]) ? S.sylViewed[lv.id] : [])
    this._sylLv = lv
    this._lawLang = S.language === 'hi' ? 'hi' : 'en'
    const list = document.getElementById('br-syllabus')
    if (list) {
      list.innerHTML = ''
      items.forEach((it) => {
        const el = document.createElement('div')
        el.className = 'syl-item' + (isCompleted || this._sylViewed.has(it.id) ? ' syl-done' : '')
        el.id = 'syl-' + it.id
        el.innerHTML = `<div class="syl-ck" id="sylck-${it.id}"></div><div class="syl-info"><div class="syl-lbl">${it.icon} ${it.label}</div><div class="syl-sub">${it.sub}</div></div>`
        el.onclick = () => this._selSyl(it.id)
        list.appendChild(el)
      })
    }
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
        if (tab.dataset.mode === 'learn') this._selSyl('intro')
        else if (tab.dataset.mode === 'practice') this._selSyl('practical')
        else if (tab.dataset.mode === 'chaos') this._selSyl('chaos')
        else if (tab.dataset.mode === 'exam') this._selSyl('exam')
      }

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
    
    const syllabusEl = document.getElementById('br-syllabus')
    const items = this._getSyllabusForMode(lv, mode)
    this._sylItems = items
    
    const isCompleted = S.comp && S.comp[lv.id] && (S.comp[lv.id].score > 0 || S.comp[lv.id].finalQuiz || S.comp[lv.id].completed || S.comp[lv.id] === true || (S.comp[lv.id].modes && Object.keys(S.comp[lv.id].modes).length > 0))
    this._sylViewed = new Set((S.sylViewed && S.sylViewed[lv.id]) ? S.sylViewed[lv.id] : [])
    this._sylLv = lv

    const progFill = document.getElementById('br-prog-fill')
    const progLabel = document.getElementById('br-prog-label')
    if (progFill && progLabel) {
      if (isCompleted) {
        progFill.style.width = '100%'
        progLabel.textContent = '100% Complete (Mastered)'
      } else {
        const viewedCount = this._sylViewed.size
        const pct = Math.min(90, Math.round((viewedCount / Math.max(1, items.length)) * 100))
        progFill.style.width = pct + '%'
        progLabel.textContent = pct > 0 ? `${pct}% Complete` : '0% Complete'
      }
    }

    if (syllabusEl) {
      syllabusEl.innerHTML = ''
      items.forEach((it) => {
        const el = document.createElement('div')
        el.className = 'syl-item' + (isCompleted || this._sylViewed.has(it.id) ? ' syl-done' : '')
        el.id = 'syl-' + it.id
        el.innerHTML = `<div class="syl-ck" id="sylck-${it.id}"></div><div class="syl-info"><div class="syl-lbl">${it.icon} ${it.label}</div><div class="syl-sub">${it.sub}</div></div>`
        el.onclick = () => this._selSyl(it.id)
        syllabusEl.appendChild(el)
      })
    }
    
    let firstUnviewed = items.find(it => !this._sylViewed.has(it.id))
    this._selSyl(firstUnviewed ? firstUnviewed.id : (items[0]?.id || 'intro'))
    
    this._renderRewardsPreview(lv, mode, config)
  },
  _getSyllabusForMode(lv, mode) {
    const base = [
      { id: 'intro', icon: '📖', label: 'Overview', sub: 'Mission Briefing' },
      ...lv.hps.map((hp, i) => ({ id: 'rule' + i, icon: '⚖️', label: 'Guideline ' + (i + 1), sub: hp.split(':')[0].substring(0, 24) })),
      { id: 'law', icon: '🏛️', label: 'Legal Penalty', sub: 'Statutory Consequences' },
      { id: 'theory', icon: '📊', label: 'Science', sub: 'Traffic Theory' },
      { id: 'practical', icon: '🎯', label: 'Execution', sub: 'Driving Test' },
      { id: 'chaos', icon: '🌪️', label: 'Chaos Run', sub: 'Adaptive Stress Test' },
      { id: 'exam', icon: '📝', label: 'Assessment', sub: `${window.COURSE?.MODE_CONFIG?.EXAM?.mcqCount || 5} MCQ Questions` }
    ]
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
  _renderCampaignProgress(lv) {
    const campaignManager = window.game?.campaignManager
    if (!campaignManager || !window.getCampaignsForModule) return
    
    const campaigns = window.getCampaignsForModule(lv.module?.id || 1)
    if (!campaigns || campaigns.length === 0) return
    
    const campaign = campaigns[0]
    const progress = campaignManager.getCampaignProgress(campaign.id)
    if (!progress) return
    
    const container = document.getElementById('br-campaign-progress')
    if (!container) return
    
    const { campaign: c, completedCount, totalMissions, currentMission, unlocked, progressPercent } = progress
    
    if (!unlocked) {
      container.innerHTML = `
        <div style="padding:16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;text-align:center;">
          <div style="font-size:1.5rem;margin-bottom:8px;">🔒</div>
          <div style="font-size:0.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">CAMPAIGN LOCKED</div>
          <div style="font-size:0.85rem;color:var(--text);">${c.prerequisite ? 'Complete ' + window.getCampaign(c.prerequisite)?.name + ' first' : 'Requirements not met'}</div>
        </div>
      `
      return
    }
    
    const missionsHtml = c.missions.map((m, i) => {
      const status = i < completedCount ? 'completed' : 
                     (currentMission && m.levelId === currentMission.levelId ? 'current' : 'pending')
      const statusIcon = status === 'completed' ? '✅' : status === 'current' ? '▶️' : '⏳'
      const statusColor = status === 'completed' ? 'var(--green)' : status === 'current' ? 'var(--signal)' : 'var(--muted)'
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;transition:all 0.2s;">
          <div style="font-size:1.2rem;flex-shrink:0;">${statusIcon}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.85rem;font-weight:600;color:var(--text);">${m.title}</div>
            <div style="font-size:0.7rem;color:var(--muted);margin-top:2px;">${m.briefing}</div>
          </div>
          <div style="font-size:0.7rem;font-weight:700;color:${statusColor};text-transform:uppercase;letter-spacing:0.03em;">${status}</div>
        </div>
      `
    }).join('')
    
    container.innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-size:2rem;">${c.icon}</div>
            <div>
              <div style="font-size:0.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">CAMPAIGN</div>
              <div style="font-size:1.1rem;font-weight:800;color:var(--text);font-family:'Bebas Neue',sans-serif;letter-spacing:0.02em;">${c.name}</div>
            </div>
          </div>
          <div style="font-size:0.85rem;font-weight:700;color:var(--signal);">${Math.round(progressPercent)}%</div>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${progressPercent}%;background:linear-gradient(90deg,var(--signal),var(--accent));border-radius:3px;transition:width 0.5s ease;"></div>
        </div>
        <div style="margin-top:16px;max-height:300px;overflow-y:auto;padding-right:8px;">
          ${missionsHtml}
        </div>
        ${progress.completed ? `
          <div style="margin-top:16px;padding:16px;background:rgba(255,213,74,0.15);border:1px solid rgba(255,213,74,0.4);border-radius:12px;text-align:center;">
            <div style="font-size:2rem;margin-bottom:8px;">🏆</div>
            <div style="font-size:1rem;font-weight:800;color:var(--signal);font-family:'Bebas Neue',sans-serif;">CAMPAIGN COMPLETE!</div>
            <div style="font-size:0.85rem;color:var(--muted);margin-top:4px;">Rewards: ${c.rewards.wallet?.toLocaleString()}₹ + ${c.rewards.xp?.toLocaleString()} XP + Badge</div>
          </div>
        ` : ''}
    `
  },
  _renderRewardsPreview(lv, mode, config) {
    const contentEl = document.getElementById('br-content')
    if (!contentEl) return
    
    const xp = config.xpBase || 0
    const streakBonus = config.streakBonus || 0
    const badge = config.badge
    const mysteryChance = 0.15
    

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


    if (id === 'pledge') {
      document.querySelectorAll('.syl-item').forEach((el) => el.classList.remove('syl-active'))
      const el = document.getElementById('syl-' + id)
      if (el) el.classList.add('syl-active')
      this.showCommitmentPledge(lv.id)
      if (!this._sylViewed.has(id)) {
        this._sylViewed.add(id)
        if (!S.sylViewed) S.sylViewed = {}
        if (!S.sylViewed[lv.id]) S.sylViewed[lv.id] = []
        if (!S.sylViewed[lv.id].includes(id)) {
          S.sylViewed[lv.id].push(id)
        }
        if (typeof save === 'function') save()
        const sylEl = document.getElementById('syl-' + id)
        if (sylEl) sylEl.classList.add('syl-done')
      }
      const pct = Math.round((this._sylViewed.size / items.length) * 100)
      const progFill = document.getElementById('br-prog-fill')
      const progLabel = document.getElementById('br-prog-label')
      if (progFill) progFill.style.width = pct + '%'
      if (progLabel) progLabel.textContent = pct + '%'
      return
    }

    this._disposeBriefingScene()
    ui.curMode = ui.curMode || (lv.modes ? lv.modes[0] : 'car')
    document.querySelectorAll('.syl-item').forEach((el) => el.classList.remove('syl-active'))
    const el = document.getElementById('syl-' + id)
    if (el) el.classList.add('syl-active')
    if (!this._sylViewed.has(id)) {
      this._sylViewed.add(id)
      

      if (!S.sylViewed) S.sylViewed = {}
      if (!S.sylViewed[lv.id]) S.sylViewed[lv.id] = []
      if (!S.sylViewed[lv.id].includes(id)) {
        S.sylViewed[lv.id].push(id)
      }
      
      if (!S.started) S.started = {}
      S.started[lv.id] = true


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
    

    const pct = Math.round((this._sylViewed.size / items.length) * 100)
    const progFill = document.getElementById('br-prog-fill')
    const progLabel = document.getElementById('br-prog-label')
    if (progFill) progFill.style.width = pct + '%'
    if (progLabel) progLabel.textContent = pct + '%'

    const c = document.getElementById('br-content')
    c.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'bc-card'

    // Add Top Breadcrumb Bar for clear orientation
    const topicHeaderHTML = this._renderTopicHeader(lv, id, items)

    if (id === 'intro') {
      const curriculumRows = items.filter(it => it.id !== 'intro').map((it, idx) => {
        const isDone = this._sylViewed && this._sylViewed.has(it.id)
        return `
          <div class="syl-curriculum-row" onclick="ui._selSyl('${it.id}')">
            <div style="display:flex; align-items:center; min-width:0; flex:1;">
              <span class="syl-cur-num">${String(idx + 1).padStart(2, '0')}</span>
              <div class="syl-cur-info">
                <div class="syl-cur-title">${it.icon} ${it.label}</div>
                <div class="syl-cur-desc">${it.sub}</div>
              </div>
            </div>
            <div class="syl-cur-btn">
              ${isDone ? '<span style="color:#10b981;">✓ Viewed</span>' : '<span>Start &rarr;</span>'}
            </div>
          </div>
        `
      }).join('')

      card.innerHTML = `
        ${topicHeaderHTML}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div class="bc-ttl" style="margin:0;">📖 Module Overview</div>
          <span style="background:rgba(255,213,74,0.12); color:var(--signal); border:1px solid rgba(255,213,74,0.3); font-size:0.75rem; font-weight:700; padding:4px 12px; border-radius:20px; text-transform:uppercase;">Level ${lv.id}</span>
        </div>
        <div style="font-size:clamp(1.5rem, 3.5vw, 2.1rem); font-weight:800; color:#fff; font-family:'Lora',serif; margin-bottom:10px; line-height:1.25;">${lv.name}</div>
        <div style="font-size:0.95rem; line-height:1.65; color:rgba(255,255,255,0.85); background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px 20px; margin-bottom:20px;">${lv.ds}</div>
        
        <div class="stat-row" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:24px;">
          <div class="stat-box">
            <div class="stat-val" style="color:var(--signal);">${lv.hps.length}</div>
            <div class="stat-lbl">Mandates</div>
          </div>
          <div class="stat-box" style="background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.2);">
            <div class="stat-val" style="color:#f87171;">${lv.law?.fine || '₹1,000'}</div>
            <div class="stat-lbl">Max Penalty</div>
          </div>
          <div class="stat-box" style="background:rgba(34,197,94,0.08); border-color:rgba(34,197,94,0.2);">
            <div class="stat-val" style="color:#4ade80;">+₹2,000</div>
            <div class="stat-lbl">Bounty Reward</div>
          </div>
        </div>

        <div style="font-weight:700; font-size:1.05rem; color:#fff; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
          <span>📚 Curriculum & Syllabus Topics</span>
          <span style="font-size:0.75rem; color:var(--muted); font-weight:500;">(Tap any topic to jump)</span>
        </div>
        <div class="syl-curriculum-index">
          ${curriculumRows}
        </div>

        ${this._renderCardFooter(lv, id, items)}
      `
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
      card.innerHTML = `
        ${topicHeaderHTML}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <div class="bc-ttl" style="margin:0;">⚖️ Regulatory Mandate</div>
          <span class="bc-rule-pill">Clause ${idx + 1} of ${lv.hps.length}</span>
        </div>
        
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:22px 24px; margin-bottom:20px;">
          <div class="bc-rule-txt" style="margin-bottom:12px;">${hpTitle}</div>
          ${hpDesc ? `<div style="font-family:'Inter', sans-serif; font-size:0.95rem; color:rgba(255,255,255,0.85); line-height:1.65; border-left:3px solid var(--signal); padding-left:14px; background:rgba(255,213,74,0.04); padding-top:10px; padding-bottom:10px; border-radius:0 8px 8px 0;">${hpDesc}</div>` : ''}
        </div>
        
        ${this._renderCardFooter(lv, id, items)}
      `
    } else if (id === 'law') {
      const lawEn = lv.law
      const lawHi = { sec: lv.law.secHi || lv.law.sec, fine: lv.law.fineHi || lv.law.fine, off: lv.law.offHi || lv.law.off }
      this._lawLang = this._lawLang || (S.language === 'hi' ? 'hi' : 'en')
      const d = this._lawLang === 'hi' ? lawHi : lawEn
      const langLabel = this._lawLang === 'hi' ? 'English' : 'हिन्दी'
      card.innerHTML = `
        ${topicHeaderHTML}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <div class="bc-ttl" style="margin:0;">🏛️ Statutory Legal Provisions</div>
          <button class="btn btn-s" style="background:rgba(255,255,255,0.06); border:1px solid var(--border); color:var(--text); font-size:0.8rem; padding:6px 14px; border-radius:20px; cursor:pointer;" onclick="ui._lawLang=ui._lawLang==='hi'?'en':'hi'; ui._selSyl('law')">🌐 ${langLabel}</button>
        </div>

        <div style="background:rgba(255,213,74,0.05); border:1px solid rgba(255,213,74,0.2); border-radius:16px; padding:20px 24px; margin-bottom:16px;">
          <div style="font-size:0.75rem; font-weight:700; color:var(--signal); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">Motor Vehicles Act Statutory Mandate</div>
          <div style="font-size:1.35rem; font-weight:800; color:#fff; font-family:monospace; letter-spacing:0.02em; margin-bottom:8px;">${d.sec}</div>
          <div style="font-size:1.02rem; color:rgba(255,255,255,0.9); line-height:1.5;">${d.off}</div>
        </div>

        <div class="fr" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:14px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
          <div>
            <div style="font-size:0.75rem; font-weight:700; color:#fca5a5; text-transform:uppercase; letter-spacing:0.05em;">Statutory Fine / Penalty</div>
            <div style="font-size:0.82rem; color:rgba(255,255,255,0.7); margin-top:2px;">Issued on automated traffic cameras & traffic police challan</div>
          </div>
          <div style="font-size:1.8rem; font-weight:800; color:#ef4444; font-family:'Lora',serif;">${d.fine}</div>
        </div>

        ${this._renderCardFooter(lv, id, items)}
      `
    } else if (id === 'theory') {
      const bracket = this.getAgeBracket()
      const isYoung = bracket === 'child' || bracket === 'teen'
      this._theoryLang = this._theoryLang || (S.language === 'hi' ? 'hi' : 'en')
      const theoryLabel = isYoung ? 'Simple Explanation' : 'Analytical Model & Science'
      const theoryHint = isYoung ? '<div style="font-size:0.8rem; color:var(--signal); margin-bottom:12px; font-weight:600;">✨ Simplified version for beginner drivers</div>' : ''
      const langLabel = this._theoryLang === 'hi' ? 'English' : 'हिन्दी'

      let theoryContent = lv.theory || ''
      if (this._theoryLang === 'hi' && lv.theoryHi) {
        theoryContent = lv.theoryHi
      }

      card.innerHTML = `
        ${topicHeaderHTML}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <div class="bc-ttl" style="margin:0;">📊 ${theoryLabel}</div>
          <button class="btn btn-s" style="background:rgba(255,255,255,0.06); border:1px solid var(--border); color:var(--text); font-size:0.8rem; padding:6px 14px; border-radius:20px; cursor:pointer;" onclick="ui._theoryLang=ui._theoryLang==='hi'?'en':'hi'; ui._selSyl('theory')">🌐 ${langLabel}</button>
        </div>
        ${theoryHint}
        <div class="dw">${this._diag(lv.id)}</div>
        <div class="theory-rich-content">
          ${theoryContent}
        </div>
        ${this._renderCardFooter(lv, id, items)}
      `
    } else if (id === 'practical') {
      const availModes = lv.modes || ['car']
      const preferredMode = this.curMode || availModes[0]
      const isPedMode = preferredMode === 'pedestrian'
      const isBikeMode = preferredMode === 'bike'

      // Playable Role Buttons
      const btnsHTML = availModes
        .map((m) => {
          const icons = { car: '🚗', bike: '🏍️', auto: '🛺', truck: '🚛', bus: '🚌', pedestrian: '🚶' }
          const labels = { car: 'Vehicle Driver', bike: 'Two-Wheeler / Bike', pedestrian: 'Pedestrian', auto: 'Auto-Rickshaw', truck: 'Heavy Truck', bus: 'BEST Bus' }
          const isPreferred = m === preferredMode
          return `<button class="btn" data-mode="${m}" style="flex:1; min-width:110px; text-transform:none; background:${isPreferred ? 'var(--accent, #D97706)' : 'var(--panel, rgba(255,255,255,0.05))'}; border:2px solid ${isPreferred ? 'var(--accent, #D97706)' : 'var(--line, rgba(255,255,255,0.1))'}; color:${isPreferred ? '#fff' : 'var(--ink, #111827)'}; font-weight:700; padding:12px 10px; border-radius:14px; display:flex; flex-direction:column; align-items:center; gap:6px; transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor:pointer;" onclick="ui.selectMode('${m}')">
            <span style="font-size:1.5rem; line-height:1;">${icons[m] || '🚗'}</span>
            <span style="font-size:0.8rem; font-weight:700;">${labels[m] || m}</span>
            <span style="font-size:0.65rem; opacity:0.85; text-transform:uppercase; letter-spacing:0.5px;">${isPreferred ? '● Selected Role' : 'Select'}</span>
          </button>`
        })
        .join('')

      // Dynamic Controls based on chosen role
      let controlsHTML = ''
      if (isPedMode) {
        controlsHTML = `
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
             <div style="display:flex; gap:4px;">
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">W</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">A</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">S</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">D</kbd>
             </div>
             <span style="font-size:0.85rem; color:var(--dim);">Walk</span>
             <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">SHIFT</kbd>
             <span style="font-size:0.85rem; color:var(--dim);">Sprint</span>
             <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">SPACE</kbd>
             <span style="font-size:0.85rem; color:var(--dim);">Look / Cross</span>
          </div>`
      } else if (isBikeMode) {
        controlsHTML = `
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
             <div style="display:flex; gap:4px;">
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">W</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">A</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">S</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">D</kbd>
             </div>
             <span style="font-size:0.85rem; color:var(--dim);">Steer</span>
             <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">SPACE</kbd>
             <span style="font-size:0.85rem; color:var(--dim);">Brake</span>
             <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">F</kbd>
             <span style="font-size:0.85rem; color:var(--dim);">Mount</span>
          </div>`
      } else {
        controlsHTML = `
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
             <div style="display:flex; gap:4px;">
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">W</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">A</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">S</kbd>
               <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">D</kbd>
             </div>
             <span style="font-size:0.85rem; color:var(--dim);">Drive</span>
             <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">SPACE</kbd>
             <span style="font-size:0.85rem; color:var(--dim);">Brake</span>
             <kbd style="padding:4px 8px; background:var(--void, rgba(0,0,0,0.2)); border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid var(--line, rgba(255,255,255,0.1)); color:var(--ink);">F</kbd>
             <span style="font-size:0.85rem; color:var(--dim);">Enter</span>
          </div>`
      }

      // Vehicle selection box or Pedestrian summary box
      let roleDetailHTML = ''
      if (isPedMode) {
        roleDetailHTML = `
          <div style="background:rgba(217,119,6,0.08); border:1px solid rgba(217,119,6,0.2); padding:16px 20px; border-radius:16px; display:flex; align-items:center; gap:16px;">
            <div style="font-size:2.4rem; line-height:1;">🚶</div>
            <div style="flex:1;">
              <div style="font-size:0.95rem; font-weight:700; color:var(--accent, #D97706);">Pedestrian Foot Patrol Active</div>
              <div style="font-size:0.85rem; color:var(--text, #e2e8f0); margin-top:3px; line-height:1.4;">You will complete this scenario entirely on foot. Walk on designated footpaths, check blind spots before crossing, and obey pedestrian traffic signals. No vehicle required.</div>
            </div>
          </div>`
      } else if (isBikeMode) {
        const twoWheelers = [
          { id: 'bike', name: 'Motorcycle', icon: '🏍️' },
          { id: 'cycle', name: 'Bicycle', icon: '🚲' }
        ]
        const currentVeh = (S.vehicle || 'bike').toLowerCase()
        const selectedId = (currentVeh === 'cycle' || currentVeh === 'bicycle') ? 'cycle' : 'bike'

        roleDetailHTML = `
          <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px;">
             <div style="font-size:0.8rem; color:var(--dim, #9CA3AF); text-transform:uppercase; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:8px;">🏍️ Choose Two-Wheeler Vehicle</div>
             <div id="br-vehicle-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px;">
               ${twoWheelers.map(v => {
                 const sel = selectedId === v.id
                 const rec = window.COURSE?.getRecommendedVehicle?.(lv.id) === v.id
                 return `<div style="padding:16px 12px;background:${sel ? 'rgba(242,184,75,0.15)' : 'var(--card, rgba(17,24,39,0.6))'};border:2px solid ${sel ? 'var(--accent, #f2b84b)' : (rec ? 'var(--signal, #5ed4f5)' : 'var(--border, rgba(255,255,255,0.1))')};border-radius:14px;text-align:center;cursor:pointer;transition:all 0.2s ease;"
                      onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='${sel ? 'rgba(242,184,75,0.15)' : 'var(--card, rgba(17,24,39,0.6))'}'"
                      onclick="ui._selectVehicle('${v.id}')">
                   <div style="font-size:2rem;line-height:1;">${v.icon}</div>
                   <div style="font-size:0.9rem;font-weight:700;color:var(--text, #e2e8f0);margin-top:6px;">${v.name}</div>
                   ${rec ? '<div style="font-size:0.65rem;color:var(--signal, #5ed4f5);font-weight:700;margin-top:3px;">✓ Recommended</div>' : ''}
                   ${sel ? '<div style="font-size:0.65rem;color:var(--accent, #f2b84b);font-weight:700;margin-top:3px;">● Selected</div>' : ''}
                 </div>`
               }).join('')}
             </div>
          </div>`
      } else {
        const fourWheelers = [
          { id: 'car', name: 'Sedan', icon: '🚗' },
          { id: 'taxi', name: 'Kaali-Peeli', icon: '🚖' },
          { id: 'auto', name: 'Auto-Rickshaw', icon: '🛺' },
          { id: 'bus', name: 'BEST Bus', icon: '🚌' },
          { id: 'truck', name: 'Heavy Truck', icon: '🚚' },
          { id: 'ambulance', name: 'Ambulance', icon: '🚑' },
          { id: 'police', name: 'Police Jeep', icon: '🚓' }
        ]
        const currentVeh = (S.vehicle || 'car').toLowerCase()
        const isBikeVeh = currentVeh === 'bike' || currentVeh === 'cycle' || currentVeh === 'bicycle' || currentVeh === 'motorcycle'
        const effectiveVeh = isBikeVeh ? 'car' : currentVeh

        roleDetailHTML = `
          <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px;">
             <div style="font-size:0.8rem; color:var(--dim, #9CA3AF); text-transform:uppercase; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:8px;">🚗 Choose 4-Wheeler / Commercial Vehicle</div>
             <div id="br-vehicle-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(105px, 1fr)); gap:10px;">
               ${fourWheelers.map(v => {
                 const sel = effectiveVeh === v.name?.toLowerCase() || effectiveVeh === v.id
                 const rec = window.COURSE?.getRecommendedVehicle?.(lv.id) === v.id
                 return `<div style="padding:12px 8px;background:${sel ? 'rgba(242,184,75,0.15)' : 'var(--card, rgba(17,24,39,0.6))'};border:2px solid ${sel ? 'var(--accent, #f2b84b)' : (rec ? 'var(--signal, #5ed4f5)' : 'var(--border, rgba(255,255,255,0.1))')};border-radius:14px;text-align:center;cursor:pointer;transition:all 0.2s ease;"
                      onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='${sel ? 'rgba(242,184,75,0.15)' : 'var(--card, rgba(17,24,39,0.6))'}'"
                      onclick="ui._selectVehicle('${v.id}')">
                   <div style="font-size:1.6rem;line-height:1;">${v.icon || '🚗'}</div>
                   <div style="font-size:0.82rem;font-weight:700;color:var(--text, #e2e8f0);margin-top:6px;">${v.name || v.id}</div>
                   ${rec ? '<div style="font-size:0.62rem;color:var(--signal, #5ed4f5);font-weight:700;margin-top:3px;">✓ Recommended</div>' : ''}
                   ${sel ? '<div style="font-size:0.62rem;color:var(--accent, #f2b84b);font-weight:700;margin-top:3px;">● Selected</div>' : ''}
                 </div>`
               }).join('')}
             </div>
          </div>`
      }

      const finalBtnLabel = isPedMode ? 'START PEDESTRIAN RUN 🚶 →' : (isBikeMode ? 'START BIKE RIDE 🏍️ →' : 'START DRIVING TEST 🚗 →')
      const finalBtn = `<button class="btn" style="background:var(--accent, #D97706); color:#fff; font-weight:bold; padding:12px 24px; border-radius:12px; box-shadow:0 4px 16px rgba(217,119,6,0.3); font-size:0.92rem; border:none; cursor:pointer;" onclick="ui.dispatchStart('${preferredMode}')">${finalBtnLabel}</button>`

      card.innerHTML = `
      ${topicHeaderHTML}
      <div class="bc-ttl">🎯 Practical Execution</div>
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom: 20px;">
        
        <!-- Objective Banner -->
        <div class="pract-banner" style="background:var(--panel, rgba(255,255,255,0.05)); padding:16px; border-radius:16px; border:1px solid var(--line, rgba(255,255,255,0.1)); display:flex; align-items:center; gap:16px;">
          <div class="pract-icon-big" style="font-size:3rem;line-height:1;">${lv.icon}</div>
          <div style="flex:1;">
            <div style="font-size:1.4rem;font-family:var(--serif,'Instrument Serif'),serif;font-style:italic;font-weight:700; color:var(--accent, #D97706);">${lv.name}</div>
            <div style="font-size:0.95rem;color:var(--ink, #111827);line-height:1.4;margin-top:4px;">${lv.pract}</div>
          </div>
        </div>

        <!-- Visual Tutorial 2.5D Simulation -->
        <div style="position:relative; width:100%; border-radius:20px; overflow:hidden; border:1px solid var(--line, rgba(255,255,255,0.12)); background:#080d1a;">
          ${this._simAnim(lv)}
        </div>
        
        <!-- Controls & Penalty Row -->
        <div style="display:flex; flex-wrap:wrap; gap:16px;">
          
          <!-- Controls -->
          <div style="flex:1.2; min-width:260px; background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px;">
            <div style="color:var(--dim, #6B7280); font-size:0.8rem; font-weight:700; text-transform:uppercase; margin-bottom:12px;">🕹️ Controls</div>
            ${controlsHTML}
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

        <!-- Playable Role Selector -->
        <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px;">
           <div style="font-size:0.8rem; color:var(--dim, #9CA3AF); text-transform:uppercase; font-weight:700; margin-bottom:12px;">🎮 Playable Role / Mode</div>
           <div style="display:flex; gap:10px; flex-wrap:wrap;">${btnsHTML}</div>
        </div>

        <!-- Role Detail: Vehicle Grid (if Driving) or Foot Patrol (if Pedestrian) -->
        ${roleDetailHTML}
        
        <div style="font-size:0.82rem;color:var(--accent, #D97706); background:rgba(217,119,6,0.1); padding:12px 18px; border-radius:10px; border-left:3px solid var(--accent, #D97706); line-height:1.4;">
          ⚠️ <strong>Performance Standard:</strong> A PERFECT run (no statutory violations or collision damage) is required to clear the practical evaluation and unlock the next lesson.
        </div>
      </div>
      
      <!-- Launch -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line, rgba(0,0,0,0.1)); padding-top:16px;">
        <button class="btn btn-s" onclick="ui._selSyl('theory')" style="padding:8px 16px; background:var(--panel); border:1px solid var(--line); color:var(--ink); border-radius:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Prev</button>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div style="font-size:0.75rem; color:var(--dim, #6B7280);">Ready for the real test?</div>
          ${finalBtn}
        </div>
      </div>`
    } else if (id === 'chaos') {
      const chaosVehicles = (window.COURSE?.VEHICLES || [{ id: 'car', name: 'Sedan', icon: '🚗' }]).map(v => {
        const sel = v.id === (S.vehicle?.toLowerCase() || 'car')
        const rec = window.COURSE?.getRecommendedVehicle?.(lv.id) === v.id
        return `<div style="flex:1;min-width:90px;padding:12px;background:${sel ? 'rgba(239,68,68,0.15)' : 'var(--card)'};border:2px solid ${sel ? '#ef4444' : (rec ? 'var(--signal)' : 'var(--border)')};border-radius:12px;text-align:center;cursor:pointer;transition:all 0.2s;"
             onmouseover="this.style.background='var(--hover)'" onmouseout="this.style.background='${sel ? 'rgba(239,68,68,0.15)' : 'var(--card)'}'"
             onclick="ui._selectVehicle('${v.id}')">
          <div style="font-size:1.8rem;margin-bottom:4px;">${v.icon}</div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text);">${v.name}</div>
        </div>`
      }).join('')
      const chaosBtn = `<button class="btn" style="background:linear-gradient(90deg, #ef4444, #f59e0b); color:#fff; font-weight:bold; padding:12px 24px; border-radius:12px; box-shadow:0 4px 16px rgba(239,68,68,0.4); font-size:0.95rem; border:none; cursor:pointer;" onclick="ui.dispatchStart('chaos')">LAUNCH CHAOS RUN 🌪️ &rarr;</button>`
      card.innerHTML = `
      ${topicHeaderHTML}
      <div class="bc-ttl" style="color:#ef4444;">🌪️ Chaos Run — Adaptive Stress Test</div>
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom: 20px;">
        <div class="pract-banner" style="background:linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1)); padding:18px; border-radius:16px; border:1px solid rgba(239,68,68,0.3); display:flex; align-items:center; gap:16px;">
          <div style="font-size:3.2rem;line-height:1;">🌪️</div>
          <div style="flex:1;">
            <div style="font-size:1.4rem;font-family:var(--serif,'Instrument Serif'),serif;font-style:italic;font-weight:700; color:#ef4444;">Adaptive Stress Simulation</div>
            <div style="font-size:0.95rem;color:var(--text);line-height:1.4;margin-top:4px;">Test your reflexes under peak Mumbai chaos: aggressive overtaking, jaywalking pedestrians, low-grip monsoon puddles, and emergency siren yields.</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
          <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:14px; border-radius:12px;">
            <div style="font-size:0.8rem; font-weight:700; color:#f59e0b; margin-bottom:4px;">⚡ High Density Traffic</div>
            <div style="font-size:0.75rem; color:var(--muted);">2x aggressive auto-rickshaws & sudden lane cuts (+50% XP)</div>
          </div>
          <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:14px; border-radius:12px;">
            <div style="font-size:0.8rem; font-weight:700; color:#38bdf8; margin-bottom:4px;">🌧️ Wet Asphalt Monsoon</div>
            <div style="font-size:0.75rem; color:var(--muted);">Reduced friction and hydroplaning puddles (+25% XP)</div>
          </div>
          <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:14px; border-radius:12px;">
            <div style="font-size:0.8rem; font-weight:700; color:#ef4444; margin-bottom:4px;">🚨 Sudden Emergency Priority</div>
            <div style="font-size:0.75rem; color:var(--muted);">Yield within 5 seconds or receive statutory fines (+25% XP)</div>
          </div>
        </div>

        <div style="background:var(--panel, rgba(255,255,255,0.05)); border:1px solid var(--line, rgba(255,255,255,0.1)); padding:16px; border-radius:16px;">
           <div style="font-size:0.8rem; color:var(--dim, #9CA3AF); text-transform:uppercase; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:8px;">🚗 Select Vehicle for Chaos Run</div>
           <div id="br-vehicle-list" style="display:flex; gap:8px; flex-wrap:wrap;">
             ${chaosVehicles}
           </div>
        </div>
      </div>
      
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line, rgba(0,0,0,0.1)); padding-top:16px;">
        <button class="btn btn-s" onclick="ui._selSyl('practical')" style="padding:8px 16px; background:var(--panel); border:1px solid var(--line); color:var(--ink); border-radius:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Practical</button>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div style="font-size:0.75rem; color:var(--dim, #6B7280);">2x XP Multiplier Active</div>
          ${chaosBtn}
        </div>
      </div>`
    } else if (id === 'exam') {
      const examBtn = `<button class="btn" style="background:var(--signal); color:#000; font-weight:bold; padding:12px 24px; border-radius:12px; box-shadow:0 4px 16px rgba(255,213,74,0.3); font-size:0.95rem; border:none; cursor:pointer;" onclick="ui.showQuiz('exam')">START EXAM 📝 &rarr;</button>`
      card.innerHTML = `
      ${topicHeaderHTML}
      <div class="bc-ttl">📝 Module Assessment & Theory Exam</div>
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom: 20px;">
        <div class="pract-banner" style="background:linear-gradient(135deg, rgba(94,212,245,0.1), rgba(255,213,74,0.1)); padding:18px; border-radius:16px; border:1px solid rgba(255,213,74,0.3); display:flex; align-items:center; gap:16px;">
          <div style="font-size:3.2rem;line-height:1;">📋</div>
          <div style="flex:1;">
            <div style="font-size:1.4rem;font-family:var(--serif,'Instrument Serif'),serif;font-style:italic;font-weight:700; color:var(--signal);">Official Traffic Regulation Assessment</div>
            <div style="font-size:0.95rem;color:var(--text);line-height:1.4;margin-top:4px;">Test your mastery on statutory Motor Vehicle laws, right-of-way rules, and hazard mitigation for "${lv.name}".</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
          <div style="background:var(--panel); border:1px solid var(--line); padding:16px; border-radius:12px; text-align:center;">
            <div style="font-size:1.8rem; font-weight:800; color:var(--signal);">5</div>
            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase;">Questions</div>
          </div>
          <div style="background:var(--panel); border:1px solid var(--line); padding:16px; border-radius:12px; text-align:center;">
            <div style="font-size:1.8rem; font-weight:800; color:var(--green);">80%</div>
            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase;">Pass Threshold</div>
          </div>
          <div style="background:var(--panel); border:1px solid var(--line); padding:16px; border-radius:12px; text-align:center;">
            <div style="font-size:1.8rem; font-weight:800; color:#38bdf8;">+₹2,500</div>
            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase;">Career Bounty</div>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line, rgba(0,0,0,0.1)); padding-top:16px;">
        <button class="btn btn-s" onclick="ui._selSyl('chaos')" style="padding:8px 16px; background:var(--panel); border:1px solid var(--line); color:var(--ink); border-radius:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Chaos Run</button>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div style="font-size:0.75rem; color:var(--dim);">Official Certification Credit</div>
          ${examBtn}
        </div>
      </div>`
    }
    c.appendChild(card)
    if (id === 'practical') {
      requestAnimationFrame(() => this._initBriefingArt(lv))
    }
  },
  _renderTopicHeader(lv, currentId, items) {
    const currentIndex = items.findIndex(it => it.id === currentId)
    const currentItem = items[currentIndex] || items[0]
    return `
      <div class="syl-breadcrumb-bar">
        <div class="syl-crumb-left">
          <span class="syl-crumb-badge">Module ${lv.id}</span>
          <span class="syl-crumb-arrow">&rsaquo;</span>
          <span class="syl-crumb-step">Step ${currentIndex + 1} of ${items.length}</span>
          <span class="syl-crumb-arrow">&rsaquo;</span>
          <span class="syl-crumb-curr">${currentItem.icon} ${currentItem.label}</span>
        </div>
        <div class="syl-crumb-dots">
          ${items.map((item, idx) => {
            const isDone = this._sylViewed && this._sylViewed.has(item.id)
            const isCurr = item.id === currentId
            return `<div class="syl-dot ${isCurr ? 'active' : (isDone ? 'done' : '')}" onclick="ui._selSyl('${item.id}')" title="${item.label}"></div>`
          }).join('')}
        </div>
      </div>
    `
  },
  _renderCardFooter(lv, currentId, items) {
    const currentIndex = items.findIndex(it => it.id === currentId)
    const prevItem = items[currentIndex - 1]
    const nextItem = items[currentIndex + 1]

    return `
      <div class="syl-footer-nav">
        ${prevItem 
          ? `<button class="btn btn-syl-prev" onclick="ui._selSyl('${prevItem.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> ${prevItem.label}</button>`
          : `<div></div>`
        }
        <div class="syl-footer-progress">
          <span>Topic ${currentIndex + 1} of ${items.length}</span>
        </div>
        ${nextItem
          ? `<button class="btn btn-syl-next" onclick="ui._selSyl('${nextItem.id}')">${nextItem.label} &rarr;</button>`
          : `<button class="btn btn-syl-next btn-syl-start" onclick="ui.dispatchStart()">🚀 Start Practical Test &rarr;</button>`
        }
      </div>
    `
  },
  _diag(id) {
    const lv = LVS.find((l) => l.id === id)
    if (!lv) return ''
    const themeLabel = (lv.themeType || 'traffic_safety').replace(/_/g, ' ')
    const fineText = lv.law?.fine || '₹500 - ₹2000'
    const bgGradient = lv.gr || 'linear-gradient(135deg, #1e293b, #0f172a)'
    return `
      <div style="background:${bgGradient};border:1px solid rgba(255,255,255,0.15);box-shadow:0 8px 24px rgba(0,0,0,0.35);border-radius:16px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:18px;">
        <div style="font-size:2.8rem;line-height:1;background:rgba(0,0,0,0.25);width:60px;height:60px;border-radius:14px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.1);flex-shrink:0;">${lv.icon || '🚦'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:1.3rem;font-weight:700;color:#fff;letter-spacing:0.02em;margin-bottom:6px;font-family:var(--sans,'Inter'),sans-serif;">${lv.name}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <span style="background:rgba(255,255,255,0.15);color:#fff;font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;border:1px solid rgba(255,255,255,0.2);">🚦 ${themeLabel}</span>
            <span style="background:rgba(239,68,68,0.2);color:#fca5a5;font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.03em;border:1px solid rgba(239,68,68,0.3);">💰 Fine: ${fineText}</span>
          </div>
        </div>
      </div>
    `
  },
  _simAnim(lv) {
    const isNight = lv.themeType?.includes('night') || false;
    const isRain = lv.themeType?.includes('rain') || lv.themeType?.includes('monsoon') || lv.themeType?.includes('puddle');
    const conditionText = isNight ? '🌙 NIGHT · LOW VISIBILITY' : (isRain ? '🌧️ MONSOON · WET GRIP (0.65μ)' : '☀️ DAYLIGHT · DRY ROAD');
    const ruleText = lv.law?.fine ? `💰 PENALTY: ${lv.law.fine}` : '🚦 TRAFFIC REGULATION';

    return `
      <div id="briefing-canvas-wrap" class="scenario-sim-container">
        <canvas id="scenario-sim-canvas"></canvas>
        <div class="sim-hud-top">
          <div class="sim-live-badge">
            <span class="sim-record-dot"></span>
            <span>LIVE SCENARIO SIM</span>
          </div>
          <div class="sim-condition-pill" id="sim-condition-pill">${conditionText}</div>
          <div class="sim-rule-pill" id="sim-rule-pill">${ruleText}</div>
        </div>
        <div class="sim-alert-banner" id="sim-alert-banner">🚨 RED LIGHT CAMERA VIOLATION — ₹1000 FINE</div>
        <div class="sim-hud-bottom">
          <div class="sim-telemetry-bar">
            <div class="sim-telem-item">
              <span class="sim-telem-lbl">SPEED</span>
              <span class="sim-telem-val" id="sim-speed-val">42 km/h</span>
            </div>
            <div class="sim-telem-item">
              <span class="sim-telem-lbl">BRAKING</span>
              <span class="sim-telem-val" id="sim-brake-val">0%</span>
            </div>
            <div class="sim-telem-item">
              <span class="sim-telem-lbl">STATUS</span>
              <span class="sim-telem-val" id="sim-status-val" style="color:#10b981;">CRUISING</span>
            </div>
          </div>
          <div class="sim-ctrl-bar">
            <button class="sim-btn" id="sim-play-btn" title="Play/Pause" onclick="ui._simTogglePlay()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button class="sim-btn" id="sim-speed-btn" title="Playback Speed" onclick="ui._simToggleSpeed()">1x</button>
            <button class="sim-btn" id="sim-reset-btn" title="Restart" onclick="ui._simRestart()">↺</button>
            <div class="sim-timeline-wrap">
              <input type="range" min="0" max="100" value="0" class="sim-slider" id="sim-timeline" oninput="ui._simSeek(this.value)">
            </div>
          </div>
        </div>
      </div>
    `
  },
  _simState: { isPlaying: true, speed: 1.0, time: 0, duration: 8.0 },
  _simTogglePlay() {
    this._simState.isPlaying = !this._simState.isPlaying;
    const btn = document.getElementById('sim-play-btn');
    if (btn) {
      btn.innerHTML = this._simState.isPlaying 
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' 
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }
  },
  _simToggleSpeed() {
    const speeds = [1.0, 2.0, 0.5];
    const idx = (speeds.indexOf(this._simState.speed) + 1) % speeds.length;
    this._simState.speed = speeds[idx];
    const btn = document.getElementById('sim-speed-btn');
    if (btn) btn.textContent = this._simState.speed + 'x';
  },
  _simRestart() {
    this._simState.time = 0;
  },
  _simSeek(val) {
    this._simState.time = (parseFloat(val) / 100) * this._simState.duration;
  },
  _initBriefingArt(lv) {
    if (this._simAnimId) {
      cancelAnimationFrame(this._simAnimId);
      this._simAnimId = null;
    }
    const canvas = document.getElementById('scenario-sim-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this._simState.isPlaying = true;
    this._simState.speed = 1.0;
    this._simState.time = 0;
    this._simState.duration = 8.0;

    const themeType = (lv.themeType || '').toLowerCase();
    const isNight = themeType.includes('night');
    const isRain = themeType.includes('rain') || themeType.includes('monsoon') || themeType.includes('puddle');
    const isEmergency = themeType.includes('ambulance') || themeType.includes('emergency');
    const isSignal = themeType.includes('signal') || themeType.includes('intersection');
    const isParking = themeType.includes('parking');
    const isSchool = themeType.includes('school') || themeType.includes('pedestrian') || themeType.includes('courtesy');

    // Generate persistent rain streaks
    const rainDrops = [];
    for (let i = 0; i < 70; i++) {
      rainDrops.push({
        x: Math.random() * 1000,
        y: Math.random() * 300,
        speed: 600 + Math.random() * 300,
        length: 12 + Math.random() * 10
      });
    }

    let lastTimestamp = performance.now();

    const renderFrame = (now) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      if (this._simState.isPlaying) {
        this._simState.time += dt * this._simState.speed;
        if (this._simState.time >= this._simState.duration) {
          this._simState.time = 0;
        }
      }

      const wrap = canvas.parentElement;
      if (!wrap) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const t = this._simState.time;
      const progress = t / this._simState.duration;

      // Update Slider
      const slider = document.getElementById('sim-timeline');
      if (slider && document.activeElement !== slider) {
        slider.value = (progress * 100).toFixed(1);
      }

      // 1. SKY & BACKDROP
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      if (isNight) {
        skyGrad.addColorStop(0, '#040711');
        skyGrad.addColorStop(1, '#0c1427');
      } else if (isRain) {
        skyGrad.addColorStop(0, '#1a2233');
        skyGrad.addColorStop(1, '#2c374d');
      } else {
        skyGrad.addColorStop(0, '#0a192f');
        skyGrad.addColorStop(1, '#1e293b');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant Stars (Night)
      if (isNight) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 30; i++) {
          const sx = (i * 37) % w;
          const sy = (i * 23) % (h * 0.45);
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      }

      // Mumbai Skyline Silhouette
      ctx.fillStyle = isNight ? '#070b14' : '#111827';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      const skyline = [
        [0.05, 0.42], [0.08, 0.42], [0.08, 0.52], [0.15, 0.52], [0.18, 0.35],
        [0.22, 0.35], [0.25, 0.55], [0.32, 0.48], [0.38, 0.48], [0.42, 0.32],
        [0.48, 0.32], [0.52, 0.54], [0.60, 0.40], [0.68, 0.40], [0.72, 0.55],
        [0.80, 0.38], [0.85, 0.38], [0.88, 0.52], [0.95, 0.45], [1.0, 0.55]
      ];
      skyline.forEach(([px, py]) => ctx.lineTo(w * px, h * py));
      ctx.lineTo(w, h * 0.6);
      ctx.lineTo(0, h * 0.6);
      ctx.fill();

      // Bandra-Worli Sea Link Cable Towers in background
      ctx.strokeStyle = isNight ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      const towerX = w * 0.78;
      const towerY = h * 0.28;
      ctx.beginPath();
      ctx.moveTo(towerX - 25, h * 0.55);
      ctx.lineTo(towerX, towerY);
      ctx.lineTo(towerX + 25, h * 0.55);
      // Cables
      for (let c = 1; c <= 4; c++) {
        ctx.moveTo(towerX, towerY + c * 10);
        ctx.lineTo(towerX - c * 20, h * 0.55);
        ctx.moveTo(towerX, towerY + c * 10);
        ctx.lineTo(towerX + c * 20, h * 0.55);
      }
      ctx.stroke();

      // 2. SIDEWALK & ROAD INFRASTRUCTURE
      const roadTop = h * 0.58;
      const roadHeight = h * 0.32;
      const roadBottom = roadTop + roadHeight;
      const sidewalkHeight = 16;
      const sidewalkTop = roadTop - sidewalkHeight;

      // Sidewalk Pavement
      ctx.fillStyle = '#2b3240';
      ctx.fillRect(0, sidewalkTop, w, sidewalkHeight);
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, sidewalkTop, w, 2);

      // Curb Stones (Alternating Yellow & Black hazard blocks)
      const curbSize = 24;
      for (let x = 0; x < w; x += curbSize) {
        ctx.fillStyle = Math.floor(x / curbSize) % 2 === 0 ? '#f59e0b' : '#1e293b';
        ctx.fillRect(x, roadTop - 4, curbSize, 4);
      }

      // Asphalt Road Surface
      const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
      roadGrad.addColorStop(0, isRain ? '#181e29' : '#1e2430');
      roadGrad.addColorStop(1, isRain ? '#10141c' : '#141822');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, roadTop, w, roadHeight);

      // Pavement Texture / Wet Gloss Sheen
      if (isRain) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(0, roadTop, w, roadHeight * 0.4);
      }

      // Road Edge Solid White Lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, roadTop + 2, w, 3);
      ctx.fillRect(0, roadBottom - 4, w, 3);

      // Road Center Dashed Yellow Lines
      ctx.fillStyle = '#f59e0b';
      const dashW = 28;
      const gapW = 20;
      const centerLineY = roadTop + roadHeight / 2;
      for (let x = 0; x < w; x += dashW + gapW) {
        ctx.fillRect(x, centerLineY - 1.5, dashW, 3);
      }

      // Zebra Crosswalk (Centered at 50%)
      const crossX = w * 0.52;
      const crossW = 90;
      const numStripes = 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      for (let s = 0; s < numStripes; s++) {
        const stripeY = roadTop + 6 + s * ((roadHeight - 12) / numStripes);
        ctx.fillRect(crossX - crossW / 2, stripeY, crossW, (roadHeight - 12) / numStripes - 6);
      }

      // Stop Line Before Crosswalk
      const stopLineX = crossX - crossW / 2 - 14;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(stopLineX, roadTop + 2, 4, roadHeight / 2 - 4);
      ctx.font = '800 10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('STOP', stopLineX - 32, roadTop + roadHeight * 0.28);

      // Street Lamp Pole with Volumetric Glow
      const lampX = w * 0.22;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lampX, roadTop);
      ctx.lineTo(lampX, roadTop - 65);
      ctx.lineTo(lampX + 18, roadTop - 75);
      ctx.stroke();

      // Lamp Light Cone
      const lampCone = ctx.createRadialGradient(lampX + 18, roadTop - 75, 5, lampX + 18, roadTop, 90);
      lampCone.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
      lampCone.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lampCone;
      ctx.beginPath();
      ctx.moveTo(lampX + 18, roadTop - 75);
      ctx.lineTo(lampX - 45, roadTop + 40);
      ctx.lineTo(lampX + 80, roadTop + 40);
      ctx.closePath();
      ctx.fill();

      // Traffic Signal
      const signalX = stopLineX + 8;
      const signalY = roadTop - 50;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(signalX - 8, signalY - 25, 16, 44);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(signalX - 8, signalY - 25, 16, 44);

      // Signal State Logic
      let signalColor = 'green';
      if (isSignal || isSchool) {
        if (t < 3.5) signalColor = 'green';
        else if (t < 4.2) signalColor = 'yellow';
        else if (t < 7.2) signalColor = 'red';
        else signalColor = 'green';
      }

      // Draw 3 Signal Bulbs
      const bulbs = [
        { color: '#ef4444', active: signalColor === 'red', y: signalY - 16 },
        { color: '#f59e0b', active: signalColor === 'yellow', y: signalY - 3 },
        { color: '#10b981', active: signalColor === 'green', y: signalY + 10 }
      ];

      bulbs.forEach(b => {
        ctx.beginPath();
        ctx.arc(signalX, b.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = b.active ? b.color : '#0f172a';
        ctx.fill();
        if (b.active) {
          ctx.beginPath();
          ctx.arc(signalX, b.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = b.color + '44';
          ctx.fill();
        }
      });

      // 3. DRAW VECTOR VEHICLES
      function drawVectorCar(cx, cy, color, isBraking, headlightsOn, turnSignal) {
        ctx.save();
        ctx.translate(cx, cy);

        // Ground Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 36, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Headlight Beams (Left to Right)
        if (headlightsOn) {
          const hlGrad = ctx.createLinearGradient(30, 0, 110, 0);
          hlGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
          hlGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = hlGrad;
          ctx.beginPath();
          ctx.moveTo(32, 2);
          ctx.lineTo(120, -14);
          ctx.lineTo(120, 18);
          ctx.closePath();
          ctx.fill();
        }

        // Car Main Body (Lower)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-32, -4, 64, 16, [4, 6, 2, 2]);
        ctx.fill();

        // Car Roof / Cabin
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-16, -14, 34, 12, [6, 8, 0, 0]);
        ctx.fill();

        // Glass Windows
        ctx.fillStyle = isNight ? '#1e293b' : '#93c5fd';
        ctx.beginPath();
        ctx.roundRect(-13, -12, 14, 8, [3, 2, 0, 0]);
        ctx.roundRect(3, -12, 12, 8, [2, 4, 0, 0]);
        ctx.fill();

        // Wheels (Front & Rear)
        ;[-18, 18].forEach(wx => {
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(wx, 11, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(wx, 11, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Headlights
        ctx.fillStyle = headlightsOn ? '#fef08a' : '#cbd5e1';
        ctx.fillRect(30, 0, 3, 5);

        // Taillights / Brake Lights
        ctx.fillStyle = isBraking ? '#ef4444' : '#991b1b';
        ctx.fillRect(-33, 0, 3, 5);
        if (isBraking) {
          ctx.beginPath();
          ctx.arc(-32, 2, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fill();
        }

        // Amber Turn Signal
        if (turnSignal && Math.floor(now / 250) % 2 === 0) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(28, 6, 4, 3);
          ctx.fillRect(-30, 6, 4, 3);
        }

        ctx.restore();
      }

      function drawAmbulance(ax, ay) {
        ctx.save();
        ctx.translate(ax, ay);

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 42, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Headlight Beams
        const hlGrad = ctx.createLinearGradient(35, 0, 140, 0);
        hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = hlGrad;
        ctx.beginPath();
        ctx.moveTo(38, 2);
        ctx.lineTo(140, -18);
        ctx.lineTo(140, 24);
        ctx.closePath();
        ctx.fill();

        // Ambulance White Body
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(-38, -16, 76, 26, [6, 10, 3, 3]);
        ctx.fill();

        // Fluorescent Red Emergency Stripe
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-38, 0, 76, 6);

        // Red Medical Cross
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-12, -10, 10, 3);
        ctx.fillRect(-8.5, -13.5, 3, 10);

        // Windshield
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(14, -14, 18, 11, [2, 6, 0, 0]);
        ctx.fill();

        // Flashing Dual Siren Lightbar (Red / Blue)
        const flashPhase = Math.floor(now / 120) % 2 === 0;
        ctx.fillStyle = flashPhase ? '#ef4444' : '#3b82f6';
        ctx.fillRect(-4, -21, 6, 5);
        ctx.fillStyle = flashPhase ? '#3b82f6' : '#ef4444';
        ctx.fillRect(4, -21, 6, 5);

        // Ambient Siren Glow Flash
        const sirenGlow = ctx.createRadialGradient(0, -20, 4, 0, -20, 60);
        sirenGlow.addColorStop(0, flashPhase ? 'rgba(239, 68, 68, 0.45)' : 'rgba(59, 130, 246, 0.45)');
        sirenGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sirenGlow;
        ctx.beginPath();
        ctx.arc(0, -20, 60, 0, Math.PI * 2);
        ctx.fill();

        // Wheels
        ;[-22, 22].forEach(wx => {
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(wx, 12, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(wx, 12, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      function drawPedestrian(px, py, stride, hasBackpack, hasUmbrella) {
        ctx.save();
        ctx.translate(px, py);

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Moving Legs
        const legAngle = Math.sin(stride) * 0.45;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        // Left leg
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(legAngle) * 8, 7);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-Math.sin(legAngle) * 8, 7);
        ctx.stroke();

        // Torso / Shirt
        ctx.fillStyle = hasBackpack ? '#3b82f6' : '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(-4, -12, 8, 12, 2);
        ctx.fill();

        // Backpack
        if (hasBackpack) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-6, -10, 3, 8);
        }

        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, -16, 4, 0, Math.PI * 2);
        ctx.fill();

        // Hair / Cap
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(0, -18, 3.5, Math.PI, Math.PI * 2);
        ctx.fill();

        // Umbrella (Rain)
        if (hasUmbrella) {
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(0, -23, 11, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -23);
          ctx.lineTo(0, -13);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 4. SCENARIO SIMULATION LOGIC
      let carX = 0;
      let carSpeed = 42;
      let isBraking = false;
      let statusText = 'CRUISING';
      let statusColor = '#10b981';
      let brakePercent = 0;
      const speedValEl = document.getElementById('sim-speed-val');
      const brakeValEl = document.getElementById('sim-brake-val');
      const statusValEl = document.getElementById('sim-status-val');
      const alertEl = document.getElementById('sim-alert-banner');

      if (isEmergency) {
        // AMBULANCE CORRIDOR SCENARIO
        const ambX = ((t * 1.6) / this._simState.duration) * (w + 140) - 70;
        const playerYieldX = w * 0.45;
        const playerLaneY = roadTop + roadHeight * 0.28 + (t > 2.0 && t < 6.0 ? 18 : 0);
        const playerBraking = t > 2.0 && t < 4.5;
        const playerTurnSignal = t > 1.8 && t < 5.5;

        drawAmbulance(ambX, roadTop + roadHeight * 0.28);
        drawVectorCar(playerYieldX, playerLaneY, '#3b82f6', playerBraking, true, playerTurnSignal);
        drawVectorCar(w * 0.85, roadTop + roadHeight * 0.72, '#eab308', false, true, false);

        carSpeed = playerBraking ? 18 : 38;
        brakePercent = playerBraking ? 65 : 0;
        statusText = playerTurnSignal ? 'YIELDING TO AMBULANCE 🚑' : 'CLEAR CORRIDOR';
        statusColor = '#f59e0b';

        if (alertEl) {
          alertEl.textContent = '🚨 STATUTORY PRIORITY: YIELD TO EMERGENCY VEHICLES';
          alertEl.classList.toggle('show', t > 1.5 && t < 5.5);
        }
      } else if (isSignal) {
        // TRAFFIC SIGNAL & CAMERA ENFORCEMENT
        const stopTargetX = stopLineX - 40;
        if (t < 3.0) {
          carX = ((t / 3.0) * (stopTargetX + 60)) - 60;
          carSpeed = 40;
          isBraking = false;
          statusText = 'APPROACHING SIGNAL';
          statusColor = '#38bdf8';
        } else if (t < 7.0) {
          carX = stopTargetX;
          carSpeed = 0;
          isBraking = true;
          brakePercent = 100;
          statusText = 'STOPPED AT RED LIGHT 🛑';
          statusColor = '#ef4444';
        } else {
          const leaveT = (t - 7.0) / 1.0;
          carX = stopTargetX + leaveT * (w - stopTargetX + 80);
          carSpeed = Math.round(leaveT * 40);
          isBraking = false;
          statusText = 'GREEN SIGNAL · PROCEEDING';
          statusColor = '#10b981';
        }

        drawVectorCar(carX, roadTop + roadHeight * 0.28, '#3b82f6', isBraking, true, false);

        // Violator NPC car running red light at t=4.5s
        if (t > 3.8 && t < 6.8) {
          const npcX = ((t - 3.8) / 3.0) * (w + 100) - 50;
          drawVectorCar(npcX, roadTop + roadHeight * 0.72, '#ef4444', false, true, false);
          
          // Camera Flash Trigger
          if (t > 4.6 && t < 4.9) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(0, 0, w, h);
          }
          if (alertEl) {
            alertEl.textContent = '🚨 RED LIGHT RUNNER CAPTURED — ₹1,000 FINE';
            alertEl.classList.toggle('show', t > 4.7 && t < 6.8);
          }
        } else if (alertEl) {
          alertEl.classList.remove('show');
        }
      } else {
        // PEDESTRIAN COURTESY & SCHOOL ZONE (Default)
        const stopTargetX = stopLineX - 42;
        if (t < 2.5) {
          carX = (t / 2.5) * (stopTargetX + 60) - 60;
          carSpeed = Math.round(40 - (t / 2.5) * 15);
          isBraking = t > 1.2;
          brakePercent = isBraking ? 50 : 0;
          statusText = 'APPROACHING CROSSWALK';
          statusColor = '#38bdf8';
        } else if (t < 6.5) {
          carX = stopTargetX;
          carSpeed = 0;
          isBraking = true;
          brakePercent = 90;
          statusText = 'YIELDING TO PEDESTRIANS 🚶';
          statusColor = '#10b981';
        } else {
          const leaveT = (t - 6.5) / 1.5;
          carX = stopTargetX + leaveT * (w - stopTargetX + 80);
          carSpeed = Math.round(leaveT * 36);
          isBraking = false;
          brakePercent = 0;
          statusText = 'CROSSWALK CLEAR · ACCELERATING';
          statusColor = '#10b981';
        }

        drawVectorCar(carX, roadTop + roadHeight * 0.28, '#3b82f6', isBraking, true, false);

        // Animated Pedestrians Crossing
        if (t > 1.8 && t < 7.2) {
          const pedProg = (t - 1.8) / 5.4;
          const pedY = sidewalkTop + pedProg * (roadHeight + 8);
          drawPedestrian(crossX - 18, pedY, t * 10, isSchool, isRain);
          drawPedestrian(crossX + 16, pedY - 14, t * 9, isSchool, isRain);
        } else {
          // Waiting at curb
          drawPedestrian(crossX - 18, sidewalkTop + 6, 0, isSchool, isRain);
        }

        if (alertEl) alertEl.classList.remove('show');
      }

      // 5. WEATHER EFFECTS (Rain & Splash Particles)
      if (isRain) {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        rainDrops.forEach(r => {
          r.y += r.speed * dt;
          r.x -= r.speed * dt * 0.35; // Angled rain
          if (r.y > h) {
            r.y = -10;
            r.x = Math.random() * (w + 100);
            // Road impact splash ripple
            if (r.y > roadTop) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.beginPath();
              ctx.ellipse(r.x, roadTop + Math.random() * roadHeight, 4, 1.5, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - 4, r.y + r.length);
        });
        ctx.stroke();
      }

      // Update Telemetry HUD
      if (speedValEl) speedValEl.textContent = `${carSpeed} km/h`;
      if (brakeValEl) brakeValEl.textContent = `${brakePercent}%`;
      if (statusValEl) {
        statusValEl.textContent = statusText;
        statusValEl.style.color = statusColor;
      }

      ctx.restore();

      this._simAnimId = requestAnimationFrame(renderFrame);
    };

    this._simAnimId = requestAnimationFrame(renderFrame);
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

    const lv = this.cur
    if (lv) this._selSyl('practical')
  },
  selectMode(mode) {
    this.curMode = mode
    const lv = this.cur
    if (lv) this._selSyl('practical')
  },
  dispatchStart(mode) {
    const lv = this.cur || (window.LVS && window.LVS[0]) || { id: 1 }
    const availModes = lv.modes || ['car']
    const chosenMode = mode || this.curMode || availModes[0]
    
    this.curMode = chosenMode
    localStorage.setItem('traffic_lv', lv.id)
    localStorage.setItem('traffic_mode', chosenMode)

    let vehParam = 'car'
    if (chosenMode === 'pedestrian') {
      vehParam = 'pedestrian'
    } else if (chosenMode === 'bike') {
      vehParam = 'bike'
    } else if (chosenMode === 'chaos') {
      vehParam = (S.vehicle || 'car').toLowerCase()
    } else if (S.vehicle) {
      vehParam = S.vehicle.toLowerCase()
    }

    localStorage.setItem('traffic_veh', vehParam)
    window.location.href = `Driving.html?lv=${lv.id}&mode=${chosenMode}&veh=${vehParam}`
  },
  abortQuiz() {
    const quizEl = document.getElementById('screen-quiz')
    if (quizEl) {
      quizEl.classList.remove('active')
      quizEl.style.display = ''
      quizEl.style.opacity = ''
      quizEl.style.pointerEvents = ''
    }
    const lv = this.cur || (window.LVS && window.LVS.find(l => l.id == (this.qst?.lvId || 1))) || window.LVS?.[0]
    if (lv && lv.id) {
      this.showBriefing(lv.id, 'exam')
    } else {
      this.showLevels()
    }
  },
  showQuiz(mode, perf = null) {
    mode = mode || ui.curMode || (window.game && window.game.vehMode) || 'car';
    ui.curMode = mode;

    // Ensure this.cur is always a valid level object
    if (!this.cur) {
      const curLvId = (window.game && window.game._lv) || 1;
      this.cur = (window.LVS && window.LVS.find(l => l.id == curLvId)) || window.LVS?.[0] || {
        id: curLvId,
        name: 'Lesson ' + curLvId,
        themeType: 'traffic_safety',
        law: { sec: 'Motor Vehicles Act', off: 'Traffic Violation', fine: '₹500 - ₹2000' }
      };
    }
    const lv = this.cur;
    const lawSec = (lv.law && lv.law.sec) || 'Motor Vehicles Act';
    const lawOff = (lv.law && lv.law.off) || 'Traffic Violation';
    const lawFine = (lv.law && lv.law.fine) || '₹500 - ₹2000';
    const themeName = (lv.themeType || 'traffic_safety').replace(/_/g, ' ');

    let qs = lv.quiz && lv.quiz[mode] ? [...lv.quiz[mode]] : lv.quiz && lv.quiz.car ? [...lv.quiz.car] : null;

    if (perf && perf.violations && perf.violations.length > 0) {
      const tag = perf.violations[0];
      const correction = typeof CORRECTIVE_QUIZ !== 'undefined' ? CORRECTIVE_QUIZ[tag] : null;
      if (correction) {
        if (!qs) qs = [];
        qs = [...qs, { ...correction, o: [...correction.o] }];
      }
    }

    // Use AdaptiveQuiz engine for syllabus-based + violation-based questions
    let adaptiveQuestions = [];
    try {
      if (typeof AdaptiveQuiz !== 'undefined') {
        const adaptiveQuiz = new AdaptiveQuiz(lv.id || 1, perf);
        adaptiveQuestions = adaptiveQuiz.generateQuiz(3) || [];
      }
    } catch(aqe) {
      console.warn('[Quiz] Adaptive quiz generation error:', aqe);
    }
    
    if (!qs || qs.length === 0) {
      qs = [
        { q: `What is the primary traffic rule for "${lv.name || 'this scenario'}"?`, o: [lawSec + ' compliance and caution', 'Accelerate fast through intersections', 'Ignore traffic signals when late', 'Honk aggressively to clear the way'], a: 0 },
        { q: `What is the legal penalty for ${lawOff}?`, o: [`Fine of ${lawFine} and penalty points`, '₹50 instant cash reward', 'No penalty if you apologize', 'Verbal warning only'], a: 0 },
        { q: `What is the safe procedure in ${themeName} conditions?`, o: ['Maintain safe following distance and obey signs', 'Speed up to cross early', 'Overtake vehicles on blind turns', 'Drive on the sidewalk to avoid traffic'], a: 0 }
      ];
    }
    
    // Merge adaptive questions with base questions if available
    if (adaptiveQuestions.length > 0) {
      qs = [...adaptiveQuestions, ...qs];
    }

    // Ensure all questions are well-formed (deep-cloned options, valid 4 choices)
    const validQuestions = [];
    qs.forEach((rawQ) => {
      if (!rawQ || !rawQ.q || !Array.isArray(rawQ.o) || rawQ.o.length < 2) return;
      const q = {
        q: String(rawQ.q),
        o: rawQ.o.map(opt => String(opt || '')),
        a: typeof rawQ.a === 'number' ? rawQ.a : 0
      };
      while (q.o.length < 4) q.o.push('None of the above');
      q.o = q.o.slice(0, 4);
      
      // Shuffle options and update answer index
      const correctText = q.o[q.a];
      const rIdx = Math.floor(Math.random() * 4);
      q.o[q.a] = q.o[rIdx];
      q.o[rIdx] = correctText;
      q.a = rIdx;
      validQuestions.push(q);
    });

    this.qst = { qs: validQuestions.slice(0, 5), cur: 0, pass: 0, mode: mode };
    if (this.qst.qs.length === 0) {
      this._fq();
      return;
    }

    // Hide game canvas and pause game loop
    const gc = document.getElementById('gc');
    if (gc) gc.classList.remove('on');
    if (window.game) window.game.playing = false;

    this._rq();
    this.show('screen-quiz', { direction: 'forward', instant: true });
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
      this.showResults(window.game?.fs || 100, window.game?.fst || { vio: 0 })
    } else {
      const lv = this.cur || (window.LVS && window.LVS.find(l => l.id == (this.qst?.lvId || 1))) || window.LVS?.[0]
      if (lv && lv.id) {
        if (!S.comp[lv.id]) S.comp[lv.id] = {}
        if (!S.comp[lv.id].modes) S.comp[lv.id].modes = {}
        S.comp[lv.id].modes[s.mode || 'practice'] = true
        S.comp[lv.id].completed = true
        S.comp[lv.id].finalQuiz = true

        const finalScore = window.game?.fs || 100
        const prevScore = S.comp[lv.id].score || 0
        S.comp[lv.id].score = Math.max(finalScore, prevScore)
        S.comp[lv.id].time = Date.now()
        S.total = (S.total || 0) + finalScore
        if (lv.badge && !S.badges.includes(lv.badge.id)) S.badges.push(lv.badge.id)

        const completedCount = Object.keys(S.comp).length
        if (completedCount >= 10 && !S.badges.includes('level_10')) S.badges.push('level_10')
        if (completedCount >= 20 && !S.badges.includes('level_20')) S.badges.push('level_20')
        if (completedCount >= 30 && !S.badges.includes('level_30')) S.badges.push('level_30')
        if (completedCount >= 40 && !S.badges.includes('level_40')) S.badges.push('level_40')
        if (completedCount >= 52 && !S.badges.includes('level_52')) S.badges.push('level_52')
        if (completedCount >= 52 && !S.badges.includes('traffic_hero')) S.badges.push('traffic_hero')

        const vioCount = window.game?.fst?.vio || 0
        const civicGain = vioCount === 0 ? 25 : vioCount <= 2 ? 10 : vioCount <= 4 ? 3 : 0
        S.civicScore = (S.civicScore || 0) + civicGain

        if (!S.violationHistory) S.violationHistory = {}
        ;(window.game?.violationsLog || []).forEach((v) => {
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
      toast(`✅ ${(s.mode || 'practice').charAt(0).toUpperCase() + (s.mode || 'practice').slice(1)} quiz passed!`, '#00c851')
      if (window.location.pathname.toLowerCase().includes('driving')) {
        this.showResults(window.game?.fs || 100, window.game?.fst || { vio: 0 });
      } else {
        if (typeof SCENARIOS !== 'undefined') {
          const sc = SCENARIOS.find(x => x.levelRef === lv?.id)
          if (sc) {
            this.show2D(sc.id)
            return
          } else {
            this.show2D(1)
            return
          }
        }
        this.showResults(window.game?.fs || 100, window.game?.fst || { vio: 0 });
      }
    }
  },
  showResults(score, stats) {
    const lv = this.cur || (window.LVS && window.LVS[0])
    if (lv && lv.id) {
      const prev = S.comp[lv.id]?.score || 0
      S.comp[lv.id] = { ...S.comp[lv.id], score: Math.max(score, prev), time: Date.now(), finalQuiz: true, completed: true }
      if (!S.comp[lv.id].modes) S.comp[lv.id].modes = {}
      S.comp[lv.id].modes.learn = true
      S.comp[lv.id].modes.practice = true
      S.total = (S.total || 0) + score
    }
    const vioCount = stats?.vio || 0
    const civicGain = vioCount === 0 ? 25 : vioCount <= 2 ? 10 : vioCount <= 4 ? 3 : 0
    S.civicScore = (S.civicScore || 0) + civicGain
    if (!S.violationHistory) S.violationHistory = {}
    ;(stats?.violations || window.game?.violationsLog || []).forEach((v) => {
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


    const completedCount = Object.keys(S.comp).length
    if (completedCount >= 10 && !S.badges.includes('level_10')) S.badges.push('level_10')
    if (completedCount >= 20 && !S.badges.includes('level_20')) S.badges.push('level_20')
    if (completedCount >= 30 && !S.badges.includes('level_30')) S.badges.push('level_30')
    if (completedCount >= 40 && !S.badges.includes('level_40')) S.badges.push('level_40')
    if (completedCount >= 52 && !S.badges.includes('level_52')) S.badges.push('level_52')
    if (completedCount >= 52 && !S.badges.includes('traffic_hero')) S.badges.push('traffic_hero')


    const themeTypes = {
      pedestrian_expert: ['pedestrian_courtesy', 'pedestrian_priority', 'pedestrian', 'crosswalk'],
      night_driver: ['night', 'night_driving', 'night_monsoon', 'blind_corner', 'zero_visibility'],
      weather_pro: ['rain', 'rain_driving', 'puddle_etiquette', 'weather', 'monsoon', 'flood'],
      emergency_hero: ['ambulance', 'emergency', 'ambulance_priority', 'hospital'],
      parking_master: ['parking', 'street_parking', 'respectful_parking', 'parking_rules']
    }


    for (const [badgeId, themes] of Object.entries(themeTypes)) {
      if (S.badges.includes(badgeId)) continue
      const categoryLevels = LVS.filter(l => themes.some(t => (l.themeType || '').includes(t)))
      const completedCategoryLevels = categoryLevels.filter(l => S.comp[l.id])
      if (completedCategoryLevels.length >= categoryLevels.length && categoryLevels.length > 0) {
        S.badges.push(badgeId)
      }
    }

    save()
    const rico = document.getElementById('rico')
    if (rico) rico.textContent = score > 200 ? '🌟' : '⭐'
    const rtit = document.getElementById('rtit')
    if (rtit) rtit.textContent = 'Level Complete!'
    const rsub = document.getElementById('rsub')
    if (rsub) rsub.textContent = (lv.name || 'Lesson') + ' 🔄 Well done!'

    // Generate and store certificate data for sharing
    const certData = this._generateCertificateData(lv, score, stats)
    window.LAST_CERTIFICATE = certData
    const rcard = document.getElementById('rcard')
    if (rcard) {
      rcard.innerHTML = `<div class="rr"><span class="rl">Score</span><span class="rv">⭐ ${Math.round(score)}</span></div><div class="rr"><span class="rl">Quiz</span><span class="rv">✅ Passed</span></div>${stats.fin ? `<div class="rr"><span class="rl">Fines issued</span><span class="rv" style="color:var(--red)">${stats.fin}</span></div>` : ''}<div class="rr"><span class="rl">Violations</span><span class="rv" style="color:${stats.vio ? 'var(--red)' : 'var(--green)'}">${stats.vio || 'None ✅'}</span></div><div class="rr"><span class="rl">Level</span><span class="rv">${lv.id} / 52</span></div>
${stats.reward ? `<div class="rr"><span class="rl" style="color:var(--green, #059669)">Level Reward</span><span class="rv" style="color:var(--green, #059669)">+₹${stats.reward.toLocaleString('en-IN')}</span></div>` : ''}
${stats.fineAmt ? `<div class="rr"><span class="rl" style="color:#ff3b30">Fines Deducted</span><span class="rv" style="color:#ff3b30">-₹${stats.fineAmt.toLocaleString('en-IN')}</span></div>` : ''}
<div class="rr" style="margin-top:10px; border-top:1px solid var(--line, rgba(0,0,0,0.15)); padding-top:10px;"><span class="rl">Career Wallet</span><span class="rv" style="color:var(--accent, #b45309); font-weight:700;">₹${(S.wallet || 0).toLocaleString('en-IN')}</span></div>
<div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
  <button class="btn btn-p" onclick="ui.downloadCertificate()" style="flex: 1; min-width: 140px;">
    📥 Download Certificate
  </button>
  <button class="btn btn-g" onclick="ui.shareCertificate()" style="flex: 1; min-width: 140px;">
    🔗 Share Certificate
  </button>
</div>`
    }
    const ro = document.getElementById('ro')
    if (ro) ro.classList.add('on')
    if (window.sfx && typeof window.sfx.play === 'function') sfx.play('win')
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
    try {
      const vf = document.getElementById('vflash')
      if (vf) {
        vf.classList.remove('flash')
        void vf.offsetWidth
        vf.classList.add('flash')
      }
      const cnumEl = document.getElementById('cnum')
      if (cnumEl) cnumEl.textContent = 'MTP/2026/' + (Math.floor(Math.random() * 90000) + 10000)
      const coffEl = document.getElementById('coff')
      if (coffEl) coffEl.textContent = c.off
      const clawEl = document.getElementById('claw')
      if (clawEl) clawEl.textContent = c.sec
      const camtEl = document.getElementById('camt')
      if (camtEl) camtEl.textContent = c.amt
      const locEl = document.getElementById('cloc')
      if (locEl) locEl.textContent = c.loc || '📍 Mumbai'
      const covEl = document.getElementById('cov')
      if (covEl) covEl.classList.add('on')
      this._ccb = c.cb || null
      if (game.playing) game.pause = true
      sfx.play('challan')
    } catch (e) {
      console.warn('Challan display error:', e)
      this.cbusy = false
      if (this.cq.length > 0) {
        setTimeout(() => this._nc(), 100)
      }
    }
  },
  dismissChallan() {
    const cov = document.getElementById('cov')
    const cvc = document.getElementById('cvc-main')

    if (cvc) {
      try {
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

        setTimeout(() => {
          clone.style.transform = 'scale(0.2)'
          clone.style.top = window.innerHeight - 150 + 'px'
          clone.style.left = window.innerWidth - 150 + 'px'
          clone.style.opacity = '0'
        }, 20)

        setTimeout(() => {
          clone.remove()
        }, 500)
      } catch (e) {
        console.warn('Challan animation error:', e)
      }
    }

    if (cov) cov.classList.remove('on')

    setTimeout(() => {
      try {
        const stack = document.getElementById('challan-stack')
        if (stack) stack.classList.add('on')
        const coffEl = document.getElementById('coff')
        const camtEl = document.getElementById('camt')
        const offText = coffEl ? coffEl.textContent : ''
        const amtText = camtEl ? camtEl.textContent : ''
        if (ui._addChallanCard) ui._addChallanCard(offText, amtText)
      } catch (e) {
        console.warn('Challan card error:', e)
      }
    }, 300)

    setTimeout(() => {
      if (this._ccb) {
        this._ccb()
        this._ccb = null
      }
      if (game.playing) game.pause = false
      this.cbusy = false
setTimeout(() => this._nc(), 80)
    }, 500)
  },
  
  // ─── CERTIFICATE GENERATION ───
  _generateCertificateData(lv, score, stats) {
    const now = new Date();
    const certId = 'MTH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    return {
      id: certId,
      levelId: lv.id,
      levelName: lv.name,
      moduleName: lv.module?.name || 'Unknown',
      score: Math.round(score),
      violations: stats?.vio || 0,
      date: now.toISOString(),
      dateFormatted: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      studentName: S?.name || 'Traffic Hero',
      studentId: S?.studentId || 'STU-' + Math.floor(100000 + Math.random() * 900000),
      civicScore: S?.civicScore || 0,
      wallet: S?.wallet || 50000,
      badge: lv.badge?.id || null,
      verificationUrl: `${window.location.origin}/verify-cert.html?id=${certId}`
    };
  },
  
  downloadCertificate() {
    if (!window.LAST_CERTIFICATE) {
      toast('No certificate data available', '#ef4444');
      return;
    }
    
    const cert = window.LAST_CERTIFICATE;
    const element = document.createElement('div');
    element.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;padding:40px;background:white;color:#1a1a2e;font-family:"Inter",sans-serif;';
    element.innerHTML = this._getCertificateHTML(cert);
    document.body.appendChild(element);
    
    const opt = {
      margin: 0,
      filename: `Traffic_Academy_Certificate_${cert.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'px', format: 'a4', orientation: 'landscape' }
    };
    
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save().then(() => {
        element.remove();
        toast('📥 Certificate downloaded!', '#34d399');
      }).catch(() => {
        element.remove();
        toast('❌ Download failed', '#ef4444');
      });
    } else {
      element.remove();
      toast('❌ PDF library not loaded', '#ef4444');
    }
  },
  
  shareCertificate() {
    if (!window.LAST_CERTIFICATE) {
      toast('No certificate to share', '#ef4444');
      return;
    }
    
    const cert = window.LAST_CERTIFICATE;
    const shareUrl = cert.verificationUrl;
    const shareText = `🏆 I earned the "${cert.levelName}" certificate from Mumbai Traffic Hero Academy! Score: ${cert.score}/100 | Civic Score: ${cert.civicScore} | Verify: ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({ title: 'My Traffic Academy Certificate', text: shareText, url: shareUrl })
        .then(() => toast('✅ Shared!', '#34d399'))
        .catch(() => {});
    } else {
      // Copy to clipboard fallback
      navigator.clipboard.writeText(shareText).then(() => {
        toast('🔗 Certificate link copied to clipboard!', '#34d399');
      }).catch(() => {
        prompt('Copy this link to share:', shareText);
      });
    }
  },
  
  _getCertificateHTML(cert) {
    return `
      <div style="border: 4px solid #f2b84b; border-radius: 20px; padding: 40px; max-width: 720px; margin: 0 auto; background: linear-gradient(135deg, #fff 0%, #fef9f0 100%);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f2b84b; padding-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 16px;">
            <img src="../Icon.png" alt="CoL" style="height: 60px;" onerror="this.style.display='none'">
            <img src="mumbai-police-logo.png" alt="MTP" style="height: 60px;" onerror="this.style.display='none'">
          </div>
          <h1 style="font-family: 'Instrument Serif', serif; font-size: 2.5rem; color: #1a1a2e; margin: 0 0 8px; font-weight: 700;">Certificate of Completion</h1>
          <p style="font-size: 1.1rem; color: #666; margin: 0;">Mumbai Traffic Hero Academy</p>
        </div>
        
        <!-- Certificate ID -->
        <div style="text-align: center; margin-bottom: 24px; font-family: 'Space Mono', monospace; font-size: 0.85rem; color: #888;">
          Certificate ID: <strong style="color: #f2b84b;">${cert.id}</strong>
        </div>
        
        <!-- Recipient -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="font-size: 0.85rem; color: #888; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.1em;">Awarded to</p>
          <p style="font-family: 'Instrument Serif', serif; font-size: 2rem; color: #1a1a2e; font-weight: 700; margin: 0 0 4px;">${cert.studentName}</p>
          <p style="font-size: 0.85rem; color: #888; margin: 0;">Student ID: ${cert.studentId}</p>
        </div>
        
        <!-- Achievement -->
        <div style="background: linear-gradient(135deg, #f2b84b 0%, #f59e0b 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center; color: #1a1a2e;">
          <p style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px;">Successfully Completed</p>
          <p style="font-family: 'Instrument Serif', serif; font-size: 1.8rem; font-weight: 700; margin: 0 0 4px;">${cert.levelName}</p>
          <p style="font-size: 1rem; opacity: 0.9; margin: 0;">${cert.moduleName} — Level ${cert.levelId}</p>
        </div>
        
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="font-size: 2rem; font-weight: 800; color: #059669; margin: 0; font-family: 'Space Mono', monospace;">${cert.score}/100</p>
            <p style="font-size: 0.75rem; color: #666; margin-top: 4px; text-transform: uppercase;">Score</p>
          </div>
          <div style="background: #fff7ed; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="font-size: 2rem; font-weight: 800; color: #d97706; margin: 0; font-family: 'Space Mono', monospace;">${cert.violations === 0 ? 'Perfect' : cert.violations}</p>
            <p style="font-size: 0.75rem; color: #666; margin-top: 4px; text-transform: uppercase;">Violations</p>
          </div>
          <div style="background: #eff6ff; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="font-size: 2rem; font-weight: 800; color: #2563eb; margin: 0; font-family: 'Space Mono', monospace;">${cert.civicScore}</p>
            <p style="font-size: 0.75rem; color: #666; margin-top: 4px; text-transform: uppercase;">Civic Score</p>
          </div>
          <div style="background: #fafafa; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="font-size: 1.5rem; font-weight: 800; color: #f2b84b; margin: 0; font-family: 'Space Mono', monospace;">₹${cert.wallet.toLocaleString('en-IN')}</p>
            <p style="font-size: 0.75rem; color: #666; margin-top: 4px; text-transform: uppercase;">Wallet</p>
          </div>
        </div>
        
        <!-- Date & Verification -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 0.85rem; color: #666;">
          <p style="margin: 0 0 8px;">Completed on <strong>${cert.dateFormatted}</strong></p>
          <p style="margin: 0 0 8px;">Verify at: <a href="${cert.verificationUrl}" style="color: #f2b84b; text-decoration: none;">${cert.verificationUrl}</a></p>
          <p style="margin: 0; font-size: 0.75rem;">© ${new Date().getFullYear()} Mumbai Traffic Hero Academy — Class Of Learners</p>
        </div>
        
        <!-- Badge if earned -->
        ${cert.badge ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e5e7eb; text-align: center;">
          <span style="font-size: 2.5rem;">${BADGES.find(b => b.id === cert.badge)?.icon || '🏅'}</span>
          <p style="margin: 8px 0 0; font-weight: 700; color: #f2b84b;">${BADGES.find(b => b.id === cert.badge)?.name || 'Special Badge'}</p>
        </div>` : ''}
      </div>
    `;
  },

  show2D(scenarioId) {
    const sc = (typeof SCENARIOS !== 'undefined') ? SCENARIOS[scenarioId] : null;
    if (!sc) {
      console.warn('[ui] Scenario not found:', scenarioId);
      return;
    }
    this._cur2D = { ...sc, id: scenarioId };
    document.getElementById('s2d-title').textContent = (sc.icon || '🚦') + ' ' + (sc.headline || sc.name || scenarioId);
    this.show('screen-2d');
    setTimeout(() => {
      if (typeof initScenario2D === 'function') {
        initScenario2D('scenario2d-container', scenarioId);
      }
    }, 100);
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
    ctx.fillRect(32, 32, 192, 64)
    ctx.fillRect(32, 160, 192, 64)
    ctx.fillStyle = '#c0392b'
    ctx.fillRect(16, 220, 64, 36)
    ctx.fillRect(176, 220, 64, 36)
    ctx.fillStyle = '#f1c40f'
    ctx.fillRect(16, 0, 64, 32)
    ctx.fillRect(176, 0, 64, 32)
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

    // Safe curated model lookup
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
          if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('paint') || (child.material.name && child.material.name.toLowerCase().includes('paint'))) {
            child.material = child.material.clone()
            child.material.color.setHex(col)
          }
        }
      })
    }


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


    const hw = type === 'bus' || type === 'truck' ? 1.8 : 1.2
    const hl = type === 'bus' || type === 'truck' ? 5.5 : 2.8
    const hbGeo = new THREE.BoxGeometry(hw, 2, hl)
    const hbMat = new THREE.MeshBasicMaterial({ visible: false })
    const hb = new THREE.Mesh(hbGeo, hbMat)
    hb.position.y = 1

    g.add(baseModel)
    g.add(hb)


    const doorGeoGLB = new THREE.BoxGeometry(0.06, 0.5, 1.0)

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

    const dpLGLB = new THREE.Group()
    dpLGLB.position.set(doorWGLB, 1.0, 0.5)
    const dmLGLB = new THREE.Mesh(doorGeoGLB, doorMatGLB.clone())
    dmLGLB.position.set(0, 0, -0.5)
    dpLGLB.add(dmLGLB)
    g.add(dpLGLB)

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

  if (typeof window.IndianVehicles !== 'undefined' && typeof window.IndianVehicles.buildVehicle === 'function') {
    const iv = window.IndianVehicles.buildVehicle(type, col);
    if (iv) return iv;
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

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 3.8), bodyM)
      body.position.y = 0.42
      g.add(body)

      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.44, 1.9), bodyM)
      cab.position.set(0, 0.84, 0.08)
      g.add(cab)

      const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), glassM)
      ws.position.set(0, 0.84, 1.02)
      ws.rotation.x = Math.PI / 5
      g.add(ws)
      const rs = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), glassM)
      rs.position.set(0, 0.84, -0.85)
      rs.rotation.x = -Math.PI / 5
      g.add(rs)

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

      const doorGeoPC = new THREE.BoxGeometry(0.04, 0.38, 0.85)
      const doorMatPC = bodyM.clone()

      const dpLPC = new THREE.Group()
      dpLPC.position.set(0.82, 0.65, 0.4)
      const dmLPC = new THREE.Mesh(doorGeoPC, doorMatPC.clone())
      dmLPC.position.set(0, 0, -0.425)
      dpLPC.add(dmLPC)
      g.add(dpLPC)

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
      const bM = new THREE.MeshToonMaterial({ color: col || 0xe74c3c })
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

      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.5), new THREE.MeshToonMaterial({ color: col })))
    }
  }
  return g
}

const _buildHuman = (isPlayer = false, appearance) => {
  const g = new THREE.Group()
  const sk = isPlayer ? 1.0 : 0.92



  const npcSkins = [0xd4a574, 0xc68642, 0x8d5524, 0xf1c27d, 0xffdbac, 0xe0ac69]
  const npcShirts = [0x3498db, 0x2ecc71, 0x9b59b6, 0xe67e22, 0x1abc9c, 0xe74c3c, 0x34495e]
  const npcPants = [0x555555, 0x2c3e50, 0x444444, 0x3d3d3d, 0x2d2d2d]
  const npcHairs = [0x1a1a1a, 0x3d2b1f, 0x654321, 0x8B4513, 0x2c1810, 0xb5651d]


  let savedAppear = null
  if (isPlayer) {
    try { savedAppear = JSON.parse(localStorage.getItem('traffic_appearance')) } catch (e) {}
  }
  const app = (isPlayer && savedAppear) || appearance || {}


  const skinColor = isPlayer ? (app.skin || 0xd4a574) : npcSkins[Math.floor(Math.random() * npcSkins.length)]
  const shirtColor = isPlayer ? (app.shirt || 0xe74c3c) : npcShirts[Math.floor(Math.random() * npcShirts.length)]
  const shirtDk = new THREE.Color(shirtColor).multiplyScalar(0.8).getHex()
  const pantsColor = isPlayer ? (app.pants || 0x2c3e50) : npcPants[Math.floor(Math.random() * npcPants.length)]
  const pantsDk = new THREE.Color(pantsColor).multiplyScalar(0.8).getHex()
  const hairColor = isPlayer ? (app.hair || 0x1a1a1a) : npcHairs[Math.floor(Math.random() * npcHairs.length)]


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


  const headGroup = new THREE.Group()
  headGroup.position.y = 1.72 * sk


  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28 * sk, 16, 12), SKIN)
  skull.scale.set(1, 1.05, 0.95)
  headGroup.add(skull)


  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.20 * sk, 12, 8), SKIN2)
  jaw.position.set(0, -0.18 * sk, 0.10 * sk)
  jaw.scale.set(0.85, 0.55, 0.75)
  headGroup.add(jaw)


  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.04 * sk, 8, 6), SKIN)
  chin.position.set(0, -0.24 * sk, 0.16 * sk)
  headGroup.add(chin)


  const hairStyle = isPlayer ? (app.hairStyle || 'classic') : 'classic'
  if (hairStyle !== 'bald') {
    if (hairStyle === 'short') {

      const buzz = new THREE.Mesh(new THREE.SphereGeometry(0.285 * sk, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), HAIR)
      buzz.position.set(0, 0.09 * sk, -0.01 * sk)
      buzz.scale.set(1, 0.55, 1)
      headGroup.add(buzz)
    } else if (hairStyle === 'long') {

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


  const _eyeLids = []
  ;[-1, 1].forEach(s => {

    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.048 * sk, 10, 8), EYE_W)
    ew.position.set(s * 0.105 * sk, 0.04 * sk, 0.23 * sk)
    ew.scale.set(1, 0.85, 0.6)
    headGroup.add(ew)

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.028 * sk, 8, 6), EYE_IRIS)
    iris.position.set(s * 0.105 * sk, 0.035 * sk, 0.255 * sk)
    headGroup.add(iris)

    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.015 * sk, 6, 4), EYE_P)
    ep.position.set(s * 0.105 * sk, 0.035 * sk, 0.268 * sk)
    headGroup.add(ep)

    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.006 * sk, 4, 3), EYE_W)
    hl.position.set(s * 0.095 * sk, 0.045 * sk, 0.27 * sk)
    headGroup.add(hl)

    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.052 * sk, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.4), SKIN)
    lid.position.set(s * 0.105 * sk, 0.065 * sk, 0.235 * sk)
    lid.scale.set(1, 0.7, 0.7)
    lid.rotation.x = -0.2
    headGroup.add(lid)
    _eyeLids.push(lid)
  })


  ;[-1, 1].forEach(s => {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.11 * sk, 0.018 * sk, 0.025 * sk), HAIR)
    brow.position.set(s * 0.105 * sk, 0.11 * sk, 0.23 * sk)
    brow.rotation.z = s * 0.1
    headGroup.add(brow)
  })


  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * sk, 0.025 * sk, 0.08 * sk, 8), NOSE_M)
  nose.position.set(0, -0.03 * sk, 0.26 * sk)
  nose.rotation.x = Math.PI / 2 + 0.15
  headGroup.add(nose)

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.022 * sk, 8, 6), NOSE_M)
  noseTip.position.set(0, -0.06 * sk, 0.275 * sk)
  headGroup.add(noseTip)


  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07 * sk, 0.012 * sk, 0.018 * sk), MOUTH)
  mouth.position.set(0, -0.11 * sk, 0.25 * sk)
  headGroup.add(mouth)

  const lip = new THREE.Mesh(new THREE.SphereGeometry(0.025 * sk, 8, 4), LIP_COLOR)
  lip.position.set(0, -0.125 * sk, 0.245 * sk)
  lip.scale.set(1.2, 0.4, 0.5)
  headGroup.add(lip)


  ;[-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04 * sk, 8, 6), SKIN2)
    ear.position.set(s * 0.27 * sk, 0.02 * sk, 0.0)
    ear.scale.set(0.6, 0.8, 0.4)
    headGroup.add(ear)

    const earIn = new THREE.Mesh(new THREE.SphereGeometry(0.02 * sk, 6, 4), EAR_INNER)
    earIn.position.set(s * 0.275 * sk, 0.02 * sk, 0.005 * sk)
    earIn.scale.set(0.5, 0.7, 0.3)
    headGroup.add(earIn)
  })


  if (isPlayer && app.accessories?.cap !== false && !app.accessories?.beanie && !app.accessories?.helmet) {
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.29 * sk, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), CAP)
    capTop.position.set(0, 0.12 * sk, -0.01 * sk)
    capTop.scale.set(1.02, 0.5, 1.02)
    headGroup.add(capTop)

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * sk, 0.30 * sk, 0.02 * sk, 12), CAP_BRIM)
    brim.position.set(0, 0.10 * sk, 0.12 * sk)
    brim.scale.set(1, 1, 0.6)
    headGroup.add(brim)

    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.025 * sk, 6, 4), CAP_BRIM)
    btn.position.set(0, 0.22 * sk, -0.01 * sk)
    headGroup.add(btn)
  }


  if (isPlayer && app.accessories?.beanie) {
    const BEANIE = new THREE.MeshToonMaterial({ color: app.beanieColor || 0x3498db })
    const BEANIE_RIBBON = new THREE.MeshToonMaterial({ color: app.beanieColor ? new THREE.Color(app.beanieColor).multiplyScalar(0.7).getHex() : 0x2980b9 })

    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.31 * sk, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), BEANIE)
    dome.position.set(0, 0.10 * sk, -0.02 * sk)
    dome.scale.set(1.02, 0.55, 1.02)
    headGroup.add(dome)

    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.28 * sk, 0.035 * sk, 8, 14), BEANIE_RIBBON)
    ribbon.position.set(0, 0.04 * sk, -0.01 * sk)
    ribbon.rotation.x = Math.PI / 2 + 0.15
    ribbon.scale.set(1, 1, 0.7)
    headGroup.add(ribbon)

    const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.055 * sk, 8, 6), BEANIE_RIBBON)
    pompom.position.set(0.01 * sk, 0.23 * sk, -0.02 * sk)
    headGroup.add(pompom)
  }


  if (isPlayer && app.accessories?.helmet) {
    const HELMET_OUTER = new THREE.MeshToonMaterial({ color: 0xf5f5f5 })
    const HELMET_STRIPE = new THREE.MeshToonMaterial({ color: 0x2980b9 })
    const HELMET_PAD = new THREE.MeshToonMaterial({ color: 0x555555 })
    const HELMET_VISOR = new THREE.MeshToonMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.5 })

    const hDome = new THREE.Mesh(new THREE.SphereGeometry(0.33 * sk, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), HELMET_OUTER)
    hDome.position.set(0, 0.10 * sk, -0.02 * sk)
    hDome.scale.set(1.04, 0.6, 1.06)
    headGroup.add(hDome)

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.015 * sk, 0.12 * sk, 0.25 * sk), HELMET_STRIPE)
    stripe.position.set(0, 0.13 * sk, -0.02 * sk)
    stripe.rotation.x = 0.15
    headGroup.add(stripe)

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.27 * sk, 8, 6, 0, Math.PI * 1.2, 0, Math.PI * 0.4), HELMET_VISOR)
    visor.position.set(0, 0.07 * sk, 0.05 * sk)
    visor.scale.set(1.1, 0.5, 0.9)
    headGroup.add(visor)

    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.30 * sk, 0.025 * sk, 6, 14), HELMET_PAD)
    pad.position.set(0, 0.03 * sk, -0.01 * sk)
    pad.rotation.x = Math.PI / 2 + 0.15
    pad.scale.set(1, 0.9, 0.7)
    headGroup.add(pad)
  }


  if (isPlayer && app.accessories?.glasses) {
    const GLASS_FRAME = new THREE.MeshToonMaterial({ color: app.glassesFrame || 0x1a1a1a })
    const GLASS_LENS = new THREE.MeshToonMaterial({
      color: app.glassesTint || 0x1a1a2e,
      transparent: true,
      opacity: 0.45
    })
    const GLASS_HIGHLIGHT = new THREE.MeshToonMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
    ;[-1, 1].forEach(s => {

      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.075 * sk, 10, 8), GLASS_LENS)
      lens.position.set(s * 0.13 * sk, 0.01 * sk, 0.24 * sk)
      lens.scale.set(1, 0.75, 0.25)
      headGroup.add(lens)

      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.072 * sk, 0.015 * sk, 8, 14), GLASS_FRAME)
      frame.position.set(s * 0.13 * sk, 0.01 * sk, 0.24 * sk)
      frame.scale.set(1, 0.85, 0.3)
      headGroup.add(frame)

      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.035 * sk, 6, 4), GLASS_HIGHLIGHT)
      hl.position.set(s * 0.10 * sk, 0.035 * sk, 0.265 * sk)
      headGroup.add(hl)
    })

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.02 * sk, 0.02 * sk), GLASS_FRAME)
    bridge.position.set(0, 0.01 * sk, 0.24 * sk)
    headGroup.add(bridge)

    ;[-1, 1].forEach(s => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14 * sk, 0.012 * sk, 0.012 * sk), GLASS_FRAME)
      arm.position.set(s * 0.19 * sk, 0.01 * sk, 0.12 * sk)
      headGroup.add(arm)

      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012 * sk, 4, 3), GLASS_FRAME)
      tip.position.set(s * 0.26 * sk, 0.01 * sk, 0.12 * sk)
      headGroup.add(tip)
    })
  }


  if (isPlayer) {
    const BLUSH = new THREE.MeshToonMaterial({ color: 0xff9999, transparent: true, opacity: 0.12 })
    ;[-1, 1].forEach(s => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.045 * sk, 6, 4), BLUSH)
      cheek.position.set(s * 0.12 * sk, -0.04 * sk, 0.20 * sk)
      cheek.scale.set(1, 0.5, 0.6)
      headGroup.add(cheek)
    })
  }


  const neck = limb(0.08 * sk, 0.10 * sk, 0.14 * sk, SKIN, 8)
  const neckGroup = new THREE.Group()
  neckGroup.position.y = 1.56 * sk
  neck.position.y = 0
  neckGroup.add(neck)
  g.add(neckGroup)

  g.add(headGroup)


  const tH = 0.65 * sk
  const torsoGroup = new THREE.Group()
  torsoGroup.position.y = 1.23 * sk


  const chest = limb(0.34 * sk, 0.30 * sk, tH * 0.52, SHIRT, 10)
  chest.position.y = tH * 0.15
  torsoGroup.add(chest)


  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.07 * sk, 0.015 * sk), SHIRT_DK)
  pocket.position.set(-0.12 * sk, tH * 0.2, 0.28 * sk)
  torsoGroup.add(pocket)

  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.085 * sk, 0.015 * sk, 0.02 * sk), SHIRT_DK)
  flap.position.set(-0.12 * sk, tH * 0.24, 0.29 * sk)
  torsoGroup.add(flap)


  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.008 * sk, 6, 4), EYE_W)
    btn.position.set(0, tH * 0.15 - i * 0.08 * sk, 0.31 * sk)
    torsoGroup.add(btn)
  }


  const waist = limb(0.30 * sk, 0.26 * sk, tH * 0.48, SHIRT_DK, 10)
  waist.position.y = -tH * 0.18
  torsoGroup.add(waist)


  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.28 * sk, 0.025 * sk, 6, 16), BELT)
  belt.position.y = -tH * 0.40
  belt.rotation.x = Math.PI / 2
  torsoGroup.add(belt)

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.04 * sk, 0.02 * sk), BELT_BUCKLE)
  buckle.position.set(0, -tH * 0.40, 0.28 * sk)
  torsoGroup.add(buckle)

  g.add(torsoGroup)


  const lShoulder = jointSphere(0.08 * sk, SHIRT)
  lShoulder.position.set(-0.37 * sk, 1.42 * sk, 0)
  g.add(lShoulder)
  const rShoulder = jointSphere(0.08 * sk, SHIRT)
  rShoulder.position.set(0.37 * sk, 1.42 * sk, 0)
  g.add(rShoulder)


  const lArmP = new THREE.Group()
  lArmP.position.set(-0.38 * sk, 1.38 * sk, 0)

  const lUA = limb(0.085 * sk, 0.075 * sk, 0.32 * sk, SHIRT, 10)
  lUA.position.y = -0.16 * sk
  lArmP.add(lUA)

  const lElbow = jointSphere(0.055 * sk, JOINT)
  lElbow.position.set(0, -0.33 * sk, 0)
  lArmP.add(lElbow)

  const lFore = limb(0.07 * sk, 0.055 * sk, 0.28 * sk, SKIN, 10)
  lFore.position.set(0, -0.48 * sk, 0)
  lArmP.add(lFore)

  const lWrist = jointSphere(0.038 * sk, WRIST)
  lWrist.position.set(0, -0.63 * sk, 0)
  lArmP.add(lWrist)

  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.048 * sk, 8, 6), SKIN2)
  lHand.position.set(0, -0.68 * sk, 0)
  lHand.scale.set(0.9, 1, 0.7)
  lArmP.add(lHand)

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


  const lLegP = new THREE.Group()
  lLegP.position.set(-0.14 * sk, 0.82 * sk, 0)

  const lUL = limb(0.11 * sk, 0.095 * sk, 0.42 * sk, PANTS, 10)
  lUL.position.y = -0.21 * sk
  lLegP.add(lUL)

  const lKnee = jointSphere(0.065 * sk, PANTS_DK)
  lKnee.position.set(0, -0.43 * sk, 0)
  lLegP.add(lKnee)

  const lLL = limb(0.09 * sk, 0.075 * sk, 0.38 * sk, PANTS_DK, 10)
  lLL.position.set(0, -0.62 * sk, 0)
  lLegP.add(lLL)

  const lAnkle = jointSphere(0.04 * sk, SHOES)
  lAnkle.position.set(0, -0.82 * sk, 0)
  lLegP.add(lAnkle)

  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11 * sk, 0.07 * sk, 0.20 * sk), SHOES)
  lShoe.position.set(0.01 * sk, -0.87 * sk, 0.04 * sk)
  lLegP.add(lShoe)
  const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.115 * sk, 0.02 * sk, 0.21 * sk), SHOE_SOLE)
  lSole.position.set(0.01 * sk, -0.91 * sk, 0.04 * sk)
  lLegP.add(lSole)

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


  const shadowGeo = new THREE.CircleGeometry(0.3 * sk, 16)
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false })
  const shadowBlob = new THREE.Mesh(shadowGeo, shadowMat)
  shadowBlob.rotation.x = -Math.PI / 2
  shadowBlob.position.y = 0.01
  g.add(shadowBlob)


  let ring = null, nametag = null, nametagGlow = null, nametagGlowOuter = null
  if (isPlayer) {

    if (app.accessories?.backpack !== false) {
      const bagMain = new THREE.Mesh(new THREE.BoxGeometry(0.30 * sk, 0.40 * sk, 0.16 * sk), BAG)
      bagMain.position.set(0, 1.28 * sk, -0.24 * sk)
      g.add(bagMain)

      const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.24 * sk, 0.12 * sk, 0.04 * sk), BAG_DK)
      bagPocket.position.set(0, 1.20 * sk, -0.33 * sk)
      g.add(bagPocket)

      const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sk, 0.008 * sk, 0.005 * sk), BELT_BUCKLE)
      zipper.position.set(0, 1.27 * sk, -0.325 * sk)
      g.add(zipper)

      const bagFlap = new THREE.Mesh(new THREE.BoxGeometry(0.28 * sk, 0.06 * sk, 0.03 * sk), BAG_DK)
      bagFlap.position.set(0, 1.48 * sk, -0.30 * sk)
      g.add(bagFlap)

      ;[-1, 1].forEach(s => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04 * sk, 0.5 * sk, 0.02 * sk), BAG_STRAP)
        strap.position.set(s * 0.12 * sk, 1.35 * sk, -0.12 * sk)
        strap.rotation.x = 0.15
        g.add(strap)
      })
    }


    if (app.accessories?.scarf) {
      const SCARF = new THREE.MeshToonMaterial({ color: 0xe74c3c })
      const SCARF_STRIPE = new THREE.MeshToonMaterial({ color: 0xd4a017 })

      const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.16 * sk, 0.03 * sk, 8, 16), SCARF)
      wrap.position.set(0, 1.54 * sk, -0.02 * sk)
      wrap.rotation.x = Math.PI / 2 + 0.2
      wrap.scale.set(1.2, 1, 0.8)
      g.add(wrap)

      const segL = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.28 * sk, 0.03 * sk), SCARF)
      segL.position.set(-0.10 * sk, 1.38 * sk, 0.07 * sk)
      segL.rotation.x = 0.2
      segL.rotation.z = 0.1
      g.add(segL)

      const segR = new THREE.Mesh(new THREE.BoxGeometry(0.06 * sk, 0.28 * sk, 0.03 * sk), SCARF)
      segR.position.set(0.10 * sk, 1.38 * sk, 0.07 * sk)
      segR.rotation.x = 0.2
      segR.rotation.z = -0.1
      g.add(segR)

      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.02 * sk, 0.035 * sk), SCARF_STRIPE)
      stripeL.position.set(-0.10 * sk, 1.34 * sk, 0.075 * sk)
      g.add(stripeL)

      const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.08 * sk, 0.02 * sk, 0.035 * sk), SCARF_STRIPE)
      stripeR.position.set(0.10 * sk, 1.34 * sk, 0.075 * sk)
      g.add(stripeR)

      const segBack = new THREE.Mesh(new THREE.BoxGeometry(0.20 * sk, 0.16 * sk, 0.025 * sk), SCARF)
      segBack.position.set(0, 1.38 * sk, -0.14 * sk)
      segBack.rotation.x = -0.15
      g.add(segBack)
    }


    ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.32 * sk, 0.018, 10, 24),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 })
    )
    ring.position.set(0, 0.01, 0)
    ring.rotation.x = Math.PI / 2
    g.add(ring)

    const ringOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.36 * sk, 0.008, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.2 })
    )
    ringOuter.position.set(0, 0.01, 0)
    ringOuter.rotation.x = Math.PI / 2
    g.add(ringOuter)


    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.35 })
    ;[-1, 1].forEach(s => {
      const ar = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 4), arrowMat)
      ar.position.set(s * 0.52 * sk, 0.1 * sk, 0)
      ar.rotation.z = s * Math.PI / 2
      g.add(ar)
    })

    const fwdAr = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), arrowMat)
    fwdAr.position.set(0, 0.08 * sk, 0.5 * sk)
    fwdAr.rotation.x = Math.PI / 2
    g.add(fwdAr)


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

    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 140
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = 'rgba(0, 15, 10, 0.75)'
    if (ctx.roundRect) { ctx.roundRect(4, 4, 504, 132, 14); ctx.fill() } else { ctx.fillRect(4, 4, 504, 132) }

    ctx.strokeStyle = _rank.color + '88'
    ctx.lineWidth = 2.5
    if (ctx.roundRect) { ctx.roundRect(4, 4, 504, 132, 14); ctx.stroke() }

    ctx.font = '28px serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(_rank.icon, 20, 38)

    ctx.fillStyle = _rank.color
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(_rank.name.toUpperCase(), 52, 28)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 30px Inter, sans-serif'
    ctx.fillText(nameTxt, 52, 55)

    const barX = 20, barY = 78, barW = 472, barH = 10

    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    if (ctx.roundRect) { ctx.roundRect(barX, barY, barW, barH, 5); ctx.fill() } else { ctx.fillRect(barX, barY, barW, barH) }

    if (_xpPct > 0) {
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW * _xpPct, 0)
      barGrad.addColorStop(0, _rank.color)
      barGrad.addColorStop(1, _nextRank ? _nextRank.color : _rank.color)
      ctx.fillStyle = barGrad
      if (ctx.roundRect) { ctx.roundRect(barX, barY, Math.max(4, barW * _xpPct), barH, 5); ctx.fill() } else { ctx.fillRect(barX, barY, Math.max(4, barW * _xpPct), barH) }
    }

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

    const _rankColorObj = new THREE.Color(_rank.color)
    nametagGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.25 * sk, 0.30 * sk, 24),
      new THREE.MeshBasicMaterial({ color: _rankColorObj, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthTest: false })
    )
    nametagGlow.position.set(0, 2.45 * sk, -0.01)
    nametagGlow.rotation.x = -Math.PI / 2
    g.add(nametagGlow)

    nametagGlowOuter = new THREE.Mesh(
      new THREE.RingGeometry(0.32 * sk, 0.35 * sk, 24),
      new THREE.MeshBasicMaterial({ color: _rankColorObj, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthTest: false })
    )
    nametagGlowOuter.position.set(0, 2.45 * sk, -0.015)
    nametagGlowOuter.rotation.x = -Math.PI / 2
    g.add(nametagGlowOuter)


    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.04, side: THREE.BackSide })
    const glowBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * sk, 0.32 * sk, 1.6 * sk, 12), glowMat)
    glowBody.position.y = 0.9 * sk
    g.add(glowBody)
  }


  if (!isPlayer) {
    const npcBag = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sk, 0.30 * sk, 0.12 * sk), BAG)
    npcBag.position.set(0, 1.28 * sk, -0.22 * sk)
    g.add(npcBag)

    ;[-0.08, 0.08].forEach(x => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.025 * sk, 0.35 * sk, 0.015 * sk), BAG_STRAP)
      s.position.set(x * sk, 1.32 * sk, -0.10 * sk)
      g.add(s)
    })
  }


  g.traverse(c => {
    if (c.isMesh) {
      c.castShadow = !isPlayer
      c.receiveShadow = true
      c.frustumCulled = false
    }
  })


  const hb = new THREE.Mesh(
    new THREE.BoxGeometry(0.6 * sk, 1.8 * sk, 0.6 * sk),
    new THREE.MeshBasicMaterial({ visible: false })
  )
  hb.position.y = 0.9 * sk
  g.add(hb)


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

    idlePhase: Math.random() * Math.PI * 2,
    blinkTimer: Math.random() * 4 + Math.random() * 3
  }
  return g
}

function updateTrafficAuthUI() {

  const localData = localStorage.getItem('traffic_local_user')
  let user = localData ? JSON.parse(localData) : null


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


if (typeof window !== 'undefined') {
  window.addEventListener('col-auth-changed', function() {
    setTimeout(updateTrafficAuthUI, 500)
  })
}


updateTrafficAuthUI()

window.addEventListener('DOMContentLoaded', updateTrafficAuthUI)



function selectVehicle(vehicleId) {
  if (ui && typeof ui._selectVehicle === 'function') {
    ui._selectVehicle(vehicleId)
  } else {
    S.vehicle = vehicleId.charAt(0).toUpperCase() + vehicleId.slice(1)
    save()
    toast(`✅ Vehicle set to ${vehicleId}`, '#34d399')
  }
}


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
  

  if (!document.getElementById('mystery-anim')) {
    const style = document.createElement('style')
    style.id = 'mystery-anim'
    style.textContent = '@keyframes bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }'
    document.head.appendChild(style)
  }
}


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
  

  if (!document.getElementById('modal-anim')) {
    const style = document.createElement('style')
    style.id = 'modal-anim'
    style.textContent = '@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }'
    document.head.appendChild(style)
  }
}


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


  async function _syncAppearanceFromCloud() {
    if (!window.supabaseClient || !window.colUser?.id) return
    try {
      const { data, error } = await window.supabaseClient
        .from('user_profiles')
        .select('appearance, appearance_updated_at')
        .eq('user_id', window.colUser.id)
        .maybeSingle()
      if (error || !data || !data.appearance) return

      const localRaw = localStorage.getItem('traffic_appearance')
      if (localRaw) {
        try {
          const local = JSON.parse(localRaw)
          const cloudTime = data.appearance_updated_at ? new Date(data.appearance_updated_at).getTime() : 0
          const localTime = local._updated || 0
          if (cloudTime <= localTime) return
        } catch (e) {}
      }
      localStorage.setItem('traffic_appearance', JSON.stringify(data.appearance))

      _loadSaved()
      _refreshSwatches()
      _updatePreviewModel()
    } catch (e) {
      console.warn('[customize] Cloud sync error:', e)
    }
  }


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

    if (!canvas.dataset.swipeEnabled) {
      canvas.dataset.swipeEnabled = "true"
      let isDragging = false
      let previousX = 0
      
      canvas.addEventListener('mousedown', e => {
        isDragging = true
        window._autoRotatePreview = false
        previousX = e.clientX
      })
      canvas.addEventListener('mousemove', e => {
        if (isDragging && typeof _previewChar !== 'undefined' && _previewChar) {
          const deltaX = e.clientX - previousX
          _previewChar.rotation.y += deltaX * 0.01
          previousX = e.clientX
        }
      })
      canvas.addEventListener('mouseup', () => { isDragging = false; window._autoRotatePreview = true; })
      canvas.addEventListener('mouseleave', () => { isDragging = false; window._autoRotatePreview = true; })
      
      canvas.addEventListener('touchstart', e => {
        isDragging = true
        window._autoRotatePreview = false
        previousX = e.touches[0].clientX
      }, { passive: true })
      canvas.addEventListener('touchmove', e => {
        if (isDragging && typeof _previewChar !== 'undefined' && _previewChar) {
          const deltaX = e.touches[0].clientX - previousX
          _previewChar.rotation.y += deltaX * 0.01
          previousX = e.touches[0].clientX
        }
      }, { passive: true })
      canvas.addEventListener('touchend', () => { isDragging = false; window._autoRotatePreview = true; })
    }

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

    const amb = new THREE.AmbientLight(0x8888ff, 0.25)
    _previewScene.add(amb)

    const key = new THREE.DirectionalLight(0xffeedd, 1.1)
    key.position.set(3, 4, 4)
    _previewScene.add(key)

    const fill = new THREE.DirectionalLight(0x8899ff, 0.35)
    fill.position.set(-2.5, 1.5, 3)
    _previewScene.add(fill)

    const rim = new THREE.DirectionalLight(0x88ddff, 0.5)
    rim.position.set(-1, 3, -5)
    _previewScene.add(rim)

    const bounce = new THREE.DirectionalLight(0x4466aa, 0.2)
    bounce.position.set(0, -3, 2)
    _previewScene.add(bounce)

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
      if (window._autoRotatePreview !== false) {
        _previewChar.rotation.y += 0.006
      }

      if (_previewChar.userData) {
        const t = Date.now() * 0.002
        const breathe = Math.sin(t) * 0.004
        if (_previewChar.userData.torsoGroup) {
          _previewChar.userData.torsoGroup.position.y = 1.23 + breathe * 0.5
        }

        if (_previewChar.userData.headGroup) {
          _previewChar.userData.headGroup.rotation.z = Math.sin(t * 0.7) * 0.004
        }

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

    _current.accessories.beanie = Math.random() > 0.8
    _current.accessories.helmet = !_current.accessories.beanie && Math.random() > 0.85

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

    _syncAppearanceToCloud()
    const modal = document.getElementById('customize-modal')
    if (modal) modal.style.display = 'none'
    if (_previewRenderer) { cancelAnimationFrame(_previewRAF); _previewRenderer.dispose(); _previewRenderer = null }

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

    _syncAppearanceFromCloud()
    const modal = document.getElementById('customize-modal')
    if (modal) {
      modal.style.display = 'flex'
      _refreshSwatches()
      _initPreview()
      _animatePreview()
    }
  }

  // ─── TOKEN SHOP SYSTEM ───
  const TOKEN_SHOP = {
    categories: {
      skins: {
        name: 'Vehicle Skins',
        icon: '🎨',
        items: [
          { id: 'skin_mumbai_taxi', name: 'Mumbai Taxi', desc: 'Classic black & yellow kaali-peeli', price: 500, preview: '🚕', rarity: 'common' },
          { id: 'skin_police', name: 'Police Livery', desc: 'White with blue/red stripes', price: 800, preview: '🚓', rarity: 'rare' },
          { id: 'skin_ambulance', name: 'Ambulance', desc: 'White with red cross & sirens', price: 800, preview: '🚑', rarity: 'rare' },
          { id: 'skin_best_bus', name: 'BEST Bus Red', desc: 'Iconic Mumbai red double-decker', price: 1200, preview: '🚌', rarity: 'epic' },
          { id: 'skin_gold', name: 'Gold Chrome', desc: 'Shiny 24k gold finish', price: 2500, preview: '✨', rarity: 'legendary' },
          { id: 'skin_carbon', name: 'Carbon Fiber', desc: 'Matte carbon fiber weave', price: 2000, preview: '🖤', rarity: 'epic' },
          { id: 'skin_neon', name: 'Neon Glow', desc: 'Cyberpunk neon underglow', price: 3000, preview: '🌈', rarity: 'legendary' },
          { id: 'skin_camouflage', name: 'Urban Camo', desc: 'Grey-green urban camouflage', price: 1500, preview: '🌿', rarity: 'rare' },
        ]
      },
      horns: {
        name: 'Horn Sounds',
        icon: '📢',
        items: [
          { id: 'horn_classic', name: 'Classic Beep', desc: 'Standard vehicle horn', price: 100, preview: '🔊', rarity: 'common' },
          { id: 'horn_mumbai', name: 'Mumbai Traffic', desc: 'Cacophony of horns & bells', price: 300, preview: '🚨', rarity: 'common' },
          { id: 'horn_bollywood', name: 'Bollywood Hit', desc: 'Famous movie theme snippet', price: 500, preview: '🎵', rarity: 'rare' },
          { id: 'horn_siren', name: 'Police Siren', desc: 'Wailing police siren', price: 800, preview: '🚔', rarity: 'rare' },
          { id: 'horn_ambulance', name: 'Ambulance Siren', desc: 'Medical emergency siren', price: 800, preview: '🚑', rarity: 'rare' },
          { id: 'horn_train', name: 'Local Train', desc: 'Mumbai local train horn', price: 1000, preview: '🚂', rarity: 'epic' },
          { id: 'horn_custom', name: 'Custom Upload', desc: 'Upload your own 3s audio', price: 2000, preview: '🎤', rarity: 'legendary' },
        ]
      },
      accessories: {
        name: 'Dashboard Accessories',
        icon: '🪆',
        items: [
          { id: 'acc_ganesh', name: 'Dashboard Ganesha', desc: 'Blessed idol for safe journeys', price: 200, preview: '🐘', rarity: 'common' },
          { id: 'acc_hamsa', name: 'Hamsa Hand', desc: 'Protection from evil eye', price: 200, preview: '🤚', rarity: 'common' },
          { id: 'acc_dreamcatcher', name: 'Dreamcatcher', desc: 'Catches bad driving vibes', price: 400, preview: '🕸️', rarity: 'rare' },
          { id: 'acc_pendant', name: 'Om Pendant', desc: 'Sacred symbol hanging', price: 300, preview: '🕉️', rarity: 'rare' },
          { id: 'acc_plush', name: 'Plush Toy', desc: 'Cute companion for the ride', price: 500, preview: '🧸', rarity: 'rare' },
          { id: 'acc_airfresh', name: 'Premium Air Fresh', desc: 'Sandalwood & jasmine scent', price: 600, preview: '🌸', rarity: 'epic' },
          { id: 'acc_hologram', name: 'Hologram AI', desc: 'Floating nav assistant', price: 2000, preview: '🤖', rarity: 'legendary' },
        ]
      },
      titles: {
        name: 'Title Prefixes',
        icon: '🏷️',
        items: [
          { id: 'title_learner', name: 'Learner', desc: 'Just starting out', price: 50, preview: '🔰', rarity: 'common' },
          { id: 'title_citizen', name: 'Smart Citizen', desc: 'Follows all rules', price: 300, preview: '🏙️', rarity: 'common' },
          { id: 'title_safe', name: 'Safe Driver', desc: 'Zero violations streak', price: 500, preview: '🛡️', rarity: 'rare' },
          { id: 'title_speed', name: 'Speed Demon', desc: 'Loves the fast lane', price: 800, preview: '🏎️', rarity: 'rare' },
          { id: 'title_night', name: 'Night Owl', desc: 'Owns the night roads', price: 1000, preview: '🌙', rarity: 'epic' },
          { id: 'title_chaos', name: 'Chaos Walker', desc: 'Survived max difficulty', price: 1500, preview: '🌪️', rarity: 'epic' },
          { id: 'title_legend', name: 'Mumbai Legend', desc: 'Completed all campaigns', price: 5000, preview: '👑', rarity: 'legendary' },
        ]
      }
    },

    getOwnedItems() {
      return S.shopOwned || {};
    },

    getEquippedItems() {
      return S.shopEquipped || { skin: null, horn: null, accessory: null, title: null };
    },

    isOwned(itemId) {
      return this.getOwnedItems()[itemId] === true;
    },

    isEquipped(itemId) {
      const equipped = this.getEquippedItems();
      return Object.values(equipped).includes(itemId);
    },

    canAfford(price) {
      return (S.missionTokens || 0) >= price;
    },

    purchase(itemId) {
      const item = this.findItem(itemId);
      if (!item) return { success: false, reason: 'Item not found' };

      if (this.isOwned(itemId)) return { success: false, reason: 'Already owned' };

      if (!this.canAfford(item.price)) return { success: false, reason: 'Insufficient tokens' };

      // Deduct tokens
      S.missionTokens = (S.missionTokens || 0) - item.price;

      // Mark as owned
      if (!S.shopOwned) S.shopOwned = {};
      S.shopOwned[itemId] = true;

      // Auto-equip if first in category
      const equipped = this.getEquippedItems();
      if (!equipped[item.category]) {
        equipped[item.category] = itemId;
        S.shopEquipped = equipped;
      }

      save();

      // Sync to Supabase
      if (window.game && window.game._syncWalletToSupabase) {
        window.game._syncWalletToSupabase(-item.price, 'spend', 'shop_purchase_' + itemId);
      }

      // Update UI
      this.refreshUI();

      toast(`✅ Purchased ${item.name} for ${item.price} tokens!`, '#34d399');
      return { success: true, item };
    },

    equip(itemId) {
      const item = this.findItem(itemId);
      if (!item || !this.isOwned(itemId)) return { success: false, reason: 'Not owned' };

      const equipped = this.getEquippedItems();
      equipped[item.category] = itemId;
      S.shopEquipped = equipped;
      save();

      toast(`✨ Equipped ${item.name}`, '#b89bff');
      this.refreshUI();
      return { success: true };
    },

    unequip(category) {
      const equipped = this.getEquippedItems();
      delete equipped[category];
      S.shopEquipped = equipped;
      save();
      this.refreshUI();
    },

    findItem(itemId) {
      for (const [catKey, cat] of Object.entries(this.categories)) {
        const item = cat.items.find(i => i.id === itemId);
        if (item) return { ...item, category: catKey };
      }
      return null;
    },

    getCategoryItems(categoryKey) {
      return this.categories[categoryKey]?.items || [];
    },

    renderShop() {
      const owned = this.getOwnedItems();
      const equipped = this.getEquippedItems();
      const tokens = S.missionTokens || 0;

      let html = `
        <div style="padding: 8px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">🎖️ MISSION TOKENS</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #b89bff; font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em;" id="shop-token-display">${tokens.toLocaleString()}</div>
          </div>
        </div>
      `;

      for (const [catKey, cat] of Object.entries(this.categories)) {
        html += `
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 1.5rem;">${cat.icon}</span>
              <span style="font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">${cat.name}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px;">
        `;

        for (const item of cat.items) {
          const isOwned = owned[item.id];
          const isEquipped = equipped[catKey] === item.id;
          const canAfford = this.canAfford(item.price);

          const rarityColors = {
            common: 'var(--muted)',
            rare: 'var(--signal)',
            epic: 'var(--plasma)',
            legendary: '#ffd54a'
          };

          html += `
            <div style="background: var(--card); border: 1px solid ${isEquipped ? 'var(--signal)' : (isOwned ? 'var(--border)' : (canAfford ? 'rgba(94,212,245,0.3)' : 'rgba(239,68,68,0.3)'))}; border-radius: 12px; padding: 16px; position: relative; transition: all 0.2s;">
              <div style="font-size: 2.5rem; text-align: center; margin-bottom: 8px;">${item.preview}</div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--text); text-align: center; margin-bottom: 4px;">${item.name}</div>
              <div style="font-size: 0.65rem; color: var(--muted); text-align: center; margin-bottom: 8px; min-height: 2.5rem;">${item.desc}</div>
              <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border);">
                <span style="font-size: 0.7rem; font-weight: 700; color: ${rarityColors[item.rarity]}; text-transform: uppercase;">${item.rarity}</span>
                <span style="font-size: 0.85rem; font-weight: 800; color: #b89bff; font-family: 'Bebas Neue', sans-serif;">${item.price}</span>
              </div>
              <div style="margin-top: 12px; display: flex; gap: 8px;">
          `;

          if (!isOwned) {
            html += `
                <button class="btn ${canAfford ? '' : 'btn-s'}" style="flex: 1; padding: 8px; font-size: 0.7rem; ${!canAfford ? 'opacity: 0.5; cursor: not-allowed;' : ''}" 
                        onclick="TOKEN_SHOP.purchase('${item.id}'); TOKEN_SHOP.renderShop()" 
                        ${!canAfford ? 'disabled' : ''}>
                  ${canAfford ? 'BUY' : 'TOKENS'}
                </button>
            `;
          } else if (!isEquipped) {
            html += `
                <button class="btn" style="flex: 1; padding: 8px; font-size: 0.7rem;" 
                        onclick="TOKEN_SHOP.equip('${item.id}'); TOKEN_SHOP.renderShop()">
                  EQUIP
                </button>
            `;
          } else {
            html += `
                <button class="btn btn-s" style="flex: 1; padding: 8px; font-size: 0.7rem; background: var(--green); color: #000;" 
                        onclick="TOKEN_SHOP.unequip('${catKey}'); TOKEN_SHOP.renderShop()">
                  EQUIPPED
                </button>
            `;
          }

          html += `
              </div>
            </div>
          `;
        }

        html += `
            </div>
          </div>
        `;
      }

      return html;
    },

    refreshUI() {
      const container = document.getElementById('token-shop-container');
      if (container) {
        container.innerHTML = this.renderShop();
      }
      // Update token display in HUD
      const tokenEl = document.getElementById('mission-tokens');
      if (tokenEl) tokenEl.textContent = (S.missionTokens || 0).toLocaleString();
      const shopTokenEl = document.getElementById('shop-token-display');
      if (shopTokenEl) shopTokenEl.textContent = (S.missionTokens || 0).toLocaleString();
    },

    openShop() {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';
      modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:20px;padding:24px;max-width:900px;width:100%;max-height:90vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:2.5rem;">🏪</span>
              <div>
                <div style="font-size:1.5rem;font-weight:800;color:var(--text);font-family:'Bebas Neue',sans-serif;letter-spacing:0.02em;">TOKEN SHOP</div>
                <div style="font-size:0.75rem;color:var(--muted);">Spend Mission Tokens on cosmetics</div>
              </div>
            </div>
            <button onclick="this.closest('.modal').remove()" style="background:none;border:none;color:var(--muted);font-size:1.5rem;cursor:pointer;padding:8px;">✕</button>
          </div>
          <div id="token-shop-container">${this.renderShop()}</div>
        </div>
      `;
      modal.className = 'modal';
      document.body.appendChild(modal);
    }
  };

  window.TOKEN_SHOP = TOKEN_SHOP;

  // ─── SYLLABUS MODAL METHODS ───
  let _currentSyllabusLevel = null;
  let _syllabusProgress = { theory: false, rules: false, penalties: false, scenarios: false };

  ui.showSyllabus = function(levelId) {
    _currentSyllabusLevel = levelId;
    const level = window.COURSE?.getLevel?.(levelId);
    if (!level || !level.syllabus) {
      toast('Syllabus not available for this level yet', '#f2b84b');
      return;
    }

    const syllabus = level.syllabus;
    const modal = document.getElementById('syllabus-modal');
    if (!modal) return;

    // Update header
    document.getElementById('syl-title').textContent = level.name;
    document.getElementById('syl-subtitle').textContent = `Level ${level.id} — ${level.module?.name || 'Unknown Module'}`;
    document.getElementById('syl-icon').textContent = level.icon || '🚦';
    document.getElementById('syl-icon').style.background = level.color ? `var(${level.color})` : 'var(--signal)';

    // Update theory tab
    document.getElementById('syl-overview').textContent = syllabus.theory?.overview || '';
    const learningPoints = syllabus.theory?.rules || [];
    document.getElementById('syl-learning-points').innerHTML = learningPoints.map(r => `<li>${r}</li>`).join('');

    // Update rules tab
    document.getElementById('syl-rules-list').innerHTML = learningPoints.map(r => `<li>${r}</li>`).join('');

    // Update penalties tab
    const penalties = syllabus.theory?.penalties || [];
    document.getElementById('syl-penalties-body').innerHTML = penalties.map(p => `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 12px 8px; color: var(--text);">${p.violation}</td>
        <td style="padding: 12px 8px; color: var(--red); font-weight: 700;">${p.fine}</td>
        <td style="padding: 12px 8px; color: var(--muted); font-size: 0.8rem;">${p.act}</td>
        <td style="padding: 12px 8px; color: var(--yellow); font-weight: 700;">${p.points}</td>
      </tr>
    `).join('');

    // Update scenarios tab
    const scenarios = syllabus.theory?.scenarios || [];
    document.getElementById('syl-scenarios-carousel').innerHTML = scenarios.map((s, i) => `
      <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(180deg, var(--signal), var(--accent));"></div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--signal), var(--accent)); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">${i + 1}</div>
          <div style="flex: 1; font-size: 0.9rem; line-height: 1.6; color: var(--text);">${s}</div>
        </div>
      </div>
    `).join('');

    // Reset progress
    _syllabusProgress = { theory: false, rules: false, penalties: false, scenarios: false };
    updateSyllabusProgress();

    // Show modal
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('show'));
  };

  function updateSyllabusProgress() {
    const completed = Object.values(_syllabusProgress).filter(v => v).length;
    const total = 4;
    const pct = Math.round((completed / total) * 100);
    document.getElementById('syl-progress-pct').textContent = pct + '%';
    document.getElementById('syl-progress-fill').style.width = pct + '%';
  }

  function switchSyllabusTab(tab) {
    _syllabusProgress[tab] = true;
    updateSyllabusProgress();
    
    document.querySelectorAll('.syl-tab').forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.style.background = isActive ? 'var(--card)' : 'transparent';
      btn.style.color = isActive ? 'var(--text)' : 'var(--muted)';
    });
    document.querySelectorAll('.syl-tab-content').forEach(content => {
      content.style.display = content.id === 'syl-tab-' + tab ? 'block' : 'none';
    });
  }

  window.switchSyllabusTab = switchSyllabusTab;

  function closeSyllabusModal() {
    const modal = document.getElementById('syllabus-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    _currentSyllabusLevel = null;
  }

  window.closeSyllabusModal = closeSyllabusModal;

  function startSyllabusDemo() {
    if (!_currentSyllabusLevel) return;
    const level = window.COURSE?.getLevel?.(_currentSyllabusLevel);
    const demo2dKey = level?.syllabus?.demo2d;
    if (!demo2dKey) return;

    closeSyllabusModal();
    
    // Show 2D scenario screen
    if (typeof ui !== 'undefined' && ui.show2D) {
      ui.show2D(demo2dKey);
    } else if (window.Scenario2D) {
      window.Scenario2D.play(_currentSyllabusLevel, () => {
        // Demo complete, return to levels
        ui.showLevels();
      });
    }
  }

  window.startSyllabusDemo = startSyllabusDemo;

  function launchSyllabusTest() {
    if (!_currentSyllabusLevel) return;
    const level = window.COURSE?.getLevel?.(_currentSyllabusLevel);
    if (!level) return;

    closeSyllabusModal();

    // Show loading overlay
    const overlay = document.getElementById('test-loading-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      document.getElementById('test-loading-level-name').textContent = level.name;
      document.getElementById('test-loading-mode').textContent = 'EXAM MODE';
      
      // Animate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          document.getElementById('test-loading-bar').style.width = '100%';
          document.getElementById('test-loading-pct').textContent = '100%';
          document.getElementById('test-loading-status').textContent = 'Launching...';
          
          setTimeout(() => {
            overlay.style.display = 'none';
            // Navigate to Driving.html with syllabus param
            window.location.href = `Driving.html?lv=${_currentSyllabusLevel}&mode=exam&syllabus=true`;
          }, 500);
        } else {
          document.getElementById('test-loading-bar').style.width = progress + '%';
          document.getElementById('test-loading-pct').textContent = Math.round(progress) + '%';
        }
      }, 200);
    }
  }

  window.launchSyllabusTest = launchSyllabusTest;

  // Add shop button to profile/briefing
  const originalShowProfile = ui.showProfile;
  ui.showProfile = function() {
    originalShowProfile.call(this);
    // Could add shop button here
  };

  // Add shop button to briefing screen
  // ─── ADAPTIVE QUIZ ENGINE ───
  class AdaptiveQuiz {
    constructor(levelId, userActions) {
      this.levelId = levelId;
      this.userActions = userActions || { violations: [], correctActions: [] };
      this.questionPool = this._buildPool();
    }
    
    _buildPool() {
      const level = window.COURSE?.getLevel?.(this.levelId);
      const syllabus = level?.syllabus;
      const questions = [];
      
      // Syllabus-based questions
      if (syllabus?.theory?.rules) {
        syllabus.theory.rules.forEach(rule => questions.push({
          type: 'rule',
          text: rule,
          source: 'syllabus',
          weight: 1.0
        }));
      }
      
      // Violation-based questions (learning from mistakes) - higher weight
      this.userActions.violations?.forEach(v => {
        const violationText = v.message || v.type || v;
        questions.push({
          type: 'corrective',
          text: `You ${violationText.toLowerCase().replace('violation', '')}. Why is this wrong?`,
          source: 'violation',
          weight: 2.0
        });
      });
      
      // Correct action reinforcement
      this.userActions.correctActions?.forEach(c => {
        const actionText = c.message || c.type || c;
        questions.push({
          type: 'reinforcement',
          text: `You correctly ${actionText.toLowerCase().replace('correct', '')}. What rule does this follow?`,
          source: 'correct',
          weight: 1.0
        });
      });
      
      return questions;
    }
    
    generateQuiz(count = 5) {
      // Weighted random selection
      const selected = [];
      const pool = [...this.questionPool];
      
      for (let i = 0; i < count && pool.length > 0; i++) {
        // Calculate total weight
        const totalWeight = pool.reduce((sum, q) => sum + (q.weight || 1), 0);
        let random = Math.random() * totalWeight;
        
        for (let j = 0; j < pool.length; j++) {
          random -= pool[j].weight || 1;
          if (random <= 0) {
            selected.push(this._formatQuestion(pool[j]));
            pool.splice(j, 1);
            break;
          }
        }
      }
      
      // Fallback if not enough questions
      while (selected.length < count) {
        selected.push(this._getFallbackQuestion(selected.length));
      }
      
      return selected;
    }
    
    _formatQuestion(q) {
      const baseQuestions = {
        'rule': (text) => ({
          q: `Which rule applies: "${text}"?`,
          o: [text, 'Speed up through intersections', 'Honk to clear the way', 'Ignore if no police'],
          a: 0
        }),
        'corrective': (text) => ({
          q: `Corrective Check: ${text}`,
          o: ['It endangers lives and violates traffic law', 'Only wrong if caught by police', 'Acceptable in emergencies', 'Only applies to new drivers'],
          a: 0
        }),
        'reinforcement': (text) => ({
          q: `Good job! ${text}. This demonstrates:`,
          o: ['Defensive driving and rule compliance', 'Luck and timing', 'Aggressive driving skills', 'Vehicle performance'],
          a: 0
        })
      };
      
      return baseQuestions[q.type] ? baseQuestions[q.type](q.text) : this._getFallbackQuestion(0);
    }
    
    _getFallbackQuestion(index) {
      const fallbacks = [
        { q: 'What does a red traffic signal mean?', o: ['Stop completely before the stop line', 'Slow down and proceed', 'Honk and proceed', 'Turn right immediately'], a: 0 },
        { q: 'What is the speed limit in a school zone?', o: ['30 km/h', '50 km/h', '40 km/h', 'No limit'], a: 0 },
        { q: 'When must you yield to pedestrians?', o: ['At all crosswalks and intersections', 'Only at marked crosswalks', 'Only when they signal', 'Never - vehicles have priority'], a: 0 },
        { q: 'What should you do when an ambulance approaches with sirens?', o: ['Pull over to the left and stop', 'Speed up to get out of the way', 'Continue driving normally', 'Honk to alert the ambulance'], a: 0 },
        { q: 'Using a mobile phone while driving is:', o: ['Prohibited and carries a ₹5,000 fine', 'Allowed with hands-free only', 'Only banned on highways', 'Permitted at red lights'], a: 0 }
      ];
      return fallbacks[index % fallbacks.length];
    }
  }
  
  // Make it globally accessible
  window.AdaptiveQuiz = AdaptiveQuiz;

  const originalShowBriefing = ui._updateBriefingForMode;
  ui._updateBriefingForMode = function(lv, mode) {
    originalShowBriefing.call(this, lv, mode);
    // Add shop access button to briefing content
    setTimeout(() => {
      const contentEl = document.getElementById('br-content');
      if (contentEl && !contentEl.querySelector('#shop-access-btn')) {
        const shopBtn = document.createElement('button');
        shopBtn.id = 'shop-access-btn';
        shopBtn.className = 'btn';
        shopBtn.style.marginTop = '16px';
        shopBtn.style.width = '100%';
        shopBtn.style.background = 'linear-gradient(90deg, var(--plasma), var(--signal))';
        shopBtn.style.color = '#000';
        shopBtn.innerHTML = '🏪 Open Token Shop';
        shopBtn.onclick = () => TOKEN_SHOP.openShop();
        contentEl.appendChild(shopBtn);
      }
    }, 100);
  };

})()
