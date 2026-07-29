// @gigi/ux is a deployed RMC module resolved at runtime via the import map
// (@gigi/ux/index.mjs -> assets.gigipizza.ca/ux/index.mjs); externalized from the
// slice build. These ambient types mirror the components/hooks the screens use.
declare module "@gigi/ux/index.mjs" {
  import type { ComponentType, ReactNode, HTMLAttributes } from "react";

  export type ButtonVariant = "primary" | "neutral" | "subtle";
  export const Button: ComponentType<
    Omit<HTMLAttributes<HTMLButtonElement>, "onClick"> & {
      variant?: ButtonVariant;
      size?: "small" | "medium";
      fullWidth?: boolean;
      onClick?: () => void;
      disabled?: boolean;
      type?: "button" | "submit";
      children?: ReactNode;
    }
  >;
  export const MobileShell: ComponentType<{ children: ReactNode; className?: string }>;
  export const TopBar: ComponentType<{ title: string; onBack?: () => void; backLabel?: string }>;
  export const MenuItemCard: ComponentType<{ heading: string; description: string; price?: string; selected?: boolean; actionLabel?: string; onAction?: () => void }>;
  export const QuantityControl: ComponentType<{ label: string; price: number; quantity: number; currency?: string; onChange?: (q: number) => void }>;
  export const FormField: ComponentType<{ label: string; error?: string; description?: string; value?: string; onChange?: (e: { target: { value: string } }) => void; placeholder?: string }>;
  export const OrderSummary: ComponentType<{ lines: { label: string; value: string; emphasized?: boolean }[] }>;
  export const StickyAction: ComponentType<{ children: ReactNode; disabled?: boolean; onClick?: () => void; secondaryLabel?: string; onSecondaryClick?: () => void }>;
  export const ChoiceButtonGroup: ComponentType<{
    options: readonly { id: string; label: ReactNode }[];
    selectedIds?: readonly string[];
    onSelect?: (optionId: string) => void;
    columns?: 1 | 2;
    ariaLabel?: string;
    showSelectionMark?: boolean;
    className?: string;
  }>;

  export type Lang = "en" | "fr";
  export function useLang(): { lang: Lang; setLang: (l: Lang) => void };
  export const LanguageProvider: ComponentType<{ children?: ReactNode }>;
}
