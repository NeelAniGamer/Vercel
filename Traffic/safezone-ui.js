/**
 * SafeZoneGrid - Constraint-Based Responsive UI System
 * Replaces absolute px/vw positioning with adaptive quadrant stacking
 * Supports: PC (expanded), Tablet (compact), Mobile (action-only)
 */

const SAFE_ZONES = {
  TL: { x: 'left', y: 'top', stack: 'vertical', gap: 8, priority: 'high' },      // Top-Left
  TR: { x: 'right', y: 'top', stack: 'vertical', gap: 8, priority: 'high' },      // Top-Right
  BL: { x: 'left', y: 'bottom', stack: 'vertical', gap: 8, priority: 'medium' },  // Bottom-Left
  BR: { x: 'right', y: 'bottom', stack: 'vertical', gap: 8, priority: 'medium' }, // Bottom-Right
  TC: { x: 'center', y: 'top', stack: 'horizontal', gap: 12, priority: 'high' },  // Top-Center
  BC: { x: 'center', y: 'bottom', stack: 'horizontal', gap: 12, priority: 'high' },// Bottom-Center
  ML: { x: 'left', y: 'center', stack: 'vertical', gap: 10, priority: 'low' },    // Middle-Left
  MR: { x: 'right', y: 'center', stack: 'vertical', gap: 10, priority: 'low' }    // Middle-Right
};

const BREAKPOINTS = {
  mobile: { max: 767, name: 'mobile' },
  tablet: { min: 768, max: 1023, name: 'tablet' },
  desktop: { min: 1024, name: 'desktop' }
};

const ZONE_PRESETS = {
  desktop: {
    TL: { scale: 1.0, maxItems: 6, compact: false },
    TR: { scale: 1.0, maxItems: 6, compact: false },
    BL: { scale: 1.0, maxItems: 4, compact: false },
    BR: { scale: 1.0, maxItems: 4, compact: false },
    TC: { scale: 1.0, maxItems: 8, compact: false },
    BC: { scale: 1.0, maxItems: 5, compact: false }
  },
  tablet: {
    TL: { scale: 0.9, maxItems: 4, compact: true },
    TR: { scale: 0.9, maxItems: 4, compact: true },
    BL: { scale: 0.85, maxItems: 3, compact: true },
    BR: { scale: 0.85, maxItems: 3, compact: true },
    TC: { scale: 0.9, maxItems: 5, compact: true },
    BC: { scale: 0.9, maxItems: 4, compact: true }
  },
  mobile: {
    TL: { scale: 0.8, maxItems: 2, compact: true },
    TR: { scale: 0.8, maxItems: 2, compact: true },
    BL: { scale: 0.75, maxItems: 2, compact: true },
    BR: { scale: 0.75, maxItems: 2, compact: true },
    TC: { scale: 0.85, maxItems: 3, compact: true },
    BC: { scale: 1.0, maxItems: 4, compact: true } // Bottom center = thumb zone
  }
};

class SafeZoneGrid {
  constructor() {
    this.zones = new Map();        // zoneId -> HTMLElement (container)
    this.items = new Map();        // itemId -> { element, zone, order, visible, priority }
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
      
      // Position via CSS custom properties
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
        transition: transform 0.2s ease, opacity 0.2s ease;
        will-change: transform, opacity;
      }
      
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
        .safe-zone { --sz-gap: 6px; }
      }
      @media (min-width: 768px) and (max-width: 1023px) {
        :root { --sz-base-scale: 0.9; }
        .safe-zone { --sz-gap: 8px; }
      }
      @media (min-width: 1024px) {
        :root { --sz-base-scale: 1.0; }
        .safe-zone { --sz-gap: 10px; }
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
    // iOS safe area insets can change on rotation
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
    let bp = 'desktop';
    if (w <= BREAKPOINTS.mobile.max) bp = 'mobile';
    else if (w <= BREAKPOINTS.tablet.max) bp = 'tablet';
    
    if (bp !== this.currentBreakpoint) {
      this.currentBreakpoint = bp;
      this._applyBreakpointStyles();
      this._reflowAllZones();
    }
  }

  _applyBreakpointStyles() {
    const preset = ZONE_PRESETS[this.currentBreakpoint];
    document.documentElement.style.setProperty('--sz-breakpoint', this.currentBreakpoint);
    
    this.zones.forEach((container, zoneId) => {
      const config = preset[zoneId] || { scale: 1, maxItems: 4, compact: false };
      container.style.setProperty('--sz-scale', config.scale);
      container.style.setProperty('--sz-max-items', config.maxItems);
      container.dataset.compact = config.compact;
      
      // Apply compact class to items
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

  // Public API
  
  /**
   * Register a UI element to a safe zone
   * @param {string} itemId - Unique identifier
   * @param {HTMLElement} element - The DOM element
   * @param {string} zoneId - One of TL, TR, BL, BR, TC, BC, ML, MR
   * @param {Object} options - { order, priority: 'high'|'medium'|'low', visible }
   */
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

    // Prepare element
    element.classList.add('sz-item');
    element.dataset.szId = itemId;
    element.dataset.priority = item.priority;
    element.style.setProperty('--sz-order', item.order);

    // Insert in order
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
    
    // Remove overflow classes
    zone.classList.remove('overflow-low', 'overflow-medium', 'overflow-high');
    
    if (visibleItems.length > preset.maxItems) {
      // Hide lowest priority items first
      const overflow = visibleItems.length - preset.maxItems;
      let hidden = 0;
      
      // Hide low priority first
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

  // Layout utilities
  static getZoneForElement(element) {
    return element.closest('.safe-zone')?.dataset.zone || null;
  }

  static getBreakpoint() {
    const w = window.innerWidth;
    if (w <= 767) return 'mobile';
    if (w <= 1023) return 'tablet';
    return 'desktop';
  }

  // Cleanup
  destroy() {
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    this.zones.forEach(zone => zone.remove());
    this.zones.clear();
    this.items.clear();
    const styles = document.getElementById('safezone-styles');
    if (styles) styles.remove();
  }
}

// Auto-init
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