import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

// ===== Window state persistence =====

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

function getStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState(): WindowState {
  try {
    const raw = fs.readFileSync(getStatePath(), 'utf-8');
    const state = JSON.parse(raw);
    // Validate the saved position is on a connected display
    const { screen } = require('electron');
    const displays = screen.getAllDisplays();
    const isVisible = displays.some((d: any) =>
      state.x >= d.workArea.x - 10 &&
      state.y >= d.workArea.y - 10 &&
      state.x < d.workArea.x + d.workArea.width &&
      state.y < d.workArea.y + d.workArea.height
    );
    if (!isVisible) throw new Error('off-screen');
    return state;
  } catch {
    return { width: 1280, height: 720, isMaximized: false };
  }
}

function saveWindowState(win: BrowserWindow): void {
  if (win.isDestroyed()) return;
  const state: WindowState = {
    x: win.getBounds().x,
    y: win.getBounds().y,
    width: win.getBounds().width,
    height: win.getBounds().height,
    isMaximized: win.isMaximized()
  };
  try {
    fs.writeFileSync(getStatePath(), JSON.stringify(state));
  } catch (e) {
    console.warn('[main] Failed to save window state:', e);
  }
}

// ===== Save data export/import =====

function getSaveFilePath(): string {
  return path.join(app.getPath('userData'), 'save.json');
}

async function exportSave(): Promise<{ ok: boolean; path?: string; cancelled?: boolean }> {
  if (!mainWindow) return { ok: false };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Save Data',
    defaultPath: `traffic-save-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, cancelled: true };

  // Collect all traffic-related localStorage keys from the renderer
  const data = await mainWindow.webContents.executeJavaScript(
    `(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (/^(mth4|traffic_|col_)/.test(k)) out[k] = localStorage.getItem(k);
      }
      return out;
    })()`
  );

  fs.writeFileSync(result.filePath, JSON.stringify({
    exportedAt: new Date().toISOString(),
    version: app.getVersion(),
    data
  }, null, 2));
  return { ok: true, path: result.filePath };
}

async function importSave(): Promise<{ ok: boolean; keys?: number; cancelled?: boolean }> {
  if (!mainWindow) return { ok: false };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Save Data',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return { ok: false, cancelled: true };

  try {
    const content = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8'));
    const entries = Object.entries(content.data || {});
    for (const [key, value] of entries) {
      await mainWindow.webContents.executeJavaScript(
        `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)})`
      );
    }
    return { ok: true, keys: entries.length };
  } catch (e) {
    console.error('[main] Import failed:', e);
    return { ok: false };
  }
}

// ===== Auto-updater =====

function setupAutoUpdater(): void {
  if (isDev) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('updater-status', { event: 'update-available' });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('updater-status', { event: 'update-downloaded' });
  });

  autoUpdater.on('error', (err) => {
    console.warn('[updater]', err.message);
  });

  // Check after a delay so it doesn't slow boot
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 10000);

  // Then check every hour
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 60 * 60 * 1000);
}

// ===== Window =====

function createWindow(): void {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'icons', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webgl: true,
      webSecurity: true
    },
    backgroundColor: '#070a14',
    show: false,
    title: 'Mumbai Traffic Hero'
  });

  if (state.isMaximized) mainWindow.maximize();
  else mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/index.html');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Persist window state on move/resize (debounced)
  let stateTimer: NodeJS.Timeout | null = null;
  const scheduleStateSave = () => {
    if (stateTimer) clearTimeout(stateTimer);
    stateTimer = setTimeout(() => saveWindowState(mainWindow!), 500);
  };
  mainWindow.on('resize', scheduleStateSave);
  mainWindow.on('move', scheduleStateSave);
  mainWindow.on('close', () => saveWindowState(mainWindow!));

  // Block navigation away from the app
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ===== Menu =====

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New Game', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu-action', 'new-game') },
        { label: 'Restart Level', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.webContents.send('menu-action', 'restart') },
        { type: 'separator' },
        { label: 'Export Save…', accelerator: 'CmdOrCtrl+E', click: async () => {
          const r = await exportSave();
          if (r.ok && r.path) mainWindow?.webContents.send('menu-action', `saved:${r.path}`);
        }},
        { label: 'Import Save…', accelerator: 'CmdOrCtrl+I', click: async () => {
          const r = await importSave();
          if (r.ok) mainWindow?.webContents.send('menu-action', `loaded:${r.keys}`);
        }},
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
        { label: 'Toggle DevTools', accelerator: 'CmdOrCtrl+Shift+I', click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About Mumbai Traffic Hero', click: () => {
          dialog.showMessageBox(mainWindow!, {
            type: 'info',
            title: 'About',
            message: `Mumbai Traffic Hero v${app.getVersion()}`,
            detail: 'A 3D driving & pedestrian safety simulator.\nClass Of Learners — Traffic Academy'
          });
        }},
        { label: 'Check for Updates', click: () => autoUpdater.checkForUpdates().catch(() => {}) },
        { type: 'separator' },
        { label: 'Report Bug', click: () => shell.openExternal('https://github.com/anomalyco/opencode/issues') }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ===== App lifecycle =====

app.whenReady().then(() => {
  createWindow();
  createMenu();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Crash handling — write a log instead of dying silently
process.on('uncaughtException', (err) => {
  try {
    fs.appendFileSync(
      path.join(app.getPath('userData'), 'crash.log'),
      `[${new Date().toISOString()}] ${err.stack || err.message}\n`
    );
  } catch {}
});

// ===== IPC handlers =====

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-save-path', () => app.getPath('userData'));
ipcMain.handle('export-save', () => exportSave());
ipcMain.handle('import-save', () => importSave());
ipcMain.handle('check-updates', () => isDev ? Promise.resolve({ dev: true }) : autoUpdater.checkForUpdates());
ipcMain.handle('install-update', () => { autoUpdater.quitAndInstall(); });
ipcMain.handle('is-dev', () => isDev);