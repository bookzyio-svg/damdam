import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { uniqueSlug, slugify } from "@/lib/utils/slug";
import { uploadFromUrl, isCloudinaryConfigured } from "@/lib/cloudinary";

/** Produit normalisé issu d'un import (prix en CENTIMES). */
export type NormalizedProduct = {
  title: string;
  description?: string;
  shortDescription?: string;
  price: number; // centimes
  compareAtPrice?: number | null;
  images?: string[]; // URLs distantes
  sku?: string;
  brand?: string;
  stock?: number;
  specs?: { label: string; value: string }[];
  variants?: { title: string; price?: number; stock?: number }[];
  tags?: string[];
};

export type ImportSource = { type: "csv" | "url" | "aliexpress"; ref?: string };

const MAX_IMAGES = 8;

/**
 * Re-héberge les images sur Cloudinary (§10). En cas d'échec (clé absente ou
 * URL invalide), on conserve l'URL d'origine pour ne pas perdre l'image.
 */
async function rehostImages(urls: string[] = []): Promise<{ url: string; publicId: string; alt: string }[]> {
  const valid = urls.filter((u) => u && /^https?:\/\//i.test(u)).slice(0, MAX_IMAGES);

  // Cloudinary non configuré → on garde les URLs d'origine (pas d'appel réseau inutile)
  if (!isCloudinaryConfigured()) {
    return valid.map((url) => ({ url, publicId: "", alt: "" }));
  }

  const out: { url: string; publicId: string; alt: string }[] = [];
  for (const url of valid) {
    try {
      const r = await uploadFromUrl(url);
      out.push({ url: r.url, publicId: r.publicId, alt: "" });
    } catch {
      out.push({ url, publicId: "", alt: "" });
    }
  }
  return out;
}

/** Crée un produit en BROUILLON à partir d'un produit normalisé. */
export async function createDraftProduct(n: NormalizedProduct, source: ImportSource) {
  await connectDB();
  const slug = await uniqueSlug(slugify(n.title), async (s) => Boolean(await Product.exists({ slug: s })));
  const images = await rehostImages(n.images);

  const hasVariants = Boolean(n.variants && n.variants.length > 1);

  const product = await Product.create({
    title: n.title,
    slug,
    brand: n.brand,
    description: n.description,
    shortDescription: n.shortDescription,
    specs: n.specs ?? [],
    images,
    price: n.price,
    compareAtPrice: n.compareAtPrice ?? undefined,
    sku: n.sku,
    trackStock: n.stock != null,
    stock: n.stock ?? 0,
    hasVariants,
    variants: hasVariants
      ? n.variants!.map((v) => ({ title: v.title, price: v.price, stock: v.stock ?? 0 }))
      : [],
    tags: n.tags ?? [],
    status: "draft",
    importSource: { type: source.type, ref: source.ref },
  });

  return { id: String(product._id), title: product.title, slug };
}

/** Crée une série de brouillons et renvoie un résumé. */
export async function createDrafts(list: NormalizedProduct[], source: ImportSource) {
  const created: { id: string; title: string }[] = [];
  const errors: string[] = [];
  for (const n of list) {
    if (!n.title || !n.price) {
      errors.push(`Produit ignoré (titre ou prix manquant) : ${n.title || "?"}`);
      continue;
    }
    try {
      const r = await createDraftProduct(n, source);
      created.push({ id: r.id, title: r.title });
    } catch (e) {
      errors.push(`Échec « ${n.title} » : ${e instanceof Error ? e.message : "erreur"}`);
    }
  }
  return { created, errors, count: created.length };
}
