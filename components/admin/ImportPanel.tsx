"use client";

import { useState } from "react";
import Link from "next/link";

type Created = { id: string; title: string };
type Result = { ok?: boolean; error?: string; count?: number; found?: number; format?: string; created?: Created[]; errors?: string[] };

const TABS = [
  { key: "csv", label: "CSV / Excel" },
  { key: "url", label: "Lien (Shopify/Woo/site)" },
  { key: "aliexpress", label: "AliExpress" },
];

export default function ImportPanel() {
  const [tab, setTab] = useState("csv");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // champs
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [aliInput, setAliInput] = useState("");

  // réécriture
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rewriteMsg, setRewriteMsg] = useState<string | null>(null);

  function reset() {
    setResult(null);
    setSelected(new Set());
    setRewriteMsg(null);
  }

  async function importCsv() {
    if (!file) return;
    setBusy(true); reset();
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    setResult(await res.json());
    setBusy(false);
  }
  async function importUrl() {
    if (!url) return;
    setBusy(true); reset();
    const res = await fetch("/api/import/url", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, useAI }),
    });
    setResult(await res.json());
    setBusy(false);
  }
  async function importAli() {
    if (!aliInput) return;
    setBusy(true); reset();
    const res = await fetch("/api/import/aliexpress", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: aliInput }),
    });
    setResult(await res.json());
    setBusy(false);
  }

  const created = result?.created ?? [];
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const selectAll = () => setSelected(new Set(created.map((c) => c.id)));

  async function rewrite() {
    if (selected.size === 0) return;
    setBusy(true); setRewriteMsg(null);
    const res = await fetch("/api/import/rewrite", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: Array.from(selected) }),
    });
    const body = await res.json();
    setBusy(false);
    setRewriteMsg(res.ok ? `✓ ${body.rewritten} fiche(s) réécrite(s) par l'IA.` : (body.error || "Erreur"));
  }

  const inputCls = "w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none";

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); reset(); }} className={`rounded-t-md px-3 py-2 text-sm font-medium ${tab === t.key ? "border-b-2 border-brand text-brand" : "text-muted hover:text-brand"}`}>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="rounded-lg border border-line bg-white p-6">
        {tab === "csv" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Importez un fichier <b>.csv</b> ou <b>.xlsx</b>. Les exports <b>Shopify</b> et <b>WooCommerce</b> sont reconnus automatiquement (sinon : titre + prix requis).</p>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={inputCls} />
            <button onClick={importCsv} disabled={busy || !file} className="btn-brand">{busy ? "Import…" : "Importer le fichier"}</button>
          </div>
        ) : null}

        {tab === "url" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Collez l&apos;URL d&apos;une boutique Shopify/WooCommerce ou d&apos;une fiche produit. Le système lit le flux <code>products.json</code>, la Store API, ou les données structurées (JSON-LD / Open Graph).</p>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemple.com/products/mon-produit" className={inputCls} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} className="accent-brand" />
              Activer l&apos;extraction IA en secours (Gemini)
            </label>
            <button onClick={importUrl} disabled={busy || !url} className="btn-brand">{busy ? "Import…" : "Importer depuis l'URL"}</button>
          </div>
        ) : null}

        {tab === "aliexpress" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Collez un <b>lien</b> ou un <b>ID</b> produit AliExpress (API officielle dropshipping). Nécessite les clés <code>ALIEXPRESS_APP_KEY/SECRET</code>.</p>
            <input value={aliInput} onChange={(e) => setAliInput(e.target.value)} placeholder="https://aliexpress.com/item/100500…html ou 100500…" className={inputCls} />
            <button onClick={importAli} disabled={busy || !aliInput} className="btn-brand">{busy ? "Import…" : "Importer depuis AliExpress"}</button>
          </div>
        ) : null}
      </div>

      {/* Résultat */}
      {result ? (
        <div className="mt-6 rounded-lg border border-line bg-white p-6">
          {result.error ? (
            <p className="rounded bg-deal-soft p-3 text-sm text-deal">⚠️ {result.error}</p>
          ) : (
            <>
              <p className="font-semibold text-stock">
                ✓ {result.count ?? created.length} produit(s) importé(s) en brouillon
                {result.format ? <span className="ml-1 text-muted">(format {result.format})</span> : null}
              </p>
              {result.errors?.length ? (
                <ul className="mt-2 space-y-1 text-xs text-deal">
                  {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              ) : null}

              {created.length ? (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Réécriture IA (anti-contenu dupliqué)</span>
                    <button onClick={selectAll} className="text-xs text-brand hover:underline">Tout sélectionner</button>
                  </div>
                  <ul className="max-h-48 space-y-1 overflow-auto rounded border border-line p-2">
                    {created.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="accent-brand" />
                        <Link href={`/admin/produits/${c.id}`} className="text-brand hover:underline">{c.title}</Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={rewrite} disabled={busy || selected.size === 0} className="btn-outline">Réécrire {selected.size > 0 ? `(${selected.size})` : ""} avec l&apos;IA</button>
                    <Link href="/admin/produits" className="text-sm text-brand hover:underline">Voir les brouillons →</Link>
                  </div>
                  {rewriteMsg ? <p className="mt-2 text-sm">{rewriteMsg}</p> : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
