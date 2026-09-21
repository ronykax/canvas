import { useGesture } from "@use-gesture/react";
import { cn } from "cn";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";

interface Camera {
  scale: number;
  x: number;
  y: number;
}

interface Point {
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

interface EdgeLayerProps {
  edges: CanvasEdge[];
  nodes: CanvasNode[];
}

const PRESET_COLORS = {
  "1": "#fb464c",
  "2": "#e9973f",
  "3": "#e0de71",
  "4": "#44cf6e",
  "5": "#53dfdd",
  "6": "#a882ff",
} as const;

const DEFAULT_EDGE_COLOR = "#d4d4d8";
const EDGE_CONTROL = 48;
const BEZIER_MID_CTRL = 0.375;
const BEZIER_MID_END = 0.125;

const NODE_SURFACE: Record<CanvasNode["type"], string> = {
  file: "bg-purple-200",
  group: "bg-zinc-100/75",
  link: "bg-blue-200",
  text: "bg-red-200",
};

const BACKGROUND_SIZE = {
  cover: "cover",
  ratio: "contain",
  repeat: "auto",
} as const;

const SIDE_ANCHOR: Record<Side, (node: NodeBase) => Point> = {
  bottom: (node) => ({ x: node.x + node.width / 2, y: node.y + node.height }),
  left: (node) => ({ x: node.x, y: node.y + node.height / 2 }),
  right: (node) => ({ x: node.x + node.width, y: node.y + node.height / 2 }),
  top: (node) => ({ x: node.x + node.width / 2, y: node.y }),
};

const SIDE_NORMAL: Record<Side, Point> = {
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
};

const GROUP_BACKGROUND = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#bbf7d0"/><rect width="8" height="8" fill="#86efac"/><rect x="8" y="8" width="8" height="8" fill="#86efac"/></svg>`
)}`;

const isPresetColor = (color: string): color is keyof typeof PRESET_COLORS =>
  Object.hasOwn(PRESET_COLORS, color);

const resolveColor = (color?: string) => {
  if (!color) {
    return;
  }

  return isPresetColor(color) ? PRESET_COLORS[color] : color;
};

const fillColor = (color?: string) => {
  const resolved = resolveColor(color);

  if (!resolved) {
    return;
  }

  return `${resolved}33`;
};

const isRemoteImage = (file: string) =>
  file.startsWith("data:image/") ||
  file.startsWith("http://") ||
  file.startsWith("https://");

const closestSide = (from: NodeBase, to: NodeBase): Side => {
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }

  return dy >= 0 ? "bottom" : "top";
};

const nodeStyle = (node: CanvasNode): CSSProperties => {
  const style: CSSProperties = {
    backgroundColor: fillColor(node.color),
    height: `${node.height}px`,
    left: node.x,
    top: node.y,
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

const EdgeLayer = ({ edges, nodes }: EdgeLayerProps) => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <svg
      className="pointer-events-none absolute overflow-visible"
      style={{ height: 1, left: 0, top: 0, width: 1 }}
    >
      <defs>
        {edges.flatMap((edge) => {
          const color = resolveColor(edge.color) ?? DEFAULT_EDGE_COLOR;
          const markers = [];

          if ((edge.fromEnd ?? "none") === "arrow") {
            markers.push(
              <marker
                key={`${edge.id}-from`}
                id={`edge-from-${edge.id}`}
                markerHeight={10}
                markerUnits="userSpaceOnUse"
                markerWidth={10}
                orient="auto-start-reverse"
                refX={8}
                refY={5}
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            );
          }

          if ((edge.toEnd ?? "arrow") === "arrow") {
            markers.push(
              <marker
                key={`${edge.id}-to`}
                id={`edge-to-${edge.id}`}
                markerHeight={10}
                markerUnits="userSpaceOnUse"
                markerWidth={10}
                orient="auto"
                refX={8}
                refY={5}
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            );
          }

          return markers;
        })}
      </defs>
      {edges.map((edge) => {
        const fromNode = nodeById.get(edge.fromNode);
        const toNode = nodeById.get(edge.toNode);

        if (!fromNode || !toNode) {
          return null;
        }

        const fromSide = edge.fromSide ?? closestSide(fromNode, toNode);
        const toSide = edge.toSide ?? closestSide(toNode, fromNode);
        const from = SIDE_ANCHOR[fromSide](fromNode);
        const to = SIDE_ANCHOR[toSide](toNode);
        const fromNormal = SIDE_NORMAL[fromSide];
        const toNormal = SIDE_NORMAL[toSide];
        const controlFrom = {
          x: from.x + fromNormal.x * EDGE_CONTROL,
          y: from.y + fromNormal.y * EDGE_CONTROL,
        };
        const controlTo = {
          x: to.x + toNormal.x * EDGE_CONTROL,
          y: to.y + toNormal.y * EDGE_CONTROL,
        };
        const color = resolveColor(edge.color) ?? DEFAULT_EDGE_COLOR;
        const fromArrow = (edge.fromEnd ?? "none") === "arrow";
        const toArrow = (edge.toEnd ?? "arrow") === "arrow";

        return (
          <g key={edge.id}>
            <path
              d={`M ${from.x} ${from.y} C ${controlFrom.x} ${controlFrom.y}, ${controlTo.x} ${controlTo.y}, ${to.x} ${to.y}`}
              fill="none"
              markerEnd={toArrow ? `url(#edge-to-${edge.id})` : undefined}
              markerStart={fromArrow ? `url(#edge-from-${edge.id})` : undefined}
              stroke={color}
              strokeWidth={2}
            />
            {edge.label ? (
              <text
                dominantBaseline="middle"
                fill={color}
                fontSize={12}
                paintOrder="stroke"
                stroke="#000"
                strokeWidth={4}
                textAnchor="middle"
                x={
                  BEZIER_MID_END * from.x +
                  BEZIER_MID_CTRL * controlFrom.x +
                  BEZIER_MID_CTRL * controlTo.x +
                  BEZIER_MID_END * to.x
                }
                y={
                  BEZIER_MID_END * from.y +
                  BEZIER_MID_CTRL * controlFrom.y +
                  BEZIER_MID_CTRL * controlTo.y +
                  BEZIER_MID_END * to.y
                }
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

export const Canvas = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [camera, setCamera] = useState<Camera>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      background: GROUP_BACKGROUND,
      backgroundStyle: "cover",
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
  ]);

  const [edges, setEdges] = useState<CanvasEdge[]>([
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
  ]);

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
        className="absolute bg-black"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          transformOrigin: "0 0",
        }}
      >
        {nodes.map((node) => {
          const className = nodeClassName(node);
          const style = nodeStyle(node);

          switch (node.type) {
            case "text": {
              return (
                <div key={node.id} className={className} style={style}>
                  <div className="wrap-break-word whitespace-pre-wrap">
                    {node.text}
                  </div>
                </div>
              );
            }
            case "file": {
              return (
                <div key={node.id} className={className} style={style}>
                  {isRemoteImage(node.file) ? (
                    <img
                      alt=""
                      className="size-full object-cover"
                      src={node.file}
                    />
                  ) : (
                    <>
                      <div className="truncate">{node.file}</div>
                      {node.subpath ? (
                        <div className="truncate text-sm opacity-70">
                          {node.subpath}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              );
            }
            case "link": {
              return (
                <div key={node.id} className={className} style={style}>
                  {node.url}
                </div>
              );
            }
            case "group": {
              return (
                <div key={node.id} className={className} style={style}>
                  {node.label}
                </div>
              );
            }
            default: {
              return null;
            }
          }
        })}
        <EdgeLayer edges={edges} nodes={nodes} />
      </div>
    </div>
  );
};
