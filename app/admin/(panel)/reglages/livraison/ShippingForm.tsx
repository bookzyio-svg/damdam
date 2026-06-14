"use client";

import { useState } from "react";
import { Card, Field, TextInput, SaveBar } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettingsForm";
import { eurosToCents, centsToEurosInput } from "@/lib/utils/money";
import { SHIPPING_COUNTRIES } from "@/components/storefront/AddressFields";

type Zone = { name: string; postalCodePrefixes: string[]; cost: number; estimatedDays: string };
type CountryRate = { country: string; cost: number; estimatedDays?: string };
type Shipping = {
  freeShippingThreshold?: number;
  flatRate?: number;
  zones?: Zone[];
  countryRates?: CountryRate[];
};

type ZoneInput = { name: string; prefixes: string; cost: string; estimatedDays: string };
type CountryInput = { country: string; cost: string; estimatedDays: string };

const FOREIGN_COUNTRIES = SHIPPING_COUNTRIES.filter((c) => c.name !== "France");

export default function ShippingForm({ initial }: { initial: Shipping }) {
  const { saving, status, submit } = useSettingsForm("shipping");
  const [freeThreshold, setFreeThreshold] = useState(centsToEurosInput(initial.freeShippingThreshold));
  const [flatRate, setFlatRate] = useState(centsToEurosInput(initial.flatRate));
  const [zones, setZones] = useState<ZoneInput[]>(
    (initial.zones ?? []).map((z) => ({
      name: z.name,
      prefixes: (z.postalCodePrefixes ?? []).join(", "),
      cost: centsToEurosInput(z.cost),
      estimatedDays: z.estimatedDays ?? "",
    })),
  );
  const [countryRates, setCountryRates] = useState<CountryInput[]>(
    (initial.countryRates ?? []).map((c) => ({
      country: c.country,
      cost: centsToEurosInput(c.cost),
      estimatedDays: c.estimatedDays ?? "",
    })),
  );

  const updateZone = (i: number, patch: Partial<ZoneInput>) =>
    setZones((zs) => zs.map((z, idx) => (idx === i ? { ...z, ...patch } : z)));
  const addZone = () => setZones((zs) => [...zs, { name: "", prefixes: "", cost: "0.00", estimatedDays: "" }]);
  const removeZone = (i: number) => setZones((zs) => zs.filter((_, idx) => idx !== i));

  const updateRate = (i: number, patch: Partial<CountryInput>) =>
    setCountryRates((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addRate = () =>
    setCountryRates((cs) => [...cs, { country: FOREIGN_COUNTRIES[0]?.name ?? "", cost: "0.00", estimatedDays: "" }]);
  const removeRate = (i: number) => setCountryRates((cs) => cs.filter((_, idx) => idx !== i));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit({
      freeShippingThreshold: eurosToCents(freeThreshold),
      flatRate: eurosToCents(flatRate),
      zones: zones
        .filter((z) => z.name.trim())
        .map((z) => ({
          name: z.name.trim(),
          postalCodePrefixes: z.prefixes.split(",").map((p) => p.trim()).filter(Boolean),
          cost: eurosToCents(z.cost),
          estimatedDays: z.estimatedDays.trim(),
        })),
      countryRates: countryRates
        .filter((c) => c.country.trim())
        .map((c) => ({ country: c.country.trim(), cost: eurosToCents(c.cost), estimatedDays: c.estimatedDays.trim() })),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card title="Frais de port (France)" description="Tarif par défaut et seuil de livraison gratuite (en euros).">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tarif forfaitaire (€)" htmlFor="flatRate">
            <TextInput id="flatRate" type="number" step="0.01" min="0" value={flatRate} onChange={(e) => setFlatRate(e.target.value)} />
          </Field>
          <Field label="Livraison gratuite à partir de (€)" htmlFor="freeThreshold" hint="0 = pas de seuil de gratuité (France).">
            <TextInput id="freeThreshold" type="number" step="0.01" min="0" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} />
          </Field>
        </div>
      </Card>

      <div className="mt-6">
        <Card title="Zones de livraison (France)" description="Surcoût par zone selon le préfixe de code postal (ex. Corse, DOM).">
          <div className="space-y-3">
            {zones.length === 0 ? (
              <p className="text-sm text-muted">Aucune zone : le tarif forfaitaire s&apos;applique partout en France.</p>
            ) : null}
            {zones.map((z, i) => (
              <div key={i} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-12">
                <div className="sm:col-span-3"><TextInput placeholder="Nom (ex. Corse)" value={z.name} onChange={(e) => updateZone(i, { name: e.target.value })} /></div>
                <div className="sm:col-span-4"><TextInput placeholder="Préfixes CP : 20, 2A, 2B" value={z.prefixes} onChange={(e) => updateZone(i, { prefixes: e.target.value })} /></div>
                <div className="sm:col-span-2"><TextInput type="number" step="0.01" min="0" placeholder="Coût €" value={z.cost} onChange={(e) => updateZone(i, { cost: e.target.value })} /></div>
                <div className="sm:col-span-2"><TextInput placeholder="Délai (3-5 j)" value={z.estimatedDays} onChange={(e) => updateZone(i, { estimatedDays: e.target.value })} /></div>
                <div className="flex items-center sm:col-span-1"><button type="button" onClick={() => removeZone(i)} className="text-sm font-medium text-deal hover:underline">Suppr.</button></div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addZone} className="btn-outline mt-3 px-3 py-1.5 text-sm">+ Ajouter une zone</button>
        </Card>
      </div>

      <div className="mt-6">
        <Card
          title="Tarifs par pays (hors France)"
          description="Forfait de livraison appliqué pour chaque pays étranger. Sans tarif défini, le tarif forfaitaire France s'applique."
        >
          <div className="space-y-3">
            {countryRates.length === 0 ? (
              <p className="text-sm text-muted">Aucun tarif international défini.</p>
            ) : null}
            {countryRates.map((c, i) => (
              <div key={i} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <select
                    value={c.country}
                    onChange={(e) => updateRate(i, { country: e.target.value })}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                  >
                    {FOREIGN_COUNTRIES.map((fc) => (
                      <option key={fc.code} value={fc.name}>{fc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3"><TextInput type="number" step="0.01" min="0" placeholder="Coût €" value={c.cost} onChange={(e) => updateRate(i, { cost: e.target.value })} /></div>
                <div className="sm:col-span-3"><TextInput placeholder="Délai (5-10 j)" value={c.estimatedDays} onChange={(e) => updateRate(i, { estimatedDays: e.target.value })} /></div>
                <div className="flex items-center sm:col-span-1"><button type="button" onClick={() => removeRate(i)} className="text-sm font-medium text-deal hover:underline">Suppr.</button></div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRate} className="btn-outline mt-3 px-3 py-1.5 text-sm">+ Ajouter un pays</button>
          <SaveBar saving={saving} status={status} />
        </Card>
      </div>
    </form>
  );
}
