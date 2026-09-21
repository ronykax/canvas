import { useGesture } from "@use-gesture/react";
import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Xarrow from "react-xarrows";

interface Camera {
  scale: number;
  x: number;
  y: number;
}

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

type CanvasNode = FileNode | GroupNode | LinkNode | TextNode;

type Side = "bottom" | "left" | "right" | "top";

interface CanvasEdge {
  color?: string;
  fromEnd?: "arrow" | "none";
  fromNode: string;
  fromSide?: Side;
  id: string;
  label?: string;
  toEnd?: "arrow" | "none";
  toNode: string;
  toSide?: Side;
}

interface CanvasProps {
  path: string | null;
}

const PRESET_COLORS = {
  "1": "#fb464c",
  "2": "#e9973f",
  "3": "#e0de71",
  "4": "#44cf6e",
  "5": "#53dfdd",
  "6": "#a882ff",
} as const;

const BACKGROUND_SIZE = {
  cover: "cover",
  ratio: "contain",
  repeat: "auto",
} as const;

const isPresetColor = (color: string): color is keyof typeof PRESET_COLORS =>
  Object.hasOwn(PRESET_COLORS, color);

const colorOf = (color?: string) => {
  if (!color) {
    return;
  }

  return isPresetColor(color) ? PRESET_COLORS[color] : color;
};

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

export const Canvas = ({ path }: CanvasProps) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [camera, setCamera] = useState<Camera>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);

  useEffect(() => {
    if (!path) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const file = JSON.parse(await window.vault.read(path));

        if (!cancelled) {
          setNodes(Array.isArray(file.nodes) ? file.nodes : []);
          setEdges(Array.isArray(file.edges) ? file.edges : []);
        }
      } catch {
        if (!cancelled) {
          setNodes([]);
          setEdges([]);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [path]);

  useGesture(
    {
      onWheel: ({ event, delta: [dx, dy] }) => {
        event.preventDefault();
        setCamera((cam) => ({ ...cam, x: cam.x - dx, y: cam.y - dy }));
      },
    },
    {
      eventOptions: { passive: false },
      target: canvasRef,
      wheel: { preventDefault: true },
    }
  );

  return (
    <div className="relative flex-1 overflow-hidden" ref={canvasRef}>
      <div
        className="absolute"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          transformOrigin: "0 0",
        }}
      >
        {nodes.map((node) => (
          <div
            className={nodeClassName(node)}
            id={node.id}
            key={node.id}
            style={nodeStyle(node)}
          >
            {nodeBody(node)}
          </div>
        ))}
      </div>
      {edges.map((edge) => {
        const color = colorOf(edge.color);

        return (
          <Xarrow
            color={color}
            divContainerStyle={{ pointerEvents: "none" }}
            end={edge.toNode}
            endAnchor={edge.toSide}
            key={edge.id}
            labels={
              edge.label ? (
                <span style={{ color, fontSize: 12 }}>{edge.label}</span>
              ) : undefined
            }
            passProps={{ pointerEvents: "none" }}
            path="straight"
            showHead={(edge.toEnd ?? "arrow") === "arrow"}
            showTail={edge.fromEnd === "arrow"}
            start={edge.fromNode}
            startAnchor={edge.fromSide}
            strokeWidth={2}
          />
        );
      })}
    </div>
  );
};
