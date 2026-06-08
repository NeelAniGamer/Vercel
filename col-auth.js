// Class Of Learners Global Authentication System (Supabase)

(async function() {
    // 1. Fetch Global Configuration to get Supabase Keys
    let authConfig = null;
    try {
        const res = await fetch('config.json?t=' + new Date().getTime());
        if (res.ok) {
            const config = await res.json();
            if (config.auth && config.auth.url && config.auth.key) {
                authConfig = config.auth;
            }
        }
    } catch (e) {
        console.warn("COL Auth: Could not load config.json");
    }

    // 2. Load Supabase SDK if keys exist
    if (authConfig) {
        if (typeof supabase === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            script.onload = () => initSupabase(authConfig.url, authConfig.key);
            document.head.appendChild(script);
        } else {
            initSupabase(authConfig.url, authConfig.key);
        }
    } else {
        console.warn("COL Auth: Supabase not configured. Global Auth disabled.");
        window.colUser = null;
        dispatchAuthEvent();
    }

    let supabaseClient = null;

    function initSupabase(url, key) {
        supabaseClient = window.supabase.createClient(url, key);
        window.supabaseClient = supabaseClient;
        
        // Listen for Auth changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                const meta = session.user.user_metadata || {};
                window.colUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: meta.full_name || meta.name || session.user.email.split('@')[0],
                    picture: meta.avatar_url || meta.picture || null,
                    session: session
                };
            } else {
                window.colUser = null;
            }
            dispatchAuthEvent();
            updateAuthUI();
        });

        injectAuthStyles();
        injectAuthUI();
        
        // If there's a custom handler provided by the page (like in qr.html to fetch drive data), fire it.
        dispatchAuthEvent();
    }

    function dispatchAuthEvent() {
        const event = new CustomEvent('col-auth-changed', { detail: { user: window.colUser } });
        window.dispatchEvent(event);
    }

    // --- UI INJECTION ---
    function injectAuthStyles() {
        if(document.getElementById('col-auth-styles')) return;
        const style = document.createElement('style');
        style.id = 'col-auth-styles';
        style.innerHTML = `
            .col-auth-mo { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.3s; }
            .col-auth-mo.open { opacity: 1; pointer-events: auto; }
            .col-auth-md { background: #0f1523; border: 1px solid #161d2b; border-radius: 24px; width: 90%; max-width: 400px; overflow: hidden; transform: translateY(30px) scale(0.95); transition: 0.4s; box-shadow: 0 40px 100px rgba(0,0,0,0.8); color: #f8fafc; font-family: 'Inter', sans-serif;}
            .col-auth-mo.open .col-auth-md { transform: translateY(0) scale(1); }
            .col-auth-hd { padding: 30px; border-bottom: 1px solid #161d2b; background: #0a0d14; text-align: center; position: relative;}
            .col-auth-close { position: absolute; top: 20px; right: 20px; background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; transition: 0.2s;}
            .col-auth-close:hover { color: #f8fafc; }
            .col-auth-hd h2 { font-size: 1.5rem; font-weight: 800; margin:0; color: #10b981; letter-spacing: -0.5px;}
            .col-auth-hd p { font-size: 0.9rem; color: #94a3b8; margin-top: 5px; }
            .col-auth-body { padding: 30px; }
            .col-auth-inp { width: 100%; padding: 12px 15px; border: 1px solid #161d2b; border-radius: 12px; font-size: 0.95rem; outline: none; margin-bottom: 15px; transition: 0.3s; color: #f8fafc; background: #0a0d14; font-family: 'Inter', sans-serif;}
            .col-auth-inp:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
            .col-auth-btn { width: 100%; padding: 12px; background: #10b981; border: none; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; color: #000; transition: 0.3s; font-family: 'Inter', sans-serif;}
            .col-auth-btn:hover { background: #fff; box-shadow: 0 10px 20px rgba(16,185,129,0.4); transform: translateY(-2px);}
            .col-auth-danger { width: 100%; padding: 12px; background: transparent; border: 1px solid #ef4444; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; color: #ef4444; transition: 0.3s; font-family: 'Inter', sans-serif;}
            .col-auth-danger:hover { background: rgba(239, 68, 68, 0.1); }
            .col-auth-gbtn { width: 100%; padding: 12px; background: #ffffff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.95rem; cursor: pointer; color: #000; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px; transition: 0.3s; font-family: 'Inter', sans-serif;}
            .col-auth-gbtn:hover { background: #f1f5f9; transform: translateY(-2px); }
            .col-auth-div { display: flex; align-items: center; text-align: center; color: #64748b; font-size: 0.8rem; margin-bottom: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;}
            .col-auth-div::before, .col-auth-div::after { content: ''; flex: 1; border-bottom: 1px solid #161d2b; }
            .col-auth-div:not(:empty)::before { margin-right: .5em; }
            .col-auth-div:not(:empty)::after { margin-left: .5em; }
            .col-auth-tab-group { display: flex; gap: 10px; margin-bottom: 20px;}
            .col-auth-tab { flex: 1; text-align: center; padding: 8px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s;}
            .col-auth-tab.active { background: rgba(16,185,129,0.1); color: #10b981; }
            
            /* Override existing nav profile logic for global injection */
            .nav-login-btn { display: flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid #10b981; padding: 8px 20px; border-radius: 30px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: 0.3s; text-decoration:none; }
            .nav-login-btn:hover { background: #10b981; color: #000; box-shadow: 0 0 20px rgba(16,185,129,0.4); }
            .nav-user-profile { display: none; align-items: center; gap: 10px; padding: 5px 15px 5px 5px; background: transparent; border: 1px solid #161d2b; border-radius: 30px; cursor: pointer; transition: 0.3s; }
            .nav-user-profile:hover { border-color: #10b981; }
            .nav-user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #10b981; color: #000; display: flex; justify-content: center; align-items: center; font-weight: 800; overflow: hidden; }
        `;
        document.head.appendChild(style);
    }

    function injectAuthUI() {
        if(document.getElementById('colAuthModal')) return;
        
        const modal = document.createElement('div');
        modal.className = 'col-auth-mo';
        modal.id = 'colAuthModal';
        modal.innerHTML = `
            <div class="col-auth-md">
                <div class="col-auth-hd">
                    <button class="col-auth-close" onclick="document.getElementById('colAuthModal').classList.remove('open')">&times;</button>
                    <h2>Authenticate</h2>
                    <p>Unlock dashboard storage and cloud sync.</p>
                </div>
                <div class="col-auth-body" id="colAuthBody">
                    <!-- Dynamic Content -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Expose global open function
        window.openGlobalLogin = function() {
            renderAuthPanel();
            document.getElementById('colAuthModal').classList.add('open');
        };
    }

    function renderAuthPanel(tab = 'login') {
        const body = document.getElementById('colAuthBody');
        if (!body) return;

        if (window.colUser) {
            body.innerHTML = `
                <div style="text-align:center; margin-bottom: 25px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: #10b981; margin: 0 auto 15px; display: flex; justify-content: center; align-items: center; font-size: 2rem; overflow: hidden; border: 2px solid #10b981;">
                        ${window.colUser.picture ? `<img src="${window.colUser.picture}" style="width:100%; height:100%; object-fit:cover;">` : (window.colUser.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <h3 style="margin-bottom: 5px; font-size: 1.2rem;">${window.colUser.name}</h3>
                    <p style="color: #64748b; font-size: 0.9rem;">${window.colUser.email}</p>
                </div>
                <button class="col-auth-danger" onclick="colDoLogout()">Disconnect Account</button>
            `;
            return;
        }

        const isLogin = tab === 'login';
        
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
        `;
    }

    // Expose helpers for inline handlers
    window._renderAuthTab = (tab) => renderAuthPanel(tab);
    
    window.colDoGoogle = async () => {
        if(!supabaseClient) return;
        await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });
    };

    window._handleColAuthSubmit = async (e, mode) => {
        e.preventDefault();
        if(!supabaseClient) return;
        
        const email = document.getElementById('colAuthEmail').value;
        const pass = document.getElementById('colAuthPass').value;
        const btn = document.getElementById('colAuthSubmitBtn');
        const errDiv = document.getElementById('colAuthError');
        
        btn.textContent = 'Processing...';
        btn.disabled = true;
        errDiv.style.display = 'none';

        try {
            let res;
            if (mode === 'signup') {
                const name = document.getElementById('colAuthName').value;
                res = await supabaseClient.auth.signUp({
                    email: email, password: pass,
                    options: { data: { full_name: name } }
                });
            } else {
                res = await supabaseClient.auth.signInWithPassword({
                    email: email, password: pass
                });
            }

            if (res.error) throw res.error;
            
            if (mode === 'signup' && res.data.user && !res.data.session) {
                errDiv.textContent = 'Please check your email to confirm registration.';
                errDiv.style.color = '#10b981';
                errDiv.style.display = 'block';
            } else {
                document.getElementById('colAuthModal').classList.remove('open');
            }
        } catch (error) {
            errDiv.textContent = error.message;
            errDiv.style.color = '#ef4444';
            errDiv.style.display = 'block';
        }
        btn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
        btn.disabled = false;
    };

    window.colDoLogout = async () => {
        if(!supabaseClient) return;
        await supabaseClient.auth.signOut();
        document.getElementById('colAuthModal').classList.remove('open');
    };

    function updateAuthUI() {
        // Find existing UI elements in any page
        const navBtns = document.querySelectorAll('.nav-login-btn, #navLoginBtn, #sbSignBtn');
        const navProfiles = document.querySelectorAll('.nav-user-profile, #navUserProfile, #pCard');
        
        if (window.colUser) {
            navBtns.forEach(btn => btn.style.display = 'none');
            navProfiles.forEach(prof => {
                prof.style.display = 'flex';
                prof.onclick = window.openGlobalLogin; // ensure it opens the modal
                
                // Try to find the inner text elements
                const nameEls = prof.querySelectorAll('span, .pname');
                const avEls = prof.querySelectorAll('.nav-user-avatar, .pav');
                const emailEls = prof.querySelectorAll('.pemail');

                nameEls.forEach(el => el.textContent = window.colUser.name.split(' ')[0]);
                emailEls.forEach(el => el.textContent = window.colUser.email);
                
                avEls.forEach(av => {
                    if (window.colUser.picture) {
                        av.innerHTML = `<img src="${window.colUser.picture}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                    } else {
                        av.innerHTML = '';
                        av.textContent = window.colUser.name.charAt(0).toUpperCase();
                    }
                });
            });
        } else {
            navBtns.forEach(btn => {
                btn.style.display = 'flex';
                btn.onclick = window.openGlobalLogin;
            });
            navProfiles.forEach(prof => prof.style.display = 'none');
        }
    }

    // Auto-update UI on load if we have cached elements but Auth hasn't finished loading yet
    document.addEventListener('DOMContentLoaded', updateAuthUI);
})();
