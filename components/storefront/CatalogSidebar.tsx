"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

type Facets = { brands: string[]; priceMin: number; priceMax: number };

/**
 * Sidebar de filtres du catalogue (§3) : prix, marque, note, promotions,
 * disponibilité, état. Chaque changement met à jour l'URL (filtres = état
 * partageable / SSR).
 */
export default function CatalogSidebar({ facets }: { facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [priceMin, setPriceMin] = useState(params.get("prix_min") ?? "");
  const [priceMax, setPriceMax] = useState(params.get("prix_max") ?? "");

  const navigate = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(params.toString());
      mutate(sp);
      sp.delete("page"); // reset pagination quand un filtre change
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, router],
  );

  const selectedBrands = (params.get("marque") ?? "").split(",").filter(Boolean);
  const toggleBrand = (brand: string) =>
    navigate((sp) => {
      const set = new Set(selectedBrands);
      if (set.has(brand)) set.delete(brand);
      else set.add(brand);
      if (set.size) sp.set("marque", Array.from(set).join(","));
      else sp.delete("marque");
    });

  const setParam = (key: string, value: string | null) =>
    navigate((sp) => {
      if (value === null) sp.delete(key);
      else sp.set(key, value);
    });

  const note = params.get("note");
  const etat = params.get("etat");
  const promo = params.get("promo") === "1";
  const stock = params.get("stock") === "1";

  const applyPrice = () =>
    navigate((sp) => {
      if (priceMin) sp.set("prix_min", priceMin);
      else sp.delete("prix_min");
      if (priceMax) sp.set("prix_max", priceMax);
      else sp.delete("prix_max");
    });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-line py-4">
      <h3 className="mb-2 text-sm font-bold text-ink">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="text-sm">
      <Section title="Prix (€)">
        <div className="flex items-center gap-2">
          <input type="number" min="0" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="w-full rounded border border-line px-2 py-1" />
          <span className="text-muted">—</span>
          <input type="number" min="0" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="w-full rounded border border-line px-2 py-1" />
        </div>
        <button onClick={applyPrice} className="btn-outline mt-2 w-full py-1.5 text-xs">OK</button>
        {facets.priceMax > 0 ? (
          <p className="mt-1 text-xs text-muted">de {facets.priceMin} € à {facets.priceMax} €</p>
        ) : null}
      </Section>

      {facets.brands.length ? (
        <Section title="Marque">
          <ul className="max-h-52 space-y-1 overflow-auto">
            {facets.brands.map((b) => (
              <li key={b}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="accent-brand" />
                  <span>{b}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Note client">
        <ul className="space-y-1">
          {[4, 3, 2].map((n) => (
            <li key={n}>
              <button onClick={() => setParam("note", note === String(n) ? null : String(n))} className={`flex items-center gap-1 ${note === String(n) ? "font-bold text-brand" : ""}`}>
                <span className="text-star">{"★".repeat(n)}<span className="text-line">{"★".repeat(5 - n)}</span></span>
                <span className="text-xs text-muted">& plus</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Disponibilité & promo">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={stock} onChange={() => setParam("stock", stock ? null : "1")} className="accent-brand" />
          <span>En stock uniquement</span>
        </label>
        <label className="mt-1 flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={promo} onChange={() => setParam("promo", promo ? null : "1")} className="accent-brand" />
          <span>En promotion</span>
        </label>
      </Section>

      <Section title="État">
        {["neuf", "reconditionne"].map((c) => (
          <label key={c} className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="etat" checked={etat === c} onChange={() => setParam("etat", c)} className="accent-brand" />
            <span className="capitalize">{c === "reconditionne" ? "Reconditionné" : "Neuf"}</span>
          </label>
        ))}
        {etat ? (
          <button onClick={() => setParam("etat", null)} className="mt-1 text-xs text-brand hover:underline">Réinitialiser</button>
        ) : null}
      </Section>
    </div>
  );
}
