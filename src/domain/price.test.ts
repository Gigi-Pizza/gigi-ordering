import { describe, it, expect } from "vitest";
import { resolvePrice, lineTotalCents } from "./price";
import type { ItemDefinitionT } from "./config-schema";

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
});
