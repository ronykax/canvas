import {
  LayoutLeftIcon,
  Redo03Icon,
  Undo03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Canvas } from "./canvas";
import { Sidebar } from "./sidebar";

export const App = () => (
  <>
    <div className="flex w-full">
      <Sidebar />
      <Canvas />
    </div>

    {/* top bar */}
    <div className="app-drag fixed top-0 left-0 flex h-12 w-full">
      {/* left */}
      <div className="flex w-60 justify-end p-2">
        <button
          type="button"
          className="app-no-drag rounded-lg p-2 hover:bg-zinc-200"
        >
          <HugeiconsIcon
            icon={LayoutLeftIcon}
            strokeWidth={2}
            className="size-4"
          />
        </button>
      </div>

      {/* right */}
      <div className="relative flex flex-1 items-center bg-linear-to-b from-white to-white/80 p-2">
        <button
          type="button"
          className="app-no-drag rounded-lg p-2 hover:bg-zinc-200"
        >
          <HugeiconsIcon icon={Undo03Icon} strokeWidth={2} className="size-4" />
        </button>

        <button
          type="button"
          className="app-no-drag rounded-lg p-2 hover:bg-zinc-200"
        >
          <HugeiconsIcon icon={Redo03Icon} strokeWidth={2} className="size-4" />
        </button>

        <span className="ml-4 text-sm font-medium">Euclase</span>

        <div className="app-no-drag pointer-events-none absolute -bottom-12 left-0 h-12 w-full bg-linear-to-b from-white/80 to-transparent" />
      </div>
    </div>
  </>
);
