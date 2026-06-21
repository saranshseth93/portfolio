import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Static single page. Tailwind v4 runs through the Vite plugin so content
// scanning is automatic and the emitted CSS contains only used utilities.
//
// Deploy target: GitHub Pages on the custom apex domain saranshseth.me.
// Served from the root, so base is "/". public/CNAME tells Pages the domain.
export default defineConfig({
  site: "https://saranshseth.me",
  base: "/",
  vite: { plugins: [tailwindcss()] },
});
