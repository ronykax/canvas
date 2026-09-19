import { useState } from "react";

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

export const Canvas = () => {
  const [camera, setCamera] = useState<Camera>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      height: 400,
      id: "group",
      label: "Inbox",
      type: "group",
      width: 640,
      x: 0,
      y: 0,
    },
    {
      height: 120,
      id: "text",
      text: "Hello",
      type: "text",
      width: 240,
      x: 40,
      y: 60,
    },
    {
      file: "photo.png",
      height: 160,
      id: "file",
      type: "file",
      width: 240,
      x: 320,
      y: 60,
    },
    {
      height: 80,
      id: "link",
      type: "link",
      url: "https://jsoncanvas.org",
      width: 240,
      x: 40,
      y: 220,
    },
  ]);

  void [setCamera, nodes, setNodes];

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        className="absolute"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
        }}
      >
        {nodes.map((node) => {
          switch (node.type) {
            case "text":
              return (
                <div
                  key={node.id}
                  className="absolute rounded-lg bg-red-100 p-4"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width + "px",
                    height: node.height + "px",
                  }}
                >
                  {node.text}
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
