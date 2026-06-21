# saranshseth.me

```
            _________
           /         \
          |  _     _  |
          | |_|   |_| |     aviators on, systems up
          |     _     |
           \   '-'   /
            \_______/
         S A R A N S H   S E T H
```

A personal portfolio where the page itself is the proof of skill. One page, no project
tiles, no backend, no filler. It is a cinematic scroll journey that doubles as evidence of
how I build: a hero portrait that transforms three ways, a design-token system you can watch
recolour the whole page at once, and an interactive design system you can actually drive.

### Live: [saranshseth.me](https://saranshseth.me)

[![Live site](https://img.shields.io/badge/live-saranshseth.me-E0316B)](https://saranshseth.me)
[![Built with Astro](https://img.shields.io/badge/Astro-zero%20runtime%20JS-0E0E12)](https://astro.build)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4%20%40theme%20tokens-0A1830)](https://tailwindcss.com)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-100%20desktop-1a7f37)](https://saranshseth.me)

---

## Why it exists

I lead design systems, so the site is built like one: a clean token layer, a small set of
real components, accessibility and performance treated as features rather than chores. Open
devtools and read the source. That is the point. Nothing here is decoration that a reviewer
cannot inspect.

## The signature: one token layer, three themes

Three themes share one set of design tokens. Flipping a single attribute on the page
recolours everything at once, no re-render, no JavaScript repainting elements one by one.

- **Midnight**: the professional one. Charcoal and burgundy.
- **Pixel**: phosphor green, CRT scanlines, a dithered portrait.
- **Blueprint**: deep blue, a drafting grid, a cyan technical-drawing portrait.

Switching themes detonates a shockwave from the swatch you click, with the new theme sweeping
in behind it. Each theme's texture (scanlines, grid) carries across the whole page.

## The page, chapter by chapter

A scroll-driven story, each chapter with its own motion:

- **Hero**: the portrait dissolves into the page, and an ambient WebGL reveal drifts the real
  photo out from under the themed treatment. The wordmark leans into your cursor, each letter
  gaining weight as you pass over it.
- **How I work**: a pinned, scrubbed statement of principles.
- **Experience**: the same pinned treatment, eight years told as roles in plain website voice.
- **A living system**: an interactive lab. Change a colour chip, the corner radius, the
  density, or the font size, and a real component re-themes live. The token idea made tactile,
  with handwritten callouts labelling each part.
- **Credibility and contact**: the numbers, the stack, a downloadable CV, and a way to reach me.

## How the theming works

Tokens live once in `src/styles/global.css` under Tailwind v4's `@theme` block. They generate
the utilities (`bg-bg`, `text-accent`, `font-display`). Each theme overrides the raw CSS
variables under a `[data-theme="..."]` selector:

```css
@theme {
  --color-bg: #0E0E12;
  --color-accent: #E0316B;
  --color-on-accent: #000000;
}
[data-theme="pixel"] { --color-bg: #0B0E0A; --color-accent: #5CE65C; --color-on-accent: #0B0E0A; }
```

Markup only ever references the semantic utilities, never a raw colour. The chosen theme is
saved to `localStorage` and read by a tiny inline script in the head before first paint, so
there is no flash of the wrong theme. With JavaScript off you get Midnight, the static
portrait, and all the text.

## The cursor reveal

The portrait is one WebGL canvas with one texture. The themed treatment is generated in the
fragment shader, and a feathered circle mixes back to the real photo. It runs ambiently so
every device sees it, drifting on its own and following a pointer or a dragging finger when
you engage. Guards keep it cheap: capped DPR, throttled to 30fps, paused off-screen and on
hidden tabs. Reduced-motion users and anything without WebGL get the static themed image.

## Stack

- **Astro**: zero framework runtime. The only JavaScript is a handful of small islands (theme
  switcher, boot sequence, hero shader, wordmark, motion stage, design-system lab).
- **Tailwind CSS v4** as the styling layer and the design-token system.
- **GSAP** with ScrollTrigger and SplitText for the pinned, scrubbed chapters, driven by
  **Lenis** for smooth scroll. Loaded lazily on idle so it never sits on the critical path.
- **Sharp** for the image pipeline; **macOS Vision** for the background cut-out.
- **Vitest** for the unit tests (theme logic, contrast audit, boot sequence, shader fallback,
  the lab token mapping).

## Numbers

Lighthouse desktop 100 across Performance, Accessibility, Best Practices, and SEO; mobile 95
on Performance and 100 on the rest. Desktop LCP around 0.6s, CLS near zero. CSS is about 8KB
gzipped; the motion library is the bulk of the JavaScript and is lazy-loaded. Fonts are
self-hosted and subset. Every theme's text passes WCAG AA contrast, verified by a test rather
than by eye.

## Run it locally

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

1. `scripts/cutout.swift` removes the background to a transparent cut-out using the macOS
   Vision framework. No model download, no dependency.
2. `scripts/build-images.mjs` (run via `npm run images`) generates AVIF and WebP at 600px and
   1200px with sharp, plus a tiny inline blur-up placeholder. The 1200px image is also the
   shader texture.

The generated images are committed, so a build, including CI, never needs the native tools.

## Deployment

GitHub Actions builds the site and publishes it to GitHub Pages on every push to `main`
(`.github/workflows/deploy.yml`). It serves from the apex domain `saranshseth.me`, so
`astro.config.mjs` sets `site` to that domain and `base` to `/`, and `public/CNAME` tells
Pages which domain to claim. Head URLs and asset paths are base-aware.

DNS runs through Cloudflare (nameservers set at Namecheap). The apex has four A records to the
GitHub Pages IPs; `www` is a CNAME to the github.io host and redirects to the apex, so both
`www.saranshseth.me` and `saranshseth.me` resolve to the same site over HTTPS.

## Accessibility and motion

The theme switcher and the lab controls are real, keyboard-operable elements with a visible
focus ring in every theme. `prefers-reduced-motion: reduce` turns off the boot typing, the
scroll reveals and parallax, the theme shockwave, the wordmark weight effect, and the cursor
shader. Those users get the static image, instant theme swaps, and a fully readable page. The
lab stays interactive regardless of motion preference.

## Reach me

- Site: [saranshseth.me](https://saranshseth.me)
- GitHub: [@saranshseth93](https://github.com/saranshseth93)
- LinkedIn: [in/saranshseth](https://www.linkedin.com/in/saranshseth)

The code is here to read and learn from. The photo, copy, and CV are mine; please do not reuse
those.
