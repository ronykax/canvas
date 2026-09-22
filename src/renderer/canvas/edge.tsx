import { colorOf } from "./color";

export const sides = ["bottom", "left", "right", "top"] as const;

export type Side = (typeof sides)[number];

export const isSide = (value: string | null | undefined): value is Side =>
  value === "bottom" ||
  value === "left" ||
  value === "right" ||
  value === "top";

export const oppositeSide: Record<Side, Side> = {
  bottom: "top",
  left: "right",
  right: "left",
  top: "bottom",
};

export interface CanvasEdge {
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

export interface EdgeEnd {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface EdgeProps {
  edge: CanvasEdge;
  from: EdgeEnd;
  to: EdgeEnd;
}

const outward: Record<Side, { x: number; y: number }> = {
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
};

const pointOn = (box: EdgeEnd, side: Side) => {
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  return {
    bottom: { x, y: box.y + box.height },
    left: { x: box.x, y },
    right: { x: box.x + box.width, y },
    top: { x, y: box.y },
  }[side];
};

const closestSides = (
  from: EdgeEnd,
  to: EdgeEnd,
  fromSide?: Side,
  toSide?: Side
) => {
  if (fromSide && toSide) {
    return { fromSide, toSide };
  }

  let bestFrom = fromSide ?? "right";
  let bestTo = toSide ?? "left";
  let best = Number.POSITIVE_INFINITY;

  for (const start of fromSide ? [fromSide] : sides) {
    for (const end of toSide ? [toSide] : sides) {
      const a = pointOn(from, start);
      const b = pointOn(to, end);
      const distance = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

      if (distance < best) {
        best = distance;
        bestFrom = start;
        bestTo = end;
      }
    }
  }

  return { fromSide: bestFrom, toSide: bestTo };
};

const Marker = ({
  color,
  id,
  reverse,
}: {
  color: string;
  id: string;
  reverse?: boolean;
}) => (
  <marker
    id={id}
    markerHeight={10}
    markerWidth={10}
    orient={reverse ? "auto-start-reverse" : "auto"}
    refX={10}
    refY={5}
    viewBox="0 0 10 10"
  >
    <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
  </marker>
);

export const Edge = ({ edge, from, to }: EdgeProps) => {
  const color = colorOf(edge.color) ?? "currentColor";
  const curve = 0.625;
  const minOffset = 55;
  const strokeWidth = 2;
  const { fromSide, toSide } = closestSides(
    from,
    to,
    edge.fromSide,
    edge.toSide
  );
  const start = pointOn(from, fromSide);
  const end = pointOn(to, toSide);
  const pull = Math.max(
    Math.hypot(end.x - start.x, end.y - start.y) * curve,
    minOffset
  );
  const a = outward[fromSide];
  const b = outward[toSide];
  const cpx1 = start.x + a.x * pull;
  const cpy1 = start.y + a.y * pull;
  const cpx2 = end.x + b.x * pull;
  const cpy2 = end.y + b.y * pull;
  const d = `M${start.x},${start.y} C${cpx1},${cpy1} ${cpx2},${cpy2} ${end.x},${end.y}`;
  const labelX = start.x * 0.125 + cpx1 * 0.375 + cpx2 * 0.375 + end.x * 0.125;
  const labelY = start.y * 0.125 + cpy1 * 0.375 + cpy2 * 0.375 + end.y * 0.125;
  const showHead = (edge.toEnd ?? "arrow") === "arrow";
  const showTail = edge.fromEnd === "arrow";
  const headId = `edge-${edge.id}-head`;
  const tailId = `edge-${edge.id}-tail`;

  return (
    <g>
      <defs>
        {showHead ? <Marker color={color} id={headId} /> : null}
        {showTail ? <Marker color={color} id={tailId} reverse /> : null}
      </defs>
      <path
        d={d}
        fill="none"
        markerEnd={showHead ? `url(#${headId})` : undefined}
        markerStart={showTail ? `url(#${tailId})` : undefined}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {edge.label ? (
        <text
          dominantBaseline="middle"
          fill={color}
          fontSize={12}
          textAnchor="middle"
          x={labelX}
          y={labelY}
        >
          {edge.label}
        </text>
      ) : null}
    </g>
  );
};
