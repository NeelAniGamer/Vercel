
      const _uidParam = new URLSearchParams(window.location.search).get('uid')
      let _isReadOnlyMode = !!_uidParam

      let S = {}
      try {
        const raw = localStorage.getItem('mth4')
        if (raw) S = JSON.parse(raw)
      } catch (e) {}

      let tUser = {}
      try {
        const raw = localStorage.getItem('traffic_local_user')
        if (raw) tUser = JSON.parse(raw)
      } catch (e) {}

      const _certParam = new URLSearchParams(window.location.search).get('cert')
      let _syncedCertId = null

      async function _initSupabase() {
        if (window.supabaseClient) return window.supabaseClient
        try {
          const res = await fetch('config.json?t=' + Date.now())
          const cfg = await res.json()
          const auth = cfg.auth || cfg.supabase || {}
          const url = auth.supabaseUrl || auth.url || ''
          const key = auth.supabaseKey || auth.anonKey || auth.key || ''
          if (url && key && window.supabase) {
            window.supabaseClient = window.supabase.createClient(url, key)
          }
        } catch (e) {}
        return window.supabaseClient || null
      }

      async function _loadCloudProgress(userId) {
        const client = await _initSupabase()
        if (!client) return null
        try {
          const { data: progress } = await client.from('game_progress').select('*').eq('user_id', userId)
          const { data: badges } = await client.from('badges').select('badge_type').eq('user_id', userId)
          const { data: wallet } = await client.from('wallets').select('balance').eq('user_id', userId).maybeSingle()
          
          if (progress && progress.length > 0) {
            const comp = {}
            const scenario2d = { total: 0 }
            progress.forEach(p => {
              if (p.level_id.startsWith('s') && !isNaN(parseInt(p.level_id.replace('s', '')))) {
                scenario2d[`${p.level_id}_done`] = true
                scenario2d[`${p.level_id}_stars`] = p.stars || 0
                if (p.completed) scenario2d.total++
              } else {
                comp[p.level_id] = { score: p.score, time: new Date(p.completed_at || Date.now()).getTime() }
              }
            })
            return {
              comp,
              scenario2d,
              badges: badges ? badges.map(b => b.badge_type) : [],
              total: Object.keys(comp).length,
              wallet: wallet?.balance ?? 50000
            }
          }
        } catch (err) {
          console.warn('Cloud load failed:', err)
        }
        return null
      }

      async function _syncCloudToLocal(userId) {
        const cloudS = await _loadCloudProgress(userId)
        if (!cloudS) return false
        
        const cloudHasData = cloudS.total > 0 || (cloudS.badges && cloudS.badges.length > 0) || cloudS.wallet !== 50000
        const localHasData = S.total > 0 || (S.badges && S.badges.length > 0) || S.wallet !== 50000
        
        if (cloudHasData && !localHasData) {
          S = { ...S, ...cloudS }
          try { localStorage.setItem('mth4', JSON.stringify(S)) } catch (e) {}
          toast('☁️ Cloud Data Auto-Restored!', '#5ED4F5')
          if (window.ui && window.ui.init) ui.init()
          return true
        } else if (cloudHasData && localHasData) {
          const isDifferent = cloudS.total !== S.total || 
            (cloudS.badges && S.badges && cloudS.badges.length !== S.badges.length) ||
            Object.keys(cloudS.comp || {}).length !== Object.keys(S.comp || {}).length
          
          if (isDifferent) {
            injectConflictModal(cloudS)
            document.getElementById('conflictMo').style.display = 'flex'
            return true
          }
        }
        return false
      }

      async function _loadSharedCertificate(id) {
        const client = await _initSupabase()
        if (!client) return null
        const { data, error } = await client.from('certificates').select('*').eq('id', id).single()
        if (error || !data) return null
        return data
      }

      async function _syncOwnCertificate(name, completedCount, scoreTotal) {
        if (completedCount < 52) return null
        const client = await _initSupabase()
        if (!client || !window.colUser || !window.colUser.id) {
          console.warn('Certificate Sync failed: User not logged in or Supabase client missing.')
          return null
        }
        try {
          const { data, error } = await client.from('certificates').upsert(
            { user_id: window.colUser.id, display_name: name, modules_completed: completedCount, total_modules: 52, score: scoreTotal, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          ).select().single()
          if (error) {
            console.error('Supabase Upsert Error for Certificate:', error)
            return null
          }
          localStorage.setItem('own_cert_id', data.id)
          return data.id
        } catch (e) {
          console.error('Certificate Sync Exception:', e)
          return null 
        }
      }

      async function renderDashboardUI() {
        if (_isReadOnlyMode) {
            const client = await _initSupabase();
            if (client) {
              const { data } = await client.from('profiles').select('id, raw_user_meta_data').eq('id', _uidParam).maybeSingle();
              if (data && data.raw_user_meta_data) {
                 const meta = data.raw_user_meta_data;
                 tUser.name = meta.full_name || 'Driver';
                 tUser.username = meta.username || '';
                 tUser.vehicle = meta.vehicle || 'Car';
                 tUser.age = meta.age || 18;
                 tUser.language = meta.language || 'en';
                 if (meta.traffic_save) {
                    S = typeof meta.traffic_save === 'string' ? JSON.parse(meta.traffic_save) : meta.traffic_save;
                 }
              }
            }
            const menuContainer = document.querySelector('.menu-container');
            if (menuContainer) menuContainer.style.display = 'none';
            const topActions = document.querySelector('.top-bar-actions');
            if (topActions && !document.getElementById('ro-badge')) {
              topActions.insertAdjacentHTML('afterbegin', '<div id="ro-badge" style="background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; color: var(--muted); margin-right: 12px; border: 1px solid var(--border);">Read-Only Mode</div>');
            }
            document.title = (tUser.name || 'Driver') + "'s Profile | Traffic Hero";
        }

        const displayName = tUser.name || S.name || 'Driver'
        const userInitials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

        ;[document.getElementById('avatar-sm'), document.getElementById('hero-avatar')].forEach(el => {
          if (!el) return;
          let userPhoto = null
          try {
            if (!_isReadOnlyMode) {
              const ls = localStorage.getItem('col_user')
              if (ls) { const u = JSON.parse(ls); userPhoto = u.avatar || u.photo || null }
            }
          } catch (e) {}
          if (userPhoto) el.innerHTML = '<img src="' + userPhoto + '" alt="avatar" />'
          else el.textContent = userInitials
        })

        document.getElementById('top-name').innerText = displayName
        document.getElementById('h-name').innerText = displayName

        const displayUsername = tUser.username || S.username || (!_isReadOnlyMode && window.colUser && window.colUser.user_metadata && window.colUser.user_metadata.username) || '';
        const hUsername = document.getElementById('h-username');
        if (hUsername && displayUsername) {
          hUsername.innerText = displayUsername.startsWith('@') ? displayUsername : '@' + displayUsername;
          hUsername.style.display = 'block';
        }

        const role = (tUser.role || S.role || 'student')
        const studentId = S.studentId || ('STU-' + Math.floor(100000 + Math.random() * 900000))
        document.getElementById('h-id').innerText = 'ID: ' + studentId

        document.getElementById('s-veh').innerText = tUser.vehicle || S.vehicle || 'Car'
        const ageVal = tUser.age || S.age || 18
        const ageLabels = { child: '8-12 (Kids)', teen: '13-17 (Teens)', young: '18-25 (Young)', adult: '26-50 (Adult)', senior: '51+ (Senior)' }
        const ageBracket = ageVal <= 12 ? 'child' : ageVal <= 17 ? 'teen' : ageVal <= 25 ? 'young' : ageVal <= 50 ? 'adult' : 'senior'
        document.getElementById('s-age').innerText = ageLabels[ageBracket] || '18'
        document.getElementById('s-lang').innerText = (tUser.language || S.language || 'en') === 'hi' ? 'हिंदी' : 'English'
        document.getElementById('h-score').innerText = (S.total || 0).toLocaleString()

        const civicScore = S.civicScore || 0
        const civicTiers = [
          { at: 500, label: 'Platinum Citizen', emoji: '🌟' },
          { at: 250, label: 'Gold Citizen', emoji: '🏆' },
          { at: 100, label: 'Silver Citizen', emoji: '🥈' },
          { at: 25, label: 'Bronze Citizen', emoji: '🥉' },
          { at: 0, label: 'Civic Score', emoji: '🌱' }
        ]
        const civicTier = civicTiers.find((t) => civicScore >= t.at)
        document.getElementById('h-tier').innerText = `${civicTier.emoji} ${civicTier.label}`

        let completed = 0
        if (S.comp) completed = Object.keys(S.comp).filter((k) => S.comp[k] && S.comp[k].score > 0).length
        document.getElementById('s-prog').innerText = `${completed}/52`

        const progressPct = Math.round((completed / 52) * 100)
        document.getElementById('global-fill').style.width = progressPct + '%'
        document.getElementById('global-pct').innerText = progressPct + '%'

        const certProgressCanvas = document.getElementById('cert-progress-canvas')
        if (certProgressCanvas && window.TrafficCharts) {
          window.TrafficCharts.createProgressRing(certProgressCanvas, progressPct, { cutout: '70%' })
        }
        document.getElementById('cert-progress-pct').textContent = progressPct + '%'
        document.getElementById('cert-progress-text').textContent = completed >= 52 ? 'Unlocked!' : (completed > 0 ? 'Learning...' : 'Start!')

        // Module Progress Update
        const modulePctText = document.getElementById('cert-progress-pct')
        const moduleStatusText = document.getElementById('cert-progress-text')
        const moduleFractionText = document.getElementById('s-prog')
        const moduleBar = document.getElementById('module-svg-bar')
        if (modulePctText) modulePctText.textContent = progressPct + '%'
        if (moduleStatusText) moduleStatusText.textContent = completed >= 52 ? 'Unlocked!' : (completed > 0 ? 'Learning...' : 'Start!')
        if (moduleFractionText) moduleFractionText.textContent = completed + '/52'
        if (moduleBar) {
          const offset = 283 - (283 * progressPct) / 100;
          setTimeout(() => moduleBar.style.strokeDashoffset = offset, 100);
        }
  
        const completions = S.comp
          ? Object.values(S.comp)
              .filter(c => c && typeof c.score === 'number' && c.score > 0)
              .sort((a, b) => (a.time || 0) - (b.time || 0))
          : []
  
        const uiScoreVal = document.getElementById('ui-score-val')
        const uiCivicVal = document.getElementById('ui-civic-val')
        if (uiScoreVal) uiScoreVal.textContent = (S.total || 0).toLocaleString()
        if (uiCivicVal) uiCivicVal.textContent = '₹' + civicScore.toLocaleString()
  
        if (completions.length > 0) {
          let runningScore = 0
          const scoreData = completions.map(c => (runningScore += c.score))
          if (scoreData.length === 1) scoreData.unshift(0)
          drawSvgTrend('score-svg-path', scoreData)
          
          const steps = Math.max(completions.length, 1)
          const civicData = completions.map((_, i) => Math.round((civicScore / steps) * (i + 1)))
          if (civicData.length === 1) civicData.unshift(0)
          drawSvgTrend('civic-svg-path', civicData)
        }
  
        const badgeList = document.getElementById('achievement-list')
        if (S.badges && S.badges.length > 0) {
          const recentBadges = [...S.badges].reverse().slice(0, 6)
          badgeList.innerHTML = recentBadges.map(b => {
            const formatted = b.replace(/_/g, ' ')
            return `<div class="badge-card">
              <div class="badge-icon">🏅</div>
              <div class="badge-name">${formatted}</div>
            </div>`
          }).join('')
        }
  
        document.getElementById('cert-name').innerText = displayName.toUpperCase()
        document.getElementById('cert-score').innerText = S.total || 0
        document.getElementById('cert-date').innerText = new Date().toLocaleDateString()
        document.getElementById('cert-ref').innerText = 'TH-' + Math.random().toString(36).substr(2, 6).toUpperCase()
  
        const certWrapper = document.getElementById('cert-wrapper')
        const noCertMsg = document.getElementById('no-cert-msg')
        const shareBar = document.getElementById('share-bar')
        const dlBtn = document.getElementById('btn-dl-cert')
  
        if (completed >= 52) {
          certWrapper.style.filter = 'none'
          certWrapper.style.opacity = '1'
          shareBar.style.display = 'flex'
          noCertMsg.style.display = 'none'
          try {
            const cachedId = localStorage.getItem('own_cert_id')
            if (cachedId) _syncedCertId = cachedId
            _syncOwnCertificate(displayName, completed, S.total || 0).then(id => { if (id) _syncedCertId = id })
          } catch (e) {}
        } else {
          const blurPx = ((52 - completed) / 52 * 5).toFixed(1)
          certWrapper.style.filter = `grayscale(1) blur(${blurPx}px)`
          certWrapper.style.opacity = (0.55 + (completed / 52) * 0.45).toFixed(2)
          noCertMsg.style.display = 'block'
          noCertMsg.querySelector('p').innerText = `Complete all 52 modules to unlock your certificate. (${completed}/52 done)`
          dlBtn.style.display = 'none'
        }
      }
      renderDashboardUI();

      function drawSvgTrend(pathId, data) {
        const path = document.getElementById(pathId);
        if (!path || data.length < 2) return;
        const minVal = Math.min(...data);
        const maxVal = Math.max(...data);
        const range = maxVal - minVal || 1;
        const pts = data.map((val, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 80 - ((val - minVal) / range) * 70;
          return `${x},${y}`;
        });
        path.setAttribute('d', `M0,80 L${pts.join(' L')} L100,80`);
      }

      window.addEventListener('col-auth-changed', async (e) => {
        const customUser = e.detail && e.detail.user ? e.detail.user : window.colUser
        const user = customUser ? customUser.session.user : null

        if (user) {
          const meta = user.user_metadata || {}
          const name = meta.full_name || 'Driver'
          const fName = name.split(' ')[0]

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

          const oldSStr2 = JSON.stringify(S)
          await _syncCloudToLocal(user.id)
          if (JSON.stringify(S) !== oldSStr2) window.location.reload()
        } else {
          const acadBtn = document.getElementById('academy-sign-in-btn')
          const acadProf = document.getElementById('trafficUserProfile')
          if (acadBtn) acadBtn.style.display = 'block'
          if (acadProf) acadProf.style.display = 'none'
        }
      });

      (async () => {
        if (window.colUser && window.colUser.id) {
          const oldSStr = JSON.stringify(S)
          await _syncCloudToLocal(window.colUser.id)
          if (JSON.stringify(S) !== oldSStr) window.location.reload()
        }
      })()

      function toggleMenu() { document.getElementById('action-menu').classList.toggle('show') }
      window.onclick = (e) => {
        if (!e.target.closest('.menu-container')) {
          document.getElementById('action-menu').classList.remove('show')
        }
      }

      function openEditModal() {
        const m = document.getElementById('edit-modal')
        document.getElementById('ed-name').value = tUser.name || S.name || ''
        document.getElementById('ed-username').value = tUser.username || S.username || (window.colUser && window.colUser.user_metadata && window.colUser.user_metadata.username) || ''
        document.getElementById('ed-age').value = tUser.age || S.age || ''
        document.getElementById('ed-vehicle').value = tUser.vehicle || S.vehicle || 'car'
        m.classList.add('show')
        document.getElementById('action-menu').classList.remove('show')
      }
      function closeEditModal() { document.getElementById('edit-modal').classList.remove('show') }
      function saveEditModal() {
        const name = document.getElementById('ed-name').value.trim()
        let usernameInput = document.getElementById('ed-username').value.trim()
        const age = parseInt(document.getElementById('ed-age').value) || 18
        const vehicle = document.getElementById('ed-vehicle').value
        if (name) {
          tUser.name = name; tUser.age = age; tUser.vehicle = vehicle
          S.name = name; S.age = age; S.vehicle = vehicle
          
          if (usernameInput) {
            if (!usernameInput.startsWith('@')) usernameInput = '@' + usernameInput;
            tUser.username = usernameInput;
            S.username = usernameInput;
            if (window.supabaseClient && window.colUser) {
              window.supabaseClient.auth.updateUser({
                data: { username: usernameInput }
              }).catch(console.error);
            }
          }
          
          localStorage.setItem('traffic_local_user', JSON.stringify(tUser))
          localStorage.setItem('th-save', JSON.stringify(S))
          if (window.save) window.save()
          
          setTimeout(() => window.location.reload(), 300)
        }
      }

      function dlCert() {
        if (completed < 52) return alert('Unlock your certificate first!')
        if (typeof html2pdf !== 'undefined') {
          html2pdf().set({
            margin: 0, filename: 'Traffic_Hero_Certificate.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
          }).from(document.getElementById('cert-wrapper')).save()
        }
      }

      async function getCertUrl() {
        let cid = _syncedCertId || localStorage.getItem('own_cert_id')
        if (!cid && completed >= 52) {
          const displayName = (window.colUser && window.colUser.user_metadata && window.colUser.user_metadata.full_name) || S.name || 'Driver'
          cid = await _syncOwnCertificate(displayName, completed, S.total || 0)
          if (cid) _syncedCertId = cid
        }
        if (!cid) {
          return null;
        }
        return `${window.location.origin}${window.location.pathname}?cert=${cid}`
      }
      function getShareText() {
        const n = tUser.name || S.name || 'Driver'
        let c = 0
        if (S.comp) c = Object.keys(S.comp).filter(k => S.comp[k] && S.comp[k].score > 0).length
        return `I completed my Traffic Hero Certification! ${n} — ${c}/52 modules done.`
      }

      async function _certImageFile() {
        const el = document.getElementById('cert-wrapper')
        if (!el || typeof html2canvas === 'undefined') return null
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#070a14' })
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
        return blob ? new File([blob], 'Traffic_Hero_Certificate.png', { type: 'image/png' }) : null
      }

      async function shareWhatsApp() {
        const file = await _certImageFile()
        const url = await getCertUrl()
        if (!url) { toast('Complete 52 modules or check connection!', '#ff4444'); return }
        const textToShare = getShareText() + '\n' + url
        if (file && navigator.canShare && navigator.canShare({ files: [file], text: textToShare })) {
          try { await navigator.share({ files: [file], text: textToShare }); return } catch (e) {}
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank')
      }

      async function shareInstagram() {
        const file = await _certImageFile()
        const url = await getCertUrl()
        if (!url) { toast('Complete 52 modules or check connection!', '#ff4444'); return }
        const textToShare = getShareText() + '\n' + url
        if (file && navigator.canShare && navigator.canShare({ files: [file], text: textToShare })) {
          try { await navigator.share({ files: [file], text: textToShare }); return } catch (e) {}
        }
        navigator.clipboard.writeText(textToShare).then(() => toast('Copied! Paste in your story.', '#5ed4f5'))
      }

      async function copyCertLink() {
        const url = await getCertUrl()
        if (!url) { toast('Complete 52 modules or check connection!', '#ff4444'); return }
        navigator.clipboard.writeText(url).then(() => toast('Link copied!', '#5ed4f5'))
      }

      function logoutAndClear() {
        localStorage.removeItem('trafficSetupComplete'); localStorage.removeItem('traffic_local_user')
        if (window.doLogout) window.doLogout()
        window.location.href = 'Academy.html'
      }

      function resetProgressFromDashboard() {
        if (confirm('⚠️ Reset ALL progress? This cannot be undone!')) {
          localStorage.removeItem('traffic_local_user'); localStorage.removeItem('trafficSetupComplete'); localStorage.removeItem('col_user')
          window.location.href = 'Academy.html'
        }
      }

      function hzInit() {
        var t = localStorage.getItem('theme');
        if (t === 'light') { document.body.classList.add('lm'); }
        else { document.body.classList.remove('lm'); }
        hzSync();
      }
      function hzSync() {
        var el = document.querySelector('.hz-toggle');
        if (!el) return;
        if (document.body.classList.contains('lm')) { el.classList.remove('night'); }
        else { el.classList.add('night'); }
      }
      function hzToggle() {
        document.body.classList.toggle('lm');
        localStorage.setItem('theme', document.body.classList.contains('lm') ? 'light' : 'dark');
        hzSync();
      }
      hzInit();

      function toast(msg, color) {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${color||'#34d399'};color:#000;padding:12px 24px;border-radius:30px;font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.3);animation:toastIn 0.3s ease-out;`;
        t.textContent = msg;
        if (!document.getElementById('toast-style')) {
          const s = document.createElement('style');
          s.id = 'toast-style';
          s.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}';
          document.head.appendChild(s);
        }
        document.body.appendChild(t);
        setTimeout(() => { t.style.animation = 'toastIn 0.3s ease-out reverse'; setTimeout(() => t.remove(), 300); }, 3000);
      }

      let _conflictReturnFocus = null
      function injectConflictModal(cloudS) {
        window.__pendingCloudS = cloudS
        if (document.getElementById('conflictMo')) document.getElementById('conflictMo').remove()

        const getStats = (state) => {
          const lvls = Object.keys(state.comp || {}).length
          const wlt = state.wallet || 0
          const bdg = (state.badges || []).length
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

        _conflictReturnFocus = document.activeElement

        const mo = document.createElement('div')
        mo.className = 'modal-overlay show'
        mo.id = 'conflictMo'
        mo.setAttribute('role', 'dialog')
        mo.setAttribute('aria-modal', 'true')
        mo.setAttribute('aria-labelledby', 'conflict-modal-title')
        mo.innerHTML = `
          <div class="modal-box wide">
            <div class="conflict-modal-head">
              <h2 id="conflict-modal-title">Sync Conflict</h2>
              <p>We found existing cloud data that differs from your local device. Which save do you want to keep?</p>
            </div>
            <div class="conflict-save-options">
              <div class="conflict-save-card cloud">
                <div class="title"><span aria-hidden="true">☁️</span> Cloud Save</div>
                <div class="stat">Levels Completed: <b>${cSt.lvls}</b></div>
                <div class="stat">Wallet: <b>₹${cSt.wlt.toLocaleString()}</b></div>
                <div class="stat">Badges: <b>${cSt.bdg}</b></div>
                <div class="last-played">Last Played:<br/>${cSt.dateStr}</div>
                <button class="btn-choose" onclick="resolveConflict('cloud')">Download This</button>
              </div>
              <div class="conflict-save-card local">
                <div class="title"><span aria-hidden="true">📱</span> Local Save</div>
                <div class="stat">Levels Completed: <b>${lSt.lvls}</b></div>
                <div class="stat">Wallet: <b>₹${lSt.wlt.toLocaleString()}</b></div>
                <div class="stat">Badges: <b>${lSt.bdg}</b></div>
                <div class="last-played">Last Played:<br/>${lSt.dateStr}</div>
                <button class="btn-choose" onclick="resolveConflict('local')">Keep This (Overwrite Cloud)</button>
              </div>
            </div>
          </div>
        `
        document.body.appendChild(mo)

        const firstBtn = mo.querySelector('.btn-choose')
        if (firstBtn) firstBtn.focus()

        mo.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') resolveConflict('local')
        })
      }


      window.resolveConflict = function (choice) {
        const modal = document.getElementById('conflictMo')
        if (modal) modal.remove()
        if (_conflictReturnFocus && document.contains(_conflictReturnFocus)) {
          _conflictReturnFocus.focus()
        }
        _conflictReturnFocus = null

        if (choice === 'cloud') {
          const cloudS = window.__pendingCloudS
          if (cloudS) {
            S = cloudS
            try {
              localStorage.setItem('mth4', JSON.stringify(S))
            } catch (e) {}
            if (window.ui && window.ui.init) ui.init()
            toast('☁️ Cloud Data Restored!', '#5ED4F5')
          }
        } else {
          save()
          toast('⬆️ Local Data Synced to Cloud!', '#F2B84B')
        }
      }


      (async function () {
        if (!_certParam) return
        const cert = await _loadSharedCertificate(_certParam)
        ;[document.querySelector('.hero-license'), document.querySelector('.bento-grid'), document.getElementById('btn-dl-cert'), document.getElementById('share-bar')].forEach(el => { if (el) el.style.display = 'none' })
        if (!cert) {
          const noCertMsg = document.getElementById('no-cert-msg')
          if (noCertMsg) { noCertMsg.style.display = 'block'; noCertMsg.querySelector('p').innerText = 'Invalid certificate link.' }
          document.getElementById('cert-wrapper').style.filter = 'grayscale(1) blur(6px)'
          return
        }
        document.getElementById('cert-name').innerText = (cert.display_name || '').toUpperCase()
        document.getElementById('cert-score').innerText = (cert.score || 0).toLocaleString()
        document.getElementById('cert-date').innerText = new Date(cert.issued_at).toLocaleDateString()
      })();

      async function loadCertificateGallery() {
        const targetUserId = _isReadOnlyMode ? _uidParam : (window.colUser && window.colUser.id);
        if (!window.supabaseClient || !targetUserId) return;
        const gallery = document.getElementById('cert-gallery')
        if (!gallery) return
        
        try {
          const { data: certs } = await window.supabaseClient
            .from('certificates')
            .select('*')
            .eq('user_id', targetUserId)
            .order('issued_at', { ascending: false })
          
          if (certs && certs.length > 0) {
            gallery.innerHTML = certs.map(c => `
              <div class="cert-gallery-card">
                <div class="logos">
                  <img loading="lazy" src="mumbai-police-logo.png" onerror="this.style.display='none'" alt="Mumbai Police">
                  <img loading="lazy" src="sneh-logo.png" onerror="this.style.display='none'" alt="Sneh Asha">
                </div>
                <div class="kicker">Certificate of Completion</div>
                <div class="module-name">${c.module_name || 'Traffic Hero'}</div>
                <div class="issued">Issued: ${new Date(c.issued_at).toLocaleDateString()}</div>
                <div class="score">Score: ${(c.score || 0).toLocaleString()}</div>
                <div class="footer">
                  <div class="ref">Ref: ${c.id.slice(0,8).toUpperCase()}</div>
                  <button class="btn-share" onclick="shareCertificate('${c.id}')" aria-label="Share this certificate">Share</button>
                </div>
              </div>
            `).join('')
          } else {
            gallery.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">No certificates yet. Complete all 52 levels to earn your first!</div>'
          }
        } catch (e) {
          gallery.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">Unable to load certificates.</div>'
        }
      }

      function switchMainTab(tabId) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById('nav-btn-' + tabId);
        if (activeBtn) activeBtn.classList.add('active');

        // Handle views with opacity transition
        const views = document.querySelectorAll('.main-tab-view');
        views.forEach(view => {
          if (view.id === 'tab-' + tabId) {
            view.style.display = 'block';
            // Slight delay to allow display block to take effect before opacity transition
            setTimeout(() => view.style.opacity = '1', 10);
          } else {
            view.style.opacity = '0';
            setTimeout(() => {
              if (view.style.opacity === '0') view.style.display = 'none';
            }, 300); // match CSS transition duration
          }
        });
        
        // Scroll to top when switching
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      function switchLbTab(board) {
        document.querySelectorAll('.lb-tab').forEach(t => {
          const active = t.dataset.board === board
          t.classList.toggle('active', active)
          t.setAttribute('aria-selected', active)
        })
        document.querySelectorAll('.lb-panel').forEach(p => p.style.display = 'none')
        const panel = document.getElementById('lb-panel-' + board)
        if (panel) panel.style.display = 'block'
      }

      async function loadLeaderboard() {
        const boards = ['xp', 'modules', 'civic', 'badges']
        const crowns = { xp: '🌍', modules: '✅', civic: '💰', badges: '🎖️' }
        const currentUserId = (window.colUser && window.colUser.id) ? window.colUser.id : null

        boards.forEach(board => {
          const el = document.getElementById('leaderboard-' + board)
          if (el) el.innerHTML = Array(5).fill('<div class="lb-skeleton" style="margin-bottom:8px;"></div>').join('')
        })

        let attempts = 0
        while (!window.supabaseClient && attempts < 12) {
          await new Promise(r => setTimeout(r, 500))
          attempts++
        }

        const EMPTY_MSG = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.85rem;">No data yet — be the first! 🚀</div>'
        const ERROR_MSG = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.85rem;">Unable to load. Check connection.</div>'
        const AUTH_MSG  = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.85rem;">Sign in to view the leaderboard.</div>'

        if (!window.supabaseClient) {
          boards.forEach(b => { const el = document.getElementById('leaderboard-' + b); if (el) el.innerHTML = AUTH_MSG })
          return
        }

        const profileMap = {}

        function renderBoard(containerId, board, users, metric) {
          const container = document.getElementById(containerId)
          if (!container) return
          if (!users || users.length === 0) { container.innerHTML = EMPTY_MSG; return }
          container.innerHTML = users.slice(0, 5).map((u, i) => {
            const isYou = u.user_id && u.user_id === currentUserId
            const displayUsername = profileMap[u.user_id] || u.display_name || u.username || u.full_name || 'Anonymous'
            return `<div class="leaderboard-row${isYou ? ' you' : ''}">
              <div class="rank">${i + 1}</div>
              <div class="who">
                <div class="name">${displayUsername}</div>
                <div class="metric">${metric(u)}</div>
              </div>
              ${i === 0 ? `<div class="crown">${crowns[board]}</div>` : ''}
            </div>`
          }).join('')
        }

        let certsByScore = null
        let wallets = null
        let allBadges = null
        let allUserIds = new Set()

        try {
          const { data } = await window.supabaseClient
            .from('certificates')
            .select('user_id, display_name, score, modules_completed')
            .order('score', { ascending: false })
            .limit(15)
          certsByScore = data
          if (data) data.forEach(d => allUserIds.add(d.user_id))
        } catch (e) { console.warn('Leaderboard XP fetch failed:', e) }

        try {
          const { data: wData } = await window.supabaseClient
            .from('wallets')
            .select('user_id, balance')
            .order('balance', { ascending: false })
            .limit(10)
          wallets = wData
          if (wData) wData.forEach(d => allUserIds.add(d.user_id))
        } catch (e) { console.warn('Leaderboard wallets fetch failed:', e) }

        try {
          const { data: bData } = await window.supabaseClient
            .from('badges')
            .select('user_id, badge_type')
          allBadges = bData
          if (bData) bData.forEach(d => allUserIds.add(d.user_id))
        } catch (e) { console.warn('Leaderboard badges fetch failed:', e) }

        // Fetch usernames
        if (allUserIds.size > 0) {
          try {
            const { data: profiles } = await window.supabaseClient
              .from('profiles')
              .select('id, username')
              .in('id', Array.from(allUserIds))
            if (profiles) {
              profiles.forEach(p => {
                if (p.username) profileMap[p.id] = p.username.startsWith('@') ? p.username : '@' + p.username
              })
            }
          } catch (e) { console.warn('Leaderboard profiles fetch failed:', e) }
        }

        if (certsByScore && certsByScore.length > 0) {
          renderBoard('leaderboard-xp', 'xp', certsByScore, u => `${(u.score || 0).toLocaleString()} XP`)
          const byModules = [...certsByScore].sort((a, b) => (b.modules_completed || 0) - (a.modules_completed || 0))
          renderBoard('leaderboard-modules', 'modules', byModules, u => `${u.modules_completed || 0} / 52 modules`)
        } else {
          ;['leaderboard-xp', 'leaderboard-modules'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = EMPTY_MSG })
        }

        if (wallets && wallets.length > 0) {
          const certMap = {}
          if (certsByScore) certsByScore.forEach(c => { certMap[c.user_id] = c.display_name })
          const walletsNamed = wallets.map(w => ({ ...w, display_name: certMap[w.user_id] || 'Learner' }))
          renderBoard('leaderboard-civic', 'civic', walletsNamed, u => `₹${(u.balance || 0).toLocaleString()}`)
        } else {
          const el = document.getElementById('leaderboard-civic'); if (el) el.innerHTML = EMPTY_MSG
        }

        if (allBadges && allBadges.length > 0) {
          const badgeCount = {}
          allBadges.forEach(b => { badgeCount[b.user_id] = (badgeCount[b.user_id] || 0) + 1 })
          const certMap = {}
          if (certsByScore) certsByScore.forEach(c => { certMap[c.user_id] = c.display_name })
          const badgeUsers = Object.entries(badgeCount)
            .sort((a, b) => b[1] - a[1]).slice(0, 5)
            .map(([uid, count]) => ({ user_id: uid, display_name: certMap[uid] || 'Learner', badge_count: count }))
          renderBoard('leaderboard-badges', 'badges', badgeUsers, u => `${u.badge_count} badge${u.badge_count !== 1 ? 's' : ''}`)
        } else {
          const el = document.getElementById('leaderboard-badges'); if (el) el.innerHTML = EMPTY_MSG
        }
      }

      // Load gallery and leaderboard on page load
      setTimeout(() => {
        loadCertificateGallery()
        loadLeaderboard()
      }, 1000)

      function shareCertificate(certId) {
        const url = `${window.location.origin}${window.location.pathname}?cert=${certId}`
        navigator.clipboard.writeText(url).then(() => toast('Link copied!', '#5ed4f5'))
      }

      // --- Welcome Back Popup Logic ---
      setTimeout(() => {
        // Only show if the user has some progress
        if (completed === 0) return;

        const welcomePopup = document.createElement('div');
        welcomePopup.id = 'welcome-back-popup';
        
        let avatarHTML = '';
        try {
          const ls = localStorage.getItem('col_user');
          if (ls) {
            const u = JSON.parse(ls);
            if (u && u.user_metadata && u.user_metadata.avatar_url) {
              avatarHTML = `<img src="${u.user_metadata.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
            }
          }
        } catch(e) {}
        
        if (!avatarHTML) {
          avatarHTML = userInitials || 'DR';
        }

        const firstName = displayName.split(' ')[0] || 'Driver';

        welcomePopup.innerHTML = `
          <div class="wb-avatar">${avatarHTML}</div>
          <div class="wb-content">
            <h4 class="wb-title">Welcome back, ${firstName}! 👋</h4>
            <p class="wb-subtitle">Continue from where you left.</p>
          </div>
          <div class="wb-timer-bar"></div>
        `;
        document.body.appendChild(welcomePopup);
        
        // Trigger slide down
        setTimeout(() => welcomePopup.classList.add('show'), 100);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
          welcomePopup.classList.remove('show');
          setTimeout(() => welcomePopup.remove(), 600);
        }, 5000);

      }, 800);
    