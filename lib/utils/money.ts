/**
 * Gestion de l'argent — montants stockés en CENTIMES (entiers), devise EUR (§2).
 */

/** Formate un montant en centimes vers une chaîne EUR : 129990 → "1 299,90 €" */
export function formatPrice(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

/** Pourcentage de remise entre prix barré et prix de vente : -XX % (entier). */
export function discountPercent(
  price: number,
  compareAtPrice?: number | null,
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}

/** Économie en centimes (prix barré − prix). */
export function savingsCents(
  price: number,
  compareAtPrice?: number | null,
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return compareAtPrice - price;
}

/** Centimes → valeur euros pour un champ de saisie : 129990 → "1299.90" */
export function centsToEurosInput(cents: number | null | undefined): string {
  return ((cents ?? 0) / 100).toFixed(2);
}

/** Convertit des euros (nombre/string) en centimes entiers : "1299.90" → 129990 */
export function eurosToCents(euros: number | string): number {
  const n = typeof euros === "string" ? parseFloat(euros.replace(",", ".")) : euros;
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}
