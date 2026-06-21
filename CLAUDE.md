# saranshseth.me: Portfolio Build Spec

A single-page personal portfolio for a senior frontend engineer / design systems tech lead. The page itself is the proof of skill. No project tiles, no broken links, no backend. The signature is a theme system that transforms a hero portrait three different ways, with a cursor-driven reveal of the real photo underneath.

This replaces the current saranshseth.me. Deploy target: GitHub Pages on the custom apex domain saranshseth.me, with DNS through Cloudflare.

## Writing rules (apply to all copy and code comments)

- No emojis anywhere. Not in copy, not in comments, not in commit messages.
- No em dashes (the long dash) anywhere. Use commas, full stops, or colons instead. A normal hyphen in compound words is fine.
- No AI-jargon: avoid "leverage", "ecosystem", "deep dive", "wheelhouse", "synergy", "alignment", "utilise", "seamless", "robust", "streamline". Plain words.
- Short, direct sentences. Let the work speak; do not oversell in prose.

## Skills and workflow

Use the right skills rather than working from scratch. Check whether each is installed; if not, install it, then use it.

Phase-to-phase planning and implementation:
- Use Superpowers (by obra) for the whole build. Run its brainstorm, then write-plan, then execute-plan workflow so the project moves through clear phases with sign-off between them.
- Install via the Claude plugin marketplace if not already present:
  - `/plugin marketplace add obra/superpowers-marketplace`
  - `/plugin install superpowers@superpowers-marketplace`
- Then drive the build with `/superpowers:brainstorm`, `/superpowers:write-plan`, `/superpowers:execute-plan`.
- Note: Superpowers enforces TDD and a deliberate multi-phase process. Honour it, but this is a static single-page site, so keep tests proportional (theme switching logic, the shader fallback path, accessibility checks) rather than over-testing trivial markup.

Design and frontend:
- Use the built-in `frontend-design` skill for visual direction, typography, and avoiding templated defaults. It is already available, no install needed.

Copy and SEO:
- Use the copywriting and SEO skills from coreyhaines31/marketingskills for the page copy and on-page SEO (meta tags, structured data, semantic headings).
- Install the specific skills if not present, e.g.: `npx skills add coreyhaines31/marketingskills --skill copywriting seo`
- Correct GitHub handle is coreyhaines31 (not a similar spelling). Verify the skill names after cloning, since the repo may rename them.

Optional, only if already installed (do not fail the build trying to fetch these; skip if unavailable):
- Any local "impeccable", "web design guidelines", or "programmatic SEO" skills the user has. If present in the skills directory, apply them. If not present, do not attempt to install from an unverified source; proceed with frontend-design and the coreyhaines31 skills instead.

When applying any skill, keep it subordinate to the rules in this file. If a skill's default conflicts with the writing rules or the performance goals above, this file wins.

## Non-negotiable goals

These are the pitch. If the site fails these, it actively hurts the job application.

- Lighthouse 95+ on all four categories (Performance, Accessibility, Best Practices, SEO).
- Tailwind output stays small: verify the production CSS is well under 20KB gzipped. If it's larger, content scanning is misconfigured.
- LCP under 1.5s on a mid-tier laptop. The hero portrait (static themed image) is the LCP element. It must be a fully optimised AVIF with a WebP fallback and an explicit width/height to avoid CLS.
- All text is real, server-rendered HTML. The WebGL canvas is decorative only and must never hold real content.
- WCAG 2.1 AA. Every theme's text/background pairing must pass contrast. Visible keyboard focus everywhere. The theme switcher is real buttons, keyboard operable, with aria-pressed state.
- `prefers-reduced-motion: reduce` disables the boot typing, the scanlines, and the cursor shader. Reduced-motion users see the clean static themed image and instant theme swaps.
- Self-hosted fonts, subset and preloaded. No external font CDN.
- Works with JS disabled: shows Midnight theme, static portrait, all content readable.

## Stack

Astro + Tailwind CSS v4. No JS framework runtime (no React/Vue). Astro ships zero JS by default, which keeps this a static, fast page; the only JS is the theme switcher, boot sequence, and the hero shader, all as small islands or plain scripts.

Tailwind v4 is the styling layer AND the design-token system (see below). The WebGL hero shader is one small shader on one canvas, lazy-initialised after first paint. Prefer raw WebGL or a tiny helper over three.js unless the gzipped cost stays trivial.

### Why Tailwind here, and the guardrail

The point of using Tailwind v4 is to demonstrate token-driven theming at the `@theme` layer, which is the candidate's actual specialty (design systems). This only works as a signal if the output is clean, because reviewers will open devtools and read the source.

- Production build with proper content scanning so Tailwind emits ONLY used utilities. Verify the final CSS payload is small (target well under 20KB gzipped for a single page). If it's large, the config is wrong.
- Keep markup tidy. Do NOT produce utility soup. Where a pattern repeats (buttons, the theme swatches, experience rows), extract it to an Astro component or a small `@apply` class so the HTML stays readable. A reviewer should see intent, not 30 utility classes per element.
- All theming flows through semantic tokens defined in `@theme`, never hardcoded colours in markup. `text-accent`, `bg-surface`, not `text-[#8B2252]`.

## The three themes

Themes are driven by design tokens defined in Tailwind v4's `@theme` block, then overridden per theme via a `data-theme` attribute on the `<html>` element. Switching themes flips one attribute and every token-based utility recolours. No re-render, no JS recolouring. This is deliberate: it demonstrates design-token architecture, the candidate's actual specialty. Keep the token layer clean and inspectable, because reviewers will open devtools.

### Token structure (Tailwind v4 `@theme`)

Define the design tokens once in a global stylesheet using Tailwind v4's `@theme` directive. These generate the utilities (`bg-bg`, `text-accent`, `font-display`, etc.). Then override the raw CSS variables per theme with `[data-theme="..."]` selectors so every utility recolours automatically when the attribute flips. No re-render, no JS recolouring.

```css
@import "tailwindcss";

@theme {
  /* default (Midnight): these become Tailwind utilities */
  --color-bg: #0E0E12;
  --color-surface: #16161C;
  --color-text: #EDEAE3;
  --color-text-muted: #9A968C;
  --color-accent: #8B2252;
  --color-accent-2: #C9A227;
  --color-focus: #C9A227;

  --font-display: "Hanken Grotesk Variable", system-ui, sans-serif;
  --font-body: "Hanken Grotesk Variable", system-ui, sans-serif;
}

/* Pixel theme override */
[data-theme="pixel"] {
  --color-bg: #0B0E0A;
  --color-surface: #11160F;
  --color-text: #C7F2A4;       /* verify AA vs bg; brighten or restrict to headings if it fails */
  --color-text-muted: #6E8C5A;
  --color-accent: #5CE65C;
  --color-accent-2: #FFB000;
  --color-focus: #FFB000;
  --font-display: "Press Start 2P", monospace;  /* small sizes only */
  --font-body: "JetBrains Mono", ui-monospace, monospace;
}

/* Blueprint theme override */
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
```

Markup then only ever references semantic utilities: `class="bg-bg text-text"`, `class="text-accent font-display"`. Switching `data-theme` on `<html>` swaps everything. This is the design-token architecture made visible and inspectable, which is the whole point.

Persist the chosen theme in `localStorage`. NOTE: this is a real deployed site, not a Claude artifact, so `localStorage` is fine and expected. Read it inline in the `<head>` before first paint to avoid a flash of the wrong theme.

### Theme 1: Midnight (default)

The professional. Matches the candidate's resume identity (Charcoal Burgundy).

- `--bg`: #0E0E12
- `--surface`: #16161C
- `--text`: #EDEAE3
- `--text-muted`: #9A968C
- `--accent`: #8B2252 (burgundy)
- `--accent-2`: #C9A227 (muted gold, use sparingly)
- `--display-font`: a variable grotesque or characterful sans (e.g. Geist, Hanken Grotesk, or Fraunces Variable for contrast). Pick one with a variable weight axis.
- `--body-font`: clean utility sans.
- Portrait treatment: clean high-contrast black and white. Slight contrast lift only.
- Overlay: none.

### Theme 2: Pixel (retro gaming)

Personality. Ties to the candidate's retro-gaming and pixel-art identity.

- `--bg`: #0B0E0A (near-black with green cast)
- `--surface`: #11160F
- `--text`: #C7F2A4 (phosphor green), verify AA against bg
- `--text-muted`: #6E8C5A
- `--accent`: #39FF14-ish but dialled back for contrast comfort, e.g. #5CE65C
- `--accent-2`: #FFB000 (amber) for secondary
- `--display-font`: a pixel/bitmap font (e.g. "Press Start 2P" used at small sizes only, or a cleaner pixel face for headings). Body stays readable mono.
- Portrait treatment: ordered-dither pixelation (Bayer matrix), quantised to the green/amber ramp. Recognisable but clearly retro.
- Overlay: CRT scanlines (subtle, low opacity) + faint vignette. Disabled under reduced-motion.

### Theme 3: Blueprint (technical)

The systems thinker. Forward-looking, engineered, the strongest "DS lead" signal.

- `--bg`: #0A1830 (deep blueprint blue)
- `--surface`: #0E2142
- `--text`: #DCEAF7
- `--text-muted`: #7FA6CC
- `--accent`: #4FC3F7 (cyan)
- `--accent-2`: #A7D8FF
- `--display-font`: a technical mono or a precise geometric sans.
- `--body-font`: mono or near-mono.
- Portrait treatment: cyan edge-detect / line-drawing look (Sobel-style) on the blueprint blue, or a cyan duotone with a faint blueprint registration. Reads like a technical drawing of the person.
- Overlay: hairline grid (very low opacity), like drafting paper.

## Icons

Use a free, open-source icon library. Do NOT hand-build custom icons or generate one-off SVGs per icon; pick one cohesive set and pull from it. A single consistent set reads as more intentional than mixed custom marks, and it saves build time.

- Pick ONE library and use it throughout, for visual consistency. Good options that suit a dark, minimal, technical aesthetic: Lucide (clean, thin, geometric, the strongest fit here), Phosphor (has weight variants that pair well with the theme system), or Tabler Icons. Lucide is the default choice unless there is a reason to switch.
- Use only the handful of icons actually needed (likely just GitHub, LinkedIn, email, and maybe a theme/sun-moon style glyph for the switcher). Import per-icon so the bundle only ships those, never the whole set.
- Icons must inherit theme colour through `currentColor` so they recolour automatically when `data-theme` flips. Never hardcode an icon fill.
- Keep stroke width and sizing consistent with the chosen set's defaults; do not mix two libraries.
- Respect the aesthetic per theme: thin geometric line icons suit Midnight and Blueprint. For the Pixel theme, if the line icons feel out of place, it is acceptable to swap to a small pixel/bitmap icon set for that theme only, but only if a free one matches cleanly. Otherwise keep the single set across all three.
- Brand icons (GitHub, LinkedIn) often are not in general UI icon sets for trademark reasons. If the chosen set lacks them, use a free brand-icon set such as Simple Icons for those specific logos, and keep the UI icons from the main set.

## The hero

Layout: portrait is the centrepiece, emerging from the dark page (the source photo already has a pure black background, so blend it into `--bg` with no card or border, let it dissolve into the page). Name and boot sequence sit beside or over it. Theme switcher top-right as three small labelled swatches/buttons.

### Boot sequence (echoes pixelpundit.dev, but quieter and personal)

On load, type in a short status readout, then resolve to the real name + tagline. Keep it under ~1.5s total and skip entirely under reduced-motion (show final state immediately).

```
SARANSH SETH
> initialising frontend.lead_
DESIGN_SYSTEMS : OK
PERFORMANCE    : OK
THEMING        : READY
```

Then resolve to:

- Name: **Saransh Seth** (display font, large; if the font has a weight axis, animate weight settling on load).
- Tagline: "Senior Frontend Engineer · Design Systems Tech Lead · Melbourne"

### Cursor interaction: reveal through the effect (desktop only)

The portrait renders in its current themed treatment (pixelated / line-drawn / B&W). A soft circular region around the cursor reveals the original sharp black-and-white photo underneath, with a feathered edge. Reads as "the real person emerging from the styling." The thing being revealed *from* changes per theme, so the effect feels different in each.

Implementation:

- Hero-only WebGL shader on a single canvas, sized to the portrait. Two textures: the original B&W photo and (conceptually) the themed treatment, or generate the treatment in-shader from the original (preferred, one texture, less memory). The reveal is a radial mask following the pointer, mixing between treated and original.
- Generate the themed treatment in the fragment shader where possible: dither for Pixel, edge-detect for Blueprint, contrast for Midnight. This keeps it to one source texture.
- Lazy-init the shader after first contentful paint. Before that, and as the no-JS / fallback, show a static AVIF of the themed portrait (pre-baked per theme, or just the Midnight B&W as universal fallback).
- Pointer tracking throttled to rAF. No layout reads in the loop.
- Touch / no-pointer devices: no canvas, just the static themed image. Detect with `(pointer: fine)`.
- Reduced-motion: no canvas, static image, but theme switching still recolours everything instantly.

Performance guardrails for the shader: cap canvas DPR at ~1.5, pause the rAF loop when the hero is scrolled out of view (IntersectionObserver) and when the tab is hidden (visibilitychange). The portrait texture should be a reasonably sized AVIF (e.g. longest edge ~1200px), not the full-res upload.

## Page structure

1. **Hero**: portrait + boot + name + tagline + theme switcher.
2. **Currently**: one short paragraph: leading the Phoenix Design System migration to a layered architecture with white-label theming, the Figma token sync pipeline (Code Connect + Variables API), and an in-progress Phoenix MCP server that surfaces tokens and component rules to AI coding assistants.
3. **Experience**: clean text rows, not cards. Intrepid (Senior SWE / Acting Tech Lead, Design Systems, Mar 2024 to Present), AmazingCo (Full Stack Developer, 2022 to 2024), Nookal (Frontend Web Developer, 2017 to 2022). Role, dates, one line each. No 01/02/03 numbering.
4. **Links**: GitHub (github.com/saranshseth93), LinkedIn (linkedin.com/in/saranshseth), email. Plain links, no contact form.

Leave a clean, commented placeholder slot after Experience for one or two real projects to be added later (when SafeSure / Parichay ship). Do not populate it now.

## Image prep

The source portrait is a high-contrast B&W headshot on a pure black background. Steps for Claude Code:

1. Export the LCP/fallback image as AVIF (primary) + WebP (fallback), longest edge ~1200px, plus a ~600px variant for mobile via `srcset`.
2. Generate a tiny blurred placeholder (LQIP, ~20px wide, inlined as a data URI) for blur-up.
3. The same ~1200px B&W AVIF is the single texture fed to the WebGL shader.
4. Always set explicit width/height (or aspect-ratio) on the img to prevent CLS.
5. Real, descriptive `alt` text on the fallback img.

## Copy tone

Confident, plain, no filler. No em dashes anywhere. No AI-jargon ("leverage", "ecosystem", "deep dive", "wheelhouse", "synergy", "alignment"). Short sentences. Let the craft do the talking; don't oversell in words.

## Build order (suggested)

1. Semantic HTML + content + Tailwind v4 `@theme` token system + all three themes working with instant `data-theme` swap and `localStorage` persistence. Ship-quality without any JS effects. Confirm Tailwind CSS output is small at this stage.
2. Verify Lighthouse 95+ and AA contrast on all three themes at this stage, before adding effects.
3. Add boot sequence (reduced-motion aware).
4. Add the static themed portrait treatments (CSS/SVG filters as the baseline visual, so even non-WebGL users get a themed image).
5. Add the WebGL reveal shader as progressive enhancement on top, with all the performance guards.
6. Re-run Lighthouse. If the shader costs anything measurable on LCP/TBT, defer its init further.

## Reminder

Spend the boldness in one place: the portrait theme transformation + cursor reveal is the signature. Everything around it stays quiet and disciplined. Cut any decoration that doesn't serve that.
