import {
  LayoutLeftIcon,
  Redo03Icon,
  Undo03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const BLUR_LAYERS = 6;

const TopProgressiveBlur = () => {
  const step = 100 / (BLUR_LAYERS + 1);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-18">
      {Array.from({ length: BLUR_LAYERS }, (_, i) => {
        const blur = 1 * 2 ** (BLUR_LAYERS - 1 - i);
        const mask = `linear-gradient(to bottom, transparent ${(i - 1) * step}%, black ${i * step}%, black ${(i + 1) * step}%, transparent ${(i + 2) * step}%)`;

        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              WebkitBackdropFilter: `blur(${blur}px)`,
              WebkitMaskImage: mask,
              backdropFilter: `blur(${blur}px)`,
              maskImage: mask,
            }}
          />
        );
      })}

      <div className="absolute inset-0 bg-linear-to-b from-white to-transparent" />
    </div>
  );
};

export const TopBar = () => (
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
    <div className="relative flex flex-1 items-center p-2">
      <TopProgressiveBlur />

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

      <span className="ml-2.5 text-sm">Untitled</span>

      {/* <div className="app-no-drag pointer-events-none absolute -bottom-12 left-0 h-12 w-full" /> */}
    </div>
  </div>
);
