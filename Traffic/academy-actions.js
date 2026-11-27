/**
 * Traffic/academy-actions.js
 * Central strict-CSP event delegation, ProgressTracker cloud sync bridge,
 * dynamic LEVEL_CATALOG counts, and Next-Step onboarding banner for Academy.
 */
;(function (global) {
  'use strict'

  function getCatalogCounts() {
    const cat = global.LEVEL_CATALOG
    const numbered = (cat && cat.numberedTotal) || (Array.isArray(global.LVS) ? global.LVS.filter(function (l) { return typeof l.id === 'number' && l.id < 90 }).length : 54)
    const total = (cat && cat.total) || (Array.isArray(global.LVS) ? global.LVS.length : 57)
    return { numbered: numbered, total: total }
  }

  function refreshDynamicCounts() {
    const counts = getCatalogCounts()
    document.querySelectorAll('[data-level-numbered]').forEach(function (el) {
      el.textContent = String(counts.numbered)
    })
    document.querySelectorAll('[data-level-total]').forEach(function (el) {
      el.textContent = String(counts.total)
    })
    const searchInput = document.getElementById('level-search')
    if (searchInput) {
      searchInput.placeholder = 'Search ' + counts.total + ' modules...'
    }
  }

  function renderNextStepGuide() {
    const host = document.getElementById('academy-next-step-banner')
    if (!host || !global.ProgressTracker) return
    const levels = global.LVS || []
    const state = global.ProgressTracker.readLocalState()
    const rec = global.ProgressTracker.getNextRecommendedLevel(levels, state)
    const isSignedIn = Boolean(global.colUser && !global.colUser.isCached)
    const iconSvg = global.TrafficIcons ? global.TrafficIcons.svg('compass', 20) : ''
    const lockSvg = global.TrafficIcons ? global.TrafficIcons.svg('lock', 14) : ''
    const arrowSvg = global.TrafficIcons ? global.TrafficIcons.svg('arrowRight', 16) : '&rarr;'

    const lv = rec ? rec.level : null
    const title = lv ? String(lv.name || ('Lesson ' + lv.id)).replace(/^Lesson\s+\d+\s*[-–:]\s*/i, '') : 'Lesson 1 — Red Light Patience'
    const lid = lv ? lv.id : 1
    const done = global.ProgressTracker.computeCompletedCount(state)
    const total = getCatalogCounts().total

    host.innerHTML =
      '<div class="ans-left">' +
        '<div class="ans-icon">' + iconSvg + '</div>' +
        '<div class="ans-text">' +
          '<div class="ans-eyebrow">WHAT TO DO NEXT &bull; ' + done + ' OF ' + total + ' COMPLETE</div>' +
          '<div class="ans-title">' + (rec ? rec.reason + ': ' : '') + title + '</div>' +
          '<div class="ans-sub">' +
            (isSignedIn
              ? 'Read the 1-minute rule briefing, test the 2D scenario, then pass the 3D drive &amp; quick check.'
              : '<span class="ans-guest-note">' + lockSvg + ' Guest preview active &mdash; sign in to save your XP and appear on Leaderboards.</span>') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ans-actions">' +
        (!isSignedIn
          ? '<button type="button" class="ans-btn ans-btn-ghost" data-academy-action="account">Sign In to Sync</button>'
          : '') +
        '<button type="button" class="ans-btn ans-btn-primary" data-ui-action="open-briefing" data-lid="' + lid + '">Open Lesson ' + lid + ' ' + arrowSvg + '</button>' +
      '</div>'
  }

  function hydrateTopIcons() {
    ;['cert-logo-5', 'cert-logo-6'].forEach(function (id) {
      const img = document.getElementById(id)
      if (img) img.addEventListener('error', function () { img.style.display = 'none' })
    })
    if (!global.TrafficIcons) return
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      const name = el.getAttribute('data-icon')
      const size = Number(el.getAttribute('data-icon-size')) || 17
      el.innerHTML = global.TrafficIcons.svg(name, size)
    })
    if (typeof global.hzSync === 'function') global.hzSync()
  }

  async function syncFromCloudAndRefresh() {
    if (!global.colUser || global.colUser.isCached || !global.supabaseClient || !global.ProgressTracker) {
      renderNextStepGuide()
      return
    }
    const merged = await global.ProgressTracker.syncWithCloud(global.supabaseClient, global.colUser.id)
    if (merged && typeof global.ui !== 'undefined') {
      global.S = Object.assign(global.S || {}, merged)
      if (typeof global.ui._buildSylList === 'function') global.ui._buildSylList()
    }
    renderNextStepGuide()
  }

  function bindDelegation() {
    document.addEventListener('click', function (e) {
      // 1. UI / Lesson actions (data-ui-action)
      const uiTarget = e.target && e.target.closest ? e.target.closest('[data-ui-action]') : null
      if (uiTarget) {
        const act = uiTarget.getAttribute('data-ui-action')
        const u = global.ui
        if (act === 'close-modal') {
          const m = uiTarget.closest('.modal')
          if (m) m.remove()
          return
        }
        if (act === 'open-briefing' && u && typeof u.showBriefing === 'function') {
          const rawId = uiTarget.getAttribute('data-lid')
          const lid = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : rawId
          u.showBriefing(lid)
          return
        }
        if (act === 'show-syllabus' && u && typeof u.showSyllabus === 'function') {
          const rawId = uiTarget.getAttribute('data-lid')
          const lid = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : rawId
          u.showSyllabus(lid)
          return
        }
        if (act === 'sel-syl' && u && typeof u._selSyl === 'function') {
          u._selSyl(uiTarget.getAttribute('data-syl-id'))
          return
        }
        if (act === 'toggle-law-lang' && u) {
          u._lawLang = u._lawLang === 'hi' ? 'en' : 'hi'
          u._selSyl('law')
          return
        }
        if (act === 'toggle-theory-lang' && u) {
          u._theoryLang = u._theoryLang === 'hi' ? 'en' : 'hi'
          u._selSyl('theory')
          return
        }
        if (act === 'select-mode' && u && typeof u.selectMode === 'function') {
          u.selectMode(uiTarget.getAttribute('data-mode'))
          return
        }
        if (act === 'select-vehicle' && u && typeof u._selectVehicle === 'function') {
          u._selectVehicle(uiTarget.getAttribute('data-veh-id'))
          return
        }
        if (act === 'dispatch-start' && u && typeof u.dispatchStart === 'function') {
          u.dispatchStart(uiTarget.getAttribute('data-mode') || undefined)
          return
        }
        if (act === 'show-quiz' && u && typeof u.showQuiz === 'function') {
          u.showQuiz(uiTarget.getAttribute('data-quiz-mode') || 'exam')
          return
        }
        if (act === 'answer-q' && u && typeof u._aq === 'function') {
          u._aq(parseInt(uiTarget.getAttribute('data-q-idx'), 10))
          return
        }
        if (act === 'show-pledge' && u && typeof u.showCommitmentPledge === 'function') {
          const rawId = uiTarget.getAttribute('data-lid')
          const lid = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : rawId
          u.showCommitmentPledge(lid)
          return
        }
        if (act === 'save-pledge' && u && typeof u.savePledge === 'function') {
          const rawId = uiTarget.getAttribute('data-lid')
          const lid = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : rawId
          const ifEl = document.getElementById('pledge-if')
          const thenEl = document.getElementById('pledge-then')
          u.savePledge(lid, ifEl ? ifEl.value : '', thenEl ? thenEl.value : '')
          const m = uiTarget.closest('.modal')
          if (m) m.remove()
          return
        }
        if (act === 'practice-safe') {
          const m = uiTarget.closest('.modal')
          if (m) m.remove()
          if (u && typeof u.showQuiz === 'function') u.showQuiz('car')
          return
        }
        if (act === 'show-cert' && u && typeof u.showCert === 'function') {
          u.showCert(uiTarget.getAttribute('data-badge-id'))
          return
        }
        if (act === 'dl-cert' && u && typeof u.downloadCertificate === 'function') {
          u.downloadCertificate()
          return
        }
        if (act === 'share-cert' && u && typeof u.shareCertificate === 'function') {
          u.shareCertificate()
          return
        }
        if (act === 'sim-play' && u && typeof u._simTogglePlay === 'function') {
          u._simTogglePlay()
          return
        }
        if (act === 'sim-speed' && u && typeof u._simToggleSpeed === 'function') {
          u._simToggleSpeed()
          return
        }
        if (act === 'sim-restart' && u && typeof u._simRestart === 'function') {
          u._simRestart()
          return
        }
        if (act === 'sim-check') {
          const optIdx = parseInt(uiTarget.getAttribute('data-opt-idx'), 10)
          const isOk = uiTarget.getAttribute('data-correct') === '1'
          const fb = document.getElementById('sim-check-fb')
          uiTarget.parentElement.querySelectorAll('.sim-opt-btn').forEach(function (b, bi) {
            b.classList.remove('selected-ok', 'selected-no')
            if (bi === optIdx) b.classList.add(isOk ? 'selected-ok' : 'selected-no')
          })
          if (fb) {
            fb.textContent = isOk
              ? 'Spot on! You picked the safe Traffic Hero response.'
              : 'Unsafe choice — review the hazard cue in the scenario and try again.'
            fb.className = 'sim-check-fb ' + (isOk ? 'ok' : 'no')
          }
          if (global.sfx && typeof global.sfx.play === 'function') {
            global.sfx.play(isOk ? 'ok' : 'error')
          }
          return
        }
        if (act === 'shop-buy' && global.TOKEN_SHOP) {
          global.TOKEN_SHOP.purchase(uiTarget.getAttribute('data-item-id'))
          global.TOKEN_SHOP.renderShop()
          return
        }
        if (act === 'shop-equip' && global.TOKEN_SHOP) {
          global.TOKEN_SHOP.equip(uiTarget.getAttribute('data-item-id'))
          global.TOKEN_SHOP.renderShop()
          return
        }
        if (act === 'shop-unequip' && global.TOKEN_SHOP) {
          global.TOKEN_SHOP.unequip(uiTarget.getAttribute('data-cat-key'))
          global.TOKEN_SHOP.renderShop()
          return
        }
        if (act === 'pick-swatch' && typeof global._pickSwatch === 'function') {
          global._pickSwatch(uiTarget.getAttribute('data-group'), parseInt(uiTarget.getAttribute('data-hex'), 10))
          return
        }
        if (act === 'pick-sample-model' && typeof global._pickSampleModel === 'function') {
          global._pickSampleModel(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'pick-outfit-preset' && typeof global._pickOutfitPreset === 'function') {
          global._pickOutfitPreset(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'pick-hairstyle' && typeof global._pickHairstyle === 'function') {
          global._pickHairstyle(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'pick-facial-hair' && typeof global._pickFacialHair === 'function') {
          global._pickFacialHair(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'pick-outfit-model' && typeof global._pickOutfitModel === 'function') {
          global._pickOutfitModel(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'pick-pants-model' && typeof global._pickPantsModel === 'function') {
          global._pickPantsModel(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'pick-shoe-model' && typeof global._pickShoeModel === 'function') {
          global._pickShoeModel(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'toggle-accessory' && typeof global._toggleAccessory === 'function') {
          global._toggleAccessory(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'pick-mc-preset' && typeof global._pickMCPreset === 'function') {
          global._pickMCPreset(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'pick-mc-custom' && typeof global._pickMCCustomSkin === 'function') {
          global._pickMCCustomSkin(uiTarget.getAttribute('data-id'))
          return
        }
        if (act === 'del-mc-custom' && typeof global._deleteCustomSkin === 'function') {
          global._deleteCustomSkin(uiTarget.getAttribute('data-id'))
          return
        }
      }

      // 2. Academy chrome actions (data-academy-action)
      const acTarget = e.target && e.target.closest ? e.target.closest('[data-academy-action]') : null
      if (!acTarget) return
      const act = acTarget.getAttribute('data-academy-action')
      const u = global.ui

      if (act === 'home') global.location.href = 'Academy.html'
      else if (act === 'tutorial' && typeof global.openAcademyTutorial === 'function') global.openAcademyTutorial(0)
      else if (act === 'tut-skip' && typeof global.skipAcademyTutorial === 'function') global.skipAcademyTutorial()
      else if (act === 'tut-prev' && typeof global.prevTutorialStep === 'function') global.prevTutorialStep()
      else if (act === 'tut-next' && typeof global.nextTutorialStep === 'function') global.nextTutorialStep()
      else if (act === 'tut-step' && typeof global.selectTutorialStep === 'function') {
        global.selectTutorialStep(parseInt(acTarget.getAttribute('data-step'), 10) || 0)
      }
      else if (act === 'settings' && typeof global.openSettingsModal === 'function') global.openSettingsModal()
      else if (act === 'theme' && typeof global.hzToggle === 'function') global.hzToggle()
      else if (act === 'account' && typeof global.handleAccountClick === 'function') global.handleAccountClick()
      else if (act === 'dashboard') {
        if (global.colUser && !global.colUser.isCached) global.location.href = 'TrafficDashboard.html'
        else if (typeof global.handleAccountClick === 'function') global.handleAccountClick()
      }
      else if (act === 'start-academy' && typeof global.showOnboardingFromStart === 'function') global.showOnboardingFromStart()
      else if (act === 'download-apk') global.location.href = '../COL.apk'
      else if (act === 'weekly' && typeof global._startWeekly === 'function') global._startWeekly()
      else if (act === 'show-start' && u && typeof u.showStart === 'function') u.showStart()
      else if (act === 'show-levels' && u && typeof u.showLevels === 'function') u.showLevels()
      else if (act === 'toggle-map' && typeof global.toggleLevelView === 'function') global.toggleLevelView()
      else if (act === 'set-level-view' && typeof global.setLevelViewMode === 'function') {
        global.setLevelViewMode(acTarget.getAttribute('data-view') || 'grid')
      }
      else if (act === 'filter-level' && u && typeof u.setLevelFilter === 'function') {
        u.setLevelFilter(acTarget.getAttribute('data-level-filter') || 'all')
      }
      else if (act === 'toggle-map-dd') {
        const dd = document.getElementById('map-progress-dropdown')
        if (dd) dd.classList.toggle('show')
      }
      else if (act === 'open-customize' && typeof global.openCustomize === 'function') global.openCustomize()
      else if (act === 'close-customize') {
        const cm = document.getElementById('customize-modal')
        if (cm) cm.style.display = 'none'
      }
      else if (act === 'abort-quiz' && u && typeof u.abortQuiz === 'function') u.abortQuiz()
      else if (act === 'next-q' && u && typeof u.nextQ === 'function') u.nextQ()
      else if (act === 'go-next' && u && typeof u.goNext === 'function') u.goNext()
      else if (act === 'exit-2d' && u && typeof u.exit2D === 'function') u.exit2D()
      else if (act === 'restart-2d' && u && typeof u.restart2D === 'function') u.restart2D()
      else if (act === 'dl-cert' && u && typeof u.dlCert === 'function') u.dlCert()
      else if (act === 'close-profile-dlg') {
        const dlg = document.getElementById('profile-dlg')
        if (dlg) dlg.style.display = 'none'
      }
      else if (act === 'save-profile' && u && typeof u.saveProfile === 'function') u.saveProfile()
      else if (act === 'save-name-prompt' && u && typeof u.saveNamePrompt === 'function') u.saveNamePrompt()
      else if (act === 'onb-screen' && typeof global.showOnboardingScreen === 'function') {
        global.showOnboardingScreen(parseInt(acTarget.getAttribute('data-screen'), 10) || 0)
      }
      else if (act === 'onb-proceed-name') {
        if (typeof global._onbSaveNameAndUsername === 'function') global._onbSaveNameAndUsername()
        if (typeof global.showOnboardingScreen === 'function') global.showOnboardingScreen(2)
      }
      else if (act === 'onb-skip' && typeof global.skipOnboarding === 'function') global.skipOnboarding()
      else if (act === 'onb-google' && typeof global.handleGoogleLogin === 'function') global.handleGoogleLogin()
      else if (act === 'onb-email' && typeof global.handleEmailLogin === 'function') global.handleEmailLogin()
      else if (act === 'onb-dot' && typeof global._onbSelectDot === 'function') {
        global._onbSelectDot(acTarget, acTarget.getAttribute('data-group'))
      }
      else if (act === 'onb-complete' && typeof global._onbComplete === 'function') global._onbComplete()
      else if (act === 'onb-stay' && typeof global.skipCancel === 'function') global.skipCancel()
      else if (act === 'onb-leave' && typeof global.skipConfirm === 'function') global.skipConfirm()
      else if (act === 'compare-search' && typeof global.searchPlayer === 'function') global.searchPlayer()
      else if (act === 'compare-close' && typeof global.closeCompareModal === 'function') global.closeCompareModal()
      else if (act === 'profile-hash') {
        setTimeout(function () { global.location.hash = '#profile' }, 100)
      }
      else if (act === 'char-mode' && typeof global._setCharMode === 'function') {
        global._setCharMode(acTarget.getAttribute('data-mode'))
      }
      else if (act === 'studio-rotate' && typeof global._toggleAutoRotatePreview === 'function') global._toggleAutoRotatePreview()
      else if (act === 'studio-reset-rot' && typeof global._resetPreviewRotation === 'function') global._resetPreviewRotation()
      else if (act === 'studio-cam' && typeof global._setStudioCamera === 'function') {
        global._setStudioCamera(acTarget.getAttribute('data-cam'))
      }
      else if (act === 'studio-pose' && typeof global._setStudioPose === 'function') {
        global._setStudioPose(acTarget.getAttribute('data-pose'))
      }
      else if (act === 'studio-light' && typeof global._setStudioLighting === 'function') {
        global._setStudioLighting(acTarget.getAttribute('data-light'))
      }
      else if (act === 'studio-tab' && typeof global._switchStudioTab === 'function') {
        global._switchStudioTab(acTarget.getAttribute('data-tab'))
      }
      else if (act === 'studio-gender' && typeof global._setGender === 'function') {
        global._setGender(acTarget.getAttribute('data-gender'))
      }
      else if (act === 'mc-tab' && typeof global._switchMCTab === 'function') {
        global._switchMCTab(acTarget.getAttribute('data-mctab'))
      }
      else if (act === 'mc-arm' && typeof global._setMCArm === 'function') {
        global._setMCArm(acTarget.getAttribute('data-slim') === 'true')
      }
      else if (act === 'mc-upload-trigger') {
        const fi = document.getElementById('mc-skin-file-input')
        if (fi) fi.click()
      }
      else if (act === 'studio-random' && typeof global._randomizeCustomize === 'function') global._randomizeCustomize()
      else if (act === 'studio-reset' && typeof global._resetCustomizeDefault === 'function') global._resetCustomizeDefault()
      else if (act === 'studio-save' && typeof global._saveCustomize === 'function') global._saveCustomize()
      else if (act === 'syl-close' && typeof global.closeSyllabusModal === 'function') global.closeSyllabusModal()
      else if (act === 'syl-tab' && typeof global.switchSyllabusTab === 'function') {
        global.switchSyllabusTab(acTarget.getAttribute('data-tab'))
      }
      else if (act === 'syl-demo' && typeof global.startSyllabusDemo === 'function') global.startSyllabusDemo()
      else if (act === 'syl-test' && typeof global.launchSyllabusTest === 'function') global.launchSyllabusTest()
    })

    document.addEventListener('input', function (e) {
      const target = e.target
      if (!target) return
      if (target.id === 'sim-timeline' && global.ui && typeof global.ui._simSeek === 'function') {
        global.ui._simSeek(target.value)
      } else if (target.id === 'level-search' && typeof global.filterLevels === 'function') {
        global.filterLevels()
      } else if (target.id === 'onb-name-input' && typeof global._onbGenerateUsernameSuggestions === 'function') {
        global._onbGenerateUsernameSuggestions()
      } else if (target.id === 'onb-username-input' && typeof global._onbHandleUsernameInput === 'function') {
        global._onbHandleUsernameInput()
      }
    })

    document.addEventListener('change', function (e) {
      const target = e.target
      if (target && target.id === 'mc-skin-file-input' && typeof global._handleSkinFileUpload === 'function') {
        global._handleSkinFileUpload(e)
      }
    })

    document.addEventListener('keydown', function (e) {
      const target = e.target
      if (target && target.id === 'compare-search-input' && e.key === 'Enter' && typeof global.searchPlayer === 'function') {
        global.searchPlayer()
      } else if ((e.key === 'Enter' || e.key === ' ') && target && target.getAttribute && target.getAttribute('data-ui-action') === 'open-briefing') {
        e.preventDefault()
        target.click()
      }
    })
  }

  function init() {
    bindDelegation()
    refreshDynamicCounts()
    hydrateTopIcons()
    renderNextStepGuide()
    const params = new URLSearchParams(global.location.search)
    if (params.get('settings') === '1' && typeof global.openSettingsModal === 'function') {
      setTimeout(function () { global.openSettingsModal() }, 180)
    }
  }

  global.addEventListener('col-auth-changed', function () {
    syncFromCloudAndRefresh()
  })
  global.addEventListener('col-progress-updated', function () {
    renderNextStepGuide()
  })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  global.AcademyActions = {
    refreshDynamicCounts,
    renderNextStepGuide,
    syncFromCloudAndRefresh
  }
})(typeof window !== 'undefined' ? window : globalThis)
