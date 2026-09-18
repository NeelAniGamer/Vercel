/**
 * Solar System Visualization Engine  v3.3
 * logic.js — Enhanced 3D Engine
 *
 * v3.3 CHANGES:
 * - 20+ MOONS added with full data (Luna, Phobos, Deimos, Callisto, Mimas, Dione, Rhea, Iapetus, Miranda, Charon + more)
 * - NEBULAE: Orion Nebula, Pillars of Creation, Helix Nebula with procedural textures
 * - COSMIC OBJECTS: Dark Matter, Dark Energy, CMB, Laniakea Supercluster
 * - MORE BODIES: Betelgeuse, Sedna, Arrokoth + 6 more deep-space entries
 * - MOONS TAB: HUD auto-populates a dedicated Moons tab for each planet
 * - COMPARE MODE: press C to compare any two objects side-by-side
 * - RANDOM FACT: press D for a random discovery from any object in the database
 * - COSMIC TIMELINE: press T for universe history + scale panel
 * - SCALE INDICATOR: extended to Supercluster + Observable Universe levels
 *
 * v3.2 CHANGES:
 * - TWITCHING FIXED: removed all `* dt * 60` patterns — pure delta-time rotations
 * - TEXTURES: every object now has a procedural canvas texture (100% offline)
 * - BLACK HOLE: multi-layer gradient accretion disk, photon ring, relativistic jets
 * - SATURN: 5-band procedural ring texture (B ring, Cassini Division, A ring, C/F rings)
 * - SENSITIVITY: window.setSensitivity() + live in-scene sliders (rotate/zoom/pan)
 * - TIME SPEED: expanded SPEEDS array to 500,000×, live speed display
 * - NEW OBJECTS: Europa, Io, Titan, Enceladus, Ganymede, Triton,
 * New Horizons, OSIRIS-REx, InSight, Borisov + more
 * - DISCOVERIES: every major space discovery added to all object data
 * - SHOOTING STARS: random streaks across the sky
 * - SOLAR CORONA: animated flare sprites on stars
 * - MEASURE MODE: press M + click two objects => distance displayed
 * - FAVORITES: press F to bookmark, shown in top bar
 * - QUALITY: higher geometry counts, improved tone mapping
 */

import * as THREE from 'three';
import { OrbitControls }              from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ── Python bridge ─────────────────────────────────────────────────────────────
let planetBridge = null;
try {
    if (typeof QWebChannel !== 'undefined' && typeof qt !== 'undefined') {
        new QWebChannel(qt.webChannelTransport, ch => { planetBridge = ch.objects.planetBridge; });
    }
} catch(e) { /* standalone */ }

// ════════════════════════════════════════════════════════════════════════════
//  SCENE SETUP
// ════════════════════════════════════════════════════════════════════════════
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 20000000);
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
controls.maxDistance        = 12000000;  // Universe-scale zoom
controls.minDistance        = 8;
controls.zoomSpeed          = 1.2;
controls.panSpeed           = 0.8;
controls.rotateSpeed        = 0.6;
controls.screenSpacePanning = false;
controls.enablePan          = true;

// ── Sensitivity API ───────────────────────────────────────────────────────────
// ── Distance Fog (Atmospheric depth haze for far bodies) ───────────────────────
scene.fog = new THREE.FogExp2(0x02040a, 0.000001);

// ════════════════════════════════════════════════════════════════════════════
//  HIGH-PERFORMANCE VISION CULLING, CHUNK LOADING & DISTANCE FADE MANAGER
// ════════════════════════════════════════════════════════════════════════════
class VisionAndChunkManager {
    constructor() {
        this.visionCullingEnabled = true;
        this.chunkLoadingEnabled  = true;
        this.distanceFadeEnabled  = true;
        this.distanceBlurEnabled  = true;
        this.userRenderDistMode   = 'auto'; // 'auto', 'near', 'med', 'far', 'ultra'
        this.activeRenderDistance = 120000;
        
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.tempVec3 = new THREE.Vector3();
        this.camDir = new THREE.Vector3();
        this.camPos = new THREE.Vector3();
        
        this.chunks = [];           // Asteroid chunks + spatial sector volumes
        this.registeredBodies = []; // All celestial bodies, spacecraft & deep space objects
        
        this.stats = {
            totalObjects: 0,
            activeObjects: 0,
            culledObjects: 0,
            totalChunks: 0,
            activeChunks: 0,
            culledPercent: 0
        };

        this.elOptStatus    = null;
        this.elChunksStatus = null;
    }

    init() {
        this.elOptStatus    = document.getElementById('sb-opt');
        this.elChunksStatus = document.getElementById('sb-chunks');
    }

    setRenderDistance(mode) {
        this.userRenderDistMode = mode;
    }

    toggleVisionCulling(val) {
        this.visionCullingEnabled = val !== undefined ? !!val : !this.visionCullingEnabled;
    }

    toggleChunkLoading(val) {
        this.chunkLoadingEnabled = val !== undefined ? !!val : !this.chunkLoadingEnabled;
    }

    toggleDistanceFade(val) {
        this.distanceFadeEnabled = val !== undefined ? !!val : !this.distanceFadeEnabled;
    }

    registerChunk(mesh, center, radius, metadata = {}) {
        this.chunks.push({
            mesh,
            center: center.clone(),
            radius,
            metadata,
            visible: true
        });
        this.stats.totalChunks = this.chunks.length;
    }

    registerBody(bodyObj) {
        this.registeredBodies.push(bodyObj);
        this.stats.totalObjects = this.registeredBodies.length;
    }

    update(camDist, dt, fpsFrameTrigger = false) {
        // Calculate dynamic render distance based on zoom level & mode
        let baseDist = 12000;
        if (camDist > 1000000) baseDist = 25000000;
        else if (camDist > 200000) baseDist = 4000000;
        else if (camDist > 50000)  baseDist = 800000;
        else if (camDist > 8000)   baseDist = 180000;
        else if (camDist > 2000)   baseDist = 45000;
        else if (camDist > 500)    baseDist = 14000;
        else baseDist = 6000;

        if (this.userRenderDistMode === 'near') baseDist *= 0.35;
        else if (this.userRenderDistMode === 'med') baseDist *= 0.7;
        else if (this.userRenderDistMode === 'far') baseDist *= 1.5;
        else if (this.userRenderDistMode === 'ultra') baseDist *= 3.5;
        
        this.activeRenderDistance = baseDist;

        // Dynamically adjust distance fog density according to scale
        if (scene.fog) {
            scene.fog.density = Math.max(0.00000005, 0.000008 / Math.max(1, camDist * 0.1));
        }

        // Update camera matrices & frustum
        camera.updateMatrixWorld();
        this.camPos.copy(camera.position);
        camera.getWorldDirection(this.camDir);
        this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

        let activeCount = 0;
        let culledCount = 0;

        // 1. Process Spatial Chunks (Asteroid belt, Kuiper belt sectors)
        let activeChunksCount = 0;
        if (this.chunkLoadingEnabled) {
            for (let i = 0; i < this.chunks.length; i++) {
                const chunk = this.chunks[i];
                const d = chunk.center.distanceTo(this.camPos);
                
                // If beyond render distance -> Unload
                if (d > this.activeRenderDistance + chunk.radius) {
                    if (chunk.mesh.visible) {
                        chunk.mesh.visible = false;
                        chunk.mesh.matrixAutoUpdate = false;
                    }
                    continue;
                }

                // If vision culling enabled -> check intersection with camera vision frustum
                let inVision = true;
                if (this.visionCullingEnabled) {
                    inVision = this.frustum.intersectsSphere({
                        center: chunk.center,
                        radius: chunk.radius
                    });
                }

                if (inVision) {
                    if (!chunk.mesh.visible) {
                        chunk.mesh.visible = true;
                        chunk.mesh.matrixAutoUpdate = true;
                    }
                    activeChunksCount++;
                } else {
                    if (chunk.mesh.visible) {
                        chunk.mesh.visible = false;
                        chunk.mesh.matrixAutoUpdate = false;
                    }
                }
            }
        } else {
            for (let i = 0; i < this.chunks.length; i++) {
                this.chunks[i].mesh.visible = true;
                activeChunksCount++;
            }
        }
        this.stats.activeChunks = activeChunksCount;

        // 2. Process Celestial Bodies, Spacecraft, and Orbit Lines
        const majorBodies = new Set([
            'Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn',
            'Uranus', 'Neptune', 'Pluto', 'Moon', 'Ceres', 'Europa', 'Io',
            'Ganymede', 'Callisto', 'Titan', 'Enceladus', 'Triton', 'Sedna', 'Haumea', 'Makemake', 'Eris',
            'Sagittarius A*', 'Milky Way Core', 'Andromeda Galaxy', 'Betelgeuse', 'Sirius'
        ]);

        const total = this.registeredBodies.length;
        for (let i = 0; i < total; i++) {
            const item = this.registeredBodies[i];
            const { data, mesh, pivot } = item;
            if (!mesh) continue;

            const isMajor = majorBodies.has(data.name) || data.type === 'planet' || data.type === 'star' || data.type === 'dwarf';

            // Major planets and stars are ALWAYS preserved so the solar system is never empty!
            if (isMajor) {
                activeCount++;
                if (!mesh.visible) {
                    mesh.visible = true;
                    mesh.matrixAutoUpdate = true;
                }
                if (data._labelDiv) {
                    data._labelDiv.style.opacity = (1.0 * labelOpacity).toFixed(2);
                    data._labelDiv.style.filter = 'none';
                }
                continue;
            }

            mesh.getWorldPosition(this.tempVec3);
            const d = this.tempVec3.distanceTo(this.camPos);
            const objRadius = Math.max(data.size || 10, 25);

            // Render Distance Culling for minor deep-space items and micro-probes
            const isBeyondRender = d > (this.activeRenderDistance + objRadius * 15);
            
            // Vision Frustum Culling
            let inVision = true;
            if (this.visionCullingEnabled) {
                inVision = this.frustum.intersectsSphere({
                    center: this.tempVec3,
                    radius: objRadius * 4.0
                });
            }

            const shouldRender = !isBeyondRender && inVision;

            if (shouldRender) {
                activeCount++;
                if (!mesh.visible) {
                    mesh.visible = true;
                    mesh.matrixAutoUpdate = true;
                }
                
                // 3. Distance-Based Blur & Progressive Depth Fade
                if (this.distanceFadeEnabled) {
                    const normDist = Math.min(1, Math.max(0, d / this.activeRenderDistance));
                    // Smooth exponential fade factor
                    const fade = Math.max(0.12, 1 - Math.pow(normDist, 2.2));
                    
                    // Attenuate label opacity & distance blur
                    if (data._labelDiv) {
                        data._labelDiv.style.opacity = (fade * labelOpacity).toFixed(2);
                        if (this.distanceBlurEnabled) {
                            const blurPx = Math.max(0, (normDist - 0.35) * 4.5);
                            data._labelDiv.style.filter = blurPx > 0.25 ? `blur(${blurPx.toFixed(1)}px)` : 'none';
                        }
                    }
                }
            } else {
                culledCount++;
                if (mesh.visible) {
                    mesh.visible = false;
                    mesh.matrixAutoUpdate = false;
                }
                if (data._labelDiv) {
                    data._labelDiv.style.opacity = '0';
                    data._labelDiv.style.filter = 'blur(4px)';
                }
            }
        }

        this.stats.activeObjects = activeCount;
        this.stats.culledObjects = culledCount;
        this.stats.culledPercent = total > 0 ? Math.round((culledCount / total) * 100) : 0;
        
        // Update UI Stats element
        if (fpsFrameTrigger) {
            if (!this.elOptStatus) this.init();
            if (this.elOptStatus) {
                this.elOptStatus.innerHTML = `<span class="sb-opt-pill">⚡ OPT: ${this.stats.culledPercent}% CULLED</span> | CHUNKS: <span>${this.stats.activeChunks}/${this.stats.totalChunks}</span>`;
            }
        }
    }
}

const visionManager = new VisionAndChunkManager();

// ── Sensitivity & Optimization API ────────────────────────────────────────────
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
        case 'renderDist': visionManager.setRenderDistance(val); break;
        case 'visionCull': visionManager.toggleVisionCulling(val); break;
        case 'chunkLoad': visionManager.toggleChunkLoading(val); break;
        case 'distFade': visionManager.toggleDistanceFade(val); break;
    }
};

window.visionManager = visionManager;

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
    a.download = 'solar-engine-v3.4-' + Date.now() + '.png'; a.click();
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
    ctx.fillStyle='#000003'; ctx.fillRect(0,0,S,S);

    // ── Background star scatter ────────────────────────────────────────
    for(let i=0;i<18000;i++){
        const x=Math.random()*S, y=Math.random()*S;
        const br=(Math.random()*0.28+0.04).toFixed(2);
        ctx.fillStyle=`rgba(255,255,255,${br})`;
        ctx.fillRect(x|0,y|0,1,1);
    }

    // ── Disk haze (stretched ellipse, no central sphere) ───────────────
    ctx.save(); ctx.translate(cx,cy); ctx.scale(1,0.38);
    const dg=ctx.createRadialGradient(0,0,0,0,0,S*0.48);
    dg.addColorStop(0,  'rgba(200,185,120,0.22)');
    dg.addColorStop(0.18,'rgba(165,150,100,0.15)');
    dg.addColorStop(0.40,'rgba(100,105,140,0.07)');
    dg.addColorStop(0.65,'rgba(60,65,100,0.03)');
    dg.addColorStop(1,  'rgba(0,0,0,0)');
    ctx.fillStyle=dg; ctx.fillRect(-S/2,-S/2,S,S); ctx.restore();

    // ── Galactic nucleus — small, point-like, NOT a sphere ────────────
    const nucG=ctx.createRadialGradient(cx,cy,0,cx,cy,S*0.028);
    nucG.addColorStop(0,  'rgba(255,248,210,0.82)');
    nucG.addColorStop(0.3,'rgba(240,210,130,0.45)');
    nucG.addColorStop(0.7,'rgba(180,150,70,0.12)');
    nucG.addColorStop(1,  'rgba(0,0,0,0)');
    ctx.fillStyle=nucG; ctx.fillRect(0,0,S,S);

    // ── Spiral arms (4-arm Milky Way: Sagittarius, Perseus, Norma, Orion spur) ──
    function drawArm(baseAng, count, colorFn, armWidth=0.9) {
        for(let i=0;i<count;i++){
            const t=Math.pow(Math.random(),0.65);
            const sp=(Math.random()-0.5)*(0.28+t*armWidth);
            const ang=baseAng+t*Math.PI*2.7+sp;
            const r=t*S*0.44+4;
            const px=cx+r*Math.cos(ang);
            const py=cy+r*Math.sin(ang)*0.40;
            if(px<2||px>S-2||py<2||py>S-2) continue;
            ctx.fillStyle=colorFn((1-t)*0.55+0.05, Math.random());
            ctx.fillRect(px|0,py|0,Math.random()<0.85?1:2,1);
        }
    }
    const cStar =(b,r)=>r<0.50?`rgba(255,255,245,${b.toFixed(2)})`:r<0.72?`rgba(155,185,255,${(b*0.85).toFixed(2)})`:(`rgba(255,200,145,${(b*0.70).toFixed(2)})`);
    const cYoung=(b,r)=>r<0.60?`rgba(180,210,255,${b.toFixed(2)})`:(`rgba(255,240,200,${(b*0.75).toFixed(2)})`);
    drawArm(0,           20000, cStar);
    drawArm(Math.PI,     20000, cStar);
    drawArm(Math.PI*0.5, 12000, cYoung, 0.7);
    drawArm(Math.PI*1.5, 12000, cYoung, 0.7);

    // ── Dust lane darkening along midplane ────────────────────────────
    ctx.save(); ctx.translate(cx,cy); ctx.scale(1,0.12);
    const dustG=ctx.createRadialGradient(0,0,S*0.06,0,0,S*0.44);
    dustG.addColorStop(0,  'rgba(0,0,0,0)');
    dustG.addColorStop(0.3,'rgba(0,0,0,0.08)');
    dustG.addColorStop(0.6,'rgba(0,0,0,0.18)');
    dustG.addColorStop(1,  'rgba(0,0,0,0)');
    ctx.fillStyle=dustG; ctx.fillRect(-S/2,-S/2*8,S,S*8); ctx.restore();

    // ── "You are here" — tiny dot only, no text on the texture ────────
    const sunAng=Math.PI*0.32, sunRad=S*0.29;
    const sunX=cx+sunRad*Math.cos(sunAng), sunY=cy+sunRad*Math.sin(sunAng)*0.40;
    // Store coords for the CSS2D label (injected after mesh creation)
    buildMilkyWayTexture._sunUV = { u: sunX/S, v: sunY/S };
    const sg=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,8);
    sg.addColorStop(0,'rgba(255,255,220,1)'); sg.addColorStop(0.5,'rgba(255,255,150,0.6)'); sg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(sunX,sunY,6,0,Math.PI*2); ctx.fill();

    return new THREE.CanvasTexture(cvs);
}
function initMilkyWay() {
    const mwTex = buildMilkyWayTexture();
    milkyWayMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(110000, 110000),
        new THREE.MeshBasicMaterial({
            map: mwTex,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            alphaTest: 0.001,
        })
    );
    milkyWayMesh.rotation.x = Math.PI / 2;
    milkyWayMesh.rotation.z = 0.1;
    milkyWayMesh.renderOrder = -1; // draw behind everything else
    scene.add(milkyWayMesh);

    // "You are here" CSS2D label — offset to where the sun dot is on the texture
    // Approx world position: sunAng=PI*0.32, sunRad=S*0.29 mapped to 110000 plane
    const youDiv = document.createElement('div');
    youDiv.id = 'you-are-here-label';
    youDiv.style.cssText = `font-family:'Space Mono',monospace;font-size:10px;color:rgba(255,255,200,0.85);
        letter-spacing:2px;pointer-events:none;white-space:nowrap;text-shadow:0 0 6px rgba(255,255,100,0.8);
        padding:2px 6px;border-left:2px solid rgba(255,255,150,0.6);opacity:0;transition:opacity 0.8s;`;
    youDiv.textContent = '☉ YOU ARE HERE';
    const youLabel = new CSS2DObject(youDiv);
    // Map sun position from texture UV to world coords
    const sunAng = Math.PI * 0.32, sunRad = 110000 * 0.29;
    youLabel.position.set(Math.cos(sunAng) * sunRad, 200, Math.sin(sunAng) * sunRad * 0.40);
    milkyWayMesh.add(youLabel);

    // Store ref so updateMilkyWay can show/hide it
    milkyWayMesh._youLabel = youDiv;
}
initMilkyWay();
const GALAXY_START=3200,GALAXY_FULL=9000,galaxyLabel=document.getElementById('galaxy-label'); let lastMilkyOpacity=-1;
function updateMilkyWay(cd){
    const t=Math.max(0,Math.min(1,(cd-GALAXY_START)/(GALAXY_FULL-GALAXY_START)));
    const fadeOut = cd > 80000 ? Math.max(0, 1 - (cd - 80000) / 80000) : 1;
    const tFinal  = t * fadeOut;
    milkyWayOpacity=THREE.MathUtils.lerp(milkyWayOpacity,tFinal,0.04);
    if(Math.abs(milkyWayOpacity-lastMilkyOpacity)>0.002){
        milkyWayMesh.material.opacity=milkyWayOpacity*0.82;
        lastMilkyOpacity=milkyWayOpacity;
    }
    // Show galaxy label and "you are here" marker when zoomed out to galaxy scale
    if(milkyWayOpacity>0.5) galaxyLabel.classList.add('visible'); else galaxyLabel.classList.remove('visible');
    if(milkyWayMesh._youLabel) {
        milkyWayMesh._youLabel.style.opacity = milkyWayOpacity > 0.65 ? '1' : '0';
    }
    orbitLines.forEach(l=>{l.material.opacity=0.35*(1-milkyWayOpacity*0.85);});
    updateScaleIndicator(cd);
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
    // Wispy cloud layers
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
    // Stars inside
    for(let i=0;i<200;i++){
        const x=Math.random()*S,y=Math.random()*S,br=Math.random()*0.8+0.2;
        ctx.fillStyle=`rgba(255,255,255,${br.toFixed(2)})`; ctx.fillRect(x|0,y|0,1,1);
    }
    // Bright core stars
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
    // Base fill
    ctx.fillStyle=`hsl(${(c.getHSL({}).h*360).toFixed(0)},${(c.s*100).toFixed(0)}%,${(c.l*100).toFixed(0)}%)`;
    ctx.fillRect(0,0,W,H);
    // Horizontal bands
    for(let i=0;i<bands;i++){
        const y=Math.floor((i/bands)*H), bh=Math.floor(H/bands)+(Math.random()<0.3?Math.floor(H/bands*0.5):0);
        const dl=(Math.random()-0.5)*bandVariance*2;
        const hsl={h:0,s:0,l:0}; c.getHSL(hsl);
        const bL=Math.max(0.05,Math.min(0.95,hsl.l+dl));
        const bS=Math.max(0.1,Math.min(1,hsl.s+(Math.random()-0.5)*0.15));
        ctx.fillStyle=`hsla(${(hsl.h*360).toFixed(0)},${(bS*100).toFixed(0)}%,${(bL*100).toFixed(0)}%,0.85)`;
        ctx.fillRect(0,y,W,bh+4);
    }
    // Storm ovals
    for(let i=0;i<3;i++){
        const ox=Math.random()*W, oy=Math.random()*H, ow=50+Math.random()*120, oh=20+Math.random()*45;
        const hsl={h:0,s:0,l:0}; c.getHSL(hsl);
        const sg=ctx.createRadialGradient(ox,oy,0,ox,oy,ow*0.5);
        sg.addColorStop(0,`hsla(${(hsl.h*360+15).toFixed(0)},70%,${(hsl.l*0.65*100).toFixed(0)}%,0.6)`);
        sg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.save(); ctx.scale(1,oh/ow); ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(ox,oy*ow/oh,ow,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    // Subtle latitude noise
    const img=ctx.getImageData(0,0,W,H);
    for(let x=0;x<W;x+=2){const n=(Math.random()-0.5)*8; for(let y=0;y<H;y++){const idx=(y*W+x)*4; img.data[idx]=Math.max(0,Math.min(255,img.data[idx]+n)); img.data[idx+1]=Math.max(0,Math.min(255,img.data[idx+1]+n*0.9)); img.data[idx+2]=Math.max(0,Math.min(255,img.data[idx+2]+n*0.7));}}
    ctx.putImageData(img,0,0);
    return new THREE.CanvasTexture(cvs);
}

// ── Earth cloud/atmosphere layer ─────────────────────────────────────────────
function makeEarthCloudsTexture() {
    const S=512, cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d');
    ctx.clearRect(0,0,S,S);
    // Wispy cloud systems
    for(let i=0;i<120;i++){
        const x=Math.random()*S, y=Math.random()*S;
        const w=30+Math.random()*80, h=8+Math.random()*20;
        const g=ctx.createRadialGradient(x,y,0,x,y,w*0.5);
        const op=(0.3+Math.random()*0.55).toFixed(2);
        g.addColorStop(0,`rgba(255,255,255,${op})`); g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.save(); ctx.translate(x,y); ctx.scale(1,h/w); ctx.fillStyle=g;
        ctx.beginPath(); ctx.arc(0,0,w*0.5,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    return new THREE.CanvasTexture(cvs);
}

// ── Jupiter Great Red Spot overlay ────────────────────────────────────────────
function addJupiterGRS(mesh, size) {
    const grsGeo = new THREE.SphereGeometry(size*1.005, 32, 32);
    const S=128, cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d');
    ctx.clearRect(0,0,S,S);
    // Paint GRS at approx longitude
    const gx=S*0.55, gy=S*0.38;
    const g=ctx.createRadialGradient(gx,gy,0,gx,gy,S*0.12);
    g.addColorStop(0,'rgba(180,60,30,0.85)'); g.addColorStop(0.5,'rgba(160,50,20,0.5)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.save(); ctx.translate(gx,gy); ctx.scale(1.6,1.0); ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(0,0,S*0.08,0,Math.PI*2); ctx.fill(); ctx.restore();
    const grsMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cvs),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
    mesh.add(new THREE.Mesh(grsGeo, grsMat));
}


// ════════════════════════════════════════════════════════════════════════════
//  CHUNK-BASED ASTEROID BELT FACTORY (16 SECTORS PER BELT)
// ════════════════════════════════════════════════════════════════════════════
function createChunkedBelt(inner, outer, count, bH, bL, numSectors = 16, beltName = 'Asteroid Belt') {
    const tex = makeRockyTexture(bH, 0.2, bL, 8);
    const geo = new THREE.IcosahedronGeometry(1.8, 0);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0.04 });
    const countPerChunk = Math.floor(count / numSectors);
    const chunkMeshes = [];
    const dm = new THREE.Object3D();

    for (let c = 0; c < numSectors; c++) {
        const im = new THREE.InstancedMesh(geo, mat, countPerChunk);
        const startAng = (c / numSectors) * Math.PI * 2;
        const endAng   = ((c + 1) / numSectors) * Math.PI * 2;
        const midAng   = (startAng + endAng) / 2;
        const midRad   = (inner + outer) / 2;

        for (let i = 0; i < countPerChunk; i++) {
            const ang = startAng + Math.random() * (endAng - startAng);
            const rad = inner + Math.random() * (outer - inner);
            dm.position.set(
                Math.cos(ang) * rad,
                (Math.random() - 0.5) * 30 + Math.sin(ang * 5) * 12,
                Math.sin(ang) * rad
            );
            dm.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            const s = Math.random() * 1.8 + 0.4;
            dm.scale.set(s, s, s);
            dm.updateMatrix();
            im.setMatrixAt(i, dm.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
        scene.add(im);
        chunkMeshes.push(im);

        // Center and bounding radius for chunk culling
        const center = new THREE.Vector3(Math.cos(midAng) * midRad, 0, Math.sin(midAng) * midRad);
        const radius = Math.hypot((outer - inner) / 2, Math.sin(Math.PI / numSectors) * outer) + 50;

        visionManager.registerChunk(im, center, radius, {
            name: `${beltName} Chunk ${c + 1}/${numSectors}`,
            sector: c
        });
    }
    return chunkMeshes;
}

const asteroidBelt = createChunkedBelt(380, 480, 4000, 0.07, 0.30, 16, 'Asteroid Belt');
const kuiperBelt   = createChunkedBelt(1400, 1800, 5000, 0.55, 0.35, 16, 'Kuiper Belt');


// ════════════════════════════════════════════════════════════════════════════
//  SATELLITE & SPACECRAFT TEXTURE LIBRARY
// ════════════════════════════════════════════════════════════════════════════
function makeISSTexture() {
    const W=512,H=256,cvs=document.createElement('canvas'); cvs.width=W; cvs.height=H;
    const ctx=cvs.getContext('2d');
    ctx.fillStyle='#c8cdd4'; ctx.fillRect(0,0,W,H);
    // Truss structure
    ctx.strokeStyle='#88909a'; ctx.lineWidth=3;
    ctx.strokeRect(10,H/2-6,W-20,12);
    // Solar panel colour blocks
    [0,0.25,0.5,0.75].forEach(x=>{
        const g=ctx.createLinearGradient(x*W,0,x*W+90,0);
        g.addColorStop(0,'#1a2a5a'); g.addColorStop(0.5,'#2244aa'); g.addColorStop(1,'#1a2a5a');
        ctx.fillStyle=g; ctx.fillRect(x*W+5,20,80,H-40);
    });
    // Gold thermal foil modules
    ctx.fillStyle='#c8960a'; ctx.fillRect(W/2-40,H/2-20,80,40);
    ctx.fillStyle='#e0aa20'; ctx.fillRect(W/2-30,H/2-12,60,24);
    // Grid pattern on panels
    ctx.strokeStyle='rgba(100,120,255,0.25)'; ctx.lineWidth=1;
    for(let i=0;i<W;i+=10){ctx.beginPath();ctx.moveTo(i,20);ctx.lineTo(i,H-20);ctx.stroke();}
    for(let j=20;j<H-20;j+=8){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(W,j);ctx.stroke();}
    return new THREE.CanvasTexture(cvs);
}
function makeHubbleTexture() {
    const S=512,cvs=document.createElement('canvas'); cvs.width=S; cvs.height=S;
    const ctx=cvs.getContext('2d');
    // Silver body
    const lg=ctx.createLinearGradient(0,0,S,0);
    lg.addColorStop(0,'#606870'); lg.addColorStop(0.4,'#c0c8d0'); lg.addColorStop(0.6,'#a0a8b0'); lg.addColorStop(1,'#606870');
    ctx.fillStyle=lg; ctx.fillRect(0,0,S,S);
    // Gold foil bands
    ctx.fillStyle='#b08818'; ctx.fillRect(0,60,S,40); ctx.fillRect(0,S-100,S,40);
    ctx.fillStyle='#c8a030'; ctx.fillRect(0,68,S,24); ctx.fillRect(0,S-92,S,24);
    // Mirror aperture
    const mg=ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S*0.2);
    mg.addColorStop(0,'#000508'); mg.addColorStop(0.8,'#0a1020'); mg.addColorStop(1,'#404858');
    ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(S/2,S/2,S*0.2,0,Math.PI*2); ctx.fill();
    // Secondary mirror spider
    ctx.strokeStyle='#606870'; ctx.lineWidth=3;
    [[S/2,S/2-S*0.2],[S/2,S/2+S*0.2],[S/2-S*0.2,S/2],[S/2+S*0.2,S/2]].forEach(([x,y])=>{
        ctx.beginPath();ctx.moveTo(S/2,S/2);ctx.lineTo(x,y);ctx.stroke();
    });
    // Solar panels (gold)
    ctx.fillStyle='#1a3060'; ctx.fillRect(20,S/2-15,S-40,30);
    ctx.strokeStyle='rgba(40,80,200,0.3)'; ctx.lineWidth=1;
    for(let i=20;i<S-20;i+=12){ctx.beginPath();ctx.moveTo(i,S/2-15);ctx.lineTo(i,S/2+15);ctx.stroke();}
    return new THREE.CanvasTexture(cvs);
}
function makeJWSTTexture() {
    const S=512,cvs=document.createElement('canvas'); cvs.width=S; cvs.height=S;
    const ctx=cvs.getContext('2d');
    ctx.fillStyle='#060a10'; ctx.fillRect(0,0,S,S);
    // 18 gold hexagonal mirror segments
    const hexR=52, cols=3, rows=3;
    const hexW=hexR*Math.sqrt(3), hexH=hexR*2;
    const startX=S/2-hexW, startY=S/2-hexH;
    const hexPos=[
        [0,-1],[1,-1],[2,-1],[-.5,0],[.5,0],[1.5,0],[0,1],[1,1],[2,1],
        [-.5,-2],[1.5,-2],[2.5,-1],[2.5,0],[2.5,1],[1.5,2],[.5,2],[-.5,1],[-.5,-1]
    ];
    const hex=(ctx,cx,cy,r)=>{ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));}ctx.closePath();};
    hexPos.forEach(([q,r2])=>{
        const cx=S/2+q*hexW+r2*hexW*0.5, cy=S/2+r2*hexR*1.5;
        const gld=ctx.createRadialGradient(cx,cy,0,cx,cy,hexR);
        gld.addColorStop(0,'rgba(255,220,80,0.95)'); gld.addColorStop(0.7,'rgba(200,160,20,0.8)'); gld.addColorStop(1,'rgba(120,80,0,0.4)');
        ctx.save(); hex(ctx,cx,cy,hexR-3); ctx.fillStyle=gld; ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=3; ctx.stroke(); ctx.restore();
        // Reflection shimmer
        ctx.save(); hex(ctx,cx,cy,hexR-3); ctx.clip();
        const sg=ctx.createLinearGradient(cx-hexR,cy-hexR,cx+hexR,cy+hexR);
        sg.addColorStop(0,'rgba(255,255,220,0.5)'); sg.addColorStop(0.5,'rgba(255,255,255,0)'); sg.addColorStop(1,'rgba(255,220,80,0.2)');
        ctx.fillStyle=sg; ctx.fillRect(cx-hexR,cy-hexR,hexR*2,hexR*2); ctx.restore();
    });
    // Sunshield layers (folded, faint outline)
    ctx.strokeStyle='rgba(180,200,160,0.15)'; ctx.lineWidth=2;
    for(let i=1;i<=5;i++){ctx.strokeRect(S*0.05*i,S*0.05*i,S*(1-0.1*i),S*(1-0.1*i));}
    return new THREE.CanvasTexture(cvs);
}
function makeAccretionDiskHotTexture(asymmetric) {
    const W=2048,H=6,cvs=document.createElement('canvas'); cvs.width=W; cvs.height=H;
    const ctx=cvs.getContext('2d'),g=ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,'rgba(0,0,0,0)');
    g.addColorStop(0.03,'rgba(255,255,255,1)');   // photon sphere
    g.addColorStop(0.08,'rgba(255,250,200,1)');   // inner edge
    g.addColorStop(0.20,'rgba(255,200,60,0.96)'); // hot inner disk
    g.addColorStop(0.42,'rgba(255,100,10,0.80)'); // mid disk
    g.addColorStop(0.65,'rgba(180,30,0,0.50)');   // outer disk
    g.addColorStop(0.82,'rgba(80,10,0,0.22)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // Magnetic field strand noise
    for(let i=0;i<120;i++){
        const sx=(0.03+Math.random()*0.79)*W;
        ctx.fillStyle=`rgba(${200+Math.random()*55|0},${Math.random()*100|0},0,${0.15+Math.random()*0.4})`;
        ctx.fillRect(sx|0,0,2+Math.random()*4|0,H);
    }
    // Doppler brightening (approaching side is brighter)
    if(asymmetric){
        ctx.fillStyle='rgba(255,230,150,0.35)'; ctx.fillRect(0,0,W*0.5,H);
        ctx.fillStyle='rgba(0,0,0,0.20)'; ctx.fillRect(W*0.5,0,W*0.5,H);
    }
    return new THREE.CanvasTexture(cvs);
}


// ════════════════════════════════════════════════════════════════════════════
//  GALAXY 3D BUILDER — Ultra-Realistic Astrophysical Volumetric Engine
// ════════════════════════════════════════════════════════════════════════════

const _gxTexCache = {};
function getGalaxyTexture(type) {
    if (_gxTexCache[type]) return _gxTexCache[type];
    const cvs = document.createElement('canvas');
    cvs.width = 64; cvs.height = 64;
    const ctx = cvs.getContext('2d');
    const cx = 32, cy = 32;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);

    if (type === 'star') {
        // High dynamic range core with soft optical falloff
        grd.addColorStop(0, 'rgba(255,255,255,1)');
        grd.addColorStop(0.05, 'rgba(255,255,255,0.9)');
        grd.addColorStop(0.2, 'rgba(255,255,255,0.2)');
        grd.addColorStop(0.5, 'rgba(255,255,255,0.02)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
    } else if (type === 'gas') {
        // Soft volumetric cloud
        grd.addColorStop(0, 'rgba(255,255,255,0.4)');
        grd.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
    } else if (type === 'dust') {
        // Aggressive light-blocking soot
        grd.addColorStop(0, 'rgba(5,2,1,0.95)');
        grd.addColorStop(0.4, 'rgba(5,2,1,0.6)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
    }
    
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
    _gxTexCache[type] = new THREE.CanvasTexture(cvs);
    return _gxTexCache[type];
}

function buildGalaxy3D(data) {
    const group = new THREE.Group();
    const sub = data.subtype || 'spiral';
    const name = data.name || '';
    const R = data.size * 2.5; // True outer radius

    // --- ASTROPHYSICAL COLOR TEMPERATURES ---
    let bulgeColor = new THREE.Color(0xffeebb); // Pop II (Old, warm)
    let diskColor = new THREE.Color(0x77bbff);  // Pop I (Young, hot blue)
    let gasColor = new THREE.Color(0xff1155);   // Ionized Hydrogen (H II regions)
    let dustColor = new THREE.Color(0x020101);  // Carbon/Silicate dust
    
    // Identity Overrides
    if (sub === 'elliptical' || sub === 'lenticular') { diskColor.setHex(0xffddb4); gasColor.setHex(0x000000); }
    if (name === 'Sombrero Galaxy') { bulgeColor.setHex(0xffffff); diskColor.setHex(0xffffff); }
    if (name === 'Cigar Galaxy') { bulgeColor.setHex(0xffaa66); diskColor.setHex(0xff3311); gasColor.setHex(0xff0044); }
    if (name === 'M81 Bodes Galaxy') { bulgeColor.setHex(0xfff5cc); diskColor.setHex(0x88bbff); }
    if (name === 'Andromeda Galaxy') { bulgeColor.setHex(0xffddaa); diskColor.setHex(0x66aaff); }

    // --- DATA ARRAYS ---
    const sPos = [], sCol = []; // Stars (Disk + Bulge)
    const gPos = [], gCol = []; // HII Nebulae
    const dPos = [], dCol = []; // Dust Lanes

    // Extreme density for photorealism
    const totalParticles = name === 'IC 1101' ? 80000 : 50000;

    for (let i = 0; i < totalParticles; i++) {
        let x, y, z;
        let pCol = new THREE.Color();
        let type = 'star';

        // Physics variables
        const isBulge = Math.random() < 0.25; // 25% of mass in the central bulge
        let rad, theta, verticalScale;

        // --- 1. MORPHOLOGY & GRAVITY DISTRIBUTION ---
        if (name === 'Sombrero Galaxy') {
            if (isBulge) {
                // Giant spherical halo/bulge
                const phi = Math.acos(2 * Math.random() - 1);
                rad = Math.pow(Math.random(), 1.5) * R * 0.7;
                x = rad * Math.sin(phi) * Math.cos(Math.random() * Math.PI * 2);
                y = rad * Math.cos(phi) * 0.85; // Slightly oblate
                z = rad * Math.sin(phi) * Math.sin(Math.random() * Math.PI * 2);
                pCol.copy(bulgeColor);
            } else {
                // Razor-thin disk
                rad = Math.pow(Math.random(), 0.8) * R;
                theta = Math.random() * Math.PI * 2;
                x = rad * Math.cos(theta); z = rad * Math.sin(theta);
                y = (Math.random() - 0.5) * R * 0.01; // Insanely flat
                
                // Perfect, sharp dust ring blocking the bulge
                if (rad > R * 0.65 && rad < R * 0.88) {
                    if (Math.random() > 0.1) type = 'dust';
                }
                pCol.copy(diskColor);
            }
        } 
        else if (name === 'Cigar Galaxy') {
            // Chaotic Starburst
            rad = Math.pow(Math.random(), 1.2) * R;
            theta = Math.random() * Math.PI * 2;
            x = rad * Math.cos(theta) * 0.8; 
            z = rad * Math.sin(theta) * 0.3;
            y = (Math.random() - 0.5) * R * 0.25;
            
            // Violent galactic superwinds (perpendicular to disk)
            if (rad < R * 0.45 && Math.random() > 0.5) {
                y = (Math.random() - 0.5) * R * 2.0; // Shoot up/down
                x *= 0.15; z *= 0.15;
                type = 'gas';
            } else if (Math.random() > 0.75) type = 'dust';
            pCol.copy(diskColor);
        }
        else if (sub === 'elliptical' || sub === 'lenticular') {
            // Featureless spheroid
            const phi = Math.acos(2 * Math.random() - 1);
            rad = Math.pow(Math.random(), 1.5) * R;
            theta = Math.random() * Math.PI * 2;
            x = rad * Math.sin(phi) * Math.cos(theta);
            y = rad * Math.sin(phi) * Math.sin(theta) * (sub === 'lenticular' ? 0.2 : 0.95);
            z = rad * Math.cos(phi);
            pCol.copy(bulgeColor);
        }
        else if (sub === 'merger') {
            // Chaotic Collisions
            const offset = Math.random() > 0.5 ? R * 0.25 : -R * 0.25;
            rad = Math.pow(Math.random(), 1.5) * R;
            theta = Math.random() * Math.PI * 2;

            if (Math.random() > 0.7) { 
                // Sweeping Tidal Tails
                theta = (rad / R) * Math.PI * 3.0; // High winding
                x = rad * 1.8 * Math.cos(theta) + offset;
                z = rad * 1.8 * Math.sin(theta);
                y = (Math.random() - 0.5) * R * 0.1;
                if (Math.random() > 0.7) type = 'gas'; // Collision triggers starbursts
                pCol.copy(diskColor);
            } else { 
                // Dense Cores
                x = (rad * 0.5) * Math.cos(theta) + offset;
                z = (rad * 0.5) * Math.sin(theta);
                y = (Math.random() - 0.5) * R * 0.15;
                if (Math.random() > 0.8) type = 'dust';
                pCol.copy(bulgeColor);
            }
        }
        else {
            // --- TRUE SPIRAL GALAXIES (Density Wave Theory) ---
            if (isBulge) {
                // Central Bulge (Exponential dropoff)
                const phi = Math.acos(2 * Math.random() - 1);
                rad = Math.pow(Math.random(), 2.0) * R * 0.25;
                theta = Math.random() * Math.PI * 2;
                x = rad * Math.sin(phi) * Math.cos(theta);
                y = rad * Math.sin(phi) * Math.sin(theta) * 0.7; // Oblate spheroid
                z = rad * Math.cos(phi);
                pCol.copy(bulgeColor);
            } else {
                // The Disk & Spiral Arms
                rad = Math.pow(Math.random(), 1.2) * R;
                const arms = (name === 'Pinwheel Galaxy') ? 4 : (sub === 'barred' ? 2 : 2);
                const armOffset = (i % arms) * (Math.PI * 2 / arms);
                const twist = (name === 'Whirlpool Galaxy') ? 0.07 : 0.04;
                const spiralAng = rad * (twist / (data.size / 50)); 
                
                // Clamp stars into the spiral density waves
                let scatter = (Math.random() - 0.5) * R * (name === 'Triangulum Galaxy' ? 0.6 : 0.25);
                
                // Add a Bar if necessary
                if (sub === 'barred' && rad < R * 0.3) {
                    scatter = (Math.random() - 0.5) * R * 0.05;
                    theta = Math.random() > 0.5 ? 0 : Math.PI; 
                    rad *= 1.5; 
                } else {
                    theta = armOffset + spiralAng + (scatter / Math.max(0.1, rad));
                }
                
                // Vertical thickness follows an exponential decay profile (thinner at edges)
                verticalScale = Math.exp(-rad / (R * 0.4)) * (R * 0.1);
                y = (Math.random() - 0.5) * verticalScale;

                x = rad * Math.cos(theta); 
                z = rad * Math.sin(theta);

                // --- DUST LANES (Midplane concentration, inner edge of arms) ---
                // Dust is heaviest exactly at y=0 and tracks the inner side of the spiral arm
                if (rad > R * 0.1 && Math.abs(y) < verticalScale * 0.3 && Math.random() < 0.22) {
                    theta -= 0.15; // Shift to inner edge of arm
                    x = rad * Math.cos(theta); z = rad * Math.sin(theta);
                    type = 'dust';
                }
                // --- HII STAR-FORMING REGIONS (Knots in the arms) ---
                else if (rad > R * 0.15 && Math.abs(scatter) < R * 0.05 && Math.random() < 0.04) {
                    type = 'gas';
                }

                // Blend from yellow bulge out to blue disk
                const mixRatio = Math.max(0, 1 - (rad / R));
                pCol.copy(diskColor).lerp(bulgeColor, Math.pow(mixRatio, 2.0));
            }
        }

        // --- COLOR APPLICATION ---
        if (type === 'dust') {
            dPos.push(x, y, z); dCol.push(dustColor.r, dustColor.g, dustColor.b);
        } else if (type === 'gas') {
            // Neon pinks/cyans for ionized gases
            pCol.copy(gasColor).lerp(new THREE.Color(0xffffff), Math.random() * 0.3);
            gPos.push(x, y, z); gCol.push(pCol.r, pCol.g, pCol.b);
        } else {
            // Stars: Add natural optical variance (some brighter, some dimmer)
            const v = 0.5 + Math.random() * 0.8;
            sPos.push(x, y, z); sCol.push(pCol.r * v, pCol.g * v, pCol.b * v);
        }
    }

    // --- MATERIAL & GEOMETRY CREATION ---
    function createLayer(posArr, colArr, size, mapType, blendMode, opacity) {
        if (posArr.length === 0) return null;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3));
        const mat = new THREE.PointsMaterial({
            size: size,
            map: getGalaxyTexture(mapType),
            vertexColors: true,
            transparent: true,
            blending: blendMode,
            depthWrite: false,
            opacity: opacity
        });
        return new THREE.Points(geo, mat);
    }

    // Layer 1: HII Regions (Soft, glowing pink knots, Additive)
    const gasLayer = createLayer(gPos, gCol, data.size * 0.45, 'gas', THREE.AdditiveBlending, 0.7);
    if (gasLayer) group.add(gasLayer);

    // Layer 2: Stellar Populations (Tiny, sharp, Additive)
    // Using a tiny size so it looks like billions of individual stars rather than a blur
    const starLayer = createLayer(sPos, sCol, data.size * 0.08, 'star', THREE.AdditiveBlending, 1.0);
    if (starLayer) group.add(starLayer);

    // Layer 3: Physical Dark Dust (Normal Blending - Physically occludes the light behind it)
    const dustLayer = createLayer(dPos, dCol, data.size * 0.6, 'dust', THREE.NormalBlending, 0.85);
    if (dustLayer) group.add(dustLayer);

    // --- BLINDING NUCLEAR CORE ---
    // A brilliant localized glow right at the supermassive black hole
    const coreMat = new THREE.SpriteMaterial({
        map: getGalaxyTexture('star'),
        color: bulgeColor,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.95
    });
    const coreSprite = new THREE.Sprite(coreMat);
    coreSprite.scale.set(data.size * 1.8, data.size * 1.8, 1);
    group.add(coreSprite);

    // --- M87 RELATIVISTIC JET (Extragalactic particle beam) ---
    if (name === 'M87 Galaxy') {
        const jetGeo = new THREE.ConeGeometry(data.size * 0.04, data.size * 2.5, 16);
        const jetMat = new THREE.MeshBasicMaterial({ color: 0x4499ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
        const jet = new THREE.Mesh(jetGeo, jetMat);
        jet.position.set(data.size * 0.9, data.size * 0.45, 0);
        jet.rotation.z = -Math.PI / 3.2;
        group.add(jet);
        
        // Synchrotron radiation glow wrapper around the jet
        const jetGlow = new THREE.Mesh(new THREE.ConeGeometry(data.size * 0.12, data.size * 2.6, 16), new THREE.MeshBasicMaterial({ color: 0x1133ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending }));
        jet.add(jetGlow);
    }

    // --- COSMIC TILT & TUMBLE ---
    group.rotation.x = (Math.random() - 0.5) * Math.PI * 0.4;
    group.rotation.y = Math.random() * Math.PI;
    group.rotation.z = (Math.random() - 0.5) * Math.PI * 0.2;
    
    // Force specific viewing angles for famous galaxies
    if (sub === 'edge_on' || name === 'Sombrero Galaxy') group.rotation.x = Math.PI / 2 - 0.05; // Perfect edge-on
    if (name === 'Pinwheel Galaxy' || name === 'Whirlpool Galaxy') group.rotation.x = 0.2; // Face-on showcase

    // Black hole hitbox hook (invisible)
    if(data.stats && data.stats['Central Black Hole']){
        const bhSpr = new THREE.Sprite(new THREE.SpriteMaterial({color:0x000000,transparent:true,opacity:0}));
        bhSpr.scale.setScalar(data.size*0.02);
        group.add(bhSpr);
    }

    group.userData.isTumbler = true; // Engine handles rotation automatically
    return group;
}

// ════════════════════════════════════════════════════════════════════════════
//  SPACECRAFT 3D BUILDER — Ultra-Realistic Procedural Textures & Models
// ════════════════════════════════════════════════════════════════════════════

// ── Procedural texture generators ─────────────────────────────────────────
function makeSolarPanelTexture(cols=8, rows=4) {
    const W=512,H=256,cvs=document.createElement('canvas'); cvs.width=W;cvs.height=H;
    const ctx=cvs.getContext('2d');
    // Dark blue cell base
    const g=ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#0a1030'); g.addColorStop(0.5,'#0c1540'); g.addColorStop(1,'#0a1030');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // Grid of solar cells
    const cellW=W/cols, cellH=H/rows;
    for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){
        const x=c*cellW+2,y=r*cellH+2,w=cellW-4,h=cellH-4;
        const cg=ctx.createLinearGradient(x,y,x+w,y+h);
        cg.addColorStop(0,'#1a2a6a'); cg.addColorStop(0.5,'#2244aa'); cg.addColorStop(1,'#1a2a5a');
        ctx.fillStyle=cg; ctx.fillRect(x,y,w,h);
        // Cell border
        ctx.strokeStyle='rgba(100,140,255,0.3)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
        // Glint
        const sg=ctx.createLinearGradient(x,y,x+w,y+h);
        sg.addColorStop(0,'rgba(150,180,255,0.15)'); sg.addColorStop(0.5,'rgba(255,255,255,0)'); sg.addColorStop(1,'rgba(100,130,255,0.08)');
        ctx.fillStyle=sg; ctx.fillRect(x,y,w,h);
    }}
    // Bus bars
    ctx.strokeStyle='rgba(200,210,255,0.4)'; ctx.lineWidth=1.5;
    for(let c=0;c<=cols;c++){ctx.beginPath();ctx.moveTo(c*cellW,0);ctx.lineTo(c*cellW,H);ctx.stroke();}
    for(let r=0;r<=rows;r++){ctx.beginPath();ctx.moveTo(0,r*cellH);ctx.lineTo(W,r*cellH);ctx.stroke();}
    return new THREE.CanvasTexture(cvs);
}

function makeGoldFoilTexture() {
    const S=256,cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d');
    const g=ctx.createLinearGradient(0,0,S,S);
    g.addColorStop(0,'#c8a030'); g.addColorStop(0.3,'#ddb040'); g.addColorStop(0.5,'#e8c050');
    g.addColorStop(0.7,'#d8a830'); g.addColorStop(1,'#b89020');
    ctx.fillStyle=g; ctx.fillRect(0,0,S,S);
    // Crinkle pattern
    for(let i=0;i<2000;i++){
        const x=Math.random()*S,y=Math.random()*S,a=Math.random()*0.15;
        ctx.fillStyle=`rgba(${Math.random()>0.5?255:100},${Math.random()>0.5?200:80},${Math.random()>0.5?60:20},${a.toFixed(2)})`;
        ctx.fillRect(x|0,y|0,2+Math.random()*4|0,1+Math.random()*2|0);
    }
    return new THREE.CanvasTexture(cvs);
}

function makeMetalBrushTexture(baseColor=0x888899) {
    const S=256,cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d');
    const c=new THREE.Color(baseColor);
    ctx.fillStyle=`rgb(${c.r*255|0},${c.g*255|0},${c.b*255|0})`;
    ctx.fillRect(0,0,S,S);
    // Brushed metal lines
    for(let i=0;i<3000;i++){
        const y=Math.random()*S, x=Math.random()*S, len=10+Math.random()*40;
        const b=(Math.random()-0.5)*0.08;
        ctx.fillStyle=`rgba(${b>0?255:0},${b>0?255:0},${b>0?255:0},${Math.abs(b).toFixed(2)})`;
        ctx.fillRect(x|0,y|0,len|0,1);
    }
    return new THREE.CanvasTexture(cvs);
}

function makeAntennaDishTexture() {
    const S=256,cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d');
    const g=ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
    g.addColorStop(0,'#e8e8f0'); g.addColorStop(0.6,'#c0c4cc'); g.addColorStop(1,'#888c96');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(S/2,S/2,S/2,0,Math.PI*2); ctx.fill();
    // Concentric rings
    ctx.strokeStyle='rgba(100,104,110,0.3)'; ctx.lineWidth=1;
    for(let r=20;r<S/2;r+=15){ctx.beginPath();ctx.arc(S/2,S/2,r,0,Math.PI*2);ctx.stroke();}
    return new THREE.CanvasTexture(cvs);
}

function makeRocketBodyTexture() {
    const W=256,H=512,cvs=document.createElement('canvas'); cvs.width=W;cvs.height=H;
    const ctx=cvs.getContext('2d');
    const g=ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,'#d0d4da'); g.addColorStop(0.5,'#eef0f4'); g.addColorStop(1,'#c8ccd2');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // Rivet lines
    ctx.strokeStyle='rgba(100,105,110,0.2)'; ctx.lineWidth=1;
    for(let y=20;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    // Flag / stripe
    ctx.fillStyle='#1a3a8a'; ctx.fillRect(0,H*0.35,W,H*0.08);
    ctx.fillStyle='#cc2222'; ctx.fillRect(0,H*0.43,W,H*0.04);
    return new THREE.CanvasTexture(cvs);
}

function makeEngineNozzleTexture() {
    const S=128,cvs=document.createElement('canvas'); cvs.width=cvs.height=S;
    const ctx=cvs.getContext('2d');
    const g=ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
    g.addColorStop(0,'#1a1a1a'); g.addColorStop(0.4,'#333'); g.addColorStop(0.7,'#555'); g.addColorStop(1,'#222');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(S/2,S/2,S/2,0,Math.PI*2); ctx.fill();
    // Inner ring detail
    ctx.strokeStyle='rgba(180,180,180,0.3)'; ctx.lineWidth=2;
    for(let r=15;r<S/2;r+=10){ctx.beginPath();ctx.arc(S/2,S/2,r,0,Math.PI*2);ctx.stroke();}
    return new THREE.CanvasTexture(cvs);
}

// ── Shared texture cache ──────────────────────────────────────────────────
const _texCache = {};
function getTex(key, fn) { if(!_texCache[key]) _texCache[key]=fn(); return _texCache[key]; }

// ── Solar panel sun-tracking hook registry ────────────────────────────────
const _solarTrackers = [];
const _antennaTrackers = [];

function buildSpacecraft3D(data) {
    const S = data.size;
    const group = new THREE.Group();

    // ── Enhanced shared materials with procedural textures ─────────────
    const metalMat = new THREE.MeshStandardMaterial({
        color: 0xc8cdd4, roughness: 0.25, metalness: 0.95,
        map: getTex('metal', () => makeMetalBrushTexture(0x999999))
    });
    const goldFoil = new THREE.MeshStandardMaterial({
        color: 0xd4a020, roughness: 0.2, metalness: 0.92,
        map: getTex('goldfoil', makeGoldFoilTexture)
    });
    const panelMat = new THREE.MeshStandardMaterial({
        color: 0x2244aa, roughness: 0.15, metalness: 0.1,
        map: getTex('solarpanel', () => makeSolarPanelTexture(8,4)),
        emissive: 0x050a20, emissiveIntensity: 0.3
    });
    const darkMetal = new THREE.MeshStandardMaterial({
        color: 0x303540, roughness: 0.35, metalness: 0.88,
        map: getTex('darkmetal', () => makeMetalBrushTexture(0x404550))
    });
    const whiteMat = new THREE.MeshStandardMaterial({
        color: 0xf0f4f8, roughness: 0.2, metalness: 0.3
    });
    const carbonMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, roughness: 0.6, metalness: 0.4
    });
    const copperMat = new THREE.MeshStandardMaterial({
        color: 0xb87333, roughness: 0.3, metalness: 0.85
    });
    const dishMat = new THREE.MeshStandardMaterial({
        color: 0xd0d4dc, roughness: 0.2, metalness: 0.7,
        map: getTex('dish', makeAntennaDishTexture)
    });
    const rocketMat = new THREE.MeshStandardMaterial({
        color: 0xe0e4e8, roughness: 0.3, metalness: 0.6,
        map: getTex('rocket', makeRocketBodyTexture)
    });
    const engineMat = new THREE.MeshStandardMaterial({
        color: 0x444444, roughness: 0.4, metalness: 0.8,
        map: getTex('engine', makeEngineNozzleTexture)
    });

    // ── Helper: create solar panel with sun-tracking pivot ────────────
    function addSolarPanel(yPos, zPos, width, height, track=true) {
        const pivot = new THREE.Group();
        pivot.position.set(0, yPos, zPos);

        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.04*S, height),
            panelMat
        );
        pivot.add(panel);

        // Panel frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(width*1.02, 0.06*S, height*1.02),
            darkMetal
        );
        frame.position.y = -0.02*S;
        pivot.add(frame);

        // Grid lines on panel
        const cols = Math.max(2, Math.floor(width / (0.8*S)));
        const rows = Math.max(2, Math.floor(height / (0.8*S)));
        const gridMat = new THREE.MeshBasicMaterial({ color: 0x3355bb, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        for(let c=0; c<=cols; c++){
            const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.02*S, height*0.95), gridMat);
            gl.position.set(-width/2 + c*(width/cols), 0.03*S, 0);
            gl.rotation.x = -Math.PI/2;
            pivot.add(gl);
        }
        for(let r=0; r<=rows; r++){
            const gl = new THREE.Mesh(new THREE.PlaneGeometry(width*0.95, 0.02*S), gridMat);
            gl.position.set(0, 0.03*S, -height/2 + r*(height/rows));
            gl.rotation.x = -Math.PI/2;
            pivot.add(gl);
        }

        // Deployment mast
        const mast = new THREE.Mesh(
            new THREE.BoxGeometry(0.06*S, 0.06*S, 0.4*S),
            metalMat
        );
        mast.position.set(width/2 + 0.1*S, 0, 0);
        pivot.add(mast);

        group.add(pivot);
        if(track) _solarTrackers.push(pivot);
        return pivot;
    }

    // ── Helper: add high-gain antenna ─────────────────────────────────
    function addAntenna(yPos, zPos, radius, track=true) {
        const pivot = new THREE.Group();
        pivot.position.set(0, yPos, zPos);

        // Dish
        const dish = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI*2, 0, Math.PI/2),
            dishMat
        );
        dish.rotation.x = Math.PI;
        pivot.add(dish);

        // Feed horn
        const feed = new THREE.Mesh(
            new THREE.CylinderGeometry(radius*0.08, radius*0.08, radius*0.6, 8),
            metalMat
        );
        feed.position.y = radius*0.3;
        pivot.add(feed);

        // Support struts
        for(let a=0; a<3; a++){
            const ang = a * Math.PI*2/3;
            const strut = new THREE.Mesh(
                new THREE.CylinderGeometry(radius*0.02, radius*0.02, radius*0.5, 4),
                darkMetal
            );
            strut.position.set(Math.cos(ang)*radius*0.3, radius*0.15, Math.sin(ang)*radius*0.3);
            strut.rotation.z = Math.cos(ang)*0.3;
            strut.rotation.x = Math.sin(ang)*0.3;
            pivot.add(strut);
        }

        group.add(pivot);
        if(track) _antennaTrackers.push(pivot);
        return pivot;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  INDIVIDUAL SPACECRAFT MODELS
    // ═══════════════════════════════════════════════════════════════════

    if (data.name === 'ISS' || data.name === 'Gateway') {
        // ── ISS: Integrated Truss + Modules + Solar Arrays ──────────
        const truss = new THREE.Mesh(new THREE.BoxGeometry(S*20, S*0.35, S*0.35), metalMat);
        group.add(truss);

        // Cross-brace diagonals
        for (let i = -8; i <= 8; i += 2) {
            const brace = new THREE.Mesh(new THREE.BoxGeometry(S*0.08, S*0.6, S*0.08), darkMetal);
            brace.position.set(i * S, 0, 0);
            group.add(brace);
        }

        // Habitation modules
        const modPositions = [-3, -1.5, 0, 1.5, 3];
        modPositions.forEach((xOff, mi) => {
            const modLen = S * (mi === 2 ? 3.5 : 2.8);
            const mod = new THREE.Mesh(
                new THREE.CylinderGeometry(S * 0.55, S * 0.55, modLen, 20),
                mi % 2 === 0 ? metalMat : goldFoil
            );
            mod.rotation.z = Math.PI / 2;
            mod.position.set(xOff * S, 0, S * 0.5);
            group.add(mod);
            const node = new THREE.Mesh(new THREE.SphereGeometry(S * 0.38, 14, 14), metalMat);
            node.position.copy(mod.position);
            group.add(node);
        });

        // Solar Arrays — 4 pairs with sun-tracking
        [-9,-6,6,9].forEach(xPos => {
            [-1,1].forEach(yDir => {
                const mast = new THREE.Mesh(new THREE.BoxGeometry(S*0.12, S*2.8, S*0.12), metalMat);
                mast.position.set(xPos*S, yDir*S*1.5, 0);
                group.add(mast);
                const pivot = addSolarPanel(yDir*S*3.2, 0, S*5.5, S*2.2, true);
                pivot.position.x = xPos*S;
            });
        });

        // Radiator panels
        [-4,0,4].forEach(xPos => {
            const rad = new THREE.Mesh(new THREE.BoxGeometry(S*2.2, S*0.05, S*1.8), whiteMat);
            rad.position.set(xPos*S, 0, -S*1.2);
            group.add(rad);
        });

        // Soyuz docked
        const soyuz = new THREE.Mesh(new THREE.CylinderGeometry(S*0.3, S*0.38, S*2, 12), darkMetal);
        soyuz.position.set(0, S*1.5, S*0.5);
        group.add(soyuz);

        group.rotation.x = 0.2;

    } else if (data.name === 'Hubble') {
        // ── Hubble Space Telescope ───────────────────────────────────
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(S*1.1, S*1.1, S*5.5, 24), metalMat);
        group.add(tube);

        // Gold thermal foil bands
        [[-S*1.5, S*0.8], [S*1.5, S*0.8], [0, S*0.5]].forEach(([y, h]) => {
            const band = new THREE.Mesh(new THREE.CylinderGeometry(S*1.12, S*1.12, h, 24), goldFoil);
            band.position.y = y;
            group.add(band);
        });

        // Aperture door (front)
        const aperture = new THREE.Mesh(
            new THREE.RingGeometry(S*0.35, S*1.1, 24),
            new THREE.MeshBasicMaterial({ color: 0x000508, side: THREE.DoubleSide })
        );
        aperture.position.y = S*2.75; aperture.rotation.x = Math.PI/2;
        group.add(aperture);

        // Spider vanes
        for (let v = 0; v < 4; v++) {
            const vane = new THREE.Mesh(new THREE.BoxGeometry(S*0.06, S*0.9, S*0.04), darkMetal);
            vane.rotation.y = v*Math.PI/2;
            vane.position.set(Math.cos(v*Math.PI/2)*S*0.5, S*2.75, Math.sin(v*Math.PI/2)*S*0.5);
            group.add(vane);
        }

        // Secondary mirror
        const secMir = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.22, S*0.22, S*0.12, 14),
            new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.98, roughness: 0.05 })
        );
        secMir.position.y = S*2.75;
        group.add(secMir);

        // Solar panels — 2 wings with tracking
        [-1,1].forEach(side => {
            const pivot = addSolarPanel(S*0.5, 0, S*1.6, S*4.2, true);
            pivot.position.x = side*S*1.9;
        });

        // High-gain antennas
        addAntenna(-S*2.5, S*0.8, S*0.6, true);
        addAntenna(-S*2.5, -S*0.8, S*0.6, true);

        // Aft instrument bay
        const aftBay = new THREE.Mesh(new THREE.BoxGeometry(S*1.2, S*1.0, S*1.4), darkMetal);
        aftBay.position.y = -S*3.2;
        group.add(aftBay);

        group.rotation.z = 0.3;

    } else if (data.name === 'JWST') {
        // ── James Webb Space Telescope ───────────────────────────────
        const hexR = S*0.72;
        const hexPositions = [
            [0,0], [hexR*Math.sqrt(3),0], [-hexR*Math.sqrt(3),0],
            [hexR*Math.sqrt(3)*0.5, hexR*1.5], [-hexR*Math.sqrt(3)*0.5, hexR*1.5],
            [hexR*Math.sqrt(3)*0.5, -hexR*1.5], [-hexR*Math.sqrt(3)*0.5, -hexR*1.5],
            [hexR*Math.sqrt(3)*1.5, hexR*1.5], [-hexR*Math.sqrt(3)*1.5, hexR*1.5],
            [hexR*Math.sqrt(3)*1.5,-hexR*1.5], [-hexR*Math.sqrt(3)*1.5,-hexR*1.5],
            [hexR*Math.sqrt(3)*2,0], [-hexR*Math.sqrt(3)*2,0],
            [hexR*Math.sqrt(3)*2,hexR*3], [-hexR*Math.sqrt(3)*2,hexR*3],
            [hexR*Math.sqrt(3)*2,-hexR*3], [-hexR*Math.sqrt(3)*2,-hexR*3],
            [0, hexR*3],
        ];
        const goldMirrorMat = new THREE.MeshStandardMaterial({
            color: 0xdda820, metalness: 0.98, roughness: 0.06,
            emissive: 0x220800, emissiveIntensity: 0.15
        });
        const hexShape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const a = Math.PI/6 + i*Math.PI/3;
            const hx = hexR*0.94*Math.cos(a), hy = hexR*0.94*Math.sin(a);
            i === 0 ? hexShape.moveTo(hx,hy) : hexShape.lineTo(hx,hy);
        }
        hexShape.closePath();
        const hexGeo = new THREE.ExtrudeGeometry(hexShape, { depth: S*0.08, bevelEnabled: false });

        hexPositions.slice(0,18).forEach(([px,py]) => {
            const seg = new THREE.Mesh(hexGeo, goldMirrorMat);
            seg.position.set(px, py, 0);
            group.add(seg);
            const frame = new THREE.Mesh(hexGeo, darkMetal);
            frame.scale.setScalar(1.06);
            frame.position.set(px, py, -S*0.06);
            group.add(frame);
        });

        // Secondary mirror support
        const secSupport = new THREE.Mesh(new THREE.CylinderGeometry(S*0.12, S*0.12, S*5.5, 10), metalMat);
        secSupport.rotation.x = Math.PI/2; secSupport.position.z = S*3.2;
        group.add(secSupport);
        const secMirror = new THREE.Mesh(new THREE.CircleGeometry(S*0.55, 14), goldMirrorMat);
        secMirror.position.z = S*5.9;
        group.add(secMirror);

        // Tripod spiders
        for (let v = 0; v < 3; v++) {
            const ang = v*(Math.PI*2/3);
            const strut = new THREE.Mesh(new THREE.BoxGeometry(S*0.08, S*0.08, S*5.5), metalMat);
            strut.position.set(Math.cos(ang)*S*1.8, Math.sin(ang)*S*1.8, S*2.8);
            strut.lookAt(secMirror.position);
            group.add(strut);
        }

        // Instrument module
        const instBox = new THREE.Mesh(new THREE.BoxGeometry(S*3.8, S*2.8, S*1.2), goldFoil);
        instBox.position.z = -S*1.0;
        group.add(instBox);

        // Sunshield — 5 Kapton layers
        for (let si = 0; si < 5; si++) {
            const scale = 1.0 + si*0.08;
            const shield = new THREE.Mesh(
                new THREE.PlaneGeometry(S*14*scale, S*8*scale),
                new THREE.MeshBasicMaterial({
                    color: si===0 ? 0xffd04a : 0xffee88,
                    transparent: true, opacity: 0.12-si*0.015,
                    side: THREE.DoubleSide, depthWrite: false
                })
            );
            shield.position.z = -S*(1.6+si*0.5);
            group.add(shield);
        }

        group.rotation.x = 0.3; group.rotation.z = 0.15;

    } else if (data.name === 'Voyager 1' || data.name === 'Voyager 2') {
        // ── Voyager Probe ────────────────────────────────────────────
        // Main bus (hexagonal)
        const bus = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.8, S*0.8, S*1.2, 8),
            metalMat
        );
        group.add(bus);

        // High-gain antenna (large dish)
        addAntenna(0, 0, S*1.5, true);

        // Golden record (golden circle on side)
        const record = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.5, S*0.5, S*0.05, 20),
            goldFoil
        );
        record.rotation.x = Math.PI/2;
        record.position.set(0, 0, S*0.85);
        group.add(record);

        // RTG boom (radioisotope thermoelectric generator)
        const rtgBoom = new THREE.Mesh(new THREE.BoxGeometry(S*0.08, S*0.08, S*3), darkMetal);
        rtgBoom.position.set(S*0.9, 0, -S*1.5);
        rtgBoom.rotation.z = 0.3;
        group.add(rtgBoom);
        // RTG cylinder at end
        const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.15, S*0.15, S*0.6, 8),
            new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.7 })
        );
        rtg.position.set(S*1.1, 0, -S*2.8);
        rtg.rotation.x = Math.PI/2;
        group.add(rtg);

        // Science boom
        const sciBoom = new THREE.Mesh(new THREE.BoxGeometry(S*0.04, S*0.04, S*2), metalMat);
        sciBoom.position.set(-S*0.7, S*0.3, -S*1);
        sciBoom.rotation.z = -0.4;
        group.add(sciBoom);

        group.rotation.y = 0.5;

    } else if (data.name === 'New Horizons') {
        // ── New Horizons ─────────────────────────────────────────────
        // Triangular body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*1.8, S*0.8, S*1.8),
            darkMetal
        );
        group.add(body);

        // RTG (cylinder on side)
        const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.2, S*0.2, S*1.2, 10),
            new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.8 })
        );
        rtg.position.set(S*1.1, 0, 0);
        rtg.rotation.z = Math.PI/2;
        group.add(rtg);

        // High-gain antenna
        addAntenna(0, 0, S*1.0, true);

        // Solar panels (small — RTG powered but has backup)
        addSolarPanel(S*0.5, 0, S*1.5, S*0.8, true);

        group.rotation.x = 0.2;

    } else if (data.name === 'Cassini') {
        // ── Cassini-Huygens ──────────────────────────────────────────
        // Main bus
        const bus = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.8, S*0.8, S*2.5, 12),
            metalMat
        );
        group.add(bus);

        // High-gain antenna (large)
        addAntenna(0, S*1.5, S*1.8, true);

        // Huygens probe (cone on side)
        const huygens = new THREE.Mesh(
            new THREE.ConeGeometry(S*0.4, S*0.8, 12),
            goldFoil
        );
        huygens.position.set(S*0.9, 0, 0);
        huygens.rotation.z = -Math.PI/2;
        group.add(huygens);

        // RTG booms
        [-1,1].forEach(side => {
            const boom = new THREE.Mesh(new THREE.BoxGeometry(S*0.06, S*0.06, S*2.5), darkMetal);
            boom.position.set(side*S*0.6, 0, -S*2);
            boom.rotation.z = side*0.3;
            group.add(boom);
        });

        // Engine bell
        const engine = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.3, S*0.5, S*0.6, 12),
            engineMat
        );
        engine.position.y = -S*1.5;
        engine.rotation.x = Math.PI/2;
        group.add(engine);

        group.rotation.z = 0.2;

    } else if (data.name === 'Juno') {
        // ── Juno ─────────────────────────────────────────────────────
        // Central body (hexagonal)
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.9, S*0.9, S*1.2, 6),
            metalMat
        );
        group.add(body);

        // 3 large solar panel wings (L-shaped, 3 panels each)
        for(let a=0; a<3; a++){
            const ang = a * Math.PI*2/3;
            const pivot = new THREE.Group();
            pivot.rotation.y = ang;
            for(let p=0; p<3; p++){
                const panel = new THREE.Mesh(
                    new THREE.BoxGeometry(S*1.2, 0.03*S, S*2.5),
                    panelMat
                );
                panel.position.set(S*1.5 + p*S*1.3, 0, 0);
                pivot.add(panel);
            }
            group.add(pivot);
            _solarTrackers.push(pivot);
        }

        // MAG boom (magnetometer)
        const magBoom = new THREE.Mesh(new THREE.BoxGeometry(S*0.04, S*0.04, S*3), darkMetal);
        magBoom.position.set(0, S*0.8, S*2);
        group.add(magBoom);

        group.rotation.x = 0.3;

    } else if (data.name === 'Galileo') {
        // ── Galileo ───────────────────────────────────────────────────
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.7, S*0.7, S*2, 10),
            metalMat
        );
        group.add(body);

        // High-gain antenna (umbrella-like, partially deployed)
        addAntenna(0, S*1.2, S*1.2, true);

        // Low-gain antenna
        const lga = new THREE.Mesh(
            new THREE.ConeGeometry(S*0.1, S*0.8, 8),
            metalMat
        );
        lga.position.y = -S*1.5;
        group.add(lga);

        // RTG booms
        [-1,1].forEach(side => {
            const boom = new THREE.Mesh(new THREE.BoxGeometry(S*0.05, S*0.05, S*2.5), darkMetal);
            boom.position.set(side*S*0.5, 0, -S*1.5);
            boom.rotation.z = side*0.4;
            group.add(boom);
            const rtg = new THREE.Mesh(
                new THREE.CylinderGeometry(S*0.12, S*0.12, S*0.5, 8),
                darkMetal
            );
            rtg.position.set(side*S*0.8, 0, -S*2.8);
            rtg.rotation.x = Math.PI/2;
            group.add(rtg);
        });

        // Solar panels (small — RTG primary)
        addSolarPanel(S*0.4, 0, S*1.2, S*1.5, true);

        group.rotation.z = 0.25;

    } else if (data.name === 'Parker Solar Probe') {
        // ── Parker Solar Probe ────────────────────────────────────────
        // Heat shield (white, large)
        const shield = new THREE.Mesh(
            new THREE.CylinderGeometry(S*1.2, S*1.2, S*0.15, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.2, emissive: 0x331100, emissiveIntensity: 0.2 })
        );
        shield.rotation.x = Math.PI/2;
        shield.position.z = S*0.8;
        group.add(shield);

        // Body behind shield
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.5, S*0.6, S*1.5, 10),
            darkMetal
        );
        body.position.z = -S*0.3;
        group.add(body);

        // Solar panels (retractable, small)
        addSolarPanel(S*0.3, 0, S*0.8, S*1.0, true);

        // Antenna
        addAntenna(0, -S*0.5, S*0.4, true);

        group.rotation.x = 0.15;

    } else if (data.name === 'OSIRIS-REx') {
        // ── OSIRIS-REx ───────────────────────────────────────────────
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*1.5, S*1.0, S*1.5),
            darkMetal
        );
        group.add(body);

        // Solar panels (2 large wings)
        [-1,1].forEach(side => {
            const pivot = addSolarPanel(0, 0, S*1.5, S*3, true);
            pivot.position.x = side*S*1.2;
        });

        // TAGSAM arm (sample collector)
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.08, S*0.06, S*1.5, 8),
            metalMat
        );
        arm.position.set(0, -S*0.8, S*0.5);
        arm.rotation.x = 0.3;
        group.add(arm);

        // Sample return capsule (gold)
        const capsule = new THREE.Mesh(
            new THREE.ConeGeometry(S*0.3, S*0.5, 10),
            goldFoil
        );
        capsule.position.set(0, -S*0.5, 0);
        group.add(capsule);

        group.rotation.z = 0.2;

    } else if (data.name === 'InSight') {
        // ── InSight Mars Lander ───────────────────────────────────────
        // Hexagonal deck
        const deck = new THREE.Mesh(
            new THREE.CylinderGeometry(S*1.2, S*1.4, S*0.4, 6),
            metalMat
        );
        group.add(deck);

        // Solar panels (2 circular)
        [-1,1].forEach(side => {
            const panel = new THREE.Mesh(
                new THREE.CylinderGeometry(S*1.0, S*1.0, 0.03*S, 16),
                panelMat
            );
            panel.position.set(side*S*1.3, 0.1*S, 0);
            panel.rotation.x = Math.PI/2;
            group.add(panel);
        });

        // Robotic arm
        const arm1 = new THREE.Mesh(new THREE.BoxGeometry(S*0.06, S*0.06, S*1.5), metalMat);
        arm1.position.set(S*0.5, S*0.3, S*0.5);
        arm1.rotation.x = -0.3;
        group.add(arm1);

        // Seismometer (under dome)
        const seismoDome = new THREE.Mesh(
            new THREE.SphereGeometry(S*0.3, 12, 8, 0, Math.PI*2, 0, Math.PI/2),
            whiteMat
        );
        seismoDome.position.set(-S*0.4, S*0.2, S*0.3);
        group.add(seismoDome);

        // Heat probe (mole)
        const mole = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.05, S*0.03, S*0.8, 6),
            copperMat
        );
        mole.position.set(S*0.2, -S*0.2, S*0.6);
        group.add(mole);

        group.rotation.x = 0.15;

    } else if (data.name === 'Curiosity' || data.name === 'Perseverance') {
        // ── Mars Rover (Curiosity / Perseverance) ─────────────────────
        // Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*1.5, S*0.8, S*1.2),
            metalMat
        );
        body.position.y = S*0.5;
        group.add(body);

        // Mast (camera tower)
        const mast = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.06, S*0.06, S*1.5, 8),
            darkMetal
        );
        mast.position.set(S*0.3, S*1.3, -S*0.2);
        group.add(mast);

        // Camera head (mastcam)
        const cam = new THREE.Mesh(
            new THREE.BoxGeometry(S*0.3, S*0.2, S*0.4),
            darkMetal
        );
        cam.position.set(S*0.3, S*2.1, -S*0.2);
        group.add(cam);
        // Camera lenses
        [-1,1].forEach(side => {
            const lens = new THREE.Mesh(
                new THREE.CylinderGeometry(S*0.06, S*0.06, S*0.1, 8),
                new THREE.MeshBasicMaterial({ color: 0x111111 })
            );
            lens.position.set(S*0.3 + side*S*0.08, S*2.1, -S*0.4);
            lens.rotation.x = Math.PI/2;
            group.add(lens);
        });

        // Robotic arm
        const arm1 = new THREE.Mesh(new THREE.BoxGeometry(S*0.08, S*0.08, S*1.2), metalMat);
        arm1.position.set(S*0.8, S*0.8, S*0.5);
        arm1.rotation.x = -0.4;
        group.add(arm1);
        const arm2 = new THREE.Mesh(new THREE.BoxGeometry(S*0.06, S*0.06, S*0.8), metalMat);
        arm2.position.set(S*0.8, S*0.5, S*1.3);
        arm2.rotation.x = 0.6;
        group.add(arm2);

        // Wheels (6)
        [[-0.6,0.6],[-0.6,-0.6],[0.6,0.6],[0.6,-0.6],[0,0.7],[0,-0.7]].forEach(([x,z]) => {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(S*0.25, S*0.25, S*0.12, 12),
                darkMetal
            );
            wheel.position.set(S*x, 0, S*z);
            wheel.rotation.z = Math.PI/2;
            group.add(wheel);
        });

        // RTG (Perseverance) or RTG box
        const rtg = new THREE.Mesh(
            new THREE.BoxGeometry(S*0.4, S*0.3, S*0.5),
            darkMetal
        );
        rtg.position.set(-S*0.5, S*0.5, -S*0.4);
        group.add(rtg);

        // Antenna (high-gain)
        addAntenna(S*0.9, -S*0.3, S*0.3, true);

        // Sample tubes (Perseverance)
        if(data.name === 'Perseverance') {
            for(let i=0;i<3;i++){
                const tube = new THREE.Mesh(
                    new THREE.CylinderGeometry(S*0.04, S*0.04, S*0.3, 6),
                    whiteMat
                );
                tube.position.set(-S*0.2 + i*S*0.15, S*0.2, S*0.5);
                group.add(tube);
            }
        }

        group.rotation.y = 0.3;

    } else if (data.name === 'DART') {
        // ── DART (Double Asteroid Redirection Test) ───────────────────
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*1.2, S*1.2, S*1.2),
            metalMat
        );
        group.add(body);

        // Solar panels (ROLLS — large)
        [-1,1].forEach(side => {
            const pivot = addSolarPanel(0, 0, S*1.5, S*3, true);
            pivot.position.x = side*S*1.3;
        });

        // Antenna
        addAntenna(0, 0, S*0.5, true);

        group.rotation.x = 0.1;

    } else if (data.name === 'Lucy') {
        // ── Lucy (Trojan Asteroid Mission) ────────────────────────────
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*1.5, S*0.8, S*1.5),
            metalMat
        );
        group.add(body);

        // 2 huge circular solar panels
        [-1,1].forEach(side => {
            const panel = new THREE.Mesh(
                new THREE.CylinderGeometry(S*2, S*2, 0.03*S, 20),
                panelMat
            );
            panel.position.set(side*S*2.2, 0, 0);
            panel.rotation.z = Math.PI/2;
            group.add(panel);
            // Panel support arms
            const arm = new THREE.Mesh(new THREE.BoxGeometry(S*0.06, S*0.06, S*1.5), darkMetal);
            arm.position.set(side*S*1.2, 0, 0);
            group.add(arm);
        });

        // High-gain antenna
        addAntenna(0, 0, S*0.8, true);

        group.rotation.x = 0.2;

    } else if (data.name === 'Europa Clipper') {
        // ── Europa Clipper ─────────────────────────────────────────────
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*1.8, S*1.2, S*1.2),
            metalMat
        );
        group.add(body);

        // Large solar panel wings
        [-1,1].forEach(side => {
            const pivot = addSolarPanel(0, 0, S*2, S*4, true);
            pivot.position.x = side*S*1.8;
        });

        // ICEMAG boom
        const boom = new THREE.Mesh(new THREE.BoxGeometry(S*0.03, S*0.03, S*3), darkMetal);
        boom.position.set(0, S*0.3, S*2);
        group.add(boom);

        // Antenna
        addAntenna(S*0.7, 0, S*0.6, true);

        group.rotation.z = 0.15;

    } else if (data.name === 'JWST-Ice Observer') {
        // ── JWST-Ice Observer (Neptune/Triton mission concept) ─────────
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.8, S*0.8, S*2, 10),
            metalMat
        );
        group.add(body);

        // RTG
        const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.15, S*0.15, S*0.8, 8),
            darkMetal
        );
        rtg.position.set(S*0.9, 0, -S*1.5);
        rtg.rotation.x = Math.PI/2;
        group.add(rtg);

        // Solar panels
        addSolarPanel(S*0.4, 0, S*1.5, S*2, true);

        addAntenna(0, S*1.2, S*0.8, true);

        group.rotation.z = 0.2;

    } else if (data.name === 'New Horizons-II') {
        // ── New Horizons-II (Arrokoth follow-up / Kuiper Belt) ─────────
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*1.6, S*0.9, S*1.6),
            darkMetal
        );
        group.add(body);

        // RTG
        const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.18, S*0.18, S*1, 10),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        );
        rtg.position.set(S*1, 0, 0);
        rtg.rotation.z = Math.PI/2;
        group.add(rtg);

        // High-gain antenna
        addAntenna(0, 0, S*1.1, true);

        // Solar panels (small — RTG primary)
        addSolarPanel(S*0.4, 0, S*1, S*1.2, true);

        group.rotation.x = 0.2; group.rotation.z = 0.1;

    } else if (data.name === 'Europa Lander') {
        // ── Europa Lander (concept) ─────────────────────────────────────
        // Octagonal body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.8, S*1, S*1, 8),
            metalMat
        );
        group.add(body);

        // Solar panels (4 wings)
        for(let a=0; a<4; a++){
            const ang = a * Math.PI/2;
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(S*0.04, S*1.5, S*2),
                panelMat
            );
            panel.position.set(Math.cos(ang)*S*1.3, 0, Math.sin(ang)*S*1.3);
            panel.rotation.y = ang;
            group.add(panel);
        }

        // Sampling arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(S*0.06, S*0.06, S*1.2), metalMat);
        arm.position.set(S*0.6, -S*0.3, S*0.6);
        arm.rotation.x = -0.4;
        group.add(arm);

        // Antenna
        addAntenna(S*0.5, 0, S*0.3, true);

        group.rotation.x = 0.25;

    } else if (data.name === 'Titan Dragonfly') {
        // ── Dragonfly (Titan rotorcraft) ────────────────────────────────
        // Central body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*0.8, S*0.4, S*0.8),
            metalMat
        );
        body.position.y = S*0.3;
        group.add(body);

        // 4 rotor blades (tilted)
        for(let r=0; r<4; r++){
            const ang = r * Math.PI/2 + Math.PI/4;
            const rotor = new THREE.Mesh(
                new THREE.BoxGeometry(S*0.15, 0.02*S, S*2),
                carbonMat
            );
            rotor.position.set(Math.cos(ang)*S*1.2, S*0.6, Math.sin(ang)*S*1.2);
            rotor.rotation.y = ang;
            group.add(rotor);
            // Rotor mast
            const mast = new THREE.Mesh(
                new THREE.CylinderGeometry(S*0.04, S*0.04, S*0.5, 6),
                darkMetal
            );
            mast.position.set(Math.cos(ang)*S*0.8, S*0.4, Math.sin(ang)*S*0.8);
            group.add(mast);
        }

        // RTG
        const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.12, S*0.12, S*0.5, 8),
            darkMetal
        );
        rtg.position.set(0, S*0.1, -S*0.5);
        group.add(rtg);

        // Antenna
        addAntenna(S*0.5, 0, S*0.25, true);

        group.rotation.x = 0.2;

    } else if (data.name === 'Ice Giant Pathfinder') {
        // ── Ice Giant Pathfinder (Uranus orbiter concept) ──────────────
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.9, S*0.9, S*2.5, 10),
            metalMat
        );
        group.add(body);

        // Large high-gain antenna
        addAntenna(0, S*1.5, S*1.5, true);

        // Solar panels
        [-1,1].forEach(side => {
            const pivot = addSolarPanel(0, 0, S*1.2, S*2.5, true);
            pivot.position.x = side*S*1.2;
        });

        // Engine bell
        const engine = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.25, S*0.4, S*0.5, 12),
            engineMat
        );
        engine.position.y = -S*1.5;
        engine.rotation.x = Math.PI/2;
        group.add(engine);

        group.rotation.z = 0.15;

    } else if (data.name === 'Enceladus Orbilander') {
        // ── Enceladus Orbilander (life-seeking mission) ─────────────────
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*1.2, S*0.8, S*1.2),
            metalMat
        );
        group.add(body);

        // Solar panels
        [-1,1].forEach(side => {
            const pivot = addSolarPanel(0, 0, S*1.5, S*2, true);
            pivot.position.x = side*S*1.3;
        });

        // Sampling arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(S*0.06, S*0.06, S*1), metalMat);
        arm.position.set(S*0.5, -S*0.3, S*0.5);
        arm.rotation.x = -0.3;
        group.add(arm);

        // RTG
        const rtg = new THREE.Mesh(
            new THREE.CylinderGeometry(S*0.12, S*0.12, S*0.6, 8),
            darkMetal
        );
        rtg.position.set(-S*0.8, 0, -S*0.5);
        rtg.rotation.x = Math.PI/2;
        group.add(rtg);

        group.rotation.x = 0.15; group.rotation.z = 0.1;

    } else {
        // ── Generic probe — enhanced box body + solar panels ───────────
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(S*2.2, S*1.4, S*2.2),
            new THREE.MeshStandardMaterial({ color: 0xddaa00, roughness: 0.4, metalness: 0.9, map: getTex('metal2', () => makeMetalBrushTexture(0xbb9900)) })
        );
        group.add(body);
        [-1,1].forEach(side => {
            const pivot = addSolarPanel(0, 0, S*3, S*2, true);
            pivot.position.x = side*S*2;
        });
    }

    // ── Add blinking status lights to all spacecraft ────────────────
    addStatusLight(group, S*0.5, S*0.3, S*0.3, 0x00ff88);  // Green status
    addStatusLight(group, -S*0.5, S*0.2, -S*0.2, 0xff4444); // Red warning
    if(data.size > 0.5) addStatusLight(group, 0, -S*0.3, S*0.4, 0x4488ff); // Blue comm

    group.userData.isTumbler = true;
    return group;
}

// ── Solar panel + antenna tracking (called in animate loop) ──────────────
function updateSpacecraftPhysics(simClock) {
    if(_solarTrackers.length === 0 && _antennaTrackers.length === 0) return;

    const sunPos = new THREE.Vector3(0, 0, 0); // Sun at origin
    const worldPos = new THREE.Vector3();
    const toSun = new THREE.Vector3();

    _solarTrackers.forEach(pivot => {
        pivot.getWorldPosition(worldPos);
        toSun.subVectors(sunPos, worldPos).normalize();
        const targetYaw = Math.atan2(toSun.x, toSun.z);
        let diff = targetYaw - pivot.rotation.y;
        while(diff > Math.PI) diff -= Math.PI * 2;
        while(diff < -Math.PI) diff += Math.PI * 2;
        pivot.rotation.y += diff * 0.03;
        const targetPitch = Math.atan2(toSun.y, Math.sqrt(toSun.x*toSun.x + toSun.z*toSun.z));
        pivot.rotation.x += (targetPitch * 0.5 - pivot.rotation.x) * 0.02;
    });

    _antennaTrackers.forEach(pivot => {
        const baseRotation = Math.sin(simClock * 0.00005) * 0.2;
        const targetYaw = baseRotation;
        let diff = targetYaw - pivot.rotation.y;
        while(diff > Math.PI) diff -= Math.PI * 2;
        while(diff < -Math.PI) diff += Math.PI * 2;
        pivot.rotation.y += diff * 0.01;
    });
}

function getProbeTumbleRate(name) {
    const rates = {
        'Voyager 1': 0.02, 'Voyager 2': 0.02, 'New Horizons': 0.03,
        'New Horizons-II': 0.03, 'Cassini': 0.015, 'Galileo': 0.025,
        'Juno': 0.8, 'Parker Solar Probe': 0.05, 'OSIRIS-REx': 0.04,
        'InSight': 0.01, 'Curiosity': 0.008, 'Perseverance': 0.008,
        'DART': 0.06, 'Lucy': 0.03, 'Europa Clipper': 0.025,
        'JWST-Ice Observer': 0.02, 'Europa Lander': 0.015,
        'Titan Dragonfly': 0.1, 'Ice Giant Pathfinder': 0.02,
        'Enceladus Orbilander': 0.018, 'ISS': 0.005,
        'Hubble': 0.008, 'JWST': 0.003,
    };
    return rates[name] || 0.45;
}

// ── Blinking status lights registry ──────────────────────────────────────
const _blinkingLights = [];
const _lightTimer = { t: 0 };

function addStatusLight(parent, x, y, z, color=0x00ff88) {
    const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color })
    );
    led.position.set(x, y, z);
    parent.add(led);
    _blinkingLights.push({ mesh: led, phase: Math.random() * Math.PI * 2, speed: 1.5 + Math.random() * 2 });
    return led;
}

function updateBlinkingLights(dt) {
    _lightTimer.t += dt;
    const t = _lightTimer.t;
    _blinkingLights.forEach(led => {
        const brightness = 0.3 + 0.7 * Math.abs(Math.sin(t * led.speed + led.phase));
        led.mesh.material.opacity = brightness;
        led.mesh.scale.setScalar(0.7 + brightness * 0.5);
    });
}

// ── Orbital trail system for satellites ──────────────────────────────────
const _orbitalTrails = [];

function createOrbitalTrail(mesh, color, segments=128) {
    const pts = [];
    for(let i=0; i<=segments; i++){
        const angle = (i/segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(angle) * 3, 0, Math.sin(angle) * 3));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15, depthWrite: false });
    const line = new THREE.Line(geo, mat);
    mesh.add(line);
    _orbitalTrails.push({ line, mat });
    return line;
}

// ════════════════════════════════════════════════════════════════════════════
//  ROCKET 3D BUILDER — Launch vehicles from humanity's space programs
// ════════════════════════════════════════════════════════════════════════════
function buildRocket3D(data) {
    const S = data.size;
    const group = new THREE.Group();

    const rocketMat = new THREE.MeshStandardMaterial({
        color: 0xe0e4e8, roughness: 0.3, metalness: 0.6,
        map: getTex('rocketBody', makeRocketBodyTexture)
    });
    const engineMat = new THREE.MeshStandardMaterial({
        color: 0x444444, roughness: 0.4, metalness: 0.8,
        map: getTex('engineNozzle', makeEngineNozzleTexture)
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.7 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xdd6600, roughness: 0.4, metalness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.3 });
    const interstageMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.35, metalness: 0.65 });
    const panelMat = new THREE.MeshStandardMaterial({
        color: 0x113366, roughness: 0.2, metalness: 0.8,
        map: getTex('solarPanel', makeSolarPanelTexture)
    });

    if (data.name === 'Saturn V') {
        // ── Saturn V (Apollo) ─────────────────────────────────────────
        // S-IC first stage (bottom)
        const stage1 = new THREE.Mesh(new THREE.CylinderGeometry(S*1.8, S*2, S*10, 16), rocketMat);
        stage1.position.y = -S*12;
        group.add(stage1);
        // S-II second stage
        const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(S*1.4, S*1.8, S*8, 16), whiteMat);
        stage2.position.y = -S*3;
        group.add(stage2);
        // S-IVB third stage
        const stage3 = new THREE.Mesh(new THREE.CylinderGeometry(S*1.0, S*1.4, S*5, 16), whiteMat);
        stage3.position.y = S*3.5;
        stage3.add(new THREE.Mesh(new THREE.CylinderGeometry(S*1.05, S*1.05, S*0.3, 16), orangeMat));
        // Instrument unit
        const iu = new THREE.Mesh(new THREE.CylinderGeometry(S*1.05, S*1.05, S*0.8, 16), darkMat);
        iu.position.y = S*6.4;
        group.add(iu);
        // LES (Launch Escape System)
        const les = new THREE.Mesh(new THREE.ConeGeometry(S*0.5, S*4, 12), whiteMat);
        les.position.y = S*11;
        group.add(les);
        // Engine bells (5 F-1 engines)
        for(let a=0; a<5; a++){
            const ang = a < 4 ? a * Math.PI/2 : 0;
            const rad = a < 4 ? S*1.2 : 0;
            const eng = new THREE.Mesh(new THREE.CylinderGeometry(S*0.3, S*0.5, S*1, 12), engineMat);
            eng.position.set(Math.cos(ang)*rad, -S*17, Math.sin(ang)*rad);
            eng.rotation.x = Math.PI;
            group.add(eng);
        }

    } else if (data.name === 'Falcon 9') {
        // ── Falcon 9 (SpaceX) ────────────────────────────────────────
        // First stage (with grid fins)
        const stage1 = new THREE.Mesh(new THREE.CylinderGeometry(S*1.2, S*1.2, S*14, 16), whiteMat);
        stage1.position.y = -S*5;
        group.add(stage1);
        // Interstage
        const interstage = new THREE.Mesh(new THREE.CylinderGeometry(S*1.2, S*1.2, S*1.5, 16), darkMat);
        interstage.position.y = S*3;
        group.add(interstage);
        // Second stage
        const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(S*1.1, S*1.2, S*5, 16), whiteMat);
        stage2.position.y = S*6.5;
        group.add(stage2);
        // Payload fairing
        const fairing = new THREE.Mesh(new THREE.CylinderGeometry(S*1.2, S*1.1, S*4, 16, 1, true), whiteMat);
        fairing.position.y = S*11;
        group.add(fairing);
        // Nose cone
        const nose = new THREE.Mesh(new THREE.ConeGeometry(S*1.1, S*2, 16), darkMat);
        nose.position.y = S*14;
        group.add(nose);
        // Grid fins (4)
        for(let i=0; i<4; i++){
            const ang = i * Math.PI/2;
            const fin = new THREE.Mesh(new THREE.BoxGeometry(S*2.5, S*0.08, S*2), darkMat);
            fin.position.set(Math.cos(ang)*S*1.3, S*2.5, Math.sin(ang)*S*1.3);
            fin.rotation.y = ang;
            group.add(fin);
        }
        // Engine (Merlin)
        const eng = new THREE.Mesh(new THREE.CylinderGeometry(S*0.3, S*0.5, S*1.2, 12), engineMat);
        eng.position.y = -S*12.5;
        eng.rotation.x = Math.PI;
        group.add(eng);

    } else if (data.name === 'Soyuz') {
        // ── Soyuz (Roscosmos) ────────────────────────────────────────
        // Core stage + boosters (4 strap-on boosters)
        const core = new THREE.Mesh(new THREE.CylinderGeometry(S*1.0, S*1.2, S*12, 16), whiteMat);
        core.position.y = -S*4;
        group.add(core);
        for(let i=0; i<4; i++){
            const ang = i * Math.PI/2 + Math.PI/4;
            const booster = new THREE.Mesh(new THREE.CylinderGeometry(S*0.5, S*0.6, S*8, 12), whiteMat);
            booster.position.set(Math.cos(ang)*S*1.6, -S*5, Math.sin(ang)*S*1.6);
            group.add(booster);
            // Booster nose
            const bNose = new THREE.Mesh(new THREE.ConeGeometry(S*0.5, S*2, 12), rocketMat);
            bNose.position.set(Math.cos(ang)*S*1.6, -S*1, Math.sin(ang)*S*1.6);
            group.add(bNose);
        }
        // Second stage
        const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(S*0.9, S*1.0, S*4, 16), whiteMat);
        stage2.position.y = S*4;
        group.add(stage2);
        // Soyuz spacecraft (orbital module + descent module + service module)
        const orbital = new THREE.Mesh(new THREE.SphereGeometry(S*0.6, 12, 10), whiteMat);
        orbital.position.y = S*7;
        group.add(orbital);
        const descent = new THREE.Mesh(new THREE.CylinderGeometry(S*0.55, S*0.4, S*1.5, 12), orangeMat);
        descent.position.y = S*8.5;
        group.add(descent);
        const service = new THREE.Mesh(new THREE.CylinderGeometry(S*0.5, S*0.55, S*2, 12), darkMat);
        service.position.y = S*10.5;
        group.add(service);
        // Solar panels on Soyuz
        [-1,1].forEach(side => {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(S*0.04, S*1.5, S*2.5), panelMat);
            panel.position.set(side*S*1.2, S*7, 0);
            group.add(panel);
        });

    } else if (data.name === 'SLS') {
        // ── SLS (Space Launch System) ─────────────────────────────────
        // Core stage (orange foam)
        const core = new THREE.Mesh(new THREE.CylinderGeometry(S*2.5, S*2.5, S*18, 16), orangeMat);
        core.position.y = -S*5;
        group.add(core);
        // Frustum top
        const frustum = new THREE.Mesh(new THREE.CylinderGeometry(S*1.8, S*2.5, S*4, 16), whiteMat);
        frustum.position.y = S*6;
        group.add(frustum);
        // Upper stage
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(S*1.6, S*1.8, S*5, 16), whiteMat);
        upper.position.y = S*10.5;
        group.add(upper);
        // Orion capsule
        const orion = new THREE.Mesh(new THREE.ConeGeometry(S*1.5, S*3, 16), darkMat);
        orion.position.y = S*15;
        group.add(orion);
        // Boosters (2 solid rocket boosters)
        [-1,1].forEach(side => {
            const booster = new THREE.Mesh(new THREE.CylinderGeometry(S*1.0, S*1.0, S*16, 16), whiteMat);
            booster.position.set(side*S*3.8, -S*4, 0);
            group.add(booster);
            const bNose = new THREE.Mesh(new THREE.ConeGeometry(S*1.0, S*2, 16), darkMat);
            bNose.position.set(side*S*3.8, S*5, 0);
            group.add(bNose);
        });
        // Engines
        for(let a=0; a<4; a++){
            const ang = a * Math.PI/2;
            const eng = new THREE.Mesh(new THREE.CylinderGeometry(S*0.4, S*0.6, S*1.5, 12), engineMat);
            eng.position.set(Math.cos(ang)*S*1.5, -S*14.5, Math.sin(ang)*S*1.5);
            eng.rotation.x = Math.PI;
            group.add(eng);
        }

    } else if (data.name === 'Space Shuttle') {
        // ── Space Shuttle ──────────────────────────────────────────────
        // Orbiter
        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(S*0.7, S*0.4, S*8, 12), whiteMat);
        fuselage.rotation.z = Math.PI/2;
        fuselage.position.set(0, S*2, 0);
        group.add(fuselage);
        // Nose
        const nose = new THREE.Mesh(new THREE.ConeGeometry(S*0.7, S*3, 12), darkMat);
        nose.rotation.z = -Math.PI/2;
        nose.position.set(S*5.5, S*2, 0);
        group.add(nose);
        // Wings (simplified delta)
        [-1,1].forEach(side => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(S*5, S*0.08, S*3), darkMat);
            wing.position.set(S*1, S*1.5, side*S*2);
            wing.rotation.z = side*0.15;
            group.add(wing);
        });
        // Tail fin
        const tail = new THREE.Mesh(new THREE.BoxGeometry(S*0.08, S*2.5, S*1.5), whiteMat);
        tail.position.set(-S*4, S*3.5, 0);
        group.add(tail);
        // Payload bay doors (open)
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide });
        [-1,1].forEach(side => {
            const door = new THREE.Mesh(new THREE.BoxGeometry(S*6, S*0.04, S*1.2), doorMat);
            door.position.set(S*1, S*2.5, side*S*0.7);
            door.rotation.z = side*0.1;
            group.add(door);
        });
        // External Tank (orange)
        const et = new THREE.Mesh(new THREE.CylinderGeometry(S*1.3, S*1.3, S*14, 16), orangeMat);
        et.position.set(-S*2, -S*3, 0);
        group.add(et);
        // SRBs (2 solid rocket boosters)
        [-1,1].forEach(side => {
            const srb = new THREE.Mesh(new THREE.CylinderGeometry(S*0.6, S*0.6, S*12, 16), whiteMat);
            srb.position.set(-S*2, -S*3, side*S*2.5);
            group.add(srb);
        });

    } else {
        // ── Generic rocket ─────────────────────────────────────────────
        const body = new THREE.Mesh(new THREE.CylinderGeometry(S*1.0, S*1.2, S*10, 16), rocketMat);
        body.position.y = -S*3;
        group.add(body);
        const nose = new THREE.Mesh(new THREE.ConeGeometry(S*1.0, S*3, 16), darkMat);
        nose.position.y = S*3.5;
        group.add(nose);
        const eng = new THREE.Mesh(new THREE.CylinderGeometry(S*0.3, S*0.5, S*0.8, 10), engineMat);
        eng.position.y = -S*8.5;
        eng.rotation.x = Math.PI;
        group.add(eng);
        // Fins
        for(let i=0; i<4; i++){
            const ang = i * Math.PI/2;
            const fin = new THREE.Mesh(new THREE.BoxGeometry(S*0.05, S*2, S*1.5), darkMat);
            fin.position.set(Math.cos(ang)*S*1.2, -S*7.5, Math.sin(ang)*S*1.2);
            fin.rotation.y = ang;
            group.add(fin);
        }
    }

    group.userData.isTumbler = false; // Rockets stand upright
    return group;
}

// ════════════════════════════════════════════════════════════════════════════
//  PLANET FACTORY
// ════════════════════════════════════════════════════════════════════════════
const textureLoader=new THREE.TextureLoader(),texCache={};
const allMoons=[],allBlackHoleDisk=[],allBlackHoleJets=[],allPulsarBeams=[],allFlares=[];
const planets=[],clickableHitboxes=[],allGalaxies=[],orbitLines=[];

function loadTex(url){if(!url)return null; if(!texCache[url])texCache[url]=textureLoader.load(url); return texCache[url];}

function drawOrbit(radius,color,parentObj){
    const pts=[]; for(let i=0;i<=200;i++){const t=(i/200)*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(t)*radius,0,Math.sin(t)*radius));}
    const geo=new THREE.BufferGeometry().setFromPoints(pts),mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:0.35}),line=new THREE.Line(geo,mat);
    orbitLines.push(line); if(parentObj){line.rotation.x=Math.PI/2; parentObj.add(line);} else scene.add(line); return line;
}
function addAtmosphereGlow(mesh,size,glowColor){
    mesh.add(new THREE.Mesh(new THREE.SphereGeometry(size*1.08,24,24),new THREE.MeshBasicMaterial({color:glowColor,transparent:true,opacity:0.13,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false})));
}

function createPlanet(data){
    let mesh;
    if(data.type==='star'){
        const segs=data.size>100?52:40, tex=loadTex(data.texture)||makeRockyTexture(0.09,0.4,0.65,0);
        mesh=new THREE.Mesh(new THREE.SphereGeometry(data.size,segs,segs),new THREE.MeshBasicMaterial({map:tex,color:data.color}));
        const c1=data.color===0xff3300?'rgba(255,120,40,0.82)':'rgba(255,235,150,0.82)', c2=data.color===0xff3300?'rgba(200,40,0,0.35)':'rgba(255,140,0,0.38)';
        const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:makeSunGlow(c1,c2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
        glow.scale.set(data.size*4.2,data.size*4.2,1); mesh.add(glow);
        if(data.size>=10){const flareTex=makeFlareTexture(); for(let fi=0;fi<8;fi++){const fMat=new THREE.SpriteMaterial({map:flareTex,transparent:true,opacity:0.35+Math.random()*0.3,blending:THREE.AdditiveBlending,depthWrite:false}),fs=new THREE.Sprite(fMat),ang=(fi/8)*Math.PI*2,rd=data.size*(1.1+Math.random()*0.6); fs.position.set(Math.cos(ang)*rd,(Math.random()-0.5)*data.size*0.9,Math.sin(ang)*rd); fs.scale.setScalar(data.size*(2.5+Math.random())); fs.userData={baseOp:fMat.opacity,phase:Math.random()*Math.PI*2,isFlare:true}; mesh.add(fs); allFlares.push(fs);}}

    } else if(data.type==='blackhole'){
        // ── True 3D black hole — event horizon, photon sphere, lensing,
        //    multi-layer disk with Doppler asymmetry, animated jets ──────
        const BH = new THREE.Group();
        const R = data.size;

        // 1. Event horizon (absolute black sphere)
        const ehMesh = new THREE.Mesh(
            new THREE.SphereGeometry(R, 64, 64),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        BH.add(ehMesh);

        // 2. Gravitational lensing halo — thin bright Einstein ring
        // Represented by a very fine torus at the photon sphere radius (~1.5 Rs)
        const photonTorus = new THREE.Mesh(
            new THREE.TorusGeometry(R * 1.52, R * 0.028, 24, 160),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        photonTorus.rotation.x = Math.PI / 2;
        BH.add(photonTorus);

        // 3. Lensing glow — wide soft ring showing light bending
        const lensGlow = new THREE.Mesh(
            new THREE.RingGeometry(R * 1.1, R * 2.2, 128),
            new THREE.MeshBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
        );
        lensGlow.rotation.x = Math.PI / 2;
        BH.add(lensGlow);

        // 4. Accretion disk — THREE layers for depth
        const diskTex = makeAccretionDiskHotTexture(true);
        const diskParams = [
            { inner: 1.55, outer: 2.8,  tiltDeg: 90,  op: 1.00 },  // inner hot ring (ISCO)
            { inner: 2.8,  outer: 5.0,  tiltDeg: 88,  op: 0.80 },  // mid disk
            { inner: 5.0,  outer: 8.5,  tiltDeg: 87,  op: 0.45 },  // outer cool disk
            { inner: 8.5,  outer: 13.0, tiltDeg: 86,  op: 0.18 },  // faint extended dust
        ];
        diskParams.forEach(({ inner, outer, tiltDeg, op }) => {
            const d = new THREE.Mesh(
                new THREE.RingGeometry(R * inner, R * outer, 256),
                new THREE.MeshBasicMaterial({ map: diskTex, side: THREE.DoubleSide, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })
            );
            d.rotation.x = THREE.MathUtils.degToRad(tiltDeg);
            allBlackHoleDisk.push(d);
            BH.add(d);
        });

        // 5. Under-disk glow (hot corona above/below event horizon)
        const coronaMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
        BH.add(new THREE.Mesh(new THREE.SphereGeometry(R * 2.2, 32, 32), coronaMat));

        // 6. Relativistic jets — bi-directional with multiple cone shells
        const jetConfigs = [
            { rad: 0.06, len: 18, col: 0x88ccff, op: 0.55 },  // inner jet core
            { rad: 0.18, len: 22, col: 0x4488ff, op: 0.28 },  // mid jet sheath
            { rad: 0.38, len: 28, col: 0x2255cc, op: 0.10 },  // outer cocoon
        ];
        [-1, 1].forEach(dir => {
            jetConfigs.forEach(({ rad, len, col, op }) => {
                const jet = new THREE.Mesh(
                    new THREE.ConeGeometry(R * rad, R * len, 16, 1, true),
                    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
                );
                jet.position.y = dir * R * (len * 0.5 + 0.5);
                if (dir < 0) jet.rotation.x = Math.PI;
                jet.userData.isJet = true;
                allBlackHoleJets.push(jet);
                BH.add(jet);
            });
        });

        // 7. Jet base flash points (X-ray hot spots)
        [-1, 1].forEach(dir => {
            const hotSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: getGalaxyTexture ? getGalaxyTexture('star') : null,
                color: 0x88aaff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false
            }));
            hotSprite.scale.setScalar(R * 1.2);
            hotSprite.position.y = dir * R * 1.4;
            BH.add(hotSprite);
        });

        // Tilt the whole system slightly so the disk is angled (more realistic viewing angle)
        BH.rotation.z = 0.35;
        mesh = BH;

    } else if(data.type==='pulsar'){
        mesh=new THREE.Mesh(new THREE.SphereGeometry(data.size,28,28),new THREE.MeshBasicMaterial({map:makePulsarTexture(),color:data.color}));
        [-1,1].forEach(dir=>{const beam=new THREE.Mesh(new THREE.ConeGeometry(data.size*1.8,data.size*38,10),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:0.75,blending:THREE.AdditiveBlending})); beam.position.y=dir*data.size*19; if(dir<0)beam.rotation.x=Math.PI; beam.userData.isPulsarBeam=true; allPulsarBeams.push(beam); mesh.add(beam);});

    } else if(data.type==='probe'){
        mesh = buildSpacecraft3D(data);

    } else if(data.type==='rocket'){
        mesh = buildRocket3D(data);

    } else if(data.type==='interstellar'){
        mesh=new THREE.Mesh(new THREE.CylinderGeometry(data.size*0.3,data.size*0.3,data.size*5,12),new THREE.MeshStandardMaterial({map:makeRockyTexture(0.03,0.35,0.20,5),roughness:0.85,metalness:0.05})); mesh.userData.isTumbler=true;

    } else if(data.type==='comet'){
        mesh=new THREE.Mesh(new THREE.SphereGeometry(data.size,20,20),new THREE.MeshStandardMaterial({map:makeRockyTexture(0.06,0.08,0.18,15),roughness:0.95,metalness:0}));
        const tail=new THREE.Mesh(new THREE.ConeGeometry(data.size*2.2,data.size*20,10),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:0.30,blending:THREE.AdditiveBlending})); tail.rotation.x=-Math.PI/2; tail.position.z=-data.size*10; mesh.add(tail);
        const ionTail=new THREE.Mesh(new THREE.ConeGeometry(data.size*1.0,data.size*35,8),new THREE.MeshBasicMaterial({color:0x88aaff,transparent:true,opacity:0.14,blending:THREE.AdditiveBlending})); ionTail.rotation.x=-Math.PI/2; ionTail.position.z=-data.size*18; mesh.add(ionTail);

    } else if(data.type==='galaxy'){
        mesh = buildGalaxy3D(data);

    } else {
        const segs=data.size>20?52:(data.size>8?44:30),geo=new THREE.SphereGeometry(data.size,segs,segs);
        let texMap=loadTex(data.texture);
        if(!texMap){
            if(data.subtype==='io') texMap=makeIoTexture();
            else if(data.subtype==='europa') texMap=makeEuropaTexture();
            else if(data.subtype==='titan') texMap=makeTitanTexture();
            else if(data.subtype==='enceladus') texMap=makeEnceladusTexture();
            // Gas/ice giants: use banded procedural instead of rocky
            else if(data.typeBadge&&(data.typeBadge.includes('GAS GIANT')||data.typeBadge.includes('ICE GIANT')))
                texMap=makeGasGiantTexture(data.color||0xddaa77, data.typeBadge.includes('ICE')?0.08:0.14);
            else { const hsl={h:0.06,s:0.2,l:0.35}; if(data.color){new THREE.Color(data.color).getHSL(hsl);} texMap=makeRockyTexture(hsl.h,hsl.s,Math.max(0.18,hsl.l),25); }
        }
        mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:texMap,bumpMap:texMap,bumpScale:1.2,roughness:0.88,metalness:0.04}));
        if(data.atmosphereColor) addAtmosphereGlow(mesh,data.size,data.atmosphereColor);
        if(data.name==='Earth'){
            // Animated cloud layer
            const cloudMesh=new THREE.Mesh(new THREE.SphereGeometry(data.size*1.012,40,40),
                new THREE.MeshBasicMaterial({map:makeEarthCloudsTexture(),transparent:true,opacity:0.68,depthWrite:false,blending:THREE.NormalBlending}));
            mesh.add(cloudMesh);
            animHooks.push(dt=>{ cloudMesh.rotation.y+=0.008*dt; });
        }
        if(data.name==='Jupiter') addJupiterGRS(mesh, data.size);
    }

    // Saturn rings (multi-band)
    if(data.name==='Saturn'){
        const rt=loadTex('./assets/saturn_rings.jpg')||makeSaturnRingTexture();
        const ring=new THREE.Mesh(new THREE.RingGeometry(data.size*1.25,data.size*2.55,128),new THREE.MeshBasicMaterial({map:rt,side:THREE.DoubleSide,transparent:true,opacity:0.94,depthWrite:false})); ring.rotation.x=Math.PI/2; ring.rotation.y=0.06; mesh.add(ring);
        const inR=new THREE.Mesh(new THREE.RingGeometry(data.size*1.00,data.size*1.25,128),new THREE.MeshBasicMaterial({map:makeSaturnRingTexture(),side:THREE.DoubleSide,transparent:true,opacity:0.38,depthWrite:false})); inR.rotation.x=Math.PI/2; inR.rotation.y=0.06; mesh.add(inR);
    }
    if(data.name==='Uranus'){mesh.add(new THREE.Mesh(new THREE.RingGeometry(data.size*1.4,data.size*1.9,64),new THREE.MeshBasicMaterial({color:0x88aacc,side:THREE.DoubleSide,transparent:true,opacity:0.28})));}

    const hScale=Math.max(14 / Math.max(data.size, 0.3), 2.2);
    const hitBox=new THREE.Mesh(new THREE.SphereGeometry(data.size*hScale,8,8),new THREE.MeshBasicMaterial({visible:false})); hitBox.userData=data; mesh.add(hitBox); clickableHitboxes.push(hitBox);

    if(data.name!=='Sun'&&data.type!=='darkmatter'){
        const div=document.createElement('div'); div.className='floating-label'; div.textContent=data.name.toUpperCase();
        div.dataset.type = data.type;
        if(data.type !== 'galaxy' && data.type !== 'blackhole' && data.type !== 'probe' && data.type !== 'pulsar') {
            div.style.borderColor='#'+((data.color||0xffffff)>>>0).toString(16).padStart(6,'0');
        }
        // ── Label click → open HUD ───────────────────────────────────────
        div.addEventListener('click', e => {
            e.stopPropagation();
            activeSelect = data;
            if(window.openHUD) window.openHUD(data);
            if(typeof flyTo === 'function') flyTo(data);
        });
        const lbl=new CSS2DObject(div); lbl.position.set(0,Math.max(data.size * 1.6, 3.2) + 2.8,0); mesh.add(lbl); data._labelDiv=div; allLabelDivs.push(div);
    }
    const moonCount=Math.min(parseInt(data.moons)||0,4), moonTex=loadTex('./assets/moon.jpg')||makeRockyTexture(0.06,0.1,0.35,25);
    // phase stored so absolute-position animation is jitter-free
    for(let i=0;i<moonCount;i++){const pivot=new THREE.Object3D(),mPhase=Math.random()*Math.PI*2,mSize=data.size*(Math.random()*0.14+0.09),mDist=data.size*(Math.random()*1.4+1.5)+i*8,mPer=Math.random()*22+4,mm=new THREE.Mesh(new THREE.SphereGeometry(mSize,16,16),new THREE.MeshStandardMaterial({map:moonTex,roughness:1.0})); mm.position.x=mDist; pivot.rotation.set(Math.random()*0.5,mPhase,Math.random()*0.5); pivot.add(mm); mesh.add(pivot); allMoons.push({pivot,period:mPer,phase:mPhase}); drawOrbit(mDist,0xffffff,pivot);}
    return mesh;
}

// ════════════════════════════════════════════════════════════════════════════
//  PLANET DATABANK  v3.3
// ════════════════════════════════════════════════════════════════════════════
const planetData = {
"Sun":{type:'star',typeBadge:'G-TYPE MAIN SEQUENCE STAR',size:18.0,dist:0,period:0,color:0xffaa00,texture:'/assets/sun.jpg',moons:'0',
overview:'Our parent star — a nearly perfect sphere of superheated plasma sustained by nuclear fusion. 1.4 million km across, it contains 99.86% of the solar system\'s total mass.',
stats:{'Diameter':'1,392,700 km (109× Earth)','Mass':'1.989 × 10³⁰ kg','Surface Temp':'5,505 °C','Core Temp':'15,000,000 °C','Luminosity':'3.828 × 10²⁶ W','Rotation':'25 days (equator)','Age':'~4.6 Billion Years','Spectral Class':'G2V'},
atmosphere:{'Photosphere':'H: 73.46%, He: 24.85%','Chromosphere':'~2,000 km thick; 20,000 °C','Corona':'Up to 3,000,000 °C'},
exploration:{'Parker Solar Probe':'2018–Present','Solar Orbiter':'ESA/NASA 2020–Present','SOHO':'Since 1995'},
discoveries:{'Solar Wind':'Eugene Parker predicted 1958, confirmed 1962 by Luna 1','Coronal Heating':'Corona hotter than photosphere — magnetic wave heating (still studied)','Solar Switchbacks':'Rapid field reversals discovered by Parker Probe (2019)','Heliosphere Edge':'Voyager 1 confirmed crossing 2012'},
funFact:'The Sun will exhaust its hydrogen fuel in ~5 billion years, expanding into a red giant that may engulf Earth.'},

"Mercury":{type:'planet',typeBadge:'TERRESTRIAL PLANET',size:1.25,dist:140,period:88,color:0x888888,texture:'./assets/mercury.jpg',moons:'0',atmosphereColor:null,
overview:'The smallest planet and innermost in our solar system. A heavily cratered world with extreme temperature swings of 600°C and a surprisingly large iron core making up 85% of its radius.',
stats:{'Diameter':'4,879 km','Mass':'3.285 × 10²³ kg','Surface Gravity':'3.7 m/s²','Density':'5.43 g/cm³','Distance from Sun':'57.9 million km (0.39 AU)','Day Length':'59 Earth days','Year Length':'88 Earth days'},
atmosphere:{'Composition':'Negligible exosphere: O₂, Na, H₂','Surface Pressure':'~10⁻¹⁴ bar','Temp Range':'-180 °C to 430 °C'},
exploration:{'Mariner 10':'1974–75 (three flybys)','MESSENGER':'2011–2015 (first orbiter)','BepiColombo':'ESA/JAXA en route, 2025'},
discoveries:{'Polar Ice':'Water ice in permanently shadowed craters (MESSENGER 2012)','Hollows':'Unique volatile-loss surface depressions','Core Size':'Enormous iron core 85% of radius — poorly understood','Shrinkage':'Planet contracted ~7 km as core cooled'},
funFact:'Mercury has no atmosphere to retain heat, so it experiences the largest temperature swings of any planet — over 600°C between the sunlit day side and the frozen night side.'},

"Venus":{type:'planet',typeBadge:'TERRESTRIAL PLANET',size:3.0,dist:190,period:225,color:0xffaa55,texture:'./assets/venus.jpg',moons:'0',atmosphereColor:0xff8833,
overview:'The second planet and hottest in the solar system despite not being closest to the Sun. A hellish world with crushing 92-bar pressure, sulfuric acid clouds, and surface temperatures hot enough to melt lead.',
stats:{'Diameter':'12,104 km','Mass':'4.867 × 10²⁴ kg','Surface Gravity':'8.87 m/s²','Distance from Sun':'108.2 million km (0.72 AU)','Day Length':'243 Earth days (retrograde)','Year Length':'225 Earth days'},
atmosphere:{'Composition':'CO₂: 96.5%, N₂: 3.5%, SO₂ traces','Surface Pressure':'92 bar','Temperature':'465 °C constant'},
exploration:{'Venera Program':'USSR 1970–85 (images from surface)','Magellan':'NASA radar mapping 1990–94','DAVINCI+':'NASA planned 2031'},
discoveries:{'Retrograde Rotation':'Day longer than year; Sun rises in the west','Active Volcanism':'Fresh lava flows confirmed by ESA/Magellan data (2023)','Phosphine Signal':'Possible life signature in clouds (2020, contested)','Lightning':'Radio waves suggest cloud lightning'},
funFact:'A day on Venus (243 Earth days) is longer than its year (225 Earth days). The Sun rises in the west and sets in the east on Venus — it rotates backwards.'},

"Earth":{type:'planet',typeBadge:'TERRESTRIAL PLANET',size:3.2,dist:260,period:365.25,color:0x4b90ff,texture:'./assets/earth.jpg',moons:'0',atmosphereColor:0x4488ff,
overview:'The third planet and only known world to harbour life. A geologically active world with plate tectonics, a global magnetic field, liquid oceans, breathable atmosphere, and 8.7 million known species.',
stats:{'Diameter':'12,742 km','Mass':'5.972 × 10²⁴ kg','Surface Gravity':'9.807 m/s²','Density':'5.51 g/cm³ (densest planet)','Distance from Sun':'149.6 million km (1 AU)','Day Length':'24 hours','Year Length':'365.25 days','Axial Tilt':'23.5°'},
atmosphere:{'Composition':'N₂: 78.09%, O₂: 20.95%, Ar: 0.93%, CO₂: 0.04%','Surface Pressure':'1.013 bar','Temp Range':'-88 °C to 58 °C'},
exploration:{'Sputnik 1':'First satellite (USSR 1957)','Apollo 11':'First humans on Moon (1969)','ISS':'Continuously inhabited since Nov 2000'},
discoveries:{'Van Allen Belts':'James Van Allen, 1958','Plate Tectonics':'Confirmed from seafloor spreading, 1960s','Ozone Layer':'Depletion crisis identified 1970s','Magnetic Reversal':'Poles have flipped hundreds of times in Earth\'s history'},
funFact:'Earth is the only planet not named after a Roman or Greek deity. Its magnetic field is generated by liquid iron in the outer core rotating at different speeds from the solid inner core.'},

"ISS":{type:'probe',typeBadge:'SPACE STATION',size:0.22,dist:261.5,period:0.06,color:0xffffff,texture:'',moons:'0',parent:'Earth',
overview:'The International Space Station — the largest human structure ever launched into space. Continuously inhabited since November 2, 2000.',
stats:{'Altitude':'408 km','Orbital Speed':'7.66 km/s','Orbital Period':'92.68 min','Length':'109 m','Mass':'~420,000 kg','Habitable Volume':'388 m³','Crew':'6–7'},
atmosphere:{'Internal':'1 atm N₂/O₂','Water Recovery':'90%+ recycled'},
exploration:{'Launch':'Nov 1998','Crewed Since':'Nov 2, 2000','Experiments':'3,000+ scientific investigations'},
discoveries:{'Fluid Physics':'Unique behaviour in microgravity','Bone/Muscle Loss':'Quantified for future Mars missions','Plant Growth':'First crops grown and eaten in space (2015)','Combustion':'Spherical flames reveal new combustion physics'},
funFact:'The ISS completes 16 orbits per day at 28,000 km/h. Astronauts see 16 sunrises and 16 sunsets every 24 hours.'},

"Hubble":{type:'probe',typeBadge:'SPACE TELESCOPE',size:0.2,dist:263,period:0.07,color:0xcccccc,texture:'',moons:'0',parent:'Earth',
overview:'The Hubble Space Telescope — one of the most productive scientific instruments ever built, transforming astronomy across 35+ years of operation.',
stats:{'Altitude':'547 km','Mirror':'2.4 m','Wavelengths':'UV, Visible, Near-IR','Launch':'Apr 24, 1990','Servicing Missions':'5'},
atmosphere:{'Environment':'Hard vacuum; -100 °C to +100 °C per orbit'},
exploration:{'Deep Field':'Thousands of galaxies in tiny patch of sky (1995)','Dark Energy':'SN Ia observations confirmed accelerating expansion'},
discoveries:{'Dark Energy':'Contributed to Nobel Prize 2011','Black Hole Prevalence':'Nearly all large galaxies host supermassive black holes','Hubble Constant':'Helped refine universe expansion rate','Proplyds':'Planet-forming disks imaged in Orion (1993)'},
funFact:'Hubble has made over 1.5 million observations and generated more than 180 terabytes of data. It has observed objects more than 13 billion light-years away.'},

"JWST":{type:'probe',typeBadge:'INFRARED TELESCOPE',size:0.35,dist:275,period:365.25,color:0xffcc00,texture:'',moons:'0',
overview:'The James Webb Space Telescope — the most powerful observatory ever launched. Orbiting the Sun-Earth L2 point 1.5 million km away, it peers through dust to see the earliest galaxies.',
stats:{'Location':'Sun-Earth L2','Mirror':'6.5 m (18 gold-plated segments)','Wavelengths':'Near to mid-infrared','Launch':'Dec 25, 2021','First Science':'Jul 12, 2022'},
atmosphere:{'Mirror Temp':'-233 °C','Power':'~2 kW'},
exploration:{'Deepest Image':'Most distant galaxies ever imaged (Jul 2022)','Exoplanet Atmos.':'First CO₂ detection in WASP-39b (2022)'},
discoveries:{'Earliest Galaxies':'Observed just 300M years after Big Bang','CO₂ in Exoplanet':'First atmospheric chemistry detection (2022)','JuMBOs':'Free-floating Jupiter-mass object pairs in Orion — unexplained (2023)','Rogue Planet Pairs':'Most unexpected JWST discovery'},
funFact:'JWST\'s gold-plated mirror must stay at -233°C — colder than Pluto. Its five-layer sunshield is the size of a tennis court and blocks sunlight 1 million times, allowing the ultra-sensitive infrared detectors to function.'},

"Voyager 1":{type:'probe',typeBadge:'INTERSTELLAR PROBE',size:0.32,dist:1900,period:0,color:0xffffff,texture:'',moons:'0',
overview:'The most distant human-made object — Voyager 1 entered interstellar space in 2012 and still transmits scientific data after 47+ years of flight.',
stats:{'Launch':'Sep 5, 1977','Distance from Sun':'Over 165 AU and increasing at 17 km/s','Signal Delay':'23+ hours one way','Power':'RTGs (plutonium-238)','Status':'Still transmitting'},
atmosphere:{'Environment':'Confirmed interstellar medium (plasma density jump Aug 25, 2012)'},
exploration:{'Jupiter Flyby':'1979 — discovered Io volcanism','Saturn Flyby':'1980','Pale Blue Dot':'Photo of Earth from 6 billion km (1990)','Heliopause':'Crossed Aug 25, 2012'},
discoveries:{'Interstellar Plasma':'Denser and more uniform than expected','Heliosphere Shape':'Data suggests bullet-shaped (not spherical)','Galactic Cosmic Rays':'Dramatically different particle environment beyond heliopause'},
funFact:'Voyager 1 carries the Golden Record — a 12-inch gold-plated disc with 115 images, greetings in 55 languages, 90 min of music, and sounds of Earth.'},

"Voyager 2":{type:'probe',typeBadge:'INTERSTELLAR PROBE',size:0.3,dist:1920,period:0,color:0xeeeeff,texture:'',moons:'0',
overview:'The only spacecraft to visit all four giant planets — Jupiter, Saturn, Uranus, and Neptune. Now in interstellar space, still returning data after 47+ years.',
stats:{'Launch':'Aug 20, 1977','Planets Visited':'Jupiter, Saturn, Uranus, Neptune','Distance':'Over 137 AU','Status':'Still transmitting'},
atmosphere:{'Environment':'Interstellar medium (crossed Nov 5, 2018)'},
exploration:{'Grand Tour':'Only mission to visit all four ice/gas giants','Neptune Flyby':'1989 — discovered Triton geysers'},
discoveries:{'Neptune Rings':'Discovered ring arcs during 1989 flyby','Triton Geysers':'Nitrogen geysers on Neptune\'s largest moon','Interstellar Medium':'First direct measurements of plasma beyond heliopause'},
funFact:'Voyager 2 is the only spacecraft ever to visit Uranus and Neptune. Its Grand Tour was made possible by a once-every-175-year planetary alignment.'},

"New Horizons":{type:'probe',typeBadge:'KBO EXPLORER',size:0.28,dist:1700,period:0,color:0xddddff,texture:'',moons:'0',
overview:'The spacecraft that gave humanity its first close look at Pluto in 2015, then flew past Arrokoth — the most distant object ever visited.',
stats:{'Launch':'Jan 19, 2006','Pluto Flyby':'Jul 14, 2015','Arrokoth Flyby':'Jan 1, 2019 (6.6 billion km from Sun)','Speed':'~14 km/s (still active, outer Kuiper Belt)'},
exploration:{'Pluto System':'First close-up images Jul 14, 2015','Arrokoth':'Most distant object ever visited — Jan 1, 2019'},
discoveries:{'Heart of Pluto':'Tombaugh Regio — nitrogen ice heart-plain 1,000 km wide','Blue Haze':'Unexpected multi-layer blue atmospheric haze','Arrokoth Shape':'Contact binary formed by gentle accretion — rewrites planetesimal formation models'},
funFact:'New Horizons is the fastest spacecraft ever launched, departing Earth at 58,536 km/h. It reached the Moon\'s orbit in 9 hours — a trip that took Apollo astronauts 3 days.'},

"Cassini":{type:'probe',typeBadge:'SATURN ORBITER',size:0.32,dist:810,period:0,color:0xeedd88,texture:'',moons:'0',
overview:'The Cassini-Huygens mission — 13 years in orbit around Saturn, discovering geysers on Enceladus, lakes on Titan, and revealing the ring system in unprecedented detail before its Grand Finale dive in 2017.',
stats:{'Launch':'Oct 15, 1997','Saturn Arrival':'Jul 1, 2004','Huygens Landing':'Jan 14, 2005 (Titan surface)','Grand Finale':'Sep 15, 2017 (deliberate atmospheric entry)','Orbits':'294 around Saturn'},
atmosphere:{'Ring Rain':'Rings raining into Saturn at ~10,000 kg/s','Hexagonal Storm':'Persistent 30,000 km vortex at north pole'},
exploration:{'Huygens':'First landing on a moon of an outer planet (Titan 2005)','Enceladus Plumes':'Discovered water geysers 2005','Grand Finale':'22 daring orbits between Saturn and its rings (2017)'},
discoveries:{'Enceladus Ocean':'Sub-surface global ocean confirmed by gravity data','Titan Lakes':'First liquid bodies found beyond Earth — methane/ethane seas','Ring Moonlets':'Propeller-shaped small moons in the rings','Hexagonal Storm':'Discovered by Voyager, studied in detail by Cassini'},
funFact:'Cassini\'s Grand Finale — 22 orbits between Saturn and its rings — was one of the most daring mission endings ever. Scientists deliberately destroyed it to prevent contaminating Enceladus and Titan, which could harbour life.'},

"Galileo":{type:'probe',typeBadge:'JUPITER ORBITER',size:0.28,dist:595,period:0,color:0xccbb99,texture:'',moons:'0',
overview:'The first spacecraft to orbit Jupiter — Galileo studied the gas giant and its moons for 8 years (1995-2003), dropping a probe into the atmosphere and discovering evidence for oceans on Europa, Ganymede, and Callisto.',
stats:{'Launch':'Oct 18, 1989','Jupiter Arrival':'Dec 7, 1995','Atmospheric Probe':'Dec 7, 1995 — descended 150 km into Jupiter','End of Mission':'Sep 21, 2003 (deliberate atmospheric entry)'},
atmosphere:{'Jupiter Atmosphere':'Probe measured wind, temperature, composition before crushing pressure ended signal'},
exploration:{'Atmospheric Probe':'First direct sampling of Jupiter\'s atmosphere','Io Volcanism':'Monitored 400+ active volcanoes over 8 years'},
discoveries:{'Europa Ocean':'Magnetic induction proves global sub-surface saltwater ocean','Ganymede Magnetic Field':'Only moon with self-generated magnetic field','Jupiter Ring System':'Discovered dusty rings fed by moon impacts'},
funFact:'Galileo\'s high-gain antenna failed to deploy properly — forcing engineers to rely on a tiny low-gain antenna and innovative data compression to send back 30 GB of science data over 8 years.'},

"Juno":{type:'probe',typeBadge:'JUPITER ORBITER',size:0.26,dist:620,period:0,color:0xddcc88,texture:'',moons:'0',
overview:'Juno has been orbiting Jupiter since 2016, peering beneath the cloud tops with its microwave radiometer and discovering polar cyclones, a fuzzy core, and water deep in the atmosphere.',
stats:{'Launch':'Aug 5, 2011','Jupiter Arrival':'Jul 5, 2016','Orbits Completed':'50+ close flybys (as of 2024)','Power':'Solar — farthest solar-powered spacecraft'},
atmosphere:{'Polar Cyclones':'Stable octagon of cyclones at north pole','Water':'0.25% water by mass in equatorial region'},
exploration:{'J closest approach':'Perijove at ~4,000 km above cloud tops','Extended Mission':'Now studying Jupiter\'s rings and large moons'},
discoveries:{'Fuzzy Core':'Jupiter has no solid core — heavy elements distributed diffusely','Polar Cyclones':'8 cyclones in octagon pattern at north pole — stable since 2017','Atmospheric Depth':'Jet streams extend 3,000 km deep','Water Abundance':'More water than previously thought — key to formation models'},
funFact:'Juno is the farthest spacecraft ever powered by solar panels. Its three 9-meter wings generate just 500 watts at Jupiter — enough to run five light bulbs.'},

"Parker Solar Probe":{type:'probe',typeBadge:'SOLAR PROBE',size:0.26,dist:85,period:88,color:0xffffff,texture:'',moons:'0',
overview:'The closest human-made object to the Sun — Parker Solar Probe flies through the corona at 690,000 km/h, enduring temperatures of 1,400°C behind its revolutionary carbon-composite heat shield.',
stats:{'Launch':'Aug 12, 2017','Closest Approach':'6.2 million km from Sun surface','Max Speed':'690,000 km/h (fastest human object)','Heat Shield':'1,400 °C rated, 12 cm thick carbon composite'},
atmosphere:{'Corona':'First direct sampling of solar corona plasma','Solar Wind':'Measured origin of slow solar wind'},
exploration:{'24 Perihelion Passes':'Gradually getting closer via Venus gravity assists','Corona Crossing':'First spacecraft to "touch" the Sun'},
discoveries:{'Switchbacks':'Magnetic field zig-zags in solar wind — origin confirmed','Dust-Free Zone':'Possible dust depletion zone near Sun detected','Solar Wind Origin':'Identified source regions of slow solar wind on the Sun'},
funFact:'Parker Solar Probe\'s heat shield is made of carbon-carbon composite — the same material used in missile nose cones. While the shield faces 1,400°C, the instruments behind it stay at room temperature.'},

"OSIRIS-REx":{type:'probe',typeBadge:'ASTEROID SAMPLER',size:0.24,dist:310,period:1.3,color:0xddcc88,texture:'',moons:'0',
overview:'NASA\'s first asteroid sample return mission — collected material from near-Earth asteroid Bennu and delivered a capsule to Earth in 2023.',
stats:{'Launch':'Sep 8, 2016','Bennu Arrival':'Dec 3, 2018','Sample Collection':'Oct 20, 2020 (TAGSAM touch, 6 sec)','Sample Return':'Sep 24, 2023 — Utah desert','Sample Mass':'~70 g (exceeded 60 g target)'},
exploration:{'TAGSAM':'Touch-And-Go Sample Acquisition Mechanism','OSIRIS-APEX':'Renamed; en route to 99942 Apophis for 2029 close-approach rendezvous'},
discoveries:{'Particle Ejection':'Bennu was actively ejecting pebbles into space — not predicted (2019)','Fluffy Surface':'Spacecraft sank into surface; thrusters had to fire or it would have been swallowed','Sample Chemistry':'4.7% carbon by weight — highest in any extraterrestrial sample; water-bearing clay found'},
funFact:'The sample capsule landed with enough material for decades of study. Scientists found amino acids, water-bearing clay, and carbon compounds — essentially the building blocks of life preserved for 4.5 billion years.'},

"InSight":{type:'probe',typeBadge:'MARS LANDER',size:0.22,dist:328,period:0,color:0xcc8855,texture:'',moons:'0',
overview:'NASA\'s Mars Interior Exploration lander (2018–2022) recorded over 1,300 marsquakes and measured the Red Planet\'s interior structure — from crust to liquid iron core — for the first time.',
stats:{'Launch':'May 5, 2018','Landing':'Nov 26, 2018 (Elysium Planitia)','End of Mission':'Dec 21, 2022','Marsquakes':'1,300+ detected'},
exploration:{'SEIS Seismometer':'Detected quakes from meteorite impacts and tectonic faults','HP3 Mole':'Heat probe stalled at 35 cm — granular soil failed to provide friction','RISE Experiment':'Measured Mars wobble to map deep interior'},
discoveries:{'Thin Crust':'Martian crust 20–37 km thick — thinner than predicted','Liquid Iron Core':'Radius ~1,830 km — larger than expected, explains why Mars lost its magnetic field','Seismically Active':'Mars is not geologically dead — faults remain active'},
funFact:'InSight died from dust — its solar panels lost 80% efficiency over 4 years of accumulation. Its final image was a self-portrait covered in dust.'},

"Curiosity":{type:'probe',typeBadge:'MARS ROVER',size:0.22,dist:335,period:0,color:0xddaa66,texture:'',moons:'0',
overview:'Curiosity — the car-sized Mars Science Laboratory rover has been exploring Gale Crater since 2012, discovering ancient riverbeds, organic molecules, and seasonal methane variations.',
stats:{'Launch':'Nov 26, 2011','Landing':'Aug 6, 2012 (Gale Crater)','Distance Driven':'30+ km','Power':'RTG (plutonium-238)','Instruments':'17 cameras, laser spectrometer, drill, wet chemistry lab'},
atmosphere:{'Methane':'Seasonal variations detected — source unknown','Radiation':'Measured radiation levels for future human missions'},
exploration:{'Mt. Sharp':'Climbing 5 km-high mountain in Gale Crater','Ancient Lake':'Confirmed Gale Crater was a lake billions of years ago'},
discoveries:{'Organic Molecules':'Complex organics preserved in ancient mudstones','Seasonal Methane':'Methane varies seasonally — biological or geological?','Ancient Habitable Environment':'Gale Crater had all ingredients for microbial life'},
funFact:'Curiosity carries a Lincoln penny on its deck for scale in photographs. It uses a laser to vaporize rock samples from 7 meters away and analyzes the resulting plasma.'},

"Perseverance":{type:'probe',typeBadge:'MARS ROVER',size:0.25,dist:340,period:0,color:0xeebb77,texture:'',moons:'0',
overview:'Perseverance — the most advanced Mars rover ever built — is searching for signs of ancient microbial life in Jezero Crater and caching samples for future return to Earth.',
stats:{'Launch':'Jul 30, 2020','Landing':'Feb 18, 2021 (Jezero Crater)','Distance Driven':'25+ km','Sample Tubes':'23 cached for future return','Ingenuity':'First powered flight on another planet (72 flights, now retired)'},
atmosphere:{'MOXIE':'Produced oxygen from CO₂ — 12 g/hour (technology demonstrator for human missions)'},
exploration:{'Jezero Delta':'Exploring ancient river delta — prime biosignature hunting ground','Sample Caching':'Sealing rock cores for future Mars Sample Return mission'},
discoveries:{'Organics in Jezero':'Organic molecules found in every rock studied (2023)','Firefights':'First oxygen production on another planet (MOXIE 2021)','Ingenuity Success':'72 flights proved powered flight possible in thin Martian air'},
funFact:'Perseverance carries 43 sample tubes and has already filled 23 with carefully selected rock cores. A future Mars Sample Return mission will fetch these tubes and bring them back to Earth — the first-ever samples from another planet.'},

"DART":{type:'probe',typeBadge:'ASTEROID DEFLECTOR',size:0.22,dist:345,period:0,color:0xccccdd,texture:'',moons:'0',
overview:'The Double Asteroid Redirection Test — humanity\'s first planetary defense mission — successfully slammed into asteroid Dimorphos in 2022, shortening its orbit by 33 minutes and proving we can deflect dangerous asteroids.',
stats:{'Launch':'Nov 24, 2021','Impact':'Sep 26, 2022','Target':'Dimorphos (160m asteroid)','Speed':'24,000 km/h at impact','Orbit Change':'33-minute shortening of Dimorphos orbit'},
atmosphere:{'Debris':'Ejecta tail extended thousands of km — key to momentum transfer'},
exploration:{'Planetary Defense':'First test of kinetic impactor technique','ICUBE-LIGHT':'Italian cubesat captured impact images'},
discoveries:{'Momentum Transfer':'Ejecta provided 3.6× more momentum than direct impact alone','Orbit Change':'Largest intentional change ever made to a celestial body\'s orbit','Surface Properties':'Dimorphos was a rubble pile — affected cratering dynamics'},
funFact:'DART hit a moving target 11 million km from Earth using autonomous navigation. The spacecraft saw Dimorphos as a single pixel just minutes before impact — and still nailed the center.'},

"Europa Clipper":{type:'probe',typeBadge:'EUROPA EXPLORER',size:0.32,dist:585,period:0,color:0xccddee,texture:'',moons:'0',
overview:'Europa Clipper — launched October 2024 — will conduct 49 close flybys of Jupiter\'s moon Europa to determine if its sub-surface ocean could support life.',
stats:{'Launch':'Oct 14, 2024','Jupiter Arrival':'2030','Flybys':'49 close Europa flybys planned','Instruments':'9 including ice-penetrating radar, mass spectrometer','Solar Arrays':'Largest ever on a planetary spacecraft'},
atmosphere:{'Ocean':'Global saltwater ocean with 2× Earth\'s liquid water','Ice Shell':'15-25 km thick, possibly with water pockets'},
exploration:{'Ice-Penetrating Radar':'REASON — measures ice shell thickness','Mass Spectrometer':'MASPEX — analyzes plume particles','UV Spectrograph':'Europa-UVS — studies surface and exosphere'},
discoveries:{'TBD':'Mission en route — discoveries expected 2030+','Pre-launch Goal':'Assess habitability of Europa\'s ocean'},
funFact:'Europa Clipper\'s solar panels span 30 meters — wider than a basketball court. Despite being near Jupiter where sunlight is 25× weaker than Earth, they generate enough power for all 9 instruments.'},

"Lucy":{type:'probe',typeBadge:'TROJAN EXPLORER',size:0.26,dist:560,period:0,color:0xddddcc,texture:'',moons:'0',
overview:'Lucy — launched October 2021 — is the first spacecraft to visit Jupiter\'s Trojan asteroids, ancient remnants of the solar system formation sharing the gas giant\'s orbit.',
stats:{'Launch':'Oct 16, 2021','Targets':'8 Trojan asteroids over 12 years','First Flyby':'2025 (Donaldjohanson in main belt)','Power':'Two 7.3-meter circular solar arrays'},
atmosphere:{'Trojan Asteroids':'Primitive bodies sharing Jupiter\'s orbit — time capsules of solar system formation'},
exploration:{'Grand Tour of Trojans':'Visiting both leading (Greek camp) and trailing (Trojan camp) groups','12-Year Mission':'Flying past 8 different asteroids — most targets ever for one spacecraft'},
discoveries:{'TBD':'First flyby 2025 — first close look at Trojan asteroids','Pre-launch Goal':'Understand diversity and origins of primitive asteroids'},
funFact:'Lucy is named after the 3-million-year-old fossil that revealed human evolution. Just as the fossil transformed our understanding of human origins, Lucy the spacecraft will transform our understanding of solar system origins.'},

"Ice Giant Pathfinder":{type:'probe',typeBadge:'ICE GIANT CONCEPT',size:0.3,dist:1000,period:0,color:0xaabbdd,texture:'',moons:'0',
overview:'A proposed flagship mission to orbit Uranus and explore its moons — identified as the highest priority by the 2023 Planetary Science Decadal Survey. Would launch in the early 2030s.',
stats:{'Status':'Proposed — highest priority flagship for 2030s','Target':'Uranus orbiter + atmospheric probe','Key Moons':'Miranda, Ariel, Umbriel, Titania, Oberon','Launch Window':'Early 2030s, arrival mid-2040s'},
atmosphere:{'Atmosphere Probe':'Would descend into Uranus atmosphere — first since Voyager 2 radio occultation (1986)'},
exploration:{'Ice Giant Science':'First dedicated orbiter of an ice giant','Moon Geology':'Close flybys of all 5 major moons','Magnetic Field':'Study Uranus tilted, off-center dynamo'},
discoveries:{'TBD':'Mission not yet approved — would answer why ice giants are so different from gas giants','Decadal Priority':'2023 Planetary Science Decadal Survey top flagship recommendation'},
funFact:'No spacecraft has orbited an ice giant. The only close data comes from Voyager 2\'s single flyby of Uranus (1986) and Neptune (1989) — over 35 years ago. A dedicated orbiter would revolutionize our understanding.'},

"JWST-Ice Observer":{type:'probe',typeBadge:'NEPTUNE CONCEPT',size:0.28,dist:1150,period:0,color:0xaaccdd,texture:'',moons:'0',
overview:'A proposed infrared space telescope positioned at Neptune-Triton L2 — would provide continuous observation of the ice giant and its captured Kuiper Belt moon Triton.',
stats:{'Status':'Concept study phase','Target':'Neptune-Triton system','Instruments':'High-resolution IR telescope + atmospheric probe','Advantage':'L2 point provides stable, continuous viewing'},
atmosphere:{'Triton Geysers':'Continuous monitoring of Triton\'s active nitrogen geysers','Neptune Atmosphere':'Track seasonal changes over decades'},
exploration:{'Triton Ocean':'Search for evidence of sub-surface ocean','Kuiper Belt':'Survey KBOs from vantage point at 30 AU'},
discoveries:{'TBD':'Concept phase — would study ice giant weather, ring dynamics, Triton geology'},
funFact:'A Neptune L2 telescope would be the farthest operational spacecraft from Earth — 4.5 billion km away. Signals would take over 4 hours each way, requiring full autonomous operation.'},

"New Horizons-II":{type:'probe',typeBadge:'KUIPER BELT CONCEPT',size:0.28,dist:1500,period:0,color:0xccddee,texture:'',moons:'0',
overview:'A proposed extended New Horizons mission — using the existing spacecraft to explore additional Kuiper Belt Objects beyond Arrokoth, revealing the diversity of these primitive bodies.',
stats:{'Spacecraft':'New Horizons (extended mission)','Targets':'Additional KBOs beyond Arrokoth','Current Location':'~58 AU and receding','Power':'RTG declining — operations possible until ~2040s'},
atmosphere:{'Kuiper Belt':'Icy debris field — remains of solar system formation beyond Neptune'},
exploration:{'KBO Encounters':'Flybys of diverse Kuiper Belt Objects','Heliosphere':'Continues measuring particles at heliosphere boundary'},
discoveries:{'Arrokoth':'Contact binary — gentle accretion confirmed (2019)','Future':'Potential additional KBO flybys with remaining fuel'},
funFact:'New Horizons has enough hydrazine fuel for 2-3 more KBO flybys. Finding suitable targets requires precise telescope searches — like finding a dark mountain 7 billion km away while moving at 14 km/s.'},

"Europa Lander":{type:'probe',typeBadge:'EUROPA LANDER CONCEPT',size:0.25,dist:590,period:0,color:0xbbccdd,texture:'',moons:'0',
overview:'A proposed Europa lander — the first spacecraft to touch down on Jupiter\'s ocean moon — would search for biosignatures on the surface and assess the ice shell\'s habitability.',
stats:{'Status':'Concept — not yet approved','Landing Site':'Smooth ice near active crack','Instruments':'Mass spectrometer, microscope, seismometer, sample drill','Power':'RTGs for 20+ day surface operation'},
atmosphere:{'Radiation':'Europa\'s surface receives 540 rem/day — limits lander lifetime to ~20 days'},
exploration:{'Biosignatures':'Search for organic molecules and potential biomarkers','Ice Shell':'First direct measurement of Europa surface composition','Seismology':'Listen for ocean echoes to determine ice shell thickness'},
discoveries:{'TBD':'Would be first landing on an ocean world','Pre-launch Goal':'Assess habitability and search for signs of life'},
funFact:'A Europa lander would face the harshest radiation environment of any surface mission — 540 rem/day vs 0.3 rem/day on Mars. The electronics would need heavy shielding, and the lander would survive just 20 days.'},

"Titan Dragonfly":{type:'probe',typeBadge:'TITAN ROTORCRAFT',size:0.25,dist:795,period:0,color:0xddaa44,texture:'',moons:'0',
overview:'Dragonfly — launching 2028 — will fly a rotorcraft across Titan\'s surface, hopping between dunes, craters, and potential cryovolcanic sites to study prebiotic chemistry and habitability.',
stats:{'Launch':'2028 (planned)','Titan Arrival':'Mid-2030s','Range':'Flies 175 km over 8 years','Power':'MMRTG charges batteries for 8-hour flights','Instruments':'Mass spectrometer, gamma-ray spectrometer, cameras, drills'},
atmosphere:{'Thick Atmosphere':'1.5× Earth pressure + 1/7 gravity = easy flight','Methane Lakes':'Will avoid landing in hydrocarbon lakes'},
exploration:{'Selk Crater':'Primary target — possible past liquid water + organic chemistry','Dune Fields':'Study organic sand composition at multiple sites','Prebiotic Chemistry':'Understand chemistry before life emerges'},
discoveries:{'TBD':'Launch 2028 — first aircraft on another world','Pre-launch Goal':'Determine steps toward life on a world with methane cycle'},
funFact:'On Titan, a 900g drone weighs just 130g, and the thick atmosphere generates 4× more lift than Earth. Dragonfly can fly 12 km in a single charge — faster than any Mars rover drives in a year.'},

"Enceladus Orbilander":{type:'probe',typeBadge:'ENCELADUS LIFE SEEKER',size:0.25,dist:786,period:0,color:0xccddee,texture:'',moons:'0',
overview:'A proposed flagship mission to orbit Enceladus, then land near its south pole — directly sampling the plume material and surface to search for evidence of life in its sub-surface ocean.',
stats:{'Status':'Proposed — flagship mission concept','Target':'Enceladus orbit + landing','Plume Sampling':'Fly through geysers to capture fresh ocean material','Instruments':'Mass spectrometer, microscope, seismometer, drill'},
atmosphere:{'Plume Contents':'H₂O, CO₂, CH₄, H₂, salts, complex organics, silica — ocean ingredients sampled from orbit'},
exploration:{'Orbital Phase':'2 years mapping + plume flythroughs','Landing Phase':'Land near south pole tiger stripes — 2 years surface operations','Life Detection':'Search for amino acids, lipids, cells in plume and surface ice'},
discoveries:{'TBD':'Not yet approved — would be first life-detection mission at Enceladus','Pre-launch Goal':'Determine if life exists in Enceladus ocean'},
funFact:'Enceladus Orbilander could find life without drilling — the moon fires its ocean contents into space through geysers. Simply flying through the plume is like tasting the ocean from orbit.'},

"Saturn V":{type:'rocket',typeBadge:'APOLLO LAUNCH VEHICLE',size:0.35,dist:258,period:0,color:0xeeeeee,texture:'',moons:'0',parent:'Earth',
overview:'The most powerful rocket ever flown — Saturn V carried astronauts to the Moon across 6 successful Apollo missions (1969–1972). Standing 110.6 m tall, it remains the only launch vehicle to carry humans beyond low Earth orbit.',
stats:{'Height':'110.6 m','Mass':'2,970,000 kg','Thrust':'34.5 MN (7.5 million lbf)','Stages':'3 + LES','Payload to LEO':'140,000 kg','Payload to TLI':'48,600 kg','Engines':'5 F-1 (1st stage), 5 J-2 (2nd), 1 J-2 (3rd)'},
atmosphere:{'Fuel':'RP-1/LOX (1st stage), LH2/LOX (2nd/3rd)','Burn Time':'1st: 168s, 2nd: 360s, 3rd: 165s + 335s (TLI)'},
exploration:{'Apollo 8':'First humans to orbit the Moon (Dec 1968)','Apollo 11':'First Moon landing (Jul 20, 1969)','Apollo 13':'Successful failure — safe return after oxygen tank explosion','Skylab':'Launched America\'s first space station (1973)','Apollo-Soyuz':'First US-Soviet joint mission (1975)'},
discoveries:{'Human Spaceflight':'Proved humans can travel to, land on, and return from another world','Lunar Science':'382 kg of Moon rocks returned across 6 missions','Earthrise':'Iconic photo of Earth from lunar orbit changed human perspective'},
funFact:'Saturn V\'s first stage burned 15 tons of propellant per second. In 2.5 minutes it consumed 2,000,000 kg of fuel — yet the rocket only reached 67 km altitude. Most of the energy was spent lifting the fuel itself.'},

"Falcon 9":{type:'rocket',typeBadge:'PARTIALLY REUSABLE LAUNCH VEHICLE',size:0.28,dist:257,period:0,color:0xeeeeff,texture:'',moons:'0',parent:'Earth',
overview:'The world\'s first reusable orbital rocket — Falcon 9 has revolutionized spaceflight with its ability to land and refly the first stage. As of 2024, a single booster has flown 20+ missions, dramatically reducing launch costs.',
stats:{'Height':'70 m','Mass':'549,000 kg','Thrust':'7,607 kN (sea level)','Stages':'2 (+ optional fairing)','Payload to LEO':'22,800 kg (expendable)','Landings':'280+ successful first-stage landings','Reusability':'Single booster record: 20+ flights'},
atmosphere:{'Fuel':'RP-1/LOX (all stages)','Engines':'9 Merlin 1D (1st), 1 Merlin Vacuum (2nd)','Landing':'Propulsive vertical landing on drone ship or landing pad'},
exploration:{'CRS':'Regular cargo resupply to ISS since 2012','Crew Dragon':'Restored US human spaceflight capability (2020)','Starlink':'Launched 5,000+ satellites for global internet','DART':'Planetary defense mission to asteroid Dimorphos'},
discoveries:{'Reusability':'Proved that orbital rockets can be landed and reflown 20+ times','Cost Reduction':'Reduced launch costs by 10× from ~$60M to ~$30M per flight','Launch Cadence':'Set record: 96 launches in a single year (2023)'},
funFact:'Falcon 9 first stages land using a single engine burn — they reenter the atmosphere at Mach 5, then execute a "boostback burn" to reverse direction, followed by a landing burn that touches down on a target just 10 meters wide on a drone ship.'},

"Soyuz":{type:'rocket',typeBadge:'WORLD\'S MOST FLOWN ROCKET',size:0.25,dist:256,period:0,color:0xddeeff,texture:'',moons:'0',parent:'Earth',
overview:'The most launched rocket in history — Soyuz has flown over 1,900 times since 1966 with a 97% success rate. It carried every Soviet and Russian astronaut to the ISS after the Space Shuttle retired.',
stats:{'Height':'49.5 m','Mass':'312,000 kg','Thrust':'4,144 kN','Stages':'3 (4 strap-on boosters)','Total Launches':'1,900+ since 1966','Success Rate':'97%','Payload to LEO':'7,480 kg'},
atmosphere:{'Fuel':'RP-1/LOX','Engines':'4 RD-107A (boosters) + 1 RD-108A (core) + 1 RD-0110 (3rd)'},
exploration:{'Soyuz TMA':'Carried all Russian astronauts to ISS (2002-2020)','Soyuz MS':'Current crew rotation vehicle','Progress':'Cargo resupply missions to ISS and earlier stations'},
discoveries:{'Reliability':'Most proven launch vehicle in history — flown in some form for 58+ years','Human Transport':'Carried more humans to space than any other rocket','First Satellite':'The R-7 (Soyuz predecessor) launched Sputnik 1 in 1957'},
funFact:'The Soyuz rocket family traces its lineage directly to the R-7 Semyorka — the world\'s first ICBM, built in 1957. The same basic design launched Sputnik, Yuri Gagarin, and continues flying to the ISS today.'},

"SLS":{type:'rocket',typeBadge:'SPACE LAUNCH SYSTEM',size:0.32,dist:259,period:0,color:0xeeeeee,texture:'',moons:'0',parent:'Earth',
overview:'NASA\'s most powerful rocket since Saturn V — the Space Launch System (SLS) will carry the Artemis astronauts back to the Moon. Its core stage holds 730,000 gallons of cryogenic propellant.',
stats:{'Height':'98.1 m (Block 1)','Mass':'2,600,000 kg','Thrust':'39,144 kN (8.8 million lbf)','Stages':'2 + 2 SRBs','Payload to LEO':'95,000 kg','Payload to TLI':'27,000 kg (Block 1)','Engines':'4 RS-25 (core) + 2 SRBs'},
atmosphere:{'Fuel':'LH2/LOX (core), PBAN (boosters)','RS-25 Engines':'Reused from Space Shuttle program (flown 21 times)'},
exploration:{'Artemis I':'Successful uncrewed lunar orbit test (Nov-Dec 2022)','Artemis II':'Planned crewed lunar flyby (2025)','Artemis III':'Planned crewed Moon landing (2026)'},
discoveries:{'Power':'Most powerful rocket ever flown (surpassed Saturn V thrust)','Artemis Generation':'Enabling return to the Moon after 50+ years'},
funFact:'SLS uses four RS-25 engines that previously flew on Space Shuttle missions. The engines on Artemis I had collectively flown 21 Shuttle missions and spent 2 hours, 9 minutes in space before being reused for the Moon rocket.'},

"Space Shuttle":{type:'rocket',typeBadge:'REUSABLE SPACEPLANE',size:0.3,dist:255,period:0,color:0xeeeeee,texture:'',moons:'0',parent:'Earth',
overview:'The world\'s first reusable spacecraft — Space Shuttle flew 135 missions over 30 years (1981–2011), building the ISS, launching Hubble, and proving that a vehicle could fly to space and return like an airplane.',
stats:{'Height':'56.1 m (stack)','Mass':'2,040,000 kg (at liftoff)','Thrust':'30,160 kN','Missions':'135 (1981-2011)','Total Crew':'355 individuals from 16 nations','Payload Bay':'18.3 m × 4.6 m','Payload to LEO':'27,500 kg'},
atmosphere:{'Fuel':'LH2/LOX (orbiter) + PBAN (SRBs) + MMH/NTO (OMS)','Engines':'3 SSME (orbiter) + 2 SRBs + 2 OMS','Landing':'Unpowered glide landing at 340 km/h'},
exploration:{'Hubble':'Deployed and serviced the Hubble Space Station (1990-2009)','ISS':'Primary assembly vehicle (1998-2011)','Spacelab':'300+ science missions','Challenger/Columbia':'Lost two orbiters — 14 astronauts sacrificed'},
discoveries:{'Reusability':'Proved that reusable spacecraft were possible','Satellite Servicing':'Hubble repair missions demonstrated in-orbit maintenance','Microgravity Research':'Thousands of experiments across 30 years of flight'},
funFact:'The Space Shuttle\'s main engines were the most efficient rocket engines ever built — operating at over 99% combustion efficiency. They could throttle from 65% to 109% of rated thrust, burning 500 gallons of propellant per second at full power.'},

"Mars":{type:'planet',typeBadge:'TERRESTRIAL PLANET',size:1.7,dist:330,period:687,color:0xff5533,texture:'./assets/mars.jpg',moons:'2',atmosphereColor:0xff4422,
overview:'The Red Planet — a cold desert world with the largest volcano and longest canyon in the solar system. Clear evidence of ancient liquid water and prime target for human exploration.',
stats:{'Diameter':'6,779 km','Mass':'6.39 × 10²³ kg','Surface Gravity':'3.72 m/s² (38% of Earth)','Distance from Sun':'227.9 million km (1.52 AU)','Day Length':'24h 37m','Year Length':'687 Earth days','Moons':'Phobos & Deimos'},
atmosphere:{'Composition':'CO₂: 95.3%, N₂: 2.6%, Ar: 1.9%','Surface Pressure':'0.006 bar','Temp Range':'-125 °C to 20 °C'},
exploration:{'Viking 1&2':'First landers (1976)','Curiosity':'Active since 2012 (Gale Crater)','Perseverance':'Active since 2021 (Jezero Crater)','Ingenuity':'First powered flight on another world (19+ flights)'},
discoveries:{'Ancient Water':'River delta in Jezero Crater confirms ancient lake (2021)','Organics':'Complex organics in Gale Crater (Curiosity 2018)','Subsurface Lake':'Possible liquid water under south pole (MARSIS 2018)','Marsquakes':'1,300+ seismic events (InSight 2019–22)','Oxygen Production':'MOXIE experiment made O₂ from CO₂ (2021)'},
funFact:'Olympus Mons is the tallest volcano in the solar system at 22 km. It is so wide (600 km) that a person standing at its base cannot see the summit — it is beyond the Martian horizon.'},

"Ceres":{type:'dwarf',typeBadge:'DWARF PLANET',size:0.5,dist:420,period:1682,color:0xaaaaaa,texture:'./assets/moon.jpg',moons:'0',
overview:'The largest object in the asteroid belt and only dwarf planet in the inner solar system. Its bright salt spots in Occator Crater puzzled scientists for years.',
stats:{'Diameter':'939 km','Surface Gravity':'0.28 m/s²','Distance from Sun':'413.7 million km (2.77 AU)','Orbital Period':'1,682 Earth days','Rotation':'9 hours 4 min'},
atmosphere:{'Exosphere':'Water vapour near bright spots'},
exploration:{'Dawn':'NASA orbiter 2015–2018'},
discoveries:{'Bright Faculae':'Sodium carbonate from sub-surface brine (Dawn 2015)','Organics':'Complex organic material (Dawn 2017)','Sub-surface Activity':'Geological activity in last few million years','Temporary Atmosphere':'Thin water vapour near bright spots'},
funFact:'Ceres may harbour a sub-surface ocean of liquid brine — making it a candidate for astrobiology in the inner solar system despite being just 939 km across.'},

"Jupiter":{type:'planet',typeBadge:'GAS GIANT',size:11.0,dist:580,period:4333,color:0xddaa77,texture:'./assets/jupiter.jpg',moons:'95',atmosphereColor:0xddaa44,
overview:'The king of planets — more massive than all other planets combined. Its magnetic field extends to Saturn\'s orbit, and it hosts the most volcanically active body in the solar system.',
stats:{'Diameter':'139,820 km (11× Earth)','Mass':'1.898 × 10²⁷ kg (318× Earth)','Surface Gravity':'24.79 m/s²','Distance from Sun':'778.5 million km (5.2 AU)','Day Length':'9h 56m','Year Length':'4,333 Earth days'},
atmosphere:{'Composition':'H₂: 89.8%, He: 10.2%','Great Red Spot':'1.3× Earth-wide storm, 350+ years old','Magnetic Field':'20,000× Earth\'s'},
exploration:{'Pioneer 10&11':'First flybys 1973–74','Galileo':'Orbiter+probe 1995–2003','Juno':'Active since 2016','Europa Clipper':'NASA, launched Oct 2024'},
discoveries:{'Io Volcanism':'Voyager 1 (1979) — first volcanism found outside Earth','Europa Ocean':'Sub-surface ocean evidence (Galileo 1995)','Polar Cyclones':'Stable cyclone clusters at poles (Juno 2017)','Fuzzy Core':'No solid core — diffuse heavy element region (Juno)','Atmospheric Depth':'Jet streams penetrate thousands of km deep (Juno 2021)'},
funFact:'Jupiter\'s moon Ganymede is larger than Mercury. The Great Red Spot is a storm larger than Earth that has raged for at least 350 years — though it\'s slowly shrinking.'},

"Europa":{type:'planet',typeBadge:'MOON OF JUPITER',size:0.82,dist:592,period:3.55,color:0xd0e8f0,texture:'',moons:'0',parent:'Jupiter',subtype:'europa',
overview:'The most exciting moon in the solar system. Europa\'s smooth icy crust hides a global sub-surface ocean with twice the volume of all Earth\'s oceans. A prime candidate for life.',
stats:{'Diameter':'3,121 km','Orbital Period':'3.55 Earth days','Ocean Depth':'~100 km estimated','Ice Shell':'15–25 km thick','Distance from Jupiter':'671,100 km'},
atmosphere:{'Exosphere':'Thin O₂ from ice splitting by radiation'},
exploration:{'Galileo':'Confirmed sub-surface ocean (1990s)','Europa Clipper':'NASA, launched Oct 2024, arrival 2030 (49 flybys planned)'},
discoveries:{'Water Plumes':'Possible vapour plumes (Hubble 2013, 2016)','Salty Ocean':'Magnetic induction confirms conductive (salty) liquid','Chaos Terrain':'Surface disruption shows ocean-ice interaction','Habitable Chemistry':'Ocean may be in contact with rocky seafloor — enabling hydrothermal chemistry'},
funFact:'Europa\'s sub-surface ocean has existed for billions of years in contact with a rocky seafloor — potentially hosting hydrothermal vents like those that sustain life in Earth\'s deepest oceans.'},

"Io":{type:'planet',typeBadge:'MOON OF JUPITER',size:0.92,dist:597,period:1.77,color:0xffcc44,texture:'',moons:'0',parent:'Jupiter',subtype:'io',
overview:'The most volcanically active body in the solar system, with 400+ active volcanoes. Io is squeezed by Jupiter\'s tidal forces, generating extraordinary internal heat.',
stats:{'Diameter':'3,643 km','Orbital Period':'1.77 Earth days','Active Volcanoes':'400+','Largest Lava Lake':'Loki Patera (200 km wide)','Distance from Jupiter':'421,800 km'},
atmosphere:{'Composition':'SO₂ from volcanic outgassing'},
exploration:{'Voyager 1':'Discovered volcanism (1979)','Galileo':'Extended study 1990s–2003','Juno':'Close flybys 2023–24'},
discoveries:{'First Extraterrestrial Volcanism':'Voyager 1 (Linda Morabito\'s discovery, 1979)','Plasma Torus':'Io generates a plasma donut around Jupiter\'s orbit','Tidal Heating':'Orbital resonance with Europa/Ganymede drives all the heat','Mountains':'Compression from subsidence creates peaks up to 18 km'},
funFact:'Io\'s volcanic activity is powered entirely by tidal heating — Jupiter\'s gravity kneads Io\'s interior like bread dough, generating more heat than Earth\'s entire radioactive interior.'},

"Ganymede":{type:'planet',typeBadge:'MOON OF JUPITER',size:1.35,dist:606,period:7.15,color:0xaabbcc,texture:'',moons:'0',parent:'Jupiter',
overview:'The largest moon in the solar system — bigger than Mercury. The only moon known to generate its own magnetic field, and likely hosts a sub-surface saltwater ocean.',
stats:{'Diameter':'5,268 km (larger than Mercury)','Orbital Period':'7.15 Earth days','Distance from Jupiter':'1,070,400 km'},
atmosphere:{'Thin Oxygen Exosphere':'Detected by Hubble (1996)'},
exploration:{'Galileo':'Found magnetic field (1996)','JUICE':'ESA will orbit Ganymede from 2034'},
discoveries:{'Self-Generated Magnetic Field':'Only moon with its own dynamo field (Galileo 1996)','Sub-surface Ocean':'Hubble aurora oscillations reveal salty ocean (2015)','JUICE Target':'Will be the most studied moon outside our own from 2034'},
funFact:'If Ganymede orbited the Sun instead of Jupiter, it would be classified as a planet. At 5,268 km, it outclasses Mercury and is only slightly smaller than Mars.'},

"Saturn":{type:'planet',typeBadge:'GAS GIANT',size:9.2,dist:780,period:10759,color:0xe3d599,texture:'./assets/saturn.jpg',moons:'146',atmosphereColor:0xddcc77,
overview:'The jewel of the solar system, famous for its spectacular ring system. The least dense planet — less dense than water — it would float in a large enough ocean.',
stats:{'Diameter':'116,460 km (9.5× Earth)','Mass':'5.68 × 10²⁶ kg','Density':'0.687 g/cm³ (less than water!)','Distance from Sun':'1.43 billion km (9.58 AU)','Day Length':'10h 42m','Year Length':'10,759 Earth days'},
atmosphere:{'Composition':'H₂: 96.3%, He: 3.25%','Wind Speeds':'Up to 1,800 km/h','Hexagonal Storm':'30,000 km-wide vortex at north pole','Rings':'Mostly water ice, extend 282,000 km'},
exploration:{'Pioneer 11':'First flyby 1979','Voyager 1&2':'Flybys 1980–81','Cassini–Huygens':'13-year orbit 2004–17','Dragonfly':'NASA rotorcraft to Titan, 2034'},
discoveries:{'Ring Age':'Geologically young — ~100 million years old (Cassini)','Ring Rain':'Raining into Saturn at ~10,000 kg/s — rings disappear in ~100M years','Hexagonal Storm':'Discovered by Voyager 2 (1981); still ongoing','Moonlets':'Propeller-shaped moonlets in A ring (Cassini)'},
funFact:'Saturn\'s rings are up to 282,000 km wide but only 10–100 metres thick in places. Scaled to a sheet of paper\'s thickness, they would be far thinner than the paper itself.'},

"Titan":{type:'planet',typeBadge:'MOON OF SATURN',size:1.32,dist:793,period:15.9,color:0xdd8833,texture:'',moons:'0',parent:'Saturn',subtype:'titan',
overview:'Saturn\'s largest moon — the only moon with a dense atmosphere and liquid bodies on its surface (methane/ethane seas, not water). A chemical analogue of early Earth.',
stats:{'Diameter':'5,151 km','Orbital Period':'15.95 Earth days','Atmospheric Pressure':'1.5× Earth','Surface Temp':'-179 °C','Methane Seas':'Kraken Mare (490,000 km²)'},
atmosphere:{'Composition':'N₂: 98.4%, CH₄: 1.4%','Haze':'Orange organic tholins','Hydrocarbon Cycle':'Methane rain, rivers, and seas'},
exploration:{'Cassini':'Radar mapping through haze','Huygens':'Landed Jan 14, 2005 — first outer solar system landing','Dragonfly':'NASA rotorcraft, 2034'},
discoveries:{'Liquid Lakes':'Confirmed hydrocarbon lakes at poles (Cassini 2006)','Sub-surface Ocean':'Evidence for liquid water under ice (Cassini 2012)','Dunes':'Global organic dune fields at equator','Pre-biotic Chemistry':'Most chemically complex moon known'},
funFact:'On Titan you could strap wings to your arms and fly — atmosphere 4× denser than Earth\'s, gravity 1/7th Earth\'s. Human-powered flight would be completely achievable.'},

"Enceladus":{type:'planet',typeBadge:'MOON OF SATURN',size:0.45,dist:785,period:1.37,color:0xeef8ff,texture:'',moons:'0',parent:'Saturn',subtype:'enceladus',
overview:'One of the most exciting moons — Enceladus fires geysers of water, organics, and hydrogen from its south pole, directly sampling its sub-surface ocean for passing spacecraft.',
stats:{'Diameter':'504 km','Orbital Period':'1.37 Earth days','Albedo':'0.99 (most reflective body in solar system)','Plume Speed':'~1,400 km/h'},
atmosphere:{'Plume Contents':'H₂O, CO₂, CH₄, H₂, N₂, salts, complex organics, silica'},
exploration:{'Cassini':'Discovered plumes 2005; flew through 23 times'},
discoveries:{'Hydrothermal Vents':'Silica nanoparticles prove active seafloor reactions (2015)','Molecular Hydrogen':'H₂ in plumes = ongoing water-rock chemistry, potential energy for life (2017)','Complex Organics':'High-mass organic molecules (2018)'},
funFact:'Cassini flew through Enceladus\'s plumes and directly "tasted" the ocean spray. Salt, organics, silica, and hydrogen — nearly every ingredient thought necessary for life — were present.'},

"Uranus":{type:'planet',typeBadge:'ICE GIANT',size:5.5,dist:960,period:30687,color:0x66ccff,texture:'./assets/uranus.jpg',moons:'28',atmosphereColor:0x55bbff,
overview:'The seventh planet — a unique ice giant that rolls along its orbital path on its side (97.77° axial tilt) and has the coldest planetary atmosphere in the solar system.',
stats:{'Diameter':'50,724 km (4× Earth)','Distance from Sun':'2.87 billion km (19.2 AU)','Day Length':'17h 14m (retrograde)','Year Length':'84 Earth years','Rings':'13 distinct narrow rings'},
atmosphere:{'Composition':'H₂: 82.5%, He: 15.2%, CH₄: 2.3%','Temperature':'-224 °C (coldest atmosphere in solar system)'},
exploration:{'Voyager 2':'Only flyby Jan 24, 1986','Uranus Orbiter':'NASA flagship mission planned 2030s'},
discoveries:{'Ring Discovery':'1977 via stellar occultation (before Voyager)','Extreme Tilt':'Likely from giant ancient collision','No Internal Heat':'Unlike Neptune, emits almost no internal heat','Diamond Rain':'Methane converted to diamonds predicted in deep interior'},
funFact:'Uranus was the first planet discovered with a telescope (William Herschel, 1781). All 27 of its known moons are named after Shakespeare and Alexander Pope characters.'},

"Neptune":{type:'planet',typeBadge:'ICE GIANT',size:5.3,dist:1120,period:60190,color:0x3366ff,texture:'./assets/neptune.jpg',moons:'16',atmosphereColor:0x2255ff,
overview:'The most distant planet with the fastest winds in the solar system (2,100 km/h). Its moon Triton orbits backwards — a captured Kuiper Belt Object heading for eventual destruction.',
stats:{'Diameter':'49,244 km','Distance from Sun':'4.50 billion km (30.1 AU)','Day Length':'16h 6m','Year Length':'165 Earth years','Wind Speed':'Up to 2,100 km/h (fastest in solar system)'},
atmosphere:{'Composition':'H₂: 80%, He: 19%, CH₄: 1.5%','Temperature':'-218 °C'},
exploration:{'Voyager 2':'Only flyby Aug 25, 1989'},
discoveries:{'Triton Retrograde':'Captured from Kuiper Belt — only large retrograde moon','Active Geysers':'Nitrogen geysers on Triton (Voyager 2 1989)','Ring Arcs':'Bright arcs in rings caused by shepherd moon Galatea','Great Dark Spot':'Storm Earth-sized but disappeared between 1989 and 1994'},
funFact:'Neptune was predicted mathematically before anyone saw it. Le Verrier calculated its position from Uranus\'s orbital wobbles in 1846 — and observers found it within 1° of the prediction the first night they looked.'},

"Triton":{type:'planet',typeBadge:'MOON OF NEPTUNE',size:0.72,dist:1128,period:5.88,color:0xddccbb,texture:'',moons:'0',parent:'Neptune',
overview:'Neptune\'s largest moon — a captured Kuiper Belt Object orbiting backwards. Geologically active despite being -235°C, and destined to be torn apart by tidal forces in ~3.6 billion years.',
stats:{'Diameter':'2,706 km','Orbital Period':'5.88 days (retrograde)','Surface Temp':'-235 °C (coldest measured surface in solar system)','Albedo':'0.76 (bright nitrogen frost)'},
atmosphere:{'Thin N₂ Exosphere':'Pressure 0.000014 bar','Geysers':'Active nitrogen geysers 8+ km high'},
exploration:{'Voyager 2':'Only flyby Aug 25, 1989'},
discoveries:{'Retrograde Orbit':'Proof of captured origin from Kuiper Belt','Active Geysers':'Dark streaks from geyser deposits (Voyager 2)','Tidal Doom':'Will spiral inside Neptune\'s Roche limit in ~3.6 billion years','Polar Ice Cap':'Seasonal nitrogen frost cap'},
funFact:'In ~3.6 billion years, Triton will spiral inside Neptune\'s Roche limit and disintegrate into a spectacular ring system that may rival Saturn\'s in grandeur.'},

"Pluto":{type:'dwarf',typeBadge:'DWARF PLANET / KBO',size:0.65,dist:1300,period:90560,color:0xaaaaaa,texture:'./assets/pluto.jpg',moons:'5',
overview:'Once the ninth planet, now the most famous dwarf planet. New Horizons revealed a geologically active world with nitrogen ice mountains, a heart-shaped plain, and surprising complexity.',
stats:{'Diameter':'2,377 km (18.6% of Earth)','Surface Gravity':'0.62 m/s²','Distance from Sun':'5.9 billion km (39.5 AU)','Orbital Period':'248 Earth years','Largest Moon':'Charon (51% of Pluto\'s diameter)'},
atmosphere:{'Composition':'N₂: 98%, CH₄, CO','Surface Pressure':'~10 µbar','Haze':'Multiple blue haze layers (unexpected)'},
exploration:{'New Horizons':'First and only flyby Jul 14, 2015','Discovery':'Clyde Tombaugh, 1930','Reclassified':'IAU dwarf planet 2006'},
discoveries:{'Tombaugh Regio':'Heart-shaped nitrogen ice plain 1,000 km across','Water Ice Mountains':'Peaks up to 3,500 m','Cryovolcanoes':'Possible ice volcanoes Wright Mons and Piccard Mons','Haze':'Multi-layer nitrogen haze — surprisingly blue','Binary System':'Pluto-Charon orbit a point in space between them'},
funFact:'Pluto and Charon orbit a common center of gravity (barycenter) located in the empty space between them — not inside Pluto. They are sometimes called a binary dwarf planet system.'},

"Haumea":{type:'dwarf',typeBadge:'DWARF PLANET',size:0.55,dist:1360,period:103774,color:0xcccccc,texture:'./assets/moon.jpg',moons:'2',
overview:'A unique dwarf planet with an extreme elongated shape from its incredibly fast 3.9-hour rotation — the fastest spin rate of any large body in the solar system.',
stats:{'Longest Axis':'~2,322 km','Shortest Axis':'~996 km','Rotation':'3.9 hours (fastest large KBO)','Orbital Period':'283 Earth years','Ring':'Yes — discovered 2017'},
atmosphere:{'Surface':'Crystalline water ice','Temperature':'-241 °C'},
exploration:{'Discovery':'Mike Brown (USA) / José Ortiz (Spain), 2004–05'},
discoveries:{'Ring System':'Discovered via stellar occultation 2017','Collision Family':'Debris from ancient collision forms KBO family','Crystalline Ice':'Unexpectedly fresh water ice surface'},
funFact:'Haumea is stretched into an extreme egg shape — 2.5× longer than wide — by its 3.9-hour day. If it spun just 15% faster, it would fly apart.'},

"Makemake":{type:'dwarf',typeBadge:'DWARF PLANET',size:0.55,dist:1420,period:112897,color:0xbb9988,texture:'./assets/moon.jpg',moons:'1',
overview:'A classical Kuiper Belt Object and one of the largest dwarf planets, named after the creation deity of Easter Island\'s Rapa Nui people.',
stats:{'Diameter':'~1,430 km','Orbital Period':'309 Earth years','Moon':'MK2 — extremely dark (Hubble 2016)'},
atmosphere:{'Evidence':'Thin local methane atmosphere possible seasonally'},
exploration:{'Discovery':'Mike Brown et al., March 31, 2005 (Easter weekend)'},
discoveries:{'Dark Moon':'MK2 is extremely dark — stark contrast with bright Makemake','No Global Atmosphere':'Unlike Pluto, lacks global atmosphere','Tholins':'Organic compounds from radiation processing of surface ices'},
funFact:'Makemake was discovered around Easter 2005 and informally called "Easter Bunny" — leading to its naming after the Easter Island creation deity.'},

"Eris":{type:'dwarf',typeBadge:'DWARF PLANET',size:0.68,dist:1550,period:203830,color:0xdddddd,texture:'./assets/moon.jpg',moons:'1',
overview:'The most massive known dwarf planet — heavier than Pluto. Eris\'s 2005 discovery directly forced the IAU to define "planet" for the first time, demoting Pluto.',
stats:{'Diameter':'2,326 km','Mass':'1.66 × 10²² kg (27% more than Pluto)','Distance from Sun':'Up to 97.7 AU','Orbital Period':'557 Earth years','Moon':'Dysnomia'},
atmosphere:{'Surface':'Methane frost (albedo 0.96 — almost mirrors sunlight)','Temperature':'-231 °C'},
exploration:{'Discovery':'Mike Brown, Chad Trujillo, David Rabinowitz, 2005'},
discoveries:{'Planet Definition':'Discovery forced IAU to create dwarf planet category (August 2006)','Methane Frost':'Fresh reflective methane ice preserved by distance'},
funFact:'Eris was nicknamed "Xena" after the TV warrior princess. Its discovery proved that if Pluto is a planet, so is Eris — and possibly dozens more KBOs. The IAU created the dwarf planet category specifically in response.'},

"Halley's Comet":{type:'comet',typeBadge:'SHORT-PERIOD COMET',size:0.38,dist:450,period:27484,color:0x88bbff,texture:'./assets/moon.jpg',moons:'0',
overview:'The most famous comet — observed and recorded by humans for over 2,000 years. It appears every 75–76 years and is the source of two annual meteor showers.',
stats:{'Nucleus':'15 × 8 km, blacker than coal','Period':'~75–76 Earth years','Last Perihelion':'Feb 9, 1986','Next Perihelion':'~Jul 2061'},
atmosphere:{'Coma':'Up to 100,000 km wide','Tail':'Up to 100 million km','Composition':'Water ice, CO, CO₂, dust'},
exploration:{'Giotto (ESA)':'596 km flyby (1986) — first comet nucleus images'},
discoveries:{'Dark Nucleus':'Only 10–15% of surface is active','Meteor Showers':'Source of Eta Aquariids (May) and Orionids (October)','Historical Record':'Chinese records to 240 BC; Bayeux Tapestry (1066)'},
funFact:'Mark Twain was born during Halley\'s 1835 appearance and predicted he would "go out with it." He died April 21, 1910 — one day after the comet\'s perihelion passage.'},

"'Oumuamua":{type:'interstellar',typeBadge:'INTERSTELLAR OBJECT',size:0.32,dist:650,period:0,color:0x885544,texture:'',moons:'0',
overview:'The first known interstellar object passing through our solar system. Its extreme elongated shape and unexplained non-gravitational acceleration remain scientifically controversial.',
stats:{'Dimensions':'~400m × 40m estimated','Speed':'87.7 km/s (confirmed hyperbolic)','Discovered':'Oct 19, 2017 (Rob Weryk, Pan-STARRS)'},
atmosphere:{'Surface':'Dark organic irradiation mantle suspected'},
exploration:{'No Missions':'Detected too late; no spacecraft intercept possible'},
discoveries:{'No Outgassing':'No coma despite solar approach — unlike any comet','Excess Acceleration':'Cannot be explained by gravity or standard outgassing','Extreme Elongation':'Most elongated natural object ever observed'},
funFact:'\'Oumuamua\'s unexplained acceleration has been attributed to hydrogen ice, fractal dust, or even an alien light sail. As of today, no single hypothesis fully satisfies all observations.'},

"Borisov":{type:'comet',typeBadge:'INTERSTELLAR COMET',size:1.2,dist:720,period:0,color:0x99aacc,texture:'',moons:'0',
overview:'The first confirmed interstellar comet — discovered in 2019. Unlike the mysterious \'Oumuamua, Borisov behaved exactly like a normal comet, implying universal cometary chemistry across stars.',
stats:{'Nucleus Diameter':'~0.5 km','Discovered':'Aug 30, 2019 (Gennady Borisov, Ukraine)','Origin':'Confirmed interstellar (hyperbolic orbit)'},
atmosphere:{'Coma':'CO, H₂O detected — normal comet composition'},
exploration:{'Hubble':'High-resolution imaging','VLT':'Spectral analysis'},
discoveries:{'Universal Chemistry':'Composition nearly identical to Solar System comets','First Interstellar Comet':'Confirmed by hyperbolic orbit','CO Rich':'Higher CO ratio than most solar system comets'},
funFact:'Unlike the mysterious \'Oumuamua, Borisov was completely ordinary — cometing normally through our solar system. This suggests comet chemistry is universal, regardless of which star they come from.'},

// ── EXTRASOLAR OBJECTS ────────────────────────────────────────────────────

"Sagittarius A*":{type:'blackhole',typeBadge:'SUPERMASSIVE BLACK HOLE',size:10.0,dist:8800,period:0,color:0x000000,texture:'',moons:'0',
overview:'The 4-million-solar-mass black hole anchoring the center of the Milky Way. Its shadow was imaged by the Event Horizon Telescope in May 2022, confirming general relativity in the most extreme environment accessible to astronomy.',
stats:{'Mass':'4 million solar masses (8×10³⁶ kg)','Schwarzschild Radius':'~12 million km','Distance':'~26,000 light-years','S2 Orbital Period':'~16 years','EHT Resolution':'50 microarcseconds'},
atmosphere:{'Accretion':'Hot magnetized plasma spiraling near light-speed','Flares':'Infrared & X-ray flares every few hours from magnetic reconnection','Fermi Bubbles':'Two gamma-ray lobes 25,000 ly tall above/below galactic plane'},
exploration:{'EHT':'Event Horizon Telescope global array; first Sgr A* image May 12, 2022','GRAVITY Instrument':'ESO/VLTI detected orbiting hot spots at 30% speed of light (2018)','Chandra':'X-ray monitoring since 1999'},
discoveries:{'Event Horizon Shadow':'52-microarcsecond ring imaged (2022) — matches GR prediction within 10%','S2 Relativistic Orbit':'Gravitational redshift and Schwarzschild precession measured (2018 Nobel)','G2 Survival':'Gas cloud survived 2014 periapsis — revealed it had stellar core','Hot Spots':'Plasma blobs orbit Sgr A* in 45-min loop at 0.3c (GRAVITY 2018)'},
funFact:'The 2020 Nobel Prize was awarded for proving Sgr A* must be a black hole. Gas cloud G2 passed within 3,000 AU in 2014 and survived — because it had a hidden stellar core protecting it from tidal forces.'},

"Crab Pulsar":{type:'pulsar',typeBadge:'NEUTRON STAR PULSAR',size:2.2,dist:4000,period:0,color:0x88ccff,texture:'',moons:'0',
overview:'The spinning neutron star remnant of SN 1054 — a supernova witnessed in 1054 AD. It spins 30 times per second and powers the Crab Nebula through a relativistic wind carrying 100,000× the Sun\'s luminosity.',
stats:{'Spin Rate':'30.2 rotations/second (period: 33.1 ms)','Mass':'~1.4 solar masses','Radius':'~10 km','Age':'~970 years','Magnetic Field':'~10¹² Gauss','Wind Luminosity':'100,000× solar'},
atmosphere:{'Pulsar Wind Nebula':'Relativistic wind inflating Crab Nebula (11 ly across)','Beams':'Radio, optical, X-ray, gamma-ray pulses — all synced'},
exploration:{'Discovered':'1968 by Staelin & Reifenstein (radio pulses)','SN 1054':'Observed Jul 4, 1054 by Chinese, Japanese, Arab, and Ancestral Puebloan astronomers'},
discoveries:{'Glitches':'Sudden spin-up events prove superfluid neutron vortex core','Pair Production':'Gamma-ray beams create electron-positron pairs in magnetosphere','TeV Emission':'Gamma-rays above 1 TeV detected (MAGIC telescope 2011)'},
funFact:'SN 1054 was so bright Chinese astronomers recorded it visible in daylight for 23 days and at night for nearly 2 years. A Native American petroglyph in Chaco Canyon is believed to depict the new star beside a crescent Moon.'},

"Proxima Centauri":{type:'star',typeBadge:'RED DWARF STAR',size:4.5,dist:3400,period:0,color:0xff4422,texture:'',moons:'0',
overview:'The closest star to the Sun — a faint red dwarf 4.24 light-years away hosting at least two confirmed planets, one in the habitable zone. Violent superflares may challenge any potential life.',
stats:{'Distance':'4.24 light-years (1.30 pc)','Mass':'0.1221 solar masses','Luminosity':'0.00155 solar','Age':'~4.85 billion years','Type':'M5.5Ve flare star','Rotation':'~83 days'},
atmosphere:{'Stellar Activity':'Major flare every ~30 hours; UV radiation far exceeds Sun\'s','Habitable Zone':'0.04–0.08 AU'},
exploration:{'Discovery':'Robert Innes, Union Observatory, 1915','Proxima b':'Announced Aug 2016 (ESO radial velocity)','Proxima d':'Announced Feb 2022'},
discoveries:{'Proxima b':'~1.07 Earth masses in habitable zone — orbit 11.2 days','Proxima d':'~0.26 Earth masses, 5-day orbit inside habitable zone (2022)','Giant Superflare':'Event 10× more powerful than any solar flare recorded (May 2019)','X-ray Burst':'One flare in 2017 emitted ~100× the Sun\'s total energy in minutes'},
funFact:'Breakthrough Starshot proposes laser-driven light sails that could reach 20% of lightspeed and arrive at Proxima in 20 years. At chemical rocket speeds today, the trip would take ~70,000 years.'},

"Andromeda Galaxy":{type:'galaxy',subtype:'spiral',typeBadge:'SPIRAL GALAXY',size:32.0,dist:2500,period:0,color:0xddccbb,texture:'',moons:'0',
overview:'The nearest large galaxy — 2.537 million light-years away and approaching the Milky Way at ~110 km/s. The two galaxies will begin merging in ~4.5 billion years in one of the universe\'s most spectacular long-term events.',
stats:{'Distance':'2.537 million light-years','Diameter':'~220,000 light-years','Stars':'~1 trillion','Type':'SAb Spiral','Approach Speed':'~110 km/s toward Milky Way','Collision ETA':'~4.5 billion years'},
atmosphere:{'Dark Matter Halo':'Extends ~2 million light-years — already overlapping ours','Central BH':'~100–140 million solar masses'},
exploration:{'First Recorded':'Abd al-Rahman al-Sufi, 964 AD (Book of Fixed Stars)','Distance Measured':'Edwin Hubble, 1923 — proved external galaxies exist','Collision Confirmed':'Hubble proper-motion study, 2012'},
discoveries:{'Double Nucleus':'Two brightness peaks in core (P1, P2) — possibly binary black holes or eccentric stellar disc','Satellite Galaxies':'M32 and M110 are gravitationally bound','Stream Network':'Giant stellar streams from cannibalized dwarf galaxies (PAndAS survey)','Future Sky':'Will create giant elliptical galaxy "Milkomeda" in ~7 billion years'},
funFact:'When Andromeda merges with the Milky Way ~4.5 billion years from now, the night sky will be ablaze with new star clusters — but the odds of any two stars colliding are essentially zero. Galaxies are mostly empty space.'},

"Milky Way Core":{type:'star',typeBadge:'GALACTIC CORE BULGE',size:20.0,dist:8600,period:0,color:0xffcc55,texture:'',moons:'0',
overview:'The central bulge of the Milky Way — a dense, ancient stellar population surrounding Sagittarius A*. Crowded with stars 10 million times denser than our solar neighborhood, bathed in X-ray radiation.',
stats:{'Distance':'~26,000 light-years','Bulge Radius':'~6,000 light-years','Star Density':'Millions per cubic light-year at center','Central BH':'Sgr A* — 4 million solar masses','Fermi Bubbles':'±25,000 light-year gamma-ray lobes'},
atmosphere:{'Radiation Environment':'Hard X-ray and gamma-ray dominated','Molecular Clouds':'Central Molecular Zone — 10% of Galactic gas in <1% of area'},
exploration:{'Spitzer Space Telescope':'Near-IR mapping through dust veil','Chandra':'X-ray source catalog of the inner parsec','GRAVITY':'Milliarcsecond astrometry of stellar orbits'},
discoveries:{'Fermi Bubbles':'Discovered 2010 — remnants of past AGN activity from Sgr A*','Arches Cluster':'Densest known star cluster: 150+ massive stars in 1 light-year','Quintuplet Cluster':'Young massive cluster 30 light-years from Sgr A*','S-star Cluster':'20+ stars in tight orbits proving BH mass'},
funFact:'The Arches Cluster near the Galactic Center packs 150 of the Milky Way\'s most massive stars into a region smaller than the distance between the Sun and Alpha Centauri — making it the most star-packed place in the Galaxy.'},

// ── MOONS OF EARTH ────────────────────────────────────────────────────────────
"Luna":{type:'planet',typeBadge:'EARTH\'S MOON',size:0.85,dist:210,period:27.3,color:0xaaaaaa,texture:'./assets/moon.jpg',moons:'0',parent:'Earth',subtype:'luna',
overview:'Earth\'s only natural satellite — the fifth largest moon in the solar system and the only extraterrestrial body humans have walked on. Twelve Apollo astronauts explored its surface between 1969 and 1972.',
stats:{'Diameter':'3,474 km (27% of Earth)','Distance from Earth':'384,400 km average','Orbital Period':'27.3 Earth days','Surface Gravity':'1.62 m/s² (16.6% Earth)','Axial Tilt':'Tidally locked — same face always toward Earth','Age':'~4.51 billion years'},
atmosphere:{'Exosphere':'Sodium, potassium, water vapour — essentially a vacuum','Surface Temp':'-173°C (night) to +127°C (day)','Radiation':'No magnetic field — direct solar wind exposure'},
exploration:{'Luna 2':'First spacecraft to reach Moon, 1959','Apollo 11':'First human landing — Neil Armstrong & Buzz Aldrin, Jul 20, 1969','Apollo Program':'6 landings total; 12 humans walked the surface','Chang\'e 4':'First far-side landing, Jan 3, 2019','Artemis I':'Uncrewed lunar orbit test, Nov 2022','Artemis III':'Planned crewed south pole landing ~2026'},
discoveries:{'Water Ice':'Confirmed in permanently shadowed polar craters (LCROSS 2009, 382 kg debris plume)','Formation':'Giant Impact Hypothesis — Theia impacted early Earth ~4.51 billion years ago','Lunar Drift':'Moving away from Earth at 3.8 cm/year — Earth\'s day lengthens 1.4ms/century','Moonquakes':'Apollo seismometers detected quakes — Moon still tectonically active','Far Side':'Heavily cratered; no maria; first seen by Luna 3 (1959)'},
funFact:'The Moon is the reason Earth has stable seasons. Its gravitational pull keeps Earth\'s axial tilt locked near 23.5°. Without the Moon, Earth\'s tilt could chaotically vary between 0° and 85° over millions of years, making life as we know it impossible.'},

// ── MOONS OF MARS ─────────────────────────────────────────────────────────────
"Phobos":{type:'planet',typeBadge:'MOON OF MARS',size:0.32,dist:332,period:0.32,color:0x998877,texture:'',moons:'0',parent:'Mars',subtype:'phobos',
overview:'The larger of Mars\'s two tiny moons — orbiting Mars faster than Mars rotates. Heavily cratered and doomed: tidal forces are pulling it steadily inward toward certain destruction.',
stats:{'Dimensions':'26 × 22 × 18 km','Orbital Period':'7.65 hours — rises in west, sets in east','Distance from Mars':'9,376 km (closest moon to planet in solar system)','Albedo':'0.07 (blacker than coal)'},
atmosphere:{'Surface':'No atmosphere; pulverized regolith ~100 m deep'},
exploration:{'Mariner 9':'First detailed images 1971','Mars Express':'High-res imaging 2004–present','MMX':'JAXA sample return mission, 2026 launch target'},
discoveries:{'Stickney Crater':'9.4 km-wide impact nearly shattered Phobos','Tidal Decay':'Spiraling inward ~1.8 m/century — will crash or disintegrate in ~50 million years','Grooves':'Parallel grooves across surface — tidal stress fractures from Mars\'s gravity','Interior':'~30% empty space — possibly a rubble pile held together by loose regolith'},
funFact:'Phobos orbits so low and fast that from Mars\'s surface it rises in the west, crosses the sky in just 4 hours, and sets in the east — twice per Martian day. Jonathan Swift predicted two Martian moons in 1726, 151 years before their actual discovery.'},

"Deimos":{type:'planet',typeBadge:'MOON OF MARS',size:0.25,dist:334,period:1.26,color:0x887766,texture:'',moons:'0',parent:'Mars',subtype:'deimos',
overview:'The smaller, more distant of Mars\'s two moons — a smooth, dark body slowly drifting away from Mars. Deimos is so small that from Mars it appears as nothing more than a bright star.',
stats:{'Dimensions':'15 × 12 × 11 km','Orbital Period':'30.3 hours','Distance from Mars':'23,460 km','Named Craters':'Swift and Voltaire'},
atmosphere:{'Surface':'Extremely smooth — thick regolith blanket from ancient impacts'},
exploration:{'Mariner 9':'First images 1971','Viking Orbiters':'Mapping 1977'},
discoveries:{'Smooth Surface':'Unlike Phobos, ejecta falls back and fills craters — making it nearly featureless','Slow Retreat':'Unlike Phobos, Deimos is slowly moving away from Mars — may eventually escape','Origin Debate':'Captured asteroid or impact-ejected debris from Mars — not yet resolved'},
funFact:'In 1726 Jonathan Swift\'s "Gulliver\'s Travels" described two Martian moons with orbital periods of 10 and 21.5 hours. Phobos and Deimos, discovered 151 years later in 1877, have periods of 7.7 and 30.3 hours. Swift\'s prescience remains unexplained.'},

// ── ADDITIONAL JUPITER MOONS ──────────────────────────────────────────────────
"Callisto":{type:'planet',typeBadge:'MOON OF JUPITER',size:1.25,dist:612,period:16.69,color:0x887766,texture:'',moons:'0',parent:'Jupiter',subtype:'callisto',
overview:'Jupiter\'s second-largest moon and the most heavily cratered body in the solar system. A frozen, ancient world unchanged for 4 billion years — and surprisingly, a possible sub-surface ocean candidate.',
stats:{'Diameter':'4,821 km (slightly smaller than Mercury)','Orbital Period':'16.69 Earth days','Distance from Jupiter':'1,882,700 km','Surface Gravity':'1.24 m/s²','Age':'Surface ~4.0–4.5 billion years'},
atmosphere:{'Thin CO₂ Exosphere':'Detected by Galileo','Surface Temp':'-139°C average'},
exploration:{'Galileo':'Multiple close flybys; possible ocean evidence','JUICE':'ESA flyby during Jupiter approach 2031–2034'},
discoveries:{'Ancient Surface':'No tectonic activity — most primordial large surface in the solar system','Possible Ocean':'Magnetic field anomalies suggest a salty sub-surface ocean (Galileo)','Valhalla Basin':'4,000 km-wide multi-ring impact basin — one of the largest in the solar system','No Internal Differentiation':'Surprisingly mixed rock/ice throughout — no iron core'},
funFact:'Callisto is so heavily cratered that every patch of its surface has been struck multiple times. It has not changed significantly since the Late Heavy Bombardment ended 3.8 billion years ago — making it essentially a frozen photograph of the early solar system.'},

// ── ADDITIONAL SATURN MOONS ───────────────────────────────────────────────────
"Mimas":{type:'planet',typeBadge:'MOON OF SATURN',size:0.38,dist:787,period:0.94,color:0xccbbaa,texture:'',moons:'0',parent:'Saturn',subtype:'mimas',
overview:'Saturn\'s innermost major moon — famous for its enormous Herschel Crater that makes it resemble the Death Star. A 2023 re-analysis of Cassini data suggested a liquid water ocean lurking beneath its icy shell.',
stats:{'Diameter':'396 km','Orbital Period':'22.6 hours','Distance from Saturn':'185,520 km','Herschel Crater':'139 km wide — 35% of Mimas\'s own radius'},
atmosphere:{'Surface':'Pure water ice; negligible atmosphere','Temperature':'-209°C'},
exploration:{'Voyager 1':'Discovery of Herschel Crater, 1980','Cassini':'Thermal mapping and gravity measurements 2004–2017'},
discoveries:{'Ocean Evidence':'Cassini thermal data re-analysed 2023: liquid water ocean 20–30 km beneath the ice shell','Pac-Man Thermal Map':'Cassini 2010 revealed a bizarre Pac-Man-shaped warm thermal region','Herschel Impact':'The Herschel impact nearly shattered Mimas entirely','Resonance':'Maintains orbital resonances with Tethys and other moons'},
funFact:'Mimas was dismissed for decades as geologically dead. Then in 2023 astronomers re-examined old Cassini data and found its subtle wobble implies a liquid ocean barely 20 km beneath the ice — making it the most unexpected ocean world in the solar system.'},

"Dione":{type:'planet',typeBadge:'MOON OF SATURN',size:0.55,dist:788,period:2.74,color:0xddddd0,texture:'',moons:'0',parent:'Saturn',subtype:'dione',
overview:'Saturn\'s fourth-largest moon — geologically active with dramatic ice cliffs, tectonic fractures, and one of the thinnest oxygen atmospheres in the solar system. Evidence hints at a sub-surface ocean.',
stats:{'Diameter':'1,123 km','Orbital Period':'2.74 Earth days','Distance from Saturn':'377,396 km','Density':'1.48 g/cm³ (rock-ice mixture)'},
atmosphere:{'Thin O₂ Exosphere':'Detected by Cassini CAPS instrument, 2012'},
exploration:{'Cassini':'5 targeted close flybys; detected exosphere and photographed ice cliffs'},
discoveries:{'Ice Cliffs':'Bright ice scarps (wispy terrain) up to 500 m tall from ancient tectonic fracturing','Oxygen Exosphere':'One of only a handful of moons with detectable molecular oxygen','Sub-surface Ocean':'Gravity field suggests internal liquid water layer','Tectonic Activity':'Linear fracture networks indicate geologic forces still operating'},
funFact:'Dione\'s trailing hemisphere is laced with bright "wispy" streaks that puzzled astronomers for decades. Cassini revealed they are towering ice cliffs — hundreds of metres tall — exposed by ancient faulting, like a frozen, airless Grand Canyon stretched across a moon.'},

"Rhea":{type:'planet',typeBadge:'MOON OF SATURN',size:0.65,dist:789,period:4.52,color:0xddcccc,texture:'',moons:'0',parent:'Saturn',subtype:'rhea',
overview:'Saturn\'s second-largest moon — an icy body with a heavily cratered surface. In 2008 Cassini detected particle signatures hinting Rhea might be the only moon in the solar system with its own ring system.',
stats:{'Diameter':'1,527 km','Orbital Period':'4.52 Earth days','Distance from Saturn':'527,040 km','Surface Gravity':'0.264 m/s²'},
atmosphere:{'Thin O₂/CO₂ Exosphere':'Detected by Cassini'},
exploration:{'Voyager 1 & 2':'Flybys 1980–81','Cassini':'Multiple targeted flybys 2005–2015'},
discoveries:{'Possible Ring System':'Cassini detected electron depletions consistent with rings in 2008 — never visually confirmed','Asymmetric Cratering':'Leading hemisphere significantly more cratered from incoming debris','Wispy Terrain':'Similar ice cliff features to Dione','Two-Toned':'Bright rayed craters on dark background resemble Iapetus on smaller scale'},
funFact:'If confirmed, Rhea would be the only moon in the solar system with its own ring — a miniature mirror of what Saturn itself has. Cassini detected electron and ion patterns around Rhea in 2008 consistent with a debris disk, but no image has ever captured it directly.'},

"Iapetus":{type:'planet',typeBadge:'MOON OF SATURN',size:0.62,dist:791,period:79.3,color:0x997744,texture:'',moons:'0',parent:'Saturn',subtype:'iapetus',
overview:'Saturn\'s most enigmatic moon — half pitch-black, half brilliant white. Giovanni Cassini noted in 1671 that it was only visible from one side of Saturn. Three hundred years passed before the mystery was solved.',
stats:{'Diameter':'1,469 km','Orbital Period':'79.3 Earth days (tidally locked)','Distance from Saturn':'3,560,820 km','Dark Region Albedo':'0.03–0.05 (darker than coal)','Bright Region Albedo':'0.5–0.6 (bright as snow)'},
atmosphere:{'No Atmosphere':'Temperature ranges from -143°C (bright) to -173°C (dark side)'},
exploration:{'Giovanni Cassini':'Discovered asymmetry in 1671','Cassini Spacecraft':'Close flyby Sept 2007 — revealed equatorial ridge'},
discoveries:{'Two-Toned Cause':'Dark material swept up from outer moons + thermal segregation darkens leading hemisphere further','Equatorial Ridge':'20 km-tall mountains running 1,300 km — possibly a collapsed ancient ring','Walnut Shape':'No other moon has this walnut-seam appearance — origin still debated','Ancient Surface':'Heavily cratered — surface dates to the Late Heavy Bombardment'},
funFact:'Giovanni Cassini discovered in 1671 that Iapetus was only visible on one side of its orbit around Saturn. The mystery took 300+ years to solve: the dark hemisphere sweeps up dark dust from outer moons, which solar heating then darkens further. The contrast between hemispheres is greater than any other body in the solar system.'},

// ── MOON OF URANUS ────────────────────────────────────────────────────────────
"Miranda":{type:'planet',typeBadge:'MOON OF URANUS',size:0.38,dist:961,period:1.41,color:0xaabbcc,texture:'',moons:'0',parent:'Uranus',subtype:'miranda',
overview:'Uranus\'s smallest major moon — but the most geologically tormented body in the solar system. Its surface looks shattered and reassembled, with the highest known cliff face in the solar system.',
stats:{'Diameter':'472 km','Orbital Period':'1.41 Earth days','Distance from Uranus':'129,390 km','Verona Rupes':'~20 km cliff — solar system\'s tallest known scarp'},
atmosphere:{'Surface':'Water ice, CO₂ ice, complex organics; essentially no atmosphere'},
exploration:{'Voyager 2':'Only flyby ever — Jan 24, 1986 — very close approach'},
discoveries:{'Verona Rupes':'~20 km vertical cliff — free-fall from the top takes ~12 minutes in Miranda\'s low gravity','Coronae':'Giant rectangular terrain patches (Arden, Elsinore, Inverness) — unique in solar system','Chaotic Geology':'Terrain looks violently disrupted — ancient orbital resonance with Umbriel suspected','Patchwork Surface':'Oldest and youngest terrain types jumbled together — possibly reassembled after ancient collision'},
funFact:'If you stepped off Miranda\'s Verona Rupes — the tallest cliff in the solar system at ~20 km — the fall would take about 12 minutes before you hit the bottom, because Miranda\'s gravity is so weak. On Earth, the same height would take just 64 seconds.'},

// ── MOON OF PLUTO ─────────────────────────────────────────────────────────────
"Charon":{type:'planet',typeBadge:'MOON OF PLUTO',size:0.38,dist:1302,period:6.39,color:0xaaaaaa,texture:'./assets/moon.jpg',moons:'0',parent:'Pluto',subtype:'charon',
overview:'Pluto\'s enormous moon — half the size of Pluto, making the pair a true binary dwarf planet system. Both orbit a gravitational center located in empty space between them. New Horizons revealed a world of canyons, cliffs, and a mysterious dark red pole.',
stats:{'Diameter':'1,212 km (51% of Pluto)','Orbital Period':'6.39 Earth days (mutually tidally locked)','Distance from Pluto':'19,571 km','Density':'1.70 g/cm³'},
atmosphere:{'Surface':'Water ice with ammonia hydrates; thin tenuous atmosphere seasonally'},
exploration:{'New Horizons':'First close-up images Jul 14, 2015'},
discoveries:{'Mordor Macula':'Dark red polar cap — Pluto\'s escaping nitrogen atmosphere freezes onto Charon\'s pole in winter','Serenity Chasma':'Canyon system 9 km deep and longer than Earth\'s Grand Canyon','Mutual Tidal Lock':'Both Pluto and Charon always show the same face to each other — uniquely bilateral in the solar system','Formation':'Giant impact on early Pluto, analogous to Earth\'s Moon-forming event'},
funFact:'Pluto and Charon orbit a gravitational center located in empty space between them — not inside either body. They are the only known binary dwarf planet pair, and arguably neither one truly "orbits" the other.'},

// ── NEW STARS ─────────────────────────────────────────────────────────────────
"Betelgeuse":{type:'star',typeBadge:'RED SUPERGIANT',size:24.0,dist:4500,period:0,color:0xff4400,texture:'',moons:'0',
overview:'One of the largest and most luminous stars visible to the naked eye — a red supergiant nearing the end of its life. When it finally explodes as a supernova, it will briefly outshine the full Moon and be visible in daylight.',
stats:{'Diameter':'~1.2 billion km (700–1,000× the Sun)','Distance':'~700 light-years','Luminosity':'~100,000× solar','Temperature':'~3,500 K (surface)','Mass':'~16–19 solar masses','Stage':'Red supergiant — pre-supernova'},
atmosphere:{'Surface Convection':'Giant convective cells the size of the solar system','Mass Loss':'~1 solar mass of gas ejected in the 2019–20 Great Dimming event'},
exploration:{'The Great Dimming':'2019–2020 dramatic fading caused by a surface mass ejection — confirmed by ALMA 2022','VLTI Imaging':'Direct surface imaging showing giant asymmetric convective plumes'},
discoveries:{'Great Dimming Cause':'A surface convection cell ejected ~2×10¹¹ kg of gas, cooling and forming a dust cloud (ALMA 2022)','Confirmed Pre-Supernova':'Will explode within the next ~100,000 years','Supernova Brightness':'Will reach ~magnitude −12 (brighter than crescent Moon) for weeks','Neutrino Signal':'Neutrinos from the collapse will arrive ~3 hours BEFORE the visible light'},
funFact:'When Betelgeuse explodes, Earth will detect a burst of neutrinos roughly 3 hours before any visible light — because neutrinos escape instantly while light has to fight through the collapsing star\'s mass. We will have a 3-hour neutrino warning before the sky lights up.'},

"Sirius":{type:'star',typeBadge:'BINARY STAR SYSTEM',size:13.0,dist:3600,period:0,color:0xaaddff,texture:'',moons:'0',
overview:'The brightest star in Earth\'s night sky — a blue-white main sequence star 8.6 light-years away, orbited by a white dwarf companion. Sirius B was the first white dwarf ever discovered.',
stats:{'Distance':'8.6 light-years','Luminosity':'25.4× solar (Sirius A)','Mass':'2.02× solar (A), 1.02× solar (B)','Temperature':'9,940 K (A) / 25,200 K (B)','Orbital Period':'50.1 years (A around B)','Type':'A1V main sequence + DA2 white dwarf'},
atmosphere:{'Sirius B':'White dwarf — Earth-sized remnant of former red giant; no fusion'},
exploration:{'Ancient Egypt':'Heliacal rising of Sirius marked the annual Nile flood; built into pyramid alignments','Sirius B Discovery':'Alvan Graham Clark, 1862 — first white dwarf found'},
discoveries:{'Sirius B':'First observed white dwarf — proved stellar evolution endpoint (1862)','High Proper Motion':'Moving toward the solar system at 5.5 km/s — will be slightly brighter in ~60,000 years','Luminosity':'10× more luminous than thought by ancient astronomers',
'Dog Star':'Rise at dawn historically marked beginning of summer — "dog days" etymology'},
funFact:'Sirius B — the faint white dwarf companion — packs 1.02 solar masses into a sphere the size of Earth. A teaspoon of its material weighs ~5 tonnes. It was the first white dwarf ever discovered and directly proved that stars can die into dense, exotic remnants.'},

// ── NEBULAE ───────────────────────────────────────────────────────────────────
"Orion Nebula":{type:'star',typeBadge:'EMISSION NEBULA',size:18.0,dist:5500,period:0,color:0xff6622,texture:'',moons:'0',subtype:'nebula',
overview:'The closest and most studied star-forming region — a stellar nursery 1,344 light-years away where hundreds of stars are actively being born. Visible to the naked eye as the "middle star" in Orion\'s sword.',
stats:{'Distance':'1,344 light-years','Diameter':'~24 light-years','Gas Mass':'~2,000 solar masses','Young Stars':'~700 protostars and newborn stars','Proplyds':'~180 protoplanetary disk systems imaged by Hubble (1993)'},
atmosphere:{'Composition':'Ionized hydrogen, oxygen, nitrogen, sulfur','Temperature':'~10,000 K (ionized gas) / ~10 K (dense cores)','Powered By':'Trapezium Cluster — four massive young stars'},
exploration:{'Hubble 1993':'First resolved protoplanetary disks (proplyds) in any star-forming region','JWST 2022':'Most detailed star-formation image ever — revealed hidden stars inside the nebula'},
discoveries:{'Proplyds':'Planet-forming disks caught mid-formation (Hubble 1993)','JuMBOs':'Free-floating Jupiter-mass binary pairs — no theory predicts their existence (JWST 2023)','Trapezium Cluster':'Four massive O-type stars ionizing the entire nebula','Brown Dwarf Desert':'Fewer brown dwarfs than predicted — formation models need revision'},
funFact:'JWST\'s 2022 Orion Nebula images revealed 40 "JuMBOs" — pairs of Jupiter-mass objects floating freely through space, not bound to any star, tumbling through the nebula together. No theory of planet formation predicted these objects. They remain completely unexplained.'},

"Pillars of Creation":{type:'star',typeBadge:'STELLAR NURSERY',size:15.0,dist:6000,period:0,color:0xaa6644,texture:'',moons:'0',subtype:'nebula',
overview:'The most iconic image in astronomy — three towering columns of gas and dust inside the Eagle Nebula (M16) where new stars are being born. Hubble\'s 1995 image is arguably the most recognisable photograph ever taken by a telescope.',
stats:{'Distance':'~6,500–7,000 light-years','Tallest Pillar':'~4 light-years','Location':'Eagle Nebula (M16), Serpens constellation','Nebula Diameter':'~70 light-years'},
atmosphere:{'Composition':'Cool hydrogen gas and dust','Process':'Photoionization erosion — UV from nearby massive stars slowly eats the pillars','EGGs':'Evaporating Gaseous Globules — star embryos at the pillar tips'},
exploration:{'Hubble 1995':'Iconic first image that changed public perception of astronomy','Hubble 2014':'20th anniversary sharp reimage in visible and near-IR','JWST 2022':'Infrared image revealed hundreds of previously hidden forming stars inside the pillars'},
discoveries:{'EGGs':'Evaporating Gaseous Globules at tips — star embryos being slowly uncovered','New Stars':'JWST confirmed many new stars forming inside the pillars, invisible to Hubble','Possible Destruction':'A nearby supernova ~8,000 years ago may have already destroyed the pillars — the light from that event hasn\'t reached us yet','Young Cluster':'M16 cluster of hot stars responsible for the erosion'},
funFact:'The Pillars of Creation may no longer exist. Evidence suggests a shock wave from a nearby supernova — which exploded ~8,000 years ago — is hurtling toward the pillars at 60,000 km/h. The light from their destruction hasn\'t reached Earth yet. In about 1,000 years, they\'ll simply be gone.'},

"Helix Nebula":{type:'star',typeBadge:'PLANETARY NEBULA',size:14.0,dist:6800,period:0,color:0x3366ff,texture:'',moons:'0',subtype:'nebula',
overview:'The closest planetary nebula to Earth — nicknamed the "Eye of God." A shell of ionized gas expelled by a dying Sun-like star, offering a preview of our own Sun\'s fate in ~5 billion years.',
stats:{'Distance':'~650 light-years','Diameter':'~2.5 light-years','Central Star':'White dwarf at ~120,000 K','Age':'~10,600 years since gas was expelled','Angular Size':'Larger than the Full Moon in the sky'},
atmosphere:{'Inner Zone':'Ionized oxygen (blue-green glow)','Outer Zone':'Ionized hydrogen and nitrogen (red glow)','Knots':'~20,000 cometary knots — gaseous structures each larger than our solar system'},
exploration:{'Hubble 1996':'Resolved ~20,000 individual cometary knots in the nebula shell','Spitzer 2001':'Detected an infrared-excess dust disk around the central white dwarf'},
discoveries:{'Cometary Knots':'~20,000 tadpole-shaped gaseous structures, each the size of our solar system','Dust Disk':'Infrared excess implies an asteroid belt survived the star\'s death explosion','Two-Shell Structure':'Two overlapping shells from separate ejection events create the "eye" appearance','Sun\'s Future':'Most detailed look at what our solar system will become'},
funFact:'Every one of the Helix Nebula\'s ~20,000 "cometary knots" is larger than our entire solar system from the Sun to Neptune. Their tails all point directly away from the central dying star, pushed outward by radiation pressure — like a crowd of 20,000 people all pointing toward the same exit.'},

// ── COSMIC SCALE OBJECTS ──────────────────────────────────────────────────────
"Laniakea":{type:'galaxy',subtype:'elliptical',typeBadge:'SUPERCLUSTER',size:30.0,dist:7500,period:0,color:0xffddaa,texture:'',moons:'0',
overview:'Our home supercluster — a massive cosmic structure 520 million light-years across containing over 100,000 galaxies, including the Milky Way. Named "Laniakea" (Hawaiian: immeasurable heaven) in 2014.',
stats:{'Diameter':'520 million light-years','Mass':'~10¹⁷ solar masses','Galaxies':'~100,000 including Milky Way','Our Location':'On the outskirts, near the Virgo Cluster','Neighbors':'Perseus-Pisces and Coma Superclusters'},
atmosphere:{'Great Attractor':'~250 million solar-mass concentration toward which all Laniakea galaxies flow','Cosmic Web Position':'Laniakea sits at intersection of large-scale filaments'},
exploration:{'Discovery':'Brent Tully et al., 2014 — used galaxy velocity flows to define precise boundaries','Method':'Mapped from galaxies\' peculiar velocities (motion beyond Hubble expansion)'},
discoveries:{'Great Attractor':'Milky Way flows toward a hidden mass concentration at ~600 km/s (behind the galactic dust plane)','3D Boundary':'First precisely defined supercluster boundary in astronomical history','Scale Hierarchy':'Laniakea is itself part of the larger Pisces-Cetus Supercluster Complex'},
funFact:'The entire Laniakea Supercluster — 100,000 galaxies — is flowing toward a region called the Great Attractor at ~600 km/s. The Great Attractor hides behind the Milky Way\'s dust plane, which obscures our view of it entirely. We know it exists only because of its gravitational pull on everything around it.'},

"Dark Matter":{type:'blackhole',typeBadge:'INVISIBLE MASS',size:12.0,dist:9200,period:0,color:0x221133,texture:'',moons:'0',
overview:'A mysterious invisible substance making up ~27% of the universe\'s total energy content. It neither emits, absorbs, nor reflects light — yet its gravity structures galaxies, clusters, and the entire cosmic web.',
stats:{'Fraction of Universe':'~26.8% of total energy-mass','Ratio':'~5 kg dark matter for every 1 kg of ordinary atoms','Evidence':'Galaxy rotation curves, gravitational lensing, CMB anisotropies, large-scale structure','Candidates':'WIMPs, axions, sterile neutrinos, primordial black holes'},
atmosphere:{'Detection':'No direct detection despite XENON, LUX, PandaX, LHC searches','Interaction':'Gravitational only — does not interact electromagnetically'},
exploration:{'Bullet Cluster':'Best direct evidence — two clusters collided, dark and ordinary matter separated (Chandra 2006)','Vera Rubin\'s Work':'Galaxy rotation curves 1970s proved invisible mass required','LHC':'No dark matter particles produced in proton collisions to date'},
discoveries:{'Galaxy Halos':'Every galaxy embedded in a dark matter halo extending far beyond visible stars','Bullet Cluster':'Direct proof of separation from ordinary matter in cluster collision (2006)','Cosmic Web Scaffold':'Dark matter filaments form the skeleton on which all visible structure hangs','Dwarf Galaxies':'Some dwarf galaxies are >99.9% dark matter by mass'},
funFact:'Vera Rubin spent the 1970s measuring how fast stars orbit galaxies. Every galaxy rotated at nearly the same speed at all radii — impossible unless enormous amounts of invisible mass existed far beyond the visible stars. Her meticulous work established dark matter beyond doubt, yet she never received the Nobel Prize.'},

"Dark Energy":{type:'blackhole',typeBadge:'COSMIC FORCE',size:10.0,dist:9500,period:0,color:0x110022,texture:'',moons:'0',
overview:'The most mysterious component of the universe — an unknown energy filling all of space, causing its expansion to accelerate. Makes up ~68% of the universe\'s total content. It was not predicted, not detected directly, and remains entirely unexplained.',
stats:{'Fraction of Universe':'~68.3% of total energy-mass content','Discovery':'1998 — Perlmutter, Schmidt & Riess (Nobel Prize 2011)','Equation of State':'w ≈ −1 (consistent with a cosmological constant)','Effect':'Universal expansion has been accelerating for the last ~5 billion years'},
atmosphere:{'Nature':'Possibly vacuum energy — quantum fluctuations of empty space','The Problem':'Quantum field theory predicts a vacuum energy 10¹²⁰× too large — "worst prediction in physics"'},
exploration:{'Supernova Cosmology Project':'1998 Type Ia supernovae revealed the universe is accelerating, not decelerating','Planck Satellite':'Precise measurement of dark energy density','DESI 2024':'First hints dark energy strength may vary over cosmic time'},
discoveries:{'Accelerating Expansion':'1998 Nobel discovery from distant Type Ia supernovae acting as standard candles','Cosmological Constant':'Einstein\'s "greatest blunder" may be correct after all','DESI 2024':'Hints that w may change over time — would require entirely new physics if confirmed','Future Universe':'If dark energy continues, distant galaxies will eventually recede faster than light — causally disconnected from us forever'},
funFact:'In 2024 the DESI experiment — using 40 million galaxies — released early results suggesting dark energy\'s strength may not be constant, but has weakened slightly over cosmic time. If confirmed, this would overturn the standard cosmological model and require entirely new physics beyond Einstein\'s equations.'},

"Cosmic Microwave Background":{type:'galaxy',subtype:'irregular',typeBadge:'RELIC RADIATION',size:20.0,dist:9800,period:0,color:0xffddbb,texture:'',moons:'0',
overview:'The afterglow of the Big Bang — microwave radiation released 380,000 years after the universe began, when it cooled enough for electrons and protons to combine into atoms. The oldest light in the universe, carrying a detailed snapshot of the infant cosmos.',
stats:{'Temperature':'2.7255 K (−270.42°C) — almost perfectly uniform','Redshift':'z ≈ 1,100','Origin Time':'380,000 years after the Big Bang','Discovered':'1965 by Penzias & Wilson (Nobel 1978)','Anisotropy':'Temperature varies by only 1 part in 100,000'},
atmosphere:{'Fluctuations':'Temperature variations encode the seeds of all galaxies and clusters','Polarization':'E-mode polarization maps baryon acoustic oscillations — a "cosmic ruler"'},
exploration:{'Penzias & Wilson':'Accidental discovery 1964 using Bell Labs radio telescope; Nobel 1978','COBE':'First mapped CMB fluctuations; Nobel 2006','WMAP':'Precise map 2001–2010; confirmed universe is flat to within 0.4%','Planck':'Most detailed CMB map 2013–2018; cosmological parameters to 1% precision'},
discoveries:{'Flat Universe':'CMB confirms universe has zero curvature — total energy density = critical density','Precise Cosmology':'Measured: 5% ordinary matter, 27% dark matter, 68% dark energy','Hubble Tension':'CMB-based H₀ (67.4) disagrees with distance-ladder H₀ (73.5) — may require new physics','Inflation Fingerprint':'CMB patterns are consistent with quantum fluctuations stretched by cosmic inflation'},
funFact:'The static on old analog televisions — the "snow" when no channel is tuned — was partly the Cosmic Microwave Background. A few percent of that electromagnetic noise was photons from the Big Bang, 13.8 billion years old, arriving at your TV antenna from the edge of the observable universe.'},

// ── DISTANT SOLAR SYSTEM BODIES ───────────────────────────────────────────────
"Sedna":{type:'dwarf',typeBadge:'EXTREME DWARF PLANET',size:0.52,dist:1750,period:4404000,color:0xff4422,texture:'./assets/moon.jpg',moons:'0',
overview:'The most distant known dwarf planet — blood-red and extreme, orbiting the Sun so far out that its existence defies current solar system models. Its orbit is the primary clue pointing to a possible undiscovered Planet Nine.',
stats:{'Diameter':'~995 km','Perihelion':'76 AU (closest point — next in 2076)','Aphelion':'~937 AU (farthest — recedes beyond Neptune for 11,400 years)','Color':'Reddest large body in the solar system','Period':'~11,400 Earth years'},
atmosphere:{'Surface':'Methane, nitrogen, water ice; darkened by tholin organic coatings','Temperature':'-240°C'},
exploration:{'Discovery':'Mike Brown, Chad Trujillo, David Rabinowitz — Nov 14, 2003 (Palomar Observatory)'},
discoveries:{'Anomalous Orbit':'Far too distant to be perturbed by Neptune — original orbit mechanism unknown','Planet Nine Clue':'Orbit clusters with other extreme TNOs — strongest statistical evidence for unseen massive planet','Inner Oort Cloud':'First confirmed object potentially from the Inner Oort Cloud','No Satellite':'Unexpectedly no moon despite careful searches — no tidal deceleration'},
funFact:'From Sedna at perihelion, the Sun — despite being the brightest object in the sky — is so distant that you could completely cover it with the head of a pin held at arm\'s length. At aphelion, 937 AU away, the Sun is merely the brightest star in a sky full of stars.'},

"Arrokoth":{type:'dwarf',typeBadge:'KUIPER BELT OBJECT',size:0.3,dist:1720,period:297620,color:0xcc9966,texture:'',moons:'0',
overview:'The most distant object ever visited by a spacecraft — a pristine contact binary nicknamed "Snowman" that overturned our understanding of how planets first form. New Horizons flew past on January 1, 2019.',
stats:{'Dimensions':'36 × 20 × 10 km','Distance at Flyby':'~44 AU from Sun','Flyby Date':'Jan 1, 2019 (New Horizons; 3,500 km closest approach)','Color':'Uniformly red-orange (tholins throughout)','Age':'4.5 billion years — essentially pristine'},
atmosphere:{'Surface':'Organic tholin compounds over water ice','Temperature':'-230°C'},
exploration:{'New Horizons':'First flyby of a Kuiper Belt Object — Jan 1, 2019'},
discoveries:{'Contact Binary':'Two lobes gently touching — formed from a low-velocity collision','Pristine Composition':'Uniformly red, indicating complex organics (tholins) throughout','Formation Clues':'Supports "pebble accretion" model of planet formation','No Satellites':'Despite careful searches, no moons found — suggests gentle formation'},
funFact:'Arrokoth is a contact binary — two distinct lobes gently touching each other. This shape could only have formed from a very low-velocity collision, providing strong evidence for the "pebble accretion" model of planet formation, where small objects slowly coalesce rather than violently colliding.'}

,

// ══════════════════════════════════════════════════════════════════════════
//  KNOWN GALAXIES OF THE UNIVERSE — REAL ASTRONOMICAL DATA
// ══════════════════════════════════════════════════════════════════════════

"Triangulum Galaxy":{type:'galaxy',subtype:'spiral',typeBadge:'SPIRAL GALAXY M33',size:24.0,dist:2600,period:0,color:0xbbddff,moons:'0',subtype:'spiral',
overview:'The third-largest galaxy in the Local Group — 2.73 million light-years away. Unlike our own Milky Way and Andromeda, it has no central bulge or supermassive black hole, just an open, luminous spiral arm structure.',
stats:{'Distance':'2.73 million light-years','Diameter':'~61,000 light-years','Stars':'~40 billion','Type':'SAcd (loose spiral, no central bulge)','Radial Velocity':'−179 km/s (approaching)','Central Black Hole':'None confirmed (upper limit: <1,500 solar masses)','Satellites':'Several dwarf spheroidals'},
atmosphere:{'Star Formation':'Active — H II regions scattered throughout arms','Notable Nebula':'NGC 604 — 1,300× more luminous than Orion Nebula; one of the largest HII regions known','Gas Fraction':'High — ideal for extended star formation'},
exploration:{'Earliest Record':'Guillaume Le Gentil, 1749','Distance Measured':'Edwin Hubble, Cepheid variables 1920s','JWST 2023':'Resolved individual stars even in the disk spiral arms'},
discoveries:{'Giant HII Region':'NGC 604 — one of the largest star-forming regions in the Local Group','No SMBH':'First large galaxy without a confirmed central supermassive black hole','Future Merger':'Will merge with Milky Way-Andromeda system in ~5 billion years','Closest Spiral':'Third nearest galaxy, close enough to resolve individual supergiant stars'},
funFact:'NGC 604 inside Triangulum is a stellar nursery 1,300 times more luminous than the Orion Nebula. It could fit 200 Orion Nebulae inside it. It contains over 200 of the hottest type-O stars known, illuminating a region 40 times wider than Orion.'},

"LMC":{type:'galaxy',subtype:'irregular',typeBadge:'LARGE MAGELLANIC CLOUD',size:18.0,dist:2800,period:0,color:0xffddaa,moons:'0',subtype:'irregular',
overview:'The largest satellite galaxy of the Milky Way — a gravitationally disturbed irregular galaxy 160,000 light-years away, visible to the naked eye from the Southern Hemisphere. Site of SN 1987A — the nearest supernova in 383 years.',
stats:{'Distance':'160,000 light-years','Diameter':'~14,000 light-years','Stars':'~30 billion','Type':'Irregular (disturbed by SMC and MW tidal forces)','Separation from SMC':'~75,000 light-years','Orbital Period':'~1.5 billion years around Milky Way'},
atmosphere:{'Star Formation':'30 Doradus (Tarantula Nebula) — most active star-forming region in the Local Group','Supernova':'SN 1987A — first naked-eye supernova since 1604 (detected Feb 23, 1987)','Tidal Bridge':'Magellanic Stream — a ribbon of gas 180° across the sky pulled out by tidal interaction'},
exploration:{'Ferdinand Magellan':'Named after, though observed since ancient times in Southern Hemisphere','SN 1987A':'Neutrino burst detected 3 hours before visible light — first direct proof of neutrino emission from a stellar collapse','Hubble':'Resolved the shock ring around SN 1987A in precise detail'},
discoveries:{'SN 1987A Neutron Star':'Compact object finally detected by JWST inside the expanding debris ring (2024)','Tarantula Nebula':'30 Doradus contains R136a1 — one of the most massive known stars (~200+ solar masses)','Runaway Stars':'Evidence of hypervelocity stars ejected from LMC core by ancient black hole event','Infall Confirmed':'LMC is on its first approach toward Milky Way — not in a stable orbit'},
funFact:'SN 1987A in the LMC was the nearest supernova in almost 400 years. Neutrino detectors around the world recorded a 13-second burst of 25 antineutrinos — carrying 99% of the energy of the collapse — 3 hours BEFORE anyone saw the star brighten in visible light. This directly confirmed a half-century-old prediction from stellar physics.'},

"SMC":{type:'galaxy',subtype:'irregular',typeBadge:'SMALL MAGELLANIC CLOUD',size:14.0,dist:2850,period:0,color:0xccbbff,moons:'0',subtype:'irregular',
overview:'The second-largest Milky Way satellite galaxy — 200,000 light-years away and tidally distorted into an irregular form by gravitational forces. The SMC was historically used to establish the cosmic distance ladder via Cepheid variables.',
stats:{'Distance':'~200,000 light-years','Diameter':'~7,000 light-years','Stars':'~3 billion','Type':'Irregular (SB(s)m — weakly barred)','Orbital Link':'Tidally bound to both LMC and Milky Way'},
atmosphere:{'Star Formation':'Lower metallicity than LMC — a gold mine for studying star formation at primitive chemical compositions','Wing':'Gas bridge to the LMC — actively forming stars along the bridge','Metallicity':'~0.2 solar — a proxy for early-universe star formation conditions'},
exploration:{'Henrietta Swan Leavitt':'1908 — discovered period-luminosity relationship of Cepheid variables in the SMC, establishing the cosmic distance ladder','Edwin Hubble':'Used Leavitt\'s calibration to measure distance to Andromeda (1923)'},
discoveries:{'Cepheid Law':'Henrietta Leavitt discovered that a star\'s period directly reveals its luminosity — the basis of extragalactic distance measurement','Low Metallicity':'A natural laboratory for studying conditions in the early universe when metals were scarce','Binary Merger':'SMC structure suggests it may itself be a merger of two smaller dwarf galaxies'},
funFact:'Henrietta Swan Leavitt, a "human computer" at Harvard, discovered the Cepheid period-luminosity law from SMC data in 1908. Edwin Hubble applied her calibration to measure the distance to Andromeda in 1923 — proving external galaxies exist. She was never awarded the Nobel Prize, though colleagues later nominated her (she died in 1921 before it could be awarded).'},

"M87 Galaxy":{type:'galaxy',subtype:'elliptical',typeBadge:'GIANT ELLIPTICAL / VIRGO A',size:30.0,dist:3200,period:0,color:0xffe8cc,moons:'0',subtype:'elliptical',
overview:'A colossal elliptical galaxy 53.5 million light-years away at the heart of the Virgo Cluster. Home to the first-ever photographed black hole (M87*) and a 5,000-light-year relativistic jet visible even in small telescopes.',
stats:{'Distance':'53.5 million light-years','Diameter':'~120,000 light-years (but stellar halo extends 800,000 ly)','Stars':'~1 trillion','Central Black Hole':'M87* — 6.5 billion solar masses','Jet Length':'~5,000 light-years at near-light-speed','Type':'E0p — giant elliptical with active nucleus'},
atmosphere:{'Jet':'Plasma moving at 99.9% of light speed, visible from optical to gamma-ray wavelengths','X-ray Halo':'Giant hot gas halo at 10–30 million K surrounding the galaxy','Globular Clusters':'12,000+ globular clusters — far more than the Milky Way\'s ~150'},
exploration:{'EHT 2019':'First direct image of a black hole shadow — M87* (Apr 10, 2019)','EHT 2021':'Polarized light images reveal magnetic field structure near event horizon','Hubble':'Jet and stellar velocity measurements','Chandra':'X-ray structure of jet and hot gas'},
discoveries:{'First Black Hole Photo':'55 µas ring imaged by EHT — April 10, 2019 — one of humanity\'s most significant discoveries','Jet Discovery':'H.D. Curtis, 1918 — first known AGN jet, 100 years before EHT','Polarized Ring':'EHT 2021 — magnetic fields at event horizon match magnetically arrested disk model','Mass Measurement':'6.5 billion solar masses confirmed — billions of Earths converted to pure energy every year'},
funFact:'The M87* black hole image took the combined processing power of petabytes of data recorded by radio telescopes on six continents and flown to a central location on hard drives — because the data rate was too fast to transmit over the internet. The image you can see represents humanity\'s first look at the shadow of a black hole.'},

"Whirlpool Galaxy":{type:'galaxy',subtype:'merger',typeBadge:'INTERACTING SPIRAL M51',size:24.0,dist:3400,period:0,color:0xddccff,moons:'0',subtype:'merger',
overview:'The Whirlpool Galaxy — a grand design spiral 23 million light-years away currently merging with NGC 5195. The first galaxy classified as a spiral (Lord Rosse, 1845), its collision-triggered star formation makes it one of the most photographed objects in astronomy.',
stats:{'Distance':'23 million light-years','Diameter':'~76,000 light-years (M51a)','Companion':'NGC 5195 — irregular dwarf galaxy, already passed through once','Type':'SAbc — grand design spiral','Star Formation':'Enhanced by the interaction with NGC 5195','Supernovae':'SN 1994I, 2005cs, 2011dh — 3 supernovae in 30 years'},
atmosphere:{'Magnetic Field':'Spiral arms trace the galactic magnetic field in perfect alignment — clearest example known','Tidal Bridge':'Bridge of gas and stars connecting M51a to NGC 5195','X-ray':'Chandra detected multiple X-ray binaries and a central AGN'},
exploration:{'Lord Rosse':'First observed spiral structure with 72" "Leviathan" telescope, 1845','Hubble':'Iconic spiral arm + companion image (2005 — sharpest at the time)','JWST 2022':'First JWST image of a well-known object — revealed previously hidden star-forming regions in mid-infrared'},
discoveries:{'First Spiral Galaxy':'Lord Rosse\'s 1845 sketch was the first recognition of spiral structure in any external system','JWST IR Void':'Infrared image showed "holes" in the spiral arms caused by supernova shockwaves blowing out gas','Magnetic Arms':'Radio maps show magnetic field perfectly traces the spiral arms','3 Supernovae':'Extraordinarily high supernova rate — one every ~decade — due to interaction-driven star formation'},
funFact:'The Whirlpool\'s magnetic field lines follow the galaxy\'s spiral arms with extraordinary precision — making it the clearest known example of a galaxy-scale magnetic field tracing the spiral structure. JWST\'s first image of a familiar galaxy revealed dark voids in the spiral arms punched by ancient supernova shock waves — previously invisible to Hubble.'},

"Sombrero Galaxy":{type:'galaxy',subtype:'edge_on',typeBadge:'EDGE-ON SPIRAL M104',size:25.0,dist:3600,period:0,color:0xffeedd,moons:'0',subtype:'edge_on',
overview:'One of the most famous galaxies in the sky — the Sombrero (M104) appears edge-on from Earth, revealing a brilliant white core surrounded by a perfect dark dust lane and a wide stellar halo. Its true nature is debated: spiral or giant lenticular?',
stats:{'Distance':'~28–31 million light-years','Diameter':'~50,000 light-years','Stars':'~800 billion (unusually massive for its size)','Central Black Hole':'~1 billion solar masses','Type':'SA(s)a (debated — possibly S0)','Globular Clusters':'~2,000 (more than Milky Way)'},
atmosphere:{'Dust Lane':'Sharp, equatorial dust lane bisects the bright bulge','X-ray':'Extended X-ray halo detected by Chandra — implies large dark matter halo','Dust Mass':'~13,000 solar masses of cold dust','Stellar Velocity':'Disk stars orbit at 130 km/s'},
exploration:{'Pierre Méchain':'1781 discovery','HST':'Famous image with dust lane and luminous bulge (2003)','Spitzer':'Infrared shows smoother bulge — suggests more complex structure than visible'},
discoveries:{'Extreme Bulge':'Bulge fraction unusually high — half-spiral, half-elliptical morphology','Sombrero Debate':'May actually be an elliptical galaxy with an embedded disk — reclassified multiple times','SMBH':'~1 billion solar masses — one of the most massive central black holes in nearby universe','Multi-ring':'Infrared reveals multiple embedded stellar rings invisible in optical light'},
funFact:'The Sombrero Galaxy\'s brilliant bulge suggests it contains up to 800 billion stars in a relatively compact disk — making it pound-for-pound one of the most star-packed galaxies in the local universe. Yet its central black hole, at 1 billion solar masses, is nearly 250 times more massive than the Milky Way\'s.'},

"Pinwheel Galaxy":{type:'galaxy',subtype:'spiral',typeBadge:'FACE-ON SPIRAL M101',size:24.0,dist:3700,period:0,color:0xffd4b8,moons:'0',subtype:'spiral',
overview:'The Pinwheel Galaxy — a perfect face-on grand design spiral 21 million light-years away. One of the largest spiral galaxies known, with an asymmetric shape caused by past gravitational interactions. A powerful laboratory for studying the physics of spiral arms.',
stats:{'Distance':'~21 million light-years','Diameter':'~170,000 light-years (one of the largest known spirals)','Stars':'~1 trillion','Type':'SAB(rs)cd — weakly barred, multi-arm spiral','Supernovae':'SN 2011fe, SN 2023ixf — notable recent supernovae','Asymmetry':'Off-center nucleus — evidence of past gravitational interaction'},
atmosphere:{'HII Regions':'3,000+ star-forming regions identified','NGC 5461':'Giant HII region comparable to NGC 604 in Triangulum','Star Formation Rate':'High, concentrated in spiral arms','Low Surface Brightness':'Extended outer disk barely detectable'},
exploration:{'Méchain & Messier':'1781','Hubble':'High-resolution mosaic (2006) — 51 images stitched together','JWST 2023':'Spiral structure revealed in infrared — showed new molecular clouds in arms'},
discoveries:{'Giant Spiral Arms':'Arms extend unusually far beyond the visible disk','SN 2023ixf':'Brightest supernova since SN 1987A at distance — an immediate Type II','Lopsided Core':'Nucleus offset from the geometric center — evidence for past merger or close flyby','Infrared Spirals':'JWST revealed new spiral features invisible in optical — dusty molecular arm structure'},
funFact:'SN 2023ixf — which exploded in the Pinwheel Galaxy in May 2023 — was the closest and brightest supernova since SN 1987A. Amateur astronomers worldwide captured it within hours of the explosion. The progenitor star (now gone) had been observed for years before it exploded, allowing direct comparison of pre- and post-explosion images.'},

"NGC 1300":{type:'galaxy',subtype:'barred',typeBadge:'BARRED SPIRAL GALAXY',size:28,dist:3900,period:0,color:0xffd090,moons:'0',subtype:'barred',
overview:'One of the most perfect barred spiral galaxies in the sky — a Hubble Heritage showpiece 61 million light-years away. Its straight bar connects to two grand spiral arms in a textbook example of barred spiral morphology.',
stats:{'Distance':'~61 million light-years','Diameter':'~110,000 light-years','Type':'SB(s)bc — classic barred spiral','Bar Length':'~33,000 light-years across the center','Located':'Eridanus Galaxy Cluster'},
atmosphere:{'Bar Dynamics':'Bar channels gas efficiently into the nucleus — fueling star formation and possible AGN activity','Arm Origin':'Arms originate at bar ends, not from the nucleus','Nuclear Spiral':'Small spiral structure within the bar itself (Hubble 2004)'},
exploration:{'Hubble ACS':'2004 — one of the most detailed images of a barred spiral ever taken'},
discoveries:{'Perfect Bar':'Exceptionally straight and prominent bar — used as textbook case','Nuclear Spiral':'Hubble detected a miniature spiral inside the bar — galaxy within a galaxy appearance','Arm Asymmetry':'The two arms are of different brightness and structure'},
funFact:'NGC 1300\'s bar is so geometrically perfect that it became the textbook image of a barred spiral galaxy — appearing in nearly every introductory astronomy textbook published after 2005. Bars like this are believed to funnel gas toward the nucleus over millions of years, and more than two-thirds of all spiral galaxies (including the Milky Way) have bars.'},

"Centaurus A":{type:'galaxy',subtype:'edge_on',typeBadge:'RADIO GALAXY NGC 5128',size:22.0,dist:4100,period:0,color:0xffe0b0,moons:'0',subtype:'edge_on',
overview:'The closest radio galaxy to Earth — 13 million light-years away. NGC 5128 / Centaurus A is a giant elliptical galaxy with a prominent dark dust lane betraying a past merger with a spiral galaxy. Its active black hole fires relativistic jets spanning 1 million light-years.',
stats:{'Distance':'~13 million light-years','Diameter':'~60,000 light-years (inner) + 2M ly jets','Central Black Hole':'~55 million solar masses','Jets':'1 million light-years total extent (radio lobes)','Type':'S0 pec / elliptical with dust lane (merger)','Radio Power':'One of the brightest radio sources in the sky'},
atmosphere:{'X-ray Jet':'Continuous X-ray emission along kpc-scale jet (Chandra)','Gamma-ray Lobes':'Giant lobes detected by Fermi — past AGN activity','Dust Lane':'~300 light-year wide dust lane from absorbed spiral galaxy','Temperature':'Hot X-ray gas at 3×10⁷ K permeates the galaxy'},
exploration:{'John Herschel':'1847 — noted as peculiar nebula','NASA CGRO':'First gamma-ray detection of nucleus','Chandra':'X-ray jets and nucleus structure','Event Horizon Telescope':'2023 — first resolved AGN jet base at radio wavelengths (not a black hole image, just the jet)'},
discoveries:{'Merger Evidence':'Dust lane proves Cen A ate a gas-rich spiral galaxy ~200–700 million years ago','Jet Composition':'Proton-dominated — deduced from optical/X-ray polarimetry','Cosmic Ray Origin':'Cen A is a prime candidate source of ultra-high-energy cosmic rays hitting Earth','Sub-parsec Jet':'EHT 2023 resolved the jet to within 12 Schwarzschild radii of the black hole'},
funFact:'Centaurus A\'s radio lobes — two giant bubbles of plasma blown out by the central black hole — span over 1 million light-years, 10 times the width of the Milky Way. If our eyes could see radio waves, Cen A would appear as a glowing blob 10 times wider than the full Moon in our southern sky.'},

"Antennae Galaxies": {
  type: 'galaxy',
  typeBadge: 'COLLIDING GALAXIES NGC 4038/39',
  size: 30,
  dist: 4200,
  period: 0,
  color: 0xffccaa,
  moons: '0',
  subtype: 'merger',
  overview: "NGC 4038 and NGC 4039 — two colliding spiral galaxies 45 million light-years away. Their long tidal tails resemble an insect's antennae. One of the most dramatic examples of galactic collision in the nearby universe, creating thousands of star clusters.",
  stats: {
    'Distance': '~45 million light-years',
    'Total Span': '~500,000 light-years (including tails)',
    'Star Clusters': '~1,000 young massive star clusters formed in the collision',
    'Type': 'Colliding SAB(s)m + SAB(s)m',
    'Collision Duration': 'Already interacted for ~600 million years'
  },
  atmosphere: {
    'Starburst': 'Most intense star formation in the local universe — driven by gas compression',
    'Ultraluminous X-ray Sources': 'Multiple ULXs — possibly intermediate-mass black holes formed in the collision',
    'Merger Stage': 'Currently in second pass — nuclei will merge in ~400 million years'
  },
  exploration: {
    'Hubble 1997': "One of Hubble's most famous deep images — revealed star cluster formation",
    'Chandra': 'Multiple X-ray point sources throughout the colliding disks',
    'JWST 2023': 'Infrared revealed massive dust-obscured star-forming complexes invisible to Hubble'
  },
  discoveries: {
    'Super Star Clusters': '~1,000 clusters formed in the collision — each containing millions of stars',
    'JWST Dust Clumps': 'Huge dusty star-forming complexes (>40 identified) hidden from Hubble by dust',
    'Multiple ULXs': 'Several ultraluminous X-ray sources — possibly intermediate black holes formed in densest cluster cores',
    'Merger Timeline': 'The two nuclei will fully merge in ~400M years into a giant elliptical galaxy'
  },
  funFact: "The collision between the Antennae Galaxies has triggered the formation of over 1,000 super star clusters — each containing millions of stars crammed into a region smaller than 100 light-years. These clusters are so dense they may eventually form globular clusters that will orbit the future merged galaxy for billions of years."
},

"M81 Bodes Galaxy": {
  type: 'galaxy',
  typeBadge: 'GRAND DESIGN SPIRAL',
  size: 32,
  dist: 4300,
  period: 0,
  color: 0xffd8a0,
  moons: '0',
  subtype: 'spiral',
  overview: "One of the brightest and best-studied spiral galaxies — 11.7 million light-years away in Ursa Major. Bode's Galaxy is gravitationally interacting with M82 and NGC 3077, producing an enormous hydrogen gas network connecting all three.",
  stats: {
    'Distance': '11.7 million light-years',
    'Diameter': '~90,000 light-years',
    'Stars': '~250 billion',
    'Central Black Hole': '~70 million solar masses',
    'Type': 'SA(s)ab — grand design spiral'
  },
  atmosphere: {
    'Interacting Pair': 'M81 and M82 separated by only ~160,000 light-years — in mutual tidal interaction',
    'H I Bridge': 'Shared hydrogen gas clouds connecting M81, M82, and NGC 3077',
    'AGN': 'Low-luminosity active nucleus powered by accretion onto 70-million solar-mass black hole'
  },
  exploration: {
    'Johann Bode': 'Discovered 1774 (simultaneously with M82)',
    'Chandra': 'AGN X-ray structure',
    'HST': 'Detailed spiral arm mapping'
  },
  discoveries: {
    'Tidal Interaction': "Gas filaments connect M81 to M82 — M81's gravity is literally pulling gas out of M82 and igniting M82's starburst",
    'Variable Nucleus': "M81's AGN brightens and dims — provides a nearby lab for AGN feeding physics",
    'Cepheid Distance': 'Hubble Key Project used M81 Cepheids to calibrate extragalactic distances',
    'SN 1993J': 'Bright supernova — second brightest of 20th century after SN 1987A'
  },
  funFact: "M81 is actively \"feeding\" gas from its companion M82 through tidal forces, triggering an enormous starburst in M82. The two galaxies share a cloud of hydrogen gas so large that it spans 600,000 light-years — and from Earth it's one of the largest single structures visible at radio wavelengths."
},

"Cigar Galaxy": {
  type: 'galaxy',
  typeBadge: 'STARBURST GALAXY M82',
  size: 18.0,
  dist: 4350,
  period: 0,
  color: 0xff9966,
  moons: '0',
  subtype: 'starburst',
  overview: "The Cigar Galaxy — M82 — is the closest and brightest starburst galaxy. Tidal forces from M81 are triggering star formation 10 times faster than the Milky Way. Its galactic wind — streaming gas and dust blown out by supernova explosions — can be seen in red hydrogen emission shooting perpendicular to the disk.",
  stats: {
    'Distance': '12 million light-years',
    'Diameter': '~37,000 light-years',
    'Type': 'Irr II (starburst — tidally distorted)',
    'Star Formation Rate': "10× the Milky Way's — concentrated in central 1 kpc",
    'Central Starburst': 'Driven by M81 tidal interaction',
    'Superwind': 'Galactic superwind extending 10,000+ light-years from disk'
  },
  atmosphere: {
    'Superwind': 'Hot gas at 10⁷ K propelled by thousands of supernova explosions — escaping at 600 km/s',
    'H-alpha Filaments': "Red hydrogen emission visible perpendicular to disk — the famous M82 'red smoke'",
    'Molecular Gas': 'Dense central molecular zone — fuel for the starburst',
    'X-ray Lobes': 'Chandra detected giant X-ray bubbles blown by the wind'
  },
  exploration: {
    'Johann Bode': '1774',
    'Chandra': 'Superwind X-ray structure',
    'HST': 'Iconic wide-field optical image',
    'JWST 2023': 'Mid-infrared reveals cold gas and dust in the starburst region'
  },
  discoveries: {
    'Superwind Discovery': 'Radio observations in 1960s first revealed the outflow; Chandra quantified its temperature and energy',
    '10× Star Formation': "Confirmed by infrared — central starburst so bright it dominates M82's total luminosity",
    'M82 X-1': 'An ultraluminous X-ray source — possibly a 400-solar-mass intermediate black hole',
    'Galactic Wind Scale': 'The wind extends 10,000 ly from the disk — enriching the intergalactic medium with metals'
  },
  funFact: 'The superwind of M82 is blowing heavy elements — carbon, oxygen, iron — forged in its thousands of supernova explosions out into intergalactic space. This is how galaxies "seed" the universe with heavy elements. Without starburst galaxies like M82, the intergalactic medium would have far fewer of the metals needed to eventually build rocky planets and life.'
},

"IC 1101": {
  type: 'galaxy',
  typeBadge: 'LARGEST KNOWN GALAXY',
  size: 50,
  dist: 9000,
  period: 0,
  color: 0xfff0dd,
  moons: '0',
  subtype: 'elliptical',
  overview: 'The largest known galaxy in the observable universe — a supergiant elliptical at the center of galaxy cluster Abell 2029, 1.04 billion light-years away. IC 1101 is so vast that at the same distance, the Milky Way would be invisible to our eyes.',
  stats: {
    'Distance': '~1.04 billion light-years',
    'Diameter': '~5.5–6 million light-years (50× the Milky Way)',
    'Stars': '~100 trillion',
    'Mass': '~100 trillion solar masses (100× the Milky Way)',
    'Central Black Hole': 'Estimated 40+ billion solar masses',
    'Type': 'cD/S0 (central dominant galaxy)'
  },
  atmosphere: {
    'Position': 'Center of Abell 2029 galaxy cluster',
    'Hot Gas Halo': 'Enormous X-ray halo — millions of solar masses of gas at tens of millions of Kelvin',
    'Growth Mechanism': 'Cannibalized hundreds of smaller galaxies over billions of years',
    'Jets': 'Evidence of past AGN activity — inflated X-ray cavities in the hot gas'
  },
  exploration: {
    'Discovery': '1946 (Albert George Wilson)',
    'Chandra': 'X-ray mapping of halo and AGN cavities',
    'Hubble': 'Central structure and color gradients'
  },
  discoveries: {
    'Size Record': 'Largest galaxy with confirmed extent of ~5.5 million light-years — possibly larger at faint levels',
    'Cannibalism': 'IC 1101 grew by absorbing smaller galaxies — visible as a diffuse outer stellar halo of "intracluster stars"',
    'AGN Cavities': 'Ghost bubbles in the X-ray gas left by past jet activity — now radio-filled',
    'Diffuse Envelope': 'Outer stars not gravitationally bound to IC 1101 specifically — now part of the intracluster medium'
  },
  funFact: 'If IC 1101 replaced our Milky Way, its edge would reach beyond the Large Magellanic Cloud, beyond the Andromeda Galaxy, and extend halfway to the Virgo Cluster. It is so large that in the time light takes to cross it, the universe itself will have aged 5.5 million years.'
},

"GN-z11": {
  type: 'galaxy',
  typeBadge: 'MOST DISTANT KNOWN GALAXY',
  size: 14,
  dist: 9800,
  period: 0,
  color: 0xffbbaa,
  moons: '0',
  subtype: 'irregular',
  overview: 'The most distant spectroscopically confirmed galaxy — observed as it was just 430 million years after the Big Bang. Its light has been traveling 13.4 billion years. JWST spectroscopy in 2023 revealed it hosts a rapidly growing supermassive black hole at the edge of the observable universe.',
  stats: {
    'Distance': '32.2 billion light-years (comoving)',
    'Light Travel Time': '13.4 billion years',
    'Redshift': 'z = 10.957',
    'Observed Epoch': '~430 million years after Big Bang',
    'Confirmed By': 'JWST NIRSpec spectroscopy (2023)',
    'Central Black Hole': '~6 million solar masses — extremely massive for its age'
  },
  atmosphere: {
    'Nitrogen Lines': 'JWST detected nitrogen emission — unexpected at this cosmic age; suggests extremely rapid chemical enrichment',
    'AGN': 'Confirmed active galactic nucleus — black hole growing rapidly even this early',
    'Compact': '~1/25th the size of the Milky Way — yet forming stars as rapidly as much larger galaxies'
  },
  exploration: {
    'Hubble 2016': 'First photometric redshift estimate — confirmed at z~11',
    'JWST 2023': 'First spectroscopic confirmation + AGN and nitrogen detection'
  },
  discoveries: {
    'Nitrogen Puzzle': 'Nitrogen seen at z~11 requires rapid star formation and chemical enrichment far beyond what models predicted',
    'AGN at z=11': 'Second-highest confirmed redshift AGN — grew to 6 million solar masses in only 430 million years',
    'Compact Starburst': "Star formation density ~100× higher than today's average — possibly fueled by dense gas clouds in the early universe",
    'Challenges Models': "GN-z11's properties challenge standard galaxy formation — too massive, too chemically evolved, too early"
  },
  funFact: "GN-z11's light left the galaxy when the universe was only 3% of its current age. It has been traveling through space for 13.4 billion years before entering your telescope (or Hubble's or JWST's). The galaxy itself no longer exists as we see it — it has had 13.4 billion years to grow, merge, and transform into something completely unrecognisable."
},

"Sculptor Galaxy": {
  type: 'galaxy',
  typeBadge: 'EDGE-ON STARBURST NGC 253',
  size: 26,
  dist: 3100,
  period: 0,
  color: 0xddccaa,
  moons: '0',
  subtype: 'edge_on',
  overview: 'The nearest starburst galaxy visible in the southern sky — 11.4 million light-years away. NGC 253 is nearly edge-on from Earth, revealing a dramatic dusty disk with a violent nuclear starburst, superwind outflow, and one of the highest star-formation rates among nearby galaxies.',
  stats: {
    'Distance': '11.4 million light-years',
    'Diameter': '~90,000 light-years',
    'Type': 'SAB(s)c — weakly barred intermediate spiral',
    'Star Formation Rate': '2–4 solar masses/year in nucleus alone',
    'Nuclear Starburst': 'Highly obscured — better studied in infrared/radio than optical'
  },
  atmosphere: {
    'Superwind': 'Multiphase galactic outflow — hot X-ray gas + cool atomic gas + molecular gas all escaping at 300–500 km/s',
    'Dust Filaments': 'Visible as dark lanes across the disk',
    'ALMA Molecules': 'Complex organic molecules detected in the central molecular zone'
  },
  exploration: {
    'Caroline Herschel': 'Discovered Oct 23, 1783',
    'ALMA': 'Molecular gas structure at 10-pc resolution',
    'Chandra': 'X-ray outflow morphology',
    'HST': 'Dust lane and star cluster structures'
  },
  discoveries: {
    'Multi-phase Wind': 'NGC 253 showed for the first time that galactic winds contain all gas phases simultaneously — cool, warm, hot',
    'ALMA Detail': 'Most detailed molecular gas map of any external galaxy — revealed individual star-forming clumps',
    'TDGs': 'Tidal dwarf galaxy candidates forming at the end of the galactic wind',
    'Astrochemistry': 'Rich inventory of interstellar molecules — second only to the Galactic Center in molecular complexity'
  },
  funFact: "NGC 253's galactic wind is a multi-layered flow — X-ray gas at millions of degrees, warm ionized gas, neutral atomic gas, and even cold molecular gas all flowing out simultaneously from the same nuclear starburst. It is the most detailed multi-phase outflow studied in any external galaxy, and a Rosetta Stone for understanding how galactic feedback shapes cosmic evolution."
},

"M83 Southern Pinwheel": {
  type: 'galaxy',
  typeBadge: 'BARRED SPIRAL GALAXY',
  size: 28,
  dist: 3300,
  period: 0,
  color: 0xffddcc,
  moons: '0',
  subtype: 'barred',
  overview: 'The Southern Pinwheel Galaxy — a nearby face-on barred spiral 15 million light-years away. M83 has one of the highest rates of supernova activity of any galaxy in the modern era, with 6 supernovae observed in the last century, and a nuclear starburst hidden by dust.',
  stats: {
    'Distance': '~15 million light-years',
    'Diameter': '~55,000 light-years',
    'Type': 'SAB(s)c — barred spiral',
    'Supernovae': '6 observed since 1923 (highest rate of nearby galaxies)',
    'Nuclear Starburst': 'Compact starburst hidden behind dust in the nucleus'
  },
  atmosphere: {
    'HII Regions': 'Thousands of star-forming regions scattered throughout the arms',
    'Nuclear Bar': 'Secondary nuclear bar embedded in the main bar — double bar structure',
    'Multiple Arms': '5 spiral arms detectable in deep images — unusually complex structure'
  },
  exploration: {
    'Lacaille': '1752 — one of the first deep-sky objects discovered from the Southern Hemisphere',
    'Hubble 2009': 'Wide-field mosaic revealed massive numbers of star clusters',
    'Chandra': 'AGN + ultra-luminous X-ray sources'
  },
  discoveries: {
    'Double Bar': 'Secondary bar inside the main bar — dynamically complex barred structure',
    'Nuclear Cluster': 'Compact nuclear star cluster hosting active star formation',
    '6 Supernovae': 'Most historically observed supernovae of any galaxy — real-time stellar evolution lab',
    'UV Rings': 'GALEX revealed UV-bright star-forming rings at the spiral arm tips — driven by density wave compression'
  },
  funFact: "M83 has had 6 confirmed supernovae observed by humans in the past 100 years — far more than any other nearby galaxy. This means that roughly every 17 years, one of M83's massive stars reaches the end of its life and explodes. Statistically, with 10× higher star formation than the Milky Way, we would expect a supernova every few decades."
},

"M51-ULS-1b": {
  type: "planet",
  typeBadge: "EXTRAGALACTIC PLANET",
  size: 2.5,
  dist: 0,
  period: 0,
  color: 0x88aacc,
  moons: "0",
  overview: "The first planet candidate discovered outside our Milky Way galaxy. Located in the Whirlpool Galaxy (M51), 28 million light-years away.",
  stats: {
    "Distance": "28 million light-years",
    "Size": "Roughly Saturn-sized",
    "Host Galaxy": "Whirlpool Galaxy (M51)",
    "Discovery": "2021 (Chandra X-ray)"
  },
  atmosphere: {
    "Environment": "Extreme radiation (orbiting an X-ray binary)"
  },
  exploration: {
    "Chandra": "Detected by X-ray transit method"
  },
  discoveries: {
    "First Extragalactic Planet": "Proves planets exist in other galaxies"
  },
  funFact: "This planet was found because it passed directly in front of a black hole or neutron star, temporarily blocking its X-rays."
},

"Earendel":{type:'star',typeBadge:'MOST DISTANT STAR',size:15,dist:0,period:0,color:0xaaaaff,moons:'0',
overview:'The most distant individual star ever seen — 28 billion light-years away. We are seeing it as it existed just 900 million years after the Big Bang.',
stats:{'Distance':'28.0 billion light-years (comoving)','Mass':'~50-100 solar masses','Age':'Observed at z=6.2 (early universe)','Host Galaxy':'Sunrise Arc'},
atmosphere:{'Type':'Likely an extremely hot, massive B-type star'},
exploration:{'Hubble 2022':'Discovered via gravitational lensing','JWST 2022':'Confirmed temperature and spectrum'},
discoveries:{'Gravitational Lensing':'Magnified by a factor of thousands by a foreground galaxy cluster'},
funFact:'Earendel is Old English for "Morning Star". By the time its light reached our telescopes, the star itself had been dead for over 12 billion years.'},

"NGC 604":{type:'nebula',typeBadge:'GIANT STELLAR NURSERY',size:22,dist:0,period:0,color:0xff33aa,moons:'0',
overview:'A colossal star-forming region inside the Triangulum Galaxy. It is 1,500 light-years across and contains over 200 incredibly hot, massive stars.',
stats:{'Distance':'2.73 million light-years','Diameter':'1,500 light-years','Stars':'200+ massive O-type stars','Host Galaxy':'Triangulum (M33)'},
atmosphere:{'Composition':'Glowing ionized hydrogen gas'},
exploration:{'Hubble':'Resolved individual stars inside the cavernous gas clouds'},
discoveries:{'Massive Scale':'100 times larger than the Orion Nebula'},
funFact:'If NGC 604 were placed where the Orion Nebula is inside our Milky Way, it would shine so brightly it would cast shadows on Earth at night.'},

"M87*":{type:'blackhole',typeBadge:'PHOTOGRAPHED BLACK HOLE',size:16.0,dist:0,period:0,color:0x000000,moons:'0',
overview:'The 6.5-billion-solar-mass supermassive black hole at the center of the M87 galaxy. The first black hole ever photographed by humanity.',
stats:{'Distance':'53.5 million light-years','Mass':'6.5 billion solar masses','Event Horizon':'~38 billion km across'},
atmosphere:{'Accretion Disk':'Plasma heated to billions of degrees','Relativistic Jet':'Shooting matter at 99.9% light speed'},
exploration:{'Event Horizon Telescope':'Captured its shadow in April 2019'},
discoveries:{'Einstein Vindicated':'The shadow exactly matched general relativity predictions'},
funFact:'To take its picture, astronomers linked radio telescopes from Hawaii to Antarctica, effectively turning the entire Earth into a single giant telescope lens.'},

"SPT0311-58":{type:'galaxy',typeBadge:'ANCIENT WATER GALAXY',size:26,dist:0,period:0,color:0xff8844,moons:'0',subtype:'merger',
overview:'A massive merging galaxy pair seen as it was 12.88 billion years ago. ALMA detected water and carbon monoxide here, proving early universe complex chemistry.',
stats:{'Distance':'~29 billion ly (comoving)','Lookback Time':'12.88 billion years','Significance':'Most distant detection of H2O'},
atmosphere:{'Chemistry':'Rich in water and carbon monoxide molecules'},
exploration:{'ALMA':'Radio array detected molecular spectral lines'},
discoveries:{'Early Chemistry':'Life\'s building blocks existed when the universe was a toddler'},
funFact:'This discovery proves that the chemical building blocks required for planets and life were already forged and swirling around when the universe was just 5% of its current age.'},

"Rogue Stars":{type:'star',typeBadge:'INTRACLUSTER LIGHT',size:10,dist:0,period:0,color:0xffffff,moons:'0',
overview:'Billions of rogue stars wandering forever in the dark voids between galaxies, ripped from their homes by galactic collisions.',
stats:{'Location':'Galaxy clusters (e.g., Virgo Cluster)','Distance':'~50+ million light-years','Origin':'Tidal stripping during galactic mergers'},
atmosphere:{'Environment':'Utterly empty intergalactic space'},
exploration:{'Hubble':'Detected faint ghost-light between galaxies in massive clusters'},
discoveries:{'Orphaned Stars':'Up to 20% of a cluster\'s stars might not belong to any galaxy'},
funFact:'If you lived on a planet orbiting a rogue star, your night sky would be completely black. There would be no Milky Way, just a few faint, distant smudges of other galaxies.'},

}


// ═══════ end of planetData ═══════
window.planetData = planetData;


// ════════════════════════════════════════════════════════════════════════════
//  TIME & SPEED SYSTEM
// ════════════════════════════════════════════════════════════════════════════
const SPEEDS = [
    0, 0.25, 0.5, 1, 2, 5, 10, 50, 100, 200, 500, 1000, 2000,
    5000, 10000, 50000, 100000, 250000, 500000
];
let speedIdx  = 0;   // starts at ×
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
//  COSMIC ZOOM LAYERS — LOD + Local Group → Supercluster Web → Observable Universe
// ════════════════════════════════════════════════════════════════════════════

// ── LOD: Dynamic pixel-ratio based on camera distance ──────────────────────
const LOD_THRESHOLDS = [
    { dist: 200,      pr: 2.0  },
    { dist: 600,      pr: 1.6  },
    { dist: 2000,     pr: 1.2  },
    { dist: 8000,     pr: 1.0  },
    { dist: 40000,    pr: 0.85 },
    { dist: 200000,   pr: 0.7  },
    { dist: Infinity, pr: 0.5  },
];
let _lastLodPr = -1;
function updateLOD(camDist) {
    if (perfMode) return;
    const pr = LOD_THRESHOLDS.find(t => camDist <= t.dist)?.pr ?? 0.5;
    const finalPr = Math.min(pr, window.devicePixelRatio);
    if (Math.abs(finalPr - _lastLodPr) > 0.05) {
        renderer.setPixelRatio(finalPr);
        _lastLodPr = finalPr;
    }
}

// ── Galaxy sprite factory ──────────────────────────────────────────────────
function makeGalaxySprite(type, r, g, b, scale, pos, opacity) {
    const S = 256, cvs = document.createElement('canvas');
    cvs.width = cvs.height = S;
    const ctx = cvs.getContext('2d');
    const cx = S / 2, cy = S / 2;

    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, S / 2);
    grd.addColorStop(0,   `rgba(${r},${g},${b},0.98)`);
    grd.addColorStop(0.18,`rgba(${r},${g},${b},0.72)`);
    grd.addColorStop(0.45,`rgba(${r},${g},${b},0.28)`);
    grd.addColorStop(0.75,`rgba(${Math.max(0,r-40)},${Math.max(0,g-20)},${Math.min(255,b+30)},0.08)`);
    grd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, S, S);

    if (type === 'spiral') {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.35);
        for (let arm = 0; arm < 2; arm++) {
            for (let i = 0; i < 1200; i++) {
                const t   = Math.pow(Math.random(), 0.6);
                const ang = arm * Math.PI + t * Math.PI * 2.8 + (Math.random()-0.5)*0.5;
                const rad = t * S * 0.44;
                const px  = rad * Math.cos(ang), py = rad * Math.sin(ang);
                if (Math.abs(px) > S/2-2 || Math.abs(py) > S/2-2) continue;
                ctx.fillStyle = `rgba(${r},${g},${b},${(Math.random()*0.45+0.08).toFixed(2)})`;
                ctx.fillRect((px+cx)|0,(py+cy)|0,1,1);
            }
        }
        ctx.restore();
    } else if (type === 'elliptical') {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.55);
        for (let i = 0; i < 600; i++) {
            const rad = Math.random() * S * 0.38, ang = Math.random() * Math.PI * 2;
            ctx.fillStyle = `rgba(${r},${g},${b},${(Math.random()*0.35+0.05).toFixed(2)})`;
            ctx.fillRect((rad*Math.cos(ang)+cx)|0,(rad*Math.sin(ang)+cy)|0,1,1);
        }
        ctx.restore();
    } else {
        for (let i = 0; i < 500; i++) {
            const px = (Math.random()-0.5)*S*0.75+cx, py = (Math.random()-0.5)*S*0.4+cy;
            ctx.fillStyle = `rgba(${r},${g},${b},${(Math.random()*0.3+0.04).toFixed(2)})`;
            ctx.fillRect(px|0,py|0,1,1);
        }
    }

    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cvs), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity
    }));
    spr.scale.set(scale, scale * (type==='elliptical'?0.5:type==='spiral'?0.42:0.7), 1);
    spr.position.copy(pos);
    return spr;
}

// ── Multi-layer cosmic structure ───────────────────────────────────────────
const cosmicLayers = {
    localGroup:   { meshes:[], startDist:28000,   fullDist:70000   },
    supercluster: { meshes:[], startDist:120000,  fullDist:300000  },
    cosmicWeb:    { meshes:[], startDist:500000,  fullDist:1500000 },
    universe:     { meshes:[], startDist:2500000, fullDist:7000000 },
};

(function buildAllGalaxies() {
    // ── Nearby background galaxies (existing zoom level) ──────────────────
    const nearPal = [
        {col:[255,220,160],t:'spiral'},{col:[255,200,130],t:'spiral'},
        {col:[200,220,255],t:'elliptical'},{col:[255,180,100],t:'elliptical'},
        {col:[140,190,255],t:'irregular'},{col:[255,240,200],t:'spiral'},
    ];
    for (let i = 0; i < 40; i++) {
        const p=nearPal[i%nearPal.length],[r,g,b]=p.col;
        const dist=18000+Math.random()*22000, ay=Math.random()*Math.PI*2;
        const pos=new THREE.Vector3(Math.cos(ay)*dist,(Math.random()-0.5)*8000,Math.sin(ay)*dist);
        const spr=makeGalaxySprite(p.t,r,g,b,1200+Math.random()*2800,pos,0.55+Math.random()*0.3);
        scene.add(spr); allGalaxies.push(spr);
    }

    // ── Local Group ───────────────────────────────────────────────────────
    const lgCols=[[255,210,150],[255,195,120],[180,210,255],[255,240,210],[130,180,255],[255,160,90],[220,200,180]];
    const lgTypes=['spiral','elliptical','irregular'];
    for (let i = 0; i < 55; i++) {
        const [r,g,b]=lgCols[i%lgCols.length], t=lgTypes[i%3];
        const dist=55000+Math.random()*120000, ay=Math.random()*Math.PI*2;
        const pos=new THREE.Vector3(Math.cos(ay)*dist,(Math.random()-0.5)*35000,Math.sin(ay)*dist);
        const spr=makeGalaxySprite(t,r,g,b,2500+Math.random()*6000,pos,0.45+Math.random()*0.35);
        spr.visible=false; scene.add(spr);
        cosmicLayers.localGroup.meshes.push(spr); allGalaxies.push(spr);
    }

    // ── Virgo Supercluster ────────────────────────────────────────────────
    const scCols=[[255,200,140],[200,215,255],[255,180,100],[170,200,255],[255,240,190],[255,160,80]];
    for (let i = 0; i < 120; i++) {
        const [r,g,b]=scCols[i%scCols.length], t=i%3===0?'spiral':i%3===1?'elliptical':'irregular';
        const dist=180000+Math.random()*500000, ay=Math.random()*Math.PI*2;
        const pos=new THREE.Vector3(Math.cos(ay)*dist,(Math.random()-0.5)*120000,Math.sin(ay)*dist);
        const spr=makeGalaxySprite(t,r,g,b,6000+Math.random()*18000,pos,0.4+Math.random()*0.3);
        spr.visible=false; scene.add(spr); cosmicLayers.supercluster.meshes.push(spr);
    }

    // ── Cosmic Web filaments ──────────────────────────────────────────────
    const cwCols=[[255,210,160],[180,210,255],[255,190,120],[200,225,255],[255,230,170]];
    for (let f = 0; f < 8; f++) {
        const filAng=(f/8)*Math.PI*2, filLen=1500000+Math.random()*2000000;
        for (let i = 0; i < 30; i++) {
            const [r,g,b]=cwCols[f%cwCols.length], t=i%2===0?'elliptical':'spiral';
            const frac=Math.random(), spread=150000+Math.random()*250000;
            const pos=new THREE.Vector3(
                Math.cos(filAng)*filLen*frac+(Math.random()-0.5)*spread,
                (Math.random()-0.5)*300000,
                Math.sin(filAng)*filLen*frac+(Math.random()-0.5)*spread);
            const spr=makeGalaxySprite(t,r,g,b,15000+Math.random()*40000,pos,0.35+Math.random()*0.25);
            spr.visible=false; scene.add(spr); cosmicLayers.cosmicWeb.meshes.push(spr);
        }
    }
    for (let i = 0; i < 80; i++) {
        const [r,g,b]=cwCols[i%cwCols.length], t=['spiral','elliptical','irregular'][i%3];
        const dist=600000+Math.random()*3000000, ay=Math.random()*Math.PI*2;
        const pos=new THREE.Vector3(Math.cos(ay)*dist,(Math.random()-0.5)*600000,Math.sin(ay)*dist);
        const spr=makeGalaxySprite(t,r,g,b,20000+Math.random()*60000,pos,0.3+Math.random()*0.2);
        spr.visible=false; scene.add(spr); cosmicLayers.cosmicWeb.meshes.push(spr);
    }

    // ── Observable Universe ───────────────────────────────────────────────
    const uCols=[[255,200,140],[160,200,255],[255,170,100],[200,220,255],[255,215,150]];
    for (let i = 0; i < 200; i++) {
        const [r,g,b]=uCols[i%uCols.length], t=i%2===0?'elliptical':'spiral';
        const dist=3000000+Math.random()*8000000, ay=Math.random()*Math.PI*2;
        const pos=new THREE.Vector3(Math.cos(ay)*dist,(Math.random()-0.5)*3000000,Math.sin(ay)*dist);
        const spr=makeGalaxySprite(t,r,g,b,60000+Math.random()*200000,pos,0.25+Math.random()*0.2);
        spr.visible=false; scene.add(spr); cosmicLayers.universe.meshes.push(spr);
    }

    // CMB boundary glow
    const cmbGeo=new THREE.SphereGeometry(10000000,32,32);
    const cmbMat=new THREE.MeshBasicMaterial({color:0xff8844,transparent:true,opacity:0,
        side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false});
    const cmbSphere=new THREE.Mesh(cmbGeo,cmbMat);
    scene.add(cmbSphere);
    cosmicLayers.universe.cmbSphere=cmbSphere;
    cosmicLayers.universe.cmbMat=cmbMat;
})();

// ── Universe label overlays ────────────────────────────────────────────────
// Universe & supercluster labels live in engine.html / visual.css

// ── Update cosmic layer visibility ────────────────────────────────────────
function updateCosmicLayers(camDist) {
    const fade=(start,full)=>Math.max(0,Math.min(1,(camDist-start)/(full-start)));

    const lgT=fade(cosmicLayers.localGroup.startDist, cosmicLayers.localGroup.fullDist);
    cosmicLayers.localGroup.meshes.forEach(m=>{m.visible=lgT>0;if(m.material)m.material.opacity=lgT*0.6;});

    const scT=fade(cosmicLayers.supercluster.startDist, cosmicLayers.supercluster.fullDist);
    cosmicLayers.supercluster.meshes.forEach(m=>{m.visible=scT>0;if(m.material)m.material.opacity=scT*0.5;});
    // Fade out nearby background galaxies as we enter supercluster view
    allGalaxies.filter(g=>!cosmicLayers.localGroup.meshes.includes(g))
        .forEach(g=>{if(g.material)g.material.opacity=Math.max(0,0.65-scT*0.65);});

    const cwT=fade(cosmicLayers.cosmicWeb.startDist, cosmicLayers.cosmicWeb.fullDist);
    cosmicLayers.cosmicWeb.meshes.forEach(m=>{m.visible=cwT>0;if(m.material)m.material.opacity=cwT*0.45;});

    const uvT=fade(cosmicLayers.universe.startDist, cosmicLayers.universe.fullDist);
    cosmicLayers.universe.meshes.forEach(m=>{m.visible=uvT>0;if(m.material)m.material.opacity=uvT*0.35;});
    if(cosmicLayers.universe.cmbMat) cosmicLayers.universe.cmbMat.opacity=uvT*0.06;

    const ulEl=document.getElementById('universe-label');
    const slEl=document.getElementById('supercluster-label');
    if(ulEl) ulEl.classList.toggle('visible', uvT>0.4);
    if(slEl) slEl.classList.toggle('visible', scT>0.4&&uvT<0.3);
}

(function buildGalaxies() { /* galaxies now built above */ })();


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
const _pendingMoons = [];   

Object.entries(planetData).forEach(([name, data]) => {
    try {
        data.name  = name;

        // --- MATHEMATICAL SCALING SYSTEM (Sizes & Deep Space Distances) ---
        
        // 1. MACRO GALAXY SCALE
        if (data.type === 'galaxy') {
            const realGalaxyData = {
                "Triangulum Galaxy":     { dia: 61000,    dist: 2730000 },
                "LMC":                   { dia: 14000,    dist: 160000 },
                "SMC":                   { dia: 7000,     dist: 200000 },
                "M87 Galaxy":            { dia: 120000,   dist: 53500000 },
                "Whirlpool Galaxy":      { dia: 76000,    dist: 23000000 },
                "Sombrero Galaxy":       { dia: 50000,    dist: 31000000 },
                "Pinwheel Galaxy":       { dia: 170000,   dist: 21000000 },
                "NGC 1300":              { dia: 110000,   dist: 61000000 },
                "Centaurus A":           { dia: 60000,    dist: 13000000 },
                "Antennae Galaxies":     { dia: 500000,   dist: 45000000 },
                "M81 Bodes Galaxy":      { dia: 90000,    dist: 11700000 },
                "Cigar Galaxy":          { dia: 37000,    dist: 12000000 },
                "IC 1101":               { dia: 5500000,  dist: 1040000000 },
                "GN-z11":                { dia: 4000,     dist: 32200000000 },
                "SPT0311-58":            { dia: 90000,    dist: 29000000000 },
                "Sculptor Galaxy":       { dia: 90000,    dist: 11400000 },
                "M83 Southern Pinwheel": { dia: 55000,    dist: 15000000 },
                "Andromeda Galaxy":      { dia: 220000,   dist: 2537000 },
                "Laniakea":              { dia: 520000000,dist: 0 }
            };

            const trueData = realGalaxyData[data.name];
            if (trueData && trueData.dist > 0) {
                data.size = trueData.dia / 500;
                const logDist = Math.log10(trueData.dist);
                data.dist = 60000 + (Math.pow(logDist - 4.5, 2.5) * 15000);
            } else if (data.name !== 'Laniakea' && data.name !== 'Cosmic Microwave Background') {
                data.size *= 20;
                data.dist = 60000 + (data.dist * 20);
            }
        } 
        // 2. EXTRAGALACTIC MICRO OBJECTS (Planets/Stars inside other galaxies)
        else if (['M51-ULS-1b', 'Earendel', 'NGC 604', 'M87*', 'Rogue Stars'].includes(data.name)) {
            const extragalacticObjects = {
                "M51-ULS-1b": { dist: 28000000, sizeMult: 8000 }, 
                "Earendel": { dist: 28000000000, sizeMult: 25000 },
                "NGC 604": { dist: 2730000, sizeMult: 800 },
                "M87*": { dist: 53500000, sizeMult: 3000 },
                "Rogue Stars": { dist: 50000000, sizeMult: 15000 }
            };
            const trueObj = extragalacticObjects[data.name];
            
            // Blow up their sizes so the camera can actually click them at billions of light-years
            data.size *= trueObj.sizeMult;
            
            // Use the exact same logarithmic distance formula as galaxies so they spawn correctly
            const logDist = Math.log10(trueObj.dist);
            data.dist = 60000 + (Math.pow(logDist - 4.5, 2.5) * 15000);
        }
        // 3. INTERSTELLAR SCALE (Inside our Milky Way)
        else if ((data.type === 'star' || data.type === 'nebula' || data.type === 'blackhole' || data.type === 'pulsar') && data.dist > 2000) {
            const realInterstellarData = {
                "Proxima Centauri": { dist: 4.24 },
                "Sirius":           { dist: 8.6 },
                "Helix Nebula":     { dist: 650 },
                "Betelgeuse":       { dist: 700 },
                "Orion Nebula":     { dist: 1344 },
                "Crab Pulsar":      { dist: 4000 },
                "Pillars of Creation": { dist: 7000 },
                "Sagittarius A*":   { dist: 26000 },
                "Milky Way Core":   { dist: 26000 },
                "Dark Matter":      { dist: 100000 },
                "Dark Energy":      { dist: 150000 }
            };

            const trueStar = realInterstellarData[data.name];
            if (trueStar) {
                const logDist = Math.log10(trueStar.dist); 
                data.dist = 2500 + (Math.pow(logDist, 1.8) * 3500);
            }
        }
        // ------------------------------------------------------------------

        const mesh = createPlanet(data);
        if (!mesh) return;
        data._mesh = mesh;

        if (data.dist === 0) {
            scene.add(mesh);
            data._pivot = null;
            planets.push({ data, mesh, pivot: null });
            visionManager.registerBody({ data, mesh, pivot: null });

        } else if (data.parent) {
            const pivot = new THREE.Object3D();
            const initAngle = Math.random() * Math.PI * 2;
            pivot.rotation.y = initAngle;
            data._phase = initAngle;
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
            visionManager.registerBody({ data, mesh, pivot });

        } else {
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
            visionManager.registerBody({ data, mesh, pivot });
        }
    } catch (err) {
        console.error(`[SOLAR ENGINE] Error initializing celestial object ${name}:`, err);
    }
});


_pendingMoons.forEach(moonData => {
    const parentData = planetData[moonData.parent];
    if (parentData?._mesh) {
        parentData._mesh.add(moonData._pivot);
        drawOrbit(moonData._relDist, moonData.color || 0xffffff, moonData._pivot);
    } else {
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

    const d   = Math.max(data.size * 5.8, 16);
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
    if      (cd > 5000000)  { txt = 'OBSERVABLE UNIVERSE';        pct = 100; }
    else if (cd > 1500000)  { txt = 'COSMIC WEB — GALAXY SHEETS'; pct = 96;  }
    else if (cd > 300000)   { txt = 'LANIAKEA SUPERCLUSTER';       pct = 91;  }
    else if (cd > 70000)    { txt = 'LOCAL GROUP OF GALAXIES';     pct = 85;  }
    else if (cd > 40000)    { txt = 'BEYOND THE MILKY WAY';        pct = 79;  }
    else if (cd > 22000)    { txt = 'SUPERCLUSTER SCALE';          pct = 75;  }
    else if (cd > 14000)    { txt = 'MILKY WAY REGION';            pct = 70;  }
    else if (cd >  7000)    { txt = 'OUTER HELIOSPHERE';           pct = 58;  }
    else if (cd >  2000)    { txt = 'KUIPER BELT';                 pct = 44;  }
    else if (cd >   900)    { txt = 'GAS GIANT ZONE';              pct = 32;  }
    else if (cd >   350)    { txt = 'INNER SYSTEM';                pct = 22;  }
    else if (cd >    80)    { txt = 'NEAR EARTH SPACE';            pct = 12;  }
    else                     { txt = 'PLANETARY SCALE';             pct =  5;  }
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

    // ── LOD: adjust render quality by distance ────────────────────────────
    updateLOD(camDist);

    // ── Cosmic zoom layers: local group → supercluster → universe ─────────
    updateCosmicLayers(camDist);

    // ── Active Vision Culling & Spatial Chunk Streamer ────────────────────
    visionManager.update(camDist, dt, fpsN === 0);

    // ── Planet orbits & self-rotation ─────────────────────────────────────
    planets.forEach(({ data, mesh, pivot }) => {
        // Spin rates: stars slow, galaxies ultra-slow (they're huge), probes tumble at probe-specific rates, planets normal
        const spin = data.type === 'star'    ? 0.04
                   : data.type === 'galaxy'  ? 0.004   // galaxies rotate very slowly
                   : mesh.userData.isTumbler ? getProbeTumbleRate(data.name) // per-probe realistic tumble
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

    // ── Spacecraft physics: solar panel sun-tracking + antenna pointing ───
    updateSpacecraftPhysics(simClock);

    // ── Blinking status lights on spacecraft ──────────────────────────────
    updateBlinkingLights(dt);

    // ── Special object animations ──────────────────────────────────────────
    const t = performance.now() * 0.001;

    allBlackHoleDisk.forEach((disk, i) => {
        // Inner disk rotates faster (Keplerian — closer = faster)
        disk.rotation.z += dt * (0.18 - i * 0.035);
    });
    allBlackHoleJets.forEach((jet, ji) => {
        // Each jet shell has a slightly different flicker frequency — realistic variability
        const baseOp = [0.55, 0.28, 0.10][ji % 3] ?? 0.15;
        jet.material.opacity = Math.max(0, baseOp * (0.7 + 0.3 * Math.sin(t * (2.1 + ji * 0.4) + ji)));
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
    if (!perfMode) renderer.setPixelRatio(currentPixelRatio);
});