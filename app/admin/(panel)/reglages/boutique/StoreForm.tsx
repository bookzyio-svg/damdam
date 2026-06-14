"use client";

import { useState } from "react";
import { Card, Field, TextInput, SaveBar } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettingsForm";

type Store = {
  name?: string;
  slogan?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
};

export default function StoreForm({ initial }: { initial: Store }) {
  const { saving, status, submit } = useSettingsForm("store");
  const [v, setV] = useState<Store>({
    name: initial.name ?? "",
    slogan: initial.slogan ?? "",
    logoUrl: initial.logoUrl ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    address: {
      line1: initial.address?.line1 ?? "",
      line2: initial.address?.line2 ?? "",
      city: initial.address?.city ?? "",
      postalCode: initial.address?.postalCode ?? "",
      country: initial.address?.country ?? "France",
    },
  });

  const setAddr = (k: keyof NonNullable<Store["address"]>, val: string) =>
    setV((s) => ({ ...s, address: { ...s.address, [k]: val } }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(v);
      }}
    >
      <Card title="Identité de la boutique" description="Affichée sur le site et dans les emails.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" htmlFor="name">
            <TextInput id="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </Field>
          <Field label="Slogan" htmlFor="slogan">
            <TextInput id="slogan" value={v.slogan} onChange={(e) => setV({ ...v, slogan: e.target.value })} />
          </Field>
          <Field label="Logo (URL)" htmlFor="logoUrl" className="sm:col-span-2">
            <TextInput id="logoUrl" placeholder="https://…" value={v.logoUrl} onChange={(e) => setV({ ...v, logoUrl: e.target.value })} />
          </Field>
          <Field label="Email de contact" htmlFor="email">
            <TextInput id="email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </Field>
          <Field label="Téléphone" htmlFor="phone">
            <TextInput id="phone" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
          </Field>
        </div>
      </Card>

      <div className="mt-6">
        <Card title="Adresse" description="Siège / expéditeur (mentions légales).">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Adresse" htmlFor="line1" className="sm:col-span-2">
              <TextInput id="line1" value={v.address?.line1} onChange={(e) => setAddr("line1", e.target.value)} />
            </Field>
            <Field label="Complément" htmlFor="line2" className="sm:col-span-2">
              <TextInput id="line2" value={v.address?.line2} onChange={(e) => setAddr("line2", e.target.value)} />
            </Field>
            <Field label="Code postal" htmlFor="postalCode">
              <TextInput id="postalCode" value={v.address?.postalCode} onChange={(e) => setAddr("postalCode", e.target.value)} />
            </Field>
            <Field label="Ville" htmlFor="city">
              <TextInput id="city" value={v.address?.city} onChange={(e) => setAddr("city", e.target.value)} />
            </Field>
            <Field label="Pays" htmlFor="country">
              <TextInput id="country" value={v.address?.country} onChange={(e) => setAddr("country", e.target.value)} />
            </Field>
          </div>
          <SaveBar saving={saving} status={status} />
        </Card>
      </div>
    </form>
  );
}
