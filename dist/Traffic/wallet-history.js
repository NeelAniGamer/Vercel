/**
 * Traffic/wallet-history.js
 * Ledger tracking Career Wallet (INR) and Mission Token transactions cleanly,
 * with cross-device merge and summary helpers.
 */
;(function (global) {
  'use strict'

  const WalletHistory = {
    MAX_TRANSACTIONS: 100,
    STORAGE_KEY: 'mth4_wallet_history',

    _normalizeTx(raw) {
      if (!raw || typeof raw !== 'object') return null
      const type = String(raw.type || 'earn')
      const currency = raw.currency === 'TOKENS' || type === 'token_earn' || type === 'token_spend' ? 'TOKENS' : 'INR'
      return {
        id: String(raw.id || Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
        type: type,
        currency: currency,
        category: String(raw.category || 'other'),
        amount: Math.max(0, Math.round(Math.abs(Number(raw.amount || 0)))),
        balance: Number.isFinite(raw.balance) ? Number(raw.balance) : 0,
        meta: raw.meta && typeof raw.meta === 'object' ? raw.meta : {},
        timestamp: Number(raw.timestamp) || Date.now()
      }
    },

    getAll() {
      try {
        const raw = global.localStorage.getItem(this.STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.map((t) => this._normalizeTx(t)).filter(Boolean)
      } catch (_e) {
        return []
      }
    },

    _save(transactions) {
      try {
        const clean = (Array.isArray(transactions) ? transactions : [])
          .map((t) => this._normalizeTx(t))
          .filter(Boolean)
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-this.MAX_TRANSACTIONS)
        global.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(clean))
        if (global.S && typeof global.S === 'object') {
          global.S.walletHistory = clean
        }
        return clean
      } catch (_e) {
        return []
      }
    },

    replaceAll(transactions) {
      return this._save(transactions)
    },

    mergeTransactions(remoteList) {
      const merged = new Map()
      this.getAll().forEach((tx) => merged.set(tx.id, tx))
      ;(Array.isArray(remoteList) ? remoteList : []).forEach((raw) => {
        const tx = this._normalizeTx(raw)
        if (tx && !merged.has(tx.id)) merged.set(tx.id, tx)
      })
      return this._save(Array.from(merged.values()))
    },

    log(type, category, amount, meta = {}) {
      const amt = Math.max(0, Math.round(Math.abs(Number(amount || 0))))
      if (amt === 0) return null
      const isTokens = type === 'token_earn' || type === 'token_spend' || (meta && meta.currency === 'TOKENS')
      const bal = isTokens
        ? (global.S && Number.isFinite(global.S.missionTokens) ? Number(global.S.missionTokens) : 0)
        : (global.S && Number.isFinite(global.S.wallet) ? Number(global.S.wallet) : 0)

      const tx = this._normalizeTx({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        type: type,
        currency: isTokens ? 'TOKENS' : 'INR',
        category: category,
        amount: amt,
        balance: bal,
        meta: meta,
        timestamp: Date.now()
      })
      const transactions = this.getAll()
      transactions.push(tx)
      this._save(transactions)
      return tx
    },

    earn(category, amount, meta = {}) {
      return this.log('earn', category, amount, meta)
    },

    deduct(category, amount, meta = {}) {
      return this.log('deduct', category, amount, meta)
    },

    earnTokens(category, amount, meta = {}) {
      return this.log('token_earn', category || 'mission_token', amount, Object.assign({}, meta, { currency: 'TOKENS' }))
    },

    spendTokens(category, amount, meta = {}) {
      return this.log('token_spend', category || 'shop_purchase', amount, Object.assign({}, meta, { currency: 'TOKENS' }))
    },

    getByType(type) {
      return this.getAll().filter((tx) => tx.type === type)
    },

    getByCategory(category) {
      return this.getAll().filter((tx) => tx.category === category)
    },

    getSummary() {
      const all = this.getAll()
      let totalEarned = 0
      let totalDeducted = 0
      let tokensEarned = 0
      let tokensSpent = 0
      const byCategory = {}

      all.forEach((tx) => {
        if (!byCategory[tx.category]) {
          byCategory[tx.category] = { earned: 0, deducted: 0, tokensEarned: 0, tokensSpent: 0, count: 0 }
        }
        if (tx.currency === 'TOKENS') {
          if (tx.type === 'token_earn') {
            tokensEarned += tx.amount
            byCategory[tx.category].tokensEarned += tx.amount
          } else {
            tokensSpent += tx.amount
            byCategory[tx.category].tokensSpent += tx.amount
          }
        } else if (tx.type === 'earn') {
          totalEarned += tx.amount
          byCategory[tx.category].earned += tx.amount
        } else {
          totalDeducted += tx.amount
          byCategory[tx.category].deducted += tx.amount
        }
        byCategory[tx.category].count++
      })

      return {
        totalEarned,
        totalDeducted,
        net: totalEarned - totalDeducted,
        tokensEarned,
        tokensSpent,
        netTokens: tokensEarned - tokensSpent,
        byCategory,
        count: all.length
      }
    },

    formatAmount(amount, currency) {
      const n = Math.max(0, Math.round(Number(amount || 0)))
      if (currency === 'TOKENS') return n.toLocaleString('en-IN') + ' Tokens'
      return '₹' + n.toLocaleString('en-IN')
    },

    formatTime(ts) {
      const diff = Date.now() - ts
      const mins = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      if (mins < 1) return 'Just now'
      if (mins < 60) return mins + 'm ago'
      if (hours < 24) return hours + 'h ago'
      if (days < 7) return days + 'd ago'
      return new Date(ts).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    },

    getCategoryInfo(category) {
      const map = {
        level_reward: { icon: 'trophy', label: 'Driving Level Reward' },
        quiz_reward: { icon: 'book', label: 'Academy Exam Bounty' },
        campaign_reward: { icon: 'medal', label: 'Campaign Reward' },
        daily_bonus: { icon: 'flame', label: 'Daily Streak Bonus' },
        mystery_reward: { icon: 'sparkles', label: 'Mystery Cash Bonus' },
        collectible: { icon: 'sparkles', label: 'Road Collectibles' },
        fine: { icon: 'scale', label: 'Traffic Challan Fine' },
        mission_token: { icon: 'target', label: 'Mission Tokens Earned' },
        shop_purchase: { icon: 'wallet', label: 'Token Shop Purchase' },
        starting_balance: { icon: 'wallet', label: 'Starting Balance' },
        other: { icon: 'wallet', label: 'Transaction' }
      }
      return map[category] || map.other
    }
  }

  global.WalletHistory = WalletHistory
})(typeof window !== 'undefined' ? window : globalThis)
