import { describe, it, expect } from "vitest";
import { tokensFromControls, LAB_DEFAULTS } from "../src/scripts/ds-lab";

describe("design-system lab token mapping", () => {
  it("maps control values to scoped CSS variables", () => {
    const t = tokensFromControls({ hue: 200, radius: 8, density: 120 });
    expect(t["--lab-radius"]).toBe("8px");
    expect(t["--lab-space"]).toBe("1.2");
    expect(t["--lab-accent"]).toBe("oklch(0.72 0.17 200)");
    expect(t["--lab-accent-soft"]).toContain("/ 0.18");
  });

  it("defaults map to a base scale and the brand-ish accent", () => {
    const t = tokensFromControls(LAB_DEFAULTS);
    expect(t["--lab-space"]).toBe("1");
    expect(t["--lab-radius"]).toBe("10px");
    expect(t["--lab-accent"]).toContain("338");
  });
});
