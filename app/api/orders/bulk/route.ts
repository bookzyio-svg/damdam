import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { confirmOrderPayment } from "@/lib/orders";
import { releaseOrderStock } from "@/lib/stock";

export const dynamic = "force-dynamic";

const objectId = /^[0-9a-fA-F]{24}$/;

const bodySchema = z.object({
  ids: z.array(z.string().regex(objectId)).min(1).max(200),
  action: z.enum(["confirm-payment", "cancel", "refund"]),
});

const NON_CANCELLABLE = ["delivered", "cancelled", "refunded"];

/**
 * POST /api/orders/bulk — actions par lot sur les commandes (admin) :
 *  - "confirm-payment" : confirme le virement de chaque commande en attente
 *  - "cancel" / "refund" : annule/rembourse + relâche le stock
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { ids, action } = parsed.data;
  const by = session.user?.name || session.user?.email || "admin";

  await connectDB();
  const orders = await Order.find({ _id: { $in: ids } });

  let processed = 0;
  let skipped = 0;

  for (const order of orders) {
    if (action === "confirm-payment") {
      const res = await confirmOrderPayment(order, by);
      if (res.ok) processed += 1;
      else skipped += 1;
    } else {
      // cancel / refund
      if (NON_CANCELLABLE.includes(order.status)) {
        skipped += 1;
        continue;
      }
      await releaseOrderStock(order.items);
      const newStatus = action === "refund" ? "refunded" : "cancelled";
      order.status = newStatus;
      order.statusHistory.push({
        status: newStatus,
        note: `${action === "refund" ? "Remboursement" : "Annulation"} par lot`,
        at: new Date(),
        by,
      });
      await order.save();
      processed += 1;
    }
  }

  return Response.json({ ok: true, processed, skipped });
}
