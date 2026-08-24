var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
var electronAPI = {
  // Info
  getVersion: () => import_electron.ipcRenderer.invoke("get-app-version"),
  getSavePath: () => import_electron.ipcRenderer.invoke("get-save-path"),
  isDev: () => import_electron.ipcRenderer.invoke("is-dev"),
  // Save data
  exportSave: () => import_electron.ipcRenderer.invoke("export-save"),
  importSave: () => import_electron.ipcRenderer.invoke("import-save"),
  // Updates
  checkUpdates: () => import_electron.ipcRenderer.invoke("check-updates"),
  installUpdate: () => {
    import_electron.ipcRenderer.invoke("install-update");
  },
  onUpdaterStatus: (callback) => {
    import_electron.ipcRenderer.on("updater-status", (_e, status) => callback(status));
  },
  // Menu actions
  onMenuAction: (callback) => {
    import_electron.ipcRenderer.on("menu-action", (_e, action) => callback(action));
  },
  platform: process.platform,
  isElectron: true
};
import_electron.contextBridge.exposeInMainWorld("electron", electronAPI);
