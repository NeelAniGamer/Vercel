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
    '#cutscene-root .cs-bar{position:absolute;left:0;right:0;height:12vh;min-height:48px;background:#030508;transform:scaleY(0);will-change:transform;z-index:20010;border-bottom:1px solid rgba(255,255,255,0.08);}' +
    '#cutscene-root .cs-bar.top{top:0;transform-origin:top center;}' +
    '#cutscene-root .cs-bar.bot{bottom:0;transform-origin:bottom center;border-bottom:none;border-top:1px solid rgba(255,255,255,0.08);}' +
    '#cutscene-root .cs-vig{position:absolute;inset:0;opacity:0;will-change:opacity;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 60%,rgba(3,6,12,0.28) 100%);z-index:20001;}' +
    '#cutscene-root .cs-scanlines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 3px);opacity:0.03;pointer-events:none;z-index:20002;}' +
    '#cutscene-root .cs-fade{position:absolute;inset:0;background:#000;opacity:0;will-change:opacity;z-index:20015;}' +
    '#cutscene-root .cs-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:20016;transition:opacity 0.22s ease-out;}' +
    '#cutscene-root .cs-rain-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20003;opacity:0.85;}' +
    '#cutscene-root .cs-title{position:absolute;left:0;right:0;top:38%;text-align:center;color:#fff;opacity:0;will-change:opacity,transform;font-size:clamp(16px,4.5vw,28px);font-weight:900;letter-spacing:.22em;text-transform:uppercase;text-shadow:0 2px 20px rgba(0,0,0,0.95);z-index:20012;}' +
    // TACTICAL FOUND-FOOTAGE / INTERCEPTOR OSD
    '#cutscene-root .cs-osd{position:absolute;inset:12vh 24px calc(12vh + 10px) 24px;pointer-events:none;z-index:20005;display:flex;flex-direction:column;justify-content:space-between;opacity:0;transition:opacity .45s ease;}' +
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
    '#cutscene-root .cs-transceiver{position:absolute;left:50%;transform:translateX(-50%) translateY(14px);bottom:calc(12vh + 14px);width:min(94vw,760px);display:flex;align-items:center;gap:14px;padding:12px 18px;border-radius:14px;background:rgba(8,12,22,0.92);border:1px solid rgba(94,211,240,0.32);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.85),0 0 20px rgba(94,211,240,0.12);color:#fff;opacity:0;will-change:opacity,transform;z-index:20025;transition:transform .22s cubic-bezier(0.16,1,0.3,1),opacity .22s ease;}' +
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
    // THEATRICAL SUBTITLES
    '#cutscene-root .cs-theatrical-sub{position:absolute;left:50%;transform:translateX(-50%) translateY(6px);bottom:calc(12vh + 12px);max-width:min(90vw,880px);width:max-content;display:flex;flex-direction:column;align-items:center;text-align:center;pointer-events:none;z-index:20026;opacity:0;transition:opacity .2s ease,transform .2s ease;}' +
    '#cutscene-root .cs-theatrical-speaker{font-family:Inter,system-ui,sans-serif;font-size:clamp(10px,1.8vw,12px);font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#facc15;margin-bottom:4px;text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 10px rgba(0,0,0,0.8);}' +
    '#cutscene-root .cs-theatrical-line{font-family:Inter,system-ui,sans-serif;font-size:clamp(14px,2.8vw,19px);font-weight:600;line-height:1.4;color:#ffffff;letter-spacing:0.02em;text-shadow:0 2px 4px rgba(0,0,0,0.95),0 0 12px rgba(0,0,0,0.85),0 0 24px rgba(0,0,0,0.7);}' +
    // WINDSHIELD WIPER BLADE
    '#cutscene-root .cs-wiper{position:absolute;bottom:0;left:15%;width:9px;height:125vh;background:linear-gradient(to right,rgba(15,20,30,0.9),rgba(45,55,75,0.95),rgba(10,15,25,0.9));transform-origin:bottom center;transform:rotate(-68deg);z-index:20004;opacity:0;pointer-events:none;box-shadow:0 0 16px rgba(0,0,0,0.9);transition:transform 0.45s cubic-bezier(0.2,0.8,0.3,1),opacity 0.2s ease;}' +
    '#cutscene-root .cs-skip-btn{position:absolute;top:max(16px,calc(12vh + 12px));right:18px;z-index:20030;' +
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
    'body.cs-playing #hud,body.cs-playing #hudbar,body.cs-playing #hwrap,body.cs-playing #player-hud-card,body.cs-playing #top-right-hud-stack,body.cs-playing #tasks-container,body.cs-playing #task-tracker,body.cs-playing #objective-overlay,body.cs-playing #challan-summary-box,body.cs-playing #challan-stack,body.cs-playing #cockpit-drive-cluster,body.cs-playing #speed-ctrl,body.cs-playing #gp,body.cs-playing #spgauge,body.cs-playing #boostgauge,body.cs-playing #civic-controls,body.cs-playing #dn-clock,body.cs-playing #hud-ai-synth-btn,body.cs-playing #hud-rd-btn,body.cs-playing #hud-settings-btn,body.cs-playing #mobile-pause-btn,body.cs-playing #camera-joystick,body.cs-playing #kid-pedals,body.cs-playing #kid-steer,body.cs-playing #enter-vehicle-btn,body.cs-playing .hud-dashboard-card,body.cs-playing #mini-map,body.cs-playing #minimap,body.cs-playing #mmc,body.cs-playing #mobile-controls,body.cs-playing .mobile-controls,body.cs-playing #tc,body.cs-playing #play-overlay,body.cs-playing .nav-login-btn,body.cs-playing .lp-modal,body.cs-playing #game-briefing,body.cs-playing #gta-briefing-modal,body.cs-playing #gta-mission-intro,body.cs-playing .gta-intro-overlay,body.cs-playing #daily-bonus-modal,body.cs-playing [class*="daily-bonus"],body.cs-playing .action-btn,body.cs-playing #phone-gps,body.cs-playing #phone-gps-btn,body.cs-playing #sig-ind,body.cs-playing #da,body.cs-playing #ow,body.cs-playing #toast{display:none !important;}' +
    '@media (max-width:480px){#cutscene-root .cs-title{letter-spacing:.1em;font-size:clamp(13px,3.8vw,18px);padding:0 14px;top:34%;text-wrap:balance;}}' +
    '@media (max-width:480px){#cutscene-root .cs-skip-btn{padding:8px 14px;font-size:11px;right:12px;top:max(10px,calc(12vh + 8px));}}' +
    '@media (max-width:480px){#cutscene-root .cs-transceiver{bottom:calc(12vh + 10px);padding:10px 14px;gap:10px;}}' +
    '@media (max-width:480px){#cutscene-root .cs-theatrical-sub{bottom:calc(12vh + 8px);max-width:94vw;}}';

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
    return []; // Handled zero-cost by CSS rule `body.cs-playing ... { display: none !important; }`
  }

  function enforceHUD(saved) {
    // No-op: avoids 60fps getComputedStyle() layout thrashing
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
        r: 0.8 + Math.random() * 2.0,
        speed: 0.30 + Math.random() * 0.60,
        alpha: 0.15 + Math.random() * 0.25
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
    var g = Math.max(0.2, Math.min(1, strength == null ? 0.85 : strength));
    if (ov && ov.flash) {
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

    // 3D Scene muzzle flash illumination: illuminates Vikram, bike, and wet road for ~85ms
    try {
      if (state && state.game && state.game.scene) {
        var sc = state.game.scene;
        var flashLight = new THREE.PointLight(0xffeedd, 16.0 * g, 24, 1.8);
        flashLight.position.set(4.6, 1.35, -12.5);
        sc.add(flashLight);
        setTimeout(function () {
          try { sc.remove(flashLight); if (flashLight.dispose) { flashLight.dispose(); } } catch (eFRem) {}
        }, 85);
      }
    } catch (eFlash3d) {}

    // Camera micro-shake recoil punch (inspired by Max Payne / Sacred Games)
    try {
      if (state && state.game) {
        state.game._camShakeAmt = Math.max(state.game._camShakeAmt || 0, 0.38);
      }
    } catch (eShake) {}
  }

  function buildOverlay() {
    ensureStyle();
    var root = document.createElement('div');
    root.id = 'cutscene-root';
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
      '<div class="cs-theatrical-sub" id="csTheatricalSub">' +
        '<div class="cs-theatrical-speaker" id="csTheatricalSpeaker"></div>' +
        '<div class="cs-theatrical-line" id="csTheatricalLine"></div>' +
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
      theatricalSub: root.querySelector('#csTheatricalSub'),
      theatricalSpeaker: root.querySelector('#csTheatricalSpeaker'),
      theatricalLine: root.querySelector('#csTheatricalLine'),
      skipBtn: root.querySelector('.cs-skip-btn')
    };
  }

  function teardownOverlay(ov) {
    if (!ov || !ov.root) { return; }
    try {
      if (document.activeElement && ov.root.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    } catch (eFoc) {}
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
    { re: /wireless|dispatch|control|radio/i, name: 'Mumbai Police Wireless', dept: 'Bandra Central Control', icon: '📻', col: '#60a5fa' }
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
    if (!ov) { return; }
    if (!text) {
      if (ov.transceiver) {
        ov.transceiver.style.opacity = '0';
        ov.transceiver.style.transform = 'translateX(-50%) translateY(14px)';
      }
      if (ov.theatricalSub) {
        ov.theatricalSub.style.opacity = '0';
        ov.theatricalSub.style.transform = 'translateX(-50%) translateY(6px)';
      }
      return;
    }
    var rawSpeaker = text.speaker ? String(text.speaker).trim() : '';
    var meta = getCharacterMeta(rawSpeaker);
    var line = text.line == null ? '' : String(text.line);
    var isRadio = /radio|wireless|dispatch|control/i.test(rawSpeaker) || !!text.isRadio;

    if (rawSpeaker && rawSpeaker !== LAST_SPEAKER) {
      LAST_SPEAKER = rawSpeaker;
      if (isRadio) {
        try {
          if (window.StoryAudio && typeof window.StoryAudio.sting === 'function') {
            window.StoryAudio.sting('squelch', 0.55);
          }
        } catch (eSq) {}
      }
    }

    if (isRadio) {
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
    } else {
      if (ov.theatricalSpeaker) {
        ov.theatricalSpeaker.textContent = rawSpeaker ? titleCase(rawSpeaker) : '';
      }
      if (ov.theatricalLine) {
        ov.theatricalLine.innerHTML = escapeHtml(line);
      }
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
            try {
              if (mesh.userData && mesh.userData.rider) {
                mesh.remove(mesh.userData.rider);
                mesh.userData.rider = null;
              }
            } catch (eRiderRem) {}
            var rider = window._buildCutsceneRider(d);
            if (rider) {
              // Seated on the saddle, not standing on the pegs: the old mark
              // put feet at y=0.42 and the crane read a man standing ON the bike.
              // The guard-variant rig is also squashed to a seated crouch —
              // there is no sitting clip, and a standing rider breaks every
              // wide shot he is in.
              rider.position.set(0, 0.42, -0.08);
              rider.scale.setScalar(0.92);
              mesh.add(rider);
              mesh.userData = mesh.userData || {};
              mesh.userData.rider = rider;
            }
            // Mumbai Traffic Police motorcycle equipment & lighting for SI Vikram Sawant
            try {
              // Retint motorcycle body to official Mumbai Traffic Police white
              mesh.traverse(function (c) {
                if (c.isMesh && c.material) {
                  var mName = (c.material.name || c.name || '').toLowerCase();
                  if (mName.indexOf('body') >= 0 || mName.indexOf('paint') >= 0 || mName.indexOf('tank') >= 0 || mName.indexOf('fender') >= 0) {
                    c.material = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28, metalness: 0.15 });
                  }
                }
              });

              // Halogen headlamp: chrome bezel housing with recessed lens & forward projection
              var headBezel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16),
                new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
              );
              headBezel.rotation.x = Math.PI / 2;
              headBezel.position.set(0, 0.72, 0.80);
              mesh.add(headBezel);

              var headLens = new THREE.Mesh(
                new THREE.CircleGeometry(0.10, 16),
                new THREE.MeshStandardMaterial({
                  color: 0xfffbeb,
                  emissive: 0xfef08a,
                  emissiveIntensity: 0.35,
                  roughness: 0.1,
                  metalness: 0.1
                })
              );
              headLens.position.set(0, 0.72, 0.826);
              mesh.add(headLens);

              var bSpot = new THREE.SpotLight(0xfff7ed, 0.85, 20, Math.PI / 6, 0.45, 1.8);
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

              // ── Twin Hard-Case Police Pannier Utility Boxes with Yellow/Blue Chevrons ──
              var panMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.1 });
              var panBandMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a }); // Navy Police stripe
              var chevronYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // High-visibility yellow
              [-0.32, 0.32].forEach(function (px) {
                var panBox = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.30, 0.46), panMat);
                panBox.position.set(px, 0.52, -0.56);
                mesh.add(panBox);
                var panStripe = new THREE.Mesh(new THREE.BoxGeometry(0.206, 0.07, 0.38), panBandMat);
                panStripe.position.set(px, 0.52, -0.56);
                mesh.add(panStripe);
                var chevStripe = new THREE.Mesh(new THREE.BoxGeometry(0.208, 0.032, 0.38), chevronYellowMat);
                chevStripe.position.set(px, 0.56, -0.56);
                mesh.add(chevStripe);
              });

              // ── Aerodynamic Clear Front Windscreen & PA Siren Speaker ──────
              var screenMat = new THREE.MeshStandardMaterial({
                color: 0xe0f2fe,
                transparent: true,
                opacity: 0.45,
                roughness: 0.1,
                metalness: 0.1
              });
              var windScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.44), screenMat);
              windScreen.position.set(0, 1.05, 0.72);
              windScreen.rotation.x = -0.32;
              mesh.add(windScreen);

              var sirenMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
              var sirenHorn = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.12, 12), sirenMat);
              sirenHorn.position.set(0.24, 0.58, 0.54);
              sirenHorn.rotation.x = Math.PI / 2;
              mesh.add(sirenHorn);

              // ── Rear Police Radio Mast with Flashing Deep Blue LED Beacon ──
              // Mounted to the kerb side (left, x = -0.22) so it does not obstruct the car view
              var mastPole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.016, 0.02, 1.15, 8),
                new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
              );
              mastPole.position.set(-0.22, 1.10, -0.78);
              mesh.add(mastPole);

              var blueBeaconMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
              var beaconCap = new THREE.Mesh(
                new THREE.CylinderGeometry(0.042, 0.042, 0.10, 12),
                blueBeaconMat
              );
              beaconCap.position.set(-0.22, 1.68, -0.78);
              mesh.add(beaconCap);

              var throwBlue = new THREE.PointLight(0x2563eb, 0.25, 4.0, 2.0);
              throwBlue.position.set(-0.22, 1.70, -0.78);
              mesh.add(throwBlue);

              // ── Front Tubular Crash Guard Bars with Red & Blue Strobes ─────
              var redStrobeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
              var blueStrobeMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });

              var fStrobeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), redStrobeMat);
              fStrobeL.position.set(-0.28, 0.48, 0.44);
              mesh.add(fStrobeL);

              var fStrobeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), blueStrobeMat);
              fStrobeR.position.set(0.28, 0.48, 0.44);
              mesh.add(fStrobeR);

              var throwFrontStrobe = new THREE.PointLight(0x3b82f6, 0.4, 6, 2.0);
              throwFrontStrobe.position.set(0, 0.45, 0.50);
              mesh.add(throwFrontStrobe);

              // Alternating Police Flashing Beacon & Strobe ticker
              var bPhase = 0;
              var bTimer = null;
              var bTick = function (dt) {
                bPhase += (dt || 0.016);
                var pulse = (bPhase % 0.8) < 0.4;
                blueBeaconMat.color.setHex(pulse ? 0x38bdf8 : 0x0c2461);
                throwBlue.intensity = pulse ? 0.35 : 0.05;
                redStrobeMat.color.setHex(pulse ? 0xff2222 : 0x450a0a);
                blueStrobeMat.color.setHex(pulse ? 0x1e3a8a : 0x38bdf8);
                throwFrontStrobe.color.setHex(pulse ? 0xef4444 : 0x3b82f6);
                throwFrontStrobe.intensity = 0.35;
              };
              if (typeof window !== 'undefined' && window.setInterval) {
                bTimer = window.setInterval(function () { bTick(0.05); }, 50);
              }
              mesh.userData = mesh.userData || {};
              mesh.userData.stageTick = bTick;
              mesh.userData.stopTick = function () { if (bTimer) { clearInterval(bTimer); } };
            } catch (eL) {}
          }
          if (mesh && (d.id === 'fortuner' || d.withDriver)) {
            // The Fortuner is the only vehicle in the film that drives, and it was
            // the only one with no lights.
            //
            // THE FIRST VERSION OF THIS HARD-CODED THE OFFSETS — headlamps at
            // z=+2.16, tail lamps at z=-2.16, y=0.72, lateral +/-0.52 — on the
            // assumption that the model was a car-sized box centred on its origin.
            // It is not. Those numbers were guesses about a model nobody had
            // measured, and the film paid for it: red cubes hanging in mid-air over
            // empty road, an orange glow burning inside the bodywork, a yellow disc
            // floating off the front bumper. Emissive boxes are unforgiving — a
            // wrong offset does not look wrong, it looks like a floating object.
            //
            // So: measure the model, then place the lights on the measurement.
            try {
              if (mesh.parent) { mesh.parent.updateMatrixWorld(true); }
              mesh.updateMatrixWorld(true);
              var lBox = new THREE.Box3();
              mesh.traverse(function (o) { if (o.isMesh) { try { lBox.expandByObject(o); } catch (eM) {} } });
              var lSz = new THREE.Vector3(); lBox.getSize(lSz);
              var lCt = new THREE.Vector3(); lBox.getCenter(lCt);

              // A car is roughly 1.4-2.2m wide and 3.5-6m long. Anything outside
              // that is not a car, and scattering lamps around a broken mesh is
              // strictly worse than leaving it dark. Bail instead of guessing.
              var plausible = lSz.x > 0.5 && lSz.x < 3.2 &&
                              lSz.z > 2.0 && lSz.z < 8.0 &&
                              lSz.y > 0.5 && lSz.y < 3.5;

              // The beam is safe unconditionally: a SpotLight has no geometry, so
              // it cannot be misplaced in a way the audience reads as an object.
              var fBeam = new THREE.SpotLight(0xfff7ed, 0.95, 24, Math.PI / 7, 0.45, 1.6);
              fBeam.position.set(0, 0.8, plausible ? lSz.z * 0.5 : 2.2);
              fBeam.target.position.set(0, -0.4, 22);
              mesh.add(fBeam);
              mesh.add(fBeam.target);
              mesh.userData = mesh.userData || {};
              mesh.userData.lights = { beam: fBeam };

              if (plausible) {
                // Box centre expressed in the mesh's own local frame, so the lamp
                // offsets survive whatever scale and rotation the model carries.
                var lc = mesh.worldToLocal(lCt.clone());
                var hx = lSz.x * 0.30;            // Inboard of the wheel arches
                var fz = lc.z + lSz.z * 0.48;     // Front bumper face
                var bz = lc.z - lSz.z * 0.48;     // Rear tailboard face
                var ly = lc.y - lSz.y * 0.06;     // Bumper/fender height (NOT roofline!)

                var headMat = new THREE.MeshStandardMaterial({
                  color: 0xfff3d6,
                  emissive: 0xfef08a,
                  emissiveIntensity: 0.35,
                  roughness: 0.2
                });
                var fHead = new THREE.Mesh(new THREE.BoxGeometry(lSz.x * 0.16, lSz.y * 0.07, 0.06), headMat);
                fHead.position.set(lc.x + hx, ly, fz);
                mesh.add(fHead);
                var fHead2 = fHead.clone();
                fHead2.position.x = lc.x - hx;
                mesh.add(fHead2);

                // Cleanly remove ONLY the side window aperture polygons on the driver and passenger sides
                try {
                  var bodyMesh = null;
                  mesh.traverse(function (c) { if (c.isMesh && c.name === 'body') bodyMesh = c; });
                  if (bodyMesh && bodyMesh.geometry && bodyMesh.geometry.index) {
                    var bGeom = bodyMesh.geometry.clone();
                    bodyMesh.geometry = bGeom;
                    var bPos = bGeom.attributes.position;
                    var bNorm = bGeom.attributes.normal;
                    var bIdx = bGeom.index;
                    var newIndices = [];
                    for (var ti = 0; ti < bIdx.count; ti += 3) {
                      var ia = bIdx.getX(ti), ib = bIdx.getX(ti + 1), ic = bIdx.getX(ti + 2);
                      var xa = bPos.getX(ia), ya = bPos.getY(ia), za = bPos.getZ(ia);
                      var xb = bPos.getX(ib), yb = bPos.getY(ib), zb = bPos.getZ(ib);
                      var xc = bPos.getX(ic), yc = bPos.getY(ic), zc = bPos.getZ(ic);
                      var mX = (xa + xb + xc) / 3;
                      var mY = (ya + yb + yc) / 3;
                      var mZ = (za + zb + zc) / 3;
                      var naX = bNorm ? (bNorm.getX(ia) + bNorm.getX(ib) + bNorm.getX(ic)) / 3 : -1;
                      // Aperture rule: precisely cuts the window glass polygons on both sides of the SUV cabin
                      // (mX inset at ~0.55 between 0.48 and 0.62, window height mY 0.30 to 1.05, spanning cabin mZ -1.05 to 0.65),
                      // leaving the roof, hood, tailgate, doors, and pillars 100% solid and intact!
                      var isSideWindow = (Math.abs(mX) >= 0.48 && Math.abs(mX) <= 0.62 && Math.abs(naX) > 0.70 && mY >= 0.30 && mY <= 1.05 && mZ >= -1.05 && mZ <= 0.65);
                      if (!isSideWindow) {
                        newIndices.push(ia, ib, ic);
                      }
                    }
                    bGeom.setIndex(newIndices);
                    bGeom.computeVertexNormals();
                  }
                } catch (eWinCut) {}

                // Roll-down automotive tinted glass windows on the side facing Vikram
                var winMat = new THREE.MeshBasicMaterial({
                  color: 0x090d16,
                  transparent: true,
                  opacity: 0.35,
                  depthWrite: false
                });
                var driverWin = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.42), winMat);
                driverWin.position.set(-0.81, 1.25, 0.38);
                driverWin.rotation.y = -Math.PI / 2;
                mesh.add(driverWin);
                mesh.userData.driverWin = driverWin;
                mesh.userData.driverWinInitY = driverWin.position.y;

                var rearWin = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.42), winMat.clone());
                rearWin.position.set(-0.81, 1.25, -0.35);
                rearWin.rotation.y = -Math.PI / 2;
                mesh.add(rearWin);
                mesh.userData.rearWin = rearWin;
                mesh.userData.rearWinInitY = rearWin.position.y;

                var tailMat = new THREE.MeshBasicMaterial({ color: 0x7f1d1d });
                var brakeMat = new THREE.MeshBasicMaterial({ color: 0x2a0505 });
                var tW = lSz.x * 0.14, tH = lSz.y * 0.06;
                var tL1 = new THREE.Mesh(new THREE.BoxGeometry(tW, tH, 0.05), tailMat);
                tL1.position.set(lc.x + hx, ly, bz);
                mesh.add(tL1);
                var tL2 = tL1.clone();
                tL2.position.x = lc.x - hx;
                mesh.add(tL2);
                var bL1 = new THREE.Mesh(new THREE.BoxGeometry(tW * 0.7, tH, 0.05), brakeMat);
                bL1.position.set(lc.x + hx, ly, bz - 0.03);
                mesh.add(bL1);
                var bL2 = bL1.clone();
                bL2.position.x = lc.x - hx;
                mesh.add(bL2);

                mesh.userData.tailMat = tailMat;
                mesh.userData.brakeMat = brakeMat;
                mesh.userData.lights = {
                  beam: fBeam, head: fHead, head2: fHead2,
                  tail: [tL1, tL2], brake: [bL1, bL2]
                };
                mesh.userData.lightBox = { w: lSz.x, h: lSz.y, d: lSz.z };
              }
            } catch (eFortLights) {}
          }
          if (mesh && (d.id === 'fortuner' || d.withDriver) && typeof window._buildCutsceneDriver === 'function') {
            // Apply authentic deep obsidian black automotive finish, preserving texture atlas
            try {
              mesh.traverse(function (c) {
                if (c.isMesh && c.material) {
                  var mName = (c.material.name || c.name || '').toLowerCase();
                  if (mName.indexOf('glass') >= 0 || mName.indexOf('window') >= 0) {
                    c.material = new THREE.MeshBasicMaterial({
                      color: 0x05070a,
                      transparent: true,
                      opacity: 0.70,
                      depthWrite: false
                    });
                  } else if (mName.indexOf('light') < 0 && mName.indexOf('lamp') < 0 && mName.indexOf('wheel') < 0 && mName.indexOf('tyre') < 0) {
                    var prevMap = c.material.map || null;
                    c.material = new THREE.MeshStandardMaterial({
                      map: prevMap,
                      color: 0x18181b, // Deep Obsidian VIP black, preserving texture atlas
                      metalness: 0.85,
                      roughness: 0.18
                    });
                  }
                }
              });
            } catch (eMatFort) {}

            var driver = window._buildCutsceneDriver();
            if (driver) {
              driver.scale.setScalar(0.92);
              driver.position.set(0, 0, 0);
              mesh.add(driver);
              mesh.userData = mesh.userData || {};
              mesh.userData.driver = driver;
              driver.visible = true;

              // Subtle ambient fill on the driver side so metallic paint, wheels, and interior read cinematically without lens blowout
              var fortSideFill = new THREE.PointLight(0x94a3b8, 0.35, 4.0, 2.0);
              fortSideFill.position.set(-2.0, 1.8, 0);
              mesh.add(fortSideFill);
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
      mesh.userData.initPos = [mesh.position.x, mesh.position.y, mesh.position.z];
      mesh.userData.initRotY = mesh.rotation.y;
      // `aftermath: true` on a cast entry means "this character does not exist yet
      // when the film opens". Built hidden, revealed by onShotEnter when the first
      // `aftermath` shot arrives.
      //
      // This flag exists because a campaign could not express it before. An
      // inspector standing beside the body in shots 1-7 would tell the audience the
      // case was already open, and the same actor visible before and after the
      // shooting destroys the only thing the aftermath means. Building the actor
      // and then hiding it is deliberate: building it lazily would mean the first
      // aftermath shot pays the model cost, which is exactly when the frame is
      // already busy.
      if (d.aftermath) {
        mesh.userData.aftermathOnly = true;
        mesh.visible = false;
      }
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
          var t = tags[i];
          if (t && (cast.group === t.parent || (t.parent && t.parent.userData && t.parent.userData.isCast))) {
            tags.splice(i, 1);
          }
        }
      }
      cast.group.traverse(function (o) {
        if (o.isMesh) {
          if (o.geometry && !(typeof window.GEO !== 'undefined' && window.GEO && Object.values(window.GEO).indexOf(o.geometry) !== -1)) {
            try { o.geometry.dispose(); } catch (eG) {}
          }
          if (o.material && !o.userData.sharedMat) {
            var ms = Array.isArray(o.material) ? o.material : [o.material];
            ms.forEach(function (m) {
              try {
                if (m.map) { m.map.dispose(); }
                m.dispose();
              } catch (eM) {}
            });
          }
        }
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
  var ATTEMPT_SEEN = {};
  function seenKey(levelId) { return SEEN_PREFIX + String(levelId); }

  function hasSeen(levelId) {
    try { return localStorage.getItem(seenKey(levelId)) === '1'; } catch (e) { return false; }
  }

  function markSeen(levelId) {
    try { localStorage.setItem(seenKey(levelId), '1'); } catch (e) {}
  }

  function clearSeen(levelId) {
    if (levelId != null) { delete ATTEMPT_SEEN[String(levelId)]; }
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
      if (ov.osdClock && state.osdText != null) { ov.osdClock.textContent = state.osdText; }
      if (ov.osdTc && state.osdTcText != null) { ov.osdTc.textContent = state.osdTcText; }
      if (ov.osdGps && state.fx.osdGps) { ov.osdGps.textContent = state.fx.osdGps; }
      if (ov.osdUnit && state.fx.osdUnit) { ov.osdUnit.textContent = state.fx.osdUnit; }
      if (ov.osdBanner && state.fx.osdBanner) { ov.osdBanner.textContent = state.fx.osdBanner; }
      if (ov.osdRec && state.fx.osdRec) { ov.osdRec.textContent = state.fx.osdRec; }
    }

    // Bars ease in over the first 12% and out over the last 12% of the shot.
    var inP = Math.min(1, p / 0.12);
    var outP = Math.min(1, (1 - p) / 0.12);
    var shotBar = Math.min(inP, outP);
    // ...but the LETTERBOX is pinned to the FILM, not the shot: collapsing the
    // bars at every cut made the frame breathe and the film read as a slideshow.
    // Film progress from the script durations + the shot clock.
    var filmP = p;
    try {
      var sc = (state && state.script) || [];
      if (sc.length > 1) {
        var tot = 0, bef = 0, si, sdd;
        var sIdx = (state && state.idx) || 0;
        for (si = 0; si < sc.length; si++) {
          sdd = Math.max(0.05, ((sc[si] && sc[si].dur) || 3));
          if (si < sIdx) { bef += sdd; }
          tot += sdd;
        }
        var nowMs = (window.performance && performance.now) ? performance.now() : Date.now();
        var elS = Math.max(0, (nowMs - (state.shotStartedAt || nowMs)) / 1000);
        if (tot > 0) { filmP = (bef + elS) / tot; }
      }
    } catch (eF) {}
    var bar = Math.min(Math.min(1, filmP / 0.03), Math.min(1, (1 - filmP) / 0.03));
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
        ov.title.textContent = '';
      }
    }

    // Dialogue card (radio dispatch) or clean centered theatrical subtitles (in-person dialogue)
    var line = shot.sub || null;
    // `sayThen` is the answer inside the SAME shot (audio.js voices it at
    // `at`, a fraction of the shot). The caption has to swap with the voice,
    // or the viewer hears a second speaker while reading the first one's line.
    if (shot.sayThen && shot.sayThen.line && p >= (shot.sayThen.at || 0)) {
      line = shot.sayThen;
    }
    if (line) {
      var rawSpeaker = line.speaker ? String(line.speaker).trim() : '';
      var isRadio = /radio|wireless|dispatch|control/i.test(rawSpeaker) || !!line.isRadio;
      var sp = shotBar;
      var op = String(Math.max(0, Math.min(1, sp)));
      setSubtitle(ov, line);
      if (isRadio) {
        if (ov.transceiver) {
          ov.transceiver.style.opacity = op;
          ov.transceiver.style.transform = 'translateX(-50%) translateY(' + ((1 - Math.max(0, Math.min(1, sp))) * 10) + 'px)';
        }
        if (ov.theatricalSub) {
          ov.theatricalSub.style.opacity = '0';
          ov.theatricalSub.style.transform = 'translateX(-50%) translateY(6px)';
        }
      } else {
        if (ov.transceiver) {
          ov.transceiver.style.opacity = '0';
          ov.transceiver.style.transform = 'translateX(-50%) translateY(10px)';
        }
        if (ov.theatricalSub) {
          ov.theatricalSub.style.opacity = op;
          ov.theatricalSub.style.transform = 'translateX(-50%) translateY(' + ((1 - Math.max(0, Math.min(1, sp))) * 6) + 'px)';
        }
      }
    } else {
      if (ov.transceiver) {
        ov.transceiver.style.opacity = '0';
        ov.transceiver.style.transform = 'translateX(-50%) translateY(10px)';
      }
      if (ov.theatricalSub) {
        ov.theatricalSub.style.opacity = '0';
        ov.theatricalSub.style.transform = 'translateX(-50%) translateY(6px)';
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
      // The act's own authored lens-rain weight. It was hard-coded to 0.85
      // for any rainy act, so the 3:14am cold open - authored at 0.35 - was
      // more than twice as obscured as intended.
      lensRain: (act && act.lensRain != null) ? act.lensRain : ((act && act.rain) ? 0.85 : 0),
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
  function addFillLight(game, firstShot) {
    try {
      var isNight = !!(
        (firstShot && firstShot.act === 'night') ||
        (game && game._stageAct === 'night') ||
        (game && game.mapCfg && (game.mapCfg.isNight || game.mapCfg.mode === 'night'))
      );
      var lights = [];
      if (isNight) {
        var ambNight = new THREE.AmbientLight(0x28384a, 0.18);
        var moonKey = new THREE.DirectionalLight(0x5a88c2, 0.26);
        moonKey.position.set(20, 45, 15);
        var sodiumBounce = new THREE.DirectionalLight(0xd99b45, 0.20);
        sodiumBounce.position.set(-20, 25, -20);
        game.scene.add(ambNight);
        game.scene.add(moonKey);
        game.scene.add(sodiumBounce);
        lights.push(ambNight, moonKey, sodiumBounce);
      } else {
        var amb = new THREE.AmbientLight(0xdde8f8, 0.35);
        var key = new THREE.DirectionalLight(0xfff0e2, 0.45);
        key.position.set(20, 36, 12);
        game.scene.add(amb);
        game.scene.add(key);
        lights.push(amb, key);
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

    // Warm the recorded-audio manifest for the same reason. A siren cued in the
    // film's first ten seconds must not be the cue that discovers the manifest
    // does not exist — the sample would be dropped and nothing would say why.
    // Also fire-and-forget: a missing or slow manifest costs the film nothing but
    // those cues, which is exactly the designed degradation.
    try {
      if (window.SampleBank && typeof window.SampleBank.preload === 'function') {
        window.SampleBank.preload(function () {});
      }
    } catch (eSample) {}

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

      try {
        if (game && game.missionManager && game.missionManager._collectibleGroup) {
          game.missionManager._collectibleGroup.visible = false;
        }
        if (game && game.scene) {
          var collObj = game.scene.getObjectByName('collectibles');
          if (collObj) { collObj.visible = false; }
        }
      } catch (eColl) {}

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

      ACTIVE.fillLights = addFillLight(game, script[0]);

      // Temporary post-processing bloom during film
      try {
        var rc = game.renderCore || (game.renderer && game.renderer.renderCore);
        if (rc && rc.bloomPass) {
          ACTIVE._prevBloomEnabled = rc.bloomPass.enabled;
          ACTIVE._prevBloomStrength = rc.bloomPass.strength;
          ACTIVE._prevBloomRadius = rc.bloomPass.radius;
          ACTIVE._prevBloomThreshold = rc.bloomPass.threshold;
          rc.bloomPass.enabled = true;
          rc.bloomPass.strength = 0.12;
          rc.bloomPass.radius = 0.35;
          rc.bloomPass.threshold = 0.90;
        }
      } catch (eBloom) {}

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

  /**
   * Place the shot.
   *
   * `p` is the CAMERA's progress - the shot's progress compressed into its
   * move window, so the move completes by (dur - hold) and the camera then
   * sits at rest for the hold. `totalP` is the shot's own progress, and it
   * is what the timed one-shots read: a sting cued at 30% of the frame must
   * land at 30% of the FRAME, not at 30% of the camera's move (which is
   * earlier in the shot by the hold fraction). Timed cues used to read the
   * move progress, so in every shot with a hold they fired early - the body
   * thud landed before the camera had finished descending onto the body.
   */
  function applyShot(p, totalP) {
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
        vBike.position.set(2.2, 0.22, -12.7);
        vBike.rotation.z = Math.PI / 2.3;
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
          vBike2.position.set(3.6, 0, -12.5);
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

    // ── Aftermath-only actors ──────────────────────────────────────────
    // Toggled on EVERY shot, not just on the transition, because the cast
    // survives across the whole film and a one-shot reveal would leave the
    // characters standing in shots 1-7 if the film were ever reordered or
    // scrubbed. Deriving visibility from the current shot rather than tracking
    // state means the flag cannot drift out of sync with the script.
    //
    // Guarded per-actor: a cast entry that is missing its userData must not take
    // the whole loop down, because that would silently end the film mid-shot.
    try {
      if (ACTIVE.cast && ACTIVE.cast.actors) {
        var actors = ACTIVE.cast.actors;
        for (var cid in actors) {
          if (!Object.prototype.hasOwnProperty.call(actors, cid)) { continue; }
          var actor = actors[cid];
          if (!actor) { continue; }
          var aud = actor.userData;
          if (aud && aud.aftermathOnly) { actor.visible = !!shot.aftermath; }
          // Cast-attached figures (driver bust, passenger) that belong to specific
          // shots only. Cockpit glass, lamps and cones stay: hiding the whole
          // bust group would also kill the headlights mid-escape.
          try {
            var drv = aud && aud.driver;
            if (drv) {
              drv.visible = (ACTIVE.idx >= 0 && ACTIVE.idx <= 7) && !shot.aftermath;
            }
          } catch (eOSV) {}

          // Interactive power-window lowering and VIP passenger leaning animation
          try {
            if (actor && actor.userData) {
              var dWin = actor.userData.driverWin;
              var dInitY = actor.userData.driverWinInitY || 0;
              if (dWin) {
                // Lower front window when driver speaks (shots 4 and 5)
                if (ACTIVE.idx >= 3 && !shot.aftermath) {
                  var dProgress = Math.min(1.0, 0.45 + totalP * 2.0);
                  dWin.position.y = dInitY - dProgress * 0.45;
                } else {
                  dWin.position.y = dInitY;
                }
              }

              var rWin = actor.userData.rearWin;
              var rInitY = actor.userData.rearWinInitY || 0;
              if (rWin) {
                // Lower rear window when VIP passenger speaks ("Isko hatao yahan se.")
                var isVipShot = (shot.sub && shot.sub.speaker && shot.sub.speaker.indexOf('Passenger') >= 0) || ACTIVE.idx === 6;
                var rProgress = isVipShot ? Math.min(1.0, 0.50 + totalP * 2.0) : 0;
                if (isVipShot && !shot.aftermath) {
                  rWin.position.y = rInitY - rProgress * 0.45;
                } else if (ACTIVE.idx < 6) {
                  rWin.position.y = rInitY;
                }
                if (drv) {
                  var passFig = drv.getObjectByName('vip-passenger-figure');
                  if (passFig) {
                    passFig.visible = (ACTIVE.idx >= 0 && ACTIVE.idx <= 7) && !shot.aftermath;
                    if (isVipShot) {
                      passFig.rotation.y = -0.20 * rProgress;
                    }
                  }
                  var drvFig = drv.getObjectByName('vip-driver-figure');
                  if (drvFig) {
                    drvFig.visible = (ACTIVE.idx >= 0 && ACTIVE.idx <= 7) && !shot.aftermath;
                  }
                }
              }
            }
          } catch (eWinAnim) {}

          // Brake lights follow DECELERATION, which is measurable and cheap.
          //
          // The Fortuner runs in this film, so these stay dark while it does —
          // which is the point. A red glow under a car accelerating away reads as a
          // fault. But the same wiring is what makes every other cast vehicle in a
          // future level behave: press the brake, the lights come on.
          //
          // Compared on POSITION rather than speed, because during a `motion`
          // track the actor is being teleported by shots.js and its velocity is not
          // a derivative of anything the game knows about.
          if (aud && aud.lights && aud.brakeMat) {
            try {
              var lp = aud.__lastPos || null;
              var prevStep = aud.__lastStep;
              if (lp) {
                var moved = Math.abs(actor.position.z - lp[2]) + Math.abs(actor.position.x - lp[0]);
                // Braking means SLOWING DOWN — a large step followed by a small one.
                // It does not mean "not moving yet".
                //
                // The first version of this tested `moved < 0.004` alone, and the
                // shot-7 escape immediately proved it wrong: the pull-away is eased
                // with inCubic, so the car barely moves for the first frames, the
                // test read that slow start as braking, and the Fortuner drove off
                // a crime scene with its brake lights on. Requiring a previous
                // non-trivial step distinguishes "standing still, about to go" from
                // "was moving, now stopping".
                var braking = prevStep > 0.004 && moved < prevStep * 0.5;
                aud.brakeMat.color.setHex(braking ? 0xff2d2d : 0x2a0505);
                aud.tailMat.color.setHex(braking ? 0xef4444 : 0x7f1d1d);
                aud.__lastStep = moved;
              } else {
                aud.__lastStep = 0;
              }
              aud.__lastPos = [actor.position.x, actor.position.y, actor.position.z];
            } catch (eBrake) {}
          }
        }
      }
    } catch (eCastVis) {}

    // Sub-shot audio cues (a sting 40% into a shot) are evaluated from the
    // tick, because the shot's own start already fired in onShotEnter.
    // They read the shot's TOTAL progress, not the camera's move progress.
    try {
      if (window.StoryAudio && window.StoryAudio.applyTimed) {
        window.StoryAudio.applyTimed(shot, (totalP == null ? p : totalP));
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
        } else if (speaker && shot.showTags) {
          // Explicitly opted-in tags for shots that want on-screen nameplates.
          // By default, theatrical films hide 3D billboard text in favour of subtitle bars.
          var tagText = (t.sprite.userData && t.sprite.userData.tagText) ? String(t.sprite.userData.tagText) : '';
          if (tagText) {
            var norm = function (s) { return String(s || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, ' ').trim(); };
            var sp = norm(speaker);
            var tt = norm(tagText);
            show = (sp === tt) ||
              (sp.indexOf(tt) >= 0) ||
              (tt.indexOf(sp) >= 0) ||
              // "Insp. Arjun Kadam" vs "Arjun Kadam"
              (sp.split(' ').pop() === tt.split(' ').pop());
          }
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
    if (ATTEMPT_SEEN[String(level.id)]) { return false; }
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
    // Clamp only what feeds character animation, so a long hitch does not
    // teleport a walking actor.
    ACTIVE._dt = Math.min(Math.max(frameDt, 0.001), 0.1);

    try {
      var shot = ACTIVE.script[ACTIVE.idx];
      if (!shot) { finish(true); return false; }
      var durMs = Math.max(50, (shot.dur || 3) * 1000);
      if (ACTIVE.paused) {
        var frozenP = (ACTIVE.pausedP != null) ? ACTIVE.pausedP : 0.2;
        ACTIVE.shotStartedAt = now - (frozenP * durMs);
      }
      var elapsed = now - ACTIVE.shotStartedAt;
      var p = Math.max(0, Math.min(1, elapsed / durMs));

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
      if (ACTIVE._flashAt != null && p >= ACTIVE._flashAt) {
        if (ACTIVE.cast && ACTIVE.cast.actors && ACTIVE.cast.actors.vikram) {
          var vB = ACTIVE.cast.actors.vikram;
          var fallP = Math.min(1.0, (p - ACTIVE._flashAt) * 2.8);
          vB.rotation.z = fallP * (Math.PI / 2.3);
          vB.position.x = 3.6 - fallP * 1.4;
          vB.position.y = fallP * 0.22;
          vB.position.z = -12.5 - fallP * 0.2;

          if (fallP >= 0.75) {
            if (vB.userData && vB.userData.rider) {
              vB.userData.rider.visible = false;
            }
            if (!ACTIVE._fallenOfficerMesh && typeof window._buildFallenOfficer === 'function') {
              var fo = window._buildFallenOfficer();
              if (fo) {
                fo.position.set(4.0, 0, -12.3);
                ACTIVE.game.scene.add(fo);
                ACTIVE._fallenOfficerMesh = fo;
              }
            }
          }
        }
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

      // Camera progress is the SHOT's progress compressed into its move window,
      // so the move completes by (dur - hold) and the camera then sits at rest for
      // the hold. Timed one-shots above still read `p`, which means a flash or a
      // sting can land on the authored fraction of the frame while the camera has
      // already stopped — which is what a hold is FOR: something happens, then the
      // frame stops moving and lets it.
      var moveFrac = shot._moveFrac || 1;
      applyShot(moveFrac > 0 ? Math.min(1, p / moveFrac) : 1, p);
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
        var rainMesh = game._stageRain || game.scene.getObjectByName('stage-rain');
        if (rainMesh && rainMesh.geometry && rainMesh.geometry.attributes && rainMesh.geometry.attributes.position) {
          var posAttr = rainMesh.geometry.attributes.position;
          var arr = posAttr.array;
          var rainSpeed = ACTIVE._dt * 42;
          // The rain column is 46m tall (cinematics.js buildRain), so the
          // wrap has to add 46 back - adding 38 collapsed the whole
          // population into the lower 38m and the top of the column visibly
          // emptied over the first seconds of the cold open.
          for (var ri = 1; ri < arr.length; ri += 3) {
            arr[ri] -= rainSpeed;
            if (arr[ri] < 0) { arr[ri] += 46; }
          }
          posAttr.needsUpdate = true;
        }
      }

      // Advance one shot at a time, carrying the overshoot forward so a long
      // stall cannot desynchronise the timeline.
      if (ACTIVE.paused) { return true; }
      var guard = 0;
      while (elapsed >= durMs && guard < 64) {
        if (shot && shot.motion && ACTIVE.cast && ACTIVE.cast.actors) {
          try {
            shot.motion.forEach(function (m) {
              if (m && m.id && m.to && ACTIVE.cast.actors[m.id]) {
                var a = ACTIVE.cast.actors[m.id];
                a.position.set(m.to[0], m.to[1], m.to[2]);
              }
            });
          } catch (eSnap) {}
        }
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
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    } catch (eFoc) {}
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
    try {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    } catch (eFoc) {}
    var state = ACTIVE;
    ACTIVE = null;
    try {
      if (state.detachSkip) { state.detachSkip(); }
      // Restore collectibles if gameplay resumed on a playable map
      if (state.game && !state.game._stageBuild) {
        if (state.game.missionManager && state.game.missionManager._collectibleGroup) {
          state.game.missionManager._collectibleGroup.visible = true;
        }
        if (state.game.scene) {
          var collObj = state.game.scene.getObjectByName('collectibles');
          if (collObj) { collObj.visible = true; }
        }
      }
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
          g._stageBuild = false;
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
      // Initialize buttery smooth cinematic-to-gameplay camera transition lerp
      if (state.kind !== 'beat') {
        g._camSnapped = true;
        g._camTransition = 2.4;
      }
      // A beat interrupts a running lesson: restoring the player's own pause
      // state matters, but a prologue always resumes unpaused.
      g.pause = (state.kind === 'beat') ? !!state.prevPause : false;
      if (g.clock) { try { g.clock.getDelta(); } catch (e3) {} }

      // Restore post-processing bloom quality settings
      try {
        var rc = g && (g.renderCore || (g.renderer && g.renderer.renderCore));
        if (rc && rc.bloomPass && state._prevBloomEnabled !== undefined) {
          rc.bloomPass.enabled = state._prevBloomEnabled;
          rc.bloomPass.strength = state._prevBloomStrength;
          rc.bloomPass.radius = state._prevBloomRadius;
          rc.bloomPass.threshold = state._prevBloomThreshold;
        }
      } catch (eBloomRes) {}
    } catch (e) {}

    if (markPlayed !== false && !rebuildErr) {
      if (state.kind === 'beat') {
        var bStory = storyFor(state.levelId);
        if (!(bStory && bStory.alwaysReplay) && state.beatId != null) {
          markBeatSeen(state.levelId, state.beatId);
        }
      } else if (state.level) {
        if (state.level.id != null) {
          ATTEMPT_SEEN[String(state.level.id)] = true;
        }
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
    var stage = stageFor(lv.id);
    var stageBuilt = false;
    // Same two-pass contract as begin(): the prologue is staged on its own film
    // map. Replaying it over the current daytime playable map put the 03:14 AM
    // rain scene on a sunny street with checkpoint rings and no crime-scene set.
    if (stage && stage.map && typeof game._buildScene === 'function') {
      try {
        game._buildScene(lv.mode, stage.map);
        stageBuilt = true;
        try {
          if (window.Cinematics && typeof window.Cinematics.dressStage === 'function') {
            window.Cinematics.dressStage(game, stage, story);
          }
        } catch (e3) {
          console.warn('[Cutscene] restart(): dressStage failed — continuing with bare map:', e3);
        }
      } catch (eS) {
        console.warn('[Cutscene] restart(): stage build failed — replaying on the playable map:', eS);
        stageBuilt = false;
      }
    }
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
    if (!started && stageBuilt) {
      // Never leave the player on the film set.
      try { game._buildScene(lv.mode); } catch (e5) {}
    }
    if (started && ACTIVE) {
      // finish() swaps back to the playable map when ACTIVE.stage is set.
      ACTIVE.stage = stageBuilt ? stage : null;
      ACTIVE.levelConfig = lv;
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

  function pause(atP) {
    if (!ACTIVE) { return; }
    ACTIVE.paused = true;
    ACTIVE.pausedP = (atP != null) ? Math.max(0, Math.min(1, atP)) : 0.2;
  }

  function resume() {
    if (!ACTIVE) { return; }
    ACTIVE.paused = false;
    ACTIVE.shotStartedAt = (window.performance && performance.now) ? performance.now() : Date.now();
  }

  /** Jump to the start of shot `idx` without ending the film. Optionally freeze at progress fraction `pauseP`. */
  function seek(idx, pauseP) {
    if (!ACTIVE) { return false; }
    var i = Math.max(0, Math.min(ACTIVE.script.length - 1, idx | 0));
    ACTIVE.idx = i;
    ACTIVE.shotStartedAt = (window.performance && performance.now) ? performance.now() : Date.now();
    if (pauseP != null) {
      ACTIVE.paused = true;
      ACTIVE.pausedP = Math.max(0, Math.min(1, pauseP));
    } else {
      ACTIVE.paused = false;
    }
    try {
      // Settle all prior motions up to shot i so actors are positioned on their expected marks
      if (ACTIVE.script && ACTIVE.cast && ACTIVE.cast.actors) {
        for (var sIdx = 0; sIdx < i; sIdx++) {
          var sShot = ACTIVE.script[sIdx];
          if (sShot && sShot.motion) {
            sShot.motion.forEach(function (m) {
              if (m && m.id && m.to && ACTIVE.cast.actors[m.id]) {
                var a = ACTIVE.cast.actors[m.id];
                a.position.set(m.to[0], m.to[1], m.to[2]);
              }
            });
          }
        }
        // Initialize current shot's actors at m.from so they begin at start mark
        if (ACTIVE.script[i] && ACTIVE.script[i].motion) {
          ACTIVE.script[i].motion.forEach(function (m) {
            if (m && m.id && m.from && ACTIVE.cast.actors[m.id]) {
              var a = ACTIVE.cast.actors[m.id];
              a.position.set(m.from[0], m.from[1], m.from[2]);
            }
          });
        }
      }
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

  /** True when the given level has a runnable prologue script. */
  function hasFor(level) {
    if (!level) { return false; }
    var script = null;
    try { script = resolveScript(level); } catch (e) { script = null; }
    return !!(script && script.length);
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
    // Test/diagnostic seam: the running film's state, or null.
    //
    // ACTIVE is module-private, and a harness that cannot see which shot is on
    // screen has to infer it. Inference is how a verification ends up asserting
    // things about the wrong moment — an earlier cast check reported "no actors
    // found" for a film that had them on screen for its final shots, because it
    // guessed the aftermath had not begun. Reading `idx` is the difference between
    // observing a film and guessing at one.
    state: function () {
      if (!ACTIVE) { return null; }
      var shot = ACTIVE.script ? ACTIVE.script[ACTIVE.idx] : null;
      return {
        idx: ACTIVE.idx,
        total: ACTIVE.script ? ACTIVE.script.length : 0,
        aftermath: !!(shot && shot.aftermath),
        actorIds: ACTIVE.cast && ACTIVE.cast.actors
          ? Object.keys(ACTIVE.cast.actors) : [],
      };
    },
    begin: begin,
    beat: beat,
    beatForTask: beatForTask,
    tick: tick,
    skip: skip,
    onEnd: onEnd,
    replay: replay,
    restart: restart,
    seek: seek,
    pause: pause,
    resume: resume,
    hasPrologue: hasPrologue,
    hasStage: hasStage,
    hasFor: hasFor,
    clearSeen: clearSeen,
    hasSeen: hasSeen,
    isActive: function () { return !!ACTIVE; },
    isBeat: function () { return !!(ACTIVE && ACTIVE.kind === 'beat'); }
  };
})();