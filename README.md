# gigi-ordering

The Gigi Pizzeria **online-ordering slice**, built with
[Runtime Module Composition](https://runtime-module-composition.dev)
(`@rmc-toolkit/*`).

It is a **slice**: a Vite library build that emits a single ESM entry
(`dist/index.mjs`) exporting a **default React component**. The host
(`gigi-host`) loads it at runtime via its import map + `createDynamicModuleBoundary`.

- React is **not bundled** — it resolves to the host's shared `@esm.sh/react`
  singleton through the import map (`createRollupExternal`).
- Route: the host maps the first URL segment `ordering` → `@gigi/ordering/index.mjs`.

## Scripts

```bash
npm install
npm run dev        # slice dev server on http://localhost:5174 (matches host manifest)
npm run build      # -> dist/index.mjs (React externalized)
npm run typecheck
```

## Where the real app goes

`src/index.tsx` is the slice root. The full ordering experience from the design
spec (bilingual menu, structured modifiers, cart, Moneris checkout) grows here.
The Cloudflare backend / JSON menu API and `menu.seed.json` live with the
ordering system's server design — this slice is the customer-facing client.

## Manifest

`runtime-composition.manifest.ts` here is a build-only copy for externalization.
`gigi-host` owns the canonical manifest; keep `namespace` / `externalDeps` in sync
(or extract a shared manifest package later).
