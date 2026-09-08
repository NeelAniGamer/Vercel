import * as THREE from 'three';

export class Environment {
  scene: THREE.Scene;
  sun: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  hemi: THREE.HemisphereLight;
  ground: THREE.Mesh;

  constructor(scene: THREE.Scene, renderDistance = 500) {
    this.scene = scene;

    // Neutral studio gradient fog & background matching the reference render
    const skyColor = 0x2b2e36;
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.Fog(skyColor, renderDistance * 0.75, renderDistance * 1.6);

    // Warm sun keylight
    this.sun = new THREE.DirectionalLight(0xfffaed, 1.25);
    this.sun.position.set(45, 90, 35);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 400;
    this.sun.shadow.camera.left = -120;
    this.sun.shadow.camera.right = 120;
    this.sun.shadow.camera.top = 120;
    this.sun.shadow.camera.bottom = -120;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);

    // Soft ambient fill
    this.ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambient);

    // Hemisphere sky/ground contrast
    this.hemi = new THREE.HemisphereLight(0xdce7f2, 0x2d3748, 0.35);
    this.hemi.position.set(0, 300, 0);
    this.scene.add(this.hemi);

    // Expansive base ground plane
    const groundGeo = new THREE.PlaneGeometry(2400, 2400);
    const groundMat = new THREE.MeshToonMaterial({ color: 0x1e2229 });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.02;
    this.ground.receiveShadow = true;
    this.ground.userData = { isGround: true, noLod: true };
    this.scene.add(this.ground);
  }

  updateSun(playerPos: THREE.Vector3) {
    this.sun.position.set(playerPos.x + 45, 90, playerPos.z + 35);
    this.sun.target.position.set(playerPos.x, 0, playerPos.z);
    this.sun.target.updateMatrixWorld();
  }
}
