import path from "node:path";

import { app, BrowserWindow } from "electron";

import { startVault } from "./vault";

const VAULT_ROOT = "/Users/rony/Desktop/Vault";

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

  const stopVault = await startVault(
    VAULT_ROOT,
    path.join(app.getPath("userData"), "vault-index.json")
  );

  app.on("will-quit", () => {
    void stopVault();
  });

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
