// Builds a three-panel LinkedIn still: the hero portrait rendered in each theme,
// reproducing the exact in-shader treatments from src/scripts/shaders/reveal.frag
// (steady state, no cursor reveal), so the panels match the live site.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src/assets/portrait/cutout.png');
const OUT = process.argv[2] || path.join(root, 'linkedin-themes.png');

// Live theme tokens (src/styles/global.css)
const THEMES = {
  midnight:  { bg: '#0E0E12', accent: '#E0316B', text: '#EDEAE3', muted: '#9A968C', name: 'MIDNIGHT',  tag: 'the professional' },
  pixel:     { bg: '#0B0E0A', accent: '#5CE65C', text: '#C7F2A4', muted: '#6E8C5A', name: 'PIXEL',     tag: 'the personality' },
  blueprint: { bg: '#0A1830', accent: '#4FC3F7', text: '#DCEAF7', muted: '#7FA6CC', name: 'BLUEPRINT', tag: 'the systems thinker' },
};

const luma = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;

// Per-theme treatment, ported 1:1 from the fragment shader (u_time = 0, no reveal).
function treat(theme, g) {
  if (theme === 'pixel') {
    const q = Math.floor(g * 4) / 3;
    const green = [0.36, 0.90, 0.36], amber = [1.0, 0.69, 0.0];
    const base = g >= 0.7 ? amber : green;
    const k = 0.25 + 0.75 * q;
    return [base[0] * k, base[1] * k, base[2] * k];
  }
  if (theme === 'blueprint') {
    const lo = [0.04, 0.12, 0.22], hi = [0.31, 0.76, 0.97];
    const t = Math.pow(g, 0.85);
    return [mix(lo[0], hi[0], t), mix(lo[1], hi[1], t), mix(lo[2], hi[2], t)];
  }
  const v = clamp01((g - 0.5) * 1.08 + 0.5); // midnight
  return [v, v, v];
}

const PANEL_W = 470;
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

async function treatedPortrait(themeKey) {
  const base = sharp(SRC).resize({ width: PANEL_W });
  const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(data.length);
  // faint scanlines for pixel, matching the CRT feel (subtle, every other row)
  for (let y = 0; y < height; y++) {
    const scan = themeKey === 'pixel' ? 0.9 + 0.1 * (y % 2) : 1;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const g = luma(data[i], data[i + 1], data[i + 2]);
      const [r, gg, b] = treat(themeKey, g);
      out[i] = Math.round(clamp01(r * scan) * 255);
      out[i + 1] = Math.round(clamp01(gg * scan) * 255);
      out[i + 2] = Math.round(clamp01(b * scan) * 255);
      out[i + 3] = data[i + 3];
    }
  }
  return { buf: await sharp(out, { raw: { width, height, channels } }).png().toBuffer(), width, height };
}

async function main() {
  const keys = ['midnight', 'pixel', 'blueprint'];
  const portraits = {};
  for (const k of keys) portraits[k] = await treatedPortrait(k);
  const pH = portraits.midnight.height;

  const GUT = 34, MARGIN = 40;
  const CANVAS_W = MARGIN * 2 + PANEL_W * 3 + GUT * 2; // 40+470*3+34*2 = 1518
  const HEADER = 176;
  const PANEL_TOP = HEADER;
  const LABEL_H = 96;
  const FOOTER = 70;
  const CANVAS_H = HEADER + pH + LABEL_H + FOOTER;

  const panelX = (i) => MARGIN + i * (PANEL_W + GUT);

  // Master background + header + panel backdrops + labels, all as one SVG overlay,
  // with the portraits composited on top.
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">`;
  svg += `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#141018"/><stop offset="0.5" stop-color="#0E0E12"/><stop offset="1" stop-color="#0B0B0F"/></linearGradient></defs>`;
  svg += `<rect width="100%" height="100%" fill="url(#fade)"/>`;

  // header
  const cx = CANVAS_W / 2;
  svg += `<text x="${cx}" y="64" text-anchor="middle" font-family="monospace" font-size="19" letter-spacing="6" fill="#9A968C">SARANSH SETH  //  DESIGN SYSTEMS</text>`;
  svg += `<text x="${cx}" y="126" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="44" fill="#EDEAE3">One page. One token layer. <tspan fill="#E0316B">Three identities.</tspan></text>`;

  // panel backdrops (theme bg, rounded) + accent hairline + labels
  keys.forEach((k, i) => {
    const t = THEMES[k];
    const x = panelX(i);
    svg += `<rect x="${x}" y="${PANEL_TOP}" width="${PANEL_W}" height="${pH}" rx="14" fill="${t.bg}"/>`;
    // accent hairline top of panel
    svg += `<rect x="${x}" y="${PANEL_TOP}" width="${PANEL_W}" height="3" rx="1.5" fill="${t.accent}"/>`;
    const ly = PANEL_TOP + pH + 40;
    svg += `<text x="${x + 4}" y="${ly}" font-family="monospace" font-size="24" font-weight="700" letter-spacing="3" fill="${t.accent}">${t.name}</text>`;
    svg += `<text x="${x + PANEL_W - 4}" y="${ly}" text-anchor="end" font-family="sans-serif" font-size="19" fill="${t.muted}">${esc(t.tag)}</text>`;
    svg += `<rect x="${x + 4}" y="${ly + 16}" width="${PANEL_W - 8}" height="1" fill="#26262e"/>`;
  });

  // footer
  svg += `<text x="${MARGIN + 4}" y="${CANVAS_H - 26}" font-family="monospace" font-size="18" fill="#6f6f78">saranshseth.me</text>`;
  svg += `<text x="${CANVAS_W - MARGIN - 4}" y="${CANVAS_H - 26}" text-anchor="end" font-family="sans-serif" font-size="18" fill="#9A968C">change one token, everything recolours</text>`;
  svg += `</svg>`;

  const layers = [{ input: Buffer.from(svg) }];
  keys.forEach((k, i) => {
    layers.push({ input: portraits[k].buf, left: panelX(i), top: PANEL_TOP });
  });
  // re-stamp accent hairline + labels ABOVE the portrait so nothing is covered
  let svgTop = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}">`;
  keys.forEach((k, i) => {
    const t = THEMES[k]; const x = panelX(i);
    svgTop += `<rect x="${x}" y="${PANEL_TOP}" width="${PANEL_W}" height="3" fill="${t.accent}"/>`;
  });
  svgTop += `</svg>`;
  layers.push({ input: Buffer.from(svgTop) });

  await sharp({ create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: '#0E0E12' } })
    .composite(layers).png().toFile(OUT);
  console.log('wrote', OUT, CANVAS_W + 'x' + CANVAS_H);
}
main().catch((e) => { console.error(e); process.exit(1); });
