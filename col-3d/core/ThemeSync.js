// col-3d/core/ThemeSync.js — Dual-theme color synchronization for Three.js materials
// Provides live CSS variable → Three.js material sync with MutationObserver

;(function () {
  'use strict'

  // ==================== COLOR PALETTES ====================
  // Matches col-ui.css :root and body.lm definitions exactly
  const PALETTES = {
    dark: {
      // Base
      void: 0x070a14,
      void2: 0x0c1224,
      panel: 0x111827,
      line: 0x1a1f2e,      // rgba(255,255,255,0.08) on dark
      lineb: 0x2a2f3e,     // rgba(255,255,255,0.16) on dark
      // Text
      ink: 0xe8e3d8,
      dim: 0x8891aa,
      // Accents (CoL Design System)
      signal: 0xf2b84b,    // gold
      ion: 0x5ed4f5,       // cyan/blue
      teal: 0x00f0cc,      // teal
      plasma: 0xb89bff,    // purple
      em: 0x34d399,        // emerald/green
      // Semantic
      bgPrimary: 0x070a14,
      bgSecondary: 0x0c1224,
      bgCard: 0x111827,
      borderSubtle: 0x1a1f2e,
      borderStrong: 0x2a2f3e,
      textPrimary: 0xe8e3d8,
      textMuted: 0x8891aa,
      accentGold: 0xf2b84b,
      accentBlue: 0x5ed4f5,
      accentTeal: 0x00f0cc,
      accentPurple: 0xb89bff,
      accentGreen: 0x34d399,
      // Fog
      fogColor: 0x070a14,
      // Canvas opacity
      canvasOpacity: 1.0,
      glowOpacity: 0.95,
      coreOpacity: 0.9
    },
    light: {
      // Base (from body.lm in col-ui.css)
      void: 0xf0ede4,
      void2: 0xe6e2d8,
      panel: 0xffffff,
      line: 0xe8e4d8,      // rgba(0,0,0,0.09) on light ~ #e8e4d8
      lineb: 0xd0ccc8,     // rgba(0,0,0,0.18) on light
      // Text
      ink: 0x15181f,
      dim: 0x5c6175,
      // Accents (muted for light mode)
      signal: 0xb8720a,
      ion: 0x0e72a0,
      teal: 0x0a8c7a,
      plasma: 0x6f4fe0,
      em: 0x1b9d66,
      // Semantic
      bgPrimary: 0xf0ede4,
      bgSecondary: 0xe6e2d8,
      bgCard: 0xffffff,
      borderSubtle: 0xe8e4d8,
      borderStrong: 0xd0ccc8,
      textPrimary: 0x15181f,
      textMuted: 0x5c6175,
      accentGold: 0xb8720a,
      accentBlue: 0x0e72a0,
      accentTeal: 0x0a8c7a,
      accentPurple: 0x6f4fe0,
      accentGreen: 0x1b9d66,
      // Fog
      fogColor: 0xeef2ff,
      // Canvas opacity (reduced for light mode readability)
      canvasOpacity: 0.65,
      glowOpacity: 0.35,
      coreOpacity: 0.7
    }
  }

  // ==================== KEY MAP ====================
  // Maps semantic keys to palette keys for easy material assignment
  const SEMANTIC_MAP = {
    // Backgrounds
    'bg': 'bgPrimary',
    'bg-secondary': 'bgSecondary',
    'bg-card': 'bgCard',
    'panel': 'panel',
    // Borders
    'border': 'borderSubtle',
    'border-strong': 'borderStrong',
    'line': 'line',
    'lineb': 'lineb',
    // Text
    'text': 'textPrimary',
    'text-muted': 'textMuted',
    'ink': 'ink',
    'dim': 'dim',
    // Accents (by name)
    'signal': 'accentGold',
    'ion': 'accentBlue',
    'teal': 'accentTeal',
    'plasma': 'accentPurple',
    'em': 'accentGreen',
    'gold': 'accentGold',
    'blue': 'accentBlue',
    'cyan': 'accentTeal',
    'purple': 'accentPurple',
    'green': 'accentGreen',
    // Special
    'fog': 'fogColor',
    'canvas-opacity': 'canvasOpacity',
    'glow-opacity': 'glowOpacity',
    'core-opacity': 'coreOpacity'
  }

  // ==================== STATE ====================
  let currentTheme = 'dark'
  let palette = PALETTES.dark
  const materialRegistry = new Map() // material -> { key, property }
  const canvasRegistry = new Set()
  const changeCallbacks = new Set()
  let observer = null

  // ==================== PUBLIC API ====================
  window.ThemeSync = {
    registerMaterial(material, semanticKey, property = 'color') {
      const paletteKey = SEMANTIC_MAP[semanticKey] || semanticKey
      materialRegistry.set(material, { key: paletteKey, property })
      this.applyToMaterial(material, paletteKey, property)
      return () => materialRegistry.delete(material)
    },

    registerCanvas(canvas) {
      canvasRegistry.add(canvas)
      this.applyCanvasOpacity(canvas)
    },

    unregisterCanvas(canvas) {
      canvasRegistry.delete(canvas)
    },

    getColor(semanticKey) {
      const paletteKey = SEMANTIC_MAP[semanticKey] || semanticKey
      return palette[paletteKey]
    },

    getPalette() {
      return { ...palette }
    },

    isLight() {
      return currentTheme === 'light'
    },

    onChange(callback) {
      if (typeof callback === 'function') {
        changeCallbacks.add(callback)
        return () => changeCallbacks.delete(callback)
      }
    },

    // Call when theme changes externally
    refresh() {
      this.detectTheme()
      this.applyAll()
    }
  }

  // ==================== CORE LOGIC ====================
  function detectTheme() {
    const isLight = document.body.classList.contains('lm')
    currentTheme = isLight ? 'light' : 'dark'
    palette = PALETTES[currentTheme]
  }

  function applyAll() {
    detectTheme()
    // Materials
    materialRegistry.forEach((config, material) => {
      if (material && material[config.property] !== undefined) {
        applyToMaterial(material, config.key, config.property)
      }
    })
    // Canvases
    canvasRegistry.forEach(canvas => applyCanvasOpacity(canvas))
    // Fire callbacks
    changeCallbacks.forEach(cb => {
      try { cb(currentTheme, palette) } catch (e) { console.warn('[ThemeSync] callback error:', e) }
    })
  }

  function applyToMaterial(material, paletteKey, property) {
    const value = palette[paletteKey]
    if (value === undefined) return

    if (property === 'color' && material.color && material.color.setHex) {
      material.color.setHex(value)
    } else if (property === 'emissive' && material.emissive && material.emissive.setHex) {
      material.emissive.setHex(value)
    } else if (property === 'opacity' && typeof value === 'number') {
      material.opacity = value
      material.transparent = true
    } else if (material[property] !== undefined) {
      material[property] = value
    }
  }

  function applyCanvasOpacity(canvas) {
    const opacity = palette.canvasOpacity
    if (canvas.style.opacity !== String(opacity)) {
      canvas.style.opacity = opacity
    }
  }

  // ==================== OBSERVER ====================
  function initObserver() {
    if (observer) return
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'class' && m.target === document.body) {
          const wasLight = currentTheme === 'light'
          detectTheme()
          if (wasLight !== (currentTheme === 'light')) {
            applyAll()
            // Dispatch event for scenes to react
            window.dispatchEvent(new CustomEvent('col-theme-change', {
              detail: { theme: currentTheme, palette }
            }))
          }
          break
        }
      }
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  }

  // ==================== INIT ====================
  detectTheme()
  initObserver()

  // Expose for debugging
  window.__COL_THEME_SYNC__ = {
    getPalette: () => ({ ...palette }),
    getTheme: () => currentTheme,
    registrySize: () => materialRegistry.size
  }
})()