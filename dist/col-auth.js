// Class Of Learners Global Authentication System (Supabase PKCE + Google One Tap)

let supabaseClient = null

// Shared fallback login modal for pages without #colAuthModal in markup
function injectLoginModal() {
  if (document.getElementById('loginMo')) return
  const mo = document.createElement('div')
  mo.className = 'col-auth-mo'
  mo.id = 'loginMo'
  mo.innerHTML =
    '<div class="col-auth-md"><div class="col-auth-hd"><h2>Authenticate</h2><p>Unlock dashboard storage and cloud sync.</p></div><div class="col-auth-body"><div id="loggedOutPanel" style="display:flex;justify-content:center;align-items:center;width:100%;margin-bottom:15px;"><div id="gSignInBtnContainer" style="width:100%;display:flex;justify-content:center;"></div></div><div id="loggedInPanel" style="display:none;"><label class="col-auth-lbl" for="miEmail">Account Email</label><input class="col-auth-inp" id="miEmail" type="email" readonly style="opacity:0.6;cursor:not-allowed;"><label class="col-auth-lbl" for="miName">Display Name</label><input class="col-auth-inp" id="miName" type="text" placeholder="Choose a display name..." maxlength="40"><button type="button" class="col-auth-btn" data-col-mo="save-username" style="margin-bottom:10px;">Save Name</button><button type="button" class="col-auth-danger" data-col-mo="logout">Disconnect Account</button></div><button type="button" class="col-auth-btn" data-col-mo="close" style="margin-top:10px;background:transparent;color:var(--dim,#8891AA);border:1px solid var(--line,rgba(255,255,255,.08));">Close</button></div></div>'
  document.body.appendChild(mo)
  mo.addEventListener('click', function (e) {
    if (e.target === this) {
      window.closeMo()
      return
    }
    const btn = e.target && e.target.closest ? e.target.closest('[data-col-mo]') : null
    if (!btn) return
    const act = btn.getAttribute('data-col-mo')
    if (act === 'save-username' && typeof window.updateUsername === 'function') window.updateUsername()
    else if (act === 'logout' && typeof window.doLogout === 'function') window.doLogout()
    else if (act === 'close') window.closeMo()
  })
}

window.openLogin = function () {
  if (typeof window.openGlobalLogin === 'function') {
    window.openGlobalLogin()
    return
  }
  const mo = document.getElementById('colAuthModal') || document.getElementById('loginMo')
  if (mo) {
    mo.classList.add('open')
    mo.removeAttribute('aria-hidden')
    mo.removeAttribute('inert')
  }
}

window.closeMo = function () {
  if (typeof window.closeGlobalAuth === 'function') window.closeGlobalAuth()
  const mo = document.getElementById('loginMo')
  if (mo) mo.classList.remove('open')
}

;(async function () {
  if (window._colAuthRunning) return
  window._colAuthRunning = true

  const RETURN_TO_KEY = 'col_auth_return_to'
  const ALLOWED_RETURN_AGE_MS = 10 * 60 * 1000
  const OTP_RESEND_SECONDS = 60
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const SVG_EYE_OPEN =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
  const SVG_EYE_OFF =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>'

  let authSyncSeq = 0
  let otpCooldownTimer = null
  let usernameCheckDebounce = null
  let colOtpState = { step: 'send', email: '', cooldownUntil: 0 }

  let authChannel = null
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      authChannel = new BroadcastChannel('col_auth_sync')
      authChannel.onmessage = function (ev) {
        if (!ev || !ev.data || !supabaseClient) return
        if (ev.data.type === 'SIGNED_OUT') {
          window.colUser = null
          clearActiveLocalUser()
          dispatchAuthEvent()
          updateAuthUI()
        } else if (ev.data.type === 'SIGNED_IN' || ev.data.type === 'PROFILE_UPDATED') {
          supabaseClient.auth.getSession().then(function (res) {
            if (res && res.data && res.data.session) {
              applySession(res.data.session, 'SYNC')
            }
          }).catch(function () {})
        }
      }
    }
  } catch (_bcErr) {}

  function broadcastAuth(type) {
    try {
      if (authChannel) authChannel.postMessage({ type: type, ts: Date.now() })
    } catch (_e) {}
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

  function getSafeImageUrl(value) {
    if (!value) return ''
    const raw = String(value).trim()
    if (/^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);/i.test(raw)) return raw
    try {
      const parsed = new URL(raw, window.location.origin)
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'blob:') {
        return parsed.href
      }
    } catch (_e) {}
    return ''
  }

  function getSecureRandomInt(min, max) {
    const range = max - min + 1
    const cryptoObj = globalThis.crypto
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const buf = new Uint32Array(1)
      cryptoObj.getRandomValues(buf)
      return min + (buf[0] % range)
    }
    return Math.floor(min + Math.random() * range)
  }

  function closeAuthModal() {
    clearOtpTimer()
    if (typeof window.closeGlobalAuth === 'function') {
      window.closeGlobalAuth()
      return
    }
    const mo = document.getElementById('colAuthModal')
    if (mo) mo.classList.remove('open')
  }

  function clearActiveLocalUser() {
    const keys = [
      'col_active_local_user',
      'traffic_local_user',
      'trafficSetupComplete',
      'col_user',
      'col_local_accounts'
    ]
    try {
      keys.forEach(function (k) { localStorage.removeItem(k) })
      if (window.ColUserData) {
        try {
          window.ColUserData.clearLocalUser()
          window.ColUserData.clearUser()
        } catch (_ck) {}
      }
      window.colLocalUser = null
      window.colUser = null
    } catch (_e) {}
  }

  window.colLocalUser = null
  window.colClearActiveLocalUser = clearActiveLocalUser
  window.colEscapeHtml = escapeColHtml
  window.colGetSafeImageUrl = getSafeImageUrl

  function ensureAuthUI() {
    try {
      injectAuthStyles()
      injectAuthUI()
    } catch (_e) {}
  }
  if (document.body) ensureAuthUI()
  else document.addEventListener('DOMContentLoaded', ensureAuthUI, { once: true })

  // Resolve canonical CoL Supabase configuration
  let authConfig = null
  try {
    if (window.ColDbConfig && typeof window.ColDbConfig.loadConfig === 'function') {
      authConfig = await window.ColDbConfig.loadConfig()
    }
  } catch (_e) {}

  if (!authConfig) {
    try {
      window.__colConfigPromise =
        window.__colConfigPromise ||
        fetch('/config.json', { signal: AbortSignal.timeout(8000) })
          .then(function (r) { return r.ok ? r.json() : null })
          .catch(function () { return null })
      const config = await window.__colConfigPromise
      if (config && config.auth && config.auth.url && config.auth.key) {
        authConfig = config.auth
      }
    } catch (_e) {}
  }

  if (!authConfig) {
    authConfig = {
      url: 'https://hvukxajztizsuhfubjws.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWt4YWp6dGl6c3VoZnViandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mzc1MTAsImV4cCI6MjA5NjQxMzUxMH0.KqQRkmhuB_rFlzQ2N3NhSQrftmVZgGE3NUuVHYh3aYE'
    }
  }

  if (typeof supabase === 'undefined') {
    const existing = document.querySelector('script[src*="@supabase"]')
    if (!existing) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
      script.onload = function () { initSupabase(authConfig.url, authConfig.key) }
      document.head.appendChild(script)
    } else {
      existing.addEventListener('load', function () { initSupabase(authConfig.url, authConfig.key) }, { once: true })
    }
  } else {
    initSupabase(authConfig.url, authConfig.key)
  }

  function decodeJwtPayload(token) {
    if (!token) return null
    const parts = String(token).split('.')
    if (parts.length < 2) return null
    const payloadStr = decodeURIComponent(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(function (c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2) })
        .join('')
    )
    return JSON.parse(payloadStr)
  }

  window.handleGoogleOneTap = async (response) => {
    if (!response || !response.credential) return
    try {
      const jwt = decodeJwtPayload(response.credential)
      if (jwt) {
        const gGiven = jwt.given_name || ''
        const gFamily = jwt.family_name || ''
        const gFull = (gGiven && gFamily ? gGiven + ' ' + gFamily : gGiven || gFamily || '') || jwt.name || ''
        if (gFull) {
          window._lastGoogleName = gFull
          try {
            sessionStorage.setItem('col_google_full_name', gFull)
            if (gGiven) sessionStorage.setItem('col_google_given_name', gGiven)
            if (gFamily) sessionStorage.setItem('col_google_family_name', gFamily)
          } catch (_e) {}
        }
      }
    } catch (_e) {}

    let client = window.supabaseClient
    if (!client) {
      for (let i = 0; i < 25 && !window.supabaseClient; i++) {
        await new Promise(function (r) { setTimeout(r, 100) })
      }
      client = window.supabaseClient
    }
    if (!client) return

    try {
      const { error } = await client.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential
      })
      if (error) throw error
      closeAuthModal()
      if (typeof window.toast === 'function') window.toast('Signed in with Google', '#22c55e')
    } catch (error) {
      if (typeof window.toast === 'function') {
        window.toast('Google Sign-in failed: ' + (error.message || 'Authentication error'), '#ef4444')
      }
    }
  }

  function clearOneTapCoolDown() {
    try {
      const past = 'Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'g_state=; expires=' + past + '; path=/;'
      document.cookie = 'g_state=; expires=' + past + ';'
    } catch (_e) {}
  }

  function initOneTap() {
    if (window.colUser) return
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
      if (!existing) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = setupOneTap
        document.head.appendChild(script)
      } else {
        existing.addEventListener('load', setupOneTap, { once: true })
      }
    } else {
      setupOneTap()
    }
  }

  function setupOneTap() {
    if (window.colUser) return
    if (window.location.protocol !== 'https:') return
    if (sessionStorage.getItem('col_onetap_dismissed_session')) return

    const path = window.location.pathname.toLowerCase()
    const sp = new URLSearchParams(window.location.search)
    if (path.includes('driving') && (sp.get('screen') === 'levels' || sp.get('lv'))) return

    clearOneTapCoolDown()

    if (!window._gsiInitialized && typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: '500448449044-hv2rp3k0lsok9ara1bred87c75lnsp7l.apps.googleusercontent.com',
        callback: window.handleGoogleOneTap,
        auto_select: false,
        use_fedcm_for_prompt: true,
        itp_support: true
      })
      window._gsiInitialized = true
    }

    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.prompt(function (notification) {
        if (notification && typeof notification.isDismissedMoment === 'function' && notification.isDismissedMoment()) {
          try { sessionStorage.setItem('col_onetap_dismissed_session', '1') } catch (_e) {}
        }
      })
      const container = document.getElementById('gSignInBtnContainer')
      if (container && !window.AndroidBridge && typeof google.accounts.id.renderButton === 'function') {
        container.innerHTML = ''
        google.accounts.id.renderButton(container, { theme: 'filled_black', size: 'large', type: 'standard', shape: 'rectangular', width: 280 })
      }
    }
  }

  window.colPromptGoogleOneTap = function (force) {
    if (force) {
      try { sessionStorage.removeItem('col_onetap_dismissed_session') } catch (_e) {}
      clearOneTapCoolDown()
    }
    initOneTap()
  }

  function scrubAuthParamsFromUrl() {
    try {
      const url = new URL(window.location.href)
      let changed = false
      ;['code', 'error', 'error_code', 'error_description'].forEach(function (k) {
        if (url.searchParams.has(k)) {
          url.searchParams.delete(k)
          changed = true
        }
      })
      if (url.hash && /access_token=|refresh_token=|expires_in=|provider_token=/i.test(url.hash)) {
        url.hash = ''
        changed = true
      }
      if (changed) {
        const cleanHref = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + (url.hash || '')
        window.history.replaceState(window.history.state, '', cleanHref)
      }
    } catch (_e) {}
  }

  function resolveSafeReturnUrl() {
    try {
      const rawReturn = localStorage.getItem(RETURN_TO_KEY) || sessionStorage.getItem(RETURN_TO_KEY)
      if (!rawReturn) return null
      localStorage.removeItem(RETURN_TO_KEY)
      sessionStorage.removeItem(RETURN_TO_KEY)
      const parsed = JSON.parse(rawReturn)
      if (!parsed || !parsed.url || Date.now() - (parsed.ts || 0) > ALLOWED_RETURN_AGE_MS) return null
      const targetUrl = new URL(parsed.url, window.location.origin)
      if (targetUrl.origin !== window.location.origin) return null
      targetUrl.searchParams.delete('code')
      targetUrl.searchParams.delete('error')
      targetUrl.searchParams.delete('error_description')
      const curKey = window.location.pathname + window.location.search
      const tgtKey = targetUrl.pathname + targetUrl.search
      if (curKey === tgtKey) return null
      return targetUrl.href
    } catch (_e) {
      return null
    }
  }

  function resolveColUserDisplayName(user) {
    if (!user) return 'User'
    const cachedGName =
      user.googleFullName ||
      window._lastGoogleName ||
      (function () {
        try { return sessionStorage.getItem('col_google_full_name') || '' } catch (_e) { return '' }
      })()
    const meta = (user.session && user.session.user && user.session.user.user_metadata) || user.user_metadata || {}
    const identities = (user.session && user.session.user && user.session.user.identities) || []
    const gId = identities.find(function (id) { return id.provider === 'google' })
    const gData = (gId && gId.identity_data) || {}
    const given = meta.given_name || gData.given_name || ''
    const family = meta.family_name || gData.family_name || ''
    const gName = cachedGName || (given && family ? given + ' ' + family : given || family || '') || meta.full_name || meta.name || gData.full_name || gData.name || ''

    const rawName = (user.name || '').trim()
    const isPlaceholder = !rawName || rawName.length <= 2 || /^(hh|user|test|guest|anon|admin)$/i.test(rawName)
    if (gName && (isPlaceholder || !rawName.includes(' '))) return gName
    if (!isPlaceholder) return rawName
    if (gName) return gName
    return (user.email && user.email.split('@')[0]) || 'Driver'
  }

  async function applySession(session, event) {
    const seq = ++authSyncSeq
    if (event === 'PASSWORD_RECOVERY') {
      window._colPasswordRecoveryMode = true
      setTimeout(function () {
        if (typeof window.openGlobalLogin === 'function') window.openGlobalLogin()
      }, 150)
    }

    if (session && session.user) {
      if (event === 'SIGNED_IN') {
        const redirectTarget = resolveSafeReturnUrl()
        if (redirectTarget) {
          window.location.replace(redirectTarget)
          return
        }
      }
      scrubAuthParamsFromUrl()

      const meta = session.user.user_metadata || {}
      const appMeta = session.user.app_metadata || {}
      const identities = session.user.identities || []
      const googleIdentity = identities.find(function (id) { return id.provider === 'google' })
      const googleData = (googleIdentity && googleIdentity.identity_data) || {}
      const userId = session.user.id
      const email = session.user.email || ''
      const photo = getSafeImageUrl(meta.avatar_url || meta.picture || googleData.avatar_url || googleData.picture || '')

      const gGiven = meta.given_name || googleData.given_name || ''
      const gFamily = meta.family_name || googleData.family_name || ''
      const gFull =
        (gGiven && gFamily ? gGiven + ' ' + gFamily : gGiven || gFamily || '') ||
        meta.full_name ||
        meta.name ||
        googleData.full_name ||
        googleData.name ||
        window._lastGoogleName ||
        (function () {
          try { return sessionStorage.getItem('col_google_full_name') || '' } catch (_e) { return '' }
        })()

      if (gFull) {
        window._lastGoogleName = gFull
        try { sessionStorage.setItem('col_google_full_name', gFull) } catch (_e) {}
      }

      const displayName = gFull || (email ? email.split('@')[0] : 'Driver')
      const providers = Array.isArray(appMeta.providers) && appMeta.providers.length
        ? appMeta.providers
        : identities.map(function (i) { return i.provider }).filter(Boolean)

      window.colUser = {
        id: userId,
        email: email,
        name: displayName,
        googleFullName: gFull || null,
        picture: photo || null,
        session: session,
        providers: providers,
        emailConfirmed: Boolean(session.user.email_confirmed_at || session.user.confirmed_at),
        uid: null
      }

      if (window.ColUserData) {
        try {
          window.ColUserData.setUser({ id: userId, email: email, name: displayName, picture: photo || null })
        } catch (_ck) {}
      }

      if (!window._cloudProfilesDisabled) {
        try {
          const { data: upProfile, error: upError } = await supabaseClient
            .from('user_profiles')
            .select('id, user_id, display_name, username, preferred_vehicle, age, language, student_id, avatar_url, updated_at')
            .eq('user_id', userId)
            .maybeSingle()

          if (seq !== authSyncSeq) return

          if (upError && (upError.code === '42501' || upError.status === 403 || upError.status === 401 || upError.code === 'PGRST301')) {
            window._cloudProfilesDisabled = true
          } else if (!upError && upProfile) {
            window.colUser.uid = upProfile.id || upProfile.user_id
            window.colUser.profile = upProfile
            window.colUser.username = upProfile.username || window.colUser.username
            window.colUser.vehicle = upProfile.preferred_vehicle || window.colUser.vehicle
            const curName = (upProfile.display_name || '').trim()
            const isPlaceholder = !curName || curName.length <= 2 || /^(hh|user|test|guest)$/i.test(curName)
            const resolved = resolveColUserDisplayName({
              name: curName,
              email: email,
              googleFullName: gFull,
              session: session
            })
            if (resolved && (isPlaceholder || !curName.includes(' '))) {
              window.colUser.name = resolved
            } else if (upProfile.display_name) {
              window.colUser.name = upProfile.display_name
            }
            if (upProfile.avatar_url && !window.colUser.picture) {
              window.colUser.picture = getSafeImageUrl(upProfile.avatar_url) || null
            }
            if (window.ColUserData) {
              try {
                window.ColUserData.setUser({
                  id: userId,
                  email: email,
                  name: window.colUser.name,
                  username: upProfile.username || null,
                  picture: window.colUser.picture
                })
              } catch (_ck) {}
            }
          } else if (!window._cloudProfilesDisabled) {
            const { data: profile, error } = await supabaseClient
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', userId)
              .maybeSingle()
            if (seq !== authSyncSeq) return
            if (error && (error.code === '42501' || error.status === 403 || error.status === 400)) {
              window._cloudProfilesDisabled = true
            } else if (profile) {
              window.colUser.uid = profile.id
              window.colUser.username = profile.username || window.colUser.username
              if (profile.full_name && !meta.full_name) window.colUser.name = profile.full_name
              if (profile.avatar_url && !window.colUser.picture) {
                window.colUser.picture = getSafeImageUrl(profile.avatar_url) || null
              }
            }
          }
        } catch (_e) {
          window._cloudProfilesDisabled = true
        }
      }

      if (event === 'SIGNED_IN') broadcastAuth('SIGNED_IN')
    } else {
      try { localStorage.removeItem('col_user') } catch (_e) {}
      if (window.ColUserData) {
        try { window.ColUserData.clearUser() } catch (_ck) {}
      }
      window.colUser = null
      if (event === 'SIGNED_OUT') broadcastAuth('SIGNED_OUT')
    }

    if (seq !== authSyncSeq) return
    dispatchAuthEvent()
    updateAuthUI()

    if (!session && !window.colUser && !window._oneTapAttempted) {
      window._oneTapAttempted = true
      initOneTap()
    }
  }

  function initSupabase(url, key) {
    supabaseClient = window.supabase.createClient(url, key, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    })
    window.supabaseClient = supabaseClient

    supabaseClient.auth.onAuthStateChange(async function (event, session) {
      await applySession(session, event)
    })

    supabaseClient.auth.getSession().then(function (res) {
      const s = res && res.data ? res.data.session : null
      if (s && !window.colUser) {
        applySession(s, 'INITIAL_SESSION')
      }
    }).catch(function () {})

    injectAuthStyles()
    injectAuthUI()
    dispatchAuthEvent()

    setTimeout(function () {
      if (!window.colUser && !window._oneTapAttempted && !window.AndroidBridge) {
        window._oneTapAttempted = true
        initOneTap()
      }
    }, 1500)
  }

  function dispatchAuthEvent() {
    window.dispatchEvent(new CustomEvent('col-auth-changed', { detail: { user: window.colUser } }))
  }

  function formatUserFriendlyAuthError(err, context) {
    if (!err) return 'Something went wrong. Please try again.'
    const raw = typeof err === 'string' ? err : err.message || ''
    const msg = raw.toLowerCase()
    const code = err.code || ''

    if (code === '23505' || msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists') || msg.includes('already registered')) {
      if (context === 'username' || context === 'profile' || context === 'settings') {
        return 'This username is already taken. Choose a different handle or pick one below.'
      }
      if (msg.includes('user already registered') || context === 'signup') {
        return 'An account with this email already exists. Try Sign In instead.'
      }
      return 'This email or handle is already registered.'
    }
    if (msg.includes('email not confirmed')) {
      return 'Please confirm your email first using the verification link sent to your inbox.'
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Incorrect email or password. Check your details or use Email Code / Reset Password.'
    }
    if (msg.includes('invalid email') || msg.includes('valid email')) {
      return 'Please enter a valid email address.'
    }
    if (context === 'otp_verify' || msg.includes('otp') || msg.includes('token') || msg.includes('verification code')) {
      if (msg.includes('expired')) return 'That 6-digit code expired. Request a fresh code below.'
      return 'Invalid 6-digit code. Double-check the email and try again.'
    }
    if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('security purposes')) {
      return 'Too many attempts in a short time. Please wait a minute and try again.'
    }
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('offline') || msg.includes('timeout')) {
      return 'Network error while reaching authentication servers. Check your connection.'
    }
    if (msg.includes('row-level security') || msg.includes('permission denied')) {
      return 'Your session expired. Please sign in again.'
    }
    if (msg.includes('password') && (msg.includes('least') || msg.includes('short') || msg.includes('characters'))) {
      return 'Password must be at least 8 characters long.'
    }
    if (context === 'otp_send') return 'Could not send a verification code. Verify the email address and retry.'
    return 'Request could not be completed. Please try again.'
  }

  function evaluatePasswordStrength(pw) {
    const val = String(pw || '')
    if (!val) return { score: 0, label: '', color: '#64748b' }
    let score = 0
    if (val.length >= 8) score++
    if (val.length >= 12) score++
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++
    if (/[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val)) score++
    if (val.length < 8) return { score: 1, label: 'Too short (use 8+ characters)', color: '#ef4444' }
    if (score <= 2) return { score: 2, label: 'Fair — add uppercase, numbers or symbols', color: '#f59e0b' }
    if (score === 3) return { score: 3, label: 'Good password', color: '#38bdf8' }
    return { score: 4, label: 'Strong password', color: '#10b981' }
  }

  async function checkUsernameAvailability(rawUsername, currentUserId) {
    if (!rawUsername) return { available: false, error: 'Please enter a username.' }
    let clean = rawUsername.trim()
    if (!clean.startsWith('@')) clean = '@' + clean
    clean = '@' + clean.slice(1).replace(/[^a-zA-Z0-9_]/g, '')
    const namePart = clean.slice(1)
    if (namePart.length < 3) return { available: false, error: 'Username must be at least 3 characters.', username: clean }
    if (namePart.length > 30) return { available: false, error: 'Username cannot exceed 30 characters.', username: clean }
    if (!supabaseClient) return { available: true, username: clean }

    try {
      const { data: dirRows } = await supabaseClient.rpc('public_profile_directory', { p_search: clean, p_limit: 50 })
      const wanted = [clean.toLowerCase(), namePart.toLowerCase()]
      const taken = (dirRows || []).some(function (p) {
        return p.user_id !== currentUserId && p.username && wanted.includes(String(p.username).toLowerCase())
      })
      if (taken) {
        return {
          available: false,
          error: 'This username is already taken.',
          suggestions: generateUsernameSuggestions(namePart),
          username: clean
        }
      }
    } catch (_e) {}
    return { available: true, username: clean }
  }

  function generateUsernameSuggestions(base) {
    const clean = (base || 'Learner').replace(/[^a-zA-Z0-9_]/g, '') || 'Learner'
    const rand = getSecureRandomInt(10, 99)
    return ['@' + clean + '_' + rand, '@' + clean + '_IND', '@' + clean + '_COL']
  }

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

    if (val.slice(1).length < 3) {
      if (statusEl) {
        statusEl.textContent = val.length <= 1 ? '' : 'Username must be at least 3 characters.'
        statusEl.style.color = 'var(--dim, #8891AA)'
      }
      if (suggBox) suggBox.style.display = 'none'
      if (btn) btn.disabled = true
      return
    }

    if (statusEl) {
      statusEl.textContent = 'Checking availability...'
      statusEl.style.color = 'var(--dim, #8891AA)'
    }

    if (usernameCheckDebounce) clearTimeout(usernameCheckDebounce)
    usernameCheckDebounce = setTimeout(async function () {
      const currentId = window.colUser ? window.colUser.id : null
      const res = await checkUsernameAvailability(val, currentId)
      if (res.available) {
        if (statusEl) {
          statusEl.textContent = 'Username available'
          statusEl.style.color = '#10b981'
        }
        if (suggBox) suggBox.style.display = 'none'
        if (btn) btn.disabled = false
      } else {
        if (statusEl) {
          statusEl.textContent = res.error || 'Username taken'
          statusEl.style.color = '#ef4444'
        }
        if (btn) btn.disabled = true
        if (res.suggestions && res.suggestions.length && suggBox && suggList) {
          suggList.innerHTML = res.suggestions.map(function (s) {
            return '<button type="button" class="col-uname-chip" data-col-action="pick-suggestion" data-suggestion="' + escapeColHtml(s) + '">' + escapeColHtml(s) + '</button>'
          }).join('')
          suggBox.style.display = 'block'
        }
      }
    }, 280)
  }

  window._pickUsernameSuggestion = function (suggestion) {
    const input = document.getElementById('profileUsername') || document.getElementById('colSettingUsername')
    if (input) {
      input.value = suggestion
      if (typeof window._onUsernameInput === 'function') window._onUsernameInput(input)
      input.focus()
    }
  }

  function injectAuthStyles() {
    if (document.getElementById('col-auth-styles')) return
    const style = document.createElement('style')
    style.id = 'col-auth-styles'
    style.textContent = `
      .col-auth-mo {
        position: fixed;
        inset: 0;
        background: rgba(3, 6, 14, 0.78);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease;
        contain: strict;
      }
      .col-auth-mo:not(.open) { display: none !important; pointer-events: none !important; }
      .col-auth-mo.open { opacity: 1; pointer-events: auto; display: flex !important; }
      .col-auth-md {
        background: #0f172a;
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 22px;
        width: 92%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        transform: translateY(14px) scale(0.98);
        transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 28px 70px rgba(0, 0, 0, 0.7);
        color: #f8fafc;
        font-family: var(--sans, 'Inter', system-ui, -apple-system, sans-serif);
        box-sizing: border-box;
      }
      .col-auth-mo.open .col-auth-md { transform: translateY(0) scale(1); }
      .col-auth-hd { padding: 28px 26px 18px; border-bottom: 1px solid rgba(148, 163, 184, 0.14); text-align: center; position: relative; }
      .col-auth-hd h2 { font-size: 1.7rem; font-weight: 700; margin: 0; color: #f8fafc; letter-spacing: -0.02em; font-family: var(--serif, 'Fraunces', Georgia, serif); }
      .col-auth-hd p { font-size: 0.86rem; color: #94a3b8; margin: 6px 0 0; line-height: 1.45; }
      .col-auth-close {
        position: absolute; top: 16px; right: 16px;
        background: rgba(148, 163, 184, 0.1);
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #cbd5e1;
        width: 34px; height: 34px;
        border-radius: 50%;
        font-size: 1.2rem;
        display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: background 0.16s ease, color 0.16s ease;
      }
      .col-auth-close:hover { background: rgba(148, 163, 184, 0.2); color: #ffffff; }
      .col-auth-body { padding: 22px 26px 26px; }
      .col-auth-lbl { display: block; margin-bottom: 6px; color: #cbd5e1; font-size: 0.8rem; font-weight: 600; text-align: left; }
      .col-auth-inp {
        width: 100%; padding: 11px 14px;
        border: 1.5px solid rgba(148, 163, 184, 0.24);
        border-radius: 12px;
        font-size: 0.92rem;
        margin-bottom: 14px;
        color: #f8fafc;
        background: #1e293b;
        font-family: inherit;
        box-sizing: border-box;
        transition: border-color 0.16s ease, box-shadow 0.16s ease;
      }
      .col-auth-inp:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2); }
      .col-pass-wrap { position: relative; margin-bottom: 14px; }
      .col-pass-wrap .col-auth-inp { margin-bottom: 0; padding-right: 44px; }
      .col-pass-eye {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: transparent; border: none; color: #94a3b8;
        cursor: pointer; padding: 6px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px;
      }
      .col-pass-eye:hover { color: #f8fafc; background: rgba(148, 163, 184, 0.12); }
      .col-pw-meter { margin: -6px 0 14px; }
      .col-pw-bar-track { height: 4px; background: rgba(148, 163, 184, 0.2); border-radius: 99px; overflow: hidden; margin-bottom: 5px; }
      .col-pw-bar-fill { height: 100%; width: 0%; border-radius: 99px; transition: width 0.2s ease, background-color 0.2s ease; }
      .col-pw-bar-txt { font-size: 0.74rem; color: #94a3b8; text-align: left; min-height: 16px; }
      .col-auth-links-row { display: flex; justify-content: space-between; align-items: center; margin: -6px 0 14px; font-size: 0.8rem; }
      .col-auth-link { background: none; border: none; color: #f59e0b; font-weight: 600; cursor: pointer; padding: 0; font-family: inherit; font-size: 0.8rem; }
      .col-auth-link:hover { text-decoration: underline; }
      .col-auth-link:disabled { opacity: 0.55; cursor: not-allowed; text-decoration: none; }
      .col-auth-btn {
        width: 100%; padding: 12px 16px;
        background: #f59e0b; border: none; border-radius: 12px;
        font-weight: 700; font-size: 0.94rem; cursor: pointer; color: #0f172a;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: filter 0.15s ease, transform 0.15s ease;
        font-family: inherit; box-sizing: border-box;
      }
      .col-auth-btn:hover:not(:disabled) { filter: brightness(1.06); }
      .col-auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .col-auth-btn.is-verified { background: #10b981 !important; color: #ffffff !important; }
      .col-auth-danger {
        width: 100%; padding: 11px 16px;
        background: transparent; border: 1px solid rgba(239, 68, 68, 0.45);
        border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; color: #ef4444;
        font-family: inherit; box-sizing: border-box;
      }
      .col-auth-danger:hover { background: rgba(239, 68, 68, 0.12); }
      .col-auth-gbtn {
        width: 100%; padding: 11px 16px;
        background: #1e293b; border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 12px; font-weight: 600; font-size: 0.92rem; cursor: pointer; color: #f8fafc;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        margin-bottom: 16px; font-family: inherit; box-sizing: border-box;
      }
      .col-auth-gbtn:hover { background: #334155; }
      .col-auth-div { display: flex; align-items: center; color: #64748b; font-size: 0.72rem; margin-bottom: 16px; font-weight: 700; letter-spacing: 0.08em; }
      .col-auth-div::before, .col-auth-div::after { content: ''; flex: 1; border-bottom: 1px solid rgba(148, 163, 184, 0.16); }
      .col-auth-div::before { margin-right: 12px; }
      .col-auth-div::after { margin-left: 12px; }
      .col-auth-tab-group { display: flex; gap: 4px; margin-bottom: 16px; background: #1e293b; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 12px; padding: 4px; }
      .col-auth-tab { flex: 1; text-align: center; padding: 9px 8px; border-radius: 9px; font-size: 0.84rem; font-weight: 600; color: #94a3b8; cursor: pointer; border: 1px solid transparent; background: transparent; font-family: inherit; }
      .col-auth-tab.active { background: #0f172a; border-color: rgba(245, 158, 11, 0.4); color: #f59e0b; }
      .col-otp-guide { font-size: 0.8rem; color: #cbd5e1; background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; line-height: 1.5; text-align: left; }
      .col-auth-msg { font-size: 0.83rem; padding: 9px 12px; border-radius: 10px; margin-bottom: 12px; text-align: left; line-height: 1.45; display: none; }
      .col-auth-msg.err { display: block; background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(239, 68, 68, 0.32); color: #fca5a5; }
      .col-auth-msg.ok { display: block; background: rgba(16, 185, 129, 0.14); border: 1px solid rgba(16, 185, 129, 0.32); color: #6ee7b7; }
      .col-auth-msg.info { display: block; background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.32); color: #fcd34d; }
      .col-otp-grid { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 16px 0 18px; }
      .col-otp-cell {
        width: 42px; height: 50px; border-radius: 11px;
        background: #1e293b; border: 1.5px solid rgba(148, 163, 184, 0.25);
        color: #f8fafc; font-size: 1.4rem; font-weight: 800; font-family: var(--mono, monospace); text-align: center; outline: none;
      }
      .col-otp-cell:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.22); }
      .col-otp-cell.filled { border-color: rgba(245, 158, 11, 0.55); }
      .col-otp-divider { font-size: 1.3rem; font-weight: 800; color: #64748b; user-select: none; }
      .col-otp-grid.is-wrong .col-otp-cell { border-color: #ef4444; background: rgba(239, 68, 68, 0.16); }
      .col-otp-grid.is-success .col-otp-cell { border-color: #10b981; background: rgba(16, 185, 129, 0.16); }
      .col-av-chip { padding: 6px 11px; border-radius: 20px; font-size: 0.74rem; font-weight: 700; cursor: pointer; border: 1px solid rgba(148, 163, 184, 0.25); background: rgba(148, 163, 184, 0.1); color: inherit; font-family: inherit; }
      .col-av-preset { width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid rgba(148, 163, 184, 0.25); display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; color: #ffffff; cursor: pointer; }
      .col-uname-chip { background: rgba(245, 158, 11, 0.14); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 20px; padding: 4px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; }

      /* Light Mode parity (html.lm + body.lm) */
      body.lm .col-auth-md, html.lm .col-auth-md { background: #ffffff; border-color: #cbd5e1; color: #0f172a; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18); }
      body.lm .col-auth-hd, html.lm .col-auth-hd { border-bottom-color: #e2e8f0; }
      body.lm .col-auth-hd h2, html.lm .col-auth-hd h2 { color: #0f172a; }
      body.lm .col-auth-hd p, html.lm .col-auth-hd p { color: #475569; }
      body.lm .col-auth-lbl, html.lm .col-auth-lbl { color: #334155; }
      body.lm .col-auth-inp, html.lm .col-auth-inp { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
      body.lm .col-auth-inp:focus, html.lm .col-auth-inp:focus { background: #ffffff; border-color: #b45309; }
      body.lm .col-auth-gbtn, html.lm .col-auth-gbtn { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
      body.lm .col-auth-gbtn:hover, html.lm .col-auth-gbtn:hover { background: #f1f5f9; }
      body.lm .col-auth-tab-group, html.lm .col-auth-tab-group { background: #f1f5f9; border-color: #cbd5e1; }
      body.lm .col-auth-tab, html.lm .col-auth-tab { color: #475569; }
      body.lm .col-auth-tab.active, html.lm .col-auth-tab.active { background: #ffffff; color: #b45309; border-color: #f59e0b; }
      body.lm .col-otp-cell, html.lm .col-otp-cell { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
      body.lm .col-otp-guide, html.lm .col-otp-guide { background: #f8fafc; border-color: #cbd5e1; color: #334155; }
      body.lm .col-auth-close, html.lm .col-auth-close { background: #f1f5f9; border-color: #cbd5e1; color: #475569; }
      body.lm .col-auth-link, html.lm .col-auth-link { color: #b45309; }
      body.lm .col-auth-btn, html.lm .col-auth-btn { background: #d97706; color: #ffffff; }
      body.lm .col-auth-msg.err, html.lm .col-auth-msg.err { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
      body.lm .col-auth-msg.ok, html.lm .col-auth-msg.ok { color: #047857; background: #ecfdf5; border-color: #a7f3d0; }
      body.lm .col-auth-msg.info, html.lm .col-auth-msg.info { color: #92400e; background: #fffbeb; border-color: #fde68a; }
      body.lm .col-pass-eye, html.lm .col-pass-eye { color: #475569; }
      body.lm .col-pass-eye:hover, html.lm .col-pass-eye:hover { color: #0f172a; background: #e2e8f0; }

      .nav-login-btn { display: flex; align-items: center; gap: 8px; background: transparent; color: var(--page-theme, var(--signal, #F2B84B)); border: 1px solid var(--page-theme, var(--signal, #F2B84B)); padding: 8px 20px; border-radius: 30px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: 0.2s; text-decoration: none; }
      .nav-user-profile { display: none; align-items: center; gap: 10px; padding: 5px 15px 5px 5px; background: transparent; border: 1px solid var(--lineb, rgba(255,255,255,.16)); border-radius: 30px; cursor: pointer; }
      .nav-user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--page-theme, var(--signal, #F2B84B)); color: #070a14; display: flex; justify-content: center; align-items: center; font-weight: 800; overflow: hidden; }
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
          <button type="button" class="col-auth-close" data-col-action="close-auth" aria-label="Close login dialog">&times;</button>
          <h2 id="colAuthTitle">Sign In</h2>
          <p id="colAuthSub">Sign in with Google or Email to sync your progress across devices.</p>
        </div>
        <div class="col-auth-body" id="colAuthBody"></div>
      </div>
    `
    document.body.appendChild(modal)

    modal.addEventListener('click', function (e) {
      if (e.target === this) {
        closeAuthModal()
        return
      }
      const target = e.target && e.target.closest ? e.target.closest('[data-col-action]') : null
      if (!target) return
      const act = target.getAttribute('data-col-action')
      if (act === 'close-auth') closeAuthModal()
      else if (act === 'logout') window.colDoLogout()
      else if (act === 'google') window.colDoGoogle()
      else if (act === 'tab') window._renderAuthTab(target.getAttribute('data-tab'))
      else if (act === 'otp-resend') window._handleColOtpSend(null)
      else if (act === 'otp-reset') window._handleColOtpReset()
      else if (act === 'toggle-pass') window._toggleAuthPassVis(target)
      else if (act === 'saved-passwords') window._promptSavedPasswordPicker()
      else if (act === 'forgot-pass') window._renderAuthTab('reset')
      else if (act === 'reset-avatar') window._resetToDefaultAvatar()
      else if (act === 'pick-suggestion') window._pickUsernameSuggestion(target.getAttribute('data-suggestion'))
      else if (act === 'pick-letter') {
        window._pickLetterAvatar(target.getAttribute('data-c1'), target.getAttribute('data-c2'), target.getAttribute('data-tc'))
      } else if (act === 'pick-badge') {
        window._pickPresetAvatar(target.getAttribute('data-glyph'), target.getAttribute('data-c1'), target.getAttribute('data-c2'))
      } else if (act === 'restore-google-name') {
        const gn = target.getAttribute('data-gn') || ''
        const inp = document.getElementById('colSettingName')
        if (gn && inp) inp.value = gn
      }
    })

    modal.addEventListener('submit', function (e) {
      const form = e.target && e.target.closest ? e.target.closest('[data-col-submit]') : null
      if (!form) return
      const kind = form.getAttribute('data-col-submit')
      if (kind === 'save-settings') window._handleSaveAccountSettings(e)
      else if (kind === 'otp-verify') window._handleColOtpVerify(e)
      else if (kind === 'otp-send') window._handleColOtpSend(e)
      else if (kind === 'reset-request') window._handleColResetRequest(e)
      else if (kind === 'update-password') window._handleColUpdatePassword(e)
      else if (kind === 'auth-form') window._handleColAuthSubmit(e, form.getAttribute('data-mode') || 'login')
    })

    modal.addEventListener('input', function (e) {
      const inp = e.target && e.target.closest ? e.target.closest('[data-col-input]') : null
      if (!inp) return
      const kind = inp.getAttribute('data-col-input')
      if (kind === 'profile-username') window._onUsernameInput(inp)
      else if (kind === 'setting-username') window._onSettingUsernameInput(inp)
      else if (kind === 'setting-avatar-url') window._onSettingAvatarUrlInput(inp)
      else if (kind === 'pw-strength') updatePasswordMeter(inp.value, inp.getAttribute('data-meter') || 'colPwMeter')
    })

    modal.addEventListener('change', function (e) {
      const inp = e.target && e.target.closest ? e.target.closest('[data-col-change]') : null
      if (inp && inp.getAttribute('data-col-change') === 'avatar-upload') {
        window._handleAvatarUpload(inp)
      }
    })

    window.closeGlobalAuth = function () {
      clearOtpTimer()
      const mo = document.getElementById('colAuthModal')
      if (mo) {
        mo.classList.remove('open')
        mo.setAttribute('aria-hidden', 'true')
        mo.setAttribute('inert', '')
      }
    }

    window.openGlobalLogin = function () {
      renderAuthPanel()
      const mo = document.getElementById('colAuthModal')
      if (mo) {
        mo.classList.add('open')
        mo.removeAttribute('aria-hidden')
        mo.removeAttribute('inert')
        setTimeout(function () {
          const f = mo.querySelector('.col-auth-body input:not([type="hidden"]), .col-auth-body button')
          if (f) f.focus()
        }, 80)
      }
    }
    window.openLogin = window.openGlobalLogin

    window.openAccountSettings = function () {
      if (!window.colUser) {
        window.openGlobalLogin()
        return
      }
      renderAuthPanel('settings')
      const mo = document.getElementById('colAuthModal')
      if (mo) {
        mo.classList.add('open')
        mo.removeAttribute('aria-hidden')
        mo.removeAttribute('inert')
      }
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        window.closeGlobalAuth()
      }
    })

    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return
      const focusable = modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    })
  }

  function updatePasswordMeter(val, meterId) {
    const meter = document.getElementById(meterId)
    if (!meter) return
    const fill = meter.querySelector('.col-pw-bar-fill')
    const txt = meter.querySelector('.col-pw-bar-txt')
    const res = evaluatePasswordStrength(val)
    if (fill) {
      fill.style.width = (res.score * 25) + '%'
      fill.style.backgroundColor = res.color
    }
    if (txt) {
      txt.textContent = res.label
      txt.style.color = val ? res.color : '#94a3b8'
    }
  }

  function clearOtpTimer() {
    if (otpCooldownTimer) {
      clearInterval(otpCooldownTimer)
      otpCooldownTimer = null
    }
  }

  function startOtpCooldownUi() {
    clearOtpTimer()
    const btn = document.getElementById('colOtpResendBtn')
    if (!btn) return
    function tick() {
      const rem = Math.ceil((colOtpState.cooldownUntil - Date.now()) / 1000)
      if (rem > 0) {
        btn.disabled = true
        btn.textContent = 'Resend code in ' + rem + 's'
      } else {
        btn.disabled = false
        btn.textContent = 'Resend Code'
        clearOtpTimer()
      }
    }
    tick()
    otpCooldownTimer = setInterval(tick, 1000)
  }

  window._initOtpInputs = function () {
    const grid = document.getElementById('colOtpGrid')
    if (!grid) return
    const cells = Array.from(grid.querySelectorAll('.col-otp-cell'))
    const hiddenToken = document.getElementById('colOtpToken')

    function syncToken(autoSubmit) {
      const val = cells.map(function (c) { return c.value }).join('')
      if (hiddenToken) hiddenToken.value = val
      cells.forEach(function (c) { c.classList.toggle('filled', Boolean(c.value)) })
      if (autoSubmit && val.length === 6 && typeof window._handleColOtpVerify === 'function') {
        window._handleColOtpVerify()
      }
    }

    cells.forEach(function (cell, idx) {
      cell.addEventListener('input', function (e) {
        const val = e.target.value.replace(/[^0-9]/g, '')
        e.target.value = val.slice(-1)
        syncToken(false)
        if (e.target.value && idx < cells.length - 1) {
          cells[idx + 1].focus()
          cells[idx + 1].select()
        } else if (idx === cells.length - 1 && e.target.value) {
          syncToken(true)
        }
      })
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace') {
          if (!cell.value && idx > 0) {
            cells[idx - 1].focus()
            cells[idx - 1].value = ''
            syncToken(false)
            e.preventDefault()
          } else {
            cell.value = ''
            syncToken(false)
          }
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          cells[idx - 1].focus()
          e.preventDefault()
        } else if (e.key === 'ArrowRight' && idx < cells.length - 1) {
          cells[idx + 1].focus()
          e.preventDefault()
        }
      })
      cell.addEventListener('paste', function (e) {
        e.preventDefault()
        const text = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6)
        if (!text) return
        text.split('').forEach(function (ch, i) {
          if (cells[i]) cells[i].value = ch
        })
        syncToken(text.length === 6)
      })
    })

    setTimeout(function () {
      const firstEmpty = cells.find(function (c) { return !c.value }) || cells[0]
      if (firstEmpty) firstEmpty.focus()
    }, 50)
  }

  function showAuthMessage(elId, type, text) {
    const el = document.getElementById(elId)
    if (!el) return
    el.className = 'col-auth-msg ' + (type || 'err')
    el.textContent = text
  }

  function renderAuthPanel(tab) {
    clearOtpTimer()
    const activeTab = tab || 'login'
    const body = document.getElementById('colAuthBody')
    if (!body) return
    const hdTitle = document.getElementById('colAuthTitle')
    const hdSub = document.getElementById('colAuthSub')

    if (window.colUser && window._colPasswordRecoveryMode) {
      if (hdTitle) hdTitle.textContent = 'Set New Password'
      if (hdSub) hdSub.textContent = 'Create a strong new password for your account.'
      body.innerHTML = `
        <div id="colAuthError" class="col-auth-msg" role="alert" aria-live="polite"></div>
        <form id="colResetCompleteForm" data-col-submit="update-password">
          <input type="text" name="username" autocomplete="username" value="${escapeColHtml(window.colUser.email || '')}" style="display:none;" readonly>
          <label class="col-auth-lbl" for="colResetNewPass">New Password (Min 8 Characters)</label>
          <div class="col-pass-wrap">
            <input type="password" name="new-password" id="colResetNewPass" data-col-input="pw-strength" data-meter="colResetPwMeter" class="col-auth-inp" placeholder="At least 8 characters" required minlength="8" autocomplete="new-password">
            <button type="button" class="col-pass-eye" data-col-action="toggle-pass" data-target="colResetNewPass" aria-label="Show password" aria-pressed="false">${SVG_EYE_OPEN}</button>
          </div>
          <div id="colResetPwMeter" class="col-pw-meter"><div class="col-pw-bar-track"><div class="col-pw-bar-fill"></div></div><div class="col-pw-bar-txt"></div></div>
          <label class="col-auth-lbl" for="colResetConfirmPass">Confirm Password</label>
          <div class="col-pass-wrap">
            <input type="password" name="confirm-password" id="colResetConfirmPass" class="col-auth-inp" placeholder="Re-enter new password" required minlength="8" autocomplete="new-password">
            <button type="button" class="col-pass-eye" data-col-action="toggle-pass" data-target="colResetConfirmPass" aria-label="Show password" aria-pressed="false">${SVG_EYE_OPEN}</button>
          </div>
          <button type="submit" class="col-auth-btn" id="colResetNewPassBtn">Update Password &amp; Continue</button>
        </form>
      `
      return
    }

    if (window.colUser) {
      const currentVeh = window.colUser.vehicle || (window.colUser.user_metadata && window.colUser.user_metadata.preferred_vehicle) || 'Car'
      const resolvedName = resolveColUserDisplayName(window.colUser)
      window.colUser.name = resolvedName

      if (activeTab === 'settings') {
        if (hdTitle) hdTitle.textContent = 'Account Settings'
        if (hdSub) hdSub.textContent = 'Manage your display profile, avatar, and password.'
        const curPic = getSafeImageUrl(window.colUser.picture)
        const userInitial = escapeColHtml(((resolvedName || window.colUser.username || '?').replace(/^@/, '').charAt(0) || '?').toUpperCase())

        body.innerHTML = `
          <div style="text-align:left;">
            <button type="button" class="col-auth-link" data-col-action="tab" data-tab="profile" style="margin-bottom:14px;">&larr; Back to Profile</button>
            <div id="colSettingsFeedback" class="col-auth-msg" role="status" aria-live="polite"></div>
            <form id="colSettingsForm" data-col-submit="save-settings">
              <div style="margin-bottom:16px;padding:12px;border:1px solid rgba(148,163,184,0.2);border-radius:14px;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                  <div id="colSettingAvatarPreview" style="width:62px;height:62px;border-radius:50%;background:#f59e0b;display:flex;justify-content:center;align-items:center;font-size:1.5rem;overflow:hidden;color:#0f172a;font-weight:800;flex-shrink:0;">
                    ${curPic ? `<img src="${escapeColHtml(curPic)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:block;">` : userInitial}
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:0.84rem;font-weight:700;margin-bottom:6px;">Profile Photo</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                      <label for="colSettingPicFile" class="col-av-chip">Upload Image
                        <input type="file" id="colSettingPicFile" data-col-change="avatar-upload" accept="image/*" style="display:none;">
                      </label>
                      <button type="button" class="col-av-chip" data-col-action="reset-avatar">Reset</button>
                    </div>
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                  <button type="button" class="col-av-chip" data-col-action="pick-letter" data-c1="#F2B84B" data-c2="#E65100" data-tc="#070A14" style="background:#F2B84B;color:#070A14;border:none;">Gold</button>
                  <button type="button" class="col-av-chip" data-col-action="pick-letter" data-c1="#5ED4F5" data-c2="#0284C7" data-tc="#070A14" style="background:#5ED4F5;color:#070A14;border:none;">Cyan</button>
                  <button type="button" class="col-av-chip" data-col-action="pick-letter" data-c1="#10B981" data-c2="#047857" data-tc="#ffffff" style="background:#10B981;color:#fff;border:none;">Emerald</button>
                  <button type="button" class="col-av-preset" data-col-action="pick-badge" data-glyph="GT" data-c1="#EF4444" data-c2="#991B1B" style="background:#EF4444;">GT</button>
                  <button type="button" class="col-av-preset" data-col-action="pick-badge" data-glyph="BS" data-c1="#10B981" data-c2="#047857" style="background:#10B981;">BS</button>
                  <button type="button" class="col-av-preset" data-col-action="pick-badge" data-glyph="MP" data-c1="#8B5CF6" data-c2="#6D28D9" style="background:#8B5CF6;">MP</button>
                </div>
                <input type="url" id="colSettingAvatar" data-col-input="setting-avatar-url" class="col-auth-inp" style="margin-bottom:0;" placeholder="Or image URL (https://...)" value="${escapeColHtml(curPic)}">
                <input type="hidden" id="colSettingAvatarVal" value="${escapeColHtml(curPic)}">
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <label class="col-auth-lbl" for="colSettingName" style="margin-bottom:0;">Display Name</label>
                ${window.colUser.googleFullName ? `<button type="button" class="col-auth-link" data-col-action="restore-google-name" data-gn="${escapeColHtml(window.colUser.googleFullName)}">Use Google Name</button>` : ''}
              </div>
              <input type="text" id="colSettingName" class="col-auth-inp" value="${escapeColHtml(resolvedName)}" required maxlength="40">

              <label class="col-auth-lbl" for="colSettingUsername">Username (Public Handle)</label>
              <input type="text" id="colSettingUsername" data-col-input="setting-username" class="col-auth-inp" placeholder="@username" value="${escapeColHtml(window.colUser.username || '')}" maxlength="30" style="margin-bottom:4px;">
              <div id="colSettingUsernameStatus" style="font-size:0.78rem;font-weight:600;min-height:18px;margin-bottom:10px;"></div>

              <label class="col-auth-lbl" for="colSettingVehicle">Preferred Vehicle</label>
              <select id="colSettingVehicle" class="col-auth-inp">
                <option value="Car" ${currentVeh === 'Car' ? 'selected' : ''}>Standard Car</option>
                <option value="Auto" ${currentVeh === 'Auto' ? 'selected' : ''}>Auto Rickshaw</option>
                <option value="Bus" ${currentVeh === 'Bus' ? 'selected' : ''}>BEST City Bus</option>
                <option value="Bike" ${currentVeh === 'Bike' ? 'selected' : ''}>Motorcycle</option>
                <option value="Truck" ${currentVeh === 'Truck' ? 'selected' : ''}>Heavy Truck</option>
              </select>

              <label class="col-auth-lbl" for="colSettingPassword">Update Password (Optional)</label>
              <div class="col-pass-wrap">
                <input type="password" id="colSettingPassword" data-col-input="pw-strength" data-meter="colSettingPwMeter" class="col-auth-inp" placeholder="Leave blank to keep current password" minlength="8" autocomplete="new-password">
                <button type="button" class="col-pass-eye" data-col-action="toggle-pass" data-target="colSettingPassword" aria-label="Show password" aria-pressed="false">${SVG_EYE_OPEN}</button>
              </div>
              <div id="colSettingPwMeter" class="col-pw-meter"><div class="col-pw-bar-track"><div class="col-pw-bar-fill"></div></div><div class="col-pw-bar-txt"></div></div>

              <button type="submit" class="col-auth-btn" id="colSaveSettingsBtn">Save Changes</button>
            </form>
          </div>
        `
        return
      }

      if (hdTitle) hdTitle.textContent = 'Account'
      if (hdSub) hdSub.textContent = 'Signed in and syncing cleanly across devices.'
      const providers = Array.isArray(window.colUser.providers) && window.colUser.providers.length ? window.colUser.providers : ['email']
      const providerBadges = providers.map(function (p) {
        return '<span style="padding:3px 10px;border-radius:20px;font-size:0.74rem;font-weight:700;background:rgba(16,185,129,0.14);color:#10b981;border:1px solid rgba(16,185,129,0.3);">' + escapeColHtml(p.toUpperCase()) + ' Verified</span>'
      }).join('')

      body.innerHTML = `
        <div style="text-align:center;margin-bottom:20px;">
          <div style="width:74px;height:74px;border-radius:50%;background:#f59e0b;margin:0 auto 12px;display:flex;justify-content:center;align-items:center;font-size:1.8rem;overflow:hidden;color:#0f172a;font-weight:800;">
            ${getSafeImageUrl(window.colUser.picture) ? `<img src="${escapeColHtml(getSafeImageUrl(window.colUser.picture))}" alt="${escapeColHtml(resolvedName)}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;display:block;">` : escapeColHtml((resolvedName || '?').charAt(0).toUpperCase())}
          </div>
          <h3 style="margin:0 0 4px;font-size:1.2rem;font-weight:700;">${escapeColHtml(resolvedName)}</h3>
          <p style="font-size:0.86rem;opacity:0.75;margin:0 0 10px;text-transform:none !important;">${escapeColHtml((window.colUser.email || '').toLowerCase())}</p>
          <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;">${providerBadges}</div>
        </div>
        <button type="button" class="col-auth-btn" data-col-action="tab" data-tab="settings" style="margin-bottom:10px;">Account &amp; Password Settings</button>
        <button type="button" class="col-auth-danger" data-col-action="logout">Sign Out</button>
      `
      return
    }

    if (hdTitle) hdTitle.textContent = activeTab === 'reset' ? 'Reset Password' : 'Sign In'
    if (hdSub) {
      hdSub.textContent = activeTab === 'reset'
        ? 'Enter your email and we will send a password reset link.'
        : 'Sign in with Google or Email to sync your progress across devices.'
    }

    const isLogin = activeTab === 'login'
    const isOtp = activeTab === 'otp'
    const isSignup = activeTab === 'signup'
    const isReset = activeTab === 'reset'

    body.innerHTML = `
      <button type="button" class="col-auth-gbtn" data-col-action="google">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>
      <div class="col-auth-div">OR EMAIL</div>
      <div class="col-auth-tab-group" role="tablist">
        <button type="button" role="tab" aria-selected="${isLogin || isReset}" class="col-auth-tab ${isLogin || isReset ? 'active' : ''}" data-col-action="tab" data-tab="login">Sign In</button>
        <button type="button" role="tab" aria-selected="${isOtp}" class="col-auth-tab ${isOtp ? 'active' : ''}" data-col-action="tab" data-tab="otp">Email Code</button>
        <button type="button" role="tab" aria-selected="${isSignup}" class="col-auth-tab ${isSignup ? 'active' : ''}" data-col-action="tab" data-tab="signup">Register</button>
      </div>
      <div id="colAuthError" class="col-auth-msg" role="alert" aria-live="polite"></div>

      ${isReset ? `
        <form id="colAuthResetForm" data-col-submit="reset-request">
          <div class="col-otp-guide">Enter your account email below. We will send a reset link that brings you back to this page to set a new password.</div>
          <label class="col-auth-lbl" for="colResetEmail">Account Email</label>
          <input type="email" name="email" id="colResetEmail" class="col-auth-inp" placeholder="name@example.com" required autocomplete="email">
          <button type="submit" class="col-auth-btn" id="colResetSendBtn">Send Password Reset Link</button>
          <div style="text-align:center;margin-top:12px;">
            <button type="button" class="col-auth-link" data-col-action="tab" data-tab="login">&larr; Back to Sign In</button>
          </div>
        </form>
      ` : isOtp ? (colOtpState.step === 'verify' ? `
        <form id="colAuthOtpVerifyForm" data-col-submit="otp-verify">
          <div class="col-otp-guide">
            <strong>How to verify:</strong>
            <div style="margin-top:4px;">1. Check the email sent to <strong>${escapeColHtml((colOtpState.email || '').toLowerCase())}</strong> (including Spam/Promotions).</div>
            <div>2. Type or paste the <strong>6-digit code</strong> below, or click the sign-in link inside the email.</div>
          </div>
          <div class="col-otp-grid" id="colOtpGrid">
            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="col-otp-cell" data-idx="0" autocomplete="one-time-code" aria-label="Digit 1">
            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="col-otp-cell" data-idx="1" autocomplete="off" aria-label="Digit 2">
            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="col-otp-cell" data-idx="2" autocomplete="off" aria-label="Digit 3">
            <div class="col-otp-divider">&bull;</div>
            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="col-otp-cell" data-idx="3" autocomplete="off" aria-label="Digit 4">
            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="col-otp-cell" data-idx="4" autocomplete="off" aria-label="Digit 5">
            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="col-otp-cell" data-idx="5" autocomplete="off" aria-label="Digit 6">
          </div>
          <input type="hidden" id="colOtpToken" required>
          <button type="submit" class="col-auth-btn" id="colOtpVerifyBtn">Verify Code &amp; Sign In</button>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
            <button type="button" id="colOtpResendBtn" class="col-auth-link" data-col-action="otp-resend">Resend Code</button>
            <button type="button" class="col-auth-link" style="opacity:0.75;" data-col-action="otp-reset">Use Different Email</button>
          </div>
        </form>
      ` : `
        <form id="colAuthOtpSendForm" data-col-submit="otp-send">
          <div class="col-otp-guide">Enter your email address. We will send a 6-digit login code so you can sign in without a password.</div>
          <label class="col-auth-lbl" for="colOtpEmail">Email Address</label>
          <input type="email" name="email" id="colOtpEmail" class="col-auth-inp" placeholder="name@example.com" required autocomplete="email" value="${escapeColHtml(colOtpState.email || '')}">
          <button type="submit" class="col-auth-btn" id="colOtpSendBtn">Send 6-Digit Code</button>
        </form>
      `) : `
        <form id="colAuthForm" data-col-submit="auth-form" data-mode="${activeTab}" method="post" action="#">
          ${isSignup ? '<label class="col-auth-lbl" for="colAuthName">Full Name</label><input type="text" name="name" id="colAuthName" class="col-auth-inp" placeholder="Your full name" required maxlength="40" autocomplete="name">' : ''}
          <label class="col-auth-lbl" for="colAuthEmail">Email Address</label>
          <input type="email" name="email" id="colAuthEmail" class="col-auth-inp" placeholder="name@example.com" required autocomplete="${isSignup ? 'email' : 'username'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label class="col-auth-lbl" for="colAuthPass" style="margin-bottom:0;">Password</label>
            ${isLogin ? '<button type="button" class="col-auth-link" data-col-action="saved-passwords">Use Saved Password</button>' : ''}
          </div>
          <div class="col-pass-wrap">
            <input type="password" name="password" id="colAuthPass" ${isSignup ? 'data-col-input="pw-strength" data-meter="colSignupPwMeter"' : ''} class="col-auth-inp" placeholder="${isSignup ? 'Create password (min 8 chars)' : 'Enter your password'}" required minlength="${isSignup ? '8' : '6'}" autocomplete="${isSignup ? 'new-password' : 'current-password'}">
            <button type="button" class="col-pass-eye" data-col-action="toggle-pass" data-target="colAuthPass" aria-label="Show password" aria-pressed="false">${SVG_EYE_OPEN}</button>
          </div>
          ${isSignup ? '<div id="colSignupPwMeter" class="col-pw-meter"><div class="col-pw-bar-track"><div class="col-pw-bar-fill"></div></div><div class="col-pw-bar-txt"></div></div>' : ''}
          ${isLogin ? `
            <div class="col-auth-links-row">
              <span style="opacity:0.7;font-size:0.76rem;">Browser autofill supported</span>
              <button type="button" class="col-auth-link" data-col-action="forgot-pass">Forgot password?</button>
            </div>
          ` : ''}
          <button type="submit" class="col-auth-btn" id="colAuthSubmitBtn">${isLogin ? 'Sign In' : 'Create Account'}</button>
        </form>
      `}
    `

    if (isOtp && colOtpState.step === 'verify') {
      setTimeout(function () {
        if (typeof window._initOtpInputs === 'function') window._initOtpInputs()
        startOtpCooldownUi()
      }, 40)
    }
  }

  window._renderAuthTab = function (tab) {
    if (tab !== 'otp') colOtpState = { step: 'send', email: '', cooldownUntil: 0 }
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
        statusEl.textContent = 'Username must be at least 3 characters.'
        statusEl.style.color = '#94a3b8'
      }
      if (btn) btn.disabled = true
      return
    }
    if (statusEl) {
      statusEl.textContent = 'Checking availability...'
      statusEl.style.color = '#94a3b8'
    }
    if (usernameCheckDebounce) clearTimeout(usernameCheckDebounce)
    usernameCheckDebounce = setTimeout(async function () {
      const res = await checkUsernameAvailability(val, window.colUser ? window.colUser.id : null)
      if (res.available) {
        if (statusEl) {
          statusEl.textContent = 'Username available'
          statusEl.style.color = '#10b981'
        }
        if (btn) btn.disabled = false
      } else {
        if (statusEl) {
          statusEl.textContent = res.error || 'Username taken'
          statusEl.style.color = '#ef4444'
        }
        if (btn) btn.disabled = true
      }
    }, 280)
  }

  window._handleAvatarUpload = function (input) {
    if (!input || !input.files || !input.files[0]) return
    const file = input.files[0]
    if (!file.type.startsWith('image/')) {
      showAuthMessage('colSettingsFeedback', 'err', 'Please select a valid image file (PNG, JPEG, or WebP).')
      return
    }
    const reader = new FileReader()
    reader.onload = function (e) {
      const img = new Image()
      img.onload = function () {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 160
        const ctx = canvas.getContext('2d')
        const minDim = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - minDim) / 2, (img.height - minDim) / 2, minDim, minDim, 0, 0, 160, 160)
        window._setAvatarValue(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  window._setAvatarValue = function (dataUrl) {
    const safeUrl = getSafeImageUrl(dataUrl)
    const valInp = document.getElementById('colSettingAvatarVal')
    const urlInp = document.getElementById('colSettingAvatar')
    const preview = document.getElementById('colSettingAvatarPreview')
    if (valInp) valInp.value = safeUrl
    if (urlInp) urlInp.value = safeUrl && safeUrl.startsWith('http') ? safeUrl : ''
    if (preview) {
      if (safeUrl) {
        preview.innerHTML = ''
        const img = document.createElement('img')
        img.src = safeUrl
        img.alt = 'Avatar Preview'
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
        preview.appendChild(img)
      } else {
        const name = (document.getElementById('colSettingName')?.value || (window.colUser && window.colUser.name) || '?').trim()
        preview.textContent = (name.charAt(0) || '?').toUpperCase()
      }
    }
  }

  window._pickLetterAvatar = function (c1, c2, textColor) {
    const letter = ((document.getElementById('colSettingName')?.value || (window.colUser && window.colUser.name) || '?').trim().charAt(0) || 'U').toUpperCase()
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${escapeColHtml(c1)}"/><stop offset="100%" stop-color="${escapeColHtml(c2)}"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g)"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="800" font-size="54" fill="${escapeColHtml(textColor)}" dominant-baseline="middle" text-anchor="middle">${escapeColHtml(letter)}</text></svg>`
    window._setAvatarValue('data:image/svg+xml;utf8,' + encodeURIComponent(svg))
  }

  window._pickPresetAvatar = function (glyph, c1, c2) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${escapeColHtml(c1)}"/><stop offset="100%" stop-color="${escapeColHtml(c2)}"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g)"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="800" font-size="44" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">${escapeColHtml(glyph)}</text></svg>`
    window._setAvatarValue('data:image/svg+xml;utf8,' + encodeURIComponent(svg))
  }

  window._onSettingAvatarUrlInput = function (inp) {
    if (inp) window._setAvatarValue(inp.value.trim())
  }

  window._resetToDefaultAvatar = function () {
    window._setAvatarValue('')
  }

  window._handleSaveAccountSettings = async function (e) {
    if (e) e.preventDefault()
    if (!window.colUser || !supabaseClient) return

    const newName = (document.getElementById('colSettingName')?.value || '').trim()
    let newUname = (document.getElementById('colSettingUsername')?.value || '').trim()
    const newVeh = document.getElementById('colSettingVehicle')?.value || 'Car'
    const newAv = getSafeImageUrl(document.getElementById('colSettingAvatarVal')?.value.trim() || document.getElementById('colSettingAvatar')?.value.trim() || '')
    const newPass = (document.getElementById('colSettingPassword')?.value || '').trim()
    const btn = document.getElementById('colSaveSettingsBtn')

    if (!newName) {
      showAuthMessage('colSettingsFeedback', 'err', 'Please enter a valid display name.')
      return
    }
    if (newUname) {
      if (!newUname.startsWith('@')) newUname = '@' + newUname
      newUname = '@' + newUname.slice(1).replace(/[^a-zA-Z0-9_]/g, '')
    }
    const currentUname = (window.colUser.username || '').toLowerCase()
    if (newUname && newUname.toLowerCase() !== currentUname) {
      const check = await checkUsernameAvailability(newUname, window.colUser.id)
      if (!check.available) {
        showAuthMessage('colSettingsFeedback', 'err', check.error || 'This username is already taken.')
        return
      }
    }
    if (newPass && newPass.length < 8) {
      showAuthMessage('colSettingsFeedback', 'err', 'New password must be at least 8 characters long.')
      return
    }

    if (btn) {
      btn.textContent = 'Saving...'
      btn.disabled = true
    }

    try {
      const { data: sData } = await supabaseClient.auth.getSession()
      if (!sData || !sData.session) throw new Error('Session expired')

      if (newPass) {
        const { error: passErr } = await supabaseClient.auth.updateUser({ password: newPass })
        if (passErr) throw passErr
      }

      const metaUpdate = {
        full_name: newName,
        name: newName,
        preferred_vehicle: newVeh,
        avatar_url: newAv || null,
        picture: newAv || null
      }
      await supabaseClient.auth.updateUser({ data: metaUpdate })

      const upPayload = {
        user_id: window.colUser.id,
        display_name: newName,
        full_name: newName,
        preferred_vehicle: newVeh,
        avatar_url: newAv || null,
        updated_at: new Date().toISOString()
      }
      if (newUname) upPayload.username = newUname
      await supabaseClient.from('user_profiles').upsert(upPayload, { onConflict: 'user_id' })

      const profPayload = {
        id: window.colUser.id,
        full_name: newName,
        avatar_url: newAv || null,
        updated_at: new Date().toISOString()
      }
      if (newUname) profPayload.username = newUname
      const { error: pErr } = await supabaseClient.from('profiles').upsert(profPayload, { onConflict: 'id' })
      if (pErr && (pErr.code === '23505' || (pErr.message && pErr.message.includes('unique')))) {
        throw new Error('This username is already taken.')
      }

      window.colUser.name = newName
      if (newUname) window.colUser.username = newUname
      window.colUser.vehicle = newVeh
      window.colUser.picture = newAv || null

      broadcastAuth('PROFILE_UPDATED')
      dispatchAuthEvent()
      updateAuthUI()
      showAuthMessage('colSettingsFeedback', 'ok', 'Account settings saved.')
      setTimeout(function () { renderAuthPanel('profile') }, 800)
    } catch (err) {
      showAuthMessage('colSettingsFeedback', 'err', formatUserFriendlyAuthError(err, 'settings'))
      if (btn) {
        btn.textContent = 'Save Changes'
        btn.disabled = false
      }
    }
  }

  window._handleColOtpSend = async function (e) {
    if (e) e.preventDefault()
    const inp = document.getElementById('colOtpEmail')
    const emailInput = (inp ? inp.value : colOtpState.email || '').trim().toLowerCase()
    const btn = document.getElementById('colOtpSendBtn')

    if (!EMAIL_RE.test(emailInput)) {
      showAuthMessage('colAuthError', 'err', 'Please enter a valid email address.')
      return
    }
    if (colOtpState.cooldownUntil > Date.now() && e === null) return
    if (!supabaseClient) {
      showAuthMessage('colAuthError', 'err', 'Cloud authentication service unavailable.')
      return
    }
    if (btn) {
      btn.textContent = 'Sending Code...'
      btn.disabled = true
    }

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: emailInput,
        options: { shouldCreateUser: true }
      })
      if (error) throw error
      colOtpState = { step: 'verify', email: emailInput, cooldownUntil: Date.now() + OTP_RESEND_SECONDS * 1000 }
      renderAuthPanel('otp')
    } catch (err) {
      showAuthMessage('colAuthError', 'err', formatUserFriendlyAuthError(err, 'otp_send'))
      if (btn) {
        btn.textContent = 'Send 6-Digit Code'
        btn.disabled = false
      }
    }
  }

  window._handleColOtpVerify = async function (e) {
    if (e) e.preventDefault()
    const token = (document.getElementById('colOtpToken')?.value || '').trim()
    const grid = document.getElementById('colOtpGrid')
    const btn = document.getElementById('colOtpVerifyBtn')

    if (!token || token.length < 6) {
      if (grid) grid.classList.add('is-wrong')
      showAuthMessage('colAuthError', 'err', 'Please enter all 6 digits from your email.')
      return
    }
    if (!supabaseClient) {
      showAuthMessage('colAuthError', 'err', 'Authentication service unavailable.')
      return
    }

    if (btn) {
      btn.disabled = true
      btn.textContent = 'Verifying...'
    }
    try {
      const { error } = await supabaseClient.auth.verifyOtp({
        email: colOtpState.email,
        token: token,
        type: 'email'
      })
      if (error) throw error
      if (grid) {
        grid.classList.remove('is-wrong')
        grid.classList.add('is-success')
      }
      if (btn) btn.classList.add('is-verified')
      showAuthMessage('colAuthError', 'ok', 'Verified. Signing you in...')
      setTimeout(function () {
        colOtpState = { step: 'send', email: '', cooldownUntil: 0 }
        closeAuthModal()
        dispatchAuthEvent()
        updateAuthUI()
      }, 650)
    } catch (err) {
      if (grid) grid.classList.add('is-wrong')
      showAuthMessage('colAuthError', 'err', formatUserFriendlyAuthError(err, 'otp_verify'))
      if (btn) {
        btn.disabled = false
        btn.textContent = 'Verify Code & Sign In'
      }
    }
  }

  window._handleColOtpReset = function () {
    clearOtpTimer()
    colOtpState = { step: 'send', email: '', cooldownUntil: 0 }
    renderAuthPanel('otp')
  }

  window._toggleAuthPassVis = function (btn) {
    const id = btn && btn.getAttribute('data-target')
    const inp = id ? document.getElementById(id) : null
    if (!inp) return
    const nextType = inp.type === 'password' ? 'text' : 'password'
    inp.type = nextType
    const isVisible = nextType === 'text'
    btn.innerHTML = isVisible ? SVG_EYE_OFF : SVG_EYE_OPEN
    btn.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password')
    btn.setAttribute('aria-pressed', isVisible ? 'true' : 'false')
  }

  window._promptSavedPasswordPicker = async function () {
    const emailInp = document.getElementById('colAuthEmail')
    const passInp = document.getElementById('colAuthPass')
    if (navigator.credentials && typeof navigator.credentials.get === 'function') {
      try {
        const cred = await navigator.credentials.get({ password: true, mediation: 'optional' })
        if (cred && cred.id && cred.password) {
          if (emailInp) emailInp.value = cred.id
          if (passInp) passInp.value = cred.password
          const msg = document.getElementById('colAuthError')
          if (msg) msg.className = 'col-auth-msg'
          return
        }
      } catch (_e) {}
    }
    if (emailInp) emailInp.focus()
    showAuthMessage('colAuthError', 'info', 'Tap the Email field to open your browser’s saved passwords dropdown.')
  }

  window._handleColResetRequest = async function (e) {
    if (e) e.preventDefault()
    const emailInput = (document.getElementById('colResetEmail')?.value || '').trim().toLowerCase()
    const btn = document.getElementById('colResetSendBtn')
    if (!EMAIL_RE.test(emailInput)) {
      showAuthMessage('colAuthError', 'err', 'Please enter a valid email address.')
      return
    }
    if (!supabaseClient) return
    if (btn) { btn.textContent = 'Sending Link...'; btn.disabled = true }
    try {
      const returnUrl = window.location.origin + window.location.pathname + window.location.search + '#reset-password'
      const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput, { redirectTo: returnUrl })
      if (error) throw error
      showAuthMessage('colAuthError', 'ok', 'Reset link sent to ' + emailInput + '. Check your inbox and Spam folder.')
    } catch (err) {
      showAuthMessage('colAuthError', 'err', formatUserFriendlyAuthError(err, 'reset'))
    }
    if (btn) { btn.textContent = 'Send Password Reset Link'; btn.disabled = false }
  }

  window._handleColUpdatePassword = async function (e) {
    if (e) e.preventDefault()
    const newPass = (document.getElementById('colResetNewPass')?.value || '').trim()
    const confirmPass = (document.getElementById('colResetConfirmPass')?.value || '').trim()
    const btn = document.getElementById('colResetNewPassBtn')

    if (!newPass || newPass.length < 8) {
      showAuthMessage('colAuthError', 'err', 'Password must be at least 8 characters long.')
      return
    }
    if (newPass !== confirmPass) {
      showAuthMessage('colAuthError', 'err', 'Passwords do not match. Please re-enter carefully.')
      return
    }
    if (!supabaseClient) return
    if (btn) { btn.textContent = 'Updating...'; btn.disabled = true }

    try {
      const { error } = await supabaseClient.auth.updateUser({ password: newPass })
      if (error) throw error
      window._colPasswordRecoveryMode = false
      if (window.location.hash === '#reset-password') {
        try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search) } catch (_e) {}
      }
      closeAuthModal()
      if (typeof window.toast === 'function') window.toast('Password updated successfully', '#10b981')
    } catch (err) {
      showAuthMessage('colAuthError', 'err', formatUserFriendlyAuthError(err, 'reset'))
    }
    if (btn) { btn.textContent = 'Update Password & Continue'; btn.disabled = false }
  }

  window.colDoGoogle = async function () {
    if (window.AndroidBridge) {
      window.AndroidBridge.signInWithGoogle()
      return
    }
    if (!supabaseClient) return
    const returnHref = window.location.origin + window.location.pathname + window.location.search
    try {
      const payload = JSON.stringify({ url: returnHref, ts: Date.now() })
      localStorage.setItem(RETURN_TO_KEY, payload)
      sessionStorage.setItem(RETURN_TO_KEY, payload)
    } catch (_e) {}

    const currentOrigin = window.location.origin
    const isAllowed =
      currentOrigin === 'https://advancedlogiclabs.dpdns.org' ||
      currentOrigin === 'https://www.advancedlogiclabs.dpdns.org' ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(currentOrigin) ||
      /^https:\/\/[a-z0-9-]+\.(vercel\.app|dpdns\.org)$/i.test(currentOrigin)
    const redirectUrl = isAllowed ? returnHref : 'https://advancedlogiclabs.dpdns.org'

    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    })
  }

  window._handleColAuthSubmit = async function (e, mode) {
    e.preventDefault()
    const emailInput = (document.getElementById('colAuthEmail')?.value || '').trim().toLowerCase()
    const pass = (document.getElementById('colAuthPass')?.value || '').trim()
    const btn = document.getElementById('colAuthSubmitBtn')

    if (!EMAIL_RE.test(emailInput)) {
      showAuthMessage('colAuthError', 'err', 'Please enter a valid email address.')
      return
    }
    if (!supabaseClient) {
      showAuthMessage('colAuthError', 'err', 'Authentication service unavailable.')
      return
    }

    if (btn) { btn.textContent = 'Processing...'; btn.disabled = true }
    try {
      if (mode === 'login') {
        const res = await supabaseClient.auth.signInWithPassword({ email: emailInput, password: pass })
        if (res.error) throw res.error
        if (window.PasswordCredential && navigator.credentials && typeof navigator.credentials.store === 'function') {
          try {
            const cred = new window.PasswordCredential({ id: emailInput, password: pass })
            navigator.credentials.store(cred).catch(function () {})
          } catch (_ce) {}
        }
        closeAuthModal()
        window.closeMo()
      } else {
        if (pass.length < 8) throw new Error('Password must be at least 8 characters long.')
        const name = (document.getElementById('colAuthName')?.value || '').trim()
        const res = await supabaseClient.auth.signUp({
          email: emailInput,
          password: pass,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin + window.location.pathname + window.location.search
          }
        })
        if (res.error) throw res.error
        if (res.data.user && !res.data.session) {
          showAuthMessage('colAuthError', 'ok', 'Account created. Check your email inbox to confirm your address before signing in.')
        } else {
          closeAuthModal()
        }
      }
    } catch (error) {
      showAuthMessage('colAuthError', 'err', formatUserFriendlyAuthError(error, mode))
    }
    if (btn) {
      btn.textContent = mode === 'login' ? 'Sign In' : 'Create Account'
      btn.disabled = false
    }
  }

  window.colDoLogout = async function () {
    if (supabaseClient) {
      try { await supabaseClient.auth.signOut() } catch (_e) {}
    }
    clearActiveLocalUser()
    closeAuthModal()
    window.closeMo()
    window._oneTapAttempted = false
    try {
      sessionStorage.removeItem('col_onetap_dismissed_session')
      clearOneTapCoolDown()
    } catch (_e) {}
    broadcastAuth('SIGNED_OUT')
    dispatchAuthEvent()
    updateAuthUI()
  }
  window.doLogout = window.colDoLogout
  window.gSignIn = function () {
    try { return window.colDoGoogle && window.colDoGoogle() } catch (_e) {}
  }

  window.updateUsername = async function () {
    try {
      const inp = document.getElementById('miName')
      const name = inp && inp.value ? inp.value.trim().slice(0, 40) : ''
      if (!name) {
        if (typeof window.toast === 'function') window.toast('Enter a display name first', '#ef4444')
        return
      }
      if (!supabaseClient || !window.colUser) {
        if (typeof window.toast === 'function') window.toast('Please sign in first', '#ef4444')
        return
      }
      await supabaseClient.auth.updateUser({ data: { full_name: name, name: name } })
      await supabaseClient.from('user_profiles').upsert({ user_id: window.colUser.id, display_name: name, full_name: name }, { onConflict: 'user_id' })
      window.colUser.name = name
      broadcastAuth('PROFILE_UPDATED')
      if (typeof window.toast === 'function') window.toast('Display name updated', '#22c55e')
      updateAuthUI()
    } catch (_e) {}
  }

  function bindAuthTriggerOnce(el) {
    if (!el || el.dataset.colAuthBound === '1') return
    el.dataset.colAuthBound = '1'
    el.addEventListener('click', function () {
      if (typeof window.openGlobalLogin === 'function') window.openGlobalLogin()
      else if (typeof window.openLogin === 'function') window.openLogin()
    })
  }

  function updateAuthUI() {
    const navBtns = document.querySelectorAll('.nav-login-btn, #navLoginBtn, #sbSignBtn')
    const navProfiles = document.querySelectorAll('.nav-user-profile, #navUserProfile, #pCard')

    if (window.colUser) {
      navBtns.forEach(function (btn) { btn.style.display = 'none' })
      navProfiles.forEach(function (prof) {
        prof.style.display = 'flex'
        if (prof.dataset.preserveClick !== 'true') bindAuthTriggerOnce(prof)

        const displayName = String(window.colUser.name || window.colUser.username || 'Driver')
        prof.querySelectorAll('span, .pname').forEach(function (el) { el.textContent = displayName.split(' ')[0] })
        prof.querySelectorAll('.pemail').forEach(function (el) {
          el.textContent = window.colUser.email ? window.colUser.email.toLowerCase() : ''
          el.style.setProperty('text-transform', 'none', 'important')
        })

        const initial = displayName.replace(/^@/, '').charAt(0).toUpperCase() || 'D'
        const picture = getSafeImageUrl(window.colUser.picture)
        prof.querySelectorAll('.nav-user-avatar, .pav').forEach(function (av) {
          av.textContent = ''
          if (picture) {
            const image = document.createElement('img')
            image.src = picture
            image.alt = displayName
            image.referrerPolicy = 'no-referrer'
            image.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;'
            image.addEventListener('error', function () {
              image.remove()
              av.textContent = initial
            })
            av.appendChild(image)
          } else {
            av.textContent = initial
          }
        })
      })
    } else {
      navBtns.forEach(function (btn) {
        btn.style.display = 'flex'
        bindAuthTriggerOnce(btn)
      })
      navProfiles.forEach(function (prof) { prof.style.display = 'none' })
    }

    if (typeof window.updateTrafficAuthUI === 'function') {
      try { window.updateTrafficAuthUI() } catch (_e) {}
    }
    const topProfBtn = document.getElementById('top-profile-btn')
    const topProfLbl = document.getElementById('top-profile-label')
    if (topProfBtn && topProfLbl) {
      if (window.colUser) {
        const displayName = String(window.colUser.name || window.colUser.username || 'Driver').split(' ')[0]
        topProfLbl.textContent = displayName
        topProfBtn.title = 'Driver Dashboard: ' + (window.colUser.name || 'Driver')
      } else {
        topProfLbl.textContent = 'Sign In'
        topProfBtn.title = 'Sign In'
      }
    }
  }

  updateAuthUI()
  document.addEventListener('DOMContentLoaded', updateAuthUI, { once: true })
})()
