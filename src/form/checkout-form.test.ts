import { describe, it, expect } from "vitest";
import { Schema, Either } from "@esm.sh/effect";
import {
  NameField, PhoneField, EmailField, ZoneField,
  buildFulfillment, buildCustomer, emptyCheckout,
} from "./checkout-form";

const ok = (s: Schema.Schema<string, string>, v: unknown) =>
  Either.isRight(Schema.decodeUnknownEither(s)(v));

describe("checkout field validation", () => {
  it("rejects empty name, accepts non-empty", () => {
    expect(ok(NameField, "")).toBe(false);
    expect(ok(NameField, "George")).toBe(true);
  });
  it("validates phone (>=10 dialing chars)", () => {
    expect(ok(PhoneField, "123")).toBe(false);
    expect(ok(PhoneField, "514-697-4587")).toBe(true);
  });
  it("rejects whitespace-only phone (would trim to empty and break domain decode)", () => {
    expect(ok(PhoneField, "          ")).toBe(false);
  });
  it("validates email", () => {
    expect(ok(EmailField, "nope")).toBe(false);
    expect(ok(EmailField, "a@b.co")).toBe(true);
  });
  it("zone must be a known zone id", () => {
    expect(ok(ZoneField, "montreal")).toBe(false);
    expect(ok(ZoneField, "kirkland")).toBe(true);
  });
});

describe("checkout builders", () => {
  it("pickup omits address/zone", () => {
    expect(buildFulfillment({ ...emptyCheckout, mode: "pickup" })).toEqual({ mode: "pickup" });
  });
  it("delivery includes trimmed address + zone", () => {
    expect(
      buildFulfillment({ ...emptyCheckout, mode: "delivery", address: " 12 Main ", zone: "dorval" }),
    ).toEqual({ mode: "delivery", address: "12 Main", zone: "dorval" });
  });
  it("customer fields are trimmed", () => {
    expect(
      buildCustomer({ ...emptyCheckout, name: " Al ", phone: " 5146974587 ", email: " a@b.co " }),
    ).toEqual({ name: "Al", phone: "5146974587", email: "a@b.co" });
  });
});
