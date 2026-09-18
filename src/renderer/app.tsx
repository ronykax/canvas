import {
  ChevronDownIcon,
  ChevronRightIcon,
  LayoutLeftIcon,
  Redo03Icon,
  SearchIcon,
  StickyNote03Icon,
  Undo03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const App = () => (
  <>
    <div className="w-full">
      {/* sidebar */}
      <div className="flex h-screen w-60 flex-col border-r border-r-zinc-200 bg-zinc-100 pt-12">
        <div className="px-4">
          {/* search button */}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg bg-zinc-200 p-2 text-sm hover:bg-zinc-300"
          >
            <HugeiconsIcon
              icon={SearchIcon}
              strokeWidth={2}
              className="size-4"
            />
            Search
          </button>
        </div>

        <div className="scroll-fade scroll-fade-25 flex flex-1 flex-col gap-px overflow-auto px-4 py-4">
          {/* closed folder (top level) */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-zinc-200/50"
          >
            <HugeiconsIcon
              icon={ChevronRightIcon}
              strokeWidth={2}
              className="size-4"
            />
            Random
          </button>

          {/* open folder (top level) */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-zinc-200/50"
          >
            <HugeiconsIcon
              icon={ChevronDownIcon}
              strokeWidth={2}
              className="size-4"
            />
            Projects
          </button>

          {/* canvas (inside the open folder) (selected) */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-zinc-200 p-2 pl-8 text-sm"
          >
            <HugeiconsIcon
              icon={StickyNote03Icon}
              strokeWidth={2}
              className="size-4"
            />
            Euclase
          </button>

          {/* canvas (inside the open folder) (not selected) */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-2 pl-8 text-sm hover:bg-zinc-200/50"
          >
            <HugeiconsIcon
              icon={StickyNote03Icon}
              strokeWidth={2}
              className="size-4"
            />
            ChibeeU
          </button>

          {/* closed folder (inside the open folder) */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-2 pl-8 text-sm hover:bg-zinc-200/50"
          >
            <HugeiconsIcon
              icon={ChevronRightIcon}
              strokeWidth={2}
              className="size-4"
            />
            Old
          </button>

          {/* canvas (top level) */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-zinc-200/50"
          >
            <HugeiconsIcon
              icon={StickyNote03Icon}
              strokeWidth={2}
              className="size-4"
            />
            Random
          </button>

          {/* canvases (top level) */}
          {Array.from({ length: 100 }).map((_, i) => (
            <button
              key={i}
              type="button"
              className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-zinc-200/50"
            >
              <HugeiconsIcon
                icon={StickyNote03Icon}
                strokeWidth={2}
                className="size-4"
              />
              Untitled {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* canvas */}
      <div className="h-full flex-1" />
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
      <div className="flex flex-1 items-center p-2">
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
      </div>
    </div>
  </>
);
