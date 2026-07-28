import { defineConfig } from "vite";
import { createRollupExternal } from "@rmc-toolkit/vite";
import { manifest } from "./runtime-composition.manifest.js";

// Library build: emits a single ESM entry (index.mjs) that the host loads via
// its import map. createRollupExternal keeps React and any @gigi/* specifiers
// OUT of the bundle so the browser resolves them through the host's import map
// (one shared React instance, no duplicate copies).
export default defineConfig({
  build: {
    lib: {
      entry: ["src/index.tsx"],
      formats: ["es"],
      fileName: () => "index.mjs",
    },
    rollupOptions: {
      external: createRollupExternal(manifest),
    },
  },
  // Dev server port must match environments.development.sliceOrigins.ordering
  // in gigi-host's manifest (http://localhost:5174).
  server: { port: 5174 },
  // Classic JSX runtime so every file uses the externalized @esm.sh/react
  // singleton (React must be in scope) rather than a bundled JSX runtime.
  esbuild: {
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
  },
});
