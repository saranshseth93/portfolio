// Generates a 1200x630 Open Graph card: the portrait on the right, name and titles on the
// left, and the motto beneath, on the Midnight background. Run: node scripts/build-og.mjs
//
// The Sanskrit line is drawn with the same subset Devanagari font the page uses, embedded in
// the SVG as a base64 @font-face so the card renders identically anywhere, with no system
// font dependency. The Latin text uses a standard sans so it always resolves.
import sharp from "sharp";
import { readFileSync } from "node:fs";

const W = 1200, H = 630;
const PH = 520; // portrait height
const portrait = await sharp("src/assets/portrait/cutout.png")
  .resize({ height: PH, withoutEnlargement: true })
  .toBuffer();
const pmeta = await sharp(portrait).metadata();
const pLeft = W - pmeta.width - 48;
const pTop = Math.round((H - PH) / 2);

const devaFont = readFileSync("src/assets/fonts/noto-serif-devanagari-subset.woff2").toString("base64");
const sanskrit = "!! आत्मनः उन्नयन प्रति ध्यांन न सिद्ध्य !!";
const english = "Focus on improving yourself, not proving yourself.";

const bg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>@font-face{font-family:'Deva';src:url(data:font/woff2;base64,${devaFont}) format('woff2');font-weight:400 700;}</style>
    <radialGradient id="g" cx="76%" cy="42%" r="58%">
      <stop offset="0%" stop-color="#E0316B" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#E0316B" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0E0E12"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="72" y="196" font-family="Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#EDEAE3">Saransh Seth</text>
  <rect x="74" y="224" width="118" height="4" rx="2" fill="#E0316B"/>
  <text x="74" y="280" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#9A968C">Senior Frontend Engineer</text>
  <text x="74" y="320" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#9A968C">Design Systems Tech Lead, Melbourne</text>
  <text x="72" y="446" font-family="Deva" font-size="34" font-weight="600" fill="#E0316B">${sanskrit}</text>
  <text x="74" y="498" font-family="Helvetica, Arial, sans-serif" font-size="25" font-style="italic" fill="#EDEAE3">${english}</text>
</svg>`);

await sharp(bg)
  .composite([{ input: portrait, left: Math.max(0, pLeft), top: Math.max(0, pTop) }])
  .png()
  .toFile("public/og.png");
console.log("wrote public/og.png", `${W}x${H}, portrait ${pmeta.width}x${PH} at ${pLeft},${pTop}`);
