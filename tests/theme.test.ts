import { describe, it, expect, beforeEach, vi } from "vitest";

// jsdom-like minimal stubs for document + localStorage.
function setup() {
  const store: Record<string, string> = {};
  const html = { dataset: {} as Record<string, string> };
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
  };
  (globalThis as any).document = { documentElement: html };
  return html;
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
});
