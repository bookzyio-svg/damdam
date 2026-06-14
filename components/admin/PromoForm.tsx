"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, TextInput, Toggle, SaveBar } from "@/components/admin/ui";
import { eurosToCents, centsToEurosInput } from "@/lib/utils/money";

type Category = { _id: string; name: string };
type ProductRef = { id: string; title: string };

export type PromoInitial = {
  _id?: string;
  code?: string;
  description?: string;
  type?: "percentage" | "fixed";
  value?: number;
  freeShipping?: boolean;
  minOrderAmount?: number;
  appliesTo?: "all" | "categories" | "products";
  categoryIds?: string[];
  maxUses?: number | null;
  perCustomerLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
};

const dateInput = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : "");

export default function PromoForm({
  initial = {},
  categories,
  initialProducts = [],
}: {
  initial?: PromoInitial;
  categories: Category[];
  initialProducts?: ProductRef[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial._id);

  const [code, setCode] = useState(initial.code ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [type, setType] = useState<"percentage" | "fixed">(initial.type ?? "percentage");
  const [value, setValue] = useState(
    initial.value != null ? (initial.type === "fixed" ? centsToEurosInput(initial.value) : String(initial.value)) : "",
  );
  const [freeShipping, setFreeShipping] = useState(initial.freeShipping ?? false);
  const [minOrder, setMinOrder] = useState(initial.minOrderAmount ? centsToEurosInput(initial.minOrderAmount) : "");
  const [appliesTo, setAppliesTo] = useState<"all" | "categories" | "products">(initial.appliesTo ?? "all");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial.categoryIds ?? []);
  const [products, setProducts] = useState<ProductRef[]>(initialProducts);
  const [maxUses, setMaxUses] = useState(initial.maxUses != null ? String(initial.maxUses) : "");
  const [perCustomer, setPerCustomer] = useState(initial.perCustomerLimit != null ? String(initial.perCustomerLimit) : "");
  const [startsAt, setStartsAt] = useState(dateInput(initial.startsAt));
  const [expiresAt, setExpiresAt] = useState(dateInput(initial.expiresAt));
  const [active, setActive] = useState(initial.active ?? true);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductRef[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; message?: string }>({ type: "idle" });

  const toggleCategory = (id: string) =>
    setCategoryIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));

  async function searchProducts() {
    if (!search.trim()) return;
    const res = await fetch(`/api/products?q=${encodeURIComponent(search)}&status=all&limit=8`);
    const body = await res.json();
    setResults((body.products ?? []).map((p: { _id: string; title: string }) => ({ id: p._id, title: p.title })));
  }
  const addProduct = (p: ProductRef) => {
    if (!products.some((x) => x.id === p.id)) setProducts((arr) => [...arr, p]);
    setResults([]);
    setSearch("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "idle" });

    const payload = {
      code,
      description,
      type,
      value: type === "fixed" ? eurosToCents(value) : Number(value) || 0,
      freeShipping,
      minOrderAmount: minOrder ? eurosToCents(minOrder) : 0,
      appliesTo,
      categoryIds: appliesTo === "categories" ? categoryIds : [],
      productIds: appliesTo === "products" ? products.map((p) => p.id) : [],
      maxUses: maxUses ? Number(maxUses) : null,
      perCustomerLimit: perCustomer ? Number(perCustomer) : null,
      startsAt: startsAt || null,
      expiresAt: expiresAt || null,
      active,
    };

    const url = isEdit ? `/api/promo-codes/${initial._id}` : "/api/promo-codes";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setStatus({ type: "error", message: body.error || "Erreur" });
      return;
    }
    if (isEdit) {
      setStatus({ type: "ok", message: "Code enregistré" });
      router.refresh();
    } else {
      router.push("/360-pilotage/codes-promo");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <Card title="Code promo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="code" hint="Affiché et saisi au checkout.">
            <TextInput id="code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="font-mono uppercase" />
          </Field>
          <Field label="Statut" htmlFor="active">
            <div className="pt-2"><Toggle checked={active} onChange={setActive} label={active ? "Actif" : "Inactif"} /></div>
          </Field>
          <Field label="Description (interne)" htmlFor="desc" className="sm:col-span-2">
            <TextInput id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Réduction">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as never)} className="w-full rounded-md border border-line px-3 py-2 text-sm">
              <option value="percentage">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (€)</option>
            </select>
          </Field>
          <Field label={type === "percentage" ? "Valeur (%)" : "Valeur (€)"}>
            <TextInput type="number" step={type === "percentage" ? "1" : "0.01"} min="0" required value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Field label="Montant minimum de commande (€)">
            <TextInput type="number" step="0.01" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </Field>
          <Field label="Livraison offerte">
            <div className="pt-2"><Toggle checked={freeShipping} onChange={setFreeShipping} label="Oui" /></div>
          </Field>
        </div>
      </Card>

      <Card title="Ciblage">
        <Field label="S'applique à">
          <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as never)} className="w-full rounded-md border border-line px-3 py-2 text-sm">
            <option value="all">Toute la boutique</option>
            <option value="categories">Catégories spécifiques</option>
            <option value="products">Produits spécifiques</option>
          </select>
        </Field>

        {appliesTo === "categories" ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <label key={c._id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={categoryIds.includes(c._id)} onChange={() => toggleCategory(c._id)} className="accent-brand" />
                {c.name}
              </label>
            ))}
            {categories.length === 0 ? <p className="text-sm text-muted">Aucune catégorie.</p> : null}
          </div>
        ) : null}

        {appliesTo === "products" ? (
          <div className="mt-3">
            <div className="flex gap-2">
              <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" />
              <button type="button" onClick={searchProducts} className="btn-outline px-3 py-1.5 text-sm">Chercher</button>
            </div>
            {results.length ? (
              <ul className="mt-2 rounded-md border border-line">
                {results.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => addProduct(p)} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-surface">{p.title}</button>
                  </li>
                ))}
              </ul>
            ) : null}
            {products.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {products.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs">
                    {p.title}
                    <button type="button" onClick={() => setProducts((arr) => arr.filter((x) => x.id !== p.id))} className="text-deal">✕</button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card title="Limites & validité">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Utilisations max (total)" hint="Vide = illimité">
            <TextInput type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </Field>
          <Field label="Limite par client" hint="Vide = illimité">
            <TextInput type="number" min="1" value={perCustomer} onChange={(e) => setPerCustomer(e.target.value)} />
          </Field>
          <Field label="Début (optionnel)">
            <TextInput type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </Field>
          <Field label="Fin (optionnel)">
            <TextInput type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>
        </div>
        <SaveBar saving={saving} status={status} />
      </Card>
    </form>
  );
}
