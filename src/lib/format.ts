import type { BilingualT } from "../domain/config-schema";

export const money = (cents: number, lang: "en" | "fr") =>
  new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export const pick = (b: BilingualT, lang: "en" | "fr") => b[lang];

let counter = 0;
export const lineId = () => `line-${(counter += 1)}`;
