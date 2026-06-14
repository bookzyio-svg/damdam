import { getSettingsPlain } from "@/lib/settings";
import RelanceForm from "./RelanceForm";

export const dynamic = "force-dynamic";

export default async function RelancesSettingsPage() {
  const settings = await getSettingsPlain();
  return <RelanceForm initial={(settings.relance as never) ?? {}} />;
}
