import type { MenuItemT } from "../domain/config-schema";
import { validateGroup, type GroupSelection } from "../domain/validate";
import { lineTotalCents, type Selection } from "../domain/price";
import type { ConfiguredItem } from "../domain/cart";

export type ItemConfigState = {
  item: MenuItemT;
  size: string | null;
  groups: Record<string, GroupSelection>;
  quantity: number;
};

export function defaultSize(item: MenuItemT): string | null {
  const g = item.definition.groups.find((x) => x.id === "size");
  return g && g.kind === "single" && g.options[0] ? g.options[0].id : null;
}

export function selectionOf(state: ItemConfigState): Selection {
  return { size: state.size, groups: { ...state.groups, size: state.size } };
}

export function resetInvalidForSize(state: ItemConfigState, sizeId: string): ItemConfigState {
  const groups: Record<string, GroupSelection> = {};
  for (const g of state.item.definition.groups) {
    const sel = state.groups[g.id];
    if (g.kind === "multi" && Array.isArray(sel)) {
      groups[g.id] = sel.filter((id) => {
        const opt = g.options.find((o) => o.id === id);
        return !opt?.availableForSizes || opt.availableForSizes.includes(sizeId);
      });
    } else if (sel !== undefined) {
      groups[g.id] = sel;
    }
  }
  return { ...state, size: sizeId, groups };
}

export function isConfigValid(state: ItemConfigState): boolean {
  const sel = selectionOf(state);
  return state.item.definition.groups.every((g) => validateGroup(g, sel.groups[g.id] ?? null).length === 0);
}

export function liveTotalCents(state: ItemConfigState): number {
  return lineTotalCents(state.item.definition, selectionOf(state), state.quantity);
}

export function toConfiguredItem(state: ItemConfigState, lineId: string): ConfiguredItem {
  const unitCents = liveTotalCents({ ...state, quantity: 1 });
  return { lineId, itemId: state.item.id, selection: selectionOf(state), quantity: state.quantity, unitCents, totalCents: unitCents * state.quantity };
}
