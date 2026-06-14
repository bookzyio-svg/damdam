/** Ligne de panier (prix en centimes). */
export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  variantTitle?: string;
  price: number; // centimes
  compareAtPrice?: number; // prix barré (centimes) — pour la remise affichée
  condition?: string; // "neuf" | "reconditionne"
  image?: string;
  quantity: number;
  maxStock?: number; // pour borner la quantité (0 = non suivi)
};

/** Clé unique d'une ligne (produit + variante). */
export function lineKey(item: Pick<CartItem, "productId" | "variantTitle">): string {
  return `${item.productId}__${item.variantTitle ?? ""}`;
}
