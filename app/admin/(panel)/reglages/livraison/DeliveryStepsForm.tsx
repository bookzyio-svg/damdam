"use client";

import { useState } from "react";
import { Card, Field, TextInput, TextArea, Toggle, SaveBar } from "@/components/admin/ui";
import { saveSettingsSection } from "@/lib/admin/api";
import { slugify } from "@/lib/utils/slug";

type Step = {
  key: string;
  label: string;
  description?: string;
  autoAfterHours?: number;
  notifyCustomer?: boolean;
  order?: number;
};

/**
 * Éditeur des étapes du transporteur maison (§8). Chaque étape porte un délai
 * `autoAfterHours` : nombre d'heures après l'étape précédente avant passage
 * AUTO à la suivante (cron delivery-advance). Toggle global `autoAdvance`.
 *
 * Ce formulaire sauvegarde DEUX sections : `deliverySteps` et `delivery`.
 */
export default function DeliveryStepsForm({
  initialSteps,
  initialAutoAdvance,
}: {
  initialSteps: Step[];
  initialAutoAdvance: boolean;
}) {
  const [autoAdvance, setAutoAdvance] = useState(initialAutoAdvance);
  const [steps, setSteps] = useState<Step[]>(
    [...(initialSteps ?? [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => ({
        key: s.key,
        label: s.label,
        description: s.description ?? "",
        autoAfterHours: s.autoAfterHours ?? 0,
        notifyCustomer: s.notifyCustomer ?? true,
        order: s.order ?? 0,
      })),
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; message?: string }>({
    type: "idle",
  });

  const updateStep = (i: number, patch: Partial<Step>) =>
    setSteps((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const addStep = () =>
    setSteps((arr) => [
      ...arr,
      { key: "", label: "", description: "", autoAfterHours: 24, notifyCustomer: true, order: arr.length },
    ]);

  const removeStep = (i: number) =>
    setSteps((arr) => arr.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) =>
    setSteps((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const copy = [...arr];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "idle" });

    const normalized = steps
      .filter((s) => s.label.trim())
      .map((s, idx) => ({
        key: s.key.trim() || slugify(s.label).replace(/-/g, "_") || `etape_${idx}`,
        label: s.label.trim(),
        description: (s.description ?? "").trim(),
        autoAfterHours: Number(s.autoAfterHours) || 0,
        notifyCustomer: s.notifyCustomer ?? true,
        order: idx,
      }));

    const r1 = await saveSettingsSection("deliverySteps", normalized);
    const r2 = await saveSettingsSection("delivery", { autoAdvance });
    setSaving(false);

    if (r1.ok && r2.ok) {
      setStatus({ type: "ok", message: "Étapes enregistrées" });
      setSteps(normalized);
    } else {
      setStatus({ type: "error", message: r1.error || r2.error });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card
        title="Suivi de livraison (transporteur maison)"
        description="Étapes ordonnées du suivi temps réel. Le délai auto fait avancer la commande sans intervention."
      >
        <div className="mb-4">
          <Toggle
            checked={autoAdvance}
            onChange={setAutoAdvance}
            label="Avancement automatique sur timer (hybride : override manuel possible)"
          />
        </div>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="rounded-md border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  Étape {i + 1}
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-muted hover:text-brand disabled:opacity-30" aria-label="Monter">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="px-1 text-muted hover:text-brand disabled:opacity-30" aria-label="Descendre">↓</button>
                  <button type="button" onClick={() => removeStep(i)} className="font-medium text-deal hover:underline">Suppr.</button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-12">
                <Field label="Libellé" className="sm:col-span-5">
                  <TextInput value={s.label} onChange={(e) => updateStep(i, { label: e.target.value })} placeholder="En préparation" />
                </Field>
                <Field label="Clé (technique)" className="sm:col-span-4">
                  <TextInput value={s.key} onChange={(e) => updateStep(i, { key: e.target.value })} placeholder="preparation" className="font-mono" />
                </Field>
                <Field label="Délai auto (h)" hint="après l'étape précédente" className="sm:col-span-3">
                  <TextInput type="number" min="0" value={String(s.autoAfterHours ?? 0)} onChange={(e) => updateStep(i, { autoAfterHours: Number(e.target.value) })} />
                </Field>
                <Field label="Description (affichée au client)" className="sm:col-span-12">
                  <TextArea value={s.description} onChange={(e) => updateStep(i, { description: e.target.value })} className="min-h-[60px]" />
                </Field>
                <div className="sm:col-span-12">
                  <Toggle checked={s.notifyCustomer ?? true} onChange={(val) => updateStep(i, { notifyCustomer: val })} label="Notifier le client à cette étape" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addStep} className="btn-outline mt-3 px-3 py-1.5 text-sm">
          + Ajouter une étape
        </button>
        <SaveBar saving={saving} status={status} />
      </Card>
    </form>
  );
}
