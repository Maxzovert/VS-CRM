export const clayBrandCards = [
  "clay-feature-pink",
  "clay-feature-teal",
  "clay-feature-lavender",
  "clay-feature-peach",
  "clay-feature-ochre",
  "clay-feature-cream",
] as const;

export function getClayCardClass(index: number) {
  return clayBrandCards[index % clayBrandCards.length];
}

export const clayColors = {
  canvas: "#fffaf0",
  ink: "#0a0a0a",
  body: "#3a3a3a",
  muted: "#6a6a6a",
  hairline: "#e5e5e5",
  surfaceSoft: "#faf5e8",
  surfaceCard: "#f5f0e0",
  pink: "#ff4d8b",
  teal: "#1a3a3a",
  lavender: "#b8a4ed",
  peach: "#ffb084",
  ochre: "#e8b94a",
} as const;
