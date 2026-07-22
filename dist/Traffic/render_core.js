/**
 * RenderCore - Performance Engine Core
 * Handles WebGL renderer initialization, quality preset management, DRS, and frame budget monitoring.
 * Compatible with Three.js r128+.
 */

const QUALITY_PRESETS = {
    LOW: {
        resScale: 0.5,
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
        resScale: 0.75,
        shadowRes: 1024,
        shadowCascades: 2,
        shadowBias: -0.0003,
        shadowNormalBias: 0.015,
        bloom: true,
        bloomThreshold: 0.85,
        bloomStrength: 0.4,
        bloomRadius: 0.6,
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
        bloomThreshold: 0.75,
        bloomStrength: 0.7,
        bloomRadius: 0.8,
        fps: 60,
        textureFilter: THREE.LinearMipmapLinearFilter,
        maxAnisotropy: 8,
        lodMultiplier: 1.0,
        maxParticles: 5000,
        description: 'High Quality'
    },
    ULTRA: {
        resScale: 1.5,
        shadowRes: 4096,
        shadowCascades: 4,
        shadowBias: -0.00005,
        shadowNormalBias: 0.005,
        bloom: true,
        bloomThreshold: 0.65,
        bloomStrength: 1.0,
        bloomRadius: 1.0,
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

    /**
     * Initializes the WebGL renderer with the provided canvas.
     * @param {HTMLCanvasElement} canvas
     */
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

        // Three.js r128+ Color Management
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Shadow defaults
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        this.renderer.shadowMap.needsUpdate = true;

        // Auto-detect quality based on hardware
        this.autoDetectQuality();

        return this.renderer;
    }

    /**
     * Updates the quality preset and applies corresponding settings.
     * @param {string} presetKey - Key from QUALITY_PRESETS (LOW, MED, HIGH, ULTRA)
     */
    setQuality(presetKey) {
        if (!QUALITY_PRESETS[presetKey]) {
            console.error(`RenderCore: Invalid quality preset: ${presetKey}`);
            return;
        }

        this.currentPreset = presetKey;
        this._applyQualitySettings(QUALITY_PRESETS[presetKey]);
        console.log(`RenderCore: Quality set to ${presetKey}`);
    }

    /**
     * Enables/disables automatic quality adjustment based on frame budget.
     * @param {boolean} enabled
     */
    setAutoQuality(enabled) {
        this._autoQualityEnabled = enabled;
    }

    /**
     * Automatically detects hardware capabilities and selects the best quality preset.
     * @private
     */
    autoDetectQuality() {
        console.log("RenderCore: Auto-detecting hardware capabilities...");
        let score = 2; // Start at MED

        // 1. GPU Analysis
        const gl = this.renderer.getContext();
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log(`RenderCore: Detected GPU: ${renderer}`);

            const highEnd = /NVIDIA|RTX|Radeon|AMD|GeForce GTX 1[6-9]|GeForce RTX|RX [56]?[0-9]{3}/i;
            const lowEnd = /Adreno|Mali|Intel.*HD|Intel.*UHD|Apple GPU|PowerVR|VideoCore/i;

            if (highEnd.test(renderer)) {
                score += 1; // Potential HIGH
                if (/RTX|GTX 30|GTX 40|RX 6[0-9]{3}|RX 7[0-9]{3}/i.test(renderer)) score += 1; // Potential ULTRA
            } else if (lowEnd.test(renderer)) {
                score -= 1; // Potential LOW
            }
        }

        // 2. Hardware Concurrency (CPU cores)
        if (navigator.hardwareConcurrency) {
            console.log(`RenderCore: CPU Cores: ${navigator.hardwareConcurrency}`);
            if (navigator.hardwareConcurrency <= 2) score -= 1;
            else if (navigator.hardwareConcurrency >= 8) score += 1;
        }

        // 3. Memory (deprecated but still useful)
        if (navigator.deviceMemory) {
            console.log(`RenderCore: Device Memory: ${navigator.deviceMemory}GB`);
            if (navigator.deviceMemory < 4) score -= 1;
            else if (navigator.deviceMemory >= 16) score += 1;
        }

        // 4. Burn-in FPS Test
        const msPerFrame = this._perfTest();
        console.log(`RenderCore: Burn-in test: ${msPerFrame.toFixed(2)}ms/frame`);
        if (msPerFrame > 16.67) score -= 2;
        else if (msPerFrame > 10) score -= 1;

        // Map score to preset
        let finalPreset = 'MED';
        if (score <= 0) finalPreset = 'LOW';
        else if (score === 1) finalPreset = 'LOW';
        else if (score === 2) finalPreset = 'MED';
        else if (score === 3) finalPreset = 'HIGH';
        else if (score >= 4) finalPreset = 'ULTRA';

        // Absolute override for very poor performance
        if (msPerFrame > 33) finalPreset = 'LOW';

        console.log(`RenderCore: Auto-detected quality: ${finalPreset} (score: ${score})`);
        this.setQuality(finalPreset);
    }

    /**
     * Performs a brief burn-in test to measure baseline rendering speed.
     * @private
     * @returns {number} Average milliseconds per frame.
     */
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

    /**
     * Sets up the render target and blit scene for Dynamic Resolution Scaling.
     * @private
     */
    _setupRenderBypass() {
        if (!this.renderer || !this.canvas) return;

        const preset = this.getPreset();
        const scale = preset.resScale;

        const width = Math.floor(this.canvas.width * scale);
        const height = Math.floor(this.canvas.height * scale);

        // Dispose old target
        if (this.renderTarget) this.renderTarget.dispose();

        this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.sRGBEncoding,
            depthBuffer: true,
            stencilBuffer: false
        });

        // Setup Blit Scene for upscaling/downscaling
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

    /**
     * Applies the numeric settings of a preset to the renderer and effects.
     * @private
     */
    _applyQualitySettings(preset) {
        if (!this.renderer) return;

        console.log(`RenderCore: Applying quality settings - ${preset.description}`);

        // Dynamic Resolution Scaling
        if (preset.resScale !== 1.0) {
            this._setupRenderBypass();
        } else {
            if (this.renderTarget) {
                this.renderTarget.dispose();
                this.renderTarget = null;
            }
        }

        // Shadow quality
        if (this.renderer.shadowMap) {
            // Note: shadowMap.size is per-light, but we set a default for new lights
            this._defaultShadowRes = preset.shadowRes;
            this._defaultShadowBias = preset.shadowBias;
            this._defaultShadowNormalBias = preset.shadowNormalBias;
        }

        // Texture quality
        this._defaultTextureFilter = preset.textureFilter;
        this._defaultAnisotropy = preset.maxAnisotropy;

        // LOD multiplier for LODChunk system
        this._lodMultiplier = preset.lodMultiplier;

        // Particle budget
        this._maxParticles = preset.maxParticles;

        // Bloom
        if (this.composer && this.bloomPass) {
            this.bloomPass.enabled = preset.bloom;
            if (preset.bloom) {
                this.bloomPass.threshold = preset.bloomThreshold;
                this.bloomPass.strength = preset.bloomStrength;
                this.bloomPass.radius = preset.bloomRadius;
            }
        }
    }

    /**
     * Renders the scene using either direct canvas rendering or DRS.
     * @param {THREE.Scene} scene
     * @param {THREE.Camera} camera
     */
    render(scene, camera) {
        if (!this.renderer) return;

        const preset = this.getPreset();
        const scale = preset.resScale;

        if (scale === 1.0) {
            // High Quality: Render directly to canvas
            this.renderer.render(scene, camera);
        } else {
            // DRS: Render to target, then blit to canvas
            if (!this.renderTarget) this._setupRenderBypass();

            this.renderer.setRenderTarget(this.renderTarget);
            this.renderer.render(scene, camera);

            this.renderer.setRenderTarget(null);
            this.renderer.render(this.blitScene, this.blitCamera);
        }

        // Frame budget monitoring
        if (this._autoQualityEnabled) this._checkFrameBudget();
    }

    /**
     * Monitors frame time and auto-adjusts quality if budget exceeded.
     * @private
     */
    _checkFrameBudget() {
        const now = performance.now();
        if (!this._lastFrameTime) this._lastFrameTime = now;
        
        const dt = now - this._lastFrameTime;
        this._lastFrameTime = now;
        
        this._frameTimeHistory.push(dt);
        if (this._frameTimeHistory.length > 120) this._frameTimeHistory.shift();

        this._frameBudgetFrames++;
        
        // Check every 60 frames (1 second at 60fps)
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

    /**
     * Creates/updates the EffectComposer with bloom for post-processing.
     * Call after scene setup.
     */
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

    /**
     * Updates post-processing resolution on resize.
     */
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

// Export
window.RenderCore = RenderCore;
window.QUALITY_PRESETS = QUALITY_PRESETS;