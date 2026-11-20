/* qr-editor-ext.js — wires the shared QRC engine into qr-editor.html
   Live preview = download pixels, full frame/label/background control, export dialog, post-save download screen. */
(function () {
  'use strict'
  if (!window.QRC) return
  var design = QRC.norm({ frame: 'none' }), token = 0, timer = null
  var $ = function (id) { return document.getElementById(id) }
  var say = function (m, c) { if (typeof toast === 'function') toast(m, c) }

  function entryNow() {
    return { opts: Object.assign({}, opts, { data: getQRDataString() }), design: JSON.parse(JSON.stringify(design)), type: selType, frame: selFrame,
      advSettings: { name: ($('advQrName') || {}).value || '' } }
  }

  /* ---------- live preview ---------- */
  function hideNative() {
    var w = $('qrWrap'), l = $('frLbl'); if (w) w.classList.add('is-hidden'); if (l) l.classList.add('is-hidden')
    if (!$('qrCompose') && w) { var c = document.createElement('canvas'); c.id = 'qrCompose'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'QR code preview'); w.parentNode.insertBefore(c, w) }
  }
  function preview() {
    clearTimeout(timer)
    timer = setTimeout(function () {
      if (typeof qrInst === 'undefined' || !qrInst) return
      hideNative()
      var my = ++token, dpr = Math.min(2, window.devicePixelRatio || 1), box = Math.min(300, ($('qrCompose').parentNode.clientWidth || 300) - 8)
      QRC.renderCanvas(entryNow(), { size: Math.round(box * dpr) }).then(function (cv) {
        if (my !== token) return
        var t = $('qrCompose'); t.width = cv.width; t.height = cv.height
        t.style.width = Math.round(cv.width / dpr) + 'px'; t.style.height = Math.round(cv.height / dpr) + 'px'
        t.getContext('2d').drawImage(cv, 0, 0)
      }).catch(function (e) { console.warn('preview', e) })
    }, 90)
  }
  var P = window.QRCodeStyling && QRCodeStyling.prototype
  if (P && !P.__qrc) {
    var u = P.update
    P.update = function () { var r = u.apply(this, arguments); if (typeof qrInst !== 'undefined' && this === qrInst) preview(); return r }
    P.__qrc = 1
  }
  var oInit = window.initQR
  window.initQR = function () { var r = oInit.apply(this, arguments); hideNative(); preview(); return r }

  /* ---------- controls <-> design ---------- */
  var touched = function (el) { return el.dataset.t === '1' }
  function write() {
    var d = design, L = d.label
    $('lyColor').value = d.color; $('lyColorH').value = d.color; $('lyCardBg').value = d.cardBg; $('lyCardT').checked = d.cardTransparent
    $('lyWidth').value = d.width; $('lyRadius').value = d.radius; $('lyPad').value = d.pad
    $('lyDash').checked = d.dash; $('lyShadow').checked = d.shadow; $('lyGlow').checked = d.glow
    $('lyLblText').value = L.text; $('lyLblPos').value = L.pos; $('lyLblSize').value = L.size
    $('lyLblColor').value = L.color || '#ffffff'; $('lyLblColor').dataset.t = L.color ? '1' : '0'
    $('lyLblBg').value = L.bg || d.color; $('lyLblBg').dataset.t = L.bg ? '1' : '0'
    $('lyLblBar').checked = !!L.bg || d.frame === 'scan'; $('lyLblBar').disabled = d.frame === 'scan'
    $('lyBgOp').value = Math.round(d.bgOpacity * 100)
    labels()
  }
  function labels() {
    $('lyWidthV').textContent = (+$('lyWidth').value).toFixed(1) + '%'; $('lyRadiusV').textContent = $('lyRadius').value + '%'
    $('lyPadV').textContent = $('lyPad').value + '%'; $('lyLblSizeV').textContent = $('lyLblSize').value + '%'; $('lyBgOpV').textContent = $('lyBgOp').value + '%'
  }
  function read() {
    var d = design, L = d.label
    d.color = $('lyColorH').value; d.cardBg = $('lyCardBg').value; d.cardTransparent = $('lyCardT').checked
    d.width = +$('lyWidth').value; d.radius = +$('lyRadius').value; d.pad = +$('lyPad').value
    d.dash = $('lyDash').checked; d.shadow = $('lyShadow').checked; d.glow = $('lyGlow').checked
    L.text = $('lyLblText').value; L.pos = $('lyLblPos').value; L.size = +$('lyLblSize').value
    L.color = touched($('lyLblColor')) ? $('lyLblColor').value : ''
    L.bg = (d.frame !== 'scan' && $('lyLblBar').checked) ? (touched($('lyLblBg')) ? $('lyLblBg').value : d.color) : (touched($('lyLblBg')) && d.frame === 'scan' ? $('lyLblBg').value : '')
    d.bgOpacity = $('lyBgOp').value / 100
    labels(); preview()
  }
  function bind() {
    ['lyColorH', 'lyCardBg', 'lyCardT', 'lyWidth', 'lyRadius', 'lyPad', 'lyDash', 'lyShadow', 'lyGlow', 'lyLblText', 'lyLblPos', 'lyLblSize', 'lyLblBar', 'lyBgOp'].forEach(function (id) {
      var el = $(id); if (el) { el.addEventListener('input', read); el.addEventListener('change', read) }
    })
    $('lyColor').addEventListener('input', function () { $('lyColorH').value = this.value; read() })
    $('lyColorH').addEventListener('input', function () { if (/^#[0-9a-f]{6}$/i.test(this.value)) { $('lyColor').value = this.value } else { this.dataset.bad = 1; return } read() })
    ;['lyLblColor', 'lyLblBg'].forEach(function (id) { $(id).addEventListener('input', function () { this.dataset.t = '1'; read() }) })
    $('lyReset').addEventListener('click', function () { var k = design; design = QRC.defaultsFor(k.frame); design.bgImage = k.bgImage; write(); preview(); say('Frame reset to defaults', 'green') })
    var eo = $('exportOpts'); if (eo) eo.addEventListener('click', function () { if (!qrInst) { say('Finish the content step first.', ''); return } QRC.openExport(entryNow()) })
  }

  /* ---------- frames, background photo ---------- */
  var oSetFr = window.setFr
  window.setFr = function (id) {
    oSetFr(id)
    var k = design, labelKept = k.label.text && k.frame !== 'none' && id !== 'none' && k.label.text !== (QRC.FRAME_DEF[k.frame] || {}).label
    design = QRC.defaultsFor(id)
    ;['color', 'cardBg', 'cardTransparent', 'bgImage', 'bgOpacity'].forEach(function (p) { design[p] = k[p] })
    design.label.color = k.label.color; design.label.pos = k.label.pos
    if (labelKept) design.label.text = k.label.text
    write(); preview()
  }
  function shrink(src, cb) {
    var i = new Image(); i.onload = function () {
      var m = 1400, s = Math.min(1, m / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = Math.round(i.width * s); c.height = Math.round(i.height * s)
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', 0.86))
    }; i.onerror = function () { cb(src) }; i.src = src
  }
  var oBg = window.handleBgImage
  window.handleBgImage = function (input) {
    var f = input.files && input.files[0]; oBg(input)
    if (!f) return
    var r = new FileReader(); r.onload = function (e) { shrink(e.target.result, function (d) { design.bgImage = d; if (design.frame === 'none' && design.pad === 0) { design.pad = 6; write() } preview() }) }; r.readAsDataURL(f)
  }
  var oRm = window.removeBgImage
  window.removeBgImage = function () { oRm(); design.bgImage = ''; preview() }

  /* ---------- download / copy ---------- */
  var oDl = window.dlQR
  window.dlQR = function (ext) {
    if (typeof qrInst === 'undefined' || !qrInst) { say('Complete setup to render QR.', ''); return }
    var szEl = $('dlSz'), size = szEl ? parseInt(szEl.value, 10) || 1024 : 1024, e = entryNow()
    if (ext === 'print') return oDl(ext)
    if (ext === 'copy') return QRC.copy(e, { size: Math.max(size, 1024) })
    var fmt = ext === 'jpeg' ? 'jpg' : ext
    say('Rendering ' + fmt.toUpperCase() + '…', 'green')
    QRC.download(e, { format: fmt, size: size, mm: 80 }).then(function (r) { if (r) say('Downloaded ' + r.ext.toUpperCase() + '. Save to Dashboard to keep this design.', 'green') })
  }

  /* ---------- save flow ---------- */
  window.QRX = {
    getDesign: function () { return JSON.parse(JSON.stringify(design)) },
    thumb: function (finalOpts) { return QRC.thumb({ opts: finalOpts, design: design, frame: selFrame }, 240) },
    afterSave: function (entry) {
      try { var u = new URL(location.href); u.searchParams.set('id', entry.id); history.replaceState(null, '', u) } catch (e) {}
      QRC.openSaved(entry, { keep: function () {}, dashboard: function () { location.href = 'qr.html' } })
    },
    restore: function (q) {
      design = QRC.norm(q.design, q.frame); write()
      var rm = $('rmBgImg'); if (rm && design.bgImage) rm.style.display = 'block'
      preview()
    }
  }

  function init() {
    if (!$('lyColor')) return
    bind(); write(); hideNative()
    if (window.__editEntry) QRX.restore(window.__editEntry)
    setTimeout(preview, 400)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init()
})()
