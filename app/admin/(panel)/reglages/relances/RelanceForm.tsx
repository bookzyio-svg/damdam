"use client";

import { useState } from "react";
import { Card, Field, TextInput, Toggle, SaveBar } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettingsForm";

type Relance = {
  enabled?: boolean;
  abandonedCartDelaysHours?: number[];
  unpaidOrderDelaysHours?: number[];
};

const parseHours = (csv: string): number[] =>
  csv
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n >= 0);

export default function RelanceForm({ initial }: { initial: Relance }) {
  const { saving, status, submit } = useSettingsForm("relance");
  const [enabled, setEnabled] = useState(initial.enabled ?? true);
  const [cart, setCart] = useState((initial.abandonedCartDelaysHours ?? [3, 24, 72]).join(", "));
  const [unpaid, setUnpaid] = useState((initial.unpaidOrderDelaysHours ?? [24, 72]).join(", "));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit({
          enabled,
          abandonedCartDelaysHours: parseHours(cart),
          unpaidOrderDelaysHours: parseHours(unpaid),
        });
      }}
    >
      <Card title="Relances email" description="Paliers d'envoi automatique (en heures), séparés par des virgules (§12).">
        <div className="space-y-4">
          <Toggle checked={enabled} onChange={setEnabled} label="Activer les relances automatiques" />
          <Field
            label="Panier abandonné — paliers (h)"
            htmlFor="cart"
            hint="Ex. : 3, 24, 72 → relance à 3 h, 24 h puis 72 h."
          >
            <TextInput id="cart" value={cart} onChange={(e) => setCart(e.target.value)} />
          </Field>
          <Field
            label="Commande non payée — paliers (h)"
            htmlFor="unpaid"
            hint="Ex. : 24, 72 → rappel du virement à 24 h puis 72 h."
          >
            <TextInput id="unpaid" value={unpaid} onChange={(e) => setUnpaid(e.target.value)} />
          </Field>
        </div>
        <SaveBar saving={saving} status={status} />
      </Card>
    </form>
  );
}
