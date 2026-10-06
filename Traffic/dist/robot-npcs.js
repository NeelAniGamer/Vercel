/**
 * ============================================================================
 * ROBOT NPCS (robot-npcs.js)
 * ============================================================================
 * Robot NPCs for Mumbai Traffic Hero.
 *
 * Behaviour lives in NPC_PROFILES in npc-ai.js (keys `robot_delivery`,
 * `robot_crosser`). Those carry `weight: 0`, so they are never chosen at
 * random — a robot only appears when a level explicitly asks for one:
 *
 *     vehicle.profileKey = 'robot_delivery';
 *     RobotNPCs.attach(vehicle, scene);          // visual + animation
 *
 * Models are Quaternius CC0 (see Models/robots/CREDITS.md).
 *
 * SCALE: these GLBs are NOT in metres. Quaternius ships them normalised to a
 * few centimetres, so every model needs its own factor below — they differ by
 * ~13x and a single global scale will render some of them invisible. Factors
 * are derived from bind-pose bounds against the game's reference pedestrian
 * (Models/anim_walker_biped.glb = 1.700 m tall).
 *
 * Loaded standalone (classic script, no bundler), matching the pattern of the
 * other patch modules in this project. Defensive throughout: if THREE or
 * GLTFLoader is unavailable the helpers no-op rather than throwing, because
 * start.js polls for `Game` and a throw here would break boot.
 * ============================================================================
 */

(function (window) {
  'use strict';

  var REF_HEIGHT = 1.7; // metres — pedestrian reference height

  /**
   * Robot model table.
   *   file        path relative to the page (pages sit at the app root)
   *   height      measured bind-pose Y size in GLB units
   *   scale       multiplier applied on load to reach a human-ish silhouette
   *   clips       animation clip names (suffix after the armature prefix)
   *   tone        content suitability — see CREDITS.md
   */
  var ROBOT_MODELS = {
    friendly: {
      file: 'Models/robots/animated_robot.glb',
      height: 0.026,
      scale: 65,
      clips: {
        idle: 'Robot_Idle',
        walk: 'Robot_Walking',
        run: 'Robot_Running',
        wave: 'Robot_Wave',
        thumbsUp: 'Robot_ThumbsUp',
        yes: 'Robot_Yes',
        no: 'Robot_No',
        sit: 'Robot_Sitting'
      },
      tone: 'friendly',
      default: true
    },
    enemy: {
      file: 'Models/robots/robot_enemy.glb',
      height: 0.005,
      scale: 340,
      clips: {
        idle: 'Idle',
        walk: 'Walk',
        run: 'Run',
        attack: 'Attack',
        shoot: 'Shoot',
        death: 'Death'
      },
      // Attack/Shoot/Death are wrong for a learner-facing road-safety game.
      tone: 'hostile'
    },
    enemyLarge: {
      file: 'Models/robots/robot_enemy_large.glb',
      height: 0.064,
      scale: 27,
      clips: {
        idle: 'Idle',
        walk: 'Walk',
        run: 'Run',
        attack: 'Attack',
        death: 'Death'
      },
      tone: 'hostile'
    },
    enemyFlying: {
      file: 'Models/robots/robot_enemy_flying.glb',
      height: 0.005,
      scale: 340,
      clips: {
        idle: 'Idle',
        walk: 'Walk',
        run: 'Run',
        attack: 'Attack',
        death: 'Dead'
      },
      tone: 'hostile'
    }
  };

  var DEFAULT_MODEL = 'friendly';

  // ---------------------------------------------------------------- helpers

  function three() {
    return window.THREE || null;
  }

  /**
   * GLB clip names are namespaced by armature, e.g.
   * "RobotArmature|Robot_Walking". Match on the trailing segment so the table
   * above can stay readable and survives an armature rename.
   */
  function findClip(clips, wanted) {
    if (!clips || !wanted) return null;
    for (var i = 0; i < clips.length; i++) {
      var name = clips[i].name || '';
      if (name === wanted) return clips[i];
      var parts = name.split('|');
      if (parts[parts.length - 1] === wanted) return clips[i];
    }
    return null;
  }

  /** Recursively enable shadows, matching ModelRegistry defaults. */
  function prepMeshes(root) {
    root.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return root;
  }

  /** Pick idle vs walk vs run from an NPC's own speed, if we can read one. */
  function clipForMotion(clips, speed) {
    if (speed == null) return findClip(clips, 'idle') || clips[0] || null;
    if (speed > 4.5) return findClip(clips, 'run') || findClip(clips, 'walk');
    if (speed > 0.6) return findClip(clips, 'walk');
    return findClip(clips, 'idle');
  }

  // ------------------------------------------------------------------ attach

  /**
   * Attach a robot visual to an NPC vehicle object.
   * Returns a Promise resolving to a handle, or resolving to null if the model
   * could not be created (missing THREE, missing loader, or load failure).
   *
   * Handle shape: { root, mixer, clips, model, play(name), setSpeed(n) }
   */
  function attach(vehicle, scene, modelKey) {
    var T = three();
    if (!T || !scene) return Promise.resolve(null);

    var def = ROBOT_MODELS[modelKey || DEFAULT_MODEL];
    if (!def) def = ROBOT_MODELS[DEFAULT_MODEL];

    var loader = null;
    try {
      if (typeof T.GLTFLoader === 'undefined') return Promise.resolve(null);
      loader = new T.GLTFLoader();
    } catch (e) {
      return Promise.resolve(null);
    }

    return new Promise(function (resolve) {
      var settled = false;
      var done = function (v) { if (!settled) { settled = true; resolve(v); } };

      try {
        loader.load(
          def.file,
          function (gltf) {
            try {
              var root = gltf.scene || glf.scenes[0];
              prepMeshes(root);

              // Critical: models are centimetre-scale. Without this they render
              // sub-millimetre and are effectively invisible.
              root.scale.setScalar(def.scale);
              scene.add(root);

              var mixer = null;
              var action = null;
              if (typeof T.AnimationMixer === 'function' && gltf.animations && gltf.animations.length) {
                mixer = new T.AnimationMixer(root);
                action = mixer.clipAction(clipForMotion(gltf.animations, null));
                if (action) {
                  action.play();
                  // Loop locomotion; one-shot emotes should not loop.
                  var n = action.getClip().name || '';
                  var looping = /idle|walk|run/i.test(n.split('|').pop());
                  action.setLoop(looping ? T.LoopRepeat : T.LoopOnce, looping ? Infinity : 1);
                  if (!looping) { action.clampWhenFinished = true; }
                }
              }

              if (vehicle) {
                vehicle.robotModel = root;
                vehicle.robotMixer = mixer;
              }
              if (mixer) _mixers.push(mixer);

              done({
                root: root,
                mixer: mixer,
                clips: gltf.animations || [],
                model: def,
                play: function (clipKey) {
                  if (!mixer) return false;
                  var c = findClip(gltf.animations, def.clips[clipKey]);
                  if (!c) return false;
                  var a = mixer.clipAction(c);
                  a.reset();
                  var n = (c.name || '').split('|').pop();
                  var oneShot = !/idle|walk|run/i.test(n);
                  a.setLoop(oneShot ? T.LoopOnce : T.LoopRepeat, oneShot ? 1 : Infinity);
                  if (oneShot) a.clampWhenFinished = true;
                  a.play();
                  return true;
                },
                setSpeed: function (speed) {
                  if (!mixer || !action) return;
                  var want = clipForMotion(gltf.animations, speed);
                  if (!want) return;
                  if (action.getClip() === want) return;
                  var a = mixer.clipAction(want);
                  a.reset();
                  a.setLoop(T.LoopRepeat, Infinity);
                  a.play();
                  action = a;
                }
              });
            } catch (e) {
              if (window.console) console.warn('[robot-npcs] failed to build robot:', e);
              done(null);
            }
          },
          undefined,
          function (err) {
            if (window.console) console.warn('[robot-npcs] load failed for', def.file, err);
            done(null);
          }
        );
      } catch (e) {
        done(null);
      }
    });
  }

  /** Live mixers, populated by attach(). */
  var _mixers = [];

  /** Advance every attached robot's mixer. Call once per frame from the game loop. */
  function update(dt) {
    if (!dt && dt !== 0) return;
    var T = three();
    if (!T || !T.AnimationMixer) return;
    for (var i = _mixers.length - 1; i >= 0; i--) {
      var m = _mixers[i];
      // Prune mixers whose root left the scene (level despawn), else this leaks.
      if (!m || !m.update || (m.getRoot && !m.getRoot().parent)) {
        _mixers.splice(i, 1);
        continue;
      }
      m.update(dt);
    }
  }

  /** Detach a robot and free its mixer. */
  function detach(handle) {
    if (!handle) return;
    var i = _mixers.indexOf(handle.mixer);
    if (i !== -1) _mixers.splice(i, 1);
    if (handle.root && handle.root.parent) handle.root.parent.remove(handle.root);
    if (handle.root) {
      handle.root.traverse(function (c) {
        if (c.geometry && c.geometry.dispose) c.geometry.dispose();
        if (c.material) {
          var mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach(function (m) { if (m && m.dispose) m.dispose(); });
        }
      });
    }
  }

  // ------------------------------------------------------------------ export

  window.RobotNPCs = {
    MODELS: ROBOT_MODELS,
    DEFAULT_MODEL: DEFAULT_MODEL,
    REF_HEIGHT: REF_HEIGHT,
    attach: attach,
    update: update,
    detach: detach,
    findClip: findClip,
    /** Scale a model would need for a given target height — useful for new art. */
    scaleFor: function (modelKey, targetHeight) {
      var d = ROBOT_MODELS[modelKey || DEFAULT_MODEL];
      if (!d || !d.height) return 1;
      return (targetHeight || REF_HEIGHT) / d.height;
    }
  };

  // Expose alongside NPC_PROFILES for parity with other global modules.
  window.ROBOT_MODELS = ROBOT_MODELS;

})(window);