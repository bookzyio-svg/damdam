import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email/send";
import { isAuthorizedCron, cronUnauthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Relance des commandes non payées (§12 + règle métier) :
 *   → tant que la commande est en `pending_payment`, le client reçoit
 *     AU MOINS UN EMAIL PAR JOUR PENDANT 14 JOURS, avec l'IBAN, le montant et
 *     la référence. Dès que l'admin confirme le paiement (statut ≠
 *     pending_payment), les relances s'arrêtent automatiquement.
 *   → après 14 relances, la commande est annulée et le stock relâché.
 *
 * À planifier toutes les heures (cron-job.org / vercel.json) :
 *   Authorization: Bearer ${CRON_SECRET}
 */
const MAX_REMINDERS = 14;
const MIN_HOURS_BETWEEN = 20; // ~1 fois par jour, robuste aux exécutions horaires

async function handle(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized();

  await connectDB();
  const now = Date.now();
  const settings = (await getSettings()).toObject();

  const orders = await Order.find({ status: "pending_payment" }).limit(500);

  let remindersSent = 0;
  let cancelled = 0;

  for (const order of orders) {
    const reminders = (order.emailsSent ?? []).filter((e) => e.type === "unpaid-reminder");
    const count = reminders.length;

    // 14 relances atteintes → annulation + libération du stock réservé
    if (count >= MAX_REMINDERS) {
      await releaseStock(order);
      order.status = "cancelled";
      order.statusHistory.push({
        status: "cancelled",
        note: "Annulation automatique : virement non reçu après 14 jours de relance.",
        at: new Date(),
      });
      await order.save();
      cancelled += 1;
      continue;
    }

    // Cadence ~quotidienne : on se base sur la dernière relance (ou la création)
    const lastAt = reminders.length
      ? new Date(reminders[reminders.length - 1].at as Date).getTime()
      : new Date(order.createdAt as Date).getTime();
    const hoursSinceLast = (now - lastAt) / 3_600_000;
    if (hoursSinceLast < MIN_HOURS_BETWEEN) continue;

    const sent = await sendEmail({
      to: order.customer?.email ?? "",
      template: "unpaid-reminder",
      data: { order: order.toObject(), settings, dayIndex: count + 1 },
    });
    if (sent.ok || sent.skipped) {
      order.emailsSent.push({ type: "unpaid-reminder", at: new Date() });
      await order.save();
      if (sent.ok) remindersSent += 1;
    }
  }

  return Response.json({
    ok: true,
    processed: orders.length,
    remindersSent,
    cancelled,
  });
}

/** Relâche le stock réservé d'une commande (produits à stock suivi). */
async function releaseStock(order: {
  items?: { productId?: unknown; variantTitle?: string | null; quantity?: number | null }[];
}) {
  for (const item of order.items ?? []) {
    if (!item.productId || !item.quantity) continue;
    const product = await Product.findById(item.productId).select("trackStock");
    if (!product?.trackStock) continue;
    if (item.variantTitle) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { "variants.$[v].stock": item.quantity } },
        { arrayFilters: [{ "v.title": item.variantTitle }] },
      ).catch(() => {});
    } else {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
      ).catch(() => {});
    }
  }
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
