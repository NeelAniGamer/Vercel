// ════════════════════════════════════════════════════════════════════════════════
// OPTIMIZED RENDER CORE — CSM Shadows, Dynamic Resolution, Adaptive Quality
// ════════════════════════════════════════════════════════════════════════════════

const QUALITY_PRESETS = {
    LOW: {
        resScale: 0.75,
        shadowRes: 0,
        shadowCascades: 0,
        shadowBias: 0,
        shadowNormalBias: 0,
        csmEnabled: false,
        csmFar: 100,
        bloom: false,
        bloomThreshold: 1.0,
        bloomStrength: 0,
        bloomRadius: 0,
        ssao: false,
        fps: 60,
        textureFilter: THREE.LinearFilter,
        maxAnisotropy: 1,
        lodMultiplier: 0.5,
        maxParticles: 300,
        dprCap: 1.0,
        description: 'Performance (No Shadows)'
    },
    MED: {
        resScale: 1.0,
        shadowRes: 1024,
        shadowCascades: 3,
        shadowBias: -0.0003,
        shadowNormalBias: 0.015,
        csmEnabled: true,
        csmFar: 200,
        csmCascades: 3,
        csmFade: true,
        bloom: false,
        bloomThreshold: 0.9,
        bloomStrength: 0.15,
        bloomRadius: 0.3,
        ssao: false,
        fps: 60,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 4,
        lodMultiplier: 0.75,
        maxParticles: 1000,
        dprCap: 1.5,
        description: 'Balanced (CSM Shadows)'
    },
    HIGH: {
        resScale: 1.0,
        shadowRes: 2048,
        shadowCascades: 4,
        shadowBias: -0.0001,
        shadowNormalBias: 0.01,
        csmEnabled: true,
        csmFar: 300,
        csmCascades: 4,
        csmFade: true,
        bloom: false,
        bloomThreshold: 0.88,
        bloomStrength: 0.2,
        bloomRadius: 0.4,
        ssao: true,
        ssaoRadius: 0.5,
        ssaoBias: 0.025,
        fps: 120,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 8,
        lodMultiplier: 1.0,
        maxParticles: 3000,
        dprCap: 2.0,
        description: 'High Quality (CSM + SSAO)'
    },
    ULTRA: {
        resScale: 1.0,
        shadowRes: 4096,
        shadowCascades: 4,
        shadowBias: -0.00005,
        shadowNormalBias: 0.005,
        csmEnabled: true,
        csmFar: 500,
        csmCascades: 4,
        csmFade: true,
        bloom: true,
        bloomThreshold: 0.85,
        bloomStrength: 0.25,
        bloomRadius: 0.5,
        ssao: true,
        ssaoRadius: 1.0,
        ssaoBias: 0.015,
        fps: 144,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 16,
        lodMultiplier: 1.5,
        maxParticles: 5000,
        dprCap: 3.0,
        description: 'Ultra Quality (Full CSM + SSAO + Bloom)'
    }
};

class OptimizedRenderCore {
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
        this.ssaoPass = null;
        this._frameTimeHistory = [];
        this._frameBudgetFrames = 0;
        this._autoQualityEnabled = true;
        this._lastQualityShift = 0;
        this._dprResScale = null;
        
        // CSM
        this.csm = null;
        this.csmHelper = null;
        
        // Stats
        this.stats = {
            frameTime: 0,
            drawCalls: 0,
            triangles: 0,
            shadowUpdates: 0
        };
    }

    init(canvas) {
        this.canvas = canvas;
        
        const isMobileGL = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
          || (window.innerWidth || 9999) <= 767;
        
        // Use WebGL2 if available
        const contextAttrs = {
            canvas: canvas,
            antialias: !isMobileGL,
            powerPreference: 'high-performance',
            alpha: false,
            depth: true,
            stencil: false,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
        };
        
        this.renderer = new THREE.WebGLRenderer(contextAttrs);
        
        // Try to get WebGL2 context
        if (this.renderer.getContext() instanceof WebGL2RenderingContext) {
            this.renderer.capabilities.isWebGL2 = true;
        }

        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.60;

        // Shadow configuration
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = false; // Manual update for control
        this.renderer.shadowMap.needsUpdate = false;

        // Info for stats
        this.renderer.info.autoReset = true;

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
        
        // Save preference
        localStorage.setItem('traffic_quality', presetKey);
    }

    setAutoQuality(enabled) {
        this._autoQualityEnabled = enabled;
    }

    getQuality() {
        return this.currentPreset || 'MED';
    }

    autoDetectQuality() {
        console.log("RenderCore: Auto-detecting hardware capabilities...");
        const savedQuality = localStorage.getItem('traffic_quality');
        if (savedQuality && QUALITY_PRESETS[savedQuality]) {
            console.log(`RenderCore: Using saved quality preset: ${savedQuality}`);
            this.setQuality(savedQuality);
            this.setAutoQuality(false);
            this._applyDPRCorrection();
            return;
        }
        
        let score = 2;

        // GPU detection
        const gl = this.renderer.getContext();
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log(`RenderCore: Detected GPU: ${renderer}`);

            const highEnd = /NVIDIA|RTX|Radeon|AMD|GeForce GTX 1[6-9]|GeForce RTX|RX [56]?[0-9]{3}/i;
            const lowEnd = /Adreno|Mali|Intel.*HD|Intel.*UHD|Apple GPU|PowerVR|VideoCore/i;

            if (highEnd.test(renderer)) {
                score += 1;
                if (/RTX|GTX 3[0-9]|GTX 4[0-9]|RX 6[0-9]{3}|RX 7[0-9]{3}/i.test(renderer)) score += 1;
            } else if (lowEnd.test(renderer)) {
                score -= 1;
            }
        }

        // CPU
        if (navigator.hardwareConcurrency) {
            console.log(`RenderCore: CPU Cores: ${navigator.hardwareConcurrency}`);
            if (navigator.hardwareConcurrency <= 2) score -= 1;
            else if (navigator.hardwareConcurrency >= 8) score += 1;
            if (navigator.hardwareConcurrency >= 16) score += 1;
        }

        // Memory
        if (navigator.deviceMemory) {
            console.log(`RenderCore: Device Memory: ${navigator.deviceMemory}GB`);
            if (navigator.deviceMemory < 4) score -= 1;
            else if (navigator.deviceMemory >= 16) score += 1;
        }

        // Performance test
        const msPerFrame = this._perfTest();
        console.log(`RenderCore: Burn-in test: ${msPerFrame.toFixed(2)}ms/frame`);
        if (msPerFrame > 16.67) score -= 2;
        else if (msPerFrame > 10) score -= 1;

        let finalPreset = 'HIGH';
        if (score <= -1) finalPreset = 'LOW';
        else if (score <= 1) finalPreset = 'MED';
        else if (score <= 3) finalPreset = 'HIGH';
        else finalPreset = 'ULTRA';

        if (msPerFrame > 33) finalPreset = 'LOW';

        // Mobile corrections
        const vw = window.innerWidth;
        const dpr = window.devicePixelRatio || 1;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || vw <= 767;
        if (isMobile) {
            if (vw <= 389 && dpr >= 2.8) finalPreset = 'HIGH';
            else if (vw <= 479 && finalPreset === 'ULTRA') finalPreset = 'HIGH';
            else if (vw <= 599 && finalPreset === 'ULTRA') finalPreset = 'HIGH';
            else if (finalPreset === 'ULTRA') finalPreset = 'HIGH';
        }
        
        console.log(`RenderCore: Auto-detected: ${finalPreset} (score: ${score}, ${vw}px, dpr:${dpr.toFixed(1)})`);
        this.setQuality(finalPreset);
        this._applyDPRCorrection();
    }

    _applyDPRCorrection() {
        const dpr = window.devicePixelRatio || 1;
        const vw = window.innerWidth;
        const isMobile = vw <= 767 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const effectiveDpr = this.renderer.getPixelRatio ? this.renderer.getPixelRatio() : (isMobile ? 1.0 : dpr);
        const preset = QUALITY_PRESETS[this.currentPreset];
        
        if (!isMobile || effectiveDpr <= 1.0 || dpr <= 1.5) {
            this._dprResScale = null;
            return;
        }
        
        const dprCap = preset.dprCap || 2.0;
        const cappedDpr = Math.min(dpr, dprCap);
        const dprFactor = cappedDpr >= 3 ? 0.55 : cappedDpr >= 2.5 ? 0.65 : cappedDpr >= 2 ? 0.75 : 1;
        const corrected = Math.max(0.5, Math.min(1, preset.resScale * dprFactor));
        
        if (Math.abs(corrected - preset.resScale) > 0.02) {
            console.log(`RenderCore: DPR correction ${preset.resScale} → ${corrected.toFixed(2)} (dpr ${dpr.toFixed(1)}/${dprCap})`);
            this._dprResScale = corrected;
        } else {
            this._dprResScale = null;
        }
    }

    _perfTest() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        const start = performance.now();
        const iterations = 30;
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
            colorSpace: THREE.SRGBColorSpace,
            depthBuffer: true,
            stencilBuffer: false,
            samples: 0
        });

        if (!this.blitScene) {
            this.blitScene = new THREE.Scene();
            this.blitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            const geometry = new THREE.PlaneGeometry(2, 2);
            this.blitMesh = new THREE.Mesh(
                geometry,
                new THREE.MeshBasicMaterial({ 
                    transparent: true,
                    depthWrite: false,
                    depthTest: false
                })
            );
            this.blitScene.add(this.blitMesh);
        }

        this.blitMesh.material.map = this.renderTarget.texture;
        this.blitMesh.material.needsUpdate = true;
    }

    _setupCSM() {
        const preset = this.getPreset();
        if (!preset.csmEnabled) {
            if (this.csm) {
                this.csm = null;
            }
            return;
        }

        try {
            // CSM setup would go here
            // For Three.js r128, we use manual cascade setup
            this._csmConfig = {
                cascades: preset.csmCascades || 3,
                far: preset.csmFar || 200,
                fade: preset.csmFade !== false
            };
            
            // Configure light shadow cameras for cascades
            if (this.game && this.game.sunLight) {
                this._configureCSMLight(this.game.sunLight);
            }
        } catch (e) {
            console.warn('CSM setup failed:', e);
        }
    }

    _configureCSMLight(light) {
        const preset = this.getPreset();
        const cascades = this._csmConfig?.cascades || 3;
        const far = this._csmConfig?.far || 200;
        
        // Basic cascade splits (logarithmic)
        const splits = [];
        const near = 1;
        for (let i = 0; i < cascades; i++) {
            const lambda = (i + 1) / cascades;
            const split = near * Math.pow(far / near, lambda);
            splits.push(split);
        }
        
        light.shadow.camera.near = near;
        light.shadow.camera.far = far;
        light.shadow.mapSize.width = preset.shadowRes;
        light.shadow.mapSize.height = preset.shadowRes;
        light.shadow.bias = preset.shadowBias;
        light.shadow.normalBias = preset.shadowNormalBias;
    }

    _applyQualitySettings(preset) {
        if (!this.renderer) return;

        console.log(`RenderCore: Applying ${preset.description}`);

        // Resolution scaling
        if (preset.resScale !== 1.0) {
            this._setupRenderBypass();
        } else {
            if (this.renderTarget) {
                this.renderTarget.dispose();
                this.renderTarget = null;
            }
        }

        // Shadows / CSM
        if (this.renderer.shadowMap) {
            this.renderer.shadowMap.enabled = (preset.shadowRes > 0);
            this._defaultShadowRes = preset.shadowRes;
            this._defaultShadowBias = preset.shadowBias;
            this._defaultShadowNormalBias = preset.shadowNormalBias;
        }

        this._setupCSM();

        // Texture quality
        this._defaultTextureFilter = preset.textureFilter;
        this._defaultAnisotropy = preset.maxAnisotropy;

        // LOD
        this._lodMultiplier = preset.lodMultiplier;

        // Particles
        this._maxParticles = preset.maxParticles;

        // Post-processing
        if (this.composer && this.bloomPass) {
            this.bloomPass.enabled = preset.bloom;
            if (preset.bloom) {
                this.bloomPass.threshold = preset.bloomThreshold;
                this.bloomPass.strength = preset.bloomStrength;
                this.bloomPass.radius = preset.bloomRadius;
            }
        }
        
        if (this.ssaoPass) {
            this.ssaoPass.enabled = preset.ssao || false;
            if (preset.ssao) {
                this.ssaoPass.kernelRadius = preset.ssaoRadius || 1;
                this.ssaoPass.bias = preset.ssaoBias || 0.025;
            }
        }

        // DPR cap
        if (this.renderer.setPixelRatio) {
            const maxDpr = preset.dprCap || 2.0;
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
        }
    }

    render(scene, camera) {
        if (!this.renderer) return;

        const preset = this.getPreset();
        const scale = this._dprResScale != null ? this._dprResScale : preset.resScale;
        
        // Update stats before render
        this.stats.drawCalls = this.renderer.info.render.calls;
        this.stats.triangles = this.renderer.info.render.triangles;

        // Update CSM light matrices if needed
        if (this._csmConfig && this.game && this.game.sunLight) {
            this._updateCSM(this.game.sunLight, camera);
        }

        if (this.composer && this.bloomPass && this.bloomPass.enabled) {
            this.composer.render();
        } else if (scale === 1.0 && this._dprResScale == null) {
            this.renderer.render(scene, camera);
        } else {
            if (!this.renderTarget) this._setupRenderBypass();

            this.renderer.setRenderTarget(this.renderTarget);
            this.renderer.render(scene, camera);

            const prevToneMapping = this.renderer.toneMapping;
            this.renderer.toneMapping = THREE.NoToneMapping;
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.blitScene, this.blitCamera);
            this.renderer.toneMapping = prevToneMapping;
        }

        if (this._autoQualityEnabled) this._checkFrameBudget();
    }

    _updateCSM(light, camera) {
        // Update cascade splits based on camera
        if (!this._csmConfig) return;
        
        // Simple approach: just update the light's shadow camera
        light.shadow.camera.updateMatrixWorld();
        this.stats.shadowUpdates++;
    }

    setupPostProcessing(width, height, isMobile, scene, camera) {
        if (!THREE.EffectComposer || isMobile || !scene || !camera) {
            this.composer = null;
            return;
        }

        try {
            this.composer = new THREE.EffectComposer(this.renderer, {
                renderTargetOptions: {
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    format: THREE.RGBAFormat,
                    colorSpace: THREE.SRGBColorSpace
                }
            });
            
            this.composer.addPass(new THREE.RenderPass(scene, camera));

            const preset = this.getPreset();
            
            // Bloom
            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(width, height),
                preset.bloomStrength,
                preset.bloomRadius,
                preset.bloomThreshold
            );
            this.bloomPass.enabled = preset.bloom;
            this.composer.addPass(this.bloomPass);

            // SSAO (if available)
            if (preset.ssao && THREE.SAOPass) {
                this.ssaoPass = new THREE.SAOPass(scene, camera, width, height);
                this.ssaoPass.kernelRadius = preset.ssaoRadius || 1;
                this.ssaoPass.bias = preset.ssaoBias || 0.025;
                this.ssaoPass.enabled = true;
                this.composer.addPass(this.ssaoPass);
            }

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

    _checkFrameBudget() {
        const now = performance.now();
        if (!this._lastFrameTime) this._lastFrameTime = now;
        
        const dt = now - this._lastFrameTime;
        this._lastFrameTime = now;
        this.stats.frameTime = dt;
        
        this._frameTimeHistory.push(dt);
        if (this._frameTimeHistory.length > 120) this._frameTimeHistory.shift();

        this._frameBudgetFrames++;

        if (this._frameBudgetFrames >= 120) {
            this._frameBudgetFrames = 0;
            if (this._lastQualityShift && now - this._lastQualityShift < 6000) return;

            const avg = this._frameTimeHistory.reduce((a, b) => a + b, 0) / this._frameTimeHistory.length;
            const preset = this.getPreset();
            const budget = 1000 / preset.fps;
            
            if (avg > budget * 1.25 && this.currentPreset !== 'LOW') {
                this._lastQualityShift = now;
                this._downgradePreset();
            } else if (avg < budget * 0.6 && this.currentPreset !== 'ULTRA') {
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
            console.log(`RenderCore: Auto-downgraded to ${this.currentPreset}`);
        }
    }

    _upgradePreset() {
        const order = ['LOW', 'MED', 'HIGH', 'ULTRA'];
        const idx = order.indexOf(this.currentPreset);
        if (idx < order.length - 1) {
            this.setQuality(order[idx + 1]);
            console.log(`RenderCore: Auto-upgraded to ${this.currentPreset}`);
        }
    }
}

window.RenderCore = OptimizedRenderCore;
window.QUALITY_PRESETS = QUALITY_PRESETS;