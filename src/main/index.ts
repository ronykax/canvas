import path from "node:path";

import { app, BrowserWindow, ipcMain } from "electron";

import type { VaultTree } from "../shared/vault";
import { startVault } from "./vault";

const VAULT_ROOT = "/Users/rony/Desktop/Vault";

const start = async () => {
  await app.whenReady();

  const vault = await startVault(VAULT_ROOT);

  ipcMain.handle("vault:tree", () => vault.getTree());

  app.on("will-quit", () => {
    void vault.stop();
  });

  const createWindow = () => {
    const win = new BrowserWindow({
      height: 720,
      titleBarStyle: "hiddenInset",
      trafficLightPosition: { x: 16, y: 16 },
      webPreferences: {
        preload: path.join(import.meta.dirname, "../preload/index.mjs"),
        sandbox: false,
      },
      width: 1100,
    });

    const sendTree = (tree: VaultTree) => {
      if (win.isDestroyed()) {
        return;
      }

      win.webContents.send("vault:changed", tree);
    };

    const unsubscribe = vault.onChange(sendTree);
    win.on("closed", unsubscribe);

    const url = process.env["ELECTRON_RENDERER_URL"];

    return url
      ? win.loadURL(url)
      : win.loadFile(path.join(import.meta.dirname, "../renderer/index.html"));
  };

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
