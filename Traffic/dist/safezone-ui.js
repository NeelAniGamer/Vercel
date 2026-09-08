

const SAFE_ZONES = {
  TL: { x: 'left', y: 'top', stack: 'vertical', gap: 8, priority: 'high' },
  TR: { x: 'right', y: 'top', stack: 'vertical', gap: 8, priority: 'high' },
  BL: { x: 'left', y: 'bottom', stack: 'vertical', gap: 8, priority: 'medium' },
  BR: { x: 'right', y: 'bottom', stack: 'vertical', gap: 8, priority: 'medium' },
  TC: { x: 'center', y: 'top', stack: 'horizontal', gap: 12, priority: 'high' },
  BC: { x: 'center', y: 'bottom', stack: 'horizontal', gap: 12, priority: 'high' },
  ML: { x: 'left', y: 'center', stack: 'vertical', gap: 10, priority: 'low' },
  MR: { x: 'right', y: 'center', stack: 'vertical', gap: 10, priority: 'low' }
};

/* ── Fluid 720p→2K breakpoints (replaces coarse 3-way) ── */
const BREAKPOINTS = {
  xs: { max: 359, name: 'xs' },           // 720p small budget (320-359)
  sm: { min: 360, max: 389, name: 'sm' }, // 720p standard (360-389)
  md: { min: 390, max: 411, name: 'md' }, // 1080p base (390-411)
  lg: { min: 412, max: 479, name: 'lg' }, // 1080p+ phablet (412-479)
  xl: { min: 480, max: 599, name: 'xl' }, // 1440p phone / Fold
  '2k-sm': { min: 600, max: 767, name: '2k-sm' }, // 2K small tablet
  tablet: { min: 768, max: 1023, name: 'tablet' },
  desktop: { min: 1024, max: 1439, name: 'desktop' },
  '2k': { min: 1440, max: 1919, name: '2k' },
  '2k-xl': { min: 1920, name: '2k-xl' },
  // legacy aliases for compatibility
  mobile: { max: 767, name: 'mobile' }
};

const ZONE_PRESETS = {
  xs: {
    TL: { scale: 0.72, maxItems: 2, compact: true },
    TR: { scale: 0.72, maxItems: 2, compact: true },
    BL: { scale: 0.70, maxItems: 2, compact: true },
    BR: { scale: 0.70, maxItems: 2, compact: true },
    TC: { scale: 0.78, maxItems: 2, compact: true },
    BC: { scale: 0.90, maxItems: 3, compact: true }
  },
  sm: {
    TL: { scale: 0.78, maxItems: 2, compact: true },
    TR: { scale: 0.78, maxItems: 2, compact: true },
    BL: { scale: 0.74, maxItems: 2, compact: true },
    BR: { scale: 0.74, maxItems: 2, compact: true },
    TC: { scale: 0.82, maxItems: 2, compact: true },
    BC: { scale: 0.95, maxItems: 3, compact: true }
  },
  md: {
    TL: { scale: 0.82, maxItems: 2, compact: true },
    TR: { scale: 0.82, maxItems: 2, compact: true },
    BL: { scale: 0.78, maxItems: 2, compact: true },
    BR: { scale: 0.78, maxItems: 2, compact: true },
    TC: { scale: 0.86, maxItems: 3, compact: true },
    BC: { scale: 0.98, maxItems: 3, compact: true }
  },
  lg: {
    TL: { scale: 0.86, maxItems: 3, compact: true },
    TR: { scale: 0.86, maxItems: 3, compact: true },
    BL: { scale: 0.82, maxItems: 2, compact: true },
    BR: { scale: 0.82, maxItems: 2, compact: true },
    TC: { scale: 0.90, maxItems: 3, compact: true },
    BC: { scale: 1.0, maxItems: 4, compact: true }
  },
  xl: {
    TL: { scale: 0.90, maxItems: 3, compact: true },
    TR: { scale: 0.90, maxItems: 3, compact: true },
    BL: { scale: 0.86, maxItems: 3, compact: true },
    BR: { scale: 0.86, maxItems: 3, compact: true },
    TC: { scale: 0.94, maxItems: 4, compact: true },
    BC: { scale: 1.02, maxItems: 4, compact: false }
  },
  '2k-sm': {
    TL: { scale: 0.94, maxItems: 4, compact: true },
    TR: { scale: 0.94, maxItems: 4, compact: true },
    BL: { scale: 0.90, maxItems: 3, compact: true },
    BR: { scale: 0.90, maxItems: 3, compact: true },
    TC: { scale: 0.98, maxItems: 4, compact: false },
    BC: { scale: 1.05, maxItems: 4, compact: false }
  },
  tablet: {
    TL: { scale: 0.96, maxItems: 4, compact: true },
    TR: { scale: 0.96, maxItems: 4, compact: true },
    BL: { scale: 0.92, maxItems: 3, compact: true },
    BR: { scale: 0.92, maxItems: 3, compact: true },
    TC: { scale: 1.0, maxItems: 5, compact: true },
    BC: { scale: 1.06, maxItems: 4, compact: false }
  },
  desktop: {
    TL: { scale: 1.0, maxItems: 6, compact: false },
    TR: { scale: 1.0, maxItems: 6, compact: false },
    BL: { scale: 1.0, maxItems: 4, compact: false },
    BR: { scale: 1.0, maxItems: 4, compact: false },
    TC: { scale: 1.0, maxItems: 8, compact: false },
    BC: { scale: 1.08, maxItems: 5, compact: false }
  },
  '2k': {
    TL: { scale: 1.06, maxItems: 6, compact: false },
    TR: { scale: 1.06, maxItems: 6, compact: false },
    BL: { scale: 1.04, maxItems: 5, compact: false },
    BR: { scale: 1.04, maxItems: 5, compact: false },
    TC: { scale: 1.08, maxItems: 8, compact: false },
    BC: { scale: 1.14, maxItems: 6, compact: false }
  },
  '2k-xl': {
    TL: { scale: 1.12, maxItems: 7, compact: false },
    TR: { scale: 1.12, maxItems: 7, compact: false },
    BL: { scale: 1.10, maxItems: 6, compact: false },
    BR: { scale: 1.10, maxItems: 6, compact: false },
    TC: { scale: 1.14, maxItems: 9, compact: false },
    BC: { scale: 1.18, maxItems: 7, compact: false }
  },
  // legacy fallback
  mobile: {
    TL: { scale: 0.82, maxItems: 2, compact: true },
    TR: { scale: 0.82, maxItems: 2, compact: true },
    BL: { scale: 0.78, maxItems: 2, compact: true },
    BR: { scale: 0.78, maxItems: 2, compact: true },
    TC: { scale: 0.86, maxItems: 3, compact: true },
    BC: { scale: 0.98, maxItems: 3, compact: true }
  }
};

class SafeZoneGrid {
  constructor() {
    this.zones = new Map();
    this.items = new Map();
    this.currentBreakpoint = 'desktop';
    this.enabled = true;
    this._resizeHandler = null;
    this._orientationHandler = null;
    this._safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  }

  init() {
    this._createZoneContainers();
    this._detectBreakpoint();
    this._applyBreakpointStyles();
    this._setupResizeListener();
    this._setupSafeAreaListener();
    this._injectBaseStyles();
    console.log('SafeZoneGrid: Initialized');
  }

  _createZoneContainers() {
    Object.keys(SAFE_ZONES).forEach(zoneId => {
      const zone = SAFE_ZONES[zoneId];
      const container = document.createElement('div');
      container.id = `sz-${zoneId.toLowerCase()}`;
      container.className = 'safe-zone';
      container.dataset.zone = zoneId;


      container.style.setProperty('--sz-x', zone.x);
      container.style.setProperty('--sz-y', zone.y);
      container.style.setProperty('--sz-gap', `${zone.gap}px`);
      container.style.setProperty('--sz-stack', zone.stack);

      document.body.appendChild(container);
      this.zones.set(zoneId, container);
    });
  }

  _injectBaseStyles() {
    if (document.getElementById('safezone-styles')) return;

    const style = document.createElement('style');
    style.id = 'safezone-styles';
    style.textContent = `
      /* Safe Zone Containers */
      .safe-zone {
        position: fixed;
        pointer-events: none;
        z-index: 100;
        display: flex;
        flex-wrap: nowrap;
        align-items: flex-start;
        justify-content: flex-start;
        /* Keep zone content off the physical screen edge — without this every
           registered panel sits flush against the corner and reads as clipped. */
        padding: var(--sz-inset, 14px);
        box-sizing: border-box;
        max-width: 100vw;
        transition: transform 0.2s ease, opacity 0.2s ease;
        will-change: transform, opacity;
      }
      /* Right/bottom zones align their stack toward their own edge */
      .safe-zone[data-zone="TR"], .safe-zone[data-zone="BR"], .safe-zone[data-zone="MR"] { align-items: flex-end; }
      .safe-zone[data-zone="BL"], .safe-zone[data-zone="BR"] { justify-content: flex-end; }

      /* Positioning via custom properties */
      .safe-zone[data-zone="TL"] { top: var(--safe-top, 0); left: var(--safe-left, 0); }
      .safe-zone[data-zone="TR"] { top: var(--safe-top, 0); right: var(--safe-right, 0); }
      .safe-zone[data-zone="BL"] { bottom: var(--safe-bottom, 0); left: var(--safe-left, 0); }
      .safe-zone[data-zone="BR"] { bottom: var(--safe-bottom, 0); right: var(--safe-right, 0); }
      .safe-zone[data-zone="TC"] { top: var(--safe-top, 0); left: 50%; transform: translateX(-50%); }
      .safe-zone[data-zone="BC"] { bottom: var(--safe-bottom, 0); left: 50%; transform: translateX(-50%); }
      .safe-zone[data-zone="ML"] { top: 50%; left: var(--safe-left, 0); transform: translateY(-50%); }
      .safe-zone[data-zone="MR"] { top: 50%; right: var(--safe-right, 0); transform: translateY(-50%); }

      /* Stack direction */
      .safe-zone[style*="--sz-stack: vertical"] { flex-direction: column; }
      .safe-zone[style*="--sz-stack: horizontal"] { flex-direction: row; }

      /* Gap */
      .safe-zone { gap: var(--sz-gap, 8px); }

      /* Items inside zones */
      .sz-item {
        position: relative !important;
        top: auto !important; left: auto !important; right: auto !important; bottom: auto !important;
        margin: 0 !important;
        transform: none !important;
        pointer-events: auto;
        flex-shrink: 0;
        transition: transform 0.15s ease, opacity 0.15s ease, scale 0.15s ease;
        will-change: transform, opacity;
      }

      .sz-item.hidden { display: none !important; }
      .sz-item.compact { scale: 0.85; }
      .sz-item.ultra-compact { scale: 0.7; }

      /* Priority-based hiding */
      .safe-zone.overflow-low .sz-item[data-priority="low"] { display: none; }
      .safe-zone.overflow-medium .sz-item[data-priority="medium"] { display: none; }
      .safe-zone.overflow-high .sz-item[data-priority="high"] { display: none; }

      /* Safe area insets (notch, home indicator) */
      :root {
        --safe-top: env(safe-area-inset-top, 0px);
        --safe-right: env(safe-area-inset-right, 0px);
        --safe-bottom: env(safe-area-inset-bottom, 0px);
        --safe-left: env(safe-area-inset-left, 0px);
      }

      /* Breakpoint-specific adjustments */
      @media (max-width: 767px) {
        :root { --sz-base-scale: 0.8; }
        .safe-zone { --sz-gap: 6px; --sz-inset: 8px; }
      }
      @media (min-width: 768px) and (max-width: 1023px) {
        :root { --sz-base-scale: 0.9; }
        .safe-zone { --sz-gap: 8px; --sz-inset: 12px; }
      }
      @media (min-width: 1024px) {
        :root { --sz-base-scale: 1.0; }
        .safe-zone { --sz-gap: 10px; --sz-inset: 16px; }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .safe-zone, .sz-item { transition: none !important; }
      }

      /* High contrast */
      @media (prefers-contrast: high) {
        .sz-item { border: 2px solid currentColor; }
      }
    `;
    document.head.appendChild(style);
  }

  _setupSafeAreaListener() {

    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      this._safeAreaInsets = {
        top: parseFloat(style.getPropertyValue('--safe-top')) || 0,
        right: parseFloat(style.getPropertyValue('--safe-right')) || 0,
        bottom: parseFloat(style.getPropertyValue('--safe-bottom')) || 0,
        left: parseFloat(style.getPropertyValue('--safe-left')) || 0
      };
      this._reflowAllZones();
    };

    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateSafeArea, 100);
    });
  }

  _detectBreakpoint() {
    const w = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;
    // DPR-aware effective width: high-DPI 720p@3x renders denser — treat as slightly smaller to keep HUD readable
    const effW = dpr >= 3 ? w * 0.94 : dpr >= 2.5 ? w * 0.97 : w;
    let bp = 'desktop';
    if (effW <= 359) bp = 'xs';
    else if (effW <= 389) bp = 'sm';
    else if (effW <= 411) bp = 'md';
    else if (effW <= 479) bp = 'lg';
    else if (effW <= 599) bp = 'xl';
    else if (effW <= 767) bp = '2k-sm';
    else if (effW <= 1023) bp = 'tablet';
    else if (effW <= 1439) bp = 'desktop';
    else if (effW <= 1919) bp = '2k';
    else bp = '2k-xl';

    // Orientation tweak: landscape on phones squeezes vertical space — bump down one tier
    if (window.innerHeight < 500 && window.innerWidth > window.innerHeight && bp !== 'xs') {
      const order = ['xs','sm','md','lg','xl','2k-sm','tablet','desktop','2k','2k-xl'];
      const idx = order.indexOf(bp);
      if (idx > 0) bp = order[idx - 1];
    }

    if (bp !== this.currentBreakpoint) {
      this.currentBreakpoint = bp;
      this._applyBreakpointStyles();
      this._reflowAllZones();
    }
    // Always re-apply DPR-scaled HUD variable for CSS
    document.documentElement.style.setProperty('--hud-dpr', dpr.toFixed(2));
  }

  _applyBreakpointStyles() {
    const preset = ZONE_PRESETS[this.currentBreakpoint];
    document.documentElement.style.setProperty('--sz-breakpoint', this.currentBreakpoint);

    this.zones.forEach((container, zoneId) => {
      const config = preset[zoneId] || { scale: 1, maxItems: 4, compact: false };
      container.style.setProperty('--sz-scale', config.scale);
      container.style.setProperty('--sz-max-items', config.maxItems);
      container.dataset.compact = config.compact;


      container.querySelectorAll('.sz-item').forEach(item => {
        item.classList.toggle('compact', config.compact);
        item.classList.toggle('ultra-compact', this.currentBreakpoint === 'mobile' && config.compact);
      });
    });
  }

  _setupResizeListener() {
    let ticking = false;
    this._resizeHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this._detectBreakpoint();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('resize', this._resizeHandler, { passive: true });
  }


  register(itemId, element, zoneId, options = {}) {
    if (!this.zones.has(zoneId)) {
      console.warn(`SafeZoneGrid: Unknown zone ${zoneId}`);
      return false;
    }

    const zone = this.zones.get(zoneId);
    const item = {
      element,
      zone: zoneId,
      order: options.order || 0,
      priority: options.priority || 'medium',
      visible: options.visible !== false,
      hidden: false
    };


    element.classList.add('sz-item');
    element.dataset.szId = itemId;
    element.dataset.priority = item.priority;
    element.style.setProperty('--sz-order', item.order);


    const children = Array.from(zone.children);
    let inserted = false;
    for (const child of children) {
      const childOrder = parseInt(child.style.getPropertyValue('--sz-order')) || 0;
      if (item.order < childOrder) {
        zone.insertBefore(element, child);
        inserted = true;
        break;
      }
    }
    if (!inserted) zone.appendChild(element);

    this.items.set(itemId, item);
    this._checkOverflow(zoneId);
    return true;
  }

  unregister(itemId) {
    const item = this.items.get(itemId);
    if (!item) return false;
    item.element.remove();
    this.items.delete(itemId);
    this._checkOverflow(item.zone);
    return true;
  }

  setVisible(itemId, visible) {
    const item = this.items.get(itemId);
    if (!item) return;
    item.visible = visible;
    item.element.classList.toggle('hidden', !visible);
    this._checkOverflow(item.zone);
  }

  setPriority(itemId, priority) {
    const item = this.items.get(itemId);
    if (!item) return;
    item.priority = priority;
    item.element.dataset.priority = priority;
    this._checkOverflow(item.zone);
  }

  moveToZone(itemId, newZoneId) {
    const item = this.items.get(itemId);
    if (!item || !this.zones.has(newZoneId)) return false;

    const oldZone = this.zones.get(item.zone);
    const newZone = this.zones.get(newZoneId);

    oldZone.removeChild(item.element);
    newZone.appendChild(item.element);
    item.zone = newZoneId;

    this._checkOverflow(item.zone);
    this._checkOverflow(newZoneId);
    return true;
  }

  _checkOverflow(zoneId) {
    const zone = this.zones.get(zoneId);
    const preset = ZONE_PRESETS[this.currentBreakpoint][zoneId] || { maxItems: 4 };
    const visibleItems = Array.from(zone.children).filter(el => !el.classList.contains('hidden'));


    zone.classList.remove('overflow-low', 'overflow-medium', 'overflow-high');

    if (visibleItems.length > preset.maxItems) {

      const overflow = visibleItems.length - preset.maxItems;
      let hidden = 0;


      if (hidden < overflow) {
        zone.classList.add('overflow-low');
        hidden += zone.querySelectorAll('[data-priority="low"]:not(.hidden)').length;
      }
      if (hidden < overflow) {
        zone.classList.add('overflow-medium');
        hidden += zone.querySelectorAll('[data-priority="medium"]:not(.hidden)').length;
      }
      if (hidden < overflow) {
        zone.classList.add('overflow-high');
      }
    }
  }

  _reflowAllZones() {
    this.zones.forEach((zone, zoneId) => this._checkOverflow(zoneId));
  }


  static getZoneForElement(element) {
    return element.closest('.safe-zone')?.dataset.zone || null;
  }

  static getBreakpoint() {
    const w = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;
    const effW = dpr >= 3 ? w * 0.94 : w;
    if (effW <= 359) return 'xs';
    if (effW <= 389) return 'sm';
    if (effW <= 411) return 'md';
    if (effW <= 479) return 'lg';
    if (effW <= 599) return 'xl';
    if (effW <= 767) return '2k-sm';
    if (effW <= 1023) return 'tablet';
    if (effW <= 1439) return 'desktop';
    if (effW <= 1919) return '2k';
    return '2k-xl';
  }


  destroy() {
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    this.zones.forEach(zone => zone.remove());
    this.zones.clear();
    this.items.clear();
    const styles = document.getElementById('safezone-styles');
    if (styles) styles.remove();
  }
}


if (typeof document !== 'undefined') {
  const initGrid = () => {
    window.safeZoneGridInstance = new SafeZoneGrid();
    window.safeZoneGridInstance.init();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrid);
  } else {
    initGrid();
  }
}

window.SafeZoneGrid = SafeZoneGrid;
window.SAFE_ZONES = SAFE_ZONES;
window.ZONE_PRESETS = ZONE_PRESETS;