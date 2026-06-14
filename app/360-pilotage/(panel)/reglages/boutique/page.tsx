import { getSettingsPlain } from "@/lib/settings";
import StoreForm from "./StoreForm";

export const dynamic = "force-dynamic";

export default async function BoutiqueSettingsPage() {
  const settings = await getSettingsPlain();
  return <StoreForm initial={(settings.store as never) ?? {}} />;
}
