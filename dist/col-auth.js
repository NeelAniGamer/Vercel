// Class Of Learners Global Authentication System (Supabase)

// Supabase client - must be at top to avoid temporal dead zone
let supabaseClient = null

// --- Shared Login Modal Injection ---
// Injects the standard loginMo modal if the page doesn't already have one inline.
function injectLoginModal() {
  if (document.getElementById('loginMo')) return
  const mo = document.createElement('div')
  mo.className = 'col-auth-mo'
  mo.id = 'loginMo'
  mo.innerHTML =
    '<div class="col-auth-md"><div class="col-auth-hd"><h2 id="moAuthTitle">Authenticate</h2><p id="moAuthSub">Unlock dashboard storage and cloud sync.</p></div><div class="col-auth-body"><div id="loggedOutPanel" style="display:flex; justify-content:center; align-items:center; width:100%; margin-bottom:15px;"><div id="gSignInBtnContainer" style="width:100%; display:flex; justify-content:center;"></div></div><div id="loggedInPanel" style="display: none;"><label style="display:block; margin-bottom:5px; color:var(--dim, #8891AA); font-size:0.85rem; text-align:left;">Google Email</label><input class="col-auth-inp" id="miEmail" type="email" readonly style="opacity: 0.5; cursor: not-allowed; margin-bottom: 20px;"><label style="display:block; margin-bottom:5px; color:var(--dim, #8891AA); font-size:0.85rem; text-align:left;">Display Username</label><input class="col-auth-inp" id="miName" type="text" placeholder="Choose a username..." maxlength="40" style="margin-bottom: 20px;"><button class="col-auth-btn" style="margin-bottom: 10px;" onclick="updateUsername()">Save Username</button><button class="col-auth-danger" onclick="doLogout()">Disconnect Account</button></div><button class="col-auth-btn" style="margin-top: 10px; background: transparent; color: var(--dim, #8891AA); border: 1px solid var(--line, rgba(255,255,255,.08));" onclick="closeMo()">Close / Cancel</button></div></div>'
  document.body.appendChild(mo)
  mo.addEventListener('click', function (e) {
    if (e.target === this) closeMo()
  })
}

// Compatibility bridge: expose openLogin/closeMo globally so page onclick handlers work
// even before the page's own inline scripts define them.
if (!window.openLogin) {
  window.openLogin = function () {
    // Redirect to TrafficSetup for global authentication
    var path = window.location.pathname;
    if (path.includes('TrafficSetup.html')) {
      var authArea = document.getElementById('authArea');
      if (authArea) authArea.scrollIntoView({ behavior: 'smooth' });
    } else if (path.includes('/Traffic/')) {
      window.location.href = 'TrafficSetup.html';
    } else {
      window.location.href = 'Traffic/TrafficSetup.html';
    }
  }
}
if (!window.closeMo) {
  window.closeMo = function () {
    var mo = document.getElementById('loginMo')
    if (mo) mo.classList.remove('open')
  }
}

;(async function () {
  if (window._colAuthRunning) return
  window._colAuthRunning = true

  // --- Local Account Storage Utilities ---
  function getLocalAccounts() {
    try {
      const raw = localStorage.getItem('col_local_accounts')
      const list = raw ? JSON.parse(raw) : []
      const trafficRaw = localStorage.getItem('traffic_local_user')
      if (trafficRaw) {
        const tu = JSON.parse(trafficRaw)
        if (tu && (tu.name || tu.username)) {
          const exists = list.some(a => (tu.username && a.username === tu.username) || (tu.name && a.name === tu.name))
          if (!exists) {
            list.push({
              id: tu.id || ('local_' + Date.now()),
              name: tu.name || tu.username,
              username: tu.username || ('@' + (tu.name || 'driver').toLowerCase().replace(/\s+/g, '')),
              email: tu.email || '',
              pin: tu.pin || tu.password || '',
              password: tu.pin || tu.password || '',
              role: tu.role || 'student',
              vehicle: tu.vehicle || 'Car',
              age: tu.age || 18,
              language: tu.language || 'en',
              createdAt: tu.createdAt || new Date().toISOString()
            })
            localStorage.setItem('col_local_accounts', JSON.stringify(list))
          }
        }
      }
      return list
    } catch (e) {
      return []
    }
  }

  function saveLocalAccount(acc) {
    try {
      const list = getLocalAccounts()
      const normUname = (acc.username || '').toLowerCase()
      const normEmail = (acc.email || '').toLowerCase()
      const idx = list.findIndex(a => 
        (normUname && (a.username || '').toLowerCase() === normUname) ||
        (normEmail && (a.email || '').toLowerCase() === normEmail) ||
        (acc.id && a.id === acc.id)
      )
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...acc }
      } else {
        list.push(acc)
      }
      localStorage.setItem('col_local_accounts', JSON.stringify(list))
    } catch (e) {
      console.warn('[col-auth] Could not save local account:', e)
    }
  }

  function getActiveLocalUser() {
    try {
      let raw = localStorage.getItem('col_active_local_user')
      if (!raw) {
        raw = localStorage.getItem('traffic_local_user')
      }
      if (!raw) return null
      const u = JSON.parse(raw)
      if (!u || (!u.name && !u.username)) return null
      return {
        id: u.id || ('local_' + (u.username || u.name).replace(/[^a-zA-Z0-9_]/g, '')),
        name: u.name || u.username,
        email: u.email || (u.username ? (u.username.replace('@','') + '@local.col') : 'local@col.io'),
        username: u.username || ('@' + (u.name || 'user').toLowerCase().replace(/\s+/g, '')),
        picture: u.picture || u.avatar || null,
        isLocal: true,
        user_metadata: {
          full_name: u.name || u.username,
          name: u.name || u.username,
          role: u.role || 'student',
          preferred_vehicle: u.vehicle || 'Car'
        }
      }
    } catch (e) {
      return null
    }
  }

  function setActiveLocalUser(acc) {
    try {
      const fullAcc = {
        id: acc.id || ('local_' + Date.now()),
        name: acc.name || acc.username,
        username: acc.username || ('@' + (acc.name || 'user').toLowerCase().replace(/\s+/g, '')),
        email: acc.email || '',
        pin: acc.pin || acc.password || '',
        password: acc.pin || acc.password || '',
        role: acc.role || 'student',
        vehicle: acc.vehicle || 'Car',
        age: acc.age || 18,
        language: acc.language || 'en',
        updatedAt: new Date().toISOString()
      }
      saveLocalAccount(fullAcc)
      localStorage.setItem('col_active_local_user', JSON.stringify(fullAcc))
      localStorage.setItem('traffic_local_user', JSON.stringify(fullAcc))
      localStorage.setItem('trafficSetupComplete', 'true')
      window.colUser = {
        id: fullAcc.id,
        name: fullAcc.name,
        email: fullAcc.email || (fullAcc.username.replace('@','') + '@local.col'),
        username: fullAcc.username,
        picture: fullAcc.picture || null,
        isLocal: true,
        user_metadata: {
          full_name: fullAcc.name,
          name: fullAcc.name,
          role: fullAcc.role,
          preferred_vehicle: fullAcc.vehicle
        }
      }
    } catch (e) {
      console.warn('[col-auth] Could not set active local user:', e)
    }
  }

  function clearActiveLocalUser() {
    try {
      localStorage.removeItem('col_active_local_user')
      localStorage.removeItem('traffic_local_user')
      localStorage.removeItem('trafficSetupComplete')
      window.colUser = null
    } catch (e) {}
  }

  // Hydrate only from verified live session cache if present
  try {
    const cachedLive = localStorage.getItem('col_user')
    if (cachedLive) {
      const parsed = JSON.parse(cachedLive)
      if (parsed && parsed.id && parsed.email) {
        window.colUser = parsed
      }
    }
  } catch (e) {}

  // Expose local auth utilities for sub-apps
  window.colGetLocalAccounts = getLocalAccounts
  window.colSaveLocalAccount = saveLocalAccount
  window.colGetActiveLocalUser = getActiveLocalUser
  window.colSetActiveLocalUser = setActiveLocalUser
  window.colClearActiveLocalUser = clearActiveLocalUser

  // 1. Fetch Global Configuration to get Supabase Keys (root-absolute so /Traffic/* pages resolve)
  let authConfig = null
  try {
    const res = await fetch('/config.json?t=' + new Date().getTime())
    if (res.ok) {
      const config = await res.json()
      if (config.auth && config.auth.url && config.auth.key) {
        authConfig = config.auth
      }
    }
  } catch (e) {
    console.warn('[col-auth] Could not load config.json — authentication disabled.')
  }

  // 2. Load Supabase SDK if keys exist
  if (authConfig) {
    if (typeof supabase === 'undefined') {
      if (!document.querySelector('script[src*="@supabase"]')) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
        script.onload = () => initSupabase(authConfig.url, authConfig.key)
        document.head.appendChild(script)
      } else {
        // Script is loading, wait for it
        document.querySelector('script[src*="@supabase"]').addEventListener('load', () => initSupabase(authConfig.url, authConfig.key))
      }
    } else {
      initSupabase(authConfig.url, authConfig.key)
    }
  } else {
    const localUser = getActiveLocalUser()
    window.colUser = localUser || null
    dispatchAuthEvent()
  }

  window.handleGoogleOneTap = async (response) => {
    if (!window.supabaseClient) return
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential
      })
      if (error) throw error
    } catch (error) {
      console.error('One Tap Sign-in error:', error.message)
    }
  }

  function initOneTap() {
    if (window.colUser) return
    if (typeof google === 'undefined' || !google.accounts) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => setupOneTap()
      document.head.appendChild(script)
    } else {
      setupOneTap()
    }
  }

  function setupOneTap() {
    if (window.colUser) return
    // Don't show One Tap on Driving.html levels screen or briefing screen
    const path = window.location.pathname.toLowerCase()
    if (path.includes('driving') && (new URLSearchParams(window.location.search).get('screen') === 'levels' || new URLSearchParams(window.location.search).get('lv'))) {
      return
    }
    google.accounts.id.initialize({
      client_id: '500448449044-hv2rp3k0lsok9ara1bred87c75lnsp7l.apps.googleusercontent.com',
      callback: window.handleGoogleOneTap,
      use_fedcm_for_prompt: false,
      itp_support: true
    })
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        console.log('One tap not displayed: ', notification.getNotDisplayedReason())
      } else if (notification.isSkippedMoment()) {
        console.log('One tap skipped: ', notification.getSkippedReason())
      } else if (notification.isDismissedMoment()) {
        console.log('One tap dismissed: ', notification.getDismissedReason())
      }
    })

    // Re-render button if modal is open
    var container = document.getElementById('gSignInBtnContainer')
    if (container && !window.AndroidBridge) {
      container.innerHTML = ''
      google.accounts.id.renderButton(container, { theme: 'filled_black', size: 'large', type: 'standard', shape: 'rectangular', width: 280 })
    }
  }

  function initSupabase(url, key) {
    supabaseClient = window.supabase.createClient(url, key)
    window.supabaseClient = supabaseClient

    // Listen for Auth changes
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        const meta = session.user.user_metadata || {}
        const identities = session.user.identities || []
        const googleIdentity = identities.find(id => id.provider === 'google')
        const googleData = (googleIdentity && googleIdentity.identity_data) || {}
        const userId = session.user.id
        const email = session.user.email
        const photo = meta.avatar_url || meta.picture || googleData.avatar_url || googleData.picture || null
        const displayName = meta.full_name || meta.name || googleData.full_name || googleData.name || (email ? email.split('@')[0] : 'User')

        window.colUser = {
          id: userId,
          email: email,
          name: displayName,
          picture: photo,
          session: session,
          uid: null // Default until profile is fetched
        }

        try {
          const { data: upProfile } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

          if (upProfile) {
            window.colUser.uid = upProfile.id || upProfile.user_id
            if (upProfile.display_name) window.colUser.name = upProfile.display_name
            if (upProfile.avatar_url && !window.colUser.picture) {
              window.colUser.picture = upProfile.avatar_url
            }
          } else {
            const { data: profile, error } = await supabaseClient
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle()

            if (error && error.code !== 'PGRST116') throw error

            if (profile) {
              window.colUser.uid = profile.id
              if (profile.username && !meta.full_name) window.colUser.name = profile.username
              if (profile.avatar_url && !window.colUser.picture) {
                window.colUser.picture = profile.avatar_url
              }
            } else {
              promptForUsername()
            }
          }
        } catch (e) {
          console.error('[col-auth] Profile sync error:', e)
        }

        try {
          localStorage.setItem('col_user', JSON.stringify({
            id: window.colUser.id,
            email: window.colUser.email,
            name: window.colUser.name,
            picture: window.colUser.picture,
            uid: window.colUser.uid
          }))
        } catch (e) {}
      } else {
        try {
          localStorage.removeItem('col_user')
        } catch (e) {}
        window.colUser = null
      }
      dispatchAuthEvent()
      updateAuthUI()

      if (!session && !window.colUser && !window._oneTapAttempted && (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT')) {
        window._oneTapAttempted = true
        if (event === 'INITIAL_SESSION') {
          initOneTap()
        }
      }
    })

    injectAuthStyles()
    injectAuthUI()

    // If there's a custom handler provided by the page (like in qr.html to fetch drive data), fire it.
    dispatchAuthEvent()
  }

  function dispatchAuthEvent() {
    const event = new CustomEvent('col-auth-changed', { detail: { user: window.colUser } })
    window.dispatchEvent(event)
  }

  async function checkUsernameAvailability(rawUsername, currentUserId) {
    if (!rawUsername) return { available: false, error: 'Please Enter A Username.' }
    let clean = rawUsername.trim()
    if (!clean.startsWith('@')) clean = '@' + clean
    clean = '@' + clean.slice(1).replace(/[^a-zA-Z0-9_]/g, '')

    const namePart = clean.slice(1)
    if (namePart.length < 3) {
      return { available: false, error: 'Username Must Be At Least 3 Characters.', username: clean }
    }
    if (namePart.length > 30) {
      return { available: false, error: 'Username Cannot Exceed 30 Characters.', username: clean }
    }

    if (!supabaseClient) {
      return { available: true, username: clean }
    }

    try {
      // 1. Check profiles table
      const { data: profs, error: pErr } = await supabaseClient
        .from('profiles')
        .select('id, username')
        .ilike('username', clean)

      if (pErr) console.warn('[col-auth] profiles check notice:', pErr)
      const takenInProfiles = (profs || []).some(p => p.id !== currentUserId)

      if (takenInProfiles) {
        return {
          available: false,
          error: 'This Username Is Already Taken.',
          suggestions: generateUsernameSuggestions(namePart),
          username: clean
        }
      }

      // 2. Check user_profiles table
      const { data: upProfs, error: upErr } = await supabaseClient
        .from('user_profiles')
        .select('user_id, username')
        .ilike('username', clean)

      if (upErr) console.warn('[col-auth] user_profiles check notice:', upErr)
      const takenInUp = (upProfs || []).some(p => p.user_id !== currentUserId)

      if (takenInUp) {
        return {
          available: false,
          error: 'This Username Is Already Taken.',
          suggestions: generateUsernameSuggestions(namePart),
          username: clean
        }
      }

      return { available: true, username: clean }
    } catch (err) {
      console.warn('[col-auth] Availability check failed:', err)
      return { available: true, username: clean }
    }
  }

  function generateUsernameSuggestions(base) {
    const clean = (base || 'Learner').replace(/[^a-zA-Z0-9_]/g, '') || 'Learner'
    const rand = Math.floor(10 + Math.random() * 89)
    return [
      `@${clean}_${rand}`,
      `@${clean}_IND`,
      `@${clean}_2026`
    ]
  }

  let usernameCheckDebounce = null

  window._onUsernameInput = function (input) {
    if (!input) return
    let val = input.value
    if (!val.startsWith('@')) val = '@' + val.replace(/@/g, '')
    val = '@' + val.slice(1).replace(/[^a-zA-Z0-9_]/g, '')
    input.value = val

    const statusEl = document.getElementById('profileUsernameStatus')
    const suggBox = document.getElementById('profileSuggestionsBox')
    const suggList = document.getElementById('profileSuggestionsList')
    const errDiv = document.getElementById('profileCreateError')
    const btn = document.getElementById('profileCreateBtn')

    if (errDiv) errDiv.style.display = 'none'

    if (val.length <= 1) {
      if (statusEl) {
        statusEl.textContent = ''
        statusEl.style.color = 'var(--dim, #8891AA)'
      }
      if (suggBox) suggBox.style.display = 'none'
      if (btn) btn.disabled = true
      return
    }

    const namePart = val.slice(1)
    if (namePart.length < 3) {
      if (statusEl) {
        statusEl.textContent = 'Username Must Be At Least 3 Characters.'
        statusEl.style.color = 'var(--dim, #8891AA)'
      }
      if (suggBox) suggBox.style.display = 'none'
      if (btn) btn.disabled = true
      return
    }

    if (statusEl) {
      statusEl.textContent = 'Checking Availability...'
      statusEl.style.color = 'var(--dim, #8891AA)'
    }

    if (usernameCheckDebounce) clearTimeout(usernameCheckDebounce)
    usernameCheckDebounce = setTimeout(async () => {
      const currentId = window.colUser ? window.colUser.id : null
      const res = await checkUsernameAvailability(val, currentId)

      if (res.available) {
        if (statusEl) {
          statusEl.textContent = '✓ Username Available!'
          statusEl.style.color = '#10b981'
        }
        if (suggBox) suggBox.style.display = 'none'
        if (btn) btn.disabled = false
      } else {
        if (statusEl) {
          statusEl.textContent = '✕ ' + (res.error || 'Username Taken')
          statusEl.style.color = '#ef4444'
        }
        if (btn) btn.disabled = true
        if (res.suggestions && res.suggestions.length && suggBox && suggList) {
          suggList.innerHTML = res.suggestions.map(s => `
            <button type="button" class="col-uname-chip" onclick="window._pickUsernameSuggestion('${s}')">${s}</button>
          `).join('')
          suggBox.style.display = 'block'
        }
      }
    }, 280)
  }

  window._pickUsernameSuggestion = function (suggestion) {
    const input = document.getElementById('profileUsername') || document.getElementById('colSettingUsername')
    if (input) {
      input.value = suggestion
      if (typeof window._onUsernameInput === 'function') {
        window._onUsernameInput(input)
      }
      input.focus()
    }
  }

  async function createProfile(username) {
    const clean = username.trim()
    const displayName = window.colUser.name || clean.replace(/^@/, '')

    const { data, error } = await supabaseClient
      .from('profiles')
      .insert([{
        id: window.colUser.id,
        username: clean,
        full_name: displayName,
        email: window.colUser.email
      }])
    if (error) throw error

    try {
      await supabaseClient
        .from('user_profiles')
        .upsert({
          user_id: window.colUser.id,
          username: clean,
          display_name: displayName,
          full_name: displayName,
          email: window.colUser.email,
          avatar_url: window.colUser.picture,
          preferred_vehicle: window.colUser.vehicle || 'Car'
        }, { onConflict: 'user_id' })
    } catch (upErr) {
      console.warn('[col-auth] user_profiles sync notice on create:', upErr)
    }

    return data
  }

  function promptForUsername() {
    if (!document.getElementById('colAuthModal')) injectAuthUI()
    const body = document.getElementById('colAuthBody')
    if (!body) return

    const hd = document.querySelector('.col-auth-hd')
    if (hd) hd.style.display = 'none'

    body.innerHTML = `
      <div style="text-align:center; margin-bottom: 20px; margin-top: 10px; position: relative;">
        <button type="button" onclick="window.colDoLogout()" aria-label="Cancel" style="position: absolute; top: -10px; right: -10px; background: transparent; border: none; color: var(--dim, #8891AA); font-size: 1.5rem; cursor: pointer; padding: 4px;">&times;</button>
        <h3 style="font-family: var(--serif, 'Instrument Serif'); font-style: italic; font-size: 2.4rem; color: var(--signal, #F2B84B); margin-bottom: 8px; margin-top: 6px;">Welcome!</h3>
        <p style="color: var(--dim, #8891AA); font-size: 0.95rem; line-height: 1.4;">Please Choose A Unique Username To Complete Your Profile.</p>
      </div>
      <form onsubmit="window._handleProfileCreate(event)" style="display:flex; flex-direction:column; gap:12px;">
        <div style="position:relative;">
          <input type="text" id="profileUsername" class="col-auth-inp" placeholder="@username" value="@" oninput="window._onUsernameInput(this)" required maxlength="30" autocomplete="off" style="font-size: 1.1rem; text-align:center; padding: 14px; margin-bottom: 6px;">
          <div id="profileUsernameStatus" style="font-size: 0.85rem; font-weight: 600; text-align: center; min-height: 20px; transition: color 0.2s;"></div>
        </div>

        <div id="profileSuggestionsBox" style="display:none; text-align:center; margin-top: 2px; margin-bottom: 8px;">
          <span style="font-size: 0.8rem; color: var(--dim, #8891AA); display:block; margin-bottom: 6px;">Available Suggestions:</span>
          <div id="profileSuggestionsList" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;"></div>
        </div>

        <div id="profileCreateError" style="color: #ef4444; font-size: 0.85rem; margin-bottom: 8px; text-align: center; display: none; line-height: 1.4;"></div>

        <button type="submit" class="col-auth-btn" id="profileCreateBtn" style="padding: 14px; font-size: 1.05rem;">Create Profile</button>
      </form>
    `
    const modal = document.getElementById('colAuthModal')
    if (modal) {
      modal.classList.add('open')
      modal.removeAttribute('aria-hidden')
      modal.removeAttribute('inert')
    }
  }

  window._handleProfileCreate = async (e) => {
    if (e) e.preventDefault()
    const input = document.getElementById('profileUsername')
    let username = input ? input.value.trim() : ''
    if (!username.startsWith('@')) username = '@' + username
    username = '@' + username.slice(1).replace(/[^a-zA-Z0-9_]/g, '')

    const btn = document.getElementById('profileCreateBtn')
    const errDiv = document.getElementById('profileCreateError')
    const suggBox = document.getElementById('profileSuggestionsBox')
    const suggList = document.getElementById('profileSuggestionsList')

    if (username.slice(1).length < 3) {
      if (errDiv) {
        errDiv.textContent = 'Username Must Be At Least 3 Characters.'
        errDiv.style.display = 'block'
      }
      return
    }

    if (btn) {
      btn.textContent = 'Checking & Creating...'
      btn.disabled = true
    }
    if (errDiv) errDiv.style.display = 'none'

    try {
      // Final pre-flight check
      const currentId = window.colUser ? window.colUser.id : null
      const check = await checkUsernameAvailability(username, currentId)
      if (!check.available) {
        if (errDiv) {
          errDiv.textContent = 'This Username Is Already In Use. Please Pick A Different Handle Or Choose A Suggestion Below.'
          errDiv.style.display = 'block'
        }
        if (check.suggestions && check.suggestions.length && suggBox && suggList) {
          suggList.innerHTML = check.suggestions.map(s => `
            <button type="button" class="col-uname-chip" onclick="window._pickUsernameSuggestion('${s}')">${s}</button>
          `).join('')
          suggBox.style.display = 'block'
        }
        if (btn) {
          btn.textContent = 'Create Profile'
          btn.disabled = false
        }
        return
      }

      await createProfile(username)

      // Update colUser state
      window.colUser.uid = window.colUser.id
      window.colUser.username = username
      if (!window.colUser.name) window.colUser.name = username.replace(/^@/, '')

      try {
        localStorage.setItem('col_user', JSON.stringify({
          id: window.colUser.id,
          email: window.colUser.email,
          name: window.colUser.name,
          username: username,
          picture: window.colUser.picture,
          uid: window.colUser.id
        }))
        const trProfRaw = localStorage.getItem('traffic_profile')
        const trProf = trProfRaw ? JSON.parse(trProfRaw) : {}
        trProf.username = username
        localStorage.setItem('traffic_profile', JSON.stringify(trProf))
      } catch (stErr) {}

      const modal = document.getElementById('colAuthModal')
      if (modal) {
        modal.classList.remove('open')
        modal.setAttribute('aria-hidden', 'true')
        modal.setAttribute('inert', '')
      }
      dispatchAuthEvent()
      updateAuthUI()
      if (typeof toast === 'function') toast('Profile Created Successfully! Welcome, ' + username, '#10b981')
    } catch (error) {
      console.error('[col-auth] Profile creation error:', error)
      const isDuplicate = error.code === '23505' || 
        (error.message && (error.message.includes('unique') || error.message.includes('duplicate key') || error.message.includes('profiles_username_key')))
      
      if (isDuplicate) {
        if (errDiv) {
          errDiv.textContent = 'This Username Is Already In Use. Please Pick A Different Handle Or Choose A Suggestion Below.'
          errDiv.style.display = 'block'
        }
        const namePart = username.slice(1)
        const suggestions = generateUsernameSuggestions(namePart)
        if (suggBox && suggList) {
          suggList.innerHTML = suggestions.map(s => `
            <button type="button" class="col-uname-chip" onclick="window._pickUsernameSuggestion('${s}')">${s}</button>
          `).join('')
          suggBox.style.display = 'block'
        }
      } else {
        if (errDiv) {
          errDiv.textContent = error.message || 'Failed To Create Profile. Please Try Again.'
          errDiv.style.display = 'block'
        }
      }
    } finally {
      if (btn) {
        btn.textContent = 'Create Profile'
        btn.disabled = false
      }
    }
  }

  function escapeColHtml(str) {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function injectAuthStyles() {
    if (document.getElementById('col-auth-styles')) return
    const style = document.createElement('style')
    style.id = 'col-auth-styles'
    style.innerHTML = `
            .col-auth-mo { 
                position: fixed; 
                inset: 0; 
                background: rgba(4, 7, 14, 0.84); 
                backdrop-filter: blur(8px); 
                -webkit-backdrop-filter: blur(8px); 
                z-index: 99999; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                opacity: 0; 
                pointer-events: none; 
                transition: opacity 0.2s ease; 
                contain: strict; 
            }
            .col-auth-mo:not(.open) {
                display: none !important;
                pointer-events: none !important;
            }
            .col-auth-mo.open { opacity: 1; pointer-events: auto; display: flex !important; }
            .col-uname-chip {
                background: rgba(242, 184, 75, 0.12);
                color: var(--signal, #F2B84B);
                border: 1px solid rgba(242, 184, 75, 0.3);
                border-radius: 20px;
                padding: 4px 12px;
                font-size: 0.8rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.18s ease;
                font-family: inherit;
            }
            .col-uname-chip:hover {
                background: var(--signal, #F2B84B);
                color: var(--void, #070A14);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(242, 184, 75, 0.25);
            }
            .col-auth-md { 
                background: var(--panel, #111827); 
                border: 1px solid var(--lineb, rgba(255, 255, 255, 0.12)); 
                border-radius: 28px; 
                width: 92%; 
                max-width: 420px; 
                max-height: 90vh; 
                overflow-y: auto; 
                -webkit-overflow-scrolling: touch; 
                transform: translateY(20px) scale(0.98); 
                transition: transform 0.25s cubic-bezier(.16,1,.3,1), opacity 0.2s ease; 
                box-shadow: 0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.08); 
                color: var(--ink, #E8E3D8); 
                font-family: var(--sans, 'Inter'), sans-serif; 
                isolation: isolate; 
                contain: layout style; 
                box-sizing: border-box; 
            }
            .col-auth-mo.open .col-auth-md { transform: translateY(0) scale(1); }
            .col-auth-hd { padding: 32px 28px 20px; border-bottom: 1px solid var(--line, rgba(255,255,255,0.06)); background: transparent; text-align: center; position: relative;}
            .col-auth-close { position: absolute; top: 18px; right: 18px; background: transparent; border: 1px solid var(--lineb, rgba(255,255,255,0.1)); color: var(--dim, #8891AA); font-size: 1.2rem; cursor: pointer; transition: transform 0.15s ease, background-color 0.15s ease; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;}
            .col-auth-close:hover { color: var(--ink, #E8E3D8); background: var(--line, rgba(255,255,255,0.1)); border-color: var(--lineb, rgba(255,255,255,0.2)); transform: scale(1.05); }
            .col-auth-hd h2 { font-size: 2.3rem; font-weight: 400; font-family: var(--serif, 'Instrument Serif'); font-style: italic; margin:0; color: var(--page-theme, var(--signal, #F2B84B)); letter-spacing: 0.5px;}
            .col-auth-hd p { font-size: 0.9rem; color: var(--dim, #8891AA); margin-top: 6px; }
            .col-auth-body { padding: 24px 28px 28px; }
            .col-auth-lbl { display: block; margin-bottom: 6px; color: var(--dim, #8891AA); font-size: 0.82rem; font-weight: 600; text-align: left; }
            .col-auth-inp { 
                width: 100%; 
                padding: 12px 14px; 
                border: 1px solid var(--lineb, rgba(255,255,255,0.12)); 
                border-radius: 12px; 
                font-size: 0.95rem; 
                outline: none; 
                margin-bottom: 14px; 
                transition: border-color 0.15s ease, background-color 0.15s ease; 
                color: var(--ink, #E8E3D8); 
                background: var(--void2, rgba(255, 255, 255, 0.04)); 
                font-family: var(--sans, 'Inter'), sans-serif; 
                box-sizing: border-box; 
                text-rendering: optimizeSpeed; 
            }
            select.col-auth-inp { appearance: auto; }
            select.col-auth-inp option { background: #111827; color: #E8E3D8; }
            .col-auth-inp:focus { 
                border-color: var(--page-theme, var(--signal, #F2B84B)); 
                outline: 1px solid var(--page-theme, var(--signal, #F2B84B)); 
                outline-offset: -1px; 
                background: var(--void, rgba(255, 255, 255, 0.06)); 
            }
            .col-auth-btn { 
                width: 100%; 
                padding: 12px 16px; 
                background: var(--page-theme, var(--signal, #F2B84B)); 
                border: none; 
                border-radius: 12px; 
                font-weight: 700; 
                font-size: 0.95rem; 
                letter-spacing: 0.3px; 
                cursor: pointer; 
                color: var(--void, #070A14); 
                transition: transform 0.15s ease, opacity 0.15s ease; 
                font-family: var(--sans, 'Inter'), sans-serif; 
                box-sizing: border-box; 
            }
            .col-auth-btn:hover { transform: translateY(-1px); opacity: 0.95; }
            .col-auth-danger { 
                width: 100%; 
                padding: 12px 16px; 
                background: transparent; 
                border: 1px solid rgba(239, 68, 68, 0.5); 
                border-radius: 12px; 
                font-weight: 700; 
                font-size: 0.95rem; 
                cursor: pointer; 
                color: #ef4444; 
                transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease; 
                font-family: var(--sans, 'Inter'), sans-serif; 
                box-sizing: border-box; 
            }
            .col-auth-danger:hover { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; transform: translateY(-1px); }
            .col-auth-gbtn { 
                width: 100%; 
                padding: 12px 16px; 
                background: var(--ink, #ffffff); 
                border: none; 
                border-radius: 12px; 
                font-weight: 600; 
                font-size: 0.95rem; 
                cursor: pointer; 
                color: var(--void, #0f1419); 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 10px; 
                margin-bottom: 20px; 
                transition: transform 0.15s ease, opacity 0.15s ease; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                font-family: var(--sans, 'Inter'), sans-serif; 
                box-sizing: border-box; 
            }
            .col-auth-gbtn:hover { transform: translateY(-1px); opacity: 0.95; }
            .col-auth-div { display: flex; align-items: center; text-align: center; color: var(--dim, #8891AA); font-size: 0.75rem; margin-bottom: 20px; font-weight: 600; font-family: var(--mono, 'Space Mono'), monospace; letter-spacing: 2px;}
            .col-auth-div::before, .col-auth-div::after { content: ''; flex: 1; border-bottom: 1px solid var(--line, rgba(255,255,255,0.06)); }
            .col-auth-div:not(:empty)::before { margin-right: 1em; }
            .col-auth-div:not(:empty)::after { margin-left: 1em; }
            .col-auth-tab-group { display: flex; gap: 6px; margin-bottom: 20px; background: var(--void2, rgba(255,255,255,0.03)); border: 1px solid var(--line, rgba(255,255,255,0.06)); border-radius: 14px; padding: 4px;}
            .col-auth-tab { flex: 1; text-align: center; padding: 9px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; color: var(--dim, #8891AA); cursor: pointer; transition: color 0.15s ease, background-color 0.15s ease;}
            .col-auth-tab:hover:not(.active) { color: var(--ink, #E8E3D8); background: var(--line, rgba(255,255,255,0.05)); }
            .col-auth-tab.active { background: var(--line, rgba(255,255,255,0.08)); color: var(--page-theme, var(--signal, #F2B84B)); }
            @media (max-width: 600px) {
                .col-auth-mo { backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(4, 7, 14, 0.94); }
                .col-auth-md { width: 95%; border-radius: 20px; }
                .col-auth-body { padding: 20px; }
                .col-auth-hd { padding: 24px 20px 16px; }
            }
            
            /* Override existing nav profile logic for global injection */
            .nav-login-btn { display: flex; align-items: center; gap: 8px; background: transparent; color: var(--page-theme, var(--signal, #F2B84B)); border: 1px solid var(--page-theme, var(--signal, #F2B84B)); padding: 8px 20px; border-radius: 30px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: 0.3s; text-decoration:none; }
            body.lm .nav-login-btn { background: transparent; color: var(--page-theme-light, var(--signal, #F2B84B)); border-color: var(--page-theme-light, var(--signal, #F2B84B)); }
            body.lm .nav-login-btn:hover { background: var(--page-theme-light, var(--signal, #F2B84B)); color: #fff; }
            .nav-login-btn:hover { background: var(--page-theme, var(--signal, #F2B84B)); color: var(--void, #070A14); box-shadow: 0 0 20px rgba(242,184,75,0.2); }
            .nav-user-profile { display: none; align-items: center; gap: 10px; padding: 5px 15px 5px 5px; background: transparent; border: 1px solid var(--lineb, rgba(255,255,255,.16)); border-radius: 30px; cursor: pointer; transition: 0.3s; }
            .nav-user-profile:hover { border-color: var(--page-theme, var(--signal, #F2B84B)); }
            .nav-user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--page-theme, var(--signal, #F2B84B)); color: var(--void, #070A14); display: flex; justify-content: center; align-items: center; font-weight: 800; overflow: hidden; }
            .nav-user-avatar img, .pav img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
        `
    document.head.appendChild(style)
  }

  function injectAuthUI() {
    if (document.getElementById('colAuthModal')) return

    const modal = document.createElement('div')
    modal.className = 'col-auth-mo'
    modal.id = 'colAuthModal'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('aria-labelledby', 'colAuthTitle')
    modal.setAttribute('aria-hidden', 'true')
    modal.setAttribute('inert', '')
    modal.innerHTML = `
            <div class="col-auth-md">
                <div class="col-auth-hd">
                    <button class="col-auth-close" onclick="window.closeGlobalAuth()" aria-label="Close login dialog">&times;</button>
                    <h2 id="colAuthTitle">Authenticate</h2>
                    <p id="colAuthSub">Unlock Dashboard Storage And Cloud Sync.</p>
                </div>
                <div class="col-auth-body" id="colAuthBody">
                    <!-- Dynamic Content -->
                </div>
            </div>
        `
    document.body.appendChild(modal)
    modal.addEventListener('click', function(e) {
      if (e.target === this) window.closeGlobalAuth()
    })

    window.closeGlobalAuth = function () {
      var mo = document.getElementById('colAuthModal')
      if (mo) {
        mo.classList.remove('open')
        mo.setAttribute('aria-hidden', 'true')
        mo.setAttribute('inert', '')
      }
    }

    // Expose global open functions
    window.openGlobalLogin = function () {
      renderAuthPanel()
      var mo = document.getElementById('colAuthModal')
      if (mo) {
        mo.classList.add('open')
        mo.removeAttribute('aria-hidden')
        mo.removeAttribute('inert')
        // Focus first focusable element
        setTimeout(function(){ var f = mo.querySelector('button, input, [tabindex]:not([tabindex="-1"])'); if(f) f.focus(); }, 100)
      }
    }

    window.openAccountSettings = function () {
      if (!window.colUser) {
        window.openGlobalLogin()
        return
      }
      renderAuthPanel('settings')
      var mo = document.getElementById('colAuthModal')
      if (mo) {
        mo.classList.add('open')
        mo.removeAttribute('aria-hidden')
        mo.removeAttribute('inert')
        setTimeout(function(){ var f = mo.querySelector('button, input, [tabindex]:not([tabindex="-1"])'); if(f) f.focus(); }, 100)
      }
    }

    // Escape key closes modal
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape'){
        window.closeGlobalAuth()
      }
    })
    // Focus trap
    modal.addEventListener('keydown', function(e){
      if(e.key!=='Tab') return
      var focusable = modal.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if(!focusable.length) return
      var first = focusable[0], last = focusable[focusable.length-1]
      if(e.shiftKey){ if(document.activeElement===first){ e.preventDefault(); last.focus(); } }
      else { if(document.activeElement===last){ e.preventDefault(); first.focus(); } }
    })
  }

  let colOtpState = { step: 'send', email: '' }

  function renderAuthPanel(tab = 'login') {
    const body = document.getElementById('colAuthBody')
    if (!body) return

    const hdTitle = document.getElementById('colAuthTitle')
    const hdSub = document.getElementById('colAuthSub') || document.querySelector('.col-auth-hd p')

    if (window.colUser) {
      const isLocal = !!window.colUser.isLocal
      const currentVeh = window.colUser.vehicle || (window.colUser.user_metadata && window.colUser.user_metadata.preferred_vehicle) || 'Car'

      if (tab === 'settings') {
        if (hdTitle) hdTitle.textContent = 'Account Settings'
        if (hdSub) hdSub.textContent = 'Customize Profile Details, Avatar, Vehicle, And Security.'

        body.innerHTML = `
          <div style="text-align:left;">
            <button type="button" onclick="window._renderAuthTab('profile')" style="background:transparent; border:none; color:var(--dim, #8891AA); cursor:pointer; font-size:0.85rem; font-weight:600; padding:0; margin-bottom:16px; display:inline-flex; align-items:center; gap:6px;">
              &larr; Back To Profile
            </button>
            <div id="colSettingsFeedback" style="display:none; font-size:0.85rem; padding:10px 14px; border-radius:12px; margin-bottom:14px; text-align:center; font-weight:600;"></div>
            <form id="colSettingsForm" onsubmit="window._handleSaveAccountSettings(event)">
              <div>
                <label class="col-auth-lbl" for="colSettingName">Display Name</label>
                <input type="text" id="colSettingName" class="col-auth-inp" placeholder="Display Name" value="${escapeColHtml(window.colUser.name || '')}" required maxlength="40">
              </div>
              <div>
                <label class="col-auth-lbl" for="colSettingUsername">Username (Public Handle)</label>
                <input type="text" id="colSettingUsername" class="col-auth-inp" placeholder="@username" value="${escapeColHtml(window.colUser.username || '')}" maxlength="30" oninput="window._onSettingUsernameInput(this)" style="margin-bottom:4px;">
                <div id="colSettingUsernameStatus" style="font-size:0.8rem; font-weight:600; min-height:18px; margin-bottom:10px;"></div>
              </div>
              <div>
                <label class="col-auth-lbl" for="colSettingVehicle">Preferred Vehicle</label>
                <select id="colSettingVehicle" class="col-auth-inp" style="cursor:pointer;">
                  <option value="Car" ${currentVeh === 'Car' ? 'selected' : ''}>Standard Car</option>
                  <option value="Auto" ${currentVeh === 'Auto' ? 'selected' : ''}>Auto Rickshaw</option>
                  <option value="Bus" ${currentVeh === 'Bus' ? 'selected' : ''}>BEST City Bus</option>
                  <option value="Bike" ${currentVeh === 'Bike' ? 'selected' : ''}>Motorcycle</option>
                  <option value="Truck" ${currentVeh === 'Truck' ? 'selected' : ''}>Heavy Truck</option>
                </select>
              </div>
              <div>
                <label class="col-auth-lbl" for="colSettingAvatar">Profile Photo URL (Optional)</label>
                <input type="url" id="colSettingAvatar" class="col-auth-inp" placeholder="https://example.com/photo.jpg" value="${escapeColHtml(window.colUser.picture || '')}">
              </div>
              <div>
                <label class="col-auth-lbl" for="colSettingPassword">New Password / PIN (Optional)</label>
                <input type="password" id="colSettingPassword" class="col-auth-inp" placeholder="Leave Blank To Keep Current" minlength="6">
              </div>
              <button type="submit" class="col-auth-btn" id="colSaveSettingsBtn" style="margin-top:6px;">Save Changes</button>
              <button type="button" class="col-auth-btn" style="margin-top:10px; background:transparent; color:var(--dim, #8891AA); border:1px solid var(--lineb, rgba(255,255,255,.12));" onclick="window._renderAuthTab('profile')">Cancel</button>
            </form>
          </div>
        `
        return
      }

      // Default Profile Overview
      if (hdTitle) hdTitle.textContent = 'Account'
      if (hdSub) hdSub.textContent = 'Connected Account And Session Overview.'

      body.innerHTML = `
        <div style="text-align:center; margin-bottom: 22px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--signal, #F2B84B); margin: 0 auto 14px; display: flex; justify-content: center; align-items: center; font-size: 2rem; overflow: hidden; border: 2px solid var(--signal, #F2B84B); color: var(--void, #070A14); font-weight: 800;">
                ${window.colUser.picture ? `<img src="${window.colUser.picture}" alt="${escapeColHtml(window.colUser.name || 'User')}" referrerpolicy="no-referrer" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.style.display='none'; this.parentElement.textContent='${escapeColHtml((window.colUser.name || '?').charAt(0).toUpperCase())}';">` : escapeColHtml((window.colUser.name || '?').charAt(0).toUpperCase())}
            </div>
            <h3 style="margin-bottom: 4px; font-size: 1.25rem; color: var(--ink, #E8E3D8); font-weight: 700;">${escapeColHtml(window.colUser.name || 'User')}</h3>
            <p style="color: var(--dim, #8891AA); font-size: 0.9rem; margin-bottom: 8px;">${escapeColHtml(window.colUser.email || window.colUser.username || 'Local Profile')}</p>
            <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin-top:8px;">
                ${isLocal ? `<span style="padding:4px 10px; background:rgba(94,212,245,0.15); color:var(--ion,#5ED4F5); border-radius:20px; font-size:0.75rem; font-weight:700; border:1px solid rgba(94,212,245,0.3);">💾 Local Account</span>` : `<span style="padding:4px 10px; background:rgba(242,184,75,0.15); color:var(--signal,#F2B84B); border-radius:20px; font-size:0.75rem; font-weight:700; border:1px solid rgba(242,184,75,0.3);">⚡ Cloud Account</span>`}
                ${currentVeh ? `<span style="padding:4px 10px; background:rgba(255,255,255,0.06); color:var(--ink,#E8E3D8); border-radius:20px; font-size:0.75rem; font-weight:600; border:1px solid rgba(255,255,255,0.1);">🚗 ${escapeColHtml(currentVeh)}</span>` : ''}
            </div>
        </div>
        <button type="button" class="col-auth-btn" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="window._renderAuthTab('settings')">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Change Account Settings
        </button>
        <button type="button" class="col-auth-danger" onclick="colDoLogout()">Disconnect Account</button>
      `
      return
    }

    if (hdTitle) hdTitle.textContent = 'Authenticate'
    if (hdSub) hdSub.textContent = 'Unlock Dashboard Storage And Cloud Sync.'

    const isLogin = tab === 'login'
    const isOtp = tab === 'otp'
    const isSignup = tab === 'signup'

    body.innerHTML = `
            <button class="col-auth-gbtn" onclick="colDoGoogle()">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue With Google
            </button>
            <div class="col-auth-div">OR EMAIL / USERNAME</div>
            
            <div class="col-auth-tab-group">
                <div class="col-auth-tab ${isLogin ? 'active' : ''}" onclick="window._renderAuthTab('login')">Sign In</div>
                <div class="col-auth-tab ${isOtp ? 'active' : ''}" onclick="window._renderAuthTab('otp')">Email OTP</div>
                <div class="col-auth-tab ${isSignup ? 'active' : ''}" onclick="window._renderAuthTab('signup')">Register</div>
            </div>

            <div id="colAuthError" style="color: #ef4444; font-size: 0.85rem; margin-bottom: 12px; text-align: center; display: none;"></div>

            ${
              isOtp
                ? colOtpState.step === 'verify'
                  ? `
                <form id="colAuthOtpVerifyForm" onsubmit="window._handleColOtpVerify(event)">
                    <p style="font-size: 0.85rem; color: var(--dim, #8891AA); margin-bottom: 14px; text-align: center; line-height: 1.4;">
                        Enter The 6-Digit Code Sent To <br><strong style="color:var(--ink,#E8E3D8);">${escapeColHtml(colOtpState.email)}</strong>
                    </p>
                    <input type="text" id="colOtpToken" class="col-auth-inp" placeholder="• • • • • •" maxlength="8" required autofocus style="font-size: 1.5rem; text-align: center; letter-spacing: 8px; font-family: monospace; font-weight: 700;">
                    <button type="submit" class="col-auth-btn" id="colOtpVerifyBtn">Verify & Sign In</button>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; font-size:0.85rem;">
                        <button type="button" onclick="window._handleColOtpSend(null)" style="background:none; border:none; color:var(--page-theme, var(--signal, #F2B84B)); cursor:pointer; padding:0; font-weight:600;">Resend Code</button>
                        <button type="button" onclick="window._handleColOtpReset()" style="background:none; border:none; color:var(--dim, #8891AA); cursor:pointer; padding:0;">Change Email</button>
                    </div>
                </form>
                `
                  : `
                <form id="colAuthOtpSendForm" onsubmit="window._handleColOtpSend(event)">
                    <p style="font-size: 0.85rem; color: var(--dim, #8891AA); margin-bottom: 14px; text-align: center; line-height: 1.4;">
                        Enter Your Email To Receive A 6-Digit Verification Code To Sign In Password-Free.
                    </p>
                    <input type="email" id="colOtpEmail" class="col-auth-inp" placeholder="name@example.com" required value="${escapeColHtml(colOtpState.email || '')}">
                    <button type="submit" class="col-auth-btn" id="colOtpSendBtn">Send 6-Digit Code</button>
                </form>
                `
                : `
                <form id="colAuthForm" onsubmit="window._handleColAuthSubmit(event, '${tab}')">
                    ${isSignup ? `<input type="text" id="colAuthName" class="col-auth-inp" placeholder="Display Name" required>` : ''}
                    <input type="text" id="colAuthEmail" class="col-auth-inp" placeholder="${isLogin ? 'Email Address or @username' : 'Email Address'}" required>
                    <input type="password" id="colAuthPass" class="col-auth-inp" placeholder="${isLogin ? 'Password or Local PIN' : 'Password (Min 6 Characters)'}" required minlength="${isLogin ? 1 : 6}">
                    <button type="submit" class="col-auth-btn" id="colAuthSubmitBtn">${isLogin ? 'Sign In' : 'Create Account'}</button>
                </form>
                `
            }
        `
  }

  // Expose helpers for inline handlers
  window._renderAuthTab = (tab) => {
    if (tab !== 'otp') colOtpState = { step: 'send', email: '' }
    renderAuthPanel(tab)
  }

  window._onSettingUsernameInput = function (input) {
    if (!input) return
    let val = input.value.trim()
    if (val && !val.startsWith('@')) val = '@' + val
    val = '@' + val.slice(1).replace(/[^a-zA-Z0-9_]/g, '')
    input.value = val

    const statusEl = document.getElementById('colSettingUsernameStatus')
    const btn = document.getElementById('colSaveSettingsBtn')
    const currentUname = (window.colUser && window.colUser.username) || ''

    if (!val || val === '@' || val.toLowerCase() === currentUname.toLowerCase()) {
      if (statusEl) statusEl.textContent = ''
      if (btn) btn.disabled = false
      return
    }

    if (val.slice(1).length < 3) {
      if (statusEl) {
        statusEl.textContent = 'Username Must Be At Least 3 Characters.'
        statusEl.style.color = 'var(--dim, #8891AA)'
      }
      if (btn) btn.disabled = true
      return
    }

    if (statusEl) {
      statusEl.textContent = 'Checking Availability...'
      statusEl.style.color = 'var(--dim, #8891AA)'
    }

    if (usernameCheckDebounce) clearTimeout(usernameCheckDebounce)
    usernameCheckDebounce = setTimeout(async () => {
      const currentId = window.colUser ? window.colUser.id : null
      const res = await checkUsernameAvailability(val, currentId)
      if (res.available) {
        if (statusEl) {
          statusEl.textContent = '✓ Username Available!'
          statusEl.style.color = '#10b981'
        }
        if (btn) btn.disabled = false
      } else {
        if (statusEl) {
          statusEl.textContent = '✕ ' + (res.error || 'Username Taken')
          statusEl.style.color = '#ef4444'
        }
        if (btn) btn.disabled = true
      }
    }, 280)
  }

  window._handleSaveAccountSettings = async (e) => {
    if (e) e.preventDefault()
    if (!window.colUser) return

    const nameInp = document.getElementById('colSettingName')
    const unameInp = document.getElementById('colSettingUsername')
    const vehInp = document.getElementById('colSettingVehicle')
    const avInp = document.getElementById('colSettingAvatar')
    const passInp = document.getElementById('colSettingPassword')
    const btn = document.getElementById('colSaveSettingsBtn')
    const fb = document.getElementById('colSettingsFeedback')

    const newName = nameInp ? nameInp.value.trim() : ''
    let newUname = unameInp ? unameInp.value.trim() : ''
    const newVeh = vehInp ? vehInp.value : 'Car'
    const newAv = avInp ? avInp.value.trim() : ''
    const newPass = passInp ? passInp.value.trim() : ''

    if (!newName) {
      if (fb) {
        fb.textContent = 'Please Enter A Valid Display Name.'
        fb.style.background = 'rgba(239, 68, 68, 0.15)'
        fb.style.color = '#ef4444'
        fb.style.display = 'block'
      }
      return
    }

    if (newUname) {
      if (!newUname.startsWith('@')) newUname = '@' + newUname
      newUname = '@' + newUname.slice(1).replace(/[^a-zA-Z0-9_]/g, '')
    }

    const currentUname = (window.colUser.username || '').toLowerCase()
    if (newUname && newUname.toLowerCase() !== currentUname) {
      if (newUname.slice(1).length < 3) {
        if (fb) {
          fb.textContent = 'Username Must Be At Least 3 Characters.'
          fb.style.background = 'rgba(239, 68, 68, 0.15)'
          fb.style.color = '#ef4444'
          fb.style.display = 'block'
        }
        return
      }

      const check = await checkUsernameAvailability(newUname, window.colUser.id)
      if (!check.available) {
        if (fb) {
          fb.textContent = check.error || 'This Username Is Already Taken. Please Choose Another.'
          fb.style.background = 'rgba(239, 68, 68, 0.15)'
          fb.style.color = '#ef4444'
          fb.style.display = 'block'
        }
        if (btn) {
          btn.textContent = 'Save Changes'
          btn.disabled = false
        }
        return
      }
    }

    if (newPass && newPass.length < 6) {
      if (fb) {
        fb.textContent = 'New Password Must Be At Least 6 Characters.'
        fb.style.background = 'rgba(239, 68, 68, 0.15)'
        fb.style.color = '#ef4444'
        fb.style.display = 'block'
      }
      return
    }

    if (btn) {
      btn.textContent = 'Saving Changes...'
      btn.disabled = true
    }
    if (fb) fb.style.display = 'none'

    try {
      // 1. If Supabase cloud session is active
      if (supabaseClient && window.colUser.session) {
        if (newPass) {
          const { error: passErr } = await supabaseClient.auth.updateUser({ password: newPass })
          if (passErr) throw passErr
        }

        const metaUpdate = {
          full_name: newName,
          name: newName,
          preferred_vehicle: newVeh
        }
        if (newAv) {
          metaUpdate.avatar_url = newAv
          metaUpdate.picture = newAv
        }
        const { error: metaErr } = await supabaseClient.auth.updateUser({ data: metaUpdate })
        if (metaErr) console.warn('[col-auth] User metadata update warning:', metaErr)

        const upPayload = {
          user_id: window.colUser.id,
          display_name: newName,
          full_name: newName,
          preferred_vehicle: newVeh,
          updated_at: new Date().toISOString()
        }
        if (newUname) upPayload.username = newUname
        if (newAv) upPayload.avatar_url = newAv
        const { error: upErr } = await supabaseClient.from('user_profiles').upsert(upPayload, { onConflict: 'user_id' })
        if (upErr) console.warn('[col-auth] user_profiles update warning:', upErr)

        const profPayload = { full_name: newName }
        if (newUname) profPayload.username = newUname
        const { error: pErr } = await supabaseClient.from('profiles').update(profPayload).eq('id', window.colUser.id)
        if (pErr) {
          if (pErr.code === '23505' || (pErr.message && pErr.message.includes('unique'))) {
            throw new Error('This Username Is Already Taken By Another User.')
          }
          console.warn('[col-auth] profiles update warning:', pErr)
        }
      }

      // 2. Update local session state
      window.colUser.name = newName
      if (newUname) window.colUser.username = newUname
      window.colUser.vehicle = newVeh
      if (newAv) window.colUser.picture = newAv
      if (!window.colUser.user_metadata) window.colUser.user_metadata = {}
      window.colUser.user_metadata.full_name = newName
      window.colUser.user_metadata.name = newName
      window.colUser.user_metadata.preferred_vehicle = newVeh
      if (newAv) {
        window.colUser.user_metadata.avatar_url = newAv
        window.colUser.user_metadata.picture = newAv
      }

      const storedUser = {
        id: window.colUser.id,
        name: newName,
        username: newUname || window.colUser.username,
        email: window.colUser.email,
        vehicle: newVeh,
        picture: window.colUser.picture || null,
        uid: window.colUser.uid,
        updatedAt: new Date().toISOString()
      }
      if (newPass) {
        storedUser.pin = newPass
        storedUser.password = newPass
      }
      if (window.colUser.isLocal || typeof setActiveLocalUser === 'function') {
        setActiveLocalUser(storedUser)
      } else {
        localStorage.setItem('col_user', JSON.stringify(storedUser))
        localStorage.setItem('traffic_local_user', JSON.stringify(storedUser))
      }

      try {
        const trProfRaw = localStorage.getItem('traffic_profile')
        const trProf = trProfRaw ? JSON.parse(trProfRaw) : {}
        trProf.name = newName
        trProf.preferred_vehicle = newVeh
        trProf.vehicle = newVeh
        localStorage.setItem('traffic_profile', JSON.stringify(trProf))
      } catch (e) {}

      dispatchAuthEvent()
      updateAuthUI()

      if (fb) {
        fb.textContent = 'Account Settings Saved Successfully!'
        fb.style.background = 'rgba(16, 185, 129, 0.15)'
        fb.style.color = '#10b981'
        fb.style.display = 'block'
      }

      if (btn) {
        btn.textContent = 'Saved!'
      }

      setTimeout(() => {
        renderAuthPanel('profile')
      }, 800)
    } catch (err) {
      if (fb) {
        fb.textContent = err.message || 'Failed To Update Account Settings.'
        fb.style.background = 'rgba(239, 68, 68, 0.15)'
        fb.style.color = '#ef4444'
        fb.style.display = 'block'
      }
      if (btn) {
        btn.textContent = 'Save Changes'
        btn.disabled = false
      }
    }
  }

  window._handleColOtpSend = async (e) => {
    if (e) e.preventDefault()
    const inp = document.getElementById('colOtpEmail')
    const emailInput = (inp ? inp.value : colOtpState.email || '').trim()
    const btn = document.getElementById('colOtpSendBtn')
    const errDiv = document.getElementById('colAuthError')

    if (!emailInput) return
    if (!supabaseClient) {
      if (errDiv) {
        errDiv.textContent = 'Cloud authentication service unavailable. Check your internet connection.'
        errDiv.style.display = 'block'
      }
      return
    }

    if (btn) {
      btn.textContent = 'Sending Code...'
      btn.disabled = true
    }
    if (errDiv) errDiv.style.display = 'none'

    try {
      const { data, error } = await supabaseClient.auth.signInWithOtp({
        email: emailInput,
        options: {
          shouldCreateUser: true
        }
      })
      if (error) throw error

      colOtpState = { step: 'verify', email: emailInput }
      renderAuthPanel('otp')
    } catch (err) {
      if (errDiv) {
        errDiv.textContent = err.message || 'Failed to send OTP code.'
        errDiv.style.display = 'block'
      }
      if (btn) {
        btn.textContent = 'Send 6-Digit Code'
        btn.disabled = false
      }
    }
  }

  window._handleColOtpVerify = async (e) => {
    if (e) e.preventDefault()
    const tokenInp = document.getElementById('colOtpToken')
    const token = tokenInp ? tokenInp.value.trim() : ''
    const btn = document.getElementById('colOtpVerifyBtn')
    const errDiv = document.getElementById('colAuthError')

    if (!token) return
    if (!supabaseClient) {
      if (errDiv) {
        errDiv.textContent = 'Auth service unavailable.'
        errDiv.style.display = 'block'
      }
      return
    }

    if (btn) {
      btn.textContent = 'Verifying...'
      btn.disabled = true
    }
    if (errDiv) errDiv.style.display = 'none'

    try {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        email: colOtpState.email,
        token: token,
        type: 'email'
      })
      if (error) throw error

      colOtpState = { step: 'send', email: '' }
      const mo = document.getElementById('colAuthModal')
      if (mo) mo.classList.remove('open')
      const loginMo = document.getElementById('loginMo')
      if (loginMo) loginMo.classList.remove('open')
      dispatchAuthEvent()
      updateAuthUI()
    } catch (err) {
      if (errDiv) {
        errDiv.textContent = err.message || 'Invalid or expired verification code.'
        errDiv.style.display = 'block'
      }
      if (btn) {
        btn.textContent = 'Verify & Sign In'
        btn.disabled = false
      }
    }
  }

  window._handleColOtpReset = () => {
    colOtpState = { step: 'send', email: '' }
    renderAuthPanel('otp')
  }

  window.colDoGoogle = async () => {    if (window.AndroidBridge) {
      window.AndroidBridge.signInWithGoogle()
      return
    }

    if (!supabaseClient) return
    var allowedOrigin = 'https://advancedlogiclabs.dpdns.org'
    var currentOrigin = window.location.origin
    var isLocal = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')
    var isVercel = currentOrigin.includes('vercel.app')
    var redirectUrl = (currentOrigin === allowedOrigin || isLocal || isVercel) ? window.location.href : allowedOrigin

    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    })
  }

  window._handleColAuthSubmit = async (e, mode) => {
    e.preventDefault()

    const emailInput = document.getElementById('colAuthEmail').value.trim()
    const pass = document.getElementById('colAuthPass').value.trim()
    const btn = document.getElementById('colAuthSubmitBtn')
    const errDiv = document.getElementById('colAuthError')

    btn.textContent = 'Processing...'
    btn.disabled = true
    errDiv.style.display = 'none'

    try {
      if (mode === 'login') {
        // 1. Check local accounts first (by email or username or display name)
        const localAccounts = getLocalAccounts()
        const normInput = emailInput.toLowerCase()
        const normUname = normInput.startsWith('@') ? normInput : '@' + normInput

        const matched = localAccounts.find(acc => {
          const accEmail = (acc.email || '').toLowerCase()
          const accUname = (acc.username || '').toLowerCase()
          const accName = (acc.name || '').toLowerCase()
          return accEmail === normInput || accUname === normInput || accUname === normUname || accName === normInput
        })

        if (matched) {
          const expectedPin = (matched.pin || matched.password || '').toString().trim()
          if (!expectedPin || expectedPin === pass) {
            setActiveLocalUser(matched)
            const mo = document.getElementById('colAuthModal')
            if (mo) mo.classList.remove('open')
            const loginMo = document.getElementById('loginMo')
            if (loginMo) loginMo.classList.remove('open')
            dispatchAuthEvent()
            updateAuthUI()
            btn.textContent = 'Sign In'
            btn.disabled = false
            return
          } else {
            throw new Error('Incorrect password or PIN for this local account.')
          }
        }

        // 2. If not found in local accounts, try Supabase account system RPC first
        if (supabaseClient) {
          try {
            const rpcRes = await supabaseClient.rpc('authenticate_account', {
              p_identifier: emailInput,
              p_pin: pass
            })
            if (rpcRes && rpcRes.data && rpcRes.data.success) {
              const acc = rpcRes.data
              setActiveLocalUser({
                id: acc.id,
                name: acc.display_name || acc.username,
                username: acc.username,
                email: acc.email || '',
                pin: pass,
                password: pass,
                role: acc.role || 'student',
                vehicle: acc.preferred_vehicle || 'Car',
                age: acc.age || 18,
                language: acc.language || 'en',
                total: acc.total_score || 0,
                badges: acc.badges || [],
                updatedAt: new Date().toISOString()
              })
              const mo = document.getElementById('colAuthModal')
              if (mo) mo.classList.remove('open')
              const loginMo = document.getElementById('loginMo')
              if (loginMo) loginMo.classList.remove('open')
              dispatchAuthEvent()
              updateAuthUI()
              btn.textContent = 'Sign In'
              btn.disabled = false
              return
            }
          } catch (rpcErr) {
            console.warn('[col-auth] Account system RPC auth bypass/error:', rpcErr)
          }
        }

        if (!supabaseClient) {
          throw new Error('Local account not found. Please check your username or PIN.')
        }

        let res = await supabaseClient.auth.signInWithPassword({
          email: emailInput,
          password: pass
        })

        if (res.error) throw res.error
        const mo = document.getElementById('colAuthModal')
        if (mo) mo.classList.remove('open')
        const loginMo = document.getElementById('loginMo')
        if (loginMo) loginMo.classList.remove('open')
      } else {
        // Signup mode
        const name = document.getElementById('colAuthName').value.trim()
        if (supabaseClient) {
          try {
            const res = await supabaseClient.auth.signUp({
              email: emailInput,
              password: pass,
              options: { data: { full_name: name } }
            })
            if (res.error) throw res.error

            if (res.data.user && !res.data.session) {
              errDiv.textContent = 'Please check your email to confirm registration.'
              errDiv.style.color = '#10b981'
              errDiv.style.display = 'block'
            } else {
              const mo = document.getElementById('colAuthModal')
              if (mo) mo.classList.remove('open')
            }
          } catch (cloudErr) {
            console.warn('[col-auth] Cloud signup failed, saving to account system:', cloudErr)
            // Fallback: save as account
            const uname = '@' + (name.toLowerCase().replace(/\s+/g, '_') || 'driver_' + Math.floor(Math.random() * 1000))
            const newAcc = {
              id: 'local_' + Date.now(),
              name: name,
              username: uname,
              email: emailInput,
              pin: pass,
              password: pass,
              role: 'student',
              vehicle: 'Car',
              createdAt: new Date().toISOString()
            }
            try {
              const reg = await supabaseClient.rpc('register_account', {
                p_username: uname,
                p_pin: pass,
                p_display_name: name,
                p_email: emailInput,
                p_role: 'student',
                p_vehicle: 'Car'
              })
              if (reg && reg.data && reg.data.success) {
                newAcc.id = reg.data.id
              }
            } catch (regErr) {
              console.warn('[col-auth] Account system cloud registration failed:', regErr)
            }
            setActiveLocalUser(newAcc)
            const mo = document.getElementById('colAuthModal')
            if (mo) mo.classList.remove('open')
            dispatchAuthEvent()
            updateAuthUI()
            return
          }
        } else {
          // Offline / local only
          const uname = '@' + (name.toLowerCase().replace(/\s+/g, '_') || 'driver_' + Math.floor(Math.random() * 1000))
          const newAcc = {
            id: 'local_' + Date.now(),
            name: name,
            username: uname,
            email: emailInput,
            pin: pass,
            password: pass,
            role: 'student',
            vehicle: 'Car',
            createdAt: new Date().toISOString()
          }
          setActiveLocalUser(newAcc)
          const mo = document.getElementById('colAuthModal')
          if (mo) mo.classList.remove('open')
          dispatchAuthEvent()
          updateAuthUI()
        }
      }
    } catch (error) {
      errDiv.textContent = error.message
      errDiv.style.color = '#ef4444'
      errDiv.style.display = 'block'
    }
    btn.textContent = mode === 'login' ? 'Sign In' : 'Create Account'
    btn.disabled = false
  }

  window.colDoLogout = async () => {
    if (window.colUser && window.colUser.isLocal) {
      clearActiveLocalUser()
      const modal = document.getElementById('colAuthModal')
      if (modal) modal.classList.remove('open')
      const loginMo = document.getElementById('loginMo')
      if (loginMo) loginMo.classList.remove('open')
      dispatchAuthEvent()
      updateAuthUI()
      return
    }
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut()
      } catch (e) {}
    }
    clearActiveLocalUser()
    const modal = document.getElementById('colAuthModal')
    if (modal) modal.classList.remove('open')
    const loginMo = document.getElementById('loginMo')
    if (loginMo) loginMo.classList.remove('open')
    dispatchAuthEvent()
    updateAuthUI()
  }
  window.doLogout = window.colDoLogout
  // Legacy inline-handler aliases (about.html + injected modal use bare names)
  window.gSignIn = function () { try { return window.colDoGoogle && window.colDoGoogle(); } catch (e) {} };
  window.updateUsername = function () {
    try {
      const inp = document.getElementById('miName');
      const name = inp && inp.value ? inp.value.trim().slice(0, 40) : '';
      if (!name) { try { toast('Enter A Username First', '#ef4444'); } catch (e) {} return; }
      const cur = (typeof getActiveLocalUser === 'function' && getActiveLocalUser()) || window.colUser || {};
      const updated = Object.assign({}, cur, { name });
      if (typeof setActiveLocalUser === 'function') setActiveLocalUser(updated);
      if (window.colUser) window.colUser.name = name;
      try { toast('Username Saved', '#22c55e'); } catch (e) {}
      try { if (typeof updateAuthUI === 'function') updateAuthUI(); } catch (e) {}
    } catch (e) { console.warn('[col-auth] updateUsername failed:', e); }
  };

  // --- Secure Profile Linking (Verification Code Flow) ---
  window.colAuthGenerateCode = async () => {
    if (!window.supabaseClient || !window.colUser) {
      toast('Please log in to generate a linking code', '#ef4444');
      return null;
    }
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const { error } = await window.supabaseClient
        .from('profiles')
        .update({ verification_code: code })
        .eq('id', window.colUser.id);
      if (error) throw error;
      return code;
    } catch (e) {
      console.error('[col-auth] Code generation failed:', e);
      return null;
    }
  };

  window.colAuthVerifyCode = async (code) => {
    if (!window.supabaseClient) return { success: false, error: 'Auth system unavailable' };
    try {
      const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('id')
        .eq('verification_code', code)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { success: false, error: 'Invalid or expired code' };

      // Clear code after successful verification
      await window.supabaseClient
        .from('profiles')
        .update({ verification_code: null })
        .eq('id', data.id);

      return { success: true, userId: data.id };
    } catch (e) {
      console.error('[col-auth] Code verification failed:', e);
      return { success: false, error: e.message };
    }
  };

  async function verifyApkCertificate() {
    if (!window.AndroidBridge) {
      window.colApkVerified = false
      window.dispatchEvent(new CustomEvent('col-apk-verified', { detail: { verified: false } }))
      return
    }
    try {
      const fp = window.AndroidBridge.getCertificateFingerprint()
      if (!fp) {
        window.colApkVerified = false
        window.dispatchEvent(new CustomEvent('col-apk-verified', { detail: { verified: false } }))
        return
      }
      window.colApkFingerprint = fp
      // Fetch expected fingerprint from config
      let expected = null
      try {
        const res = await fetch('/config.json?t=' + Date.now())
        if (res.ok) {
          const cfg = await res.json()
          expected = cfg.apkCertFingerprint || null
        }
      } catch (e) {}
      if (expected && fp.toUpperCase() === expected.toUpperCase()) {
        window.colApkVerified = true
      } else {
        window.colApkVerified = false
      }
      window.dispatchEvent(new CustomEvent('col-apk-verified', { detail: { verified: window.colApkVerified, fingerprint: fp } }))
    } catch (e) {
      console.warn('[col-auth] APK verification failed:', e)
      window.colApkVerified = false
      window.dispatchEvent(new CustomEvent('col-apk-verified', { detail: { verified: false } }))
    }
  }
  verifyApkCertificate()

  function updateAuthUI() {
    // Find existing UI elements in any page
    const navBtns = document.querySelectorAll('.nav-login-btn, #navLoginBtn, #sbSignBtn')
    const navProfiles = document.querySelectorAll('.nav-user-profile, #navUserProfile, #pCard')

    if (window.colUser) {
      navBtns.forEach((btn) => (btn.style.display = 'none'))
      navProfiles.forEach((prof) => {
        prof.style.display = 'flex'
        if (prof.dataset.preserveClick !== 'true') {
          prof.onclick = function () {
            if (window.openGlobalLogin) window.openGlobalLogin()
            else if (window.openLogin) window.openLogin()
          }
        }

        // Try to find the inner text elements
        const nameEls = prof.querySelectorAll('span, .pname')
        const avEls = prof.querySelectorAll('.nav-user-avatar, .pav')
        const emailEls = prof.querySelectorAll('.pemail')

        nameEls.forEach((el) => (el.textContent = window.colUser.name.split(' ')[0]))
        emailEls.forEach((el) => (el.textContent = window.colUser.email))

        avEls.forEach((av) => {
          const initial = (window.colUser.name || 'U').charAt(0).toUpperCase()
          if (window.colUser.picture) {
            av.innerHTML = `<img src="${window.colUser.picture}" alt="${window.colUser.name || 'User'}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="this.style.display='none'; this.parentElement.textContent='${initial}';">`
          } else {
            av.innerHTML = ''
            av.textContent = initial
          }
        })
      })
    } else {
      navBtns.forEach((btn) => {
        btn.style.display = 'flex'
        btn.onclick = function () {
          if (window.openGlobalLogin) window.openGlobalLogin()
          else if (window.openLogin) window.openLogin()
        }
      })
      navProfiles.forEach((prof) => (prof.style.display = 'none'))
    }
  }

  // Auto-update UI on load if we have cached elements but Auth hasn't finished loading yet
  document.addEventListener('DOMContentLoaded', updateAuthUI)
})()
