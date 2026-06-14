"use client";

import { useState } from "react";
import { Card, Field, TextArea, SaveBar } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettingsForm";

type Legal = {
  mentions?: string;
  cgv?: string;
  confidentialite?: string;
  retractation?: string;
};

export default function LegalForm({ initial }: { initial: Legal }) {
  const { saving, status, submit } = useSettingsForm("legal");
  const [v, setV] = useState<Legal>({
    mentions: initial.mentions ?? "",
    cgv: initial.cgv ?? "",
    confidentialite: initial.confidentialite ?? "",
    retractation: initial.retractation ?? "",
  });

  const set = (k: keyof Legal, val: string) => setV((s) => ({ ...s, [k]: val }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(v);
      }}
    >
      <Card
        title="Pages légales"
        description="Contenu des 4 pages légales (§14). Le Markdown/HTML simple est conservé tel quel."
      >
        <div className="space-y-4">
          <Field label="Mentions légales" htmlFor="mentions">
            <TextArea id="mentions" value={v.mentions} onChange={(e) => set("mentions", e.target.value)} className="min-h-[140px]" />
          </Field>
          <Field label="CGV" htmlFor="cgv" hint="Mentionner : paiement par virement, délais d'expédition, rétractation.">
            <TextArea id="cgv" value={v.cgv} onChange={(e) => set("cgv", e.target.value)} className="min-h-[140px]" />
          </Field>
          <Field label="Confidentialité (RGPD)" htmlFor="confidentialite">
            <TextArea id="confidentialite" value={v.confidentialite} onChange={(e) => set("confidentialite", e.target.value)} className="min-h-[140px]" />
          </Field>
          <Field label="Rétractation (14 jours)" htmlFor="retractation">
            <TextArea id="retractation" value={v.retractation} onChange={(e) => set("retractation", e.target.value)} className="min-h-[140px]" />
          </Field>
        </div>
        <SaveBar saving={saving} status={status} />
      </Card>
    </form>
  );
}
