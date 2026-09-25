/**
 * qr-dynamic.js — Shared Dynamic QR Code Engine for Class Of Learners
 * Handles: Short code generation, storage sync, analytics tracking,
 * scheduling, password protection, and template presets.
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'col_dynamic_qr';
  const TEMPLATES_KEY = 'col_qr_templates';
  const PRESETS_KEY = 'qr_custom_presets';
  const PASSWORD_ITERATIONS = 120000;

  function bytesToBase64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }

  async function derivePassword(password, salt) {
    if (!password || !globalThis.crypto?.subtle || typeof TextEncoder === 'undefined') return null;
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await globalThis.crypto.subtle.deriveBits({
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256'
    }, key, 256);
    return bytesToBase64(new Uint8Array(bits));
  }

  function constantTimeEqual(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
    let difference = 0;
    for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
    return difference === 0;
  }

  function withoutPlaintextPassword(entry) {
    const safe = {};
    for (const key of Object.keys(entry || {})) {
      if (['password', 'pin', 'email', 'access_token', 'refresh_token'].includes(key)) continue;
      safe[key] = entry[key];
    }
    return safe;
  }

  async function removeLegacyPlaintextPasswords() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const entries = JSON.parse(raw);
      if (!Array.isArray(entries)) return;
      // Legacy records are discarded rather than copied with their plaintext
      // password. A user can recreate protected QRs with the secure editor.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.map(withoutPlaintextPassword)));
    } catch (e) {
      console.warn('[DYNAMIC_QR] Could not remove legacy plaintext password data', e);
    }
  }

  const DYNAMIC_QR = {
    baseUrl: typeof window !== 'undefined' ? (window.location.origin + '/q.html') : 'https://advancedlogiclabs.dpdns.org/q.html',
    shortDomain: 'cl.ink',

    // Alphanumeric 6-char generator (avoiding ambiguous 0/O, 1/I/l)
    generateShortCode: function () {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    },

    // Create a new dynamic QR record
    create: async function (qrData) {
      const shortCode = qrData.shortCode || this.generateShortCode();
      const id = qrData.id || Date.now();
      const entry = {
        id: id,
        shortCode: shortCode,
        shortUrl: `${this.baseUrl}?id=${shortCode}`,
        destination: qrData.destination || qrData.content || '',
        type: qrData.type || 'url',
        title: qrData.title || qrData.typeName || 'Dynamic QR',
        expiry: qrData.expiry || null,
        schedule: qrData.schedule || null,
        utm: qrData.utm || null,
        scans: 0,
        uniqueScans: 0,
        uniqueIPs: [],
        analytics: [],
        created: qrData.created || new Date().toISOString(),
        updated: new Date().toISOString()
      };

      return this.save(Object.assign(entry, qrData.password ? { password: qrData.password } : {}));
    },

    // Get all stored dynamic QR codes
    getAll: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const entries = raw ? JSON.parse(raw) : [];
        return Array.isArray(entries) ? entries.map(withoutPlaintextPassword) : [];
      } catch (e) {
        console.warn('Failed to read dynamic QR storage', e);
        return [];
      }
    },

    // Save all dynamic QR records
    saveAll: function (data) {
      try {
        const safeData = Array.isArray(data) ? data.map(withoutPlaintextPassword) : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));
      } catch (e) {
        console.error('Failed to save dynamic QR records', e);
      }
    },

    // Save or update a single entry
    save: async function (entry) {
      if (this.ready) await this.ready;
      const all = this.getAll();
      const normalized = withoutPlaintextPassword(entry);
      if (entry.password) {
        const salt = globalThis.crypto?.getRandomValues
          ? globalThis.crypto.getRandomValues(new Uint8Array(16))
          : null;
        const verifier = salt ? await derivePassword(entry.password, salt) : null;
        if (!verifier) throw new Error('Secure password storage is unavailable in this browser.');
        normalized.passwordHash = verifier;
        normalized.passwordSalt = bytesToBase64(salt);
      }
      const idx = all.findIndex(q => q.shortCode === normalized.shortCode || String(q.id) === String(normalized.id));
      if (idx !== -1) {
        all[idx] = Object.assign({}, all[idx], normalized, { updated: new Date().toISOString() });
      } else {
        all.unshift(normalized);
      }
      this.saveAll(all);
      return withoutPlaintextPassword(all[idx >= 0 ? idx : 0]);
    },

    // Lookup entry by shortCode or ID
    getByCode: function (code) {
      if (!code) return null;
      const all = this.getAll();
      return all.find(q => q.shortCode === code || String(q.id) === String(code)) || null;
    },

    // Update destination URL
    updateDestination: function (shortCode, newDestination) {
      const all = this.getAll();
      const idx = all.findIndex(q => q.shortCode === shortCode || String(q.id) === String(shortCode));
      if (idx !== -1) {
        all[idx].destination = newDestination;
        all[idx].updated = new Date().toISOString();
        this.saveAll(all);

        // Also sync qrs_min if present
        this._syncQrsMin(shortCode, newDestination);
        return true;
      }
      return false;
    },

    // Internal helper to sync changes back to qrs_min
    _syncQrsMin: function (shortCode, newDestination) {
      try {
        const raw = localStorage.getItem('qrs_min');
        if (!raw) return;
        const list = JSON.parse(raw);
        let changed = false;
        list.forEach(q => {
          if (q.shortCode === shortCode || String(q.id) === String(shortCode)) {
            q.content = newDestination;
            changed = true;
          }
        });
        if (changed) localStorage.setItem('qrs_min', JSON.stringify(list));
      } catch (e) {}
    },

    // Delete single QR
    delete: function (shortCode) {
      const all = this.getAll().filter(q => q.shortCode !== shortCode && String(q.id) !== String(shortCode));
      this.saveAll(all);
    },

    // Bulk delete QRs
    bulkDelete: function (shortCodes) {
      if (!Array.isArray(shortCodes)) return;
      const all = this.getAll().filter(q => !shortCodes.includes(q.shortCode) && !shortCodes.includes(String(q.id)));
      this.saveAll(all);

      // Also clean qrs_min
      try {
        const raw = localStorage.getItem('qrs_min');
        if (raw) {
          const list = JSON.parse(raw).filter(q => !shortCodes.includes(q.shortCode) && !shortCodes.includes(String(q.id)));
          localStorage.setItem('qrs_min', JSON.stringify(list));
        }
      } catch (e) {}
    },

    // Track a scan event
    trackScan: function (shortCode, scanData) {
      const all = this.getAll();
      const idx = all.findIndex(q => q.shortCode === shortCode || String(q.id) === String(shortCode));
      if (idx === -1) return;

      const qr = all[idx];
      qr.scans = (qr.scans || 0) + 1;

      const ipHash = this.hashIP(scanData.ip || 'anon');
      if (!Array.isArray(qr.uniqueIPs)) qr.uniqueIPs = [];
      if (!qr.uniqueIPs.includes(ipHash)) {
        qr.uniqueIPs.push(ipHash);
      }
      qr.uniqueScans = qr.uniqueIPs.length;

      if (!Array.isArray(qr.analytics)) qr.analytics = [];
      qr.analytics.push({
        time: new Date().toISOString(),
        ip: ipHash,
        country: scanData.country || 'Unknown',
        city: scanData.city || 'Unknown',
        device: scanData.device || 'Desktop',
        os: scanData.os || 'Unknown',
        browser: scanData.browser || 'Unknown',
        referrer: scanData.referrer || 'Direct'
      });

      // Keep recent 200 scan events per QR
      if (qr.analytics.length > 200) {
        qr.analytics = qr.analytics.slice(-200);
      }

      this.saveAll(all);
    },

    // Compute aggregated analytics
    getAnalytics: function (shortCode, period = '30d') {
      const entry = this.getByCode(shortCode);
      if (!entry) return null;

      const days = parseInt(period) || 30;
      const cutoff = new Date(Date.now() - days * 86400000);
      const analyticsList = entry.analytics || [];
      const filtered = analyticsList.filter(a => new Date(a.time) >= cutoff);

      const byDay = {};
      const byCountry = {};
      const byDevice = {};
      const byOS = {};
      const byBrowser = {};

      filtered.forEach(a => {
        const day = a.time.split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;
        byCountry[a.country] = (byCountry[a.country] || 0) + 1;
        byDevice[a.device] = (byDevice[a.device] || 0) + 1;
        byOS[a.os] = (byOS[a.os] || 0) + 1;
        byBrowser[a.browser] = (byBrowser[a.browser] || 0) + 1;
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const weekCutoff = new Date(Date.now() - 7 * 86400000);

      return {
        totalScans: entry.scans || filtered.length,
        uniqueScans: entry.uniqueScans || Object.keys(byDay).length,
        scansToday: filtered.filter(a => a.time.startsWith(todayStr)).length,
        scansThisWeek: filtered.filter(a => new Date(a.time) >= weekCutoff).length,
        byDay: byDay,
        byCountry: byCountry,
        byDevice: byDevice,
        byOS: byOS,
        byBrowser: byBrowser,
        recentScans: filtered.slice(-50)
      };
    },

    // Export scan logs as CSV
    exportCSV: function (shortCode) {
      const entry = this.getByCode(shortCode);
      if (!entry || !entry.analytics || entry.analytics.length === 0) return '';
      const headers = ['Time', 'Country', 'City', 'Device', 'OS', 'Browser', 'Referrer', 'IP Hash'];
      const rows = entry.analytics.map(a => [
        `"${a.time}"`,
        `"${a.country}"`,
        `"${a.city}"`,
        `"${a.device}"`,
        `"${a.os}"`,
        `"${a.browser}"`,
        `"${a.referrer}"`,
        `"${a.ip}"`
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    },

    // Password verification uses the salted verifier created by save().
    checkPassword: async function (shortCode, enteredPassword) {
      await this.ready;
      const entry = this.getByCode(shortCode);
      if (!entry || !entry.passwordHash || !entry.passwordSalt || !enteredPassword) return false;
      const actual = await derivePassword(enteredPassword, base64ToBytes(entry.passwordSalt));
      return constantTimeEqual(actual, entry.passwordHash);
    },

    hashIP: function (ip) {
      let hash = 0;
      for (let i = 0; i < ip.length; i++) {
        hash = (hash << 5) - hash + ip.charCodeAt(i);
        hash |= 0;
      }
      return 'ip_' + Math.abs(hash).toString(36);
    },

    isExpired: function (entry) {
      if (!entry || !entry.expiry) return false;
      return new Date(entry.expiry) < new Date();
    },

    isActive: function (entry) {
      if (!entry) return false;
      if (entry.schedule) {
        const now = new Date();
        const start = entry.schedule.start ? new Date(entry.schedule.start) : null;
        const end = entry.schedule.end ? new Date(entry.schedule.end) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;
      }
      return true;
    },

    // Template management
    templates: {
      getAll: function () {
        try {
          const raw = localStorage.getItem(TEMPLATES_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      },
      saveAll: function (list) {
        try {
          localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list));
        } catch (e) {}
      },
      save: function (template) {
        const all = this.getAll();
        template.id = template.id || Date.now();
        template.created = new Date().toISOString();
        all.push(template);
        this.saveAll(all);
        return template;
      },
      delete: function (id) {
        const all = this.getAll().filter(t => t.id !== id && String(t.id) !== String(id));
        this.saveAll(all);
      },
      apply: function (template, qrData) {
        return Object.assign({}, qrData, template, {
          id: Date.now(),
          shortCode: DYNAMIC_QR.generateShortCode()
        });
      }
    }
  };

  DYNAMIC_QR.ready = removeLegacyPlaintextPasswords();

  // Seed default templates if not yet initialized
  if (typeof localStorage !== 'undefined' && !localStorage.getItem(TEMPLATES_KEY)) {
    DYNAMIC_QR.templates.saveAll([
      {
        id: 'business_card',
        name: 'Business Card',
        type: 'vcard',
        opts: {
          dotsOptions: { type: 'extra-rounded', color: '#3b82f6' },
          cornersSquareOptions: { type: 'extra-rounded', color: '#2dd4bf' },
          backgroundOptions: { color: '#ffffff' }
        }
      },
      {
        id: 'wifi_neon',
        name: 'Wi-Fi Neon',
        type: 'wifi',
        opts: {
          dotsOptions: { type: 'extra-rounded', color: '#10b981' },
          cornersSquareOptions: { type: 'extra-rounded', color: '#f59e0b' },
          backgroundOptions: { color: '#0f172a' }
        }
      },
      {
        id: 'minimal_menu',
        name: 'Minimal Menu',
        type: 'url',
        opts: {
          dotsOptions: { type: 'square', color: '#111827' },
          cornersSquareOptions: { type: 'square', color: '#111827' },
          backgroundOptions: { color: '#fafafa' }
        }
      },
      {
        id: 'social_hub',
        name: 'Social Hub',
        type: 'url',
        opts: {
          dotsOptions: { type: 'dot', color: '#8b5cf6' },
          cornersSquareOptions: { type: 'dot', color: '#6366f1' },
          backgroundOptions: { color: '#faf5ff' }
        }
      },
      {
        id: 'event_promo',
        name: 'Event Promo',
        type: 'event',
        opts: {
          dotsOptions: { type: 'classy', color: '#f97316' },
          cornersSquareOptions: { type: 'extra-rounded', color: '#ea580c' },
          backgroundOptions: { color: '#fff7ed' }
        }
      }
    ]);
  }

  // Export globally
  if (typeof window !== 'undefined') window.DYNAMIC_QR = DYNAMIC_QR;
  if (typeof globalThis !== 'undefined') globalThis.DYNAMIC_QR = DYNAMIC_QR;
  if (typeof module !== 'undefined' && module.exports) module.exports = DYNAMIC_QR;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
