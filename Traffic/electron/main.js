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
var import_electron = require("electron");
var path = __toESM(require("path"));
const isDev = !import_electron.app.isPackaged;
let mainWindow = null;
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, "icons", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webgl: true,
      webSecurity: false
    },
    backgroundColor: "#070a14",
    show: false,
    title: "Mumbai Traffic Hero"
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173/index.html");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        { label: "New Game", accelerator: "Ctrl+N", click: () => mainWindow?.webContents.send("menu-new-game") },
        { label: "Restart Level", accelerator: "Ctrl+R", click: () => mainWindow?.webContents.send("menu-restart") },
        { type: "separator" },
        { label: "Quit", accelerator: "Ctrl+Q", click: () => import_electron.app.quit() }
      ]
    },
    {
      label: "View",
      submenu: [
        { label: "Toggle Fullscreen", accelerator: "F11", click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
        { label: "Toggle DevTools", accelerator: "Ctrl+Shift+I", click: () => mainWindow?.webContents.toggleDevTools() },
        { type: "separator" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "resetZoom" }
      ]
    },
    {
      label: "Help",
      submenu: [
        { label: "About", click: () => mainWindow?.webContents.send("menu-about") },
        { type: "separator" },
        { label: "Report Bug", click: () => mainWindow?.webContents.send("menu-report-bug") }
      ]
    }
  ];
  const menu = import_electron.Menu.buildFromTemplate(template);
  import_electron.Menu.setApplicationMenu(menu);
}
import_electron.app.whenReady().then(() => {
  createWindow();
  createMenu();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.ipcMain.handle("get-app-version", () => {
  return import_electron.app.getVersion();
});
import_electron.ipcMain.handle("get-save-path", () => {
  return path.join(import_electron.app.getPath("userData"), "saves");
});
