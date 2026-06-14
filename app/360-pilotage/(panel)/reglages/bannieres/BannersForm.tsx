"use client";

import { useRef, useState } from "react";
import { Card, Field, TextInput, SaveBar } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettingsForm";

type Banner = {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
};

/**
 * Gestion des bannières du carrousel d'accueil. Chaque bannière = une image
 * (uploadée sur Cloudinary) + titre/sous-titre/CTA optionnels. Ordre = ordre
 * d'affichage. Recommandé : images larges ~1600×500.
 */
export default function BannersForm({ initial }: { initial: Banner[] }) {
  const { saving, status, submit } = useSettingsForm("homeBanners");
  const [banners, setBanners] = useState<Banner[]>(initial.length ? initial : []);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const update = (i: number, patch: Partial<Banner>) =>
    setBanners((arr) => arr.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const add = () => setBanners((arr) => [...arr, { imageUrl: "", title: "", subtitle: "", ctaText: "", ctaHref: "" }]);
  const remove = (i: number) => setBanners((arr) => arr.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setBanners((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const copy = [...arr];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  async function upload(i: number, file: File) {
    setUploadingIdx(i);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = await res.json();
      if (res.ok && body.images?.[0]?.url) update(i, { imageUrl: body.images[0].url });
    } finally {
      setUploadingIdx(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(banners.filter((b) => b.imageUrl || b.title));
      }}
    >
      <Card
        title="Bannières d'accueil (carrousel)"
        description="Images larges recommandées (~1600×500). Elles défilent automatiquement sur la page d'accueil."
      >
        <div className="space-y-4">
          {banners.length === 0 ? (
            <p className="text-sm text-muted">Aucune bannière. Sans bannière, une bannière par défaut est affichée.</p>
          ) : null}

          {banners.map((b, i) => (
            <div key={i} className="rounded-lg border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">Bannière {i + 1}</span>
                <div className="flex items-center gap-2 text-sm">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-muted hover:text-brand disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === banners.length - 1} className="px-1 text-muted hover:text-brand disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => remove(i)} className="font-medium text-deal hover:underline">Suppr.</button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Image */}
                <div>
                  <div className="mb-1 text-sm font-medium">Image</div>
                  <div className="flex aspect-[16/6] items-center justify-center overflow-hidden rounded-md border border-line bg-surface">
                    {b.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted">Aucune image</span>
                    )}
                  </div>
                  <input
                    ref={(el) => { fileRefs.current[i] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(i, f); }}
                  />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => fileRefs.current[i]?.click()} className="btn-outline px-3 py-1.5 text-sm">
                      {uploadingIdx === i ? "Upload…" : "Choisir une image"}
                    </button>
                    {b.imageUrl ? <button type="button" onClick={() => update(i, { imageUrl: "" })} className="text-sm text-deal hover:underline">Retirer</button> : null}
                  </div>
                </div>

                {/* Textes */}
                <div className="space-y-3">
                  <Field label="Titre (optionnel)"><TextInput value={b.title ?? ""} onChange={(e) => update(i, { title: e.target.value })} /></Field>
                  <Field label="Sous-titre (optionnel)"><TextInput value={b.subtitle ?? ""} onChange={(e) => update(i, { subtitle: e.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Texte du bouton"><TextInput value={b.ctaText ?? ""} onChange={(e) => update(i, { ctaText: e.target.value })} placeholder="Voir l'offre" /></Field>
                    <Field label="Lien du bouton"><TextInput value={b.ctaHref ?? ""} onChange={(e) => update(i, { ctaHref: e.target.value })} placeholder="/c/promotions" /></Field>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={add} className="btn-outline mt-4 px-3 py-1.5 text-sm">+ Ajouter une bannière</button>
        <SaveBar saving={saving} status={status} />
      </Card>
    </form>
  );
}
