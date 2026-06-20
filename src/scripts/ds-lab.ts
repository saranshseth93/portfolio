// The design-system lab: range controls map to scoped CSS variables, so the preview
// components retheme live, the same token-driven idea as Phoenix, made tactile.

export interface LabControls {
  hue: number;
  radius: number;
  density: number; // percent, 100 = base
}

export const LAB_DEFAULTS: LabControls = { hue: 338, radius: 10, density: 100 };

// Pure mapping from control values to the scoped token variables. Unit-tested.
export function tokensFromControls(c: LabControls): Record<string, string> {
  const space = c.density / 100;
  return {
    "--lab-accent": `oklch(0.72 0.17 ${c.hue})`,
    "--lab-accent-soft": `oklch(0.72 0.17 ${c.hue} / 0.18)`,
    "--lab-radius": `${c.radius}px`,
    "--lab-space": `${space}`,
  };
}

export function initLab(): void {
  const lab = document.querySelector<HTMLElement>("[data-lab]");
  if (!lab) return;

  const ranges = Array.from(lab.querySelectorAll<HTMLInputElement>("[data-control]"));
  const read = (): LabControls => {
    const get = (id: string) => Number(ranges.find((r) => r.dataset.control === id)?.value ?? 0);
    return { hue: get("hue"), radius: get("radius"), density: get("density") };
  };

  const display: Record<keyof LabControls, (v: number) => string> = {
    hue: (v) => `${v}`,
    radius: (v) => `${v}px`,
    density: (v) => `${v}%`,
  };

  const apply = () => {
    const c = read();
    const tokens = tokensFromControls(c);
    for (const [k, v] of Object.entries(tokens)) lab.style.setProperty(k, v);
    for (const key of ["hue", "radius", "density"] as (keyof LabControls)[]) {
      const el = lab.querySelector<HTMLElement>(`[data-val="${key}"]`);
      if (el) el.textContent = display[key](c[key]);
    }
  };

  for (const range of ranges) range.addEventListener("input", apply);

  const reset = lab.querySelector<HTMLButtonElement>("[data-lab-reset]");
  reset?.addEventListener("click", () => {
    for (const range of ranges) {
      const id = range.dataset.control as keyof LabControls | undefined;
      if (id) range.value = String(LAB_DEFAULTS[id]);
    }
    apply();
  });

  apply();
}
