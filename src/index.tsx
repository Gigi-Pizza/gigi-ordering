import React from "@esm.sh/react";
import type { RuntimeModuleContext } from "@rmc-toolkit/core";

/**
 * gigi-ordering slice — default-exported React component.
 *
 * The host (gigi-host) loads this module via `createDynamicModuleBoundary` and
 * renders the default export inside its own React tree, passing `{ context }`.
 *
 * This is the entry point the full ordering experience grows from — the
 * bilingual menu browse, item customization (structured modifiers), cart,
 * Moneris checkout, and order confirmation described in the design spec. For
 * now it renders a placeholder so the host↔slice wiring is verifiable.
 */
export default function OrderingSlice({
  context,
}: {
  context?: RuntimeModuleContext;
}): React.ReactElement {
  const route = context?.route?.route ?? "/ordering";
  return (
    <section data-slice="ordering">
      <h1>Order Online — Gigi Pizzeria</h1>
      <p>Ordering slice loaded for route {route}.</p>
    </section>
  );
}
