export function buildBootFrames(): string[] {
  return [
    "> initialising frontend.lead_",
    "DESIGN_SYSTEMS : OK",
    "PERFORMANCE    : OK",
    "THEMING        : READY",
  ];
}

export function runBoot(
  target: HTMLElement,
  opts: { reducedMotion: boolean; onDone?: () => void },
): void {
  const frames = buildBootFrames();
  const finalText = frames.join("\n");

  if (opts.reducedMotion) {
    target.textContent = finalText;
    opts.onDone?.();
    return;
  }

  // Type the readout line by line, then resolve. Total budget ~1.2s.
  target.textContent = "";
  let line = 0;
  const stepMs = 280;
  const tick = () => {
    target.textContent = frames.slice(0, line + 1).join("\n");
    line += 1;
    if (line < frames.length) {
      setTimeout(tick, stepMs);
    } else {
      opts.onDone?.();
    }
  };
  tick();
}
