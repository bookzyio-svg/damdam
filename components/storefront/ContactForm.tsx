"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/contact", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else { const b = await res.json().catch(() => ({})); setError(b.error || "Erreur"); }
  }

  const inputCls = "w-full rounded-md border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none";

  if (done) {
    return (
      <div className="rounded-xl border border-stock/30 bg-stock/5 p-6 text-center">
        <Check className="mx-auto h-10 w-10 text-stock" />
        <h2 className="mt-2 text-lg font-bold">Message envoyé !</h2>
        <p className="text-sm text-muted">Nous vous répondrons dans les plus brefs délais.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-line bg-white p-5 shadow-sm">
      <input type="text" value={f.website} onChange={(e) => set("website", e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <input required placeholder="Votre nom" value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        <input required type="email" placeholder="Votre email" value={f.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
      </div>
      <input placeholder="Sujet" value={f.subject} onChange={(e) => set("subject", e.target.value)} className={inputCls} />
      <textarea required placeholder="Votre message…" value={f.message} onChange={(e) => set("message", e.target.value)} className={`${inputCls} min-h-[140px]`} />
      {error ? <p className="text-sm text-deal">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-brand">{busy ? "Envoi…" : "Envoyer le message"}</button>
    </form>
  );
}
