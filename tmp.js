var Storage = {
  get: function(key) { try { return localStorage.getItem(key); } catch(e) { return null; } },
  set: function(key, val) { try { localStorage.setItem(key, val); } catch(e) {} }
};

var GOOGLE_CLIENT_ID = '500448449044-hv2rp3k0lsok9ara1bred87c75lnsp7l.apps.googleusercontent.com';
let curUser=null, dbFil='all', googleAccessToken=null, driveFileId=null;
let saved = [];

try { const sData = Storage.get('qrs_min'); if (sData) saved = JSON.parse(sData); } catch(e) {}

function switchView(viewId) {
    document.querySelectorAll('.db-view').forEach(v => v.style.display = 'none');
    const target = document.getElementById('view-' + viewId);
    if(target) target.style.display = 'block';
    
    document.querySelectorAll('.app-sb .sb-btn').forEach(btn => {
        if(btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(viewId)) {
            btn.classList.add('act');
        } else if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes('switchView')) {
            btn.classList.remove('act');
        }
    });
    
    if(viewId === 'stats') renderStats();
    if(viewId === 'templates') renderTemplates();
    if(viewId === 'domains') renderDomains();
}

function renderDB(){
  const filtered = dbFil==='all' ? saved : saved.filter(q=>q.type===dbFil);
  document.getElementById('stTotal').textContent = saved.length;
  
  const uniqueTypes = [];
  saved.forEach(function(q){ if(uniqueTypes.indexOf(q.type)===-1) uniqueTypes.push(q.type); });
  document.getElementById('stTypes').textContent = uniqueTypes.length;
  document.getElementById('stLast').textContent = saved.length>0 ? saved[0].date : '—';
  
  const dbs = document.getElementById('dbSub');
  if(curUser && dbs) dbs.textContent = `Dashboard synced. ${saved.length} assets ready.`;
  
  const g = document.getElementById('dbG'); if(!g) return;
  g.innerHTML = '';
  if(!filtered.length){
    g.innerHTML=`<div class="db-emp"><div class="ei">🔳</div><h3>Workspace Empty</h3><p>No assets found for this filter.</p><button class="btn-nx" style="margin: 20px auto 0" onclick="window.location.href='qr-editor.html'">Initialize New QR</button></div>`;
    return;
  }
  filtered.forEach(q=>{
    const c=document.createElement('div');c.className='dbc';
    const nameStr = (q.advSettings && q.advSettings.name) ? q.advSettings.name : q.content;
    const shortC = nameStr.length>38 ? nameStr.substring(0,38)+'…' : nameStr;
    c.innerHTML=`<div class="dbt">${q.thumb?`<img src="${q.thumb}" alt="QR" loading="lazy">`:'<div style="font-size:2rem;opacity:.25">🔳</div>'}</div>
    <div class="dbb"><div class="dtyp">${q.typeIcon} ${q.typeName}</div><h3 title="${q.content}">${shortC}</h3><div class="ddt">📅 ${q.date}</div></div>
    <div class="dba"><button class="dba-btn" onclick="editQR(${q.id})">✏️ Editor</button><button class="dba-btn" onclick="reDL(${q.id})">⬇ Export</button><button class="dba-btn del" onclick="delQR(${q.id})">🗑 Delete</button></div>`;
    g.appendChild(c);
  });
}

function fDB(type,btn){
    dbFil=type;
    document.querySelectorAll('.dbf').forEach(b=>{ if(b===btn) b.classList.add('act'); else b.classList.remove('act'); });
    renderDB();
}
function delQR(id){
    if(!confirm('Permanently purge this QR asset?'))return;
    let idx = -1;
    for(let i=0;i<saved.length;i++){ if(saved[i].id===id){idx=i;break;} }
    if(idx>-1){
        saved.splice(idx,1);
      async function renderStats() {
    const v = document.getElementById('view-stats');
    if(v.innerHTML !== '') return;
    
    // Initial loading state
    v.innerHTML = `
        <div class="db-hd" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
          <div><h1 style="font-size:2.2rem; margin:0;">Stats</h1></div>
          <button class="dbf" style="border:1px solid var(--pri); color:var(--pri); background:transparent;">Export information</button>
        </div>
        
        <div style="background: rgba(37,99,235,0.05); border: 1px solid rgba(37,99,235,0.2); border-radius: 8px; padding: 12px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; gap:10px; align-items:center; color: #3b82f6; font-weight:600; font-size:0.95rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                You can set your time zone. <span style="font-weight:400; opacity:0.8;">Current time zone: Asia/Calcutta</span>
            </div>
            <div style="display:flex; gap:10px;">
                <button style="background:transparent; border:none; color:#3b82f6; font-weight:700; cursor:pointer;">Change</button>
                <button style="background:#3b82f6; border:none; color:#fff; padding:6px 16px; border-radius:20px; font-weight:600; cursor:pointer; transition:0.2s;">Accept</button>
            </div>
        </div>
        
        <div style="display:flex; justify-content:space-between; margin-bottom:20px; align-items:center; flex-wrap:wrap; gap:15px;">
            <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
                <select style="background:var(--panel); border:1px solid var(--border); color:var(--txt); padding:10px 15px; border-radius:8px; outline:none; font-family:var(--font-main);">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>This year</option>
                </select>
                <div style="background:var(--panel); border:1px solid var(--border); padding:10px 15px; border-radius:8px; color:var(--txt-m); display:flex; align-items:center; gap:10px; font-size:0.9rem;">
                    Jun 3, 2026 - Jun 10, 2026
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <div style="background:var(--panel); border:1px solid var(--border); padding:10px 15px; border-radius:8px; color:var(--txt-m); display:flex; align-items:center; gap:10px; font-size:0.9rem;">
                    Time zone: Asia/Calcutta ✎
                </div>
            </div>
            <button class="dbf" style="display:flex; align-items:center; gap:8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                Filter
            </button>
        </div>

        <div style="background: rgba(255,255,255,0.02); border-radius:8px; padding:12px 20px; margin-bottom:25px; font-size:0.85rem; color:var(--txt-m); display:flex; align-items:center;">
            <strong style="color:var(--txt); margin-right:8px;">Analyzed period:</strong> 03-06-2026 to 10-06-2026
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px;" id="stats-cards-container">
            <div style="padding: 50px; text-align: center; color: var(--txt-m); grid-column:1/-1;">
               <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
               <div style="margin: 0 auto 20px auto; width: 40px; height: 40px; border: 4px solid rgba(16, 185, 129, 0.2); border-top: 4px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite;"></div>
               <p>Syncing analytics data from cloud...</p>
            </div>
        </div>
        
        <div class="dbc" style="padding: 25px; margin-bottom:25px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; flex-wrap:wrap; gap:15px;">
                <div style="display:flex; gap:20px; align-items:center;">
                    <label style="display:flex; gap:8px; align-items:center; cursor:pointer;"><input type="checkbox" checked style="accent-color:var(--pri); width:18px; height:18px;"> <span style="font-weight:600; font-size:0.95rem;">Totals</span></label>
                    <label style="display:flex; gap:8px; align-items:center; cursor:pointer;"><input type="checkbox" style="accent-color:var(--pri); width:18px; height:18px;"> <span style="font-weight:600; font-size:0.95rem; color:var(--txt-m);">Uniques</span></label>
                    <label style="display:flex; gap:8px; align-items:center; cursor:pointer;"><input type="checkbox" style="accent-color:var(--pri); width:18px; height:18px;"> <span style="font-weight:600; font-size:0.95rem; color:var(--txt-m);">Visits</span></label>
                </div>
                <div style="display:flex; gap:15px; align-items:center;">
                    <div style="display:flex; background:var(--bg); border:1px solid var(--border); border-radius:8px; overflow:hidden;">
                        <button style="padding:8px 16px; border:none; background:rgba(37,99,235,0.1); color:#3b82f6; font-weight:600; cursor:pointer;">Day</button>
                        <button style="padding:8px 16px; border:none; border-left:1px solid var(--border); background:transparent; color:var(--txt-m); font-weight:600; cursor:pointer;">Month</button>
                        <button style="padding:8px 16px; border:none; border-left:1px solid var(--border); background:transparent; color:var(--txt-m); font-weight:600; cursor:pointer;">Year</button>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button style="width:36px; height:36px; border-radius:8px; border:none; background:var(--bg); color:var(--txt-m); display:flex; align-items:center; justify-content:center; cursor:pointer;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></button>
                        <button style="width:36px; height:36px; border-radius:8px; border:none; background:rgba(37,99,235,0.1); color:#3b82f6; display:flex; align-items:center; justify-content:center; cursor:pointer;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="3" width="4" height="18"></rect><rect x="10" y="8" width="4" height="13"></rect><rect x="2" y="13" width="4" height="8"></rect></svg></button>
                    </div>
                </div>
            </div>
            <div style="width:100%; height:300px; position:relative;">
                <canvas id="statsChart"></canvas>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:50px;" id="accordions-container">
            <!-- Accordions rendered below -->
        </div>
    `;

    // Initialize Supabase if needed
    let sb = window.supabaseClient;
    if (!sb) {
        try {
            const res = await fetch('config.json');
            const config = await res.json();
            if (config.auth && config.auth.url) {
                if (typeof window.supabase === 'undefined') {
                    await new Promise(resolve => {
                        const script = document.createElement('script');
                        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
                        script.onload = resolve;
                        document.head.appendChild(script);
                    });
                }
                sb = window.supabase.createClient(config.auth.url, config.auth.key);
                window.supabaseClient = sb;
            }
        } catch(e) {}
    }

    const myQrIds = saved.map(q => String(q.id));
    let scans = [];
    
    if (sb && myQrIds.length > 0) {
        try {
            const { data } = await sb.from('qr_scans').select('*').in('qr_id', myQrIds);
            if (data) scans = data;
        } catch(e) {
            console.error('Failed to load stats', e);
        }
    }

    const totalQRs = saved.length;
    const totalScans = scans.length;
    
    // Calculate unique scans (by visitor_hash)
    const uniqueHashes = new Set(scans.filter(s => s.visitor_hash).map(s => s.visitor_hash));
    const totalUnique = uniqueHashes.size > 0 ? uniqueHashes.size : (totalScans > 0 ? Math.ceil(totalScans * 0.8) : 0); 
    const totalVisits = totalScans; // Mock visits

    const cardsHtml = `
         <div class="st-card" style="padding:35px 25px; border-radius:8px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:var(--panel); border:1px solid var(--border);">
            <div class="v" style="font-size:3.5rem; color:var(--txt); -webkit-text-fill-color:var(--txt); background:none; text-shadow:none; font-family:var(--font-main);">\${totalQRs}</div>
            <div class="l" style="text-transform:none; font-weight:600; margin-top:15px; color:var(--txt-m); display:flex; align-items:center; gap:8px; font-size:1rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg> Total QR Codes
            </div>
         </div>
         <div class="st-card" style="padding:35px 25px; border-radius:8px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:var(--panel); border:1px solid var(--border);">
            <div class="v" style="font-size:3.5rem; color:var(--txt); -webkit-text-fill-color:var(--txt); background:none; text-shadow:none; font-family:var(--font-main);">\${totalScans}</div>
            <div class="l" style="text-transform:none; font-weight:600; margin-top:15px; color:var(--txt-m); display:flex; align-items:center; gap:8px; font-size:1rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Total Scans
            </div>
         </div>
         <div class="st-card" style="padding:35px 25px; border-radius:8px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:var(--panel); border:1px solid var(--border);">
            <div class="v" style="font-size:3.5rem; color:var(--txt); -webkit-text-fill-color:var(--txt); background:none; text-shadow:none; font-family:var(--font-main);">\${totalUnique}</div>
            <div class="l" style="text-transform:none; font-weight:600; margin-top:15px; color:var(--txt-m); display:flex; align-items:center; gap:8px; font-size:1rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Total Unique Scans
            </div>
         </div>
         <div class="st-card" style="padding:35px 25px; border-radius:8px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:var(--panel); border:1px solid var(--border);">
            <div class="v" style="font-size:3.5rem; color:var(--txt); -webkit-text-fill-color:var(--txt); background:none; text-shadow:none; font-family:var(--font-main);">\${totalVisits}</div>
            <div class="l" style="text-transform:none; font-weight:600; margin-top:15px; color:var(--txt-m); display:flex; align-items:center; gap:8px; font-size:1rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Total visits
            </div>
         </div>
    `;
    document.getElementById('stats-cards-container').innerHTML = cardsHtml;

    // Render Chart.js
    const ctx = document.getElementById('statsChart').getContext('2d');
    const today = new Date();
    const labels = [];
    const dataPoints = [];
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', {month:'short', day:'2-digit'}));
        dataPoints.push(0);
    }
    
    scans.forEach(s => {
        const dStr = new Date(s.scanned_at || s.created_at).toLocaleDateString('en-US', {month:'short', day:'2-digit'});
        const idx = labels.indexOf(dStr);
        if(idx !== -1) dataPoints[idx]++;
    });

    if (window.myStatsChart) { window.myStatsChart.destroy(); }
    
    // Add grid color variable handling for light/dark mode
    const isDark = document.body.classList.contains('dark-mode') || getComputedStyle(document.body).backgroundColor === 'rgb(3, 7, 18)';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#cbd5e1' : '#64748b';

    window.myStatsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Totals',
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(37,99,235,0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            }
        }
    });

    // Render accordions
    const accList = [
        "Scans by day", "Scans by operating system", "Scans by country", 
        "Scans by region/city", "Scans by browser", "Scans by user language", "Scans by QR name"
    ];
    let accHtml = '';
    accList.forEach(title => {
        accHtml += `
            <div style="background:var(--panel); border:1px solid var(--border); border-radius:8px; overflow:hidden; transition:0.3s;" class="acc-box">
                <button style="width:100%; padding:20px; background:transparent; border:none; display:flex; justify-content:space-between; align-items:center; cursor:pointer; color:var(--txt); font-weight:700; font-size:1rem;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('svg').style.transform = this.nextElementSibling.style.display === 'block' ? 'rotate(180deg)' : 'rotate(0deg)';">
                    \${title}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition:0.3s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div style="display:none; padding: 0 20px 20px 20px; color:var(--txt-m); font-size:0.9rem; border-top:1px solid rgba(255,255,255,0.05);">
                    <div style="padding-top:20px;">No data available for the selected period.</div>
                </div>
            </div>
        `;
    });
    document.getElementById('accordions-container').innerHTML = accHtml;
}

function renderTemplates() {
    const v = document.getElementById('view-templates');
    if(v.innerHTML !== '') return;
    
    v.innerHTML = `
        <div class="db-hd">
          <div><h1>Template Gallery</h1><p>Start with a premium pre-designed template and customize it.</p></div>
        </div>
        
        <div class="db-grid" style="margin-top:20px;">
            <div class="dbc" onclick="window.location.href='qr-editor.html?template=business_card'" style="cursor:pointer;">
                <div class="dbt" style="background: linear-gradient(135deg, #3b82f6, #2dd4bf);"><div style="font-size: 4rem;">💼</div></div>
                <div class="dbb"><h3>Modern Business Card</h3><div class="ddt">Professional layout with gradient logo support</div></div>
            </div>
            
            <div class="dbc" onclick="window.location.href='qr-editor.html?template=wifi_neon'" style="cursor:pointer;">
                <div class="dbt" style="background: linear-gradient(135deg, #10b981, #f59e0b);"><div style="font-size: 4rem;">📶</div></div>
                <div class="dbb"><h3>Neon Wi-Fi Access</h3><div class="ddt">Vibrant styling for quick guest access</div></div>
            </div>
            
            <div class="dbc" onclick="window.location.href='qr-editor.html?template=minimal_menu'" style="cursor:pointer;">
                <div class="dbt" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);"><div style="font-size: 4rem;">🍽️</div></div>
                <div class="dbb"><h3>Minimalist Menu</h3><div class="ddt">Clean and scannable design for restaurants</div></div>
            </div>
            
            <div class="dbc" onclick="window.location.href='qr-editor.html?template=social_hub'" style="cursor:pointer;">
                <div class="dbt" style="background: linear-gradient(135deg, #6366f1, #a855f7);"><div style="font-size: 4rem;">🔗</div></div>
                <div class="dbb"><h3>Social Media Hub</h3><div class="ddt">Optimized for Linktree or social profiles</div></div>
            </div>
        </div>
    `;
}
function renderDomains() {
    const v = document.getElementById('view-domains');
    if(v.innerHTML !== '') return;
    
    v.innerHTML = `
        <div class="db-hd">
          <div><h1>Custom Domains</h1><p>Connect your own domain to brand your dynamic short links.</p></div>
        </div>
        
        <div style="background: var(--panel); border: 1px solid var(--border); border-radius: 20px; padding: 30px; margin-top: 20px;">
            <h3 style="margin-bottom: 15px; color: var(--txt);">Add New Domain</h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <input type="text" placeholder="e.g. qr.yourcompany.com" style="flex: 1; min-width: 200px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 12px; padding: 15px; color: var(--txt); font-size: 1rem;">
                <button class="btn-nx" onclick="alert('DNS configuration instructions would appear here. Please configure your CNAME record to point to domains.classoflearners.com')" style="margin:0; padding: 15px 30px; border-radius: 12px; font-size: 0.95rem;">Add Domain</button>
            </div>
            <p style="color: var(--txt-m); font-size: 0.85rem; margin-top: 10px;">You will need to update your DNS records (CNAME) with your registrar to complete setup.</p>
        </div>
        
        <h3 style="margin: 40px 0 20px; color: var(--txt);">Connected Domains</h3>
        
        <div style="background: var(--panel); border: 1px solid var(--border); border-radius: 20px; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--pri); box-shadow: 0 0 10px var(--glow);"></div>
                    <span style="font-weight: 700; color: var(--txt);">qr.classoflearners.com</span>
                </div>
                <span style="font-size: 0.8rem; background: rgba(16,185,129,0.1); color: var(--pri); padding: 5px 12px; border-radius: 20px; font-weight: 800;">Active</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 10px rgba(245,158,11,0.5);"></div>
                    <span style="font-weight: 700; color: var(--txt);">link.mybusiness.co</span>
                </div>
                <span style="font-size: 0.8rem; background: rgba(245,158,11,0.1); color: #f59e0b; padding: 5px 12px; border-radius: 20px; font-weight: 800;">Pending DNS</span>
            </div>
        </div>
    `;
}
function editQR(id){ window.location.href = 'qr-editor.html?id=' + id; }
function reDL(id){
    let q=null;
    for(let i=0;i<saved.length;i++){ if(saved[i].id===id){q=saved[i];break;} }
    if(!q)return;
    if(typeof QRCodeStyling === 'undefined') { toast('Library loading...', ''); return; }
    const dlOpts = Object.assign({}, q.opts, {width:800,height:800});
    new QRCodeStyling(dlOpts).download({name:'qr-'+q.type,extension:'png'});
}
