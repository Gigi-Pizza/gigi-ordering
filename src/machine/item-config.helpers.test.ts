import { describe, it, expect } from "vitest";
import { defaultSize, isConfigValid, resetInvalidForSize, liveTotalCents, toConfiguredItem, type ItemConfigState } from "./item-config.helpers";
import type { MenuItemT } from "../domain/config-schema";

const item: MenuItemT = {
  id: "pizza-x", name: { en: "X", fr: "X" }, category: "pizza",
  definition: {
    templateId: "sized-with-addons",
    basePrice: { kind: "bySize", table: { S: 1515, M: 2045 } },
    groups: [
      { kind: "single", id: "size", label: { en: "", fr: "" }, required: true, options: [
        { id: "S", label: { en: "", fr: "" }, price: { kind: "flat", cents: 0 } },
        { id: "M", label: { en: "", fr: "" }, price: { kind: "flat", cents: 0 } },
      ] },
      { kind: "multi", id: "extra1", label: { en: "", fr: "" }, min: 0, max: 5, options: [
        { id: "sOnly", label: { en: "", fr: "" }, price: { kind: "bySize", table: { S: 500, M: 600 } }, availableForSizes: ["S"] },
      ] },
    ],
  },
};
const base: ItemConfigState = { item, size: "S", groups: { size: "S", extra1: ["sOnly"] }, quantity: 1 };

describe("item-config helpers", () => {
  it("defaults to the first size", () => expect(defaultSize(item)).toBe("S"));
  it("is valid with a size chosen", () => expect(isConfigValid(base)).toBe(true));
  it("resetInvalidForSize drops picks not available for the new size", () => {
    const next = resetInvalidForSize(base, "M");
    expect(next.size).toBe("M");
    expect(next.groups.extra1).toEqual([]);
  });
  it("prices base(S) + sOnly(S) x2 = (1515+500)*2", () => {
    expect(liveTotalCents({ ...base, quantity: 2 })).toBe(4030);
  });
  it("toConfiguredItem carries unit + total", () => {
    const line = toConfiguredItem({ ...base, quantity: 2 }, "l1");
    expect(line).toMatchObject({ lineId: "l1", itemId: "pizza-x", quantity: 2, unitCents: 2015, totalCents: 4030 });
  });
});
