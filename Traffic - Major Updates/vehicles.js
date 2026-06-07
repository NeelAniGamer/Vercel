
// Indian Vehicles Procedural Builder
window.IndianVehicles = {
    textures: {},
    init: function() {
        this.textures.grille = this.createCanvasTex(64, 64, (ctx) => {
            ctx.fillStyle = '#111'; ctx.fillRect(0,0,64,64);
            ctx.strokeStyle = '#333'; ctx.lineWidth = 4;
            for(let i=0; i<64; i+=8) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
            }
        });
        
        this.textures.headlight = this.createCanvasTex(32, 32, (ctx) => {
            ctx.fillStyle = '#eee'; ctx.fillRect(0,0,32,32);
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(16,16,10,0,Math.PI*2); ctx.fill();
        });
        
        this.textures.glass = this.createCanvasTex(64, 64, (ctx) => {
            ctx.fillStyle = '#1a2a3a'; ctx.fillRect(0,0,64,64);
            ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0,64); ctx.lineTo(64,0); ctx.stroke();
        });
        
        this.textures.wheel = this.createCanvasTex(64, 64, (ctx) => {
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(32,32,32,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(32,32,20,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(32,32,10,0,Math.PI*2); ctx.fill();
        });
    },
    
    createCanvasTex: function(w, h, drawFn) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        drawFn(ctx);
        const tex = new THREE.CanvasTexture(c);
        return tex;
    },
    
    buildWheel: function() {
        const w = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16),
            new THREE.MeshLambertMaterial({color: 0x111111, map: this.textures.wheel})
        );
        w.rotation.z = Math.PI / 2;
        return w;
    },
    
    buildVehicle: function(type, colorHex) {
        if(!this.textures.grille) this.init();
        
        const g = new THREE.Group();
        const bMat = new THREE.MeshPhongMaterial({color: colorHex, shininess: 80});
        const gMat = new THREE.MeshPhongMaterial({color: 0xffffff, map: this.textures.glass, shininess: 100});
        const grMat = new THREE.MeshLambertMaterial({color: 0xffffff, map: this.textures.grille});
        
        let body, roof;
        
        // --- TWO WHEELERS ---
        if(type === 'splendor' || type === 'bike' || type === 'twowheeler') {
            body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 1.8), bMat);
            body.position.y = 0.6;
            const w1 = this.buildWheel(); w1.position.set(0, 0.35, -0.7);
            const w2 = this.buildWheel(); w2.position.set(0, 0.35, 0.7);
            g.add(body, w1, w2);
        }
        else if(type === 'activa' || type === 'scooter') {
            body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.6), bMat);
            body.position.y = 0.5;
            const front = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), bMat);
            front.position.set(0, 0.8, -0.65);
            const w1 = this.buildWheel(); w1.position.set(0, 0.35, -0.6);
            const w2 = this.buildWheel(); w2.position.set(0, 0.35, 0.6);
            g.add(body, front, w1, w2);
        }
        // --- THREE WHEELERS ---
        else if(type === 'auto') {
            // Auto Rickshaw (Yellow/Black or Green/Yellow)
            const aMat = new THREE.MeshPhongMaterial({color: 0x2e8b57}); // Green body
            const rMat = new THREE.MeshPhongMaterial({color: 0xffd700}); // Yellow roof
            body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 2.4), aMat);
            body.position.y = 0.6;
            roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 2.0), rMat);
            roof.position.set(0, 1.5, 0.2);
            
            const w1 = this.buildWheel(); w1.position.set(0, 0.35, -0.9);
            const w2 = this.buildWheel(); w2.position.set(-0.6, 0.35, 0.8);
            const w3 = this.buildWheel(); w3.position.set(0.6, 0.35, 0.8);
            g.add(body, roof, w1, w2, w3);
        }
        // --- PASSENGER CARS ---
        else if(type === 'wagonr' || type === 'car') {
            body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.4), bMat);
            body.position.y = 0.6;
            roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 2.2), gMat);
            roof.position.set(0, 1.45, -0.2);
            g.add(body, roof);
            this.addFourWheels(g, 1.6, 3.4);
        }
        else if(type === 'creta' || type === 'suv') {
            body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 4.0), bMat);
            body.position.y = 0.8;
            roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2.6), gMat);
            roof.position.set(0, 1.7, -0.2);
            g.add(body, roof);
            this.addFourWheels(g, 1.8, 4.0);
        }
        else if(type === 'city' || type === 'sedan') {
            body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 4.4), bMat);
            body.position.y = 0.6;
            roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 2.0), gMat);
            roof.position.set(0, 1.3, 0);
            g.add(body, roof);
            this.addFourWheels(g, 1.7, 4.4);
        }
        else if(type === 'innova' || type === 'mpv') {
            body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 4.6), bMat);
            body.position.y = 0.75;
            roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 3.2), gMat);
            roof.position.set(0, 1.6, 0);
            g.add(body, roof);
            this.addFourWheels(g, 1.8, 4.6);
        }
        else if(type === 'cab' || type === 'taxi') {
            // Dzire cab
            const wMat = new THREE.MeshPhongMaterial({color: 0xffffff});
            body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 3.8), wMat);
            body.position.y = 0.6;
            roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.8), gMat);
            roof.position.set(0, 1.3, 0);
            
            // Taxi sign
            const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), new THREE.MeshLambertMaterial({color:0xffd700}));
            sign.position.set(0, 1.75, 0);
            
            g.add(body, roof, sign);
            this.addFourWheels(g, 1.6, 3.8);
        }
        // --- COMMERCIAL VEHICLES ---
        else if(type === 'ace' || type === 'scv') {
            // Tata Ace
            body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 3.5), bMat);
            body.position.y = 0.65;
            const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.2), bMat);
            cab.position.set(0, 1.6, -1.15);
            const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 2.3), new THREE.MeshLambertMaterial({color: 0x888888}));
            bed.position.set(0, 1.2, 0.6);
            g.add(body, cab, bed);
            this.addFourWheels(g, 1.5, 3.5);
        }
        else if(type === 'truck' || type === 'eicher') {
            body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 7.0), new THREE.MeshPhongMaterial({color: 0x222222}));
            body.position.y = 0.8;
            const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.8), bMat);
            cab.position.set(0, 2.3, -2.6);
            const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.6, 5.0), new THREE.MeshLambertMaterial({color: 0xaa4422}));
            cargo.position.set(0, 2.5, 1.0);
            g.add(body, cab, cargo);
            this.addFourWheels(g, 2.4, 7.0, 0.5);
        }
        // --- PUBLIC TRANSPORT ---
        else if(type === 'bus' || type === 'msrtc') {
            const msrtcMat = new THREE.MeshPhongMaterial({color: 0xcc2222}); // Red MSRTC bus
            body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 10.0), msrtcMat);
            body.position.y = 2.0;
            const windows = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.2, 9.8), gMat);
            windows.position.y = 2.4;
            g.add(body, windows);
            
            // Add 6 wheels for heavy bus
            const y = 0.5;
            const hw = 1.3, hl = 4.0;
            const positions = [
                [-hw, y, -hl], [hw, y, -hl],
                [-hw, y, hl], [hw, y, hl],
                [-hw, y, hl-1.5], [hw, y, hl-1.5]
            ];
            positions.forEach(p => {
                const w = this.buildWheel();
                w.scale.set(1.5, 1.5, 1.5);
                w.position.set(p[0], p[1], p[2]);
                g.add(w);
            });
        }
        else {
            // Default blocky car
            body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.8), bMat);
            body.position.y = 0.6;
            roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 2.0), gMat);
            roof.position.set(0, 1.35, -0.2);
            g.add(body, roof);
            this.addFourWheels(g, 1.6, 3.8);
        }
        
        g.type = type;
        return g;
    },
    
    addFourWheels: function(g, w, l, wheelScale=1.0) {
        const hw = w/2, hl = l/2;
        const y = 0.35 * wheelScale;
        const positions = [
            [-hw, y, -hl+0.6], [hw, y, -hl+0.6],
            [-hw, y, hl-0.6], [hw, y, hl-0.6]
        ];
        positions.forEach(p => {
            const wheel = this.buildWheel();
            wheel.scale.set(wheelScale, wheelScale, wheelScale);
            wheel.position.set(p[0], p[1], p[2]);
            g.add(wheel);
        });
    }
};
