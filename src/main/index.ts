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

const start = async (): Promise<void> => {
  await app.whenReady();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
};

// electron only emits ready after the entry module finishes; top-level await deadlocks
void start();

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
