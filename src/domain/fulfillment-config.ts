import { Schema } from "@esm.sh/effect";
import type { BilingualT } from "./config-schema";

// The West-Island zones George serves today (mirror gigi-ux copy.json `zones`).
// `id` is the canonical value persisted on the Order; labels are display-only.
export const DELIVERY_ZONES: { id: string; label: BilingualT }[] = [
  { id: "pointe-claire", label: { en: "Pointe-Claire", fr: "Pointe-Claire" } },
  { id: "beaconsfield", label: { en: "Beaconsfield", fr: "Beaconsfield" } },
  { id: "baie-durfe", label: { en: "Baie-D'Urfé", fr: "Baie-D'Urfé" } },
  { id: "kirkland", label: { en: "Kirkland", fr: "Kirkland" } },
  { id: "dorval", label: { en: "Dorval", fr: "Dorval" } },
];

export const ZONE_IDS: string[] = DELIVERY_ZONES.map((z) => z.id);

// STUBS — George to confirm. NOT yet enforced nor added to Order totals.
export const DELIVERY_FEE_CENTS = 0;
export const DELIVERY_MINIMUM_CENTS = 0;

export const ZoneId = Schema.Literal(...(ZONE_IDS as [string, ...string[]]));
