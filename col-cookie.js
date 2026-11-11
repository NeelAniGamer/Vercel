/**
 * Class Of Learners (CoL) Universal Cookie & User Data Management Module
 * Enables safe, client-side cookie persistence for visual preferences,
 * user identity hints, session resilience, and learning bookmarks.
 * Synchronizes seamlessly with localStorage for hybrid reliability.
 */
;(function (global) {
  'use strict'

  if (global.ColCookie && global.ColUserData) {
    return
  }

  var ColCookie = {
    /**
     * Set a cookie with safe defaults (SameSite=Lax, Path=/, optional Secure).
     * @param {string} name
     * @param {any} value
     * @param {number} [days=365] - Expiration in days
     * @param {object} [options] - Additional cookie options
     */
    set: function (name, value, days, options) {
      if (!name) return false
      options = options || {}
      var d = typeof days === 'number' ? days : 365
      var expires = ''
      if (d !== 0) {
        var date = new Date()
        date.setTime(date.getTime() + (d * 24 * 60 * 60 * 1000))
        expires = '; expires=' + date.toUTCString()
      }
      var isSecure = (options.secure !== undefined ? options.secure : (location.protocol === 'https:')) ? '; Secure' : ''
      var sameSite = options.sameSite ? '; SameSite=' + options.sameSite : '; SameSite=Lax'
      var path = options.path ? '; path=' + options.path : '; path=/'

      var rawVal
      try {
        rawVal = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
      } catch (e) {
        rawVal = String(value)
      }

      var cookieStr = encodeURIComponent(name) + '=' + encodeURIComponent(rawVal) + expires + path + sameSite + isSecure
      try {
        document.cookie = cookieStr
        // Mirror to localStorage as resilient secondary backing
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('col_ck_' + name, rawVal)
          }
        } catch (_ls) {}
        return true
      } catch (e) {
        // Fallback to localStorage if cookies are blocked
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('col_ck_' + name, rawVal)
            return true
          }
        } catch (_err) {}
        return false
      }
    },

    /**
     * Retrieve a cookie by name. Parses JSON automatically if applicable.
     * @param {string} name
     * @param {any} [fallback=null]
     * @returns {any}
     */
    get: function (name, fallback) {
      if (fallback === undefined) fallback = null
      if (!name) return fallback
      try {
        var prefix = encodeURIComponent(name) + '='
        var cookies = (document.cookie || '').split(';')
        for (var i = 0; i < cookies.length; i++) {
          var c = cookies[i].trim()
          if (c.indexOf(prefix) === 0) {
            var raw = decodeURIComponent(c.substring(prefix.length))
            try {
              return JSON.parse(raw)
            } catch (_) {
              return raw
            }
          }
        }
      } catch (e) {}

      // Fallback check in mirrored localStorage
      try {
        if (typeof localStorage !== 'undefined') {
          var lsVal = localStorage.getItem('col_ck_' + name)
          if (lsVal !== null) {
            try {
              return JSON.parse(lsVal)
            } catch (_) {
              return lsVal
            }
          }
        }
      } catch (_ls) {}

      return fallback
    },

    /**
     * Check if a cookie exists.
     * @param {string} name
     * @returns {boolean}
     */
    has: function (name) {
      return this.get(name) !== null
    },

    /**
     * Remove a cookie by expiring it in the past.
     * @param {string} name
     * @param {string} [path='/']
     */
    remove: function (name, path) {
      if (!name) return
      path = path || '/'
      try {
        document.cookie = encodeURIComponent(name) + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=' + path + '; SameSite=Lax'
      } catch (e) {}
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('col_ck_' + name)
        }
      } catch (_ls) {}
    },

    /**
     * Return all available cookies as a key-value dictionary.
     * @returns {object}
     */
    getAll: function () {
      var map = {}
      try {
        var cookies = (document.cookie || '').split(';')
        for (var i = 0; i < cookies.length; i++) {
          var c = cookies[i].trim()
          if (!c) continue
          var eq = c.indexOf('=')
          if (eq > 0) {
            var k = decodeURIComponent(c.substring(0, eq))
            var v = decodeURIComponent(c.substring(eq + 1))
            try {
              map[k] = JSON.parse(v)
            } catch (_) {
              map[k] = v
            }
          }
        }
      } catch (e) {}
      return map
    }
  }

  var ColUserData = {
    /**
     * Get the current active user profile (verified online or local guest).
     * @returns {object|null}
     */
    getUser: function () {
      var online = ColCookie.get('col_user')
      if (online && (online.name || online.username || online.email)) return online
      var local = ColCookie.get('col_local_user')
      if (local && (local.name || local.username)) return local
      // Fallback to localStorage active accounts
      try {
        if (typeof localStorage !== 'undefined') {
          var raw = localStorage.getItem('col_active_local_user') || localStorage.getItem('traffic_local_user')
          if (raw) return JSON.parse(raw)
        }
      } catch (e) {}
      return null
    },

    /**
     * Save online user profile details into cookie and local backup.
     * Sanitizes to strictly safe fields (no auth tokens, passwords, or secrets).
     * @param {object} user
     */
    setUser: function (user) {
      if (!user) return
      var safe = {
        id: user.id || null,
        name: user.name || user.full_name || user.displayName || 'Learner',
        username: user.username || null,
        email: user.email ? String(user.email).toLowerCase() : null,
        picture: user.picture || user.avatar_url || null,
        role: user.role || 'learner',
        lastActive: Date.now()
      }
      ColCookie.set('col_user', safe, 365)
      ColCookie.set('col_user_hint', safe.name, 365)
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('col_user', JSON.stringify(safe))
        }
      } catch (e) {}
    },

    /**
     * Save local/offline user account details.
     * @param {object} localUser
     */
    setLocalUser: function (localUser) {
      if (!localUser) return
      var safe = {
        id: localUser.id || ('local_' + Date.now()),
        name: localUser.name || localUser.username || 'Guest Learner',
        username: localUser.username || null,
        vehicle: localUser.vehicle || 'Car',
        age: localUser.age || 18,
        language: localUser.language || 'en',
        picture: localUser.picture || null,
        isLocal: true,
        lastActive: Date.now()
      }
      ColCookie.set('col_local_user', safe, 365)
    },

    /**
     * Clear user identity cookies on sign-out.
     */
    clearUser: function () {
      ColCookie.remove('col_user')
      ColCookie.remove('col_user_hint')
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('col_user')
        }
      } catch (e) {}
    },

    /**
     * Clear local user profile.
     */
    clearLocalUser: function () {
      ColCookie.remove('col_local_user')
    },

    /**
     * Get a specific user UI preference from 'col_prefs' cookie.
     * @param {string} key
     * @param {any} [defaultVal=null]
     */
    getPref: function (key, defaultVal) {
      if (defaultVal === undefined) defaultVal = null
      var prefs = ColCookie.get('col_prefs') || {}
      if (typeof prefs === 'object' && prefs !== null && key in prefs) {
        return prefs[key]
      }
      var single = ColCookie.get('col_pref_' + key)
      if (single !== null) return single
      try {
        if (typeof localStorage !== 'undefined') {
          var ls = localStorage.getItem('col_pref_' + key)
          if (ls !== null) return ls
        }
      } catch (e) {}
      return defaultVal
    },

    /**
     * Set a user preference in 'col_prefs' cookie.
     * @param {string} key
     * @param {any} value
     */
    setPref: function (key, value) {
      if (!key) return
      var prefs = ColCookie.get('col_prefs') || {}
      if (typeof prefs !== 'object' || prefs === null) prefs = {}
      prefs[key] = value
      ColCookie.set('col_prefs', prefs, 365)
      ColCookie.set('col_pref_' + key, value, 365)
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('col_pref_' + key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        }
      } catch (e) {}
    },

    /**
     * Return all user preferences.
     */
    getAllPrefs: function () {
      var prefs = ColCookie.get('col_prefs') || {}
      return typeof prefs === 'object' && prefs !== null ? prefs : {}
    },

    /**
     * Record current page visit in a lightweight cookie so user can resume learning.
     */
    recordVisit: function () {
      try {
        var path = window.location.pathname || '/'
        var title = document.title || 'Class Of Learners'
        if (path.indexOf('login') !== -1 || path.indexOf('404') !== -1) return
        var info = {
          path: path,
          title: title.split('—')[0].split('|')[0].trim(),
          time: Date.now()
        }
        ColCookie.set('col_last_visit', info, 30)
      } catch (e) {}
    },

    /**
     * Get details on the user's last visited tool/page.
     */
    getLastVisit: function () {
      return ColCookie.get('col_last_visit', null)
    },

    /**
     * Export all user preferences and profile data for portability.
     * @returns {string} JSON string
     */
    exportData: function () {
      var data = {
        exportedAt: new Date().toISOString(),
        user: this.getUser(),
        theme: ColCookie.get('theme') || 'dark',
        preferences: this.getAllPrefs(),
        lastVisit: this.getLastVisit()
      }
      return JSON.stringify(data, null, 2)
    },

    /**
     * Import user settings from a JSON string or object.
     * @param {string|object} source
     */
    importData: function (source) {
      try {
        var data = typeof source === 'string' ? JSON.parse(source) : source
        if (!data || typeof data !== 'object') return false
        if (data.theme) {
          ColCookie.set('theme', data.theme, 365)
          if (typeof window.safeThemeSet === 'function') {
            window.safeThemeSet(data.theme)
          }
        }
        if (data.preferences && typeof data.preferences === 'object') {
          for (var k in data.preferences) {
            if (Object.prototype.hasOwnProperty.call(data.preferences, k)) {
              this.setPref(k, data.preferences[k])
            }
          }
        }
        if (data.user && typeof data.user === 'object') {
          this.setUser(data.user)
        }
        return true
      } catch (e) {
        console.warn('[ColUserData] Import failed:', e)
        return false
      }
    },

    /**
     * Wipe all user cookies and preferences cleanly.
     */
    clearAllData: function () {
      ColCookie.remove('theme')
      ColCookie.remove('col_user')
      ColCookie.remove('col_user_hint')
      ColCookie.remove('col_local_user')
      ColCookie.remove('col_prefs')
      ColCookie.remove('col_last_visit')
      ColCookie.remove('liquid_glass')
      ColCookie.remove('force_iphone')
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('col_user')
          localStorage.removeItem('col_active_local_user')
          localStorage.removeItem('traffic_local_user')
        }
      } catch (e) {}
    }
  }

  // Expose globally
  global.ColCookie = ColCookie
  global.ColUserData = ColUserData
  global.ColStorage = ColCookie // Developer-friendly alias
})(typeof window !== 'undefined' ? window : this)
