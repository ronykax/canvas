import Xarrow from "react-xarrows";

import { colorOf } from "./color";

export const sides = ["bottom", "left", "right", "top"] as const;

export type Side = (typeof sides)[number];

export const isSide = (value: string | null | undefined): value is Side =>
  value === "bottom" ||
  value === "left" ||
  value === "right" ||
  value === "top";

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

interface EdgeProps {
  edge: CanvasEdge;
}

export const Edge = ({ edge }: EdgeProps) => {
  const color = colorOf(edge.color);

  return (
    <Xarrow
      color={color ?? "currentColor"}
      divContainerStyle={{ pointerEvents: "none" }}
      end={edge.toNode}
      endAnchor={edge.toSide ?? "auto"}
      labels={
        edge.label ? (
          <span style={{ color, fontSize: 12 }}>{edge.label}</span>
        ) : undefined
      }
      passProps={{ pointerEvents: "none" }}
      path="smooth"
      showHead={(edge.toEnd ?? "arrow") === "arrow"}
      showTail={edge.fromEnd === "arrow"}
      start={edge.fromNode}
      startAnchor={edge.fromSide ?? "auto"}
      strokeWidth={2}
      curveness={1}
    />
  );
};
