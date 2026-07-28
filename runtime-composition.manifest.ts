import { defineManifest } from "@rmc-toolkit/core";

// NOTE: In this polyrepo, gigi-host owns the CANONICAL manifest. This copy exists
// only so the slice's production build knows which specifiers to externalize
// (createRollupExternal needs `namespace` + `externalDepsOrigin`). Keep the
// namespace / externalDeps in sync with gigi-host, or extract a shared
// @gigi/runtime-manifest package later to remove the drift risk.
export const manifest = defineManifest({
  namespace: "@gigi",
  // Production origin that serves built slice assets, e.g. @gigi/ordering/index.mjs.
  // TODO: confirm the real Cloudflare origin for built slice assets.
  assetsOrigin: "https://assets.gigipizza.ca",
  externalDepsOrigin: "https://esm.sh",
  externalDeps: [
    { name: "react", version: "19", peerDeps: false },
    { name: "react-dom/client", version: "19" },
  ],
  defaultPeerDeps: ["react"],
});
