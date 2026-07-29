import { describe, it, expect } from "vitest";
import { emptyCart, addLine, quantitiesByItem, removeLine, updateQuantity, type ConfiguredItem } from "./cart";

const line = (lineId: string, unit: number, qty: number): ConfiguredItem => ({
  lineId, itemId: "pizza-plain", selection: { size: "M", groups: {} },
  quantity: qty, unitCents: unit, totalCents: unit * qty,
});

describe("cart", () => {
  it("adds lines and sums subtotal", () => {
    const c = addLine(addLine(emptyCart(), line("a", 2045, 1)), line("b", 1000, 2));
    expect(c.lines).toHaveLength(2);
    expect(c.subtotalCents).toBe(2045 + 2000);
  });
  it("updates quantity and recomputes", () => {
    const c = updateQuantity(addLine(emptyCart(), line("a", 2045, 1)), "a", 3, 2045);
    expect(c.lines[0].totalCents).toBe(6135);
    expect(c.subtotalCents).toBe(6135);
  });
  it("removes a line", () => {
    const c = removeLine(addLine(emptyCart(), line("a", 2045, 1)), "a");
    expect(c.lines).toHaveLength(0);
    expect(c.subtotalCents).toBe(0);
  });
  it("sums quantities by menu item across separately configured lines", () => {
    const other = { ...line("c", 1500, 2), itemId: "sub-steak" };
    const cart = addLine(addLine(addLine(emptyCart(), line("a", 2045, 1)), line("b", 2045, 2)), other);
    expect(quantitiesByItem(cart)).toEqual({ "pizza-plain": 3, "sub-steak": 2 });
  });
});
