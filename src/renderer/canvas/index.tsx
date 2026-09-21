import { useGesture } from "@use-gesture/react";
import { SelectionArea } from "@viselect/react";
import type { SelectionEvent } from "@viselect/react";
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

const Dots = ({ scale, x, y }: Camera) => {
  const minScale = 0.1;
  const dotGap = 36;
  const dotScale = Math.max(scale, minScale);
  const gap = dotGap * dotScale;
  const offset = (value: number) => ((value % gap) + gap) % gap;

  return (
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
          x={offset(x)}
          y={offset(y)}
        >
          <circle
            cx={gap / 2}
            cy={gap / 2}
            fill="currentColor"
            opacity={0.25}
            r={dotScale + 0.5}
          />
        </pattern>
      </defs>
      <rect fill="url(#canvas-dots)" height="100%" width="100%" />
    </svg>
  );
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const onSelectStart = ({ selection }: SelectionEvent) => {
    selection.clearSelection(true, true);
    setSelectedIds([]);
  };

  const onSelectMove = ({ store }: SelectionEvent) => {
    setSelectedIds(store.selected.map((element) => element.id));
  };

  const onSelectStop = ({ store }: SelectionEvent) => {
    setSelectedIds(store.stored.map((element) => element.id));
  };

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
    <div
      className="relative flex-1 overflow-hidden select-none dark:bg-zinc-900 dark:text-white"
      ref={canvasRef}
    >
      <Dots scale={camera.scale} x={camera.x} y={camera.y} />
      <SelectionArea
        behaviour={{ intersect: "touch", startThreshold: 4 }}
        className="absolute inset-0"
        features={{ range: false, singleTap: { allow: false } }}
        onMove={onSelectMove}
        onStart={onSelectStart}
        onStop={onSelectStop}
        selectables=".canvas-node"
        selectionAreaClass="selection-area"
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              selected={selectedIds.includes(node.id)}
            />
          ))}
        </div>
        {edges.map((edge) => (
          <Edge edge={edge} key={edge.id} />
        ))}
      </SelectionArea>
    </div>
  );
};
