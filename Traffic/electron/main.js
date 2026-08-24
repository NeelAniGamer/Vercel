var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
var import_electron_updater = require("electron-updater");
var isDev = !import_electron.app.isPackaged;
var mainWindow = null;
function getStatePath() {
  return path.join(import_electron.app.getPath("userData"), "window-state.json");
}
function loadWindowState() {
  try {
    const raw = fs.readFileSync(getStatePath(), "utf-8");
    const state = JSON.parse(raw);
    const { screen } = require("electron");
    const displays = screen.getAllDisplays();
    const isVisible = displays.some(
      (d) => state.x >= d.workArea.x - 10 && state.y >= d.workArea.y - 10 && state.x < d.workArea.x + d.workArea.width && state.y < d.workArea.y + d.workArea.height
    );
    if (!isVisible) throw new Error("off-screen");
    return state;
  } catch {
    return { width: 1280, height: 720, isMaximized: false };
  }
}
function saveWindowState(win) {
  if (win.isDestroyed()) return;
  const state = {
    x: win.getBounds().x,
    y: win.getBounds().y,
    width: win.getBounds().width,
    height: win.getBounds().height,
    isMaximized: win.isMaximized()
  };
  try {
    fs.writeFileSync(getStatePath(), JSON.stringify(state));
  } catch (e) {
    console.warn("[main] Failed to save window state:", e);
  }
}
async function exportSave() {
  if (!mainWindow) return { ok: false };
  const result = await import_electron.dialog.showSaveDialog(mainWindow, {
    title: "Export Save Data",
    defaultPath: `traffic-save-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, cancelled: true };
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
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    version: import_electron.app.getVersion(),
    data
  }, null, 2));
  return { ok: true, path: result.filePath };
}
async function importSave() {
  if (!mainWindow) return { ok: false };
  const result = await import_electron.dialog.showOpenDialog(mainWindow, {
    title: "Import Save Data",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"]
  });
  if (result.canceled || result.filePaths.length === 0) return { ok: false, cancelled: true };
  try {
    const content = JSON.parse(fs.readFileSync(result.filePaths[0], "utf-8"));
    const entries = Object.entries(content.data || {});
    for (const [key, value] of entries) {
      await mainWindow.webContents.executeJavaScript(
        `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)})`
      );
    }
    return { ok: true, keys: entries.length };
  } catch (e) {
    console.error("[main] Import failed:", e);
    return { ok: false };
  }
}
function setupAutoUpdater() {
  if (isDev) return;
  import_electron_updater.autoUpdater.autoDownload = true;
  import_electron_updater.autoUpdater.autoInstallOnAppQuit = true;
  import_electron_updater.autoUpdater.on("update-available", () => {
    mainWindow?.webContents.send("updater-status", { event: "update-available" });
  });
  import_electron_updater.autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send("updater-status", { event: "update-downloaded" });
  });
  import_electron_updater.autoUpdater.on("error", (err) => {
    console.warn("[updater]", err.message);
  });
  setTimeout(() => import_electron_updater.autoUpdater.checkForUpdates().catch(() => {
  }), 1e4);
  setInterval(() => import_electron_updater.autoUpdater.checkForUpdates().catch(() => {
  }), 60 * 60 * 1e3);
}
function createWindow() {
  const state = loadWindowState();
  mainWindow = new import_electron.BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, "icons", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webgl: true,
      webSecurity: true
    },
    backgroundColor: "#070a14",
    show: false,
    title: "Mumbai Traffic Hero"
  });
  if (state.isMaximized) mainWindow.maximize();
  else mainWindow.once("ready-to-show", () => mainWindow?.show());
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173/index.html");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
  let stateTimer = null;
  const scheduleStateSave = () => {
    if (stateTimer) clearTimeout(stateTimer);
    stateTimer = setTimeout(() => saveWindowState(mainWindow), 500);
  };
  mainWindow.on("resize", scheduleStateSave);
  mainWindow.on("move", scheduleStateSave);
  mainWindow.on("close", () => saveWindowState(mainWindow));
  mainWindow.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("http://localhost:5173") && !url.startsWith("file://")) {
      e.preventDefault();
      import_electron.shell.openExternal(url);
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        { label: "New Game", accelerator: "CmdOrCtrl+N", click: () => mainWindow?.webContents.send("menu-action", "new-game") },
        { label: "Restart Level", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.webContents.send("menu-action", "restart") },
        { type: "separator" },
        { label: "Export Save\u2026", accelerator: "CmdOrCtrl+E", click: async () => {
          const r = await exportSave();
          if (r.ok && r.path) mainWindow?.webContents.send("menu-action", `saved:${r.path}`);
        } },
        { label: "Import Save\u2026", accelerator: "CmdOrCtrl+I", click: async () => {
          const r = await importSave();
          if (r.ok) mainWindow?.webContents.send("menu-action", `loaded:${r.keys}`);
        } },
        { type: "separator" },
        { label: "Quit", accelerator: "CmdOrCtrl+Q", role: "quit" }
      ]
    },
    {
      label: "View",
      submenu: [
        { label: "Toggle Fullscreen", accelerator: "F11", click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
        { label: "Toggle DevTools", accelerator: "CmdOrCtrl+Shift+I", click: () => mainWindow?.webContents.toggleDevTools() },
        { type: "separator" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "resetZoom" }
      ]
    },
    {
      label: "Help",
      submenu: [
        { label: "About Mumbai Traffic Hero", click: () => {
          import_electron.dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "About",
            message: `Mumbai Traffic Hero v${import_electron.app.getVersion()}`,
            detail: "A 3D driving & pedestrian safety simulator.\nClass Of Learners \u2014 Traffic Academy"
          });
        } },
        { label: "Check for Updates", click: () => import_electron_updater.autoUpdater.checkForUpdates().catch(() => {
        }) },
        { type: "separator" },
        { label: "Report Bug", click: () => import_electron.shell.openExternal("https://github.com/anomalyco/opencode/issues") }
      ]
    }
  ];
  import_electron.Menu.setApplicationMenu(import_electron.Menu.buildFromTemplate(template));
}
import_electron.app.whenReady().then(() => {
  createWindow();
  createMenu();
  setupAutoUpdater();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron.app.quit();
});
process.on("uncaughtException", (err) => {
  try {
    fs.appendFileSync(
      path.join(import_electron.app.getPath("userData"), "crash.log"),
      `[${(/* @__PURE__ */ new Date()).toISOString()}] ${err.stack || err.message}
`
    );
  } catch {
  }
});
import_electron.ipcMain.handle("get-app-version", () => import_electron.app.getVersion());
import_electron.ipcMain.handle("get-save-path", () => import_electron.app.getPath("userData"));
import_electron.ipcMain.handle("export-save", () => exportSave());
import_electron.ipcMain.handle("import-save", () => importSave());
import_electron.ipcMain.handle("check-updates", () => isDev ? Promise.resolve({ dev: true }) : import_electron_updater.autoUpdater.checkForUpdates());
import_electron.ipcMain.handle("install-update", () => {
  import_electron_updater.autoUpdater.quitAndInstall();
});
import_electron.ipcMain.handle("is-dev", () => isDev);
