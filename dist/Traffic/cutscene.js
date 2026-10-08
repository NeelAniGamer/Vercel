/**
 * cutscene.js — Story Mode cinematic player.
 *
 * THIS FILE OWNS THE PLAYER STATE MACHINE AND THE OVERLAY. NOTHING ELSE.
 *
 * It runs a scripted film that borrows the render loop, holds `_camOverride`
 * for its duration, and hands the frame back when it ends. Camera maths live in
 * story/shots.js, concrete lives in story/stage.js, words live in
 * story/campaign.js. This file is the only thing that decides WHETHER a film is
 * running.
 *
 * Integration contract with game_core.js:
 *   Cutscene.begin(game, level)  — called instead of releasing the player. If a
 *                                  STAGE exists for this level it builds the
 *                                  FILM map first, plays, then rebuilds the
 *                                  PLAYABLE map and fires onEnd callbacks.
 *   Cutscene.beat(game, levelId) — called from an objective milestone. Plays on
 *                                  the CURRENT map without rebuilding it.
 *   Cutscene.tick(game)          — called from the render loop's `!playing`
 *                                  branch. Returns true while active.
 *
 * Design notes:
 *   - Gameplay simulation never runs during a film: `_loop()` early-returns
 *     while `playing === false`, so no physics, input, or NPC AI ticks.
 *   - All overlay motion uses only `opacity`/`transform` (compositor-friendly,
 *     required for the 360px-first mobile target).
 *   - Everything is guarded. A cutscene failure must never soft-lock a level:
 *     any throw tears the overlay down and hands control back.
 */
(function () {
  'use strict';

  var SEEN_PREFIX = 'traffic_cutscene_seen_';
  var BEAT_PREFIX = 'traffic_cutscene_beat_';
  var ACTIVE = null; // { game, level, script, idx, cast, borrowed, overlay, ... }
  var LAST_LEVEL_ID = null;

  // ── Overlay (letterbox + title + subtitle) ────────────────────────────────
  var STYLE_ID = 'cutscene-style';
  var CSS =
    '#cutscene-root{position:fixed;inset:0;z-index:20000;pointer-events:none;font-family:Inter,system-ui,sans-serif;text-transform:none;overflow:hidden;}' +
    '#cutscene-root .cs-bar{position:absolute;left:0;right:0;height:6.5vh;min-height:22px;background:#030508;transform:scaleY(0);will-change:transform;z-index:20010;border-bottom:1px solid rgba(255,255,255,0.08);}' +
    '#cutscene-root .cs-bar.top{top:0;transform-origin:top center;}' +
    '#cutscene-root .cs-bar.bot{bottom:0;transform-origin:bottom center;border-bottom:none;border-top:1px solid rgba(255,255,255,0.08);}' +
    '#cutscene-root .cs-vig{position:absolute;inset:0;opacity:0;will-change:opacity;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 60%,rgba(3,6,12,0.28) 100%);z-index:20001;}' +
    '#cutscene-root .cs-scanlines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 3px);opacity:0.03;pointer-events:none;z-index:20002;}' +
    '#cutscene-root .cs-fade{position:absolute;inset:0;background:#000;opacity:0;will-change:opacity;z-index:20015;}' +
    '#cutscene-root .cs-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:20016;transition:opacity 0.22s ease-out;}' +
    '#cutscene-root .cs-rain-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20003;opacity:0.85;}' +
    '#cutscene-root .cs-title{position:absolute;left:0;right:0;top:38%;text-align:center;color:#fff;opacity:0;will-change:opacity,transform;font-size:clamp(16px,4.5vw,28px);font-weight:900;letter-spacing:.22em;text-transform:uppercase;text-shadow:0 2px 20px rgba(0,0,0,0.95);z-index:20012;}' +
    // TACTICAL FOUND-FOOTAGE / INTERCEPTOR OSD
    '#cutscene-root .cs-osd{position:absolute;inset:6.5vh 24px calc(6.5vh + 10px) 24px;pointer-events:none;z-index:20005;display:flex;flex-direction:column;justify-content:space-between;opacity:0;transition:opacity .45s ease;}' +
    '#cutscene-root .cs-osd-top{display:flex;justify-content:space-between;align-items:center;font-family:"Space Mono",monospace;font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:0.12em;text-shadow:0 1px 4px rgba(0,0,0,0.8);}' +
    '#cutscene-root .cs-osd-rec{display:inline-flex;align-items:center;gap:7px;color:#ef4444;font-weight:800;}' +
    '#cutscene-root .cs-rec-dot{width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 10px #ef4444;animation:csBlink 1s infinite;}' +
    '@keyframes csBlink{0%,100%{opacity:1;}50%{opacity:0.2;}}' +
    '#cutscene-root .cs-osd-mid{display:flex;justify-content:space-between;height:100%;position:relative;}' +
    '#cutscene-root .cs-osd-bracket{width:16px;height:16px;border:2px solid rgba(94,211,240,0.4);position:absolute;}' +
    '#cutscene-root .cs-osd-bracket.tl{top:10px;left:10px;border-right:none;border-bottom:none;}' +
    '#cutscene-root .cs-osd-bracket.tr{top:10px;right:10px;border-left:none;border-bottom:none;}' +
    '#cutscene-root .cs-osd-bracket.bl{bottom:10px;left:10px;border-right:none;border-top:none;}' +
    '#cutscene-root .cs-osd-bracket.br{bottom:10px;right:10px;border-left:none;border-top:none;}' +
    '#cutscene-root .cs-osd-bot{display:flex;justify-content:space-between;align-items:flex-end;font-family:"Space Mono",monospace;font-size:10px;color:rgba(94,211,240,0.85);letter-spacing:0.08em;text-shadow:0 1px 4px rgba(0,0,0,0.8);}' +
    '#cutscene-root .cs-osd-tc{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:"Space Mono",monospace;font-size:clamp(13px,2.2vw,19px);font-weight:700;letter-spacing:0.22em;color:rgba(255,255,255,0.92);text-shadow:0 2px 10px rgba(0,0,0,0.95);}' +
    // NOIR TRANSCEIVER DIALOGUE CARD
    '#cutscene-root .cs-transceiver{position:absolute;left:50%;transform:translateX(-50%) translateY(14px);bottom:calc(6.5vh + 14px);width:min(94vw,760px);display:flex;align-items:center;gap:14px;padding:12px 18px;border-radius:14px;background:rgba(8,12,22,0.92);border:1px solid rgba(94,211,240,0.32);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.85),0 0 20px rgba(94,211,240,0.12);color:#fff;opacity:0;will-change:opacity,transform;z-index:20025;transition:transform .22s cubic-bezier(0.16,1,0.3,1),opacity .22s ease;}' +
    '#cutscene-root .cs-avatar{width:44px;height:44px;border-radius:10px;background:rgba(18,26,45,0.9);border:1.5px solid rgba(94,211,240,0.5);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;box-shadow:inset 0 0 12px rgba(94,211,240,0.25);position:relative;overflow:hidden;}' +
    '#cutscene-root .cs-content{flex:1;min-width:0;text-align:left;}' +
    '#cutscene-root .cs-meta{display:flex;align-items:center;gap:8px;margin-bottom:4px;}' +
    '#cutscene-root .cs-speaker-badge{font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#5ed3f0;background:rgba(94,211,240,0.12);padding:2px 8px;border-radius:4px;border:1px solid rgba(94,211,240,0.3);}' +
    '#cutscene-root .cs-eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px;margin-left:auto;}' +
    '#cutscene-root .cs-eq-bar{width:3px;background:#5ed3f0;border-radius:1px;animation:csEq .6s ease-in-out infinite alternate;}' +
    '#cutscene-root .cs-eq-bar:nth-child(1){height:4px;animation-delay:0.1s;}' +
    '#cutscene-root .cs-eq-bar:nth-child(2){height:11px;animation-delay:0.3s;}' +
    '#cutscene-root .cs-eq-bar:nth-child(3){height:7px;animation-delay:0.15s;}' +
    '#cutscene-root .cs-eq-bar:nth-child(4){height:12px;animation-delay:0.4s;}' +
    '#cutscene-root .cs-eq-bar:nth-child(5){height:5px;animation-delay:0.25s;}' +
    '@keyframes csEq{0%{transform:scaleY(0.3);}100%{transform:scaleY(1.2);}}' +
    '#cutscene-root .cs-dialogue-line{font-size:clamp(13px,3.2vw,16.5px);line-height:1.45;color:#e8edf5;font-weight:500;text-shadow:0 1px 2px rgba(0,0,0,0.8);}' +
    // WINDSHIELD WIPER BLADE
    '#cutscene-root .cs-wiper{position:absolute;bottom:0;left:15%;width:9px;height:125vh;background:linear-gradient(to right,rgba(15,20,30,0.9),rgba(45,55,75,0.95),rgba(10,15,25,0.9));transform-origin:bottom center;transform:rotate(-68deg);z-index:20004;opacity:0;pointer-events:none;box-shadow:0 0 16px rgba(0,0,0,0.9);transition:transform 0.45s cubic-bezier(0.2,0.8,0.3,1),opacity 0.2s ease;}' +
    '#cutscene-root .cs-skip-btn{position:absolute;top:max(14px,calc(6.5vh + 10px));right:18px;z-index:20030;' +
    'pointer-events:auto;display:inline-flex;align-items:center;gap:8px;padding:10px 20px;' +
    'border-radius:9999px;background:rgba(10,15,29,.95);border:1.5px solid rgba(94,211,240,.6);' +
    'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;' +
    'font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;' +
    'box-shadow:0 4px 22px rgba(0,0,0,.7),0 0 16px rgba(94,211,240,.3);opacity:1;transform:translateY(0);' +
    'transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s ease,border-color .2s ease,box-shadow .2s ease,opacity .25s ease;' +
    'will-change:transform,opacity;user-select:none;-webkit-user-select:none;}' +
    '#cutscene-root .cs-skip-btn:hover{background:rgba(22,33,58,.98);border-color:#5ed3f0;transform:scale(1.05);box-shadow:0 6px 28px rgba(94,211,240,.5);}' +
    '#cutscene-root .cs-skip-btn:active{transform:scale(.97);}' +
    '#cutscene-root .cs-skip-icon{font-size:14px;color:#5ed3f0;}' +
    'body.cs-playing #hud,body.cs-playing #hudbar,body.cs-playing #hwrap,body.cs-playing #player-hud-card,body.cs-playing #tasks-container,body.cs-playing #objective-overlay,body.cs-playing #kid-pedals,body.cs-playing #kid-steer,body.cs-playing #enter-vehicle-btn,body.cs-playing .hud-dashboard-card,body.cs-playing #mini-map,body.cs-playing #minimap,body.cs-playing .mobile-controls,body.cs-playing #play-overlay,body.cs-playing .nav-login-btn,body.cs-playing .lp-modal,body.cs-playing #game-briefing,body.cs-playing #gta-briefing-modal,body.cs-playing #gta-mission-intro,body.cs-playing .gta-intro-overlay,body.cs-playing #daily-bonus-modal,body.cs-playing [class*="daily-bonus"],body.cs-playing .action-btn{display:none !important;}';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Elements that must stay visible during the film. `#gc` is the WebGL canvas
  // wrapper and the canvas itself is `#3c` — hiding either hides the movie.
  var NEVER_HIDE = { 'gc': 1, '3c': 1, 'cutscene-root': 1, 'cutscene-style': 1 };

  function hideGameUI() {
    var saved = [];
    var nodes;
    try { nodes = document.body.querySelectorAll('*'); } catch (e) { return saved; }
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (NEVER_HIDE[el.id]) { continue; }
      if (el.id === 'cutscene-root' || (el.closest && el.closest('#cutscene-root'))) { continue; }
      var cs;
      try { cs = getComputedStyle(el); } catch (e2) { continue; }
      if (cs.position !== 'fixed' && cs.position !== 'absolute') { continue; }
      var z = parseInt(cs.zIndex, 10);
      if (!(z >= 40)) { continue; }
      saved.push({
        el: el,
        prevDisplay: el.style.getPropertyValue('display'),
        prevPriority: el.style.getPropertyPriority('display'),
        prevComputed: (cs.display !== 'none') ? cs.display : ''
      });
    }
    enforceHUD(saved);
    return saved;
  }

  function enforceHUD(saved) {
    for (var i = 0; i < (saved || []).length; i++) {
      var s = saved[i];
      try {
        if (!s.el || !s.el.isConnected) { continue; }
        if (getComputedStyle(s.el).display === 'none') { continue; }
        s.el.style.setProperty('display', 'none', 'important');
      } catch (e) {}
    }
  }

  function restoreGameUI(saved) {
    (saved || []).forEach(function (s) {
      try {
        if (!s.el) { return; }
        if (s.prevDisplay) {
          s.el.style.setProperty('display', s.prevDisplay, s.prevPriority || '');
        } else if (s.prevComputed) {
          s.el.style.setProperty('display', s.prevComputed, '');
        } else {
          s.el.style.removeProperty('display');
        }
      } catch (e) {}
    });
  }

  /**
   * Screen rain.
   *
   * This is CAMERA-RAIN, not world rain: droplets on the lens, between the film
   * and the viewer. cinematics.js already emits a world rain volume inside the
   * 3D stage, so anything here that moved in world space would double up.
   *
   * Deterministic by index, and stepped by dt rather than per frame, so a slow
   * device rains at the same speed as a fast one and a replay looks identical.
   */
  var RAIN_DROPS = [];
  function initRainDrops(canvas) {
    if (!canvas) { return; }
    RAIN_DROPS = [];
    var count = Math.min(54, Math.floor((window.innerWidth || 800) / 22));
    for (var i = 0; i < count; i++) {
      RAIN_DROPS.push({
        // Two families of droplet. The upper field streaks past fast and reads as
        // depth; the lower field is fat, slow and out of focus, which is what a
        // bead on the front element actually looks like. One family reads as a
        // scrolling texture.
        near: i % 3 === 0,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1.2 + Math.random() * 3.2,
        speed: 0.18 + Math.random() * 0.45,
        alpha: 0.22 + Math.random() * 0.36
      });
    }
  }

  function stepRainDrops(canvas, dt) {
    if (!canvas || !RAIN_DROPS.length) { return; }
    var ctx = canvas.getContext('2d');
    if (!ctx) { return; }
    var w = canvas.width, h = canvas.height;
    var step = Math.min(Math.max(dt || 0.016, 0.001), 0.1);
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < RAIN_DROPS.length; i++) {
      var d = RAIN_DROPS[i];
      d.y += d.speed * h * step * (d.near ? 1.9 : 1);
      if (d.y > h + 10) {
        d.y = -10;
        d.x = Math.random() * w;
      }
      if (d.near) {
        // A near droplet is a streak, not a dot — it smears along its own path.
        ctx.strokeStyle = 'rgba(215, 235, 255, ' + (d.alpha * 0.5) + ')';
        ctx.lineWidth = d.r * 1.4;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.r * 0.5, d.y - d.r * 4.5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(215, 235, 255, ' + d.alpha + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (d.alpha * 1.5) + ')';
        ctx.fill();
      }
    }
  }

  /**
   * Swipe the lens clean.
   *
   * Bound to the ACTIVE record, not to a bare overlay reference, because every
   * timer here has to abort when the film ends. A wiper arm left mid-sweep by a
   * skipped cutscene would keep swinging over the HUD for the rest of the level.
   */
  function triggerWiper(state) {
    var ov = state && state.overlay;
    if (!ov || !ov.wiper) { return; }
    if (state._wiperTimer) { clearTimeout(state._wiperTimer); }

    try {
      if (window.StoryAudio && typeof window.StoryAudio.sting === 'function') {
        window.StoryAudio.sting('wiper', 0.7);
      }
    } catch (eW) {}

    var arm = ov.wiper;
    arm.style.opacity = '0.9';
    // Park the blade off-frame first, so the sweep always starts from the same
    // angle. Without this a second wipe can begin mid-arc and read as a glitch.
    arm.style.transition = 'none';
    arm.style.transform = 'rotate(-68deg)';

    var seq = [
      [40, function () { arm.style.transition = ''; arm.style.transform = 'rotate(66deg)'; }],
      [460, function () {
        // Wipe complete: clear the accumulated beads so the lens is genuinely
        // clean rather than merely scrolled.
        try { if (ov.rainCanvas) { var c = ov.rainCanvas.getContext('2d'); if (c) { c.clearRect(0, 0, ov.rainCanvas.width, ov.rainCanvas.height); } } } catch (e1) {}
        initRainDrops(ov.rainCanvas);
        arm.style.transition = '';
        arm.style.transform = 'rotate(-68deg)';
      }],
      [880, function () { arm.style.opacity = '0'; }]
    ];
    var i = 0;
    var run = function () {
      if (!ACTIVE) { return; }   // film ended mid-wipe: leave it be
      if (i >= seq.length) { state._wiperTimer = 0; return; }
      var stepDef = seq[i++];
      state._wiperTimer = setTimeout(function () {
        try { stepDef[1](); } catch (e2) {}
        run();
      }, stepDef[0]);
    };
    run();
  }

  /**
   * One-frame white blowout — the muzzle flash.
   *
   * Not a held flash: a real gunshot is 4-8ms of light and the eye reads the
   * darkness after it far more strongly than the flash itself. 200ms is already
   * generous; anything longer looks like a lighting error.
   */
  function triggerFlash(state, strength) {
    var ov = state && state.overlay;
    if (!ov || !ov.flash) { return; }
    var g = Math.max(0.2, Math.min(1, strength == null ? 0.85 : strength));
    var f = ov.flash;
    // Restart the CSS transition: setting opacity alone while a previous
    // transition is mid-flight does nothing, and the flash silently vanishes on
    // a replay because the element is already at opacity 0.
    f.style.transition = 'none';
    f.style.opacity = '0';
    void f.offsetWidth;
    f.style.transition = 'opacity 60ms ease-out';
    f.style.opacity = String(g);
    if (state._flashTimer) { clearTimeout(state._flashTimer); }
    state._flashTimer = setTimeout(function () {
      f.style.transition = 'opacity 260ms ease-out';
      f.style.opacity = '0';
      state._flashTimer = 0;
    }, 70);
  }

  function buildOverlay() {
    ensureStyle();
    var root = document.createElement('div');
    root.id = 'cutscene-root';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="cs-bar top"></div>' +
      '<div class="cs-bar bot"></div>' +
      '<div class="cs-vig"></div>' +
      '<div class="cs-scanlines"></div>' +
      '<canvas class="cs-rain-canvas" id="csRainCanvas"></canvas>' +
      '<div class="cs-wiper" id="csWiper"></div>' +
      '<div class="cs-flash" id="csFlash"></div>' +
      '<div class="cs-osd" id="csOsd">' +
        '<div class="cs-osd-top">' +
          '<div class="cs-osd-rec"><span class="cs-rec-dot"></span><span id="csOsdRec">REC · 4K 60FPS</span></div>' +
          '<div class="cs-osd-banner" id="csOsdBanner">MUMBAI TRAFFIC CRIME INVESTIGATION // SURVEILLANCE FEED</div>' +
          '<div class="cs-osd-time" id="csOsdClock">03:14:18</div>' +
        '</div>' +
        '<div class="cs-osd-mid">' +
          '<div class="cs-osd-bracket tl"></div><div class="cs-osd-bracket tr"></div>' +
          '<div class="cs-osd-bracket bl"></div><div class="cs-osd-bracket br"></div>' +
          '<div class="cs-osd-tc" id="csOsdTc">03:14:18:00</div>' +
        '</div>' +
        '<div class="cs-osd-bot">' +
          '<div class="cs-osd-gps" id="csOsdGps">GPS: 19.0596° N, 72.8295° E // LINKING RD JUNCTION</div>' +
          '<div class="cs-osd-unit" id="csOsdUnit">UNIT: BANDRA-WEST-04 // AUDIO: BANDPASS 104.2MHz</div>' +
        '</div>' +
      '</div>' +
      '<div class="cs-fade"></div>' +
      '<div class="cs-title"></div>' +
      '<div class="cs-transceiver" id="csTransceiver">' +
        '<div class="cs-avatar" id="csAvatar">🚔</div>' +
        '<div class="cs-content">' +
          '<div class="cs-meta">' +
            '<span class="cs-speaker-badge" id="csBadge">POLICE WIRELESS</span>' +
            '<div class="cs-eq">' +
              '<span class="cs-eq-bar"></span><span class="cs-eq-bar"></span>' +
              '<span class="cs-eq-bar"></span><span class="cs-eq-bar"></span><span class="cs-eq-bar"></span>' +
            '</div>' +
          '</div>' +
          '<div class="cs-dialogue-line" id="csLine"></div>' +
        '</div>' +
      '</div>' +
      '<button class="cs-skip-btn" type="button" aria-label="Skip Cutscene">' +
        '<span>Skip Cutscene</span> <span class="cs-skip-icon">⏭</span>' +
      '</button>';
    document.body.appendChild(root);

    // Cap the rain buffer. A 4K backing store would be four times the fill cost
    // for droplets that are 2-5px across; the film reads identically at 1x.
    var rCanvas = root.querySelector('.cs-rain-canvas');
    if (rCanvas) {
      rCanvas.width = Math.min(960, window.innerWidth || 800);
      rCanvas.height = Math.min(640, window.innerHeight || 600);
      initRainDrops(rCanvas);
    }

    return {
      root: root,
      barTop: root.querySelector('.cs-bar.top'),
      barBot: root.querySelector('.cs-bar.bot'),
      vig: root.querySelector('.cs-vig'),
      scanlines: root.querySelector('.cs-scanlines'),
      rainCanvas: rCanvas,
      wiper: root.querySelector('.cs-wiper'),
      flash: root.querySelector('.cs-flash'),
      osd: root.querySelector('.cs-osd'),
      osdRec: root.querySelector('#csOsdRec'),
      osdBanner: root.querySelector('#csOsdBanner'),
      osdClock: root.querySelector('#csOsdClock'),
      osdTc: root.querySelector('#csOsdTc'),
      osdGps: root.querySelector('#csOsdGps'),
      osdUnit: root.querySelector('#csOsdUnit'),
      fade: root.querySelector('.cs-fade'),
      title: root.querySelector('.cs-title'),
      transceiver: root.querySelector('.cs-transceiver'),
      avatar: root.querySelector('#csAvatar'),
      badge: root.querySelector('#csBadge'),
      line: root.querySelector('#csLine'),
      skipBtn: root.querySelector('.cs-skip-btn')
    };
  }

  function teardownOverlay(ov) {
    if (!ov || !ov.root) { return; }
    try { if (ov.root.parentNode) { ov.root.parentNode.removeChild(ov.root); } } catch (e) {}
    RAIN_DROPS = [];
    LAST_SPEAKER = '';
  }

  // ── OSD clock ─────────────────────────────────────────────────────────────
  /**
   * Advance the surveillance overlay's running clock.
   *
   * A clock frozen on one value is the single thing that tells a viewer the OSD
   * is a texture. Each frame adds the real frame delta to the film's own start
   * time, so the clock runs at wall-clock speed and lands on a real time of day
   * — which matters, because the cold open's whole point is 3:14am.
   */
  /**
   * Zero-pad to two digits.
   *
   * This exists because the first version of these counters indexed a 12-entry
   * hour table for minutes, seconds and frames too, so a 14-minute past 3am
   * rendered as "03:undefined:undefined AM". A clock that says "undefined" is
   * worse than no clock: it tells the viewer the film is a mock-up.
   */
  function pad2(n) {
    n = Math.max(0, Math.floor(n || 0));
    return (n < 10 ? '0' : '') + n;
  }

  function osdClockText(elapsedSec, base) {
    var total = base + Math.max(0, elapsedSec);
    var h = Math.floor(total / 3600) % 24;
    var m = Math.floor(total / 60) % 60;
    var s = Math.floor(total) % 60;
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) { h12 = 12; }
    return pad2(h12) + ':' + pad2(m) + ':' + pad2(s) + ' ' + ampm;
  }

  /**
   * SMPTE-style timecode for the mid-frame counter: HH:MM:SS:FF.
   *
   * The frames field is what sells it. A wall-clock string looks like a label;
   * a string with a running frame counter looks like a decoder, which is exactly
   * what an evidence reel would have burned into it.
   */
  function osdTimecode(elapsedSec, base, fps) {
    var f = fps || 24;
    var total = Math.max(0, base) + Math.max(0, elapsedSec);
    var frames = Math.floor((total % 1) * f);
    var whole = Math.floor(total);
    var h = Math.floor(whole / 3600) % 24;
    var m = Math.floor(whole / 60) % 60;
    var s = whole % 60;
    return pad2(h) + ':' + pad2(m) + ':' + pad2(s) + ':' + pad2(frames);
  }

  /** Parse an authored clock ("3:14am", "03:14:18") into seconds past midnight. */
  function osdBaseSeconds(str, fallback) {
    var m = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i.exec(String(str || ''));
    if (!m) { return fallback; }
    var h = parseInt(m[1], 10) % 24;
    var mm = parseInt(m[2], 10);
    var ss = m[3] ? parseInt(m[3], 10) : 0;
    if ((m[4] || '').toLowerCase() === 'pm' && h < 12) { h += 12; }
    if ((m[4] || '').toLowerCase() === 'am' && h === 12) { h = 0; }
    return (h * 3600) + (mm * 60) + ss;
  }

  // Title Case for user-facing overlay copy (AGENTS.md house rule).
  function titleCase(s) {
    return String(s == null ? '' : s).replace(/\w\S*/g, function (w) {
      return w.charAt(0).toUpperCase() + w.substr(1);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CHARACTER_ROLES = [
    { re: /vikram|sawant/i, name: 'SI Vikram Sawant', dept: 'Traffic Surveillance Unit 12', icon: '🏍️', col: '#38bdf8' },
    { re: /kadam|arjun|insp/i, name: 'Insp. Arjun Kadam', dept: 'Traffic Crime Branch', icon: '🚔', col: '#f59e0b' },
    { re: /iyer|elderly|mummy/i, name: 'Mrs. Meenakshi Iyer', dept: 'Resident Eyewitness', icon: '👵', col: '#10b981' },
    { re: /driver|fortuner/i, name: 'Fortuner Escort Driver', dept: 'Tinted VIP Convoy', icon: '🕶️', col: '#ef4444' },
    { re: /vip|passenger|shadow/i, name: 'Shadowed VIP Passenger', dept: 'Unidentified Official', icon: '⚠️', col: '#dc2626' },
    { re: /wireless|dispatch|control/i, name: 'Mumbai Police Wireless', dept: 'Bandra Central Control', icon: '📻', col: '#60a5fa' }
  ];

  function getCharacterMeta(speaker) {
    var s = String(speaker || '');
    for (var i = 0; i < CHARACTER_ROLES.length; i++) {
      if (CHARACTER_ROLES[i].re.test(s)) { return CHARACTER_ROLES[i]; }
    }
    return { name: titleCase(speaker || 'Mumbai Police Wireless'), dept: 'Bandra Central Control', icon: '📻', col: '#60a5fa' };
  }

  var LAST_SPEAKER = '';
  function setSubtitle(ov, text) {
    if (!ov || !ov.transceiver) { return; }
    if (!text) {
      ov.transceiver.style.opacity = '0';
      ov.transceiver.style.transform = 'translateX(-50%) translateY(14px)';
      return;
    }
    var rawSpeaker = text.speaker ? String(text.speaker).trim() : '';
    var meta = getCharacterMeta(rawSpeaker);
    var line = text.line == null ? '' : String(text.line);

    if (rawSpeaker && rawSpeaker !== LAST_SPEAKER) {
      LAST_SPEAKER = rawSpeaker;
      try {
        if (window.StoryAudio && typeof window.StoryAudio.sting === 'function') {
          window.StoryAudio.sting('squelch', 0.55);
        }
      } catch (eSq) {}
    }

    if (ov.avatar) {
      ov.avatar.textContent = meta.icon;
      ov.avatar.style.borderColor = meta.col;
    }
    if (ov.badge) {
      ov.badge.textContent = meta.name + ' · ' + meta.dept;
      ov.badge.style.color = meta.col;
      ov.badge.style.borderColor = meta.col;
    }
    if (ov.line) {
      ov.line.innerHTML = escapeHtml(line);
    }
  }

  // ── Cast spawning ─────────────────────────────────────────────────────────
  function spawnCast(game, defs) {
    var group = new THREE.Group();
    group.name = 'cutscene-cast';
    var made = {};
    (defs || []).forEach(function (d) {
      if (!d || !d.id) { return; }
      var mesh = null;
      try {
        if (d.kind === 'vehicle') {
          var bv = (typeof window._buildVehicle === 'function') ? window._buildVehicle : null;
          // A FILM VEHICLE IS NOT A RANDOM VEHICLE. `_buildVehicle` picks a
          // random model from a pool and only repaints materials literally named
          // body/paint/chassis, so a shot whose subtitle names a Fortuner would
          // show a different car each load, usually still in its baked colour.
          // Every cast vehicle therefore builds deterministically and fully
          // tinted. Gameplay traffic keeps the randomness it wants.
          mesh = bv ? bv(d.type || 'car', d.color == null ? 0xffffff : d.color, { exact: true, tintAll: true }) : null;
          if (mesh && (d.id === 'vikram' || d.withRider) && typeof window._buildCutsceneRider === 'function') {
            var rider = window._buildCutsceneRider();
            if (rider) {
              rider.position.set(0, 0.42, -0.2);
              mesh.add(rider);
              mesh.userData = mesh.userData || {};
              mesh.userData.rider = rider;
            }
            // Halogen headlamp and red taillight for Vikram's motorcycle
            try {
              var hLamp = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 14, 12),
                new THREE.MeshBasicMaterial({ color: 0xfef08a })
              );
              hLamp.position.set(0, 0.72, 0.82);
              mesh.add(hLamp);
              var bSpot = new THREE.SpotLight(0xfff7ed, 3.2, 30, Math.PI / 6, 0.35, 1.2);
              bSpot.position.set(0, 0.72, 0.85);
              bSpot.target.position.set(0, 0, 16);
              mesh.add(bSpot);
              mesh.add(bSpot.target);
              var tLamp = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.08, 0.04),
                new THREE.MeshBasicMaterial({ color: 0xef4444 })
              );
              tLamp.position.set(0, 0.65, -0.84);
              mesh.add(tLamp);
            } catch (eL) {}
          }
          if (mesh && (d.id === 'fortuner' || d.withDriver) && typeof window._buildCutsceneDriver === 'function') {
            var driver = window._buildCutsceneDriver();
            if (driver) {
              driver.position.set(0, 0, 0);
              mesh.add(driver);
              mesh.userData = mesh.userData || {};
              mesh.userData.driver = driver;
            }
          }
        } else {
          if (d.id === 'arjun' && typeof window._buildCutsceneArjun === 'function') {
            mesh = window._buildCutsceneArjun();
          } else if (d.id === 'iyer' && typeof window._buildCutsceneIyer === 'function') {
            mesh = window._buildCutsceneIyer();
          } else {
            var bh = (typeof window._buildHuman === 'function') ? window._buildHuman : null;
            mesh = bh ? bh(false, { variant: d.variant || 'normal' }) : null;
          }
        }
      } catch (e) { mesh = null; }
      if (!mesh) { return; }
      if (typeof d.x === 'number') { mesh.position.set(d.x, d.y || 0, d.z); }
      if (typeof d.rotY === 'number') { mesh.rotation.y = d.rotY; }
      // Cutscene actors are scenery, not hazards: keep them out of the way of
      // collision/task queries by tagging them and hiding their id from systems
      // that read userData.isPlayer / npcType.
      mesh.userData = mesh.userData || {};
      mesh.userData.isCast = true;
      mesh.userData.castId = d.id;
      group.add(mesh);
      made[d.id] = mesh;
    });
    if (group.children.length) { game.scene.add(group); }
    return { group: group, actors: made };
  }

  // Optional floating name tag, matching the in-game nametag art (5339).
  function tagActor(game, actor, text) {
    try {
      if (typeof game._makeNametag !== 'function') { return null; }
      var sp = game._makeNametag(text, { border: 'rgba(94,212,245,0.55)' });
      if (!sp) { return null; }
      sp.position.y = (typeof actor.userData.height === 'number' ? actor.userData.height : 2.2);
      // Keep the label on the sprite so applyTags() can match a shot's speaker
      // against it without threading a second list through the timeline.
      sp.userData = sp.userData || {};
      sp.userData.tagText = text;
      actor.add(sp);
      return sp;
    } catch (e) { return null; }
  }

  // ── NPC borrowing ─────────────────────────────────────────────────────────
  // A named gameplay NPC that already exists on a scripted route. Rather than
  // spawning a duplicate (which would visibly pop at handoff), the film borrows
  // the real mesh, parks it on its mark, and restores its exact transform when
  // it ends. If the NPC cannot be found we fall back to a temporary stand-in.
  function borrowNPCs(game, spec) {
    var borrowed = [];
    (spec || []).forEach(function (want) {
      if (!want || !want.profileKey) { return; }
      var found = null;
      try {
        var list = game.npcs || [];
        for (var i = 0; i < list.length; i++) {
          var n = list[i];
          if (!n) { continue; }
          var pk = n.profileKey || (n.userData && n.userData.profileKey);
          if (pk === want.profileKey) { found = n; break; }
        }
      } catch (e) { found = null; }

      if (found) {
        borrowed.push({
          real: found,
          profileKey: want.profileKey,
          restore: {
            x: found.position.x, y: found.position.y, z: found.position.z,
            rotY: found.rotation.y
          }
        });
        try {
          if (typeof want.x === 'number') { found.position.set(want.x, found.position.y, want.z); }
          if (typeof want.rotY === 'number') { found.rotation.y = want.rotY; }
          found.speed = 0;
          if (found.userData) { found.userData.spd = 0; found.userData.heldForCutscene = true; }
        } catch (e2) {}
      } else {
        var tmp = null;
        try {
          var bv = (typeof window._buildVehicle === 'function') ? window._buildVehicle : null;
          tmp = bv ? bv(want.type || 'car', want.color == null ? 0xffffff : want.color) : null;
        } catch (e3) { tmp = null; }
        if (tmp) {
          if (typeof want.x === 'number') { tmp.position.set(want.x, want.positionY || 0, want.z); }
          if (typeof want.rotY === 'number') { tmp.rotation.y = want.rotY; }
          tmp.userData = tmp.userData || {};
          tmp.userData.isCast = true;
          game.scene.add(tmp);
          borrowed.push({ real: tmp, temp: true, profileKey: want.profileKey });
        }
      }
    });
    return borrowed;
  }

  function releaseNPCs(borrowed) {
    (borrowed || []).forEach(function (b) {
      if (!b || !b.real) { return; }
      try {
        if (b.temp) {
          if (b.real.parent) { b.real.parent.remove(b.real); }
          return;
        }
        if (b.restore) {
          b.real.position.set(b.restore.x, b.restore.y, b.restore.z);
          b.real.rotation.y = b.restore.rotY;
        }
        if (b.real.userData) { b.real.userData.heldForCutscene = false; }
      } catch (e) {}
    });
  }

  function releaseTags(tags) {
    (tags || []).forEach(function (t) {
      // Entries are {sprite, id} records, not bare sprites — see start().
      var sp = (t && t.sprite) ? t.sprite : t;
      try {
        if (!sp) { return; }
        var list = window._namedTags;
        if (list && list.length) {
          var idx = list.indexOf(sp);
          if (idx >= 0) { list.splice(idx, 1); }
        }
        if (sp.parent) { sp.parent.remove(sp); }
      } catch (e) {}
    });
  }

  function destroyCast(cast) {
    if (!cast || !cast.group) { return; }
    try {
      var tags = window._namedTags;
      if (tags && tags.length) {
        for (var i = tags.length - 1; i >= 0; i--) {
          if (tags[i] && cast.group === tags[i].parent) { tags.splice(i, 1); }
        }
      }
      cast.group.traverse(function (o) {
        if (o.parent) { o.parent.remove(o); }
      });
      if (cast.group.parent) { cast.group.parent.remove(cast.group); }
    } catch (e) {}
  }

  // ── Player mesh hiding ────────────────────────────────────────────────────
  // The player vehicle and the on-foot character both sit in the world from the
  // moment the map builds. Neither belongs on screen in a film — a hero shot
  // with the player's hatchback parked three metres into frame is worse than no
  // shot at all. Hidden on entry, restored exactly on handoff.
  function hidePlayerMeshes(game) {
    var hidden = [];
    ['playerVehicle', 'playerCharacter'].forEach(function (k) {
      try {
        var m = game[k];
        if (m && m.visible !== false) { m.visible = false; hidden.push(k); }
      } catch (e) {}
    });
    return hidden;
  }

  function showPlayerMeshes(game, keys) {
    (keys || []).forEach(function (k) {
      try { if (game[k]) { game[k].visible = true; } } catch (e) {}
    });
  }

  // ── Playback state ────────────────────────────────────────────────────────
  function seenKey(levelId) { return SEEN_PREFIX + String(levelId); }

  function hasSeen(levelId) {
    try { return localStorage.getItem(seenKey(levelId)) === '1'; } catch (e) { return false; }
  }

  function markSeen(levelId) {
    try { localStorage.setItem(seenKey(levelId), '1'); } catch (e) {}
  }

  function clearSeen(levelId) {
    try { localStorage.removeItem(seenKey(levelId)); } catch (e) {}
  }

  function beatSeenKey(levelId, beatId) {
    return BEAT_PREFIX + String(levelId) + '_' + String(beatId);
  }

  function beatSeen(levelId, beatId) {
    try { return localStorage.getItem(beatSeenKey(levelId, beatId)) === '1'; } catch (e) { return false; }
  }

  function markBeatSeen(levelId, beatId) {
    try { localStorage.setItem(beatSeenKey(levelId, beatId), '1'); } catch (e) {}
  }

  function storyFor(levelId) {
    try {
      var s = window.STORY;
      return (s && s[String(levelId)]) ? s[String(levelId)] : null;
    } catch (e) { return null; }
  }

  function stageFor(levelId) {
    try {
      var s = window.STAGE;
      return (s && s[String(levelId)]) ? s[String(levelId)] : null;
    } catch (e) { return null; }
  }

  function resolveScript(level) {
    var story = storyFor(level && level.id);
    if (!story || !story.prologue || !story.prologue.length) { return null; }
    var S = window.Shots;
    return S && S.prepare ? S.prepare(story.prologue) : story.prologue;
  }

  // ── Overlay animation ─────────────────────────────────────────────────────
  function updateOverlay(shot, p, state) {
    var ov = state.overlay;
    if (!ov) { return; }

    // Per-shot OSD text, resolved once on entry rather than every frame.
    if (state.fx) {
      if (ov.osdClock && state.osdText) { ov.osdClock.textContent = state.osdText; }
      if (ov.osdTc && state.osdTcText) { ov.osdTc.textContent = state.osdTcText; }
      if (ov.osdGps && state.fx.osdGps) { ov.osdGps.textContent = state.fx.osdGps; }
      if (ov.osdUnit && state.fx.osdUnit) { ov.osdUnit.textContent = state.fx.osdUnit; }
      if (ov.osdBanner && state.fx.osdBanner) { ov.osdBanner.textContent = state.fx.osdBanner; }
      if (ov.osdRec && state.fx.osdRec) { ov.osdRec.textContent = state.fx.osdRec; }
    }

    // Bars ease in over the first 12% and out over the last 12% of the shot.
    var inP = Math.min(1, p / 0.12);
    var outP = Math.min(1, (1 - p) / 0.12);
    var bar = Math.min(inP, outP);
    var sy = window.Shots ? window.Shots.ease('outCubic', bar) : bar;
    if (ov.barTop) { ov.barTop.style.transform = 'scaleY(' + sy + ')'; }
    if (ov.barBot) { ov.barBot.style.transform = 'scaleY(' + sy + ')'; }

    // Vignette and scanlines are per-act, not global.
    //
    // Both were previously pinned to one value, which was wrong in both
    // directions: a heavy vignette over a midday beat crushed the frame edges
    // until a verandah scene read as dusk, and scanlines over a daylight street
    // made the playable map look like it was playing back off a tape. Each act
    // declares its own weight; the film inherits whichever act the shot is in.
    var fx = state.fx || {};
    if (ov.vig) { ov.vig.style.opacity = String(sy * (fx.vig != null ? fx.vig : 0.34)); }
    if (ov.scanlines) { ov.scanlines.style.opacity = String(sy * (fx.scan != null ? fx.scan : 0.12)); }
    if (ov.rainCanvas) { ov.rainCanvas.style.opacity = String(sy * (fx.lensRain != null ? fx.lensRain : 0)); }

    // The OSD is opt-in per shot. A surveillance overlay over a two-hander is
    // a costume; over a CCTV-style insert it is the whole point.
    if (ov.osd) { ov.osd.style.opacity = String(sy * (shot.osd ? 1 : 0)); }

    if (ov.skipBtn) { ov.skipBtn.style.opacity = '1'; }

    // ── Shot transition ──
    // A hard cut between two unrelated camera setups reads as a glitch, so
    // dissolve by dipping the frame to black and back. One canvas cannot
    // cross-fade two live renders cheaply, and at this length a dip is
    // indistinguishable from a dissolve.
    if (state.transDur > 0) {
      var half = state.transDur / 2;
      var f = (state.transT < half)
        ? (state.transT / half)
        : Math.max(0, 1 - (state.transT - half) / half);
      if (ov.fade) { ov.fade.style.opacity = String(Math.max(0, Math.min(1, f))); }
    } else if (ov.fade) {
      ov.fade.style.opacity = '0';
    }

    if (ov.title) {
      var t = shot.title || null;
      if (t) {
        // Title card: fade up, hold, fade out across the shot.
        var tp = p < 0.25 ? p / 0.25 : (p > 0.7 ? (1 - p) / 0.3 : 1);
        ov.title.textContent = titleCase(t);
        ov.title.style.opacity = String(Math.max(0, Math.min(1, tp)));
        ov.title.style.transform = 'translateY(' + ((1 - Math.max(0, Math.min(1, tp))) * 10) + 'px)';
      } else {
        ov.title.style.opacity = '0';
      }
    }

    // Dialogue card. Note this is `transceiver`, not `sub` — the overlay was
    // rebuilt around the transceiver card, and the old `ov.sub` branch had been
    // left behind. It could never fire, so every line in the film was silent on
    // screen while the audio still played: the exact failure that reads as
    // "the subtitles are broken" rather than "a property was renamed".
    if (ov.transceiver) {
      var line = shot.sub || (state.subShown || null);
      if (line) {
        // Fade with the same envelope the bars use, so the card does not survive
        // a hard cut into a shot that has no dialogue.
        var sp = bar;
        setSubtitle(ov, line);
        ov.transceiver.style.opacity = String(Math.max(0, Math.min(1, sp)));
        ov.transceiver.style.transform = 'translateX(-50%) translateY(' + ((1 - Math.max(0, Math.min(1, sp))) * 10) + 'px)';
      } else {
        ov.transceiver.style.opacity = '0';
        ov.transceiver.style.transform = 'translateX(-50%) translateY(10px)';
      }
    }
  }

  /**
   * Resolve a shot's overlay treatment: which act's grade, and whether this cut
   * is being seen through the surveillance camera or through the lens.
   *
   * `shot.osd` may be a boolean or an object — an object lets a shot rewrite the
   * OSD's own clock and unit label, which is how one film shows two different
   * cameras (a fixed CCTV clock for the inserts, the investigator's timecode for
   * the handheld work) without two overlay elements.
   */
  function shotFx(shot) {
    var actName = (shot && shot.act) || null;
    var stage = null;
    try {
      var id = ACTIVE && ACTIVE.levelId != null ? ACTIVE.levelId
        : (window.ui && window.ui.cur ? window.ui.cur.id : null);
      var all = window.STAGE || {};
      stage = all[String(id)] || null;
    } catch (e) {}
    var act = (stage && stage.acts && actName) ? stage.acts[actName] : null;

    var fx = {
      vig: act && act.vig != null ? act.vig : 0.34,
      scan: act && act.scan != null ? act.scan : 0.12,
      lensRain: (act && act.rain) ? 0.85 : 0,
      wiper: !!(act && act.rain)
    };
    if (!shot) { return fx; }

    var o = shot.osd;
    if (o && typeof o === 'object') {
      if (o.clock != null) { fx.osdBase = osdBaseSeconds(o.clock, 3 * 3600 + 14 * 60 + 18); }
      if (o.gps) { fx.osdGps = o.gps; }
      if (o.unit) { fx.osdUnit = o.unit; }
      if (o.banner) { fx.osdBanner = o.banner; }
      if (o.rec) { fx.osdRec = o.rec; }
      if (o.tc !== false) { fx.osdTc = true; }
    }
    return fx;
  }

  // ── Fill light ────────────────────────────────────────────────────────────
  // Named sets are under cover — a verandah soffit, a balcony ceiling — so the
  // sun puts the exact faces the camera needs into full shadow and a midday
  // scene reads as night. This lifts shadowed surfaces WITHOUT touching the sun,
  // so the lighting the player drives under is unchanged.
  function addFillLight(game) {
    try {
      var isNight = !!(game && game.mapCfg && (game.mapCfg.isNight || game.mapCfg.mode === 'night'));
      var lights = [];
      if (isNight) {
        // Balanced cinematic Mumbai night: luminous sky ambient fill, clear cool moon key, warm sodium bounce
        var ambNight = new THREE.AmbientLight(0x405575, 0.70);
        var moonKey = new THREE.DirectionalLight(0x93c5fd, 0.85);
        moonKey.position.set(20, 45, 15);
        var sodiumBounce = new THREE.DirectionalLight(0xf59e0b, 0.40);
        sodiumBounce.position.set(-20, 25, -20);
        game.scene.add(ambNight);
        game.scene.add(moonKey);
        game.scene.add(sodiumBounce);
        lights.push(ambNight, moonKey, sodiumBounce);
      } else {
        var amb = new THREE.AmbientLight(0xdde8f8, 0.55);
        var key = new THREE.DirectionalLight(0xfff0e2, 0.65);
        key.position.set(20, 36, 12);
        var fill = new THREE.DirectionalLight(0xa5c4f5, 0.35);
        fill.position.set(-30, 40, -40);
        game.scene.add(amb);
        game.scene.add(key);
        game.scene.add(fill);
        lights.push(amb, key, fill);
      }
      return lights;
    } catch (e) { return []; }
  }

  function removeLights(list) {
    (list || []).forEach(function (l) {
      try { if (l && l.parent) { l.parent.remove(l); } } catch (e) {}
    });
  }

  /**
   * Wire the Skip button. This is the ONLY way to end a cutscene early.
   *
   * The requirement was a button rather than a key, and there is a concrete
   * reason rather than a stylistic one: every key in this game is already a
   * driving control (W/S throttle and brake, Space handbrake, arrows steer, F
   * enter car, Escape pause), so a skip shortcut would either collide with
   * driving or need a chord nobody discovers. A button costs one tap, works
   * under a thumb on a phone, and cannot be pressed by accident mid-corner.
   *
   * `pointerdown` stops propagation so the tap does not also reach the canvas
   * and register as a look/steer input behind the overlay. The button also gets
   * an ARIA label and a real focus stop so it is reachable by keyboard for
   * accessibility even though it is not a keyboard shortcut.
   */
  function attachSkip(state) {
    try { if (window.StoryAudio && window.StoryAudio.unlock) { window.StoryAudio.unlock(); } } catch (e) {}

    // Fetch the pre-rendered voice manifest up front, so the film's FIRST line is
    // already a Sarvam mp3 rather than the browser voice. Loading it lazily on the
    // first `say()` means shot 1 speaks in the wrong accent and every shot after
    // it speaks in the right one, which is worse than being consistent either way.
    // The load is fire-and-forget: a slow or absent manifest never delays the cut.
    try {
      if (window.StoryAudio && typeof window.StoryAudio.preloadVoices === 'function') {
        window.StoryAudio.preloadVoices();
      }
    } catch (eVoice) {}

    if (state.overlay && state.overlay.skipBtn) {
      var btn = state.overlay.skipBtn;
      var onSkip = function (e) {
        if (e) {
          try { e.preventDefault(); e.stopPropagation(); } catch (err) {}
        }
        skip();
      };
      btn.addEventListener('click', onSkip);
      btn.addEventListener('touchend', onSkip);
      var swallow = function (e) { try { e.stopPropagation(); } catch (err) {} };
      btn.addEventListener('pointerdown', swallow);
      btn.addEventListener('mousedown', swallow);
      // Enter/Space on a focused button still fires `click`, which routes to the
      // same skip(). That is the accessibility path, not a gameplay shortcut.
      state.detachSkip = function () {
        try {
          btn.removeEventListener('click', onSkip);
          btn.removeEventListener('touchend', onSkip);
          btn.removeEventListener('pointerdown', swallow);
          btn.removeEventListener('mousedown', swallow);
        } catch (e2) {}
      };
    } else {
      state.detachSkip = function () {};
    }
  }

  // ── Core playback ─────────────────────────────────────────────────────────
  /**
   * Shared machinery for the prologue and for mid-level beats.
   *
   * @param game    the Driving game
   * @param script  a prepared shot list
   * @param opts    { level, levelId, cast, borrow, tags, title, kind, onEnd }
   * @returns {boolean} whether a film actually started
   */
  function start(game, script, opts) {
    opts = opts || {};
    if (ACTIVE) { return false; }
    if (!script || !script.length) { return false; }
    if (!game || !game.scene || !game.camera) { return false; }

    var ov = null;
    var cast = null;
    var borrowed = [];
    var hiddenPlayer = [];
    try {
      ov = buildOverlay();

      // Cast belongs to the campaign (blocking is direction, which is
      // narrative). The level's own `cast` is the fallback for older entries.
      var level = opts.level || null;
      cast = spawnCast(game, opts.cast || (level && level.cast) || null);

      (opts.borrow || []).forEach(function (b) {
        borrowed = borrowed.concat(borrowNPCs(game, [b]));
      });

      // Named on-screen actors get a tag, matching in-game presentation.
      //
      // Tags start HIDDEN. A nametag is a gameplay affordance — a wayfinding
      // label for a player who has lost track of who is who. In a film it is
      // worse than nothing: an establishing crane with two nameplates floating
      // over a street reads as a debug overlay, and a viewer who has not met a
      // character yet cannot attach the name to anything. Tags therefore fade in
      // only for the shots that address someone (see tagsForShot) and fade out
      // again once the shot changes.
      var madeTags = [];
      (opts.tags || []).forEach(function (t) {
        var a = cast.actors[t.id];
        if (!a) {
          var want = null;
          var bl = opts.borrow || [];
          for (var bi = 0; bi < bl.length; bi++) {
            if (bl[bi] && bl[bi].as === t.id) { want = bl[bi]; break; }
          }
          if (want) {
            for (var bj = 0; bj < borrowed.length; bj++) {
              if (borrowed[bj] && borrowed[bj].profileKey === want.profileKey && borrowed[bj].real) {
                a = borrowed[bj].real; break;
              }
            }
          }
        }
        if (a) {
          var sp = tagActor(game, a, t.text);
          if (sp) {
            madeTags.push({ sprite: sp, id: t.id });
            try { sp.visible = false; } catch (e) {}
          }
        }
      });

      // NOTE: the first shot is applied AFTER the ACTIVE record exists, further down.
      // applyShot()/applyTags() read from ACTIVE, so calling them here — before
      // the literal is assigned — silently no-ops and took the film's first frame
      // of camera AND its first line of audio with it.

      try { document.body.classList.add('cs-playing'); } catch (e) {}
      var hiddenUI = hideGameUI();

      var now = (window.performance && performance.now) ? performance.now() : Date.now();
      ACTIVE = {
        game: game, level: level, levelId: opts.levelId,
        script: script, idx: 0,
        kind: opts.kind || 'prologue',
        title: opts.title || null,
        beatId: opts.beatId || null,
        cast: cast, borrowed: borrowed, overlay: ov,
        prevFov: game.camera.fov,
        prevPlaying: game.playing,
        prevPause: !!game.pause,
        hiddenPlayer: hidePlayerMeshes(game),
        _dt: 0.016,
        shotStartedAt: now,
        lastFrameAt: 0,
        transT: 0, transDur: 0,
        hiddenUI: hiddenUI,
        tags: madeTags,
        rehideTimers: []
      };

      // The engine reveals more HUD layers after start() returns, so take one
      // extra snapshot a moment later to catch panels that did not exist yet.
      [400, 1200].forEach(function (ms) {
        ACTIVE.rehideTimers.push(setTimeout(function () {
          if (!ACTIVE) { return; }
          try {
            var extra = hideGameUI();
            for (var i = 0; i < extra.length; i++) {
              var el = extra[i].el;
              var dupe = false;
              for (var j = 0; j < ACTIVE.hiddenUI.length; j++) {
                if (ACTIVE.hiddenUI[j].el === el) { dupe = true; break; }
              }
              if (!dupe) { ACTIVE.hiddenUI.push(extra[i]); }
            }
          } catch (e2) {}
        }, ms));
      });

      ACTIVE.fillLights = addFillLight(game);

      // Hide gameplay while the film owns the frame.
      game.playing = false;
      game.pause = false;
      game._camOverride = true;

      // ── Skip affordance ──────────────────────────────────────────────────────
      // A BUTTON, deliberately, and not a key.
      //
      // A keyboard shortcut is the wrong shape for this in a driving game: W/S
      // brake and accelerate, Space is the handbrake, and every arrow key is
      // taken. Binding a skip to whatever key is left means either a control the
      // player uses mid-lesson or a chord nobody discovers. A visible button
      // costs one tap, is reachable with a thumb on a phone, and cannot be hit
      // by accident while driving.
      //
      // It fades in ~1s after the film starts rather than being present on frame
      // one, so it never competes with the opening shot for attention but is
      // already there if the viewer decides immediately.
      attachSkip(ACTIVE);

      // The opening shot, applied now that ACTIVE exists.
      //
      // Both calls are required and the order matters. applyShot() places the
      // camera so frame 1 is not the default chase view (a visible snap on the
      // opening frame reads as a bug, not as style); onShotEnter() fires that
      // shot's audio block — ambience, stinger, and its spoken line. Firing the
      // audio before the camera lands means the film starts talking over a shot
      // the audience has not seen yet.
      // Crime-scene dressing is REVEALED, not pre-built into the street. cinematics.js
      // parks it invisible and applyShot() switches it on, so the opening crane
      // sees an empty junction and the apparatus only arrives once something has
      // happened.
      applyShot(0);
      applyTags();
      onShotEnter(ACTIVE.script[0]);
      // The opening frame must already be graded. onShotEnter() only publishes
      // ACTIVE.fx; updateOverlay() is what reads it, and that does not run until
      // the first tick — so without this the film's first frame is an ungraded
      // flash of daylight with full-strength scanlines.
      try { updateOverlay(ACTIVE.script[0], 0, ACTIVE); } catch (eFirst) {}
      return true;
    } catch (e) {
      console.warn('[Cutscene] start() failed — continuing without film:', e);
      teardownOverlay(ov);
      destroyCast(cast);
      releaseNPCs(borrowed);
      if (hiddenUI) { restoreGameUI(hiddenUI); }
      try { document.body.classList.remove('cs-playing'); } catch (e1) {}
      if (game) { game.playing = true; game._camOverride = false; }
      ACTIVE = null;
      return false;
    }
  }

  function applyShot(p) {
    if (!ACTIVE) { return; }
    var shot = ACTIVE.script[ACTIVE.idx];
    if (!shot) { return; }
    var S = window.Shots;
    try {
      if (S && S.applyCamera) {
        S.applyCamera(ACTIVE.game, shot, p, ACTIVE.game._storyAnchors || null);
      }
      if (S && S.applyMotion) {
        S.applyMotion(shot, p, {
          actors: ACTIVE.cast ? ACTIVE.cast.actors : null,
          game: ACTIVE.game,
          dt: ACTIVE._dt
        });
      }
    } catch (e) {}
    // An act change (night → day) is a lighting change, not a camera change.
    // Applied here so it lands on the first frame of the shot that needs it.
    try {
      if (window.Cinematics && typeof window.Cinematics.applyAct === 'function') {
        window.Cinematics.applyAct(ACTIVE.game, shot.act);
      }
    } catch (e2) {}

    // `noRain` overrides the act. The world rain is a 90m box centred on the
    // junction, so a camera INSIDE the Fortuner (shot 6) would otherwise have
    // 1200 streaks between the lens and the interior — rain falling through the
    // roof. The act decides whether it is raining; this decides whether the
    // camera can see it, and those are different questions.
    try {
      if (ACTIVE.game && ACTIVE.game._stageRain) {
        ACTIVE.game._stageRain.visible = shot.noRain ? false : !!(ACTIVE.game._stageActRain !== false);
      }
    } catch (eRain) {}
    applyTags();
    // Aftermath handling (Shot 6 of Level 1 prologue): Vikram's bike toppled and fallen officer on road
    // Crime-scene dressing is REVEALED, not pre-built into the street. cinematics.js
    // parks the barricade, markers, sheet, cones and light bars invisible and
    // this is what switches them on — so the opening crane sees an empty junction
    // and the apparatus of an investigation only arrives once something has
    // happened. `shot.clean` forces it back off for a flash-forward.
    try {
      if (ACTIVE.game) {
        var wantsAftermath = !!shot.aftermath && !shot.clean;
        if (wantsAftermath && typeof ACTIVE.game._aftermathOn === 'function') { ACTIVE.game._aftermathOn(); }
        else if (!wantsAftermath && typeof ACTIVE.game._aftermathOff === 'function') { ACTIVE.game._aftermathOff(); }
      }
    } catch (eAfter) {}

    if (shot.aftermath) {
      if (ACTIVE.cast && ACTIVE.cast.actors && ACTIVE.cast.actors.vikram) {
        var vBike = ACTIVE.cast.actors.vikram;
        vBike.rotation.z = Math.PI / 2.3;
        vBike.position.y = 0.22;
        if (vBike.userData && vBike.userData.rider) {
          vBike.userData.rider.visible = false;
        }
      }
      if (!ACTIVE._fallenOfficerMesh && typeof window._buildFallenOfficer === 'function') {
        var fo = window._buildFallenOfficer();
        if (fo) {
          fo.position.set(4.0, 0, -12.3);
          ACTIVE.game.scene.add(fo);
          ACTIVE._fallenOfficerMesh = fo;
        }
      }
    } else {
      if (ACTIVE.cast && ACTIVE.cast.actors && ACTIVE.cast.actors.vikram) {
        var vBike2 = ACTIVE.cast.actors.vikram;
        if (vBike2.rotation.z !== 0) {
          vBike2.rotation.z = 0;
          vBike2.position.y = 0;
          if (vBike2.userData && vBike2.userData.rider) {
            vBike2.userData.rider.visible = true;
          }
        }
      }
      if (ACTIVE._fallenOfficerMesh) {
        try { ACTIVE.game.scene.remove(ACTIVE._fallenOfficerMesh); } catch (e) {}
        ACTIVE._fallenOfficerMesh = null;
      }
    }

    // Sub-shot audio cues (a sting 40% into a shot) are evaluated from the
    // tick, because the shot's own start already fired in onShotEnter.
    try {
      if (window.StoryAudio && window.StoryAudio.applyTimed) {
        window.StoryAudio.applyTimed(shot, p);
      }
    } catch (e3) {}
  }

  /**
   * A shot has just become the current one. Fires its audio block once.
   *
   * Separated from applyShot() because applyShot() runs EVERY FRAME — starting a
   * voice or a noise burst from there would restack the utterance sixty times a
   * second and produce a continuous buzz instead of a line of dialogue.
   */
  function onShotEnter(shot) {
    if (!ACTIVE || !shot) { return; }
    try {
      if (window.StoryAudio && window.StoryAudio.applyShot) {
        window.StoryAudio.applyShot(shot, ACTIVE.idx);
      }
    } catch (e) {}

    // Overlay treatment for this cut. Everything lens-facing is decided here,
    // once, because these are all animated transitions — restarting one per
    // frame is what makes an overlay strobe.
    try {
      var fx = shotFx(shot);
      ACTIVE.fx = fx;
      ACTIVE.osdBase = (fx.osdBase != null) ? fx.osdBase : 3 * 3600 + 14 * 60 + 18;
      ACTIVE.osdElapsed = 0;
      ACTIVE.osdText = osdClockText(0, ACTIVE.osdBase);
      // Empty, not null, for a shot with no OSD: the mid-frame counter is then
      // CLEARED on the way out of a surveillance shot. Leaving the last CCTV
      // timecode sitting in the element means the next OSD shot that only sets a
      // clock opens on a stale counter, and the two disagree by however long the
      // film ran in between.
      ACTIVE.osdTcText = fx.osdTc ? osdTimecode(0, ACTIVE.osdBase) : '';

      // A shot that declares `flashAt` blows out at that point in the shot.
      // The flag is re-armed here; the tick fires it exactly once.
      ACTIVE._flashAt = (shot.flashAt != null) ? shot.flashAt : null;
      ACTIVE._flashFired = false;

      // A wet-lens wipe is driven from the tick (see the timePass branch below),
      // not from here — a wiper needs the ACTIVE record and must be abortable
      // when the film ends.

      // Restore the investigation overlay's own copy for a shot that carries no
      // `osd`. Leaving the previous shot's CCTV text sitting in the DOM is
      // invisible (the whole OSD is at opacity 0) but it is a lie about what the
      // overlay currently says, and the first shot that DOES use `osd` without
      // overriding every field would inherit a stranger's camera name.
      if (!shot || !shot.osd) {
        ACTIVE.fx.osdBanner = 'MUMBAI TRAFFIC CRIME INVESTIGATION // SURVEILLANCE FEED';
        ACTIVE.fx.osdGps = 'GPS: 19.0596° N, 72.8295° E // LINKING RD JUNCTION';
        ACTIVE.fx.osdUnit = 'UNIT: BANDRA-WEST-04 // AUDIO: BANDPASS 104.2MHz';
        ACTIVE.fx.osdRec = 'REC · 4K 60FPS';
      }
    } catch (e2) {}
  }

  /**
   * Show only the nametags this shot actually needs.
   *
   * A tag appears when the shot speaks for that actor, or when the shot names
   * them in `tagIds`. Everything else stays hidden. Cheaper to reason about than
   * fading per-tag over time, and it means a shot can never end up with three
   * labels on screen because the previous shot happened to have three speakers.
   */
  function applyTags() {
    if (!ACTIVE || !ACTIVE.tags || !ACTIVE.tags.length) { return; }
    var shot = ACTIVE.script[ACTIVE.idx];
    if (!shot) { return; }
    var speaker = shot.sub && shot.sub.speaker ? String(shot.sub.speaker).trim() : '';
    var explicit = shot.tagIds || null;
    for (var i = 0; i < ACTIVE.tags.length; i++) {
      var t = ACTIVE.tags[i];
      if (!t || !t.sprite) { continue; }
      var show = false;
      try {
        if (explicit) {
          show = explicit.indexOf(t.id) >= 0;
        }
      } catch (e) {}
      try { t.sprite.visible = show; } catch (e2) {}
    }
  }

  /**
   * Begin the prologue for `level`.
   *
   * If a STAGE exists for this level, the FILM map is built first, and the
   * PLAYABLE map is rebuilt on the way out (before onEnd callbacks fire). That
   * two-build pass is the entire reason story/stage.js exists.
   *
   * Returns true when a film actually started.
   */
  function begin(game, level) {
    if (ACTIVE) { return false; }
    var script = null;
    try { script = resolveScript(level); } catch (e) { script = null; }
    if (!script || !script.length) { return false; }
    if (!game || !game.scene || !game.camera) { return false; }

    var story = storyFor(level.id);
    // Three independent ways a film may be forced to play. `alwaysReplay` is the
    // campaign's "skipping must not dismiss this" flag; `force` is a one-off on
    // the script or the campaign; the seen flag is the normal gate for every
    // other level.
    var force = false;
    try { force = !!(script.force || (story && (story.force || story.alwaysReplay))); } catch (e) { force = false; }
    if (!force && hasSeen(level.id)) { return false; }

    var stage = stageFor(level.id);
    var stageBuilt = false;

    // ── Pass 1: the film map ──────────────────────────────────────────────
    if (stage && stage.map && typeof game._buildScene === 'function') {
      try {
        game._buildScene(level.mode, stage.map);
        stageBuilt = true;
        try {
          if (window.Cinematics && typeof window.Cinematics.dressStage === 'function') {
            window.Cinematics.dressStage(game, stage, story);
          }
        } catch (e3) {
          console.warn('[Cutscene] dressStage failed — continuing with bare map:', e3);
        }
      } catch (e) {
        console.warn('[Cutscene] stage build failed — falling back to the playable map:', e);
        stageBuilt = false;
      }
    }

    var started = start(game, script, {
      level: level,
      levelId: level.id,
      cast: (story && story.cast) || null,
      borrow: (story && story.borrow) || null,
      tags: (story && story.tags) || null,
      title: (story && story.title) || null,
      kind: 'prologue'
    });

    if (!started) {
      // The film could not run. If we already swapped the map, put the playable
      // one back so the lesson is not played on the wrong geometry.
      if (stageBuilt) {
        try { game._buildScene(level.mode); } catch (e4) {}
      }
      return false;
    }

    ACTIVE.stage = stageBuilt ? stage : null;
    ACTIVE.levelConfig = level;
    return true;
  }

  /**
   * Play a mid-level beat on the CURRENT map.
   *
   * Called from an objective milestone. No map is rebuilt: the film borrows the
   * world the player is already driving, then hands it straight back, so the
   * lesson resumes from exactly where it was interrupted.
   *
   * @param game    the Driving game
   * @param levelId lesson id
   * @param beatId  optional; matches `after` in campaign.js when omitted
   */
  function beat(game, levelId, beatId) {
    if (ACTIVE) { return false; }
    if (!game || !game.scene || !game.camera) { return false; }
    var story = storyFor(levelId);
    if (!story || !story.beats || !story.beats.length) { return false; }

    // A beat marked `once` plays a single time per browser. A campaign that re-forces
    // its films (`alwaysReplay`) implies its beats replay too — otherwise
    // "play it until I skip it" would hold for the prologue and quietly fail for
    // the cliffhanger hanging off the last objective, which is the one the player
    // actually came for.
    var replayAll = !!story.alwaysReplay;
    var chosen = null;
    var chosenIdx = -1;
    for (var i = 0; i < story.beats.length; i++) {
      var b = story.beats[i];
      if (!b || !b.shots || !b.shots.length) { continue; }
      if (beatId != null && String(b.after) !== String(beatId)) { continue; }
      if (!replayAll && b.once !== false && beatSeen(levelId, b.after != null ? b.after : i)) { continue; }
      chosen = b; chosenIdx = i; break;
    }
    if (!chosen) { return false; }

    var S = window.Shots;
    var script = S && S.prepare ? S.prepare(chosen.shots) : chosen.shots;
    var ok = start(game, script, {
      level: null,
      levelId: levelId,
      // A beat's own cast, in PLAYABLE coordinates. Deliberately NOT the campaign's
    // stage cast: those actors belong to the film map, and spawning them here
    // would put a dead man's motorcycle back on the road mid-lesson.
    cast: chosen.cast || null,
      borrow: chosen.borrow || null,
      tags: chosen.tags || null,
      title: chosen.title || null,
      kind: 'beat',
      beatId: chosen.after != null ? chosen.after : chosenIdx
    });
    return ok;
  }

  /**
   * Which beat, if any, belongs to a completed objective. Exposed so
   * game_core can ask without this module reaching into task state.
   */
  function beatForTask(levelId, taskId) {
    var story = storyFor(levelId);
    if (!story || !story.beats || !story.beats.length) { return null; }
    // Same rule as beat() — the two must agree or the beat will be found here,
    // queued, and then refused by beat(), which reads as a beat that silently
    // never plays.
    var replayAll = !!story.alwaysReplay;
    for (var i = 0; i < story.beats.length; i++) {
      var b = story.beats[i];
      if (!b || String(b.after) !== String(taskId)) { continue; }
      if (!replayAll && b.once !== false && beatSeen(levelId, b.after)) { continue; }
      return b;
    }
    return null;
  }

  /** Advance the timeline. Returns true while the film still owns the frame. */
  function tick(game) {
    if (!ACTIVE) { return false; }

    // Wall-clock, not accumulated frame deltas. A cinematic has an authored
    // running time: if the device drops below ~20fps, clamping dt would stretch
    // every shot and the film would drag.
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    var frameDt = (ACTIVE.lastFrameAt ? (now - ACTIVE.lastFrameAt) / 1000 : 0.016);
    ACTIVE.lastFrameAt = now;
    // Respect a pause. `performance.now()` keeps advancing while paused, so
    // without this the film plays straight through a paused game.
    if (game && game.pause) { return true; }
    try { enforceHUD(ACTIVE.hiddenUI); } catch (e) {}
    // Clamp only what feeds character animation, so a long hitch does not
    // teleport a walking actor.
    ACTIVE._dt = Math.min(Math.max(frameDt, 0.001), 0.1);

    try {
      var shot = ACTIVE.script[ACTIVE.idx];
      if (!shot) { finish(true); return false; }
      var durMs = Math.max(50, (shot.dur || 3) * 1000);
      var elapsed = now - ACTIVE.shotStartedAt;
      var p = elapsed / durMs;

      // Lens rain advances on wall-clock dt. Gated on the act so a dry daylight
      // beat pays nothing for a rain canvas it never shows.
      if (ACTIVE.overlay && ACTIVE.overlay.rainCanvas && ACTIVE.fx && ACTIVE.fx.lensRain > 0) {
        stepRainDrops(ACTIVE.overlay.rainCanvas, ACTIVE._dt);
      }

      // Surveillance clock: real elapsed seconds, recomputed each frame so a
      // stall cannot desynchronise it from the film.
      if (ACTIVE.osdClockBase != null) { /* kept for introspection */ }
      if (ACTIVE.overlay && ACTIVE.overlay.osdClock && ACTIVE.osdBase != null) {
        ACTIVE.osdElapsed = (ACTIVE.osdElapsed || 0) + ACTIVE._dt;
        var txt = osdClockText(ACTIVE.osdElapsed, ACTIVE.osdBase);
        if (txt !== ACTIVE.osdText) {
          ACTIVE.osdText = txt;
          ACTIVE.overlay.osdClock.textContent = txt;
        }
        // The mid-frame timecode runs off the same elapsed accumulator, so the
        // two counters can never disagree — which is what would give away that
        // they are DOM elements rather than a burn-in.
        if (ACTIVE.overlay.osdTc && ACTIVE.osdTcText !== null) {
          ACTIVE.osdTcText = ACTIVE.osdTcText ? osdTimecode(ACTIVE.osdElapsed, ACTIVE.osdBase) : '';
        }
      }

      // The muzzle flash fires once, at its authored mark, from the tick rather
      // than from applyShot() — which runs every frame.
      if (ACTIVE._flashAt != null && !ACTIVE._flashFired && p >= ACTIVE._flashAt) {
        ACTIVE._flashFired = true;
        triggerFlash(ACTIVE, shot.flashGain);
      }

      // Transition clock runs from the start of each shot. Default is a short
      // dissolve; opt out per shot with transition:'cut'.
      var transDur = (shot.transition === 'cut') ? 0 : (shot.dissolve != null ? shot.dissolve : 0.44);
      if (transDur !== ACTIVE.transDur) {
        ACTIVE.transDur = transDur;
        ACTIVE.transT = 0;
      }
      ACTIVE.transT = ACTIVE.transT + ACTIVE._dt;

      // A time-pass cut also fires the wiper. `applyTimed` owns the one-shot
      // guards, but the wiper is an overlay concern and needs the ACTIVE record,
      // so it is evaluated here against its own key instead.
      if (shot.timePass === true && ACTIVE.fx && ACTIVE.fx.wiper && shot.wipe !== false) {
        var wk = 'wipe:' + ACTIVE.idx;
        if (shot['__' + wk] !== true) {
          shot['__' + wk] = true;
          triggerWiper(ACTIVE);
        }
      }

      applyShot(p > 1 ? 1 : p);
      updateOverlay(shot, p > 1 ? 1 : p, ACTIVE);

      // Step cast characters (idle breathing, blinking, joint kinematics)
      if (ACTIVE.cast && ACTIVE.cast.actors) {
        var dt = ACTIVE._dt;
        Object.keys(ACTIVE.cast.actors).forEach(function (aid) {
          var act = ACTIVE.cast.actors[aid];
          if (act && act.userData && typeof act.userData.update === 'function') {
            act.userData.update(dt);
          }
          if (act && act.userData && act.userData.rider && act.userData.rider.userData && typeof act.userData.rider.userData.update === 'function') {
            act.userData.rider.userData.update(dt);
          }
        });
      }

      // Step any prop that owns its own animation (today: the patrol light bars'
      // alternating strobe). Driven from the film clock so a paused game freezes
      // them too — a strobe that keeps flashing while the film is paused is the
      // sort of detail that makes a pause feel like a bug.
      try {
        if (ACTIVE.game && ACTIVE.game._stageAftermath && ACTIVE.game._stageAftermath.visible) {
          ACTIVE.game._stageAftermath.traverse(function (o) {
            if (o && o.userData && typeof o.userData.stageTick === 'function') {
              try { o.userData.stageTick(ACTIVE._dt); } catch (eTick) {}
            }
          });
        }
      } catch (eStage) {}

      // Step falling monsoon rain particles dynamically
      if (game && game.scene) {
        var rainMesh = game.scene.getObjectByName('stage-rain');
        if (rainMesh && rainMesh.geometry && rainMesh.geometry.attributes && rainMesh.geometry.attributes.position) {
          var posAttr = rainMesh.geometry.attributes.position;
          var arr = posAttr.array;
          var rainSpeed = ACTIVE._dt * 42;
          for (var ri = 1; ri < arr.length; ri += 3) {
            arr[ri] -= rainSpeed;
            if (arr[ri] < 0) { arr[ri] += 38; }
          }
          posAttr.needsUpdate = true;
        }
      }

      // Advance one shot at a time, carrying the overshoot forward so a long
      // stall cannot desynchronise the timeline.
      var guard = 0;
      while (elapsed >= durMs && guard < 64) {
        elapsed -= durMs;
        ACTIVE.shotStartedAt += durMs;
        ACTIVE.idx++;
        guard++;
        if (ACTIVE.idx >= ACTIVE.script.length) {
          if (ACTIVE.script && ACTIVE.script.loop) {
            ACTIVE.idx = 0;
            ACTIVE.shotStartedAt = now;
            shot = ACTIVE.script[0];
            durMs = Math.max(50, (shot.dur || 3) * 1000);
            applyShot(0);
            onShotEnter(shot);
            break;
          } else {
            finish(true);
            return false;
          }
        }
        shot = ACTIVE.script[ACTIVE.idx];
        durMs = Math.max(50, (shot.dur || 3) * 1000);
        applyShot(0);
        onShotEnter(shot);
      }
      return true;
    } catch (e) {
      console.warn('[Cutscene] tick() failed — handing control back:', e);
      finish(false);
      return false;
    }
  }

  function skip() {
    if (!ACTIVE) { return; }
    try {
      // Jump straight to the end: hold the last frame's framing, then release.
      var last = ACTIVE.script[ACTIVE.script.length - 1];
      if (last) {
        var S = window.Shots;
        if (S && S.applyCamera) { S.applyCamera(ACTIVE.game, last, 1, ACTIVE.game._storyAnchors || null); }
      }
    } catch (e) {}
    finish(true, true);
  }

  function finish(markPlayed, skipped) {
    if (!ACTIVE) { return; }
    var state = ACTIVE;
    ACTIVE = null;
    try {
      if (state.detachSkip) { state.detachSkip(); }
      // Brief black so the handoff is not a hard cut.
      if (state.overlay && state.overlay.fade) {
        state.overlay.fade.style.transition = 'opacity 220ms linear';
        state.overlay.fade.style.opacity = '1';
      }
    } catch (e) {}

    (state.rehideTimers || []).forEach(function (t) { try { clearTimeout(t); } catch (e) {} });
    // Overlay animations run on their own timers and would keep moving over the
    // HUD after the film released the frame.
    try { if (state._wiperTimer) { clearTimeout(state._wiperTimer); state._wiperTimer = 0; } } catch (eT) {}
    try { if (state._flashTimer) { clearTimeout(state._flashTimer); state._flashTimer = 0; } } catch (eT2) {}
    // Kill the rain loop's canvas immediately; the overlay teardown below removes
    // the element, but a queued tick between those two would throw on a dead ctx.
    try { if (state.overlay && state.overlay.rainCanvas) { state.overlay.rainCanvas.width = 0; state.overlay.rainCanvas.height = 0; } } catch (eT3) {}
    // Film audio must stop with the film. Leaving a rain loop or a half-spoken
    // line running under gameplay is the kind of thing that makes a whole build
    // feel haunted.
    try {
      if (window.StoryAudio && window.StoryAudio.endFilm) {
        window.StoryAudio.endFilm(skipped ? 120 : 400);
      }
    } catch (e) {}
    removeLights(state.fillLights);
    releaseTags(state.tags);
    releaseNPCs(state.borrowed);
    destroyCast(state.cast);
    if (state._fallenOfficerMesh && state.game && state.game.scene) {
      try { state.game.scene.remove(state._fallenOfficerMesh); } catch (e0) {}
      state._fallenOfficerMesh = null;
    }
    restoreGameUI(state.hiddenUI);
    try { document.body.classList.remove('cs-playing'); } catch (e) {}

    // Hand control back to the engine. Order matters: reset the camera override
    // before clearing `playing`, or the chase camera bails out for one frame.
    var rebuildErr = null;
    try {
      var g = state.game;
      // ── Pass 2: swap back to the playable map ───────────────────────────
      // Must happen BEFORE `playing` is restored, because `_buildScene()`
      // re-seeds world/npcs/cps and re-places the player. A frame of gameplay
      // against the film map would drop the player into a stage with no route.
      if (state.stage) {
        try {
          g._buildScene(state.levelConfig.mode);
          try {
            if (window.Cinematics && typeof window.Cinematics.clearStage === 'function') {
              window.Cinematics.clearStage(g);
            }
          } catch (e1) {}
        } catch (e2) {
          rebuildErr = e2;
          console.warn('[Cutscene] playable-map rebuild failed:', e2);
        }
      }

      g._camOverride = false;
      g._enterState = 'IDLE';
      if (g.camera && typeof state.prevFov === 'number') {
        g.camera.fov = state.prevFov;
        g.camera.updateProjectionMatrix();
      }
      showPlayerMeshes(g, state.hiddenPlayer);
      g.playing = true;
      // A beat interrupts a running lesson: restoring the player's own pause
      // state matters, but a prologue always resumes unpaused.
      g.pause = (state.kind === 'beat') ? !!state.prevPause : false;
      if (g.clock) { try { g.clock.getDelta(); } catch (e3) {} }
    } catch (e) {}

    if (markPlayed !== false && !rebuildErr) {
      if (state.kind === 'beat') {
        var bStory = storyFor(state.levelId);
        if (!(bStory && bStory.alwaysReplay) && state.beatId != null) {
          markBeatSeen(state.levelId, state.beatId);
        }
      } else if (state.level) {
        // `alwaysReplay` is checked here as well as in begin(). Writing the seen
        // mark for a campaign that re-forces its film is harmless on its own —
        // begin() ignores the flag — but it leaves a lie in localStorage that
        // any future reader (a replay button, a "continue" flow, a dev tool) will
        // take at face value and act on.
        var sObj = storyFor(state.level.id);
        if (!(sObj && sObj.alwaysReplay)) {
          markSeen(state.level.id);
        }
      }
    }

    // Fire deferred work (e.g. showing the mission briefing) only now that the
    // film has released the frame and the HUD is visible again.
    var cbs = state.onEnd || [];
    for (var i = 0; i < cbs.length; i++) {
      try { cbs[i](); } catch (e4) {}
    }

    setTimeout(function () { teardownOverlay(state.overlay); }, skipped ? 240 : 300);
  }

  /**
   * Queue a callback to run when the active film finishes (or immediately if
   * none is running). Used to hold back the mission briefing modal so it cannot
   * cover the prologue, and to rebuild the playable map before it appears.
   */
  function onEnd(fn) {
    if (typeof fn !== 'function') { return; }
    if (!ACTIVE) { try { fn(); } catch (e) {} return; }
    ACTIVE.onEnd = ACTIVE.onEnd || [];
    ACTIVE.onEnd.push(fn);
  }

  /**
   * Replay the prologue for a level. Pass the id explicitly, or omit it to use
   * the level currently loaded.
   */
  function replay(levelId) {
    var id = levelId;
    if (id === undefined || id === null) {
      id = LAST_LEVEL_ID;
      if (id === undefined || id === null) {
        try {
          if (window.game && window.game.lvId !== undefined && window.game.lvId !== null) {
            id = window.game.lvId;
          } else if (window.ui && window.ui.cur && window.ui.cur.id !== undefined && window.ui.cur.id !== null) {
            id = window.ui.cur.id;
          }
        } catch (e) {}
      }
    }
    if (id !== undefined && id !== null) { clearSeen(id); }
  }

  /**
   * Play the loaded level's prologue again, right now, on the CURRENT map.
   *
   * `replay()` only clears the seen flag, which does nothing until the page is
   * reloaded — useless when the player is staring at the briefing card asking
   * to see it again. This bypasses the seen gate and re-runs the shot script on
   * the already-built set, so no level needs reloading and no map is rebuilt.
   */
  function restart() {
    if (ACTIVE) { return false; }
    var game = null, lv = null;
    try { game = window.game; } catch (e) { game = null; }
    try { lv = (window.ui && window.ui.cur) ? window.ui.cur : null; } catch (e) { lv = null; }
    if (!game || !lv || lv.id === undefined || lv.id === null) { return false; }
    LAST_LEVEL_ID = lv.id;
    var story = storyFor(lv.id);
    var script = resolveScript(lv);
    if (!script) { return false; }
    var started = false;
    try {
      started = start(game, script, {
        level: lv,
        levelId: lv.id,
        cast: (story && story.cast) || null,
        borrow: (story && story.borrow) || null,
        tags: (story && story.tags) || null,
        title: (story && story.title) || null,
        kind: 'prologue'
      });
    } catch (e) {
      console.warn('[Cutscene] restart() failed:', e);
      started = false;
    }
    // Put the briefing card back when the replay finishes, so the flow resumes
    // exactly where it left off instead of dropping the player into gameplay.
    // NOTE: the seen flag is deliberately NOT cleared here. This path bypasses
    // the seen gate (it calls start() directly, not begin()), so the film plays
    // without un-marking anything — the level stays seen and the next real
    // playthrough is not given a second film.
    if (started) {
      onEnd(function () { try { window.showGtaMissionIntro(lv.id); } catch (e) {} });
    }
    return started;
  }

  /** Jump to the start of shot `idx` without ending the film. */
  function seek(idx) {
    if (!ACTIVE) { return false; }
    var i = Math.max(0, Math.min(ACTIVE.script.length - 1, idx | 0));
    ACTIVE.idx = i;
    ACTIVE.shotStartedAt = (window.performance && performance.now) ? performance.now() : Date.now();
    try {
      applyShot(0);
      // onShotEnter() is required here, not just applyShot(). applyShot moves the
      // camera and toggles the aftermath dressing, but the overlay GRADE, the OSD
      // copy and the lens rain are all published by onShotEnter — so a seek that
      // skipped it landed on a surveillance shot still wearing the previous
      // shot's clock, banner and rain state.
      onShotEnter(ACTIVE.script[i]);
      updateOverlay(ACTIVE.script[i], 0, ACTIVE);
    } catch (e) {}
    return true;
  }

  /** True when the loaded level has a prologue worth offering a Replay for. */
  function hasPrologue() {
    var lv = null;
    try { lv = (window.ui && window.ui.cur) ? window.ui.cur : null; } catch (e) { return false; }
    if (!lv) { return false; }
    var script = null;
    try { script = resolveScript(lv); } catch (e) { script = null; }
    return !!(script && script.length);
  }

  /** True when this level has a purpose-built film map in story/stage.js. */
  function hasStage(levelId) {
    var id = levelId;
    if (id === undefined || id === null) {
      try { id = (window.ui && window.ui.cur) ? window.ui.cur.id : null; } catch (e) {}
    }
    return !!stageFor(id);
  }

  window.Cutscene = {
    begin: begin,
    beat: beat,
    beatForTask: beatForTask,
    tick: tick,
    skip: skip,
    onEnd: onEnd,
    replay: replay,
    restart: restart,
    seek: seek,
    hasPrologue: hasPrologue,
    hasStage: hasStage,
    clearSeen: clearSeen,
    hasSeen: hasSeen,
    isActive: function () { return !!ACTIVE; },
    isBeat: function () { return !!(ACTIVE && ACTIVE.kind === 'beat'); }
  };
})();