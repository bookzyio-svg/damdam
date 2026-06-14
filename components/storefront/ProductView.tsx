"use client";

import { useMemo, useState } from "react";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductPurchase, { type PurchaseProduct } from "@/components/storefront/ProductPurchase";

type Img = { url: string; alt?: string };

/**
 * Lie la galerie au bloc d'achat : sélectionner une variante bascule la photo
 * principale sur l'image de cette variante (comme Shopify). Les photos de
 * variantes sont fusionnées dans les miniatures.
 */
export default function ProductView({
  product,
  images,
}: {
  product: PurchaseProduct;
  images: Img[];
}) {
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>(undefined);

  // Galerie = images produit + photos de variantes non déjà présentes
  const galleryImages = useMemo(() => {
    const imgs: Img[] = [...(images ?? [])];
    (product.variants ?? []).forEach((v) => {
      if (v.image && !imgs.some((im) => im.url === v.image)) imgs.push({ url: v.image });
    });
    return imgs;
  }, [images, product.variants]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
      <ProductGallery images={galleryImages} title={product.title} selectedUrl={selectedUrl} />
      <ProductPurchase product={product} onVariantChange={setSelectedUrl} />
    </div>
  );
}
