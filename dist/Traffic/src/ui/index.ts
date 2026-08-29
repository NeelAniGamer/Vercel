// @ts-nocheck
/**
 * UI — typed facade over legacy ui.js
 *
 * ui.js (~4,460 lines) implements every screen: level select, briefing,
 * quiz, results, certificates, profile, badges. It is loaded as a classic
 * script and merges onto `window.ui`.
 *
 * This facade provides:
 *  1. Typed API surface for new code (import from '@ui')
 *  2. Guaranteed legacy script load (side-effect import)
 *  3. Migration path — individual screens move to src/ui/screens/ incrementally
 *
 * Full conversion target: src/ui/screens/*.ts (deferred — see MIGRATION_PLAN.md Phase 4b)
 */

import '../../ui.js';

export interface LevelObj {
  id: number | string;
  name?: string;
  icon?: string;
  themeType?: string;
  mode?: string;
  vehMode?: string;
  assets?: string[];
  noTimer?: boolean;
  noScore?: boolean;
  noObjective?: boolean;
  law?: { off: string; fine: string };
  theory?: any;
  [key: string]: any;
}

export interface UIAPI {
  // Lifecycle
  init(): void;
  show(screenId: string): void;

  // Screens
  showStart(): void;
  showLevels(): void;
  showBriefing(lid: number | string): void;
  showResults(data: any): void;
  showCert(): void;
  showBadges(): void;
  showProfile(): void;
  showNamePrompt(cb?: () => void): void;
  showNameDlg(): void;
  showCommitmentPledge(onSave: (pledge: any) => void): void;
  showMysteryRewardModal(reward: any): void;

  // Mode / vehicle selection
  selectMode(mode: string): void;
  _selectVehicle(vid: string): void;

  // Quiz flow
  nextQ(): void;

  // 2D scenario bridge
  show2D(): void;
  exit2D(): void;
  restart2D(): void;
  dispatchStart(): void;

  // Wallet / challans
  issueChallan(offense: string, amount: number): void;
  dismissChallan(): void;

  // Persistence
  save(): void;
  saveProfile(profile: any): void;
  savePledge(pledge: any): void;
  saveNamePrompt(name: string): void;

  // Certificates
  downloadCertificate(): void;
  shareCertificate(): void;
  dlCert(): void;

  // Grade system
  getGradeConfig(score: number): any;
  getGradeTier(score: number): string;
  getAgeBracket(): string;
  getAgeScale(): number;

  // Admin
  adminUnlock(): void;

  // Audio
  setVol(v: number): void;

  // State (assigned at runtime by legacy code)
  cur: LevelObj | null;
  curMode: string | null;

  [key: string]: any;
}

/**
 * Get the merged ui singleton (legacy Object.assign target).
 */
export function getUI(): UIAPI {
  return (window as any).ui as UIAPI;
}

/**
 * Toast notification (delegates to legacy implementation if present).
 */
export function toast(msg: string, color?: string): void {
  const t = (window as any).toast;
  if (typeof t === 'function') t(msg, color);
  else console.log(`[toast] ${msg}`);
}

/**
 * Sound effects (delegates to legacy sfx).
 */
export const sfx = {
  play(name: string): void {
    const s = (window as any).sfx;
    if (s && typeof s.play === 'function') s.play(name);
  },
  init(): void {
    const s = (window as any).sfx;
    if (s && typeof s.init === 'function') s.init();
  }
};

// Re-export legacy globals for convenience in new modules
export const ui = getUI();

// Legacy global access preserved (window.ui / window.toast / window.sfx
// are set by the legacy scripts themselves)
