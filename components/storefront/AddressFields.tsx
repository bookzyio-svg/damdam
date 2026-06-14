"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pays de livraison — France en premier (défaut), puis le reste de l'Europe
 * par ordre alphabétique. Le payeur peut très bien être en France et faire
 * livrer ailleurs (paiement par virement, indépendant du pays du payeur).
 */
export const SHIPPING_COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "DE", name: "Allemagne" },
  { code: "AT", name: "Autriche" },
  { code: "BE", name: "Belgique" },
  { code: "BG", name: "Bulgarie" },
  { code: "CY", name: "Chypre" },
  { code: "HR", name: "Croatie" },
  { code: "DK", name: "Danemark" },
  { code: "ES", name: "Espagne" },
  { code: "EE", name: "Estonie" },
  { code: "FI", name: "Finlande" },
  { code: "GR", name: "Grèce" },
  { code: "HU", name: "Hongrie" },
  { code: "IE", name: "Irlande" },
  { code: "IS", name: "Islande" },
  { code: "IT", name: "Italie" },
  { code: "LV", name: "Lettonie" },
  { code: "LT", name: "Lituanie" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malte" },
  { code: "MC", name: "Monaco" },
  { code: "NO", name: "Norvège" },
  { code: "NL", name: "Pays-Bas" },
  { code: "PL", name: "Pologne" },
  { code: "PT", name: "Portugal" },
  { code: "CZ", name: "République tchèque" },
  { code: "RO", name: "Roumanie" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "SK", name: "Slovaquie" },
  { code: "SI", name: "Slovénie" },
  { code: "SE", name: "Suède" },
  { code: "CH", name: "Suisse" },
];

type Values = { line1: string; line2: string; postalCode: string; city: string; country: string };
type Suggestion = { city: string; postcode: string };

/**
 * Champs d'adresse de livraison : pays en liste déroulante (Europe francophone),
 * ville en autocomplétion (API Base Adresse Nationale pour la France, qui
 * remplit aussi le code postal). Pour les autres pays, saisie libre.
 */
export default function AddressFields({
  values,
  set,
  inputCls,
}: {
  values: Values;
  set: (k: keyof Values, v: string) => void;
  inputCls: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFrance = values.country === "France";

  // Autocomplétion ville via la Base Adresse Nationale (France, gratuit, sans clé)
  useEffect(() => {
    if (!isFrance || values.city.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(values.city)}&type=municipality&autocomplete=1&limit=6`,
        );
        const data = await res.json();
        const list: Suggestion[] = (data.features ?? []).map((f: { properties: { city?: string; name?: string; postcode?: string } }) => ({
          city: f.properties.city || f.properties.name || "",
          postcode: f.properties.postcode || "",
        }));
        // Dédoublonne par ville+CP
        const seen = new Set<string>();
        setSuggestions(list.filter((s) => s.city && !seen.has(s.city + s.postcode) && seen.add(s.city + s.postcode)));
      } catch {
        setSuggestions([]);
      }
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.city, isFrance]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input required placeholder="Adresse" value={values.line1} onChange={(e) => set("line1", e.target.value)} className={`${inputCls} sm:col-span-2`} />
      <input placeholder="Complément (optionnel)" value={values.line2} onChange={(e) => set("line2", e.target.value)} className={`${inputCls} sm:col-span-2`} />

      {/* Pays — liste déroulante */}
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted">Pays de livraison</label>
        <select
          value={values.country}
          onChange={(e) => set("country", e.target.value)}
          className={inputCls}
        >
          {SHIPPING_COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <input required placeholder="Code postal" value={values.postalCode} onChange={(e) => set("postalCode", e.target.value)} className={inputCls} />

      {/* Ville — autocomplétion (France) */}
      <div className="relative">
        <input
          required
          placeholder="Ville"
          value={values.city}
          onChange={(e) => { set("city", e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
          className={inputCls}
        />
        {open && isFrance && suggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-line bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    set("city", s.city);
                    if (s.postcode) set("postalCode", s.postcode);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface"
                >
                  <span>{s.city}</span>
                  <span className="text-xs text-muted">{s.postcode}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
