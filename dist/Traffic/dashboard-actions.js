/**
 * Traffic/dashboard-actions.js
 * Strict-CSP delegated event wiring and SVG icon hydration for TrafficDashboard.html.
 */
;(function (global) {
  'use strict'

  function hydrateIcons() {
    if (!global.TrafficIcons) return
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      const name = el.getAttribute('data-icon')
      const size = Number(el.getAttribute('data-icon-size')) || 16
      el.innerHTML = global.TrafficIcons.svg(name, size)
    })
  }

  function bindDashboardEvents() {
    document.addEventListener('click', function (e) {
      const target = e.target && e.target.closest ? e.target.closest('[data-dash-action]') : null
      if (!target) return
      const act = target.getAttribute('data-dash-action')

      if (act === 'go-academy') global.location.href = 'Academy.html'
      else if (act === 'toggle-menu' && typeof global.toggleMenu === 'function') global.toggleMenu()
      else if (act === 'sign-in' && typeof global.handleDashSignIn === 'function') global.handleDashSignIn()
      else if (act === 'edit-profile' && typeof global.openEditModal === 'function') global.openEditModal()
      else if (act === 'open-settings' && typeof global.openSettingsModal === 'function') {
        const dd = document.getElementById('action-menu')
        if (dd) dd.classList.remove('show')
        global.openSettingsModal('driving')
      }
      else if (act === 'reset-progress' && typeof global.resetProgressFromDashboard === 'function') global.resetProgressFromDashboard()
      else if (act === 'sign-out' && typeof global.logoutAndClear === 'function') global.logoutAndClear()
      else if (act === 'theme' && typeof global.hzToggle === 'function') global.hzToggle()
      else if (act === 'share-profile' && typeof global.shareProfile === 'function') global.shareProfile()
      else if (act === 'dl-cert' && typeof global.dlCert === 'function') global.dlCert()
      else if (act === 'share-wa' && typeof global.shareWhatsApp === 'function') global.shareWhatsApp()
      else if (act === 'share-ig' && typeof global.shareInstagram === 'function') global.shareInstagram()
      else if (act === 'copy-cert' && typeof global.copyCertLink === 'function') global.copyCertLink()
      else if (act === 'clear-player-search' && typeof global.clearLbPlayerSearch === 'function') global.clearLbPlayerSearch()
      else if (act === 'clear-level-search' && typeof global.clearLbLevelSearch === 'function') global.clearLbLevelSearch()
      else if (act === 'lb-tab' && typeof global.switchLbTab === 'function') {
        global.switchLbTab(target.getAttribute('data-board') || 'xp')
      }
      else if (act === 'main-tab' && typeof global.switchMainTab === 'function') {
        global.switchMainTab(target.getAttribute('data-tab') || 'profile')
      }
      else if (act === 'close-edit' && typeof global.closeEditModal === 'function') global.closeEditModal()
      else if (act === 'save-edit' && typeof global.saveEditModal === 'function') global.saveEditModal()
      else if (act === 'reload-lb' && typeof global.loadLeaderboard === 'function') global.loadLeaderboard()
      else if (act === 'open-url') {
        const url = target.getAttribute('data-url')
        if (url) global.open(url, '_blank', 'noopener,noreferrer')
      }
      else if (act === 'open-lesson') {
        const lid = target.getAttribute('data-lid')
        if (lid) global.location.href = 'Academy.html?screen=levels&lv=' + encodeURIComponent(lid)
      }
      else if (act === 'resolve-conflict' && typeof global.resolveConflict === 'function') {
        global.resolveConflict(target.getAttribute('data-choice'))
      }
      else if (act === 'share-cert' && typeof global.shareCertificate === 'function') {
        global.shareCertificate(target.getAttribute('data-cert-id'))
      }
      else if (act === 'jump-my-rank') {
        const board = target.getAttribute('data-board') || 'xp'
        const row = document.querySelector('#leaderboard-' + board + ' .leaderboard-row.you')
        if (row && typeof row.scrollIntoView === 'function') {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' })
          row.classList.add('flash-highlight')
          setTimeout(function () { row.classList.remove('flash-highlight') }, 1200)
        }
      }
    })

    document.addEventListener('input', function (e) {
      const target = e.target
      if (!target) return
      if (target.id === 'lb-player-search' && typeof global._debouncedSearch === 'function') {
        global._debouncedSearch()
      } else if (target.id === 'lb-level-search' && typeof global.searchLevels === 'function') {
        global.searchLevels()
      }
    })
  }

  function init() {
    hydrateIcons()
    bindDashboardEvents()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})(typeof window !== 'undefined' ? window : globalThis)
