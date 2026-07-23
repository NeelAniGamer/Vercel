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
const sfx = {
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
}

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

const ui = {
  // Initialize S from localStorage (fallback if course.js hasn't loaded yet)
  _initS() {
    if (typeof S === 'undefined') {
      try {
        const raw = localStorage.getItem('mth4')
        if (raw) S = JSON.parse(raw)
      } catch (e) {}
      if (!S) S = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000, studentId: null }
      if (!S.comp) S.comp = {}
      if (!S.badges) S.badges = []
      if (!S.studentId) {
        S.studentId = 'STU-' + Math.floor(100000 + Math.random() * 900000)
        try { localStorage.setItem('mth4', JSON.stringify(S)) } catch (e) {}
      }
    }
    // Fallback save if course.js hasn't loaded
    if (typeof save === 'undefined') {
      window.save = async () => {
        try { localStorage.setItem('mth4', JSON.stringify(S)) } catch (e) {}
      }
    }
  },
  cur: null,
  _sylLv: null,
  cq: [],
  cbusy: false,
  qst: null,
  _ccb: null,
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
        document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'))
        document.getElementById('ss').classList.add('active')
      }
    }
  },
  init() {
    this._initS()
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
      this.show('ss')
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
  },
  show(id) {
    if (id && id !== null && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    if (id !== 'screen-briefing') {
      this._disposeBriefingScene()
    }
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'))
    if (id) {
      const el = document.getElementById(id)
      if (el) el.classList.add('active')
    }
  },
  _buildSylList() {
    this._initS()
    if (!S.comp) S.comp = {}
    const wrap = document.getElementById('lvbody')
    if (!wrap) return
    wrap.innerHTML = ''

    const catMap = {
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
        const done = S.comp[lv.id]
        const started = S.started && S.started[lv.id]
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
    this.show('screen-levels')
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
    this.show('screen-certificate')

    const cname = document.getElementById('cname')
    if (cname) cname.innerText = (S.name || 'DRIVER').toUpperCase()

    const certNum = document.getElementById('cert-num')
    if (certNum) {
      if (!S.certId) {
        S.certId = 'CERT-' + Math.floor(Math.random() * 1000000)
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
    this.show('screen-badges')

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
      const el = document.getElementById('cert-wrapper')
      html2pdf()
        .set({
          margin: 0,
          filename: 'Traffic_Hero_Certificate.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        })
        .from(el)
        .save()
    } else {
      alert('PDF library not loaded. Please ensure you have internet access.')
    }
  },

  showStart() {
    if (window.location.pathname.toLowerCase().includes('driving')) {
      window.location.href = 'Academy.html'
      return
    }
    this.show('ss')
    this._rain()
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
    this.show('screen-levels')
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
          c.onclick = () => this.showBriefing(lv.id)
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
    // Honor the "Preferred Vehicle" choice from onboarding (S.vehicle: 'Car'/'Bike') when
    // this level actually offers that mode — previously stored at signup but never used
    // anywhere, so picking "Motorcycle" there had no real effect on what you drove.
    const availModes = lv.modes || ['car']
    const preferred = S.vehicle === 'Bike' && availModes.includes('bike') ? 'bike'
      : S.vehicle === 'Car' && availModes.includes('car') ? 'car'
      : null
    if (history.replaceState) {
      history.replaceState(null, '', `?screen=levels&lv=${lv.id}`)
    }
    document.getElementById('blt').textContent = 'Level ' + lv.id
    document.getElementById('bvh').textContent = lv.v
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
    this.show('screen-briefing')
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
      const sylEl = document.getElementById('syl-' + id)
      if (sylEl) sylEl.classList.add('syl-done')
      const pct = Math.round((this._sylViewed.size / items.length) * 100)
      document.getElementById('br-prog-fill').style.width = pct + '%'
      document.getElementById('br-prog-label').textContent = pct + '%'
    }
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
      const btnsHTML = (lv.modes || ['car'])
        .map((m) => {
          const icons = { car: '🚗', bike: '🏍️', auto: '🛺', truck: '🚛', bus: '🚌', pedestrian: '🚶' }
          return `<button class="btn" style="flex:1; min-width:80px; text-transform:capitalize; background:var(--panel, rgba(0,0,0,0.04)); border:1px solid var(--line, rgba(0,0,0,0.08)); color:var(--ink, #111827); font-weight:700; padding:10px 8px; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:4px; transition:0.2s;" onmouseover="this.style.background='var(--line)'" onmouseout="this.style.background='var(--panel)'" onclick="ui.showQuiz('${m}')"><span style="font-size:1.3rem;">${icons[m] || '🚗'}</span><span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">${m}</span></button>`
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
  dispatchStart(mode) {
    mode = mode || this.curMode || 'car'
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
    this.show('screen-quiz')
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
}

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
        s = 3.2
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
        if (type === 'bus' || type === 'truck') s = 4.0
        else if (type === 'auto' || type === 'bike') s = 2.5
        else s = 3.2

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

const _buildHuman = (isPlayer = false) => {
  const g = new THREE.Group()

  // Pool: GLB mini-characters + animated FBX characters (when loaded)
  const glbChars = ['char_f_a', 'char_f_b', 'char_f_c', 'char_m_a', 'char_m_b', 'char_m_c']
  const fbxChars = ['anim_survivors', 'anim_retro', 'anim_protagonists'].filter(k => window.PRELOADED_MODELS && window.PRELOADED_MODELS[k])
  const allChars = glbChars.concat(fbxChars)
  const charKey = allChars[Math.floor(Math.random() * allChars.length)]

  // Debug: Check if character models are loaded
  const charLoaded = window.PRELOADED_MODELS && window.PRELOADED_MODELS[charKey];
  if (!charLoaded) {
    console.log('[DEBUG] Character model not loaded:', charKey, 'Available:', Object.keys(window.PRELOADED_MODELS || {}).filter(k => k.startsWith('char') || k.startsWith('anim')).join(', '));
  }

  if (charLoaded) {
    const hModel = window.PRELOADED_MODELS[charKey].clone()
    const isFBX = charKey.startsWith('anim_')

    if (isFBX) {
      // FBX models stored at 1x (already ~180 units). Scale to visible pedestrian size.
      const targetH = isPlayer ? 1.8 : 1.5
      hModel.scale.setScalar(targetH / 180)
      hModel.position.y = 0
    } else {
      // GLB characters loaded at 4.5x, scale down to visible size
      const loadScale = 4.5;
      const targetScale = isPlayer ? 1.5 : 1.2;
      hModel.scale.set(targetScale / loadScale, targetScale / loadScale, targetScale / loadScale);
      hModel.position.y = 0;
    }

    // Ensure all meshes in cloned model render properly
    hModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = !isPlayer;
        child.receiveShadow = true;
        child.frustumCulled = false;
        // Ensure material is visible
        if (child.material) {
          child.material.opacity = 1;
          child.material.transparent = false;
        }
      }
    });

    // Add invisible hitbox for collisions
    const hbGeo = new THREE.BoxGeometry(0.8, 2.0, 0.8)
    const hbMat = new THREE.MeshBasicMaterial({ visible: false })
    const hb = new THREE.Mesh(hbGeo, hbMat)
    hb.position.y = 1.0

    g.add(hModel)
    g.add(hb)

    // Find legs in the model for animation - look for child groups with leg-like names
    let lLeg = null, rLeg = null;
    hModel.traverse((child) => {
      if (child.isGroup) {
        const name = child.name.toLowerCase();
        if (name.includes('leg') || name.includes('left')) lLeg = child;
        if (name.includes('leg') || name.includes('right')) rLeg = child;
      }
    });

    // GLB model already has full body — no procedural legs needed
    // Walk animation uses lLeg/rLeg userData if found
    g.userData = { lLeg: lLeg, rLeg: rLeg, t: Math.random() * 10, spd: 1.5 + Math.random(), dir: Math.random() > 0.5 ? 1 : -1, startZ: 0 }

    // FBX animated characters: set up AnimationMixer for idle/run clips
    if (isFBX && hModel.animations && hModel.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(hModel)
      // Prefer 'idle' or first clip
      const idleClip = hModel.animations.find(c => c.name.toLowerCase().includes('idle')) || hModel.animations[0]
      const runClip = hModel.animations.find(c => c.name.toLowerCase().includes('run') || c.name.toLowerCase().includes('walk'))
      const idleAction = mixer.clipAction(idleClip)
      idleAction.play()
      let runAction = null
      if (runClip) { runAction = mixer.clipAction(runClip); runAction.setEffectiveWeight(0); runAction.play() }
      g.userData.mixer = mixer
      g.userData.idleAction = idleAction
      g.userData.runAction = runAction
      g.userData.isFBXAnimated = true
    }

    return g
  }

  // Fallback
  const skins = [0xe0ac69, 0x8d5524, 0xc68642, 0xf1c27d, 0xffdbac]
  const sColor = isPlayer ? 0xc68642 : skins[Math.floor(Math.random() * skins.length)]
  const shColor = isPlayer ? 0xe74c3c : Math.random() * 0xffffff
  const pColor = isPlayer ? 0x2980b9 : [0x333333, 0x111111, 0x555555, 0x4a2311][Math.floor(Math.random() * 4)]

  const scale = isPlayer ? 1.1 : 1.0

  const skin = new THREE.MeshToonMaterial({ color: sColor })
  const shirt = new THREE.MeshToonMaterial({ color: shColor })
  const pants = new THREE.MeshToonMaterial({ color: pColor })

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.4 * scale, 0.4 * scale), skin)
  head.position.y = 1.8 * scale
  g.add(head)

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.1 * scale, 0.42 * scale), new THREE.MeshToonMaterial({ color: 0x111111 }))
  hair.position.y = 2.0 * scale
  g.add(hair)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 0.7 * scale, 0.3 * scale), shirt)
  torso.position.y = 1.25 * scale
  g.add(torso)

  if (isPlayer) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.2), new THREE.MeshToonMaterial({ color: 0xf39c12 }))
    bag.position.set(0, 1.25 * scale, -0.2)
    g.add(bag)
  }

  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.9 * scale, 0.25 * scale), pants)
  lLeg.position.set(-0.15 * scale, 0.45 * scale, 0)
  g.add(lLeg)
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.9 * scale, 0.25 * scale), pants)
  rLeg.position.set(0.15 * scale, 0.45 * scale, 0)
  g.add(rLeg)

  const shoeM = new THREE.MeshToonMaterial({ color: 0x111111 })
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26 * scale, 0.1 * scale, 0.3 * scale), shoeM)
  lShoe.position.set(-0.15 * scale, 0.05 * scale, 0.05)
  g.add(lShoe)
  const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26 * scale, 0.1 * scale, 0.3 * scale), shoeM)
  rShoe.position.set(0.15 * scale, 0.05 * scale, 0.05)
  g.add(rShoe)

  g.userData = { lLeg, rLeg, t: Math.random() * 10, spd: 1.5 + Math.random(), dir: Math.random() > 0.5 ? 1 : -1, startZ: 0 }
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
    getStartedBtn.innerHTML = user ? 'Start Academy <span class="btn-arrow">→</span>' : 'Get Started <span class="btn-arrow">→</span>'
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
