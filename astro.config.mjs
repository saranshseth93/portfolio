import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Static single page. Tailwind v4 runs through the Vite plugin so content
// scanning is automatic and the emitted CSS contains only used utilities.
//
// Deploy target: GitHub Pages project site at https://saranshseth93.github.io/portfolio
// For the custom domain later, set site to "https://saranshseth.me" and base to "/".
export default defineConfig({
  site: "https://saranshseth93.github.io",
  base: "/portfolio",
  vite: { plugins: [tailwindcss()] },
});
