import { Schema } from "@esm.sh/effect";
import type { FulfillmentT, CustomerT } from "../domain/order";
import { ZONE_IDS, ZoneId } from "../domain/fulfillment-config";

// Field constraints are intentionally AT LEAST AS STRICT as the domain
// Customer/Fulfillment (order.ts): anything the form accepts always decodes into
// a valid Order, but the form adds UX-level tightening the domain doesn't require
// (e.g. phone must have a digit + 10 chars vs the domain's bare minLength(1)).
// `zone` is the exception — it reuses the domain's own `ZoneId`, so that field is
// truly single-source. name/email/address are hand-declared here (the domain's
// Email schema isn't exported); keep them in sync with order.ts by hand.
export const NameField = Schema.String.pipe(Schema.minLength(1));
export const PhoneField = Schema.String.pipe(Schema.pattern(/^(?=.*\d)[0-9()+\-\s]{10,}$/));
export const EmailField = Schema.String.pipe(Schema.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/));
export const AddressField = Schema.String.pipe(Schema.minLength(1));
export const ZoneField = ZoneId;

// Standard Schema wrappers TanStack Form consumes directly as field validators.
// (No zone wrapper: the zone field is constrained to valid ids by the button UI.)
export const nameSchema = Schema.standardSchemaV1(NameField);
export const phoneSchema = Schema.standardSchemaV1(PhoneField);
export const emailSchema = Schema.standardSchemaV1(EmailField);
export const addressSchema = Schema.standardSchemaV1(AddressField);

export type CheckoutValues = {
  mode: "pickup" | "delivery";
  name: string;
  phone: string;
  email: string;
  address: string;
  zone: string;
};

export const emptyCheckout: CheckoutValues = {
  mode: "pickup",
  name: "",
  phone: "",
  email: "",
  address: "",
  zone: ZONE_IDS[0],
};

export function buildFulfillment(v: CheckoutValues): FulfillmentT {
  return v.mode === "delivery"
    ? { mode: "delivery", address: v.address.trim(), zone: v.zone }
    : { mode: "pickup" };
}

export function buildCustomer(v: CheckoutValues): CustomerT {
  return { name: v.name.trim(), phone: v.phone.trim(), email: v.email.trim() };
}
