/**
 * LoadingScreen — Unified 5-Stage Boot & Asset Progress Controller
 * Stages:
 *   0: Engine & Physics Init (0-15%)
 *   1: 3D Assets & Draco Decode (15-55%)
 *   2: Pre-Placed 3D Map Hydration (55-75%)
 *   3: Shaders & Lighting Warmup (75-92%)
 *   4: Traffic & Run Director Ready (92-100%)
 */
(function (root) {
  'use strict';

  const TIPS = [
    'Tip: Stop behind the solid white line at red signals—crossing into the zebra zone triggers an MV Act Sec 119 challan.',
    'Tip: In school zones, speed is governed to 20 km/h and honking is prohibited within 100m (Silence Zone).',
    'Tip: Use C to switch cameras (Chase, Hood, Top-Down, Orbit) and M to toggle the overhead city map.',
    'Tip: Adjust Render Distance in Settings to balance 60 FPS performance and distant skyline visibility.',
    'Tip: Every run seeds a fresh Mumbai traffic & weather pattern—watch for wet monsoon braking distances.'
  ];

  let tipTimer = null;
  let tipIdx = 0;
  let currentPct = 0;

  function el(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
  }

  function show(opts) {
    const o = opts || {};
    const rootEl = el('col-loading-screen');
    if (!rootEl) return;
    rootEl.classList.remove('is-hidden');
    rootEl.style.display = 'flex';

    const titleEl = el('col-ls-title');
    if (titleEl && o.title) titleEl.textContent = o.title;

    const badgeEl = el('col-ls-badge');
    if (badgeEl && o.badge) badgeEl.textContent = o.badge;

    const legacyLoader = el('loader');
    if (legacyLoader) legacyLoader.style.display = 'none';

    const tipEl = el('col-ls-tip');
    if (tipEl && !tipTimer) {
      tipEl.textContent = TIPS[0];
      tipTimer = setInterval(() => {
        tipIdx = (tipIdx + 1) % TIPS.length;
        const t = el('col-ls-tip');
        if (t) t.textContent = TIPS[tipIdx];
      }, 3500);
    }
  }

  function setStage(stageIndex, pct, statusText) {
    const clamped = Math.max(currentPct, Math.min(100, Math.round(pct || 0)));
    currentPct = clamped;

    const fill = el('col-ls-fill');
    if (fill) fill.style.width = clamped + '%';

    const pctEl = el('col-ls-pct');
    if (pctEl) pctEl.textContent = clamped + '%';

    const statusEl = el('col-ls-status');
    if (statusEl && statusText) statusEl.textContent = statusText;

    const stages = typeof document !== 'undefined' ? document.querySelectorAll('.col-ls-stage') : [];
    stages.forEach((node, idx) => {
      node.classList.toggle('is-done', idx < stageIndex);
      node.classList.toggle('is-active', idx === stageIndex);
    });
  }

  function complete() {
    setStage(4, 100, 'Ready — Launching Simulator');
    if (tipTimer) {
      clearInterval(tipTimer);
      tipTimer = null;
    }
    const rootEl = el('col-loading-screen');
    if (!rootEl) return;
    setTimeout(() => {
      rootEl.classList.add('is-hidden');
      setTimeout(() => {
        rootEl.style.display = 'none';
      }, 380);
    }, 120);
  }

  function fail(message, retryFn) {
    if (tipTimer) {
      clearInterval(tipTimer);
      tipTimer = null;
    }
    const errEl = el('col-ls-error');
    const msgEl = el('col-ls-error-msg');
    const btn = el('col-ls-retry');
    if (msgEl) msgEl.textContent = message || 'Failed to load required simulator assets.';
    if (errEl) errEl.classList.add('is-visible');
    if (btn) {
      btn.onclick = typeof retryFn === 'function' ? retryFn : () => window.location.reload();
    }
  }

  root.LoadingScreen = {
    show,
    setStage,
    complete,
    fail
  };
})(typeof window !== 'undefined' ? window : globalThis);
