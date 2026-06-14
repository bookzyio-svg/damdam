import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";
import { getDeliverySteps, nextAdvanceAt, stepKeyToOrderStatus } from "@/lib/delivery";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const bodySchema = z.object({
  stepKey: z.string().optional(),
  location: z
    .object({ label: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() })
    .optional(),
  estimatedDelivery: z.string().nullable().optional(),
  driver: z.object({ name: z.string().optional(), phone: z.string().optional() }).optional(),
  note: z.string().max(500).optional(),
  notifyCustomer: z.boolean().optional().default(true),
});

/**
 * PATCH /api/orders/[id]/delivery (§8) — override MANUEL du transporteur maison :
 * forcer une étape, corriger la localisation (label + lat/lng), modifier l'ETA et
 * le livreur. L'admin reprend la main ; l'avancement auto repart de l'étape forcée.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;

  await connectDB();
  const order = await Order.findById(params.id);
  if (!order) return Response.json({ error: "Introuvable" }, { status: 404 });
  if (!order.delivery?.deliveryNumber) {
    return Response.json({ error: "Confirmez d'abord le paiement pour démarrer la livraison." }, { status: 409 });
  }

  const now = new Date();

  // Mises à jour directes (localisation, ETA, livreur)
  if (d.location) order.set("delivery.currentLocation", d.location);
  if (d.estimatedDelivery !== undefined) {
    order.set("delivery.estimatedDelivery", d.estimatedDelivery ? new Date(d.estimatedDelivery) : undefined);
  }
  if (d.driver) order.set("delivery.driver", d.driver);

  // Changement d'étape forcé
  if (d.stepKey) {
    const settings = await getSettings();
    const steps = getDeliverySteps(settings.toObject());
    const idx = steps.findIndex((s) => s.key === d.stepKey);
    if (idx === -1) {
      return Response.json({ error: "Étape inconnue" }, { status: 422 });
    }
    const step = steps[idx];

    order.delivery.timeline.push({
      stepKey: step.key,
      label: step.label,
      location: d.location ?? order.delivery.currentLocation,
      note: d.note ?? step.description,
      at: now,
      notified: d.notifyCustomer === false, // false => "déjà notifié" (on n'enverra pas)
    });
    order.set("delivery.currentStepKey", step.key);
    order.set("delivery.nextAutoAdvanceAt", nextAdvanceAt(steps, idx, now));

    const mapped = stepKeyToOrderStatus(step.key);
    if (mapped && mapped !== order.status) {
      order.status = mapped;
      order.statusHistory.push({ status: mapped, note: `Étape forcée : ${step.label}`, at: now, by: session.user?.name || "admin" });
    }
  }

  await order.save();
  return Response.json({ ok: true, order: serialize(order.toObject()) });
}
