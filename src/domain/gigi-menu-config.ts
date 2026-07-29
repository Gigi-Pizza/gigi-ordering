import { Schema } from "@esm.sh/effect";
import { MenuConfig, type MenuConfigT, type OptionGroupT, type OptionT, type BilingualT } from "./config-schema";
import seed from "./menu.seed.json";

/**
 * The GIGI menu is defined as DATA in `menu.seed.json` (the single source of
 * truth). This module is a thin decoder: it reads that seed, assembles the
 * runtime `MenuConfig` (resolving templates + topping catalogs into concrete
 * option groups), and validates the result against the schema. To change the
 * menu — prices, items, descriptions, which groups apply, whether an item has a
 * "special instructions" field — edit the JSON, not this file.
 */

// ── raw seed shape (validated structurally by the final MenuConfig decode;
//    these types just make the assembly below type-safe) ──────────────────────
type Cents = number;
type PriceTable = Record<string, Cents>;
type SizeDef = { id: string; en: string; fr: string };
type CatalogOpt = { id: string; en: string; fr: string };
type Catalog = { priceTable: string; options: CatalogOpt[] };
type MultiDef = { id: string; en: string; fr: string; catalogs: string[] };
type TemplateDef = { sizeSet?: string; multiGroups?: MultiDef[]; notes: boolean };
type ItemDef = {
  id: string; en: string; fr: string; template: string;
  prices?: PriceTable; price?: Cents; descEn?: string; descFr?: string; image?: string;
};
type CategoryDef = {
  slug: string; en: string; fr: string;
  defaultDescEn?: string; defaultDescFr?: string; items: ItemDef[];
};
type HalfSideDef = { id: string; en: string; fr: string; extraId: string; extraEn: string; extraFr: string };
type HalfDef = {
  id: string; category: string; en: string; fr: string; descEn: string; descFr: string; image?: string;
  sizeSet: string; toppingDivisor: number; extraCatalogs: string[]; left: HalfSideDef; right: HalfSideDef;
};
type Seed = {
  priceTables: Record<string, PriceTable>;
  sizeSets: Record<string, SizeDef[]>;
  toppingCatalogs: Record<string, Catalog>;
  templates: Record<string, TemplateDef>;
  categories: CategoryDef[];
  halfAndHalf: HalfDef;
};

const raw = seed as unknown as Seed;
const bi = (en: string, fr: string): BilingualT => ({ en, fr });

// Named lookups that fail loudly if the seed references something undefined.
const need = <T,>(map: Record<string, T>, key: string, kind: string): T => {
  const v = map[key];
  if (v === undefined) throw new Error(`menu.seed.json: unknown ${kind} "${key}"`);
  return v;
};

// Reusable "special instructions" free-text group (added only when a template
// opts in via `notes: true`).
const notesGroup: OptionGroupT = {
  kind: "text", id: "notes", label: bi("Special instructions", "Instructions spéciales"),
  required: false, maxLength: 200,
};

function sizeGroupFrom(sizeSetName: string): OptionGroupT {
  const sizes = need(raw.sizeSets, sizeSetName, "sizeSet");
  return {
    kind: "single", id: "size", label: bi("Size", "Format"), required: true,
    options: sizes.map((s): OptionT => ({ id: s.id, label: bi(s.en, s.fr), price: { kind: "flat", cents: 0 } })),
  };
}

// Options drawn from one or more topping catalogs. Each catalog carries its own
// per-size price table; `divisor` supports half-price toppings (1 = full price).
function optionsFromCatalogs(catalogNames: string[], divisor = 1): OptionT[] {
  return catalogNames.flatMap((name) => {
    const catalog = need(raw.toppingCatalogs, name, "toppingCatalog");
    const table = need(raw.priceTables, catalog.priceTable, "priceTable");
    const scaled = divisor === 1
      ? table
      : Object.fromEntries(Object.entries(table).map(([size, cents]) => [size, Math.round(cents / divisor)]));
    return catalog.options.map((o): OptionT => ({ id: o.id, label: bi(o.en, o.fr), price: { kind: "bySize", table: scaled } }));
  });
}

function multiGroupFrom(def: MultiDef, divisor = 1): OptionGroupT {
  return { kind: "multi", id: def.id, label: bi(def.en, def.fr), min: 0, max: 12, options: optionsFromCatalogs(def.catalogs, divisor) };
}

function templateGroups(t: TemplateDef): OptionGroupT[] {
  const groups: OptionGroupT[] = [];
  if (t.sizeSet) groups.push(sizeGroupFrom(t.sizeSet));
  for (const m of t.multiGroups ?? []) groups.push(multiGroupFrom(m));
  if (t.notes) groups.push(notesGroup);
  return groups;
}

type BuiltItem = MenuConfigT["items"][number];

function buildItem(it: ItemDef, cat: CategoryDef): BuiltItem {
  const t = need(raw.templates, it.template, "template");
  const basePrice = t.sizeSet
    ? { kind: "bySize" as const, table: need2(it.prices, it.id, "prices") }
    : { kind: "flat" as const, cents: need2(it.price, it.id, "price") };
  const descEn = it.descEn ?? cat.defaultDescEn;
  const descFr = it.descFr ?? cat.defaultDescFr;
  const item: BuiltItem = {
    id: it.id, name: bi(it.en, it.fr), category: cat.slug,
    ...(descEn !== undefined && descFr !== undefined ? { description: bi(descEn, descFr) } : {}),
    ...(it.image !== undefined ? { image: it.image } : {}),
    definition: { templateId: it.template, basePrice, groups: templateGroups(t) },
  };
  return item;
}

// Required item field (prices for sized items, price for flat items).
function need2<T>(v: T | undefined, itemId: string, field: string): T {
  if (v === undefined) throw new Error(`menu.seed.json: item "${itemId}" is missing "${field}"`);
  return v;
}

// Half & half is assembled from the pizza items (each half is a whole pizza's
// base price) plus per-half extra groups — this derivation stays in code so the
// half options never drift from the pizza list.
function buildHalfAndHalf(pizzaItems: BuiltItem[]): BuiltItem {
  const h = raw.halfAndHalf;
  const halfOptions: OptionT[] = pizzaItems.map((p) => ({ id: p.id, label: p.name, price: p.definition.basePrice }));
  const halfGroup = (side: HalfSideDef): OptionGroupT => ({
    kind: "single", id: side.id, label: bi(side.en, side.fr), required: true, options: halfOptions,
  });
  const extraGroup = (side: HalfSideDef): OptionGroupT => ({
    kind: "multi", id: side.extraId, label: bi(side.extraEn, side.extraFr), min: 0, max: 12,
    options: optionsFromCatalogs(h.extraCatalogs, h.toppingDivisor),
  });
  return {
    id: h.id, name: bi(h.en, h.fr), category: h.category, description: bi(h.descEn, h.descFr),
    ...(h.image !== undefined ? { image: h.image } : {}),
    definition: {
      templateId: "half-and-half",
      basePrice: { kind: "flat", cents: 0 },
      basePricePolicy: { kind: "maxOfSingleGroups", groupIds: [h.left.id, h.right.id] },
      groups: [sizeGroupFrom(h.sizeSet), halfGroup(h.left), halfGroup(h.right), extraGroup(h.left), extraGroup(h.right), notesGroup],
    },
  };
}

function buildConfig(): MenuConfigT {
  const items: BuiltItem[] = [];
  for (const cat of raw.categories) {
    const built = cat.items.map((it) => buildItem(it, cat));
    items.push(...built);
    // Insert the half & half item right after its category's items (pizza).
    if (cat.slug === raw.halfAndHalf.category) items.push(buildHalfAndHalf(built));
  }
  const templates = Object.entries(raw.templates).map(([id, t]) => ({ id, groups: templateGroups(t) }));
  return Schema.decodeUnknownSync(MenuConfig)({ templates, items });
}

export const gigiMenuConfig: MenuConfigT = buildConfig();
