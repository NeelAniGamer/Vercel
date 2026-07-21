// ────────────────────────────────────────────────────────
//  ProgressManager.ts — typed state manager
//  Replaces the global `S` object from course.js/ui.js
// ────────────────────────────────────────────────────────

/** Per-level completion record */
export interface LevelCompletion {
  score?: number;
  time?: number;
  finalQuiz?: boolean;
  modes?: Record<string, boolean>;
}

/** Full persisted game state */
export interface GameState {
  comp: Record<string, LevelCompletion>;
  badges: string[];
  total: number;
  name: string;
  wallet: number;
  certId?: string;
}

const STORAGE_KEY = 'mth4';

const DEFAULT_STATE: GameState = {
  comp: {},
  badges: [],
  total: 0,
  name: 'Traffic Hero',
  wallet: 50000,
};

class ProgressManager {
  private state: GameState;
  private listeners: Array<(s: GameState) => void> = [];

  constructor() {
    this.state = this.load();
  }

  /** Load from localStorage, falling back to defaults */
  private load(): GameState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch { /* corrupted → reset */ }
    return { ...DEFAULT_STATE };
  }

  /** Persist to localStorage + optional Supabase sync */
  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch { /* quota exceeded → silent */ }

    // Cloud sync (mirrors original course.js behaviour)
    const win = window as any;
    if (win.supabaseClient && win.colUser) {
      win.supabaseClient.auth
        .updateUser({ data: { progress: this.state } })
        .catch((err: any) => console.error('Cloud save failed', err));
    }

    this.listeners.forEach((fn) => fn(this.state));
  }

  /** Read-only snapshot of current state */
  get(): Readonly<GameState> {
    return this.state;
  }

  // ── Convenience accessors ──────────────────────────────

  /** All level completion records */
  get completions(): Record<string, LevelCompletion> {
    return this.state.comp;
  }

  /** Number of levels completed */
  get completedCount(): number {
    return Object.keys(this.state.comp).length;
  }

  /** Earned badge IDs */
  get badges(): readonly string[] {
    return this.state.badges;
  }

  /** Player display name */
  get name(): string {
    return this.state.name;
  }

  /** In-game wallet balance */
  get wallet(): number {
    return this.state.wallet;
  }

  /** Certificate ID (generated lazily) */
  get certId(): string {
    if (!this.state.certId) {
      this.state.certId = 'CERT-' + Math.floor(Math.random() * 1_000_000);
      this.save();
    }
    return this.state.certId;
  }

  // ── Mutations ──────────────────────────────────────────

  /** Mark a level as completed (best-score merge) */
  completeLevel(
    levelId: string,
    score: number,
    mode?: string,
  ): void {
    const prev = this.state.comp[levelId]?.score ?? 0;
    const modes = mode
      ? { ...(this.state.comp[levelId]?.modes ?? {}), [mode]: true }
      : this.state.comp[levelId]?.modes;

    this.state.comp[levelId] = {
      ...this.state.comp[levelId],
      score: Math.max(score, prev),
      time: Date.now(),
      finalQuiz: true,
      ...(modes ? { modes } : {}),
    };
    this.save();
  }

  /** Award a badge if not already earned */
  awardBadge(badgeId: string): boolean {
    if (this.state.badges.includes(badgeId)) return false;
    this.state.badges.push(badgeId);
    this.save();
    return true;
  }

  /** Check if a badge is earned */
  hasBadge(badgeId: string): boolean {
    return this.state.badges.includes(badgeId);
  }

  /** Set player name */
  setName(name: string): void {
    this.state.name = name;
    this.save();
  }

  /** Adjust wallet balance (positive = earn, negative = spend) */
  adjustWallet(delta: number): number {
    this.state.wallet = Math.max(0, this.state.wallet + delta);
    this.save();
    return this.state.wallet;
  }

  /** Update the total field (used for cloud conflict resolution) */
  setTotal(total: number): void {
    this.state.total = total;
    this.save();
  }

  // ── Cloud sync / conflict resolution ───────────────────

  /**
   * Merge cloud state into local state.
   * Mirrors the logic from course.js lines 70-106.
   */
  mergeCloud(cloudState: Partial<GameState>): 'local-won' | 'cloud-won' | 'no-conflict' {
    if (!cloudState) return 'no-conflict';

    const local = this.state;
    const cloud = { ...DEFAULT_STATE, ...cloudState };

    const isDifferent =
      cloud.total !== local.total ||
      (cloud.badges?.length ?? 0) !== local.badges.length ||
      Object.keys(cloud.comp ?? {}).length !== Object.keys(local.comp).length;

    if (!isDifferent) return 'no-conflict';

    // If local has nothing but cloud does → adopt cloud
    if (local.total === 0 && Object.keys(local.comp).length === 0 && cloud.total > 0) {
      this.state = cloud as GameState;
      this.save();
      return 'cloud-won';
    }

    // If cloud has nothing but local does → upload local
    if (cloud.total === 0 && Object.keys(cloud.comp ?? {}).length === 0 && local.total > 0) {
      this.save(); // triggers Supabase upload
      return 'local-won';
    }

    // Both have progress → caller should show conflict modal
    return 'no-conflict';
  }

  /** Accept cloud state entirely (used by conflict modal) */
  adoptCloud(cloudState: Partial<GameState>): void {
    this.state = { ...DEFAULT_STATE, ...cloudState } as GameState;
    this.save();
  }

  // ── Subscriptions ──────────────────────────────────────

  /** Subscribe to state changes; returns unsubscribe function */
  onChange(fn: (s: GameState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  /** Reset all progress (nuclear option) */
  reset(): void {
    this.state = { ...DEFAULT_STATE };
    this.save();
  }
}

// Singleton export
export const progress = new ProgressManager();
