import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import LegalContent from "@/components/storefront/LegalContent";
import { MENTIONS_LEGALES } from "@/lib/company";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mentions légales" };

export default async function MentionsLegalesPage() {
  const settings = await getSettings();
  return (
    <LegalContent
      title="Mentions légales"
      content={settings.legal?.mentions?.trim() || MENTIONS_LEGALES}
      fallback={MENTIONS_LEGALES}
    />
  );
}
