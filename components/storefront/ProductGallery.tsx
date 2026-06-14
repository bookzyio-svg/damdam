"use client";

import { useEffect, useState } from "react";

type Img = { url: string; alt?: string };

/** Galerie produit : image principale + miniatures. */
export default function ProductGallery({ images, title, selectedUrl }: { images: Img[]; title: string; selectedUrl?: string }) {
  const [active, setActive] = useState(0);

  // Sélection d'une variante → bascule la galerie sur sa photo (comme Shopify)
  useEffect(() => {
    if (!selectedUrl) return;
    const idx = images.findIndex((im) => im.url === selectedUrl);
    if (idx >= 0) setActive(idx);
  }, [selectedUrl, images]);

  const main = images[active];

  return (
    <div>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={main.url} alt={main.alt || title} className="h-full w-full object-contain p-4" />
        ) : (
          <span className="text-sm text-muted">Pas d&apos;image</span>
        )}
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border ${i === active ? "border-brand" : "border-line"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
