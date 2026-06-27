if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['road_straight']) {
              // The GLTF model is 1000x1500 units. We scale it to match RW (12).
              const tileScale = RW / 1000;
              const tileSize = 1500 * tileScale; // 18 units long
              const numTiles = Math.max(1, Math.floor(len / tileSize));
              const startX = isV ? cx : Math.min(r.x1, r.x2) + tileSize / 2 + (len - numTiles * tileSize) / 2;
              const startZ = isV ? Math.min(r.z1, r.z2) + tileSize / 2 + (len - numTiles * tileSize) / 2 : cz;

              for (let i = 0; i < numTiles; i++) {
                  const tile = window.PRELOADED_MODELS['road_straight'].clone();
                  tile.scale.set(tileScale, tileScale, tileScale);
                  if (isV) {
                      // Model natively points along Z
                      tile.position.set(cx, 0.02, startZ + i * tileSize);
                  } else {
                      // Rotate 90 degrees around Y so length spans X
                      tile.rotation.y = Math.PI / 2;
                      tile.position.set(startX + i * tileSize, 0.02, cz);
                  }
                  this.scene.add(tile);
              }
          }

             