import React from "@esm.sh/react";
import { useForm } from "@esm.sh/@tanstack/react-form";
import { MobileShell, TopBar, Button, FormField, StickyAction } from "@gigi/ux/index.mjs";
import type { FulfillmentT, CustomerT } from "../domain/order";
import { DELIVERY_ZONES } from "../domain/fulfillment-config";
import {
  emptyCheckout, buildFulfillment, buildCustomer,
  nameSchema, phoneSchema, emailSchema, addressSchema,
} from "../form/checkout-form";
import { pick } from "../lib/format";
import { useOrderingCopy } from "../copy";

// Show our own friendly, bilingual message when a field has ANY validation
// issue — never the raw Effect Schema string (which leaks the regex to the
// customer). `msg` is the per-field copy for the current language.
const fieldError = (errors: unknown[], msg: string): string | undefined =>
  errors.length > 0 ? msg : undefined;

export function Checkout({ onBack, onPlace }: {
  onBack: () => void;
  onPlace: (fulfillment: FulfillmentT, customer: CustomerT) => void;
}): React.ReactElement {
  const { t, lang } = useOrderingCopy();
  const form = useForm({
    defaultValues: emptyCheckout,
    onSubmit: ({ value }) => onPlace(buildFulfillment(value), buildCustomer(value)),
  });

  return (
    <MobileShell>
      <TopBar title={t.checkout} onBack={onBack} backLabel={t.back} />
      <main className="gigi-customization gigi-customization--checkout">
        <form className="gigi-checkout-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <form.Subscribe selector={(s) => s.values.mode}>
            {(mode) => (
              <React.Fragment>
                <section>
                  <h2>{t.checkout}</h2>
                  <div className="gigi-choice-grid">
                    <Button type="button" fullWidth variant={mode === "pickup" ? "primary" : "neutral"}
                      onClick={() => form.setFieldValue("mode", "pickup")}>{t.pickup}</Button>
                    <Button type="button" fullWidth variant={mode === "delivery" ? "primary" : "neutral"}
                      onClick={() => form.setFieldValue("mode", "delivery")}>{t.delivery}</Button>
                  </div>
                </section>

                <form.Field name="name" validators={{ onChange: nameSchema }}>
                  {(field) => (
                    <FormField label={t.name} value={field.state.value}
                      error={fieldError(field.state.meta.errors, t.errName)}
                      onChange={(e) => field.handleChange(e.target.value)} />
                  )}
                </form.Field>
                <form.Field name="phone" validators={{ onChange: phoneSchema }}>
                  {(field) => (
                    <FormField label={t.phone} value={field.state.value}
                      error={fieldError(field.state.meta.errors, t.errPhone)}
                      onChange={(e) => field.handleChange(e.target.value)} />
                  )}
                </form.Field>
                <form.Field name="email" validators={{ onChange: emailSchema }}>
                  {(field) => (
                    <FormField label={t.email} value={field.state.value}
                      error={fieldError(field.state.meta.errors, t.errEmail)}
                      onChange={(e) => field.handleChange(e.target.value)} />
                  )}
                </form.Field>

                {mode === "delivery" && (
                  <React.Fragment>
                    <form.Field name="address" validators={{ onChange: addressSchema }}>
                      {(field) => (
                        <FormField label={t.address} value={field.state.value}
                          error={fieldError(field.state.meta.errors, t.errAddress)}
                          onChange={(e) => field.handleChange(e.target.value)} />
                      )}
                    </form.Field>
                    <form.Field name="zone">
                      {(field) => (
                        <section>
                          <h2>{t.zone}</h2>
                          <div className="gigi-choice-grid">
                            {DELIVERY_ZONES.map((z) => (
                              <Button key={z.id} type="button" fullWidth
                                variant={field.state.value === z.id ? "primary" : "neutral"}
                                onClick={() => field.handleChange(z.id)}>{pick(z.label, lang)}</Button>
                            ))}
                          </div>
                        </section>
                      )}
                    </form.Field>
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
          </form.Subscribe>
        </form>
      </main>
      <StickyAction onClick={() => form.handleSubmit()}>{t.placeOrder}</StickyAction>
    </MobileShell>
  );
}
