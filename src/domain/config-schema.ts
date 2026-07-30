import { Schema } from "@esm.sh/effect";

export const Bilingual = Schema.Struct({ en: Schema.String, fr: Schema.String });
export type BilingualT = Schema.Schema.Type<typeof Bilingual>;

/** Non-negative integer cents. */
export const Cents = Schema.Int.pipe(Schema.greaterThanOrEqualTo(0));

export const Price = Schema.Union(
  Schema.Struct({ kind: Schema.Literal("flat"), cents: Cents }),
  Schema.Struct({ kind: Schema.Literal("bySize"), table: Schema.Record({ key: Schema.String, value: Cents }) }),
);
export type PriceT = Schema.Schema.Type<typeof Price>;

export const Option = Schema.Struct({
  id: Schema.String,
  label: Bilingual,
  price: Price,
  availableForSizes: Schema.optional(Schema.Array(Schema.String)),
});
export type OptionT = Schema.Schema.Type<typeof Option>;

export const OptionGroup = Schema.Union(
  Schema.Struct({ kind: Schema.Literal("single"), id: Schema.String, label: Bilingual, required: Schema.Boolean, options: Schema.Array(Option) }),
  Schema.Struct({ kind: Schema.Literal("multi"), id: Schema.String, label: Bilingual, min: Schema.Int, max: Schema.Int, options: Schema.Array(Option) }),
  Schema.Struct({ kind: Schema.Literal("quantity"), id: Schema.String, label: Bilingual, min: Schema.Int, max: Schema.Int, options: Schema.Array(Option) }),
  Schema.Struct({ kind: Schema.Literal("text"), id: Schema.String, label: Bilingual, required: Schema.Boolean, maxLength: Schema.Int }),
);
export type OptionGroupT = Schema.Schema.Type<typeof OptionGroup>;

export const BasePricePolicy = Schema.Struct({
  kind: Schema.Literal("maxOfSingleGroups"),
  groupIds: Schema.Array(Schema.String),
});
export type BasePricePolicyT = Schema.Schema.Type<typeof BasePricePolicy>;

export const ItemDefinition = Schema.Struct({
  templateId: Schema.optional(Schema.String),
  basePrice: Price,
  basePricePolicy: Schema.optional(BasePricePolicy),
  groups: Schema.Array(OptionGroup),
});
export type ItemDefinitionT = Schema.Schema.Type<typeof ItemDefinition>;

export const MenuItem = Schema.Struct({
  id: Schema.String,
  // Stable cross-system menu code (e.g. "PLA001") from the canonical menu seed;
  // optional (app-only items like drink flavours / half-and-half have none).
  itemId: Schema.optional(Schema.String),
  name: Bilingual,
  category: Schema.String,
  // Ingredient / composition line shown on the selection page (optional — flat
  // items like drinks don't need one).
  description: Schema.optional(Bilingual),
  // Path to the item's image (optional; site-relative, e.g. "/images/menu/pizza-plain.webp").
  image: Schema.optional(Schema.String),
  definition: ItemDefinition,
});
export type MenuItemT = Schema.Schema.Type<typeof MenuItem>;

export const Template = Schema.Struct({ id: Schema.String, groups: Schema.Array(OptionGroup) });
export type TemplateT = Schema.Schema.Type<typeof Template>;

export const MenuConfig = Schema.Struct({ templates: Schema.Array(Template), items: Schema.Array(MenuItem) });
export type MenuConfigT = Schema.Schema.Type<typeof MenuConfig>;
