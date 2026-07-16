import { describe, it, expect } from "vitest";
import { THEMES } from "./themes";

// WCAG 2.1 relative luminance and contrast ratio.
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The motto band sits on the bg with a faint 5% accent tint. This approximates that mix in
// sRGB so we can confirm the tint never drops the motto text below AA.
function tint(bg: string, accent: string, p = 0.05): string {
  const ch = (h: string, i: number) => parseInt(h.replace("#", "").slice(i, i + 2), 16);
  const mixed = [0, 2, 4].map((i) => Math.round(ch(bg, i) * (1 - p) + ch(accent, i) * p));
  return "#" + mixed.map((x) => x.toString(16).padStart(2, "0")).join("");
}

describe("theme contrast (WCAG AA)", () => {
  for (const [name, t] of Object.entries(THEMES)) {
    it(`${name}: body text on bg passes AA (>=4.5)`, () => {
      expect(ratio(t.text, t.bg)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: muted text on bg passes AA (>=4.5)`, () => {
      expect(ratio(t.textMuted, t.bg)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: text on surface passes AA (>=4.5)`, () => {
      expect(ratio(t.text, t.surface)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: accent on bg passes large-text AA (>=3.0)`, () => {
      expect(ratio(t.accent, t.bg)).toBeGreaterThanOrEqual(3.0);
    });

    // Motto band: Sanskrit (large accent), Hindi (muted), English (text), all over the tinted bg.
    it(`${name}: motto Sanskrit (accent, large) on tinted band passes AA (>=3.0)`, () => {
      expect(ratio(t.accent, tint(t.bg, t.accent))).toBeGreaterThanOrEqual(3.0);
    });
    it(`${name}: motto Hindi (muted) on tinted band passes AA (>=4.5)`, () => {
      expect(ratio(t.textMuted, tint(t.bg, t.accent))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
