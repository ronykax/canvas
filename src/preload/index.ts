import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

import type { VaultApi, VaultTree } from "../shared/vault";

const vault: VaultApi = {
  onTree: (listener) => {
    const onChanged = (_event: IpcRendererEvent, tree: VaultTree) => {
      listener(tree);
    };

    ipcRenderer.on("vault:changed", onChanged);

    return () => {
      ipcRenderer.removeListener("vault:changed", onChanged);
    };
  },
  tree: () => ipcRenderer.invoke("vault:tree"),
};

contextBridge.exposeInMainWorld("vault", vault);
