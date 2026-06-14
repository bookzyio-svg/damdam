import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email/send";
import { isAuthorizedCron, cronUnauthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Cron /api/cron/abandoned-carts (§12) — relance les paniers abandonnés selon
 * les paliers configurés (Settings.relance.abandonedCartDelaysHours, défaut
 * [3, 24, 72] h). Un seul email par exécution et par palier non encore envoyé.
 *
 * À planifier toutes les 30 min (Authorization: Bearer ${CRON_SECRET}).
 */
async function handle(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized();

  await connectDB();
  const settings = await getSettings();
  if (!settings.relance?.enabled) {
    return Response.json({ ok: true, skipped: "relances désactivées", sent: 0 });
  }

  const delays = settings.relance.abandonedCartDelaysHours?.length
    ? settings.relance.abandonedCartDelaysHours
    : [3, 24, 72];
  const now = Date.now();

  // Paniers candidats : non convertis, avec email et articles
  const filter: Record<string, unknown> = {
    recovered: false,
    email: { $nin: [null, ""] },
    "items.0": { $exists: true },
  };
  const carts = await Cart.find(filter).limit(500);

  let sent = 0;

  for (const cart of carts) {
    if (!cart.email || !cart.lastActivityAt) continue;
    const ageHours = (now - new Date(cart.lastActivityAt).getTime()) / 3_600_000;
    const sentStages = new Set((cart.remindersSent ?? []).map((r) => r.stage));

    // Trouve le premier palier dû et non encore envoyé
    let stageToSend = -1;
    for (let i = 0; i < delays.length; i += 1) {
      if (ageHours >= delays[i] && !sentStages.has(i)) {
        stageToSend = i;
        break;
      }
    }
    if (stageToSend === -1) continue;

    const res = await sendEmail({
      to: cart.email,
      template: "abandoned-cart",
      data: {
        cart: { items: cart.items, subtotal: cart.subtotal },
        settings: settings.toObject(),
      },
    });

    if (res.ok || res.skipped) {
      cart.remindersSent.push({ stage: stageToSend, at: new Date() });
      await cart.save();
      if (res.ok) sent += 1;
    }
  }

  return Response.json({ ok: true, processed: carts.length, sent });
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
