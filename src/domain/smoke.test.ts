import { describe, it, expect } from "vitest";
import { Schema } from "@esm.sh/effect";

describe("effect via @esm.sh alias", () => {
  it("decodes with Schema", () => {
    const S = Schema.Struct({ n: Schema.Number });
    expect(Schema.decodeUnknownSync(S)({ n: 1 })).toEqual({ n: 1 });
  });
});
