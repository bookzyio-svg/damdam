import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { releaseOrderStock } from "@/lib/stock";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const bodySchema = z.object({
  refund: z.boolean().optional().default(false),
  reason: z.string().max(500).optional().default(""),
});

const NON_CANCELLABLE = ["delivered", "cancelled", "refunded"];

/**
 * POST /api/orders/[id]/cancel — annule (ou rembourse) une commande et relâche
 * le stock réservé.
 */
export async function POST(req: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const json = await req.json().catch(() => ({}));
  const { refund, reason } = bodySchema.parse(json ?? {});

  await connectDB();
  const order = await Order.findById(params.id);
  if (!order) return Response.json({ error: "Introuvable" }, { status: 404 });

  if (NON_CANCELLABLE.includes(order.status)) {
    return Response.json(
      { error: `Impossible : commande déjà ${order.status}.` },
      { status: 409 },
    );
  }

  await releaseOrderStock(order.items);

  const newStatus = refund ? "refunded" : "cancelled";
  order.status = newStatus;
  order.statusHistory.push({
    status: newStatus,
    note: reason || (refund ? "Remboursement" : "Annulation") + " par l'administrateur",
    at: new Date(),
    by: session.user?.name || session.user?.email || "admin",
  });
  await order.save();

  return Response.json({ ok: true, order: serialize(order.toObject()) });
}
