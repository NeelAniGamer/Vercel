/**
 * Vercel Speed Insights Integration
 * Loads and initializes Speed Insights for all pages
 */
;(function () {
  'use strict'

  // Inject Speed Insights using the official Vercel package
  // The script will be loaded from the CDN automatically by Vercel
  if (window.si) {
    // Already loaded, skip
    return
  }

  // Initialize Speed Insights queue
  window.si =
    window.si ||
    function () {
      ;(window.siq = window.siq || []).push(arguments)
    }

  // Load the Speed Insights script from Vercel's CDN
  // This will be automatically served by Vercel when deployed
  var script = document.createElement('script')
  script.defer = true
  script.src = '/_vercel/speed-insights/script.js'

  // Add error handling
  script.onerror = function () {
    console.warn('Speed Insights script failed to load')
  }

  // Inject the script
  document.head.appendChild(script)
})()
