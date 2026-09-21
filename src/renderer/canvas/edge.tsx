import Xarrow from "react-xarrows";

import { colorOf } from "./color";

type Side = "bottom" | "left" | "right" | "top";

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
      color={color}
      divContainerStyle={{ pointerEvents: "none" }}
      end={edge.toNode}
      endAnchor={edge.toSide}
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
};
