/**
 * Traffic Academy - Shared Chart.js Utilities & Color Tokens
 * Centralizes chart configuration and color management across all pages
 */

(function() {
  'use strict';

  // ===== COLOR TOKEN SYSTEM =====
  // Single source of truth for all Traffic Academy colors
  // Matches CSS custom properties from col-ui.css and page-specific overrides

  const ColorTokens = {
    // Dark mode (default)
    dark: {
      bg: '#070a14',
      card: 'rgba(17, 24, 39, 0.85)',
      text: '#e8e3d8',
      ink: '#e8e3d8',
      border: 'rgba(255, 255, 255, 0.08)',
      borderStrong: 'rgba(255, 255, 255, 0.16)',
      hover: 'rgba(255, 255, 255, 0.06)',
      muted: '#8891aa',
      muted2: '#8891aa',
      accent: '#f2b84b',      // --signal (gold)
      signal: '#5ed4f5',      // --ion (blue)
      green: '#34d399',       // --em (teal/green)
      teal: '#00f0cc',        // --teal
      red: '#ef4444',         // error/danger
      yellow: '#f2b84b',      // --signal alias (FIXED: was missing in Dashboard)
      plasma: '#b89bff',      // --plasma (purple)
      void: '#070a14',        // --void
      void2: '#0c1224',       // --void2
      panel: '#111827',       // --panel
      line: 'rgba(255, 255, 255, 0.08)',   // --line
      lineb: 'rgba(255, 255, 255, 0.16)',  // --lineb
      dim: '#8891aa',         // --dim
    },

    // Light mode
    light: {
      bg: '#f3f2eb',
      card: 'rgba(255, 255, 255, 0.45)',
      text: '#111827',
      ink: '#1e293b',
      border: 'rgba(255, 255, 255, 0.4)',
      borderStrong: 'rgba(0, 0, 0, 0.15)',
      hover: 'rgba(255, 255, 255, 0.6)',
      muted: '#64748b',
      muted2: '#94a3b8',
      accent: '#d97706',      // darker gold for light mode
      signal: '#0369a1',      // darker blue for light mode
      green: '#34d399',
      teal: '#00f0cc',
      red: '#ef4444',
      yellow: '#d97706',
      plasma: '#b89bff',
      void: '#f3f2eb',
      void2: '#e8e3d8',
      panel: '#ffffff',
      line: 'rgba(0, 0, 0, 0.08)',
      lineb: 'rgba(0, 0, 0, 0.16)',
      dim: '#64748b',
    }
  };

  // Get current theme colors
  function getColors() {
    const isLight = document.body.classList.contains('lm');
    return ColorTokens[isLight ? 'light' : 'dark'];
  }

  // Get CSS custom property value (for dynamic colors)
  function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ===== CHART.JS GLOBAL ERROR HANDLER =====

  // Track whether Chart.js library loaded successfully
  let _chartJsAvailable = typeof Chart !== 'undefined';

  // Debounce: prevent toast spam from rapid chart re-renders
  let _lastChartWarnTime = 0;
  function _chartWarn(msg) {
    const now = Date.now();
    if (now - _lastChartWarnTime < 8000) return; // one toast per 8s max
    _lastChartWarnTime = now;
    if (typeof toast === 'function') {
      toast('📊 Chart: ' + msg, '#f59e0b');
    }
  }

  /**
   * Safely execute a Chart.js operation. Catches errors, shows a user-visible
   * toast, and returns a fallback value. Falls back to canvas-rendered text if
   * a canvas is provided.
   * @param {Function} fn - The chart operation to attempt
   * @param {HTMLCanvasElement} [canvas] - Optional canvas for fallback text
   * @param {string} [label='Chart'] - Short label for the toast message
   * @param {any} [fallbackVal=null] - Return value on failure
   */
  function _safeChartOp(fn, canvas, label, fallbackVal) {
    label = label || 'Chart';
    if (!_chartJsAvailable) {
      _chartWarn(label + ' not available — Chart.js failed to load');
      _drawFallbackMessage(canvas, 'Chart.js unavailable');
      return fallbackVal !== undefined ? fallbackVal : null;
    }
    try {
      return fn();
    } catch (e) {
      const msg = (e && (e.message || e.toString())) || 'unknown error';
      console.warn('[TrafficCharts] ' + label + ' error:', msg);
      _chartWarn(label + ' — ' + msg.substring(0, 60));
      _drawFallbackMessage(canvas, label + ' — ' + msg.substring(0, 40));
      return fallbackVal !== undefined ? fallbackVal : null;
    }
  }

  /**
   * Draw a readable fallback message on a canvas when Chart.js fails.
   */
  function _drawFallbackMessage(canvas, message) {
    if (!canvas || !canvas.getContext) return;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width || 200;
      const h = canvas.height || 200;
      ctx.clearRect(0, 0, w, h);
      // Semi-transparent bg
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.roundRect ? ctx.roundRect(4, 4, w - 8, h - 8, 8) : ctx.rect(4, 4, w - 8, h - 8);
      ctx.fill();
      // Icon
      ctx.fillStyle = '#f59e0b';
      ctx.font = (h > 40 ? '20px' : '14px') + ' sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠', w / 2, h / 2 - (h > 40 ? 10 : 0));
      // Message
      if (h > 50) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = (h > 70 ? '10px' : '7px') + ' Inter, sans-serif';
        ctx.fillText(message.substring(0, 30), w / 2, h / 2 + 14);
      }
    } catch (_) { /* silent — canvas fallback itself failed */ }
  }

  // ===== GLOBAL ERROR CATCHER =====
  // Handles cases where Chart.js CDN itself fails to load
  (function _setupChartErrorCatcher() {
    // Catch unhandled promise rejections from failed script loads
    window.addEventListener('unhandledrejection', function _onChartRejection(e) {
      if (!e.reason || typeof e.reason !== 'string' && !e.reason.message) return;
      const msg = (e.reason.message || e.reason).toString();
      if (msg.includes('chart.js') || msg.includes('chart.umd') || msg.includes('Chart') && msg.includes('cdn')) {
        _chartJsAvailable = false;
        _chartWarn('Chart.js failed to load — check your internet connection');
      }
    });
    // Catch runtime errors originating from Chart.js
    window.addEventListener('error', function _onChartError(e) {
      if (!e.message) return;
      const msg = e.message.toString();
      if (msg.includes('Chart') && (msg.includes('is not defined') || msg.includes('is not a constructor') || msg.includes('chart'))) {
        _chartJsAvailable = false;
      }
    }, { passive: true });
  })();

  // ===== CHART.JS UTILITIES =====

  // Check if Chart.js exists early
  if (typeof Chart === 'undefined') {
    _chartJsAvailable = false;
    console.warn('[TrafficCharts] Chart.js library not detected at load time. Charts will use fallback rendering.');
  }

  // Default chart options shared across all charts
  const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e8e3d8',
        bodyColor: '#e8e3d8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { family: 'Lora', size: 13, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: 0,
        max: 100,
      },
    },
  };

  // Gradient fill generator
  function createGradient(ctx, colorStops, direction = 'vertical') {
    if (!ctx || !ctx.chart || !ctx.chart.ctx) return colorStops[0]?.color || '#f2b84b';
    const chart = ctx.chart;
    const { ctx: canvasCtx, chartArea } = chart;
    if (!chartArea) return colorStops[0]?.color || '#f2b84b';

    const gradient = direction === 'vertical'
      ? canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
      : canvasCtx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);

    colorStops.forEach(stop => gradient.addColorStop(stop.offset, stop.color));
    return gradient;
  }

  // Pre-defined gradients for common chart types
  const Gradients = {
    // Gold to teal (primary progress)
    progress: (ctx) => createGradient(ctx, [
      { offset: 0, color: 'rgba(242, 184, 75, 0.15)' },   // --signal 15%
      { offset: 0.5, color: 'rgba(242, 184, 75, 0.08)' }, // --signal 8%
      { offset: 1, color: 'rgba(0, 240, 204, 0.02)' },    // --teal 2%
    ]),

    // Gold accent (stat cards)
    accent: (ctx) => createGradient(ctx, [
      { offset: 0, color: 'rgba(242, 184, 75, 0.25)' },
      { offset: 1, color: 'rgba(242, 184, 75, 0.02)' },
    ]),

    // Green success (completed modules)
    success: (ctx) => createGradient(ctx, [
      { offset: 0, color: 'rgba(52, 211, 153, 0.25)' },   // --em
      { offset: 1, color: 'rgba(52, 211, 153, 0.02)' },
    ]),

    // Blue info (in-progress)
    info: (ctx) => createGradient(ctx, [
      { offset: 0, color: 'rgba(94, 212, 245, 0.25)' },   // --ion
      { offset: 1, color: 'rgba(94, 212, 245, 0.02)' },
    ]),

    // Purple (achievements)
    achievement: (ctx) => createGradient(ctx, [
      { offset: 0, color: 'rgba(184, 155, 255, 0.25)' },  // --plasma
      { offset: 1, color: 'rgba(184, 155, 255, 0.02)' },
    ]),
  };

  // ===== CHART CREATORS =====

  /**
   * Create a doughnut/progress ring chart
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} value - Current value (0-100)
   * @param {Object} options - Configuration options
   */
  function createProgressRing(canvas, value, options = {}) {
    if (!canvas) return null;
    return _safeChartOp(function() {
      const colors = getColors();
      const ctx = canvas.getContext('2d');

      const config = {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [value, Math.max(0, 100 - value)],
            backgroundColor: [
              Gradients.progress(ctx),
              'rgba(255, 255, 255, 0.05)',
            ],
            borderWidth: 0,
            cutout: options.cutout || '75%',
            circumference: 360,
            rotation: -90,
          }],
        },
        options: {
          ...defaultChartOptions,
          cutout: options.cutout || '75%',
          plugins: {
            ...defaultChartOptions.plugins,
            tooltip: { enabled: false },
          },
          layout: {
            padding: options.padding || 0,
          },
        },
      };

      // Destroy existing chart if any
      if (canvas._chart) canvas._chart.destroy();
      canvas._chart = new Chart(ctx, config);
      return canvas._chart;
    }, canvas, 'Progress ring', null);
  }

  /**
   * Create a horizontal bar chart for level/category progress
   * @param {HTMLCanvasElement} canvas
   * @param {Array} data - Array of { label, value, color? }
   * @param {Object} options
   */
  function createHorizontalBarChart(canvas, data, options = {}) {
    if (!canvas) return null;
    return _safeChartOp(function() {
      const colors = getColors();
      const ctx = canvas.getContext('2d');

      const config = {
        type: 'bar',
        data: {
          labels: data.map(d => d.label),
          datasets: [{
            data: data.map(d => d.value),
            backgroundColor: data.map(d =>
              d.color || (d.value >= 100 ? colors.green : d.value > 0 ? colors.accent : colors.muted)
            ),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 16,
          }],
        },
        options: {
          ...defaultChartOptions,
          indexAxis: 'y',
          scales: {
            x: {
              display: false,
              min: 0,
              max: 100,
            },
            y: {
              display: true,
              grid: { display: false },
              ticks: {
                color: colors.muted,
                font: { family: 'Inter', size: 11 },
                padding: 8,
              },
            },
          },
          plugins: {
            ...defaultChartOptions.plugins,
            tooltip: {
              ...defaultChartOptions.plugins.tooltip,
              callbacks: {
                label: (ctx) => `${ctx.raw}% complete`,
              },
            },
          },
        },
      };

      if (canvas._chart) canvas._chart.destroy();
      canvas._chart = new Chart(ctx, config);
      return canvas._chart;
    }, canvas, 'Bar chart', null);
  }

  /**
   * Create a radial progress chart (for level completion)
   * @param {HTMLCanvasElement} canvas
   * @param {number} progress - 0-100
   * @param {Object} options
   */
  function createRadialProgress(canvas, progress, options = {}) {
    const colors = getColors();
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.width, canvas.height);
    const center = size / 2;
    const radius = (size / 2) - (options.strokeWidth || 8);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background circle
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = options.strokeWidth || 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress arc
    const endAngle = -Math.PI / 2 + (progress / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(center, center, radius, -Math.PI / 2, endAngle);
    ctx.strokeStyle = progress >= 100 ? colors.green : colors.accent;
    ctx.lineWidth = options.strokeWidth || 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center text
    ctx.fillStyle = colors.text;
    ctx.font = `${options.fontSize || Math.floor(size * 0.15)}px 'Lora', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(progress)}%`, center, center);

    // Subtitle
    if (options.subtitle) {
      ctx.font = `${Math.floor(size * 0.07)}px 'Inter', sans-serif`;
      ctx.fillStyle = colors.muted;
      ctx.fillText(options.subtitle, center, center + options.fontSize * 0.6);
    }
  }

  /**
   * Create a mini sparkline chart (for stat cards)
   * @param {HTMLCanvasElement} canvas
   * @param {number[]} data - Array of values
   * @param {Object} options
   */
  function createSparkline(canvas, data, options = {}) {
    const colors = getColors();
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    if (!data.length) return;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padding = 4;

    // Path
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    // Gradient stroke
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, options.color || colors.accent);
    gradient.addColorStop(1, options.colorEnd || colors.teal);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = options.lineWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill area
    if (options.fill) {
      ctx.lineTo(width - padding, height - padding);
      ctx.lineTo(padding, height - padding);
      ctx.closePath();
      const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
      fillGradient.addColorStop(0, (options.color || colors.accent).replace(')', ', 0.15)').replace('rgb', 'rgba'));
      fillGradient.addColorStop(1, (options.color || colors.accent).replace(')', ', 0)').replace('rgb', 'rgba'));
      ctx.fillStyle = fillGradient;
      ctx.fill();
    }
  }

  /**
   * Update chart colors when theme changes
   */
  function updateChartsForTheme() {
    // Re-create all charts on theme change
    document.querySelectorAll('canvas[data-chart]').forEach(canvas => {
      const type = canvas.dataset.chart;
      const value = parseFloat(canvas.dataset.value) || 0;
      const data = JSON.parse(canvas.dataset.chartData || '[]');

      switch (type) {
        case 'progress-ring':
          createProgressRing(canvas, value);
          break;
        case 'horizontal-bar':
          createHorizontalBarChart(canvas, data);
          break;
        case 'radial':
          createRadialProgress(canvas, value, JSON.parse(canvas.dataset.options || '{}'));
          break;
        case 'sparkline':
          createSparkline(canvas, data);
          break;
      }
    });
  }

  // Listen for theme changes
  const originalHzToggle = window.hzToggle;
  if (originalHzToggle) {
    window.hzToggle = function() {
      originalHzToggle.apply(this, arguments);
      setTimeout(updateChartsForTheme, 100);
    };
  }

  // Also listen for class changes on body
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.attributeName === 'class' && (m.target === document.body || m.target === document.documentElement)) {
        updateChartsForTheme();
      }
    });
  });
  
  function setupObserver() {
    const targetNode = document.body || document.documentElement;
    if (!targetNode) return;
    try { 
      observer.observe(targetNode, { attributes: true, attributeFilter: ['class'] }); 
    } catch (e) {}
  }

  setupObserver();
  document.addEventListener('DOMContentLoaded', setupObserver);

  // ===== PUBLIC API =====
  window.TrafficCharts = {
    ColorTokens,
    getColors,
    createProgressRing,
    createHorizontalBarChart,
    createRadialProgress,
    createSparkline,
    Gradients,
    updateChartsForTheme,
  };

})();