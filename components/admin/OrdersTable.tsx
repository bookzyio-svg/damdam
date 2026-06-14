"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/money";
import { ORDER_STATUS, ORDER_STATUS_OPTIONS } from "@/lib/order-status";

type Order = {
  _id: string;
  orderNumber: string;
  paymentReference: string;
  customer?: { name?: string; email?: string };
  total: number;
  status: string;
  createdAt?: string;
};

export default function OrdersTable() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/orders?${params.toString()}`);
    const body = await res.json();
    setOrders(body.orders ?? []);
    setPages(body.pagination?.pages ?? 1);
    setTotal(body.pagination?.total ?? 0);
    setSelected(new Set());
    setLoading(false);
  }, [q, status, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o._id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(orders.map((o) => o._id)));
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function bulk(action: "confirm-payment" | "cancel" | "refund") {
    const labels = { "confirm-payment": "confirmer le paiement de", cancel: "annuler", refund: "rembourser" };
    if (!confirm(`Voulez-vous ${labels[action]} ${selected.size} commande(s) ?`)) return;
    const res = await fetch("/api/orders/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), action }),
    });
    if (res.ok) {
      setSelected(new Set());
      load();
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="N° commande, référence, email, nom…"
          className="grow rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-md border border-line bg-white px-3 py-2 text-sm">
          <option value="all">Tous les statuts</option>
          {ORDER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Barre d'actions par lot */}
      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3 text-sm">
          <span className="font-semibold text-brand">{selected.size} sélectionnée(s)</span>
          <button onClick={() => bulk("confirm-payment")} className="btn-brand px-3 py-1.5 text-xs">✓ Confirmer le paiement</button>
          <button onClick={() => bulk("cancel")} className="font-medium text-deal hover:underline">Annuler</button>
          <button onClick={() => bulk("refund")} className="font-medium text-deal hover:underline">Rembourser</button>
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
              <th className="p-3">Commande</th>
              <th className="p-3">Client</th>
              <th className="p-3">Total</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Date</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted">Chargement…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted">Aucune commande.</td></tr>
            ) : (
              orders.map((o) => {
                const st = ORDER_STATUS[o.status];
                return (
                  <tr key={o._id} className={`border-b border-line/60 hover:bg-surface/50 ${selected.has(o._id) ? "bg-brand/5" : ""}`}>
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(o._id)} onChange={() => toggleOne(o._id)} className="accent-brand" aria-label="Sélectionner" />
                    </td>
                    <td className="p-3">
                      <Link href={`/360-pilotage/commandes/${o._id}`} className="font-semibold text-brand hover:underline">{o.orderNumber}</Link>
                      <div className="font-mono text-xs text-muted">{o.paymentReference}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-ink">{o.customer?.name}</div>
                      <div className="text-xs text-muted">{o.customer?.email}</div>
                    </td>
                    <td className="p-3 font-semibold">{formatPrice(o.total)}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${st?.className ?? "bg-surface"}`}>{st?.label ?? o.status}</span>
                    </td>
                    <td className="p-3 text-muted">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-3 text-right">
                      <Link href={`/360-pilotage/commandes/${o._id}`} className="font-medium text-brand hover:underline">Détail</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span>{total} commande(s)</span>
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
