import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Check, MapPin, Truck } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getSettings } from "@/lib/settings";
import { getDeliverySteps } from "@/lib/delivery";
import { serialize } from "@/lib/serialize";
import { formatPrice } from "@/lib/utils/money";
import BankTransferPanel from "@/components/storefront/BankTransferPanel";
import ProofUpload from "@/components/storefront/ProofUpload";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "En attente du virement",
  paid: "Paiement reçu",
  preparing: "En préparation",
  shipped: "Expédiée",
  in_transit: "En transit",
  out_for_delivery: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function OrderConfirmationPage({ params }: { params: { orderNumber: string } }) {
  await connectDB();
  const orderDoc = await Order.findOne({ orderNumber: params.orderNumber }).lean();
  if (!orderDoc) notFound();
  const order: any = serialize(orderDoc);
  const settings: any = serialize((await getSettings()).toObject());
  const bank = settings.bank ?? {};
  const pending = order.status === "pending_payment";
  const cancelled = order.status === "cancelled" || order.status === "refunded";
  const addr = order.shippingAddress ?? {};

  // Parcours complet : "Commande passée" + étapes de livraison
  const deliverySteps = getDeliverySteps(settings);
  const paymentKey = deliverySteps[0]?.key;
  const journey = [
    { key: "ordered", label: "Commande passée", description: "" },
    ...deliverySteps.map((s) => ({ key: s.key, label: s.label, description: s.description ?? "" })),
  ];

  // Index de l'étape courante dans le parcours
  let currentIndex = 1; // par défaut : étape "paiement"
  if (!pending && !cancelled) {
    const idx = deliverySteps.findIndex((s) => s.key === order.delivery?.currentStepKey);
    currentIndex = idx >= 0 ? idx + 1 : 1;
  }

  // Dates par étape
  const dateByKey = new Map<string, string>();
  if (order.createdAt) dateByKey.set("ordered", order.createdAt);
  if (order.paymentConfirmedAt && paymentKey) dateByKey.set(paymentKey, order.paymentConfirmedAt);
  for (const t of order.delivery?.timeline ?? []) {
    if (t.stepKey && t.at) dateByKey.set(t.stepKey, t.at);
  }

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="flex justify-between gap-4 border-b border-line py-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="text-right font-semibold">{value}</span>
      </div>
    ) : null;

  return (
    <div className="bg-surface">
      <div className="container-site max-w-3xl py-8">
        {/* En-tête */}
        <div className="rounded-2xl border border-stock/30 bg-white p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-stock" />
          <h1 className="mt-2 text-xl font-bold md:text-2xl">Merci, votre commande {order.orderNumber} est enregistrée</h1>
          <p className="mt-1 text-sm text-muted">
            Statut : <span className="font-semibold text-ink">{STATUS_LABEL[order.status] ?? order.status}</span>
          </p>
        </div>

        {cancelled ? (
          <div className="mt-6 rounded-xl border border-line bg-white p-5 text-center text-sm text-muted shadow-sm">
            Cette commande a été {order.status === "refunded" ? "remboursée" : "annulée"}.
          </div>
        ) : (
          <>
            {/* PARCOURS COMPLET */}
            <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-4 text-lg font-bold">Suivi de votre commande</h2>
              <ol className="relative">
                {journey.map((s, i) => {
                  const done = i < currentIndex;
                  const current = i === currentIndex;
                  const isPaymentStep = s.key === paymentKey;
                  const isLast = i === journey.length - 1;
                  const label = isPaymentStep && pending ? "En attente de votre virement" : s.label;
                  const at = dateByKey.get(s.key);
                  return (
                    <li key={s.key} className="flex gap-3 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          done ? "bg-stock text-white" : current ? "bg-brand text-white ring-4 ring-brand/15" : "bg-surface text-muted"
                        }`}>
                          {done ? <Check className="h-4 w-4" /> : i + 1}
                        </span>
                        {!isLast ? <span className={`mt-1 w-0.5 flex-1 ${done ? "bg-stock" : "bg-line"}`} style={{ minHeight: 28 }} /> : null}
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className={`font-semibold ${current ? "text-brand" : done ? "text-ink" : "text-muted"}`}>{label}</div>
                        {s.description && !(isPaymentStep && pending) ? <div className="text-xs text-muted">{s.description}</div> : null}
                        {at ? <div className="mt-0.5 text-xs text-muted">{new Date(at).toLocaleString("fr-FR")}</div> : null}

                        {/* Étape paiement en cours → coordonnées de virement inline */}
                        {isPaymentStep && current && pending ? (
                          <>
                            <div className="mt-1 text-xs font-medium text-deal">Effectuez votre virement pour lancer l&apos;expédition.</div>
                            <BankTransferPanel bank={bank} total={order.total} reference={order.paymentReference} />
                            <ProofUpload orderNumber={order.orderNumber} />
                          </>
                        ) : null}

                        {/* Dernière étape → adresse de livraison du client */}
                        {isLast && addr.line1 ? (
                          <div className={`mt-2 rounded-lg border p-3 text-xs ${done ? "border-stock/30 bg-stock/5" : "border-brand/20 bg-brand/5"}`}>
                            <div className="flex items-center gap-1.5 font-semibold text-ink">
                              <MapPin className="h-3.5 w-3.5 text-brand" />
                              {done ? "Livré à votre adresse" : "Sera livré à votre adresse"}
                            </div>
                            <div className="mt-1 leading-relaxed text-muted">
                              {order.customer?.name ? <>{order.customer.name}<br /></> : null}
                              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                              {addr.postalCode} {addr.city}<br />
                              {addr.country}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Suivi temps réel quand payé */}
              {!pending && order.delivery?.deliveryNumber ? (
                <div className="mt-2 flex flex-col items-start gap-2 rounded-xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <div className="font-semibold text-ink">Numéro de suivi : <span className="font-mono">{order.delivery.deliveryNumber}</span></div>
                    <div className="text-muted">Suivez votre colis en temps réel.</div>
                  </div>
                  <Link href={`/suivi/${order.delivery.deliveryNumber}`} className="btn-brand shrink-0">
                    <Truck className="h-4 w-4" /> Suivi en temps réel
                  </Link>
                </div>
              ) : null}
            </section>

          </>
        )}

        {/* Récapitulatif */}
        <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-3 text-lg font-bold">Récapitulatif</h2>
          <ul className="mb-3 divide-y divide-line">
            {order.items.map((it: { title: string; variantTitle?: string; quantity: number; price: number }, i: number) => (
              <li key={i} className="flex justify-between gap-4 py-2 text-sm">
                <span>{it.title}{it.variantTitle ? ` (${it.variantTitle})` : ""} × {it.quantity}</span>
                <span className="font-semibold">{formatPrice(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <Row label="Sous-total" value={formatPrice(order.subtotal)} />
          {order.discountTotal ? <Row label="Remise" value={`−${formatPrice(order.discountTotal)}`} /> : null}
          <Row label="Livraison" value={order.shippingTotal ? formatPrice(order.shippingTotal) : "Offerte"} />
          <div className="flex justify-between gap-4 pt-3 text-base font-extrabold">
            <span>Total</span><span className="text-deal">{formatPrice(order.total)}</span>
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-muted">
          Un email a été envoyé à <b>{order.customer?.email}</b>.<br />
          Une question ? <Link href="/contact" className="text-brand underline">Contactez-nous</Link>.
        </p>
      </div>
    </div>
  );
}
