import * as THREE from 'three';
import { PLANET_RADIUS, SEA_LEVEL, getTerrainHeight, orientToSphere, latLonToVector3 } from './math';

export interface MumbaiLandmark {
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

export interface TrafficSignal {
  group: THREE.Group;
  lightRed: THREE.Mesh;
  lightYellow: THREE.Mesh;
  lightGreen: THREE.Mesh;
  state: 'RED' | 'YELLOW' | 'GREEN';
  timer: number;
  position: THREE.Vector3;
}

export class MumbaiPlanet {
  public group: THREE.Group = new THREE.Group();
  public terrainMesh!: THREE.Mesh;
  public waterMesh!: THREE.Mesh;
  public landmarks: MumbaiLandmark[] = [];
  public trafficSignals: TrafficSignal[] = [];
  public streetlamps: THREE.PointLight[] = [];
  public cloudsGroup: THREE.Group = new THREE.Group();
  public seaLinkBridge!: THREE.Group;

  private waterMaterial!: THREE.ShaderMaterial;

  constructor() {
    this.createTerrain();
    this.createStylizedArabianSea();
    this.createMumbaiLandmarks();
    this.createSeaLinkBridge();
    this.createTrafficSignals();
    this.createFoliageAndProps();
    this.createAtmosphericClouds();
  }

  /**
   * Procedural Spherical Mini Mumbai Terrain with Asphalt Roads & Biomes
   */
  private createTerrain() {
    const geometry = new THREE.IcosahedronGeometry(PLANET_RADIUS, 55);
    const pos = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const colors: number[] = [];

    // Palette: Mumbai Asphalt, Sand, Green Parks, Promenade Terrazzo, Malabar Stone
    const colSand = new THREE.Color(0xf3dfb0);      // Chowpatty golden sand
    const colAsphalt = new THREE.Color(0x334155);   // Asphalt road network
    const colGrass1 = new THREE.Color(0x65a30d);    // Shivaji Park / Hanging Gardens grass
    const colGrass2 = new THREE.Color(0x4d7c0f);    // Deep lush park
    const colStone = new THREE.Color(0x94a3b8);     // Basalt stone / promenade
    const colSnow = new THREE.Color(0xe2e8f0);      // Hilltop monument

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const normal = vertex.clone().normalize();
      const height = getTerrainHeight(normal);
      const finalPos = normal.clone().multiplyScalar(PLANET_RADIUS + height);
      pos.setXYZ(i, finalPos.x, finalPos.y, finalPos.z);

      // Height and Lat/Lon based biome color assignment
      const c = new THREE.Color();
      if (height <= 0.15) {
        c.copy(colSand);
      } else if (height < 1.3) {
        // Coastline & roads
        const t = (height - 0.15) / 1.15;
        c.copy(colAsphalt).lerp(colStone, t * 0.4);
      } else if (height < 3.5) {
        // City parks & avenues
        const t = (height - 1.3) / 2.2;
        c.copy(colGrass1).lerp(colGrass2, t);
      } else {
        // Malabar Hill ridge
        const t = Math.min(1.0, (height - 3.5) / 3.0);
        c.copy(colStone).lerp(colSnow, t);
      }

      colors.push(c.r, c.g, c.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.group.add(this.terrainMesh);
  }

  /**
   * Stylized Animated Arabian Sea Water Sphere with Custom Waves & Foam
   */
  private createStylizedArabianSea() {
    const geometry = new THREE.IcosahedronGeometry(SEA_LEVEL + 0.18, 36);

    const vertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      uniform float uTime;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec3 displaced = position + normal * (sin(position.x * 0.35 + uTime * 2.2) * cos(position.z * 0.35 + uTime * 1.8) * 0.18);
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
        float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.8);

        float wave = sin(vWorldPos.x * 0.75 + uTime * 3.2) * sin(vWorldPos.z * 0.75 + uTime * 2.4);
        float foam = step(0.80, wave + fresnel * 0.55);

        vec3 waterColor = mix(uColorDeep, uColorShallow, fresnel * 0.65);
        waterColor = mix(waterColor, vec3(1.0, 1.0, 1.0), foam * 0.55);

        vec3 halfDir = normalize(uSunDir + viewDir);
        float spec = pow(max(0.0, dot(vNormal, halfDir)), 72.0);
        waterColor += vec3(1.0, 0.96, 0.82) * spec * 0.75;

        gl_FragColor = vec4(waterColor, 0.84);
      }
    `;

    this.waterMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorDeep: { value: new THREE.Color(0x1e5782) },    // Deep Arabian blue
        uColorShallow: { value: new THREE.Color(0x48b0c9) }, // Coastal shallows
        uSunDir: { value: new THREE.Vector3(1, 1, 0.5).normalize() }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    this.waterMesh = new THREE.Mesh(geometry, this.waterMaterial);
    this.group.add(this.waterMesh);
  }

  /**
   * 6 Iconic Mumbai Landmarks
   */
  private createMumbaiLandmarks() {
    const rawLandmarks = [
      {
        id: 'gateway_of_india',
        name: 'Gateway of India & Taj Pier',
        recipient: 'Captain Kadam',
        title: 'Harbour Ferry Master',
        lat: 0,
        lon: 0,
        color: 0xf59e0b,
        icon: '🏛️',
        dialogue: "Namaste, Messenger! The ferry passengers from Alibaug have been waiting for these morning newspapers and post bags. Superb timing!",
        builder: () => this.buildGatewayOfIndia()
      },
      {
        id: 'csmt_station',
        name: 'CSMT & Dabbawala Central Depot',
        recipient: 'President Tukaram',
        title: 'Mumbai Dabbawala Association',
        lat: 18,
        lon: 25,
        color: 0xef4444,
        icon: '🍱',
        dialogue: "Jai Maharashtra, Bhau! The 12:15 local train just arrived. We have 14 hot tiffin dabbas sorted for Nariman Point. Let's roll!",
        builder: () => this.buildCSMTStation()
      },
      {
        id: 'marine_drive',
        name: 'Marine Drive Promenade',
        recipient: 'Ms. Meera Kapadia',
        title: 'Corporate Finance Executive',
        lat: 8,
        lon: -12,
        color: 0x3b82f6,
        icon: '🌊',
        dialogue: "Aha! My homemade ghar-ka-dabba delivered right on the dot before my 1:00 PM boardroom meeting. 6-Sigma perfection!",
        builder: () => this.buildMarineDrivePromenade()
      },
      {
        id: 'chai_stall',
        name: 'Ramu Cutting Chai & Vada Pav Corner',
        recipient: 'Ramu Kaka',
        title: 'Master Chai-Wallah',
        lat: 28,
        lon: 5,
        color: 0x10b981,
        icon: '☕',
        dialogue: "Arre dost! 10 cutting chai glasses and 6 crispy hot vada pavs are packed tight in the basket. Deliver them piping hot to Sea Link!",
        builder: () => this.buildChaiStall()
      },
      {
        id: 'chowpatty_beach',
        name: 'Girgaon Chowpatty Beach',
        recipient: 'Baburao Kulfi-Wallah',
        title: 'Seaside Confectioner',
        lat: 12,
        lon: -28,
        color: 0xec4899,
        icon: '🏖️',
        dialogue: "Kya baat hai! The fresh rose syrup and crushed pistachios are here. Now we can serve the best Malai Kulfi on the beach!",
        builder: () => this.buildChowpattyBeach()
      },
      {
        id: 'sealink_toll',
        name: 'Bandra-Worli Sea Link Toll Plaza',
        recipient: 'Officer Shinde',
        title: 'Traffic & Toll Controller',
        lat: 44,
        lon: 18,
        color: 0x8b5cf6,
        icon: '🌉',
        dialogue: "Salute, Courier Hero! The bridge maintenance crew desperately needed these spare electronic fast-tags. Keep driving safe!",
        builder: () => this.buildSeaLinkTollPlaza()
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

      // Pulsating interactive beacon ring
      const beacon = this.createBeaconRing(lm.color);
      beacon.position.set(0, 0.4, 0);
      obj.add(beacon);

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

  private createBeaconRing(colorHex: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'beacon_ring';

    const ringGeom = new THREE.RingGeometry(2.2, 2.7, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    group.add(ring);

    const beamGeom = new THREE.CylinderGeometry(0.9, 2.0, 6.5, 16, 1, true);
    beamGeom.translate(0, 3.25, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    group.add(beam);

    return group;
  }

  /**
   * 1. Gateway of India Monument & Promenade Pier
   */
  private buildGatewayOfIndia(): THREE.Group {
    const gw = new THREE.Group();

    // Yellow Basalt Stone Material
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 }); // Indo-Saracenic basalt
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });

    // Base Plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.2, 5.5), stoneMat);
    plinth.position.y = 0.6;
    plinth.castShadow = true;
    gw.add(plinth);

    // Left & Right Pillars
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 7.5, 3.8), stoneMat);
    leftPillar.position.set(-2.6, 4.35, 0);
    leftPillar.castShadow = true;
    gw.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 7.5, 3.8), stoneMat);
    rightPillar.position.set(2.6, 4.35, 0);
    rightPillar.castShadow = true;
    gw.add(rightPillar);

    // Central Archway Top
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2.2, 4.0), stoneMat);
    archTop.position.set(0, 8.4, 0);
    archTop.castShadow = true;
    gw.add(archTop);

    // Indo-Saracenic Domes on 4 corners
    for (let dx of [-3.2, 3.2]) {
      for (let dz of [-1.5, 1.5]) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), trimMat);
        dome.position.set(dx, 9.8, dz);
        gw.add(dome);
      }
    }

    // Central Grand Dome
    const grandDome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), trimMat);
    grandDome.position.set(0, 9.5, 0);
    gw.add(grandDome);

    // Harbour Ferry Boat moored at the pier
    const boat = new THREE.Group();
    boat.position.set(0, 0.4, 5.2);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 1.8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    boat.add(hull);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cabin.position.y = 0.8;
    boat.add(cabin);
    gw.add(boat);

    return gw;
  }

  /**
   * 2. CSMT Railway Station & Dabbawala Sorting Hub
   */
  private buildCSMTStation(): THREE.Group {
    const csmt = new THREE.Group();
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 }); // Red Victorian stone
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 });

    // Grand Central Hall
    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(10.0, 5.5, 6.0), brickMat);
    mainHall.position.y = 2.75;
    mainHall.castShadow = true;
    csmt.add(mainHall);

    // Victorian Clock Tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.5, 11.0, 3.5), brickMat);
    tower.position.set(0, 5.5, 1.2);
    tower.castShadow = true;
    csmt.add(tower);

    // Clock Face with Glowing Dial
    const clockDial = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.6 })
    );
    clockDial.position.set(0, 9.2, 3.0);
    csmt.add(clockDial);

    // Gothic Ribbed Dome on Tower
    const dome = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 4.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.4 })
    );
    dome.position.set(0, 12.5, 1.2);
    csmt.add(dome);

    // Dabbawala Sorting Plaza: Stacks of Wooden Crates with Aluminum Tiffins
    const tiffinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

    for (let c = 0; c < 3; c++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 1.2), crateMat);
      crate.position.set(-3.5 + c * 3.5, 0.2, 4.5);
      csmt.add(crate);

      // Stacked cylindrical dabbas inside crate
      for (let d = 0; d < 6; d++) {
        const dabba = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 10), tiffinMat);
        dabba.position.set(-4.2 + c * 3.5 + (d % 3) * 0.45, 0.6, 4.3 + Math.floor(d / 3) * 0.45);
        csmt.add(dabba);
      }
    }

    return csmt;
  }

  /**
   * 3. Marine Drive Promenade ("Queen's Necklace")
   */
  private buildMarineDrivePromenade(): THREE.Group {
    const md = new THREE.Group();

    // Curved Sea Wall with Concrete Tetrapods
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(10.0, 1.2, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 })
    );
    wall.position.set(0, 0.6, 0);
    wall.castShadow = true;
    md.add(wall);

    // Concrete Tetrapods along the crashing sea waves
    const tetraMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    for (let i = 0; i < 7; i++) {
      const tetra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), tetraMat);
      tetra.position.set(-4.5 + i * 1.5, 0.4, 1.4);
      tetra.rotation.set(i * 0.4, i * 0.3, i * 0.2);
      md.add(tetra);
    }

    // Art Deco Waterfront Apartment Buildings
    const colors = [0xfef3c7, 0xfce7f3, 0xe0e7ff];
    for (let b = 0; b < 3; b++) {
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 6.0 + b * 1.5, 3.2),
        new THREE.MeshStandardMaterial({ color: colors[b], roughness: 0.6 })
      );
      bldg.position.set(-3.4 + b * 3.4, (6.0 + b * 1.5) / 2, -2.6);
      bldg.castShadow = true;
      md.add(bldg);
    }

    return md;
  }

  /**
   * 4. Ramu Cutting Chai & Vada Pav Street Food Stall
   */
  private buildChaiStall(): THREE.Group {
    const stall = new THREE.Group();

    // Wooden Counter
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.4, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
    );
    counter.position.y = 0.7;
    counter.castShadow = true;
    stall.add(counter);

    // Striped Canvas Awning (Orange & Yellow)
    const awning = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xf97316, side: THREE.DoubleSide })
    );
    awning.position.set(0, 2.6, 0);
    awning.rotation.y = Math.PI / 4;
    stall.add(awning);

    // Steaming Brass Samovar / Chai Kettle
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.1, 12), brassMat);
    kettle.position.set(-1.1, 1.9, 0.3);
    stall.add(kettle);

    // Tray of Golden Vada Pavs
    const pavMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    for (let p = 0; p < 4; p++) {
      const pav = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), pavMat);
      pav.position.set(0.2 + (p % 2) * 0.45, 1.5, 0.2 + Math.floor(p / 2) * 0.45);
      stall.add(pav);
    }

    return stall;
  }

  /**
   * 5. Girgaon Chowpatty Beach
   */
  private buildChowpattyBeach(): THREE.Group {
    const beach = new THREE.Group();

    // Colorful Beach Umbrellas
    const umbrellaCols = [0xef4444, 0x3b82f6, 0x10b981];
    for (let u = 0; u < 3; u++) {
      const umb = new THREE.Group();
      umb.position.set(-2.5 + u * 2.5, 0, (u % 2) * 1.5);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      pole.position.y = 1.6;
      umb.add(pole);

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.8, 12), new THREE.MeshStandardMaterial({ color: umbrellaCols[u], side: THREE.DoubleSide }));
      canopy.position.y = 2.8;
      canopy.rotation.z = (u - 1) * 0.15;
      umb.add(canopy);

      beach.add(umb);
    }

    // Kulfi & Gola Cart
    const cart = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.2), new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
    cart.position.set(3.2, 0.7, 0);
    beach.add(cart);

    // Palm trees
    for (let p = 0; p < 2; p++) {
      const palm = this.createPalmTree();
      palm.position.set(-4.2 + p * 8.4, 0, -2.5);
      beach.add(palm);
    }

    return beach;
  }

  private createPalmTree(): THREE.Group {
    const palm = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, side: THREE.DoubleSide });

    for (let j = 0; j < 5; j++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.3 - j * 0.03, 0.35 - j * 0.03, 1.1, 7), trunkMat);
      seg.position.set(j * 0.18, 0.55 + j * 0.95, 0);
      seg.rotation.z = -0.14;
      palm.add(seg);
    }

    const topPos = new THREE.Vector3(0.9, 5.2, 0);
    for (let k = 0; k < 6; k++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 3.0), leafMat);
      leaf.position.copy(topPos);
      leaf.rotation.y = (k / 6) * Math.PI * 2;
      leaf.rotation.x = 0.55;
      leaf.translateY(1.3);
      palm.add(leaf);
    }

    return palm;
  }

  /**
   * 6. Sea Link Toll Plaza
   */
  private buildSeaLinkTollPlaza(): THREE.Group {
    const toll = new THREE.Group();

    // Toll Booth Overhead Canopy
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 0.5, 4.0),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6 })
    );
    roof.position.y = 4.2;
    toll.add(roof);

    // 4 Toll Gates
    for (let g = 0; g < 4; g++) {
      const booth = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 2.5, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9 })
      );
      booth.position.set(-3.0 + g * 2.0, 1.25, 0);
      toll.add(booth);

      // Electronic FastTag Green Arrow Sign
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.6),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
      );
      sign.position.set(-3.0 + g * 2.0, 3.8, 2.01);
      toll.add(sign);
    }

    return toll;
  }

  /**
   * Bandra-Worli Sea Link Cable-Stayed Bridge Spanning Across the Bay
   */
  private createSeaLinkBridge() {
    this.seaLinkBridge = new THREE.Group();

    // Start & End Coordinates of the Sea Link across the bay
    const p1 = latLonToVector3(38, 12, PLANET_RADIUS + 1.2);
    const p2 = latLonToVector3(45, 22, PLANET_RADIUS + 1.2);

    // Midpoint Cable Pylon Tower
    const midPoint = p1.clone().lerp(p2, 0.5);
    const normal = midPoint.clone().normalize();
    const towerPos = normal.clone().multiplyScalar(PLANET_RADIUS + 1.5);

    const pylonGroup = new THREE.Group();
    orientToSphere(pylonGroup, towerPos);

    // Iconic Diamond Cable Pylon
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const towerH = 15.0;

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, towerH), pylonMat);
    leftLeg.position.set(-1.8, towerH / 2, 0);
    leftLeg.rotation.z = -0.12;
    pylonGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, towerH), pylonMat);
    rightLeg.position.set(1.8, towerH / 2, 0);
    rightLeg.rotation.z = 0.12;
    pylonGroup.add(rightLeg);

    // Stay Cables (fan of steel cables)
    const cableMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    for (let c = 0; c < 8; c++) {
      const cableGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 12.0, 0),
        new THREE.Vector3(-4.5 + c * 1.2, 1.0, 0)
      ]);
      const cable = new THREE.Line(cableGeom, cableMat);
      pylonGroup.add(cable);
    }

    this.seaLinkBridge.add(pylonGroup);
    this.group.add(this.seaLinkBridge);
  }

  /**
   * Working Traffic Signals (Red / Yellow / Green) at City Junctions
   */
  private createTrafficSignals() {
    const junctions = [
      { lat: 10, lon: 15 },
      { lat: 22, lon: -5 },
      { lat: 32, lon: 10 }
    ];

    junctions.forEach((j) => {
      const pos = latLonToVector3(j.lat, j.lon, 1);
      const normal = pos.clone().normalize();
      const height = getTerrainHeight(normal);
      const surfacePos = normal.clone().multiplyScalar(PLANET_RADIUS + height);

      const sigGroup = new THREE.Group();
      orientToSphere(sigGroup, surfacePos);

      // Post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 4.5),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      post.position.y = 2.25;
      sigGroup.add(post);

      // Signal Head Box
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.8, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      box.position.set(0, 4.0, 0);
      sigGroup.add(box);

      // 3 Lenses: Red, Yellow, Green
      const red = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      red.position.set(0, 4.5, 0.26);
      sigGroup.add(red);

      const yellow = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshBasicMaterial({ color: 0x475569 }));
      yellow.position.set(0, 4.0, 0.26);
      sigGroup.add(yellow);

      const green = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshBasicMaterial({ color: 0x475569 }));
      green.position.set(0, 3.5, 0.26);
      sigGroup.add(green);

      this.group.add(sigGroup);

      this.trafficSignals.push({
        group: sigGroup,
        lightRed: red,
        lightYellow: yellow,
        lightGreen: green,
        state: 'RED',
        timer: Math.random() * 6.0,
        position: surfacePos
      });
    });
  }

  /**
   * Streetlamps (Marine Drive Queen's Necklace) & Trees
   */
  private createFoliageAndProps() {
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

    // Distribute streetlamps along Marine Drive arc
    for (let i = 0; i < 18; i++) {
      const lat = 2 + i * 1.5;
      const lon = -5 - i * 1.8;
      const norm = latLonToVector3(lat, lon, 1).normalize();
      const h = getTerrainHeight(norm);
      if (h > 0.4) {
        const pos = norm.multiplyScalar(PLANET_RADIUS + h);
        const lamp = new THREE.Group();
        orientToSphere(lamp, pos);

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.4), trunkMat);
        post.position.y = 1.7;
        lamp.add(post);

        const lantern = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.85 })
        );
        lantern.position.y = 3.4;
        lamp.add(lantern);

        const light = new THREE.PointLight(0xfef08a, 0.0, 14, 1.8);
        light.position.y = 3.4;
        lamp.add(light);
        this.streetlamps.push(light);

        this.group.add(lamp);
      }
    }

    // City Banyan & Neem Trees in Parks
    for (let t = 0; t < 90; t++) {
      const lat = (Math.random() - 0.5) * 80;
      const lon = Math.random() * 360 - 180;
      const norm = latLonToVector3(lat, lon, 1).normalize();
      const h = getTerrainHeight(norm);

      if (h > 1.2 && h < 5.0) {
        const pos = norm.multiplyScalar(PLANET_RADIUS + h);

        // Don't collide with landmarks
        let near = false;
        for (const lm of this.landmarks) {
          if (pos.distanceTo(lm.position) < 8.0) { near = true; break; }
        }
        if (near) continue;

        const tree = new THREE.Group();
        orientToSphere(tree, pos);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.8), trunkMat);
        trunk.position.y = 0.9;
        tree.add(trunk);

        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 1), treeMat);
        leaves.position.y = 2.4;
        tree.add(leaves);

        this.group.add(tree);
      }
    }
  }

  /**
   * Low-Poly Orbital Clouds
   */
  private createAtmosphericClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
      flatShading: true
    });

    for (let c = 0; c < 16; c++) {
      const cloud = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0 + Math.random() * 1.6, 1), cloudMat);
        puff.position.set((p - puffs / 2) * 2.2, Math.random() * 0.8, Math.random() * 1.2);
        cloud.add(puff);
      }

      const lat = (Math.random() - 0.5) * 80;
      const lon = Math.random() * 360 - 180;
      const pos = latLonToVector3(lat, lon, PLANET_RADIUS + 24.0);
      orientToSphere(cloud, pos);
      this.cloudsGroup.add(cloud);
    }

    this.group.add(this.cloudsGroup);
  }

  /**
   * Update world animations (Arabian Sea waves, clouds, traffic light cycles, streetlamps)
   */
  public update(delta: number, elapsed: number, isNight: boolean) {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.uTime.value = elapsed;
    }

    if (this.cloudsGroup) {
      this.cloudsGroup.rotation.y += delta * 0.025;
    }

    // Streetlamps (Queen's Necklace) glow bright at dusk/night
    const targetIntensity = isNight ? 1.8 : 0.0;
    this.streetlamps.forEach((lamp) => {
      lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, targetIntensity, delta * 3.0);
    });

    // Animate Traffic Light Signals (Red -> Green -> Yellow -> Red)
    this.trafficSignals.forEach((sig) => {
      sig.timer += delta;
      if (sig.state === 'RED' && sig.timer > 8.0) {
        sig.state = 'GREEN';
        sig.timer = 0;
        (sig.lightRed.material as THREE.MeshBasicMaterial).color.setHex(0x475569);
        (sig.lightGreen.material as THREE.MeshBasicMaterial).color.setHex(0x22c55e);
      } else if (sig.state === 'GREEN' && sig.timer > 9.0) {
        sig.state = 'YELLOW';
        sig.timer = 0;
        (sig.lightGreen.material as THREE.MeshBasicMaterial).color.setHex(0x475569);
        (sig.lightYellow.material as THREE.MeshBasicMaterial).color.setHex(0xeab308);
      } else if (sig.state === 'YELLOW' && sig.timer > 3.0) {
        sig.state = 'RED';
        sig.timer = 0;
        (sig.lightYellow.material as THREE.MeshBasicMaterial).color.setHex(0x475569);
        (sig.lightRed.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
      }
    });

    // Beacon rings pulse
    this.landmarks.forEach((lm) => {
      const ring = lm.object.getObjectByName('beacon_ring');
      if (ring) {
        const scale = 1.0 + Math.sin(elapsed * 4.0) * 0.14;
        ring.scale.set(scale, scale, scale);
      }
    });
  }
}
