import { useGesture } from "@use-gesture/react";
import { useEffect, useRef, useState } from "react";

import type { CanvasEdge } from "./edge";
import { Edge } from "./edge";
import type { CanvasNode } from "./node";
import { Node } from "./node";

interface Camera {
  scale: number;
  x: number;
  y: number;
}

interface CanvasProps {
  path: string | null;
}

const DOT_GAP = 36;

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

  const scale = Math.max(camera.scale, 0.1);
  const gap = DOT_GAP * scale;
  const offsetX = ((camera.x % gap) + gap) % gap;
  const offsetY = ((camera.y % gap) + gap) % gap;

  return (
    <div
      className="relative flex-1 overflow-hidden dark:bg-zinc-900 dark:text-white"
      ref={canvasRef}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full dark:text-white/75"
      >
        <defs>
          <pattern
            height={gap}
            id="canvas-dots"
            patternUnits="userSpaceOnUse"
            width={gap}
            x={offsetX}
            y={offsetY}
          >
            <circle
              cx={gap / 2}
              cy={gap / 2}
              fill="currentColor"
              opacity={0.25}
              r={scale + 0.5}
            />
          </pattern>
        </defs>
        <rect fill="url(#canvas-dots)" height="100%" width="100%" />
      </svg>
      <div
        className="absolute"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          transformOrigin: "0 0",
        }}
      >
        {nodes.map((node) => (
          <Node key={node.id} node={node} />
        ))}
      </div>
      {edges.map((edge) => (
        <Edge edge={edge} key={edge.id} />
      ))}
    </div>
  );
};
