import type { PriceT, ItemDefinitionT } from "./config-schema";
import type { GroupSelection } from "./validate";

export function resolvePrice(price: PriceT, sizeId: string | null): number {
  if (price.kind === "flat") return price.cents;
  return sizeId ? (price.table[sizeId] ?? 0) : 0;
}

export type Selection = { size: string | null; groups: Record<string, GroupSelection> };

export function lineTotalCents(def: ItemDefinitionT, selection: Selection, quantity: number): number {
  const policyGroupIds = new Set(def.basePricePolicy?.groupIds ?? []);
  let unit = resolvePrice(def.basePrice, selection.size);

  if (def.basePricePolicy?.kind === "maxOfSingleGroups") {
    unit = 0;
    for (const groupId of def.basePricePolicy.groupIds) {
      const group = def.groups.find((candidate) => candidate.id === groupId);
      const selectedId = selection.groups[groupId];
      if (!group || group.kind !== "single" || typeof selectedId !== "string") continue;
      const option = group.options.find((candidate) => candidate.id === selectedId);
      if (option) unit = Math.max(unit, resolvePrice(option.price, selection.size));
    }
  }

  for (const group of def.groups) {
    if (policyGroupIds.has(group.id)) continue;
    if (group.kind === "single" || group.kind === "multi") {
      const sel = selection.groups[group.id];
      const chosenIds =
        group.kind === "single"
          ? typeof sel === "string"
            ? [sel]
            : []
          : Array.isArray(sel)
            ? [...sel]
            : [];
      for (const id of chosenIds) {
        const opt = group.options.find((o) => o.id === id);
        if (opt) unit += resolvePrice(opt.price, selection.size);
      }
    } else if (group.kind === "quantity") {
      const counts = (selection.groups[group.id] as Record<string, number>) ?? {};
      for (const [id, n] of Object.entries(counts)) {
        const opt = group.options.find((o) => o.id === id);
        if (opt) unit += resolvePrice(opt.price, selection.size) * n;
      }
    }
    // text groups carry no price
  }
  return unit * quantity;
}
