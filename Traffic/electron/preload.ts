import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  getSavePath: (): Promise<string> => ipcRenderer.invoke('get-save-path'),
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-new-game', () => callback('new-game'));
    ipcRenderer.on('menu-restart', () => callback('restart'));
    ipcRenderer.on('menu-about', () => callback('about'));
    ipcRenderer.on('menu-report-bug', () => callback('report-bug'));
  },
  platform: process.platform,
  isElectron: true
};

contextBridge.exposeInMainWorld('electron', electronAPI);

export type ElectronAPI = typeof electronAPI;
