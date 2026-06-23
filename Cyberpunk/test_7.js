
'use strict';
// 🚦 IMMUTABLE COMPLIANCE ENGINE METRICS 🚦
const LVS=[
{id:1,icon:'🚦',name:'Traffic Signals',v:'🚗 Car',col:'#e74c3c',gr:'linear-gradient(135deg,#c0392b,#e74c3c)',tg:'Master Junction Management',ds:'Navigate intersection signal arrays correctly. Absolute stop lines apply.',
 hps:['Red configuration: Absolute stop priority.','Yellow indicator: Safely decelerate.','Green signal: Safely cross intersection bounds.'],
 law:{sec:'Section 119, Motor Vehicles Act 1988',fine:'₹500',off:'Jumping automated signals'},
 theory:'Automated signal synchronization patterns direct city flow constraints efficiently.',
 pract:'Navigate the Andheri Junction grid. Obey all traffic signals at 8 intersections. Red means stop, green means go.',
 quiz:[{q:'What does an active yellow signal mean?',o:['Speed up before it turns red','Slow down and get ready to stop','Honk the horn'],a:1},{q:'What is the fine for running a red light?',o:['₹100','₹500','₹2,000'],a:1},{q:'Which law covers traffic signal rules?',o:['Section 119, MV Act','Section 177, MV Act','Municipal Act'],a:0}],
 mode:'signals'},
{id:2,icon:'🚶',name:'Zebra Crossings',v:'🚶 Pedestrian',col:'#27ae60',gr:'linear-gradient(135deg,#1e8449,#27ae60)',tg:'Pedestrian Right-of-Way',ds:'Manage street crossings. Yield cleanly to active crosswalk users.',
 hps:['Zebra lanes give absolute pedestrian right of way.','Always yield when pedestrians step off the curb bounds.'],
 law:{sec:'Section 140, Motor Vehicles Act 1988',fine:'₹100',off:'Failure to yield at crosswalk markings'},
 theory:'Pedestrian safety grids reduce vehicle conflict metrics inside highly dense urban zones.',
 pract:'Walk safely across Dadar Junction. Use zebra crossings and wait for green signals before crossing busy roads.',
 quiz:[{q:'Who holds the right of way at zebra crossings?',o:['Trucks and buses','Pedestrians','Two-wheelers'],a:1}],
 mode:'pedestrian'},
{id:3,icon:'⛑️',name:'Helmet Security',v:'🏍️ Two-Wheeler',col:'#f39c12',gr:'linear-gradient(135deg,#d68910,#f39c12)',tg:'Protective Safety Gear',ds:'Secure BIS certified protective gear before igniting two-wheeler engine loops.',
 hps:['ISI-marked certified safety helmet is mandatory for all occupants.','Chin straps must be anchored tight.'],
 law:{sec:'Section 194D, Motor Vehicles Act 1988',fine:'₹1,000',off:'Operating two-wheeler without protective headgear'},
 theory:'Fastened safety headgear mitigates impact severity metrics significantly.',
 pract:'Ride your two-wheeler through the narrow Bandra backroads. Collect your helmet before riding.',
 quiz:[{q:'What is the helmet rule for bike riders?',o:['Helmets are not needed for the passenger','Both rider and passenger must wear helmets','Only the driver needs a helmet'],a:1}],
 mode:'helmet'},
{id:4,icon:'💺',name:'Seat Belt Challenge',v:'🚗 Car',col:'#2980b9',gr:'linear-gradient(135deg,#1f618d,#2980b9)',tg:'Cabin Restraint Systems',ds:'Complete cabin validation routines prior to shifting transmission nodes.',
 hps:['Seat belts are required for all seating positions.','Buckle logic must engage before vehicle goes into drive.'],
 law:{sec:'Section 194B, Motor Vehicles Act 1988',fine:'₹1,000',off:'Driving without wearing a seat belt'},
 theory:'Restraint systems prevent structural collision trajectory deviations during deceleration events.',
 pract:'Execute pre-drive loop verification sequence: Mirror alignment -> Restraint engagement -> Shift to Drive.',
 quiz:[{q:'When must seat belts be locked?',o:['After getting on the highway','Before you start driving','Only when encountering police details'],a:1}],
 mode:'seatbelt'},
{id:5,icon:'🚌',name:'School Bus Safety',v:'🚌 BEST Bus',col:'#d4ac0d',gr:'linear-gradient(135deg,#b7950b,#d4ac0d)',tg:'School Zone Containment',ds:'Operate multi-passenger transit units inside restricted school facility boundaries.',
 hps:['School perimeter maximum threshold is strictly set at 30 km/h.','Deploy caution light arrays while embarking passengers.'],
 law:{sec:'Section 112, Motor Vehicles Act 1988',fine:'₹2,000',off:'Exceeding speed limit near schools'},
 theory:'School speed zones protect variable pedestrian trajectories from collision energy transfers.',
 pract:'Drive the BEST bus through Parel school zone streets. Stay under 30 km/h near the school.',
 quiz:[{q:'What is the speed limit in school zones?',o:['50 km/h','30 km/h','No special restriction'],a:1}],
 mode:'bus'},
{id:6,icon:'🚆',name:'Railway Crossing',v:'🚗 Car',col:'#8e44ad',gr:'linear-gradient(135deg,#6c3483,#8e44ad)',tg:'Grade Separation Intersections',ds:'Halt safely at rail infrastructure interfaces. Wait for heavy rail units to clear.',
 hps:['Halt completely behind gate limits when warning lights activate.','Switch transmission to neutral while idling.'],
 law:{sec:'Section 131, Motor Vehicles Act 1988',fine:'₹1,000',off:'Bypassing active railway crossing safety barriers'},
 theory:'Heavy rail rolling stock components require extended deceleration paths; you must stop completely.',
 pract:'Approach active track corridors, shift transmission to neutral, and wait for transit clearance.',
 quiz:[{q:'What action is mandated when crossing gates begin alignment down?',o:['Speed up to beat the gate','Stop fully behind the line','Zigzag through the barriers'],a:1}],
 mode:'railway'},
{id:7,icon:'📢',name:'Device Distractions',v:'🚗 Car',col:'#c0392b',gr:'linear-gradient(135deg,#922b21,#c0392b)',tg:'Attentional Focus Controls',ds:'Suppress phone notifications while vehicle velocity tracking is live.',
 hps:['Handheld operations are fully illegal during target navigation.','Pull off-road to safe parking zones before answering communications data.'],
 law:{sec:'Section 184, Motor Vehicles Act 1988',fine:'₹1,000',off:'Operating motor vehicle while using handheld communication arrays'},
 theory:'Attentional load shifting to mobile devices degrades real-time visual tracking reaction matrices.',
 pract:'Drive along Marine Drive seafront. Ignore phone distractions and keep your eyes on the road.',
 quiz:[{q:'When is it legal to use your phone while driving?',o:['While stopped at a red light','Only when fully parked off the road','When driving in low gear'],a:1}],
 mode:'phone'},
{id:8,icon:'🚑',name:'Emergency Vehicles',v:'🚗 Car',col:'#c0392b',gr:'linear-gradient(135deg,#922b21,#e74c3c)',tg:'Emergency Lane Yields',ds:'Provide immediate passage lanes to active life-saving transit modules.',
 hps:['Yield left immediately upon receiving audible siren alerts.','Do not follow emergency transit within close spacing vectors.'],
 law:{sec:'Section 194E, Motor Vehicles Act 1988',fine:'₹10,000',off:'Blocking an ambulance or fire truck'},
 theory:'Unobstructed transport vectors significantly minimize destination arrival time variables for trauma units.',
 pract:'Detect oncoming rear emergency warnings, execute immediate lane changes to the left, and halt safely.',
 quiz:[{q:'What is the regulatory penalty for blocking ambulances and fire trucks?',o:['₹500','₹2,000','An official e-challan of ₹10,000'],a:2}],
 mode:'emergency'},
{id:9,icon:'🌧️',name:'Monsoon Traction',v:'🚗 Car',col:'#2471a3',gr:'linear-gradient(135deg,#1a5276,#2471a3)',tg:'Adverse Friction Adaptations',ds:'Manage safety vectors along low-friction monsoon street networks.',
 hps:['Reduce base speed metrics by 50% on moisture-heavy roads.','Avoid deep water pooling indices to mitigate hydroplaning risks.'],
 law:{sec:'Section 184, Motor Vehicles Act 1988',fine:'₹1,500',off:'Reckless operation under extreme atmospheric visibility constraints'},
 theory:'Fluid layer buildup disrupts physical contact patches between tire threads and asphalt surfaces.',
 pract:'Navigate the flooded Hindmata roads during monsoon. Avoid puddles and drive slowly on wet surfaces.',
 quiz:[{q:'What hazard occurs when tire component matrices lose contact with asphalt due to water pooling?',o:['Tailgating','Hydroplaning','Vapor locking'],a:1}],
 mode:'rain'},
{id:10,icon:'🛺',name:'Lane Discipline',v:'🛺 Auto Rickshaw',col:'#d68910',gr:'linear-gradient(135deg,#9a6b0a,#d68910)',tg:'Spatial Lane Allocation',ds:'Maintain localized structural positioning inside designated highway markers.',
 hps:['Slower commercial transport units must stay positioned inside the leftmost lane limits.','Overtake only using rightward lane parameters.'],
 law:{sec:'Section 112, Motor Vehicles Act 1988',fine:'1,000',off:'Improper lane utilization / erratic lane weaving patterns'},
 theory:'Predictable trajectory mapping reduces lateral collision vectors across heavy high-speed networks.',
 pract:'Guide your auto rickshaw along the Eastern Express Highway. Stay in the left lane.',
 quiz:[{q:'Which lane is legally designated for slower transport units?',o:['The rightmost fast track','The leftmost slow track lane','Any arbitrary line marker'],a:1}],
 mode:'lane'},
{id:11,icon:'🤫',name:'Silent Perimeters',v:'🚗 Car',col:'#148f77',gr:'linear-gradient(135deg,#0e6655,#148f77)',tg:'Acoustic Noise Containment',ds:'Suppress acoustic warning arrays entirely while driving inside healthcare or school parameters.',
 hps:['Audible horn arrays are restricted within 100 meters of hospital gates.','Utilize light flashing indicators for nighttime visibility cues.'],
 law:{sec:'Section 190(2), Motor Vehicles Act 1988',fine:'₹2,000',off:'Honking in a no-honk zone'},
 theory:'High decibel emissions elevate physiological stress profiles within patient recovery spaces.',
 pract:'Drive carefully past medical structures with structural horn relays completely deactivated.',
 quiz:[{q:'What spatial radius defines silent parameters around institutional facilities?',o:['20 meters','100 meters','500 meters'],a:1}],
 mode:'silentzone'},
{id:12,icon:'🚦',name:'Overloading Risks',v:'🏍️ Two-Wheeler',col:'#c0392b',gr:'linear-gradient(135deg,#922b21,#c0392b)',tg:'Payload Threshold Boundaries',ds:'Enforce passenger limit constraints onto two-wheeler asset links strictly.',
 hps:['Payload constraints allow maximum 2 occupants per unit.','Excess loading severely limits target braking and deceleration performance metrics.'],
 law:{sec:'Section 128, Motor Vehicles Act 1988',fine:'₹1,000',off:'Triple riding or exceeding payload index on two-wheelers'},
 theory:'Excess mass distributions alter the center of gravity coordinates, causing rolling stability failures.',
 pract:'Filter and deny illegal passenger addition requests on your two-wheeler array.',
 quiz:[{q:'How does payload overloading modify braking performance dimensions?',o:['Makes stopping easier','Makes it much harder to stop','Has no effect'],a:1}],
 mode:'overload'},
{id:13,icon:'🍷',name:'Sober Inspection',v:'🚗 Car',col:'#7d3c98',gr:'linear-gradient(135deg,#5b2c6f,#7d3c98)',tg:'Chemical Testing Compliance',ds:'Interface with automated law details at roadside evaluation checkpoints.',
 hps:['Legal threshold limit for blood-alcohol content is capped at 0.03%.','PUC verification emissions data must undergo updates every 180 days.'],
 law:{sec:'Section 185, Motor Vehicles Act 1988',fine:'₹10,000',off:'Driving under influence of alcohol or drugs'},
 theory:'Chemical tracking shows neural processing speed dropping by 30%, which extends stopping distance rules.',
 pract:'Submit configuration documents cleanly at unexpected inspection block checkpoints.',
 quiz:[{q:'What is the legal blood alcohol limit in India?',o:['0.08%','0.03% (30mg per 100ml blood)','0.05%'],a:1}],
 mode:'checkpoint'},
{id:14,icon:'🛣️',name:'Highway Corridors',v:'🚗 Car',col:'#34495e',gr:'linear-gradient(135deg,#1c2833,#34495e)',tg:'Speed limit driving',ds:'Maintain speed rules within structured minimum and maximum limits on major bridges.',
 hps:['Bandra-Worli Sea Link constraints mandate velocity tracking between 40 km/h and 80 km/h.','Deploy higher transmission ratios to stabilize power efficiency maps.'],
 law:{sec:'Section 112, Motor Vehicles Act 1988',fine:'₹2,000',off:'Breaking speed limits on highways'},
 theory:'Velocity boundaries avoid traffic accumulation waves and catastrophic impact energy profiles.',
 pract:'Drive across the Bandra-Worli Sea Link. Maintain speed between 40-80 km/h on the bridge.',
 quiz:[{q:'What speed must you maintain on the Sea Link freeway infrastructure?',o:['20 to 50 km/h','40 to 80 km/h','No speed limit'],a:1}],
 mode:'highway'},
{id:15,icon:'🌟',name:'Final Evaluation',v:'🚗 All Vehicles',col:'#ff6b35',gr:'linear-gradient(135deg,#ff6b35,#ffd54a)',tg:'System Integration Exam',ds:'Demonstrate perfect compliance profiles across all integrated scenario models concurrently.',
 hps:['All automated monitoring arrays are fully initialized simultaneously.','Perfect routing tracking is required across high-density mixed traffic patterns.'],
 law:{sec:'All MV Act Sections Apply Simultaneously',fine:'Variable',off:'Any compliance boundary exception failure'},
 theory:'The synthesis of tactical perception and strategic tracking defines safe operations metrics inside dense urban grids.',
 pract:'Navigate the final integrated city-block framework flawlessly without a single compliance exception error.',
 quiz:[{q:'A driver tracking high safety metrics does ALL EXCEPT:',o:['Stays in their lane safely','Speeds through yellow lights','Gives way to emergency vehicles'],a:1}],
 mode:'final'}
];

const BADGES=[
 {id:'safe_walker',name:'Safe Walker Badge',icon:'🚶',desc:'Crossed all roads safely as a pedestrian'},
 {id:'law_abider',name:'Law Abider Badge',icon:'🏛️',desc:'Passed all checkpoint inspections cleanly'},
 {id:'speed_king',name:'Speed King Badge',icon:'🏎️',desc:'Completed Sea Link with zero speed violations'},
 {id:'traffic_hero',name:'Traffic Hero Badge',icon:'🌟',desc:'Completed all 15 levels of the Academy'},
 {id:'smart_citizen',name:'Mumbai Smart Citizen',icon:'🏙️',desc:'Earned the Traffic Hero badge 🔄 A true road hero'},
 {id:'signal_master',name:'Signal Master',icon:'🚦',desc:'Completed 5+ levels without a single red-light violation'}
];

// 🚦 STATE MANAGEMENT 🚦
let S={comp:{},badges:[],total:0,name:'Traffic Hero'};
try{const s=localStorage.getItem('mth4');if(s)S=Object.assign(S,JSON.parse(s));}catch(e){}
const save=()=>{try{localStorage.setItem('mth4',JSON.stringify(S));}catch(e){}};

// 🚦 UTILS 🚦
let _tt=null;
function toast(msg,col='#ffd54a'){const t=document.getElementById('toast'),ti=document.getElementById('ti');ti.textContent=msg;ti.style.background=col;t.classList.add('on');clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('on'),2500);}
const mob=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// 🚦 SOUND FX 🚦
const sfx={_c:null,init(){if(this._c)return;try{this._c=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}},
 play(t){if(!this._c)return;const p={horn:{f:440,ty:'square',d:.18,v:.12},brake:{f:160,ty:'sawtooth',d:.15,v:.08},challan:{f:880,ty:'triangle',d:.32,v:.11},ok:{f:660,ty:'sine',d:.22,v:.09},error:{f:110,ty:'square',d:.28,v:.1}};const pp=p[t]||p.horn;
 try{const o=this._c.createOscillator(),g=this._c.createGain();o.connect(g);g.connect(this._c.destination);o.type=pp.ty;o.frequency.setValueAtTime(pp.f,this._c.currentTime);g.gain.setValueAtTime(pp.v,this._c.currentTime);g.gain.exponentialRampToValueAtTime(.001,this._c.currentTime+pp.d);o.start();o.stop(this._c.currentTime+pp.d);}catch(e){}}
};

// 🚦 UI INTERACTION LOGIC LAYER 🚦
const ui={cur:null,qst:null,cq:[],cbusy:false,_ccb:null,
 adminUnlock(){LVS.forEach(l=>{if(!S.comp[l.id])S.comp[l.id]={score:500,time:Date.now()}});BADGES.forEach(b=>{if(!S.badges.includes(b.id))S.badges.push(b.id)});S.total+=7500;save();toast('🔓 Developer Unlock Triggered!','#00c851');this.showLevels();},
 hardReset(){if(confirm('Reset all progress?')){S.comp={};S.badges=[];S.total=0;save();toast('⚠️ Progress Reset!','#ff3b30');this.showStart();}},
 show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));if(id)document.getElementById(id).classList.add('active');},
 showStart(){this.show('ss');this._rain();if(!S.name||S.name==='Traffic Hero'){setTimeout(()=>this.showNameDlg(),1000);}},
 showNameDlg(){document.getElementById('name-dlg').classList.add('on');setTimeout(()=>{const i=document.getElementById('name-input');if(i)i.focus();},200);},
 saveName(){const v=document.getElementById('name-input').value.trim();if(v){S.name=v;save();toast('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Profile Saved!','#00c851');}document.getElementById('name-dlg').classList.remove('on');},
 _rain(){const r=document.getElementById('rl');if(r&&!r._b){r._b=1;for(let i=0;i<30;i++){const d=document.createElement('div');d.className='rd';d.style.left=Math.random()*100+'%';d.style.height=(50+Math.random()*50)+'px';d.style.animationDuration=('.6'+Math.random()*.5)+'s';r.appendChild(d);}}},
 showLevels(){this.show('screen-levels');this._bldLvs();},
 _bldLvs(){
   const body=document.getElementById('lvbody');body.innerHTML='';
   const done=Object.keys(S.comp).length;document.getElementById('pchip').textContent=done+'/15 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
   const secs=[{t:'🔰 Beginner Modules',ids:[1,2,3,4]},{t:'🔰 Intermediate Corridors',ids:[5,6,7,8,9]},{t:'🔰 Advanced Systems',ids:[10,11,12,13]},{t:'🎓 Expert Gauntlets',ids:[14,15]}];
   secs.forEach(sec=>{
     const sh=document.createElement('div');sh.className='sec-hdr';sh.textContent=sec.t;body.appendChild(sh);
     const tr=document.createElement('div');tr.className='lv-track';
     sec.ids.forEach(id=>{
       const lv=LVS.find(l=>l.id===id),idx=LVS.indexOf(lv);
       const un=idx===0||S.comp[LVS[idx-1].id];const cm=!!S.comp[lv.id];const ip=!cm&&idx>0&&S.comp[LVS[idx-1].id];
       const c=document.createElement('div');c.className='lcard'+(cm?' done':'')+(un?'':' lk');
       c.innerHTML=`<div class="lbar" style="background:${lv.gr}"></div>
        <div class="lct"><div class="lico" style="background:${lv.gr}">${un?lv.icon:'🔒'}</div><div class="lst ${cm?'sdk':ip?'sip':'sns'}">${cm?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Done':ip?'▶️ Start':'🔒 Locked'}</div></div>
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
     {id:'intro',icon:'📖',label:'Introduction',sub:'Course overview'},
     ...lv.hps.map((hp,i)=>({id:'rule'+i,icon:'⚖️',label:'Rule '+(i+1),sub:hp.split(':')[0].substring(0,24)})),
     {id:'law',icon:'🏛️',label:'Framework',sub:'Penal provisions'},
     {id:'theory',icon:'📊',label:'Concepts',sub:'Analytical metrics'},
     {id:'practical',icon:'📖',label:'Execution',sub:'Simulation profile'}
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
   const rContainer=document.querySelector('.br-r');
   if(rContainer) {
     if(id==='practical'){ rContainer.style.marginTop='45px'; }
     else { rContainer.style.marginTop='118px'; }
   }
   const c=document.getElementById('br-content');c.innerHTML='';
   const card=document.createElement('div');card.className='bc-card';
   if(id==='intro'){
     card.innerHTML=`<div class="bc-ttl">📖 Module Overview</div>
     <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(1.6rem, 4vw, 2.5rem);color:var(--yellow);margin-bottom:8px">${lv.name}</div>
     <div style="font-size:clamp(0.95rem, 2vw, 1.35rem);color:var(--muted2);line-height:1.5;margin-bottom:16px">${lv.ds}</div>
     <div class="stat-row">
       <div class="stat-box"><div class="stat-val">${lv.hps.length}</div><div class="stat-lbl">Mandates</div></div>
       <div class="stat-box"><div class="stat-val">${lv.law.fine}</div><div class="stat-lbl">Penalty</div></div>
     </div>`;
   } else if(id.startsWith('rule')){
     const idx=parseInt(id.replace('rule',''));const hp=lv.hps[idx];
     card.innerHTML=`<div class="bc-ttl">⚖️ Regulatory Requirement</div><div class="bc-rule-pill">Clause ${idx+1}</div><div class="bc-rule-txt">${hp}</div>
     <div class="bc-next-btn" style="display:flex;justify-content:space-between;"><button class="btn btn-s" onclick="ui._selSyl('${idx>0?'rule'+(idx-1):'intro'}')">${'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>'} Previous</button>${idx<lv.hps.length-1?`<button onclick="ui._selSyl('rule${idx+1}')">Next Clause &rarr;</button>`:`<button onclick="ui._selSyl('law')">Legal Framework &rarr;</button>`}</div>`;
   } else if(id==='law'){
     card.innerHTML=`<div class="bc-ttl">🏛️ Statutory Provisions</div><div class="lb"><div class="ls">${lv.law.sec}</div><div class="lt">${lv.law.off}</div></div><div class="fr"><div class="fl">Fine Amount</div><div class="fa">${lv.law.fine}</div></div>
     <div class="bc-next-btn" style="display:flex;justify-content:space-between;"><button class="btn btn-s" onclick="ui._selSyl('rule'+(lv.hps.length-1))"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Previous</button><button onclick="ui._selSyl('theory')">Concepts &rarr;</button></div>`;
   } else if(id==='theory'){
     card.innerHTML=`<div class="bc-ttl">📊 Analytical Model</div><div class="dw">${this._diag(lv.id)}</div><div style="font-size:clamp(0.95rem, 2.2vw, 1.3rem);line-height:1.6;color:var(--muted2);margin-bottom:12px">${lv.theory}</div>
     <div class="bc-next-btn" style="display:flex;justify-content:space-between;"><button class="btn btn-s" onclick="ui._selSyl('law')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Previous</button><button onclick="ui._selSyl('practical')">Start Simulation &rarr;</button></div>`;
   } else if(id==='practical'){
      card.innerHTML=`<div class="bc-ttl">📖 Practical Mission</div>
      <div class="bc-next-btn" style="display:flex;gap:12px;justify-content:space-between;width:100%;margin-bottom:20px;border:none;padding:0;">
        <button class="btn btn-s" onclick="ui._selSyl('theory')"><span style="display:flex;align-items:center;gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Previous</span></button>
      </div>
      <div class="pract-banner" style="background:${lv.gr};height:auto;flex-direction:row;justify-content:space-between;padding:clamp(16px, 3vw, 24px);text-align:left;flex-wrap:wrap;border-radius:16px;overflow:hidden;">
        <div style="display:flex;align-items:flex-start;gap:clamp(16px, 4vw, 32px);flex:1;min-width:280px">
          <div class="pract-icon-big" style="font-size:5.5rem;line-height:1;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.2));">${lv.icon}</div>
          <div class="pract-veh-tag" style="background:transparent;padding:0;border-radius:0;flex:1">
            <div class="pv1" style="font-size:clamp(1.4rem, 2.8vw, 2rem);letter-spacing:0.05em;font-family:'Lora',serif;font-weight:700;">${lv.name}</div>
            <div class="pv2" style="font-size:clamp(0.9rem, 2vw, 1.2rem);color:rgba(255,255,255,.8)">${lv.v}</div>
            <div style="font-size:clamp(0.9rem, 1.8vw, 1.25rem);color:rgba(255,255,255,0.95);margin-top:10px;line-height:1.5;border-top:1px solid rgba(255,255,255,0.3);padding-top:10px">${lv.pract}</div>
<div style="font-size:clamp(0.8rem, 1.5vw, 1rem);color:var(--yellow);margin-top:15px;line-height:1.4;background:rgba(0,0,0,0.3);padding:10px;border-radius:8px;">⚠️ Note: If you crash, you can Try Again. However, unless you achieve a PERFECT drive on your retry (No violations, No damage), your final score will be penalized!</div>
          </div>
        </div>
        <div style="background:rgba(0,0,0,.25);padding:14px 20px;border-radius:16px;border:1px solid rgba(255,255,255,.15);display:flex;justify-content:space-between;align-items:center;margin-top:16px;width:100%;gap:20px;">
          <div style="text-align:left;flex:1;">
            <div style="font-size:clamp(0.75rem, 1.4vw, 0.85rem);color:rgba(255,255,255,0.75);text-transform:uppercase;font-weight:800;letter-spacing:0.05em;margin-bottom:4px">Penalty Reason</div>
            <div style="font-size:clamp(0.9rem, 1.6vw, 1.1rem);color:#fff;font-weight:600;line-height:1.4">${lv.law.off}</div>
          </div>
          <div style="text-align:right;border-left:1px solid rgba(255,255,255,0.2);padding-left:20px;">
            <div style="font-size:clamp(0.75rem, 1.4vw, 0.85rem);color:rgba(255,255,255,0.75);text-transform:uppercase;font-weight:800;letter-spacing:0.05em;margin-bottom:4px">Penalty</div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(1.8rem, 3.5vw, 2.5rem);color:#fff;line-height:1">${lv.law.fine}</div>
          </div>
        </div>
      </div>
      <div style="text-align:center;margin-top:24px">
        <button class="btn btn-p" onclick="game.startLevel()" style="font-size:clamp(1.1rem, 2.5vw, 1.5rem);padding:clamp(14px, 3vw, 20px) clamp(40px, 6vw, 60px)">${ui.cur&&ui.cur.mode==='pedestrian'?'🚶 Start Walking':'🚦 Start Driving'}</button>
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
 showQuiz(){
   this.qst={qs:this.cur.quiz,cur:0,pass:0};this._rq();this.show('screen-quiz');
   this.quizTimeLeft = 120;
   const qt = document.getElementById('qtimer');
   if(qt) qt.textContent = '02:00';
   if(this.quizTimerInterval) clearInterval(this.quizTimerInterval);
   this.quizTimerInterval = setInterval(() => {
     this.quizTimeLeft--;
     if(this.quizTimeLeft <= 0) {
       clearInterval(this.quizTimerInterval);
       toast('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Time Up!', '#ff3b30');
       this._fq();
     } else {
       if(qt) {
         const m = Math.floor(this.quizTimeLeft / 60);
         const s = this.quizTimeLeft % 60;
         qt.textContent = '0' + m + ':' + (s < 10 ? '0' : '') + s;
       }
     }
   }, 1000);
 },
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
   if(idx===q.a){fb.textContent='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Correct!';fb.className='qfb ok';s.pass++;sfx.play('ok');}
   else{fb.textContent=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Incorrect. Correct: "${q.o[q.a]}"`;fb.className='qfb no';sfx.play('error');}
   const nb=document.getElementById('qnxt');nb.style.display='inline-block';nb.textContent=s.cur<s.qs.length-1?'Next  ':'See Results  ';
 },
 nextQ(){const s=this.qst;s.cur++;if(s.cur<s.qs.length)this._rq();else this._fq();},
 _fq(){const s=this.qst;if(s.pass<s.qs.length){toast(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> ${s.pass}/${s.qs.length} correct 🔄 retry!`,'#ff3b30');setTimeout(()=>this.showQuiz(),900);return;}this.showResults(game.fs,game.fst);},
 showResults(score,stats){
   if(this.quizTimerInterval) clearInterval(this.quizTimerInterval);
   if(window.confetti){ confetti.init(); confetti.burst(4000); }
   const lv=this.cur,prev=S.comp[lv.id]?.score||0;
   S.comp[lv.id]={score:Math.max(score,prev),time:Date.now()};S.total+=score;save();
   let be=null;
   if(lv.badge&&!S.badges.includes(lv.badge.id)){S.badges.push(lv.badge.id);be=lv.badge;}
   if(!S.badges.includes('signal_master')&&Object.keys(S.comp).length>=5&&!stats.vio)S.badges.push('signal_master');
   if(S.badges.includes('traffic_hero')&&!S.badges.includes('smart_citizen'))S.badges.push('smart_citizen');
   save();
   document.getElementById('rico').textContent=score>200?'🌟':'⭐';
   document.getElementById('rtit').textContent='Level Complete!';
   document.getElementById('rsub').textContent=lv.name+' 🔄 Well done!';
   document.getElementById('rcard').innerHTML=`<div class="rr"><span class="rl">Score</span><span class="rv">⭐ ${Math.round(score)}</span></div><div class="rr"><span class="rl">Quiz</span><span class="rv"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Passed</span></div>${stats.fin?`<div class="rr"><span class="rl">Fines issued</span><span class="rv" style="color:var(--red)">${stats.fin}</span></div>`:''}<div class="rr"><span class="rl">Violations</span><span class="rv" style="color:${stats.vio?'var(--red)':'var(--green)'}">${stats.vio||'None <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'}</span></div><div class="rr"><span class="rl">Level</span><span class="rv">${lv.id} / 15</span></div>`;
   const bb=document.getElementById('rbdg');
   if(be){bb.className='bdx on';bb.innerHTML=`<div class="bi">${be.icon}</div><div class="bn">🎖️ ${be.name}</div><div class="bd">${be.desc}</div>`;}else bb.className='bdx';
   document.getElementById('rnxt').style.display=LVS.find(l=>l.id===lv.id+1)?'inline-block':'none';
   this.show('screen-results');sfx.play('ok');
   if(window.confetti){ confetti.init(); confetti.burst(3500); }
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
   <div style="display:flex;justify-content:space-between"><span>Player name</span><strong style="color:var(--text)">${S.name||'🔄'}</strong></div>`;}
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
     if(cstat)cstat.innerHTML="🚧 Preview Mode 🔄 Complete all 15 levels to unlock ("+done+"/15 done)";
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
            c.style.height = '756px';
            c.style.maxWidth = 'none';
            c.style.transform = 'none';
            c.style.margin = '0 auto';
            c.style.padding = '40px 60px';
            c.style.display = 'flex';
            c.style.flexDirection = 'column';
            c.style.justifyContent = 'center';
            c.style.boxSizing = 'border-box';
          }
        }
      },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' },
      pagebreak:    { mode: 'avoid-all' }
    };
    
    toast('Generating PDF...', '#ffd54a');
    html2pdf().set(opt).from(element).save().then(()=> {
      toast('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Certificate downloaded!', '#00c851');
    }).catch(err => {
      console.error(err);
      toast('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> PDF Error!', '#ff3b30');
    });
  },
 issueChallan(off,sec,amt,loc,cb){
  if(!game.challanLog) game.challanLog = [];
  game.challanLog.push({off,sec,amt,loc});
  this.cq.push({off,sec,amt,loc,cb});
  toast(`⚠️ E-CHALLAN ISSUED`, '#ff3b30');
   // Deduct score for violation
   const fineNum = parseInt(String(amt).replace(/[^0-9]/g,'')) || 100;
   if(game && game.score !== undefined) { game.score = Math.max(0, game.score - Math.round(fineNum/2)); }
  sfx.play('error');
  if(!this.cbusy) this._nc();
 },
 _nc(){
  if(!this.cq.length)return;
  this.cbusy=true;
  const c=this.cq.shift();
  const cov=document.getElementById('cov');
  if(cov){
   document.getElementById('cr').textContent=c.off;
   document.getElementById('cs').textContent=c.sec;
   document.getElementById('ca').textContent=c.amt;
   document.getElementById('cloc').textContent=c.loc;
   cov.style.display='flex';
   setTimeout(() => cov.classList.add('on'), 10);
   setTimeout(()=>{
    cov.classList.remove('on');
    if(c.cb)c.cb();
    setTimeout(()=>{this.cbusy=false;this._nc();},300);
   },3500);
  }
 },
 dismissChallan(){
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
      if(this._ccb){this._ccb();this._ccb=null;}
      if(game.playing)game.pause=false;
      setTimeout(()=>this._nc(),80);
    }, 500);
  }
};

// 🚦 PROCEDURAL ENGINE AND SCENARIO ARRAYS 🚦
  // Texture Generator
  const _genTex=(type)=>{
    const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');
    if(type==='asphalt'){
      ctx.fillStyle='#21232b';ctx.fillRect(0,0,256,256);
      for(let i=0;i<5000;i++){ctx.fillStyle=Math.random()>.5?'#2a2c36':'#1a1c22';ctx.fillRect(Math.random()*256,Math.random()*256,2,2);}
    } else if(type==='pave'){
      ctx.fillStyle='#666666';ctx.fillRect(0,0,256,256);
      ctx.strokeStyle='#555555';ctx.lineWidth=2;
      for(let y=0;y<256;y+=32){for(let x=0;x<256;x+=32){ctx.strokeRect(x,y,32,32);}}
    } else if(type==='building'){
      ctx.fillStyle='#d3d3d3';ctx.fillRect(0,0,256,256);
      ctx.fillStyle='#95a5a6'; for(let y=0;y<256;y+=64){ctx.fillRect(0,y+32,256,4);}
      for(let x=0;x<256;x+=64){ctx.fillRect(x,0,4,256);}
    } else if(type==='police'){
      ctx.fillStyle='#2980b9';ctx.fillRect(0,0,256,256);
      ctx.fillStyle='#34495e'; for(let y=0;y<256;y+=32){ctx.fillRect(0,y,256,2);}
      for(let x=0;x<256;x+=64){for(let y=0;y<256;y+=32){ctx.fillRect(x+(y%64===0?32:0),y,2,32);}}
    } else if(type==='hospital'){
      ctx.fillStyle='#ecf0f1';ctx.fillRect(0,0,256,256);
      ctx.fillStyle='#bdc3c7'; for(let y=0;y<256;y+=32){for(let x=0;x<256;x+=32){ctx.strokeRect(x,y,32,32);}}
    } else if(type==='bank'){
      ctx.fillStyle='#7f8c8d';ctx.fillRect(0,0,256,256);
      const grd=ctx.createLinearGradient(0,0,0,256); grd.addColorStop(0,'#95a5a6'); grd.addColorStop(1,'#7f8c8d');
      ctx.fillStyle=grd; ctx.fillRect(0,0,256,256);
      ctx.fillStyle='#2c3e50'; for(let x=0;x<256;x+=40){ctx.fillRect(x,0,8,256);}
    } else if(type==='temple'){
      ctx.fillStyle='#d35400';ctx.fillRect(0,0,256,256);
      ctx.fillStyle='#e67e22'; for(let y=0;y<256;y+=16){ctx.fillRect(0,y,256,2);}
      for(let x=0;x<256;x+=32){for(let y=0;y<256;y+=16){ctx.fillRect(x+(y%32===0?16:0),y,2,16);}}
    } else if(type==='shop'){
      ctx.fillStyle='#f1c40f';ctx.fillRect(0,0,256,256);
      ctx.fillStyle='#d35400'; for(let y=0;y<256;y+=128){ctx.fillRect(0,y,256,16);}
    } else if(type==='car'){
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,256,256);
      ctx.fillStyle='#000000'; ctx.fillRect(32,32,192,64); // windshield
      ctx.fillRect(32,160,192,64); // rear window
      ctx.fillStyle='#c0392b'; ctx.fillRect(16,220,64,36); ctx.fillRect(176,220,64,36); // taillights
      ctx.fillStyle='#f1c40f'; ctx.fillRect(16,0,64,32); ctx.fillRect(176,0,64,32); // headlights
    }
    const tex=new THREE.CanvasTexture(c);tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
    if(type==='pave'||type==='asphalt')tex.repeat.set(4,4);
    else if(type==='building'||type==='bank'||type==='temple'||type==='police'||type==='hospital')tex.repeat.set(2,2);
    return tex;
  };
  
  const gTex = {
    asphalt: _genTex('asphalt'),
    pave: _genTex('pave'),
    building: _genTex('building'),
    police: _genTex('police'), hospital: _genTex('hospital'), bank: _genTex('bank'), 
    temple: _genTex('temple'), shop: _genTex('shop'), car: _genTex('car')
  };


  
    const _buildVehicle = (type, col) => { return window.IndianVehicles.buildVehicle(type, col); };
    
class Game {
 constructor(){
  this.renderer=null;this.scene=null;this.camera=null;this.player=null;
  this.clock=new THREE.Clock();this.keys={};this.speed=0;this.maxSpd=.9;this.accel=.022;this.fric=.93;this.turn=.032;this.gear='N';this.gcap=0;
  this._camTarget = new THREE.Vector3();
  this.playing=false;this.pause=false;this.score=0;this.hp=100;this.fine=0;this.vio=0;this.timer=0;
  this.world=[];this.npcs=[];this.sigs=[];this.cps=[];this.spc=[];this.obstacles=[];this.roadSegments=[];this.driveRoute=[];this.peds=[];this.routeIdx=0; this.retries=0;
  this._initR();this._initIn();this._initG();this._loop();
  window.addEventListener('resize',()=>this._rsz());
 }
 _initR(){
  const cv=document.getElementById('3c');this.renderer=new THREE.WebGLRenderer({canvas:cv,antialias:!mob()});
  this.renderer.setSize(innerWidth,innerHeight);this.renderer.setPixelRatio(Math.min(devicePixelRatio,mob()?1.5:2));
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,400);
 }
 _rsz(){if(!this.renderer)return;this.renderer.setSize(innerWidth,innerHeight);if(this.camera){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}}
 _initIn(){
  window.addEventListener('keydown',e=>{this.keys[e.key.toLowerCase()]=true;const gm={p:'P',r:'R',n:'N',d:'D','1':'1','2':'2','3':'3','4':'4','5':'5'};if(gm[e.key.toLowerCase()])this.setGear(gm[e.key.toLowerCase()]);if(e.key===' ')this._horn();if(e.key.toLowerCase()==='b')this._brake();});
  window.addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);

  // Mobile Controls Bindings
  const bindTouch = (id, key) => {
    const el = document.getElementById(id);
    if(el) {
      el.addEventListener('touchstart', (e)=>{ e.preventDefault(); this.keys[key]=true; });
      el.addEventListener('touchend', (e)=>{ e.preventDefault(); this.keys[key]=false; });
    }
  };
  // Steering wheel logic
  window.analogSteering = 0;
  const swC = document.getElementById('steer-wheel-container');
  const sw = document.getElementById('steer-wheel');
  if(swC && sw) {
    let isDragging = false;
    let startAngle = 0;
    let currentRot = 0;
    
    const getAngle = (e) => {
      const rect = swC.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const t = e.targetTouches && e.targetTouches.length > 0 ? e.targetTouches[0] : (e.touches && e.touches.length > 0 ? e.touches[0] : e);
      return Math.atan2(t.clientY - cy, t.clientX - cx) * 180 / Math.PI;
    };
    
    const down = (e) => {
      isDragging = true;
      startAngle = getAngle(e) - currentRot;
    };
    swC.addEventListener('touchstart', down, {passive:true});
    swC.addEventListener('mousedown', down);
    
    const move = (e) => {
      if(!isDragging) return;
      if(e.cancelable) e.preventDefault();
      let angle = getAngle(e) - startAngle;
      if(angle > 90) angle = 90;
      if(angle < -90) angle = -90;
      currentRot = angle;
      sw.style.transform = `rotate(${currentRot}deg)`;
      window.analogSteering = currentRot / 90;
    };
    swC.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('mousemove', move);
    
    const up = () => {
      isDragging = false;
      currentRot = 0;
      sw.style.transform = `rotate(0deg)`;
      window.analogSteering = 0;
    };
    swC.addEventListener('touchend', up);
    swC.addEventListener('touchcancel', up);
    window.addEventListener('mouseup', up);
  }

  bindTouch('mc-gas', 'arrowup');
  bindTouch('mc-brake', 'arrowdown');


  const sb=(id,k)=>{const el=document.getElementById(id);if(!el)return;
    const dn=e=>{e.preventDefault();this.keys[k]=true};const up=e=>{e.preventDefault();this.keys[k]=false};
    el.addEventListener('touchstart',dn,{passive:false});el.addEventListener('touchend',up,{passive:false});
    el.addEventListener('mousedown',dn);el.addEventListener('mouseup',up);el.addEventListener('mouseleave',up);};
  sb('tl','arrowleft');sb('tr','arrowright');sb('tu','arrowup');sb('abb','b');sb('abh',' ');
 }
 _initG(){document.querySelectorAll('.gb').forEach(b=>{b.addEventListener('click',()=>this.setGear(b.dataset.g));b.addEventListener('touchstart',e=>{e.preventDefault();this.setGear(b.dataset.g);},{passive:false});});}
 setGear(g){
  const caps={P:0,R:.28,N:0,D:.50,'1':.18,'2':.28,'3':.42,'4':.60,'5':.85};
  const newCap=caps[g]??0;
  this.gear=g;
  // Clamp speed immediately on gear change
  if(g==='P'||g==='N'){this.speed*=.1;}
  else if(this.speed>0&&newCap<this.gcap&&this.speed>newCap){this.speed=newCap*0.92;}
  this.gcap=newCap;
  document.getElementById('gread').textContent='GEAR: '+g;
  document.querySelectorAll('.gb').forEach(b=>b.classList.toggle('ag',b.dataset.g===g));
 }
 _horn(){if(this.mode==='silentzone'&&this.ms.inSz){this.vio++;this.score-=50;this.fine+=2000;ui.issueChallan('Horn in silent zone','Sec 190(2) MV Act','₹2,000','Hospital Perimeter Zone');}else{toast('📢 Beep Beep!','#ffd54a');sfx.play('horn');}}
 _brake(){this.speed*=.35;sfx.play('brake');toast('🛑 Hard Deceleration Active','#fff');}
 startLevel(){const cd=document.getElementById('cdown');cd.classList.add('on');setTimeout(()=>{cd.classList.remove('on');this._actualStart(ui.cur);},1500);}
 _actualStart(lv){
  this.mode=lv.mode;this.lvId=lv.id;this.score=0;this.hp=100;this.fine=0;this.vio=0;this.timer=0;this.speed=0;this.routeIdx=0; this.retries=0; this.vx=0; this.vz=0;
  this.ms={inSz:false,passed:false,amb:null};
  this.challanFired=new Set();
  // Reset challan tracking for this run
  if(game.challanLog) game.challanLog = [];
  const cStack = document.getElementById('challan-stack');
  if(cStack){ cStack.innerHTML=''; cStack.classList.remove('on'); }
  if(ui.cq) ui.cq = [];
  ui.cbusy = false;
  this.setGear('N');
  this._buildScene(lv.mode);this.playing=true;this.pause=false;ui.show(null);this.timeLimit=this.mapCfg?this.mapCfg.timeLimit||120:120;
  const cfg=this.mapCfg||{};
   ['gc','hud','hudbar','hwrap','mobile-controls'].forEach(id=>{const el=document.getElementById(id); if(el) el.classList.add('on');});
   if(!cfg.isPedestrian){['spgauge','gp'].forEach(id=>document.getElementById(id).classList.add('on'));}
  if(mob())document.getElementById('tc').classList.add('on');
  document.getElementById('hlv').textContent=lv.id;document.getElementById('hobj').textContent=lv.tg;this._uh();sfx.play('ok');
 }
 stopPlay(){this.playing=false;['gc','hud','hudbar','hwrap','spgauge','gp','tc','mobile-controls'].forEach(i=>{const el=document.getElementById(i); if(el) el.classList.remove('on');});document.getElementById('mmc').classList.remove('on');document.getElementById('da').style.display='none';const si=document.getElementById('sig-ind');if(si)si.style.display='none';const ow=document.getElementById('ow');if(ow)ow.classList.remove('on');}
 _uh(){const p=Math.max(0,this.hp);const f=document.getElementById('hfill');if(f)f.style.width=p+'%';if(p<=0)this._go("Structural Failure");}
 _go(reason){
    this.stopPlay();
    toast('💥 ' + (reason || 'Structural Failure!'), '#ff3b30');
    setTimeout(() => {
      const cr = document.getElementById('crash-reason');
      const ci = document.getElementById('crash-info');
      let rLife = "Dangerous driving can lead to severe structural damage and potential injury.";
      
      const rLower = (reason || "").toLowerCase();
      if (rLower.includes('pedestrian')) {
          rLife = "Sec 304A IPC: Causing death by negligence can result in up to 2 years imprisonment. Always yield to pedestrians!";
      } else if (rLower.includes('off-road')) {
          rLife = "Off-roading in urban limits damages pavements, endangers pedestrian lives, and attracts strict penalties under local traffic regulations.";
      } else if (rLower.includes('barricade')) {
          rLife = "Damaging public property or barricades is a punishable offense under the Prevention of Damage to Public Property Act.";
      } else if (rLower.includes('vehicle') || rLower.includes('car') || rLower.includes('bus') || rLower.includes('auto')) {
          rLife = "Under Sec 279 IPC, rash driving leading to a crash can result in imprisonment up to 6 months, a heavy fine, or both.";
      } else if (rLower.includes('time')) {
          rLife = "Time Management is crucial for emergency vehicles. Failing to reach the destination in time can cost lives.";
      }
      
      if (cr) cr.textContent = reason || "Structural Failure";
      if (ci) ci.textContent = rLife;
      
      document.getElementById('crash-screen').style.display = 'flex';
    }, 500);
  }
  retryLevel(){
    document.getElementById('crash-screen').style.display='none';
    this.retries = (this.retries || 0) + 1;
    this._actualStart(ui._sylLv || ui.cur);
  }
 completeLevel(){
    if(!this.playing)return;
    let finalBase = this.score + 500;
    if(this.retries > 0) {
       if (this.vio > 0 || this.hp < 100) {
           finalBase = Math.round(finalBase * 0.5); // 50% penalty if retry and not perfect
       }
    }
    this.fs=Math.max(0, finalBase);
    if(window.confetti){ confetti.init(); confetti.burst(4000); }
    this.fst={fin:this.fine?'₹'+this.fine:'',vio:this.vio};
    this.stopPlay();
    toast('🏁 Run Evaluated!','#00c851');
    // Show Mission Complete overlay first
    const _mco = document.createElement('div');
    _mco.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:fadeIn 0.3s ease;';
    _mco.innerHTML='<div style="text-align:center;animation:cdownPulse 0.5s ease;"><div style="font-size:4rem;margin-bottom:16px;">🏆</div><h1 style="color:#ffd54a;font-size:2.5rem;font-family:Bebas Neue,sans-serif;letter-spacing:0.05em;margin-bottom:8px;text-shadow:0 4px 20px rgba(255,213,74,0.4);">MISSION COMPLETE!</h1><div style="color:white;font-size:1.5rem;font-weight:700;margin-bottom:12px;">Score: '+game.fs+'</div><div style="color:rgba(255,255,255,0.6);font-size:0.95rem;">Proceeding to quiz...</div></div>';
    document.body.appendChild(_mco);
    setTimeout(()=>{ _mco.remove(); ui.showQuiz(); }, 3000);
  }

// 🚦 MAP CONFIGURATIONS FOR ALL 15 MUMBAI LEVELS 🚦
 _getMapConfig(lvId){
  const M={
   1:{name:'Andheri Junction',sky:0x87b6d8,fog:300,ground:0x33691e,amb:0.8,veh:'car',npcTypes:['car','car','bike','auto','bus','truck','car','bike','taxi','car','auto','car','car','bike','bus','car','auto','truck','car','car','car','bike','auto','car'],roads:[{type:'v',x:0,z1:-140,z2:1000},{type:'h',z:-120,x1:-20,x2:140},{type:'h',z:-120,x1:100,x2:260},{type:'v',x:240,z1:-140,z2:20},{type:'v',x:240,z1:-20,z2:140},{type:'v',x:240,z1:100,z2:260},{type:'h',z:240,x1:100,x2:260},{type:'h',z:240,x1:-20,x2:140},{type:'v',x:0,z1:100,z2:260},{type:'h',z:120,x1:-140,x2:20},{type:'v',x:-120,z1:-20,z2:140},{type:'v',x:-120,z1:-140,z2:20},{type:'h',z:-120,x1:-260,x2:-100},{type:'h',z:-120,x1:-380,x2:-220},{type:'h',z:-120,x1:-500,x2:-340},{type:'v',x:-480,z1:-260,z2:-100},{type:'h',z:-240,x1:-500,x2:-340},{type:'v',x:-360,z1:-380,z2:-220},{type:'h',z:-360,x1:-380,x2:-220},{type:'h',z:-360,x1:-260,x2:880},{type:'h',z:120,x1:-1000,x2:1000},{type:'v',x:0,z1:-880,z2:1120},{type:'h',z:240,x1:-760,x2:1240},{type:'v',x:240,z1:-760,z2:1240},{type:'h',z:0,x1:-760,x2:1240},{type:'v',x:240,z1:-1000,z2:1000},{type:'h',z:240,x1:-1000,x2:1000},{type:'v',x:0,z1:-760,z2:1240},{type:'h',z:-240,x1:-1480,x2:520},{type:'v',x:-480,z1:-1240,z2:760}],route:[{x:0,z:0},{x:0,z:-120},{x:120,z:-120},{x:240,z:-120},{x:240,z:0},{x:240,z:120},{x:240,z:240},{x:120,z:240},{x:0,z:240},{x:0,z:120},{x:-120,z:120},{x:-120,z:0},{x:-120,z:-120},{x:-240,z:-120},{x:-360,z:-120},{x:-480,z:-120},{x:-480,z:-240},{x:-360,z:-240},{x:-360,z:-360},{x:-240,z:-360},{x:-120,z:-360}],ints:[[240,0],[0,240],[-120,-360],[0,120],[-240,-120],[0,0],[-360,-240],[120,240],[240,-120],[-360,-360],[-360,-120],[-120,0],[240,240],[-120,120],[0,-120],[-120,-120],[-480,-240],[120,-120],[-480,-120],[-240,-360],[240,120]],bldg:[{x:-22,z1:-120,z2:0,s:0.9},{x:22,z1:-120,z2:0,s:0.9},{x:218,z1:-120,z2:0,s:0.9},{x:262,z1:-120,z2:0,s:0.9},{x:218,z1:0,z2:120,s:0.9},{x:262,z1:0,z2:120,s:0.9},{x:218,z1:120,z2:240,s:0.9},{x:262,z1:120,z2:240,s:0.9},{x:-22,z1:120,z2:240,s:0.9},{x:22,z1:120,z2:240,s:0.9},{x:-142,z1:0,z2:120,s:0.9},{x:-98,z1:0,z2:120,s:0.9},{x:-142,z1:-120,z2:0,s:0.9},{x:-98,z1:-120,z2:0,s:0.9},{x:-502,z1:-240,z2:-120,s:0.9},{x:-458,z1:-240,z2:-120,s:0.9},{x:-382,z1:-360,z2:-240,s:0.9},{x:-338,z1:-360,z2:-240,s:0.9}],timeLimit:600,hasGarage:true},
   2:{name:'Dadar Junction',sky:0x9ec5d9,fog:250,ground:0x4a6741,amb:0.85,isPedestrian:true,veh:'pedestrian',npcTypes:['car','bus','auto','car','bike','truck','car','auto','taxi','car','bus','auto','car','bike','car','auto','car','bus','truck','car','auto','car','car','bike'],sidewalkWidth:5,roads:[{type:'h',z:0,x1:-140,x2:1000},{type:'v',x:-120,z1:-140,z2:20},{type:'h',z:-120,x1:-260,x2:-100},{type:'v',x:-240,z1:-140,z2:20},{type:'v',x:-240,z1:-20,z2:140},{type:'h',z:120,x1:-380,x2:-220},{type:'h',z:120,x1:-500,x2:-340},{type:'v',x:-480,z1:-20,z2:140},{type:'h',z:0,x1:-620,x2:-460},{type:'v',x:-600,z1:-20,z2:140},{type:'v',x:-600,z1:100,z2:260},{type:'v',x:-600,z1:220,z2:380},{type:'h',z:360,x1:-740,x2:-580},{type:'v',x:-720,z1:340,z2:500},{type:'h',z:480,x1:-860,x2:-700},{type:'h',z:480,x1:-980,x2:-820},{type:'h',z:480,x1:-1100,x2:-940},{type:'v',x:-1080,z1:340,z2:500},{type:'h',z:360,x1:-1220,x2:-1060},{type:'v',x:-1200,z1:340,z2:500},{type:'h',z:480,x1:-1340,x2:-1180},{type:'h',z:480,x1:-1460,x2:-1300},{type:'v',x:-1440,z1:460,z2:620},{type:'v',x:-1440,z1:580,z2:1720},{type:'h',z:360,x1:-1720,x2:280},{type:'v',x:-720,z1:-640,z2:1360},{type:'h',z:120,x1:-1240,x2:760},{type:'v',x:-240,z1:-880,z2:1120},{type:'h',z:480,x1:-1840,x2:160},{type:'v',x:-840,z1:-520,z2:1480},{type:'h',z:120,x1:-1240,x2:760},{type:'v',x:-240,z1:-880,z2:1120},{type:'h',z:120,x1:-1600,x2:400},{type:'v',x:-600,z1:-880,z2:1120}],route:[{x:0,z:0},{x:-120,z:0},{x:-120,z:-120},{x:-240,z:-120},{x:-240,z:0},{x:-240,z:120},{x:-360,z:120},{x:-480,z:120},{x:-480,z:0},{x:-600,z:0},{x:-600,z:120},{x:-600,z:240},{x:-600,z:360},{x:-720,z:360},{x:-720,z:480},{x:-840,z:480},{x:-960,z:480},{x:-1080,z:480},{x:-1080,z:360},{x:-1200,z:360},{x:-1200,z:480},{x:-1320,z:480},{x:-1440,z:480},{x:-1440,z:600},{x:-1440,z:720}],ints:[[-600,240],[-600,0],[-1440,600],[-240,120],[-240,-120],[-480,120],[-480,0],[0,0],[-1200,480],[-1080,360],[-1080,480],[-1440,720],[-840,480],[-1200,360],[-1320,480],[-360,120],[-720,480],[-120,0],[-120,-120],[-240,0],[-720,360],[-600,120],[-1440,480],[-600,360],[-960,480]],bldg:[{x:-142,z1:-120,z2:0,s:0.9},{x:-98,z1:-120,z2:0,s:0.9},{x:-262,z1:-120,z2:0,s:0.9},{x:-218,z1:-120,z2:0,s:0.9},{x:-262,z1:0,z2:120,s:0.9},{x:-218,z1:0,z2:120,s:0.9},{x:-502,z1:0,z2:120,s:0.9},{x:-458,z1:0,z2:120,s:0.9},{x:-622,z1:0,z2:120,s:0.9},{x:-578,z1:0,z2:120,s:0.9},{x:-622,z1:120,z2:240,s:0.9},{x:-578,z1:120,z2:240,s:0.9},{x:-622,z1:240,z2:360,s:0.9},{x:-578,z1:240,z2:360,s:0.9},{x:-742,z1:360,z2:480,s:0.9},{x:-698,z1:360,z2:480,s:0.9},{x:-1102,z1:360,z2:480,s:0.9},{x:-1058,z1:360,z2:480,s:0.9},{x:-1222,z1:360,z2:480,s:0.9},{x:-1178,z1:360,z2:480,s:0.9},{x:-1462,z1:480,z2:600,s:0.9},{x:-1418,z1:480,z2:600,s:0.9},{x:-1462,z1:600,z2:720,s:0.9},{x:-1418,z1:600,z2:720,s:0.9}],timeLimit:720,hasGarage:true},
   3:{name:'Bandra Backroads',sky:0xa8c4d8,fog:250,ground:0x3a5a2e,amb:0.75,veh:'twowheeler',npcTypes:['car','auto','bike','cycle','auto','car','taxi','bike','auto','car','bike','car','auto','cycle','car','bike','auto','car'],roads:[{type:'v',x:0,z1:-140,z2:1000},{type:'h',z:-120,x1:-20,x2:140},{type:'v',x:120,z1:-260,z2:-100},{type:'h',z:-240,x1:-20,x2:140},{type:'h',z:-240,x1:-140,x2:20},{type:'h',z:-240,x1:-260,x2:-100},{type:'v',x:-240,z1:-380,z2:-220},{type:'h',z:-360,x1:-260,x2:-100},{type:'v',x:-120,z1:-500,z2:-340},{type:'h',z:-480,x1:-260,x2:-100},{type:'v',x:-240,z1:-620,z2:-460},{type:'v',x:-240,z1:-740,z2:-580},{type:'h',z:-720,x1:-380,x2:-220},{type:'h',z:-720,x1:-500,x2:-340},{type:'h',z:-720,x1:-620,x2:-460},{type:'v',x:-600,z1:-860,z2:-700},{type:'h',z:-840,x1:-620,x2:-460},{type:'v',x:-480,z1:-980,z2:-820},{type:'v',x:-480,z1:-1100,z2:-940},{type:'h',z:-1080,x1:-500,x2:-340},{type:'v',x:-360,z1:-1220,z2:-1060},{type:'h',z:-1200,x1:-380,x2:-220},{type:'v',x:-240,z1:-1220,z2:-1060},{type:'h',z:-1080,x1:-260,x2:-100},{type:'h',z:-1080,x1:-140,x2:20},{type:'h',z:-1080,x1:-20,x2:140},{type:'h',z:-1080,x1:100,x2:260},{type:'h',z:-1080,x1:220,x2:1360},{type:'h',z:-1080,x1:-1000,x2:1000},{type:'v',x:0,z1:-2080,z2:-80},{type:'h',z:-240,x1:-880,x2:1120},{type:'v',x:120,z1:-1240,z2:760},{type:'h',z:-1080,x1:-1120,x2:880},{type:'v',x:-120,z1:-2080,z2:-80},{type:'h',z:-360,x1:-1240,x2:760},{type:'v',x:-240,z1:-1360,z2:640},{type:'h',z:-120,x1:-1000,x2:1000},{type:'v',x:0,z1:-1120,z2:880}],route:[{x:0,z:0},{x:0,z:-120},{x:120,z:-120},{x:120,z:-240},{x:0,z:-240},{x:-120,z:-240},{x:-240,z:-240},{x:-240,z:-360},{x:-120,z:-360},{x:-120,z:-480},{x:-240,z:-480},{x:-240,z:-600},{x:-240,z:-720},{x:-360,z:-720},{x:-480,z:-720},{x:-600,z:-720},{x:-600,z:-840},{x:-480,z:-840},{x:-480,z:-960},{x:-480,z:-1080},{x:-360,z:-1080},{x:-360,z:-1200},{x:-240,z:-1200},{x:-240,z:-1080},{x:-120,z:-1080},{x:0,z:-1080},{x:120,z:-1080},{x:240,z:-1080},{x:360,z:-1080}],ints:[[-240,-240],[-360,-720],[-120,-360],[-480,-960],[0,0],[-120,-480],[-600,-720],[-240,-480],[120,-240],[120,-1080],[-480,-720],[0,-240],[-480,-1080],[-600,-840],[-240,-1080],[-120,-1080],[240,-1080],[-360,-1080],[-240,-720],[360,-1080],[-360,-1200],[0,-1080],[-240,-1200],[0,-120],[120,-120],[-480,-840],[-240,-360],[-240,-600],[-120,-240]],bldg:[{x:-22,z1:-120,z2:0,s:0.9},{x:22,z1:-120,z2:0,s:0.9},{x:98,z1:-240,z2:-120,s:0.9},{x:142,z1:-240,z2:-120,s:0.9},{x:-262,z1:-360,z2:-240,s:0.9},{x:-218,z1:-360,z2:-240,s:0.9},{x:-142,z1:-480,z2:-360,s:0.9},{x:-98,z1:-480,z2:-360,s:0.9},{x:-262,z1:-600,z2:-480,s:0.9},{x:-218,z1:-600,z2:-480,s:0.9},{x:-262,z1:-720,z2:-600,s:0.9},{x:-218,z1:-720,z2:-600,s:0.9},{x:-622,z1:-840,z2:-720,s:0.9},{x:-578,z1:-840,z2:-720,s:0.9},{x:-502,z1:-960,z2:-840,s:0.9},{x:-458,z1:-960,z2:-840,s:0.9},{x:-502,z1:-1080,z2:-960,s:0.9},{x:-458,z1:-1080,z2:-960,s:0.9},{x:-382,z1:-1200,z2:-1080,s:0.9},{x:-338,z1:-1200,z2:-1080,s:0.9},{x:-262,z1:-1200,z2:-1080,s:0.9},{x:-218,z1:-1200,z2:-1080,s:0.9}],timeLimit:830,hasGarage:true},
   4:{name:'Juhu Boulevard',sky:0x6fb8e0,fog:400,ground:0x2e6b3a,amb:0.9,veh:'car',npcTypes:['car','car','auto','bike','car','bus','taxi','car','auto','bike','car','car','bus','auto','car','bike','car','auto','car','taxi'],hasBeach:true,roads:[{type:'h',z:0,x1:-140,x2:1000},{type:'v',x:-120,z1:-140,z2:20},{type:'h',z:-120,x1:-260,x2:-100},{type:'h',z:-120,x1:-380,x2:-220},{type:'h',z:-120,x1:-500,x2:-340},{type:'h',z:-120,x1:-620,x2:-460},{type:'v',x:-600,z1:-260,z2:-100},{type:'h',z:-240,x1:-620,x2:-460},{type:'v',x:-480,z1:-380,z2:-220},{type:'h',z:-360,x1:-620,x2:-460},{type:'h',z:-360,x1:-740,x2:-580},{type:'v',x:-720,z1:-380,z2:-220},{type:'h',z:-240,x1:-860,x2:-700},{type:'v',x:-840,z1:-380,z2:-220},{type:'v',x:-840,z1:-500,z2:-340},{type:'h',z:-480,x1:-980,x2:-820},{type:'v',x:-960,z1:-500,z2:-340},{type:'h',z:-360,x1:-1100,x2:-940},{type:'v',x:-1080,z1:-500,z2:-340},{type:'v',x:-1080,z1:-620,z2:-460},{type:'h',z:-600,x1:-1220,x2:-1060},{type:'v',x:-1200,z1:-620,z2:-460},{type:'v',x:-1200,z1:-500,z2:-340},{type:'h',z:-360,x1:-1340,x2:-1180},{type:'h',z:-360,x1:-1460,x2:-1300},{type:'v',x:-1440,z1:-500,z2:-340},{type:'v',x:-1440,z1:-620,z2:-460},{type:'h',z:-600,x1:-1460,x2:-1300},{type:'v',x:-1320,z1:-620,z2:520},{type:'h',z:-360,x1:-1960,x2:40},{type:'v',x:-960,z1:-1360,z2:640},{type:'h',z:-360,x1:-1960,x2:40},{type:'v',x:-960,z1:-1360,z2:640},{type:'h',z:-360,x1:-1840,x2:160},{type:'v',x:-840,z1:-1360,z2:640},{type:'h',z:-120,x1:-1120,x2:880},{type:'v',x:-120,z1:-1120,z2:880},{type:'h',z:-120,x1:-1360,x2:640},{type:'v',x:-360,z1:-1120,z2:880}],route:[{x:0,z:0},{x:-120,z:0},{x:-120,z:-120},{x:-240,z:-120},{x:-360,z:-120},{x:-480,z:-120},{x:-600,z:-120},{x:-600,z:-240},{x:-480,z:-240},{x:-480,z:-360},{x:-600,z:-360},{x:-720,z:-360},{x:-720,z:-240},{x:-840,z:-240},{x:-840,z:-360},{x:-840,z:-480},{x:-960,z:-480},{x:-960,z:-360},{x:-1080,z:-360},{x:-1080,z:-480},{x:-1080,z:-600},{x:-1200,z:-600},{x:-1200,z:-480},{x:-1200,z:-360},{x:-1320,z:-360},{x:-1440,z:-360},{x:-1440,z:-480},{x:-1440,z:-600},{x:-1320,z:-600},{x:-1320,z:-480}],ints:[[-840,-240],[-1440,-360],[-480,-360],[-960,-360],[-1440,-600],[-1320,-600],[-960,-480],[-240,-120],[-1080,-600],[0,0],[-1440,-480],[-1200,-480],[-1200,-360],[-720,-360],[-1080,-480],[-600,-360],[-600,-120],[-1320,-360],[-360,-120],[-120,0],[-840,-360],[-1320,-480],[-1200,-600],[-120,-120],[-480,-240],[-480,-120],[-1080,-360],[-720,-240],[-840,-480],[-600,-240]],bldg:[{x:-142,z1:-120,z2:0,s:0.9},{x:-98,z1:-120,z2:0,s:0.9},{x:-622,z1:-240,z2:-120,s:0.9},{x:-578,z1:-240,z2:-120,s:0.9},{x:-502,z1:-360,z2:-240,s:0.9},{x:-458,z1:-360,z2:-240,s:0.9},{x:-742,z1:-360,z2:-240,s:0.9},{x:-698,z1:-360,z2:-240,s:0.9},{x:-862,z1:-360,z2:-240,s:0.9},{x:-818,z1:-360,z2:-240,s:0.9},{x:-862,z1:-480,z2:-360,s:0.9},{x:-818,z1:-480,z2:-360,s:0.9},{x:-982,z1:-480,z2:-360,s:0.9},{x:-938,z1:-480,z2:-360,s:0.9},{x:-1102,z1:-480,z2:-360,s:0.9},{x:-1058,z1:-480,z2:-360,s:0.9},{x:-1102,z1:-600,z2:-480,s:0.9},{x:-1058,z1:-600,z2:-480,s:0.9},{x:-1222,z1:-600,z2:-480,s:0.9},{x:-1178,z1:-600,z2:-480,s:0.9},{x:-1222,z1:-480,z2:-360,s:0.9},{x:-1178,z1:-480,z2:-360,s:0.9},{x:-1462,z1:-480,z2:-360,s:0.9},{x:-1418,z1:-480,z2:-360,s:0.9},{x:-1462,z1:-600,z2:-480,s:0.9},{x:-1418,z1:-600,z2:-480,s:0.9},{x:-1342,z1:-600,z2:-480,s:0.9},{x:-1298,z1:-600,z2:-480,s:0.9}],timeLimit:940,hasGarage:true},
   5:{name:'Parel School Zone',sky:0x95c0d4,fog:250,ground:0x447a3e,amb:0.8,veh:'bus',npcTypes:['car','auto','cycle','bike','auto','car','taxi','car','auto','bike','car','cycle','auto','car','bus','car','auto','car'],hasSchool:true,speedLimit:30,roads:[{type:'h',z:0,x1:-140,x2:1000},{type:'v',x:-120,z1:-140,z2:20},{type:'h',z:-120,x1:-260,x2:-100},{type:'h',z:-120,x1:-380,x2:-220},{type:'v',x:-360,z1:-260,z2:-100},{type:'v',x:-360,z1:-380,z2:-220},{type:'h',z:-360,x1:-500,x2:-340},{type:'h',z:-360,x1:-620,x2:-460},{type:'v',x:-600,z1:-500,z2:-340},{type:'v',x:-600,z1:-620,z2:-460},{type:'v',x:-600,z1:-740,z2:-580},{type:'h',z:-720,x1:-620,x2:-460},{type:'h',z:-720,x1:-500,x2:-340},{type:'v',x:-360,z1:-860,z2:-700},{type:'v',x:-360,z1:-980,z2:-820},{type:'v',x:-360,z1:-1100,z2:-940},{type:'h',z:-1080,x1:-380,x2:-220},{type:'h',z:-1080,x1:-260,x2:-100},{type:'h',z:-1080,x1:-140,x2:20},{type:'h',z:-1080,x1:-20,x2:140},{type:'h',z:-1080,x1:100,x2:260},{type:'h',z:-1080,x1:220,x2:380},{type:'v',x:360,z1:-1100,z2:-940},{type:'v',x:360,z1:-980,z2:-820},{type:'v',x:360,z1:-860,z2:-700},{type:'v',x:360,z1:-740,z2:-580},{type:'h',z:-600,x1:340,x2:500},{type:'h',z:-600,x1:460,x2:620},{type:'v',x:600,z1:-620,z2:-460},{type:'h',z:-480,x1:460,x2:620},{type:'v',x:480,z1:-500,z2:-340},{type:'h',z:-360,x1:340,x2:500},{type:'v',x:360,z1:-500,z2:-340},{type:'h',z:-480,x1:220,x2:380},{type:'v',x:240,z1:-620,z2:-460},{type:'h',z:-600,x1:-880,x2:260},{type:'h',z:-360,x1:-1600,x2:400},{type:'v',x:-600,z1:-1360,z2:640},{type:'h',z:-360,x1:-520,x2:1480},{type:'v',x:480,z1:-1360,z2:640},{type:'h',z:-1080,x1:-640,x2:1360},{type:'v',x:360,z1:-2080,z2:-80},{type:'h',z:-120,x1:-1240,x2:760},{type:'v',x:-240,z1:-1120,z2:880},{type:'h',z:-360,x1:-1480,x2:520},{type:'v',x:-480,z1:-1360,z2:640}],route:[{x:0,z:0},{x:-120,z:0},{x:-120,z:-120},{x:-240,z:-120},{x:-360,z:-120},{x:-360,z:-240},{x:-360,z:-360},{x:-480,z:-360},{x:-600,z:-360},{x:-600,z:-480},{x:-600,z:-600},{x:-600,z:-720},{x:-480,z:-720},{x:-360,z:-720},{x:-360,z:-840},{x:-360,z:-960},{x:-360,z:-1080},{x:-240,z:-1080},{x:-120,z:-1080},{x:0,z:-1080},{x:120,z:-1080},{x:240,z:-1080},{x:360,z:-1080},{x:360,z:-960},{x:360,z:-840},{x:360,z:-720},{x:360,z:-600},{x:480,z:-600},{x:600,z:-600},{x:600,z:-480},{x:480,z:-480},{x:480,z:-360},{x:360,z:-360},{x:360,z:-480},{x:240,z:-480},{x:240,z:-600},{x:120,z:-600}],ints:[[360,-360],[600,-600],[-360,-840],[-480,-360],[-600,-600],[480,-600],[240,-480],[-360,-720],[120,-600],[-240,-120],[0,0],[-600,-720],[-360,-240],[120,-1080],[-240,-1080],[-480,-720],[360,-840],[480,-480],[-120,-1080],[360,-480],[-600,-360],[240,-1080],[-360,-1080],[-360,-360],[360,-1080],[360,-720],[-360,-120],[-120,0],[-360,-960],[600,-480],[480,-360],[0,-1080],[360,-600],[-120,-120],[240,-600],[360,-960],[-600,-480]],bldg:[{x:-142,z1:-120,z2:0,s:0.9},{x:-98,z1:-120,z2:0,s:0.9},{x:-382,z1:-240,z2:-120,s:0.9},{x:-338,z1:-240,z2:-120,s:0.9},{x:-382,z1:-360,z2:-240,s:0.9},{x:-338,z1:-360,z2:-240,s:0.9},{x:-622,z1:-480,z2:-360,s:0.9},{x:-578,z1:-480,z2:-360,s:0.9},{x:-622,z1:-600,z2:-480,s:0.9},{x:-578,z1:-600,z2:-480,s:0.9},{x:-622,z1:-720,z2:-600,s:0.9},{x:-578,z1:-720,z2:-600,s:0.9},{x:-382,z1:-840,z2:-720,s:0.9},{x:-338,z1:-840,z2:-720,s:0.9},{x:-382,z1:-960,z2:-840,s:0.9},{x:-338,z1:-960,z2:-840,s:0.9},{x:-382,z1:-1080,z2:-960,s:0.9},{x:-338,z1:-1080,z2:-960,s:0.9},{x:338,z1:-1080,z2:-960,s:0.9},{x:382,z1:-1080,z2:-960,s:0.9},{x:338,z1:-960,z2:-840,s:0.9},{x:382,z1:-960,z2:-840,s:0.9},{x:338,z1:-840,z2:-720,s:0.9},{x:382,z1:-840,z2:-720,s:0.9},{x:338,z1:-720,z2:-600,s:0.9},{x:382,z1:-720,z2:-600,s:0.9},{x:578,z1:-600,z2:-480,s:0.9},{x:622,z1:-600,z2:-480,s:0.9},{x:458,z1:-480,z2:-360,s:0.9},{x:502,z1:-480,z2:-360,s:0.9},{x:338,z1:-480,z2:-360,s:0.9},{x:382,z1:-480,z2:-360,s:0.9},{x:218,z1:-600,z2:-480,s:0.9},{x:262,z1:-600,z2:-480,s:0.9}],timeLimit:1050,hasGarage:true},
   6:{name:'Matunga Rail Corridor',sky:0x7fafc4,fog:350,ground:0x3a6130,amb:0.7,veh:'car',npcTypes:['car','auto','car','bike','car','auto','taxi','car','auto','bike','car','truck','auto','car','car','bike','car','auto'],hasRailway:true,railZ:[0],hasMetro:true,roads:[{type:'h',z:0,x1:-1000,x2:140},{type:'v',x:120,z1:-140,z2:20},{type:'h',z:-120,x1:100,x2:260},{type:'h',z:-120,x1:220,x2:380},{type:'v',x:360,z1:-260,z2:-100},{type:'h',z:-240,x1:340,x2:500},{type:'v',x:480,z1:-260,z2:-100},{type:'v',x:480,z1:-140,z2:20},{type:'v',x:480,z1:-20,z2:140},{type:'h',z:120,x1:460,x2:620},{type:'v',x:600,z1:-20,z2:140},{type:'h',z:0,x1:580,x2:740},{type:'v',x:720,z1:-20,z2:140},{type:'v',x:720,z1:100,z2:260},{type:'h',z:240,x1:700,x2:860},{type:'h',z:240,x1:820,x2:980},{type:'h',z:240,x1:940,x2:1100},{type:'v',x:1080,z1:220,z2:380},{type:'h',z:360,x1:940,x2:1100},{type:'v',x:960,z1:340,z2:500},{type:'h',z:480,x1:940,x2:1100},{type:'h',z:480,x1:1060,x2:1220},{type:'v',x:1200,z1:460,z2:620},{type:'h',z:600,x1:1060,x2:1220},{type:'v',x:1080,z1:580,z2:740},{type:'v',x:1080,z1:700,z2:860},{type:'h',z:840,x1:940,x2:1100},{type:'v',x:960,z1:700,z2:860},{type:'h',z:720,x1:820,x2:980},{type:'v',x:840,z1:580,z2:740},{type:'h',z:600,x1:820,x2:1960},{type:'h',z:0,x1:-520,x2:1480},{type:'v',x:480,z1:-1000,z2:1000},{type:'h',z:120,x1:-400,x2:1600},{type:'v',x:600,z1:-880,z2:1120},{type:'h',z:120,x1:-520,x2:1480},{type:'v',x:480,z1:-880,z2:1120},{type:'h',z:720,x1:-160,x2:1840},{type:'v',x:840,z1:-280,z2:1720},{type:'h',z:720,x1:80,x2:2080},{type:'v',x:1080,z1:-280,z2:1720}],route:[{x:0,z:0},{x:120,z:0},{x:120,z:-120},{x:240,z:-120},{x:360,z:-120},{x:360,z:-240},{x:480,z:-240},{x:480,z:-120},{x:480,z:0},{x:480,z:120},{x:600,z:120},{x:600,z:0},{x:720,z:0},{x:720,z:120},{x:720,z:240},{x:840,z:240},{x:960,z:240},{x:1080,z:240},{x:1080,z:360},{x:960,z:360},{x:960,z:480},{x:1080,z:480},{x:1200,z:480},{x:1200,z:600},{x:1080,z:600},{x:1080,z:720},{x:1080,z:840},{x:960,z:840},{x:960,z:720},{x:840,z:720},{x:840,z:600},{x:960,z:600}],ints:[[600,0],[360,-120],[480,-120],[720,120],[960,720],[960,480],[480,120],[0,0],[480,-240],[720,0],[840,720],[960,840],[240,-120],[360,-240],[960,360],[1080,840],[120,0],[840,600],[600,120],[1080,720],[1080,360],[1200,480],[960,240],[1080,480],[120,-120],[1080,240],[1080,600],[480,0],[720,240],[960,600],[1200,600],[840,240]],bldg:[{x:98,z1:-120,z2:0,s:0.9},{x:142,z1:-120,z2:0,s:0.9},{x:338,z1:-240,z2:-120,s:0.9},{x:382,z1:-240,z2:-120,s:0.9},{x:458,z1:-240,z2:-120,s:0.9},{x:502,z1:-240,z2:-120,s:0.9},{x:458,z1:-120,z2:0,s:0.9},{x:502,z1:-120,z2:0,s:0.9},{x:458,z1:0,z2:120,s:0.9},{x:502,z1:0,z2:120,s:0.9},{x:578,z1:0,z2:120,s:0.9},{x:622,z1:0,z2:120,s:0.9},{x:698,z1:0,z2:120,s:0.9},{x:742,z1:0,z2:120,s:0.9},{x:698,z1:120,z2:240,s:0.9},{x:742,z1:120,z2:240,s:0.9},{x:1058,z1:240,z2:360,s:0.9},{x:1102,z1:240,z2:360,s:0.9},{x:938,z1:360,z2:480,s:0.9},{x:982,z1:360,z2:480,s:0.9},{x:1178,z1:480,z2:600,s:0.9},{x:1222,z1:480,z2:600,s:0.9},{x:1058,z1:600,z2:720,s:0.9},{x:1102,z1:600,z2:720,s:0.9},{x:1058,z1:720,z2:840,s:0.9},{x:1102,z1:720,z2:840,s:0.9},{x:938,z1:720,z2:840,s:0.9},{x:982,z1:720,z2:840,s:0.9},{x:818,z1:600,z2:720,s:0.9},{x:862,z1:600,z2:720,s:0.9}],timeLimit:1160,hasGarage:true},
   7:{name:'Marine Drive',sky:0x4a90d9,fog:450,ground:0x1a6b5a,amb:0.9,veh:'car',npcTypes:['car','car','auto','bike','car','bus','taxi','car','auto','car','bike','car','car','bus','auto','taxi','car','bike','car','auto'],hasOcean:true,roads:[{type:'h',z:0,x1:-1000,x2:140},{type:'h',z:0,x1:100,x2:260},{type:'v',x:240,z1:-20,z2:140},{type:'h',z:120,x1:220,x2:380},{type:'v',x:360,z1:100,z2:260},{type:'h',z:240,x1:340,x2:500},{type:'h',z:240,x1:460,x2:620},{type:'h',z:240,x1:580,x2:740},{type:'v',x:720,z1:100,z2:260},{type:'v',x:720,z1:-20,z2:140},{type:'h',z:0,x1:700,x2:860},{type:'v',x:840,z1:-20,z2:140},{type:'v',x:840,z1:100,z2:260},{type:'v',x:840,z1:220,z2:380},{type:'h',z:360,x1:700,x2:860},{type:'h',z:360,x1:580,x2:740},{type:'h',z:360,x1:460,x2:620},{type:'v',x:480,z1:340,z2:500},{type:'v',x:480,z1:460,z2:620},{type:'v',x:480,z1:580,z2:740},{type:'h',z:720,x1:340,x2:500},{type:'v',x:360,z1:580,z2:740},{type:'h',z:600,x1:220,x2:380},{type:'h',z:600,x1:100,x2:260},{type:'v',x:120,z1:460,z2:620},{type:'v',x:120,z1:340,z2:500},{type:'v',x:120,z1:220,z2:380},{type:'h',z:240,x1:-20,x2:140},{type:'v',x:0,z1:220,z2:380},{type:'v',x:0,z1:340,z2:500},{type:'h',z:480,x1:-140,x2:20},{type:'h',z:480,x1:-260,x2:-100},{type:'v',x:-240,z1:460,z2:620},{type:'v',x:-240,z1:580,z2:740},{type:'h',z:720,x1:-380,x2:-220},{type:'v',x:-360,z1:700,z2:860},{type:'h',z:840,x1:-500,x2:-340},{type:'h',z:840,x1:-620,x2:-460},{type:'v',x:-600,z1:820,z2:980},{type:'v',x:-600,z1:940,z2:1100},{type:'h',z:1080,x1:-620,x2:-460},{type:'v',x:-480,z1:940,z2:1100},{type:'h',z:960,x1:-500,x2:-340},{type:'v',x:-360,z1:940,z2:2080},{type:'h',z:600,x1:-880,x2:1120},{type:'v',x:120,z1:-400,z2:1600},{type:'h',z:600,x1:-760,x2:1240},{type:'v',x:240,z1:-400,z2:1600},{type:'h',z:480,x1:-520,x2:1480},{type:'v',x:480,z1:-520,z2:1480},{type:'h',z:720,x1:-520,x2:1480},{type:'v',x:480,z1:-280,z2:1720},{type:'h',z:1080,x1:-1600,x2:400},{type:'v',x:-600,z1:80,z2:2080}],route:[{x:0,z:0},{x:120,z:0},{x:240,z:0},{x:240,z:120},{x:360,z:120},{x:360,z:240},{x:480,z:240},{x:600,z:240},{x:720,z:240},{x:720,z:120},{x:720,z:0},{x:840,z:0},{x:840,z:120},{x:840,z:240},{x:840,z:360},{x:720,z:360},{x:600,z:360},{x:480,z:360},{x:480,z:480},{x:480,z:600},{x:480,z:720},{x:360,z:720},{x:360,z:600},{x:240,z:600},{x:120,z:600},{x:120,z:480},{x:120,z:360},{x:120,z:240},{x:0,z:240},{x:0,z:360},{x:0,z:480},{x:-120,z:480},{x:-240,z:480},{x:-240,z:600},{x:-240,z:720},{x:-360,z:720},{x:-360,z:840},{x:-480,z:840},{x:-600,z:840},{x:-600,z:960},{x:-600,z:1080},{x:-480,z:1080},{x:-480,z:960},{x:-360,z:960},{x:-360,z:1080}],ints:[[240,0],[840,0],[0,240],[360,240],[-600,960],[-240,480],[720,120],[120,360],[360,120],[-360,960],[0,0],[720,0],[480,720],[840,360],[840,120],[120,240],[480,240],[-600,840],[-600,1080],[360,600],[-240,720],[-240,600],[120,600],[120,480],[-480,1080],[-480,960],[120,0],[0,360],[240,600],[-360,720],[600,360],[480,360],[360,720],[480,600],[600,240],[-120,480],[720,240],[240,120],[480,480],[-360,840],[720,360],[0,480],[-360,1080],[-480,840],[840,240]],bldg:[{x:218,z1:0,z2:120,s:0.9},{x:262,z1:0,z2:120,s:0.9},{x:338,z1:120,z2:240,s:0.9},{x:382,z1:120,z2:240,s:0.9},{x:698,z1:120,z2:240,s:0.9},{x:742,z1:120,z2:240,s:0.9},{x:698,z1:0,z2:120,s:0.9},{x:742,z1:0,z2:120,s:0.9},{x:818,z1:0,z2:120,s:0.9},{x:862,z1:0,z2:120,s:0.9},{x:818,z1:120,z2:240,s:0.9},{x:862,z1:120,z2:240,s:0.9},{x:818,z1:240,z2:360,s:0.9},{x:862,z1:240,z2:360,s:0.9},{x:458,z1:360,z2:480,s:0.9},{x:502,z1:360,z2:480,s:0.9},{x:458,z1:480,z2:600,s:0.9},{x:502,z1:480,z2:600,s:0.9},{x:458,z1:600,z2:720,s:0.9},{x:502,z1:600,z2:720,s:0.9},{x:338,z1:600,z2:720,s:0.9},{x:382,z1:600,z2:720,s:0.9},{x:98,z1:480,z2:600,s:0.9},{x:142,z1:480,z2:600,s:0.9},{x:98,z1:360,z2:480,s:0.9},{x:142,z1:360,z2:480,s:0.9},{x:98,z1:240,z2:360,s:0.9},{x:142,z1:240,z2:360,s:0.9},{x:-22,z1:240,z2:360,s:0.9},{x:22,z1:240,z2:360,s:0.9},{x:-22,z1:360,z2:480,s:0.9},{x:22,z1:360,z2:480,s:0.9},{x:-262,z1:480,z2:600,s:0.9},{x:-218,z1:480,z2:600,s:0.9},{x:-262,z1:600,z2:720,s:0.9},{x:-218,z1:600,z2:720,s:0.9},{x:-382,z1:720,z2:840,s:0.9},{x:-338,z1:720,z2:840,s:0.9},{x:-622,z1:840,z2:960,s:0.9},{x:-578,z1:840,z2:960,s:0.9},{x:-622,z1:960,z2:1080,s:0.9},{x:-578,z1:960,z2:1080,s:0.9},{x:-502,z1:960,z2:1080,s:0.9},{x:-458,z1:960,z2:1080,s:0.9},{x:-382,z1:960,z2:1080,s:0.9},{x:-338,z1:960,z2:1080,s:0.9}],timeLimit:1270,hasGarage:true},
   8:{name:'Byculla',sky:0x7a9eb5,fog:300,ground:0x345a2a,amb:0.7,veh:'car',npcTypes:['car','auto','car','bike','auto','car','truck','car','taxi','auto','bike','car','car','bus','auto','car','car','bike','auto','car','taxi','car','car','auto'],hasEmergency:true,roads:[{type:'v',x:0,z1:-1000,z2:140},{type:'h',z:120,x1:-140,x2:20},{type:'h',z:120,x1:-260,x2:-100},{type:'v',x:-240,z1:-20,z2:140},{type:'h',z:0,x1:-260,x2:-100},{type:'v',x:-120,z1:-140,z2:20},{type:'h',z:-120,x1:-260,x2:-100},{type:'h',z:-120,x1:-380,x2:-220},{type:'v',x:-360,z1:-140,z2:20},{type:'h',z:0,x1:-500,x2:-340},{type:'v',x:-480,z1:-20,z2:140},{type:'h',z:120,x1:-500,x2:-340},{type:'v',x:-360,z1:100,z2:260},{type:'h',z:240,x1:-380,x2:-220},{type:'v',x:-240,z1:220,z2:380},{type:'h',z:360,x1:-260,x2:-100},{type:'h',z:360,x1:-140,x2:20},{type:'v',x:0,z1:340,z2:500},{type:'h',z:480,x1:-20,x2:140},{type:'v',x:120,z1:460,z2:620},{type:'h',z:600,x1:100,x2:260},{type:'v',x:240,z1:580,z2:740},{type:'v',x:240,z1:700,z2:860},{type:'v',x:240,z1:820,z2:980},{type:'h',z:960,x1:100,x2:260},{type:'v',x:120,z1:820,z2:980},{type:'h',z:840,x1:-20,x2:140},{type:'h',z:840,x1:-140,x2:20},{type:'h',z:840,x1:-260,x2:-100},{type:'h',z:840,x1:-380,x2:-220},{type:'v',x:-360,z1:820,z2:980},{type:'h',z:960,x1:-500,x2:-340},{type:'h',z:960,x1:-620,x2:-460},{type:'v',x:-600,z1:820,z2:980},{type:'h',z:840,x1:-620,x2:-460},{type:'v',x:-480,z1:700,z2:860},{type:'v',x:-480,z1:580,z2:740},{type:'h',z:600,x1:-620,x2:-460},{type:'v',x:-600,z1:460,z2:620},{type:'h',z:480,x1:-620,x2:-460},{type:'h',z:480,x1:-500,x2:-340},{type:'h',z:480,x1:-380,x2:-220},{type:'h',z:480,x1:-260,x2:-100},{type:'v',x:-120,z1:460,z2:620},{type:'h',z:600,x1:-140,x2:20},{type:'v',x:0,z1:580,z2:740},{type:'h',z:720,x1:-20,x2:1120},{type:'h',z:120,x1:-1360,x2:640},{type:'v',x:-360,z1:-880,z2:1120},{type:'h',z:720,x1:-760,x2:1240},{type:'v',x:240,z1:-280,z2:1720},{type:'h',z:840,x1:-1240,x2:760},{type:'v',x:-240,z1:-160,z2:1840},{type:'h',z:960,x1:-760,x2:1240},{type:'v',x:240,z1:-40,z2:1960},{type:'h',z:600,x1:-1120,x2:880},{type:'v',x:-120,z1:-400,z2:1600}],route:[{x:0,z:0},{x:0,z:120},{x:-120,z:120},{x:-240,z:120},{x:-240,z:0},{x:-120,z:0},{x:-120,z:-120},{x:-240,z:-120},{x:-360,z:-120},{x:-360,z:0},{x:-480,z:0},{x:-480,z:120},{x:-360,z:120},{x:-360,z:240},{x:-240,z:240},{x:-240,z:360},{x:-120,z:360},{x:0,z:360},{x:0,z:480},{x:120,z:480},{x:120,z:600},{x:240,z:600},{x:240,z:720},{x:240,z:840},{x:240,z:960},{x:120,z:960},{x:120,z:840},{x:0,z:840},{x:-120,z:840},{x:-240,z:840},{x:-360,z:840},{x:-360,z:960},{x:-480,z:960},{x:-600,z:960},{x:-600,z:840},{x:-480,z:840},{x:-480,z:720},{x:-480,z:600},{x:-600,z:600},{x:-600,z:480},{x:-480,z:480},{x:-360,z:480},{x:-240,z:480},{x:-120,z:480},{x:-120,z:600},{x:0,z:600},{x:0,z:720},{x:120,z:720}],ints:[[-120,360],[-360,240],[240,960],[120,960],[-360,0],[-600,960],[-240,120],[-600,600],[-240,480],[-480,720],[0,120],[-240,-120],[-480,120],[-480,0],[0,0],[120,840],[-360,960],[-480,480],[-480,600],[0,840],[-600,840],[-360,480],[-240,840],[240,720],[-360,120],[-240,360],[0,600],[120,600],[120,480],[-240,240],[-480,960],[-360,-120],[-120,0],[-120,120],[0,360],[-120,600],[-120,-120],[240,600],[-240,0],[240,840],[-120,840],[0,720],[-120,480],[-600,480],[-360,840],[0,480],[120,720],[-480,840]],bldg:[{x:-22,z1:0,z2:120,s:0.9},{x:22,z1:0,z2:120,s:0.9},{x:-262,z1:0,z2:120,s:0.9},{x:-218,z1:0,z2:120,s:0.9},{x:-142,z1:-120,z2:0,s:0.9},{x:-98,z1:-120,z2:0,s:0.9},{x:-382,z1:-120,z2:0,s:0.9},{x:-338,z1:-120,z2:0,s:0.9},{x:-502,z1:0,z2:120,s:0.9},{x:-458,z1:0,z2:120,s:0.9},{x:-382,z1:120,z2:240,s:0.9},{x:-338,z1:120,z2:240,s:0.9},{x:-262,z1:240,z2:360,s:0.9},{x:-218,z1:240,z2:360,s:0.9},{x:-22,z1:360,z2:480,s:0.9},{x:22,z1:360,z2:480,s:0.9},{x:98,z1:480,z2:600,s:0.9},{x:142,z1:480,z2:600,s:0.9},{x:218,z1:600,z2:720,s:0.9},{x:262,z1:600,z2:720,s:0.9},{x:218,z1:720,z2:840,s:0.9},{x:262,z1:720,z2:840,s:0.9},{x:218,z1:840,z2:960,s:0.9},{x:262,z1:840,z2:960,s:0.9},{x:98,z1:840,z2:960,s:0.9},{x:142,z1:840,z2:960,s:0.9},{x:-382,z1:840,z2:960,s:0.9},{x:-338,z1:840,z2:960,s:0.9},{x:-622,z1:840,z2:960,s:0.9},{x:-578,z1:840,z2:960,s:0.9},{x:-502,z1:720,z2:840,s:0.9},{x:-458,z1:720,z2:840,s:0.9},{x:-502,z1:600,z2:720,s:0.9},{x:-458,z1:600,z2:720,s:0.9},{x:-622,z1:480,z2:600,s:0.9},{x:-578,z1:480,z2:600,s:0.9},{x:-142,z1:480,z2:600,s:0.9},{x:-98,z1:480,z2:600,s:0.9},{x:-22,z1:600,z2:720,s:0.9},{x:22,z1:600,z2:720,s:0.9}],timeLimit:1380,hasGarage:true},
   9:{name:'Hindmata',sky:0x152234,fog:200,ground:0x1a291d,amb:0.4,veh:'car',npcTypes:['car','auto','bike','car','auto','taxi','car','auto','bike','car','auto','car','bus','auto','car','bike'],hasRain:true,hasPuddles:true,roads:[{type:'v',x:0,z1:-1000,z2:140},{type:'v',x:0,z1:100,z2:260},{type:'h',z:240,x1:-20,x2:140},{type:'h',z:240,x1:100,x2:260},{type:'v',x:240,z1:220,z2:380},{type:'v',x:240,z1:340,z2:500},{type:'v',x:240,z1:460,z2:620},{type:'h',z:600,x1:220,x2:380},{type:'v',x:360,z1:460,z2:620},{type:'h',z:480,x1:340,x2:500},{type:'v',x:480,z1:460,z2:620},{type:'v',x:480,z1:580,z2:740},{type:'v',x:480,z1:700,z2:860},{type:'h',z:840,x1:340,x2:500},{type:'v',x:360,z1:700,z2:860},{type:'h',z:720,x1:220,x2:380},{type:'v',x:240,z1:700,z2:860},{type:'v',x:240,z1:820,z2:980},{type:'v',x:240,z1:940,z2:1100},{type:'v',x:240,z1:1060,z2:1220},{type:'h',z:1200,x1:220,x2:380},{type:'v',x:360,z1:1180,z2:1340},{type:'v',x:360,z1:1300,z2:1460},{type:'h',z:1440,x1:340,x2:500},{type:'h',z:1440,x1:460,x2:620},{type:'h',z:1440,x1:580,x2:740},{type:'v',x:720,z1:1420,z2:1580},{type:'h',z:1560,x1:580,x2:740},{type:'h',z:1560,x1:460,x2:620},{type:'h',z:1560,x1:340,x2:500},{type:'h',z:1560,x1:220,x2:380},{type:'h',z:1560,x1:100,x2:260},{type:'v',x:120,z1:1420,z2:1580},{type:'v',x:120,z1:1300,z2:1460},{type:'v',x:120,z1:1180,z2:1340},{type:'v',x:120,z1:1060,z2:1220},{type:'h',z:1080,x1:-20,x2:140},{type:'v',x:0,z1:1060,z2:1220},{type:'v',x:0,z1:1180,z2:1340},{type:'v',x:0,z1:1300,z2:1460},{type:'v',x:0,z1:1420,z2:1580},{type:'h',z:1560,x1:-140,x2:20},{type:'h',z:1560,x1:-260,x2:-100},{type:'v',x:-240,z1:1540,z2:1700},{type:'h',z:1680,x1:-380,x2:-220},{type:'h',z:1680,x1:-500,x2:-340},{type:'v',x:-480,z1:1540,z2:1700},{type:'h',z:1560,x1:-620,x2:-460},{type:'v',x:-600,z1:1420,z2:1580},{type:'v',x:-600,z1:1300,z2:1460},{type:'h',z:1320,x1:-620,x2:-460},{type:'v',x:-480,z1:200,z2:1340},{type:'h',z:840,x1:-640,x2:1360},{type:'v',x:360,z1:-160,z2:1840},{type:'h',z:600,x1:-520,x2:1480},{type:'v',x:480,z1:-400,z2:1600},{type:'h',z:600,x1:-760,x2:1240},{type:'v',x:240,z1:-400,z2:1600},{type:'h',z:840,x1:-640,x2:1360},{type:'v',x:360,z1:-160,z2:1840},{type:'h',z:1440,x1:-880,x2:1120},{type:'v',x:120,z1:440,z2:2440}],route:[{x:0,z:0},{x:0,z:120},{x:0,z:240},{x:120,z:240},{x:240,z:240},{x:240,z:360},{x:240,z:480},{x:240,z:600},{x:360,z:600},{x:360,z:480},{x:480,z:480},{x:480,z:600},{x:480,z:720},{x:480,z:840},{x:360,z:840},{x:360,z:720},{x:240,z:720},{x:240,z:840},{x:240,z:960},{x:240,z:1080},{x:240,z:1200},{x:360,z:1200},{x:360,z:1320},{x:360,z:1440},{x:480,z:1440},{x:600,z:1440},{x:720,z:1440},{x:720,z:1560},{x:600,z:1560},{x:480,z:1560},{x:360,z:1560},{x:240,z:1560},{x:120,z:1560},{x:120,z:1440},{x:120,z:1320},{x:120,z:1200},{x:120,z:1080},{x:0,z:1080},{x:0,z:1200},{x:0,z:1320},{x:0,z:1440},{x:0,z:1560},{x:-120,z:1560},{x:-240,z:1560},{x:-240,z:1680},{x:-360,z:1680},{x:-480,z:1680},{x:-480,z:1560},{x:-600,z:1560},{x:-600,z:1440},{x:-600,z:1320},{x:-480,z:1320},{x:-480,z:1200}],ints:[[0,240],[240,1200],[720,1560],[480,1560],[-480,1320],[240,960],[-480,1680],[240,1080],[480,840],[360,1320],[0,120],[120,1440],[600,1560],[0,0],[360,1560],[120,1200],[480,720],[360,1440],[-240,1680],[-120,1560],[0,1320],[480,1440],[360,480],[120,240],[120,1560],[-360,1680],[-600,1440],[360,600],[240,720],[720,1440],[240,1560],[120,1080],[360,840],[0,1080],[-600,1560],[240,240],[0,1440],[-480,1200],[-600,1320],[240,480],[240,600],[360,720],[240,840],[0,1200],[240,360],[480,600],[600,1440],[120,1320],[-240,1560],[480,480],[0,1560],[360,1200],[-480,1560]],bldg:[{x:-22,z1:0,z2:120,s:0.9},{x:22,z1:0,z2:120,s:0.9},{x:-22,z1:120,z2:240,s:0.9},{x:22,z1:120,z2:240,s:0.9},{x:218,z1:240,z2:360,s:0.9},{x:262,z1:240,z2:360,s:0.9},{x:218,z1:360,z2:480,s:0.9},{x:262,z1:360,z2:480,s:0.9},{x:218,z1:480,z2:600,s:0.9},{x:262,z1:480,z2:600,s:0.9},{x:338,z1:480,z2:600,s:0.9},{x:382,z1:480,z2:600,s:0.9},{x:458,z1:480,z2:600,s:0.9},{x:502,z1:480,z2:600,s:0.9},{x:458,z1:600,z2:720,s:0.9},{x:502,z1:600,z2:720,s:0.9},{x:458,z1:720,z2:840,s:0.9},{x:502,z1:720,z2:840,s:0.9},{x:338,z1:720,z2:840,s:0.9},{x:382,z1:720,z2:840,s:0.9},{x:218,z1:720,z2:840,s:0.9},{x:262,z1:720,z2:840,s:0.9},{x:218,z1:840,z2:960,s:0.9},{x:262,z1:840,z2:960,s:0.9},{x:218,z1:960,z2:1080,s:0.9},{x:262,z1:960,z2:1080,s:0.9},{x:218,z1:1080,z2:1200,s:0.9},{x:262,z1:1080,z2:1200,s:0.9},{x:338,z1:1200,z2:1320,s:0.9},{x:382,z1:1200,z2:1320,s:0.9},{x:338,z1:1320,z2:1440,s:0.9},{x:382,z1:1320,z2:1440,s:0.9},{x:698,z1:1440,z2:1560,s:0.9},{x:742,z1:1440,z2:1560,s:0.9},{x:98,z1:1440,z2:1560,s:0.9},{x:142,z1:1440,z2:1560,s:0.9},{x:98,z1:1320,z2:1440,s:0.9},{x:142,z1:1320,z2:1440,s:0.9},{x:98,z1:1200,z2:1320,s:0.9},{x:142,z1:1200,z2:1320,s:0.9},{x:98,z1:1080,z2:1200,s:0.9},{x:142,z1:1080,z2:1200,s:0.9},{x:-22,z1:1080,z2:1200,s:0.9},{x:22,z1:1080,z2:1200,s:0.9},{x:-22,z1:1200,z2:1320,s:0.9},{x:22,z1:1200,z2:1320,s:0.9},{x:-22,z1:1320,z2:1440,s:0.9},{x:22,z1:1320,z2:1440,s:0.9},{x:-22,z1:1440,z2:1560,s:0.9},{x:22,z1:1440,z2:1560,s:0.9},{x:-262,z1:1560,z2:1680,s:0.9},{x:-218,z1:1560,z2:1680,s:0.9},{x:-502,z1:1560,z2:1680,s:0.9},{x:-458,z1:1560,z2:1680,s:0.9},{x:-622,z1:1440,z2:1560,s:0.9},{x:-578,z1:1440,z2:1560,s:0.9},{x:-622,z1:1320,z2:1440,s:0.9},{x:-578,z1:1320,z2:1440,s:0.9},{x:-502,z1:1200,z2:1320,s:0.9},{x:-458,z1:1200,z2:1320,s:0.9}],timeLimit:1490,hasGarage:true},
   10:{name:'Eastern Express Hwy',sky:0x8cbbd6,fog:500,ground:0x2a5e28,amb:0.85,veh:'auto',npcTypes:['car','truck','bus','car','auto','bike','car','truck','bus','car','taxi','auto','car','bike','car','truck','bus','car','auto','bike','car','car','bus','auto'],hasMetro:true,roads:[{type:'h',z:0,x1:-1000,x2:140},{type:'h',z:0,x1:100,x2:260},{type:'v',x:240,z1:-140,z2:20},{type:'h',z:-120,x1:100,x2:260},{type:'v',x:120,z1:-260,z2:-100},{type:'h',z:-240,x1:100,x2:260},{type:'v',x:240,z1:-380,z2:-220},{type:'v',x:240,z1:-500,z2:-340},{type:'h',z:-480,x1:220,x2:380},{type:'v',x:360,z1:-500,z2:-340},{type:'v',x:360,z1:-380,z2:-220},{type:'h',z:-240,x1:340,x2:500},{type:'h',z:-240,x1:460,x2:620},{type:'v',x:600,z1:-380,z2:-220},{type:'v',x:600,z1:-500,z2:-340},{type:'v',x:600,z1:-620,z2:-460},{type:'h',z:-600,x1:580,x2:740},{type:'h',z:-600,x1:700,x2:860},{type:'v',x:840,z1:-740,z2:-580},{type:'v',x:840,z1:-860,z2:-700},{type:'h',z:-840,x1:820,x2:980},{type:'h',z:-840,x1:940,x2:1100},{type:'h',z:-840,x1:1060,x2:1220},{type:'h',z:-840,x1:1180,x2:1340},{type:'v',x:1320,z1:-860,z2:-700},{type:'h',z:-720,x1:1300,x2:1460},{type:'v',x:1440,z1:-740,z2:-580},{type:'h',z:-600,x1:1420,x2:1580},{type:'v',x:1560,z1:-740,z2:-580},{type:'h',z:-720,x1:1540,x2:1700},{type:'v',x:1680,z1:-740,z2:-580},{type:'v',x:1680,z1:-620,z2:-460},{type:'v',x:1680,z1:-500,z2:-340},{type:'h',z:-360,x1:1660,x2:1820},{type:'h',z:-360,x1:1780,x2:1940},{type:'v',x:1920,z1:-380,z2:-220},{type:'v',x:1920,z1:-260,z2:-100},{type:'h',z:-120,x1:1780,x2:1940},{type:'v',x:1800,z1:-260,z2:-100},{type:'h',z:-240,x1:1660,x2:1820},{type:'v',x:1680,z1:-260,z2:-100},{type:'h',z:-120,x1:1540,x2:1700},{type:'h',z:-120,x1:1420,x2:1580},{type:'v',x:1440,z1:-140,z2:20},{type:'v',x:1440,z1:-20,z2:140},{type:'h',z:120,x1:1300,x2:1460},{type:'h',z:120,x1:1180,x2:1340},{type:'h',z:120,x1:1060,x2:1220},{type:'v',x:1080,z1:100,z2:260},{type:'v',x:1080,z1:220,z2:380},{type:'v',x:1080,z1:340,z2:500},{type:'h',z:480,x1:1060,x2:1220},{type:'v',x:1200,z1:460,z2:620},{type:'v',x:1200,z1:580,z2:740},{type:'h',z:720,x1:1060,x2:1220},{type:'h',z:720,x1:-40,x2:1100},{type:'h',z:-600,x1:-160,x2:1840},{type:'v',x:840,z1:-1600,z2:400},{type:'h',z:720,x1:80,x2:2080},{type:'v',x:1080,z1:-280,z2:1720},{type:'h',z:-120,x1:-880,x2:1120},{type:'v',x:120,z1:-1120,z2:880},{type:'h',z:240,x1:80,x2:2080},{type:'v',x:1080,z1:-760,z2:1240},{type:'h',z:-120,x1:680,x2:2680},{type:'v',x:1680,z1:-1120,z2:880}],route:[{x:0,z:0},{x:120,z:0},{x:240,z:0},{x:240,z:-120},{x:120,z:-120},{x:120,z:-240},{x:240,z:-240},{x:240,z:-360},{x:240,z:-480},{x:360,z:-480},{x:360,z:-360},{x:360,z:-240},{x:480,z:-240},{x:600,z:-240},{x:600,z:-360},{x:600,z:-480},{x:600,z:-600},{x:720,z:-600},{x:840,z:-600},{x:840,z:-720},{x:840,z:-840},{x:960,z:-840},{x:1080,z:-840},{x:1200,z:-840},{x:1320,z:-840},{x:1320,z:-720},{x:1440,z:-720},{x:1440,z:-600},{x:1560,z:-600},{x:1560,z:-720},{x:1680,z:-720},{x:1680,z:-600},{x:1680,z:-480},{x:1680,z:-360},{x:1800,z:-360},{x:1920,z:-360},{x:1920,z:-240},{x:1920,z:-120},{x:1800,z:-120},{x:1800,z:-240},{x:1680,z:-240},{x:1680,z:-120},{x:1560,z:-120},{x:1440,z:-120},{x:1440,z:0},{x:1440,z:120},{x:1320,z:120},{x:1200,z:120},{x:1080,z:120},{x:1080,z:240},{x:1080,z:360},{x:1080,z:480},{x:1200,z:480},{x:1200,z:600},{x:1200,z:720},{x:1080,z:720},{x:960,z:720}],ints:[[240,0],[360,-360],[720,-600],[1680,-600],[600,-600],[1320,-720],[1440,120],[1080,120],[1440,-120],[600,-240],[1560,-600],[840,-600],[1560,-120],[240,-360],[240,-480],[1440,-720],[840,-840],[240,-240],[960,720],[960,-840],[1680,-480],[0,0],[480,-240],[1440,0],[1200,120],[1920,-360],[1440,-600],[1800,-240],[120,-240],[1680,-360],[1800,-360],[1680,-240],[240,-120],[360,-240],[1320,120],[360,-480],[1200,-840],[1200,720],[1320,-840],[1680,-120],[840,-720],[1080,-840],[120,0],[1560,-720],[600,-480],[1080,720],[1080,360],[600,-360],[1680,-720],[1800,-120],[1920,-240],[1200,480],[1080,480],[120,-120],[1080,240],[1920,-120],[1200,600]],bldg:[{x:218,z1:-120,z2:0,s:0.9},{x:262,z1:-120,z2:0,s:0.9},{x:98,z1:-240,z2:-120,s:0.9},{x:142,z1:-240,z2:-120,s:0.9},{x:218,z1:-360,z2:-240,s:0.9},{x:262,z1:-360,z2:-240,s:0.9},{x:218,z1:-480,z2:-360,s:0.9},{x:262,z1:-480,z2:-360,s:0.9},{x:338,z1:-480,z2:-360,s:0.9},{x:382,z1:-480,z2:-360,s:0.9},{x:338,z1:-360,z2:-240,s:0.9},{x:382,z1:-360,z2:-240,s:0.9},{x:578,z1:-360,z2:-240,s:0.9},{x:622,z1:-360,z2:-240,s:0.9},{x:578,z1:-480,z2:-360,s:0.9},{x:622,z1:-480,z2:-360,s:0.9},{x:578,z1:-600,z2:-480,s:0.9},{x:622,z1:-600,z2:-480,s:0.9},{x:818,z1:-720,z2:-600,s:0.9},{x:862,z1:-720,z2:-600,s:0.9},{x:818,z1:-840,z2:-720,s:0.9},{x:862,z1:-840,z2:-720,s:0.9},{x:1298,z1:-840,z2:-720,s:0.9},{x:1342,z1:-840,z2:-720,s:0.9},{x:1418,z1:-720,z2:-600,s:0.9},{x:1462,z1:-720,z2:-600,s:0.9},{x:1538,z1:-720,z2:-600,s:0.9},{x:1582,z1:-720,z2:-600,s:0.9},{x:1658,z1:-720,z2:-600,s:0.9},{x:1702,z1:-720,z2:-600,s:0.9},{x:1658,z1:-600,z2:-480,s:0.9},{x:1702,z1:-600,z2:-480,s:0.9},{x:1658,z1:-480,z2:-360,s:0.9},{x:1702,z1:-480,z2:-360,s:0.9},{x:1898,z1:-360,z2:-240,s:0.9},{x:1942,z1:-360,z2:-240,s:0.9},{x:1898,z1:-240,z2:-120,s:0.9},{x:1942,z1:-240,z2:-120,s:0.9},{x:1778,z1:-240,z2:-120,s:0.9},{x:1822,z1:-240,z2:-120,s:0.9},{x:1658,z1:-240,z2:-120,s:0.9},{x:1702,z1:-240,z2:-120,s:0.9},{x:1418,z1:-120,z2:0,s:0.9},{x:1462,z1:-120,z2:0,s:0.9},{x:1418,z1:0,z2:120,s:0.9},{x:1462,z1:0,z2:120,s:0.9},{x:1058,z1:120,z2:240,s:0.9},{x:1102,z1:120,z2:240,s:0.9},{x:1058,z1:240,z2:360,s:0.9},{x:1102,z1:240,z2:360,s:0.9},{x:1058,z1:360,z2:480,s:0.9},{x:1102,z1:360,z2:480,s:0.9},{x:1178,z1:480,z2:600,s:0.9},{x:1222,z1:480,z2:600,s:0.9},{x:1178,z1:600,z2:720,s:0.9},{x:1222,z1:600,z2:720,s:0.9}],timeLimit:1600,hasGarage:true},
   11:{name:'Sion Hospital',sky:0x0a0f1d,fog:250,ground:0x1a2a1d,amb:0.35,veh:'car',npcTypes:['car','auto','car','bike','taxi','car','auto','bike','car','auto','car','bike','auto','car','taxi','car'],isNight:true,hasSilentZone:true,silentZ1:0,silentZ2:250,roads:[{type:'v',x:0,z1:-140,z2:1000},{type:'v',x:0,z1:-260,z2:-100},{type:'h',z:-240,x1:-20,x2:140},{type:'h',z:-240,x1:100,x2:260},{type:'v',x:240,z1:-380,z2:-220},{type:'h',z:-360,x1:100,x2:260},{type:'h',z:-360,x1:-20,x2:140},{type:'v',x:0,z1:-500,z2:-340},{type:'h',z:-480,x1:-140,x2:20},{type:'v',x:-120,z1:-620,z2:-460},{type:'h',z:-600,x1:-140,x2:20},{type:'h',z:-600,x1:-20,x2:140},{type:'h',z:-600,x1:100,x2:260},{type:'v',x:240,z1:-740,z2:-580},{type:'h',z:-720,x1:220,x2:380},{type:'v',x:360,z1:-740,z2:-580},{type:'v',x:360,z1:-620,z2:-460},{type:'h',z:-480,x1:220,x2:380},{type:'h',z:-480,x1:-880,x2:260},{type:'h',z:-360,x1:-760,x2:1240},{type:'v',x:240,z1:-1360,z2:640},{type:'h',z:0,x1:-1000,x2:1000},{type:'v',x:0,z1:-1000,z2:1000},{type:'h',z:-600,x1:-760,x2:1240},{type:'v',x:240,z1:-1600,z2:400},{type:'h',z:-600,x1:-1000,x2:1000},{type:'v',x:0,z1:-1600,z2:400},{type:'h',z:-240,x1:-1000,x2:1000},{type:'v',x:0,z1:-1240,z2:760}],route:[{x:0,z:0},{x:0,z:-120},{x:0,z:-240},{x:120,z:-240},{x:240,z:-240},{x:240,z:-360},{x:120,z:-360},{x:0,z:-360},{x:0,z:-480},{x:-120,z:-480},{x:-120,z:-600},{x:0,z:-600},{x:120,z:-600},{x:240,z:-600},{x:240,z:-720},{x:360,z:-720},{x:360,z:-600},{x:360,z:-480},{x:240,z:-480},{x:120,z:-480}],ints:[[240,-360],[0,-600],[240,-480],[240,-240],[120,-600],[0,0],[-120,-480],[120,-240],[-120,-600],[0,-240],[0,-480],[360,-480],[120,-360],[360,-720],[120,-480],[360,-600],[0,-120],[240,-600],[240,-720],[0,-360]],bldg:[{x:-22,z1:-120,z2:0,s:0.9},{x:22,z1:-120,z2:0,s:0.9},{x:-22,z1:-240,z2:-120,s:0.9},{x:22,z1:-240,z2:-120,s:0.9},{x:218,z1:-360,z2:-240,s:0.9},{x:262,z1:-360,z2:-240,s:0.9},{x:-22,z1:-480,z2:-360,s:0.9},{x:22,z1:-480,z2:-360,s:0.9},{x:-142,z1:-600,z2:-480,s:0.9},{x:-98,z1:-600,z2:-480,s:0.9},{x:218,z1:-720,z2:-600,s:0.9},{x:262,z1:-720,z2:-600,s:0.9},{x:338,z1:-720,z2:-600,s:0.9},{x:382,z1:-720,z2:-600,s:0.9},{x:338,z1:-600,z2:-480,s:0.9},{x:382,z1:-600,z2:-480,s:0.9}],timeLimit:1710,hasGarage:true},
   12:{name:'Dharavi',sky:0x8aafca,fog:200,ground:0x3a5228,amb:0.7,veh:'twowheeler',npcTypes:['auto','bike','cycle','auto','car','bike','cycle','taxi','auto','car','bike','auto','car','cycle','auto','bike'],roads:[{type:'h',z:0,x1:-140,x2:1000},{type:'h',z:0,x1:-260,x2:-100},{type:'v',x:-240,z1:-140,z2:20},{type:'h',z:-120,x1:-260,x2:-100},{type:'h',z:-120,x1:-140,x2:20},{type:'v',x:0,z1:-260,z2:-100},{type:'h',z:-240,x1:-140,x2:20},{type:'v',x:-120,z1:-380,z2:-220},{type:'v',x:-120,z1:-500,z2:-340},{type:'h',z:-480,x1:-260,x2:-100},{type:'v',x:-240,z1:-620,z2:-460},{type:'h',z:-600,x1:-260,x2:-100},{type:'v',x:-120,z1:-740,z2:-580},{type:'h',z:-720,x1:-140,x2:20},{type:'v',x:0,z1:-860,z2:-700},{type:'h',z:-840,x1:-140,x2:20},{type:'h',z:-840,x1:-260,x2:-100},{type:'h',z:-840,x1:-380,x2:-220},{type:'v',x:-360,z1:-860,z2:-700},{type:'h',z:-720,x1:-380,x2:760},{type:'h',z:-600,x1:-1120,x2:880},{type:'v',x:-120,z1:-1600,z2:400},{type:'h',z:-240,x1:-1120,x2:880},{type:'v',x:-120,z1:-1240,z2:760},{type:'h',z:-120,x1:-1240,x2:760},{type:'v',x:-240,z1:-1120,z2:880},{type:'h',z:-480,x1:-1120,x2:880},{type:'v',x:-120,z1:-1480,z2:520},{type:'h',z:-840,x1:-1360,x2:640},{type:'v',x:-360,z1:-1840,z2:160}],route:[{x:0,z:0},{x:-120,z:0},{x:-240,z:0},{x:-240,z:-120},{x:-120,z:-120},{x:0,z:-120},{x:0,z:-240},{x:-120,z:-240},{x:-120,z:-360},{x:-120,z:-480},{x:-240,z:-480},{x:-240,z:-600},{x:-120,z:-600},{x:-120,z:-720},{x:0,z:-720},{x:0,z:-840},{x:-120,z:-840},{x:-240,z:-840},{x:-360,z:-840},{x:-360,z:-720},{x:-240,z:-720}],ints:[[-240,-840],[0,-840],[-360,-840],[-360,-720],[-120,-360],[-240,-120],[0,0],[-120,-480],[-240,-480],[-120,-600],[-120,-720],[0,-240],[-240,-720],[-120,-840],[-120,0],[0,-120],[-120,-120],[-240,0],[0,-720],[-240,-600],[-120,-240]],bldg:[{x:-262,z1:-120,z2:0,s:0.9},{x:-218,z1:-120,z2:0,s:0.9},{x:-22,z1:-240,z2:-120,s:0.9},{x:22,z1:-240,z2:-120,s:0.9},{x:-142,z1:-360,z2:-240,s:0.9},{x:-98,z1:-360,z2:-240,s:0.9},{x:-142,z1:-480,z2:-360,s:0.9},{x:-98,z1:-480,z2:-360,s:0.9},{x:-262,z1:-600,z2:-480,s:0.9},{x:-218,z1:-600,z2:-480,s:0.9},{x:-142,z1:-720,z2:-600,s:0.9},{x:-98,z1:-720,z2:-600,s:0.9},{x:-22,z1:-840,z2:-720,s:0.9},{x:22,z1:-840,z2:-720,s:0.9},{x:-382,z1:-840,z2:-720,s:0.9},{x:-338,z1:-840,z2:-720,s:0.9}],timeLimit:1820,hasGarage:true},
   13:{name:'Linking Road',sky:0x7a9eb5,fog:300,ground:0x346a2e,amb:0.75,veh:'car',npcTypes:['car','auto','car','bike','car','taxi','auto','bike','car','auto','car','bike','car','auto','car','bike'],hasCheckpoint:true,checkpointZ:0,roads:[{type:'h',z:0,x1:-1000,x2:140},{type:'v',x:120,z1:-20,z2:140},{type:'v',x:120,z1:100,z2:260},{type:'v',x:120,z1:220,z2:380},{type:'v',x:120,z1:340,z2:500},{type:'h',z:480,x1:100,x2:260},{type:'v',x:240,z1:460,z2:620},{type:'v',x:240,z1:580,z2:740},{type:'h',z:720,x1:100,x2:260},{type:'h',z:720,x1:-20,x2:140},{type:'v',x:0,z1:580,z2:740},{type:'v',x:0,z1:460,z2:620},{type:'h',z:480,x1:-140,x2:20},{type:'h',z:480,x1:-260,x2:-100},{type:'v',x:-240,z1:340,z2:500},{type:'v',x:-240,z1:220,z2:380},{type:'h',z:240,x1:-380,x2:-220},{type:'v',x:-360,z1:220,z2:380},{type:'h',z:360,x1:-500,x2:-340},{type:'v',x:-480,z1:340,z2:500},{type:'h',z:480,x1:-500,x2:-340},{type:'v',x:-360,z1:460,z2:620},{type:'v',x:-360,z1:580,z2:740},{type:'v',x:-360,z1:700,z2:860},{type:'v',x:-360,z1:820,z2:980},{type:'h',z:960,x1:-500,x2:-340},{type:'v',x:-480,z1:940,z2:1100},{type:'h',z:1080,x1:-620,x2:-460},{type:'v',x:-600,z1:1060,z2:1220},{type:'h',z:1200,x1:-740,x2:-580},{type:'v',x:-720,z1:1180,z2:1340},{type:'v',x:-720,z1:1300,z2:1460},{type:'h',z:1440,x1:-740,x2:-580},{type:'v',x:-600,z1:1300,z2:1460},{type:'h',z:1320,x1:-620,x2:-460},{type:'h',z:1320,x1:-500,x2:-340},{type:'v',x:-360,z1:1180,z2:1340},{type:'h',z:1200,x1:-1480,x2:-340},{type:'h',z:480,x1:-1480,x2:520},{type:'v',x:-480,z1:-520,z2:1480},{type:'h',z:720,x1:-760,x2:1240},{type:'v',x:240,z1:-280,z2:1720},{type:'h',z:720,x1:-1000,x2:1000},{type:'v',x:0,z1:-280,z2:1720},{type:'h',z:720,x1:-760,x2:1240},{type:'v',x:240,z1:-280,z2:1720},{type:'h',z:480,x1:-1360,x2:640},{type:'v',x:-360,z1:-520,z2:1480}],route:[{x:0,z:0},{x:120,z:0},{x:120,z:120},{x:120,z:240},{x:120,z:360},{x:120,z:480},{x:240,z:480},{x:240,z:600},{x:240,z:720},{x:120,z:720},{x:0,z:720},{x:0,z:600},{x:0,z:480},{x:-120,z:480},{x:-240,z:480},{x:-240,z:360},{x:-240,z:240},{x:-360,z:240},{x:-360,z:360},{x:-480,z:360},{x:-480,z:480},{x:-360,z:480},{x:-360,z:600},{x:-360,z:720},{x:-360,z:840},{x:-360,z:960},{x:-480,z:960},{x:-480,z:1080},{x:-600,z:1080},{x:-600,z:1200},{x:-720,z:1200},{x:-720,z:1320},{x:-720,z:1440},{x:-600,z:1440},{x:-600,z:1320},{x:-480,z:1320},{x:-360,z:1320},{x:-360,z:1200},{x:-480,z:1200}],ints:[[-480,1320],[-360,240],[-240,480],[-720,1320],[120,360],[-360,1200],[-360,960],[0,0],[-480,480],[-360,1320],[-720,1200],[-720,1440],[120,240],[-600,1440],[-360,480],[-480,360],[-600,1080],[240,720],[0,600],[-240,360],[120,480],[-240,240],[-480,960],[-480,1080],[120,0],[120,120],[-600,1200],[-480,1200],[-600,1320],[240,480],[240,600],[-360,720],[0,720],[-120,480],[-360,840],[0,480],[120,720],[-360,360],[-360,600]],bldg:[{x:98,z1:0,z2:120,s:0.9},{x:142,z1:0,z2:120,s:0.9},{x:98,z1:120,z2:240,s:0.9},{x:142,z1:120,z2:240,s:0.9},{x:98,z1:240,z2:360,s:0.9},{x:142,z1:240,z2:360,s:0.9},{x:98,z1:360,z2:480,s:0.9},{x:142,z1:360,z2:480,s:0.9},{x:218,z1:480,z2:600,s:0.9},{x:262,z1:480,z2:600,s:0.9},{x:218,z1:600,z2:720,s:0.9},{x:262,z1:600,z2:720,s:0.9},{x:-22,z1:600,z2:720,s:0.9},{x:22,z1:600,z2:720,s:0.9},{x:-22,z1:480,z2:600,s:0.9},{x:22,z1:480,z2:600,s:0.9},{x:-262,z1:360,z2:480,s:0.9},{x:-218,z1:360,z2:480,s:0.9},{x:-262,z1:240,z2:360,s:0.9},{x:-218,z1:240,z2:360,s:0.9},{x:-382,z1:240,z2:360,s:0.9},{x:-338,z1:240,z2:360,s:0.9},{x:-502,z1:360,z2:480,s:0.9},{x:-458,z1:360,z2:480,s:0.9},{x:-382,z1:480,z2:600,s:0.9},{x:-338,z1:480,z2:600,s:0.9},{x:-382,z1:600,z2:720,s:0.9},{x:-338,z1:600,z2:720,s:0.9},{x:-382,z1:720,z2:840,s:0.9},{x:-338,z1:720,z2:840,s:0.9},{x:-382,z1:840,z2:960,s:0.9},{x:-338,z1:840,z2:960,s:0.9},{x:-502,z1:960,z2:1080,s:0.9},{x:-458,z1:960,z2:1080,s:0.9},{x:-622,z1:1080,z2:1200,s:0.9},{x:-578,z1:1080,z2:1200,s:0.9},{x:-742,z1:1200,z2:1320,s:0.9},{x:-698,z1:1200,z2:1320,s:0.9},{x:-742,z1:1320,z2:1440,s:0.9},{x:-698,z1:1320,z2:1440,s:0.9},{x:-622,z1:1320,z2:1440,s:0.9},{x:-578,z1:1320,z2:1440,s:0.9},{x:-382,z1:1200,z2:1320,s:0.9},{x:-338,z1:1200,z2:1320,s:0.9}],timeLimit:1930,hasGarage:true},
   14:{name:'Bandra-Worli Sea Link',sky:0x4a90d9,fog:500,ground:0x1a5a8a,amb:0.9,veh:'car_highway',npcTypes:['car','car','car','truck','car','car','bus','car','car','car','car','car','car','car','taxi','car','car','car','car','bus','car','car','car','car','car','car','car','car'],isBridge:true,speedMin:40,speedMax:80,roads:[{type:'v',x:0,z1:-140,z2:1000},{type:'h',z:-120,x1:-20,x2:140},{type:'v',x:120,z1:-260,z2:-100},{type:'h',z:-240,x1:-20,x2:140},{type:'h',z:-240,x1:-140,x2:20},{type:'v',x:-120,z1:-260,z2:-100},{type:'v',x:-120,z1:-140,z2:20},{type:'h',z:0,x1:-260,x2:-100},{type:'h',z:0,x1:-380,x2:-220},{type:'v',x:-360,z1:-140,z2:20},{type:'v',x:-360,z1:-260,z2:-100},{type:'h',z:-240,x1:-500,x2:-340},{type:'h',z:-240,x1:-620,x2:-460},{type:'h',z:-240,x1:-740,x2:-580},{type:'v',x:-720,z1:-260,z2:-100},{type:'h',z:-120,x1:-860,x2:-700},{type:'v',x:-840,z1:-260,z2:-100},{type:'h',z:-240,x1:-980,x2:-820},{type:'v',x:-960,z1:-380,z2:-220},{type:'h',z:-360,x1:-980,x2:-820},{type:'v',x:-840,z1:-500,z2:-340},{type:'h',z:-480,x1:-860,x2:-700},{type:'h',z:-480,x1:-740,x2:-580},{type:'v',x:-600,z1:-500,z2:-340},{type:'h',z:-360,x1:-620,x2:-460},{type:'h',z:-360,x1:-500,x2:-340},{type:'v',x:-360,z1:-500,z2:-340},{type:'h',z:-480,x1:-500,x2:-340},{type:'v',x:-480,z1:-620,z2:-460},{type:'v',x:-480,z1:-740,z2:-580},{type:'h',z:-720,x1:-500,x2:-340},{type:'v',x:-360,z1:-860,z2:-700},{type:'h',z:-840,x1:-500,x2:-340},{type:'h',z:-840,x1:-620,x2:-460},{type:'v',x:-600,z1:-980,z2:-820},{type:'h',z:-960,x1:-620,x2:-460},{type:'v',x:-480,z1:-1100,z2:-940},{type:'h',z:-1080,x1:-620,x2:-460},{type:'h',z:-1080,x1:-740,x2:-580},{type:'v',x:-720,z1:-1100,z2:-940},{type:'v',x:-720,z1:-980,z2:-820},{type:'v',x:-720,z1:-860,z2:-700},{type:'v',x:-720,z1:-740,z2:-580},{type:'h',z:-600,x1:-740,x2:-580},{type:'v',x:-600,z1:-1720,z2:-580},{type:'h',z:-240,x1:-1840,x2:160},{type:'v',x:-840,z1:-1240,z2:760},{type:'h',z:0,x1:-1120,x2:880},{type:'v',x:-120,z1:-1000,z2:1000},{type:'h',z:-840,x1:-1480,x2:520},{type:'v',x:-480,z1:-1840,z2:160},{type:'h',z:-480,x1:-1480,x2:520},{type:'v',x:-480,z1:-1480,z2:520},{type:'h',z:-360,x1:-1960,x2:40},{type:'v',x:-960,z1:-1360,z2:640}],route:[{x:0,z:0},{x:0,z:-120},{x:120,z:-120},{x:120,z:-240},{x:0,z:-240},{x:-120,z:-240},{x:-120,z:-120},{x:-120,z:0},{x:-240,z:0},{x:-360,z:0},{x:-360,z:-120},{x:-360,z:-240},{x:-480,z:-240},{x:-600,z:-240},{x:-720,z:-240},{x:-720,z:-120},{x:-840,z:-120},{x:-840,z:-240},{x:-960,z:-240},{x:-960,z:-360},{x:-840,z:-360},{x:-840,z:-480},{x:-720,z:-480},{x:-600,z:-480},{x:-600,z:-360},{x:-480,z:-360},{x:-360,z:-360},{x:-360,z:-480},{x:-480,z:-480},{x:-480,z:-600},{x:-480,z:-720},{x:-360,z:-720},{x:-360,z:-840},{x:-480,z:-840},{x:-600,z:-840},{x:-600,z:-960},{x:-480,z:-960},{x:-480,z:-1080},{x:-600,z:-1080},{x:-720,z:-1080},{x:-720,z:-960},{x:-720,z:-840},{x:-720,z:-720},{x:-720,z:-600},{x:-600,z:-600},{x:-600,z:-720}],ints:[[-600,-1080],[-840,-240],[-360,0],[-360,-840],[-480,-360],[-600,-600],[-960,-240],[-960,-360],[-360,-720],[-720,-120],[-480,-960],[0,0],[-720,-480],[-720,-600],[-600,-720],[-480,-600],[-480,-480],[120,-240],[-720,-1080],[-360,-240],[-480,-720],[0,-240],[-480,-1080],[-360,-480],[-600,-840],[-720,-840],[-720,-960],[-600,-360],[-360,-360],[-360,-120],[-120,0],[-840,-360],[-720,-720],[0,-120],[-120,-120],[-480,-240],[-240,0],[120,-120],[-840,-120],[-600,-960],[-480,-840],[-720,-240],[-120,-240],[-600,-480],[-840,-480],[-600,-240]],bldg:[{x:-22,z1:-120,z2:0,s:0.9},{x:22,z1:-120,z2:0,s:0.9},{x:98,z1:-240,z2:-120,s:0.9},{x:142,z1:-240,z2:-120,s:0.9},{x:-142,z1:-240,z2:-120,s:0.9},{x:-98,z1:-240,z2:-120,s:0.9},{x:-142,z1:-120,z2:0,s:0.9},{x:-98,z1:-120,z2:0,s:0.9},{x:-382,z1:-120,z2:0,s:0.9},{x:-338,z1:-120,z2:0,s:0.9},{x:-382,z1:-240,z2:-120,s:0.9},{x:-338,z1:-240,z2:-120,s:0.9},{x:-742,z1:-240,z2:-120,s:0.9},{x:-698,z1:-240,z2:-120,s:0.9},{x:-862,z1:-240,z2:-120,s:0.9},{x:-818,z1:-240,z2:-120,s:0.9},{x:-982,z1:-360,z2:-240,s:0.9},{x:-938,z1:-360,z2:-240,s:0.9},{x:-862,z1:-480,z2:-360,s:0.9},{x:-818,z1:-480,z2:-360,s:0.9},{x:-622,z1:-480,z2:-360,s:0.9},{x:-578,z1:-480,z2:-360,s:0.9},{x:-382,z1:-480,z2:-360,s:0.9},{x:-338,z1:-480,z2:-360,s:0.9},{x:-502,z1:-600,z2:-480,s:0.9},{x:-458,z1:-600,z2:-480,s:0.9},{x:-502,z1:-720,z2:-600,s:0.9},{x:-458,z1:-720,z2:-600,s:0.9},{x:-382,z1:-840,z2:-720,s:0.9},{x:-338,z1:-840,z2:-720,s:0.9},{x:-622,z1:-960,z2:-840,s:0.9},{x:-578,z1:-960,z2:-840,s:0.9},{x:-502,z1:-1080,z2:-960,s:0.9},{x:-458,z1:-1080,z2:-960,s:0.9},{x:-742,z1:-1080,z2:-960,s:0.9},{x:-698,z1:-1080,z2:-960,s:0.9},{x:-742,z1:-960,z2:-840,s:0.9},{x:-698,z1:-960,z2:-840,s:0.9},{x:-742,z1:-840,z2:-720,s:0.9},{x:-698,z1:-840,z2:-720,s:0.9},{x:-742,z1:-720,z2:-600,s:0.9},{x:-698,z1:-720,z2:-600,s:0.9},{x:-622,z1:-720,z2:-600,s:0.9},{x:-578,z1:-720,z2:-600,s:0.9}],timeLimit:2040,hasGarage:true},
   15:{name:'South Mumbai Circuit',sky:0x7ab5d0,fog:450,ground:0x2e6b32,amb:0.8,veh:'car',npcTypes:['car','bus','auto','bike','truck','car','cycle','auto','car','bus','bike','car','taxi','auto','car','bus','bike','car','auto','taxi','car','bus','auto','bike','car','truck','car','auto','car','bus'],roads:[{type:'h',z:0,x1:-140,x2:1000},{type:'v',x:-120,z1:-20,z2:140},{type:'h',z:120,x1:-140,x2:20},{type:'h',z:120,x1:-20,x2:140},{type:'h',z:120,x1:100,x2:260},{type:'v',x:240,z1:100,z2:260},{type:'v',x:240,z1:220,z2:380},{type:'h',z:360,x1:100,x2:260},{type:'v',x:120,z1:220,z2:380},{type:'h',z:240,x1:-20,x2:140},{type:'v',x:0,z1:220,z2:380},{type:'h',z:360,x1:-140,x2:20},{type:'v',x:-120,z1:340,z2:500},{type:'v',x:-120,z1:460,z2:620},{type:'h',z:600,x1:-140,x2:20},{type:'v',x:0,z1:460,z2:620},{type:'h',z:480,x1:-20,x2:140},{type:'h',z:480,x1:100,x2:260},{type:'h',z:480,x1:220,x2:380},{type:'h',z:480,x1:340,x2:500},{type:'h',z:480,x1:460,x2:620},{type:'v',x:600,z1:460,z2:620},{type:'h',z:600,x1:580,x2:740},{type:'v',x:720,z1:580,z2:740},{type:'v',x:720,z1:700,z2:860},{type:'h',z:840,x1:580,x2:740},{type:'h',z:840,x1:460,x2:620},{type:'v',x:480,z1:700,z2:860},{type:'v',x:480,z1:580,z2:740},{type:'h',z:600,x1:340,x2:500},{type:'h',z:600,x1:220,x2:380},{type:'h',z:600,x1:100,x2:260},{type:'v',x:120,z1:580,z2:740},{type:'v',x:120,z1:700,z2:860},{type:'h',z:840,x1:-20,x2:140},{type:'v',x:0,z1:820,z2:980},{type:'h',z:960,x1:-140,x2:20},{type:'v',x:-120,z1:820,z2:980},{type:'h',z:840,x1:-260,x2:-100},{type:'h',z:840,x1:-380,x2:-220},{type:'h',z:840,x1:-500,x2:-340},{type:'v',x:-480,z1:820,z2:980},{type:'h',z:960,x1:-500,x2:-340},{type:'v',x:-360,z1:940,z2:1100},{type:'v',x:-360,z1:1060,z2:1220},{type:'v',x:-360,z1:1180,z2:1340},{type:'v',x:-360,z1:1300,z2:1460},{type:'v',x:-360,z1:1420,z2:1580},{type:'h',z:1560,x1:-380,x2:-220},{type:'h',z:1560,x1:-260,x2:-100},{type:'v',x:-120,z1:1420,z2:1580},{type:'h',z:1440,x1:-140,x2:20},{type:'v',x:0,z1:1420,z2:1580},{type:'h',z:1560,x1:-20,x2:140},{type:'h',z:1560,x1:100,x2:260},{type:'v',x:240,z1:1420,z2:1580},{type:'h',z:1440,x1:100,x2:260},{type:'v',x:120,z1:1300,z2:1460},{type:'v',x:120,z1:1180,z2:1340},{type:'h',z:1200,x1:100,x2:260},{type:'v',x:240,z1:1180,z2:1340},{type:'h',z:1320,x1:220,x2:380},{type:'h',z:1320,x1:340,x2:500},{type:'h',z:1320,x1:460,x2:620},{type:'v',x:600,z1:1300,z2:1460},{type:'h',z:1440,x1:580,x2:740},{type:'v',x:720,z1:1420,z2:1580},{type:'h',z:1560,x1:580,x2:740},{type:'v',x:600,z1:1540,z2:1700},{type:'v',x:600,z1:1660,z2:1820},{type:'v',x:600,z1:1780,z2:1940},{type:'v',x:600,z1:1900,z2:2060},{type:'v',x:600,z1:2020,z2:2180},{type:'h',z:2160,x1:580,x2:740},{type:'h',z:2160,x1:700,x2:860},{type:'v',x:840,z1:2140,z2:2300},{type:'v',x:840,z1:2260,z2:2420},{type:'h',z:2400,x1:700,x2:860},{type:'v',x:720,z1:2380,z2:2540},{type:'v',x:720,z1:2500,z2:3640},{type:'h',z:840,x1:-1240,x2:760},{type:'v',x:-240,z1:-160,z2:1840},{type:'h',z:1560,x1:-1120,x2:880},{type:'v',x:-120,z1:560,z2:2560},{type:'h',z:120,x1:-1120,x2:880},{type:'v',x:-120,z1:-880,z2:1120},{type:'h',z:720,x1:-880,x2:1120},{type:'v',x:120,z1:-280,z2:1720},{type:'h',z:480,x1:-520,x2:1480},{type:'v',x:480,z1:-520,z2:1480}],route:[{x:0,z:0},{x:-120,z:0},{x:-120,z:120},{x:0,z:120},{x:120,z:120},{x:240,z:120},{x:240,z:240},{x:240,z:360},{x:120,z:360},{x:120,z:240},{x:0,z:240},{x:0,z:360},{x:-120,z:360},{x:-120,z:480},{x:-120,z:600},{x:0,z:600},{x:0,z:480},{x:120,z:480},{x:240,z:480},{x:360,z:480},{x:480,z:480},{x:600,z:480},{x:600,z:600},{x:720,z:600},{x:720,z:720},{x:720,z:840},{x:600,z:840},{x:480,z:840},{x:480,z:720},{x:480,z:600},{x:360,z:600},{x:240,z:600},{x:120,z:600},{x:120,z:720},{x:120,z:840},{x:0,z:840},{x:0,z:960},{x:-120,z:960},{x:-120,z:840},{x:-240,z:840},{x:-360,z:840},{x:-480,z:840},{x:-480,z:960},{x:-360,z:960},{x:-360,z:1080},{x:-360,z:1200},{x:-360,z:1320},{x:-360,z:1440},{x:-360,z:1560},{x:-240,z:1560},{x:-120,z:1560},{x:-120,z:1440},{x:0,z:1440},{x:0,z:1560},{x:120,z:1560},{x:240,z:1560},{x:240,z:1440},{x:120,z:1440},{x:120,z:1320},{x:120,z:1200},{x:240,z:1200},{x:240,z:1320},{x:360,z:1320},{x:480,z:1320},{x:600,z:1320},{x:600,z:1440},{x:720,z:1440},{x:720,z:1560},{x:600,z:1560},{x:600,z:1680},{x:600,z:1800},{x:600,z:1920},{x:600,z:2040},{x:600,z:2160},{x:720,z:2160},{x:840,z:2160},{x:840,z:2280},{x:840,z:2400},{x:720,z:2400},{x:720,z:2520},{x:720,z:2640}],ints:[[-120,960],[480,840],[-360,960],[840,2160],[120,1200],[360,600],[840,2280],[120,600],[600,1320],[-360,1080],[0,1560],[0,480],[600,1920],[0,240],[240,1200],[720,1560],[-120,360],[720,720],[120,360],[120,1440],[480,720],[720,2160],[120,240],[360,480],[120,1560],[-240,840],[240,1560],[120,480],[240,1440],[600,840],[-480,960],[480,1320],[240,240],[720,840],[0,360],[0,1440],[240,480],[240,600],[120,1320],[600,1440],[240,120],[-360,840],[-360,1560],[600,1800],[360,1320],[600,2160],[-360,1200],[0,120],[600,1560],[-360,1320],[720,2640],[600,2040],[720,600],[-120,120],[120,120],[-120,600],[-120,840],[240,1320],[240,360],[-240,1560],[480,480],[600,600],[120,840],[0,0],[0,840],[-120,1560],[600,1680],[600,480],[0,960],[720,2520],[720,1440],[0,600],[-120,0],[720,2400],[-120,1440],[-360,1440],[480,600],[-120,480],[120,720],[-480,840],[840,2400]],bldg:[{x:-142,z1:0,z2:120,s:0.9},{x:-98,z1:0,z2:120,s:0.9},{x:218,z1:120,z2:240,s:0.9},{x:262,z1:120,z2:240,s:0.9},{x:218,z1:240,z2:360,s:0.9},{x:262,z1:240,z2:360,s:0.9},{x:98,z1:240,z2:360,s:0.9},{x:142,z1:240,z2:360,s:0.9},{x:-22,z1:240,z2:360,s:0.9},{x:22,z1:240,z2:360,s:0.9},{x:-142,z1:360,z2:480,s:0.9},{x:-98,z1:360,z2:480,s:0.9},{x:-142,z1:480,z2:600,s:0.9},{x:-98,z1:480,z2:600,s:0.9},{x:-22,z1:480,z2:600,s:0.9},{x:22,z1:480,z2:600,s:0.9},{x:578,z1:480,z2:600,s:0.9},{x:622,z1:480,z2:600,s:0.9},{x:698,z1:600,z2:720,s:0.9},{x:742,z1:600,z2:720,s:0.9},{x:698,z1:720,z2:840,s:0.9},{x:742,z1:720,z2:840,s:0.9},{x:458,z1:720,z2:840,s:0.9},{x:502,z1:720,z2:840,s:0.9},{x:458,z1:600,z2:720,s:0.9},{x:502,z1:600,z2:720,s:0.9},{x:98,z1:600,z2:720,s:0.9},{x:142,z1:600,z2:720,s:0.9},{x:98,z1:720,z2:840,s:0.9},{x:142,z1:720,z2:840,s:0.9},{x:-22,z1:840,z2:960,s:0.9},{x:22,z1:840,z2:960,s:0.9},{x:-142,z1:840,z2:960,s:0.9},{x:-98,z1:840,z2:960,s:0.9},{x:-502,z1:840,z2:960,s:0.9},{x:-458,z1:840,z2:960,s:0.9},{x:-382,z1:960,z2:1080,s:0.9},{x:-338,z1:960,z2:1080,s:0.9},{x:-382,z1:1080,z2:1200,s:0.9},{x:-338,z1:1080,z2:1200,s:0.9},{x:-382,z1:1200,z2:1320,s:0.9},{x:-338,z1:1200,z2:1320,s:0.9},{x:-382,z1:1320,z2:1440,s:0.9},{x:-338,z1:1320,z2:1440,s:0.9},{x:-382,z1:1440,z2:1560,s:0.9},{x:-338,z1:1440,z2:1560,s:0.9},{x:-142,z1:1440,z2:1560,s:0.9},{x:-98,z1:1440,z2:1560,s:0.9},{x:-22,z1:1440,z2:1560,s:0.9},{x:22,z1:1440,z2:1560,s:0.9},{x:218,z1:1440,z2:1560,s:0.9},{x:262,z1:1440,z2:1560,s:0.9},{x:98,z1:1320,z2:1440,s:0.9},{x:142,z1:1320,z2:1440,s:0.9},{x:98,z1:1200,z2:1320,s:0.9},{x:142,z1:1200,z2:1320,s:0.9},{x:218,z1:1200,z2:1320,s:0.9},{x:262,z1:1200,z2:1320,s:0.9},{x:578,z1:1320,z2:1440,s:0.9},{x:622,z1:1320,z2:1440,s:0.9},{x:698,z1:1440,z2:1560,s:0.9},{x:742,z1:1440,z2:1560,s:0.9},{x:578,z1:1560,z2:1680,s:0.9},{x:622,z1:1560,z2:1680,s:0.9},{x:578,z1:1680,z2:1800,s:0.9},{x:622,z1:1680,z2:1800,s:0.9},{x:578,z1:1800,z2:1920,s:0.9},{x:622,z1:1800,z2:1920,s:0.9},{x:578,z1:1920,z2:2040,s:0.9},{x:622,z1:1920,z2:2040,s:0.9},{x:578,z1:2040,z2:2160,s:0.9},{x:622,z1:2040,z2:2160,s:0.9},{x:818,z1:2160,z2:2280,s:0.9},{x:862,z1:2160,z2:2280,s:0.9},{x:818,z1:2280,z2:2400,s:0.9},{x:862,z1:2280,z2:2400,s:0.9},{x:698,z1:2400,z2:2520,s:0.9},{x:742,z1:2400,z2:2520,s:0.9},{x:698,z1:2520,z2:2640,s:0.9},{x:742,z1:2520,z2:2640,s:0.9}],timeLimit:2300,hasGarage:true}
  };
  return M[lvId]||M[1];
 }

 // 🚦 VEHICLE MESH BUILDERS 🚦
 _pmesh(mode,vehType){
  this.isPedestrian=false;
  const vt=vehType||'car';
  if(vt==='pedestrian'){
    this.isPedestrian=true;
    this.player=_buildHuman(true);
    let pStartX = -40 + 7, pStartZ = -80, pRot = 0;
    if (this.mapCfg && this.mapCfg.route && this.mapCfg.route.length >= 2) {
      const p1 = this.mapCfg.route[0];
      const p2 = this.mapCfg.route[1];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      const nx = dx / dist;
      const nz = dz / dist;
      // Sidewalk offset is roughly perpendicular to direction
      // Perpendicular vector: (-nz, nx)
      pStartX = p1.x + nx * 5 - nz * 7;
      pStartZ = p1.z + nz * 5 + nx * 7;
      pRot = Math.atan2(nx, nz);
    }
    this.player.position.set(pStartX,0,pStartZ);
    this.player.rotation.y = pRot;
    this.scene.add(this.player);
    this.maxSpd=0.12;this.accel=0.06;this.turn=0.05;this.fric=0.88;
  } else {
    if (vt === 'car' && window.lamboModel) {
        this.player = window.lamboModel.clone();
    } else {
        this.player=_buildVehicle(vt, 0xffffff);
    }
    
    let startX = 0, startZ = -240, rY = 0;
    if (this.mapCfg && this.mapCfg.route && this.mapCfg.route.length >= 2) {
      const p1 = this.mapCfg.route[0];
      const p2 = this.mapCfg.route[1];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      const nx = dx / dist;
      const nz = dz / dist;
      // Spawn slightly ahead of start point
      startX = p1.x + nx * 15;
      startZ = p1.z + nz * 15;
      // Rotation: Math.atan2(x, z)
      rY = Math.atan2(nx, nz);
    }
    
    this.player.position.set(startX,0,startZ);
    this.player.rotation.y = rY;
    this.scene.add(this.player);
    this.maxSpd=mode==='highway'?0.85:0.60;this.accel=0.022;this.turn=0.042;this.fric=mode==='rain'?0.90:0.94;
  }
 }

 _makeNPC(type,col){
  return _buildVehicle(type, col);
 }

 // 🚦 INDIAN STREET ENVIRONMENT ARCHITECTURE 🚦
 _buildScene(mode){
  while(this.scene&&this.scene.children.length)this.scene.remove(this.scene.children[0]);
  this.world=[];this.npcs=[];this.sigs=[];this.cps=[];this.spc=[];this.obstacles=[];this.roadSegments=[];this.driveRoute=[];this.peds=[];
  
  const lvId=ui.cur?ui.cur.id:1;
  const cfg=this._getMapConfig(lvId);
  this.mapCfg=cfg;
  this.timeLimit=cfg.timeLimit||120;
  this.isPedestrian=!!cfg.isPedestrian;

  const sk=cfg.sky;
  this.scene.background=new THREE.Color(sk);
  this.scene.fog=new THREE.Fog(sk,30,cfg.fog||160);
  this.scene.add(new THREE.AmbientLight(0xffffff,cfg.amb||0.8));
  const sun=new THREE.DirectionalLight(0xfff4dd,cfg.isNight?0.3:0.9);
  sun.position.set(20,40,10);this.scene.add(sun);
  if(cfg.isNight){
   const moon=new THREE.DirectionalLight(0x6688cc,0.4);moon.position.set(-10,30,-20);this.scene.add(moon);
  }

  const RW=cfg.isPedestrian?10:12;
  this.roadSegments=cfg.roads;
  this.driveRoute=cfg.route;
  const mats={
   grass:new THREE.MeshPhongMaterial({color:cfg.ground||0x33691e}),
   road:new THREE.MeshPhongMaterial({color:0x21232b, map:_genTex('asphalt')}),
   pave:new THREE.MeshPhongMaterial({color:0x757575, map:_genTex('pave')}),
   yellowLine:new THREE.MeshBasicMaterial({color:0xffcc00}),
   water:new THREE.MeshPhongMaterial({color:0x1a5a8a,transparent:true,opacity:0.7})
  };

  const ground=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),cfg.isBridge?mats.water:mats.grass);
  ground.rotation.x=-Math.PI/2;this.scene.add(ground);

  // Build roads
  cfg.roads.forEach(r=>{
   const isV=r.type==='v';
   const len=isV?Math.abs(r.z2-r.z1):Math.abs(r.x2-r.x1);
   const cx=isV?r.x:(r.x1+r.x2)/2;
   const cz=isV?(r.z1+r.z2)/2:r.z;
   const road=new THREE.Mesh(isV?new THREE.PlaneGeometry(RW,len):new THREE.PlaneGeometry(len,RW),mats.road);
   road.rotation.x=-Math.PI/2;road.position.set(cx,.02,cz);this.scene.add(road);this.world.push(road);
   // Yellow mid-line
   const midLine=new THREE.Mesh(isV?new THREE.PlaneGeometry(0.15,len):new THREE.PlaneGeometry(len,0.15),mats.yellowLine);
   midLine.rotation.x=-Math.PI/2;midLine.position.set(cx,.025,cz);this.scene.add(midLine);
   // Sidewalks
   [-1,1].forEach(s=>{
    const swW=cfg.isPedestrian?12:2.5;const p=new THREE.Mesh(isV?new THREE.BoxGeometry(swW,.15,len):new THREE.BoxGeometry(len,.15,swW),mats.pave);
    p.position.set(isV?cx+s*(RW/2+swW/2):cx,.07,isV?cz:cz+s*(RW/2+swW/2));this.scene.add(p);this.world.push(p);
   });
   // Dashed white lane markers
   const dashCount=Math.floor(len/8);
   for(let d=0;d<dashCount;d++){
    const dPos=d*8-len/2+4;
    [-RW/4,RW/4].forEach(offset=>{
     const dash=new THREE.Mesh(new THREE.PlaneGeometry(isV?0.1:3,isV?3:0.1),new THREE.MeshBasicMaterial({color:0xffffff}));
     dash.rotation.x=-Math.PI/2;
     dash.position.set(isV?cx+offset:cx+dPos,.024,isV?cz+dPos:cz+offset);
     this.scene.add(dash);
    });
   }
  });

  // Advanced Procedural Cityscape
  const bMats = [
    new THREE.MeshLambertMaterial({color:0xcccccc, map:gTex.building}), 
    new THREE.MeshLambertMaterial({color:0xe0e0e0, map:gTex.building}),
    new THREE.MeshLambertMaterial({color:0xbdbdbd, map:gTex.building}), 
    new THREE.MeshLambertMaterial({color:0xd6d6d6, map:gTex.building})
  ];
  const winMat = new THREE.MeshBasicMaterial({color:0x1a252c});
  
  const drawBldg = (bx, bz, type, rot) => {
    const g = new THREE.Group();
    const mat = type==='police'?new THREE.MeshLambertMaterial({color:0xffffff, map:gTex.police}) :
                type==='hospital'?new THREE.MeshLambertMaterial({color:0xffffff, map:gTex.hospital}) :
                type==='bank'?new THREE.MeshLambertMaterial({color:0xffffff, map:gTex.bank}) :
                type==='temple'?new THREE.MeshLambertMaterial({color:0xffffff, map:gTex.temple}) :
                type==='shop'?new THREE.MeshLambertMaterial({color:0xffffff, map:gTex.shop}) :
                bMats[Math.floor(Math.random()*bMats.length)];
                
    const bh = type==='temple'?4: type==='skyscraper'?20+Math.random()*20 : type==='chawl'?12+Math.random()*6 : 8+Math.random()*8;
    const bw = type==='chawl'?4+Math.random()*2 : 5+Math.random()*5;
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 7), mat);
    bMesh.position.y = bh/2;
    g.add(bMesh);
    
    if(type === 'police'){
      const light = new THREE.Mesh(new THREE.BoxGeometry(2,0.5,0.5), new THREE.MeshBasicMaterial({color:0xff0000}));
      light.position.set(0, bh+0.25, 3.1); g.add(light);
    } else if(type === 'hospital'){
      const crossG = new THREE.Group();
      crossG.add(new THREE.Mesh(new THREE.BoxGeometry(2,0.6,0.2), new THREE.MeshBasicMaterial({color:0xff0000})));
      crossG.add(new THREE.Mesh(new THREE.BoxGeometry(0.6,2,0.2), new THREE.MeshBasicMaterial({color:0xff0000})));
      crossG.position.set(0, bh-2.5, 3.6); g.add(crossG);
    } else if(type === 'temple'){
      const dome = new THREE.Mesh(new THREE.ConeGeometry(3.5, 5, 8), new THREE.MeshLambertMaterial({color:0xf39c12}));
      dome.position.y = bh + 2.5; g.add(dome);
    } else if(type === 'shop'){
      const awMat = new THREE.MeshLambertMaterial({color: Math.random()>0.5?0xe74c3c:0x2980b9});
      const awning = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 2.5), awMat);
      awning.position.set(0, 3, 3.5); awning.rotation.x = -0.2; g.add(awning);
    } else {
      for(let wy=3; wy<bh-1; wy+=2.5) {
        for(let wx=-1.5; wx<=1.5; wx+=1.5) {
          const w = new THREE.Mesh(new THREE.PlaneGeometry(1,1.5), winMat);
          w.position.set(wx, wy, 3.51); g.add(w);
        }
      }
    }
    
    g.position.set(bx, 0, bz); g.rotation.y = rot;
    this.scene.add(g); this.obstacles.push(g);
  };

  cfg.roads.forEach(r=>{
    const isV=r.type==='v';
    const len=isV?Math.abs(r.z2-r.z1):Math.abs(r.x2-r.x1);
    const cx=isV?r.x:(r.x1+r.x2)/2;
    const cz=isV?(r.z1+r.z2)/2:r.z;
    
    const start = isV?Math.min(r.z1,r.z2)+15 : Math.min(r.x1,r.x2)+15;
    const end = isV?Math.max(r.z1,r.z2)-15 : Math.max(r.x1,r.x2)-15;
    
    for(let pos = start; pos < end; pos += 13) { 
      let nearInt = false;
      (cfg.ints||[]).forEach(([ix,iz])=>{
         if(isV && Math.abs(pos - iz) < 20) nearInt = true;
         if(!isV && Math.abs(pos - ix) < 20) nearInt = true;
      });
      if(nearInt) continue;
      
      [-1, 1].forEach(side => {
         const swW = cfg.isPedestrian ? 12 : 2.5; const bDist = RW/2 + swW + 4.5; // Sidewalk edge + building center
         const bx = isV ? cx + side * bDist : pos;
         const bz = isV ? pos : cz + side * bDist;
         const rot = isV ? (side>0?-Math.PI/2:Math.PI/2) : (side>0?Math.PI:0);
         
         const rnd = Math.random();
         let type = 'normal';
         if(rnd > 0.98) type = 'police';
         else if(rnd > 0.96) type = 'hospital';
         else if(rnd > 0.94) type = 'bank';
         else if(rnd > 0.92) type = 'temple';
         else if(rnd > 0.70) type = 'shop';
         else if(rnd > 0.55) type = 'chawl';
         else if(rnd > 0.45) type = 'skyscraper';
         
         drawBldg(bx, bz, type, rot);
         
         // Props along sidewalk edge
         if(Math.random()>0.5) {
           const lDist = RW/2 + 1;
           const lx = isV ? cx + side * lDist : pos;
           const lz = isV ? pos : cz + side * lDist;
           const prnd = Math.random();
           
           if(prnd > 0.85) {
              const bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.6), new THREE.MeshLambertMaterial({color:0x4a3728}));
              bench.position.set(lx, 0.3, lz);
              if(!isV) bench.rotation.y = Math.PI/2;
              this.scene.add(bench); this.obstacles.push(bench);
           } else if(prnd > 0.7) {
              const treeG = new THREE.Group();
              const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,3), new THREE.MeshLambertMaterial({color:0x5c4033}));
              trunk.position.y = 1.5; treeG.add(trunk);
              const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 7, 7), new THREE.MeshLambertMaterial({color:0x2ecc71}));
              leaves.position.y = 3.5; treeG.add(leaves);
              treeG.position.set(lx, 0, lz); this.scene.add(treeG); this.obstacles.push(treeG);
           } else if(prnd > 0.65) {
              const bStop = new THREE.Group();
              const r1 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 2), new THREE.MeshLambertMaterial({color:0x2980b9}));
              r1.position.y = 2.5; bStop.add(r1);
              const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,2.5), new THREE.MeshLambertMaterial({color:0xcccccc}));
              p1.position.set(-1.2, 1.25, -0.8); bStop.add(p1);
              const p2 = p1.clone(); p2.position.set(1.2, 1.25, -0.8); bStop.add(p2);
              bStop.position.set(lx, 0, lz); if(!isV) bStop.rotation.y = Math.PI/2;
              this.scene.add(bStop); this.obstacles.push(bStop);
           } else if(prnd > 0.5) {
              const stall = new THREE.Group();
              const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1), new THREE.MeshLambertMaterial({color:0x8B4513}));
              table.position.y = 0.4; stall.add(table);
              const umb = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), new THREE.MeshLambertMaterial({color:Math.random()>0.5?0x3498db:0xe74c3c}));
              umb.position.y = 2.2; stall.add(umb);
              const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,2.2), new THREE.MeshBasicMaterial({color:0xffffff}));
              stick.position.y = 1.1; stall.add(stick);
              stall.position.set(lx, 0, lz);
              this.scene.add(stall); this.obstacles.push(stall);
           } else {
              const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,6), new THREE.MeshLambertMaterial({color:0x333333}));
              pole.position.set(lx, 3, lz); this.scene.add(pole);
              const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.2,0.4), new THREE.MeshBasicMaterial({color:0xffffff}));
              lamp.position.set(lx + (isV ? -side*0.3 : 0), 6, lz + (!isV ? -side*0.3 : 0));
              this.scene.add(lamp);
           }
         }
      });
    }
  });

  // Player vehicle
  
  // Spawn NPC Pedestrians
  cfg.roads.forEach(r=>{
    const isV=r.type==='v';
    const cx=isV?r.x:(r.x1+r.x2)/2;
    const cz=isV?(r.z1+r.z2)/2:r.z;
    const pedCount = cfg.isPedestrian ? 15 : 1;
    for(let i=0; i<pedCount; i++){
      const ped = _buildHuman();
      const side = Math.random()>0.5?1:-1;
      const lDist = RW/2 + 1.25;
      const px = isV ? cx + side * lDist : cx + (Math.random()*60 - 30);
      const pz = isV ? cz + (Math.random()*60 - 30) : cz + side * lDist;
      ped.position.set(px, 0, pz);
      ped.userData.startZ = isV ? pz : px;
      ped.userData.isSidewalk = true;
      ped.userData.isV = isV;
      if(!isV) ped.rotation.y = Math.PI/2;
      this.scene.add(ped);
      this.peds.push(ped);
    }
  });
  this._pmesh(mode,cfg.veh);
   // Build massive oriented garage at start and end
   if(cfg.hasGarage && cfg.route && cfg.route.length >= 2) {
     const p1 = cfg.route[0];
     const p2 = cfg.route[1];
     const dx = p2.x - p1.x;
     const dz = p2.z - p1.z;
     const dist = Math.sqrt(dx*dx + dz*dz);
     const nx = dx / dist;
     const nz = dz / dist;
     const rY = Math.atan2(nx, nz);
     const swW_p = cfg.isPedestrian ? 12 : 2.5;
     let startX = p1.x + nx * 15;
     let startZ = p1.z + nz * 15;
     if (cfg.isPedestrian) {
         startX += -nz * (RW/2 + swW_p/2 - 2);
         startZ += nx * (RW/2 + swW_p/2 - 2);
     }
     
     const buildGarage = (gx, gz, orient) => {
       const gg = new THREE.Group();
       const wallMat = new THREE.MeshLambertMaterial({color:0x2c3e50});
       const lw = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 20), wallMat);
       lw.position.set(-8, 5, 0); gg.add(lw);
       const rw = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 20), wallMat);
       rw.position.set(8, 5, 0); gg.add(rw);
       const bw = new THREE.Mesh(new THREE.BoxGeometry(17, 10, 1), wallMat);
       bw.position.set(0, 5, -9.5); gg.add(bw);
       const roof = new THREE.Mesh(new THREE.BoxGeometry(18, 1, 21), new THREE.MeshLambertMaterial({color:0x1a252f}));
       roof.position.set(0, 10.5, 0); gg.add(roof);
       const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({color:0xf39c12}));
       sign.position.set(0, 8, 10); gg.add(sign);
       
       gg.position.set(gx, 0, gz);
       gg.rotation.y = orient;
       this.scene.add(gg);
       this.obstacles.push(lw, rw, bw);
     };
     buildGarage(startX, startZ, rY);
   }
  // Checkpoints
  cfg.route.forEach((pt, idx)=>{
    let cx = pt.x, cz = pt.z;
    if (cfg.isPedestrian) {
       const swW_p = 12;
       const next = cfg.route[idx+1] || cfg.route[idx-1];
       if(next) {
         let dx = next.x - pt.x;
         let dz = next.z - pt.z;
         if(idx === cfg.route.length - 1) { dx = pt.x - next.x; dz = pt.z - next.z; }
         if(dx !== 0 || dz !== 0) {
           const dist = Math.sqrt(dx*dx + dz*dz);
           const nx = dx / dist;
           const nz = dz / dist;
           cx += -nz * (RW/2 + swW_p/2 - 2);
           cz += nx * (RW/2 + swW_p/2 - 2);
         }
       }
    }
    this._cp(cx, cz);
  });

  // Intersections with signals and zebra crossings
  (cfg.ints||[]).forEach(([ix,iz])=>{
   this._sig(ix+4.2,iz);
   if(this.isPedestrian){
     const drawZb=(px,pz,rot)=>{
       const group = new THREE.Group();
       for(let w=-6;w<=6;w+=1.5){
         const zb=new THREE.Mesh(new THREE.PlaneGeometry(1.0, 5),new THREE.MeshBasicMaterial({color:0xffffff}));
         zb.rotation.x=-Math.PI/2;
         zb.position.set(w, .035, 0);
         group.add(zb);
       }
       [-1,1].forEach(ys=>{
         const yb=new THREE.Mesh(new THREE.PlaneGeometry(14, .3),new THREE.MeshBasicMaterial({color:0xffeb3b}));
         yb.rotation.x=-Math.PI/2;
         yb.position.set(0, .036, ys*2.8);
         group.add(yb);
       });
       group.position.set(px, 0, pz);
       group.rotation.y = rot;
       this.scene.add(group);
     };
     drawZb(ix, iz + RW/2 + 2, 0); 
     drawZb(ix, iz - RW/2 - 2, 0);
     drawZb(ix + RW/2 + 2, iz, Math.PI/2); 
     drawZb(ix - RW/2 - 2, iz, Math.PI/2);
   } else {
     for(let w=-4;w<=4;w+=1.6){
      const zb=new THREE.Mesh(new THREE.PlaneGeometry(1,3),new THREE.MeshBasicMaterial({color:0xffffff}));
      zb.rotation.x=-Math.PI/2;zb.position.set(ix+w,.028,iz+RW/2+1);this.scene.add(zb);
     }
   }
  });

  // NPC Traffic - diverse vehicle types
  const npcTypes=cfg.npcTypes||['car','car','auto','bike'];
  const designColors=[0xff4444,0x1e90ff,0x3a3a3a,0xffd54a,0xffffff,0x888888,0x27ae60,0xf39c12];
  const allRoads=cfg.roads;
  npcTypes.forEach((nType,i)=>{
   const nv=this._makeNPC(nType,designColors[i%designColors.length]);
   // Place NPCs on random road segments
   const seg=allRoads[Math.floor(Math.random()*allRoads.length)];
   if(seg.type==='v'){
    nv.position.set(seg.x+(Math.random()>.5?2.5:-2.5),0,seg.z1+Math.random()*Math.abs(seg.z2-seg.z1));
   } else {
    nv.position.set(seg.x1+Math.random()*Math.abs(seg.x2-seg.x1),0,seg.z+(Math.random()>.5?2.5:-2.5));
    nv.rotation.y=Math.PI/2;
   }
   const spdMult=nType==='truck'?0.6:nType==='bus'?0.7:nType==='cycle'?0.4:nType==='bike'?0.9:nType==='auto'?0.75:0.8;
   nv.userData={spd:(0.2+Math.random()*0.15)*spdMult,isAmb:false,npcType:nType,moveAxis:seg.type};
   this.npcs.push(nv);this.scene.add(nv);
  });

  // Special features per level
  if(cfg.hasRain){this._create3DRain();
   // Spawn random puddles on the roads
   const puddleGeo = new THREE.PlaneGeometry(10, 8);
   const puddleMat = new THREE.MeshBasicMaterial({color: 0x4a6a8a, transparent: true, opacity: 0.6});
   for(let i=0; i<30; i++){
       const seg = allRoads[Math.floor(Math.random()*allRoads.length)];
       const px = seg.type==='v' ? seg.x : seg.x1 + Math.random()*(seg.x2-seg.x1);
       const pz = seg.type==='v' ? seg.z1 + Math.random()*(seg.z2-seg.z1) : seg.z;
       const p = new THREE.Mesh(puddleGeo, puddleMat);
       p.rotation.x = -Math.PI/2;
       p.position.set(px, 0.05, pz);
       this.scene.add(p);
   }
   for(let i=0;i<15;i++){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(1.4+Math.random(),1.5+Math.random(),.08,12),new THREE.MeshPhongMaterial({color:0x0c101a,transparent:true,opacity:0.6}));
    p.position.set((Math.random()-.5)*120,0.016,(Math.random()-.5)*160);this.scene.add(p);this.spc.push(p);p.userData={isPH:true};
   }
  }
  if(cfg.hasEmergency){
   this.ms.amb=this._makeNPC('car',0xffffff);this.ms.amb.position.set(0,0,-230);
   this.ms.amb.userData={spd:1.2,isAmb:true,npcType:'ambulance',moveAxis:'v'};
   const flash=new THREE.PointLight(0xff0000,2,8);flash.position.y=1.5;this.ms.amb.add(flash);
   const flash2=new THREE.PointLight(0x0000ff,2,8);flash2.position.set(.5,1.5,0);this.ms.amb.add(flash2);
   this.npcs.push(this.ms.amb);this.scene.add(this.ms.amb);
  }
  if(cfg.hasRailway){
   (cfg.railZ||[]).forEach(rz=>{
    // Rail tracks
    for(let t=-25;t<25;t+=2){
     const rail=new THREE.Mesh(new THREE.BoxGeometry(0.1,.05,1.5),new THREE.MeshPhongMaterial({color:0x888888}));
     rail.position.set(t,.04,rz);this.scene.add(rail);
    }
    // Crossbar ties
    for(let t=-25;t<25;t+=4){
     const tie=new THREE.Mesh(new THREE.BoxGeometry(3,.08,.3),new THREE.MeshPhongMaterial({color:0x4a3728}));
     tie.position.set(t,.03,rz);this.scene.add(tie);
    }
    // Gate poles
    [-8,8].forEach(gx=>{
     const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3,8),new THREE.MeshPhongMaterial({color:0xcc0000}));
     pole.position.set(gx,1.5,rz+7);this.scene.add(pole);
     const arm=new THREE.Mesh(new THREE.BoxGeometry(6,.12,.12),new THREE.MeshPhongMaterial({color:0xcc0000}));
     arm.position.set(gx,3,rz+7);this.scene.add(arm);
    });
   });
  }
  if(cfg.hasMetro){
    cfg.roads.forEach(r => {
      const isV=r.type==='v';
      const start = isV?Math.min(r.z1,r.z2):Math.min(r.x1,r.x2);
      const end = isV?Math.max(r.z1,r.z2):Math.max(r.x1,r.x2);
      const len = Math.abs(end - start);
      const cx = isV ? r.x : (r.x1+r.x2)/2;
      const cz = isV ? (r.z1+r.z2)/2 : r.z;
      
      const track = new THREE.Mesh(new THREE.BoxGeometry(isV?6:len, 1, isV?len:6), new THREE.MeshLambertMaterial({color:0x555555}));
      track.position.set(cx, 12, cz);
      this.scene.add(track);
      
      for(let p=start+10; p<end; p+=40) {
        const px = isV ? cx : p;
        const pz = isV ? p : cz;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 12, 12), new THREE.MeshLambertMaterial({color:0x999999}));
        pillar.position.set(px, 6, pz);
        this.scene.add(pillar); this.obstacles.push(pillar);
      }
      
      const train = new THREE.Mesh(new THREE.BoxGeometry(isV?4.5:30, 3, isV?30:4.5), new THREE.MeshLambertMaterial({color:0xdddddd}));
      train.position.set(cx, 14, cz);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(isV?4.6:30.1, 0.4, isV?30.1:4.6), new THREE.MeshLambertMaterial({color:0x3498db}));
      stripe.position.set(cx, 14, cz);
      this.scene.add(train); this.scene.add(stripe);
    });
  }
  if(cfg.isBridge){
   // Bridge railings
   [-7.5,7.5].forEach(rx=>{
    for(let z=-600;z<100;z+=8){
     const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.5,6),new THREE.MeshPhongMaterial({color:0xcccccc}));
     post.position.set(rx,.75,z);this.scene.add(post);
    }
    const cable=new THREE.Mesh(new THREE.BoxGeometry(.04,700,.04),new THREE.MeshPhongMaterial({color:0xdddddd}));
    cable.position.set(rx,1.5,-250);cable.rotation.x=Math.PI/2;this.scene.add(cable);
   });
   // Bridge pylons
   [-200,0,-400].forEach(pz=>{
    const pylon=new THREE.Mesh(new THREE.CylinderGeometry(.8,.6,25,8),new THREE.MeshPhongMaterial({color:0xcccccc}));
    pylon.position.set(0,12,pz);this.scene.add(pylon);
   });
  }
  
  // Mumbai Landmarks (Spawned randomly in non-pedestrian levels to add flavor)
  if(!cfg.isPedestrian && !cfg.isBridge) {
    const buildLandmark = (type, bx, bz) => {
        const lg = new THREE.Group();
        if(type==='gateway') {
            const m1 = new THREE.Mesh(new THREE.BoxGeometry(20,18,12), new THREE.MeshPhongMaterial({color:0xd4a373}));
            m1.position.y = 9; lg.add(m1);
            const m2 = new THREE.Mesh(new THREE.CylinderGeometry(4,4,18,16), new THREE.MeshBasicMaterial({color:0x111111}));
            m2.position.set(0,9,1); m2.rotation.x = Math.PI/2; lg.add(m2); // Arch hole
            const m3 = new THREE.Mesh(new THREE.CylinderGeometry(2,2,6,8), new THREE.MeshPhongMaterial({color:0xd4a373}));
            m3.position.set(-8,21,0); lg.add(m3);
            const m4 = m3.clone(); m4.position.set(8,21,0); lg.add(m4);
        } else if(type==='bse') {
            const m1 = new THREE.Mesh(new THREE.CylinderGeometry(8,8,45,16), new THREE.MeshPhongMaterial({color:0xcccccc}));
            m1.position.y = 22.5; lg.add(m1);
            const m2 = new THREE.Mesh(new THREE.CylinderGeometry(10,10,5,16), new THREE.MeshPhongMaterial({color:0x444444}));
            m2.position.y = 47.5; lg.add(m2);
        } else if(type==='antilia') {
            for(let i=0; i<8; i++){
                const w = 12 + Math.random()*8;
                const m = new THREE.Mesh(new THREE.BoxGeometry(w, 5, w), new THREE.MeshPhongMaterial({color:(i%2===0)?0x88aa88:0xaaaaaa}));
                m.position.set(Math.random()*4-2, 2.5 + i*6, Math.random()*4-2);
                lg.add(m);
            }
        }
        lg.position.set(bx, 0, bz);
        this.scene.add(lg);
    };
    // Pick 3 random roads and offset them heavily to place landmarks
    const types = ['gateway', 'bse', 'antilia'];
    for(let i=0; i<3; i++) {
        const r = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
        if(r.type === 'v') buildLandmark(types[i], r.x + 35, (r.z1+r.z2)/2);
        else buildLandmark(types[i], (r.x1+r.x2)/2, r.z + 35);
    }
  }
  
  if(cfg.hasSchool){
   // School building
   const school=new THREE.Mesh(new THREE.BoxGeometry(18,8,12),new THREE.MeshPhongMaterial({color:0xd4ac0d}));
   school.position.set(-40,4,-80);this.scene.add(school);this.obstacles.push(school);
   // School sign
   const sign=new THREE.Mesh(new THREE.BoxGeometry(3,1.5,.1),new THREE.MeshPhongMaterial({color:0xffff00}));
   sign.position.set(0,2.5,-60);this.scene.add(sign);
  }
  if(cfg.hasOcean){
   const ocean=new THREE.Mesh(new THREE.PlaneGeometry(600,1200),mats.water);
   ocean.rotation.x=-Math.PI/2;ocean.position.set(350,.01,-150);this.scene.add(ocean);
  }
  if(cfg.hasBeach){
   const sand=new THREE.Mesh(new THREE.PlaneGeometry(200,600),new THREE.MeshPhongMaterial({color:0xc2b280}));
   sand.rotation.x=-Math.PI/2;sand.position.set(80,.005,-100);this.scene.add(sand);
   const ocean=new THREE.Mesh(new THREE.PlaneGeometry(400,800),mats.water);
   ocean.rotation.x=-Math.PI/2;ocean.position.set(250,.01,-100);this.scene.add(ocean);
  }
  if(cfg.hasSilentZone){
   // Hospital building
   const hosp=new THREE.Mesh(new THREE.BoxGeometry(20,12,15),new THREE.MeshPhongMaterial({color:0xeeeeee}));
   hosp.position.set(25,6,-20);this.scene.add(hosp);this.obstacles.push(hosp);
   const cross=new THREE.Mesh(new THREE.BoxGeometry(2,2,.1),new THREE.MeshPhongMaterial({color:0xff0000}));
   cross.position.set(25,10,7.6);this.scene.add(cross);
   // Silent zone markers
   [cfg.silentZ1||0,cfg.silentZ2||0].forEach(sz=>{
    const marker=new THREE.Mesh(new THREE.BoxGeometry(1,2,.1),new THREE.MeshPhongMaterial({color:0xff6600}));
    marker.position.set(-7,1,sz);this.scene.add(marker);
    const m2=marker.clone();m2.position.x=7;this.scene.add(m2);
   });
  }

  // Bollards and barricades
  const bCount=cfg.isPedestrian?2:6;
  for(let i=0;i<bCount;i++){
   const seg=allRoads[Math.floor(Math.random()*allRoads.length)];
   const bx=seg.type==='v'?seg.x+(Math.random()>.5?5:-5):seg.x1+Math.random()*(seg.x2-seg.x1);
   const bz=seg.type==='v'?seg.z1+Math.random()*(seg.z2-seg.z1):seg.z+(Math.random()>.5?5:-5);
   // Big red-white striped barricade
   const barG=new THREE.Group();
   const bp1=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.5,8),new THREE.MeshPhongMaterial({color:0xff3300}));
   bp1.position.set(-0.5,0.75,0);barG.add(bp1);
   const bp2=bp1.clone();bp2.position.set(0.5,0.75,0);barG.add(bp2);
   const bBar=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.25,0.15),new THREE.MeshPhongMaterial({color:0xffffff}));
   bBar.position.set(0,1.3,0);barG.add(bBar);
   const rSt=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.25,0.16),new THREE.MeshPhongMaterial({color:0xff0000}));
   rSt.position.set(0,1.3,0);barG.add(rSt);
   const bBar2=bBar.clone();bBar2.position.set(0,0.9,0);barG.add(bBar2);
   barG.position.set(bx,0,bz);this.scene.add(barG);this.obstacles.push(barG);
  }
  // Remove any obstacle within 15 units of player start
   const pStart = cfg.route && cfg.route[0] ? cfg.route[0] : {x:0, z:-200};
   this.obstacles = this.obstacles.filter(ob => {
     const dx = ob.position.x - pStart.x;
     const dz = ob.position.z - (pStart.z - 20);
     if(Math.sqrt(dx*dx+dz*dz) < 15) { this.scene.remove(ob); return false; }
     return true;
   });
   // Parked vehicles
  if(!cfg.isPedestrian){
   for(let i=0;i<6;i++){
    const seg=allRoads[Math.floor(Math.random()*allRoads.length)];
    const types=['car','auto','bike'];
    const pc=this._makeNPC(types[i%3],Math.random()*0xffffff);
    if(seg.type==='v')pc.position.set(seg.x+(Math.random()>.5?5.5:-5.5),0,seg.z1+Math.random()*(seg.z2-seg.z1));
    else pc.position.set(seg.x1+Math.random()*(seg.x2-seg.x1),0,seg.z+(Math.random()>.5?5.5:-5.5));
    pc.userData={isParked:true};this.scene.add(pc);this.obstacles.push(pc);
   }
  }
 }

 _makeTower(x,z,w=10,d=10){
  const h=14+Math.random()*28;
  if(!window.sharedBldgMats) {
    window.sharedBldgTex = _genTex('building');
    const bPal=[0x1a2742,0x1e3a5f,0x2c3e50,0x17202a,0x212f3d,0x0f2a45,0x1b3a2f];
    window.sharedBldgMats = bPal.map(col => {
      const mat = new THREE.MeshPhongMaterial({color: 0xffffff, shininess:30, map: window.sharedBldgTex});
      return mat;
    });
  }
  const bMat = window.sharedBldgMats[Math.floor(Math.random()*window.sharedBldgMats.length)];
  const geo = new THREE.BoxGeometry(w,h,d);
  
  // Scale UVs so the texture repeats correctly without needing separate materials/textures!
  const uvAttribute = geo.attributes.uv;
  for (let i = 0; i < uvAttribute.count; i++) {
    const u = uvAttribute.getX(i);
    const v = uvAttribute.getY(i);
    // Rough heuristic to repeat based on face (assumes standard box UVs)
    uvAttribute.setXY(i, u * (w/10), v * (h/10));
  }
  
  const b=new THREE.Mesh(geo,bMat);
  b.position.set(x,h/2,z);this.scene.add(b);this.world.push(b);
  
  if(Math.random()>.5){
   const tk=new THREE.Mesh(new THREE.CylinderGeometry(.8,.85,1.6,8),new THREE.MeshPhongMaterial({color:0x555566}));
   tk.position.set(x,h+.8,z);this.scene.add(tk);
  }
 }
 _create3DRain(){
  const count=1200;const geo=new THREE.BufferGeometry();const pos=[];
  for(let i=0;i<count;i++)pos.push((Math.random()-.5)*300,Math.random()*30,(Math.random()-.5)*500);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  this.rain=new THREE.Points(geo,new THREE.PointsMaterial({color:0x9cc9ff,size:0.06,transparent:true,opacity:0.55}));
  this.scene.add(this.rain);
 }

 _cp(x,z,col=0x00c851){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.7,.16,10,20),new THREE.MeshBasicMaterial({color:col}));ring.rotation.x=-Math.PI/2;
  ring.position.set(x,.8,z);this.scene.add(ring);this.cps.push(ring);return ring;
 }
 _sig(x,z){
  const g=new THREE.Group();
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,6.5,8),new THREE.MeshPhongMaterial({color:0x222222}));p.position.y=3.25;
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,5,8),new THREE.MeshPhongMaterial({color:0x222222}));
  mast.rotation.z=Math.PI/2; mast.position.set(-2.5, 6.4, 0);
  
  const bx=new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 0.4),new THREE.MeshPhongMaterial({color:0x111111}));
  bx.position.set(-4.5, 6.4, 0);
  
  const ledBorder=new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.05, 0.35),new THREE.MeshBasicMaterial({color:0x111111, transparent:true, opacity:0.6}));
  ledBorder.position.set(-4.5, 6.4, 0);
  ledBorder.name='ledBorder';
  
  const mk=(y,n)=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(.4,.4),new THREE.MeshBasicMaterial({color:0x111111}));s.position.set(-4.5,y,.21);s.name=n;return s;};
  
  const ps_pole = new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.5,8),new THREE.MeshPhongMaterial({color:0x555555})); ps_pole.position.set(0, 0.75, 2);
  const ps_box = new THREE.Mesh(new THREE.BoxGeometry(.3,.6,.2),new THREE.MeshPhongMaterial({color:0x151515})); ps_box.position.set(0, 1.5, 2);
  const mks=(y,n)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(.08),new THREE.MeshBasicMaterial({color:0x111111}));s.position.set(0,y,2.11);s.name=n;return s;};
  g.add(ps_pole, ps_box, mks(1.65,'p_red'), mks(1.35,'p_green'));
  
  g.add(p,mast,bx,ledBorder,mk(7.1,'red'),mk(6.4,'yellow'),mk(5.7,'green'));g.position.set(x,0,z);this.scene.add(g);this.sigs.push(g);
  g.userData={st:'red',t:Math.random()*6,rd:4,gd:4,yd:1.5};return g;
 }

 // 🚦 RUNTIME EXECUTABLE SIMULATION CORE 🚦
 _loop(){
  requestAnimationFrame(()=>this._loop());if(!this.playing||this.pause){if(this.renderer&&this.scene&&this.camera)this.renderer.render(this.scene,this.camera);return;}
  const dt=Math.min(this.clock.getDelta(),.033);this.timer+=dt;
  this._input(dt);this._usigs(dt);this._unpcs(dt);this._upeds(dt);this._ucps();this._uobs();this._umode(dt);this._ucam();this._uhud();this._ummap();
  this.renderer.render(this.scene,this.camera);
 }
 _input(dt){
  const up=this.keys['arrowup']||this.keys['w'],dn=this.keys['arrowdown']||this.keys['s'],lt=this.keys['arrowleft']||this.keys['a'],rt=this.keys['arrowright']||this.keys['d'];
  // Per-gear acceleration multipliers 🔄 each gear feels clearly different
  const gAccel={'1':.45,'2':.72,'3':1.05,'4':1.55,'5':2.20,'D':1.10,'R':.55,'N':0,'P':0};
  const mult=gAccel[this.gear]??0;
  const isRev=this.gear==='R';
  const cap=this.gcap;
   if(this.isPedestrian){
     const shift = this.keys['shift'] ? 2.2 : 1.0;
     let dx=0, dz=0;
     if(up) dz-=1; if(dn) dz+=1;
     if(lt) dx-=1; if(rt) dx+=1;
     if(dx!==0 || dz!==0){
       this.player.rotation.y = Math.atan2(dx, dz);
       this.speed = this.maxSpd * shift;
     } else {
       this.speed = 0;
     }
   } else {
     if(up&&this.gear!=='P'&&this.gear!=='N'){
       this.speed+=this.accel*mult*(isRev?-1:1);
     }
     if(dn){
       if(this.speed>0)this.speed-=this.accel*1.4;
       else if(isRev&&this.speed<-0.02)this.speed+=this.accel*1.4;
     }
     // Clamp to gear cap
     if(isRev){this.speed=Math.max(this.speed,-cap);}else{this.speed=Math.min(this.speed,cap);}
   }
  this.speed*=this.fric;
  // Speed-proportional steering 🔄 less turn at high speed for stability
  if(Math.abs(this.speed)>.01){
    const sf=Math.max(0.45,1-Math.abs(this.speed)*0.35);
    const effTurn=this.turn*sf;
    let tAmt = 0;
    if(lt) tAmt = 1;
    else if(rt) tAmt = -1;
    else if(window.analogSteering) tAmt = -window.analogSteering;
    if(tAmt !== 0) this.player.rotation.y += tAmt * effTurn * Math.sign(this.speed);
  }
  const targetVx = Math.sin(this.player.rotation.y) * this.speed;
  const targetVz = Math.cos(this.player.rotation.y) * this.speed;
  const grip = this.mode === 'rain' ? 0.04 : 0.6;
  this.vx += (targetVx - this.vx) * grip;
  this.vz += (targetVz - this.vz) * grip;
  this.player.position.x += this.vx; this.player.position.z += this.vz;
   if(this.isPedestrian&&Math.abs(this.speed)>0.02){ const shift=this.keys['shift']?18:10; this.player.position.y=Math.abs(Math.sin(this.timer*shift))*(this.keys['shift']?0.12:0.06); }

  let validRoadBound=false;
  this.roadSegments.forEach(r=>{
    if(r.type==='v'&&Math.abs(this.player.position.x-r.x)<7.5)validRoadBound=true;
    if(r.type==='h'&&Math.abs(this.player.position.z-r.z)<7.5)validRoadBound=true;
  });
  const owEl=document.getElementById('ow');
   if (this.isPedestrian && owEl) owEl.textContent = "⚠️ JAYWALKING - Walk on the sidewalk/zebra crossing!";
   else if (owEl) owEl.textContent = "⚠️ OFF ROAD - Return to road!";
   if (this.isPedestrian) {
     let nearZebra = false;
     (this.mapCfg.ints||[]).forEach(([ix,iz])=>{ if(Math.abs(this.player.position.x-ix)<10 && Math.abs(this.player.position.z-iz)<10) nearZebra = true; });
     if(validRoadBound && !nearZebra){ if(owEl)owEl.classList.add('on'); this.speed*=.52; this.hp-=.45; this._uh(); } else { if(owEl)owEl.classList.remove('on'); }
   } else {
     if(!validRoadBound){if(owEl)owEl.classList.add('on');this.speed*=.52;this.hp-=.45; if(this.hp<=0) this._go("Drove off-road"); else this._uh();}else{if(owEl)owEl.classList.remove('on');}
   }
 }
 _usigs(dt){
  let nearestSig=null,nearestDist=9999;
  this.sigs.forEach(sg=>{
   const d=sg.userData;d.t+=dt;const rem=d.t%9.5;
   const prev=d.st;
   d.st=rem<4?'red':rem<5.5?'yellow':'green';
   const r=sg.getObjectByName('red'),y=sg.getObjectByName('yellow'),g=sg.getObjectByName('green');
   const hRed = 0xff3b30, hYel = 0xffd54a, hGrn = 0x00c851;
   if(r)r.material.color.setHex(d.st==='red'?hRed:0x220000);
   if(y)y.material.color.setHex(d.st==='yellow'?hYel:0x222200);
   if(g)g.material.color.setHex(d.st==='green'?hGrn:0x002200);
   
   const led = sg.getObjectByName('ledBorder');
   if(led) {
      if(d.st==='red') led.material.color.setHex(hRed);
      else if(d.st==='yellow') led.material.color.setHex(hYel);
      else if(d.st==='green') led.material.color.setHex(hGrn);
   }
   
   const pr = sg.getObjectByName('p_red'), pg = sg.getObjectByName('p_green');
   if(pr) pr.material.color.setHex(d.st==='red' ? 0x220000 : 0xff3b30);
   if(pg) pg.material.color.setHex(d.st==='red' ? 0x00c851 : 0x002200);
   // Reset challan flag when signal turns green
   if(d.st==='green'&&prev!=='green')this.challanFired.delete(sg.uuid);
   // Challan ONCE per red phase per signal
   const dist=this.player.position.distanceTo(sg.position);
   if(d.st==='red'&&dist<6.5&&Math.abs(this.speed)>.18&&!this.challanFired.has(sg.uuid)){
     this.challanFired.add(sg.uuid);
     this.vio++;this.fine+=500;
     ui.issueChallan('Jumping red signal','Section 119, MV Act','₹500','Junction Sensor');
   }
   // Track nearest signal for HUD
   if(dist<nearestDist){nearestDist=dist;nearestSig=sg;}
  });
  // Update signal proximity indicator
  const si=document.getElementById('sig-ind');
  if(si){
   if(nearestSig&&nearestDist<60&&this.playing){
    si.style.display='flex';
    const st=nearestSig.userData.st;
    const col=st==='red'?'#ff3b30':st==='yellow'?'#ffd54a':'#00c851';
    const lamp=document.getElementById('sind-lamp');
    const stEl=document.getElementById('sind-state');
    const distEl=document.getElementById('sind-dist');
    if(lamp){lamp.style.background=col;lamp.style.boxShadow='0 0 14px '+col;}
    if(stEl){stEl.textContent=st.toUpperCase();stEl.style.color=col;}
    if(distEl)distEl.textContent=Math.round(nearestDist)+'m';
    const timerEl=document.getElementById('sind-timer');
    if(timerEl&&nearestSig){
      const nd=nearestSig.userData;const rem2=nd.t%9.5;
      let remaining=0;
      if(nd.st==='red')remaining=Math.max(0,4-rem2);
      else if(nd.st==='yellow')remaining=Math.max(0,9.5-rem2);
      else remaining=Math.max(0,8-rem2);
      timerEl.textContent=Math.ceil(remaining)+'s';
    }
   }else si.style.display='none';
  }
 }
   _unpcs(dt){
   this.npcs.forEach(n=>{
    if(n.userData.spd !== undefined){
     if(n.userData.laneT===undefined){n.userData.laneT=Math.random()*5+3;n.userData.txX=n.position.x;n.userData.baseSpd=n.userData.spd;}
     n.userData.laneT-=dt;
     
     let approachingObstacle = false;
     let obstacleDist = 999;
     let myLane = n.userData.txX;

     // 1. Check Red Lights
     this.sigs.forEach(sg=>{
       if(sg.userData.st==='red'){
         const dz=sg.position.z-n.position.z;
         if(dz>0 && dz<25 && Math.abs(n.position.x-sg.position.x)<4) { approachingObstacle=true; obstacleDist=Math.min(obstacleDist, dz); }
       }
     });

     // 2. Check Other Cars in Same Lane (Collision Avoidance)
     if(n.userData.moveAxis !== 'h') {
         this.npcs.forEach(other=>{
           if(other!==n && other.userData.moveAxis !== 'h') {
             const dz = other.position.z - n.position.z;
             const dx = Math.abs(other.position.x - n.position.x);
             if(dz > 0 && dz < 20 && dx < 2.5) {
                 approachingObstacle=true; 
                 obstacleDist=Math.min(obstacleDist, dz);
             }
           }
         });

         // 3. Check Player
         if (this.player && this.player.position) {
             const dz = this.player.position.z - n.position.z;
             const dx = Math.abs(this.player.position.x - n.position.x);
             if(dz > 0 && dz < 20 && dx < 2.5) {
                 approachingObstacle=true;
                 obstacleDist=Math.min(obstacleDist, dz);
             }
         }

         // 4. Aggressive Lane Switching
         if(approachingObstacle && n.userData.laneT <= 0 && obstacleDist > 3) {
             const lanes=[-4.8,-2.4,0,2.4,4.8];
             let safeLanes = lanes.filter(l => Math.abs(l - myLane) <= 3.0 && l !== myLane); 
             
             safeLanes = safeLanes.filter(l => {
                 let blocked = false;
                 this.npcs.forEach(other=>{
                     if(other!==n && Math.abs(other.position.x - l) < 2.5 && Math.abs(other.position.z - n.position.z) < 22 && other.position.z - n.position.z > -10) blocked = true;
                 });
                 if(this.player && Math.abs(this.player.position.x - l) < 2.5 && Math.abs(this.player.position.z - n.position.z) < 22 && this.player.position.z - n.position.z > -10) blocked = true;
                 return !blocked;
             });

             if(safeLanes.length > 0) {
                 n.userData.txX = safeLanes[Math.floor(Math.random() * safeLanes.length)];
                 n.userData.laneT = Math.random()*3+2; 
                 approachingObstacle = false; 
             } else {
                 n.userData.laneT = Math.random()*1+0.5; 
             }
         }
     }

     // Movement Logic
     if(!approachingObstacle){
       n.userData.spd += (n.userData.baseSpd - n.userData.spd) * 0.05;
     } else {
       let brakeTarget = obstacleDist < 7 ? 0 : n.userData.baseSpd * 0.2;
       n.userData.spd += (brakeTarget - n.userData.spd) * 0.15;
     }
     
     if(n.userData.moveAxis==='h'){
         n.position.x+=n.userData.spd*35*dt;if(n.position.x>250)n.position.x=-250;
     } else {
         n.position.x+=(n.userData.txX-n.position.x)*0.08;
         const yawT=Math.atan2(n.userData.txX-n.position.x,8)*0.5;
         n.rotation.y+=(yawT-n.rotation.y)*0.2;
         n.position.z+=n.userData.spd*35*dt;
         
         if(n.position.z>200){n.position.z=-500;n.position.x=(Math.random()>.5?2.4:-2.4);n.userData.spd=n.userData.baseSpd;n.userData.txX=n.position.x;}
     }
    }
   if(n.userData.isAmb&&this.ms&&n.position.z>this.player.position.z&&Math.abs(this.player.position.x)>3.2&&!this.ms.passed){
     this.ms.passed=true;this.score+=100;toast('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Corridor Cleared!','#00c851');
   }
   if(this.player.position.distanceTo(n.position)<2.2){this.hp-=12; if(this.hp<=0) this._go('Collided with ' + (n.type||'Vehicle')); else this._uh();this.speed*=-.22;sfx.play('error');toast('💥 Collision!','#ff3b30');}
  });
 }
 _upeds(dt){
  if(!this.peds) return;
  this.peds.forEach(p => {
    p.userData.t += dt * p.userData.spd;
    if(p.userData.isV) {
      p.position.z += p.userData.dir * dt * p.userData.spd;
      if(Math.abs(p.position.z - p.userData.startZ) > 30) { p.userData.dir *= -1; p.rotation.y += Math.PI; }
    } else {
      p.position.x += p.userData.dir * dt * p.userData.spd;
      if(Math.abs(p.position.x - p.userData.startZ) > 30) { p.userData.dir *= -1; p.rotation.y += Math.PI; }
    }
    p.userData.lLeg.rotation.x = Math.sin(p.userData.t * 8) * 0.5;
    p.userData.rLeg.rotation.x = Math.sin(p.userData.t * 8 + Math.PI) * 0.5;
    
    // Crash detection
    if(!this.isPedestrian && this.player.position.distanceTo(p.position) < 2.5) {
       this.speed = 0; this.hp = 0;
       toast('💀 HIT PEDESTRIAN! INSTANT FAILURE!', '#ff3b30');
       this._uh(); this._go("Structural Failure");
    }
  });
 }
 _uobs(){
  const px=this.player.position.x, pz=this.player.position.z;
  this.obstacles.forEach(o=>{
    const dx=px-o.position.x, dz=pz-o.position.z;
    if(dx*dx+dz*dz > 400) return;
    if(this.player.position.distanceTo(o.position)<1.6){this.hp-=10; if(this.hp<=0) this._go('Collided with Barricade'); else this._uh();this.speed*=-.2;toast('🚧 Collided with Barricade bounds!','#ff9500');}
  });
 }
 _ucps(){
  let hits=0;
  this.cps.forEach(cp=>{
   if(cp.userData.hit){hits++;return;}
   if(this.player.position.distanceTo(cp.position)<3.2){cp.userData.hit=true;cp.visible=false;this.score+=100;hits++;toast('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Node Verified!','#00c851');sfx.play('ok');}
  });
  document.getElementById('hcp').textContent=hits+'/'+this.cps.length;
  
  // Realtime GPS Arrow Target Tracking
  const nextNode=this.cps.find(c=>!c.userData.hit);const da=document.getElementById('da');
  if(nextNode&&this.playing){
    da.style.display='block';
    const dx=nextNode.position.x-this.player.position.x,dz=nextNode.position.z-this.player.position.z;
    const dist=Math.round(Math.hypot(dx,dz));
    // FIX: use atan2(dx,dz) not atan2(dx,-dz) for correct forward direction
    let rel=Math.atan2(dx,dz)-this.player.rotation.y;
    while(rel<-Math.PI)rel+=Math.PI*2;while(rel>Math.PI)rel-=Math.PI*2;
    const deg=rel*180/Math.PI;
    // Rotate the arrow emoji using CSS transform
    const arrowEl=document.getElementById('da-arrow');
    if(arrowEl)arrowEl.style.transform='rotate('+Math.round(deg)+'deg)';
    document.getElementById('dal').textContent=dist+'m · '+(Math.abs(deg)<20?'STRAIGHT':deg>0?'RIGHT':'LEFT');
  }else da.style.display='none';

  if(hits>=this.cps.length&&this.cps.length>0)this.completeLevel();
 }
 _umode(dt){
  this.score+=dt;document.getElementById('hsc').textContent=Math.round(this.score);
  if(this.mode==='rain'&&this.rain){
    const p=this.rain.geometry.attributes.position.array;for(let i=1;i<p.length;i+=3){p[i]-=10*dt;if(p[i]<0)p[i]=25;}
    this.rain.geometry.attributes.position.needsUpdate=true;
  }
  if(this.mode==='silentzone' && this.ms)this.ms.inSz=this.player.position.z>-60&&this.player.position.z<20;
 }
 _ucam(){
  const bx=-Math.sin(this.player.rotation.y)*13.5,bz=-Math.cos(this.player.rotation.y)*13.5;
  this._camTarget.set(this.player.position.x+bx, 7, this.player.position.z+bz);
  this.camera.position.lerp(this._camTarget, .12);this.camera.lookAt(this.player.position.x,1,this.player.position.z+1);
 }
 _uhud(){
  const k=Math.round(Math.abs(this.speed)*100);
  const gspdEl=document.getElementById('gspd');
  if(gspdEl){
    gspdEl.textContent=k;
    // Colour by speed zone
    const spCol=k>70?'#ff3b30':k>45?'#ff9500':k>20?'#ffd54a':'#00c851';
    gspdEl.style.fill=spCol;
  }
  const arc=document.getElementById('garc');
  if(arc){
    const sw=Math.min(k/90,1)*240;const sa=-220*Math.PI/180;const ea=sa+sw*Math.PI/180;
    arc.setAttribute('d',`M${44+32*Math.cos(sa)},${44+32*Math.sin(sa)} A32,32,0,${sw>180?1:0},1,${44+32*Math.cos(ea)},${44+32*Math.sin(ea)}`);
    const arcCol=k>70?'#ff3b30':k>45?'#ff9500':'var(--yellow)';
    arc.setAttribute('stroke',arcCol);
  }
  const tl=this.timeLimit||120;const rem=Math.max(0,Math.ceil(tl-this.timer));
   document.getElementById('htmr').textContent=Math.floor(rem/60)+':'+((rem%60)<10?'0':'')+(rem%60);
   if(rem<=0&&this.playing){this._go("Structural Failure");toast('⏰ Time Up!','#ff3b30');return;}
   if(rem<=15){document.getElementById('htmr').style.color='#ff3b30';}else{document.getElementById('htmr').style.color='';}
  const hfin=document.getElementById('hfin');if(hfin&&this.fine>0)hfin.textContent='₹'+this.fine;
 }
 _ummap(){
  const mc=document.getElementById('mmc');if(!mc||!this.playing)return;mc.classList.add('on');
  const ctx=mc.getContext('2d');const W=112, H=112, cx=W/2, cy=H/2;
  
  ctx.fillStyle='#090f16';ctx.fillRect(0,0,W,H);
  ctx.save();
  ctx.translate(cx, cy);
  const scale = 0.6;
  ctx.scale(scale, scale);
  ctx.translate(-this.player.position.x, -this.player.position.z);
  
  // Plot absolute dynamic road configuration vectors
  ctx.fillStyle='#1e222a';
  this.roadSegments.forEach(r=>{
    if(r.type==='v') ctx.fillRect(r.x-6, -600, 12, 1200);
    else ctx.fillRect(-600, r.z-6, 1200, 12);
  });

  // Track dynamic real-time colors for oncoming signals
  this.sigs.forEach(s=>{
    ctx.fillStyle=s.userData.st==='red'?'#ff3b30':s.userData.st==='green'?'#00c851':'#ffd54a';
    ctx.beginPath(); ctx.arc(s.position.x, s.position.z, 6, 0, Math.PI*2); ctx.fill();
  });

  // Draw NPC Traffic Tracking Dots
  ctx.fillStyle='#3498db';
  this.npcs.forEach(n=>{
    ctx.fillRect(n.position.x-3, n.position.z-3, 6, 6);
  });

  // Draw Player
  ctx.fillStyle='#ffd54a';
  ctx.beginPath(); ctx.arc(this.player.position.x, this.player.position.z, 6, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  
  // Minimap Borders
  ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx, cy, cx-2, 0, Math.PI*2); ctx.stroke();
 }
}

let game = null;  // Detect touch screens
  if('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('is-touch');
  }

// Developer Mode: Ctrl+Shift+D to unlock everything
document.addEventListener('keydown', (e) => {
  if(e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    ui.adminUnlock();
  }
});


window.PRELOADED_MODELS = {};
function preloadModels(callback) {
   if(typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') { callback(); return; }
   const loader = new THREE.GLTFLoader();
   const keys = Object.keys(window.MODELS || {});
   if(keys.length === 0) { callback(); return; }
   let loaded = 0;
   
   const ld = document.createElement('div');
   ld.id='model-loader';
   ld.style.position='fixed'; ld.style.top='50%'; ld.style.left='50%'; ld.style.transform='translate(-50%,-50%)';
   ld.style.background='rgba(0,0,0,0.8)'; ld.style.color='white'; ld.style.padding='20px'; ld.style.borderRadius='10px';
   ld.style.zIndex='999999'; ld.style.fontFamily='monospace'; ld.style.fontSize='1.2rem';
   ld.innerHTML = '⚙️ Initializing Engine...<br><span id="ml-pct">0%</span>';
   document.body.appendChild(ld);
   
   keys.forEach(k => {
       loader.load(window.MODELS[k], (gltf) => {
           window.PRELOADED_MODELS[k] = gltf.scene;
           loaded++;
           document.getElementById('ml-pct').textContent = Math.round((loaded/keys.length)*100) + '%';
           if(loaded === keys.length) { setTimeout(()=>{ld.remove(); callback();}, 200); }
       }, undefined, (err) => {
           console.error("Error loading", k, err);
           loaded++;
           if(loaded === keys.length) { setTimeout(()=>{ld.remove(); callback();}, 200); }
       });
   });
}
// Confetti particle system
window.confetti = {
  canvas: null, ctx: null, particles: [], running: false,
  init() {
    if(this.canvas) return;
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  },
  burst(duration=3000) {
    this.init();
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.particles = [];
    const colors = ['#ff6b35','#ffd54a','#4caf50','#2196f3','#e91e63','#9c27b0','#00bcd4','#ff9800'];
    for(let i=0;i<150;i++) {
      this.particles.push({
        x: window.innerWidth/2 + (Math.random()-0.5)*200,
        y: window.innerHeight/2,
        vx: (Math.random()-0.5)*12,
        vy: -Math.random()*18 - 4,
        w: Math.random()*10+4,
        h: Math.random()*6+3,
        color: colors[Math.floor(Math.random()*colors.length)],
        rot: Math.random()*360,
        vr: (Math.random()-0.5)*12,
        life: 1
      });
    }
    this.running = true;
    const start = Date.now();
    const animate = () => {
      if(!this.running) return;
      const elapsed = Date.now() - start;
      if(elapsed > duration) { this.running = false; this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); return; }
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      this.particles.forEach(p => {
        p.x += p.vx;
        p.vy += 0.35;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed/duration);
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot * Math.PI/180);
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        this.ctx.restore();
      });
      requestAnimationFrame(animate);
    };
    animate();
  }
};


// Quiz confirmation logic
ui._selectedAnswer = -1;
ui.selectOption = function(idx, correctIdx) {
  this._selectedAnswer = idx;
  this._correctIdx = correctIdx;
  document.querySelectorAll('.qo').forEach((o,i) => {
    o.classList.remove('selected');
    if(i === idx) o.classList.add('selected');
  });
  const cb = document.getElementById('qconfirm');
  if(cb) cb.classList.add('show');
};
ui.confirmAnswer = function() {
  if(this._selectedAnswer < 0) return;
  const cb = document.getElementById('qconfirm');
  if(cb) cb.classList.remove('show');
  // Call the original answer handler
  this._submitAnswer(this._selectedAnswer, this._correctIdx);
  this._selectedAnswer = -1;
};


// Challan card stack
ui._challanCards = [];
ui._addChallanCard = function(off, amt) {
  const stack = document.getElementById('challan-stack');
  if(!stack) return;
  stack.classList.add('on');
  const card = document.createElement('div');
  card.className = 'challan-card';
  
  // Calculate stack depth for rotation and offset (like a hand of cards)
  const depth = stack.children.length;
  // Rotate between -15deg and -5deg based on depth to fan them out
  const rot = -15 + (depth * 3); 
  
  // Get exact clone of cvc-main HTML
  const cvcHtml = document.getElementById('cvc-main').innerHTML;
  
  // Use zoom so it shrinks its physical layout size — like holding cards
  card.innerHTML = `<div style="width:400px; zoom: 0.18; transform: rotate(${rot}deg); box-shadow: -6px 6px 20px rgba(0,0,0,0.5); border-radius:16px; overflow:hidden; background:white; pointer-events:none;">${cvcHtml}</div>`;
  stack.appendChild(card);
  this._challanCards.push(card);
  // Keep max 5 visible
  if(this._challanCards.length > 5) {
    const old = this._challanCards.shift();
    if(old.parentNode) old.parentNode.removeChild(old);
  }
};

window.ui=ui;window.sfx=sfx;
preloadModels(() => {
    game = new Game();
    window.game = game;
    ui.showStart();
});
