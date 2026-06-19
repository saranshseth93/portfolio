import { describe, it, expect } from "vitest";
import { shouldEnableShader } from "../src/scripts/hero-shader";

describe("shader enable conditions", () => {
  const base = { reducedMotion: false, finePointer: true, hasWebGL: true };

  it("enables when all conditions are met", () => {
    expect(shouldEnableShader(base)).toBe(true);
  });
  it("disables under reduced motion", () => {
    expect(shouldEnableShader({ ...base, reducedMotion: true })).toBe(false);
  });
  it("disables without a fine pointer (touch / no pointer)", () => {
    expect(shouldEnableShader({ ...base, finePointer: false })).toBe(false);
  });
  it("disables without WebGL support", () => {
    expect(shouldEnableShader({ ...base, hasWebGL: false })).toBe(false);
  });
});
