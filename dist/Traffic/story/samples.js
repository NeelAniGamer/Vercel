/**
 * samples.js — a sample-backed layer over the synthesised audio.
 *
 * WHY THIS EXISTS AT ALL
 *   story/audio.js and traffic-audio.js are entirely SYNTHESISED — every engine
 *   note, horn, footstep and gunshot is generated from oscillators and noise
 *   buffers at runtime. That is genuinely good: it is a few KB, it never 404s,
 *   and it responds continuously to speed and throttle. It is also the reason a
 *   police siren sounds like a sine wave and a crash sounds like filtered static.
 *
 *   This adds recorded audio alongside it. Nothing is replaced. The synthesised
 *   sound stays the default; a sample plays only where a recorded take is
 *   genuinely better and the caller asks for one by name.
 *
 * THE ONE RULE
 *   Every path through this file degrades to silence. A missing file, a missing
 *   AudioContext, an autoplay policy, a decode failure — all return null and are
 *   remembered as unavailable so the next call costs nothing. A missing asset
 *   must never break a cutscene, because a cutscene that throws mid-shot hands
 *   the player back to a frozen frame.
 *
 * WHY A SEPARATE MODULE
 *   traffic-audio.js owns a synthesised engine with a Web Audio graph built once
 *   and modulated per frame. Mixing file playback into that graph means touching
 *   code that runs 60 times a second, in order to serve a sound that plays once.
 *   Keeping samples in their own pool, connected to the same buses, means the
 *   per-frame engine code is not edited at all.
 *
 * Generated assets live in audio/sfx and audio/amb; the key → path mapping is in
 * story/asset_manifest.json, written by scripts/stage_assets.py.
 */
(function () {
  'use strict';

  var MANIFEST_URL = 'story/asset_manifest.json';

  /** key -> { path, loop, gain, note } — filled from the manifest. */
  var manifest = null;
  /** key -> true when the file is known to be absent. Never retried. */
  var dead = {};
  /** key -> HTMLAudioElement, reused across plays. */
  var els = {};
  /** key -> { el, playing } for loops the caller asked to keep running. */
  var loops = {};

  function load(cb) {
    if (manifest) { cb(manifest); return; }
    if (typeof fetch !== 'function') { cb(null); return; }
    fetch(MANIFEST_URL, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { manifest = j || null; cb(manifest); })
      .catch(function () { cb(null); });
  }

  /**
   * Resolve a key to a URL, without fetching anything.
   *
   * The manifest is loaded once and then consulted synchronously, because
   * `sting()` is called from inside the film timeline and cannot wait on a
   * network round-trip without dropping the frame it was cued on.
   */
  function urlFor(key, bucket) {
    if (!manifest || dead[key]) { return null; }
    var set = manifest[bucket || 'sfx'];
    if (!set) { return null; }
    var entry = set[key];
    if (!entry || !entry.path) { return null; }
    return entry;
  }

  function elFor(key, entry) {
    if (els[key]) { return els[key]; }
    try {
      if (typeof Audio === 'undefined') { return null; }
      var a = new Audio(entry.path);
      a.preload = 'auto';
      // Cross-origin without CORP headers will taint and mute; not our bug, but
      // worth silencing rather than logging 27 identical errors.
      a.crossOrigin = 'anonymous';
      a.addEventListener('error', function () { markDead(key, a); });
      els[key] = a;
      return a;
    } catch (e) {
      markDead(key, a);
      return null;
    }
  }

  function resolvedGain(key, entry, opts) {
    var g = (opts && opts.gain != null) ? opts.gain : entry.gain;
    if (g == null) { g = 0.7; }
    return Math.max(0, Math.min(1, g));
  }

  /**
   * Note that a playback attempt failed, WITHOUT poisoning the key.
   *
   * This distinction is the whole point. A rejected `play()` promise means "not
   * right now": the browser's autoplay policy refused us because the user has not
   * interacted yet, or the device has no output. Both are transient. Marking the
   * key dead on that permanently removes a perfectly good sample from the game
   * for the rest of the session — which is exactly what happened during
   * development, where the police siren went permanently silent after being
   * started once before the first click.
   *
   * A key is only marked `dead` when the ELEMENT reports an error, which is the
   * signal that the file itself is missing or undecodable.
   */
  function notePlayFailed(key, el) {
    // Deliberately does NOT set el.__failed. The element stays usable: an
    // autoplay-policy refusal on the first attempt must not silence the sample
    // for the rest of the session, and reusing the same element is what makes a
    // later attempt instant.
    if (loops[key] === el) { delete loops[key]; }
  }

  function markDead(key, el) {
    dead[key] = true;
    if (el) { el.__failed = true; }
    if (loops[key] === el) { delete loops[key]; }
  }

  /**
   * Play a one-shot.
   *
   * RETURN CONTRACT — read this before trusting the return value.
   *   A non-null return means "an element was created and playback was
   *   requested". It does NOT mean audio is coming, and it does not mean the
   *   file exists — decoding is asynchronous, so at the moment of the call the
   *   browser cannot yet know either.
   *
   *   What IS guaranteed is the failure path: an element `error` event (missing
   *   file, undecodable) marks the key dead, so every later call returns null
   *   immediately and a broken asset costs exactly one attempt rather than one
   *   per cue. A rejected `play()` is treated as transient and does NOT kill the
   *   key.
   *
   * @param key    manifest key, e.g. 'sfx_crash_car'
   * @param opts   { gain, rate, bucket }
   * @returns HTMLAudioElement | null
   */
  function play(key, opts) {
    opts = opts || {};
    var entry = urlFor(key, opts.bucket || 'sfx');
    if (!entry) { return null; }
    var a = elFor(key, entry);
    if (!a || a.__failed) { return null; }
    try {
      a.pause();
      // Restarting from zero is the whole point of a one-shot: without it a
      // second impact within the clip's length plays silence.
      a.currentTime = 0;
      a.loop = false;
      a.volume = resolvedGain(key, entry, opts);
      a.playbackRate = (opts.rate && opts.rate > 0) ? opts.rate : 1;
      var p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(null, function () { notePlayFailed(key, a); });
      }
      return a;
    } catch (e) {
      markDead(key, a);
      return null;
    }
  }

  /**
   * Start (or keep) a looping sample.
   *
   * Loops are held in a registry rather than returned to the caller so that
   * `stop()` can be called by a shot cue without the caller having to keep the
   * handle — which is what lets a cutscene declare "siren from shot 7" and
   * "siren off at shot 9" without threading state through the timeline.
   */
  function loop(key, opts) {
    opts = opts || {};
    var existing = loops[key];
    if (existing) {
      try {
        existing.volume = resolvedGain(key, urlFor(key, opts.bucket || 'sfx'), opts);
        return existing;
      } catch (e) { /* fall through and restart */ }
      delete loops[key];
    }
    var entry = urlFor(key, opts.bucket || 'sfx');
    if (!entry) { return null; }
    var a = elFor(key, entry);
    if (!a || a.__failed) { return null; }
    try {
      a.currentTime = 0;
      a.loop = true;
      a.volume = resolvedGain(key, entry, opts);
      var p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(null, function () { notePlayFailed(key, a); });
      }
      loops[key] = a;
      return a;
    } catch (e) {
      markDead(key, a);
      return null;
    }
  }

  /**
   * Stop a looping sample, optionally over a short fade.
   *
   * The fade is real and timer-driven rather than the six-step volume assignment
   * an earlier version used: writing six values of `volume` inside one
   * synchronous block changes the property six times between two frames, so the
   * browser renders exactly one of them and the result is not a fade at all. It
   * is an instant cut, which is what the code appeared to do and did not.
   *
   * `HTMLAudioElement` has no fade method, so this steps it on a short timer.
   */
  function stop(key, fadeMs) {
    var a = loops[key];
    if (!a) { return false; }
    delete loops[key];
    var ms = fadeMs == null ? 200 : Math.max(0, fadeMs);

    if (ms === 0) {
      try { a.pause(); a.currentTime = 0; } catch (e) {}
      return true;
    }

    try {
      var from = a.volume;
      var steps = Math.max(2, Math.round(ms / 30));
      var step = function (i) {
        try {
          a.volume = from * (1 - i / steps);
          if (i >= steps) { a.pause(); a.currentTime = 0; a.volume = from; }
          else { setTimeout(function () { step(i + 1); }, ms / steps); }
        } catch (e) { try { a.pause(); } catch (e2) {} }
      };
      step(1);
    } catch (e) {
      try { a.pause(); } catch (e2) {}
    }
    return true;
  }

  function stopAll() {
    Object.keys(loops).forEach(function (k) { stop(k, 0); });
  }

  /** Duck every running sample — used when dialogue starts, like the synth buses. */
  function duckAll(factor, holdMs) {
    Object.keys(loops).forEach(function (k) {
      try {
        var a = loops[k];
        var target = Math.max(0, a.volume * factor);
        a.volume = target;
        setTimeout(function () { try { a.volume = target / Math.max(0.01, factor); } catch (e) {} },
          holdMs || 1200);
      } catch (e) {}
    });
  }

  window.SampleBank = {
    /** Warm the manifest. Safe to call repeatedly; safe to never call. */
    preload: load,
    play: play,
    loop: loop,
    stop: stop,
    stopAll: stopAll,
    duckAll: duckAll,
    /** True when the key is known-usable. For tests and diagnostics. */
    has: function (key, bucket) { return !!urlFor(key, bucket || 'sfx'); },
    /** Keys that failed to load. For diagnostics; never shown to a player. */
    dead: function () { return Object.keys(dead); },
    /** Test seam: pretend a key is present without a manifest. */
    _setManifest: function (m) { manifest = m; },
  };
})();