import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This app is fully standalone: every registered ThreeUI source file is
// vendored (hash-verified) under ./vendor/threeui. The configured imports
// resolve to that exact source instead of an npm package, so nothing outside
// this folder is referenced.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@designcodeio/threeui/style.css",
        replacement: fileURLToPath(new URL("./vendor/threeui/src/shaders/threeui.css", import.meta.url)),
      },
      {
        find: /^@designcodeio\/threeui$/,
        replacement: fileURLToPath(new URL("./vendor/threeui/BestsellersEntry.tsx", import.meta.url)),
      },
    ],
  },
  server: { host: "127.0.0.1", port: 4334, strictPort: true },
  preview: { host: "127.0.0.1", port: 4334, strictPort: true },
});
