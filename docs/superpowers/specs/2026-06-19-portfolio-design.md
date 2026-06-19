# saranshseth.me Portfolio: Design

Date: 2026-06-19
Status: Approved for planning

This design implements the spec in `CLAUDE.md`. That file is the source of truth for
copy rules, themes, tokens, and non-negotiable goals. This document records the
architecture, folder structure, resolved decisions, and build phasing. Where this
document and `CLAUDE.md` ever disagree, `CLAUDE.md` wins.

## Resolved decisions

- Stack: Astro + Tailwind v4. Zero JS framework runtime. Three small vanilla scripts only:
  theme switcher, boot sequence, hero shader.
- Display font: Hanken Grotesk Variable, used as the single display and body family for the
  Midnight theme. One self-hosted variable woff2 keeps the font payload minimal. Pixel and
  Blueprint themes use mono/pixel faces per the spec.
- Hero shader: full raw-WebGL cursor-reveal, built with every performance guard. Not deferred
  to a later project.
- Portrait: provided by the user (`src/assets/portrait/source.png`, 1792x2390, 3:4 B&W).
- Portrait background: removed to a transparent alpha cutout, so the portrait sits directly on
  each theme's exact `--bg`. Theme colors stay exactly as specified in `CLAUDE.md`; we do not
  alter backgrounds to blend with the photo. Subject segmentation uses the native macOS Vision
  framework (`VNGenerateForegroundInstanceMaskRequest`) via a small Swift helper, no Python or
  model download. Fallback to `rembg` only if cutout quality on the dark shirt is poor.
- Deploy target: Cloudflare Pages.

## Folder structure

```
src/
  assets/portrait/        source.png (raw), cutout.png, generated avif/webp + srcset, lqip.txt
  components/             ThemeSwitcher.astro, Hero.astro, BootSequence.astro,
                          Experience.astro, SocialLinks.astro, Currently.astro, icons/
  layouts/                BaseLayout.astro (head, meta, SEO/JSON-LD, inline theme-init script)
  pages/                  index.astro
  scripts/                theme.ts, boot.ts, hero-shader.ts, shaders/ (vertex + fragment glsl)
  styles/                 global.css (@theme tokens, 3 [data-theme] overrides, @apply components)
public/
  fonts/                  subset woff2 (Hanken Grotesk var, JetBrains Mono, Press Start 2P)
  favicon, og image
scripts/
  build-images.mjs        one-shot sharp pipeline (cutout -> avif/webp/srcset/lqip)
  cutout.swift            native Vision background removal helper
docs/superpowers/specs/   this design + the implementation plan
tests/                    theme-switch logic, shader fallback path, contrast audit
```

## Token architecture

All color and font tokens are defined once in `src/styles/global.css` under Tailwind v4's
`@theme` directive (generating utilities like `bg-bg`, `text-accent`, `font-display`). Each
theme overrides the raw CSS variables with `[data-theme="pixel"]` / `[data-theme="blueprint"]`
selectors. Markup references only semantic utilities, never hardcoded colors. Repeating
patterns (buttons, theme swatches, experience rows) are extracted to `@apply` component classes
so the HTML reads as intent, not utility soup.

Theme is persisted in `localStorage` and read by a tiny inline script in `<head>` before first
paint, so there is no flash of the wrong theme. Default and no-JS state is Midnight.

## Hero data flow

1. Server renders the static themed portrait `<img>` (AVIF + WebP fallback, srcset 600/1200,
   LQIP blur-up, explicit width/height). This is the LCP element and the no-JS/fallback view.
2. CSS/SVG filters provide the per-theme static treatment (B&W contrast, dither, edge-detect)
   so even non-WebGL users see a themed image.
3. After first contentful paint, and only when `(pointer: fine)` and reduced-motion is not set,
   `hero-shader.ts` lazy-inits a single WebGL canvas over the portrait. One RGBA texture (the
   cutout); the themed treatment is generated in the fragment shader; a feathered radial mask
   following the pointer reveals the original B&W underneath.
4. Guards: DPR capped at 1.5; rAF paused via IntersectionObserver when the hero scrolls out of
   view and via visibilitychange when the tab is hidden; pointer tracking throttled to rAF with
   no layout reads in the loop.

## Image prep (this photo)

- Crop the small star watermark from the bottom-right corner.
- Remove background to transparent alpha cutout (Vision helper).
- Feather the alpha edge slightly so the cutout dissolves rather than showing a hard line.
- Export AVIF (primary) + WebP (fallback), longest edge ~1200px, plus a ~600px variant for
  `srcset`. Generate a ~20px LQIP inlined as a data URI.
- The 1200px cutout (with alpha) is the single texture fed to the WebGL shader.
- Explicit width/height on the `<img>` to prevent CLS. Real, descriptive alt text.

## Build phases (each is a sign-off gate)

1. Scaffold Astro + Tailwind v4; `@theme` tokens + all three themes; all real, server-rendered
   content (hero text, Currently, Experience rows, Links, the commented projects placeholder);
   instant `data-theme` swap; localStorage persistence + no-flash inline init; accessible
   theme switcher (real buttons, keyboard, `aria-pressed`). No JS effects yet.
   Gate: Tailwind CSS output well under 20KB gzipped; Lighthouse 95+ all four categories;
   WCAG AA contrast on all three themes.
2. Image pipeline: Vision cutout + sharp build script producing AVIF/WebP/srcset/LQIP; wire the
   static themed `<img>` into the hero with correct dimensions. Visual check of cutout quality.
3. Boot sequence script, reduced-motion aware (instant final state under reduce).
4. Static per-theme portrait treatments via CSS/SVG filters (baseline visual for non-WebGL).
5. WebGL cursor-reveal shader as progressive enhancement with all guards above.
6. Re-run Lighthouse; if the shader costs measurable LCP/TBT, defer its init further. Then
   create the GitHub repo, push, and write the README with the humanizer skill.

Git is initialized at the start; commits land per phase. The GitHub repo is created around
phase 1-2 once there is something real to push.

## Testing (proportional)

Per `CLAUDE.md`, tests stay proportional to a static single-page site:

- Theme-switching logic: apply/persist/restore, default to Midnight, cycle through all three.
- Shader fallback path: no canvas under reduced-motion, no `(pointer: fine)`, or no WebGL.
- Contrast audit: automated check that every theme's text/bg and muted/bg pairings pass AA.

Trivial markup is not unit tested. Lighthouse and the CSS payload size are checked by hand at
the phase gates.

## Non-goals (YAGNI)

- No backend, no contact form, no project tiles, no analytics.
- No JS framework. No three.js unless a tiny WebGL helper proves insufficient.
- The projects slot after Experience is a commented placeholder only; not populated now.
