const BADGES = [
      { id: 'safe_walker', name: 'Safe Walker Badge', icon: '🚶', desc: 'Crossed all roads safely as a pedestrian' },
      { id: 'law_abider', name: 'Law Abider Badge', icon: '🏛️', desc: 'Passed all checkpoint inspections cleanly' },
      { id: 'speed_king', name: 'Speed King Badge', icon: '🏎️', desc: 'Completed Sea Link with zero speed violations' },
      { id: 'traffic_hero', name: 'Traffic Hero Badge', icon: '🌟', desc: 'Completed all 15 levels of the Academy' },
      { id: 'smart_citizen', name: 'Mumbai Smart Citizen', icon: '🏙️', desc: 'Earned the Traffic Hero badge 🔄 A true road hero' },
      { id: 'signal_master', name: 'Signal Master', icon: '🚦', desc: 'Completed 5+ levels without a single red-light violation' }
    ];

    // 🚦 STATE MANAGEMENT 🚦
    let S = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000 };
    try { const s = localStorage.getItem('mth4'); if (s) S = Object.assign(S, JSON.parse(s)); } catch (e) { }
    if (!S.comp) S.comp = {};
    if (!S.badges) S.badges = [];
    const save = () => { 
      try { localStorage.setItem('mth4', JSON.stringify(S)); } catch (e) { } 
      if (window.supabaseClient && window.colUser) {
        window.supabaseClient.auth.updateUser({ data: { progress: S } }).catch(err => console.error("Cloud save failed", err));
      }
    };

    // ☁️ CLOUD CONFLICT RESOLUTION ☁️
    window.addEventListener('col-auth-changed', (e) => {
        const customUser = (e.detail && e.detail.user) ? e.detail.user : window.colUser;
        const user = customUser ? customUser.session.user : null;
        

        if (user && user.user_metadata && user.user_metadata.progress) {
            const cloudS = user.user_metadata.progress;
            // Provide a minimal structure to S if undefined
            if (!S) S = { comp: {}, badges: [], total: 0, wallet: 50000 };
            
            // Determine if they actually differ in a meaningful way
            const isDifferent = (cloudS.total !== S.total) || 
                                (cloudS.badges && S.badges && cloudS.badges.length !== S.badges.length) ||
                                (Object.keys(cloudS.comp || {}).length !== Object.keys(S.comp || {}).length);
            
            if (isDifferent) {
                // If local has no actual progress but cloud does, auto-restore
                if (S.total === 0 && Object.keys(S.comp || {}).length === 0 && cloudS.total > 0) {
                    S = cloudS;
                    try { localStorage.setItem('mth4', JSON.stringify(S)); } catch (e) { }
                    toast('☁️ Cloud Data Auto-Restored!', '#5ED4F5');
                    if (window.ui && window.ui.init) ui.init();
                } 
                // If cloud has no actual progress but local does, auto-upload
                else if (cloudS.total === 0 && Object.keys(cloudS.comp || {}).length === 0 && S.total > 0) {
                    window.supabaseClient.auth.updateUser({ data: { progress: S } }).catch(()=>{});
                    toast('⬆️ Local Data Synced to Cloud!', '#F2B84B');
                }
                else {
                    // Show conflict resolution if states differ and both have some progress
                    injectConflictModal(cloudS);
                    document.getElementById('conflictMo').style.display = 'flex';
                }
            }
        } else if (user) {
            // Logged in but no cloud progress, upload local progress if any
            if (S && S.total > 0) {
                window.supabaseClient.auth.updateUser({ data: { progress: S } }).catch(()=>{});
                toast('⬆️ Local Data Synced to Cloud!', '#F2B84B');
            }
        }
    });

    function injectConflictModal(cloudS) {
        window.__pendingCloudS = cloudS;
        if (document.getElementById('conflictMo')) return;
        const mo = document.createElement('div');
        mo.className = 'mo';
        mo.id = 'conflictMo';
        mo.style.display = 'flex';
        mo.innerHTML = `
            <div class="md" style="background:#111827; color:#E8E3D8; padding:20px; border-radius:12px; max-width:400px; margin:auto; margin-top:100px; z-index: 10001; position: relative;">
                <div class="md-hd" style="border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 15px; padding-bottom: 15px;">
                    <h2 style="font-family:'Instrument Serif', serif; font-size:2rem; margin-bottom:5px;">Cloud Sync Conflict</h2>
                    <p style="color:#8891AA; font-size:0.9rem;">Your local progress differs from the cloud. Which data would you like to keep?</p>
                </div>
                <div class="md-body" style="display:flex; flex-direction:column; gap:10px;">
                    <button class="btn" onclick="resolveConflict('cloud')" style="background:#5ED4F5; color:#000; padding:12px; font-weight:bold; border-radius:6px; border:none; cursor:pointer;">Download Cloud Data</button>
                    <button class="btn" onclick="resolveConflict('local')" style="background:#F2B84B; color:#000; padding:12px; font-weight:bold; border-radius:6px; border:none; cursor:pointer;">Keep Local Data (Overwrite Cloud)</button>
                </div>
            </div>
        `;
        if (!document.getElementById('col-ui-minimal')) {
            const style = document.createElement('style');
            style.id = 'col-ui-minimal';
            style.innerHTML = `
                .mo { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; }
                .md { background: #111827; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                .md-hd { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
                .md-hd h2 { font-family: 'Instrument Serif', serif; font-size: 2rem; color: #E8E3D8; margin-bottom: 5px; }
                .md-hd p { color: #8891AA; font-size: 0.9rem; }
                .md-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
                .btn { transition: opacity 0.2s; }
                .btn:hover { opacity: 0.9; }
            `;
            document.head.appendChild(style);
        }
        document.body.appendChild(mo);
    }

    window.resolveConflict = function(choice) {
        document.getElementById('conflictMo').style.display = 'none';
        if (choice === 'cloud') {
            const cloudS = window.__pendingCloudS;
            if (cloudS) {
                S = cloudS;
                try { localStorage.setItem('mth4', JSON.stringify(S)); } catch (e) { }
                if (window.ui && window.ui.init) ui.init(); // Refresh UI
                toast('☁️ Cloud Data Restored!', '#5ED4F5');
            }
        } else {
            // local wins
            save();
            toast('⬆️ Local Data Synced to Cloud!', '#F2B84B');

        }
    };


    // 🚦 UTILS 🚦