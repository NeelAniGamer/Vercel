import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'

const TRAFFIC_ROOT = path.resolve(__dirname, '..')

function createMockWindow() {
  const store = new Map<string, string>()
  const events: string[] = []
  const mockLocalStorage = {
    getItem(k: string) {
      return store.has(k) ? store.get(k)! : null
    },
    setItem(k: string, v: string) {
      store.set(k, String(v))
    },
    removeItem(k: string) {
      store.delete(k)
    },
  }
  const win: Record<string, any> = {
    localStorage: mockLocalStorage,
    dispatchEvent(ev: { type?: string }) {
      if (ev && ev.type) events.push(ev.type)
    },
    CustomEvent: class CustomEvent {
      type: string
      detail: any
      constructor(type: string, init?: { detail?: any }) {
        this.type = type
        this.detail = init?.detail
      }
    },
    URL,
    events,
  }
  win.window = win
  win.globalThis = win
  return win
}

function loadScriptInto(win: Record<string, any>, relPath: string) {
  const code = fs.readFileSync(path.join(TRAFFIC_ROOT, relPath), 'utf8')
  vm.runInNewContext(code, win, { filename: relPath })
  return win
}

describe('Academy & Dashboard Contracts', () => {
  it('locks ColDbConfig to the CoL database and purges any legacy custom DB override', () => {
    const win = createMockWindow()
    win.localStorage.setItem('col_custom_db', JSON.stringify({ url: 'https://evil.supabase.co', anonKey: 'x'.repeat(40) }))
    loadScriptInto(win, 'db-config.js')
    const cfg = win.ColDbConfig

    expect(Object.isFrozen(cfg)).toBe(true)
    expect((cfg as any).setCustomConfig).toBeUndefined()
    expect((cfg as any).readCustomConfig).toBeUndefined()
    expect(win.localStorage.getItem('col_custom_db')).toBeNull()

    const active = cfg.getConfigSync()
    expect(active.url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i)
    expect(active.isCustom).toBe(false)
  })

  it('hardens auth and blocks adminUnlock / offline OTP / Private Database bypasses', () => {
    const colAuth = fs.readFileSync(path.resolve(TRAFFIC_ROOT, '..', 'col-auth.js'), 'utf8')
    expect(colAuth).not.toMatch(/['"]123456['"]|['"]000000['"]|['"]777777['"]/)
    expect(colAuth).not.toMatch(/_setColOtpStateForTesting|triggerTestOtpAnimation|colAuthGenerateCode|createLocalCredential/)
    expect(colAuth).toContain("flowType: 'pkce'")
    expect(colAuth).toContain('BroadcastChannel')
    expect(colAuth).toContain('scrubAuthParamsFromUrl')
    expect(colAuth).toContain('evaluatePasswordStrength')
    expect(colAuth).toContain('OTP_RESEND_SECONDS')
    expect(colAuth).toContain('col_auth_return_to')
    expect(colAuth).toContain('resetPasswordForEmail')
    expect(colAuth).toContain('PASSWORD_RECOVERY')
    expect(colAuth).toContain('autocomplete="username"')
    expect(colAuth).toContain('current-password')
    expect(colAuth).toContain('autocomplete="new-password"')

    const settingsJs = fs.readFileSync(path.join(TRAFFIC_ROOT, 'settings-modal.js'), 'utf8')
    expect(settingsJs).not.toMatch(/Private Database|db_url|db_key/i)

    const uiJs = fs.readFileSync(path.join(TRAFFIC_ROOT, 'ui.js'), 'utf8')
    expect(uiJs).toContain('_syncUrl')
    expect(uiJs).toContain('popstate')
    expect(uiJs).toMatch(/adminUnlock\(\)\s*\{[^}]*return false\s*\}/)
  })

  it('merges mth4 / traffic_save / th-save progress and fixes Top 0% leaderboard percentile bug', () => {
    const win = createMockWindow()
    loadScriptInto(win, 'progress-tracker.js')
    const pt = win.ProgressTracker

    win.localStorage.setItem('mth4', JSON.stringify({
      comp: { 1: { score: 120, completed: true, time: 100 } },
      badges: ['first_drive'],
      wallet: 48000,
    }))
    win.localStorage.setItem('th-save', JSON.stringify({
      comp: { 1: { score: 150, completed: true, time: 200 }, 2: { score: 100, completed: true, time: 300 } },
      badges: ['parking_pro'],
    }))

    const state = pt.readLocalState()
    expect(state.comp['1'].score).toBe(150)
    expect(state.comp['2'].score).toBe(100)
    expect(state.badges).toEqual(['first_drive', 'parking_pro'])
    expect(pt.computeTotalXP(state)).toBeGreaterThanOrEqual(250)
    expect(pt.computeCompletedCount(state)).toBe(2)

    expect(pt.formatLeaderboardPercentile(1, 50)).toBe('#1 Overall')
    expect(pt.formatLeaderboardPercentile(1, 1)).toBe('#1 Overall')
    expect(pt.formatLeaderboardPercentile(5, 100)).toBe('Top 5%')
    expect(pt.formatLeaderboardPercentile(0, 10)).toBe('Unranked')
  })

  it('generates distinct per-level 2D scenario configurations across all catalog levels', () => {
    const win = createMockWindow()
    loadScriptInto(win, 'level-catalog.js')
    loadScriptInto(win, 'scenario-presets.js')

    const levels: any[] = win.LEVEL_CATALOG.levels
    expect(levels.length).toBeGreaterThanOrEqual(54)

    const seenUniqueKeys = new Set<string>()
    const seenConditionTexts = new Set<string>()
    for (const lv of levels) {
      const preset = win.TrafficScenarioPresets.forLevel(lv)
      expect(preset.uniqueKey).toBeTruthy()
      expect(preset.location).toBeTruthy()
      expect(Array.isArray(preset.options)).toBe(true)
      expect(preset.options.some((o: any) => o.correct === true)).toBe(true)
      seenUniqueKeys.add(preset.uniqueKey)
      seenConditionTexts.add(preset.conditionText)
    }
    expect(seenUniqueKeys.size).toBe(levels.length)
    expect(seenConditionTexts.size).toBeGreaterThan(30)
  })

  it('removes TrafficSetup.html and eliminates inline CSP event handlers on Academy and Dashboard', () => {
    expect(fs.existsSync(path.join(TRAFFIC_ROOT, 'TrafficSetup.html'))).toBe(false)

    for (const htmlName of ['Academy.html', 'TrafficDashboard.html']) {
      const html = fs.readFileSync(path.join(TRAFFIC_ROOT, htmlName), 'utf8')
      expect(html).not.toMatch(/on(?:click|input|change|keyup|keypress|mouseover|mouseout|error|load)=/i)
      expect(html).not.toMatch(/TrafficSetup\.html/i)
    }
  })

  it('separates INR wallet from Mission Tokens and syncs fined/zero wallets accurately across devices', async () => {
    const win = createMockWindow()
    win.S = { wallet: 0, missionTokens: 120 }
    loadScriptInto(win, 'wallet-history.js')
    loadScriptInto(win, 'progress-tracker.js')

    const wh = win.WalletHistory
    const tx1 = wh.earn('level_reward', 2000)
    expect(tx1.balance).toBe(0)
    wh.deduct('fine', 500)
    wh.earnTokens('mission_token', 50)
    wh.spendTokens('shop_purchase', 30)

    const summary = wh.getSummary()
    expect(summary.totalEarned).toBe(2000)
    expect(summary.totalDeducted).toBe(500)
    expect(summary.net).toBe(1500)
    expect(summary.tokensEarned).toBe(50)
    expect(summary.tokensSpent).toBe(30)
    expect(summary.netTokens).toBe(20)

    // Untouched fresh device (default 50000 local) adopts lower fined cloud balance (42000)
    const freshWin = createMockWindow()
    loadScriptInto(freshWin, 'wallet-history.js')
    loadScriptInto(freshWin, 'progress-tracker.js')
    const mockClient = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'u-1' } } } }) },
      from(table: string) {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          upsert: async () => ({ error: null }),
          insert: async () => ({ error: null }),
          maybeSingle: async () => {
            if (table === 'wallets') return { data: { balance: 42000, updated_at: '2026-11-27T08:00:00Z' } }
            if (table === 'user_profiles') {
              return {
                data: {
                  total_score: 900,
                  modules_completed: 2,
                  player_state: { wallet: 42000, walletUpdatedAt: '2026-11-27T08:00:00Z', missionTokens: 75, tokensUpdatedAt: '2026-11-27T08:00:00Z', doubleXp: true }
                }
              }
            }
            return { data: null }
          },
          then: (res: any) => Promise.resolve({ data: [] }).then(res)
        }
        return chain
      }
    }
    const merged = await freshWin.ProgressTracker.syncWithCloud(mockClient, 'u-1')
    expect(merged.wallet).toBe(42000)
    expect(merged.missionTokens).toBe(75)
    expect(merged.doubleXp).toBe(true)

    // Ensure tokens are never passed to INR wallets RPC
    const mm = fs.readFileSync(path.join(TRAFFIC_ROOT, 'mission-manager.js'), 'utf8')
    expect(mm).not.toContain("_syncWalletToSupabase(tokens, 'earn', 'mission_token')")
    const uiJs = fs.readFileSync(path.join(TRAFFIC_ROOT, 'ui.js'), 'utf8')
    expect(uiJs).not.toContain('_syncWalletToSupabase(-item.price')
    expect(uiJs).toContain("reward.type === 'double_xp'")
    const dashHtml = fs.readFileSync(path.join(TRAFFIC_ROOT, 'TrafficDashboard.html'), 'utf8')
    expect(dashHtml).toContain('wallet-history.js')
    expect(dashHtml).toContain('dash-wallet-ledger')
  })
})
