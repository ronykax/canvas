import { useGesture } from "@use-gesture/react";
import { cn } from "cn";
import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useXarrow } from "react-xarrows";

import { colorClass, colorOf } from "./color";

interface NodeBase {
  color?: string;
  height: number;
  id: string;
  width: number;
  x: number;
  y: number;
}

interface FileNode extends NodeBase {
  file: string;
  subpath?: string;
  type: "file";
}

interface GroupNode extends NodeBase {
  background?: string;
  backgroundStyle?: "cover" | "ratio" | "repeat";
  label?: string;
  type: "group";
}

interface LinkNode extends NodeBase {
  type: "link";
  url: string;
}

interface TextNode extends NodeBase {
  text: string;
  type: "text";
}

export type CanvasNode = FileNode | GroupNode | LinkNode | TextNode;

interface NodeProps {
  node: CanvasNode;
  onDrag: (
    id: string,
    movementX: number,
    movementY: number,
    first: boolean
  ) => void;
  selected: boolean;
}

const BACKGROUND_SIZE = {
  cover: "cover",
  ratio: "contain",
  repeat: "auto",
} as const;

const isRemoteImage = (file: string) =>
  file.startsWith("data:image/") ||
  file.startsWith("http://") ||
  file.startsWith("https://");

const nodeStyle = (node: CanvasNode): CSSProperties => {
  const style: CSSProperties = {
    height: `${node.height}px`,
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.width}px`,
  };

  if (!colorClass(node.color)) {
    style.backgroundColor = colorOf(node.color);
  }

  if (node.type !== "group" || !node.background) {
    return style;
  }

  style.backgroundImage = `url(${JSON.stringify(node.background)})`;
  style.backgroundPosition = "center";

  if (node.backgroundStyle) {
    style.backgroundRepeat =
      node.backgroundStyle === "repeat" ? "repeat" : "no-repeat";
    style.backgroundSize = BACKGROUND_SIZE[node.backgroundStyle];
  }

  return style;
};

const nodeClassName = (node: CanvasNode, selected: boolean) =>
  cn(
    "canvas-node absolute touch-none overflow-hidden p-4",
    node.type === "group" ? "rounded-xl" : "rounded-lg",
    selected && "ring-2 ring-zinc-900 ring-inset dark:ring-white",
    colorClass(node.color)
  );

const nodeBody = (node: CanvasNode): ReactNode => {
  switch (node.type) {
    case "text": {
      return (
        <div className="wrap-break-word whitespace-pre-wrap">{node.text}</div>
      );
    }
    case "file": {
      if (isRemoteImage(node.file)) {
        return (
          <img
            alt=""
            className="size-full object-cover"
            draggable={false}
            src={node.file}
          />
        );
      }

      return (
        <>
          <div className="truncate">{node.file}</div>
          {node.subpath ? (
            <div className="truncate text-sm opacity-70">{node.subpath}</div>
          ) : null}
        </>
      );
    }
    case "link": {
      return node.url;
    }
    case "group": {
      return node.label;
    }
    default: {
      return null;
    }
  }
};

export const Node = ({ node, onDrag, selected }: NodeProps) => {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  useXarrow();

  useGesture(
    {
      onDrag: ({ first, movement: [movementX, movementY] }) => {
        onDrag(node.id, movementX, movementY, first);
      },
    },
    {
      drag: { threshold: 4 },
      target: nodeRef,
    }
  );

  return (
    <div
      className={nodeClassName(node, selected)}
      id={node.id}
      ref={nodeRef}
      style={nodeStyle(node)}
    >
      {nodeBody(node)}
    </div>
  );
};
