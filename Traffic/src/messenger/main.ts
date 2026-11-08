import * as THREE from 'three';
import { MumbaiPlanet } from './MumbaiPlanet';
import { MumbaiHeroVehicle, VehicleMode, VehicleControls } from './MumbaiHeroVehicle';
import { NavigationGuide } from './NavigationGuide';
import { DeliverySystem } from './DeliverySystem';
import { TrafficNPCs } from './TrafficNPCs';
import { EmojiWheel } from './EmojiWheel';
import { DayNightCycle } from './DayNight';
import { MiniGlobeRadar } from './MiniGlobe';
import { VisualEffects } from './VisualEffects';
import { soundManager } from './Audio';

export class MumbaiMessengerApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private planet: MumbaiPlanet;
  private hero: MumbaiHeroVehicle;
  private guide: NavigationGuide;
  private delivery: DeliverySystem;
  private trafficNPCs: TrafficNPCs;
  private emojiWheel: EmojiWheel;
  private dayNight: DayNightCycle;
  private miniGlobe: MiniGlobeRadar;
  private visualFx: VisualEffects;

  // Controls state
  private controls: VehicleControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    horn: false
  };

  // Camera Orbit Angles
  private camAzimuth: number = 0;
  private camElevation: number = 0.38;
  private camDistance: number = 16.0;
  private isPointerDown: boolean = false;
  private prevPointerX: number = 0;
  private prevPointerY: number = 0;

  // Cinematic Intro Animation
  private introProgress: number = 0;
  private isIntroActive: boolean = true;

  private lastTime: number = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b19); // Midnight cosmic sky

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 800);
    this.camera.position.set(0, 0, 220); // Start far in space for cinematic intro

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    document.getElementById('canvas-container')!.appendChild(this.renderer.domElement);

    // Initialize Systems
    this.dayNight = new DayNightCycle(this.scene);
    this.planet = new MumbaiPlanet();
    this.scene.add(this.planet.group);

    // Spawn player on open road in front of the Gateway of India plaza
    this.hero = new MumbaiHeroVehicle(4, 4);
    this.scene.add(this.hero.group);

    this.guide = new NavigationGuide();
    this.scene.add(this.guide.group);

    this.trafficNPCs = new TrafficNPCs();
    this.scene.add(this.trafficNPCs.group);

    this.emojiWheel = new EmojiWheel();
    this.scene.add(this.emojiWheel.group);

    this.delivery = new DeliverySystem();
    this.miniGlobe = new MiniGlobeRadar();
    this.visualFx = new VisualEffects();

    this.updateTarget();
    this.setupEventListeners();
    this.updateHUD();

    window.addEventListener('resize', () => this.onWindowResize());
    requestAnimationFrame((t) => this.loop(t));
  }

  private updateTarget() {
    const quest = this.delivery.getActiveQuest();
    const dest = this.planet.landmarks.find((lm) => lm.id === quest.destId);
    if (dest) {
      this.guide.setTarget(dest.position, dest.color);
    }
  }

  private setupEventListeners() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      soundManager.resume();
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.controls.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.controls.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.controls.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.controls.right = true;
          break;
        case 'Space':
          this.controls.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.controls.sprint = true;
          break;
        case 'KeyH':
        case 'KeyB':
          this.controls.horn = true;
          break;
        case 'Digit1':
          this.hero.setMode('bicycle');
          this.updateHUD();
          break;
        case 'Digit2':
          this.hero.setMode('auto');
          this.updateHUD();
          break;
        case 'Digit3':
          this.hero.setMode('foot');
          this.updateHUD();
          break;
        case 'KeyT':
          this.dayNight.toggleTime();
          break;
        case 'KeyE':
          this.tryDeliver();
          break;
        case 'KeyR':
          this.openEmoteWheel();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.controls.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.controls.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.controls.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.controls.right = false;
          break;
        case 'Space':
          this.controls.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.controls.sprint = false;
          break;
        case 'KeyH':
        case 'KeyB':
          this.controls.horn = false;
          break;
      }
    });

    // Mouse & Touch Orbit Camera Controls
    window.addEventListener('pointerdown', (e) => {
      soundManager.resume();
      if ((e.target as HTMLElement).tagName === 'CANVAS') {
        this.isPointerDown = true;
        this.prevPointerX = e.clientX;
        this.prevPointerY = e.clientY;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isPointerDown) {
        const dx = e.clientX - this.prevPointerX;
        const dy = e.clientY - this.prevPointerY;
        this.prevPointerX = e.clientX;
        this.prevPointerY = e.clientY;

        this.camAzimuth -= dx * 0.006;
        this.camElevation = Math.max(0.08, Math.min(1.2, this.camElevation + dy * 0.005));
      }
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    window.addEventListener('wheel', (e) => {
      this.camDistance = Math.max(8.0, Math.min(26.0, this.camDistance + e.deltaY * 0.015));
    });

    // Start background cozy music on first user click
    const startAudioOnce = () => {
      soundManager.startMusic();
      window.removeEventListener('click', startAudioOnce);
    };
    window.addEventListener('click', startAudioOnce);
  }

  public tryDeliver() {
    const quest = this.delivery.getActiveQuest();
    const dest = this.planet.landmarks.find((lm) => lm.id === quest.destId);
    if (!dest) return;

    if (this.delivery.checkDestination(this.hero.position, dest.position)) {
      const result = this.delivery.completeDelivery();
      this.showCelebrationModal(result);
      this.updateTarget();
      this.updateHUD();
    } else {
      const dist = this.guide.getDistance(this.hero.position);
      this.showNotification(`Still ${dist}m to ${dest.name}! Follow the glowing ribbon.`);
    }
  }

  public openEmoteWheel() {
    const modal = document.getElementById('emote-modal');
    if (modal) modal.style.display = 'flex';
  }

  public triggerEmote(symbol: string) {
    this.emojiWheel.triggerEmoji(symbol, this.hero.position, this.hero.normal);
    const modal = document.getElementById('emote-modal');
    if (modal) modal.style.display = 'none';
  }

  private updateHUD() {
    const quest = this.delivery.getActiveQuest();
    const dest = this.planet.landmarks.find((lm) => lm.id === quest.destId);

    const questTitle = document.getElementById('hud-quest-title');
    const questBrief = document.getElementById('hud-quest-brief');
    const questIcon = document.getElementById('hud-quest-icon');
    const coinsEl = document.getElementById('hud-coins');
    const scoreEl = document.getElementById('hud-score');
    const rankEl = document.getElementById('hud-rank');
    const modeBadge = document.getElementById('hud-mode-badge');

    if (questTitle) questTitle.textContent = quest.title;
    if (questBrief) questBrief.textContent = `To: ${dest?.name || ''} — ${quest.item}`;
    if (questIcon) questIcon.textContent = quest.icon;
    if (coinsEl) coinsEl.textContent = `${this.delivery.totalCoins} ₹`;
    if (scoreEl) scoreEl.textContent = `${this.delivery.safeDriverScore} pts`;
    if (rankEl) rankEl.textContent = this.delivery.getRank();
    if (modeBadge) {
      modeBadge.textContent = this.hero.currentMode === 'auto' ? '🛺 Auto-Rickshaw' : this.hero.currentMode === 'bicycle' ? '🚲 Dabbawala Bicycle' : '🏃 Courier on Foot';
    }
  }

  private showCelebrationModal(data: { quest: any; coins: number; stampUnlocked: string }) {
    const modal = document.getElementById('delivery-modal');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('modal-text');
    const reward = document.getElementById('modal-reward');
    const stamp = document.getElementById('modal-stamp');

    if (title) title.textContent = '🎉 Delivery Completed!';
    if (text) text.textContent = `Successfully delivered to ${data.quest.destId.replace('_', ' ').toUpperCase()}!`;
    if (reward) reward.textContent = `+${data.coins} Rupees Earned`;
    if (stamp) stamp.textContent = `Unlocked: ${data.stampUnlocked}`;

    if (modal) modal.style.display = 'flex';
  }

  private showNotification(msg: string) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = msg;
      toast.style.opacity = '1';
      setTimeout(() => {
        toast.style.opacity = '0';
      }, 2500);
    }
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Main Game Engine Loop
   */
  private loop(timestamp: number) {
    requestAnimationFrame((t) => this.loop(t));

    const delta = Math.min(0.1, (timestamp - (this.lastTime || timestamp)) / 1000);
    this.lastTime = timestamp;
    const elapsed = timestamp * 0.001;

    // 1. Cinematic Intro: Camera swoops from outer orbit down behind the vehicle
    if (this.isIntroActive) {
      this.introProgress += delta * 0.55;
      if (this.introProgress >= 1.0) {
        this.isIntroActive = false;
        this.introProgress = 1.0;
      }
    }

    // 2. Compute Camera View Direction for Input Alignment
    const normal = this.hero.normal;
    const camHeading = this.camera.position.clone().sub(this.hero.position).normalize();
    const camForward = camHeading.negate();

    // 3. Update Hero Vehicle
    this.hero.update(delta, this.controls, camForward);

    // 4. Update Navigation Guide (signature Messenger curved ribbon)
    this.guide.update(this.hero.position, delta, elapsed);
    const dist = this.guide.getDistance(this.hero.position);
    const distEl = document.getElementById('hud-dist-meter');
    if (distEl) distEl.textContent = `${dist}m away`;

    // 5. Check Traffic Safety at signals
    const safetyEvent = this.delivery.updateTrafficSafety(this.hero.position, this.hero.speed, this.planet.trafficSignals, delta);
    if (safetyEvent === 'SAFE_STOP') {
      this.showNotification('🟢 Safe Driver Bonus: +50 Points for stopping at Red!');
      this.updateHUD();
    } else if (safetyEvent === 'RED_VIOLATION') {
      this.showNotification('🔴 Traffic Warning: Ran a red light! (-25 pts)');
      this.updateHUD();
    }

    // 6. Update Living City NPCs & World Animations
    this.trafficNPCs.update(delta);
    this.planet.update(delta, elapsed, this.dayNight.isNight());
    this.dayNight.update(delta);
    this.emojiWheel.update(delta);

    // 7. Update Speed Visual FX (Dynamic Anime Speed Lines)
    const maxSpeed = this.hero.currentMode === 'auto' ? 28.0 : 19.0;
    this.visualFx.update(this.hero.speed, maxSpeed, delta);

    // 8. Update 3D Mini-Globe
    const quest = this.delivery.getActiveQuest();
    const dest = this.planet.landmarks.find((lm) => lm.id === quest.destId);
    this.miniGlobe.update(this.hero.position, dest ? dest.position : null, elapsed);

    // 9. Camera Follow Physics on the Sphere
    this.updateCameraFollow(delta);

    // Render Main Scene
    this.renderer.render(this.scene, this.camera);
  }

  private updateCameraFollow(delta: number) {
    const normal = this.hero.normal.clone().normalize();
    const forward = this.hero.forward.clone().normalize();
    const right = new THREE.Vector3().crossVectors(normal, forward).normalize();

    // Calculate third-person target offset relative to player
    const cosAz = Math.cos(this.camAzimuth);
    const sinAz = Math.sin(this.camAzimuth);
    const cosEl = Math.cos(this.camElevation);
    const sinEl = Math.sin(this.camElevation);

    const orbitOffset = forward.clone().multiplyScalar(-cosAz * cosEl * this.camDistance)
      .add(right.clone().multiplyScalar(sinAz * cosEl * this.camDistance))
      .add(normal.clone().multiplyScalar(sinEl * this.camDistance));

    const targetCamPos = this.hero.position.clone().add(orbitOffset);
    const targetLookAt = this.hero.position.clone().add(normal.clone().multiplyScalar(2.0));

    if (this.isIntroActive) {
      // Smooth cinematic descent from space orbit
      const spacePos = normal.clone().multiplyScalar(180.0);
      this.camera.position.lerpVectors(spacePos, targetCamPos, Math.pow(this.introProgress, 2.5));
      this.camera.up.lerp(normal, 0.1);
      this.camera.lookAt(this.hero.position);
    } else {
      // Normal smooth follow
      this.camera.position.lerp(targetCamPos, delta * 8.5);
      this.camera.up.lerp(normal, delta * 8.0);
      this.camera.lookAt(targetLookAt);
    }
  }

  public setHeroMode(mode: VehicleMode) {
    this.hero.setMode(mode);
    this.updateHUD();
  }

  public triggerHeroHorn() {
    this.hero.triggerHorn();
  }

  public toggleAudio(): boolean {
    return soundManager.toggleMute();
  }

  public toggleStampBook() {
    const modal = document.getElementById('stamp-book-modal');
    if (!modal) return;
    const isVisible = modal.style.display === 'flex';
    modal.style.display = isVisible ? 'none' : 'flex';

    if (!isVisible) {
      // Populate stamp collection
      const grid = document.getElementById('stamp-grid');
      if (grid) {
        grid.innerHTML = '';
        Object.values(this.delivery.stamps).forEach((st) => {
          const card = document.createElement('div');
          card.className = `stamp-card ${st.unlocked ? 'unlocked' : 'locked'}`;
          card.innerHTML = `
            <div class="stamp-icon">${st.unlocked ? st.icon : '🔒'}</div>
            <div class="stamp-title">${st.title}</div>
            <div class="stamp-desc">${st.unlocked ? st.desc : 'Deliver more packages to unlock'}</div>
          `;
          grid.appendChild(card);
        });
      }
    }
  }
}

// Global Launcher & Window Binding
let app: MumbaiMessengerApp | null = null;
window.addEventListener('DOMContentLoaded', () => {
  app = new MumbaiMessengerApp();
  (window as any).mumbaiMessenger = app;
});
