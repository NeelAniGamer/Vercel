import * as THREE from 'three';
import { PLANET_RADIUS, SEA_LEVEL, getTerrainHeight, orientToSphere, latLonToVector3 } from './math';

export interface Landmark {
  id: string;
  name: string;
  recipient: string;
  title: string;
  lat: number;
  lon: number;
  position: THREE.Vector3;
  color: number;
  icon: string;
  dialogue: string;
  object: THREE.Group;
}

export class MessengerPlanet {
  public group: THREE.Group = new THREE.Group();
  public terrainMesh!: THREE.Mesh;
  public waterMesh!: THREE.Mesh;
  public landmarks: Landmark[] = [];
  public windmillBlades!: THREE.Group;
  public lighthouseBeam!: THREE.Group;
  public cloudsGroup: THREE.Group = new THREE.Group();
  public streetlamps: THREE.PointLight[] = [];
  public chimneysmokes: THREE.Mesh[] = [];

  private waterMaterial!: THREE.ShaderMaterial;

  constructor() {
    this.createTerrain();
    this.createStylizedWater();
    this.createLandmarks();
    this.createEnvironmentFoliage();
    this.createClouds();
  }

  /**
   * Procedural Spherical Planet Terrain with Biome Colors
   */
  private createTerrain() {
    const geometry = new THREE.IcosahedronGeometry(PLANET_RADIUS, 55);
    const pos = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const colors: number[] = [];

    const colOcean = new THREE.Color(0xd6be96); // Sandy shallows / coast
    const colSand = new THREE.Color(0xedd8a8);  // Beach sand
    const colGrass1 = new THREE.Color(0x73b963); // Cozy spring grass
    const colGrass2 = new THREE.Color(0x5ca351); // Lush meadow
    const colRock = new THREE.Color(0x82848c);   // Mountain rock
    const colSnow = new THREE.Color(0xf1f5f9);   // Alpine snow

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const normal = vertex.clone().normalize();
      const height = getTerrainHeight(normal);
      const finalPos = normal.clone().multiplyScalar(PLANET_RADIUS + height);
      pos.setXYZ(i, finalPos.x, finalPos.y, finalPos.z);

      // Color mapping according to elevation
      const c = new THREE.Color();
      if (height <= 0.2) {
        c.copy(colSand);
      } else if (height < 2.0) {
        const t = height / 2.0;
        c.copy(colGrass1).lerp(colGrass2, t);
      } else if (height < 6.0) {
        const t = (height - 2.0) / 4.0;
        c.copy(colGrass2).lerp(colRock, t);
      } else {
        const t = Math.min(1.0, (height - 6.0) / 2.5);
        c.copy(colRock).lerp(colSnow, t);
      }

      colors.push(c.r, c.g, c.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.group.add(this.terrainMesh);
  }

  /**
   * Stylized Animated Ocean Water Sphere with Custom Shader
   */
  private createStylizedWater() {
    const geometry = new THREE.IcosahedronGeometry(SEA_LEVEL + 0.15, 36);

    const vertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      uniform float uTime;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec3 displaced = position + normal * (sin(position.x * 0.3 + uTime * 2.0) * cos(position.z * 0.3 + uTime * 1.5) * 0.16);
        vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      uniform vec3 uColorDeep;
      uniform vec3 uColorShallow;
      uniform vec3 uSunDir;
      uniform float uTime;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.5);

        // Wave shimmer
        float wave = sin(vWorldPos.x * 0.8 + uTime * 3.0) * sin(vWorldPos.z * 0.8 + uTime * 2.0);
        float foam = step(0.82, wave + fresnel * 0.5);

        vec3 waterColor = mix(uColorDeep, uColorShallow, fresnel * 0.7);
        waterColor = mix(waterColor, vec3(1.0, 1.0, 1.0), foam * 0.6);

        // Specular sun highlight
        vec3 halfDir = normalize(uSunDir + viewDir);
        float spec = pow(max(0.0, dot(vNormal, halfDir)), 64.0);
        waterColor += vec3(1.0, 0.95, 0.8) * spec * 0.7;

        gl_FragColor = vec4(waterColor, 0.82);
      }
    `;

    this.waterMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorDeep: { value: new THREE.Color(0x2774ae) },
        uColorShallow: { value: new THREE.Color(0x61c7dd) },
        uSunDir: { value: new THREE.Vector3(1, 1, 0.5).normalize() }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    this.waterMesh = new THREE.Mesh(geometry, this.waterMaterial);
    this.group.add(this.waterMesh);
  }

  /**
   * Build the 6 Iconic Messenger Landmarks
   */
  private createLandmarks() {
    const rawLandmarks = [
      {
        id: 'post_office',
        name: 'Post Central Hub',
        recipient: 'Postmaster Barnaby',
        title: 'Central Postal Depot',
        lat: 0,
        lon: 0,
        color: 0x3b82f6,
        icon: '🏤',
        dialogue: "Good day, Messenger! The island's letters and packages depend on your swift footsteps. Ready for your route?",
        builder: () => this.buildPostOffice()
      },
      {
        id: 'windmill_bakery',
        name: 'Windmill Bakery',
        recipient: 'Baker Klaus',
        title: 'Artisan Breadmaker',
        lat: -30,
        lon: 75,
        color: 0xf59e0b,
        icon: '🥖',
        dialogue: "Ah, wunderbar! The freshly ground flour arrived just in time for the evening cinnamon rolls. Thank you, Courier!",
        builder: () => this.buildWindmill()
      },
      {
        id: 'lighthouse_cape',
        name: 'Lighthouse Cape',
        recipient: 'Captain Finn',
        title: 'Keeper of the Beacons',
        lat: 42,
        lon: 55,
        color: 0xef4444,
        icon: '🏮',
        dialogue: "Ahoy there, young runner! The fog was rolling in, but this package brings a beam of warm sunshine. Stellar work!",
        builder: () => this.buildLighthouse()
      },
      {
        id: 'observatory_peak',
        name: "Stargazer's Peak",
        recipient: 'Astronomer Lyra',
        title: 'Celestial Cartographer',
        lat: 55,
        lon: -80,
        color: 0x8b5cf6,
        icon: '🔭',
        dialogue: "Incredible! The quartz optical prism is intact without a scratch. Tonight we chart the Andromeda rings!",
        builder: () => this.buildObservatory()
      },
      {
        id: 'sunken_cove',
        name: 'Sunken Cove Beach',
        recipient: 'Surfer Sandy',
        title: 'Tide Watcher',
        lat: -22,
        lon: -50,
        color: 0x06b6d4,
        icon: '🏄',
        dialogue: "Totally righteous, Messenger! You zipped across the entire ocean shore like a sea breeze. High five!",
        builder: () => this.buildBeachCove()
      },
      {
        id: 'flower_cottage',
        name: 'Flower Valley Cottage',
        recipient: 'Florist Flora',
        title: 'Botanical Artisan',
        lat: -12,
        lon: -135,
        color: 0xec4899,
        icon: '🌸',
        dialogue: "Oh, what a delight! The rare lavender seeds have arrived safely. My garden will bloom with wonderful colors!",
        builder: () => this.buildFlowerCottage()
      },
      {
        id: 'clocktower_square',
        name: 'Clocktower Plaza',
        recipient: 'Mayor Barnaby',
        title: 'Town Overseer',
        lat: 25,
        lon: -160,
        color: 0x10b981,
        icon: '🕰️',
        dialogue: "Splendid punctuality! A thriving town thrives on prompt couriers. You do our planet proud!",
        builder: () => this.buildClocktower()
      }
    ];

    rawLandmarks.forEach((lm) => {
      const pos = latLonToVector3(lm.lat, lm.lon, 1);
      const normal = pos.clone().normalize();
      const height = getTerrainHeight(normal);
      const surfacePos = normal.clone().multiplyScalar(PLANET_RADIUS + height);

      const obj = lm.builder();
      orientToSphere(obj, surfacePos);
      this.group.add(obj);

      // Add floating interactive delivery beacon ring
      const beaconRing = this.createBeaconRing(lm.color);
      beaconRing.position.set(0, 0.4, 0);
      obj.add(beaconRing);

      this.landmarks.push({
        id: lm.id,
        name: lm.name,
        recipient: lm.recipient,
        title: lm.title,
        lat: lm.lat,
        lon: lm.lon,
        position: surfacePos,
        color: lm.color,
        icon: lm.icon,
        dialogue: lm.dialogue,
        object: obj
      });
    });
  }

  /**
   * Floating Pulsating Delivery Target Beacon Ring
   */
  private createBeaconRing(colorHex: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'beacon_ring';

    const ringGeom = new THREE.RingGeometry(2.0, 2.5, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    group.add(ring);

    // Vertical cylinder light pillar
    const beamGeom = new THREE.CylinderGeometry(0.8, 1.8, 6.0, 16, 1, true);
    beamGeom.translate(0, 3.0, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    group.add(beam);

    return group;
  }

  /**
   * 1. Post Central Office Building
   */
  private buildPostOffice(): THREE.Group {
    const post = new THREE.Group();

    // Main Hall
    const wallsGeom = new THREE.BoxGeometry(6, 4, 8);
    const wallsMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const walls = new THREE.Mesh(wallsGeom, wallsMat);
    walls.position.y = 2.0;
    walls.castShadow = true;
    post.add(walls);

    // Warm terracotta pitched roof
    const roofGeom = new THREE.ConeGeometry(5.8, 3.0, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.6 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 5.2;
    roof.castShadow = true;
    post.add(roof);

    // Porch & Pillars
    const porchGeom = new THREE.BoxGeometry(7, 0.4, 3);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const porch = new THREE.Mesh(porchGeom, woodMat);
    porch.position.set(0, 0.2, 4.8);
    post.add(porch);

    // Postbox (Red mailbox)
    const mailboxGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 12);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const mailbox = new THREE.Mesh(mailboxGeom, redMat);
    mailbox.position.set(2.8, 0.9, 4.2);
    mailbox.castShadow = true;
    post.add(mailbox);

    // Flagpole with waving postal pennant
    const poleGeom = new THREE.CylinderGeometry(0.08, 0.08, 6.5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(-3.2, 3.25, 4.2);
    post.add(pole);

    const flagGeom = new THREE.PlaneGeometry(1.6, 0.9);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(-2.4, 5.8, 4.2);
    post.add(flag);

    // Stacks of Parcels
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    for (let i = 0; i < 4; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), crateMat);
      box.position.set(-1.8 + i * 0.8, 0.7, 4.8);
      box.rotation.y = i * 0.3;
      box.castShadow = true;
      post.add(box);
    }

    return post;
  }

  /**
   * 2. Windmill Bakery
   */
  private buildWindmill(): THREE.Group {
    const wm = new THREE.Group();

    // Octagonal base
    const baseGeom = new THREE.CylinderGeometry(2.5, 3.8, 7.5, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xfaf5ef, roughness: 0.9 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 3.75;
    base.castShadow = true;
    wm.add(base);

    // Conical thatched roof cap
    const roofGeom = new THREE.ConeGeometry(3.0, 3.0, 8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 8.8;
    wm.add(roof);

    // Rotating Sails Axle & 4 Canvas Blades
    this.windmillBlades = new THREE.Group();
    this.windmillBlades.position.set(0, 7.2, 2.6);

    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide, roughness: 0.6 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.z = angle;

      // Wooden beam
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 6.2, 0.15), frameMat);
      spar.position.y = 3.1;
      bladeArm.add(spar);

      // Fabric Sail
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 5.0), bladeMat);
      sail.position.set(0.7, 3.6, 0.05);
      bladeArm.add(sail);

      this.windmillBlades.add(bladeArm);
    }
    wm.add(this.windmillBlades);

    // Golden Wheat Fields surrounding the windmill
    const wheatMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.9 });
    for (let i = 0; i < 28; i++) {
      const wheat = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 5), wheatMat);
      const angle = (i / 28) * Math.PI * 2;
      const dist = 4.5 + (i % 3) * 0.8;
      wheat.position.set(Math.cos(angle) * dist, 0.7, Math.sin(angle) * dist);
      wm.add(wheat);
    }

    return wm;
  }

  /**
   * 3. Lighthouse Cape
   */
  private buildLighthouse(): THREE.Group {
    const lh = new THREE.Group();

    // Rocky foundation
    const rockGeom = new THREE.DodecahedronGeometry(3.5, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.9 });
    const rock = new THREE.Mesh(rockGeom, rockMat);
    rock.position.y = 1.5;
    rock.scale.set(1.4, 0.7, 1.4);
    lh.add(rock);

    // Red & White Striped Lighthouse Tower
    const towerHeight = 12.0;
    const segments = 6;
    const segH = towerHeight / segments;

    for (let i = 0; i < segments; i++) {
      const rTop = 2.4 - (i + 1) * 0.2;
      const rBot = 2.4 - i * 0.2;
      const segGeom = new THREE.CylinderGeometry(rTop, rBot, segH, 16);
      const isRed = i % 2 === 0;
      const segMat = new THREE.MeshStandardMaterial({
        color: isRed ? 0xef4444 : 0xffffff,
        roughness: 0.5
      });
      const seg = new THREE.Mesh(segGeom, segMat);
      seg.position.y = 2.5 + i * segH + segH / 2;
      seg.castShadow = true;
      lh.add(seg);
    }

    // Top Lantern Room & Balcony
    const balcony = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 })
    );
    balcony.position.y = 2.5 + towerHeight + 0.2;
    lh.add(balcony);

    // Glowing Lantern Core
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 2.0, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 })
    );
    glass.position.y = balcony.position.y + 1.2;
    lh.add(glass);

    // Rotating Light Beam
    this.lighthouseBeam = new THREE.Group();
    this.lighthouseBeam.position.copy(glass.position);

    const beamGeom = new THREE.ConeGeometry(5.0, 32.0, 16, 1, true);
    beamGeom.rotateX(Math.PI / 2);
    beamGeom.translate(0, 0, 16.0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(beamGeom, beamMat);
    this.lighthouseBeam.add(beamMesh);
    lh.add(this.lighthouseBeam);

    return lh;
  }

  /**
   * 4. Stargazer's Observatory
   */
  private buildObservatory(): THREE.Group {
    const obs = new THREE.Group();

    // Round Stone Base
    const baseGeom = new THREE.CylinderGeometry(4.2, 4.5, 4.5, 20);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 2.25;
    base.castShadow = true;
    obs.add(base);

    // Copper/Brass Hemisphere Dome
    const domeGeom = new THREE.SphereGeometry(4.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4, metalness: 0.7 });
    const dome = new THREE.Mesh(domeGeom, domeMat);
    dome.position.y = 4.5;
    obs.add(dome);

    // Giant Astronomical Telescope extending from dome slot
    const scope = new THREE.Group();
    scope.position.set(0, 5.8, 0);
    scope.rotation.x = -Math.PI / 3.5;

    const tubeGeom = new THREE.CylinderGeometry(0.55, 0.75, 6.0, 16);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
    const tube = new THREE.Mesh(tubeGeom, tubeMat);
    tube.position.y = 2.8;
    scope.add(tube);
    obs.add(scope);

    // Glowing Star Charts on Easel
    const easel = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.0, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 })
    );
    easel.position.set(3.2, 1.2, 2.8);
    easel.rotation.y = -Math.PI / 5;
    obs.add(easel);

    return obs;
  }

  /**
   * 5. Sunken Cove Beach & Surf Shack
   */
  private buildBeachCove(): THREE.Group {
    const cove = new THREE.Group();

    // Surf Shack hut with palm frond roof
    const hut = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 3.0, 3.5),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
    );
    hut.position.y = 1.5;
    cove.add(hut);

    const thatchedRoof = new THREE.Mesh(
      new THREE.ConeGeometry(3.6, 2.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 })
    );
    thatchedRoof.position.y = 4.0;
    cove.add(thatchedRoof);

    // Striped Surfboards propped up
    const boardGeom = new THREE.CapsuleGeometry(0.4, 2.2, 4, 8);
    const boardMat1 = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
    const board1 = new THREE.Mesh(boardGeom, boardMat1);
    board1.position.set(2.4, 1.2, 1.5);
    board1.rotation.set(0.2, 0.3, 0.2);
    cove.add(board1);

    const boardMat2 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 });
    const board2 = new THREE.Mesh(boardGeom, boardMat2);
    board2.position.set(2.6, 1.2, 0.9);
    board2.rotation.set(0.15, 0.4, 0.25);
    cove.add(board2);

    // Striped Beach Umbrella
    const umbrella = new THREE.Group();
    umbrella.position.set(-2.8, 0, 2.5);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    pole.position.y = 1.75;
    umbrella.add(pole);

    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, side: THREE.DoubleSide })
    );
    canopy.position.y = 3.2;
    canopy.rotation.z = 0.2;
    umbrella.add(canopy);
    cove.add(umbrella);

    // Palm Trees with curved trunks
    for (let i = 0; i < 2; i++) {
      const palm = this.createPalmTree();
      palm.position.set(-4.0 + i * 8.0, 0, -2.0 + i * 4.0);
      cove.add(palm);
    }

    return cove;
  }

  private createPalmTree(): THREE.Group {
    const palm = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, side: THREE.DoubleSide, roughness: 0.5 });

    // Segmented curved trunk
    for (let j = 0; j < 6; j++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.35 - j * 0.03, 0.4 - j * 0.03, 1.0, 7), trunkMat);
      seg.position.set(j * 0.2, 0.5 + j * 0.9, 0);
      seg.rotation.z = -0.15;
      palm.add(seg);
    }

    // Big frond leaves
    const topPos = new THREE.Vector3(1.2, 6.0, 0);
    for (let k = 0; k < 6; k++) {
      const angle = (k / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.2), leafMat);
      leaf.position.copy(topPos);
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.6;
      leaf.translateY(1.4);
      palm.add(leaf);
    }

    return palm;
  }

  /**
   * 6. Flower Valley Cottage
   */
  private buildFlowerCottage(): THREE.Group {
    const cot = new THREE.Group();

    // Stone Cottage Body
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 3.6, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 })
    );
    walls.position.y = 1.8;
    cot.add(walls);

    // Sloped Slate Tile Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(4.4, 2.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
    );
    roof.position.y = 4.6;
    roof.rotation.y = Math.PI / 4;
    cot.add(roof);

    // Stone Chimney with Puffing Smoke
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 3.0, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xb45309 })
    );
    chimney.position.set(1.6, 5.0, 0);
    cot.add(chimney);

    // Flower Beds (Tulips & Roses)
    const colors = [0xf43f5e, 0xa855f7, 0xfacc15, 0xec4899];
    for (let i = 0; i < 20; i++) {
      const col = colors[i % colors.length];
      const flower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.25),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 })
      );
      const angle = (i / 20) * Math.PI * 2;
      const r = 3.6 + (i % 2) * 0.6;
      flower.position.set(Math.cos(angle) * r, 0.3, Math.sin(angle) * r);
      cot.add(flower);
    }

    return cot;
  }

  /**
   * 7. Clocktower Plaza
   */
  private buildClocktower(): THREE.Group {
    const plaza = new THREE.Group();

    // Tall Victorian Clocktower
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.2, 14.0, 3.2), towerMat);
    tower.position.y = 7.0;
    plaza.add(tower);

    // Clock faces on 4 sides
    const clockMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.5 });
    for (let i = 0; i < 4; i++) {
      const face = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), clockMat);
      face.position.y = 11.5;
      face.rotation.y = (i * Math.PI) / 2;
      face.translateZ(1.62);
      plaza.add(face);
    }

    // Copper Spire Peak
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 4.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.7, roughness: 0.3 })
    );
    spire.position.y = 16.0;
    spire.rotation.y = Math.PI / 4;
    plaza.add(spire);

    // Central Cobblestone Fountain
    const fountainRing = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3.0, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    fountainRing.position.set(0, 0.4, 6.0);
    plaza.add(fountainRing);

    const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.7, 16), waterMat);
    water.position.copy(fountainRing.position);
    plaza.add(water);

    return plaza;
  }

  /**
   * Distribute 140+ Trees, Rocks, Lamp posts around the Planet
   */
  private createEnvironmentFoliage() {
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8, flatShading: true });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85, flatShading: true });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true });

    // Golden ratio spherical distribution
    const count = 160;
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const normal = new THREE.Vector3(Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY).normalize();
      const height = getTerrainHeight(normal);

      // Only place trees and lamps on land (not in the ocean!)
      if (height > 0.4 && height < 7.0) {
        const surfacePos = normal.clone().multiplyScalar(PLANET_RADIUS + height);

        // Check if too close to any landmark
        let tooClose = false;
        for (const lm of this.landmarks) {
          if (surfacePos.distanceTo(lm.position) < 10.0) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        const propType = i % 10;
        const propGroup = new THREE.Group();

        if (propType < 5) {
          // Puffy Deciduous Tree
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.8), trunkMat);
          trunk.position.y = 0.9;
          propGroup.add(trunk);

          const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), treeMat);
          leaves.position.y = 2.4;
          leaves.scale.set(1.0, 1.2, 1.0);
          propGroup.add(leaves);
        } else if (propType < 8) {
          // Pine Tree
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.4), trunkMat);
          trunk.position.y = 0.7;
          propGroup.add(trunk);

          for (let tier = 0; tier < 3; tier++) {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6 - tier * 0.4, 1.8, 6), pineMat);
            cone.position.y = 1.6 + tier * 1.1;
            propGroup.add(cone);
          }
        } else if (propType === 8) {
          // Cozy Streetlamp that glows at dusk/night
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2), trunkMat);
          post.position.y = 1.6;
          propGroup.add(post);

          const lantern = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.6, 0.45),
            new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 })
          );
          lantern.position.y = 3.2;
          propGroup.add(lantern);

          const lampLight = new THREE.PointLight(0xfef08a, 0.0, 12, 1.5);
          lampLight.position.y = 3.2;
          propGroup.add(lampLight);
          this.streetlamps.push(lampLight);
        } else {
          // Natural Boulder / Rock
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), rockMat);
          rock.position.y = 0.6;
          rock.scale.set(1.4, 0.8, 1.1);
          propGroup.add(rock);
        }

        orientToSphere(propGroup, surfacePos);
        this.group.add(propGroup);
      }
    }
  }

  /**
   * Fluffy Procedural Low-Poly Clouds Orbiting in Atmosphere
   */
  private createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    const cloudCount = 18;
    for (let c = 0; c < cloudCount; c++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);

      for (let p = 0; p < numPuffs; p++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + Math.random() * 1.8, 1), cloudMat);
        puff.position.set((p - numPuffs / 2) * 2.2, Math.random() * 0.8, Math.random() * 1.4);
        cloud.add(puff);
      }

      // Position around the planet in orbit ring
      const lat = (Math.random() - 0.5) * 80;
      const lon = Math.random() * 360 - 180;
      const cloudAlt = PLANET_RADIUS + 22.0 + Math.random() * 8.0;
      const pos = latLonToVector3(lat, lon, cloudAlt);

      orientToSphere(cloud, pos);
      this.cloudsGroup.add(cloud);
    }

    this.group.add(this.cloudsGroup);
  }

  /**
   * Update dynamic world elements (Water waves, Windmill, Lighthouse, Clouds)
   */
  public update(delta: number, elapsed: number, isNight: boolean) {
    // Water shader time
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.uTime.value = elapsed;
    }

    // Windmill blades rotation
    if (this.windmillBlades) {
      this.windmillBlades.rotation.z += delta * 1.2;
    }

    // Lighthouse beam rotation
    if (this.lighthouseBeam) {
      this.lighthouseBeam.rotation.y += delta * 1.5;
    }

    // Atmosphere clouds slow orbit
    if (this.cloudsGroup) {
      this.cloudsGroup.rotation.y += delta * 0.02;
    }

    // Streetlamps on at night
    const lampTargetIntensity = isNight ? 1.6 : 0.0;
    this.streetlamps.forEach((lamp) => {
      lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, lampTargetIntensity, delta * 3.0);
    });

    // Animate beacon rings pulsing
    this.landmarks.forEach((lm) => {
      const ring = lm.object.getObjectByName('beacon_ring');
      if (ring) {
        const scale = 1.0 + Math.sin(elapsed * 4.0) * 0.12;
        ring.scale.set(scale, scale, scale);
      }
    });
  }
}
