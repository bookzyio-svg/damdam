import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import LegalContent from "@/components/storefront/LegalContent";
import { CONFIDENTIALITE } from "@/lib/company";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Politique de confidentialité" };

export default async function ConfidentialitePage() {
  const settings = await getSettings();
  return (
    <LegalContent
      title="Politique de confidentialité (RGPD)"
      content={settings.legal?.confidentialite?.trim() || CONFIDENTIALITE}
      fallback={CONFIDENTIALITE}
    />
  );
}
