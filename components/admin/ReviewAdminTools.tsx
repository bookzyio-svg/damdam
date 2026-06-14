"use client";

import { useState } from "react";

type ProductRef = { id: string; title: string };

/** Outils admin : ajout manuel d'un avis + import CSV en masse. */
export default function ReviewAdminTools() {
  const [tab, setTab] = useState<"none" | "add" | "import">("none");

  // Ajout simple
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductRef[]>([]);
  const [product, setProduct] = useState<ProductRef | null>(null);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("published");

  // Import
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function searchProducts() {
    if (!search.trim()) return;
    const res = await fetch(`/api/products?q=${encodeURIComponent(search)}&status=all&limit=8`);
    const b = await res.json();
    setResults((b.products ?? []).map((p: { _id: string; title: string }) => ({ id: p._id, title: p.title })));
  }

  async function addReview() {
    if (!product || !body.trim() || !author.trim()) { setMsg("Produit, nom et avis requis."); return; }
    setBusy(true); setMsg(null);
    const res = await fetch("/api/reviews/admin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: product.id, author, rating, title, body, status }),
    });
    setBusy(false);
    if (res.ok) { setMsg("✓ Avis ajouté."); setAuthor(""); setTitle(""); setBody(""); setProduct(null); setTimeout(() => location.reload(), 800); }
    else { const b = await res.json().catch(() => ({})); setMsg(b.error || "Erreur"); }
  }

  async function importCsv() {
    if (!file) return;
    setBusy(true); setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/reviews/import", { method: "POST", body: fd });
    const b = await res.json();
    setBusy(false);
    if (res.ok) { setMsg(`✓ ${b.created} avis importé(s).${b.errors?.length ? ` ${b.errors.length} erreur(s).` : ""}`); setTimeout(() => location.reload(), 1200); }
    else { setMsg(b.error || "Erreur"); }
  }

  const inputCls = "w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none";

  return (
    <div className="mb-5 rounded-xl border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab(tab === "add" ? "none" : "add")} className={`btn-outline px-3 py-1.5 text-sm ${tab === "add" ? "border-brand text-brand" : ""}`}>+ Ajouter un avis</button>
        <button onClick={() => setTab(tab === "import" ? "none" : "import")} className={`btn-outline px-3 py-1.5 text-sm ${tab === "import" ? "border-brand text-brand" : ""}`}>Importer (CSV)</button>
        {msg ? <span className="ml-auto self-center text-sm">{msg}</span> : null}
      </div>

      {tab === "add" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="mb-1 text-sm font-medium">Produit</div>
            {product ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded bg-surface px-2 py-1">{product.title}</span>
                <button onClick={() => setProduct(null)} className="text-deal">changer</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" className={inputCls} />
                  <button type="button" onClick={searchProducts} className="btn-outline px-3 py-1.5 text-sm">Chercher</button>
                </div>
                {results.length ? (
                  <ul className="mt-1 rounded-md border border-line">
                    {results.map((p) => (
                      <li key={p.id}><button onClick={() => { setProduct(p); setResults([]); }} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-surface">{p.title}</button></li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </div>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Nom du client" className={inputCls} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Note :</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="text-xl leading-none"><span className={n <= rating ? "text-star" : "text-line"}>★</span></button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (optionnel)" className={`${inputCls} sm:col-span-2`} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Avis…" className={`${inputCls} sm:col-span-2 min-h-[80px]`} />
          <div className="flex items-center gap-3 sm:col-span-2">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-line bg-white px-3 py-2 text-sm">
              <option value="published">Publié</option>
              <option value="pending">En attente</option>
            </select>
            <button onClick={addReview} disabled={busy} className="btn-brand">{busy ? "…" : "Ajouter l'avis"}</button>
          </div>
        </div>
      ) : null}

      {tab === "import" ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted">
            Fichier CSV/Excel. Colonnes : <b>produit</b> (slug ou ID), <b>auteur</b>, <b>note</b> (1-5), <b>titre</b>, <b>avis</b>, <b>statut</b> (optionnel, « published » par défaut).
          </p>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={inputCls} />
          <button onClick={importCsv} disabled={busy || !file} className="btn-brand">{busy ? "Import…" : "Importer les avis"}</button>
        </div>
      ) : null}
    </div>
  );
}
