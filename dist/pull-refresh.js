// pull-refresh.js — Pull-to-Refresh + iPhone Liquid Glass Detection
// Loaded on every page via col-ui.js or inline script.
;(function () {
  'use strict'

  // ═══════════════════════════════════════════════════════════════════════
  // 1. iPhone Detection (iPhone ONLY) → adds .is-iphone to <html>
  // ═══════════════════════════════════════════════════════════════════════
  function detectiPhone() {
    var ua = navigator.userAgent || ''
    var platform = navigator.platform || ''
    var hasForceFlag = false
    try {
      hasForceFlag = window.location.search.indexOf('iphone=1') !== -1 || localStorage.getItem('force_iphone') === 'true'
    } catch (e) {}

    // Strict iPhone detection — excludes iPad, Mac, Android, and desktop browsers
    var isIPhone = (/iPhone/i.test(ua) || platform === 'iPhone' || hasForceFlag) && !/iPad/i.test(ua)

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
    }
  }

  detectiPhone()

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Pull-to-Refresh
  // ═══════════════════════════════════════════════════════════════════════
  function initPullToRefresh() {
    // Only on touch devices, only on pages that don't have their own scroll handling
    if (!('ontouchstart' in window)) return
    var isGamePage = /Driving|Academy|solar|gesture|rpg/i.test(location.pathname)
    if (isGamePage) return

    var pullThreshold = 80
    var startY = 0
    var pulling = false
    var indicator = null
    var spinner = null

    function createIndicator() {
      if (indicator) return
      indicator = document.createElement('div')
      indicator.id = 'pull-indicator'
      indicator.style.cssText = [
        'position:fixed',
        'top:-60px',
        'left:50%',
        'transform:translateX(-50%)',
        'width:44px',
        'height:44px',
        'border-radius:50%',
        'background:rgba(17,24,39,0.85)',
        'backdrop-filter:blur(16px) saturate(180%)',
        '-webkit-backdrop-filter:blur(16px) saturate(180%)',
        'border:1px solid rgba(255,255,255,0.15)',
        'box-shadow:0 4px 20px rgba(0,0,0,0.3)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'z-index:10001',
        'transition:top 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
        'pointer-events:none'
      ].join(';')

      spinner = document.createElement('div')
      spinner.style.cssText = [
        'width:20px',
        'height:20px',
        'border:2px solid rgba(255,255,255,0.2)',
        'border-top-color:#f2b84b',
        'border-radius:50%',
        'transition:transform 0.2s'
      ].join(';')
      indicator.appendChild(spinner)
      document.body.appendChild(indicator)
    }

    function removeIndicator() {
      if (indicator) {
        indicator.style.top = '-60px'
        setTimeout(function () {
          if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator)
            indicator = null
            spinner = null
          }
        }, 350)
      }
    }

    document.addEventListener('touchstart', function (e) {
      if (window.scrollY > 5) return
      startY = e.touches[0].clientY
      pulling = true
    }, { passive: true })

    document.addEventListener('touchmove', function (e) {
      if (!pulling) return
      var currentY = e.touches[0].clientY
      var diff = currentY - startY
      if (diff < 10 || window.scrollY > 0) {
        pulling = false
        return
      }

      createIndicator()
      var progress = Math.min(diff / pullThreshold, 1)
      var topPos = -60 + (60 + 16) * progress
      indicator.style.top = topPos + 'px'
      if (spinner) {
        spinner.style.transform = 'rotate(' + (progress * 360) + 'deg)'
      }
    }, { passive: true })

    document.addEventListener('touchend', function () {
      if (!pulling) return
      pulling = false

      if (indicator) {
        var currentTop = parseFloat(indicator.style.top)
        if (currentTop > -20) {
          // Threshold reached — trigger refresh
          if (spinner) {
            spinner.style.animation = 'pull-spin 0.6s linear infinite'
          }
          // Add spin keyframes if not present
          if (!document.getElementById('pull-spin-style')) {
            var style = document.createElement('style')
            style.id = 'pull-spin-style'
            style.textContent = '@keyframes pull-spin{to{transform:rotate(360deg)}}'
            document.head.appendChild(style)
          }
          setTimeout(function () {
            window.location.reload()
          }, 400)
          return
        }
        removeIndicator()
      }
    }, { passive: true })
  }

  // Init pull-to-refresh after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPullToRefresh)
  } else {
    initPullToRefresh()
  }
})()
