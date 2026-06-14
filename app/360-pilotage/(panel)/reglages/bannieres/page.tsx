import { getSettingsPlain } from "@/lib/settings";
import BannersForm from "./BannersForm";

export const dynamic = "force-dynamic";

export default async function BannieresSettingsPage() {
  const settings = await getSettingsPlain();
  return <BannersForm initial={(settings.homeBanners as never) ?? []} />;
}
