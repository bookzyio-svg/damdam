import { eurosToCents } from "@/lib/utils/money";

/**
 * Parsing des filtres de catalogue depuis les searchParams de l'URL.
 * Paramètres FR : prix_min, prix_max, marque, note, promo, stock, etat, tri, page.
 */
export type CatalogFilters = {
  priceMin?: number; // centimes
  priceMax?: number; // centimes
  brands: string[];
  ratingMin?: number;
  promoOnly: boolean;
  inStockOnly: boolean;
  condition?: "neuf" | "reconditionne";
  sort: string;
  page: number;
};

export type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export function parseFilters(params: RawParams): CatalogFilters {
  const brandRaw = params.marque;
  const brands = (Array.isArray(brandRaw) ? brandRaw : brandRaw ? [brandRaw] : [])
    .flatMap((b) => b.split(","))
    .map((b) => b.trim())
    .filter(Boolean);

  const priceMinEur = first(params.prix_min);
  const priceMaxEur = first(params.prix_max);
  const note = Number(first(params.note));
  const etat = first(params.etat);

  return {
    priceMin: priceMinEur ? eurosToCents(priceMinEur) : undefined,
    priceMax: priceMaxEur ? eurosToCents(priceMaxEur) : undefined,
    brands,
    ratingMin: note >= 1 && note <= 5 ? note : undefined,
    promoOnly: first(params.promo) === "1",
    inStockOnly: first(params.stock) === "1",
    condition: etat === "neuf" || etat === "reconditionne" ? etat : undefined,
    sort: first(params.tri) || "popularite",
    page: Math.max(1, Number(first(params.page)) || 1),
  };
}

/** Traduit le tri FR en clause de tri Mongoose. */
export function sortClause(sort: string): Record<string, 1 | -1> {
  switch (sort) {
    case "prix-asc":
      return { price: 1 };
    case "prix-desc":
      return { price: -1 };
    case "nouveautes":
      return { createdAt: -1 };
    case "note":
      return { ratingAvg: -1, reviewCount: -1 };
    case "popularite":
    default:
      return { soldCount: -1, featured: -1 };
  }
}

/** Construit une querystring en modifiant certains paramètres (pour les liens de filtres). */
export function buildQuery(
  current: RawParams,
  changes: Record<string, string | null>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v == null) continue;
    const val = Array.isArray(v) ? v.join(",") : v;
    if (val) sp.set(k, val);
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v === null) sp.delete(k);
    else sp.set(k, v);
  }
  // On réinitialise la pagination dès qu'un filtre change
  if (!("page" in changes)) sp.delete("page");
  const s = sp.toString();
  return s ? `?${s}` : "";
}
