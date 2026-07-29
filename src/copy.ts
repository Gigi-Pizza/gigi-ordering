import { useLang } from "@gigi/ux/index.mjs";

const copy = {
  en: {
    title: "Order Online",
    cats: { pizza: "Pizza", subs: "Submarines", pasta: "Pasta", extras: "Extras", drinks: "Drinks" } as Record<string, string>,
    customize: "Customize", from: "From", back: "Back", addToCart: "Add to cart", viewCart: "View cart",
    cart: "Your cart", checkout: "Checkout", total: "Total", remove: "Remove", notes: "Special instructions",
    empty: "Your cart is empty.", placeOrder: "Place order", pickup: "Pickup", delivery: "Delivery", name: "Name", phone: "Phone", email: "Email", address: "Address", zone: "Delivery zone", confirmed: "Order ready to send", size: "Size", each: "each", quantity: "Quantity",
  },
  fr: {
    title: "Commander en ligne",
    cats: { pizza: "Pizza", subs: "Sous-marins", pasta: "Pâtes", extras: "Extras", drinks: "Boissons" } as Record<string, string>,
    customize: "Personnaliser", from: "À partir de", back: "Retour", addToCart: "Ajouter au panier", viewCart: "Voir le panier",
    cart: "Votre panier", checkout: "Passer à la caisse", total: "Total", remove: "Retirer", notes: "Instructions spéciales",
    empty: "Votre panier est vide.", placeOrder: "Commander", pickup: "À emporter", delivery: "Livraison", name: "Nom", phone: "Téléphone", email: "Courriel", address: "Adresse", zone: "Zone de livraison", confirmed: "Commande prête à envoyer", size: "Format", each: "ch.", quantity: "Quantité",
  },
};

export type OrderingCopy = (typeof copy)["en"];

export function useOrderingCopy(): { t: OrderingCopy; lang: "en" | "fr" } {
  const { lang } = useLang();
  return { t: copy[lang], lang };
}
