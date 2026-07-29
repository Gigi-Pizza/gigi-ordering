import { Schema } from "@esm.sh/effect";
import type { FulfillmentT, CustomerT } from "../domain/order";
import { ZONE_IDS } from "../domain/fulfillment-config";

// Field constraints mirror the domain Customer/Fulfillment so the form and the
// Order agree by construction (one source of truth for "valid").
export const NameField = Schema.String.pipe(Schema.minLength(1));
export const PhoneField = Schema.String.pipe(Schema.pattern(/^[0-9()+\-\s]{10,}$/));
export const EmailField = Schema.String.pipe(Schema.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/));
export const AddressField = Schema.String.pipe(Schema.minLength(1));
export const ZoneField = Schema.Literal(...(ZONE_IDS as [string, ...string[]]));

// Standard Schema wrappers TanStack Form consumes directly as field validators.
export const nameSchema = Schema.standardSchemaV1(NameField);
export const phoneSchema = Schema.standardSchemaV1(PhoneField);
export const emailSchema = Schema.standardSchemaV1(EmailField);
export const addressSchema = Schema.standardSchemaV1(AddressField);
export const zoneSchema = Schema.standardSchemaV1(ZoneField);

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
