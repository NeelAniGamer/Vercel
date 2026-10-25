// ════════════════════════════════════════════════════════════════════════════════
// GAME OPTIMIZATION INTEGRATION — Hooks into game_core.js loop
// ════════════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // Wait for game to be ready
  function waitForGame() {
    if (window.game && window.game.renderCore && window.game.camera) {
      initOptimization();
    } else {
      setTimeout(waitForGame, 100);
    }
  }

  function initOptimization() {
    const game = window.game;
    const optimization = window.Optimization;
    
    if (!optimization) {
      console.warn('[Integration] Optimization module not loaded');
      return;
    }

    // Initialize optimization with game reference
    optimization.init(game);
    
    // Hook into render loop
    const originalLoop = game._loop.bind(game);
    game._loop = function() {
      requestAnimationFrame(() => this._loop());
      
      if (!this.playing || this.pause) {
        try {
          if (window.Cutscene && typeof window.Cutscene.tick === 'function' && window.Cutscene.isActive && window.Cutscene.isActive()) {
            window.Cutscene.tick(this);
            if (this.renderCore && this.scene && this.camera) {this.renderCore.render(this.scene, this.camera);}
            return;
          }
        } catch (err) {
          console.error('[Driving] Cutscene.tick() failed:', err);
          this.playing = true; this._camOverride = false;
        }
        if (this.renderCore && this.scene && this.camera) {this.renderCore.render(this.scene, this.camera);}
        return;
      }
      
      const rawDt = Math.min(this.clock.getDelta(), 0.033);
      let dt = rawDt;
      if (this._victorySlow > 0) {
        this._victorySlow -= rawDt;
        dt = rawDt * 0.25;
      }
      
      // ═══ OPTIMIZATION: Update systems ═══
      if (optimization && this.renderCore && this.camera) {
        optimization.update(dt, this.camera, this.renderCore.renderer);
      }
      
      // Update frustum for culling
      if (optimization && this.camera) {
        optimization.updateFrustum(this.camera);
      }
      
      // Original game loop logic continues...
      this.timer += dt;
      if (this._spawnInvulnerable > 0) this._spawnInvulnerable -= dt;
      if (this._brakeDustT > 0) this._brakeDustT -= dt;
      if (this._sbBounceT > 0) {this._sbBounceT -= dt; if (this._sbBounceT <= 0) {this._sbBounce = false; if (this.playerVehicle) {this.playerVehicle.position.y = 0;}}}
      this._honkedThisFrame = false;
      
      if (this._hitstopTimer > 0) {
        this._hitstopTimer -= dt;
        const k = Math.max(0, this._hitstopTimer / 0.17);
        dt *= (k > 0.6) ? 0.05 : (0.05 + 0.95 * (0.6 - k) / 0.6);
      }
      this._collidedThisFrame = false;
      this._lastCollisionType = '';
      
      // Use RenderCore quality settings
      const lodMult = this.renderCore ? this.renderCore.getLODMultiplier() : 1.0;
      const maxParticles = this.renderCore ? this.renderCore.getMaxParticles() : 2000;
      
      // Enhanced Physics
      if (!this.isPedestrian) {
        this._computeAeroForces(dt);
        this._updateBrakeHeat(dt);
      }
      
      try { this._tickEnterExit(dt); } catch (err) {
        console.error('[Driving] _tickEnterExit() failed:', err);
        this._camOverride = false;
        this._enterState = 'IDLE'; if (window.TrafficAudio) {window.TrafficAudio.playDoorClose();}
      }
      
      // Camera joystick
      if (this._camJoyActive && (this._camJoyDx || this._camJoyDy)) {
        this.targetCamYaw -= this._camJoyDx * dt;
        if (!this.isPedestrian) {
          this.targetCamYaw = Math.max(-Math.PI, Math.min(Math.PI, this.targetCamYaw));
        }
        this.targetCamPitch -= this._camJoyDy * dt;
        this.targetCamPitch = Math.max(-1.2, Math.min(1.2, this.targetCamPitch));
      }
      
      this._pollGamepad(dt);
      
      // ═══ OPTIMIZED NPC UPDATE ═══
      if (window.optimizedTrafficManager) {
        window.optimizedTrafficManager.update(dt, this.playerVehicle, this.sigs);
      } else {
        // Fallback to original
        this._input(dt); this._usigs(dt); this._unpcs(dt); this._upeds(dt); this._ucps(dt);
      }
      
      this._updateArrows(); this._updateVehicleBeacon(dt); this._ugps(); 
      this._checkBrakeZones(dt); this._uobs(dt); this._umode(dt); this._updateLights(dt); 
      this._decayCameraLook(dt); this._ucam(dt); this._usun(dt); this._updateDayNight(dt); 
      this._uhud(); this._ummap(); this._utransit(); this._computeTaskFlags(); this._checkTasks();
      if (this.taskManager) {this.taskManager.update(dt);}
      this._updateRain(dt); this._updateRainAudio(this.mode === 'rain' || this.mapCfg?.hasRain);
      this._updateDynamicLOD(lodMult);
      this._updateBreadcrumbPath(dt);
      
      if (this.sceneryKit && this.player && this.player.position) {
        this.sceneryKit.updateVisibility(this.player.position, this.renderDistance);
      }
      
      // World streaming with frustum culling
      if (this.worldStreamer) {
        if (this._needsInitialStream && this.player && this.player.position) {
          this.worldStreamer.update(this.player.position, 1.0);
          this._needsInitialStream = false;
        } else {
          this.worldStreamer.update(this.player.position, dt);
        }
        // Update chunk visibility
        this.worldStreamer.updateVisibility(this.camera);
      }
      
      // Mission updates
      this._collectMissionData(dt);
      
      if (this.missionManager && this.player && this.missionManager.active) {
        if (!this._missionExtra) {this._missionExtra = {};}
        const ex = this._missionExtra;
        ex.playerRot = this.player.rotation.y;
        ex.speed = Math.abs(this.speed);
        ex.lateralG = this._lateralAccel || 0;
        ex.longitudinalG = this._longitudinalAccel || 0;
        if (typeof this._updateRoadProblems === 'function') {this._updateRoadProblems();}
        ex.hitPothole = this._hitPotholeThisFrame || false;
        
        this._saveTick = (this._saveTick || 0) + 1;
        if (this._saveTick % 300 === 0) { try { this._saveRun(); } catch (e) {} }
        if (this._saveTick % 30 === 0) { try { this._updateTelemetryOverlay(); } catch (e) {} }
        if (this._saveTick % 4 === 0) { try { this._updateDiagnosticsHUD(); } catch (e) {} }
        if (this.playing && !this.isPedestrian) { try { this._updateJuice(dt); } catch (e) {} }
        if (this.playing) { try { this._updateNametags(); } catch (e) {} }
        ex.lastPos = this._lastPlayerPos || null;
        ex.leadVehiclePos = this._leadVehiclePos || null;
        ex.targetVehiclePos = this._targetVehiclePos || null;
        ex.pursuerPositions = this._pursuerPositions || [];
        ex.childrenGroups = this._childrenGroups || [];
        ex.violations = this._sidewalkViolations || [];
        ex.ambulancePos = this._ambulancePos || null;
        ex.pedPositions = this.peds;
        
        if (!this._vehiclePosMap) {this._vehiclePosMap = new Map();}
        const _vps = [];
        for (const n of (this.npcs || [])) {
          if (!n || !n.position) {continue;}
          let rec = this._vehiclePosMap.get(n.uuid);
          if (!rec) {rec = {x: 0, z: 0, speed: 0, caught: false}; this._vehiclePosMap.set(n.uuid, rec);}
          rec.x = n.position.x;
          rec.z = n.position.z;
          rec.speed = (n.userData && typeof n.userData.spd === 'number') ? n.userData.spd * 100 : 0;
          _vps.push(rec);
        }
        ex.vehiclePositions = _vps;
        ex.intersections = this._intersections || [];
        this.missionManager.update(this.player.position, dt, this.timer, ex);
        if (!this._lastPlayerPos) {this._lastPlayerPos = new THREE.Vector3();}
        this._lastPlayerPos.copy(this.player.position);
        this._hitPotholeThisFrame = false;
      }
      
      // Suspension
      if (!this.isPedestrian) {
        this._updateSuspension(dt);
      }
      
      if (window.TrafficAudio && this._collidedThisFrame) {window.TrafficAudio.playCrash(0.8);}
      this._updateCrashFX(dt);
      this._updateVFX(dt);
      
      // Player animation
      const playerChar = this.playerCharacter || (this.isPedestrian ? this.player : null);
      if (playerChar && playerChar.userData) {
        if (playerChar.userData.isFBXAnimated && playerChar.userData.mixer) {
          const walkW = Math.min(Math.abs(this.speed) * 3, 1);
          if (playerChar.userData.idleAction) {playerChar.userData.idleAction.setEffectiveWeight(1 - walkW);}
          if (playerChar.userData.runAction) {playerChar.userData.runAction.setEffectiveWeight(walkW);}
          playerChar.userData.mixer.update(dt);
        } else if (this.isPedestrian) {
          this._animateCharacterWalk(playerChar, Math.abs(this.speed), dt);
        }
      }
      
      if (this.isPedestrian && Math.abs(this.speed) > 0.02 && window.TrafficAudio) {
        window.TrafficAudio.playFootstep();
      }
      
      // Render with stats
      if (this.renderCore && this.scene && this.camera) {
        this.renderCore.render(this.scene, this.camera);
        
        // Update debug panel
        if (optimization && optimization.debugPanel) {
          optimization.updateDebugPanel();
        }
      }
    };
    
    // Also optimize traffic manager if available
    if (window.TrafficManager && game.trafficManager) {
      window.optimizedTrafficManager = new window.TrafficManager(game);
      // Replace the traffic manager reference
      game.trafficManager = window.optimizedTrafficManager;
    }
    
    console.log('[Integration] Optimization integration complete');
  }

  // Start waiting
  waitForGame();
})();

// ─── Console Commands for Testing ══════════════════════════════════════════════════
window.opt = {
  stats: () => window.Optimization?.stats || {},
  quality: (level) => window.game?.renderCore?.setQuality?.(level),
  getQuality: () => window.game?.renderCore?.getQuality?.(),
  pools: () => window.ThreePools?.getStats?.(),
  frustum: () => window.Optimization?.frustum,
  lod: () => window.Optimization?.lodRegistry?.length,
  streamer: () => window.game?.worldStreamer?.getStats?.(),
  traffic: () => window.optimizedTrafficManager?.getStats?.(),
  reset: () => { window.Optimization?.clearGrid?.(); window.ThreePools?.releaseAll?.(); },
  debug: (on) => {
    if (on && window.Optimization) window.Optimization.createDebugPanel();
    else if (window.Optimization?.debugPanel) window.Optimization.debugPanel.remove();
  }
};

console.log('[Integration] Optimization commands available: opt.stats(), opt.quality("HIGH"), opt.pools(), opt.debug(true)');