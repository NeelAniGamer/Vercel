// Shared UI Logic: Cursor, Ambient Background, Theme Toggle, Mobile Menu
;(function () {
  // Vercel Speed Insights for legacy/static pages. The React GamePage uses
  // the package component directly; this covers the other HTML entrypoints.
  if (!window.si) {
    window.si = function () { (window.siq = window.siq || []).push(arguments); };
    const speedInsightsScript = document.createElement('script');
    speedInsightsScript.defer = true;
    speedInsightsScript.src = '/_vercel/speed-insights/script.js';
    document.head.appendChild(speedInsightsScript);
  }

  // Haptic feedback helper — silent on desktop, uses navigator.vibrate on mobile
  function haptic(style) {
    if (!navigator.vibrate) {return}
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {return}
    try {
      switch (style) {
        case 'light': navigator.vibrate(8); break
        case 'medium': navigator.vibrate(15); break
        case 'heavy': navigator.vibrate(25); break
        case 'success': navigator.vibrate([10, 50, 15]); break
        default: navigator.vibrate(10)
      }
    } catch (e) {}
  }

  // 0. Ambient Visual System Auto-Injector (Aurora Mesh & Cyber Grid)
  // Full-fidelity 3-orb ambient mesh + cyber spotlight across all devices.
  // Hardware-accelerated GPU layers run at full unthrottled refresh rates.
  function initAmbientVisuals() {
    if (document.querySelector('.col-ambient-bg')) {return;}
    const bg = document.createElement('div');
    bg.className = 'col-ambient-bg';
    bg.setAttribute('aria-hidden', 'true');
    const orbs = '<div class="col-ambient-orb col-orb-1"></div><div class="col-ambient-orb col-orb-2"></div><div class="col-ambient-orb col-orb-3"></div><div class="col-ambient-spotlight"></div>';
    bg.innerHTML = orbs;
    if (document.body) {
      document.body.insertBefore(bg, document.body.firstChild);
      setupAmbientPause(bg);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.insertBefore(bg, document.body.firstChild);
        setupAmbientPause(bg);
      });
    }
  }
  // Pause ambient animations ONLY when tab is explicitly hidden to release background cycles
  function setupAmbientPause(bg) {
    function apply() {
      bg.classList.toggle('col-perf-pause', document.hidden);
    }
    document.addEventListener('visibilitychange', apply);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAmbientVisuals);
  } else {
    initAmbientVisuals();
  }

  // 1. Cursor & Mouse Spotlight Tracking (Desktop pointer only — zero mobile CPU overhead)
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  const isGamePage = /Driving|Academy|solar|gesture|rpg/i.test(location.pathname)

  if (!isTouch && !isGamePage) {
    const dot = document.getElementById('cDot'),
      ring = document.getElementById('cRing')
    let spot = null
    let mx = window.innerWidth / 2,
      my = window.innerHeight / 3,
      rx = mx,
      ry = my
    let isMoving = false,
      ringRaf = null

    let lastRingTime = null
    function updateRing(now) {
      now = now || performance.now()
      const dt = lastRingTime ? Math.min((now - lastRingTime) / 1000, 0.05) : 0.016
      lastRingTime = now
      const dx = mx - rx
      const dy = my - ry
      // Exponential decay spring: mathematically identical tracking whether at 60Hz, 90Hz, 120Hz, or 144Hz
      const alpha = 1 - Math.exp(-24 * dt)
      rx += dx * alpha
      ry += dy * alpha
      if (ring) {
        ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)'
      }
      if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
        ringRaf = requestAnimationFrame(updateRing)
      } else {
        rx = mx
        ry = my
        if (ring) {
          ring.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)'
        }
        ringRaf = null
        lastRingTime = null
      }
    }

    document.addEventListener(
      'mousemove',
      function (e) {
        mx = e.clientX
        my = e.clientY
        if (dot) {
          dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)'
        }
        if (!ringRaf && ring) {
          ringRaf = requestAnimationFrame(updateRing)
        }
        if (!isMoving) {
          isMoving = true
          requestAnimationFrame(function () {
            if (!spot) {
              spot = document.querySelector('.col-ambient-spotlight')
            }
            if (spot) {
              spot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)'
            }
            isMoving = false
          })
        }
      },
      { passive: true }
    )

    // Event delegation for cursor hover state on interactive targets
    document.addEventListener('mouseover', function (e) {
      if (e.target && e.target.closest('a, button, select, input, .typing-area, [role="button"], .hz-toggle, .pc')) {
        document.body.classList.add('ch')
      }
    }, { passive: true })

    document.addEventListener('mouseout', function (e) {
      if (e.target && e.target.closest('a, button, select, input, .typing-area, [role="button"], .hz-toggle, .pc')) {
        document.body.classList.remove('ch')
      }
    }, { passive: true })
  }

  // 2. Mobile Menu & In-App Updater — Engineered for 720p→2K
  const mmb = document.getElementById('mmb'),
    nl = document.getElementById('navLinks')
  const isGamePage2 = /Driving|Academy|solar|gesture|rpg/i.test(location.pathname)
  if (mmb) {
    mmb.innerHTML = '<span class="m-line"></span><span class="m-line"></span><span class="m-line"></span>'
    mmb.setAttribute('aria-label', 'Toggle navigation menu')
    mmb.setAttribute('aria-expanded', 'false')
    if (nl) {
      // — Helper: lock body scroll without layout shift —
      let _lockY = 0
      let _navLocked = false
      function lockNav() {
        _lockY = window.scrollY
        _navLocked = true
        const sb = window.innerWidth - document.documentElement.clientWidth
        if (sb > 0) {document.documentElement.style.setProperty('--scrollbar-comp', sb + 'px')}
        document.body.classList.add('nav-lock')
        document.body.style.top = '-' + _lockY + 'px'
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'
        mmb.setAttribute('aria-expanded', 'true')
        nl.setAttribute('aria-hidden', 'false')
      }
      function unlockNav() {
        document.body.classList.remove('nav-lock')
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.documentElement.style.removeProperty('--scrollbar-comp')
        // Only restore the scroll position if the nav was actually locked.
        // Without this guard, unlockNav() ran window.scrollTo(0, 0) on every
        // desktop resize (createOrUpdateBar calls closeMobileDrawer), which
        // yanked the reader back to the top of the page.
        if (_navLocked) {
          window.scrollTo(0, _lockY)
          _navLocked = false
        }
        mmb.setAttribute('aria-expanded', 'false')
        nl.setAttribute('aria-hidden', 'true')
      }
      function isNavOpen() {
        return Boolean(_drawer && _drawer.classList.contains('active'))
      }

      // Dedicated, Isolated Centered Mobile Drawer
      let _drawer = null
      function getOrCreateMobileDrawer() {
        if (_drawer) {return _drawer}
        const existing = document.getElementById('colMobileDrawer')
        if (existing) {
          _drawer = existing
          return _drawer
        }

        const d = document.createElement('div')
        d.id = 'colMobileDrawer'
        d.className = 'col-mobile-drawer'
        d.setAttribute('aria-modal', 'true')
        d.setAttribute('role', 'dialog')
        d.setAttribute('aria-label', 'Mobile Navigation')

        let curPath = (location.pathname.split('/').pop() || 'home').replace('.html', '').toLowerCase()
        if (curPath === '' || curPath === 'index') {curPath = 'home'}

        function isActLink(target) {
          return curPath === target ? ' act' : ''
        }

        d.innerHTML =
          '<div class="cmd-backdrop" id="cmdBackdrop"></div>' +
          '<div class="cmd-panel">' +
            '<div class="cmd-header">' +
              '<div class="cmd-brand">' +
                '<img src="Class.png" alt="Class Of Learners" class="cmd-logo" width="36" height="36" />' +
                '<div class="cmd-brand-text">' +
                  '<span class="cmd-brand-name">Class Of Learners</span>' +
                  '<span class="cmd-brand-badge">v1.4</span>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="cmd-close-btn" id="cmdCloseBtn" aria-label="Close menu">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +

            '<div class="cmd-nav-group">' +
              '<a href="/" class="cmd-link' + isActLink('home') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
                '<span>Home</span>' +
              '</a>' +
              '<a href="/about" class="cmd-link' + isActLink('about') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
                '<span>About</span>' +
              '</a>' +
              '<a href="/school" class="cmd-link' + isActLink('school') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>' +
                '<span>School</span>' +
              '</a>' +
              '<a href="/sneh-asha" class="cmd-link' + isActLink('sneh-asha') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>' +
                '<span>Sneh Asha</span>' +
              '</a>' +
              '<a href="/making" class="cmd-link' + isActLink('making') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' +
                '<span>Making</span>' +
              '</a>' +

              '<div class="cmd-accordion" id="cmdAccordion">' +
                '<button type="button" class="cmd-accordion-btn" id="cmdAccBtn">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' +
                  '<span>Projects</span>' +
                  '<span class="cmd-acc-arrow">&#9660;</span>' +
                '</button>' +
                '<div class="cmd-accordion-list" id="cmdAccList">' +
                  '<a href="/ati" class="cmd-acc-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg><span>Typing Instructor</span></a>' +
                  '<a href="/solar" class="cmd-acc-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg><span>Solar Engine</span></a>' +
                  '<a href="/gesture" class="cmd-acc-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg><span>Perceptus Flow</span></a>' +
                  '<a href="/rpg" class="cmd-acc-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>RPG Game</span></a>' +
                  '<a href="/qr" class="cmd-acc-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="4" height="4"/><rect x="20" y="14" width="2" height="2"/><rect x="14" y="20" width="2" height="2"/><rect x="20" y="20" width="2" height="2"/></svg><span>QR Studio Matrix</span></a>' +
                  '<a href="/Terra3D/" class="cmd-acc-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span>Terra3D Atlas</span></a>' +
                  '<a href="/Career" class="cmd-acc-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg><span>Career Compass</span></a>' +
                  '<a href="/Database_Logic" class="cmd-acc-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="16" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/></svg><span>Database Logic DB</span></a>' +
                  '<a href="/CastFlow" class="cmd-acc-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span>CastFlow Studio</span></a>' +
                  '<a href="/cereal" class="cmd-acc-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span>Cereal AI App</span></a>' +
                  '<a href="/Traffic/Driving" class="cmd-acc-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><span>Traffic Academy</span></a>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="cmd-setting-card">' +
              '<div class="cmd-setting-info">' +
                '<div class="cmd-setting-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></div>' +
                '<div>' +
                  '<div class="cmd-setting-title">Appearance</div>' +
                  '<div class="cmd-setting-desc" id="cmdThemeDesc">' + (document.body.classList.contains('lm') ? 'Light Mica' : 'Dark VisionOS') + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="hz-toggle cmd-hz-toggle" id="cmdHzToggle">' +
                '<div class="hz-clouds"></div><div class="hz-stars"></div><div class="hz-orb"></div>' +
              '</div>' +
            '</div>' +

            '<div class="cmd-setting-card cmd-liquid-card">' +
              '<div class="cmd-setting-info">' +
                '<div class="cmd-setting-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div>' +
                '<div>' +
                  '<div class="cmd-setting-title">Liquid Glass UI</div>' +
                  '<div class="cmd-setting-desc" id="cmdLiquidDesc">' + (document.documentElement.classList.contains('is-iphone') ? 'Apple VisionOS &amp; iOS' : 'Standard Material') + '</div>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="cmd-toggle-pill' + (document.documentElement.classList.contains('is-iphone') ? ' active' : '') + '" id="cmdLiquidToggle" aria-label="Toggle Apple Liquid Glass">' +
                '<span class="cmd-toggle-thumb"></span>' +
              '</button>' +
            '</div>' +

            '<div class="cmd-quick-deck">' +
              '<a href="/making" class="cmd-tile highlight">' +
                '<span class="cmd-tile-icon">⚡</span>' +
                '<span class="cmd-tile-title">Making</span>' +
                '<span class="cmd-tile-sub">AIs, Services &amp; Stack</span>' +
              '</a>' +
              '<a href="/ati" class="cmd-tile">' +
                '<span class="cmd-tile-icon">⌨️</span>' +
                '<span class="cmd-tile-title">Typing Instructor</span>' +
                '<span class="cmd-tile-sub">Tutor &amp; Speed Test</span>' +
              '</a>' +
              '<a href="/solar" class="cmd-tile">' +
                '<span class="cmd-tile-icon">🪐</span>' +
                '<span class="cmd-tile-title">Solar 3D Engine</span>' +
                '<span class="cmd-tile-sub">Cosmic Physics Sim</span>' +
              '</a>' +
            '</div>' +

            '<div class="cmd-actions-deck">' +
              '<button type="button" class="cmd-btn-primary" id="cmdLoginBtn">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                '<span>Sign In</span>' +
              '</button>' +
              '<a href="/download" class="cmd-btn-secondary">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                '<span>Downloads Hub</span>' +
              '</a>' +
            '</div>' +

            '<div class="cmd-footer">' +
              '<span>Class Of Learners &copy; 2026</span>' +
              '<div>' +
                '<a href="/privacy" style="margin-right: 12px;">Privacy</a>' +
                '<a href="/terms">Terms</a>' +
              '</div>' +
            '</div>' +
          '</div>'

        document.body.appendChild(d)
        _drawer = d

        // Close handlers
        const closeBtn = d.querySelector('#cmdCloseBtn')
        if (closeBtn) {closeBtn.addEventListener('click', closeDrawer)}
        const backdrop = d.querySelector('#cmdBackdrop')
        if (backdrop) {backdrop.addEventListener('click', closeDrawer)}

        // Accordion toggle
        const accBtn = d.querySelector('#cmdAccBtn')
        const acc = d.querySelector('#cmdAccordion')
        if (accBtn && acc) {
          accBtn.addEventListener('click', function () {
            acc.classList.toggle('active')
          })
        }

        // Theme toggle
        const cmdHz = d.querySelector('#cmdHzToggle')
        if (cmdHz) {
          cmdHz.addEventListener('click', function () {
            if (typeof window.hzToggle === 'function') {
              window.hzToggle()
            } else {
              document.body.classList.toggle('lm')
              try { localStorage.setItem('theme', document.body.classList.contains('lm') ? 'light' : 'dark') } catch (e) {}
            }
            setTimeout(function () {
              const desc = document.getElementById('cmdThemeDesc')
              if (desc) {desc.textContent = document.body.classList.contains('lm') ? 'Light Mica' : 'Dark VisionOS'}
            }, 60)
          })
        }

        // Apple Liquid Glass toggle
        const cmdLiquid = d.querySelector('#cmdLiquidToggle')
        if (cmdLiquid) {
          cmdLiquid.addEventListener('click', function () {
            const enabled = typeof window.toggleAppleLiquidGlass === 'function' ? window.toggleAppleLiquidGlass() : false
            cmdLiquid.classList.toggle('active', enabled)
            const desc = document.getElementById('cmdLiquidDesc')
            if (desc) {
              desc.textContent = enabled ? 'Apple VisionOS & iOS' : 'Standard Material'
            }
          })
        }

        // Login button
        const loginBtn = d.querySelector('#cmdLoginBtn')
        if (loginBtn) {
          loginBtn.addEventListener('click', function () {
            closeDrawer()
            if (typeof window.openLogin === 'function') {window.openLogin()}
            else {location.href = '/dashboard'}
          })
        }

        // Auto-close on link tap
        d.querySelectorAll('a').forEach(function (link) {
          link.addEventListener('click', closeDrawer)
        })

        // Swipe to dismiss mobile drawer (horizontal swipe > 80px)
        let _sx = 0, _sy = 0
        d.addEventListener(
          'touchstart',
          function (e) {
            _sx = e.touches[0].clientX
            _sy = e.touches[0].clientY
          },
          { passive: true }
        )
        d.addEventListener(
          'touchend',
          function (e) {
            const dx = e.changedTouches[0].clientX - _sx
            const dy = e.changedTouches[0].clientY - _sy
            if (dx > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              closeDrawer()
            }
          },
          { passive: true }
        )

        return _drawer
      }

      function openDrawer() {
        const d = getOrCreateMobileDrawer()
        d.classList.add('active')
        lockNav()
        if (mmb) {mmb.classList.add('active')}
        const bbarMenu = document.querySelector('.bbar-menu')
        if (bbarMenu) {bbarMenu.classList.add('act')}
        haptic('light')
      }

      function closeDrawer() {
        const wasOpen = _drawer && _drawer.classList.contains('active')
        if (_drawer) {_drawer.classList.remove('active')}
        unlockNav()
        if (mmb) {mmb.classList.remove('active')}
        const bbarMenu = document.querySelector('.bbar-menu')
        if (bbarMenu) {bbarMenu.classList.remove('act')}
        if (wasOpen) {haptic('medium')}
      }

      window.openMobileDrawer = openDrawer
      window.closeMobileDrawer = closeDrawer

      mmb.addEventListener('click', function () {
        const d = getOrCreateMobileDrawer()
        if (d.classList.contains('active')) {closeDrawer()}
        else {openDrawer()}
      })

      // Android Native App detection
      if (/ClassOfLearnersApp/i.test(navigator.userAgent)) {
        document.documentElement.classList.add('is-android-app')
        document.body.classList.add('is-android-app')
      }

      // Close on Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isNavOpen()) {
          closeDrawer()
        }
      })

      // Mobile dropdown toggle (accordion, no propagation to drawer close)
      const dropdowns = nl.querySelectorAll('.dropdown')
      dropdowns.forEach(function (dd) {
        const btn = dd.querySelector('.dropdown-btn')
        if (btn) {
          btn.setAttribute('aria-expanded', 'false')
          btn.addEventListener('click', function (e) {
            e.preventDefault()
            e.stopPropagation()
            const willOpen = !dd.classList.contains('active')
            // close others (accordion)
            dropdowns.forEach(function (o) {
              if (o !== dd) {
                o.classList.remove('active')
                const b = o.querySelector('.dropdown-btn')
                if (b) {b.setAttribute('aria-expanded', 'false')}
              }
            })
            dd.classList.toggle('active')
            btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false')
            haptic('light')
          })
        }
      })


      // In-App Update Button (Version Aware)
      try {
        const isWebView = /wv/i.test(navigator.userAgent) || /Build\//i.test(navigator.userAgent)
        if (isWebView) {
          fetch('/version.json?t=' + Date.now())
            .then((r) => r.json())
            .then((data) => {
              const currentV = localStorage.getItem('col_apk_version') || '0'
              if (parseInt(data.versionCode, 10) > parseInt(currentV, 10)) {
                if (!document.getElementById('apkUpdateBtn')) {
                  const updBtn = document.createElement('a')
                  updBtn.id = 'apkUpdateBtn'
                  updBtn.href = data.apkUrl || '/COL.apk'
                  updBtn.className = 'cmd-btn-primary mobile-dl'
                  updBtn.innerHTML = 'Update App (v' + (data.versionName || data.versionCode) + ')'
                  updBtn.style.display = 'flex'
                  updBtn.style.backgroundColor = 'var(--signal, #F2B84B)'
                  updBtn.style.color = '#000'
                  updBtn.style.textAlign = 'center'
                  updBtn.setAttribute('download', '')
                  updBtn.onclick = function () {
                    localStorage.setItem('col_apk_version', data.versionCode)
                    setTimeout(() => {
                      this.style.display = 'none'
                    }, 1000)
                    alert('Downloading update... Please open your notifications or file manager to install the new version.')
                  }
                  const drawer = getOrCreateMobileDrawer()
                  const deck = drawer ? drawer.querySelector('.cmd-actions-deck') : null
                  if (deck) {
                    deck.prepend(updBtn)
                  } else {
                    const nlElem = document.querySelector('.nav-links')
                    if (nlElem) {nlElem.appendChild(updBtn)}
                  }
                }
              }
            })
            .catch((_e) => console.warn('Could not fetch version for update check.'))
        }
      } catch (_e) {}
    }
  }
})()

// 3. Desktop Navbar Scroll State (.top-nav.s with Hysteresis & Initial Sync)
;(function () {
  function syncNavScroll() {
    var topNav = document.getElementById('topNav') || document.querySelector('.top-nav')
    if (!topNav) return
    var isPill = topNav.classList.contains('s')
    // Hysteresis deadzone: 60px down to enter pill mode, 25px up to return to stuck
    var threshold = isPill ? 25 : 60
    var shouldBePill = window.scrollY > threshold
    if (isPill !== shouldBePill) {
      topNav.classList.toggle('s', shouldBePill)
    }
  }

  var navTicking = false
  window.addEventListener(
    'scroll',
    function () {
      if (!navTicking) {
        requestAnimationFrame(function () {
          syncNavScroll()
          navTicking = false
        })
        navTicking = true
      }
    },
    { passive: true }
  )

  // Immediate sync on page load / DOM ready so back-navigation or pre-scrolled pages don't jump
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncNavScroll)
  } else {
    syncNavScroll()
  }
  window.addEventListener('load', syncNavScroll, { once: true })
})()

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (var r of registrations) { r.unregister(); }
      });
      if (typeof caches !== 'undefined') {
        caches.keys().then(function (names) {
          for (var name of names) { caches.delete(name); }
        });
      }
      return;
    }
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(
      function (registration) {
        console.log('SW registered: ', registration.scope)
      },
      function (err) {
        console.log('SW registration failed: ', err)
      }
    )
  })
}

// 4. APK Verification Badge (shown in-app after cert check)
window.addEventListener('col-apk-verified', function (e) {
  try {
    const existing = document.getElementById('colApkBadge')
    if (existing) {existing.remove()}
    if (!e.detail || !e.detail.verified) {return}
    const badge = document.createElement('div')
    badge.id = 'colApkBadge'
    badge.textContent = 'Verified APK'
    badge.style.cssText =
      'position:fixed;bottom:64px;left:50%;transform:translateX(-50%);background:var(--em,#34D399);color:#070A14;font-family:var(--sans,sans-serif);font-size:0.75rem;font-weight:600;padding:4px 12px;border-radius:20px;z-index:998;pointer-events:none;opacity:0;transition:opacity 0.3s;'
    document.body.appendChild(badge)
    requestAnimationFrame(function () {
      badge.style.opacity = '1'
    })
    setTimeout(function () {
      badge.style.opacity = '0'
      setTimeout(function () {
        badge.remove()
      }, 400)
    }, 3000)
  } catch (e) {}
})  // 5. Mobile App Download Popup — fixed popup var + uses new bottom bar
  // Popup is suppressed inside the Android WebView (in-app users already have the app)
  // and on non-Android devices (was a dead no-op branch before).
  try {
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isWebView = /wv/i.test(navigator.userAgent) || /Build\//i.test(navigator.userAgent)
    const hasPrompted = sessionStorage.getItem('col_app_prompted')

    if (isAndroid && !isWebView && !hasPrompted) {
    sessionStorage.setItem('col_app_prompted', 'true')

    const popup = document.createElement('div')
    popup.id = 'colAppPopup'
    const hasBotNav = document.querySelector('.col-bottom-bar') || document.querySelector('.mobile-bottom-nav')
    popup.style.position = 'fixed'
    popup.style.bottom = hasBotNav ? '75px' : '20px'
    popup.style.left = '20px'
    popup.style.right = '20px'
    popup.style.backgroundColor = 'var(--panel, #111827)'
    popup.style.color = 'var(--ink, #E8E3D8)'
    popup.style.padding = '15px 20px'
    popup.style.borderRadius = '12px'
    popup.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)'
    popup.style.zIndex = '9999'
    popup.style.display = 'flex'
    popup.style.flexDirection = 'column'
    popup.style.gap = '10px'
    popup.style.border = '1px solid var(--line, rgba(255,255,255,0.08))'
    popup.style.fontFamily = 'var(--sans, sans-serif)'

    popup.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center;">' +
      '<div style="font-weight:bold; font-size:1.1rem; color:var(--signal, #F2B84B);">Get the App</div>' +
      '<button id="closeAppPopup" aria-label="Close" style="background:none; border:none; color:var(--dim, #8891AA); font-size:1.4rem; cursor:pointer; padding:0; line-height:1; min-width:44px; min-height:44px;">&times;</button>' +
      '</div>' +
      '<div style="font-size:0.9rem; color:var(--dim, #8891AA); line-height:1.4;">Experience Class Of Learners natively on your mobile device for better performance.</div>' +
      '<a href="/COL.apk" download style="display:block; text-align:center; background:var(--signal, #F2B84B); color:#070A14; text-decoration:none; padding:12px; border-radius:8px; font-weight:bold; font-size:0.95rem; margin-top:5px; transition: opacity 0.2s;">Download Android APK</a>'

    document.body.appendChild(popup)

    document.getElementById('closeAppPopup').addEventListener('click', function () {
      popup.remove()
    })
  }
} catch (e) {}

// 6. Mobile Bottom Menu Bar (5-item thumb navigation, smooth scroll, haptics, safe-area aware)
function initBottomBar() {
  const isGame = /Driving|Academy|TrafficSetup/i.test(location.pathname)
  if (isGame) {return}

  function createOrUpdateBar() {
    // 1100px matches the CSS breakpoint that hides the desktop .nav-links and
    // shows the thumb bar. Using 900px left a 901–1100px dead zone where the
    // desktop nav was hidden AND the bottom bar was removed.
    if (window.innerWidth > 1100) {
      const existing = document.querySelector('.col-bottom-bar')
      if (existing) {existing.remove()}
      document.body.classList.remove('nav-lock')
      if (typeof window.closeMobileDrawer === 'function') {window.closeMobileDrawer()}
      const mmb = document.getElementById('mmb')
      if (mmb) {mmb.classList.remove('active')}
      return
    }
    if (document.querySelector('.col-bottom-bar')) {return}

    const bar = document.createElement('nav')
    bar.className = 'col-bottom-bar'
    bar.setAttribute('aria-label', 'Primary Mobile Navigation')

    let curPath = (location.pathname.split('/').pop() || 'home').replace('.html', '').toLowerCase()
    if (curPath === '' || curPath === 'index') {curPath = 'home'}
    const curHash = location.hash || ''

    function isAct(target) {
      if (target === 'home') {
        return (curPath === 'home' && (!curHash || curHash === '#' || curHash === '#hero')) ? ' act' : ''
      }
      if (target === 'projects') {
        return (curHash === '#projects' || curPath === 'projects') ? ' act' : ''
      }
      return curPath === target ? ' act' : ''
    }

    bar.innerHTML =
      '<a href="/" class="bbar-item' + isAct('home') + '" data-tab="home" aria-label="Home">' +
      '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
      '<span>Home</span>' +
      '</a>' +
      '<a href="/#projects" class="bbar-item' + isAct('projects') + '" data-tab="projects" aria-label="Projects">' +
      '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>' +
      '<span>Projects</span>' +
      '</a>' +
      '<button type="button" class="bbar-item bbar-menu bbar-menu-center" data-tab="menu" aria-label="Open Menu">' +
      '<svg viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>' +
      '<span>Menu</span>' +
      '</button>' +
      '<a href="/school" class="bbar-item' + isAct('school') + '" data-tab="school" aria-label="School">' +
      '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>' +
      '<span>School</span>' +
      '</a>' +
      '<a href="/about" class="bbar-item' + isAct('about') + '" data-tab="about" aria-label="About">' +
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
      '<span>About</span>' +
      '</a>'

    document.body.appendChild(bar)

    // Event handlers with haptic feedback
    bar.querySelectorAll('.bbar-item').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (navigator.vibrate) {navigator.vibrate(10)}
        const tab = btn.getAttribute('data-tab')

        if (tab === 'projects' && (curPath === 'home' || curPath === '')) {
          const pTarget = document.getElementById('projects')
          if (pTarget) {
            e.preventDefault()
            pTarget.scrollIntoView({ behavior: 'smooth' })
            try { history.replaceState(null, '', '#projects') } catch (err) {}
            bar.querySelectorAll('.bbar-item').forEach(function (el) { el.classList.remove('act') })
            btn.classList.add('act')
          }
        } else if (tab === 'menu') {
          e.preventDefault()
          if (typeof window.openMobileDrawer === 'function') {
            const d = document.getElementById('colMobileDrawer')
            if (d && d.classList.contains('active')) {
              window.closeMobileDrawer()
            } else {
              window.openMobileDrawer()
            }
          } else {
            const mmb = document.getElementById('mmb')
            if (mmb) {mmb.click()}
          }
        }
      })
    })

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOrUpdateBar)
  } else {
    createOrUpdateBar()
  }
  window.addEventListener('resize', createOrUpdateBar)
}
initBottomBar()

// 7. Buy Me A Coffee Global Floating Action Badge
function initBmcBadge() {
  // Respect a previous dismissal so the badge stops getting in the way.
  try { if (localStorage.getItem('bmc-dismissed') === '1') {return} } catch (e) {}

  if (document.getElementById('bmc-floating-badge')) {return}

  function createBadge() {
    if (document.getElementById('bmc-floating-badge')) {return}
    if (!document.body) {return}

    const badge = document.createElement('aside')
    badge.id = 'bmc-floating-badge'
    badge.className = 'bmc-floating-badge'
    badge.setAttribute('aria-label', 'Support Creator')
    badge.innerHTML = '<button type="button" class="bmc-dismiss" aria-label="Dismiss support badge" title="Dismiss">&times;</button><a href="https://www.buymeacoffee.com/NeelAniGamer" target="_blank" rel="noopener noreferrer" title="Buy Me A Coffee" aria-label="Buy Me A Coffee"><img src="/bmc-button.svg" draggable="false" onerror="if(this.src.indexOf(\'img.buymeacoffee.com\')===-1)this.src=\'https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=NeelAniGamer&button_colour=5F7FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00\'" alt="Buy Me A Coffee" width="180" height="40" loading="lazy" /></a>'

    document.body.appendChild(badge)

    const dismiss = badge.querySelector('.bmc-dismiss')
    if (dismiss) {
      dismiss.addEventListener('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        try { localStorage.setItem('bmc-dismissed', '1') } catch (err) {}
        badge.remove()
      })
    }

    // 7. Draggable badge: let users move it out of the way.
    makeBmcDraggable(badge)
  }

  function makeBmcDraggable(badge) {
    // Restore saved position.
    try {
      const saved = JSON.parse(localStorage.getItem('bmc-pos') || 'null')
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        badge.style.left = saved.x + 'px'
        badge.style.top = saved.y + 'px'
        badge.style.right = 'auto'
        badge.style.bottom = 'auto'
      }
    } catch (e) {}

    // The badge surface is entirely covered by the <a> (and the dismiss
    // button), so the old `closest('.bmc-dismiss, a')` guard made every
    // pointer-down bail out and dragging could never start. Instead we
    // allow a drag to begin anywhere except the dismiss button, and only
    // treat it as a drag once the pointer has travelled more than 6px.
    let pointerDown = false
    let didDrag = false
    let suppressNextClick = false
    let startX = 0, startY = 0, origX = 0, origY = 0

    function onDown(e) {
      if (e.target && e.target.closest && e.target.closest('.bmc-dismiss')) {return}
      if (e.type === 'mousedown' && e.button !== 0) {return}
      pointerDown = true
      didDrag = false
      suppressNextClick = false
      const pt = e.touches ? e.touches[0] : e
      startX = pt.clientX
      startY = pt.clientY
      const rect = badge.getBoundingClientRect()
      origX = rect.left
      origY = rect.top
      // Suppress the browser's native image drag. Without this the <img>
      // starts a native drag on the first few pixels of movement, which
      // swallows the remaining mousemove/mouseup events and the badge
      // never tracks the pointer.
      if (e.cancelable) {e.preventDefault()}
    }

    function onMove(e) {
      if (!pointerDown) {return}
      const pt = e.touches ? e.touches[0] : e
      const dx = pt.clientX - startX
      const dy = pt.clientY - startY
      if (!didDrag && Math.hypot(dx, dy) > 6) {
        didDrag = true
        badge.style.cursor = 'grabbing'
      }
      if (!didDrag) {return}
      if (e.cancelable) {e.preventDefault()}
      // Clamp to viewport.
      const w = badge.offsetWidth, h = badge.offsetHeight
      const x = Math.max(8, Math.min(window.innerWidth - w - 8, origX + dx))
      const y = Math.max(8, Math.min(window.innerHeight - h - 8, origY + dy))
      badge.style.left = x + 'px'
      badge.style.top = y + 'px'
      badge.style.right = 'auto'
      badge.style.bottom = 'auto'
    }

    function onUp() {
      if (!pointerDown) {return}
      pointerDown = false
      badge.style.cursor = 'grab'
      if (didDrag) {
        // The click that follows a drag must not open the badge link.
        // Use a dedicated flag rather than reusing `didDrag`, because the
        // dismiss button's own click handler lives inside the badge and
        // would be swallowed by a capture-phase stopPropagation().
        suppressNextClick = true
        try {
          const rect = badge.getBoundingClientRect()
          localStorage.setItem('bmc-pos', JSON.stringify({ x: rect.left, y: rect.top }))
        } catch (e) {}
      }
    }

    // Swallow the click that ends a drag so the badge link does not open.
    // The dismiss button is exempt so it stays usable after a drag.
    badge.addEventListener(
      'click',
      function (e) {
        if (!suppressNextClick) {return}
        if (e.target && e.target.closest && e.target.closest('.bmc-dismiss')) {
          suppressNextClick = false
          return
        }
        e.preventDefault()
        e.stopPropagation()
        suppressNextClick = false
      },
      true
    )

    badge.addEventListener('mousedown', onDown)
    badge.addEventListener('touchstart', onDown, { passive: true })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    badge.style.cursor = 'grab'
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBadge)
  } else {
    createBadge()
  }
}
initBmcBadge()

// Global canonical theme helpers for all pages
window.safeThemeGet = function () {
  try {
    return localStorage.getItem('theme')
  } catch (e) {
    return null
  }
}

window.safeThemeSet = function (val) {
  try {
    localStorage.setItem('theme', val)
  } catch (e) {}
}

window.hzSync = function () {
  const isLight = document.body ? document.body.classList.contains('lm') : document.documentElement.classList.contains('lm')
  const toggles = document.querySelectorAll('.hz-toggle')
  toggles.forEach(function (el) {
    if (isLight) {el.classList.remove('night')}
    else {el.classList.add('night')}
  })
  const desc = document.getElementById('cmdThemeDesc')
  if (desc) {desc.textContent = isLight ? 'Light Mica' : 'Dark VisionOS'}
  const tl = document.getElementById('tLabel')
  if (tl) {tl.textContent = isLight ? 'Light Mode' : 'Dark Mode'}
  const tsck = document.getElementById('tsck')
  if (tsck) {tsck.checked = isLight}
  const meta = document.getElementById('themeMeta') || document.querySelector('meta[name="theme-color"]')
  if (meta) {meta.setAttribute('content', isLight ? '#f3f2eb' : '#070a14')}
}

window.hzToggle = function () {
  if (navigator.vibrate) {
    try { navigator.vibrate(8) } catch (_e) {}
  }
  const willBeLight = !document.documentElement.classList.contains('lm')
  if (willBeLight) {
    document.documentElement.classList.add('lm')
    if (document.body) {document.body.classList.add('lm')}
    window.safeThemeSet('light')
  } else {
    document.documentElement.classList.remove('lm')
    if (document.body) {document.body.classList.remove('lm')}
    window.safeThemeSet('dark')
  }
  window.hzSync()
}

// Canonical alias for legacy pages calling window.toggleTheme
window.toggleTheme = function (el) {
  if (el && typeof el.checked === 'boolean') {
    const wantLight = el.checked
    if (wantLight) {
      document.documentElement.classList.add('lm')
      if (document.body) {document.body.classList.add('lm')}
      window.safeThemeSet('light')
    } else {
      document.documentElement.classList.remove('lm')
      if (document.body) {document.body.classList.remove('lm')}
      window.safeThemeSet('dark')
    }
    window.hzSync()
  } else {
    window.hzToggle()
  }
}

// Immediately restore theme on script load
;(function () {
  const saved = window.safeThemeGet()
  if (saved === 'light') {
    document.documentElement.classList.add('lm')
    if (document.body) {document.body.classList.add('lm')}
    else {document.addEventListener('DOMContentLoaded', function () { document.body.classList.add('lm') })}
  } else if (saved === 'dark') {
    document.documentElement.classList.remove('lm')
    if (document.body) {document.body.classList.remove('lm')}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.hzSync)
  } else {
    window.hzSync()
  }
})()


