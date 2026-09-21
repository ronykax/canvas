const PRESET_BG = {
  "1": "bg-red-200",
  "2": "bg-orange-200",
  "3": "bg-yellow-200",
  "4": "bg-green-200",
  "5": "bg-cyan-200",
  "6": "bg-purple-200",
} as const;

const PRESET_COLORS = {
  "1": "var(--color-red-200)",
  "2": "var(--color-orange-200)",
  "3": "var(--color-yellow-200)",
  "4": "var(--color-green-200)",
  "5": "var(--color-cyan-200)",
  "6": "var(--color-purple-200)",
} as const;

const isPresetColor = (color: string): color is keyof typeof PRESET_BG =>
  Object.hasOwn(PRESET_BG, color);

export const colorClass = (color?: string) => {
  if (!color) {
    return;
  }

  return isPresetColor(color) ? PRESET_BG[color] : undefined;
};

export const colorOf = (color?: string) => {
  if (!color) {
    return;
  }

  return isPresetColor(color) ? PRESET_COLORS[color] : color;
};
