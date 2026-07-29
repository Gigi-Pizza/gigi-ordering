import { Match } from "@esm.sh/effect";
import type { OptionGroupT } from "./config-schema";

export type GroupSelection = string | null | readonly string[] | Record<string, number> | string;

export type ValidationError = {
  _tag: "RequiredMissing" | "TooFew" | "TooMany" | "TextTooLong";
  groupId: string;
  limit?: number;
};

export function validateGroup(group: OptionGroupT, selection: GroupSelection): ValidationError[] {
  return Match.value(group).pipe(
    Match.when({ kind: "single" }, (g): ValidationError[] =>
      g.required && (selection === null || selection === undefined)
        ? [{ _tag: "RequiredMissing", groupId: g.id }]
        : [],
    ),
    Match.when({ kind: "multi" }, (g): ValidationError[] => {
      const arr = Array.isArray(selection) ? selection : [];
      if (arr.length < g.min) return [{ _tag: "TooFew", groupId: g.id, limit: g.min }];
      if (arr.length > g.max) return [{ _tag: "TooMany", groupId: g.id, limit: g.max }];
      return [];
    }),
    Match.when({ kind: "quantity" }, (g): ValidationError[] => {
      const total = Object.values((selection as Record<string, number>) ?? {}).reduce((a, b) => a + b, 0);
      if (total < g.min) return [{ _tag: "TooFew", groupId: g.id, limit: g.min }];
      if (total > g.max) return [{ _tag: "TooMany", groupId: g.id, limit: g.max }];
      return [];
    }),
    Match.when({ kind: "text" }, (g): ValidationError[] => {
      const s = typeof selection === "string" ? selection : "";
      if (g.required && s.trim() === "") return [{ _tag: "RequiredMissing", groupId: g.id }];
      if (s.length > g.maxLength) return [{ _tag: "TextTooLong", groupId: g.id, limit: g.maxLength }];
      return [];
    }),
    Match.exhaustive,
  );
}
