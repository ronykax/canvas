import { useState } from "react";

import { Canvas } from "./canvas";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export const App = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <div className="flex h-screen w-full">
        <Sidebar
          sidebarOpen={sidebarOpen}
          onSelect={setSelectedPath}
          selectedPath={selectedPath}
        />
        <Canvas key={selectedPath} path={selectedPath} />
      </div>

      <TopBar setSidebarOpen={setSidebarOpen} />
    </>
  );
};
