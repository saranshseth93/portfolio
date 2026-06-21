import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Static single page. Tailwind v4 runs through the Vite plugin so content
// scanning is automatic and the emitted CSS contains only used utilities.
//
// Deploy target: GitHub Pages. Until the saranshseth.me DNS cutover completes
// the site is served at the project subpath, so base is "/portfolio" and the
// github.io preview URL works. At cutover, set site to "https://saranshseth.me"
// and base to "/" (the apex serves from root) and uncomment public/CNAME use.
export default defineConfig({
  site: "https://saranshseth93.github.io",
  base: "/portfolio",
  vite: { plugins: [tailwindcss()] },
});
