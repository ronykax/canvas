import path from "node:path";

import { app, BrowserWindow } from "electron";

const createWindow = () => {
  const win = new BrowserWindow({
    height: 720,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    width: 1100,
  });

  const url = process.env["ELECTRON_RENDERER_URL"];

  return url
    ? win.loadURL(url)
    : win.loadFile(path.join(import.meta.dirname, "../renderer/index.html"));
};

const start = async () => {
  await app.whenReady();
  await createWindow();

  app.on("activate", async () => {
    const load = BrowserWindow.getAllWindows().length
      ? Promise.resolve()
      : createWindow();

    await load;
  });
};

void start();

app.on("window-all-closed", () =>
  process.platform === "darwin" ? undefined : app.quit()
);
