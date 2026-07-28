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
npm run serve      # build + preview on :5174 — what the HOST consumes (serves /index.mjs)
npm run dev        # standalone slice dev server (edits only; serves /src/*, not /index.mjs)
npm run build      # -> dist/index.mjs (React externalized)
npm run typecheck
```

> The host loads `@gigi/ordering/index.mjs`, which its dev import map maps to
> `http://localhost:5174/index.mjs`. Only `vite preview` (serving the built
> `dist/`) has a real file there, so use **`npm run serve`** when running with the
> host — not `npm run dev`.

## Where the real app goes

`src/index.tsx` is the slice root. The full ordering experience from the design
spec (bilingual menu, structured modifiers, cart, Moneris checkout) grows here.
The Cloudflare backend / JSON menu API and `menu.seed.json` live with the
ordering system's server design — this slice is the customer-facing client.

## Manifest

This slice imports the **single shared manifest** from `@gigi/runtime-manifest`
(the `gigi-manifest` package) — the same object the host uses, so there is no
copy to drift. `createRollupExternal(manifest)` reads it to externalize React and
`@gigi/*` specifiers at build time.
