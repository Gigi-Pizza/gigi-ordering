import type { Selection } from "./price";

export type ConfiguredItem = {
  lineId: string;
  itemId: string;
  selection: Selection;
  quantity: number;
  unitCents: number;
  totalCents: number;
};

export type Cart = { lines: ConfiguredItem[]; subtotalCents: number };

const subtotal = (lines: ConfiguredItem[]) => lines.reduce((sum, l) => sum + l.totalCents, 0);

export function emptyCart(): Cart {
  return { lines: [], subtotalCents: 0 };
}

export function addLine(cart: Cart, line: ConfiguredItem): Cart {
  const lines = [...cart.lines, { ...line, totalCents: line.unitCents * line.quantity }];
  return { lines, subtotalCents: subtotal(lines) };
}

export function removeLine(cart: Cart, lineId: string): Cart {
  const lines = cart.lines.filter((l) => l.lineId !== lineId);
  return { lines, subtotalCents: subtotal(lines) };
}

export function updateQuantity(cart: Cart, lineId: string, quantity: number, unitCents: number): Cart {
  const lines = cart.lines.map((l) =>
    l.lineId === lineId ? { ...l, quantity, unitCents, totalCents: unitCents * quantity } : l,
  );
  return { lines, subtotalCents: subtotal(lines) };
}
