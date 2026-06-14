import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { confirmOrderPayment } from "@/lib/orders";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * POST /api/orders/[id]/confirm-payment (§8) — l'admin confirme la réception du
 * virement. Arrête définitivement les relances et démarre la livraison maison.
 */
export async function POST(_req: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  await connectDB();
  const order = await Order.findById(params.id);
  if (!order) return Response.json({ error: "Introuvable" }, { status: 404 });

  if (order.status !== "pending_payment") {
    return Response.json(
      { error: `Paiement déjà traité (statut actuel : ${order.status}).` },
      { status: 409 },
    );
  }

  const by = session.user?.name || session.user?.email || "admin";
  await confirmOrderPayment(order, by);

  return Response.json({ ok: true, order: serialize(order.toObject()) });
}
