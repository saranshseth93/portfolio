# saranshseth.me Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page personal portfolio whose signature is a token-driven three-theme system with a cursor-revealed hero portrait, fast and accessible enough to be the proof of skill itself.

**Architecture:** Astro renders all content as static HTML with zero framework runtime. Tailwind v4 `@theme` defines semantic design tokens; three `[data-theme]` blocks override the raw CSS variables so flipping one attribute on `<html>` recolours every utility with no re-render. Three small vanilla scripts add the theme switcher, boot sequence, and a guarded WebGL cursor-reveal shader as progressive enhancement over a static themed portrait.

**Tech Stack:** Astro 6, Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript, Vitest for unit tests, sharp for the image pipeline, native macOS Vision (Swift) for background removal. Deploy: Cloudflare Pages.

## Global Constraints

These apply to every task. Copied from `CLAUDE.md`.

- No emojis anywhere: copy, comments, commit messages.
- No em dashes anywhere. Use commas, full stops, or colons. Hyphens in compound words are fine.
- No AI-jargon: avoid "leverage", "ecosystem", "deep dive", "wheelhouse", "synergy", "alignment", "utilise", "seamless", "robust", "streamline". Plain words.
- Lighthouse 95+ on all four categories (Performance, Accessibility, Best Practices, SEO).
- Production Tailwind CSS output well under 20KB gzipped.
- LCP under 1.5s; the hero portrait is the LCP element: optimised AVIF + WebP fallback, explicit width/height.
- All text is real, server-rendered HTML. The WebGL canvas is decorative only.
- WCAG 2.1 AA: every theme's text/bg pairings pass contrast; visible keyboard focus everywhere; theme switcher is real buttons with `aria-pressed`.
- `prefers-reduced-motion: reduce` disables boot typing, scanlines, and cursor shader. Theme swaps stay instant.
- Self-hosted fonts, subset and preloaded. No external font CDN.
- Works with JS disabled: Midnight theme, static portrait, all content readable.
- All theming flows through semantic tokens (`text-accent`, `bg-surface`), never hardcoded colours in markup.
- Icons from one library (Lucide), imported per-icon, inheriting `currentColor`. Brand logos (GitHub, LinkedIn) from Simple Icons.
- Tooling versions (verified 2026-06-19): astro 6.4.8, tailwindcss 4.3.1, @tailwindcss/vite 4.3.1, sharp 0.35.1, vitest 4.1.9.

---

## File Structure

```
package.json, astro.config.mjs, tsconfig.json, vitest.config.ts
src/
  styles/global.css            @theme tokens, 3 [data-theme] overrides, @apply components, fonts
  layouts/BaseLayout.astro     <head>, meta/SEO/JSON-LD, inline no-flash theme init, slot
  pages/index.astro            page assembly
  components/
    ThemeSwitcher.astro        three labelled buttons, aria-pressed
    Hero.astro                 portrait img + boot mount + name + tagline + switcher
    BootSequence.astro         boot readout markup (script-driven)
    Currently.astro            one paragraph
    Experience.astro           text rows
    SocialLinks.astro          GitHub / LinkedIn / email
  scripts/
    theme.ts                   apply/persist/restore theme, switcher wiring
    boot.ts                    typing sequence, reduced-motion aware
    hero-shader.ts             WebGL init, guards, pointer reveal
    shaders/reveal.vert        vertex shader
    shaders/reveal.frag        fragment shader (per-theme treatment + radial mask)
  assets/portrait/
    source.png                 raw (committed)
    cutout.png                 generated, transparent
    portrait-{600,1200}.{avif,webp}   generated
    lqip.txt                   generated data URI
public/fonts/                  subset woff2 files
public/favicon.svg, public/og.png
scripts/
  cutout.swift                 Vision background removal
  build-images.mjs             sharp pipeline
tests/
  theme.test.ts                theme logic
  contrast.test.ts             AA contrast audit of all themes
  boot.test.ts                 boot sequence + reduced-motion
  shader-fallback.test.ts      shader guard conditions
docs/superpowers/              spec + this plan
README.md                      written last, humanizer skill
```

---

## Phase 1: Content, tokens, themes (ship-quality, no effects)

### Task 1: Scaffold Astro + Tailwind v4

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`

**Interfaces:**
- Produces: a running dev server; `BaseLayout.astro` exposing a default `<slot />` inside `<html data-theme="midnight">`; `global.css` importing Tailwind.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "saranshseth-portfolio",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "images": "node scripts/build-images.mjs"
  },
  "dependencies": {
    "astro": "^6.4.8"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.1",
    "tailwindcss": "^4.3.1",
    "sharp": "^0.35.1",
    "vitest": "^4.1.9"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: dependencies install with no errors.

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Static single page. Tailwind v4 runs through the Vite plugin so content
// scanning is automatic and the emitted CSS contains only used utilities.
export default defineConfig({
  site: "https://saranshseth.me",
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Create `src/styles/global.css`** (token block filled in Task 2)

```css
@import "tailwindcss";
```

- [ ] **Step 6: Create `src/layouts/BaseLayout.astro`**

```astro
---
import "../styles/global.css";
interface Props { title: string; description: string; }
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en" data-theme="midnight">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body class="bg-bg text-text font-body antialiased">
    <slot />
  </body>
</html>
```

- [ ] **Step 7: Create `src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="Saransh Seth" description="Senior Frontend Engineer and Design Systems Tech Lead in Melbourne.">
  <main class="mx-auto max-w-3xl px-6 py-24">
    <h1 class="text-text">Saransh Seth</h1>
  </main>
</BaseLayout>
```

- [ ] **Step 8: Run dev server**

Run: `npm run dev` then open the printed URL.
Expected: page renders "Saransh Seth", no console errors. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/
git commit -m "feat: scaffold Astro with Tailwind v4"
```

---

### Task 2: Design tokens and three themes with AA contrast audit

**Files:**
- Modify: `src/styles/global.css`
- Create: `tests/contrast.test.ts`, `vitest.config.ts`

**Interfaces:**
- Produces: semantic utilities `bg-bg`, `bg-surface`, `text-text`, `text-text-muted`, `text-accent`, `text-accent-2`, `font-display`, `font-body`, and a `--color-focus` variable. Three themes selectable via `data-theme="midnight|pixel|blueprint"`.
- Produces (for tests): `tests/themes.ts` exporting a `THEMES` record of `{ bg, surface, text, textMuted, accent, accent2 }` hex values per theme.

This task is test-first: contrast is real logic with a real failure mode (a theme pairing failing AA), so we encode the WCAG ratio check and assert every pairing passes before trusting the palette.

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["tests/**/*.test.ts"] } });
```

- [ ] **Step 2: Create `tests/themes.ts`** (single source of truth for the audit; values mirror `global.css`)

```ts
// Hex token values per theme. Must stay in sync with src/styles/global.css.
export const THEMES = {
  midnight: { bg: "#0E0E12", surface: "#16161C", text: "#EDEAE3", textMuted: "#9A968C", accent: "#8B2252", accent2: "#C9A227" },
  pixel:    { bg: "#0B0E0A", surface: "#11160F", text: "#C7F2A4", textMuted: "#8FB877", accent: "#5CE65C", accent2: "#FFB000" },
  blueprint:{ bg: "#0A1830", surface: "#0E2142", text: "#DCEAF7", textMuted: "#7FA6CC", accent: "#4FC3F7", accent2: "#A7D8FF" },
} as const;
```

Note: `pixel.textMuted` is brightened from the spec's `#6E8C5A` to `#8FB877` so body-muted text passes AA against `#0B0E0A`. If `#6E8C5A` passes in Step 4, revert to it.

- [ ] **Step 3: Write the failing test `tests/contrast.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { THEMES } from "./themes";

// WCAG 2.1 relative luminance and contrast ratio.
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("theme contrast (WCAG AA)", () => {
  for (const [name, t] of Object.entries(THEMES)) {
    it(`${name}: body text on bg passes AA (>=4.5)`, () => {
      expect(ratio(t.text, t.bg)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: muted text on bg passes AA (>=4.5)`, () => {
      expect(ratio(t.textMuted, t.bg)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: text on surface passes AA (>=4.5)`, () => {
      expect(ratio(t.text, t.surface)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: accent on bg passes large-text AA (>=3.0)`, () => {
      expect(ratio(t.accent, t.bg)).toBeGreaterThanOrEqual(3.0);
    });
  }
});
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/contrast.test.ts`
Expected: PASS. If any pairing fails, brighten that token in both `tests/themes.ts` and `global.css` (Step 5) until it passes, then re-run. Record the final value in both files.

- [ ] **Step 5: Fill `src/styles/global.css` with tokens and theme overrides**

```css
@import "tailwindcss";

/* Default theme: Midnight. These generate the semantic utilities. */
@theme {
  --color-bg: #0E0E12;
  --color-surface: #16161C;
  --color-text: #EDEAE3;
  --color-text-muted: #9A968C;
  --color-accent: #8B2252;
  --color-accent-2: #C9A227;
  --color-focus: #C9A227;

  --font-display: "Hanken Grotesk", system-ui, sans-serif;
  --font-body: "Hanken Grotesk", system-ui, sans-serif;
}

/* Pixel: retro phosphor. Muted value matches tests/themes.ts. */
[data-theme="pixel"] {
  --color-bg: #0B0E0A;
  --color-surface: #11160F;
  --color-text: #C7F2A4;
  --color-text-muted: #8FB877;
  --color-accent: #5CE65C;
  --color-accent-2: #FFB000;
  --color-focus: #FFB000;
  --font-display: "Press Start 2P", monospace;
  --font-body: "JetBrains Mono", ui-monospace, monospace;
}

/* Blueprint: technical drafting. */
[data-theme="blueprint"] {
  --color-bg: #0A1830;
  --color-surface: #0E2142;
  --color-text: #DCEAF7;
  --color-text-muted: #7FA6CC;
  --color-accent: #4FC3F7;
  --color-accent-2: #A7D8FF;
  --color-focus: #4FC3F7;
  --font-display: "JetBrains Mono", ui-monospace, monospace;
  --font-body: "JetBrains Mono", ui-monospace, monospace;
}

/* Visible keyboard focus in every theme. */
:where(a, button, [tabindex]):focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Verify themes swap manually**

Run: `npm run dev`, then in devtools set `document.documentElement.dataset.theme = "pixel"` and `"blueprint"`.
Expected: background and text colours change with each value. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css tests/ vitest.config.ts
git commit -m "feat: add design tokens, three themes, and AA contrast audit"
```

---

### Task 3: Theme switcher with persistence and no-flash init

**Files:**
- Create: `src/scripts/theme.ts`, `src/components/ThemeSwitcher.astro`, `tests/theme.test.ts`
- Modify: `src/layouts/BaseLayout.astro`, `src/pages/index.astro`

**Interfaces:**
- Consumes: `data-theme` on `<html>`.
- Produces: `theme.ts` exporting `THEME_NAMES: readonly ["midnight","pixel","blueprint"]`, `applyTheme(name: string): void` (sets `data-theme` and writes `localStorage["theme"]`), `getStoredTheme(): string` (returns stored value or `"midnight"`), and `initThemeSwitcher(): void` (wires buttons with `data-theme-btn` and keeps `aria-pressed` in sync).

- [ ] **Step 1: Write the failing test `tests/theme.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/theme.test.ts`
Expected: FAIL, cannot find module `../src/scripts/theme`.

- [ ] **Step 3: Create `src/scripts/theme.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/theme.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Create `src/components/ThemeSwitcher.astro`**

```astro
---
const themes = [
  { id: "midnight", label: "Midnight" },
  { id: "pixel", label: "Pixel" },
  { id: "blueprint", label: "Blueprint" },
];
---
<div class="theme-switcher" role="group" aria-label="Colour theme">
  {themes.map((t) => (
    <button type="button" class="swatch" data-theme-btn={t.id} aria-pressed={t.id === "midnight"}>
      <span class={`dot dot-${t.id}`} aria-hidden="true"></span>{t.label}
    </button>
  ))}
</div>

<script>
  import { initThemeSwitcher } from "../scripts/theme";
  initThemeSwitcher();
</script>
```

- [ ] **Step 6: Add the no-flash inline init and switcher to `BaseLayout.astro`**

Add inside `<head>`, as the last element (runs before `<body>` paints):

```astro
    <script is:inline>
      // Read stored theme before first paint to avoid a flash of the wrong theme.
      try {
        var t = localStorage.getItem("theme");
        if (t === "pixel" || t === "blueprint") document.documentElement.dataset.theme = t;
      } catch (e) {}
    </script>
```

- [ ] **Step 7: Add switcher swatch styles to `global.css`**

```css
@layer components {
  .theme-switcher { @apply flex gap-2; }
  .swatch {
    @apply inline-flex items-center gap-2 rounded-md border border-surface px-3 py-1.5 text-sm text-text-muted;
  }
  .swatch[aria-pressed="true"] { @apply text-text border-accent; }
  .dot { @apply inline-block h-3 w-3 rounded-full; }
  .dot-midnight { background: #8B2252; }
  .dot-pixel { background: #5CE65C; }
  .dot-blueprint { background: #4FC3F7; }
}
```

- [ ] **Step 8: Mount the switcher in `index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import ThemeSwitcher from "../components/ThemeSwitcher.astro";
---
<BaseLayout title="Saransh Seth" description="Senior Frontend Engineer and Design Systems Tech Lead in Melbourne.">
  <header class="mx-auto flex max-w-3xl justify-end px-6 py-6"><ThemeSwitcher /></header>
  <main class="mx-auto max-w-3xl px-6 pb-24"><h1>Saransh Seth</h1></main>
</BaseLayout>
```

- [ ] **Step 9: Manual check**

Run: `npm run dev`. Click each swatch; reload; confirm the theme persists and `aria-pressed` follows the active button (devtools). Tab to the buttons; confirm a visible focus ring.
Expected: persistence works, no flash on reload, focus visible. Stop the server.

- [ ] **Step 10: Commit**

```bash
git add src/scripts/theme.ts src/components/ThemeSwitcher.astro src/layouts/BaseLayout.astro src/pages/index.astro src/styles/global.css tests/theme.test.ts
git commit -m "feat: theme switcher with persistence and no-flash init"
```

---

### Task 4: Page content and components

**Files:**
- Create: `src/components/Currently.astro`, `src/components/Experience.astro`, `src/components/SocialLinks.astro`, `src/components/Hero.astro`
- Modify: `src/pages/index.astro`, `src/styles/global.css`

**Interfaces:**
- Consumes: `ThemeSwitcher.astro`, semantic token utilities.
- Produces: a complete server-rendered page. `Hero.astro` exposes a portrait slot region (filled in Task 8) and holds the name + tagline. Section ids: `currently`, `experience`, `links`.

All copy below is final. No em dashes, no emojis, no AI-jargon.

- [ ] **Step 1: Create `src/components/Currently.astro`**

```astro
<section id="currently" class="mx-auto max-w-3xl px-6 py-12">
  <h2 class="font-display text-sm uppercase tracking-widest text-text-muted">Currently</h2>
  <p class="mt-4 text-lg leading-relaxed">
    Leading the Phoenix Design System migration to a layered architecture with white-label
    theming. Building the Figma token sync pipeline with Code Connect and the Variables API, and
    an in-progress Phoenix MCP server that surfaces tokens and component rules to AI coding
    assistants.
  </p>
</section>
```

- [ ] **Step 2: Create `src/components/Experience.astro`**

```astro
---
const roles = [
  { company: "Intrepid", role: "Senior SWE, Acting Tech Lead, Design Systems", dates: "Mar 2024 to Present", line: "Leading design system architecture and the Figma to code token pipeline." },
  { company: "AmazingCo", role: "Full Stack Developer", dates: "2022 to 2024", line: "Shipped product features across the stack for a high-traffic marketplace." },
  { company: "Nookal", role: "Frontend Web Developer", dates: "2017 to 2022", line: "Built and maintained the customer-facing web application." },
];
---
<section id="experience" class="mx-auto max-w-3xl px-6 py-12">
  <h2 class="font-display text-sm uppercase tracking-widest text-text-muted">Experience</h2>
  <ul class="mt-6 divide-y divide-surface">
    {roles.map((r) => (
      <li class="exp-row">
        <div>
          <p class="font-medium text-text">{r.company}</p>
          <p class="text-text-muted">{r.role}</p>
          <p class="mt-1 text-sm text-text-muted">{r.line}</p>
        </div>
        <p class="shrink-0 text-sm text-text-muted">{r.dates}</p>
      </li>
    ))}
  </ul>

  <!-- Projects slot. Add one or two real projects here when SafeSure / Parichay ship.
       Keep the same row rhythm as Experience. Do not populate now. -->
</section>
```

- [ ] **Step 3: Create `src/components/SocialLinks.astro`**

```astro
<section id="links" class="mx-auto max-w-3xl px-6 py-12">
  <h2 class="font-display text-sm uppercase tracking-widest text-text-muted">Links</h2>
  <ul class="mt-4 flex flex-wrap gap-x-8 gap-y-3">
    <li><a class="link" href="https://github.com/saranshseth93" rel="me noopener">GitHub</a></li>
    <li><a class="link" href="https://linkedin.com/in/saranshseth" rel="me noopener">LinkedIn</a></li>
    <li><a class="link" href="mailto:saranshseth93@gmail.com">Email</a></li>
  </ul>
</section>
```

Note: brand icons (Simple Icons) are added to these links in Task 11's enhancement only if time allows; plain text links satisfy the spec and accessibility. Keep `currentColor` if icons are added.

- [ ] **Step 4: Create `src/components/Hero.astro`** (portrait img wired in Task 8)

```astro
<section id="hero" class="mx-auto grid max-w-3xl gap-8 px-6 pt-12 pb-8 sm:grid-cols-[auto_1fr] sm:items-center">
  <div class="hero-portrait" aria-hidden="false">
    <!-- Task 8 inserts the optimised <img> here. Task 11 overlays the WebGL canvas. -->
  </div>
  <div>
    <h1 class="font-display text-4xl font-semibold sm:text-5xl">Saransh Seth</h1>
    <p class="mt-3 text-text-muted">Senior Frontend Engineer, Design Systems Tech Lead, Melbourne</p>
  </div>
</section>
```

- [ ] **Step 5: Add component classes to `global.css`**

```css
@layer components {
  .exp-row { @apply flex items-start justify-between gap-6 py-4; }
  .link { @apply text-text underline decoration-text-muted underline-offset-4 hover:decoration-accent; }
}
```

- [ ] **Step 6: Assemble `src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import ThemeSwitcher from "../components/ThemeSwitcher.astro";
import Hero from "../components/Hero.astro";
import Currently from "../components/Currently.astro";
import Experience from "../components/Experience.astro";
import SocialLinks from "../components/SocialLinks.astro";
---
<BaseLayout title="Saransh Seth, Senior Frontend Engineer and Design Systems Tech Lead" description="Senior Frontend Engineer and Design Systems Tech Lead in Melbourne. Token-driven theming, performance, and accessible interfaces.">
  <header class="mx-auto flex max-w-3xl justify-end px-6 py-6"><ThemeSwitcher /></header>
  <main>
    <Hero />
    <Currently />
    <Experience />
    <SocialLinks />
  </main>
  <footer class="mx-auto max-w-3xl px-6 py-12 text-sm text-text-muted">
    <p>Built with Astro and Tailwind. Melbourne, Australia.</p>
  </footer>
</BaseLayout>
```

- [ ] **Step 7: Manual check across themes**

Run: `npm run dev`. Confirm all sections render, copy is correct, and every section recolours when switching themes.
Expected: full readable page in all three themes. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/pages/index.astro src/styles/global.css
git commit -m "feat: page content and components"
```

---

### Task 5: SEO, self-hosted fonts, head metadata

**Files:**
- Modify: `src/layouts/BaseLayout.astro`, `src/styles/global.css`
- Create: `public/fonts/` (subset woff2), `public/favicon.svg`, `public/og.png`

**Interfaces:**
- Consumes: `BaseLayout` props `title`, `description`.
- Produces: full `<head>` with canonical, Open Graph, Twitter card, JSON-LD Person, preloaded fonts, `@font-face` declarations.

- [ ] **Step 1: Obtain and subset fonts**

Download the variable woff2 for Hanken Grotesk, plus JetBrains Mono and Press Start 2P (regular). Subset to Latin to keep payload small. If `fonttools` (`pip install fonttools brotli`) is available use `pyftsubset --unicodes=U+0000-00FF --flavor=woff2`; otherwise download the Latin-subset woff2 from the font's distribution and place files in `public/fonts/`:
`hanken-grotesk-var.woff2`, `jetbrains-mono.woff2`, `press-start-2p.woff2`.

Expected: three woff2 files under `public/fonts/`, each well under 100KB (Hanken variable may be larger; if over ~120KB, subset harder).

- [ ] **Step 2: Add `@font-face` and preload-friendly declarations to `global.css`**

Add at the top, after `@import "tailwindcss";`:

```css
@font-face {
  font-family: "Hanken Grotesk";
  src: url("/fonts/hanken-grotesk-var.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono.woff2") format("woff2");
  font-weight: 400 700;
  font-display: swap;
}
@font-face {
  font-family: "Press Start 2P";
  src: url("/fonts/press-start-2p.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
```

- [ ] **Step 3: Add full head metadata to `BaseLayout.astro`**

Add inside `<head>` before the inline theme script:

```astro
    <link rel="canonical" href="https://saranshseth.me/" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preload" href="/fonts/hanken-grotesk-var.woff2" as="font" type="font/woff2" crossorigin />
    <meta name="theme-color" content="#0E0E12" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content="https://saranshseth.me/" />
    <meta property="og:image" content="https://saranshseth.me/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json" set:html={JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Saransh Seth",
      jobTitle: "Senior Frontend Engineer, Design Systems Tech Lead",
      address: { "@type": "PostalAddress", addressLocality: "Melbourne", addressCountry: "AU" },
      url: "https://saranshseth.me",
      sameAs: ["https://github.com/saranshseth93", "https://linkedin.com/in/saranshseth"],
    })} />
```

- [ ] **Step 4: Create `public/favicon.svg`** (simple monogram, recolours with currentColor not needed for favicon)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0E0E12"/><text x="16" y="22" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="#EDEAE3" text-anchor="middle">S</text></svg>
```

- [ ] **Step 5: Create `public/og.png`**

Generate a 1200x630 PNG showing the name and tagline on the Midnight background. The Task 7 sharp script can render this from a simple SVG, or hand-create it. Place at `public/og.png`.

- [ ] **Step 6: Build and inspect**

Run: `npm run build`
Expected: build succeeds. Confirm `dist/index.html` contains the JSON-LD, OG tags, and font preload.

- [ ] **Step 7: Commit**

```bash
git add public/ src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "feat: SEO metadata, self-hosted fonts, favicon, OG image"
```

---

### Task 6 (GATE): Phase 1 verification

**Files:** none (verification only).

- [ ] **Step 1: Run unit tests**

Run: `npm test`
Expected: all tests pass (contrast + theme).

- [ ] **Step 2: Measure production CSS size**

Run: `npm run build` then check the emitted CSS:
`find dist -name "*.css" -exec sh -c 'gzip -c "$1" | wc -c' _ {} \;`
Expected: total well under 20KB (20480 bytes) gzipped. If larger, content scanning is misconfigured; do not proceed until fixed.

- [ ] **Step 3: Lighthouse on all three themes**

Run: `npm run preview`, then run Lighthouse (Chrome devtools or `npx lighthouse <url> --preset=desktop`) for the default render, and again after setting each `data-theme` and persisting.
Expected: 95+ on Performance, Accessibility, Best Practices, SEO in every theme. Fix any gaps before moving on.

- [ ] **Step 4: No-JS check**

Disable JavaScript in the browser and reload.
Expected: Midnight theme, all content readable, no broken layout.

- [ ] **Step 5: Create the GitHub repo and push**

```bash
gh repo create saranshseth93/portfolio --public --source=. --remote=origin --description "Personal portfolio. Token-driven three-theme system with a cursor-revealed hero." --push
```
Expected: repo created, phase 1 history pushed. (Confirm with the user before running, since this is outward-facing.)

---

## Phase 2: Image pipeline

### Task 7: Background cutout and responsive image generation

**Files:**
- Create: `scripts/cutout.swift`, `scripts/build-images.mjs`
- Modify: `package.json` (already has `images` script)
- Produces (generated, git-ignored except where noted): `src/assets/portrait/cutout.png`, `portrait-{600,1200}.{avif,webp}`, `lqip.txt`

**Interfaces:**
- Produces: a 1200px and 600px AVIF + WebP cutout with alpha, and `lqip.txt` containing a `data:image/...` URI string consumed by `Hero.astro` in Task 8.

- [ ] **Step 1: Create `scripts/cutout.swift`** (native Vision foreground mask)

```swift
// Removes the background from a photo using the macOS Vision foreground
// instance mask. Usage: swift scripts/cutout.swift <input.png> <output.png>
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count == 3 else { FileHandle.standardError.write("usage: cutout.swift <in> <out>\n".data(using: .utf8)!); exit(2) }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
guard let ciImage = CIImage(contentsOf: inURL) else { fputs("cannot read input\n", stderr); exit(1) }

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
try handler.perform([request])
guard let result = request.results?.first else { fputs("no foreground found\n", stderr); exit(1) }
let maskBuffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
let masked = CIImage(cvPixelBuffer: maskBuffer)

let ctx = CIContext()
guard let cg = ctx.createCGImage(masked, from: masked.extent) else { fputs("render failed\n", stderr); exit(1) }
let rep = NSBitmapImageRep(cgImage: cg)
guard let png = rep.representation(using: .png, properties: [:]) else { fputs("encode failed\n", stderr); exit(1) }
try png.write(to: outURL)
print("wrote \(outURL.path)")
```

- [ ] **Step 2: Run the cutout**

Run: `swift scripts/cutout.swift src/assets/portrait/source.png src/assets/portrait/cutout.png`
Expected: `cutout.png` written with a transparent background. Open it and verify the subject (including the dark shirt) is intact and the background is gone. If the shirt is cut away or edges are poor, fall back to rembg: `python3 -m pip install --user rembg[cpu] && python3 -c "from rembg import remove; import sys; open('src/assets/portrait/cutout.png','wb').write(remove(open('src/assets/portrait/source.png','rb').read()))"`.

- [ ] **Step 3: Create `scripts/build-images.mjs`**

```js
// Generates responsive AVIF/WebP from the transparent cutout plus an LQIP
// data URI. Run: npm run images
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SRC = "src/assets/portrait/cutout.png";
const OUT = "src/assets/portrait";
const widths = [600, 1200];

for (const w of widths) {
  const base = sharp(SRC).resize({ width: w, withoutEnlargement: true });
  await base.clone().avif({ quality: 60 }).toFile(`${OUT}/portrait-${w}.avif`);
  await base.clone().webp({ quality: 72 }).toFile(`${OUT}/portrait-${w}.webp`);
}

// Tiny blurred placeholder inlined as a data URI.
const lqip = await sharp(SRC).resize({ width: 20 }).webp({ quality: 30 }).toBuffer();
writeFileSync(`${OUT}/lqip.txt`, `data:image/webp;base64,${lqip.toString("base64")}`);

// Report sizes.
for (const w of widths) {
  for (const ext of ["avif", "webp"]) {
    const { size } = await sharp(`${OUT}/portrait-${w}.${ext}`).metadata().then(() => import("node:fs")).then((fs) => fs.statSync(`${OUT}/portrait-${w}.${ext}`));
    console.log(`portrait-${w}.${ext}: ${(size / 1024).toFixed(1)}KB`);
  }
}
```

- [ ] **Step 4: Run the pipeline**

Run: `npm run images`
Expected: four image files and `lqip.txt` created. The 1200 AVIF should be roughly 40 to 90KB. Confirm transparency is preserved in the AVIF/WebP.

- [ ] **Step 5: Commit** (commit generated images so the build and shader have them without rerunning native tools in CI)

```bash
git add scripts/cutout.swift scripts/build-images.mjs src/assets/portrait/cutout.png src/assets/portrait/portrait-*.avif src/assets/portrait/portrait-*.webp src/assets/portrait/lqip.txt
git commit -m "feat: portrait cutout and responsive image pipeline"
```

---

### Task 8: Wire the static portrait into the hero

**Files:**
- Modify: `src/components/Hero.astro`, `src/styles/global.css`

**Interfaces:**
- Consumes: `portrait-{600,1200}.{avif,webp}`, `lqip.txt`.
- Produces: an LCP `<picture>`/`<img>` with srcset, explicit dimensions, LQIP blur-up, and a `data-hero-portrait` hook for the Task 11 shader.

- [ ] **Step 1: Replace the portrait placeholder in `Hero.astro`**

```astro
---
import lqip from "../assets/portrait/lqip.txt?raw";
import a1200 from "../assets/portrait/portrait-1200.avif";
import a600 from "../assets/portrait/portrait-600.avif";
import w1200 from "../assets/portrait/portrait-1200.webp";
import w600 from "../assets/portrait/portrait-600.webp";
// Cutout aspect ratio from source 1792x2390. Adjust if cropping changed it.
const W = 480, H = 640;
---
<section id="hero" class="mx-auto grid max-w-3xl gap-8 px-6 pt-12 pb-8 sm:grid-cols-[auto_1fr] sm:items-center">
  <div class="hero-portrait" data-hero-portrait>
    <picture>
      <source type="image/avif" srcset={`${a600} 600w, ${a1200} 1200w`} sizes="(max-width: 640px) 60vw, 240px" />
      <source type="image/webp" srcset={`${w600} 600w, ${w1200} 1200w`} sizes="(max-width: 640px) 60vw, 240px" />
      <img
        src={w1200} width={W} height={H} fetchpriority="high" decoding="async"
        alt="Black and white portrait of Saransh Seth wearing aviator sunglasses, a city skyline reflected in the lenses."
        class="portrait-img" style={`background-image:url(${lqip.trim()});background-size:cover;`}
        onload="this.style.backgroundImage='none'"
      />
    </picture>
  </div>
  <div>
    <h1 class="font-display text-4xl font-semibold sm:text-5xl">Saransh Seth</h1>
    <p class="mt-3 text-text-muted">Senior Frontend Engineer, Design Systems Tech Lead, Melbourne</p>
  </div>
</section>
```

- [ ] **Step 2: Add portrait styles to `global.css`**

```css
@layer components {
  .hero-portrait { @apply relative w-40 sm:w-60; }
  .portrait-img { @apply h-auto w-full select-none; }
}
```

- [ ] **Step 3: Manual check + CLS**

Run: `npm run dev`. Confirm the portrait shows on the theme background with no visible box or hard edge, blur-up works, and no layout shift on load (devtools Performance: CLS ~0).
Expected: portrait dissolves into the page in all three themes. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro src/styles/global.css
git commit -m "feat: wire optimised portrait into hero with blur-up"
```

---

## Phase 3: Boot sequence

### Task 9: Boot typing sequence, reduced-motion aware

**Files:**
- Create: `src/components/BootSequence.astro`, `src/scripts/boot.ts`, `tests/boot.test.ts`
- Modify: `src/components/Hero.astro`

**Interfaces:**
- Produces: `boot.ts` exporting `buildBootFrames(): string[]` (the readout lines) and `runBoot(target: HTMLElement, opts: { reducedMotion: boolean, onDone?: () => void }): void`. Under reduced motion it writes the final state immediately and calls `onDone`.

- [ ] **Step 1: Write the failing test `tests/boot.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/boot.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Create `src/scripts/boot.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/boot.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Create `src/components/BootSequence.astro`**

```astro
<pre class="boot" data-boot aria-hidden="true"></pre>

<script>
  import { runBoot } from "../scripts/boot";
  const el = document.querySelector<HTMLElement>("[data-boot]");
  if (el) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    runBoot(el, { reducedMotion: reduced, onDone: () => el.classList.add("boot-done") });
  }
</script>
```

- [ ] **Step 6: Mount boot in `Hero.astro`** and add styles to `global.css`

In `Hero.astro`, import and place `<BootSequence />` above the `<h1>` in the text column. The `<h1>` and tagline are the real, always-present content; the boot `<pre>` is decorative (`aria-hidden`) and sits above them.

```css
@layer components {
  .boot { @apply mb-4 font-body text-xs leading-relaxed text-text-muted whitespace-pre-wrap; }
}
@media (prefers-reduced-motion: reduce) {
  .boot { @apply m-0; }
}
```

- [ ] **Step 7: Manual check**

Run: `npm run dev`. Confirm the boot lines type in then settle, total under ~1.5s. Toggle reduced motion (devtools rendering pane) and reload: boot shows final state instantly, name and tagline always present.
Expected: animation and reduced-motion paths both correct. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add src/scripts/boot.ts src/components/BootSequence.astro src/components/Hero.astro src/styles/global.css tests/boot.test.ts
git commit -m "feat: boot sequence with reduced-motion support"
```

---

## Phase 4: Static themed portrait treatments

### Task 10: Per-theme CSS/SVG portrait treatments and overlays

**Files:**
- Modify: `src/styles/global.css`, `src/layouts/BaseLayout.astro` (SVG filter defs) or `src/components/Hero.astro`

**Interfaces:**
- Consumes: `data-theme` on `<html>`, `.portrait-img`.
- Produces: a distinct static portrait look per theme (Midnight high-contrast B&W, Pixel green/amber quantised dither feel, Blueprint cyan edge/duotone) plus theme overlays (Pixel scanlines + vignette, Blueprint hairline grid), all disabled under reduced motion where animated.

- [ ] **Step 1: Add SVG filter defs** (inline, once) in `Hero.astro` near the portrait

```astro
<svg width="0" height="0" aria-hidden="true" style="position:absolute">
  <filter id="px-dither"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 0.36 0.9"/><feFuncG type="discrete" tableValues="0.04 0.55 0.95"/><feFuncB type="discrete" tableValues="0 0.2 0.4"/></feComponentTransfer></filter>
  <filter id="bp-edge"><feColorMatrix type="saturate" values="0"/><feConvolveMatrix order="3" kernelMatrix="1 0 -1 2 0 -2 1 0 -1" preserveAlpha="true"/><feComponentTransfer><feFuncR type="linear" slope="0.3"/><feFuncG type="linear" slope="0.76"/><feFuncB type="linear" slope="0.97"/></feComponentTransfer></filter>
</svg>
```

- [ ] **Step 2: Apply per-theme treatment in `global.css`**

```css
/* Midnight: clean B&W with a slight contrast lift. */
[data-theme="midnight"] .portrait-img { filter: grayscale(1) contrast(1.08); }
/* Pixel: quantised green/amber, pixelated edges. */
[data-theme="pixel"] .portrait-img { filter: url(#px-dither); image-rendering: pixelated; }
/* Blueprint: cyan edge-detect line drawing. */
[data-theme="blueprint"] .portrait-img { filter: url(#bp-edge); }
```

- [ ] **Step 3: Add theme overlays in `global.css`** (decorative, reduced-motion safe)

```css
.hero-portrait { isolation: isolate; }
[data-theme="pixel"] .hero-portrait::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px),
              radial-gradient(120% 120% at 50% 40%, transparent 55%, rgba(0,0,0,0.5));
  mix-blend-mode: multiply;
}
[data-theme="blueprint"] .hero-portrait::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(rgba(79,195,247,0.10) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(79,195,247,0.10) 1px, transparent 1px);
  background-size: 16px 16px;
}
@media (prefers-reduced-motion: reduce) {
  [data-theme="pixel"] .hero-portrait::after { background: radial-gradient(120% 120% at 50% 40%, transparent 60%, rgba(0,0,0,0.4)); }
}
```

- [ ] **Step 4: Manual check**

Run: `npm run dev`. Switch themes; confirm each portrait treatment reads clearly (B&W, retro green, cyan line drawing) and overlays appear only in their theme. Confirm contrast of surrounding text is unaffected.
Expected: three distinct static treatments. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/components/Hero.astro
git commit -m "feat: per-theme static portrait treatments and overlays"
```

---

## Phase 5: WebGL cursor-reveal shader

### Task 11: Guarded WebGL reveal as progressive enhancement

**Files:**
- Create: `src/scripts/hero-shader.ts`, `src/scripts/shaders/reveal.vert`, `src/scripts/shaders/reveal.frag`, `tests/shader-fallback.test.ts`
- Modify: `src/components/Hero.astro`

**Interfaces:**
- Consumes: `[data-hero-portrait]` container, the 1200 portrait as the texture (`portrait-1200.webp` or a PNG export of the cutout for guaranteed alpha).
- Produces: `hero-shader.ts` exporting `shouldEnableShader(env: { reducedMotion: boolean, finePointer: boolean, hasWebGL: boolean }): boolean` (pure, testable) and `initHeroShader(): void` (lazy, guarded). The fragment shader generates the per-theme treatment and a feathered radial mask reveals the original under the pointer.

- [ ] **Step 1: Write the failing test `tests/shader-fallback.test.ts`**

```ts
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
  it("disables without a fine pointer", () => {
    expect(shouldEnableShader({ ...base, finePointer: false })).toBe(false);
  });
  it("disables without WebGL", () => {
    expect(shouldEnableShader({ ...base, hasWebGL: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shader-fallback.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Create the shaders**

`src/scripts/shaders/reveal.vert`:

```glsl
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 1.0 - (a_pos.y * 0.5 + 0.5));
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
```

`src/scripts/shaders/reveal.frag`:

```glsl
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_mouse;     // normalised, -1 when absent
uniform float u_radius;   // reveal radius in uv units
uniform int u_theme;      // 0 midnight, 1 pixel, 2 blueprint
uniform vec2 u_res;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 treat(vec2 uv) {
  vec4 src = texture2D(u_tex, uv);
  float g = luma(src.rgb);
  vec3 col = vec3(g);
  if (u_theme == 1) {
    float q = floor(g * 3.0) / 2.0;            // quantise
    col = mix(vec3(0.36, 0.90, 0.36), vec3(1.0, 0.69, 0.0), step(0.66, g)) * (0.3 + q);
  } else if (u_theme == 2) {
    vec2 px = 1.0 / u_res;
    float gx = luma(texture2D(u_tex, uv + vec2(px.x, 0.0)).rgb) - luma(texture2D(u_tex, uv - vec2(px.x, 0.0)).rgb);
    float gy = luma(texture2D(u_tex, uv + vec2(0.0, px.y)).rgb) - luma(texture2D(u_tex, uv - vec2(0.0, px.y)).rgb);
    float edge = clamp(length(vec2(gx, gy)) * 4.0, 0.0, 1.0);
    col = vec3(0.31, 0.76, 0.97) * edge;
  } else {
    col = vec3(clamp(g * 1.08, 0.0, 1.0));     // midnight contrast lift
  }
  return col * src.a;
}

void main() {
  vec4 src = texture2D(u_tex, v_uv);
  vec3 treated = treat(v_uv);
  vec3 original = vec3(luma(src.rgb)) * src.a;
  float reveal = 0.0;
  if (u_mouse.x > -0.5) {
    float d = distance(v_uv, u_mouse);
    reveal = 1.0 - smoothstep(u_radius * 0.6, u_radius, d); // feathered edge
  }
  vec3 col = mix(treated, original, reveal);
  gl_FragColor = vec4(col, src.a);
}
```

- [ ] **Step 4: Create `src/scripts/hero-shader.ts`**

```ts
import vertSrc from "./shaders/reveal.vert?raw";
import fragSrc from "./shaders/reveal.frag?raw";
import texUrl from "../assets/portrait/cutout.png";

export function shouldEnableShader(env: {
  reducedMotion: boolean; finePointer: boolean; hasWebGL: boolean;
}): boolean {
  return !env.reducedMotion && env.finePointer && env.hasWebGL;
}

const THEME_INDEX: Record<string, number> = { midnight: 0, pixel: 1, blueprint: 2 };

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src); gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}

export function initHeroShader(): void {
  const host = document.querySelector<HTMLElement>("[data-hero-portrait]");
  const img = host?.querySelector<HTMLImageElement>(".portrait-img");
  if (!host || !img) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const probe = document.createElement("canvas");
  const hasWebGL = !!(probe.getContext("webgl") || probe.getContext("experimental-webgl"));
  if (!shouldEnableShader({ reducedMotion, finePointer, hasWebGL })) return;

  const canvas = document.createElement("canvas");
  canvas.className = "portrait-canvas";
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const sizeCanvas = () => {
    const r = host.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    canvas.style.width = `${r.width}px`; canvas.style.height = `${r.height}px`;
  };

  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true })!;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uMouse = u("u_mouse"), uRadius = u("u_radius"), uTheme = u("u_theme"), uRes = u("u_res");

  const load = new Image();
  load.crossOrigin = "anonymous"; load.src = texUrl;
  let mouse = { x: -1, y: -1 }, raf = 0, visible = true, ready = false;

  const render = () => {
    raf = 0;
    if (!visible || document.hidden || !ready) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uRadius, 0.28);
    gl.uniform1i(uTheme, THEME_INDEX[document.documentElement.dataset.theme ?? "midnight"] ?? 0);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const requestRender = () => { if (!raf) raf = requestAnimationFrame(render); };

  load.onload = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, load);
    sizeCanvas(); ready = true; img.style.visibility = "hidden"; host.appendChild(canvas);
    requestRender();
  };

  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    mouse = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    requestRender();
  });
  host.addEventListener("pointerleave", () => { mouse = { x: -1, y: -1 }; requestRender(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) requestRender(); });
  window.addEventListener("resize", () => { sizeCanvas(); requestRender(); });
  new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; if (visible) requestRender(); }).observe(host);

  // Re-render on theme change so the in-shader treatment updates.
  new MutationObserver(requestRender).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/shader-fallback.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Lazy-init after first paint in `Hero.astro`**

Add a script that defers init until idle, so the shader never competes with LCP:

```astro
<script>
  import { initHeroShader } from "../scripts/hero-shader";
  const start = () => initHeroShader();
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 2000 });
  else window.addEventListener("load", () => setTimeout(start, 200));
</script>
```

- [ ] **Step 7: Add canvas positioning to `global.css`**

```css
@layer components {
  .portrait-canvas { @apply absolute inset-0 h-full w-full; }
}
```

- [ ] **Step 8: Manual check**

Run: `npm run dev` on a desktop with a mouse. Move the cursor over the portrait; the original sharp B&W reveals under a soft circle, with the themed treatment everywhere else. Switch themes; the treatment changes. Touch device / reduced motion / no WebGL: static image only, no canvas.
Expected: reveal works in all themes; fallbacks correct. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add src/scripts/hero-shader.ts src/scripts/shaders/ src/components/Hero.astro src/styles/global.css tests/shader-fallback.test.ts
git commit -m "feat: guarded WebGL cursor-reveal shader"
```

---

## Phase 6: Final verification, repo, README

### Task 12: Re-verify, push, and write the README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: all suites pass (contrast, theme, boot, shader-fallback).

- [ ] **Step 2: Re-run Lighthouse with the shader present**

Run: `npm run build && npm run preview`, then Lighthouse desktop on each theme.
Expected: still 95+ on all four categories. If Performance dropped from the shader, increase the idle timeout or gate init behind `load`. Confirm LCP under 1.5s (the portrait `<img>`, not the canvas).

- [ ] **Step 3: Re-measure CSS gzip size**

Run: `find dist -name "*.css" -exec sh -c 'gzip -c "$1" | wc -c' _ {} \;`
Expected: still well under 20KB.

- [ ] **Step 4: Write `README.md`** using the humanizer skill

Invoke the humanizer skill and write a concise README covering: what the site is, the three-theme token architecture and why it exists, the hero cursor-reveal, the stack, local dev (`npm install`, `npm run dev`, `npm run images`, `npm test`), the image pipeline (cutout + sharp), and the deploy target (Cloudflare Pages). Apply the writing rules: no emojis, no em dashes, no AI-jargon, short sentences.

- [ ] **Step 5: Final commit and push**

```bash
git add README.md
git commit -m "docs: add README"
git push
```

- [ ] **Step 6: Finishing the branch**

Invoke superpowers:finishing-a-development-branch to decide on merge/PR/cleanup.

---

### Task 13: GitHub Actions deploy to GitHub Pages

Added per user request. Deploy target is the project repo `saranshseth93/portfolio`, so the
live URL is `https://saranshseth93.github.io/portfolio`. This supersedes the spec's Cloudflare
Pages target. A custom domain (saranshseth.me) comes later; the config is written so that switch
is a one-line change.

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `astro.config.mjs` (site + base), `src/layouts/BaseLayout.astro` (derive head URLs from `Astro.site`)

**Interfaces:**
- Produces: a CI workflow that builds the site and publishes to GitHub Pages on push to `main`.

- [ ] **Step 1: Set `site` and `base` in `astro.config.mjs`**

For the project-page deploy. One `SITE`/`BASE` pair, so the custom-domain switch later is a single edit.

```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Project-page deploy: https://saranshseth93.github.io/portfolio
// For the custom domain later, set site to "https://saranshseth.me" and base to "/".
export default defineConfig({
  site: "https://saranshseth93.github.io",
  base: "/portfolio",
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 2: Derive absolute head URLs from `Astro.site` in `BaseLayout.astro`**

Replace the hardcoded `https://saranshseth.me/...` URLs in canonical, og:url, og:image, twitter:image, and JSON-LD with values built from `Astro.site` so they are correct on whatever domain ships. In the frontmatter:

```astro
const canonical = new URL(Astro.url.pathname, Astro.site).href;
const ogImage = new URL(`${import.meta.env.BASE_URL}og.png`, Astro.site).href;
```

Use `canonical` for `<link rel="canonical">`, `og:url`, and JSON-LD `url`; use `ogImage` for `og:image` and `twitter:image`. The favicon and font preload hrefs must include the base: prefix them with `import.meta.env.BASE_URL` (e.g. `${import.meta.env.BASE_URL}fonts/hanken-grotesk-var.woff2`). Astro prefixes asset and `<img>` import URLs with base automatically, but literal hrefs in the head do not get the prefix, so add it explicitly.

- [ ] **Step 3: Verify base-aware build locally**

Run: `npm run build` then check `dist/index.html`: the canonical and og:url should be `https://saranshseth93.github.io/portfolio/`, and the font preload / favicon hrefs should start with `/portfolio/`. Run `npm run preview` and confirm the page and fonts load under the `/portfolio` base.

- [ ] **Step 4: Create `.github/workflows/deploy.yml`**

Uses the official Astro GitHub Pages action, which handles base-path and Pages artifact upload.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Enable Pages and push**

Set the repo Pages source to GitHub Actions, then push to `main`:

```bash
gh api -X POST repos/saranshseth93/portfolio/pages -f build_type=workflow 2>/dev/null || true
git push origin main
gh run watch
```

Confirm the workflow succeeds and the site is live at `https://saranshseth93.github.io/portfolio`.

- [ ] **Step 6: Custom domain note**

When ready for saranshseth.me: set `astro.config.mjs` site to `https://saranshseth.me` and base to `/`, add a `public/CNAME` file containing `saranshseth.me`, configure the domain in the repo Pages settings and the DNS, then push. The head URLs already follow `Astro.site`, so no other code changes are needed.

---

## Self-Review

**Spec coverage:**
- Stack (Astro + Tailwind v4, no framework): Task 1. PASS
- `@theme` tokens + 3 themes + instant swap + localStorage + no-flash: Tasks 2, 3. PASS
- Small CSS output verified: Task 6 gate, Task 12. PASS
- Semantic utilities only, `@apply` components: Tasks 2, 3, 4. PASS
- Accessible theme switcher (buttons, keyboard, aria-pressed): Task 3. PASS
- All content sections + commented projects placeholder: Task 4. PASS
- SEO/meta/JSON-LD, self-hosted preloaded fonts, favicon, OG: Task 5. PASS
- Lighthouse 95+ and AA contrast gates: Tasks 2 (contrast test), 6, 12. PASS
- Image prep (cutout, AVIF/WebP, srcset, LQIP, dims, alt): Tasks 7, 8. PASS
- Boot sequence reduced-motion aware: Task 9. PASS
- Static per-theme treatments + overlays: Task 10. PASS
- WebGL reveal with all guards (lazy, DPR cap, IO pause, visibility, pointer:fine, reduced-motion): Task 11. PASS
- No-JS path (Midnight, static portrait, readable): Tasks 1-5 server render, Task 6 check. PASS
- Icons (Lucide/Simple Icons, currentColor): noted in Task 4; plain links satisfy the requirement, icons optional enhancement. PASS
- GitHub repo + README (humanizer): Tasks 6, 12. PASS
- Writing rules (no emoji/em-dash/jargon): Global Constraints, applied in all copy. PASS

**Placeholder scan:** No TBD/TODO left as work items. The one in-code comment is the deliberate projects slot required by the spec. PASS

**Type consistency:** `applyTheme`/`getStoredTheme`/`initThemeSwitcher`, `buildBootFrames`/`runBoot`, `shouldEnableShader`/`initHeroShader` are used consistently across tasks and tests. Theme name set `["midnight","pixel","blueprint"]` is identical in `theme.ts`, `themes.ts`, and `THEME_INDEX`. PASS
