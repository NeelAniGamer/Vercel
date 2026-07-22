const BADGES = [
  { id: 'safe_walker', name: 'Safe Walker Badge', icon: '🚶', desc: 'Crossed all roads safely as a pedestrian' },
  { id: 'law_abider', name: 'Law Abider Badge', icon: '🏛️', desc: 'Passed all checkpoint inspections cleanly' },
  { id: 'speed_king', name: 'Speed King Badge', icon: '🏎️', desc: 'Completed Sea Link with zero speed violations' },
  { id: 'traffic_hero', name: 'Traffic Hero Badge', icon: '🌟', desc: 'Completed all 52 levels of the Academy' },
  { id: 'smart_citizen', name: 'Mumbai Smart Citizen', icon: '🏙️', desc: 'Earned the Traffic Hero badge 🔄 A true road hero' },
  { id: 'signal_master', name: 'Signal Master', icon: '🚦', desc: 'Completed 5+ levels without a single red-light violation' },
  // Level Group Badges
  { id: 'level_10', name: 'Novice Driver', icon: '🎓', desc: 'Completed first 10 levels' },
  { id: 'level_20', name: 'Learner Driver', icon: '📋', desc: 'Completed first 20 levels' },
  { id: 'level_30', name: 'Competent Driver', icon: '🎖️', desc: 'Completed first 30 levels' },
  { id: 'level_40', name: 'Skilled Driver', icon: '🏅', desc: 'Completed first 40 levels' },
  { id: 'level_52', name: 'Master Driver', icon: '💎', desc: 'Completed all 52 levels' },
  { id: 'pedestrian_expert', name: 'Pedestrian Expert', icon: '🚶‍♂️', desc: 'Completed all pedestrian mode levels' },
  { id: 'night_driver', name: 'Night Driver', icon: '🌙', desc: 'Completed all night driving levels' },
  { id: 'weather_pro', name: 'Weather Expert', icon: '⛈️', desc: 'Completed all weather-related levels' },
  { id: 'emergency_hero', name: 'Emergency Hero', icon: '🚑', desc: 'Completed all emergency vehicle levels' },
  { id: 'parking_master', name: 'Parking Master', icon: '🅿️', desc: 'Completed all parking scenarios' }
]

// 🚦 STATE MANAGEMENT 🚦
let S = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000, studentId: null }
try {
  const s = localStorage.getItem('mth4')
  if (s) S = Object.assign(S, JSON.parse(s))
} catch (e) {}
if (!S.comp) S.comp = {}
if (!S.badges) S.badges = []
if (!S.studentId) {
  S.studentId = 'STU-' + Math.floor(100000 + Math.random() * 900000)
  try { localStorage.setItem('mth4', JSON.stringify(S)) } catch (e) {}
}
const save = async () => {
  try {
    localStorage.setItem('mth4', JSON.stringify(S))
  } catch (e) {}
  if (window.supabaseClient && window.colUser) {
    try {
      const uid = window.colUser.id;
      // Sync user profile & unique student ID
      await window.supabaseClient.from('user_profiles').upsert({
        user_id: uid,
        student_id: S.studentId,
        full_name: S.name || 'Traffic Hero',
        civic_score: S.civicScore || 0,
        total_score: S.total || 0,
        violation_history: S.violationHistory || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).catch(() => {});

      for (const [levelId, data] of Object.entries(S.comp || {})) {
        await window.supabaseClient.from('game_progress').upsert({
          user_id: uid,
          level_id: levelId,
          completed: true,
          score: data.score || 0,
          time_seconds: data.time || 0,
          completed_at: data.time ? new Date(data.time).toISOString() : new Date().toISOString()
        }, { onConflict: 'user_id,level_id' }).catch(() => {});
      }
      if (S.scenario2d) {
        for (const [k, v] of Object.entries(S.scenario2d)) {
          if (k.endsWith('_done') && v === true) {
            const baseId = k.replace('_done', '');
            const stars = S.scenario2d[`${baseId}_stars`] || 0;
            await window.supabaseClient.from('game_progress').upsert({
              user_id: uid,
              level_id: baseId,
              completed: true,
              stars: stars,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,level_id' }).catch(() => {});
          }
        }
      }
      for (const badgeId of (S.badges || [])) {
        await window.supabaseClient.from('badges').upsert({
          user_id: uid,
          badge_type: badgeId
        }, { onConflict: 'user_id,badge_type' }).catch(() => {});
      }
      await window.supabaseClient.from('wallets').upsert({
        user_id: uid,
        balance: S.wallet || 50000
      }, { onConflict: 'user_id' }).catch(() => {});
    } catch(err) {
      // Silent fallback to localStorage
      console.warn('Cloud save failed, using localStorage only');
    }
  }
}

// ☁️ CLOUD CONFLICT RESOLUTION ☁️
93: window.addEventListener('col-auth-changed', async (e) => {
  const customUser = e.detail && e.detail.user ? e.detail.user : window.colUser
  const user = customUser ? customUser.session.user : null

  // UPDATE NAV BAR PROFILE UI
  if (user) {
    const meta = user.user_metadata || {}
    const name = meta.full_name || 'Driver'
    const fName = name.split(' ')[0]

    // Driving.html IDs
    const navBtn = document.getElementById('nav-sign-in-btn')
    const navProf = document.getElementById('navUserProfile')
    if (navBtn && navProf) {
      navBtn.style.display = 'none'
      navProf.style.display = 'flex'
      document.getElementById('navUserName').innerText = fName
      const pfp = document.getElementById('navUserPfp')
      const ini = document.getElementById('navUserInitials')
      if (meta.avatar_url && pfp && ini) {
        pfp.src = meta.avatar_url
        pfp.style.display = 'block'
        ini.style.display = 'none'
      } else if (ini) {
        ini.innerText = fName.charAt(0).toUpperCase()
        ini.style.display = 'flex'
        if (pfp) pfp.style.display = 'none'
      }
    }

    // Academy.html IDs
    const acadBtn = document.getElementById('academy-sign-in-btn')
    const acadProf = document.getElementById('trafficUserProfile')
    if (acadBtn) acadBtn.style.display = 'none'
    if (acadProf) {
      acadProf.style.display = 'flex'
      acadProf.onclick = () => (window.location.href = 'TrafficDashboard.html')
    }
    const acadName = document.getElementById('trafficUserName')
    if (acadName) acadName.textContent = fName
    const acadPfp = document.getElementById('trafficUserPfp')
    const acadIni = document.getElementById('trafficUserInitials')
    if (meta.avatar_url && acadPfp && acadIni) {
      acadPfp.src = meta.avatar_url
      acadPfp.style.display = 'block'
      acadIni.style.display = 'none'
    } else if (acadIni) {
      acadIni.textContent = fName.charAt(0).toUpperCase()
      acadIni.style.display = 'flex'
      if (acadPfp) acadPfp.style.display = 'none'
    }
  } else {
    // Signed out — hide profile, show sign-in on Academy.html
    const acadBtn = document.getElementById('academy-sign-in-btn')
    const acadProf = document.getElementById('trafficUserProfile')
    if (acadBtn) acadBtn.style.display = 'block'
    if (acadProf) acadProf.style.display = 'none'
  }

  if (user) {
    let cloudS = null;
    
    // Attempt to load from tables first
    if (window.supabaseClient) {
      try {
        const { data: progress } = await window.supabaseClient.from('game_progress').select('*').eq('user_id', user.id);
        const { data: badges } = await window.supabaseClient.from('badges').select('badge_type').eq('user_id', user.id);
        const { data: wallet } = await window.supabaseClient.from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
        
        if (progress && progress.length > 0) {
          const comp = {};
          const scenario2d = { total: 0 };
          
          progress.forEach(p => {
            if (p.level_id.startsWith('s') && !isNaN(parseInt(p.level_id.replace('s', '')))) {
              scenario2d[`${p.level_id}_done`] = true;
              scenario2d[`${p.level_id}_stars`] = p.stars || 0;
              if (p.completed) scenario2d.total++;
            } else {
              comp[p.level_id] = { score: p.score, time: new Date(p.completed_at || Date.now()).getTime() };
            }
          });
          
          cloudS = {
            comp,
            scenario2d,
            badges: badges ? badges.map(b => b.badge_type) : [],
            total: Object.keys(comp).length,
            wallet: wallet?.balance ?? 50000
          };
        }
      } catch (err) {
        // Silent fallback - use localStorage only
        console.warn('Cloud load failed, using localStorage only');
      }
    }
    
    // Fallback/migrate from user_metadata if tables are empty but metadata exists
    if (!cloudS && user.user_metadata && user.user_metadata.progress) {
      cloudS = user.user_metadata.progress;
    }

    // Provide a minimal structure to S if undefined
    if (!S) S = { comp: {}, badges: [], total: 0, wallet: 50000 }

    if (cloudS) {
      // Determine if they actually differ in a meaningful way
      const isDifferent =
        cloudS.total !== S.total || (cloudS.badges && S.badges && cloudS.badges.length !== S.badges.length) || Object.keys(cloudS.comp || {}).length !== Object.keys(S.comp || {}).length

      if (isDifferent) {
        // If local has no actual progress but cloud does, auto-restore
        if (S.total === 0 && Object.keys(S.comp || {}).length === 0 && cloudS.total > 0) {
          S = cloudS
          try {
            localStorage.setItem('mth4', JSON.stringify(S))
          } catch (e) {}
          toast('☁️ Cloud Data Auto-Restored!', '#5ED4F5')
          if (window.ui && window.ui.init) ui.init()
        }
        // If cloud has no actual progress but local does, auto-upload
        else if (cloudS.total === 0 && Object.keys(cloudS.comp || {}).length === 0 && S.total > 0) {
          save()
          toast('⬆️ Local Data Synced to Cloud!', '#F2B84B')
        } else {
          // Show conflict resolution if states differ and both have some progress
          injectConflictModal(cloudS)
          document.getElementById('conflictMo').style.display = 'flex'
        }
      }
    } else {
      // Logged in but no cloud progress, upload local progress if any
      if (S && S.total > 0) {
        save()
        toast('⬆️ Local Data Synced to Cloud!', '#F2B84B')
      }
    }
  }
})

function injectConflictModal(cloudS) {
  window.__pendingCloudS = cloudS
  if (document.getElementById('conflictMo')) document.getElementById('conflictMo').remove()

  // Calculate stats
  const getStats = (state) => {
    const lvls = Object.keys(state.comp || {}).length
    const wlt = state.wallet || 0
    const bdg = (state.badges || []).length

    // Find latest timestamp
    let latest = 0
    if (state.comp) {
      for (let k in state.comp) {
        if (state.comp[k].time > latest) latest = state.comp[k].time
      }
    }
    const dateStr = latest > 0 ? new Date(latest).toLocaleString() : 'Unknown'
    return { lvls, wlt, bdg, dateStr }
  }

  const cSt = getStats(cloudS)
  const lSt = getStats(S)

  const mo = document.createElement('div')
  mo.className = 'mo'
  mo.id = 'conflictMo'
  mo.style.display = 'flex'
  mo.innerHTML = `
            <div class="md" style="background:var(--card, #111827); color:var(--text, #E8E3D8); padding:30px; border-radius:16px; max-width:600px; width:90%; margin:auto; z-index: 10001; position: relative;">
                <div class="md-hd" style="border-bottom: 1px solid var(--border, rgba(255,255,255,0.08)); margin-bottom: 20px; padding-bottom: 15px; text-align:center;">
                    <h2 style="font-family:'Instrument Serif', serif; font-size:2.5rem; margin-bottom:10px;">Sync Conflict</h2>
                    <p style="color:var(--muted, #8891AA); font-size:1rem;">We found existing cloud data that differs from your local device. Which save do you want to keep?</p>
                </div>
                <div class="md-body" style="display:flex; gap:20px; flex-wrap:wrap;">
                    
                    <!-- Cloud Save Card -->
                    <div style="flex:1; min-width:220px; background:rgba(94, 212, 245, 0.05); border:1px solid rgba(94, 212, 245, 0.3); border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:8px;">
                        <div style="font-size:1.2rem; font-weight:700; color:#5ED4F5; margin-bottom:10px; display:flex; align-items:center; gap:8px;">☁️ Cloud Save</div>
                        <div style="font-size:0.9rem; color:var(--muted);">Levels Completed: <b style="color:var(--text);">${cSt.lvls}</b></div>
                        <div style="font-size:0.9rem; color:var(--muted);">Wallet: <b style="color:#F2B84B;">₹${cSt.wlt.toLocaleString()}</b></div>
                        <div style="font-size:0.9rem; color:var(--muted);">Badges: <b style="color:var(--text);">${cSt.bdg}</b></div>
                        <div style="font-size:0.8rem; color:var(--muted); margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">Last Played:<br/>${cSt.dateStr}</div>
                        <button class="btn" onclick="resolveConflict('cloud')" style="margin-top:auto; background:#5ED4F5; color:#000; padding:12px; font-weight:bold; border-radius:8px; border:none; cursor:pointer; width:100%;">Download This</button>
                    </div>

                    <!-- Local Save Card -->
                    <div style="flex:1; min-width:220px; background:rgba(242, 184, 75, 0.05); border:1px solid rgba(242, 184, 75, 0.3); border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:8px;">
                        <div style="font-size:1.2rem; font-weight:700; color:#F2B84B; margin-bottom:10px; display:flex; align-items:center; gap:8px;">📱 Local Save</div>
                        <div style="font-size:0.9rem; color:var(--muted);">Levels Completed: <b style="color:var(--text);">${lSt.lvls}</b></div>
                        <div style="font-size:0.9rem; color:var(--muted);">Wallet: <b style="color:#F2B84B;">₹${lSt.wlt.toLocaleString()}</b></div>
                        <div style="font-size:0.9rem; color:var(--muted);">Badges: <b style="color:var(--text);">${lSt.bdg}</b></div>
                        <div style="font-size:0.8rem; color:var(--muted); margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">Last Played:<br/>${lSt.dateStr}</div>
                        <button class="btn" onclick="resolveConflict('local')" style="margin-top:auto; background:#F2B84B; color:#000; padding:12px; font-weight:bold; border-radius:8px; border:none; cursor:pointer; width:100%;">Keep This (Overwrite Cloud)</button>
                    </div>

                </div>
            </div>
        `
  if (!document.getElementById('col-ui-minimal')) {
    const style = document.createElement('style')
    style.id = 'col-ui-minimal'
    style.innerHTML = `
                .mo { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; }
                .md { box-shadow: 0 15px 35px rgba(0,0,0,0.4); }
                .btn { transition: transform 0.2s, opacity 0.2s; }
                .btn:hover { opacity: 0.9; transform: translateY(-2px); }
            `
    document.head.appendChild(style)
  }
  document.body.appendChild(mo)
}

window.resolveConflict = function (choice) {
  document.getElementById('conflictMo').style.display = 'none'
  if (choice === 'cloud') {
    const cloudS = window.__pendingCloudS
    if (cloudS) {
      S = cloudS
      try {
        localStorage.setItem('mth4', JSON.stringify(S))
      } catch (e) {}
      if (window.ui && window.ui.init) ui.init() // Refresh UI
      toast('☁️ Cloud Data Restored!', '#5ED4F5')
    }
  } else {
    // local wins
    save()
    toast('⬆️ Local Data Synced to Cloud!', '#F2B84B')
  }
}

// 🚦 UTILS 🚦
