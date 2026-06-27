_buildScene(mode) {
        if (typeof initGTex === 'function') initGTex();
        while (this.scene && this.scene.children.length) this.scene.remove(this.scene.children[0]);
        this.world = []; this.npcs = []; this.sigs = []; this.cps = []; this.spc = []; this.obstacles = []; this.roadSegments = []; this.driveRoute = []; this.peds = []; this.speedBreakers = [];

        const lvId = ui.cur ? ui.cur.id : 1;
        const cfg = this._getMapConfig(lvId);
        this.mapCfg = cfg;
        this.timeLimit = cfg.timeLimit || 120;
        this.isPedestrian = (this.vehMode === 'pedestrian') || (!this.vehMode && !!cfg.isPedestrian);

        const sk = cfg.sky;
        this.scene.background = new THREE.Color(sk);
        const fogDist = cfg.fog || 150;
        if (cfg.mode === 'rain' || cfg.hasRain) {
            this.scene.fog = new THREE.Fog(sk, fogDist * 0.1, fogDist * 0.6);
        } else {
            this.scene.fog = new THREE.Fog(sk, fogDist * 0.3, fogDist);
        }
        // Enhanced true color lighting with better contrast and shadows
        this.scene.add(new THREE.AmbientLight(0xffffff, cfg.isNight ? 0.05 : 0.25));
        
        const sun = new THREE.DirectionalLight(0xffeedd, cfg.isNight ? 0.3 : 2.5);
        sun.position.set(30, 60, 20); 
        sun.castShadow = true;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -60;
        sun.shadow.camera.right = 60;
        sun.shadow.camera.top = 60;
        sun.shadow.camera.bottom = -60;
        sun.shadow.bias = -0.0005;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);
        
        if (cfg.isNight) {
          const moon = new THREE.DirectionalLight(0x88aacc, 0.5); 
          moon.position.set(-20, 40, -30); 
          moon.castShadow = true;
          this.scene.add(moon);
        }

        const RW = cfg.isPedestrian ? 10 : 12;
        this.roadSegments = cfg.roads;
        this.driveRoute = cfg.route;
        const mats = {
          grass: new THREE.MeshPhongMaterial({ color: cfg.ground || 0x33691e }),
          road: new THREE.MeshPhongMaterial({ color: 0x21232b, map: _genTex('asphalt') }),
          pave: new THREE.MeshPhongMaterial({ color: 0x757575, map: _genTex('pave') }),
          yellowLine: new THREE.MeshBasicMaterial({ color: 0xffcc00 }),
          water: new THREE.MeshPhongMaterial({ color: 0x1a5a8a, transparent: true, opacity: 0.7 })
        };

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(cfg.is50km ? 100000 : 2000, cfg.is50km ? 100000 : 2000), cfg.isBridge ? mats.water : (cfg.is50km ? new THREE.MeshLambertMaterial({ color: 0x444444 }) : mats.grass));
        ground.rotation.x = -Math.PI / 2; this.scene.add(ground);

        // Build roads using GLB tiles
        cfg.roads.forEach(r => {
          const isV = r.type === 'v';
          const len = isV ? Math.abs(r.z2 - r.z1) : Math.abs(r.x2 - r.x1);
          const cx = isV ? r.x : (r.x1 + r.x2) / 2;
          const cz = isV ? (r.z1 + r.z2) / 2 : r.z;

          // Logical road bed (invisible, used for raycasting/interactions)
          const roadHb = new THREE.Mesh(new THREE.PlaneGeometry(RW, len), new THREE.MeshBasicMaterial({ visible: false }));
          roadHb.rotation.set(-Math.PI / 2, 0, isV ? 0 : -Math.PI / 2);
          roadHb.position.set(cx, .01, cz);
          this.scene.add(roadHb);
          this.world.push(roadHb);

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

             // Sidewalks
             [-1, 1].forEach(s => {
               const swW = cfg.isPedestrian ? 5 : 2.5; const pb = new THREE.Mesh(isV ? new THREE.BoxGeometry(swW, .15, len) : new THREE.BoxGeometry(len, .15, swW), mats.pave);
               pb.position.set(isV ? cx + s * (RW / 2 + swW / 2) : cx, .07, isV ? cz : cz + s * (RW / 2 + swW / 2)); this.scene.add(pb); this.world.push(pb);
              });
        });

        // Advanced Procedural Cityscape
        const bMats = [
          new THREE.MeshLambertMaterial({ color: 0xcccccc, map: gTex.building }),
          new THREE.MeshLambertMaterial({ color: 0xe0e0e0, map: gTex.building }),
          new THREE.MeshLambertMaterial({ color: 0xbdbdbd, map: gTex.building }),
          new THREE.MeshLambertMaterial({ color: 0xd6d6d6, map: gTex.building })
        ];
        const winMat = new THREE.MeshBasicMaterial({ color: 0x1a252c });
        const instancedBldgData = {};

        const drawBldg = (bx, bz, type, rot) => {
          let bldgKeys = [];
          if (window.PRELOADED_MODELS) {
              bldgKeys = Object.keys(window.PRELOADED_MODELS).filter(k => k.startsWith('suburban_') || k.startsWith('industrial_'));
          }

          if (bldgKeys.length > 0 && type !== 'school') {
             const key = bldgKeys[Math.floor(Math.random() * bldgKeys.length)];
             if (!instancedBldgData[key]) instancedBldgData[key] = [];
             instancedBldgData[key].push({ x: bx, z: bz, r: rot, s: 13.5 });
          } else {
             const g = new THREE.Group();
             const mat = bMats[Math.floor(Math.random() * bMats.length)];
             const bh = 16 + Math.random() * 16;
             const bw = 10 + Math.random() * 10;
             const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 14), mat);
             bMesh.position.y = bh / 2;
             g.add(bMesh);
             g.position.set(bx, 0, bz); g.rotation.y = rot;
             this.scene.add(g); this.obstacles.push(g);
          }
        };

        cfg.roads.forEach(r => {
          const isV = r.type === 'v';
          const len = isV ? Math.abs(r.z2 - r.z1) : Math.abs(r.x2 - r.x1);
          const cx = isV ? r.x : (r.x1 + r.x2) / 2;
          const cz = isV ? (r.z1 + r.z2) / 2 : r.z;

          const start = isV ? Math.min(r.z1, r.z2) + 15 : Math.min(r.x1, r.x2) + 15;
          const end = isV ? Math.max(r.z1, r.z2) - 15 : Math.max(r.x1, r.x2) - 15;

          for (let pos = start; pos < end; pos += 35) {
            let nearInt = false;
            (cfg.ints || []).forEach(([ix, iz]) => {
              if (isV && Math.abs(pos - iz) < 20) nearInt = true;
              if (!isV && Math.abs(pos - ix) < 20) nearInt = true;
            });
            if (nearInt) continue;

            [-1, 1].forEach(side => {
              // Create multiple depths of buildings to make the city look dense
              [1, 2, 3, 4].forEach(depth => {
                if (depth > 1 && Math.random() > 0.4) return; // Background buildings spawn randomly

                const bDist = RW / 2 + 20 + (depth - 1) * 35; 
                // Add some slight randomness to positions
                const bx = isV ? cx + side * bDist : pos + (Math.random() * 2 - 1);
                const bz = isV ? pos + (Math.random() * 2 - 1) : cz + side * bDist;
                
                let rot = isV ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) : (side > 0 ? Math.PI : 0);

                const rnd = Math.random();
                let type = 'normal';
                if (rnd > 0.98) type = 'police';
                else if (rnd > 0.96) type = 'hospital';
                else if (rnd > 0.94) type = 'bank';
                else if (rnd > 0.92) type = 'temple';
                else if (rnd > 0.70) type = 'shop';
                else if (rnd > 0.55) type = 'chawl';
                else if (rnd > 0.45) type = 'skyscraper';

                drawBldg(bx, bz, type, rot);
              });

              // Props along sidewalk edge
              if (Math.random() > 0.5) {
                const lDist = RW / 2 + 1;
                const lx = isV ? cx + side * lDist : pos;
                const lz = isV ? pos : cz + side * lDist;
                const prnd = Math.random();

                if (prnd > 0.85) {
                  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: 0x4a3728 }));
                  bench.position.set(lx, 0.3, lz);
                  if (!isV) bench.rotation.y = Math.PI / 2;
                  this.scene.add(bench); this.obstacles.push(bench);
                } else if (prnd > 0.7) {
                  const treeG = new THREE.Group();
                  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3), new THREE.MeshLambertMaterial({ color: 0x5c4033 }));
                  trunk.position.y = 1.5; treeG.add(trunk);
                  const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 7, 7), new THREE.MeshLambertMaterial({ color: 0x2ecc71 }));
                  leaves.position.y = 3.5; treeG.add(leaves);
                  treeG.position.set(lx, 0, lz); this.scene.add(treeG); this.obstacles.push(treeG);
                } else if (prnd > 0.65) {
                  const bStop = new THREE.Group();
                  const r1 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 2), new THREE.MeshLambertMaterial({ color: 0x2980b9 }));
                  r1.position.y = 2.5; bStop.add(r1);
                  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
                  p1.position.set(-1.2, 1.25, -0.8); bStop.add(p1);
                  const p2 = p1.clone(); p2.position.set(1.2, 1.25, -0.8); bStop.add(p2);
                  bStop.position.set(lx, 0, lz); if (!isV) bStop.rotation.y = Math.PI / 2;
                  this.scene.add(bStop); this.obstacles.push(bStop);
                } else if (prnd > 0.5) {
                  const stall = new THREE.Group();
                  const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
                  table.position.y = 0.4; stall.add(table);
                  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0x3498db : 0xe74c3c }));
                  umb.position.y = 2.2; stall.add(umb);
                  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                  stick.position.y = 1.1; stall.add(stick);
                  stall.position.set(lx, 0, lz);
                  this.scene.add(stall); this.obstacles.push(stall);
                } else {
                  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
                  pole.position.set(lx, 3, lz); this.scene.add(pole);
                  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                  lamp.position.set(lx + (isV ? -side * 0.3 : 0), 6, lz + (!isV ? -side * 0.3 : 0));
                  this.scene.add(lamp);
                }
              }
            });
          }
        });

        // Build Instanced Meshes for buildings
        if (window.PRELOADED_MODELS) {
            Object.keys(instancedBldgData).forEach(key => {
                const instances = instancedBldgData[key];
                if (instances.length === 0) return;
                
                const baseModel = window.PRELOADED_MODELS[key];
                baseModel.position.set(0,0,0);
                baseModel.rotation.set(0,0,0);
                baseModel.scale.set(1,1,1);
                baseModel.updateMatrixWorld(true);
                
                const meshes = [];
                baseModel.traverse(c => {
                    if (c.isMesh) meshes.push(c);
                });
                
                meshes.forEach(mesh => {
                    const instancedMesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, instances.length);
                    instancedMesh.castShadow = true;
                    instancedMesh.receiveShadow = true;
                    instancedMesh.frustumCulled = false;
                    
                    const dummy = new THREE.Object3D();
                    
                    instances.forEach((inst, i) => {
                        dummy.position.set(inst.x, 0, inst.z);
                        dummy.rotation.y = inst.r;
                        dummy.scale.set(inst.s, inst.s, inst.s);
                        dummy.updateMatrix();
                        
                        const finalMatrix = new THREE.Matrix4().multiplyMatrices(dummy.matrix, mesh.matrixWorld);
                        instancedMesh.setMatrixAt(i, finalMatrix);
                    });
                    instancedMesh.instanceMatrix.needsUpdate = true;
                    
                    this.scene.add(instancedMesh);
                });
                
                instances.forEach(inst => {
                   const obs = new THREE.Object3D();
                   obs.position.set(inst.x, 0, inst.z);
                   this.obstacles.push(obs);
                });
            });
        }

        // Player vehicle

        // Dynamic pedestrians handled in _upeds
        this._pmesh(mode, this.vehMode || cfg.veh);
        // Build garage at start and end
        if (cfg.hasGarage && cfg.route && cfg.route.length >= 2) {
          const gs = cfg.route[0];
          const ge = cfg.route[cfg.route.length - 1];
          const buildGarage = (gx, gz, label) => {
            const gg = new THREE.Group();
            // Garage body
            const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 12), new THREE.MeshLambertMaterial({ color: 0x555555 }));
            walls.position.y = 2.5; gg.add(walls);
            // Roof
            const roof = new THREE.Mesh(new THREE.BoxGeometry(11, 0.3, 13), new THREE.MeshLambertMaterial({ color: 0x333333 }));
            roof.position.y = 5; gg.add(roof);
            // Open front (remove front face with a dark plane)
            const front = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
            front.position.set(0, 2.5, 6.01); gg.add(front);
            // Floor
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), new THREE.MeshLambertMaterial({ color: 0x444444 }));
            floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; gg.add(floor);
            // Sign
            const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ color: 0xffd54a }));
            sign.position.set(0, 5.3, 6); gg.add(sign);
            gg.position.set(gx + 15, 0, gz);
            this.scene.add(gg);
          };
          buildGarage(gs.x, gs.z, 'START');
          if (ge.x !== gs.x || ge.z !== gs.z) buildGarage(ge.x, ge.z, 'FINISH');
        }
        // Checkpoints
        cfg.route.forEach(pt => this._cp(pt.x, pt.z));

        // Intersections with signals and zebra crossings
        (cfg.ints || []).forEach(([ix, iz]) => {
          this._sig(ix + 4.2, iz);

          if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['road_cross']) {
             const intTile = window.PRELOADED_MODELS['road_cross'].clone();
             const tileScale = RW / 10;
             intTile.scale.set(tileScale, tileScale, tileScale);
             intTile.position.set(ix, 0.03, iz);
             intTile.traverse(c => { if(c.isMesh) { c.receiveShadow = true; }});
             this.scene.add(intTile);
          }

          // Add a Stop sign at some intersections
          if (Math.random() < 0.5) this._addTrafficSign(ix + 6, iz + 6, 'STOP', -Math.PI / 4);

          if (this.isPedestrian) {
            const drawZb = (px, pz, rot) => {
              for (let w = -5; w <= 5; w += 1.4) {
                const zb = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                zb.rotation.x = -Math.PI / 2; zb.position.set(ix + w, .04, iz + RW / 2 + 1); this.scene.add(zb);
              }
              [-1, 1].forEach(ys => { const yb = new THREE.Mesh(new THREE.PlaneGeometry(12, .3), new THREE.MeshBasicMaterial({ color: 0xffcc00 })); yb.rotation.x = -Math.PI / 2; yb.position.set(ix, .041, iz + RW / 2 + 1 + ys * 2.2); this.scene.add(yb); })
            };
            drawZb(ix, iz + 6.5, 0); drawZb(ix, iz - 6.5, 0);
            drawZb(ix + 6.5, iz, Math.PI / 2); drawZb(ix - 6.5, iz, Math.PI / 2);
          } else {
            for (let w = -4; w <= 4; w += 1.6) {
              const zb = new THREE.Mesh(new THREE.PlaneGeometry(1, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
              zb.rotation.x = -Math.PI / 2; zb.position.set(ix + w, .04, iz + RW / 2 + 1); this.scene.add(zb);
            }
          }
        });

        // Add Signs and Speed Breakers along Roads
        cfg.roads.forEach(r => {
            if (r.type === 'h') {
                for (let x = r.x1 + 30; x < r.x2 - 30; x += 100) {
                    if (Math.random() < 0.3) {
                        const type = cfg.isSilenceZone && Math.random() < 0.5 ? 'NO_HONK' : (cfg.speedLimit ? 'SPEED_40' : 'STOP');
                        this._addTrafficSign(x, r.z + RW / 2 + 1, type, 0);
                    }
                    if (Math.random() < 0.1) {
                        this._addSpeedBreaker(x + 20, r.z, 0);
                    }
                }
            } else {
                for (let z = r.z1 + 30; z < r.z2 - 30; z += 100) {
                    if (Math.random() < 0.3) {
                        const type = cfg.isSilenceZone && Math.random() < 0.5 ? 'NO_HONK' : (cfg.speedLimit ? 'SPEED_40' : 'STOP');
                        this._addTrafficSign(r.x + RW / 2 + 1, z, type, -Math.PI / 2);
                    }
                    if (Math.random() < 0.1) {
                        this._addSpeedBreaker(r.x, z + 20, Math.PI / 2);
                    }
                }
            }
        });

        // NPC Traffic - diverse vehicle types
        const npcTypes = cfg.npcTypes || (cfg.isPedestrian ? ['car', 'car', 'auto', 'bike', 'taxi', 'bus', 'car', 'auto', 'bike', 'car', 'taxi', 'bus'] : ['car', 'car', 'auto', 'bike']);
        
        // Spawn Animals
        this.animals = [];
        if (window.PRELOADED_MODELS) {
            const animalKeys = ['animal_dog', 'animal_cow', 'animal_cat'].filter(k => window.PRELOADED_MODELS[k]);
            if (animalKeys.length > 0) {
                const numAnimals = Math.floor(Math.random() * 4) + 2; // 2 to 5 animals per level
                for (let i = 0; i < numAnimals; i++) {
                    const type = animalKeys[Math.floor(Math.random() * animalKeys.length)];
                    const anim = window.PRELOADED_MODELS[type].clone();
                    anim.scale.set(4, 4, 4); // Kenney animals are small
                    anim.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
                    
                    const seg = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
                    const isV = seg.type === 'v';
                    const minP = isV ? Math.min(seg.z1, seg.z2) : Math.min(seg.x1, seg.x2);
                    const maxP = isV ? Math.max(seg.z1, seg.z2) : Math.max(seg.x1, seg.x2);
                    const p = minP + Math.random() * (maxP - minP);
                    const offset = (Math.random() - 0.5) * 6; // random side of the road
                    
                    anim.position.set(isV ? seg.x + offset : p, 0.3, isV ? p : seg.z + offset);
                    anim.rotation.y = Math.random() * Math.PI * 2;
                    this.scene.add(anim);
                    this.animals.push({ mesh: anim, vx: (Math.random()-0.5)*0.01, vz: (Math.random()-0.5)*0.01 });
                    this.obstacles.push(anim);
                }
            }
        }
        
        // Spawn Boats if Bridge/Water
        if (cfg.isBridge && window.PRELOADED_MODELS) {
            const boatKeys = ['ship_cargo', 'boat_speed'].filter(k => window.PRELOADED_MODELS[k]);
            if (boatKeys.length > 0) {
                for (let i = 0; i < 4; i++) {
                    const type = boatKeys[Math.floor(Math.random() * boatKeys.length)];
                    const boat = window.PRELOADED_MODELS[type].clone();
                    boat.scale.set(10, 10, 10);
                    boat.position.set((Math.random() - 0.5) * 500, -2, (Math.random() - 0.5) * 500);
                    boat.rotation.y = Math.random() * Math.PI * 2;
                    this.scene.add(boat);
                }
            }
        }
        const designColors = [0xff4444, 0x1e90ff, 0x3a3a3a, 0xffd54a, 0xffffff, 0x888888, 0x27ae60, 0xf39c12];
        const allRoads = cfg.roads;
        let multipliedNpcs = [];
        for (let m = 0; m < 6; m++) {
          multipliedNpcs.push(...npcTypes);
        }
        multipliedNpcs.forEach((nType, i) => {
          const nv = this._makeNPC(nType, designColors[i % designColors.length]);
          const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
          // ── BIDIRECTIONAL: 35% of NPCs go opposing direction ──
          const isOpp = i < Math.floor(multipliedNpcs.length * 0.35);
          const laneOffset = isOpp ? -2.5 : 2.5; // opposing use left lane
          if (seg.type === 'v') {
            nv.position.set(seg.x + laneOffset, 0, seg.z1 + Math.random() * Math.abs(seg.z2 - seg.z1));
            if (isOpp) nv.rotation.y = Math.PI; // face opposite direction
          } else {
            nv.position.set(seg.x1 + Math.random() * Math.abs(seg.x2 - seg.x1), 0, seg.z + laneOffset);
            nv.rotation.y = isOpp ? -Math.PI / 2 : Math.PI / 2;
          }
          const spdMult = nType === 'truck' ? 0.6 : nType === 'bus' ? 0.7 : nType === 'cycle' ? 0.4 : nType === 'bike' ? 0.9 : nType === 'auto' ? 0.75 : 0.8;
          nv.userData = {
            spd: (0.2 + Math.random() * 0.15) * spdMult,
            baseSpd: (0.2 + Math.random() * 0.15) * spdMult,
            isAmb: false,
            npcType: nType,
            moveAxis: seg.type,
            isOpp,
            baseCoord: seg.type === 'v' ? seg.x : seg.z,
            dir: isOpp ? -1 : 1,    // direction multiplier
            minPos: seg.type === 'v' ? Math.min(seg.z1, seg.z2) : Math.min(seg.x1, seg.x2),
            maxPos: seg.type === 'v' ? Math.max(seg.z1, seg.z2) : Math.max(seg.x1, seg.x2),
            txX: seg.type === 'v' ? seg.x + laneOffset : undefined,
            state: 'CRUISE'
          };
          this.npcs.push(nv); this.scene.add(nv);
        });

        // ── STATIC PARKED CARS ──
        for (let i = 0; i < allRoads.length * 3; i++) {
          const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
          const pType = ['car', 'taxi', 'truck'][Math.floor(Math.random() * 3)];
          const pc = this._makeNPC(pType, designColors[Math.floor(Math.random() * designColors.length)]);
          const isLeft = Math.random() > 0.5;
          const parkOffset = isLeft ? -4.5 : 4.5;
          if (seg.type === 'v') {
            pc.position.set(seg.x + parkOffset, 0, seg.z1 + Math.random() * Math.abs(seg.z2 - seg.z1));
            pc.rotation.y = isLeft ? Math.PI : 0;
          } else {
            pc.position.set(seg.x1 + Math.random() * Math.abs(seg.x2 - seg.x1), 0, seg.z + parkOffset);
            pc.rotation.y = isLeft ? -Math.PI / 2 : Math.PI / 2;
          }
          this.scene.add(pc);
          if (this.obstacles) this.obstacles.push(pc);
        }

        // Special features per level
        if (cfg.hasRain) {
          this._create3DRain();
          // Spawn random puddles on the roads
          const puddleGeo = new THREE.PlaneGeometry(10, 8);
          const puddleMat = new THREE.MeshBasicMaterial({ color: 0x4a6a8a, transparent: true, opacity: 0.6 });
          for (let i = 0; i < 30; i++) {
            const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
            const px = seg.type === 'v' ? seg.x : seg.x1 + Math.random() * (seg.x2 - seg.x1);
            const pz = seg.type === 'v' ? seg.z1 + Math.random() * (seg.z2 - seg.z1) : seg.z;
            const p = new THREE.Mesh(puddleGeo, puddleMat);
            p.rotation.x = -Math.PI / 2;
            p.position.set(px, 0.05, pz);
            this.scene.add(p);
          }
          for (let i = 0; i < 15; i++) {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(1.4 + Math.random(), 1.5 + Math.random(), .08, 12), new THREE.MeshPhongMaterial({ color: 0x0c101a, transparent: true, opacity: 0.6 }));
            p.position.set((Math.random() - .5) * 120, 0.016, (Math.random() - .5) * 160); this.scene.add(p); this.spc.push(p); p.userData = { isPH: true };
          }
        }
        
        // Puddles for level 5 (Rain & Slippery Roads)
        this.puddles = [];
        if (cfg.id === 5) {
            for (let i = 0; i < 10; i++) {
                const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
                const isV = seg.type === 'v';
                const p = new THREE.Mesh(
                    new THREE.CylinderGeometry(2, 2, 0.05, 16), 
                    new THREE.MeshBasicMaterial({ color: 0x3498db, transparent: true, opacity: 0.6 })
                );
                const minP = isV ? Math.min(seg.z1, seg.z2) : Math.min(seg.x1, seg.x2);
                const maxP = isV ? Math.max(seg.z1, seg.z2) : Math.max(seg.x1, seg.x2);
                const pos = minP + Math.random() * (maxP - minP);
                const offset = (Math.random() - 0.5) * 6;
                p.position.set(isV ? seg.x + offset : pos, 0.03, isV ? pos : seg.z + offset);
                this.scene.add(p);
                this.puddles.push(p);
            }
        }
        
        if (cfg.hasEmergency || cfg.id === 8) {
          if (window.PRELOADED_MODELS && window.PRELOADED_MODELS['ambulance']) {
              this.ms.amb = window.PRELOADED_MODELS['ambulance'].clone();
              this.ms.amb.scale.set(1.5, 1.5, 1.5);
              this.ms.amb.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
          } else {
              this.ms.amb = this._makeNPC('car', 0xffffff);
          }
          this.ms.amb.position.set(0, 0.5, -230);
          this.ms.amb.userData = { spd: 1.2, isAmb: true, npcType: 'ambulance', moveAxis: 'v' };
          const flash = new THREE.PointLight(0xff0000, 2, 8); flash.position.y = 1.5; this.ms.amb.add(flash);
          const flash2 = new THREE.PointLight(0x0000ff, 2, 8); flash2.position.set(.5, 1.5, 0); this.ms.amb.add(flash2);
          this.npcs.push(this.ms.amb); this.scene.add(this.ms.amb);
        }
        
        // Train / Metro Logic
        this.trains = [];
        if (cfg.id === 12 && window.PRELOADED_MODELS && window.PRELOADED_MODELS['train']) {
            // Railway crossing level
            const train = window.PRELOADED_MODELS['train'].clone();
            train.scale.set(6, 6, 6);
            train.position.set(100, 0, 50); // crosses Z at 50
            train.rotation.y = -Math.PI / 2;
            this.scene.add(train);
            this.trains.push({ mesh: train, vx: -0.8 });
            
            // Add a barrier
            const barrier = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            barrier.position.set(0, 1, 40);
            this.scene.add(barrier);
            this.obstacles.push(barrier);
        }
        if (cfg.id === 9 && window.PRELOADED_MODELS && window.PRELOADED_MODELS['metro']) {
            // Metro station level
            const metro = window.PRELOADED_MODELS['metro'].clone();
            metro.scale.set(6, 6, 6);
            metro.position.set(100, 15, 0); // elevated
            metro.rotation.y = -Math.PI / 2;
            this.scene.add(metro);
            this.trains.push({ mesh: metro, vx: -0.6 });
        }
        
        // Bus Stop Logic
        if (cfg.id === 7) {
            const busStop = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            busStop.position.set(6, 1.5, 30);
            this.scene.add(busStop);
            this.obstacles.push(busStop);
            
            const bus = this._makeNPC('bus', 0xffffff);
            bus.position.set(4, 0, 30);
            bus.userData = { spd: 0, npcType: 'bus', moveAxis: 'v', isStopped: true };
            this.npcs.push(bus);
            this.scene.add(bus);
            
            // Pedestrians waiting
            for (let i = 0; i < 3; i++) {
                const ped = _buildHuman();
                ped.position.set(7 + i, 0, 30 + Math.random()*2);
                ped.userData.vx = 0; ped.userData.vz = 0;
            }
        }
        
        // Custom Monuments and Sneh Asha
        if (cfg.id === 1) {
            // Sneh Asha Building
            const saGeo = new THREE.BoxGeometry(10, 40, 10);
            const saMat = new THREE.MeshPhongMaterial({ color: 0xe0e0e0 });
            const saBldg = new THREE.Mesh(saGeo, saMat);
            saBldg.position.set(-30, 20, 0);
            this.scene.add(saBldg);
            this.obstacles.push(saBldg);
            
            new THREE.TextureLoader().load('sneh-logo.webp', tex => {
                const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
                logoMesh.position.set(-24.9, 30, 0);
                logoMesh.rotation.y = Math.PI / 2;
                this.scene.add(logoMesh);
            });
            
            // Gateway of India (Detailed representation for Mumbai)
            const gwGroup = new THREE.Group();
            const stoneMat = new THREE.MeshPhongMaterial({ color: 0xdfd3c3 }); // Basalt color
            
            // Main Pillars
            const p1 = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 8), stoneMat); p1.position.set(-10, 9, 0); gwGroup.add(p1);
            const p2 = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 8), stoneMat); p2.position.set(10, 9, 0); gwGroup.add(p2);
            
            // Center Arch Block (top of the arch)
            const archTop = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 8), stoneMat); archTop.position.set(0, 15, 0); gwGroup.add(archTop);
            
            // Side sections (smaller arches placeholder)
            const sp1 = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 6), stoneMat); sp1.position.set(-17, 6, 0); gwGroup.add(sp1);
            const sp2 = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 6), stoneMat); sp2.position.set(17, 6, 0); gwGroup.add(sp2);
            
            // Top Dome / Turrets
            const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 8), stoneMat); t1.position.set(-10, 20, 0); gwGroup.add(t1);
            const t2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 8), stoneMat); t2.position.set(10, 20, 0); gwGroup.add(t2);
            const t3 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 8), stoneMat); t3.position.set(-17, 13.5, 0); gwGroup.add(t3);
            const t4 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 8), stoneMat); t4.position.set(17, 13.5, 0); gwGroup.add(t4);
            
            gwGroup.position.set(0, 0, -80);
            this.scene.add(gwGroup);
            this.obstacles.push(p1, p2, sp1, sp2);
        }
        
        // Gully / Narrow Road Elements
        if (cfg.id === 10) {
            for (let i=0; i<15; i++) {
                const cart = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 3), new THREE.MeshLambertMaterial({ color: 0x8b4513 }));
                cart.position.set((Math.random() > 0.5 ? 1 : -1) * (2 + Math.random()*2), 0.75, (Math.random() - 0.5) * 150);
                this.scene.add(cart);
                this.obstacles.push(cart);
            }
        }
        
        // ── THEME-SPECIFIC ELEMENTS ──
        if (cfg.themeType === 'pedestrian_courtesy') {
            // Spawn extra pedestrians crossing
            for (let i = 0; i < 8; i++) {
                const ped = _buildHuman();
                ped.position.set((Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20);
                const vx = (Math.random() > 0.5 ? 1 : -1) * 0.05;
                ped.userData = {
                    t: Math.random() * 10, spd: Math.abs(vx),
                    isV: true, dir: Math.sign(vx), startZ: ped.position.z, roadC: ped.position.x,
                    state: 'crossing', side: 1, targetDist: 20
                };
                this.scene.add(ped);
                this.peds.push(ped);
            }
        } else if (cfg.themeType === 'respectful_parking') {
            // Spawn haphazard parked cars
            for (let i = 0; i < 15; i++) {
                const pc = this._makeNPC('car', 0x999999);
                pc.position.set((Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 4), 0, (Math.random() - 0.5) * 150);
                pc.rotation.y = (Math.random() - 0.5) * 0.5;
                pc.userData.spd = 0; pc.userData.isStopped = true; pc.userData.isParked = true;
                this.npcs.push(pc); this.scene.add(pc);
            }
        } else if (cfg.themeType === 'ambulance_priority') {
            if (!this.ms.amb) {
                this.ms.amb = this._makeNPC('car', 0xffffff);
                this.ms.amb.userData = { spd: 1.2, isAmb: true, npcType: 'ambulance', moveAxis: 'v' };
                const flash = new THREE.PointLight(0xff0000, 2, 8); flash.position.y = 1.5; this.ms.amb.add(flash);
                const flash2 = new THREE.PointLight(0x0000ff, 2, 8); flash2.position.set(.5, 1.5, 0); this.ms.amb.add(flash2);
                this.npcs.push(this.ms.amb); this.scene.add(this.ms.amb);
            }
            this.ms.amb.position.set(2, 0.5, 30); // Right behind player
        } else if (cfg.themeType === 'puddle_etiquette') {
            const puddleGeo = new THREE.PlaneGeometry(6, 6);
            const puddleMat = new THREE.MeshBasicMaterial({ color: 0x4a6a8a, transparent: true, opacity: 0.6 });
            for (let i = 0; i < 5; i++) {
                const p = new THREE.Mesh(puddleGeo, puddleMat);
                p.rotation.x = -Math.PI / 2;
                p.position.set((Math.random() > 0.5 ? 1 : -1) * 3, 0.05, -10 - i * 20);
                this.scene.add(p);
                this.puddles = this.puddles || []; this.puddles.push(p);
                
                const ped = _buildHuman();
                ped.position.set(p.position.x + (p.position.x > 0 ? 3 : -3), 0, p.position.z);
                ped.userData = {
                    t: Math.random() * 10, spd: 0,
                    isV: true, dir: 1, startZ: ped.position.z, roadC: ped.position.x,
                    state: 'idle', side: 1, targetDist: 0
                };
                this.scene.add(ped);
                this.peds.push(ped);
            }
        } else if (cfg.themeType === 'no_honking') {
            cfg.isSilenceZone = true;
            for (let i = 0; i < 6; i++) {
                const block = this._makeNPC('car', Math.random() * 0xffffff);
                block.position.set(0, 0, -20 - i * 15);
                block.userData.spd = 0; block.userData.isStopped = true;
                this.npcs.push(block); this.scene.add(block);
            }
            // Hospital sign
            const hGeo = new THREE.BoxGeometry(10, 10, 10);
            const hMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const hospital = new THREE.Mesh(hGeo, hMat);
            hospital.position.set(-15, 5, -30);
            this.scene.add(hospital); this.obstacles.push(hospital);
        }
        
        // ── MOUNTAIN BACKDROP ──
        if (cfg.hasMountain) {
          const mM = new THREE.MeshPhongMaterial({ color: 0x4a6040 });
          const rM = new THREE.MeshPhongMaterial({ color: 0x7a6d5c });
          [
            { x: 200, z: -300, h: 80, w: 160 },
            { x: -180, z: -200, h: 95, w: 140 },
            { x: 160, z: -500, h: 70, w: 130 },
            { x: -200, z: -450, h: 85, w: 150 }
          ].forEach(({ x, z, h, w }) => {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(w / 2, h, 7), mM);
            cone.position.set(x, h / 2, z);
            this.scene.add(cone);
            const rock = new THREE.Mesh(new THREE.ConeGeometry(w / 4, h * 0.6, 5), rM);
            rock.position.set(x + 15, h * 0.3, z + 20);
            this.scene.add(rock);
          });
          // Guardrails along main road for ghat feel
          for (let rz = -350; rz <= 100; rz += 8) {
            const grL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 3), new THREE.MeshPhongMaterial({ color: 0xcccccc }));
            grL.position.set(8, 0.35, rz); this.scene.add(grL);
            const grR = grL.clone(); grR.position.x = -8; this.scene.add(grR);
          }
          // Mist/fog enhancement for mountain feel
          this.scene.fog = new THREE.Fog(this.scene.background, 60, 380);
        }
        if (cfg.hasRailway) {
          (cfg.railZ || []).forEach(rz => {
            // Rail tracks
            for (let t = -25; t < 25; t += 2) {
              const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, .05, 1.5), new THREE.MeshPhongMaterial({ color: 0x888888 }));
              rail.position.set(t, .04, rz); this.scene.add(rail);
            }
            // Crossbar ties
            for (let t = -25; t < 25; t += 4) {
              const tie = new THREE.Mesh(new THREE.BoxGeometry(3, .08, .3), new THREE.MeshPhongMaterial({ color: 0x4a3728 }));
              tie.position.set(t, .03, rz); this.scene.add(tie);
            }
            // Gate poles
            [-8, 8].forEach(gx => {
              const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 3, 8), new THREE.MeshPhongMaterial({ color: 0xcc0000 }));
              pole.position.set(gx, 1.5, rz + 7); this.scene.add(pole);
              const arm = new THREE.Mesh(new THREE.BoxGeometry(6, .12, .12), new THREE.MeshPhongMaterial({ color: 0xcc0000 }));
              arm.position.set(gx, 3, rz + 7); this.scene.add(arm);
            });
          });
        }
        if (cfg.hasMetro) {
          cfg.roads.forEach(r => {
            const isV = r.type === 'v';
            const start = isV ? Math.min(r.z1, r.z2) : Math.min(r.x1, r.x2);
            const end = isV ? Math.max(r.z1, r.z2) : Math.max(r.x1, r.x2);
            const len = Math.abs(end - start);
            const cx = isV ? r.x : (r.x1 + r.x2) / 2;
            const cz = isV ? (r.z1 + r.z2) / 2 : r.z;

            const track = new THREE.Mesh(new THREE.BoxGeometry(isV ? 6 : len, 1, isV ? len : 6), new THREE.MeshLambertMaterial({ color: 0x555555 }));
            track.position.set(cx, 12, cz);
            this.scene.add(track);

            for (let p = start + 10; p < end; p += 40) {
              const px = isV ? cx : p;
              const pz = isV ? p : cz;
              const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 12, 12), new THREE.MeshLambertMaterial({ color: 0x999999 }));
              pillar.position.set(px, 6, pz);
              this.scene.add(pillar); this.obstacles.push(pillar);
            }

            const train = new THREE.Mesh(new THREE.BoxGeometry(isV ? 4.5 : 30, 3, isV ? 30 : 4.5), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
            train.position.set(cx, 14, cz);
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(isV ? 4.6 : 30.1, 0.4, isV ? 30.1 : 4.6), new THREE.MeshLambertMaterial({ color: 0x3498db }));
            stripe.position.set(cx, 14, cz);
            this.scene.add(train); this.scene.add(stripe);
          });
        }
        if (cfg.isBridge) {
          // ── TOLL BOOTH on the bridge ──
          const tollM = new THREE.MeshPhongMaterial({ color: 0x888888 });
          const tollY = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
          // 3 toll pillars
          [-8, 0, 8].forEach(ox => {
            const tp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 1), tollM);
            tp.position.set(ox, 2, -120); this.scene.add(tp);
            const tr = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2), tollY);
            tr.position.set(ox, 4.2, -120); this.scene.add(tr);
          });
          const beam = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 0.5), tollM);
          beam.position.set(0, 4, -120); this.scene.add(beam);
          const sign = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 0.2), new THREE.MeshPhongMaterial({ color: 0x003399 }));
          sign.position.set(0, 5.5, -120); this.scene.add(sign);
          // Bridge railings
          [-7.5, 7.5].forEach(rx => {
            for (let z = -600; z < 100; z += 8) {
              const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.5, 6), new THREE.MeshPhongMaterial({ color: 0xcccccc }));
              post.position.set(rx, .75, z); this.scene.add(post);
            }
            const cable = new THREE.Mesh(new THREE.BoxGeometry(.04, 700, .04), new THREE.MeshPhongMaterial({ color: 0xdddddd }));
            cable.position.set(rx, 1.5, -250); cable.rotation.x = Math.PI / 2; this.scene.add(cable);
          });
          // Bridge pylons
          [-200, 0, -400].forEach(pz => {
            const pylon = new THREE.Mesh(new THREE.CylinderGeometry(.8, .6, 25, 8), new THREE.MeshPhongMaterial({ color: 0xcccccc }));
            pylon.position.set(0, 12, pz); this.scene.add(pylon);
          });
        }

        // Mumbai Landmarks (Spawned randomly in non-pedestrian levels to add flavor)
        if (!cfg.isPedestrian && !cfg.isBridge) {
          const buildLandmark = (type, bx, bz) => {
            const lg = new THREE.Group();
            if (type === 'gateway') {
              const m1 = new THREE.Mesh(new THREE.BoxGeometry(20, 18, 12), new THREE.MeshPhongMaterial({ color: 0xd4a373 }));
              m1.position.y = 9; lg.add(m1);
              const m2 = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 18, 16), new THREE.MeshBasicMaterial({ color: 0x111111 }));
              m2.position.set(0, 9, 1); m2.rotation.x = Math.PI / 2; lg.add(m2); // Arch hole
              const m3 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6, 8), new THREE.MeshPhongMaterial({ color: 0xd4a373 }));
              m3.position.set(-8, 21, 0); lg.add(m3);
              const m4 = m3.clone(); m4.position.set(8, 21, 0); lg.add(m4);
            } else if (type === 'bse') {
              const m1 = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 45, 16), new THREE.MeshPhongMaterial({ color: 0xcccccc }));
              m1.position.y = 22.5; lg.add(m1);
              const m2 = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 5, 16), new THREE.MeshPhongMaterial({ color: 0x444444 }));
              m2.position.y = 47.5; lg.add(m2);
            } else if (type === 'antilia') {
              for (let i = 0; i < 8; i++) {
                const w = 12 + Math.random() * 8;
                const m = new THREE.Mesh(new THREE.BoxGeometry(w, 5, w), new THREE.MeshPhongMaterial({ color: (i % 2 === 0) ? 0x88aa88 : 0xaaaaaa }));
                m.position.set(Math.random() * 4 - 2, 2.5 + i * 6, Math.random() * 4 - 2);
                lg.add(m);
              }
            }
            lg.position.set(bx, 0, bz);
            this.scene.add(lg);
          };
          // Pick 3 random roads and offset them heavily to place landmarks
          const types = ['gateway', 'bse', 'antilia'];
          for (let i = 0; i < 3; i++) {
            const r = cfg.roads[Math.floor(Math.random() * cfg.roads.length)];
            if (r.type === 'v') buildLandmark(types[i], r.x + 35, (r.z1 + r.z2) / 2);
            else buildLandmark(types[i], (r.x1 + r.x2) / 2, r.z + 35);
          }
        }

        if (cfg.hasSchool) {
          // School building
          const school = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 12), new THREE.MeshPhongMaterial({ color: 0xd4ac0d }));
          school.position.set(-40, 4, -80); this.scene.add(school); this.obstacles.push(school);
          // School sign
          const sign = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, .1), new THREE.MeshPhongMaterial({ color: 0xffff00 }));
          sign.position.set(0, 2.5, -60); this.scene.add(sign);
        }
        if (cfg.hasOcean) {
          const ocean = new THREE.Mesh(new THREE.PlaneGeometry(600, 1200), mats.water);
          ocean.rotation.x = -Math.PI / 2; ocean.position.set(350, .01, -150); this.scene.add(ocean);
        }
        if (cfg.hasBeach) {
          const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 600), new THREE.MeshPhongMaterial({ color: 0xc2b280 }));
          sand.rotation.x = -Math.PI / 2; sand.position.set(80, .005, -100); this.scene.add(sand);
          const ocean = new THREE.Mesh(new THREE.PlaneGeometry(400, 800), mats.water);
          ocean.rotation.x = -Math.PI / 2; ocean.position.set(250, .01, -100); this.scene.add(ocean);
        }
        if (cfg.hasSilentZone) {
          // Hospital building
          const hosp = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 15), new THREE.MeshPhongMaterial({ color: 0xeeeeee }));
          hosp.position.set(25, 6, -20); this.scene.add(hosp); this.obstacles.push(hosp);
          const cross = new THREE.Mesh(new THREE.BoxGeometry(2, 2, .1), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
          cross.position.set(25, 10, 7.6); this.scene.add(cross);
          // Silent zone markers
          [cfg.silentZ1 || 0, cfg.silentZ2 || 0].forEach(sz => {
            const marker = new THREE.Mesh(new THREE.BoxGeometry(1, 2, .1), new THREE.MeshPhongMaterial({ color: 0xff6600 }));
            marker.position.set(-7, 1, sz); this.scene.add(marker);
            const m2 = marker.clone(); m2.position.x = 7; this.scene.add(m2);
          });
        }

        // Bollards and barricades
        const bCount = cfg.isPedestrian ? 2 : 6;
        for (let i = 0; i < bCount; i++) {
          const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
          const bx = seg.type === 'v' ? seg.x + (Math.random() > .5 ? 5 : -5) : seg.x1 + Math.random() * (seg.x2 - seg.x1);
          const bz = seg.type === 'v' ? seg.z1 + Math.random() * (seg.z2 - seg.z1) : seg.z + (Math.random() > .5 ? 5 : -5);
          // Big red-white striped barricade
          const barG = new THREE.Group();
          const bp1 = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.5, 8), new THREE.MeshPhongMaterial({ color: 0xff3300 }));
          bp1.position.set(-0.5, 0.75, 0); barG.add(bp1);
          const bp2 = bp1.clone(); bp2.position.set(0.5, 0.75, 0); barG.add(bp2);
          const bBar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.15), new THREE.MeshPhongMaterial({ color: 0xffffff }));
          bBar.position.set(0, 1.3, 0); barG.add(bBar);
          const rSt = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.16), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
          rSt.position.set(0, 1.3, 0); barG.add(rSt);
          const bBar2 = bBar.clone(); bBar2.position.set(0, 0.9, 0); barG.add(bBar2);
          barG.position.set(bx, 0, bz); this.scene.add(barG); this.obstacles.push(barG);
        }
        // Remove any obstacle within 15 units of player start
        const pStart = cfg.route && cfg.route[0] ? cfg.route[0] : { x: 0, z: -200 };
        this.obstacles = this.obstacles.filter(ob => {
          const dx = ob.position.x - pStart.x;
          const dz = ob.position.z - (pStart.z - 20);
          if (Math.sqrt(dx * dx + dz * dz) < 15) { this.scene.remove(ob); return false; }
          return true;
        });
        // Parked vehicles
        if (!cfg.isPedestrian) {
          for (let i = 0; i < 6; i++) {
            const seg = allRoads[Math.floor(Math.random() * allRoads.length)];
            const types = ['car', 'auto', 'bike'];
            const pc = this._makeNPC(types[i % 3], Math.random() * 0xffffff);
            if (seg.type === 'v') pc.position.set(seg.x + (Math.random() > .5 ? 5.5 : -5.5), 0, seg.z1 + Math.random() * (seg.z2 - seg.z1));
            else pc.position.set(seg.x1 + Math.random() * (seg.x2 - seg.x1), 0, seg.z + (Math.random() > .5 ? 5.5 : -5.5));
            pc.userData = { isParked: true }; this.scene.add(pc); this.obstacles.push(pc);
          }
        }
      }