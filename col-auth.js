// Class Of Learners Global Authentication System (Supabase)

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

  // 1. Fetch Global Configuration to get Supabase Keys
  let authConfig = null
  try {
    const res = await fetch('config.json?t=' + new Date().getTime())
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
    window.colUser = null
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
    google.accounts.id.initialize({
      client_id: '500448449044-hv2rp3k0lsok9ara1bred87c75lnsp7l.apps.googleusercontent.com',
      callback: window.handleGoogleOneTap,
      use_fedcm_for_prompt: true,
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

  let supabaseClient = null

  function initSupabase(url, key) {
    supabaseClient = window.supabase.createClient(url, key)
    window.supabaseClient = supabaseClient

    // Listen for Auth changes
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        const meta = session.user.user_metadata || {}
        const userId = session.user.id;
        const email = session.user.email;

        window.colUser = {
          id: userId,
          email: email,
          name: meta.full_name || meta.name || email.split('@')[0],
          picture: meta.avatar_url || meta.picture || null,
          session: session,
          uid: null // Default until profile is fetched
        }

        try {
          const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (profile) {
            window.colUser.uid = profile.id;
          } else {
            promptForUsername();
          }
        } catch (e) {
          console.error('[col-auth] Profile sync error:', e);
        }
      } else {
        window.colUser = null
      }
      dispatchAuthEvent()
      updateAuthUI()

      if (!session && !window._oneTapAttempted && (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT')) {
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

  async function createProfile(username) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .insert([{
        id: window.colUser.id,
        username: username,
        email: window.colUser.email
      }]);
    if (error) throw error;
    return data;
  }

  function promptForUsername() {
    if (!document.getElementById('colAuthModal')) injectAuthUI();
    const body = document.getElementById('colAuthBody');
    if (!body) return;

    body.innerHTML = `
      <div style="text-align:center; margin-bottom: 20px;">
        <h3 style="font-family: var(--serif, 'Instrument Serif'); font-style: italic; font-size: 2rem; color: var(--signal, #F2B84B);">Welcome!</h3>
        <p style="color: var(--dim, #8891AA); font-size: 0.9rem;">Please choose a unique username to complete your profile.</p>
      </div>
      <div id="profileCreateError" style="color: #ef4444; font-size: 0.85rem; margin-bottom: 10px; text-align: center; display: none;"></div>
      <form onsubmit="window._handleProfileCreate(event)">
        <input type="text" id="profileUsername" class="col-auth-inp" placeholder="Username" required maxlength="40">
        <button type="submit" class="col-auth-btn" id="profileCreateBtn">Create Profile</button>
      </form>
    `;
    document.getElementById('colAuthModal').classList.add('open');
  }

  window._handleProfileCreate = async (e) => {
    e.preventDefault();
    const username = document.getElementById('profileUsername').value;
    const btn = document.getElementById('profileCreateBtn');
    const errDiv = document.getElementById('profileCreateError');

    btn.textContent = 'Creating...';
    btn.disabled = true;
    errDiv.style.display = 'none';

    try {
      await createProfile(username);

      // Update colUser.uid and close modal
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', window.colUser.id)
        .single();

      window.colUser.uid = profile.id;
      document.getElementById('colAuthModal').classList.remove('open');
      dispatchAuthEvent();
    } catch (error) {
      errDiv.textContent = error.message;
      errDiv.style.display = 'block';
    } finally {
      btn.textContent = 'Create Profile';
      btn.disabled = false;
    }
  };

  function injectAuthStyles() {
    if (document.getElementById('col-auth-styles')) return
    const style = document.createElement('style')
    style.id = 'col-auth-styles'
    style.innerHTML = `
            .col-auth-mo { position: fixed; inset: 0; background: rgba(4, 7, 14, 0.75); backdrop-filter: blur(16px); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.4s cubic-bezier(.16,1,.3,1); }
            .col-auth-mo.open { opacity: 1; pointer-events: auto; }
            .col-auth-md { background: var(--panel, #111827); border: 1px solid var(--lineb, rgba(255, 255, 255, 0.12)); border-radius: 28px; width: 90%; max-width: 420px; overflow: hidden; transform: translateY(40px) scale(0.95); transition: 0.5s cubic-bezier(.16,1,.3,1); box-shadow: 0 40px 100px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.08); color: var(--ink, #E8E3D8); font-family: var(--sans, 'Inter'), sans-serif;}
            .col-auth-mo.open .col-auth-md { transform: translateY(0) scale(1); }
            .col-auth-hd { padding: 40px 30px 25px; border-bottom: 1px solid var(--line, rgba(255,255,255,0.06)); background: transparent; text-align: center; position: relative;}
            .col-auth-close { position: absolute; top: 20px; right: 20px; background: transparent; border: 1px solid var(--lineb, rgba(255,255,255,0.1)); color: var(--dim, #8891AA); font-size: 1.2rem; cursor: pointer; transition: 0.3s; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;}
            .col-auth-close:hover { color: var(--ink, #E8E3D8); background: var(--line, rgba(255,255,255,0.1)); border-color: var(--lineb, rgba(255,255,255,0.2)); transform: scale(1.05); }
            .col-auth-hd h2 { font-size: 2.6rem; font-weight: 400; font-family: var(--serif, 'Instrument Serif'); font-style: italic; margin:0; color: var(--page-theme, var(--signal, #F2B84B)); letter-spacing: 0.5px;}
            .col-auth-hd p { font-size: 0.95rem; color: var(--dim, #8891AA); margin-top: 8px; }
            .col-auth-body { padding: 30px; }
            .col-auth-inp { width: 100%; padding: 14px 16px; border: 1px solid var(--lineb, rgba(255,255,255,0.1)); border-radius: 14px; font-size: 1rem; outline: none; margin-bottom: 16px; transition: 0.3s; color: var(--ink, #E8E3D8); background: var(--void2, rgba(255, 255, 255, 0.03)); font-family: var(--sans, 'Inter'), sans-serif;}
            .col-auth-inp:focus { border-color: var(--page-theme, var(--signal, #F2B84B)); box-shadow: 0 0 0 4px var(--line, rgba(255,255,255,0.1)); background: var(--void, rgba(255, 255, 255, 0.05)); }
            .col-auth-btn { width: 100%; padding: 14px; background: var(--page-theme, var(--signal, #F2B84B)); border: none; border-radius: 14px; font-weight: 700; font-size: 1rem; letter-spacing: 0.5px; cursor: pointer; color: var(--void, #070A14); transition: 0.3s cubic-bezier(.16,1,.3,1); font-family: var(--sans, 'Inter'), sans-serif;}
            .col-auth-btn:hover { box-shadow: 0 12px 24px rgba(242,184,75,0.2); transform: translateY(-2px); opacity: 0.9; }
            .col-auth-danger { width: 100%; padding: 14px; background: transparent; border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 14px; font-weight: 700; font-size: 1rem; cursor: pointer; color: #ef4444; transition: 0.3s; font-family: var(--sans, 'Inter'), sans-serif;}
            .col-auth-danger:hover { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
            .col-auth-gbtn { width: 100%; padding: 14px; background: var(--ink, #ffffff); border: none; border-radius: 14px; font-weight: 600; font-size: 1rem; cursor: pointer; color: var(--void, #0f1419); display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px; transition: 0.3s cubic-bezier(.16,1,.3,1); box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: var(--sans, 'Inter'), sans-serif;}
            .col-auth-gbtn:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.2); opacity: 0.9; }
            .col-auth-div { display: flex; align-items: center; text-align: center; color: var(--dim, #8891AA); font-size: 0.8rem; margin-bottom: 24px; font-weight: 600; font-family: var(--mono, 'Space Mono'), monospace; letter-spacing: 2px;}
            .col-auth-div::before, .col-auth-div::after { content: ''; flex: 1; border-bottom: 1px solid var(--line, rgba(255,255,255,0.06)); }
            .col-auth-div:not(:empty)::before { margin-right: 1em; }
            .col-auth-div:not(:empty)::after { margin-left: 1em; }
            .col-auth-tab-group { display: flex; gap: 6px; margin-bottom: 24px; background: var(--void2, rgba(255,255,255,0.03)); border: 1px solid var(--line, rgba(255,255,255,0.06)); border-radius: 16px; padding: 6px;}
            .col-auth-tab { flex: 1; text-align: center; padding: 10px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; color: var(--dim, #8891AA); cursor: pointer; transition: 0.3s;}
            .col-auth-tab:hover:not(.active) { color: var(--ink, #E8E3D8); background: var(--line, rgba(255,255,255,0.05)); }
            .col-auth-tab.active { background: var(--line, rgba(255,255,255,0.05)); color: var(--page-theme, var(--signal, #F2B84B)); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
            
            /* Override existing nav profile logic for global injection */
            .nav-login-btn { display: flex; align-items: center; gap: 8px; background: transparent; color: var(--page-theme, var(--signal, #F2B84B)); border: 1px solid var(--page-theme, var(--signal, #F2B84B)); padding: 8px 20px; border-radius: 30px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: 0.3s; text-decoration:none; }
            body.lm .nav-login-btn { background: transparent; color: var(--page-theme-light, var(--signal, #F2B84B)); border-color: var(--page-theme-light, var(--signal, #F2B84B)); }
            body.lm .nav-login-btn:hover { background: var(--page-theme-light, var(--signal, #F2B84B)); color: #fff; }
            .nav-login-btn:hover { background: var(--page-theme, var(--signal, #F2B84B)); color: var(--void, #070A14); box-shadow: 0 0 20px rgba(242,184,75,0.2); }
            .nav-user-profile { display: none; align-items: center; gap: 10px; padding: 5px 15px 5px 5px; background: transparent; border: 1px solid var(--lineb, rgba(255,255,255,.16)); border-radius: 30px; cursor: pointer; transition: 0.3s; }
            .nav-user-profile:hover { border-color: var(--page-theme, var(--signal, #F2B84B)); }
            .nav-user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--page-theme, var(--signal, #F2B84B)); color: var(--void, #070A14); display: flex; justify-content: center; align-items: center; font-weight: 800; overflow: hidden; }
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
    modal.innerHTML = `
            <div class="col-auth-md">
                <div class="col-auth-hd">
                    <button class="col-auth-close" onclick="document.getElementById('colAuthModal').classList.remove('open')" aria-label="Close login dialog">&times;</button>
                    <h2 id="colAuthTitle">Authenticate</h2>
                    <p>Unlock dashboard storage and cloud sync.</p>
                </div>
                <div class="col-auth-body" id="colAuthBody">
                    <!-- Dynamic Content -->
                </div>
            </div>
        `
    document.body.appendChild(modal)

    // Expose global open function
    window.openGlobalLogin = function () {
      renderAuthPanel()
      var mo = document.getElementById('colAuthModal')
      mo.classList.add('open')
      // Focus first focusable element
      setTimeout(function(){ var f = mo.querySelector('button, input, [tabindex]:not([tabindex="-1"])'); if(f) f.focus(); }, 100)
    }
    // Escape key closes modal
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape'){
        var mo = document.getElementById('colAuthModal')
        if(mo && mo.classList.contains('open')) mo.classList.remove('open')
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

  function renderAuthPanel(tab = 'login') {
    const body = document.getElementById('colAuthBody')
    if (!body) return

    if (window.colUser) {
      body.innerHTML = `
                <div style="text-align:center; margin-bottom: 25px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--signal, #F2B84B); margin: 0 auto 15px; display: flex; justify-content: center; align-items: center; font-size: 2rem; overflow: hidden; border: 2px solid var(--signal, #F2B84B); color: var(--void, #070A14); font-weight: 800;">
                        ${window.colUser.picture ? `<img src="${window.colUser.picture}" style="width:100%; height:100%; object-fit:cover;">` : (window.colUser.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <h3 style="margin-bottom: 5px; font-size: 1.2rem; color: var(--ink, #E8E3D8);">${window.colUser.name}</h3>
                    <p style="color: var(--dim, #8891AA); font-size: 0.9rem;">${window.colUser.email}</p>
                </div>
                <button class="col-auth-danger" onclick="colDoLogout()">Disconnect Account</button>
            `
      return
    }

    const isLogin = tab === 'login'

    body.innerHTML = `
            <button class="col-auth-gbtn" onclick="colDoGoogle()">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
            </button>
            <div class="col-auth-div">OR EMAIL</div>
            
            <div class="col-auth-tab-group">
                <div class="col-auth-tab ${isLogin ? 'active' : ''}" onclick="window._renderAuthTab('login')">Sign In</div>
                <div class="col-auth-tab ${!isLogin ? 'active' : ''}" onclick="window._renderAuthTab('signup')">Create Account</div>
            </div>

            <div id="colAuthError" style="color: #ef4444; font-size: 0.85rem; margin-bottom: 10px; text-align: center; display: none;"></div>

            <form id="colAuthForm" onsubmit="window._handleColAuthSubmit(event, '${tab}')">
                ${!isLogin ? `<input type="text" id="colAuthName" class="col-auth-inp" placeholder="Display Name" required>` : ''}
                <input type="email" id="colAuthEmail" class="col-auth-inp" placeholder="Email Address" required>
                <input type="password" id="colAuthPass" class="col-auth-inp" placeholder="Password" required minlength="6">
                <button type="submit" class="col-auth-btn" id="colAuthSubmitBtn">${isLogin ? 'Sign In' : 'Create Account'}</button>
            </form>
        `
  }

  // Expose helpers for inline handlers
  window._renderAuthTab = (tab) => renderAuthPanel(tab)

  window.colDoGoogle = async () => {
    if (window.AndroidBridge) {
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
    if (!supabaseClient) return

    const email = document.getElementById('colAuthEmail').value
    const pass = document.getElementById('colAuthPass').value
    const btn = document.getElementById('colAuthSubmitBtn')
    const errDiv = document.getElementById('colAuthError')

    btn.textContent = 'Processing...'
    btn.disabled = true
    errDiv.style.display = 'none'

    try {
      let res
      if (mode === 'signup') {
        const name = document.getElementById('colAuthName').value
        res = await supabaseClient.auth.signUp({
          email: email,
          password: pass,
          options: { data: { full_name: name } }
        })
      } else {
        res = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: pass
        })
      }

      if (res.error) throw res.error

      if (mode === 'signup' && res.data.user && !res.data.session) {
        errDiv.textContent = 'Please check your email to confirm registration.'
        errDiv.style.color = '#10b981'
        errDiv.style.display = 'block'
      } else {
        document.getElementById('colAuthModal').classList.remove('open')
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
    if (!supabaseClient) return
    await supabaseClient.auth.signOut()
    document.getElementById('colAuthModal').classList.remove('open')
  }

  // --- APK Certificate Verification ---
  window.colApkVerified = false
  window.colApkFingerprint = null

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
        const res = await fetch('config.json?t=' + Date.now())
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
          if (window.colUser.picture) {
            av.innerHTML = `<img src="${window.colUser.picture}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
          } else {
            av.innerHTML = ''
            av.textContent = window.colUser.name.charAt(0).toUpperCase()
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
