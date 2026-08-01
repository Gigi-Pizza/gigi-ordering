import { describe, it, expect } from "vitest";
import { createActor } from "@esm.sh/xstate";
import { flowMachine } from "./flow.machine";
import { gigiMenuConfig } from "../domain/gigi-menu-config";
import { emptyCart, addLine } from "../domain/cart";

const item = gigiMenuConfig.items.find((i) => i.id === "pizza-plain")!;
const line = { lineId: "l1", itemId: item.id, selection: { size: "M", groups: {} }, quantity: 1, unitCents: 2045, totalCents: 2045 };

describe("flowMachine", () => {
  it("runs browse → configure → cart → checkout → confirmed", () => {
    const a = createActor(flowMachine, { input: { menu: gigiMenuConfig } }).start();
    expect(a.getSnapshot().value).toBe("browsing");
    a.send({ type: "SELECT_ITEM", item });
    expect(a.getSnapshot().value).toBe("configuringItem");
    a.send({ type: "ADD_TO_CART", line });
    expect(a.getSnapshot().value).toBe("browsing");
    expect(a.getSnapshot().context.cart.lines).toHaveLength(1);
    a.send({ type: "VIEW_CART" });
    expect(a.getSnapshot().value).toBe("reviewingCart");
    a.send({ type: "SET_FULFILLMENT", fulfillment: { mode: "pickup" } });
    a.send({ type: "GO_CHECKOUT" });
    expect(a.getSnapshot().value).toBe("checkout");
    a.send({ type: "PLACE", customer: { name: "Sam", phone: "5146974587", email: "s@e.com" }, createdAt: "2026-07-28T00:00:00.000Z" });
    expect(a.getSnapshot().status).toBe("done");
    expect(a.getSnapshot().context.order?.subtotalCents).toBe(2045);
  });

  it("blocks VIEW_CART when the cart is empty", () => {
    const a = createActor(flowMachine, { input: { menu: gigiMenuConfig } }).start();
    a.send({ type: "VIEW_CART" });
    expect(a.getSnapshot().value).toBe("browsing");
  });

  it("seeds the cart from input when provided", () => {
    const seeded = addLine(emptyCart(), {
      lineId: "line-seed", itemId: "pizza-plain",
      selection: { size: null, groups: {} }, quantity: 1, unitCents: 1000, totalCents: 1000,
    });
    const actor = createActor(flowMachine, { input: { menu: gigiMenuConfig, cart: seeded } }).start();
    expect(actor.getSnapshot().context.cart.lines).toHaveLength(1);
    actor.stop();
  });

  it("defaults to an empty cart when no cart input is given", () => {
    const actor = createActor(flowMachine, { input: { menu: gigiMenuConfig } }).start();
    expect(actor.getSnapshot().context.cart.lines).toHaveLength(0);
    actor.stop();
  });
});
