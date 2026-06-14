"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/money";

type Promo = {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  freeShipping?: boolean;
  usedCount?: number;
  maxUses?: number | null;
  active?: boolean;
  expiresAt?: string | null;
};

export default function PromoList({ initial }: { initial: Promo[] }) {
  const [codes, setCodes] = useState<Promo[]>(initial);

  async function remove(id: string) {
    if (!confirm("Supprimer ce code promo ?")) return;
    const res = await fetch(`/api/promo-codes/${id}`, { method: "DELETE" });
    if (res.ok) setCodes((c) => c.filter((x) => x._id !== id));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <th className="p-3">Code</th>
            <th className="p-3">Réduction</th>
            <th className="p-3">Utilisations</th>
            <th className="p-3">Validité</th>
            <th className="p-3">Statut</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {codes.length === 0 ? (
            <tr><td colSpan={6} className="p-6 text-center text-muted">Aucun code promo.</td></tr>
          ) : (
            codes.map((c) => (
              <tr key={c._id} className="border-b border-line/60 hover:bg-surface/50">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">
                  {c.type === "percentage" ? `${c.value} %` : formatPrice(c.value)}
                  {c.freeShipping ? <span className="ml-1 text-xs text-stock">+ port offert</span> : null}
                </td>
                <td className="p-3">{c.usedCount ?? 0}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                <td className="p-3 text-muted">{c.expiresAt ? `jusqu'au ${new Date(c.expiresAt).toLocaleDateString("fr-FR")}` : "—"}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${c.active ? "bg-stock/15 text-stock" : "bg-surface text-muted"}`}>
                    {c.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Link href={`/360-pilotage/codes-promo/${c._id}`} className="font-medium text-brand hover:underline">Éditer</Link>
                  <button onClick={() => remove(c._id)} className="ml-3 font-medium text-deal hover:underline">Suppr.</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
