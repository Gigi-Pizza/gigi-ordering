import { defineConfig } from "vitest/config";

// Tests run in Node: alias the @esm.sh/* specifiers (which the browser resolves
// via the import map, and the production build keeps external) to the real
// installed packages. Production externalization is unaffected — this file is
// only used by Vitest.
export default defineConfig({
  resolve: {
    alias: {
      "@esm.sh/@xstate/react": "@xstate/react",
      "@esm.sh/@tanstack/react-form": "@tanstack/react-form",
      "@esm.sh/react-dom/client": "react-dom/client",
      "@esm.sh/react": "react",
      "@esm.sh/xstate": "xstate",
      "@esm.sh/effect": "effect",
    },
  },
  test: { include: ["src/**/*.test.ts", "src/**/*.test.tsx"] },
});
