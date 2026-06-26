let game = null;

    window.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('cert-logo-1')) {
          document.getElementById('cert-logo-1').src = typeof CERT_LOGO_1 !== 'undefined' ? CERT_LOGO_1 : '';
      }
      if (document.getElementById('cert-logo-2')) {
          document.getElementById('cert-logo-2').src = typeof CERT_LOGO_2 !== 'undefined' ? CERT_LOGO_2 : '';
      }
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('is-touch');
      }
      // Do NOT call ui.init() or create Game() here yet. Wait for assets to load.
    });

    // Developer Mode: Ctrl+Shift+D to unlock everything
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        ui.adminUnlock();
      }
    });


    window.PRELOADED_MODELS = {};
    function preloadModels(callback) {
      if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') { callback(); return; }
      

      const loader = new THREE.GLTFLoader();
      const basePath = 'Models/kenney_car-kit/Models/GLB format/';
      const filesToLoad = [
        // Core
        { key: 'car', file: basePath + 'sedan.glb' },
        { key: 'taxi', file: basePath + 'taxi.glb' },
        { key: 'police', file: basePath + 'police.glb' },
        { key: 'bus', file: basePath + 'delivery.glb' },
        { key: 'truck', file: basePath + 'truck.glb' },
        { key: 'auto', file: basePath + 'van.glb' },
        { key: 'bike', file: basePath + 'race.glb' },
        
        // Roads
        { key: 'road_straight', file: 'Models/road__avenue__street/scene.gltf' },
        { key: 'road_intersect', file: 'Models/kenney_city-kit-roads/Models/GLB format/road-intersection.glb' },
        { key: 'road_cross', file: 'Models/kenney_city-kit-roads/Models/GLB format/road-crossroad.glb' },

        // Characters
        { key: 'char_f_a', file: 'Models/kenney_mini-characters/Models/GLB format/character-female-a.glb' },
        { key: 'char_f_b', file: 'Models/kenney_mini-characters/Models/GLB format/character-female-b.glb' },
        { key: 'char_f_c', file: 'Models/kenney_mini-characters/Models/GLB format/character-female-c.glb' },
        { key: 'char_m_a', file: 'Models/kenney_mini-characters/Models/GLB format/character-male-a.glb' },
        { key: 'char_m_b', file: 'Models/kenney_mini-characters/Models/GLB format/character-male-b.glb' },
        { key: 'char_m_c', file: 'Models/kenney_mini-characters/Models/GLB format/character-male-c.glb' },
        
        // Animals
        { key: 'animal_dog', file: 'Models/kenney_cube-pets_1.0/Models/GLB format/animal-dog.glb' },
        { key: 'animal_cow', file: 'Models/kenney_cube-pets_1.0/Models/GLB format/animal-cow.glb' },
        { key: 'animal_cat', file: 'Models/kenney_cube-pets_1.0/Models/GLB format/animal-cat.glb' },
        
        // Watercraft
        { key: 'ship_cargo', file: 'Models/kenney_watercraft-pack/Models/GLB format/ship-cargo-a.glb' },
        { key: 'boat_speed', file: 'Models/kenney_watercraft-pack/Models/GLB format/boat-speed-a.glb' },
        
        // Emergency
        { key: 'ambulance', file: 'Models/kenney_car-kit/Models/GLB format/ambulance.glb' },
        
        // Transit
        { key: 'train', file: 'Models/kenney_train-kit/Models/GLB format/train-locomotive-a.glb' },
        { key: 'metro', file: 'Models/kenney_train-kit/Models/GLB format/train-electric-subway-a.glb' }
      ];

      // Add Suburban Buildings (a to u)
      'abcdefghijklmnopqrstu'.split('').forEach(l => {
          filesToLoad.push({ key: 'suburban_' + l, file: `Models/kenney_city-kit-suburban_20/Models/GLB format/building-type-${l}.glb` });
      });

      // Add Industrial Buildings (a to t)
      'abcdefghijklmnopqrst'.split('').forEach(l => {
          filesToLoad.push({ key: 'industrial_' + l, file: `Models/kenney_city-kit-industrial_1.0/Models/GLB format/building-${l}.glb` });
      });
      
      // Add more cars randomly
      ['hatchback-sports', 'suv', 'suv-luxury', 'race-future', 'sedan-sports', 'kart-oobi', 'kart-oodi', 'kart-ooli', 'kart-oopi', 'kart-oozi', 'tractor', 'tractor-police', 'tractor-shovel'].forEach(c => {
          filesToLoad.push({ key: 'car_' + c, file: `Models/kenney_car-kit/Models/GLB format/${c}.glb` });
      });

      // Add more trucks randomly
      ['firetruck', 'garbage-truck', 'truck-flat'].forEach(t => {
          filesToLoad.push({ key: 'truck_' + t, file: `Models/kenney_car-kit/Models/GLB format/${t}.glb` });
      });

      let loaded = 0;
      const ld = document.getElementById('loading-screen');
      const pctEl = document.getElementById('loading-pct');
      const barEl = document.getElementById('loading-bar');
      const statusEl = document.getElementById('loading-status');

      // Sequential loading to prevent main thread freezing
      const loadNext = (index) => {
        if (index >= filesToLoad.length) {
            if (ld) {
                ld.innerHTML = `
                    <h1 style="color: #34D399;">World Ready!</h1>
                    <div style="font-size: 1rem; color: #8891AA;">Entering Traffic Academy...</div>
                `;
                setTimeout(() => {
                    ld.style.opacity = '0';
                    ld.style.transform = 'scale(1.05)';
                    setTimeout(() => ld.remove(), 800);
                }, 800);
            }
            callback();
            return;
        }
        
        const asset = filesToLoad[index];
        if (statusEl) statusEl.textContent = `Loading: ${asset.key}...`;
        
        loader.load(asset.file, (gltf) => {
            // Apply materials and cast shadows on the loaded model
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.frustumCulled = false;
                    
                    if (child.material && child.material.map) {
                        child.material.map.magFilter = THREE.NearestFilter;
                        child.material.map.minFilter = THREE.NearestFilter;
                        child.material.map.needsUpdate = true;
                    }
                }
            });
            window.PRELOADED_MODELS[asset.key] = gltf.scene;
            
            loaded++;
            const pct = Math.round((loaded / filesToLoad.length) * 100);
            if (pctEl) pctEl.textContent = pct + '%';
            if (barEl) barEl.style.width = pct + '%';
            
            // Yield to main thread
            setTimeout(() => loadNext(index + 1), 20); // Faster background loading 20ms instead of 100ms
        }, undefined, (err) => {
            console.error("Error loading asset:", asset.file, err);
            loaded++;
            setTimeout(() => loadNext(index + 1), 20);
        });
      };
      
      // Start immediately
      setTimeout(() => loadNext(0), 100);
    }
    // Confetti particle system
    window.confetti = {
      canvas: null, ctx: null, particles: [], running: false,
      init() {
        if (this.canvas) return;
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
      },
      burst(duration = 3000) {
        this.init();
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.particles = [];
        const colors = ['#ff6b35', '#ffd54a', '#4caf50', '#2196f3', '#e91e63', '#9c27b0', '#00bcd4', '#ff9800'];
        for (let i = 0; i < 150; i++) {
          this.particles.push({
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 12,
            vy: -Math.random() * 18 - 4,
            w: Math.random() * 10 + 4,
            h: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * 360,
            vr: (Math.random() - 0.5) * 12,
            life: 1
          });
        }
        this.running = true;
        const start = Date.now();
        const animate = () => {
          if (!this.running) return;
          const elapsed = Date.now() - start;
          if (elapsed > duration) { this.running = false; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); return; }
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.particles.forEach(p => {
            p.x += p.vx;
            p.vy += 0.35;
            p.y += p.vy;
            p.rot += p.vr;
            p.life = Math.max(0, 1 - elapsed / duration);
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rot * Math.PI / 180);
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            this.ctx.restore();
          });
          requestAnimationFrame(animate);
        };
        animate();
      }
    };


    // Quiz confirmation logic
    ui._selectedAnswer = -1;
    ui.selectOption = function (idx, correctIdx) {
      this._selectedAnswer = idx;
      this._correctIdx = correctIdx;
      document.querySelectorAll('.qo').forEach((o, i) => {
        o.classList.remove('selected');
        if (i === idx) o.classList.add('selected');
      });
      const cb = document.getElementById('qconfirm');
      if (cb) cb.classList.add('show');
    };
    ui.confirmAnswer = function () {
      if (this._selectedAnswer < 0) return;
      const cb = document.getElementById('qconfirm');
      if (cb) cb.classList.remove('show');
      // Call the original answer handler
      this._submitAnswer(this._selectedAnswer, this._correctIdx);
      this._selectedAnswer = -1;
    };


    // Challan card stack
    ui._challanCards = [];
    ui._addChallanCard = function (off, amt) {
      const stack = document.getElementById('challan-stack');
      if (!stack) return;
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
      if (this._challanCards.length > 5) {
        const old = this._challanCards.shift();
        if (old.parentNode) old.parentNode.removeChild(old);
      }
    };

    window.ui = ui; window.sfx = sfx;
    preloadModels(() => {
      ui.init();
      game = new Game();
      window.game = game;
      // ui.init already calls show('ss'), but we can be explicit:
      // ui.showStart() might not exist, but let's just use ui.show('ss') to be safe
      if (ui.showStart) ui.showStart();
    });
  
    async function downloadSourceCode(e) {
      if (e) e.preventDefault();
      const btn = document.getElementById("dl-btn");
      if(!btn || typeof JSZip === "undefined") { alert("Zip library loading, please wait."); return; }
      
      const origText = btn.innerHTML;
      btn.innerHTML = "&#9203; Zipping... (Make sure to run via local server for this to work!)";
      btn.style.pointerEvents = "none";
      
      try {
        const zip = new JSZip();
        const files = [
          "Academy",
          "vehicles.js",
          "lambo.js",
          "auto.js",
          "bus.js"
        ];
        
        let fetched = 0;
        
        for (let f of files) {
          let fetchUrl = f;
          if (f === "Academy") fetchUrl = window.location.href.split("?")[0].split("#")[0];
          
          try {
            const res = await fetch(fetchUrl);
            if (res.ok) {
              const blob = await res.blob();
              let fName = f;
              if (f === "Academy") fName = fetchUrl.split("/").pop() || "Academy";
              zip.file(fName, blob);
              fetched++;
            } else {
              console.warn("Could not fetch " + f);
            }
          } catch(err) {
            console.warn("Fetch failed for " + f + " (Likely CORS issue on file:/// origin)", err);
          }
        }
        
        if (fetched === 0) {
          alert("Failed to read local files! This usually happens if you opened the HTML file directly (file:///). Please host this folder using a local web server (e.g. VS Code Live Server) to enable dynamic zipping.");
          btn.innerHTML = origText;
          btn.style.pointerEvents = "auto";
          return;
        }

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Traffic_Source_Code.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        btn.innerHTML = "&#9989; Downloaded!";
        setTimeout(() => { btn.innerHTML = origText; btn.style.pointerEvents = "auto"; }, 3000);
      } catch(e) {
        console.error(e);
        btn.innerHTML = "&#10060; Error!";
        setTimeout(() => { btn.innerHTML = origText; btn.style.pointerEvents = "auto"; }, 3000);
      }
    }
