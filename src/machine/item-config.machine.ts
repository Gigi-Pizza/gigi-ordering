import { setup, assign } from "@esm.sh/xstate";
import type { MenuItemT } from "../domain/config-schema";
import { defaultSize, isConfigValid, resetInvalidForSize, type ItemConfigState } from "./item-config.helpers";

type Ev =
  | { type: "SET_SIZE"; sizeId: string }
  | { type: "SET_SINGLE"; groupId: string; optionId: string | null }
  | { type: "TOGGLE_MULTI"; groupId: string; optionId: string }
  | { type: "SET_TEXT"; groupId: string; value: string }
  | { type: "SET_QUANTITY"; quantity: number }
  | { type: "CONFIRM" };

export const itemConfigMachine = setup({
  types: { context: {} as ItemConfigState, events: {} as Ev, input: {} as { item: MenuItemT } },
  guards: { canConfirm: ({ context }) => isConfigValid(context) },
  actions: {
    setSize: assign(({ context, event }) => (event.type === "SET_SIZE" ? resetInvalidForSize(context, event.sizeId) : {})),
    setSingle: assign(({ context, event }) =>
      event.type === "SET_SINGLE"
        ? { groups: { ...context.groups, [event.groupId]: event.optionId } }
        : {}),
    toggleMulti: assign(({ context, event }) => {
      if (event.type !== "TOGGLE_MULTI") return {};
      const cur = Array.isArray(context.groups[event.groupId]) ? (context.groups[event.groupId] as string[]) : [];
      const next = cur.includes(event.optionId) ? cur.filter((id) => id !== event.optionId) : [...cur, event.optionId];
      return { groups: { ...context.groups, [event.groupId]: next } };
    }),
    setText: assign(({ context, event }) => (event.type === "SET_TEXT" ? { groups: { ...context.groups, [event.groupId]: event.value } } : {})),
    setQuantity: assign(({ event }) => (event.type === "SET_QUANTITY" ? { quantity: Math.max(1, event.quantity) } : {})),
  },
}).createMachine({
  id: "itemConfig",
  context: ({ input }) => ({ item: input.item, size: defaultSize(input.item), groups: {}, quantity: 1 }),
  initial: "configuring",
  states: {
    configuring: {
      on: {
        SET_SIZE: { actions: "setSize" },
        SET_SINGLE: { actions: "setSingle" },
        TOGGLE_MULTI: { actions: "toggleMulti" },
        SET_TEXT: { actions: "setText" },
        SET_QUANTITY: { actions: "setQuantity" },
        CONFIRM: { guard: "canConfirm", target: "confirmed" },
      },
    },
    confirmed: { type: "final" },
  },
});
