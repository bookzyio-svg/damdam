"use client";

import { useRef, useState } from "react";
import { Card, Field, TextInput } from "@/components/admin/ui";

type Category = {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  imageUrl?: string;
  order?: number;
};

/** Upload un fichier vers Cloudinary via /api/upload, renvoie l'URL. */
async function uploadImage(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("files", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const body = await res.json().catch(() => ({}));
  return res.ok ? body.images?.[0]?.url ?? null : null;
}

export default function CategoriesManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState("");
  const [newImage, setNewImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const rowFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), parent: newParent || null, imageUrl: newImage || "" }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { setError(body?.error || "Erreur"); return; }
    setCategories((c) => [...c, body.category]);
    setNewName(""); setNewParent(""); setNewImage("");
  }

  async function update(id: string, patch: Partial<Category>) {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = await res.json();
    if (res.ok) setCategories((c) => c.map((cat) => (cat._id === id ? body.category : cat)));
    else setError(body?.error || "Erreur");
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (res.ok) setCategories((c) => c.filter((cat) => cat._id !== id));
    else setError(body?.error || "Suppression impossible");
  }

  async function onNewFile(file: File) {
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) setNewImage(url);
    else setError("Upload échoué (vérifiez la config Cloudinary).");
  }

  async function onRowFile(id: string, file: File) {
    const url = await uploadImage(file);
    if (url) update(id, { imageUrl: url });
    else setError("Upload échoué (vérifiez la config Cloudinary).");
  }

  return (
    <div className="space-y-6">
      <Card title="Nouvelle catégorie">
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          {/* Image */}
          <div>
            <div className="mb-1 text-sm font-medium">Image</div>
            <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-md border border-line bg-surface">
              {newImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-muted">Aucune</span>
              )}
            </div>
            <input ref={newFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onNewFile(f); }} />
            <button type="button" onClick={() => newFileRef.current?.click()} className="mt-1 text-xs text-brand hover:underline">
              {uploading ? "Upload…" : newImage ? "Changer" : "Choisir"}
            </button>
          </div>

          <Field label="Nom" className="grow">
            <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="TV & Image" />
          </Field>
          <Field label="Parent (optionnel)">
            <select value={newParent} onChange={(e) => setNewParent(e.target.value)} className="rounded-md border border-line bg-white px-3 py-2 text-sm">
              <option value="">— Racine —</option>
              {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
            </select>
          </Field>
          <button type="submit" disabled={busy} className="btn-brand">{busy ? "…" : "Ajouter"}</button>
        </form>
        {error ? <p className="mt-2 text-sm text-deal">{error}</p> : null}
        <p className="mt-2 text-xs text-muted">L&apos;image s&apos;affiche sur la section « Parcourir par catégorie » de l&apos;accueil.</p>
      </Card>

      <Card title={`Catégories (${categories.length})`}>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">Aucune catégorie pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 w-20">Image</th>
                <th className="py-2">Nom</th>
                <th className="py-2">Slug</th>
                <th className="py-2">Parent</th>
                <th className="py-2 w-16">Ordre</th>
                <th className="py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id} className="border-b border-line/60">
                  <td className="py-2">
                    <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded border border-line bg-surface">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </div>
                    <input ref={(el) => { rowFileRefs.current[c._id] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onRowFile(c._id, f); }} />
                    <button onClick={() => rowFileRefs.current[c._id]?.click()} className="mt-0.5 text-[11px] text-brand hover:underline">{c.imageUrl ? "Changer" : "Ajouter"}</button>
                  </td>
                  <td className="py-2">
                    <TextInput defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && update(c._id, { name: e.target.value })} className="py-1" />
                  </td>
                  <td className="py-2 font-mono text-xs text-muted">{c.slug}</td>
                  <td className="py-2">
                    <select value={c.parent ?? ""} onChange={(e) => update(c._id, { parent: e.target.value || null })} className="rounded border border-line bg-white px-2 py-1 text-sm">
                      <option value="">— Racine —</option>
                      {categories.filter((x) => x._id !== c._id).map((x) => (<option key={x._id} value={x._id}>{x.name}</option>))}
                    </select>
                  </td>
                  <td className="py-2">
                    <TextInput type="number" defaultValue={String(c.order ?? 0)} onBlur={(e) => Number(e.target.value) !== (c.order ?? 0) && update(c._id, { order: Number(e.target.value) })} className="w-14 py-1" />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => remove(c._id)} className="text-sm font-medium text-deal hover:underline">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
