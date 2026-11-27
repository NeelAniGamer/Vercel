/* qr-compose.js — CraftQR shared composition + print-sheet + export engine
   One design spec -> identical pixels across live preview, PNG/JPG/WebP, SVG, Print Sheets, and PDF. */
(function (global) {
  'use strict'

  var FONT_MAP = {
    'IBM Plex Sans': "'IBM Plex Sans',Inter,system-ui,-apple-system,sans-serif",
    'Newsreader': "'Newsreader',Georgia,'Times New Roman',serif",
    'IBM Plex Mono': "'IBM Plex Mono','Space Mono',ui-monospace,monospace",
    'Georgia': "Georgia,'Times New Roman',serif",
    'Impact': "Impact,'Arial Black',sans-serif"
  }

  // Per-frame starting points (pad/width are % of QR size; radius is % of card width)
  var FRAME_DEF = {
    none:     { pad: 0,  width: 0,   radius: 0 },
    border:   { pad: 8,  width: 2.2, radius: 0 },
    double:   { pad: 9,  width: 2.0, radius: 2 },
    shadow:   { pad: 8,  width: 0,   radius: 4, shadow: 1 },
    rounded:  { pad: 8,  width: 2.2, radius: 10 },
    corners:  { pad: 9,  width: 2.6, radius: 2 },
    scan:     { pad: 8,  width: 2.2, radius: 4, label: 'SCAN NOW' },
    ribbon:   { pad: 9,  width: 1.8, radius: 6, label: 'SCAN ME', barRadius: 50 },
    ticket:   { pad: 8,  width: 1.8, radius: 3, dash: 1, dashStyle: 'dashed' },
    badge:    { pad: 12, width: 2.2, radius: 50 },
    phone:    { pad: 9,  width: 3.4, radius: 9 },
    polaroid: { pad: 6,  width: 0,   radius: 2, shadow: 1, polaroid: 1, label: 'SCAN TO OPEN' },
    card:     { pad: 9,  width: 1.4, radius: 6, shadow: 1, label: 'CRAFTED WITH CRAFTQR' },
    neon:     { pad: 8,  width: 1.6, radius: 6, glow: 1 }
  }

  function defaultsFor(frame) {
    var b = FRAME_DEF[frame] || FRAME_DEF.none
    return {
      frame: frame || 'none',
      color: '#1C1B19',
      color2: '#BF3B1E',
      frameGradient: false,
      width: b.width || 0,
      radius: b.radius || 0,
      pad: b.pad || 0,
      cardBg: '#FBF9F5',
      cardBg2: '#E7E2D8',
      cardGradient: false,
      cardTransparent: false,
      shadow: !!b.shadow,
      shadowBlur: 7,
      glow: !!b.glow,
      glowColor: '',
      dash: !!b.dash,
      dashStyle: b.dashStyle || (b.dash ? 'dashed' : 'solid'),
      polaroid: !!b.polaroid,
      label: {
        text: b.label || '',
        subtext: '',
        pos: 'bottom',
        font: 'IBM Plex Sans',
        weight: 700,
        size: 100,
        tracking: 1,
        color: '',
        bg: '',
        barRadius: b.barRadius || 0,
        uppercase: true
      },
      bgImage: '',
      bgOpacity: 1,
      bgBlur: 0
    }
  }

  function norm(d, legacyFrame) {
    d = d || {}
    var out = defaultsFor(d.frame || legacyFrame || 'none')
    Object.keys(d).forEach(function (k) {
      if (k === 'label' || d[k] === undefined || d[k] === null) return
      out[k] = d[k]
    })
    if (d.label) {
      Object.keys(d.label).forEach(function (k) {
        if (d.label[k] !== undefined && d.label[k] !== null) out.label[k] = d.label[k]
      })
    }
    out.width = +out.width || 0
    out.radius = +out.radius || 0
    out.pad = +out.pad || 0
    out.bgOpacity = out.bgOpacity === '' ? 1 : +out.bgOpacity
    out.bgBlur = +out.bgBlur || 0
    out.shadowBlur = out.shadowBlur === undefined ? 7 : +out.shadowBlur
    if (!out.dashStyle) out.dashStyle = out.dash ? 'dashed' : 'solid'
    out.dash = out.dashStyle !== 'solid'
    out.label.size = +out.label.size || 100
    out.label.weight = +out.label.weight || 700
    out.label.tracking = out.label.tracking === undefined ? 1 : +out.label.tracking
    out.label.barRadius = +out.label.barRadius || 0
    return out
  }

  /* ---------- geometry ---------- */
  function layout(N, d) {
    var k = (d.shadow || d.glow || d.polaroid) ? 0.09 : 0
    var padR = d.pad / 100
    var S = Math.max(64, Math.round(N / (1 + 2 * padR + 2 * k)))
    var om = Math.round(S * k), pad = Math.round(S * padR)
    var hasText = !!(d.label.text || d.label.subtext)
    var lh = (hasText && !d.polaroid) ? Math.round(S * (d.label.subtext ? 0.22 : 0.17) * (d.label.size / 100)) : 0
    var pe = d.polaroid ? Math.round(S * (d.label.subtext ? 0.23 : 0.17) * (d.label.size / 100)) : 0
    var cw = S + 2 * pad
    var ch = S + 2 * pad + lh + pe
    if (d.frame === 'badge' && !lh) ch = cw
    return {
      S: S, om: om, pad: pad, lh: lh, pe: pe, cw: cw, ch: ch,
      W: cw + 2 * om, H: ch + 2 * om,
      qx: om + pad, qy: om + pad + (d.label.pos === 'top' ? lh : 0)
    }
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

  function cornersD(x, y, w, h, len) {
    len = f2(Math.min(len, w * 0.28, h * 0.28))
    return [
      'M' + f2(x) + ' ' + f2(y + len) + 'V' + f2(y) + 'H' + f2(x + len),
      'M' + f2(x + w - len) + ' ' + f2(y) + 'H' + f2(x + w) + 'V' + f2(y + len),
      'M' + f2(x + w) + ' ' + f2(y + h - len) + 'V' + f2(y + h) + 'H' + f2(x + w - len),
      'M' + f2(x + len) + ' ' + f2(y + h) + 'H' + f2(x) + 'V' + f2(y + h - len)
    ].join(' ')
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
    var shadow = (d.shadow || d.polaroid) ? { blur: f2(S * ((d.shadowBlur || 7) / 100)), dy: f2(S * 0.025), color: 'rgba(28,27,25,.28)' } : null
    var cardFill = d.cardTransparent
      ? 'rgba(255,255,255,0.001)'
      : (d.cardGradient ? { g: [d.cardBg, d.cardBg2 || d.cardBg], x0: L.om, y0: L.om, x1: L.om + L.cw, y1: L.om + L.ch } : d.cardBg)

    if (!d.cardTransparent || shadow) {
      ops.push({ t: 'path', d: cardD, fill: cardFill, shadow: shadow })
    }
    if (d.bgImage) {
      ops.push({ t: 'img', href: d.bgImage, x: L.om, y: L.om, w: L.cw, h: L.ch, opacity: d.bgOpacity, blur: d.bgBlur, clipD: cardD })
    }

    var strokeStyle = d.frameGradient
      ? { g: [d.color, d.color2 || d.color], x0: L.om, y0: L.om, x1: L.om + L.cw, y1: L.om + L.ch }
      : d.color
    var dashArr = d.dashStyle === 'dotted' ? [f2(sw * 0.9), f2(sw * 1.4)] : (d.dashStyle === 'dashed' || d.dash) ? [f2(sw * 2.4), f2(sw * 1.6)] : null
    var glowShadow = d.glow ? { blur: f2(S * 0.06), dy: 0, color: d.glowColor || d.color } : null

    if (sw > 0) {
      if (d.frame === 'corners') {
        ops.push({ t: 'path', d: cornersD(L.om + sw / 2, L.om + sw / 2, L.cw - sw, L.ch - sw, S * 0.16), stroke: strokeStyle, sw: sw, cap: 'round', shadow: glowShadow })
      } else if (d.frame === 'double') {
        ops.push({ t: 'path', d: shape(sw / 2), stroke: strokeStyle, sw: sw, dash: dashArr, shadow: glowShadow })
        ops.push({ t: 'path', d: shape(sw * 2.1), stroke: strokeStyle, sw: f2(Math.max(1, sw * 0.5)), dash: dashArr })
      } else {
        ops.push({ t: 'path', d: shape(sw / 2), stroke: strokeStyle, sw: sw, dash: dashArr, shadow: glowShadow })
      }
    }

    if (d.frame === 'phone') {
      ops.push({ t: 'path', d: rr(L.om + L.cw / 2 - S * 0.09, L.om + sw + L.pad * 0.3, S * 0.18, Math.max(2, sw * 0.7), 99), fill: d.color })
      ops.push({ t: 'path', d: rr(L.om + L.cw / 2 - S * 0.02, L.om + L.ch - sw - L.pad * 0.55, S * 0.04, S * 0.04, 99), fill: d.color })
    }

    if (d.frame === 'card') {
      ops.push({ t: 'path', d: rr(L.om + L.pad * 0.6, L.om + sw + L.pad * 0.25, L.cw - L.pad * 1.2, Math.max(2, S * 0.012), 4), fill: d.color })
    }

    var lb = d.label
    var rawText = (lb.text || '').trim()
    var rawSub = (lb.subtext || '').trim()
    var mainStr = lb.uppercase ? rawText.toUpperCase() : rawText
    var subStr = rawSub
    var fontStack = FONT_MAP[lb.font] || FONT_MAP['IBM Plex Sans']

    if (mainStr || subStr) {
      var bar = d.frame === 'scan' || d.frame === 'ribbon' || !!lb.bg
      var barFill = lb.bg || (d.frameGradient ? strokeStyle : d.color)
      var txtCol = lb.color || (bar ? '#FBF9F5' : d.color)
      var size = f2(S * 0.145 * (lb.size / 100) * 0.44)
      var subSize = f2(size * 0.68)
      var ls = f2((lb.tracking || 0) * (S / 320))

      if (d.polaroid) {
        var pyCenter = L.om + L.ch - L.pe / 2 - L.pad * 0.15
        if (mainStr) {
          ops.push({ t: 'text', s: mainStr, x: L.om + L.cw / 2, y: subStr ? pyCenter - subSize * 0.7 : pyCenter, size: f2(size * 1.05), weight: lb.weight || 700, font: fontStack, color: lb.color || d.color, ls: ls })
        }
        if (subStr) {
          ops.push({ t: 'text', s: subStr, x: L.om + L.cw / 2, y: mainStr ? pyCenter + size * 0.72 : pyCenter, size: subSize, weight: 500, font: FONT_MAP['IBM Plex Mono'], color: lb.color || d.color, ls: 0.4 })
        }
      } else {
        var ly = lb.pos === 'top' ? L.om + sw / 2 : L.om + L.ch - L.lh - sw / 2
        if (bar) {
          var bx = d.frame === 'ribbon' ? L.om + L.pad * 0.9 : L.om + sw / 2
          var bw = d.frame === 'ribbon' ? L.cw - L.pad * 1.8 : L.cw - sw
          var by = d.frame === 'ribbon' ? ly + L.lh * 0.1 : ly
          var bh = d.frame === 'ribbon' ? L.lh * 0.8 : L.lh
          var br = f2(bh * (lb.barRadius || 0) / 100)
          ops.push({ t: 'path', d: rr(bx, by, bw, bh, br), fill: barFill, clipD: d.frame === 'ribbon' ? null : cardD })
        }
        var centerY = ly + L.lh / 2
        if (mainStr) {
          ops.push({ t: 'text', s: mainStr, x: L.om + L.cw / 2, y: subStr ? centerY - subSize * 0.65 : centerY, size: size, weight: lb.weight || 700, font: fontStack, color: txtCol, ls: ls })
        }
        if (subStr) {
          ops.push({ t: 'text', s: subStr, x: L.om + L.cw / 2, y: mainStr ? centerY + size * 0.68 : centerY, size: subSize, weight: 500, font: FONT_MAP['IBM Plex Mono'], color: txtCol, ls: 0.3 })
        }
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

  function resolveStyle(ctx, style) {
    if (!style || typeof style === 'string') return style
    if (style.g) {
      var grad = ctx.createLinearGradient(style.x0, style.y0, style.x1, style.y1)
      grad.addColorStop(0, style.g[0])
      grad.addColorStop(1, style.g[1])
      return grad
    }
    return '#1C1B19'
  }

  function paint(ctx, ops, qrImg, bgImg) {
    ops.forEach(function (o) {
      ctx.save()
      if (o.t === 'path') {
        if (o.clipD) ctx.clip(new Path2D(o.clipD))
        if (o.shadow) { ctx.shadowColor = o.shadow.color; ctx.shadowBlur = o.shadow.blur; ctx.shadowOffsetY = o.shadow.dy }
        var p = new Path2D(o.d)
        if (o.fill) { ctx.fillStyle = resolveStyle(ctx, o.fill); ctx.fill(p) }
        if (o.stroke) {
          ctx.strokeStyle = resolveStyle(ctx, o.stroke)
          ctx.lineWidth = o.sw
          if (o.cap) ctx.lineCap = o.cap
          ctx.setLineDash(o.dash || [])
          ctx.stroke(p)
        }
      } else if (o.t === 'img' && bgImg) {
        ctx.clip(new Path2D(o.clipD))
        ctx.globalAlpha = o.opacity
        if (o.blur && 'filter' in ctx) ctx.filter = 'blur(' + o.blur + 'px)'
        var sc = Math.max(o.w / bgImg.width, o.h / bgImg.height), dw = bgImg.width * sc, dh = bgImg.height * sc
        ctx.drawImage(bgImg, o.x + (o.w - dw) / 2, o.y + (o.h - dh) / 2, dw, dh)
      } else if (o.t === 'text') {
        ctx.fillStyle = o.color
        ctx.font = o.weight + ' ' + o.size + 'px ' + (o.font || FONT_MAP['IBM Plex Sans'])
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
    function svgColor(val) {
      if (!val) return 'none'
      if (typeof val === 'string') return val
      if (val.g) {
        var gid = 'gr' + (++n)
        defs += '<linearGradient id="' + gid + '" gradientUnits="userSpaceOnUse" x1="' + val.x0 + '" y1="' + val.y0 + '" x2="' + val.x1 + '" y2="' + val.y1 + '">' +
          '<stop offset="0%" stop-color="' + val.g[0] + '"/><stop offset="100%" stop-color="' + val.g[1] + '"/></linearGradient>'
        return 'url(#' + gid + ')'
      }
      return '#1C1B19'
    }
    built.ops.forEach(function (o) {
      if (o.t === 'path') {
        var attrs = ' d="' + o.d + '"' + (o.fill ? ' fill="' + svgColor(o.fill) + '"' : ' fill="none"')
        if (o.stroke) {
          attrs += ' stroke="' + svgColor(o.stroke) + '" stroke-width="' + o.sw + '"' +
            (o.cap ? ' stroke-linecap="' + o.cap + '"' : '') +
            (o.dash ? ' stroke-dasharray="' + o.dash.join(' ') + '"' : '')
        }
        if (o.shadow) {
          var id = 'sh' + (++n)
          defs += '<filter id="' + id + '" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="' + o.shadow.dy + '" stdDeviation="' + f2(o.shadow.blur / 2) + '" flood-color="' + o.shadow.color + '"/></filter>'
          attrs += ' filter="url(#' + id + ')"'
        }
        if (o.clipD) {
          var cid = 'cp' + (++n)
          defs += '<clipPath id="' + cid + '"><path d="' + o.clipD + '"/></clipPath>'
          body += '<g clip-path="url(#' + cid + ')"><path' + attrs + '/></g>'
        } else body += '<path' + attrs + '/>'
      } else if (o.t === 'img') {
        var c2 = 'cp' + (++n)
        defs += '<clipPath id="' + c2 + '"><path d="' + o.clipD + '"/></clipPath>'
        body += '<g clip-path="url(#' + c2 + ')"><image href="' + o.href + '" x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" opacity="' + o.opacity + '" preserveAspectRatio="xMidYMid slice"/></g>'
      } else if (o.t === 'text') {
        body += '<text x="' + o.x + '" y="' + o.y + '" font-family="' + esc(o.font || FONT_MAP['IBM Plex Sans']) + '" font-size="' + o.size + '" font-weight="' + o.weight + '" fill="' + o.color + '" text-anchor="middle" dominant-baseline="central" letter-spacing="' + (o.ls || 0) + '">' + esc(o.s) + '</text>'
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
    if (o && o.noFrame) { var keep = { cardBg: d.cardBg }; d = norm({ frame: 'none', cardBg: keep.cardBg }) }
    if (o && o.transparent) d.cardTransparent = true
    return d
  }
  function needLib() { if (typeof global.QRCodeStyling === 'undefined') throw new Error('QR library not loaded') }

  function renderCanvas(entry, o) {
    o = o || {}; needLib()
    var d = designFor(entry, o), size = Math.max(128, Math.min(6000, Math.round(o.size || 800)))
    var built = buildOps(size, d), L = built.L
    var fontsToLoad = ['700 20px "IBM Plex Sans"', '600 20px "Newsreader"', '500 18px "IBM Plex Mono"']
    var fontP = (document.fonts && document.fonts.load)
      ? Promise.all(fontsToLoad.map(function (f) { return document.fonts.load(f).catch(function () {}) }))
      : Promise.resolve()
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

  /* ---------- Print Sheet Composer (Sticker Grid / Table Tent / Poster A4) ---------- */
  function renderPrintSheetCanvas(entry, layoutType, headline, subline) {
    // 300 DPI A4 at 1240 x 1754 px (150 DPI crisp print speed)
    var W = 1240, H = 1754
    return renderCanvas(entry, { size: 900, transparent: false }).then(function (qrCv) {
      var sheet = document.createElement('canvas'); sheet.width = W; sheet.height = H
      var ctx = sheet.getContext('2d')
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)

      function drawCell(cx, cy, maxW, maxH, inverted) {
        ctx.save()
        ctx.translate(cx, cy)
        if (inverted) ctx.rotate(Math.PI)
        var s = Math.min(maxW, maxH * (qrCv.width / qrCv.height))
        var h = s * (qrCv.height / qrCv.width)
        ctx.drawImage(qrCv, -s / 2, -h / 2, s, h)
        ctx.restore()
      }

      if (layoutType === 'grid2x3' || layoutType === 'grid3x4') {
        var cols = layoutType === 'grid2x3' ? 2 : 3
        var rows = layoutType === 'grid2x3' ? 3 : 4
        var mx = 70, my = 80, cw = (W - 2 * mx) / cols, ch = (H - 2 * my) / rows
        ctx.strokeStyle = '#D5CFC3'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6])
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var x = mx + c * cw, y = my + r * ch
            ctx.strokeRect(x, y, cw, ch)
            drawCell(x + cw / 2, y + ch / 2, cw * 0.78, ch * 0.78, false)
          }
        }
      } else if (layoutType === 'tent') {
        // Folded Table Tent: top half inverted, bottom half upright, center fold line
        ctx.strokeStyle = '#BF3B1E'; ctx.lineWidth = 2; ctx.setLineDash([10, 8])
        ctx.beginPath(); ctx.moveTo(60, H / 2); ctx.lineTo(W - 60, H / 2); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#5A564E'; ctx.font = '600 18px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'
        ctx.fillText('FOLD ALONG THIS LINE', W / 2, H / 2 - 14)
        drawCell(W / 2, H * 0.74, 620, 620, false)
        drawCell(W / 2, H * 0.26, 620, 620, true)
      } else {
        // Single A4 Poster
        if (headline) {
          ctx.fillStyle = '#1C1B19'; ctx.font = '600 56px "Newsreader",Georgia,serif'; ctx.textAlign = 'center'
          ctx.fillText(headline.slice(0, 44), W / 2, 210)
        }
        if (subline) {
          ctx.fillStyle = '#5A564E'; ctx.font = '500 26px "IBM Plex Sans",sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(subline.slice(0, 72), W / 2, 275)
        }
        drawCell(W / 2, H / 2 + 40, 840, 840, false)
        ctx.fillStyle = '#5A564E'; ctx.font = '500 20px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'
        ctx.fillText('CRAFTED WITH CRAFTQR · CLASS OF LEARNERS', W / 2, H - 100)
      }
      return sheet
    })
  }

  function downloadPrintSheet(entry, layoutType, headline, subline) {
    return renderPrintSheetCanvas(entry, layoutType, headline, subline).then(function (sheet) {
      return canvasBlob(sheet, 'image/jpeg', 0.94).then(function (b) { return b.arrayBuffer() }).then(function (ab) {
        var pdf = makePdfFullPage(new Uint8Array(ab), sheet.width, sheet.height)
        saveBlob(pdf, fileName(entry, 'pdf', { name: ((entry.advSettings && entry.advSettings.name) || 'craftqr') + '-' + (layoutType || 'poster') }))
        return pdf
      })
    })
  }

  function makePdfFullPage(jpeg, pw, ph) {
    var enc = new TextEncoder(), parts = [], off = 0, xref = []
    function add(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); off += b.length }
    function obj(n, s) { xref[n] = off; add(n + ' 0 obj\n' + s + '\nendobj\n') }
    var PW = 595.28, PH = 841.89
    add('%PDF-1.4\n')
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>')
    xref[4] = off; add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + pw + ' /Height ' + ph + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n'); add(jpeg); add('\nendstream\nendobj\n')
    var c = 'q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im0 Do Q'
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
    if (f === 'svg') return renderSvg(entry, o).then(function (s) { return { blob: new Blob([s], { type: 'image/svg+xml' }), ext: 'svg', text: s } })
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
    var n = (o && o.name) || (entry.advSettings && entry.advSettings.name) || ('craftqr-' + (entry.type || 'code'))
    n = String(n).trim().replace(/[^\w\-. ]+/g, '').replace(/\s+/g, '-').slice(0, 60) || 'craftqr-code'
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
    }).then(function () { say('QR image copied to clipboard', 'green') }).catch(function () { say('Copy failed. Try downloading instead.', '') })
  }
  function defaults() {
    var s = parseInt(store('col_qr_def_sz'), 10), f = store('col_qr_def_fmt')
    return { size: s >= 128 ? s : 1024, format: /^(png|jpg|webp|svg|pdf)$/.test(f) ? f : 'png' }
  }

  /* ---------- Export & Saved Modals ---------- */
  var CSS = '.qrc-bd{position:fixed;inset:0;z-index:99999;background:rgba(28,27,25,.58);display:none;align-items:center;justify-content:center;padding:16px;overflow:auto}' +
    '.qrc-bd.on{display:flex}.qrc-m{width:min(820px,100%);max-height:90dvh;display:flex;flex-direction:column;background:var(--surface-card,#FBF9F5);color:var(--ink-primary,#1C1B19);border:1px solid var(--border-strong,#B8B0A0);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.28);font-family:var(--font-main,sans-serif);overflow:hidden}' +
    '.qrc-h{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border-subtle,#D5CFC3);flex-shrink:0}.qrc-h h2{font:600 1.25rem/1.2 var(--font-display,Newsreader,Georgia,serif);margin:0}' +
    '.qrc-x{background:none;border:0;color:inherit;font-size:1.5rem;cursor:pointer;line-height:1;padding:6px 10px;border-radius:8px;min-width:40px;min-height:40px}.qrc-x:hover{background:var(--surface-subtle,#E7E2D8)}' +
    '.qrc-content{overflow-y:auto;display:flex;flex-direction:column;flex:1;min-height:0}' +
    '.qrc-b{display:grid;grid-template-columns:minmax(0,270px) minmax(0,1fr);gap:22px;padding:20px;overflow-y:auto;flex:1}@media(max-width:640px){.qrc-b{grid-template-columns:1fr}}' +
    '.qrc-pv{display:flex;align-items:center;justify-content:center;min-height:240px;padding:14px;border:1px dashed var(--border-strong,#B8B0A0);border-radius:10px;background:repeating-conic-gradient(rgba(90,86,78,.10) 0 25%,transparent 0 50%) 0 0/16px 16px}.qrc-pv canvas{max-width:100%;max-height:310px;height:auto}' +
    '.qrc-f{display:flex;flex-direction:column;gap:14px}.qrc-l{font:500 .7rem/1 var(--font-mono,monospace);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted,#5A564E);margin-bottom:6px;display:block}' +
    '.qrc-seg{display:flex;gap:6px;flex-wrap:wrap}.qrc-seg button,.qrc-chip{border:1px solid var(--border-subtle,#D5CFC3);background:var(--surface-card,#FBF9F5);color:var(--ink-primary,#1C1B19);border-radius:8px;padding:7px 12px;font:600 .82rem var(--font-main,sans-serif);cursor:pointer;min-height:36px}' +
    '.qrc-seg button.on,.qrc-chip.on{background:var(--accent,#BF3B1E);border-color:var(--accent,#BF3B1E);color:var(--accent-contrast,#FBF9F5)}.qrc-in{width:100%;padding:9px 11px;border-radius:8px;border:1px solid var(--border-subtle,#D5CFC3);background:var(--surface-card,#FBF9F5);color:inherit;font:500 .9rem var(--font-main,sans-serif)}' +
    '.qrc-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.qrc-ck{display:flex;align-items:center;gap:8px;font-size:.86rem;cursor:pointer}.qrc-ck input{accent-color:var(--accent,#BF3B1E)}.qrc-note{font-size:.78rem;color:var(--ink-muted,#5A564E);line-height:1.45}' +
    '.qrc-ft{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;padding:14px 20px;border-top:1px solid var(--border-subtle,#D5CFC3);background:var(--surface-subtle,#E7E2D8);position:sticky;bottom:0;z-index:2;flex-shrink:0}.qrc-btn{border:1px solid var(--border-subtle,#D5CFC3);background:var(--surface-card,#FBF9F5);color:var(--ink-primary,#1C1B19);border-radius:8px;padding:10px 16px;font:600 .86rem var(--font-main,sans-serif);cursor:pointer;min-height:42px}' +
    '.qrc-btn.pri{background:var(--accent,#BF3B1E);border-color:var(--accent,#BF3B1E);color:var(--accent-contrast,#FBF9F5)}.qrc-btn.sec{background:var(--tint,#DCE7E3);border-color:var(--secondary,#22544C);color:var(--secondary,#22544C)}.qrc-btn:disabled{opacity:.5;cursor:wait}.qrc-url{display:flex;gap:8px;align-items:center;padding:9px 11px;border:1px solid var(--border-subtle,#D5CFC3);border-radius:8px;font:500 .8rem var(--font-mono,monospace);word-break:break-all;background:var(--surface-subtle,#E7E2D8)}'

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
    var D = defaults(), st = { format: D.format, size: D.size, mm: 80, quality: 0.92, transparent: false, noFrame: false, name: '', printLayout: 'single', printTitle: '' }
    st.name = (entry.advSettings && entry.advSettings.name) || ''
    var ui = shell('qrcExport', 'CraftQR Export & Print Studio'), b = ui.body, timer = null
    b.innerHTML = '<div class="qrc-b"><div class="qrc-pv" id="qrcPv"></div><div class="qrc-f">' +
      '<div><span class="qrc-l">Export Format</span><div class="qrc-seg" id="qrcFmt"></div></div>' +
      '<div id="qrcSzBox"><span class="qrc-l">Resolution (px)</span><div class="qrc-row"><input class="qrc-in" id="qrcSz" type="number" min="128" max="6000" step="1" style="max-width:120px"><div class="qrc-seg" id="qrcPre"></div></div></div>' +
      '<div id="qrcMmBox" style="display:none"><span class="qrc-l">Print Layout (A4 PDF)</span><div class="qrc-seg" id="qrcPl"></div><div id="qrcPlTitleWrap" style="margin-top:8px"><input class="qrc-in" id="qrcPlTitle" placeholder="Poster headline (optional)"></div><div id="qrcMmWrap" style="margin-top:8px"><span class="qrc-l">Single Code Width (mm)</span><input class="qrc-in" id="qrcMm" type="number" min="20" max="190" style="max-width:120px"></div></div>' +
      '<div id="qrcQBox"><span class="qrc-l">Compression Quality <b id="qrcQv"></b></span><input type="range" id="qrcQ" min="50" max="100" style="width:100%;accent-color:var(--accent,#BF3B1E)"></div>' +
      '<div class="qrc-row"><label class="qrc-ck"><input type="checkbox" id="qrcTr"> Transparent background</label><label class="qrc-ck"><input type="checkbox" id="qrcNf"> Raw QR only (strip frame)</label></div>' +
      '<div><span class="qrc-l">File name</span><input class="qrc-in" id="qrcName" placeholder="craftqr-code"></div>' +
      '<div class="qrc-note" id="qrcNote"></div></div></div>' +
      '<div class="qrc-ft"><button class="qrc-btn" id="qrcCopySvg">Copy SVG Code</button><button class="qrc-btn sec" id="qrcCopy">Copy Image</button><button class="qrc-btn pri" id="qrcGo">Download</button></div>'
    function $(i) { return b.querySelector('#' + i) }
    ;['png', 'jpg', 'webp', 'svg', 'pdf'].forEach(function (f) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = f.toUpperCase(); x.dataset.f = f
      x.onclick = function () { st.format = f; sync(); prev() }; $('qrcFmt').appendChild(x)
    })
    ;[512, 1024, 2048, 4096].forEach(function (n) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = n; x.className = 'qrc-chip'; x.dataset.n = n
      x.onclick = function () { st.size = n; sync() }; $('qrcPre').appendChild(x)
    })
    ;[
      ['single', 'Poster (1×1)'],
      ['grid2x3', 'Stickers (2×3)'],
      ['grid3x4', 'Labels (3×4)'],
      ['tent', 'Table Tent']
    ].forEach(function (pl) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = pl[1]; x.dataset.pl = pl[0]
      x.onclick = function () { st.printLayout = pl[0]; sync() }; $('qrcPl').appendChild(x)
    })

    function sync() {
      var f = st.format
      b.querySelectorAll('#qrcFmt button').forEach(function (x) { x.classList.toggle('on', x.dataset.f === f) })
      b.querySelectorAll('#qrcPre .qrc-chip').forEach(function (x) { x.classList.toggle('on', +x.dataset.n === st.size) })
      b.querySelectorAll('#qrcPl button').forEach(function (x) { x.classList.toggle('on', x.dataset.pl === st.printLayout) })
      $('qrcSz').value = st.size; $('qrcMm').value = st.mm; $('qrcQ').value = Math.round(st.quality * 100); $('qrcQv').textContent = Math.round(st.quality * 100) + '%'
      $('qrcSzBox').style.display = f === 'pdf' ? 'none' : ''
      $('qrcMmBox').style.display = f === 'pdf' ? '' : 'none'
      $('qrcPlTitleWrap').style.display = (f === 'pdf' && st.printLayout === 'single') ? '' : 'none'
      $('qrcMmWrap').style.display = 'none'
      $('qrcQBox').style.display = (f === 'jpg' || f === 'webp') ? '' : 'none'
      var tr = $('qrcTr'); tr.disabled = f === 'jpg' || f === 'pdf'; if (tr.disabled) { tr.checked = false; st.transparent = false } else tr.checked = st.transparent
      $('qrcNf').checked = st.noFrame; $('qrcName').value = st.name
      $('qrcNote').textContent = f === 'svg'
        ? 'Pure vector SVG preserves every custom frame, label, gradient, and module shape at infinite scale.'
        : f === 'pdf'
        ? 'Generates a print-ready A4 PDF sheet with crop marks (Stickers/Labels) or fold guide (Table Tent).'
        : f === 'jpg' ? 'JPG flattens transparency onto a crisp white sheet.' : '2048px+ is recommended for flyers and signage.'
    }
    function opt() { return { format: st.format, size: st.size, mm: st.mm, quality: st.quality, transparent: st.transparent, noFrame: st.noFrame, name: st.name } }
    function prev() {
      clearTimeout(timer)
      timer = setTimeout(function () {
        renderCanvas(entry, { size: 440, transparent: st.transparent, noFrame: st.noFrame }).then(function (cv) {
          var pv = $('qrcPv'); if (pv) { pv.innerHTML = ''; pv.appendChild(cv) }
        }).catch(function () { var pv = $('qrcPv'); if (pv) pv.textContent = 'Preview unavailable' })
      }, 100)
    }
    $('qrcSz').oninput = function () { st.size = Math.max(128, Math.min(6000, parseInt(this.value, 10) || 1024)); b.querySelectorAll('#qrcPre .qrc-chip').forEach(function (x) { x.classList.toggle('on', +x.dataset.n === st.size) }) }
    $('qrcMm').oninput = function () { st.mm = Math.max(20, Math.min(190, parseInt(this.value, 10) || 80)) }
    $('qrcQ').oninput = function () { st.quality = this.value / 100; $('qrcQv').textContent = this.value + '%' }
    $('qrcTr').onchange = function () { st.transparent = this.checked; prev() }
    $('qrcNf').onchange = function () { st.noFrame = this.checked; prev() }
    $('qrcName').oninput = function () { st.name = this.value }
    $('qrcPlTitle').oninput = function () { st.printTitle = this.value }
    $('qrcGo').onclick = function () {
      var btn = this; btn.disabled = true; btn.textContent = 'Rendering…'
      store('col_qr_def_fmt', st.format); store('col_qr_def_sz', String(st.size))
      var p = st.format === 'pdf'
        ? downloadPrintSheet(entry, st.printLayout, st.printTitle || st.name, entry.shortUrl || '')
        : download(entry, opt())
      p.then(function (r) { btn.disabled = false; btn.textContent = 'Download'; if (r) say('Downloaded ' + st.format.toUpperCase(), 'green') })
        .catch(function () { btn.disabled = false; btn.textContent = 'Download' })
    }
    $('qrcCopy').onclick = function () { copy(entry, opt()) }
    $('qrcCopySvg').onclick = function () {
      renderSvg(entry, { size: st.size, transparent: st.transparent, noFrame: st.noFrame }).then(function (svgStr) {
        return navigator.clipboard.writeText(svgStr).then(function () { say('SVG markup copied to clipboard', 'green') })
      }).catch(function () { say('Could not copy SVG', '') })
    }
    sync(); prev()
    return ui
  }

  function openSaved(entry, cb) {
    cb = cb || {}
    var ui = shell('qrcSaved', 'Saved to CraftQR Library'), b = ui.body, D = defaults()
    var link = entry.shortUrl || ''
    b.innerHTML = '<div class="qrc-b"><div class="qrc-pv" id="qrcPv2"></div><div class="qrc-f">' +
      '<div><span class="qrc-l">Title</span><div style="font:600 1.15rem var(--font-display,Newsreader,Georgia,serif)">' + esc((entry.advSettings && entry.advSettings.name) || entry.typeName || 'CraftQR Code') + '</div></div>' +
      (link ? '<div><span class="qrc-l">Dynamic Short Link (permanent across destination edits)</span><div class="qrc-url"><span style="flex:1">' + esc(link) + '</span><button class="qrc-btn" id="qrcCp" style="padding:6px 12px;min-height:34px">Copy</button></div></div>' : '') +
      '<div><span class="qrc-l">Quick Export</span><div class="qrc-seg" id="qrcQuick"></div></div>' +
      '<div class="qrc-note">Your custom frame, label typography, colors, and routing rules are saved together and ready for editing anytime.</div></div></div>' +
      '<div class="qrc-ft"><button class="qrc-btn" id="qrcKeep">Keep Editing</button><button class="qrc-btn pri" id="qrcDash">Open Dashboard</button></div>'
    function $(i) { return b.querySelector('#' + i) }
    renderCanvas(entry, { size: 440 }).then(function (cv) { var pv = $('qrcPv2'); if (pv) pv.appendChild(cv) })
    ;[['png', 'PNG'], ['svg', 'SVG'], ['pdf', 'Print PDF']].forEach(function (a) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = a[1]
      x.onclick = function () { x.disabled = true; download(entry, { format: a[0], size: Math.max(D.size, 1024) }).then(function () { x.disabled = false }) }
      $('qrcQuick').appendChild(x)
    })
    var more = document.createElement('button'); more.type = 'button'; more.textContent = 'Print Sheets & Options…'; more.onclick = function () { ui.close(); openExport(entry) }; $('qrcQuick').appendChild(more)
    if ($('qrcCp')) $('qrcCp').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { say('Dynamic link copied', 'green') }, function () { say('Copy failed', '') }) }
    $('qrcKeep').onclick = function () { ui.close(); if (cb.keep) cb.keep() }
    $('qrcDash').onclick = function () { ui.close(); if (cb.dashboard) cb.dashboard() }
    return ui
  }

  function thumb(entry, px) { return renderCanvas(entry, { size: px || 220 }).then(function (cv) { return cv.toDataURL('image/png') }) }

  global.QRC = {
    norm: norm, defaultsFor: defaultsFor, layout: layout, buildOps: buildOps, toSvg: toSvg,
    renderCanvas: renderCanvas, renderSvg: renderSvg, renderPrintSheetCanvas: renderPrintSheetCanvas,
    downloadPrintSheet: downloadPrintSheet, exportBlob: exportBlob, download: download, copy: copy,
    openExport: openExport, openSaved: openSaved, thumb: thumb, FRAME_DEF: FRAME_DEF, FONT_MAP: FONT_MAP
  }
})(typeof window !== 'undefined' ? window : globalThis)
