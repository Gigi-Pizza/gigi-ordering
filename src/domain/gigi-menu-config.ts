import { Schema } from "@esm.sh/effect";
import { MenuConfig, type MenuConfigT, type OptionGroupT, type OptionT } from "./config-schema";

// ── helpers ──────────────────────────────────────────────────────────────────
const bi = (en: string, fr: string) => ({ en, fr });

type SizeDef = { id: string; label: { en: string; fr: string } };
const PIZZA_SIZES: SizeDef[] = [
  { id: "S", label: bi('Small 10"', "Petite 10 po") },
  { id: "M", label: bi('Medium 12"', "Moyenne 12 po") },
  { id: "L", label: bi('Large 14"', "Grande 14 po") },
  { id: "XL", label: bi('X-Large 16"', "Très grande 16 po") },
];
const SUB_SIZES: SizeDef[] = [
  { id: "7", label: bi('7"', "7 po") },
  { id: "10", label: bi('10"', "10 po") },
  { id: "14", label: bi('14"', "14 po") },
];

// Derived upcharges (spec §9.1), per size.
const EXTRA1 = { S: 520, M: 630, L: 700, XL: 780 };
const EXTRA2 = { S: 395, M: 445, L: 485, XL: 535 };
const SUB_EXTRA = { "7": 250, "10": 275, "14": 305 };

const sizeGroup = (sizes: SizeDef[]): OptionGroupT => ({
  kind: "single", id: "size", label: bi("Size", "Format"), required: true,
  options: sizes.map((s): OptionT => ({ id: s.id, label: s.label, price: { kind: "flat", cents: 0 } })),
});

const multiGroup = (
  id: string, en: string, fr: string,
  opts: { id: string; en: string; fr: string; table: Record<string, number> }[],
): OptionGroupT => ({
  kind: "multi", id, label: bi(en, fr), min: 0, max: 12,
  options: opts.map((o): OptionT => ({ id: o.id, label: bi(o.en, o.fr), price: { kind: "bySize", table: o.table } })),
});

const notes: OptionGroupT = {
  kind: "text", id: "notes", label: bi("Special instructions", "Instructions spéciales"), required: false, maxLength: 200,
};

const EXTRA1_OPTS = [
  { id: "pepperoni", en: "Pepperoni", fr: "Pepperoni", table: EXTRA1 },
  { id: "bacon", en: "Bacon", fr: "Bacon", table: EXTRA1 },
  { id: "capicollo", en: "Capicollo", fr: "Capicollo", table: EXTRA1 },
  { id: "anchovies", en: "Anchovies", fr: "Anchois", table: EXTRA1 },
  { id: "extra-cheese", en: "Extra cheese", fr: "Fromage supplémentaire", table: EXTRA1 },
];
const EXTRA2_OPTS = [
  { id: "mushrooms", en: "Mushrooms", fr: "Champignons", table: EXTRA2 },
  { id: "green-peppers", en: "Green peppers", fr: "Piments verts", table: EXTRA2 },
  { id: "onions", en: "Onions", fr: "Oignons", table: EXTRA2 },
  { id: "green-olives", en: "Green olives", fr: "Olives vertes", table: EXTRA2 },
];
const SUB_EXTRA_OPTS = [
  { id: "extra-cheese", en: "Extra cheese", fr: "Fromage supplémentaire", table: SUB_EXTRA },
  { id: "extra-steak", en: "Extra steak", fr: "Steak supplémentaire", table: SUB_EXTRA },
  { id: "mushrooms", en: "Mushrooms", fr: "Champignons", table: SUB_EXTRA },
  { id: "green-peppers", en: "Green peppers", fr: "Piments verts", table: SUB_EXTRA },
  { id: "onions", en: "Onions", fr: "Oignons", table: SUB_EXTRA },
];

type Item = MenuConfigT["items"][number];

const pizza = (id: string, en: string, fr: string, base: Record<string, number>): Item => ({
  id, name: bi(en, fr), category: "pizza",
  definition: {
    templateId: "sized-with-addons",
    basePrice: { kind: "bySize", table: base },
    groups: [sizeGroup(PIZZA_SIZES), multiGroup("extra1", "Add-ons", "Garnitures", EXTRA1_OPTS), multiGroup("extra2", "Vegetables", "Légumes", EXTRA2_OPTS), notes],
  },
});

const sub = (id: string, en: string, fr: string, base: Record<string, number>): Item => ({
  id, name: bi(en, fr), category: "subs",
  definition: {
    templateId: "sized-simple",
    basePrice: { kind: "bySize", table: base },
    groups: [sizeGroup(SUB_SIZES), multiGroup("extras", "Extras", "Extras", SUB_EXTRA_OPTS), notes],
  },
});

const flat = (id: string, en: string, fr: string, category: string, cents: number): Item => ({
  id, name: bi(en, fr), category,
  definition: { templateId: "single-price", basePrice: { kind: "flat", cents }, groups: [notes] },
});

// ── Gigi 2025 config ─────────────────────────────────────────────────────────
const raw: MenuConfigT = {
  templates: [
    { id: "sized-with-addons", groups: [sizeGroup(PIZZA_SIZES), multiGroup("extra1", "Add-ons", "Garnitures", EXTRA1_OPTS), multiGroup("extra2", "Vegetables", "Légumes", EXTRA2_OPTS), notes] },
    { id: "sized-simple", groups: [sizeGroup(SUB_SIZES), multiGroup("extras", "Extras", "Extras", SUB_EXTRA_OPTS), notes] },
    { id: "single-price", groups: [notes] },
    { id: "variant", groups: [] },
  ],
  items: [
    pizza("pizza-plain", "Plain", "Ordinaire", { S: 1515, M: 2045, L: 2625, XL: 3090 }),
    pizza("pizza-mushrooms", "Mushrooms", "Champignons", { S: 1680, M: 2385, L: 3005, XL: 3440 }),
    pizza("pizza-green-peppers", "Green Peppers", "Piments verts", { S: 1680, M: 2385, L: 3005, XL: 3440 }),
    pizza("pizza-onions", "Onions", "Oignons", { S: 1680, M: 2385, L: 3005, XL: 3440 }),
    pizza("pizza-pepperoni", "Pepperoni", "Pepperoni", { S: 1730, M: 2505, L: 3220, XL: 3665 }),
    pizza("pizza-capicollo", "Capicollo", "Capicollo", { S: 1730, M: 2505, L: 3220, XL: 3665 }),
    pizza("pizza-bacon", "Bacon", "Bacon", { S: 1730, M: 2505, L: 3220, XL: 3665 }),
    pizza("pizza-bacon-pepperoni", "Bacon + Pepperoni", "Bacon + Pepperoni", { S: 1855, M: 2620, L: 3430, XL: 4170 }),
    pizza("pizza-anchovies", "Anchovies", "Anchois", { S: 1730, M: 2505, L: 3220, XL: 3665 }),
    pizza("pizza-all-dressed", "All Dressed", "Toute Garnie", { S: 1855, M: 2620, L: 3430, XL: 4170 }),
    pizza("pizza-hawaiian", "Hawaiian", "Hawaïenne", { S: 1855, M: 2620, L: 3430, XL: 4170 }),
    pizza("pizza-vegetarian", "Vegetarian", "Végétarienne", { S: 1855, M: 2620, L: 3430, XL: 4170 }),
    pizza("pizza-deluxe", "Deluxe", "Deluxe", { S: 2100, M: 2870, L: 3970, XL: 4760 }),
    pizza("pizza-gigi", 'Spécial "GIGI"', "Spécial « GIGI »", { S: 2100, M: 2870, L: 3970, XL: 4760 }),
    pizza("pizza-super", "Pizza Super", "Pizza Super", { S: 2100, M: 2870, L: 3970, XL: 4760 }),

    sub("sub-steak-capicollo", "Steak and Capicollo", "Steak / Capicollo", { "7": 1165, "10": 1515, "14": 1890 }),
    sub("sub-steak-pepperoni", "Steak and Pepperoni", "Steak / Pepperoni", { "7": 1165, "10": 1515, "14": 1890 }),
    sub("sub-steak-green-peppers", "Steak and Green Peppers", "Steak / Pim. verts", { "7": 1165, "10": 1515, "14": 1890 }),
    sub("sub-steak-mushrooms", "Steak and Mushrooms", "Steak / Champignons", { "7": 1165, "10": 1515, "14": 1890 }),
    sub("sub-steak-steak-steak", "Steak, Steak and More Steak", "Steak, Steak et Steak", { "7": 1165, "10": 1515, "14": 1890 }),
    sub("sub-vegetarian", "Vegetarian", "Végétarien", { "7": 1165, "10": 1515, "14": 1890 }),
    sub("sub-gigi", 'Spécial "GIGI"', "Spécial « GIGI »", { "7": 1285, "10": 1650, "14": 2065 }),
    sub("sub-pepperoni", "Pepperoni", "Pepperoni", { "7": 1165, "10": 1515, "14": 1890 }),
    sub("sub-capicollo-cheese", "Capicollo and Cheese (cold)", "Capicollo Fromage (froid)", { "7": 1165, "10": 1515, "14": 1890 }),

    flat("pasta-spaghetti-meat", "Spaghetti with Meat Sauce", "Spaghetti, sauce à la viande", "pasta", 1560),
    flat("pasta-lasagna-meat", "Lasagna with Meat Sauce", "Lasagna, sauce à la viande", "pasta", 1560),
    flat("pasta-baked-spaghetti", "Baked Spaghetti", "Spaghetti au four", "pasta", 1795),
    flat("pasta-baked-lasagna", "Baked Lasagna", "Lasagna au four", "pasta", 1795),

    flat("extra-fries", "French Fries", "Patates frites", "extras", 450),
    flat("extra-fries-sauce", "French Fries with Sauce", "Patates frites avec sauce", "extras", 580),
    flat("extra-poutine", "Poutine", "Poutine", "extras", 890),
    flat("extra-italian-poutine", "Italian Poutine", "Poutine italienne", "extras", 1040),
    flat("extra-chef-salad", "Chef's Salad", "Salade du chef", "extras", 950),

    flat("drink-soft", "Soft Drinks", "Liqueurs douces", "drinks", 325),
    flat("drink-brio", "Brio", "Brio", "drinks", 350),
    flat("drink-tea-coffee", "Tea or Coffee", "Thé ou café", "drinks", 250),
    flat("drink-perrier", "Perrier", "Perrier", "drinks", 410),
  ],
};

export const gigiMenuConfig: MenuConfigT = Schema.decodeUnknownSync(MenuConfig)(raw);
