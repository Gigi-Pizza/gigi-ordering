import { describe, it, expect } from "vitest";
import { validateGroup } from "./validate";
import type { OptionGroupT } from "./config-schema";

const single: OptionGroupT = { kind: "single", id: "size", label: { en: "", fr: "" }, required: true, options: [] };
const multi: OptionGroupT = { kind: "multi", id: "x", label: { en: "", fr: "" }, min: 1, max: 2, options: [] };
const text: OptionGroupT = { kind: "text", id: "n", label: { en: "", fr: "" }, required: false, maxLength: 5 };

describe("validateGroup", () => {
  it("flags a required single with no choice", () => {
    expect(validateGroup(single, null)).toEqual([{ _tag: "RequiredMissing", groupId: "size" }]);
  });
  it("accepts a required single with a choice", () => {
    expect(validateGroup(single, "S")).toEqual([]);
  });
  it("flags too few and too many for multi", () => {
    expect(validateGroup(multi, [])).toEqual([{ _tag: "TooFew", groupId: "x", limit: 1 }]);
    expect(validateGroup(multi, ["a", "b", "c"])).toEqual([{ _tag: "TooMany", groupId: "x", limit: 2 }]);
  });
  it("flags overlong text", () => {
    expect(validateGroup(text, "toolong!")).toEqual([{ _tag: "TextTooLong", groupId: "n", limit: 5 }]);
  });
});
