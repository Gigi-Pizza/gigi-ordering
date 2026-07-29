import { describe, it, expect } from "vitest";
import { buildOrder } from "./order";

describe("buildOrder", () => {
  it("builds a valid pickup order from a cart + customer", () => {
    const order = buildOrder({
      cart: { lines: [{ lineId: "a", itemId: "pizza-plain", selection: { size: "M", groups: {} }, quantity: 1, unitCents: 2045, totalCents: 2045 }], subtotalCents: 2045 },
      fulfillment: { mode: "pickup" },
      customer: { name: "Sam", phone: "5146974587", email: "s@example.com" },
      createdAt: "2026-07-28T00:00:00.000Z",
    });
    expect(order.subtotalCents).toBe(2045);
    expect(order.fulfillment.mode).toBe("pickup");
    expect(order.items).toHaveLength(1);
  });

  it("throws on an invalid email", () => {
    expect(() => buildOrder({
      cart: { lines: [], subtotalCents: 0 },
      fulfillment: { mode: "pickup" },
      customer: { name: "Sam", phone: "x", email: "not-an-email" },
      createdAt: "2026-07-28T00:00:00.000Z",
    })).toThrow();
  });
});
