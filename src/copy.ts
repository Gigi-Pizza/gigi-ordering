import { useLang } from "@gigi/ux/index.mjs";

const copy = {
  en: {
    title: "Order Online",
    cats: { pizza: "Pizza", subs: "Submarines", pasta: "Pasta", extras: "Extras", drinks: "Drinks" } as Record<string, string>,
    select: "Select", addAnother: "Add another", inOrder: (quantity: number) => `${quantity} in your order`, from: "From", back: "Back", addToCart: "Add to cart", viewCart: "View cart",
    cart: "Your cart", checkout: "Checkout", total: "Total", remove: "Remove", notes: "Special instructions",
    empty: "Your cart is empty.", placeOrder: "Place order", pickup: "Pickup", delivery: "Delivery", name: "Name", phone: "Phone", email: "Email", address: "Address", zone: "Delivery zone", confirmed: "Order received", confirmedBody: "Thanks! Gigi's has received your order and will contact you if anything needs confirmation.", size: "Size", each: "each", quantity: "Quantity",
    halfPriceNote: "Choose one pizza for each half. Your pizza is priced from the more expensive half.",
    errName: "Please enter your name", errPhone: "Enter a valid phone number", errEmail: "Enter a valid email address", errAddress: "Please enter your delivery address",
  },
  fr: {
    title: "Commander en ligne",
    cats: { pizza: "Pizza", subs: "Sous-marins", pasta: "Pâtes", extras: "Extras", drinks: "Boissons" } as Record<string, string>,
    select: "Sélectionner", addAnother: "En ajouter un autre", inOrder: (quantity: number) => `${quantity} dans votre commande`, from: "À partir de", back: "Retour", addToCart: "Ajouter au panier", viewCart: "Voir le panier",
    cart: "Votre panier", checkout: "Passer à la caisse", total: "Total", remove: "Retirer", notes: "Instructions spéciales",
    empty: "Votre panier est vide.", placeOrder: "Commander", pickup: "À emporter", delivery: "Livraison", name: "Nom", phone: "Téléphone", email: "Courriel", address: "Adresse", zone: "Zone de livraison", confirmed: "Commande reçue", confirmedBody: "Merci! Gigi's a reçu votre commande et communiquera avec vous si une confirmation est nécessaire.", size: "Format", each: "ch.", quantity: "Quantité",
    halfPriceNote: "Choisissez une pizza pour chaque moitié. Le prix est basé sur la moitié la plus chère.",
    errName: "Veuillez entrer votre nom", errPhone: "Entrez un numéro de téléphone valide", errEmail: "Entrez une adresse courriel valide", errAddress: "Veuillez entrer votre adresse de livraison",
  },
};

export type OrderingCopy = (typeof copy)["en"];

export function useOrderingCopy(): { t: OrderingCopy; lang: "en" | "fr" } {
  const { lang } = useLang();
  return { t: copy[lang], lang };
}
