"use client";

import { useState } from "react";
import { Card, Field, TextInput, TextArea, SaveBar } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettingsForm";
import { eurosToCents, centsToEurosInput } from "@/lib/utils/money";

type Bank = {
  titulaire?: string;
  iban?: string;
  bic?: string;
  banque?: string;
  instructions?: string;
  transferNoticeThreshold?: number;
};

/**
 * Coordonnées bancaires du virement. Modifiables à tout moment : elles sont
 * lues en direct depuis Settings au checkout et dans les emails (§7).
 */
export default function BankForm({ initial }: { initial: Bank }) {
  const { saving, status, submit } = useSettingsForm("bank");
  const [v, setV] = useState({
    titulaire: initial.titulaire ?? "",
    iban: initial.iban ?? "",
    bic: initial.bic ?? "",
    banque: initial.banque ?? "",
    instructions: initial.instructions ?? "",
  });
  const [noticeThreshold, setNoticeThreshold] = useState(
    centsToEurosInput(initial.transferNoticeThreshold ?? 50000),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit({ ...v, transferNoticeThreshold: eurosToCents(noticeThreshold) });
      }}
    >
      <Card
        title="Coordonnées bancaires (virement)"
        description="Communiquées au client après commande et dans les relances. Toute modification est prise en compte immédiatement."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titulaire du compte" htmlFor="titulaire" className="sm:col-span-2">
            <TextInput id="titulaire" value={v.titulaire} onChange={(e) => setV({ ...v, titulaire: e.target.value })} />
          </Field>
          <Field label="IBAN" htmlFor="iban" className="sm:col-span-2">
            <TextInput
              id="iban"
              value={v.iban}
              onChange={(e) => setV({ ...v, iban: e.target.value.toUpperCase() })}
              placeholder="FR76 0000 0000 0000 0000 0000 000"
              className="font-mono tracking-wide"
            />
          </Field>
          <Field label="BIC / SWIFT" htmlFor="bic">
            <TextInput id="bic" value={v.bic} onChange={(e) => setV({ ...v, bic: e.target.value.toUpperCase() })} className="font-mono" />
          </Field>
          <Field label="Banque" htmlFor="banque">
            <TextInput id="banque" value={v.banque} onChange={(e) => setV({ ...v, banque: e.target.value })} />
          </Field>
          <Field
            label="Instructions affichées au client"
            htmlFor="instructions"
            hint="Ex. : indiquez la référence en motif du virement ; expédition dès réception."
            className="sm:col-span-2"
          >
            <TextArea id="instructions" value={v.instructions} onChange={(e) => setV({ ...v, instructions: e.target.value })} />
          </Field>
          <Field
            label="Seuil du rappel « paiement par virement » (€)"
            htmlFor="noticeThreshold"
            hint="Au-delà de ce montant, un message demande au client d'accepter le paiement par virement avant de valider. 0 = jamais."
            className="sm:col-span-2"
          >
            <TextInput id="noticeThreshold" type="number" step="0.01" min="0" value={noticeThreshold} onChange={(e) => setNoticeThreshold(e.target.value)} />
          </Field>
        </div>
        <SaveBar saving={saving} status={status} />
      </Card>
    </form>
  );
}
