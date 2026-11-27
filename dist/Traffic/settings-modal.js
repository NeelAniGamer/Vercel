/**
 * Traffic/settings-modal.js
 * Implements window.openSettingsModal() and window.closeSettingsModal().
 * Combines Driving/Graphics preferences, Learner Profile preferences (replacing TrafficSetup.html),
 * and Private Custom Database URL + Anon Key configuration using strict-CSP event listeners.
 */
;(function (global) {
  'use strict'

  const MODAL_ID = 'colSettingsModal'
  const SETTINGS_KEY = 'traffic_settings_v1'
  let activeTab = 'driving'

  function getSavedSettings() {
    let base = {
      vehicle: 'car',
      age: 18,
      language: 'en',
      displayName: '',
      quality: 'high',
      renderDistance: 520,
      soundEnabled: true,
      theme: (document.body && document.body.classList.contains('lm')) ? 'light' : 'dark'
    }
    try {
      const s = JSON.parse(global.localStorage.getItem(SETTINGS_KEY) || '{}')
      if (s && typeof s === 'object') base = Object.assign(base, s)
    } catch (_e) {}
    try {
      const mth = JSON.parse(global.localStorage.getItem('mth4') || '{}')
      if (mth && mth.preferredVehicle) base.vehicle = mth.preferredVehicle
    } catch (_e) {}
    try {
      const tlu = JSON.parse(global.localStorage.getItem('traffic_local_user') || '{}')
      if (tlu && tlu.language) base.language = tlu.language
      if (tlu && tlu.age) base.age = tlu.age
      if (tlu && tlu.name && !base.displayName) base.displayName = tlu.name
    } catch (_e) {}
    if (global.colUser) {
      if (global.colUser.name) base.displayName = global.colUser.name
      if (global.colUser.vehicle) base.vehicle = String(global.colUser.vehicle).toLowerCase()
    }
    return base
  }

  function applyTheme(theme) {
    const isLight = theme === 'light'
    document.documentElement.classList.toggle('lm', isLight)
    if (document.body) document.body.classList.toggle('lm', isLight)
    try {
      global.localStorage.setItem('theme', isLight ? 'light' : 'dark')
    } catch (_e) {}
    const sw = document.getElementById('theme-switch-btn')
    if (sw) sw.checked = !isLight
  }

  function saveSettings(next) {
    try {
      global.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      global.localStorage.setItem('traffic_quality', next.quality || 'high')
      global.localStorage.setItem('traffic_render_distance', String(next.renderDistance || 520))
      global.localStorage.setItem('traffic_sound', next.soundEnabled ? '1' : '0')
    } catch (_e) {}

    if (next.theme) applyTheme(next.theme)

    if (global.ProgressTracker && typeof global.ProgressTracker.updateSettings === 'function') {
      global.ProgressTracker.updateSettings(next)
    }
    if (global.colUser && global.supabaseClient) {
      global.supabaseClient
        .from('user_profiles')
        .update({
          preferred_vehicle: next.vehicle || 'car',
          age: Number(next.age) || 18,
          language: next.language || 'en',
          display_name: next.displayName || global.colUser.name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', global.colUser.id)
        .then(function () {}, function () {})
    }
    try {
      global.dispatchEvent(new CustomEvent('col-settings-changed', { detail: next }))
    } catch (_e) {}
  }

  function ensureStyles() {
    if (document.getElementById('col-settings-modal-styles')) return
    const st = document.createElement('style')
    st.id = 'col-settings-modal-styles'
    st.textContent = `
      .csm-backdrop { position: fixed; inset: 0; z-index: 9800; background: rgba(2, 6, 23, 0.72); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; padding: 16px; }
      .csm-backdrop.open { display: flex; }
      .csm-dialog { width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; background: #0f172a; color: #f8fafc; border: 1px solid rgba(148,163,184,0.22); box-shadow: 0 24px 60px rgba(0,0,0,0.45); font-family: system-ui, -apple-system, sans-serif; }
      body.lm .csm-dialog { background: #ffffff; color: #0f172a; border-color: #cbd5e1; box-shadow: 0 24px 60px rgba(15,23,42,0.18); }
      .csm-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid rgba(148,163,184,0.18); }
      body.lm .csm-head { border-bottom-color: #e2e8f0; }
      .csm-title { font-size: 1.12rem; font-weight: 800; display: flex; align-items: center; gap: 9px; margin: 0; }
      .csm-close { width: 34px; height: 34px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.25); background: transparent; color: inherit; cursor: pointer; font-size: 1.2rem; display: inline-flex; align-items: center; justify-content: center; }
      .csm-tabs { display: flex; gap: 6px; padding: 12px 22px 0; border-bottom: 1px solid rgba(148,163,184,0.16); overflow-x: auto; }
      body.lm .csm-tabs { border-bottom-color: #e2e8f0; }
      .csm-tab { padding: 9px 14px; border: none; background: transparent; color: #94a3b8; font-weight: 700; font-size: 0.85rem; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; }
      body.lm .csm-tab { color: #64748b; }
      .csm-tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
      body.lm .csm-tab.active { color: #b45309; border-bottom-color: #d97706; }
      .csm-body { padding: 20px 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
      .csm-field { display: flex; flex-direction: column; gap: 6px; }
      .csm-label { font-size: 0.82rem; font-weight: 700; color: #cbd5e1; }
      body.lm .csm-label { color: #334155; }
      .csm-help { font-size: 0.76rem; color: #94a3b8; line-height: 1.45; }
      body.lm .csm-help { color: #64748b; }
      .csm-input, .csm-select { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(148,163,184,0.3); background: #1e293b; color: #f8fafc; font-size: 0.9rem; box-sizing: border-box; }
      body.lm .csm-input, body.lm .csm-select { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
      .csm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (max-width: 520px) { .csm-row { grid-template-columns: 1fr; } }
      .csm-switch-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(148,163,184,0.2); background: rgba(148,163,184,0.06); }
      body.lm .csm-switch-row { border-color: #e2e8f0; background: #f8fafc; }
      .csm-btn-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
      .csm-btn { padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 0.86rem; cursor: pointer; border: 1px solid rgba(148,163,184,0.3); background: transparent; color: inherit; }
      .csm-btn-primary { background: #d97706; border-color: #d97706; color: #ffffff; }
      .csm-btn-danger { border-color: rgba(239,68,68,0.45); color: #ef4444; }
      .csm-status { padding: 10px 12px; border-radius: 10px; font-size: 0.82rem; font-weight: 600; display: none; }
      .csm-status.ok { display: block; background: rgba(16,185,129,0.14); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
      body.lm .csm-status.ok { color: #047857; }
      .csm-status.err { display: block; background: rgba(239,68,68,0.14); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      body.lm .csm-status.err { color: #b91c1c; }
      .csm-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid rgba(148,163,184,0.18); }
      body.lm .csm-foot { border-top-color: #e2e8f0; }
    `
    document.head.appendChild(st)
  }

  function escapeAttr(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function renderBody(backdrop) {
    const body = backdrop.querySelector('.csm-body')
    if (!body) return
    const cur = getSavedSettings()
    const isSignedIn = Boolean(global.colUser && !global.colUser.isCached)
    if (activeTab !== 'driving' && activeTab !== 'profile') activeTab = 'driving'

    backdrop.querySelectorAll('.csm-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-csm-tab') === activeTab)
    })

    if (activeTab === 'driving') {
      body.innerHTML = `
        <div class="csm-row">
          <div class="csm-field">
            <label class="csm-label" for="csm-vehicle">Preferred Vehicle</label>
            <select class="csm-select" id="csm-vehicle">
              <option value="car" ${cur.vehicle === 'car' ? 'selected' : ''}>Sedan / Car</option>
              <option value="bike" ${cur.vehicle === 'bike' ? 'selected' : ''}>Two-Wheeler / Bike</option>
              <option value="auto" ${cur.vehicle === 'auto' ? 'selected' : ''}>Auto-Rickshaw</option>
              <option value="bus" ${cur.vehicle === 'bus' ? 'selected' : ''}>BEST Bus</option>
              <option value="truck" ${cur.vehicle === 'truck' ? 'selected' : ''}>Heavy Truck</option>
            </select>
          </div>
          <div class="csm-field">
            <label class="csm-label" for="csm-quality">3D Graphics Preset</label>
            <select class="csm-select" id="csm-quality">
              <option value="low" ${cur.quality === 'low' ? 'selected' : ''}>Performance (Battery Saver)</option>
              <option value="medium" ${cur.quality === 'medium' ? 'selected' : ''}>Balanced</option>
              <option value="high" ${cur.quality === 'high' ? 'selected' : ''}>High Detail</option>
              <option value="ultra" ${cur.quality === 'ultra' ? 'selected' : ''}>Ultra (Desktop GPU)</option>
            </select>
          </div>
        </div>
        <div class="csm-field">
          <label class="csm-label" for="csm-render-dist">3D Render Distance: <span id="csm-dist-val">${Number(cur.renderDistance) || 520}m</span></label>
          <input type="range" id="csm-render-dist" min="240" max="1000" step="40" value="${Number(cur.renderDistance) || 520}" />
          <div class="csm-help">Higher distance reveals Mumbai landmarks earlier; lower distance boosts frame rate on mobile.</div>
        </div>
        <div class="csm-switch-row">
          <div>
            <div class="csm-label">Sound Effects &amp; Engine Audio</div>
            <div class="csm-help">Plays subtle turn-signal, horn, and completion feedback.</div>
          </div>
          <input type="checkbox" id="csm-sound" ${cur.soundEnabled !== false ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;" />
        </div>
        <div class="csm-switch-row">
          <div>
            <div class="csm-label">Appearance Mode</div>
            <div class="csm-help">Switch between high-contrast Light and Dark themes.</div>
          </div>
          <select class="csm-select" id="csm-theme" style="width:130px;">
            <option value="light" ${cur.theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="dark" ${cur.theme !== 'light' ? 'selected' : ''}>Dark</option>
          </select>
        </div>
      `
      const dist = body.querySelector('#csm-render-dist')
      const distVal = body.querySelector('#csm-dist-val')
      if (dist && distVal) {
        dist.addEventListener('input', function () {
          distVal.textContent = dist.value + 'm'
        })
      }
      return
    }

    body.innerHTML = `
      <div class="csm-field">
        <label class="csm-label" for="csm-name">Display Name</label>
        <input type="text" class="csm-input" id="csm-name" maxlength="40" value="${escapeAttr(cur.displayName || '')}" placeholder="Your name on certificates & leaderboard" />
      </div>
      <div class="csm-row">
        <div class="csm-field">
          <label class="csm-label" for="csm-age">Age Group</label>
          <select class="csm-select" id="csm-age">
            <option value="14" ${Number(cur.age) < 18 ? 'selected' : ''}>Under 18 (Student Learner)</option>
            <option value="22" ${Number(cur.age) >= 18 && Number(cur.age) < 26 ? 'selected' : ''}>18–25 (Young Driver)</option>
            <option value="32" ${Number(cur.age) >= 26 && Number(cur.age) < 46 ? 'selected' : ''}>26–45 (Commuter)</option>
            <option value="50" ${Number(cur.age) >= 46 ? 'selected' : ''}>46+ (Experienced)</option>
          </select>
        </div>
        <div class="csm-field">
          <label class="csm-label" for="csm-lang">Briefing Language</label>
          <select class="csm-select" id="csm-lang">
            <option value="en" ${cur.language !== 'hi' ? 'selected' : ''}>English</option>
            <option value="hi" ${cur.language === 'hi' ? 'selected' : ''}>Hindi (हिन्दी)</option>
          </select>
        </div>
      </div>
      <div class="csm-switch-row">
        <div>
          <div class="csm-label">Account &amp; Cloud Sync</div>
          <div class="csm-help">${isSignedIn ? 'Signed in as ' + escapeAttr(global.colUser.email || global.colUser.name) + '. Progress is saved privately to your account.' : 'Sign in with Google or Email to save progress privately to your account across devices.'}</div>
        </div>
        <button type="button" class="csm-btn csm-btn-primary" data-csm-action="open-auth">${isSignedIn ? 'Account' : 'Sign In'}</button>
      </div>
    `
  }

  function readActiveFormIntoSettings(backdrop) {
    const cur = getSavedSettings()
    const v = backdrop.querySelector('#csm-vehicle')
    const q = backdrop.querySelector('#csm-quality')
    const d = backdrop.querySelector('#csm-render-dist')
    const s = backdrop.querySelector('#csm-sound')
    const t = backdrop.querySelector('#csm-theme')
    const n = backdrop.querySelector('#csm-name')
    const a = backdrop.querySelector('#csm-age')
    const l = backdrop.querySelector('#csm-lang')
    if (v) cur.vehicle = v.value
    if (q) cur.quality = q.value
    if (d) cur.renderDistance = Number(d.value) || 520
    if (s) cur.soundEnabled = Boolean(s.checked)
    if (t) cur.theme = t.value
    if (n) cur.displayName = n.value.trim()
    if (a) cur.age = Number(a.value) || 18
    if (l) cur.language = l.value
    return cur
  }

  function ensureModal() {
    ensureStyles()
    let backdrop = document.getElementById(MODAL_ID)
    if (backdrop) return backdrop

    backdrop = document.createElement('div')
    backdrop.id = MODAL_ID
    backdrop.className = 'csm-backdrop'
    backdrop.setAttribute('role', 'dialog')
    backdrop.setAttribute('aria-modal', 'true')
    backdrop.setAttribute('aria-labelledby', 'csm-heading')
    const iconSvg = global.TrafficIcons ? global.TrafficIcons.svg('settings', 18) : ''

    backdrop.innerHTML = `
      <div class="csm-dialog">
        <div class="csm-head">
          <h2 class="csm-title" id="csm-heading">${iconSvg}<span>Academy &amp; Game Settings</span></h2>
          <button type="button" class="csm-close" data-csm-action="close" aria-label="Close settings">&times;</button>
        </div>
        <div class="csm-tabs" role="tablist">
          <button type="button" class="csm-tab active" data-csm-tab="driving" role="tab">Driving &amp; Graphics</button>
          <button type="button" class="csm-tab" data-csm-tab="profile" role="tab">Learner Preferences</button>
        </div>
        <div class="csm-body"></div>
        <div class="csm-foot">
          <button type="button" class="csm-btn" data-csm-action="close">Cancel</button>
          <button type="button" class="csm-btn csm-btn-primary" data-csm-action="save-close">Save Settings</button>
        </div>
      </div>
    `

    backdrop.addEventListener('click', async function (e) {
      if (e.target === backdrop) {
        closeSettingsModal()
        return
      }
      const tabBtn = e.target.closest('[data-csm-tab]')
      if (tabBtn) {
        saveSettings(readActiveFormIntoSettings(backdrop))
        activeTab = tabBtn.getAttribute('data-csm-tab') || 'driving'
        renderBody(backdrop)
        return
      }
      const actBtn = e.target.closest('[data-csm-action]')
      if (!actBtn) return
      const act = actBtn.getAttribute('data-csm-action')
      if (act === 'close') {
        closeSettingsModal()
      } else if (act === 'save-close') {
        saveSettings(readActiveFormIntoSettings(backdrop))
        if (typeof global.toast === 'function') global.toast('Settings saved.', '#10b981')
        closeSettingsModal()
      } else if (act === 'open-auth') {
        closeSettingsModal()
        if (typeof global.openGlobalLogin === 'function') global.openGlobalLogin()
        else if (typeof global.openLogin === 'function') global.openLogin()
      }
    })

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('open')) {
        closeSettingsModal()
      }
    })

    document.body.appendChild(backdrop)
    return backdrop
  }

  function openSettingsModal(tab) {
    if (tab && typeof tab === 'string') activeTab = tab
    const backdrop = ensureModal()
    renderBody(backdrop)
    backdrop.classList.add('open')
  }

  function closeSettingsModal() {
    const backdrop = document.getElementById(MODAL_ID)
    if (backdrop) backdrop.classList.remove('open')
  }

  global.openSettingsModal = openSettingsModal
  global.closeSettingsModal = closeSettingsModal
  global.TrafficSettings = {
    open: openSettingsModal,
    close: closeSettingsModal,
    get: getSavedSettings,
    save: saveSettings
  }
})(typeof window !== 'undefined' ? window : globalThis)
