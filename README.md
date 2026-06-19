# saranshseth.me

My personal site. One page. The page itself is the portfolio: no project tiles, no
backend, nothing to click through to find the work. What it does is the work.

Live: https://saranshseth93.github.io/portfolio (custom domain to follow).

## The idea

A hero portrait that renders three different ways, one per theme, and reveals the real
photo underneath as you move the cursor over it. The themes are not skins bolted on top.
They are one set of design tokens, redefined per theme, so flipping a single attribute on
the page recolours every element at once. That is the actual job I do, design systems, made
visible. Open devtools and read the source; that is the point.

Three themes:

- Midnight: the professional one. Charcoal and burgundy. Clean black and white portrait.
- Pixel: phosphor green, CRT scanlines, a dithered portrait. The retro-gaming side.
- Blueprint: deep blue, a drafting grid, the portrait as a cyan technical drawing.

Switching themes runs a radial wipe out from the swatch you click, so the change feels like
something happening rather than a flash.

## How the theming works

Tokens live once in `src/styles/global.css` under Tailwind v4's `@theme` block. They generate
the utilities (`bg-bg`, `text-accent`, `font-display`). Each theme then overrides the raw CSS
variables under a `[data-theme="..."]` selector:

```css
@theme {
  --color-bg: #0E0E12;
  --color-accent: #AD2B63;
}
[data-theme="pixel"] { --color-bg: #0B0E0A; --color-accent: #5CE65C; }
```

Markup only ever references the semantic utilities, never a raw colour. Switching the theme
sets `data-theme` on `<html>` and writes it to `localStorage`. A tiny inline script in the
head reads it before first paint, so there is no flash of the wrong theme. With JavaScript
off you get Midnight, the static portrait, and all the text.

## The cursor reveal

The portrait is one WebGL canvas with one texture (the cut-out photo). The themed treatment
is generated in the fragment shader, and a feathered circle that follows the pointer mixes
back to the original. It only runs where it makes sense: a fine pointer, WebGL support, and
motion not reduced. It is created on first hover, so it costs nothing at load. Touch devices,
reduced-motion users, and anything without WebGL get the static themed image instead.

## Stack

- Astro. Zero framework runtime. The only JavaScript is the theme switcher, the boot
  sequence, the scroll motion, and the hero shader, each a small island.
- Tailwind CSS v4 as the styling layer and the token system.
- Lenis for smooth scroll. Sharp for the image pipeline. macOS Vision for the background
  cut-out.
- Vitest for the unit tests (theme logic, the contrast audit, the boot sequence, the shader
  fallback).

## Numbers

Lighthouse 100 across Performance, Accessibility, Best Practices, and SEO on all three
themes. LCP around 0.4s, CLS near zero. The production CSS is about 5KB gzipped and the
JavaScript about 8KB gzipped. Fonts are self-hosted, subset, and preloaded. Every theme's
text passes WCAG AA contrast, checked by a test, not by eye.

## Local development

```bash
npm install
npm run dev        # dev server
npm run build      # production build
npm run preview    # serve the build
npm test           # unit tests
npm run images     # regenerate the portrait assets (see below)
```

## Image pipeline

The source portrait is a high-contrast black and white headshot. Two steps:

1. `scripts/cutout.swift` removes the background to a transparent cut-out using the macOS
   Vision framework. No model download, no dependency.
2. `scripts/build-images.mjs` (run via `npm run images`) generates AVIF and WebP at 600px and
   1200px with sharp, plus a tiny inline blur-up placeholder. The 1200px cut-out is also the
   texture the shader uses.

The generated images are committed so a build, including CI, never needs the native tools.

## Deployment

GitHub Actions builds the site and publishes it to GitHub Pages on every push to `main`
(`.github/workflows/deploy.yml`). It currently serves from a project subpath, so
`astro.config.mjs` sets `base: "/portfolio"`. The head URLs are derived from `Astro.site`, so
moving to the custom domain is two lines: set `site` to the domain, `base` to `/`, and add a
`public/CNAME`.

## Accessibility and motion

The theme switcher is real buttons with `aria-pressed`, keyboard operable, with a visible
focus ring in every theme. `prefers-reduced-motion: reduce` turns off the boot typing, the
scroll reveals, the parallax, the theme-wipe, and the cursor shader; those users get the
clean static image and instant theme swaps.
