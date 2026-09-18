

const QUALITY_PRESETS = {
    LOW: {
        resScale: 0.85,
        shadowRes: 0,
        shadowCascades: 0,
        shadowBias: 0,
        shadowNormalBias: 0,
        bloom: false,
        bloomThreshold: 1.0,
        bloomStrength: 0,
        bloomRadius: 0,
        fps: 60,
        textureFilter: THREE.LinearFilter,
        maxAnisotropy: 1,
        lodMultiplier: 0.5,
        maxParticles: 500,
        description: 'Performance (Blob Shadows)'
    },
    MED: {
        resScale: 1.0,
        shadowRes: 512,
        shadowCascades: 1,
        shadowBias: -0.0003,
        shadowNormalBias: 0.015,
        bloom: false,
        bloomThreshold: 0.9,
        bloomStrength: 0.2,
        bloomRadius: 0.4,
        fps: 60,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 2,
        lodMultiplier: 0.75,
        maxParticles: 1500,
        description: 'Balanced'
    },
    HIGH: {
        resScale: 1.0,
        shadowRes: 1024,
        shadowCascades: 2,
        shadowBias: -0.0001,
        shadowNormalBias: 0.01,
        bloom: false,
        bloomThreshold: 0.88,
        bloomStrength: 0.25,
        bloomRadius: 0.45,
        fps: 60,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 4,
        lodMultiplier: 1.0,
        maxParticles: 3000,
        description: 'High Quality'
    },
    ULTRA: {
        resScale: 1.0,
        shadowRes: 2048,
        shadowCascades: 2,
        shadowBias: -0.00005,
        shadowNormalBias: 0.005,
        bloom: true,
        bloomThreshold: 0.86,
        bloomStrength: 0.25,
        bloomRadius: 0.5,
        fps: 60,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 8,
        lodMultiplier: 1.25,
        maxParticles: 5000,
        description: 'Ultra Quality'
    }
};

class RenderCore {
    constructor() {
        this.renderer = null;
        this.canvas = null;
        this.currentPreset = 'MED';
        this.renderTarget = null;
        this.blitScene = null;
        this.blitCamera = null;
        this.blitMesh = null;
        this.composer = null;
        this.bloomPass = null;
        this._frameTimeHistory = [];
        this._frameBudgetFrames = 0;
        this._autoQualityEnabled = true;
        this._lastQualityCheck = 0;
    }

    
    init(canvas) {
        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false,
            depth: true,
            stencil: false,
            preserveDrawingBuffer: false
        });


        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.60;


        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        this.renderer.shadowMap.needsUpdate = true;


        this.autoDetectQuality();

        return this.renderer;
    }

    
    setQuality(presetKey) {
        if (!QUALITY_PRESETS[presetKey]) {
            console.error(`RenderCore: Invalid quality preset: ${presetKey}`);
            return;
        }

        this.currentPreset = presetKey;
        this._applyQualitySettings(QUALITY_PRESETS[presetKey]);
        console.log(`RenderCore: Quality set to ${presetKey}`);
    }

    
    setAutoQuality(enabled) {
        this._autoQualityEnabled = enabled;
    }

    
    autoDetectQuality() {
        console.log("RenderCore: Auto-detecting hardware capabilities...");
        const savedQuality = localStorage.getItem('traffic_quality');
        if (savedQuality && QUALITY_PRESETS[savedQuality]) {
            console.log(`RenderCore: Using saved quality preset from localStorage: ${savedQuality}`);
            this.setQuality(savedQuality);
            this.setAutoQuality(false);
            // DPR-aware resScale correction even for saved presets (720p→2K)
            this._applyDPRCorrection();
            return;
        }
        let score = 2;


        const gl = this.renderer.getContext();
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log(`RenderCore: Detected GPU: ${renderer}`);

            const highEnd = /NVIDIA|RTX|Radeon|AMD|GeForce GTX 1[6-9]|GeForce RTX|RX [56]?[0-9]{3}/i;
            const lowEnd = /Adreno|Mali|Intel.*HD|Intel.*UHD|Apple GPU|PowerVR|VideoCore/i;

            if (highEnd.test(renderer)) {
                score += 1;
                if (/RTX|GTX 30|GTX 40|RX 6[0-9]{3}|RX 7[0-9]{3}/i.test(renderer)) score += 1;
            } else if (lowEnd.test(renderer)) {
                score -= 1;
            }
        }


        if (navigator.hardwareConcurrency) {
            console.log(`RenderCore: CPU Cores: ${navigator.hardwareConcurrency}`);
            if (navigator.hardwareConcurrency <= 2) score -= 1;
            else if (navigator.hardwareConcurrency >= 8) score += 1;
        }


        if (navigator.deviceMemory) {
            console.log(`RenderCore: Device Memory: ${navigator.deviceMemory}GB`);
            if (navigator.deviceMemory < 4) score -= 1;
            else if (navigator.deviceMemory >= 16) score += 1;
        }


        const msPerFrame = this._perfTest();
        console.log(`RenderCore: Burn-in test: ${msPerFrame.toFixed(2)}ms/frame`);
        if (msPerFrame > 16.67) score -= 2;
        else if (msPerFrame > 10) score -= 1;


        let finalPreset = 'MED';
        if (score <= 0) finalPreset = 'LOW';
        else if (score === 1) finalPreset = 'LOW';
        else if (score === 2) finalPreset = 'MED';
        else if (score === 3) finalPreset = 'HIGH';
        else if (score >= 4) finalPreset = 'ULTRA';


        if (msPerFrame > 33) finalPreset = 'LOW';

        // ── 720p→2K correction: mobile DPR + viewport size ──
        const vw = window.innerWidth;
        const dpr = window.devicePixelRatio || 1;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || vw <= 767;
        if (isMobile) {
            // 720p budget phones (360w @3x): force LOW, 1080p mid: cap at MED, 2K tablets allow HIGH
            if (vw <= 389 && dpr >= 2.8) finalPreset = 'LOW';
            else if (vw <= 479 && finalPreset === 'ULTRA') finalPreset = 'HIGH';
            else if (vw <= 599 && finalPreset === 'ULTRA') finalPreset = 'HIGH';
        }
        // High-DPI desktop 2K: allow ULTRA but with resScale correction
        console.log(`RenderCore: Auto-detected quality: ${finalPreset} (score: ${score}, vw:${vw}, dpr:${dpr.toFixed(1)})`);
        this.setQuality(finalPreset);
        this._applyDPRCorrection();
    }

    _applyDPRCorrection() {
        // Keep fill-rate sane on high-DPI mobiles: effective res = preset.resScale * dprFactor
        const dpr = window.devicePixelRatio || 1;
        const vw = window.innerWidth;
        const isMobile = vw <= 767 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile || dpr <= 1.5) return;
        const preset = QUALITY_PRESETS[this.currentPreset];
        if (!preset) return;
        // 720p@3x: multiply by 0.62 → ~0.52 effective; 1080p@2.6x: 0.71; 2K tablet@2x: 0.82
        const dprFactor = dpr >= 3 ? 0.62 : dpr >= 2.5 ? 0.71 : dpr >= 2 ? 0.82 : 1;
        const corrected = Math.max(0.5, Math.min(1, preset.resScale * dprFactor));
        if (Math.abs(corrected - preset.resScale) > 0.02) {
            console.log(`RenderCore: DPR correction resScale ${preset.resScale} → ${corrected.toFixed(2)} (dpr ${dpr.toFixed(1)})`);
            // Store corrected without mutating preset
            this._dprResScale = corrected;
        } else {
            this._dprResScale = null;
        }
    }

    
    _perfTest() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        const start = performance.now();
        const iterations = 20;
        for (let i = 0; i < iterations; i++) {
            this.renderer.render(scene, camera);
        }
        return (performance.now() - start) / iterations;
    }

    
    _setupRenderBypass() {
        if (!this.renderer || !this.canvas) return;

        const preset = this.getPreset();
        const scale = this._dprResScale != null ? this._dprResScale : preset.resScale;

        const width = Math.floor(this.canvas.width * scale);
        const height = Math.floor(this.canvas.height * scale);


        if (this.renderTarget) this.renderTarget.dispose();

        this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.sRGBEncoding,
            depthBuffer: true,
            stencilBuffer: false
        });


        if (!this.blitScene) {
            this.blitScene = new THREE.Scene();
            this.blitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            const geometry = new THREE.PlaneGeometry(2, 2);
            this.blitMesh = new THREE.Mesh(
                geometry,
                new THREE.MeshBasicMaterial({ transparent: true })
            );
            this.blitScene.add(this.blitMesh);
        }

        this.blitMesh.material.map = this.renderTarget.texture;
        this.blitMesh.material.needsUpdate = true;
    }

    
    _applyQualitySettings(preset) {
        if (!this.renderer) return;

        console.log(`RenderCore: Applying quality settings - ${preset.description}`);


        if (preset.resScale !== 1.0) {
            this._setupRenderBypass();
        } else {
            if (this.renderTarget) {
                this.renderTarget.dispose();
                this.renderTarget = null;
            }
        }


        if (this.renderer.shadowMap) {
            this.renderer.shadowMap.enabled = (preset.shadowRes > 0);
            this._defaultShadowRes = preset.shadowRes;
            this._defaultShadowBias = preset.shadowBias;
            this._defaultShadowNormalBias = preset.shadowNormalBias;
        }


        this._defaultTextureFilter = preset.textureFilter;
        this._defaultAnisotropy = preset.maxAnisotropy;


        this._lodMultiplier = preset.lodMultiplier;


        this._maxParticles = preset.maxParticles;


        if (this.composer && this.bloomPass) {
            this.bloomPass.enabled = preset.bloom;
            if (preset.bloom) {
                this.bloomPass.threshold = preset.bloomThreshold;
                this.bloomPass.strength = preset.bloomStrength;
                this.bloomPass.radius = preset.bloomRadius;
            }
        }
    }

    
    render(scene, camera) {
        if (!this.renderer) return;

        const preset = this.getPreset();
        const scale = this._dprResScale != null ? this._dprResScale : preset.resScale;

        if (scale === 1.0 && this._dprResScale == null) {

            this.renderer.render(scene, camera);
        } else {

            if (!this.renderTarget) this._setupRenderBypass();

            this.renderer.setRenderTarget(this.renderTarget);
            this.renderer.render(scene, camera);

            this.renderer.setRenderTarget(null);
            this.renderer.render(this.blitScene, this.blitCamera);
        }


        if (this._autoQualityEnabled) this._checkFrameBudget();
    }

    
    _checkFrameBudget() {
        const now = performance.now();
        if (!this._lastFrameTime) this._lastFrameTime = now;
        
        const dt = now - this._lastFrameTime;
        this._lastFrameTime = now;
        
        this._frameTimeHistory.push(dt);
        if (this._frameTimeHistory.length > 120) this._frameTimeHistory.shift();

        this._frameBudgetFrames++;

        if (this._frameBudgetFrames >= 120) { // Check every 2s
            this._frameBudgetFrames = 0;
            // Cooldown of 6s before allowing another auto adjustment
            if (this._lastQualityShift && now - this._lastQualityShift < 6000) return;

            const avg = this._frameTimeHistory.reduce((a, b) => a + b, 0) / this._frameTimeHistory.length;
            const preset = this.getPreset();
            const budget = 1000 / preset.fps;
            
            if (avg > budget * 1.35 && this.currentPreset !== 'LOW') {
                this._lastQualityShift = now;
                this._downgradePreset();
            } else if (avg < budget * 0.55 && this.currentPreset !== 'ULTRA') {
                this._lastQualityShift = now;
                this._upgradePreset();
            }
        }
    }

    _downgradePreset() {
        const order = ['LOW', 'MED', 'HIGH', 'ULTRA'];
        const idx = order.indexOf(this.currentPreset);
        if (idx > 0) {
            this.setQuality(order[idx - 1]);
            console.log(`RenderCore: Auto-downgraded to ${this.currentPreset} (frame budget exceeded)`);
        }
    }

    _upgradePreset() {
        const order = ['LOW', 'MED', 'HIGH', 'ULTRA'];
        const idx = order.indexOf(this.currentPreset);
        if (idx < order.length - 1) {
            this.setQuality(order[idx + 1]);
            console.log(`RenderCore: Auto-upgraded to ${this.currentPreset} (frame budget healthy)`);
        }
    }

    
    setupPostProcessing(width, height, isMobile) {
        if (!THREE.EffectComposer || isMobile) {
            this.composer = null;
            return;
        }

        try {
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

            const preset = this.getPreset();
            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(width, height),
                preset.bloomStrength,
                preset.bloomRadius,
                preset.bloomThreshold
            );
            this.bloomPass.enabled = preset.bloom;
            this.composer.addPass(this.bloomPass);

            this.composer.setSize(width, height);
        } catch (e) {
            console.warn("Post processing setup failed:", e);
            this.composer = null;
        }
    }

    
    resizePostProcessing(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
        }
        if (this.renderTarget) {
            this._setupRenderBypass();
        }
    }

    getPreset() {
        return QUALITY_PRESETS[this.currentPreset];
    }

    getLODMultiplier() {
        return this._lodMultiplier || 1.0;
    }

    getMaxParticles() {
        return this._maxParticles || 2000;
    }

    getDefaultShadowRes() {
        return this._defaultShadowRes || 1024;
    }

    getDefaultShadowBias() {
        return this._defaultShadowBias || -0.0003;
    }

    getDefaultShadowNormalBias() {
        return this._defaultShadowNormalBias || 0.015;
    }

    getDefaultTextureFilter() {
        return this._defaultTextureFilter || THREE.LinearMipmapLinearFilter;
    }

    getDefaultAnisotropy() {
        return this._defaultAnisotropy || 4;
    }
}


window.RenderCore = RenderCore;
window.QUALITY_PRESETS = QUALITY_PRESETS;