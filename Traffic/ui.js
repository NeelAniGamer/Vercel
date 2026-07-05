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
      thunder: { f: 55, ty: 'sawtooth', d: 0.6, v: 0.15 }
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
const ui = {
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
    if (!S) S = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000 }
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

    Object.values(cats).forEach((cat) => {
      if (cat.levels.length === 0) return

      const hdr = document.createElement('div')
      hdr.className = 'category-header'
      hdr.textContent = cat.title
      wrap.appendChild(hdr)

      const grid = document.createElement('div')
      grid.className = 'category-grid'
      wrap.appendChild(grid)

      cat.levels.forEach((lv, idx) => {
        const done = S.comp[lv.id]
        const started = S.started && S.started[lv.id]
        const statusClass = done ? ' syl-done' : started ? ' syl-started' : ''
        const div = document.createElement('div')
        div.className = 'syl-item' + statusClass
        const badgeText = done ? '✓ Completed' : started ? '● Started' : '○ Not Started'
        const badgeColor = done ? '#00f0cc' : started ? '#5ed4f5' : 'rgba(184,155,255,0.5)'
        const cleanName = lv.name.replace(/^Lesson\s+\d+\s*[-–]\s*/i, '')
        // Check if a 2D scenario exists for this level
        const s2dSc = (typeof SCENARIOS !== 'undefined') ? SCENARIOS.find(s => s.levelRef === lv.id) : null
        const s2dDone = s2dSc && S.scenario2d && S.scenario2d[`s${s2dSc.id}_done`]
        const s2dStars = s2dDone ? (S.scenario2d[`s${s2dSc.id}_stars`] || 1) : 0
        const s2dBadge = s2dSc ? (s2dDone ? '⭐'.repeat(s2dStars) + ' Completed' : '🎮 Play 2D') : ''
        div.innerHTML = `
                  <div class="syl-ck"></div>
                  <div class="syl-top">
                    <span class="syl-icon">${lv.icon}</span>
                    <span class="syl-num">Level ${lv.id}</span>
                  </div>
                  <div class="syl-info">
                    <div class="syl-lbl">${cleanName}</div>
                    <div class="syl-sub">${lv.ds}</div>
                    <div class="syl-badge" style="background:${badgeColor}18;color:${badgeColor};border:1px solid ${badgeColor}30">${badgeText}</div>
                    ${s2dSc ? `<button class="play2d-btn${s2dDone ? '' : ''}" onclick="event.stopPropagation();ui.show2D(${s2dSc.id})">${s2dBadge}</button>` : ''}
                  </div>
                `
        div.style.animationDelay = `${idx * 0.08}s`
        div.onclick = () => {
          ui.showBriefing(lv.id)
        }
        grid.appendChild(div)
      })
    })
  },
  showLevels() {
    if (window.location.pathname.toLowerCase().includes('driving')) {
      window.location.href = 'Academy.html?screen=levels'
      return
    }
    this.show('screen-levels')
    this._buildSylList()
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
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">COMPLETED LEVELS</div>
                    <div style="font-weight:700;color:var(--accent);">${Object.keys(S.comp).length}/52</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">STARTED LEVELS</div>
                    <div style="font-weight:700;color:#5ed4f5;">${startedCount}/52</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">TOTAL WALLET</div>
                    <div style="font-weight:700;color:#2ecc71;">₹${S.wallet || 0}</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">TOTAL BADGES</div>
                    <div style="font-weight:700;color:#9b59b6;">${S.badges ? S.badges.length : 0}</div>
                </div>
            `
    }

    const bgrid = document.getElementById('bgrid')
    if (bgrid && typeof BADGES !== 'undefined') {
      let bHtml = ''
      BADGES.forEach((b) => {
        const has = S.badges && S.badges.includes(b.id)
        bHtml += `
                    <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid ${has ? '#ffd54a' : '#eee'};text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.05);filter:${has ? 'none' : 'grayscale(1)'};opacity:${has ? '1' : '0.5'};${has ? 'cursor:pointer;' : ''}" ${has ? `onclick="ui.showCert('${b.id}')"` : ''}>
                        <div style="font-size:3rem;margin-bottom:10px;">${b.icon}</div>
                        <div style="font-weight:700;margin-bottom:6px;color:#2c3e50;">${b.name}</div>
                        <div style="font-size:0.85rem;color:#666;">${b.desc}</div>
                        ${has ? `<div style="margin-top:12px; font-size:0.75rem; color:#ffd54a; font-weight:bold; text-transform:uppercase;">Click to view Certificate</div>` : ''}
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
        const c = document.createElement('div')
        c.className = 'lcard' + (cm ? ' done' : '') + (un ? '' : ' lk')
        c.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="font-family:'Lora', serif; font-size:1.3rem; font-weight:600; color:#111827; margin-bottom:10px; line-height:1.2;">
                        ${lv.icon || ''} Level ${lv.id}: ${lv.name}
                    </div>
                    <div style="width:22px; height:22px; border:2px solid ${cm ? '#34D399' : 'rgba(0,0,0,0.1)'}; border-radius:6px; display:flex; align-items:center; justify-content:center; background:${cm ? '#34D399' : 'transparent'}; flex-shrink:0; margin-left:12px;">
                        ${cm ? '<span style="color:white; font-size:14px;">✔</span>' : ''}
                    </div>
                </div>
                <div style="font-size:0.9rem; color:#64748B; line-height:1.5;">${lv.ds || ''}</div>
                <div style="margin-top:12px; font-size:0.8rem; font-weight:600; color:var(--accent); text-transform:uppercase; letter-spacing:0.05em;">${un ? (cm ? '✔ Completed' : '▶ Start Module') : '🔒 Locked'}</div>
            `
        if (un) {
          c.onclick = () => this.showBriefing(lv.id)
        }
        tr.appendChild(c)
      })
      body.appendChild(tr)
    })
  },
  showBriefing(lid) {
    const lv = LVS.find((l) => l.id === lid)
    this.cur = lv
    if (!S.started) S.started = {}
    if (!S.started[lv.id]) {
      S.started[lv.id] = Date.now()
      save()
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
          return `<button class="btn" style="flex:1; min-width:0; text-transform:capitalize; background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.08); color:var(--text, #111827); font-weight:700; padding:12px 8px; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:6px;" onclick="ui.showQuiz('${m}')"><span style="font-size:1.5rem;">${icons[m] || '🚗'}</span><span style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px;">${m}</span></button>`
        })
        .join('')
      const finalBtn = `<button class="btn" style="background:var(--accent, #D97706); color:#fff; font-weight:bold; padding:12px 32px; border-radius:12px; box-shadow:0 4px 16px rgba(217,119,6,0.3);" onclick="ui.dispatchStart()">START MODULE &rarr;</button>`
      card.innerHTML = `<div class="bc-ttl">🎯 Practical Execution</div>
      <div style="display:flex; flex-direction:column; gap:32px; margin-bottom: 24px;">
        
        <!-- Top: Visual Tutorial -->
        <div style="position:relative; width:100%; border-radius:20px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.08); border:1px solid rgba(0,0,0,0.06); background:linear-gradient(135deg, rgba(243,242,235,0.95) 0%, rgba(255,255,255,0.85) 100%); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);">
          ${this._simAnim(lv)}
        </div>
        
        <!-- Bottom: Controls & Objective (2 columns) -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
          
          <!-- Controls -->
          <div style="background:rgba(255,255,255,0.6); backdrop-filter:blur(16px); border:1px solid rgba(0,0,0,0.06); padding:24px; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.04);">
            <div style="color:var(--text, #111827); font-size:1.1rem; font-weight:700; margin-bottom:20px; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:10px;">🕹️ How to Play</div>
            <div style="display:flex; flex-direction:column; gap:20px;">
               <div style="display:flex; align-items:center; gap:16px;">
                  <div style="display:flex; gap:6px;">
                    <div style="width:36px; height:36px; background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.08); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.9rem; color:var(--text, #111827);">W</div>
                    <div style="width:36px; height:36px; background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.08); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.9rem; color:var(--text, #111827);">A</div>
                    <div style="width:36px; height:36px; background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.08); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.9rem; color:var(--text, #111827);">S</div>
                    <div style="width:36px; height:36px; background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.08); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.9rem; color:var(--text, #111827);">D</div>
                  </div>
                  <div style="font-size:1rem; color:var(--muted2, #6B7280); font-weight:500;">Steer & Accelerate</div>
               </div>
               <div style="display:flex; align-items:center; gap:16px;">
                  <div style="width:auto; padding:0 20px; height:36px; background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.08); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.9rem; color:var(--text, #111827);">SPACE</div>
                  <div style="font-size:1rem; color:var(--muted2, #6B7280); font-weight:500;">Handbrake</div>
               </div>
            </div>
          </div>
          
          <!-- Objective -->
          <div class="pract-banner" style="background:linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(243,242,235,0.8) 100%); padding:28px; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.06); display:flex; flex-direction:column; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);">
            <div class="pract-icon-big" style="font-size:4rem;line-height:1;margin-bottom:16px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.08));">${lv.icon}</div>
            <div class="pv1" style="font-size:2rem;letter-spacing:0.02em;font-family:'Instrument Serif',serif;font-style:italic;font-weight:700; color:var(--accent, #D97706);margin-bottom:8px;">${lv.name}</div>
            <div style="font-size:1.15rem;color:var(--text, #111827);line-height:1.6;border-top:1px solid rgba(0,0,0,0.06);padding-top:16px;">${lv.pract}</div>
            <div style="font-size:0.95rem;color:var(--accent, #D97706);margin-top:auto;line-height:1.5;background:rgba(217,119,6,0.06);padding:12px;border-radius:12px; border-left:4px solid var(--accent, #D97706); margin-top: 24px;">📝 Note: A PERFECT drive (no violations/damage) is required to not get penalized on retry.</div>
          </div>
        </div>
        
        <!-- Penalty & Actions -->
        <div style="display:flex; flex-wrap:wrap; gap:24px; align-items:stretch;">
          <div style="flex:1; min-width:300px; background:rgba(255,255,255,0.6); backdrop-filter:blur(12px); padding:20px 24px; border-radius:20px; border:1px solid rgba(0,0,0,0.06); display:flex; justify-content:space-between; align-items:center; box-shadow:0 4px 20px rgba(0,0,0,0.04);">
            <div>
              <div style="font-size:0.8rem; color:var(--muted, #9CA3AF); text-transform:uppercase; font-weight:800; letter-spacing:0.05em; margin-bottom:8px;">Penalty Risk</div>
              <div style="font-size:1.1rem; color:var(--text, #111827); font-weight:700;">${lv.law.off}</div>
            </div>
            <div style="text-align:right; border-left:1px solid rgba(0,0,0,0.06); padding-left:24px;">
              <div style="font-size:0.8rem; color:var(--muted, #9CA3AF); text-transform:uppercase; font-weight:800; letter-spacing:0.05em; margin-bottom:8px;">Fine</div>
              <div style="font-family:'Bebas Neue',sans-serif; font-size:2rem; color:var(--red, #EF4444); line-height:1;">${lv.law.fine}</div>
            </div>
          </div>
          <div style="flex:1; min-width:300px; display:flex; flex-direction:column; justify-content:center; gap:12px;">
            <div style="font-size:0.8rem; color:var(--muted, #9CA3AF); text-transform:uppercase; font-weight:800; letter-spacing:0.05em;">Select Vehicle Mode</div>
            <div style="display:flex; gap:10px;">${btnsHTML}</div>
          </div>
        </div>
        
      </div>
      
      <!-- Launch -->
      <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(0,0,0,0.06); padding-top:20px;">
        <button class="btn btn-s" onclick="ui._selSyl('theory')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Previous</button>
        ${finalBtn}
      </div>`
    }
    c.appendChild(card)
    if (id === 'practical' && typeof THREE !== 'undefined') {
      requestAnimationFrame(() => this._initBriefingScene(lv))
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
  showQuiz(mode) {
    mode = mode || ui.curMode || 'car'
    let qs = this.cur.quiz && this.cur.quiz[mode] ? this.cur.quiz[mode] : this.cur.quiz ? this.cur.quiz.car : null
    if (!qs) {
      qs = [
        { q: `What is the primary rule for this scenario: ${this.cur.name}?`, o: [this.cur.law.sec, 'Speed up', 'Ignore signals', 'Honk loudly'], a: 0 },
        { q: `What is the penalty for ${this.cur.law.off}?`, o: [this.cur.law.fine, '₹100', 'No fine', 'Warning'], a: 0 },
        { q: `If you fail to follow ${this.cur.themeType.replace('_', ' ')} rules, what happens?`, o: ['Accidents and fines', 'Nothing', 'You get a reward', 'Traffic speeds up'], a: 0 }
      ]
      qs.forEach((q) => {
        const c = q.o[q.a]
        const rIdx = Math.floor(Math.random() * 4)
        q.o[q.a] = q.o[rIdx]
        q.o[rIdx] = c
        q.a = rIdx
      })
    }
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
      save()
      toast(`✅ ${s.mode.charAt(0).toUpperCase() + s.mode.slice(1)} quiz passed!`, '#00c851')
      if (window.location.pathname.toLowerCase().includes('driving')) {
        window.location.href = 'Academy.html'
      } else {
        window.location.href = `Driving.html?lv=${lv.id}&mode=${s.mode}`
      }
    }
  },
  showResults(score, stats) {
    const lv = this.cur,
      prev = S.comp[lv.id]?.score || 0
    S.comp[lv.id] = { ...S.comp[lv.id], score: Math.max(score, prev), time: Date.now(), finalQuiz: true }
    S.total += score
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
${stats.reward ? `<div class="rr"><span class="rl" style="color:#00c851">Level Reward</span><span class="rv" style="color:#00c851">+₹${stats.reward.toLocaleString('en-IN')}</span></div>` : ''}
${stats.fineAmt ? `<div class="rr"><span class="rl" style="color:#ff3b30">Fines Deducted</span><span class="rv" style="color:#ff3b30">-₹${stats.fineAmt.toLocaleString('en-IN')}</span></div>` : ''}
<div class="rr" style="margin-top:10px; border-top:1px solid #333; padding-top:10px;"><span class="rl">Career Wallet</span><span class="rv" style="color:#f1c40f">₹${S.wallet.toLocaleString('en-IN')}</span></div>`
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

  const chars = ['char_f_a', 'char_f_b', 'char_f_c', 'char_m_a', 'char_m_b', 'char_m_c']
  const charKey = chars[Math.floor(Math.random() * chars.length)]

  // Debug: Check if character models are loaded
  const charLoaded = window.PRELOADED_MODELS && window.PRELOADED_MODELS[charKey];
  if (!charLoaded) {
    console.log('[DEBUG] Character model not loaded:', charKey, 'Available:', Object.keys(window.PRELOADED_MODELS || {}).filter(k => k.startsWith('char')).join(', '));
  }

  if (charLoaded) {
    const hModel = window.PRELOADED_MODELS[charKey].clone()

    // Characters are loaded at 4.5x in start.js, now scale to visible size
    // Original GLB ~1 unit, loaded at 4.5, scale to ~1.2-1.5 visible
    const loadScale = 4.5;
    const targetScale = isPlayer ? 1.5 : 1.2;
    hModel.scale.set(targetScale / loadScale, targetScale / loadScale, targetScale / loadScale);
    hModel.position.y = 0;

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
  if (!user && window.colUser && window.colUser.user) {
    const meta = window.colUser.user.user_metadata || {}
    user = {
      name: meta.full_name || meta.name || 'Driver',
      email: window.colUser.user.email,
      avatar: meta.avatar_url
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

  const navBtn = document.getElementById('academy-sign-in-btn')
  if (navBtn) navBtn.style.display = user ? 'none' : 'block'

  if (user) {
    if (profileDiv) {
      profileDiv.style.display = 'flex'
      profileDiv.onclick = () => (window.location.href = 'TrafficDashboard.html')
    }

    if (userName) userName.textContent = user.name || 'Driver'
    if (initials && user.name) {
      initials.textContent = user.name.charAt(0).toUpperCase()
      initials.style.display = 'flex'
    }
    if (pfp && user.avatar) {
      pfp.src = user.avatar
      pfp.style.display = 'block'
      initials.style.display = 'none'
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
