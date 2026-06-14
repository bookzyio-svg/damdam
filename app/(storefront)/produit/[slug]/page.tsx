import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/storefront/queries";
import ProductView from "@/components/storefront/ProductView";
import ProductReviews from "@/components/storefront/ProductReviews";
import ProductContent from "@/components/storefront/ProductContent";
import ProductGrid from "@/components/storefront/ProductGrid";
import Countdown from "@/components/storefront/Countdown";
import { Timer } from "lucide-react";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.seo?.title || product.title,
    description: product.seo?.description || product.shortDescription || undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const category = product.category as { _id?: string; name?: string; slug?: string } | null;
  const related = await getRelatedProducts(
    category?._id ?? null,
    product._id,
    6,
  );

  const flashActive =
    product.flashDeal?.active &&
    product.flashDeal?.endsAt &&
    new Date(product.flashDeal.endsAt).getTime() > Date.now();

  const inStock = !product.trackStock || (product.stock ?? 0) > 0;
  // Données structurées schema.org/Product (SEO §17.12)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: (product.images ?? []).map((i: { url: string }) => i.url),
    description: product.shortDescription || product.description || undefined,
    sku: product.sku || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    aggregateRating:
      product.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.reviewCount }
        : undefined,
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/produit/${product.slug}`,
    },
  };

  return (
    <div className="bg-bg">
    <div className="container-site space-y-8 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Fil d'ariane */}
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-brand">Accueil</Link>
        <span className="px-1">/</span>
        {category?.slug ? (
          <>
            <Link href={`/c/${category.slug}`} className="hover:text-brand">{category.name}</Link>
            <span className="px-1">/</span>
          </>
        ) : null}
        <span className="text-ink">{product.title}</span>
      </nav>

      {flashActive ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-deal px-4 py-2 text-white">
          <span className="flex items-center gap-1.5 font-bold"><Timer className="h-4 w-4" /> Vente flash</span>
          <span className="text-sm">se termine dans</span>
          <Countdown endsAt={product.flashDeal.endsAt as string} />
        </div>
      ) : null}

      {/* Galerie + achat (liés : la variante bascule la photo) */}
      <ProductView product={product} images={product.images ?? []} />

      {/* Description riche (texte + images + vidéos) ou texte simple */}
      {product.contentBlocks?.length ? (
        <section className="border-t border-line pt-8">
          <h2 className="mb-4 text-lg font-bold">Description</h2>
          <div className="mx-auto max-w-3xl">
            <ProductContent blocks={product.contentBlocks} />
          </div>
        </section>
      ) : product.description ? (
        <section className="border-t border-line pt-8">
          <h2 className="mb-3 text-lg font-bold">Description</h2>
          <div className="whitespace-pre-line text-sm leading-relaxed text-ink">{product.description}</div>
        </section>
      ) : null}

      {/* Caractéristiques */}
      {product.specs?.length ? (
        <section className="border-t border-line pt-8">
          <h2 className="mb-3 text-lg font-bold">Caractéristiques</h2>
          <table className="w-full max-w-2xl overflow-hidden rounded-lg border border-line text-sm">
            <tbody>
              {product.specs.map((s: { label: string; value: string }, i: number) => (
                <tr key={i} className={i % 2 ? "bg-surface" : "bg-white"}>
                  <td className="w-1/2 px-3 py-2 font-medium text-ink">{s.label}</td>
                  <td className="px-3 py-2 text-muted">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Avis */}
      <section className="border-t border-line pt-8">
        <ProductReviews
          productId={product._id}
          ratingAvg={product.ratingAvg ?? 0}
          reviewCount={product.reviewCount ?? 0}
        />
      </section>

      {/* Produits similaires */}
      {related.length ? (
        <section className="border-t border-line pt-8">
          <h2 className="mb-4 text-lg font-bold">Produits similaires</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
    </div>
  );
}
