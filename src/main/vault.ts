import type { Stats } from "node:fs";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { watch } from "chokidar";

import type { VaultTree } from "../shared/vault";

interface Vault {
  getTree: () => Promise<VaultTree>;
  onChange: (listener: (tree: VaultTree) => void) => () => void;
  read: (relativePath: string) => Promise<string>;
  stop: () => Promise<void>;
}

const emptyTree = (): VaultTree => ({
  dirs: [],
  files: [],
});

const readCanvas = (vaultRoot: string, relativePath: string) => {
  if (
    !relativePath.endsWith(".canvas") ||
    relativePath.includes("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Invalid canvas path");
  }

  return readFile(path.join(vaultRoot, relativePath), "utf-8");
};

const toPosixRelative = (vaultRoot: string, filePath: string) => {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(vaultRoot, filePath);

  return path.relative(vaultRoot, absolutePath).split(path.sep).join("/");
};

const isIgnored = (vaultRoot: string, filePath: string, stats?: Stats) => {
  const relativePath = toPosixRelative(vaultRoot, filePath);

  if (relativePath === "") {
    return false;
  }

  if (relativePath.startsWith("..")) {
    return true;
  }

  if (relativePath.split("/").some((part) => part.startsWith("."))) {
    return true;
  }

  if (stats?.isFile()) {
    return !relativePath.endsWith(".canvas");
  }

  return false;
};

const removeUnder = (paths: Set<string>, prefix: string) => {
  for (const value of paths) {
    if (value === prefix || value.startsWith(`${prefix}/`)) {
      paths.delete(value);
    }
  }
};

export const startVault = async (vaultRoot: string): Promise<Vault> => {
  try {
    await access(vaultRoot);
  } catch {
    const listeners = new Set<(tree: VaultTree) => void>();

    return {
      getTree: () => Promise.resolve(emptyTree()),
      onChange: (listener) => {
        listeners.add(listener);

        return () => {
          listeners.delete(listener);
        };
      },
      read: () => Promise.reject(new Error("Vault not found")),
      stop: () => Promise.resolve(),
    };
  }

  const dirs = new Set<string>();
  const files = new Set<string>();
  const listeners = new Set<(tree: VaultTree) => void>();
  const ready = Promise.withResolvers<true>();
  let live = false;

  const snapshot = (): VaultTree => ({
    dirs: [...dirs].toSorted(),
    files: [...files].toSorted(),
  });

  const emit = () => {
    const tree = snapshot();

    for (const listener of listeners) {
      listener(tree);
    }
  };

  const watcher = watch(vaultRoot, {
    atomic: true,
    awaitWriteFinish: {
      pollInterval: 100,
      stabilityThreshold: 200,
    },
    cwd: vaultRoot,
    ignored: (filePath, stats) => isIgnored(vaultRoot, filePath, stats),
    persistent: true,
  });

  watcher.on("all", (event, filePath) => {
    const relativePath = toPosixRelative(vaultRoot, filePath);

    if (event === "addDir") {
      if (relativePath === "") {
        return;
      }

      dirs.add(relativePath);
    } else if (event === "unlinkDir") {
      if (relativePath === "") {
        return;
      }

      removeUnder(dirs, relativePath);
      removeUnder(files, relativePath);
    } else if (event === "add") {
      if (!relativePath.endsWith(".canvas")) {
        return;
      }

      files.add(relativePath);
    } else if (event === "unlink") {
      if (!files.delete(relativePath)) {
        return;
      }
    } else {
      return;
    }

    if (live) {
      emit();
    }
  });

  watcher.on("error", (error) => {
    console.error("[vault]", error);
  });

  watcher.on("ready", () => {
    live = true;
    ready.resolve(true);
    emit();
  });

  return {
    getTree: async () => {
      await ready.promise;
      return snapshot();
    },
    onChange: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    read: (relativePath: string) => readCanvas(vaultRoot, relativePath),
    stop: () => watcher.close(),
  };
};
