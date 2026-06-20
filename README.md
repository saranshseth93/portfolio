# saranshseth.me

My personal site. One page, no project tiles, no backend. The page itself is the work: a
cinematic scroll journey that doubles as proof of how I build, with a hero portrait and an
interactive design system you can actually drive.

Live: https://saranshseth93.github.io/portfolio (custom domain to follow).

## The idea

The signature is a theme system. Three themes, one set of design tokens redefined per theme,
so flipping a single attribute on the page recolours everything at once. No re-render, no JS
recolouring. That is the job I do, design systems, made visible. Open devtools and read the
source; that is the point.

Three themes:

- Midnight: the professional one. Charcoal and burgundy.
- Pixel: phosphor green, CRT scanlines, a dithered portrait.
- Blueprint: deep blue, a drafting grid, a cyan technical-drawing portrait.

Switching themes detonates a shockwave from the swatch you click, the new theme sweeping in
behind it. The texture of each theme (scanlines, grid) carries across the whole page.

## The page

A scroll-driven story, each chapter with its own motion:

- Hero: the portrait dissolves into the page, and an ambient reveal drifts the real photo out
  from under the themed treatment (and follows your cursor or finger).
- How I work: a pinned, scrubbed statement of principles.
- Experience: the same pinned treatment, eight years told as roles, in website voice.
- A living system: an interactive lab. Change a colour chip, the corner radius, the density,
  or the font size and a real component rethemes live, the token-driven idea made tactile, with
  handwritten callouts labelling each part.
- Credibility and contact: the numbers, the stack, and a way to reach me, with a downloadable CV.

## How the theming works

Tokens live once in `src/styles/global.css` under Tailwind v4's `@theme` block. They generate
the utilities (`bg-bg`, `text-accent`, `font-display`). Each theme overrides the raw CSS
variables under a `[data-theme="..."]` selector:

```css
@theme {
  --color-bg: #0E0E12;
  --color-accent: #AD2B63;
  --color-on-accent: #EDEAE3;
}
[data-theme="pixel"] { --color-bg: #0B0E0A; --color-accent: #5CE65C; --color-on-accent: #0B0E0A; }
```

Markup only references the semantic utilities, never a raw colour. The theme is saved to
`localStorage` and read by a tiny inline script in the head before first paint, so there is no
flash of the wrong theme. With JavaScript off you get Midnight, the static portrait, and all
the text.

## The cursor reveal

The portrait is one WebGL canvas with one texture (the cut-out photo). The themed treatment is
generated in the fragment shader, and a feathered circle mixes back to the real photo. It runs
ambiently so every device sees it, drifting on its own and following a pointer or a dragging
finger when you engage. Guards keep it cheap: capped DPR, throttled to 30fps, paused off-screen
and on hidden tabs. Reduced-motion users and anything without WebGL get the static themed image.

## Stack

- Astro. Zero framework runtime; the only JavaScript is a handful of small islands (theme
  switcher, boot sequence, hero shader, motion stage, design-system lab).
- Tailwind CSS v4 as the styling layer and the token system.
- GSAP with ScrollTrigger and SplitText for the pinned, scrubbed chapters, driven by Lenis for
  smooth scroll. Loaded lazily on idle so it never sits on the critical path.
- Sharp for the image pipeline; macOS Vision for the background cut-out.
- Vitest for the unit tests (theme logic, contrast audit, boot sequence, shader fallback, the
  lab token mapping).

## Numbers

Lighthouse desktop 100 across Performance, Accessibility, Best Practices, and SEO; mobile 95 on
Performance and 100 on the rest. Desktop LCP around 0.6s, CLS near zero. CSS is about 7KB
gzipped; the motion library is the bulk of the JavaScript and is lazy-loaded. Fonts are
self-hosted and subset. Every theme's text passes WCAG AA contrast, checked by a test, not by
eye.

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

The source portrait is a high-contrast black and white headshot.

1. `scripts/cutout.swift` removes the background to a transparent cut-out using the macOS Vision
   framework. No model download, no dependency.
2. `scripts/build-images.mjs` (run via `npm run images`) generates AVIF and WebP at 600px and
   1200px with sharp, plus a tiny inline blur-up placeholder. The 1200px cut-out is also the
   shader texture.

The generated images are committed so a build, including CI, never needs the native tools.

## Deployment

GitHub Actions builds the site and publishes it to GitHub Pages on every push to `main`
(`.github/workflows/deploy.yml`). It serves from a project subpath, so `astro.config.mjs` sets
`base: "/portfolio"`. The head URLs and asset paths are base-aware, so moving to the custom
domain is two lines: set `site` to the domain, `base` to `/`, and add a `public/CNAME`.

## Accessibility and motion

The theme switcher and the lab controls are real, keyboard-operable elements with a visible
focus ring in every theme. `prefers-reduced-motion: reduce` turns off the boot typing, the
scroll reveals and parallax, the theme shockwave, and the cursor shader; those users get the
static image, instant theme swaps, and a fully readable page. The lab stays interactive
regardless of motion preference.
