import * as THREE from 'three';

export class LODSystem {
  private static childrenCache: THREE.Object3D[] = [];
  private static lastCacheTime = 0;

  static update(scene: THREE.Scene, playerPos: THREE.Vector3, renderDistance = 500) {
    const now = performance.now();
    if (now - this.lastCacheTime > 2000 || this.childrenCache.length === 0) {
      this.childrenCache = [];
      scene.children.forEach(c => {
        if (c.userData?.isGround || c.userData?.noLod || c.userData?.isPlayer) return;
        if ((c as any).isMesh || (c as any).isGroup) {
          this.childrenCache.push(c);
        }
      });
      this.lastCacheTime = now;
    }

    const px = playerPos.x;
    const pz = playerPos.z;
    const nearSq = 35 * 35;
    const midSq = 85 * 85;
    const farSq = Math.min(renderDistance, 200) * Math.min(renderDistance, 200);

    const len = this.childrenCache.length;
    for (let i = 0; i < len; i++) {
      const obj = this.childrenCache[i];
      if (!obj || !obj.position) continue;

      const dx = obj.position.x - px;
      const dz = obj.position.z - pz;
      const dSq = dx * dx + dz * dz;

      // Complete distance culling beyond far threshold
      if (dSq > farSq) {
        if (obj.visible) obj.visible = false;
        continue;
      }
      if (!obj.visible) obj.visible = true;

      // Tier 1: Near Distance (< 35m) -> Full Quality, Real-Time Shadows & Micro-Props
      if (dSq < nearSq) {
        if (obj.castShadow !== undefined) obj.castShadow = true;
        if (obj.traverse) {
          obj.traverse(node => {
            if ((node as THREE.Mesh).isMesh) {
              if (node.userData?.isSmallProp) node.visible = true;
              node.castShadow = true;
            }
          });
        }
      }
      // Tier 2: Mid Distance (35m - 85m) -> Medium Quality, Shadows Disabled on Props
      else if (dSq < midSq) {
        if (obj.castShadow !== undefined && !obj.userData?.isHero) obj.castShadow = false;
        if (obj.traverse) {
          obj.traverse(node => {
            if ((node as THREE.Mesh).isMesh) {
              if (node.userData?.isSmallProp) node.visible = false;
              if (!node.userData?.isMainHull) node.castShadow = false;
            }
          });
        }
      }
      // Tier 3: Far Distance (85m - 200m) -> Low-Poly Silhouette & Material Mist Fade
      else {
        if (obj.castShadow !== undefined) obj.castShadow = false;
        if (obj.traverse) {
          obj.traverse(node => {
            if ((node as THREE.Mesh).isMesh) {
              if (node.userData?.isSmallProp || node.userData?.isParkedCar) node.visible = false;
              node.castShadow = false;
            }
          });
        }
      }
    }
  }
}
