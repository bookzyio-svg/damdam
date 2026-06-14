"use client";

import { useState } from "react";
import { SITE_URL } from "@/lib/site-url";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Step = { key: string; label: string };

/**
 * Pilotage de la livraison maison (§8) — hybride : l'avancement auto tourne en
 * tâche de fond ; ici l'admin peut forcer une étape, corriger la localisation,
 * l'ETA et le livreur. Chaque action appelle PATCH /api/orders/[id]/delivery.
 */
export default function DeliveryControl({
  orderId,
  order,
  steps,
  onChange,
}: {
  orderId: string;
  order: any;
  steps: Step[];
  onChange: (order: any) => void;
}) {
  const delivery = order.delivery ?? {};
  const [stepKey, setStepKey] = useState(delivery.currentStepKey ?? steps[0]?.key ?? "");
  const [notify, setNotify] = useState(true);
  const [locLabel, setLocLabel] = useState(delivery.currentLocation?.label ?? "");
  const [lat, setLat] = useState(delivery.currentLocation?.lat ?? "");
  const [lng, setLng] = useState(delivery.currentLocation?.lng ?? "");
  const [eta, setEta] = useState(delivery.estimatedDelivery ? String(delivery.estimatedDelivery).slice(0, 10) : "");
  const [driverName, setDriverName] = useState(delivery.driver?.name ?? "");
  const [driverPhone, setDriverPhone] = useState(delivery.driver?.phone ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(action: string, body: unknown) {
    setBusy(action);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}/delivery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setMsg(data.error || "Erreur"); return; }
    if (data.order) { onChange(data.order); setMsg("✓ Mis à jour"); }
  }

  if (!delivery.deliveryNumber) {
    return (
      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="mb-1 font-bold">Livraison</h2>
        <p className="text-sm text-muted">La livraison démarrera après confirmation du paiement.</p>
      </section>
    );
  }

  const trackUrl = `${SITE_URL}/suivi/${delivery.deliveryNumber}`;
  const input = "w-full rounded-md border border-line px-3 py-2 text-sm";

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Pilotage de la livraison</h2>
        {msg ? <span className="text-xs font-medium text-stock">{msg}</span> : null}
      </div>

      <div className="mb-4 text-sm">
        <div>N° suivi : <span className="font-mono font-semibold">{delivery.deliveryNumber}</span></div>
        <div>Lien public : <a href={trackUrl} target="_blank" className="text-brand hover:underline">{trackUrl}</a></div>
        {delivery.nextAutoAdvanceAt ? (
          <div className="text-muted">⏱️ Prochain avancement auto : {new Date(delivery.nextAutoAdvanceAt).toLocaleString("fr-FR")}</div>
        ) : <div className="text-muted">Avancement auto terminé / en pause</div>}
      </div>

      {/* Forcer une étape */}
      <div className="mb-4 rounded-md border border-line p-3">
        <div className="mb-2 text-sm font-semibold">Forcer une étape</div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={stepKey} onChange={(e) => setStepKey(e.target.value)} className="rounded-md border border-line bg-white px-2 py-2 text-sm">
            {steps.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-brand" />
            Notifier le client
          </label>
          <button onClick={() => patch("step", { stepKey, notifyCustomer: notify, location: locLabel || lat || lng ? { label: locLabel, lat: lat ? Number(lat) : undefined, lng: lng ? Number(lng) : undefined } : undefined })} disabled={busy === "step"} className="btn-brand px-3 py-1.5 text-sm">
            Appliquer
          </button>
        </div>
      </div>

      {/* Localisation */}
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="sm:col-span-3 text-sm font-semibold">Localisation</div>
        <input placeholder="Lieu (ex. Centre de tri Lyon)" value={locLabel} onChange={(e) => setLocLabel(e.target.value)} className={`${input} sm:col-span-3`} />
        <input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} className={input} />
        <input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} className={input} />
        <button onClick={() => patch("loc", { location: { label: locLabel, lat: lat ? Number(lat) : undefined, lng: lng ? Number(lng) : undefined } })} disabled={busy === "loc"} className="btn-outline text-sm">Enregistrer la position</button>
      </div>

      {/* ETA + livreur */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-sm font-semibold">Livraison estimée</div>
          <div className="flex gap-2">
            <input type="date" value={eta} onChange={(e) => setEta(e.target.value)} className={input} />
            <button onClick={() => patch("eta", { estimatedDelivery: eta || null })} disabled={busy === "eta"} className="btn-outline text-sm">OK</button>
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Livreur</div>
          <div className="flex gap-2">
            <input placeholder="Nom" value={driverName} onChange={(e) => setDriverName(e.target.value)} className={input} />
            <input placeholder="Tél." value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className={input} />
            <button onClick={() => patch("driver", { driver: { name: driverName, phone: driverPhone } })} disabled={busy === "driver"} className="btn-outline text-sm">OK</button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 border-t border-line pt-3">
        <div className="mb-2 text-sm font-semibold">Historique de livraison</div>
        <ol className="space-y-1.5">
          {(delivery.timeline ?? []).slice().reverse().map((t: any, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
              <div>
                <span className="font-medium">{t.label}</span>
                <span className="ml-2 text-xs text-muted">{t.at ? new Date(t.at).toLocaleString("fr-FR") : ""}</span>
                {t.location?.label ? <span className="ml-2 text-xs text-muted">📍 {t.location.label}</span> : null}
                {!t.notified ? <span className="ml-2 rounded bg-deal-soft px-1 text-[10px] text-deal">notif en attente</span> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
