export const THEME_NAMES = ["midnight", "pixel", "blueprint"] as const;
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

export function applyTheme(name: string, opts: ApplyOptions = {}): void {
  const theme = isValid(name) ? name : DEFAULT;
  localStorage.setItem(KEY, theme);

  // Magical swap: a radial wipe of the new theme out from the click point, using the
  // View Transitions API. Falls back to an instant swap without the API or under reduced motion.
  const startViewTransition = (document as unknown as {
    startViewTransition?: (cb: () => void) => unknown;
  }).startViewTransition;

  if (opts.animate && typeof startViewTransition === "function" && !prefersReducedMotion()) {
    const root = document.documentElement;
    root.style.setProperty("--vt-x", `${opts.x ?? window.innerWidth}px`);
    root.style.setProperty("--vt-y", `${opts.y ?? 0}px`);
    startViewTransition.call(document, () => setThemeAttributes(theme));
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
