import alpinejs from "@astrojs/alpinejs";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    alpinejs({
      entrypoint: "/src/alpine.ts",
    }),
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            "import",
            "global-builtin",
            "color-functions",
            "if-function",
            "mixed-decls",
          ],
        },
      },
    },
  },
});
