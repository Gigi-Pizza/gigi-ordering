import { Schema } from "@esm.sh/effect";
import type { Cart } from "./cart";

const Email = Schema.String.pipe(Schema.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/));

export const Fulfillment = Schema.Union(
  Schema.Struct({ mode: Schema.Literal("pickup") }),
  Schema.Struct({ mode: Schema.Literal("delivery"), address: Schema.String, zone: Schema.String }),
);
export type FulfillmentT = Schema.Schema.Type<typeof Fulfillment>;

export const Customer = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  phone: Schema.String.pipe(Schema.minLength(1)),
  email: Email,
});
export type CustomerT = Schema.Schema.Type<typeof Customer>;

const OrderLine = Schema.Struct({
  lineId: Schema.String,
  itemId: Schema.String,
  selection: Schema.Struct({ size: Schema.NullOr(Schema.String), groups: Schema.Record({ key: Schema.String, value: Schema.Unknown }) }),
  quantity: Schema.Int,
  unitCents: Schema.Int,
  totalCents: Schema.Int,
});

export const Order = Schema.Struct({
  items: Schema.Array(OrderLine),
  fulfillment: Fulfillment,
  customer: Customer,
  subtotalCents: Schema.Int,
  createdAt: Schema.String,
});
export type OrderT = Schema.Schema.Type<typeof Order>;

export function buildOrder(input: {
  cart: Cart;
  fulfillment: FulfillmentT;
  customer: CustomerT;
  createdAt: string;
}): OrderT {
  return Schema.decodeUnknownSync(Order)({
    items: input.cart.lines,
    fulfillment: input.fulfillment,
    customer: input.customer,
    subtotalCents: input.cart.subtotalCents,
    createdAt: input.createdAt,
  });
}
