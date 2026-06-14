"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, ShieldCheck, RotateCcw, CheckCircle2, Flame, ShoppingCart } from "lucide-react";
import Stars from "@/components/storefront/Stars";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, discountPercent, savingsCents } from "@/lib/utils/money";

type Variant = { title: string; price?: number; stock?: number; image?: string };

export type PurchaseProduct = {
  _id: string;
  slug: string;
  title: string;
  brand?: string;
  price: number;
  compareAtPrice?: number | null;
  images?: { url: string }[];
  ratingAvg?: number;
  reviewCount?: number;
  soldCount?: number;
  stock?: number;
  trackStock?: boolean;
  condition?: string;
  hasVariants?: boolean;
  variants?: Variant[];
};

/** Bloc d'achat : prix, économie, variante, stock, quantité, ajout/achat. */
export default function ProductPurchase({ product, onVariantChange }: { product: PurchaseProduct; onVariantChange?: (url?: string) => void }) {
  const { add } = useCart();
  const router = useRouter();
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const variant = product.hasVariants && product.variants?.length ? product.variants[variantIdx] : undefined;
  const price = variant?.price ?? product.price;
  const stock = variant ? variant.stock ?? 0 : product.stock ?? 0;
  const inStock = !product.trackStock || stock > 0;
  const off = discountPercent(price, product.compareAtPrice);
  const saving = savingsCents(price, product.compareAtPrice);

  const maxQty = useMemo(() => (product.trackStock ? Math.max(1, stock) : 99), [product.trackStock, stock]);

  function buildItem() {
    return {
      productId: product._id,
      slug: product.slug,
      title: product.title,
      variantTitle: variant?.title,
      price,
      compareAtPrice: product.compareAtPrice || undefined,
      condition: product.condition,
      image: variant?.image || product.images?.[0]?.url,
      quantity: qty,
      maxStock: product.trackStock ? stock : 0,
    };
  }

  // Achat express : on ajoute et on file au checkout (moins d'étapes = + de conversion)
  const buyNow = () => {
    add(buildItem());
    router.push("/checkout");
  };

  return (
    <div>
      {product.brand ? (
        <div className="text-sm font-medium uppercase tracking-wide text-muted">{product.brand}</div>
      ) : null}
      <h1 className="mt-1 text-2xl font-bold leading-snug">{product.title}</h1>

      <div className="mt-2 flex items-center gap-3">
        <Stars rating={product.ratingAvg ?? 0} count={product.reviewCount ?? 0} size="md" />
        {(product.soldCount ?? 0) > 0 ? (
          <span className="text-sm text-muted">· {product.soldCount} vendus</span>
        ) : null}
        {product.condition === "reconditionne" ? (
          <span className="rounded bg-surface px-2 py-0.5 text-xs font-semibold">Reconditionné</span>
        ) : null}
      </div>

      {/* Bloc prix */}
      <div className="mt-4 rounded-lg bg-deal-soft p-4">
        <div className="flex items-end gap-3">
          <span className="price text-3xl">{formatPrice(price)}</span>
          {product.compareAtPrice && product.compareAtPrice > price ? (
            <>
              <span className="price-strike">{formatPrice(product.compareAtPrice)}</span>
              <span className="badge-deal">-{off} %</span>
            </>
          ) : null}
        </div>
        {saving > 0 ? (
          <div className="mt-1 text-sm font-semibold text-deal">Vous économisez {formatPrice(saving)}</div>
        ) : null}
        <div className="mt-1 text-xs text-muted">TTC · livraison gratuite</div>
      </div>

      {/* Variantes */}
      {product.hasVariants && product.variants?.length ? (
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium">Variante</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v, i) => (
              <button
                key={i}
                onClick={() => { setVariantIdx(i); setQty(1); onVariantChange?.(v.image); }}
                className={`rounded-md border px-3 py-1.5 text-sm ${i === variantIdx ? "border-brand bg-brand/5 font-semibold text-brand" : "border-line hover:border-brand"}`}
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Stock + urgence */}
      <div className="mt-4 text-sm">
        {inStock ? (
          product.trackStock && stock <= 5 ? (
            <span className="flex items-center gap-1.5 font-semibold text-deal"><Flame className="h-4 w-4" /> Plus que {stock} en stock — commandez vite !</span>
          ) : (
            <span className="badge-stock"><CheckCircle2 className="h-4 w-4" /> En stock{product.trackStock ? ` (${stock} disponibles)` : ""}</span>
          )
        ) : (
          <span className="font-semibold text-deal">Rupture de stock</span>
        )}
      </div>

      {/* Quantité + actions */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center rounded-md border border-line">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-lg" aria-label="Diminuer">−</button>
          <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="px-3 py-2 text-lg" aria-label="Augmenter">+</button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button onClick={buyNow} disabled={!inStock} className="btn-outline flex-1 rounded-xl py-3.5 text-base">
          <ShoppingCart className="h-5 w-5" /> Ajouter au panier
        </button>
        <button onClick={buyNow} disabled={!inStock} className="btn-deal flex-1 rounded-xl py-3.5 text-base">
          Acheter maintenant
        </button>
      </div>

      {/* Encart de confiance */}
      <ul className="mt-5 divide-y divide-line rounded-lg border border-line bg-surface/60 text-sm text-ink">
        <li className="flex items-center gap-2.5 px-4 py-2.5">
          <Truck className="h-5 w-5 text-brand" />
          <span><b>Livraison suivie</b> en temps réel, partout en France</span>
        </li>
        <li className="flex items-center gap-2.5 px-4 py-2.5">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <span><b>Paiement sécurisé</b> par virement bancaire</span>
        </li>
        <li className="flex items-center gap-2.5 px-4 py-2.5">
          <RotateCcw className="h-5 w-5 text-brand" />
          <span><b>Retour sous 14 jours</b> — satisfait ou remboursé</span>
        </li>
      </ul>
    </div>
  );
}
