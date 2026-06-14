import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/** Sitemap dynamique : pages statiques + catégories + produits actifs. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Tolérant aux pannes : un souci DB ne doit jamais casser le sitemap.
  let products: { slug: string; updatedAt?: Date }[] = [];
  let categories: { slug: string }[] = [];
  try {
    await connectDB();
    [products, categories] = await Promise.all([
      Product.find({ status: "active" }).select("slug updatedAt").limit(5000).lean() as never,
      Category.find().select("slug").lean() as never,
    ]);
  } catch {
    /* base indisponible : on renvoie au moins les routes statiques */
  }

  const staticRoutes = ["", "/recherche", "/suivi", "/contact", "/a-propos", "/mentions-legales", "/cgv", "/confidentialite", "/retractation"].map(
    (p) => ({ url: `${SITE_URL}${p || "/"}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.5 }),
  );

  const catRoutes = categories.map((c) => ({
    url: `${SITE_URL}/c/${c.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const productRoutes = products.map((p) => ({
    url: `${SITE_URL}/produit/${p.slug}`,
    lastModified: p.updatedAt as Date | undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...catRoutes, ...productRoutes];
}
