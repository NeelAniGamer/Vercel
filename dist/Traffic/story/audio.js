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
      rain:   { type: 'lowpass',  freq: 1100, q: 0.5 },
      engine: { type: 'lowpass',  freq: 220,  q: 1.0 },
      room:   { type: 'lowpass',  freq: 700,  q: 0.7 },
      river:  { type: 'bandpass', freq: 900,  q: 0.4 }
    };
    var f = filter || defaults[name] || defaults.room;
    try {
      flt.type = f.type; flt.frequency.value = f.freq; flt.Q.value = f.q;
    } catch (e) {}

    var g = c.createGain();
    g.gain.value = 0;

    // Rain bed should sound like gentle monsoon drizzle, never loud radio static
    if (name === 'rain') {
      gain = Math.min(gain, 0.20);
    }

    src.connect(flt); flt.connect(g); g.connect(world);
    try { src.start(); } catch (e2) {}
    // Ramp in rather than switching on: a bed that appears at full level is a
    // click, and a click at the top of a cutscene reads as a glitch.
    g.gain.setTargetAtTime(gain, c.currentTime, 0.35);
    beds[name] = { src: src, gain: g };
    return beds[name];
  }

  function stop(name) {
    var b = beds[name];
    if (!b) { return; }
    delete beds[name];
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
   *   splash  — water: filtered noise with a rising then falling cutoff.
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
      var sq = c.createBufferSource();
      sq.buffer = noise();
      var bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = kind === 'squelch' ? 1800 : 3200; bp.Q.value = 6;
      var sg = c.createGain();
      sg.gain.setValueAtTime(0.3 * g, t);
      sg.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'squelch' ? 0.22 : 0.06));
      sq.connect(bp); bp.connect(sg); sg.connect(world);
      try { sq.start(t); sq.stop(t + 0.25); } catch (e4) {}
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
    'Bhai, do minute. Bas.': {
      hi: 'भाई, दो मिनट। बस।',
      enPhonetic: 'Bhaai, doh minute. Buss.'
    },
    'Do minute ki baat hai. Signal toh sirf ek ruka hai.': {
      hi: 'दो मिनट की बात है। सिग्नल तो सिर्फ एक रुका है।',
      enPhonetic: 'Doh minute kee baat hai. Signal toh sirf ayk rooka hai.'
    },
    'Sir, yeh red light hai. Zameen pe ek line hai. Please.': {
      hi: 'सर, यह रेड लाइट है। ज़मीन पर एक लाइन है। प्लीज।',
      enPhonetic: 'Sir, yeh red light hai. Zameen peh ayk line hai. Please.'
    },
    'Red light karna, sir. Yahi toh sikhaya tha unhone.': {
      hi: 'रेड लाइट करना, सर। यही तो सिखाया था उन्होंने।',
      enPhonetic: 'Red light karnaa, sir. Yahee toh sikhaayaa thaa unhoney.'
    },
    'Maine Fortuner dekha, Arjun. Aur piche baithe aadmi ko bhi.': {
      hi: 'मैंने फॉर्च्यूनर देखा, अर्जुन। और पीछे बैठे आदमी को भी।',
      enPhonetic: 'Mainey Fortuner dekhaa, Arjun. Aur peechey baithey aadmi koh bhee.'
    },
    'Kaun tha woh, Mrs. Iyer?!': {
      hi: 'कौन था वो, मिसेज अय्यर?!',
      enPhonetic: 'Kown thaa voh, Mrs. Iyer?!'
    },
    'Police uniform thi uski. Aur agla entry tumhare notebook mein... Shanti Galli ka hai.': {
      hi: 'पुलिस यूनिफॉर्म थी उसकी। और अगला एंट्री तुम्हारे नोटबुक में... शांति गली का है।',
      enPhonetic: 'Police uniform thee uskee. Aur aglaa entry tumhaarey notebook mein... Shanti Galli kaa hai.'
    },
    'All units: Linking Road junction RED. White line ke peeche ruko — ek line hai, koi shortcut nahi.': {
      hi: 'ऑल यूनिट्स: लिंकिंग रोड जंक्शन रेड। वाइट लाइन के पीछे रुको — एक लाइन है, कोई शॉर्टकट नहीं।',
      enPhonetic: 'All units: Linking Road junction RED. White line key peechey rooko — ayk line hai, koyee shortcut nahee.'
    },
    'HORN HORN! Arey bhai chalo na! Mera meter down hai! (Ignore him — tumhe challan milega, use nahin!)': {
      hi: 'अरे भाई चलो ना! मेरा मीटर डाउन है!',
      enPhonetic: 'Arey bhaai chalo naa! Meraa meter down hai!'
    },
    'Heh! Tum signal pe so raho, main race jeet raha hoon! Pakad ke dikhao!': {
      hi: 'हे! तुम सिग्नल पे सो रहे हो, मैं रेस जीत रहा हूँ! पकड़ के दिखाओ!',
      enPhonetic: 'Heh! Tum signal peh so raho, main race jeet rahaa hoon! Pakad key dikhaao!'
    },
    'GREEN! Ab niklo — dheere, lane mein. Bazaar stretch mein tempo double-parked hai, left se niklo.': {
      hi: 'ग्रीन! अब निकलो — धीरे, लेन में। बाज़ार में टेम्पो डबल पार्क्ड है, लेफ्ट से निकलो।',
      enPhonetic: 'GREEN! Ab niklo — dheerey, lane mein. Bazaar stretch mein tempo double parked hai, left sey niklo.'
    },
    'Arre sambhal ke! Yahan roz tempo khada rehta hai aur gadde (potholes) bhi hain. Left lane pakdo!': {
      hi: 'अरे संभल के! यहाँ रोज़ टेम्पो खड़ा रहता है और गड्ढे भी हैं। लेफ्ट लेन पकड़ो!',
      enPhonetic: 'Arrey sambhal key! Yahaan roz tempo khadaa rehtaa hai aur khaddey bhee hain. Left lane pakdo!'
    },
    'Vikram bhai har roz isi signal par rukta tha. Har roz. Tum bhi ruko.': {
      hi: 'विक्रम भाई हर रोज़ इसी सिग्नल पर रुकता था। हर रोज़। तुम भी रुको।',
      enPhonetic: 'Vikram bhaai har roz isee signal par rooktaa thaa. Har roz. Tum bhee rooko.'
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
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { return false; }

    var raw = stripQuotes(text);
    if (!raw) { return false; }

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
      // English / Indian-English voice: pass cleanly phonetized line to avoid mispronunciation ("pee", "thigh", "bass", etc.)
      if (matchedEntry && matchedEntry.enPhonetic) {
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
        targetRate = Math.min(targetRate, 0.90);
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

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(u);
      duck(opts.radio ? 0.35 : 0.55, opts.radio ? 2600 : 3400);
      return true;
    } catch (e) {
      return false;
    }
  }

  function stopVoice() {
    try {
      if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
    } catch (e) {}
    currentUtterance = null;
    window._csUtterance = null;
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
   *   say    true                          speak the subtitle (default when a
   *                                       subtitle exists)
   *   radio  true                          bandpass the voice — a handset
   *
   * Everything is optional and everything is guarded. A shot with no audio block
   * still plays.
   */
  function applyShot(shot, index) {
    if (!shot) { return; }
    var a = shot.audio || {};

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

    if (a.stingAt) {
      var key = 'sting:' + (a.stingAt.name || a.stingAt.kind || 'x');
      if (shot.__fired !== key && p >= (a.stingAt.at || 0)) {
        shot.__fired = key;
        sting(a.stingAt.kind || 'click', a.stingAt.gain);
      }
    }

    if (shot.sayThen && p >= (shot.sayThen.at || 0)) {
      var skey = 'say:' + shot.sayThen.speaker + ':' + String(shot.sayThen.line).slice(0, 12);
      if (shot.__fired !== skey) {
        shot.__fired = skey;
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
  }

  window.StoryAudio = {
    unlock: unlock,
    ready: ready,
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