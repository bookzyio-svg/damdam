import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email/send";
import { stepKeyToOrderStatus } from "@/lib/delivery";
import { isAuthorizedCron, cronUnauthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Cron /api/cron/delivery-notify (§8) — envoie les notifications des entrées de
 * timeline `notified:false` (par email ; WhatsApp en phase 2) avec le lien de
 * suivi. Marque l'entrée comme notifiée une fois l'envoi accepté.
 *
 * À planifier toutes les ~10 min (Authorization: Bearer ${CRON_SECRET}).
 */
async function handle(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized();

  await connectDB();
  const settings = (await getSettings()).toObject();

  const filter: Record<string, unknown> = {
    "delivery.timeline.notified": false,
    status: { $nin: ["cancelled", "refunded"] },
  };
  const orders = await Order.find(filter).limit(300);

  let notified = 0;

  for (const order of orders) {
    let changed = false;

    for (const entry of order.delivery?.timeline ?? []) {
      if (entry.notified) continue;

      const delivered = stepKeyToOrderStatus(entry.stepKey ?? "") === "delivered";
      const sent = await sendEmail({
        to: order.customer?.email ?? "",
        template: delivered ? "order-delivered" : "delivery-update",
        data: {
          order: order.toObject(),
          settings,
          step: { label: entry.label, note: entry.note, location: entry.location },
        },
      });

      // On marque comme notifié si l'envoi a réussi (ou si Resend n'est pas
      // configuré, pour ne pas boucler indéfiniment en dev).
      if (sent.ok || sent.skipped) {
        entry.notified = true;
        changed = true;
        if (sent.ok) notified += 1;
        order.emailsSent.push({ type: delivered ? "order-delivered" : "delivery-update", at: new Date() });
      }
    }

    if (changed) await order.save();
  }

  return Response.json({ ok: true, processed: orders.length, notified });
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
