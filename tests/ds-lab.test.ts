import { describe, it, expect } from "vitest";
import { tokensFromControls, LAB_DEFAULTS } from "../src/scripts/ds-lab";

describe("design-system lab token mapping", () => {
  it("maps control values to scoped CSS variables", () => {
    const t = tokensFromControls({ accent: "#3CC7F5", radius: 8, density: 120, fontSize: 110 });
    expect(t["--lab-accent"]).toBe("#3CC7F5");
    expect(t["--lab-accent-soft"]).toBe("color-mix(in oklab, #3CC7F5 18%, transparent)");
    expect(t["--lab-radius"]).toBe("8px");
    expect(t["--lab-space"]).toBe("1.2");
    expect(t["--lab-font"]).toBe("1.1");
  });

  it("defaults map to base scales and the default accent", () => {
    const t = tokensFromControls(LAB_DEFAULTS);
    expect(t["--lab-accent"]).toBe("#E0316B");
    expect(t["--lab-space"]).toBe("1");
    expect(t["--lab-font"]).toBe("1");
    expect(t["--lab-radius"]).toBe("10px");
  });
});
