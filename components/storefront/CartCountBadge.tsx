"use client";

import { useCart } from "@/components/cart/CartProvider";

/** Pastille compteur du panier (header). */
export default function CartCountBadge() {
  const { count, ready } = useCart();
  return (
    <span className="rounded-full bg-star px-1.5 text-xs font-bold text-ink">
      {ready ? count : 0}
    </span>
  );
}
