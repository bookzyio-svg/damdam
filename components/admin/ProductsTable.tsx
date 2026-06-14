"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/money";

type Product = {
  _id: string;
  title: string;
  brand?: string;
  price: number;
  stock?: number;
  status: string;
  images?: { url: string }[];
  category?: { _id?: string; name?: string } | null;
};

type Category = { _id: string; name: string };

/** Liste filtrable des produits (back-office). Fetch /api/products. */
export default function ProductsTable() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Liste des catégories pour le sélecteur en ligne
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((b) => setCategories(b.categories ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/products?${params.toString()}`);
    const body = await res.json();
    setItems(body.products ?? []);
    setTotal(body.pagination?.total ?? 0);
    setPages(body.pagination?.pages ?? 1);
    setSelected(new Set());
    setLoading(false);
  }, [q, status, page]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce
    return () => clearTimeout(t);
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) setItems((arr) => arr.filter((p) => p._id !== id));
  }

  // Change de statut directement depuis la liste (publication immédiate)
  async function updateStatus(id: string, status: string) {
    const prev = items;
    setItems((arr) => arr.map((p) => (p._id === id ? { ...p, status } : p))); // optimiste
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setItems(prev); // rollback si échec
  }

  const statusClass: Record<string, string> = {
    active: "border-stock/40 bg-stock/10 text-stock",
    draft: "border-line bg-surface text-muted",
    archived: "border-line bg-surface text-ink",
  };

  // Assigne une catégorie directement depuis la liste
  async function updateCategory(id: string, categoryId: string) {
    const prev = items;
    const cat = categoryId ? categories.find((c) => c._id === categoryId) : null;
    setItems((arr) => arr.map((p) => (p._id === id ? { ...p, category: cat ? { _id: cat._id, name: cat.name } : null } : p)));
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: categoryId || null }),
    });
    if (!res.ok) setItems(prev);
  }

  /* ---- Sélection multiple + actions par lot ---- */
  const allSelected = items.length > 0 && items.every((p) => selected.has(p._id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((p) => p._id)));
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function bulk(body: { status?: string; category?: string | null; action?: "delete" }) {
    const res = await fetch("/api/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), ...body }),
    });
    if (res.ok) {
      setSelected(new Set());
      load();
    }
  }

  function bulkDelete() {
    if (!confirm(`Supprimer ${selected.size} produit(s) ? Cette action est irréversible.`)) return;
    bulk({ action: "delete" });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Rechercher (titre, marque, SKU)…"
          className="grow rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-md border border-line bg-white px-3 py-2 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="draft">Brouillons</option>
          <option value="archived">Archivés</option>
        </select>
        <Link href="/admin/produits/nouveau" className="btn-brand">+ Nouveau produit</Link>
      </div>

      {/* Barre d'actions par lot */}
      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3 text-sm">
          <span className="font-semibold text-brand">{selected.size} sélectionné(s)</span>

          <select
            value=""
            onChange={(e) => { if (e.target.value) bulk({ status: e.target.value }); }}
            className="rounded-md border border-line bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Passer en…</option>
            <option value="active">Actif (en ligne)</option>
            <option value="draft">Brouillon</option>
            <option value="archived">Archivé</option>
          </select>

          <select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__none") bulk({ category: null });
              else if (v) bulk({ category: v });
            }}
            className="rounded-md border border-line bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Catégorie…</option>
            <option value="__none">— Retirer la catégorie —</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <button onClick={bulkDelete} className="font-medium text-deal hover:underline">Supprimer</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-muted hover:text-ink">Désélectionner</button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <th className="w-10 p-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-brand" aria-label="Tout sélectionner" />
              </th>
              <th className="p-3">Produit</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Statut</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted">Chargement…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted">Aucun produit.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p._id} className={`border-b border-line/60 hover:bg-surface/50 ${selected.has(p._id) ? "bg-brand/5" : ""}`}>
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleOne(p._id)} className="accent-brand" aria-label="Sélectionner" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-surface" />
                      )}
                      <div>
                        <div className="font-medium text-ink">{p.title}</div>
                        {p.brand ? <div className="text-xs text-muted">{p.brand}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <select
                      value={p.category?._id ?? ""}
                      onChange={(e) => updateCategory(p._id, e.target.value)}
                      className={`cursor-pointer rounded-md border border-line bg-white px-2 py-1 text-xs focus:border-brand focus:outline-none ${p.category?._id ? "text-ink" : "text-muted"}`}
                      title="Assigner une catégorie"
                    >
                      <option value="">— Aucune —</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 font-semibold">{formatPrice(p.price)}</td>
                  <td className="p-3">{p.stock ?? 0}</td>
                  <td className="p-3">
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p._id, e.target.value)}
                      className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold focus:outline-none ${statusClass[p.status] ?? "border-line bg-surface"}`}
                      title="Changer le statut (publication immédiate)"
                    >
                      <option value="active">Actif (en ligne)</option>
                      <option value="draft">Brouillon</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/produits/${p._id}`} className="font-medium text-brand hover:underline">Éditer</Link>
                    <button onClick={() => remove(p._id)} className="ml-3 font-medium text-deal hover:underline">Suppr.</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span>{total} produit(s)</span>
        {pages > 1 ? (
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline px-3 py-1 disabled:opacity-40">‹ Préc.</button>
            <span>Page {page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn-outline px-3 py-1 disabled:opacity-40">Suiv. ›</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
