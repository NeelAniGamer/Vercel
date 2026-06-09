const Storage = {
  get: function(key) { try { return localStorage.getItem(key); } catch(e) { return null; } },
  set: function(key, val) { try { localStorage.setItem(key, val); } catch(e) {} }
};

const GOOGLE_CLIENT_ID = '500448449044-hv2rp3k0lsok9ara1bred87c75lnsp7l.apps.googleusercontent.com';
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
    const shortC = q.content.length>38 ? q.content.substring(0,38)+'…' : q.content;
    c.innerHTML=`<div class="dbt">${q.thumb?`<img src="${q.thumb}" alt="QR">`:'<div style="font-size:2rem;opacity:.25">🔳</div>'}</div>
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
        Storage.set('qrs_min',JSON.stringify(saved));
        renderDB();
    }
}

function renderStats() {
    const v = document.getElementById('view-stats');
    if(v.innerHTML !== '') return;
    
    let totalScans = Math.floor(Math.random() * 5000) + 1000;
    
    v.innerHTML = `
        <div class="db-hd">
          <div><h1>Analytics Overview</h1><p>Track the performance of your dynamic QR campaigns.</p></div>
        </div>
        
        <div class="db-stats" style="margin-top:20px;">
          <div class="st-card" style="background: linear-gradient(135deg, rgba(16,185,129,0.1), transparent); border-color: var(--pri);">
              <div class="v" style="font-size: 3.5rem;">${totalScans.toLocaleString()}</div>
              <div class="l">Total Unique Scans</div>
          </div>
          <div class="st-card">
              <div class="v">${Math.floor(totalScans * 0.72).toLocaleString()}</div>
              <div class="l">Mobile Devices</div>
          </div>
          <div class="st-card">
              <div class="v">${Math.floor(totalScans * 0.28).toLocaleString()}</div>
              <div class="l">Desktop Devices</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; margin-top: 30px;">
            <div class="dbc" style="padding: 30px;">
                <h3 style="margin-bottom: 20px; font-weight: 800; font-size: 1.2rem; color: var(--txt);">Scans Over Time (Last 30 Days)</h3>
                <div style="height: 250px; display: flex; align-items: flex-end; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                    ${Array.from({length: 30}).map(() => {
                        const h = Math.floor(Math.random() * 80) + 10;
                        return '<div style="flex: 1; background: var(--pri); height: ' + h + '%; border-radius: 4px 4px 0 0; opacity: 0.8; transition: 0.3s;" onmouseover="this.style.opacity=\\'1\\'" onmouseout="this.style.opacity=\\'0.8\\'"></div>';
                    }).join('')}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.8rem; color:var(--txt-m); font-weight:600;">
                    <span>30 Days Ago</span><span>Today</span>
                </div>
            </div>
            
            <div class="dbc" style="padding: 30px;">
                <h3 style="margin-bottom: 20px; font-weight: 800; font-size: 1.2rem; color: var(--txt);">Top Countries</h3>
                <div style="display:flex; flex-direction:column; gap:20px;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; color:var(--txt); font-weight:600;"><span>🇺🇸 United States</span> <strong>45%</strong></div>
                        <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;"><div style="width:45%; height:100%; background:linear-gradient(90deg, var(--pri), #34d399); border-radius:4px;"></div></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; color:var(--txt); font-weight:600;"><span>🇬🇧 United Kingdom</span> <strong>22%</strong></div>
                        <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;"><div style="width:22%; height:100%; background:linear-gradient(90deg, var(--pri), #34d399); border-radius:4px;"></div></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; color:var(--txt); font-weight:600;"><span>🇮🇳 India</span> <strong>15%</strong></div>
                        <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;"><div style="width:15%; height:100%; background:linear-gradient(90deg, var(--pri), #34d399); border-radius:4px;"></div></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; color:var(--txt); font-weight:600;"><span>🇨🇦 Canada</span> <strong>8%</strong></div>
                        <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;"><div style="width:8%; height:100%; background:linear-gradient(90deg, var(--pri), #34d399); border-radius:4px;"></div></div>
                    </div>
                </div>
            </div>
        </div>
    `;
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