

const QUALITY_PRESETS = {
    LOW: {
        resScale: 0.85,
        shadowRes: 512,
        shadowCascades: 1,
        shadowBias: -0.0005,
        shadowNormalBias: 0.02,
        bloom: false,
        bloomThreshold: 1.0,
        bloomStrength: 0,
        bloomRadius: 0,
        fps: 30,
        textureFilter: THREE.LinearFilter,
        maxAnisotropy: 1,
        lodMultiplier: 0.5,
        maxParticles: 500,
        description: 'Performance mode'
    },
    MED: {
        resScale: 1.0,
        shadowRes: 1024,
        shadowCascades: 2,
        shadowBias: -0.0003,
        shadowNormalBias: 0.015,
        bloom: false,
        bloomThreshold: 0.9,
        bloomStrength: 0.2,
        bloomRadius: 0.4,
        fps: 60,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 4,
        lodMultiplier: 0.75,
        maxParticles: 2000,
        description: 'Balanced'
    },
    HIGH: {
        resScale: 1.0,
        shadowRes: 2048,
        shadowCascades: 3,
        shadowBias: -0.0001,
        shadowNormalBias: 0.01,
        bloom: true,
        bloomThreshold: 0.88,
        bloomStrength: 0.25,
        bloomRadius: 0.45,
        fps: 60,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 8,
        lodMultiplier: 1.0,
        maxParticles: 5000,
        description: 'High Quality'
    },
    ULTRA: {
        resScale: 1.0,
        shadowRes: 4096,
        shadowCascades: 4,
        shadowBias: -0.00005,
        shadowNormalBias: 0.005,
        bloom: true,
        bloomThreshold: 0.86,
        bloomStrength: 0.30,
        bloomRadius: 0.5,
        fps: 144,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 16,
        lodMultiplier: 1.5,
        maxParticles: 10000,
        description: 'Ultra Cinematic'
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

        console.log(`RenderCore: Auto-detected quality: ${finalPreset} (score: ${score})`);
        this.setQuality(finalPreset);
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
        const scale = preset.resScale;

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
        const scale = preset.resScale;

        if (scale === 1.0) {

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
        

        if (this._frameBudgetFrames >= 60) {
            this._frameBudgetFrames = 0;
            const avg = this._frameTimeHistory.reduce((a, b) => a + b, 0) / this._frameTimeHistory.length;
            const preset = this.getPreset();
            const budget = 1000 / preset.fps;
            
            if (avg > budget * 1.3 && this.currentPreset !== 'LOW') {
                this._downgradePreset();
            } else if (avg < budget * 0.6 && this.currentPreset !== 'ULTRA') {
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