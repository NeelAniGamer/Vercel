// pull-refresh.js — Pull-to-Refresh + Apple Liquid Glass Engine
// Loaded on every page via col-ui.js or inline script.
;(function () {
  'use strict'

  // ═══════════════════════════════════════════════════════════════════════
  // 1. iPhone & Desktop Apple Liquid Glass Engine + Caustic Aurora Mount
  // ═══════════════════════════════════════════════════════════════════════
  function mountLiquidBackdrop() {
    if (!document.documentElement.classList.contains('apple-glass') && !document.documentElement.classList.contains('is-iphone')) return
    if (document.getElementById('apple-liquid-backdrop')) return
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', mountLiquidBackdrop)
      return
    }
    var backdrop = document.createElement('div')
    backdrop.id = 'apple-liquid-backdrop'
    backdrop.className = 'apple-liquid-backdrop'
    backdrop.setAttribute('aria-hidden', 'true')
    backdrop.innerHTML =
      '<div class="apple-glass-orb apple-orb-amber"></div>' +
      '<div class="apple-glass-orb apple-orb-cyan"></div>' +
      '<div class="apple-glass-orb apple-orb-purple"></div>' +
      '<div class="apple-glass-orb apple-orb-emerald"></div>' +
      '<div class="apple-glass-orb apple-orb-rose"></div>' +
      '<div class="apple-glass-orb apple-orb-center"></div>'
    document.body.prepend(backdrop)
  }

  function detectLiquidGlass() {
    var ua = navigator.userAgent || ''
    var platform = navigator.platform || ''
    var forceIPhone = false
    var glassPref = null
    try {
      glassPref = (window.ColCookie ? window.ColCookie.get('liquid_glass') : null) || localStorage.getItem('liquid_glass')
      forceIPhone =
        window.location.search.indexOf('iphone=1') !== -1 ||
        (window.ColCookie ? window.ColCookie.get('force_iphone') === 'true' : false) ||
        localStorage.getItem('force_iphone') === 'true'
    } catch (e) {}

    var pName = (window.location.pathname || '').toLowerCase()
    var isHome = pName === '' || pName === '/' || pName === '/home' || pName.indexOf('home.html') !== -1
    var hasGlassFlag = window.location.search.indexOf('glass=1') !== -1

    // Enable Master Apple Glass by default on home.html, or if preference is true, or with glass=1
    var enableGlass = (glassPref === 'true') || (isHome && glassPref !== 'false') || hasGlassFlag

    if (enableGlass) {
      document.documentElement.classList.add('apple-glass')
      mountLiquidBackdrop()
    }

    var isIPhone = (/iPhone/i.test(ua) || platform === 'iPhone' || forceIPhone) && !/iPad/i.test(ua)
    if (isIPhone) {
      document.documentElement.classList.add('is-iphone')
      var match = ua.match(/OS (\d+)_/)
      if (match) {
        var version = parseInt(match[1], 10)
        document.documentElement.classList.add('ios-' + version)
        if (version >= 17) {
          document.documentElement.classList.add('ios-17-plus')
        }
      }
      mountLiquidBackdrop()
    }
  }

  window.toggleAppleLiquidGlass = function (force) {
    var isCurrentlyOn = document.documentElement.classList.contains('apple-glass') || document.documentElement.classList.contains('is-iphone')
    var willEnable = typeof force === 'boolean' ? force : !isCurrentlyOn
    try {
      if (window.ColCookie) {
        window.ColCookie.set('force_iphone', willEnable ? 'true' : 'false', 365)
        window.ColCookie.set('liquid_glass', willEnable ? 'true' : 'false', 365)
      }
      localStorage.setItem('force_iphone', willEnable ? 'true' : 'false')
      localStorage.setItem('liquid_glass', willEnable ? 'true' : 'false')
    } catch (e) {}
    if (willEnable) {
      document.documentElement.classList.add('apple-glass', 'is-iphone')
      mountLiquidBackdrop()
    } else {
      document.documentElement.classList.remove('apple-glass', 'is-iphone')
      var el = document.getElementById('apple-liquid-backdrop')
      if (el && el.parentNode) el.parentNode.removeChild(el)
    }
    return willEnable
  }

  detectLiquidGlass()

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Native Browser Pull-to-Refresh Enablement (iOS Safari & Android Chrome)
  // ═══════════════════════════════════════════════════════════════════════
  function enableNativePullToRefresh() {
    // Ensure document and body explicitly permit native browser overscroll and pull-down reload
    try {
      if (document.documentElement) {
        document.documentElement.style.overscrollBehaviorY = 'auto'
      }
      if (document.body) {
        document.body.style.overscrollBehaviorY = 'auto'
      }
    } catch (e) {}

    // Clean up any stale synthetic indicators or styles if present
    var staleInd = document.getElementById('apple-pull-indicator') || document.getElementById('pull-indicator')
    if (staleInd && staleInd.parentNode) {
      staleInd.parentNode.removeChild(staleInd)
    }
    var staleStyle = document.getElementById('apple-pull-style') || document.getElementById('pull-spin-style')
    if (staleStyle && staleStyle.parentNode) {
      staleStyle.parentNode.removeChild(staleStyle)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableNativePullToRefresh)
  } else {
    enableNativePullToRefresh()
  }
})()
