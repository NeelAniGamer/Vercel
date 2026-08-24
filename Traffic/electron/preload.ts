import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Info
  getVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  getSavePath: (): Promise<string> => ipcRenderer.invoke('get-save-path'),
  isDev: (): Promise<boolean> => ipcRenderer.invoke('is-dev'),

  // Save data
  exportSave: (): Promise<{ ok: boolean; path?: string; cancelled?: boolean }> =>
    ipcRenderer.invoke('export-save'),
  importSave: (): Promise<{ ok: boolean; keys?: number; cancelled?: boolean }> =>
    ipcRenderer.invoke('import-save'),

  // Updates
  checkUpdates: (): Promise<any> => ipcRenderer.invoke('check-updates'),
  installUpdate: (): void => { ipcRenderer.invoke('install-update'); },
  onUpdaterStatus: (callback: (status: { event: string }) => void) => {
    ipcRenderer.on('updater-status', (_e, status) => callback(status));
  },

  // Menu actions
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_e, action) => callback(action));
  },

  platform: process.platform,
  isElectron: true
};

contextBridge.exposeInMainWorld('electron', electronAPI);

export type ElectronAPI = typeof electronAPI;