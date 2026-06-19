import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Static single page. Tailwind v4 runs through the Vite plugin so content
// scanning is automatic and the emitted CSS contains only used utilities.
export default defineConfig({
  site: "https://saranshseth.me",
  vite: { plugins: [tailwindcss()] },
});
