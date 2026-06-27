const fs = require('fs');
let gc = fs.readFileSync('game_core.js', 'utf8');

// 1. Add Checkpoints, BRTS, and Speed Breakers logic in _buildScene
const buildSceneAdditions = `
          if (r.type === 'v' && Math.random() < 0.1) {
              // Add BRTS logic
              r.hasBRTS = true;
          }
          if (r.type === 'h' && Math.random() < 0.05) {
              // Add Police Checkpoint
              this._addPoliceCheckpoint(r.x, r.z);
          }
          if (r.type === 'v' && Math.random() < 0.1) {
              // Add School Zone
              this._addSchoolZone(r.x, r.z);
          }
          if (Math.random() < 0.15) {
              // Add Speed Breaker
              this._addSpeedBreaker(r.x, r.z, r.type === 'v' ? 0 : Math.PI / 2);
          }
`;

// Inject into road loops
const roadLoopTarget = `this.world.push(roadHb);`;
gc = gc.replace(roadLoopTarget, roadLoopTarget + buildSceneAdditions);

// 2. Define the new generator functions
const newGenerators = `
      _addPoliceCheckpoint(x, z) {
          if(!this.checkpoints) this.checkpoints = [];
          const barricade = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 0.5), new THREE.MeshLambertMaterial({color: 0xffaa00}));
          barricade.position.set(x, 0.5, z);
          this.scene.add(barricade);
          this.obstacles.push(barricade);
          this.checkpoints.push({x: x, z: z, cleared: false});
      }
      _addSchoolZone(x, z) {
          if(!this.schoolZones) this.schoolZones = [];
          this.schoolZones.push(new THREE.Vector3(x, 0, z));
      }
`;
gc = gc.replace(`_addSpeedBreaker(x, z, rotY = 0) {`, newGenerators + `\n      _addSpeedBreaker(x, z, rotY = 0) {`);

// 3. Update Input & Physics loop for Distracted Driving & BRTS
const inputPhysicsOld = `this.speed *= this.fric;
        }`;
const inputPhysicsNew = `this.speed *= this.fric;
        }
        
        // Distracted Driving (Mobile Phone Lag & Drift)
        if (this.mobileOn && !this.isPedestrian) {
            this.turn *= 0.5; // sluggish steering
            if (this.speed > 0.1) {
                this.playerVehicle.rotation.y += (Math.random() - 0.5) * 0.02; // random drift
            }
        }
        
        // BRTS Lane Check
        let inBRTS = false;
        this.roadSegments.forEach(r => {
            if (r.hasBRTS && r.type === 'v') {
                if (Math.abs(this.player.position.z - r.z) < r.len / 2) {
                    if (this.player.position.x > r.x + 2 && this.player.position.x < r.x + 6) {
                        inBRTS = true;
                    }
                }
            }
        });
        if (inBRTS && !this.isPedestrian && this.speed > 0.1) {
            if (!this.brtsPenaltyCooldown || this.brtsPenaltyCooldown <= 0) {
                this.vio++; this.score -= 20; this.fine += 500;
                ui.issueChallan('Driving in BRTS Corridor', 'Sec 177 MV Act', '₹500', 'Lane Violation');
                this.brtsPenaltyCooldown = 2.0;
            }
        }
        if (this.brtsPenaltyCooldown > 0) this.brtsPenaltyCooldown -= dt;
`;
gc = gc.replace(inputPhysicsOld, inputPhysicsNew);

// 4. Update Checkpoints & School Zones in _loop
const loopChecksOld = `const owEl = this.dom['ow'];`;
const loopChecksNew = `const owEl = this.dom['ow'];
        
        // Checkpoints logic
        if (this.checkpoints && !this.isPedestrian) {
            let nearCp = null;
            this.checkpoints.forEach(cp => {
                const dist = this.player.position.distanceTo(new THREE.Vector3(cp.x, 0, cp.z));
                if (dist < 20 && !cp.cleared) {
                    nearCp = cp;
                    if (this.speed > 0.2) {
                        this._go('Failed to stop at Police Checkpoint (Imprisonment)');
                    }
                }
            });
            if (nearCp && Math.abs(this.speed) < 0.01) {
                // If stopped near checkpoint, prompt to show documents
                if (!this.docPromptShown) {
                    toast('🚔 Police Checkpoint! Press [T] to show documents.', '#ffaa00', 3000);
                    this.docPromptShown = true;
                }
                if (this.keys['t']) {
                    nearCp.cleared = true;
                    toast('✅ Documents Verified. You may proceed.', '#00c851');
                }
            } else {
                this.docPromptShown = false;
            }
        }
        
        // School Zone Logic
        let inSchoolZone = false;
        if (this.schoolZones) {
            this.schoolZones.forEach(sz => {
                if (this.player.position.distanceTo(sz) < 40) inSchoolZone = true;
            });
        }
        if (inSchoolZone) {
            if (this.speed > 0.3) {
                if (!this.szPenaltyCooldown || this.szPenaltyCooldown <= 0) {
                    ui.issueChallan('Overspeeding in School Zone', 'Sec 112 MV Act', '₹2,000', 'Speed Violation');
                    this.vio++; this.score -= 30; this.fine += 2000;
                    this.szPenaltyCooldown = 3.0;
                }
            }
            if (this.keys[' ']) { // honking
                if (!this.szHonkCooldown || this.szHonkCooldown <= 0) {
                    ui.issueChallan('Honking in School Zone', 'Sec 190(2) MV Act', '₹1,000', 'Silence Violation');
                    this.vio++; this.score -= 30; this.fine += 1000;
                    this.szHonkCooldown = 3.0;
                }
            }
        }
        if (this.szPenaltyCooldown > 0) this.szPenaltyCooldown -= dt;
        if (this.szHonkCooldown > 0) this.szHonkCooldown -= dt;
`;
gc = gc.replace(loopChecksOld, loopChecksNew);

// 5. Update Speed Breaker physics in _loop
// Currently: if (!this.isPedestrian && sb.userData.cd <= 0 && this.player.position.distanceToSquared(sb.position) < 6.25)
const sbOld = `this.speed *= 0.6;`;
const sbNew = `this.speed *= 0.6;
                        // Camera shake and damage
                        if (Math.abs(this.speed) > 0.25) { // Roughly > 20 km/h
                            this.hp -= 5;
                            toast('⚠️ Hit Speed Breaker too fast! Vehicle Damaged.', '#ff3b30');
                            // Camera shake effect
                            this.camera.position.y += 0.5;
                            setTimeout(() => { this.camera.position.y -= 0.5; }, 50);
                        }`;
gc = gc.replace(sbOld, sbNew);

fs.writeFileSync('game_core.js', gc);
console.log('game_core.js patched for Phase 6 mechanics');
