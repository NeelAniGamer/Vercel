import * as THREE from 'three';
import { PLANET_RADIUS, getTerrainHeight, slerpVectors, greatCircleDistance } from './math';

export class NavigationGuide {
  public group: THREE.Group = new THREE.Group();
  private curveMesh!: THREE.Mesh;
  private curveMaterial!: THREE.ShaderMaterial;
  private targetBeacon!: THREE.Group;
  private currentTarget: THREE.Vector3 | null = null;
  private curvePointsCount = 36;

  constructor() {
    this.createCurveMesh();
    this.createTargetBeacon();
  }

  /**
   * Signature Messenger 3D Curved Holographic Ribbon
   */
  private createCurveMesh() {
    // Generate initial curve geometry
    const dummyPoints: THREE.Vector3[] = [];
    for (let i = 0; i < this.curvePointsCount; i++) {
      dummyPoints.push(new THREE.Vector3(0, PLANET_RADIUS + 2, 0));
    }

    const curve = new THREE.CatmullRomCurve3(dummyPoints);
    const geometry = new THREE.TubeGeometry(curve, 32, 0.22, 8, false);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor;

      void main() {
        // Animated chevron waves flowing towards target
        float flow = fract(vUv.x * 6.0 - uTime * 2.5);
        float pulse = smoothstep(0.0, 0.45, flow) * smoothstep(1.0, 0.55, flow);

        // Core glow & edges
        float edge = sin(vUv.y * 3.14159);
        vec3 glowCol = mix(uColor, vec3(1.0, 1.0, 1.0), pulse * 0.7);

        gl_FragColor = vec4(glowCol, edge * (0.45 + pulse * 0.45));
      }
    `;

    this.curveMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x38bdf8) } // Cyan holographic glow
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.curveMesh = new THREE.Mesh(geometry, this.curveMaterial);
    this.group.add(this.curveMesh);
  }

  /**
   * Floating 3D Beacon Indicator with Rotating Tiffin Box
   */
  private createTargetBeacon() {
    this.targetBeacon = new THREE.Group();

    // Floating Holographic Diamond Marker
    const diamondGeom = new THREE.OctahedronGeometry(1.2, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const diamond = new THREE.Mesh(diamondGeom, diamondMat);
    diamond.position.y = 4.5;
    this.targetBeacon.add(diamond);

    // Mini 3D Aluminum Tiffin Box
    const tiffinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85 });
    const tiffin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12), tiffinMat);
    tiffin.position.y = 4.5;
    this.targetBeacon.add(tiffin);

    this.group.add(this.targetBeacon);
  }

  public setTarget(targetPos: THREE.Vector3, colorHex = 0x38bdf8) {
    this.currentTarget = targetPos.clone();
    if (this.curveMaterial) {
      this.curveMaterial.uniforms.uColor.value.setHex(colorHex);
    }
    this.targetBeacon.position.copy(targetPos);
  }

  public getDistance(playerPos: THREE.Vector3): number {
    if (!this.currentTarget) return 0;
    return Math.round(greatCircleDistance(playerPos, this.currentTarget));
  }

  /**
   * Update the Great-Circle Bezier Curve between Player and Destination
   */
  public update(playerPos: THREE.Vector3, delta: number, elapsed: number) {
    if (this.curveMaterial) {
      this.curveMaterial.uniforms.uTime.value = elapsed;
    }

    // Animate target beacon hovering & spinning
    if (this.targetBeacon && this.currentTarget) {
      this.targetBeacon.position.copy(this.currentTarget);
      this.targetBeacon.rotation.y += delta * 1.8;
      const hover = Math.sin(elapsed * 3.5) * 0.4;
      this.targetBeacon.children[0].position.y = 4.8 + hover;
      this.targetBeacon.children[1].position.y = 4.8 + hover;
    }

    if (!this.currentTarget) return;

    // Build Slerp points along the sphere curvature with arched elevation
    const startNorm = playerPos.clone().normalize();
    const destNorm = this.currentTarget.clone().normalize();
    const points: THREE.Vector3[] = [];

    const dist = greatCircleDistance(playerPos, this.currentTarget);
    const archPeak = Math.min(14.0, Math.max(3.0, dist * 0.16));

    for (let i = 0; i < this.curvePointsCount; i++) {
      const t = i / (this.curvePointsCount - 1);
      const norm = slerpVectors(startNorm, destNorm, t);
      const groundH = getTerrainHeight(norm);

      // Elevated Parabolic Arch over the planet's curvature
      const arch = Math.sin(t * Math.PI) * archPeak;
      const r = PLANET_RADIUS + groundH + 1.2 + arch;
      points.push(norm.multiplyScalar(r));
    }

    // Update tube geometry
    const curve = new THREE.CatmullRomCurve3(points);
    this.curveMesh.geometry.dispose();
    this.curveMesh.geometry = new THREE.TubeGeometry(curve, 32, 0.22, 8, false);
  }
}
