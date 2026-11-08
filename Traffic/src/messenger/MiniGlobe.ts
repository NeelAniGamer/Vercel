import * as THREE from 'three';
import { PLANET_RADIUS } from './math';

export class MiniGlobeRadar {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private miniPlanet: THREE.Mesh;
  private playerDot: THREE.Mesh;
  private targetPin: THREE.Mesh;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'mini-globe-container';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '24px';
    this.container.style.left = '24px';
    this.container.style.width = '150px';
    this.container.style.height = '150px';
    this.container.style.borderRadius = '50%';
    this.container.style.border = '3px solid rgba(255, 255, 255, 0.25)';
    this.container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
    this.container.style.overflow = 'hidden';
    this.container.style.zIndex = '40';
    this.container.style.background = 'radial-gradient(circle, #0f172a 0%, #020617 100%)';
    document.body.appendChild(this.container);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(150, 150);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(0, 0, 32);

    // Mini Globe Mesh
    const sphereGeom = new THREE.SphereGeometry(10.0, 24, 24);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.7,
      flatShading: true
    });
    this.miniPlanet = new THREE.Mesh(sphereGeom, sphereMat);
    this.scene.add(this.miniPlanet);

    // Mini ocean shell
    const ocean = new THREE.Mesh(
      new THREE.SphereGeometry(9.8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    this.scene.add(ocean);

    // Player Dot (Blinking Cyan)
    const dotGeom = new THREE.SphereGeometry(0.7, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.playerDot = new THREE.Mesh(dotGeom, dotMat);
    this.scene.add(this.playerDot);

    // Target Pin (Blinking Gold)
    const pinGeom = new THREE.OctahedronGeometry(0.85, 0);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.targetPin = new THREE.Mesh(pinGeom, pinMat);
    this.scene.add(this.targetPin);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(10, 15, 20);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  }

  public update(playerPos: THREE.Vector3, targetPos: THREE.Vector3 | null, elapsed: number) {
    const scale = 10.0 / PLANET_RADIUS;

    // Position player dot on mini globe
    const pNorm = playerPos.clone().normalize();
    this.playerDot.position.copy(pNorm).multiplyScalar(10.4);

    // Pulse player dot
    const pScale = 1.0 + Math.sin(elapsed * 6.0) * 0.25;
    this.playerDot.scale.set(pScale, pScale, pScale);

    // Position target pin
    if (targetPos) {
      const tNorm = targetPos.clone().normalize();
      this.targetPin.position.copy(tNorm).multiplyScalar(10.6);
      this.targetPin.visible = true;
      this.targetPin.rotation.y += 0.05;
    } else {
      this.targetPin.visible = false;
    }

    // Rotate mini globe to keep player in front view
    const rot = new THREE.Quaternion().setFromUnitVectors(pNorm, new THREE.Vector3(0, 0, 1));
    this.miniPlanet.quaternion.slerp(rot, 0.1);
    this.playerDot.quaternion.copy(rot);

    this.renderer.render(this.scene, this.camera);
  }
}
