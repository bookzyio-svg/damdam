/**
 * Génération des références : numéros de commande, motif de virement, numéro
 * de livraison. Les compteurs « lisibles » (CMD-2026-00001) sont gérés au
 * niveau du modèle Order (compteur atomique) ; ici on fournit les helpers de
 * format et les références aléatoires non séquentielles.
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I/O/0/1 ambigus

/** Chaîne aléatoire à partir d'un alphabet sans caractères ambigus. */
export function randomCode(length = 5): string {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Motif de virement, ex : "TX-7F3K9". Doit être unique (index Order). */
export function paymentReference(): string {
  return `TX-${randomCode(5)}`;
}

/** Numéro de livraison, ex : "LIV-9K2M7X". Généré à la confirmation du paiement. */
export function deliveryNumber(): string {
  return `LIV-${randomCode(6)}`;
}

/** Formate un numéro de commande séquentiel : (année, 42) → "CMD-2026-00042". */
export function formatOrderNumber(year: number, seq: number): string {
  return `CMD-${year}-${String(seq).padStart(5, "0")}`;
}
