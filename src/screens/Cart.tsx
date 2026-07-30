import React from "@esm.sh/react";
import { MobileShell, TopBar, StickyAction } from "@gigi/ux/index.mjs";
import type { MenuConfigT, MenuItemT } from "../domain/config-schema";
import type { Cart as CartType } from "../domain/cart";
import type { Selection } from "../domain/price";
import { resolvePrice } from "../domain/price";
import { money, pick } from "../lib/format";
import { useOrderingCopy } from "../copy";

type Detail = { label: string; cost?: number };

// Turn a configured line's selection into a readable list of its add-ons /
// changes, carrying a per-option cost only where the option adds an upcharge.
// (Size + free choices like "Well done" show with no cost; halves are labelled
// by side; the base price is already in the line total.)
function lineDetails(item: MenuItemT, selection: Selection, lang: "en" | "fr"): Detail[] {
  const out: Detail[] = [];
  const size = selection.size;
  for (const g of item.definition.groups) {
    const sel = selection.groups[g.id];
    if (g.kind === "single") {
      if (typeof sel !== "string") continue;
      const opt = g.options.find((o) => o.id === sel);
      if (!opt) continue;
      const label = pick(opt.label, lang);
      out.push(g.id === "halfLeft" || g.id === "halfRight"
        ? { label: `${pick(g.label, lang)}: ${label}` }
        : { label });
    } else if (g.kind === "multi") {
      for (const id of Array.isArray(sel) ? sel : []) {
        const opt = g.options.find((o) => o.id === id);
        if (opt) out.push({ label: pick(opt.label, lang), cost: resolvePrice(opt.price, size) });
      }
    } else if (g.kind === "quantity") {
      const counts = sel && typeof sel === "object" && !Array.isArray(sel) ? (sel as Record<string, number>) : {};
      for (const [id, n] of Object.entries(counts)) {
        const opt = n ? g.options.find((o) => o.id === id) : undefined;
        if (opt) out.push({ label: `${pick(opt.label, lang)} × ${n}`, cost: resolvePrice(opt.price, size) * n });
      }
    } else if (g.kind === "text") {
      if (typeof sel === "string" && sel.trim()) out.push({ label: `${pick(g.label, lang)}: ${sel.trim()}` });
    }
  }
  return out;
}

export function Cart({ menu, cart, onRemove, onCheckout, onBack }: {
  menu: MenuConfigT;
  cart: CartType;
  onRemove: (lineId: string) => void;
  onCheckout: () => void;
  onBack: () => void;
}): React.ReactElement {
  const { t, lang } = useOrderingCopy();

  return (
    <MobileShell>
      <TopBar title={t.cart} onBack={onBack} backLabel={t.back} />
      <main className="gigi-screen-content gigi-screen-content--cart">
        {cart.lines.length === 0 ? (
          <p>{t.empty}</p>
        ) : (
          <React.Fragment>
            <ul className="gigi-cart">
              {cart.lines.map((l) => {
                const item = menu.items.find((i) => i.id === l.itemId);
                const details = item ? lineDetails(item, l.selection, lang) : [];
                return (
                  <li key={l.lineId} className="gigi-cart-line">
                    <div className="gigi-cart-line__row">
                      <span className="gigi-cart-line__name">{item ? pick(item.name, lang) : l.itemId} × {l.quantity}</span>
                      <span className="gigi-cart-line__price">{money(l.totalCents, lang)}</span>
                    </div>
                    {details.length > 0 && (
                      <ul className="gigi-cart-line__addons">
                        {details.map((d, i) => (
                          <li key={i}>
                            <span>{d.label}</span>
                            {d.cost ? <span className="gigi-cart-line__addon-cost">+{money(d.cost, lang)}</span> : null}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button type="button" className="gigi-cart-line__remove" onClick={() => onRemove(l.lineId)}>{t.remove}</button>
                  </li>
                );
              })}
            </ul>
            <div className="gigi-cart-total">
              <span>{t.total}</span>
              <span>{money(cart.subtotalCents, lang)}</span>
            </div>
          </React.Fragment>
        )}
      </main>
      {cart.lines.length > 0 && <StickyAction onClick={onCheckout}>{t.checkout}</StickyAction>}
    </MobileShell>
  );
}
