/**
 * Solar System Visualization Engine  v3.3
 * logic.js — Enhanced 3D Engine
 */

// FIX: Loading imports directly from unpkg CDN via the import map!
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ── Python bridge ─────────────────────────────────────────────────────────────
let planetBridge = null;
try {
    if (typeof QWebChannel !== 'undefined' && typeof qt !== 'undefined') {
        new QWebChannel(qt.webChannelTransport, ch => { planetBridge = ch.objects.planetBridge; });
    }
} catch(e) { /* standalone */ }

// ── Floating label CSS ────────────────────────────────────────────────────────
{
    const s = document.createElement('style');
    s.textContent = `.floating-label.hidden{opacity:0;pointer-events:none}`;
    document.head.appendChild(s);
}

// ════════════════════════════════════════════════════════════════════════════
//  SCENE SETUP
// ════════════════════════════════════════════════════════════════════════════
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200000);
camera.position.set(0, 800, 1800);

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance', alpha:false, stencil:false, depth:true });
let currentPixelRatio = Math.min(window.devicePixelRatio, 1.8);
renderer.setPixelRatio(currentPixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled   = false;
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position:'absolute', top:'0', left:'0', pointerEvents:'none' });
document.body.appendChild(labelRenderer.domElement);

// ── OrbitControls ─────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping      = true;
controls.dampingFactor      = 0.08;
controls.maxDistance        = 55000;
controls.minDistance        = 8;
controls.zoomSpeed          = 1.2;
controls.panSpeed           = 0.8;
controls.rotateSpeed        = 0.6;
controls.screenSpacePanning = false;
controls.enablePan          = true;

// ── Sensitivity API ───────────────────────────────────────────────────────────
let labelOpacity = 1.0, glowEnabled = true, perfMode = false;

window.setSensitivity = function(type, val) {
    switch(type) {
        case 'rotate': controls.rotateSpeed   = val; break;
        case 'zoom':   controls.zoomSpeed     = val; break;
        case 'pan':    controls.panSpeed      = val; break;
        case 'damp':   controls.dampingFactor = val; break;
        case 'labels': labelOpacity = val; allLabelDivs.forEach(d => { d.style.opacity = val; }); break;
        case 'stars':  if(starPoints) starPoints.material.opacity = val; break;
        case 'quality': renderer.setPixelRatio(Math.min(val, window.devicePixelRatio)); break;
        case 'glow':   glowEnabled = val > 0; break;
        case 'perfMode': perfMode = val > 0; renderer.setPixelRatio(perfMode ? 1.0 : currentPixelRatio); break;
    }
};

// ── Lights ────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x101018, 1.3));
const sunLight = new THREE.PointLight(0xfffce8, 650000, 32000, 2);
scene.add(sunLight);

// ── Global state ──────────────────────────────────────────────────────────────
const animHooks = [], allLabelDivs = [];
let starPoints = null, simClock = 0;

// ── Hook callbacks ────────────────────────────────────────────────────────────
window._resetCamera = function() {
    flyToActive = false; flyToTarget = null; controls.enabled = true;
    camera.position.set(0, 800, 1800); controls.target.set(0,0,0); controls.update();
};
window._setOrbitsVisible = function(v) { orbitLines.forEach(l => l.visible = v); };
window._screenshotCallback = function() {
    renderer.render(scene, camera);
    const a = document.createElement('a');
    a.href = renderer.domElement.toDataURL('image/png');
    a.download = 'solar-engine-v3.3-' + Date.now() + '.png'; a.click();
};

// ════════════════════════════════════════════════════════════════════════════
//  STAR FIELD
// ════════════════════════════════════════════════════════════════════════════
(function buildStarField() {
    const COUNT = 22000, pos = new Float32Array(COUNT*3), col = new Float32Array(COUNT*3), c = new THREE.Color();
    for(let i = 0; i < COUNT; i++) {
        let x,y,z;
        if(Math.random() < 0.65) {
            const r = 38000*Math.cbrt(Math.random()), th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
            x = r*Math.sin(ph)*Math.cos(th); y = r*Math.sin(ph)*Math.sin(th); z = r*Math.cos(ph);
        } else {
            const r = 48000*Math.random(), th = Math.random()*Math.PI*2;
            x = r*Math.cos(th); y = (Math.random()-0.5)*600; z = r*Math.sin(th);
        }
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
        const t = Math.random();
        if(t<0.60) c.setHSL(0.62,0.4,Math.random()*0.3+0.6);
        else if(t<0.78) c.setHSL(0.12,0.6,Math.random()*0.3+0.6);
        else if(t<0.90) c.setHSL(0.05,0.8,Math.random()*0.2+0.5);
        else if(t<0.96) c.setHSL(0.00,0.9,Math.random()*0.2+0.4);
        else c.setHSL(0.65,0.9,Math.random()*0.2+0.6);
        col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color', new THREE.BufferAttribute(col,3));
    starPoints = new THREE.Points(geo, new THREE.PointsMaterial({ size:1.8, transparent:true, opacity:0.92, vertexColors:true, sizeAttenuation:false, depthWrite:false }));
    starPoints.rotation.set(0.4,0,0.3); scene.add(starPoints);
    animHooks.push(dt => { starPoints.rotation.y -= 0.000015*dt; });
})();

// ════════════════════════════════════════════════════════════════════════════
//  MILKY WAY
// ════════════════════════════════════════════════════════════════════════════
let milkyWayMesh, milkyWayOpacity = 0;

function buildMilkyWayTexture() {
    const S=2048, cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d'), cx=S>>1, cy=S>>1;
    ctx.fillStyle='#000004'; ctx.fillRect(0,0,S,S);
    for(let i=0;i<16000;i++){const x=Math.random()*S,y=Math.random()*S; ctx.fillStyle=`rgba(255,255,255,${(Math.random()*0.35+0.05).toFixed(2)})`; ctx.fillRect(x|0,y|0,1,1);}
    ctx.save(); ctx.translate(cx,cy); ctx.scale(1,0.38);
    const dg=ctx.createRadialGradient(0,0,0,0,0,S*0.46);
    dg.addColorStop(0,'rgba(200,175,110,0.38)'); dg.addColorStop(0.25,'rgba(140,130,90,0.22)'); dg.addColorStop(0.55,'rgba(80,85,120,0.10)'); dg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=dg; ctx.fillRect(-S/2,-S/2,S,S); ctx.restore();
    const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,S*0.13);
    cg.addColorStop(0,'rgba(255,252,225,0.99)'); cg.addColorStop(0.1,'rgba(255,230,160,0.88)'); cg.addColorStop(0.25,'rgba(230,190,100,0.55)'); cg.addColorStop(0.5,'rgba(150,120,60,0.22)'); cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg; ctx.fillRect(0,0,S,S);
    function drawArm(ba,cnt,cf){for(let i=0;i<cnt;i++){const t=Math.pow(Math.random(),0.65),sp=(Math.random()-0.5)*(0.3+t*0.9),ang=ba+t*Math.PI*2.7+sp,r=t*S*0.44+4,px=cx+r*Math.cos(ang),py=cy+r*Math.sin(ang)*0.4; if(px<2||px>S-2||py<2||py>S-2)continue; ctx.fillStyle=cf((1-t)*0.60+0.06,Math.random()); ctx.fillRect(px|0,py|0,Math.random()<0.88?1:2,1);}}
    const c1=(b,r)=>r<0.55?`rgba(255,255,240,${b.toFixed(2)})`:r<0.78?`rgba(160,190,255,${(b*0.88).toFixed(2)})`:(`rgba(255,195,140,${(b*0.72).toFixed(2)})`);
    drawArm(0,18000,c1); drawArm(Math.PI,18000,c1); drawArm(Math.PI*0.5,11000,c1); drawArm(Math.PI*1.5,11000,c1);
    const sunAng=Math.PI*0.32,sunRad=S*0.29,sunX=cx+sunRad*Math.cos(sunAng),sunY=cy+sunRad*Math.sin(sunAng)*0.4;
    const sg=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,14); sg.addColorStop(0,'rgba(255,255,210,1)'); sg.addColorStop(0.3,'rgba(255,255,140,0.85)'); sg.addColorStop(1,'rgba(255,230,50,0)');
    ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(sunX,sunY,14,0,Math.PI*2); ctx.fill();
    ctx.font='bold 17px monospace'; ctx.fillStyle='rgba(255,255,200,0.9)'; ctx.fillText('YOU ARE HERE',sunX+18,sunY-5);
    return new THREE.CanvasTexture(cvs);
}
function initMilkyWay() {
    milkyWayMesh=new THREE.Mesh(new THREE.PlaneGeometry(110000,110000),new THREE.MeshBasicMaterial({map:buildMilkyWayTexture(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    milkyWayMesh.rotation.x=Math.PI/2; milkyWayMesh.rotation.z=0.1; scene.add(milkyWayMesh);
}
initMilkyWay();
const GALAXY_START=3200,GALAXY_FULL=9000,galaxyLabel=document.getElementById('galaxy-label'); let lastMilkyOpacity=-1;
function updateMilkyWay(cd){
    const t=Math.max(0,Math.min(1,(cd-GALAXY_START)/(GALAXY_FULL-GALAXY_START)));
    milkyWayOpacity=THREE.MathUtils.lerp(milkyWayOpacity,t,0.04);
    if(Math.abs(milkyWayOpacity-lastMilkyOpacity)>0.002){milkyWayMesh.material.opacity=milkyWayOpacity*0.82;lastMilkyOpacity=milkyWayOpacity;}
    if(milkyWayOpacity>0.5)galaxyLabel.classList.add('visible'); else galaxyLabel.classList.remove('visible');
    orbitLines.forEach(l=>{l.material.opacity=0.35*(1-milkyWayOpacity*0.85);}); updateScaleIndicator(cd);
}

// ════════════════════════════════════════════════════════════════════════════
//  PROCEDURAL TEXTURE LIBRARY  (100% offline)
// ════════════════════════════════════════════════════════════════════════════

function makeSunGlow(c1,c2){
    const cvs=document.createElement('canvas'); cvs.width=cvs.height=512;
    const ctx=cvs.getContext('2d'),g=ctx.createRadialGradient(256,256,0,256,256,256);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.1,c1); g.addColorStop(0.3,c2); g.addColorStop(0.65,'rgba(120,40,0,0.08)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,512,512); return new THREE.CanvasTexture(cvs);
}

function makeRockyTexture(baseH=0.07,baseS=0.18,baseL=0.32,craters=30){
    const S=512,cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d'),c=new THREE.Color().setHSL(baseH,baseS,baseL);
    ctx.fillStyle=`rgb(${c.r*255|0},${c.g*255|0},${c.b*255|0})`; ctx.fillRect(0,0,S,S);
    for(let i=0;i<8000;i++){const x=Math.random()*S,y=Math.random()*S,v=(Math.random()-0.5)*0.06,cc=new THREE.Color().setHSL(baseH,baseS,Math.max(0.05,baseL+v)); ctx.fillStyle=`rgba(${cc.r*255|0},${cc.g*255|0},${cc.b*255|0},0.5)`; ctx.fillRect(x|0,y|0,2,2);}
    for(let i=0;i<craters;i++){const x=Math.random()*S,y=Math.random()*S,r=5+Math.random()*30,g=ctx.createRadialGradient(x,y,r*0.2,x,y,r),dk=new THREE.Color().setHSL(baseH,baseS,baseL*0.65),lk=new THREE.Color().setHSL(baseH,baseS*0.8,Math.min(1,baseL*1.35));
        g.addColorStop(0,`rgba(${dk.r*255|0},${dk.g*255|0},${dk.b*255|0},0.5)`); g.addColorStop(0.8,`rgba(${dk.r*255|0},${dk.g*255|0},${dk.b*255|0},0.18)`); g.addColorStop(0.9,`rgba(${lk.r*255|0},${lk.g*255|0},${lk.b*255|0},0.35)`); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();}
    return new THREE.CanvasTexture(cvs);
}

function makeAccretionDiskTexture(){
    const W=1024,H=4,cvs=document.createElement('canvas'); cvs.width=W; cvs.height=H;
    const ctx=cvs.getContext('2d'),g=ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.04,'rgba(255,255,220,1)'); g.addColorStop(0.12,'rgba(255,210,80,0.95)'); g.addColorStop(0.30,'rgba(255,130,20,0.85)'); g.addColorStop(0.52,'rgba(210,50,5,0.65)'); g.addColorStop(0.72,'rgba(130,18,0,0.38)'); g.addColorStop(0.88,'rgba(50,5,0,0.14)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    for(let i=0;i<80;i++){const sx=(0.04+Math.random()*0.84)*W,a=0.12+Math.random()*0.4,r=200+Math.random()*55|0,gg=Math.random()*90|0; ctx.fillStyle=`rgba(${r},${gg},0,${a.toFixed(2)})`; ctx.fillRect(sx|0,0,2+Math.random()*5|0,H);}
    return new THREE.CanvasTexture(cvs);
}

function makeSaturnRingTexture(){
    const W=2048,H=2,cvs=document.createElement('canvas'); cvs.width=W; cvs.height=H;
    const ctx=cvs.getContext('2d'); ctx.clearRect(0,0,W,H);
    [[0.00,0.06,180,165,120,0.30],[0.06,0.09,100,90,65,0.08],[0.09,0.46,215,198,152,0.92],[0.46,0.49,22,20,14,0.10],[0.49,0.74,198,182,138,0.78],[0.74,0.76,215,200,155,0.55],[0.76,0.82,190,175,130,0.68],[0.82,0.87,148,135,100,0.28],[0.87,0.94,110,100,78,0.10],[0.94,1.00,70,60,46,0.04]].forEach(([s,e,r,g,b,a])=>{ctx.fillStyle=`rgba(${r},${g},${b},${a})`; ctx.fillRect(s*W,0,(e-s)*W,H);});
    const img=ctx.getImageData(0,0,W,H); for(let x=0;x<W;x++){const n=(Math.random()-0.5)*20,i=x*4; img.data[i]=Math.max(0,Math.min(255,img.data[i]+n)); img.data[i+1]=Math.max(0,Math.min(255,img.data[i+1]+n*0.9)); img.data[i+2]=Math.max(0,Math.min(255,img.data[i+2]+n*0.7));} ctx.putImageData(img,0,0);
    return new THREE.CanvasTexture(cvs);
}

function makeFlareTexture(){
    const S=256,cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d'),g=ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
    g.addColorStop(0,'rgba(255,255,200,0.9)'); g.addColorStop(0.12,'rgba(255,200,60,0.5)'); g.addColorStop(0.35,'rgba(255,100,0,0.15)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,S,S); return new THREE.CanvasTexture(cvs);
}

function makeIoTexture(){
    const S=512,cvs=document.createElement('canvas'); cvs.width=cvs.height=S; const ctx=cvs.getContext('2d');
    ctx.fillStyle='#c8880a'; ctx.fillRect(0,0,S,S);
    const pal=['#ffcc00','#ff9900','#ee4400','#ffe066','#993300','#ffbb33'];
    for(let i=0;i<160;i++){const x=Math.random()*S,y=Math.random()*S,r=4+Math.random()*45,g=ctx.createRadialGradient(x,y,0,x,y,r),col=pal[Math.floor(Math.random()*pal.length)]; g.addColorStop(0,col+'cc'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();}
    return new THREE.CanvasTexture(cvs);
}
function makeEuropaTexture(){
    const S=512,cvs=document.createElement('canvas'); cvs.width=cvs.height=S; const ctx=cvs.getContext('2d');
    ctx.fillStyle='#d8eef8'; ctx.fillRect(0,0,S,S);
    for(let i=0;i<40;i++){const x1=Math.random()*S,y1=Math.random()*S,x2=x1+(Math.random()-0.5)*220,y2=y1+(Math.random()-0.5)*220,br=Math.random()*80+80|0,gr=Math.random()*30+20|0; ctx.strokeStyle=`rgba(${br},${gr},20,${0.3+Math.random()*0.5})`; ctx.lineWidth=1+Math.random()*3; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();}
    return new THREE.CanvasTexture(cvs);
}
function makeTitanTexture(){
    const S=512,cvs=document.createElement('canvas'); cvs.width=cvs.height=S; const ctx=cvs.getContext('2d');
    const g=ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2); g.addColorStop(0,'#e8a040'); g.addColorStop(0.5,'#c06820'); g.addColorStop(1,'#803010'); ctx.fillStyle=g; ctx.fillRect(0,0,S,S);
    for(let y=0;y<S;y+=10){ctx.fillStyle=`rgba(255,160,60,${(Math.sin(y*0.09)*0.03+0.015).toFixed(3)})`; ctx.fillRect(0,y,S,7);}
    return new THREE.CanvasTexture(cvs);
}
function makeEnceladusTexture(){
    const S=256,cvs=document.createElement('canvas'); cvs.width=cvs.height=S; const ctx=cvs.getContext('2d');
    ctx.fillStyle='#f0f8ff'; ctx.fillRect(0,0,S,S);
    for(let i=0;i<5;i++){const y=S*0.62+i*10; ctx.strokeStyle=`rgba(90,130,200,${0.35+i*0.05})`; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,y); ctx.bezierCurveTo(S*0.3,y-6,S*0.7,y+6,S,y); ctx.stroke();}
    return new THREE.CanvasTexture(cvs);
}
function makePulsarTexture(){
    const S=256,cvs=document.createElement('canvas'); cvs.width=cvs.height=S; const ctx=cvs.getContext('2d');
    const g=ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2); g.addColorStop(0,'rgba(220,245,255,1)'); g.addColorStop(0.3,'rgba(100,180,255,0.9)'); g.addColorStop(0.7,'rgba(40,80,220,0.6)'); g.addColorStop(1,'rgba(10,20,80,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,S,S); return new THREE.CanvasTexture(cvs);
}

function makeNebulaTexture(r1=0xff,g1=0x44,b1=0x11, r2=0x22,g2=0x88,b2=0xff){
    const S=512,cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d');
    ctx.fillStyle='#020408'; ctx.fillRect(0,0,S,S);
    for(let i=0;i<6;i++){
        const cx=S*(0.25+Math.random()*0.5),cy=S*(0.25+Math.random()*0.5);
        const rx=80+Math.random()*160,ry=60+Math.random()*120;
        const a=Math.random()*Math.PI;
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(rx,ry));
        const frac=i/6;
        const ri=Math.round(r1*(1-frac)+r2*frac),gi=Math.round(g1*(1-frac)+g2*frac),bi=Math.round(b1*(1-frac)+b2*frac);
        g.addColorStop(0,`rgba(${ri},${gi},${bi},0.45)`);
        g.addColorStop(0.4,`rgba(${ri},${gi},${bi},0.18)`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(a); ctx.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry));
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,Math.max(rx,ry),0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    for(let i=0;i<200;i++){
        const x=Math.random()*S,y=Math.random()*S,br=Math.random()*0.8+0.2;
        ctx.fillStyle=`rgba(255,255,255,${br.toFixed(2)})`; ctx.fillRect(x|0,y|0,1,1);
    }
    for(let i=0;i<5;i++){
        const x=Math.random()*S*0.6+S*0.2,y=Math.random()*S*0.6+S*0.2;
        const g=ctx.createRadialGradient(x,y,0,x,y,8);
        g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,8,0,Math.PI*2); ctx.fill();
    }
    return new THREE.CanvasTexture(cvs);
}

function makeMoonTexture(baseH=0.09,baseS=0.08,baseL=0.42){
    return makeRockyTexture(baseH,baseS,baseL,55);
}

function makeGasGiantTexture(baseColor, bandVariance=0.12, bands=22){
    const W=1024,H=512,cvs=document.createElement('canvas'); cvs.width=W; cvs.height=H;
    const ctx=cvs.getContext('2d'),c=new THREE.Color(baseColor||0xddaa77);
    ctx.fillStyle=`hsl(${(c.getHSL({}).h*360).toFixed(0)},${(c.s*100).toFixed(0)}%,${(c.l*100).toFixed(0)}%)`;
    ctx.fillRect(0,0,W,H);
    for(let i=0;i<bands;i++){
        const y=Math.floor((i/bands)*H), bh=Math.floor(H/bands)+(Math.random()<0.3?Math.floor(H/bands*0.5):0);
        const dl=(Math.random()-0.5)*bandVariance*2;
        const hsl={h:0,s:0,l:0}; c.getHSL(hsl);
        const bL=Math.max(0.05,Math.min(0.95,hsl.l+dl));
        const bS=Math.max(0.1,Math.min(1,hsl.s+(Math.random()-0.5)*0.15));
        ctx.fillStyle=`hsla(${(hsl.h*360).toFixed(0)},${(bS*100).toFixed(0)}%,${(bL*100).toFixed(0)}%,0.85)`;
        ctx.fillRect(0,y,W,bh+4);
    }
    for(let i=0;i<3;i++){
        const ox=Math.random()*W, oy=Math.random()*H, ow=50+Math.random()*120, oh=20+Math.random()*45;
        const hsl={h:0,s:0,l:0}; c.getHSL(hsl);
        const sg=ctx.createRadialGradient(ox,oy,0,ox,oy,ow*0.5);
        sg.addColorStop(0,`hsla(${(hsl.h*360+15).toFixed(0)},70%,${(hsl.l*0.65*100).toFixed(0)}%,0.6)`);
        sg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.save(); ctx.scale(1,oh/ow); ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(ox,oy*ow/oh,ow,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    const img=ctx.getImageData(0,0,W,H);
    for(let x=0;x<W;x+=2){const n=(Math.random()-0.5)*8; for(let y=0;y<H;y++){const idx=(y*W+x)*4; img.data[idx]=Math.max(0,Math.min(255,img.data[idx]+n)); img.data[idx+1]=Math.max(0,Math.min(255,img.data[idx+1]+n*0.9)); img.data[idx+2]=Math.max(0,Math.min(255,img.data[idx+2]+n*0.7));}}
    ctx.putImageData(img,0,0);
    return new THREE.CanvasTexture(cvs);
}

// ════════════════════════════════════════════════════════════════════════════
//  ASTEROID BELTS
// ════════════════════════════════════════════════════════════════════════════
function createBelt(inner,outer,count,bH,bL){
    const tex=makeRockyTexture(bH,0.2,bL,8),geo=new THREE.IcosahedronGeometry(1.8,0),mat=new THREE.MeshStandardMaterial({map:tex,roughness:0.95,metalness:0.04}),im=new THREE.InstancedMesh(geo,mat,count),dm=new THREE.Object3D();
    for(let i=0;i<count;i++){const ang=Math.random()*Math.PI*2,rad=inner+Math.random()*(outer-inner); dm.position.set(Math.cos(ang)*rad,(Math.random()-0.5)*30+Math.sin(ang*5)*12,Math.sin(ang)*rad); dm.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0); const s=Math.random()*1.8+0.4; dm.scale.set(s,s,s); dm.updateMatrix(); im.setMatrixAt(i,dm.matrix);}
    im.instanceMatrix.needsUpdate=true; scene.add(im); return im;
}
const asteroidBelt=createBelt(380,480,4000,0.07,0.30), kuiperBelt=createBelt(1400,1800,5000,0.55,0.35);

// ════════════════════════════════════════════════════════════════════════════
//  PLANET FACTORY
// ════════════════════════════════════════════════════════════════════════════
const textureLoader=new THREE.TextureLoader(),texCache={};
const allMoons=[],allBlackHoleDisk=[],allBlackHoleJets=[],allPulsarBeams=[],allFlares=[];
const planets=[],clickableHitboxes=[],allGalaxies=[],orbitLines=[];

// No local loading — strictly procedural if missing
function loadTex(url){return null;}

function drawOrbit(radius,color,parentObj){
    const pts=[]; for(let i=0;i<=200;i++){const t=(i/200)*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(t)*radius,0,Math.sin(t)*radius));}
    const geo=new THREE.BufferGeometry().setFromPoints(pts),mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:0.35}),line=new THREE.Line(geo,mat);
    orbitLines.push(line); if(parentObj){line.rotation.x=Math.PI/2; parentObj.add(line);} else scene.add(line); return line;
}
function addAtmosphereGlow(mesh,size,glowColor){
    mesh.add(new THREE.Mesh(new THREE.SphereGeometry(size*1.18,24,24),new THREE.MeshBasicMaterial({color:glowColor,transparent:true,opacity:0.13,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false})));
}

function createPlanet(data){
    let mesh;
    if(data.type==='star'){
        const segs=data.size>100?52:40, tex=makeRockyTexture(0.09,0.4,0.65,0);
        mesh=new THREE.Mesh(new THREE.SphereGeometry(data.size,segs,segs),new THREE.MeshBasicMaterial({map:tex,color:data.color}));
        const c1=data.color===0xff3300?'rgba(255,120,40,0.82)':'rgba(255,235,150,0.82)', c2=data.color===0xff3300?'rgba(200,40,0,0.35)':'rgba(255,140,0,0.38)';
        const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:makeSunGlow(c1,c2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
        glow.scale.set(data.size*9.5,data.size*9.5,1); mesh.add(glow);
        if(data.size>=40){const flareTex=makeFlareTexture(); for(let fi=0;fi<8;fi++){const fMat=new THREE.SpriteMaterial({map:flareTex,transparent:true,opacity:0.35+Math.random()*0.3,blending:THREE.AdditiveBlending,depthWrite:false}),fs=new THREE.Sprite(fMat),ang=(fi/8)*Math.PI*2,rd=data.size*(1.1+Math.random()*0.6); fs.position.set(Math.cos(ang)*rd,(Math.random()-0.5)*data.size*0.9,Math.sin(ang)*rd); fs.scale.setScalar(data.size*(2.5+Math.random())); fs.userData={baseOp:fMat.opacity,phase:Math.random()*Math.PI*2,isFlare:true}; mesh.add(fs); allFlares.push(fs);}}

    } else if(data.type==='blackhole'){
        mesh=new THREE.Mesh(new THREE.SphereGeometry(data.size,48,48),new THREE.MeshBasicMaterial({color:0x000000}));
        const diskTex=makeAccretionDiskTexture();
        [{inner:1.5,outer:3.2,tilt:Math.PI/2.3,op:0.92},{inner:3.2,outer:5.0,tilt:Math.PI/2.35,op:0.55}].forEach(({inner,outer,tilt,op})=>{
            const disk=new THREE.Mesh(new THREE.RingGeometry(data.size*inner,data.size*outer,128),new THREE.MeshBasicMaterial({map:diskTex,side:THREE.DoubleSide,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false})); disk.rotation.x=tilt; allBlackHoleDisk.push(disk); mesh.add(disk);
        });
        mesh.add(new THREE.Mesh(new THREE.TorusGeometry(data.size*1.5,data.size*0.05,10,80),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.20,blending:THREE.AdditiveBlending})));
        mesh.add(new THREE.Mesh(new THREE.SphereGeometry(data.size*1.6,24,24),new THREE.MeshBasicMaterial({color:0xaa2200,transparent:true,opacity:0.10,blending:THREE.AdditiveBlending,side:THREE.BackSide})));
        [-1,1].forEach(dir=>{const jet=new THREE.Mesh(new THREE.ConeGeometry(data.size*0.18,data.size*24,8),new THREE.MeshBasicMaterial({color:0x4499ff,transparent:true,opacity:0.18,blending:THREE.AdditiveBlending})); jet.position.y=dir*data.size*12; if(dir<0)jet.rotation.x=Math.PI; jet.userData.isJet=true; allBlackHoleJets.push(jet); mesh.add(jet);});

    } else if(data.type==='pulsar'){
        mesh=new THREE.Mesh(new THREE.SphereGeometry(data.size,28,28),new THREE.MeshBasicMaterial({map:makePulsarTexture(),color:data.color}));
        [-1,1].forEach(dir=>{const beam=new THREE.Mesh(new THREE.ConeGeometry(data.size*1.8,data.size*38,10),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:0.75,blending:THREE.AdditiveBlending})); beam.position.y=dir*data.size*19; if(dir<0)beam.rotation.x=Math.PI; beam.userData.isPulsarBeam=true; allPulsarBeams.push(beam); mesh.add(beam);});

    } else if(data.type==='probe'){
        mesh=new THREE.Mesh(new THREE.BoxGeometry(data.size*2.2,data.size*1.4,data.size*2.2),new THREE.MeshStandardMaterial({color:0xddaa00,roughness:0.4,metalness:0.9}));
        const pMat=new THREE.MeshBasicMaterial({color:0x1133aa,side:THREE.DoubleSide});
        [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(data.size*9,data.size*2.5),pMat); p.position.x=s*data.size*6; mesh.add(p);}); mesh.userData.isTumbler=true;

    } else if(data.type==='interstellar'){
        mesh=new THREE.Mesh(new THREE.CylinderGeometry(data.size*0.3,data.size*0.3,data.size*5,12),new THREE.MeshStandardMaterial({map:makeRockyTexture(0.03,0.35,0.20,5),roughness:0.85,metalness:0.05})); mesh.userData.isTumbler=true;

    } else if(data.type==='comet'){
        mesh=new THREE.Mesh(new THREE.SphereGeometry(data.size,20,20),new THREE.MeshStandardMaterial({map:makeRockyTexture(0.06,0.08,0.18,15),roughness:0.95,metalness:0}));
        const tail=new THREE.Mesh(new THREE.ConeGeometry(data.size*2.2,data.size*20,10),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:0.30,blending:THREE.AdditiveBlending})); tail.rotation.x=-Math.PI/2; tail.position.z=-data.size*10; mesh.add(tail);
        const ionTail=new THREE.Mesh(new THREE.ConeGeometry(data.size*1.0,data.size*35,8),new THREE.MeshBasicMaterial({color:0x88aaff,transparent:true,opacity:0.14,blending:THREE.AdditiveBlending})); ionTail.rotation.x=-Math.PI/2; ionTail.position.z=-data.size*18; mesh.add(ionTail);

    } else if(data.type==='galaxy'){
        const S=256,gcvs=document.createElement('canvas'); gcvs.width=gcvs.height=S;
        const gctx=gcvs.getContext('2d'),gcx=S/2,gcy=S/2,gc=new THREE.Color(data.color||0xffddaa);
        const[gr,gg2,gb]=[gc.r*255|0,gc.g*255|0,gc.b*255|0];
        const grad=gctx.createRadialGradient(gcx,gcy,0,gcx,gcy,S*0.5);
        grad.addColorStop(0,`rgba(${gr},${gg2},${gb},0.95)`);
        grad.addColorStop(0.35,`rgba(${gr},${gg2},${gb},0.45)`);
        grad.addColorStop(0.7,`rgba(${Math.max(0,gr-30)},${Math.max(0,gg2-20)},${Math.min(255,gb+40)},0.1)`);
        grad.addColorStop(1,'rgba(0,0,0,0)');
        gctx.fillStyle=grad; gctx.fillRect(0,0,S,S);
        gctx.save(); gctx.translate(gcx,gcy); gctx.scale(1,0.40);
        for(let gi=0;gi<4000;gi++){const t=Math.pow(Math.random(),0.65),ga=Math.random()*Math.PI*6+t*Math.PI*3.2,gr2=t*S*0.46,gpx=gr2*Math.cos(ga),gpy=gr2*Math.sin(ga); if(Math.abs(gpx)>S/2||Math.abs(gpy*2.5)>S/2)continue; gctx.fillStyle=`rgba(255,250,220,${(Math.random()*0.38+0.05).toFixed(2)})`; gctx.fillRect(gpx+gcx|0,gpy+gcy|0,1,1);}
        gctx.restore();
        mesh=new THREE.Mesh(new THREE.PlaneGeometry(data.size*3.5,data.size*1.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(gcvs),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
        mesh.rotation.x=0.22; mesh.rotation.y=Math.random()*Math.PI;

    } else {
        const segs=data.size>20?52:(data.size>8?44:30),geo=new THREE.SphereGeometry(data.size,segs,segs);
        let texMap=null;
        if(data.subtype==='io') texMap=makeIoTexture();
        else if(data.subtype==='europa') texMap=makeEuropaTexture();
        else if(data.subtype==='titan') texMap=makeTitanTexture();
        else if(data.subtype==='enceladus') texMap=makeEnceladusTexture();
        else if(data.typeBadge&&(data.typeBadge.includes('GAS GIANT')||data.typeBadge.includes('ICE GIANT')))
            texMap=makeGasGiantTexture(data.color||0xddaa77, data.typeBadge.includes('ICE')?0.08:0.14);
        else { const hsl={h:0.06,s:0.2,l:0.35}; if(data.color){new THREE.Color(data.color).getHSL(hsl);} texMap=makeRockyTexture(hsl.h,hsl.s,Math.max(0.18,hsl.l),25); }
        
        mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:texMap,bumpMap:texMap,bumpScale:1.2,roughness:0.88,metalness:0.04}));
        if(data.atmosphereColor) addAtmosphereGlow(mesh,data.size,data.atmosphereColor);
    }

    if(data.name==='Saturn'){
        const rt=makeSaturnRingTexture();
        const ring=new THREE.Mesh(new THREE.RingGeometry(data.size*1.25,data.size*2.55,128),new THREE.MeshBasicMaterial({map:rt,side:THREE.DoubleSide,transparent:true,opacity:0.94,depthWrite:false})); ring.rotation.x=Math.PI/2; ring.rotation.y=0.06; mesh.add(ring);
        const inR=new THREE.Mesh(new THREE.RingGeometry(data.size*1.00,data.size*1.25,128),new THREE.MeshBasicMaterial({map:makeSaturnRingTexture(),side:THREE.DoubleSide,transparent:true,opacity:0.38,depthWrite:false})); inR.rotation.x=Math.PI/2; inR.rotation.y=0.06; mesh.add(inR);
    }
    if(data.name==='Uranus'){mesh.add(new THREE.Mesh(new THREE.RingGeometry(data.size*1.4,data.size*1.9,64),new THREE.MeshBasicMaterial({color:0x88aacc,side:THREE.DoubleSide,transparent:true,opacity:0.28})));}

    const hScale=data.size<5?10:(data.size<15?4:1.6);
    const hitBox=new THREE.Mesh(new THREE.SphereGeometry(data.size*hScale,8,8),new THREE.MeshBasicMaterial({visible:false})); hitBox.userData=data; mesh.add(hitBox); clickableHitboxes.push(hitBox);

    if(data.name!=='Sun'&&data.type!=='darkmatter'){
        const div=document.createElement('div'); div.className='floating-label'; div.textContent=data.name.toUpperCase();
        div.style.borderColor='#'+((data.color||0xffffff)>>>0).toString(16).padStart(6,'0');
        div.addEventListener('click', e => {
            e.stopPropagation();
            activeSelect = data;
            if(window.openHUD) window.openHUD(data);
            if(typeof flyTo === 'function') flyTo(data);
        });
        const lbl=new CSS2DObject(div); lbl.position.set(0,data.size*hScale+4,0); mesh.add(lbl); data._labelDiv=div; allLabelDivs.push(div);
    }
    const moonCount=Math.min(parseInt(data.moons)||0,4), moonTex=makeRockyTexture(0.06,0.1,0.35,25);
    for(let i=0;i<moonCount;i++){const pivot=new THREE.Object3D(),mPhase=Math.random()*Math.PI*2,mSize=data.size*(Math.random()*0.14+0.09),mDist=data.size*(Math.random()*1.4+1.5)+i*8,mPer=Math.random()*22+4,mm=new THREE.Mesh(new THREE.SphereGeometry(mSize,16,16),new THREE.MeshStandardMaterial({map:moonTex,roughness:1.0})); mm.position.x=mDist; pivot.rotation.set(Math.random()*0.5,mPhase,Math.random()*0.5); pivot.add(mm); mesh.add(pivot); allMoons.push({pivot,period:mPer,phase:mPhase}); drawOrbit(mDist,0xffffff,pivot);}
    return mesh;
}

// ════════════════════════════════════════════════════════════════════════════
//  PLANET DATABANK  v3.3
// ════════════════════════════════════════════════════════════════════════════
const planetData = {
"Sun":{type:'star',typeBadge:'G-TYPE MAIN SEQUENCE STAR',size:70,dist:0,period:0,color:0xffaa00,moons:'0',
overview:'Our parent star — a nearly perfect sphere of superheated plasma sustained by nuclear fusion. 1.4 million km across, it contains 99.86% of the solar system\'s total mass.',
stats:{'Diameter':'1,392,700 km (109× Earth)','Mass':'1.989 × 10³⁰ kg','Surface Temp':'5,505 °C','Core Temp':'15,000,000 °C','Luminosity':'3.828 × 10²⁶ W','Rotation':'25 days (equator)','Age':'~4.6 Billion Years','Spectral Class':'G2V'},
atmosphere:{'Photosphere':'H: 73.46%, He: 24.85%','Chromosphere':'~2,000 km thick; 20,000 °C','Corona':'Up to 3,000,000 °C'},
exploration:{'Parker Solar Probe':'2018–Present','Solar Orbiter':'ESA/NASA 2020–Present','SOHO':'Since 1995'},
discoveries:{'Solar Wind':'Eugene Parker predicted 1958, confirmed 1962 by Luna 1','Coronal Heating':'Corona hotter than photosphere — magnetic wave heating (still studied)','Solar Switchbacks':'Rapid field reversals discovered by Parker Probe (2019)','Heliosphere Edge':'Voyager 1 confirmed crossing 2012'},
funFact:'The Sun will exhaust its hydrogen fuel in ~5 billion years, expanding into a red giant that may engulf Earth.'},

"Mercury":{type:'planet',typeBadge:'TERRESTRIAL PLANET',size:6,dist:140,period:88,color:0x888888,moons:'0',atmosphereColor:null,
overview:'The smallest planet and innermost in our solar system. A heavily cratered world with extreme temperature swings of 600°C and a surprisingly large iron core making up 85% of its radius.',
stats:{'Diameter':'4,879 km','Mass':'3.285 × 10²³ kg','Surface Gravity':'3.7 m/s²','Density':'5.43 g/cm³','Distance from Sun':'57.9 million km (0.39 AU)','Day Length':'59 Earth days','Year Length':'88 Earth days'},
atmosphere:{'Composition':'Negligible exosphere: O₂, Na, H₂','Surface Pressure':'~10⁻¹⁴ bar','Temp Range':'-180 °C to 430 °C'},
exploration:{'Mariner 10':'1974–75 (three flybys)','MESSENGER':'2011–2015 (first orbiter)','BepiColombo':'ESA/JAXA en route, 2025'},
discoveries:{'Polar Ice':'Water ice in permanently shadowed craters (MESSENGER 2012)','Hollows':'Unique volatile-loss surface depressions','Core Size':'Enormous iron core 85% of radius — poorly understood','Shrinkage':'Planet contracted ~7 km as core cooled'},
funFact:'Mercury has no atmosphere to retain heat, so it experiences the largest temperature swings of any planet — over 600°C between the sunlit day side and the frozen night side.'},

"Venus":{type:'planet',typeBadge:'TERRESTRIAL PLANET',size:10,dist:190,period:225,color:0xffaa55,moons:'0',atmosphereColor:0xff8833,
overview:'The second planet and hottest in the solar system despite not being closest to the Sun. A hellish world with crushing 92-bar pressure, sulfuric acid clouds, and surface temperatures hot enough to melt lead.',
stats:{'Diameter':'12,104 km','Mass':'4.867 × 10²⁴ kg','Surface Gravity':'8.87 m/s²','Distance from Sun':'108.2 million km (0.72 AU)','Day Length':'243 Earth days (retrograde)','Year Length':'225 Earth days'},
atmosphere:{'Composition':'CO₂: 96.5%, N₂: 3.5%, SO₂ traces','Surface Pressure':'92 bar','Temperature':'465 °C constant'},
exploration:{'Venera Program':'USSR 1970–85 (images from surface)','Magellan':'NASA radar mapping 1990–94','DAVINCI+':'NASA planned 2031'},
discoveries:{'Retrograde Rotation':'Day longer than year; Sun rises in the west','Active Volcanism':'Fresh lava flows confirmed by ESA/Magellan data (2023)','Phosphine Signal':'Possible life signature in clouds (2020, contested)','Lightning':'Radio waves suggest cloud lightning'},
funFact:'A day on Venus (243 Earth days) is longer than its year (225 Earth days). The Sun rises in the west and sets in the east on Venus — it rotates backwards.'},

"Earth":{type:'planet',typeBadge:'TERRESTRIAL PLANET',size:12,dist:260,period:365.25,color:0x4b90ff,moons:'0',atmosphereColor:0x4488ff,
overview:'The third planet and only known world to harbour life. A geologically active world with plate tectonics, a global magnetic field, liquid oceans, breathable atmosphere, and 8.7 million known species.',
stats:{'Diameter':'12,742 km','Mass':'5.972 × 10²⁴ kg','Surface Gravity':'9.807 m/s²','Density':'5.51 g/cm³ (densest planet)','Distance from Sun':'149.6 million km (1 AU)','Day Length':'24 hours','Year Length':'365.25 days','Axial Tilt':'23.5°'},
atmosphere:{'Composition':'N₂: 78.09%, O₂: 20.95%, Ar: 0.93%, CO₂: 0.04%','Surface Pressure':'1.013 bar','Temp Range':'-88 °C to 58 °C'},
exploration:{'Sputnik 1':'First satellite (USSR 1957)','Apollo 11':'First humans on Moon (1969)','ISS':'Continuously inhabited since Nov 2000'},
discoveries:{'Van Allen Belts':'James Van Allen, 1958','Plate Tectonics':'Confirmed from seafloor spreading, 1960s','Ozone Layer':'Depletion crisis identified 1970s','Magnetic Reversal':'Poles have flipped hundreds of times in Earth\'s history'},
funFact:'Earth is the only planet not named after a Roman or Greek deity. Its magnetic field is generated by liquid iron in the outer core rotating at different speeds from the solid inner core.'},

"ISS":{type:'probe',typeBadge:'SPACE STATION',size:0.4,dist:261.5,period:0.06,color:0xffffff,moons:'0',parent:'Earth',
overview:'The International Space Station — the largest human structure ever launched into space. Continuously inhabited since November 2, 2000.',
stats:{'Altitude':'408 km','Orbital Speed':'7.66 km/s','Orbital Period':'92.68 min','Length':'109 m','Mass':'~420,000 kg','Habitable Volume':'388 m³','Crew':'6–7'},
atmosphere:{'Internal':'1 atm N₂/O₂','Water Recovery':'90%+ recycled'},
exploration:{'Launch':'Nov 1998','Crewed Since':'Nov 2, 2000','Experiments':'3,000+ scientific investigations'},
discoveries:{'Fluid Physics':'Unique behaviour in microgravity','Bone/Muscle Loss':'Quantified for future Mars missions','Plant Growth':'First crops grown and eaten in space (2015)','Combustion':'Spherical flames reveal new combustion physics'},
funFact:'The ISS completes 16 orbits per day at 28,000 km/h. Astronauts see 16 sunrises and 16 sunsets every 24 hours.'},

"Hubble":{type:'probe',typeBadge:'SPACE TELESCOPE',size:0.3,dist:263,period:0.07,color:0xcccccc,moons:'0',parent:'Earth',
overview:'The Hubble Space Telescope — one of the most productive scientific instruments ever built, transforming astronomy across 35+ years of operation.',
stats:{'Altitude':'547 km','Mirror':'2.4 m','Wavelengths':'UV, Visible, Near-IR','Launch':'Apr 24, 1990','Servicing Missions':'5'},
atmosphere:{'Environment':'Hard vacuum; -100 °C to +100 °C per orbit'},
exploration:{'Deep Field':'Thousands of galaxies in tiny patch of sky (1995)','Dark Energy':'SN Ia observations confirmed accelerating expansion'},
discoveries:{'Dark Energy':'Contributed to Nobel Prize 2011','Black Hole Prevalence':'Nearly all large galaxies host supermassive black holes','Hubble Constant':'Helped refine universe expansion rate','Proplyds':'Planet-forming disks imaged in Orion (1993)'},
funFact:'Hubble has made over 1.5 million observations and generated more than 180 terabytes of data. It has observed objects more than 13 billion light-years away.'},

"JWST":{type:'probe',typeBadge:'INFRARED TELESCOPE',size:0.6,dist:275,period:365.25,color:0xffcc00,moons:'0',
overview:'The James Webb Space Telescope — the most powerful observatory ever launched. Orbiting the Sun-Earth L2 point 1.5 million km away, it peers through dust to see the earliest galaxies.',
stats:{'Location':'Sun-Earth L2','Mirror':'6.5 m (18 gold-plated segments)','Wavelengths':'Near to mid-infrared','Launch':'Dec 25, 2021','First Science':'Jul 12, 2022'},
atmosphere:{'Mirror Temp':'-233 °C','Power':'~2 kW'},
exploration:{'Deepest Image':'Most distant galaxies ever imaged (Jul 2022)','Exoplanet Atmos.':'First CO₂ detection in WASP-39b (2022)'},
discoveries:{'Earliest Galaxies':'Observed just 300M years after Big Bang','CO₂ in Exoplanet':'First atmospheric chemistry detection (2022)','JuMBOs':'Free-floating Jupiter-mass object pairs in Orion — unexplained (2023)','Rogue Planet Pairs':'Most unexpected JWST discovery'},
funFact:'JWST\'s gold-plated mirror must stay at -233°C — colder than Pluto. Its five-layer sunshield is the size of a tennis court and blocks sunlight 1 million times, allowing the ultra-sensitive infrared detectors to function.'},

"Mars":{type:'planet',typeBadge:'TERRESTRIAL PLANET',size:8,dist:330,period:687,color:0xff5533,moons:'2',atmosphereColor:0xff4422,
overview:'The Red Planet — a cold desert world with the largest volcano and longest canyon in the solar system. Clear evidence of ancient liquid water and prime target for human exploration.',
stats:{'Diameter':'6,779 km','Mass':'6.39 × 10²³ kg','Surface Gravity':'3.72 m/s² (38% of Earth)','Distance from Sun':'227.9 million km (1.52 AU)','Day Length':'24h 37m','Year Length':'687 Earth days','Moons':'Phobos & Deimos'},
atmosphere:{'Composition':'CO₂: 95.3%, N₂: 2.6%, Ar: 1.9%','Surface Pressure':'0.006 bar','Temp Range':'-125 °C to 20 °C'},
exploration:{'Viking 1&2':'First landers (1976)','Curiosity':'Active since 2012 (Gale Crater)','Perseverance':'Active since 2021 (Jezero Crater)','Ingenuity':'First powered flight on another world (19+ flights)'},
discoveries:{'Ancient Water':'River delta in Jezero Crater confirms ancient lake (2021)','Organics':'Complex organics in Gale Crater (Curiosity 2018)','Subsurface Lake':'Possible liquid water under south pole (MARSIS 2018)','Marsquakes':'1,300+ seismic events (InSight 2019–22)','Oxygen Production':'MOXIE experiment made O₂ from CO₂ (2021)'},
funFact:'Olympus Mons is the tallest volcano in the solar system at 22 km. It is so wide (600 km) that a person standing at its base cannot see the summit — it is beyond the Martian horizon.'},

"Ceres":{type:'dwarf',typeBadge:'DWARF PLANET',size:3,dist:420,period:1682,color:0xaaaaaa,moons:'0',
overview:'The largest object in the asteroid belt and only dwarf planet in the inner solar system. Its bright salt spots in Occator Crater puzzled scientists for years.',
stats:{'Diameter':'939 km','Surface Gravity':'0.28 m/s²','Distance from Sun':'413.7 million km (2.77 AU)','Orbital Period':'1,682 Earth days','Rotation':'9 hours 4 min'},
atmosphere:{'Exosphere':'Water vapour near bright spots'},
exploration:{'Dawn':'NASA orbiter 2015–2018'},
discoveries:{'Bright Faculae':'Sodium carbonate from sub-surface brine (Dawn 2015)','Organics':'Complex organic material (Dawn 2017)','Sub-surface Activity':'Geological activity in last few million years','Temporary Atmosphere':'Thin water vapour near bright spots'},
funFact:'Ceres may harbour a sub-surface ocean of liquid brine — making it a candidate for astrobiology in the inner solar system despite being just 939 km across.'},

"Jupiter":{type:'planet',typeBadge:'GAS GIANT',size:45,dist:580,period:4333,color:0xddaa77,moons:'95',atmosphereColor:0xddaa44,
overview:'The king of planets — more massive than all other planets combined. Its magnetic field extends to Saturn\'s orbit, and it hosts the most volcanically active body in the solar system.',
stats:{'Diameter':'139,820 km (11× Earth)','Mass':'1.898 × 10²⁷ kg (318× Earth)','Surface Gravity':'24.79 m/s²','Distance from Sun':'778.5 million km (5.2 AU)','Day Length':'9h 56m','Year Length':'4,333 Earth days'},
atmosphere:{'Composition':'H₂: 89.8%, He: 10.2%','Great Red Spot':'1.3× Earth-wide storm, 350+ years old','Magnetic Field':'20,000× Earth\'s'},
exploration:{'Pioneer 10&11':'First flybys 1973–74','Galileo':'Orbiter+probe 1995–2003','Juno':'Active since 2016','Europa Clipper':'NASA, launched Oct 2024'},
discoveries:{'Io Volcanism':'Voyager 1 (1979) — first volcanism found outside Earth','Europa Ocean':'Sub-surface ocean evidence (Galileo 1995)','Polar Cyclones':'Stable cyclone clusters at poles (Juno 2017)','Fuzzy Core':'No solid core — diffuse heavy element region (Juno)','Atmospheric Depth':'Jet streams penetrate thousands of km deep (Juno 2021)'},
funFact:'Jupiter\'s moon Ganymede is larger than Mercury. The Great Red Spot is a storm larger than Earth that has raged for at least 350 years — though it\'s slowly shrinking.'},

"Europa":{type:'planet',typeBadge:'MOON OF JUPITER',size:7,dist:592,period:3.55,color:0xd0e8f0,moons:'0',parent:'Jupiter',subtype:'europa',
overview:'The most exciting moon in the solar system. Europa\'s smooth icy crust hides a global sub-surface ocean with twice the volume of all Earth\'s oceans. A prime candidate for life.',
stats:{'Diameter':'3,121 km','Orbital Period':'3.55 Earth days','Ocean Depth':'~100 km estimated','Ice Shell':'15–25 km thick','Distance from Jupiter':'671,100 km'},
atmosphere:{'Exosphere':'Thin O₂ from ice splitting by radiation'},
exploration:{'Galileo':'Confirmed sub-surface ocean (1990s)','Europa Clipper':'NASA, launched Oct 2024, arrival 2030 (49 flybys planned)'},
discoveries:{'Water Plumes':'Possible vapour plumes (Hubble 2013, 2016)','Salty Ocean':'Magnetic induction confirms conductive (salty) liquid','Chaos Terrain':'Surface disruption shows ocean-ice interaction','Habitable Chemistry':'Ocean may be in contact with rocky seafloor — enabling hydrothermal chemistry'},
funFact:'Europa\'s sub-surface ocean has existed for billions of years in contact with a rocky seafloor — potentially hosting hydrothermal vents like those that sustain life in Earth\'s deepest oceans.'},

"Io":{type:'planet',typeBadge:'MOON OF JUPITER',size:5,dist:597,period:1.77,color:0xffcc44,moons:'0',parent:'Jupiter',subtype:'io',
overview:'The most volcanically active body in the solar system, with 400+ active volcanoes. Io is squeezed by Jupiter\'s tidal forces, generating extraordinary internal heat.',
stats:{'Diameter':'3,643 km','Orbital Period':'1.77 Earth days','Active Volcanoes':'400+','Largest Lava Lake':'Loki Patera (200 km wide)','Distance from Jupiter':'421,800 km'},
atmosphere:{'Composition':'SO₂ from volcanic outgassing'},
exploration:{'Voyager 1':'Discovered volcanism (1979)','Galileo':'Extended study 1990s–2003','Juno':'Close flybys 2023–24'},
discoveries:{'First Extraterrestrial Volcanism':'Voyager 1 (Linda Morabito\'s discovery, 1979)','Plasma Torus':'Io generates a plasma donut around Jupiter\'s orbit','Tidal Heating':'Orbital resonance with Europa/Ganymede drives all the heat','Mountains':'Compression from subsidence creates peaks up to 18 km'},
funFact:'Io\'s volcanic activity is powered entirely by tidal heating — Jupiter\'s gravity kneads Io\'s interior like bread dough, generating more heat than Earth\'s entire radioactive interior.'},

"Ganymede":{type:'planet',typeBadge:'MOON OF JUPITER',size:9,dist:606,period:7.15,color:0xaabbcc,moons:'0',parent:'Jupiter',
overview:'The largest moon in the solar system — bigger than Mercury. The only moon known to generate its own magnetic field, and likely hosts a sub-surface saltwater ocean.',
stats:{'Diameter':'5,268 km (larger than Mercury)','Orbital Period':'7.15 Earth days','Distance from Jupiter':'1,070,400 km'},
atmosphere:{'Thin Oxygen Exosphere':'Detected by Hubble (1996)'},
exploration:{'Galileo':'Found magnetic field (1996)','JUICE':'ESA will orbit Ganymede from 2034'},
discoveries:{'Self-Generated Magnetic Field':'Only moon with its own dynamo field (Galileo 1996)','Sub-surface Ocean':'Hubble aurora oscillations reveal salty ocean (2015)','JUICE Target':'Will be the most studied moon outside our own from 2034'},
funFact:'If Ganymede orbited the Sun instead of Jupiter, it would be classified as a planet. At 5,268 km, it outclasses Mercury and is only slightly smaller than Mars.'},

"Saturn":{type:'planet',typeBadge:'GAS GIANT',size:38,dist:780,period:10759,color:0xe3d599,moons:'146',atmosphereColor:0xddcc77,
overview:'The jewel of the solar system, famous for its spectacular ring system. The least dense planet — less dense than water — it would float in a large enough ocean.',
stats:{'Diameter':'116,460 km (9.5× Earth)','Mass':'5.68 × 10²⁶ kg','Density':'0.687 g/cm³ (less than water!)','Distance from Sun':'1.43 billion km (9.58 AU)','Day Length':'10h 42m','Year Length':'10,759 Earth days'},
atmosphere:{'Composition':'H₂: 96.3%, He: 3.25%','Wind Speeds':'Up to 1,800 km/h','Hexagonal Storm':'30,000 km-wide vortex at north pole','Rings':'Mostly water ice, extend 282,000 km'},
exploration:{'Pioneer 11':'First flyby 1979','Voyager 1&2':'Flybys 1980–81','Cassini–Huygens':'13-year orbit 2004–17','Dragonfly':'NASA rotorcraft to Titan, 2034'},
discoveries:{'Ring Age':'Geologically young — ~100 million years old (Cassini)','Ring Rain':'Raining into Saturn at ~10,000 kg/s — rings disappear in ~100M years','Hexagonal Storm':'Discovered by Voyager 2 (1981); still ongoing','Moonlets':'Propeller-shaped moonlets in A ring (Cassini)'},
funFact:'Saturn\'s rings are up to 282,000 km wide but only 10–100 metres thick in places. Scaled to a sheet of paper\'s thickness, they would be far thinner than the paper itself.'},

"Titan":{type:'planet',typeBadge:'MOON OF SATURN',size:8,dist:793,period:15.9,color:0xdd8833,moons:'0',parent:'Saturn',subtype:'titan',
overview:'Saturn\'s largest moon — the only moon with a dense atmosphere and liquid bodies on its surface (methane/ethane seas, not water). A chemical analogue of early Earth.',
stats:{'Diameter':'5,151 km','Orbital Period':'15.95 Earth days','Atmospheric Pressure':'1.5× Earth','Surface Temp':'-179 °C','Methane Seas':'Kraken Mare (490,000 km²)'},
atmosphere:{'Composition':'N₂: 98.4%, CH₄: 1.4%','Haze':'Orange organic tholins','Hydrocarbon Cycle':'Methane rain, rivers, and seas'},
exploration:{'Cassini':'Radar mapping through haze','Huygens':'Landed Jan 14, 2005 — first outer solar system landing','Dragonfly':'NASA rotorcraft, 2034'},
discoveries:{'Liquid Lakes':'Confirmed hydrocarbon lakes at poles (Cassini 2006)','Sub-surface Ocean':'Evidence for liquid water under ice (Cassini 2012)','Dunes':'Global organic dune fields at equator','Pre-biotic Chemistry':'Most chemically complex moon known'},
funFact:'On Titan you could strap wings to your arms and fly — atmosphere 4× denser than Earth\'s, gravity 1/7th Earth\'s. Human-powered flight would be completely achievable.'},

"Enceladus":{type:'planet',typeBadge:'MOON OF SATURN',size:3.5,dist:785,period:1.37,color:0xeef8ff,moons:'0',parent:'Saturn',subtype:'enceladus',
overview:'One of the most exciting moons — Enceladus fires geysers of water, organics, and hydrogen from its south pole, directly sampling its sub-surface ocean for passing spacecraft.',
stats:{'Diameter':'504 km','Orbital Period':'1.37 Earth days','Albedo':'0.99 (most reflective body in solar system)','Plume Speed':'~1,400 km/h'},
atmosphere:{'Plume Contents':'H₂O, CO₂, CH₄, H₂, N₂, salts, complex organics, silica'},
exploration:{'Cassini':'Discovered plumes 2005; flew through 23 times'},
discoveries:{'Hydrothermal Vents':'Silica nanoparticles prove active seafloor reactions (2015)','Molecular Hydrogen':'H₂ in plumes = ongoing water-rock chemistry, potential energy for life (2017)','Complex Organics':'High-mass organic molecules (2018)'},
funFact:'Cassini flew through Enceladus\'s plumes and directly "tasted" the ocean spray. Salt, organics, silica, and hydrogen — nearly every ingredient thought necessary for life — were present.'},

"Uranus":{type:'planet',typeBadge:'ICE GIANT',size:28,dist:960,period:30687,color:0x66ccff,moons:'28',atmosphereColor:0x55bbff,
overview:'The seventh planet — a unique ice giant that rolls along its orbital path on its side (97.77° axial tilt) and has the coldest planetary atmosphere in the solar system.',
stats:{'Diameter':'50,724 km (4× Earth)','Distance from Sun':'2.87 billion km (19.2 AU)','Day Length':'17h 14m (retrograde)','Year Length':'84 Earth years','Rings':'13 distinct narrow rings'},
atmosphere:{'Composition':'H₂: 82.5%, He: 15.2%, CH₄: 2.3%','Temperature':'-224 °C (coldest atmosphere in solar system)'},
exploration:{'Voyager 2':'Only flyby Jan 24, 1986','Uranus Orbiter':'NASA flagship mission planned 2030s'},
discoveries:{'Ring Discovery':'1977 via stellar occultation (before Voyager)','Extreme Tilt':'Likely from giant ancient collision','No Internal Heat':'Unlike Neptune, emits almost no internal heat','Diamond Rain':'Methane converted to diamonds predicted in deep interior'},
funFact:'Uranus was the first planet discovered with a telescope (William Herschel, 1781). All 27 of its known moons are named after Shakespeare and Alexander Pope characters.'},

"Neptune":{type:'planet',typeBadge:'ICE GIANT',size:26,dist:1120,period:60190,color:0x3366ff,moons:'16',atmosphereColor:0x2255ff,
overview:'The most distant planet with the fastest winds in the solar system (2,100 km/h). Its moon Triton orbits backwards — a captured Kuiper Belt Object heading for eventual destruction.',
stats:{'Diameter':'49,244 km','Distance from Sun':'4.50 billion km (30.1 AU)','Day Length':'16h 6m','Year Length':'165 Earth years','Wind Speed':'Up to 2,100 km/h (fastest in solar system)'},
atmosphere:{'Composition':'H₂: 80%, He: 19%, CH₄: 1.5%','Temperature':'-218 °C'},
exploration:{'Voyager 2':'Only flyby Aug 25, 1989'},
discoveries:{'Triton Retrograde':'Captured from Kuiper Belt — only large retrograde moon','Active Geysers':'Nitrogen geysers on Triton (Voyager 2 1989)','Ring Arcs':'Bright arcs in rings caused by shepherd moon Galatea','Great Dark Spot':'Storm Earth-sized but disappeared between 1989 and 1994'},
funFact:'Neptune was predicted mathematically before anyone saw it. Le Verrier calculated its position from Uranus\'s orbital wobbles in 1846 — and observers found it within 1° of the prediction the first night they looked.'},

"Triton":{type:'planet',typeBadge:'MOON OF NEPTUNE',size:5,dist:1128,period:5.88,color:0xddccbb,moons:'0',parent:'Neptune',
overview:'Neptune\'s largest moon — a captured Kuiper Belt Object orbiting backwards. Geologically active despite being -235°C, and destined to be torn apart by tidal forces in ~3.6 billion years.',
stats:{'Diameter':'2,706 km','Orbital Period':'5.88 days (retrograde)','Surface Temp':'-235 °C (coldest measured surface in solar system)','Albedo':'0.76 (bright nitrogen frost)'},
atmosphere:{'Thin N₂ Exosphere':'Pressure 0.000014 bar','Geysers':'Active nitrogen geysers 8+ km high'},
exploration:{'Voyager 2':'Only flyby Aug 25, 1989'},
discoveries:{'Retrograde Orbit':'Proof of captured origin from Kuiper Belt','Active Geysers':'Dark streaks from geyser deposits (Voyager 2)','Tidal Doom':'Will spiral inside Neptune\'s Roche limit in ~3.6 billion years','Polar Ice Cap':'Seasonal nitrogen frost cap'},
funFact:'In ~3.6 billion years, Triton will spiral inside Neptune\'s Roche limit and disintegrate into a spectacular ring system that may rival Saturn\'s in grandeur.'},

"Pluto":{type:'dwarf',typeBadge:'DWARF PLANET / KBO',size:4,dist:1300,period:90560,color:0xaaaaaa,moons:'5',
overview:'Once the ninth planet, now the most famous dwarf planet. New Horizons revealed a geologically active world with nitrogen ice mountains, a heart-shaped plain, and surprising complexity.',
stats:{'Diameter':'2,377 km (18.6% of Earth)','Surface Gravity':'0.62 m/s²','Distance from Sun':'5.9 billion km (39.5 AU)','Orbital Period':'248 Earth years','Largest Moon':'Charon (51% of Pluto\'s diameter)'},
atmosphere:{'Composition':'N₂: 98%, CH₄, CO','Surface Pressure':'~10 µbar','Haze':'Multiple blue haze layers (unexpected)'},
exploration:{'New Horizons':'First and only flyby Jul 14, 2015','Discovery':'Clyde Tombaugh, 1930','Reclassified':'IAU dwarf planet 2006'},
discoveries:{'Tombaugh Regio':'Heart-shaped nitrogen ice plain 1,000 km across','Water Ice Mountains':'Peaks up to 3,500 m','Cryovolcanoes':'Possible ice volcanoes Wright Mons and Piccard Mons','Haze':'Multi-layer nitrogen haze — surprisingly blue','Binary System':'Pluto-Charon orbit a point in space between them'},
funFact:'Pluto and Charon orbit a common center of gravity (barycenter) located in the empty space between them — not inside Pluto. They are sometimes called a binary dwarf planet system.'},

"Haumea":{type:'dwarf',typeBadge:'DWARF PLANET',size:3.5,dist:1360,period:103774,color:0xcccccc,moons:'2',
overview:'A unique dwarf planet with an extreme elongated shape from its incredibly fast 3.9-hour rotation — the fastest spin rate of any large body in the solar system.',
stats:{'Longest Axis':'~2,322 km','Shortest Axis':'~996 km','Rotation':'3.9 hours (fastest large KBO)','Orbital Period':'283 Earth years','Ring':'Yes — discovered 2017'},
atmosphere:{'Surface':'Crystalline water ice','Temperature':'-241 °C'},
exploration:{'Discovery':'Mike Brown (USA) / José Ortiz (Spain), 2004–05'},
discoveries:{'Ring System':'Discovered via stellar occultation 2017','Collision Family':'Debris from ancient collision forms KBO family','Crystalline Ice':'Unexpectedly fresh water ice surface'},
funFact:'Haumea is stretched into an extreme egg shape — 2.5× longer than wide — by its 3.9-hour day. If it spun just 15% faster, it would fly apart.'},

"Makemake":{type:'dwarf',typeBadge:'DWARF PLANET',size:3.8,dist:1420,period:112897,color:0xbb9988,moons:'1',
overview:'A classical Kuiper Belt Object and one of the largest dwarf planets, named after the creation deity of Easter Island\'s Rapa Nui people.',
stats:{'Diameter':'~1,430 km','Orbital Period':'309 Earth years','Moon':'MK2 — extremely dark (Hubble 2016)'},
atmosphere:{'Evidence':'Thin local methane atmosphere possible seasonally'},
exploration:{'Discovery':'Mike Brown et al., March 31, 2005 (Easter weekend)'},
discoveries:{'Dark Moon':'MK2 is extremely dark — stark contrast with bright Makemake','No Global Atmosphere':'Unlike Pluto, lacks global atmosphere','Tholins':'Organic compounds from radiation processing of surface ices'},
funFact:'Makemake was discovered around Easter 2005 and informally called "Easter Bunny" — leading to its naming after the Easter Island creation deity.'},

"Eris":{type:'dwarf',typeBadge:'DWARF PLANET',size:4.2,dist:1550,period:203830,color:0xdddddd,moons:'1',
overview:'The most massive known dwarf planet — heavier than Pluto. Eris\'s 2005 discovery directly forced the IAU to define "planet" for the first time, demoting Pluto.',
stats:{'Diameter':'2,326 km','Mass':'1.66 × 10²² kg (27% more than Pluto)','Distance from Sun':'Up to 97.7 AU','Orbital Period':'557 Earth years','Moon':'Dysnomia'},
atmosphere:{'Surface':'Methane frost (albedo 0.96 — almost mirrors sunlight)','Temperature':'-231 °C'},
exploration:{'Discovery':'Mike Brown, Chad Trujillo, David Rabinowitz, 2005'},
discoveries:{'Planet Definition':'Discovery forced IAU to create dwarf planet category (August 2006)','Methane Frost':'Fresh reflective methane ice preserved by distance'},
funFact:'Eris was nicknamed "Xena" after the TV warrior princess. Its discovery proved that if Pluto is a planet, so is Eris — and possibly dozens more KBOs. The IAU created the dwarf planet category specifically in response.'},

"Halley's Comet":{type:'comet',typeBadge:'SHORT-PERIOD COMET',size:2,dist:450,period:27484,color:0x88bbff,moons:'0',
overview:'The most famous comet — observed and recorded by humans for over 2,000 years. It appears every 75–76 years and is the source of two annual meteor showers.',
stats:{'Nucleus':'15 × 8 km, blacker than coal','Period':'~75–76 Earth years','Last Perihelion':'Feb 9, 1986','Next Perihelion':'~Jul 2061'},
atmosphere:{'Coma':'Up to 100,000 km wide','Tail':'Up to 100 million km','Composition':'Water ice, CO, CO₂, dust'},
exploration:{'Giotto (ESA)':'596 km flyby (1986) — first comet nucleus images'},
discoveries:{'Dark Nucleus':'Only 10–15% of surface is active','Meteor Showers':'Source of Eta Aquariids (May) and Orionids (October)','Historical Record':'Chinese records to 240 BC; Bayeux Tapestry (1066)'},
funFact:'Mark Twain was born during Halley\'s 1835 appearance and predicted he would "go out with it." He died April 21, 1910 — one day after the comet\'s perihelion passage.'},

"'Oumuamua":{type:'interstellar',typeBadge:'INTERSTELLAR OBJECT',size:1.5,dist:650,period:0,color:0x885544,moons:'0',
overview:'The first known interstellar object passing through our solar system. Its extreme elongated shape and unexplained non-gravitational acceleration remain scientifically controversial.',
stats:{'Dimensions':'~400m × 40m estimated','Speed':'87.7 km/s (confirmed hyperbolic)','Discovered':'Oct 19, 2017 (Rob Weryk, Pan-STARRS)'},
atmosphere:{'Surface':'Dark organic irradiation mantle suspected'},
exploration:{'No Missions':'Detected too late; no spacecraft intercept possible'},
discoveries:{'No Outgassing':'No coma despite solar approach — unlike any comet','Excess Acceleration':'Cannot be explained by gravity or standard outgassing','Extreme Elongation':'Most elongated natural object ever observed'},
funFact:'\'Oumuamua\'s unexplained acceleration has been attributed to hydrogen ice, fractal dust, or even an alien light sail. As of today, no single hypothesis fully satisfies all observations.'},

"Borisov":{type:'comet',typeBadge:'INTERSTELLAR COMET',size:1.2,dist:720,period:0,color:0x99aacc,moons:'0',
overview:'The first confirmed interstellar comet — discovered in 2019. Unlike the mysterious \'Oumuamua, Borisov behaved exactly like a normal comet, implying universal cometary chemistry across stars.',
stats:{'Nucleus Diameter':'~0.5 km','Discovered':'Aug 30, 2019 (Gennady Borisov, Ukraine)','Origin':'Confirmed interstellar (hyperbolic orbit)'},
atmosphere:{'Coma':'CO, H₂O detected — normal comet composition'},
exploration:{'Hubble':'High-resolution imaging','VLT':'Spectral analysis'},
discoveries:{'Universal Chemistry':'Composition nearly identical to Solar System comets','First Interstellar Comet':'Confirmed by hyperbolic orbit','CO Rich':'Higher CO ratio than most solar system comets'},
funFact:'Unlike the mysterious \'Oumuamua, Borisov was completely ordinary — cometing normally through our solar system. This suggests comet chemistry is universal, regardless of which star they come from.'},

"Voyager 1":{type:'probe',typeBadge:'INTERSTELLAR PROBE',size:1.2,dist:1900,period:0,color:0xffffff,moons:'0',
overview:'The most distant human-made object — Voyager 1 entered interstellar space in 2012 and still transmits scientific data after 47+ years of flight.',
stats:{'Launch':'Sep 5, 1977','Distance from Sun':'Over 165 AU and increasing at 17 km/s','Signal Delay':'23+ hours one way','Power':'RTGs (plutonium-238)','Status':'Still transmitting'},
atmosphere:{'Environment':'Confirmed interstellar medium (plasma density jump Aug 25, 2012)'},
exploration:{'Jupiter Flyby':'1979 — discovered Io volcanism','Saturn Flyby':'1980','Pale Blue Dot':'Photo of Earth from 6 billion km (1990)','Heliopause':'Crossed Aug 25, 2012'},
discoveries:{'Interstellar Plasma':'Denser and more uniform than expected','Heliosphere Shape':'Data suggests bullet-shaped (not spherical)','Galactic Cosmic Rays':'Dramatically different particle environment beyond heliopause'},
funFact:'Voyager 1 carries the Golden Record — a 12-inch gold-plated disc with 115 images, greetings in 55 languages, 90 min of music, and sounds of Earth. It is the farthest-travelled message ever sent.'},

"New Horizons":{type:'probe',typeBadge:'KBO EXPLORER',size:0.8,dist:1700,period:0,color:0xddddff,moons:'0',
overview:'The spacecraft that gave humanity its first close look at Pluto in 2015, then flew past Arrokoth — the most distant object ever visited — revealing pristine solar system formation.',
stats:{'Launch':'Jan 19, 2006','Pluto Flyby':'Jul 14, 2015','Arrokoth Flyby':'Jan 1, 2019 (6.6 billion km from Sun)','Speed':'~14 km/s (still active, outer Kuiper Belt)','Power':'RTGs (plutonium-238)'},
atmosphere:{'Environment':'Kuiper Belt — sparse icy debris field beyond Neptune'},
exploration:{'Pluto System':'First close-up images Jul 14, 2015','Arrokoth':'Most distant object ever visited — Jan 1, 2019','Status':'Extended mission continues in outer Kuiper Belt'},
discoveries:{'Heart of Pluto':'Tombaugh Regio — nitrogen ice heart-plain 1,000 km wide','Blue Haze':'Unexpected multi-layer blue atmospheric haze','Arrokoth Shape':'Contact binary formed by gentle accretion — rewrites planetesimal formation models','Charon Geology':'Red polar cap (Mordor Macula) formed from escaped Pluto atmosphere'},
funFact:'New Horizons is the fastest spacecraft ever launched, departing Earth at 58,536 km/h. It reached the Moon\'s orbit in 9 hours — a trip that took Apollo astronauts 3 days.'},

"OSIRIS-REx":{type:'probe',typeBadge:'ASTEROID SAMPLER',size:0.6,dist:310,period:1.3,color:0xddcc88,moons:'0',
overview:'NASA\'s first asteroid sample return mission — collected material from near-Earth asteroid Bennu and delivered a capsule to Earth in 2023. Now renamed OSIRIS-APEX, it is heading for asteroid Apophis.',
stats:{'Launch':'Sep 8, 2016','Bennu Arrival':'Dec 3, 2018','Sample Collection':'Oct 20, 2020 (TAGSAM touch, 6 sec)','Sample Return':'Sep 24, 2023 — Utah desert','Sample Mass':'~70 g (exceeded 60 g target)'},
atmosphere:{'Bennu Surface':'Rubble pile — unexpectedly loose, fluffy regolith'},
exploration:{'TAGSAM':'Touch-And-Go Sample Acquisition Mechanism','OSIRIS-APEX':'Renamed; en route to 99942 Apophis for 2029 close-approach rendezvous'},
discoveries:{'Particle Ejection':'Bennu was actively ejecting pebbles into space — not predicted (2019)','Fluffy Surface':'Spacecraft sank into surface; thrusters had to fire or it would have been swallowed','Sample Chemistry':'4.7% carbon by weight — highest in any extraterrestrial sample; water-bearing clay found','Ancient Material':'Unaltered from first 10 million years of solar system history'},
funFact:'The sample capsule landed with enough material for decades of study. Scientists found amino acids, water-bearing clay, and carbon compounds — essentially the building blocks of life preserved for 4.5 billion years.'},

"InSight":{type:'probe',typeBadge:'MARS LANDER',size:0.7,dist:328,period:0,color:0xcc8855,moons:'0',
overview:'NASA\'s Mars Interior Exploration lander (2018–2022) recorded over 1,300 marsquakes and measured the Red Planet\'s interior structure — from crust to liquid iron core — for the first time.',
stats:{'Launch':'May 5, 2018','Landing':'Nov 26, 2018 (Elysium Planitia)','End of Mission':'Dec 21, 2022','Marsquakes':'1,300+ detected','Largest Quake':'M 4.7 (May 2022)'},
atmosphere:{'Surface Pressure':'0.006 bar','Weather':'Dust devils passed directly over lander multiple times'},
exploration:{'SEIS Seismometer':'Detected quakes from meteorite impacts and tectonic faults','HP3 Mole':'Heat probe stalled at 35 cm — granular soil failed to provide friction','RISE Experiment':'Measured Mars wobble to map deep interior'},
discoveries:{'Thin Crust':'Martian crust 20–37 km thick — thinner than predicted','Liquid Iron Core':'Radius ~1,830 km — larger than expected, explains why Mars lost its magnetic field','Seismically Active':'Mars is not geologically dead — faults remain active','Impact Detection':'Seismic events matched to new craters found by MRO orbital camera'},
funFact:'InSight died from dust — its solar panels lost 80% efficiency over 4 years of accumulation. Its final image was a self-portrait covered in dust. The last transmission arrived December 21, 2022, weeks after its largest marsquake.'},

// ── EXTRASOLAR OBJECTS ────────────────────────────────────────────────────

"Sagittarius A*":{type:'blackhole',typeBadge:'SUPERMASSIVE BLACK HOLE',size:22,dist:8800,period:0,color:0x000000,moons:'0',
overview:'The 4-million-solar-mass black hole anchoring the center of the Milky Way. Its shadow was imaged by the Event Horizon Telescope in May 2022, confirming general relativity in the most extreme environment accessible to astronomy.',
stats:{'Mass':'4 million solar masses (8×10³⁶ kg)','Schwarzschild Radius':'~12 million km','Distance':'~26,000 light-years','S2 Orbital Period':'~16 years','EHT Resolution':'50 microarcseconds'},
atmosphere:{'Accretion':'Hot magnetized plasma spiraling near light-speed','Flares':'Infrared & X-ray flares every few hours from magnetic reconnection','Fermi Bubbles':'Two gamma-ray lobes 25,000 ly tall above/below galactic plane'},
exploration:{'EHT':'Event Horizon Telescope global array; first Sgr A* image May 12, 2022','GRAVITY Instrument':'ESO/VLTI detected orbiting hot spots at 30% speed of light (2018)','Chandra':'X-ray monitoring since 1999'},
discoveries:{'Event Horizon Shadow':'52-microarcsecond ring imaged (2022) — matches GR prediction within 10%','S2 Relativistic Orbit':'Gravitational redshift and Schwarzschild precession measured (2018 Nobel)','G2 Survival':'Gas cloud survived 2014 periapsis — revealed it had stellar core','Hot Spots':'Plasma blobs orbit Sgr A* in 45-min loop at 0.3c (GRAVITY 2018)'},
funFact:'The 2020 Nobel Prize was awarded for proving Sgr A* must be a black hole. Gas cloud G2 passed within 3,000 AU in 2014 and survived — because it had a hidden stellar core protecting it from tidal forces.'},

"Crab Pulsar":{type:'pulsar',typeBadge:'NEUTRON STAR PULSAR',size:6,dist:4000,period:0,color:0x88ccff,moons:'0',
overview:'The spinning neutron star remnant of SN 1054 — a supernova witnessed in 1054 AD. It spins 30 times per second and powers the Crab Nebula through a relativistic wind carrying 100,000× the Sun\'s luminosity.',
stats:{'Spin Rate':'30.2 rotations/second (period: 33.1 ms)','Mass':'~1.4 solar masses','Radius':'~10 km','Age':'~970 years','Magnetic Field':'~10¹² Gauss','Wind Luminosity':'100,000× solar'},
atmosphere:{'Pulsar Wind Nebula':'Relativistic wind inflating Crab Nebula (11 ly across)','Beams':'Radio, optical, X-ray, gamma-ray pulses — all synced'},
exploration:{'Discovered':'1968 by Staelin & Reifenstein (radio pulses)','SN 1054':'Observed Jul 4, 1054 by Chinese, Japanese, Arab, and Ancestral Puebloan astronomers'},
discoveries:{'Glitches':'Sudden spin-up events prove superfluid neutron vortex core','Pair Production':'Gamma-ray beams create electron-positron pairs in magnetosphere','TeV Emission':'Gamma-rays above 1 TeV detected (MAGIC telescope 2011)'},
funFact:'SN 1054 was so bright Chinese astronomers recorded it visible in daylight for 23 days and at night for nearly 2 years. A Native American petroglyph in Chaco Canyon is believed to depict the new star beside a crescent Moon.'},

"Proxima Centauri":{type:'star',typeBadge:'RED DWARF STAR',size:9,dist:3400,period:0,color:0xff4422,moons:'0',
overview:'The closest star to the Sun — a faint red dwarf 4.24 light-years away hosting at least two confirmed planets, one in the habitable zone. Violent superflares may challenge any potential life.',
stats:{'Distance':'4.24 light-years (1.30 pc)','Mass':'0.1221 solar masses','Luminosity':'0.00155 solar','Age':'~4.85 billion years','Type':'M5.5Ve flare star','Rotation':'~83 days'},
atmosphere:{'Stellar Activity':'Major flare every ~30 hours; UV radiation far exceeds Sun\'s','Habitable Zone':'0.04–0.08 AU'},
exploration:{'Discovery':'Robert Innes, Union Observatory, 1915','Proxima b':'Announced Aug 2016 (ESO radial velocity)','Proxima d':'Announced Feb 2022'},
discoveries:{'Proxima b':'~1.07 Earth masses in habitable zone — orbit 11.2 days','Proxima d':'~0.26 Earth masses, 5-day orbit inside habitable zone (2022)','Giant Superflare':'Event 10× more powerful than any solar flare recorded (May 2019)','X-ray Burst':'One flare in 2017 emitted ~100× the Sun\'s total energy in minutes'},
funFact:'Breakthrough Starshot proposes laser-driven light sails that could reach 20% of lightspeed and arrive at Proxima in 20 years. At chemical rocket speeds today, the trip would take ~70,000 years.'},

"Andromeda Galaxy":{type:'galaxy',typeBadge:'SPIRAL GALAXY',size:38,dist:2500,period:0,color:0xddccbb,moons:'0',
overview:'The nearest large galaxy — 2.537 million light-years away and approaching the Milky Way at ~110 km/s. The two galaxies will begin merging in ~4.5 billion years in one of the universe\'s most spectacular long-term events.',
stats:{'Distance':'2.537 million light-years','Diameter':'~220,000 light-years','Stars':'~1 trillion','Type':'SAb Spiral','Approach Speed':'~110 km/s toward Milky Way','Collision ETA':'~4.5 billion years'},
atmosphere:{'Dark Matter Halo':'Extends ~2 million light-years — already overlapping ours','Central BH':'~100–140 million solar masses'},
exploration:{'First Recorded':'Abd al-Rahman al-Sufi, 964 AD (Book of Fixed Stars)','Distance Measured':'Edwin Hubble, 1923 — proved external galaxies exist','Collision Confirmed':'Hubble proper-motion study, 2012'},
discoveries:{'Double Nucleus':'Two brightness peaks in core (P1, P2) — possibly binary black holes or eccentric stellar disc','Satellite Galaxies':'M32 and M110 are gravitationally bound','Stream Network':'Giant stellar streams from cannibalized dwarf galaxies (PAndAS survey)','Future Sky':'Will create giant elliptical galaxy "Milkomeda" in ~7 billion years'},
funFact:'When Andromeda merges with the Milky Way ~4.5 billion years from now, the night sky will be ablaze with new star clusters — but the odds of any two stars colliding are essentially zero. Galaxies are mostly empty space.'},

"Milky Way Core":{type:'star',typeBadge:'GALACTIC CORE BULGE',size:30,dist:8600,period:0,color:0xffcc55,moons:'0',
overview:'The central bulge of the Milky Way — a dense, ancient stellar population surrounding Sagittarius A*. Crowded with stars 10 million times denser than our solar neighborhood, bathed in X-ray radiation.',
stats:{'Distance':'~26,000 light-years','Bulge Radius':'~6,000 light-years','Star Density':'Millions per cubic light-year at center','Central BH':'Sgr A* — 4 million solar masses','Fermi Bubbles':'±25,000 light-year gamma-ray lobes'},
atmosphere:{'Radiation Environment':'Hard X-ray and gamma-ray dominated','Molecular Clouds':'Central Molecular Zone — 10% of Galactic gas in <1% of area'},
exploration:{'Spitzer Space Telescope':'Near-IR mapping through dust veil','Chandra':'X-ray source catalog of the inner parsec','GRAVITY':'Milliarcsecond astrometry of stellar orbits'},
discoveries:{'Fermi Bubbles':'Discovered 2010 — remnants of past AGN activity from Sgr A*','Arches Cluster':'Densest known star cluster: 150+ massive stars in 1 light-year','Quintuplet Cluster':'Young massive cluster 30 light-years from Sgr A*','S-star Cluster':'20+ stars in tight orbits proving BH mass'},
funFact:'The Arches Cluster near the Galactic Center packs 150 of the Milky Way\'s most massive stars into a region smaller than the distance between the Sun and Alpha Centauri — making it the most star-packed place in the Galaxy.'},

// ── MOONS OF EARTH ────────────────────────────────────────────────────────────
"Luna":{type:'planet',typeBadge:'EARTH\'S MOON',size:5,dist:210,period:27.3,color:0xaaaaaa,moons:'0',parent:'Earth',subtype:'luna',
overview:'Earth\'s only natural satellite — the fifth largest moon in the solar system and the only extraterrestrial body humans have walked on. Twelve Apollo astronauts explored its surface between 1969 and 1972.',
stats:{'Diameter':'3,474 km (27% of Earth)','Distance from Earth':'384,400 km average','Orbital Period':'27.3 Earth days','Surface Gravity':'1.62 m/s² (16.6% Earth)','Axial Tilt':'Tidally locked — same face always toward Earth','Age':'~4.51 billion years'},
atmosphere:{'Exosphere':'Sodium, potassium, water vapour — essentially a vacuum','Surface Temp':'-173°C (night) to +127°C (day)','Radiation':'No magnetic field — direct solar wind exposure'},
exploration:{'Luna 2':'First spacecraft to reach Moon, 1959','Apollo 11':'First human landing — Neil Armstrong & Buzz Aldrin, Jul 20, 1969','Apollo Program':'6 landings total; 12 humans walked the surface','Chang\'e 4':'First far-side landing, Jan 3, 2019','Artemis I':'Uncrewed lunar orbit test, Nov 2022','Artemis III':'Planned crewed south pole landing ~2026'},
discoveries:{'Water Ice':'Confirmed in permanently shadowed polar craters (LCROSS 2009, 382 kg debris plume)','Formation':'Giant Impact Hypothesis — Theia impacted early Earth ~4.51 billion years ago','Lunar Drift':'Moving away from Earth at 3.8 cm/year — Earth\'s day lengthens 1.4ms/century','Moonquakes':'Apollo seismometers detected quakes — Moon still tectonically active','Far Side':'Heavily cratered; no maria; first seen by Luna 3 (1959)'},
funFact:'The Moon is the reason Earth has stable seasons. Its gravitational pull keeps Earth\'s axial tilt locked near 23.5°. Without the Moon, Earth\'s tilt could chaotically vary between 0° and 85° over millions of years, making life as we know it impossible.'},

// ── MOONS OF MARS ─────────────────────────────────────────────────────────────
"Phobos":{type:'planet',typeBadge:'MOON OF MARS',size:1.5,dist:332,period:0.32,color:0x998877,moons:'0',parent:'Mars',subtype:'phobos',
overview:'The larger of Mars\'s two tiny moons — orbiting Mars faster than Mars rotates. Heavily cratered and doomed: tidal forces are pulling it steadily inward toward certain destruction.',
stats:{'Dimensions':'26 × 22 × 18 km','Orbital Period':'7.65 hours — rises in west, sets in east','Distance from Mars':'9,376 km (closest moon to planet in solar system)','Albedo':'0.07 (blacker than coal)'},
atmosphere:{'Surface':'No atmosphere; pulverized regolith ~100 m deep'},
exploration:{'Mariner 9':'First detailed images 1971','Mars Express':'High-res imaging 2004–present','MMX':'JAXA sample return mission, 2026 launch target'},
discoveries:{'Stickney Crater':'9.4 km-wide impact nearly shattered Phobos','Tidal Decay':'Spiraling inward ~1.8 m/century — will crash or disintegrate in ~50 million years','Grooves':'Parallel grooves across surface — tidal stress fractures from Mars\'s gravity','Interior':'~30% empty space — possibly a rubble pile held together by loose regolith'},
funFact:'Phobos orbits so low and fast that from Mars\'s surface it rises in the west, crosses the sky in just 4 hours, and sets in the east — twice per Martian day. Jonathan Swift predicted two Martian moons in 1726, 151 years before their actual discovery.'},

"Deimos":{type:'planet',typeBadge:'MOON OF MARS',size:1.0,dist:334,period:1.26,color:0x887766,moons:'0',parent:'Mars',subtype:'deimos',
overview:'The smaller, more distant of Mars\'s two moons — a smooth, dark body slowly drifting away from Mars. Deimos is so small that from Mars it appears as nothing more than a bright star.',
stats:{'Dimensions':'15 × 12 × 11 km','Orbital Period':'30.3 hours','Distance from Mars':'23,460 km','Named Craters':'Swift and Voltaire'},
atmosphere:{'Surface':'Extremely smooth — thick regolith blanket from ancient impacts'},
exploration:{'Mariner 9':'First images 1971','Viking Orbiters':'Mapping 1977'},
discoveries:{'Smooth Surface':'Unlike Phobos, ejecta falls back and fills craters — making it nearly featureless','Slow Retreat':'Unlike Phobos, Deimos is slowly moving away from Mars — may eventually escape','Origin Debate':'Captured asteroid or impact-ejected debris from Mars — not yet resolved'},
funFact:'In 1726 Jonathan Swift\'s "Gulliver\'s Travels" described two Martian moons with orbital periods of 10 and 21.5 hours. Phobos and Deimos, discovered 151 years later in 1877, have periods of 7.7 and 30.3 hours. Swift\'s prescience remains unexplained.'},

// ── ADDITIONAL JUPITER MOONS ──────────────────────────────────────────────────
"Callisto":{type:'planet',typeBadge:'MOON OF JUPITER',size:8.5,dist:612,period:16.69,color:0x887766,moons:'0',parent:'Jupiter',subtype:'callisto',
overview:'Jupiter\'s second-largest moon and the most heavily cratered body in the solar system. A frozen, ancient world unchanged for 4 billion years — and surprisingly, a possible sub-surface ocean candidate.',
stats:{'Diameter':'4,821 km (slightly smaller than Mercury)','Orbital Period':'16.69 Earth days','Distance from Jupiter':'1,882,700 km','Surface Gravity':'1.24 m/s²','Age':'Surface ~4.0–4.5 billion years'},
atmosphere:{'Thin CO₂ Exosphere':'Detected by Galileo','Surface Temp':'-139°C average'},
exploration:{'Galileo':'Multiple close flybys; possible ocean evidence','JUICE':'ESA flyby during Jupiter approach 2031–2034'},
discoveries:{'Ancient Surface':'No tectonic activity — most primordial large surface in the solar system','Possible Ocean':'Magnetic field anomalies suggest a salty sub-surface ocean (Galileo)','Valhalla Basin':'4,000 km-wide multi-ring impact basin — one of the largest in the solar system','No Internal Differentiation':'Surprisingly mixed rock/ice throughout — no iron core'},
funFact:'Callisto is so heavily cratered that every patch of its surface has been struck multiple times. It has not changed significantly since the Late Heavy Bombardment ended 3.8 billion years ago — making it essentially a frozen photograph of the early solar system.'},

// ── ADDITIONAL SATURN MOONS ───────────────────────────────────────────────────
"Mimas":{type:'planet',typeBadge:'MOON OF SATURN',size:2.5,dist:787,period:0.94,color:0xccbbaa,moons:'0',parent:'Saturn',subtype:'mimas',
overview:'Saturn\'s innermost major moon — famous for its enormous Herschel Crater that makes it resemble the Death Star. A 2023 re-analysis of Cassini data suggested a liquid water ocean lurking beneath its icy shell.',
stats:{'Diameter':'396 km','Orbital Period':'22.6 hours','Distance from Saturn':'185,520 km','Herschel Crater':'139 km wide — 35% of Mimas\'s own radius'},
atmosphere:{'Surface':'Pure water ice; negligible atmosphere','Temperature':'-209°C'},
exploration:{'Voyager 1':'Discovery of Herschel Crater, 1980','Cassini':'Thermal mapping and gravity measurements 2004–2017'},
discoveries:{'Ocean Evidence':'Cassini thermal data re-analysed 2023: liquid water ocean 20–30 km beneath the ice shell','Pac-Man Thermal Map':'Cassini 2010 revealed a bizarre Pac-Man-shaped warm thermal region','Herschel Impact':'The Herschel impact nearly shattered Mimas entirely','Resonance':'Maintains orbital resonances with Tethys and other moons'},
funFact:'Mimas was dismissed for decades as geologically dead. Then in 2023 astronomers re-examined old Cassini data and found its subtle wobble implies a liquid ocean barely 20 km beneath the ice — making it the most unexpected ocean world in the solar system.'},

"Dione":{type:'planet',typeBadge:'MOON OF SATURN',size:3.0,dist:788,period:2.74,color:0xddddd0,moons:'0',parent:'Saturn',subtype:'dione',
overview:'Saturn\'s fourth-largest moon — geologically active with dramatic ice cliffs, tectonic fractures, and one of the thinnest oxygen atmospheres in the solar system. Evidence hints at a sub-surface ocean.',
stats:{'Diameter':'1,123 km','Orbital Period':'2.74 Earth days','Distance from Saturn':'377,396 km','Density':'1.48 g/cm³ (rock-ice mixture)'},
atmosphere:{'Thin O₂ Exosphere':'Detected by Cassini CAPS instrument, 2012'},
exploration:{'Cassini':'5 targeted close flybys; detected exosphere and photographed ice cliffs'},
discoveries:{'Ice Cliffs':'Bright ice scarps (wispy terrain) up to 500 m tall from ancient tectonic fracturing','Oxygen Exosphere':'One of only a handful of moons with detectable molecular oxygen','Sub-surface Ocean':'Gravity field suggests internal liquid water layer','Tectonic Activity':'Linear fracture networks indicate geologic forces still operating'},
funFact:'Dione\'s trailing hemisphere is laced with bright "wispy" streaks that puzzled astronomers for decades. Cassini revealed they are towering ice cliffs — hundreds of metres tall — exposed by ancient faulting, like a frozen, airless Grand Canyon stretched across a moon.'},

"Rhea":{type:'planet',typeBadge:'MOON OF SATURN',size:3.5,dist:789,period:4.52,color:0xddcccc,moons:'0',parent:'Saturn',subtype:'rhea',
overview:'Saturn\'s second-largest moon — an icy body with a heavily cratered surface. In 2008 Cassini detected particle signatures hinting Rhea might be the only moon in the solar system with its own ring system.',
stats:{'Diameter':'1,527 km','Orbital Period':'4.52 Earth days','Distance from Saturn':'527,040 km','Surface Gravity':'0.264 m/s²'},
atmosphere:{'Thin O₂/CO₂ Exosphere':'Detected by Cassini'},
exploration:{'Voyager 1 & 2':'Flybys 1980–81','Cassini':'Multiple targeted flybys 2005–2015'},
discoveries:{'Possible Ring System':'Cassini detected electron depletions consistent with rings in 2008 — never visually confirmed','Asymmetric Cratering':'Leading hemisphere significantly more cratered from incoming debris','Wispy Terrain':'Similar ice cliff features to Dione','Two-Toned':'Bright rayed craters on dark background resemble Iapetus on smaller scale'},
funFact:'If confirmed, Rhea would be the only moon in the solar system with its own ring — a miniature mirror of what Saturn itself has. Cassini detected electron and ion patterns around Rhea in 2008 consistent with a debris disk, but no image has ever captured it directly.'},

"Iapetus":{type:'planet',typeBadge:'MOON OF SATURN',size:3.5,dist:791,period:79.3,color:0x997744,moons:'0',parent:'Saturn',subtype:'iapetus',
overview:'Saturn\'s most enigmatic moon — half pitch-black, half brilliant white. Giovanni Cassini noted in 1671 that it was only visible from one side of Saturn. Three hundred years passed before the mystery was solved.',
stats:{'Diameter':'1,469 km','Orbital Period':'79.3 Earth days (tidally locked)','Distance from Saturn':'3,560,820 km','Dark Region Albedo':'0.03–0.05 (darker than coal)','Bright Region Albedo':'0.5–0.6 (bright as snow)'},
atmosphere:{'No Atmosphere':'Temperature ranges from -143°C (bright) to -173°C (dark side)'},
exploration:{'Giovanni Cassini':'Discovered asymmetry in 1671','Cassini Spacecraft':'Close flyby Sept 2007 — revealed equatorial ridge'},
discoveries:{'Two-Toned Cause':'Dark material swept up from outer moons + thermal segregation darkens leading hemisphere further','Equatorial Ridge':'20 km-tall mountains running 1,300 km — possibly a collapsed ancient ring','Walnut Shape':'No other moon has this walnut-seam appearance — origin still debated','Ancient Surface':'Heavily cratered — surface dates to the Late Heavy Bombardment'},
funFact:'Giovanni Cassini discovered in 1671 that Iapetus was only visible on one side of its orbit around Saturn. The mystery took 300+ years to solve: the dark hemisphere sweeps up dark dust from outer moons, which solar heating then darkens further. The contrast between hemispheres is greater than any other body in the solar system.'},

// ── MOON OF URANUS ────────────────────────────────────────────────────────────
"Miranda":{type:'planet',typeBadge:'MOON OF URANUS',size:2.0,dist:961,period:1.41,color:0xaabbcc,moons:'0',parent:'Uranus',subtype:'miranda',
overview:'Uranus\'s smallest major moon — but the most geologically tormented body in the solar system. Its surface looks shattered and reassembled, with the highest known cliff face in the solar system.',
stats:{'Diameter':'472 km','Orbital Period':'1.41 Earth days','Distance from Uranus':'129,390 km','Verona Rupes':'~20 km cliff — solar system\'s tallest known scarp'},
atmosphere:{'Surface':'Water ice, CO₂ ice, complex organics; essentially no atmosphere'},
exploration:{'Voyager 2':'Only flyby ever — Jan 24, 1986 — very close approach'},
discoveries:{'Verona Rupes':'~20 km vertical cliff — free-fall from the top takes ~12 minutes in Miranda\'s low gravity','Coronae':'Giant rectangular terrain patches (Arden, Elsinore, Inverness) — unique in solar system','Chaotic Geology':'Terrain looks violently disrupted — ancient orbital resonance with Umbriel suspected','Patchwork Surface':'Oldest and youngest terrain types jumbled together — possibly reassembled after ancient collision'},
funFact:'If you stepped off Miranda\'s Verona Rupes — the tallest cliff in the solar system at ~20 km — the fall would take about 12 minutes before you hit the bottom, because Miranda\'s gravity is so weak. On Earth, the same height would take just 64 seconds.'},

// ── MOON OF PLUTO ─────────────────────────────────────────────────────────────
"Charon":{type:'planet',typeBadge:'MOON OF PLUTO',size:3.2,dist:1302,period:6.39,color:0xaaaaaa,moons:'0',parent:'Pluto',subtype:'charon',
overview:'Pluto\'s enormous moon — half the size of Pluto, making the pair a true binary dwarf planet system. Both orbit a gravitational center located in empty space between them. New Horizons revealed a world of canyons, cliffs, and a mysterious dark red pole.',
stats:{'Diameter':'1,212 km (51% of Pluto)','Orbital Period':'6.39 Earth days (mutually tidally locked)','Distance from Pluto':'19,571 km','Density':'1.70 g/cm³'},
atmosphere:{'Surface':'Water ice with ammonia hydrates; thin tenuous atmosphere seasonally'},
exploration:{'New Horizons':'First close-up images Jul 14, 2015'},
discoveries:{'Mordor Macula':'Dark red polar cap — Pluto\'s escaping nitrogen atmosphere freezes onto Charon\'s pole in winter','Serenity Chasma':'Canyon system 9 km deep and longer than Earth\'s Grand Canyon','Mutual Tidal Lock':'Both Pluto and Charon always show the same face to each other — uniquely bilateral in the solar system','Formation':'Giant impact on early Pluto, analogous to Earth\'s Moon-forming event'},
funFact:'Pluto and Charon orbit a gravitational center located in empty space between them — not inside either body. They are the only known binary dwarf planet pair, and arguably neither one truly "orbits" the other.'},

// ── NEW STARS ─────────────────────────────────────────────────────────────────
"Betelgeuse":{type:'star',typeBadge:'RED SUPERGIANT',size:18,dist:4500,period:0,color:0xff4400,moons:'0',
overview:'One of the largest and most luminous stars visible to the naked eye — a red supergiant nearing the end of its life. When it finally explodes as a supernova, it will briefly outshine the full Moon and be visible in daylight.',
stats:{'Diameter':'~1.2 billion km (700–1,000× the Sun)','Distance':'~700 light-years','Luminosity':'~100,000× solar','Temperature':'~3,500 K (surface)','Mass':'~16–19 solar masses','Stage':'Red supergiant — pre-supernova'},
atmosphere:{'Surface Convection':'Giant convective cells the size of the solar system','Mass Loss':'~1 solar mass of gas ejected in the 2019–20 Great Dimming event'},
exploration:{'The Great Dimming':'2019–2020 dramatic fading caused by a surface mass ejection — confirmed by ALMA 2022','VLTI Imaging':'Direct surface imaging showing giant asymmetric convective plumes'},
discoveries:{'Great Dimming Cause':'A surface convection cell ejected ~2×10¹¹ kg of gas, cooling and forming a dust cloud (ALMA 2022)','Confirmed Pre-Supernova':'Will explode within the next ~100,000 years','Supernova Brightness':'Will reach ~magnitude −12 (brighter than crescent Moon) for weeks','Neutrino Signal':'Neutrinos from the collapse will arrive ~3 hours BEFORE the visible light'},
funFact:'When Betelgeuse explodes, Earth will detect a burst of neutrinos roughly 3 hours before any visible light — because neutrinos escape instantly while light has to fight through the collapsing star\'s mass. We will have a 3-hour neutrino warning before the sky lights up.'},

"Sirius":{type:'star',typeBadge:'BINARY STAR SYSTEM',size:11,dist:3600,period:0,color:0xaaddff,moons:'0',
overview:'The brightest star in Earth\'s night sky — a blue-white main sequence star 8.6 light-years away, orbited by a white dwarf companion. Sirius B was the first white dwarf ever discovered.',
stats:{'Distance':'8.6 light-years','Luminosity':'25.4× solar (Sirius A)','Mass':'2.02× solar (A), 1.02× solar (B)','Temperature':'9,940 K (A) / 25,200 K (B)','Orbital Period':'50.1 years (A around B)','Type':'A1V main sequence + DA2 white dwarf'},
atmosphere:{'Sirius B':'White dwarf — Earth-sized remnant of former red giant; no fusion'},
exploration:{'Ancient Egypt':'Heliacal rising of Sirius marked the annual Nile flood; built into pyramid alignments','Sirius B Discovery':'Alvan Graham Clark, 1862 — first white dwarf found'},
discoveries:{'Sirius B':'First observed white dwarf — proved stellar evolution endpoint (1862)','High Proper Motion':'Moving toward the solar system at 5.5 km/s — will be slightly brighter in ~60,000 years','Luminosity':'10× more luminous than thought by ancient astronomers',
'Dog Star':'Rise at dawn historically marked beginning of summer — "dog days" etymology'},
funFact:'Sirius B — the faint white dwarf companion — packs 1.02 solar masses into a sphere the size of Earth. A teaspoon of its material weighs ~5 tonnes. It was the first white dwarf ever discovered and directly proved that stars can die into dense, exotic remnants.'},

// ── NEBULAE ───────────────────────────────────────────────────────────────────
"Orion Nebula":{type:'star',typeBadge:'EMISSION NEBULA',size:20,dist:5500,period:0,color:0xff6622,moons:'0',subtype:'nebula',
overview:'The closest and most studied star-forming region — a stellar nursery 1,344 light-years away where hundreds of stars are actively being born. Visible to the naked eye as the "middle star" in Orion\'s sword.',
stats:{'Distance':'1,344 light-years','Diameter':'~24 light-years','Gas Mass':'~2,000 solar masses','Young Stars':'~700 protostars and newborn stars','Proplyds':'~180 protoplanetary disk systems imaged by Hubble (1993)'},
atmosphere:{'Composition':'Ionized hydrogen, oxygen, nitrogen, sulfur','Temperature':'~10,000 K (ionized gas) / ~10 K (dense cores)','Powered By':'Trapezium Cluster — four massive young stars'},
exploration:{'Hubble 1993':'First resolved protoplanetary disks (proplyds) in any star-forming region','JWST 2022':'Most detailed star-formation image ever — revealed hidden stars inside the nebula'},
discoveries:{'Proplyds':'Planet-forming disks caught mid-formation (Hubble 1993)','JuMBOs':'Free-floating Jupiter-mass binary pairs — no theory predicts their existence (JWST 2023)','Trapezium Cluster':'Four massive O-type stars ionizing the entire nebula','Brown Dwarf Desert':'Fewer brown dwarfs than predicted — formation models need revision'},
funFact:'JWST\'s 2022 Orion Nebula images revealed 40 "JuMBOs" — pairs of Jupiter-mass objects floating freely through space, not bound to any star, tumbling through the nebula together. No theory of planet formation predicted these objects. They remain completely unexplained.'},

"Pillars of Creation":{type:'star',typeBadge:'STELLAR NURSERY',size:16,dist:6000,period:0,color:0xaa6644,moons:'0',subtype:'nebula',
overview:'The most iconic image in astronomy — three towering columns of gas and dust inside the Eagle Nebula (M16) where new stars are being born. Hubble\'s 1995 image is arguably the most recognisable photograph ever taken by a telescope.',
stats:{'Distance':'~6,500–7,000 light-years','Tallest Pillar':'~4 light-years','Location':'Eagle Nebula (M16), Serpens constellation','Nebula Diameter':'~70 light-years'},
atmosphere:{'Composition':'Cool hydrogen gas and dust','Process':'Photoionization erosion — UV from nearby massive stars slowly eats the pillars','EGGs':'Evaporating Gaseous Globules — star embryos at the pillar tips'},
exploration:{'Hubble 1995':'Iconic first image that changed public perception of astronomy','Hubble 2014':'20th anniversary sharp reimage in visible and near-IR','JWST 2022':'Infrared image revealed hundreds of previously hidden forming stars inside the pillars'},
discoveries:{'EGGs':'Evaporating Gaseous Globules at tips — star embryos being slowly uncovered','New Stars':'JWST confirmed many new stars forming inside the pillars, invisible to Hubble','Possible Destruction':'A nearby supernova ~8,000 years ago may have already destroyed the pillars — the light from that event hasn\'t reached us yet','Young Cluster':'M16 cluster of hot stars responsible for the erosion'},
funFact:'The Pillars of Creation may no longer exist. Evidence suggests a shock wave from a nearby supernova — which exploded ~8,000 years ago — is hurtling toward the pillars at 60,000 km/h. The light from their destruction hasn\'t reached Earth yet. In about 1,000 years, they\'ll simply be gone.'},

"Helix Nebula":{type:'star',typeBadge:'PLANETARY NEBULA',size:14,dist:6800,period:0,color:0x3366ff,moons:'0',subtype:'nebula',
overview:'The closest planetary nebula to Earth — nicknamed the "Eye of God." A shell of ionized gas expelled by a dying Sun-like star, offering a preview of our own Sun\'s fate in ~5 billion years.',
stats:{'Distance':'~650 light-years','Diameter':'~2.5 light-years','Central Star':'White dwarf at ~120,000 K','Age':'~10,600 years since gas was expelled','Angular Size':'Larger than the Full Moon in the sky'},
atmosphere:{'Inner Zone':'Ionized oxygen (blue-green glow)','Outer Zone':'Ionized hydrogen and nitrogen (red glow)','Knots':'~20,000 cometary knots — gaseous structures each larger than our solar system'},
exploration:{'Hubble 1996':'Resolved ~20,000 individual cometary knots in the nebula shell','Spitzer 2001':'Detected an infrared-excess dust disk around the central white dwarf'},
discoveries:{'Cometary Knots':'~20,000 tadpole-shaped gaseous structures, each the size of our solar system','Dust Disk':'Infrared excess implies an asteroid belt survived the star\'s death explosion','Two-Shell Structure':'Two overlapping shells from separate ejection events create the "eye" appearance','Sun\'s Future':'Most detailed look at what our solar system will become'},
funFact:'Every one of the Helix Nebula\'s ~20,000 "cometary knots" is larger than our entire solar system from the Sun to Neptune. Their tails all point directly away from the central dying star, pushed outward by radiation pressure — like a crowd of 20,000 people all pointing toward the same exit.'},

// ── COSMIC SCALE OBJECTS ──────────────────────────────────────────────────────
"Laniakea":{type:'galaxy',typeBadge:'SUPERCLUSTER',size:35,dist:7500,period:0,color:0xffddaa,moons:'0',
overview:'Our home supercluster — a massive cosmic structure 520 million light-years across containing over 100,000 galaxies, including the Milky Way. Named "Laniakea" (Hawaiian: immeasurable heaven) in 2014.',
stats:{'Diameter':'520 million light-years','Mass':'~10¹⁷ solar masses','Galaxies':'~100,000 including Milky Way','Our Location':'On the outskirts, near the Virgo Cluster','Neighbors':'Perseus-Pisces and Coma Superclusters'},
atmosphere:{'Great Attractor':'~250 million solar-mass concentration toward which all Laniakea galaxies flow','Cosmic Web Position':'Laniakea sits at intersection of large-scale filaments'},
exploration:{'Discovery':'Brent Tully et al., 2014 — used galaxy velocity flows to define precise boundaries','Method':'Mapped from galaxies\' peculiar velocities (motion beyond Hubble expansion)'},
discoveries:{'Great Attractor':'Milky Way flows toward a hidden mass concentration at ~600 km/s (behind the galactic dust plane)','3D Boundary':'First precisely defined supercluster boundary in astronomical history','Scale Hierarchy':'Laniakea is itself part of the larger Pisces-Cetus Supercluster Complex'},
funFact:'The entire Laniakea Supercluster — 100,000 galaxies — is flowing toward a region called the Great Attractor at ~600 km/s. The Great Attractor hides behind the Milky Way\'s dust plane, which obscures our view of it entirely. We know it exists only because of its gravitational pull on everything around it.'},

"Dark Matter":{type:'blackhole',typeBadge:'INVISIBLE MASS',size:15,dist:9200,period:0,color:0x221133,moons:'0',
overview:'A mysterious invisible substance making up ~27% of the universe\'s total energy content. It neither emits, absorbs, nor reflects light — yet its gravity structures galaxies, clusters, and the entire cosmic web.',
stats:{'Fraction of Universe':'~26.8% of total energy-mass','Ratio':'~5 kg dark matter for every 1 kg of ordinary atoms','Evidence':'Galaxy rotation curves, gravitational lensing, CMB anisotropies, large-scale structure','Candidates':'WIMPs, axions, sterile neutrinos, primordial black holes'},
atmosphere:{'Detection':'No direct detection despite XENON, LUX, PandaX, LHC searches','Interaction':'Gravitational only — does not interact electromagnetically'},
exploration:{'Bullet Cluster':'Best direct evidence — two clusters collided, dark and ordinary matter separated (Chandra 2006)','Vera Rubin\'s Work':'Galaxy rotation curves 1970s proved invisible mass required','LHC':'No dark matter particles produced in proton collisions to date'},
discoveries:{'Galaxy Halos':'Every galaxy embedded in a dark matter halo extending far beyond visible stars','Bullet Cluster':'Direct proof of separation from ordinary matter in cluster collision (2006)','Cosmic Web Scaffold':'Dark matter filaments form the skeleton on which all visible structure hangs','Dwarf Galaxies':'Some dwarf galaxies are >99.9% dark matter by mass'},
funFact:'Vera Rubin spent the 1970s measuring how fast stars orbit galaxies. Every galaxy rotated at nearly the same speed at all radii — impossible unless enormous amounts of invisible mass existed far beyond the visible stars. Her meticulous work established dark matter beyond doubt, yet she never received the Nobel Prize.'},

"Dark Energy":{type:'blackhole',typeBadge:'COSMIC FORCE',size:12,dist:9500,period:0,color:0x110022,moons:'0',
overview:'The most mysterious component of the universe — an unknown energy filling all of space, causing its expansion to accelerate. Makes up ~68% of the universe\'s total content. It was not predicted, not detected directly, and remains entirely unexplained.',
stats:{'Fraction of Universe':'~68.3% of total energy-mass content','Discovery':'1998 — Perlmutter, Schmidt & Riess (Nobel Prize 2011)','Equation of State':'w ≈ −1 (consistent with a cosmological constant)','Effect':'Universal expansion has been accelerating for the last ~5 billion years'},
atmosphere:{'Nature':'Possibly vacuum energy — quantum fluctuations of empty space','The Problem':'Quantum field theory predicts a vacuum energy 10¹²⁰× too large — "worst prediction in physics"'},
exploration:{'Supernova Cosmology Project':'1998 Type Ia supernovae revealed the universe is accelerating, not decelerating','Planck Satellite':'Precise measurement of dark energy density','DESI 2024':'First hints dark energy strength may vary over cosmic time'},
discoveries:{'Accelerating Expansion':'1998 Nobel discovery from distant Type Ia supernovae acting as standard candles','Cosmological Constant':'Einstein\'s "greatest blunder" may be correct after all','DESI 2024':'Hints that w may change over time — would require entirely new physics if confirmed','Future Universe':'If dark energy continues, distant galaxies will eventually recede faster than light — causally disconnected from us forever'},
funFact:'In 2024 the DESI experiment — using 40 million galaxies — released early results suggesting dark energy\'s strength may not be constant, but has weakened slightly over cosmic time. If confirmed, this would overturn the standard cosmological model and require entirely new physics beyond Einstein\'s equations.'},

"Cosmic Microwave Background":{type:'galaxy',typeBadge:'RELIC RADIATION',size:25,dist:9800,period:0,color:0xffddbb,moons:'0',
overview:'The afterglow of the Big Bang — microwave radiation released 380,000 years after the universe began, when it cooled enough for electrons and protons to combine into atoms. The oldest light in the universe, carrying a detailed snapshot of the infant cosmos.',
stats:{'Temperature':'2.7255 K (−270.42°C) — almost perfectly uniform','Redshift':'z ≈ 1,100','Origin Time':'380,000 years after the Big Bang','Discovered':'1965 by Penzias & Wilson (Nobel 1978)','Anisotropy':'Temperature varies by only 1 part in 100,000'},
atmosphere:{'Fluctuations':'Temperature variations encode the seeds of all galaxies and clusters','Polarization':'E-mode polarization maps baryon acoustic oscillations — a "cosmic ruler"'},
exploration:{'Penzias & Wilson':'Accidental discovery 1964 using Bell Labs radio telescope; Nobel 1978','COBE':'First mapped CMB fluctuations; Nobel 2006','WMAP':'Precise map 2001–2010; confirmed universe is flat to within 0.4%','Planck':'Most detailed CMB map 2013–2018; cosmological parameters to 1% precision'},
discoveries:{'Flat Universe':'CMB confirms universe has zero curvature — total energy density = critical density','Precise Cosmology':'Measured: 5% ordinary matter, 27% dark matter, 68% dark energy','Hubble Tension':'CMB-based H₀ (67.4) disagrees with distance-ladder H₀ (73.5) — may require new physics','Inflation Fingerprint':'CMB patterns are consistent with quantum fluctuations stretched by cosmic inflation'},
funFact:'The static on old analog televisions — the "snow" when no channel is tuned — was partly the Cosmic Microwave Background. A few percent of that electromagnetic noise was photons from the Big Bang, 13.8 billion years old, arriving at your TV antenna from the edge of the observable universe.'},

// ── DISTANT SOLAR SYSTEM BODIES ───────────────────────────────────────────────
"Sedna":{type:'dwarf',typeBadge:'EXTREME DWARF PLANET',size:3,dist:1750,period:4404000,color:0xff4422,moons:'0',
overview:'The most distant known dwarf planet — blood-red and extreme, orbiting the Sun so far out that its existence defies current solar system models. Its orbit is the primary clue pointing to a possible undiscovered Planet Nine.',
stats:{'Diameter':'~995 km','Perihelion':'76 AU (closest point — next in 2076)','Aphelion':'~937 AU (farthest — recedes beyond Neptune for 11,400 years)','Color':'Reddest large body in the solar system','Period':'~11,400 Earth years'},
atmosphere:{'Surface':'Methane, nitrogen, water ice; darkened by tholin organic coatings','Temperature':'-240°C'},
exploration:{'Discovery':'Mike Brown, Chad Trujillo, David Rabinowitz — Nov 14, 2003 (Palomar Observatory)'},
discoveries:{'Anomalous Orbit':'Far too distant to be perturbed by Neptune — original orbit mechanism unknown','Planet Nine Clue':'Orbit clusters with other extreme TNOs — strongest statistical evidence for unseen massive planet','Inner Oort Cloud':'First confirmed object potentially from the Inner Oort Cloud','No Satellite':'Unexpectedly no moon despite careful searches — no tidal deceleration'},
funFact:'From Sedna at perihelion, the Sun — despite being the brightest object in the sky — is so distant that you could completely cover it with the head of a pin held at arm\'s length. At aphelion, 937 AU away, the Sun is merely the brightest star in a sky full of stars.'},

"Arrokoth":{type:'dwarf',typeBadge:'KUIPER BELT OBJECT',size:1.0,dist:1720,period:297620,color:0xcc9966,moons:'0',
overview:'The most distant object ever visited by a spacecraft — a pristine contact binary nicknamed "Snowman" that overturned our understanding of how planets first form. New Horizons flew past on January 1, 2019.',
stats:{'Dimensions':'36 × 20 × 10 km','Distance at Flyby':'~44 AU from Sun','Flyby Date':'Jan 1, 2019 (New Horizons; 3,500 km closest approach)','Color':'Uniformly red-orange (tholins throughout)','Age':'4.5 billion years — essentially pristine'},
atmosphere:{'Surface':'Organic tholin compounds over water ice','Temperature':'-230°C'},
exploration:{'New Horizons':'First flyby of a Kuiper Belt Object — Jan 1, 2019'},
discoveries:{'Contact Binary':'Two lobes gently touching — formed from a low-velocity collision','Pristine Composition':'Uniformly red, indicating complex organics (tholins) throughout','Formation Clues':'Supports "pebble accretion" model of planet formation','No Satellites':'Despite careful searches, no moons found — suggests gentle formation'},
funFact:'Arrokoth is a contact binary — two distinct lobes gently touching each other. This shape could only have formed from a very low-velocity collision, providing strong evidence for the "pebble accretion" model of planet formation, where small objects slowly coalesce rather than violently colliding.'}

}// ═══════ end of planetData ═══════
window.planetData = planetData;


// ════════════════════════════════════════════════════════════════════════════
//  TIME & SPEED SYSTEM
// ════════════════════════════════════════════════════════════════════════════
const SPEEDS = [
    0, 0.25, 0.5, 1, 2, 5, 10, 50, 100, 200, 500, 1000, 2000,
    5000, 10000, 50000, 100000, 250000, 500000
];
let speedIdx  = 11;   // starts at 1000×
let paused    = false;
let flyToTarget = null; // used by _resetCamera (already in existing code)

window.togglePause = function() {
    paused = !paused;
    const b = document.getElementById('btn-pause');
    b.textContent = paused ? '▶' : '⏸';
    b.classList.toggle('paused', paused);
};
window.speedUp   = function() { if (speedIdx < SPEEDS.length - 1) { speedIdx++; _updSpeed(); } };
window.speedDown = function() { if (speedIdx > 0) { speedIdx--; _updSpeed(); } };

function _updSpeed() {
    const s = SPEEDS[speedIdx];
    const label = s === 0 ? '0×' : s < 1 ? s + '×' : s.toLocaleString() + '×';
    document.getElementById('speed-display').textContent = label;
}
_updSpeed();


// ════════════════════════════════════════════════════════════════════════════
//  BACKGROUND GALAXIES
// ════════════════════════════════════════════════════════════════════════════
(function buildGalaxies() {
    const palettes = [
        { col: [255, 215, 155], type: 'spiral'     },
        { col: [255, 195, 120], type: 'elliptical' },
        { col: [155, 200, 255], type: 'irregular'  },
    ];
    for (let i = 0; i < 14; i++) {
        const S = 128, cvs = document.createElement('canvas');
        cvs.width = cvs.height = S;
        const ctx = cvs.getContext('2d');
        const pal = palettes[i % 3];
        const [r, g, b] = pal.col;
        const cx = S / 2, cy = S / 2;

        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, S / 2);
        grd.addColorStop(0,   `rgba(${r},${g},${b},0.92)`);
        grd.addColorStop(0.4, `rgba(${r},${g},${b},0.28)`);
        grd.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, S, S);

        // Individual star dots
        for (let k = 0; k < 300; k++) {
            const rad  = Math.random() * S * 0.44;
            const ang  = Math.random() * Math.PI * 2;
            const sqsh = pal.type === 'elliptical' ? 0.42 : 1;
            const px   = cx + rad * Math.cos(ang);
            const py   = cy + rad * Math.sin(ang) * sqsh;
            ctx.fillStyle = `rgba(${r},${g},${b},${(0.35 + Math.random() * 0.6).toFixed(2)})`;
            ctx.fillRect(px | 0, py | 0, 1, 1);
        }

        const tex  = new THREE.CanvasTexture(cvs);
        const dist = 19000 + Math.random() * 18000;
        const ay   = Math.random() * Math.PI * 2;
        const elev = (Math.random() - 0.5) * 7000;
        const spr  = new THREE.Sprite(new THREE.SpriteMaterial({
            map: tex, transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false, opacity: 0.65
        }));
        const sc = 1400 + Math.random() * 2200;
        spr.scale.set(sc, sc * (pal.type === 'elliptical' ? 0.45 : 1), 1);
        spr.position.set(Math.cos(ay) * dist, elev, Math.sin(ay) * dist);
        scene.add(spr);
        allGalaxies.push(spr);
    }
})();


// ════════════════════════════════════════════════════════════════════════════
//  SHOOTING STARS
// ════════════════════════════════════════════════════════════════════════════
const shootingStars = [];
let   ssTimer       = 0;

function spawnShootingStar() {
    const len  = 180 + Math.random() * 360;
    const ang  = Math.random() * Math.PI * 2;
    const elev = (Math.random() - 0.5) * 0.7;
    const dir  = new THREE.Vector3(Math.cos(ang), elev, Math.sin(ang)).normalize();

    const geo = new THREE.BufferGeometry().setFromPoints([
        dir.clone().multiplyScalar(-len / 2),
        dir.clone().multiplyScalar( len / 2)
    ]);
    const mat  = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0, depthWrite: false
    });
    const line = new THREE.Line(geo, mat);

    const r  = 7000 + Math.random() * 11000;
    const ay = Math.random() * Math.PI * 2;
    line.position.set(
        Math.cos(ay) * r,
        (Math.random() - 0.5) * 3500,
        Math.sin(ay) * r
    );
    scene.add(line);
    shootingStars.push({
        line, mat,
        life: 0, maxLife: 0.6 + Math.random() * 1.0,
        vel: dir.clone().multiplyScalar(200 + Math.random() * 320)
    });
}

animHooks.push(dt => {
    ssTimer += dt;
    if (ssTimer > 3.5 + Math.random() * 5) { ssTimer = 0; spawnShootingStar(); }
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life += dt;
        const t = s.life / s.maxLife;
        s.mat.opacity = t < 0.25 ? (t / 0.25) * 0.88 : (1 - t) * 0.88;
        s.line.position.addScaledVector(s.vel, dt);
        if (s.life >= s.maxLife) {
            scene.remove(s.line);
            s.line.geometry.dispose();
            s.mat.dispose();
            shootingStars.splice(i, 1);
        }
    }
});


// ════════════════════════════════════════════════════════════════════════════
//  PLANET INSTANTIATION  (v3.2 — moons orbit parent, absolute phases)
// ════════════════════════════════════════════════════════════════════════════
const _pendingMoons = [];   // named moons waiting for parent mesh attachment

Object.entries(planetData).forEach(([name, data]) => {
    data.name  = name;
    const mesh = createPlanet(data);
    data._mesh = mesh;

    if (data.dist === 0) {
        scene.add(mesh);
        data._pivot = null;
        planets.push({ data, mesh, pivot: null });

    } else if (data.parent) {
        // Named moon → will be parented to parent._mesh in second pass
        const pivot = new THREE.Object3D();
        const initAngle = Math.random() * Math.PI * 2;
        pivot.rotation.y = initAngle;
        data._phase = initAngle;
        // Visual radius: at least enough clearance from parent size
        const par = planetData[data.parent];
        const relDist = par
            ? Math.max(Math.abs(data.dist - par.dist), (par.size||10)*2.0 + data.size*3 + 12)
            : Math.max(data.size * 5, 20);
        data._relDist = relDist;
        mesh.position.x = relDist;
        pivot.add(mesh);
        data._pivot = pivot;
        _pendingMoons.push(data);
        planets.push({ data, mesh, pivot });

    } else {
        // Regular heliocentric orbit
        const pivot = new THREE.Object3D();
        const initAngle = Math.random() * Math.PI * 2;
        pivot.rotation.y = initAngle;
        data._phase = initAngle;
        mesh.position.x = data.dist;
        pivot.add(mesh);
        scene.add(pivot);
        if (data.period > 0) drawOrbit(data.dist, data.color || 0x334466);
        data._pivot = pivot;
        planets.push({ data, mesh, pivot });
    }
});

// Second pass — attach named moon pivots to their parent planet meshes
_pendingMoons.forEach(moonData => {
    const parentData = planetData[moonData.parent];
    if (parentData?._mesh) {
        parentData._mesh.add(moonData._pivot);
        drawOrbit(moonData._relDist, moonData.color || 0xffffff, moonData._pivot);
    } else {
        // Fallback: orbit sun at stated distance
        moonData._pivot.position.x = moonData.dist;
        scene.add(moonData._pivot);
    }
});


// ════════════════════════════════════════════════════════════════════════════
//  MEASURE MODE  (press M → click two objects → distance shown)
// ════════════════════════════════════════════════════════════════════════════
let measureMode = false, measureA = null, measureB = null;
const _mGeo  = new THREE.BufferGeometry();
const _mLine = new THREE.Line(
    _mGeo,
    new THREE.LineBasicMaterial({
        color: 0x55ffcc, transparent: true, opacity: 0.8, depthWrite: false
    })
);
_mLine.visible = false;
scene.add(_mLine);

window.toggleMeasure = function() {
    measureMode = !measureMode;
    measureA = measureB = null;
    _mLine.visible = false;
    const el  = document.getElementById('measure-display');
    const txt = document.getElementById('measure-text');
    if (el)  el.style.display  = measureMode ? 'flex' : 'none';
    if (txt) txt.textContent   = 'Select first object…';
};

function updateMeasureLine() {
    if (!measureA?._mesh || !measureB?._mesh) return;
    const pA = new THREE.Vector3(), pB = new THREE.Vector3();
    measureA._mesh.getWorldPosition(pA);
    measureB._mesh.getWorldPosition(pB);
    _mGeo.setFromPoints([pA, pB]);
    _mLine.visible = true;
    const auDist = (pA.distanceTo(pB) / 149.6).toFixed(2);
    const txt = document.getElementById('measure-text');
    if (txt) txt.textContent = `${measureA.name}  →  ${measureB.name}  ·  ${auDist} AU`;
}


// ════════════════════════════════════════════════════════════════════════════
//  FAVORITES  (press F to bookmark selected object)
// ════════════════════════════════════════════════════════════════════════════
const favorites    = new Set();
let   activeSelect = null;          // currently selected planet data

function toggleFavorite() {
    if (!activeSelect) return;
    const name = activeSelect.name;
    favorites.has(name) ? favorites.delete(name) : favorites.add(name);
    renderFavBar();
}

function renderFavBar() {
    const bar = document.getElementById('favorites-bar');
    if (!bar) return;
    bar.innerHTML = [...favorites]
        .map(n =>
            `<button class="fav-btn" onclick="window._searchSelect && window._searchSelect('${n.replace(/'/g,"\\'")}')">✦ ${n}</button>`
        ).join('');
    bar.style.display = favorites.size ? 'flex' : 'none';
}


// ════════════════════════════════════════════════════════════════════════════
//  RAYCASTER / CLICK SELECTION
// ════════════════════════════════════════════════════════════════════════════
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

let flyToActive   = false;
let flyToProgress = 0;
const flyFromPos  = new THREE.Vector3(), flyFromCtrl = new THREE.Vector3();
const flyToPos    = new THREE.Vector3(), flyToCtrl   = new THREE.Vector3();

function flyTo(data) {
    if (!data?._mesh) return;
    const wp = new THREE.Vector3();
    data._mesh.getWorldPosition(wp);

    flyFromPos.copy(camera.position);
    flyFromCtrl.copy(controls.target);
    flyToCtrl.copy(wp);

    const d   = Math.max(data.size * 7, 55);
    const off = camera.position.clone().sub(wp).normalize().multiplyScalar(d);
    flyToPos.copy(wp).add(off.lengthSq() > 0.5 ? off : new THREE.Vector3(d, d * 0.4, d));

    flyToProgress    = 0;
    flyToActive      = true;
    controls.enabled = false;

    window._focusCallback = () => flyTo(data);
}

renderer.domElement.addEventListener('click', e => {
    mouse.x =  (e.clientX / innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(clickableHitboxes, false);
    if (!hits.length) return;
    const data = hits[0].object.userData;
    if (!data?.name) return;

    // ── Measure mode ──────────────────────────────────────────────────────
    if (measureMode) {
        if (!measureA) {
            measureA = data;
            const txt = document.getElementById('measure-text');
            if (txt) txt.textContent = `${data.name} selected — pick second object…`;
        } else if (!measureB && data !== measureA) {
            measureB = data;
            updateMeasureLine();
        } else {
            // Reset with new first point
            measureA = data; measureB = null; _mLine.visible = false;
            const txt = document.getElementById('measure-text');
            if (txt) txt.textContent = `${data.name} selected — pick second object…`;
        }
        return;
    }

    // ── Normal selection ──────────────────────────────────────────────────
    activeSelect = data;
    window.openHUD(data);
    flyTo(data);
});

// Called from the HTML search results click handler and favorites buttons
window._searchSelect = function(name) {
    const data = planetData[name];
    if (!data) return;
    activeSelect = data;
    window.openHUD(data);
    flyTo(data);
};


// ════════════════════════════════════════════════════════════════════════════
//  SEARCH INPUT HANDLER  (results-click is already wired in engine.html)
// ════════════════════════════════════════════════════════════════════════════
const _sInput   = document.getElementById('search-input');
const _sResults = document.getElementById('search-results');

_sInput.addEventListener('input', () => {
    const q = _sInput.value.trim().toLowerCase();
    if (!q) { _sResults.innerHTML = ''; return; }

    const matches = Object.entries(planetData)
        .filter(([n, d]) =>
            n.toLowerCase().includes(q) ||
            (d.typeBadge || '').toLowerCase().includes(q) ||
            (d.type      || '').toLowerCase().includes(q)
        )
        .slice(0, 9);

    _sResults.innerHTML = matches.length
        ? matches.map(([n, d]) =>
            `<div class="sr-item" data-name="${n}">
               <span class="sr-name">${n}</span>
               <span class="sr-type">${d.typeBadge || d.type || ''}</span>
             </div>`).join('')
        : '<div class="sr-item"><span class="sr-name" style="color:var(--muted)">No results</span></div>';
});


// ════════════════════════════════════════════════════════════════════════════
//  COMPARE SYSTEM
// ════════════════════════════════════════════════════════════════════════════
let compareSlots = [null, null];

window._clearCompare = function() { compareSlots = [null, null]; };

function addToCompare(name) {
  const data = planetData[name]; if (!data) return;
  if (compareSlots[0] && compareSlots[0].name === name) return;
  if (compareSlots[1] && compareSlots[1].name === name) return;
  if (!compareSlots[0]) compareSlots[0] = { name, data };
  else compareSlots[1] = { name, data };
  renderCompare();
}

function renderCompare() {
  const hint = document.getElementById('cp-hint');
  const filledCount = compareSlots.filter(Boolean).length;
  hint.style.display = filledCount < 2 ? 'block' : 'none';
  hint.textContent = filledCount === 0
    ? 'Click any two objects in the scene or search bar to compare them.'
    : 'Select a second object to compare.';

  ['a','b'].forEach((side, i) => {
    const col = document.getElementById(`cp-col-${side}`);
    const slot = compareSlots[i];
    if (!slot) { col.querySelector('.cp-name').textContent = '—'; col.querySelector('.cp-rows').innerHTML = ''; return; }
    col.querySelector('.cp-name').textContent = slot.name;
    const d = slot.data;
    const rows = {
      'Type': d.typeBadge || d.type || '—',
      'Distance (sim)': d.dist > 0 ? (d.dist / 149.6).toFixed(2) + ' AU' : 'Origin',
      'Orbital Period': d.period > 0 ? Number(d.period).toLocaleString() + ' days' : '—',
      'Moons': d.moons || '0',
      ...( d.stats || {} )
    };
    col.querySelector('.cp-rows').innerHTML = buildRows(rows);
  });
}

// Hook into click selection to feed compare mode
const _origOpenHUD = window.openHUD;
window.openHUD = function(data) {
  _origOpenHUD(data);
  if (window.isCompareMode && window.isCompareMode()) addToCompare(data.name);
};

// ════════════════════════════════════════════════════════════════════════════
//  RANDOM FACT SYSTEM
// ════════════════════════════════════════════════════════════════════════════
const _allFacts = Object.entries(planetData)
  .filter(([,d]) => d.funFact)
  .map(([name,d]) => ({ name, fact: d.funFact }));

window._showRandomFact = function() {
  if (!_allFacts.length) return;
  const pick = _allFacts[Math.floor(Math.random() * _allFacts.length)];
  const toast = document.getElementById('fact-toast');
  document.getElementById('fact-toast-object').textContent = pick.name.toUpperCase();
  document.getElementById('fact-toast-text').textContent = pick.fact;
  toast.classList.add('active');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('active'), 9000);
};

// ════════════════════════════════════════════════════════════════════════════
//  KEYBOARD EXTRAS  (M = measure toggle | F = favorite)
// ════════════════════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'm' || e.key === 'M') window.toggleMeasure?.();
    if (e.key === 'f' || e.key === 'F') toggleFavorite();
});


// ════════════════════════════════════════════════════════════════════════════
//  STATUS BAR  (FPS, sim-date, camera distance)
// ════════════════════════════════════════════════════════════════════════════
const EL_FPS  = document.getElementById('sb-fps');
const EL_DATE = document.getElementById('sb-date');
const EL_CAM  = document.getElementById('sb-cam');
const EPOCH_MS = new Date('2000-01-01T00:00:00Z').getTime();
let fpsAcc = 0, fpsN = 0;

function updateScaleIndicator(cd) {
    const lbl  = document.getElementById('scale-label');
    const fill = document.getElementById('scale-bar-fill');
    if (!lbl || !fill) return;
    let txt = 'SOLAR SYSTEM', pct = 18;
    if      (cd > 40000) { txt = 'OBSERVABLE UNIVERSE'; pct = 100; }
    else if (cd > 22000) { txt = 'SUPERCLUSTER SCALE';  pct = 97; }
    else if (cd > 14000) { txt = 'MILKY WAY REGION';    pct = 92; }
    else if (cd >  7000) { txt = 'OUTER HELIOSPHERE';   pct = 70; }
    else if (cd >  2000) { txt = 'KUIPER BELT';         pct = 52; }
    else if (cd >   900) { txt = 'GAS GIANT ZONE';      pct = 38; }
    else if (cd >   350) { txt = 'INNER SYSTEM';        pct = 24; }
    else if (cd >    80) { txt = 'NEAR EARTH SPACE';    pct = 12; }
    else                  { txt = 'PLANETARY SCALE';     pct =  5; }
    lbl.textContent  = txt;
    fill.style.width = pct + '%';
}


// ════════════════════════════════════════════════════════════════════════════
//  MAIN RENDER LOOP
// ════════════════════════════════════════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const rawDt = clock.getDelta();
    const dt    = Math.min(rawDt, 0.1);        // cap delta to avoid spiral

    // ── FPS counter ───────────────────────────────────────────────────────
    fpsAcc += 1 / (dt || 0.016);
    fpsN++;
    if (fpsN >= 20) {
        EL_FPS.textContent = (fpsAcc / fpsN).toFixed(0) + ' FPS';
        fpsAcc = 0; fpsN = 0;
    }

    // ── Advance simulation clock ──────────────────────────────────────────
    const simSpeed = paused ? 0 : SPEEDS[speedIdx];
    const simDt    = simSpeed * dt;           // simulated days this frame
    simClock      += simDt;

    // Simulation date display
    const simDate = new Date(EPOCH_MS + simClock * 86400000);
    EL_DATE.textContent = simDate.toISOString().slice(0, 10);

    // Camera distance display
    const camDist = camera.position.length();
    EL_CAM.textContent = 'CAM ' +
        (camDist < 1000 ? camDist.toFixed(0) : (camDist / 1000).toFixed(1) + 'k') + ' u';

    // ── Milky Way galaxy fade ─────────────────────────────────────────────
    updateMilkyWay(camDist);        // also calls updateScaleIndicator(camDist)

    // ── Planet orbits & self-rotation ─────────────────────────────────────
    planets.forEach(({ data, mesh, pivot }) => {
        const spin = data.type === 'star' ? 0.04
                   : mesh.userData.isTumbler ? 0.45
                   : 0.12;
        mesh.rotation.y += spin * dt;

        // ABSOLUTE position from simClock — eliminates all twitching/drift
        if (pivot && data.period > 0) {
            pivot.rotation.y = (data._phase || 0) + (simClock / data.period) * Math.PI * 2;
        }
    });

    // Generic small moons (created inside createPlanet) — same absolute fix
    allMoons.forEach(({ pivot: mp, period: mp_per, phase: mp_ph }) => {
        mp.rotation.y = (mp_ph || 0) + (simClock / mp_per) * Math.PI * 2;
    });

    // ── Special object animations ──────────────────────────────────────────
    const t = performance.now() * 0.001;

    allBlackHoleDisk.forEach((disk, i) => {
        disk.rotation.z += dt * (0.10 + i * 0.058);
    });
    allBlackHoleJets.forEach(jet => {
        jet.material.opacity = 0.13 + Math.sin(t * 2.1) * 0.07;
    });
    allPulsarBeams.forEach(beam => {
        beam.rotation.z      += dt * 2.8;
        beam.material.opacity = 0.38 + Math.sin(t * 12) * 0.35;
    });
    allFlares.forEach(f => {
        f.material.opacity = Math.max(
            0,
            f.userData.baseOp * (0.45 + 0.55 * Math.sin(t * 1.7 + f.userData.phase))
        );
    });

    // ── Camera fly-to ──────────────────────────────────────────────────────
    if (flyToActive) {
        flyToProgress = Math.min(flyToProgress + dt * 1.15, 1);
        const ease    = 1 - Math.pow(1 - flyToProgress, 3);   // cubic ease-out
        camera.position.lerpVectors(flyFromPos, flyToPos,   ease);
        controls.target.lerpVectors(flyFromCtrl, flyToCtrl, ease);
        if (flyToProgress >= 1) {
            flyToActive      = false;
            controls.enabled = true;
        }
        controls.update();
    }

    // ── Live measure line ─────────────────────────────────────────────────
    if (measureMode && measureA && measureB) updateMeasureLine();

    // ── Label culling by distance ─────────────────────────────────────────
    planets.forEach(({ data, mesh }) => {
        if (!data._labelDiv) return;
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        const tooFar = wp.distanceTo(camera.position) > 5500 && camDist < 3200;
        data._labelDiv.classList.toggle('hidden', tooFar);
    });

    // ── Animation hooks (star field, shooting stars, etc.) ────────────────
    animHooks.forEach(fn => fn(dt));

    // ── Final render ──────────────────────────────────────────────────────
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();


// ════════════════════════════════════════════════════════════════════════════
//  RESIZE HANDLER
// ════════════════════════════════════════════════════════════════════════════
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    labelRenderer.setSize(innerWidth, innerHeight);
    currentPixelRatio = Math.min(window.devicePixelRatio, 1.8);
    renderer.setPixelRatio(currentPixelRatio);
});