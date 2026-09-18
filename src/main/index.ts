import path from "node:path";

import { app, BrowserWindow } from "electron";

const createWindow = (): void => {
  const win = new BrowserWindow({
    height: 600,
    width: 800,
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(import.meta.dirname, "../renderer/index.html"));
  }
};

await app.whenReady();
createWindow();

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
