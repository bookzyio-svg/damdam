import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getSettings } from "@/lib/settings";
import { getDeliverySteps } from "@/lib/delivery";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { deliveryNumber: string } };

/**
 * GET /api/suivi/[deliveryNumber] — suivi PUBLIC d'une livraison (sans PII
 * sensible). Sert le polling temps réel (SWR) de la page /suivi.
 */
export async function GET(_req: Request, { params }: Ctx) {
  await connectDB();
  const order = await Order.findOne({ "delivery.deliveryNumber": params.deliveryNumber })
    .select("orderNumber status delivery customer shippingAddress")
    .lean();

  if (!order) {
    return Response.json({ found: false }, { status: 404 });
  }

  const settings = await getSettings();
  const steps = getDeliverySteps(settings.toObject()).map((s) => ({
    key: s.key,
    label: s.label,
    description: s.description ?? "",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delivery: any = order.delivery ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr: any = order.shippingAddress ?? {};
  return Response.json({
    found: true,
    tracking: serialize({
      orderNumber: order.orderNumber,
      firstName: (order.customer?.name ?? "").split(" ")[0] ?? "",
      status: order.status,
      steps,
      currentStepKey: delivery.currentStepKey,
      estimatedDelivery: delivery.estimatedDelivery,
      driver: delivery.driver,
      currentLocation: delivery.currentLocation,
      timeline: delivery.timeline ?? [],
      // Destinataire — affiché sur la dernière étape (« livré à cette adresse »)
      recipient: {
        name: order.customer?.name ?? "",
        email: order.customer?.email ?? "",
        phone: addr.phone || order.customer?.phone || "",
        address: {
          line1: addr.line1 ?? "",
          line2: addr.line2 ?? "",
          postalCode: addr.postalCode ?? "",
          city: addr.city ?? "",
          country: addr.country ?? "",
        },
      },
    }),
  });
}
