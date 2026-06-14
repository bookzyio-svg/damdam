"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, ArrowRight, Mail } from "lucide-react";

export default function TrackingSearchPage() {
  const router = useRouter();
  const [num, setNum] = useState("");

  return (
    <div className="bg-surface">
      <div className="container-site max-w-lg py-12 md:py-20">
        <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <PackageSearch className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold">Suivre ma commande</h1>
          <p className="mt-1 text-center text-sm text-muted">
            Entrez votre numéro de suivi pour voir où en est votre colis, en temps réel.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (num.trim()) router.push(`/suivi/${num.trim().toUpperCase()}`);
            }}
            className="mt-6"
          >
            <label className="mb-1.5 block text-xs font-semibold text-muted">Numéro de suivi</label>
            <div className="flex gap-2">
              <input
                value={num}
                onChange={(e) => setNum(e.target.value.toUpperCase())}
                placeholder="LIV-9K2M7X"
                className="w-full rounded-xl border border-line px-4 py-3 font-mono text-sm tracking-wide focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
              <button type="submit" className="btn-brand shrink-0 rounded-xl px-5">
                Suivre <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-surface p-3 text-xs text-muted">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>Votre numéro de suivi vous a été envoyé par email dès la confirmation de votre paiement.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
