import { setup, assign } from "@esm.sh/xstate";
import type { MenuItemT, MenuConfigT } from "../domain/config-schema";
import { emptyCart, addLine, removeLine, type Cart, type ConfiguredItem } from "../domain/cart";
import { buildOrder, type FulfillmentT, type CustomerT, type OrderT } from "../domain/order";

type Ctx = { menu: MenuConfigT; cart: Cart; selectedItem: MenuItemT | null; fulfillment: FulfillmentT | null; order: OrderT | null };
type Ev =
  | { type: "SELECT_ITEM"; item: MenuItemT }
  | { type: "ADD_TO_CART"; line: ConfiguredItem }
  | { type: "CANCEL_CONFIG" }
  | { type: "VIEW_CART" }
  | { type: "REMOVE_LINE"; lineId: string }
  | { type: "SET_FULFILLMENT"; fulfillment: FulfillmentT }
  | { type: "GO_CHECKOUT" }
  | { type: "BACK_TO_CART" }
  | { type: "BACK_TO_BROWSE" }
  | { type: "PLACE"; customer: CustomerT; createdAt: string };

export const flowMachine = setup({
  types: { context: {} as Ctx, events: {} as Ev, input: {} as { menu: MenuConfigT } },
  guards: {
    cartNonEmpty: ({ context }) => context.cart.lines.length > 0,
    canPlace: ({ context }) => context.cart.lines.length > 0 && context.fulfillment !== null,
  },
  actions: {
    selectItem: assign(({ event }) => (event.type === "SELECT_ITEM" ? { selectedItem: event.item } : {})),
    addToCart: assign(({ context, event }) => (event.type === "ADD_TO_CART" ? { cart: addLine(context.cart, event.line), selectedItem: null } : {})),
    clearSelected: assign({ selectedItem: () => null }),
    removeLine: assign(({ context, event }) => (event.type === "REMOVE_LINE" ? { cart: removeLine(context.cart, event.lineId) } : {})),
    setFulfillment: assign(({ event }) => (event.type === "SET_FULFILLMENT" ? { fulfillment: event.fulfillment } : {})),
    place: assign(({ context, event }) =>
      event.type === "PLACE" && context.fulfillment
        ? { order: buildOrder({ cart: context.cart, fulfillment: context.fulfillment, customer: event.customer, createdAt: event.createdAt }) }
        : {}),
  },
}).createMachine({
  id: "flow",
  context: ({ input }) => ({ menu: input.menu, cart: emptyCart(), selectedItem: null, fulfillment: null, order: null }),
  initial: "browsing",
  states: {
    browsing: {
      on: {
        SELECT_ITEM: { target: "configuringItem", actions: "selectItem" },
        VIEW_CART: { target: "reviewingCart", guard: "cartNonEmpty" },
      },
    },
    configuringItem: {
      on: {
        ADD_TO_CART: { target: "browsing", actions: "addToCart" },
        CANCEL_CONFIG: { target: "browsing", actions: "clearSelected" },
      },
    },
    reviewingCart: {
      on: {
        REMOVE_LINE: { actions: "removeLine" },
        SET_FULFILLMENT: { actions: "setFulfillment" },
        GO_CHECKOUT: { target: "checkout", guard: "cartNonEmpty" },
        BACK_TO_BROWSE: "browsing",
      },
    },
    checkout: {
      on: {
        SET_FULFILLMENT: { actions: "setFulfillment" },
        PLACE: { target: "confirmed", guard: "canPlace", actions: "place" },
        BACK_TO_CART: "reviewingCart",
      },
    },
    confirmed: { type: "final" },
  },
});
