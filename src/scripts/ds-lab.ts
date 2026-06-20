// The design-system lab: an accent chip plus range controls map to scoped CSS variables,
// so the preview component rethemes live, the token-driven idea made tactile.

export interface LabControls {
  accent: string;
  radius: number;
  density: number; // percent, 100 = base
  fontSize: number; // percent, 100 = base
}

export const LAB_DEFAULTS: LabControls = { accent: "#E0316B", radius: 10, density: 100, fontSize: 100 };

// Pure mapping from control values to the scoped token variables. Unit-tested.
export function tokensFromControls(c: LabControls): Record<string, string> {
  return {
    "--lab-accent": c.accent,
    "--lab-accent-soft": `color-mix(in oklab, ${c.accent} 18%, transparent)`,
    "--lab-radius": `${c.radius}px`,
    "--lab-space": `${c.density / 100}`,
    "--lab-font": `${c.fontSize / 100}`,
  };
}

export function initLab(): void {
  const lab = document.querySelector<HTMLElement>("[data-lab]");
  if (!lab) return;

  const chips = Array.from(lab.querySelectorAll<HTMLButtonElement>("[data-chip]"));
  const ranges = Array.from(lab.querySelectorAll<HTMLInputElement>("[data-control]"));
  let accent =
    chips.find((c) => c.getAttribute("aria-pressed") === "true")?.dataset.chip ?? LAB_DEFAULTS.accent;

  const num = (id: string) => Number(ranges.find((r) => r.dataset.control === id)?.value ?? 0);
  const read = (): LabControls => ({
    accent,
    radius: num("radius"),
    density: num("density"),
    fontSize: num("fontSize"),
  });

  const apply = () => {
    const c = read();
    const tokens = tokensFromControls(c);
    for (const [k, v] of Object.entries(tokens)) lab.style.setProperty(k, v);
    const setVal = (id: string, text: string) => {
      const el = lab.querySelector<HTMLElement>(`[data-val="${id}"]`);
      if (el) el.textContent = text;
    };
    setVal("radius", `${c.radius}px`);
    setVal("density", `${c.density}%`);
    setVal("fontSize", `${c.fontSize}%`);
  };

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      accent = chip.dataset.chip ?? LAB_DEFAULTS.accent;
      for (const c of chips) c.setAttribute("aria-pressed", String(c === chip));
      apply();
    });
  }
  for (const range of ranges) range.addEventListener("input", apply);

  lab.querySelector<HTMLButtonElement>("[data-lab-reset]")?.addEventListener("click", () => {
    accent = LAB_DEFAULTS.accent;
    for (const c of chips) c.setAttribute("aria-pressed", String(c.dataset.chip === LAB_DEFAULTS.accent));
    for (const range of ranges) {
      const id = range.dataset.control as "radius" | "density" | "fontSize" | undefined;
      if (id) range.value = String(LAB_DEFAULTS[id]);
    }
    apply();
  });

  apply();
}
