import type { Metadata } from "next";
import { searchCatalog } from "@/lib/storefront/queries";
import { parseFilters, type RawParams } from "@/lib/storefront/filters";
import CatalogSidebar from "@/components/storefront/CatalogSidebar";
import CatalogToolbar from "@/components/storefront/CatalogToolbar";
import ProductGrid from "@/components/storefront/ProductGrid";
import Pagination from "@/components/storefront/Pagination";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: RawParams;
}): Promise<Metadata> {
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  return { title: q ? `Recherche : ${q}` : "Recherche" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: RawParams;
}) {
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const filters = parseFilters(searchParams);
  const result = await searchCatalog(q.trim(), filters);

  return (
    <div className="container-site py-6">
      <h1 className="mb-1 text-2xl font-bold">Recherche</h1>
      <p className="mb-4 text-sm text-muted">
        {q ? <>Résultats pour «&nbsp;<span className="font-semibold text-ink">{q}</span>&nbsp;»</> : "Saisissez un terme dans la barre de recherche."}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden rounded-lg border border-line bg-white p-4 lg:block">
          <CatalogSidebar facets={result.facets} />
        </aside>
        <div>
          <CatalogToolbar total={result.total} facets={result.facets} />
          <ProductGrid products={result.products} />
          <Pagination page={result.page} pages={result.pages} />
        </div>
      </div>
    </div>
  );
}
