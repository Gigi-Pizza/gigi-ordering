import { describe, it, expect } from "vitest";
import { Schema } from "@esm.sh/effect";
import { MenuConfig } from "./config-schema";
import { gigiMenuConfig } from "./gigi-menu-config";

describe("gigiMenuConfig", () => {
  it("is a valid MenuConfig", () => {
    expect(() => Schema.decodeUnknownSync(MenuConfig)(gigiMenuConfig)).not.toThrow();
  });

  it("has pizzas mapped to sized-with-addons with a Size group", () => {
    const pizza = gigiMenuConfig.items.find((i) => i.category === "pizza");
    expect(pizza).toBeDefined();
    expect(pizza!.definition.templateId).toBe("sized-with-addons");
    expect(pizza!.definition.groups.some((g) => g.id === "size" && g.kind === "single")).toBe(true);
  });

  it("covers all 49 items across the five categories", () => {
    const byCat = (c: string) => gigiMenuConfig.items.filter((i) => i.category === c).length;
    expect({ pizza: byCat("pizza"), subs: byCat("subs"), pasta: byCat("pasta"), extras: byCat("extras"), drinks: byCat("drinks") })
      .toEqual({ pizza: 16, subs: 9, pasta: 4, extras: 5, drinks: 15 });
  });

  it("gives drinks NO special-instructions (notes) group, but keeps it on pasta", () => {
    const hasNotes = (id: string) =>
      gigiMenuConfig.items.find((i) => i.id === id)!.definition.groups.some((g) => g.id === "notes");
    expect(hasNotes("drink-coke")).toBe(false);
    expect(hasNotes("drink-perrier")).toBe(false);
    expect(hasNotes("pasta-spaghetti-meat")).toBe(true);
  });

  it("defines half-and-half with two required halves and the max-base policy", () => {
    const item = gigiMenuConfig.items.find((candidate) => candidate.id === "pizza-half-and-half");
    expect(item?.definition.basePricePolicy).toEqual({
      kind: "maxOfSingleGroups",
      groupIds: ["halfLeft", "halfRight"],
    });
    expect(item?.definition.groups.filter((group) =>
      (group.id === "halfLeft" || group.id === "halfRight") && group.kind === "single" && group.required,
    )).toHaveLength(2);
  });
});
