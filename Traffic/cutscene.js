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
    // z-index must clear the game's topmost HUD panels (some sit at 99999),
    // otherwise the copilot card and badges paint over the film.
    '#cutscene-root{position:fixed;inset:0;z-index:20000;pointer-events:none;' +
    'font-family:Inter,system-ui,sans-serif;text-transform:none;}' +
    '#cutscene-root .cs-bar{position:absolute;left:0;right:0;height:11vh;min-height:34px;' +
    'background:#000;transform:scaleY(0);will-change:transform;}' +
    '#cutscene-root .cs-bar.top{top:0;transform-origin:top center;}' +
    '#cutscene-root .cs-bar.bot{bottom:0;transform-origin:bottom center;}' +
    '#cutscene-root .cs-vig{position:absolute;inset:0;opacity:0;will-change:opacity;' +
    // Deliberately light. At 0.55/.85 this crushed the frame edges and, added to
    // the real shadow a verandah soffit casts, made a midday scene read as night.
    'background:radial-gradient(ellipse at center,rgba(0,0,0,0) 58%,rgba(0,0,0,.34) 100%);}' +
    '#cutscene-root .cs-fade{position:absolute;inset:0;background:#000;opacity:0;will-change:opacity;}' +
    '#cutscene-root .cs-title{position:absolute;left:0;right:0;top:38%;text-align:center;' +
    'color:#fff;opacity:0;will-change:opacity,transform;' +
    'font-size:clamp(15px,4.4vw,30px);font-weight:800;letter-spacing:.16em;' +
    'text-transform:uppercase;text-shadow:0 2px 18px rgba(0,0,0,.85);}' +
    // text-transform:none is REQUIRED: a global body rule sets `capitalize`,
    // which would rewrite the dialogue. Lines must stay verbatim; only the
    // speaker label is uppercased.
    '#cutscene-root .cs-sub{position:absolute;left:50%;transform:translateX(-50%);' +
    'bottom:calc(11vh + 14px);max-width:min(92vw,760px);padding:9px 15px;' +
    'border-radius:10px;background:rgba(6,9,16,.82);border:1px solid rgba(255,255,255,.14);' +
    'color:#fff;opacity:0;will-change:opacity,transform;text-align:center;' +
    'text-transform:none;' +
    'font-size:clamp(12px,3.4vw,18px);line-height:1.4;}' +
    '#cutscene-root .cs-sub b{display:block;font-size:.82em;font-weight:700;' +
    'letter-spacing:.09em;text-transform:uppercase;color:#5ed3f0;margin-bottom:3px;}' +
    '#cutscene-root .cs-skip-btn{position:absolute;top:max(16px,calc(11vh + 10px));right:18px;z-index:20020;' +
    'pointer-events:auto;display:inline-flex;align-items:center;gap:8px;padding:9px 18px;' +
    'border-radius:9999px;background:rgba(10,15,29,.88);border:1px solid rgba(255,255,255,.28);' +
    'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;' +
    'font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;' +
    'box-shadow:0 4px 22px rgba(0,0,0,.6);opacity:0;transform:translateY(-4px);' +
    'transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s ease,border-color .2s ease,box-shadow .2s ease,opacity .25s ease;' +
    'will-change:transform,opacity;user-select:none;-webkit-user-select:none;}' +
    '#cutscene-root .cs-skip-btn:hover{background:rgba(22,33,58,.96);border-color:#5ed3f0;transform:translateY(-4px) scale(1.04);box-shadow:0 6px 26px rgba(94,211,240,.38);}' +
    '#cutscene-root .cs-skip-btn:active{transform:translateY(-2px) scale(.97);}' +
    '#cutscene-root .cs-skip-icon{font-size:14px;color:#5ed3f0;}';

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

  /**
   * Collect every fixed/absolute HUD layer that sits above the canvas, so the
   * briefing modal, objective list, copilot card and civic controls cannot paint
   * over the film.
   *
   * @returns {Array} snapshot to pass to enforceHUD()/restoreGameUI()
   */
  function hideGameUI() {
    var saved = [];
    var nodes;
    try { nodes = document.body.querySelectorAll('*'); } catch (e) { return saved; }
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (NEVER_HIDE[el.id]) { continue; }
      var cs;
      try { cs = getComputedStyle(el); } catch (e2) { continue; }
      if (cs.position !== 'fixed' && cs.position !== 'absolute') { continue; }
      var z = parseInt(cs.zIndex, 10);
      if (!(z >= 40)) { continue; } // anything below sits under the canvas anyway
      // NOTE: id is deliberately NOT required. A fair amount of HUD is built as
      // anonymous inline-styled divs with no id — the "Press F to Enter Car"
      // prompt is one — and skipping them left those painting over the
      // cutscene. restoreGameUI() puts every one of them back.
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

  /**
   * Re-assert the hide on the cached list. `_actualStart` keeps revealing HUD
   * layers after the cutscene begins (and assigning to `.style.display` clears
   * an inline `!important`), so a one-shot hide leaks panels onto the film.
   */
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

  function buildOverlay() {
    ensureStyle();
    var root = document.createElement('div');
    root.id = 'cutscene-root';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="cs-bar top"></div>' +
      '<div class="cs-bar bot"></div>' +
      '<div class="cs-vig"></div>' +
      '<div class="cs-fade"></div>' +
      '<div class="cs-title"></div>' +
      '<div class="cs-sub"></div>' +
      '<button class="cs-skip-btn" type="button" aria-label="Skip Cutscene">' +
        '<span>Skip Cutscene</span> <span class="cs-skip-icon">⏭</span>' +
      '</button>';
    document.body.appendChild(root);
    return {
      root: root,
      barTop: root.querySelector('.cs-bar.top'),
      barBot: root.querySelector('.cs-bar.bot'),
      vig: root.querySelector('.cs-vig'),
      fade: root.querySelector('.cs-fade'),
      title: root.querySelector('.cs-title'),
      sub: root.querySelector('.cs-sub'),
      skipBtn: root.querySelector('.cs-skip-btn')
    };
  }

  function teardownOverlay(ov) {
    if (!ov || !ov.root) { return; }
    try { if (ov.root.parentNode) { ov.root.parentNode.removeChild(ov.root); } } catch (e) {}
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

  function setSubtitle(ov, text) {
    if (!ov || !ov.sub) { return; }
    if (!text) { ov.sub.textContent = ''; ov.sub.style.opacity = '0'; return; }
    var speaker = text.speaker ? titleCase(text.speaker) : '';
    var line = text.line == null ? '' : String(text.line);
    ov.sub.innerHTML = (speaker ? '<b>' + escapeHtml(speaker) + '</b>' : '') + escapeHtml(line);
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
          }
          if (mesh && (d.id === 'fortuner' || d.withDriver) && typeof window._buildCutsceneDriver === 'function') {
            var driver = window._buildCutsceneDriver();
            if (driver) {
              driver.position.set(-0.35, 0.22, 0.12);
              mesh.add(driver);
              mesh.userData = mesh.userData || {};
              mesh.userData.driver = driver;
            }
          }
        } else {
          var bh = (typeof window._buildHuman === 'function') ? window._buildHuman : null;
          mesh = bh ? bh(false, { variant: d.variant || 'normal' }) : null;
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
    // Bars ease in over the first 12% and out over the last 12% of the shot.
    var inP = Math.min(1, p / 0.12);
    var outP = Math.min(1, (1 - p) / 0.12);
    var bar = Math.min(inP, outP);
    var sy = window.Shots ? window.Shots.ease('outCubic', bar) : bar;
    if (ov.barTop) { ov.barTop.style.transform = 'scaleY(' + sy + ')'; }
    if (ov.barBot) { ov.barBot.style.transform = 'scaleY(' + sy + ')'; }
    if (ov.vig) { ov.vig.style.opacity = String(sy * 0.55); }
    if (ov.skipBtn) { ov.skipBtn.style.opacity = String(Math.min(1, Math.max(0, (p - 0.05) / 0.15)) * sy); }

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

    if (ov.sub) {
      if (shot.sub) {
        var sp = p < 0.14 ? p / 0.14 : (p > 0.86 ? (1 - p) / 0.14 : 1);
        setSubtitle(ov, shot.sub);
        ov.sub.style.opacity = String(Math.max(0, Math.min(1, sp)));
        ov.sub.style.transform = 'translateX(-50%) translateY(' + ((1 - Math.max(0, Math.min(1, sp))) * 8) + 'px)';
      } else {
        ov.sub.style.opacity = '0';
      }
    }
  }

  // ── Fill light ────────────────────────────────────────────────────────────
  // Named sets are under cover — a verandah soffit, a balcony ceiling — so the
  // sun puts the exact faces the camera needs into full shadow and a midday
  // scene reads as night. This lifts shadowed surfaces WITHOUT touching the sun,
  // so the lighting the player drives under is unchanged.
  function addFillLight(game) {
    try {
      var amb = new THREE.AmbientLight(0xdde8f8, 0.85);
      var key = new THREE.DirectionalLight(0xfff0e2, 0.75);
      key.position.set(20, 36, 12);
      var fill = new THREE.DirectionalLight(0xa5c4f5, 0.50);
      fill.position.set(-30, 40, -40);
      var junctionSpot = new THREE.PointLight(0xffd28a, 2.2, 55, 1.0);
      junctionSpot.position.set(5.0, 11.0, -12.5);
      game.scene.add(amb);
      game.scene.add(key);
      game.scene.add(fill);
      game.scene.add(junctionSpot);
      return [amb, key, fill, junctionSpot];
    } catch (e) { return []; }
  }

  function removeLights(list) {
    (list || []).forEach(function (l) {
      try { if (l && l.parent) { l.parent.remove(l); } } catch (e) {}
    });
  }

  function attachSkip(state) {
    try { if (window.StoryAudio && window.StoryAudio.unlock) { window.StoryAudio.unlock(); } } catch (e) {}
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
      btn.addEventListener('pointerdown', function (e) {
        try { e.stopPropagation(); } catch (err) {}
      });
      state.detachSkip = function () {
        try {
          btn.removeEventListener('click', onSkip);
          btn.removeEventListener('touchend', onSkip);
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

      attachSkip(ACTIVE);

      // The opening shot, applied now that ACTIVE exists.
      //
      // Both calls are required and the order matters. applyShot() places the
      // camera so frame 1 is not the default chase view (a visible snap on the
      // opening frame reads as a bug, not as style); onShotEnter() fires that
      // shot's audio block — ambience, stinger, and its spoken line. Firing the
      // audio before the camera lands means the film starts talking over a shot
      // the audience has not seen yet.
      applyShot(0);
      applyTags();
      onShotEnter(ACTIVE.script[0]);
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
    applyTags();
    // Aftermath handling (Shot 6 of Level 1 prologue): Vikram's bike toppled and fallen officer on road
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
    try {
      if (window.StoryAudio && window.StoryAudio.applyShot) {
        window.StoryAudio.applyShot(shot, ACTIVE ? ACTIVE.idx : 0);
      }
    } catch (e) {}
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
        } else if (speaker) {
          // Match on the tag's own text: `_makeNametag` renders it verbatim, so
          // "Vikram Sawant" matches a speaker of "Vikram Sawant" and a shot
          // credited to the Fortuner's driver tags the Fortuner, not the bike.
          var label = String(t.sprite.userData && t.sprite.userData.tagText || '').trim();
          show = !!label && label.toLowerCase() === speaker.toLowerCase();
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
    var force = false;
    try { force = !!(script.force || (story && (story.force || story.alwaysShow))); } catch (e) { force = false; }
    // User requirement: after skipping, when the level loads again, the cutscene should still be shown.
    if (!force && hasSeen(level.id) && level.id !== 1 && (!story || !story.alwaysShow)) { return false; }

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

    var chosen = null;
    var chosenIdx = -1;
    for (var i = 0; i < story.beats.length; i++) {
      var b = story.beats[i];
      if (!b || !b.shots || !b.shots.length) { continue; }
      if (beatId != null && String(b.after) !== String(beatId)) { continue; }
      if (b.once !== false && beatSeen(levelId, b.after != null ? b.after : i)) { continue; }
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
    for (var i = 0; i < story.beats.length; i++) {
      var b = story.beats[i];
      if (!b || String(b.after) !== String(taskId)) { continue; }
      if (b.once !== false && beatSeen(levelId, b.after)) { continue; }
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

      // Transition clock runs from the start of each shot. Default is a short
      // dissolve; opt out per shot with transition:'cut'.
      var transDur = (shot.transition === 'cut') ? 0 : (shot.dissolve != null ? shot.dissolve : 0.44);
      if (transDur !== ACTIVE.transDur) {
        ACTIVE.transDur = transDur;
        ACTIVE.transT = 0;
      }
      ACTIVE.transT = ACTIVE.transT + ACTIVE._dt;

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
        if (state.beatId != null) { markBeatSeen(state.levelId, state.beatId); }
      } else if (state.level) {
        var sObj = storyFor(state.level.id);
        if (state.level.id !== 1 && !(sObj && sObj.alwaysShow)) {
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
    try { applyShot(0); } catch (e) {}
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