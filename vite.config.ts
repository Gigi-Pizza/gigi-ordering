import { defineConfig } from "vite";
import { createRollupExternal } from "@rmc-toolkit/vite";
import { manifest } from "@gigi/runtime-manifest";

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
  // The host loads this slice at @gigi/ordering/index.mjs, which its dev import
  // map maps to http://localhost:5174/index.mjs. Only `vite preview` (serving the
  // built dist/) has a real file there — `vite dev` serves /src/*, not /index.mjs.
  // So `npm run serve` (build + preview on 5174) is what the host consumes; plain
  // `npm run dev` is for editing the slice standalone.
  server: { port: 5174 },
  preview: { port: 5174, strictPort: true },
  // Classic JSX runtime so every file uses the externalized @esm.sh/react
  // singleton (React must be in scope) rather than a bundled JSX runtime.
  esbuild: {
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
  },
});
