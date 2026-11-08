import * as THREE from 'three';

export type TimeOfDay = 'DAY' | 'SUNSET' | 'NIGHT';

export class DayNightCycle {
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;
  public sunSphere: THREE.Mesh;
  public currentTime: TimeOfDay = 'DAY';

  private sunAngle: number = Math.PI / 4;
  private isAutoCycle: boolean = false;

  constructor(scene: THREE.Scene) {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(this.ambientLight);

    // Hemisphere Light (Sky & Ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x15803d, 0.45);
    scene.add(this.hemiLight);

    // Sun Directional Light with Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 300;
    const d = 100;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    scene.add(this.sunLight);

    // Visual Sun Orb
    const sunGeom = new THREE.SphereGeometry(6.0, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.sunSphere = new THREE.Mesh(sunGeom, sunMat);
    scene.add(this.sunSphere);

    this.setTime('DAY');
  }

  public toggleTime(): TimeOfDay {
    if (this.currentTime === 'DAY') this.setTime('SUNSET');
    else if (this.currentTime === 'SUNSET') this.setTime('NIGHT');
    else this.setTime('DAY');
    return this.currentTime;
  }

  public setTime(mode: TimeOfDay) {
    this.currentTime = mode;

    if (mode === 'DAY') {
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 1.8;
      this.ambientLight.intensity = 0.65;
      this.hemiLight.intensity = 0.45;
      this.sunAngle = Math.PI / 3;
    } else if (mode === 'SUNSET') {
      this.sunLight.color.setHex(0xf97316); // Golden orange
      this.sunLight.intensity = 1.4;
      this.ambientLight.intensity = 0.45;
      this.hemiLight.intensity = 0.35;
      this.sunAngle = 0.15; // Low angle sun
    } else {
      // NIGHT
      this.sunLight.color.setHex(0x38bdf8); // Moonlight
      this.sunLight.intensity = 0.35;
      this.ambientLight.intensity = 0.22;
      this.hemiLight.intensity = 0.15;
      this.sunAngle = -Math.PI / 2.5;
    }

    this.updateSunPosition();
  }

  private updateSunPosition() {
    const r = 160.0;
    const x = Math.cos(this.sunAngle) * r;
    const y = Math.sin(this.sunAngle) * r;
    const z = Math.sin(this.sunAngle * 0.5) * 60.0;

    this.sunLight.position.set(x, y, z);
    this.sunSphere.position.copy(this.sunLight.position);
  }

  public update(delta: number) {
    if (this.isAutoCycle) {
      this.sunAngle += delta * 0.05;
      this.updateSunPosition();
    }
  }

  public isNight(): boolean {
    return this.currentTime === 'NIGHT';
  }
}
