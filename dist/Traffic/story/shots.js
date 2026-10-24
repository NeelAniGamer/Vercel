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
 *   - A shot has TWO clocks: a camera MOVE and a trailing HOLD. Cutting away in
 *     under a second is what made the very first pass read as a slideshow rather
 *     than a film, so the move is clamped up to MIN_MOVE and down to MAX_SHOT.
 *     Silence after the last line is a separate, authored thing — `hold` — because
 *     a film that can only pause BEFORE a line has no aftermath, and no aftermath
 *     is why nothing lands. See prepare().
 *   - Timed one-shots (flash, stings, sayThen) read the shot's TOTAL progress;
 *     the camera reads MOVE progress. So an event still fires at the fraction of
 *     the frame the author wrote, while the camera has already come to rest.
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

  /** Upper bound on a single shot's camera MOVE. Longer than this and a moving
   *  frame rots. A shot may still run longer than this via `hold` — see below. */
  var MAX_SHOT = 12;

  /**
   * Longest trailing hold a single shot may carry.
   *
   * The reference pacing (scripts/analyze_ref.py, 12 transcripts) has a 7s median
   * silence and a 13.6s worst case. 10s is set just under the worst case seen, so
   * an authored film can reach the depth the reference actually uses without any
   * single frame outstaying its welcome.
   */
  var MAX_HOLD = 10;

  /** Shortest camera move. Below this the shot is a still, and a still with no
   *  move intent should be written with `from === to` on purpose instead. */
  var MIN_MOVE = 2;

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
   * Splits each shot's `dur` into a camera MOVE and a trailing `hold`, then
   * clamps the move into [MIN_MOVE, MAX_SHOT] and the hold into [0, MAX_HOLD].
   * Runs once at begin(), so the per-frame hot path never re-derives any of it.
   *
   * WHY TWO CLOCKS AND NOT ONE
   *   A shot's `dur` is how long the cut is on screen. `hold` is how much of that
   *   is spent AFTER the camera has come to rest. These are different things and
   *   conflating them is the single biggest reason an authored film reads as a
   *   slideshow: without `hold`, silence can only exist before a line, so every
   *   pause in the film is leading-in rather than aftermath, and nothing ever
   *   lands and then sits there.
   *
   *   `_moveFrac` is precomputed here precisely so tick() can divide by it every
   *   frame without doing any parsing or clamping in the hot path.
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

      // `dur` is the TOTAL on-screen time, and it is deliberately NOT clamped to
      // MAX_SHOT: a 12s move followed by a 5s hold is a 17s shot, which is a
      // legitimate authored beat. What is clamped is the move.
      var total = (typeof s.dur === 'number' && s.dur > 0) ? s.dur : DEFAULT_SHOT;

      // The shot floor. The comment above promises "no cut shorter than 4s"
      // and the build-time validator checks it, but the RUNTIME never applied
      // it: a shot authored with dur 1.5 ran as a 1.5s cut, which is exactly
      // the slideshow pacing this constant exists to prevent.
      if (total < MIN_SHOT) { total = MIN_SHOT; }

      var hold = (typeof s.hold === 'number' && s.hold > 0) ? s.hold : 0;
      if (hold > MAX_HOLD) { hold = MAX_HOLD; }

      var move = total - hold;
      if (move < MIN_MOVE) {
        // Asking for more hold than the shot has room for. The move yields, down
        // to a floor: better a 2s drift than a frame that appears already stopped.
        move = Math.min(MIN_MOVE, total);
        hold = total - move;
      } else if (move > MAX_SHOT) {
        move = MAX_SHOT;
        hold = Math.min(MAX_HOLD, total - MAX_SHOT);
      }
      if (hold < 0) { hold = 0; }

      s.dur = total;
      s._move = move;
      s._hold = hold;
      s._moveFrac = total > 0 ? move / total : 1;

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

      // Ease the MOVE progress, not the shot progress. tick() has already scaled p by
      // `_moveFrac`, so by the time p reaches 1 the move is over and `e` is 1 —
      // which makes lerp() return `to` exactly and the camera genuinely stationary
      // for the remainder of the shot.
      var e = ease(shot.ease, p);
      var posX = lerp(from[0], to[0], e);
      var posY = lerp(from[1], to[1], e);
      var posZ = lerp(from[2], to[2], e);

      // Subtle handheld breathing drift so the camera feels like physical
      // cinematic gear.
      //
      // Ramp it OUT across the last stretch of the move. This was previously a
      // constant ±16mm wobble for the entire shot, which meant a held shot was
      // never actually still: `hold` stopped the move, and the drift immediately
      // put the camera back in motion, so the hold read as "drifting" rather than
      // "at rest". A hold is the one moment in a film where the frame is genuinely
      // still, and the stillness is what makes it legible as a beat.
      //
      // Fade window is the last 15% of the move, so the wobble is at full
      // amplitude while travelling and gone by the time the camera settles.
      if (!shot.locked) {
        var tNow = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.0014;
        var settle = p > 0.85 ? (1 - p) / 0.15 : 1;
        if (settle > 0) {
          posX += Math.sin(tNow * 1.6) * 0.016 * settle;
          posY += Math.cos(tNow * 1.9) * 0.012 * settle;
        }
      }

      game.camera.position.set(posX, posY, posZ);

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
        if (a.userData && typeof a.userData.setMoving === 'function') {
          a.userData.setMoving(!!m.walk, false);
        }
        if (a.userData && typeof a.userData.update === 'function') {
          a.userData.update(ctx.dt || 0.016, m.walk ? 1.4 : 0);
        } else if (typeof ctx.game._animateCharacterWalk === 'function') {
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
    // Protect camera positions so the lens never lands inside or against a wall.
    // 4.5m clears the camera's immediate radius without clearing out entire city blocks.
    var CAM_DISC = 4.5;
    var LINE_DISC = 3.5;
    (script || []).forEach(function (shot) {
      if (!shot) { return; }
      var world = function (v) { return resolveVec(v, shot, anchors); };
      ['from', 'to'].forEach(function (k) {
        var v = world(shot[k]);
        if (v) { out.push({ x: v[0], z: v[2], hw: CAM_DISC, hd: CAM_DISC }); }
      });
      var a = world(shot.from);
      var t = world(shot.look || shot.to);
      if (!a || !t) { return; }
      // Sample the camera->subject sight-line with a corridor so filler buildings
      // never occlude the view down to the street or action on any camera angle.
      var SAMPLES = 10;
      for (var i = 1; i < SAMPLES; i++) {
        var f = i / SAMPLES;
        out.push({
          x: a[0] + (t[0] - a[0]) * f,
          z: a[2] + (t[2] - a[2]) * f,
          hw: LINE_DISC, hd: LINE_DISC
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