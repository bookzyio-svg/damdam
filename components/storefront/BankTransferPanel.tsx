"use client";

import { useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils/money";

type Bank = { titulaire?: string; iban?: string; bic?: string; banque?: string; instructions?: string };

/**
 * Panneau « coordonnées de virement » dépliable, affiché directement à l'étape
 * Paiement (pas besoin de scroller). Bouton bien visible (point qui pulse) et
 * copie en un clic de l'IBAN et de la référence.
 */
export default function BankTransferPanel({
  bank,
  total,
  reference,
  defaultOpen = false,
}: {
  bank: Bank;
  total: number;
  reference: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    });
  }

  const CopyBtn = ({ value, k }: { value?: string; k: string }) =>
    value ? (
      <button type="button" onClick={() => copy(value, k)} className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
        {copied === k ? <><Check className="h-3.5 w-3.5 text-stock" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Copier</>}
      </button>
    ) : null;

  const Row = ({ label, value, mono, copyKey }: { label: string; value?: string; mono?: boolean; copyKey?: string }) =>
    value ? (
      <div className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="flex items-center text-right">
          <span className={`font-semibold ${mono ? "font-mono" : ""}`}>{value}</span>
          {copyKey ? <CopyBtn value={value} k={copyKey} /> : null}
        </span>
      </div>
    ) : null;

  return (
    <div className="mt-2">
      {/* Bouton très visible */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-deal/40 bg-deal-soft px-4 py-3 text-left transition hover:bg-deal/10"
      >
        <span className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deal opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-deal" />
          </span>
          <span className="font-bold text-deal">Coordonnées de virement</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-deal">
          {open ? "Masquer" : "Afficher"}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {/* Détails dépliés inline */}
      {open ? (
        <div className="animate-pop mt-2 rounded-xl border border-line bg-white p-4">
          <Row label="Titulaire" value={bank.titulaire} />
          <Row label="IBAN" value={bank.iban} mono copyKey="iban" />
          <Row label="BIC" value={bank.bic} mono copyKey="bic" />
          <Row label="Banque" value={bank.banque} />
          <div className="flex items-center justify-between gap-3 border-b border-line py-2">
            <span className="text-sm text-muted">Montant exact</span>
            <span className="price text-lg">{formatPrice(total)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm text-muted">Référence (motif)</span>
            <span className="flex items-center">
              <span className="text-lg font-extrabold">{reference}</span>
              <CopyBtn value={reference} k="ref" />
            </span>
          </div>
          {bank.instructions ? <p className="mt-2 text-xs text-muted">{bank.instructions}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
