import { describe, it, expect, vi } from "vitest";
import { buildBootFrames, runBoot } from "../src/scripts/boot";

describe("boot sequence", () => {
  it("builds the expected readout frames", () => {
    const frames = buildBootFrames();
    expect(frames[0]).toContain("initialising frontend.lead");
    expect(frames.some((f) => f.includes("DESIGN_SYSTEMS"))).toBe(true);
    expect(frames.some((f) => f.includes("READY"))).toBe(true);
  });

  it("under reduced motion writes final state immediately and calls onDone", () => {
    const el = { textContent: "", innerHTML: "" } as unknown as HTMLElement;
    const onDone = vi.fn();
    runBoot(el, { reducedMotion: true, onDone });
    expect(el.textContent).toContain("READY");
    expect(onDone).toHaveBeenCalledOnce();
  });
});
