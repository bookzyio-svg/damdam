"use client";

import { useRef, useState } from "react";
import { Type, Heading, Image as ImageIcon, Video, ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";

export type ContentBlock = {
  type: "heading" | "text" | "image" | "video";
  text?: string;
  url?: string;
  publicId?: string;
  alt?: string;
  provider?: "file" | "youtube" | "";
};

/** Extrait l'ID YouTube d'une URL (watch, youtu.be, shorts, embed). */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/**
 * Éditeur de description riche en blocs (texte, image, vidéo), réordonnables.
 * Les images/vidéos sont uploadées sur Cloudinary via /api/upload ; les vidéos
 * peuvent aussi être un simple lien YouTube.
 */
export default function DescriptionBuilder({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[];
  onChange: (b: ContentBlock[]) => void;
}) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<ContentBlock>) =>
    onChange(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const copy = [...blocks];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  const add = (block: ContentBlock) => onChange([...blocks, block]);

  async function uploadMedia(i: number, file: File | undefined, kind: "image" | "video") {
    if (!file) return;
    setError(null);
    setUploadingIdx(i);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Échec de l'upload");
      const up = body.images?.[0];
      if (up) update(i, { url: up.url, publicId: up.publicId, provider: kind === "video" ? "file" : undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload");
    } finally {
      setUploadingIdx(null);
    }
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface p-4 text-center text-sm text-muted">
          Construisez une description visuelle : ajoutez du texte, des images et des vidéos.
        </p>
      ) : null}

      {blocks.map((b, i) => (
        <div key={i} className="rounded-lg border border-line bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              {b.type === "heading" ? <Heading className="h-3.5 w-3.5" /> : b.type === "text" ? <Type className="h-3.5 w-3.5" /> : b.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
              {b.type === "heading" ? "Titre" : b.type === "text" ? "Texte" : b.type === "image" ? "Image" : "Vidéo"}
            </span>
            <div className="flex items-center gap-1 text-muted">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-surface disabled:opacity-30" title="Monter"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="rounded p-1 hover:bg-surface disabled:opacity-30" title="Descendre"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => remove(i)} className="rounded p-1 text-deal hover:bg-deal/10" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>

          {b.type === "heading" ? (
            <input
              value={b.text ?? ""}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="Titre de section…"
              className="w-full rounded-md border border-line px-3 py-2 text-base font-bold focus:border-brand focus:outline-none"
            />
          ) : null}

          {b.type === "text" ? (
            <textarea
              value={b.text ?? ""}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="Votre paragraphe…"
              className="min-h-[90px] w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          ) : null}

          {b.type === "image" ? (
            <div className="space-y-2">
              {b.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={b.url} alt={b.alt ?? ""} className="max-h-60 w-full rounded-md border border-line object-contain" />
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <MediaPicker accept="image/*" loading={uploadingIdx === i} onPick={(f) => uploadMedia(i, f, "image")} label={b.url ? "Remplacer l'image" : "Téléverser une image"} />
              </div>
              <input
                value={b.alt ?? ""}
                onChange={(e) => update(i, { alt: e.target.value })}
                placeholder="Légende / texte alternatif (optionnel)"
                className="w-full rounded-md border border-line px-3 py-1.5 text-xs focus:border-brand focus:outline-none"
              />
            </div>
          ) : null}

          {b.type === "video" ? (
            <div className="space-y-2">
              {b.url && b.provider !== "file" && youtubeId(b.url) ? (
                <div className="aspect-video w-full overflow-hidden rounded-md border border-line">
                  <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${youtubeId(b.url)}`} title="Aperçu vidéo" allowFullScreen />
                </div>
              ) : b.url && b.provider === "file" ? (
                <video src={b.url} controls className="max-h-60 w-full rounded-md border border-line" />
              ) : null}
              <input
                value={b.provider === "file" ? "" : b.url ?? ""}
                onChange={(e) => update(i, { url: e.target.value, provider: "youtube", publicId: "" })}
                placeholder="Collez un lien YouTube…"
                className="w-full rounded-md border border-line px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
              />
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
              </div>
              <MediaPicker accept="video/*" loading={uploadingIdx === i} onPick={(f) => uploadMedia(i, f, "video")} label={b.provider === "file" && b.url ? "Remplacer la vidéo" : "Téléverser une vidéo (mp4, max 64 Mo)"} />
            </div>
          ) : null}
        </div>
      ))}

      {error ? <p className="text-sm text-deal">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => add({ type: "heading", text: "" })} className="btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Heading className="h-4 w-4" /> Titre
        </button>
        <button type="button" onClick={() => add({ type: "text", text: "" })} className="btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Type className="h-4 w-4" /> Texte
        </button>
        <button type="button" onClick={() => add({ type: "image", url: "", alt: "" })} className="btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <ImageIcon className="h-4 w-4" /> Image
        </button>
        <button type="button" onClick={() => add({ type: "video", url: "", provider: "" })} className="btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Video className="h-4 w-4" /> Vidéo
        </button>
      </div>
    </div>
  );
}

function MediaPicker({
  accept,
  loading,
  onPick,
  label,
}: {
  accept: string;
  loading: boolean;
  onPick: (file: File | undefined) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={loading}
        className="btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Téléversement…" : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }}
      />
    </>
  );
}
