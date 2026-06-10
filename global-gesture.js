/**
 * GLOBAL GESTURE CONTROLLER, PIP CAMERA, & SPA ROUTER
 * Theme: Class of Learners Neon Green (#00ffcc)
 */

// 1. GLOBAL UI & THEME CONTROLLERS
window.toggleMenu = function() { 
    const navLinks = document.querySelector('.nav-links');
    if(navLinks) navLinks.classList.toggle('active'); 
};

window.toggleTheme = function(element) {
    if (element.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
};

window.initializeTheme = function() {
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggleSwitch) toggleSwitch.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        if (toggleSwitch) toggleSwitch.checked = false;
    }
};

// Run immediately on first load
window.addEventListener('DOMContentLoaded', window.initializeTheme);


document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('global-gesture-container')) return;

    // 1. Inject Global Elements (Cursor, Toast, FAB, PiP Camera)
    const container = document.createElement('div');
    container.id = 'global-gesture-container';
    container.innerHTML = `
        <style id="global-gesture-styles">
            #global-cursor { position: fixed; width: 20px; height: 20px; background-color: #00ffcc; border-radius: 50%; pointer-events: none; z-index: 999999; display: none; box-shadow: 0 0 15px #00ffcc; transform: translate(-50%, -50%); transition: width 0.1s, height 0.1s, background-color 0.1s, transform 0.05s linear; }
            #global-cursor::after { content: ''; position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; background: white; border-radius: 50%; transform: translate(-50%, -50%); }
            
            #global-toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #0a0d14; border: 1px solid #00ffcc; color: #00ffcc; font-family: 'Space Mono', monospace; font-size: 0.8rem; font-weight: 700; padding: 8px 16px; border-radius: 6px; opacity: 0; transition: opacity 0.3s; z-index: 999999; pointer-events: none; box-shadow: 0 5px 20px rgba(0,0,0,0.5); }
            #global-toast.visible { opacity: 1; }
            
            /* Floating Action Button */
            #gesture-fab { position: fixed; bottom: 30px; right: 30px; background: rgba(10, 13, 20, 0.9); border: 1px solid #00ffcc; color: #00ffcc; font-family: 'Space Mono', monospace; font-size: 0.8rem; font-weight: 700; padding: 12px 20px; border-radius: 30px; cursor: pointer; z-index: 99999; box-shadow: 0 0 15px rgba(0, 255, 204, 0.2); backdrop-filter: blur(10px); transition: 0.3s; display: flex; align-items: center; gap: 10px;}
            #gesture-fab:hover { background: #00ffcc; color: #000; box-shadow: 0 0 25px #00ffcc; }
            
            /* Picture-in-Picture Camera Popout */
            #pip-camera { position: fixed; bottom: 30px; left: 30px; width: 280px; height: 157px; background: #020408; border: 1px solid #161d2b; border-radius: 8px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); overflow: hidden; z-index: 99998; display: none; }
            #pip-header { position: absolute; top: 0; left: 0; right: 0; background: rgba(10, 13, 20, 0.9); padding: 4px 8px; font-family: 'Space Mono', monospace; font-size: 0.65rem; color: #00ffcc; z-index: 10; border-bottom: 1px solid #161d2b;}
            #global_canvas { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
            
            #shutdown-flash { position: fixed; inset: 0; background: rgba(0, 255, 204, 0.2); z-index: 9999999; pointer-events: none; opacity: 0; transition: opacity 0.3s; }
            .hidden-video-feed { display: none; }
        </style>
        <div id="global-cursor"></div>
        <div id="global-toast">ACTION</div>
        <button id="gesture-fab" onclick="window.startGlobalGesture && window.startGlobalGesture()">📷 Enable Hand Tracking</button>
        <div id="shutdown-flash"></div>
        
        <div id="pip-camera">
            <div id="pip-header">● LIVE FEED</div>
            <canvas id="global_canvas" width="640" height="480"></canvas>
        </div>
        <div class="hidden-video-feed">
            <video id="global_video"></video>
        </div>
    `;
    document.body.appendChild(container);

    // 2. Engine Variables
    const fab = document.getElementById('gesture-fab');
    const cursor = document.getElementById('global-cursor');
    const toast = document.getElementById('global-toast');
    const pipCamera = document.getElementById('pip-camera');
    const video = document.getElementById('global_video');
    const canvas = document.getElementById('global_canvas');
    const ctx = canvas.getContext('2d');
    const shutdownFlash = document.getElementById('shutdown-flash');

    let isEngineRunning = false;
    let cameraInstance = null;
    let curX = window.innerWidth / 2;
    let curY = window.innerHeight / 2;
    
    let isLeftClicking = false;
    let isRightClicking = false;
    let isTerminating = false;
    let terminateTimer = 0;
    let lastScrollY = null;

    // Gesture Colors Mapping
    const COLORS = {
        POINT: '#00ffcc',   // Neon Cyan/Green
        LEFT: '#34d399',    // Light Green
        RIGHT: '#10b981',   // Mid Green
        SCROLL: '#059669',  // Darker Green
        TERM: '#047857'     // Deep Green
    };

    function showToast(msg, colorHex = COLORS.POINT) {
        toast.innerText = msg;
        toast.style.borderColor = colorHex;
        toast.style.color = colorHex;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 1500);
    }

    // Sync UI if the user navigates to gesture.html
    function syncLocalUI(status) {
        const overlay = document.getElementById('local-webcam-overlay');
        const dot = document.getElementById('local-engine-status');
        if(overlay && dot) {
            if(status === 'START') {
                overlay.style.opacity = '0';
                setTimeout(() => { overlay.style.display = 'none'; }, 500);
                dot.style.color = COLORS.POINT;
                dot.style.borderColor = COLORS.POINT;
                dot.innerText = '● ONLINE';
            } else if (status === 'STOP') {
                overlay.style.display = 'flex';
                void overlay.offsetWidth;
                overlay.style.opacity = '1';
                dot.style.color = COLORS.TERM;
                dot.style.borderColor = COLORS.TERM;
                dot.innerText = '● OFFLINE';
            }
        }
    }

    function loadScript(src) {
        return new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = src; s.crossOrigin = "anonymous";
            s.onload = resolve;
            document.head.appendChild(s);
        });
    }

    // 3. Start Engine Function (EXPOSED TO WINDOW)
    window.startGlobalGesture = async function() {
        if (isEngineRunning) return;
        fab.innerText = "Loading Engine...";

        try {
            await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
            await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js");
            await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
            await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

            const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
            hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });

            hands.onResults((results) => {
                // 1. Draw to PiP Camera
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

                // 2. Look for large Canvas (if we are on gesture.html)
                const localCanvas = document.getElementById('output_canvas');
                let lCtx = null;
                if(localCanvas) {
                    lCtx = localCanvas.getContext('2d');
                    lCtx.save();
                    lCtx.clearRect(0, 0, localCanvas.width, localCanvas.height);
                    lCtx.drawImage(results.image, 0, 0, localCanvas.width, localCanvas.height);
                }
                
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    cursor.style.display = 'block';
                    const lm = results.multiHandLandmarks[0];

                    // Draw Skeleton on PiP
                    drawConnectors(ctx, lm, HAND_CONNECTIONS, {color: COLORS.POINT, lineWidth: 3});
                    drawLandmarks(ctx, lm, {color: '#ffffff', lineWidth: 1, radius: 2});

                    // Draw Skeleton on Large Canvas (if exists)
                    if(lCtx) {
                        drawConnectors(lCtx, lm, HAND_CONNECTIONS, {color: COLORS.POINT, lineWidth: 6});
                        drawLandmarks(lCtx, lm, {color: '#ffffff', lineWidth: 3, radius: 4});
                    }

                    // Cursor Movement
                    let targetX = (1 - lm[8].x) * window.innerWidth;
                    let targetY = lm[8].y * window.innerHeight;
                    curX += (targetX - curX) * 0.3;
                    curY += (targetY - curY) * 0.3;
                    cursor.style.left = `${curX}px`;
                    cursor.style.top = `${curY}px`;

                    let iUp = lm[8].y < lm[6].y;
                    let mUp = lm[12].y < lm[10].y;
                    let rUp = lm[16].y < lm[14].y;
                    let pUp = lm[20].y < lm[18].y;

                    // ── TERMINATION (3 Fingers Up, Pinky Down) ──
                    if (iUp && mUp && rUp && !pUp) {
                        lastScrollY = null;
                        if (!isTerminating) {
                            isTerminating = true;
                            terminateTimer = Date.now();
                            showToast('TERMINATING... HOLD STILL', COLORS.TERM);
                            cursor.style.backgroundColor = COLORS.TERM;
                            cursor.style.boxShadow = `0 0 20px ${COLORS.TERM}`;
                            cursor.style.transform = 'translate(-50%, -50%) scale(2)';
                        } else if (Date.now() - terminateTimer > 1000) {
                            executeTermination();
                            isTerminating = false; 
                        }
                    } 
                    // ── SCROLL (Index & Middle Up) ──
                    else if (iUp && mUp && !rUp && !pUp) {
                        isTerminating = false;
                        if (!isLeftClicking && !isRightClicking) {
                            cursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
                            cursor.style.backgroundColor = COLORS.SCROLL; 
                            cursor.style.boxShadow = `0 0 15px ${COLORS.SCROLL}`;
                            
                            let currentY = (lm[8].y + lm[12].y) / 2;
                            if (lastScrollY !== null) {
                                let dy = (currentY - lastScrollY) * window.innerHeight;
                                window.scrollBy({ top: dy * 2.5 }); 
                            }
                            lastScrollY = currentY;
                        }
                    }
                    // ── CLICKS & POINT ──
                    else {
                        isTerminating = false;
                        lastScrollY = null;

                        let distIndex = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
                        let distMiddle = Math.hypot(lm[4].x - lm[12].x, lm[4].y - lm[12].y);

                        // LEFT CLICK
                        if (distIndex < 0.05 && !isLeftClicking) {
                            isLeftClicking = true;
                            cursor.style.transform = 'translate(-50%, -50%) scale(0.6)';
                            cursor.style.backgroundColor = COLORS.LEFT;
                            
                            let el = document.elementFromPoint(curX, curY);
                            if (el) { showToast('LEFT CLICK', COLORS.LEFT); el.click(); }
                        } else if (distIndex >= 0.05) { isLeftClicking = false; }

                        // RIGHT CLICK
                        if (distMiddle < 0.05 && !isRightClicking && !isLeftClicking) {
                            isRightClicking = true;
                            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                            cursor.style.backgroundColor = COLORS.RIGHT;
                            
                            let el = document.elementFromPoint(curX, curY);
                            if (el) {
                                showToast('RIGHT CLICK', COLORS.RIGHT);
                                el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: curX, clientY: curY }));
                            }
                        } else if (distMiddle >= 0.05) { isRightClicking = false; }

                        // POINT
                        if(!isLeftClicking && !isRightClicking) {
                            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                            cursor.style.backgroundColor = COLORS.POINT; 
                            cursor.style.boxShadow = `0 0 15px ${COLORS.POINT}`;
                        }
                    }
                } else {
                    cursor.style.display = 'none';
                    lastScrollY = null;
                }
                ctx.restore();
                if(lCtx) lCtx.restore();
            });

            cameraInstance = new Camera(video, {
                onFrame: async () => { await hands.send({image: video}); },
                width: 1280, height: 720
            });

            await cameraInstance.start();
            isEngineRunning = true;
            pipCamera.style.display = 'block'; 
            fab.innerText = "🟢 Tracking Active";
            fab.style.background = COLORS.POINT;
            fab.style.color = "#000";
            showToast("Global Gesture Control Activated!", COLORS.POINT);
            syncLocalUI('START');

        } catch (e) {
            console.error(e);
            fab.innerText = "⚠️ Camera Error";
            alert("Please allow camera access.");
        }
    }

    function executeTermination() {
        shutdownFlash.style.opacity = '1';
        setTimeout(() => { shutdownFlash.style.opacity = '0'; }, 500);

        showToast("SYSTEM TERMINATED", COLORS.TERM);
        cursor.style.display = 'none';
        pipCamera.style.display = 'none'; 
        isEngineRunning = false;
        
        if(cameraInstance) { cameraInstance.stop(); }

        fab.innerText = "📷 Enable Hand Tracking";
        fab.style.background = "rgba(10, 13, 20, 0.9)";
        fab.style.color = COLORS.POINT;
        syncLocalUI('STOP');
    }

    // 4. SPA ROUTER (No longer intercepts clicks on our own triggers)
    document.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith(window.location.origin) && !link.getAttribute('target') && !link.href.includes('#') && !link.href.endsWith('.exe') && !link.href.endsWith('.7z')) {
            e.preventDefault();
            const url = link.href;
            history.pushState(null, '', url);
            await loadNewPageContent(url);
        }
    });

    window.addEventListener('popstate', async () => {
        await loadNewPageContent(window.location.href);
    });

    async function loadNewPageContent(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');

            document.title = newDoc.title;

            Array.from(document.head.querySelectorAll('style:not(#global-gesture-styles), link[rel="stylesheet"]')).forEach(el => el.remove());
            Array.from(newDoc.head.querySelectorAll('style, link[rel="stylesheet"]')).forEach(el => {
                document.head.appendChild(el.cloneNode(true));
            });

            const globalContainer = document.getElementById('global-gesture-container');

            document.body.innerHTML = '';
            Array.from(newDoc.body.childNodes).forEach(node => {
                document.body.appendChild(node.cloneNode(true));
            });

            document.body.appendChild(globalContainer);

            if (isEngineRunning) {
                syncLocalUI('START');
            }

            Array.from(document.body.querySelectorAll('script')).forEach(oldScript => {
                if (oldScript.src && oldScript.src.includes('global-gesture.js')) return; 
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                if (oldScript.innerHTML) { newScript.appendChild(document.createTextNode(oldScript.innerHTML)); }
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
            
            // Re-sync the theme switch for the newly loaded DOM
            if (window.initializeTheme) window.initializeTheme();
            
            // Dispatch load event to trigger inline script initializers attached to window.onload
            setTimeout(() => window.dispatchEvent(new Event('load')), 50);
            
        } catch (err) {
            console.error("Routing error:", err);
            window.location.href = url; 
        }
    }
});