import { getSettingsPlain } from "@/lib/settings";
import BankForm from "./BankForm";

export const dynamic = "force-dynamic";

export default async function PaiementSettingsPage() {
  const settings = await getSettingsPlain();
  return <BankForm initial={(settings.bank as never) ?? {}} />;
}
