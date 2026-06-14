"use client";

import { useCallback, useEffect, useState } from "react";

type Review = {
  _id: string;
  author?: string;
  rating: number;
  title?: string;
  body?: string;
  status: string;
  createdAt?: string;
  product?: { title?: string; slug?: string } | null;
};

const TABS = [
  { key: "pending", label: "En attente" },
  { key: "published", label: "Publiés" },
  { key: "rejected", label: "Rejetés" },
  { key: "all", label: "Tous" },
];

function Stars({ n }: { n: number }) {
  return (
    <span className="text-star" aria-label={`${n}/5`}>
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function ReviewsModeration() {
  const [tab, setTab] = useState("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const res = await fetch(`/api/reviews?status=${tab}`);
    const body = await res.json();
    setReviews(body.reviews ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(id: string, status: string) {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((r) => r.filter((x) => x._id !== id));
  }

  /* ---- Sélection + actions par lot ---- */
  const allSelected = reviews.length > 0 && reviews.every((r) => selected.has(r._id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(reviews.map((r) => r._id)));
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function bulk(body: { status?: string; action?: "delete" }) {
    if (body.action === "delete" && !confirm(`Supprimer ${selected.size} avis ?`)) return;
    const res = await fetch("/api/reviews/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), ...body }),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <nav className="mb-4 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              tab === t.key ? "border-b-2 border-brand text-brand" : "text-muted hover:text-brand"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Sélection + actions par lot */}
      {!loading && reviews.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-brand" /> Tout sélectionner
          </label>
          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-sm">
              <span className="font-semibold text-brand">{selected.size} sélectionné(s)</span>
              <button onClick={() => bulk({ status: "published" })} className="font-medium text-stock hover:underline">Publier</button>
              <button onClick={() => bulk({ status: "rejected" })} className="font-medium text-muted hover:underline">Rejeter</button>
              <button onClick={() => bulk({ action: "delete" })} className="font-medium text-deal hover:underline">Supprimer</button>
              <button onClick={() => setSelected(new Set())} className="text-muted hover:text-ink">Désélectionner</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="p-6 text-center text-muted">Chargement…</p>
      ) : reviews.length === 0 ? (
        <p className="p-6 text-center text-muted">Aucun avis.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className={`rounded-xl border border-line bg-white p-4 shadow-sm ${selected.has(r._id) ? "ring-2 ring-brand/30" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selected.has(r._id)} onChange={() => toggleOne(r._id)} className="mt-1 accent-brand" aria-label="Sélectionner" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Stars n={r.rating} />
                      <span className="font-semibold text-ink">{r.title || "(sans titre)"}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink">{r.body}</p>
                    <p className="mt-2 text-xs text-muted">
                      Par {r.author || "Anonyme"} · {r.product?.title ?? "Produit supprimé"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded bg-surface px-2 py-0.5 text-xs font-medium">{r.status}</span>
              </div>
              <div className="mt-3 flex gap-3 border-t border-line pt-3 text-sm">
                {r.status !== "published" ? (
                  <button onClick={() => moderate(r._id, "published")} className="font-medium text-stock hover:underline">Publier</button>
                ) : null}
                {r.status !== "rejected" ? (
                  <button onClick={() => moderate(r._id, "rejected")} className="font-medium text-muted hover:underline">Rejeter</button>
                ) : null}
                <button onClick={() => remove(r._id)} className="ml-auto font-medium text-deal hover:underline">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
