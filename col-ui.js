// Shared UI Logic: Cursor, Ambient Background, Theme Toggle, Mobile Menu
;(function () {
  // Haptic feedback helper — silent on desktop, uses navigator.vibrate on mobile
  function haptic(style) {
    if (!navigator.vibrate) return
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
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
  // Mobile: 2 orbs instead of 3 (cut GPU layer cost ~33%). Layers pause via
  // .col-perf-pause when scrolled out of view or the tab is hidden.
  function initAmbientVisuals() {
    if (document.querySelector('.col-ambient-bg')) return;
    var isCoarse = window.matchMedia('(pointer: coarse)').matches;
    // SKIP ambient orbs entirely on mobile — 3 constant CSS animations
    // burn GPU for near-zero visual gain on small screens.
    if (isCoarse) return;
    var isLowEnd = navigator.hardwareConcurrency <= 4;
    var bg = document.createElement('div');
    bg.className = 'col-ambient-bg';
    bg.setAttribute('aria-hidden', 'true');
    var orbs = '<div class="col-ambient-orb col-orb-1"></div><div class="col-ambient-orb col-orb-2"></div>';
    if (!isLowEnd) orbs += '<div class="col-ambient-orb col-orb-3"></div>';
    bg.innerHTML = orbs + (isCoarse ? '' : '<div class="col-ambient-spotlight"></div>');
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
  // Pause orb animations while the fixed background is fully covered by content
  // or the tab is hidden — stops ~3 constant composited animations per page.
  // Also pauses on low-end devices (<=4 cores) to save battery.
  function setupAmbientPause(bg) {
    var hasIO = 'IntersectionObserver' in window;
    var onScreen = true;
    var lowEnd = (navigator.hardwareConcurrency || 4) <= 4;
    function apply() {
      bg.classList.toggle('col-perf-pause', !onScreen || document.hidden || lowEnd);
    }
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        apply();
      }, { threshold: 0 }).observe(bg);
    }
    document.addEventListener('visibilitychange', apply);
    if (lowEnd) apply();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAmbientVisuals);
  } else {
    initAmbientVisuals();
  }

  // 1. Cursor & Mouse Spotlight Tracking (Desktop pointer only — zero mobile CPU overhead)
  var isTouch = window.matchMedia('(pointer: coarse)').matches
  var isGamePage = /Driving|Academy|solar|gesture|rpg/i.test(location.pathname)

  if (!isTouch && !isGamePage) {
    var dot = document.getElementById('cDot'),
      ring = document.getElementById('cRing')
    var spot = document.querySelector('.col-ambient-spotlight')
    var mx = window.innerWidth / 2,
      my = window.innerHeight / 3,
      rx = mx,
      ry = my
    var rafPending = false

    document.addEventListener(
      'mousemove',
      function (e) {
        mx = e.clientX
        my = e.clientY
        if (dot) dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)'
        if (!rafPending) {
          rafPending = true
          requestAnimationFrame(function () {
            // Direct style mutation on spotlight element avoids full DOM tree style recalculation
            if (spot) {
              spot.style.background =
                'radial-gradient(600px circle at ' + mx + 'px ' + my + 'px, rgba(94, 212, 245, 0.05), transparent 70%)'
            }
            rafPending = false
          })
        }
      },
      { passive: true }
    )

    if (dot && ring) {
      var _cursorFrame = 0
      ;(function draw() {
        if (document.hidden) {
          requestAnimationFrame(draw)
          return
        }
        _cursorFrame++
        if (_cursorFrame % 2 === 0) {
          requestAnimationFrame(draw)
          return
        }
        rx += (mx - rx) * 0.13
        ry += (my - ry) * 0.13
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)'
        requestAnimationFrame(draw)
      })()
      document.querySelectorAll('a,button,select,input,.typing-area').forEach(function (el) {
        el.addEventListener('mouseenter', function () {
          document.body.classList.add('ch')
        })
        el.addEventListener('mouseleave', function () {
          document.body.classList.remove('ch')
        })
      })
    }
  }

  // 2. Mobile Menu & In-App Updater — Engineered for 720p→2K
  var mmb = document.getElementById('mmb'),
    nl = document.getElementById('navLinks')
  var isGamePage2 = /Driving|Academy|solar|gesture|rpg/i.test(location.pathname)
  if (mmb) {
    mmb.innerHTML = '<span class="m-line"></span><span class="m-line"></span><span class="m-line"></span>'
    mmb.setAttribute('aria-label', 'Toggle navigation menu')
    mmb.setAttribute('aria-expanded', 'false')
    if (nl) {
      // — Helper: lock body scroll without layout shift —
      var _lockY = 0
      function lockNav() {
        _lockY = window.scrollY
        var sb = window.innerWidth - document.documentElement.clientWidth
        if (sb > 0) document.documentElement.style.setProperty('--scrollbar-comp', sb + 'px')
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
        window.scrollTo(0, _lockY)
        mmb.setAttribute('aria-expanded', 'false')
        nl.setAttribute('aria-hidden', 'true')
      }
      function isNavOpen() {
        return nl.classList.contains('active')
      }

      // Dedicated, Isolated Centered Mobile Drawer
      var _drawer = null
      function getOrCreateMobileDrawer() {
        if (_drawer) return _drawer
        var existing = document.getElementById('colMobileDrawer')
        if (existing) {
          _drawer = existing
          return _drawer
        }

        var d = document.createElement('div')
        d.id = 'colMobileDrawer'
        d.className = 'col-mobile-drawer'
        d.setAttribute('aria-modal', 'true')
        d.setAttribute('role', 'dialog')
        d.setAttribute('aria-label', 'Mobile Navigation')

        var curPath = (location.pathname.split('/').pop() || 'home').replace('.html', '').toLowerCase()
        if (curPath === '' || curPath === 'index') curPath = 'home'

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
        var closeBtn = d.querySelector('#cmdCloseBtn')
        if (closeBtn) closeBtn.addEventListener('click', closeDrawer)
        var backdrop = d.querySelector('#cmdBackdrop')
        if (backdrop) backdrop.addEventListener('click', closeDrawer)

        // Accordion toggle
        var accBtn = d.querySelector('#cmdAccBtn')
        var acc = d.querySelector('#cmdAccordion')
        if (accBtn && acc) {
          accBtn.addEventListener('click', function () {
            acc.classList.toggle('active')
          })
        }

        // Theme toggle
        var cmdHz = d.querySelector('#cmdHzToggle')
        if (cmdHz) {
          cmdHz.addEventListener('click', function () {
            if (typeof window.hzToggle === 'function') {
              window.hzToggle()
            } else {
              document.body.classList.toggle('lm')
              try { localStorage.setItem('theme', document.body.classList.contains('lm') ? 'light' : 'dark') } catch (e) {}
            }
            setTimeout(function () {
              var desc = document.getElementById('cmdThemeDesc')
              if (desc) desc.textContent = document.body.classList.contains('lm') ? 'Light Mica' : 'Dark VisionOS'
            }, 60)
          })
        }

        // Login button
        var loginBtn = d.querySelector('#cmdLoginBtn')
        if (loginBtn) {
          loginBtn.addEventListener('click', function () {
            closeDrawer()
            if (typeof window.openLogin === 'function') window.openLogin()
            else location.href = '/dashboard'
          })
        }

        // Auto-close on link tap
        d.querySelectorAll('a').forEach(function (link) {
          link.addEventListener('click', closeDrawer)
        })

        return _drawer
      }

      function openDrawer() {
        var d = getOrCreateMobileDrawer()
        d.classList.add('active')
        lockNav()
        if (mmb) mmb.classList.add('active')
        var bbarMenu = document.querySelector('.bbar-menu')
        if (bbarMenu) bbarMenu.classList.add('act')
        haptic('light')
      }

      function closeDrawer() {
        var wasOpen = _drawer && _drawer.classList.contains('active')
        if (_drawer) _drawer.classList.remove('active')
        unlockNav()
        if (mmb) mmb.classList.remove('active')
        var bbarMenu = document.querySelector('.bbar-menu')
        if (bbarMenu) bbarMenu.classList.remove('act')
        if (wasOpen) haptic('medium')
      }

      window.openMobileDrawer = openDrawer
      window.closeMobileDrawer = closeDrawer

      mmb.addEventListener('click', function () {
        var d = getOrCreateMobileDrawer()
        if (d.classList.contains('active')) closeDrawer()
        else openDrawer()
      })

      // Android Native App detection
      if (/ClassOfLearnersApp/i.test(navigator.userAgent)) {
        document.documentElement.classList.add('is-android-app')
        document.body.classList.add('is-android-app')
      }

      // Close on Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isNavOpen()) {
          nl.classList.remove('active')
          mmb.classList.remove('active')
          unlockNav()
        }
      })

      // Swipe to close (left swipe)
      var _sx = 0
      nl.addEventListener(
        'touchstart',
        function (e) {
          _sx = e.touches[0].clientX
        },
        { passive: true }
      )
      nl.addEventListener(
        'touchend',
        function (e) {
          var dx = e.changedTouches[0].clientX - _sx
          if (dx > 80 && isNavOpen()) {
            nl.classList.remove('active')
            mmb.classList.remove('active')
            unlockNav()
          }
        },
        { passive: true }
      )

      // Mobile dropdown toggle (accordion, no propagation to drawer close)
      var dropdowns = nl.querySelectorAll('.dropdown')
      dropdowns.forEach(function (dd) {
        var btn = dd.querySelector('.dropdown-btn')
        if (btn) {
          btn.setAttribute('aria-expanded', 'false')
          btn.addEventListener('click', function (e) {
            e.preventDefault()
            e.stopPropagation()
            var willOpen = !dd.classList.contains('active')
            // close others (accordion)
            dropdowns.forEach(function (o) {
              if (o !== dd) {
                o.classList.remove('active')
                var b = o.querySelector('.dropdown-btn')
                if (b) b.setAttribute('aria-expanded', 'false')
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
        var isWebView = /wv/i.test(navigator.userAgent) || /Build\//i.test(navigator.userAgent)
        if (isWebView) {
          fetch('/version.json?t=' + Date.now())
            .then((r) => r.json())
            .then((data) => {
              var currentV = localStorage.getItem('col_apk_version') || '0'
              if (parseInt(data.versionCode) > parseInt(currentV)) {
                var nl = document.querySelector('.nav-links')
                if (nl && !document.getElementById('apkUpdateBtn')) {
                  var updBtn = document.createElement('a')
                  updBtn.id = 'apkUpdateBtn'
                  updBtn.href = data.apkUrl || '/COL.apk'
                  updBtn.className = 'nav-dl-btn mobile-dl'
                  updBtn.innerHTML = 'Update App'
                  updBtn.style.display = 'block'
                  updBtn.style.marginTop = '10px'
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
                  nl.appendChild(updBtn)
                }
              }
            })
            .catch((e) => console.warn('Could not fetch version for update check.'))
        }
      } catch (e) {}
    }
  }

  // 3. Setup initial theme based on Storage if Storage exists (from col-auth.js or inline)
  // Actually, col-router.js or home.html defines Storage, but if it doesn't, we fallback to localStorage directly.
  try {
    var savedTheme = localStorage.getItem('theme')
    var tl = document.getElementById('tLabel')
    var tsck = document.getElementById('tsck')

    if (savedTheme === 'light') {
      document.body.classList.add('lm')
      if (tsck) tsck.checked = true
      if (tl) tl.textContent = 'Light Mode'
    } else {
      // Explicitly enforce Dark Mode
      document.body.classList.remove('lm')
      if (tsck) tsck.checked = false
      if (tl) tl.textContent = 'Dark Mode'
      localStorage.setItem('theme', 'dark')
    }
  } catch (e) {}
})()

window.toggleTheme = function (el) {
  // rAF-deferred so the checkbox click event completes instantly (fixes INP)
  var isChecked = el && el.checked;
  try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
  requestAnimationFrame(function () {
    var tl = document.getElementById('tLabel')
    if (isChecked) {
      document.body.classList.add('lm')
      try {
        localStorage.setItem('theme', 'light')
      } catch (e) {}
      if (tl) tl.textContent = 'Light Mode'
    } else {
      document.body.classList.remove('lm')
      try {
        localStorage.setItem('theme', 'dark')
      } catch (e) {}
      if (tl) tl.textContent = 'Dark Mode'
    }
  })
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
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
    var existing = document.getElementById('colApkBadge')
    if (existing) existing.remove()
    if (!e.detail || !e.detail.verified) return
    var badge = document.createElement('div')
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
    var isAndroid = /Android/i.test(navigator.userAgent)
    var isWebView = /wv/i.test(navigator.userAgent) || /Build\//i.test(navigator.userAgent)
    var hasPrompted = sessionStorage.getItem('col_app_prompted')

    if (isAndroid && !isWebView && !hasPrompted) {
    sessionStorage.setItem('col_app_prompted', 'true')

    var popup = document.createElement('div')
    popup.id = 'colAppPopup'
    var hasBotNav = document.querySelector('.col-bottom-bar') || document.querySelector('.mobile-bottom-nav')
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
  var isGame = /Driving|Academy|TrafficSetup/i.test(location.pathname)
  if (isGame) return

  function createOrUpdateBar() {
    if (window.innerWidth > 900) {
      var existing = document.querySelector('.col-bottom-bar')
      if (existing) existing.remove()
      document.body.classList.remove('nav-lock')
      if (typeof window.closeMobileDrawer === 'function') window.closeMobileDrawer()
      var mmb = document.getElementById('mmb')
      if (mmb) mmb.classList.remove('active')
      return
    }
    if (document.querySelector('.col-bottom-bar')) return

    var bar = document.createElement('nav')
    bar.className = 'col-bottom-bar'
    bar.setAttribute('aria-label', 'Primary Mobile Navigation')

    var curPath = (location.pathname.split('/').pop() || 'home').replace('.html', '').toLowerCase()
    if (curPath === '' || curPath === 'index') curPath = 'home'
    var curHash = location.hash || ''

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
        if (navigator.vibrate) navigator.vibrate(10)
        var tab = btn.getAttribute('data-tab')

        if (tab === 'projects' && (curPath === 'home' || curPath === '')) {
          var pTarget = document.getElementById('projects')
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
            var d = document.getElementById('colMobileDrawer')
            if (d && d.classList.contains('active')) {
              window.closeMobileDrawer()
            } else {
              window.openMobileDrawer()
            }
          } else {
            var mmb = document.getElementById('mmb')
            if (mmb) mmb.click()
          }
        }
      })
    })

    // Sync menu button active state with drawer state
    var menuBtn = bar.querySelector('.bbar-menu')
    var checkDrawerInterval = setInterval(function () {
      var d = document.getElementById('colMobileDrawer')
      if (d && menuBtn) {
        clearInterval(checkDrawerInterval)
        if ('MutationObserver' in window) {
          var obs = new MutationObserver(function () {
            var isOpen = d.classList.contains('active')
            menuBtn.classList.toggle('act', isOpen)
          })
          obs.observe(d, { attributes: true, attributeFilter: ['class'] })
        }
      }
    }, 200)

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOrUpdateBar)
  } else {
    createOrUpdateBar()
  }
  window.addEventListener('resize', createOrUpdateBar)
}
initBottomBar()

// Global theme helpers for all pages
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
  var isLight = document.body.classList.contains('lm')
  var toggles = document.querySelectorAll('.hz-toggle')
  toggles.forEach(function (el) {
    if (isLight) el.classList.remove('night')
    else el.classList.add('night')
  })
  var desc = document.getElementById('cmdThemeDesc')
  if (desc) desc.textContent = isLight ? 'Light Mica' : 'Dark VisionOS'
}

window.hzToggle = function () {
  if (navigator.vibrate) {
    try { navigator.vibrate(8) } catch (e) {}
  }
  document.body.classList.toggle('lm')
  var isLight = document.body.classList.contains('lm')
  window.safeThemeSet(isLight ? 'light' : 'dark')
  window.hzSync()
}

// Immediately restore theme on script load
;(function () {
  var saved = window.safeThemeGet()
  if (saved === 'light') {
    document.documentElement.classList.add('lm')
    if (document.body) document.body.classList.add('lm')
    else document.addEventListener('DOMContentLoaded', function () { document.body.classList.add('lm') })
  } else if (saved === 'dark') {
    document.documentElement.classList.remove('lm')
    if (document.body) document.body.classList.remove('lm')
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.hzSync)
  } else {
    window.hzSync()
  }
})()


