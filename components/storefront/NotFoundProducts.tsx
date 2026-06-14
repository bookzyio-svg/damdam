"use client";

import { useEffect, useState } from "react";
import ProductGrid from "@/components/storefront/ProductGrid";
import type { ProductCardData } from "@/lib/storefront/queries";

/** Sélection de produits affichée sur la page 404 (chargée au runtime). */
export default function NotFoundProducts() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/storefront/products?limit=8")
      .then((r) => r.json())
      .then((b) => setProducts(b.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-lg border border-line bg-surface" />
        ))}
      </div>
    );
  }
  if (!products.length) return null;
  return <ProductGrid products={products} />;
}
