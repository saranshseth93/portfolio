import { describe, it, expect } from "vitest";
import { shouldEnableShader } from "../src/scripts/hero-shader";

describe("shader enable conditions", () => {
  const base = { reducedMotion: false, hasWebGL: true };

  it("enables when WebGL is present and motion is allowed", () => {
    expect(shouldEnableShader(base)).toBe(true);
  });
  it("disables under reduced motion", () => {
    expect(shouldEnableShader({ ...base, reducedMotion: true })).toBe(false);
  });
  it("disables without WebGL support", () => {
    expect(shouldEnableShader({ ...base, hasWebGL: false })).toBe(false);
  });
});
