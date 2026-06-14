import { getSettingsPlain } from "@/lib/settings";
import LegalForm from "./LegalForm";

export const dynamic = "force-dynamic";

export default async function LegalSettingsPage() {
  const settings = await getSettingsPlain();
  return <LegalForm initial={(settings.legal as never) ?? {}} />;
}
