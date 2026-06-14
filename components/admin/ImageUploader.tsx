"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type ProductImage = { url: string; publicId: string; alt?: string };

/**
 * Uploader d'images drag & drop (Cloudinary via /api/upload). Gère l'ajout,
 * la suppression et le réordonnement (la 1re image = image principale).
 */
export default function ImageUploader({
  images,
  onChange,
}: {
  images: ProductImage[];
  onChange: (imgs: ProductImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Échec de l'upload");
      const added: ProductImage[] = (body.images ?? []).map(
        (i: { url: string; publicId: string }) => ({ ...i, alt: "" }),
      );
      onChange([...images, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  }

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const copy = [...images];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors",
          dragOver ? "border-brand bg-brand/5" : "border-line bg-surface",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />
        {uploading ? (
          <span className="text-muted">Upload en cours…</span>
        ) : (
          <>
            <span className="font-medium text-ink">Glissez vos images ici</span>
            <span className="text-muted">ou cliquez pour parcourir (JPG, PNG, WebP — max 8 Mo)</span>
          </>
        )}
      </div>

      {error ? <p className="mt-2 text-sm text-deal">{error}</p> : null}

      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.publicId || i} className="group relative overflow-hidden rounded-md border border-line">
              {i === 0 ? (
                <span className="absolute left-1 top-1 z-10 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Principale
                </span>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt || ""} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/70 px-1 py-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30" aria-label="Vers la gauche">←</button>
                <button type="button" onClick={() => remove(i)} className="px-1 text-xs font-bold" aria-label="Supprimer">✕</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="px-1 disabled:opacity-30" aria-label="Vers la droite">→</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
