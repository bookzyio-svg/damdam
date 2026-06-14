"use client";

import useSWR from "swr";
import {
  CreditCard,
  Package,
  PackageCheck,
  Truck,
  Bike,
  Home,
  MapPin,
  Phone,
  RefreshCw,
  CheckCircle2,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Step = { key: string; label: string; description?: string };
type TimelineEntry = { stepKey?: string; label?: string; at?: string; note?: string; location?: { label?: string } };
type Tracking = {
  orderNumber: string;
  firstName?: string;
  status: string;
  steps: Step[];
  currentStepKey?: string;
  estimatedDelivery?: string;
  driver?: { name?: string; phone?: string };
  currentLocation?: { label?: string; lat?: number; lng?: number };
  timeline: TimelineEntry[];
  recipient?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: { line1?: string; line2?: string; postalCode?: string; city?: string; country?: string };
  };
};

const STEP_ICONS: Record<string, LucideIcon> = {
  paiement_recu: CreditCard,
  preparation: Package,
  expedie: PackageCheck,
  en_transit: Truck,
  en_livraison: Bike,
  livre: Home,
};
const stepIcon = (key: string): LucideIcon => STEP_ICONS[key] ?? Package;

const STATUS_HEADLINE: Record<string, string> = {
  pending_payment: "En attente de votre paiement",
  paid: "Votre commande est confirmée",
  preparing: "Votre commande est en préparation",
  shipped: "Votre colis a été expédié",
  in_transit: "Votre colis est en transit",
  out_for_delivery: "Votre colis arrive bientôt",
  delivered: "Votre colis a été livré",
};

export default function TrackingView({ deliveryNumber }: { deliveryNumber: string }) {
  const { data, isLoading } = useSWR<{ found: boolean; tracking?: Tracking }>(
    `/api/suivi/${deliveryNumber}`,
    fetcher,
    { refreshInterval: 20000 }, // temps réel : rafraîchit toutes les 20 s
  );

  if (isLoading) {
    return <p className="py-20 text-center text-muted">Chargement du suivi…</p>;
  }
  if (!data?.found || !data.tracking) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <Package className="mx-auto h-10 w-10 text-muted" />
        <h1 className="mt-3 text-xl font-bold">Suivi introuvable</h1>
        <p className="mt-2 text-muted">Vérifiez votre numéro de suivi : <b>{deliveryNumber}</b></p>
      </div>
    );
  }

  const t = data.tracking;
  const currentIndex = Math.max(0, t.steps.findIndex((s) => s.key === t.currentStepKey));
  const lastIndex = t.steps.length - 1;
  const timeByStep = new Map(t.timeline.filter((e) => e.stepKey).map((e) => [e.stepKey, e.at]));
  const loc = t.currentLocation;
  const delivered = t.status === "delivered";
  const eta = t.estimatedDelivery ? new Date(t.estimatedDelivery) : null;

  return (
    <div className="space-y-5">
      {/* EN-TÊTE STATUT */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stock">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-stock opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-stock" />
            </span>
            En direct
          </span>
          <span className="font-mono text-xs text-muted">{deliveryNumber}</span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${delivered ? "bg-stock/10 text-stock" : "bg-brand/10 text-brand"}`}>
            {delivered ? <CheckCircle2 className="h-7 w-7" /> : <Truck className="h-7 w-7" />}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-ink md:text-2xl">{STATUS_HEADLINE[t.status] ?? "Suivi de votre colis"}</h1>
            <p className="text-sm text-muted">
              {t.firstName ? `Bonjour ${t.firstName} · ` : ""}Commande {t.orderNumber}
            </p>
          </div>
        </div>

        {eta ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand/15 bg-brand/5 px-4 py-3">
            <CalendarClock className="h-5 w-5 shrink-0 text-brand" />
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{delivered ? "Livré le" : "Livraison estimée"}</div>
              <div className="font-bold capitalize text-ink">{eta.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
            </div>
          </div>
        ) : null}
      </section>

      {/* CARTE (si GPS) */}
      {loc?.lat && loc?.lng ? (
        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          {loc.label ? (
            <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-semibold text-ink">
              <MapPin className="h-4 w-4 text-brand" /> {loc.label}
            </div>
          ) : null}
          <iframe
            title="Carte de suivi"
            className="h-72 w-full"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.02}%2C${loc.lat - 0.02}%2C${loc.lng + 0.02}%2C${loc.lat + 0.02}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`}
          />
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* TIMELINE DÉTAILLÉE */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-lg font-bold">Détail du suivi</h2>
          <ol className="relative">
            {t.steps.map((s, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              const Icon = done ? CheckCircle2 : stepIcon(s.key);
              const at = timeByStep.get(s.key);
              const isLast = i === lastIndex;
              return (
                <li key={s.key} className="flex gap-3 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      done ? "bg-stock text-white" : current ? "bg-brand text-white ring-4 ring-brand/15" : "bg-surface text-muted"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {!isLast ? <span className={`mt-1 w-0.5 flex-1 ${done ? "bg-stock" : "bg-line"}`} style={{ minHeight: 26 }} /> : null}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className={`font-semibold ${current ? "text-brand" : done ? "text-ink" : "text-muted"}`}>{s.label}</div>
                    {s.description ? <div className="text-xs text-muted">{s.description}</div> : null}
                    {at ? <div className="mt-0.5 text-xs text-muted">{new Date(at).toLocaleString("fr-FR")}</div> : null}

                    {/* Dernière étape : livraison à l'adresse renseignée */}
                    {isLast && t.recipient?.address?.line1 ? (
                      <div className={`mt-2 rounded-xl border p-3 text-xs ${i <= currentIndex ? "border-stock/30 bg-stock/5" : "border-brand/20 bg-brand/5"}`}>
                        <div className="flex items-center gap-1.5 font-semibold text-ink">
                          <MapPin className="h-3.5 w-3.5 text-brand" />
                          {i <= currentIndex ? "Livré à cette adresse" : "Sera livré à cette adresse"}
                        </div>
                        <div className="mt-1 leading-relaxed text-muted">
                          {t.recipient.name ? <>{t.recipient.name}<br /></> : null}
                          {t.recipient.address.line1}{t.recipient.address.line2 ? `, ${t.recipient.address.line2}` : ""}<br />
                          {t.recipient.address.postalCode} {t.recipient.address.city}<br />
                          {t.recipient.address.country}
                          {t.recipient.phone ? <><br />Tél : {t.recipient.phone}</> : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* LIVREUR + AIDE */}
        <aside className="space-y-4">
          {t.driver?.name ? (
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Votre livreur</h2>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
                  {t.driver.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="font-bold text-ink">{t.driver.name}</div>
                  <div className="text-xs text-muted">Transporteur maison</div>
                </div>
              </div>
              {t.driver.phone ? (
                <a href={`tel:${t.driver.phone}`} className="btn-outline mt-3 w-full"><Phone className="h-4 w-4" /> {t.driver.phone}</a>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-2xl border border-line bg-surface p-5 text-sm">
            <h2 className="mb-1 font-bold text-ink">Besoin d&apos;aide ?</h2>
            <p className="text-muted">Une question sur votre livraison ? Notre SAV vous répond rapidement.</p>
            <a href="/contact" className="mt-3 inline-block font-semibold text-brand hover:underline">Contacter le SAV →</a>
          </section>
        </aside>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <RefreshCw className="h-3.5 w-3.5" /> Cette page se met à jour automatiquement en temps réel.
      </p>
    </div>
  );
}
