"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { lineKey } from "@/lib/cart/types";
import { formatPrice } from "@/lib/utils/money";

export default function CartPage() {
  const { items, subtotal, setQty, remove, ready } = useCart();

  if (ready && items.length === 0) {
    return (
      <div className="container-site py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Votre panier est vide</h1>
        <p className="mb-6 text-muted">Découvrez nos meilleures offres high-tech.</p>
        <Link href="/" className="btn-brand">Continuer mes achats</Link>
      </div>
    );
  }

  return (
    <div className="container-site py-6">
      <h1 className="mb-6 text-2xl font-bold">Mon panier</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Lignes */}
        <div className="divide-y divide-line rounded-lg border border-line bg-white">
          {items.map((item) => {
            const key = lineKey(item);
            return (
              <div key={key} className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded border border-line bg-surface">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/produit/${item.slug}`} className="line-clamp-2 font-medium text-ink hover:text-brand">
                    {item.title}
                  </Link>
                  {item.variantTitle ? <div className="text-xs text-muted">{item.variantTitle}</div> : null}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-line">
                      <button onClick={() => setQty(key, item.quantity - 1)} className="px-2.5 py-1 text-lg" aria-label="Diminuer">−</button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button onClick={() => setQty(key, item.quantity + 1)} className="px-2.5 py-1 text-lg" aria-label="Augmenter">+</button>
                    </div>
                    <button onClick={() => remove(key)} className="text-sm font-medium text-deal hover:underline">Supprimer</button>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="price">{formatPrice(item.price * item.quantity)}</div>
                  <div className="text-xs text-muted">{formatPrice(item.price)} / u</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Récap */}
        <aside className="h-fit rounded-lg border border-line bg-white p-5">
          <h2 className="mb-3 text-lg font-bold">Récapitulatif</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Sous-total</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted">Livraison</span>
            <span className="text-stock font-semibold">Calculée au paiement</span>
          </div>
          <Link href="/checkout" className="btn-deal mt-4 w-full py-3 text-base">
            Passer la commande
          </Link>
          <Link href="/" className="mt-2 block text-center text-sm text-brand hover:underline">
            Continuer mes achats
          </Link>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Paiement par virement · expédition dès réception
          </p>
        </aside>
      </div>
    </div>
  );
}
