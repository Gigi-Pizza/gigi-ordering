import React from "@esm.sh/react";
import { useMachine } from "@esm.sh/@xstate/react";
import { MobileShell, TopBar, Button, FormField, QuantityControl, StickyAction } from "@gigi/ux/index.mjs";
import type { MenuItemT } from "../domain/config-schema";
import type { ConfiguredItem } from "../domain/cart";
import { resolvePrice } from "../domain/price";
import { itemConfigMachine } from "../machine/item-config.machine";
import { liveTotalCents, toConfiguredItem } from "../machine/item-config.helpers";
import { money, pick, lineId } from "../lib/format";
import { useOrderingCopy } from "../copy";

export function Configure({ item, onCancel, onAddToCart }: {
  item: MenuItemT;
  onCancel: () => void;
  onAddToCart: (line: ConfiguredItem) => void;
}): React.ReactElement {
  const { t, lang } = useOrderingCopy();
  const [snapshot, send] = useMachine(itemConfigMachine, { input: { item } });
  const ctx = snapshot.context;
  const unitDollars = liveTotalCents({ ...ctx, quantity: 1 }) / 100;

  return (
    <MobileShell>
      <TopBar title={pick(item.name, lang)} onBack={onCancel} backLabel={t.back} />
      <main className="gigi-customization">
        {item.definition.groups.map((g) => {
          if (g.kind === "single") {
            return (
              <section key={g.id}>
                <h2>{pick(g.label, lang)}</h2>
                <div className="gigi-choice-grid">
                  {g.options.map((o) => (
                    <Button key={o.id} fullWidth variant={ctx.size === o.id ? "primary" : "neutral"}
                      onClick={() => send({ type: "SET_SIZE", sizeId: o.id })}>{pick(o.label, lang)}</Button>
                  ))}
                </div>
              </section>
            );
          }
          if (g.kind === "multi") {
            const sel = Array.isArray(ctx.groups[g.id]) ? (ctx.groups[g.id] as string[]) : [];
            return (
              <section key={g.id}>
                <h2>{pick(g.label, lang)}</h2>
                <div className="gigi-choice-grid">
                  {g.options.map((o) => (
                    <Button key={o.id} fullWidth variant={sel.includes(o.id) ? "primary" : "neutral"}
                      onClick={() => send({ type: "TOGGLE_MULTI", groupId: g.id, optionId: o.id })}>
                      {sel.includes(o.id) ? "✓ " : ""}{pick(o.label, lang)} · {money(resolvePrice(o.price, ctx.size), lang)}
                    </Button>
                  ))}
                </div>
              </section>
            );
          }
          if (g.kind === "text") {
            const val = typeof ctx.groups[g.id] === "string" ? (ctx.groups[g.id] as string) : "";
            return (
              <section key={g.id}>
                <FormField label={pick(g.label, lang)} value={val}
                  onChange={(e) => send({ type: "SET_TEXT", groupId: g.id, value: e.target.value })} />
              </section>
            );
          }
          return null;
        })}
        <section>
          <QuantityControl label={t.quantity} price={unitDollars} quantity={ctx.quantity}
            onChange={(q) => send({ type: "SET_QUANTITY", quantity: Math.max(1, q) })} />
        </section>
      </main>
      <StickyAction onClick={() => { if (snapshot.can({ type: "CONFIRM" })) onAddToCart(toConfiguredItem(ctx, lineId())); }}>
        {t.addToCart} · {money(liveTotalCents(ctx), lang)}
      </StickyAction>
    </MobileShell>
  );
}
