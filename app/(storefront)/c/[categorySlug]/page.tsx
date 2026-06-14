import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/storefront/queries";
import { parseFilters, type RawParams } from "@/lib/storefront/filters";
import CatalogSidebar from "@/components/storefront/CatalogSidebar";
import CatalogToolbar from "@/components/storefront/CatalogToolbar";
import ProductGrid from "@/components/storefront/ProductGrid";
import Pagination from "@/components/storefront/Pagination";
import { NAV_CATEGORIES } from "@/lib/navigation";

export const dynamic = "force-dynamic";

function titleFor(slug: string, name?: string | null) {
  if (name) return name;
  const nav = NAV_CATEGORIES.find((c) => c.slug === slug);
  if (nav) return nav.label;
  if (slug === "promotions") return "Promotions";
  return slug;
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string };
}): Promise<Metadata> {
  return { title: titleFor(params.categorySlug) };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: { categorySlug: string };
  searchParams: RawParams;
}) {
  const filters = parseFilters(searchParams);
  const result = await getCatalog(params.categorySlug, filters);
  const heading = titleFor(params.categorySlug, result.category?.name);

  return (
    <div className="container-site py-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-brand">Accueil</Link> <span className="px-1">/</span>
        <span className="text-ink">{heading}</span>
      </nav>

      <h1 className="mb-4 text-2xl font-bold">{heading}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar filtres (desktop) */}
        <aside className="hidden rounded-lg border border-line bg-white p-4 lg:block">
          <CatalogSidebar facets={result.facets} />
        </aside>

        {/* Résultats */}
        <div>
          <CatalogToolbar total={result.total} facets={result.facets} />
          <ProductGrid products={result.products} />
          <Pagination page={result.page} pages={result.pages} />
        </div>
      </div>
    </div>
  );
}
