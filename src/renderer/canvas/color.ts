const PRESET_COLORS = {
  "1": "#fb464c",
  "2": "#e9973f",
  "3": "#e0de71",
  "4": "#44cf6e",
  "5": "#53dfdd",
  "6": "#a882ff",
} as const;

const isPresetColor = (color: string): color is keyof typeof PRESET_COLORS =>
  Object.hasOwn(PRESET_COLORS, color);

export const colorOf = (color?: string) => {
  if (!color) {
    return;
  }

  return isPresetColor(color) ? PRESET_COLORS[color] : color;
};
