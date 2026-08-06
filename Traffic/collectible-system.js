/**
 * CollectibleSystem — Coins, Stars, Gems placement and collection
 * Spinning collectibles along roads for exploration rewards
 */

class CollectibleSystem {
  constructor(game) {
    this.game = game;
    this.collectibles = [];
    this.group = new THREE.Group();
    this.group.name = 'collectibles';
    this.totalPlaced = 0;
    this.totalCollected = 0;
    this.score = 0;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    if (this.game.scene) {
      this.game.scene.add(this.group);
      this._initialized = true;
    }
  }

  /**
   * Place collectibles for a level based on its config
   */
  placeForLevel(cfg) {
    this.init();
    if (!cfg.roads || cfg.roads.length === 0) return;

    const theme = cfg.themeType || 'urban_grid';

    // Place coins along all roads
    this.placeCoins(cfg.roads, theme);

    // Place stars at intersections and special spots
    this.placeStars(cfg.roads, theme);

    // Place gems in hidden/off-route locations
    this.placeGems(cfg.roads, theme);

    console.log(`[Collectibles] Placed ${this.totalPlaced} collectibles (${this.collectibles.length} active)`);
  }

  /**
   * Place coins along roads
   */
  placeCoins(roads, theme) {
    const spacing = 25; // meters between coins
    const density = this._getThemeCoinDensity(theme);

    roads.forEach(road => {
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const numCoins = Math.floor(len / spacing);

      for (let i = 0; i < numCoins; i++) {
        if (Math.random() > density) continue;

        const t = (i + 0.5) / numCoins;
        let x, z;

        if (isV) {
          x = road.x;
          z = road.z1 + t * (road.z2 - road.z1);
        } else {
          x = road.x1 + t * (road.x2 - road.x1);
          z = road.z;
        }

        // Place on road edge or center
        const offset = (Math.random() - 0.5) * (road.width || 12) * 0.6;

        this.addCollectible({
          type: 'coin',
          x: isV ? x + offset : x,
          z: isV ? z : z + offset,
          value: 100
        });
      }
    });
  }

  /**
   * Place stars at intersections and special spots
   */
  placeStars(roads, theme) {
    const vRoads = roads.filter(r => r.type === 'v');
    const hRoads = roads.filter(r => r.type === 'h');

    // Place at intersections
    vRoads.forEach(vr => {
      hRoads.forEach(hr => {
        if (vr.x >= hr.x1 && vr.x <= hr.x2 && hr.z >= vr.z1 && hr.z <= vr.z2) {
          // Intersection — place star
          this.addCollectible({
            type: 'star',
            x: vr.x + (Math.random() - 0.5) * 10,
            z: hr.z + (Math.random() - 0.5) * 10,
            value: 500
          });
        }
      });
    });

    // Place along longer roads
    roads.forEach(road => {
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      if (len > 200) {
        const t = 0.25 + Math.random() * 0.5;
        const x = isV ? road.x : road.x1 + t * (road.x2 - road.x1);
        const z = isV ? road.z1 + t * (road.z2 - road.z1) : road.z;

        this.addCollectible({
          type: 'star',
          x, z,
          value: 500
        });
      }
    });
  }

  /**
   * Place gems in hidden/off-route locations
   */
  placeGems(roads, theme) {
    const numGems = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numGems; i++) {
      // Place near a road but offset
      const road = roads[Math.floor(Math.random() * roads.length)];
      const isV = road.type === 'v';
      const t = Math.random();
      const x = isV ? road.x : road.x1 + t * (road.x2 - road.x1);
      const z = isV ? road.z1 + t * (road.z2 - road.z1) : road.z;

      const offset = 20 + Math.random() * 30; // Off-road
      const angle = Math.random() * Math.PI * 2;

      this.addCollectible({
        type: 'gem',
        x: x + Math.cos(angle) * offset,
        z: z + Math.sin(angle) * offset,
        value: 1000
      });
    }
  }

  /**
   * Add a collectible to the world
   */
  addCollectible({ type, x, z, value }) {
    const mesh = this._createMesh(type);
    mesh.position.set(x, 2.5, z);
    mesh.userData = { type, value, collected: false };

    this.group.add(mesh);
    this.collectibles.push(mesh);
    this.totalPlaced++;
  }

  /**
   * Create collectible mesh based on type
   */
  _createMesh(type) {
    let geo, mat;

    switch (type) {
      case 'coin':
        geo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
        mat = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffa500,
          emissiveIntensity: 0.5,
          metalness: 0.8,
          roughness: 0.2
        });
        break;
      case 'star':
        geo = new THREE.OctahedronGeometry(1.5, 0);
        mat = new THREE.MeshStandardMaterial({
          color: 0xffeb3b,
          emissive: 0xffc107,
          emissiveIntensity: 0.6,
          metalness: 0.3,
          roughness: 0.3
        });
        break;
      case 'gem':
        geo = new THREE.OctahedronGeometry(1.2, 0);
        mat = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00bcd4,
          emissiveIntensity: 0.7,
          metalness: 0.5,
          roughness: 0.1
        });
        break;
      default:
        geo = new THREE.SphereGeometry(1, 8, 8);
        mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.frustumCulled = true;
    return mesh;
  }

  /**
   * Update collectibles (animation + collection check)
   */
  update(playerPos, time, dt) {
    if (!playerPos) return;
    dt = dt || 0.016;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      if (c.userData.collected) continue;

      // Animate
      c.rotation.y += dt * 2;
      c.position.y = 2.5 + Math.sin(time * 3 + i) * 0.5;

      // Check collection
      const dx = playerPos.x - c.position.x;
      const dz = playerPos.z - c.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 5) {
        this._collect(c, i);
      }
    }
  }

  /**
   * Collect a pickup
   */
  _collect(mesh, index) {
    mesh.userData.collected = true;
    this.totalCollected++;
    this.score += mesh.userData.value;

    // Remove from scene
    this.group.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();

    // Remove from array
    this.collectibles.splice(index, 1);

    // Effects
    this._spawnCollectEffect(mesh.position, mesh.userData.type);

    // Update game score
    if (this.game.playerScore !== undefined) {
      this.game.playerScore += mesh.userData.value;
    }

    // Toast
    if (typeof toast === 'function') {
      const icons = { coin: '🪙', star: '⭐', gem: '💎' };
      toast(`+${mesh.userData.value} ${icons[mesh.userData.type] || '✨'}`, '#f2b84b');
    }

    // Sound
    if (typeof sfx !== 'undefined' && sfx.play) {
      sfx.play('ok');
    }

    // Update HUD
    if (this.game._uhud) {
      this.game._uhud();
    }
  }

  /**
   * Spawn collection particle effect
   */
  _spawnCollectEffect(pos, type) {
    const colors = { coin: 0xffd700, star: 0xffeb3b, gem: 0x00ffff };
    const color = colors[type] || 0xffffff;

    // Simple particle burst using points
    const particleCount = 12;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 0.3,
        z: (Math.random() - 0.5) * 0.3
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size: 2, transparent: true, opacity: 1 });
    const points = new THREE.Points(geo, mat);
    this.game.scene.add(points);

    // Animate and remove
    let life = 0;
    const animate = () => {
      life += 0.016;
      const posArr = geo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3] += velocities[i].x;
        posArr[i * 3 + 1] += velocities[i].y;
        posArr[i * 3 + 2] += velocities[i].z;
        velocities[i].y -= 0.01; // Gravity
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = 1 - life * 2;

      if (life < 0.5) {
        requestAnimationFrame(animate);
      } else {
        this.game.scene.remove(points);
        geo.dispose();
        mat.dispose();
      }
    };
    animate();
  }

  /**
   * Get coin density based on theme
   */
  _getThemeCoinDensity(theme) {
    const densities = {
      free_roam: 0.8,
      urban_grid: 0.6,
      suburb: 0.5,
      residential: 0.5,
      commercial: 0.7,
      downtown: 0.6,
      festival: 0.8,
      highway_merge: 0.4,
      rural: 0.3,
      default: 0.5
    };
    return densities[theme] || densities.default;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      total: this.totalPlaced,
      collected: this.totalCollected,
      score: this.score
    };
  }

  /**
   * Clear all collectibles
   */
  clear() {
    for (const c of this.collectibles) {
      this.group.remove(c);
      c.geometry.dispose();
      c.material.dispose();
    }
    this.collectibles = [];
    this.totalPlaced = 0;
    this.totalCollected = 0;
    this.score = 0;
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    this._initialized = false;
  }
}

window.CollectibleSystem = CollectibleSystem;
