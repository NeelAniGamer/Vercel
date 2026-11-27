/**
 * Traffic/db-config.js
 * Resolves Class Of Learners' canonical Supabase project configuration (read-only).
 * Users never supply custom database URLs or keys; all accounts and progress sync
 * exclusively through our isolated project database protected by per-user RLS.
 */
;(function (global) {
  'use strict'

  const DEFAULT_CONFIG = Object.freeze({
    url: 'https://hvukxajztizsuhfubjws.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWt4YWp6dGl6c3VoZnViandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mzc1MTAsImV4cCI6MjA5NjQxMzUxMH0.KqQRkmhuB_rFlzQ2N3NhSQrftmVZgGE3NUuVHYh3aYE',
    isCustom: false
  })

  // Purge any legacy user-entered custom database override on load
  try {
    if (global.localStorage && global.localStorage.getItem('col_custom_db')) {
      global.localStorage.removeItem('col_custom_db')
    }
  } catch (_e) {}

  async function loadConfig() {
    try {
      if (typeof fetch === 'function') {
        global.__colConfigPromise =
          global.__colConfigPromise ||
          fetch('/config.json', {
            signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
          })
            .then((r) => (r && r.ok ? r.json() : null))
            .catch(() => null)
        const cfg = await global.__colConfigPromise
        if (cfg && cfg.auth && cfg.auth.url && cfg.auth.key) {
          return Object.freeze({ url: cfg.auth.url, key: cfg.auth.key, isCustom: false })
        }
      }
    } catch (_e) {}
    return DEFAULT_CONFIG
  }

  function getConfigSync() {
    return DEFAULT_CONFIG
  }

  global.ColDbConfig = Object.freeze({
    loadConfig,
    getConfigSync
  })
})(typeof window !== 'undefined' ? window : globalThis)
