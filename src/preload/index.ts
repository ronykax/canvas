import { contextBridge, ipcRenderer } from "electron";

import type { VaultNode } from "../shared/vault";

contextBridge.exposeInMainWorld("vault", {
  tree: (): Promise<VaultNode[]> => ipcRenderer.invoke("vault:tree"),
});
