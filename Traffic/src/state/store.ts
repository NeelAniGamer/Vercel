import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VehicleType = 'bike' | 'car' | 'bus' | 'truck' | 'auto' | 'lambo';
export type QualityLevel = 'Low' | 'Medium' | 'High' | 'Ultra';
export type Language = 'en' | 'hi';

export interface PlayerProfile {
  name: string;
  avatar: string;
  vehicle: VehicleType;
  wallet: number;
}

export interface LevelCompletion {
  score: number;
  time: number;
  modes: Record<string, boolean>;
  completedAt: number;
}

export interface Streak {
  current: number;
  best: number;
  lastDate: string;
}

export interface Settings {
  quality: QualityLevel;
  language: Language;
  sound: boolean;
  music: boolean;
  autoQuality: boolean;
}

export interface GameState {
  // Player
  player: PlayerProfile;
  // Progress
  progress: Record<string, LevelCompletion>;
  badges: string[];
  streak: Streak;
  // Settings
  settings: Settings;
  // Runtime
  paused: boolean;
  currentLevel: string | null;
  currentMode: string | null;

  // Actions
  setPlayer: (partial: Partial<PlayerProfile>) => void;
  completeLevel: (id: string, completion: LevelCompletion) => void;
  awardBadge: (badgeId: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  setPaused: (paused: boolean) => void;
  setCurrentLevel: (id: string | null, mode: string | null) => void;
  addWallet: (amount: number) => void;
}

const today = () => new Date().toISOString().split('T')[0];

export const store = create<GameState>()(
  persist(
    (set, get) => ({
      player: {
        name: 'Traffic Hero',
        avatar: 'default',
        vehicle: 'car',
        wallet: 50000
      },
      progress: {},
      badges: [],
      streak: { current: 0, best: 0, lastDate: '' },
      settings: {
        quality: 'High',
        language: 'en',
        sound: true,
        music: true,
        autoQuality: false
      },
      paused: false,
      currentLevel: null,
      currentMode: null,

      setPlayer: (partial) =>
        set((s) => ({ player: { ...s.player, ...partial } })),

      completeLevel: (id, completion) =>
        set((s) => {
          const progress = { ...s.progress, [id]: completion };
          // Streak logic
          const lastDate = s.streak.lastDate;
          const td = today();
          let streak = s.streak;
          if (lastDate !== td) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const current = lastDate === yesterday ? s.streak.current + 1 : 1;
            streak = {
              current,
              best: Math.max(current, s.streak.best),
              lastDate: td
            };
          }
          return { progress, streak };
        }),

      awardBadge: (badgeId) =>
        set((s) => ({
          badges: s.badges.includes(badgeId) ? s.badges : [...s.badges, badgeId]
        })),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      setPaused: (paused) => set({ paused }),

      setCurrentLevel: (id, mode) => set({ currentLevel: id, currentMode: mode }),

      addWallet: (amount) =>
        set((s) => ({ player: { ...s.player, wallet: s.player.wallet + amount } }))
    }),
    {
      name: 'traffic_sim_state',
      partialize: (state) => ({
        player: state.player,
        progress: state.progress,
        badges: state.badges,
        streak: state.streak,
        settings: state.settings
      })
    }
  )
);
