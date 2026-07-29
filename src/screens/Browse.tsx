import React from "@esm.sh/react";
import { MobileShell, Button, MenuItemCard, StickyAction } from "@gigi/ux/index.mjs";
import type { MenuConfigT, MenuItemT } from "../domain/config-schema";
import { money, pick } from "../lib/format";
import { useOrderingCopy } from "../copy";

const CATEGORIES = ["pizza", "subs", "pasta", "extras", "drinks"];

function fromPrice(item: MenuItemT, lang: "en" | "fr"): string {
  if (item.definition.basePricePolicy?.kind === "maxOfSingleGroups") {
    const policyOptions = item.definition.basePricePolicy.groupIds
      .map((groupId) => item.definition.groups.find((group) => group.id === groupId))
      .flatMap((group) => group && group.kind === "single" ? [...group.options] : []);
    const cents = Math.min(...policyOptions.flatMap((option) =>
      option.price.kind === "flat" ? [option.price.cents] : Object.values(option.price.table)));
    return money(Number.isFinite(cents) ? cents : 0, lang);
  }
  const bp = item.definition.basePrice;
  const cents = bp.kind === "flat" ? bp.cents : Math.min(...Object.values(bp.table));
  return money(cents, lang);
}

export function Browse({ menu, activeCat, onCat, onSelect, cartCount, onViewCart }: {
  menu: MenuConfigT;
  activeCat: string;
  onCat: (c: string) => void;
  onSelect: (item: MenuItemT) => void;
  cartCount: number;
  onViewCart: () => void;
}): React.ReactElement {
  const { t, lang } = useOrderingCopy();
  const items = menu.items.filter((i) => i.category === activeCat);

  return (
    <MobileShell>
      <header className="gigi-ordering-head"><h1>{t.title}</h1></header>
      <nav className="gigi-category-tabs" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <Button key={c} variant={c === activeCat ? "primary" : "subtle"} size="small" onClick={() => onCat(c)}>
            {t.cats[c]}
          </Button>
        ))}
      </nav>
      <main className="gigi-screen-content gigi-screen-content--browse">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            heading={pick(item.name, lang)}
            description={item.description ? pick(item.description, lang) : ""}
            price={`${t.from} ${fromPrice(item, lang)}`}
            actionLabel={t.select}
            onAction={() => onSelect(item)}
          />
        ))}
      </main>
      {cartCount > 0 && <StickyAction onClick={onViewCart}>{t.viewCart} · {cartCount}</StickyAction>}
    </MobileShell>
  );
}
