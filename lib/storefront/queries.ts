import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { serialize } from "@/lib/serialize";
import type { CatalogFilters } from "@/lib/storefront/filters";
import { sortClause } from "@/lib/storefront/filters";

const PAGE_SIZE = 24;

/** Carte produit allégée pour les grilles. */
export type ProductCardData = {
  _id: string;
  title: string;
  slug: string;
  brand?: string;
  images?: { url: string; alt?: string }[];
  price: number;
  compareAtPrice?: number | null;
  ratingAvg?: number;
  reviewCount?: number;
  soldCount?: number;
  stock?: number;
  trackStock?: boolean;
  condition?: string;
  hasVariants?: boolean;
  flashDeal?: { active?: boolean; endsAt?: string | null };
};

const CARD_FIELDS =
  "title slug brand images price compareAtPrice ratingAvg reviewCount soldCount stock trackStock condition hasVariants flashDeal";

/** Construit le filtre Mongo à partir des filtres parsés (hors catégorie). */
function buildFilter(f: CatalogFilters, base: Record<string, unknown> = {}) {
  const filter: Record<string, unknown> = { status: "active", ...base };
  const and: Record<string, unknown>[] = [];

  if (f.priceMin != null || f.priceMax != null) {
    const price: Record<string, number> = {};
    if (f.priceMin != null) price.$gte = f.priceMin;
    if (f.priceMax != null) price.$lte = f.priceMax;
    filter.price = price;
  }
  if (f.brands.length) filter.brand = { $in: f.brands };
  if (f.ratingMin != null) filter.ratingAvg = { $gte: f.ratingMin };
  if (f.condition) filter.condition = f.condition;
  if (f.promoOnly) {
    and.push({
      $or: [
        { compareAtPrice: { $ne: null, $gt: 0 } },
        { "flashDeal.active": true },
      ],
    });
  }
  if (f.inStockOnly) {
    and.push({ $or: [{ trackStock: false }, { stock: { $gt: 0 } }] });
  }
  if (and.length) filter.$and = and;
  return filter;
}

export type CatalogResult = {
  category: { _id: string; name: string; slug: string } | null;
  isPromotions: boolean;
  products: ProductCardData[];
  total: number;
  pages: number;
  page: number;
  facets: { brands: string[]; priceMin: number; priceMax: number };
};

/**
 * Récupère le catalogue filtré pour une catégorie (ou la page Promotions).
 */
export async function getCatalog(
  categorySlug: string | null,
  f: CatalogFilters,
): Promise<CatalogResult> {
  await connectDB();

  const isPromotions = categorySlug === "promotions";
  let category: { _id: unknown; name: string; slug: string } | null = null;
  const base: Record<string, unknown> = {};

  if (categorySlug && !isPromotions) {
    category = await Category.findOne({ slug: categorySlug }).select("name slug").lean<{ _id: string; name: string; slug: string }>();
    if (category) {
      // Inclut les sous-catégories directes
      const children = await Category.find({ parent: category._id as never }).select("_id").lean();
      const ids = [category._id, ...children.map((c) => c._id)];
      base.category = { $in: ids };
    }
  }
  if (isPromotions) {
    f = { ...f, promoOnly: true };
  }

  const filter = buildFilter(f, base);

  const [products, total, brandsAgg, priceAgg] = await Promise.all([
    Product.find(filter)
      .select(CARD_FIELDS)
      .sort(sortClause(f.sort))
      .skip((f.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Product.countDocuments(filter),
    // Facette marques : sur la catégorie, sans le filtre marque
    Product.distinct("brand", buildFilter({ ...f, brands: [] }, base)),
    Product.aggregate([
      { $match: buildFilter({ ...f, priceMin: undefined, priceMax: undefined }, base) },
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]),
  ]);

  return {
    category: category ? serialize({ _id: category._id, name: category.name, slug: category.slug }) : null,
    isPromotions,
    products: serialize(products),
    total,
    pages: Math.ceil(total / PAGE_SIZE) || 1,
    page: f.page,
    facets: {
      brands: (brandsAgg as string[]).filter(Boolean).sort(),
      priceMin: priceAgg[0] ? Math.floor(priceAgg[0].min / 100) : 0,
      priceMax: priceAgg[0] ? Math.ceil(priceAgg[0].max / 100) : 0,
    },
  };
}

/** Recherche plein-texte simple (titre/marque) + filtres. */
export async function searchCatalog(
  q: string,
  f: CatalogFilters,
): Promise<CatalogResult> {
  await connectDB();
  const base: Record<string, unknown> = q
    ? {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { brand: { $regex: q, $options: "i" } },
          { tags: { $regex: q, $options: "i" } },
        ],
      }
    : {};
  const filter = buildFilter(f, base);

  const [products, total, brandsAgg] = await Promise.all([
    Product.find(filter).select(CARD_FIELDS).sort(sortClause(f.sort)).skip((f.page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Product.countDocuments(filter),
    Product.distinct("brand", buildFilter({ ...f, brands: [] }, base)),
  ]);

  return {
    category: null,
    isPromotions: false,
    products: serialize(products),
    total,
    pages: Math.ceil(total / PAGE_SIZE) || 1,
    page: f.page,
    facets: { brands: (brandsAgg as string[]).filter(Boolean).sort(), priceMin: 0, priceMax: 0 },
  };
}

/** Fiche produit complète par slug (statut actif). */
export async function getProductBySlug(slug: string) {
  await connectDB();
  const product = await Product.findOne({ slug, status: "active" })
    .populate("category", "name slug")
    .lean();
  return product ? serialize(product) : null;
}

/** Produits similaires (même catégorie, hors produit courant). */
export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 6,
): Promise<ProductCardData[]> {
  await connectDB();
  const filter: Record<string, unknown> = { status: "active", _id: { $ne: excludeId } };
  if (categoryId) filter.category = categoryId;
  const items = await Product.find(filter).select(CARD_FIELDS).sort({ soldCount: -1 }).limit(limit).lean();
  return serialize(items);
}

/** Données de la page d'accueil : flash deals, mises en avant, best-sellers. */
export async function getHomeData() {
  await connectDB();
  const now = new Date();
  const [flashDeals, featured, bestSellers, newest, categories] = await Promise.all([
    Product.find({ status: "active", "flashDeal.active": true, "flashDeal.endsAt": { $gt: now } })
      .select(CARD_FIELDS)
      .sort({ "flashDeal.endsAt": 1 })
      .limit(8)
      .lean(),
    Product.find({ status: "active", featured: true }).select(CARD_FIELDS).sort({ updatedAt: -1 }).limit(8).lean(),
    Product.find({ status: "active" }).select(CARD_FIELDS).sort({ soldCount: -1 }).limit(8).lean(),
    Product.find({ status: "active" }).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(8).lean(),
    Category.find({ parent: null }).sort({ order: 1, name: 1 }).limit(12).lean(),
  ]);
  return {
    flashDeals: serialize(flashDeals) as ProductCardData[],
    featured: serialize(featured) as ProductCardData[],
    bestSellers: serialize(bestSellers) as ProductCardData[],
    newest: serialize(newest) as ProductCardData[],
    categories: serialize(categories),
  };
}

/** Produits vitrine (actifs, les plus vendus) — utilisé par la page 404. */
export async function getShowcaseProducts(limit = 8): Promise<ProductCardData[]> {
  await connectDB();
  const items = await Product.find({ status: "active" })
    .select(CARD_FIELDS)
    .sort({ soldCount: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return serialize(items) as ProductCardData[];
}
