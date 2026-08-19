const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kiosk", {
  getConfig: () => ipcRenderer.invoke("get-config"),
  sendAnswer: (data) => ipcRenderer.invoke("send-answer", data),
  checkAdminPassword: (attempt) => ipcRenderer.invoke("check-admin-password", attempt),
  relock: () => ipcRenderer.invoke("relock"),
  adminQuit: (attempt) => ipcRenderer.invoke("admin-quit", attempt),
  onOpenAdmin: (callback) => ipcRenderer.on("open-admin", () => callback()),
});
