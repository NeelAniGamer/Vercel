// Shared UI Logic: Cursor, Theme Toggle, Mobile Menu
;(function () {
  // 1. Cursor
  var dot = document.getElementById('cDot'),
    ring = document.getElementById('cRing')
  if (dot && ring) {
    var mx = 0,
      my = 0,
      rx = 0,
      ry = 0
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX
      my = e.clientY
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)'
    })
    ;(function draw() {
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

  // 2. Mobile Menu & In-App Updater — Engineered for 720p→2K
  var mmb = document.getElementById('mmb'),
    nl = document.getElementById('navLinks')
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

      mmb.addEventListener('click', function () {
        var willOpen = !nl.classList.contains('active')
        nl.classList.toggle('active')
        mmb.classList.toggle('active')
        if (willOpen) lockNav()
        else unlockNav()
      })

      // Close mobile menu when a standard link is clicked
      nl.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          if (isNavOpen()) {
            nl.classList.remove('active')
            mmb.classList.remove('active')
            unlockNav()
          }
        })
      })

      // Close on backdrop click (tap outside inner content)
      nl.addEventListener('click', function (e) {
        if (e.target === nl && isNavOpen()) {
          nl.classList.remove('active')
          mmb.classList.remove('active')
          unlockNav()
        }
      })

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
          })
        }
      })

      // Inject bottom thumb bar for mobile (auto)
      try {
        if (!document.querySelector('.col-bottom-bar') && window.innerWidth <= 900) {
          var bar = document.createElement('nav')
          bar.className = 'col-bottom-bar'
          bar.setAttribute('aria-label', 'Primary')
          var path = (location.pathname.split('/').pop() || 'home').replace('.html', '')
          function act(h) {
            return path === h || (h === 'home' && (path === '' || path === 'index')) ? ' class="act"' : ''
          }
          bar.innerHTML =
            '<a href="/"' +
            act('home') +
            '><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></a>' +
            '<a href="about"' +
            act('about') +
            '><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><span>About</span></a>' +
            '<a href="school"' +
            act('school') +
            '><svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg><span>School</span></a>' +
            '<a href="download"' +
            act('download') +
            '><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download</span></a>'
          document.body.appendChild(bar)
        }
      } catch (e) {}

      // In-App Update Button (Version Aware)
      try {
        var isWebView = /wv/i.test(navigator.userAgent) || /Build\//i.test(navigator.userAgent)
        if (isWebView) {
          fetch('version.json?t=' + Date.now())
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
  var isChecked = el.checked
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
})

// 5. Mobile App Download Popup — fixed popup var + uses new bottom bar
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
      '<button id="closeAppPopup" style="background:none; border:none; color:var(--dim, #8891AA); font-size:1.4rem; cursor:pointer; padding:0; line-height:1;">&times;</button>' +
      '</div>' +
      '<div style="font-size:0.9rem; color:var(--dim, #8891AA); line-height:1.4;">Experience Class Of Learners natively on your mobile device for better performance.</div>' +
      '<a href="/COL.apk" download style="display:block; text-align:center; background:var(--signal, #F2B84B); color:#070A14; text-decoration:none; padding:12px; border-radius:8px; font-weight:bold; font-size:0.95rem; margin-top:5px; transition: opacity 0.2s;">Download Android APK</a>'

    document.body.appendChild(popup)

    document.getElementById('closeAppPopup').addEventListener('click', function () {
      popup.remove()
    })
  }
} catch (e) {}
