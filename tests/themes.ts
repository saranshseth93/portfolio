// Hex token values per theme. Must stay in sync with src/styles/global.css.
export const THEMES = {
  midnight: { bg: "#0E0E12", surface: "#16161C", text: "#EDEAE3", textMuted: "#9A968C", accent: "#E0316B", accent2: "#C9A227" },
  pixel:    { bg: "#0B0E0A", surface: "#11160F", text: "#C7F2A4", textMuted: "#6E8C5A", accent: "#5CE65C", accent2: "#FFB000" },
  blueprint:{ bg: "#0A1830", surface: "#0E2142", text: "#DCEAF7", textMuted: "#7FA6CC", accent: "#4FC3F7", accent2: "#A7D8FF" },
} as const;
