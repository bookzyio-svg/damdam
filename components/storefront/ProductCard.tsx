"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Truck } from "lucide-react";
import Stars from "@/components/storefront/Stars";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, discountPercent } from "@/lib/utils/money";
import type { ProductCardData } from "@/lib/storefront/queries";

/**
 * Carte produit dense (§3) : image, badge remise, marque, titre 2 lignes,
 * étoiles + avis, prix rouge + prix barré + % off, "X vendus", livraison
 * gratuite, ajout rapide au panier.
 */
export default function ProductCard({ product }: { product: ProductCardData }) {
  const { add } = useCart();
  const router = useRouter();

  const off = discountPercent(product.price, product.compareAtPrice);
  const inStock = !product.trackStock || (product.stock ?? 0) > 0;
  const image = product.images?.[0]?.url;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    // Produit à variantes : on passe par la fiche pour choisir l'option
    if (product.hasVariants) {
      router.push(`/produit/${product.slug}`);
      return;
    }
    add({
      productId: product._id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      condition: product.condition,
      image,
      quantity: 1,
      maxStock: product.trackStock ? product.stock ?? 0 : 0,
    });
    // Moins d'étapes = plus de conversion : on file directement au paiement
    router.push("/checkout");
  }

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition-shadow hover:shadow-card-hover"
    >
      {/* Image + badge remise */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        {off > 0 ? (
          <span className="absolute left-2 top-2 z-10 badge-deal">-{off} %</span>
        ) : null}
        {product.condition === "reconditionne" ? (
          <span className="absolute right-2 top-2 z-10 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Reconditionné
          </span>
        ) : null}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.images?.[0]?.alt || product.title} className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">Pas d&apos;image</div>
        )}
        {/* Ajout rapide au survol */}
        <button
          onClick={quickAdd}
          className="absolute inset-x-2 bottom-2 flex translate-y-12 items-center justify-center gap-1.5 rounded-md bg-brand py-2 text-sm font-semibold text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 disabled:bg-muted"
          disabled={!inStock}
        >
          <ShoppingCart className="h-4 w-4" />
          {!inStock ? "Indisponible" : product.hasVariants ? "Choisir" : "Acheter"}
        </button>
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col p-3">
        {product.brand ? (
          <div className="text-xs font-medium uppercase tracking-wide text-muted">{product.brand}</div>
        ) : null}
        <div className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-ink">
          {product.title}
        </div>

        <div className="mt-1">
          <Stars rating={product.ratingAvg ?? 0} count={product.reviewCount ?? 0} />
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className="price text-lg">{formatPrice(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="price-strike text-xs">{formatPrice(product.compareAtPrice)}</span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center justify-between text-xs">
          {(product.soldCount ?? 0) > 0 ? (
            <span className="text-muted">{product.soldCount} vendus</span>
          ) : <span />}
          {inStock ? (
            <span className="badge-stock"><Truck className="h-3.5 w-3.5" /> Livraison gratuite</span>
          ) : (
            <span className="font-medium text-deal">Rupture</span>
          )}
        </div>
      </div>
    </Link>
  );
}
