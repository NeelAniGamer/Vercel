// @ts-nocheck
/**
 * SafeZoneGrid — migrated from safezone-ui.js
 * Responsive HUD layout with safe-area insets, mobile detection
 */

export type ZoneId = 'TL' | 'TR' | 'BL' | 'BR' | 'TC' | 'BC' | 'ML' | 'MR';
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type Priority = 'high' | 'medium' | 'low';

interface ZoneConfig {
  x: string;
  y: string;
  stack: string;
  gap: number;
  priority: Priority;
}

interface ZonePreset {
  scale: number;
  maxItems: number;
  compact: boolean;
}

interface RegisteredItem {
  element: HTMLElement;
  zone: ZoneId;
  order: number;
  priority: Priority;
  visible: boolean;
  hidden: boolean;
}

interface RegisterOptions {
  order?: number;
  priority?: Priority;
  visible?: boolean;
}

const SAFE_ZONES: Record<ZoneId, ZoneConfig> = {
  TL: { x: 'left', y: 'top', stack: 'vertical', gap: 8, priority: 'high' },
  TR: { x: 'right', y: 'top', stack: 'vertical', gap: 8, priority: 'high' },
  BL: { x: 'left', y: 'bottom', stack: 'vertical', gap: 8, priority: 'medium' },
  BR: { x: 'right', y: 'bottom', stack: 'vertical', gap: 8, priority: 'medium' },
  TC: { x: 'center', y: 'top', stack: 'horizontal', gap: 12, priority: 'high' },
  BC: { x: 'center', y: 'bottom', stack: 'horizontal', gap: 12, priority: 'high' },
  ML: { x: 'left', y: 'center', stack: 'vertical', gap: 10, priority: 'low' },
  MR: { x: 'right', y: 'center', stack: 'vertical', gap: 10, priority: 'low' }
};

const BREAKPOINTS = {
  mobile: { max: 767, name: 'mobile' as Breakpoint },
  tablet: { min: 768, max: 1023, name: 'tablet' as Breakpoint },
  desktop: { min: 1024, name: 'desktop' as Breakpoint }
};

const ZONE_PRESETS: Record<Breakpoint, Partial<Record<ZoneId, ZonePreset>>> = {
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
    BC: { scale: 1.0, maxItems: 4, compact: true }
  }
};

export class SafeZoneGrid {
  zones = new Map<ZoneId, HTMLDivElement>();
  items = new Map<string, RegisteredItem>();
  currentBreakpoint: Breakpoint = 'desktop';
  enabled: boolean = true;
  private _resizeHandler: (() => void) | null = null;
  private _safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

  init(): void {
    this._createZoneContainers();
    this._detectBreakpoint();
    this._applyBreakpointStyles();
    this._setupResizeListener();
    this._setupSafeAreaListener();
    this._injectBaseStyles();
    console.log('[SafeZoneGrid] Initialized');
  }

  private _createZoneContainers(): void {
    Object.entries(SAFE_ZONES).forEach(([zoneId, zone]) => {
      const container = document.createElement('div');
      container.id = `sz-${zoneId.toLowerCase()}`;
      container.className = 'safe-zone';
      container.dataset.zone = zoneId;
      container.style.setProperty('--sz-x', zone.x);
      container.style.setProperty('--sz-y', zone.y);
      container.style.setProperty('--sz-gap', `${zone.gap}px`);
      container.style.setProperty('--sz-stack', zone.stack);
      document.body.appendChild(container);
      this.zones.set(zoneId as ZoneId, container);
    });
  }

  private _injectBaseStyles(): void {
    if (document.getElementById('safezone-styles')) return;
    const style = document.createElement('style');
    style.id = 'safezone-styles';
    style.textContent = `
      .safe-zone {
        position: fixed; pointer-events: none; z-index: 100;
        display: flex; flex-wrap: nowrap; align-items: flex-start;
        justify-content: flex-start; padding: var(--sz-inset, 14px);
        box-sizing: border-box; max-width: 100vw;
        transition: transform 0.2s ease, opacity 0.2s ease;
        will-change: transform, opacity;
      }
      .safe-zone[data-zone="TR"], .safe-zone[data-zone="BR"], .safe-zone[data-zone="MR"] { align-items: flex-end; }
      .safe-zone[data-zone="BL"], .safe-zone[data-zone="BR"] { justify-content: flex-end; }
      .safe-zone[data-zone="TL"] { top: var(--safe-top, 0); left: var(--safe-left, 0); }
      .safe-zone[data-zone="TR"] { top: var(--safe-top, 0); right: var(--safe-right, 0); }
      .safe-zone[data-zone="BL"] { bottom: var(--safe-bottom, 0); left: var(--safe-left, 0); }
      .safe-zone[data-zone="BR"] { bottom: var(--safe-bottom, 0); right: var(--safe-right, 0); }
      .safe-zone[data-zone="TC"] { top: var(--safe-top, 0); left: 50%; transform: translateX(-50%); }
      .safe-zone[data-zone="BC"] { bottom: var(--safe-bottom, 0); left: 50%; transform: translateX(-50%); }
      .safe-zone[data-zone="ML"] { top: 50%; left: var(--safe-left, 0); transform: translateY(-50%); }
      .safe-zone[data-zone="MR"] { top: 50%; right: var(--safe-right, 0); transform: translateY(-50%); }
      .safe-zone[style*="--sz-stack: vertical"] { flex-direction: column; }
      .safe-zone[style*="--sz-stack: horizontal"] { flex-direction: row; }
      .safe-zone { gap: var(--sz-gap, 8px); }
      .sz-item {
        position: relative !important; top: auto !important; left: auto !important;
        right: auto !important; bottom: auto !important; margin: 0 !important;
        pointer-events: auto; flex-shrink: 0;
        transition: transform 0.15s ease, opacity 0.15s ease, scale 0.15s ease;
        will-change: transform, opacity;
      }
      .sz-item.hidden { display: none !important; }
      .sz-item.compact { scale: 0.85; }
      .sz-item.ultra-compact { scale: 0.7; }
      .safe-zone.overflow-low .sz-item[data-priority="low"] { display: none; }
      .safe-zone.overflow-medium .sz-item[data-priority="medium"] { display: none; }
      .safe-zone.overflow-high .sz-item[data-priority="high"] { display: none; }
      :root {
        --safe-top: env(safe-area-inset-top, 0px);
        --safe-right: env(safe-area-inset-right, 0px);
        --safe-bottom: env(safe-area-inset-bottom, 0px);
        --safe-left: env(safe-area-inset-left, 0px);
      }
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
      @media (prefers-reduced-motion: reduce) {
        .safe-zone, .sz-item { transition: none !important; }
      }
      @media (prefers-contrast: high) {
        .sz-item { border: 2px solid currentColor; }
      }
    `;
    document.head.appendChild(style);
  }

  private _setupSafeAreaListener(): void {
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
    window.addEventListener('orientationchange', () => setTimeout(updateSafeArea, 100));
  }

  private _detectBreakpoint(): void {
    const w = window.innerWidth;
    let bp: Breakpoint = 'desktop';
    if (w <= BREAKPOINTS.mobile.max) bp = 'mobile';
    else if (w <= BREAKPOINTS.tablet.max) bp = 'tablet';

    if (bp !== this.currentBreakpoint) {
      this.currentBreakpoint = bp;
      this._applyBreakpointStyles();
      this._reflowAllZones();
    }
  }

  private _applyBreakpointStyles(): void {
    const preset = ZONE_PRESETS[this.currentBreakpoint];
    document.documentElement.style.setProperty('--sz-breakpoint', this.currentBreakpoint);

    this.zones.forEach((container, zoneId) => {
      const config = preset[zoneId] || { scale: 1, maxItems: 4, compact: false };
      container.style.setProperty('--sz-scale', String(config.scale));
      container.style.setProperty('--sz-max-items', String(config.maxItems));
      container.dataset.compact = String(config.compact);
      container.querySelectorAll('.sz-item').forEach(item => {
        (item as HTMLElement).classList.toggle('compact', config.compact);
        (item as HTMLElement).classList.toggle('ultra-compact', this.currentBreakpoint === 'mobile' && config.compact);
      });
    });
  }

  private _setupResizeListener(): void {
    let ticking = false;
    this._resizeHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => { this._detectBreakpoint(); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener('resize', this._resizeHandler, { passive: true });
  }

  register(itemId: string, element: HTMLElement, zoneId: ZoneId, options: RegisterOptions = {}): boolean {
    if (!this.zones.has(zoneId)) {
      console.warn(`SafeZoneGrid: Unknown zone ${zoneId}`);
      return false;
    }
    const zone = this.zones.get(zoneId)!;
    const item: RegisteredItem = {
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
    element.style.setProperty('--sz-order', String(item.order));

    const children = Array.from(zone.children) as HTMLElement[];
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

  unregister(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    item.element.remove();
    this.items.delete(itemId);
    this._checkOverflow(item.zone);
    return true;
  }

  setVisible(itemId: string, visible: boolean): void {
    const item = this.items.get(itemId);
    if (!item) return;
    item.visible = visible;
    item.element.classList.toggle('hidden', !visible);
    this._checkOverflow(item.zone);
  }

  moveToZone(itemId: string, newZoneId: ZoneId): boolean {
    const item = this.items.get(itemId);
    if (!item || !this.zones.has(newZoneId)) return false;
    this.zones.get(item.zone)!.removeChild(item.element);
    this.zones.get(newZoneId)!.appendChild(item.element);
    item.zone = newZoneId;
    this._checkOverflow(item.zone);
    this._checkOverflow(newZoneId);
    return true;
  }

  private _checkOverflow(zoneId: ZoneId): void {
    const zone = this.zones.get(zoneId)!;
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

  private _reflowAllZones(): void {
    this.zones.forEach((_, zoneId) => this._checkOverflow(zoneId));
  }

  static getZoneForElement(element: HTMLElement): ZoneId | null {
    return element.closest('.safe-zone')?.dataset.zone as ZoneId || null;
  }

  static getBreakpoint(): Breakpoint {
    const w = window.innerWidth;
    if (w <= 767) return 'mobile';
    if (w <= 1023) return 'tablet';
    return 'desktop';
  }

  destroy(): void {
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    this.zones.forEach(zone => zone.remove());
    this.zones.clear();
    this.items.clear();
    const styles = document.getElementById('safezone-styles');
    if (styles) styles.remove();
  }
}

// Legacy global access
if (typeof window !== 'undefined') {
  (window as any).SafeZoneGrid = SafeZoneGrid;
  (window as any).SAFE_ZONES = SAFE_ZONES;
  (window as any).ZONE_PRESETS = ZONE_PRESETS;

  const initGrid = () => {
    (window as any).safeZoneGridInstance = new SafeZoneGrid();
    (window as any).safeZoneGridInstance.init();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrid);
  } else {
    initGrid();
  }
}
