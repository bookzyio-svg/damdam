import { getSettingsPlain } from "@/lib/settings";
import ShippingForm from "./ShippingForm";
import DeliveryStepsForm from "./DeliveryStepsForm";

export const dynamic = "force-dynamic";

export default async function LivraisonSettingsPage() {
  const settings = await getSettingsPlain();
  const delivery = (settings.delivery as { autoAdvance?: boolean }) ?? {};
  return (
    <div className="space-y-6">
      <ShippingForm initial={(settings.shipping as never) ?? {}} />
      <DeliveryStepsForm
        initialSteps={(settings.deliverySteps as never) ?? []}
        initialAutoAdvance={delivery.autoAdvance ?? true}
      />
    </div>
  );
}
