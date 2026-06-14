"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import CatalogSidebar from "@/components/storefront/CatalogSidebar";

type Facets = { brands: string[]; priceMin: number; priceMax: number };

const SORTS = [
  { value: "popularite", label: "Popularité" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "nouveautes", label: "Nouveautés" },
  { value: "note", label: "Meilleures notes" },
];

const CHIP_LABELS: Record<string, (v: string) => string> = {
  prix_min: (v) => `Min ${v} €`,
  prix_max: (v) => `Max ${v} €`,
  note: (v) => `${v}★ & plus`,
  promo: () => "En promo",
  stock: () => "En stock",
  etat: (v) => (v === "reconditionne" ? "Reconditionné" : "Neuf"),
};

/** Barre de tri + puces de filtres actifs + bouton Filtres (mobile). */
export default function CatalogToolbar({ total, facets }: { total: number; facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const setParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (value === null) sp.delete(key);
    else sp.set(key, value);
    if (key !== "page") sp.delete("page");
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const removeChip = (key: string, value?: string) => {
    if (key === "marque" && value) {
      const set = new Set((params.get("marque") ?? "").split(",").filter(Boolean));
      set.delete(value);
      setParam("marque", set.size ? Array.from(set).join(",") : null);
    } else {
      setParam(key, null);
    }
  };

  // Construit la liste des puces actives
  const chips: { key: string; value?: string; label: string }[] = [];
  for (const [key, render] of Object.entries(CHIP_LABELS)) {
    const v = params.get(key);
    if (v) chips.push({ key, label: render(v) });
  }
  for (const b of (params.get("marque") ?? "").split(",").filter(Boolean)) {
    chips.push({ key: "marque", value: b, label: b });
  }

  const sort = params.get("tri") ?? "popularite";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm lg:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filtres
        </button>
        <span className="text-sm text-muted">{total} produit{total > 1 ? "s" : ""}</span>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted">Trier&nbsp;:</span>
          <select value={sort} onChange={(e) => setParam("tri", e.target.value)} className="rounded-md border border-line bg-white px-2 py-1.5">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {chips.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={`${c.key}-${c.value ?? ""}`}
              onClick={() => removeChip(c.key, c.value)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium hover:border-deal hover:text-deal"
            >
              {c.label} <span aria-hidden>✕</span>
            </button>
          ))}
          <button onClick={() => router.push(pathname)} className="text-xs font-medium text-brand hover:underline">
            Tout effacer
          </button>
        </div>
      ) : null}

      {/* Panneau coulissant mobile */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-auto bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-bold">Filtres</span>
              <button onClick={() => setMobileOpen(false)} className="text-2xl leading-none text-muted">×</button>
            </div>
            <CatalogSidebar facets={facets} />
            <button onClick={() => setMobileOpen(false)} className="btn-brand mt-4 w-full">Voir les résultats</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
