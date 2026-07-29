import React from "@esm.sh/react";
import { useMachine } from "@esm.sh/@xstate/react";
import type { RuntimeModuleContext } from "@rmc-toolkit/core";
import { flowMachine } from "./machine/flow.machine";
import { gigiMenuConfig } from "./domain/gigi-menu-config";
import { Browse } from "./screens/Browse";
import { Configure } from "./screens/Configure";
import { Cart } from "./screens/Cart";
import { Placeholder } from "./screens/Placeholder";
import { useOrderingCopy } from "./copy";

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
      <Placeholder
        title={t.checkout}
        message={t.checkout}
        actionLabel={t.placeOrder}
        onBack={() => send({ type: "BACK_TO_CART" })}
        onAction={() => {
          // Sub-plan 4 replaces this stub with the TanStack Form checkout that
          // captures real fulfillment + customer details. For now, default to
          // pickup so canPlace passes and the confirmation screen is reachable.
          send({ type: "SET_FULFILLMENT", fulfillment: { mode: "pickup" } });
          send({
            type: "PLACE",
            customer: { name: "Guest", phone: "5146974587", email: "guest@example.com" },
            createdAt: new Date().toISOString(),
          });
        }}
      />
    );
  }

  if (value === "confirmed") {
    return <Placeholder title={t.confirmed} message={t.confirmed} detail={JSON.stringify(ctx.order, null, 2)} />;
  }

  return (
    <Browse
      menu={ctx.menu}
      activeCat={activeCat}
      onCat={setActiveCat}
      onSelect={(item) => send({ type: "SELECT_ITEM", item })}
      cartCount={ctx.cart.lines.length}
      onViewCart={() => send({ type: "VIEW_CART" })}
    />
  );
}
