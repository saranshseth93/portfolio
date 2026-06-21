// Generates a 1200x630 Open Graph card: the portrait on the right, name and titles on the
// left, on the Midnight background. Run: node scripts/build-og.mjs
import sharp from "sharp";

const W = 1200, H = 630;
const PH = 600; // portrait height
const portrait = await sharp("src/assets/portrait/cutout.png")
  .resize({ height: PH, withoutEnlargement: true })
  .toBuffer();
const pmeta = await sharp(portrait).metadata();
const pLeft = W - pmeta.width - 60;
const pTop = Math.round((H - PH) / 2);

const bg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="76%" cy="42%" r="58%">
      <stop offset="0%" stop-color="#AD2B63" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#AD2B63" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0E0E12"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="72" y="300" font-family="Helvetica, Arial, sans-serif" font-size="86" font-weight="700" fill="#EDEAE3">Saransh Seth</text>
  <rect x="74" y="330" width="118" height="4" rx="2" fill="#AD2B63"/>
  <text x="74" y="384" font-family="Helvetica, Arial, sans-serif" font-size="29" fill="#9A968C">Senior Frontend Engineer</text>
  <text x="74" y="424" font-family="Helvetica, Arial, sans-serif" font-size="29" fill="#9A968C">Design Systems Tech Lead, Melbourne</text>
</svg>`);

await sharp(bg)
  .composite([{ input: portrait, left: Math.max(0, pLeft), top: Math.max(0, pTop) }])
  .png()
  .toFile("public/og.png");
console.log("wrote public/og.png", `${W}x${H}, portrait ${pmeta.width}x${PH} at ${pLeft},${pTop}`);
