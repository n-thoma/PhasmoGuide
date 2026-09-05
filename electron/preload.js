const { contextBridge, ipcRenderer } = require("electron");

// Narrow, purpose-specific bridge for the Jerry chatbot — the renderer never
// sees the raw API key or calls the Anthropic SDK directly; both live in the
// main process (see electron/main.js).
contextBridge.exposeInMainWorld("jerryAPI", {
  hasApiKey: () => ipcRenderer.invoke("jerry:has-key"),
  saveApiKey: (key) => ipcRenderer.invoke("jerry:save-key", key),
  clearApiKey: () => ipcRenderer.invoke("jerry:clear-key"),
  sendMessage: (history) => ipcRenderer.invoke("jerry:send-message", history),
});
