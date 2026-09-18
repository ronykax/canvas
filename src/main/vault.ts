import type { Stats } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { watch } from "chokidar";

import type { VaultTree } from "../shared/vault";

interface VaultFile {
  mtimeMs: number;
  size: number;
}

interface VaultIndex {
  files: Record<string, VaultFile>;
  vaultRoot: string;
}

interface Vault {
  getTree: () => Promise<VaultTree>;
  onChange: (listener: (tree: VaultTree) => void) => () => void;
  stop: () => Promise<void>;
}

const emptyTree = (): VaultTree => ({
  dirs: [],
  files: [],
});

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

const isVaultFile = (value: unknown): value is VaultFile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("mtimeMs" in value && "size" in value)) {
    return false;
  }

  return typeof value.mtimeMs === "number" && typeof value.size === "number";
};

const isVaultIndex = (value: unknown): value is VaultIndex => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("files" in value && "vaultRoot" in value)) {
    return false;
  }

  if (typeof value.vaultRoot !== "string") {
    return false;
  }

  if (typeof value.files !== "object" || value.files === null) {
    return false;
  }

  return true;
};

const loadFiles = async (indexPath: string, vaultRoot: string) => {
  try {
    const parsed: unknown = JSON.parse(await readFile(indexPath, "utf-8"));

    if (!isVaultIndex(parsed) || parsed.vaultRoot !== vaultRoot) {
      return new Map<string, VaultFile>();
    }

    const files = new Map<string, VaultFile>();

    for (const [filePath, value] of Object.entries(parsed.files)) {
      if (isVaultFile(value)) {
        files.set(filePath, value);
      }
    }

    return files;
  } catch {
    return new Map<string, VaultFile>();
  }
};

const diffFiles = (
  previous: Map<string, VaultFile>,
  current: Map<string, VaultFile>
) => {
  const added: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const [filePath, file] of current) {
    const before = previous.get(filePath);

    if (!before) {
      added.push(filePath);
      continue;
    }

    if (before.mtimeMs !== file.mtimeMs || before.size !== file.size) {
      changed.push(filePath);
      continue;
    }

    unchanged.push(filePath);
  }

  const removed: string[] = [];

  for (const filePath of previous.keys()) {
    if (!current.has(filePath)) {
      removed.push(filePath);
    }
  }

  return {
    added: added.toSorted(),
    changed: changed.toSorted(),
    removed: removed.toSorted(),
    unchanged: unchanged.toSorted(),
  };
};

export const startVault = async (
  vaultRoot: string,
  indexPath: string
): Promise<Vault> => {
  console.log("[vault] start", { indexPath, vaultRoot });

  try {
    await access(vaultRoot);
  } catch {
    console.log("[vault] folder missing", vaultRoot);

    const listeners = new Set<(tree: VaultTree) => void>();

    return {
      getTree: () => Promise.resolve(emptyTree()),
      onChange: (listener) => {
        listeners.add(listener);

        return () => {
          listeners.delete(listener);
        };
      },
      stop: () => Promise.resolve(),
    };
  }

  const previous = await loadFiles(indexPath, vaultRoot);
  const current = new Map<string, VaultFile>();
  const dirs = new Set<string>();
  const listeners = new Set<(tree: VaultTree) => void>();
  const ready = Promise.withResolvers<true>();
  let live = false;

  const snapshot = (): VaultTree => ({
    dirs: [...dirs].toSorted(),
    files: [...current.keys()].toSorted(),
  });

  const emit = () => {
    const tree = snapshot();

    for (const listener of listeners) {
      listener(tree);
    }
  };

  console.log("[vault] previous", Object.fromEntries(previous));

  const persist = async () => {
    const index: VaultIndex = {
      files: Object.fromEntries(current),
      vaultRoot,
    };

    await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  };

  const watcher = watch(vaultRoot, {
    alwaysStat: true,
    atomic: true,
    awaitWriteFinish: {
      pollInterval: 100,
      stabilityThreshold: 200,
    },
    cwd: vaultRoot,
    ignored: (filePath, stats) => isIgnored(vaultRoot, filePath, stats),
    persistent: true,
  });

  watcher.on("all", (event, filePath, stats) => {
    const relativePath = toPosixRelative(vaultRoot, filePath);

    if (event === "addDir" || event === "unlinkDir") {
      if (relativePath === "") {
        return;
      }

      if (event === "addDir") {
        dirs.add(relativePath);
      } else {
        for (const dir of dirs) {
          if (dir === relativePath || dir.startsWith(`${relativePath}/`)) {
            dirs.delete(dir);
          }
        }
      }

      if (!live) {
        return;
      }

      console.log(`[vault] ${event}`, relativePath);
      emit();
      return;
    }

    if (event === "unlink") {
      if (!current.delete(relativePath)) {
        return;
      }
    } else if (event === "add" || event === "change") {
      if (!relativePath.endsWith(".canvas")) {
        return;
      }

      if (!stats) {
        console.log("[vault] skip (no stats)", event, relativePath);
        return;
      }

      current.set(relativePath, {
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      });
    } else {
      return;
    }

    if (!live) {
      return;
    }

    if (event === "unlink") {
      console.log("[vault] unlink", relativePath);
    } else {
      console.log(`[vault] ${event}`, relativePath, current.get(relativePath));
    }

    emit();
    void persist();
  });

  watcher.on("error", (error) => {
    console.log("[vault] error", error);
  });

  watcher.on("ready", () => {
    live = true;
    const diff = diffFiles(previous, current);

    console.log("[vault] ready", {
      ...diff,
      files: Object.fromEntries(current),
    });
    ready.resolve(true);
    emit();
    void persist();
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
    stop: () => watcher.close(),
  };
};
