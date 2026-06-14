import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import LegalContent from "@/components/storefront/LegalContent";
import { CGV } from "@/lib/company";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conditions générales de vente" };

export default async function CgvPage() {
  const settings = await getSettings();
  return (
    <LegalContent
      title="Conditions générales de vente"
      content={settings.legal?.cgv?.trim() || CGV}
      fallback={CGV}
    />
  );
}
