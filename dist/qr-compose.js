/* qr-compose.js — shared QR composition + export engine (editor, save screen, dashboard)
   One design spec -> same pixels everywhere: preview, PNG/JPG/WebP, SVG, PDF. Needs qr-code-styling. */
(function (global) {
  'use strict'
  var FONT = "Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif"

  // Per-frame starting points (pad/width/radius are % of QR size; radius is % of card width)
  var FRAME_DEF = {
    none:     { pad: 0,  width: 0,   radius: 0 },
    border:   { pad: 7,  width: 2.2, radius: 0 },
    shadow:   { pad: 7,  width: 0,   radius: 3, shadow: 1 },
    rounded:  { pad: 7,  width: 2.2, radius: 9 },
    scan:     { pad: 7,  width: 2.2, radius: 3, label: 'SCAN NOW' },
    ticket:   { pad: 7,  width: 1.6, radius: 3, dash: 1 },
    badge:    { pad: 11, width: 2.2, radius: 50 },
    phone:    { pad: 8,  width: 3.6, radius: 9 },
    polaroid: { pad: 6,  width: 0,   radius: 1, shadow: 1, polaroid: 1, label: '' },
    neon:     { pad: 7,  width: 1.4, radius: 6, glow: 1 }
  }

  function defaultsFor(frame) {
    var b = FRAME_DEF[frame] || FRAME_DEF.none
    return {
      frame: frame || 'none', color: '#1b1a17', width: b.width, radius: b.radius, pad: b.pad,
      cardBg: '#ffffff', cardTransparent: false, shadow: !!b.shadow, glow: !!b.glow, dash: !!b.dash, polaroid: !!b.polaroid,
      label: { text: b.label || '', pos: 'bottom', color: '', bg: '', size: 100 },
      bgImage: '', bgOpacity: 1
    }
  }

  function norm(d, legacyFrame) {
    d = d || {}
    var out = defaultsFor(d.frame || legacyFrame || 'none')
    Object.keys(d).forEach(function (k) {
      if (k === 'label' || d[k] === undefined || d[k] === null) return
      out[k] = d[k]
    })
    if (d.label) Object.keys(d.label).forEach(function (k) { if (d.label[k] !== undefined && d.label[k] !== null) out.label[k] = d.label[k] })
    out.width = +out.width || 0; out.radius = +out.radius || 0; out.pad = +out.pad || 0
    out.bgOpacity = out.bgOpacity === '' ? 1 : +out.bgOpacity
    return out
  }

  /* ---------- geometry ---------- */
  function layout(N, d) {
    var k = (d.shadow || d.glow || d.polaroid) ? 0.09 : 0
    var padR = d.pad / 100
    var S = Math.max(64, Math.round(N / (1 + 2 * padR + 2 * k)))
    var om = Math.round(S * k), pad = Math.round(S * padR)
    var lh = (d.label.text && !d.polaroid) ? Math.round(S * 0.17 * (d.label.size / 100)) : 0
    var pe = d.polaroid ? Math.round(S * 0.16) : 0
    var cw = S + 2 * pad, ch = S + 2 * pad + lh + pe
    if (d.frame === 'badge' && !lh) ch = cw
    return { S: S, om: om, pad: pad, lh: lh, pe: pe, cw: cw, ch: ch, W: cw + 2 * om, H: ch + 2 * om,
      qx: om + pad, qy: om + pad + (d.label.pos === 'top' ? lh : 0) }
  }

  function f2(n) { return Math.round(n * 100) / 100 }
  function rr(x, y, w, h, r) {
    x = f2(x); y = f2(y); w = f2(w); h = f2(h)
    r = f2(Math.max(0, Math.min(r, w / 2, h / 2)))
    if (!r) return 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'z'
    return 'M' + (x + r) + ' ' + y + 'h' + f2(w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'v' + f2(h - 2 * r) +
      'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + r + 'h' + f2(-(w - 2 * r)) + 'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + (-r) +
      'v' + f2(-(h - 2 * r)) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + (-r) + 'z'
  }
  function ticketD(x, y, w, h, r, n) {
    r = Math.min(r, w / 4); var s = f2(h / 2 - n - r)
    return 'M' + f2(x + r) + ' ' + f2(y) + 'h' + f2(w - 2 * r) + 'a' + f2(r) + ' ' + f2(r) + ' 0 0 1 ' + f2(r) + ' ' + f2(r) + 'v' + s +
      'a' + f2(n) + ' ' + f2(n) + ' 0 0 0 0 ' + f2(2 * n) + 'v' + s + 'a' + f2(r) + ' ' + f2(r) + ' 0 0 1 ' + f2(-r) + ' ' + f2(r) +
      'h' + f2(-(w - 2 * r)) + 'a' + f2(r) + ' ' + f2(r) + ' 0 0 1 ' + f2(-r) + ' ' + f2(-r) + 'v' + (-s) +
      'a' + f2(n) + ' ' + f2(n) + ' 0 0 0 0 ' + f2(-2 * n) + 'v' + (-s) + 'a' + f2(r) + ' ' + f2(r) + ' 0 0 1 ' + f2(r) + ' ' + f2(-r) + 'z'
  }

  /* ---------- drawing ops (shared by canvas + SVG renderers) ---------- */
  function buildOps(N, d) {
    var L = layout(N, d), ops = [], S = L.S
    var sw = f2(S * d.width / 100), rad = f2(L.cw * d.radius / 100)
    function shape(inset) {
      var x = L.om + inset, y = L.om + inset, w = L.cw - 2 * inset, h = L.ch - 2 * inset, r = Math.max(0, rad - inset)
      return d.frame === 'ticket' ? ticketD(x, y, w, h, r, S * 0.05) : rr(x, y, w, h, r)
    }
    var cardD = shape(0)
    var shadow = (d.shadow || d.polaroid) ? { blur: f2(S * 0.07), dy: f2(S * 0.025), color: 'rgba(20,18,14,.34)' } : null
    if (!d.cardTransparent || shadow) ops.push({ t: 'path', d: cardD, fill: d.cardTransparent ? 'rgba(255,255,255,0.001)' : d.cardBg, shadow: shadow })
    if (d.bgImage) ops.push({ t: 'img', href: d.bgImage, x: L.om, y: L.om, w: L.cw, h: L.ch, opacity: d.bgOpacity, clipD: cardD })
    if (sw > 0) ops.push({ t: 'path', d: shape(sw / 2), stroke: d.color, sw: sw, dash: d.dash ? [f2(sw * 2.4), f2(sw * 1.7)] : null,
      shadow: d.glow ? { blur: f2(S * 0.06), dy: 0, color: d.color } : null })
    if (d.frame === 'phone') {
      ops.push({ t: 'path', d: rr(L.om + L.cw / 2 - S * 0.09, L.om + sw + L.pad * 0.3, S * 0.18, Math.max(2, sw * 0.7), 99), fill: d.color })
      ops.push({ t: 'path', d: rr(L.om + L.cw / 2 - S * 0.02, L.om + L.ch - sw - L.pad * 0.55, S * 0.04, S * 0.04, 99), fill: d.color })
    }
    var lb = d.label
    if (lb.text) {
      var bar = d.frame === 'scan' || !!lb.bg
      var barFill = lb.bg || d.color
      var txtCol = lb.color || (bar ? '#ffffff' : d.color)
      var size = f2(S * 0.17 * (lb.size / 100) * 0.42)
      if (d.polaroid) {
        ops.push({ t: 'text', s: lb.text, x: L.om + L.cw / 2, y: L.om + L.ch - L.pe / 2 - L.pad * 0.2, size: f2(L.pe * 0.42), weight: 700, color: lb.color || d.color, ls: 1 })
      } else {
        var ly = lb.pos === 'top' ? L.om + sw / 2 : L.om + L.ch - L.lh - sw / 2
        if (bar) ops.push({ t: 'path', d: rr(L.om + sw / 2, ly, L.cw - sw, L.lh, 0), fill: barFill, clipD: cardD })
        ops.push({ t: 'text', s: lb.text, x: L.om + L.cw / 2, y: ly + L.lh / 2, size: size, weight: 800, color: txtCol, ls: f2(size * 0.12) })
      }
    }
    ops.push({ t: 'qr', x: L.qx, y: L.qy, s: S })
    return { L: L, ops: ops }
  }

  /* ---------- renderers ---------- */
  function loadImg(src) {
    return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i) }; i.onerror = rej; i.src = src })
  }
  function blobToImg(b) { var u = URL.createObjectURL(b); return loadImg(u).then(function (i) { setTimeout(function () { URL.revokeObjectURL(u) }, 4000); return i }) }

  function paint(ctx, ops, qrImg, bgImg) {
    ops.forEach(function (o) {
      ctx.save()
      if (o.t === 'path') {
        if (o.clipD) ctx.clip(new Path2D(o.clipD))
        if (o.shadow) { ctx.shadowColor = o.shadow.color; ctx.shadowBlur = o.shadow.blur; ctx.shadowOffsetY = o.shadow.dy }
        var p = new Path2D(o.d)
        if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(p) }
        if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.sw; ctx.setLineDash(o.dash || []); ctx.stroke(p) }
      } else if (o.t === 'img' && bgImg) {
        ctx.clip(new Path2D(o.clipD)); ctx.globalAlpha = o.opacity
        var sc = Math.max(o.w / bgImg.width, o.h / bgImg.height), dw = bgImg.width * sc, dh = bgImg.height * sc
        ctx.drawImage(bgImg, o.x + (o.w - dw) / 2, o.y + (o.h - dh) / 2, dw, dh)
      } else if (o.t === 'text') {
        ctx.fillStyle = o.color; ctx.font = o.weight + ' ' + o.size + 'px ' + FONT
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px'
        ctx.fillText(o.s, o.x, o.y)
      } else if (o.t === 'qr' && qrImg) {
        ctx.drawImage(qrImg, o.x, o.y, o.s, o.s)
      }
      ctx.restore()
    })
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
  function toSvg(built, qrSvg) {
    var L = built.L, defs = '', body = '', n = 0
    built.ops.forEach(function (o) {
      if (o.t === 'path') {
        var attrs = ' d="' + o.d + '"' + (o.fill ? ' fill="' + o.fill + '"' : ' fill="none"')
        if (o.stroke) attrs += ' stroke="' + o.stroke + '" stroke-width="' + o.sw + '"' + (o.dash ? ' stroke-dasharray="' + o.dash.join(' ') + '"' : '')
        if (o.shadow) { var id = 'sh' + (++n); defs += '<filter id="' + id + '" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="' + o.shadow.dy + '" stdDeviation="' + f2(o.shadow.blur / 2) + '" flood-color="' + o.shadow.color + '"/></filter>'; attrs += ' filter="url(#' + id + ')"' }
        if (o.clipD) { var cid = 'cp' + (++n); defs += '<clipPath id="' + cid + '"><path d="' + o.clipD + '"/></clipPath>'; body += '<g clip-path="url(#' + cid + ')"><path' + attrs + '/></g>' } else body += '<path' + attrs + '/>'
      } else if (o.t === 'img') {
        var c2 = 'cp' + (++n); defs += '<clipPath id="' + c2 + '"><path d="' + o.clipD + '"/></clipPath>'
        body += '<g clip-path="url(#' + c2 + ')"><image href="' + o.href + '" x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" opacity="' + o.opacity + '" preserveAspectRatio="xMidYMid slice"/></g>'
      } else if (o.t === 'text') {
        body += '<text x="' + o.x + '" y="' + o.y + '" font-family="' + esc(FONT) + '" font-size="' + o.size + '" font-weight="' + o.weight + '" fill="' + o.color + '" text-anchor="middle" dominant-baseline="central" letter-spacing="' + (o.ls || 0) + '">' + esc(o.s) + '</text>'
      } else if (o.t === 'qr') {
        body += '<g transform="translate(' + o.x + ' ' + o.y + ')">' + qrSvg.replace(/<\?xml[^>]*\?>/, '') + '</g>'
      }
    })
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + L.W + '" height="' + L.H + '" viewBox="0 0 ' + L.W + ' ' + L.H + '">' +
      (defs ? '<defs>' + defs + '</defs>' : '') + body + '</svg>'
  }

  /* ---------- core ---------- */
  function qrOptsFor(entry, S, o) {
    var base = Object.assign({}, entry.opts || {})
    base.width = S; base.height = S
    base.margin = Math.max(Math.round((base.margin || 0) * S / 280), Math.round(S * 0.04))
    if (o && o.transparent) base.backgroundOptions = Object.assign({}, base.backgroundOptions, { color: '#00000000' })
    return base
  }
  function designFor(entry, o) {
    var d = norm(entry.design, entry.frame)
    if (o && o.noFrame) { var keep = { cardBg: d.cardBg, bgImage: '' }; d = norm({ frame: 'none', cardBg: keep.cardBg }) }
    if (o && o.transparent) d.cardTransparent = true
    return d
  }
  function needLib() { if (typeof global.QRCodeStyling === 'undefined') throw new Error('QR library not loaded'); }

  function renderCanvas(entry, o) {
    o = o || {}; needLib()
    var d = designFor(entry, o), size = Math.max(128, Math.min(6000, Math.round(o.size || 800)))
    var built = buildOps(size, d), L = built.L
    var fontP = (document.fonts && document.fonts.load) ? document.fonts.load('800 20px Inter').catch(function () {}) : Promise.resolve()
    var qrP = new global.QRCodeStyling(qrOptsFor(entry, L.S, o)).getRawData('png').then(blobToImg)
    var bgP = d.bgImage ? loadImg(d.bgImage).catch(function () { return null }) : Promise.resolve(null)
    return Promise.all([qrP, bgP, fontP]).then(function (r) {
      var cv = document.createElement('canvas'); cv.width = L.W; cv.height = L.H
      paint(cv.getContext('2d'), built.ops, r[0], r[1])
      return cv
    })
  }

  function renderSvg(entry, o) {
    o = o || {}; needLib()
    var d = designFor(entry, o), built = buildOps(Math.max(128, Math.min(6000, Math.round(o.size || 800))), d)
    return new global.QRCodeStyling(Object.assign(qrOptsFor(entry, built.L.S, o), { type: 'svg' })).getRawData('svg')
      .then(function (b) { return b.text() }).then(function (t) { return toSvg(built, t) })
  }

  function makePdf(jpeg, pw, ph, mm) {
    var enc = new TextEncoder(), parts = [], off = 0, xref = []
    function add(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); off += b.length }
    function obj(n, s) { xref[n] = off; add(n + ' 0 obj\n' + s + '\nendobj\n') }
    var PW = 595.28, PH = 841.89, w = mm / 25.4 * 72, h = w * ph / pw, x = (PW - w) / 2, y = PH - h - 90
    add('%PDF-1.4\n')
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>')
    xref[4] = off; add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + pw + ' /Height ' + ph + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n'); add(jpeg); add('\nendstream\nendobj\n')
    var c = 'q ' + f2(w) + ' 0 0 ' + f2(h) + ' ' + f2(x) + ' ' + f2(y) + ' cm /Im0 Do Q'
    obj(5, '<< /Length ' + c.length + ' >>\nstream\n' + c + '\nendstream')
    var xs = off, t = 'xref\n0 6\n0000000000 65535 f \n'
    for (var i = 1; i <= 5; i++) t += ('0000000000' + xref[i]).slice(-10) + ' 00000 n \n'
    add(t + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xs + '\n%%EOF')
    return new Blob(parts, { type: 'application/pdf' })
  }

  function canvasBlob(cv, mime, q) { return new Promise(function (r) { cv.toBlob(r, mime, q) }) }
  function flatten(cv) { var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(cv, 0, 0); return c }

  function exportBlob(entry, o) {
    o = Object.assign({ format: 'png', size: 1024, quality: 0.92 }, o || {})
    var f = o.format
    if (f === 'svg') return renderSvg(entry, o).then(function (s) { return { blob: new Blob([s], { type: 'image/svg+xml' }), ext: 'svg' } })
    if (f === 'pdf') {
      var mm = Math.max(20, Math.min(190, o.mm || 80)), px = Math.round(mm / 25.4 * 300)
      return renderCanvas(entry, Object.assign({}, o, { size: px, transparent: false })).then(function (cv) {
        return canvasBlob(flatten(cv), 'image/jpeg', 0.95).then(function (b) { return b.arrayBuffer() }).then(function (ab) {
          return { blob: makePdf(new Uint8Array(ab), cv.width, cv.height, mm), ext: 'pdf' }
        })
      })
    }
    return renderCanvas(entry, o).then(function (cv) {
      var mime = f === 'jpg' || f === 'jpeg' ? 'image/jpeg' : f === 'webp' ? 'image/webp' : 'image/png'
      var src = mime === 'image/jpeg' ? flatten(cv) : cv
      return canvasBlob(src, mime, o.quality).then(function (b) { return { blob: b, ext: mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png' } })
    })
  }

  function fileName(entry, ext, o) {
    var n = (o && o.name) || (entry.advSettings && entry.advSettings.name) || ('qr-' + (entry.type || 'code'))
    n = String(n).trim().replace(/[^\w\-. ]+/g, '').replace(/\s+/g, '-').slice(0, 60) || 'qr-code'
    return n + '.' + ext
  }
  function saveBlob(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href) }, 4000)
  }
  function say(m, c) { if (typeof global.toast === 'function') global.toast(m, c) }
  function store(k, v) {
    try { if (v === undefined) return global.Storage && global.Storage.get ? global.Storage.get(k) : localStorage.getItem(k); if (global.Storage && global.Storage.set) global.Storage.set(k, v); else localStorage.setItem(k, v) } catch (e) { return null }
  }
  function download(entry, o) {
    return exportBlob(entry, o).then(function (r) { saveBlob(r.blob, fileName(entry, r.ext, o)); return r })
      .catch(function (e) { console.error(e); say('Export failed: ' + (e && e.message || 'unknown error'), '') })
  }
  function copy(entry, o) {
    if (!(navigator.clipboard && global.ClipboardItem)) { say('Clipboard images are not supported in this browser.', ''); return Promise.resolve() }
    return exportBlob(entry, Object.assign({}, o, { format: 'png' })).then(function (r) {
      return navigator.clipboard.write([new ClipboardItem({ 'image/png': r.blob })])
    }).then(function () { say('QR image copied', 'green') }).catch(function () { say('Copy failed. Try downloading instead.', '') })
  }
  function defaults() {
    var s = parseInt(store('col_qr_def_sz'), 10), f = store('col_qr_def_fmt')
    return { size: s >= 128 ? s : 1024, format: /^(png|jpg|webp|svg|pdf)$/.test(f) ? f : 'png' }
  }

  /* ---------- UI (self-contained, themed by page CSS variables) ---------- */
  var CSS = '.qrc-bd{position:fixed;inset:0;z-index:99999;background:rgba(18,16,13,.62);display:none;align-items:center;justify-content:center;padding:16px;overflow:auto}' +
    '.qrc-bd.on{display:flex}.qrc-m{width:min(760px,100%);max-height:90dvh;display:flex;flex-direction:column;background:var(--panel,#fff);color:var(--txt,#1b1a17);border:1px solid var(--border,#d9d3c6);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:var(--font-main,Inter,sans-serif);overflow:hidden}' +
    '.qrc-h{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border,#d9d3c6);flex-shrink:0}.qrc-h h2{font:600 1.15rem/1.2 Fraunces,Georgia,serif;margin:0}' +
    '.qrc-x{background:none;border:0;color:inherit;font-size:1.5rem;cursor:pointer;line-height:1;padding:4px 8px;border-radius:8px}.qrc-x:hover{background:var(--panel-hover,#eee)}' +
    '.qrc-content{overflow-y:auto;display:flex;flex-direction:column;flex:1;min-height:0}' +
    '.qrc-b{display:grid;grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:20px;padding:20px;overflow-y:auto;flex:1}@media(max-width:640px){.qrc-b{grid-template-columns:1fr}}' +
    '.qrc-pv{display:flex;align-items:center;justify-content:center;min-height:240px;padding:14px;border:1px dashed var(--border,#d9d3c6);border-radius:10px;background:repeating-conic-gradient(rgba(128,120,105,.14) 0 25%,transparent 0 50%) 0 0/16px 16px}.qrc-pv canvas{max-width:100%;max-height:300px;height:auto}' +
    '.qrc-f{display:flex;flex-direction:column;gap:14px}.qrc-l{font:600 .72rem/1 var(--font-mono,monospace);letter-spacing:.08em;text-transform:uppercase;color:var(--txt-m,#6b6558);margin-bottom:6px;display:block}' +
    '.qrc-seg{display:flex;gap:6px;flex-wrap:wrap}.qrc-seg button,.qrc-chip{border:1px solid var(--border,#d9d3c6);background:transparent;color:inherit;border-radius:8px;padding:7px 12px;font:600 .82rem var(--font-main,Inter,sans-serif);cursor:pointer}' +
    '.qrc-seg button.on,.qrc-chip.on{background:var(--pri,#c2410c);border-color:var(--pri,#c2410c);color:#fff}.qrc-in{width:100%;padding:9px 11px;border-radius:8px;border:1px solid var(--border,#d9d3c6);background:transparent;color:inherit;font:500 .9rem var(--font-main,Inter,sans-serif)}' +
    '.qrc-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.qrc-ck{display:flex;align-items:center;gap:8px;font-size:.86rem;cursor:pointer}.qrc-ck input{accent-color:var(--pri,#c2410c)}.qrc-note{font-size:.78rem;color:var(--txt-m,#6b6558);line-height:1.45}' +
    '.qrc-ft{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;padding:14px 20px;border-top:1px solid var(--border,#d9d3c6);background:var(--panel,#fff);position:sticky;bottom:0;z-index:2;flex-shrink:0}.qrc-btn{border:1px solid var(--border,#d9d3c6);background:transparent;color:inherit;border-radius:9px;padding:10px 16px;font:600 .88rem var(--font-main,Inter,sans-serif);cursor:pointer}' +
    '.qrc-btn.pri{background:var(--pri,#c2410c);border-color:var(--pri,#c2410c);color:#fff}.qrc-btn:disabled{opacity:.5;cursor:wait}.qrc-url{display:flex;gap:8px;align-items:center;padding:9px 11px;border:1px solid var(--border,#d9d3c6);border-radius:8px;font:500 .82rem var(--font-mono,monospace);word-break:break-all}'
  function ensureUI() {
    if (document.getElementById('qrcStyle')) return
    var s = document.createElement('style'); s.id = 'qrcStyle'; s.textContent = CSS; document.head.appendChild(s)
  }
  function shell(id, title) {
    ensureUI(); var old = document.getElementById(id); if (old) old.remove()
    var bd = document.createElement('div'); bd.className = 'qrc-bd'; bd.id = id; bd.setAttribute('role', 'dialog'); bd.setAttribute('aria-modal', 'true')
    bd.innerHTML = '<div class="qrc-m"><div class="qrc-h"><h2>' + esc(title) + '</h2><button class="qrc-x" aria-label="Close">&times;</button></div><div class="qrc-content"></div></div>'
    document.body.appendChild(bd)
    function close() { bd.remove(); document.removeEventListener('keydown', key) }
    function key(e) { if (e.key === 'Escape') close() }
    bd.addEventListener('mousedown', function (e) { if (e.target === bd) close() })
    bd.querySelector('.qrc-x').onclick = close; document.addEventListener('keydown', key)
    requestAnimationFrame(function () { bd.classList.add('on') })
    return { bd: bd, body: bd.querySelector('.qrc-content'), close: close }
  }

  function openExport(entry, cfg) {
    cfg = cfg || {}
    var D = defaults(), st = { format: D.format, size: D.size, mm: 80, quality: 0.92, transparent: false, noFrame: false, name: '' }
    var name0 = (entry.advSettings && entry.advSettings.name) || ''
    st.name = name0
    var ui = shell('qrcExport', 'Export QR code'), b = ui.body, timer = null
    b.innerHTML = '<div class="qrc-b"><div class="qrc-pv" id="qrcPv"></div><div class="qrc-f">' +
      '<div><span class="qrc-l">Format</span><div class="qrc-seg" id="qrcFmt"></div></div>' +
      '<div id="qrcSzBox"><span class="qrc-l">Width in pixels</span><div class="qrc-row"><input class="qrc-in" id="qrcSz" type="number" min="128" max="6000" step="1" style="max-width:130px"><div class="qrc-seg" id="qrcPre"></div></div></div>' +
      '<div id="qrcMmBox" style="display:none"><span class="qrc-l">Print width (mm, rendered at 300 DPI)</span><input class="qrc-in" id="qrcMm" type="number" min="20" max="190" style="max-width:130px"></div>' +
      '<div id="qrcQBox"><span class="qrc-l">Quality <b id="qrcQv"></b></span><input type="range" id="qrcQ" min="50" max="100" style="width:100%;accent-color:var(--pri,#c2410c)"></div>' +
      '<div class="qrc-row"><label class="qrc-ck"><input type="checkbox" id="qrcTr"> Transparent background</label><label class="qrc-ck"><input type="checkbox" id="qrcNf"> QR only (hide frame &amp; label)</label></div>' +
      '<div><span class="qrc-l">File name</span><input class="qrc-in" id="qrcName" placeholder="my-qr-code"></div>' +
      '<div class="qrc-note" id="qrcNote"></div></div></div>' +
      '<div class="qrc-ft"><button class="qrc-btn" id="qrcCopy">Copy image</button><button class="qrc-btn pri" id="qrcGo">Download</button></div>'
    function $(i) { return b.querySelector('#' + i) }
    ;['png', 'jpg', 'webp', 'svg', 'pdf'].forEach(function (f) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = f.toUpperCase(); x.dataset.f = f
      x.onclick = function () { st.format = f; sync(); prev() }; $('qrcFmt').appendChild(x)
    })
    ;[512, 1024, 2048, 4096].forEach(function (n) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = n; x.className = 'qrc-chip'; x.dataset.n = n
      x.onclick = function () { st.size = n; sync() }; $('qrcPre').appendChild(x)
    })
    function sync() {
      var f = st.format
      b.querySelectorAll('#qrcFmt button').forEach(function (x) { x.classList.toggle('on', x.dataset.f === f) })
      b.querySelectorAll('#qrcPre .qrc-chip').forEach(function (x) { x.classList.toggle('on', +x.dataset.n === st.size) })
      $('qrcSz').value = st.size; $('qrcMm').value = st.mm; $('qrcQ').value = Math.round(st.quality * 100); $('qrcQv').textContent = Math.round(st.quality * 100) + '%'
      $('qrcSzBox').style.display = f === 'pdf' ? 'none' : ''; $('qrcMmBox').style.display = f === 'pdf' ? '' : 'none'
      $('qrcQBox').style.display = (f === 'jpg' || f === 'webp') ? '' : 'none'
      var tr = $('qrcTr'); tr.disabled = f === 'jpg' || f === 'pdf'; if (tr.disabled) { tr.checked = false; st.transparent = false } else tr.checked = st.transparent
      $('qrcNf').checked = st.noFrame; $('qrcName').value = st.name
      $('qrcNote').textContent = f === 'svg' ? 'SVG keeps the code, frame and label as sharp vectors. Background photos are embedded as images.' :
        f === 'pdf' ? 'PDF places the code on an A4 page at the print size above, ready for any printer.' :
        f === 'jpg' ? 'JPG has no transparency, so the background is filled white.' : 'Larger sizes stay sharper in print. 2048 px or more is a safe choice for posters.'
    }
    function opt() { return { format: st.format, size: st.size, mm: st.mm, quality: st.quality, transparent: st.transparent, noFrame: st.noFrame, name: st.name } }
    function prev() {
      clearTimeout(timer)
      timer = setTimeout(function () {
        renderCanvas(entry, { size: 420, transparent: st.transparent, noFrame: st.noFrame }).then(function (cv) {
          var pv = $('qrcPv'); if (pv) { pv.innerHTML = ''; pv.appendChild(cv) }
        }).catch(function () { var pv = $('qrcPv'); if (pv) pv.textContent = 'Preview unavailable' })
      }, 120)
    }
    $('qrcSz').oninput = function () { st.size = Math.max(128, Math.min(6000, parseInt(this.value, 10) || 1024)); b.querySelectorAll('#qrcPre .qrc-chip').forEach(function (x) { x.classList.toggle('on', +x.dataset.n === st.size) }) }
    $('qrcMm').oninput = function () { st.mm = Math.max(20, Math.min(190, parseInt(this.value, 10) || 80)) }
    $('qrcQ').oninput = function () { st.quality = this.value / 100; $('qrcQv').textContent = this.value + '%' }
    $('qrcTr').onchange = function () { st.transparent = this.checked; prev() }
    $('qrcNf').onchange = function () { st.noFrame = this.checked; prev() }
    $('qrcName').oninput = function () { st.name = this.value }
    $('qrcGo').onclick = function () {
      var btn = this; btn.disabled = true; btn.textContent = 'Rendering…'
      store('col_qr_def_fmt', st.format); store('col_qr_def_sz', String(st.size))
      download(entry, opt()).then(function (r) { btn.disabled = false; btn.textContent = 'Download'; if (r) { say('Downloaded ' + r.ext.toUpperCase(), 'green') } })
    }
    $('qrcCopy').onclick = function () { copy(entry, opt()) }
    sync(); prev()
    return ui
  }

  function openSaved(entry, cb) {
    cb = cb || {}
    var ui = shell('qrcSaved', 'Saved. Your QR is ready'), b = ui.body, D = defaults()
    var link = entry.shortUrl || ''
    b.innerHTML = '<div class="qrc-b"><div class="qrc-pv" id="qrcPv2"></div><div class="qrc-f">' +
      '<div><span class="qrc-l">Name</span><div style="font:600 1.05rem Fraunces,Georgia,serif">' + esc((entry.advSettings && entry.advSettings.name) || entry.typeName || 'QR code') + '</div></div>' +
      (link ? '<div><span class="qrc-l">Dynamic link (stays the same when you edit the destination)</span><div class="qrc-url"><span style="flex:1">' + esc(link) + '</span><button class="qrc-btn" id="qrcCp" style="padding:6px 10px">Copy</button></div></div>' : '') +
      '<div><span class="qrc-l">Download with your design</span><div class="qrc-seg" id="qrcQuick"></div></div>' +
      '<div class="qrc-note">Frame, colours, logo and label are saved with the code, so you can download it again from the dashboard exactly as it looks here.</div></div></div>' +
      '<div class="qrc-ft"><button class="qrc-btn" id="qrcKeep">Keep editing</button><button class="qrc-btn pri" id="qrcDash">Open dashboard</button></div>'
    function $(i) { return b.querySelector('#' + i) }
    renderCanvas(entry, { size: 420 }).then(function (cv) { var pv = $('qrcPv2'); if (pv) pv.appendChild(cv) })
    ;[['png', 'PNG'], ['svg', 'SVG'], ['pdf', 'PDF']].forEach(function (a) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = a[1]
      x.onclick = function () { x.disabled = true; download(entry, { format: a[0], size: Math.max(D.size, 1024) }).then(function () { x.disabled = false }) }
      $('qrcQuick').appendChild(x)
    })
    var more = document.createElement('button'); more.type = 'button'; more.textContent = 'More options…'; more.onclick = function () { ui.close(); openExport(entry) }; $('qrcQuick').appendChild(more)
    if ($('qrcCp')) $('qrcCp').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { say('Link copied', 'green') }, function () { say('Copy failed', '') }) }
    $('qrcKeep').onclick = function () { ui.close(); if (cb.keep) cb.keep() }
    $('qrcDash').onclick = function () { ui.close(); if (cb.dashboard) cb.dashboard() }
    return ui
  }

  function thumb(entry, px) { return renderCanvas(entry, { size: px || 220 }).then(function (cv) { return cv.toDataURL('image/png') }) }

  global.QRC = { norm: norm, defaultsFor: defaultsFor, layout: layout, buildOps: buildOps, toSvg: toSvg, renderCanvas: renderCanvas, exportBlob: exportBlob,
    download: download, copy: copy, openExport: openExport, openSaved: openSaved, thumb: thumb, FRAME_DEF: FRAME_DEF }
})(typeof window !== 'undefined' ? window : globalThis)
