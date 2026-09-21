import { useState } from "react";

import { Canvas } from "./canvas";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export const App = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <>
      <div className="flex w-full">
        <Sidebar onSelect={setSelectedPath} selectedPath={selectedPath} />
        <Canvas key={selectedPath} path={selectedPath} />
      </div>

      <TopBar />
    </>
  );
};
