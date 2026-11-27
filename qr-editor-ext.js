/* qr-editor-ext.js — CraftQR Studio live-compose & custom frame controller
   Wires every frame, typography, gradient, photo, self-scan verifier, and export control into QRC. */
(function () {
  'use strict'
  if (!window.QRC) return
  var design = QRC.norm({ frame: 'none' }), token = 0, timer = null
  var $ = function (id) { return document.getElementById(id) }
  var say = function (m, c) { if (typeof toast === 'function') toast(m, c) }

  function entryNow() {
    var realData = typeof getQRDataString === 'function' ? getQRDataString() : (opts && opts.data) || ''
    return {
      opts: Object.assign({}, opts, { data: realData }),
      design: JSON.parse(JSON.stringify(design)),
      type: typeof selType !== 'undefined' ? selType : 'url',
      frame: typeof selFrame !== 'undefined' ? selFrame : 'none',
      advSettings: { name: ($('advQrName') || {}).value || '' },
      shortUrl: (typeof window.activeShortCode !== 'undefined' && window.activeShortCode && typeof DYNAMIC_QR !== 'undefined')
        ? (DYNAMIC_QR.baseUrl + '?id=' + window.activeShortCode)
        : ''
    }
  }

  /* ---------- live preview ---------- */
  function hideNative() {
    var w = $('qrWrap'), l = $('frLbl')
    if (w) w.classList.add('is-hidden')
    if (l) l.classList.add('is-hidden')
    if (!$('qrCompose') && w && w.parentNode) {
      var c = document.createElement('canvas')
      c.id = 'qrCompose'
      c.setAttribute('role', 'img')
      c.setAttribute('aria-label', 'CraftQR live code preview')
      w.parentNode.insertBefore(c, w)
    }
  }

  function preview() {
    clearTimeout(timer)
    timer = setTimeout(function () {
      if (typeof qrInst === 'undefined' || !qrInst) return
      hideNative()
      var cvEl = $('qrCompose')
      if (!cvEl || !cvEl.parentNode) return
      var my = ++token
      var dpr = Math.min(2, window.devicePixelRatio || 1)
      var box = Math.min(310, Math.max(200, (cvEl.parentNode.clientWidth || 310) - 16))
      QRC.renderCanvas(entryNow(), { size: Math.round(box * dpr) }).then(function (cv) {
        if (my !== token) return
        var t = $('qrCompose')
        if (!t) return
        t.width = cv.width; t.height = cv.height
        t.style.width = Math.round(cv.width / dpr) + 'px'
        t.style.height = Math.round(cv.height / dpr) + 'px'
        t.getContext('2d').drawImage(cv, 0, 0)
        if (typeof window.syncMobileThumb === 'function') window.syncMobileThumb()
      }).catch(function (e) { console.warn('CraftQR preview', e) })
    }, 80)
  }

  var P = window.QRCodeStyling && QRCodeStyling.prototype
  if (P && !P.__qrc) {
    var u = P.update
    P.update = function () {
      var r = u.apply(this, arguments)
      if (typeof qrInst !== 'undefined' && this === qrInst) preview()
      return r
    }
    P.__qrc = 1
  }

  var oInit = window.initQR
  if (typeof oInit === 'function') {
    window.initQR = function () {
      var r = oInit.apply(this, arguments)
      hideNative()
      preview()
      return r
    }
  }

  /* ---------- controls <-> design ---------- */
  var touched = function (el) { return el && el.dataset.t === '1' }
  function setV(id, val) { var el = $(id); if (el) el.value = val }
  function setC(id, val) { var el = $(id); if (el) el.checked = !!val }

  function write() {
    var d = design, L = d.label
    setV('lyColor', d.color); setV('lyColorH', d.color)
    setV('lyColor2', d.color2 || '#BF3B1E'); setC('lyFrameGrad', d.frameGradient)
    setV('lyCardBg', d.cardBg); setV('lyCardBg2', d.cardBg2 || '#E7E2D8')
    setC('lyCardGrad', d.cardGradient); setC('lyCardT', d.cardTransparent)
    setV('lyWidth', d.width); setV('lyRadius', d.radius); setV('lyPad', d.pad)
    setV('lyDashStyle', d.dashStyle || (d.dash ? 'dashed' : 'solid'))
    setC('lyShadow', d.shadow); setV('lyShadowBlur', d.shadowBlur || 7)
    setC('lyGlow', d.glow); setV('lyGlowColor', d.glowColor || d.color)

    setV('lyLblText', L.text || ''); setV('lyLblSub', L.subtext || '')
    setV('lyLblPos', L.pos || 'bottom'); setV('lyLblFont', L.font || 'IBM Plex Sans')
    setV('lyLblWeight', String(L.weight || 700)); setV('lyLblSize', L.size || 100)
    setV('lyLblTrack', L.tracking !== undefined ? L.tracking : 1)
    setC('lyLblUpper', L.uppercase !== false)
    setV('lyLblColor', L.color || '#FBF9F5')
    if ($('lyLblColor')) $('lyLblColor').dataset.t = L.color ? '1' : '0'
    setV('lyLblBg', L.bg || d.color)
    if ($('lyLblBg')) $('lyLblBg').dataset.t = L.bg ? '1' : '0'
    setC('lyLblBar', !!L.bg || d.frame === 'scan' || d.frame === 'ribbon')
    if ($('lyLblBar')) $('lyLblBar').disabled = (d.frame === 'scan' || d.frame === 'ribbon')
    setV('lyLblBarRad', L.barRadius || 0)

    setV('lyBgOp', Math.round((d.bgOpacity !== undefined ? d.bgOpacity : 1) * 100))
    setV('lyBgBlur', d.bgBlur || 0)
    labels()
  }

  function labels() {
    if ($('lyWidthV')) $('lyWidthV').textContent = (+$('lyWidth').value).toFixed(1) + '%'
    if ($('lyRadiusV')) $('lyRadiusV').textContent = $('lyRadius').value + '%'
    if ($('lyPadV')) $('lyPadV').textContent = $('lyPad').value + '%'
    if ($('lyLblSizeV')) $('lyLblSizeV').textContent = $('lyLblSize').value + '%'
    if ($('lyLblTrackV')) $('lyLblTrackV').textContent = $('lyLblTrack').value + 'px'
    if ($('lyLblBarRadV')) $('lyLblBarRadV').textContent = $('lyLblBarRad').value + '%'
    if ($('lyBgOpV')) $('lyBgOpV').textContent = $('lyBgOp').value + '%'
    if ($('lyBgBlurV')) $('lyBgBlurV').textContent = $('lyBgBlur').value + 'px'
  }

  function read() {
    var d = design, L = d.label
    if ($('lyColorH')) d.color = $('lyColorH').value
    if ($('lyColor2')) d.color2 = $('lyColor2').value
    if ($('lyFrameGrad')) d.frameGradient = $('lyFrameGrad').checked
    if ($('lyCardBg')) d.cardBg = $('lyCardBg').value
    if ($('lyCardBg2')) d.cardBg2 = $('lyCardBg2').value
    if ($('lyCardGrad')) d.cardGradient = $('lyCardGrad').checked
    if ($('lyCardT')) d.cardTransparent = $('lyCardT').checked
    if ($('lyWidth')) d.width = +$('lyWidth').value
    if ($('lyRadius')) d.radius = +$('lyRadius').value
    if ($('lyPad')) d.pad = +$('lyPad').value
    if ($('lyDashStyle')) {
      d.dashStyle = $('lyDashStyle').value
      d.dash = d.dashStyle !== 'solid'
    }
    if ($('lyShadow')) d.shadow = $('lyShadow').checked
    if ($('lyShadowBlur')) d.shadowBlur = +$('lyShadowBlur').value
    if ($('lyGlow')) d.glow = $('lyGlow').checked
    if ($('lyGlowColor')) d.glowColor = $('lyGlowColor').value

    if ($('lyLblText')) L.text = $('lyLblText').value
    if ($('lyLblSub')) L.subtext = $('lyLblSub').value
    if ($('lyLblPos')) L.pos = $('lyLblPos').value
    if ($('lyLblFont')) L.font = $('lyLblFont').value
    if ($('lyLblWeight')) L.weight = +$('lyLblWeight').value
    if ($('lyLblSize')) L.size = +$('lyLblSize').value
    if ($('lyLblTrack')) L.tracking = +$('lyLblTrack').value
    if ($('lyLblUpper')) L.uppercase = $('lyLblUpper').checked
    if ($('lyLblColor')) L.color = touched($('lyLblColor')) ? $('lyLblColor').value : ''
    if ($('lyLblBar') && $('lyLblBg')) {
      L.bg = (d.frame !== 'scan' && d.frame !== 'ribbon' && $('lyLblBar').checked)
        ? (touched($('lyLblBg')) ? $('lyLblBg').value : d.color)
        : (touched($('lyLblBg')) && (d.frame === 'scan' || d.frame === 'ribbon') ? $('lyLblBg').value : '')
    }
    if ($('lyLblBarRad')) L.barRadius = +$('lyLblBarRad').value
    if ($('lyBgOp')) d.bgOpacity = $('lyBgOp').value / 100
    if ($('lyBgBlur')) d.bgBlur = +$('lyBgBlur').value
    labels()
    preview()
  }

  function bind() {
    var ids = [
      'lyColorH', 'lyColor2', 'lyFrameGrad', 'lyCardBg', 'lyCardBg2', 'lyCardGrad', 'lyCardT',
      'lyWidth', 'lyRadius', 'lyPad', 'lyDashStyle', 'lyShadow', 'lyShadowBlur', 'lyGlow', 'lyGlowColor',
      'lyLblText', 'lyLblSub', 'lyLblPos', 'lyLblFont', 'lyLblWeight', 'lyLblSize', 'lyLblTrack',
      'lyLblUpper', 'lyLblBar', 'lyLblBarRad', 'lyBgOp', 'lyBgBlur'
    ]
    ids.forEach(function (id) {
      var el = $(id)
      if (el) { el.addEventListener('input', read); el.addEventListener('change', read) }
    })
    if ($('lyColor')) {
      $('lyColor').addEventListener('input', function () {
        if ($('lyColorH')) $('lyColorH').value = this.value
        read()
      })
    }
    if ($('lyColorH')) {
      $('lyColorH').addEventListener('input', function () {
        if (/^#[0-9a-f]{6}$/i.test(this.value)) {
          if ($('lyColor')) $('lyColor').value = this.value
          read()
        }
      })
    }
    ;['lyLblColor', 'lyLblBg'].forEach(function (id) {
      if ($(id)) $(id).addEventListener('input', function () { this.dataset.t = '1'; read() })
    })
    if ($('lyReset')) {
      $('lyReset').addEventListener('click', function () {
        var k = design
        design = QRC.defaultsFor(k.frame)
        design.bgImage = k.bgImage
        write(); preview()
        say('Frame reset to defaults', 'green')
      })
    }
    var eo = $('exportOpts')
    if (eo) {
      eo.onclick = function () {
        if (typeof qrInst === 'undefined' || !qrInst) { say('Finish the content step first.', ''); return }
        QRC.openExport(entryNow())
      }
    }
  }

  /* ---------- frames, background photo ---------- */
  var oSetFr = window.setFr
  window.setFr = function (id) {
    if (typeof oSetFr === 'function') oSetFr(id)
    var k = design
    var prevDef = (QRC.FRAME_DEF[k.frame] || {}).label || ''
    var labelKept = k.label.text && k.label.text !== prevDef
    design = QRC.defaultsFor(id)
    ;['color', 'color2', 'frameGradient', 'cardBg', 'cardBg2', 'cardGradient', 'cardTransparent', 'bgImage', 'bgOpacity', 'bgBlur'].forEach(function (p) {
      design[p] = k[p]
    })
    design.label.color = k.label.color
    design.label.pos = k.label.pos
    design.label.font = k.label.font
    design.label.weight = k.label.weight
    design.label.subtext = k.label.subtext
    if (labelKept) design.label.text = k.label.text
    write(); preview()
  }

  function shrink(src, cb) {
    var i = new Image()
    i.onload = function () {
      var m = 1400, s = Math.min(1, m / Math.max(i.width, i.height))
      var c = document.createElement('canvas')
      c.width = Math.round(i.width * s); c.height = Math.round(i.height * s)
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height)
      cb(c.toDataURL('image/jpeg', 0.86))
    }
    i.onerror = function () { cb(src) }
    i.src = src
  }

  window.handleBgImage = function (input) {
    var f = input && input.files && input.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { say('Please select an image file.', ''); return }
    var r = new FileReader()
    r.onload = function (e) {
      shrink(e.target.result, function (d) {
        design.bgImage = d
        if (design.frame === 'none' && design.pad === 0) design.pad = 7
        if (typeof opts !== 'undefined') {
          opts.backgroundOptions = Object.assign({}, opts.backgroundOptions, { color: '#00000000' })
          if (typeof qrInst !== 'undefined' && qrInst) qrInst.update({ backgroundOptions: opts.backgroundOptions })
        }
        if ($('bgT')) $('bgT').checked = true
        if ($('rmBgImg')) $('rmBgImg').style.display = 'inline-flex'
        write(); preview()
        say('Background photo applied', 'green')
      })
    }
    r.readAsDataURL(f)
  }

  window.removeBgImage = function () {
    design.bgImage = ''
    if ($('bgImgFile')) $('bgImgFile').value = ''
    if ($('rmBgImg')) $('rmBgImg').style.display = 'none'
    if (typeof opts !== 'undefined') {
      opts.backgroundOptions = Object.assign({}, opts.backgroundOptions, { color: '#ffffff' })
      if (typeof qrInst !== 'undefined' && qrInst) qrInst.update({ backgroundOptions: opts.backgroundOptions })
    }
    if ($('bgT')) $('bgT').checked = false
    preview()
    say('Background photo removed', '')
  }

  /* ---------- self-scan verification using jsQR ---------- */
  function testScan() {
    if (typeof jsQR === 'undefined') { say('Scanner engine loading, retry in a moment.', ''); return }
    if (typeof qrInst === 'undefined' || !qrInst) { say('Generate a QR first.', ''); return }
    var statusEl = $('scanProofResult')
    if (statusEl) statusEl.textContent = 'Testing rendered matrix...'
    QRC.renderCanvas(entryNow(), { size: 700, transparent: false }).then(function (cv) {
      var ctx = cv.getContext('2d')
      var imgData = ctx.getImageData(0, 0, cv.width, cv.height)
      var code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' })
      if (code && code.data) {
        if (statusEl) {
          statusEl.style.color = 'var(--secondary)'
          statusEl.textContent = 'Verified Scannable (' + code.data.slice(0, 38) + (code.data.length > 38 ? '…' : '') + ')'
        }
        say('Scan verified! Decoded cleanly.', 'green')
      } else {
        if (statusEl) {
          statusEl.style.color = 'var(--danger)'
          statusEl.textContent = 'Scan failed — increase contrast, padding, or error correction'
        }
        say('Test scan failed. Try higher contrast or less logo overlap.', '')
      }
    }).catch(function () {
      if (statusEl) statusEl.textContent = 'Could not verify canvas'
    })
  }

  /* ---------- download / copy ---------- */
  var oDl = window.dlQR
  window.dlQR = function (ext) {
    if (typeof qrInst === 'undefined' || !qrInst) { say('Complete content setup first.', ''); return }
    var szEl = $('dlSz'), size = szEl ? parseInt(szEl.value, 10) || 1024 : 1024, e = entryNow()
    if (ext === 'print') return typeof oDl === 'function' ? oDl(ext) : QRC.downloadPrintSheet(e, 'single', e.advSettings.name, e.shortUrl)
    if (ext === 'copy') return QRC.copy(e, { size: Math.max(size, 1024) })
    var fmt = ext === 'jpeg' ? 'jpg' : ext
    say('Rendering ' + fmt.toUpperCase() + '…', 'green')
    QRC.download(e, { format: fmt, size: size, mm: 80 }).then(function (r) {
      if (r) say('Downloaded ' + r.ext.toUpperCase(), 'green')
    })
  }

  /* ---------- save & restore ---------- */
  window.QRX = {
    getDesign: function () { return JSON.parse(JSON.stringify(design)) },
    getEntry: entryNow,
    preview: preview,
    testScan: testScan,
    applyDesign: function (d) {
      design = QRC.norm(d, d && d.frame)
      write(); preview()
    },
    thumb: function (finalOpts) { return QRC.thumb({ opts: finalOpts, design: design, frame: typeof selFrame !== 'undefined' ? selFrame : design.frame }, 240) },
    afterSave: function (entry) {
      try { var u = new URL(location.href); u.searchParams.set('id', entry.id); history.replaceState(null, '', u) } catch (e) {}
      QRC.openSaved(entry, { keep: function () {}, dashboard: function () { location.href = 'qr.html' } })
    },
    restore: function (q) {
      design = QRC.norm(q.design, q.frame)
      write()
      var rm = $('rmBgImg')
      if (rm && design.bgImage) rm.style.display = 'inline-flex'
      preview()
    }
  }

  function init() {
    if (!$('lyColor')) return
    bind(); write(); hideNative()
    if (window.__editEntry) QRX.restore(window.__editEntry)
    setTimeout(preview, 350)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init()
})()
