export const THEME_NAMES = ["midnight", "pixel", "blueprint"] as const;
type ThemeName = (typeof THEME_NAMES)[number];

const KEY = "theme";
const DEFAULT: ThemeName = "midnight";

function isValid(name: string): name is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(name);
}

export function getStoredTheme(): ThemeName {
  const stored = localStorage.getItem(KEY);
  return stored && isValid(stored) ? stored : DEFAULT;
}

export function applyTheme(name: string): void {
  const theme = isValid(name) ? name : DEFAULT;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
  for (const btn of document.querySelectorAll<HTMLElement>("[data-theme-btn]")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.themeBtn === theme));
  }
}

export function initThemeSwitcher(): void {
  applyTheme(getStoredTheme());
  for (const btn of document.querySelectorAll<HTMLElement>("[data-theme-btn]")) {
    btn.addEventListener("click", () => applyTheme(btn.dataset.themeBtn ?? DEFAULT));
  }
}
