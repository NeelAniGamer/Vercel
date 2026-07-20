/**
 * RenderCore - Performance Engine Core
 * Handles WebGL renderer initialization and quality preset management.
 * Compatible with Three.js r128.
 */

const QUALITY_PRESETS = {
    LOW: {
        resScale: 0.5,
        shadowRes: 512,
        bloom: false,
        fps: 30,
        description: 'Performance mode'
    },
    MED: {
        resScale: 0.75,
        shadowRes: 1024,
        bloom: true,
        fps: 60,
        description: 'Balanced'
    },
    HIGH: {
        resScale: 1.0,
        shadowRes: 2048,
        bloom: true,
        fps: 60,
        description: 'High Quality'
    },
    ULTRA: {
        resScale: 1.5,
        shadowRes: 4096,
        bloom: true,
        fps: 144,
        description: 'Ultra Cinematic'
    }
};

class RenderCore {
    constructor() {
        this.renderer = null;
        this.currentPreset = 'MED';
        this.renderTarget = null;
        this.blitScene = null;
        this.blitCamera = null;
        this.blitMesh = null;
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
            powerPreference: 'high-performance'
        });

        // Three.js r128 Color Management
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

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
            console.error(`Invalid quality preset: ${presetKey}`);
            return;
        }

        this.currentPreset = presetKey;
        this._applyQualitySettings(QUALITY_PRESETS[presetKey]);
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

            const highEnd = /NVIDIA|RTX|Radeon|AMD/i;
            const lowEnd = /Adreno|Mali|Intel|Apple GPU/i;

            if (highEnd.test(renderer)) {
                score += 1; // Potential HIGH
                if (/RTX|GTX 30|GTX 40/i.test(renderer)) score += 1; // Potential ULTRA
            } else if (lowEnd.test(renderer)) {
                score -= 1; // Potential LOW
            }
        }

        // 2. Memory Analysis
        if (navigator.deviceMemory) {
            console.log(`RenderCore: Device Memory: ${navigator.deviceMemory}GB`);
            if (navigator.deviceMemory < 4) {
                score -= 1;
            } else if (navigator.deviceMemory >= 16) {
                score += 1;
            }
        }

        // 3. Burn-in FPS Test
        const msPerFrame = this._perfTest();
        console.log(`RenderCore: Burn-in test: ${msPerFrame.toFixed(2)}ms/frame`);
        if (msPerFrame > 16.67) {
            score -= 2; // Cannot hit 60FPS even on empty scene, strongly suggest LOW
        }

        // Map score to preset
        let finalPreset = 'MED';
        if (score <= 1) finalPreset = 'LOW';
        else if (score === 2) finalPreset = 'MED';
        else if (score === 3) finalPreset = 'HIGH';
        else if (score >= 4) finalPreset = 'ULTRA';

        // Absolute override for extremely poor performance
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
        for (let i = 0; i < 10; i++) {
            this.renderer.render(scene, camera);
        }
        return (performance.now() - start) / 10;
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

        this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
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

        // Update the material texture to the current render target
        this.blitMesh.material.map = this.renderTarget.texture;
        this.blitMesh.material.needsUpdate = true;
    }

    /**
     * Applies the numeric settings of a preset to the renderer.
     * @private
     */
    _applyQualitySettings(preset) {
        if (!this.renderer) return;

        console.log(`RenderCore: Applying quality settings - ${preset.description}`);

        if (preset.resScale !== 1.0) {
            this._setupRenderBypass();
        } else {
            this.renderTarget = null;
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
            if (!this.renderTarget) {
                this._setupRenderBypass();
            }

            this.renderer.setRenderTarget(this.renderTarget);
            this.renderer.render(scene, camera);

            this.renderer.setRenderTarget(null);
            this.renderer.render(this.blitScene, this.blitCamera);
        }
    }

    getPreset() {
        return QUALITY_PRESETS[this.currentPreset];
    }
}

// Export for use in game_core.js
window.RenderCore = RenderCore;
window.QUALITY_PRESETS = QUALITY_PRESETS;
