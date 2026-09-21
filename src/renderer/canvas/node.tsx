import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";

import { colorOf } from "./color";

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
    backgroundColor: colorOf(node.color),
    height: `${node.height}px`,
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.width}px`,
  };

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

const nodeClassName = (node: CanvasNode) =>
  cn(
    "absolute overflow-hidden p-4",
    node.type === "group" ? "rounded-xl" : "rounded-lg"
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
          <img alt="" className="size-full object-cover" src={node.file} />
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

export const Node = ({ node }: NodeProps) => (
  <div className={nodeClassName(node)} id={node.id} style={nodeStyle(node)}>
    {nodeBody(node)}
  </div>
);
