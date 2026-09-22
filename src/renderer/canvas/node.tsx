import { useGesture } from "@use-gesture/react";
import { cn } from "cn";
import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import { colorClass, colorOf } from "./color";
import type { Side } from "./edge";
import { sides } from "./edge";

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

type ConnectDrag = (
  nodeId: string,
  side: Side,
  clientX: number,
  clientY: number,
  last: boolean
) => void;

interface NodeProps {
  node: CanvasNode;
  onConnect: ConnectDrag;
  onDrag: (
    id: string,
    movementX: number,
    movementY: number,
    first: boolean
  ) => void;
  openSide?: Side;
  selected: boolean;
}

interface HandleProps {
  nodeId: string;
  onConnect: ConnectDrag;
  open: boolean;
  side: Side;
}

const edgeBand: Record<Side, string> = {
  bottom: "inset-x-0 bottom-0 h-4",
  left: "inset-y-0 left-0 w-4",
  right: "inset-y-0 right-0 w-4",
  top: "inset-x-0 top-0 h-4",
};

const handlePosition: Record<Side, string> = {
  bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  left: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
  right: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
  top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

// Node drag and marquee listen on ancestors of this handle.
const stop = ({ event }: { event: Event }) => {
  event.stopPropagation();
};

const Handle = ({ nodeId, onConnect, open, side }: HandleProps) => {
  const handleRef = useRef<HTMLDivElement | null>(null);

  useGesture(
    {
      onDrag: ({ event, last, xy: [clientX, clientY] }) => {
        event.stopPropagation();
        onConnect(nodeId, side, clientX, clientY, last);
      },
      onMouseDown: stop,
      onPointerDown: stop,
      onTouchStart: stop,
    },
    {
      drag: { threshold: 0 },
      target: handleRef,
    }
  );

  return (
    <div
      className={cn(
        "canvas-handle pointer-events-none absolute z-10 flex size-6 items-center justify-center group-hover/side:pointer-events-auto",
        open && "pointer-events-auto",
        handlePosition[side]
      )}
      data-node-id={nodeId}
      data-side={side}
      ref={handleRef}
    >
      <div
        className={cn(
          "size-3 cursor-move rounded-full bg-zinc-900 opacity-0 transition-opacity group-hover/side:opacity-100 dark:bg-white",
          open && "opacity-100"
        )}
      />
    </div>
  );
};

export const dragThreshold = 4;

// Label and edges select the group. The rest of the box does not.
export const groupInterior = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return null;
  }

  const node = target.closest(".canvas-group");

  if (!node || target.closest(".canvas-group-label, .canvas-group-edge")) {
    return null;
  }

  return node;
};

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

const roundedClass = (node: CanvasNode) =>
  node.type === "group" ? "rounded-xl" : "rounded-lg";

const nodeClassName = (node: CanvasNode, selected: boolean) =>
  cn(
    "canvas-node absolute touch-none",
    node.type === "group" && "canvas-group",
    roundedClass(node),
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
    default: {
      return null;
    }
  }
};

export const Node = ({
  node,
  onConnect,
  onDrag,
  openSide,
  selected,
}: NodeProps) => {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const skipMove = useRef(false);

  useGesture(
    {
      onDrag: ({ event, first, movement: [movementX, movementY] }) => {
        if (first) {
          const { target } = event;
          const onHandle =
            target instanceof Element &&
            target.closest(".canvas-handle") !== null;
          // Unselected interior stays put so a marquee can start there.
          skipMove.current =
            onHandle || (!selected && groupInterior(target) !== null);
        }

        if (skipMove.current) {
          return;
        }

        onDrag(node.id, movementX, movementY, first);
      },
    },
    {
      drag: { threshold: dragThreshold },
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
      {node.type === "group" && node.label ? (
        <div className="canvas-group-label absolute bottom-full left-0 touch-none pb-1 whitespace-nowrap">
          {node.label}
        </div>
      ) : null}
      <div className={cn("size-full overflow-hidden p-4", roundedClass(node))}>
        {nodeBody(node)}
      </div>
      {sides.map((side) => (
        <div
          className={cn(
            "group/side pointer-events-auto absolute",
            node.type === "group" && "canvas-group-edge",
            edgeBand[side]
          )}
          key={side}
        >
          <Handle
            nodeId={node.id}
            onConnect={onConnect}
            open={openSide === side}
            side={side}
          />
        </div>
      ))}
    </div>
  );
};
