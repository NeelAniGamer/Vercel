
'use strict';
// ══════════════════════════════════════════════════════ IMMUTABLE COMPLIANCE ENGINE METRICS ══════════════════════════════════════════════════════
const LVS=[
{id:1,icon:'🚦',name:'Traffic Signals',v:'🚗 Car',col:'#e74c3c',gr:'linear-gradient(135deg,#c0392b,#e74c3c)',tg:'Master Junction Management',ds:'Navigate intersection signal arrays correctly. Absolute stop lines apply.',
 hps:['Red configuration: Absolute stop priority.','Yellow indicator: Safely decelerate.','Green signal: Safely cross intersection bounds.'],
 law:{sec:'Section 119, Motor Vehicles Act 1988',fine:'₹500',off:'Jumping automated signals'},
 theory:'Automated signal synchronization patterns direct city flow constraints efficiently.',
 pract:'Obey 5 junction signal boundaries. Crossings are tracked via integrated radar sensors.',
 quiz:[{q:'What does an active yellow configuration mandate?',o:['Accelerate before red transition','Safely decelerate and prepare to stop','Activate horn arrays'],a:1},{q:'What is the fine for crossing a red intersection threshold?',o:['₹100','₹500','₹2,000'],a:1},{q:'Which framework dictates signal compliance?',o:['Section 119, MV Act','Section 177, MV Act','Municipal Act'],a:0}],
 mode:'signals'},
{id:2,icon:'🦓',name:'Zebra Crossings',v:'🚶 Pedestrian',col:'#27ae60',gr:'linear-gradient(135deg,#1e8449,#27ae60)',tg:'Pedestrian Right-of-Way',ds:'Manage street crossings. Yield cleanly to active crosswalk users.',
 hps:['Zebra lanes give absolute pedestrian right of way.','Always yield when pedestrians step off the curb bounds.'],
 law:{sec:'Section 140, Motor Vehicles Act 1988',fine:'₹100',off:'Failure to yield at crosswalk markings'},
 theory:'Pedestrian safety grids reduce vehicle conflict metrics inside highly dense urban zones.',
 pract:'Navigate urban blocks and halt safely before pedestrian crosswalk markings.',
 quiz:[{q:'Who holds absolute priority at designated zebra lanes?',o:['Heavy commercial transport','Pedestrians','Two-wheelers'],a:1}],
 mode:'pedestrian'},
{id:3,icon:'⛑️',name:'Helmet Security',v:'🏍️ Two-Wheeler',col:'#f39c12',gr:'linear-gradient(135deg,#d68910,#f39c12)',tg:'Protective Safety Gear',ds:'Secure BIS certified protective gear before igniting two-wheeler engine loops.',
 hps:['ISI-marked certified safety helmet is mandatory for all occupants.','Chin straps must be anchored tight.'],
 law:{sec:'Section 194D, Motor Vehicles Act 1988',fine:'₹1,000',off:'Operating two-wheeler without protective headgear'},
 theory:'Fastened safety headgear mitigates impact severity metrics significantly.',
 pract:'Collect protective safety gear from the route before driving to the exit nodes.',
 quiz:[{q:'What is the legal mandate for two-wheeler passengers?',o:['Helmets are optional for pillions','Both rider and pillion must secure safety helmets','Only rider requires gear'],a:1}],
 mode:'helmet'},
{id:4,icon:'🪢',name:'Seat Belt Challenge',v:'🚗 Car',col:'#2980b9',gr:'linear-gradient(135deg,#1f618d,#2980b9)',tg:'Cabin Restraint Systems',ds:'Complete cabin validation routines prior to shifting transmission nodes.',
 hps:['Cabin restraint systems are mandatory for all seating positions.','Buckle logic must engage before vehicle goes into drive.'],
 law:{sec:'Section 194B, Motor Vehicles Act 1988',fine:'₹1,000',off:'Operating motor vehicle without cabin restraint engaged'},
 theory:'Restraint systems prevent structural collision trajectory deviations during deceleration events.',
 pract:'Execute pre-drive loop verification sequence: Mirror alignment -> Restraint engagement -> Shift to Drive.',
 quiz:[{q:'When must cabin restraint arrays be locked?',o:['After reaching highway speeds','Prior to shifting out of park/neutral nodes','Only when encountering police details'],a:1}],
 mode:'seatbelt'},
{id:5,icon:'🚌',name:'School Bus Safety',v:'🚌 BEST Bus',col:'#d4ac0d',gr:'linear-gradient(135deg,#b7950b,#d4ac0d)',tg:'School Zone Containment',ds:'Operate multi-passenger transit units inside restricted school facility boundaries.',
 hps:['School perimeter maximum threshold is strictly set at 30 km/h.','Deploy caution light arrays while embarking passengers.'],
 law:{sec:'Section 112, Motor Vehicles Act 1988',fine:'₹2,000',off:'Exceeding velocity thresholds inside school perimeters'},
 theory:'School speed zones protect variable pedestrian trajectories from collision energy transfers.',
 pract:'Transport transit units along the designated perimeter lane, avoiding speed violations.',
 quiz:[{q:'What is the maximum velocity rule inside designated school perimeters?',o:['50 km/h','30 km/h','No special restriction'],a:1}],
 mode:'bus'},
{id:6,icon:'🚂',name:'Railway Crossing',v:'🚗 Car',col:'#8e44ad',gr:'linear-gradient(135deg,#6c3483,#8e44ad)',tg:'Grade Separation Intersections',ds:'Halt safely at rail infrastructure interfaces. Wait for heavy rail units to clear.',
 hps:['Halt completely behind gate limits when warning lights activate.','Switch transmission to neutral while idling.'],
 law:{sec:'Section 131, Motor Vehicles Act 1988',fine:'₹1,000',off:'Bypassing active railway crossing safety barriers'},
 theory:'Heavy rail rolling stock components require extended deceleration paths; absolute vehicle yield is required.',
 pract:'Approach active track corridors, shift transmission to neutral, and wait for transit clearance.',
 quiz:[{q:'What action is mandated when crossing gates begin alignment down?',o:['Accelerate to beat the gate bounds','Halt completely behind the designated stop line','Weave through tracking barriers'],a:1}],
 mode:'railway'},
{id:7,icon:'📱',name:'Device Distractions',v:'🚗 Car',col:'#c0392b',gr:'linear-gradient(135deg,#922b21,#c0392b)',tg:'Attentional Focus Controls',ds:'Suppress cellular communications data alerts while vehicle velocity tracking is live.',
 hps:['Handheld operations are fully illegal during target navigation.','Pull off-road to safe parking zones before answering communications data.'],
 law:{sec:'Section 184, Motor Vehicles Act 1988',fine:'₹1,000',off:'Operating motor vehicle while using handheld communication arrays'},
 theory:'Attentional load shifting to mobile devices degrades real-time visual tracking reaction matrices.',
 pract:'Maintain straight route stability along Marine Drive while filtering out communication notifications.',
 quiz:[{q:'When is mobile interface usage legally permissible for the operator?',o:['While stationary at active red signals','Only when completely pulled over and safely parked out of traffic','When utilizing lower gear ratios'],a:1}],
 mode:'phone'},
{id:8,icon:'🚑',name:'Emergency Vehicles',v:'🚗 Car',col:'#c0392b',gr:'linear-gradient(135deg,#922b21,#e74c3c)',tg:'Emergency Lane Yields',ds:'Provide immediate passage lanes to active life-saving transit modules.',
 hps:['Yield left immediately upon receiving audible siren alerts.','Do not follow emergency transit within close spacing vectors.'],
 law:{sec:'Section 194E, Motor Vehicles Act 1988',fine:'₹10,000',off:'Obstruction of designated emergency responders'},
 theory:'Unobstructed transport vectors significantly minimize destination arrival time variables for trauma units.',
 pract:'Detect oncoming rear emergency warnings, execute immediate lane changes to the left, and halt safely.',
 quiz:[{q:'What is the regulatory penalty for blocking active emergency responses?',o:['₹500','₹2,000','An official e-challan of ₹10,000'],a:2}],
 mode:'emergency'},
{id:9,icon:'🌧️',name:'Monsoon Traction',v:'🚗 Car',col:'#2471a3',gr:'linear-gradient(135deg,#1a5276,#2471a3)',tg:'Adverse Friction Adaptations',ds:'Manage safety vectors along low-friction monsoon street networks.',
 hps:['Reduce base speed metrics by 50% on moisture-heavy roads.','Avoid deep water pooling indices to mitigate hydroplaning risks.'],
 law:{sec:'Section 184, Motor Vehicles Act 1988',fine:'₹1,500',off:'Reckless operation under extreme atmospheric visibility constraints'},
 theory:'Fluid layer buildup disrupts physical contact patches between tire threads and asphalt surfaces.',
 pract:'Navigate surface pooling hazards and slick turning arcs safely without dropping stability indexes.',
 quiz:[{q:'What hazard occurs when tire component matrices lose contact with asphalt due to water pooling?',o:['Tailgating','Hydroplaning','Vapor locking'],a:1}],
 mode:'rain'},
{id:10,icon:'🛺️',name:'Lane Discipline',v:'🛺 Auto Rickshaw',col:'#d68910',gr:'linear-gradient(135deg,#9a6b0a,#d68910)',tg:'Spatial Lane Allocation',ds:'Maintain localized structural positioning inside designated highway markers.',
 hps:['Slower commercial transport units must stay positioned inside the leftmost lane limits.','Overtake only using rightward lane parameters.'],
 law:{sec:'Section 112, Motor Vehicles Act 1988',fine:'1,000',off:'Improper lane utilization / erratic lane weaving patterns'},
 theory:'Predictable trajectory mapping reduces lateral collision vectors across heavy high-speed networks.',
 pract:'Guide an auto-rickshaw unit exclusively along the left corridor boundary across 5 checkpoints.',
 quiz:[{q:'Which lane is legally designated for slower transport units?',o:['The rightmost fast track','The leftmost slow track lane','Any arbitrary line marker'],a:1}],
 mode:'lane'},
{id:11,icon:'🪢',name:'Silent Perimeters',v:'🚗 Car',col:'#148f77',gr:'linear-gradient(135deg,#0e6655,#148f77)',tg:'Acoustic Noise Containment',ds:'Suppress acoustic warning arrays entirely while driving inside healthcare or school parameters.',
 hps:['Audible horn arrays are restricted within 100 meters of hospital gates.','Utilize light flashing indicators for nighttime visibility cues.'],
 law:{sec:'Section 190(2), Motor Vehicles Act 1988',fine:'₹2,000',off:'Acoustic signature violations inside silent zones'},
 theory:'High decibel emissions elevate physiological stress profiles within patient recovery spaces.',
 pract:'Drive carefully past medical structures with structural horn relays completely deactivated.',
 quiz:[{q:'What spatial radius defines silent parameters around institutional facilities?',o:['20 meters','100 meters','500 meters'],a:1}],
 mode:'silentzone'},
{id:12,icon:'⚖️',name:'Overloading Risks',v:'🏍️ Two-Wheeler',col:'#c0392b',gr:'linear-gradient(135deg,#922b21,#c0392b)',tg:'Payload Threshold Boundaries',ds:'Enforce passenger limit constraints onto two-wheeler asset links strictly.',
 hps:['Payload constraints allow maximum 2 occupants per unit.','Excess loading severely limits target braking and deceleration performance metrics.'],
 law:{sec:'Section 128, Motor Vehicles Act 1988',fine:'₹1,000',off:'Triple riding or exceeding payload index on two-wheelers'},
 theory:'Excess mass distributions alter the center of gravity coordinates, causing rolling stability failures.',
 pract:'Filter and deny illegal passenger addition requests on your two-wheeler array.',
 quiz:[{q:'How does payload overloading modify braking performance dimensions?',o:['Improves stopping distance variables','Significantly prolongs structural deceleration distance requirements','Has no computational effect'],a:1}],
 mode:'overload'},
{id:13,icon:'🪢',name:'Sober Inspection',v:'🚗 Car',col:'#7d3c98',gr:'linear-gradient(135deg,#5b2c6f,#7d3c98)',tg:'Chemical Testing Compliance',ds:'Interface with automated law details at roadside evaluation checkpoints.',
 hps:['Legal threshold limit for blood-alcohol content is capped at 0.03%.','PUC verification emissions data must undergo updates every 180 days.'],
 law:{sec:'Section 185, Motor Vehicles Act 1988',fine:'₹10,000',off:'Driving under influence of psychoactive chemicals'},
 theory:'Chemical tracking shows neural processing speed dropping by 30%, which extends stopping distance rules.',
 pract:'Submit configuration documents cleanly at unexpected inspection block checkpoints.',
 quiz:[{q:'What is the highest legal blood alcohol threshold limit in India?',o:['0.08%','0.03% (30mg per 100ml blood)','0.05%'],a:1}],
 mode:'checkpoint'},
{id:14,icon:'🌉',name:'Highway Corridors',v:'🚗 Car',col:'#34495e',gr:'linear-gradient(135deg,#1c2833,#34495e)',tg:'Velocity Band Navigation',ds:'Maintain speed rules within structured minimum and maximum limits on major bridges.',
 hps:['Bandra-Worli Sea Link constraints mandate velocity tracking between 40 km/h and 80 km/h.','Deploy higher transmission ratios to stabilize power efficiency maps.'],
 law:{sec:'Section 112, Motor Vehicles Act 1988',fine:'₹2,000',off:'Velocity band non-compliance on arterial freeways'},
 theory:'Velocity boundaries avoid traffic accumulation waves and catastrophic impact energy profiles.',
 pract:'Drive high-speed lanes using advanced overdrive gear loops cleanly within the specified tracking band.',
 quiz:[{q:'What velocity band must be sustained on the Sea Link freeway infrastructure?',o:['20 to 50 km/h','40 to 80 km/h','Unlimited velocity access'],a:1}],
 mode:'highway'},
{id:15,icon:'🏆',name:'Final Evaluation',v:'🚗 All Vehicles',col:'#ff6b35',gr:'linear-gradient(135deg,#ff6b35,#ffd54a)',tg:'System Integration Exam',ds:'Demonstrate perfect compliance profiles across all integrated scenario models concurrently.',
 hps:['All automated monitoring arrays are fully initialized simultaneously.','Perfect routing tracking is required across high-density mixed traffic patterns.'],
 law:{sec:'All MV Act Sections Apply Simultaneously',fine:'Variable',off:'Any compliance boundary exception failure'},
 theory:'The synthesis of tactical perception and strategic tracking defines safe operations metrics inside dense urban grids.',
 pract:'Navigate the final integrated city-block framework flawlessly without a single compliance exception error.',
 quiz:[{q:'A driver tracking high safety metrics does ALL EXCEPT:',o:['Maintains lane allocations safely','Accelerates abruptly through active yellow junction limits','Yields cleanly to active sirens'],a:1}],
 mode:'final'}
];

const BADGES=[
 {id:'safe_walker',name:'Safe Walker Badge',icon:'🪢',desc:'Crossed all roads safely as a pedestrian'},
 {id:'law_abider',name:'Law Abider Badge',icon:'⚖️',desc:'Passed all checkpoint inspections cleanly'},
 {id:'speed_king',name:'Speed King Badge',icon:'💥',desc:'Completed Sea Link with zero speed violations'},
 {id:'traffic_hero',name:'Traffic Hero Badge',icon:'🏆',desc:'Completed all 15 levels of the Academy'},
 {id:'smart_citizen',name:'Mumbai Smart Citizen',icon:'🏆"️',desc:'Earned the Traffic Hero badge — A true road hero'},
 {id:'signal_master',name:'Signal Master',icon:'🏅',desc:'Completed 5+ levels without a single red-light violation'}
];

// ══════════════════════════════════════════════════════ STATE MANAGEMENT ══════════════════════════════════════════════════════
let S={comp:{},badges:[],total:0,wallet:10000,name:'Traffic Hero'};
try{const s=localStorage.getItem('mth4');if(s){S=Object.assign(S,JSON.parse(s)); if(typeof S.wallet==='undefined')S.wallet=10000;}}catch(e){}
const save=()=>{try{localStorage.setItem('mth4',JSON.stringify(S));}catch(e){}};

// ══════════════════════════════════════════════════════ UTILS ══════════════════════════════════════════════════════
let _tt=null;
function toast(msg,col='#ffd54a'){const t=document.getElementById('toast'),ti=document.getElementById('ti');ti.textContent=msg;ti.style.background=col;t.classList.add('on');clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('on'),2500);}
const mob=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// ══════════════════════════════════════════════════════ SOUND FX ══════════════════════════════════════════════════════
const sfx={_c:null,init(){if(this._c)return;try{this._c=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}},
 play(t){if(!this._c)return;const p={horn:{f:440,ty:'square',d:.18,v:.12},brake:{f:160,ty:'sawtooth',d:.15,v:.08},challan:{f:880,ty:'triangle',d:.32,v:.11},ok:{f:660,ty:'sine',d:.22,v:.09},error:{f:110,ty:'square',d:.28,v:.1}};const pp=p[t]||p.horn;
 try{const o=this._c.createOscillator(),g=this._c.createGain();o.connect(g);g.connect(this._c.destination);o.type=pp.ty;o.frequency.setValueAtTime(pp.f,this._c.currentTime);g.gain.setValueAtTime(pp.v,this._c.currentTime);g.gain.exponentialRampToValueAtTime(.001,this._c.currentTime+pp.d);o.start();o.stop(this._c.currentTime+pp.d);}catch(e){}}
};

// ══════════════════════════════════════════════════════ UI INTERACTION LOGIC LAYER ══════════════════════════════════════════════════════
const ui={
showProfile() {
    const dlg = document.getElementById('profile-dlg');
    if(!dlg) return;
    document.getElementById('prof-name').value = S.name || '';
    document.getElementById('prof-veh').value = S.vehicle || 'Car';
    dlg.style.display = 'flex';
},
saveProfile() {
    const n = document.getElementById('prof-name').value.trim();
    const v = document.getElementById('prof-veh').value;
    if(n.length > 0 && n.length < 3) { toast('Please enter a valid name', '#ff3b30'); return; }
    S.name = n;
    S.vehicle = v;
    save();
    document.getElementById('profile-dlg').style.display = 'none';
    toast('Profile Saved!', '#00c851');
    const cnameEl = document.getElementById('cname');
    if(cnameEl) { cnameEl.innerText = S.name || 'DRIVER'; }
},
cur:null,qst:null,cq:[],cbusy:false,_ccb:null,
 adminUnlock(){LVS.forEach(l=>{if(!S.comp[l.id])S.comp[l.id]={score:500,time:Date.now()}});BADGES.forEach(b=>{if(!S.badges.includes(b.id))S.badges.push(b.id)});S.total+=7500;save();toast('🔓 Developer Unlock Triggered!','#00c851');this.showLevels();},
 hardReset(){if(confirm('Reset all progress?')){S.comp={};S.badges=[];S.total=0;save();toast('🔄 Progress Reset!','#ff3b30');this.showStart();}},
 show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));if(id)document.getElementById(id).classList.add('active');},
 showStart(){this.show('ss');this._rain();if(!S.name||S.name==='Traffic Hero'){setTimeout(()=>this.showNameDlg(),1000);}},
 showNameDlg(){document.getElementById('name-dlg').classList.add('on');setTimeout(()=>{const i=document.getElementById('name-input');if(i)i.focus();},200);},
 saveName(){const v=document.getElementById('name-input').value.trim();if(v){S.name=v;save();toast('✓ Profile Saved!','#00c851');}document.getElementById('name-dlg').classList.remove('on');},
 _rain(){const r=document.getElementById('rl');if(r&&!r._b){r._b=1;for(let i=0;i<30;i++){const d=document.createElement('div');d.className='rd';d.style.left=Math.random()*100+'%';d.style.height=(50+Math.random()*50)+'px';d.style.animationDuration=('.6'+Math.random()*.5)+'s';r.appendChild(d);}}},
 showLevels(){this.show('screen-levels');this._bldLvs();},
 _bldLvs(){
   const body=document.getElementById('lvbody');body.innerHTML='';
   const done=Object.keys(S.comp).length;document.getElementById('pchip').textContent=done+'/15 ✓';
   const secs=[{t:'❖ Beginner Modules',ids:[1,2,3,4]},{t:'❖ Intermediate Corridors',ids:[5,6,7,8,9]},{t:'❖ Advanced Systems',ids:[10,11,12,13]},{t:'❖ Expert Gauntlets',ids:[14,15]}];
   secs.forEach(sec=>{
     const sh=document.createElement('div');sh.className='sec-hdr';sh.textContent=sec.t;body.appendChild(sh);
     const tr=document.createElement('div');tr.className='lv-track';
     sec.ids.forEach(id=>{
       const lv=LVS.find(l=>l.id===id),idx=LVS.indexOf(lv);
       const un=idx===0||S.comp[LVS[idx-1].id];const cm=!!S.comp[lv.id];const ip=!cm&&idx>0&&S.comp[LVS[idx-1].id];
       const c=document.createElement('div');c.className='lcard'+(cm?' done':'')+(un?'':' lk');
       c.innerHTML=`<div class="lbar" style="background:${lv.gr}"></div>
        <div class="lct"><div class="lico" style="background:${lv.gr}">${un?lv.icon:'🔒'}</div><div class="lst ${cm?'sdk':ip?'sip':'sns'}">${cm?'✓ Done':ip?'▶️ Start':'🔒 Locked'}</div></div>
        <div class="lnum">Module ${lv.id}</div><div class="lnm">${lv.name}</div><div class="ltg">${lv.tg}</div>
        <div class="lmt"><span class="lvc">${lv.v}</span><span class="lfi">${lv.law.fine}</span></div>`;
       if(un){c.onclick=()=>this.showBriefing(lv.id);}
       tr.appendChild(c);
     });body.appendChild(tr);
   });
 },
 showBriefing(lid){
   const lv=LVS.find(l=>l.id===lid);this.cur=lv;
   document.getElementById('blt').textContent='Level '+lv.id;document.getElementById('bvh').textContent=lv.v;
   const items=[
     {id:'intro',icon:'🎮',label:'Introduction',sub:'Course overview'},
     ...lv.hps.map((hp,i)=>({id:'rule'+i,icon:'📜',label:'Rule '+(i+1),sub:hp.split(':')[0].substring(0,24)})),
     {id:'law',icon:'⚖️',label:'Framework',sub:'Penal provisions'},
     {id:'theory',icon:'🧠',label:'Concepts',sub:'Analytical metrics'},
     {id:'practical',icon:'🎮',label:'Execution',sub:'Simulation profile'}
   ];
   this._sylItems=items;this._sylViewed=new Set();this._sylLv=lv;
   const list=document.getElementById('br-syllabus');list.innerHTML='';
   items.forEach(it=>{
     const el=document.createElement('div');el.className='syl-item';el.id='syl-'+it.id;
     el.innerHTML=`<div class="syl-ck" id="sylck-${it.id}"></div><div class="syl-info"><div class="syl-lbl">${it.icon} ${it.label}</div><div class="syl-sub">${it.sub}</div></div>`;
     el.onclick=()=>this._selSyl(it.id);list.appendChild(el);
   });
   this._selSyl('intro');this.show('screen-briefing');
 },
 _selSyl(id){
   const lv=this._sylLv,items=this._sylItems;
   document.querySelectorAll('.syl-item').forEach(el=>el.classList.remove('syl-active'));
   const el=document.getElementById('syl-'+id);if(el)el.classList.add('syl-active');
   if(!this._sylViewed.has(id)){
     this._sylViewed.add(id);
     const sylEl=document.getElementById('syl-'+id);if(sylEl)sylEl.classList.add('syl-done');
     const pct=Math.round(this._sylViewed.size/items.length*100);
     document.getElementById('br-prog-fill').style.width=pct+'%';document.getElementById('br-prog-label').textContent=pct+'%';
   }
   const c=document.getElementById('br-content');c.innerHTML='';
   const card=document.createElement('div');card.className='bc-card';
   if(id==='intro'){
     card.innerHTML=`<div class="bc-ttl">🎮 Module Overview</div>
     <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(1.6rem, 4vw, 2.5rem);color:var(--yellow);margin-bottom:8px">${lv.name}</div>
     <div style="font-size:clamp(0.95rem, 2vw, 1.35rem);color:var(--muted2);line-height:1.5;margin-bottom:16px">${lv.ds}</div>
     <div class="stat-row">
       <div class="stat-box"><div class="stat-val">${lv.hps.length}</div><div class="stat-lbl">Mandates</div></div>
       <div class="stat-box"><div class="stat-val">${lv.law.fine}</div><div class="stat-lbl">Penalty</div></div>
     </div>`;
   } else if(id.startsWith('rule')){
     const idx=parseInt(id.replace('rule',''));const hp=lv.hps[idx];
     card.innerHTML=`<div class="bc-ttl">📜 Regulatory Requirement</div><div class="bc-rule-pill">Clause ${idx+1}</div><div class="bc-rule-txt">${hp}</div>
     ${idx<lv.hps.length-1?`<div class="bc-next-btn"><button onclick="ui._selSyl('rule${idx+1}')">Next Clause →</button></div>`:`<div class="bc-next-btn"><button onclick="ui._selSyl('law')">Legal Framework →</button></div>`}`;
   } else if(id==='law'){
     card.innerHTML=`<div class="bc-ttl">⚖️ Statutory Provisions</div><div class="lb"><div class="ls">${lv.law.sec}</div><div class="lt">${lv.law.off}</div></div><div class="fr"><div class="fl">Fine Amount</div><div class="fa">${lv.law.fine}</div></div>
     <div class="bc-next-btn"><button onclick="ui._selSyl('theory')">Analytical Context →</button></div>`;
   } else if(id==='theory'){
     card.innerHTML=`<div class="bc-ttl">🧠 Analytical Model</div><div class="dw">${this._diag(lv.id)}</div><div style="font-size:clamp(0.95rem, 2.2vw, 1.3rem);line-height:1.6;color:var(--muted2);margin-bottom:12px">${lv.theory}</div>
     <div class="bc-next-btn"><button onclick="ui._selSyl('practical')">Simulation Config →</button></div>`;
   } else if(id==='practical'){
      card.innerHTML=`<div class="bc-ttl">🎮 Practical Mission</div>
      <div class="pract-banner" style="background:${lv.gr};height:auto;flex-direction:row;justify-content:space-between;padding:clamp(16px, 3vw, 24px);text-align:left;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:clamp(12px, 3vw, 24px);flex:1;min-width:280px">
          <div class="pract-icon-big">${lv.icon}</div>
          <div class="pract-veh-tag" style="background:transparent;padding:0;border-radius:0">
            <div class="pv1" style="font-size:clamp(1.1rem, 2.5vw, 1.6rem);letter-spacing:0.05em">${lv.name}</div>
            <div class="pv2" style="font-size:clamp(0.9rem, 2vw, 1.2rem);color:rgba(255,255,255,.8)">${lv.v}</div>
            <div style="font-size:clamp(0.9rem, 1.8vw, 1.25rem);color:rgba(255,255,255,0.95);margin-top:10px;line-height:1.5;border-top:1px solid rgba(255,255,255,0.3);padding-top:10px">${lv.pract}</div>
          </div>
        </div>
        <div style="text-align:right;background:rgba(0,0,0,.25);padding:14px 20px;border-radius:12px;border:1px solid rgba(255,255,255,.15);display:flex;flex-direction:column;justify-content:center;margin-top:8px">
          <div style="font-size:clamp(0.75rem, 1.6vw, 0.95rem);color:rgba(255,255,255,0.75);text-transform:uppercase;font-weight:800;letter-spacing:0.05em">Penalty</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem, 4vw, 3rem);color:#fff;line-height:1">${lv.law.fine}</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:24px">
        <button class="btn btn-p" onclick="game.startLevel()" style="font-size:clamp(1.1rem, 2.5vw, 1.5rem);padding:clamp(14px, 3vw, 20px) clamp(40px, 6vw, 60px)">▶️ Start Driving</button>
      </div>`;
   }
   c.appendChild(card);
 },
 _diag(id){
   const lv=LVS.find(l=>l.id===id);if(!lv)return'';
   return `<div style="background:${lv.gr};border-radius:14px;padding:clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 30px);margin-bottom:16px;display:flex;align-items:center;gap:clamp(12px, 3vw, 24px)">
     <div style="font-size:clamp(2.5rem, 5vw, 4.5rem)">${lv.icon}</div>
     <div>
       <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(1.2rem, 2.5vw, 2rem);color:#fff;letter-spacing:.05em">${lv.name}</div>
       <div style="font-size:clamp(0.8rem, 1.5vw, 1.1rem);color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.08em">${lv.v} · Fine: ${lv.law.fine}</div>
     </div></div>`;
 },
 showQuiz(){this.qst={qs:this.cur.quiz,cur:0,pass:0};this._rq();this.show('screen-quiz');},
 _rq(){
   const s=this.qst,q=s.qs[s.cur];
   document.getElementById('qd').innerHTML=s.qs.map((_,i)=>`<div class="qdt ${i<s.cur?'dn':i===s.cur?'cu':''}"></div>`).join('');
   document.getElementById('qa').innerHTML=`<div class="qcard"><div class="qq"><span>Q${s.cur+1}</span>${q.q}</div><div class="qopts">${q.o.map((o,i)=>`<button class="qo" onclick="ui._aq(${i})">${o}</button>`).join('')}</div><div class="qfb" id="qfb"></div></div>`;
   document.getElementById('qnxt').style.display='none';
 },
 _aq(idx){
   const s=this.qst,q=s.qs[s.cur];document.querySelectorAll('.qo').forEach(o=>o.disabled=true);
   document.querySelectorAll('.qo')[idx].classList.add(idx===q.a?'ok':'no');
   if(idx!==q.a)document.querySelectorAll('.qo')[q.a].classList.add('rv');
   const fb=document.getElementById('qfb');
   if(idx===q.a){fb.textContent='✓ Correct!';fb.className='qfb ok';s.pass++;sfx.play('ok');}
   else{fb.textContent=`❌ Incorrect. Correct: "${q.o[q.a]}"`;fb.className='qfb no';sfx.play('error');}
   const nb=document.getElementById('qnxt');nb.style.display='inline-block';nb.textContent=s.cur<s.qs.length-1?'Next →':'See Results →';
 },
 nextQ(){const s=this.qst;s.cur++;if(s.cur<s.qs.length)this._rq();else this._fq();},
 _fq(){const s=this.qst;if(s.pass<s.qs.length){toast(`❌ ${s.pass}/${s.qs.length} correct — retry!`,'#ff3b30');setTimeout(()=>this.showQuiz(),900);return;}this.showResults(game.fs,game.fst);},
 showResults(score,stats){
   const lv=this.cur,prev=S.comp[lv.id]?.score||0;
   S.comp[lv.id]={score:Math.max(score,prev),time:Date.now()};S.total+=score;save();
   let be=null;
   if(lv.badge&&!S.badges.includes(lv.badge.id)){S.badges.push(lv.badge.id);be=lv.badge;}
   if(!S.badges.includes('signal_master')&&Object.keys(S.comp).length>=5&&!stats.vio)S.badges.push('signal_master');
   if(S.badges.includes('traffic_hero')&&!S.badges.includes('smart_citizen'))S.badges.push('smart_citizen');
   save();
   document.getElementById('rico').textContent=score>200?'🏆':'💩';
   document.getElementById('rtit').textContent='Level Complete!';
   document.getElementById('rsub').textContent=lv.name+' — Well done!';
   document.getElementById('rcard').innerHTML=`<div class="rr"><span class="rl">Score</span><span class="rv">⭐ ${Math.round(score)}</span></div><div class="rr"><span class="rl">Quiz</span><span class="rv">✓ Passed</span></div>${stats.fin?`<div class="rr"><span class="rl">Fines issued</span><span class="rv" style="color:var(--red)">${stats.fin}</span></div>`:''}<div class="rr"><span class="rl">Violations</span><span class="rv" style="color:${stats.vio?'var(--red)':'var(--green)'}">${stats.vio||'None ✓'}</span></div><div class="rr"><span class="rl">Level</span><span class="rv">${lv.id} / 15</span></div>`;
   const bb=document.getElementById('rbdg');
   if(be){bb.className='bdx on';bb.innerHTML=`<div class="bi">${be.icon}</div><div class="bn">🏅 ${be.name}</div><div class="bd">${be.desc}</div>`;}else bb.className='bdx';
   document.getElementById('rnxt').style.display=LVS.find(l=>l.id===lv.id+1)?'inline-block':'none';
   this.show('screen-results');sfx.play('ok');
 },
 goNext(){const n=LVS.find(l=>l.id===this.cur.id+1);if(n)this.showBriefing(n.id);},
 showBadges(){
   const g=document.getElementById('bgrid');g.innerHTML='';
   BADGES.forEach(b=>{const e=S.badges.includes(b.id);const c=document.createElement('div');c.className='bcard '+(e?'ea':'lk');c.innerHTML=`<div class="bgi">${e?b.icon:'🔒'}</div><div class="bgn">${b.name}</div><div class="bgd">${e?b.desc:'Complete related levels to unlock'}</div>`;g.appendChild(c);});
   const sb=document.getElementById('stats-body');
   if(sb){const done=Object.keys(S.comp).length;const pct=Math.round(done/15*100);
   sb.innerHTML=`<div style="display:flex;justify-content:space-between"><span>Levels completed</span><strong style="color:var(--yellow)">${done}/15</strong></div>
   <div style="display:flex;justify-content:space-between"><span>Completion</span><strong style="color:var(--yellow)">${pct}%</strong></div>
   <div style="display:flex;justify-content:space-between"><span>Total score</span><strong style="color:var(--green)">⭐ ${S.total}</strong></div>
   <div style="display:flex;justify-content:space-between"><span>Player name</span><strong style="color:var(--text)">${S.name||'—'}</strong></div>`;}
   this.show('screen-badges');
 },
 showCert(){
   const nm=S.name&&S.name!=='Traffic Hero'?S.name.toUpperCase():'TRAFFIC HERO';
   document.getElementById('cname').textContent=nm;
   document.getElementById('cdate').textContent=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
   const cs=document.getElementById('cscore');if(cs)cs.textContent='⭐ '+S.total;
   const certNum='MTP/MTHA/'+new Date().getFullYear()+'/'+(Math.random()*900000+100000|0);
   const cn=document.getElementById('cert-num');if(cn)cn.textContent=certNum;
   const done=Object.keys(S.comp).length;
   const cstat=document.getElementById('cstat');
   if(done<15){
     if(cstat)cstat.innerHTML="⚠️ Preview Mode — Complete all 15 levels to unlock ("+done+"/15 done)";
     document.getElementById('cdownload').style.display='none';
   }else{
     if(cstat)cstat.innerHTML='';
     document.getElementById('cdownload').style.display='block';
   }
   this.show('screen-certificate');
 },
  dlCert(){
    const element = document.getElementById('cert');
    
    const opt = {
      margin:       0,
      filename:     'MTHA_Certificate_' + (S.name||'Hero').replace(/\s+/g,'_') + '.pdf',
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        onclone: (doc) => {
          const c = doc.getElementById('cert');
          if(c) {
            c.style.width = '1056px';
            c.style.height = '816px';
            c.style.maxWidth = 'none';
            c.style.transform = 'none';
            c.style.margin = '0';
          }
        }
      },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    
    toast('Generating PDF...', '#ffd54a');
    html2pdf().set(opt).from(element).save().then(()=> {
      toast('📱 Certificate downloaded!', '#00c851');
    }).catch(err => {
      console.error(err);
      toast('❌ PDF Error!', '#ff3b30');
    });
  },
 issueChallan(off,sec,amt,loc,cb){this.cq.push({off,sec,amt,loc,cb});if(!this.cbusy)this._nc();},
 _nc(){if(!this.cq.length){this.cbusy=false;return;}this.cbusy=true;const c=this.cq.shift();
  const vf=document.getElementById('vflash');if(vf){vf.classList.remove('flash');void vf.offsetWidth;vf.classList.add('flash');}document.getElementById('cnum').textContent='MTP/2026/'+(Math.floor(Math.random()*90000)+10000);document.getElementById('coff').textContent=c.off;document.getElementById('claw').textContent=c.sec;document.getElementById('camt').textContent=c.amt;document.getElementById('cov').classList.add('on');this._ccb=c.cb||null;if(game.playing)game.pause=true;sfx.play('challan');},
 dismissChallan(){document.getElementById('cov').classList.remove('on');if(this._ccb){this._ccb();this._ccb=null;}if(game.playing)game.pause=false;setTimeout(()=>this._nc(),80);}
};

// ══════════════════════════════════════════════════════ PROCEDURAL ENGINE AND SCENARIO ARRAYS ══════════════════════════════════════════════════════
class Game {
 constructor(){
  this.renderer=null;this.scene=null;this.camera=null;this.player=null;
  this.clock=new THREE.Clock();this.keys={};this.speed=0;this.maxSpd=.9;this.accel=.022;
  this.fric=.93;this.turn=.032;this.gear='N';this.gcap=0;
  this.playing=false;this.pause=false;this.score=0;this.hp=100;this.fine=0;this.vio=0;this.timer=0;
  this.world=[];this.npcs=[];this.sigs=[];this.cps=[];this.driveRoute=[];this.routeIdx=0;
  this.chunks=new Map();this._camTarget=new THREE.Vector3();
  this._facadeTex=[];this._lastCX=null;this._lastCZ=null;
  this.challanFired=new Set();this.ms={inSz:false,passed:false,amb:null};
  this.rainSystem=null;this.mode='city';this.obstacles=[];
  this.GX=80;this.GZ=100;this.RW=14;this.CR=4;
  this._initR();this._initIn();this._initG();this._pregenTex();this._loop();
  window.addEventListener('resize',()=>this._rsz());
 }
 _initR(){
  const cv=document.getElementById('3c');
  this.renderer=new THREE.WebGLRenderer({canvas:cv,antialias:!mob()});
  this.renderer.setSize(innerWidth,innerHeight);
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,mob()?1.5:2));
  this.scene=new THREE.Scene();
  this.camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.5,500);
 }
 _rsz(){if(!this.renderer)return;this.renderer.setSize(innerWidth,innerHeight);if(this.camera){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}}
 _initIn(){
  window.addEventListener('keydown',e=>{this.keys[e.key.toLowerCase()]=true;const gm={p:'P',r:'R',n:'N',d:'D','1':'1','2':'2','3':'3','4':'4','5':'5'};if(gm[e.key.toLowerCase()])this.setGear(gm[e.key.toLowerCase()]);if(e.key===' ')this._horn();if(e.key.toLowerCase()==='b')this._brake();});
  window.addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);
  const sb=(id,k)=>{const el=document.getElementById(id);if(!el)return;
   const dn=e=>{e.preventDefault();this.keys[k]=true};const up=e=>{e.preventDefault();this.keys[k]=false};
   el.addEventListener('touchstart',dn,{passive:false});el.addEventListener('touchend',up,{passive:false});
   el.addEventListener('mousedown',dn);el.addEventListener('mouseup',up);el.addEventListener('mouseleave',up);};
  sb('tl','arrowleft');sb('tr','arrowright');sb('tu','arrowup');sb('abb','b');sb('abh',' ');
 }
 _initG(){document.querySelectorAll('.gb').forEach(b=>{b.addEventListener('click',()=>this.setGear(b.dataset.g));b.addEventListener('touchstart',e=>{e.preventDefault();this.setGear(b.dataset.g);},{passive:false});});}
 setGear(g){
  const caps={P:0,R:.28,N:0,D:.50,'1':.18,'2':.28,'3':.42,'4':.60,'5':.85};
  this.gear=g;this.gcap=caps[g]??0;
  if(g==='P'||g==='N')this.speed*=.1;
  else if(this.speed>0&&this.gcap<this.speed)this.speed=this.gcap*0.92;
  document.getElementById('gread').textContent='GEAR: '+g;
  document.querySelectorAll('.gb').forEach(b=>b.classList.toggle('ag',b.dataset.g===g));
 }
 _horn(){if(this.mode==='silentzone'&&this.ms.inSz){this.vio++;this.score-=50;this.fine+=2000;S.wallet-=2000;save();ui.issueChallan('Horn in silent zone','Sec 190(2) MV Act','\u20b9 2,000','Hospital Perimeter Zone');}else{toast('\ud83d\udce2 Beep Beep!','#ffd54a');sfx.play('horn');}}
 _brake(){this.speed*=.35;sfx.play('brake');toast('\ud83d\uded1 Hard Brake','#fff');}

 startLevel(){const cd=document.getElementById('cdown');cd.classList.add('on');setTimeout(()=>{cd.classList.remove('on');this._actualStart(ui.cur);},1500);}
 _actualStart(lv){
  this.mode=lv.mode;this.score=0;this.hp=100;this.fine=0;this.vio=0;this.timer=0;this.speed=0;this.routeIdx=0;
  this.ms={inSz:false,passed:false,amb:null};this.challanFired=new Set();
  this.setGear('N');this._buildScene(lv.mode);this.playing=true;this.pause=false;ui.show(null);
  ['gc','hud','hudbar','hwrap','spgauge','gp'].forEach(id=>document.getElementById(id).classList.add('on'));
  if(mob())document.getElementById('tc').classList.add('on');
  document.getElementById('hlv').textContent=lv.id;document.getElementById('hobj').textContent=lv.tg;this._uh();sfx.play('ok');
 }
 stopPlay(){this.playing=false;['gc','hud','hudbar','hwrap','spgauge','gp','tc'].forEach(i=>document.getElementById(i).classList.remove('on'));document.getElementById('mmc').classList.remove('on');document.getElementById('da').style.display='none';const si=document.getElementById('sig-ind');if(si)si.style.display='none';const ow=document.getElementById('ow');if(ow)ow.classList.remove('on');}
 _uh(){const p=Math.max(0,this.hp);const f=document.getElementById('hfill');if(f)f.style.width=p+'%';if(p<=0)this._go();}
 _go(){this.stopPlay();toast('\ud83d\udca5 Vehicle Destroyed!','#ff3b30');setTimeout(()=>{ui.showLevels();},1200);}
 completeLevel(){if(!this.playing)return;this.fs=Math.round(this.score+500);const reward=Math.floor(this.fs*0.1);S.wallet+=reward;this.fst={fin:this.fine?'\u20b9 '+this.fine:'',vio:this.vio};this.stopPlay();toast('\u2705 Level Complete! +\u20b9'+reward,'#00c851');setTimeout(()=>ui.showQuiz(),700);}

 // ===== TEXTURE PRE-GENERATION =====
 _pregenTex(){
  this._facadeTex=[];
  const walls=['#787878','#7d7168','#8a7e72','#6b7a8a','#888888','#908070','#655d55','#807868','#c8b888','#a09888','#8a8078','#686868'];
  const wins=[{l:'#fff4cc',d:'#1a2030'},{l:'#e8f0ff',d:'#151d2a'},{l:'#ffe8c0',d:'#1a1a28'},{l:'#d0e8ff',d:'#101828'}];
  for(let i=0;i<24;i++){
   const cv=document.createElement('canvas');cv.width=128;cv.height=256;
   const ctx=cv.getContext('2d');
   ctx.fillStyle=walls[i%walls.length];ctx.fillRect(0,0,128,256);
   const wc=wins[i%wins.length];
   for(let r=0;r<8;r++){
    ctx.fillStyle='rgba(0,0,0,0.12)';ctx.fillRect(0,r*32,128,1.5);
    for(let c=0;c<4;c++){
     if(Math.random()>.08){
      ctx.fillStyle=Math.random()>.4?wc.l:wc.d;
      ctx.fillRect(c*32+5,r*32+5,22,22);
      ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=0.8;
      ctx.strokeRect(c*32+5,r*32+5,22,22);
      ctx.beginPath();ctx.moveTo(c*32+16,r*32+5);ctx.lineTo(c*32+16,r*32+27);ctx.stroke();
     }
    }
   }
   const tex=new THREE.CanvasTexture(cv);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
   tex.minFilter=THREE.LinearMipmapLinearFilter;
   this._facadeTex.push(tex);
  }
 }

 // ===== SCENE BUILDING =====
 _buildScene(mode){
  while(this.scene&&this.scene.children.length)this.scene.remove(this.scene.children[0]);
  this.chunks.clear();this.npcs=[];this.sigs=[];this.cps=[];this.world=[];this.driveRoute=[];this.obstacles=[];
  this._lastCX=null;this._lastCZ=null;this.rainSystem=null;
  const isNight=mode==='night',isRain=mode==='rain',isHwy=mode==='highway';
  const sky=isNight?0x020510:(isRain?0x1a2a3a:(isHwy?0x4a90d9:0x6fa8d0));
  this.scene.background=new THREE.Color(sky);
  this.scene.fog=new THREE.Fog(sky,60,isRain?220:(isNight?200:350));
  this.scene.add(new THREE.AmbientLight(isNight?0x222233:0xffffff,isRain?0.5:(isNight?0.25:0.7)));
  if(!isNight){const sun=new THREE.DirectionalLight(0xfff8e8,0.8);sun.position.set(30,50,20);this.scene.add(sun);}
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000),new THREE.MeshPhongMaterial({color:isHwy?0x2a3520:0x3a3a3a}));
  gnd.rotation.x=-Math.PI/2;gnd.position.y=-0.05;this.scene.add(gnd);
  const G=this.GX,Z=this.GZ;
  this.driveRoute=[{x:3,z:80},{x:3,z:0},{x:G+3,z:0},{x:G+3,z:-Z},{x:3,z:-Z},{x:3,z:-Z*2},{x:-G+3,z:-Z*2},{x:-G+3,z:-Z*3}];
  this._updateChunks(0,100);
  this._pmesh(mode);
  this.driveRoute.forEach(pt=>this._cp(pt.x,pt.z));
  this._spawnNPCs(50,isNight);
  if(isRain)this._create3DRain();
  if(mode==='emergency'){
   this.ms.amb=this._makeVehicleGroup('ambulance',0xffffff);
   this.ms.amb.position.set(3,0,60);this.ms.amb.rotation.y=Math.PI;
   this.ms.amb.userData={spd:0.6,isAmb:true,dir:-1,isVert:true,lane:-this.RW/4};
   const fl=new THREE.PointLight(0xff0000,2,15);fl.position.y=2.5;this.ms.amb.add(fl);
   this.npcs.push(this.ms.amb);this.scene.add(this.ms.amb);
  }
 }

 // ===== CHUNK SYSTEM =====
 _updateChunks(px,pz){
  const G=this.GX,Z=this.GZ,R=this.CR;
  const pcx=Math.round(px/G),pcz=Math.round(pz/Z);
  if(pcx===this._lastCX&&pcz===this._lastCZ)return;
  this._lastCX=pcx;this._lastCZ=pcz;
  const needed=new Set();
  for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++)needed.add((pcx+dx)+','+(pcz+dz));
  for(const[key,chunk]of this.chunks){
   if(!needed.has(key)){
    chunk.meshes.forEach(m=>{this.scene.remove(m);if(m.geometry)m.geometry.dispose();if(m.material){if(Array.isArray(m.material))m.material.forEach(mt=>mt.dispose());else m.material.dispose();}});
    if(chunk.signal){this.scene.remove(chunk.signal);const si=this.sigs.indexOf(chunk.signal);if(si>-1)this.sigs.splice(si,1);}
    if(chunk.buildings&&chunk.buildings.length){const bs=new Set(chunk.buildings);this.world=this.world.filter(b=>!bs.has(b));}
    this.chunks.delete(key);
   }
  }
  for(const key of needed){
   if(!this.chunks.has(key)){const p=key.split(',');this._genChunk(+p[0],+p[1]);}
  }
 }

 _genChunk(cx,cz){
  const G=this.GX,Z=this.GZ,RW=this.RW;
  const meshes=[],buildings=[];
  const wx=cx*G,wz=cz*Z;
  const roadM=new THREE.MeshPhongMaterial({color:0x222222,shininess:this.mode==='rain'?35:5});
  const yelM=new THREE.MeshBasicMaterial({color:0xffcc00});
  const whtM=new THREE.MeshBasicMaterial({color:0xcccccc});
  const paveM=new THREE.MeshPhongMaterial({color:0x666666});

  // Vertical road at x=wx
  const vr=new THREE.Mesh(new THREE.PlaneGeometry(RW,Z+RW),roadM);
  vr.rotation.x=-Math.PI/2;vr.position.set(wx,0.01,wz+Z/2);this.scene.add(vr);meshes.push(vr);
  const vc=new THREE.Mesh(new THREE.PlaneGeometry(0.15,Z+RW),yelM);
  vc.rotation.x=-Math.PI/2;vc.position.set(wx,0.02,wz+Z/2);this.scene.add(vc);meshes.push(vc);
  for(const off of[-RW/4,RW/4]){
   const ll=new THREE.Mesh(new THREE.PlaneGeometry(0.1,Z+RW),whtM);
   ll.rotation.x=-Math.PI/2;ll.position.set(wx+off,0.02,wz+Z/2);this.scene.add(ll);meshes.push(ll);
  }

  // Horizontal road at z=wz
  const hr=new THREE.Mesh(new THREE.PlaneGeometry(G+RW,RW),roadM);
  hr.rotation.x=-Math.PI/2;hr.position.set(wx+G/2,0.015,wz);this.scene.add(hr);meshes.push(hr);
  const hc=new THREE.Mesh(new THREE.PlaneGeometry(G+RW,0.15),yelM);
  hc.rotation.x=-Math.PI/2;hc.position.set(wx+G/2,0.025,wz);this.scene.add(hc);meshes.push(hc);
  for(const off of[-RW/4,RW/4]){
   const ll=new THREE.Mesh(new THREE.PlaneGeometry(G+RW,0.1),whtM);
   ll.rotation.x=-Math.PI/2;ll.position.set(wx+G/2,0.025,wz+off);this.scene.add(ll);meshes.push(ll);
  }

  // Sidewalks along vertical road
  const swW=2.5;
  [-1,1].forEach(s=>{
   const sw=new THREE.Mesh(new THREE.BoxGeometry(swW,0.15,Z-RW),paveM);
   sw.position.set(wx+s*(RW/2+swW/2),0.08,wz+Z/2);this.scene.add(sw);meshes.push(sw);
  });

  // Buildings
  const bx1=wx+RW/2+swW+1,bz1=wz+RW/2+swW+1;
  const bx2=wx+G-RW/2-swW-1,bz2=wz+Z-RW/2-swW-1;
  const bW=bx2-bx1,bD=bz2-bz1;
  if(bW>8&&bD>8){
   const cols=bW>35?2:1,rows=bD>50?3:(bD>30?2:1);
   const cW=bW/cols,cD=bD/rows;
   for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
     const w=cW-1.5,d=cD-1.5,h=10+Math.random()*50;
     const bcx=bx1+c*cW+cW/2,bcz=bz1+r*cD+cD/2;
     const bm=this._mkBldg(bcx,bcz,w,d,h);
     meshes.push(...bm);buildings.push(...bm);
    }
   }
  }

  // Traffic signal (50% chance)
  let signal=null;
  if(Math.random()>0.5)signal=this._sig(wx+RW/2+1.5,wz+RW/2+1.5);

  // Night street lights
  if(this.mode==='night'){
   [-1,1].forEach(s=>{
    const pl=new THREE.PointLight(0xffd54a,0.6,50);
    pl.position.set(wx+s*(RW/2+1.5),8,wz+Z/2);this.scene.add(pl);meshes.push(pl);
   });
  }

  this.chunks.set(cx+','+cz,{meshes:meshes,buildings:buildings,signal:signal});
 }

 _mkBldg(x,z,w,d,h){
  const meshes=[];
  const ti=Math.floor(Math.random()*this._facadeTex.length);
  const mkWall=(fw,fh)=>{
   const t=this._facadeTex[ti].clone();
   t.repeat.set(Math.max(1,Math.round(fw/8)),Math.max(1,Math.round(fh/8)));
   t.needsUpdate=true;
   return new THREE.MeshPhongMaterial({map:t});
  };
  const xM=mkWall(d,h),zM=mkWall(w,h);
  const topM=new THREE.MeshPhongMaterial({color:0x3a3a3a});
  const botM=new THREE.MeshPhongMaterial({color:0x2a2a2a});
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[xM,xM,topM,botM,zM,zM]);
  b.position.set(x,h/2,z);this.scene.add(b);this.world.push(b);meshes.push(b);
  return meshes;
 }

 _isOnRoad(x,z){
  const G=this.GX,Z=this.GZ,RW=this.RW;
  const nv=Math.round(x/G)*G;if(Math.abs(x-nv)<RW/2)return true;
  const nh=Math.round(z/Z)*Z;if(Math.abs(z-nh)<RW/2)return true;
  return false;
 }

 // ===== PLAYER =====
 _pmesh(mode){
  const isAuto=S.vehicle==='Auto',isBike=S.vehicle==='Bike';
  this.player=this._makeVehicleGroup(isAuto?'auto':(isBike?'motorcycle':'car'),0xf1c40f);
  this.player.position.set(this.GX/2+3,0,this.GZ+20);
  this.player.rotation.y=Math.PI;
  this.scene.add(this.player);
  if(mode==='night'){
   const hl=new THREE.SpotLight(0xffffff,2,100,Math.PI/5,.5,1);
   hl.position.set(0,1,-2);hl.target.position.set(0,0,-20);
   this.player.add(hl);this.player.add(hl.target);
  }
 }

 // ===== VEHICLE MODELS =====
 _makeVehicleGroup(type,col){
  const g=new THREE.Group();
  const blk=new THREE.MeshLambertMaterial({color:0x111111});
  const glass=new THREE.MeshPhongMaterial({color:0x1a2535,shininess:80,transparent:true,opacity:0.85});
  const addW=(x,y,z,r)=>{
   r=r||0.4;
   const w=new THREE.Mesh(new THREE.CylinderGeometry(r,r,0.28,12),blk);
   w.rotation.z=Math.PI/2;w.position.set(x,y,z);g.add(w);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*0.4,r*0.4,0.30,8),new THREE.MeshPhongMaterial({color:0x888888}));
   hub.rotation.z=Math.PI/2;hub.position.set(x,y,z);g.add(hub);
  };

  if(type==='car'||type==='taxi'){
   const isTaxi=type==='taxi';
   const bodyCol=isTaxi?0x111111:col;
   const cabCol=isTaxi?0xf1c40f:col;
   const body=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.65,4.5),new THREE.MeshPhongMaterial({color:bodyCol,shininess:30}));
   body.position.y=0.55;g.add(body);
   const cab=new THREE.Mesh(new THREE.BoxGeometry(1.85,0.55,2.2),new THREE.MeshPhongMaterial({color:cabCol,shininess:30}));
   cab.position.set(0,1.15,-0.15);g.add(cab);
   const wf=new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.5),glass);wf.position.set(0,1.15,-1.26);g.add(wf);
   const wr=new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.45),glass);wr.rotation.y=Math.PI;wr.position.set(0,1.15,0.96);g.add(wr);
   [-1,1].forEach(s=>{const sw=new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.45),glass);sw.rotation.y=s*Math.PI/2;sw.position.set(s*0.93,1.15,-0.15);g.add(sw);});
   [-0.7,0.7].forEach(x=>{const hl=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.18,0.05),new THREE.MeshBasicMaterial({color:0xffffcc}));hl.position.set(x,0.55,-2.26);g.add(hl);});
   [-0.8,0.8].forEach(x=>{const tl=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.05),new THREE.MeshBasicMaterial({color:0xff2020}));tl.position.set(x,0.55,2.26);g.add(tl);});
   const fb=new THREE.Mesh(new THREE.BoxGeometry(2.1,0.2,0.15),new THREE.MeshPhongMaterial({color:0x333333}));fb.position.set(0,0.3,-2.3);g.add(fb);
   const rb=new THREE.Mesh(new THREE.BoxGeometry(2.1,0.2,0.15),new THREE.MeshPhongMaterial({color:0x333333}));rb.position.set(0,0.3,2.3);g.add(rb);
   addW(-1.05,0.4,1.4);addW(1.05,0.4,1.4);addW(-1.05,0.4,-1.4);addW(1.05,0.4,-1.4);
   if(isTaxi){const meter=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.2,0.3),new THREE.MeshBasicMaterial({color:0xffff00}));meter.position.set(0,1.5,0);g.add(meter);}
  }
  else if(type==='suv'){
   const body=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.9,5.0),new THREE.MeshPhongMaterial({color:col,shininess:25}));
   body.position.y=0.7;g.add(body);
   const cab=new THREE.Mesh(new THREE.BoxGeometry(2.15,0.7,3.0),new THREE.MeshPhongMaterial({color:col,shininess:25}));
   cab.position.set(0,1.55,0.2);g.add(cab);
   [-0.95,0.95].forEach(x=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,2.8),new THREE.MeshPhongMaterial({color:0x888888}));rail.position.set(x,1.95,0.2);g.add(rail);});
   const wf=new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.6),glass);wf.position.set(0,1.55,-1.31);g.add(wf);
   const wr=new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.55),glass);wr.rotation.y=Math.PI;wr.position.set(0,1.55,1.71);g.add(wr);
   [-1,1].forEach(s=>{const sw=new THREE.Mesh(new THREE.PlaneGeometry(2.8,0.55),glass);sw.rotation.y=s*Math.PI/2;sw.position.set(s*1.08,1.55,0.2);g.add(sw);});
   [-0.8,0.8].forEach(x=>{
    const hl=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.2,0.05),new THREE.MeshBasicMaterial({color:0xffffcc}));hl.position.set(x,0.7,-2.51);g.add(hl);
    const tl=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.2,0.05),new THREE.MeshBasicMaterial({color:0xff2020}));tl.position.set(x,0.7,2.51);g.add(tl);
   });
   addW(-1.15,0.5,1.8);addW(1.15,0.5,1.8);addW(-1.15,0.5,-1.8);addW(1.15,0.5,-1.8);
  }
  else if(type==='bus'){
   const body=new THREE.Mesh(new THREE.BoxGeometry(2.6,2.8,10.0),new THREE.MeshPhongMaterial({color:0xc0392b}));
   body.position.y=1.8;g.add(body);
   const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.65,0.8,10.05),new THREE.MeshPhongMaterial({color:0xf5f0dc}));
   stripe.position.y=2.2;g.add(stripe);
   [-1,1].forEach(s=>{const wb=new THREE.Mesh(new THREE.PlaneGeometry(9.5,0.6),glass);wb.rotation.y=s*Math.PI/2;wb.position.set(s*1.31,2.2,0);g.add(wb);});
   const wf=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.5),glass);wf.position.set(0,2.0,-5.01);g.add(wf);
   const dest=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.4,0.1),new THREE.MeshBasicMaterial({color:0xffffff}));
   dest.position.set(0,3.0,-5.05);g.add(dest);
   addW(-1.35,0.5,3.5,0.5);addW(1.35,0.5,3.5,0.5);addW(-1.35,0.5,-3.5,0.5);addW(1.35,0.5,-3.5,0.5);addW(-1.35,0.5,4.5,0.5);addW(1.35,0.5,4.5,0.5);
  }
  else if(type==='truck'){
   const truckColors=[0xe67e22,0xc0392b,0x2980b9,0x27ae60,0x8e44ad];
   const tc=truckColors[Math.floor(Math.random()*truckColors.length)];
   const cabM=new THREE.Mesh(new THREE.BoxGeometry(2.4,2.2,2.5),new THREE.MeshPhongMaterial({color:tc}));
   cabM.position.set(0,1.5,-3.5);g.add(cabM);
   const wf=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.2),glass);wf.position.set(0,1.8,-4.76);g.add(wf);
   const cont=new THREE.Mesh(new THREE.BoxGeometry(2.5,2.8,6.5),new THREE.MeshPhongMaterial({color:0x7f8c8d}));
   cont.position.set(0,1.8,0.8);g.add(cont);
   const bumper=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.6,0.2),new THREE.MeshPhongMaterial({color:0xf1c40f}));
   bumper.position.set(0,0.6,-4.85);g.add(bumper);
   const horn2=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.8,0.3),new THREE.MeshPhongMaterial({color:0xc0c0c0}));
   horn2.position.set(0,2.8,-3.5);g.add(horn2);
   addW(-1.25,0.5,-3.2,0.5);addW(1.25,0.5,-3.2,0.5);addW(-1.25,0.5,2.5,0.5);addW(1.25,0.5,2.5,0.5);addW(-1.25,0.5,3.5,0.5);addW(1.25,0.5,3.5,0.5);
  }
  else if(type==='auto'){
   const frame=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.5,2.4),new THREE.MeshPhongMaterial({color:0x27ae60}));
   frame.position.y=0.5;g.add(frame);
   const canopy=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.8,2.2),new THREE.MeshPhongMaterial({color:0xf1c40f}));
   canopy.position.set(0,1.2,0.1);g.add(canopy);
   [-1,1].forEach(s=>{const side=new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.6),new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:0.3}));side.rotation.y=s*Math.PI/2;side.position.set(s*0.76,0.9,0.1);g.add(side);});
   const wf=new THREE.Mesh(new THREE.PlaneGeometry(1.3,0.6),glass);wf.position.set(0,1.0,-1.21);g.add(wf);
   const hl=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),new THREE.MeshBasicMaterial({color:0xffffcc}));hl.position.set(0,0.6,-1.25);g.add(hl);
   addW(0,0.3,-0.9,0.3);addW(-0.8,0.3,0.9,0.3);addW(0.8,0.3,0.9,0.3);
  }
  else if(type==='motorcycle'){
   const frame=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.5,2.0),new THREE.MeshPhongMaterial({color:col}));
   frame.position.y=0.7;g.add(frame);
   const tank=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,0.6),new THREE.MeshPhongMaterial({color:col}));
   tank.position.set(0,0.9,-0.2);g.add(tank);
   const seat=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.12,0.8),new THREE.MeshPhongMaterial({color:0x222222}));
   seat.position.set(0,0.95,0.4);g.add(seat);
   const hb=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.05,0.05),new THREE.MeshPhongMaterial({color:0x888888}));
   hb.position.set(0,1.1,-0.7);g.add(hb);
   const torso=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.6,0.3),new THREE.MeshPhongMaterial({color:0x3a3a6a}));
   torso.position.set(0,1.4,0.1);g.add(torso);
   const head=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8),new THREE.MeshPhongMaterial({color:0xd4a574}));
   head.position.set(0,1.85,0.1);g.add(head);
   const helmet=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8),new THREE.MeshPhongMaterial({color:0x222222}));
   helmet.position.set(0,1.9,0.08);g.add(helmet);
   const hl=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,8),new THREE.MeshBasicMaterial({color:0xffffcc}));
   hl.position.set(0,0.8,-1.05);g.add(hl);
   const tl=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.08,0.03),new THREE.MeshBasicMaterial({color:0xff0000}));
   tl.position.set(0,0.7,1.02);g.add(tl);
   addW(0,0.4,0.8,0.35);addW(0,0.4,-0.8,0.35);
  }
  else if(type==='ambulance'){
   const body=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.8,5.0),new THREE.MeshPhongMaterial({color:0xffffff}));
   body.position.y=1.2;g.add(body);
   const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.25,0.3,5.05),new THREE.MeshBasicMaterial({color:0xff0000}));
   stripe.position.y=1.0;g.add(stripe);
   const wf=new THREE.Mesh(new THREE.PlaneGeometry(2.0,1.0),glass);wf.position.set(0,1.5,-2.51);g.add(wf);
   [-1,1].forEach(s=>{
    const hh=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.2),new THREE.MeshBasicMaterial({color:0xff0000}));
    hh.rotation.y=s*Math.PI/2;hh.position.set(s*1.11,1.5,0);g.add(hh);
    const vv=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.8),new THREE.MeshBasicMaterial({color:0xff0000}));
    vv.rotation.y=s*Math.PI/2;vv.position.set(s*1.11,1.5,0);g.add(vv);
   });
   const lb=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.25,0.4),new THREE.MeshBasicMaterial({color:0xff0000}));
   lb.position.set(0,2.2,-1.5);g.add(lb);
   addW(-1.15,0.5,1.8);addW(1.15,0.5,1.8);addW(-1.15,0.5,-1.8);addW(1.15,0.5,-1.8);
  }
  g.userData.vtype=type;
  return g;
 }

 // ===== NPC SPAWNING =====
 _spawnNPCs(count,isNight){
  const types=['car','car','car','suv','suv','bus','auto','auto','truck','motorcycle','motorcycle','taxi'];
  const colors=[0xf0f0f0,0xc0c0c0,0xcc2020,0x2040a0,0x1a1a1a,0x206030,0x8a6040,0x3a3a8a,0x8a3a3a,0xf0e0c0];
  const G=this.GX,Z=this.GZ,RW=this.RW;
  for(let i=0;i<count;i++){
   const type=types[Math.floor(Math.random()*types.length)];
   const nv=this._makeVehicleGroup(type,colors[Math.floor(Math.random()*colors.length)]);
   const isVert=Math.random()>0.5;
   const gx=Math.floor(Math.random()*7)-3;
   const gz=Math.floor(Math.random()*7)-3;
   const dir=Math.random()>0.5?1:-1;
   const lane=dir>0?RW/4:-RW/4;
   if(isVert){nv.position.set(gx*G+lane,0,gz*Z+Math.random()*Z);nv.rotation.y=dir>0?0:Math.PI;}
   else{nv.position.set(gx*G+Math.random()*G,0,gz*Z+lane);nv.rotation.y=dir>0?Math.PI/2:-Math.PI/2;}
   let spd=0.2+Math.random()*0.15;
   if(type==='bus'||type==='truck')spd=0.12+Math.random()*0.08;
   else if(type==='auto')spd=0.15+Math.random()*0.1;
   else if(type==='motorcycle')spd=0.3+Math.random()*0.15;
   nv.userData={spd:spd,isAmb:false,dir:dir,lane:lane,isVert:isVert};
   if(isNight){const hl=new THREE.PointLight(0xffffcc,0.5,30);hl.position.set(0,1,dir>0?-2:2);nv.add(hl);}
   this.npcs.push(nv);this.scene.add(nv);
  }
 }

 _cp(x,z){const c=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,0.2,16),new THREE.MeshBasicMaterial({color:0x00c851,transparent:true,opacity:0.6}));c.position.set(x,.15,z);this.scene.add(c);this.cps.push(c);}
 _sig(x,z){
  const g=new THREE.Group();
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,8),new THREE.MeshPhongMaterial({color:0x555555}));p.position.y=2;
  const bx=new THREE.Mesh(new THREE.BoxGeometry(.7,1.5,.35),new THREE.MeshPhongMaterial({color:0x1a1a1a}));bx.position.set(0,3.5,0);
  const mk=(y,n)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(.12),new THREE.MeshBasicMaterial({color:0x111111}));s.position.set(0,y,.14);s.name=n;return s;};
  g.add(p,bx,mk(3.85,'red'),mk(3.55,'yellow'),mk(3.25,'green'));
  g.position.set(x,0,z);this.scene.add(g);this.sigs.push(g);
  g.userData={st:'red',t:Math.random()*6,rd:4+Math.random()*2,gd:4+Math.random()*2,yd:1.5};
  return g;
 }

 _create3DRain(){
  const geo=new THREE.BufferGeometry();const cnt=5000;const pos=new Float32Array(cnt*3);
  for(let i=0;i<cnt*3;i+=3){pos[i]=(Math.random()-.5)*200;pos[i+1]=Math.random()*80;pos[i+2]=(Math.random()-.5)*200;}
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  this.rainSystem=new THREE.Points(geo,new THREE.PointsMaterial({color:0x8899aa,size:0.15,transparent:true,opacity:0.6}));
  this.scene.add(this.rainSystem);
 }

 // ===== GAME LOOP =====
 _loop(){
  requestAnimationFrame(()=>this._loop());
  const dt=Math.min(this.clock.getDelta(),0.05);
  if(!this.playing||this.pause){if(this.renderer&&this.scene&&this.camera)this.renderer.render(this.scene,this.camera);return;}
  this.timer+=dt;

  // Update chunks
  if(this.player)this._updateChunks(this.player.position.x,this.player.position.z);

  // Rain
  if(this.rainSystem){
   const rp=this.rainSystem.geometry.attributes.position.array;
   for(let i=1;i<rp.length;i+=3){rp[i]-=40*dt;if(rp[i]<0)rp[i]=80;}
   this.rainSystem.geometry.attributes.position.needsUpdate=true;
   this.rainSystem.position.set(this.player.position.x,0,this.player.position.z);
  }

  // Player physics
  let tgt=0;
  if(this.keys.arrowup)tgt=this.gcap;if(this.keys.arrowdown)tgt=-.25;
  if(this.gear==='P'||this.gear==='N')tgt=0;
  if(tgt>0)this.speed=Math.min(this.speed+this.accel,tgt);
  else if(tgt<0)this.speed=Math.max(this.speed-this.accel,tgt);
  else this.speed*=this.fric;
  if(Math.abs(this.speed)>.01){
   let tm=this.turn*(Math.abs(this.speed)/this.maxSpd);if(tm<.008)tm=.008;
   if(this.keys.arrowleft)this.player.rotation.y+=tm;
   if(this.keys.arrowright)this.player.rotation.y-=tm;
  }
  const vx=-Math.sin(this.player.rotation.y)*this.speed;
  const vz=-Math.cos(this.player.rotation.y)*this.speed;
  this.player.position.x+=vx;this.player.position.z+=vz;

  // Building collisions
  const pb=new THREE.Box3().setFromObject(this.player);pb.expandByScalar(-0.2);
  const px=this.player.position.x,pz=this.player.position.z;
  for(let i=0;i<this.world.length;i++){
   const b=this.world[i];
   if(Math.abs(b.position.x-px)>20||Math.abs(b.position.z-pz)>20)continue;
   const bb=new THREE.Box3().setFromObject(b);
   if(pb.intersectsBox(bb)){this.speed*=-.5;this.player.position.x-=vx*2.5;this.player.position.z-=vz*2.5;this.hp-=8;sfx.play('brake');break;}
  }

  // Off-road
  const onRoad=this._isOnRoad(px,pz);
  if(!onRoad&&Math.abs(this.speed)>0.08){this.hp-=4*dt;document.getElementById('ow').classList.add('on');}
  else{document.getElementById('ow').classList.remove('on');}

  // Checkpoints
  if(this.routeIdx<this.driveRoute.length){
   const ct=this.driveRoute[this.routeIdx];const dist=Math.hypot(px-ct.x,pz-ct.z);
   if(dist<8){this.routeIdx++;this.cps[this.routeIdx-1].visible=false;sfx.play('ok');this.score+=100;document.getElementById('hsc').textContent=Math.round(this.score);}
   document.getElementById('hcp').textContent=this.routeIdx+'/'+this.driveRoute.length;
   const ang=Math.atan2(px-ct.x,pz-ct.z)-this.player.rotation.y;
   document.getElementById('da-arrow').style.transform='translate(-50%,-50%) rotate('+ang+'rad)';
   document.getElementById('da').style.display='flex';
   const dm=Math.round(dist);
   document.getElementById('dal').textContent=dist<15?'ARRIVING':(Math.abs(ang)<.3?dm+'m \u00b7 STRAIGHT':(ang>0?dm+'m \u00b7 RIGHT':dm+'m \u00b7 LEFT'));
  }else{document.getElementById('dal').textContent='DESTINATION REACHED!';this.completeLevel();}

  // Camera
  const coX=px+Math.sin(this.player.rotation.y)*8;
  const coZ=pz+Math.cos(this.player.rotation.y)*8;
  this.camera.position.lerp(new THREE.Vector3(coX,this.player.position.y+4.5,coZ),.08);
  this._camTarget.lerp(this.player.position,.08);this.camera.lookAt(this._camTarget);

  this._updNPCs(dt,pb,vx,vz);
  this._updSig(dt);

  // HUD
  document.getElementById('gspd').textContent=Math.abs(Math.round(this.speed*180));
  document.getElementById('garc').setAttribute('d',this._arc(Math.abs(this.speed/this.maxSpd)));
  this._uh();
  const s=Math.floor(this.timer);document.getElementById('htmr').textContent=Math.floor(s/60)+':'+((s%60)<10?'0':'')+(s%60);
  const hfin=document.getElementById('hfin');if(hfin&&this.fine>0)hfin.textContent=this.fine;
  const hwal=document.getElementById('hwal');if(hwal)hwal.textContent=S.wallet;
  this._ummap();
  this.renderer.render(this.scene,this.camera);
 }

 // ===== NPC AI =====
 _updNPCs(dt,pb,vx,vz){
  const px=this.player.position.x,pz=this.player.position.z;
  const G=this.GX,Z=this.GZ,RW=this.RW;
  for(let ni=0;ni<this.npcs.length;ni++){
   const n=this.npcs[ni];
   const dist=Math.hypot(px-n.position.x,pz-n.position.z);
   // Recycle far NPCs
   if(dist>250){
    const isVert=Math.random()>0.5;
    const dir=Math.random()>0.5?1:-1;
    const lane=dir>0?RW/4:-RW/4;
    const ahead=80+Math.random()*120;
    const fwdX=-Math.sin(this.player.rotation.y)*ahead;
    const fwdZ=-Math.cos(this.player.rotation.y)*ahead;
    const spawnX=px+fwdX+(Math.random()-.5)*G*2;
    const spawnZ=pz+fwdZ+(Math.random()-.5)*Z*2;
    if(isVert){const nr=Math.round(spawnX/G)*G;n.position.set(nr+lane,0,spawnZ);n.rotation.y=dir>0?0:Math.PI;}
    else{const nr=Math.round(spawnZ/Z)*Z;n.position.set(spawnX,0,nr+lane);n.rotation.y=dir>0?Math.PI/2:-Math.PI/2;}
    n.userData.dir=dir;n.userData.lane=lane;n.userData.isVert=isVert;
    continue;
   }
   const nvX=-Math.sin(n.rotation.y)*n.userData.spd;
   const nvZ=-Math.cos(n.rotation.y)*n.userData.spd;
   // Far NPCs just move, no detailed AI
   if(dist>100){n.position.x+=nvX;n.position.z+=nvZ;continue;}
   // Signal check
   let blocked=false;
   for(let si=0;si<this.sigs.length;si++){
    const sig=this.sigs[si];
    if(sig.userData.st!=='red')continue;
    const sd=Math.hypot(n.position.x+nvX*20-sig.position.x,n.position.z+nvZ*20-sig.position.z);
    if(sd<10){blocked=true;break;}
   }
   // Proximity braking
   if(!blocked){
    const cx2=n.position.x+nvX*12,cz2=n.position.z+nvZ*12;
    if(Math.hypot(cx2-px,cz2-pz)<5)blocked=true;
    if(!blocked){
     for(let j=0;j<this.npcs.length;j++){
      if(j===ni)continue;
      const o=this.npcs[j];
      if(Math.hypot(cx2-o.position.x,cz2-o.position.z)<4){blocked=true;break;}
     }
    }
   }
   if(!blocked){n.position.x+=nvX;n.position.z+=nvZ;}
   // Player collision
   if(dist<5){
    const nb=new THREE.Box3().setFromObject(n);
    if(pb.intersectsBox(nb)){
     this.speed*=-.4;this.hp-=15;this.player.position.x-=vx*3;this.player.position.z-=vz*3;sfx.play('brake');
     if(!this.challanFired.has('crash')){
      this.challanFired.add('crash');this.vio++;this.fine+=1000;S.wallet-=1000;save();
      ui.issueChallan('Collision / Reckless Driving','Sec 279, MV Act','\u20b9 1,000','Urban Grid');
     }
    }
   }
  }
 }

 _updSig(dt){
  let nearest=null;
  for(let i=0;i<this.sigs.length;i++){
   const s=this.sigs[i];const u=s.userData;u.t+=dt;
   if(u.st==='red'&&u.t>u.rd){u.st='green';u.t=0;}
   else if(u.st==='green'&&u.t>u.gd){u.st='yellow';u.t=0;}
   else if(u.st==='yellow'&&u.t>u.yd){u.st='red';u.t=0;}
   s.children[2].material.color.setHex(u.st==='red'?0xff3b30:0x111111);
   s.children[3].material.color.setHex(u.st==='yellow'?0xffd54a:0x111111);
   s.children[4].material.color.setHex(u.st==='green'?0x00c851:0x111111);
   const d=Math.hypot(this.player.position.x-s.position.x,this.player.position.z-s.position.z);
   if(d<30&&(!nearest||d<nearest.d))nearest={st:u.st,d:Math.round(d)};
   if(u.st==='red'&&d<8&&this.speed>0.1&&!this.challanFired.has('rl_'+s.uuid)){
    this.challanFired.add('rl_'+s.uuid);this.vio++;this.fine+=500;S.wallet-=500;save();
    ui.issueChallan('Jumping red signal','Section 119, MV Act','\u20b9 500','Junction Sensor');
   }
  }
  const si=document.getElementById('sig-ind');
  if(nearest){
   si.style.display='flex';
   const col=nearest.st==='red'?'#ff3b30':nearest.st==='yellow'?'#ffd54a':'#00c851';
   document.getElementById('sind-lamp').style.background=col;
   document.getElementById('sind-lamp').style.boxShadow='0 0 14px '+col;
   document.getElementById('sind-state').textContent=nearest.st.toUpperCase();
   document.getElementById('sind-state').style.color=col;
   document.getElementById('sind-dist').textContent=nearest.d+'m';
  }else{si.style.display='none';}
 }

 _arc(pct){const r=38,c=44,a=pct*Math.PI*1.5-Math.PI*1.25,x=c+r*Math.cos(a),y=c+r*Math.sin(a);return'M '+(c-r*0.707)+' '+(c+r*0.707)+' A '+r+' '+r+' 0 '+(pct>.66?1:0)+' 1 '+x+' '+y;}

 _ummap(){
  const mc=document.getElementById('mmc');if(!mc||!this.playing)return;mc.classList.add('on');
  const ctx=mc.getContext('2d');const W=112,H=112,cx=W/2,cy=H/2;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0f14';ctx.fillRect(0,0,W,H);
  const scl=0.35;const px=this.player.position.x,pz=this.player.position.z;
  const G=this.GX,Z=this.GZ,RW=this.RW;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(this.player.rotation.y);ctx.translate(-cx,-cy);
  ctx.fillStyle='#2a2a2a';
  for(let gx=Math.floor(px/G)-4;gx<=Math.floor(px/G)+4;gx++){
   const rx=cx+(gx*G-px)*scl;ctx.fillRect(rx-RW*scl/2,0,RW*scl,H);
  }
  for(let gz=Math.floor(pz/Z)-4;gz<=Math.floor(pz/Z)+4;gz++){
   const rz=cy+(gz*Z-pz)*scl;ctx.fillRect(0,rz-RW*scl/2,W,RW*scl);
  }
  ctx.fillStyle='#00c851';
  this.cps.forEach(c=>{if(c.visible){ctx.beginPath();ctx.arc(cx+(c.position.x-px)*scl,cy+(c.position.z-pz)*scl,3,0,Math.PI*2);ctx.fill();}});
  ctx.fillStyle='#ff4444';
  this.npcs.forEach(n=>{if(Math.hypot(n.position.x-px,n.position.z-pz)<150){ctx.beginPath();ctx.arc(cx+(n.position.x-px)*scl,cy+(n.position.z-pz)*scl,1.5,0,Math.PI*2);ctx.fill();}});
  ctx.restore();
  ctx.fillStyle='#ffc107';ctx.beginPath();ctx.moveTo(cx,cy-5);ctx.lineTo(cx-3,cy+4);ctx.lineTo(cx+3,cy+4);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(0,0,W,H);
 }
}
const game=new Game();

window.game=game;window.ui=ui;window.sfx=sfx;ui.showStart();

