/**
 * story/shots.js — the camera engine for Story Mode.
 *
 * THIS FILE OWNS CAMERA MATH AND NOTHING ELSE.
 *
 * The rule the three-file split exists to enforce: a shot's *camera* is code
 * (here), a shot's *camera position* is authored per level (story/campaign.js),
 * and a shot's *words* are authored per level (the same file). Nothing outside
 * this file is allowed to move the camera during a film.
 *
 * WHY IT IS SEPARATE
 *   The first pass kept applyCamera() inside cutscene.js and it grew teeth. A
 *   shot is a camera intent — where it starts, where it ends, what it looks at,
 *   what it looks at later, how it eases, what it frames. That is a different
 *   kind of thing from "is a film running right now". Splitting them means a
 *   writer can retime a crane without touching the player state machine, and
 *   the player state machine can gain mid-level beats without re-litigating
 *   camera maths.
 *
 * HOUSE RULES ENFORCED HERE
 *   - MIN_SHOT is a floor, not a suggestion. Cutting away in under a second is
 *     what made the very first pass read as a slideshow instead as a film, so
 *     every authored duration is clamped up to the floor. See prepare().
 *   - Everything is guarded. A bad shot must never soft-lock a level, so every
 *     vector read, every lookAt and every actor move is wrapped.
 *   - Anchored shots resolve their vectors as OFFSETS from a named set anchor
 *     (e.g. 'home.balcony'), so a shot keeps working if the set's coordinates
 *     ever move. cinematics.js publishes those anchors.
 */
(function () {
  'use strict';

  // ── Shot floor ────────────────────────────────────────────────────────────
  /**
   * No cut shorter than this, in seconds.
   *
   * 4s is not arbitrary: below ~3s the eye registers a slideshow rather than a
   * scene, and a Mumbai street at 1.5s per cut reads as a panic montage. The
   * clamp in prepare() means an over-eager author gets a slower film, never a
   * broken one.
   */
  var MIN_SHOT = 4;

  /** Upper bound on a single shot. Longer than this and a static frame rots. */
  var MAX_SHOT = 12;

  /** Default duration for a shot that declares none. */
  var DEFAULT_SHOT = 6;

  // ── Easing ────────────────────────────────────────────────────────────────
  var EASE = {
    linear: function (t) { return t; },
    inQuad: function (t) { return t * t; },
    outQuad: function (t) { return t * (2 - t); },
    inOutQuad: function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
    outCubic: function (t) { var u = t - 1; return u * u * u + 1; },
    inCubic: function (t) { return t * t * t; },
    outQuint: function (t) { var u = t - 1; return u * u * u * u * u + 1; },
    // Gentle settle used for closing moves — long tail, no bounce.
    cinematic: function (t) { return 1 - Math.pow(1 - t, 3); },
    // Near-linear with a whisper of ease. For locked-off shots that must read
    // as a tripod, not a drone.
    tripod: function (t) { return t * t * (3 - 2 * t); }
  };

  function ease(name, t) {
    var fn = EASE[name] || EASE.inOutQuad;
    return fn(t < 0 ? 0 : (t > 1 ? 1 : t));
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // ── Script preparation ────────────────────────────────────────────────────
  /**
   * Normalise an authored shot list into what the player will actually run.
   *
   * Clamps every duration into [MIN_SHOT, MAX_SHOT], fills in the default, and
   * drops shots with no usable camera intent. Runs once at begin(), so the
   * per-frame hot path never re-derives any of this.
   *
   * @param {Array} script authored shots
   * @returns {Array} normalised shots (same object references, `dur` fixed)
   */
  function prepare(script) {
    var out = [];
    (script || []).forEach(function (s) {
      if (!s) { return; }
      if (!validVec(s.from) && !validVec(s.look)) {
        // A shot with no camera intent and no look target has nothing to say.
        return;
      }
      var d = (typeof s.dur === 'number' && s.dur > 0) ? s.dur : DEFAULT_SHOT;
      if (d < MIN_SHOT) { d = MIN_SHOT; }
      if (d > MAX_SHOT) { d = MAX_SHOT; }
      s.dur = d;
      // A dissolve shorter than a fifth of a second reads as a glitch, not a
      // transition; snap it to a hard cut instead.
      if (s.dissolve != null && s.dissolve < 0.2) { s.transition = 'cut'; s.dissolve = 0; }
      out.push(s);
    });
    return out;
  }

  function validVec(v) {
    return Array.isArray(v) && v.length >= 3 &&
      typeof v[0] === 'number' && typeof v[1] === 'number' && typeof v[2] === 'number';
  }

  /**
   * Resolve a shot vector. With `shot.anchor` set, every vector in the shot is
   * an OFFSET from that named story set; without it the vector is absolute
   * world space.
   */
  function resolveVec(vec, shot, anchors) {
    if (!validVec(vec)) { return null; }
    var b = (shot && shot.anchor && anchors) ? anchors[shot.anchor] : null;
    if (!b || typeof b.x !== 'number') { return [vec[0], vec[1], vec[2]]; }
    return [b.x + (vec[0] || 0), b.y + (vec[1] || 0), b.z + (vec[2] || 0)];
  }

  // ── Camera placement ──────────────────────────────────────────────────────
  /**
   * Place the camera for shot `p` (0..1 through the shot).
   *
   * @param game    the Driving game
   * @param shot    a prepared shot
   * @param p       0..1 progress
   * @param anchors world-space anchors published by cinematics.js
   */
  function applyCamera(game, shot, p, anchors) {
    try {
      if (!game || !game.camera || !shot) { return; }
      var a = anchors || (game._storyAnchors || null);
      var from = resolveVec(shot.from, shot, a);
      var to = resolveVec(shot.to, shot, a) || from;
      var look = resolveVec(shot.look, shot, a);
      if (!from || !look) { return; }

      var e = ease(shot.ease, p);
      game.camera.position.set(
        lerp(from[0], to[0], e),
        lerp(from[1], to[1], e),
        lerp(from[2], to[2], e)
      );

      // `lookTo` racks the attention across the shot without moving the camera —
      // the cheapest way to make a locked-off frame feel alive.
      var lx = look[0], ly = look[1], lz = look[2];
      var lookTo = resolveVec(shot.lookTo, shot, a);
      if (lookTo) {
        lx = lerp(lx, lookTo[0], e);
        ly = lerp(ly, lookTo[1], e);
        lz = lerp(lz, lookTo[2], e);
      }
      game.camera.lookAt(lx, ly, lz);

      if (typeof shot.fov === 'number' && game.camera.fov !== shot.fov) {
        game.camera.fov = shot.fov;
        game.camera.updateProjectionMatrix();
      }
    } catch (e) { /* a bad shot must never break the film */ }
  }

  // ── Actor blocking ────────────────────────────────────────────────────────
  /**
   * Drive per-shot actor blocking.
   *
   * Deterministic: the actor's position is a pure function of the shot's
   * progress, never of accumulated frame time. A family crossing is therefore
   * mid-zebra on exactly the same frame every run, which is what lets a line of
   * dialogue be timed against it.
   */
  function applyMotion(shot, p, ctx) {
    if (!shot || !shot.motion || !ctx || !ctx.actors || !ctx.game) { return; }
    var e = ease(shot.motionEase || 'linear', p);
    shot.motion.forEach(function (m) {
      if (!m) { return; }
      var a = ctx.actors[m.id];
      if (!a || !validVec(m.from) || !validVec(m.to)) { return; }
      try {
        a.position.x = lerp(m.from[0], m.to[0], e);
        a.position.y = lerp(m.from[1], m.to[1], e);
        a.position.z = lerp(m.from[2], m.to[2], e);
        // Face the direction of travel so actors do not moonwalk.
        var dx = m.to[0] - m.from[0], dz = m.to[2] - m.from[2];
        if (dx !== 0 || dz !== 0) { a.rotation.y = Math.atan2(dx, dz); }
        if (typeof ctx.game._animateCharacterWalk === 'function') {
          ctx.game._animateCharacterWalk(a, m.walk ? 1.4 : 0, ctx.dt || 0.016);
        }
      } catch (e) {}
    });
  }

  // ── Camera keep-out ───────────────────────────────────────────────────────
  /**
   * Build the no-build discs for a shot list.
   *
   * Every coordinate the camera passes through becomes a disc the block filler
   * must keep clear, plus samples along the camera→subject sight-line. Sampling
   * the sight-line is the part that matters: shot 1 was a high crane whose own
   * position sat in clear ground while a filler terrace sat squarely between it
   * and the subject, swallowing the establishing shot in one grey slab.
   *
   * Returns an array of {x, z, hw, hd}. Callers pass it to the set builder.
   */
  function keepOutFor(script, anchors) {
    var out = [];
    // A disc has to be wider than the largest thing that can land inside it.
    // Filler terraces are ~13m wide and ~10m deep, so a 9m disc protects the
    // camera's own X/Z but not the building's near face — which is exactly how
    // an establishing crane ends up pointed at a wall six metres behind its own
    // keep-out zone. 14m clears a terrace's full footprint plus the jitter
    // fillBlocks applies to its position.
    var DISC = 14;
    (script || []).forEach(function (shot) {
      if (!shot) { return; }
      var world = function (v) { return resolveVec(v, shot, anchors); };
      ['from', 'to', 'look', 'lookTo'].forEach(function (k) {
        var v = world(shot[k]);
        if (v) { out.push({ x: v[0], z: v[2], hw: DISC, hd: DISC }); }
      });
      var a = world(shot.from);
      var t = world(shot.look || shot.to);
      if (!a || !t) { return; }
      // Sample the whole camera→subject sight-line, not just the endpoints. A
      // high crane's own position sits in clear ground while a building sits
      // squarely between it and the subject; sampling fixes that class of
      // occlusion without hand-tuning every shot.
      var SAMPLES = 17;
      for (var i = 1; i < SAMPLES; i++) {
        var f = i / SAMPLES;
        out.push({
          x: a[0] + (t[0] - a[0]) * f,
          z: a[2] + (t[2] - a[2]) * f,
          hw: DISC, hd: DISC
        });
      }
    });
    return out;
  }

  window.Shots = {
    MIN_SHOT: MIN_SHOT,
    MAX_SHOT: MAX_SHOT,
    DEFAULT_SHOT: DEFAULT_SHOT,
    EASE: EASE,
    ease: ease,
    lerp: lerp,
    validVec: validVec,
    prepare: prepare,
    resolveVec: resolveVec,
    applyCamera: applyCamera,
    applyMotion: applyMotion,
    keepOutFor: keepOutFor
  };
})();