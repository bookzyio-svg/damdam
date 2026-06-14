import { Customer } from "@/lib/models/Customer";
import { Product } from "@/lib/models/Product";
import { getSettings } from "@/lib/settings";
import { getDeliverySteps, buildInitialDelivery, stepKeyToOrderStatus } from "@/lib/delivery";
import { sendEmail } from "@/lib/email/send";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Confirme la réception du virement d'une commande (§8) — logique partagée
 * entre la route unitaire et l'action par lot :
 * statut `paid`, init livraison (deliveryNumber, timeline, nextAutoAdvanceAt),
 * incrément du stock vendu + totaux client, email « paiement reçu ».
 *
 * Renvoie { ok:true } si traité, { ok:false, skipped:true } si la commande
 * n'était pas en attente de paiement.
 */
export async function confirmOrderPayment(
  order: any,
  by: string,
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (order.status !== "pending_payment") return { ok: false, skipped: true };

  const now = new Date();
  const settings = await getSettings();
  const steps = getDeliverySteps(settings.toObject());

  order.paymentConfirmedAt = now;
  order.paymentConfirmedBy = by;

  const delivery = buildInitialDelivery(steps, now);
  order.set("delivery", delivery);

  // Le paiement est confirmé → on démarre directement la préparation
  const startStatus = stepKeyToOrderStatus(delivery.currentStepKey) ?? "paid";
  order.status = startStatus;
  order.statusHistory.push({ status: "paid", note: "Virement confirmé par l'administrateur", at: now, by });
  if (startStatus !== "paid") {
    order.statusHistory.push({ status: startStatus, note: "Préparation lancée", at: now, by });
  }
  await order.save();

  // Stock vendu (best effort)
  await Promise.all(
    (order.items ?? []).map((it: any) =>
      it.productId
        ? Product.updateOne({ _id: it.productId }, { $inc: { soldCount: it.quantity ?? 0 } }).catch(() => {})
        : Promise.resolve(),
    ),
  );

  // Totaux client
  if (order.customerId) {
    await Customer.updateOne(
      { _id: order.customerId },
      { $inc: { totalOrders: 1, totalSpent: order.total ?? 0 } },
    ).catch(() => {});
  }

  // Email « paiement confirmé » + lien de suivi
  const sent = await sendEmail({
    to: order.customer?.email ?? "",
    template: "payment-confirmed",
    data: { order: order.toObject(), settings: settings.toObject() },
  });
  if (sent.ok) {
    order.emailsSent.push({ type: "payment-confirmed", at: new Date() });
    await order.save();
  }

  return { ok: true };
}
