import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getSettings } from "@/lib/settings";
import { getDeliverySteps, nextAdvanceAt, stepKeyToOrderStatus } from "@/lib/delivery";
import { isAuthorizedCron, cronUnauthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

const FINAL = ["delivered", "cancelled", "refunded"];

/**
 * Cron /api/cron/delivery-advance (§8) — avancement AUTOMATIQUE sur timer.
 * Pour chaque commande dont `delivery.nextAutoAdvanceAt <= now` (et si
 * `Settings.delivery.autoAdvance`), passe à l'étape suivante, ajoute l'entrée
 * de timeline (notified:false) et recalcule `nextAutoAdvanceAt`.
 *
 * À planifier toutes les ~10 min (Authorization: Bearer ${CRON_SECRET}).
 */
async function handle(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized();

  await connectDB();
  const settings = await getSettings();
  if (!settings.delivery?.autoAdvance) {
    return Response.json({ ok: true, skipped: "autoAdvance désactivé", advanced: 0 });
  }

  const steps = getDeliverySteps(settings.toObject());
  const now = new Date();

  const filter: Record<string, unknown> = {
    "delivery.nextAutoAdvanceAt": { $lte: now },
    status: { $nin: FINAL },
  };
  const orders = await Order.find(filter).limit(500);

  let advanced = 0;

  for (const order of orders) {
    if (!order.delivery) continue;
    const idx = steps.findIndex((s) => s.key === order.delivery!.currentStepKey);
    const nextIdx = idx + 1;

    // Plus d'étape suivante → on arrête l'avancement auto
    if (idx === -1 || nextIdx >= steps.length) {
      order.set("delivery.nextAutoAdvanceAt", undefined);
      await order.save();
      continue;
    }

    const step = steps[nextIdx];
    order.delivery.timeline.push({
      stepKey: step.key,
      label: step.label,
      location: order.delivery.currentLocation,
      note: step.description,
      at: now,
      notified: step.notifyCustomer === false, // false => pas de notif pour cette étape
    });
    order.set("delivery.currentStepKey", step.key);
    order.set("delivery.nextAutoAdvanceAt", nextAdvanceAt(steps, nextIdx, now));

    const mapped = stepKeyToOrderStatus(step.key);
    if (mapped && mapped !== order.status) {
      order.status = mapped;
      order.statusHistory.push({ status: mapped, note: `Avancement automatique : ${step.label}`, at: now });
    }

    await order.save();
    advanced += 1;
  }

  return Response.json({ ok: true, processed: orders.length, advanced });
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
