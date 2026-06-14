import { youtubeId } from "@/components/admin/DescriptionBuilder";

export type ContentBlock = {
  type: "heading" | "text" | "image" | "video";
  text?: string;
  url?: string;
  alt?: string;
  provider?: string;
};

/**
 * Rendu de la description riche (blocs texte/image/vidéo) sur la fiche produit.
 */
export default function ProductContent({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks?.length) return null;
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return (
            <h3 key={i} className="text-lg font-bold text-ink md:text-xl">
              {b.text}
            </h3>
          );
        }
        if (b.type === "text") {
          return (
            <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {b.text}
            </p>
          );
        }
        if (b.type === "image" && b.url) {
          return (
            <figure key={i} className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.url} alt={b.alt ?? ""} className="w-full rounded-xl border border-line" loading="lazy" />
              {b.alt ? <figcaption className="text-center text-xs text-muted">{b.alt}</figcaption> : null}
            </figure>
          );
        }
        if (b.type === "video" && b.url) {
          const yt = b.provider !== "file" ? youtubeId(b.url) : null;
          if (yt) {
            return (
              <div key={i} className="aspect-video w-full overflow-hidden rounded-xl border border-line">
                <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${yt}`} title="Vidéo produit" allowFullScreen loading="lazy" />
              </div>
            );
          }
          return (
            <video key={i} src={b.url} controls className="w-full rounded-xl border border-line" />
          );
        }
        return null;
      })}
    </div>
  );
}
