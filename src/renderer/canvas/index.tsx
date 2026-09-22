import { useGesture } from "@use-gesture/react";
import { SelectionArea } from "@viselect/react";
import type { SelectionEvent } from "@viselect/react";
import { useEffect, useRef, useState } from "react";

import type { CanvasEdge, Side } from "./edge";
import { Edge, isSide, oppositeSide } from "./edge";
import type { CanvasNode } from "./node";
import { dragThreshold, Node } from "./node";

interface Camera {
  scale: number;
  x: number;
  y: number;
}

interface CanvasProps {
  path: string | null;
}

interface DragStart {
  scale: number;
  starts: Record<string, { x: number; y: number }>;
}

interface ConnectDraft {
  fromNode: string;
  fromSide: Side;
  overNode?: string;
  overSide?: Side;
  x: number;
  y: number;
}

const dropAt = (
  fromNode: string,
  clientX: number,
  clientY: number,
  radius: number
) => {
  let toNode: string | undefined;
  let toSide: string | undefined;
  let best = radius;

  for (const element of document.querySelectorAll(".canvas-handle")) {
    if (
      !(element instanceof HTMLElement) ||
      element.dataset.nodeId === fromNode
    ) {
      continue;
    }

    const box = element.getBoundingClientRect();
    const distance = Math.hypot(
      clientX - (box.left + box.width / 2),
      clientY - (box.top + box.height / 2)
    );

    if (distance <= best) {
      best = distance;
      toNode = element.dataset.nodeId;
      toSide = element.dataset.side;
    }
  }

  if (!toNode || !isSide(toSide)) {
    return null;
  }

  return { toNode, toSide };
};

const worldOf = (
  clientX: number,
  clientY: number,
  bounds: DOMRect,
  camera: Camera
) => ({
  x: (clientX - bounds.left - camera.x) / camera.scale,
  y: (clientY - bounds.top - camera.y) / camera.scale,
});

const nodeOf = (nodes: CanvasNode[], id: string) =>
  nodes.find((node) => node.id === id);

const draftToOf = (draft: ConnectDraft, nodes: CanvasNode[]) => {
  if (draft.overNode) {
    return nodeOf(nodes, draft.overNode);
  }

  return { height: 0, width: 0, x: draft.x, y: draft.y };
};

const openSide = (draft: ConnectDraft | null, nodeId: string) => {
  if (draft?.fromNode === nodeId) {
    return draft.fromSide;
  }

  if (draft?.overNode === nodeId) {
    return draft.overSide;
  }
};

const isAdditive = (event: Event | null) =>
  event instanceof MouseEvent &&
  (event.shiftKey || event.metaKey || event.ctrlKey);

const idsOf = (elements: { id: string }[]) =>
  elements.map((element) => element.id);

const movedNodes = (
  nodes: CanvasNode[],
  starts: DragStart["starts"],
  dx: number,
  dy: number
) =>
  nodes.map((node) => {
    const start = starts[node.id];

    if (!start) {
      return node;
    }

    return {
      ...node,
      x: start.x + dx,
      y: start.y + dy,
    };
  });

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
  const [draft, setDraft] = useState<ConnectDraft | null>(null);
  const dragRef = useRef<DragStart | null>(null);
  const marquee = useRef(false);
  const pressedNode = useRef<Element | null>(null);
  const additive = useRef(false);

  const syncSelection = (selection: SelectionEvent["selection"]) => {
    // clearSelection emits before it empties the store.
    queueMicrotask(() => {
      const node = pressedNode.current;

      if (selection.getSelection().length === 0 && node && !additive.current) {
        selection.select(node, true);
      }

      setSelectedIds(idsOf(selection.getSelection()));
    });
  };

  const onBeforeStart = ({ event }: SelectionEvent) => {
    marquee.current = false;
    additive.current = isAdditive(event);
    const target = event?.target;
    pressedNode.current =
      target instanceof Element ? target.closest(".canvas-node") : null;
  };

  const onBeforeDrag = ({ event, selection }: SelectionEvent) => {
    const node = pressedNode.current;

    if (!node) {
      marquee.current = true;
      return;
    }

    if (!selection.getSelection().includes(node)) {
      if (!isAdditive(event)) {
        selection.clearSelection(true, true);
      }

      selection.select(node);
    }

    return false;
  };

  const onSelectStart = ({ event, selection }: SelectionEvent) => {
    if (!marquee.current && isAdditive(event)) {
      return;
    }

    selection.clearSelection(true, true);
  };

  const onSelectMove = ({ event, store }: SelectionEvent) => {
    if (event) {
      setSelectedIds(idsOf(store.selected));
    }
  };

  const onSelectStop = ({ event, selection, store }: SelectionEvent) => {
    if (!event) {
      syncSelection(selection);
      return;
    }

    setSelectedIds(idsOf(store.stored));
  };

  const onNodeDrag = (
    id: string,
    movementX: number,
    movementY: number,
    first: boolean
  ) => {
    if (first) {
      const moving = new Set(selectedIds.includes(id) ? selectedIds : [id]);
      const starts: DragStart["starts"] = {};

      for (const node of nodes) {
        if (moving.has(node.id)) {
          starts[node.id] = { x: node.x, y: node.y };
        }
      }

      dragRef.current = { scale: camera.scale, starts };
    }

    const drag = dragRef.current;

    if (!drag || (movementX === 0 && movementY === 0)) {
      return;
    }

    setNodes((current) =>
      movedNodes(
        current,
        drag.starts,
        movementX / drag.scale,
        movementY / drag.scale
      )
    );
  };

  const onConnect = (
    nodeId: string,
    side: Side,
    clientX: number,
    clientY: number,
    last: boolean
  ) => {
    const snapRadius = 48;
    const bounds = canvasRef.current?.getBoundingClientRect();

    if (!bounds) {
      if (last) {
        setDraft(null);
      }

      return;
    }

    const drop = dropAt(nodeId, clientX, clientY, snapRadius);
    const world = worldOf(clientX, clientY, bounds, camera);

    if (!last) {
      setDraft({
        fromNode: nodeId,
        fromSide: side,
        overNode: drop?.toNode,
        overSide: drop?.toSide,
        x: world.x,
        y: world.y,
      });
      return;
    }

    if (drop) {
      setEdges((current) => [
        ...current,
        {
          fromNode: nodeId,
          fromSide: side,
          id: crypto.randomUUID(),
          toNode: drop.toNode,
          toSide: drop.toSide,
        },
      ]);
    }

    setDraft(null);
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

  const draftFrom = draft ? nodeOf(nodes, draft.fromNode) : undefined;
  const draftTo = draft ? draftToOf(draft, nodes) : undefined;

  return (
    <div
      className="relative flex-1 overflow-hidden select-none dark:bg-zinc-900 dark:text-white"
      ref={canvasRef}
    >
      <Dots scale={camera.scale} x={camera.x} y={camera.y} />
      <SelectionArea
        behaviour={{
          intersect: "cover",
          startThreshold: { x: dragThreshold, y: dragThreshold },
        }}
        className="absolute inset-0"
        features={{
          // Outside tap clears the selection. Off, and that tap never does.
          deselectOnBlur: true,
          range: false,
          singleTap: { allow: true },
        }}
        onBeforeDrag={onBeforeDrag}
        onBeforeStart={onBeforeStart}
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
              onConnect={onConnect}
              onDrag={onNodeDrag}
              openSide={openSide(draft, node.id)}
              selected={selectedIds.includes(node.id)}
            />
          ))}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 overflow-visible"
            style={{ height: 1, width: 1 }}
          >
            {edges.map((edge) => {
              const from = nodeOf(nodes, edge.fromNode);
              const to = nodeOf(nodes, edge.toNode);

              if (!from || !to) {
                return null;
              }

              return <Edge edge={edge} from={from} key={edge.id} to={to} />;
            })}
            {draft && draftFrom && draftTo ? (
              <Edge
                edge={{
                  fromNode: draft.fromNode,
                  fromSide: draft.fromSide,
                  id: "draft",
                  toNode: draft.overNode ?? "cursor",
                  toSide: draft.overSide ?? oppositeSide[draft.fromSide],
                }}
                from={draftFrom}
                to={draftTo}
              />
            ) : null}
          </svg>
        </div>
      </SelectionArea>
    </div>
  );
};
