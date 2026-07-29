import React from "@esm.sh/react";
import { useMachine } from "@esm.sh/@xstate/react";
import type { RuntimeModuleContext } from "@rmc-toolkit/core";
import { flowMachine } from "./machine/flow.machine";
import { gigiMenuConfig } from "./domain/gigi-menu-config";
import { Browse } from "./screens/Browse";
import { Configure } from "./screens/Configure";
import { Cart } from "./screens/Cart";
import { Checkout } from "./screens/Checkout";
import { Placeholder } from "./screens/Placeholder";
import { useOrderingCopy } from "./copy";
import { quantitiesByItem } from "./domain/cart";

/**
 * gigi-ordering slice — the config-driven ordering configurator.
 *
 * The host renders this default export at /ordering (inside its LanguageProvider,
 * so useLang/useOrderingCopy work). A single flow machine owns navigation + cart;
 * each screen composes @gigi/ux components. Checkout/Confirmed are placeholders
 * until Sub-plan 4 (TanStack Form checkout).
 */
export default function OrderingSlice(_props: { context?: RuntimeModuleContext }): React.ReactElement {
  const { t } = useOrderingCopy();
  const [activeCat, setActiveCat] = React.useState("pizza");
  const [snapshot, send] = useMachine(flowMachine, { input: { menu: gigiMenuConfig } });
  const ctx = snapshot.context;
  const value = snapshot.value as string;
  const cartQuantities = quantitiesByItem(ctx.cart);
  const cartCount = Object.values(cartQuantities).reduce((total, quantity) => total + quantity, 0);

  if (value === "configuringItem" && ctx.selectedItem) {
    return (
      <Configure
        item={ctx.selectedItem}
        onCancel={() => send({ type: "CANCEL_CONFIG" })}
        onAddToCart={(line) => send({ type: "ADD_TO_CART", line })}
      />
    );
  }

  if (value === "reviewingCart") {
    return (
      <Cart
        menu={ctx.menu}
        cart={ctx.cart}
        onRemove={(id) => send({ type: "REMOVE_LINE", lineId: id })}
        onCheckout={() => send({ type: "GO_CHECKOUT" })}
        onBack={() => send({ type: "BACK_TO_BROWSE" })}
      />
    );
  }

  if (value === "checkout") {
    return (
      <Checkout
        onBack={() => send({ type: "BACK_TO_CART" })}
        onPlace={(fulfillment, customer) => {
          // canPlace requires fulfillment !== null; set it, then place. Both
          // events process synchronously so the PLACE guard passes.
          send({ type: "SET_FULFILLMENT", fulfillment });
          send({ type: "PLACE", customer, createdAt: new Date().toISOString() });
        }}
      />
    );
  }

  if (value === "confirmed") {
    return <Placeholder title={t.confirmed} message={t.confirmedBody} />;
  }

  return (
    <Browse
      menu={ctx.menu}
      activeCat={activeCat}
      onCat={setActiveCat}
      onSelect={(item) => send({ type: "SELECT_ITEM", item })}
      cartCount={cartCount}
      cartQuantities={cartQuantities}
      onViewCart={() => send({ type: "VIEW_CART" })}
    />
  );
}
