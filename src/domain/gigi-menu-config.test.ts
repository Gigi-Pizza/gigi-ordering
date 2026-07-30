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

  it("covers all 50 items across the five categories", () => {
    const byCat = (c: string) => gigiMenuConfig.items.filter((i) => i.category === c).length;
    expect({ pizza: byCat("pizza"), subs: byCat("subs"), pasta: byCat("pasta"), extras: byCat("extras"), drinks: byCat("drinks") })
      .toEqual({ pizza: 16, subs: 9, pasta: 4, extras: 5, drinks: 16 });
  });

  it("carries the menu code + real image on catalogued items; app-only items have neither", () => {
    const byId = (id: string) => gigiMenuConfig.items.find((i) => i.id === id)!;
    // catalogued items (from the canonical menu seed) get their code + real image
    expect(byId("pizza-plain").itemId).toBe("PLA001");
    expect(byId("pizza-plain").image).toBe("/images/menu-icons/photo/PLA001.png");
    expect(byId("pasta-spaghetti-meat").image).toBe("/images/menu-icons/SPA025.svg");
    expect(byId("drink-brio").itemId).toBe("BRI035");
    // app-only additions have no gigipizza code/image → text-only card
    expect(byId("drink-coke").itemId).toBeUndefined();
    expect(byId("drink-coke").image).toBeUndefined();
    expect(byId("pizza-half-and-half").image).toBeUndefined();
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

  it("offers every pizza the no-charge doneness, cheese, sauce, and crust choices", () => {
    const pizzas = gigiMenuConfig.items.filter((item) => item.category === "pizza");
    const expected = {
      doneness: ["well-done", "beyond-well-done"],
      cheeseAmount: ["easy-cheese", "extra-cheese"],
      sauceAmount: ["easy-sauce", "extra-sauce"],
      crust: ["thin-crust", "thick-crust"],
    };

    for (const pizza of pizzas) {
      for (const [groupId, optionIds] of Object.entries(expected)) {
        const group = pizza.definition.groups.find((candidate) => candidate.id === groupId);
        expect(group, `${pizza.id} is missing ${groupId}`).toMatchObject({ kind: "single", required: false });
        if (group?.kind !== "single") continue;
        expect(group.options.map((option) => option.id)).toEqual(optionIds);
        expect(group.options.every((option) => option.price.kind === "flat" && option.price.cents === 0)).toBe(true);
      }
    }
  });
});
