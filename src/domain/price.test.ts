import { describe, it, expect } from "vitest";
import { resolvePrice, lineTotalCents } from "./price";
import type { ItemDefinitionT } from "./config-schema";
import { gigiMenuConfig } from "./gigi-menu-config";

describe("pricing", () => {
  it("resolves flat and bySize", () => {
    expect(resolvePrice({ kind: "flat", cents: 500 }, null)).toBe(500);
    expect(resolvePrice({ kind: "bySize", table: { S: 1515, M: 2045 } }, "M")).toBe(2045);
    expect(resolvePrice({ kind: "bySize", table: { S: 1515 } }, "M")).toBe(0);
  });

  it("computes a pizza line: base(M) + one extra1(M) x2", () => {
    const def: ItemDefinitionT = {
      templateId: "sized-with-addons",
      basePrice: { kind: "bySize", table: { S: 1515, M: 2045 } },
      groups: [
        { kind: "single", id: "size", label: { en: "", fr: "" }, required: true, options: [] },
        { kind: "multi", id: "extra1", label: { en: "", fr: "" }, min: 0, max: 5,
          options: [{ id: "pepperoni", label: { en: "", fr: "" }, price: { kind: "bySize", table: { S: 520, M: 630 } } }] },
      ],
    };
    const sel = { size: "M", groups: { size: "M", extra1: ["pepperoni"] } };
    // (2045 + 630) * 2 = 5350
    expect(lineTotalCents(def, sel, 2)).toBe(5350);
  });

  const halfAndHalf = gigiMenuConfig.items.find((item) => item.id === "pizza-half-and-half")!.definition;
  const halfSelection = (
    size: string,
    left: string,
    right: string,
    extraLeft: string[] = [],
    extraRight: string[] = [],
  ) => ({ size, groups: { size, halfLeft: left, halfRight: right, extraLeft, extraRight } });

  it("charges the more expensive half base without summing both halves", () => {
    expect(lineTotalCents(
      halfAndHalf,
      halfSelection("S", "pizza-plain", "pizza-deluxe"),
      1,
    )).toBe(2100);
  });

  it("is symmetric when the left and right pizzas are swapped", () => {
    const leftDeluxe = lineTotalCents(halfAndHalf, halfSelection("S", "pizza-deluxe", "pizza-plain"), 1);
    const rightDeluxe = lineTotalCents(halfAndHalf, halfSelection("S", "pizza-plain", "pizza-deluxe"), 1);
    expect(leftDeluxe).toBe(rightDeluxe);
  });

  it("adds full-price extras selected on both halves", () => {
    expect(lineTotalCents(
      halfAndHalf,
      halfSelection("S", "pizza-plain", "pizza-deluxe", ["mushrooms"], ["pepperoni"]),
      1,
    )).toBe(3015);
  });

  it("uses the selected size table for both half bases", () => {
    expect(lineTotalCents(
      halfAndHalf,
      halfSelection("L", "pizza-plain", "pizza-deluxe"),
      1,
    )).toBe(3970);
  });

  it("keeps ordinary pizza pricing unchanged", () => {
    const plain = gigiMenuConfig.items.find((item) => item.id === "pizza-plain")!.definition;
    expect(lineTotalCents(plain, { size: "S", groups: { size: "S" } }, 1)).toBe(1515);
  });
});
