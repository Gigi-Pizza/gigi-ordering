import { describe, it, expect } from "vitest";
import { Schema } from "@esm.sh/effect";
import { MenuConfig, OptionGroup } from "./config-schema";

describe("config-schema", () => {
  it("decodes a valid single-select group", () => {
    const g = { kind: "single", id: "size", label: { en: "Size", fr: "Format" }, required: true,
      options: [{ id: "S", label: { en: "Small", fr: "Petite" }, price: { kind: "flat", cents: 1515 } }] };
    expect(Schema.decodeUnknownSync(OptionGroup)(g)).toMatchObject({ kind: "single", id: "size" });
  });

  it("rejects a bySize price with a non-integer", () => {
    const g = { kind: "multi", id: "x", label: { en: "X", fr: "X" }, min: 0, max: 2,
      options: [{ id: "a", label: { en: "A", fr: "A" }, price: { kind: "bySize", table: { S: 5.5 } } }] };
    expect(() => Schema.decodeUnknownSync(OptionGroup)(g)).toThrow();
  });

  it("decodes a whole MenuConfig", () => {
    const cfg = { templates: [], items: [] };
    expect(Schema.decodeUnknownSync(MenuConfig)(cfg)).toEqual({ templates: [], items: [] });
  });
});
