"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

/** Formulaire d'inscription newsletter (réutilisable footer / accueil). */
export default function NewsletterForm({ variant = "light", source = "site" }: { variant?: "light" | "dark"; source?: string }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source, website }),
    });
    setBusy(false);
    if (res.ok) { setDone(true); setEmail(""); }
  }

  if (done) {
    return (
      <p className={`flex items-center gap-2 text-sm font-medium ${variant === "dark" ? "text-white" : "text-stock"}`}>
        <Check className="h-4 w-4" /> Merci, votre inscription est confirmée !
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      {/* Honeypot (caché) */}
      <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="relative flex-1">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre email"
          className="w-full rounded-md border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink focus:border-brand focus:outline-none"
        />
      </div>
      <button type="submit" disabled={busy} className="btn-brand shrink-0">{busy ? "…" : "Je m'inscris"}</button>
    </form>
  );
}
