import { useGesture } from "@use-gesture/react";
import { cn } from "cn";
import { useRef, useState } from "react";
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

const PRESET_COLORS = {
  "1": "#fb464c",
  "2": "#e9973f",
  "3": "#e0de71",
  "4": "#44cf6e",
  "5": "#53dfdd",
  "6": "#a882ff",
} as const;

const EDGE_COLOR = "#d4d4d8";

const NODE_SURFACE: Record<CanvasNode["type"], string> = {
  file: "bg-purple-200",
  group: "bg-zinc-100",
  link: "bg-blue-200",
  text: "bg-red-200",
};

const BACKGROUND_SIZE = {
  cover: "cover",
  ratio: "contain",
  repeat: "auto",
} as const;

const DEMO_NODES: CanvasNode[] = [
  {
    color: "4",
    height: 400,
    id: "x7Kp2Q",
    label: "Inbox",
    type: "group",
    width: 640,
    x: 10,
    y: 0,
  },
  {
    color: "1",
    height: 120,
    id: "m4Zt8R",
    text: "# Hello\n\nA **text** node",
    type: "text",
    width: 240,
    x: 50,
    y: 60,
  },
  {
    color: "6",
    file: "photo.png",
    height: 160,
    id: "Qa9Lx3",
    subpath: "#heading",
    type: "file",
    width: 240,
    x: 330,
    y: 100,
  },
  {
    color: "#3b82f6",
    height: 80,
    id: "V2nH7k",
    type: "link",
    url: "https://jsoncanvas.org",
    width: 240,
    x: 50,
    y: 220,
  },
];

const DEMO_EDGES: CanvasEdge[] = [
  {
    color: "5",
    fromEnd: "none",
    fromNode: "m4Zt8R",
    fromSide: "right",
    id: "e1",
    label: "see also",
    toEnd: "arrow",
    toNode: "Qa9Lx3",
    toSide: "left",
  },
  {
    color: "#FF0000",
    fromEnd: "arrow",
    fromNode: "Qa9Lx3",
    fromSide: "bottom",
    id: "e2",
    toEnd: "none",
    toNode: "V2nH7k",
    toSide: "right",
  },
  {
    fromNode: "V2nH7k",
    fromSide: "top",
    id: "e3",
    toNode: "m4Zt8R",
    toSide: "bottom",
  },
];

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

  const backgroundStyle = node.backgroundStyle ?? "cover";

  return {
    ...style,
    backgroundImage: `url(${JSON.stringify(node.background)})`,
    backgroundPosition: "center",
    backgroundRepeat: backgroundStyle === "repeat" ? "repeat" : "no-repeat",
    backgroundSize: BACKGROUND_SIZE[backgroundStyle],
  };
};

const nodeClassName = (node: CanvasNode) =>
  cn(
    "absolute overflow-hidden p-4",
    node.type === "group" ? "rounded-xl" : "rounded-lg",
    !node.color && NODE_SURFACE[node.type]
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

export const Canvas = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [camera, setCamera] = useState<Camera>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const [nodes, setNodes] = useState(DEMO_NODES);
  const [edges, setEdges] = useState(DEMO_EDGES);

  void [setNodes, setEdges];

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
        const color = colorOf(edge.color) ?? EDGE_COLOR;

        return (
          <Xarrow
            color={color}
            divContainerStyle={{ pointerEvents: "none" }}
            end={edge.toNode}
            endAnchor={edge.toSide ?? "auto"}
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
            startAnchor={edge.fromSide ?? "auto"}
            strokeWidth={2}
          />
        );
      })}
    </div>
  );
};
