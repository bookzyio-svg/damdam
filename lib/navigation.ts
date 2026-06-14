/**
 * Catégories de navigation du storefront (§3 — barre sous le header).
 * Les slugs correspondront aux Category.slug créées en base (phase Catégories).
 */
export const NAV_CATEGORIES = [
  { label: "Électroménager", slug: "electromenager" },
  { label: "TV & Image", slug: "tv-image" },
  { label: "Audio", slug: "audio" },
  { label: "Informatique", slug: "informatique" },
  { label: "Téléphonie", slug: "telephonie" },
  { label: "Maison connectée", slug: "maison-connectee" },
  { label: "Promotions", slug: "promotions" },
] as const;

export type NavCategory = (typeof NAV_CATEGORIES)[number];
