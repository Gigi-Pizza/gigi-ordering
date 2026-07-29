# Half & Half Pizza — Production Implementation Handoff

**Audience:** Engineer or implementation agent integrating the approved Half & Half ordering flow.

**Last updated:** 2026-07-29

**Feature status:** The UX, Figma components, React reference implementation, pricing policy, and automated domain tests exist. This document defines the intended production behavior and identifies the remaining business decisions and integration gap that must be resolved before release.

> **Update 2026-07-29 — the menu is now SEED-DRIVEN.** The whole menu (items,
> prices, descriptions, sizes, templates, topping catalogs, and the Half & Half
> definition) lives in **`src/domain/menu.seed.json`**; `gigi-menu-config.ts` is
> now a thin decoder that reads the seed and builds the runtime `MenuConfig`.
> To change menu data or the half-topping divisor, edit the JSON — not the TS.
> The Half & Half config output is unchanged (all domain tests still pass); only
> the *location* of these knobs moved. Stale references below have been updated.

---

## 1. Outcome

Customers can configure one pizza with:

- one shared size;
- a required pizza type for the left half;
- a required pizza type for the right half;
- optional extras selected independently for each half;
- special instructions for each physical pizza;
- a calculated price based on the more expensive half plus extras;
- standard quantity, cart, continue-ordering, and review-cart behavior.

The flow must preserve Gigi's existing visual language and must never use native radio buttons. Choices are large, high-contrast, touch-friendly buttons.

---

## 2. Source of truth

### Figma

- Ordering flow: https://www.figma.com/design/aHCq8QVXK0yNhURnfzBWNA/Gigi-Pizza-%E2%80%94-Ordering-Flow?node-id=2-808
- Component library page: https://www.figma.com/design/aHCq8QVXK0yNhURnfzBWNA/Gigi-Pizza-%E2%80%94-Ordering-Flow?node-id=50-371
- Menu transition: node `52:624`
- Required-selection state: node `53:407`
- Completed extras/pricing state: node `54:436`
- Choice Button component set: node `50:384`
- ChoiceButtonGroup component set: node `51:408`
- StickyAction component set: node `51:426`
- Figma engineering notes: node `55:516`

### Code

- Menu definition (data — single source of truth): `src/domain/menu.seed.json`
- Menu decoder (builds the runtime config from the seed): `src/domain/gigi-menu-config.ts`
- Config schema: `src/domain/config-schema.ts`
- Pricing: `src/domain/price.ts`
- Configuration state machine: `src/machine/item-config.machine.ts`
- Configuration helpers: `src/machine/item-config.helpers.ts`
- Screen: `src/screens/Configure.tsx`
- Bilingual UI copy: `src/copy.ts`
- Pricing tests: `src/domain/price.test.ts`
- Machine tests: `src/machine/item-config.machine.test.ts`
- Reusable component handoff: `../gigi-ux/docs/half-and-half-components-handoff.md`
- ChoiceButtonGroup: `../gigi-ux/src/components/ChoiceButtonGroup.tsx`
- StickyAction: `../gigi-ux/src/components/StickyAction.tsx`
- Styling: `../gigi-static/src/css/ux.css`

The Figma file defines presentation and interaction intent. The declarative menu config and integer-cent pricing tests define money behavior.

---

## 3. User journey

### 3.1 Entering the flow

1. The customer opens the Pizza category.
2. Half & Half appears as a normal menu item:
   - EN: **Half & Half**
   - FR: **Moitié-moitié**
3. Supporting copy explains that the customer chooses a pizza for each half.
4. Selecting the item opens its configurator.

Do not force the customer directly to cart or order review. After adding the pizza, use the existing item-added transition with:

- **Continue ordering**, returning to menu browsing;
- **Review cart**, opening cart review.

### 3.2 Configuration order

The configurator presents:

1. Back navigation and the Half & Half title.
2. Pricing guidance.
3. Shared pizza size.
4. Left-half pizza type.
5. Right-half pizza type.
6. Left-half extras.
7. Right-half extras.
8. Per-pizza special instructions.
9. Quantity.
10. Sticky Add to cart action.

The main content scrolls. The top bar and bottom action remain visually stable.

### 3.3 Required state

Size has an initial/default value. Both half selections are required.

The primary action remains disabled until:

- a valid size exists;
- `halfLeft` has a valid option;
- `halfRight` has a valid option;
- every other required config rule passes.

Selecting only one half must not enable Add to cart.

### 3.4 Back behavior

Every configuration screen retains the Back action in the top bar.

Back returns to the previous menu state and discards the uncommitted configuration. If production requirements introduce a dirty-state confirmation, apply it consistently to every item configurator; do not make Half & Half an exception.

---

## 4. UI and component behavior

### 4.1 ChoiceButtonGroup

Import:

    import { ChoiceButtonGroup } from "@gigi/ux/index.mjs";

React API:

| Prop | Type | Behavior |
|---|---|---|
| `options` | `readonly { id: string; label: ReactNode }[]` | Choices displayed as buttons |
| `selectedIds` | `readonly string[]` | Controlled selected state |
| `onSelect` | `(optionId: string) => void` | Reports a pressed choice |
| `columns` | `1 \| 2` | Standard stack or compact two-column grid |
| `ariaLabel` | `string` | Accessible group name |
| `showSelectionMark` | `boolean` | Shows a checkmark on selected multi-choice options |

Rules:

- Use two columns for left/right pizza types and per-half extras.
- Use one column for size in the current React implementation.
- Single-selection logic belongs to the state machine, not the presentational component.
- Multi-selection extras toggle independently.
- Choice buttons expose selected state with `aria-pressed`.
- Minimum target height is 48px.
- Do not replace these controls with native radio buttons or small plus/minus affordances.

Figma variants:

- Layout: Single column / Two columns
- Mode: Single / Multiple
- Selection: None / One / Multiple
- Internal Choice Button states: Default / Selected / Disabled

### 4.2 StickyAction

Import:

    import { StickyAction } from "@gigi/ux/index.mjs";

React API:

| Prop | Behavior |
|---|---|
| `disabled` | Disables and visually mutes the primary action |
| `onClick` | Confirms the valid configuration |
| `secondaryLabel` | Adds an optional secondary action |
| `onSecondaryClick` | Handles that secondary action |

For Half & Half:

    <StickyAction disabled={!canConfirm} onClick={addToCart}>
      Add to cart · {formattedTotal}
    </StickyAction>

The disabled state must be clearly visible, but the label remains readable. Do not rely on color alone to communicate availability.

### 4.3 Brand tokens

Use existing Gigi variables:

- Brand Red: `#981B1E`
- Brand Gold: `#F6B83C`
- Surface: `#FFFFFF`
- Canvas: `#F3F3F3`
- Primary and secondary text variables from the Figma file
- DM Sans typography
- 12px control/card radius
- 18px mobile screen gutter
- 48px compact and 52px primary control heights

The responsive baseline is a 390 × 844 mobile viewport. On wider screens, retain the established centered mobile-shell behavior unless the broader ordering application defines a desktop layout.

---

## 5. Data model

The menu item id is:

    pizza-half-and-half

Its definition is declarative:

| Group | Kind | Required | Meaning |
|---|---|---:|---|
| `size` | single | yes | Shared S/M/L/XL pizza size |
| `halfLeft` | single | yes | Pizza type on the left half |
| `halfRight` | single | yes | Pizza type on the right half |
| `extraLeft` | multi | no | Paid extras on the left half |
| `extraRight` | multi | no | Paid extras on the right half |
| `notes` | text | no | Reference implementation's current instruction field |

Pricing behavior is declared by:

    basePricePolicy: {
      kind: "maxOfSingleGroups",
      groupIds: ["halfLeft", "halfRight"]
    }

Each half option reuses the corresponding pizza item's bilingual name and full size-price table. Do not duplicate or manually transcribe a second price list.

Example in-progress selection:

    {
      "size": "S",
      "groups": {
        "size": "S",
        "halfLeft": "pizza-plain",
        "halfRight": "pizza-deluxe",
        "extraLeft": ["mushrooms"],
        "extraRight": ["pepperoni"]
      }
    }

---

## 6. State machine contract

Relevant events:

| Event | Payload | Effect |
|---|---|---|
| `SET_SIZE` | `sizeId` | Changes shared size and removes size-invalid selections |
| `SET_SINGLE` | `groupId, optionId` | Sets left or right pizza type |
| `TOGGLE_MULTI` | `groupId, optionId` | Toggles a per-half extra |
| `SET_TEXT` | `groupId, value` | Updates instruction text in the reference implementation |
| `SET_QUANTITY` | `quantity` | Changes physical pizza count |
| `CONFIRM` | none | Completes only when `canConfirm` passes |

Required half selections are stored independently:

    groups.halfLeft
    groups.halfRight

Never infer one from the other. The same pizza type may be selected for both halves; if product wants to prevent this, that is a separate business rule and is not currently specified.

The screen should derive button availability from:

    snapshot.can({ type: "CONFIRM" })

Do not duplicate validation in click handlers.

---

## 7. Pricing

All money is integer cents.

Current formula:

    base = max(leftBaseAtSize, rightBaseAtSize)
    extras = sum(extraLeftAtSize) + sum(extraRightAtSize)
    unit = base + extras
    lineTotal = unit * quantity

The two policy groups must be skipped by the normal additive group loop after their maximum has been applied. Otherwise the half bases will be double-counted.

### Reference example

- Size: Small 10"
- Left: Cheese/Plain — $15.15
- Right: Deluxe — $21.00
- Left extra: Mushrooms — $3.95
- Right extra: Pepperoni — $5.20

Calculation:

    max(1515, 2100) + 395 + 520 = 3015 cents

Displayed result:

    $30.15

### Production safety

`resolvePrice` currently returns zero when a by-size table lacks the selected size. Treat missing production price data as a configuration error during validation/build. Do not silently sell a missing-priced option for $0.00.

---

## 8. Quantity and per-item instructions — required production gap

The approved behavior is:

- Quantity 1 Pizza
- Quantity 2 Pizzas
- Quantity 3 Pizzas

Each physical pizza must have its own instruction field:

- `1 — Small 10" Half & Half special instructions`
- `2 — Small 10" Half & Half special instructions`
- `3 — Small 10" Half & Half special instructions`

The current reference implementation stores one `notes` string for the entire configured line. That does **not** satisfy the per-item requirement when quantity is greater than one.

Recommended implementation:

1. Represent configured physical items as an ordered array.
2. Each item carries its own `notes` string.
3. Increasing quantity appends a new item with blank instructions.
4. Decreasing quantity removes the last item. If it contains non-empty instructions, require confirmation or provide Undo.
5. Cart persistence must preserve each item's instructions.
6. Identical items may be visually grouped in cart, but their distinct instructions must remain visible and editable.
7. Pricing remains `unitCents × item count`; notes never affect price.

If the cart domain cannot support per-unit metadata immediately, do not claim the feature is complete. A temporary quantity limit of one requires explicit product approval.

---

## 9. Language and copy

Required copy:

| English | French |
|---|---|
| Half & Half | Moitié-moitié |
| Left half | Moitié gauche |
| Right half | Moitié droite |
| Left-half extras | Extras — moitié gauche |
| Right-half extras | Extras — moitié droite |
| Special instructions | Instructions spéciales |
| Choose one pizza for each half. Your pizza is priced from the more expensive half. | Choisissez une pizza pour chaque moitié. Le prix est basé sur la moitié la plus chère. |
| Add to cart | Ajouter au panier |
| Back | Retour |

Use the existing `pick(..., lang)`, `money(..., lang)`, and `useOrderingCopy()` paths. Do not hardcode English inside components.

French layouts must be visually checked for wrapping at 390px.

---

## 10. Accessibility

Required:

- Back is an actual button with an accessible label.
- Each choice group has a localized `aria-label`.
- Choice buttons use `aria-pressed`.
- Disabled Add to cart uses the native `disabled` attribute.
- Selected states have text/checkmark reinforcement, not color alone.
- Keyboard focus is clearly visible.
- Focus order follows visual order: size, left, right, left extras, right extras, instructions, quantity, submit.
- Touch targets are at least 48px high.
- Price updates are announced with an `aria-live="polite"` region if they change after a selection.
- Validation does not appear only after an unavailable submit; required status is clear in group headings or helper text.

---

## 11. Cart and continue-ordering behavior

After successful confirmation:

1. Freeze the configuration and integer-cent unit price.
2. Add the configured physical item(s) to cart.
3. Show the standard item-added transition.
4. Continue ordering returns to browsing without clearing the cart.
5. Review cart shows:
   - Half & Half;
   - size;
   - left pizza type and extras;
   - right pizza type and extras;
   - each physical pizza's instructions;
   - quantity/unit grouping;
   - line total.
6. Edit returns to the configurator with the complete saved selection restored.
7. Back from cart returns to browsing without losing cart contents.

Do not route directly from Add to cart to checkout.

---

## 12. Business decisions still requiring owner confirmation

These are visible in the Figma handoff and isolated in code:

1. **Half topping charge:** current divisor is `1`, meaning full topping upcharges even though the topping covers half the pizza.
2. **Price comparison:** current implementation compares base pizza prices only, then adds extras from both halves.
3. **Shared size:** current implementation uses one shared size for the whole pizza.

The first two affect money and should be confirmed before production release.

Decision 1 is isolated as **`halfAndHalf.toppingDivisor`** in `src/domain/menu.seed.json` (`1` = full topping charge; e.g. `2` would halve per-half topping upcharges). The former `HALF_TOPPING_PRICE_DIVISOR` constant in `gigi-menu-config.ts` was removed when the menu became seed-driven — change the divisor in the JSON.

Owner-confirmed but not implemented in this flow: customers may remove included toppings for free. Included-topping removal requires structured per-pizza composition data and should be implemented as independent left/right removal groups. Do not model removals as negative-price extras.

---

## 13. Analytics

Recommended events:

| Event | Important properties |
|---|---|
| `half_half_viewed` | language, source category |
| `half_half_size_selected` | size |
| `half_half_side_selected` | side, pizzaId, size |
| `half_half_extra_toggled` | side, optionId, selected, size |
| `half_half_quantity_changed` | previous, next |
| `half_half_added_to_cart` | size, leftId, rightId, extra counts, quantity, unitCents, totalCents |
| `half_half_abandoned` | last completed step |

Do not include free-form instructions in analytics.

---

## 14. Test plan

### Domain/unit

- Uses the more expensive half base.
- Does not sum both half bases.
- Swapping left and right produces the same base price.
- Extras from both halves are added.
- Selected size chooses the matching base and extra tables.
- Quantity multiplies the final unit price.
- Ordinary pizza pricing is unchanged.
- Missing required left or right selection fails validation.
- Same pizza on both halves is valid unless product changes the rule.
- Missing size-table data fails configuration validation rather than charging zero.

### State machine/component

- Initial state has no left/right selections.
- Add to cart is disabled initially.
- Selecting only left remains disabled.
- Selecting both enables the action.
- Changing size preserves valid choices and removes invalid extras.
- Extra toggles affect only their own side.
- Back calls the cancellation path.
- ChoiceButtonGroup sends the correct option id.
- StickyAction forwards disabled to the primary Button.
- Quantity creates/removes the correct per-item instruction entries.

### End-to-end

1. Open Pizza and select Half & Half.
2. Confirm Back returns to menu.
3. Re-open and choose Small.
4. Choose left Plain only; confirm CTA is disabled.
5. Choose right Deluxe; confirm CTA enables.
6. Add left Mushrooms and right Pepperoni.
7. Confirm live total is $30.15.
8. Set quantity to two and enter different instructions for item 1 and item 2.
9. Add to cart.
10. Confirm the item-added transition offers Continue ordering and Review cart.
11. Confirm cart preserves both instructions and total $60.30.
12. Repeat the primary path in French.
13. Complete keyboard-only and screen-reader passes.

---

## 15. Commands and verification

From `gigi-ordering/`:

    npm test
    npm run typecheck
    npm run build

From `gigi-ux/`:

    npm run typecheck
    npm run build
    npm run build-storybook

From `gigi-static/`:

    npm run build

Full application:

    cd /Users/angelovagenas/Documents/GitHub/gigipizza-rmc
    ./start.sh

Then verify:

    http://localhost:8000/ordering

Language is persisted through `localStorage.gigi-lang` with `"en"` or `"fr"`.

---

## 16. Recommended implementation order

1. Confirm the two unresolved money rules.
2. Review the Figma flow and component variants.
3. Adopt or port the declarative `basePricePolicy`.
4. Adopt or port the Half & Half menu definition.
5. Wire `SET_SINGLE` and independent extras state.
6. Integrate ChoiceButtonGroup and disabled StickyAction.
7. Implement per-item instruction persistence for quantity greater than one.
8. Update cart display/edit behavior.
9. Add localized copy.
10. Add analytics.
11. Run domain, state, component, end-to-end, accessibility, and French QA.

---

## 17. Definition of done

The feature is complete only when:

- the Figma-required states are implemented;
- Back works throughout;
- left and right selections are independent and required;
- extras are independent per side;
- pricing matches confirmed owner rules in integer cents;
- missing price data cannot produce a free option;
- Add to cart remains disabled until valid;
- each physical pizza has its own instructions;
- the item-added transition supports continuing to order;
- cart and edit preserve the full configuration;
- English and French are complete;
- keyboard, screen-reader, focus, and touch-target requirements pass;
- automated tests and full-app build pass;
- the two unresolved money rules have written owner approval.

---

## 18. Responsive web layout

The ordering flow is a full-viewport web experience, not a device mockup. The
outer shell therefore has no border or corner radius at any breakpoint.

### Breakpoints

- **Mobile, below 768 px:** one-column, full-width content; category tabs may
  scroll horizontally; all configuration sections stack in source order; the
  primary action stays at the bottom of the viewport.
- **Tablet/desktop, 768 px and above:** content is centered within a 1200 px
  maximum-width rail; generic forms remain between 760–860 px for readability;
  footer actions are constrained and right-aligned.
- **Large desktop, 1100 px and above:** the browse menu uses three columns.

### Half & Half desktop composition

- Pricing guidance and the size selector span the full content rail.
- Sizes display in a four-column row.
- Left and right pizza selections form a two-column row.
- Left-half and right-half extras form the next two-column row.
- Quantity spans both columns.
- At mobile widths, the same DOM order collapses to one column so keyboard and
  screen-reader order remain unchanged.

The implementation hooks live in `src/screens/Configure.tsx` and the global
responsive rules live in `gigi-static/src/css/ux.css`.
