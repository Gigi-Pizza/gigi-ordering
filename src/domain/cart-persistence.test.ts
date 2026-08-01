import { describe, it, expect } from "vitest";
import { gigiMenuConfig } from "./gigi-menu-config";
import type { MenuConfigT, MenuItemT } from "./config-schema";
import type { Selection } from "./price";
import { emptyCart, addLine, type Cart } from "./cart";
import { lineId } from "../lib/format";
import {
  CART_STORAGE_KEY, CART_SCHEMA_VERSION,
  serializeCart, deserializeCart, selectionValidForItem,
} from "./cart-persistence";

// --- helpers: derive a valid selection from an item's own definition, so the
// tests never hardcode option ids we don't control. ---
const pizza = (): MenuItemT => gigiMenuConfig.items.find((i) => i.id === "pizza-plain")!;

function firstSizeId(item: MenuItemT): string {
  const g = item.definition.groups.find((x) => x.id === "size");
  if (g && g.kind === "single") return g.options[0].id;
  throw new Error("expected a size group");
}
function firstMultiGroup(item: MenuItemT) {
  const g = item.definition.groups.find((x) => x.kind === "multi");
  if (!g || g.kind !== "multi") throw new Error("expected a multi group");
  return g;
}
// A pizza selection with one topping chosen (size mirrored into groups.size,
// matching selectionOf() in item-config.helpers).
function pizzaSelectionWithTopping(item: MenuItemT): Selection {
  const size = firstSizeId(item);
  const multi = firstMultiGroup(item);
  return { size, groups: { size, [multi.id]: [multi.options[0].id] } };
}
function cartWith(item: MenuItemT, selection: Selection, quantity = 2): Cart {
  return addLine(emptyCart(), {
    lineId: lineId(), itemId: item.id, selection, quantity, unitCents: 0, totalCents: 0,
  });
}

describe("cart-persistence", () => {
  it("serializeCart keeps only choices (itemId, selection, quantity)", () => {
    const p = pizza();
    const persisted = serializeCart(cartWith(p, pizzaSelectionWithTopping(p)));
    expect(persisted.version).toBe(CART_SCHEMA_VERSION);
    expect(persisted.lines).toHaveLength(1);
    expect(Object.keys(persisted.lines[0]).sort()).toEqual(["itemId", "quantity", "selection"]);
  });

  it("round-trips a valid line and reprices it from the menu", () => {
    const p = pizza();
    const raw = JSON.stringify(serializeCart(cartWith(p, pizzaSelectionWithTopping(p), 2)));
    const { cart, droppedCount } = deserializeCart(raw, gigiMenuConfig);
    expect(droppedCount).toBe(0);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].itemId).toBe(p.id);
    expect(cart.lines[0].quantity).toBe(2);
    expect(cart.lines[0].unitCents).toBeGreaterThan(0);
    expect(cart.lines[0].totalCents).toBe(cart.lines[0].unitCents * 2);
    expect(cart.subtotalCents).toBe(cart.lines[0].totalCents);
  });

  it("reflects a seed price change on reload", () => {
    const p = pizza();
    const raw = JSON.stringify(serializeCart(cartWith(p, { size: firstSizeId(p), groups: { size: firstSizeId(p) } }, 1)));
    const before = deserializeCart(raw, gigiMenuConfig).cart.lines[0].unitCents;

    const menu2: MenuConfigT = structuredClone(gigiMenuConfig);
    const p2 = menu2.items.find((i) => i.id === "pizza-plain")!;
    const size = firstSizeId(p2);
    // bump this size's base price by $5
    if (p2.definition.basePrice.kind === "bySize") (p2.definition.basePrice.table as Record<string, number>)[size] += 500;
    else (p2.definition.basePrice as { cents: number }).cents += 500;

    const after = deserializeCart(raw, menu2).cart.lines[0].unitCents;
    expect(after).toBe(before + 500);
  });

  it("drops a line whose item no longer exists", () => {
    const raw = JSON.stringify({
      version: CART_SCHEMA_VERSION,
      lines: [{ itemId: "no-such-item", selection: { size: null, groups: {} }, quantity: 1 }],
    });
    const { cart, droppedCount } = deserializeCart(raw, gigiMenuConfig);
    expect(cart.lines).toHaveLength(0);
    expect(droppedCount).toBe(1);
  });

  it("drops a line whose selected option was removed from the seed", () => {
    const p = pizza();
    const sel = pizzaSelectionWithTopping(p);
    const raw = JSON.stringify(serializeCart(cartWith(p, sel, 1)));

    const menu2: MenuConfigT = structuredClone(gigiMenuConfig);
    const p2 = menu2.items.find((i) => i.id === "pizza-plain")!;
    const multi = p2.definition.groups.find((g) => g.kind === "multi")!;
    if (multi.kind === "multi") (multi as unknown as { options: unknown[] }).options = multi.options.slice(1); // remove the chosen topping

    const { cart, droppedCount } = deserializeCart(raw, menu2);
    expect(cart.lines).toHaveLength(0);
    expect(droppedCount).toBe(1);
  });

  it("leaves existing lines valid when a new item is added to the seed", () => {
    const p = pizza();
    const raw = JSON.stringify(serializeCart(cartWith(p, { size: firstSizeId(p), groups: { size: firstSizeId(p) } }, 1)));
    const menu2: MenuConfigT = structuredClone(gigiMenuConfig);
    (menu2.items as MenuItemT[]).push({ ...structuredClone(p), id: "brand-new-item" });
    const { cart, droppedCount } = deserializeCart(raw, menu2);
    expect(droppedCount).toBe(0);
    expect(cart.lines).toHaveLength(1);
  });

  it("returns an empty cart (no throw) for null, corrupt, or version-mismatched data", () => {
    expect(deserializeCart(null, gigiMenuConfig)).toEqual({ cart: emptyCart(), droppedCount: 0 });
    expect(deserializeCart("{not json", gigiMenuConfig)).toEqual({ cart: emptyCart(), droppedCount: 0 });
    const stale = JSON.stringify({ version: 999, lines: [] });
    expect(deserializeCart(stale, gigiMenuConfig)).toEqual({ cart: emptyCart(), droppedCount: 0 });
  });

  it("exposes the storage key", () => {
    expect(CART_STORAGE_KEY).toBe("gigi-cart");
  });

  it("selectionValidForItem rejects an unknown option id", () => {
    const p = pizza();
    const multi = firstMultiGroup(p);
    const bad: Selection = { size: firstSizeId(p), groups: { size: firstSizeId(p), [multi.id]: ["not-a-real-option"] } };
    expect(selectionValidForItem(p, bad)).toBe(false);
  });
});
