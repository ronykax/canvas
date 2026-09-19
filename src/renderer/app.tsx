import {
  ChevronDownIcon,
  ChevronRightIcon,
  LayoutLeftIcon,
  Redo03Icon,
  SearchIcon,
  StickyNote03Icon,
  Undo03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fragment, useEffect, useState } from "react";

import type { VaultApi, VaultTree } from "../shared/vault";
import { Canvas } from "./canvas";

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

interface TreeItemsProps {
  collapsed: ReadonlySet<string>;
  depth: number;
  nodes: TreeNode[];
  onToggle: (path: string) => void;
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
  "flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-zinc-200/50";

const TreeItems = ({ collapsed, depth, nodes, onToggle }: TreeItemsProps) => (
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
                className="size-4"
              />
              {node.name}
            </button>
            {open ? (
              <TreeItems
                collapsed={collapsed}
                depth={depth + 1}
                nodes={node.children}
                onToggle={onToggle}
              />
            ) : null}
          </Fragment>
        );
      }

      return (
        <button
          key={node.path}
          type="button"
          className={rowClass}
          style={{ paddingLeft: 8 + depth * 24 }}
        >
          <HugeiconsIcon
            icon={StickyNote03Icon}
            strokeWidth={2}
            className="size-4"
          />
          {node.name}
        </button>
      );
    })}
  </>
);

export const App = () => {
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
    <>
      <div className="flex w-full">
        {/* sidebar */}
        <div className="flex h-screen w-60 flex-col border-r border-r-zinc-200 bg-zinc-100 pt-12">
          <div className="px-4">
            {/* search button */}
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg bg-zinc-200 p-2 text-sm hover:bg-zinc-300"
            >
              <HugeiconsIcon
                icon={SearchIcon}
                strokeWidth={2}
                className="size-4"
              />
              Search
            </button>
          </div>

          <div className="scroll-fade scroll-fade-25 flex flex-1 flex-col gap-px overflow-auto px-4 py-4">
            <TreeItems
              collapsed={collapsed}
              depth={0}
              nodes={buildTree(tree)}
              onToggle={toggleFolder}
            />
          </div>
        </div>

        {/* canvas */}
        <Canvas />
      </div>

      {/* top bar */}
      <div className="app-drag fixed top-0 left-0 flex h-12 w-full">
        {/* left */}
        <div className="flex w-60 justify-end p-2">
          <button
            type="button"
            className="app-no-drag rounded-lg p-2 hover:bg-zinc-200"
          >
            <HugeiconsIcon
              icon={LayoutLeftIcon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        </div>

        {/* right */}
        <div className="relative flex flex-1 items-center bg-linear-to-b from-white to-white/90 p-2">
          <button
            type="button"
            className="app-no-drag rounded-lg p-2 hover:bg-zinc-200"
          >
            <HugeiconsIcon
              icon={Undo03Icon}
              strokeWidth={2}
              className="size-4"
            />
          </button>

          <button
            type="button"
            className="app-no-drag rounded-lg p-2 hover:bg-zinc-200"
          >
            <HugeiconsIcon
              icon={Redo03Icon}
              strokeWidth={2}
              className="size-4"
            />
          </button>

          <span className="ml-4 text-sm font-medium">Euclase</span>

          <div className="absolute -bottom-12 left-0 h-12 w-full bg-linear-to-b from-white/90 to-transparent" />
        </div>
      </div>
    </>
  );
};
