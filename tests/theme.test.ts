import { describe, it, expect, beforeEach, vi } from "vitest";

// jsdom-like minimal stubs for document + localStorage.
function setup() {
  const store: Record<string, string> = {};
  const html = { dataset: {} as Record<string, string> };

  // Fake theme-switcher buttons with dataset and setAttribute tracking.
  const buttons = ["midnight", "pixel", "blueprint"].map((name) => {
    const btn: {
      dataset: { themeBtn: string };
      attrs: Record<string, string>;
      setAttribute(name: string, value: string): void;
      addEventListener(event: string, handler: () => void): void;
    } = {
      dataset: { themeBtn: name },
      attrs: {},
      setAttribute(attr: string, value: string) {
        this.attrs[attr] = value;
      },
      addEventListener(_event: string, _handler: () => void) {
        // no-op for applyTheme tests
      },
    };
    return btn;
  });

  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
  };
  (globalThis as any).document = {
    documentElement: html,
    querySelectorAll: (_selector: string) => buttons,
  };
  return { html, buttons };
}

describe("theme logic", () => {
  let mod: typeof import("../src/scripts/theme");
  beforeEach(async () => {
    setup();
    vi.resetModules();
    mod = await import("../src/scripts/theme");
  });

  it("defaults to midnight when nothing stored", () => {
    expect(mod.getStoredTheme()).toBe("midnight");
  });

  it("applyTheme sets data-theme and persists", () => {
    mod.applyTheme("pixel");
    expect(document.documentElement.dataset.theme).toBe("pixel");
    expect(localStorage.getItem("theme")).toBe("pixel");
    expect(mod.getStoredTheme()).toBe("pixel");
  });

  it("rejects unknown theme names, falling back to midnight", () => {
    mod.applyTheme("rainbow");
    expect(document.documentElement.dataset.theme).toBe("midnight");
  });

  it("applyTheme sets aria-pressed correctly on theme buttons", () => {
    const { buttons } = setup();
    vi.resetModules();
    // Re-import after re-setup so the module picks up the new document stub.
    (globalThis as any).document.querySelectorAll = (_selector: string) => buttons;

    mod.applyTheme("pixel");

    const midnight = buttons.find((b) => b.dataset.themeBtn === "midnight")!;
    const pixel = buttons.find((b) => b.dataset.themeBtn === "pixel")!;
    const blueprint = buttons.find((b) => b.dataset.themeBtn === "blueprint")!;

    expect(pixel.attrs["aria-pressed"]).toBe("true");
    expect(midnight.attrs["aria-pressed"]).toBe("false");
    expect(blueprint.attrs["aria-pressed"]).toBe("false");
  });
});
