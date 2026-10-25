/**
 * story/audio.js — the sound of a film.
 *
 * WHY THIS FILE EXISTS
 *   A 47-second scene with no sound is a slideshow. The rain has no hiss, the
 *   shot has no crack, the man in the car has no voice — and the result reads as
 *   unfinished no matter how well the cameras are placed. Sound is not polish on
 *   top of a cutscene; it is most of what makes a cutscene a scene.
 *
 *   Everything here is SYNTHESISED at runtime. There are no audio assets to ship,
 *   which matters because the project has no asset budget for 53 lessons of film.
 *
 *   - VOICE      : the Web Speech API. Real spoken dialogue with per-character
 *                  pitch and rate, no files, works offline. This is the single
 *                  highest-value thing in the file: it is the difference between
 *                  a man talking and a caption appearing.
 *   - AMBIENCE   : filtered noise beds — rain, engine hum, room tone. Loops
 *                  generated once into an AudioBuffer and re-filtered.
 *   - STINGERS   : one-shot impacts. A gunshot is noise through a fast-decaying
 *                  lowpass plus a pitched-down thump; it does not need a sample.
 *   - DUCKING    : the world bed drops while anyone speaks, so the voice is
 *                  intelligible without the player touching a mixer.
 *
 * HOUSE RULES
 *   - Nothing throws into the film. Audio init fails on locked-down browsers and
 *     on autoplay policy; every entry point is guarded and silent is a valid
 *     state. A cutscene must never fail because a speaker list was empty.
 *   - The voice is CANCELED, not queued. Two lines overlapping is worse than one
 *     line late.
 *   - Radio voices get a bandpass. That single filter is what makes a shouted
 *     line read as coming out of a handset rather than out of a laptop.
 */
(function () {
  'use strict';

  var ctx = null;
  var master = null;      // film-wide gain
  var world = null;       // ambience bed
  var voice = null;       // speech path gain (pre-SpeechSynthesis)
  var beds = {};          // active looping beds by name
  var unlocked = false;

  // Per-shot "has this cue already fired" guards, keyed by the shot object.
  //
  // These used to be a single `shot.__fired` string written onto the AUTHORED
  // shot object, which was wrong twice over:
  //   - one slot served three cue kinds (stingAt / sampleAt / sayThen), so a
  //     shot carrying two of them kept re-arming each other and BOTH cues
  //     re-fired every frame for the rest of the shot;
  //   - the guard lived on the campaign data, which every replay of the film
  //     shares, so the second and later plays lost their cues entirely.
  // A WeakMap keeps the state off the shared data and out of the way of
  // garbage collection; the guard for a shot is dropped when the shot is
  // entered, so a replay fires the same cues again.
  var cueFired = new WeakMap();

  // ── Voice casting ─────────────────────────────────────────────────────────
  //
  // Matched against the speaker string in a shot's subtitle, most specific
  // first. `pitch`/`rate` are what separate a man from a boy from a radio; there
  // is no other way to tell them apart when the art is boxes.
  var VOICES = [
    { re: /vikram|sawant/i,          pitch: 0.78, rate: 0.94, name: 'en-IN' },
    { re: /kadam|arjun|insp/i,       pitch: 0.92, rate: 1.0,  name: 'en-IN' },
    { re: /pawar/i,                   pitch: 1.12, rate: 1.04, name: 'en-IN' },
    { re: /iyer|elderly|mummy|begum/i, pitch: 1.28, rate: 0.86, name: 'en-IN' },
    { re: /desai|havildar|constable|police|officer/i, pitch: 0.88, rate: 1.06, name: 'en-IN' },
    { re: /salim|ansh|taxi/i,         pitch: 1.02, rate: 1.12, name: 'en-IN' },
    { re: /aarush|biker|rider/i,      pitch: 1.18, rate: 1.1,  name: 'en-IN' },
    { re: /driver|fortuner|passenger/i, pitch: 0.7, rate: 0.9, name: 'en-IN' }
  ];
  var DEFAULT_VOICE = { pitch: 1.0, rate: 1.0, name: 'en-IN' };

  function voiceFor(speaker) {
    var s = String(speaker || '');
    for (var i = 0; i < VOICES.length; i++) {
      if (VOICES[i].re.test(s)) { return VOICES[i]; }
    }
    return DEFAULT_VOICE;
  }

  // ── Context ────────────────────────────────────────────────────────────────
  function ensure() {
    if (ctx) { return ctx; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { return null; }
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      world = ctx.createGain();
      world.gain.value = 0.0;
      world.connect(master);
      voice = ctx.createGain();
      voice.gain.value = 1.0;
      voice.connect(master);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  /**
   * Browsers refuse to start audio until the user has interacted with the page.
   * Called from the first pointerdown/keydown anywhere; harmless if already
   * unlocked.
   */
  function unlock() {
    if (unlocked) { return; }
    var c = ensure();
    if (!c) { return; }
    unlocked = true;
    try { if (c.state === 'suspended') { c.resume(); } } catch (e) {}
    try {
      // Some engines also gate SpeechSynthesis behind a resume().
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e2) {}
  }

  function ready() { return !!ensure(); }

  // ── Noise beds ─────────────────────────────────────────────────────────────
  /**
   * One reusable buffer of pink-ish noise. Generating it per bed would allocate
   * megabytes per film; generating it once and filtering differently per bed is
   * both cheaper and sounds better (identical noise floor under everything).
   */
  var noiseBuf = null;
  function noise() {
    if (noiseBuf) { return noiseBuf; }
    var c = ensure();
    if (!c) { return null; }
    var len = Math.floor(c.sampleRate * 3);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    // Two-pole lowpassed white ≈ pink. Cheaper than a real pink filter and
    // indistinguishable as a rain bed.
    var b0 = 0.99765, b1 = 0.963, b2 = -0.57000;
    var x1 = 0, x2 = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      d[i] = (b0 * x1 + b1 * x2 + w * 0.1848) * 0.4;
      x2 = x1; x1 = d[i];
    }
    noiseBuf = buf;
    return noiseBuf;
  }

  /**
   * Start (or retune) a looping ambience bed.
   * @param name    'rain' | 'engine' | 'room' | 'river'
   * @param gain    0..1
   * @param filter  { type, freq, q } — defaults per bed
   */
  function bed(name, gain, filter) {
    var c = ensure();
    if (!c) { return null; }
    stop(name);
    var buf = noise();
    if (!buf) { return null; }

    var src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    var flt = c.createBiquadFilter();
    var defaults = {
      rain:   { type: 'lowpass',  freq: 360, q: 0.35 },
      engine: { type: 'lowpass',  freq: 180, q: 1.0 },
      room:   { type: 'lowpass',  freq: 90,  q: 0.5 },
      river:  { type: 'bandpass', freq: 420, q: 0.4 }
    };
    var f = filter || defaults[name] || defaults.room;
    try {
      flt.type = f.type; flt.frequency.value = f.freq; flt.Q.value = f.q;
    } catch (e) {}

    var g = c.createGain();
    g.gain.value = 0;

    // Gentle ambient beds, never loud radio static
    if (name === 'rain') {
      gain = Math.min(gain, 0.05);
    } else if (name === 'room') {
      gain = Math.min(gain, 0.015);
    } else if (name === 'engine') {
      gain = Math.min(gain, 0.06);
    } else if (name === 'birds') {
      // Daytime outdoor air: synthesised chirps, not filtered noise (noise
      // cannot chirp). This bed owns a chirp timer instead of a looped buffer;
      // stop() tears it down via the birds flag below.
      gain = Math.min(gain, 0.05);
      startBirds(Math.max(0, gain));
      beds[name] = { birds: true };
      return beds[name];
    }

    src.connect(flt); flt.connect(g); g.connect(world);
    try { src.start(); } catch (e2) {}
    // Ramp in rather than switching on: a bed that appears at full level is a
    // click, and a click at the top of a cutscene reads as a glitch.
    g.gain.setTargetAtTime(gain, c.currentTime, 0.35);
    beds[name] = { src: src, gain: g };
    return beds[name];
  }

  // ── Daytime birds ────────────────────────────────────────────────────────
  // Synthesised chirps for day/dawn shots: 2-4 syllable phrases from a sine
  // osc with a fast up-down sweep each, scheduled 0.5-2.2s apart with a random
  // pan so the air feels wide rather than centred. Everything is guarded and
  // timer-driven; stopBirds() kills the chain, and a chirp already in flight
  // is 0.15s long so it dies on its own. Silent is always a valid state.
  var birdTimer = 0;
  var birdLevel = 0.04;

  function birdChirp(t0, baseFreq, nSyl, pan) {
    var c = ensure();
    if (!c || !world) { return; }
    try {
      var usePan = null;
      try {
        if (typeof c.createStereoPanner === 'function') {
          usePan = c.createStereoPanner();
          usePan.pan.value = Math.max(-0.8, Math.min(0.8, pan || 0));
          usePan.connect(world);
        }
      } catch (eP) { usePan = null; }
      var out = usePan || world;
      for (var i = 0; i < nSyl; i++) {
        (function (k) {
          var o = c.createOscillator();
          o.type = 'sine';
          var g = c.createGain();
          var st = t0 + k * 0.14;
          var f = baseFreq * (0.9 + Math.random() * 0.35);
          o.frequency.setValueAtTime(Math.max(400, f * 0.9), st);
          o.frequency.exponentialRampToValueAtTime(f * 1.35, st + 0.05);
          o.frequency.exponentialRampToValueAtTime(Math.max(400, f * 0.85), st + 0.11);
          g.gain.setValueAtTime(0.0001, st);
          g.gain.exponentialRampToValueAtTime(Math.max(0.001, birdLevel), st + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, st + 0.12);
          o.connect(g); g.connect(out);
          try { o.start(st); o.stop(st + 0.15); } catch (eS) {}
        })(i);
      }
    } catch (e) {}
  }

  function birdTick() {
    birdTimer = 0;
    try {
      var c = ensure();
      if (c && c.state === 'running' && Math.random() < 0.7) {
        birdChirp(c.currentTime + 0.05,
          2200 + Math.random() * 1400,
          2 + Math.floor(Math.random() * 3),
          Math.random() * 2 - 1);
      }
    } catch (e) {}
    try {
      birdTimer = setTimeout(birdTick, 500 + Math.random() * 1700);
    } catch (e2) { birdTimer = 0; }
  }

  function startBirds(gain) {
    birdLevel = Math.max(0.001, Math.min(0.05, gain == null ? 0.04 : gain));
    ensure();
    if (birdTimer) { return; }
    try { birdTick(); } catch (e) {}
  }

  function stopBirds() {
    try { if (birdTimer) { clearTimeout(birdTimer); } } catch (e) {}
    birdTimer = 0;
  }

  function stop(name) {
    var b = beds[name];
    if (!b) { return; }
    delete beds[name];
    if (b.birds) { try { stopBirds(); } catch (eB) {} return; }
    try {
      var c = ensure();
      if (c) { b.gain.gain.setTargetAtTime(0, c.currentTime, 0.2); }
    } catch (e) {}
    try { setTimeout(function () { b.src.stop(); }, 400); } catch (e2) {}
  }

  function stopAll() {
    Object.keys(beds).forEach(stop);
    stopVoice();
  }

  // ── One-shot stingers ──────────────────────────────────────────────────────
  /**
   * Impact / foley hits. Synthesised, because the alternative is an asset per
   * sound and there are 53 lessons.
   *
   *   shot    — the gunshot: broadband noise on a fast-decaying lowpass plus a
   *             pitched thump. The gap between the two is what makes it read as a
   *             gun and not as a door slamming.
   *   ping    — a bolt or a metal tap: two detuned partials with a long decay.
   *   click   — a UI-ish tick, used for radio squelch.
   *   squelch — a radio channel opening: a short two-tone beep under bandpassed
   *             noise, so a speaker change is heard as well as seen.
   *   wiper   — the blade sweep: a bandpassed noise swell that rises and falls,
   *             shaped like the arm crossing the frame.
   *   splash  — water: filtered noise with a rising then falling cutoff.
   *   tyre    — a tyre chirp on a wet surface: short, bright, with a fast decay.
   *   siren   — a distant two-tone siren, deliberately dulled and detuned so it
   *             sits UNDER the scene instead of on top of it.
   *   thud    — a body hitting tarmac: a low sine drop plus a short body noise.
   *   page    — paper: a very short highpassed noise crack.
   */
  function sting(kind, gain) {
    var c = ensure();
    if (!c) { return; }
    var g = gain == null ? 1 : gain;
    var t = c.currentTime;

    if (kind === 'shot') {
      var n = c.createBufferSource();
      n.buffer = noise();
      var lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(6000, t);
      lp.frequency.exponentialRampToValueAtTime(300, t + 0.35);
      var ng = c.createGain();
      ng.gain.setValueAtTime(0.9 * g, t);
      ng.gain.exponentialRampToValueAtTime(0.0008, t + 0.4);
      n.connect(lp); lp.connect(ng); ng.connect(world);
      try { n.start(t); n.stop(t + 0.45); } catch (e) {}

      var o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(35, t + 0.25);
      var og = c.createGain();
      og.gain.setValueAtTime(0.8 * g, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(og); og.connect(world);
      try { o.start(t); o.stop(t + 0.32); } catch (e2) {}
      return;
    }

    if (kind === 'ping') {
      [1, 1.51].forEach(function (mult, i) {
        var o = c.createOscillator();
        o.type = 'triangle';
        o.frequency.value = 880 * mult;
        var gg = c.createGain();
        gg.gain.setValueAtTime(0.0001, t);
        gg.gain.exponentialRampToValueAtTime(0.28 * g / (i + 1), t + 0.005);
        gg.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        o.connect(gg); gg.connect(world);
        try { o.start(t); o.stop(t + 1.15); } catch (e3) {}
      });
      return;
    }

    if (kind === 'click' || kind === 'squelch') {
      var beep = c.createOscillator();
      beep.type = 'sine';
      if (kind === 'squelch') {
        beep.frequency.setValueAtTime(640, t);
        beep.frequency.setValueAtTime(960, t + 0.025);
      } else {
        beep.frequency.setValueAtTime(1200, t);
      }
      var bg = c.createGain();
      bg.gain.setValueAtTime(0.04 * g, t);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'squelch' ? 0.05 : 0.02));
      beep.connect(bg); bg.connect(world);
      try { beep.start(t); beep.stop(t + 0.06); } catch (eB) {}
      return;
    }

    if (kind === 'wiper') {
      var wn = c.createBufferSource();
      wn.buffer = noise();
      var wbp = c.createBiquadFilter();
      wbp.type = 'bandpass'; wbp.frequency.value = 850; wbp.Q.value = 2.2;
      var wg = c.createGain();
      wg.gain.setValueAtTime(0.001, t);
      wg.gain.exponentialRampToValueAtTime(0.25 * g, t + 0.14);
      wg.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      wn.connect(wbp); wbp.connect(wg); wg.connect(world);
      try { wn.start(t); wn.stop(t + 0.45); } catch (ew) {}
      return;
    }

    if (kind === 'tyre') {
      // Wet rubber: bright, short, and it chirps rather than roars. The upward
      // filter sweep is the difference between a tyre on tarmac and a tyre on a
      // gravel road.
      var tn = c.createBufferSource();
      tn.buffer = noise();
      var tfp = c.createBiquadFilter();
      tfp.type = 'bandpass'; tfp.Q.value = 3.5;
      tfp.frequency.setValueAtTime(1400, t);
      tfp.frequency.exponentialRampToValueAtTime(3000, t + 0.12);
      var tg = c.createGain();
      tg.gain.setValueAtTime(0.0001, t);
      tg.gain.exponentialRampToValueAtTime(0.3 * g, t + 0.02);
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      tn.connect(tfp); tfp.connect(tg); tg.connect(world);
      try { tn.start(t); tn.stop(t + 0.35); } catch (et) {}
      return;
    }

    if (kind === 'siren') {
      // Two wails, 0.9s apart, rolled off hard. A clean siren is the fastest way
      // to make a film sound like a video game; the lowpass is what puts it back
      // several streets away.
      var wail = function (at) {
        var o = c.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(620, at);
        o.frequency.linearRampToValueAtTime(880, at + 0.45);
        o.frequency.linearRampToValueAtTime(640, at + 0.9);
        var og = c.createGain();
        og.gain.setValueAtTime(0.0001, at);
        og.gain.linearRampToValueAtTime(0.09 * g, at + 0.12);
        og.gain.linearRampToValueAtTime(0.0001, at + 0.92);
        var lp = c.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 1500;
        o.connect(og); og.connect(lp); lp.connect(world);
        try { o.start(at); o.stop(at + 0.95); } catch (es) {}
      };
      wail(t);
      wail(t + 0.95);
      return;
    }

    if (kind === 'thud') {
      // A body on tarmac: the pitch drop does the weight, the noise does the
      // contact. Without the low component it reads as a dropped bag.
      var to = c.createOscillator();
      to.type = 'sine';
      to.frequency.setValueAtTime(120, t);
      to.frequency.exponentialRampToValueAtTime(38, t + 0.28);
      var tog = c.createGain();
      tog.gain.setValueAtTime(0.75 * g, t);
      tog.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      to.connect(tog); tog.connect(world);
      try { to.start(t); to.stop(t + 0.36); } catch (eto) {}

      var bn = c.createBufferSource();
      bn.buffer = noise();
      var blp = c.createBiquadFilter();
      blp.type = 'lowpass';
      blp.frequency.setValueAtTime(1400, t);
      blp.frequency.exponentialRampToValueAtTime(200, t + 0.2);
      var bg2 = c.createGain();
      bg2.gain.setValueAtTime(0.34 * g, t);
      bg2.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      bn.connect(blp); blp.connect(bg2); bg2.connect(world);
      try { bn.start(t); bn.stop(t + 0.28); } catch (ebn) {}
      return;
    }

    if (kind === 'page') {
      // Paper: one very short highpassed crack. Deliberately tiny — paper played
      // at any real volume is the single most obvious synthetic sound in a film.
      var pn = c.createBufferSource();
      pn.buffer = noise();
      var php = c.createBiquadFilter();
      php.type = 'highpass'; php.frequency.value = 2600;
      var pg = c.createGain();
      pg.gain.setValueAtTime(0.20 * g, t);
      pg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      pn.connect(php); php.connect(pg); pg.connect(world);
      try { pn.start(t); pn.stop(t + 0.12); } catch (ep) {}
      return;
    }

    if (kind === 'splash') {
      var sp = c.createBufferSource();
      sp.buffer = noise();
      var hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(400, t);
      hp.frequency.exponentialRampToValueAtTime(3000, t + 0.2);
      var spg = c.createGain();
      spg.gain.setValueAtTime(0.0001, t);
      spg.gain.exponentialRampToValueAtTime(0.35 * g, t + 0.04);
      spg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      sp.connect(hp); hp.connect(spg); spg.connect(world);
      try { sp.start(t); sp.stop(t + 0.55); } catch (e5) {}
      return;
    }

    // ── Next-Gen Cinematic Noir Sound Design ─────────────────────────────────
    if (kind === 'tension') {
      // Ominous sub-bass drone with resonant filter sweep (inspired by Sacred Games / Sicario)
      var tOsc1 = c.createOscillator();
      var tOsc2 = c.createOscillator();
      tOsc1.type = 'sine';
      tOsc2.type = 'triangle';
      tOsc1.frequency.setValueAtTime(46, t);
      tOsc2.frequency.setValueAtTime(49.5, t); // slight beating/pulse
      tOsc1.frequency.exponentialRampToValueAtTime(62, t + 2.8);
      tOsc2.frequency.exponentialRampToValueAtTime(65, t + 2.8);

      var tFilter = c.createBiquadFilter();
      tFilter.type = 'lowpass';
      tFilter.Q.value = 2.5;
      tFilter.frequency.setValueAtTime(80, t);
      tFilter.frequency.exponentialRampToValueAtTime(260, t + 2.5);

      var tGain = c.createGain();
      tGain.gain.setValueAtTime(0.0001, t);
      tGain.gain.exponentialRampToValueAtTime(0.55 * g, t + 1.2);
      tGain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

      tOsc1.connect(tFilter);
      tOsc2.connect(tFilter);
      tFilter.connect(tGain);
      tGain.connect(world);
      try {
        tOsc1.start(t); tOsc1.stop(t + 3.3);
        tOsc2.start(t); tOsc2.stop(t + 3.3);
      } catch (eTens) {}
      return;
    }

    if (kind === 'cock_gun') {
      // Mechanical slide rack / hammer cock: double metallic snap with acoustic body
      [0, 0.075].forEach(function (off, idx) {
        var ct = t + off;
        var cn = c.createBufferSource();
        cn.buffer = noise();
        var chp = c.createBiquadFilter();
        chp.type = 'bandpass';
        chp.frequency.value = idx === 0 ? 3200 : 4200;
        chp.Q.value = 4.0;
        var cg = c.createGain();
        cg.gain.setValueAtTime(0.0001, ct);
        cg.gain.exponentialRampToValueAtTime((idx === 0 ? 0.35 : 0.55) * g, ct + 0.012);
        cg.gain.exponentialRampToValueAtTime(0.0001, ct + 0.065);
        cn.connect(chp); chp.connect(cg); cg.connect(world);

        var cMetal = c.createOscillator();
        cMetal.type = 'triangle';
        cMetal.frequency.setValueAtTime(idx === 0 ? 1850 : 2600, ct);
        var cmg = c.createGain();
        cmg.gain.setValueAtTime(0.0001, ct);
        cmg.gain.exponentialRampToValueAtTime(0.20 * g, ct + 0.008);
        cmg.gain.exponentialRampToValueAtTime(0.0001, ct + 0.07);
        cMetal.connect(cmg); cmg.connect(world);

        try {
          cn.start(ct); cn.stop(ct + 0.08);
          cMetal.start(ct); cMetal.stop(ct + 0.08);
        } catch (eCg) {}
      });
      return;
    }

    if (kind === 'radio_call') {
      // Authentic Mumbai Police wireless beep + channel squelch burst
      var rBeep = c.createOscillator();
      rBeep.type = 'sine';
      rBeep.frequency.setValueAtTime(1180, t);
      rBeep.frequency.setValueAtTime(1750, t + 0.035);
      var rbg = c.createGain();
      rbg.gain.setValueAtTime(0.0001, t);
      rbg.gain.exponentialRampToValueAtTime(0.09 * g, t + 0.008);
      rbg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      rBeep.connect(rbg); rbg.connect(world);

      var rNoise = c.createBufferSource();
      rNoise.buffer = noise();
      var rbp = c.createBiquadFilter();
      rbp.type = 'bandpass'; rbp.frequency.value = 1800; rbp.Q.value = 2.0;
      var rng = c.createGain();
      rng.gain.setValueAtTime(0.0001, t + 0.03);
      rng.gain.exponentialRampToValueAtTime(0.12 * g, t + 0.05);
      rng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      rNoise.connect(rbp); rbp.connect(rng); rng.connect(world);

      try {
        rBeep.start(t); rBeep.stop(t + 0.08);
        rNoise.start(t + 0.03); rNoise.stop(t + 0.18);
      } catch (eRad) {}
      return;
    }

    if (kind === 'engine_roar') {
      // Powerful throaty V8 acceleration surge with low exhaust bark
      var rOsc = c.createOscillator();
      rOsc.type = 'sawtooth';
      rOsc.frequency.setValueAtTime(52, t);
      rOsc.frequency.exponentialRampToValueAtTime(140, t + 0.8);
      rOsc.frequency.exponentialRampToValueAtTime(85, t + 1.8);

      var rlp = c.createBiquadFilter();
      rlp.type = 'lowpass';
      rlp.frequency.setValueAtTime(220, t);
      rlp.frequency.exponentialRampToValueAtTime(950, t + 0.7);
      rlp.frequency.exponentialRampToValueAtTime(320, t + 1.8);

      var rg = c.createGain();
      rg.gain.setValueAtTime(0.001, t);
      rg.gain.exponentialRampToValueAtTime(0.65 * g, t + 0.25);
      rg.gain.exponentialRampToValueAtTime(0.001, t + 1.9);

      rOsc.connect(rlp); rlp.connect(rg); rg.connect(world);
      try { rOsc.start(t); rOsc.stop(t + 2.0); } catch (eRoar) {}
      return;
    }

    if (kind === 'transition_whoosh') {
      // Atmospheric time-jump chord swell (dawn transition into Shanti Galli)
      var freqs = [174.61, 220.00, 261.63, 349.23]; // F-major cinematic triad
      freqs.forEach(function (fr, idx) {
        var o = c.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(fr, t);
        var og = c.createGain();
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime((0.18 / (idx + 1)) * g, t + 0.5);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
        o.connect(og); og.connect(world);
        try { o.start(t); o.stop(t + 2.5); } catch (eWhoo) {}
      });

      // Air rush sweep
      var wn = c.createBufferSource();
      wn.buffer = noise();
      var wbp = c.createBiquadFilter();
      wbp.type = 'bandpass';
      wbp.frequency.setValueAtTime(220, t);
      wbp.frequency.exponentialRampToValueAtTime(1200, t + 0.6);
      wbp.frequency.exponentialRampToValueAtTime(300, t + 1.8);
      wbp.Q.value = 1.6;
      var wg = c.createGain();
      wg.gain.setValueAtTime(0.0001, t);
      wg.gain.exponentialRampToValueAtTime(0.22 * g, t + 0.4);
      wg.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
      wn.connect(wbp); wbp.connect(wg); wg.connect(world);
      try { wn.start(t); wn.stop(t + 2.0); } catch (eWn) {}
      return;
    }

    if (kind === 'whistle') {
      // Authentic Mumbai Traffic Police pea-whistle sharp trill (2620Hz / 2890Hz with 18Hz flutter)
      var wOsc1 = c.createOscillator();
      var wOsc2 = c.createOscillator();
      var lfo = c.createOscillator();
      var lfoGain = c.createGain();

      wOsc1.type = 'triangle';
      wOsc2.type = 'sine';
      wOsc1.frequency.setValueAtTime(2620, t);
      wOsc2.frequency.setValueAtTime(2890, t);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(18, t);
      lfoGain.gain.setValueAtTime(95, t);
      lfo.connect(wOsc1.frequency);
      lfo.connect(wOsc2.frequency);

      var wGain = c.createGain();
      wGain.gain.setValueAtTime(0.0001, t);
      wGain.gain.linearRampToValueAtTime(0.26 * g, t + 0.035);
      wGain.gain.setValueAtTime(0.26 * g, t + 0.30);
      wGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      wOsc1.connect(wGain);
      wOsc2.connect(wGain);
      wGain.connect(world);

      try {
        lfo.start(t); lfo.stop(t + 0.46);
        wOsc1.start(t); wOsc1.stop(t + 0.46);
        wOsc2.start(t); wOsc2.stop(t + 0.46);
      } catch (eWh) {}
      return;
    }

    if (kind === 'car_unlock') {
      // Remote keyfob double-chirp + central locking solenoid thud
      [0, 0.08].forEach(function (off) {
        var chirp = c.createOscillator();
        chirp.type = 'sine';
        chirp.frequency.setValueAtTime(2350, t + off);
        chirp.frequency.exponentialRampToValueAtTime(2650, t + off + 0.025);
        var cg = c.createGain();
        cg.gain.setValueAtTime(0.0001, t + off);
        cg.gain.exponentialRampToValueAtTime(0.14 * g, t + off + 0.005);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.035);
        chirp.connect(cg); cg.connect(world);
        try { chirp.start(t + off); chirp.stop(t + off + 0.04); } catch (eCh) {}
      });

      // Mechanical latch solenoid
      var sol = c.createOscillator();
      sol.type = 'triangle';
      sol.frequency.setValueAtTime(140, t + 0.05);
      sol.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      var sg = c.createGain();
      sg.gain.setValueAtTime(0.0001, t + 0.05);
      sg.gain.exponentialRampToValueAtTime(0.35 * g, t + 0.065);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      sol.connect(sg); sg.connect(world);
      try { sol.start(t + 0.05); sol.stop(t + 0.16); } catch (eSol) {}
      return;
    }
  }

  // ── Voice ──────────────────────────────────────────────────────────────────
  var currentUtterance = null;
  var cachedVoiceList = [];

  function getVoices() {
    try {
      if (window.speechSynthesis) {
        var v = window.speechSynthesis.getVoices();
        if (v && v.length) { cachedVoiceList = v; }
      }
    } catch (e) {}
    return cachedVoiceList;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = function () {
        getVoices();
      };
    }
  }

  // Authentic Hindi/Bambaiya spoken line representations:
  // - hi: authentic Devanagari script for native Hindi TTS voices (hi-IN)
  // - enPhonetic: phonetically tuned Roman script for English/Indian-English TTS (en-IN / en-US)
  //   preventing comical mispronunciations (e.g. "pe" -> "pee", "thi" -> "thigh", "do" -> "doo", "bas" -> "bass")
  var HINDI_LINES = {
    'Aye Hawaldar. VIP movement hai. Side hatt, signal todne de.': {
      hi: 'ए हवलदार! वीआईपी मूवमेंट है। साइड हट, सिग्नल तोड़ने दे।',
      enVoice: "Hey Constable! VIP convoy is moving. Step aside and let us take the signal."
    },
    'Sir, CM ka kaafila bhi ho toh red light red hoti hai. Gaadi white line ke peeche lijiye.': {
      hi: 'सर, सीएम का काफिला भी हो तो रेड लाइट रेड होती है। गाड़ी वाइट लाइन के पीछे लीजिए।',
      enVoice: "Sir, even if it is the Chief Minister's convoy, a red light is still red. Pull your vehicle behind the white line."
    },
    'Tujhe nahi pata andar kaun baitha hai. Yeh aakhri warning hai.': {
      hi: 'तुझे नहीं पता अंदर कौन बैठा है। यह आखिरी वॉर्निंग है।',
      enVoice: "You don't know who is sitting inside. This is your final warning."
    },
    'Isko hatao yahan se.': {
      hi: 'इसको हटाओ यहाँ से।',
      enVoice: "Clear him out of the way."
    },
    'All units, 10-33 on Linking Road! Officer down! Black Fortuner fled south towards Shanti Galli!': {
      hi: 'ऑल यूनिट्स, 10-33 ऑन लिंकिंग रोड! ऑफिसर डाउन! ब्लैक फॉर्च्यूनर फ्लेड साउथ टुवर्ड्स शांति गली!',
      enVoice: "All units, 10-33 on Linking Road! Officer down! Black Fortuner fled south towards Shanti Galli!"
    },
    'Vikram ka notebook. Pehla entry: Mrs. Iyer, Shanti Galli, 10:15, mandir. Usne likha tha — "Sab kuch dekhti hai." Tum uss signal par khel rahe ho jahaan Vikram mar gaya. Sab rules abhi bhi wahi hain. Bas wajah badal gayi hai.': {
      hi: 'विक्रम का नोटबुक। पहला एंट्री: मिसेज अय्यर, शांति गली, 10:15, मंदिर। उसने लिखा था — "सब कुछ देखती है।"',
      enVoice: "Vikram's notebook. First entry: Mrs. Iyer, Shanti Galli, 10:15, temple. He wrote — 'She sees everything.' Follow every rule at this signal, because Vikram died here."
    },
    'Bhai, do minute. Bas.': {
      hi: 'भाई, दो मिनट। बस।',
      enVoice: "Brother, two minutes. That's all."
    },
    'Do minute ki baat hai. Signal toh sirf ek ruka hai.': {
      hi: 'दो मिनट की बात है। सिग्नल तो सिर्फ एक रुका है।',
      enVoice: "It is just two minutes. It is only one red signal."
    },
    'Sir, yeh red light hai. Zameen pe ek line hai. Please.': {
      hi: 'सर, यह रेड लाइट है। ज़मीन पर एक लाइन है। प्लीज।',
      enVoice: "Sir, this is a red light. There is a line on the road. Please."
    },
    'Red light karna, sir. Yahi toh sikhaya tha unhone.': {
      hi: 'रेड लाइट करना, सर। यही तो सिखाया था उन्होंने।',
      enVoice: "Stop at the red light, sir. That is what he taught us."
    },
    'Maine Fortuner dekha, Arjun. Aur piche baithe aadmi ko bhi.': {
      hi: 'मैंने फॉर्च्यूनर देखा, अर्जुन। और पीछे बैठे आदमी को भी।',
      enVoice: "I saw the Fortuner, Arjun. And the man sitting in the back."
    },
    'Kaun tha woh, Mrs. Iyer?!': {
      hi: 'कौन था वो, मिसेज अय्यर?!',
      enVoice: "Who was he, Mrs. Iyer?!"
    },
    'Police uniform thi uski. Aur agla entry tumhare notebook mein... Shanti Galli ka hai.': {
      hi: 'पुलिस यूनिफॉर्म थी उसकी। और अगला एंट्री तुम्हारे नोटबुक में... शांति गली का है।',
      enVoice: "He was wearing a police uniform. And the next entry in your notebook... is Shanti Galli."
    },
    'Shanti Galli. Mere ghar ke saamne.': {
      hi: 'शांति गली। मेरे घर के सामने।',
      enVoice: "Shanti Galli. Right in front of my house."
    },
    'Vikram bhai har roz isi signal par rukta tha. Har roz. Tum bhi ruko.': {
      hi: 'विक्रम भाई हर रोज़ इसी सिग्नल पर रुकता था। हर रोज़। तुम भी रुको।',
      enVoice: "Vikram stopped at this signal every single day. Every day. You stop too."
    },
    'All units: Linking Road junction RED. White line ke peeche ruko — ek line hai, koi shortcut nahi.': {
      hi: 'ऑल यूनिट्स: लिंकिंग रोड जंक्शन रेड। वाइट लाइन के पीछे रुको — एक लाइन है, कोई शॉर्टकट नहीं।',
      enVoice: "All units: Linking Road junction RED. Stop behind the white line. One line, no shortcuts."
    },
    'HORN HORN! Arey bhai chalo na! Mera meter down hai! (Ignore him — tumhe challan milega, use nahin!)': {
      hi: 'अरे भाई चलो ना! मेरा मीटर डाउन है!',
      enVoice: "Hey brother, let's move! My meter is running!"
    },
    'Heh! Tum signal pe so raho, main race jeet raha hoon! Pakad ke dikhao!': {
      hi: 'हे! तुम सिग्नल पे सो रहे हो, मैं रेस जीत रहा हूँ! पकड़ के दिखाओ!',
      enVoice: "Heh! Sleep at the signal, I am winning this race! Catch me if you can!"
    },
    'GREEN! Ab niklo — dheere, lane mein. Bazaar stretch mein tempo double-parked hai, left se niklo.': {
      hi: 'ग्रीन! अब निकलो — धीरे, लेन में। बाज़ार में टेम्पो डबल पार्क्ड है, लेफ्ट से निकलो।',
      enVoice: "Green! Now move, slowly in lane. Tempo double-parked in the bazaar, pass on the left."
    },
    'Arre sambhal ke! Yahan roz tempo khada rehta hai aur gadde (potholes) bhi hain. Left lane pakdo!': {
      hi: 'अरे संभल के! यहाँ रोज़ टेम्पो खड़ा रहता है और गड्ढे भी हैं। लेफ्ट लेन पकड़ो!',
      enVoice: "Careful! A tempo is always parked here and watch for potholes. Keep to the left lane!"
    }
  };

  function phonetizeHindi(str) {
    if (!str) { return ''; }
    var s = String(str);
    var subs = [
      [/\bdo\b/gi, 'doh'],
      [/\bbas\b/gi, 'buss'],
      [/\bpe\b/gi, 'peh'],
      [/\bthi\b/gi, 'thee'],
      [/\bbhi\b/gi, 'bhee'],
      [/\bki\b/gi, 'kee'],
      [/\bko\b/gi, 'koh'],
      [/\bek\b/gi, 'ayk'],
      [/\bpiche\b/gi, 'peechey'],
      [/\bbhai\b/gi, 'bhaai'],
      [/\bkaun\b/gi, 'kown'],
      [/\bruka\b/gi, 'rooka'],
      [/\bruko\b/gi, 'rooko'],
      [/\byahi\b/gi, 'yahee'],
      [/\bse\b/gi, 'sey'],
      [/\bke\b/gi, 'key'],
      [/\bna\b/gi, 'naa'],
      [/\bha\b/gi, 'haa'],
      [/\btha\b/gi, 'thaa'],
      [/\bka\b/gi, 'kaa'],
      [/\btumhare\b/gi, 'tumhaarey'],
      [/\bunhone\b/gi, 'unhoney'],
      [/\bsikhaya\b/gi, 'sikhaayaa'],
      [/\bbaithe\b/gi, 'baithey']
    ];
    for (var i = 0; i < subs.length; i++) {
      s = s.replace(subs[i][0], subs[i][1]);
    }
    return s;
  }

  function isHindiText(str) {
    if (!str) { return false; }
    if (/[\u0900-\u097F]/.test(str)) { return true; }
    var hindiWords = /\b(bhai|bas|baat|hai|hain|zameen|pe|thi|tha|bhi|ki|ko|ka|ke|karna|sikhaya|unhone|dekha|piche|baithe|aadmi|kaun|agla|entry|ruka|ruko|yahi|sab|kuch|chalo|mera|tumhe|milega|jeet|pakad|dheere|sambhal|roz|khada|gadde|har|mandir|galli)\b/i;
    return hindiWords.test(str);
  }

  function pickVoice(speaker, isHindi) {
    try {
      var list = getVoices();
      if (!list || !list.length) { return null; }

      var isFemale = /iyer|elderly|mummy|begum|shamika|priya|neha|ananya/i.test(speaker || '');

      // 1. If text has Hindi, look for a genuine Hindi TTS voice first
      if (isHindi) {
        for (var i = 0; i < list.length; i++) {
          var v = list[i];
          var lang = (v.lang || '').toLowerCase();
          var name = (v.name || '').toLowerCase();
          if (lang.indexOf('hi') === 0 || name.indexOf('hindi') >= 0 || name.indexOf('हिन्दी') >= 0 || name.indexOf('kalpana') >= 0 || name.indexOf('hemant') >= 0) {
            return { voice: v, isHindiVoice: true, lang: 'hi-IN' };
          }
        }
      }

      // 2. Next prefer Indian English (en-IN)
      var inVoices = [];
      for (var j = 0; j < list.length; j++) {
        var v2 = list[j];
        var l2 = (v2.lang || '').toLowerCase();
        var n2 = (v2.name || '').toLowerCase();
        if (l2.indexOf('en-in') === 0 || n2.indexOf('india') >= 0 || n2.indexOf('ravi') >= 0 || n2.indexOf('heera') >= 0) {
          inVoices.push(v2);
        }
      }

      if (inVoices.length) {
        if (isFemale) {
          for (var k = 0; k < inVoices.length; k++) {
            var fn = (inVoices[k].name || '').toLowerCase();
            if (fn.indexOf('heera') >= 0 || fn.indexOf('female') >= 0 || fn.indexOf('woman') >= 0 || fn.indexOf('zira') >= 0) {
              return { voice: inVoices[k], isHindiVoice: false, lang: 'en-IN' };
            }
          }
        } else {
          for (var m = 0; m < inVoices.length; m++) {
            var mn = (inVoices[m].name || '').toLowerCase();
            if (mn.indexOf('ravi') >= 0 || mn.indexOf('male') >= 0 || mn.indexOf('man') >= 0 || mn.indexOf('david') >= 0) {
              return { voice: inVoices[m], isHindiVoice: false, lang: 'en-IN' };
            }
          }
        }
        return { voice: inVoices[0], isHindiVoice: false, lang: 'en-IN' };
      }

      // 3. Fallback: Any English voice with appropriate gender
      var enVoices = [];
      for (var e = 0; e < list.length; e++) {
        var ve = list[e];
        if ((ve.lang || '').toLowerCase().indexOf('en') === 0) {
          enVoices.push(ve);
        }
      }
      if (enVoices.length) {
        if (isFemale) {
          for (var ef = 0; ef < enVoices.length; ef++) {
            var efn = (enVoices[ef].name || '').toLowerCase();
            if (efn.indexOf('zira') >= 0 || efn.indexOf('female') >= 0) {
              return { voice: enVoices[ef], isHindiVoice: false, lang: 'en-US' };
            }
          }
        } else {
          for (var em = 0; em < enVoices.length; em++) {
            var emn = (enVoices[em].name || '').toLowerCase();
            if (emn.indexOf('david') >= 0 || emn.indexOf('mark') >= 0 || emn.indexOf('male') >= 0) {
              return { voice: enVoices[em], isHindiVoice: false, lang: 'en-US' };
            }
          }
        }
        return { voice: enVoices[0], isHindiVoice: false, lang: 'en-US' };
      }

      return { voice: list[0], isHindiVoice: false, lang: list[0].lang || 'en-US' };
    } catch (err) {
      return null;
    }
  }

  /**
   * Speak a subtitle.
   *
   * @param text     the line, WITHOUT its surrounding quotes
   * @param opts     { speaker, radio, pitch, rate, gain }
   *
   * Deliberately fire-and-forget: the film runs on the wall clock, not on the
   * speech queue. If the voice is slower than the shot, the line is cut off by
   * the next cue — which is correct film behaviour, and the alternative (waiting
   * for speech) lets one slow voice stall the whole timeline.
   */
  function say(text, opts) {
    opts = opts || {};
    if (!text) { return false; }
    stopVoice();

    var raw = stripQuotes(text);
    if (!raw) { return false; }

    // ── PRE-RENDERED SARVAM VOICE ─────────────────────────────────────────
    // If scripts/precompute_voices.py has already rendered this line, play the
    // mp3 instead of synthesising it.
    //
    // This is preferred over speechSynthesis for two reasons that matter to the
    // film rather than to convenience:
    //   1. The browser voice is a lottery. Web Speech has no guarantee a Hindi
    //      voice exists on the player's machine, and when it does not, the whole
    //      campaign falls back to phonetised Roman Hindi read by an English voice
    //      — which is exactly the accent the story is arguing against.
    //   2. The film is on the wall clock, and speechSynthesis cannot be seeked,
    //      trimmed or mixed. A pre-rendered file can.
    //
    // Falls through to speechSynthesis when no file exists, so a player who has
    // never run the build script still hears every line.
    if (playRenderedVoice(raw, opts)) {
      duck(opts.radio ? 0.35 : 0.55, opts.radio ? 2600 : 3400);
      return true;
    }

    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { return false; }

    var isHindi = isHindiText(raw);
    var matchedEntry = null;
    for (var k in HINDI_LINES) {
      if (HINDI_LINES.hasOwnProperty(k)) {
        if (k.toLowerCase() === raw.toLowerCase() || raw.indexOf(k) >= 0 || k.indexOf(raw) >= 0) {
          matchedEntry = HINDI_LINES[k];
          break;
        }
      }
    }

    var voiceRec = pickVoice(opts.speaker, isHindi);
    var vCfg = voiceFor(opts.speaker);

    var textToSpeak = raw;
    if (voiceRec && voiceRec.isHindiVoice) {
      // True Hindi voice available! Pass Devanagari Hindi text for authentic pronunciation
      if (matchedEntry && matchedEntry.hi) {
        textToSpeak = matchedEntry.hi;
      }
    } else if (isHindi) {
      // English / Indian-English voice (Ravi, Heera, David): pass clean natural dialogue that the voice engine pronounces flawlessly
      if (matchedEntry && matchedEntry.enVoice) {
        textToSpeak = matchedEntry.enVoice;
      } else if (matchedEntry && matchedEntry.enPhonetic) {
        textToSpeak = matchedEntry.enPhonetic;
      } else {
        textToSpeak = phonetizeHindi(raw);
      }
    }

    try {
      var u = new SpeechSynthesisUtterance(textToSpeak);
      u.pitch = opts.pitch != null ? opts.pitch : vCfg.pitch;
      var targetRate = opts.rate != null ? opts.rate : vCfg.rate;
      if (isHindi && (!voiceRec || !voiceRec.isHindiVoice)) {
        targetRate = Math.min(targetRate, 0.96);
      }
      u.rate = targetRate;
      u.volume = opts.gain != null ? opts.gain : 1.0;

      if (voiceRec && voiceRec.voice) {
        u.voice = voiceRec.voice;
        u.lang = voiceRec.lang || 'en-IN';
      } else {
        u.lang = isHindi ? 'hi-IN' : 'en-IN';
      }

      currentUtterance = u;
      window._csUtterance = u; // Keep reference to prevent GC in Chrome

      var doSpeak = function () {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(u);
          duck(opts.radio ? 0.35 : 0.55, opts.radio ? 2600 : 3400);
        } catch (eSpeak) {}
      };

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setTimeout(doSpeak, 30);
      } else {
        doSpeak();
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function stopVoice() {
    try {
      if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
    } catch (e) {}
    // Stop pre-rendered audio too. `cancel()` only knows about speechSynthesis, so
    // a line already playing as an mp3 would otherwise keep talking under the
    // next shot — which reads as a dubbing error, not as an overlap.
    try {
      if (renderedAudio) {
        renderedAudio.onended = null;
        try { renderedAudio.pause(); renderedAudio.currentTime = 0; } catch (e1) {}
        renderedAudio = null;
      }
    } catch (e2) {}
    currentUtterance = null;
    window._csUtterance = null;
  }

  // ── Pre-rendered voice (scripts/precompute_voices.py) ──────────────────────
  //
  // KEY FORMAT: "speaker||line" — a plain composite string, deliberately NOT a
  // hash.
  //
  // The first version hashed the key (sha1 of speaker\0line) to keep the manifest
  // small, which required a hand-written SHA-1 in this file to look it up
  // synchronously — and the hand-written SHA-1 produced wrong digests, so every
  // line silently fell back to the browser voice. A lookup failure that degrades
  // instead of erroring is the worst possible place to be clever. The composite
  // string needs no hashing at all, cannot drift out of sync, and costs a few KB.
  var renderedManifest = null;
  var renderedAudio = null;
  var MANIFEST_URL = 'story/voices/manifest.json';

  function voiceKey(speaker, line) {
    return String(speaker == null ? '' : speaker) + '||' + String(line == null ? '' : line);
  }

  function loadRenderedManifest(cb) {
    if (renderedManifest) { cb(renderedManifest); return; }
    // Absent manifest is the normal case for a fresh clone, not an error: the
    // whole point of the fallback is that the game works without the audio build.
    if (typeof fetch !== 'function') { cb(null); return; }
    fetch(MANIFEST_URL, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { renderedManifest = j; cb(j && typeof j === 'object' ? j : null); })
      .catch(function () { cb(null); });
  }

  /**
   * Try to play the pre-rendered line. Returns true when audio actually started,
   * false when the caller must fall back to speechSynthesis.
   */
  function playRenderedVoice(rawLine, opts) {
    var speaker = (opts && opts.speaker) || 'System';
    // Composite key, matching scripts/precompute_voices.py's manifest exactly.
    var key = voiceKey(speaker, rawLine);
    if (!renderedManifest) {
      // Kick off the load, but do NOT block this call: the first shot of a film
      // must never wait on a network round-trip. That one line falls back to the
      // browser voice; every line after it is pre-rendered.
      loadRenderedManifest(function () { });
      return false;
    }
    var entry = renderedManifest[key];
    if (!entry || !entry.path) { return false; }
    try {
      if (typeof Audio === 'undefined') { return false; }
      var a = new Audio('story/voices/' + entry.path);
      a.volume = (opts && opts.gain != null) ? opts.gain : 1.0;
      // Radio lines get the narrowband treatment a wireless actually has.
      if (opts && opts.radio) { a.volume = Math.min(a.volume, 0.8); }
      renderedAudio = a;
      var p = a.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { renderedAudio = null; });
      }
      a.onended = function () { renderedAudio = null; };
      return true;
    } catch (e) {
      renderedAudio = null;
      return false;
    }
  }

  /** Drop the ambience while someone talks, then bring it back. */
  function duck(factor, holdMs) {
    var c = ensure();
    if (!c || !world) { return; }
    try {
      world.gain.cancelScheduledValues(c.currentTime);
      world.gain.setTargetAtTime(factor, c.currentTime, 0.08);
      clearTimeout(duck._t);
      duck._t = setTimeout(function () {
        try { world.gain.setTargetAtTime(1.0, ctx.currentTime, 0.5); } catch (e) {}
      }, holdMs || 3000);
    } catch (e2) {}
  }

  // ── Shot bus ───────────────────────────────────────────────────────────────
  /**
   * Apply a shot's `audio` block.
   *
   * A shot may declare:
   *   beds   { rain: 0.5, engine: 0.2 }   ambience levels for this shot
   *   sting  'shot'                        one-shot at the shot's start
   *   stingAt { shot: 0.35 }               one-shot 35% into the shot
   *   sample  'sfx_crash_car'               RECORDED one-shot, alongside the synth
   *   sampleAt { name, at: 0.3, gain }      RECORDED one-shot at a fraction of the shot
   *   sampleLoop 'sfx_police_siren'         RECORDED loop, from this shot on
   *   sampleStop  ['sfx_police_siren']      RECORDED loops to end as this shot starts
   *   say    true                          speak the subtitle (default when a
   *                                       subtitle exists)
   *   radio  true                          bandpass the voice — a handset
   *
   * The `sample*` keys are the recorded-audio layer (story/samples.js). They sit
   * ALONGSIDE the synthesised beds and stings, never in place of them: the rain
   * bed still runs under the recorded siren, because a siren over synthetic rain
   * is a siren in a room and a siren under real rain is a street at 3am.
   *
   * Everything is optional and everything is guarded. A shot with no audio block
   * still plays, and a shot naming a sample that failed to load still plays.
   */
  function applyShot(shot, index) {
    if (!shot) { return; }
    var a = shot.audio || {};

    // A shot is ENTERED once per film. Clearing its cue guards here is what
    // makes a replay of the film fire the same cues again: the guards used to
    // live on the authored shot object, which the campaign data shares across
    // every play, so the second and later plays lost their stings and their
    // lines entirely.
    try { cueFired.delete(shot); } catch {}

    if (a.beds) {
      Object.keys(a.beds).forEach(function (k) {
        var v = a.beds[k];
        if (v <= 0) { stop(k); } else { bed(k, v); }
      });
      // Any bed the shot does not mention should fall away, or a rain loop from
      // a previous shot keeps playing under a dry daylight beat.
      Object.keys(beds).forEach(function (k) {
        if (!a.beds || a.beds[k] == null) { stop(k); }
      });
    }

    // ── recorded layer ────────────────────────────────────────────────────
    // Ordered stop → play → loop so that a loop handed from one shot to the next
    // restarts cleanly instead of cutting and immediately re-triggering.
    try {
      var SB = window.SampleBank;
      if (SB) {
        if (a.sampleStop) {
          (Array.isArray(a.sampleStop) ? a.sampleStop : [a.sampleStop]).forEach(function (k) {
            SB.stop(k);
          });
        }
        if (a.sample) { SB.play(a.sample, { gain: a.sampleGain }); }
        if (a.sampleLoop) { SB.loop(a.sampleLoop, { gain: a.sampleGain }); }
      }
    } catch (eSample) {}

    if (a.sting) { sting(a.sting, a.stingGain); }

    if (a.say !== false && shot.sub && shot.sub.line) {
      say(stripQuotes(shot.sub.line), {
        speaker: shot.sub.speaker,
        radio: !!a.radio
      });
    } else if (a.sting === 'shot' || a.say === false) {
      stopVoice();
    }
  }

  /**
   * Timing for `stingAt` and `sayThen`, evaluated from the tick.
   *
   * A second line inside the SAME shot (`sayThen`) is what turns one man talking
   * at a wall into two people talking to each other — the cut stays on the
   * over-the-shoulder and the answer arrives into it, the way it would on a
   * stage. Both cues fire at most once per shot, tracked on the shot object.
   */
  function applyTimed(shot, p) {
    if (!shot) { return; }
    var a = shot.audio || {};

    // One guard per CUE, not one per shot: a shot may carry a sting AND a
    // recorded sample AND a second line, and they must not evict each other.
    var fired = cueFired.get(shot);
    if (!fired) { fired = {}; cueFired.set(shot, fired); }
    var once = function (key) {
      if (fired[key]) { return false; }
      fired[key] = true;
      return true;
    };

    // The time gate comes FIRST: `once()` marks the cue as fired, so
    // checking the clock after it would swallow every cue whose time had
    // not been reached yet.
    if (a.stingAt) {
      var stings = Array.isArray(a.stingAt) ? a.stingAt : [a.stingAt];
      stings.forEach(function (st) {
        if (!st) { return; }
        var key = 'sting:' + (st.name || st.kind || 'x');
        if (p >= (st.at || 0) && once(key)) {
          sting(st.kind || 'click', st.gain);
        }
      });
    }

    // Recorded one-shot, cued at a fraction of the shot like stingAt.
    if (a.sampleAt) {
      try {
        var SBa = window.SampleBank;
        if (SBa) {
          var samples = Array.isArray(a.sampleAt) ? a.sampleAt : [a.sampleAt];
          samples.forEach(function (sm) {
            if (!sm) { return; }
            var skey2 = 'sample:' + (sm.name || sm.key || 'x');
            if (p >= (sm.at || 0) && once(skey2)) {
              SBa.play(sm.name || sm.key, { gain: sm.gain });
            }
          });
        }
      } catch (eS) {}
    }

    if (shot.sayThen && p >= (shot.sayThen.at || 0)) {
      var skey = 'say:' + shot.sayThen.speaker + ':' + String(shot.sayThen.line).slice(0, 12);
      if (once(skey)) {
        say(stripQuotes(shot.sayThen.line), {
          speaker: shot.sayThen.speaker,
          radio: !!(a && a.radio)
        });
      }
    }
  }

  function stripQuotes(s) {
    return String(s == null ? '' : s).replace(/^\s*["“”']+/, '').replace(/["“”']+\s*$/, '').trim();
  }

  /** Tear the whole film audio bed down. */
  function endFilm(fadeMs) {
    var c = ensure();
    stopVoice();
    if (c && world) {
      try {
        world.gain.cancelScheduledValues(c.currentTime);
        world.gain.setTargetAtTime(0, c.currentTime, (fadeMs || 300) / 1000 / 3);
      } catch (e) {}
    }
    Object.keys(beds).forEach(function (k) { stop(k); });

    // The recorded layer has its own lifetime. Without this a police siren
    // cued in the last shot of a cutscene keeps wailing through the reward
    // screen, the results music and the next attempt — which is the single most
    // offensive thing a sound integration can do, because it is impossible to
    // mistake for intentional.
    try { if (window.SampleBank) { window.SampleBank.stopAll(); } } catch (eS) {}
  }

  window.StoryAudio = {
    unlock: unlock,
    ready: ready,
    preloadVoices: function (cb) { loadRenderedManifest(cb || function () { }); },
    hasRenderedVoices: function () { return !!renderedManifest; },
    bed: bed,
    stop: stop,
    stopAll: stopAll,
    sting: sting,
    say: say,
    stopVoice: stopVoice,
    duck: duck,
    applyShot: applyShot,
    applyTimed: applyTimed,
    stripQuotes: stripQuotes,
    endFilm: endFilm,
    voiceFor: voiceFor
  };
})();