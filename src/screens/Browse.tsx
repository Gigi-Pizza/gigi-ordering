import React from "@esm.sh/react";
import { MobileShell, Button, MenuItemCard, StickyAction } from "@gigi/ux/index.mjs";
import type { MenuConfigT, MenuItemT } from "../domain/config-schema";
import { money, pick } from "../lib/format";
import { useOrderingCopy } from "../copy";

const CATEGORIES = ["pizza", "subs", "pasta", "extras", "drinks"];

function fromPrice(item: MenuItemT, lang: "en" | "fr"): string {
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
      <main className="gigi-screen-content">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            heading={pick(item.name, lang)}
            description={`${t.from} ${fromPrice(item, lang)}`}
            actionLabel={t.customize}
            onAction={() => onSelect(item)}
          />
        ))}
      </main>
      {cartCount > 0 && <StickyAction onClick={onViewCart}>{t.viewCart} · {cartCount}</StickyAction>}
    </MobileShell>
  );
}
