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
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
const electronAPI = {
  getVersion: () => import_electron.ipcRenderer.invoke("get-app-version"),
  getSavePath: () => import_electron.ipcRenderer.invoke("get-save-path"),
  onMenuAction: (callback) => {
    import_electron.ipcRenderer.on("menu-new-game", () => callback("new-game"));
    import_electron.ipcRenderer.on("menu-restart", () => callback("restart"));
    import_electron.ipcRenderer.on("menu-about", () => callback("about"));
    import_electron.ipcRenderer.on("menu-report-bug", () => callback("report-bug"));
  },
  platform: process.platform,
  isElectron: true
};
import_electron.contextBridge.exposeInMainWorld("electron", electronAPI);
