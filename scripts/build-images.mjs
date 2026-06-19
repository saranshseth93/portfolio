// Generates responsive AVIF/WebP from the transparent cutout plus an LQIP
// data URI. Run: npm run images
import sharp from "sharp";
import { writeFileSync, statSync } from "node:fs";

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
    const path = `${OUT}/portrait-${w}.${ext}`;
    const { size } = statSync(path);
    console.log(`portrait-${w}.${ext}: ${(size / 1024).toFixed(1)}KB`);
  }
}
