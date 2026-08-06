/**
 * CheckpointSystem — Numbered 3D checkpoint rings for path following
 * Creates glowing rings that players must drive through in order
 */

class CheckpointSystem {
  constructor(game) {
    this.game = game;
    this.checkpoints = [];
    this.group = new THREE.Group();
    this.group.name = 'checkpoints';
    this.currentIndex = 0;
    this.completed = 0;
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
   * Create checkpoints along a route
   */
  createFromRoute(route, count = 5) {
    this.init();
    if (!route || route.length < 2) return;

    // Distribute checkpoints evenly along route
    const step = Math.max(1, Math.floor(route.length / count));

    for (let i = 0; i < count; i++) {
      const routeIndex = Math.min(i * step, route.length - 1);
      const point = route[routeIndex];

      this.addCheckpoint({
        x: point.x,
        z: point.z,
        number: i + 1,
        isLast: i === count - 1
      });
    }

    console.log(`[Checkpoints] Created ${this.checkpoints.length} checkpoints`);
  }

  /**
   * Create checkpoints along roads
   */
  createFromRoads(roads, count = 5) {
    this.init();
    if (!roads || roads.length === 0) return;

    // Pick points along the first road
    const road = roads[0];
    const isV = road.type === 'v';
    const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);

    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const x = isV ? road.x : road.x1 + t * (road.x2 - road.x1);
      const z = isV ? road.z1 + t * (road.z2 - road.z1) : road.z;

      this.addCheckpoint({
        x, z,
        number: i + 1,
        isLast: i === count - 1
      });
    }
  }

  /**
   * Add a single checkpoint
   */
  addCheckpoint({ x, z, number, isLast }) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Main ring
    const ringGeo = new THREE.TorusGeometry(6, 0.4, 8, 32);
    const ringColor = isLast ? 0x34d399 : 0xff8800; // Green for last, orange for others
    const ringMat = new THREE.MeshStandardMaterial({
      color: ringColor,
      emissive: ringColor,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3;
    group.add(ring);

    // Inner glow ring
    const innerGeo = new THREE.TorusGeometry(5.5, 0.2, 8, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.3
    });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 3;
    group.add(innerRing);

    // Vertical beam of light
    const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 15, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 7.5;
    group.add(beam);

    // Number sprite
    const numberSprite = this._createNumberSprite(number);
    numberSprite.position.y = 6;
    group.add(numberSprite);

    group.userData = {
      number,
      isLast,
      reached: false,
      ring,
      innerRing,
      beam,
      numberSprite
    };

    this.group.add(group);
    this.checkpoints.push(group);
  }

  /**
   * Create a number sprite for the checkpoint
   */
  _createNumberSprite(number) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Background circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    // Number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), 32, 34);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(4, 4, 1);
    return sprite;
  }

  /**
   * Update checkpoints (animation + collision detection)
   */
  update(playerPos, time) {
    if (!playerPos || this.checkpoints.length === 0) return;

    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const data = cp.userData;

      // Animate ring rotation
      data.ring.rotation.z = time * 0.5;
      data.innerRing.rotation.z = -time * 0.8;

      // Pulse beam
      const pulse = 0.1 + Math.sin(time * 2 + i) * 0.05;
      data.beam.material.opacity = pulse;

      // Skip if already reached
      if (data.reached) continue;

      // Check if player is within range
      const dx = playerPos.x - cp.position.x;
      const dz = playerPos.z - cp.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 8) {
        this._reachCheckpoint(i);
      }
    }
  }

  /**
   * Mark a checkpoint as reached
   */
  _reachCheckpoint(index) {
    const cp = this.checkpoints[index];
    const data = cp.userData;
    data.reached = true;
    this.completed++;

    // Change color to green
    const green = 0x34d399;
    data.ring.material.color.setHex(green);
    data.ring.material.emissive.setHex(green);
    data.innerRing.material.color.setHex(green);
    data.beam.material.color.setHex(green);

    // Expand animation
    const startScale = data.ring.scale.x;
    const expandAnim = () => {
      const s = data.ring.scale.x + 0.05;
      data.ring.scale.set(s, s, s);
      data.ring.material.opacity -= 0.02;
      if (data.ring.material.opacity > 0) {
        requestAnimationFrame(expandAnim);
      }
    };
    expandAnim();

    // Update current index
    this.currentIndex = index + 1;

    // Score
    const value = data.isLast ? 1000 : 250;
    if (this.game.playerScore !== undefined) {
      this.game.playerScore += value;
    }

    // Toast
    if (typeof toast === 'function') {
      toast(data.isLast ? '🏁 Finish!' : `🏁 Checkpoint ${data.number}!`, '#34d399');
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
   * Get next checkpoint position (for GPS navigation)
   */
  getNextPosition() {
    if (this.currentIndex >= this.checkpoints.length) return null;
    return this.checkpoints[this.currentIndex].position;
  }

  /**
   * Get progress (0-1)
   */
  getProgress() {
    return this.checkpoints.length > 0 ? this.completed / this.checkpoints.length : 0;
  }

  /**
   * Check if all checkpoints reached
   */
  isComplete() {
    return this.completed >= this.checkpoints.length;
  }

  /**
   * Reset all checkpoints
   */
  reset() {
    for (const cp of this.checkpoints) {
      cp.userData.reached = false;
      cp.userData.ring.scale.set(1, 1, 1);
      cp.userData.ring.material.opacity = 0.7;
      const color = cp.userData.isLast ? 0x34d399 : 0xff8800;
      cp.userData.ring.material.color.setHex(color);
      cp.userData.ring.material.emissive.setHex(color);
    }
    this.currentIndex = 0;
    this.completed = 0;
  }

  /**
   * Clear all checkpoints
   */
  clear() {
    for (const cp of this.checkpoints) {
      this.group.remove(cp);
      cp.traverse(c => {
        if (c.isMesh || c.isSprite) {
          c.geometry?.dispose();
          c.material?.dispose();
        }
      });
    }
    this.checkpoints = [];
    this.currentIndex = 0;
    this.completed = 0;
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    this._initialized = false;
  }
}

window.CheckpointSystem = CheckpointSystem;
