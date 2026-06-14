"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/money";

type Customer = {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  totalOrders?: number;
  totalSpent?: number;
  acceptsMarketing?: boolean;
  createdAt?: string;
};

export default function CustomersTable() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Customer[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort });
    if (q) params.set("q", q);
    const res = await fetch(`/api/customers?${params.toString()}`);
    const body = await res.json();
    setItems(body.customers ?? []);
    setPages(body.pagination?.pages ?? 1);
    setTotal(body.pagination?.total ?? 0);
    setLoading(false);
  }, [q, sort, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Rechercher (email, nom, téléphone)…"
          className="grow rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-line bg-white px-3 py-2 text-sm">
          <option value="-createdAt">Plus récents</option>
          <option value="-totalSpent">Total dépensé ↓</option>
          <option value="-totalOrders">Nb commandes ↓</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Client</th>
              <th className="p-3">Commandes</th>
              <th className="p-3">Total dépensé</th>
              <th className="p-3">Newsletter</th>
              <th className="p-3">Inscrit le</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">Chargement…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">Aucun client.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c._id} className="border-b border-line/60 hover:bg-surface/50">
                  <td className="p-3">
                    <div className="font-medium text-ink">{c.name || "—"}</div>
                    <div className="text-xs text-muted">{c.email}</div>
                  </td>
                  <td className="p-3">{c.totalOrders ?? 0}</td>
                  <td className="p-3 font-semibold">{formatPrice(c.totalSpent ?? 0)}</td>
                  <td className="p-3">{c.acceptsMarketing ? <span className="text-stock">Oui</span> : <span className="text-muted">Non</span>}</td>
                  <td className="p-3 text-muted">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="p-3 text-right">
                    <Link href={`/360-pilotage/clients/${c._id}`} className="font-medium text-brand hover:underline">Détail</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span>{total} client(s)</span>
        {pages > 1 ? (
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline px-3 py-1 disabled:opacity-40">‹</button>
            <span>{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn-outline px-3 py-1 disabled:opacity-40">›</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
