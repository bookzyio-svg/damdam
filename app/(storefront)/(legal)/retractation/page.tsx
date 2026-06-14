import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import LegalContent from "@/components/storefront/LegalContent";
import { RETRACTATION } from "@/lib/company";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Droit de rétractation" };

export default async function RetractationPage() {
  const settings = await getSettings();
  return (
    <LegalContent
      title="Droit de rétractation (14 jours)"
      content={settings.legal?.retractation?.trim() || RETRACTATION}
      fallback={RETRACTATION}
    />
  );
}
