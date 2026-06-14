"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/money";
import { ORDER_STATUS } from "@/lib/order-status";
import DeliveryControl from "@/components/admin/DeliveryControl";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Order = any;
type Step = { key: string; label: string };

export default function OrderDetail({ initial, steps }: { initial: Order; steps: Step[] }) {
  const [order, setOrder] = useState<Order>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [notes, setNotes] = useState(initial.adminNotes ?? "");

  const st = ORDER_STATUS[order.status];

  async function call(action: string, url: string, body?: unknown, method = "POST") {
    setBusy(action);
    setMsg(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Erreur" });
        return null;
      }
      return data;
    } finally {
      setBusy(null);
    }
  }

  async function confirmPayment() {
    if (!confirm("Confirmer la réception du virement ? Cela démarre la livraison et arrête les relances.")) return;
    const data = await call("confirm", `/api/orders/${order._id}/confirm-payment`);
    if (data?.order) { setOrder(data.order); setMsg({ type: "ok", text: "Paiement confirmé, livraison initialisée." }); }
  }
  async function resendEmail() {
    const data = await call("resend", `/api/orders/${order._id}/resend-email`);
    if (data?.ok) setMsg({ type: "ok", text: "Email renvoyé." });
    else if (data && !data.ok) setMsg({ type: "error", text: data.error || "Email non envoyé." });
  }
  async function cancelOrder(refund: boolean) {
    const label = refund ? "rembourser" : "annuler";
    if (!confirm(`Voulez-vous ${label} cette commande ? Le stock sera relâché.`)) return;
    const data = await call("cancel", `/api/orders/${order._id}/cancel`, { refund });
    if (data?.order) { setOrder(data.order); setMsg({ type: "ok", text: `Commande ${refund ? "remboursée" : "annulée"}.` }); }
  }
  async function saveNotes() {
    const data = await call("notes", `/api/orders/${order._id}`, { adminNotes: notes }, "PATCH");
    if (data?.order) setMsg({ type: "ok", text: "Notes enregistrées." });
  }

  const addr = order.shippingAddress ?? {};

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/commandes" className="text-sm text-brand hover:underline">← Commandes</Link>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${st?.className ?? "bg-surface"}`}>{st?.label ?? order.status}</span>
        </div>
        <div className="text-sm text-muted">
          {order.createdAt ? new Date(order.createdAt).toLocaleString("fr-FR") : ""}
        </div>
      </div>

      {msg ? (
        <div className={`mb-4 rounded-md p-3 text-sm ${msg.type === "ok" ? "bg-stock/10 text-stock" : "bg-deal-soft text-deal"}`}>{msg.text}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          {/* Articles */}
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-bold">Articles</h2>
            <ul className="divide-y divide-line">
              {order.items?.map((it: any, i: number) => (
                <li key={i} className="flex items-center gap-3 py-2 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-line bg-surface">
                    {it.image ? <img src={it.image} alt="" className="h-full w-full object-contain p-1" /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-ink">{it.title}</div>
                    {it.variantTitle ? <div className="text-xs text-muted">{it.variantTitle}</div> : null}
                    <div className="text-xs text-muted">{formatPrice(it.price)} × {it.quantity}</div>
                  </div>
                  <div className="font-semibold">{formatPrice(it.price * it.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discountTotal ? <div className="flex justify-between text-deal"><span>Remise {order.promoCode?.code ? `(${order.promoCode.code})` : ""}</span><span>-{formatPrice(order.discountTotal)}</span></div> : null}
              <div className="flex justify-between"><span className="text-muted">Livraison</span><span>{order.shippingTotal ? formatPrice(order.shippingTotal) : "Offerte"}</span></div>
              <div className="flex justify-between text-base font-extrabold"><span>Total</span><span className="text-deal">{formatPrice(order.total)}</span></div>
            </div>
          </section>

          {/* Pilotage de la livraison maison (hybride auto + manuel) */}
          <DeliveryControl orderId={order._id} order={order} steps={steps} onChange={setOrder} />

          {/* Historique */}
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-bold">Historique</h2>
            <ul className="space-y-1 text-sm">
              {order.statusHistory?.slice().reverse().map((h: any, i: number) => (
                <li key={i} className="flex justify-between gap-3 border-b border-line/60 py-1">
                  <span>{ORDER_STATUS[h.status]?.label ?? h.status}{h.note ? ` — ${h.note}` : ""}</span>
                  <span className="shrink-0 text-xs text-muted">{h.at ? new Date(h.at).toLocaleString("fr-FR") : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Colonne latérale : actions + infos */}
        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-bold">Actions</h2>
            <div className="space-y-2">
              {order.status === "pending_payment" ? (
                <button onClick={confirmPayment} disabled={busy === "confirm"} className="btn-brand w-full">
                  {busy === "confirm" ? "…" : "✓ Confirmer le paiement"}
                </button>
              ) : null}
              <button onClick={resendEmail} disabled={busy === "resend"} className="btn-outline w-full">
                {busy === "resend" ? "…" : "Renvoyer l'email"}
              </button>
              {!["delivered", "cancelled", "refunded"].includes(order.status) ? (
                <div className="flex gap-2">
                  <button onClick={() => cancelOrder(false)} disabled={busy === "cancel"} className="btn-outline flex-1 text-deal">Annuler</button>
                  <button onClick={() => cancelOrder(true)} disabled={busy === "cancel"} className="btn-outline flex-1 text-deal">Rembourser</button>
                </div>
              ) : null}
            </div>
            {order.status === "pending_payment" ? (
              <p className="mt-3 rounded bg-deal-soft p-2 text-xs text-deal">
                Virement non reçu : le client est relancé 1×/jour pendant 14 j. La confirmation stoppe les relances.
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-line bg-white p-5 text-sm">
            <h2 className="mb-3 font-bold">Paiement</h2>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-muted">Méthode</span><span>Virement</span></div>
              <div className="flex justify-between"><span className="text-muted">Référence</span><span className="font-mono font-semibold">{order.paymentReference}</span></div>
              {order.paymentConfirmedAt ? <div className="flex justify-between"><span className="text-muted">Confirmé le</span><span>{new Date(order.paymentConfirmedAt).toLocaleDateString("fr-FR")}</span></div> : null}
            </div>

            {/* Preuves de virement envoyées par le client */}
            {order.paymentProofs?.length ? (
              <div className="mt-3 border-t border-line pt-3">
                <div className="mb-2 text-xs font-semibold text-ink">Preuves de virement ({order.paymentProofs.length})</div>
                <div className="flex flex-wrap gap-2">
                  {order.paymentProofs.map((p: { url: string; at?: string }, i: number) => (
                    <a key={i} href={p.url} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-md border border-line" title={p.at ? new Date(p.at).toLocaleString("fr-FR") : ""}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="Preuve" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted">Cliquez pour agrandir.</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-line bg-white p-5 text-sm">
            <h2 className="mb-2 font-bold">Client</h2>
            <div className="text-ink">{order.customer?.name}</div>
            <div className="text-muted">{order.customer?.email}</div>
            <div className="text-muted">{order.customer?.phone}</div>
            <h3 className="mb-1 mt-3 font-semibold">Adresse de livraison</h3>
            <div className="text-muted">
              {addr.line1}{addr.line2 ? <>, {addr.line2}</> : null}<br />
              {addr.postalCode} {addr.city}<br />
              {addr.country}
            </div>
            {order.customerNotes ? <p className="mt-2 rounded bg-surface p-2 text-xs">📝 {order.customerNotes}</p> : null}
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-2 font-bold">Notes internes</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px] w-full rounded-md border border-line px-3 py-2 text-sm" />
            <button onClick={saveNotes} disabled={busy === "notes"} className="btn-outline mt-2 w-full">Enregistrer les notes</button>
          </section>
        </div>
      </div>
    </div>
  );
}
