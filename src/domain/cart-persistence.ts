import type { MenuConfigT, MenuItemT, OptionGroupT } from "./config-schema";
import type { Cart, ConfiguredItem } from "./cart";
import { emptyCart, addLine } from "./cart";
import type { Selection } from "./price";
import { lineTotalCents } from "./price";
import type { GroupSelection } from "./validate";
import { validateGroup } from "./validate";
import { lineId } from "../lib/format";

export const CART_STORAGE_KEY = "gigi-cart";
export const CART_SCHEMA_VERSION = 1;

export type PersistedLine = { itemId: string; selection: Selection; quantity: number };
export type PersistedCart = { version: number; lines: PersistedLine[] };

// Persist choices only — never derived data (price/labels/images/lineId).
export function serializeCart(cart: Cart): PersistedCart {
  return {
    version: CART_SCHEMA_VERSION,
    lines: cart.lines.map((l) => ({ itemId: l.itemId, selection: l.selection, quantity: l.quantity })),
  };
}

// The option ids a group selection references (empty for text groups).
function referencedOptionIds(group: OptionGroupT, sel: GroupSelection | undefined): string[] {
  if (group.kind === "single") return typeof sel === "string" ? [sel] : [];
  if (group.kind === "multi") return Array.isArray(sel) ? [...sel] : [];
  if (group.kind === "quantity") {
    const counts = sel && typeof sel === "object" && !Array.isArray(sel) ? (sel as Record<string, number>) : {};
    return Object.entries(counts).filter(([, n]) => n > 0).map(([id]) => id);
  }
  return [];
}

// A selection is valid iff every referenced option still exists in the current
// menu AND the selection still satisfies each group's structural rules.
export function selectionValidForItem(item: MenuItemT, selection: Selection): boolean {
  for (const group of item.definition.groups) {
    const sel = selection.groups[group.id];
    if (group.kind !== "text") {
      const known = new Set(group.options.map((o) => o.id));
      for (const id of referencedOptionIds(group, sel)) if (!known.has(id)) return false;
    }
    if (validateGroup(group, (sel ?? null) as GroupSelection).length > 0) return false;
  }
  return true;
}

function isPersistedCart(v: unknown): v is PersistedCart {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.version !== "number" || !Array.isArray(o.lines)) return false;
  return o.lines.every((l) => {
    if (typeof l !== "object" || l === null) return false;
    const line = l as Record<string, unknown>;
    const selection = line.selection as Record<string, unknown> | null;
    return typeof line.itemId === "string"
      && typeof line.quantity === "number"
      && typeof selection === "object" && selection !== null
      && typeof selection.groups === "object" && selection.groups !== null;
  });
}

function rebuildLine(item: MenuItemT, persisted: PersistedLine): ConfiguredItem {
  const unitCents = lineTotalCents(item.definition, persisted.selection, 1);
  return {
    lineId: lineId(),
    itemId: item.id,
    selection: persisted.selection,
    quantity: persisted.quantity,
    unitCents,
    totalCents: unitCents * persisted.quantity,
  };
}

// Parse persisted cart JSON and re-derive it against the CURRENT menu. Invalid
// lines (missing item / removed option / bad quantity) are dropped and counted.
export function deserializeCart(raw: string | null, menu: MenuConfigT): { cart: Cart; droppedCount: number } {
  if (!raw) return { cart: emptyCart(), droppedCount: 0 };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { cart: emptyCart(), droppedCount: 0 };
  }
  if (!isPersistedCart(parsed) || parsed.version !== CART_SCHEMA_VERSION) {
    return { cart: emptyCart(), droppedCount: 0 };
  }

  let cart = emptyCart();
  let droppedCount = 0;
  for (const pl of parsed.lines) {
    const item = menu.items.find((i) => i.id === pl.itemId);
    const okQty = Number.isInteger(pl.quantity) && pl.quantity >= 1;
    if (!item || !okQty || !selectionValidForItem(item, pl.selection)) {
      droppedCount += 1;
      continue;
    }
    cart = addLine(cart, rebuildLine(item, pl));
  }
  return { cart, droppedCount };
}
