let _tt = null;
    function toast(msg, col = '#ffd54a') { const t = document.getElementById('toast'), ti = document.getElementById('ti'); ti.textContent = msg; ti.style.background = col; t.classList.add('on'); clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('on'), 2500); }
    const mob = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // 🚦 SOUND FX 🚦
    const sfx = {
      _c: null, init() { if (this._c) return; try { this._c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } },
      play(t) {
        if (!this._c) return; const p = { horn: { f: 440, ty: 'square', d: .18, v: .12 }, brake: { f: 160, ty: 'sawtooth', d: .15, v: .08 }, challan: { f: 880, ty: 'triangle', d: .32, v: .11 }, ok: { f: 660, ty: 'sine', d: .22, v: .09 }, error: { f: 110, ty: 'square', d: .28, v: .1 } }; const pp = p[t] || p.horn;
        try { const o = this._c.createOscillator(), g = this._c.createGain(); o.connect(g); g.connect(this._c.destination); o.type = pp.ty; o.frequency.setValueAtTime(pp.f, this._c.currentTime); g.gain.setValueAtTime(pp.v, this._c.currentTime); g.gain.exponentialRampToValueAtTime(.001, this._c.currentTime + pp.d); o.start(); o.stop(this._c.currentTime + pp.d); } catch (e) { }
      }
    };

    // 🚦 UI INTERACTION LOGIC LAYER 🚦
    const ui = {
      cur: null,
      _sylLv: null,
      cq: [],
      cbusy: false,
      qst: null,
      _ccb: null,
      adminUnlock() { LVS.forEach(l => { if (!S.comp[l.id]) S.comp[l.id] = { score: 500, time: Date.now() } }); BADGES.forEach(b => { if (!S.badges.includes(b.id)) S.badges.push(b.id) }); S.total += 7500; save(); toast('🔓 Developer Unlock Triggered!', '#00c851'); this.showLevels(); },
      async hardReset() { 
        if (confirm('Reset all progress?')) { 
          S = { comp: {}, badges: [], total: 0, name: null, wallet: 50000 }; 
          try { localStorage.removeItem('mth4'); } catch (e) { } 
          if (window.supabaseClient && window.colUser) {
            try { await window.supabaseClient.auth.updateUser({ data: { progress: null } }); } catch(e) {}
          }
          toast('⚠️ Progress Reset!', '#ff3b30'); 
          if (window.location.pathname.includes('Driving.html')) {
            window.location.href = 'Academy.html';
            return;
          }
          if (this.showStart) this.showStart(); else { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById('ss').classList.add('active'); }
        } 
      },
      init() {
        try { if (localStorage.getItem('theme') === 'light') document.body.classList.add('lm'); } catch(e) {}
        const urlParams = new URLSearchParams(window.location.search);
        const screenParam = urlParams.get('screen');
        if(screenParam === 'levels') {
            this.showLevels();
        } else {
            this.show('ss');
        }
        
        window.addEventListener('col-auth-changed', (e) => {
            if (e.detail && e.detail.user) {
                if (localStorage.getItem('trafficSetupComplete') !== 'true') {
                    window.location.href = 'TrafficSetup.html';
                }
            }
        });

        this._buildSylList();
        
        const cnameEl = document.getElementById('cname');
        if (cnameEl) { cnameEl.innerText = S.name || 'TRAFFIC HERO'; }
        const hwalletEl = document.getElementById('hwallet');
        if (hwalletEl) { hwalletEl.textContent = '₹' + (S.wallet || 50000).toLocaleString('en-IN'); }
      },
      show(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        if (id) {
          const el = document.getElementById(id);
          if (el) el.classList.add('active');
        }
      },
      _buildSylList() {
        if (!S) S = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 50000 };
        if (!S.comp) S.comp = {};
        const wrap = document.getElementById('lvbody');
        if (!wrap) return;
        wrap.innerHTML = '';

        const cats = {
            pedestrian_courtesy: { title: "🚶 Pedestrian Courtesy", levels: [] },
            respectful_parking: { title: "🅿️ Respectful Parking", levels: [] },
            ambulance_priority: { title: "🚑 Emergency Priority", levels: [] },
            puddle_etiquette: { title: "🌧️ Monsoon Etiquette", levels: [] },
            no_honking: { title: "🔇 Silence Zones", levels: [] },
            general: { title: "🚧 General Rules", levels: [] }
        };

        LVS.forEach((lv) => {
            const cat = cats[lv.themeType] || cats.general;
            cat.levels.push(lv);
        });

        Object.values(cats).forEach(cat => {
            if (cat.levels.length === 0) return;
            
            const hdr = document.createElement('div');
            hdr.className = 'category-header';
            hdr.textContent = cat.title;
            wrap.appendChild(hdr);

            const grid = document.createElement('div');
            grid.className = 'category-grid';
            wrap.appendChild(grid);

            cat.levels.forEach((lv) => {
                const done = S.comp[lv.id];
                const div = document.createElement('div');
                div.className = 'syl-item' + (done ? ' syl-done' : '');
                div.innerHTML = `
                  <div class="syl-ck"></div>
                  <div class="syl-info">
                    <div class="syl-lbl">Level ${lv.id}: ${lv.name}</div>
                    <div class="syl-sub">${lv.ds}</div>
                  </div>
                `;
                div.onclick = () => { ui.showBriefing(lv.id); };
                grid.appendChild(div);
            });
        });
      },
      showLevels() {
        if(window.location.pathname.includes('Driving.html')) {
            window.location.href = 'Academy.html?screen=levels';
            return;
        }
        this.show('screen-levels');
        this._buildSylList();
      },
      showNamePrompt() {
        const dlg = document.getElementById('name-prompt-dlg');
        if (dlg) {
            document.getElementById('prompt-name').value = (S.name && S.name !== 'Traffic Hero') ? S.name : '';
            dlg.style.display = 'flex';
        }
      },
      saveNamePrompt() {
        const n = document.getElementById('prompt-name').value.trim();
        if(n.length > 0 && n.length < 3) { toast('Please enter a valid name', 'darkred'); return; }
        S.name = n || 'Traffic Hero';
        save();
        document.getElementById('name-prompt-dlg').style.display = 'none';
        toast('Welcome, ' + S.name + '!', '#3b8c66');
        const cnameEl = document.getElementById('cname');
        if(cnameEl) { cnameEl.innerText = S.name.toUpperCase(); }
      },
      showProfile() {
        if (!window.colUser) {
           if(window.openGlobalLogin) window.openGlobalLogin(); else if(window.openLogin) window.openLogin();
           return;
        }
        window.location.href = 'TrafficDashboard.html';
      },
    saveProfile() {
        const n = document.getElementById('prof-name').value.trim();
        const v = document.getElementById('prof-veh').value;
        if(n.length > 0 && n.length < 3) { toast('Please enter a valid name', 'darkred'); return; }
        S.name = n;
        S.vehicle = v;
        save();
        document.getElementById('profile-dlg').style.display = 'none';
        toast('Profile Saved!', '#3b8c66');
        
        const cnameEl = document.getElementById('cname');
        if(cnameEl) { cnameEl.innerText = S.name || 'DRIVER'; }
    },
    showCert(badgeId = null) {
        this.show('screen-certificate');
        
        const cname = document.getElementById('cname');
        if (cname) cname.innerText = (S.name || 'DRIVER').toUpperCase();
        
        const certNum = document.getElementById('cert-num');
        if (certNum) {
            if (!S.certId) { S.certId = 'CERT-' + Math.floor(Math.random()*1000000); save(); }
        }
        
        const cTitle = document.getElementById('cert-title');
        const cIcon = document.getElementById('cert-icon');
        const cStat = document.getElementById('cstat');
        const cScoreLbl = document.getElementById('cscore');
        
        if (badgeId && typeof BADGES !== 'undefined') {
            const b = BADGES.find(x => x.id === badgeId);
            if (b) {
                if(cTitle) cTitle.innerText = b.name;
                if(cIcon) { cIcon.innerText = b.icon; cIcon.style.display = 'block'; }
                if(cStat) cStat.innerText = `ACHIEVEMENT UNLOCKED: ${b.desc}`;
                if(certNum) certNum.innerText = `BDG-${badgeId.toUpperCase().replace(/[^A-Z]/g,'').substring(0,5)}-${Math.floor(Math.random()*10000)}`;
                if(cScoreLbl) cScoreLbl.innerText = "Mastered";
                return;
            }
        }
        
        // Default behavior
        if(cTitle) cTitle.innerText = "Traffic Hero Certification";
        if(cIcon) cIcon.style.display = 'none';
        
        let totalScore = 0, count = 0;
        if (S.scores) { for (let k in S.scores) { totalScore += S.scores[k]; count++; } }
        let avgScore = count > 0 ? (totalScore / count) : 0;
        if(cStat) cStat.innerText = `COMPLETED WITH ${Math.round(avgScore)}% PROFICIENCY`;
        if(cScoreLbl) cScoreLbl.innerText = `${Math.round(avgScore)}%`;
        if(certNum) certNum.innerText = S.certId;
    },
    showBadges() {
        this.show('screen-badges');
        
        const statsBody = document.getElementById('stats-body');
        if (statsBody) {
            statsBody.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">COMPLETED LEVELS</div>
                    <div style="font-weight:700;color:var(--accent);">${Object.keys(S.comp).length}/20</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">TOTAL WALLET</div>
                    <div style="font-weight:700;color:#2ecc71;">₹${S.wallet || 0}</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">TOTAL BADGES</div>
                    <div style="font-weight:700;color:#9b59b6;">${S.badges ? S.badges.length : 0}</div>
                </div>
            `;
        }
        
        const bgrid = document.getElementById('bgrid');
        if (bgrid && typeof BADGES !== 'undefined') {
            let bHtml = '';
            BADGES.forEach(b => {
                const has = S.badges && S.badges.includes(b.id);
                bHtml += `
                    <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid ${has ? '#ffd54a' : '#eee'};text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.05);filter:${has ? 'none' : 'grayscale(1)'};opacity:${has ? '1' : '0.5'};${has ? 'cursor:pointer;' : ''}" ${has ? `onclick="ui.showCert('${b.id}')"` : ''}>
                        <div style="font-size:3rem;margin-bottom:10px;">${b.icon}</div>
                        <div style="font-weight:700;margin-bottom:6px;color:#2c3e50;">${b.name}</div>
                        <div style="font-size:0.85rem;color:#666;">${b.desc}</div>
                        ${has ? `<div style="margin-top:12px; font-size:0.75rem; color:#ffd54a; font-weight:bold; text-transform:uppercase;">Click to view Certificate</div>` : ''}
                    </div>
                `;
            });
            bgrid.innerHTML = bHtml;
        }
    },
    dlCert() {
        if(typeof html2pdf !== 'undefined') {
            const el = document.getElementById('cert-wrapper');
            html2pdf().set({
                margin: 0,
                filename: 'Traffic_Hero_Certificate.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            }).from(el).save();
        } else {
            alert('PDF library not loaded. Please ensure you have internet access.');
        }
    },

      showStart() { 
          if(window.location.pathname.includes('Driving.html')) {
              window.location.href = 'Academy.html';
              return;
          }
          this.show('ss'); 
          this._rain(); 
          if (!S.name || S.name === 'Traffic Hero') { 
              setTimeout(() => this.showNamePrompt(), 1000); 
          } 
      },
      showNameDlg() { document.getElementById('name-dlg').classList.add('on'); setTimeout(() => { const i = document.getElementById('name-input'); if (i) i.focus(); }, 200); },
      _rain() { const r = document.getElementById('rl'); if (r && !r._b) { r._b = 1; for (let i = 0; i < 30; i++) { const d = document.createElement('div'); d.className = 'rd'; d.style.left = Math.random() * 100 + '%'; d.style.height = (50 + Math.random() * 50) + 'px'; d.style.animationDuration = ('.6' + Math.random() * .5) + 's'; r.appendChild(d); } } },
      showLevels_old() { this.show('screen-levels'); this._bldLvs(); },
      _bldLvs() {
        const body = document.getElementById('lvbody'); body.innerHTML = '';
        const done = Object.keys(S.comp).length; document.getElementById('pchip').textContent = done + '/6 ✅';
        const secs = [{ t: '🔰 Fundamentals & Mixed Rules', ids: [1, 2] }, { t: '🔰 Highways & Speed', ids: [3] }, { t: '🎓 Special Systems', ids: [4, 5, 6] }];
        secs.forEach(sec => {
          const sh = document.createElement('div'); sh.className = 'sec-hdr'; sh.textContent = sec.t; body.appendChild(sh);
          const tr = document.createElement('div'); tr.className = 'lv-track';
          sec.ids.forEach(id => {
            const lv = LVS.find(l => l.id === id), idx = LVS.indexOf(lv);
            const isDone = (lvlId) => S.comp[lvlId]?.finalQuiz || (S.comp[lvlId] && S.comp[lvlId].score !== undefined && Object.keys(S.comp[lvlId]).length > 1);
            const un = idx === 0 || isDone(LVS[idx - 1].id); const cm = !!isDone(lv.id); const ip = !cm && un;
            const c = document.createElement('div'); c.className = 'lcard' + (cm ? ' done' : '') + (un ? '' : ' lk');
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
            `;
            if (un) { c.onclick = () => this.showBriefing(lv.id); }
            tr.appendChild(c);
          }); body.appendChild(tr);
        });
      },
      showBriefing(lid) {
        const lv = LVS.find(l => l.id === lid); this.cur = lv;
        document.getElementById('blt').textContent = 'Level ' + lv.id; document.getElementById('bvh').textContent = lv.v;
        const items = [
          { id: 'intro', icon: '📖', label: 'Overview', sub: 'Mission Briefing' },
          ...lv.hps.map((hp, i) => ({ id: 'rule' + i, icon: '⚖️', label: 'Guideline ' + (i + 1), sub: hp.split(':')[0].substring(0, 24) })),
          { id: 'law', icon: '🏛️', label: 'Legal Penalty', sub: 'Statutory Consequences' },
          { id: 'theory', icon: '📊', label: 'Science', sub: 'Traffic Theory' },
          { id: 'practical', icon: '🎯', label: 'Execution', sub: 'Driving Test' }
        ];
        this._sylItems = items; this._sylViewed = new Set(); this._sylLv = lv;
        const list = document.getElementById('br-syllabus'); list.innerHTML = '';
        items.forEach(it => {
          const el = document.createElement('div'); el.className = 'syl-item'; el.id = 'syl-' + it.id;
          el.innerHTML = `<div class="syl-ck" id="sylck-${it.id}"></div><div class="syl-info"><div class="syl-lbl">${it.icon} ${it.label}</div><div class="syl-sub">${it.sub}</div></div>`;
          el.onclick = () => this._selSyl(it.id); list.appendChild(el);
        });
        this._selSyl('intro'); this.show('screen-briefing');
      },
      _selSyl(id) {
        const lv = this._sylLv, items = this._sylItems;
        if (!lv) return;
        ui.curMode = ui.curMode || (lv.modes ? lv.modes[0] : 'car');
        document.querySelectorAll('.syl-item').forEach(el => el.classList.remove('syl-active'));
        const el = document.getElementById('syl-' + id); if (el) el.classList.add('syl-active');
        if (!this._sylViewed.has(id)) {
          this._sylViewed.add(id);
          const sylEl = document.getElementById('syl-' + id); if (sylEl) sylEl.classList.add('syl-done');
          const pct = Math.round(this._sylViewed.size / items.length * 100);
          document.getElementById('br-prog-fill').style.width = pct + '%'; document.getElementById('br-prog-label').textContent = pct + '%';
        }
        const rContainer = document.querySelector('.br-r');
        if (rContainer) {
          if (id === 'practical') { rContainer.style.marginTop = '45px'; }
          else { rContainer.style.marginTop = '118px'; }
        }
        const c = document.getElementById('br-content'); c.innerHTML = '';
        const card = document.createElement('div'); card.className = 'bc-card';
        if (id === 'intro') {
          card.innerHTML = `<div class="bc-ttl">📖 Module Overview</div>
     <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(1.6rem, 4vw, 2.5rem);color:var(--yellow);margin-bottom:8px">${lv.name}</div>
     <div style="font-size:clamp(0.95rem, 2vw, 1.35rem);color:var(--muted2);line-height:1.5;margin-bottom:16px">${lv.ds}</div>
     <div class="stat-row">
       <div class="stat-box"><div class="stat-val">${lv.hps.length}</div><div class="stat-lbl">Mandates</div></div>
       <div class="stat-box"><div class="stat-val">${lv.law.fine}</div><div class="stat-lbl">Penalty</div></div>
     </div>`;
        } else if (id.startsWith('rule')) {
          const idx = parseInt(id.replace('rule', '')); const hp = lv.hps[idx];
          card.innerHTML = `<div class="bc-ttl">⚖️ Regulatory Requirement</div><div class="bc-rule-pill">Clause ${idx + 1}</div><div class="bc-rule-txt">${hp}</div>
     <div class="bc-next-btn" style="display:flex;justify-content:space-between;"><button class="btn btn-s" onclick="ui._selSyl('${idx > 0 ? 'rule' + (idx - 1) : 'intro'}')">${'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>'} Previous</button>${idx < lv.hps.length - 1 ? `<button onclick="ui._selSyl('rule${idx + 1}')">Next Clause &rarr;</button>` : `<button onclick="ui._selSyl('law')">Legal Framework &rarr;</button>`}</div>`;
        } else if (id === 'law') {
          card.innerHTML = `<div class="bc-ttl">🏛️ Statutory Provisions</div><div class="lb"><div class="ls">${lv.law.sec}</div><div class="lt">${lv.law.off}</div></div><div class="fr"><div class="fl">Fine Amount</div><div class="fa">${lv.law.fine}</div></div>
     <div class="bc-next-btn" style="display:flex;justify-content:space-between;"><button class="btn btn-s" onclick="ui._selSyl('rule'+(lv.hps.length-1))"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Previous</button><button onclick="ui._selSyl('theory')">Concepts &rarr;</button></div>`;
        } else if (id === 'theory') {
          card.innerHTML = `<div class="bc-ttl">📊 Analytical Model</div><div class="dw">${this._diag(lv.id)}</div><div style="font-size:clamp(0.95rem, 2.2vw, 1.3rem);line-height:1.6;color:var(--muted2);margin-bottom:12px">${lv.theory}</div>
     <div class="bc-next-btn" style="display:flex;justify-content:space-between;"><button class="btn btn-s" onclick="ui._selSyl('law')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Previous</button><button onclick="ui._selSyl('practical')">Start Simulation &rarr;</button></div>`;
        } else if (id === 'practical') {
          card.innerHTML = `<div class="bc-ttl">🎯 Practical Execution</div>
      <div style="margin-bottom:24px;">
        ${this._simAnim(lv)}
      </div>
      <div class="pract-banner" style="background:${lv.gr || 'linear-gradient(135deg, #1e293b, #0f172a)'};height:auto;flex-direction:row;justify-content:space-between;padding:clamp(16px, 3vw, 24px);text-align:left;flex-wrap:wrap;border-radius:16px;overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <div style="display:flex;align-items:flex-start;gap:clamp(16px, 4vw, 32px);flex:1;min-width:280px">
          <div class="pract-icon-big" style="font-size:4rem;line-height:1;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.2));">${lv.icon}</div>
          <div class="pract-veh-tag" style="background:transparent;padding:0;border-radius:0;flex:1">
            <div class="pv1" style="font-size:clamp(1.4rem, 2.5vw, 2rem);letter-spacing:0.05em;font-family:'Lora',serif;font-weight:700; color:white;">${lv.name}</div>
            <div class="pv2" style="font-size:clamp(0.9rem, 2vw, 1.2rem);color:rgba(255,255,255,.8)">${lv.v}</div>
            <div style="font-size:clamp(0.9rem, 1.4vw, 1.15rem);color:rgba(255,255,255,0.95);margin-top:10px;line-height:1.5;border-top:1px solid rgba(255,255,255,0.3);padding-top:10px">${lv.pract}</div>
            <div style="font-size:clamp(0.8rem, 1.3vw, 0.95rem);color:var(--yellow);margin-top:12px;line-height:1.4;background:rgba(0,0,0,0.3);padding:10px;border-radius:8px; border-left:4px solid var(--yellow);">⚠️ Note: A PERFECT drive (no violations/damage) is required to not get penalized on retry.</div>
          </div>
        </div>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:20px; margin-top:20px;">
        <div style="flex:1; min-width:300px; background:var(--card); border:1px solid var(--border); padding:20px; border-radius:16px; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
          <div style="color:var(--text); font-size:1.05rem; font-weight:700; margin-bottom:16px; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:8px;">🎮 How to Play</div>
          <div style="display:flex; flex-direction:column; gap:16px;">
             <div style="display:flex; align-items:center; gap:16px;">
                <div style="display:flex; gap:6px;">
                  <div style="width:34px; height:34px; background:var(--bg); border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.85rem; color:var(--text); box-shadow:0 2px 5px rgba(0,0,0,0.05);">W</div>
                  <div style="width:34px; height:34px; background:var(--bg); border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.85rem; color:var(--text); box-shadow:0 2px 5px rgba(0,0,0,0.05);">A</div>
                  <div style="width:34px; height:34px; background:var(--bg); border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.85rem; color:var(--text); box-shadow:0 2px 5px rgba(0,0,0,0.05);">S</div>
                  <div style="width:34px; height:34px; background:var(--bg); border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.85rem; color:var(--text); box-shadow:0 2px 5px rgba(0,0,0,0.05);">D</div>
                </div>
                <div style="font-size:0.95rem; color:var(--muted2); font-weight:500;">Steer & Accelerate</div>
             </div>
             <div style="display:flex; align-items:center; gap:16px;">
                <div style="width:auto; padding:0 16px; height:34px; background:var(--bg); border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.85rem; color:var(--text); box-shadow:0 2px 5px rgba(0,0,0,0.05);">SPACE</div>
                <div style="font-size:0.95rem; color:var(--muted2); font-weight:500;">Handbrake</div>
             </div>
          </div>
        </div>
        
        <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:16px;">
          <div style="background:var(--card); padding:16px 20px; border-radius:16px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
            <div>
              <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase; font-weight:800; letter-spacing:0.05em; margin-bottom:4px;">Penalty Risk</div>
              <div style="font-size:1rem; color:var(--text); font-weight:600;">${lv.law.off}</div>
            </div>
            <div style="text-align:right; border-left:1px solid var(--border); padding-left:16px;">
              <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase; font-weight:800; letter-spacing:0.05em; margin-bottom:4px;">Fine</div>
              <div style="font-family:'Bebas Neue',sans-serif; font-size:1.8rem; color:var(--red); line-height:1;">${lv.law.fine}</div>
            </div>
          </div>
          
          <div style="display:flex; flex-wrap:wrap; gap:10px;">
            ${btnsHTML}
          </div>
          ${finalBtn}
        </div>
      </div>
      <div class="bc-next-btn" style="display:flex;gap:12px;justify-content:flex-start;width:100%;margin-top:20px;border-top:1px solid var(--border);padding-top:20px;">
        <button class="btn btn-s" onclick="ui._selSyl('theory')"><span style="display:flex;align-items:center;gap:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Previous</span></button>
      </div>`;
        }
        c.appendChild(card);
      },
      _diag(id) {
        const lv = LVS.find(l => l.id === id); if (!lv) return '';
        return `<div style="background:${lv.gr};border-radius:14px;padding:clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 30px);margin-bottom:16px;display:flex;align-items:center;gap:clamp(12px, 3vw, 24px)">
     <div style="font-size:clamp(2.5rem, 5vw, 4.5rem)">${lv.icon}</div>
     <div>
       <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(1.2rem, 2.5vw, 2rem);color:#fff;letter-spacing:.05em">${lv.name}</div>
       <div style="font-size:clamp(0.8rem, 1.5vw, 1.1rem);color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.08em">${lv.v} · Fine: ${lv.law.fine}</div>
     </div></div>`;
      },
      _simAnim(lv) {
        let h = `<div style="position:relative; width:100%; height:160px; background:#111; border-radius:12px; overflow:hidden; margin-bottom: 20px; border:2px solid rgba(255,255,255,0.1); display:flex; justify-content:center; align-items:center; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);">
                   <!-- road lines -->
                   <div style="position:absolute; top:50%; left:0; right:0; height:4px; border-top:4px dashed rgba(255,255,255,0.3); transform:translateY(-50%);"></div>
                   <div style="position:absolute; top:10px; left:10px; color:#fff; font-size:0.75rem; font-weight:800; opacity:0.8; z-index:10; background:rgba(0,0,0,0.6); padding:4px 8px; border-radius:4px; letter-spacing:1px;">🎥 SCENARIO DEMO</div>`;
        let style = '';
        if (lv.themeType === 'pedestrian_courtesy') {
          h += `
             <div style="position:absolute; left:60%; top:0; bottom:0; width:40px; background:repeating-linear-gradient(0deg, #fff 0, #fff 10px, transparent 10px, transparent 20px);"></div>
             <div style="position:absolute; left:65%; top:10px; font-size:2rem; animation: walkDown 4s infinite;">🚶</div>
             <div style="position:absolute; left:10%; top:55%; font-size:2.5rem; transform:scaleX(-1); animation: driveStopGo 4s infinite;">🚗</div>
          `;
          style = `@keyframes walkDown { 0% { top:-20px; } 25% { top: 35%; } 55% { top: 35%; } 100% { top: 120%; } }
                   @keyframes driveStopGo { 0% { left:-50px; } 25% { left: 40%; } 55% { left: 40%; } 100% { left: 120%; } }`;
        } else if (lv.themeType === 'overtake' || lv.themeType === 'speed' || lv.id === 5) { // some overtake/speed rules
          h += `
             <div style="position:absolute; left:40%; top:15%; font-size:2.5rem; transform:scaleX(-1); animation: driveSlow 4s infinite;">🚙</div>
             <div style="position:absolute; left:10%; top:15%; font-size:2.5rem; transform:scaleX(-1); animation: driveOvertake 4s infinite;">🚗</div>
             <div style="position:absolute; left:50%; top:50%; font-size:1.5rem; opacity:0; animation: indicatorShow 4s infinite;">◀️</div>
          `;
          style = `@keyframes driveSlow { 0% { left: 10%; } 100% { left: 80%; } }
                   @keyframes driveOvertake { 0% { left: -10%; top: 15%; } 20% { left: 20%; top: 15%; } 40% { left: 35%; top: 60%; } 60% { left: 60%; top: 60%; } 80% { left: 75%; top: 15%; } 100% { left: 100%; top: 15%; } }
                   @keyframes indicatorShow { 0%, 15%, 45%, 100% { opacity:0; } 25%, 35% { opacity:1; } }`;
        } else if (lv.themeType === 'respectful_parking' || lv.themeType === 'lane_discipline' || lv.id === 2) {
          h += `
             <div style="position:absolute; left:20%; top:15%; font-size:2.5rem; transform:scaleX(-1); animation: driveLaneA 4s infinite linear;">🚗</div>
             <div style="position:absolute; left:40%; top:55%; font-size:2.5rem; transform:scaleX(-1); animation: driveLaneB 4s infinite linear;">🚙</div>
             <div style="position:absolute; top:20px; left:40%; color:#34d399; font-weight:bold; font-size:0.8rem; animation: textFade 4s infinite;">✓ STAY IN LANE</div>
          `;
          style = `@keyframes driveLaneA { 0% { left:-50px; } 100% { left: 120%; } }
                   @keyframes driveLaneB { 0% { left: 0%; } 100% { left: 150%; } }
                   @keyframes textFade { 0%, 10%, 90%, 100% { opacity:0; } 20%, 80% { opacity:1; } }`;
        } else {
          // Generic driving demo
          h += `
             <div style="position:absolute; left:10%; top:15%; font-size:2.5rem; transform:scaleX(-1); animation: driveGenA 3s infinite linear;">🚗</div>
             <div style="position:absolute; left:60%; top:55%; font-size:2.5rem; transform:scaleX(-1); animation: driveGenB 4s infinite linear;">🚙</div>
          `;
          style = `@keyframes driveGenA { 0% { left:-20%; } 100% { left: 120%; } }
                   @keyframes driveGenB { 0% { left:-20%; } 100% { left: 120%; } }`;
        }
        
        h += `<style>${style}</style></div>`;
        return h;
      },
      dispatchStart(mode) {
         mode = mode || this.curMode || 'car';
         const lv = this.cur;
         const passed = S.comp[lv.id] && S.comp[lv.id].modes && S.comp[lv.id].modes[mode];
         if (!passed) {
             this.showQuiz(mode);
         } else {
             window.location.href = `Driving.html?lv=${lv.id}&mode=${mode}`;
         }
      },
      showQuiz(mode) {
        mode = mode || ui.curMode || 'car';
        let qs = (this.cur.quiz && this.cur.quiz[mode]) ? this.cur.quiz[mode] : (this.cur.quiz ? this.cur.quiz.car : null);
        if (!qs) {
            qs = [
                { q: `What is the primary rule for this scenario: ${this.cur.name}?`, o: [this.cur.law.sec, "Speed up", "Ignore signals", "Honk loudly"], a: 0 },
                { q: `What is the penalty for ${this.cur.law.off}?`, o: [this.cur.law.fine, "₹100", "No fine", "Warning"], a: 0 },
                { q: `If you fail to follow ${this.cur.themeType.replace('_', ' ')} rules, what happens?`, o: ["Accidents and fines", "Nothing", "You get a reward", "Traffic speeds up"], a: 0 }
            ];
            qs.forEach(q => {
               const c = q.o[q.a];
               const rIdx = Math.floor(Math.random() * 4);
               q.o[q.a] = q.o[rIdx];
               q.o[rIdx] = c;
               q.a = rIdx;
            });
        }
        this.qst = { qs: qs, cur: 0, pass: 0, mode: mode };
        if (qs.length === 0) { this._fq(); return; }
        this._rq(); 
        this.show('screen-quiz'); 
      },
      _rq() {
        const s = this.qst, q = s.qs[s.cur];
        document.getElementById('qd').innerHTML = s.qs.map((_, i) => `<div class="qdt ${i < s.cur ? 'dn' : i === s.cur ? 'cu' : ''}"></div>`).join('');
        document.getElementById('qa').innerHTML = `<div class="qcard"><div class="qq"><span>Q${s.cur + 1}</span>${q.q}</div><div class="qopts">${q.o.map((o, i) => `<button class="qo" onclick="ui._aq(${i})">${o}</button>`).join('')}</div><div class="qfb" id="qfb"></div></div>`;
        document.getElementById('qnxt').style.display = 'none';
      },
      _aq(idx) {
        const s = this.qst, q = s.qs[s.cur]; document.querySelectorAll('.qo').forEach(o => o.disabled = true);
        document.querySelectorAll('.qo')[idx].classList.add(idx === q.a ? 'ok' : 'no');
        if (idx !== q.a) document.querySelectorAll('.qo')[q.a].classList.add('rv');
        const fb = document.getElementById('qfb');
        if (idx === q.a) { fb.textContent = '✅ Correct!'; fb.className = 'qfb ok'; s.pass++; sfx.play('ok'); }
        else { fb.textContent = `❌ Incorrect. Correct: "${q.o[q.a]}"`; fb.className = 'qfb no'; sfx.play('error'); }
        const nb = document.getElementById('qnxt'); nb.style.display = 'inline-block'; nb.textContent = s.cur < s.qs.length - 1 ? 'Next  ' : 'See Results  ';
      },
      nextQ() { const s = this.qst; s.cur++; if (s.cur < s.qs.length) this._rq(); else this._fq(); },
      _fq() {
        const s = this.qst; 
        if (s.pass < s.qs.length) { 
          toast(`❌ ${s.pass}/${s.qs.length} correct 🔄 retry!`, '#ff3b30'); 
          setTimeout(() => this.showQuiz(s.mode), 900); 
          return; 
        } 
        if (s.mode === 'final') {
          this.showResults(game.fs || 100, game.fst || { vio: 0 }); 
        } else {
          const lv = this.cur;
          if (!S.comp[lv.id]) S.comp[lv.id] = {};
          if (!S.comp[lv.id].modes) S.comp[lv.id].modes = {};
          S.comp[lv.id].modes[s.mode] = true;
          save();
          toast(`✅ ${s.mode.charAt(0).toUpperCase() + s.mode.slice(1)} quiz passed!`, '#00c851');
          window.location.href = `Driving.html?lv=${lv.id}&mode=${s.mode}`;
        }
      },
      showResults(score, stats) {
        const lv = this.cur, prev = S.comp[lv.id]?.score || 0;
        S.comp[lv.id] = { ...S.comp[lv.id], score: Math.max(score, prev), time: Date.now(), finalQuiz: true }; S.total += score; save();
        let be = null;
        if (lv.badge && !S.badges.includes(lv.badge.id)) { S.badges.push(lv.badge.id); be = lv.badge; }
        if (!S.badges.includes('signal_master') && Object.keys(S.comp).length >= 5 && !stats.vio) S.badges.push('signal_master');
        if (S.badges.includes('traffic_hero') && !S.badges.includes('smart_citizen')) S.badges.push('smart_citizen');
        save();
        document.getElementById('rico').textContent = score > 200 ? '🌟' : '⭐';
        document.getElementById('rtit').textContent = 'Level Complete!';
        document.getElementById('rsub').textContent = lv.name + ' 🔄 Well done!';
        document.getElementById('rcard').innerHTML = `<div class="rr"><span class="rl">Score</span><span class="rv">⭐ ${Math.round(score)}</span></div><div class="rr"><span class="rl">Quiz</span><span class="rv">✅ Passed</span></div>${stats.fin ? `<div class="rr"><span class="rl">Fines issued</span><span class="rv" style="color:var(--red)">${stats.fin}</span></div>` : ''}<div class="rr"><span class="rl">Violations</span><span class="rv" style="color:${stats.vio ? 'var(--red)' : 'var(--green)'}">${stats.vio || 'None ✅'}</span></div><div class="rr"><span class="rl">Level</span><span class="rv">${lv.id} / 20</span></div>
${stats.reward ? `<div class="rr"><span class="rl" style="color:#00c851">Level Reward</span><span class="rv" style="color:#00c851">+₹${stats.reward.toLocaleString('en-IN')}</span></div>` : ''}
${stats.fineAmt ? `<div class="rr"><span class="rl" style="color:#ff3b30">Fines Deducted</span><span class="rv" style="color:#ff3b30">-₹${stats.fineAmt.toLocaleString('en-IN')}</span></div>` : ''}
<div class="rr" style="margin-top:10px; border-top:1px solid #333; padding-top:10px;"><span class="rl">Career Wallet</span><span class="rv" style="color:#f1c40f">₹${S.wallet.toLocaleString('en-IN')}</span></div>`;
        document.getElementById('ro').classList.add('on'); sfx.play('win');
      },
      issueChallan(off, sec, amt, loc, cb) {
        this.cq.push({ off, sec, amt, loc, cb });
        if (!this.cbusy) this._nc();
      },
      _nc() {
        if (!this.cq.length) { this.cbusy = false; return; } this.cbusy = true; const c = this.cq.shift();
        const vf = document.getElementById('vflash'); if (vf) { vf.classList.remove('flash'); void vf.offsetWidth; vf.classList.add('flash'); } document.getElementById('cnum').textContent = 'MTP/2026/' + (Math.floor(Math.random() * 90000) + 10000); document.getElementById('coff').textContent = c.off; document.getElementById('claw').textContent = c.sec; document.getElementById('camt').textContent = c.amt; const locEl = document.getElementById('cloc'); if (locEl) locEl.textContent = c.loc || '📍 Mumbai'; document.getElementById('cov').classList.add('on'); this._ccb = c.cb || null; if (game.playing) game.pause = true; sfx.play('challan');
      },
      dismissChallan() {
        const cov = document.getElementById('cov');
        const cvc = document.getElementById('cvc-main');

        // Create clone for animation
        const rect = cvc.getBoundingClientRect();
        const clone = cvc.cloneNode(true);
        clone.id = '';
        clone.style.position = 'fixed';
        clone.style.top = rect.top + 'px';
        clone.style.left = rect.left + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.margin = '0';
        clone.style.zIndex = '999999';
        clone.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        document.body.appendChild(clone);

        // Hide original immediately
        cov.classList.remove('on');

        // Trigger animation
        setTimeout(() => {
          clone.style.transform = 'scale(0.2)';
          clone.style.top = (window.innerHeight - 150) + 'px';
          clone.style.left = (window.innerWidth - 150) + 'px';
          clone.style.opacity = '0';
        }, 20);

        // Create corner card
        setTimeout(() => {
          const stack = document.getElementById('challan-stack');
          stack.classList.add('on');
          const offText = document.getElementById('coff').textContent;
          const amtText = document.getElementById('camt').textContent;
          ui._addChallanCard(offText, amtText);
        }, 300);

        // Cleanup and continue
        setTimeout(() => {
          clone.remove();
          if (this._ccb) { this._ccb(); this._ccb = null; }
          if (game.playing) game.pause = false;
          setTimeout(() => this._nc(), 80);
        }, 500);
      }
    };

    // 🚦 PROCEDURAL ENGINE AND SCENARIO ARRAYS 🚦
    // Texture Generator
    const _genTex = (type) => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256; const ctx = c.getContext('2d');
      if (type === 'asphalt') {
        ctx.fillStyle = '#21232b'; ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 5000; i++) { ctx.fillStyle = Math.random() > .5 ? '#2a2c36' : '#1a1c22'; ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
      } else if (type === 'pave') {
        ctx.fillStyle = '#666666'; ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#555555'; ctx.lineWidth = 2;
        for (let y = 0; y < 256; y += 32) { for (let x = 0; x < 256; x += 32) { ctx.strokeRect(x, y, 32, 32); } }
      } else if (type === 'building') {
        ctx.fillStyle = '#d3d3d3'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#95a5a6'; for (let y = 0; y < 256; y += 64) { ctx.fillRect(0, y + 32, 256, 4); }
        for (let x = 0; x < 256; x += 64) { ctx.fillRect(x, 0, 4, 256); }
      } else if (type === 'police') {
        ctx.fillStyle = '#2980b9'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#34495e'; for (let y = 0; y < 256; y += 32) { ctx.fillRect(0, y, 256, 2); }
        for (let x = 0; x < 256; x += 64) { for (let y = 0; y < 256; y += 32) { ctx.fillRect(x + (y % 64 === 0 ? 32 : 0), y, 2, 32); } }
      } else if (type === 'hospital') {
        ctx.fillStyle = '#ecf0f1'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#bdc3c7'; for (let y = 0; y < 256; y += 32) { for (let x = 0; x < 256; x += 32) { ctx.strokeRect(x, y, 32, 32); } }
      } else if (type === 'bank') {
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(0, 0, 256, 256);
        const grd = ctx.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#95a5a6'); grd.addColorStop(1, '#7f8c8d');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#2c3e50'; for (let x = 0; x < 256; x += 40) { ctx.fillRect(x, 0, 8, 256); }
      } else if (type === 'temple') {
        ctx.fillStyle = '#d35400'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#e67e22'; for (let y = 0; y < 256; y += 16) { ctx.fillRect(0, y, 256, 2); }
        for (let x = 0; x < 256; x += 32) { for (let y = 0; y < 256; y += 16) { ctx.fillRect(x + (y % 32 === 0 ? 16 : 0), y, 2, 16); } }
      } else if (type === 'shop') {
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#d35400'; for (let y = 0; y < 256; y += 128) { ctx.fillRect(0, y, 256, 16); }
      } else if (type === 'car') {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#000000'; ctx.fillRect(32, 32, 192, 64); // windshield
        ctx.fillRect(32, 160, 192, 64); // rear window
        ctx.fillStyle = '#c0392b'; ctx.fillRect(16, 220, 64, 36); ctx.fillRect(176, 220, 64, 36); // taillights
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(16, 0, 64, 32); ctx.fillRect(176, 0, 64, 32); // headlights
      }
      const tex = new THREE.CanvasTexture(c); tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
      if (type === 'pave' || type === 'asphalt') tex.repeat.set(4, 4);
      else if (type === 'building' || type === 'bank' || type === 'temple' || type === 'police' || type === 'hospital') tex.repeat.set(2, 2);
      return tex;
    };

    let gTex = null;
    const initGTex = () => {
      if (gTex) return;
      gTex = {
        asphalt: _genTex('asphalt'),
        pave: _genTex('pave'),
        building: _genTex('building'),
        police: _genTex('police'), hospital: _genTex('hospital'), bank: _genTex('bank'),
        temple: _genTex('temple'), shop: _genTex('shop'), car: _genTex('car')
      };
    };



    const _buildVehicle = (type, col) => {

      let baseModel = null;
      let s = 1.0;
      let rotY = 0;

      if (window.PRELOADED_MODELS) {
        let modelKey = type;
        const keysForType = Object.keys(window.PRELOADED_MODELS).filter(k => k === type || k.startsWith(type + '_'));
        if (keysForType.length > 0) {
            modelKey = keysForType[Math.floor(Math.random() * keysForType.length)];
        }
        
        if (window.PRELOADED_MODELS[modelKey]) {
            baseModel = window.PRELOADED_MODELS[modelKey].clone();
            if (type === 'bus' || type === 'truck') s = 1.4 * 14.5;
            else if (type === 'auto' || type === 'bike') s = 1.0 * 14.5;
            else s = 1.2 * 14.5;

            baseModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Kenney models usually use materials like "paint", "body", "color"
                    if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('paint') || (child.material.name && child.material.name.toLowerCase().includes('paint'))) {
                        child.material = child.material.clone();
                        child.material.color.setHex(col);
                    }
                }
            });
        }
      }
      
      if (!baseModel && type === 'bike' && window.PRELOADED_MODELS && window.PRELOADED_MODELS['auto']) {
        baseModel = window.PRELOADED_MODELS['auto'].clone();
        s = 1.0;
      }

      if (baseModel) {
        const g = new THREE.Group();
        baseModel.scale.set(s, s, s);
        baseModel.rotation.y = rotY;
        baseModel.position.y = 0;
        
        // Add an invisible hitbox for collisions
        const hw = (type === 'bus' || type === 'truck') ? 2.5 : 1.6;
        const hl = (type === 'bus' || type === 'truck') ? 8.0 : 4.0;
        const hbGeo = new THREE.BoxGeometry(hw, 2, hl);
        const hbMat = new THREE.MeshBasicMaterial({ visible: false });
        const hb = new THREE.Mesh(hbGeo, hbMat);
        hb.position.y = 1;
        
        g.add(baseModel);
        g.add(hb);
        g.type = type;
        return g;
      }

      const g = new THREE.Group();
switch (type) {
  case 'car':
  case 'taxi': {
    const isT = type === 'taxi';
    const bodyM = new THREE.MeshPhongMaterial({ color: isT ? 0xffd54a : col });
    const glassM = new THREE.MeshPhongMaterial({ color: 0x1a2e4a, transparent: true, opacity: 0.75 });
    const wheelM = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const rimM = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const hlM = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const tlM = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // Chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 3.8), bodyM);
    body.position.y = 0.42; g.add(body);
    // Cabin
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.44, 1.9), bodyM);
    cab.position.set(0, 0.84, 0.08); g.add(cab);
    // Windshield
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), glassM);
    ws.position.set(0, 0.84, 1.02); ws.rotation.x = Math.PI / 5; g.add(ws);
    const rs = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), glassM);
    rs.position.set(0, 0.84, -0.85); rs.rotation.x = -Math.PI / 5; g.add(rs);
    // 4 Wheels
    [[0.85, 0, 1.25], [-0.85, 0, 1.25], [0.85, 0, -1.25], [-0.85, 0, -1.25]].forEach(([x, , z]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), wheelM);
      wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.3, z); g.add(wh);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.22, 6), rimM);
      rim.rotation.z = Math.PI / 2; rim.position.set(x, 0.3, z); g.add(rim);
    });
    // Headlights & taillights
    [[0.55, 0.45, 1.92, hlM], [-0.55, 0.45, 1.92, hlM], [0.55, 0.45, -1.92, tlM], [-0.55, 0.45, -1.92, tlM]].forEach(([x, y, z, m]) => {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), m); l.position.set(x, y, z); g.add(l);
    });
    break;
  }
  case 'bus': {
    const bM = new THREE.MeshPhongMaterial({ color: col || 0xe74c3c }); // BEST bus red
    const gM = new THREE.MeshPhongMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.6 });
    const wM = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const bdy = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 8.0), bM);
    bdy.position.y = 1.18; g.add(bdy);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 7.6), bM);
    roof.position.y = 2.37; g.add(roof);
    for (let i = 0; i < 4; i++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.78), gM);
      win.position.set(1.16, 1.4, 2.2 - i * 1.8); win.rotation.y = Math.PI / 2; g.add(win);
    }
    const wsB = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.95), gM);
    wsB.position.set(0, 1.5, 4.02); g.add(wsB);
    [[-1.2, 0, 2.8], [1.2, 0, 2.8], [-1.2, 0, 0], [1.2, 0, 0], [-1.2, 0, -2.8], [1.2, 0, -2.8]].forEach(([x, , z]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.24, 8), wM);
      wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.4, z); g.add(wh);
    });
    break;
  }
  case 'auto': {
    const aM = new THREE.MeshPhongMaterial({ color: 0xffd54a });
    const sM = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const wM = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const abody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 2.1), aM);
    abody.position.y = 0.52; g.add(abody);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.14, 2.1), sM);
    stripe.position.y = 0.68; g.add(stripe);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 1.4), aM);
    hood.position.set(0, 0.85, -0.1); g.add(hood);
    // 3 wheels: 2 rear + 1 front
    [[-0.58, 0, 0.72], [0.58, 0, 0.72]].forEach(([x, , z]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 7), wM);
      wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.22, z); g.add(wh);
    });
    const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 7), wM);
    fw.rotation.z = Math.PI / 2; fw.position.set(0, 0.22, -0.85); g.add(fw);
    break;
  }
  case 'truck': {
    const cM = new THREE.MeshPhongMaterial({ color: col || 0x1565c0 });
    const contM = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
    const gM2 = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
    const wM2 = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, 2.6), cM);
    cab.position.set(0, 1.05, 2.5); g.add(cab);
    const spoi = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.3), cM);
    spoi.position.set(0, 2.38, 2.5); g.add(spoi);
    const wsT = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.95), gM2);
    wsT.position.set(0, 1.28, 3.81); g.add(wsT);
    const cont = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.3, 5.8), contM);
    cont.position.set(0, 1.22, -1.5); g.add(cont);
    [[-1.12, 0, 2.7], [1.12, 0, 2.7], [-1.12, 0, 0.8], [1.12, 0, 0.8], [-1.12, 0, -1], [1.12, 0, -1], [-1.12, 0, -3], [1.12, 0, -3]].forEach(([x, , z]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.24, 8), wM2);
      wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.42, z); g.add(wh);
    });
    break;
  }
  case 'bike': {
    const bkM = new THREE.MeshPhongMaterial({ color: col });
    const wkM = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 1.9), bkM);
    frame.position.y = 0.62; g.add(frame);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.75), bkM);
    tank.position.set(0, 0.88, 0.3); g.add(tank);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.85), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }));
    seat.position.set(0, 0.88, -0.18); g.add(seat);
    const hbar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.12), new THREE.MeshPhongMaterial({ color: 0xaaaaaa }));
    hbar.position.set(0, 1.02, 0.88); g.add(hbar);
    const wf = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 8), wkM);
    wf.rotation.z = Math.PI / 2; wf.position.set(0, 0.28, 0.88); g.add(wf);
    const wr = wf.clone(); wr.position.z = -0.88; g.add(wr);
    break;
  }
  case 'suv': {
    const suvM = new THREE.MeshPhongMaterial({ color: col });
    const gS = new THREE.MeshPhongMaterial({ color: 0x1a3a5a, transparent: true, opacity: 0.7 });
    const wS = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const sbody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.58, 4.3), suvM);
    sbody.position.y = 0.44; g.add(sbody);
    const scab = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.78, 2.6), suvM);
    scab.position.set(0, 0.98, -0.05); g.add(scab);
    const sws = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7), gS);
    sws.position.set(0, 0.98, 1.3); sws.rotation.x = Math.PI / 6; g.add(sws);
    [[-0.95, 0, 1.45], [0.95, 0, 1.45], [-0.95, 0, -1.45], [0.95, 0, -1.45]].forEach(([x, , z]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 8), wS);
      wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.36, z); g.add(wh);
    });
    break;
  }
  case 'cycle': {
    const cycM = new THREE.MeshPhongMaterial({ color: col });
    const wCy = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const cyframe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 1.3), cycM);
    cyframe.position.y = 0.5; g.add(cyframe);
    const han = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.1), new THREE.MeshPhongMaterial({ color: 0xaaaaaa }));
    han.position.set(0, 0.85, 0.6); g.add(han);
    [0.6, -0.6].forEach(z => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8), wCy);
      wh.rotation.z = Math.PI / 2; wh.position.set(0, 0.25, z); g.add(wh);
    });
    break;
  }
  default: {
    // Fallback: simple colored box
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.5), new THREE.MeshPhongMaterial({ color: col })));
  }
}
      return g;
    };

    const _buildHuman = (isPlayer = false) => {
      const g = new THREE.Group();

      const chars = ['char_f_a', 'char_f_b', 'char_f_c', 'char_m_a', 'char_m_b', 'char_m_c'];
      const charKey = chars[Math.floor(Math.random() * chars.length)];
      
      if (window.PRELOADED_MODELS && window.PRELOADED_MODELS[charKey]) {
        const hModel = window.PRELOADED_MODELS[charKey].clone();
        const s = isPlayer ? 1.5 : 1.2;
        hModel.scale.set(s, s, s);
        hModel.position.y = 0;
        
        // Add invisible hitbox for collisions
        const hbGeo = new THREE.BoxGeometry(0.8, 2.0, 0.8);
        const hbMat = new THREE.MeshBasicMaterial({ visible: false });
        const hb = new THREE.Mesh(hbGeo, hbMat);
        hb.position.y = 1.0;
        
        g.add(hModel);
        g.add(hb);

        // We still need mock lLeg and rLeg for the animation in game_core.js _upeds
        const dummyGeo = new THREE.Group();
        g.userData = { lLeg: dummyGeo, rLeg: dummyGeo, t: Math.random() * 10, spd: 1.5 + Math.random(), dir: Math.random() > 0.5 ? 1 : -1, startZ: 0 };
        return g;
      }

      // Fallback
      const skins = [0xe0ac69, 0x8d5524, 0xc68642, 0xf1c27d, 0xffdbac];
      const sColor = isPlayer ? 0xc68642 : skins[Math.floor(Math.random() * skins.length)];
      const shColor = isPlayer ? 0xe74c3c : Math.random() * 0xffffff;
      const pColor = isPlayer ? 0x2980b9 : [0x333333, 0x111111, 0x555555, 0x4a2311][Math.floor(Math.random() * 4)];

      const scale = isPlayer ? 1.1 : 1.0;

      const skin = new THREE.MeshLambertMaterial({ color: sColor });
      const shirt = new THREE.MeshLambertMaterial({ color: shColor });
      const pants = new THREE.MeshLambertMaterial({ color: pColor });

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.4 * scale, 0.4 * scale), skin); head.position.y = 1.8 * scale; g.add(head);

      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.1 * scale, 0.42 * scale), new THREE.MeshLambertMaterial({ color: 0x111111 }));
      hair.position.y = 2.0 * scale; g.add(hair);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 0.7 * scale, 0.3 * scale), shirt); torso.position.y = 1.25 * scale; g.add(torso);

      if (isPlayer) {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.2), new THREE.MeshLambertMaterial({ color: 0xf39c12 }));
        bag.position.set(0, 1.25 * scale, -0.2); g.add(bag);
      }

      const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.9 * scale, 0.25 * scale), pants); lLeg.position.set(-0.15 * scale, 0.45 * scale, 0); g.add(lLeg);
      const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.9 * scale, 0.25 * scale), pants); rLeg.position.set(0.15 * scale, 0.45 * scale, 0); g.add(rLeg);

      const shoeM = new THREE.MeshLambertMaterial({ color: 0x111111 });
      const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26 * scale, 0.1 * scale, 0.3 * scale), shoeM); lShoe.position.set(-0.15 * scale, 0.05 * scale, 0.05); g.add(lShoe);
      const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26 * scale, 0.1 * scale, 0.3 * scale), shoeM); rShoe.position.set(0.15 * scale, 0.05 * scale, 0.05); g.add(rShoe);

      g.userData = { lLeg, rLeg, t: Math.random() * 10, spd: 1.5 + Math.random(), dir: Math.random() > 0.5 ? 1 : -1, startZ: 0 };
      return g;
    };

    function updateTrafficAuthUI() {
      const localData = localStorage.getItem('traffic_local_user');
      const user = localData ? JSON.parse(localData) : null;
      
      const profileDiv = document.getElementById('trafficUserProfile');
      
      document.querySelectorAll('.dynamic-auth-btn').forEach(b => {
          b.innerHTML = user ? '📊 Dashboard' : 'Sign In';
          b.onclick = () => window.location.href = user ? 'TrafficDashboard.html' : 'TrafficSetup.html';
      });
      
      const navBtn = document.getElementById('academy-sign-in-btn');
      if (navBtn) navBtn.style.display = user ? 'none' : 'block';

      if (user) {
          if (profileDiv) {
              profileDiv.style.display = 'flex';
              profileDiv.onclick = () => window.location.href = 'TrafficDashboard.html';
          }
          
          const nameNode = profileDiv ? profileDiv.querySelector('#trafficUserName') : null;
          const initialsNode = profileDiv ? profileDiv.querySelector('#trafficUserInitials') : null;
          
          if (nameNode) nameNode.textContent = user.name || 'Driver';
          if (initialsNode && user.name) {
              initialsNode.textContent = user.name.charAt(0).toUpperCase();
              initialsNode.style.display = 'flex';
          }
      } else {
          if (profileDiv) profileDiv.style.display = 'none';
      }
    }
    
    // Run immediately
    updateTrafficAuthUI();
    // And on load
    window.addEventListener('DOMContentLoaded', updateTrafficAuthUI);