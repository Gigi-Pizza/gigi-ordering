import React from "@esm.sh/react";
import { MobileShell, TopBar, Button, OrderSummary, StickyAction } from "@gigi/ux/index.mjs";
import type { MenuConfigT } from "../domain/config-schema";
import type { Cart as CartType } from "../domain/cart";
import { money, pick } from "../lib/format";
import { useOrderingCopy } from "../copy";

export function Cart({ menu, cart, onRemove, onCheckout, onBack }: {
  menu: MenuConfigT;
  cart: CartType;
  onRemove: (lineId: string) => void;
  onCheckout: () => void;
  onBack: () => void;
}): React.ReactElement {
  const { t, lang } = useOrderingCopy();
  const nameOf = (itemId: string) => {
    const it = menu.items.find((i) => i.id === itemId);
    return it ? pick(it.name, lang) : itemId;
  };
  const summary = [
    ...cart.lines.map((l) => ({ label: `${nameOf(l.itemId)} × ${l.quantity}`, value: money(l.totalCents, lang) })),
    { label: t.total, value: money(cart.subtotalCents, lang), emphasized: true },
  ];

  return (
    <MobileShell>
      <TopBar title={t.cart} onBack={onBack} backLabel={t.back} />
      <main className="gigi-screen-content">
        {cart.lines.length === 0 ? (
          <p>{t.empty}</p>
        ) : (
          <React.Fragment>
            <OrderSummary lines={summary} />
            <div className="gigi-cart-lines">
              {cart.lines.map((l) => (
                <Button key={l.lineId} variant="subtle" size="small" onClick={() => onRemove(l.lineId)}>
                  {t.remove}: {nameOf(l.itemId)}
                </Button>
              ))}
            </div>
          </React.Fragment>
        )}
      </main>
      {cart.lines.length > 0 && <StickyAction onClick={onCheckout}>{t.checkout}</StickyAction>}
    </MobileShell>
  );
}
