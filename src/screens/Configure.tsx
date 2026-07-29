import React from "@esm.sh/react";
import { useMachine } from "@esm.sh/@xstate/react";
import { MobileShell, TopBar, FormField, QuantityControl, StickyAction, ChoiceButtonGroup } from "@gigi/ux/index.mjs";
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
  const canConfirm = snapshot.can({ type: "CONFIRM" });
  const isHalfAndHalf = item.definition.basePricePolicy?.kind === "maxOfSingleGroups";

  return (
    <MobileShell>
      <TopBar title={pick(item.name, lang)} onBack={onCancel} backLabel={t.back} />
      <main className="gigi-customization">
        {isHalfAndHalf && <p className="gigi-half-price-note">{t.halfPriceNote}</p>}
        {item.definition.groups.map((g) => {
          if (g.kind === "single") {
            const selectedId = g.id === "size" ? ctx.size : ctx.groups[g.id];
            const isHalfGroup = g.id === "halfLeft" || g.id === "halfRight";
            return (
              <section key={g.id} className={isHalfGroup ? "gigi-half-config-section" : undefined}>
                <h2>{pick(g.label, lang)}</h2>
                <ChoiceButtonGroup
                  ariaLabel={pick(g.label, lang)}
                  columns={isHalfGroup ? 2 : 1}
                  selectedIds={typeof selectedId === "string" ? [selectedId] : []}
                  options={g.options.map((o) => ({
                    id: o.id,
                    label: `${pick(o.label, lang)}${g.id !== "size" ? ` · ${money(resolvePrice(o.price, ctx.size), lang)}` : ""}`,
                  }))}
                  onSelect={(optionId) => g.id === "size"
                    ? send({ type: "SET_SIZE", sizeId: optionId })
                    : send({ type: "SET_SINGLE", groupId: g.id, optionId })}
                />
              </section>
            );
          }
          if (g.kind === "multi") {
            const sel = Array.isArray(ctx.groups[g.id]) ? (ctx.groups[g.id] as string[]) : [];
            const isHalfExtraGroup = g.id === "extraLeft" || g.id === "extraRight";
            return (
              <section key={g.id} className={isHalfExtraGroup ? "gigi-half-config-section" : undefined}>
                <h2>{pick(g.label, lang)}</h2>
                <ChoiceButtonGroup
                  ariaLabel={pick(g.label, lang)}
                  columns={isHalfExtraGroup ? 2 : 1}
                  selectedIds={sel}
                  showSelectionMark
                  options={g.options.map((o) => ({
                    id: o.id,
                    label: `${pick(o.label, lang)} · ${money(resolvePrice(o.price, ctx.size), lang)}`,
                  }))}
                  onSelect={(optionId) => send({ type: "TOGGLE_MULTI", groupId: g.id, optionId })}
                />
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
      <StickyAction disabled={!canConfirm} onClick={() => { if (canConfirm) onAddToCart(toConfiguredItem(ctx, lineId())); }}>
        {t.addToCart} · {money(liveTotalCents(ctx), lang)}
      </StickyAction>
    </MobileShell>
  );
}
