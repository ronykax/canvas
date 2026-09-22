import {
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { Fragment, useEffect, useState } from "react";

import type { VaultApi, VaultTree } from "../shared/vault";

declare global {
  interface Window {
    vault: VaultApi;
  }
}

interface TreeFile {
  kind: "file";
  name: string;
  path: string;
}

interface TreeFolder {
  children: TreeNode[];
  kind: "folder";
  name: string;
  path: string;
}

type TreeNode = TreeFile | TreeFolder;

interface SidebarProps {
  onSelect: (path: string) => void;
  selectedPath: string | null;
  sidebarOpen: boolean;
}

interface TreeItemsProps {
  collapsed: ReadonlySet<string>;
  depth: number;
  nodes: TreeNode[];
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  selectedPath: string | null;
}

const sortTree = (nodes: TreeNode[]): TreeNode[] =>
  nodes
    .toSorted((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "folder" ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    })
    .map((node) =>
      node.kind === "folder"
        ? { ...node, children: sortTree(node.children) }
        : node
    );

const buildTree = ({ dirs, files }: VaultTree): TreeNode[] => {
  const root: TreeFolder = {
    children: [],
    kind: "folder",
    name: "",
    path: "",
  };

  const ensureFolder = (folderPath: string) => {
    let folder = root;

    for (const part of folderPath.split("/")) {
      const childPath = folder.path ? `${folder.path}/${part}` : part;
      let child = folder.children.find(
        (node): node is TreeFolder =>
          node.kind === "folder" && node.path === childPath
      );

      if (!child) {
        child = {
          children: [],
          kind: "folder",
          name: part,
          path: childPath,
        };
        folder.children.push(child);
      }

      folder = child;
    }

    return folder;
  };

  for (const dir of dirs) {
    ensureFolder(dir);
  }

  for (const filePath of files) {
    const parts = filePath.split("/");
    const fileName = parts.at(-1);

    if (!fileName) {
      continue;
    }

    const folder =
      parts.length === 1 ? root : ensureFolder(parts.slice(0, -1).join("/"));

    folder.children.push({
      kind: "file",
      name: fileName.slice(0, -".canvas".length),
      path: filePath,
    });
  }

  return sortTree(root.children);
};

const rowClass =
  "flex items-center gap-2 rounded-lg opacity-75 p-2 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 dark:text-white duration-100";

const TreeItems = ({
  collapsed,
  depth,
  nodes,
  onSelect,
  onToggle,
  selectedPath,
}: TreeItemsProps) => (
  <>
    {nodes.map((node) => {
      if (node.kind === "folder") {
        const open = !collapsed.has(node.path);

        return (
          <Fragment key={node.path}>
            <button
              type="button"
              className={rowClass}
              style={{ paddingLeft: 8 + depth * 24 }}
              onClick={() => onToggle(node.path)}
            >
              <HugeiconsIcon
                icon={open ? ChevronDownIcon : ChevronRightIcon}
                strokeWidth={2}
                className="size-4 opacity-50"
              />
              {node.name}
            </button>
            {open ? (
              <TreeItems
                collapsed={collapsed}
                depth={depth + 1}
                nodes={node.children}
                onSelect={onSelect}
                onToggle={onToggle}
                selectedPath={selectedPath}
              />
            ) : null}
          </Fragment>
        );
      }

      return (
        <button
          key={node.path}
          type="button"
          className={cn(
            rowClass,
            selectedPath === node.path &&
              "bg-zinc-200 opacity-100 dark:bg-zinc-800"
          )}
          style={{ paddingLeft: 8 + (depth + 1) * 24 }}
          onClick={() => onSelect(node.path)}
        >
          {node.name}
        </button>
      );
    })}
  </>
);

export const Sidebar = ({
  onSelect,
  selectedPath,
  sidebarOpen,
}: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(new Set<string>());
  const [tree, setTree] = useState<VaultTree>({ dirs: [], files: [] });

  useEffect(() => {
    const stop = window.vault.onTree(setTree);

    const load = async () => {
      setTree(await window.vault.tree());
    };

    void load();

    return stop;
  }, []);

  const toggleFolder = (folderPath: string) => {
    setCollapsed((current) => {
      const next = new Set(current);

      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }

      return next;
    });
  };

  return (
    <div
      className={cn(
        "flex h-screen w-60 flex-col border-r border-r-zinc-200 bg-zinc-100 pt-12 dark:border-r-zinc-800 dark:bg-zinc-900",
        !sidebarOpen && "hidden"
      )}
    >
      <div className="px-4">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg bg-zinc-200 p-2 text-sm hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        >
          <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="size-4" />
          Search
        </button>
      </div>

      <div className="scroll-fade scroll-fade-25 flex flex-1 flex-col gap-px overflow-auto px-4 py-4">
        <TreeItems
          collapsed={collapsed}
          depth={0}
          nodes={buildTree(tree)}
          onSelect={onSelect}
          onToggle={toggleFolder}
          selectedPath={selectedPath}
        />
      </div>
    </div>
  );
};
