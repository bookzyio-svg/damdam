"use client";

import { useRef, useState } from "react";
import { Upload, Check, Loader2 } from "lucide-react";

/**
 * Permet au client de joindre sa preuve de virement (capture/PDF) directement
 * depuis la page de commande. L'admin la verra sur le détail de la commande.
 */
export default function ProofUpload({ orderNumber }: { orderNumber: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("orderNumber", orderNumber);
      fd.append("file", file);
      const res = await fetch("/api/orders/proof", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error || "Échec de l'envoi"); return; }
      setSent((n) => n + 1);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-brand/20 bg-brand/5 p-4">
      <div className="text-sm font-semibold text-ink">Déjà payé&nbsp;? Accélérez le traitement</div>
      <p className="mt-0.5 text-xs text-muted">
        Joignez la capture de votre virement&nbsp;: notre équipe vérifie et confirme votre commande plus vite.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.currentTarget.value = ""; }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="btn-brand mt-3"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Envoi…" : "Joindre ma preuve de virement"}
      </button>

      {sent > 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-stock">
          <Check className="h-4 w-4" /> {sent} preuve{sent > 1 ? "s" : ""} envoyée{sent > 1 ? "s" : ""}. Merci&nbsp;!
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-deal">{error}</p> : null}
    </div>
  );
}
