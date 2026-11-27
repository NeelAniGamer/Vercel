/**
 * Traffic/progress-tracker.js
 * Single source of truth uniting Academy/Driving/Dashboard saves (`mth4`, `traffic_save`, `th-save`)
 * and bidirectional cross-device Supabase synchronization (progress, wallet, tokens, cosmetics, history).
 */
;(function (global) {
  'use strict'

  const PRIMARY_KEY = 'mth4'
  const MIRROR_KEYS = ['traffic_save', 'th-save']
  const DEFAULT_WALLET = 50000
  let syncInFlight = null
  let pendingSyncArgs = null

  function safeParse(raw) {
    if (!raw || typeof raw !== 'string') return null
    try {
      const v = JSON.parse(raw)
      return v && typeof v === 'object' ? v : null
    } catch (_e) {
      return null
    }
  }

  function toMs(isoOrMs) {
    if (typeof isoOrMs === 'number' && Number.isFinite(isoOrMs)) return isoOrMs
    if (!isoOrMs) return 0
    const parsed = Date.parse(isoOrMs)
    return Number.isFinite(parsed) ? parsed : 0
  }

  function rScoreOf(v) {
    if (v === true) return 1
    if (v && typeof v === 'object') return Number(v.score || (v.finalQuiz ? 1 : 0))
    return Number(v || 0)
  }

  function mergeCompMap(a, b) {
    const out = Object.assign({}, a || {})
    const right = b || {}
    Object.keys(right).forEach(function (k) {
      const rv = right[k]
      const lv = out[k]
      if (!lv) {
        out[k] = rv
      } else if (typeof rv === 'object' && typeof lv === 'object') {
        const lScore = Number(lv.score || 0)
        const rScore = Number(rv.score || 0)
        out[k] = {
          score: Math.max(lScore, rScore),
          finalQuiz: Boolean(lv.finalQuiz || rv.finalQuiz),
          completed: Boolean(lv.completed || rv.completed),
          vio: Math.min(lv.vio == null ? 99 : lv.vio, rv.vio == null ? 99 : rv.vio),
          time: Math.max(Number(lv.time || 0), Number(rv.time || 0)),
          modes: Object.assign({}, lv.modes || {}, rv.modes || {})
        }
      } else if (rScoreOf(rv) > rScoreOf(lv)) {
        out[k] = rv
      }
    })
    return out
  }

  function computeTotalXP(state, cloudStats) {
    const s = state || {}
    let sum = 0
    if (s.comp && typeof s.comp === 'object') {
      Object.keys(s.comp).forEach(function (k) {
        const entry = s.comp[k]
        if (entry && typeof entry === 'object') sum += Number(entry.score || 0)
        else if (typeof entry === 'number') sum += entry
      })
    }
    const candidates = [
      sum,
      Number(s.total || 0),
      Number(s.totalScore || 0),
      Number(s.xp || 0),
      cloudStats ? Number(cloudStats.total_score || 0) : 0,
      cloudStats ? Number(cloudStats.cert_score || 0) : 0
    ]
    return Math.max.apply(null, candidates)
  }

  function computeCompletedCount(state, cloudStats) {
    const comp = (state && state.comp) || {}
    const fromComp = Object.keys(comp).filter(function (k) {
      const v = comp[k]
      if (!v) return false
      if (v === true) return true
      return Number(v.score || 0) > 0 || Boolean(v.finalQuiz) || Boolean(v.completed)
    }).length
    return Math.max(fromComp, Number((cloudStats && cloudStats.modules_completed) || 0))
  }

  function readLocalState() {
    const rawList = [PRIMARY_KEY].concat(MIRROR_KEYS).map(function (k) {
      try {
        return safeParse(global.localStorage.getItem(k))
      } catch (_e) {
        return null
      }
    }).filter(Boolean)

    const merged = {
      comp: {},
      badges: [],
      total: 0,
      xp: 0,
      name: 'Driver',
      wallet: DEFAULT_WALLET,
      walletUpdatedAt: null,
      missionTokens: 0,
      tokensUpdatedAt: null,
      civicScore: 0,
      doubleXp: false,
      streakShield: 0,
      sylViewed: {},
      pledges: {},
      examRewarded: {},
      shopOwned: {},
      shopEquipped: { skin: null, horn: null, accessory: null, title: null },
      walletHistory: [],
      streak: { current: 0, best: 0, lastDate: null, freezes: 0 },
      settings: {}
    }

    let bestWalletTs = -1
    let bestTokensTs = -1

    rawList.forEach(function (item) {
      merged.comp = mergeCompMap(merged.comp, item.comp)
      if (item.started && typeof item.started === 'object') {
        merged.started = Object.assign({}, merged.started || {}, item.started)
      }
      if (Array.isArray(item.badges)) {
        merged.badges = Array.from(new Set(merged.badges.concat(item.badges)))
      }
      if (typeof item.wallet === 'number' && Number.isFinite(item.wallet)) {
        const wTs = toMs(item.walletUpdatedAt || item.updatedAt)
        if (wTs >= bestWalletTs) {
          bestWalletTs = wTs
          merged.wallet = Math.max(0, Math.round(item.wallet))
          merged.walletUpdatedAt = item.walletUpdatedAt || item.updatedAt || null
        }
      }
      if (typeof item.missionTokens === 'number' && Number.isFinite(item.missionTokens)) {
        const tTs = toMs(item.tokensUpdatedAt || item.updatedAt)
        if (tTs >= bestTokensTs) {
          bestTokensTs = tTs
          merged.missionTokens = Math.max(0, Math.round(item.missionTokens))
          merged.tokensUpdatedAt = item.tokensUpdatedAt || item.updatedAt || null
        }
      }
      if (item.civicScore) merged.civicScore = Math.max(merged.civicScore || 0, Number(item.civicScore || 0))
      if (item.doubleXp) merged.doubleXp = true
      if (item.streakShield) merged.streakShield = Math.max(merged.streakShield || 0, Number(item.streakShield || 0))
      if (item.sylViewed && typeof item.sylViewed === 'object') {
        Object.keys(item.sylViewed).forEach(function (lid) {
          const prev = Array.isArray(merged.sylViewed[lid]) ? merged.sylViewed[lid] : []
          const next = Array.isArray(item.sylViewed[lid]) ? item.sylViewed[lid] : []
          merged.sylViewed[lid] = Array.from(new Set(prev.concat(next)))
        })
      }
      if (item.pledges && typeof item.pledges === 'object') {
        merged.pledges = Object.assign({}, merged.pledges, item.pledges)
      }
      if (item.examRewarded && typeof item.examRewarded === 'object') {
        merged.examRewarded = Object.assign({}, merged.examRewarded, item.examRewarded)
      }
      if (item.shopOwned && typeof item.shopOwned === 'object') {
        merged.shopOwned = Object.assign({}, merged.shopOwned, item.shopOwned)
      }
      if (item.shopEquipped && typeof item.shopEquipped === 'object') {
        merged.shopEquipped = Object.assign({}, merged.shopEquipped, item.shopEquipped)
      }
      if (item.streak && typeof item.streak === 'object') {
        merged.streak = {
          current: Math.max(merged.streak.current || 0, Number(item.streak.current || 0)),
          best: Math.max(merged.streak.best || 0, Number(item.streak.best || 0)),
          lastDate: item.streak.lastDate || merged.streak.lastDate || null,
          freezes: Math.max(merged.streak.freezes || 0, Number(item.streak.freezes || 0))
        }
      }
      if (item.settings && typeof item.settings === 'object') {
        merged.settings = Object.assign({}, merged.settings, item.settings)
      }
      if (item.dailyBonusDate) merged.dailyBonusDate = item.dailyBonusDate
      if (item.lastLevelId != null) merged.lastLevelId = item.lastLevelId
      if (item.lastScreen) merged.lastScreen = item.lastScreen
      if (item.name && item.name !== 'Traffic Hero' && item.name !== 'Driver') merged.name = item.name
      if (item.username) merged.username = item.username
      if (item.vehicle) merged.vehicle = item.vehicle
      if (item.age) merged.age = item.age
      if (item.language) merged.language = item.language
      merged.total = Math.max(merged.total, Number(item.total || 0), computeTotalXP(merged))
      merged.xp = merged.total
    })

    if (global.WalletHistory && typeof global.WalletHistory.getAll === 'function') {
      merged.walletHistory = global.WalletHistory.getAll()
    }

    if (global.S && typeof global.S === 'object') {
      merged.comp = mergeCompMap(merged.comp, global.S.comp)
      merged.badges = Array.from(new Set(merged.badges.concat(global.S.badges || [])))
      if (typeof global.S.wallet === 'number' && Number.isFinite(global.S.wallet)) {
        const sTs = toMs(global.S.walletUpdatedAt)
        if (sTs >= bestWalletTs || bestWalletTs < 0) {
          merged.wallet = Math.max(0, Math.round(global.S.wallet))
          merged.walletUpdatedAt = global.S.walletUpdatedAt || merged.walletUpdatedAt
        }
      }
      if (typeof global.S.missionTokens === 'number' && Number.isFinite(global.S.missionTokens)) {
        const stTs = toMs(global.S.tokensUpdatedAt)
        if (stTs >= bestTokensTs || bestTokensTs < 0) {
          merged.missionTokens = Math.max(0, Math.round(global.S.missionTokens))
          merged.tokensUpdatedAt = global.S.tokensUpdatedAt || merged.tokensUpdatedAt
        }
      }
      if (global.S.shopOwned) merged.shopOwned = Object.assign({}, merged.shopOwned, global.S.shopOwned)
      if (global.S.shopEquipped) merged.shopEquipped = Object.assign({}, merged.shopEquipped, global.S.shopEquipped)
      if (global.S.examRewarded) merged.examRewarded = Object.assign({}, merged.examRewarded, global.S.examRewarded)
      merged.total = Math.max(merged.total, computeTotalXP(global.S), computeTotalXP(merged))
      merged.xp = merged.total
    }
    return merged
  }

  function writeLocalState(state) {
    if (!state || typeof state !== 'object') return state
    state.total = computeTotalXP(state)
    state.xp = state.total
    if (!Number.isFinite(state.wallet)) state.wallet = DEFAULT_WALLET
    else state.wallet = Math.max(0, Math.round(state.wallet))
    if (!Number.isFinite(state.missionTokens)) state.missionTokens = 0
    else state.missionTokens = Math.max(0, Math.round(state.missionTokens))
    state.updatedAt = new Date().toISOString()

    try {
      if (global.WalletHistory && Array.isArray(state.walletHistory)) {
        state.walletHistory = global.WalletHistory.mergeTransactions(state.walletHistory)
      }
      const json = JSON.stringify(state)
      global.localStorage.setItem(PRIMARY_KEY, json)
      MIRROR_KEYS.forEach(function (k) {
        global.localStorage.setItem(k, json)
      })
    } catch (_e) {}

    if (global.S && typeof global.S === 'object') {
      Object.assign(global.S, state)
    }
    try {
      global.dispatchEvent(new CustomEvent('col-progress-updated', { detail: { state: state } }))
    } catch (_ev) {}
    return state
  }

  async function syncWithCloud(client, userId) {
    if (!client || !userId) return readLocalState()
    if (syncInFlight) {
      pendingSyncArgs = { client: client, userId: userId }
      return syncInFlight
    }

    syncInFlight = (async function () {
      const local = readLocalState()
      try {
        if (client.auth && typeof client.auth.getSession === 'function') {
          const { data: sessionData } = await client.auth.getSession()
          const sessionUid = sessionData && sessionData.session && sessionData.session.user ? sessionData.session.user.id : null
          if (!sessionUid || sessionUid !== userId) return local
        }

        const [profileRes, gpRes, badgesRes, walletRes, certRes] = await Promise.all([
          client.from('user_profiles').select('display_name, username, avatar_url, preferred_vehicle, age, language, total_score, modules_completed, badges_count, player_state, updated_at').eq('user_id', userId).maybeSingle(),
          client.from('game_progress').select('level_id, score, completed_at, stars, completed').eq('user_id', userId),
          client.from('badges').select('badge_id').eq('user_id', userId),
          client.from('wallets').select('balance, updated_at').eq('user_id', userId).maybeSingle(),
          client.from('certificates').select('id, score, modules_completed, display_name').eq('user_id', userId).maybeSingle()
        ])

        const profile = (profileRes && profileRes.data) || null
        const gpRows = (gpRes && gpRes.data) || []
        const badgeRows = (badgesRes && badgesRes.data) || []
        const walletRow = (walletRes && walletRes.data) || null
        const certRow = (certRes && certRes.data) || null

        const cloudState = (profile && profile.player_state && typeof profile.player_state === 'object') ? profile.player_state : {}
        const merged = Object.assign({}, local)
        merged.comp = mergeCompMap(local.comp, cloudState.comp)
        if (cloudState.started && typeof cloudState.started === 'object') {
          merged.started = Object.assign({}, cloudState.started, merged.started || {})
        }
        if (merged.lastLevelId == null && cloudState.lastLevelId != null) merged.lastLevelId = cloudState.lastLevelId
        if (!merged.lastScreen && cloudState.lastScreen) merged.lastScreen = cloudState.lastScreen
        if (cloudState.civicScore) merged.civicScore = Math.max(Number(merged.civicScore || 0), Number(cloudState.civicScore || 0))
        if (cloudState.examRewarded && typeof cloudState.examRewarded === 'object') {
          merged.examRewarded = Object.assign({}, cloudState.examRewarded, merged.examRewarded || {})
        }
        if (cloudState.shopOwned && typeof cloudState.shopOwned === 'object') {
          merged.shopOwned = Object.assign({}, cloudState.shopOwned, merged.shopOwned || {})
        }
        if (!local.tokensUpdatedAt && cloudState.shopEquipped && typeof cloudState.shopEquipped === 'object') {
          merged.shopEquipped = Object.assign({}, cloudState.shopEquipped, merged.shopEquipped || {})
        }
        if (cloudState.dailyBonusDate && !merged.dailyBonusDate) {
          merged.dailyBonusDate = cloudState.dailyBonusDate
        }
        if (typeof cloudState.doubleXp === 'boolean' && !local.walletUpdatedAt) {
          merged.doubleXp = cloudState.doubleXp
        }
        if (cloudState.streakShield) {
          merged.streakShield = Math.max(Number(merged.streakShield || 0), Number(cloudState.streakShield || 0))
        }

        // Cross-device Wallet reconciliation: honor deductions & spends via latest timestamp;
        // if local has never modified wallet (untouched fresh device default), accept cloud wallet!
        const hasCloudWallet = (walletRow && typeof walletRow.balance === 'number' && Number.isFinite(walletRow.balance)) ||
          (typeof cloudState.wallet === 'number' && Number.isFinite(cloudState.wallet))
        const cloudWalletVal = walletRow && typeof walletRow.balance === 'number' && Number.isFinite(walletRow.balance)
          ? Math.max(0, Math.round(walletRow.balance))
          : (typeof cloudState.wallet === 'number' && Number.isFinite(cloudState.wallet) ? Math.max(0, Math.round(cloudState.wallet)) : null)

        const localWalletTs = toMs(local.walletUpdatedAt)
        const cloudWalletTs = Math.max(toMs(cloudState.walletUpdatedAt), toMs(walletRow && walletRow.updated_at))
        const localIsUntouchedDefault = localWalletTs === 0 && Number(local.wallet) === DEFAULT_WALLET && (!local.walletHistory || local.walletHistory.length === 0)

        if (hasCloudWallet && cloudWalletVal !== null) {
          if (localIsUntouchedDefault || cloudWalletTs > localWalletTs) {
            merged.wallet = cloudWalletVal
            merged.walletUpdatedAt = cloudState.walletUpdatedAt || (walletRow && walletRow.updated_at) || new Date().toISOString()
          }
        }

        // Cross-device Mission Tokens reconciliation (last-write-wins by tokensUpdatedAt; untouched 0 accepts cloud)
        if (typeof cloudState.missionTokens === 'number' && Number.isFinite(cloudState.missionTokens)) {
          const localTokTs = toMs(local.tokensUpdatedAt)
          const cloudTokTs = toMs(cloudState.tokensUpdatedAt)
          if ((localTokTs === 0 && (local.missionTokens || 0) === 0) || cloudTokTs > localTokTs) {
            merged.missionTokens = Math.max(0, Math.round(cloudState.missionTokens))
            merged.tokensUpdatedAt = cloudState.tokensUpdatedAt || merged.tokensUpdatedAt
          }
        }

        // Merge WalletHistory transactions across devices
        if (global.WalletHistory && Array.isArray(cloudState.walletHistory)) {
          merged.walletHistory = global.WalletHistory.mergeTransactions(cloudState.walletHistory)
        }

        gpRows.forEach(function (row) {
          const lid = String(row.level_id || '')
          if (!lid || lid.startsWith('s')) return
          const prev = merged.comp[lid] || {}
          merged.comp[lid] = {
            score: Math.max(Number(prev.score || 0), Number(row.score || 0)),
            completed: Boolean(prev.completed || row.completed),
            finalQuiz: Boolean(prev.finalQuiz || row.completed),
            time: Math.max(Number(prev.time || 0), new Date(row.completed_at || 0).getTime() || 0),
            modes: prev.modes || {}
          }
        })

        const cloudBadges = []
        if (Array.isArray(cloudState.badges)) cloudBadges.push.apply(cloudBadges, cloudState.badges)
        badgeRows.forEach(function (b) {
          if (b && b.badge_id) cloudBadges.push(b.badge_id)
        })
        merged.badges = Array.from(new Set((local.badges || []).concat(cloudBadges)))

        if (cloudState.sylViewed && typeof cloudState.sylViewed === 'object') {
          Object.keys(cloudState.sylViewed).forEach(function (lid) {
            const prev = Array.isArray(merged.sylViewed[lid]) ? merged.sylViewed[lid] : []
            const next = Array.isArray(cloudState.sylViewed[lid]) ? cloudState.sylViewed[lid] : []
            merged.sylViewed[lid] = Array.from(new Set(prev.concat(next)))
          })
        }
        if (cloudState.pledges) merged.pledges = Object.assign({}, cloudState.pledges, merged.pledges || {})
        if (cloudState.streak) {
          merged.streak = {
            current: Math.max(Number(merged.streak?.current || 0), Number(cloudState.streak.current || 0)),
            best: Math.max(Number(merged.streak?.best || 0), Number(cloudState.streak.best || 0)),
            lastDate: merged.streak?.lastDate || cloudState.streak.lastDate || null,
            freezes: Math.max(Number(merged.streak?.freezes || 0), Number(cloudState.streak.freezes || 0))
          }
        }
        if (cloudState.settings) merged.settings = Object.assign({}, cloudState.settings, merged.settings || {})
        if (profile) {
          if (profile.display_name) merged.name = profile.display_name
          if (profile.username) merged.username = profile.username
          if (profile.preferred_vehicle) merged.vehicle = profile.preferred_vehicle
          if (profile.age) merged.age = profile.age
          if (profile.language) merged.language = profile.language
        }

        const totalXP = computeTotalXP(merged, {
          total_score: profile ? profile.total_score : 0,
          cert_score: certRow ? certRow.score : 0
        })
        const completedCount = computeCompletedCount(merged, {
          modules_completed: Math.max(
            Number((profile && profile.modules_completed) || 0),
            Number((certRow && certRow.modules_completed) || 0)
          )
        })

        merged.total = totalXP
        merged.xp = totalXP
        merged.modulesCompleted = completedCount
        writeLocalState(merged)

        const upPayload = {
          user_id: userId,
          total_score: totalXP,
          modules_completed: completedCount,
          badges_count: merged.badges.length,
          player_state: {
            comp: merged.comp,
            started: merged.started || {},
            badges: merged.badges,
            sylViewed: merged.sylViewed,
            pledges: merged.pledges,
            streak: merged.streak,
            civicScore: merged.civicScore || 0,
            wallet: merged.wallet,
            walletUpdatedAt: merged.walletUpdatedAt || null,
            missionTokens: merged.missionTokens || 0,
            tokensUpdatedAt: merged.tokensUpdatedAt || null,
            doubleXp: Boolean(merged.doubleXp),
            streakShield: Number(merged.streakShield || 0),
            dailyBonusDate: merged.dailyBonusDate || null,
            examRewarded: merged.examRewarded || {},
            shopOwned: merged.shopOwned || {},
            shopEquipped: merged.shopEquipped || {},
            walletHistory: (merged.walletHistory || []).slice(-60),
            lastLevelId: merged.lastLevelId || null,
            lastScreen: merged.lastScreen || null,
            settings: merged.settings
          },
          updated_at: new Date().toISOString()
        }
        await client.from('user_profiles').upsert(upPayload, { onConflict: 'user_id' })

        const existingGpIds = new Set(gpRows.map(function (r) { return String(r.level_id) }))
        const gpUpserts = []
        Object.keys(merged.comp || {}).forEach(function (lid) {
          const entry = merged.comp[lid]
          if (!entry) return
          const score = Number(entry.score || 0)
          const done = Boolean(entry.completed || entry.finalQuiz || score > 0)
          if (!done) return
          const prevRow = existingGpIds.has(String(lid)) ? gpRows.find(function (r) { return String(r.level_id) === String(lid) }) : null
          if (!prevRow || Number(prevRow.score || 0) < score || !prevRow.completed) {
            gpUpserts.push({
              user_id: userId,
              level_id: String(lid),
              score: score,
              completed: true,
              completed_at: new Date(entry.time || Date.now()).toISOString(),
              total_score: totalXP,
              modules_completed: completedCount
            })
          }
        })
        if (gpUpserts.length > 0) {
          await client.from('game_progress').upsert(gpUpserts, { onConflict: 'user_id,level_id' }).catch(function () {})
        }

        if (typeof merged.wallet === 'number' && Number.isFinite(merged.wallet) && merged.wallet >= 0) {
          await client.from('wallets').upsert({
            user_id: userId,
            balance: Math.round(merged.wallet),
            updated_at: merged.walletUpdatedAt || new Date().toISOString()
          }, { onConflict: 'user_id' }).catch(function () {})
        }

        const existingBadgeIds = new Set(badgeRows.map(function (b) { return b && b.badge_id }).filter(Boolean))
        const missingBadges = (merged.badges || []).filter(function (bid) { return bid && !existingBadgeIds.has(bid) })
        if (missingBadges.length > 0) {
          await client.from('badges').insert(missingBadges.map(function (bid) {
            return { user_id: userId, badge_id: bid }
          })).catch(function () {})
        }

        return merged
      } catch (err) {
        console.warn('[ProgressTracker] Cloud sync error:', err)
        return local
      } finally {
        syncInFlight = null
        if (pendingSyncArgs) {
          const next = pendingSyncArgs
          pendingSyncArgs = null
          syncWithCloud(next.client, next.userId)
        }
      }
    })()

    return syncInFlight
  }

  function updateSettings(nextSettings) {
    const s = readLocalState()
    s.settings = Object.assign({}, s.settings || {}, nextSettings || {})
    if (nextSettings && nextSettings.vehicle) s.vehicle = nextSettings.vehicle
    if (nextSettings && nextSettings.language) s.language = nextSettings.language
    if (nextSettings && nextSettings.age) s.age = nextSettings.age
    if (nextSettings && nextSettings.displayName) s.name = nextSettings.displayName
    return writeLocalState(s)
  }

  function getNextRecommendedLevel(levels, state) {
    const list = Array.isArray(levels) ? levels : []
    const s = state || readLocalState()
    const comp = s.comp || {}
    const numbered = list.filter(function (l) { return typeof l.id === 'number' && l.id < 90 })
    const inProgress = numbered.find(function (l) {
      const done = comp[l.id] && (comp[l.id].score > 0 || comp[l.id].finalQuiz || comp[l.id].completed)
      const viewed = s.sylViewed && Array.isArray(s.sylViewed[l.id]) && s.sylViewed[l.id].length > 0
      return !done && viewed
    })
    if (inProgress) return { level: inProgress, reason: 'Continue where you left off' }
    const nextUnfinished = numbered.find(function (l) {
      const done = comp[l.id] && (comp[l.id].score > 0 || comp[l.id].finalQuiz || comp[l.id].completed)
      return !done
    })
    if (nextUnfinished) return { level: nextUnfinished, reason: 'Recommended next lesson' }
    const freeRoam = list.find(function (l) { return l.id === 99 }) || list[0]
    return freeRoam ? { level: freeRoam, reason: 'All core lessons complete — Free Roam' } : null
  }

  function formatLeaderboardPercentile(rank, totalPlayers) {
    const r = Number(rank || 0)
    const n = Number(totalPlayers || 0)
    if (!r || !n) return 'Unranked'
    if (r === 1) return '#1 Overall'
    const pct = Math.max(1, Math.min(99, Math.round((r / n) * 100)))
    return 'Top ' + pct + '%'
  }

  global.ProgressTracker = {
    readLocalState,
    writeLocalState,
    syncWithCloud,
    updateSettings,
    computeTotalXP,
    computeCompletedCount,
    getNextRecommendedLevel,
    formatLeaderboardPercentile
  }
})(typeof window !== 'undefined' ? window : globalThis)
