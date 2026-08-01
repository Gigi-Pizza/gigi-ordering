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
import { CART_STORAGE_KEY, serializeCart, deserializeCart } from "./domain/cart-persistence";

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
  // Restore the cart from localStorage once, re-derived against the current menu.
  const restored = React.useMemo(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(CART_STORAGE_KEY);
    } catch {
      /* localStorage may be unavailable */
    }
    return deserializeCart(raw, gigiMenuConfig);
  }, []);
  const [noticeDismissed, setNoticeDismissed] = React.useState(false);
  const [snapshot, send] = useMachine(flowMachine, {
    input: { menu: gigiMenuConfig, cart: restored.cart },
  });
  const ctx = snapshot.context;
  const value = snapshot.value as string;

  // Persist choices on every cart change.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serializeCart(ctx.cart)));
    } catch {
      /* localStorage may be unavailable */
    }
  }, [ctx.cart]);

  // Clear the persisted cart once the order is placed.
  React.useEffect(() => {
    if (value !== "confirmed") return;
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      /* localStorage may be unavailable */
    }
  }, [value]);

  const showDropNotice = restored.droppedCount > 0 && !noticeDismissed;
  const cartQuantities = quantitiesByItem(ctx.cart);
  const cartCount = Object.values(cartQuantities).reduce((total, quantity) => total + quantity, 0);

  let screen: React.ReactElement;
  if (value === "configuringItem" && ctx.selectedItem) {
    screen = (
      <Configure
        item={ctx.selectedItem}
        onCancel={() => send({ type: "CANCEL_CONFIG" })}
        onAddToCart={(line) => send({ type: "ADD_TO_CART", line })}
      />
    );
  } else if (value === "reviewingCart") {
    screen = (
      <Cart
        menu={ctx.menu}
        cart={ctx.cart}
        onRemove={(id) => send({ type: "REMOVE_LINE", lineId: id })}
        onCheckout={() => send({ type: "GO_CHECKOUT" })}
        onBack={() => send({ type: "BACK_TO_BROWSE" })}
      />
    );
  } else if (value === "checkout") {
    screen = (
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
  } else if (value === "confirmed") {
    screen = <Placeholder title={t.confirmed} message={t.confirmedBody} />;
  } else {
    screen = (
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

  return (
    <React.Fragment>
      {showDropNotice && (
        <div className="gigi-cart-notice" role="status">
          <span>{t.cartItemRemoved}</span>
          <button
            type="button"
            className="gigi-cart-notice__close"
            aria-label={t.dismiss}
            onClick={() => setNoticeDismissed(true)}
          >
            ×
          </button>
        </div>
      )}
      {screen}
    </React.Fragment>
  );
}
