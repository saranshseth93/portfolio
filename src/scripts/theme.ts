const THEME_NAMES = ["midnight", "pixel", "blueprint"] as const;
type ThemeName = (typeof THEME_NAMES)[number];

const KEY = "theme";
const DEFAULT: ThemeName = "midnight";

interface ApplyOptions {
  animate?: boolean;
  x?: number;
  y?: number;
}

function isValid(name: string): name is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(name);
}

export function getStoredTheme(): ThemeName {
  const stored = localStorage.getItem(KEY);
  return stored && isValid(stored) ? stored : DEFAULT;
}

function setThemeAttributes(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  for (const btn of document.querySelectorAll<HTMLElement>("[data-theme-btn]")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.themeBtn === theme));
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// A glowing wavefront that detonates from the clicked swatch and sweeps the screen.
// Rendered in the top layer (Popover API) so it sits above the View Transition snapshot.
function spawnShockwave(x: number, y: number, color: string): void {
  const ring = document.createElement("div");
  ring.className = "theme-shock";
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.setProperty("--shock", color);
  document.body.appendChild(ring);
  const popover = ring as HTMLElement & { showPopover?: () => void; popover?: string };
  if ("popover" in popover) {
    popover.popover = "manual";
    try { popover.showPopover?.(); } catch { /* not supported, falls back to z-index */ }
  }
  const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const scale = (reach * 2.3) / 40; // 40px is the ring's base size
  const anim = ring.animate(
    [
      { transform: "translate(-50%, -50%) scale(0.15)", opacity: 1 },
      { opacity: 1, offset: 0.12 },
      { transform: `translate(-50%, -50%) scale(${scale})`, opacity: 0 },
    ],
    { duration: 760, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
  );
  anim.onfinish = () => ring.remove();
}

export function applyTheme(name: string, opts: ApplyOptions = {}): void {
  const theme = isValid(name) ? name : DEFAULT;
  localStorage.setItem(KEY, theme);

  const startViewTransition = (document as unknown as {
    startViewTransition?: (cb: () => void) => unknown;
  }).startViewTransition;

  if (opts.animate && !prefersReducedMotion()) {
    const x = opts.x ?? window.innerWidth / 2;
    const y = opts.y ?? 0;
    // The blast wave is the spectacle; the View Transition sweeps the recolour in behind it.
    // Read the new theme's accent off its swatch dot, so the colour lives only in CSS.
    const dot = document.querySelector<HTMLElement>(`[data-theme-btn="${theme}"] .dot`);
    const accent = dot ? getComputedStyle(dot).backgroundColor : "currentColor";
    spawnShockwave(x, y, accent);
    if (typeof startViewTransition === "function") {
      const root = document.documentElement;
      root.style.setProperty("--vt-x", `${x}px`);
      root.style.setProperty("--vt-y", `${y}px`);
      startViewTransition.call(document, () => setThemeAttributes(theme));
    } else {
      setThemeAttributes(theme);
    }
  } else {
    setThemeAttributes(theme);
  }
}

export function initThemeSwitcher(): void {
  applyTheme(getStoredTheme());
  for (const btn of document.querySelectorAll<HTMLElement>("[data-theme-btn]")) {
    btn.addEventListener("click", (event) => {
      const e = event as MouseEvent;
      applyTheme(btn.dataset.themeBtn ?? DEFAULT, { animate: true, x: e.clientX, y: e.clientY });
    });
  }
}
