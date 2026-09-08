
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
        
        // Determine if cloud has meaningful data
        const cloudHasData = cloudS.total > 0 || (cloudS.badges && cloudS.badges.length > 0) || cloudS.wallet !== 50000
        const localHasData = S.total > 0 || (S.badges && S.badges.length > 0) || S.wallet !== 50000
        
        if (cloudHasData && !localHasData) {
          // Cloud has data, local doesn't - auto restore
          S = { ...S, ...cloudS }
          try { localStorage.setItem('mth4', JSON.stringify(S)) } catch (e) {}
          toast('☁️ Cloud Data Auto-Restored!', '#5ED4F5')
          if (window.ui && window.ui.init) ui.init()
          return true
        } else if (cloudHasData && localHasData) {
          // Both have data - check for differences
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

      const displayName = tUser.name || S.name || 'Driver'
      const userInitials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

      // Populate avatars
      ;[document.getElementById('avatar-sm'), document.getElementById('hero-avatar')].forEach(el => {
        if (!el) return;
        let userPhoto = null
        try {
          const ls = localStorage.getItem('col_user')
          if (ls) { const u = JSON.parse(ls); userPhoto = u.avatar || u.photo || null }
        } catch (e) {}
        if (userPhoto) el.innerHTML = '<img src="' + userPhoto + '" alt="avatar" />'
        else el.textContent = userInitials
      })

      document.getElementById('top-name').innerText = displayName
      document.getElementById('h-name').innerText = displayName

      const role = (tUser.role || S.role || 'student')
      const studentId = S.studentId || ('STU-' + Math.floor(100000 + Math.random() * 900000))
      document.getElementById('h-id').innerText = 'ID: ' + studentId

      // Stats
      document.getElementById('s-veh').innerText = tUser.vehicle || S.vehicle || 'Car'
      const ageVal = tUser.age || S.age || 18
      const ageLabels = { child: '8-12 (Kids)', teen: '13-17 (Teens)', young: '18-25 (Young)', adult: '26-50 (Adult)', senior: '51+ (Senior)' }
      const ageBracket = ageVal <= 12 ? 'child' : ageVal <= 17 ? 'teen' : ageVal <= 25 ? 'young' : ageVal <= 50 ? 'adult' : 'senior'
      document.getElementById('s-age').innerText = ageLabels[ageBracket] || '18'
      document.getElementById('s-lang').innerText = (tUser.language || S.language || 'en') === 'hi' ? 'हिन्दी' : 'English'
      document.getElementById('h-score').innerText = (S.total || 0).toLocaleString()

      const civicScore = S.civicScore || 0
      const civicTiers = [
        { at: 500, label: 'Platinum Citizen', emoji: '💎' },
        { at: 250, label: 'Gold Citizen', emoji: '🥇' },
        { at: 100, label: 'Silver Citizen', emoji: '🥈' },
        { at: 25, label: 'Bronze Citizen', emoji: '🥉' },
        { at: 0, label: 'Civic Score', emoji: '🏅' }
      ]
      const civicTier = civicTiers.find((t) => civicScore >= t.at)
      document.getElementById('h-tier').innerText = `${civicTier.emoji} ${civicTier.label}`

      let completed = 0
      if (S.comp) completed = Object.keys(S.comp).filter((k) => S.comp[k] && S.comp[k].score > 0).length
      document.getElementById('s-prog').innerText = `${completed}/52`

      // Global Progress
      const progressPct = Math.round((completed / 52) * 100)
      document.getElementById('global-fill').style.width = progressPct + '%'
      document.getElementById('global-pct').innerText = progressPct + '%'

      // Progress Ring
      const certProgressCanvas = document.getElementById('cert-progress-canvas')
      if (certProgressCanvas && window.TrafficCharts) {
        window.TrafficCharts.createProgressRing(certProgressCanvas, progressPct, { cutout: '70%' })
      }
      document.getElementById('cert-progress-pct').textContent = progressPct + '%'
      document.getElementById('cert-progress-text').textContent = completed >= 52 ? 'Unlocked!' : (completed > 0 ? 'Learning...' : 'Start!')

      // Sparklines
      if (window.TrafficCharts) {
        const scoreSpark = document.getElementById('score-sparkline')
        if (scoreSpark) {
          const data = [12, 19, 15, 25, 22, 30, 28] // Example static data
          window.TrafficCharts.createSparkline(scoreSpark, data, { color: '#f2b84b', colorEnd: '#00f0cc', fill: true })
        }
        const civicSpark = document.getElementById('civic-sparkline')
        if (civicSpark) {
          const data = [civicScore > 0 ? Math.min(100, civicScore/5) : 0]
          window.TrafficCharts.createSparkline(civicSpark, data, { color: '#b89bff', colorEnd: '#f2b84b', fill: true })
        }
      }

      // Badges
      const badgeList = document.getElementById('achievement-list')
      if (S.badges && S.badges.length > 0) {
        badgeList.innerHTML = S.badges.map(b => `<div>🏅 ${b}</div>`).join('')
      }

      // Certificate Population
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
        const blurPx = ((52 - completed) / 52 * 10).toFixed(1)
        certWrapper.style.filter = `grayscale(1) blur(${blurPx}px)`
        certWrapper.style.opacity = (0.3 + (completed / 52) * 0.5).toFixed(2)
        noCertMsg.style.display = 'block'
        noCertMsg.querySelector('p').innerText = `Complete all 52 modules to unlock your certificate. (${completed}/52 done)`
        dlBtn.style.display = 'none'
      }

      // Cloud sync on auth change
      window.addEventListener('col-auth-changed', async (e) => {
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

          // Load cloud progress on sign-in
          const oldSStr2 = JSON.stringify(S)
          await _syncCloudToLocal(user.id)
          // Refresh all displays after sync
          if (JSON.stringify(S) !== oldSStr2) window.location.reload()
        } else {
          // Signed out — hide profile, show sign-in on Academy.html
          const acadBtn = document.getElementById('academy-sign-in-btn')
          const acadProf = document.getElementById('trafficUserProfile')
          if (acadBtn) acadBtn.style.display = 'block'
          if (acadProf) acadProf.style.display = 'none'
        }
      })

      // Also load cloud progress on initial page load if already logged in
      (async () => {
        if (window.colUser && window.colUser.id) {
          const oldSStr = JSON.stringify(S)
          await _syncCloudToLocal(window.colUser.id)
          // Refresh displays after potential sync
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
        document.getElementById('ed-age').value = tUser.age || S.age || ''
        document.getElementById('ed-vehicle').value = tUser.vehicle || S.vehicle || 'car'
        m.classList.add('show')
        document.getElementById('action-menu').classList.remove('show')
      }
      function closeEditModal() { document.getElementById('edit-modal').classList.remove('show') }
function saveEditModal() {
        const name = document.getElementById('ed-name').value.trim()
        const age = parseInt(document.getElementById('ed-age').value) || 18
        const vehicle = document.getElementById('ed-vehicle').value
        if (name) {
          tUser.name = name; tUser.age = age; tUser.vehicle = vehicle
          S.name = name; S.age = age; S.vehicle = vehicle
          localStorage.setItem('traffic_local_user', JSON.stringify(tUser))
          localStorage.setItem('th-save', JSON.stringify(S))
          if (window.save) window.save()
          window.location.reload()
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
      const shareText = `I completed my Traffic Hero Certification! ${displayName} — ${completed}/52 modules done.`

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
        const textToShare = shareText + '\n' + url
        if (file && navigator.canShare && navigator.canShare({ files: [file], text: textToShare })) {
          try { await navigator.share({ files: [file], text: textToShare }); return } catch (e) {}
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank')
      }

      async function shareInstagram() {
        const file = await _certImageFile()
        const url = await getCertUrl()
        if (!url) { toast('Complete 52 modules or check connection!', '#ff4444'); return }
        const textToShare = shareText + '\n' + url
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

      // Toast function
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

      // Conflict modal
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
        document.getElementById('d-name').innerText = cert.display_name
        document.getElementById('cert-name').innerText = (cert.display_name || '').toUpperCase()
        document.getElementById('cert-score').innerText = (cert.score || 0).toLocaleString()
        document.getElementById('cert-date').innerText = new Date(cert.issued_at).toLocaleDateString()
      document.getElementById('cert-date').innerText = new Date(cert.issued_at).toLocaleDateString()
      })();

      // Certificate Gallery - Load all user certificates
      async function loadCertificateGallery() {
        if (!window.supabaseClient || !window.colUser?.id) return;
        const gallery = document.getElementById('cert-gallery')
        if (!gallery) return
        
        try {
          const { data: certs } = await window.supabaseClient
            .from('certificates')
            .select('*')
            .eq('user_id', window.colUser.id)
            .order('issued_at', { ascending: false })
          
          if (certs && certs.length > 0) {
            gallery.innerHTML = certs.map(c => `
              <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;transition:all 0.2s;" 
                   onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
                   onmouseout="this.style.transform='none';this.style.boxShadow='none'">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                  <img src="mumbai-police-logo.png" style="height:40px;object-fit:contain" onerror="this.style.display='none'" alt="Mumbai Police">
                  <img src="sneh-logo.png" style="height:40px;object-fit:contain" onerror="this.style.display='none'" alt="Sneh Asha">
                </div>
                <div style="font-weight:600;letter-spacing:0.1em;color:#7c7968;text-transform:uppercase;font-size:0.9rem;margin-bottom:8px;">Certificate of Completion</div>
                <div style="font-family:'Lora',serif;font-size:1.5rem;font-weight:700;margin-bottom:16px;">${c.module_name || 'Traffic Hero'}</div>
                <div style="color:var(--muted);margin-bottom:16px;font-size:0.9rem;">Issued: ${new Date(c.issued_at).toLocaleDateString()}</div>
                <div style="font-size:0.85rem;color:var(--signal);font-weight:600;">Score: ${(c.score || 0).toLocaleString()}</div>
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
                  <div style="font-size:0.75rem;color:var(--muted);">Ref: ${c.id.slice(0,8).toUpperCase()}</div>
                  <button class="btn" onclick="shareCertificate('${c.id}')" style="padding:8px 16px;font-size:0.8rem;background:var(--signal);color:#000;">Share</button>
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

      // Leaderboard - Load top scores for all 4 categories
      async function loadLeaderboard() {
        if (!window.supabaseClient) return
        
        try {
          const { data: topUsers } = await window.supabaseClient
            .from('user_profiles')
            .select('full_name, avatar_url, total_score, civic_score')
            .order('total_score', { ascending: false })
            .limit(20)
          
          if (topUsers && topUsers.length > 0) {
            // Global XP Leaderboard
            const xpContainer = document.getElementById('leaderboard-xp')
            if (xpContainer) {
              xpContainer.innerHTML = topUsers.slice(0, 5).map((u, i) => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--signal),var(--accent));display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:0.75rem;">${i+1}</div>
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.85rem;">${u.full_name || 'Anonymous'}</div>
                    <div style="font-size:0.65rem;color:var(--muted);">${(u.total_score || 0).toLocaleString()} XP</div>
                  </div>
                  ${i === 0 ? '<div style="font-size:1.2rem;">👑</div>' : ''}
                </div>
              `).join('')
            }
            
            // Module Completion Leaderboard
            const modContainer = document.getElementById('leaderboard-modules')
            if (modContainer) {
              const sortedByModules = [...topUsers].sort((a,b) => (b.civic_score || 0) - (a.civic_score || 0))
              modContainer.innerHTML = sortedByModules.slice(0, 5).map((u, i) => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--yellow));display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:0.75rem;">${i+1}</div>
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.85rem;">${u.full_name || 'Anonymous'}</div>
                    <div style="font-size:0.65rem;color:var(--muted);">Civic Score: ${u.civic_score || 0}</div>
                  </div>
                  ${i === 0 ? '<div style="font-size:1.2rem;">🏆</div>' : ''}
                </div>
              `).join('')
            }
            
            // Streak Leaderboard
            const streakContainer = document.getElementById('leaderboard-streaks')
            if (streakContainer) {
              streakContainer.innerHTML = topUsers.slice(0, 5).map((u, i) => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--green));display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:0.75rem;">${i+1}</div>
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.85rem;">${u.full_name || 'Anonymous'}</div>
                    <div style="font-size:0.65rem;color:var(--muted);">Total: ${(u.total_score || 0).toLocaleString()}</div>
                  </div>
                  ${i === 0 ? '<div style="font-size:1.2rem;">🔥</div>' : ''}
                </div>
              `).join('')
            }
            
            // Perfect Runs Leaderboard
            const perfectContainer = document.getElementById('leaderboard-perfect')
            if (perfectContainer) {
              perfectContainer.innerHTML = topUsers.slice(0, 5).map((u, i) => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--plasma),var(--signal));display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:0.75rem;">${i+1}</div>
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.85rem;">${u.full_name || 'Anonymous'}</div>
                    <div style="font-size:0.65rem;color:var(--muted);">Score: ${(u.total_score || 0).toLocaleString()}</div>
                  </div>
                  ${i === 0 ? '<div style="font-size:1.2rem;">💯</div>' : ''}
                </div>
              `).join('')
            }
          }
        } catch (e) {
          console.warn('Leaderboard load failed:', e)
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
    