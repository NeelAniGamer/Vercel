/**
 * Minecraft 3D Character Engine & Skin Parser for Mumbai Traffic Hero
 * Supports 64x64 standard Minecraft skins with dual-layer 3D mesh rendering,
 * pixel-perfect NearestFilter textures, custom .png skin file uploads, and animations.
 */

(function (window) {
  'use strict';

  const DEFAULT_MINECRAFT_SKINS = [
    { id: 'steve', name: 'Classic Steve', file: 'skins/steve.png', icon: '⛏️', desc: 'The original Minecraft adventurer' },
    { id: 'alex', name: 'Classic Alex', file: 'skins/alex.png', isSlim: true, icon: '🏹', desc: 'Slim-armed explorer' },
    { id: 'police', name: 'Mumbai Police', file: 'skins/police.png', icon: '👮', desc: 'Traffic enforcement uniform' },
    { id: 'mumbai_driver', name: 'Kaali-Peeli Pilot', file: 'skins/mumbai_driver.png', icon: '🚕', desc: 'Iconic yellow-black taxi jacket' },
    { id: 'cyberpunk', name: 'Cyber Runner', file: 'skins/cyberpunk.png', icon: '⚡', desc: 'Glowing neon cyborg suit' },
    { id: 'hoodie', name: 'Urban Hoodie', file: 'skins/hoodie.png', icon: '🛹', desc: 'Streetwear red hoodie & kicks' },
    { id: 'racer', name: 'Grand Prix Racer', file: 'skins/racer.png', icon: '🏎️', desc: 'High-speed racing suit & helmet' },
    { id: 'hacker', name: 'Secret Agent', file: 'skins/hacker.png', icon: '🕶️', desc: 'Matrix tie & sleek black coat' }
  ];

  /**
   * Assigns Minecraft texture coordinates to a Three.js BoxGeometry
   * @param {THREE.BoxGeometry} geo 
   * @param {Object} uvs { right, left, top, bottom, front, back } each [u1, v1, u2, v2] in pixel coords
   * @param {number} texW Texture width (64)
   * @param {number} texH Texture height (64)
   */
  function applyMinecraftUVs(geo, uvs, texW = 64, texH = 64) {
    const uvAttr = geo.attributes.uv;
    const uvArr = uvAttr.array;

    // Helper to map pixel rect to 0..1 UV coords
    function setFaceUV(faceIdx, [u1, v1, u2, v2]) {
      const minU = u1 / texW;
      const maxU = u2 / texW;
      const minV = 1.0 - (v2 / texH);
      const maxV = 1.0 - (v1 / texH);

      // Three.js BoxGeometry vertex order per face:
      // (minU, maxV), (maxU, maxV), (minU, minV), (maxU, minV)
      const offset = faceIdx * 8;
      uvArr[offset + 0] = minU; uvArr[offset + 1] = maxV;
      uvArr[offset + 2] = maxU; uvArr[offset + 3] = maxV;
      uvArr[offset + 4] = minU; uvArr[offset + 5] = minV;
      uvArr[offset + 6] = maxU; uvArr[offset + 7] = minV;
    }

    // Faces: 0: +X (Right), 1: -X (Left), 2: +Y (Top), 3: -Y (Bottom), 4: +Z (Front), 5: -Z (Back)
    if (uvs.right) setFaceUV(0, uvs.right);
    if (uvs.left) setFaceUV(1, uvs.left);
    if (uvs.top) setFaceUV(2, uvs.top);
    if (uvs.bottom) setFaceUV(3, uvs.bottom);
    if (uvs.front) setFaceUV(4, uvs.front);
    if (uvs.back) setFaceUV(5, uvs.back);

    uvAttr.needsUpdate = true;
  }

  /**
   * Builds an articulated 3D Minecraft Character Mesh
   */
  function buildMinecraftHuman(isPlayer = false, options = {}) {
    const THREE = window.THREE;
    if (!THREE) return new THREE.Group();

    const root = new THREE.Group();
    const app = options || {};
    const skinUrl = app.mcSkinUrl || (app.mcSkin ? `skins/${app.mcSkin}.png` : 'skins/steve.png');
    const isSlim = !!app.mcIsSlim;
    const scale = (app.scale || 1.0) * (isPlayer ? 0.055 : 0.052);

    // Texture loader with pixelated NearestFilter
    const textureLoader = new THREE.TextureLoader();
    const skinTexture = textureLoader.load(skinUrl, () => {
      skinTexture.magFilter = THREE.NearestFilter;
      skinTexture.minFilter = THREE.NearestFilter;
      skinTexture.generateMipmaps = false;
      skinTexture.needsUpdate = true;
    });
    skinTexture.magFilter = THREE.NearestFilter;
    skinTexture.minFilter = THREE.NearestFilter;
    skinTexture.generateMipmaps = false;

    // Base body material (Opaque)
    const baseMat = new THREE.MeshToonMaterial({
      map: skinTexture,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.FrontSide,
      gradientMap: window._toonGrad || null
    });

    // Outer 2nd-layer material (Hat, Jacket, Sleeves, Pants overlay with transparency)
    const layer2Mat = new THREE.MeshToonMaterial({
      map: skinTexture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      gradientMap: window._toonGrad || null
    });

    // ─── 1. HEAD & HAT ─────────────────────────────────────────────
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 24, 0);

    // Base Head (8 x 8 x 8)
    const headGeo = new THREE.BoxGeometry(8, 8, 8);
    applyMinecraftUVs(headGeo, {
      right:  [0, 8, 8, 16],
      front:  [8, 8, 16, 16],
      left:   [16, 8, 24, 16],
      back:   [24, 8, 32, 16],
      top:    [8, 0, 16, 8],
      bottom: [16, 0, 24, 8]
    });
    const headMesh = new THREE.Mesh(headGeo, baseMat);
    headMesh.position.set(0, 4, 0);
    headGroup.add(headMesh);

    // Hat Layer 2 (9 x 9 x 9)
    const hatGeo = new THREE.BoxGeometry(8.9, 8.9, 8.9);
    applyMinecraftUVs(hatGeo, {
      right:  [32, 8, 40, 16],
      front:  [40, 8, 48, 16],
      left:   [48, 8, 56, 16],
      back:   [56, 8, 64, 16],
      top:    [40, 0, 48, 8],
      bottom: [48, 0, 56, 8]
    });
    const hatMesh = new THREE.Mesh(hatGeo, layer2Mat);
    hatMesh.position.set(0, 4, 0);
    headGroup.add(hatMesh);
    root.add(headGroup);

    // ─── 2. TORSO & JACKET ─────────────────────────────────────────
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 18, 0);

    // Base Torso (8 x 12 x 4)
    const torsoGeo = new THREE.BoxGeometry(8, 12, 4);
    applyMinecraftUVs(torsoGeo, {
      right:  [16, 20, 20, 32],
      front:  [20, 20, 28, 32],
      left:   [28, 20, 32, 32],
      back:   [32, 20, 40, 32],
      top:    [20, 16, 28, 20],
      bottom: [28, 16, 36, 20]
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, baseMat);
    torsoGroup.add(torsoMesh);

    // Jacket Layer 2 (8.8 x 12.8 x 4.8)
    const jacketGeo = new THREE.BoxGeometry(8.8, 12.8, 4.8);
    applyMinecraftUVs(jacketGeo, {
      right:  [16, 36, 20, 48],
      front:  [20, 36, 28, 48],
      left:   [28, 36, 32, 48],
      back:   [32, 36, 40, 48],
      top:    [20, 32, 28, 36],
      bottom: [28, 32, 36, 36]
    });
    const jacketMesh = new THREE.Mesh(jacketGeo, layer2Mat);
    torsoGroup.add(jacketMesh);
    root.add(torsoGroup);

    // ─── 3. RIGHT ARM & SLEEVE ─────────────────────────────────────
    const armW = isSlim ? 3 : 4;
    const rArmGroup = new THREE.Group();
    rArmGroup.position.set(-(4 + armW / 2), 22, 0);

    const rArmGeo = new THREE.BoxGeometry(armW, 12, 4);
    applyMinecraftUVs(rArmGeo, {
      right:  [40, 20, 44, 32],
      front:  [44, 20, 44 + armW, 32],
      left:   [44 + armW, 20, 48 + armW, 32],
      back:   [48 + armW, 20, 48 + armW * 2, 32],
      top:    [44, 16, 44 + armW, 20],
      bottom: [44 + armW, 16, 44 + armW * 2, 20]
    });
    const rArmMesh = new THREE.Mesh(rArmGeo, baseMat);
    rArmMesh.position.set(0, -4, 0);
    rArmGroup.add(rArmMesh);

    const rSleeveGeo = new THREE.BoxGeometry(armW + 0.8, 12.8, 4.8);
    applyMinecraftUVs(rSleeveGeo, {
      right:  [40, 36, 44, 48],
      front:  [44, 36, 44 + armW, 48],
      left:   [44 + armW, 36, 48 + armW, 48],
      back:   [48 + armW, 36, 48 + armW * 2, 48],
      top:    [44, 32, 44 + armW, 36],
      bottom: [44 + armW, 32, 44 + armW * 2, 36]
    });
    const rSleeveMesh = new THREE.Mesh(rSleeveGeo, layer2Mat);
    rSleeveMesh.position.set(0, -4, 0);
    rArmGroup.add(rSleeveMesh);
    root.add(rArmGroup);

    // ─── 4. LEFT ARM & SLEEVE ──────────────────────────────────────
    const lArmGroup = new THREE.Group();
    lArmGroup.position.set(4 + armW / 2, 22, 0);

    const lArmGeo = new THREE.BoxGeometry(armW, 12, 4);
    applyMinecraftUVs(lArmGeo, {
      right:  [32, 52, 36, 64],
      front:  [36, 52, 36 + armW, 64],
      left:   [36 + armW, 52, 40 + armW, 64],
      back:   [40 + armW, 52, 40 + armW * 2, 64],
      top:    [36, 48, 36 + armW, 52],
      bottom: [36 + armW, 48, 36 + armW * 2, 52]
    });
    const lArmMesh = new THREE.Mesh(lArmGeo, baseMat);
    lArmMesh.position.set(0, -4, 0);
    lArmGroup.add(lArmMesh);

    const lSleeveGeo = new THREE.BoxGeometry(armW + 0.8, 12.8, 4.8);
    applyMinecraftUVs(lSleeveGeo, {
      right:  [48, 52, 52, 64],
      front:  [52, 52, 52 + armW, 64],
      left:   [52 + armW, 52, 56 + armW, 64],
      back:   [56 + armW, 52, 56 + armW * 2, 64],
      top:    [52, 48, 52 + armW, 52],
      bottom: [52 + armW, 48, 52 + armW * 2, 52]
    });
    const lSleeveMesh = new THREE.Mesh(lSleeveGeo, layer2Mat);
    lSleeveMesh.position.set(0, -4, 0);
    lArmGroup.add(lSleeveMesh);
    root.add(lArmGroup);

    // ─── 5. RIGHT LEG & PANTS ──────────────────────────────────────
    const rLegGroup = new THREE.Group();
    rLegGroup.position.set(-2, 12, 0);

    const rLegGeo = new THREE.BoxGeometry(4, 12, 4);
    applyMinecraftUVs(rLegGeo, {
      right:  [0, 20, 4, 32],
      front:  [4, 20, 8, 32],
      left:   [8, 20, 12, 32],
      back:   [12, 20, 16, 32],
      top:    [4, 16, 8, 20],
      bottom: [8, 16, 12, 20]
    });
    const rLegMesh = new THREE.Mesh(rLegGeo, baseMat);
    rLegMesh.position.set(0, -6, 0);
    rLegGroup.add(rLegMesh);

    const rPantsGeo = new THREE.BoxGeometry(4.7, 12.7, 4.7);
    applyMinecraftUVs(rPantsGeo, {
      right:  [0, 36, 4, 48],
      front:  [4, 36, 8, 48],
      left:   [8, 36, 12, 48],
      back:   [12, 36, 16, 48],
      top:    [4, 32, 8, 36],
      bottom: [8, 32, 12, 36]
    });
    const rPantsMesh = new THREE.Mesh(rPantsGeo, layer2Mat);
    rPantsMesh.position.set(0, -6, 0);
    rLegGroup.add(rPantsMesh);
    root.add(rLegGroup);

    // ─── 6. LEFT LEG & PANTS ───────────────────────────────────────
    const lLegGroup = new THREE.Group();
    lLegGroup.position.set(2, 12, 0);

    const lLegGeo = new THREE.BoxGeometry(4, 12, 4);
    applyMinecraftUVs(lLegGeo, {
      right:  [16, 52, 20, 64],
      front:  [20, 52, 24, 64],
      left:   [24, 52, 28, 64],
      back:   [28, 52, 32, 64],
      top:    [20, 48, 24, 52],
      bottom: [24, 48, 28, 52]
    });
    const lLegMesh = new THREE.Mesh(lLegGeo, baseMat);
    lLegMesh.position.set(0, -6, 0);
    lLegGroup.add(lLegMesh);

    const lPantsGeo = new THREE.BoxGeometry(4.7, 12.7, 4.7);
    applyMinecraftUVs(lPantsGeo, {
      right:  [0, 52, 4, 64],
      front:  [4, 52, 8, 64],
      left:   [8, 52, 12, 64],
      back:   [12, 52, 16, 64],
      top:    [4, 48, 8, 52],
      bottom: [8, 48, 12, 52]
    });
    const lPantsMesh = new THREE.Mesh(lPantsGeo, layer2Mat);
    lPantsMesh.position.set(0, -6, 0);
    lLegGroup.add(lPantsMesh);
    root.add(lLegGroup);

    // ─── 7. CONTACT SHADOW DECAL ───────────────────────────────────
    const shadowGeo = new THREE.PlaneGeometry(16, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.05;
    root.add(shadowMesh);

    // Scale root to world coordinate units
    root.scale.set(scale, scale, scale);

    // Store limb references on userData for runtime kinematics & emotes
    root.userData = {
      isMinecraft: true,
      isPlayer,
      headGroup,
      torsoGroup,
      rArmGroup,
      lArmGroup,
      rLegGroup,
      lLegGroup,
      shadowMesh,
      skinTexture,
      pose: 'idle',
      animTime: 0,
      walkPhase: 0,
      // Kinematic update function
      update(dt, speed = 0, isGrounded = true) {
        this.animTime += dt;
        const t = this.animTime;

        if (this.pose === 'walk' || speed > 0.05) {
          const strideSpeed = Math.max(8, speed * 22);
          this.walkPhase += dt * strideSpeed;
          const swing = Math.sin(this.walkPhase) * 0.7;

          this.rArmGroup.rotation.x = swing;
          this.lArmGroup.rotation.x = -swing;
          this.rLegGroup.rotation.x = -swing;
          this.lLegGroup.rotation.x = swing;

          this.headGroup.position.y = 24 + Math.abs(Math.sin(this.walkPhase * 2)) * 0.8;
          this.torsoGroup.position.y = 18 + Math.abs(Math.sin(this.walkPhase * 2)) * 0.6;
          this.headGroup.rotation.z = Math.sin(this.walkPhase) * 0.04;
        } else if (this.pose === 'wave') {
          this.rArmGroup.rotation.x = 0;
          this.rArmGroup.rotation.z = 2.4 + Math.sin(t * 8) * 0.3;
          this.lArmGroup.rotation.set(0, 0, 0);
          this.rLegGroup.rotation.set(0, 0, 0);
          this.lLegGroup.rotation.set(0, 0, 0);
          this.headGroup.rotation.y = 0.2;
          this.headGroup.rotation.z = -0.1;
        } else if (this.pose === 'thumbs_up') {
          this.rArmGroup.rotation.x = -1.4;
          this.rArmGroup.rotation.z = -0.3;
          this.lArmGroup.rotation.set(0, 0, 0);
          this.rLegGroup.rotation.set(0, 0, 0);
          this.lLegGroup.rotation.set(0, 0, 0);
          this.headGroup.rotation.set(0.1, -0.2, 0);
        } else if (this.pose === 'victory') {
          this.rArmGroup.rotation.x = 0;
          this.rArmGroup.rotation.z = 2.6 + Math.sin(t * 4) * 0.15;
          this.lArmGroup.rotation.x = 0;
          this.lArmGroup.rotation.z = -2.6 - Math.sin(t * 4) * 0.15;
          this.rLegGroup.rotation.x = -0.2;
          this.lLegGroup.rotation.x = 0.2;
          this.headGroup.position.y = 24 + Math.abs(Math.sin(t * 6)) * 1.5;
        } else {
          // Hero Idle breathing
          const breathe = Math.sin(t * 2.5) * 0.04;
          this.headGroup.position.y = 24 + Math.sin(t * 2.5) * 0.3;
          this.torsoGroup.position.y = 18 + Math.sin(t * 2.5) * 0.2;
          this.rArmGroup.rotation.x = Math.sin(t * 2.5) * 0.06;
          this.rArmGroup.rotation.z = -0.08 - breathe;
          this.lArmGroup.rotation.x = -Math.sin(t * 2.5) * 0.06;
          this.lArmGroup.rotation.z = 0.08 + breathe;
          this.rLegGroup.rotation.set(0, 0, 0);
          this.lLegGroup.rotation.set(0, 0, 0);
          this.headGroup.rotation.y = Math.sin(t * 0.8) * 0.05;
        }
      }
    };

    return root;
  }

  // ─── CUSTOM SKIN STORAGE & UPLOAD UTILS ─────────────────────────────
  const MinecraftSkinManager = {
    DEFAULT_SKINS: DEFAULT_MINECRAFT_SKINS,

    getCustomSkins() {
      try {
        const raw = localStorage.getItem('traffic_custom_skins');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    saveCustomSkin(name, dataUrl) {
      const skins = this.getCustomSkins();
      const id = 'custom_' + Date.now();
      const newSkin = { id, name: name || 'Custom Skin', dataUrl, isCustom: true, icon: '🎨' };
      skins.unshift(newSkin);
      // Keep up to 12 custom skins in local storage
      if (skins.length > 12) skins.length = 12;
      localStorage.setItem('traffic_custom_skins', JSON.stringify(skins));
      return newSkin;
    },

    deleteCustomSkin(id) {
      let skins = this.getCustomSkins();
      skins = skins.filter(s => s.id !== id);
      localStorage.setItem('traffic_custom_skins', JSON.stringify(skins));
      return skins;
    },

    /**
     * Reads a file, ensures it's a valid 64x64 or 64x32 PNG, and returns Base64 data URL
     */
    async processSkinFile(file) {
      return new Promise((resolve, reject) => {
        if (!file || !file.type.includes('png')) {
          return reject(new Error('Please upload a valid PNG skin file.'));
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            if ((img.width !== 64 && img.width !== 128) || (img.height !== 64 && img.height !== 32 && img.height !== 128)) {
              console.warn(`Non-standard skin dimensions: ${img.width}x${img.height}. Attempting canvas resize to 64x64.`);
            }
            // Normalize to 64x64 canvas
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            if (img.height === 32) {
              // Legacy 64x32 to modern 64x64 conversion
              ctx.drawImage(img, 0, 0);
              // Copy right leg to left leg
              ctx.drawImage(canvas, 0, 16, 16, 16, 16, 48, 16, 16);
              // Copy right arm to left arm
              ctx.drawImage(canvas, 40, 16, 16, 16, 32, 48, 16, 16);
            } else {
              ctx.drawImage(img, 0, 0, 64, 64);
            }
            resolve({
              dataUrl: canvas.toDataURL('image/png'),
              name: file.name.replace(/\.[^/.]+$/, "") || 'Custom Skin'
            });
          };
          img.onerror = () => reject(new Error('Failed to load image file.'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });
    }
  };

  // Expose to window
  window._buildMinecraftHuman = buildMinecraftHuman;
  window.MinecraftSkinManager = MinecraftSkinManager;

})(typeof window !== 'undefined' ? window : this);
