import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email/send";
import type { EmailTemplate } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * POST /api/orders/[id]/resend-email — renvoie l'email pertinent selon le
 * statut : instructions de virement (impayé) ou confirmation de paiement.
 */
export async function POST(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  await connectDB();
  const order = await Order.findById(params.id);
  if (!order) return Response.json({ error: "Introuvable" }, { status: 404 });

  const template: EmailTemplate =
    order.status === "pending_payment" ? "order-received" : "payment-confirmed";

  const settings = await getSettings();
  const sent = await sendEmail({
    to: order.customer?.email ?? "",
    template,
    data: { order: order.toObject(), settings: settings.toObject() },
  });

  if (sent.skipped) {
    return Response.json({ ok: false, error: "Resend non configuré (clé API manquante)." }, { status: 200 });
  }
  if (!sent.ok) {
    return Response.json({ error: sent.error || "Échec de l'envoi" }, { status: 502 });
  }

  order.emailsSent.push({ type: `resend:${template}`, at: new Date() });
  await order.save();

  return Response.json({ ok: true, template });
}
