import ProductCard from "@/components/storefront/ProductCard";
import type { ProductCardData } from "@/lib/storefront/queries";

/** Grille dense de cartes produit : 2 colonnes mobile → 4 desktop (§3). */
export default function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
        Aucun produit ne correspond.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
